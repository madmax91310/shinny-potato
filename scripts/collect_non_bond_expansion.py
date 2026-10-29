"""Renewable issuer identity and NAV calendars for the non-bond expansion."""
import datetime as dt
import json
import re
import urllib.error
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from issuer_documents import public_page, download, pdf_text, proof, document_date, validated_rows
from data_automation import reject

COMMODITY_LABELS = {'Crude Oil (Brent)': 'Pétrole Brent', 'Crude Oil (WTI)': 'Pétrole WTI', 'Natural Gas (Henry Hub)': 'Gaz naturel Henry Hub', 'Coffee': 'Café', 'Cocoa': 'Cacao', 'Wheat': 'Blé'}

MICS = {'LSE':'XLON','London Stock Exchange':'XLON','Deutsche Börse (Primary)':'XETR',
        'Deutsche Börse (Xetra)':'XETR','Xetra':'XETR','Borsa Italiana':'ETFP','Euronext Milan':'ETFP',
        'Euronext (FR)':'XPAR','SIX Swiss Exchange':'XSWX'}

def listings(rows, share, now, url, digest):
    result=[]
    for exchange,currency,ticker,symbol,excerpt in rows:
        if exchange not in MICS or currency not in ('USD','EUR'): continue
        if not ticker or not re.fullmatch(r'[A-Za-z0-9]+\.[A-Za-z]+',symbol):reject('Invalid exact-share listing')
        mic=MICS[exchange]
        result.append({'exchange':'Xetra' if mic=='XETR' else 'London Stock Exchange' if mic=='XLON' else 'Borsa Italiana' if mic=='ETFP' else 'Euronext Paris' if mic=='XPAR' else exchange,
            'mic':mic,'currency':currency,'ticker':ticker,'symbol':symbol,'sourceUrl':url,
            'checkedAt':now.date().isoformat(),'evidenceId':f'{share["isin"]}-{mic}-{ticker}-{currency}',
            'excerpt':share['isin']+' | '+excerpt,'sha256':digest})
    if not result:reject('Missing exact-share listing')
    return result

def parse_ssga_identity(text, share, now):
    soup=BeautifulSoup(text,'html.parser');tables=[]
    for table in soup.find_all('table'):
        tables.append([[c.get_text(' ',strip=True) for c in row.find_all(['td','th'])]for row in table.find_all('tr')])
    facts=next((dict(r for r in rows if len(r)==2)for rows in tables if ['ISIN',share['isin']]in rows),None)
    if not facts or facts['Base Fund Currency']!=share['currency'] or facts['UCITS Compliant']!='Yes':reject('Wrong State Street identity')
    rows=next((r for r in tables if r and r[0]==['Exchange','Trading Currency','Listing Date','Exchange Ticker','SEDOL Code','Bloomberg Code','Reuters Code']),None)
    if not rows:reject('State Street listing layout changed')
    ls=listings([(r[0],r[1],r[3],r[6],' | '.join(r))for r in rows[1:]if len(r)==7],share,now,share['sourceUrl'],proof(text.encode()))
    return {'domicile':facts['Domicile'],'replicationMethod':facts['Replication Method'],
            'inceptionDate':dt.datetime.strptime(facts['Inception Date'],'%d %b %Y').date().isoformat(),'listings':ls}

def index_holdings(h):
    """Reject incomplete index exports before exposing their largest positions."""
    rows=[r for r in h['holdings'] if r.get('isin')]
    if any(not r.get('isin') and r.get('name')!='Cash and/or Derivatives' for r in h['holdings']):reject('Unidentified Invesco security')
    if len(rows)<10 or len({r['isin']for r in rows})!=len(rows):reject('Incomplete index exposure')
    validated_rows([{'name':r['name'],'weightPct':r['weight']}for r in h['holdings']],complete=True)
    return validated_rows([{'name':r['name'],'isin':r['isin'],'weightPct':r['weight']}for r in sorted(rows,key=lambda r:r['weight'],reverse=True)[:10]],complete=False)

