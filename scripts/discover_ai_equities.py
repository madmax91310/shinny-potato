"""Official exchange directories, preserved snapshots and a measurable equity perimeter.
Never infers an ISIN. Discovery does not certify price coverage or publish to other tools.
"""
import concurrent.futures as futures, time
import argparse, csv, datetime as dt, hashlib, html, io, json, pathlib, re, sys
from html.parser import HTMLParser
from urllib.parse import urljoin
import openpyxl
from issuer_documents import download
from data_automation import UTC, write_json_atomic
ROOT=pathlib.Path(__file__).resolve().parents[1]
FOLDER=ROOT/'data/ai-portfolios/equity-scope'
SOURCES=[
 ('nasdaq','US Nasdaq','https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt','nasdaq'),
 ('us-other','US NYSE / NYSE American et autres places documentées','https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt','us-other'),
 ('euronext','Euronext marchés réglementés du téléchargement officiel','https://live.euronext.com/en/pd_es/data/stocks/download?mics=XAMS,XBRU,XDUB,XLIS,XOSL,XPAR&display_datapoints=dp_stocks&display_filters=df_stocks','euronext'),
 ('asx-isin-full','ASX NNA : registre intégral des ISIN attribués (pas une liste de cotations)','https://www.asx.com.au/content/dam/asx/issuers/ISIN.xls','asx-isin'),
 ('asx','ASX listed companies','https://www.asx.com.au/asx/research/ASXListedCompanies.csv','asx'),
 ('jpx-full','JPX all listed issues','https://www.jpx.co.jp/english/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_e.xlsx','jpx'),
 ('jpx-foreign-types','JPX foreign stock / JDR exact classes','https://www.jpx.co.jp/english/equities/products/foreign/issues/index.html','jpx-foreign-classes'),
 ('hkex','HKEX all securities (Main Board et GEM)','https://www.hkex.com.hk/eng/services/trading/securities/securitieslists/ListOfSecurities.xlsx','hkex'),
 ('krx','KRX KOSPI listed companies','https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&marketType=stockMkt','krx'),
 ('krx-kosdaq','KRX KOSDAQ listed companies','https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&marketType=kosdaqMkt','kosdaq'),
 ('twse','TWSE listed companies','https://openapi.twse.com.tw/v1/opendata/t187ap03_L','twse'),
 ('lse','LSE shares: photographie historique publiée, non actuelle','https://docs.londonstockexchange.com/sites/default/files/reports/Instrument%20list.xlsx','lse'),
 ('tsx','TSX / TSXV directory','https://www.tsx.com/en/listings/listing-with-us/listed-company-directory','unavailable'),
 ('xetra-full','Xetra all tradable instruments (fichier T7 officiel)','https://www.cashmarket.deutsche-boerse.com/resource/blob/1528/22fa2294418b8da49cba5a9e108f0181/data/t7-xetr-allTradableInstruments.csv','xetra'),
 ('six-full','SIX liste intégrale des émetteurs actions','https://www.six-group.com/sheldon/equity_issuers/v1/equity_issuers.json','six'),
 ('nordic-main','Nasdaq Nordic Main Market : tous les segments','https://api.nasdaq.com/api/nordic/screener/shares?category=MAIN_MARKET&tableonly=true&page=1&size=1000&segment=LARGE_CAP&segment=MID_CAP&segment=SPAC&segment=SMALL_CAP&lang=en','nordic'),
 ('nordic-first-north','Nasdaq Nordic First North : liste intégrale','https://api.nasdaq.com/api/nordic/screener/shares?category=FIRST_NORTH&tableonly=true&page=1&size=1000&lang=en','nordic'),
]
REFERENCES=[
 ('ndx','Nasdaq-100','https://indexes.nasdaqomx.com/Index/ExportWeightings/NDX?tradeDate=2026-10-21&timeOfDay=SOD','ndx'),
 ('stoxx600csv','STOXX Europe 600','https://www.stoxx.com/document/Indices/Current/Components/SXXP.csv','unavailable'),
 ('sp500','S&P 500','https://www.spglobal.com/spdji/en/indices/equity/sp-500/#overview','partial'),
 ('ftse-all','FTSE 100 : composition intégrale publiée','https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadConstituentsWeights/?indexdetails=UKX','ftse'),
 ('russell3000','Russell 3000 : contrôle de composition complète','https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadConstituentsWeights/?indexdetails=RUA','unavailable'),
 ('russell2000','Russell 2000 : contrôle de composition complète','https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadConstituentsWeights/?indexdetails=RUT','unavailable'),
 ('msci','MSCI World','https://www.msci.com/indexes/index/990100','unavailable'),
]

