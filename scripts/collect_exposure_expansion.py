"""Daily exact-share refresh for the configured exposure references.

Only dated, validated issuer observations enter the shared catalogue. A failed
refresh preserves previous evidence and produces a failed workflow signal.
"""
import argparse
import datetime as dt
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from data_automation import UTC, write_json_atomic
from apply_etf_collection import merge_collection
from refresh_additional_etf import collect_one as existing_collect
from issuer_documents import validated_rows

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'scripts/exposure-etf-expansion.json'
OUTPUT = ROOT / 'src/data/exposure-etf-expansion-records.json'


def collect_amundi(share, now):
    from collect_amundi_etf import request_payload, fetch_api, parse_product, breakdown
    payload = request_payload([share], now)
    payload['characteristics'].append('INDEX_BREAKDOWNS_AS_OF_DATE')
    payload['breakDown']['aggregationFields'] += ['INDEX_COUNTRIES', 'INDEX_SECTORS', 'INDEX_TOP10']
    products = fetch_api(payload)['products']
    if len(products) != 1 or products[0]['productId'] != share['isin']:
        raise ValueError('Amundi exact share missing')
    product = products[0]; facts = product['characteristics']
    config = {**share, 'replication': share.get('replication', facts['FUND_REPLICATION_METHODOLOGY'])}
    if share.get('expectedIndex') and facts['BENCHMARK_NAME'] != share['expectedIndex']:
        raise ValueError('Amundi benchmark changed')
    result = parse_product(product, config, now)
    if config['replication'] == 'Indirect(Swap Based)' and share['isin'] != 'FR0013346681':
        from collect_amundi_index_exposure import collect_one
        extra = collect_one({**share, 'expectedIndex': facts['BENCHMARK_NAME']}, now)
        result.update({f: extra[f] for f in ('countries', 'sectors', 'holdings')})
    result.setdefault('characteristics', {}).update(terPct=result['terPct'],index=result['index'],
        distribution=result['distribution'],replicationMethod=config['replication'])
    if share['isin'] == 'FR0013346681':
        # A money-market swap must never expose its collateral as equities.
        if 'STR' not in facts['BENCHMARK_NAME'].upper():
            raise ValueError('PEA short-term benchmark changed')
        for field in ('countries','sectors','holdings'): result.pop(field, None)
    return result


def collect(share, now):
    if share['isin']=='DE0002635307':
        from collect_ishares_german import collect as german
        return german(share,now)
    if share['parser'] == 'amundi-expansion':
        return collect_amundi(share, now)
    if share['parser'] == 'globalx-expansion':
        from collect_presentation_etf import globalx_physical
        from issuer_documents import public_page
        return globalx_physical(public_page(share['sourceUrl']), share, now)
    if share['parser'] == 'invesco-expansion':
        from collect_invesco_etf import parse_document
        from collect_invesco_allocations import collect_allocations
        from issuer_documents import download
        body = download(share['sourceUrl'])
        result = parse_document(body, share, now)
        result.update(collect_allocations(body, share, now))
        result['unavailable'] = []
        return result
    result = existing_collect(share, now)
    if share['isin'] == 'LU2903252349':
        # Hybrid holdings mix direct investments and swap collateral. Use only
        # the independently published composition of its exact tracked index.
        if result.get('index') != 'MSCI ACWI Index' or result.get('replication') != 'Hybrid Replication':
            raise ValueError('Scalable ACWI benchmark or replication changed')
        from collect_index_documents import msci_composition, SECTOR_LABELS, COUNTRY_LABELS
        from issuer_documents import download, pdf_text, proof
        config = next(c for c in json.loads((ROOT/'scripts/index-automation.json').read_text())['indices'] if c['id']=='acwi')
        body=download(config['sourceUrl'])
        facts=msci_composition(pdf_text(body),config,now)
        translations={'countries':{v:k for k,v in COUNTRY_LABELS.items()},'sectors':{v:k for k,v in SECTOR_LABELS.items()}}
        for field in ('countries','sectors','holdings'):
            result[field]={'asOf':facts['asOf'],'basis':'index','sourceUrl':config['sourceUrl'],
                'sha256':proof(body),'index':'MSCI ACWI',
                'method':'Published composition of the exact tracked MSCI ACWI index, excluding hybrid fund collateral',
                'rows':[{'name':translations.get(field,{}).get(n,n),'weightPct':w} for n,w in facts[field]]}
    return result


