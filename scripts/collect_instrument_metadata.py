"""Refresh explicitly published characteristics; an accessible URL is never evidence of a field."""
import argparse
import datetime as dt
import hashlib
import html
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from data_automation import UTC, write_json_atomic
from issuer_documents import download, pdf_text
from issuer_routes import vaneck_factsheet_candidates
from metadata_transport import TRANSPORT
from metadata_incidents import qualification_failures, report_incidents
ROOT=Path(__file__).resolve().parents[1]
FIELDS=tuple(json.loads((ROOT/'scripts/instrument-metadata-fields.json').read_text())['owned'])
# Thresholds come from the single freshness policy (src/data/freshness-policy.json),
# shared with the field freshness report (report-asset-fields.mjs).
POLICY=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']
RENEWAL_GRACE_DAYS=POLICY['etf.default']['checkDays']
# Legal domicile and replication method only change through a prospectus amendment or a
# fund merger: one unavailable issuer page must not raise a daily incident. They are
# still re-read daily, published as soon as observed, and must be renewed within a year.
STATIC_RENEWAL_DAYS={field:POLICY['etf.staticCharacteristic']['checkDays'] for field in POLICY['etf.staticCharacteristic']['fields']}
# Any language of a regional factsheet (fr/en, fr/fr...) or the UCITS one; see issuer_routes.
VANECK_FACTSHEET=re.compile(r'https://www\.vaneck\.com/(?:ucits|[a-z]{2}/[a-z]{2})/library/fact-sheets/[a-z0-9]+-fact-sheet\.pdf')
# Amundi publishes exact-share characteristics and listings through a POST API only: a GET on this
# URL answers 405 and had left every Amundi instrument without metadata or listing evidence.
AMUNDI_API='https://www.amundietf.fr/mapi/ProductAPI/getProductsData'
AMUNDI_CHARACTERISTICS=['ISIN','DISTRIBUTION_POLICY','FUND_REPLICATION_METHODOLOGY','FUND_PEA','LISTINGS','MAIN_LISTINGS']
# Exchange labels as the issuers print them, mapped to the MIC used across the registries.
EXCHANGE_MICS={'London Stock Exchange':'XLON','LSE':'XLON','Deutsche Boerse Xetra':'XETR','Xetra':'XETR','XETRA':'XETR',
  'Euronext Amsterdam':'XAMS','Nyse Euronext - Euronext Paris':'XPAR','Euronext Paris':'XPAR','Borsa Italiana':'ETFP','SIX Swiss Exchange':'XSWX',
  'SIX Swiss Ex':'XSWX','Bolsa Mexicana De Valores':'XMEX','Cboe Europe':'CEUX','Santiago Stock Exchange':'XSGO'}
CANONICAL_EXCHANGES={'XLON':'London Stock Exchange','XETR':'Xetra','XAMS':'Euronext Amsterdam','XPAR':'Euronext Paris','ETFP':'Borsa Italiana','XSWX':'SIX Swiss Exchange','XMEX':'Bolsa Mexicana De Valores','CEUX':'Cboe Europe','XSGO':'Santiago Stock Exchange'}
SYMBOL=re.compile(r'[A-Za-z0-9]+\.[A-Za-z]+')

def fetch_amundi(isin):
    from collect_amundi_etf import fetch_api,request_payload
    payload=request_payload([{'isin':isin}],dt.datetime.now(UTC))
    payload.update(characteristics=AMUNDI_CHARACTERISTICS,breakDown={'aggregationFields':[]},metrics=[],historics=[])
    return json.dumps(fetch_api(payload),ensure_ascii=False,sort_keys=True).encode()

def amundi_product(doc,isin):
    products=doc.get('products')
    if not isinstance(products,list) or len(products)!=1:raise ValueError('Missing or multiple Amundi products')
    product=products[0]
    if product.get('productId')!=isin or product.get('characteristics',{}).get('ISIN')!=isin:raise ValueError('Wrong exact-share metadata')
    return product

def dws_identity(body,isin):
    # Product pages also contain holdings, collateral and suggested funds. Their ISINs
    # are not identities of this share. Bind the exchange table to its own key facts.
    doc=json.loads(body);page=doc.get('pdpResult',{})
    facts=page.get('pageSections',{}).get('keyFacts',{})
    basic=[item for item in facts.get('accordionItems',[]) if item.get('id')=='fundinformation-basicinformation']
    if len(basic)!=1:raise ValueError('Missing or multiple DWS product identity sections')
    identities=[item.get('value') for bundle in basic[0].get('listBundle',[]) for item in bundle.get('items',[]) if item.get('key')=='ISIN']
    if not identities or any(value!=isin for value in identities):raise ValueError('Ambiguous listing document identity')
    header=page.get('pageFrame',{}).get('productHeader',{}).get('identifier')
    if header is not None:
        header_ids=[item.get('value') for item in header if item.get('key')=='ISIN']
        if not header_ids or any(value!=isin for value in header_ids):raise ValueError('Conflicting DWS product header identity')
    product_id=doc.get('tealium',{}).get('attributes',{}).get('product_id')
    if product_id is not None and product_id!=isin:raise ValueError('Conflicting DWS product identity')
    return facts

def dws_tables(node):
    # Every table of the product page whose columns name a stock exchange; nothing is read from headings.
    if isinstance(node,dict):
        columns=node.get('columns');values=node.get('values')
        if isinstance(columns,list) and isinstance(values,list) and any(isinstance(c,dict) and c.get('key')=='StockExchange' for c in columns):yield values
        for child in node.values():yield from dws_tables(child)
    elif isinstance(node,list):
        for child in node:yield from dws_tables(child)

def fetch_exchange_document(url):
    import base64,subprocess,urllib.error
    result=subprocess.run(['node',str(Path(__file__).with_name('download-exchange-document.mjs')),url],capture_output=True,timeout=90)
    try:doc=json.loads(result.stdout)
    except (ValueError,TypeError):raise urllib.error.URLError('Exchange browser returned no document')
    if result.returncode:
        if doc.get('status'):raise urllib.error.HTTPError(url,doc['status'],doc.get('error'),None,None)
        raise urllib.error.URLError(doc.get('error','Exchange document unavailable'))
    return base64.b64decode(doc['body'],validate=True),doc['sourceUrl']


