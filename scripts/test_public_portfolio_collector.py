"""Synthetic transport/schema fixtures; no test investor is shipped in the reserve."""
import copy
import json
import subprocess
import unittest
from unittest.mock import patch
from public_portfolio_collector import parse_getquin, collect_entry, permitted_url

SOURCE = {'id': 'test-only', 'pseudo': 'TEST_FICTIF', 'url': 'https://app.getquin.com/en/dashboard/TestOnly'}
NOW = '2026-11-16T06:00:00Z'

def fixture():
    return {'props': {'pageProps': {'username': 'TEST_FICTIF'}, 'initialState': {'dashboard': {'dashboards': {'TestOnly': {
        'loaded': True, 'failed': False, 'is_sample': False, 'is_covered': True,
        'total': 100, 'profile': {}, 'positions_by_ratio': [
            {'name': 'TEST FICTIF A', 'isin': 'TEST1', 'closed': None, 'breakdown': {'ratio': .6}, 'returns': {'month': {'relative': 0}}},
            {'name': '', 'title': 'TEST FICTIF liquidités', 'isin': '', 'closed': None, 'breakdown': {'ratio': .4}},
        ]}}}}, 'queryClientCache': {'ROOT_QUERY': {'getDashboard({"currency":"USD","uuid":"TestOnly"})': {}}}}}

def html(value):
    return '<script id="__NEXT_DATA__" type="application/json">' + json.dumps(value) + '</script>'

def dashboard(value):
    return value['props']['initialState']['dashboard']['dashboards']['TestOnly']

