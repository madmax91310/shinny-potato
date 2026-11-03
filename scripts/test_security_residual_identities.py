"""Replay actual independent identifier responses, not names or assumed aliases."""
import datetime as dt,gzip,json,unittest,copy,math
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

class GgraDistinctListingPositions(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  root=Path(__file__).parent/'fixtures'
  cls.native=json.loads(gzip.decompress((root/'ggra-original-sedol-positions-20261103.json.gz').read_bytes()))['rows']
  cls.mapping={r['sedol']:r['isin']for r in cls.native if r['isin']}
  for row in json.loads(gzip.decompress((root/'ggra-exact-residual-identities-20261103.json.gz').read_bytes())).values():
   sedol,isin=qualified(row,dt.datetime.fromisoformat(row['checkedAt']));cls.mapping[sedol]=isin
 def mapped(self):return [{**r,'isin':self.mapping.get(r['sedol'])}for r in self.native]
 def test_exact_native_positions_are_consolidated_with_all_weights_and_proofs_retained(self):
  from collect_wisdomtree_holdings import consolidate_ranked_securities
  from collect_physical_holdings import checked_rows
  native=self.mapped();original=copy.deepcopy(native)
  with self.assertRaisesRegex(ValueError,'Duplicate physical security'):checked_rows(native)
  rows=consolidate_ranked_securities(native,self.mapping)
  self.assertEqual(native,original);self.assertEqual(len(native),440);self.assertEqual(len(rows),439)
  self.assertEqual(len(checked_rows(rows)),439)
  self.assertEqual(math.fsum(r['weightPct']for r in rows),math.fsum(r['weightPct']for r in native))
  gen=next(r for r in rows if r['isin']=='US6687711084')
  self.assertEqual(gen['weightPct'],.0228)
  self.assertEqual([r['sedol']for r in gen['sourcePositions']],['BJN4XN5','BMV1436'])
  self.assertEqual([r['weightPct']for r in gen['sourcePositions']],[.0114,.0114])
  self.assertEqual(next(r['weightPct']for r in rows if r['isin']=='IL0004750209'),.0388)
  self.assertTrue(all(r['isin']for r in rows))
 def test_replay_and_input_order_do_not_change_the_consolidated_exposure(self):
  from collect_wisdomtree_holdings import consolidate_ranked_securities
  native=self.mapped();a=consolidate_ranked_securities(native,self.mapping)
  self.assertEqual(a,consolidate_ranked_securities(native,self.mapping))
  b=consolidate_ranked_securities(list(reversed(native)),self.mapping)
  self.assertEqual({r['isin']:(r['weightPct'],r.get('sourcePositions'))for r in a},
                   {r['isin']:(r['weightPct'],r.get('sourcePositions'))for r in b})
 def test_same_company_name_never_merges_different_or_unknown_securities(self):
  from collect_wisdomtree_holdings import consolidate_ranked_securities
  # Actual historical unknowns stay separate; equal labels confer no identity.
  unknown=[{**r,'name':'Same displayed issuer'}for r in self.native if not r['isin']]
  self.assertEqual(len(consolidate_ranked_securities(unknown,{})),2)
  distinct=[{**r,'name':'Same displayed issuer'}for r in self.mapped()[:2]]
  self.assertEqual(len(consolidate_ranked_securities(distinct,self.mapping)),2)
 def test_duplicate_sedol_unbound_mapping_and_invalid_weights_stay_refused(self):
  from collect_wisdomtree_holdings import consolidate_ranked_securities
  native=self.mapped()
  mutations=[lambda rows:rows.append(dict(rows[0])),lambda rows:rows[0].update(weightPct=-1),
             lambda rows:rows[0].update(weightPct=True),lambda rows:rows[0].update(isin='US0000000001'),
             lambda rows:rows[0].update(sedol='')]
  for mutate in mutations:
   rows=copy.deepcopy(native);mutate(rows)
   with self.subTest(mutation=mutate),self.assertRaises(ValueError):consolidate_ranked_securities(rows,self.mapping)

if __name__=='__main__':unittest.main()
