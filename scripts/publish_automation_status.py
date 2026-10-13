"""Publish only real automation failures independently of the application build."""
import argparse
import base64
import json
import os
import pathlib
import subprocess
import tempfile
import urllib.error
import urllib.request

REGISTRY = json.loads((pathlib.Path(__file__).resolve().parents[1] / 'src/data/automation-workflows.json').read_text())
WORKFLOWS = {key: value['name'] for key, value in REGISTRY.items()}
REPORT_ARTIFACTS = {key: value['artifact'] for key, value in REGISTRY.items() if value.get('artifact')}
BRANCH = 'automation-status'
PATH = 'automation-status.json'


DATA_LABELS = {'purchasing-general': 'Prix à la consommation', 'purchasing-alimentation': 'Prix alimentaires', 'purchasing-energie': 'Prix de l’énergie', 'purchasing-irl': 'Indice des loyers', 'purchasing-smic': 'SMIC','livret-a': 'Taux du Livret A', 'fonds-euros': 'Moyenne des fonds euros', 'scpi': 'Rendement global des SCPI',
              'insee-wealth': 'Patrimoine des ménages', 'insee-holdings': 'Détention des placements et crédits',
              'insee-living': 'Privations matérielles', 'insee-salaries': 'Salaires', 'insee-ageWealth': 'Patrimoine selon l’âge',
              'insee-ageHoldings': 'Détention selon l’âge et la catégorie sociale', 'insee-transmissions': 'Héritages et donations'}

def normalize_report(report):
    """Adapt issuer/index reports without turning preserved values into recovered sources."""
    if any(key in report for key in ('funds', 'qualified', 'monthly', 'levels')):
        # Each sub-collector has its own key: a price recovery cannot clear a fund failure.
        combined = {'successes': [], 'errors': []}
        parts = []
        if 'funds' in report:
            parts.append(('funds', normalize_report(report['funds'])))
        for key, rows in [('qualified', report.get('qualified', [])),
                          ('monthly', report.get('monthly', {}).get('series', []))]:
            parts.append((key, {
                'successes': [{'id': row['id']} for row in rows if row.get('status') == 'validated'],
                'errors': [{'id': row['id'], 'error': row.get('reason', 'Collecte échouée')}
                           for row in rows if row.get('status') != 'validated']}))
        if 'levels' in report:
            parts.append(('levels', report['levels']))
        for prefix, part in parts:
            for kind in combined:
                combined[kind].extend({**row, 'id': prefix + ':' + row['id']} for row in part.get(kind, []))
        return combined
    if isinstance(report.get('records'), list) and ('failed' in report or 'excluded' in report):
        failures = report.get('failed', []) + [row for row in report.get('excluded', []) if row.get('active', True)]
        return {'successes': [{'id': row.get('isin', row.get('id'))} for row in report['records']],
                'errors': [{'id': row.get('isin', row.get('id')), 'name': row.get('isin', row.get('id')),
                            'error': row.get('error', 'Collecte échouée')} for row in failures],
                'inactive': [{'id': row.get('isin', row.get('id'))} for row in report.get('excluded', []) if row.get('active') is False]}
    if report.get('seriesId') == '011814631' and report.get('rates') and report.get('checkedAt'):
        return {'successes':[{'id':'inflation:011814631'}], 'errors':[]}
    if isinstance(report.get('sources'), dict) and 'failed' in report and 'changed' in report:
        successes, errors = [], []
        for key, source in report['sources'].items():
            id_ = 'practical:' + key
            if source.get('status') == 'error' or key in report['failed']:
                errors.append({'id':id_, 'name':source.get('label',key), 'error':source.get('error','Collecte échouée')})
            elif source.get('reviewRequired') or key in report['changed']:
                errors.append({'id':id_, 'name':source.get('label',key), 'error':'Document officiel modifié ; revue éditoriale requise'})
            elif source.get('status') == 'ok':
                successes.append({'id':id_})
        return {'successes':successes, 'errors':errors}
    if isinstance(report.get('observations'), dict) and isinstance(report.get('failures'), dict):
        # Regulatory and tariff reports include retained records. A failed source
        # must never clear its alert merely because its previous value is present.
        records = report['observations'].get('sources', report['observations'].get('brokers', {}))
        prefix = report.get('_collector', 'regulatory') + ':'
        failures = report['failures']
        # Tariff supplements/profile errors have their own keys. They are only
        # recovered when their fields were checked during this exact collection.
        # Record-key failures are recoverable from this report. Supplement keys
        # remain open unless their own successful observation is supplied.
        recovered = set(report.get('successfulSources', records)) - set(failures)
        return {'successes':[{'id':prefix + key} for key in recovered if key not in failures],
                'errors':[{'id':prefix + key,'name':records.get(key, {}).get('title', key),'error':cause}
                          for key,cause in failures.items()]}
    if 'observations' in report and 'indices' not in report and 'shares' not in report:
        return {'successes':[{'id':o['id']} for o in report['observations'] if o['status']=='success'],
                'errors':[{'id':o['id'],'name':o.get('name',o['id']),'error':o.get('reason','Collecte échouée')} for o in report['observations'] if o['status']=='failure']}
    if 'indices' in report:
        successes, errors = [], []
        for item in report['indices']:
            for field in ['composition', 'returns']:
                id_ = 'index-' + item['id'] + '-' + field
                failed = [e for e in item.get('errors', []) if e['field'] == field]
                errors.extend({'id': id_, 'name': item.get('name', item['id']) + ' · ' + field, 'error': e['reason']} for e in failed)
                if not failed and item.get('facts' if field == 'composition' else 'returns'):
                    successes.append({'id': id_})
        return {'successes': successes, 'errors': errors}
    if 'shares' in report:
        successes, errors = [], []
        for item in report['shares']:
            id_ = 'etf-' + report.get('_collector', 'issuer') + '-' + item['isin']
            causes = ([item.get('reason', 'Collecte échouée')] if item.get('status') == 'failed' else [])
            causes += [e.get('reason', 'Champ non validé') for e in item.get('collectionErrors', [])]
            if causes:
                errors.append({'id': id_, 'name': 'ETF ' + item['isin'], 'error': ' ; '.join(causes)})
            else:
                successes.append({'id': id_})
        errors += [{'id': 'etf-' + report.get('_collector', 'issuer') + '-' + e['isin'], 'name': 'ETF ' + e['isin'], 'error': e['reason']} for e in report.get('failures', [])]
        return {'successes': successes, 'errors': errors}
    return report


