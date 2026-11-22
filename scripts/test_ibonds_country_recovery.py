"""Exact iBonds primary-country failure and independent physical-book route."""
import hashlib, copy, datetime as dt, gzip, json, pathlib, unittest
from unittest.mock import patch
import collect_qualified_exposures as collector
from apply_etf_collection import merge_collection
from qualified_physical_allocation import contract_results
from producer_report_plans import build_plan
from producer_report_contract import finish, normalize_contract, validate_contract
ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=gzip.decompress((ROOT/'scripts/fixtures/ishares-stale-country-20261116/IE0008UEVOE0.json.gz').read_bytes()).decode()
BODY=json.loads(RAW)
CONFIG=next(x for x in json.loads((ROOT/'scripts/qualified-exposure-sources.json').read_text())['instruments']if x['isin']=='IE0008UEVOE0')
NOW=dt.datetime(2026,11,16,19,tzinfo=dt.timezone.utc)
class IBondsCountryRecovery(unittest.TestCase):
 def collect(self,body,now=NOW):
  with patch.object(collector,'get_text',return_value=json.dumps(body)):
   return collector.collect_one(CONFIG,now)
 def test_exact_physical_bond_share_recovers_dated_risk_weights_without_renormalization(self):
  self.assertTrue(CONFIG['isolateAllocationFailures']);self.assertEqual(CONFIG['expectedStructure'],'Physical')
  r=self.collect(BODY)
  self.assertEqual(r['countries']['asOf'],'2026-11-13')
  self.assertIn('Country of risk',r['countries']['method'])
  points=BODY['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
  self.assertAlmostEqual(sum(x['weightPct']for x in r['countries']['rows']),sum(points['holdingPercent']['value']),places=5)
  self.assertIn({'name':'European Union','weightPct':-0.00243},r['countries']['rows'])
  self.assertTrue(r['collectionErrors'][0]['fallbackQualified'])
  self.assertEqual(r['collectionErrors'][0]['field'],'countries-primary')
  self.assertEqual(r['sectors']['asOf'],'2026-11-13')
  self.assertTrue(r['performance']['years']);self.assertNotIn('2026',r['performance']['years'])
  merged=merge_collection({'checkedAt':r['checkedAt'],'shares':[r]},{},{})
  self.assertEqual(merged[r['isin']]['countries']['rows'],r['countries']['rows'])
  self.assertEqual(self.collect(BODY)['countries'],r['countries'])
  # Replay the older proof against a separately qualified newer photograph.
  # The production registry must never be the baseline of this dated fixture.
  previous=copy.deepcopy(merged)
  countries=previous[r['isin']]['countries']
  countries.update(asOf='2026-11-14',checkedAt='2026-11-15')
  replay=merge_collection({'checkedAt':r['checkedAt'],'shares':[r]},previous,{})
  self.assertEqual(replay[r['isin']]['countries'],countries)
 def test_primary_failure_remains_explicit_in_targeted_native_contract(self):
  r=self.collect(BODY);report={'records':[r],'excluded':[]};report['contractResults']=contract_results([CONFIG],report)
  self.assertEqual([row['id'] for row in report['contractResults']['successes']],['qualified-yield:'+CONFIG['isin']])
  error=report['contractResults']['errors'][0]
  self.assertEqual(error['id'],CONFIG['isin']);self.assertEqual(error['field'],'countries-primary')
  self.assertTrue(error['qualifiedAlternativeAvailable'])
  plan=build_plan('collect_qualified_exposures',['--only',CONFIG['id']])
  plan.update(producer='collect_qualified_exposures',reportStem='qualified-exposures',declaredAt=NOW.isoformat(),nonce='isolated-ibonds-source-contract')
  plan['sha256']=hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()
  contract=finish(report,plan)['resultContract'];validate_contract(contract)
  normalized=normalize_contract(contract)
  self.assertEqual([row['id'] for row in normalized['successes']],['qualified-yield:'+CONFIG['isin']])
  self.assertEqual([e['id']for e in normalized['errors']],[CONFIG['isin']])
  self.assertEqual(contract['issues'],[]);self.assertEqual(contract['unscopedFailures'],[])
  self.assertEqual({o['id']for o in contract['outcomes']if o['status']=='failed'},{CONFIG['isin']})
 def test_primary_at_45_days_retains_its_own_method_and_has_no_failure(self):
  r=self.collect(BODY,NOW-dt.timedelta(days=1))
  self.assertEqual(r['countries']['asOf'],'2026-10-01')
  self.assertEqual(r.get('collectionErrors',[]),[])
  self.assertEqual(contract_results([CONFIG],{'records':[r],'excluded':[]})['errors'],[])
 def test_wrong_identity_or_synthetic_or_truncated_book_never_qualifies(self):
  for defect in ['identity','currency','structure','holdings']:
   b=copy.deepcopy(BODY)
   if defect=='identity':b['productId']=1
   elif defect=='currency':b['currencyCode']='USD'
   elif defect=='structure':
    f=b['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    f['productStructure']['value']='Synthetic';f['fundMethodologyTypeCode']['value']='Synthetic Replication'
   else:b['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['holdingPercent']['value'].pop()
   with self.subTest(defect=defect),self.assertRaises(ValueError):self.collect(b)
if __name__=='__main__':unittest.main()
