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
VANECK_FACTSHEET=re.compile(r'https://www\.vaneck\.com/(?:ucits|[a-z]{2}/en)/library/fact-sheets/[a-z0-9]+-fact-sheet\.pdf')
# Amundi publishes exact-share characteristics and listings through a POST API only: a GET on this
# URL answers 405 and had left every Amundi instrument without metadata or listing evidence.
AMUNDI_API='https://www.amundietf.fr/mapi/ProductAPI/getProductsData'
AMUNDI_CHARACTERISTICS=['ISIN','DISTRIBUTION_POLICY','FUND_REPLICATION_METHODOLOGY','LISTINGS','MAIN_LISTINGS']
# Exchange labels as the issuers print them, mapped to the MIC used across the registries.
EXCHANGE_MICS={'London Stock Exchange':'XLON','LSE':'XLON','Deutsche Boerse Xetra':'XETR','Xetra':'XETR','XETRA':'XETR',
  'Euronext Amsterdam':'XAMS','Nyse Euronext - Euronext Paris':'XPAR','Euronext Paris':'XPAR','Borsa Italiana':'ETFP','SIX Swiss Exchange':'XSWX'}
CANONICAL_EXCHANGES={'XLON':'London Stock Exchange','XETR':'Xetra','XAMS':'Euronext Amsterdam','XPAR':'Euronext Paris','ETFP':'Borsa Italiana','XSWX':'SIX Swiss Exchange'}
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
    if set(re.findall(rb'\b[A-Z]{2}[A-Z0-9]{9}\d\b',body))!={isin.encode()}:raise ValueError('Ambiguous listing document identity')

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
      'distribution':r'(?:Use of (?:Income|Profits)|Income Treatment|Distribution Policy|Affectation des r[ée]sultats|Politique de distribution)\s*[:\n]?\s*(Accumulating|Distributing|Capitalisation|Distribution)\b',
      'domicile':r'(?:Fund Domicile|Domicile|Domiciliation|Domicile du fonds)\s*[:\n]?\s*(Ireland|Irlande|Luxembourg|Germany|Allemagne|France|Jersey)\b',
      'replicationMethod':r'(?:Replication (?:Method|methodology)|M[ée]thode de r[ée]plication|Replication|R[ée]plication)\s*[:\n]?\s*(Physical(?:\s*\((?:Full replication|Optimised sampling)\))?|Synthetic|Physique|Synth[ée]tique|Direct Replication|Indirect\s*\(Swap Based\))\b',
      'pea':r'(?:PEA eligibility|Eligible PEA|[ÉE]ligibilit[ée] (?:au )?PEA|[ÉE]ligible (?:au )?PEA|R[ée]gime fiscal PEA)\s*[:\n]?\s*(Yes|No|Oui|Non)\b',
      'currencyHedge':r'(?:Currency Hedged|Currency Hedge|Couverture de change|Couvert contre le risque de change)\s*[:\n]?\s*(Yes|No|Oui|Non)\b',
    }
    result={}
    for field,pattern in patterns.items():
        found=set(re.findall(pattern,text,re.I))
        if len(found)>1:raise ValueError('Conflicting explicit metadata: '+field)
        if found:
            value=found.pop()
            result[field]=value.lower() in ('yes','oui') if field in ('pea','currencyHedge') else value
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
        # The DWS product page exposes no explicit characteristic fields: only its exchange table is read.
        dws_identity(body,isin);return {}
    try:
        points=doc['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        if points['isin']['value']!=isin:raise ValueError('Wrong exact-share metadata')
    except KeyError:
        raise ValueError('No qualified structured metadata parser for this endpoint')
    mapping={'useOfProfitsCode':'distribution','domicile':'domicile','productStructure':'replicationMethod'}
    return {field:points[key]['value'] for key,field in mapping.items() if isinstance(points.get(key,{}).get('value'),str) and points[key]['value']}

LISTING_HOSTS=set(json.loads((ROOT/'scripts/listing-source-hosts.json').read_text())['hosts'])

def parse_listings(body,source,url,checked):
    if 'www.justetf.com/' in url:return []  # Listings require an issuer or exchange row, not a specialist profile alone.
    # Mirrors (fund-data platforms, document aggregators) may describe a fund but are not listing evidence.
    from urllib.parse import urlsplit
    if urlsplit(url).scheme!='https' or urlsplit(url).hostname not in LISTING_HOSTS:return []
    isin=source['isin'];digest=hashlib.sha256(body).hexdigest();rows=[]
    markets=EXCHANGE_MICS
    if body.lstrip().startswith(b'{'):
        doc=json.loads(body)
        if isinstance(doc,dict) and 'products' in doc:
            for row in amundi_product(doc,isin)['characteristics'].get('LISTINGS') or []:
                mic=markets.get(row.get('exchangePlace'));currency=row.get('tradingCurrency');bloomberg=str(row.get('ticker') or '').split();symbol=row.get('ric')
                if not mic or not re.fullmatch(r'[A-Z]{3}',currency or '') or not bloomberg or not isinstance(symbol,str) or not SYMBOL.fullmatch(symbol):continue
                rows.append(dict(ticker=bloomberg[0],mic=mic,exchange=CANONICAL_EXCHANGES[mic],currency=currency,symbol=symbol,excerpt=' | '.join([isin,row['exchangePlace'],row['ticker'],currency,symbol])))
            return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]
        if isinstance(doc,dict) and 'pdpResult' in doc:
            dws_identity(body,isin)
            for values in dws_tables(doc):
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
            if exchange not in markets or not re.fullmatch(r'[A-Z]{3}',currency or '') or not ticker or not symbol:continue
            canonical={'XETR':'Xetra','XPAR':'Euronext Paris'}.get(markets[exchange],exchange)
            rows.append(dict(ticker=ticker,mic=markets[exchange],exchange=canonical,currency=currency,symbol=symbol,excerpt=' | '.join([isin,exchange,ticker,currency,symbol])))
    else:
        text=text_of(body)
        if set(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b',text))!={isin}:raise ValueError('Ambiguous listing document identity')
        if body.startswith(b'%PDF-'):blocks=text.splitlines()
        else:blocks=[html.unescape(re.sub('<[^>]+>',' ',r)) for r in re.findall(r'<tr\b[^>]*>(.*?)</tr>',body.decode(),re.S|re.I)]
        # Issuer factsheets abbreviate or capitalise the venues (BNP: « EURONEXT P », « SIX SWISS » ; DWS: « XETRA »).
        aliases={'XLON':['London Stock Exchange','LSE'],'XPAR':['Euronext Paris','EURONEXT P','Euronext (FR)'],'XAMS':['Euronext Amsterdam','EURONEXT A'],'ETFP':['Borsa Italiana','BORSA ITALIANA'],'XETR':['Xetra','XETRA'],'XSWX':['SIX Swiss Exchange','SIX Swiss','SIX SWISS']}
        for listing in source.get('listings',[]):
            for block in blocks:
                if re.search(r'(?<![A-Za-z0-9])'+re.escape(listing['ticker'])+r'(?![A-Za-z0-9])',block) and re.search(r'\b'+re.escape(listing['currency'])+r'\b',block) and any(m in block for m in aliases.get(listing['mic'],[listing['exchange']])):
                    rows.append({k:listing[k] for k in ['ticker','mic','exchange','currency','symbol'] if k in listing}|{'excerpt':isin+' | '+' '.join(block.split())})
                    break
    return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"} for r in rows]

def collect(source,now,fetch=download):
    values={};errors=[];conflicts=set();checked=now.date().isoformat()
    for url in source['urls']:
        try:
            body,url=fetch_document(url,fetch,source['isin'])
            fields=parse_json(body,source['isin']) if body.lstrip().startswith(b'{') else parse_text(text_of(body),source['isin'])
            listing_rows=parse_listings(body,source,url,checked)
            if listing_rows:fields['listings']=listing_rows
            if not fields:raise ValueError('No explicit supported metadata fields')
            for field,value in fields.items():
                if field in conflicts:continue
                if field in values and values[field]['value']!=value:
                    # Equivalent issuer labels are normalised below; unresolved differences are retained as failures.
                    if field in ('pea','currencyHedge'):
                        conflicts.add(field);values.pop(field,None)
                        raise ValueError('Conflicting metadata sources: '+field)
                    continue
                values[field]={'value':value,'checkedAt':checked,'sourceUrl':url,'sha256':hashlib.sha256(body).hexdigest()}
        except Exception as error:errors.append({'sourceUrl':url,'error':str(error)})
    return values,errors

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
            status[isin]={'checkedAt':now.isoformat(),'observed':list(values),'pending':missing,'errors':failures}
            if values:updated.append(isin)
            successes.extend({'id':f'{isin}:{field}'} for field in values)
            # Fail when previously automatic values stay unrenewed beyond the grace period; absent publications stay explicit pending fields.
            for field in old:
                if field not in values and not renewal_overdue(old[field],now,field):within_grace.append({'id':f'{isin}:{field}'})
                if field not in values and renewal_overdue(old[field],now,field):errors.append({'id':f'{isin}:{field}','field':field,'error':f'Previously automated metadata not renewed for more than {renewal_days(field)} days; original evidence retained.'})
    if a.apply:
        write_json_atomic(path,records);write_json_atomic(status_path,status)
    write_json_atomic(a.output,{'checkedAt':now.isoformat(),'updated':updated,'successes':successes,'errors':errors,'inactive':within_grace,'pending':{isin:s['pending'] for isin,s in status.items() if s['pending']}})
    print(f'Metadata: {len(updated)}/{len(sources)} observed instruments; {len(errors)} failed renewals.')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