class PublicPortfolioCollectorTest(unittest.TestCase):
    def test_access_challenge_stops_etoro_only_and_preserves_last_observations(self):
        entry = {'id':'test-only-etoro','platform':'eToro','pseudo':'TEST_FICTIF','url':'https://www.etoro.com/people/TEST_FICTIF/stats'}
        previous = {'lastSuccessAt': NOW, 'observation': {'id':'synthetic-last-valid','positions':[{'name':'TEST FICTIF','weight':100}]}}
        blocked = set()
        with patch('public_portfolio_collector.subprocess.check_output', side_effect=subprocess.CalledProcessError(77, ['synthetic-reader'])) as browser:
            first = collect_entry(entry, previous, '2026-11-17T06:00:00Z', restricted_platforms=blocked)
            second = collect_entry(entry, previous, '2026-11-17T06:00:01Z', restricted_platforms=blocked)
            other = collect_entry(SOURCE, {}, NOW, fetch=lambda _: html(fixture()), restricted_platforms=blocked)
        self.assertEqual(browser.call_count, 1, 'Never open another eToro browser after the access restriction')
        self.assertEqual(blocked, {'eToro'})
        for result in [first, second]:
            self.assertEqual(result['observation'], previous['observation'])
            self.assertEqual(result['lastSuccessAt'], NOW)
            self.assertIn('vérification d’accès', result['error'])
        self.assertFalse(other['error'], 'Other public platforms still refresh independently')

    def test_exhausted_collection_budget_preserves_data_without_another_request(self):
        previous = {'lastSuccessAt': NOW, 'observation': {'id': 'synthetic-last-valid', 'positions': [{'name': 'TEST FICTIF', 'weight': 100}]}}
        with patch('public_portfolio_collector.time.monotonic', return_value=10), patch('public_portfolio_collector.subprocess.check_output') as browser:
            failed = collect_entry(SOURCE, previous, '2026-11-17T06:00:00Z', fetch=lambda _: self.fail('No further request after the deadline'), deadline=9)
        browser.assert_not_called()
        self.assertEqual(failed['observation'], previous['observation'])
        self.assertEqual(failed['lastSuccessAt'], NOW)
        self.assertEqual(failed['attemptedAt'], '2026-11-17T06:00:00Z')
        self.assertIn('durée', failed['error'])

    def test_browser_timeout_uses_the_remaining_collection_budget(self):
        entry = {'id':'test-only-etoro','platform':'eToro','pseudo':'TEST_FICTIF','url':'https://www.etoro.com/people/TEST_FICTIF/stats'}
        with patch('public_portfolio_collector.time.monotonic', return_value=10), patch('public_portfolio_collector.subprocess.check_output', return_value=json.dumps({'source': entry['url'], 'positions': []})) as browser:
            collect_entry(entry, {}, NOW, deadline=12)
        self.assertEqual(browser.call_args.kwargs['timeout'], 2)

    def test_etoro_browser_failure_retains_previous_data(self):
        entry = {'id':'test-only-etoro','platform':'eToro','pseudo':'TEST_FICTIF','url':'https://www.etoro.com/people/TEST_FICTIF/stats'}
        previous = {'lastSuccessAt': NOW, 'observation': {'id':'synthetic-last-valid','positions':[{'name':'TEST FICTIF','weight':100}]}}
        with patch('public_portfolio_collector.subprocess.check_output', side_effect=RuntimeError('Synthetic unavailable public page')):
            failed = collect_entry(entry, previous, '2026-11-17T06:00:00Z')
        self.assertEqual(failed['observation'], previous['observation'])
        self.assertEqual(failed['lastSuccessAt'], NOW)
        self.assertTrue(failed['error'])
    def test_only_source_ratios_and_explicit_currency(self):
        observation = parse_getquin(html(fixture()), SOURCE)
        self.assertEqual(observation['currency'], 'USD')
        self.assertEqual([r['weight'] for r in observation['positions']], [60, 40])
        self.assertEqual(observation['positions'][1]['name'], 'TEST FICTIF liquidités')
        self.assertNotIn('total', observation, 'A covered base-100 figure is not a public amount')
        self.assertNotIn('month', observation, 'Uninitialised returns must never become a reported zero')
        self.assertEqual(observation['effective'], '')
    def test_partial_allocation_never_renormalised(self):
        data = fixture(); dashboard(data)['positions_by_ratio'].pop()
        self.assertEqual(parse_getquin(html(data), SOURCE)['positions'][0]['weight'], 60)
    def test_zero_distinguished_from_absence_and_negative_exposure(self):
        for value in [None, False, -.2, 1.1, float('nan')]:
            with self.subTest(value=value), self.assertRaises((ValueError, KeyError, TypeError)):
                data = fixture(); dashboard(data)['positions_by_ratio'][0]['breakdown']['ratio'] = value
                parse_getquin(html(data), SOURCE)
        data = fixture(); dashboard(data)['positions_by_ratio'][0]['breakdown']['ratio'] = 0
        self.assertEqual(parse_getquin(html(data), SOURCE)['positions'][0]['weight'], 0)
    def test_schema_identity_demo_and_sum_fail_closed(self):
        for mutate in [
            lambda d: dashboard(d).update(is_sample=True),
            lambda d: dashboard(d).update(loaded=False),
            lambda d: dashboard(d).update(positions_by_ratio=[]),
            lambda d: dashboard(d).update(profile={'is_politician': True}),
            lambda d: d['props']['pageProps'].update(username='OTHER'),
            lambda d: d['props'].update(queryClientCache={}),
            lambda d: dashboard(d)['positions_by_ratio'][0].update(isin={'invalid': True}),
            lambda d: dashboard(d)['positions_by_ratio'][0]['breakdown'].update(ratio=.8),
        ]:
            data = fixture(); mutate(data)
            with self.assertRaises((ValueError, KeyError, TypeError)):
                parse_getquin(html(data), SOURCE)
    def test_success_unchanged_then_failure_retains_observation(self):
        first = collect_entry(SOURCE, {}, NOW, fetch=lambda _: html(fixture()))
        self.assertEqual(first['lastSuccessAt'], NOW)
        second = collect_entry(SOURCE, first, '2026-11-17T06:00:00Z', fetch=lambda _: html(fixture()))
        self.assertEqual(first['observation'], second['observation'])
        before = copy.deepcopy(second)
        failed = collect_entry(SOURCE, second, '2026-11-18T06:00:00Z', fetch=lambda _: '<html>CAPTCHA</html>')
        self.assertEqual(second, before)
        self.assertEqual(failed['observation'], second['observation'])
        self.assertEqual(failed['lastSuccessAt'], second['lastSuccessAt'])
        self.assertTrue(failed['error'])
        self.assertEqual(failed['attemptedAt'], '2026-11-18T06:00:00Z')
    def test_public_allowlist(self):
        self.assertTrue(permitted_url(SOURCE['url']))
        for url in ['http://app.getquin.com/en/dashboard/TestOnly', 'https://app.getquin.com/api/private', 'https://app.getquin.com.evil.test/en/dashboard/TestOnly', SOURCE['url']+'?token=secret', 'http://localhost/']:
            self.assertFalse(permitted_url(url))

if __name__ == '__main__': unittest.main()
