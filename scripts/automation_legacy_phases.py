"""Review exact historical code/steps without weakening current phase gates."""
import copy
import hashlib
import json
from pathlib import Path

CONTRACTS=json.loads(Path(__file__).with_name('legacy-automation-contracts.json').read_text())['contracts']


def qualify_legacy_phases(state,run,jobs,source_sha,now):
    contract=CONTRACTS.get(source_sha)
    workflow=run.get('path','').split('/')[-1]
    row=state.get('workflows',{}).get(workflow,{})
    if (not contract or contract['workflow']!=workflow or run.get('head_branch')!='master'
            or (row.get('runId'),row.get('attempt',1))!=(run.get('id'),run.get('run_attempt',1))):return state
    producers=[job for job in jobs if job.get('name')==contract['job']]
    if len(producers)!=1:return state
    steps=producers[0].get('steps')or[]
    result=copy.deepcopy(state);target=result['workflows'][workflow];qualified={}
    for phase,key in [('collection','collectionSteps'),('validation','validationSteps'),('recording','recordingSteps')]:
        required=contract[key]
        matched=[step for step in steps if step.get('name')in required]
        if (len(matched)!=len(required) or {s['name']for s in matched}!=set(required)
                or any(s.get('conclusion')!='success'for s in matched)):continue
        if target.get(phase+'Status')in ('unknown','not-run'):
            target[phase+'Status']='success'
            qualified[phase]={'steps':required,'jobId':producers[0].get('id'),
                              'completedAt':max((s.get('completed_at')or''for s in matched),default='')or run.get('updated_at')}
    if qualified:
        target['legacyPhaseEvidence']={'kind':'exact-historical-phase-contract','sourceSha':source_sha,
            'runId':run['id'],'attempt':run.get('run_attempt',1),'qualifiedAt':now,'phases':qualified,
            'contractSha256':hashlib.sha256(json.dumps(contract,sort_keys=True,separators=(',',':')).encode()).hexdigest()}
    return result
