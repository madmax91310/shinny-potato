import datetime as dt
import unittest
from unittest.mock import patch
from company_financial_depth import collect_depth
class DepthTests(unittest.TestCase):
    def setUp(self):
        self.today=dt.date(2026,10,15);self.end='2025-12-31'
        self.company={'annual':{'end':self.end,'revenue':100e6,'netIncome':10e6}}
        self.income={'Revenue':100,'Net Income':10}
        self.balance={'Total Assets':200,'Total Liabilities':120,"Shareholders' Equity":80,'Total Liabilities & Equity':200,'Cash & Equivalents':20,'Total Debt':50,'Current Portion of Leases':2,'Long-Term Leases':8}
        self.cash={'Net Income':10,'Cash Acquisitions':-4,'Stock-Based Compensation':2,'Repurchase of Common Stock':-3,'Common Dividends Paid':-1}
    def collect(self):
        def table(url,*a):return {self.end:self.income if 'income-' in url else self.balance if 'balance-' in url else self.cash},'2026-08-01','hash'
        with patch('company_financial_depth.table',side_effect=table):
            return collect_depth({'symbol':'TEST','currency':'USD'},self.company,self.today,lambda url:url)
    def test_definitions_and_no_double_addition_of_leases(self):
        result=self.collect();f=result['fields']
        self.assertEqual(f['debt']['value'],50e6);self.assertEqual(f['leaseLiabilities']['value'],10e6)
        self.assertEqual(f['acquisitions']['value'],4e6);self.assertEqual(f['dividendsPaid']['value'],1e6)
        self.assertEqual(result['sourceAsOf'],'2026-08-01')
    def test_conflict_rejected(self):
        self.income['Revenue']=101
        with self.assertRaises(ValueError):self.collect()
    def test_optional_missing_is_not_zero(self):
        del self.cash['Cash Acquisitions'];del self.balance['Long-Term Leases']
        f=self.collect()['fields'];self.assertNotIn('acquisitions',f);self.assertNotIn('leaseLiabilities',f)
    def test_balance_failure_keeps_only_valid_cash_block(self):
        self.balance['Total Assets']=500
        result=self.collect();self.assertNotIn('debt',result['fields']);self.assertIn('balance-sheet/',result['restrictions'])
    def test_net_disposal_keeps_sign(self):
        self.cash['Cash Acquisitions']=3
        self.assertEqual(self.collect()['fields']['acquisitions']['value'],-3e6)
