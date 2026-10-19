"""Incident lifecycle and one grouped GitHub notification, independent of Pages."""
import datetime as dt
import hashlib
import json
import re

MARKER = '<!-- data-reliability-monitor:v1 -->'
QUIET_HOURS = 6  # minimum spacing between comments that only report checks or recoveries

def timestamp(value):
    try:
        return dt.datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(dt.timezone.utc)
    except (ValueError, AttributeError, TypeError):
        return None


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
        active[key] = {**row, 'id': key, 'firstSeenAt': old.get(key, {}).get('firstSeenAt', now), 'lastSeenAt': now}
    for workflow, config in registry.items():
        row = state.get('workflows', {}).get(workflow, {})
        tools = config.get('tools', [])
        base = {'name': config['name'], 'tools': tools, 'impactScope': 'collector', 'workflow': workflow, 'runUrl': row.get('runUrl'), 'to': '/donnees-a-revoir', 'lastSuccessAt': row.get('lastCollectionSuccessAt')}
        completed = timestamp(row.get('completedAt'))
        if not completed or completed > current:
            add('unobserved:' + workflow, {**base, 'kind': 'unobserved', 'field': 'Exécution', 'cause': 'Aucune exécution terminée avec une date exploitable.'})
        elif (current - completed).total_seconds() > config['maxAgeHours'] * 3600:
            add('overdue:' + workflow, {**base, 'kind': 'overdue', 'field': 'Fréquence de collecte', 'cause': f"Aucune exécution terminée depuis plus de {config['maxAgeHours']} heures.", 'lastSuccessAt': row.get('lastCollectionSuccessAt')})
        for identifier, failure in row.get('dataFailures', {}).items():
            details = incident_context(identifier, context, failure.get('name', identifier))
            if not details['tools']:
                details['tools'] = tools
            # An official document that changed wording or identity is not a broken collector:
            # the previous value is kept and a person must compare old and new text.
            review = any(marker in str(failure.get('cause', '')) for marker in SOURCE_CHANGE_MARKERS)
            add(f'collection:{workflow}:{identifier}', {**base, **failure, **details, 'tools': details['tools'], 'kind': 'review' if review else 'anomaly' if 'Suspicious' in str(failure.get('cause', '')) else 'collection',
                'field': failure.get('field') or ('Composition' if identifier.endswith('-composition') else 'Performances' if identifier.endswith('-returns') else 'Champs du collecteur'),
                'dataId': identifier})
        if row.get('status') == 'failure' and (not row.get('dataFailures') or row.get('publicationStatus') == 'failure'):
            publishing = row.get('publicationStatus') == 'failure'
            # Data-only lane: the data reached the site; only a check after publication needs repair.
            checks_only = (not publishing and row.get('publicationStatus') == 'success' and row.get('failures')
                           and all(f['job'].startswith('deploy /') for f in row['failures']))
            kind = 'publication' if publishing else 'checks' if checks_only else 'collection'
            add(f"{'workflow' if kind == 'collection' else kind}:{workflow}", {**base, 'kind': kind,
                'field': {'publication': 'Publication', 'checks': 'Contrôle après publication'}.get(kind, 'Exécution du collecteur'),
                'cause': ' ; '.join(f"{f['job']} : {' / '.join(f['checks']) if f.get('checks') else f['step']}" for f in row.get('failures', [])) or 'Exécution en échec ; consulter le journal.'})
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
            key = 'radar:' + hashlib.sha256(json.dumps(error, sort_keys=True).encode()).hexdigest()[:24]
            details = incident_context(error.get('entity', ''), context, error.get('entity', 'Radar'))
            field = re.search(r'\) : (.+?)\. Dernière observation', error['reason'])
            add(key, {**details, 'kind': 'conflict', 'field': field.group(1) if field else 'Concordance des sources', 'cause': error['reason']})
    resolved = [{**row, 'resolvedAt': now} for key, row in old.items() if key not in active]
    opened = [row for key, row in active.items() if key not in old]
    # A date/run change alone is not a new incident. Notify only an increased
    # severity, wider impact or additional missing/invalid periods.
    severity = {'checks': 0, 'unobserved': 1, 'overdue': 1, 'freshness': 1, 'review': 2, 'collection': 2, 'history': 2, 'conflict': 3, 'anomaly': 3, 'publication': 3}
    escalated = [row for key, row in active.items() if key in old and (
        severity.get(row.get('kind'), 1) > severity.get(old[key].get('kind'), 1)
        or any(set(row.get(field, [])) - set(old[key].get(field, [])) for field in ('tools', 'missingPeriods', 'invalidPeriods')))]
    changed = bool(opened or resolved or escalated)
    revision = previous.get('revision', 0) + int(changed)
    events = previous.get('events', [])
    if changed:
        events = [*events, {'revision': revision, 'at': now, 'opened': [r['id'] for r in opened], 'resolved': resolved, 'escalated': [r['id'] for r in escalated]}][-30:]
    return {'schemaVersion': 1, 'checkedAt': now, 'revision': revision, 'active': active, 'events': events,
            'resolved': [*resolved, *previous.get('resolved', [])][:100]}


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
    recovered_data = any(row.get('kind') not in ('checks', 'unobserved') for row in recovered)
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
