import json,concurrent.futures,hashlib,re
from pathlib import Path
from issuer_documents import download
root=Path('source-probe');root.mkdir(exist_ok=True);manifest=[]
urls={
'globalx-full':'https://globalxetfs.eu/api/funds/botz/topholdingscsv',
'amundi-js':'https://amundiprodcdn2.azureedge.net/widgets-assets/product-page/20.1.101/amundi-product-page.js',
'vanguard-js':'https://www.vanguard.co.uk/main.f0368fe87d186394.js',
'lg':'https://fundcentres.landg.com/srp/api/fund-centre/47?audience=79&language=1'}
def one(item):
 name,url=item
 try:
  body=download(url,max_bytes=18000000);(root/(name+'.raw')).write_bytes(body);manifest.append({'label':name,'url':url,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()})
 except Exception as e:manifest.append({'label':name,'url':url,'error':str(e)})
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as p:list(p.map(one,urls.items()))
(root/'extra-manifest.json').write_text(json.dumps(manifest,indent=2))
