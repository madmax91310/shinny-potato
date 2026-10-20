"""Read-only investigation of remaining primary sources."""
from concurrent.futures import ThreadPoolExecutor
import json,re,pathlib,hashlib
from urllib.parse import urljoin,urlsplit
from bs4 import BeautifulSoup
from issuer_documents import download,pdf_text
OUT=pathlib.Path('test-artifacts/remaining-sources');OUT.mkdir(parents=True,exist_ok=True)
URLS=[
('wt-gb','https://www.wisdomtree.com/gb/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc'),
('wt-fr','https://www.wisdomtree.com/fr/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc'),
('wt-de','https://www.wisdomtree.com/de/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc'),
('wt-regdocs','https://regdocs.wisdomtree.eu/'),
('gx-urnu','https://globalxetfs.eu/funds/urnu'),
('gx-qyld','https://globalxetfs.eu/funds/qyld'),
('gx-botz','https://globalxetfs.eu/funds/botz'),
('ubs-bundle','https://www.ubs.com/app/HA4/productdetails/newbundle.js'),
('lg-cyber','https://fundcentres.landg.com/en/uk/institutional/fund-centre/ETF/Cyber-Security/'),
('lg-cyber-ie','https://fundcentres.landg.com/en/ie/institutional/fund-centre/ETF/Cyber-Security/'),
('iex-lse','https://www.londonstockexchange.com/market-stock/0AD7/idex-corp/overview'),
('iex-borsa','https://www.borsaitaliana.it/borsa/azioni/global-equity-market/scheda/US45167R1041.html?lang=en'),
('iex-nyse','https://www.nyse.com/quote/XNYS:IEX'),
]
def fetch(item):
 label,url=item
 try:
  raw,final=download(url,max_bytes=8_000_000,timeout=20,max_attempts=1,return_source=True)
  (OUT/(label+'.raw')).write_bytes(raw)
  row={'label':label,'url':url,'finalUrl':final,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
  if raw.startswith(b'%PDF-'):(OUT/(label+'.txt')).write_text(pdf_text(raw))
  elif b'<html' in raw[:1500].lower() or b'<!doctype' in raw[:100].lower():
   soup=BeautifulSoup(raw,'html.parser');(OUT/(label+'.txt')).write_text(soup.get_text(' ',strip=True))
   row['scripts']=[urljoin(final,s['src']) for s in soup.select('script[src]')]
   row['links']=[{'text':a.get_text(' ',strip=True)[:120],'url':urljoin(final,a['href'])} for a in soup.select('a[href]') if re.search(r'hold|constitu|portfolio|download|\.csv|\.xls',a.get_text()+' '+a['href'],re.I)][:80]
  return row
 except Exception as e:return {'label':label,'url':url,'error':str(e)}
rows=list(ThreadPoolExecutor(max_workers=6).map(fetch,URLS))
more=[]
for row in rows:
 for i,u in enumerate(row.get('scripts',[])):
  if urlsplit(u).hostname in ['globalxetfs.eu','www.wisdomtree.com','regdocs.wisdomtree.eu','fundcentres.landg.com']:
   more.append((row['label']+'-js-'+str(i),u))
rows+=list(ThreadPoolExecutor(max_workers=6).map(fetch,more))
(OUT/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for r in rows:print(json.dumps({k:v for k,v in r.items() if k not in ['links','scripts']}))