def digest(v):return hashlib.sha256(v.encode() if isinstance(v,str) else v).hexdigest()
def clean(v):return re.sub(r'\s+',' ',str(v or '')).strip()
def valid_isin(s):
 s=clean(s).upper()
 if not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',s):return None
 digits=''.join(str(ord(c)-55) if c.isalpha() else c for c in s)
 return s if sum((int(n)*2//10+int(n)*2%10) if i%2 else int(n) for i,n in enumerate(digits[::-1]))%10==0 else None

def security_type(name, default='ordinary'):
 n=name.lower()
 # Share descriptors outrank words in the issuer name (e.g. Preferred Bank common stock).
 descriptor=n.rsplit(' - ',1)[-1]
 if re.search(r'\b(common stock|ordinary shares?)\b',descriptor) and not re.search(r'\b(units?|warrants?|rights?|options?|preferred|depositary|depository|ads|adr|cdi)\b',descriptor) and not re.search(r'\b(fund|investment trust|investment company)\b',n):return 'ordinary'
 for pattern,kind in [(r'\b(?:etc|exchange[ -]*traded commodit(?:y|ies))\b','ETC'),(r'\b(?:etn|exchange[ -]*traded notes?)\b','ETN'),(r'\b(?:etp|exchange[ -]*traded products?)\b','ETP'),(r'\b(?:etf|exchange[ -]*traded funds?)\b','ETF'),(r'\b(units?|stapled)\b','unit'),(r'\b(warrants?|rights?|options?)\b','warrant-right'),(r'\b(preferred|preference|pref|pfd|vorzugsaktien|\bvz\b)\b','preferred'),(r'\b(notes?|debentures?|bonds?)\b','debt'),(r'\b(etf|etn|etp|exchange.traded)\b','ETF'),(r'\b(closed.end|\bfund\b|investment trust|investment company)\b','closed-end-fund'),(r'\b(depositary|depository|adr|ads|cdi|gdr|tdr|sdb)\b','depositary-receipt')]:
  if re.search(pattern,n):return kind
 return default

def row(name,ticker,mic,currency,country,kind='ordinary',isin=None,**kw):
 # Missing identifiers remain absent; exact exchange security codes are valid identity keys.
 name,ticker=clean(name),clean(ticker)
 if not name:raise ValueError('Empty exchange security name')
 if not ticker and not kw.get('officialSecurityId'):raise ValueError('Empty exchange security identity')
 company=kw.pop('company',None) or name.split(' - ')[0]
 return dict(name=name,company=company,shareClass=kw.pop('shareClass',None) or (re.search(r'\bClass\s+([A-Za-z0-9]+)',name,re.I)[1] if re.search(r'\bClass\s+([A-Za-z0-9]+)',name,re.I) else None),companyId='issuer-label:'+digest(company.casefold())[:20],companyIdentityConvention='official-label-group; not a verified LEI',ticker=ticker,mic=mic,currency=currency,country=country,shareType=kind,isin=valid_isin(isin),officialSecurityId=kw.pop('officialSecurityId',ticker),**kw)

def workbook(body):
 w=openpyxl.load_workbook(io.BytesIO(body),read_only=True,data_only=True)
 # Several official exports declare an incorrect dimension (HKEX: eight rows).
 for sh in w:sh.reset_dimensions()
 return w

class Tables(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.current=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.current=[]
  if tag in ('td','th') and self.current is not None:self.cell=[]
 def handle_data(self,s):
  if self.cell is not None:self.cell.append(s)
 def handle_endtag(self,tag):
  if tag in ('td','th') and self.cell is not None:self.current.append(clean(''.join(self.cell)));self.cell=None
  if tag=='tr' and self.current is not None:self.rows.append(self.current);self.current=None

def parse(body, parser):
 rows=[];asof=None;notes=[]
 if parser=='jpx-foreign-classes':
  text=body.decode('utf-8')
  for tr in re.findall(r'<tr\b[^>]*>(.*?)</tr>',text,re.S|re.I):
   cells=re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>',tr,re.S|re.I);values=[clean(html.unescape(re.sub(r'<[^>]+>',' ',c))) for c in cells]
   if len(cells)!=8 or not re.fullmatch(r'\d{4}',values[1]):continue
   kind='ordinary' if values[7]=='-' else 'depositary-receipt' if re.search(r'/foreign/issues/[^"\s]+\.pdf',cells[7]) else None
   rows.append({'name':values[0],'ticker':values[1],'shareType':kind,'country':values[4]})
  notes.append('Full JPX table; PDF in JDR column identifies foreign share trust beneficiary securities, not the underlying shares.')
 elif parser in ('nasdaq','us-other'):
  text=body.decode('utf-8-sig');stamp=re.search(r'File Creation Time: (\d{2})(\d{2})(\d{4})',text)
  if not stamp:raise ValueError('Missing Nasdaq directory creation date')
  asof=f'{stamp[3]}-{stamp[1]}-{stamp[2]}'
  for r in csv.DictReader(io.StringIO(text),delimiter='|'):
   t=r.get('Symbol') or r.get('ACT Symbol')
   if not t or t.startswith('File Creation'):continue
   mic='XNAS' if parser=='nasdaq' else {'N':'XNYS','A':'XASE','P':'ARCX','Z':'BATS','V':'IEXG'}.get(r['Exchange'])
   kind='test-issue' if r.get('Test Issue')=='Y' else 'ETF' if r.get('ETF')=='Y' else security_type(r['Security Name'])
   rows.append(row(r['Security Name'],t,mic,'USD',None,kind,listingCountry='US',financialStatus=r.get('Financial Status'),providerTicker=(r.get('CQS Symbol') or t).replace('.','-').replace('$','-P')))
 elif parser=='nordic':
  data=json.loads(body);items=data['data']['instrumentListing']['rows'];assert len(items)==int(data['data']['pagination']['total']),'Incomplete Nordic pagination'
  asof=data['status']['timestamp'][:10]
  for r in items:rows.append(row(r['fullName'],r['symbol'],r.get('micCode') or None,r['currency'],None,security_type(r['fullName']),r['isin'],officialSecurityId=r['orderbookId'],nordicOrderbookId=r['orderbookId'],exposure=r.get('sector')))
  notes.append('API response timestamp dates this directory observation; all pagination totals reconciled. Exact venue verified through each instrument info response.')
 elif parser=='six':
  data=json.loads(body);items=data['itemList'];assert data['status']=='Ok' and data['totalCount']==len(items),'SIX incomplete result / pagination'
  for r in items:
   kind='ordinary' if r['classOfShareCode'] in ['RS','BS'] else 'depositary-receipt' if 'Depositary' in r['classOfShare'] else 'participation-certificate' if 'Participation' in r['classOfShare'] else 'other-equity'
   rows.append(row(r['company'],r['valorSymbol'],r['tradingPlatform'],r['tradingCurrency'],r['country'],kind,r['isin'],shareClass=r['classOfShare'],primaryListing=r['primaryListing'],officialSecurityId=str(r['valorNumber'])))
  notes.append('Current issuer directory; source publishes no explicit snapshot timestamp.')
 elif parser=='xetra':
  text=body.decode('utf-8-sig');lines=text.splitlines();asof=dt.datetime.strptime(lines[1].split(';')[1],'%d.%m.%Y').date().isoformat()
  for r in csv.DictReader(io.StringIO('\n'.join(lines[2:])),delimiter=';'):
   kind=security_type(r['Instrument']) if r['Instrument Type']=='CS' else r['Instrument Type']
   rows.append(row(r['Instrument'],r['Mnemonic'],r['MIC Code'],r['Currency'],r.get('Country Of Issue') or None,kind,r['ISIN'],primaryMic=r.get('Primary Market MIC Code'),productStatus=r['Product Status'],instrumentStatus=r['Instrument Status'],officialSecurityId=r['Instrument ID'],unitOfQuotation=r['Unit of Quotation'],listedAt=r.get('First Trading Date')))
 elif parser=='ftse':
  import tempfile,subprocess
  with tempfile.NamedTemporaryFile(suffix='.pdf') as f:
   f.write(body);f.flush();text=subprocess.check_output(['pdftotext','-layout',f.name,'-']).decode()
  stamp=re.search(r'Closing on (\d{1,2} \w+ \d{4})',text);asof=dt.datetime.strptime(stamp[1],'%d %B %Y').date().isoformat()
  for line in text.splitlines():
   for name,weight,country in re.findall(r'([A-Za-z][A-Za-z0-9 &().,/-]*?)\s{2,}(\d+(?:\.\d+)?)\s+(UNITED KINGDOM)',line):rows.append({'company':clean(name),'ticker':None,'weight':float(weight),'country':country})
  if len(rows)!=100:raise ValueError('FTSE complete weights expected 100 rows, parsed '+str(len(rows)))
 elif parser=='asx-isin':
  import xlrd
  sh=xlrd.open_workbook(file_contents=body).sheet_by_index(0);stamp=re.search(r'(\d{2}/\d{2}/\d{2})',str(sh.cell_value(3,0)));asof=dt.datetime.strptime(stamp[1],'%d/%m/%y').date().isoformat()
  for i in range(5,sh.nrows):
   code,company,description,isin=[clean(v) for v in sh.row_values(i)[:4]]
   if not code or not company:continue
   kind=security_type(description,'other-product')
   if re.search(r'\bORDINARY FULLY PAID\b',description) and not re.search(r'UNIT|STAPLED',description):kind=security_type(company+' - Common Stock')
   rows.append(row(company+' · '+description,code,None,None,None,kind,isin,company=company,shareClass=description,registrationOnly=True))
  notes.append('NNA allocation register includes unquoted securities and other Australian venues; it is not evidence of an ASX quote.')
 elif parser=='asx':
  text=body.decode('utf-8-sig');date=re.search(r'as at (.+)',text.splitlines()[0]);asof=dt.datetime.strptime(re.sub(r' (?:AEDT|AEST) ', ' ',date[1]),'%a %b %d %H:%M:%S %Y').date().isoformat()
  for r in csv.DictReader(io.StringIO(text.split('\n',2)[2])):
   if r.get('ASX code'):rows.append(row(r['Company name'],r['ASX code'],'XASX','AUD',None,security_type(r['Company name']),listingCountry='AU',exposure=r.get('GICS industry group')))
 elif parser=='euronext':
  text=body.decode('utf-8-sig');allrows=list(csv.DictReader(io.StringIO(text),delimiter=';'))
  for r in allrows:
   if not r.get('ISIN'):
    try:asof=dt.datetime.strptime(r['Name'],'%d %b %Y').date().isoformat()
    except ValueError:pass
    continue
   market=r['Market'];parts=market.replace('Euronext ','').split(', ')
   if len(parts)>1:
    # The export has one ticker for several venues; only the first exact primary is bound.
    notes.append('Multi-market rows retain first displayed venue; alternative tickers not inferred.')
   mic={'Paris':'XPAR','Amsterdam':'XAMS','Brussels':'XBRU','Lisbon':'XLIS','Oslo Børs':'XOSL','Dublin':'XDUB'}.get(parts[0])
   country={'XPAR':'FR','XAMS':'NL','XBRU':'BE','XLIS':'PT','XOSL':'NO','XDUB':'IE'}.get(mic)
   rows.append(row(r['Name'],r['Symbol'],mic,r['Currency'],None,security_type(r['Name']),r['ISIN'],listingCountry=country,exchangeLabel=market))
 elif parser in ('jpx','hkex','lse','ndx'):
  w=workbook(body)
  sh=w['1.1 Shares'] if parser=='lse' else w.active
  values=list(sh.values)
  if parser=='jpx':
   for v in values[1:]:
    if len(v)<4 or not v[1]:continue
    asof=dt.datetime.strptime(str(v[0]),'%Y%m%d').date().isoformat();section=str(v[3]);mixed='REIT' in section
    kind=security_type(str(v[2])) if 'Market' in section else 'ETF' if 'ETF' in section else 'mixed-investment-vehicle' if mixed else 'other-product'
    rows.append(row(v[2],v[1],'XTKS','JPY','JP' if 'Domestic' in section else None,kind,section=v[3],exposure=clean(v[7]),listingCountry='JP',typeUnverified=mixed,identityDetailError='JPX combines REITs, venture, country and infrastructure funds in this section; exact product class requires a separate official proof.' if mixed else None))
  elif parser=='hkex':
   stamp=re.search(r'(\d{2}/\d{2}/\d{4})',str(values[1][0]));asof=dt.datetime.strptime(stamp[1],'%d/%m/%Y').date().isoformat()
   for v in values[3:]:
    if len(v)<17 or not v[0] or not str(v[0]).isdigit():continue
    kind=security_type(str(v[1])) if v[2]=='Equity' and 'Equity Securities' in str(v[3]) else security_type(str(v[2])+' '+str(v[3]),'other-product')
    rows.append(row(v[1],str(v[0]).zfill(5),'XHKG',v[16],None,kind,v[5],section=v[3]))
  elif parser=='lse':
   stamp=re.search(r'As at (.+)',str(values[2][0]));asof=dt.datetime.strptime(stamp[1],'%d %B %Y').date().isoformat()
   idx=next(i for i,v in enumerate(values) if v and v[0]=='TIDM');keys=list(values[idx])
   for v in values[idx+1:]:
    r=dict(zip(keys,v))
    if not r.get('ISIN') or not r.get('TIDM'):continue
    kind=security_type(str(r['Issuer Name'])+' '+str(r['Instrument Name']))
    rows.append(row(r['Issuer Name']+' · '+r['Instrument Name'],r['TIDM'],'XLON',r['Trading Currency'],r.get('Country of Incorporation'),kind,r['ISIN'],company=r['Issuer Name'],shareClass=r['Instrument Name'],identityStale=True))
  else:
   for v in values:
    if len(v)>=2 and v[1] and v[0] and v[0]!='Company Name':rows.append({'company':v[0],'ticker':v[1]})
   asof=None
 elif parser in ('krx','kosdaq'):
  p=Tables();p.feed(body.decode('euc-kr'));keys=p.rows[0]
  for values in p.rows[1:]:
   r=dict(zip(keys,values));ticker=r.get('종목코드')
   if ticker and ticker.isdigit():rows.append(row(r['회사명'],ticker.zfill(6),'XKRX' if parser=='krx' else 'XKOS','KRW',None,security_type(r['회사명']),listingCountry='KR',listedAt=r.get('상장일'),exposure=r.get('업종')))
  notes.append('Directory has no explicit snapshot date; fetchedAt dates observation, not source publication.')
 elif parser=='twse':
  for r in json.loads(body):
   date=r['出表日期'];asof=f'{int(date[:3])+1911}-{date[3:5]}-{date[5:7]}'
   rows.append(row(r['公司名稱'],r['公司代號'],'XTAI','TWD',None,'depositary-receipt' if 'TDR' in r['公司名稱'] else 'ordinary',company=r['公司名稱'],englishName=r.get('英文簡稱'),countryOfRegistration=r.get('外國企業註冊地國')))
 else:raise ValueError('No complete machine-readable constituents obtained; landing/factsheet is not a full directory')
 if not rows:raise ValueError('Official directory returned zero parsed rows')
 return rows,asof,sorted(set(notes))

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache-dir',type=pathlib.Path);p.add_argument('--refresh',action='store_true');args=p.parse_args();FOLDER.mkdir(parents=True,exist_ok=True);(FOLDER/'raw').mkdir(exist_ok=True)
 now=dt.datetime.now(UTC).isoformat();sources=[];instruments=[];references=[];class_proofs=[]
 for key,label,url,parser in SOURCES+REFERENCES:
  if parser=='ndx':
   import exchange_calendars as xc
   day=dt.datetime.now(UTC).date()-dt.timedelta(days=1);cal=xc.get_calendar('XNYS');session=cal.sessions_in_range((day-dt.timedelta(days=10)).isoformat(),day.isoformat())[-1].date().isoformat();url=re.sub(r'tradeDate=[^&]+','tradeDate='+session,url)
  raw=FOLDER/'raw'/key;prior_path=FOLDER/'sources.json';prior=next((s for s in json.loads(prior_path.read_text()).get('sources',[]) if s['id']==key),{}) if prior_path.exists() else {}
  source={'id':key,'label':label,'url':url,'checkedAt':now,'sourceAsOf':None,'scope':'security-identity-register' if parser=='asx-isin' else 'reference-index' if key in {r[0] for r in REFERENCES} else 'exchange-directory','totalRows':None,'status':'blocked','reason':None}
  try:
   if args.cache_dir and (args.cache_dir/key).exists():body=(args.cache_dir/key).read_bytes();source['retrievedAt']=dt.datetime.fromtimestamp((args.cache_dir/key).stat().st_mtime,UTC).isoformat()
   elif raw.exists() and not args.refresh:body=raw.read_bytes();source['retrievedAt']=prior.get('retrievedAt') or now
   else:body=download(url,max_bytes=25_000_000,max_attempts=1,timeout=25);source['retrievedAt']=now
   if parser=='nordic':
    payload=json.loads(body);pagination=payload['data']['pagination'];pages=int(pagination['totalPages']);parts=[]
    if pages>1:
     complete=list(payload['data']['instrumentListing']['rows'])
     for page in range(2,pages+1):
      page_url=url.replace('page=1&','page='+str(page)+'&');part=download(page_url,max_bytes=12_000_000,max_attempts=1);part_file=FOLDER/'raw'/(key+'-page-'+str(page));part_file.write_bytes(part);parts.append({'url':page_url,'sha256':digest(part),'rawFile':'raw/'+part_file.name});complete.extend(json.loads(part)['data']['instrumentListing']['rows'])
     assert len(complete)==int(pagination['total']),'Nordic pagination reconciliation failed'
     payload['data']['instrumentListing']['rows']=complete;payload['data']['pagination']['totalPages']=1;body=json.dumps(payload,ensure_ascii=False).encode();source['additionalPages']=parts
   raw.write_bytes(body);source['sha256']=digest(body);source['rawFile']='raw/'+key
   parsed,asof,notes=parse(body,parser)
   if parser=='ndx':asof=re.search(r'tradeDate=([^&]+)',url)[1]
   source.update(sourceAsOf=asof,totalRows=len(parsed),status='historical' if parser=='lse' else 'complete-file',reason=None,notes=notes)
   if parser=='jpx-foreign-classes':
    source['scope']='security-classification';class_proofs=parsed
   elif parser in ('ndx','ftse'):references.extend({**r,'sourceId':key,'asOf':asof} for r in parsed)
   else:
    for r in parsed:r.update(sourceId=key,sourceUrl=url,sourceAsOf=asof,checkedAt=source['retrievedAt'],identitySha256=source['sha256'])
    instruments.extend(parsed)
  except Exception as e:
   source['reason']=str(e)
   # A refresh failure never silently removes the previously discovered perimeter.
   previous=FOLDER/'instruments.json'
   if previous.exists():instruments.extend(r for r in json.loads(previous.read_text())['listings'] if r['sourceId']==key)
   reference_path=FOLDER/'references.json'
   if parser in ('ndx','ftse') and reference_path.exists():
    retained=[r for r in json.loads(reference_path.read_text())['memberships'] if r['sourceId']==key];references.extend(retained);source.update(retainedMemberships=len(retained),previousSourceAsOf=prior.get('sourceAsOf'))
   if parser=='jpx-foreign-classes' and raw.exists():
    class_proofs=parse(raw.read_bytes(),parser)[0];source.update(sha256=digest(raw.read_bytes()),retainedRetrievedAt=prior.get('retrievedAt'),retainedClassifications=len(class_proofs))
  sources.append(source);print(key,source['status'],source['totalRows'],source['reason'] or '',flush=True)
 previous_path=FOLDER/'instruments.json';previous=json.loads(previous_path.read_text())['listings'] if previous_path.exists() else []
 prior_jpx={r['ticker']:r for r in previous if r['sourceId']=='jpx-full'}
 jpx_source=next((s for s in sources if s['id']=='jpx-foreign-types'),{})
 proof_by_code={r['ticker']:r for r in class_proofs}
 for r in instruments:
  if r['sourceId']!='jpx-full' or 'Foreign' not in r.get('section',''):continue
  proof=proof_by_code.get(r['ticker'])
  if not proof or proof['name']!=r['name'] or not proof.get('shareType'):
   r['identityDetailError']='Exact foreign share / JDR class requires a matching official JPX classification.';continue
  prior=prior_jpx.get(r['ticker'],{})
  r.update(shareType=proof['shareType'],country=proof['country'],identityClassSourceUrl=jpx_source['url'],identityClassSourceSha256=jpx_source['sha256'])
  if prior.get('listingId') and prior.get('company')==r['company']:
   r.update(instrumentId=prior.get('instrumentId'),listingId=prior['listingId'])
   if prior.get('shareType')!=r['shareType']:r['reviewedShareTypeBefore']=prior.get('shareType')
 # Reconcile every primary ASX company code against the NNA register, including share type.
 asx_primary={r['ticker']:r for r in instruments if r['sourceId']=='asx'};allocated={}
 for r in instruments:
  if r['sourceId']=='asx-isin-full':allocated.setdefault(r['ticker'],[]).append(r)
 def legal_name(s):return re.sub(r'[^A-Z0-9]','',re.sub(r'\bLTD\b','LIMITED',s.upper()))
 for code,r in asx_primary.items():
  choices=allocated.get(code,[])
  if len(choices)==1 and legal_name(choices[0]['company'])==legal_name(r['company']):
   proof=choices[0];r.update(isin=proof['isin'],shareType=proof['shareType'],shareClass=proof['shareClass'],identityClassSourceUrl=proof['sourceUrl'],identityClassSourceSha256=proof['identitySha256'],identityClassSourceAsOf=proof['sourceAsOf']);proof.update(mic='XASX',currency='AUD',registrationOnly=False,listingCountry='AU')
  else:r['identityDetailError']='ASX current company code lacks an unambiguous security class / ISIN match in the dated NNA register; class review required.'
 for r in instruments:
  if r.get('registrationOnly'):r['identityDetailError']='ISIN allocation is not proof of an active quote: venue, listing status and quote currency remain undocumented for this security code.'
 # Bulk Nordic responses omit MIC. Verify every exact venue, never infer from currency/ISIN prefix.
 detail_path=FOLDER/'raw/nordic-details.json';details=json.loads(detail_path.read_text()) if detail_path.exists() else {}
 nordic=[r for r in instruments if r.get('nordicOrderbookId')]
 def info(r):
  key=r['nordicOrderbookId'];entry=details.get(key);url='https://api.nasdaq.com/api/nordic/instruments/'+key+'/info?assetClass=SHARES&lang=en'
  try:
   if not entry or not entry.get('raw') or args.refresh:
    time.sleep(.15);body=download(url,max_bytes=1_000_000,max_attempts=1,timeout=25);entry={'raw':json.loads(body),'url':url,'sha256':digest(body),'retrievedAt':dt.datetime.now(UTC).isoformat()}
   header=entry['raw']['data']['qdHeader']
   if header['isin']!=r['isin'] or header['symbol']!=r['ticker'] or header['currency']!=r['currency']:raise ValueError('Nordic detail identity / currency differs from bulk directory')
   exchange=header['exchange'];mic={'Nasdaq Stockholm':'XSTO','Nasdaq Helsinki':'XHEL','Nasdaq Copenhagen':'XCSE','Nasdaq Iceland':'XICE','First North GM Sweden':'XSTO','First North GM Sweden Auction':'XSTO','First North GM Finland':'XHEL','First North GM Finland Auction':'XHEL','First North GM Denmark':'XCSE','First North GM Denmark Auction':'XCSE','First North GM Iceland':'XICE','First North GM Iceland Auction':'XICE'}.get(exchange)
   if not mic:raise ValueError('Unmapped exact Nordic exchange: '+str(exchange))
   segment_mic={'XSTO':'FNSE','XHEL':'FNFI','XCSE':'FNDK','XICE':'FNIS'}.get(mic) if r['sourceId']=='nordic-first-north' else mic
   r.update(operatingMic=mic,segmentMic=segment_mic,micConvention='ISO 10383 market segment; operating venue retained separately')
   r.update(mic=segment_mic,identityDetailUrl=url,identityDetailSha256=entry['sha256'],identityDetailRetrievedAt=entry['retrievedAt'],section='FIRST_NORTH' if r['sourceId']=='nordic-first-north' else 'MAIN_MARKET')
   return key,entry
  except Exception as e:r.update(identityDetailError=str(e));return key,entry or {'error':str(e),'url':url}
 if nordic:
  with futures.ThreadPoolExecutor(max_workers=4) as pool:
   for index,(key,entry) in enumerate(pool.map(info,nordic),1):
    details[key]=entry
    if index%100==0:write_json_atomic(detail_path,details);print('Nordic exact venues',index,'/',len(nordic),flush=True)
  write_json_atomic(detail_path,details)
 # SEC is an issuer-identity cross-check, never a substitute securities directory.
 sec_url='https://www.sec.gov/files/company_tickers_exchange.json';sec_raw=FOLDER/'raw/sec-identities'
 try:
  cache=args.cache_dir/'sec-identities' if args.cache_dir else sec_raw
  body=cache.read_bytes() if cache.exists() and not args.refresh else download(sec_url,max_bytes=8_000_000,max_attempts=1,headers={'User-Agent':'EpargnantLibre public-research https://github.com/madmax91310/shinny-potato'})
  sec_raw.write_bytes(body);sec=json.loads(body);entries=[dict(zip(sec['fields'],v)) for v in sec['data']]
  by_symbol={(r['exchange'],r['ticker'].replace('.','-')):r for r in entries};matched=0
  for r in instruments:
   exchange={'XNAS':'Nasdaq','XNYS':'NYSE','XASE':'NYSE American'}.get(r['mic']);entry=by_symbol.get((exchange,(r['ticker'] or '').replace('.','-')))
   if entry:
    r.update(cik=str(entry['cik']),companyId='sec-cik:'+str(entry['cik']),legalCompanyName=entry['name'],companyIdentityConvention='SEC CIK + exact exchange/ticker',companyIdentitySource=sec_url);matched+=1
  sources.append({'id':'sec-identities','label':'SEC company tickers / CIK','url':sec_url,'scope':'issuer-identity','status':'complete-file','totalRows':len(entries),'matchedListings':matched,'sourceAsOf':None,'checkedAt':now,'retrievedAt':dt.datetime.fromtimestamp(cache.stat().st_mtime,UTC).isoformat() if cache.exists() else now,'sha256':digest(body),'rawFile':'raw/sec-identities','reason':None})
 except Exception as e:sources.append({'id':'sec-identities','label':'SEC company tickers / CIK','url':sec_url,'scope':'issuer-identity','status':'blocked','totalRows':None,'reason':str(e),'checkedAt':now})
 # Registered fund vehicles are not inferred to be ordinary companies from their share label.
 fund_path=FOLDER/'sec-fund-classifications.json'
 if fund_path.exists():
  fund_registry=json.loads(fund_path.read_text());matched=0
  for r in instruments:
   proof=fund_registry['registrants'].get(r.get('cik'))
   if proof and r['shareType'] not in ['ETF','warrant-right','debt','preferred','unit']:
    r.update(shareType='closed-end-fund' if proof['formType']=='N-2' else 'registered-investment-fund',issuerClassificationProof=proof);matched+=1
  sources.append({'id':'sec-ncen','label':'SEC N-CEN : quatre derniers trimestres publiés','url':'https://www.sec.gov/data-research/sec-markets-data/form-n-cen-data-sets','scope':'issuer-classification','status':'complete-published-files','totalRows':sum(s.get('registrantRows',0) for s in fund_registry['sources']),'matchedListings':matched,'checkedAt':fund_registry['checkedAt'],'sourceAsOf':None,'reason':fund_registry['coverageLimit']})
 # Persistent class identities are separate from listing IDs and issuer identities.
 map_path=FOLDER/'identity-map.json';identity_map=json.loads(map_path.read_text()) if map_path.exists() else {};corrections_path=FOLDER/'identity-corrections.json';corrections=json.loads(corrections_path.read_text()) if corrections_path.exists() else []
 noisin=[r for r in instruments if not r.get('isin') and r['shareType'] in ['ordinary','depositary-receipt','REIT']]
 def legacy_id(r):return 'security:'+digest('|'.join([r['company'],r['name'],r['shareType']]))[:24]
 grouped={}
 for r in noisin:grouped.setdefault(legacy_id(r),[]).append(r)
 book_path=ROOT/'data/ai-portfolios/book.json';book=json.loads(book_path.read_text()) if book_path.exists() else {'competitions':[]};used={q for c in book['competitions'] for q in c['config']['universe']}
 for r in noisin:
  key=('sec-cik:'+r['cik']+'/'+r['ticker'] if r.get('cik') else r['sourceId']+'/'+r['officialSecurityId'])+'/'+r['shareType'];old=legacy_id(r);currency='GBP' if r['currency'] in ['GBp','GBX'] else r['currency'];quote_key='/'.join([str(r['mic']),r['ticker'],str(currency)]);listing=r.get('listingId') or old+'-'+str(r['mic'])+'-'+r['ticker']+'-'+str(currency)
  if key not in identity_map:
   distinct={str(v['mic'])+'/'+v['ticker'] for v in grouped[old]};instrument=r.get('instrumentId') or (old if len(distinct)==1 else old+'-class-'+digest(key)[:10])
   identity_map[key]={'instrumentId':instrument,'sourceName':r['name'],'issuerName':r['company'],'cik':r.get('cik'),'createdAt':now,'quotes':{}}
  entry=identity_map[key];entry['quotes'].setdefault(quote_key,listing);r.update(instrumentId=entry['instrumentId'],listingId=entry['quotes'][quote_key],identityKey=key)
  if r.get('reviewedShareTypeBefore'):
   if r['listingId'] in used:r['identityDetailError']='Official product class correction affects an archived competition; explicit review required.'
   elif not any(c.get('kind')=='security-classification' and c['id']==r['listingId'] and c.get('afterShareType')==r['shareType'] for c in corrections):corrections.append({'kind':'security-classification','id':r['listingId'],'at':now,'beforeShareType':r['reviewedShareTypeBefore'],'afterShareType':r['shareType'],'sourceUrl':r['identityClassSourceUrl'],'financialEffect':'none; exact listing, instrument ID and units retained; no competition references it'})
  if not entry.get('cik') and entry.get('issuerName',entry['sourceName'].split(' · ')[0])!=r['company']:r['identityDetailError']='Official name changed for an exchange security code without stable issuer identifier; explicit identity review required.'
  if entry['instrumentId']!=old and not any(c['id']==r['listingId'] for c in corrections):
   if r['listingId'] in used:r['identityDetailError']='Ambiguous share classes already referenced in a competition; explicit migration required.'
   else:corrections.append({'id':r['listingId'],'before':old,'after':entry['instrumentId'],'mic':r['mic'],'ticker':r['ticker'],'currency':currency,'at':now,'sourceUrl':r['sourceUrl'],'reason':'Identical official labels do not prove identical companies/classes. Distinct exchange security codes retained; exact listing and its prices unchanged. No competition references this listing.'})
 previous_path=FOLDER/'instruments.json';previous=json.loads(previous_path.read_text())['listings'] if previous_path.exists() else [];previous_quotes={(r['sourceId'],r.get('mic'),r['ticker'],r.get('currency')):r for r in previous};promotions={}
 for r in instruments:
  if r['sourceId']!='asx':continue
  if not r.get('isin'):
   prior=previous_quotes.get(('asx',r['mic'],r['ticker'],r['currency']))
   if prior and prior.get('listingId'):r.update(listingId=prior['listingId'],instrumentId=prior.get('instrumentId'));promotions[r['ticker']]=prior['listingId']
   continue
  prior=previous_quotes.get(('asx',r['mic'],r['ticker'],r['currency']))
  if not prior:continue
  if prior.get('isin'):
   if prior['isin']==r['isin'] and prior.get('listingId'):r.update(listingId=prior['listingId'],instrumentId=r['isin']);promotions[r['ticker']]=prior['listingId']
   continue
  old=prior.get('instrumentId') or legacy_id(prior);listing=prior.get('listingId') or old+'-XASX-'+r['ticker']+'-AUD'
  if listing in used:r['identityDetailError']='Verified ISIN resolution affects an archived competition; explicit identity migration required.';continue
  r.update(listingId=listing,instrumentId=r['isin']);promotions[r['ticker']]=listing
  if not any(c['id']==listing and c['after']==r['isin'] for c in corrections):corrections.append({'id':listing,'before':old,'after':r['isin'],'mic':'XASX','ticker':r['ticker'],'currency':'AUD','at':now,'sourceUrl':r['identityClassSourceUrl'],'reason':'ASX NNA ISIN + exact primary company code and matching legal issuer name. Listing and retained prices unchanged; no competition references it.'})
 for r in instruments:
  if r['sourceId']=='asx-isin-full' and r.get('mic')=='XASX' and r['ticker'] in promotions:r['listingId']=promotions[r['ticker']]
 write_json_atomic(map_path,identity_map);write_json_atomic(corrections_path,corrections)
 write_json_atomic(FOLDER/'sources.json',{'version':1,'generatedAt':now,'sources':sources,'companyCounting':'Official issuer labels only; cross-market legal entity resolution incomplete. No LEI invented.'})
 write_json_atomic(FOLDER/'instruments.json',{'version':1,'generatedAt':now,'listings':instruments})
 write_json_atomic(FOLDER/'references.json',{'version':1,'memberships':references})
 print(f'{len(instruments)} official rows; {len(references)} index constituents',flush=True)
if __name__=='__main__':main()
