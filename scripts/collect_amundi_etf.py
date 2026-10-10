"""Collect Amundi's official product API, including dated share-class AUM and physical fund holdings."""
import argparse
import datetime as dt
import json
import os
import pathlib
import time
import urllib.error
import urllib.request
from data_automation import UTC, number, reject, write_json_atomic
from apply_etf_collection import apply_valid_shares as apply
from collect_etf_pilot import source_date

API = 'https://www.amundietf.fr/mapi/ProductAPI/getProductsData'
ROOT = pathlib.Path(__file__).resolve().parents[1]


def request_payload(instruments, now):
    return {'productIds': [s['isin'] for s in instruments],
        'context': {'countryCode': 'FRA', 'languageCode': 'fr', 'userProfileName': 'INSTIT'},
        'characteristics': ['ISIN', 'TER', 'CURRENCY', 'BASE_CURRENCY', 'DISTRIBUTION_POLICY',
            'FUND_REPLICATION_METHODOLOGY', 'BENCHMARK_NAME', 'POSITION_AS_OF_DATE',
            'FUND_BREAKDOWNS_AS_OF_DATE', 'PERFORMANCE_DATA_DATE', 'SHARE_MARKETING_NAME'],
        'breakDown': {'aggregationFields': ['FUND_TOP10', 'FUND_COUNTRIES', 'FUND_SECTORS']},
        'metrics': [{'indicator': 'shareCalendarPerformance', 'period': str(y)} for y in range(2020, now.year)],
        'historics': [{'indicator': 'shareAumInMCcy', 'startDate': (now.date()-dt.timedelta(days=45)).isoformat(),
            'endDate': now.date().isoformat()}]}


