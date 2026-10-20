"""Read-only investigation of remaining primary sources."""
from concurrent.futures import ThreadPoolExecutor
import json,re,pathlib,hashlib
from urllib.parse import urljoin,urlsplit
from bs4 import BeautifulSoup
from issuer_documents import download,pdf_text
OUT=pathlib.Path('test-artifacts/remaining-sources');OUT.mkdir(parents=True,exist_ok=True)
URLS=[
('iroko-latest-pdf','https://iroko-documents.s3.eu-west-3.amazonaws.com/Iroko_Zen_bulletin_trimestriel.pdf'),
('lg-literature','https://fundcentres.landg.com/srp/api/literature-structure/38?audience=79&language=1'),
('lg-cyber-lower','https://fundcentres.landg.com/en/uk/institutional/fund-centre/etf/cyber-security/IE00BYPLS672/'),
]

def fetch(item):
 label,url=item
 try:
  raw,final=download(url,max_bytes=64_000_000 if label=="iroko-latest-pdf" else 8_000_000,timeout=20,max_attempts=1,return_source=True)
  
  if len(raw)<16_000_000:(OUT/(label+'.raw')).write_bytes(raw)
  row={'label':label,'url':url,'finalUrl':final,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
  if raw.startswith(b'%PDF-'):
   (OUT/(label+'.txt')).write_text(pdf_text(raw))
   if label=='iroko-latest-pdf':
    from collect_corum import bbox_pages
    (OUT/'iroko-bbox.json').write_text(json.dumps(bbox_pages(raw),ensure_ascii=False))
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

import datetime as dt
from collect_dca_equities import SOURCE
from collect_dca_complete_holdings import parse_complete
for key,isin,url in [('world','IE00B4L5Y983',SOURCE),('japan','IE00B4L5YX21',SOURCE.replace('251882','251867'))]:
 try:
  raw=download(url,max_bytes=12_000_000)
  h,identities=parse_complete(json.loads(raw),isin,url,dt.datetime.now(dt.timezone.utc))
  record={'sourceUrl':url,'sha256':hashlib.sha256(raw).hexdigest(),'asOf':h['asOf'],'identities':identities if key=='japan' else [r for r in identities if r['isin']=='US45167R1041']}
  (OUT/(key+'-identities.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2))
  print(key,len(record['identities']))
 except Exception as e: print(key,str(e))
