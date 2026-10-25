"""Incident lifecycle and one grouped GitHub notification, independent of Pages."""
from automation_contracts import owns_failure, RETIREMENT_REASON
import datetime as dt
import hashlib
import json
import re
from pathlib import Path

RETIRED_WORKFLOWS = json.loads((Path(__file__).resolve().parents[1] / 'src/data/retired-automations.json').read_text())['workflows']

REMOVED_TOOL_NAMES = {r['toolName'] for r in RETIRED_WORKFLOWS.values() if r.get('toolName')}
REMOVED_SCOPE_REASON = 'Périmètre supprimé : l’outil consommateur a été retiré. Aucune réparation de donnée déduite.'

MARKER = '<!-- data-reliability-monitor:v1 -->'
QUIET_HOURS = 6  # minimum spacing between comments that only report checks or recoveries

def timestamp(value):
    try:
        return dt.datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(dt.timezone.utc)
    except (ValueError, AttributeError, TypeError):
        return None


def restore_history(state, seed):
    """Import witnessed episodes once; never turn an archived episode into an active one."""
    if seed.get('schemaVersion') != 1 or not seed.get('tip') or any(not isinstance(seed.get(k), list) for k in ('events','resolved','retired')):
        raise ValueError('Archive historique invalide')
    if state.get('historyBackfillTip') == seed['tip']:
        return state
    result = json.loads(json.dumps(state))
    previous = result.setdefault('monitoring', {})
    for kind in ('events','resolved','retired'):
        rows = [*previous.get(kind, []), *seed[kind]]
        def key(row):
            return (row.get('revision'), row.get('at')) if kind == 'events' else (row.get('id'), row.get('resolvedAt' if kind == 'resolved' else 'retiredAt'))
        merged = {}
        for row in rows:
            merged.setdefault(key(row), row)
        previous[kind] = sorted(merged.values(), key=lambda r: r.get('at', r.get('resolvedAt', r.get('retiredAt', ''))), reverse=kind != 'events')
    previous['revision'] = max([previous.get('revision', 0), *(r.get('revision', 0) for r in seed['events'])])
    result['historyBackfillTip'] = seed['tip']
    return result


def incident_context(identifier, context, fallback):
    # Exact alias boundaries avoid mixing World with World Quality, or managers.
    isin = re.search(r'[A-Z]{2}[A-Z0-9]{10}', identifier)
    entity = isin.group() if isin else re.sub(r'^index-(.*)-(composition|returns)$', r'\1', identifier)
    entity = entity.removeprefix('investor:')
    matches = [row for row in context['entities'] if entity in row.get('aliases', [])]
    return {'name': matches[0]['name'] if matches else fallback,
            'tools': sorted({tool for row in matches for tool in row.get('tools', [])}),
            'impactScope': 'asset' if matches else 'collector',
            'sourceUrls': sorted({url for row in matches for url in row.get('sourceUrls', [])}),
            'to': matches[0].get('to') if matches else '/donnees-a-revoir'}


SOURCE_CHANGE_MARKERS = ('Qualification de publication requise', 'Clause officielle absente ou modifiée', 'Wrong contract identity')


