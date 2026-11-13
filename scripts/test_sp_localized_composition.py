"""Two exact native S&P compositions, transport alternatives without weaker checks."""
import copy,datetime as dt,gzip,json,pathlib,unittest,urllib.error
from unittest.mock import patch
from collect_sp_composition import collect,parse_public_data,public_data_routes
ROOT=pathlib.Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,11,13,7,tzinfo=dt.timezone.utc)
CONFIG=[c for c in json.loads((ROOT/'scripts/index-automation.json').read_text())['indices']if c.get('compositionIndexId')in[5475610,92388578]]

def raw(c):return gzip.decompress((ROOT/f"scripts/fixtures/sp-localized-native-20261113/{c['compositionIndexId']}.json.gz").read_bytes())

def denied(url):raise urllib.error.HTTPError(url,403,'Forbidden',{},None)

class LocalizedSpTests(unittest.TestCase):
 def test_real_native_responses_exact_identity_fields_dates_and_top_ten(self):
  self.assertEqual(len(CONFIG),2)
  for c in CONFIG:
   calls=[]
   def fetch(url):
    calls.append(url)
    if url==c['compositionDataUrl']:denied(url)
    return raw(c)
   with patch('sp_public_feed.read_response',side_effect=AssertionError('No handoff read after an actual source success')):
    result=collect(c,NOW,fetch)
   self.assertEqual(calls,[c['compositionDataUrl'],c['compositionAlternativeDataSources'][0]['url']])
   self.assertEqual(result['asOf'],'2026-10-30','Daily header Nov12 is not the composition date')
   self.assertEqual(result['constituents'],40 if c['compositionIndexId']==5475610 else 88)
   self.assertEqual(len(result['holdings']),10)
   self.assertEqual(result['source']['checkedAt'],'2026-11-13')
   self.assertIn('/spdji/es/',result['source']['url']);self.assertEqual(result['source']['locale'],'es')
   self.assertIn('403',result['source']['primaryAccessError'])
   self.assertEqual([a['status']for a in result['source']['accessAttempts']],['unavailable','validated'])
   self.assertEqual(result,collect(c,NOW,fetch),'Recollection is idempotent; no weight adjustment')
   self.assertNotIn('returns',result,'Composition transport does not import price-return levels as total-return history')
 def test_no_unbounded_unregistered_or_different_index_transport(self):
  c=CONFIG[0]
  mutations=[lambda x:x.update(compositionIndexId=999),lambda x:x.update(compositionAlternativeDataSources=[{},{}]),lambda x:x['compositionAlternativeDataSources'][0].update(url='https://example.org/data'),lambda x:x['compositionAlternativeDataSources'][0].update(pageUrl='https://www.spglobal.com/spdji/es/other/'),lambda x:x['compositionAlternativeDataSources'][0].update(languageId=True),lambda x:x['compositionAlternativeDataSources'][0].update(locale='en'),lambda x:x['compositionAlternativeDataSources'][0].update(url=x['compositionAlternativeDataSources'][0]['url']+'&language_id=2')]
  for change in mutations:
   v=copy.deepcopy(c);change(v)
   with self.subTest(config=v),self.assertRaises(ValueError):collect(v,NOW,lambda _:self.fail('Invalid route must fail before source request'))
 def test_downloaded_but_invalid_primary_never_falls_back(self):
  c=CONFIG[0];bad=json.loads(raw(c));bad['indexDetailHolder']['indexDetail']['indexId']=99;calls=[]
  def fetch(url):calls.append(url);return json.dumps(bad).encode()
  with self.assertRaisesRegex(ValueError,'identity'):collect(c,NOW,fetch)
  self.assertEqual(calls,[c['compositionDataUrl']])
 def test_alternative_keeps_all_financial_checks(self):
  c=CONFIG[0]
  changes=[lambda d:d['indexDetailHolder']['indexDetail'].update(indexId=99),lambda d:d['indexDetailHolder']['indexDetail'].update(currencyCode='JPY'),lambda d:d['indexCharacteristics'].update(constituentsCount=1),lambda d:d['idsIndexCountryBreakdownHolder']['indexCountryBreakdown'][0].update(indexWeight=-1),lambda d:d['indexSectorBreakdownHolder']['indexSectorBreakdown'][0].update(effectiveDate=1794459600000),lambda d:d['indexSectorBreakdownHolder']['indexSectorBreakdown'][0].update(sectorDescription='Unknown'),lambda d:d['constituentHolder']['constituents'].pop(),lambda d:d['indexCharacteristics'].update(topNConstituentWeight=0)]
  for mutation in changes:
   body=json.loads(raw(c));mutation(body)
   def fetch(url):
    if url==c['compositionDataUrl']:denied(url)
    return json.dumps(body).encode()
   with self.subTest(mutation=mutation),patch('sp_public_feed.read_response',side_effect=AssertionError('Invalid source cannot use cache')),self.assertRaises(ValueError):collect(c,NOW,fetch)
 def test_unchanged_primary_path_and_no_extra_request(self):
  for c in CONFIG:
   calls=[]
   result=collect(c,NOW,lambda url:(calls.append(url),raw(c))[1])
   self.assertEqual(calls,[c['compositionDataUrl']]);self.assertEqual(result['source']['url'],c['compositionDataUrl']);self.assertNotIn('primaryAccessError',result['source'])
 def test_failure_retains_handoff_retrieval_date_and_expiry(self):
  for c in CONFIG:
   # The existing real frozen handoff is still valid on Nov7, never on Nov13.
   result=collect(c,dt.datetime(2026,11,7,8,tzinfo=dt.timezone.utc),denied)
   self.assertEqual(result['source']['checkedAt'],'2026-11-06')
   self.assertEqual(result['source']['transport'],'official-response-handoff')
   self.assertEqual(len(result['source']['accessAttempts']),2)
   with self.assertRaisesRegex(ValueError,'expired'):collect(c,NOW,denied)
 def test_explicit_no_handoff_never_reads_cache(self):
  c={**CONFIG[0],'allowPublicHandoff':False}
  with patch('sp_public_feed.read_response',side_effect=AssertionError('No cache allowed')),self.assertRaisesRegex(ValueError,'unavailable'):
   collect(c,NOW,denied)
 def test_empty_or_invalid_json_is_not_a_source_success(self):
  c=CONFIG[0]
  for body in [b'',b'<html>Sign in</html>',b'{}']:
   with self.subTest(body=body),self.assertRaises((ValueError,KeyError)):
    collect(c,NOW,lambda _:body)

if __name__=='__main__':unittest.main()
