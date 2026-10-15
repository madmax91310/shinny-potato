import datetime as dt
import unittest
from unittest.mock import patch
from refresh_company_universe import collect, select_revenue_concept


class UniverseTests(unittest.TestCase):
    def test_annual_fallback_preserves_newer_quarter_and_its_date(self):
        old={'annual':{'end':'2025-12-31'},'quarter':{'end':'2026-06-30','sourceUrl':'https://issuer.example/quarter','durationMonths':3},'accountsObservedAt':'2026-10-01'}
        fallback={'annual':{'end':'2025-12-31'},'quarter':None,'history':[{'end':'2025-12-31'}],
                  'sourceUrl':'https://secondary.example/annual','decision':{},'provenance':{}}
        from copy import deepcopy
        original=deepcopy(old)
        with patch('refresh_company_universe.fetch_json',side_effect=OSError('offline')), \
             patch('company_standard_financials.collect',return_value=fallback), \
             patch('refresh_company_universe.validate_decision',side_effect=lambda d,*a:d), \
             patch('refresh_company_universe.collect_forecast',side_effect=OSError('offline')), \
             patch('refresh_company_universe.qualify_share_basis',side_effect=OSError('offline')):
            item,status=collect({'symbol':'TEST','cik':'0000000001'},old,dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
        self.assertEqual(status['accounts'],'updated')
        self.assertEqual(item['quarter']['sourceUrl'],old['quarter']['sourceUrl'])
        self.assertEqual(item['quarter']['observedAt'],'2026-10-01')
        self.assertEqual(item['accountsObservedAt'],'2026-10-15')
        self.assertEqual(item['decision']['accountsEndAtCollection'],'2026-06-30')
        self.assertEqual(old,original)

    def setUp(self):
        self.today = dt.date(2026, 10, 14)
        self.profile = {'id': 'test', 'symbol': 'TEST', 'currency': 'USD', 'cik': '0000000001'}

    def fact(self, value):
        return {'start': '2025-01-01', 'end': '2025-12-31', 'filed': '2026-02-01', 'form': '10-K', 'val': value}

    def test_revenue_scopes_are_not_combined(self):
        body = {'facts': {'us-gaap': {
            'RevenueFromContractWithCustomerExcludingAssessedTax': {'units': {'USD': [self.fact(100)]}},
            'Revenues': {'units': {'USD': [self.fact(120)]}},
            'NetIncomeLoss': {'units': {'USD': [self.fact(20)]}},
        }}}
        selected = select_revenue_concept(body, self.today)
        self.assertNotIn('Revenues', selected['facts']['us-gaap'])
        self.assertIn('NetIncomeLoss', selected['facts']['us-gaap'])
        self.assertIn('Revenues', body['facts']['us-gaap'])

    def test_conflict_inside_selected_concept_stays_blocking(self):
        body = {'facts': {'us-gaap': {'Revenues': {'units': {'USD': [self.fact(100), self.fact(120)]}}}}}
        with self.assertRaises(ValueError):
            select_revenue_concept(body, self.today)

    def test_failed_sources_do_not_refresh_old_dates(self):
        old = {'annual': {'end': '2025-12-31'}, 'accountsObservedAt': '2026-09-30',
               'quote': {'price': 100, 'asOf': '2026-10-12'},
               'targetForecast': {'observedAt': '2026-10-01'}, 'valuationShareBasis': {'version': 1}}
        with patch('refresh_company_universe.fetch_json', side_effect=OSError('source offline')), \
             patch('company_standard_financials.collect', side_effect=OSError('source offline')), \
             patch('refresh_company_universe.collect_forecast', side_effect=OSError('source offline')), \
             patch('refresh_company_universe.qualify_share_basis', side_effect=OSError('source offline')):
            item, status = collect(self.profile, old, dt.datetime(2026, 10, 14, tzinfo=dt.timezone.utc))
        self.assertEqual(item['accountsObservedAt'], '2026-09-30')
        self.assertEqual(item['quote'], old['quote'])
        self.assertEqual(item['targetForecast'], old['targetForecast'])
        self.assertNotIn('valuationShareBasis', item)
        self.assertIn('valuationShareBasis', old)
        self.assertNotEqual(status['accounts'], 'updated')

    def test_missing_cash_multiple_does_not_remove_verified_shares(self):
        basis={'version':1,'annualEnd':'2025-12-31'}
        with patch('refresh_company_universe.fetch_json', side_effect=OSError('offline')), \
             patch('company_standard_financials.collect', side_effect=OSError('offline')), \
             patch('refresh_company_universe.collect_forecast', side_effect=OSError('offline')), \
             patch('refresh_company_universe.qualify_share_basis', return_value=basis), \
             patch('refresh_company_universe.collect_cash_references', side_effect=ValueError('No positive FCF multiples')):
            item,status=collect(self.profile,{},dt.datetime(2026,10,14,tzinfo=dt.timezone.utc))
        self.assertEqual(item['valuationShareBasis'],basis)
        self.assertEqual(status['cashBasis'],'updated')
        self.assertNotIn('targetCashReference',item)


if __name__ == '__main__':
    unittest.main()
