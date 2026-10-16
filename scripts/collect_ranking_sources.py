"""Exact long histories and ECB month-end FX for performance rankings."""
import argparse
import copy
import datetime as dt
import hashlib
import json
import pathlib
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote
from data_automation import UTC, get_json, month_shift, reject, write_json_atomic
from issuer_documents import download
from refresh_monthly_history import collect_one, months

ROOT = pathlib.Path(__file__).resolve().parents[1]
ECB = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml'


def parse_fx(body, now):
    root = ET.fromstring(body)
    if root.tag != '{http://www.gesmes.org/xml/2002-08-01}Envelope':
        reject('Wrong ECB document')
    observed, seen = {}, set()
    boundary = dt.date(now.year, now.month, 1)
    ns = '{http://www.ecb.int/vocabulary/2002-08-01/eurofxref}'
    for cube in root.iter(ns + 'Cube'):
        if 'time' not in cube.attrib:
            continue
        day = dt.date.fromisoformat(cube.attrib['time'])
        if day in seen or day > now.date():
            reject('Duplicate/future ECB observation')
        seen.add(day)
        rates = {'EUR': 1.0}
        for row in cube:
            currency = row.attrib['currency']
            value = float(row.attrib['rate'])
            if currency in rates or not 0 < value < float('inf'):
                reject('Invalid/duplicate ECB rate')
            rates[currency] = value
        if 'USD' not in rates:
            reject('Missing ECB USD rate')
        if day >= boundary:
            continue
        key = day.strftime('%Y-%m')
        if key not in observed or day.isoformat() > observed[key]['asOf']:
            observed[key] = {'asOf': day.isoformat(), 'rates': rates}
    expected = list(months('1999-01', dt.datetime(now.year, now.month, 1, tzinfo=UTC)))
    if sorted(observed) != expected:
        reject('Incomplete ECB month-end coverage')
    for key, row in observed.items():
        next_month = month_shift(dt.datetime.strptime(key, '%Y-%m'), 1).date()
        if (next_month - dt.date.fromisoformat(row['asOf'])).days > 7:
            reject('Stale ECB month-end observation')
    return {'sourceUrl': ECB, 'checkedAt': now.date().isoformat(),
            'convention': 'Units of currency per EUR, final ECB reference observation in each completed month',
            'sha256': hashlib.sha256(body).hexdigest(), 'months': dict(sorted(observed.items()))}


def validate_record(record, old=None):
    points = record['points']
    if not points or points[0][0] != record['periodStart'] or points[-1][0] != record['periodEnd']:
        reject('Invalid ranking history boundaries')
    boundary = month_shift(dt.datetime.strptime(record['periodEnd'], '%Y-%m').replace(tzinfo=UTC), 1)
    if [p[0] for p in points] != list(months(record['periodStart'], boundary)):
        reject('Ranking history gap/duplicate')
    if any(not 0 < float(p[1]) < float('inf') for p in points):
        reject('Invalid ranking level')
    if record.get('parser') == 'yahoo' and any(points[i - 2][1] == points[i - 1][1] == points[i][1] for i in range(2, len(points))):
        reject('Three identical month-end prices: stale listing requires review')
    if old:
        for field in ['currency', 'parser', 'symbol', 'indexCode', 'variant', 'field', 'isin', 'targetId']:
            if old.get(field) != record.get(field):
                reject('Ranking identity/convention changed: ' + field)
        if record['periodStart'] > old['periodStart'] or record['periodEnd'] < old['periodEnd']:
            reject('Ranking history would regress')


