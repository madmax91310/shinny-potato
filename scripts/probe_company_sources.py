"""Read-only source diagnostics. Never edits the published observations."""
import datetime as dt
import json
import subprocess
import time
import urllib.error
import urllib.request

NOW = dt.datetime.now(dt.timezone.utc)
UA = 'EpargnantLibre/1.0 https://github.com/madmax91310/shinny-potato'
SYMBOLS = {'AAPL': '0000320193', 'MSFT': '0000789019', 'NVDA': '0001045810',
           'GOOGL': '0001652044', 'AMZN': '0001018724'}
KEYS = ['trailingPeRatio', 'trailingForwardPeRatio', 'trailingPegRatio',
        'annualTotalRevenue', 'quarterlyTotalRevenue', 'annualNetIncome', 'quarterlyNetIncome']


def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        return {'error': 'HTTPError', 'status': error.code}
    except Exception as error:
        return {'error': type(error).__name__}


report = {'checkedAt': NOW.isoformat(), 'companies': {}}
for symbol, cik in SYMBOLS.items():
    url = f'https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json'
    sec = get(url)
    item = {'sec': {'cik': sec.get('cik')} if 'facts' in sec else sec}
    # Compare the same declared automation with curl, without browser impersonation.
    if symbol == 'AAPL':
        proc = subprocess.run(['curl', '--silent', '--show-error', '--max-time', '30',
                               '--user-agent', UA, '--output', '/tmp/sec-probe.json',
                               '--write-out', '%{http_code}', url], capture_output=True, text=True)
        item['secCurl'] = {'httpStatus': proc.stdout, 'exitCode': proc.returncode}
    url = (f'https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{symbol}'
           '?type=' + ','.join(KEYS) + '&period1=1672531200&period2=' + str(int(NOW.timestamp())))
    body = get(url)
    if 'timeseries' in body:
        series = body['timeseries']
        item['yahoo'] = {'error': series.get('error'), 'series': {}}
        for row in series.get('result') or []:
            key = row['meta']['type'][0]
            values = row.get(key) or []
            if values:
                latest = max(values, key=lambda value: value['asOfDate'])
                item['yahoo']['series'][key] = {'symbol': row['meta']['symbol'],
                    'asOfDate': latest['asOfDate'], 'periodType': latest['periodType'],
                    'currency': latest.get('currencyCode'), 'value': latest['reportedValue']['raw'],
                    'ageDays': (NOW.date() - dt.date.fromisoformat(latest['asOfDate'])).days}
    else:
        item['yahoo'] = body
    nasdaq = get(f'https://api.nasdaq.com/api/analyst/{symbol}/earnings-forecast')
    if isinstance(nasdaq.get('data'), dict):
        source = nasdaq['data']
        item['nasdaq'] = {'symbol': source.get('symbol'),
            'annual': source.get('yearlyForecast'), 'quarterly': source.get('quarterlyForecast')}
    else:
        item['nasdaq'] = nasdaq
    report['companies'][symbol] = item
    print(symbol, json.dumps(item), flush=True)
    time.sleep(1)
with open('/tmp/company-source-probe.json', 'w') as file:
    json.dump(report, file, indent=2)