def wisdomtree_pdf(share, now, transport_error):
    """Refresh PDF-published fields only; retain, without redating, missing AUM."""
    from collect_public_issuer import wisdomtree_factsheet
    body=download(share['factsheetUrl'],headers={'User-Agent':'Mozilla/5.0','Accept':'application/pdf'})
    result=wisdomtree_factsheet(body,{**share,'collectListings':True},now)
    text=pdf_text(body);flat=' '.join(text.split())
    if share['benchmark'] not in flat or not re.search(r'Domicile\s+Jersey',text) or 'Debt security / ETC' not in text:
        reject('Unqualified commodity benchmark or legal form')
    if not re.search(r'Currency Hedged\s+No',text) or not all(label in text for label in ['Replication Method', 'Synthetic - fully funded', 'collateralised swap', 'avoid taking actual delivery']):
        reject('Unqualified commodity replication or hedge')
    dates=re.findall(r'Inception Date\s+(\d{2}/\d{2}/\d{4})',text)
    if len(set(dates))!=1:reject('Missing or ambiguous commodity inception')
    stamp=result['characteristics']['asOf'];url=share['factsheetUrl'];digest=proof(body)
    result['characteristics'].update(index=share['benchmark'],distribution='Not applicable',domicile='Jersey',
        replicationMethod='Synthetic - fully funded collateralised swap',instrumentType='ETC',
        inceptionDate=dt.datetime.strptime(dates[0],'%d/%m/%Y').date().isoformat(),
        physicalDelivery=False,currencyHedge=False,feeLabel='Management Fee (MER)')
    result['commodityAllocation']={'basis':'fund','asOf':stamp,'sourceUrl':url,'sha256':digest,
        'method':'Single commodity futures exposure in official investment objective; not spot or physical delivery',
        'rows':[{'name':share['commodity'],'label':COMMODITY_LABELS[share['commodity']],'weightPct':100}]}
    result['sourceAttempts']=[{'url':share['sourceUrl'],'reason':str(transport_error)},
                              {'url':url,'status':'validated'}]
    return result

def collect_invesco_listings(share, now, fetch=download):
    """Two official locale routes; an empty response is not a source check."""
    from collect_instrument_metadata import invesco_listing_rows
    attempts=[]
    for locale in ('en_GB', 'fr_FR'):
        url=f'https://dng-api.invesco.com/cache/v1/accounts/{locale}/shareclasses/{share["isin"]}?expand=marketdata&idType=isin&variationType=exchangeTradingInformationWithMarketData'
        try:
            raw=fetch(url)
            parsed=invesco_listing_rows(raw, share['isin'], url)
            rows=listings([(r['exchange'],r['currency'],r['ticker'],r['symbol'],r['excerpt'].removeprefix(share['isin']+' | ')) for r in parsed],share,now,url,proof(raw))
            attempts.append({'url':url,'status':'validated','sha256':proof(raw),'field':'listings'})
            return rows, attempts
        except (ValueError, urllib.error.URLError, TimeoutError, KeyError, TypeError) as error:
            attempts.append({'url':url,'status':'failed','field':'listings','reason':str(error)})
    reject('Official Invesco listings unavailable: '+json.dumps(attempts))


