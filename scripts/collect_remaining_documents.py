"""Current CoinShares factsheets and UBS issuer factsheets on Swiss Fund Data."""
import calendar
import datetime as dt
import re
import urllib.error
from issuer_documents import download, pdf_text, document_date, proof, validated_rows, bounded_return
from data_automation import reject, number


def match(pattern,text):
    values=re.findall(pattern,text,re.M)
    if not values or len(set(values))!=1:reject('Missing or ambiguous issuer field: '+pattern)
    return values[0]


def coinshares(text,share,now,digest):
    if match(r'ISIN\s+([A-Z0-9]{12})',text)!=share['isin'] or match(r'Base Currency\s+([A-Z]{3})',text)!=share['currency']:
        reject('Wrong CoinShares exact share/currency')
    stamp=document_date(match(r'Factsheet Data as of (\d+ [A-Za-z]+ 20\d{2})',text),now)
    ter=float(match(r'Management Fee\s+(?:Reduced to )?([\d.]+)% p\.a\.',text))
    if not 0<=ter<=5:reject('Invalid CoinShares fee')
    return {**share,'productId':share['isin'],'characteristics':{'terPct':ter,'asOf':stamp,'sourceUrl':share['sourceUrl'],'sha256':digest},
            'unavailable':['aum: not published in this factsheet','performance: calendar table is crypto price performance, excludes product fees','exposures: single crypto asset, no equity countries/sectors']}


def ubs(text,share,now,digest):
    if match(r'ISIN\s+([A-Z0-9]{12})',text)!=share['isin'] or match(r'Currency of fund / share\s+([A-Z]{3}/[A-Z]{3})',text)!=share['currency']+'/'+share['currency']:
        reject('Wrong UBS exact share/currency')
    month,year=match(r'Data as at end-([A-Za-z]+) (20\d{2})',text)
    month=dt.datetime.strptime(month,'%B').month;year=int(year)
    stamp=document_date(dt.date(year,month,calendar.monthrange(year,month)[1]).isoformat(),now)
    ter=float(match(r'TER \(flat fee\)\s+([\d.]+)%',text))
    if not 0<=ter<=5:reject('Invalid UBS expenses')
    amount=number(float(match(r'Total fund assets \('+share['currency']+r' m\)\s+([\d .]+)',text).replace(' ',''))*1e6)
    if amount<=0:reject('Invalid UBS assets')
    result={**share,'productId':share['isin'],'characteristics':{'terPct':ter,'asOf':stamp,'sourceUrl':share['sourceUrl'],'sha256':digest},
            'aum':{'amount':amount,'currency':share['currency'],'scope':'fund','asOf':stamp,'sourceUrl':share['sourceUrl'],'sha256':digest},
            'unavailable':[]}
    # The published window is shorter than six years. Collect its exact fund
    # calendars, excluding the adjacent benchmark and the YTD/rolling columns.
    block = text.split('Performance in % (net of fees)', 1)[1].split('Index3', 1)[0]
    columns = match(r'in %\s+((?:20\d{2}\s+)+)', block).split()
    values = match(r'Fund \('+share['currency']+r'\)\s+([-\d. ]+)\n', block).split()
    if (columns != sorted(set(columns)) or any(int(y)>now.year for y in columns) or len(values) != len(columns)+3
            or int(columns[-1]) != now.year or 'YTD2' not in block or 'Ø p.a.' not in block):
        reject('Invalid UBS calendar/YTD/rolling table layout')
    history = {y: bounded_return(float(v)) for y,v in zip(columns,values) if int(y)<now.year}
    if not history:reject('Missing UBS completed calendar years')
    result['performance'] = {'currency':share['currency'],'basis':'fund',
        'method':'calendar-year exact share NAV total return, net of fees','asOf':stamp,
        'sourceUrl':share['sourceUrl'],'sha256':digest,'years':history}
    # Exposure tables are explicitly the index, not the fund portfolio.
    block=text.split('Index Market exposure (%)',1)[1].split('Index 10 largest equity positions',1)[0]
    countries=[];sectors=[]
    for line in block.splitlines():
        cells=re.split(r' {2,}',line.strip())
        if len(cells)>=2 and re.fullmatch(r'\d+\.\d+',cells[1]):countries.append({'name':cells[0],'weightPct':float(cells[1])})
        if len(cells)>=4 and re.fullmatch(r'\d+\.\d+',cells[3]):sectors.append({'name':cells[2],'weightPct':float(cells[3])})
        elif len(cells)==2 and cells[0]in ('Real Estate','Utilities'):
            countries.pop();sectors.append({'name':cells[0],'weightPct':float(cells[1])})
    holdings=[]
    block=text.split('Index 10 largest equity positions',1)[1].split('Benefits',1)[0]
    for line in block.splitlines():
        cells=re.split(r' {2,}',line.strip())
        for offset in (0,2):
            if len(cells)>offset+1 and re.fullmatch(r'\d+\.\d+',cells[offset+1]):
                holdings.append({'name':cells[offset],'weightPct':float(cells[offset+1])})
    if len(holdings)!=10:reject('UBS top-ten index holdings incomplete')
    for field,rows in [('countries',countries),('sectors',sectors),('holdings',holdings)]:
        result[field]={'rows':validated_rows(rows,field!='holdings'),'asOf':stamp,'basis':'index','sourceUrl':share['sourceUrl'],'sha256':digest}
    return result


def ubs_urls(now):
    # A scheduled attempt discovers the most recent published month; no fixed PDF date.
    year,month=now.year,now.month
    for _ in range(3):
        month-=1
        if month==0:year-=1;month=12
        stamp=f'{year}{month:02d}{calendar.monthrange(year,month)[1]}'
        yield f'https://swissfunddata.ch/sfdpub/docs/fsm-8522_03_03-{stamp}-en.pdf'


def collect_one(share,now):
    if share['parser']=='coinshares-document':
        body=download(share['sourceUrl']);result=coinshares(pdf_text(body),share,now,proof(body))
        from collect_coinshares_aum import collect as collect_aum
        result['aum']=collect_aum(share,now)
        result['unavailable']=[item for item in result['unavailable'] if not item.startswith('aum:')]
        return result
    errors = []
    for url in ubs_urls(now):
        # Both official hostnames serve the same monthly exact-share PDF.
        # A host-specific transport outage must not hide the current publication.
        for candidate in (url, url.replace('https://swissfunddata.ch/', 'https://www.swissfunddata.ch/')):
            try:
                body = download(candidate, headers={'User-Agent':'Mozilla/5.0', 'Accept':'application/pdf'})
            except (urllib.error.URLError, TimeoutError) as e:
                errors.append(f'{candidate}: {e}')
                continue
            except ValueError as e:
                if 'Dokument nicht gefunden | Swiss Fund Data' in str(e):
                    errors.append(f'{candidate}: document not published')
                    continue
                raise
            if not body.startswith(b'%PDF-'):
                errors.append(f'{candidate}: non-PDF response')
                continue
            # Bad identity, currency or stale documents fail closed.
            return ubs(pdf_text(body), {**share,'sourceUrl':candidate}, now, proof(body))
    reject('No current UBS exact-share factsheet published: ' + ' ; '.join(errors))
