import json,concurrent.futures,hashlib,datetime as dt
from pathlib import Path
from issuer_documents import download
root=Path('source-probe');root.mkdir(exist_ok=True);manifest=[]
urls={
 'vaneck-full':'https://www.vaneck.com/Main/HoldingsBlock/GetContent/?blockid=194732&pageid=233164&ticker=SMH',
 'lg-share':'https://fundcentres.landg.com/en/uk/institutional/fund-centre/ETF/Cyber-Security/IE00BYPLS672/',
 'lg-script':'https://fundcentres.landg.com/assets/bundles/latest-pointer/lgim/js/fundExplorer.js',
 'jpm-page':'https://am.jpmorgan.com/de/en/asset-management/institutional/products/jpm-global-equity-premium-income-active-ucits-etf-usd-dist-ie0003uvyc20',
}
def one(item):
 name,url=item
 try:
  raw=download(url,max_bytes=12000000,timeout=25,max_attempts=2);(root/(name+'.raw')).write_bytes(raw)
  manifest.append(dict(label=name,url=url,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),checkedAt=dt.datetime.now(dt.timezone.utc).isoformat()))
 except Exception as e:manifest.append(dict(label=name,url=url,error=str(e)))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as p:list(p.map(one,urls.items()))
(root/'manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps(manifest))
