"""Keep the provider failure, retained observation and independent check failure distinct."""
import copy
import unittest
from collect_ai_portfolios import observation_report
from automation_monitoring import evaluate_monitoring
from publish_automation_status import REGISTRY, update_status

WORKFLOW = 'update-ai-portfolios.yml'
ASSET = 'IE00B5BMR087-XLON-CSPX-USD'
NOW = '2026-10-24T06:00:00Z'
ROUTE = 'https://query2.finance.yahoo.com/v8/finance/chart/CSPX.L?interval=1d'
RUN = {'id': 999, 'path': '.github/workflows/' + WORKFLOW, 'head_branch': 'master',
       'event': 'workflow_dispatch', 'status': 'completed', 'conclusion': 'failure',
       'created_at': NOW, 'updated_at': NOW, 'html_url': 'https://github.com/example/actions/runs/999'}
CONTEXT = {'schemaVersion': 1, 'alerts': [], 'entities': [{'name': 'S&P 500', 'aliases': ['IE00B5BMR087'],
           'tools': ['Présentation ETF', 'Duels de portefeuilles'], 'to': '/comparatif-etf', 'sourceUrls': ['https://issuer.example/nav']}]}


class DailyIncidentContext(unittest.TestCase):
    def report(self):
        return observation_report({ASSET: {'ok': False, 'error': 'Clôtures attendues manquantes : 2026-10-23',
            'requestedUrl': ROUTE, 'attemptedAt': NOW, 'lastValidAsOf': '2026-10-22',
            'lastSuccess': '2026-10-23T10:39:50Z'}, 'ECB': {'ok': True}})

    def evaluate(self, state):
        return evaluate_monitoring(state, CONTEXT, {WORKFLOW: REGISTRY[WORKFLOW]}, NOW, {'errors': []})

    def test_retained_value_and_success_are_not_redated_by_a_failed_check(self):
        report = self.report()
        self.assertEqual(report['successes'], [{'id': 'ECB'}])
        state = update_status({}, RUN, [], [report])
        item = self.evaluate(state)['active']['collection:' + WORKFLOW + ':' + ASSET]
        self.assertEqual(item['asOf'], '2026-10-22')
        self.assertEqual(item['lastSuccessAt'], '2026-10-23T10:39:50Z')
        self.assertEqual(item['attemptedAt'], NOW)
        self.assertEqual(item['missingPeriods'], ['2026-10-23'])

    def test_daily_ia_failure_does_not_implicate_independent_annual_tools(self):
        state = update_status({}, RUN, [], [self.report()])
        item = self.evaluate(state)['active']['collection:' + WORKFLOW + ':' + ASSET]
        self.assertEqual(item['tools'], ['Portefeuilles IA'])
        self.assertEqual(item['to'], '/portefeuilles-ia')
        self.assertEqual(item['sourceUrls'], [ROUTE])

    def test_unknown_source_proof_stays_unknown(self):
        report = observation_report({ASSET: {'ok': False, 'error': 'Source indisponible', 'attemptedAt': NOW}})
        state = update_status({}, RUN, [], [report])
        state['workflows'][WORKFLOW]['lastCollectionSuccessAt'] = '2026-10-20T12:00:00Z'
        item = self.evaluate(state)['active']['collection:' + WORKFLOW + ':' + ASSET]
        self.assertIsNone(item['lastSuccessAt'])
        self.assertIsNone(item['asOf'])
        self.assertEqual(item['sourceUrls'], [])

    def test_validation_fault_is_not_hidden_by_a_provider_fault(self):
        jobs = [{'name': 'refresh', 'conclusion': 'failure', 'steps': [
            {'name': 'Collect exact daily closes and ECB FX', 'conclusion': 'failure'},
            {'name': 'Validate every selectable equity against the accounting engine', 'conclusion': 'failure'}]}]
        state = update_status({}, RUN, jobs, [self.report()])
        self.assertEqual(state['workflows'][WORKFLOW]['validationStatus'], 'failure')
        active = self.evaluate(state)['active']
        self.assertEqual(set(active), {'checks:' + WORKFLOW, 'collection:' + WORKFLOW + ':' + ASSET})
        self.assertEqual(active['checks:' + WORKFLOW]['kind'], 'checks')
        self.assertIn('accounting engine', active['checks:' + WORKFLOW]['cause'])

    def test_legacy_failed_step_is_still_diagnosed_without_rewriting_the_run(self):
        state = update_status({}, RUN, [], [self.report()])
        state['workflows'][WORKFLOW].update(validationStatus='not-run', failures=[
            {'job': 'refresh', 'step': 'Validate every selectable equity against the accounting engine'}])
        original = copy.deepcopy(state)
        self.assertIn('checks:' + WORKFLOW, self.evaluate(state)['active'])
        self.assertEqual(state, original)

    def test_recovery_closes_only_the_proven_provider_episode(self):
        state = update_status({}, RUN, [], [self.report()])
        first = self.evaluate(state);state['monitoring'] = first
        recovered = update_status(state, {**RUN, 'id': 1000, 'conclusion': 'success'}, [],
                                 [{'successes': [{'id': ASSET}], 'errors': []}])
        after = self.evaluate(recovered)
        self.assertFalse(after['active'])
        self.assertEqual(after['resolved'][0]['firstSeenAt'], first['active']['collection:' + WORKFLOW + ':' + ASSET]['firstSeenAt'])


if __name__ == '__main__':
    unittest.main()
