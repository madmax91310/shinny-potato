import datetime as dt
import unittest
from company_standard_financials import collect


class FinancialFallbackTests(unittest.TestCase):
    def setUp(self):
        self.profile={'symbol':'TEST','currency':'USD'}
        self.today=dt.date(2026,10,14)
        self.income=self.page({'Revenue':250,'Net Income':25,'Net Income to Common':25,'EPS (Diluted)':2.5,'Shares Outstanding (Diluted)':10})
        self.cash=self.page({'Net Income':25,'Operating Cash Flow':50,'Capital Expenditures':-10,'Free Cash Flow':40})

    def page(self,rows):
        body='<tr><th>Fiscal Year</th>'+''.join(f'<th>FY {y}</th>' for y in range(2025,2020,-1))+'</tr>'
        body+='<tr><td>Period Ending</td>'+''.join(f'<td>Dec 31, {y}</td>' for y in range(2025,2020,-1))+'</tr>'
        for name,value in rows.items():body+=f'<tr><td>{name}</td>'+f'<td>{value}</td>'*5+'</tr>'
        return f'<title>Test (TEST) Financials</title><p>Financials in millions USD. Last updated: Aug 25, 2026</p><table>{body}</table>'.encode()

    def run_collect(self,income=None,cash=None):
        return collect(self.profile,self.today,lambda u:(income or self.income) if 'income-statement' in u else (cash or self.cash))

    def test_visible_annual_values_and_provenance(self):
        result=self.run_collect()
        self.assertEqual(len(result['history']),5)
        self.assertEqual(result['annual']['freeCashFlow'],40e6)
        self.assertEqual(result['annual']['dilutedEPS'],2.5)
        self.assertEqual(result['annual']['averageDilutedShares'],10e6)
        self.assertEqual(result['provenance']['sourceAsOf'],'2026-08-25')
        self.assertIsNone(result['quarter'])

    def test_missing_locked_units_and_identity_are_rejected(self):
        for replacement in [self.income.replace(b'250',b'Upgrade'),self.income.replace(b'USD',b'EUR'),self.income.replace(b'(TEST)',b'(WRONG)'),self.income.replace(b'Aug 25, 2026',b'Aug 25, 2027')]:
            with self.assertRaises(ValueError):self.run_collect(income=replacement)

    def test_cash_profit_and_share_reconciliation(self):
        for replacement in [self.cash.replace(b'>40<',b'>80<'),self.cash.replace(b'>25<',b'>26<'),self.cash.replace(b'>-10<',b'>10<')]:
            with self.assertRaises(ValueError):self.run_collect(cash=replacement)
        with self.assertRaises(ValueError):self.run_collect(income=self.income.replace(b'>2.5<',b'>5<'))

    def test_negative_fcf_is_preserved(self):
        result=self.run_collect(cash=self.cash.replace(b'>-10<',b'>-60<').replace(b'>40<',b'>-10<'))
        self.assertEqual(result['annual']['freeCashFlow'],-10e6)


if __name__=='__main__':unittest.main()
