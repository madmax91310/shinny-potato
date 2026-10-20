import json,concurrent.futures,hashlib,re,datetime as dt,urllib.request
from pathlib import Path
from issuer_documents import download
from collect_amundi_etf import fetch_api,request_payload
root=Path('source-probe');root.mkdir(exist_ok=True);manifest=[]
def save(name,url,body):
 if not isinstance(body,bytes):body=json.dumps(body).encode()
 (root/(name+'.raw')).write_bytes(body);manifest.append({'label':name,'url':url,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()})
urls={
 'vaneck-holdings-js':'https://www.vaneck.com/static/ReactApps/FundPagesNewDesignEU/dist/3349.bundle.js',
 'vaneck-service-js':'https://www.vaneck.com/static/ReactApps/FundPagesNewDesignEU/dist/9014.bundle.js',
 'invesco-full':'https://dng-api.invesco.com/cache/v1/accounts/en_GB/shareclasses/IE000716YHJ7/holdings/fund?idType=isin',
 'avantis-full':'https://www.avantisinvestors.com/ucitsetf/en-de/total-holdings/295032351307042/',
 'avantis-page':'https://www.avantisinvestors.com/ucitsetf/avantis-global-small-cap-value-ucits-etf/',
 'lg-page':'https://fundcentres.landg.com/en/uk/institutional/fund-centre/ETF/Cyber-Security/',
 'wisdom-ie':'https://www.wisdomtree.com/ie/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc',
 'wisdom-eu':'https://www.wisdomtree.eu/en-gb/etfs/thematic/wcld---wisdomtree-cloud-computing-ucits-etf---usd-acc'}
def one(item):
 name,url=item
 try:save(name,url,download(url,max_bytes=25000000))
 except Exception as e:manifest.append({'label':name,'url':url,'error':str(e)})
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as p:list(p.map(one,urls.items()))
try:
 p=request_payload([{'isin':'IE0003XJA0J9'}],dt.datetime.now(dt.timezone.utc));p['composition']={'compositionFields':['date','type','bbg','isin','name','weight','quantity','currency','sector','country','countryOfRisk']}
 save('amundi-complete','https://www.amundietf.fr/mapi/ProductAPI/getProductsData',fetch_api(p))
except Exception as e:manifest.append({'label':'amundi-complete','error':str(e)})
for name,extra in [('base',''),('isin','isin'),('security','securityIdentifier')]:
 try:
  query='query HoldingsProbe($portIds: [String!], $lastItemKey: String) { funds(portIds: $portIds) { profile { portId fundCurrency etfReplicationMethodology assetClassificationLevel1 identifiers(altIds: ["ISIN"]) { altId altIdValue } } } borHoldings(portIds: $portIds) { holdings(limit: 1500, lastItemKey: $lastItemKey) { items { securityLongDescription marketValuePercentage sedol1 securityType effectiveDate '+extra+' } totalHoldings lastItemKey } } }'
  url='https://www.vanguard.co.uk/gpx/graphql';payload={'query':query,'variables':{'portIds':['9679'],'lastItemKey':None},'operationName':'HoldingsProbe'}
  req=urllib.request.Request(url,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','X-Consumer-ID':'uk-pro','User-Agent':'EpargnantLibre-Data/1.0'})
  with urllib.request.urlopen(req,timeout=30) as r:save('vanguard-holdings-'+name,url,r.read(6000000))
 except Exception as e:manifest.append({'label':'vanguard-holdings-'+name,'error':str(e)})
(root/'extra-manifest.json').write_text(json.dumps(manifest,indent=2))
