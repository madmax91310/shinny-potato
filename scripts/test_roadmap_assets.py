"""Regression for the German fund's explicitly different issuer fields."""
import copy,datetime as dt,json,pathlib,unittest
from collect_etf_pilot import parse_share
from apply_etf_collection import merge_collection
ROOT=pathlib.Path(__file__).resolve().parents[1]
class GermanSectorFacts(unittest.TestCase):
 def setUp(self):
  self.body=json.loads((ROOT/'scripts/fixtures/non-bond/insurance-key-facts.json').read_text())
  self.config=next(c for c in json.loads((ROOT/'scripts/non-bond-qualified-sources.json').read_text())['instruments']if c['id']=='europe-insurance')
  self.config={**self.config,'distribution':'Distributing','requireFullHistory':False}
  self.now=dt.datetime(2026,10,13,tzinfo=dt.timezone.utc)
 def test_fund_assets_are_never_labelled_share_class(self):
  row=parse_share(self.body,self.config,self.now)
  self.assertEqual(row['aum']['scope'],'fund');self.assertEqual(row['aum']['currency'],'EUR')
  self.assertTrue(row['performance']['years']);self.assertEqual(row['distribution'],'Distributing')
 def test_missing_explicit_asset_field_is_rejected(self):
  del self.body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['totalNetAssetsFundLevel']
  with self.assertRaises(ValueError):parse_share(self.body,self.config,self.now)
 def test_wrong_identity_cannot_use_another_fund(self):
  self.config['isin']='DE000A0F5UJ7'
  with self.assertRaises(ValueError):parse_share(self.body,self.config,self.now)
 def test_launch_year_is_excluded(self):
  self.body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['launchDate']['value']=20240708
  row=parse_share(self.body,self.config,self.now)
  self.assertEqual(set(row['performance']['years']),{'2025'})
 def test_bank_sector_keeps_its_granularity(self):
  row=parse_share(self.body,self.config,self.now);row['sourceUrl']='https://issuer.example/exact-fund';row['sectors']['rows']=[{'name':'Banks','weightPct':100}]
  merged=merge_collection({'checkedAt':self.now.isoformat(),'shares':[row]}, {}, {})
  self.assertEqual(merged[row['isin']]['sectors']['rows'][0]['label'],'Banques')
if __name__=='__main__':unittest.main()
