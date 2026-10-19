"""Exact long histories and ECB month-end FX for performance rankings."""
import argparse
import copy
import datetime as dt
import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
import pathlib
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote
from data_automation import UTC, get_json, month_shift, reject, write_json_atomic
from issuer_documents import download
from refresh_monthly_history import collect_one, months

ROOT = pathlib.Path(__file__).resolve().parents[1]
ECB = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml'
# The ECB publishes no reference rate for the New Taiwan dollar. The Federal Reserve H.10
# release (noon buying rates in New York, TWD per USD, series DEXTAUS republished by FRED)
# crossed with the ECB USD rate of the same day gives a documented TWD per EUR rate.
FRED_TWD = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXTAUS'
CROSS_SERIES = {'TWD': FRED_TWD}


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


def ecb_daily_usd(body):
    """USD per EUR for every ECB reference day."""
    root = ET.fromstring(body)
    if root.tag != '{http://www.gesmes.org/xml/2002-08-01}Envelope':
        reject('Wrong ECB document')
    ns = '{http://www.ecb.int/vocabulary/2002-08-01/eurofxref}'
    daily = {}
    for cube in root.iter(ns + 'Cube'):
        if 'time' not in cube.attrib:
            continue
        rates = [float(row.attrib['rate']) for row in cube if row.attrib.get('currency') == 'USD']
        if len(rates) == 1 and 0 < rates[0] < float('inf'):
            daily[dt.date.fromisoformat(cube.attrib['time'])] = rates[0]
    return daily


def parse_fred_series(body, series):
    """Daily observations of one FRED CSV export; '.' marks a day without a rate."""
    lines = body.decode('utf-8-sig').splitlines()
    if not lines or lines[0].strip().lower() not in (f'observation_date,{series.lower()}', f'date,{series.lower()}'):
        reject('Wrong FRED document')
    daily = {}
    for line in lines[1:]:
        if not line.strip():
            continue
        day, _, value = line.partition(',')
        value = value.strip()
        if value in ('.', ''):
            continue
        rate = float(value)
        if not 0 < rate < float('inf'):
            reject('Invalid FRED rate')
        when = dt.date.fromisoformat(day.strip())
        if when in daily:
            reject('Duplicate FRED observation')
        daily[when] = rate
    if not daily:
        reject('Empty FRED series')
    return daily


def cross_value(per_usd, usd_per_eur):
    # Official published decimal observations, rounded half up to four decimals.
    # Avoid language-specific binary ties (e.g. 33.06 × 1.3275 = 43.88715).
    return float((Decimal(str(per_usd)) * Decimal(str(usd_per_eur))).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP))


def parse_cross_fx(fred_body, ecb_body, now, currency='TWD', series='DEXTAUS'):
    """TWD per EUR at the latest day of each completed month where both official series publish."""
    usd_per_eur = ecb_daily_usd(ecb_body)
    per_usd = parse_fred_series(fred_body, series)
    boundary = dt.date(now.year, now.month, 1)
    observed = {}
    for day in sorted(set(usd_per_eur) & set(per_usd)):
        if day >= boundary or day > now.date():
            continue
        key = day.strftime('%Y-%m')
        observed[key] = {'asOf': day.isoformat(), 'usdPerEur': usd_per_eur[day], 'perUsd': per_usd[day],
                         'value': cross_value(per_usd[day], usd_per_eur[day])}
    # The H.10 release is weekly: a month-end published less than eight days ago may still be
    # missing from FRED. Every older completed month is required; a newer one is taken when present.
    due = now.date() - dt.timedelta(days=8)
    expected = [key for key in months('1999-01', dt.datetime(now.year, now.month, 1, tzinfo=UTC))
                if month_shift(dt.datetime.strptime(key, '%Y-%m'), 1).date() - dt.timedelta(days=1) <= due]
    if not set(expected).issubset(observed):
        reject('Incomplete cross-rate month-end coverage')
    for key, row in observed.items():
        next_month = month_shift(dt.datetime.strptime(key, '%Y-%m'), 1).date()
        if (next_month - dt.date.fromisoformat(row['asOf'])).days > 7:
            reject('Stale cross-rate month-end observation')
    return {'sourceUrl': CROSS_SERIES[currency], 'series': series, 'secondarySourceUrl': ECB,
            'checkedAt': now.date().isoformat(), 'sha256': hashlib.sha256(fred_body).hexdigest(),
            'convention': f'{currency} per EUR = Federal Reserve H.10 noon buying rate ({currency} per USD, FRED {series}) '
                          '× ECB USD per EUR reference rate, latest day of each completed month published by both; decimal half-up rounding to four places',
            'observations': dict(sorted(observed.items()))}


def apply_cross_rates(fx, derived):
    """Write the derived month-end rates next to the ECB rates; provenance stays in fx['derived']."""
    fx['derived'] = derived
    for currency, info in derived.items():
        for key, row in info['observations'].items():
            if key in fx['months']:
                fx['months'][key]['rates'][currency] = row['value']
    return fx


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


