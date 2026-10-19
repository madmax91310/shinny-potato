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
ROOT=Path(__file__).resolve().parents[1]
FIELDS=('distribution','domicile','replicationMethod','pea','currencyHedge','listings')
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
AMUNDI_CHARACTERISTICS=['ISIN','DISTRIBUTION_POLICY','FUND_REPLICATION_METHODOLOGY','LISTINGS','MAIN_LISTINGS']
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

def fetch_document(url,fetch=download,isin=None):
    """Returns (body, url actually read)."""
    try:
        if url==AMUNDI_API and fetch is download:return fetch_amundi(isin),url
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
      'distribution':r'(?:Use of (?:Income|Profits)|Income Treatment|Distribution Policy|Affectation des r[ée]sultats|Politique de distribution)\s*[:\n]?\s*(Accumulating|Distributing|Capitalisation|Distribution|Reinvestment)\b',
      'domicile':r'(?:Fund Domicile|Domicile|Domiciliation|Domicile du fonds)\s*[:\n]?\s*(Ireland|Irlande|Luxembourg|Germany|Allemagne|France|Jersey|(?:The )?Netherlands)\b',
      'replicationMethod':r'(?:Replication (?:Method|methodology)|M[ée]thode de r[ée]plication|Replication|R[ée]plication)\s*[:\n]?\s*(Physical(?:\s*\((?:Full replication|Optimised sampling)\))?|Synthetic|Physique|Synth[ée]tique|Direct Replication|Indirect\s*\(Swap Based\))\b',
      'pea':r'(?:PEA eligibility|PEA Eligible|Eligible PEA|[ÉE]ligibilit[ée] (?:au )?PEA|[ÉE]ligibilit[ée] au plan d[’\x27]Epargne en Actions \(PEA\)|PEA berechtigt|[ÉE]ligible (?:au )?PEA|R[ée]gime fiscal PEA)\s*[:\n]?\s*(Yes|No|Oui|Non|Keine|Ja|Nein)\b',
      'currencyHedge':r'(?:Currency Hedged|Currency Hedge|Couverture de change|Couvert contre le risque de change)\s*[:\n]?\s*(Yes|No|Oui|Non)\b',
    }
    result={}
    for field,pattern in patterns.items():
        found=set(re.findall(pattern,text,re.I))
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
    return result

def parse_json(body,isin):
    doc=json.loads(body)
    if isinstance(doc,dict) and 'products' in doc:
        facts=amundi_product(doc,isin)['characteristics']
        mapping={'DISTRIBUTION_POLICY':'distribution','FUND_REPLICATION_METHODOLOGY':'replicationMethod'}
        return {field:facts[key] for key,field in mapping.items() if isinstance(facts.get(key),str) and facts[key]}
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
        return {field:facts[key] for key,field in mapping.items() if isinstance(facts.get(key),str) and facts[key]}
    try:
        points=doc['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        if points['isin']['value']!=isin:raise ValueError('Wrong exact-share metadata')
    except KeyError:
        raise ValueError('No qualified structured metadata parser for this endpoint')
    mapping={'useOfProfitsCode':'distribution','domicile':'domicile','productStructure':'replicationMethod'}
    return {field:points[key]['value'] for key,field in mapping.items() if isinstance(points.get(key,{}).get('value'),str) and points[key]['value']}

LISTING_HOSTS=set(json.loads((ROOT/'scripts/listing-source-hosts.json').read_text())['hosts'])

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

def parse_listings(body,source,url,checked):
    if 'www.justetf.com/' in url:return []  # Listings require an issuer or exchange row, not a specialist profile alone.
    # Mirrors (fund-data platforms, document aggregators) may describe a fund but are not listing evidence.
    from urllib.parse import urlsplit
    if urlsplit(url).scheme!='https' or urlsplit(url).hostname not in LISTING_HOSTS:return []
    isin=source['isin'];digest=hashlib.sha256(body).hexdigest();rows=[]
    markets=EXCHANGE_MICS
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

def collect(source,now,fetch=download):
    values={};errors=[];conflicts=set();checked=now.date().isoformat()
    for url in source['urls']:
        try:
            body,url=fetch_document(url,fetch,source['isin'])
            try:
                fields=parse_json(body,source['isin']) if body.lstrip().startswith(b'{') else parse_text(text_of(body),source['isin'])
            except ValueError as error:
                # A listing table can identify its share even when the surrounding
                # prospectus also names an index. This never qualifies other fields.
                if body.lstrip().startswith(b'{'):raise
                fields={};errors.append({'sourceUrl':url,'error':str(error)})
            listing_rows=parse_listings(body,source,url,checked)
            if listing_rows:fields['listings']=listing_rows
            if not fields:raise ValueError('No explicit supported metadata fields')
            for field,value in fields.items():
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
    return values,errors

def field_diagnostics(source, values, failures, old, now):
    """Separate the attempt date from actual field evidence and retained values."""
    errors=[{'sourceUrl':row.get('sourceUrl'),'error':row.get('error')} for row in failures]
    result={}
    for field in FIELDS:
        observed=values.get(field)
        retained=old.get(field,{})
        result[field]={'status':'observed' if observed else 'retained' if retained else 'unobserved',
            'lastAttemptAt':now.isoformat(),
            'lastSuccessAt':(observed or retained).get('checkedAt'),
            'sourceUrls':list(source['urls']),
            'cause':None if observed else 'No exact field evidence extracted from the configured sources; an absent statement does not mean false.',
            'sourceErrors':[] if observed else errors}
    return result


def main():
    p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--only',nargs='+');p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    sources=json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']
    if a.only:sources=[s for s in sources if s['isin'] in a.only]
    path=ROOT/'src/data/automated-instrument-metadata.json';records=json.loads(path.read_text())
    status_path=ROOT/'src/data/instrument-metadata-status.json';status=json.loads(status_path.read_text());now=dt.datetime.now(UTC)
    def one(s):return s['isin'],*collect(s,now)
    errors=[];updated=[];successes=[];within_grace=[]
    with ThreadPoolExecutor(max_workers=6) as pool:
        for isin,values,failures in pool.map(one,sources):
            old=records.get(isin,{})
            for field,value in values.items():
                if value['checkedAt']>=old.get(field,{}).get('checkedAt',''):old[field]=value
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
    write_json_atomic(a.output,{'checkedAt':now.isoformat(),'updated':updated,'successes':successes,'errors':errors,'inactive':within_grace,'pending':{isin:s['pending'] for isin,s in status.items() if s['pending']}})
    print(f'Metadata: {len(updated)}/{len(sources)} observed instruments; {len(errors)} failed renewals.')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()

