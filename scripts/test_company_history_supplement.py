import datetime as dt
import unittest
from copy import deepcopy
from company_history_supplement import supplement
from test_company_standard_financials import FinancialFallbackTests

class SupplementTests(unittest.TestCase):
    def setUp(self):
        fixture=FinancialFallbackTests();fixture.setUp()
        self.source=fixture.run_collect();self.today=fixture.today
        self.profile={'id':'adobe'}
        self.company={'annual':deepcopy(self.source['annual']),
                      'quarter':{'end':'2026-06-30','observedAt':'2026-08-01'},
                      'history':{'years':deepcopy(self.source['history'][-3:]),'observedAt':'2026-08-01'},
                      'decision':{'balance':{'asOf':'2026-06-30','cash':42},'observedAt':'2026-08-01'}}
    def apply(self):return supplement(self.profile,self.company,self.today,lambda *a:self.source)
    def test_reconciled_history_keeps_primary_accounts_and_quarter_dates(self):
        before=deepcopy(self.company);result=self.apply()
        self.assertEqual(self.company,before)
        self.assertEqual(result['annual'],before['annual'])
        self.assertEqual(result['quarter'],before['quarter'])
        self.assertEqual(len(result['history']['years']),5)
        self.assertEqual(result['decision']['accountsEndAtCollection'],'2026-06-30')
        self.assertNotIn('balance',result['decision'])
        self.assertIn('stockanalysis.com',result['decision']['years'][0]['sourceUrl'])
    def test_conflicting_primary_data_is_never_overwritten(self):
        for field in ['revenue','netIncome','freeCashFlow']:
            self.company['annual'][field]+=100
            with self.assertRaises(ValueError):self.apply()
            self.company['annual'][field]-=100
        self.company['history']['years'][0]['revenue']+=100
        with self.assertRaises(ValueError):self.apply()
    def test_new_fiscal_period_requires_primary_accounts_first(self):
        self.company['annual']['end']='2024-12-31'
        with self.assertRaises(ValueError):self.apply()

if __name__=='__main__':unittest.main()