def refresh_fx(old_fx, previous_status, now, retry=False, selected=True):
    """Retry each failed/missing FX source; a skipped source cannot clear its incident."""
    latest = month_shift(now.replace(day=1), -1).strftime('%Y-%m')
    reports = copy.deepcopy(previous_status.get('fxSources', {}))
    for key, failed in [('ECB', previous_status.get('fxFailed')),
                        *[(c, previous_status.get('crossFxFailed')) for c in CROSS_SERIES]]:
        if key not in reports and failed:
            reports[key] = {'id': 'fx:' + key, 'status': 'failed', 'reason': 'Previous attempt failed; awaiting retry'}
    if not selected:
        return old_fx, reports
    due = [c for c in CROSS_SERIES if not retry or reports.get(c, {}).get('status') == 'failed'
           or latest not in old_fx.get('derived', {}).get(c, {}).get('observations', {})]
    ecb_due = not retry or reports.get('ECB', {}).get('status') == 'failed' or latest not in old_fx.get('months', {})
    if not ecb_due and not due:
        return old_fx, reports
    fx = copy.deepcopy(old_fx)
    checked = now.isoformat()
    try:
        body = download(ECB, max_bytes=12_000_000)
        candidate = parse_fx(body, now)
        if old_fx and not set(old_fx.get('months', {})).issubset(candidate['months']):
            reject('ECB coverage would regress')
        fx = candidate
        reports['ECB'] = {'id': 'fx:ECB', 'status': 'validated', 'checkedAt': checked}
    except Exception as error:
        for key in ['ECB', *due]:
            reports[key] = {'id': 'fx:' + key, 'status': 'failed', 'checkedAt': checked,
                            'reason': str(error) if key == 'ECB' else 'ECB dependency unavailable: ' + str(error)}
        print('ECB FX failed:', error, flush=True)
        return old_fx, reports
    derived = copy.deepcopy(old_fx.get('derived', {}))
    for currency in due:
        try:
            cross = parse_cross_fx(download(CROSS_SERIES[currency], max_bytes=4_000_000, timeout=60, max_attempts=4), body, now, currency)
            if not set(derived.get(currency, {}).get('observations', {})).issubset(cross['observations']):
                reject(f'{currency} cross-rate coverage would regress')
            derived[currency] = cross
            reports[currency] = {'id': 'fx:' + currency, 'status': 'validated', 'checkedAt': checked}
            print(currency, 'cross FX:', len(cross['observations']), 'months', flush=True)
        except Exception as error:
            reports[currency] = {'id': 'fx:' + currency, 'status': 'failed', 'checkedAt': checked, 'reason': str(error)}
            print(currency, 'cross FX failed:', error, flush=True)
    return apply_cross_rates(fx, derived), reports


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--output', type=pathlib.Path)
    parser.add_argument('--only', nargs='+')
    parser.add_argument('--retry-failed', action='store_true')
    args = parser.parse_args()
    now = dt.datetime.now(UTC)
    config = json.loads((ROOT / 'scripts/ranking-sources.json').read_text())['series']
    active_path = ROOT / 'src/data/ranking-histories.json'
    active = json.loads(active_path.read_text()) if active_path.exists() else {}
    status_path = ROOT / 'scripts/source-snapshots/ranking-collection-status.json'
    previous_status = json.loads(status_path.read_text()) if status_path.exists() else {}
    previous = previous_status.get('series', [])
    reports = {item['id']: item for item in previous}
    latest = month_shift(now.replace(day=1), -1).strftime('%Y-%m')
    if args.only and set(args.only) - {'fx', *(s['id'] for s in config)}:
        parser.error('Unknown source id')
    fx_path = ROOT / 'src/data/monthly-fx.json'
    old_fx = json.loads(fx_path.read_text()) if fx_path.exists() else {}
    fx, fx_reports = refresh_fx(old_fx, previous_status, now, args.retry_failed,
                                not args.only or 'fx' in args.only)
    fx_failed = fx_reports.get('ECB', {}).get('status') == 'failed'
    cross_failed = any(fx_reports.get(c, {}).get('status') == 'failed' for c in CROSS_SERIES)
    if args.apply and fx != old_fx:
        write_json_atomic(fx_path, fx)
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
    status = {'checkedAt': now.isoformat(), 'fxFailed': fx_failed, 'crossFxFailed': cross_failed, 'fxSources': fx_reports, 'series': sorted(reports.values(), key=lambda s: s['id'])}
    if args.output:
        write_json_atomic(args.output, status)
    if args.apply:
        write_json_atomic(active_path, active)
        write_json_atomic(proof_path, proofs)
        write_json_atomic(status_path, status)
    if fx_failed or cross_failed or any(item['status'] == 'failed' for item in reports.values()):
        raise SystemExit(1)


if __name__ == '__main__':
    main()

