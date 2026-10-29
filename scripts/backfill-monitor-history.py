"""Reconstruct the monitor's recorded history from immutable Git blobs, without writing production."""
import argparse,datetime as dt,gzip,json,subprocess
from automation_status_storage import decode_status
from pathlib import Path

def collect(ref):
 commits=subprocess.check_output(['git','log','--format=%H',ref,'--','automation-status.json'],text=True).splitlines()
 tables={k:{}for k in ['resolved','retired','events']};unreadable=[]
 for number,commit in enumerate(reversed(commits)):
  try:
   raw=subprocess.check_output(['git','show',commit+':automation-status.json'],stderr=subprocess.DEVNULL)
   state=decode_status(json.loads(raw));monitor=state.get('monitoring',{})
   for kind,table in tables.items():
    for row in monitor.get(kind,[]):
     key=(row.get('revision'),row.get('at'))if kind=='events'else(row.get('id'),row.get('resolvedAt'if kind=='resolved'else'retiredAt'))
     if key not in table:table[key]={**row,'historyCommit':commit}
  except (ValueError,subprocess.SubprocessError,TypeError,AttributeError)as error:unreadable.append({'commit':commit,'error':str(error)[:200]})
  if number%400==0:print('History commits read:',number,flush=True)
 return {'schemaVersion':1,'sourceRef':ref,'tip':commits[0]if commits else None,'capturedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'commitsRead':len(commits),'unreadable':unreadable,**{k:sorted(v.values(),key=lambda r:r.get('resolvedAt',r.get('retiredAt',r.get('at',''))),reverse=True)for k,v in tables.items()}}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--ref',default='origin/automation-status');p.add_argument('--output',required=True);a=p.parse_args();result=collect(a.ref);path=Path(a.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(gzip.compress(json.dumps(result,ensure_ascii=False,separators=(',',':')).encode(),mtime=0));print(json.dumps({k:v if k not in ['resolved','retired','events']else len(v)for k,v in result.items()}))
