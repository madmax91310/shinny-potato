import copy,json,pathlib,unittest
from collect_qualified_exposures import newer_compatible_aum,retain_existing_records
ROOT=pathlib.Path(__file__).resolve().parents[1]
class QualifiedAumRetention(unittest.TestCase):
 def setUp(self):self.pairs=json.loads((ROOT/'scripts/fixtures/qualified-aum-retention.json').read_text())['pairs']
 def test_all_twelve_actual_regressions_and_idempotence(self):
  shared={r['isin']:{'currency':'USD','productId':r['isin'],'aum':r['candidate']}for r in self.pairs}
  qualified={r['isin']:{'isin':r['isin'],'automatedRecord':{'currency':'USD','productId':r['isin'],'aum':r['preferred']}}for r in self.pairs}
  original=copy.deepcopy((shared,qualified));a,b=retain_existing_records(shared,qualified)
  self.assertEqual((shared,qualified),original)
  for r in self.pairs:
   self.assertEqual(a[r['isin']]['aum'],r['candidate']);self.assertEqual(b[r['isin']]['automatedRecord']['aum'],r['candidate'])
  self.assertEqual(retain_existing_records(a,b),(a,b))
 def test_partial_run_does_not_drop_unselected_instruments(self):
  record={'currency':'USD','productId':'same','aum':self.pairs[0]['candidate']}
  shared={'UNSELECTED':record,'OTHER':{'currency':'EUR','productId':'other'}}
  qualified={'q':{'isin':'UNSELECTED','automatedRecord':record|{'aum':self.pairs[0]['preferred']}}}
  a,b=retain_existing_records(shared,qualified)
  self.assertEqual(a['UNSELECTED'],record);self.assertIn('OTHER',a)
  self.assertEqual(b['q']['automatedRecord']['aum']['checkedAt'],record['aum']['checkedAt'])
 def test_same_date_conflict_scope_and_currency_not_arbitrated(self):
  a=self.pairs[0]['preferred']
  for b in [a|{'amount':a['amount']*2,'checkedAt':'2026-10-27'},self.pairs[0]['candidate']|{'scope':'fund'},self.pairs[0]['candidate']|{'currency':'EUR'}]:
   self.assertEqual(newer_compatible_aum(a,b),a)
 def test_unchanged_success_keeps_the_actual_new_control_without_redating_the_value(self):
  a=self.pairs[0]['preferred'];b=a|{'checkedAt':'2026-10-27'}
  self.assertEqual(newer_compatible_aum(a,b),b)
  self.assertEqual(newer_compatible_aum(a,b)['asOf'],a['asOf'])
 def test_exact_identity_is_preserved(self):
  with self.assertRaisesRegex(ValueError,'identity'):
   retain_existing_records({'ISIN':{'currency':'EUR','productId':'other'}},{'q':{'isin':'ISIN','automatedRecord':{'currency':'USD','productId':'same'}}})
if __name__=='__main__':unittest.main()
