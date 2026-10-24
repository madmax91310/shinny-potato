"""Publish only real automation failures independently of the application build."""
import argparse
import datetime as dt
import base64
import json
import io
import time
import zipfile
import os
import pathlib
import re
import subprocess
import tempfile
import urllib.error
import urllib.request

from automation_monitoring import evaluate_monitoring, sync_monitoring_issue, timestamp
from github_automation_transport import request_json, unseen_completed_runs
from automation_recovery import plan_recovery, persist_and_dispatch, recovery_reason

REGISTRY = json.loads((pathlib.Path(__file__).resolve().parents[1] / 'src/data/automation-workflows.json').read_text())
WORKFLOWS = {key: value['name'] for key, value in REGISTRY.items()}
REPORT_ARTIFACTS = {key: value['artifact'] for key, value in REGISTRY.items() if value.get('artifact')}
ACTIVE_QUALIFIED = {row['isin'] for row in json.loads((pathlib.Path(__file__).resolve().parents[1] / 'src/data/qualified-exposure-etfs.json').read_text()).values()}
BRANCH = 'automation-status'
PATH = 'automation-status.json'


DATA_LABELS = {'purchasing-general': 'Prix à la consommation', 'purchasing-alimentation': 'Prix alimentaires', 'purchasing-energie': 'Prix de l’énergie', 'purchasing-irl': 'Indice des loyers', 'purchasing-smic': 'SMIC','livret-a': 'Taux du Livret A', 'fonds-euros': 'Moyenne des fonds euros', 'scpi': 'Rendement global des SCPI',
              'insee-wealth': 'Patrimoine des ménages', 'insee-holdings': 'Détention des placements et crédits',
              'insee-living': 'Privations matérielles', 'insee-salaries': 'Salaires', 'insee-ageWealth': 'Patrimoine selon l’âge',
              'insee-ageHoldings': 'Détention selon l’âge et la catégorie sociale', 'insee-transmissions': 'Héritages et donations'}

