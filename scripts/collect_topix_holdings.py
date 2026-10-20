"""Official TOPIX weights, with separately proved Tokyo security identities.

An ETF supplies identities only, never index weights or inferred ISINs. The
complete published member list may still have explicitly unidentified weights.
"""
import csv
import datetime as dt
import io
import json
import re
from urllib.parse import urljoin, urlsplit, parse_qs, urlencode
from bs4 import BeautifulSoup
from issuer_documents import download, document_date, pdf_text, proof

JPX='https://www.jpx.co.jp/automation/markets/indices/topix/files/topixweight_j.csv'
IDENTITY='https://www.blackrock.com/jp/individual-en/en/products/279438/ishares-core-topix-etf'
HEADERS=['日付','銘柄名','コード','業種','TOPIXに占める個別銘柄のウエイト','ニューインデックス区分']
SHARES={'FR0013411980':False,'FR0013411998':True}


def jpx_rows(raw, now):
    reader=csv.DictReader(io.StringIO(raw.decode('cp932')))
    if reader.fieldnames!=HEADERS:raise ValueError('TOPIX CSV schema changed')
    rows=[];dates=set();footer=False
    for entry in reader:
        if not re.fullmatch(r'\d{8}',entry['日付'] or ''):
            # The publisher appends a note/disclaimer block with no tabular fields.
            if any(entry.get(k) for k in HEADERS[1:]) or None in entry:raise ValueError('Malformed TOPIX data/footer')
            if not footer and entry['日付'] and not entry['日付'].startswith('（注1）'):raise ValueError('Unknown TOPIX footer')
            footer=True;continue
        if footer:raise ValueError('TOPIX data after footer')
        if not re.fullmatch(r'[0-9A-Z]{4}',entry['コード']) or not entry['銘柄名'] or not entry['業種']:raise ValueError('Invalid TOPIX member')
        if entry['ニューインデックス区分'] not in ('TOPIX Core30','TOPIX Large70','TOPIX Mid400','TOPIX Small 1','TOPIX Small 2'):raise ValueError('Unknown TOPIX segment')
        weight=entry['TOPIXに占める個別銘柄のウエイト']
        if not re.fullmatch(r'\d+\.\d{4}%',weight):raise ValueError('TOPIX published precision changed')
        value=float(weight[:-1])
        if not 0<=value<=100:raise ValueError('Invalid TOPIX weight')
        dates.add(document_date(dt.datetime.strptime(entry['日付'],'%Y%m%d').date().isoformat(),now))
        rows.append({'memberCode':entry['コード'],'name':entry['銘柄名'],'weightPct':value})
    if not 1000<=len(rows)<=5000 or len({r['memberCode']for r in rows})!=len(rows) or len(dates)!=1:raise ValueError('Truncated, duplicate or mixed-date TOPIX')
    stamp=dates.pop()
    if (dt.date.fromisoformat(stamp)+dt.timedelta(days=1)).day!=1:raise ValueError('TOPIX weights must describe a month end')
    # Four published decimals per position: allow their cumulative rounding only.
    if abs(sum(r['weightPct']for r in rows)-100)>len(rows)*0.00005+1e-8:raise ValueError('Incomplete TOPIX weights')
    return rows,stamp


def identity_route(page,now):
    soup=BeautifulSoup(page,'html.parser')
    field=soup.select('.col-isin .data')
    if len(field)!=1 or field[0].get_text(strip=True)!='JP3048120004':raise ValueError('Wrong TOPIX identity fund')
    tabs=soup.select('#allHoldingsTab[data-ajaxuri]')
    if len(tabs)!=1:raise ValueError('Missing TOPIX identity table')
    options=tabs[0].select('option[selected]')
    if len(options)!=1:raise ValueError('Missing identity snapshot')
    stamp=document_date(dt.datetime.strptime(options[0]['value'],'%Y%m%d').date().isoformat(),now)
    url=urljoin(IDENTITY,tabs[0]['data-ajaxuri']);parsed=urlsplit(url)
    query=parse_qs(parsed.query)
    if parsed.scheme!='https' or parsed.netloc!='www.blackrock.com' or not parsed.path.startswith('/jp/individual-en/en/products/279438/fund/') or query!={'tab':['all'],'fileType':['json']}:raise ValueError('Unexpected TOPIX identity source')
    return url+'&asOfDate='+options[0]['value'],stamp


def identity_rows(raw):
    body=json.loads(raw.decode('utf-8-sig'));rows=body['aaData'];identities={}
    if not 1000<=len(rows)<=6000:raise ValueError('Truncated TOPIX identity table')
    for row in rows:
        if len(row)!=17:raise ValueError('TOPIX identity schema changed')
        if row[3]!='Equity':continue
        if row[13]!='Tokyo Stock Exchange' or row[16]!='JPY':continue
        if not re.fullmatch(r'[0-9A-Z]{4}',row[0]) or not re.fullmatch(r'JP[A-Z0-9]{9}\d',row[9] or ''):raise ValueError('Unqualified Tokyo code / ISIN')
        if row[0] in identities and identities[row[0]]['isin']!=row[9]:raise ValueError('Conflicting Tokyo code')
        identities[row[0]]={'isin':row[9],'name':row[1]}
    return identities