def qualify(result, share):
    if result.get('isin') != share['isin']:
        raise ValueError('Collector returned another ISIN')
    if share['isin'] == 'FR0013346681': return
    for field in ('countries', 'sectors'):
        value = result.get(field)
        if not value or not value.get('asOf'):
            raise ValueError('Missing dated exposure: ' + field)
        validated_rows(value['rows'])


def qualify_refresh(result, share, previous, now):
    retained = []
    candidate = result
    # The official PDF publishes only ten countries. Preserve independently
    # sourced full HTML countries with their original dates; never re-date them.
    if (share.get('parser') == 'wisdomtree-html' and not result.get('countries')
            and any(item.startswith('countries: PDF publishes only ten countries;')
                    for item in result.get('unavailable', []))):
        countries = previous.get('countries', {})
        age = (now.date() - dt.date.fromisoformat(countries.get('asOf', '1900-01-01'))).days
        if not 0 <= age <= 90 or not countries.get('sourceUrl') or not countries.get('sha256'):
            raise ValueError('Complete WisdomTree country observation unavailable or older than 90 days')
        candidate = {**result, 'countries': countries}
        retained.append({'field': 'countries', 'asOf': countries['asOf'],
                         'reason': 'Official PDF publishes only top ten; complete HTML observation preserved'})
    qualify(candidate, share)
    return retained


def fund_siblings(share, config, fund_aum):
    """Fund AUM from other share classes declared as the same fund.

    Only an explicit shared `fund` key in the configuration links two shares
    (e.g. Xtrackers MSCI World 1C/1D); an identical amount published by an
    unrelated share never corroborates a stored-value correction.
    """
    fund = share.get('fund')
    if not fund:
        return []
    related = {s['isin'] for s in config if s.get('fund') == fund and s['isin'] != share['isin']}
    return [aum for isin, aum in fund_aum if isin in related]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--only', nargs='*')
    parser.add_argument('--report', default='/tmp/exposure-expansion-report.json')
    args=parser.parse_args()
    config=json.loads(CONFIG.read_text())['instruments']
    if args.only: config=[s for s in config if s['isin'] in args.only]
    now=dt.datetime.now(UTC)
    current=json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    def gather(share):
        try:
            result=collect(share, now)
            retained=qualify_refresh(result, share, current.get(share['isin'], {}), now)
            return share, result, retained, None
        except Exception as error:
            return share, None, [], error
    with ThreadPoolExecutor(max_workers=6) as pool:
        gathered=list(pool.map(gather,config))
    fund_aum=[(r['isin'],r['aum']) for _,r,_,e in gathered if not e and r.get('aum')]
    def one(share, result, retained, error):
        if error:
            return {'isin':share['isin'],'status':'failed','reason':str(error)}
        try:
            for field in retained:
                print(f"::warning::{share['isin']} {field['field']} retained at {field['asOf']}: {field['reason']}",flush=True)
            siblings={share['isin']:fund_siblings(share, config, fund_aum)}
            merged=merge_collection({'checkedAt': now.isoformat(), 'shares':[result]},current,{},siblings)
            return {'isin':share['isin'],'status':'validated','record':merged[share['isin']], 'retainedFields':retained, 'unavailable':result.get('unavailable',[]), 'collectionErrors':result.get('collectionErrors',[]), 'sourceAttempts':result.get('sourceAttempts',[])}
        except Exception as error:
            return {'isin':share['isin'],'status':'failed','reason':str(error)}
    report=[]
    for item in (one(*row) for row in gathered):
        report.append(item)
        print(item['isin'],item['status'],item.get('reason',''),flush=True)
    write_json_atomic(args.report,{'checkedAt':now.isoformat(),'shares':report})
    if args.apply:
        for item in report:
            if item['status']=='validated':current[item['isin']]=item['record']
        write_json_atomic(OUTPUT,current)
    if any(r['status']=='failed' for r in report):raise SystemExit(1)

if __name__=='__main__':__import__('producer_report_contract').run('collect_exposure_expansion', main)