def normalize_report(report):
    """Adapt issuer/index reports without turning preserved values into recovered sources."""
    if isinstance(report.get('series'), list):
        rows = report['series'] + list(report.get('fxSources', {}).values())
        # Legacy booleans still represent an unresolved source, not a successful retry.
        if not report.get('fxSources'):
            rows += [{'id': 'fx:' + key, 'status': 'failed', 'reason': 'Source de change en échec'}
                     for key, failed in [('ECB', report.get('fxFailed')), ('TWD', report.get('crossFxFailed'))] if failed]
        if 'attemptedIds' in report:
            attempted = report['attemptedIds']
            if (not isinstance(attempted,list) or any(not isinstance(id_,str)or not id_ for id_ in attempted)
                    or len(set(attempted))!=len(attempted)):
                raise ValueError('Invalid attempted ranking source identifiers')
            # A retained status is not this run's observation. Keep the old incident
            # and its original attempt date when a targeted retry skips its source.
            rows = [row for row in rows if row['id'] in attempted]
        return {'successes': [{'id': 'history:' + r['id']} for r in rows if r.get('status') == 'validated'],
                'errors': [{'id': 'history:' + r['id'], 'field': 'Change' if r['id'].startswith('fx:') else 'Historique mensuel',
                            'error': r.get('reason', 'Collecte échouée')} for r in rows if r.get('status') == 'failed']}
    if isinstance(report.get('validated'), list) and isinstance(report.get('failed'), list):
        return {'successes': [{'id': 'listing:' + isin} for isin in report['validated']],
                'errors': [{'id': 'listing:' + r['isin'], 'field': 'Cotation', 'error': r.get('reason', 'Collecte échouée')}
                           for r in report['failed']]}
    if isinstance(report.get('companies'), dict):
        result = {'successes': [], 'errors': []}
        # Isolate every producer and field: a quote cannot repair an earnings forecast.
        fields = {'accounts','quote','forecast','cashBasis','cashReference','depth','history','quarter',
                  'publication','decision','solidity','estimates','historySupplement','valuationShareBasis',
                  'targetForecast','targetCashReference'}
        for company, observations in report['companies'].items():
            if not isinstance(observations, dict):
                continue
            for field in fields & observations.keys():
                value = observations[field]
                identifier = report.get('_collector', 'company') + ':' + company + ':' + field
                if value in ('updated', 'qualified'):
                    result['successes'].append({'id': identifier})
                elif isinstance(value, str) and value != 'cached-with-original-observation-date':
                    result['errors'].append({'id': identifier, 'name': company, 'field': field,
                        'error': observations.get(field + 'Detail', value)})
        return result
    if report.get('_collector') == 'dca-equities':
        return {'successes': [{'id': 'dca-equity:' + asset} for asset in report.get('updated', [])],
                'errors': [{'id': 'dca-equity:' + asset, 'field': 'Classification pays/secteur',
                            'error': 'Classification absente de la source ; dernière observation conservée'}
                           for asset in report.get('missing', [])]}
    if isinstance(report.get('managers'), list):
        return {'successes': [{'id': 'investor:' + row['slug']} for row in report['managers'] if row.get('status') == 'validated'],
                'errors': [{'id': 'investor:' + row['slug'], 'field': 'Portefeuille 13F', 'error': row.get('reason', 'Collecte échouée')}
                           for row in report['managers'] if row.get('status') != 'validated']}
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
        # Older artifacts lack the active flag; consult the production catalogue.
        excluded = [{**row, 'active': row.get('active', row.get('isin') in ACTIVE_QUALIFIED)} for row in report.get('excluded', [])]
        failures = report.get('failed', []) + [row for row in excluded if row['active']]
        return {'successes': [{'id': row.get('isin', row.get('id'))} for row in report['records']],
                'errors': [{'id': row.get('isin', row.get('id')), 'name': row.get('isin', row.get('id')),
                            'error': row.get('error', 'Collecte échouée')} for row in failures],
                'inactive': [{'id': row.get('isin', row.get('id'))} for row in excluded if row['active'] is False]}
    if report.get('_collector') == 'feed' and isinstance(report.get('errors'), list) and isinstance(report.get('coverage'), dict):
        # Radar feed: a family whose local sources could not be read keeps its previous
        # signals and is reported as a partial failure. Same-period contradictions are
        # review signals handled by the monitoring step, never collection failures.
        failing = {}
        for error in report['errors']:
            reason = str(error.get('reason', 'Source indisponible'))
            # An older observation set aside by the date-regression guard is that guard working,
            # not an unreadable source: the newer value stays published.
            if 'Valeur contradictoire pour la même période' in reason or reason.startswith('Observation plus ancienne ignorée'):
                continue
            failing.setdefault('radar:' + str(error.get('family') or 'radar'), []).append(reason)
        return {'successes': [{'id': 'radar:' + family} for family in report['coverage'] if 'radar:' + family not in failing],
                'errors': [{'id': key, 'name': 'Radar · ' + key.split(':', 1)[1], 'field': 'Sources du radar',
                            'error': ' ; '.join(sorted(set(reasons)))[:500]} for key, reasons in failing.items()]}
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
        # 'waiting': the next scheduled edition is not due yet. The alert is retired without
        # claiming a recovery; it reopens as a failure once the edition is overdue.
        # 'superseded': the official page declares a successor (Linxea Avenir 2 -> 2+); the
        # contract is archived with that evidence and its old identity alert is retired.
        return {'successes':[{'id':o['id']} for o in report['observations'] if o['status']=='success'],
                'errors':[{'id':o['id'],'name':o.get('name',o['id']),'error':o.get('reason','Collecte échouée')} for o in report['observations'] if o['status']=='failure'],
                'inactive':[{'id':o['id']} for o in report['observations'] if o['status'] in ('waiting', 'superseded')]}
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
                errors.append({'id': id_, 'name': 'ETF ' + item['isin'], 'field': ', '.join(sorted({e.get('field', 'Collecte') for e in item.get('collectionErrors', [])})) or 'Collecte ETF', 'error': ' ; '.join(causes)})
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
    retired = json.loads((pathlib.Path(__file__).resolve().parents[1] / 'src/data/retired-automations.json').read_text())['workflows']
    for workflow in retired:
        entries.pop(workflow, None)
    for workflow, name in WORKFLOWS.items():
        entries.setdefault(workflow, {'name':name, 'status':'unknown', 'collectionStatus':'unknown',
            'validationStatus':'unknown', 'recordingStatus':'not-run', 'publicationStatus':'not-run', 'dataFailures':{}, 'failures':[]})
    return result