def include_configured_workflows(state):
    """An automation with no observed run is visible, never reported as successful."""
    result = json.loads(json.dumps(state))
    result.setdefault('schemaVersion', 1)
    entries = result.setdefault('workflows', {})
    for workflow, name in WORKFLOWS.items():
        entries.setdefault(workflow, {'name':name, 'status':'unknown', 'collectionStatus':'unknown',
            'publicationStatus':'not-run', 'dataFailures':{}, 'failures':[]})
    return result


def read_report(path, workflow):
    # Issuer observations retain raw official components and full holdings.
    # Give that existing artifact a bounded larger envelope, then immediately
    # discard the payload by projecting only failure/recovery observations.
    limit = 128_000_000 if workflow == 'collect-etf-pilot.yml' else 8_000_000
    size = path.stat().st_size
    if size > limit:
        raise ValueError(f'Rapport de collecte trop volumineux : {path.name} ({size} > {limit})')
    report = json.loads(path.read_text())
    report['_collector'] = path.stem
    return normalize_report(report)


def publication_summary(run, jobs):
    deploy_jobs = [job for job in jobs if job['name'].startswith('deploy /') or job['name'] == 'deploy']
    published = [step.get('completed_at') or job.get('completed_at') or run['updated_at']
                 for job in deploy_jobs for step in job.get('steps', [])
                 if 'actions/deploy-pages@' in step.get('name', '') and step.get('conclusion') == 'success']
    status = 'success' if published else 'failure' if any(job.get('conclusion') in ('failure', 'timed_out') for job in deploy_jobs) else 'not-run'
    return status, max(published, default=None)


