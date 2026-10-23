import sys,json,gzip,subprocess,hashlib,datetime as dt,collections
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,'scripts')
from collect_dws_etf import parse_holdings
p=Path('reports/data-review-2026-10-23/preuves');rows=json.load(open(p/'radar-current-conflicts.json'));pairs={(x['isin'],x['acceptedSourceHash'])for x in rows if x['acceptedSourceHash']};now=dt.datetime.now(dt.timezone.utc)
def one(pair):
 isin,h=pair;dest=p/f'dws-old-{h}.json.gz'
 if not dest.exists():raise FileNotFoundError(dest)
 old=json.loads(gzip.decompress(dest.read_bytes()));cur=json.loads(gzip.decompress((p/'dws-final-raw'/f'{isin}.json.gz').read_bytes()))
 assert hashlib.sha256(json.dumps(old,sort_keys=True,allow_nan=False).encode()).hexdigest()==h
 url=f'https://etf.dws.com/api/pdp/en-gb/etf/{isin}/holdings';a=parse_holdings(old,{'isin':isin},now,url);b=parse_holdings(cur,{'isin':isin},now,url)
 oa={z['header']['value']:z for z in old['tables'][0]['values']};ob={z['header']['value']:z for z in cur['tables'][0]['values']};changed=[]
 for id in oa.keys()|ob.keys():
  before=oa.get(id,{});after=ob.get(id,{});fields={k:{'before':before.get(k),'after':after.get(k)} for k in before.keys()|after.keys()if before.get(k)!=after.get(k)}
  if fields:changed.append({'id':id,'fields':fields})
 fieldcounts=collections.Counter(k for z in changed for k in z['fields']);alerts=[]
 for z in rows:
  if z['isin']!=isin:continue
  av=next((x['weightPct']for x in a[z['field']]['rows']if x['name']==z['name']),0);bv=next((x['weightPct']for x in b[z['field']]['rows']if x['name']==z['name']),0)
  assert av==z['accepted'],(isin,z['name'],av,z['accepted']);assert bv==z['currentValue'],(isin,z['name'],bv,z['currentValue'])
  alerts.append({'key':z['key'],'field':z['field'],'name':z['name'],'oldParsed':av,'newParsed':bv})
 return {'isin':isin,'oldHash':h,'newHash':b['countries']['sha256'],'oldAsOf':a['countries']['asOf'],'newAsOf':b['countries']['asOf'],'changedFields':dict(fieldcounts),'changes':changed,'reproducedAlerts':alerts}
with ThreadPoolExecutor(max_workers=3)as pool:r=list(pool.map(one,sorted(pairs)))
(p/'dws-country-revisions.json.gz').write_bytes(gzip.compress(json.dumps(r,ensure_ascii=False).encode(),mtime=0))
print(json.dumps([{k:v for k,v in x.items()if k not in ['changes','reproducedAlerts']}|{'reproducedCount':len(x.get('reproducedAlerts',[]))}for x in r],ensure_ascii=False,indent=2))