def historical_identities(page,url,stamp,now,fetch):
    """Accept a historical response only if its printed CSV date and JSON agree."""
    soup=BeautifulSoup(page,'html.parser')
    links={urljoin(IDENTITY,a['href'])for a in soup.select('a[href]') if a.get_text(' ',strip=True)=='Download Holdings' and 'fileType=csv' in a['href']}
    if len(links)!=1:raise ValueError('Missing historical identity download')
    csv_url=links.pop();parsed=urlsplit(csv_url)
    if parsed.netloc!='www.blackrock.com' or not parsed.path.startswith('/jp/individual-en/en/products/279438/fund/'):raise ValueError('Unexpected historical identity source')
    stamp_arg=stamp.replace('-','');csv_url+='&asOfDate='+stamp_arg
    raw=fetch(csv_url);lines=list(csv.reader(io.StringIO(raw.decode('utf-8-sig'))))
    if not lines or lines[0]!=['Fund Holdings as of',stamp.replace('-','/')]:raise ValueError('Historical identity CSV does not confirm the requested date')
    header=next((i for i,row in enumerate(lines)if row[:2]==['Ticker','Name']),None)
    if header is None:raise ValueError('Historical identity CSV schema missing')
    table=list(csv.DictReader(io.StringIO('\n'.join(','.join('"'+cell.replace('"','""')+'"' for cell in row)for row in lines[header:]))))
    actual={r['Ticker']:float(r['Weight (%)'].replace(',','')) for r in table if r.get('Asset Class')=='Equity' and r.get('Exchange')=='Tokyo Stock Exchange' and r.get('Market Currency')=='JPY'}
    history_url=re.sub(r'([?&]asOfDate=)\d{8}',lambda m:m[1]+stamp_arg,url)
    body=fetch(history_url);payload=json.loads(body.decode('utf-8-sig'));rows=payload['aaData']
    expected={r[0]:float(r[5]['display'].replace(',','')) for r in rows if len(r)==17 and r[3]=='Equity' and r[13]=='Tokyo Stock Exchange' and r[16]=='JPY'}
    if not actual or actual!=expected:raise ValueError('Historical CSV / identity JSON disagree')
    return identity_rows(body),{'sourceUrl':history_url,'asOf':stamp,'sha256':proof(body),'dateSourceUrl':csv_url,'dateSha256':proof(raw)}


def combine(rows,identities,stamp):
    output=[{**r,'isin':identities.get(r['memberCode'],{}).get('isin'),
             'name':identities.get(r['memberCode'],{}).get('name',r['name'])}for r in rows]
    unresolved=[r for r in output if r['isin'] is None]
    known=[r['isin']for r in output if r['isin']]
    if len(set(known))!=len(known):raise ValueError('Duplicate TOPIX security identities')
    return {'rows':output,'asOf':stamp,'basis':'index','index':'TOPIX','indexId':'topix',
            'scope':'equity-index','complete':True,'unidentifiedSecurityCount':len(unresolved),
            'unidentifiedWeightPct':round(sum(r['weightPct']for r in unresolved),8),
            'method':'Full official JPX TOPIX month-end member weights, without renormalisation; exact Tokyo codes/JPY mapped to separately dated BlackRock identities only. Unknown identities remain explicit. Equity index exposure excludes fund cash, fees, swaps and currency hedges.'}


def qualify_share(text,isin,now):
    text=' '.join(text.split())
    title='Amundi PEA Japon (TOPIX) UCITS ETF EUR '+('Hedged Acc' if SHARES[isin] else 'Acc')
    header=text.split("Objectif d'investissement",1)[0]
    dates=re.findall(r'\b\d{2}/\d{2}/\d{4}\b',header)
    if title not in header or len(dates)!=1 or isin not in text:raise ValueError('Wrong TOPIX share/report identity')
    stamp=document_date(dates[0],now)
    if not re.search(r'performance de l.indice TOPIX \(',text) or '(.TOPXDV)' not in text or '(TPXDDVD)' not in text:raise ValueError('TOPIX exact economic benchmark changed')
    return stamp


def collect(share,now,fetch=download):
    if share['isin'] not in SHARES or share.get('currency')!='EUR':raise ValueError('Unqualified TOPIX share')
    # Exact-share current document proves the economic benchmark, not holdings.
    document=fetch(share['identitySourceUrl']);share_stamp=qualify_share(pdf_text(document),share['isin'],now)
    raw=fetch(JPX);rows,stamp=jpx_rows(raw,now)
    if share_stamp<stamp:raise ValueError('TOPIX benchmark proof predates index composition')
    page=fetch(IDENTITY);url,identity_stamp=identity_route(page,now);ids=fetch(url)
    identities=identity_rows(ids);history=None;history_error=None
    # Historical identities take precedence for historical index members; if the
    # issuer no longer serves that date, current identities remain separately dated.
    try:
        old_ids,history=historical_identities(page,url,stamp,now,fetch)
        identities={**identities,**old_ids}
    except Exception as error:
        history_error=str(error)[:300]
    result=combine(rows,identities,stamp)
    if history:result['identityHistory']=history
    elif history_error:result['identityHistoryError']=history_error
    result.update(sourceUrl=JPX,sha256=proof(raw),identitySourceUrl=url,identitySha256=proof(ids),
                  identityAsOf=identity_stamp,shareAsOf=share_stamp,shareSourceUrl=share['identitySourceUrl'],shareSha256=proof(document),
                  sourceUrls=[JPX,url,share['identitySourceUrl'],*([history['sourceUrl'],history['dateSourceUrl']] if history else [])])
    return result