def download_status_artifact(repo, artifacts, name, directory, timeout=45, runner=subprocess.run, sleep=time.sleep):
    """Select one immutable artifact ID, including after reruns, and retry safe reads.

    A download failure becomes a local evidence error; it must not abort monitoring
    for all other collectors. Never combine same-name archives from several attempts.
    """
    candidates = [a for a in artifacts if a['name'] == name and not a.get('expired')]
    if not candidates:
        return False
    artifact = max(candidates, key=lambda a: a['id'])
    if artifact.get('size_in_bytes', 0) > 256_000_000:
        raise ValueError('Automation artifact exceeds download limit')
    for attempt in range(2):
        try:
            response = runner(['gh', 'api', f'/repos/{repo}/actions/artifacts/{artifact["id"]}/zip'],
                              check=True, capture_output=True, timeout=timeout)
            break
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            if attempt:
                raise
            sleep(1)
    root = pathlib.Path(directory).resolve()
    with zipfile.ZipFile(io.BytesIO(response.stdout)) as archive:
        if sum(item.file_size for item in archive.infolist()) > 512_000_000:
            raise ValueError('Automation artifact exceeds extraction limit')
        for item in archive.infolist():
            target = (root / item.filename).resolve()
            if not target.is_relative_to(root):
                raise ValueError('Invalid automation artifact path')
        archive.extractall(root)
    return True


def report_files(directory):
    """Collector reports inside a downloaded artifact.

    upload-artifact roots a multi-path artifact at the paths' common ancestor: a report
    written to $RUNNER_TEMP next to repository snapshots lands under `_temp/`, not at the
    root. Snapshots of src/data are evidence, never reports, and stay unread.
    """
    root = pathlib.Path(directory)
    return sorted(root.glob('*.json')) + sorted(root.glob('_temp/**/*.json'))


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


def read_report_safely(path, workflow):
    """An unusable artifact is an incident, not a reason to lose every other result."""
    try:
        result = read_report(path, workflow)
        result.setdefault('successes', []).append({'id': 'report-read:' + path.stem})
        return result
    except (ValueError, OSError) as error:
        return {'successes': [], 'errors': [{'id': 'report-read:' + path.stem,
                'field': 'Rapport de collecte', 'error': str(error)}]}