def repair_publication_history(state, history):
    """Backfill verified publication dates, including already-recorded runs.

    Do not replay data failures or change collection dates. A legacy timestamp
    is cleared only when its exact job is proven to have skipped publication.
    """
    result = json.loads(json.dumps(state))
    for workflow, row in result.get('workflows', {}).items():
        relevant = [(run, jobs) for run, jobs in history if run['path'].split('/')[-1] == workflow]
        dates = [date for run, jobs in relevant if (date := publication_summary(run, jobs)[1])]
        for run, jobs in relevant:
            if (run['id'], run.get('run_attempt', 1)) != (row.get('runId'), row.get('attempt', 1)):
                continue
            row['publicationStatus'], actual = publication_summary(run, jobs)
            collector = REGISTRY[workflow]['collectionJob']
            if not row.get('dataFailures') and any(job['name'] == collector and job.get('conclusion') == 'success' for job in jobs):
                row['collectionStatus'] = 'success'
                row['lastCollectionSuccessAt'] = run['updated_at']
            skipped_dates = {job.get('completed_at') or run['updated_at'] for job in jobs
                             if job['name'].endswith('deploy') and job.get('conclusion') == 'success'
                             and not publication_summary(run, [job])[1]}
            if not actual and row.get('lastPublicationSuccessAt') in skipped_dates:
                row['lastPublicationSuccessAt'] = None
        if dates:
            row['lastPublicationSuccessAt'] = max([*dates, row.get('lastPublicationSuccessAt') or ''])
    return result


