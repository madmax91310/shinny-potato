"""Exact-share L&G public price-history export, bound to current fund-centre data."""
import csv,datetime as dt,io,json,re,urllib.request
from bs4 import BeautifulSoup
from collect_lg_api import parse as catalogue_facts
from issuer_nav_history import dated

def product_page(url):
 # Match the public fund-centre document request. Cookie-jar regional redirects
 # may return the generic catalogue (HTTP200); that is not an identity proof.
 with urllib.request.urlopen(url,timeout=25)as response:
  if response.geturl()!=url or response.headers.get_content_type()!='text/html':raise ValueError('L&G exact product page redirected or changed type')
  body=response.read(8_000_001)
  if len(body)>8_000_000:raise ValueError('L&G identity page exceeds bound')
  return body


def identity(page,catalogue,source,now):
 soup=BeautifulSoup(page,'html.parser');nodes=soup.find_all('script',id='static-data')
 if len(nodes)!=1:raise ValueError('L&G embedded fund schema changed')
 embedded=json.loads(nodes[0].string or nodes[0].get_text());share=embedded['activeShareClass']['data'];facts=catalogue_facts(catalogue,{**source,'sourceUrl':source['catalogueUrl']},now,'bound-by-collector-source-hash')
 data=share['data'];launch=dt.datetime.strptime(data['launchDate'],'%d/%m/%Y').date().isoformat()
 if share['id']!=source['shareClassId']or data['shareclassISIN']!=source['isin']or share['currency']!=source['navCurrency']or data['shortName']!='USD Acc' or launch!=source['identityFrom']:
  raise ValueError('L&G exact share/currency/income/launch changed')
 if source['periodStart']<launch[:7]or data['shareclassPageURL']!=source['sourceUrl'].removeprefix('https://fundcentres.landg.com'):raise ValueError('L&G supplied window/page differs from exact share')
 section=next((p for p in embedded['pageSections']if p.get('key')=='prices'),None)
 if section is None:raise ValueError('L&G prices section missing')
 prices=section['canvas']['part'];table=prices['pricesDataTable']['part']['data']
 if table['priceTypes']!=['84','87']or table['headers']!=[{'key':'date-1','label':'Date'},{'key':'nav-2','label':'NAV'},{'key':'change-3','label':'Change'}]or prices['pricesInfo']['part']['headers']!=['Price time','Currency']or prices['pricesInfo']['part']['data']!=[['16:00 EST (NY)','USD']]:raise ValueError('L&G official NAV export meaning changed')
 url=f"https://fundcentres.landg.com/srp/api/price-history/{share['id']}?pricetype_id=84&pricetype_id=87"
 return url,facts,{'identityFrom':launch,'shareClassId':share['id'],'nativeCurrency':share['currency'],'incomePolicy':data['shortName'],'valuationTime':'16:00 EST (NY), issuer date unchanged','controlledFields':['exact ISIN','shareClassId','currency','launchDate','income','NAV export headers','daily NAV','daily date','calendar years'],'unusedFields':['Absolute NAV change'],'pagePricingFlag':table['pricingShareClasses'].get(str(share['id'])),'pagePricingDates':table['pricingDates'].get(str(share['id']))}

def parse(body,source,facts,proof,now):
 reader=csv.DictReader(io.StringIO(body.decode('utf-8-sig')))
 if reader.fieldnames!=['Date','Mid/NAV','Absolute NAV change','Currency']:raise ValueError('L&G daily NAV columns changed')
 selected=[];excluded=[];last=None
 for r in reader:
  day=r['Date']
  if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',day)or r['Currency']!=source['navCurrency']or last is not None and day>=last:raise ValueError('L&G duplicate/out-of-order date or currency changed')
  dt.date.fromisoformat(day)
  last=day
  if day<proof['identityFrom']:excluded.append({'date':day,'value':r['Mid/NAV'],'reason':'Before official exact-share launch; never admitted'});continue
  selected.append((day,r['Mid/NAV']))
 nav=dated(selected,now)
 share=next(dict(zip([f['code_name']for f in facts['metadata']['share_class_fields']],s['data']))for fund in facts['funds']for s in fund['share_classes']if dict(zip([f['code_name']for f in facts['metadata']['share_class_fields']],s['data']))['shareclassISIN']==source['isin'])
 if max(nav)!=share['midPrice__date']or nav[max(nav)]!=float(share['midPrice']):raise ValueError('L&G current NAV/date anchor does not match exact-share catalogue')
 return nav,{**proof,'excludedBeforeShareLaunch':excluded,'currentNavAnchor':{'date':max(nav),'value':nav[max(nav)],'currency':source['navCurrency']},'cashAddedByApplication':False}
