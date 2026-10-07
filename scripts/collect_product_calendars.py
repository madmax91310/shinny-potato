"""Exact-product annual returns: issuer NAV table, regulatory chart, product series."""
import datetime as dt
import json
import re
import pathlib
import subprocess
import tempfile
import math
import gzip
import io
import xml.etree.ElementTree as ET
from issuer_documents import bounded_return, document_date, download, pdf_text, proof
from data_automation import reject


def unique(items, label):
    if len(items) != 1:
        reject('Missing or ambiguous calendar ' + label)
    return items[0]


def performance(share, years, stamp, url, digest, method):
    if not years:
        reject('No completed product calendar year')
    return {'currency':share['currency'], 'basis':'fund', 'years':years, 'asOf':stamp,
            'sourceUrl':url, 'sha256':digest, 'method':method}


def bitwise_calendar(page, share, now, digest):
    text='\n'.join(page.tokens)
    if ('NAV is displayed in the base currency (USD)' not in text or
            'Performance shown reflects net asset value (NAV) returns' not in text or share['currency']!='USD'):
        reject('Unqualified Bitwise NAV return convention')
    block=text.split('BTCE Performance',1)[1] if text.count('BTCE Performance')==1 else ''
    stamp=dt.datetime.strptime(unique(re.findall(r'^Last updated:\n(\d{2}-\d{2}-\d{4}) ',block.split('Periods',1)[0],re.M),'Bitwise performance date'),'%d-%m-%Y').date().isoformat()
    document_date(stamp,now)
    launch=dt.date.fromisoformat(unique(re.findall(r'Inception Date (\d{4}-\d{2}-\d{2})',block),'Bitwise launch'))
    table=unique([t['rows'] for t in page.tables if t['rows'] and t['rows'][0]==['Year','NAV']],'Bitwise NAV table')
    years={};seen=set()
    for row in table[1:]:
        if len(row)!=2:reject('Malformed Bitwise calendar row')
        label,value=row
        if not re.fullmatch(r'-?\d+(?:\.\d+)?%',value):reject('Invalid Bitwise calendar return')
        if label=='YTD':continue
        m=re.fullmatch(r'(20\d{2})(?: \*\*)?',label)
        if not m:reject('Unknown Bitwise calendar label')
        y=m[1]
        if y in seen or int(y)>=now.year:reject('Duplicate or incomplete Bitwise calendar year')
        seen.add(y)
        if launch<=dt.date(int(y),1,1):years[y]=bounded_return(float(value.rstrip('%')))
    if str(now.year-1) not in years:reject('Bitwise latest completed year absent')
    return performance(share,years,stamp,share['sourceUrl'],digest,'calendar-year exact ETP NAV total return, net of fees')


def pdf_words(body):
    if not body.startswith(b'%PDF-'):reject('Expected regulatory calendar PDF')
    with tempfile.TemporaryDirectory() as folder:
        path=pathlib.Path(folder)/'calendar.pdf';path.write_bytes(body)
        out=subprocess.run(['pdftotext','-bbox',str(path),'-'],capture_output=True,check=True,timeout=20).stdout
    if len(out)>2_000_000:reject('Regulatory calendar extraction too large')
    return [[{'text':w.text or '', 'x':float(w.attrib['xMin']), 'y':float(w.attrib['yMin'])}
             for w in page.findall('.//{*}word')]for page in ET.fromstring(out).findall('.//{*}page')]


def hsbc_chart(pages, now):
    words=unique([p for p in pages if any(w['text']=='Benchmark'for w in p) and any(w['text']=='Performance'for w in p)],'HSBC chart page')
    benchmark=unique([w for w in words if w['text']=='Benchmark'],'HSBC benchmark legend')
    fund=unique([w for w in words if w['text']=='Fund' and w['x']<benchmark['x'] and abs(w['y']-benchmark['y'])<2],'HSBC fund legend')
    if not fund['x']<benchmark['x'] or abs(fund['y']-benchmark['y'])>2:
        reject('HSBC fund/benchmark legend order changed')
    years=sorted([w for w in words if re.fullmatch(r'20\d{2}',w['text']) and
                  fund['y']<w['y']<fund['y']+180 and w['x']<300],key=lambda w:w['x'])
    if len(years)!=10 or [int(w['text'])for w in years]!=list(range(now.year-10,now.year)):
        reject('HSBC ten complete calendar years absent')
    result={}
    for i,year in enumerate(years):
        left=year['x']-1
        right=years[i+1]['x']-1 if i+1<len(years) else year['x']+23
        bars=sorted([w for w in words if left<w['x']<right and fund['y']<w['y']<year['y'] and
                     re.fullmatch(r'-?\d+\.\d+',w['text'])],key=lambda w:w['x'])
        if len(bars)!=2 or not 3<bars[1]['x']-bars[0]['x']<8:
            reject('HSBC calendar fund/benchmark bars ambiguous')
        result[year['text']]=bounded_return(float(bars[0]['text']))
    return result