def update_status(state, run, jobs, reports=None):
    result = json.loads(json.dumps(state))
    workflow = run['path'].split('/')[-1]
    if workflow not in WORKFLOWS or run.get('head_branch') != 'master' or run.get('event') not in ('push', 'schedule', 'workflow_dispatch', 'workflow_run') or run.get('status') != 'completed':
        return result
    entries = result.get('workflows', {})
    previous = entries.get(workflow, {})
    stamp = (run['updated_at'], run['id'], run.get('run_attempt', 1))
    old_stamp = (previous.get('completedAt', ''), previous.get('runId', 0), previous.get('attempt', 1))
    if stamp <= old_stamp or run['conclusion'] in ('cancelled', 'skipped', 'neutral'):
        return result
    failed = run['conclusion'] in ('failure', 'timed_out', 'startup_failure', 'action_required')
    data_failures = previous.get('dataFailures', {}).copy()
    for raw_report in reports or []:
        report = normalize_report(raw_report)
        # Explicit exclusion of a non-production candidate retires its legacy alert,
        # without claiming that the source recovered or clearing other failures.
        for inactive in report.get('inactive', []):
            data_failures.pop(inactive['id'], None)
        for success in report.get('successes', []):
            data_failures.pop(success['id'], None)
        for error in report.get('errors', []):
            id_ = error['id']
            data_failures[id_] = {'name': error.get('name', DATA_LABELS.get(id_, id_)), 'completedAt': run['updated_at'],
                'runUrl': run['html_url'], 'cause': str(error['error'])[:500]}
    failures = []
    for job in jobs:
        if job.get('conclusion') not in ('failure', 'timed_out'):
            continue
        for step in job.get('steps', []):
            if step.get('conclusion') in ('failure', 'timed_out'):
                failures.append({'job': job['name'], 'step': step['name']})
    refresh_jobs = [job for job in jobs if job['name'] == REGISTRY[workflow]['collectionJob']]
    collection_status = 'failure' if data_failures or any(j.get('conclusion') in ('failure','timed_out') for j in refresh_jobs) else 'success' if reports or any(j.get('conclusion') == 'success' for j in refresh_jobs) else 'unknown'
    publication_status, published_at = publication_summary(run, jobs)
    result['workflows'] = entries
    entries[workflow] = {'name': WORKFLOWS[workflow], 'runId': run['id'], 'attempt': run.get('run_attempt', 1),
        'completedAt': run['updated_at'], 'status': 'failure' if failed or data_failures else 'success',
        'lastSuccessAt': previous.get('lastSuccessAt') if failed or data_failures else run['updated_at'],
        'collectionStatus': collection_status, 'publicationStatus': publication_status,
        'lastCollectionSuccessAt': run['updated_at'] if collection_status == 'success' else previous.get('lastCollectionSuccessAt'),
        'lastPublicationSuccessAt': published_at if publication_status == 'success' else previous.get('lastPublicationSuccessAt'),
        'runUrl': run['html_url'], 'failures': failures, 'dataFailures': data_failures}
    result['schemaVersion'] = 1
    result['updatedAt'] = run['updated_at']
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--event', type=pathlib.Path)
    parser.add_argument('--backfill', action='store_true')
    args = parser.parse_args()
    repo = os.environ['GITHUB_REPOSITORY']
    token = os.environ['GH_TOKEN']
    root = f'https://api.github.com/repos/{repo}'
    def api(path, method='GET', data=None):
        request = urllib.request.Request(root+path, method=method,
            data=json.dumps(data).encode() if data is not None else None,
            headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json', 'User-Agent': 'EpargnantLibre-Automation', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=25) as response:
            return json.load(response)
    try:
        file = api(f'/contents/{PATH}?ref={BRANCH}')
        state = json.loads(base64.b64decode(file['content']))
        sha = file['sha']
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        state = {'schemaVersion': 1, 'workflows': {}}
        sha = None
    runs = []
    if args.backfill:
        for workflow in WORKFLOWS:
            try:
                candidates = api(f'/actions/workflows/{workflow}/runs?branch=master&status=completed&per_page=30')['workflow_runs']
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    continue
                raise
            candidates = [r for r in candidates if r['event'] in ('push', 'schedule', 'workflow_dispatch', 'workflow_run') and r['conclusion'] not in ('cancelled', 'skipped', 'neutral')]
            if candidates and workflow in REPORT_ARTIFACTS:
                runs.extend(candidates)
                continue
            if candidates:
                latest = max(candidates, key=lambda r: r['updated_at'])
                successful = [r for r in candidates if r['conclusion'] == 'success' and r['updated_at'] < latest['updated_at']]
                if successful:
                    runs.append(max(successful, key=lambda r: r['updated_at']))
                runs.append(latest)
    else:
        require_event = json.loads(args.event.read_text())
        runs = [require_event['workflow_run']]
    publication_history = []
    for run in sorted(runs, key=lambda r: (r['updated_at'], r['id'])):
        jobs = []
        page = 1
        while True:
            batch = api(f'/actions/runs/{run["id"]}/attempts/{run.get("run_attempt",1)}/jobs?per_page=100&page={page}')['jobs']
            jobs.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        reports = []
        if run['path'].split('/')[-1] in REPORT_ARTIFACTS:
            artifact_name = REPORT_ARTIFACTS[run['path'].split('/')[-1]]
            artifacts = api(f'/actions/runs/{run["id"]}/artifacts?per_page=100')['artifacts']
            available = [a for a in artifacts if a['name'] == artifact_name and not a['expired']]
            if available:
                with tempfile.TemporaryDirectory() as directory:
                    subprocess.run(['gh', 'run', 'download', str(run['id']), '--repo', repo,
                                    '--name', artifact_name, '--dir', directory],
                                   check=True, capture_output=True, timeout=90)
                    for path in pathlib.Path(directory).glob('*.json'):
                        reports.append(read_report(path, run['path'].split('/')[-1]))
        state = update_status(state, run, jobs, reports)
        publication_history.append((run, jobs))
    if args.backfill:
        state = repair_publication_history(state, publication_history)
    if sha is None:
        try:
            api(f'/git/ref/heads/{BRANCH}')
        except urllib.error.HTTPError as e:
            if e.code != 404:
                raise
            head = api('/git/ref/heads/master')['object']['sha']
            api('/git/refs', 'POST', {'ref': f'refs/heads/{BRANCH}', 'sha': head})
    state = include_configured_workflows(state)
    encoded = base64.b64encode((json.dumps(state,ensure_ascii=False,indent=2)+'\n').encode()).decode()
    payload = {'message': 'Update automation failure status', 'branch': BRANCH, 'content': encoded}
    if sha:
        payload['sha'] = sha
    api(f'/contents/{PATH}', 'PUT', payload)
    print(f'Statuts publiés : {len(state["workflows"])} automatisations')


if __name__ == '__main__':
    main()
