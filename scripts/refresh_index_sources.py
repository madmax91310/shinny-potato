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


def collect_one(config, now, fetch=download):
    cache = {}
    def load(url):
        if url not in cache:
            body = fetch(url); cache[url] = (pdf_text(body), proof(body))
        return cache[url]
    result = {'id': config['id'], 'name': config['name'], 'errors': []}
    try:
        text, digest = load(config['sourceUrl'])
        parser = msci_composition if config['parser'] == 'msci' else ftse_composition
        facts = parser(text, config, now)
        facts['source'] = {'url': config['sourceUrl'], 'checkedAt': now.date().isoformat(),
                           'label': 'Composition officielle automatisée · ' + config['name'], 'sha256': digest}
        facts['provenance'] = 'Publication officielle extraite automatiquement ; compositions d’indice distinctes des portefeuilles ETF.'
        result['facts'] = facts
    except Exception as error:
        result['errors'].append({'field':'composition','reason':str(error),'url':config['sourceUrl']})
    if config.get('returnSourceUrl'):
        try:
            text,digest=load(config['returnSourceUrl'])
            # The performance PDF must also be current, even if its annual table is complete.
            import re
            dates = re.findall(r'[A-Z]{3} \d{1,2}, \d{4}',text) if config['parser']=='msci' else re.findall(r'Data as at:\s*(\d+ [A-Za-z]+ \d{4})',text)
            if not dates:raise ValueError('Missing index performance snapshot date')
            stamp=document_date(dates[0],now)
            parser=msci_returns if config['parser']=='msci'else ftse_returns
            values=parser(text,config,now)
            result['returns']={'asOf':stamp,'currency':config['returnCurrency'],'variant':config['returnVariant'],
                'values':values,'periodStart':f'{min(v[0]for v in values)}-01-01','periodEnd':f'{max(v[0]for v in values)}-12-31',
                'source':{'url':config['returnSourceUrl'],'checkedAt':now.date().isoformat(),'sha256':digest,
                          'label':'Rendements calendaires officiels automatisés · '+config['name']},
                'performance':{'kind':'indice','detail':config['performanceDetail'],'date':stamp}}
        except Exception as error:
            result['errors'].append({'field':'returns','reason':str(error),'url':config['returnSourceUrl']})
    return result


def merge_records(current, observations):
    merged=copy.deepcopy(current)
    for observation in observations:
        record=merged.setdefault(observation['id'],{})
        for field in ['facts','returns']:
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
            if comparable == previous: continue
            record[field]=incoming
            record.setdefault(field+'History', {}).setdefault(incoming['asOf'], copy.deepcopy(incoming))
        if not record:merged.pop(observation['id'],None)
    return merged


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',required=True,type=pathlib.Path);p.add_argument('--apply',action='store_true');args=p.parse_args()
    config=json.loads((ROOT/'scripts/index-automation.json').read_text());now=dt.datetime.now(UTC)
    with ThreadPoolExecutor(max_workers=4)as pool:observations=list(pool.map(lambda c:collect_one(c,now),[c for c in config['indices'] if c.get('enabled', True)]))
    report={'checkedAt':now.isoformat(),'indices':observations,'status':'validated','notQualified':[c['id'] for c in config['indices'] if not c.get('enabled', True)]}
    write_json_atomic(args.output,report)
    if args.apply:
        path=ROOT/'src/data/automated-indices.json';old=json.loads(path.read_text())if path.exists()else{}
        merged=merge_records(old,observations)
        if old!=merged:write_json_atomic(path,merged)
    failures=sum(len(o['errors'])for o in observations)
    print(f"Indices: {sum('facts'in o for o in observations)} compositions, {sum('returns'in o for o in observations)} calendar histories; {failures} explicit exceptions.")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a')as h:
            h.write('\n## Sources d’indices\n\n| Indice | Composition | Performances | Exceptions |\n|---|---|---|---|\n')
            h.write('Hors automatisation : '+', '.join(report['notQualified'])+'\n\n')
            for o in observations:h.write(f"| {o['name']} | {o.get('facts',{}).get('asOf','Conservée')} | {o.get('returns',{}).get('asOf','Conservées')} | {' ; '.join(e['reason'] for e in o['errors'])} |\n")
    # Configured sources remain observable; only qualified sources run in production.
    if any(e['field'] in next(c for c in config['indices'] if c['id']==o['id']).get('requiredFields', []) for o in observations for e in o['errors']):raise SystemExit(1)


if __name__=='__main__':main()
