"""Predeclare producer work; report missing results without manufacturing source checks.

The native payload remains intact. resultContract reuses the monitoring statuses/scope
format, with operation-level identities and explicitly declared financial field groups.
It is not a certification of every scalar in the financial catalogue.
"""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import sys
import subprocess
import uuid

VERSION = 'producer-results-v1'
SKIPPED = {'cached', 'unchanged', 'not-attempted', 'waiting', 'deferred', 'not-applicable', 'excluded'}


def validate_contract(contract):
    if contract.get('schemaVersion')!=1 or contract.get('protocol')!=VERSION:raise ValueError('Unknown producer result contract version')
    scope = contract['scope']
    plan=contract.get('inputPlan')
    if plan:
        digest=hashlib.sha256(json.dumps({k:v for k,v in plan.items()if k!='sha256'},sort_keys=True).encode()).hexdigest()
        if (digest!=plan['sha256'] or [r['id']for r in plan['items']]!=scope['expectedIds']
                or scope.get('items')!=plan['items']
                or [r['id']for r in plan['items']if r.get('selected',True)]!=scope['requestedIds']):
            raise ValueError('Predeclared producer plan was modified')
    expected, requested = scope['expectedIds'], scope['requestedIds']
    for ids in (expected, requested):
        if not isinstance(ids, list) or any(not isinstance(i, str) or not i for i in ids) or len(set(ids)) != len(ids):
            raise ValueError('Invalid producer scope identifiers')
    if not set(requested) <= set(expected):
        raise ValueError('Requested work is outside the predeclared scope')
    if not expected and not scope.get('emptyReason'):
        raise ValueError('Empty producer scope without justification')
    rows = contract['outcomes']
    identifiers = [r['id'] for r in rows]
    if len(set(identifiers)) != len(identifiers):
        raise ValueError('Duplicate individual producer result')
    if set(identifiers) != set(expected):
        raise ValueError('Missing or unexpected individual producer result')
    for row in rows:
        if plan and row.get('instrument')!=next(i['instrument']for i in plan['items']if i['id']==row['id']):raise ValueError('Producer instrument identity differs from input plan')
        if row['id'] not in requested and row['status'] not in SKIPPED:raise ValueError('Unselected item cannot be certified or attempted')
        if row['status'] not in SKIPPED | {'succeeded', 'unchanged-verified', 'failed'}:
            raise ValueError('Unknown producer result status')
        if row['status'] in SKIPPED and not row.get('reason'):
            raise ValueError('Unattempted/waiting result without a reason')
        if row['status'] in ('succeeded', 'unchanged-verified') and row.get('sourceAttempted') is not True and row.get('phase') not in ('qualification','validation'):
            raise ValueError('Cache cannot certify a source control')
    return contract


