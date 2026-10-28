"""Prove a skipped-only API interval; real missed producer runs stay blocked."""
import copy
import datetime as dt
import hashlib
import json
import re
import urllib.parse


def instant(value):
    try:return dt.datetime.fromisoformat(value.replace('Z','+00:00'))
    except (AttributeError,TypeError,ValueError):return None


def recover_skipped_history_gaps(state, api, now, max_pages=3):
    result=copy.deepcopy(state)
    errors=result.setdefault('observerErrors',{})
    gaps=[(key,error)for key,error in errors.items()if key.startswith('history-window:')]
    # One interval per ordinary cycle, with bounded reads. Never change the anchor.
    for key,error in gaps[:1]:
        if not isinstance(error,dict):
            errors[key]={'cause':'Format de la lacune historique invalide ; reprise non démontrée.','originalEvidence':error}
            continue
        workflow=key.split(':',1)[1]
        match=re.search(r'Dernier run observé : (\d+)',str(error.get('cause','')))
        anchor_id=error.get('anchorRunId')or(int(match.group(1))if match else None)
        old=result.get('monitoring',{}).get('active',{}).get('monitor:'+key,{})
        through=error.get('throughAt')or old.get('firstSeenAt')
        error['lastCoverageAttemptAt']=now
        if not isinstance(anchor_id,int)or not instant(through):
            error['coverageDiagnostic']='Identité ou borne historique manquante ; reprise non démontrée.'
            continue
        try:
            anchor=api(f'/actions/runs/{anchor_id}')
            start=anchor['created_at']
            if (anchor.get('path','').split('/')[-1]!=workflow or anchor.get('head_branch')!='master'
                    or not instant(start)or instant(start)>instant(through)):
                raise ValueError('Ancrage hors producteur, branche ou période')
            rows={};digests=[];total=None;complete=False
            query_end=instant(through).astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            query=urllib.parse.urlencode({'branch':'master','status':'completed','created':start+'..'+query_end,'per_page':100})
            for page in range(1,max_pages+1):
                listing=api(f'/actions/workflows/{workflow}/runs?{query}&page={page}')
                batch=listing.get('workflow_runs');count=listing.get('total_count')
                if not isinstance(batch,list)or not isinstance(count,int)or count<0 or total is not None and total!=count:
                    raise ValueError('Listing historique invalide ou modifié pendant la lecture')
                total=count
                for run in batch:
                    if (not isinstance(run,dict)or not isinstance(run.get('id'),int)
                            or run.get('path','').split('/')[-1]!=workflow or run.get('head_branch')!='master'
                            or run.get('status')!='completed' or not instant(run.get('created_at'))
                            or not instant(run.get('updated_at')) or not instant(start)<=instant(run['created_at'])<=instant(through)):
                        raise ValueError('Exécution hors périmètre ou illisible')
                    rows[run['id']]=run
                digests.append(hashlib.sha256(json.dumps(listing,sort_keys=True,separators=(',',':')).encode()).hexdigest())
                if len(batch)<100 or len(rows)==total:
                    complete=len(rows)==total
                    break
            if not complete or anchor_id not in rows:
                raise ValueError('Fenêtre historique incomplète ; ancrage ou page manquante')
            missing=[run for run in rows.values()if run['id']>anchor_id and instant(run['updated_at'])<=instant(through)
                     and run.get('conclusion')!='skipped']
            error['coverageDiagnostic']=f'{len(rows)} exécutions énumérées ; {len(missing)} résultats ordinaires à examiner.'
            if missing:
                error['unreviewedRunIds']=sorted(run['id']for run in missing)
                continue
            proof={'kind':'fully-enumerated-skipped-interval','checkedAt':now,'workflow':workflow,
                   'anchorRunId':anchor_id,'fromCreatedAt':start,'throughAt':through,'totalRuns':len(rows),
                   'ignoredRunIds':sorted(run['id']for run in rows.values()if run['id']>anchor_id and run.get('conclusion')=='skipped' and instant(run['updated_at'])<=instant(through)),
                   'enumerationSha256':digests,'complete':True,'eligibleMissing':0}
            result.setdefault('observerChecks',{})[key]=proof
            errors.pop(key)
        except (OSError,ValueError,TypeError,KeyError,AttributeError)as error_read:
            error['coverageDiagnostic']='Relecture historique non démontrée : '+str(error_read)[:300]
    return result
