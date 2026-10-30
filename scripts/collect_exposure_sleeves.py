"""Daily exact-security look-through for exposure charts; original net tables stay intact."""
import argparse, datetime as dt, hashlib, json, re, csv, io
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from data_automation import UTC, write_json_atomic
from issuer_documents import public_page, document_date, download, pdf_text, validated_rows
ROOT=Path(__file__).resolve().parents[1]
API='https://www.blackrock.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data?appSubType=ISHARES&appType=PRODUCT_PAGE&component=keyFundFacts%2Choldings.all&locale=en_GB&portfolioId={}&targetSite=ishares-uk&userType=individual&excludeContent=true&includeConfig=true'
US_FUNDS=['239656','239710','239716']
FUNDS={'251882':'IE00B4L5Y983','264659':'IE00BKM4GZ66','296576':'IE00BF4RFH31','251891':'IE00B441G979','273192':'IE00BQT3WG13'}

SILVER_REPORT='https://lt.morningstar.com/1c6qh1t6k9/snapshotpdf/default.aspx?1=1&BaseCurrencyId=USD&ClientFund=0&Id=0P0001OWZV&InvestmentType=FO&LanguageId=en-GB&SecurityToken=0P0001OWZV%5D22%5D0%5DETEXG%24XLON'

def silver_sector_report(body,now):
    text=pdf_text(body)
    if not re.search(r'ISIN\s+IE000UL6CLP7\b',text) or 'Global X Silver Miners UCITS ETF USD Acc' not in text:raise ValueError('Wrong Morningstar exact share')
    dates=set(re.findall(r'Report as of (\d+ [A-Za-z]+ \d{4})',text))
    if len(dates)!=1:raise ValueError('Ambiguous report date')
    document_date(dates.pop(),now)
    dates=set(re.findall(r'Portfolio (\d+ [A-Za-z]+ \d{4})',text))
    if len(dates)!=1:raise ValueError('Ambiguous portfolio date')
    stamp=document_date(dates.pop(),now)
    stock=re.search(r'^Stocks\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)',text,re.M)
    if not stock or float(stock[2])!=0 or not 95<=float(stock[3])<=100:raise ValueError('Not a long-only equity portfolio')
    column=pdf_text(body,(200,195)).split('Sector Weightings',1)[1].split('Currency',1)[0]
    if not re.match(r'\s+% Equity',column):raise ValueError('Wrong sector denominator')
    labels=['Basic Materials','Consumer Cyclical','Financial Services','Real Estate','Communication Services','Energy','Industrials','Technology','Consumer Defensive','Healthcare','Utilities']
    rows=[]
    for label in labels:
        values=re.findall(r'\b'+re.escape(label)+r'\s+(-|\d+\.\d+)\s*$',column,re.M)
        if len(values)!=1:raise ValueError('Missing or duplicate sector '+label)
        rows.append({'name':label,'weightPct':0 if values[0]=='-' else float(values[0])})
    validated_rows(rows)
    return {'asOf':stamp,'checkedAt':now.date().isoformat(),'sourceUrl':SILVER_REPORT,'sha256':hashlib.sha256(body).hexdigest(),
            'basis':'fund','compatibility':'morningstar-equity-sectors','classificationLabel':'Secteurs actions Morningstar',
            'method':'Morningstar equity-sector classification, percentage of equity holdings excluding cash; exact UCITS share and portfolio date verified',
            'rows':rows}