def publication_summary(run, jobs):
    deploy_jobs = [job for job in jobs if job['name'].startswith('deploy /') or job['name'] == 'deploy']
    published = []
    verification_failed = False
    for job in deploy_jobs:
        steps = job.get('steps', [])
        deployments = [step for step in steps if 'actions/deploy-pages@' in step.get('name', '') and step.get('conclusion') == 'success']
        checks = [step for step in steps if step.get('name') in ('Verify actual public data', 'Verify the actual public data artifact', 'Verify the actual fallback data artifact')]
        # Legacy runs without this step retain their original evidence; a modern
        # deployment is never certified before the actual public-byte check.
        if deployments and checks and not all(step.get('conclusion') == 'success' for step in checks):
            verification_failed = True
            continue
        if deployments:
            last = checks[-1] if checks else deployments[-1]
            published.append(last.get('completed_at') or job.get('completed_at') or run['updated_at'])
    status = 'success' if published else 'failure' if verification_failed or any(job.get('conclusion') in ('failure', 'timed_out') for job in deploy_jobs) else 'not-run'
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
            if 'validationStatus' not in row and not row.get('dataFailures') and any(job['name'] == collector and job.get('conclusion') == 'success' for job in jobs):
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
    # Run IDs follow creation order. An older queued snapshot finishing later must
    # never replace a recovery collected by a newer run (nor on a later retry).
    stamp = (run['id'], run.get('run_attempt', 1))
    old_stamp = (previous.get('runId', 0), previous.get('attempt', 1))
    inactive = {row['id'] for report in reports or [] for row in normalize_report(report).get('inactive', [])}
    retires_legacy_alert = bool(inactive & previous.get('dataFailures', {}).keys())
    if stamp < old_stamp or (stamp == old_stamp and previous.get('monitorVersion', 1) >= 2 and not retires_legacy_alert) or run['conclusion'] in ('cancelled', 'skipped', 'neutral'):
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
                'runUrl': run['html_url'], 'cause': str(error['error'])[:500], **({'field': error['field']} if error.get('field') else {}),
                **{key: error[key] for key in ('sourceUrls', 'lastSuccessAt', 'asOf', 'attemptedAt', 'missingPeriods') if key in error}}
    failures = []
    for job in jobs:
        if job.get('conclusion') not in ('failure', 'timed_out'):
            continue
        named = [a.get('title', '')[len('Échec '):] + ' — ' + str(a.get('message', ''))[:200]
                 for a in job.get('annotations', []) if str(a.get('title', '')).startswith('Échec ')]
        for step in job.get('steps', []):
            if step.get('conclusion') in ('failure', 'timed_out'):
                failures.append({'job': job['name'], 'step': step['name'], **({'checks': named[:3]} if named else {})})
    refresh_jobs = [job for job in jobs if (job['name'] == REGISTRY[workflow]['collectionJob'] or job['name'].startswith(REGISTRY[workflow]['collectionJob'] + ' ('))]
    steps = [step for job in refresh_jobs for step in job.get('steps', [])]
    def phase_status(names):
        selected = [step for step in steps if step.get('name') in names]
        if any(step.get('conclusion') in ('failure', 'timed_out') for step in selected):
            return 'failure'
        if any(step.get('conclusion') == 'success' for step in selected):
            return 'success'
        return 'not-run' if selected else 'unknown'

    collection_names = REGISTRY[workflow].get('collectionSteps', [])
    collection_status = phase_status(collection_names)
    validation_status = phase_status(REGISTRY[workflow].get('validationSteps', []))
    # A partial set of successful checks does not certify validation as complete.
    checkpoint = next((s for s in steps if s.get('name') == 'Validate collected observations'), None)
    if validation_status != 'failure':
        validation_status = ('success' if checkpoint and checkpoint.get('conclusion') == 'success'
                             else 'not-run' if checkpoint else 'unknown')
    if any(j['name'] == 'report-validation-failures' and j.get('conclusion') == 'failure' for j in jobs):
        validation_status = 'failure'
    recording_status = phase_status(['Commit validated observations'])
    if recording_status == 'unknown':
        recording_status = 'not-run'
    if data_failures or any(j['name'] == 'report-failures' and j.get('conclusion') == 'failure' for j in jobs):
        collection_status = 'failure'
    elif not any(step.get('name') in collection_names for step in steps):
        # Older runs have no phase metadata. Keep their historical evidence,
        # without interpreting a named setup failure as a collection failure.
        only_recording_failed = failures and all(f['step'] == 'Commit validated observations' for f in failures)
        collection_status = ('success' if reports and only_recording_failed
                             else 'unknown' if steps and failures
                             else 'failure' if any(j.get('conclusion') in ('failure', 'timed_out') for j in refresh_jobs)
                             else 'success' if reports or any(j.get('conclusion') == 'success' for j in refresh_jobs)
                             else 'unknown')
    publication_status, published_at = publication_summary(run, jobs)
    failed = failed or any(value == 'failure' for value in (collection_status, validation_status, recording_status, publication_status))
    result['workflows'] = entries
    entries[workflow] = {'monitorVersion': 2, 'name': WORKFLOWS[workflow], 'runId': run['id'], 'attempt': run.get('run_attempt', 1),
        'headSha': run.get('head_sha'), 'createdAt': run.get('created_at'),
        'completedAt': run['updated_at'], 'status': 'failure' if failed or data_failures else 'success',
        'lastSuccessAt': previous.get('lastSuccessAt') if failed or data_failures else run['updated_at'],
        'collectionStatus': collection_status, 'validationStatus': validation_status, 'recordingStatus': recording_status, 'publicationStatus': publication_status,
        'lastCollectionSuccessAt': run['updated_at'] if collection_status == 'success' else previous.get('lastCollectionSuccessAt'),
        'lastPublicationSuccessAt': published_at if publication_status == 'success' else previous.get('lastPublicationSuccessAt'),
        'runUrl': run['html_url'], 'failures': failures, 'dataFailures': data_failures}
    result['schemaVersion'] = 1
    result['updatedAt'] = run['updated_at']
    return result


