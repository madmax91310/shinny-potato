"""Independent renewable qualification of historical share basis.

Fail closed on any split in the whole history: comparative statements may already
be restated, so blindly multiplying counts by quote split factors is unsafe.
"""
import datetime as dt
import math
import urllib.parse

VERSION = 1

def qualify_share_basis(company, profile, fetch, today):
    rows = company.get('decision', {}).get('years', [])
    if profile['id'] in ('alphabet', 'meta', 'visa'):
        raise ValueError('Multiple share classes require a separate model')
    if len(rows) < 4 or any(not isinstance(r.get('averageDilutedShares'), (int,float))
        or not math.isfinite(r['averageDilutedShares']) or r['averageDilutedShares'] <= 0
        or not r.get('sharesBasisSource','').startswith('https://') for r in rows):
        raise ValueError('Four annual published diluted share counts required')
    first = dt.date.fromisoformat(rows[0]['end'])
    start = int(dt.datetime(first.year-1, first.month, min(first.day,28), tzinfo=dt.timezone.utc).timestamp())
    end = int(dt.datetime.combine(today+dt.timedelta(days=1),dt.time(),tzinfo=dt.timezone.utc).timestamp())
    url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(profile['symbol'])+f'?period1={start}&period2={end}&interval=1mo&events=splits'
    data = fetch(url)['chart']['result'][0]
    meta = data.get('meta', {})
    if meta.get('symbol') != profile['symbol'] or meta.get('currency') != profile['currency']:
        raise ValueError('Share basis quote identity/currency mismatch')
    timestamps = data.get('timestamp', [])
    if not timestamps or min(timestamps) > start+40*86400 or max(timestamps) < end-40*86400:
        raise ValueError('Incomplete full-window quote coverage')
    if data.get('events', {}).get('splits'):
        raise ValueError('Split in historical window: issuer restatement certification required')
    latest = max(x['end'] for x in [company.get('annual'),company.get('quarter'),company.get('halfYear')] if x)
    return {'version':VERSION,'observedAt':today.isoformat(),'annualEnd':company['annual']['end'],
        'accountsEndAtCollection':latest,'currency':profile['currency'],'sourceUrl':url,
        'splitCheckFrom':dt.datetime.fromtimestamp(start,dt.timezone.utc).date().isoformat(),
        'splitCheckThrough':today.isoformat(),'definition':'Published annual diluted averages; no split observed across the complete historical window'}
