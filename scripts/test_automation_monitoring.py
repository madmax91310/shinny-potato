import copy
import unittest
from automation_monitoring import evaluate_monitoring, sync_monitoring_issue, MARKER
from publish_automation_status import normalize_report, update_status

NOW = '2026-10-14T08:00:00Z'
REGISTRY = {'x.yml': {'name': 'Indices', 'maxAgeHours': 48, 'tools': ['Coulisses des indices']}}
CONTEXT = {'schemaVersion': 1, 'alerts': [], 'entities': [{'name': 'MSCI World', 'aliases': ['world'], 'tools': ['Coulisses des indices'], 'field': 'Composition'}]}
STATE = {'workflows': {'x.yml': {'completedAt': NOW, 'status': 'success', 'collectionStatus': 'success'}}}

def evaluate(state, context=CONTEXT, now=NOW, radar=None):
    return evaluate_monitoring(state, context, REGISTRY, now, {'errors': []} if radar is None else radar)

class MonitoringTests(unittest.TestCase):
    def test_failure_keeps_first_seen_and_recovers_once(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml']['dataFailures'] = {'index-world-composition': {'cause': 'Missing weights'}}
        first = evaluate(state)
        incident = next(iter(first['active'].values()))
        self.assertEqual(incident['name'], 'MSCI World')
        self.assertEqual(incident['field'], 'Composition')
        self.assertEqual(incident['tools'], ['Coulisses des indices'])
        state['monitoring'] = first
        again = evaluate(state, now='2026-10-14T09:00:00Z')
        self.assertEqual(again['revision'], 1)
        self.assertEqual(next(iter(again['active'].values()))['firstSeenAt'], NOW)
        state['workflows']['x.yml']['dataFailures'] = {}
        state['monitoring'] = again
        resolved = evaluate(state)
        self.assertEqual(resolved['active'], {})
        self.assertEqual(len(resolved['resolved']), 1)
        state['monitoring'] = resolved
        self.assertEqual(evaluate(state)['revision'], 2)

    def test_changed_official_document_is_a_review_not_a_broken_collector(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml']['dataFailures'] = {
            'clause': {'name': 'Clause', 'cause': 'Clause officielle absente ou modifiée : X | Passage actuel le plus proche : « Y »'},
            'identity': {'name': 'Contrat', 'cause': 'Wrong contract identity | attendu : « A » ; titre actuel : « B »'},
            'network': {'name': 'Réseau', 'cause': 'HTTP Error 403: Forbidden'}}
        active = evaluate(state)['active']
        self.assertEqual(active['collection:x.yml:clause']['kind'], 'review')
        self.assertEqual(active['collection:x.yml:identity']['kind'], 'review')
        self.assertEqual(active['collection:x.yml:network']['kind'], 'collection')

    def test_published_data_with_failed_advisory_check_is_not_a_publication_failure(self):
        state = copy.deepcopy(STATE)
        row = state['workflows']['x.yml']
        row.update({'status': 'failure', 'publicationStatus': 'success',
                    'failures': [{'job': 'deploy / browser-checks (2)', 'step': 'Run node scripts/run-browser-checks.mjs 2 4'},
                                 {'job': 'deploy / advisory-checks', 'step': 'Run echo'}]})
        incident = evaluate(state)['active']['checks:x.yml']
        self.assertEqual((incident['kind'], incident['field']), ('checks', 'Contrôle après publication'))
        self.assertIn('browser-checks (2)', incident['cause'])
        row['failures'][0]['checks'] = ['node scripts/playwright-tools.mjs — strict mode violation']
        named = evaluate(state)['active']['checks:x.yml']['cause']
        self.assertIn('browser-checks (2) : node scripts/playwright-tools.mjs — strict mode violation', named)
        del row['failures'][0]['checks']
        row['publicationStatus'] = 'failure'
        self.assertEqual(evaluate(state)['active']['publication:x.yml']['kind'], 'publication')
        # A failed collector step is never relabelled as a mere check, even when publication succeeded.
        row.update({'publicationStatus': 'success', 'failures': [{'job': 'refresh', 'step': 'Collect observations'}]})
        self.assertEqual(evaluate(state)['active']['workflow:x.yml']['kind'], 'collection')

    def test_silent_collector_and_data_deadline_independent_of_success(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml']['completedAt'] = '2026-10-11T08:00:00Z'
        context = {**CONTEXT, 'alerts': [{'id': 'investor:test', 'name': 'Manager', 'field': 'Portefeuille', 'category': 'stale', 'dueAt': '2026-10-01', 'tools': ['Présentation investisseur']}]}
        result = evaluate(state, context)
        self.assertEqual(set(result['active']), {'overdue:x.yml', 'calendar:investor:test'})
        state['workflows']['x.yml']['completedAt'] = NOW
        self.assertIn('calendar:investor:test', evaluate(state, context)['active'])
        for stamp in [None, 'invalid', '2027-01-01T00:00:00Z']:
            state['workflows']['x.yml']['completedAt'] = stamp
            self.assertIn('unobserved:x.yml', evaluate(state)['active'])

    def test_field_incident_survives_missing_report_and_green_workflow(self):
        context={**CONTEXT,'fieldAlerts':[{'id':'ETF:holdings','name':'ETF','field':'Positions','kind':'collection','cause':'403','checkedAt':'2026-09-01','asOf':'2026-08-31'}]}
        first=evaluate(STATE,context)
        self.assertIn('field:ETF:holdings',first['active'])
        state={**STATE,'monitoring':first}
        missing=evaluate(state,CONTEXT)
        self.assertIn('field:ETF:holdings',missing['active'])
        self.assertEqual(missing['resolved'],[])
        good=evaluate(state,{**CONTEXT,'fieldAlerts':[]})
        self.assertNotIn('field:ETF:holdings',good['active'])
        self.assertEqual(len(good['resolved']),1)
        self.assertEqual(first['active']['field:ETF:holdings']['checkedAt'],'2026-09-01')

    def test_conflict_and_unreadable_radar_cannot_fake_recovery(self):
        radar = {'errors': [{'entity': 'world', 'reason': 'Valeur contradictoire pour la même période (2026-09) : Secteurs'}]}
        first = evaluate(STATE, radar=radar)
        state = {**STATE, 'monitoring': first}
        unreadable = evaluate_monitoring(state, CONTEXT, REGISTRY, NOW, None)
        self.assertTrue(set(first['active']) < set(unreadable['active']))
        self.assertEqual(unreadable['resolved'], [])
        recovered = evaluate({**STATE, 'monitoring': unreadable})
        self.assertEqual(recovered['active'], {})
        self.assertEqual(len(recovered['resolved']), 2)

    def test_investor_report_does_not_clear_another_manager(self):
        def run(n): return {'id': n, 'path': 'update-investor-13f.yml', 'head_branch': 'master', 'event': 'schedule', 'status': 'completed', 'conclusion': 'failure', 'updated_at': f'2026-10-{n:02d}T08:00:00Z', 'html_url': 'https://github.com/test/repo/actions/runs/1'}
        report = {'readyToApply': False, 'managers': [{'slug': 'a', 'status': 'failed', 'reason': '429'}, {'slug': 'b', 'status': 'validated'}]}
        self.assertEqual(normalize_report(report)['successes'], [{'id': 'investor:b'}])
        failed = update_status({}, run(1), [], [report])
        partial = update_status(failed, run(2), [], [{'managers': [{'slug': 'b', 'status': 'validated'}]}])
        self.assertIn('investor:a', partial['workflows']['update-investor-13f.yml']['dataFailures'])
        fixed = update_status(partial, run(3), [], [{'managers': [{'slug': 'a', 'status': 'validated'}]}])
        self.assertEqual(fixed['workflows']['update-investor-13f.yml']['dataFailures'], {})

class FakeAPI:
    def __init__(self, created_at=None):
        self.issue = None
        self.created_at = created_at
        self.comments = []
        self.writes = []
        self.fail_after_comment = False
        self.fail_after_patch = False
    def __call__(self, path, method='GET', body=None):
        if method == 'GET':
            return self.comments if '/comments?' in path else [self.issue] if self.issue else []
        self.writes.append((method, path, body))
        if method == 'POST' and path == '/issues':
            self.issue = {**body, 'number': 1, 'state': 'open', 'user': {'login': 'github-actions[bot]'}}
            return self.issue
        if method == 'PATCH':
            self.issue.update(body)
            if self.fail_after_patch:
                self.fail_after_patch = False
                raise TimeoutError('Response lost after issue update')
            return self.issue
        self.comments.append({**body, 'user': {'login': 'github-actions[bot]'}, **({'created_at': self.created_at} if self.created_at else {})})
        if self.fail_after_comment:
            self.fail_after_comment = False
            raise TimeoutError('Response lost after GitHub accepted comment')
        return self.comments[-1]

class NotificationTests(unittest.TestCase):
    def test_one_issue_dedup_recovery_reopen_and_retry_receipt(self):
        api = FakeAPI()
        first = evaluate({})
        sync_monitoring_issue(first, api, 'test/repo')
        self.assertEqual(len(api.writes), 1)
        sync_monitoring_issue(first, api, 'test/repo')
        self.assertEqual(len(api.writes), 1)
        resolved = evaluate({**STATE, 'monitoring': first})
        api.fail_after_comment = True
        with self.assertRaises(TimeoutError): sync_monitoring_issue(resolved, api, 'test/repo')
        self.assertEqual(api.issue['state'], 'closed')
        count = len(api.writes)
        sync_monitoring_issue(resolved, api, 'test/repo')
        self.assertEqual(len(api.writes), count)
        reopened = evaluate({'monitoring': resolved})
        sync_monitoring_issue(reopened, api, 'test/repo')
        self.assertEqual(api.issue['state'], 'open')
        self.assertEqual(sum(path == '/issues' for _, path, _ in api.writes), 1)
        self.assertIn('retour(s) à la normale', api.comments[0]['body'])
    def test_retry_after_body_patch_keeps_prior_notification_receipts(self):
        api = FakeAPI()
        first = evaluate({})
        sync_monitoring_issue(first, api, 'test/repo')
        resolved = evaluate({**STATE, 'monitoring': first})
        api.fail_after_patch = True
        with self.assertRaises(TimeoutError): sync_monitoring_issue(resolved, api, 'test/repo')
        sync_monitoring_issue(resolved, api, 'test/repo')
        self.assertIn('0 nouveau(x)', api.comments[0]['body'])
        self.assertEqual(len(api.comments), 1)

    def test_flapping_checks_update_the_body_without_a_new_comment(self):
        # Comments posted within the quiet period: a check that fails again, then a
        # recovery, only rewrite the body and record their receipts there.
        api = FakeAPI(created_at=NOW)
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml'].update({'status': 'failure', 'publicationStatus': 'success', 'failures': [{'job': 'deploy / browser-checks (0)', 'step': 'Run node scripts/run-browser-checks.mjs 0 4'}]})
        first = evaluate(state)
        sync_monitoring_issue(first, api, 'test/repo')
        self.assertEqual(len(api.comments), 0, 'La création de l’issue suffit')
        state['workflows']['x.yml'].update({'status': 'success', 'failures': []})
        partial = evaluate({**state, 'monitoring': first}, now='2026-10-14T09:00:00Z')
        partial['active']['keep'] = {'id': 'keep', 'kind': 'checks', 'name': 'Autre', 'field': 'Contrôle', 'cause': 'x', 'tools': []}
        sync_monitoring_issue(partial, api, 'test/repo')
        self.assertEqual(len(api.comments), 0)
        self.assertIn(f"<!-- monitor-notified:{partial['revision']} -->", api.issue['body'])
        again = evaluate({**state, 'monitoring': partial}, now='2026-10-14T10:00:00Z')
        again['active']['keep'] = partial['active']['keep']
        again['active']['flap'] = {'id': 'flap', 'kind': 'checks', 'name': 'Autre', 'field': 'Contrôle', 'cause': 'y', 'tools': []}
        again['revision'] += 1; again['events'].append({'revision': again['revision'], 'at': '2026-10-14T10:00:00Z', 'opened': ['flap'], 'resolved': []})
        api.created_at = '2026-10-14T10:00:00Z'
        sync_monitoring_issue(again, api, 'test/repo')
        self.assertEqual(len(api.comments), 1, 'Premier contrôle en échec après une période sans commentaire')
        flap = evaluate({**state, 'monitoring': again}, now='2026-10-14T10:15:00Z')
        flap['active'].update({'keep': again['active']['keep'], 'flap2': {'id': 'flap2', 'kind': 'checks', 'name': 'Autre', 'field': 'Contrôle', 'cause': 'y2', 'tools': []}})
        flap['revision'] += 1; flap['events'].append({'revision': flap['revision'], 'at': '2026-10-14T10:15:00Z', 'opened': ['flap2'], 'resolved': []})
        sync_monitoring_issue(flap, api, 'test/repo')
        self.assertEqual(len(api.comments), 1, 'Un contrôle qui rechute pendant la période calme ne commente pas')
        self.assertIn(f"<!-- monitor-notified:{flap['revision']} -->", api.issue['body'])
        # A data incident is always worth a comment, whatever the spacing.
        state['workflows']['x.yml']['dataFailures'] = {'index-world-composition': {'cause': 'Missing weights'}}
        data = evaluate({**state, 'monitoring': flap}, now='2026-10-14T10:30:00Z')
        sync_monitoring_issue(data, api, 'test/repo')
        self.assertEqual(len(api.comments), 2)
        self.assertIn('Nouveau : MSCI World', api.comments[1]['body'])
        # After the quiet period, a check incident is reported again.
        late = evaluate({**state, 'monitoring': data}, now='2026-10-14T20:00:00Z')
        late['active']['late'] = {'id': 'late', 'kind': 'checks', 'name': 'Tardif', 'field': 'Contrôle', 'cause': 'z', 'tools': []}
        late['revision'] += 1; late['events'].append({'revision': late['revision'], 'at': '2026-10-14T20:00:00Z', 'opened': ['late'], 'resolved': []})
        sync_monitoring_issue(late, api, 'test/repo')
        self.assertEqual(len(api.comments), 3)

    def test_healthy_first_pass_does_not_notify(self):
        api = FakeAPI()
        sync_monitoring_issue(evaluate(STATE), api, 'test/repo')
        self.assertEqual(api.writes, [])


class AlertCenterTests(unittest.TestCase):
    def test_escalation_ignores_runs_dates_and_repeated_failure(self):
        context = {**CONTEXT, 'historyAlerts': [{'id': 'fund:gaps', 'name': 'Fund', 'kind': 'history', 'field': 'Monthly', 'cause': 'Missing month', 'missingPeriods': ['2026-07'], 'tools': ['Performance depuis']}]}
        first = evaluate(STATE, context)
        state = {**STATE, 'monitoring': first}
        again = evaluate(state, context, now='2026-10-14T09:00:00Z')
        self.assertEqual(first['revision'], again['revision'])
        context = copy.deepcopy(context)
        context['historyAlerts'][0]['missingPeriods'].append('2026-08')
        worse = evaluate(state, context)
        self.assertEqual(worse['revision'], first['revision'] + 1)
        self.assertEqual(worse['events'][-1]['escalated'], ['history:fund:gaps'])
        self.assertEqual(worse['active']['history:fund:gaps']['firstSeenAt'], NOW)
        # Recovery is not inferred from the collector run: the gap must disappear.
        unreadable = evaluate({**STATE, 'monitoring': worse}, CONTEXT)
        self.assertIn('history:fund:gaps', unreadable['active'])
        recovered = evaluate({**STATE, 'monitoring': worse}, {**CONTEXT, 'historyAlerts': []})
        self.assertFalse(recovered['active'])
        self.assertEqual(len(recovered['resolved']), 1)

    def test_anomaly_and_last_success_are_preserved(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml'].update(lastCollectionSuccessAt='2026-10-10T08:00:00Z', dataFailures={'index-world-composition': {'cause': 'Suspicious ETF change'}})
        row = evaluate(state)['active']['collection:x.yml:index-world-composition']
        self.assertEqual(row['kind'], 'anomaly')
        self.assertEqual(row['lastSuccessAt'], '2026-10-10T08:00:00Z')

    def test_partial_data_recovery_and_escalation_notify_once(self):
        api = FakeAPI(created_at=NOW)
        context = {**CONTEXT, 'historyAlerts': [
            {'id': 'a', 'name': 'A', 'kind': 'history', 'cause': 'Missing', 'missingPeriods': ['2026-07'], 'tools': []},
            {'id': 'b', 'name': 'B', 'kind': 'history', 'cause': 'Missing', 'missingPeriods': ['2026-07'], 'tools': []}]}
        first = evaluate(STATE, context)
        sync_monitoring_issue(first, api, 'test/repo')
        context = copy.deepcopy(context)
        context['historyAlerts'][0]['missingPeriods'].append('2026-08')
        worse = evaluate({**STATE, 'monitoring': first}, context)
        sync_monitoring_issue(worse, api, 'test/repo')
        self.assertIn('Aggravation : A', api.comments[-1]['body'])
        count = len(api.writes)
        sync_monitoring_issue(worse, api, 'test/repo')
        self.assertEqual(len(api.writes), count)
        context['historyAlerts'] = context['historyAlerts'][1:]
        partial = evaluate({**STATE, 'monitoring': worse}, context)
        sync_monitoring_issue(partial, api, 'test/repo')
        self.assertEqual(len(api.comments), 2)
        self.assertIn('Résolu : A', api.comments[-1]['body'])
        self.assertEqual(api.issue['state'], 'open')
        same = evaluate({**STATE, 'monitoring': partial}, context, now='2026-10-14T10:00:00Z')
        sync_monitoring_issue(same, api, 'test/repo')
        self.assertEqual(len(api.comments), 2)

if __name__ == '__main__': unittest.main()
