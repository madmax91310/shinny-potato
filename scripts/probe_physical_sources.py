"""Read-only source discovery; outputs are evidence, never registry values."""
import json,datetime as dt,hashlib,re,urllib.request,concurrent.futures
from pathlib import Path
from urllib.parse import urljoin,urlsplit
from bs4 import BeautifulSoup
ROOT=Path('source-probe');ROOT.mkdir(exist_ok=True)
from issuer_documents import download
from collect_vanguard_etf import fetch_query
from collect_amundi_etf import fetch_api,request_payload
now=dt.datetime.now(dt.timezone.utc)
manifest=[]
def save(label,url,body):
 if not isinstance(body,bytes):body=json.dumps(body,ensure_ascii=False).encode()
 digest=hashlib.sha256(body).hexdigest();(ROOT/(label+'.raw')).write_bytes(body)
 row={'label':label,'url':url,'sha256':digest,'bytes':len(body),'checkedAt':now.isoformat()};manifest.append(row);return body
pages={
 'wisdom':'https://www.wisdomtree.com/gb/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc',
 'vanguard':'https://www.vanguard.co.uk/professional/product/etf/equity/9679/ftse-all-world-ucits-etf-usd-accumulating',
 'amundi':'https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-prime-all-country-world-ucits-etf-acc/ie0003xja0j9',
 'vaneck':'https://www.vaneck.com/nl/en/investments/semiconductor-etf/',
 'globalx':'https://globalxetfs.eu/funds/botz/',
 'invesco':'https://www.invesco.com/uk/en/financial-products/etfs/invesco-ftse-all-world-ucits-etf-acc.html',
 'avantis':'https://www.avantisinvestors.com/ucits/avantis-global-small-cap-value-ucits-etf/'
}
def page(item):
 label,url=item
 try:
  body=save(label,url,download(url,max_bytes=15000000));soup=BeautifulSoup(body,'html.parser')
  links=[{'text':a.get_text(' ',strip=True),'url':urljoin(url,a.get('href',''))} for a in soup.select('a[href]') if re.search('hold|compos|csv|xlsx|download|portfolio',str(a),re.I)]
  scripts=[urljoin(url,a['src']) for a in soup.select('script[src]') if urlsplit(urljoin(url,a['src'])).hostname==urlsplit(url).hostname]
  (ROOT/(label+'-links.json')).write_text(json.dumps({'links':links,'scripts':scripts},indent=2))
  for i,js in enumerate(scripts[:12]):
   if not re.search('main|app|product|fund|bundle',js,re.I):continue
   try:save(label+'-script-'+str(i),js,download(js,max_bytes=15000000))
   except Exception as e:manifest.append({'url':js,'error':str(e)})
 except Exception as e:manifest.append({'label':label,'url':url,'error':str(e)})
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(page,pages.items()))
try:
 from collect_public_issuer import collect_one
 configs=json.load(open('scripts/additional-etf-sources.json'))['instruments']
 c=next(r for r in configs if r['isin']=='IE00BJGWQN72')
 save('wisdom-collect',c['sourceUrl'],collect_one(c,now))
 save('wisdom-pdf',c['factsheetUrl'],download(c['factsheetUrl']))
except Exception as e:manifest.append({'label':'wisdom-collect','error':str(e)})
try:save('vanguard-schema','https://www.vanguard.co.uk/gpx/graphql',fetch_query('query Probe { __schema { types { name fields { name type { name kind ofType { name kind ofType { name kind } } } args { name type { name kind ofType { name kind } } } } } } }',{},'Probe'))
except Exception as e:manifest.append({'label':'vanguard-schema','error':str(e)})
try:
 c={'isin':'IE0003XJA0J9'};p=request_payload([c],now)
 p['breakDown']['aggregationFields']=['FUND_HOLDINGS','FUND_TOP10'];save('amundi-api','https://www.amundietf.fr/mapi/ProductAPI/getProductsData',fetch_api(p))
except Exception as e:manifest.append({'label':'amundi-api','error':str(e)})
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
