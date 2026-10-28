"""Durable ordinary monitor failures, repaired only by the same successful checks."""
import copy
import re
import time
from automation_monitoring import timestamp


def observe_monitor_history(state,api,repo,now,read_job_log=None):
    deadline=time.monotonic()+75
    result=copy.deepcopy(state)
    ledger=result.setdefault('monitorSelf',{'schemaVersion':1,'failures':{},'successes':{},'successRuns':{}})
    errors=result.setdefault('observerErrors',{})
    try:
        if ledger.get('schemaVersion')!=1:raise ValueError('Version de l’historique du moniteur inconnue')
        rows=api('/actions/workflows/automation-status.yml/runs?branch=master&status=completed&per_page=100')['workflow_runs']
        returned=len(rows)if isinstance(rows,list)else None
        if not isinstance(rows,list):raise ValueError('Historique des exécutions illisible')
        rows=[r for r in rows if r.get('head_branch')=='master'and r.get('status')=='completed'and r.get('event')in('schedule','push','workflow_dispatch','workflow_run')and(r.get('head_repository')or{}).get('full_name',repo)==repo and r.get('conclusion')in('success','failure','timed_out','startup_failure','action_required')]
        ledger['coverage']={'apiWindow':100,'returnedRuns':returned,'ordinaryRuns':len(rows),'oldestWitnessedAt':min((r['updated_at']for r in rows if timestamp(r.get('updated_at'))),default=None),'beforeWindow':'not-demonstrated'}
        latest={}
        for r in rows:
            if r['conclusion']=='success'and timestamp(r.get('updated_at')):
                if r['event']not in latest or timestamp(r['updated_at'])>timestamp(latest[r['event']]['updated_at']):latest[r['event']]=r
        pending={f'{r["id"]}:{r.get("run_attempt",1)}':r for r in rows if r['conclusion']!='success'and f'{r["id"]}:{r.get("run_attempt",1)}'not in ledger['failures']or r['conclusion']!='success'and ledger['failures'].get(f'{r["id"]}:{r.get("run_attempt",1)}',{}).get('qualificationPending')}
        pending.update({f'{r["id"]}:{r.get("run_attempt",1)}':r for event,r in latest.items()if ledger['successRuns'].get(event)!=f'{r["id"]}:{r.get("run_attempt",1)}'})
        # A rerun or API-window rollover cannot remove an unqualified old attempt.
        for key,failure in ledger['failures'].items():
            if failure.get('qualificationPending'):
                pending.setdefault(key,{'id':failure['runId'],'run_attempt':failure['attempt'],'conclusion':'failure','updated_at':failure['completedAt'],'html_url':failure['runUrl']})

        for key,run in pending.items():
            if run['conclusion']!='success':ledger['failures'].setdefault(key,{'runId':run['id'],'attempt':run.get('run_attempt',1),'runUrl':run['html_url'],'completedAt':run['updated_at'],'firstObservedAt':now,'qualificationPending':True,'failedChecks':{'unqualified':{'step':'Étape défaillante à qualifier','failedAt':run['updated_at']}}})
        processed=set();log_reads=0
        ordered=sorted(pending.items(),key=lambda item:(item[1]['conclusion']!='success',-(timestamp(item[1]['updated_at']).timestamp()if timestamp(item[1].get('updated_at'))else 0)))
        for key,run in ordered[:6]:
            if time.monotonic()>deadline:break
            observer='self-history:'+key
            try:
                jobs=api(f'/actions/runs/{run["id"]}/attempts/{run.get("run_attempt",1)}/jobs?per_page=100')['jobs']
                if not isinstance(jobs,list):raise ValueError('Étapes du moniteur illisibles')
                failed={};successes={};diagnostics=[]
                for job in jobs:
                    if job.get('name')!='publish':continue
                    if job.get('conclusion')in('failure','timed_out') and job.get('steps')==[]:
                        # Explicit empty steps prove a failure before any data work.
                        # A later successful publish job proves this same startup,
                        # not a collection, validation or persistence operation.
                        failed['workflow:start']={'step':'Initialisation du workflow','failedAt':job.get('completed_at')or run['updated_at']}
                        diagnostics.append('Job publish en échec avant toute étape ; aucune panne de collecte déduite.')
                    for step in job.get('steps')or[]:
                        signature='publish:'+step['name'];date=step.get('completed_at')or job.get('completed_at')or run.get('updated_at')
                        if not timestamp(date)or timestamp(date)>timestamp(now):raise ValueError('Date d’étape du moniteur invalide')
                        proof={'kind':'ordinary-monitor-step','runId':run['id'],'attempt':run.get('run_attempt',1),'runUrl':run['html_url'],'step':step['name'],'checkedAt':date}
                        if step.get('conclusion')=='success':successes[signature]=proof
                        elif step.get('conclusion')in('failure','timed_out') or step.get('conclusion')=='cancelled' and job.get('conclusion')in('failure','timed_out'):
                            failed[signature]={'step':step['name'],'failedAt':date}
                            if step.get('conclusion')=='cancelled':diagnostics.append('Étape interrompue dans un job en échec : '+step['name'])
                    if job.get('conclusion')in('failure','timed_out')and read_job_log and log_reads<2 and time.monotonic()<deadline:
                        try:
                            log_reads+=1
                            log=read_job_log(job['id'])
                            notes=[m.group(0)for m in re.finditer(r'GitHub (?:GET|PUT|POST), charge de [0-9]+ octets : [^\n]+',log)]
                            diagnostics.extend(notes[-2:])
                        except Exception:pass  # The failed stage remains explicit when its log is inaccessible.
                    if job.get('conclusion')=='success':successes['workflow:start']={'kind':'ordinary-monitor-step','runUrl':run['html_url'],'runId':run['id'],'attempt':run.get('run_attempt',1),'step':'Initialisation du workflow','checkedAt':job.get('completed_at')or run['updated_at']}
                unknown=run['conclusion']!='success'and not failed and run['conclusion']!='startup_failure'
                if run['conclusion']!='success'and not failed:failed={('unqualified'if unknown else'workflow:start'):{'step':'Étape défaillante à qualifier'if unknown else'Initialisation du workflow','failedAt':run['updated_at']}}
                for signature,proof in successes.items():
                    previous=ledger['successes'].get(signature)
                    if not previous or timestamp(proof['checkedAt'])>timestamp(previous['checkedAt']):ledger['successes'][signature]=proof
                if failed:ledger['failures'][key]={'runId':run['id'],'attempt':run.get('run_attempt',1),'runUrl':run['html_url'],'completedAt':run['updated_at'],'firstObservedAt':ledger['failures'].get(key,{}).get('firstObservedAt',now),'failedChecks':failed,'qualificationPending':unknown,**({'diagnostic':' · '.join(diagnostics)[:3200]}if diagnostics else{})}
                if run['conclusion']=='success':ledger['successRuns'][run['event']]=key
                if not unknown:processed.add(key)
                errors.pop(observer,None)
            except Exception as error:
                errors[observer]={'cause':'Historique du moniteur non qualifié : '+str(error)[:250],'runUrl':run.get('html_url')}
        ledger['coverage']['pendingRuns']=len(set(pending)-processed)
        for failure in ledger['failures'].values():
            proofs=[ledger['successes'].get(k)for k in failure['failedChecks']]
            if not failure.get('resolvedAt')and all(p and timestamp(p['checkedAt'])>timestamp(failure['failedChecks'][k]['failedAt'])for k,p in zip(failure['failedChecks'],proofs)):
                failure['resolvedAt']=max((p['checkedAt']for p in proofs),key=timestamp)
                failure['resolutionEvidence']={'kind':'matching-ordinary-monitor-steps','checks':proofs}
        ledger['checkedAt']=now
        errors.pop('self-history',None)
    except Exception as error:
        errors['self-history']={'cause':'Historique durable du moniteur indisponible : '+str(error)[:250]}
    return result