def checkout_snapshot(log):
    """Exact checkout proof from the reusable deployment build, not the workflow head."""
    matches = re.findall(r'\[command\][^\n]*git log -1 --format=%H\r?\n[^\s]+ ([0-9a-f]{40})\r?(?:\n|$)', log)
    return matches[0] if len(matches) == 1 else None


def legacy_publication_receipt(repo, jobs, api):
    builds = [j for j in jobs if j['name'] == 'deploy / build']
    if len(builds) != 1:
        return None
    try:
        log = subprocess.run(['gh', 'api', f'repos/{repo}/actions/jobs/{builds[0]["id"]}/logs'],
                             check=True, capture_output=True, text=True, timeout=45).stdout
        sha = checkout_snapshot(log[:500_000])
        if not sha:
            return None
        tree = api(f'/git/trees/{sha}?recursive=1')
        if tree.get('truncated'):
            return None
        files = {r['path']: r['sha'] for r in tree['tree'] if r['type'] == 'blob'
                 and (r['path'].startswith(('src/data/', 'scripts/source-snapshots/', 'public/data/'))
                      or r['path'].startswith('src/pages/') and r['path'].endswith('.json'))
                 and r['path'] != 'public/data/publication-manifest.json'}
        return {'schemaVersion': 1, 'commit': sha, 'files': files, 'evidenceJobId': builds[0]['id']}
    except (subprocess.SubprocessError, urllib.error.URLError, ValueError, KeyError):
        return None


def reconcile_publication(state, build, manifest, compare):
    """Clear a publication block only with matching built bytes or full-snapshot ancestry.

    Fallback may exclude unknown assets: dataSha alone never certifies their publication.
    Collection incidents and failed checks remain visible after successful publication.
    """
    result = json.loads(json.dumps(state))
    if manifest.get('schemaVersion') != 1 or not build.get('sha') or not build.get('builtAt'):
        return result
    for row in result.get('workflows', {}).values():
        receipt = row.get('publicationReceipt', {})
        files = receipt.get('files', {})
        if not files or not receipt.get('commit'):
            continue
        exact = all(manifest.get('files', {}).get(name) == sha for name, sha in files.items())
        included = exact
        if not included and not build.get('dataSha'):
            included = compare(receipt['commit'], build['sha']) in ('ahead', 'identical')
        if included:
            row['publicationStatus'] = 'success'
            row['lastPublicationSuccessAt'] = build['builtAt']
            row['publishedCodeSha'] = build['sha']
            row['publishedDataSha'] = build.get('dataSha', build['sha'])
    return result


def decode_json_file(api, file):
    """Read the exact observed blob when the contents API omits a large body."""
    content = file.get('content') if file.get('encoding') == 'base64' else None
    if not content:
        content = api(f"/git/blobs/{file['sha']}")['content']
    return json.loads(base64.b64decode(content))


