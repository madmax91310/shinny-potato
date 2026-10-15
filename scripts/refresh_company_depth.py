"""Renew risk information and legacy history supplements independently."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import datetime as dt
import json
from pathlib import Path
from company_financial_depth import collect_depth
from company_history_supplement import supplement, SUPPORTED
from data_automation import write_json_atomic
ROOT=Path(__file__).resolve().parents[1]
def collect(profile,old,today):
    item=dict(old);status={}
    if profile['id'] in SUPPORTED:
        try:item=supplement(profile,item,today);status['history']='updated'
        except Exception as e:status['history']=str(e)[:250]
    try:item['financialDepth']=collect_depth(profile,item,today);status['depth']='updated'
    except Exception as e:status['depth']=str(e)[:250]
    item['depthCollection']={'observedAt':today.isoformat(),**status}
    return item,status

def main():
    p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--only',nargs='*');p.add_argument('--output',default='/tmp/company-depth-observation.json');args=p.parse_args()
    profiles=json.loads((ROOT/'src/data/company-profiles.json').read_text());file=ROOT/'src/data/company-analysis.json';data=json.loads(file.read_text());today=dt.datetime.now(dt.timezone.utc).date()
    profiles=[p for p in profiles if not p.get('candidateOnly') and p['currency']=='USD' and (not args.only or p['id'] in args.only)]
    report={'checkedAt':today.isoformat(),'companies':{}};regressions=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs={pool.submit(collect,p,data['companies'][p['id']],today):p for p in profiles}
        for job in as_completed(jobs):
            p=jobs[job];item,status=job.result()
            if data['companies'][p['id']].get('financialDepth') and status.get('depth')!='updated':regressions.append(p['id'])
            data['companies'][p['id']]=item;report['companies'][p['id']]=status
            print(p['id'],json.dumps(status),flush=True)
            if args.apply:write_json_atomic(file,data)
            write_json_atomic(Path(args.output),report)
    if regressions:raise SystemExit('Risk source regressions, original observations retained: '+', '.join(regressions))
if __name__=='__main__':main()
