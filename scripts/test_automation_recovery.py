import copy
import datetime as dt
import base64
import json
import unittest
from automation_recovery import plan_recovery, dispatch_recovery, persist_and_dispatch

NOW = dt.datetime(2026, 10, 19, 12, tzinfo=dt.timezone.utc)
REGISTRY = {'update-test.yml': {'maxAgeHours': 48}}


class RecoveryTests(unittest.TestCase):
    def state(self, **updates):
        row = {'completedAt': (NOW-dt.timedelta(hours=1)).isoformat(), 'runId': 7,
               'dataFailures': {'fx:TWD': {'cause': 'The read operation timed out'}},
               'lastCollectionSuccessAt': '2026-10-17T00:00:00Z'}
        return {'workflows': {'update-test.yml': {**row, **updates}}}

    def plan(self, state, now=NOW, runs=None, registry=REGISTRY):
        return plan_recovery(state, registry, now, {'update-test.yml': runs or []})

    def test_fresh_dispatch_and_durable_reservation(self):
        state = self.state()
        ledger, plans = self.plan(state)
        self.assertEqual(plans, ['update-test.yml'])
        self.assertEqual(ledger['update-test.yml']['lastSuccessAt'], '2026-10-17T00:00:00Z')
        state['recovery'] = ledger
        self.assertEqual(self.plan(state)[1], [])
        requests = []
        dispatch_recovery(lambda *a: requests.append(a), ledger, plans)
        self.assertEqual(requests, [('/actions/workflows/update-test.yml/dispatches', 'POST', {'ref': 'master'})])
        self.assertEqual(ledger['update-test.yml']['status'], 'dispatched')

    def test_spaced_retries_and_rolling_budget_survive_new_run_ids(self):
        state = self.state()
        for offset in (0, 1, 5):
            state['recovery'], plans = self.plan(state, NOW+dt.timedelta(hours=offset))
            self.assertEqual(plans, ['update-test.yml'])
            state['workflows']['update-test.yml']['runId'] += 1
        ledger, plans = self.plan(state, NOW+dt.timedelta(hours=12))
        self.assertEqual(plans, [])
        self.assertEqual(ledger['update-test.yml']['status'], 'budget-exhausted')
        self.assertEqual(self.plan(state, NOW+dt.timedelta(hours=25))[1], ['update-test.yml'])

    def test_running_newer_run_and_recent_failure_wait(self):
        for runs in [[{'id': 7, 'status': 'in_progress'}], [{'id': 8, 'status': 'completed'}], [{'id': 8, 'status': 'queued'}]]:
            self.assertEqual(self.plan(self.state(), runs=runs)[1], [])
        self.assertEqual(self.plan(self.state(completedAt=(NOW-dt.timedelta(minutes=5)).isoformat()))[1], [])

    def test_recording_failure_recollects_but_validation_failure_does_not(self):
        state = self.state(dataFailures={}, recordingStatus='failure', failures=[{'step': 'Commit validated observations'}])
        ledger, plans = self.plan(state)
        self.assertEqual(plans, ['update-test.yml'])
        self.assertEqual(ledger['update-test.yml']['reason'], 'recording-failed')
        self.assertEqual(self.plan(self.state(dataFailures={}, status='failure', failures=[{'step': 'Validate collected observations'}]))[1], [])

    def test_conflicts_missing_identity_forbidden_and_manual_reviews_not_retried(self):
        for cause in ['Conflicting source timeout', 'Qualification de publication requise', 'Wrong identity', 'HTTP Error 403: Forbidden', 'DWS countries: live evidence differs from active sha256']:
            self.assertEqual(self.plan(self.state(dataFailures={'x': {'cause': cause}}))[1], [])

    def test_silent_collector_resumes_unknown_and_healthy_do_not(self):
        self.assertEqual(self.plan(self.state(completedAt='2026-10-01T00:00:00Z', dataFailures={}))[1], ['update-test.yml'])
        self.assertEqual(self.plan({'workflows': {}})[1], [])
        self.assertEqual(self.plan(self.state(dataFailures={}))[1], [])
        self.assertEqual(self.plan(self.state(dataFailures={}, completedAt='2027-01-01T00:00:00Z'))[1], [])

    def test_exclusions_and_per_tick_budget(self):
        state = self.state()
        row = state['workflows']['update-test.yml']
        workflows = ['onboard-assets.yml', 'rehearse-refresh.yml', 'deploy-pages.yml', 'update-a.yml', 'update-b.yml', 'update-c.yml']
        registry = {w: {'maxAgeHours': 48} for w in workflows}
        state['workflows'] = {w: copy.deepcopy(row) for w in workflows}
        ledger, plans = plan_recovery(state, registry, NOW, {})
        self.assertEqual(plans, ['update-a.yml', 'update-b.yml'])
        self.assertEqual(ledger['update-c.yml']['status'], 'waiting')

    def test_uncertain_dispatch_is_not_retried_in_place(self):
        state = self.state()
        ledger, plans = self.plan(state)
        def fail(*args):
            raise TimeoutError('response lost')
        dispatch_recovery(fail, ledger, plans)
        self.assertEqual(ledger['update-test.yml']['status'], 'dispatch-failed')
        state['recovery'] = ledger
        self.assertEqual(self.plan(state)[1], [])

    def test_durable_reservation_precedes_post_and_conditional_write_prevents_duplicates(self):
        state = self.state()
        state['recovery'], plans = self.plan(state)
        payload = {'sha': 'original', 'content': base64.b64encode(json.dumps(state).encode()).decode()}
        saved, calls = {}, []
        def api(path, method, body):
            calls.append((path, method))
            if method == 'PUT':
                self.assertEqual(body['sha'], 'original' if not saved else 'reserved-sha')
                saved.clear()
                saved.update(json.loads(base64.b64decode(body['content'])))
                return {'content': {'sha': 'reserved-sha'}}
            self.assertEqual(saved['recovery']['update-test.yml']['status'], 'reserved')
            self.assertEqual(self.plan(saved)[1], [])
            self.assertEqual(body, {'ref': 'master'})
        persist_and_dispatch(api, 'automation-status.json', payload, state, plans)
        self.assertEqual([method for _, method in calls], ['PUT', 'POST', 'PUT'])
        self.assertEqual(saved['recovery']['update-test.yml']['status'], 'dispatched')
        calls.clear()
        def conflict(*args):
            calls.append(args)
            raise RuntimeError('status branch changed')
        with self.assertRaises(RuntimeError):
            persist_and_dispatch(conflict, 'automation-status.json', payload, state, plans)
        self.assertEqual(len(calls), 1, 'No dispatch follows a refused reservation write')


if __name__ == '__main__':
    unittest.main()
