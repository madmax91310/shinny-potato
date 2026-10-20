"""Read-only investigation of remaining primary sources."""
from concurrent.futures import ThreadPoolExecutor
import json,re,pathlib,hashlib
from urllib.parse import urljoin,urlsplit
from bs4 import BeautifulSoup
from issuer_documents import download,pdf_text
OUT=pathlib.Path('test-artifacts/remaining-sources');OUT.mkdir(parents=True,exist_ok=True)
URLS=[
('iroko-latest-pdf','https://iroko-documents.s3.eu-west-3.amazonaws.com/Iroko_Zen_bulletin_trimestriel.pdf'),
('lg-fund-explorer','https://fundcentres.landg.com/assets/bundles/versions/26.10-195-4963d446/lgim/js/fundExplorer.js'),
('stoxx-tech-csv','https://stoxx.com/document/Indices/Current/Components/SX8R.csv'),
('stoxx-tech-pdf','https://stoxx.com/document/Indices/Current/Components/SX8R.pdf'),
('stoxx-factsheets','https://stoxx.com/factsheets/'),
('topix','https://www.jpx.co.jp/automation/markets/indices/topix/files/topixweight_e.csv'),
('topix-ja','https://www.jpx.co.jp/automation/markets/indices/topix/files/topixweight_j.csv'),
('topix-overview','https://www.jpx.co.jp/english/markets/indices/topix/'),
]

def fetch(item):
 label,url=item
 try:
  raw,final=download(url,max_bytes=64_000_000 if label=="iroko-latest-pdf" else 8_000_000,timeout=20,max_attempts=1,return_source=True)
  
  if len(raw)<16_000_000:(OUT/(label+'.raw')).write_bytes(raw)
  row={'label':label,'url':url,'finalUrl':final,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
  if raw.startswith(b'%PDF-'):(OUT/(label+'.txt')).write_text(pdf_text(raw))
  elif b'<html' in raw[:1500].lower() or b'<!doctype' in raw[:100].lower():
   soup=BeautifulSoup(raw,'html.parser');(OUT/(label+'.txt')).write_text(soup.get_text(' ',strip=True))
   row['scripts']=[urljoin(final,s['src']) for s in soup.select('script[src]')]
   row['links']=[{'text':a.get_text(' ',strip=True)[:120],'url':urljoin(final,a['href'])} for a in soup.select('a[href]') if re.search(r'hold|constitu|component|weight|portfolio|download|\.csv|\.xls',a.get_text()+' '+a['href'],re.I)][:80]
  return row
 except Exception as e:return {'label':label,'url':url,'error':str(e)}
rows=list(ThreadPoolExecutor(max_workers=6).map(fetch,URLS))
more=[]
for row in rows:
 for i,u in enumerate(row.get('scripts',[])):
  if urlsplit(u).hostname in ['globalxetfs.eu','www.wisdomtree.com','regdocs.wisdomtree.eu','fundcentres.landg.com','stoxx.com','www.stoxx.com']:
   more.append((row['label']+'-js-'+str(i),u))
rows+=list(ThreadPoolExecutor(max_workers=6).map(fetch,more))
(OUT/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for r in rows:print(json.dumps({k:v for k,v in r.items() if k not in ['links','scripts']}))