def hsbc_calendar(body, share, now):
    text=pdf_text(body)
    isin=unique(re.findall(r'ISIN:\s*([A-Z0-9]{12})',text),'HSBC ISIN')
    currency=unique(re.findall(r'Class:\s*([A-Z]{3})',text),'HSBC class currency')
    if isin!=share['isin'] or currency!=share['currency']:reject('Wrong HSBC calendar share/currency')
    if ('net asset value with distributable' not in text or 'income reinvested' not in text or
            'Past performance takes account of all ongoing' not in text):reject('HSBC total return convention absent')
    stamp=document_date(unique(re.findall(r'accurate as at (\d+ [A-Za-z]+ 20\d{2})',text),'HSBC KIID date'),now,max_age=400)
    if dt.date.fromisoformat(stamp).year!=now.year:reject('HSBC annual KIID not renewed this year')
    return performance(share,hsbc_chart(pdf_words(body),now),stamp,share['calendarUrl'],proof(body),
                       'calendar-year exact-share NAV total return, income reinvested, net of ongoing charges (KIID precision 0.1%)')


def coinshares_calendar(payload, share, now, url):
    isin=share['isin']
    def widget(key):return unique([w for w in payload if w['key']==key],'CoinShares widget')
    stats=widget('ISIN_KEYSTATS_'+isin)['sections']
    def fields(section):
        rows=section['meta']
        if len({r['key']for r in rows})!=len(rows):reject('Duplicate CoinShares calendar metadata')
        return {r['key']:r['value']for r in rows}
    identity=fields(unique([s for s in stats if any(m['key']=='iSIN'for m in s.get('meta',[]))],'CoinShares identity'))
    overview=fields(unique([s for s in stats if s['key']==isin+'_OVERVIEW'],'CoinShares overview'))
    if identity['iSIN']!=isin or share['currency']!='USD' or share.get('aumCurrency')!='USD':reject('Wrong CoinShares calendar identity/currency')
    launch=dt.date.fromisoformat(identity['issueDate'])
    stamp=document_date(overview['rateDate'],now,max_age=10)
    sections=widget('GRAPH_WIDGET_'+isin)['sections']
    section=unique([s for s in sections if s['key']=='GRAPH_SECTION_'+isin],'CoinShares graph section')
    series=unique([s for s in section['graph']['series'] if s['key']==isin],'CoinShares product series')
    if series['scaleY']!='PERCENT' or series.get('suffixY')!='%' or series['scaleX']!='DAY':reject('CoinShares normalized product scale changed')
    document_date(series['updated'].split('T')[0],now,max_age=10)
    dates=[dt.datetime.strptime(d,'%Y/%m/%d').date()for d in series['dataX']]
    values=[float(v)for v in series['dataY']]
    import math
    if (len(dates)!=len(values) or not dates or dates!=sorted(set(dates)) or
            any(not math.isfinite(v) or v<=0 for v in values) or dates[0]!=launch or values[0]!=100 or
            dates[-1].isoformat()!=stamp):reject('CoinShares product series incomplete or malformed')
    # The issuer graph is normalized to 100; cross-check with its product return,
    # never with the factsheet's unadjusted BTC/ETH price table.
    inception=float(overview['sinceInceptionPerformance'].rstrip('%'))
    if abs(values[-1]-100-inception)>.02:reject('CoinShares normalized product convention mismatch')
    endpoints={}
    for date,value in zip(dates,values):
        if date.month==12 and date.day>=24:endpoints[date.year]=(date,value)
    years={}
    for y in range(launch.year+1,now.year):
        if y not in endpoints or y-1 not in endpoints:reject('CoinShares year-end product observation missing')
        years[str(y)]=bounded_return(round((endpoints[y][1]/endpoints[y-1][1]-1)*100,2))
    return performance(share,years,stamp,url,proof(json.dumps(payload,sort_keys=True).encode()),
                       'calendar-year exact ETP return from issuer normalized USD product series; fees and staking reflected; derived from rounded issuer levels')


def collect_coinshares_calendar(share, now):
    from collect_coinshares_aum import widget_url
    url=widget_url(share,'ISIN_GRAPH_'+share['isin']+'%40%25,ISIN_KEYSTATS_'+share['isin'])
    return coinshares_calendar(json.loads(download(url,max_bytes=6_000_000)),share,now,url)


def issuer_json(body, max_bytes=6_000_000):
    # This API sends gzip even without an Accept-Encoding request header.
    if body.startswith(b'\x1f\x8b'):
        with gzip.GzipFile(fileobj=io.BytesIO(body)) as stream:
            body = stream.read(max_bytes + 1)
    if len(body) > max_bytes:reject('Issuer JSON exceeds decompressed size limit')
    return json.loads(body)


