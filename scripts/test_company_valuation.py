import datetime as dt
import unittest
from company_valuation import qualify_share_basis
from test_company_round2 import statement, URL, TODAY
from company_round2_publications import statement_periods
class ValuationInputs(unittest.TestCase):
 def test_published_share_count_reconciles_to_eps(self):
  t=statement('Years Ended December 31,\n2025 2024','350 300','50 40','5 4')+'Weighted-average common shares outstanding\nDiluted 10 10\n'
  a=statement_periods(t,'mastercard',URL,TODAY)[0]
  self.assertEqual(a['averageDilutedShares'],10e6)
  b=statement_periods(t.replace('Diluted 10 10','Diluted 1 1'),'mastercard',URL,TODAY)[0]
  self.assertNotIn('averageDilutedShares',b)
 def test_full_window_and_splits_fail_closed(self):
  c={'annual':{'end':'2025-12-31'},'decision':{'years':[{'end':f'{y}-12-31','averageDilutedShares':100,'sharesBasisSource':URL}for y in range(2022,2026)]}}
  p={'id':'test','symbol':'TEST','currency':'USD'}
  body={'chart':{'result':[{'meta':{'symbol':'TEST','currency':'USD'},'timestamp':[1640000000,1791800000]}]}}
  block=qualify_share_basis(c,p,lambda u:body,TODAY);self.assertEqual(block['version'],1)
  body['chart']['result'][0]['events']={'splits':{'a':{'numerator':2,'denominator':1}}}
  with self.assertRaises(ValueError):qualify_share_basis(c,p,lambda u:body,TODAY)
  body['chart']['result'][0].pop('events');body['chart']['result'][0]['timestamp']=[1791800000]
  with self.assertRaises(ValueError):qualify_share_basis(c,p,lambda u:body,TODAY)
if __name__=='__main__':unittest.main()
