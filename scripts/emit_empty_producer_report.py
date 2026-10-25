"""Record a conditionally empty producer selection, never a source success."""
import argparse
import datetime as dt
import hashlib
import json
import os
import uuid
from pathlib import Path
from producer_report_plans import build_plan
from producer_report_contract import finish
from data_automation import write_json_atomic
p=argparse.ArgumentParser();p.add_argument('--producer',required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--reason',required=True);a=p.parse_args()
plan=build_plan(a.producer,[],a.output.stem)
for row in plan['items']:row.update(selected=False,reason=a.reason)
plan.update(producer=a.producer,reportStem=a.output.stem,mode='conditional',declaredAt=dt.datetime.now(dt.timezone.utc).isoformat(),nonce=str(uuid.uuid4()),runId=os.environ.get('GITHUB_RUN_ID'),attempt=os.environ.get('GITHUB_RUN_ATTEMPT'),durablePlan=True)
plan['sha256']=hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()
write_json_atomic(a.output.with_name(a.output.stem+'.contract-plan.json'),finish({},plan,completed=False))
write_json_atomic(a.output,finish({'records':[],'excluded':[]},plan))
