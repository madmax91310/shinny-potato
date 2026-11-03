"""Replay actual independent identifier responses, not names or assumed aliases."""
import datetime as dt,gzip,json,unittest,copy
from pathlib import Path
from security_identifier_observations import qualified,digest

class ResidualIdentities(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.proofs=json.loads(gzip.decompress((Path(__file__).parent/'fixtures/security-residual-identities.json.gz').read_bytes()))
 def test_all_twenty_one_real_responses_prove_the_exact_expected_identifier(self):
  self.assertEqual(len(self.proofs['qualified']),21)
  for sedol,row in self.proofs['qualified'].items():
   with self.subTest(sedol=sedol):self.assertEqual(qualified(row,dt.datetime.fromisoformat(row['checkedAt'])),(sedol,self.proofs['expected'][sedol]))
 def test_sqm_adr_is_distinct_from_its_underlying_ordinary_share(self):
  self.assertEqual(self.proofs['expected']['2771122'],'US8336351056')
  row=self.proofs['adrVsUnderlying'];self.assertEqual(row['request'][1]['idValue'],'CLP8716X1082')
  with self.assertRaises(ValueError):qualified(row,dt.datetime.fromisoformat(row['checkedAt']))
 def test_unresolved_merck_sedol_stays_unknown_despite_known_company_name(self):
  row=self.proofs['unresolvedMerck']
  with self.assertRaises(ValueError):qualified(row,dt.datetime.fromisoformat(row['checkedAt']))

class GgraExactResidualIdentities(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.proofs=json.loads(gzip.decompress((Path(__file__).parent/'fixtures/ggra-exact-residual-identities-20261103.json.gz').read_bytes()))
 def row(self,key):return copy.deepcopy(self.proofs[key])
 def admit(self,row):return qualified(row,dt.datetime.fromisoformat(row['checkedAt']))
 def reject_mutation(self,change):
  row=self.row('6245883');change(row);row['sha256']=digest(row['response'])
  with self.assertRaises(ValueError):self.admit(row)
 def test_exact_newmed_partnership_units_are_not_assigned_to_parent_or_other_share(self):
  row=self.row('6245883')
  self.assertEqual(row['response'][0]['data'][0]['securityType'],'Ltd Part')
  self.assertEqual(row['response'][0]['data'][0]['securityType2'],'Partnership Shares')
  self.assertEqual(self.admit(row),('6245883','IL0004750209'))
 def test_norton_label_requires_the_independent_exact_gen_identifier_crosswalk(self):
  row=self.row('BMV1436')
  self.assertEqual(self.admit(row),('BMV1436','US6687711084'))
  self.assertTrue(all(r['name']=='GEN DIGITAL INC' for r in row['response'][0]['data']))
  seeds=json.loads((Path(__file__).parent/'security-identifier-candidates.json').read_text())['candidates']
  self.assertEqual([r['isin']for r in seeds if r['sedol']=='BMV1436'],['US6687711084'])
 def test_partnership_cannot_be_matched_to_common_stock_even_with_same_figi(self):
  def change(row):
   for r in row['response'][1]['data']:r.update(securityType='Common Stock',securityType2='Common Stock')
  self.reject_mutation(change)
 def test_other_limited_partnership_security_types_stay_unqualified(self):
  def change(row):
   for reply in row['response']:
    for r in reply['data']:r['securityType2']='Unknown'
  self.reject_mutation(change)
 def test_identical_names_do_not_prove_the_security_or_share_class(self):
  def change(row):
   for r in row['response'][1]['data']:r['shareClassFIGI']='BBG001S5QG38'
  self.reject_mutation(change)
 def test_non_equity_partnership_remains_unqualified(self):
  def change(row):
   for reply in row['response']:
    for r in reply['data']:r['marketSector']='Corp'
  self.reject_mutation(change)
 def test_response_integrity_and_existing_freshness_are_still_required(self):
  row=self.row('6245883');row['sha256']='0'*64
  with self.assertRaises(ValueError):self.admit(row)
  row=self.row('6245883')
  with self.assertRaises(ValueError):qualified(row,dt.datetime.fromisoformat(row['checkedAt'])+dt.timedelta(days=366))

if __name__=='__main__':unittest.main()