def equity_rows(body, isin, url, now, *, classification_only=False):
    if classification_only and isin is not None:raise ValueError('Unweighted classification mode is restricted to existing US references')
    facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if isin and (facts['isin']['value']!=isin or facts['productStructure']['value']!='Physical'):raise ValueError('Exact physical share identity mismatch')
    if not isin and (str(body['productId']) not in US_FUNDS or facts['assetClass']['value']!='Equity'):raise ValueError('Unexpected US classification source')
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    stamp=document_date(str(p['asOfDate']['value']),now)
    keys=['isin','issueName','holdingPercent','assetClass','countryOfRisk','sectorName']
    cols=[p[k]['value'] for k in keys]
    if not cols[0] or len({len(c) for c in cols})!=1:raise ValueError('Truncated holdings columns')
    rows=[dict(zip(keys,v)) for v in zip(*cols)]
    import math
    if any(isinstance(r['holdingPercent'],bool) or not isinstance(r['holdingPercent'],(int,float)) or not math.isfinite(r['holdingPercent']) for r in rows):raise ValueError('Invalid weight')
    if not 99<=sum(r['holdingPercent'] for r in rows)<=101:raise ValueError('Incomplete net holdings')
    equities=[r for r in rows if r['assetClass']=='Equity']
    if not equities:raise ValueError('Missing equity classification rows' if classification_only else 'Short or missing equity sleeve')
    if classification_only:
        # These rows supply company country/sector labels only. Signed weights
        # are retained as published and are never an exposure of the target fund.
        identified=[r for r in equities if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',r.get('isin') or '')]
        if not identified:raise ValueError('Missing identified equity classification rows')
        observed={}
        for r in identified:
            if any(not r.get(k) or r[k]=='-' for k in ['countryOfRisk','sectorName']):raise ValueError('Missing company classification: '+r['isin'])
            pair=(r['countryOfRisk'],r['sectorName'])
            if r['isin'] in observed and observed[r['isin']]!=pair:raise ValueError('Conflicting company classification: '+r['isin'])
            observed[r['isin']]=pair
        return {'scope':'security-classification-reference',
                'asOf':stamp,'checkedAt':now.date().isoformat(),
                'sourceUrl':url,'portfolioWeightsUsed':False,
                'identifiedReferenceRows':len(identified),
                'unidentifiedReferenceRows':len(equities)-len(identified),
                'negativeReferenceRows':sum(r['holdingPercent']<0 for r in identified)},identified,stamp
    if any(r['holdingPercent']<0 for r in equities):raise ValueError('Short or missing equity sleeve')
    total=sum(r['holdingPercent'] for r in equities)
    if not 90<total<110:raise ValueError('Unexpected equity notional')
    out={'checkedAt':now.date().isoformat(),'equityNavPct':total,'excludedClasses':sorted({r['assetClass'] for r in rows if r['assetClass']!='Equity'})}
    for field,key in [('countries','countryOfRisk'),('sectors','sectorName')]:
        weights={}
        for r in equities:
            label=r[key]
            if label and label!='-':weights[label]=weights.get(label,0)+r['holdingPercent']/total*100
        out[field]={'asOf':stamp,'checkedAt':now.date().isoformat(),'sourceUrl':url,'basis':'fund','compatibility':'equity-holdings-'+field,
                    'method':'Published physical equity positions only; percentage of equity notional, excluding cash, FX and hedge derivatives; original NAV tables retained',
                    'rows':[{'name':n,'weightPct':w} for n,w in sorted(weights.items(),key=lambda x:-x[1])]}
    return out,equities,stamp

def parse_avantis(text, now):
    # Decode a literal array, never execute downloaded JavaScript.
    if 'productName:"Avantis Global Small Cap Value UCITS ETF"' not in text or 'ticker:"AVWS"' not in text:raise ValueError('Wrong Avantis portfolio')
    stamp=document_date(re.search(r'etfHoldingsAsOfDate:"([\d/]+)"',text)[1].replace('/','-'),now)
    literal=text.split('etfHoldings:',1)[1]
    literal=re.sub(r'("(?:\\.|[^"\\])*")|([A-Za-z_$][\w$]*)\s*:',lambda m:m[1] if m[1] else '"'+m[2]+'":',literal)
    rows=json.JSONDecoder().raw_decode(literal)[0]
    stocks=[{'isin':r['isin'],'name':r['name'],'weightPct':float(r['weight'].rstrip('%'))} for r in rows if r.get('isin') and 'COMMON' in (r.get('securityType') or '')]
    if not stocks or any(r['weightPct']<0 for r in stocks) or not 98<=sum(r['weightPct'] for r in stocks)<=101:raise ValueError('Incomplete Avantis equity portfolio')
    return stocks,stamp

def issuer_classifications(text, name, ticker, now):
    if not re.search(r'(?:productName:|\.productName=)"'+re.escape(name)+'"',text) or not re.search(r'(?:ticker:|\.ticker=)"'+re.escape(ticker)+'"',text):raise ValueError('Wrong Avantis classification portfolio')
    raw=re.search(r'etfHoldingsAsOfDate:"([\d/]+)"',text)[1]
    fmt='%Y/%m/%d' if len(raw.split('/')[0])==4 else '%m/%d/%Y'
    stamp=document_date(dt.datetime.strptime(raw,fmt).date().isoformat(),now)
    literal=text.split('etfHoldings:',1)[1]
    literal=re.sub(r'("(?:\\.|[^"\\])*")|([A-Za-z_$][\w$]*)\s*:',lambda m:m[1] if m[1] else '"'+m[2]+'":',literal)
    rows=json.JSONDecoder().raw_decode(literal)[0]
    if len(rows)<100:raise ValueError('Incomplete classification portfolio')
    out=[]
    for r in rows:
        if not r.get('isin') or 'COMMON' not in (r.get('securityType') or ''):continue
        if not r.get('country') or not r.get('sector'):continue
        out.append({'isin':r['isin'],'countryOfRisk':r['country'].title(),'sectorName':r['sector'].title(),'asOf':stamp})
    if len(out)<100:raise ValueError('Missing issuer security classifications')
    return out

def joined(rows, stamp, url, index, now, field):
    total=sum(r['weightPct'] for r in rows);weights={};missing=[];sources=set();dates=[stamp]
    for r in rows:
        evidence=index.get(r['isin']);key='countryOfRisk' if field=='countries' else 'sectorName'
        if not evidence or not evidence.get(key) or evidence[key]=='-':missing.append(r);continue
        label=evidence[key];weights[label]=weights.get(label,0)+100*r['weightPct']/total
        sources.add(evidence['sourceUrl']);dates.append(evidence['asOf'])
    if (dt.date.fromisoformat(max(dates))-dt.date.fromisoformat(min(dates))).days>45:raise ValueError('Classification dates too far apart')
    return {'asOf':min(dates),'holdingsAsOf':stamp,'checkedAt':now.date().isoformat(),'sourceUrl':url,'sourceUrls':sorted(sources|{url}),'basis':'fund','compatibility':'exact-isin-lookthrough-'+field,
            'method':'Official complete equity holdings joined by exact ISIN to dated issuer security classifications; unknown positions remain unallocated',
            'rows':[{'name':n,'weightPct':w} for n,w in sorted(weights.items(),key=lambda x:-x[1])],
            'unclassified':[{'isin':r['isin'],'weightPct':100*r['weightPct']/total} for r in missing]}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');ap.add_argument('--cache',type=Path);ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    now=dt.datetime.now(UTC);path=ROOT/'src/data/exposure-sleeves.json';previous=json.loads(path.read_text()) if path.exists() else {};fresh={};errors=[];index={};successful=set();classification_references={}
    def get(url,name):
        p=args.cache/name if args.cache else None
        if p and p.exists():return p.read_text()
        return public_page(url,('application/json','text/html','text/csv','application/octet-stream'),25000000)
    def one(item):
        code,isin=item;url=API.format(code)
        try:
            record,rows,stamp=equity_rows(json.loads(get(url,'br-'+code+'.json')),isin,url,now)
            return isin,record,rows,stamp,url,None
        except Exception as e:return isin,None,[],None,url,str(e)
    with ThreadPoolExecutor(max_workers=5) as pool:
        for isin,record,rows,stamp,url,error in pool.map(one,FUNDS.items()):
            if error:errors.append({'isin':isin,'error':error});continue
            successful.add(isin)
            if isin in ['IE00B441G979','IE00BQT3WG13']:fresh[isin]=record
            for r in rows:
                if r['isin'] not in index or stamp>=index[r['isin']]['asOf']:index[r['isin']]={**r,'asOf':stamp,'sourceUrl':url}
    us_api=API.replace('uk-retail01','blk-one01').replace('en_GB','en_US').replace('ishares-uk','us-ishares')
    for code in US_FUNDS:
        url=us_api.format(code)
        try:
            body=json.loads(get(url,'br-us-'+code+'.json'))
            if str(body['productId'])!=code:raise ValueError('Classification source product mismatch')
            reference,rows,stamp=equity_rows(body,None,url,now,classification_only=True)
            classification_references[code]=reference
            successful.add(code)
            for r in rows:
                if r['isin'] not in index or stamp>=index[r['isin']]['asOf']:index[r['isin']]={**r,'asOf':stamp,'sourceUrl':url}
        except Exception as e:errors.append({'source':code,'error':str(e)})
    # Same-issuer per-security classifications cover the smaller companies absent
    # from the broad index portfolios. Only exact ISIN matches are used.
    for ticker,name,url,file in [
        ('AVDV','Avantis International Small Cap Value ETF','https://www.avantisinvestors.com/avantis-investments/en-us/total-holdings/120/?type=etf','avdv.html'),
        ('AVUV','Avantis U.S. Small Cap Value ETF','https://www.avantisinvestors.com/avantis-investments/en-us/total-holdings/119/?type=etf','avuv.html')]:
        try:
            for r in issuer_classifications(get(url,file),name,ticker,now):
                if r['isin'] not in index:index[r['isin']]={**r,'sourceUrl':url}
            successful.add('avantis-'+ticker)
        except Exception as e:errors.append({'source':'avantis-'+ticker,'error':str(e)})
    # Exact depositary receipts have the same issuer classification, never the US listing country.
    for adr,ordinary in [('US8740391003','TW0002330008'),('GB0009895292','GB0009895292')]:
        r=index.get(ordinary)
        if not r:errors.append({'isin':adr,'error':'Underlying issuer classification unavailable'});continue
        fresh[adr]={field:{'asOf':r['asOf'],'checkedAt':now.date().isoformat(),'sourceUrl':r['sourceUrl'],'basis':'equity','compatibility':'issuer-'+field,
                  'method':('Direct ordinary share classification' if adr==ordinary else 'Depositary receipt issuer classification; underlying ordinary share '+ordinary),
                  'rows':[{'name':r[key],'weightPct':100}]} for field,key in [('countries','countryOfRisk'),('sectors','sectorName')]}
    try:
        url='https://globalxetfs.eu/api/funds/silv/topholdingscsv';text=get(url,'silv.csv');raw=list(csv.DictReader(io.StringIO(text)))
        raw=[r for r in raw if re.fullmatch(r'\d{4}-\d{2}-\d{2}',r.get('AS_OF_DATE') or '')]
        stamp=document_date(max(r['AS_OF_DATE'] for r in raw),now)
        if len({r['AS_OF_DATE'] for r in raw})!=1:raise ValueError('Mixed Silver Miners dates')
        rows=[{'isin':r['ISIN'],'weightPct':float(r['NET_ASSETS'])} for r in raw if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',r.get('ISIN') or '') and float(r['NET_ASSETS'] or 0)>0]
        if not 99<=sum(r['weightPct'] for r in rows)<=101:raise ValueError('Incomplete Silver Miners portfolio')
        fresh['IE000UL6CLP7']={'sectors':joined(rows,stamp,url,index,now,'sectors')}
    except Exception as e:errors.append({'isin':'IE000UL6CLP7','error':str(e)})
    try:
        cached=args.cache/'silv-morningstar.pdf' if args.cache else None
        body=cached.read_bytes() if cached and cached.exists() else download(SILVER_REPORT)
        fresh.setdefault('IE000UL6CLP7',{})['sectors']=silver_sector_report(body,now)
        successful.add('morningstar-SILV')
    except Exception as e:errors.append({'source':'morningstar-SILV','error':str(e)})
    try:
        url='https://www.avantisinvestors.com/ucitsetf/en-de/total-holdings/295032351307042/'
        rows,stamp=parse_avantis(get(url,'avantis-holdings.html'),now)
        fresh['IE0003R87OG3']={'countries':joined(rows,stamp,url,index,now,'countries')}
    except Exception as e:errors.append({'isin':'IE0003R87OG3','error':str(e)})
    try:
        url='https://globalxetfs.eu/funds/qyld/'
        text=get(url,'qyld.html')
        from bs4 import BeautifulSoup
        flat=' '.join(BeautifulSoup(text,'html.parser').get_text(' ',strip=True).split())
        if 'IE00BM8R0J59' not in flat or not re.search(r'underlying equity exposure designed to match constituents of the Nasdaq.?100 Index',flat,re.I):raise ValueError('QYLD equity underlier contract changed')
        fresh['IE00BM8R0J59']={'underlierEvidence':{'sourceUrl':url,'checkedAt':now.date().isoformat(),'sha256':hashlib.sha256(text.encode()).hexdigest(),'underlier':'Nasdaq-100'}}
    except Exception as e:errors.append({'isin':'IE00BM8R0J59','error':str(e)})
    # Reject regressions independently and retain the last good observation on transient failures.
    for isin,r in fresh.items():
        for f in ['countries','sectors']:
            if f not in r:continue
            if r[f]['asOf']<previous.get(isin,{}).get(f,{}).get('asOf',''):raise ValueError('Date regression '+isin)
            old=previous.get(isin,{}).get(f)
            if errors and old and sum(x['weightPct'] for x in r[f]['rows'])+0.001<sum(x['weightPct'] for x in old['rows']):r[f]=old
        previous[isin]={**previous.get(isin,{}),**r}
    if args.apply:write_json_atomic(path,previous)
    report={'checkedAt':now.isoformat(),'updated':list(fresh),'successes':[{'id':'exposure-sleeve:'+isin,**classification_references.get(isin,{})} for isin in sorted(set(fresh)|successful)],
            'classificationReferences':classification_references,
            'errors':[{'id':'exposure-sleeve:'+e.get('isin',e.get('source','unknown')),'field':'Pays/secteurs de la poche actions',**e} for e in errors]}
    write_json_atomic(args.output,report);print(json.dumps(report))
    if errors:raise SystemExit(1)
if __name__=='__main__':__import__('producer_report_contract').run('collect_exposure_sleeves', main)
