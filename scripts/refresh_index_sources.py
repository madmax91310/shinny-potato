"""Unattended index document refresh, independently validated by index and data type."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import copy
import datetime as dt
import json
import os
import pathlib
from data_automation import UTC, write_json_atomic
from issuer_documents import download, pdf_text, proof, document_date
from collect_index_documents import msci_composition, msci_returns, ftse_composition, ftse_returns

ROOT = pathlib.Path(__file__).resolve().parents[1]


def _collect_one(config, now, fetch=download):
    if config['parser'] in ('nasdaq-factsheet', 'amundi-index-document'):
        from collect_remaining_indices import collect_one as remaining
        return remaining(config, now, fetch)
    if config['parser'] == 'monthly-derived':
        from derive_index_returns import collect_one as derived
        result = derived(config, now)
        if config.get('collectComposition', False):
            from collect_index_extensions import collect_amundi_composition
            try:
                result['facts'] = collect_amundi_composition(config, now, fetch)
            except Exception as error:
                result['errors'].append({'field':'composition','reason':str(error)})
        return result
    if config['parser'] in ('nikkei', 'stoxx-price', 'stoxx-net', 'ssga-index', 'blackrock-index', 'metal-benchmark'):
        from collect_remaining_indices import collect_one as remaining
        return remaining(config, now, fetch)
    cache = {}
    def load(url):
        if url not in cache:
            body = fetch(url); cache[url] = (pdf_text(body), proof(body))
            if config.get('sectorScope') and url == config['sourceUrl']:
                cache['countryText'] = pdf_text(body, (295, 300))
        return cache[url]
    result = {'id': config['id'], 'name': config['name'], 'errors': [], 'unavailable': []}
    if config.get('holdingsSourceUrl'):
        try:
            from collect_russell_composition import collect_quarterly_holdings
            result['holdings'] = collect_quarterly_holdings(config, now, fetch)
        except Exception as error:
            result['errors'].append({'field':'holdings','reason':str(error),'url':config['holdingsSourceUrl']})
    if config.get('collectComposition', True):
        try:
            if config.get('compositionParser') == 'russell-printed-composition':
                from collect_russell_composition import collect as russell_composition
                facts = russell_composition(config, now, fetch)
                result['unavailable'].append('monthly holdings: individual weights absent from monthly factsheet; quarterly membership weights collected separately with their own date')
            elif config.get('compositionParser') == 'amundi-index-document':
                from collect_index_extensions import collect_amundi_composition
                facts = collect_amundi_composition(config, now, fetch)
            else:
                text, digest = load(config['sourceUrl'])
                parser = msci_composition if config['parser'] == 'msci' else ftse_composition
                facts = parser(text, config, now, country_text=cache.get('countryText')) if config.get('sectorScope') else parser(text, config, now)
                facts['source'] = {'url': config['sourceUrl'], 'checkedAt': now.date().isoformat(),
                                   'label': 'Composition officielle automatisée · ' + config['name'], 'sha256': digest}
                facts['provenance'] = config.get('identityNote', 'Publication officielle extraite automatiquement ; compositions d’indice distinctes des portefeuilles ETF.')
            if config.get('identitySourceUrl'):
                facts['source'].update(sourceUrls=[config['sourceUrl'],config['identitySourceUrl']], identityCheckedAt=config['identityCheckedAt'])
            result['facts'] = facts
        except Exception as error:
            result['errors'].append({'field':'composition','reason':str(error),'url':config['sourceUrl']})
    else:
        result['unavailable'].append(config.get('qualificationIssue', 'composition: no qualified complete source'))
    if config.get('returnSourceUrl'):
        try:
            text,digest=load(config['returnSourceUrl'])
            # The performance PDF must also be current, even if its annual table is complete.
            import re
            dates = re.findall(r'[A-Z]{3} \d{1,2}, \d{4}',text) if config['parser']=='msci' else re.findall(r'Data as at:\s*(\d+ [A-Za-z]+ \d{4})',text)
            if not dates:raise ValueError('Missing index performance snapshot date')
            stamp=document_date(dates[0],now)
            parser=msci_returns if config['parser']=='msci'else ftse_returns
            return_config = {**config, 'documentName': config['returnDocumentName']} if config.get('returnDocumentName') else config
            values=parser(text,return_config,now)
            result['returns']={'asOf':stamp,'currency':config['returnCurrency'],'variant':config['returnVariant'],
                'values':values,'periodStart':f'{min(v[0]for v in values)}-01-01','periodEnd':f'{max(v[0]for v in values)}-12-31',
                'source':{'url':config['returnSourceUrl'],'checkedAt':now.date().isoformat(),'sha256':digest,
                          'label':'Rendements calendaires officiels automatisés · '+config['name']},
                'performance':{'kind':'indice','detail':config['performanceDetail'],'date':stamp}}
            if config.get('identitySourceUrl'):
                result['returns']['source'].update(sourceUrls=[config['returnSourceUrl'],config['identitySourceUrl']], identityCheckedAt=config['identityCheckedAt'])
        except Exception as error:
            result['errors'].append({'field':'returns','reason':str(error),'url':config['returnSourceUrl']})
    return result


def validate_composition(facts, config, now):
    """Common gate for every parser, not just the ten complete-sheet selections."""
    import re
    from issuer_documents import validated_rows
    if facts.get('index') != config['name']:
        raise ValueError('Exact index composition identity mismatch')
    document_date(facts.get('asOf', ''), now)
    count = facts.get('constituents')
    if isinstance(count, bool) or not isinstance(count, int) or count <= 0:
        raise ValueError('Missing exact constituent count')
    source = facts.get('source', {})
    if not source.get('url', '').startswith('https://') or not re.fullmatch(r'[a-f0-9]{64}', source.get('sha256', '')):
        raise ValueError('Missing composition source evidence')
    for field in ['countries', 'sectors', 'holdings']:
        rows = facts.get(field, [])
        # Russell publishes monthly sectors and quarterly holdings separately.
        # Never fill a monthly snapshot with a different quarter's weights.
        if field == 'holdings' and config.get('holdingsSourceUrl') and not rows:
            continue
        if any(not isinstance(row, (list, tuple)) or len(row) != 2 or isinstance(row[1], bool)
               or not isinstance(row[1], (int, float)) for row in rows):
            raise ValueError('Invalid composition rows: ' + field)
        validated_rows([{'name': label, 'weightPct': value} for label, value in rows], complete=field != 'holdings')
        if field == 'holdings' and len(rows) > count:
            raise ValueError('More principal holdings than constituents')


def collect_one(config, now, fetch=download):
    result = _collect_one(config, now, fetch)
    if 'facts' in result:
        try:
            validate_composition(result['facts'], config, now)
        except (ValueError, TypeError, KeyError) as error:
            result.pop('facts')
            result['errors'].append({'field': 'composition', 'reason': str(error), 'url': config.get('sourceUrl', config.get('compositionSourceUrl'))})
    return result


def merge_records(current, observations):
    merged=copy.deepcopy(current)
    for observation in observations:
        record=merged.setdefault(observation['id'],{})
        for field in ['facts','returns','holdings']:
            incoming=observation.get(field)
            if not incoming:continue
            old=record.get(field)
            if old and incoming['asOf']<old['asOf']:continue
            if field=='returns' and old and (old['currency']!=incoming['currency'] or old['variant']!=incoming['variant']):
                raise ValueError('Index return method changed')
            comparable = copy.deepcopy(incoming)
            comparable.get('source', {}).pop('checkedAt', None)
            previous = copy.deepcopy(old) if old else None
            if previous: previous.get('source', {}).pop('checkedAt', None)
            if comparable == previous:
                if field == 'holdings':
                    record[field]['source']['checkedAt'] = incoming['source']['checkedAt']
                continue
            record[field]=incoming
            record.setdefault(field+'History', {}).setdefault(incoming['asOf'], copy.deepcopy(incoming))
        if not record:merged.pop(observation['id'],None)
    return merged


def validate_complete_sheet(observation, now):
    """Fail closed before storing a fully automated sheet, including its top weights."""
    import math
    if observation.get('errors'):
        raise ValueError(f"{observation['id']}: direct collection failed: {observation['errors']}")
    facts, returns = observation.get('facts', {}), observation.get('returns', {})
    if not isinstance(facts.get('constituents'), int) or isinstance(facts['constituents'], bool) or facts['constituents'] <= 0:
        raise ValueError('Missing exact constituent count')
    for field in ['countries', 'sectors', 'holdings']:
        rows = facts.get(field, [])
        if not rows or any(not label or isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 100 for label, value in rows):
            raise ValueError('Missing or invalid ' + field)
    if returns.get('variant') not in ['NET', 'GROSS', 'TOTAL'] or returns.get('performance', {}).get('kind') != 'indice':
        raise ValueError('Reinvested exact-index returns required')
    values = returns.get('values', [])
    years = [year for year, _ in values]
    if len(set(years)) != len(years) or any(not math.isfinite(value) or value <= -100 for _, value in values):
        raise ValueError('Invalid annual return observations')
    if not set(range(now.year - 5, now.year)).issubset(years):
        raise ValueError('Five latest complete calendar years required')
    for record in [facts, returns]:
        if not record.get('asOf') or not record.get('source', {}).get('sha256'):
            raise ValueError('Dated source evidence required')
        if record['source'].get('transport') == 'official-response-handoff':
            raise ValueError('Direct unattended retrieval required')


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',required=True,type=pathlib.Path);p.add_argument('--apply',action='store_true');p.add_argument('--only-derived',action='store_true')
    p.add_argument('--ids', nargs='+', help='Refresh only these configured indices')
    p.add_argument('--require-complete', action='store_true', help='Require complete direct observations before applying any selected record')
    args=p.parse_args()
    config=json.loads((ROOT/'scripts/index-automation.json').read_text());now=dt.datetime.now(UTC)
    active = [c for c in config['indices'] if c.get('enabled', True) and (not args.only_derived or c['parser']=='monthly-derived')]
    if args.ids:
        unknown = set(args.ids) - {c['id'] for c in active}
        if unknown: p.error('Unknown or disabled indices: ' + ', '.join(sorted(unknown)))
        active = [c for c in active if c['id'] in args.ids]
    if args.require_complete:
        active = [{**c, 'allowPublicHandoff': False} for c in active]
    if args.only_derived:
        active = [{**c, 'collectComposition': False} for c in active]
    with ThreadPoolExecutor(max_workers=4)as pool:observations=list(pool.map(lambda c:collect_one(c,now),active))
    qualification_errors = []
    if args.require_complete:
        for observation in observations:
            try: validate_complete_sheet(observation, now)
            except ValueError as error: qualification_errors.append(str(error))
    report={'checkedAt':now.isoformat(),'indices':observations,
            'status':'failed' if qualification_errors or any(o['errors'] for o in observations) else 'validated',
            'notQualified':[c['id'] for c in config['indices'] if not c.get('enabled', True)]}
    if qualification_errors: report['qualificationErrors'] = qualification_errors
    write_json_atomic(args.output,report)
    if qualification_errors: raise ValueError('; '.join(qualification_errors))
    if args.apply:
        path=ROOT/'src/data/automated-indices.json';old=json.loads(path.read_text())if path.exists()else{}
        merged=merge_records(old,observations)
        if old!=merged:write_json_atomic(path,merged)
    failures=sum(len(o['errors'])for o in observations)
    print(f"Indices: {sum('facts'in o for o in observations)} compositions, {sum('returns'in o for o in observations)} calendar histories; {failures} explicit exceptions.")
    for observation in observations:
        for error in observation['errors']:
            print(f"Index source failed: {observation['id']} {error['field']} — {error['reason']}")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a')as h:
            h.write('\n## Sources d’indices\n\n| Indice | Composition | Performances | Exceptions |\n|---|---|---|---|\n')
            h.write('Hors automatisation : '+', '.join(report['notQualified'])+'\n\n')
            for o in observations:h.write(f"| {o['name']} | {o.get('facts',{}).get('asOf','Conservée')} | {o.get('returns',{}).get('asOf','Conservées')} | {' ; '.join([e['reason'] for e in o['errors']] + o['unavailable'])} |\n")
    # Configured sources remain observable; only qualified sources run in production.
    if any(e['field'] in next(c for c in config['indices'] if c['id']==o['id']).get('requiredFields', []) for o in observations for e in o['errors']):raise SystemExit(1)


if __name__=='__main__':__import__('producer_report_contract').run('refresh_index_sources', main)
