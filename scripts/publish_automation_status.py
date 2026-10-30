"""Publish only real automation failures independently of the application build."""
import argparse
import http.client
import datetime as dt
import base64
import json
import copy
import hashlib
import gzip
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

from automation_contracts import owns_failure, RETIREMENT_REASON
from automation_monitoring import evaluate_monitoring, sync_monitoring_issue, timestamp, restore_history
from github_automation_transport import request_json, unseen_completed_runs
from automation_history_coverage import recover_skipped_history_gaps
from automation_legacy_phases import CONTRACTS as LEGACY_PHASE_CONTRACTS, qualify_legacy_phases
from automation_status_storage import pack_report_scopes,encode_status,expand_report_archives,decode_status,reader_ready
from automation_monitor_self import observe_monitor_history
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

def _normalize_report(report):
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
                'errors': [{'id': 'listing:' + r['isin'], 'field': 'Cotation', 'error': r.get('reason', 'Collecte échouée'),
                            **({'lastSuccessAt':r['lastSuccessAt']}if 'lastSuccessAt'in r else{}),
                            **({'sourceUrls':[r['sourceUrl']]}if r.get('sourceUrl')else{})}
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
        rows = [row for row in report['managers'] if row.get('status') not in ('cached', 'unchanged', 'waiting', 'not-attempted')]
        return {'successes': [{'id': 'investor:' + row['slug']} for row in rows if row.get('status') == 'validated'],
                'errors': [{'id': 'investor:' + row['slug'], 'field': 'Portefeuille 13F', 'error': row.get('reason', 'Collecte échouée')}
                           for row in rows if row.get('status') != 'validated']}
    if any(key in report for key in ('funds', 'qualified', 'monthly', 'levels')):
        # Each sub-collector has its own key: a price recovery cannot clear a fund failure.
        combined = {'successes': [], 'errors': []}
        parts = []
        if 'funds' in report:
            parts.append(('funds', normalize_report(report['funds'])))
        for key, rows in [('qualified', report.get('qualified', [])),
                          ('monthly', report.get('monthly', {}).get('series', []))]:
            rows = [row for row in rows if row.get('status') not in ('cached', 'unchanged', 'waiting', 'not-attempted')]
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
                'inactive':[{'id':o['id'],'retirementStatus':o['status'],'reason':o.get('reason','Attente ou succession documentée ; aucune réparation déduite')} for o in report['observations'] if o['status'] in ('waiting', 'superseded')]}
    if 'indices' in report:
        successes, errors = [], []
        for item in report['indices']:
            if item.get('status') in ('cached', 'unchanged', 'waiting', 'not-attempted'):continue
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
            if item.get('status') in ('cached', 'unchanged', 'waiting', 'not-attempted'):continue
            id_ = 'etf-' + report.get('_collector', 'issuer') + '-' + item['isin']
            causes = ([item.get('reason', 'Collecte échouée')] if item.get('status') == 'failed' else [])
            causes += [e.get('reason', 'Champ non validé') for e in item.get('collectionErrors', [])]
            if causes:
                errors.append({'id': id_, 'name': 'ETF ' + item['isin'], 'field': ', '.join(sorted({e.get('field', 'Collecte') for e in item.get('collectionErrors', [])})) or 'Collecte ETF', 'error': ' ; '.join(causes)})
            else:
                successes.append({'id': id_})
        errors += [{'id': 'etf-' + report.get('_collector', 'issuer') + '-' + e['isin'], 'name': 'ETF ' + e['isin'], 'error': e['reason']} for e in report.get('failures', [])]
        return {'successes': successes, 'errors': errors}
    if any(key in report for key in ('successes', 'errors', 'inactive')):
        return report
    raise ValueError('Schéma de rapport inconnu ; aucune réussite déduite')


def normalize_report(report):
    if isinstance(report,dict) and 'resultContract' in report:
        from producer_report_contract import normalize_contract
        return normalize_contract(report['resultContract'])
    if not isinstance(report, dict):
        raise ValueError('Le rapport doit être un objet JSON')
    scope = report.get('scope')
    if isinstance(scope, dict) and ('expectedIds' in scope or 'requestedIds' in scope):
        expected = scope.get('expectedIds')
        requested = scope.get('requestedIds')
        for ids in (expected, requested):
            if not isinstance(ids, list) or any(not isinstance(v, str) or not v for v in ids) or len(set(ids)) != len(ids):
                raise ValueError('Identifiants de périmètre attendus/demandés invalides')
        report = {**report}
        shape = report_shape(report)
        if shape == 'series':
            observed = {r['id'] for r in report['series'] + list(report.get('fxSources', {}).values())}
            report['attemptedIds'] = expected
        elif shape == 'listings':
            observed = set(report['validated']) | {r['isin'] for r in report['failed']}
            report['validated'] = [v for v in report['validated'] if v in expected]
            report['failed'] = [r for r in report['failed'] if r['isin'] in expected]
        elif shape == 'statuses':
            outcomes = report.get('outcomes', [])
            if not isinstance(outcomes, list) or any(not isinstance(r, dict) or not isinstance(r.get('id'), str)
                    or r.get('status') not in ('succeeded','unchanged-verified','failed','not-attempted','cached','unchanged','waiting') for r in outcomes):
                raise ValueError('Résultats individuels du périmètre invalides')
            observed = {r['id'] for k in ('successes','errors','inactive') for r in report.get(k, [])} | {r['id'] for r in outcomes}
            skipped = {r['id'] for r in outcomes if r['status'] in ('not-attempted','cached','unchanged','waiting')}
            successful = {r['id'] for r in report.get('successes', [])}
            failed = {r['id'] for r in report.get('errors', [])}
            for row in outcomes:
                if row['id'] not in expected:continue
                if (row['status'] in ('succeeded','unchanged-verified') and (row['id'] not in successful or row['id'] in failed)
                        or row['status'] == 'failed' and (row['id'] not in failed or row['id'] in successful)):
                    raise ValueError('Résultat individuel contradictoire : ' + row['id'])
            report['attemptedIds'] = [v for v in expected if v not in skipped]
        else:
            raise ValueError('Périmètre explicite non qualifié pour ce format : ' + shape)
        if set(expected) - observed:raise ValueError('Résultats attendus absents : ' + ', '.join(sorted(set(expected)-observed)))
    for key, allowed in [('shares', {None, 'validated', 'failed'}), ('indices', {None, 'validated', 'failed'}),
                         ('managers', {'validated', 'failed'}), ('observations', {'success', 'failure', 'waiting', 'superseded'})]:
        if isinstance(report.get(key), list) and any(not isinstance(r, dict) or r.get('status') not in allowed | {'cached', 'unchanged', 'waiting', 'not-attempted'} for r in report[key]):
            raise ValueError('Statut de résultat inconnu : ' + key)
    result = _normalize_report(report)
    for kind in ('successes', 'errors', 'inactive'):
        rows = result.get(kind, [])
        if not isinstance(rows, list):
            raise ValueError('Liste de résultats invalide : ' + kind)
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get('id'), str) or not row['id']:
                raise ValueError('Identité de résultat absente : ' + kind)
            if kind == 'errors' and not isinstance(row.get('error'), str):
                raise ValueError('Cause de panne absente')
    if report_shape(report) == 'statuses' and 'attemptedIds' in report:
        attempted = report['attemptedIds']
        if not isinstance(attempted, list) or any(not isinstance(v, str) or not v for v in attempted) or len(set(attempted)) != len(attempted):
            raise ValueError('Périmètre tenté invalide')
        observed = {r['id'] for kind in ('successes','errors','inactive') for r in result.get(kind, [])}
        missing = set(attempted) - observed
        if missing:
            raise ValueError('Résultats tentés absents : ' + ', '.join(sorted(missing)))
        result = {**result, **{kind:[r for r in result.get(kind, []) if r['id'] in attempted] for kind in ('successes','errors','inactive')}}
    if isinstance(report.get('series'), list):
        attempted = report.get('attemptedIds')
        rows = report['series'] + list(report.get('fxSources', {}).values())
        if attempted is not None:
            missing = set(attempted) - {r['id'] for r in rows}
            if missing:
                raise ValueError('Résultats tentés absents : ' + ', '.join(sorted(missing)))
        relevant = [r for r in rows if attempted is None or r['id'] in attempted]
        if any(r.get('status') not in ('validated', 'failed', 'cached', 'unchanged', 'waiting', 'not-attempted') for r in relevant):
            raise ValueError('Statut de résultat inconnu')
    return {k:v for k,v in result.items() if k not in ('scope','attemptedIds','outcomes')}


def report_shape(report):
    """Versioned producer adapters; a known JSON shape from another producer is not proof."""
    if isinstance(report.get('series'), list): return 'series'
    if isinstance(report.get('validated'), list) and isinstance(report.get('failed'), list): return 'listings'
    if isinstance(report.get('companies'), dict): return 'companies'
    if report.get('_collector') == 'dca-equities': return 'dca-equities'
    if (report.get('_collector')=='dca-complete-holdings' and isinstance(report.get('observations'),dict)
            and isinstance(report.get('successes'),list) and isinstance(report.get('errors'),list)):
        return 'statuses'  # Bounded holding receipts are not broker/reference observations.
    if isinstance(report.get('managers'), list): return 'investors'
    if any(k in report for k in ('funds', 'qualified', 'monthly', 'levels')): return 'combined'
    if isinstance(report.get('records'), list): return 'holdings'
    if report.get('_collector') == 'feed': return 'radar'
    if report.get('seriesId') == '011814631': return 'inflation'
    if isinstance(report.get('sources'), dict): return 'practical'
    if isinstance(report.get('observations'), dict): return 'references'
    if 'observations' in report and 'indices' not in report and 'shares' not in report: return 'observations'
    if 'indices' in report: return 'indices'
    if 'shares' in report: return 'shares'
    if any(k in report for k in ('successes', 'errors', 'inactive')): return 'statuses'
    if report.get('symbol')=='BTC-USD' and isinstance(report.get('points'),list): return 'bitcoin'
    return 'unknown'