def collect_one(share, now):
    kind=share['expansionKind']
    if kind=='ssga':
        from collect_ssga_etf import parse_page, parse_holdings, get_xlsx
        text=public_page(share['sourceUrl']);result,path=parse_page(text,share,now)
        if not path:reject('Missing State Street holdings document')
        url=urljoin(share['sourceUrl'],path)
        result['holdings']=parse_holdings(get_xlsx(url),share,now);result['holdings']['sourceUrl']=url
        identity=parse_ssga_identity(text,share,now)
        result['characteristics']={**identity,'terPct':result['terPct'],'index':result['index'],'distribution':result['distribution']}
    elif kind=='wisdomtree':
        from collect_public_issuer import wisdomtree, wisdomtree_factsheet, Page
        try: text=public_page(share['sourceUrl'])
        except (urllib.error.URLError, TimeoutError) as error:
            return wisdomtree_pdf(share,now,error)
        result=wisdomtree(text,share,now)
        body=download(share['factsheetUrl']);calendar=wisdomtree_factsheet(body,share,now)
        result['performance']=calendar['performance']
        page=Page(text);tables=[t['rows']for t in page.tables if t['rows']]
        overview=dict(next(t for t in tables if t[0][0]=='Product Overview')[1:])
        if overview.get('Physical Delivery')!='No' or overview.get('Leverage Factor') not in ('N/A','1'):reject('Unexpected commodity structure')
        rows=next(t for t in tables if t[0][:4]==['Country','Exchange','Trading Currency','Exchange Ticker'])
        if any(r[7]!=share['isin']for r in rows[1:]):reject('Commodity listing identity changed')
        ls=listings([(r[1],r[2],r[3],r[5],' | '.join(r))for r in rows[1:]],share,now,share['sourceUrl'],proof(text.encode()))
        doc=pdf_text(body)
        if overview['Underlying exposure']!=share['commodity'] or share['benchmark'] not in ' '.join(doc.split()):reject('Commodity benchmark/exposure changed')
        if not re.search(r'Domicile\s+Jersey',doc) or 'Debt security / ETC' not in doc:reject('Unqualified commodity legal form')
        result['characteristics'].update(index=share['benchmark'],distribution='Not applicable',domicile='Jersey',
            replicationMethod='Synthetic - fully funded collateralised swap',instrumentType='ETC',
            inceptionDate=dt.datetime.strptime(overview['Inception Date'],'%d %B %Y').date().isoformat(),listings=ls,
            physicalDelivery=False,currencyHedge=False,feeLabel='Management Fee (MER)')
        result['commodityAllocation']={'basis':'fund','asOf':result['characteristics']['asOf'],'sourceUrl':share['sourceUrl'],
            'sha256':proof(text.encode()),'method':'Single commodity futures exposure; not spot or physical delivery',
            'rows':[{'name':share['commodity'],'label':COMMODITY_LABELS[share['commodity']],'weightPct':100}]}
        result['unavailable']=[]
    elif kind=='invesco':
        from collect_invesco_etf import parse_document
        body=download(share['sourceUrl']);result=parse_document(body,share,now)
        base='https://dng-api.invesco.com/cache/v1/accounts/en_GB/shareclasses/'+share['isin']
        ls, attempts=collect_invesco_listings(share,now,download)
        result['sourceAttempts']=attempts
        # Check the official product's ISIN and share currency independently of its trading rows.
        page=BeautifulSoup(public_page(share['pageUrl']),'html.parser')
        if page.find('meta',attrs={'name':'isin'})['content']!=share['isin']:reject('Wrong Invesco listing product')
        identity=json.loads(download(base+'?expand=nav&idType=isin&variationType=generalSecurityInformation'))
        if identity['shareClassCurrency']!=share['currency'] or identity['ucitsCompliant']!='Yes':reject('Wrong Invesco share currency')
        document_date(identity['effectiveDate'],now)
        result['characteristics']={'terPct':result['terPct'],'index':result['index'],'distribution':'Accumulating',
            'domicile':'Ireland','replicationMethod':'Physical','inceptionDate':identity['shareClassInceptionDate'],'listings':ls}
        url=base+'/holdings/index?idType=isin';raw=download(url);h=json.loads(raw);stamp=document_date(h['effectiveDate'],now)
        result['holdings']={'rows':index_holdings(h),
            'asOf':stamp,'basis':'index','sourceUrl':url,'sha256':proof(raw)}
        from collect_invesco_allocations import collect_allocations
        result.update(collect_allocations(body, share, now))
        result['unavailable']=[]
    else:reject('Unknown non-bond issuer')
    if not result.get('performance',{}).get('years'):reject('Missing complete NAV calendar')
    return result