def evaluate_monitoring(state, context, registry, now, radar=None):
    if context.get('schemaVersion') != 1 or not isinstance(context.get('alerts'), list) or not isinstance(context.get('entities'), list):
        raise ValueError('Calendrier de surveillance incomplet')
    current = timestamp(now)
    if not current:
        raise ValueError('Date de surveillance invalide')
    previous = state.get('monitoring', {})
    old = previous.get('active', {})
    active = {}
    def add(key, row):
        if row.get('tools') and set(row['tools']) <= REMOVED_TOOL_NAMES:
            return
        row = {**row, 'tools': [t for t in row.get('tools', []) if t not in REMOVED_TOOL_NAMES]}
        prior = active.get(key,old.get(key, {}))
        observations = prior.get('observations', []).copy()
        def evidence(value):
            return {k: value.get(k) for k in ('cause', 'runUrl', 'attemptedAt', 'completedAt', 'asOf', 'lastSuccessAt', 'sourceUrls') if value.get(k) is not None}
        if prior and not observations:
            observations.append(evidence(prior))
        current_evidence = evidence(row)
        if not observations or observations[-1] != current_evidence:
            observations.append(current_evidence)
        active[key] = {**row, 'id': key, 'firstSeenAt': prior.get('firstSeenAt', now), 'lastSeenAt': now, 'observations': observations}
    for observer, failure in state.get('observerErrors', {}).items():
        add('monitor:' + observer, {**failure, 'kind': 'monitoring', 'name': 'Surveillance · ' + observer,
            'field': 'Observabilité', 'tools': ['Données à revoir'], 'cause': failure['cause'], 'to': '/donnees-a-revoir'})
    if context.get('incomplete'):
        for key, row in old.items():
            if key.startswith(('calendar:', 'history:', 'field:')):
                add(key, row)
    for workflow, config in registry.items():
        row = state.get('workflows', {}).get(workflow, {})
        tools = config.get('tools', [])
        base = {'name': config['name'], 'tools': tools, 'impactScope': 'collector', 'workflow': workflow, 'runUrl': row.get('runUrl'), 'to': '/donnees-a-revoir', 'lastSuccessAt': row.get('lastCollectionSuccessAt'),
                'completedAt':row.get('completedAt'),'sourcePhaseCompletedAt':row.get('sourcePhaseCompletedAt'),'runId':row.get('runId'),'attempt':row.get('attempt'),'attemptedDataIds':row.get('attemptedDataIds',[])}
        availability = state.get('workflowAvailability', {}).get(workflow, {})
        if availability.get('state') and availability['state'] != 'active':
            add('disabled:' + workflow, {**base, 'kind': 'unobserved', 'field': 'Activation de l’automatisation', 'cause': 'Automatisation indisponible : ' + availability['state']})
        observed_contracts={e.get('file')for e in row.get('reportEvidenceHistory',[]) if e.get('producerContract')==config.get('reportContract') and e.get('scopeExplicit')}
        missing_contracts=set(config.get('reportFiles',[]))-observed_contracts
        if config.get('reportCoverage') == 'job-only' or config.get('reportContract') and missing_contracts:
            add('coverage:' + workflow, {**base, 'kind': 'qualification', 'field': 'Contrat de remontée individuelle', 'cause': ('Contrats individuels pas encore observés : '+', '.join(sorted(missing_contracts))+'. ' if missing_contracts else '')+'Ce producteur ne fournit pas de rapport individuel contractuel. Le succès du job ne démontre pas la couverture de chaque champ.', 'to': '/donnees-a-revoir'})
        for identifier, failure in row.get('proofFailures', {}).items():
            add('collection:'+workflow+':'+identifier, {**base, **failure, 'proofId':identifier, 'kind':'monitoring', 'field':'Preuve de collecte / tentative', 'lastSuccessAt':None})
        for filename, warning in row.get('reportQualifications', {}).items():
            add('scope:' + workflow + ':' + filename, {**base, **warning, 'kind': 'qualification', 'field': 'Complétude du périmètre tenté', 'cause': warning['cause'] + ' Rapport : ' + filename})
        completed = timestamp(row.get('completedAt'))
        if not completed or completed > current:
            add('unobserved:' + workflow, {**base, 'kind': 'unobserved', 'field': 'Exécution', 'cause': 'Aucune exécution terminée avec une date exploitable.'})
        elif (current - completed).total_seconds() > config['maxAgeHours'] * 3600:
            add('overdue:' + workflow, {**base, 'kind': 'overdue', 'field': 'Fréquence de collecte', 'cause': f"Aucune exécution terminée depuis plus de {config['maxAgeHours']} heures.", 'lastSuccessAt': row.get('lastCollectionSuccessAt')})
        for identifier, failure in row.get('dataFailures', {}).items():
            if not owns_failure(config,identifier):continue
            details = incident_context(identifier, context, failure.get('name', identifier))
            # Daily quotes and issuer characteristics have different consumers.
            if 'dataFailureTools' in config:
                details['tools'] = config['dataFailureTools']
                details['to'] = config.get('dataFailureTo', '/donnees-a-revoir')
                details['sourceUrls'] = failure.get('sourceUrls', [])
            elif not details['tools']:
                details['tools'] = tools
            if 'sourceUrls' in failure:
                details['sourceUrls'] = failure['sourceUrls']
            # An official document that changed wording or identity is not a broken collector:
            # the previous value is kept and a person must compare old and new text.
            review = any(marker in str(failure.get('cause', '')) for marker in SOURCE_CHANGE_MARKERS)
            add(f'collection:{workflow}:{identifier}', {**base, **failure, **details, 'tools': details['tools'], 'kind': 'review' if review else 'anomaly' if 'Suspicious' in str(failure.get('cause', '')) else 'collection',
                'lastSuccessAt': failure.get('lastSuccessAt') if 'lastSuccessAt' in failure else row.get('sourceChecks', {}).get(identifier, {}).get('checkedAt'),
                **({'kind':'qualification','originalKind':'collection','cause':failure.get('unverifiedReason','Reprise déclarée sans date de contrôle source qualifiée ; résolution non démontrée.')+' Erreur antérieure : '+failure.get('cause','')}if failure.get('unverifiedRecovery')else{}),
                'field': failure.get('field') or ('Composition' if identifier.endswith('-composition') else 'Performances' if identifier.endswith('-returns') else 'Champs du collecteur'),
                'dataId': identifier})
        if row.get('publicationStatus') == 'unverified':
            add('evidence:' + workflow, {**base, 'kind':'monitoring', 'field':'Preuve de publication', 'cause':'Déploiement achevé sans contrôle explicite de l’artefact public ; livraison non certifiée.'})
        if row.get('publicationEvidenceError'):
            add('evidence:' + workflow, {**base, 'kind': 'monitoring', 'field': 'Preuve de publication', 'cause': row['publicationEvidenceError']})
        validation_steps = set(config.get('validationSteps', []))
        validation_failures = [f for f in row.get('failures', []) if f['step'] in validation_steps or f['job'] == 'report-validation-failures']
        if config.get('controlOnly'):validation_failures=[f for f in row.get('failures',[])if not f['job'].startswith('deploy')]
        validation_failed = row.get('validationStatus') == 'failure' or bool(validation_failures)
        if validation_failed:
            add(f'checks:{workflow}', {**base, 'kind': 'checks', 'field': 'Validation des données',
                'failedSteps': validation_failures, 'cause': ' ; '.join(f"{f['job']} : {f['step']}" for f in validation_failures) or 'Validation en échec ; consulter le journal.'})
        other_failures = [f for f in row.get('failures', []) if f['step'] not in validation_steps
                          and f['step'] not in config.get('collectionSteps', [])
                          and f['job'] not in ('report-failures', 'report-validation-failures')
                          and not f['job'].startswith('deploy /')]
        if config.get('controlOnly')and validation_failed:other_failures=[]
        if row.get('status') == 'failure' and (row.get('publicationStatus') == 'failure' or other_failures
                or not row.get('dataFailures') and not validation_failed):
            publishing = row.get('publicationStatus') == 'failure'
            # Data-only lane: the data reached the site; only a check after publication needs repair.
            checks_only = (not publishing and row.get('publicationStatus') == 'success' and row.get('failures')
                           and all(f['job'].startswith('deploy /') for f in row['failures']))
            kind = 'publication' if publishing else 'checks' if checks_only else 'collection'
            add(f"{'workflow' if kind == 'collection' else kind}:{workflow}", {**base, 'kind': kind,
                'field': {'publication': 'Publication', 'checks': 'Contrôle après publication'}.get(kind, 'Exécution du collecteur'),
                'failedSteps': row.get('failures', []), 'cause': ' ; '.join(f"{f['job']} : {' / '.join(f['checks']) if f.get('checks') else f['step']}" for f in row.get('failures', [])) or 'Exécution en échec ; consulter le journal.'})
    for pending in state.get('inFlightRuns',{}).values():
        workflow=pending['workflow'];run=pending['run'];config=registry.get(workflow)
        if not config:continue
        base={'name':config['name'],'tools':config.get('tools',[]),'impactScope':'collector','workflow':workflow,
              'runId':run['id'],'attempt':run.get('run_attempt',1),'runUrl':run.get('html_url'),'to':'/donnees-a-revoir',
              'completedAt':pending.get('phaseCompletedAt'),'attemptedDataIds':sorted({r['id']for report in pending.get('reports',[])for r in report.get('successes',[])if not r['id'].startswith(('report-read:','artifact-read:'))})}
        base['sourcePhaseCompletedAt']=max([r['_reportEvidence']['sourcePhaseCompletedAt']for r in pending.get('reports',[])if r.get('_reportEvidence',{}).get('sourcePhaseCompletedAt')],default=None)
        failures=pending.get('failures',[])
        if failures:
            publishing=any(f['job'].startswith('deploy')for f in failures)
            kind='publication'if publishing else'checks'
            add(kind+':'+workflow,{**base,'kind':kind,'field':'Publication'if publishing else'Validation / enregistrement',
                'failedSteps':failures,'cause':'Étape en échec dans une exécution non terminée : '+' ; '.join(f['job']+' : '+f['step']for f in failures)})
        created=timestamp(run.get('run_started_at')or run.get('created_at'))
        if created and (current-created).total_seconds()>config['maxAgeHours']*3600:
            add('running-overdue:'+str(run['id'])+':'+str(run.get('run_attempt',1)),{**base,'kind':'overdue','field':'Exécution bloquée','cause':'Exécution toujours '+run['status']+' au-delà du délai du producteur ; aucune fin ni publication déduite.'})
    for row in context['alerts']:
        add('calendar:' + row['id'], {**row, 'kind': 'freshness', 'cause': ('Date future à vérifier.' if row['category'] == 'future-date' else row.get('reason', 'Repli sur une valeur manuelle.') if row['category'] == 'manual-fallback' else 'Échéance de vérification atteinte ; contrôler la période disponible.'), 'lastSuccessAt': row.get('checkedAt')})
    if 'historyAlerts' in context:
        if not isinstance(context['historyAlerts'], list):
            raise ValueError('Bilan des historiques invalide')
        for row in context['historyAlerts']:
            add('history:' + row['id'], {**row, 'lastSuccessAt': row.get('checkedAt')})
    else:
        # A legacy or unavailable report cannot certify recovery.
        for key, row in old.items():
            if key.startswith('history:'):
                add(key, row)
    # A missing field report cannot silently close retained-source or freshness incidents.
    if 'fieldAlerts' in context:
        if not isinstance(context['fieldAlerts'], list):
            raise ValueError('Bilan des champs invalide')
        for row in context['fieldAlerts']:
            add('field:' + row['id'], row)
    else:
        for key, row in old.items():
            if key.startswith('field:'):
                add(key, row)
    # Radar contradictions are review signals, never confirmed market movements.
    # A missing feed retains prior alerts and cannot claim a recovery.
    if radar is None:
        for key, row in old.items():
            if key.startswith('radar:'):
                add(key, row)
        add('monitor:radar', {'kind': 'unobserved', 'name': 'Contradictions du radar', 'field': 'Lecture du radar', 'tools': ['Radar éditorial'], 'cause': 'Lecture indisponible ; alertes précédentes conservées.', 'to': '/donnees-a-revoir'})
    else:
        for error in radar.get('errors', []):
            if 'Valeur contradictoire pour la même période' not in error.get('reason', ''):
                continue
            suffix = re.search(r'\(([^()]+)\)\.?$', error['reason'])
            identifier = suffix.group(1) if suffix and suffix.group(1).startswith(('etf:', 'index:')) else json.dumps([error.get('family'),error.get('entity'),error['reason']],sort_keys=True)
            key = next((k for k,r in old.items() if k.startswith('radar:') and (r.get('conflictId') == identifier or '('+identifier+')' in r.get('cause',''))), None)
            key = key or 'radar:' + hashlib.sha256(identifier.encode()).hexdigest()[:24]
            details = incident_context(error.get('entity', ''), context, error.get('entity', 'Radar'))
            field = re.search(r'\) : (.+?)\. Dernière observation', error['reason'])
            add(key, {**details, 'conflictId':identifier, 'kind': 'conflict', 'field': field.group(1) if field else 'Concordance des sources', 'cause': error['reason']})
    def retired_reason(row):
        if row.get('tools') and set(row['tools']) <= REMOVED_TOOL_NAMES:return REMOVED_SCOPE_REASON
        if row.get('workflow') in RETIRED_WORKFLOWS:return RETIRED_WORKFLOWS[row['workflow']]['reason']
        withdrawal = state.get('workflows', {}).get(row.get('workflow'), {}).get('retiredDataFailures', {}).get(row.get('dataId'))
        if withdrawal:return withdrawal.get('retirementReason', 'Périmètre retiré ; aucune réparation déduite')
        if row.get('dataId') and not owns_failure(registry.get(row.get('workflow'),{}),row['dataId']):return RETIREMENT_REASON
        return None
    def retirement_status(row):
        withdrawal = state.get('workflows', {}).get(row.get('workflow'), {}).get('retiredDataFailures', {}).get(row.get('dataId'), {})
        if withdrawal.get('retirementStatus'):return withdrawal['retirementStatus']
        return 'scope-removed' if row.get('workflow') in RETIRED_WORKFLOWS or row.get('tools') and set(row['tools']) <= REMOVED_TOOL_NAMES else 'retired-attribution'
    def resolution_proof(key, row):
        workflow = state.get('workflows', {}).get(row.get('workflow'), {})
        if key == 'monitor:review-projection':
            proof = state.get('observerChecks', {}).get('review-projection')
            checked = timestamp(proof.get('checkedAt')) if proof else None
            failed_at = timestamp(row.get('attemptedAt') or row.get('firstSeenAt'))
            return proof if checked and checked <= current and (not failed_at or checked > failed_at) else None
        if row.get('proofId'):
            return workflow.get('proofChecks', {}).get(row['proofId'])
        if row.get('dataId'):
            proof = workflow.get('sourceChecks', {}).get(row['dataId'])
            checked = timestamp(proof.get('recordedAt') if proof.get('verifiedInAttempt') else proof.get('checkedAt') or proof.get('recordedAt')) if proof else None
            failed_at = timestamp(row.get('attemptedAt') or row.get('completedAt') or row.get('firstSeenAt'))
            return proof if checked and checked <= current and (not failed_at or checked > failed_at) else None
        if key.startswith('scope:'):
            filename = row.get('evidence', {}).get('file')
            return next((r for r in reversed(workflow.get('reportEvidenceHistory', [])) if r.get('file') == filename and r.get('scopeExplicit')), None)
        if key.startswith('history:'):
            identifier = key.removeprefix('history:').rsplit(':', 1)[0]
            proof = context.get('historyChecks', {}).get(identifier)
            if not proof or any(row.get(f) and row.get(f) != proof.get(f) for f in ('currency','method')):return None
            needed = set(row.get('missingPeriods', []) + row.get('invalidPeriods', []))
            if key.endswith(':gaps') and (not needed or not needed <= set(proof.get('periods', []))):return None
            if key.endswith(':delay') and (not proof.get('asOf') or proof['asOf'] <= (row.get('asOf') or '')):return None
            return {**{k:v for k,v in proof.items() if k != 'periods'}, 'restoredPeriods': sorted(needed)}
        if key.startswith(('field:', 'calendar:')):
            if key.startswith('field:'):
                proof = context.get('fieldChecks', {}).get(key.removeprefix('field:'))
            else:
                proof = next((r for r in context.get('entities', []) if r.get('id') == key.removeprefix('calendar:')), None)
            checked = timestamp(proof.get('checkedAt')) if proof else None
            prior = timestamp(row.get('lastSuccessAt') or row.get('checkedAt'))
            if prior and prior > current:prior = timestamp(row.get('firstSeenAt'))
            if not checked or checked > current or prior and checked <= prior:return None
            return proof
        if key.startswith('radar:'):
            return (radar or {}).get('resolvedConflicts', {}).get(row.get('conflictId'))
        if key.startswith('publication:'):
            proof=workflow.get('publicationEvidence')if workflow.get('publicationStatus')=='success'else None
            checked=timestamp(proof.get('checkedAt'))if proof else None
            failed=timestamp(row.get('completedAt'))
            source_bound=timestamp(row.get('sourcePhaseCompletedAt'))
            published_source=timestamp(workflow.get('sourcePhaseCompletedAt'))
            if not proof or failed and(not checked or checked<failed):return None
            if source_bound and(not published_source or published_source<source_bound):return None
            if row.get('attemptedDataIds')and not set(row['attemptedDataIds'])<=set(workflow.get('validatedDataIds',[])):return None
            return proof
        if key.startswith(('workflow:', 'checks:')):
            failed_steps = row.get('failedSteps', [])
            if not failed_steps or any(workflow.get('stepResults', {}).get(f['job'] + '\n' + f['step']) != 'success' for f in failed_steps):return None
            if row.get('attemptedDataIds') and not set(row['attemptedDataIds'])<=set(workflow.get('validatedDataIds',[])):return None
            bound=timestamp(row.get('completedAt'))
            checked=timestamp(workflow.get('completedAt'))
            if bound and (not checked or checked<bound):return None
            if row.get('runId')and workflow.get('runId',0)<row['runId']:return None
            return {'runUrl': workflow.get('runUrl'), 'completedAt': workflow.get('completedAt'), 'checks': failed_steps}
        return {'checkedAt': now, 'scope': key, 'kind': 'observer-or-heartbeat-recovered'}
    proofs = {}
    for key, row in old.items():
        if key in active or retired_reason(row):continue
        proof = resolution_proof(key, row)
        if proof:
            proofs[key] = proof
        else:
            add(key, {**row,'originalKind':row.get('originalKind',row.get('kind')),
                'kind':row.get('kind')if row.get('kind')in('conflict','anomaly','history')else'qualification',
                'proofStatus': 'resolution-unproven', 'action': 'Dernier incident connu conservé : obtenir une preuve ciblée de résolution ou de retrait du périmètre.'})
    retired = [{**row, 'retiredAt': now, 'retirementReason': retired_reason(row),
                'retirementStatus': retirement_status(row),
                'retirementEvidence': state.get('workflows', {}).get(row.get('workflow'), {}).get('retiredDataFailures', {}).get(row.get('dataId'), {}).get('retirementEvidence')}
               for key, row in old.items() if key not in active and retired_reason(row)]
    resolved = [{**row, 'resolvedAt': now, 'resolutionEvidence': proofs.get(key)} for key, row in old.items()
                if key not in active and not retired_reason(row)]
    opened = [row for key, row in active.items() if key not in old]
    # A date/run change alone is not a new incident. Notify only an increased
    # severity, wider impact or additional missing/invalid periods.
    severity = {'checks': 0, 'qualification':0, 'monitoring':1, 'unobserved': 1, 'overdue': 1, 'freshness': 1, 'review': 2, 'collection': 2, 'history': 2, 'conflict': 3, 'anomaly': 3, 'publication': 3}
    escalated = [row for key, row in active.items() if key in old and (
        severity.get(row.get('kind'), 1) > severity.get(old[key].get('kind'), 1)
        or any(set(row.get(field, [])) - set(old[key].get(field, [])) for field in ('tools', 'missingPeriods', 'invalidPeriods')))]
    changed = bool(opened or resolved or escalated or retired)
    revision = previous.get('revision', 0) + int(changed)
    events = previous.get('events', [])
    if changed:
        events = [*events, {'revision': revision, 'at': now, 'opened': [r['id'] for r in opened], 'resolved': resolved, 'retired': retired, 'escalated': [r['id'] for r in escalated]}]
    return {'schemaVersion': 1, 'checkedAt': now, 'revision': revision, 'active': active, 'events': events,
            'resolved': [*resolved, *previous.get('resolved', [])],
            'retired': [*retired, *previous.get('retired', [])]}