def fetch_document(url,fetch=download,isin=None):
    """Returns (body, url actually read)."""
    try:
        if re.fullmatch(r'https://www\.quantalys\.com/(?:Fonds/[1-9]\d*|Recherche/RechercheRapide\?inputSearch=[A-Z]{2}[A-Z0-9]{9}\d)',url) and fetch is download:return TRANSPORT.read(url,fetch=fetch_quantalys_document)
        if re.fullmatch(r'https://live\.euronext\.com/en/product/etfs/[A-Z]{2}[A-Z0-9]{9}\d-[A-Z0-9]{4}',url) and fetch is download:return TRANSPORT.read(url,fetch=fetch_exchange_document)
        if url==AMUNDI_API and fetch is download:return fetch_amundi(isin),url
        if fetch is download and url.startswith('https://www.boursedirect.fr/'):
            # This broker intermittently leaves automated connections unanswered. A
            # source candidate must not consume three 25-second waits per instrument.
            return TRANSPORT.read(url,fetch=download,return_source=True,timeout=8,max_attempts=1,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36','Accept-Language':'fr-FR,fr;q=0.9'})
        if fetch is download:return TRANSPORT.read(url,fetch=download,return_source=True)
        return fetch(url),url
    except ValueError as error:
        # VanEck answers its factsheet URLs with a regional consent page. Like
        # collect_vaneck_etf.py, complete the gate in a browser, then try the same
        # factsheet on the gates listed in issuer-access-routes.json.
        if fetch is not download or 'Expected official PDF' not in str(error) or not VANECK_FACTSHEET.fullmatch(url):raise
        candidates=vaneck_factsheet_candidates(url)
        failures=[]
        for candidate in candidates:
            try:result=subprocess.run(['node',str(Path(__file__).with_name('download-vaneck-document.mjs')),candidate],capture_output=True,timeout=120)
            except subprocess.TimeoutExpired:failures.append(f'{candidate}: timeout');continue
            if not result.returncode:return result.stdout,candidate
            failures.append(f"{candidate}: {result.stderr.decode('utf-8',errors='replace').strip().splitlines()[-1:]}")
        raise ValueError(f"{error}; browser initialisation failed: {' | '.join(failures)[-700:]}")

def renewal_days(field):return STATIC_RENEWAL_DAYS.get(field,RENEWAL_GRACE_DAYS)

def renewal_overdue(field_record,now,field=None):
    try:return (now.date()-dt.date.fromisoformat(field_record.get('checkedAt','')[:10])).days>renewal_days(field)
    except (TypeError,ValueError):return True

def text_of(body):
    if body.startswith(b'%PDF-'):return pdf_text(body)
    text=body.decode('utf-8')
    text=re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>','',text,flags=re.S|re.I)
    return html.unescape(re.sub(r'<[^>]+>','\n',text))

def parse_text(text,isin):
    # Never attribute a comparison table, another share, navigation or footer to this ISIN.
    identities=set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',text))
    if identities!={isin}:raise ValueError('Missing or multiple exact-share identities in metadata document')
    text=re.sub(r'[ \t\r]+',' ',text)
    patterns={
      'distribution':r'(?:Use of (?:Income|Profits)|Income Treatment|Distribution Policy|Affectation des r[ée]sultats|Politique de distribution|^Distribution)\s*[:\n]?\s*(Capitalisation (?:and/or|et/ou) distribution|Accumulating|Distributing|Capitalisation|Distribution|Reinvestment)\b',
      'domicile':r'(?:Fund Domicile|Domicile|Domiciliation(?: du fonds)?|Domicile du fonds)\s*[:\n]?\s*(Ireland|Irlande|Luxembourg|Germany|Allemagne|France|Jersey|Switzerland|Suisse|(?:The )?Netherlands)\b',
      'replicationMethod':r'(?:Replication (?:Method|methodology)|M[ée]thode de r[ée]plication|Replication|R[ée]plication)\s*[:\n]?\s*(Physical(?:\s*\((?:Full replication|Optimised sampling)\))?|Synthetic|Physique|Synth[ée]tique|Direct Replication|Indirect\s*\(Swap Based\))\b',
      'pea':r'(?:PEA eligibility|PEA Eligible|Eligible PEA|[ÉE]ligibilit[ée] (?:au )?PEA|[ÉE]ligibilit[ée] au plan d[’\x27]Epargne en Actions \(PEA\)|PEA berechtigt|[ÉE]ligible (?:au )?PEA|R[ée]gime fiscal PEA)\s*[:\n]?\s*(Yes|No|Oui|Non|Keine|Ja|Nein)\b',
      'currencyHedge':r'(?:Currency Hedged|Currency Hedge|Couverture de change|Couvert contre le risque de change)\s*[:\n]?\s*(Yes|No|Oui|Non)\b',
    }
    result={}
    for field,pattern in patterns.items():
        found=set(re.findall(pattern,text,re.I|re.M))
        if len(found)>1:raise ValueError('Conflicting explicit metadata: '+field)
        if found:
            value=found.pop()
            # VanEck factsheets: "Income Treatment Reinvestment" and "Domicile The Netherlands".
            value={'Reinvestment':'Accumulating','The Netherlands':'Netherlands'}.get(value,value)
            result[field]=value.lower() in ('yes','oui','ja') if field in ('pea','currencyHedge') else value
    # VanEck factsheets print "Product Structure Physical (Full" and wrap "Replication)" onto
    # the next line, after text from the description column.
    if 'replicationMethod' not in result:
        found={(kind+(f' ({scope} {method.lower()})' if scope else '')) for kind,scope,method in re.findall(r'^Product Structure (Physical|Synthetic)(?: \((Full|Optimi[sz]ed)\b[^\n]*\n\s*(Replication|Sampling)\))?',text,re.M)}
        if len(found)>1:raise ValueError('Conflicting explicit metadata: replicationMethod')
        if found:result['replicationMethod']=found.pop()
    if 'pea' not in result:
        badges={line.strip().lower() for line in text.splitlines()}
        positive=bool(badges & {'éligible au pea','eligible au pea'})
        negative=bool(badges & {'non éligible au pea','non eligible au pea'})
        if positive and negative:raise ValueError('Conflicting PEA badge statements')
        if positive or negative:result['pea']=positive
    # Explicit row values on justETF EN/FR. Neither the fund name, trading currency,
    # nor silence about a hedge is evidence. A dash stays unknown.
    hedge_patterns=(
        (r'^\s*Currency risk\s*[:\n]?\s*(Currency unhedged|Currency hedged(?: [A-Z]{3})?)\s*$',lambda v:v.lower().startswith('currency hedged')),
        (r'^\s*Couverture du risque de change\s*[:\n]?\s*(Non couvert contre le risque de change|Couvert(?:ure)? (?:contre le risque de change|en [A-Z]{3}))\s*$',lambda v:not v.lower().startswith('non ')),
    )
    hedges={convert(value) for pattern,convert in hedge_patterns for value in re.findall(pattern,text,re.I|re.M)}
    if 'currencyHedge' in result:hedges.add(result['currencyHedge'])
    if len(hedges)>1:raise ValueError('Conflicting explicit metadata: currencyHedge')
    if hedges:result['currencyHedge']=hedges.pop()
    return result

def parse_json(body,isin):
    doc=json.loads(body)
    if isinstance(doc,dict) and 'products' in doc:
        facts=amundi_product(doc,isin)['characteristics']
        mapping={'DISTRIBUTION_POLICY':'distribution','FUND_REPLICATION_METHODOLOGY':'replicationMethod'}
        values = {field:facts[key] for key,field in mapping.items() if isinstance(facts.get(key),str) and facts[key]}
        # The official website requests this explicit boolean for the exact
        # product. Missing/null/text values never become an ineligibility.
        if type(facts.get('FUND_PEA')) is bool:
            values['pea'] = facts['FUND_PEA']
        return values
    if isinstance(doc,dict) and 'pdpResult' in doc:
        from collect_dws_etf import items
        section=dws_identity(body,isin)
        facts={}
        for item in items(section):
            key=re.sub('<[^>]+>','',str(item['key']))
            if key in ('ISIN','Income treatment','Fund domicile','Investment methodology'):
                if key in facts:raise ValueError('Duplicate DWS exact-share characteristic')
                facts[key]=item['value']
        mapping={'Income treatment':'distribution','Fund domicile':'domicile','Investment methodology':'replicationMethod'}
        values={field:facts[key] for key,field in mapping.items() if isinstance(facts.get(key),str) and facts[key]}
        panels=[item for item in section.get('accordionItems',[]) if item.get('id')=='fundinformation-taxdata']
        if len(panels)>1:raise ValueError('Duplicate DWS tax panel')
        if panels:
            pea=[item for item in panels[0].get('list',{}).get('items',[]) if item.get('key')=='Eligible au PEA']
            if len(pea)>1:raise ValueError('Duplicate DWS PEA statement')
            if pea and pea[0].get('type')=='BOOL' and type(pea[0].get('value'))is bool:values['pea']=pea[0]['value']
        return values
    try:
        points=doc['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        if points['isin']['value']!=isin:raise ValueError('Wrong exact-share metadata')
    except KeyError:
        raise ValueError('No qualified structured metadata parser for this endpoint')
    mapping={'useOfProfitsCode':'distribution','domicile':'domicile','productStructure':'replicationMethod'}
    return {field:points[key]['value'] for key,field in mapping.items() if isinstance(points.get(key,{}).get('value'),str) and points[key]['value']}

def parse_justetf(body,isin):
    """Bind the profile's own basics rows and badge to its explicit header ISIN.

    Related ETFs and promotional securities elsewhere on the page are separate
    instruments. Their names, identifiers and tax badges never enter this scope.
    """
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(body,'html.parser')
    identity=soup.select('[data-testid="etf-profile-header_isin-value"]')
    if len(identity)!=1 or identity[0].get_text(strip=True)!=isin:raise ValueError('Wrong or ambiguous justETF profile identity')
    text=[isin]
    for key in ('distribution-policy','domicile-country','replication','currency-hedge'):
        rows=soup.select(f'[data-testid="etf-basics_row_{key}"]')
        if len(rows)>1:raise ValueError('Duplicate justETF basics row: '+key)
        if rows:
            if len(rows[0].find_all('td',recursive=False))!=2:raise ValueError('Incomplete justETF basics row: '+key)
            text.append(rows[0].get_text('\n',strip=True))
    badges=soup.select('[data-testid="etf-profile-controls_pea-label-text"]')
    if len(badges)>1:raise ValueError('Duplicate justETF PEA badge')
    if badges:text.append(badges[0].get_text(strip=True))
    return parse_text('\n'.join(text),isin)

def fetch_quantalys_document(url):
    import base64,urllib.error
    result=subprocess.run(['node',str(Path(__file__).with_name('download-quantalys-document.mjs')),url],capture_output=True,timeout=90)
    try:doc=json.loads(result.stdout)
    except (ValueError,TypeError):raise urllib.error.URLError('Public fund browser returned no document')
    if result.returncode:
        if doc.get('status'):raise urllib.error.HTTPError(url,doc['status'],doc.get('error'),None,None)
        raise urllib.error.URLError(doc.get('error','Public fund document unavailable'))
    return base64.b64decode(doc['body'],validate=True),doc['sourceUrl']


def parse_extraetf_pea(body,isin,url):
    """Read the exact profile's public server-rendered detail response, not its holdings."""
    from bs4 import BeautifulSoup
    if url!=f'https://extraetf.com/fr/etf-profile/{isin}':raise ValueError('Wrong extraETF profile reference')
    scripts=BeautifulSoup(body,'html.parser').select('script#frontend-state[type="application/json"]')
    if len(scripts)!=1:raise ValueError('Missing or duplicate extraETF profile state')
    def unique(pairs):
        result={}
        for key,value in pairs:
            if key in result:raise ValueError('Duplicate extraETF state key')
            result[key]=value
        return result
    state=json.loads(scripts[0].get_text(),object_pairs_hook=unique)
    if not isinstance(state,dict):raise ValueError('Invalid extraETF profile state')
    packets=[value for value in state.values() if isinstance(value,dict) and value.get('u')=='https://extraetf.com/api-v2/detail/']
    if len(packets)!=1 or packets[0].get('s')!=200:raise ValueError('Missing or ambiguous extraETF detail response')
    data=packets[0].get('b',{});rows=data.get('results')
    if data.get('count')!=1 or not isinstance(rows,list) or len(rows)!=1 or rows[0].get('isin')!=isin:raise ValueError('Wrong or ambiguous extraETF share identity')
    value=rows[0].get('international_features',{}).get('fr',{}).get('PEA')
    return {'pea':value} if type(value)is bool else {}


def parse_francetransactions_pea(body,isin,url):
    """An explicit tax cell in the fund's own identified profile table."""
    from bs4 import BeautifulSoup
    if not re.fullmatch(r'https://www\.francetransactions\.com/bourse/etf/[a-z0-9-]+-'+isin.lower()+r'\.html',url):raise ValueError('Wrong French fund profile reference')
    soup=BeautifulSoup(body,'html.parser');profiles=[]
    for table in soup.select('table.spip'):
        headers=[h.get_text(' ',strip=True) for h in table.select('thead th')]
        if len(headers)!=1 or not headers[0].startswith('Fiche fonds '):continue
        rows=[]
        for row in table.select('tbody > tr'):
            cells=row.find_all(['td','th'],recursive=False)
            if len(cells)==2:rows.append([c.get_text(' ',strip=True) for c in cells])
        identities=[value for key,value in rows if key=='Code ISIN']
        if identities==[isin]:profiles.append(rows)
    if len(profiles)!=1:raise ValueError('Missing or ambiguous French fund identity table')
    values=[value for key,value in profiles[0] if key=='Éligibilité PEA']
    if len(values)!=1:raise ValueError('Missing or duplicate French PEA statement')
    return {'pea':values[0] in ('✅','Oui')} if values[0] in ('✅','❌','Oui','Non') else {}


def parse_quantalys_pea(body,isin,url):
    """The public fund's own characteristics panel, never a screener or PEA-PME row."""
    from bs4 import BeautifulSoup
    if not re.fullmatch(r'https://www\.quantalys\.com/Fonds/[1-9]\d*',url):raise ValueError('No public exact-share fund reference found')
    soup=BeautifulSoup(body,'html.parser')
    identities=[node.get_text(strip=True) for node in soup.select('h1 small')]
    if identities!=[isin]:raise ValueError('Missing or conflicting public fund identity')
    roots=soup.select('[data-ref="root-synthese-fond"]')
    if len(roots)!=1:raise ValueError('Missing or multiple public fund summaries')
    headers=[node for node in roots[0].select('h4') if node.get_text(' ',strip=True)=='Caractéristiques générales']
    if len(headers)!=1:raise ValueError('Missing or multiple fund characteristics panels')
    panel=headers[0].find_parent('div',class_='panel')
    if panel is None:raise ValueError('Missing fund characteristics panel')
    cells=[]
    for row in panel.select('table tr'):
        columns=row.find_all(['th','td'],recursive=False)
        if len(columns)==2 and columns[0].get_text(' ',strip=True)=='Eligible PEA':cells.append(columns[1].get_text(' ',strip=True))
    if len(cells)!=1:raise ValueError('Missing or ambiguous exact PEA statement')
    return {'pea':cells[0]=='Oui'} if cells[0] in ('Oui','Non') else {}


def parse_broker_pea(body,isin):
    """Only explicit PEA cells on an exact-share broker reference page qualify."""
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(body,'html.parser')
    for node in soup(['script','style']):node.decompose()
    identities=set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',soup.get_text(' ',strip=True)))
    if identities!={isin}:raise ValueError('Missing or multiple broker share identities')
    values=set()
    # The tax row must share a table with the exact ISIN. A tariff/promotion table
    # elsewhere on this same page cannot supply the instrument's PEA status.
    tables=[table for table in soup.find_all('table') if set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',table.get_text(' ',strip=True)))=={isin}]
    for row in (row for table in tables for row in table.find_all('tr')):
        cells=[c.get_text(' ',strip=True) for c in row.find_all(['th','td'],recursive=False)]
        if len(cells)!=2:continue
        label,value=cells[0].strip(),cells[1].strip().lower()
        if label=='PEA/PEA-PME/SRD':
            if not re.fullmatch(r'(?:oui|non)\s*/\s*(?:oui|non)\s*/\s*(?:oui|non)',value):continue
            value=value.split('/')[0].strip()
        elif label!='PEA':continue
        if value in ('yes','oui','no','non'):values.add(value in ('yes','oui'))
    if len(values)>1:raise ValueError('Conflicting broker PEA statements')
    return {'pea':values.pop()} if values else {}

LISTING_HOSTS=set(json.loads((ROOT/'scripts/listing-source-hosts.json').read_text())['hosts'])

def bitwise_listing_rows(body, isin):
    """Each issuer trading row carries its own ISIN, currency, venue and codes."""
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(body,'html.parser');rows=[]
    for row in soup.select('.trading__tr[data-exchange-currency]'):
        cells=row.select('.trading__info > .trading__td')
        if len(cells)!=6:raise ValueError('Incomplete Bitwise trading row')
        identities=set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',cells[0].get_text(' ',strip=True)))
        if identities!={isin}:continue
        # The same row must explicitly label the identity and Reuters cell.
        identity_label=cells[0].select_one('.trading__attrname');ric_label=cells[5].select_one('.trading__attrname')
        if identity_label is None or ric_label is None or identity_label.get_text(strip=True)!='ISIN' or ric_label.get_text(strip=True)!='RIC':raise ValueError('Unsupported Bitwise trading columns')
        venue=row.select_one('.trading__title .trading__td a')
        if venue is None:raise ValueError('Missing Bitwise listing venue')
        mic=EXCHANGE_MICS.get(venue.get_text(' ',strip=True));currency=row.get('data-exchange-currency')
        ticker=cells[3].get_text(' ',strip=True).split()
        if not mic or not re.fullmatch(r'[A-Z]{3}',currency or '') or len(ticker)!=2 or not re.fullmatch(r'[A-Za-z0-9]+',ticker[0]):continue
        displayed=row.select_one('.trading__title [data-clipboard]')
        if displayed is None or displayed.get('data-clipboard')!=' '.join(ticker):raise ValueError('Conflicting Bitwise listing tickers')
        for label in cells[5].select('.trading__attrname'):label.decompose()
        symbol=cells[5].get_text(' ',strip=True)
        rows.append(dict(ticker=ticker[0],mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=currency,
                         **({'symbol':symbol} if SYMBOL.fullmatch(symbol) else {}),
                         excerpt=' | '.join([isin,venue.get_text(' ',strip=True),currency,' '.join(ticker),symbol])))
    return rows

def globalx_listing_rows(body, isin):
    """Read only the trading table under the exact share heading, including streamed rows."""
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(body,'html.parser')
    # React streams table fragments outside their destination. Resolve only explicit
    # fragment/placeholder pairs; never execute scripts or use neighbouring shares.
    for fragment, placeholder in re.findall(r'\$RS\("(S:[a-zA-Z0-9]+)","(P:[a-zA-Z0-9]+)"\)',body.decode()):
        target=soup.find_all(id=placeholder); parts=soup.find_all(id=fragment)
        if len(target)!=1 or len(parts)!=1:raise ValueError('Ambiguous Global X streamed listing fragment')
        for child in list(parts[0].contents):target[0].insert_before(child.extract())
        target[0].decompose();parts[0].decompose()
    headings=[h for h in soup.find_all('h2') if set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',h.get_text(' ',strip=True)))=={isin}]
    if len(headings)!=1:raise ValueError('Missing or duplicate Global X exact-share trading heading')
    section=headings[0].find_next_sibling()
    if section is None or section.find('h2') or section.name=='h2':raise ValueError('Missing Global X adjacent trading section')
    if set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',section.get_text(' ',strip=True)))-{isin}:raise ValueError('Mixed Global X trading shares')
    tables=[section] if section.name=='table' else section.find_all('table')
    if len(tables)!=1:raise ValueError('Ambiguous Global X trading table')
    headers=[c.get_text(' ',strip=True) for c in tables[0].find_all('th')]
    if headers[:3]!=['Exchange','Trading Currency','Ticker']:raise ValueError('Unsupported Global X trading columns')
    markets={**EXCHANGE_MICS,'Deutsche Börse Xetra':'XETR'}
    rows=[]
    for tr in tables[0].find_all('tr'):
        cells=[c.get_text(' ',strip=True) for c in tr.find_all('td',recursive=False)]
        if not cells:continue
        if len(cells)!=len(headers):raise ValueError('Incomplete Global X trading row')
        mic=markets.get(cells[0]);ticker=cells[2].split()[0]
        if not mic or not re.fullmatch(r'[A-Z]{3}',cells[1]) or not re.fullmatch(r'[A-Za-z0-9]+',ticker):continue
        rows.append(dict(ticker=ticker,mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=cells[1],excerpt=isin+' | '+' | '.join(cells[:5])))
    return rows

def vanguard_listing_rows(text, isin):
    if set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',text))!={isin}:raise ValueError('Ambiguous Vanguard exact share')
    block=re.search(r'Key ETF facts\s+Exchange ticker\s+SEDOL\s+Reuters\s+Bloomberg[^\n]*\n(.*?)\n\s*Base currency\b',text,re.S)
    if not block:return []
    venues={'London Stock Exchange':('XLON','L'),'SIX Swiss Exchange':('XSWX','S'),
            'NYSE Euronext':('XAMS','AS'),'Euronext':('XAMS','AS'),
            'Deutsche Börse':('XETR','DE'),'Borsa Italiana S.p.A.':('ETFP','MI')}
    venue=None;venue_label=None;rows=[]
    for line in block[1].splitlines():
        if not line.strip():continue
        if line.strip() in venues:venue=venues[line.strip()];venue_label=line.strip();continue
        match=re.fullmatch(r'\s*([A-Z]{3})\s+([A-Z0-9]+)\s+([A-Z0-9]{7})\s+([A-Z0-9]+\.([A-Z]+))\s+.*',line)
        if not match:venue=None;continue
        if not venue or match[5]!=venue[1]:raise ValueError('Vanguard venue and Reuters suffix disagree')
        rows.append(dict(ticker=match[2],mic=venue[0],exchange=CANONICAL_EXCHANGES[venue[0]],currency=match[1],symbol=match[4],excerpt=isin+' | '+venue_label+' '+' '.join(line.split())))
    return rows

def fortuneo_reference_urls(body,isin,url):
    from urllib.parse import urlsplit,parse_qs
    parsed=urlsplit(url)
    if parsed.hostname!='bourse.fortuneo.fr' or parsed.path!='/api/search' or parse_qs(parsed.query)!={'term':[isin]}:
        raise ValueError('Wrong broker discovery identity')
    items=json.loads(body).get('market',{}).get('fortuneo',{}).get('items')
    if not isinstance(items,list):raise ValueError('Invalid broker discovery response')
    urls=[]
    for item in items:
        if not isinstance(item,dict) or item.get('codeIsin')!=isin or item.get('type')!='Tracker':continue
        ticker=item.get('mnemo');place=item.get('codePlace')
        if not isinstance(ticker,str) or not re.fullmatch(r'[A-Z0-9]+(?:-[A-Z0-9]+)*',ticker) or type(place)is not int or not 1<=place<=999999:continue
        if item.get('codeRef')!=f'FTN{place:06d}{isin}':continue
        candidate=f'https://bourse.fortuneo.fr/trackers/cours-etf-{ticker}-{isin}-{place}'
        if candidate not in urls:urls.append(candidate)
    return urls[:3]  # Discovery is not evidence of PEA or of a listing.


def invesco_listing_rows(body,isin,url):
    """The issuer's ISIN-keyed API returns one array of trading rows, not facts JSON."""
    from urllib.parse import urlsplit, parse_qs
    parts=urlsplit(url)
    if parts.scheme!='https' or parts.netloc!='dng-api.invesco.com' or parts.fragment or parts.path not in {f'/cache/v1/accounts/{locale}/shareclasses/{isin}' for locale in ('en_GB','fr_FR')} or parse_qs(parts.query)!={'expand':['marketdata'],'idType':['isin'],'variationType':['exchangeTradingInformationWithMarketData']}:
        raise ValueError('Wrong Invesco exact-share endpoint')
    data=json.loads(body)
    if not isinstance(data,list) or not data:raise ValueError('Missing Invesco listing rows')
    exchanges=EXCHANGE_MICS|{'Deutsche Börse (Xetra)':'XETR','Euronext Milan':'ETFP','Bolsa Mexicana de Valores':'XMEX'}
    rows=[]
    for row in data:
        if not isinstance(row,dict):raise ValueError('Invalid Invesco listing row')
        mic=exchanges.get(row.get('listingExchangeName'));currency=row.get('listingCurrency');ticker=row.get('listingExchangeTicker');symbol=row.get('listingRic')
        if not mic:continue
        if not isinstance(ticker,str) or not re.fullmatch(r'[A-Za-z0-9]+',ticker) or not re.fullmatch(r'[A-Z]{3}',currency or '') or not isinstance(symbol,str) or not SYMBOL.fullmatch(symbol):
            raise ValueError('Incomplete Invesco listing identity')
        # GBX is the published pence unit. Never silently relabel it GBP.
        rows.append(dict(ticker=ticker,mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=currency,symbol=symbol,excerpt=isin+' | '+json.dumps(row,ensure_ascii=False,sort_keys=True)))
    return rows


def borsa_listing_rows(body,isin):
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(body,'html.parser');found=[]
    for table in soup.find_all('table'):
        fields={}
        for tr in table.find_all('tr'):
            cells=tr.find_all(['th','td'],recursive=False)
            if len(cells)!=2:continue
            key,value=[cell.get_text(' ',strip=True) for cell in cells]
            if key in ('Isin Code','MIC','Alphanumeric Code','Trading Currency'):
                if key in fields:raise ValueError('Duplicate exchange identity field')
                fields[key]=value
        if fields.get('Isin Code')!=isin:continue
        mic=fields.get('MIC');ticker=fields.get('Alphanumeric Code');currency=fields.get('Trading Currency')
        if mic not in CANONICAL_EXCHANGES or not re.fullmatch(r'[A-Z]{3}',currency or '') or not re.fullmatch(r'[A-Za-z0-9]+',ticker or ''):continue
        found.append(dict(ticker=ticker,mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=currency,excerpt=isin+' | '+table.get_text(' ',strip=True)))
    if len(found)>1:raise ValueError('Ambiguous exchange identity tables')
    return found


def euronext_listing_rows(body,isin,url):
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(body,'html.parser')
    configs=soup.select('script[data-drupal-selector="drupal-settings-json"]')
    if len(configs)!=1:raise ValueError('Missing exchange instrument settings')
    instrument=json.loads(configs[0].string)['custom']['instrument']
    if instrument.get('isin')!=isin or instrument.get('product_data')!=f"{isin}-{instrument.get('mic')}" or url!=f"https://live.euronext.com/en/product/etfs/{isin}-{instrument.get('mic')}":
        raise ValueError('Wrong exchange exact-share identity')
    currency=[]
    for row in soup.find_all('tr'):
        cells=row.find_all(['th','td'],recursive=False)
        if len(cells)>=2 and cells[0].get_text(strip=True)=='Currency':currency.append(cells[1].get_text(strip=True))
    if len(currency)!=1 or not re.fullmatch(r'[A-Z]{3}',currency[0]):raise ValueError('Missing or ambiguous exchange trading currency')
    mic=instrument.get('mic');ticker=instrument.get('symbol')
    if mic not in CANONICAL_EXCHANGES or not re.fullmatch(r'[A-Za-z0-9]+',ticker or ''):raise ValueError('Unsupported exchange trading identity')
    return [dict(ticker=ticker,mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=currency[0],excerpt=isin+' | '+json.dumps(instrument,sort_keys=True)+' | Currency '+currency[0])]


def scoped_supplement_listings(text,isin):
    """Exchange-published L&G supplements: own ISIN on every trading row."""
    if 'STOCK EXCHANGE LISTINGS' not in text or 'DEALING PROCEDURES' not in text:return []
    block=text.split('STOCK EXCHANGE LISTINGS',1)[1].split('DEALING PROCEDURES',1)[0]
    if not all(label in block for label in ('Listing','ISIN','Bloomberg','Reuters code')):return []
    lines=block.splitlines();rows=[]
    for i,line in enumerate(lines):
        match=re.match(r'^(.+?)\s{2,}([A-Z]{3})\s+([A-Z0-9]{12})\s+([A-Z0-9]+)\s+(LN)\s+([A-Za-z0-9]+\.L)\s*$',line)
        if not match or match[3]!=isin:continue
        # The wrapped venue remains part of this row. LN alone is not venue evidence.
        if not match[1].rstrip().endswith('London Stock') or i+1>=len(lines) or lines[i+1].strip()not in ('Exchange','ETF                    Shares    Exchange'):continue
        rows.append(dict(ticker=match[4],mic='XLON',exchange='London Stock Exchange',currency=match[2],symbol=match[6],excerpt=isin+' | London Stock Exchange | '+' '.join((line+' '+lines[i+1]).split())))
    return rows


def dws_factsheet_listings(text,isin):
    # The explicitly labelled fund identity excludes the separate holdings ISIN column.
    identities=re.findall(r'^\s*ISIN\s+([A-Z0-9]{12})\b',text,re.M)
    if identities!=[isin] or text.count('Listing and trading information')!=1:return []
    block=text.split('Listing and trading information',1)[1].split('\f',1)[0]
    if not all(label in block for label in ('Bloomberg','Reuters','Trading','Currency')):return []
    venues={'Borsa Italiana':('ETFP','IM'),'London Stock Exchange':('XLON','LN'),'SIX - Swiss Exchange':('XSWX','SW'),'XETRA':('XETR','GY')}
    rows=[]
    for line in block.splitlines():
        match=re.fullmatch(r'\s*(.+?)\s{2,}([A-Z0-9]+)\s+(IM|LN|SW|GY)\s+([A-Za-z0-9]+\.[A-Za-z]+)\s+([A-Z]{3})\s*',line)
        if not match or match[1]not in venues:continue
        mic,suffix=venues[match[1]]
        if match[3]!=suffix:raise ValueError('Conflicting DWS venue and Bloomberg market')
        rows.append(dict(ticker=match[2],mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=match[5],symbol=match[4],excerpt=isin+' | '+' '.join(line.split())))
    return rows


def invesco_characteristics(body, isin, url, today):
    """Explicit characteristics of the requested share, never inferred from its name."""
    from urllib.parse import urlsplit, parse_qs
    p = urlsplit(url)
    if (p.scheme != 'https' or p.netloc != 'dng-api.invesco.com'
            or p.path != f'/cache/v1/accounts/fr_FR/shareclasses/{isin}'
            or parse_qs(p.query) != {'idType': ['isin']} or p.fragment):
        raise ValueError('Wrong Invesco characteristics reference')
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result: raise ValueError('Duplicate Invesco characteristic')
            result[key] = value
        return result
    data = json.loads(body, object_pairs_hook=unique)
    if data.get('aliases', {}).get('isin') != isin:
        raise ValueError('Wrong Invesco exact share')
    effective = dt.date.fromisoformat(data['effectiveDate'])
    if not 0 <= (today - effective).days <= RENEWAL_GRACE_DAYS:
        raise ValueError('Stale or future Invesco characteristics')
    result = {}
    for source, field in [('peaEligible', 'pea'), ('hedgedIndicator', 'currencyHedge')]:
        value = data.get(source)
        if source == 'peaEligible' and value in ('Yes', 'No'): result[field] = value == 'Yes'
        elif source == 'hedgedIndicator' and type(value) is bool: result[field] = value
    mappings = [('distributionFrequency', 'distribution', {'Accumulating':'Accumulating', 'Distributing':'Distributing'}),
                ('replicationMethod', 'replicationMethod', {'Physical':'Physical', 'Synthetic':'Synthetic'})]
    for source, field, mapping in mappings:
        if data.get(source) in mapping: result[field] = mapping[data[source]]
    domicile = {'IE':'Ireland', 'LU':'Luxembourg', 'FR':'France', 'JE':'Jersey'}
    country = data.get('account', {}).get('domicileCountry')
    if country in domicile: result['domicile'] = domicile[country]
    return result


def lse_listing_rows(body,source,url,checked):
    """Exact exchange reference identity, never a quote or NAV observation."""
    from urllib.parse import urlsplit,parse_qs
    route=urlsplit(url);query=parse_qs(route.query)
    if route.hostname!='apidata.londonstockexchange.com'or route.path!='/nrdp/v1'or set(query)!={'tidm'}or len(query['tidm'])!=1:
        raise ValueError('Unqualified LSE reference route')
    doc=json.loads(body);row=doc.get('data')
    if doc.get('statusCode')!=200 or not isinstance(row,dict):raise ValueError('Missing LSE reference result')
    if (row.get('isinCode')!=source['isin']or row.get('tidm')!=query['tidm'][0]or row.get('mic')!='XLON'
        or row.get('typology')!='ETPs'or row.get('mifirIdentifier')!='ETFS'or row.get('unitOfQuotation')!='1'
        or row.get('instrumentStatus')!='0'or row.get('tradingAllowed')!='1'):
        raise ValueError('Wrong or unqualified exact LSE ETF identity')
    try:as_of=dt.datetime.strptime(row['calendarDate'],'%d/%m/%Y').date()
    except (KeyError,TypeError,ValueError)as error:raise ValueError('Missing LSE reference date')from error
    if as_of>dt.date.fromisoformat(checked):raise ValueError('Future LSE reference date')
    expected=[r for r in source.get('listings',[])if (r['mic'],r['ticker'],r['currency'])==('XLON',row['tidm'],row.get('currency'))]
    if len(expected)!=1:raise ValueError('LSE reference does not renew the configured exact listing')
    listing=expected[0]
    if listing.get('symbol')!=row['tidm']+'.L':raise ValueError('Inconsistent LSE listing symbol')
    return [{k:listing[k]for k in ['ticker','mic','exchange','currency','symbol']}|{'referenceDate':as_of.isoformat(),
        'excerpt':source['isin']+' | '+json.dumps(row,ensure_ascii=False,sort_keys=True)}]

def parse_listings(body,source,url,checked):
    if 'www.justetf.com/' in url:return []  # Listings require an issuer or exchange row, not a specialist profile alone.
    # Mirrors (fund-data platforms, document aggregators) may describe a fund but are not listing evidence.
    from urllib.parse import urlsplit
    if urlsplit(url).scheme!='https' or urlsplit(url).hostname not in LISTING_HOSTS:return []
    isin=source['isin'];digest=hashlib.sha256(body).hexdigest();rows=[]
    if urlsplit(url).hostname=='apidata.londonstockexchange.com':
        return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"}for r in lse_listing_rows(body,source,url,checked)]
    if urlsplit(url).hostname=='dng-api.invesco.com' and urlsplit(url).path==f'/cache/v1/accounts/fr_FR/shareclasses/{isin}' and 'variationType=' not in urlsplit(url).query:
        return []  # Characteristics endpoint; the independent listing endpoint remains required.
    markets=EXCHANGE_MICS
    if urlsplit(url).hostname=='live.euronext.com' and re.fullmatch(r'/en/product/etfs/[A-Z0-9]{12}-[A-Z0-9]{4}',urlsplit(url).path):
        return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in euronext_listing_rows(body,isin,url)]
    if urlsplit(url).hostname=='dng-api.invesco.com' or (urlsplit(url).hostname=='www.borsaitaliana.it' and not body.startswith(b'%PDF')):
        rows=invesco_listing_rows(body,isin,url) if urlsplit(url).hostname=='dng-api.invesco.com' else borsa_listing_rows(body,isin)
        return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]
    if urlsplit(url).hostname=='bitwiseinvestments.eu' and not body.startswith(b'%PDF-'):
        return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in bitwise_listing_rows(body,isin)]
    if urlsplit(url).hostname=='globalxetfs.eu' and not body.startswith(b'%PDF-'):
        return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in globalx_listing_rows(body,isin)]
    if urlsplit(url).hostname=='fund-docs.vanguard.com' and body.startswith(b'%PDF-'):
        rows=vanguard_listing_rows(text_of(body),isin)
        if rows:return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]
    if body.lstrip().startswith(b'{'):
        doc=json.loads(body)
        if isinstance(doc,dict) and 'products' in doc:
            for row in amundi_product(doc,isin)['characteristics'].get('LISTINGS') or []:
                mic=markets.get(row.get('exchangePlace'));currency=row.get('tradingCurrency');bloomberg=str(row.get('ticker') or '').split();symbol=row.get('ric')
                if not mic or not re.fullmatch(r'[A-Z]{3}',currency or '') or not bloomberg or not isinstance(symbol,str) or not SYMBOL.fullmatch(symbol):continue
                rows.append(dict(ticker=bloomberg[0],mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=currency,symbol=symbol,excerpt=' | '.join([isin,row['exchangePlace'],row['ticker'],currency,symbol])))
            return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]
        if isinstance(doc,dict) and 'pdpResult' in doc:
            facts=dws_identity(body,isin)
            trading=[item for item in facts.get('accordionItems',[]) if item.get('id')=='fundinformation-tradinginformation']
            if len(trading)!=1:raise ValueError('Missing or multiple DWS product trading sections')
            for values in dws_tables(trading[0]):
                for row in values:
                    cell=lambda key:(row.get(key) or {}).get('value') if isinstance(row.get(key),dict) else None
                    mic=markets.get(cell('StockExchange'));currency=cell('Currency');bloomberg=str(cell('BloombergTicker') or '').split();symbol=cell('ReutersRic')
                    if not mic or not re.fullmatch(r'[A-Z]{3}',currency or '') or not bloomberg or not isinstance(symbol,str) or not SYMBOL.fullmatch(symbol):continue
                    rows.append(dict(ticker=bloomberg[0],mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=currency,symbol=symbol,excerpt=' | '.join([isin,cell('StockExchange'),cell('BloombergTicker'),currency,symbol])))
            return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]
        points=doc['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        if points['isin']['value']!=isin:raise ValueError('Wrong listing share')
        data=doc['componentsByNameMap'].get('listings',{}).get('containersByNameMap',{}).get('default',{}).get('dataPointsByNameMap',{})
        columns=[data.get(k,{}).get('value',[]) for k in ['exchange','ticker','currencyCode','ric']]
        if len({len(v) for v in columns})!=1:raise ValueError('Truncated listing columns')
        for exchange,ticker,currency,symbol in zip(*columns):
            if exchange not in markets or not re.fullmatch(r'[A-Z]{3}',currency or '') or not ticker:continue
            canonical={'XETR':'Xetra','XPAR':'Euronext Paris'}.get(markets[exchange],exchange)
            rows.append(dict(ticker=ticker,mic=markets[exchange],exchange=canonical,currency=currency,
                             **({'symbol':symbol} if isinstance(symbol,str) and SYMBOL.fullmatch(symbol) else {}),
                             excerpt=' | '.join([isin,exchange,ticker,currency,str(symbol or '')])))
    else:
        text=text_of(body)
        scoped=[]
        if body.startswith(b'%PDF') and urlsplit(url).hostname=='www.borsaitaliana.it':scoped=scoped_supplement_listings(text,isin)
        if body.startswith(b'%PDF') and urlsplit(url).hostname=='etf.dws.com':scoped=dws_factsheet_listings(text,isin)
        if scoped:
            rows.extend(scoped)
        identities=set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',text))
        if isin not in identities:raise ValueError('Missing listing document identity')
        if body.startswith(b'%PDF-'):
            blocks=text.splitlines()
            # Vanguard factsheets print the venue on its own line immediately above
            # the currency/ticker row. Never join rows from different shares.
            if identities=={isin}:
                blocks=[(blocks[i-1]+' '+line if i and re.match(r'^\s*[A-Z]{3}\s{2,}',line) else line) for i,line in enumerate(blocks)]
            else:
                # Multi-instrument documents require the exact ISIN in the SAME row.
                blocks=[line for line in blocks if set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',line))=={isin}]
        else:blocks=[html.unescape(re.sub('<[^>]+>',' ',r)) for r in re.findall(r'<tr\b[^>]*>(.*?)</tr>',body.decode(),re.S|re.I)]
        if identities!={isin} and not body.startswith(b'%PDF-'):raise ValueError('Ambiguous listing document identity')
        # Issuer factsheets abbreviate or capitalise the venues (BNP: « EURONEXT P », « SIX SWISS » ; DWS: « XETRA » ;
        # VanEck: « LONDON STOCK EXCHANGE », and Xetra as « DEUTSCHE BÖRSE », Bloomberg suffix GY). Exact labels only:
        # a case-insensitive « LSE » would match « else » or « false ».
        aliases={'XLON':['London Stock Exchange','LONDON STOCK EXCHANGE','LSE'],'XPAR':['Euronext Paris','EURONEXT P','Euronext (FR)','Euronext(FR)'],'XAMS':['Euronext Amsterdam','EURONEXT A'],'ETFP':['Borsa Italiana','BORSA ITALIANA'],'XETR':['Xetra','XETRA','Deutsche Börse','DEUTSCHE BÖRSE'],'XSWX':['SIX Swiss Exchange','SIX Swiss','SIX SWISS']}
        for listing in source.get('listings',[]):
            for block in blocks:
                venue=any(m in block for m in aliases.get(listing['mic'],[listing['exchange']]))
                # Vanguard's dated factsheet labels Amsterdam simply "Euronext";
                # only the standalone venue header with an explicit .AS RIC qualifies.
                if 'fund-docs.vanguard.com/' in url and listing['mic']=='XAMS':
                    venue=venue or bool(re.match(r'^\s*Euronext\s+[A-Z]{3}\s{2,}',block) and re.search(r'\b'+re.escape(listing['ticker'])+r'\.AS\b',block))
                if re.search(r'(?<![A-Za-z0-9])'+re.escape(listing['ticker'])+r'(?![A-Za-z0-9])',block) and re.search(r'\b'+re.escape(listing['currency'])+r'\b',block) and venue:
                    rows.append({k:listing[k] for k in ['ticker','mic','exchange','currency','symbol'] if k in listing}|{'excerpt':isin+' | '+' '.join(block.split())})
                    break
    return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]

def collect(source,now,fetch=download,on_document=None):
    from urllib.parse import urlsplit
    values={};errors=[];conflicts=set();observations={};field_evidence={};checked=now.date().isoformat()
    urls=list(source['urls'])
    for requested_url in urls:
        url=requested_url
        if re.fullmatch(r'https://www\.quantalys\.com/Recherche/RechercheRapide\?inputSearch=[A-Z]{2}[A-Z0-9]{9}\d',url) and urlsplit(values.get('pea',{}).get('sourceUrl','')).hostname=='www.quantalys.com':continue
        if urlsplit(url).hostname=='bourse.fortuneo.fr' and urlsplit(url).path=='/api/search' and urlsplit(values.get('pea',{}).get('sourceUrl','')).hostname=='bourse.fortuneo.fr':continue
        try:
            body,url=fetch_document(url,fetch,source['isin'])
            if on_document:on_document(requested_url,url,body)
            if urlsplit(url).hostname=='bourse.fortuneo.fr' and urlsplit(url).path=='/api/search':
                candidates=fortuneo_reference_urls(body,source['isin'],url)
                if not candidates:errors.append({'sourceUrl':url,'field':'pea','error':'No exact-share broker reference found; this is not a negative PEA statement.'})
                for candidate in candidates:
                    if candidate not in urls:urls.append(candidate)
                continue
            try:
                from urllib.parse import urlsplit
                if urlsplit(url).hostname=='apidata.londonstockexchange.com':fields={}
                elif urlsplit(url).hostname=='dng-api.invesco.com':
                    fields=invesco_characteristics(body,source['isin'],url,now.date()) if '/fr_FR/' in urlsplit(url).path and 'variationType=' not in urlsplit(url).query else {}
                elif urlsplit(url).hostname=='www.justetf.com':fields=parse_justetf(body,source['isin'])
                elif urlsplit(url).hostname=='www.quantalys.com':fields=parse_quantalys_pea(body,source['isin'],url)
                elif urlsplit(url).hostname=='extraetf.com':fields=parse_extraetf_pea(body,source['isin'],url)
                elif urlsplit(url).hostname=='www.francetransactions.com':fields=parse_francetransactions_pea(body,source['isin'],url)
                elif urlsplit(url).hostname in ('bourse.fortuneo.fr','www.boursedirect.fr'):fields=parse_broker_pea(body,source['isin'])
                else:fields=parse_json(body,source['isin']) if body.lstrip().startswith(b'{') else parse_text(text_of(body),source['isin'])
            except ValueError as error:
                # A listing table can identify its share even when the surrounding
                # prospectus also names an index. This never qualifies other fields.
                if body.lstrip().startswith(b'{'):raise
                fields={};errors.append({'sourceUrl':url,'error':str(error)})
            listing_rows=parse_listings(body,source,url,checked)
            if listing_rows:fields['listings']=listing_rows
            if not fields:raise ValueError('No explicit supported metadata fields')
            for field,value in fields.items():
                if field in ('pea','currencyHedge'):
                    observations.setdefault(field,{})[url]=value
                    observations[field][requested_url]=value
                    field_evidence.setdefault(field,{})[url]={'sourceUrl':url,'value':value,'checkedAt':checked,'sha256':hashlib.sha256(body).hexdigest()}
                if field in conflicts:continue
                if field in values and values[field]['value']!=value:
                    if field=='listings':
                        key=lambda row:(row['mic'],row['ticker'],row['currency'])
                        merged={key(row):row for row in values[field]['value']}
                        for row in value:
                            old=merged.get(key(row))
                            if old and old.get('symbol') and row.get('symbol') and old['symbol']!=row['symbol']:
                                conflicts.add(field);values.pop(field,None)
                                raise ValueError('Conflicting exact listing symbols')
                            if not old or (row.get('symbol') and not old.get('symbol')):merged[key(row)]=row
                        values[field]['value']=list(merged.values())
                        continue
                    # Equivalent issuer labels are normalised below; unresolved differences are retained as failures.
                    if field in ('pea','currencyHedge'):
                        conflicts.add(field);values.pop(field,None)
                        raise ValueError('Conflicting metadata sources: '+field)
                    continue
                values[field]={'value':value,'checkedAt':checked,'sourceUrl':url,'sha256':hashlib.sha256(body).hexdigest()}
        except Exception as error:errors.append({'sourceUrl':url,'error':str(error)})
    expectation=source.get('peaExpectation',{})
    if 'pea' in values and type(expectation.get('value'))is bool and values['pea']['value']!=expectation['value']:
        fresh=observations.get('pea',{})
        agreeing={urlsplit(url).hostname for url,value in fresh.items() if value==values['pea']['value']}
        if len(agreeing)<2:
            values.pop('pea',None)
            errors.append({'field':'pea','qualificationRequired':True,'sourceUrl':expectation.get('sourceUrl'),'error':'New PEA statement differs from the previous documented review; independent current corroboration required.','sources':[expectation]})
    for field in conflicts:
        if field in ('pea','currencyHedge'):
            errors.append({'field':field,'qualificationRequired':True,'error':'Conflicting current exact-share statements; no automatic value chosen.','sources':list(field_evidence.get(field,{}).values())})
    for hold in source.get('qualificationHolds',[]):
        field=hold['field'];observed=observations.get(field,{})
        urls=[row['sourceUrl'] for row in hold['sources']]
        if any(url not in observed for url in urls) or len({observed[url] for url in urls if url in observed})!=1:
            values.pop(field,None)
            errors.append({'sourceUrl':urls[0],'field':field,'qualificationRequired':True,'error':'Qualification de publication requise : contradiction entre sources non résolue ; aucune valeur choisie par défaut.','sources':hold['sources']})
    return values,qualification_failures(errors)

def field_diagnostics(source, values, failures, old, now):
    """Separate the attempt date from actual field evidence and retained values."""
    errors=[{'sourceUrl':row.get('sourceUrl'),'error':row.get('error')} for row in failures]
    result={}
    for field in FIELDS:
        observed=values.get(field)
        retained=old.get(field,{})
        conflict=next((failure for failure in failures if failure.get('qualificationRequired') and failure.get('field')==field),None)
        result[field]={'status':'observed' if observed else 'retained' if retained else 'unobserved',
            'category':None if observed else 'source-conflict' if conflict else 'source-unavailable' if errors else 'missing-field',
            'lastAttemptAt':now.isoformat(),
            'lastSuccessAt':(observed or retained).get('checkedAt'),
            'sourceUrls':list(source['urls']),
            'cause':None if observed else conflict['error'] if conflict else 'No exact field evidence extracted from the configured sources; an absent statement does not mean false.',
            'sourceErrors':[] if observed else errors}
    return result


def merge_field_observation(field, previous, observed):
    """Retain each exact listing receipt when only another venue was observed."""
    if previous and observed['checkedAt']<previous.get('checkedAt',''):
        return previous
    if field!='listings' or not previous:
        return observed
    key=lambda row:(row['mic'],row['ticker'],row['currency'])
    rows={key(row):row for row in previous['value']}
    for row in observed['value']:
        prior=rows.get(key(row))
        if prior is None or row['checkedAt']>=prior.get('checkedAt',''):
            rows[key(row)]=row
    # The containing receipt dates the attempted source, not every retained row.
    # Consumers must keep using the individual row dates and source hashes.
    return {**observed,'value':[rows[k]for k in sorted(rows)]}

def select_sources(sources, requested):
    """Reject misspelled/empty explicit scopes before any request or write."""
    if requested is None:return sources
    identifiers=list(dict.fromkeys(piece.upper() for value in requested for piece in re.split(r'[,\s]+',value.strip()) if piece))
    if not identifiers:raise ValueError('Ciblage vide : fournir au moins un ISIN enregistré.')
    unknown=set(identifiers)-{source['isin'] for source in sources}
    if unknown:raise ValueError('ISIN non enregistré : '+', '.join(sorted(unknown)))
    selected=set(identifiers)
    return [source for source in sources if source['isin'] in selected]


def main():
    p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--validate-scope',action='store_true');p.add_argument('--only',nargs='+');p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    sources=json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']
    try:sources=select_sources(sources,a.only)
    except ValueError as error:p.error(str(error))
    if a.validate_scope:
        print(f'Ciblage validé : {len(sources)} instrument(s) ; aucune collecte ni écriture.');return
    path=ROOT/'src/data/automated-instrument-metadata.json';records=json.loads(path.read_text())
    status_path=ROOT/'src/data/instrument-metadata-status.json';status=json.loads(status_path.read_text());now=dt.datetime.now(UTC)
    def one(s):return s['isin'],*collect(s,now)
    errors=[];updated=[];successes=[];within_grace=[]
    with ThreadPoolExecutor(max_workers=6) as pool:
        for isin,values,failures in pool.map(one,sources):
            errors.extend({**failure,'id':f"{isin}:{failure['field']}:qualification",'lastAttemptAt':now.isoformat()} for failure in failures if failure.get('qualificationRequired'))
            old=records.get(isin,{})
            for field,value in values.items():
                old[field]=merge_field_observation(field,old.get(field),value)
            records[isin]=old
            missing=[field for field in FIELDS if field not in values]
            prior=status.get(isin,{})
            first_pending={field:prior.get('firstPendingAt',{}).get(field,prior.get('checkedAt',now.isoformat()) if field in prior.get('pending',[]) else now.isoformat()) for field in missing}
            status[isin]={'checkedAt':now.isoformat(),'observed':list(values),'pending':missing,'firstPendingAt':first_pending,'errors':failures,
                          'fields':field_diagnostics(next(s for s in sources if s['isin']==isin),values,failures,old,now)}
            for field in missing:
                if field not in old and renewal_overdue({'checkedAt':first_pending[field]},now):
                    errors.append({'id':f'{isin}:{field}:qualification','field':field,'error':'Qualification de publication requise : champ jamais observé ; vérifier la source exacte ou documenter explicitement sa non-publication.'})
            successes.extend({'id':f'{isin}:{field}:qualification'} for field in values)
            if values:updated.append(isin)
            successes.extend({'id':f'{isin}:{field}'} for field in values)
            # Fail when previously automatic values stay unrenewed beyond the grace period; absent publications stay explicit pending fields.
            for field in old:
                if field not in values and not renewal_overdue(old[field],now,field):within_grace.append({'id':f'{isin}:{field}'})
                if field not in values and renewal_overdue(old[field],now,field):errors.append({'id':f'{isin}:{field}','field':field,'error':f'Previously automated metadata not renewed for more than {renewal_days(field)} days; original evidence retained. '+ ' | '.join(str(e.get('error','')) for e in failures)[:300],
                    'lastSuccessAt':old[field].get('checkedAt'),'lastAttemptAt':now.isoformat()})
    if a.apply:
        write_json_atomic(path,records);write_json_atomic(status_path,status)
    errors=report_incidents(errors)
    failed={error['id'] for error in errors}
    successes=list({item['id']:item for item in successes if item['id'] not in failed}.values())
    write_json_atomic(a.output,{'checkedAt':now.isoformat(),'updated':updated,'successes':successes,'errors':errors,'inactive':within_grace,'pending':{isin:s['pending'] for isin,s in status.items() if s['pending']}})
    print(f'Metadata: {len(updated)}/{len(sources)} instruments with observed fields; {len(errors)} distinct field incidents.')
    if errors:raise SystemExit(1)
if __name__=='__main__':__import__('producer_report_contract').run('collect_instrument_metadata', main)


