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



class DatedCorporateContinuity(unittest.TestCase):
 def setUp(self):
  self.now=dt.datetime(2026,11,13,13,tzinfo=dt.timezone.utc)
 def resolve(self,left='US94708K1034',right='IE00BLNN3691',stamp='2026-11-11',sedol='BLNN369',now=None):
  from security_identity_continuity import resolve_conflict
  return resolve_conflict(sedol,left,right,stamp,now or self.now)
 def test_official_completion_and_cusip_proofs_are_pinned(self):
  import json,gzip,hashlib
  from pathlib import Path
  from bs4 import BeautifulSoup
  from security_identity_continuity import REGISTRY
  c=json.loads(REGISTRY.read_text())['IE00BLNN3691']['securityContinuity']
  texts=[]
  for name,proof in zip(['expected','completion'],c['evidence']):
   raw=gzip.decompress((Path(__file__).parent/'fixtures'/f'weatherford-{name}-20261113.html.gz').read_bytes())
   self.assertEqual(hashlib.sha256(raw).hexdigest(),proof['sha256'])
   texts.append(BeautifulSoup(raw,'html.parser').get_text(' ',strip=True))
  self.assertIn('94708K',texts[0]);self.assertIn('103',texts[0])
  self.assertIn('one-for-one',texts[1]);self.assertIn('completed',texts[1].lower())
  self.assertEqual(c['successorIsin'][2:11],c['successorCusip'])
 def test_native_date_chooses_predecessor_and_successor_not_download_time(self):
  for stamp,want in [('2026-11-11','IE00BLNN3691'),('2026-11-12','IE00BLNN3691'),('2026-11-13','US94708K1034')]:
   for left,right in [('IE00BLNN3691','US94708K1034'),('US94708K1034','IE00BLNN3691')]:
    with self.subTest(stamp=stamp,left=left):
     value,proof=self.resolve(left,right,stamp)
     self.assertEqual(value,want);self.assertEqual(proof['portfolioAsOf'],stamp)
     self.assertIn('never price continuity',proof['scope'])
 def test_no_date_no_completion_unrelated_sedol_or_third_isin_still_fail_closed(self):
  self.assertIsNone(self.resolve(stamp=None))
  self.assertIsNone(self.resolve(now=dt.datetime(2026,11,12,tzinfo=dt.timezone.utc)))
  self.assertIsNone(self.resolve(sedol='2046251'))
  self.assertIsNone(self.resolve(right='US0378331005'))
 def test_collector_join_is_idempotent_dated_and_keeps_original_evidence_clocks(self):
  import json
  from collect_wisdomtree_holdings import complete_identity_mapping,_cached_identity_mapping
  retained={'GGRA':{'asOf':'2026-11-11','sourceUrl':'https://issuer.example/retained',
    'sha256':'a'*64,'rows':[{'sedol':'BLNN369','isin':'IE00BLNN3691'}]}}
  def books(now,required,stamp):return ({'BLNN369':'US94708K1034'},['2026-11-12'],{'https://issuer.example/current':'b'*64},[])
  _cached_identity_mapping.cache_clear();self.addCleanup(_cached_identity_mapping.cache_clear)
  # Read only retained book through the mock; the contract stays a real file.
  from pathlib import Path
  read_text=Path.read_text
  def read(path,*a,**kw):return json.dumps(retained)if path.name=='dca-complete-holdings.json'else read_text(path,*a,**kw)
  with patch('collect_wisdomtree_holdings.qualified_identity_books',side_effect=books),patch('pathlib.Path.read_text',new=read),patch('security_identifier_observations.retained_identity_pairs',side_effect=lambda r,now:r['rows']),patch('security_identifier_observations.mappings',return_value=({},{})):
   old=complete_identity_mapping(self.now,{'BLNN369'},'2026-11-11')
   again=complete_identity_mapping(self.now,{'BLNN369'},'2026-11-11')
   new=complete_identity_mapping(self.now,{'BLNN369'},'2026-11-13')
  self.assertIs(old,again);self.assertEqual(old[0]['BLNN369'],'IE00BLNN3691')
  self.assertEqual(new[0]['BLNN369'],'US94708K1034')
  self.assertEqual(old[1],['2026-11-12','2026-11-11'])
  self.assertEqual(len(old.continuity_resolutions),1)
  self.assertEqual(len(old[2]),4)
 def test_two_official_books_resolve_only_the_documented_event_and_native_date(self):
  with patch('collect_wisdomtree_holdings.IDENTITIES',[('one','https://issuer.example/1'),('two','https://issuer.example/2')]),patch('collect_wisdomtree_holdings.identity_document',return_value=b'book'),patch('collect_wisdomtree_holdings.identities',side_effect=[({'BLNN369':'US94708K1034'},'2026-11-12'),({'BLNN369':'IE00BLNN3691'},'2026-11-11')]):
   mapping,dates,proofs,_=qualified_identity_books(self.now,{'BLNN369'},'2026-11-11')
  self.assertEqual(mapping,{'BLNN369':'IE00BLNN3691'})
  self.assertEqual(dates,['2026-11-12','2026-11-11']);self.assertEqual(len(proofs),4)
 def test_future_native_date_is_rejected(self):
  from collect_wisdomtree_holdings import complete_identity_mapping
  with self.assertRaisesRegex(ValueError,'native portfolio date'):
   complete_identity_mapping(self.now,{'BLNN369'},'2026-11-14')

if __name__=='__main__':unittest.main()
