"""Observe Coinbase BTC-USD monthly closes. Never writes the active Yahoo series.

Source: https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles
Daily buckets use UTC; the closing price of the final complete day is retained.
"""
import argparse
import datetime as dt
import json
import os
import pathlib
import statistics
import urllib.parse

from data_automation import UTC, completed_month_window, get_json, month_shift, number, reject, write_json_atomic

BASE = 'https://api.exchange.coinbase.com/products/BTC-USD'


def extract_monthly(candles, start, end):
    if not isinstance(candles, list) or not candles or len(candles) > 300:
        reject('Empty, invalid or oversized Coinbase candles response')
    days = {}
    for row in candles:
        if not isinstance(row, list) or len(row) != 6:
            reject('Unexpected candle schema')
        stamp, low, high, opening, close, volume = row
        number(stamp)
        if stamp != int(stamp) or stamp % 86400:
            reject('Candle is not a UTC daily bucket')
        day = dt.datetime.fromtimestamp(stamp, UTC)
        for value in (low, high, opening, close):
            number(value)
        number(volume, positive=False)
        if not low <= opening <= high or not low <= close <= high:
            reject('Inconsistent OHLC prices')
        if day in days:
            reject('Duplicate daily candle')
        days[day] = close
    # Coinbase may return buckets outside the requested interval. Ignore those,
    # but require every expected day, not just the last day of each month.
    day = start
    while day < end:
        if day not in days:
            reject(f'Missing daily candle: {day.date()}')
        day += dt.timedelta(days=1)
    points = []
    first = start
    while first < end:
        next_month = month_shift(first, 1)
        last_day = next_month - dt.timedelta(days=1)
        points.append({'date': first.strftime('%Y-%m'), 'price': round(days[last_day], 2),
                       'sourceDate': last_day.date().isoformat()})
        first = next_month
    return points


def compare(points, baseline):
    if baseline.get('assetId') != 'bitcoin' or baseline.get('currency') != 'USD':
        reject('Baseline is not the active Bitcoin USD series')
    if not isinstance(baseline.get('points'), list) or not baseline['points']:
        reject('Empty baseline')
    previous = ''
    existing = {}
    for point in baseline['points']:
        month = point['date']
        parsed = dt.datetime.strptime(month, '%Y-%m')
        if parsed.strftime('%Y-%m') != month or month <= previous:
            reject('Baseline months must be unique and ascending')
        existing[month] = number(point['price'])
        previous = month
    rows = []
    for point in points:
        price = existing.get(point['date'])
        rows.append({**point, 'activePrice': price,
                     'differencePct': round((point['price'] / price - 1) * 100, 6) if price else None})
    overlaps = [row for row in rows if row['activePrice'] is not None]
    if not overlaps:
        reject('No overlapping months: cannot assess the provider against the active series')
    errors = [abs(row['differencePct']) for row in overlaps]
    months_without_active = [row['date'] for row in rows if row['activePrice'] is None]
    qualification = {
        'status': 'migration-required',
        'activeHistoryMonths': len(existing), 'observedHistoryMonths': len(rows),
        'medianAbsoluteDifferencePct': round(statistics.median(errors), 6),
        'diagnosticThresholdPct': 0.1,
        'priceDiagnosticPassed': max(errors) <= 0.1 and not months_without_active,
        'monthsWithoutActiveReference': months_without_active,
        'unqualifiedRequirements': [
            'Homogeneous history covering every active month',
            'Explicit migration of all consumers from Yahoo aggregate to Coinbase single exchange',
            'Provider availability and reuse terms reviewed before production connection',
        ],
    }
    return {'rows': rows, 'overlappingMonths': len(overlaps),
            'maxAbsoluteDifferencePct': max(abs(row['differencePct']) for row in overlaps),
            'qualification': qualification,
            # Even close prices are not an authorization to splice two providers.
            'automaticConnectionAllowed': False,
            'reason': 'Coinbase exchange prices and the active Yahoo series have different providers and scopes.'}


def collect(baseline, now=None, fetch=get_json):
    now = now or dt.datetime.now(UTC)
    start, end = completed_month_window(now)
    product = fetch(BASE)
    if not isinstance(product, dict) or product.get('id') != 'BTC-USD' \
            or product.get('base_currency') != 'BTC' or product.get('quote_currency') != 'USD':
        reject('Unexpected Coinbase product identity')
    params = urllib.parse.urlencode({'start': start.isoformat(), 'end': end.isoformat(), 'granularity': 86400})
    url = f'{BASE}/candles?{params}'
    candles = fetch(url)
    points = extract_monthly(candles, start, end)
    return {'schemaVersion': 1, 'status': 'observation-only', 'assetId': 'bitcoin',
            'provider': 'Coinbase Exchange', 'product': 'BTC-USD', 'currency': 'USD',
            'priceScope': 'single-exchange', 'method': 'UTC last-day daily close; complete calendar months only',
            'checkedAt': now.astimezone(UTC).isoformat(), 'periodStart': points[0]['date'],
            'periodEnd': points[-1]['date'], 'sourceUrls': [BASE, url],
            'baselineEvidence': baseline.get('evidence'), 'comparison': compare(points, baseline),
            'rawResponse': {'product': product, 'candles': candles}}


def refresh(destination, baseline, now=None, fetch=get_json):
    report = collect(baseline, now, fetch)
    write_json_atomic(destination, report)
    return report


def summary(report):
    comparison = report['comparison']
    rows = ['## Pilote gratuit Bitcoin', '',
            f"Période Coinbase : {report['periodStart']} à {report['periodEnd']} (UTC).",
            f"Mois comparés à la série active : {comparison['overlappingMonths']}.",
            f"Écart absolu maximal : {comparison['maxAbsoluteDifferencePct']:.6f} %.", '',
            '| Mois | Coinbase USD | Série active USD | Écart % |', '|---|---:|---:|---:|']
    for row in comparison['rows']:
        active = f"{row['activePrice']:.2f}" if row['activePrice'] is not None else 'absent'
        difference = f"{row['differencePct']:+.6f}" if row['differencePct'] is not None else '—'
        rows.append(f"| {row['date']} | {row['price']:.2f} | {active} | {difference} |")
    rows.extend(['', '**Observation uniquement : aucun prix actif ni tweet modifié.**',
                 'Les deux fournisseurs ne constituent pas une même série, même si les prix sont proches.',
                 f"Qualification : {comparison['qualification']['status']} ; médiane des écarts absolus {comparison['qualification']['medianAbsoluteDifferencePct']:.6f} %.",
                 'Une migration de toute la série reste nécessaire avant tout raccord.',
                 'Réponses et provenance conservées dans le rapport JSON.'])
    return '\n'.join(rows) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', required=True, type=pathlib.Path)
    parser.add_argument('--output', required=True, type=pathlib.Path)
    args = parser.parse_args()
    baseline = json.loads(args.baseline.read_text(encoding='utf-8'))
    report = refresh(args.output, baseline)
    rendered = summary(report)
    print(rendered)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as handle:
            handle.write(rendered)


if __name__ == '__main__':
    main()
