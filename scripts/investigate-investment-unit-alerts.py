"""Inspect bounded daily paths for detected alerts; never certify or repair prices."""
import json,datetime as dt,gzip,pathlib,hashlib,argparse
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode,quote
from data_automation import get_json
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('audit',type=pathlib.Path);parser.add_argument('output',type=pathlib.Path)
args=parser.parse_args()
r=json.loads(gzip.decompress(args.audit.read_bytes()) if args.audit.suffix=='.gz' else args.audit.read_bytes())
configs=json.load(open('scripts/monthly-automation.json'))['series']+json.load(open('scripts/non-bond-monthly-sources.json'))['series']
cs={c['id']:c for c in configs};out=args.output;out.mkdir(exist_ok=True)
jobs=[]
for a in r['assets']:
 c=cs.get(a['id']);alerts=[x for x in a['alerts']if x.get('field')=='performance-level'and x['kind']=='large-variation']
 if not alerts:continue
 for alert in alerts:
  jobs.append((a,c,alert))
def one(job):
 a,c,alert=job;row={'id':a['id'],'from':alert['from'],'to':alert['to'],'monthlyRatio':alert['ratio'],'financialValidation':False,'declaredCurrency':c and c.get('currency'),'registeredQuoteUnitEvidence':c and c.get('quoteUnitEvidence')}
 if not c or c.get('parser')!='yahoo':return {**row,'status':'source-not-yahoo','sourceConvention':c and c.get('parser')}
 start=dt.datetime.strptime(alert['from'],'%Y-%m').replace(tzinfo=dt.timezone.utc);end=dt.datetime.strptime(alert['to'],'%Y-%m').replace(tzinfo=dt.timezone.utc);end=(end.replace(day=28)+dt.timedelta(days=4)).replace(day=1)
 url='https://query2.finance.yahoo.com/v8/finance/chart/'+quote(c['symbol'],safe='')+'?'+urlencode({'period1':int(start.timestamp()),'period2':int(end.timestamp()),'interval':'1d','events':'div,splits'})
 row['url']=url
 try:
  d=get_json(url);b=json.dumps(d,sort_keys=True).encode();h=hashlib.sha256(b).hexdigest();(out/(h+'.json.gz')).write_bytes(gzip.compress(b,mtime=0));p=d['chart']['result'][0];q=p['indicators'];rows=[(t,v)for t,v in zip(p['timestamp'],q.get('adjclose',[q['quote'][0]])[0].get('adjclose',q['quote'][0]['close']))if v is not None];changes=[v/prior for(_,prior),(_,v)in zip(rows,rows[1:])]
  row.update(status='collected',sha256=h,currency=p['meta']['currency'],symbol=p['meta']['symbol'],dailyObservations=len(rows),minimumDailyRatio=min(changes),maximumDailyRatio=max(changes),events=p.get('events',{}),finding='Daily path and corporate-action metadata inspected; monthly large variation alone does not prove an error. Same provider, not independent financial confirmation.')
 except Exception as e:row.update(status='unavailable',reason=str(e))
 return row
with ThreadPoolExecutor(max_workers=4)as pool:rows=list(pool.map(one,jobs))
(out/'results.json').write_text(json.dumps(rows,indent=2)+'\n');print('Investigated',len(rows),'candidate windows; collected',sum(x['status']=='collected'for x in rows))
