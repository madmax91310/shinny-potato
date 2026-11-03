import copy,datetime as dt,gzip,hashlib,json,pathlib,unittest
from unittest.mock import patch
from collect_wisdomtree_holdings import parse_public_rankings,collect_public_rankings
from wisdomtree_api_holdings import CLASS_CONFIG
FIX=pathlib.Path(__file__).with_name('fixtures')/'wisdomtree-complete'
NOW=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)
def load(isin):return json.loads(gzip.decompress((FIX/(isin+'.rankings.json.gz')).read_bytes()))
class PublicRankings(unittest.TestCase):
 def setUp(self):
  self.clock=0
  def advance(seconds):self.clock+=seconds
  for target,kwargs in [('_RANKINGS_CLOCK',{'side_effect':lambda:self.clock}),('_RANKINGS_SLEEP',{'side_effect':advance}),('_RANKINGS_NEXT_AT',{'new':0})]:
   replacement=patch('collect_wisdomtree_holdings.'+target,**kwargs);replacement.start();self.addCleanup(replacement.stop)

 def test_public_feed_retries_are_bounded_and_serialized_across_funds(self):
  import urllib.error
  from collect_wisdomtree_holdings import acquire_public_rankings
  calls=[]
  def fetch(url,**kwargs):
   calls.append((self.clock,kwargs));
   if len(calls)<3:raise urllib.error.HTTPError(url,403,'Forbidden',{},None)
   return b'[]'
  self.assertEqual(acquire_public_rankings('https://dataspanapi.wisdomtree.com/funddetails/rankings/',fetch,{'Accept':'application/json'}),b'[]')
  self.assertEqual([x[0]for x in calls],[0,4,12])
  self.assertTrue(all(x[1]['max_attempts']==1 for x in calls))
  calls.clear()
  def unavailable(url,**kwargs):calls.append(url);raise urllib.error.HTTPError(url,403,'Forbidden',{},None)
  with self.assertRaises(urllib.error.HTTPError):acquire_public_rankings('https://dataspanapi.wisdomtree.com/funddetails/rankings/',unavailable,{})
  self.assertEqual(len(calls),3)
  calls.clear()
  def missing(url,**kwargs):calls.append(url);raise urllib.error.HTTPError(url,404,'Missing',{},None)
  with self.assertRaises(urllib.error.HTTPError):acquire_public_rankings('https://dataspanapi.wisdomtree.com/funddetails/rankings/',missing,{})
  self.assertEqual(len(calls),1)

 def test_concurrent_funds_share_one_public_feed_and_identity_snapshot(self):
  import time
  from concurrent.futures import ThreadPoolExecutor
  from collect_wisdomtree_holdings import acquire_public_rankings,complete_identity_mapping,_cached_identity_mapping
  active=0;maximum=0;starts=[]
  def fetch(url,**kwargs):
   nonlocal active,maximum
   active+=1;maximum=max(maximum,active);starts.append(self.clock)
   time.sleep(.005);active-=1;return b'[]'
  with ThreadPoolExecutor(max_workers=4)as pool:
   self.assertEqual(list(pool.map(lambda _:acquire_public_rankings('https://dataspanapi.wisdomtree.com/funddetails/rankings/',fetch,{}),range(4))),[b'[]']*4)
  self.assertEqual(maximum,1);self.assertEqual(starts,[0,2,4,6])
  _cached_identity_mapping.cache_clear();self.addCleanup(_cached_identity_mapping.cache_clear)
  with patch('collect_wisdomtree_holdings.IDENTITIES',[('TEST','https://issuer.example/identities')]),patch('collect_wisdomtree_holdings.identity_document',return_value=b'identity')as acquire,patch('collect_wisdomtree_holdings.identities',return_value=({'0000001':'US0378331005'},'2026-10-28')),patch('security_identifier_observations.retained_identity_pairs',return_value=[]),patch('security_identifier_observations.mappings',return_value=({},{})):
   with ThreadPoolExecutor(max_workers=4)as pool:results=list(pool.map(lambda _:complete_identity_mapping(NOW),range(4)))
   self.assertEqual(acquire.call_count,1);self.assertTrue(all(r==results[0]for r in results))

 def test_captured_fixture_hashes_match_the_committed_bodies(self):
  manifest=json.loads((FIX/'manifest.json').read_text())
  for isin,entry in manifest['observations'].items():
   for key,suffix in [('json','.json.gz'),('pdf','.pdf.gz'),('rankings','.rankings.json.gz'),('ssrComparison','.ssr-rankings.json.gz'),*([('alternateListing','.rankings-gbpx.json.gz')]if 'alternateListing'in entry else[])]:
    with self.subTest(isin=isin,source=key):
     raw=gzip.decompress((FIX/(isin+suffix)).read_bytes())
     self.assertEqual(hashlib.sha256(raw).hexdigest(),entry[key]['sha256'])
     self.assertEqual(len(raw),entry[key]['bytes'])

 def test_all_six_fund_files_match_independent_ssr_no_country_sector_index_double_count(self):
  for isin,config in CLASS_CONFIG.items():
   with self.subTest(isin=isin):
    body=load(isin);fund=[r for r in body if r['rankClassificationID']==1]
    rows,date=parse_public_rankings(body,{'isin':isin},NOW,{fund[0]['additionalInfo2']:'US0378331005'})
    self.assertEqual(date,'2026-10-23');self.assertEqual(len(rows),len(fund))
    self.assertAlmostEqual(sum(r['weightPct']for r in rows),100,delta=.02)
    self.assertGreater(sum(r['pct']for r in body),3.9,'Other classifications exist but never enter the holdings')
    original=json.loads(gzip.decompress((FIX/(isin+'.ssr-rankings.json.gz')).read_bytes()))
    self.assertEqual({r['additionalInfo2']:(r['pct'],r['dt'][:10])for r in fund},
                     {r['descriptorB']:(r['pctWeight'],r['dt'][:10])for r in original})
    self.assertEqual(sum(r['isin']is not None for r in rows),1)
    with self.assertRaises(ValueError):parse_public_rankings(fund[:10],{'isin':isin},NOW,{fund[0]['additionalInfo2']:'US0378331005'})

 def test_identity_discovery_uses_the_same_complete_fund_perimeter_without_assigning_isins(self):
  from collect_wisdomtree_holdings import public_identity_candidates
  isin='IE00BZ56SW52';raw=gzip.decompress((FIX/(isin+'.rankings.json.gz')).read_bytes());doc=gzip.decompress((FIX/(isin+'.pdf.gz')).read_bytes())
  rows=public_identity_candidates({'isin':isin,'currency':'USD'},NOW,lambda url,**kwargs:doc if '/pdr/'in url else raw)
  self.assertEqual(len(rows),560);self.assertTrue(all('isin'not in r for r in rows))
  self.assertTrue(all(r['candidateShareIsin']==isin for r in rows))
  self.assertTrue(all(r['candidateAsOf']=='2026-10-23' for r in rows))
  self.assertAlmostEqual(sum(r['weightPct']for r in rows),99.9996)
  bad=[r for r in json.loads(raw)if r['rankClassificationID']==1][:10]
  with self.assertRaises(ValueError):public_identity_candidates({'isin':isin,'currency':'USD'},NOW,lambda url,**kwargs:doc if '/pdr/'in url else json.dumps(bad).encode())

 def test_same_share_alternate_listing_preserves_exact_fund_weights(self):
  isin='IE00BZ56SW52';payload=json.loads(gzip.decompress((FIX/(isin+'.rankings-gbpx.json.gz')).read_bytes()))
  primary=load(isin);mapping={'2046251':'US0378331005'}  # Apple in the immutable issuer fixture; independent of live portfolios
  rows,stamp=parse_public_rankings(payload,{'isin':isin},NOW,mapping,'GGRG LN')
  original,date=parse_public_rankings(primary,{'isin':isin},NOW,mapping)
  self.assertEqual(rows,original);self.assertEqual(stamp,date)
  with self.assertRaisesRegex(ValueError,'Wrong exact'):parse_public_rankings(payload,{'isin':isin},NOW,mapping)
  with self.assertRaisesRegex(ValueError,'Unqualified exact-share'):parse_public_rankings(payload,{'isin':isin},NOW,mapping,'GGRA IM')

 def test_transport_fallback_requires_the_same_isin_listing_in_issuer_document(self):
  import urllib.error
  from wisdomtree_api_holdings import qualify_share_document
  isin='IE00BZ56SW52';payload=gzip.decompress((FIX/(isin+'.rankings-gbpx.json.gz')).read_bytes());doc=gzip.decompress((FIX/(isin+'.pdf.gz')).read_bytes());calls=[]
  mapping={'2046251':'US0378331005'}  # Apple in the immutable issuer fixture; independent of live portfolios
  def fetch(url,**kwargs):
   calls.append(url)
   if '/pdr/'in url:return doc
   if 'GGRA%20LN'in url:raise urllib.error.HTTPError(url,403,'Forbidden',{},None)
   self.assertIn('GGRG%20LN',url);return payload
  with patch('collect_wisdomtree_holdings.complete_identity_mapping',return_value=(mapping,['2026-10-28'],{})):
   h=collect_public_rankings({'isin':isin,'currency':'USD'},NOW,fetch)
  self.assertEqual(h['requestedListingTicker'],'GGRG LN');self.assertEqual(h['asOf'],'2026-10-23')
  self.assertTrue(h['complete']);self.assertEqual(len(calls),5)
  self.assertEqual(h['qualifiedRankingListings'][0]['tradingCurrency'],'GBx')
  self.assertEqual(h['accessAttempts'][0]['status'],'unavailable')
  self.assertAlmostEqual(sum(r['weightPct']for r in h['rows']),99.9996)
  from issuer_documents import pdf_text
  text=pdf_text(doc).replace('BYZK6Q0','INVALID')
  calls.clear()
  with patch('wisdomtree_api_holdings.pdf_text',return_value=text),self.assertRaises(ConnectionError):
   collect_public_rankings({'isin':isin,'currency':'USD'},NOW,fetch)
  self.assertFalse(any('GGRG%20LN'in u for u in calls),'No unproved listing fallback')

 def test_identity_partial_future_negative_duplicate_and_wrong_scopes_refused(self):
  isin='IE00BJGWQN72';original=load(isin);mapping={original[0]['additionalInfo2']:'US0378331005'}
  for key,value in [('wtID',1),('ticker','WTAI LN'),('entityName','Other fund'),('dt','2026-10-30'),('dt','2026-10-22'),('pct',float('nan')),('pct',-.01),('pct',.7),('ranking',999),('additionalInfo2',original[1]['additionalInfo2']),('rankClassification','Index'),('rankClassificationID',True)]:
   body=copy.deepcopy(original);body[0][key]=value
   with self.subTest(key=key,value=value),self.assertRaises(ValueError):parse_public_rankings(body,{'isin':isin},NOW,mapping)
  body=[r for r in original if r['rankClassificationID']!=1]
  with self.assertRaises(ValueError):parse_public_rankings(body,{'isin':isin},NOW,mapping)

 def test_real_document_acquisition_and_independently_dated_identities(self):
  isin='IE00BJGWQN72';body=load(isin);raw=json.dumps(body).encode();doc=gzip.decompress((FIX/(isin+'.pdf.gz')).read_bytes())
  mapping={r['additionalInfo2']:f'US{i:010d}'for i,r in enumerate(body)if r['rankClassificationID']==1}
  calls=[]
  def fetch(url,**kwargs):
   calls.append(url)
   if '/funddetails/'in url:
    self.assertIn('WCLD%20LN',url)
    self.assertEqual(kwargs['headers']['Accept'],'application/json')
    self.assertEqual(kwargs['headers']['Origin'],'https://www.wisdomtree.com')
   return doc if '/pdr/'in url else raw
  with patch('collect_wisdomtree_holdings.complete_identity_mapping',return_value=(mapping,['2026-10-28'],{})):
   h=collect_public_rankings({'isin':isin,'currency':'USD'},NOW,fetch)
   self.assertEqual(h['asOf'],'2026-10-23');self.assertEqual(h['identityAsOf'],'2026-09-30')
   self.assertEqual(h['identityAsOfDates'],['2026-10-28']);self.assertTrue(h['complete'])
   self.assertEqual(h['unidentifiedWeightPct'],0);self.assertEqual(len(calls),2)
   self.assertEqual(h['coverageProof']['rankClassificationID'],1)
  with patch('collect_wisdomtree_holdings.complete_identity_mapping',return_value=(mapping,['2020-01-01'],{})):
   with self.assertRaisesRegex(ValueError,'dates incompatible'):collect_public_rankings({'isin':isin,'currency':'USD'},NOW,fetch)
