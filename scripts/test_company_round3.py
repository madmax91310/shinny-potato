import datetime as dt
import unittest
from unittest.mock import patch
import company_round3_publications as c
TODAY=dt.date(2026,10,12)
class StatementLayouts(unittest.TestCase):
 def parse(self,t,ident):
  with patch.object(c,'text',return_value=t):return c.parse(b'%PDF synthetic',ident,'https://issuer.example/release',TODAY)
 def test_caterpillar_financial_products_are_not_consolidated_revenue(self):
  t='Caterpillar\nCondensed Consolidated Statement of Results of Operations\n(Dollars in millions except per share data)\nThree Months Ended June 30,\n2026 2025\nRevenues of Financial Products 9 8\nTotal sales and revenues 200 180\nOperating profit 30 20\nProfit 1 $ 20 $ 10\nProfit per common share — diluted 2 $ 2 $ 1\n'
  p=self.parse(t,'caterpillar')[0];self.assertEqual(p['revenue'],200e6);self.assertEqual(p['netIncome'],20e6);self.assertEqual(p['dilutedEPS'],2)
 def test_netflix_thousands_and_sequential_quarter(self):
  t='Netflix\nConsolidated Statements of Operations\n(in thousands, except per share data)\nThree Months Ended Twelve Months Ended\nDecember 31, September 30, December 31, December 31, December 31,\n2025 2025 2024 2025 2024\nRevenues 100000 90000 80000 350000 300000\nNet income 20000 18000 10000 50000 40000\nDiluted 2 1.8 1 5 4\n'
  q,a=self.parse(t,'netflix');self.assertEqual(q['revenue'],100e6);self.assertEqual(q['previousRevenue'],80e6);self.assertEqual(a['revenue'],350e6);self.assertEqual(q['dilutedEPS'],2)
 def test_walmart_percent_change_and_noncontrolling_interest_are_not_results(self):
  t='Walmart\nCondensed Consolidated Statements of Income\n(in millions)\nThree Months Ended Fiscal Year Ended January 31, January 31,\n2026 2025 2026 2025\nTotal revenues 100 80 25.0 % 350 300 16.7%\nConsolidated net income 25 15 60 50\nConsolidated net income attributable to Walmart 20 10 100.0 % 50 40 25.0%\nDiluted net income per common share attributable to Walmart 2 1 100.0% 5 4 25.0%\n'
  q,a=self.parse(t,'walmart');self.assertEqual(q['netIncome'],20e6);self.assertEqual(a['revenue'],350e6)
 def test_wm_spaced_duration_and_parent_income(self):
  t='Waste Management\nCONDENSED CONSOLIDATED STATEMENTS OF OPERATIONS\n(In Millions)\nT hree Mo nth s Ended March 31,\n2026 2025\nOperating revenues 100 80\nConsolidated net income 25 15\nNet income attributable to Waste Management, Inc. 20 10\nDiluted earnings per common share 2 1\n'
  p=self.parse(t,'waste-management')[0];self.assertEqual(p['netIncome'],20e6)
 def test_unknown_identity_units_and_future_fail(self):
  t='Netflix\nConsolidated Statements of Operations\n(in billions)\nThree Months Ended June 30,\n2026 2025\nRevenues 100 80\nNet income 20 10\nDiluted 2 1\n'
  with self.assertRaises(ValueError):self.parse(t,'netflix')
  with self.assertRaises(ValueError):self.parse(t.replace('Netflix','Other'),'netflix')
if __name__=='__main__':unittest.main()
