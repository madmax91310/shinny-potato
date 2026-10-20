"""Read-only proof replay for newly discovered complete-holdings sources.

--apply writes only the isolated checkout used by the CI qualification job.
Raw public responses and their hashes remain reviewable workflow artifacts.
"""
import hashlib,json,sys,threading
from pathlib import Path
import collect_dca_complete_holdings as collector
import collect_ssga_etf as ssga
root=Path('live-data-proof');root.mkdir(exist_ok=True);manifest=[];lock=threading.Lock()
def capture(fetch):
 def read(url,*args,**kwargs):
  value=fetch(url,*args,**kwargs);body=value.encode() if isinstance(value,str) else value
  digest=hashlib.sha256(body).hexdigest()
  with lock:
   (root/(digest+'.response')).write_bytes(body)
   manifest.append({'url':url,'sha256':digest,'bytes':len(body)})
  return value
 return read
collector.get_text=capture(collector.get_text);ssga.get_xlsx=capture(ssga.get_xlsx)
try:collector.main()
finally:
 (root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