def safe(value):
    return re.sub(r'[\r\n]+', ' ', str(value or '')).replace('@', '&#64;').replace('<', '&lt;').replace('>', '&gt;').replace('|', '\\|')[:500]


def issue_body(monitor, repo):
    rows = sorted(monitor['active'].values(), key=lambda r: (r['kind'], r['name'], r['id']))
    lines = [MARKER, f"<!-- monitor-revision:{monitor['revision']} -->", '# Fiabilité des données', '',
             f"{len(rows)} point(s) à examiner. Les retards et contradictions demandent une vérification ; ils ne prouvent pas une erreur de valeur.", '',
             f"[Détail complet dans l’application](https://{repo.split('/')[0]}.github.io/{repo.split('/')[1]}/donnees-a-revoir)", '',
             '| Type | Actif / collecte | Champ | Outils utilisant cet actif ou périmètre du collecteur | Cause |', '| --- | --- | --- | --- | --- |']
    # All incidents remain in JSON/UI; bounded digest fits GitHub's body limit.
    shown = 0
    for row in rows[:40]:
        line = '| ' + ' | '.join(safe(value) for value in [row['kind'], row['name'], row.get('field'), ', '.join(row.get('tools', [])), row.get('cause')]) + ' |'
        if len(('\n'.join(lines) + line).encode()) > 45000:
            break
        lines.append(line)
        shown += 1
    if len(rows) > shown:
        lines.append(f"\n{len(rows) - shown} autre(s) point(s) dans le détail complet.")
    if not rows:
        lines.append('\nRetour à la normale : tous les incidents précédemment suivis sont résolus.')
    return '\n'.join(lines)


