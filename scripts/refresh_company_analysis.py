"""Daily SEC accounts + completed-session prices; optional Alpha Vantage enrichment."""
import argparse
import datetime as dt
import json
import math
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo
from data_automation import write_json_atomic

ROOT = Path(__file__).resolve().parents[1]
UTC = dt.timezone.utc
REVENUE = ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax']


def fetch_json(url):
    request = urllib.request.Request(url, headers={
        'User-Agent': 'EpargnantLibre/1.0 https://github.com/madmax91310/shinny-potato',
        'Accept': 'application/json',
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.headers.get_content_type() not in ('application/json', 'text/json'):
                    raise ValueError('Unexpected content type')
                raw = response.read(12_000_001)
                if len(raw) > 12_000_000:
                    raise ValueError('Response too large')
                return json.loads(raw, parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def numeric(value):
    if isinstance(value, bool) or value is None:
        raise ValueError('Missing numeric value')
    result = float(value)
    if not math.isfinite(result):
        raise ValueError('Nonfinite value')
    return result


def fact_rows(body, tags, unit, form, minimum, maximum, today):
    rows = []
    for tag in tags:
        for row in body['facts'].get('us-gaap', {}).get(tag, {}).get('units', {}).get(unit, []):
            if row.get('form') not in (form, form + '/A') or not row.get('start'):
                continue
            start, end, filed = (dt.date.fromisoformat(row[k]) for k in ('start', 'end', 'filed'))
            if not minimum <= (end-start).days <= maximum or end > today or filed > today:
                continue
            rows.append({**row, 'tag': tag, 'val': numeric(row['val'])})
    # Restated comparatives in later filings take precedence.
    unique = {}
    for row in sorted(rows, key=lambda r: (r['filed'], r.get('accn', ''))):
        key = (row['start'], row['end'])
        old = unique.get(key)
        if old and old['filed'] == row['filed'] and old['val'] != row['val']:
            raise ValueError('Conflicting values for the same accounting period')
        unique[key] = row
    return list(unique.values())


def aligned(rows, period):
    return next((r for r in rows if r['start'] == period['start'] and r['end'] == period['end']), None)


def growth(current, previous):
    # Loss -> profit and a shrinking loss are changes of situation, not ordinary growth.
    return (current / previous - 1) * 100 if previous > 0 and current >= 0 else None


def financial_period(body, form, minimum, maximum, today):
    revenue = fact_rows(body, REVENUE, 'USD', form, minimum, maximum, today)
    income = fact_rows(body, ['NetIncomeLoss'], 'USD', form, minimum, maximum, today)
    if not revenue:
        return None
    latest = max(revenue, key=lambda r: r['end'])
    net = aligned(income, latest)
    if not net or latest['val'] <= 0:
        raise ValueError('Latest revenue/net income periods do not match')
    previous = [r for r in revenue if 330 <= (dt.date.fromisoformat(latest['end'])-dt.date.fromisoformat(r['end'])).days <= 400]
    prev = max(previous, key=lambda r:r['end']) if previous else None
    prev_net = aligned(income, prev) if prev else None
    result = {'start': latest['start'], 'end': latest['end'], 'filedAt': max(latest['filed'], net['filed']),
              'revenue': latest['val'], 'netIncome': net['val'], 'margin': net['val']/latest['val']*100,
              'previousStart': prev['start'] if prev else None, 'previousEnd': prev['end'] if prev else None,
              'previousRevenue': prev['val'] if prev else None, 'previousNetIncome': prev_net['val'] if prev_net else None,
              'revenueGrowth': growth(latest['val'], prev['val']) if prev else None,
              'incomeGrowth': growth(net['val'], prev_net['val']) if prev_net else None,
              'tags': {'revenue': latest['tag'], 'netIncome': net['tag']}}
    if form == '10-K':
        ocf = aligned(fact_rows(body, ['NetCashProvidedByUsedInOperatingActivities'], 'USD', form, minimum, maximum, today), latest)
        capex = aligned(fact_rows(body, ['PaymentsToAcquirePropertyPlantAndEquipment'], 'USD', form, minimum, maximum, today), latest)
        if ocf and capex and capex['val'] >= 0:
            result['freeCashFlow'] = ocf['val'] - capex['val']
            result['tags']['freeCashFlow'] = [ocf['tag'], capex['tag']]
    return result


def parse_accounts(body, profile, today):
    if str(body.get('cik', '')).zfill(10) != profile['cik']:
        raise ValueError('Wrong SEC identity')
    annual = financial_period(body, '10-K', 330, 400, today)
    if annual is None or (today - dt.date.fromisoformat(annual['end'])).days > 550:
        raise ValueError('Missing or stale annual accounts')
    quarter = financial_period(body, '10-Q', 75, 105, today)
    if quarter and (quarter['end'] <= annual['end'] or (today - dt.date.fromisoformat(quarter['end'])).days > 200):
        quarter = None
    return {'annual': annual, 'quarter': quarter}


def parse_quote(body, profile, now):
    chart = body['chart']
    if chart.get('error') or len(chart.get('result') or []) != 1:
        raise ValueError('Price source failed')
    data = chart['result'][0]
    meta = data['meta']
    if meta['symbol'] != profile['symbol'] or meta['currency'] != profile['currency'] or meta['dataGranularity'] != '1d':
        raise ValueError('Wrong price identity/currency/interval')
    zone = ZoneInfo(meta['exchangeTimezoneName'])
    today = now.astimezone(zone).date()
    stamps = data['timestamp']; values = data['indicators']['quote'][0]['close']
    if len(stamps) != len(values) or stamps != sorted(set(stamps)):
        raise ValueError('Invalid price series')
    candidates = [(dt.datetime.fromtimestamp(s, UTC).astimezone(zone).date(), numeric(v)) for s,v in zip(stamps,values) if v is not None]
    candidates = [(d,v) for d,v in candidates if d < today and v > 0]
    if not candidates:
        raise ValueError('No completed trading session')
    day, price = max(candidates)
    if (today-day).days > 10:
        raise ValueError('Stale price')
    return {'price': price, 'asOf': day.isoformat(), 'observedAt': now.date().isoformat(), 'currency': profile['currency']}


def parse_overview(body, profile, now):
    if body.get('Symbol') != profile['symbol'] or body.get('Currency') != profile['currency']:
        raise ValueError('Alpha Vantage unavailable or wrong identity')
    latest = dt.date.fromisoformat(body['LatestQuarter'])
    if latest > now.date() or (now.date()-latest).days > 200:
        raise ValueError('Stale valuation accounts')
    def positive(key):
        try:
            value = numeric(body.get(key))
            return value if value > 0 else None
        except (ValueError, TypeError):
            return None
    return {'peTTM': positive('PERatio'), 'forwardPE': positive('ForwardPE'),
            'forwardHorizon': 'Horizon non précisé par le fournisseur',
            'accountsAsOf': latest.isoformat(), 'observedAt': now.date().isoformat(),
            'sourceUrl': 'https://www.alphavantage.co/documentation/#company-overview'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--output', default='/tmp/company-analysis-observation.json')
    parser.add_argument('--only', nargs='*')
    args = parser.parse_args()
    profiles = json.loads((ROOT/'src/data/company-profiles.json').read_text())
    path = ROOT/'src/data/company-analysis.json'
    data = json.loads(path.read_text()) if path.exists() else {'schemaVersion': 1, 'companies': {}}
    now = dt.datetime.now(UTC)
    key = os.environ.get('ALPHAVANTAGE_API_KEY')
    report = {'checkedAt': now.isoformat(), 'alphaVantageConfigured': bool(key), 'companies': {}}
    failures = []
    for profile in profiles:
        if args.only and profile['id'] not in args.only:
            continue
        ident = profile['id']; old = data['companies'].get(ident, {})
        item = dict(old); status = {}
        url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{profile['cik']}.json"
        try:
            accounts = parse_accounts(fetch_json(url), profile, now.date())
            if old.get('annual', {}).get('end', '') > accounts['annual']['end']:
                raise ValueError('Annual accounts regressed')
            item.update(accounts, accountsObservedAt=now.date().isoformat(), accountsSourceUrl=url)
            status['accounts'] = 'updated'
        except Exception as error:
            status['accounts'] = type(error).__name__
            failures.append(ident + ':accounts')
        quote_url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + urllib.parse.quote(profile['symbol']) + '?range=1mo&interval=1d'
        try:
            quote = parse_quote(fetch_json(quote_url), profile, now)
            if old.get('quote', {}).get('asOf', '') > quote['asOf']:
                raise ValueError('Price regressed')
            item['quote'] = {**quote, 'sourceUrl': quote_url}
            status['quote'] = 'updated'
        except Exception as error:
            status['quote'] = type(error).__name__
            failures.append(ident + ':quote')
        if key:
            # Five symbols = five calls per daily run; never store URLs containing the key.
            try:
                endpoint = 'https://www.alphavantage.co/query?' + urllib.parse.urlencode({'function':'OVERVIEW', 'symbol':profile['symbol'], 'apikey':key})
                valuation = parse_overview(fetch_json(endpoint), profile, now)
                newest_period = max(item.get('annual', {}).get('end', ''), (item.get('quarter') or {}).get('end', ''))
                if valuation['accountsAsOf'] < newest_period:
                    raise ValueError('Valuation lags published accounts')
                item['valuation'] = valuation
                status['valuation'] = 'updated'
            except Exception as error:
                status['valuation'] = type(error).__name__
                failures.append(ident + ':valuation')
        else:
            status['valuation'] = 'not-configured'
        if item:
            data['companies'][ident] = item
        report['companies'][ident] = status
        print(ident, json.dumps(status))
        time.sleep(.2)
    if args.apply:
        write_json_atomic(path, data)
    write_json_atomic(Path(args.output), report)
    if failures:
        raise SystemExit('Sources unavailable; previous observations retained: ' + ', '.join(failures))


if __name__ == '__main__':
    main()