def finish(native, plan, *, completed=True):
    """Only native observed results count; expected work was frozen before execution."""
    from publish_automation_status import _normalize_report
    interruption_reason = None
    payload = {**native, '_collector': plan['reportStem']}
    try:
        normalized = ({'successes':[{'id':'history:bitcoin-yahoo'}],'errors':[]} if plan['producer']=='update_bitcoin_monthly' and native.get('symbol')=='BTC-USD' and native.get('points') and native.get('checkedAt') else (native['contractResults'] if 'contractResults' in native else _normalize_report(payload))) if completed else {'successes': [], 'errors': []}
        if not isinstance(normalized,dict):raise ValueError('Unknown native producer result shape')
    except (ValueError, TypeError, KeyError, AttributeError, IndexError) as error:
        normalized = {'successes': [], 'errors': []}
        completed = False
        interruption_reason = 'Rapport natif illisible : ' + str(error)
    found = {}
    issues = []
    for kind in ('successes', 'errors', 'inactive'):
        for row in normalized.get(kind, []):
            key = row['id']
            if key in found:
                # Do not resolve an error with a duplicate success.
                issues.append('Résultat dupliqué ou contradictoire : ' + key)
                if kind != 'errors':
                    continue
            found[key] = {**row, 'status': row.get('status') if kind=='successes' and row.get('status')=='unchanged-verified' else {'successes':'succeeded', 'errors':'failed', 'inactive':'not-attempted'}[kind]}
    # Carry actual source/period metadata, without borrowing a cache date or
    # assigning the report creation date to a financial observation.
    for collection,prefix,key in [('shares','etf-'+plan['reportStem']+'-','isin'),('records','','isin'),('observations','','id'),('managers','investor:','slug'),('series','history:','id')]:
        rows=native.get(collection,[])
        if not isinstance(rows,list):continue
        for record in rows:
            if not isinstance(record,dict)or key not in record:continue
            identifier=prefix+record[key]
            if identifier not in found:continue
            for field in ('checkedAt','asOf','periodStart','periodEnd','currency','sourceUrl','sourceUrls','attemptedAt','lastSuccessAt'):
                if field in record:found[identifier][field]=record[field]
            dates={field:value.get('asOf')for field,value in record.items() if isinstance(value,dict)and value.get('asOf')}
            if dates:found[identifier]['dataPeriods']=dates
            if record.get('fieldQualification'):found[identifier]['fieldQualifications']=record['fieldQualification']

    # Native collectors that deliberately reuse cache must explicitly name it.
    for row in native.get('contractSkipped', []):
        found[row['id']] = row
    # Inspect native explicit non-source statuses; retained rows are not controls.
    for collection, prefix, key in [('series','history:','id'),('managers','investor:','slug')]:
        for row in native.get(collection, []):
            if row.get('status') in SKIPPED:
                found[prefix+row[key]]={**row,'status':row['status'],'reason':row.get('reason') or 'Cached/conditional result; source not checked in this invocation'}
    for row in native.get('outcomes', []):
        if row.get('status') in SKIPPED | {'unchanged-verified'}:
            found[row['id']]={**row,'reason':row.get('reason') or 'Explicit conditional/cache outcome'}
    if plan.get('cacheRequested'):
        for key,row in list(found.items()):
            if row['status'] in ('succeeded','unchanged-verified'):
                found[key]={**row,'status':'cached','reason':'Cache mode; source control not demonstrated'}
    for instrument, fields in native.get('pending', {}).items():
        for field in fields:
            for suffix in ('',':qualification'):
                key=instrument+':'+field+suffix
                if key not in found:found[key]={'id':key,'status':'deferred','reason':'Champ explicitement en attente de publication/qualification dans ce rapport ; aucune valeur ni réussite renouvelée'}
    expected = {r['id']:r for r in plan['items']}
    for identifier in sorted(set(found)-set(expected)):
        issues.append('Résultat hors périmètre déclaré : ' + identifier)
    outcomes = []
    for identifier, item in expected.items():
        if not item.get('selected', True):
            value = {'operationAttempted':False, 'status':'not-applicable'if item['reason'].startswith('Non applicable')else'not-attempted', 'reason':item['reason'], 'sourceAttempted':False}
        elif identifier not in found and item.get('dependsOn')in found and found[item['dependsOn']]['status']not in ('succeeded','unchanged-verified'):
            value={'status':'not-attempted','operationAttempted':False,'sourceAttempted':False,'reason':'Dependent observation could not be qualified: '+item['dependsOn']}
        elif identifier not in found:
            value = {'status':'failed', 'sourceAttempted':None, 'operationAttempted':None, 'kind':'omission', 'phase':'reporting',
                     'field':'Compte rendu individuel : '+', '.join(item.get('fields',[])), 'error':interruption_reason or plan.get('interruptionReason') or ('Résultat attendu absent' if completed else 'Producteur interrompu avant son compte rendu individuel')}
        else:
            value = found[identifier]
            if value['status'] in SKIPPED:
                value = {**value, 'operationAttempted':value.get('operationAttempted',value.get('sourceAttempted')is True), 'sourceAttempted':value.get('sourceAttempted',False), 'reason':value.get('reason') or value.get('retirementStatus') or 'Exclusion/attente explicitement déclarée par le producteur'}
            else:
                # This is an observation emitted by this invocation, not a read of its
                # retained financial registry. No checkedAt/asOf is manufactured here.
                value = {**value, 'operationAttempted':True, 'sourceAttempted':value.get('sourceAttempted',True if value['status']in ('succeeded','unchanged-verified')else None)}
        if item.get('phase')in ('qualification','validation') and value.get('kind')!='omission':
            value={**value,'phase':item['phase'],'sourceAttempted':False,'validatedAt':native.get('checkedAt')}
        outcomes.append({**item, **value, 'id':identifier})
    diagnostics = [{**r,'phase':'validation','sourceAttempted':False}for r in _normalize_report(payload).get('errors',[])] if plan.get('retainNativeFailuresOnly') and native.get('contractDiagnosticsAttempted') is True and completed else []
    contract = {'schemaVersion':1, 'protocol':VERSION, 'inputPlan':plan, 'scope':{
        'kind':plan['producer'], 'mode':plan['mode'], 'expectedIds':list(expected),
        'requestedIds':[r['id'] for r in plan['items'] if r.get('selected',True)],
        'items':plan['items'], 'emptyReason':plan.get('emptyReason'),
        'declaredAt':plan['declaredAt'], 'planSha256':plan['sha256'],
        'attemptedIds':[r['id']for r in outcomes if r.get('operationAttempted')is True],
        'attemptUnknownIds':[r['id']for r in outcomes if r.get('operationAttempted')is None],
        'networkRequestedIds':[r['id']for r in outcomes if r.get('sourceAttempted')is True],
        'networkAttemptUnknownIds':[r['id']for r in outcomes if r.get('sourceAttempted')is None],
        'runId':os.environ.get('GITHUB_RUN_ID'), 'attempt':os.environ.get('GITHUB_RUN_ATTEMPT'),
        'selectionReason':plan.get('selectionReason'), 'nonce':plan['nonce']},
        'outcomes':outcomes, 'issues':issues, 'unscopedFailures':[r for key,r in found.items() if key not in expected and r['status']=='failed']+diagnostics}
    validate_contract(contract)
    return {**native, **({'producerStarted':VERSION}if not completed else{}), 'resultContract':contract}