def sync_monitoring_issue(monitor, api, repo):
    """One reusable bot issue. Durable comment receipts survive failed retries."""
    issues = []
    for page in range(1, 10000):
        batch = api(f'/issues?state=all&creator=github-actions%5Bbot%5D&per_page=100&page={page}')
        issues.extend(i for i in batch if not i.get('pull_request') and i.get('user', {}).get('login') == 'github-actions[bot]' and MARKER in (i.get('body') or ''))
        if len(batch) < 100:
            break
    if not issues and not monitor['active']:
        return
    body = issue_body(monitor, repo)
    title = f"Fiabilité des données : {len(monitor['active'])} point(s) à examiner" if monitor['active'] else 'Fiabilité des données : retour à la normale'
    receipt = f"<!-- monitor-notified:{monitor['revision']} -->"
    if not issues:
        api('/issues', 'POST', {'title': title, 'body': body + '\n' + receipt})
        return
    issue = max(issues, key=lambda i: i['number'])
    if receipt in (issue.get('body') or ''):
        return
    comments = []
    for page in range(1, 10000):
        batch = api(f"/issues/{issue['number']}/comments?per_page=100&page={page}")
        comments.extend(batch)
        if len(batch) < 100:
            break
    known = {int(match) for text in [issue.get('body') or '', *(c.get('body') or '' for c in comments if c.get('user', {}).get('login') == 'github-actions[bot]')]
             for match in re.findall(r'<!-- monitor-notified:(\d+) -->', text)}
    if monitor['revision'] in known:
        return
    changes = [e for e in monitor.get('events', []) if e['revision'] > max(known, default=-1)]
    recovered = [r for event in changes for r in event['resolved']]
    opened_ids = [id_ for e in changes for id_ in e['opened']]
    opened_rows = [monitor['active'][id_] for id_ in opened_ids if id_ in monitor['active']]
    escalated_ids = {id_ for e in changes for id_ in e.get('escalated', [])}
    escalated_rows = [monitor['active'][id_] for id_ in sorted(escalated_ids) if id_ in monitor['active']]
    # Notify subscribed readers on a new data incident, escalation or recovery.
    # Plain advisory checks keep their quiet period; receipts survive retries.
    material = any(row.get('kind') in ('collection', 'conflict', 'publication', 'freshness', 'history', 'anomaly', 'overdue', 'review') for row in opened_rows)
    now = timestamp(monitor.get('checkedAt'))
    last_comment = max([stamp for c in comments if c.get('user', {}).get('login') == 'github-actions[bot]'
                        and (stamp := timestamp(c.get('created_at')))], default=None)
    quiet = bool(now and last_comment and (now - last_comment).total_seconds() < QUIET_HOURS * 3600)
    closing = not monitor['active']
    recovered_data = any(row.get('originalKind',row.get('kind')) not in ('checks', 'unobserved') for row in recovered)
    comment = (bool(opened_ids) and (material or not quiet)) or bool(escalated_rows) or recovered_data or closing
    receipts = sorted(known | ({monitor['revision']} if not comment else set()))[-30:]
    # Reconcile open/closed state and body before the notification receipt.
    api(f"/issues/{issue['number']}", 'PATCH', {'title': title, 'body': body + '\n' + '\n'.join(f'<!-- monitor-notified:{revision} -->' for revision in receipts), 'state': 'open' if monitor['active'] else 'closed'})
    if not comment:
        return
    opened = len(opened_ids)
    summary = [receipt, f"{opened} nouveau(x) point(s) ; {len(recovered)} retour(s) à la normale ; {len(monitor['active'])} point(s) encore actif(s)."]
    summary += [f"- Nouveau : {safe(r['name'])} · {safe(r.get('field'))} · {safe(r.get('cause'))}" for r in opened_rows[:40]]
    summary += [f"- Aggravation : {safe(r['name'])} · {safe(r.get('field'))} · {safe(r.get('cause'))}" for r in escalated_rows[:40]]
    summary += [f"- Résolu : {safe(r['name'])} · {safe(r.get('field'))}." for r in recovered[:40]]
    summary.append('Le détail regroupé figure dans le corps de cette issue et dans « Données à revoir ».')
    api(f"/issues/{issue['number']}/comments", 'POST', {'body': '\n\n'.join(summary)})
