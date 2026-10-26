import copy,datetime as dt,gzip,json,unittest
from pathlib import Path
from collect_etf_pilot import collect,parse_share
from apply_etf_collection import merge_collection
from ishares_sector_fallback import classified_position_allocation
ROOT=Path(__file__).resolve().parents[1];ISIN='IE00B6R52259';NOW=dt.datetime(2026,10,26,12,tzinfo=dt.timezone.utc)
class PartialAllocationRecovery(unittest.TestCase):
 def setUp(self):
  self.body=json.loads(gzip.decompress((ROOT/'reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026/IE00B6R52259-exposures-primary.json.gz').read_bytes()))
  self.share=next(s for s in json.loads((ROOT/'scripts/etf-pilot.json').read_text())['instruments']if s['isin']==ISIN)
  self.baseline={ISIN:{'currency':'USD'}}
 def collect(self,body):return collect({'instruments':[self.share]},self.baseline,NOW,fetch=lambda *a,**k:json.dumps(body))
 def holdings(self,body):return body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
 def test_real_response_restores_allocations_without_certifying_unknown_security(self):
  report=self.collect(self.body);self.assertEqual(report['failures'],[]);r=report['shares'][0]
  self.assertTrue(r['performance']['years']);self.assertGreater(r['aum']['amount'],0)
  self.assertEqual({x['field']for x in r['collectionErrors']},{'countries-primary','sectors-primary'})
  self.assertTrue(all(x['fallbackQualified']for x in r['collectionErrors']))
  self.assertEqual(r['sectors']['positionCount'],1662);self.assertEqual(r['sectors']['unidentifiedSecurityCount'],1)
  self.assertAlmostEqual(r['sectors']['unidentifiedWeightPct'],.0001)
  for field in ['countries','countriesRisk','sectors']:
   self.assertAlmostEqual(sum(x['weightPct']for x in r[field]['rows']),99.99994)
   self.assertFalse(r[field]['overlapQualified'])
  self.assertEqual(r['aum']['scope'],'share-class')
 def test_bad_sector_preserves_its_old_values_and_dates_but_updates_other_fields(self):
  b=copy.deepcopy(self.body);self.holdings(b)['sectorName']['value'][0]='Unknown classification'
  report=self.collect(b);self.assertEqual(report['failures'],[]);r=report['shares'][0]
  self.assertFalse(r['sectors']['rows']);self.assertTrue(r['countries']['rows']);self.assertTrue(r['performance']['years'])
  old={'currency':'USD','productId':self.share['productId'],'sectors':{'asOf':'2026-10-19','checkedAt':'2026-10-20','rows':[{'name':'Information Technology','weightPct':100}]}}
  merged=merge_collection(report,{ISIN:old},self.baseline)[ISIN]
  self.assertEqual(merged['sectors'],old['sectors']);self.assertEqual(merged['aum']['checkedAt'],'2026-10-26')
  self.assertTrue(any(x['field']=='sectors-primary'and not x['fallbackQualified']for x in r['collectionErrors']))
 def test_partial_weight_count_date_and_scope_are_refused_for_allocations(self):
  for defect in ['count','weight','date','scope','duplicate']:
   b=copy.deepcopy(self.body);h=self.holdings(b)
   if defect=='count':b['componentsByNameMap']['fundamentalsAndRisk']['containersByNameMap']['default']['dataPointsByNameMap']['numHoldings']['value']+=1
   elif defect=='weight':h['holdingPercent']['value'][0]-=.1
   elif defect=='date':h['asOfDate']['value']=20261022
   elif defect=='scope':b['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['productStructure']['value']='Synthetic'
   else:
    for key in ['isin','issueName','ticker','exchange','marketCurrencyCode']:h[key]['value'][1]=h[key]['value'][0]
   with self.subTest(defect=defect),self.assertRaises(ValueError):classified_position_allocation(b,self.share,NOW)
 def test_wrong_fund_or_currency_never_publishes_partial_values(self):
  for key,value in [('productId',1),('currencyCode','EUR')]:
   b=copy.deepcopy(self.body);b[key]=value;r=self.collect(b)
   self.assertEqual(r['shares'],[]);self.assertEqual(len(r['failures']),1)
if __name__=='__main__':unittest.main()
