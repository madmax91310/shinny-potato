"""Replay actual independent identifier responses, not names or assumed aliases."""
import datetime as dt,gzip,json,unittest
from pathlib import Path
from security_identifier_observations import qualified

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

if __name__=='__main__':unittest.main()
