"""Exact issuer identity, dated metrics and signed hedge holdings."""
import copy,datetime as dt,json,pathlib,unittest
from unittest.mock import patch
from collect_qualified_exposures import collect_one,holdings_sectors
ROOT=pathlib.Path(__file__).resolve().parents[1]
class QualifiedRoadmap(unittest.TestCase):
 def setUp(self):
  self.body=json.loads((ROOT/'scripts/fixtures/official-documents/roadmap-govt-5-7.json').read_text())
  self.config=next(c for c in json.loads((ROOT/'scripts/qualified-exposure-sources.json').read_text())['instruments']if c['id']=='euro-govt-5-7')
  self.now=dt.datetime(2026,10,14,tzinfo=dt.timezone.utc)
 def collect(self):
  with patch('collect_qualified_exposures.get_text',return_value=json.dumps(self.body)):return collect_one(self.config,self.now)
 def test_exact_share_and_independent_metric_dates(self):
  r=self.collect();self.assertEqual(r['isin'],'IE00B4WXJG34');self.assertEqual(r['currency'],'EUR')
  self.assertEqual(r['metrics']['modelOad']['value'],5.46267)
  self.assertEqual(r['metrics']['modelOad']['asOf'],'2026-10-13')
  self.assertIn('does not include fees',r['metrics']['yieldToWorst']['method'])
  self.assertEqual(r['metrics']['twelveMonTrlYld']['scope'],'Exact share, trailing 12 months')
 def test_equity_metrics_keep_their_definition_and_reject_fractional_counts(self):
  points=self.body['componentsByNameMap']['fundamentalsAndRisk']['containersByNameMap']['default']['dataPointsByNameMap']
  points['numHoldings']={'value':24,'asOfDate':20261013,'infoBubble':'Excludes cash and derivatives'}
  points['priceEarnings']={'value':21.16,'asOfDate':20261013,'infoBubble':'Negative earnings excluded'}
  r=self.collect()
  self.assertEqual(r['metrics']['numHoldings']['unit'],'positions')
  self.assertEqual(r['metrics']['priceEarnings']['method'],'Negative earnings excluded')
  points['numHoldings']['value']=24.5
  with self.assertRaises(ValueError):self.collect()
 def test_other_share_is_rejected(self):
  self.config['isin']='IE00B441G979'
  with self.assertRaises(ValueError):self.collect()
 def test_bad_metric_cannot_replace_observation(self):
  m=self.body['componentsByNameMap']['fundamentalsAndRisk']['containersByNameMap']['default']['dataPointsByNameMap']['modelOad']
  for value in [True,float('nan'),-1,101]:
   m['value']=value
   with self.assertRaises(ValueError):self.collect()
  m['value']=5;m['asOfDate']=20271013
  with self.assertRaises(ValueError):self.collect()
 def test_signed_hedge_values_are_not_renormalised(self):
  points={k:{'value':v}for k,v in {'sectorName':['Information Technology','Financials','Cash'],'holdingPercent':[60,41,-1],'assetClass':['Equity','Equity','Forwards']}.items()}
  body={'componentsByNameMap':{'holdings':{'containersByNameMap':{'all':{'dataPointsByNameMap':points}}}}}
  rows=holdings_sectors(body,'2026-10-13')['rows']
  self.assertEqual([r['weightPct']for r in rows],[60,41,-1]);self.assertEqual(sum(r['weightPct']for r in rows),100)
  points['sectorName']['value'].pop()
  with self.assertRaises(ValueError):holdings_sectors(body,'2026-10-13')
 def test_wholly_absent_country_table_uses_exact_dated_holdings(self):
  p=self.body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['geography']['subContainersByNameMap']['countries']['dataPointsByNameMap']
  p['type']['value']=None;p['fund']['value']=None
  r=self.collect()
  self.assertTrue(r['countries']['rows'])
  self.assertEqual(r['countries']['asOf'],r['holdings']['asOf'])
  self.assertIn('Country of risk',r['countries']['method'])
  self.assertIsNone(p['type']['value'],'Raw issuer evidence must remain unchanged')
  p['type']['value']=['France']
  with self.assertRaises((ValueError,TypeError)):self.collect()
if __name__=='__main__':unittest.main()
