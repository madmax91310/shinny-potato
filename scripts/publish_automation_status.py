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

REPORT_ARTIFACTS = {'update-economic-data.yml': 'economic-observations', 'update-publication-observations.yml': 'publication-observations', 'collect-etf-pilot.yml': 'active-etf-observation'}

WORKFLOWS = {
    'update-publication-observations.yml': 'Pouvoir d’achat et niveaux des anniversaires',
    'update-insurance.yml': 'Présentations d’assurance-vie',
    'update-scpi.yml': 'Présentations de SCPI',
    'update-regulatory-data.yml': 'Paramètres fiscaux, LDDS et tarifs de courtiers',
    'collect-etf-pilot.yml': 'ETF et compositions d’indices',
    'update-market-monthly.yml': 'Historiques mensuels des marchés',
    'update-bitcoin-monthly.yml': 'Historique du bitcoin',
    'update-gold-monthly.yml': 'Historique de l’or',
    'update-inflation.yml': 'Inflation INSEE',
    'update-investor-13f.yml': 'Portefeuilles des investisseurs',
    'update-company-analysis.yml': 'Analyses d’entreprises',
    'update-economic-data.yml': 'Taux d’épargne, ménages, SCPI et fonds euros',
}
BRANCH = 'automation-status'
PATH = 'automation-status.json'


DATA_LABELS = {'purchasing-general': 'Prix à la consommation', 'purchasing-alimentation': 'Prix alimentaires', 'purchasing-energie': 'Prix de l’énergie', 'purchasing-irl': 'Indice des loyers', 'purchasing-smic': 'SMIC','livret-a': 'Taux du Livret A', 'fonds-euros': 'Moyenne des fonds euros', 'scpi': 'Rendement global des SCPI',
              'insee-wealth': 'Patrimoine des ménages', 'insee-holdings': 'Détention des placements et crédits',
              'insee-living': 'Privations matérielles', 'insee-salaries': 'Salaires', 'insee-ageWealth': 'Patrimoine selon l’âge',
              'insee-ageHoldings': 'Détention selon l’âge et la catégorie sociale', 'insee-transmissions': 'Héritages et donations'}

def normalize_report(report):
    """Adapt issuer/index reports without turning preserved values into recovered sources."""
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


def update_status(state, run, jobs, reports=None):
    result = json.loads(json.dumps(state))
    workflow = run['path'].split('/')[-1]
    if workflow not in WORKFLOWS or run.get('head_branch') != 'master' or run.get('event') not in ('push', 'schedule', 'workflow_dispatch') or run.get('status') != 'completed':
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
    result['workflows'] = entries
    entries[workflow] = {'name': WORKFLOWS[workflow], 'runId': run['id'], 'attempt': run.get('run_attempt', 1),
        'completedAt': run['updated_at'], 'status': 'failure' if failed or data_failures else 'success',
        'lastSuccessAt': previous.get('lastSuccessAt') if failed or data_failures else run['updated_at'],
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
            candidates = [r for r in candidates if r['event'] in ('push', 'schedule', 'workflow_dispatch') and r['conclusion'] not in ('cancelled', 'skipped', 'neutral')]
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
                    for path in pathlib.Path(directory).glob('*observation.json'):
                        if path.stat().st_size > 8_000_000:
                            raise ValueError('Rapport de collecte trop volumineux')
                        report = json.loads(path.read_text())
                        report['_collector'] = path.stem
                        reports.append(report)
        state = update_status(state, run, jobs, reports)
    if sha is None:
        try:
            api(f'/git/ref/heads/{BRANCH}')
        except urllib.error.HTTPError as e:
            if e.code != 404:
                raise
            head = api('/git/ref/heads/master')['object']['sha']
            api('/git/refs', 'POST', {'ref': f'refs/heads/{BRANCH}', 'sha': head})
    encoded = base64.b64encode((json.dumps(state,ensure_ascii=False,indent=2)+'\n').encode()).decode()
    payload = {'message': 'Update automation failure status', 'branch': BRANCH, 'content': encoded}
    if sha:
        payload['sha'] = sha
    api(f'/contents/{PATH}', 'PUT', payload)
    print(f'Statuts publiés : {len(state["workflows"])} automatisations')


if __name__ == '__main__':
    main()
