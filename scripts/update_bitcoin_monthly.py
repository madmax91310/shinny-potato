"""Refresh the existing Yahoo BTC-USD close series, using only complete months."""
import argparse
import datetime as dt
import json
import math
import pathlib
import urllib.parse
from data_automation import UTC, get_json, month_shift, number, reject, write_json_atomic


def parse_chart(body, interval):
    chart = body['chart']
    if chart.get('error') or len(chart['result']) != 1:
        reject('Yahoo chart failed')
    result = chart['result'][0]
    meta = result['meta']
    if meta['symbol'] != 'BTC-USD' or meta['currency'] != 'USD' or meta['dataGranularity'] != interval \
            or meta['exchangeTimezoneName'] not in ('UTC', 'Etc/UTC'):
        reject('Unexpected Bitcoin identity, currency, interval or timezone')
    times = result['timestamp']
    closes = result['indicators']['quote'][0]['close']
    if len(times) != len(closes) or not times or times != sorted(set(times)):
        reject('Invalid or duplicate Bitcoin timestamps')
    return [(dt.datetime.fromtimestamp(number(t), UTC), number(p)) for t, p in zip(times, closes)]


def collect(now=None, fetch=get_json):
    now = now or dt.datetime.now(UTC)
    end = dt.datetime(now.year, now.month, 1, tzinfo=UTC)
    start = dt.datetime(2015, 1, 1, tzinfo=UTC)
    urls, raw = {}, {}
    for interval in ('1mo', '1d'):
        query = urllib.parse.urlencode({'period1': int(start.timestamp()), 'period2': int(end.timestamp()), 'interval': interval})
        urls[interval] = 'https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD?' + query
        raw[interval] = fetch(urls[interval])
    monthly = parse_chart(raw['1mo'], '1mo')
    daily = dict(parse_chart(raw['1d'], '1d'))
    points = []
    month = start
    for stamp, price in monthly:
        if stamp >= end:
            continue
        if stamp != month:
            reject('Missing, shifted or duplicate monthly bucket')
        following = month_shift(month, 1)
        day = month
        while day < following:
            if day not in daily:
                reject('Missing Bitcoin daily candle')
            day += dt.timedelta(days=1)
        last = following - dt.timedelta(days=1)
        if abs(daily[last] - price) > .001:
            reject('Daily/monthly closing prices disagree')
        points.append([month.strftime('%Y-%m'), math.floor(price * 100 + .5) / 100])
        month = following
    if month != end or not points:
        reject('Incomplete or stale Bitcoin history')
    return {'provider': 'Yahoo Finance', 'symbol': 'BTC-USD', 'currency': 'USD',
            'method': 'Yahoo monthly close verified against UTC final daily close; complete months only',
            'checkedAt': now.date().isoformat(), 'periodStart': points[0][0], 'periodEnd': points[-1][0],
            'sourceUrls': list(urls.values()), 'points': points, 'rawResponse': raw,
            'lastDailyCloses': [{'date': (month_shift(dt.datetime.strptime(m, '%Y-%m').replace(tzinfo=UTC), 1) - dt.timedelta(days=1)).date().isoformat(),
                                 'price': daily[month_shift(dt.datetime.strptime(m, '%Y-%m').replace(tzinfo=UTC), 1) - dt.timedelta(days=1)]}
                                for m, _ in points]}


def apply(report, destination, evidence_destination=None):
    existing = json.loads(destination.read_text()) if destination.exists() else {}
    if existing.get('periodEnd', '') > report['periodEnd']:
        reject('Bitcoin history would regress')
    if existing.get('points') == report['points']:
        return False
    active = {k: v for k, v in report.items() if k not in ('rawResponse', 'lastDailyCloses')}
    if evidence_destination:
        evidence = {**report, 'rawResponse': {'1mo': report['rawResponse']['1mo']}}
        write_json_atomic(evidence_destination, evidence)
    write_json_atomic(destination, active)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=pathlib.Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    report = collect()
    write_json_atomic(args.output, report)
    if args.apply:
        apply(report, pathlib.Path(__file__).resolve().parents[1] / 'src/data/bitcoin-yahoo-monthly.json',
              pathlib.Path(__file__).with_name('source-snapshots') / 'bitcoin-automated.json')
    print(f"Bitcoin Yahoo validated: {len(report['points'])} months through {report['periodEnd']}.")


if __name__ == '__main__':
    main()