def read_large_file(api, path, ref):
    """The contents API leaves `content` empty above 1 MB; use its exact blob."""
    return decode_json_file(api, api(f'/contents/{path}?ref={ref}'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--event', type=pathlib.Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--backfill', action='store_true')
    mode.add_argument('--monitor-only', action='store_true')
    args = parser.parse_args()
    repo = os.environ['GITHUB_REPOSITORY']
    token = os.environ['GH_TOKEN']
    root = f'https://api.github.com/repos/{repo}'
    def api(path, method='GET', data=None):
        return request_json(root+path, token, method, data)
    try:
        file = api(f'/contents/{PATH}?ref={BRANCH}')
        state = decode_json_file(api, file)
        sha = file['sha']
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        state = {'schemaVersion': 1, 'workflows': {}}
        sha = None
    runs = []
    if args.backfill or args.monitor_only:
        for workflow in WORKFLOWS:
            try:
                candidates = api(f'/actions/workflows/{workflow}/runs?branch=master&status=completed&per_page=30')['workflow_runs']
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    continue
                raise
            if args.monitor_only:
                runs.extend(unseen_completed_runs(candidates, state.get('workflows', {}).get(workflow, {})))
                continue
            candidates = [r for r in candidates if r['event'] in ('push', 'schedule', 'workflow_dispatch', 'workflow_run') and r['conclusion'] not in ('cancelled', 'skipped', 'neutral')]
            if candidates and workflow in REPORT_ARTIFACTS:
                runs.extend(candidates)
                continue
            if candidates:
                latest = max(candidates, key=lambda r: (r['id'], r.get('run_attempt', 1)))
                successful = [r for r in candidates if r['conclusion'] == 'success' and r['id'] < latest['id']]
                if successful:
                    runs.append(max(successful, key=lambda r: r['id']))
                runs.append(latest)
    elif not args.monitor_only:
        require_event = json.loads(args.event.read_text())
        runs = [require_event['workflow_run']]
    publication_history = []
    for run in sorted(runs, key=lambda r: (r['id'], r.get('run_attempt', 1))):
        previous_run = state.get('workflows', {}).get(run['path'].split('/')[-1], {})
        if run['id'] < previous_run.get('runId', 0):
            continue
        jobs = []
        page = 1
        while True:
            batch = api(f'/actions/runs/{run["id"]}/attempts/{run.get("run_attempt",1)}/jobs?per_page=100&page={page}')['jobs']
            jobs.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        for job in jobs:
            # Browser checks annotate the exact failed check ('Échec ...'): keep it so
            # the incident names the test, not only the shard.
            if job.get('conclusion') in ('failure', 'timed_out') and job['name'].startswith('deploy /'):
                try:
                    job['annotations'] = api(f"/check-runs/{job['id']}/annotations?per_page=50")
                except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
                    job['annotations'] = []
        reports = []
        if run['path'].split('/')[-1] in REPORT_ARTIFACTS:
            artifact_name = REPORT_ARTIFACTS[run['path'].split('/')[-1]]
            artifacts = api(f'/actions/runs/{run["id"]}/artifacts?per_page=100')['artifacts']
            available = [a for a in artifacts if a['name'] == artifact_name and not a['expired']]
            if available:
                with tempfile.TemporaryDirectory() as directory:
                    key = 'artifact-read:' + artifact_name
                    try:
                        download_status_artifact(repo, artifacts, artifact_name, directory)
                        paths = list(report_files(directory))
                        if not paths:
                            raise ValueError('Collector report missing from artifact')
                        for path in paths:
                            reports.append(read_report_safely(path, run['path'].split('/')[-1]))
                        reports.append({'successes': [{'id': key}], 'errors': []})
                    except (subprocess.SubprocessError, OSError, ValueError, zipfile.BadZipFile) as error:
                        reports.append({'successes': [], 'errors': [{'id': key, 'field': 'Rapport de collecte',
                            'error': 'Artifact unavailable: ' + type(error).__name__}]})
        state = update_status(state, run, jobs, reports)
        workflow = run['path'].split('/')[-1]
        row = state.get('workflows', {}).get(workflow, {})
        if row.get('runId') == run['id']:
            receipts = api(f'/actions/runs/{run["id"]}/artifacts?per_page=100')['artifacts']
            if any(a['name'] == 'data-publication-receipt' and not a['expired'] for a in receipts):
                with tempfile.TemporaryDirectory() as directory:
                    try:
                        download_status_artifact(repo, receipts, 'data-publication-receipt', directory)
                        receipt = json.loads((pathlib.Path(directory) / 'data-publication-receipt.json').read_text())
                        if not isinstance(receipt, dict) or receipt.get('schemaVersion') != 1 or not isinstance(receipt.get('files'), dict):
                            raise ValueError('Invalid publication receipt')
                        row['publicationReceipt'] = receipt
                        row.pop('publicationEvidenceError', None)
                    except (subprocess.SubprocessError, OSError, ValueError, zipfile.BadZipFile) as error:
                        row['publicationEvidenceError'] = 'Publication receipt unavailable: ' + type(error).__name__
                        print(f'Run {run["id"]}: {row["publicationEvidenceError"]}; other collectors remain observable.')
        if row.get('runId') == run['id'] and not row.get('publicationReceipt') and row.get('recordingStatus') == 'success':
            receipt = legacy_publication_receipt(repo, jobs, api)
            if receipt:
                row['publicationReceipt'] = receipt
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
    try:
        owner, project = repo.split('/')
        public = f'https://{owner}.github.io/{project}/'
        def published(path):
            with urllib.request.urlopen(public + path, timeout=20) as response:
                return json.load(response) if response.status != 204 else None
        comparisons = {}
        def compare(base, head):
            key = (base, head)
            if key not in comparisons:
                comparisons[key] = api(f'/compare/{base}...{head}')['status']
            return comparisons[key]
        state = reconcile_publication(state, published('build-info.json'),
                                      published('data/publication-manifest.json'), compare)
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError, KeyError, TimeoutError):
        print('Publication non vérifiable ; incidents précédents conservés.')
    context = json.loads(subprocess.run(['node', 'scripts/build-monitoring-context.mjs'], check=True, capture_output=True, text=True, timeout=120).stdout)
    radar = None
    try:
        candidate = read_large_file(api, 'feed.json', 'radar-data')
        checked = timestamp(candidate.get('checkedAt'))
        age = (dt.datetime.now(dt.timezone.utc) - checked).total_seconds() if checked else -1
        if candidate.get('schemaVersion') == 1 and isinstance(candidate.get('errors'), list) and 0 <= age <= 18 * 3600:
            radar = candidate
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError, KeyError):
        print('Radar non lisible ; alertes précédentes conservées.')
    state['monitoring'] = evaluate_monitoring(state, context, REGISTRY, dt.datetime.now(dt.timezone.utc).isoformat(), radar)
    # Only trusted master collectors; reserve dispatches in the same durable status
    # document before calling Actions. Never run code from a triggering PR.
    now = dt.datetime.now(dt.timezone.utc)
    current_runs = {}
    for workflow, config in REGISTRY.items():
        if workflow in ('onboard-assets.yml', 'rehearse-refresh.yml', 'deploy-pages.yml') or config.get('publishes') is False:
            continue
        if recovery_reason(state.get('workflows', {}).get(workflow, {}), config, now):
            current_runs[workflow] = [run for run in api(f'/actions/workflows/{workflow}/runs?branch=master&per_page=100')['workflow_runs']
                                      if run.get('event') in ('schedule','push','workflow_dispatch','workflow_run')]
    state['recovery'], recovery_plans = plan_recovery(state, REGISTRY, now, current_runs)
    encoded = base64.b64encode((json.dumps(state,ensure_ascii=False,indent=2)+'\n').encode()).decode()
    payload = {'message': 'Update automation failure status', 'branch': BRANCH, 'content': encoded}
    if sha:
        payload['sha'] = sha
    persist_and_dispatch(api, PATH, payload, state, recovery_plans)
    # Persist incidents before notifying. Bot issue/comment receipts make retries idempotent.
    sync_monitoring_issue(state['monitoring'], api, repo)
    print(f'Statuts publiés : {len(state["workflows"])} automatisations')


if __name__ == '__main__':
    main()


