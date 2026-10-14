import datetime as dt
import unittest
from company_valuation import qualify_share_basis, normalise_nvidia_history
from test_company_round2 import statement, URL, TODAY
from company_round2_publications import statement_periods
class ValuationInputs(unittest.TestCase):
 def test_published_share_count_reconciles_to_eps(self):
  t=statement('Years Ended December 31,\n2025 2024','350 300','50 40','5 4')+'Weighted-average common shares outstanding\nDiluted 10 10\n'
  a=statement_periods(t,'mastercard',URL,TODAY)[0]
  self.assertEqual(a['averageDilutedShares'],10e6)
  b=statement_periods(t.replace('Diluted 10 10','Diluted 1 1'),'mastercard',URL,TODAY)[0]
  self.assertNotIn('averageDilutedShares',b)
 def test_direct_diluted_count_labels(self):
  for label in ['Diluted weighted-average shares outstanding','Shares used in computing diluted net income per share','Shares used in diluted per share calculations']:
   t=statement('Years Ended December 31,\n2025 2024','350 300','50 40','5 4')+label+' 10 10\n'
   self.assertEqual(statement_periods(t,'mastercard',URL,TODAY)[0]['averageDilutedShares'],10e6)
 def test_change_column_is_not_a_share_count(self):
  t=statement('Years Ended December 31,\n2025 2024','350 300 17','50 40 25','5 4 25')+'Average Shares Outstanding Assuming Dilution 10 10 0\n'
  self.assertEqual(statement_periods(t,'coca-cola',URL,TODAY)[0]['averageDilutedShares'],10e6)
 def test_full_window_and_splits_fail_closed(self):
  c={'annual':{'end':'2025-12-31'},'decision':{'years':[{'end':f'{y}-12-31','averageDilutedShares':100,'sharesBasisSource':URL}for y in range(2022,2026)]}}
  p={'id':'test','symbol':'TEST','currency':'USD'}
  body={'chart':{'result':[{'meta':{'symbol':'TEST','currency':'USD'},'timestamp':[1640000000,1791800000]}]}}
  block=qualify_share_basis(c,p,lambda u:body,TODAY);self.assertEqual(block['version'],1)
  body['chart']['result'][0]['events']={'splits':{'a':{'numerator':2,'denominator':1}}}
  with self.assertRaises(ValueError):qualify_share_basis(c,p,lambda u:body,TODAY)
  body['chart']['result'][0].pop('events');body['chart']['result'][0]['timestamp']=[1791800000]
  with self.assertRaises(ValueError):qualify_share_basis(c,p,lambda u:body,TODAY)
class SplitNormalisation(unittest.TestCase):
 def loader(self,url):
  if url.endswith('/old'):return b'<div class="article-date">February 22, 2023</div>NVIDIA original annual shares'
  if url.endswith('/restated'):return b'<div class="article-date">February 26, 2025</div>NVIDIA All per share amounts have been retroactively adjusted to reflect the ten-for-one stock split.'
  return b'NVIDIA ten-for-one forward stock split effective June 7, 2024.'
 def test_split_applied_once_and_original_preserved(self):
  event={'date':int(dt.datetime(2024,6,10,tzinfo=dt.timezone.utc).timestamp()),'numerator':10,'denominator':1}
  rows=[{'end':'2023-01-29','averageDilutedShares':2507,'sharesBasisSource':'https://nvidianews.nvidia.com/news/old'},
        {'end':'2024-01-28','averageDilutedShares':24940,'sharesBasisSource':'https://nvidianews.nvidia.com/news/restated'}]
  result=normalise_nvidia_history(rows,[event],self.loader)
  self.assertEqual([r['averageDilutedShares']for r in result],[25070,24940])
  self.assertEqual(rows[0]['averageDilutedShares'],2507)
  self.assertEqual(result[1]['adjustments'][0]['action'],'already-restated')
  event['numerator']=5
  with self.assertRaises(ValueError):normalise_nvidia_history(rows,[event],self.loader)
 def test_ambiguous_comparative_is_rejected(self):
  event={'date':int(dt.datetime(2024,6,10,tzinfo=dt.timezone.utc).timestamp()),'numerator':10,'denominator':1}
  row={'end':'2024-01-28','averageDilutedShares':24940,'sharesBasisSource':'https://nvidianews.nvidia.com/news/restated'}
  def load(url):return self.loader(url).replace(b'retroactively adjusted',b'published')
  with self.assertRaises(ValueError):normalise_nvidia_history([row],[event],load)

if __name__=='__main__':unittest.main()
