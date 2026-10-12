"""Require renewable exact-share observations for the two sector/history additions."""
import datetime as dt
import json
from pathlib import Path
from apply_etf_collection import merge_collection
from data_automation import write_json_atomic
from refresh_additional_etf import collect_one
ROOT=Path(__file__).resolve().parents[1]
now=dt.datetime.now(dt.timezone.utc)
configs=json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']
path=ROOT/'src/data/automated-etf.json';current=json.loads(path.read_text());report=[]
for isin in ['IE00BM67HQ30','IE00BJGWQN72','IE00BM67HS53']:
 c=next(c for c in configs if c['isin']==isin);r=collect_one(c,now)
 print(json.dumps({'isin':isin,'unavailable':r.get('unavailable'), 'rowCounts':{f:len(r.get(f,{}).get('rows',[])) for f in ['holdings','countries','sectors']}}),flush=True)
 if not r.get('performance',{}).get('years'):raise ValueError('No actual annual fund returns: '+isin)
 if isin in ('IE00BM67HQ30','IE00BM67HS53'):
  if r.get('unavailable') or any(not r.get(f,{}).get('rows')for f in ['holdings','countries','sectors']):raise ValueError('Incomplete utilities composition')
  if isin=='IE00BM67HQ30' and not r.get('characteristics',{}).get('listings'):raise ValueError('Utilities listings missing')
  if isin=='IE00BM67HS53' and not all(str(y)in r['performance']['years']for y in range(2020,2026)):raise ValueError('Six actual materials calendar years required')
 else:
  if not r.get('listingObservation',{}).get('rows'):raise ValueError('Cloud listing document missing')
 current=merge_collection({'checkedAt':now.isoformat(),'shares':[r]},current,{})
 report.append({'isin':isin,'sourceUrl':r['sourceUrl'],'checkedAt':now.isoformat(),'status':'validated'})
write_json_atomic(path,current)
print(json.dumps(report,ensure_ascii=False))
