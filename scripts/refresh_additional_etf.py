"""Independent exact-share refresh; invalid sources preserve their previous active values."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import json
import os
import pathlib
from data_automation import UTC,write_json_atomic
from apply_etf_collection import merge_collection
from collect_dws_etf import collect_one as dws
from collect_vanguard_etf import collect_one as vanguard
from collect_vaneck_etf import collect_one as vaneck
from collect_invesco_etf import collect_one as invesco
from collect_amundi_index_exposure import collect_one as amundi_index

ROOT=pathlib.Path(__file__).resolve().parents[1]


def format_source_attempt(attempt):
    """Render diagnostics without changing their producer-specific schema.

    Document collectors use url/reason; WisdomTree public routes use
    sourceUrl/error. Retry receipts can carry only attempt/status/sha256.
    Missing provenance stays explicit, never borrowed from the retained source.
    """
    if not isinstance(attempt, dict):
        return 'Tentative invalide : ' + json.dumps(attempt, ensure_ascii=False)
    urls = list(dict.fromkeys(str(attempt[key]) for key in ('url', 'sourceUrl') if attempt.get(key)))
    source = ' / '.join(urls) if urls else 'URL non renseignée'
    details = [str(attempt[key]) for key in ('status', 'reason', 'error') if attempt.get(key)]
    metadata = {key: value for key, value in attempt.items()
                if key not in ('url', 'sourceUrl', 'status', 'reason', 'error')}
    if metadata:
        details.append(json.dumps(metadata, ensure_ascii=False, sort_keys=True))
    return source + ': ' + (' — '.join(details) if details else 'détail non renseigné')


def source_attempts_text(observation):
    source = observation.get('sourceUrl') or 'URL non renseignée'
    attempts = ' ; '.join(format_source_attempt(a) for a in observation['sourceAttempts'])
    return f"Tentatives de sources pour {observation['isin']} (source retenue : {source}) : {attempts}"


def collect_one(share,now):
    if share['parser'] in ('globalx-priority', 'avantis-priority'):
        from collect_priority_issuer_etf import collect_one as priority
        return priority(share, now)
    if share['parser'] in ('globalx-physical', 'jpm-document'):
        from collect_presentation_etf import collect_one as presentation
        return presentation(share, now)
    if share['parser'] == 'bnp-document':
        from collect_bnp_etf import collect_one as bnp
        return bnp(share, now)
    if share['parser'] in ('coinshares-document', 'ubs-document'):
        from collect_remaining_documents import collect_one as remaining_document
        return remaining_document(share, now)
    if share['parser']=='lg-api':
        from collect_lg_api import collect_one as lg_api
        return lg_api(share, now)
    if share['parser'] in ('wisdomtree-html', 'globalx-html', 'bitwise-html'):
        from collect_public_issuer import collect_one as public_issuer
        return public_issuer(share, now)
    if share['parser']=='ishares-legacy':
        from collect_document_etf import collect_legacy
        return collect_legacy(share,now)
    if share['parser']=='document':
        from collect_document_etf import collect_one as document
        return document(share,now)
    if share['parser']=='ishares':
        from collect_etf_pilot import collect
        report=collect({'instruments':[share]}, {share['isin']:{}}, now)
        if report.get('failures'):raise ValueError(report['failures'][0]['reason'])
        result = report['shares'][0]
        from collect_commodity_allocations import add_allocation
        return add_allocation(result, share, now)
    if share['parser']=='ssga':
        from collect_ssga_etf import collect
        return collect({'instruments':[share]},now)['shares'][0]
    if share['parser']=='dws':
        return dws(share, now)
    return {'vanguard':vanguard,'vaneck':vaneck,'invesco':invesco,'amundi-index':amundi_index}[share['parser']](share,now)


def bnp_document_evidence(result, published):
    """Expose the PDF checks independently of previously published fields."""
    aum = result['aum']
    return {
        'sourceUrl': aum['sourceUrl'],
        'sha256': aum['sha256'],
        'asOf': aum['asOf'],
        'referenceDate': aum['documentAdvertisedAsOf'],
        'publicationDate': aum['documentPublicationDate'],
        'aum': {key: aum[key] for key in ('amount', 'currency', 'scope')},
        'terPct': result['characteristics']['terPct'],
        'basis': {field: result[field]['basis'] for field in ('holdings', 'sectors', 'performance')
                  if field in result},
        'publishedCountries': {key: published['countries'][key] for key in ('asOf', 'sourceUrl', 'basis')
                               if key in published.get('countries', {})},
    }


def refresh(config,current,baseline,now=None,collect=collect_one):
    now=now or dt.datetime.now(UTC)
    def one(share):
        result = None
        try:
            result=collect(share,now)
            for field in share.get('requiredFields', []):
                observation = result.get(field, {})
                if not observation or (field in ('countries', 'sectors', 'holdings') and not observation.get('rows')):
                    raise ValueError('Required automated ETF field missing: ' + field)
            if share.get('requiredFields') and result.get('unavailable'):
                raise ValueError('Incomplete newly qualified ETF: ' + '; '.join(result['unavailable']))
            if result.get('performance')and baseline.get(share['isin'],{}).get('currency')not in (None,result['performance']['currency']):
                result.setdefault('unavailable',[]).append('performance: existing simulation currency differs; history preserved')
                result.pop('performance')
            merged=merge_collection({'checkedAt':now.isoformat(),'shares':[result]},current,baseline)
            record = merged[share['isin']]
            observation = {'isin':share['isin'],'provider':share['provider'],'status':'validated','record':record,
                           'unavailable':result.get('unavailable',[]),'sourceUrl':result.get('sourceUrl'),
                           'collectionErrors':result.get('collectionErrors',[]),
                           'sourceAttempts':result.get('sourceAttempts',[])}
            if share.get('parser') == 'bnp-document':
                observation['bnpDocument'] = bnp_document_evidence(result, record)
            return observation
        except Exception as error:
            return {'isin':share['isin'],'provider':share['provider'],'status':'failed','reason':str(error),
                    'sourceUrl':share.get('sourceUrl',share.get('pageUrl')),
                    **({'proposedObservation': result} if result is not None else {})}
    with ThreadPoolExecutor(max_workers=4)as pool:observations=list(pool.map(one,[s for s in config['instruments'] if s.get('enabled', True)]))
    merged=dict(current)
    for o in observations:
        if o['status']=='validated':merged[o['isin']]=o['record']
    return merged,{'checkedAt':now.isoformat(),'shares':observations,'notQualified':[s['isin'] for s in config['instruments'] if not s.get('enabled', True)]}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--baseline',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path);p.add_argument('--apply',action='store_true');args=p.parse_args()
    config=json.loads((ROOT/'scripts/additional-etf-sources.json').read_text());path=ROOT/'src/data/automated-etf.json'
    merged,report=refresh(config,json.loads(path.read_text()),json.loads(args.baseline.read_text()))
    write_json_atomic(args.output,report)
    if args.apply and merged!=json.loads(path.read_text()):write_json_atomic(path,merged)
    print(f"ETF extension: {sum(o['status']=='validated'for o in report['shares'])}/{len(report['shares'])} shares validated; all exceptions recorded.")
    bnp_isins = {share['isin'] for share in config['instruments'] if share.get('parser') == 'bnp-document'}
    for observation in report['shares']:
        if observation['isin'] in bnp_isins:
            status = observation['status']
            if observation.get('collectionErrors'):
                status = 'partial'
            details = observation.get('bnpDocument') or {'reason': observation.get('reason')}
            print(f"BNP {observation['isin']} — {status} — {json.dumps(details, ensure_ascii=False, sort_keys=True)}")
        if observation.get('sourceAttempts'):
            print(source_attempts_text(observation))
        if observation['status'] == 'failed':
            print(f"Source failed: {observation['isin']} — {observation['reason']}")
        for error in observation.get('collectionErrors', []):
            print(f"Source field failed: {observation['isin']} {error['field']} — {error['reason']}")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a')as h:
            h.write('\n## Extensions ETF et expositions synthétiques\n\n| Part | Source | État | Limites |\n|---|---|---|---|\n')
            h.write('Hors automatisation : '+', '.join(report['notQualified'])+'\n\n')
            for o in report['shares']:
                h.write(f"| {o['isin']} | {o['provider']} | {o['status']} | {o.get('reason',' ; '.join(o.get('unavailable',[]) + [e['field']+': '+e['reason'] for e in o.get('collectionErrors',[])]))} |\n")
            for o in report['shares']:
                if o.get('sourceAttempts'):
                    h.write('\n' + source_attempts_text(o) + '\n\n')
    # Every enabled connector belongs to active coverage. A transport/parser
    # failure must reach the workflow signal, including recently added sources.
    # Valid records were applied above; missing published fields are not failures.
    if any(o['status']=='failed' or o.get('collectionErrors') for o in report['shares']):
        raise SystemExit(1)


if __name__=='__main__':__import__('producer_report_contract').run('refresh_additional_etf', main)