def normalize_contract(contract):
    """Minimal monitoring adapter, independent from a native collector's shape."""
    validate_contract(contract)
    result = {'successes':[], 'errors':[], 'inactive':[]}
    for row in contract['outcomes']:
        if row['status'] in ('succeeded', 'unchanged-verified'):
            result['successes'].append(row)
        elif row['status'] == 'failed':
            result['errors'].append({**row, **({'id':'report-result:'+contract['scope']['kind']+':'+row['id'],'expectedId':row['id']}if row.get('kind')=='omission'else{}),
                'error':(row.get('error') or row.get('reason') or 'Échec individuel')+(' : '+row['id'] if row.get('kind')=='omission'else'')})
        elif row.get('retirementStatus') in ('waiting','superseded'):
            result['inactive'].append(row)
    result['errors'].extend(contract.get('unscopedFailures',[]))
    for n, cause in enumerate(contract.get('issues', [])):
        result['errors'].append({'id':'report-contract:'+contract['scope']['kind']+':'+str(n), 'field':'Périmètre du compte rendu', 'error':cause, 'phase':'reporting'})
    return result


def current_code_sha():
    try:
        value=subprocess.check_output(['git','rev-parse','HEAD'],cwd=Path(__file__).resolve().parents[1],text=True,stderr=subprocess.DEVNULL).strip()
        return value if len(value)==40 else None
    except (OSError,subprocess.CalledProcessError):return None


def run(producer, main):
    """Ordinary entry point: snapshot configuration before any network work/output."""
    if '--help' in sys.argv or '-h' in sys.argv or '--validate-scope' in sys.argv:
        return main()
    from producer_report_plans import build_plan, output_path
    path = output_path(producer, sys.argv[1:])
    if path is None:
        return main()  # non-reporting library/dry-run entry; never qualified by this helper
    plan = build_plan(producer, sys.argv[1:], report_stem=path.stem, module=sys.modules[main.__module__])
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    plan = {**plan, 'producer':producer, 'reportStem':path.stem, 'declaredAt':now, 'nonce':str(uuid.uuid4()), 'codeSha':current_code_sha(), 'durablePlan':True}
    plan['sha256'] = hashlib.sha256(json.dumps({k:v for k,v in plan.items()if k!='sha256'},sort_keys=True).encode()).hexdigest()
    from data_automation import write_json_atomic
    # A SIGKILL still leaves the expected scope in the ordinary artifact path.
    placeholder = {'producerStarted':VERSION, 'resultContract':finish({},plan,completed=False)['resultContract']}
    write_json_atomic(path.with_name(path.stem+'.contract-plan.json'), placeholder)
    write_json_atomic(path, placeholder)
    try:
        return main()
    finally:
        try:
            native = json.loads(path.read_text())
            completed = native.get('producerStarted') != VERSION
            if not completed:native = {}
            write_json_atomic(path,finish(native,plan,completed=completed))
        except (OSError, ValueError) as error:
            # Do not turn a failed write/invalid report into a source success.
            print('Producer report contract could not be recorded: '+str(error),file=sys.stderr)
            raise


def bridge():
    """Small JSON bridge for JS producers, sharing validation and omission semantics."""
    value=json.load(sys.stdin)
    if value['action']=='prepare':
        plan=value['plan'];plan.update(declaredAt=dt.datetime.now(dt.timezone.utc).isoformat(),nonce=str(uuid.uuid4()),codeSha=current_code_sha(),durablePlan=True)
        plan['sha256']=hashlib.sha256(json.dumps({k:v for k,v in plan.items()if k!='sha256'},sort_keys=True).encode()).hexdigest()
        print(json.dumps({'plan':plan,'placeholder':{'producerStarted':VERSION,'resultContract':finish({},plan,completed=False)['resultContract']}}))
    elif value['action']=='finish':
        print(json.dumps(finish(value['report'],value['plan'])))
    else:raise ValueError('Unknown contract bridge action')

if __name__=='__main__':bridge()