def abtc_calendar(product, history, metrics, share, now, url):
    """Adjusted issuer NAV, independently checked against its monthly returns.

    ABTC's 14:1 split on 12 April 2021 is already reflected in this series.
    Never apply another split factor, or import the old unadjusted PRIIPs bars.
    """
    if not all(p.get('success') is True for p in (product, history, metrics)):
        reject('Unsuccessful 21Shares API response')
    info=product['data'];rows=history['data'];perf=metrics['data']
    if (share['isin']!='CH0454664001' or info['details']['isin']!=share['isin'] or
            info['ticker']!='ABTC' or share['currency']!='USD' or info['currency']['short_name']!='USD'):
        reject('Wrong ABTC calendar share/currency')
    stamp=document_date(info['valuation_date'],now,max_age=10)
    for payload in (product,history,metrics):
        document_date(payload['lastUpdated'].split('T')[0],now,max_age=10)
    launch=dt.date.fromisoformat(info['inception_date'])
    if not rows:reject('Empty ABTC NAV history')
    observations={}
    for row in rows:
        date=dt.date.fromisoformat(row['valuation_date'])
        nav=row['nav_per_share']
        if (date in observations or date<launch or date.isoformat()>stamp or
                row['fiat_denominator']!='USD' or isinstance(nav,bool) or
                not isinstance(nav,(float,int)) or not math.isfinite(nav) or nav<=0):
            reject('Invalid ABTC NAV observation')
        observations[date]=row
    dates=sorted(observations)
    if dates[0]!=launch or dates[-1].isoformat()!=stamp:
        reject('Incomplete ABTC inception/latest NAV history')
    latest=observations[dates[-1]]['nav_per_share'];first=observations[launch]['nav_per_share']
    current=perf['performance_details']
    if (current['valuation_date']!=stamp or abs(latest-info['nav_per_unit'])>.006 or
            abs(latest/first-1-current['since_inception_performance'])>1e-8):
        reject('ABTC NAV and published product performance disagree')
    # An unadjusted history can also have self-consistent monthly returns.
    # Check both sides of the documented split against the underlying price
    # movement solely to detect a spurious factor 14, never to supply returns.
    before=unique([d for d in dates if d==dt.date(2021,4,9)],'ABTC pre-split NAV')
    after=unique([d for d in dates if d==dt.date(2021,4,12)],'ABTC post-split NAV')
    left,right=observations[before],observations[after]
    index_ratio=right['index']/left['index']
    if not math.isfinite(index_ratio) or abs((right['nav_per_share']/left['nav_per_share'])/index_ratio-1)>.01:
        reject('ABTC split adjustment absent or applied twice')
    endpoints={}
    for date in dates:endpoints[(date.year,date.month)]=date
    monthly={}
    for block in perf['performance_monthly']:
        if len(block)!=1:reject('Ambiguous ABTC monthly performance year')
        year,values=next(iter(block.items()))
        if year in monthly:reject('Duplicate ABTC monthly performance year')
        monthly[year]=values
    months=['january','february','march','april','may','june','july','august','september','october','november','december']
    years={}
    for year in range(launch.year+1,now.year):
        values=monthly.get(str(year),{})
        if set(values)!=set(months):reject('Incomplete ABTC monthly calendar year')
        for month,name in enumerate(months,1):
            start=endpoints.get((year-1,12) if month==1 else (year,month-1))
            end=endpoints.get((year,month))
            if not start or not end or (month==12 and end.day<24):
                reject('Missing ABTC month/year-end NAV boundary')
            value=values[name]
            if isinstance(value,bool) or not isinstance(value,(float,int)) or not math.isfinite(value) or value<=-1:
                reject('Invalid ABTC monthly return')
            derived=observations[end]['nav_per_share']/observations[start]['nav_per_share']-1
            if abs(derived-value)>1e-8:reject('ABTC monthly return and NAV history disagree')
        years[str(year)]=bounded_return((math.prod(1+values[m] for m in months)-1)*100)
    return performance(share,years,stamp,url,proof(json.dumps([product,history,metrics],sort_keys=True).encode()),
        'calendar-year exact ETP USD NAV return, net of fees, issuer-adjusted for share splits; monthly issuer returns cross-checked; derived from rounded issuer NAV levels')


def collect_abtc_calendar(share, now):
    base=share['calendarApiBase']
    if base not in ('https://api.primary.21shares.com','https://api.secondary.21shares.com'):
        reject('Unexpected 21Shares calendar API source')
    from concurrent.futures import ThreadPoolExecutor
    urls=[base+'/api/'+endpoint+'/ABTC' for endpoint in
          ('product_details','product_valuation_history','product_performance_metrics')]
    with ThreadPoolExecutor(max_workers=3) as pool:
        payloads=list(pool.map(lambda url:issuer_json(download(url,max_bytes=6_000_000)),urls))
    result=abtc_calendar(*payloads,share,now,urls[1])
    result['validationSources']=urls[::2]
    return result
