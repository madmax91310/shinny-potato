"""Exact public FRED XNDX data table; no graph API, JS execution or price substitution."""
import datetime as dt
import re
from zoneinfo import ZoneInfo
from bs4 import BeautifulSoup
from data_automation import get_text,number,reject

URL='https://fred.stlouisfed.org/data/NASDAQXNDX'

def download(url):
    if url!=URL:reject('Wrong FRED XNDX document URL')
    return get_text(url,('text/html',),max_bytes=2_000_000).encode('utf-8')

def parse(body,now):
    if not isinstance(body,bytes)or not body or len(body)>2_000_000:reject('Invalid bounded FRED XNDX document')
    soup=BeautifulSoup(body.decode('utf-8-sig'),'html.parser')
    tables=soup.select('table[aria-label="metadata - NASDAQ-100 Total Return"]')
    if len(tables)!=1:reject('FRED XNDX identity table missing or ambiguous')
    meta={}
    for tr in tables[0].select('tr'):
        th,td=tr.find('th'),tr.find('td')
        if th is None or td is None:reject('FRED XNDX metadata structure changed')
        key=th.get_text(' ',strip=True)
        if key in meta:reject('Duplicate FRED XNDX metadata')
        meta[key]=td.get_text(' ',strip=True)
    expected={'Title':'NASDAQ-100 Total Return','Series ID':'NASDAQXNDX','Source':'Nasdaq, Inc.','Release':'Nasdaq Daily Index Data (Not a Press Release)','Seasonal Adjustment':'Not Seasonally Adjusted','Frequency':'Daily','Units':'Index'}
    if any(meta.get(k)!=v for k,v in expected.items())or len(tables[0].select('a[href="https://indexes.nasdaq.com/Index/Overview/XNDX"]'))!=1:reject('Wrong FRED index, provider, frequency or variant')
    updated=meta.get('Last Updated','');match=re.fullmatch(r'(\d{4}-\d{2}-\d{2} \d{1,2}:\d{2} [AP]M) (CDT|CST)',updated)
    if not match:reject('FRED publisher update format changed')
    published=dt.datetime.strptime(match[1],'%Y-%m-%d %I:%M %p').replace(tzinfo=ZoneInfo('America/Chicago'))
    if published.tzname()!=match[2]or published>now:reject('Future or inconsistent FRED publisher update')
    data=soup.select('table#data-table-observations');extra=soup.select('#extra-rows')
    if len(data)!=1 or len(extra)!=1 or [c.get_text(strip=True)for c in data[0].select('thead th')]!=['DATE','VALUE']:reject('FRED observations structure changed')
    rows=[]
    for tr in data[0].select('tbody tr'):
        cells=tr.find_all(['th','td'],recursive=False)
        if len(cells)!=2:reject('Incomplete FRED observation row')
        rows.append(tuple(c.get_text(strip=True)for c in cells))
    if extra[0].get_text().split('#')[0].strip():reject('Unexpected FRED extra-row prefix')
    for chunk in extra[0].get_text().split('#')[1:]:
        cells=chunk.strip().split('|')
        if len(cells)!=2:reject('Incomplete FRED extra observation')
        rows.append(tuple(c.strip()for c in cells))
    if not rows or [d for d,_ in rows]!=sorted({d for d,_ in rows}):reject('Missing, duplicated or unordered FRED observations')
    dates=meta.get('Date Range','').split(' to ')
    if dates!=[rows[0][0],rows[-1][0]]:reject('FRED announced range differs from its actual observations')
    for day,value in rows:
        dt.date.fromisoformat(day)
        if day>published.date().isoformat():reject('FRED observations beyond declared publication date')
        if value not in ['', '.']:number(float(value))
    return rows,meta