def include_configured_workflows(state):
    """An automation with no observed run is visible, never reported as successful."""
    result = copy.deepcopy(state)
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


def report_files(directory, workflow=None):
    """Collector reports inside a downloaded artifact.

    upload-artifact roots a multi-path artifact at the paths' common ancestor: a report
    written to $RUNNER_TEMP next to repository snapshots lands under `_temp/`, not at the
    root. Snapshots of src/data are evidence, never reports, and stay unread.
    """
    root = pathlib.Path(directory)
    paths = sorted(root.glob('*.json')) + sorted(root.glob('_temp/**/*.json'))
    for folder in REPORT_CONTRACTS.get(workflow, {}).get('reportDirectories', []):
        paths.extend(sorted(root.glob(folder+'/**/*.json')))
    return paths


def read_report(path, workflow, planned=None):
    # Issuer observations retain raw official components and full holdings.
    # Give that existing artifact a bounded larger envelope, then immediately
    # discard the payload by projecting only failure/recovery observations.
    limit = 128_000_000 if workflow == 'collect-etf-pilot.yml' else 8_000_000
    size = path.stat().st_size
    if size > limit:
        raise ValueError(f'Rapport de collecte trop volumineux : {path.name} ({size} > {limit})')
    report = json.loads(path.read_text())
    if not isinstance(report, dict):
        raise ValueError('Le rapport doit être un objet JSON')
    plan_verified=False
    if planned is not None:
        from producer_report_contract import validate_contract,finish
        validate_contract(planned['resultContract'])
        plan=planned['resultContract']['inputPlan']
        if plan['reportStem']!=path.stem:raise ValueError('Plan belongs to another report')
        if report.get('resultContract'):
            validate_contract(report['resultContract'])
            if report['resultContract']['scope']['planSha256']!=plan['sha256']:
                raise ValueError('Result scope differs from the independently recorded input plan')
        # Recover only from a real, same-artifact declaration made before this
        # invocation. Legacy artifacts without one are never given a scope.
        report=finish(report,plan,completed=report.get('producerStarted')!='producer-results-v1')
        plan_verified=True
    report['_collector'] = path.stem
    spec = next((r for r in REPORT_CONTRACTS.get(workflow, {}).get('reports', []) if r['name'] == path.name), None)
    version = report.get('schemaVersion')
    if not any(type(version) is type(v) and version == v for v in (spec.get('versions', [None, 1]) if spec else [None, 1])) and not (report.get('producerStarted')=='producer-results-v1' and report.get('resultContract',{}).get('protocol')=='producer-results-v1'):
        raise ValueError('Version de rapport non qualifiée : ' + str(report.get('schemaVersion')))
    shape = report_shape(report)
    individual = report.get('resultContract')
    if individual is not None:
        from producer_report_contract import normalize_contract, VERSION
        if not isinstance(individual,dict) or individual.get('protocol')!=VERSION:
            raise ValueError('Contrat individuel de producteur inconnu')
    if spec and spec.get('schemas') and shape not in spec['schemas'] and not (individual and report.get('producerStarted')==VERSION):
        raise ValueError('Format incompatible avec le producteur : ' + shape)
    result = normalize_contract(individual) if individual else normalize_report(report)
    if shape == 'series':
        records_by_id = {r['id']:r for r in report['series'] + list(report.get('fxSources', {}).values())}
        for success in result.get('successes', []):
            record = records_by_id.get(success['id'].removeprefix('history:'), {})
            if record.get('checkedAt'):
                success['checkedAt'] = record['checkedAt']
    if shape == 'references':
        records = report['observations'].get('sources', report['observations'].get('brokers', {}))
        for success in result.get('successes', []):
            record = records.get(success['id'].split(':', 1)[-1], {})
            if record.get('checkedAt'):
                success['checkedAt'] = record['checkedAt']
    if shape == 'practical':
        for success in result.get('successes',[]):
            record=report['sources'].get(success['id'].removeprefix('practical:'),{})
            if record.get('lastSuccessfulCheckAt'):success['checkedAt']=record['lastSuccessfulCheckAt']
    outcomes = {r['id']:r for r in (individual or report).get('outcomes', [])}
    for kind in ('successes', 'errors'):
        for row in result.get(kind, []):
            identifier = row['id']
            record = outcomes.get(identifier, outcomes.get(identifier.removeprefix('listing:').removeprefix('history:'), {}))
            for key in ('checkedAt','asOf','attemptedAt','lastSuccessAt','responseSha256'):
                if key in record:row[key] = record[key]
            if record.get('sourceUrl'):row['sourceUrls'] = [record['sourceUrl']]
            if kind == 'successes' and record.get('status') in ('succeeded','unchanged-verified') and record.get('checkedAt') and record.get('sourceAttempted') is not False and record.get('phase') not in ('qualification','validation') and not(row.get('sourceAttempted')is False and row.get('phase')in('qualification','validation')):
                row['verifiedInAttempt'] = True
    for checked_at in [report.get('checkedAt'), *(r.get('checkedAt') for r in result.get('successes', []))]:
        if checked_at is not None and (not timestamp(checked_at) or timestamp(checked_at) > dt.datetime.now(dt.timezone.utc)):
            raise ValueError('Date de contrôle du rapport invalide ou future')
    scope_report = individual or report
    scope_explicit = 'attemptedIds' in scope_report or isinstance(scope_report.get('scope'),dict) and 'expectedIds' in scope_report['scope']
    result['_reportEvidence'] = {'scopeExplicit': scope_explicit, 'scopePlanVerified':plan_verified, 'scope':scope_report.get('scope'), 'producerContract':individual.get('protocol') if individual else None, 'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                                 'reportedAt': report.get('checkedAt'), 'schema': shape}
    if individual and individual.get('inputPlan',{}).get('durablePlan') and not plan_verified:
        result['_scopeWarning']='Le manifeste amont indépendant est absent ou non rapproché ; la complétude courante reste à qualifier.'
    if not scope_explicit:
        result['_scopeWarning'] = 'Le rapport ne déclare pas les identifiants attendus dans le périmètre tenté. Les résultats individuels présents sont conservés ; sa complétude ne peut pas être certifiée.'
    return result


def read_report_safely(path, workflow, planned=None):
    """An unusable artifact is an incident, not a reason to lose every other result."""
    try:
        result = read_report(path, workflow, planned)
        result.setdefault('successes', []).append({'id': 'report-read:' + path.stem, 'evidence':result.get('_reportEvidence')})
        return result
    except (ValueError, OSError, TypeError, KeyError, AttributeError) as error:
        return {'successes': [], 'errors': [{'id': 'report-read:' + path.stem,
                'field': 'Rapport de collecte', 'error': str(error)}]}


REPORT_CONTRACTS = json.loads(pathlib.Path(__file__).with_name('automation-report-contracts.json').read_text())['workflows']


def report_error(identifier, cause):
    return {'successes': [], 'errors': [{'id': identifier, 'field': 'Preuve de collecte', 'error': cause}]}


def normalize_attempt_report(raw,run):
    report=normalize_report(raw)
    scope=((report.get('_reportEvidence')or{}).get('scope')or{})
    if (scope.get('runId') is not None and str(scope['runId'])!=str(run['id'])
            or scope.get('attempt') is not None and str(scope['attempt'])!=str(run.get('run_attempt',1))):
        return report_error('report-contract:attempt','Le manifeste amont ne correspond pas à cette exécution/tentative ; aucun contrôle source individuel déduit.')
    return report


def technical_proof(identifier):
    return identifier.startswith(('report-read:', 'artifact-read:', 'report-contract:', 'report-result:'))


def bind_attempt(identifier, run):
    return identifier + f':run:{run["id"]}:attempt:{run.get("run_attempt", 1)}' if technical_proof(identifier) and ':run:' not in identifier else identifier


def attempt_artifacts(artifacts, run):
    """A new rerun's archive does not restore the missing proof of an old attempt."""
    start, end = timestamp(run.get('run_started_at')), timestamp(run.get('updated_at'))
    if run.get('status') != 'completed':end = dt.datetime.now(dt.timezone.utc)
    if not start or not end:
        return []
    return [a for a in artifacts if (created := timestamp(a.get('created_at'))) and start <= created <= end]


def evidence_scope(state, evidence):
    return evidence.get('scope') or state.get('reportScopes',{}).get(evidence.get('scopeRef'),{})


def refresh_scope_proofs(state, run, reports):
    """Reinterpret real frozen manifests, without renewing any source or job date."""
    row=state['workflows'][run['path'].split('/')[-1]]
    for report in reports:
        evidence=report.get('_reportEvidence') or {}
        if not evidence.get('scopePlanVerified') or report.get('_scopeWarning'):continue
        history=row.setdefault('reportEvidenceHistory',[])
        matching=[r for r in history if r.get('runId')==run['id'] and r.get('attempt')==run.get('run_attempt',1)
                  and r.get('file')==evidence['file'] and r.get('sha256')==evidence['sha256']]
        if not matching:continue
        receipt=matching[-1]
        if not receipt.get('scopePlanVerified'):
            # Same source bytes; this is a new interpretation, not a new check.
            receipt['scopeReadHistory']=receipt.get('scopeReadHistory',[])+[{
                'scopePlanVerified':receipt.get('scopePlanVerified',False),
                'scopeWarning':row.get('reportQualifications',{}).get(evidence['file'],{}).get('cause')}]
            receipt.update(evidence,scopeVerifiedAt=dt.datetime.now(dt.timezone.utc).isoformat())
        warning=row.get('reportQualifications',{}).get(evidence['file'])
        latest_scope_run=max([row.get('runId',0),*[r.get('runId',0)for r in history if r.get('file')==evidence['file']]])
        full_current=(run['id']>=latest_scope_run and evidence.get('scope',{}).get('mode')=='full'
                      and evidence.get('scope',{}).get('expectedIds'))
        if warning and (warning.get('evidence',{}).get('sha256')==evidence['sha256'] or full_current):
            row.setdefault('reportQualificationHistory',[]).append({**warning,'file':evidence['file'],
                'historicalLimitationPreserved':True,'currentScopeQualifiedBy':run['html_url'],
                'qualificationKind':'independent-plan-reread','scopeVerifiedAt':receipt.get('scopeVerifiedAt',dt.datetime.now(dt.timezone.utc).isoformat())})
            row['reportQualifications'].pop(evidence['file'])
    return state


def validation_receipt(success, run, evidence, source_checks, previous):
    """Keep derived calculations separate, retaining misclassified old receipts."""
    result={**success,'runUrl':run['html_url'],'recordedAt':run['updated_at'],'evidence':evidence}
    history=copy.deepcopy(previous.get('sourceControlsRequalified',[]))
    derived=(run['path'].split('/')[-1]=='update-qualified-exposures.yml'
             and success.get('scope')=='equity-lookthrough'
             and success['id']=='dca-holdings:'+str(success.get('instrument','')))
    if derived and success['id']in source_checks:
        old=source_checks.pop(success['id'])
        entry={'originalSourceControl':copy.deepcopy(old),
               'reason':'Derived look-through receipt, not a consultation of the issuer document; original clocks retained as historical evidence.'}
        if entry not in history:history.append(entry)
    if history:result['sourceControlsRequalified']=history
    return result


def merge_proof_retry(state, run, reports):
    """Repair an immutable old proof without rolling back the current workflow snapshot."""
    result = copy.deepcopy(state)
    workflow = run['path'].split('/')[-1]
    row = result['workflows'][workflow]
    refresh_scope_proofs(result,run,reports)
    failures = row.setdefault('proofFailures', {})
    checks = row.setdefault('proofChecks', {})
    for raw in reports:
        report = normalize_attempt_report(raw,run)
        evidence = report.get('_reportEvidence')
        for success in report.get('successes', []):
            if success.get('sourceAttempted') is False and success.get('phase') in ('validation','qualification'):
                local_checks=row.setdefault('validationChecks',{})
                if timestamp(local_checks.get(success['id'],{}).get('recordedAt')) and timestamp(local_checks[success['id']]['recordedAt'])>timestamp(run['updated_at']):continue
                local_checks[success['id']]=validation_receipt(success,run,evidence,row.setdefault('sourceChecks',{}),local_checks.get(success['id'],{}))
                continue  # Local replay never repairs a collection or publication failure.
            identifier = bind_attempt(success['id'], run)
            if technical_proof(identifier):
                failures.pop(identifier, None)
                # Old unscoped proof IDs are recoverable only from their own run.
                for key in list(failures):
                    if ':run:' not in key and identifier.startswith(key+':run:') and failures[key].get('runUrl') == run['html_url']:
                        failures.pop(key)
                        checks[key] = {'runUrl':run['html_url'], 'evidence':evidence, 'readAt':dt.datetime.now(dt.timezone.utc).isoformat()}
                checks[identifier] = {'runUrl':run['html_url'], 'evidence':evidence, 'readAt':dt.datetime.now(dt.timezone.utc).isoformat()}
            else:
                failure=row.get('dataFailures',{}).get(identifier,{})
                failed_at=timestamp(failure.get('sourcePhaseCompletedAt') or failure.get('completedAt'))
                if failure and (evidence or{}).get('schema')=='shares':
                    failure['unverifiedRecovery']=True;failure['unverifiedReason']='Le rapport composite ne prouve pas le contrôle ciblé de la branche initialement en échec.';failure['recoveryEvidence']=evidence
                    continue
                checked=timestamp(success.get('checkedAt') or (evidence or {}).get('reportedAt'))
                start=timestamp((evidence or {}).get('sourcePhaseStartedAt'))
                previous=row.get('sourceChecks',{}).get(identifier,{})
                previous_at=timestamp(previous.get('recordedAt'))
                end=timestamp((evidence or {}).get('sourcePhaseCompletedAt') or run['updated_at'])
                if previous_at and end and end<previous_at:continue
                if failed_at and not (checked and checked>failed_at or success.get('verifiedInAttempt') and start and start>failed_at):continue
                row.setdefault('dataFailures',{}).pop(identifier,None)
                row.setdefault('sourceChecks',{})[identifier]={'checkedAt':success.get('checkedAt')or(evidence or{}).get('reportedAt'),
                    'recordedAt':(evidence or{}).get('sourcePhaseCompletedAt')or run['updated_at'],
                    'runUrl':run['html_url'],'evidence':evidence,'verifiedInAttempt':bool(success.get('verifiedInAttempt')),
                    **{k:success[k]for k in ('asOf','responseSha256')if k in success}}
        for error in report.get('errors', []):
            identifier = bind_attempt(error['id'], run)
            if technical_proof(identifier):
                failures[identifier] = {'name':WORKFLOWS[workflow], 'cause':error['error'], 'runId':run['id'], 'attempt':run.get('run_attempt',1), 'runUrl':run['html_url'], 'completedAt':run['updated_at']}
            else:
                # A late discovery must not overwrite newer, qualified field evidence.
                source = row.get('sourceChecks', {}).get(identifier, {})
                observed = timestamp(source.get('recordedAt') if source.get('verifiedInAttempt') else source.get('checkedAt') or source.get('recordedAt'))
                old_failure = row.setdefault('dataFailures', {}).get(identifier, {})
                error_bound=timestamp((evidence or{}).get('sourcePhaseCompletedAt')or run['updated_at'])
                if observed and observed > error_bound:continue
                old_bound=timestamp(old_failure.get('sourcePhaseCompletedAt') or old_failure.get('completedAt'))
                if old_bound and old_bound > error_bound:continue
                row['dataFailures'][identifier] = {'name':error.get('name',identifier), 'cause':error['error'], 'field':error.get('field'),
                    'runUrl':run['html_url'], 'completedAt':(evidence or{}).get('sourcePhaseCompletedAt')or run['updated_at'],
                    'sourcePhaseCompletedAt':(evidence or{}).get('sourcePhaseCompletedAt'),'evidence':evidence,
                    **{k:error[k]for k in ('sourceUrls','asOf','lastSuccessAt','attemptedAt','phase','kind','sourceAttempted')if k in error},'historicalDiscovery':True}
        if evidence:
            history = row.setdefault('reportEvidenceHistory', [])
            if not any(r.get('runId') == run['id'] and r.get('attempt') == run.get('run_attempt',1) and r.get('file') == evidence['file'] for r in history):
                history.append({**evidence,'runId':run['id'],'attempt':run.get('run_attempt',1),'runUrl':run['html_url'],
                    'readAt':dt.datetime.now(dt.timezone.utc).isoformat(),'successes':report.get('successes',[]),'errors':report.get('errors',[])})
            if report.get('_scopeWarning'):
                warning={'cause':report['_scopeWarning'],'runUrl':run['html_url'],'evidence':evidence,'attemptedAt':evidence.get('reportedAt')}
                newer_full=[r for r in history if r.get('file')==evidence['file'] and r.get('scopePlanVerified') and evidence_scope(state,r).get('mode')=='full' and evidence_scope(state,r).get('expectedIds') and r.get('runId',0)>run['id']]
                if newer_full:
                    archive=row.setdefault('reportQualificationHistory',[])
                    if not any(r.get('evidence',{}).get('sha256')==evidence['sha256']for r in archive):
                        archive.append({**warning,'file':evidence['file'],'historicalLimitationPreserved':True,'currentScopeQualifiedBy':max(newer_full,key=lambda r:r['runId']).get('runUrl')})
                else:row.setdefault('reportQualifications',{})[evidence['file']]=warning
    return refresh_scope_proofs(result,run,reports)


def artifact_reports(repo, workflow, jobs, artifacts, directory, download=download_status_artifact):
    """The contract is conditional on executed steps, never on unattempted fields."""
    contract = REPORT_CONTRACTS[workflow]
    steps = [s for j in jobs for s in (j.get('steps') or [])]
    if contract.get('activationSteps') and any(j.get('name')==REGISTRY[workflow]['collectionJob']for j in jobs) and not any(s.get('name')in contract['activationSteps']for s in steps) and (contract.get('requiresActivationMarker') or not any(a.get('name')==contract['artifact']for a in artifacts)):
        return [{'successes':[],'errors':[],'_legacyReportCoverage':'Cette ancienne version du producteur ne déclarait pas encore cet artefact ; aucun succès source individuel déduit.'}]
    attempted = {s['name'] for s in steps if s.get('conclusion') in ('success', 'failure', 'timed_out')}
    required = [r for r in contract['reports'] if attempted.intersection(r['steps'])]
    expected = bool(required) or any(j.get('name') == REGISTRY[workflow]['collectionJob'] and j.get('conclusion') == 'success' for j in jobs)
    available = [a for a in artifacts if a.get('name') == contract['artifact'] and not a.get('expired')]
    key = 'artifact-read:' + contract['artifact']
    if not available:
        return [report_error(key, 'Artefact attendu absent ou expiré ; aucune résolution déduite')] if expected else []
    try:
        download(repo, artifacts, contract['artifact'], directory)
        paths = report_files(directory, workflow)
        names = {r['name'] for r in contract['reports']}
        reports = []
        sidecars={p.name.removesuffix('.contract-plan.json')+'.json':p for p in paths if p.name.endswith('.contract-plan.json')}
        def plan_report(spec):
            sidecar=sidecars.get(spec['name'])
            if not sidecar:return None
            try:
                raw_plan=json.loads(sidecar.read_text())
                if raw_plan['resultContract']['inputPlan']['reportStem']!=pathlib.Path(spec['name']).stem:
                    return report_error('report-read:'+pathlib.Path(spec['name']).stem+':plan','Le manifeste amont appartient à un autre rapport')
            except (ValueError,KeyError,OSError,TypeError):
                return report_error('report-read:'+pathlib.Path(spec['name']).stem+':plan','Manifeste amont illisible')
            result=read_report_safely(sidecar,workflow)
            if result.get('_reportEvidence'):
                result['_reportEvidence'].update(file=spec['name'],planFile=sidecar.name,nativeReportMissing=True,scopePlanVerified=True)
                result.pop('_scopeWarning',None)
            return result
        for spec in required:
            if not any(p.name == spec['name'] for p in paths):
                reports.append(report_error('report-read:' + pathlib.Path(spec['name']).stem, 'Rapport attendu absent : ' + spec['name']))
                recovery=plan_report(spec)
                if recovery:reports.append(recovery)
        for path in paths:
            if 'cross-fx-evidence' in path.parts:
                continue  # Raw transport evidence, explicitly not a collector report.
            if path.name.endswith('.contract-plan.json') and path.name.removesuffix('.contract-plan.json')+'.json' in names:
                continue
            if path.name in contract.get('supportFiles',[]):
                continue  # Explicitly declared inputs/snapshots, never observation reports.
            if path.name not in names:
                reports.append(report_error('report-read:' + path.stem, 'Rapport hors contrat : ' + path.name))
                continue
            planned=None
            if path.name in sidecars:
                try:planned=json.loads(sidecars[path.name].read_text())
                except (ValueError,OSError):pass  # Native reader still reports its own error; no scope fabricated.
            reports.append(read_report_safely(path, workflow,planned))
            if not reports[-1].get('_reportEvidence') and planned is not None:
                recovery=plan_report({'name':path.name})
                if recovery:reports.append(recovery)
            if reports[-1].get('_reportEvidence'):
                reports[-1]['_reportEvidence']['artifactId'] = max(a.get('id', 0) for a in available)
                source_jobs=[j for j in jobs if j['name']==REGISTRY[workflow]['collectionJob']or j['name'].startswith(REGISTRY[workflow]['collectionJob']+' (')]
                for field,job_field,select in [('sourcePhaseStartedAt','started_at',min),('sourcePhaseCompletedAt','completed_at',max)]:
                    dates=[j[job_field]for j in source_jobs if timestamp(j.get(job_field))]
                    if dates:reports[-1]['_reportEvidence'][field]=select(dates,key=timestamp)
        if not paths:
            return [report_error(key, 'Artefact vide : aucun rapport lisible')]
        reports.append({'successes': [{'id': key,'evidence':{'artifactId':max(a.get('id',0)for a in available),'files':[r['_reportEvidence']for r in reports if r.get('_reportEvidence')]}}], 'errors': []})
        return reports
    except (subprocess.SubprocessError, OSError, ValueError, TypeError, KeyError, zipfile.BadZipFile) as error:
        return [report_error(key, 'Artefact illisible : ' + type(error).__name__ + ': ' + str(error)[:300])]


PROOF_READER_VERSION = 2


def observe_running_workflows(state, registry, api, repo, now, read_reports):
    """Observe source-phase failures while a parent waits for validation/publication.

    No completed workflow or source timestamp is invented. API/read failures retain
    the previous observations; terminal runs are handed back to the ordinary reducer.
    """
    result=copy.deepcopy(state);current=timestamp(now)
    last=timestamp(result.get('inFlightCheckedAt'))
    if last and 0<=(current-last).total_seconds()<300:return result,[]
    previous=result.get('inFlightRuns',{});active={};terminals=[];complete=True
    for status in ('queued','in_progress','waiting','pending','requested'):
        key='inflight-list:'+status
        try:
            page=1
            while True:
                batch=api(f'/actions/runs?branch=master&status={status}&per_page=100&page={page}')['workflow_runs']
                if not isinstance(batch,list)or any(not isinstance(r,dict)or not isinstance(r.get('id'),int)or not isinstance(r.get('path'),str)for r in batch):raise ValueError('Format des exécutions en cours invalide')
                for run in batch:
                    workflow=run['path'].split('/')[-1]
                    if (workflow not in registry or run.get('head_branch')!='master'
                            or run.get('event')not in('schedule','push','workflow_dispatch','workflow_run')
                            or run.get('head_repository',{}).get('full_name',repo)!=repo):continue
                    active[f'{run["id"]}:{run.get("run_attempt",1)}']={'workflow':workflow,'run':run}
                if len(batch)<100:break
                page+=1
            result.setdefault('observerErrors',{}).pop(key,None)
        except (urllib.error.URLError,OSError,http.client.IncompleteRead,ValueError,KeyError,TypeError,AttributeError)as error:
            complete=False
            result.setdefault('observerErrors',{})[key]={'cause':'Exécutions intermédiaires non observables : '+str(error)[:250]}
    for key,old in previous.items():
        if key in active:continue
        if not complete:active[key]=old;continue
        try:
            r=old['run'];run=api(f'/actions/runs/{r["id"]}/attempts/{r.get("run_attempt",1)}')
            if run.get('status')=='completed':
                terminals.append({**run,'_inflightTerminal':True})
                result.setdefault('observerErrors',{}).pop('inflight:'+key,None)
            else:active[key]={'workflow':old['workflow'],'run':run}
        except (urllib.error.URLError,OSError,http.client.IncompleteRead,ValueError,KeyError,TypeError,AttributeError)as error:
            active[key]=old
            result.setdefault('observerErrors',{})['inflight:'+key]={'cause':'Fin d’exécution non vérifiable : '+str(error)[:250]}
    for key,entry in list(active.items()):
        workflow=entry['workflow'];run=entry['run'];old=previous.get(key,{})
        try:
            jobs=[];page=1
            while True:
                batch=api(f'/actions/runs/{run["id"]}/attempts/{run.get("run_attempt",1)}/jobs?per_page=100&page={page}')['jobs']
                jobs.extend(batch)
                if len(batch)<100:break
                page+=1
            failures=[{'job':j['name'],'step':s['name']}for j in jobs if j.get('conclusion')in('failure','timed_out')for s in j.get('steps',[])if s.get('conclusion')in('failure','timed_out')]
            phase_jobs=[j for j in jobs if j['name']==registry[workflow]['collectionJob']or j['name'].startswith(registry[workflow]['collectionJob']+' (')]
            source_done=bool(phase_jobs)and all(j.get('conclusion')in('success','failure','timed_out')for j in phase_jobs)
            reports=old.get('reports',[]);proof_read=False
            if source_done and (not old.get('sourceProofCaptured') or old.get('proofReadFailed') or old.get('proofReaderVersion')!=PROOF_READER_VERSION):
                reports=read_reports(run,jobs)if registry[workflow].get('artifact') else[]
                proof_read=True
                if reports:result=merge_proof_retry(result,run,reports)
            proof_failed=any(technical_proof(e['id'])for r in reports for e in r.get('errors',[]))
            ends=[j['completed_at']for j in jobs if timestamp(j.get('completed_at'))]
            active[key]={'workflow':workflow,'run':run,'checkedAt':now,'sourceProofCaptured':source_done,
                         'proofReadFailed':proof_failed,'proofReaderVersion':PROOF_READER_VERSION if proof_read else old.get('proofReaderVersion'),'reports':reports,'failures':failures,
                         'phaseCompletedAt':max(ends,key=timestamp)if ends else None}
            result.setdefault('observerErrors',{}).pop('inflight:'+key,None)
        except (urllib.error.URLError,OSError,http.client.IncompleteRead,ValueError,KeyError,TypeError,AttributeError,subprocess.SubprocessError)as error:
            active[key]={**old,**entry}
            result.setdefault('observerErrors',{})['inflight:'+key]={'cause':'Lecture intermédiaire impossible : '+str(error)[:250],'runUrl':run.get('html_url')}
    result['inFlightRuns']=active;result['inFlightCheckedAt']=now
    return result,terminals


def publication_summary(run, jobs):
    deploy_jobs = [job for job in jobs if job['name'].startswith('deploy /') or job['name'] == 'deploy']
    published = []
    verification_failed = False
    unverified = False
    for job in deploy_jobs:
        steps = (job.get('steps') or [])
        deployments = [step for step in steps if 'actions/deploy-pages@' in step.get('name', '') and step.get('conclusion') == 'success']
        checks = [step for step in steps if step.get('name') in ('Verify actual public data', 'Verify the actual public data artifact', 'Verify the actual fallback data artifact')]
        if deployments and not checks:
            unverified = True
            continue
        # Legacy runs without this step retain their original evidence; a modern
        # deployment is never certified before the actual public-byte check.
        if deployments and checks and not all(step.get('conclusion') == 'success' for step in checks):
            verification_failed = True
            continue
        if deployments:
            last = checks[-1] if checks else deployments[-1]
            published.append(last.get('completed_at') or job.get('completed_at') or run['updated_at'])
    status = 'success' if published else 'failure' if verification_failed or any(job.get('conclusion') in ('failure', 'timed_out') for job in deploy_jobs) else 'unverified' if unverified else 'not-run'
    return status, max(published, default=None)


def repair_publication_history(state, history):
    """Backfill verified publication dates, including already-recorded runs.

    Do not replay data failures or change collection dates. A legacy timestamp
    is cleared only when its exact job is proven to have skipped publication.
    """
    result = copy.deepcopy(state)
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
    result = copy.deepcopy(state)
    workflow = run['path'].split('/')[-1]
    if workflow not in WORKFLOWS or run.get('head_branch') != 'master' or run.get('event') not in ('push', 'schedule', 'workflow_dispatch', 'workflow_run') or run.get('status') != 'completed':
        return result
    entries = result.get('workflows', {})
    previous = entries.get(workflow, {})
    # Run IDs follow creation order. An older queued snapshot finishing later must
    # never replace a recovery collected by a newer run (nor on a later retry).
    stamp = (run['id'], run.get('run_attempt', 1))
    old_stamp = (previous.get('runId', 0), previous.get('attempt', 1))
    normalized = []
    for raw in reports or []:
        try:
            normalized.append(normalize_attempt_report(raw,run))
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            normalized.append(report_error('report-read:unidentified', 'Contrat invalide : ' + str(error)))
    for report in normalized:
        for kind in ('successes', 'errors'):
            report[kind] = [{**r, 'id': bind_attempt(r['id'], run)} for r in report.get(kind, [])]
    reports = normalized
    inactive = {row['id'] for report in reports or [] for row in normalize_report(report).get('inactive', [])}
    retires_legacy_alert = bool(inactive & previous.get('dataFailures', {}).keys())
    if stamp == old_stamp and previous.get('monitorVersion', 1) >= 3 and not retires_legacy_alert:
        return merge_proof_retry(result,run,reports)
    if stamp < old_stamp or run['conclusion'] in ('cancelled', 'skipped', 'neutral'):
        return result
    failed = run['conclusion'] in ('failure', 'timed_out', 'startup_failure', 'action_required')
    data_failures = previous.get('dataFailures', {}).copy()
    proof_failures = previous.get('proofFailures', {}).copy()
    proof_checks = previous.get('proofChecks', {}).copy()
    result_history = previous.get('reportResultHistory', []).copy()
    for identifier in list(data_failures):
        if technical_proof(identifier):proof_failures[identifier] = data_failures.pop(identifier)
    retired_failures=previous.get('retiredDataFailures',{}).copy()
    qualifications = previous.get('reportQualifications', {}).copy()
    qualification_history = previous.get('reportQualificationHistory', []).copy()
    validation_checks = previous.get('validationChecks', {}).copy()
    source_checks = previous.get('sourceChecks', {}).copy()
    evidence_history = previous.get('reportEvidenceHistory', []).copy()
    for raw_report in reports or []:
        report = normalize_report(raw_report)
        evidence = report.get('_reportEvidence')
        if evidence:
            key = evidence['file']
            if report.get('_scopeWarning'):
                qualifications[key] = {'cause': report['_scopeWarning'], 'runUrl': run['html_url'], 'attemptedAt': evidence.get('reportedAt'), 'evidence': evidence}
            elif (evidence.get('producerContract') == 'producer-results-v1'
                  and evidence.get('scopePlanVerified')
                  and (evidence.get('scope') or {}).get('mode') == 'full'
                  and (evidence.get('scope') or {}).get('requestedIds')
                  and key in qualifications):
                qualification_history.append({**qualifications.pop(key), 'file':key,
                    'historicalLimitationPreserved':True, 'currentScopeQualifiedBy':run['html_url']})
            elif qualifications.get(key, {}).get('evidence', {}).get('sha256') == evidence.get('sha256'):
                # A new targeted/empty scope cannot qualify an older unscoped
                # report. Only re-reading that exact proof with a now-supported
                # explicit contract can clear its historical qualification gap.
                qualifications.pop(key, None)
            receipt = {**evidence, 'runId': run['id'], 'attempt': run.get('run_attempt', 1),
                       'recordedAt': run['updated_at'], 'runUrl': run['html_url'],
                       'successes': report.get('successes', []), 'errors': report.get('errors', [])}
            if not any(r.get('runId') == receipt['runId'] and r.get('attempt') == receipt['attempt'] and r.get('file') == key for r in evidence_history):
                evidence_history.append(receipt)
        # An explicit status repairs reporting only. Cache/deferred/source failure
        # cannot clear the corresponding financial failure. Unselected identities
        # are absent from reportedResults, so targeted retries retain other gaps.
        if evidence and evidence.get('scopePlanVerified'):
            for identifier in report.get('reportedResults', []):
                for key in list(proof_failures):
                    if key == identifier or key.startswith(identifier+':run:'):
                        result_history.append({**proof_failures.pop(key), 'proofId':key,
                            'currentReportingRestoredBy':{'runUrl':run['html_url'],'recordedAt':run['updated_at'],'evidence':evidence},
                            'historicalOmissionPreserved':True})
                proof_checks[bind_attempt(identifier,run)] = {'runUrl':run['html_url'], 'recordedAt':run['updated_at'], 'evidence':evidence}
        # Explicit exclusion of a non-production candidate retires its legacy alert,
        # without claiming that the source recovered or clearing other failures.
        for inactive in report.get('inactive', []):
            retired = data_failures.pop(inactive['id'], None)
            if retired:
                retired_failures[inactive['id']] = {**retired, 'retiredAt': run['updated_at'],
                    'retirementStatus': inactive.get('retirementStatus', 'scope-withdrawn'),
                    'retirementReason': inactive.get('reason', 'Exclusion explicite du périmètre ; aucune réparation de donnée déduite'),
                    'retirementEvidence': {'runUrl': run['html_url'], 'report': evidence}}

        for success in report.get('successes', []):
            if success.get('sourceAttempted') is False and success.get('phase') in ('qualification','validation'):
                validation_checks[success['id']] = validation_receipt(success,run,evidence,source_checks,validation_checks.get(success['id'],{}))
                if data_failures.get(success['id'],{}).get('phase') == success.get('phase') or success['id'].startswith('qualification:') and success.get('phase')=='qualification':
                    data_failures.pop(success['id'],None)
                continue
            if technical_proof(success['id']):
                proof_failures.pop(success['id'], None)
                proof_checks[success['id']] = {'runUrl':run['html_url'], 'recordedAt':run['updated_at'], 'evidence':success.get('evidence')or evidence}
                continue
            checked = timestamp(success.get('checkedAt') or (evidence or {}).get('reportedAt'))
            failed_at = timestamp(data_failures.get(success['id'], {}).get('completedAt'))
            old_failure=data_failures.get(success['id'],{})
            if evidence and evidence.get('schema')=='shares'and old_failure:
                old_failure['unverifiedRecovery']=True;old_failure['unverifiedReason']='Le rapport composite ne prouve pas le contrôle ciblé du champ ou de la branche initialement en échec.'
                old_failure['recoveryEvidence']=evidence
                continue
            previous_field=source_checks.get(success['id'],{})
            previous_bound=timestamp((previous_field.get('evidence')or{}).get('sourcePhaseCompletedAt')or previous_field.get('recordedAt'))
            current_bound=timestamp((evidence or{}).get('sourcePhaseCompletedAt')or run['updated_at'])
            if previous_bound and current_bound and previous_bound>current_bound:continue
            if not checked and evidence and success['id'] in data_failures:
                data_failures[success['id']]['unverifiedRecovery']=True
                data_failures[success['id']]['recoveryEvidence']=evidence
                continue
            if checked and failed_at and checked <= failed_at and not success.get('verifiedInAttempt'):
                continue  # An older retained record is not a successful source retry.
            data_failures.pop(success['id'], None)
            retired_failures.pop(success['id'], None)
            if not success['id'].startswith(('report-read:', 'artifact-read:')):
                source_checks[success['id']] = {'checkedAt': success.get('checkedAt') or (evidence or {}).get('reportedAt'),
                    'recordedAt': (evidence or{}).get('sourcePhaseCompletedAt')or run['updated_at'], 'runUrl': run['html_url'], 'evidence': evidence,
                    'runId':run['id'],'attempt':run.get('run_attempt',1),
                    **{k:success[k] for k in ('verifiedInAttempt','responseSha256','asOf') if k in success}}
        for error in report.get('errors', []):
            id_ = error['id']
            if technical_proof(id_):
                proof_failures[id_] = {'name':WORKFLOWS[workflow], 'cause':error['error'], 'field':error.get('field','Preuve de collecte'),
                    'runId':run['id'], 'attempt':run.get('run_attempt',1), 'runUrl':run['html_url'], 'completedAt':run['updated_at'],
                    'evidence':evidence, **{k:error[k]for k in ('expectedId','instrument','phase','kind','sourceAttempted')if k in error}}
                continue
            retired_failures.pop(id_, None)
            data_failures[id_] = {'name': error.get('name', DATA_LABELS.get(id_, id_)), 'completedAt': (evidence or{}).get('sourcePhaseCompletedAt')or run['updated_at'],
                'sourcePhaseCompletedAt':(evidence or{}).get('sourcePhaseCompletedAt'),'evidence':evidence,
                'runUrl': run['html_url'], 'cause': str(error['error'])[:500], **({'field': error['field']} if error.get('field') else {}),
                **{key: error[key] for key in ('sourceUrls', 'lastSuccessAt', 'asOf', 'attemptedAt', 'missingPeriods', 'phase', 'kind', 'sourceAttempted') if key in error}}
    for identifier in list(data_failures):
        if not owns_failure(REGISTRY[workflow],identifier):
            retired_failures[identifier]={**data_failures.pop(identifier),'retiredAt':run['updated_at'],'retirementReason':RETIREMENT_REASON}
    failures = []
    for job in jobs:
        if job.get('conclusion') not in ('failure', 'timed_out'):
            continue
        named = [a.get('title', '')[len('Échec '):] + ' — ' + str(a.get('message', ''))[:200]
                 for a in job.get('annotations', []) if str(a.get('title', '')).startswith('Échec ')]
        for step in (job.get('steps') or []):
            if step.get('conclusion') in ('failure', 'timed_out', 'cancelled'):
                failures.append({'job': job['name'], 'step': step['name'], **({'checks': named[:3]} if named else {})})
    refresh_jobs = [job for job in jobs if (job['name'] == REGISTRY[workflow]['collectionJob'] or job['name'].startswith(REGISTRY[workflow]['collectionJob'] + ' ('))]
    steps = [step for job in refresh_jobs for step in (job.get('steps') or [])]
    def phase_status(names):
        selected = [step for step in steps if step.get('name') in names]
        if any(step.get('conclusion') in ('failure', 'timed_out', 'cancelled') for step in selected):
            return 'failure'
        if any(step.get('conclusion') == 'success' for step in selected):
            return 'success'
        return 'not-run' if selected else 'unknown'

    collection_names = REGISTRY[workflow].get('collectionSteps', [])
    collection_status = phase_status(collection_names)
    if any(technical_proof(e['id']) for report in reports for e in report.get('errors', [])) and collection_status != 'failure':
        collection_status = 'unverified'
    validation_status = phase_status(REGISTRY[workflow].get('validationSteps', []))
    # A partial set of successful checks does not certify validation as complete.
    checkpoint = next((s for s in steps if s.get('name') == 'Validate collected observations'), None)
    if validation_status != 'failure':
        validation_status = ('failure' if checkpoint and checkpoint.get('conclusion') in ('failure','timed_out') else 'success' if checkpoint and checkpoint.get('conclusion') == 'success'
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
    if REGISTRY[workflow].get('controlOnly'):
        collection_status = recording_status = 'not-applicable'
        validation_status = 'failure' if any(j.get('conclusion') in ('failure','timed_out') and not j.get('name','').startswith('deploy') for j in jobs) else 'success' if any(j.get('name') == 'build' and j.get('conclusion') == 'success' for j in jobs) else 'unknown'
    if REGISTRY[workflow].get('validationOnly'):
        required = REGISTRY[workflow]['validationSteps']
        checks = [s for s in steps if s.get('name') in required]
        validation_status = 'failure' if failed else 'success' if len(checks) == len(required) and all(s.get('conclusion') == 'success' for s in checks) else 'unknown'
        collection_status = recording_status = publication_status = 'not-applicable'
    failed = failed or any(value == 'failure' for value in (collection_status, validation_status, recording_status, publication_status))
    result['workflows'] = entries
    source_successes = [(report, item) for report in reports for item in report.get('successes', [])
                        if not item['id'].startswith(('report-read:', 'artifact-read:'))
                        and not(item.get('sourceAttempted')is False and item.get('phase')in('qualification','validation'))]
    source_dates = [item.get('checkedAt') or report.get('_reportEvidence', {}).get('reportedAt')
                    for report, item in source_successes]
    prior_source_success = previous.get('lastCollectionSuccessAt') if previous.get('monitorVersion',1) >= 3 else None
    source_dates = [d for d in [*source_dates, prior_source_success] if timestamp(d)]
    last_source_success = (max(source_dates, key=timestamp) if source_dates else prior_source_success)
    if not any(r.get('_reportEvidence') for r in reports) and source_successes:
        last_source_success = run['updated_at']  # Legacy explicit per-source success, not a retained record.
    entries[workflow] = {'monitorVersion': 3, 'name': WORKFLOWS[workflow], 'runId': run['id'], 'attempt': run.get('run_attempt', 1),
        'headSha': run.get('head_sha'), 'createdAt': run.get('created_at'),
        'sourcePhaseCompletedAt':max([r['_reportEvidence']['sourcePhaseCompletedAt']for r in reports if r.get('_reportEvidence',{}).get('sourcePhaseCompletedAt')],default=None),
        'completedAt': run['updated_at'], 'status': 'failure' if failed or data_failures else 'success',
        'lastSuccessAt': previous.get('lastSuccessAt') if failed or data_failures else run['updated_at'],
        'collectionStatus': collection_status, 'validationStatus': validation_status, 'recordingStatus': recording_status, 'publicationStatus': publication_status,
        'lastCollectionSuccessAt': last_source_success if collection_status == 'success' else prior_source_success,
        'legacyLastCollectionSuccessAt': previous.get('legacyLastCollectionSuccessAt') or (previous.get('lastCollectionSuccessAt') if previous.get('monitorVersion',1)<3 else None),
        'lastPublicationSuccessAt': published_at if publication_status == 'success' else previous.get('lastPublicationSuccessAt'),
        'runUrl': run['html_url'], 'failures': failures, 'dataFailures': data_failures,'retiredDataFailures':retired_failures,
        'stepResults': {j['name']+'\n'+step['name']:step.get('conclusion') for j in jobs for step in (j.get('steps')or[])},
        'publicationEvidence': {'runUrl':run['html_url'],'checkedAt':published_at,'kind':'explicit-public-artifact-check'} if publication_status=='success' else None,
        'attemptedDataIds':sorted({r['id']for p in reports for r in p.get('successes',[])if not technical_proof(r['id'])}),
        'validatedDataIds':sorted({r['id']for p in reports for r in p.get('successes',[])if not technical_proof(r['id'])
            and source_checks.get(r['id'],{}).get('runId')==run['id']and source_checks.get(r['id'],{}).get('attempt')==run.get('run_attempt',1)
            and(timestamp(source_checks[r['id']].get('checkedAt'))or source_checks[r['id']].get('verifiedInAttempt'))})if validation_status=='success'and recording_status=='success'else[],
        'legacyReportCoverage':[r['_legacyReportCoverage']for r in reports if r.get('_legacyReportCoverage')],
        'reportQualifications': qualifications, 'reportQualificationHistory':qualification_history, 'validationChecks':validation_checks, 'sourceChecks': source_checks, 'reportEvidenceHistory': evidence_history}
    entries[workflow].update(proofFailures=proof_failures, proofChecks=proof_checks, reportResultHistory=result_history)
    result['schemaVersion'] = 1
    result['updatedAt'] = run['updated_at']
    return result


def checkout_snapshot(log):
    """Exact checkout proof from the reusable deployment build, not the workflow head."""
    matches = re.findall(r'\[command\][^\n]*git log -1 --format=%H\r?\n[^\s]+ ([0-9a-f]{40})\r?(?:\n|$)', log)
    return matches[0] if len(matches) == 1 else None


def legacy_publication_receipt(repo, jobs, api, producer=None, source_sha=None, read_log=None):
    builds = [j for j in jobs if j['name'] == 'deploy / build']
    if len(builds) != 1:
        return None
    try:
        log = read_log(builds[0]['id']) if read_log else subprocess.run(['gh', 'api', f'repos/{repo}/actions/jobs/{builds[0]["id"]}/logs'],
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
        contract=LEGACY_PHASE_CONTRACTS.get(source_sha,{})
        scope={}
        if contract.get('workflow')==producer:
            if sha!=source_sha:return None  # This reviewed old run committed no newer data snapshot.
            if not set(contract['outputs'])<=set(files):return None
            files={path:files[path]for path in contract['outputs']}
            scope={'producer':producer,'sourceSha':source_sha,'kind':'reviewed-historical-producer-outputs'}
        return {'schemaVersion': 1, 'commit': sha, 'files': files, 'evidenceJobId': builds[0]['id'],**({'producerScope':scope}if scope else{})}
    except (subprocess.SubprocessError, urllib.error.URLError, ValueError, KeyError):
        return None


def reconcile_publication(state, build, manifest, compare):
    """Clear a publication block only with matching built bytes or full-snapshot ancestry.

    Fallback may exclude unknown assets: dataSha alone never certifies their publication.
    Collection incidents and failed checks remain visible after successful publication.
    """
    result = copy.deepcopy(state)
    if (not isinstance(manifest, dict) or manifest.get('schemaVersion') != 1 or not isinstance(manifest.get('files'), dict)
            or not isinstance(build, dict) or not re.fullmatch(r'[a-f0-9]{40}', str(build.get('sha', '')))
            or not timestamp(build.get('builtAt'))
            or any(not isinstance(k, str) or not re.fullmatch(r'[a-f0-9]{40}', str(v)) for k, v in manifest['files'].items())):
        raise ValueError('Preuve publique invalide : version, identité ou empreintes absentes')
    for workflow,row in result.get('workflows', {}).items():
        receipt = row.get('publicationReceipt', {})
        files = receipt.get('files', {})
        if not qualified_receipt(receipt):
            if receipt:
                row['publicationEvidenceError'] = 'Reçu de publication invalide ; aucune livraison déduite'
            continue
        if REGISTRY.get(workflow,{}).get('controlOnly') and build['sha']!=receipt['commit']:
            continue  # Source bytes alone cannot prove that a code release reached Pages.
        exact = all(manifest.get('files', {}).get(name) == sha for name, sha in files.items())
        included = exact
        # An ancestor may contain a removed/excluded field. Only the actual
        # source fingerprints bound into the public artifact certify delivery.
        if included:
            row['publicationStatus'] = 'success'
            row['lastPublicationSuccessAt'] = build['builtAt']
            row['publicationEvidence'] = {'kind':'matching-public-source-fingerprints','checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'publishedAt':build['builtAt'],'codeSha':build['sha'],'dataSha':build.get('dataSha',build['sha']),'receiptCommit':receipt['commit'],'fileCount':len(files)}
            row['publishedCodeSha'] = build['sha']
            row['publishedDataSha'] = build.get('dataSha', build['sha'])
        else:
            matched={name:sha for name,sha in files.items()if manifest.get('files',{}).get(name)==sha}
            if not matched:
                row.pop('partialPublicationEvidence',None)
                continue
            row['partialPublicationEvidence']={'kind':'partial-matching-public-source-fingerprints',
                'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'matchedFiles':matched,
                'unconfirmedFiles':sorted(set(files)-set(matched)),'receiptCommit':receipt['commit'],
                'note':'Les fichiers identiques sont démontrés publiés ; les fichiers modifiés restent à rapprocher. Aucun succès global déduit.'}
    return result


def qualify_consumer_bindings(context, manifest):
    """Certify publication of an existing exact field binding, not a fresh poll."""
    result = copy.deepcopy(context)
    files = manifest.get('files', {}) if isinstance(manifest, dict) and manifest.get('schemaVersion') == 1 else {}
    if not isinstance(files, dict):files={}
    checks=result.get('consumerBindingChecks', {})
    if not isinstance(checks, dict):
        result['consumerBindingChecks']={}
        result['consumerBindingErrors']={'contract':'Contrat des preuves de consommation invalide ; aucune résolution déduite.'}
        return result
    for subject, proof in list(checks.items()):
        if not isinstance(subject,str) or not isinstance(proof,dict):
            result.setdefault('consumerBindingErrors',{})[str(subject)]='Preuve de consommation illisible ; autres champs conservés.'
            del checks[subject]
            continue
        expected = proof.get('sourceFiles', {})
        proof['publishedFilesVerified'] = bool(proof.get('kind') == 'verified-existing-field-binding'
            and proof.get('subject') == subject and subject.startswith('gap:usage:')
            and proof.get('field') == 'monthly' and isinstance(proof.get('seriesFingerprint'),str) and re.fullmatch('[a-f0-9]{64}', proof['seriesFingerprint'])
            and isinstance(expected, dict) and expected
            and all(isinstance(path,str) and path.startswith('src/data/') and isinstance(digest,str) and re.fullmatch('[a-f0-9]{40}', digest)
                    and files.get(path) == digest for path, digest in expected.items()))
    return result


def qualified_receipt(receipt):
    return (isinstance(receipt, dict) and receipt.get('schemaVersion') == 1
            and bool(re.fullmatch(r'[a-f0-9]{40}', str(receipt.get('commit', ''))))
            and isinstance(receipt.get('files'), dict) and bool(receipt['files'])
            and all(isinstance(k, str) and k and '..' not in pathlib.PurePosixPath(k).parts
                    and bool(re.fullmatch(r'[a-f0-9]{40}', str(v))) for k, v in receipt['files'].items()))


def review_projection_evidence(projection, manifest, build):
    expected = manifest.get('files', {}).get('public/data/data-automation-inventory.json')
    if (not isinstance(projection, dict) or projection.get('schemaVersion') != 1
            or projection.get('contract') != 'data-review-inbox-v1'
            or not isinstance(projection.get('backlog'), list) or not isinstance(projection.get('assets'), list)
            or not isinstance(projection.get('consumerUsage', {}).get('tools'), list)
            or not re.fullmatch(r'[a-f0-9]{40}', str(expected))
            or projection.get('inventoryBlobSha') != expected):
        raise ValueError('Projection Données à revoir absente, invalide ou différente de l’inventaire publié')
    return {'kind': 'matching-public-inventory-projection', 'inventoryBlobSha': expected,
            'codeSha': build['sha'], 'checkedAt': dt.datetime.now(dt.timezone.utc).isoformat()}


def decode_json_file(api, file):
    """Read the exact observed blob when the contents API omits a large body."""
    content = file.get('content') if file.get('encoding') == 'base64' else None
    if not content:
        content = api(f"/git/blobs/{file['sha']}")['content']
    decoded = json.loads(base64.b64decode(content))
    if file.get('path', PATH) == PATH:
        decoded = decode_status(decoded)
    return expand_report_archives(decoded) if file.get('path', PATH) == PATH and isinstance(decoded, dict) and isinstance(decoded.get('workflows'), dict) else decoded


def read_large_file(api, path, ref):
    """The contents API leaves `content` empty above 1 MB; use its exact blob."""
    return decode_json_file(api, api(f'/contents/{path}?ref={ref}'))


def radar_resolution_evidence(api, ledger, active):
    """Read existing confirmed reconciliations; do not manufacture financial resolutions."""
    if not isinstance(ledger.get('conflicts'), dict):
        raise ValueError('Registre des contradictions absent')
    proofs, verified = {}, set()
    for key, row in active.items():
        if not key.startswith('radar:'):continue
        suffix = re.search(r'\(([^()]+)\)\.?$', row.get('cause', ''))
        identifier = row.get('conflictId') or (suffix.group(1) if suffix else None)
        conflict = ledger['conflicts'].get(identifier, {})
        proof = conflict.get('resolution', {})
        checked, stable = timestamp(proof.get('checkedAt')), timestamp(proof.get('stableSince'))
        digest = proof.get('sourceHash', '')
        if (not conflict.get('resolvedAt') or proof.get('status') != 'confirmed'
                or proof.get('kind') != 'verified-source-revision' or not checked or not stable
                or (checked-stable).total_seconds() < 4*3600 or checked > dt.datetime.now(dt.timezone.utc)
                or not re.fullmatch(r'[a-f0-9]{64}', digest)
                or proof.get('evidencePath') != f'dws-snapshots/{digest}.json'):
            continue
        if digest not in verified:
            file = api('/contents/' + proof['evidencePath'] + '?ref=radar-data')
            encoded = file.get('content') or api('/git/blobs/' + file['sha'])['content']
            body = base64.b64decode(encoded).removesuffix(b'\n')
            if hashlib.sha256(body).hexdigest() != digest:
                raise ValueError('Empreinte de la preuve de réconciliation incorrecte')
            verified.add(digest)
        proofs[identifier] = {**proof, 'evidenceVerified': True, 'resolvedAt': conflict['resolvedAt']}
    return proofs


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
    state=include_configured_workflows(state)
    def reports_for_run(run,jobs):
        workflow=run['path'].split('/')[-1]
        if workflow not in REPORT_CONTRACTS:
            return [report_error('artifact-read:'+REPORT_ARTIFACTS[workflow],'Contrat de rapport absent pour ce producteur ; résultat individuel non qualifié')]if workflow in REPORT_ARTIFACTS else[]
        try:
            artifacts=attempt_artifacts(api(f'/actions/runs/{run["id"]}/artifacts?per_page=100')['artifacts'],run)
            with tempfile.TemporaryDirectory()as directory:return artifact_reports(repo,workflow,jobs,artifacts,directory)
        except (urllib.error.URLError,ValueError,KeyError,TypeError,OSError)as error:
            return [report_error('artifact-read:'+REPORT_ARTIFACTS[workflow],str(error))]
    state,terminal_runs=observe_running_workflows(state,REGISTRY,api,repo,dt.datetime.now(dt.timezone.utc).isoformat(),reports_for_run)
    state['workflowAvailability'] = state.get('workflowAvailability', {})
    for workflow in WORKFLOWS:
        try:
            observed = api('/actions/workflows/' + workflow)
            state['workflowAvailability'][workflow] = {'state': observed['state'], 'checkedAt': dt.datetime.now(dt.timezone.utc).isoformat()}
        except (urllib.error.URLError,OSError,http.client.IncompleteRead,KeyError,ValueError,TypeError,AttributeError) as error:
            state.setdefault('observerErrors', {})['availability:' + workflow] = {'cause': 'Disponibilité non vérifiable : ' + str(error)[:300]}
        else:
            state.setdefault('observerErrors', {}).pop('availability:' + workflow, None)
    runs = []
    if args.backfill or args.monitor_only:
        for workflow in WORKFLOWS:
            try:
                candidates = api(f'/actions/workflows/{workflow}/runs?branch=master&status=completed&per_page=30')['workflow_runs']
            except (urllib.error.URLError,OSError,http.client.IncompleteRead,ValueError,TypeError,KeyError,AttributeError) as error:
                state.setdefault('observerErrors', {})['runs:'+workflow]={'cause':'Exécutions non lisibles : '+str(error)[:300]}
                continue
            if not isinstance(candidates,list) or any(not isinstance(r,dict) or not isinstance(r.get('id'),int) or not isinstance(r.get('path'),str) for r in candidates):
                state.setdefault('observerErrors', {})['runs:'+workflow]={'cause':'Format des exécutions invalide'}
                continue
            state.setdefault('observerErrors', {}).pop('runs:'+workflow,None)
            old_id=state.get('workflows',{}).get(workflow,{}).get('runId',0)
            if len(candidates)==30 and old_id and min(r['id']for r in candidates)>old_id:
                state.setdefault('observerErrors', {}).setdefault('history-window:'+workflow,{'cause':'Intervalle historique non couvert par les 30 derniers runs API ; reprise historique requise. Dernier run observé : '+str(old_id),'anchorRunId':old_id,'throughAt':dt.datetime.now(dt.timezone.utc).isoformat()})
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
    runs.extend(terminal_runs)
    for workflow,row in state.get('workflows',{}).items():
        if row.get('headSha')in LEGACY_PHASE_CONTRACTS and not row.get('legacyPhaseEvidence'):
            try:
                legacy=api(f'/actions/runs/{row["runId"]}/attempts/{row.get("attempt",1)}')
                runs.append({**legacy,'_phaseRetry':True})
            except (OSError,ValueError,KeyError,TypeError)as error:
                state.setdefault('observerErrors',{})['phase-proof:'+workflow]={'cause':'Contrat de phase historique non relisible : '+str(error)[:250]}
    runs=list({(r['id'],r.get('run_attempt',1)):r for r in runs}.values())
    pending_proofs = [(failure.get('lastProofReadAt',''),workflow,key,failure) for workflow,row in state.get('workflows',{}).items() if workflow in REPORT_ARTIFACTS for key,failure in row.get('proofFailures',{}).items() if failure.get('runId')]
    for _, workflow, key, failure in sorted(pending_proofs,key=lambda r:r[0])[:4]:
        failure['lastProofReadAt']=dt.datetime.now(dt.timezone.utc).isoformat()
        if any(r['id']==failure['runId'] and r.get('run_attempt',1)==failure.get('attempt',1) for r in runs):continue
        try:
            retry=api(f'/actions/runs/{failure["runId"]}/attempts/{failure.get("attempt",1)}')
            if retry.get('head_branch')!='master' or retry.get('path','').split('/')[-1]!=workflow:raise ValueError('Preuve hors producteur master')
            runs.append({**retry,'_proofRetry':True})
        except (urllib.error.URLError,ValueError,KeyError) as error:
            state.setdefault('observerErrors',{})['proof-retry:'+workflow]={'cause':'Relecture historique impossible : '+str(error)[:250]}
    state=recover_skipped_history_gaps(state,api,dt.datetime.now(dt.timezone.utc).isoformat())
    publication_history = []
    for run in sorted(runs, key=lambda r: (r['id'], r.get('run_attempt', 1))):
        workflow = run['path'].split('/')[-1]
        try:
            previous_run = state.get('workflows', {}).get(run['path'].split('/')[-1], {})
            if run['id'] < previous_run.get('runId', 0) and not run.get('_proofRetry') and not run.get('_inflightTerminal'):
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
            reports = reports_for_run(run,jobs)
            workflow = run['path'].split('/')[-1]
            if run.get('_phaseRetry'):
                producers=[job for job in jobs if job.get('name')==REGISTRY[workflow]['collectionJob']]
                if len(producers)!=1:raise ValueError('Job historique de collecte ambigu')
                log=subprocess.run(['gh','api',f'repos/{repo}/actions/jobs/{producers[0]["id"]}/logs'],check=True,capture_output=True,text=True,timeout=45).stdout
                source_sha=checkout_snapshot(log[:500_000])
                state=qualify_legacy_phases(state,run,jobs,source_sha,dt.datetime.now(dt.timezone.utc).isoformat())
                if not state['workflows'][workflow].get('legacyPhaseEvidence'):raise ValueError('Code ou étapes du contrat historique non confirmés')
                state.setdefault('observerErrors',{}).pop('phase-proof:'+workflow,None)
            if run.get('_proofRetry') or run['id']<previous_run.get('runId',0):
                state = merge_proof_retry(state,run,reports)
                state.setdefault('observerErrors',{}).pop('proof-retry:'+workflow,None)
                continue
            state = update_status(state, run, jobs, reports)
            workflow = run['path'].split('/')[-1]
            row = state.get('workflows', {}).get(workflow, {})
            if row.get('runId') == run['id']:
                receipts = attempt_artifacts(api(f'/actions/runs/{run["id"]}/artifacts?per_page=100')['artifacts'], run)
                if any(a['name'] == 'data-publication-receipt' and not a['expired'] for a in receipts):
                    with tempfile.TemporaryDirectory() as directory:
                        try:
                            download_status_artifact(repo, receipts, 'data-publication-receipt', directory)
                            receipt = json.loads((pathlib.Path(directory) / 'data-publication-receipt.json').read_text())
                            if not qualified_receipt(receipt):
                                raise ValueError('Invalid publication receipt')
                            row['publicationReceipt'] = receipt
                            row.pop('publicationEvidenceError', None)
                        except (subprocess.SubprocessError, OSError, ValueError, zipfile.BadZipFile) as error:
                            row['publicationEvidenceError'] = 'Publication receipt unavailable: ' + type(error).__name__
                            print(f'Run {run["id"]}: {row["publicationEvidenceError"]}; other collectors remain observable.')
            if row.get('runId') == run['id'] and not row.get('publicationReceipt') and row.get('recordingStatus') == 'success':
                receipt = legacy_publication_receipt(repo, jobs, api,producer=workflow,source_sha=row.get('headSha'))
                if receipt:
                    row['publicationReceipt'] = receipt
            if row.get('publicationStatus') == 'success' and not qualified_receipt(row.get('publicationReceipt')):
                row['publicationEvidenceError'] = 'Reçu de publication attendu absent ou non qualifié ; périmètre livré non démontré.'
            publication_history.append((run, jobs))
            state.setdefault('observerErrors', {}).pop(workflow, None)
        except (urllib.error.URLError,OSError,http.client.IncompleteRead,ValueError,TypeError,KeyError,AttributeError,subprocess.SubprocessError) as error:
            state.setdefault('observerErrors', {})[workflow] = {'cause': type(error).__name__ + ': ' + str(error)[:400], 'runUrl': run.get('html_url'), 'attemptedAt': dt.datetime.now(dt.timezone.utc).isoformat()}
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
    try:
        seed = json.loads(gzip.decompress(pathlib.Path(__file__).with_name('fixtures').joinpath('automation-reports/history-baseline.json.gz').read_bytes()))
        state = restore_history(state, seed)
        state.setdefault('observerErrors', {}).pop('history', None)
    except (OSError, ValueError, TypeError) as error:
        state.setdefault('observerErrors', {})['history'] = {'cause': 'Archive historique non lisible : ' + str(error)[:300]}
    state = include_configured_workflows(state)
    public_manifest = None
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
        public_build, public_manifest = published('build-info.json'), published('data/publication-manifest.json')
        state = reconcile_publication(state, public_build, public_manifest, compare)
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError, KeyError, TypeError, TimeoutError) as error:
        public_manifest = None
        state.setdefault('observerErrors', {})['publication'] = {'cause': 'Publication non vérifiable : ' + str(error)[:300]}
    else:
        state.setdefault('observerErrors', {}).pop('publication', None)
        try:
            proof = review_projection_evidence(published('data/data-review-inbox.json'), public_manifest, public_build)
            state.setdefault('observerChecks', {})['review-projection'] = proof
            state.setdefault('observerErrors', {}).pop('review-projection', None)
        except (urllib.error.URLError, ValueError, KeyError, TypeError, AttributeError, TimeoutError) as error:
            state.setdefault('observerErrors', {})['review-projection'] = {'cause': str(error)[:300],
                'sourceUrls': [public + 'data/data-review-inbox.json'], 'attemptedAt': dt.datetime.now(dt.timezone.utc).isoformat()}
    try:
        context = json.loads(subprocess.run(['node', 'scripts/build-monitoring-context.mjs'], check=True, capture_output=True, text=True, timeout=120).stdout)
        context = qualify_consumer_bindings(context, public_manifest)
        for key in list(state.setdefault('observerErrors',{})):
            if key.startswith('consumer-binding:'):state['observerErrors'].pop(key)
        for key,cause in context.get('consumerBindingErrors',{}).items():
            state['observerErrors']['consumer-binding:'+key]={'cause':cause}
        state.setdefault('observerErrors', {}).pop('context', None)
    except (subprocess.SubprocessError, ValueError) as error:
        state.setdefault('observerErrors', {})['context'] = {'cause': 'Projection de surveillance indisponible : ' + str(error)[:300]}
        context = {'schemaVersion': 1, 'alerts': [], 'entities': [], 'incomplete': True}
    radar = None
    try:
        candidate = read_large_file(api, 'feed.json', 'radar-data')
        checked = timestamp(candidate.get('checkedAt'))
        age = (dt.datetime.now(dt.timezone.utc) - checked).total_seconds() if checked else -1
        if candidate.get('schemaVersion') == 1 and isinstance(candidate.get('errors'), list) and 0 <= age <= 18 * 3600:
            radar = candidate
            # A fresh feed without an error is not evidence that the old conflict
            # was reconciled. Its durable ledger and content-addressed proof are.
            radar['resolvedConflicts'] = {}
            if any(k.startswith('radar:') for k in state.get('monitoring', {}).get('active', {})):
                try:
                    ledger = read_large_file(api, 'state.json', 'radar-data')
                    radar['resolvedConflicts'] = radar_resolution_evidence(api, ledger, state['monitoring']['active'])
                    state.setdefault('observerErrors', {}).pop('radar-proofs', None)
                except (urllib.error.URLError, ValueError, KeyError, TypeError) as error:
                    state.setdefault('observerErrors', {})['radar-proofs'] = {'cause': 'Preuves du radar non lisibles : ' + str(error)[:300]}
    except (urllib.error.HTTPError,urllib.error.URLError,OSError,http.client.IncompleteRead,ValueError,KeyError,TypeError,AttributeError):
        print('Radar non lisible ; alertes précédentes conservées.')
    # Only trusted master collectors; reserve dispatches in the same durable status
    # document before calling Actions. Never run code from a triggering PR.
    now = dt.datetime.now(dt.timezone.utc)
    current_runs = {}
    recovery_registry = REGISTRY.copy()
    for workflow, config in REGISTRY.items():
        if workflow in ('onboard-assets.yml', 'rehearse-refresh.yml', 'deploy-pages.yml') or config.get('publishes') is False:
            continue
        if recovery_reason(state.get('workflows', {}).get(workflow, {}), config, now):
            try:
                current_runs[workflow] = [run for run in api(f'/actions/workflows/{workflow}/runs?branch=master&per_page=100')['workflow_runs']
                                         if run.get('event') in ('schedule','push','workflow_dispatch','workflow_run')]
                state.setdefault('observerErrors',{}).pop('recovery:'+workflow,None)
            except (urllib.error.URLError,OSError,http.client.IncompleteRead,ValueError,KeyError,TypeError,AttributeError) as error:
                recovery_registry.pop(workflow,None)
                state.setdefault('observerErrors',{})['recovery:'+workflow]={'cause':'État des reprises non observable ; aucun déclenchement aveugle : '+str(error)[:200]}
    state['recovery'], recovery_plans = plan_recovery(state, recovery_registry, now, current_runs)
    state=pack_report_scopes(state)
    def monitor_job_log(job_id):
        return subprocess.run(['gh','api',f'repos/{repo}/actions/jobs/{job_id}/logs'],check=True,capture_output=True,text=True,timeout=45).stdout
    state=observe_monitor_history(state,api,repo,dt.datetime.now(dt.timezone.utc).isoformat(),monitor_job_log)
    state['monitoring'] = evaluate_monitoring(state, context, REGISTRY, dt.datetime.now(dt.timezone.utc).isoformat(), radar)
    state=pack_report_scopes(state)
    print('Stockage du moniteur : '+str(len(json.dumps(state,ensure_ascii=False).encode()))+' octets, '+str(len(state.get('reportScopes',{})))+' périmètres de preuve uniques ; aucun incident retiré.')
    compressed = reader_ready(repo)
    encoded = encode_status(state, compressed=compressed)
    print('Transport du moniteur : '+('gzip vérifié, lecteur public disponible' if compressed else 'JSON historique, nouveau lecteur public non démontré'))
    payload = {'message': 'Update automation failure status', 'branch': BRANCH, 'content': encoded}
    if sha:
        payload['sha'] = sha
    persist_and_dispatch(api, PATH, payload, state, recovery_plans, compressed=compressed)
    # Persist incidents before notifying. Bot issue/comment receipts make retries idempotent.
    sync_monitoring_issue(state['monitoring'], api, repo)
    print(f'Statuts publiés : {len(state["workflows"])} automatisations')


if __name__ == '__main__':
    main()


