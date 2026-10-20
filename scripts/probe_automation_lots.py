"""Bounded read-only discovery. Reachability never qualifies a financial field."""
import datetime as dt, hashlib, json, re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from issuer_documents import download, pdf_text
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-artifacts/automation-lots'; OUT.mkdir(parents=True,exist_ok=True)
TARGETS=['IE0002Y8CX98','IE000W8WMSL2','IE00BDVPNG13','IE00BJGWQN72','IE00BKLF1R75','IE00BZ56SW52','IE00BYPLS672','IE00BF0M2Z96','IE00BK5BCD43','IE00BK5BCH80','IE000NDWFGA5','IE000QDFFK00','IE00BD4TXV59']
requests={}
def add(key,url):
 if url and '{' not in url:requests.setdefault(url,[]).append(key)
def visit(value):
 if isinstance(value,dict):
  if value.get('isin') in TARGETS:
   for key in ('sourceUrl','factsheetUrl','discoveryUrl'):add(value['isin'],value.get(key))
  for v in value.values():visit(v)
 elif isinstance(value,list):
  for v in value:visit(v)
visit(json.loads((ROOT/'scripts/additional-etf-sources.json').read_text()))
add('topix','https://www.jpx.co.jp/automation/markets/indices/topix/files/topixweight_j.csv')
add('topix-page','https://www.jpx.co.jp/english/markets/indices/topix/index.html')
add('ubs','https://www.ubs.com/de/en/assetmanagement/funds/etf.html/ie00bd4txv59-ubs-core-msci-world-ucits-etf-usd-acc-pd001')
add('urnu','https://globalxetfs.eu/funds/urnu/')
add('urnu-holdings','https://globalxetfs.eu/api/funds/urnu/topholdingscsv')
add('qyld','https://globalxetfs.eu/funds/qyld/')
add('wisdomtree-home','https://dataspanapi.wisdomtree.com/swagger/index.html')
add('topix-identities-page','https://www.blackrock.com/jp/individual-en/en/products/279438/ishares-core-topix-etf')
add('topix-english','https://www.jpx.co.jp/automation/english/markets/indices/topix/files/topixweight_e.csv')
add('nasdaq-index','https://indexes.nasdaq.com/Index/Weighting/NDX')
for isin in ['IE00BDVPNG13','IE00BKLF1R75']:
 add(isin,'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/'+isin)
for isin in ['FR0013411980','FR0013411998']:
 add(isin,'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/'+isin+'/FRA/FRA/INSTITUTIONNEL/ETF')
def one(item):
 url,ids=item;row={'ids':ids,'url':url,'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat()}
 try:
  raw,actual=download(url,max_bytes=8_000_000,timeout=20,max_attempts=1,return_source=True)
  sha=hashlib.sha256(raw).hexdigest();(OUT/(sha+'.raw')).write_bytes(raw);row.update(sha256=sha,bytes=len(raw),actualUrl=actual)
  if raw.startswith(b'%PDF-'):(OUT/(sha+'.txt')).write_text(pdf_text(raw))
  elif raw.lstrip().startswith(b'<'):
   soup=BeautifulSoup(raw,'html.parser'); row['links']=[{'text':a.get_text(' ',strip=True)[:120],'url':urljoin(actual,a['href'])}for a in soup.select('a[href]') if re.search(r'holding|portfolio|constitu|download|composition|csv|xlsx',a.get_text(' ',strip=True)+' '+a['href'],re.I)][:80]
   row['scripts']=[urljoin(actual,s['src'])for s in soup.select('script[src]')][:25]
  row['status']='observed-unqualified'
 except Exception as e:row.update(status='unavailable',error=str(e))
 return row
rows=list(ThreadPoolExecutor(max_workers=4).map(one,requests.items()))
# Follow only public holdings links actually printed by the official identity page.
for parent in list(rows):
 if parent['ids']==['topix-identities-page'] and parent.get('sha256'):
  soup=BeautifulSoup((OUT/(parent['sha256']+'.raw')).read_bytes(),'html.parser')
  links={urljoin(parent['actualUrl'],a['href']) for a in soup.select('a[href]') if 'fileType=csv' in a['href'] and 'hold' in a['href'].lower()}
  for url in sorted(links)[:3]:rows.append(one((url,['topix-identities-csv'])))
  tab=soup.select_one('#allHoldingsTab[data-ajaxuri]')
  if tab:rows.append(one((urljoin(parent['actualUrl'],tab['data-ajaxuri']),['topix-identities-json'])))
(OUT/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(rows,ensure_ascii=False,indent=2))
