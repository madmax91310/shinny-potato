"""Refresh only the explicitly approved expansion, in its own data files."""
import argparse
import datetime as dt
import json
from pathlib import Path
from data_automation import UTC, write_json_atomic
from refresh_additional_etf import refresh as refresh_funds
from collect_non_bond_expansion import collect_one as collect_fund
from collect_qualified_exposures import collect_one as collect_qualified
from apply_etf_collection import merge_collection
from refresh_monthly_history import refresh as refresh_monthly
from refresh_anniversary_levels import refresh as refresh_levels
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads((ROOT/path).read_text())
def merge_monthly_evidence(evidence, observations):
 for o in observations:
  if o['status']=='validated' and o['evidence']['responseSha256']==o['record']['responseSha256']:
   evidence[o['id']]={k:v for k,v in o['evidence'].items()if k not in ['rawResponse','points','anniversaryPoints']}
 return evidence

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--output',required=True,type=Path);p.add_argument('--fields',nargs='+',choices=['etf','monthly','levels'],default=['etf','monthly','levels']);args=p.parse_args()
 now=dt.datetime.now(UTC);report={'checkedAt':now.isoformat()};writes={};errors=[]
 if 'etf'in args.fields:
  config=read('scripts/non-bond-expansion-sources.json');current=read('src/data/non-bond-etf-records.json')
  updated,observations=refresh_funds(config,current,{},now,collect=collect_fund);report['funds']=observations
  writes['src/data/non-bond-etf-records.json']=updated
  errors += [r['isin']for r in observations['shares']if r['status']!='validated']
  records=read('src/data/non-bond-qualified-records.json');observations=[]
  for c in read('scripts/non-bond-qualified-sources.json')['instruments']:
   try:
    r=collect_qualified(c,now);previous=records.get(c['id'])
    if previous and (previous['isin']!=r['isin']or previous['currency']!=r['currency']):raise ValueError('Share identity changed')
    old={previous['isin']:previous['automatedRecord']}if previous else{}
    merged=merge_collection({'checkedAt':now.isoformat(),'shares':[r]},old,{})
    if previous and any(r[f]['asOf']<previous[f]['asOf']for f in ['countries','sectors','holdings','aum']):raise ValueError('Observation date regressed')
    r['automatedRecord']=merged[r['isin']];records[c['id']]=r;observations.append({'id':c['id'],'status':'validated'})
   except Exception as e:errors.append(c['id']);observations.append({'id':c['id'],'status':'failed','reason':str(e)})
  writes['src/data/non-bond-qualified-records.json']=records;report['qualified']=observations
 if 'monthly'in args.fields:
  config=read('scripts/non-bond-monthly-sources.json');current=read('src/data/non-bond-monthly-records.json');baseline=read('src/data/non-bond-company-histories.json')
  merged,observations=refresh_monthly(config,current,baseline,now);writes['src/data/non-bond-monthly-records.json']=merged
  evidence=read('scripts/source-snapshots/non-bond-monthly-active.json')
  evidence=merge_monthly_evidence(evidence,observations['series'])
  errors += [o['id']for o in observations['series']if o['status']!='validated']
  writes['scripts/source-snapshots/non-bond-monthly-active.json']=evidence
  report['monthly']={**observations,'series':[{k:v for k,v in o.items()if k!='evidence'}for o in observations['series']]}
 if 'levels'in args.fields:
  configs=[{**c,'field':'close'}for c in read('scripts/non-bond-monthly-sources.json')['series']]
  merged,observations=refresh_levels(read('src/data/non-bond-levels.json'),now,selected=configs)
  writes['src/data/non-bond-levels.json']=merged;report['levels']=observations;errors += [r['id']for r in observations['errors']]
 report['errors']=errors;write_json_atomic(args.output,report)
 if args.apply:
  for path,data in writes.items():write_json_atomic(ROOT/path,data)
 print(json.dumps({'fields':args.fields,'errors':errors,'files':list(writes)}))
 return 1 if errors else 0
if __name__=='__main__':raise SystemExit(__import__('producer_report_contract').run('refresh_non_bond_sources', main))
