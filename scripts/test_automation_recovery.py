import copy
import datetime as dt
import base64
import json
import unittest
from pathlib import Path
from automation_recovery import recovery_reason
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

    def test_manual_radar_never_recovers_even_with_old_reservations(self):
        root = Path(__file__).resolve().parents[1]
        registry = json.loads((root / 'src/data/automation-workflows.json').read_text())
        config = registry['update-editorial-radar.yml']
        self.assertIs(config['automatic'], False)
        for updates in [dict(completedAt='2026-01-01T00:00:00Z'),
                        dict(recordingStatus='failure', failures=[{'step':'Commit validated observations'}]),
                        dict(status='failure', failures=[{'step':'HTTP 503 timeout'}])]:
            row = self.state(**updates)['workflows']['update-test.yml']
            self.assertIsNone(recovery_reason(row, config, NOW))
            state = {'workflows': {'update-editorial-radar.yml': row},
                     'recovery': {'update-editorial-radar.yml': {'status':'waiting', 'attempts':[{'at':'2026-10-18T00:00:00Z'}]}}}
            ledger, plans = plan_recovery(state, registry, NOW, {})
            self.assertNotIn('update-editorial-radar.yml', plans)
            self.assertEqual(ledger['update-editorial-radar.yml']['status'], 'idle')
            self.assertIsNone(ledger['update-editorial-radar.yml']['nextAttemptAt'])
        # The same temporary failure still recovers on a financial collector.
        self.assertEqual(self.plan(self.state())[1], ['update-test.yml'])

    def test_radar_only_manual_production_and_read_only_pr_validation(self):
        root = Path(__file__).resolve().parents[1]
        text = (root / '.github/workflows/update-editorial-radar.yml').read_text()
        events = text.split('on:\n', 1)[1].split('permissions:', 1)[0]
        self.assertEqual(__import__('re').findall(r'^  ([a-z_]+):', events, __import__('re').M), ['workflow_dispatch', 'pull_request'])
        update = text.split('  update:\n', 1)[1].split('  report-failures:', 1)[0]
        self.assertIn("if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/master'", update)
        self.assertIn('&& inputs.collect == true', update)
        dispatch = text.split('  workflow_dispatch:', 1)[1].split('  pull_request:', 1)[0]
        self.assertIn('type: boolean', dispatch)
        self.assertIn('default: false', dispatch)
        self.assertIn('required: true', dispatch)
        self.assertIn('ref: master', update)
        self.assertIn("if: github.event_name == 'pull_request'", text.split('  update:', 1)[0])
        self.assertNotIn('publish-editorial-radar.mjs', text.split('  update:', 1)[0])
        self.assertIn('contents: read', text.split('jobs:', 1)[0])

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
        for runs in [[{'id': 7, 'status': 'in_progress'}], [{'id': 8, 'status': 'completed'}], [{'id': 8, 'status': 'queued'}],
                     [{'id':7,'run_attempt':2,'status':'completed'}]]:
            self.assertEqual(self.plan(self.state(), runs=runs)[1], [])
        self.assertEqual(self.plan(self.state(completedAt=(NOW-dt.timedelta(minutes=5)).isoformat()))[1], [])

    def test_completed_cancelled_run_is_not_an_unobserved_source_success(self):
        for conclusion in ['cancelled','skipped','neutral']:
            ledger,plans=self.plan(self.state(),runs=[{'id':8,'status':'completed','conclusion':conclusion}])
            self.assertEqual(plans,['update-test.yml']);self.assertEqual(ledger['update-test.yml']['lastSuccessAt'],'2026-10-17T00:00:00Z')
        self.assertEqual(self.plan(self.state(),runs=[{'id':8,'status':'in_progress','conclusion':'cancelled'}])[1],[])

    def test_future_reservation_survives_clock_skew_without_duplicate_dispatch(self):
        state=self.state()
        reserved={'at':(NOW+dt.timedelta(minutes=2)).isoformat(),'status':'reserved','ref':'master'}
        state['recovery']={'update-test.yml':{'attempts':[reserved]}}
        ledger,plans=self.plan(state)
        self.assertEqual(plans,[])
        self.assertEqual(ledger['update-test.yml']['attempts'],[reserved])
        self.assertEqual(ledger['update-test.yml']['status'],'waiting')

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