def fetch_api(payload):
    request = urllib.request.Request(API, data=json.dumps(payload).encode(), headers={
        'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'EpargnantLibre-Data/1.0'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.headers.get_content_type() != 'application/json':
                    reject('Expected official Amundi JSON')
                body = response.read(6_000_001)
                if len(body) > 6_000_000:
                    reject('Amundi response too large')
                return json.loads(body, parse_constant=lambda x: reject('Invalid JSON number'))
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def published_date(value, now):
    if not isinstance(value, str):
        reject('Missing Amundi composition date')
    return source_date(value.replace('-', ''), now)


def breakdown(data, field, date, now, top=False):
    candidates = [d for d in data if d['aggregationField'] == field]
    if len(candidates) > 1:
        reject('Duplicate Amundi breakdown')
    if not candidates or not candidates[0]['breakDownData']:
        return None
    stamp = published_date(date, now)
    rows = []
    for point in candidates[0]['breakDownData']:
        # Amundi's own UI uses adjustedWeight; raw weight is zero for top ten.
        weight = number(point['adjustedWeight'], positive=False)
        if weight > 1 or not isinstance(point['aggregationName'], str) or not point['aggregationName']:
            reject('Invalid Amundi composition')
        row = {'name': point['aggregationName'], 'weightPct': round(weight * 100, 6)}
        if top:
            row['isin'] = (point.get('additionalProperties') or {}).get('isin')
            if not row['isin']:
                reject('Missing Amundi holding identity')
        rows.append(row)
    if len({r.get('isin') if top else r['name'] for r in rows}) != len(rows):
        reject('Duplicate Amundi composition row')
    if not top and not 99 <= sum(r['weightPct'] for r in rows) <= 101:
        reject('Incomplete Amundi allocation')
    if top and (not 0 < sum(r['weightPct'] for r in rows) <= 101):
        reject('Invalid Amundi top positions')
    return {'asOf': stamp, 'basis': 'fund', 'sourceUrl': API,
        'rows': sorted(rows, key=lambda p: -p['weightPct'])}


def parse_product(product, share, now):
    facts = product['characteristics']
    if product['productId'] != share['isin'] or facts.get('ISIN') != share['isin']:
        reject('Wrong Amundi share identity')
    currency = product['currencies']['CURRENCY']
    if currency != share['currency'] or facts['CURRENCY'] != currency:
        reject('Amundi share currency changed')
    ter = number(facts['TER'], positive=False)
    if ter > 5:
        reject('Invalid Amundi TER')
    replication = facts['FUND_REPLICATION_METHODOLOGY']
    if replication != share['replication']:
        reject('Amundi replication method changed')
    result = {**share, 'productId': share['isin'], 'sourceUrl': API,
        'terPct': ter, 'index': facts.get('BENCHMARK_NAME'), 'distribution': facts['DISTRIBUTION_POLICY']}
    historic = [h for h in product['historics'] if h['indicator'] == 'shareAumInMCcy']
    if len(historic) != 1 or not historic[0]['historicalData']:
        reject('Missing dated Amundi share AUM')
    points = historic[0]['historicalData']
    if len({p['date'] for p in points}) != len(points):
        reject('Duplicate Amundi AUM date')
    last = max(points, key=lambda p: p['date'])
    stamp = dt.datetime.fromtimestamp(number(last['date']) / 1000, UTC).strftime('%Y%m%d')
    result['aum'] = {'amount': number(last['data']), 'currency': currency, 'scope': 'share-class',
        'asOf': source_date(stamp, now)}
    # Synthetic collateral is not the tracked exposure. Index dates are not exposed by
    # this endpoint: leave existing index exposures unchanged rather than re-date them.
    if replication == 'Direct(Physical)' and share.get('collectComposition', True):
        for key, field, date, top in [('holdings','FUND_TOP10','POSITION_AS_OF_DATE',True),
                ('sectors','FUND_SECTORS','FUND_BREAKDOWNS_AS_OF_DATE',False),
                ('countries','FUND_COUNTRIES','FUND_BREAKDOWNS_AS_OF_DATE',False)]:
            allocation = breakdown(product['breakDowns'], field, facts.get(date), now, top)
            if allocation:
                result[key] = allocation
    returns = {}
    for metric in product['metrics']:
        if metric['indicator'] != 'shareCalendarPerformance':
            reject('Unexpected Amundi performance method')
        year = str(metric['period'])
        if not year.isdigit() or not 2020 <= int(year) < now.year or year in returns:
            reject('Duplicate or incomplete Amundi calendar year')
        if metric['value'] is None:
            continue
        value = metric['value']
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not -1 < value < 10:
            reject('Invalid Amundi calendar return')
        returns[year] = round(value * 100, 2)
    # Partial histories are recorded in the report, never substituted for a simulation proxy.
    if returns:
        result['performance'] = {'currency': currency, 'basis': 'fund',
            'method': 'calendar-year share total return, income reinvested, fund fees included',
            'years': dict(sorted(returns.items()))}
    return result


def collect(config, now=None, fetch=fetch_api):
    now = now or dt.datetime.now(UTC)
    payload = request_payload(config['instruments'], now)
    shares, failures = [], []
    try:
        body = fetch(payload)
        products = body['products']
        if not isinstance(products, list):
            reject('Invalid Amundi products envelope')
    except Exception as error:
        return {'schemaVersion': 1, 'checkedAt': now.isoformat(), 'sourceUrl': API,
            'shares': [], 'failures': [{'isin': s['isin'], 'sourceUrl': API, 'reason': str(error)}
                for s in config['instruments']], 'status': 'partial'}
    expected = {s['isin'] for s in config['instruments']}
    for product in products:
        if not isinstance(product, dict) or product.get('productId') not in expected:
            failures.append({'isin': 'unexpected-product', 'sourceUrl': API,
                'reason': 'Unexpected Amundi product in response'})
    for share in config['instruments']:
        try:
            matches = [p for p in products if isinstance(p, dict) and p.get('productId') == share['isin']]
            if len(matches) != 1:
                reject('Missing or duplicate Amundi product')
            shares.append(parse_product(matches[0], share, now))
        except Exception as error:
            failures.append({'isin': share['isin'], 'sourceUrl': API, 'reason': str(error)})
    return {'schemaVersion': 1, 'checkedAt': now.isoformat(), 'sourceUrl': API, 'request': payload,
        'shares': shares, 'failures': failures, 'status': 'partial' if failures else 'validated', 'rawResponse': body}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', required=True, type=pathlib.Path)
    parser.add_argument('--output', required=True, type=pathlib.Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    config = json.loads((ROOT/'scripts/amundi-etf.json').read_text())
    report = collect(config)
    write_json_atomic(args.output, report)
    if args.apply:
        changed = apply(report, ROOT/'src/data/automated-etf.json', json.loads(args.baseline.read_text()))
        report['status'] = 'applied' if changed else 'unchanged'
    write_json_atomic(args.output, report)
    message = f"{len(report['shares'])} parts Amundi validées ; mode {report['status']}. Positions/compositions : fonds physiques uniquement ; expositions des synthétiques conservées."
    print(message)
    for failure in report.get('failures', []):
        print(f"Source failed: {failure['isin']} — {failure['reason']}")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as handle:
            handle.write('## Amundi\n\n'+message+'\n')
            for failure in report.get('failures', []):
                handle.write(f"\n{failure['isin']} : {failure['reason']}\n")
    if report.get('failures'):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
