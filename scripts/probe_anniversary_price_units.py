import json,datetime as dt,pathlib,gzip,hashlib
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode,quote
from data_automation import get_json
import argparse,subprocess
parser=argparse.ArgumentParser(description='Archive provider corporate-action declarations for actual calculator assets; no financial validation')
parser.add_argument('output',type=pathlib.Path);args=parser.parse_args()
out=args.output;out.mkdir(parents=True,exist_ok=True)
active=set(json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {ASSET_ORDER} from './src/data/market-history.js';console.log(JSON.stringify(ASSET_ORDER))"],text=True)))
cs=[c for f in ['scripts/monthly-automation.json','scripts/non-bond-monthly-sources.json']for c in json.load(open(f))['series']if c['id']in active and c.get('parser')=='yahoo'and c.get('collectAnniversary')]
now=dt.datetime.now(dt.timezone.utc)
def one(c):
 first=dt.datetime.strptime(c['periodStart'],'%Y-%m').replace(tzinfo=dt.timezone.utc)
 url='https://query2.finance.yahoo.com/v8/finance/chart/'+quote(c['symbol'],safe='')+'?'+urlencode({'period1':int(first.timestamp()),'period2':int(now.timestamp()),'interval':'1mo','events':'splits'})
 r={'id':c['id'],'isin':c.get('isin'),'symbol':c['symbol'],'currency':c['currency'],'url':url}
 try:
  b=get_json(url);d=b['chart']['result'][0]
  if d['meta']['symbol']!=c['symbol']or d['meta']['currency']!=c['currency']:raise ValueError('identity/currency mismatch')
  raw=json.dumps(b,sort_keys=True).encode();h=hashlib.sha256(raw).hexdigest();(out/(h+'.json.gz')).write_bytes(gzip.compress(raw,mtime=0));r.update(status='observed',sha256=h,events=d.get('events',{}).get('splits',{}))
 except Exception as e:r.update(status='failed',reason=str(e))
 return r
with ThreadPoolExecutor(max_workers=5)as pool:rs=list(pool.map(one,cs))
(out/'results.json').write_text(json.dumps(rs,indent=2)+'\n')
print(len(rs),'sources;',sum(x['status']=='failed'for x in rs),'failed;',sum(bool(x.get('events'))for x in rs),'with splits')
for x in rs:
 if x.get('events'):print(x['id'],x['events'])
