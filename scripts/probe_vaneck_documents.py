"""Read-only qualification through the production VanEck document reader/parser."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import json
import os
from pathlib import Path
import threading
from collect_vaneck_etf import download_document, parse_document
from data_automation import write_json_atomic

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--evidence-dir', required=True, type=Path)
    args = parser.parse_args()
    selected = [s for s in json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments'] if s.get('parser') == 'vaneck' and s.get('enabled', True)]
    if len({s['isin'] for s in selected}) != len(selected):
        raise ValueError('Duplicate expected share in source qualification plan')
    args.evidence_dir.mkdir(parents=True, exist_ok=True)
    fields = ['official PDF', 'exact share identity', 'base currency', 'TER', 'dated AUM', 'dated top 10']
    plan = {'expectedIds':[s['isin'] for s in selected], 'fields':fields, 'mode':'configured exact official document routes, fallback routes disabled',
            'routes':{s['isin']:s['sourceUrl'] for s in selected}, 'declaredAt':dt.datetime.now(dt.timezone.utc).isoformat(),
            'runId':os.environ.get('GITHUB_RUN_ID'), 'attempt':os.environ.get('GITHUB_RUN_ATTEMPT')}
    write_json_atomic(args.output.with_suffix('.plan.json'), plan)
    lock = threading.Lock()
    def one(share):
        attempted = dt.datetime.now(dt.timezone.utc).isoformat()
        body_retrieved = False
        try:
            # Qualify the new route; do not repeat the old English routes.
            body, url = download_document({**share, 'fallbackUrls':[]})
            body_retrieved = True
            record = parse_document(body, {**share, 'sourceUrl':url}, dt.datetime.now(dt.timezone.utc))
            (args.evidence_dir/(share['isin']+'.pdf')).write_bytes(body)
            outcome = {'id':share['isin'], 'status':'succeeded', 'sourceAttempted':True, 'attemptedAt':attempted,
                       'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(), 'sourceUrl':url,
                       'sourceAsOf':record['aum']['asOf'], 'documentSha256':record['documentSha256'], 'record':record}
        except Exception as error:
            outcome = {'id':share['isin'], 'status':'failed', 'sourceAttempted':True if body_retrieved else None, 'operationAttempted':True, 'attemptedAt':attempted,
                       'sourceUrl':share['sourceUrl'], 'error':str(error)}
        with lock:
            with args.output.with_suffix('.results.jsonl').open('a') as output:
                output.write(json.dumps(outcome, ensure_ascii=False)+'\n')
        return outcome
    with ThreadPoolExecutor(max_workers=2) as pool:
        rows = list(pool.map(one, selected))
    write_json_atomic(args.output, {'kind':'read-only-official-route-qualification-v1', 'inputPlan':plan, 'outcomes':rows,
        'limitations':['Production document reader/parser exercised in GitHub, not financial registration/publication.',
                       'No sector page or full portfolio qualification; only the declared document fields.',
                       'An older factsheet never authorizes overwriting newer values or renewing their proof.']})
    for row in rows:
        print(row['id'], row['status'], row.get('sourceAsOf'), row.get('error',''))
    if not selected or any(row['status'] != 'succeeded' for row in rows):
        raise SystemExit(1)

if __name__ == '__main__':
    main()
