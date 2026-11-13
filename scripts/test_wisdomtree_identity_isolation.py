import datetime as dt,unittest
from unittest.mock import patch
from collect_wisdomtree_holdings import qualified_identity_books,IdentitySnapshot

class IdentityIsolation(unittest.TestCase):
 def test_one_failed_book_does_not_strand_successful_independent_identities(self):
  def fetch(url):
   if url=='https://issuer.example/down':raise ConnectionError('offline')
   return b'valid book'
  with patch('collect_wisdomtree_holdings.IDENTITIES',[('failed','https://issuer.example/down'),('valid','https://issuer.example/ok')]),patch('collect_wisdomtree_holdings.identity_document',side_effect=fetch),patch('collect_wisdomtree_holdings.identities',return_value=({'1234567':'US0378331005'},'2026-10-28')):
   m,dates,proofs,failures=qualified_identity_books(dt.datetime(2026,10,29,tzinfo=dt.timezone.utc))
  self.assertEqual(m,{'1234567':'US0378331005'});self.assertEqual(dates,['2026-10-28'])
  self.assertEqual(set(proofs),{'https://issuer.example/ok'});self.assertEqual(failures[0]['isin'],'failed')
  snapshot=IdentitySnapshot((m,dates,proofs),failures)
  self.assertEqual(tuple(snapshot),(m,dates,proofs));self.assertEqual(snapshot.source_failures,failures)
 def test_two_valid_but_conflicting_books_still_fail_closed(self):
  with patch('collect_wisdomtree_holdings.IDENTITIES',[('one','https://issuer.example/1'),('two','https://issuer.example/2')]),patch('collect_wisdomtree_holdings.identity_document',return_value=b'book'),patch('collect_wisdomtree_holdings.identities',side_effect=[({'1234567':'US0378331005'},'2026-10-28'),({'1234567':'US5949181045'},'2026-10-28')]):
   with self.assertRaisesRegex(ValueError,'Contradictory'):qualified_identity_books(None)


class RequestedIdentityPerimeter(unittest.TestCase):
 """Real13Nov conflict: BLNN369 has two source ISINs, no winner inferred."""
 def setUp(self):
  from collect_wisdomtree_holdings import _cached_identity_mapping
  _cached_identity_mapping.cache_clear();self.addCleanup(_cached_identity_mapping.cache_clear)
 def snapshot(self,required,static=None):
  import json
  from contextlib import ExitStack
  from collect_wisdomtree_holdings import complete_identity_mapping
  official={'BLNN369':'US94708K1034','2046251':'US0378331005'}
  retained={'GGRA':{'asOf':'2026-11-11','sourceUrl':'https://dataspanapi.wisdomtree.com/funddetails/rankings/?ticker=GGRA%20LN&isoCode=en-GB',
   'sha256':'a'*64,'rows':[{'sedol':'BLNN369','isin':'IE00BLNN3691','name':'Weatherford International Pl'}]}}
  def books(now,scope=None):
   return ({k:v for k,v in official.items()if scope is None or k in scope},['2026-11-12'],{'https://issuer.example/official-workbook':'b'*64},[])
  with ExitStack()as stack:
   stack.enter_context(patch('collect_wisdomtree_holdings.qualified_identity_books',side_effect=books))
   stack.enter_context(patch('pathlib.Path.read_text',return_value=json.dumps(retained)))
   stack.enter_context(patch('security_identifier_observations.retained_identity_pairs',side_effect=lambda r,now:r['rows']))
   stack.enter_context(patch('security_identifier_observations.mappings',return_value=(static or {},{})))
   return complete_identity_mapping(dt.datetime(2026,11,13,tzinfo=dt.timezone.utc),required)
 def test_unrelated_conflict_does_not_block_or_assign_an_identity(self):
  mapping,dates,proofs=self.snapshot({'2046251'})
  self.assertEqual(mapping,{'2046251':'US0378331005'})
  self.assertNotIn('BLNN369',mapping)
  self.assertEqual(dates,['2026-11-12'],'An unused retained book contributes neither its date nor proof')
  self.assertEqual(set(proofs),{'https://issuer.example/official-workbook'})
 def test_conflict_in_requested_fund_still_fails_with_both_exact_identities(self):
  with self.assertRaisesRegex(ValueError,'BLNN369: US94708K1034 versus IE00BLNN3691'):
   self.snapshot({'BLNN369'})
 def test_cache_never_reuses_another_funds_qualified_perimeter(self):
  self.snapshot({'2046251'})
  with self.assertRaisesRegex(ValueError,'Conflicting retained identity'):self.snapshot({'2046251','BLNN369'})
  self.assertEqual(self.snapshot({'2046251'})[0],{'2046251':'US0378331005'})
 def test_unscoped_join_still_refuses_the_conflict(self):
  with self.assertRaisesRegex(ValueError,'Conflicting retained identity'):self.snapshot(None)
 def test_requested_static_crosswalk_conflict_is_not_ignored(self):
  with self.assertRaisesRegex(ValueError,'Conflicting qualified identifier crosswalk'):
   self.snapshot({'2046251'},{'2046251':'US5949181045'})
 def test_empty_or_malformed_native_perimeter_is_not_a_success(self):
  from collect_wisdomtree_holdings import complete_identity_mapping
  for scope in [set(),{'bad'},{None}]:
   with self.subTest(scope=scope),self.assertRaisesRegex(ValueError,'Invalid requested'):
    complete_identity_mapping(None,scope)
 def test_official_books_only_join_the_requested_keys_without_choosing_conflicting_ones(self):
  with patch('collect_wisdomtree_holdings.IDENTITIES',[('one','https://issuer.example/1'),('two','https://issuer.example/2')]),patch('collect_wisdomtree_holdings.identity_document',return_value=b'book'),patch('collect_wisdomtree_holdings.identities',side_effect=[({'2046251':'US0378331005','BLNN369':'US94708K1034'},'2026-11-12'),({'2046251':'US0378331005','BLNN369':'IE00BLNN3691'},'2026-11-12')]):
   mapping,*_=qualified_identity_books(None,{'2046251'})
   self.assertEqual(mapping,{'2046251':'US0378331005'})

if __name__=='__main__':unittest.main()
