"""Public, visible adjusted EPS estimates and like-for-like multiple references.
No paid/hidden forecast cells are read. Missing definitions fail closed.
"""
import datetime as dt
import math
import re
import hashlib
from bs4 import BeautifulSoup
from company_publications import get


def number(text, positive=True):
    try:
        value = float(text.replace(',', '').replace('−', '-'))
        return value if math.isfinite(value) and (not positive or value > 0) else None
    except ValueError:
        return None


def parse_forecast(raw, profile, today):
    soup = BeautifulSoup(raw, 'html.parser')
    text = soup.get_text(' ', strip=True)
    if f"({profile['symbol']})" not in soup.title.get_text() or profile['currency'] != 'USD':
        raise ValueError('Forecast identity/currency mismatch')
    if 'EPS and Forward PE are based on non-GAAP adjusted numbers.' not in text:
        raise ValueError('Adjusted EPS/PE definition missing')
    updated = re.search(r'Last updated: ([A-Za-z]+ \d{1,2}, \d{4})', text)
    if not updated:
        raise ValueError('Source update date missing')
    asof = dt.datetime.strptime(updated[1], '%b %d, %Y').date()
    if not 0 <= (today-asof).days <= 35:
        raise ValueError('Forecast source is stale or future dated')
    tables = [t for t in soup.select('table') if t.get_text(' ',strip=True).startswith('Fiscal Year')]
    if len(tables) != 1:
        raise ValueError('Ambiguous annual forecast table')
    rows = {}
    for tr in tables[0].select('tr'):
        cells = [c.get_text(' ',strip=True) for c in tr.find_all(['th','td'],recursive=False)]
        if cells:
            if cells[0] in rows: raise ValueError('Duplicate annual row')
            rows[cells[0]] = cells[1:]
    dates = [dt.datetime.strptime(x,'%b %d, %Y').date().isoformat() for x in rows['Period Ending']]
    if dates != sorted(set(dates)) or any(len(rows[k]) != len(dates) for k in ('EPS','Forward PE')):
        raise ValueError('Misaligned forecast dates')
    eps = [number(v, positive=False) for v in rows['EPS']]
    visible = [i for i,v in enumerate(eps) if v is not None]
    if len(visible)<2: raise ValueError('Two dated comparable EPS required')
    current = visible[-1]
    def card(label):
        found = soup.find_all(string=lambda s:s and s.strip()==label)
        if len(found)!=1: raise ValueError('Missing/ambiguous EPS card')
        content = found[0].parent.parent.get_text(' ',strip=True).replace('−', '-')
        match = re.search(re.escape(label)+r'\s+([+-]?[\d.,]+)\s+from\s+([+-]?[\d.,]+)',content)
        if not match: raise ValueError('Unrecognised EPS card')
        return number(match[1], positive=False),number(match[2], positive=False)
    this,previous = card('EPS This Year'); following,base = card('EPS Next Year')
    if this != eps[current] or previous != eps[current-1] or base != this or following is None or current+1>=len(dates):
        raise ValueError('Annual table/cards do not reconcile')
    if not 0 < (dt.date.fromisoformat(dates[current+1])-today).days <= 800:
        raise ValueError('Next fiscal estimate is not a future annual period')
    points=[{'end':dates[i],'eps':eps[i],'kind':'observed-adjusted' if i<current else 'estimate'} for i in visible]
    points.append({'end':dates[current+1],'eps':following,'kind':'estimate'})
    refs=[{'end':dates[i],'multiple':number(v)} for i,v in enumerate(rows['Forward PE']) if i<current and number(v)]
    # Keep observed losses/zero EPS even when too few positive multiples remain.
    # The presentation model independently requires three comparable multiples.
    return {'version':1,'symbol':profile['symbol'],'currency':'USD','basis':'adjusted-non-gaap',
        'multipleBasis':'forward-adjusted-eps','sourceUrl':f"https://stockanalysis.com/stocks/{profile['symbol'].lower()}/forecast/",
        'sourceName':'Stock Analysis / S&P Global','observedAt':today.isoformat(),'asOf':asof.isoformat(),
        'sourceHash':hashlib.sha256(raw).hexdigest(),'points':points,'historicalMultiples':refs,
        'definition':'EPS and Forward PE are based on non-GAAP adjusted numbers.'}


def collect_forecast(profile,today):
    if profile['currency']!='USD': raise ValueError('No qualified source for this listing')
    return parse_forecast(get(f"https://stockanalysis.com/stocks/{profile['symbol'].lower()}/forecast/"),profile,today)


def collect_cash_references(company,profile,fetch,today):
    basis=company.get('valuationShareBasis')
    if not basis: raise ValueError('Qualified split/share basis required')
    data=fetch(basis['sourceUrl'])['chart']['result'][0]
    if data['meta']['symbol']!=profile['symbol'] or data['meta']['currency']!=profile['currency']:
        raise ValueError('Cash multiple quote identity mismatch')
    quotes=[(dt.datetime.fromtimestamp(t,dt.timezone.utc).date().isoformat(),c) for t,c in zip(data['timestamp'],data['indicators']['quote'][0]['close']) if c and math.isfinite(c) and c>0]
    normal={r['end']:r['averageDilutedShares'] for r in basis.get('normalisedYears',[])}
    refs=[]
    for row in company['decision']['years']:
        shares=normal.get(row['end'],row['averageDilutedShares'])
        fcf=row.get('freeCashFlow',0)/shares
        # Monthly close timestamp is the START of the bucket: require its entire
        # month to end before the fiscal year-end, avoiding future prices.
        eligible=[]
        for date,price in quotes:
            d=dt.date.fromisoformat(date); month_end=(d.replace(day=28)+dt.timedelta(days=4)).replace(day=1)-dt.timedelta(days=1)
            lag=(dt.date.fromisoformat(row['end'])-month_end).days
            if 0<=lag<=45: eligible.append((date,price,month_end.isoformat()))
        if fcf>0 and eligible:
            date,price,end=eligible[-1]
            refs.append({'end':row['end'],'quotePeriodEnd':end,'price':price,'base':fcf,'multiple':price/fcf,'accountsSourceUrl':row['sourceUrl']})
    if len(refs)<3: raise ValueError('Three comparable historical cash multiples required')
    return {'version':1,'observedAt':today.isoformat(),'annualEnd':company['annual']['end'],'sourceUrl':basis['sourceUrl'],
        'currency':profile['currency'],'historicalMultiples':refs,'definition':'Ex-post annual FCF per diluted share / split-adjusted monthly close; not point-in-time backtest data'}