def collect_source(source, now):
    source = copy.deepcopy(source)
    if source['parser'] == 'yahoo' and source.pop('discoverStart', False):
        # Ask the provider for the exact listing's inception; never prepend proxy prices.
        meta_url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + quote(source['symbol'], safe='') + '?range=1mo&interval=1d'
        meta = get_json(meta_url)['chart']['result'][0]['meta']
        if meta['symbol'] != source['symbol'] or meta['currency'] != source['currency']:
            reject('Long-history listing identity mismatch')
        if source.get('isin') and meta.get('instrumentType') not in (('ETF', 'MUTUALFUND', 'EQUITY') if source.get('instrumentType') == 'ETC' and source.get('listingSourceUrl', '').startswith('https://www.invesco.com/') else ('ETF', 'MUTUALFUND')):
            reject('Expected exact fund listing')
        first = dt.datetime.fromtimestamp(meta['firstTradeDate'], UTC)
        first_complete = month_shift(first.replace(day=1), 1).strftime('%Y-%m')
        source['periodStart'] = max(source['periodStart'], first_complete)
    result = collect_one(source, now)
    validate_record(result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--only', nargs='+')
    parser.add_argument('--retry-failed', action='store_true')
    args = parser.parse_args()
    now = dt.datetime.now(UTC)
    config = json.loads((ROOT / 'scripts/ranking-sources.json').read_text())['series']
    active_path = ROOT / 'src/data/ranking-histories.json'
    active = json.loads(active_path.read_text()) if active_path.exists() else {}
    status_path = ROOT / 'scripts/source-snapshots/ranking-collection-status.json'
    previous = json.loads(status_path.read_text()).get('series', []) if status_path.exists() else []
    reports = {item['id']: item for item in previous}
    latest = month_shift(now.replace(day=1), -1).strftime('%Y-%m')
    if args.only and set(args.only) - {'fx', *(s['id'] for s in config)}:
        parser.error('Unknown source id')
    fx_path = ROOT / 'src/data/monthly-fx.json'
    old_fx = json.loads(fx_path.read_text()) if fx_path.exists() else {}
    fx_failed = False
    if (not args.only or 'fx' in args.only) and (not args.retry_failed or latest not in old_fx.get('months', {})):
        try:
            fx = parse_fx(download(ECB, max_bytes=12_000_000), now)
            if old_fx and not set(old_fx['months']).issubset(fx['months']):
                reject('ECB coverage would regress')
            if args.apply:
                write_json_atomic(fx_path, fx)
            print('ECB monthly FX:', len(fx['months']), 'months')
        except Exception as error:
            print('ECB FX failed:', error, flush=True)
            fx_failed = True
    selected = [s for s in config if (not args.only or s['id'] in args.only) and
                (not args.retry_failed or reports.get(s['id'], {}).get('status') == 'failed' or active.get(s['id'], {}).get('periodEnd', '') < latest)]
    def one(source):
        try:
            result = collect_source(source, now)
            record = {k: v for k, v in result.items() if k not in ('rawResponse', 'proofRows', 'anniversaryPoints')}
            validate_record(record, active.get(source['id']))
            return {'id': source['id'], 'status': 'validated', 'record': record,
                    'proof': {'responseSha256': result['responseSha256'], 'rows': result['proofRows']}}
        except Exception as error:
            return {'id': source['id'], 'status': 'failed', 'reason': str(error)}
    proof_path = ROOT / 'scripts/source-snapshots/ranking-histories.json'
    proofs = json.loads(proof_path.read_text()) if proof_path.exists() else {}
    with ThreadPoolExecutor(max_workers=3) as pool:
        for item in pool.map(one, selected):
            reports[item['id']] = {k: v for k, v in item.items() if k not in ('record', 'proof')}
            print(item['id'], item['status'], item.get('reason', ''), flush=True)
            if item['status'] == 'validated':
                active[item['id']] = item['record']
                proofs[item['id']] = item['proof']
    if args.apply:
        write_json_atomic(active_path, active)
        write_json_atomic(proof_path, proofs)
        write_json_atomic(status_path, {'checkedAt': now.isoformat(), 'fxFailed': fx_failed, 'series': sorted(reports.values(), key=lambda s: s['id'])})
    if fx_failed or any(item['status'] == 'failed' for item in reports.values()):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
