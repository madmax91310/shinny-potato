import copy
import datetime as dt
import base64
import json
import unittest
from pathlib import Path
from automation_status_storage import scope_key, expand_report_scopes
from automation_recovery import (recovery_reason, plan_recovery, dispatch_recovery,
                                 persist_and_dispatch, monthly_recording_scope)

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


SCOPE_WORKFLOW = 'update-market-monthly.yml'
SCOPE_NOW = dt.datetime(2026, 11, 6, 17, tzinfo=dt.timezone.utc)


class MonthlyRecoveryScope(unittest.TestCase):
    def setUp(self):
        self.state = json.loads((Path(__file__).parent / 'fixtures/monthly-recovery-scope-20261106.json').read_text())['state']

    def dispatch(self, state=None):
        state = self.state if state is None else state
        ledger, plans = plan_recovery(state, {SCOPE_WORKFLOW: {'maxAgeHours': 48}}, SCOPE_NOW, {SCOPE_WORKFLOW: []})
        self.assertEqual(plans, [SCOPE_WORKFLOW])
        # This is the exact durable reservation, not mutable state read at POST.
        reserved = json.loads(json.dumps(ledger))
        calls = []
        dispatch_recovery(lambda *args: calls.append(args), reserved, plans)
        self.assertEqual(calls[0][:2], ('/actions/workflows/'+SCOPE_WORKFLOW+'/dispatches', 'POST'))
        self.assertEqual(reserved[SCOPE_WORKFLOW]['status'], 'dispatched')
        self.assertEqual(reserved[SCOPE_WORKFLOW]['lastSuccessAt'], ledger[SCOPE_WORKFLOW]['lastSuccessAt'])
        return calls[0][2], ledger

    def row(self):
        return self.state['workflows'][SCOPE_WORKFLOW]

    def test_actual_ngas_failure_recollects_exactly_one_series_on_master(self):
        original = copy.deepcopy(self.state)
        payload, ledger = self.dispatch()
        self.assertEqual(payload, {'ref': 'master', 'inputs': {'series': 'etc_natural_gasNav'}})
        self.assertEqual(ledger[SCOPE_WORKFLOW]['dispatchScope']['sourceRunId'], 42235436731)
        self.assertEqual(ledger[SCOPE_WORKFLOW]['dispatchScope']['expectedIdsCount'], 1)
        self.assertTrue(ledger[SCOPE_WORKFLOW]['dispatchScope']['oldReportQualificationUnchanged'])
        self.assertEqual(original, self.state)
        self.assertFalse(self.row()['reportEvidenceHistory'][0]['scopePlanVerified'])

    def test_empty_justified_retry_and_partition_keep_their_selection(self):
        for scope, expected in [
                ({'expectedIds': [], 'requestedIds': [], 'selection': 'failed-or-missing'}, {'retry_failed': True}),
                ({'expectedIds': ['x', 'deferred'], 'requestedIds': ['x'], 'selection': 'partitioned'}, {'series': 'x'})]:
            state = copy.deepcopy(self.state)
            proof = state['workflows'][SCOPE_WORKFLOW]['reportEvidenceHistory'][0]['successes'][0]['evidence']
            ref = scope_key(scope);proof['scopeRef'] = ref;state['reportScopes'] = {ref: scope}
            payload, ledger = self.dispatch(state)
            self.assertEqual(payload, {'ref': 'master', 'inputs': expected})
            self.assertEqual(ledger[SCOPE_WORKFLOW]['dispatchScope']['requestedIdsCount'], len(scope['requestedIds']))
            self.assertEqual(ledger[SCOPE_WORKFLOW]['dispatchScope']['expectedIdsCount'], len(scope['expectedIds']))

    def test_existing_inline_reader_contract_and_packed_contract_agree(self):
        inline = expand_report_scopes(self.state)
        self.assertEqual(self.dispatch(inline)[0], self.dispatch()[0])

    def test_scope_is_not_derived_from_success_or_failure_instrument_ids(self):
        self.row()['validatedDataIds'] = ['history:some-other-success']
        self.row()['attemptedDataIds'] = ['history:some-other-attempt']
        self.assertEqual(self.dispatch()[0]['inputs']['series'], 'etc_natural_gasNav')

    def test_stale_runs_and_other_attempts_do_not_supply_a_scope(self):
        for key, value in [('runId', 1), ('attempt', 2)]:
            with self.subTest(key=key):
                state = copy.deepcopy(self.state)
                state['workflows'][SCOPE_WORKFLOW]['reportEvidenceHistory'][0][key] = value
                self.assertEqual(self.dispatch(state)[0], {'ref': 'master'})

    def test_missing_unknown_tampered_or_empty_scope_is_not_invented(self):
        cases = []
        for value in [{}, {'expectedIds': [], 'requestedIds': []},
                      {'expectedIds': ['x'], 'requestedIds': ['different']},
                      {'expectedIds': ['x', 'x'], 'requestedIds': ['x', 'x']},
                      {'expectedIds': ['x,y'], 'requestedIds': ['x,y']},
                      {'expectedIds': [True], 'requestedIds': [True]}]:
            state = copy.deepcopy(self.state)
            proof = state['workflows'][SCOPE_WORKFLOW]['reportEvidenceHistory'][0]['successes'][0]['evidence']
            ref = scope_key(value); proof['scopeRef'] = ref; state['reportScopes'] = {ref: value}
            cases.append(state)
        state = copy.deepcopy(self.state);state['workflows'][SCOPE_WORKFLOW]['reportEvidenceHistory'][0]['schema'] = 'unknown';cases.append(state)
        state = copy.deepcopy(self.state);state['workflows'][SCOPE_WORKFLOW]['reportEvidenceHistory'][0]['scopeExplicit'] = False;cases.append(state)
        state = copy.deepcopy(self.state);state['workflows'][SCOPE_WORKFLOW]['reportEvidenceHistory'][0]['successes'][0]['evidence']['scopeRef'] = ['malformed'];cases.append(state)
        state = copy.deepcopy(self.state);state['reportScopes'] = None;cases.append(state)
        state = copy.deepcopy(self.state);state['reportScopes'] = {};cases.append(state)
        state = copy.deepcopy(self.state);next(iter(state['reportScopes'].values()))['expectedIds'] = ['tampered'];cases.append(state)
        state = copy.deepcopy(self.state);state['reportScopeSchemaVersion'] = 2;cases.append(state)
        state = copy.deepcopy(self.state);state['workflows'][SCOPE_WORKFLOW]['reportEvidenceHistory'] = [];cases.append(state)
        for i, state in enumerate(cases):
            with self.subTest(case=i):
                self.assertEqual(self.dispatch(state)[0], {'ref': 'master'})
                self.assertNotIn('dispatchScope', self.dispatch(state)[1][SCOPE_WORKFLOW])

    def test_no_old_dispatch_inputs_leak_into_a_later_unknown_run(self):
        _, ledger = self.dispatch()
        self.state['recovery'] = ledger
        self.row()['runId'] += 1
        # Outside retry cooldown, but before rolling budget expires.
        ledger, plans = plan_recovery(self.state, {SCOPE_WORKFLOW: {'maxAgeHours': 48}}, SCOPE_NOW+dt.timedelta(hours=2), {SCOPE_WORKFLOW: []})
        self.assertEqual(plans, [SCOPE_WORKFLOW]);self.assertNotIn('dispatchScope', ledger[SCOPE_WORKFLOW])
        calls=[];dispatch_recovery(lambda *args:calls.append(args),ledger,plans)
        self.assertEqual(calls[0][2], {'ref': 'master'})

    def test_other_reasons_keep_their_ordinary_selection(self):
        for reason in ['silent-collector', 'transient-source', 'transient-run', None]:
            self.assertIsNone(monthly_recording_scope(self.state, self.row(), reason))

    def test_ambiguous_current_report_versions_do_not_choose_a_selection(self):
        other = copy.deepcopy(self.row()['reportEvidenceHistory'][0]);other['sha256']='b'*64
        other['successes'][0]['evidence']['sha256']='b'*64
        self.row()['reportEvidenceHistory'].append(other)
        self.assertEqual(self.dispatch()[0], {'ref':'master'})



if __name__ == '__main__':
    unittest.main()
