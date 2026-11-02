"""Real GitHub browser responses, isolated transport/financial failure scenarios."""
import base64
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import subprocess
import unittest
import urllib.error
from unittest.mock import patch
import collect_wisdomtree_holdings as c
from wisdomtree_api_holdings import CLASS_CONFIG
from wisdomtree_ranked_fields import parse_fields,augment_document
from wisdomtree_rankings_transport import public_browser_rankings,qualified_url

ROOT=Path(__file__).with_name('fixtures')/'wisdomtree-rankings-browser-20261102'
NOW=dt.datetime(2026,11,2,tzinfo=dt.timezone.utc)
ISIN='IE00BJGWQN72'
URL='https://dataspanapi.wisdomtree.com/funddetails/rankings/?ticker=WCLD%20LN&isoCode=en-GB'
def raw(isin=ISIN):return gzip.decompress((ROOT/(isin+'.raw.json.gz')).read_bytes())
def denied(code=403):return urllib.error.HTTPError(URL,code,'access denied',{},None)
def identity(*_):return {'identitySourceUrl':'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/'+ISIN,'identitySha256':'a'*64,'identityAsOf':'2026-09-30'}

class RankingsBrowser(unittest.TestCase):
 def setUp(self):
  self.clock=0
  self.addCleanup(patch.stopall)
  patch.object(c,'_RANKINGS_NEXT_AT',0).start()
  patch.object(c,'_RANKINGS_CLOCK',lambda:self.clock).start()
  patch.object(c,'_RANKINGS_SLEEP',lambda n:setattr(self,'clock',self.clock+n)).start()
  patch('wisdomtree_api_holdings.qualify_share_document',side_effect=identity).start()
 def share(self):return {'isin':ISIN,'currency':'USD','factsheetUrl':identity()['identitySourceUrl']}
 def test_only_explicit_public_routes_before_any_browser_process(self):
  self.assertTrue(qualified_url(URL))
  for url in [URL.replace('https:','http:'),URL+'&extra=1',URL.replace('WCLD','UNKNOWN'),URL+'#fragment',URL.replace('dataspanapi.wisdomtree.com','example.com'),URL.replace('en-GB','fr-FR')]:
   with self.subTest(url=url),patch('wisdomtree_rankings_transport.subprocess.run')as run:
    with self.assertRaises(ValueError):public_browser_rankings(url)
    run.assert_not_called()
 def test_browser_envelope_and_source_content_are_bounded(self):
  valid={'url':URL,'status':200,'contentType':'application/json','body':base64.b64encode(raw()).decode()}
  for result in [valid,{**valid,'url':URL+'x'},{**valid,'status':403},{**valid,'contentType':'text/html'},{**valid,'body':'not-base64!'},*[{**valid,'body':base64.b64encode(b).decode()}for b in [b'[]',b'{}',b'not-json']]]:
   with self.subTest(response=result.get('status')),patch('wisdomtree_rankings_transport.subprocess.run',return_value=subprocess.CompletedProcess([],0,json.dumps(result).encode(),b''))as run:
    if result==valid:self.assertEqual(public_browser_rankings(URL),raw())
    else:
     with self.assertRaises((ValueError,KeyError)):public_browser_rankings(URL)
    self.assertEqual(run.call_args.kwargs['timeout'],55)
 def test_exact_http403_then_same_share_browser_is_financially_validated(self):
  with patch.object(c,'acquire_public_rankings',side_effect=denied()),patch('wisdomtree_rankings_transport.public_browser_rankings',return_value=raw())as browser:
   result=c.acquire_qualified_public_rankings(self.share(),NOW)
   self.assertEqual(result[0],raw());browser.assert_called_once_with(URL)
   self.assertEqual([(a['transport'],a['status'])for a in result[4]],[('http','unavailable'),('browser','downloaded')])
 def test_http_success_and_invalid_financial_content_never_use_browser(self):
  for body in [raw(),b'[]',raw().replace(b'WisdomTree Cloud Computing',b'Wrong Fund Cloud Computing')]:
   with patch.object(c,'acquire_public_rankings',return_value=body),patch('wisdomtree_rankings_transport.public_browser_rankings')as browser:
    if body==raw():c.acquire_qualified_public_rankings(self.share(),NOW)
    else:
     with self.assertRaises(ValueError):c.acquire_qualified_public_rankings(self.share(),NOW)
    browser.assert_not_called()
 def test_browser_never_bypasses_identity_date_or_weight_checks(self):
  for change in [lambda r:r[0].__setitem__('wtID',0),lambda r:r[0].__setitem__('dt','2026-12-01T00:00:00Z'),lambda r:r[0].__setitem__('pct',9)]:
   body=json.loads(raw());change(body)
   with patch.object(c,'acquire_public_rankings',side_effect=denied()),patch('wisdomtree_rankings_transport.public_browser_rankings',return_value=json.dumps(body).encode()):
    with self.assertRaises(ValueError):c.acquire_qualified_public_rankings(self.share(),NOW)
 def test_no_browser_retry_after_authentication_missing_route_or_rate_limit(self):
  for code in [401,404,429,500]:
   with patch.object(c,'acquire_public_rankings',side_effect=denied(code)),patch('wisdomtree_rankings_transport.public_browser_rankings')as browser:
    with self.assertRaises((urllib.error.HTTPError,ConnectionError)):c.acquire_qualified_public_rankings(self.share(),NOW)
    browser.assert_not_called()
 def test_injected_fetch_never_invokes_real_browser_without_explicit_injection(self):
  with patch.object(c,'acquire_public_rankings',side_effect=denied()),patch('wisdomtree_rankings_transport.public_browser_rankings')as browser:
   with self.assertRaises(ConnectionError):c.acquire_qualified_public_rankings(self.share(),NOW,lambda *_:b'isolated')
   browser.assert_not_called()
 def test_parallel_fallback_requests_remain_serialized_and_paced(self):
  from concurrent.futures import ThreadPoolExecutor
  import time
  active=0;maximum=0;starts=[]
  def browser(_):
   nonlocal active,maximum
   active+=1;maximum=max(maximum,active);starts.append(self.clock);time.sleep(.005);active-=1;return raw()
  with patch.object(c,'acquire_public_rankings',side_effect=denied()):
   with ThreadPoolExecutor(max_workers=4)as pool:results=list(pool.map(lambda _:c.acquire_qualified_public_rankings(self.share(),NOW,browser_fetch=browser),range(4)))
  self.assertEqual(maximum,1);self.assertEqual(starts,[0,2,4,6]);self.assertTrue(all(r[0]==raw()for r in results))
 def test_failed_browser_preserves_primary_error_and_reports_both_attempts(self):
  with patch.object(c,'acquire_public_rankings',side_effect=denied()),patch('wisdomtree_rankings_transport.public_browser_rankings',side_effect=TimeoutError('isolated browser timeout')):
   with self.assertRaisesRegex(ConnectionError,'browser timeout'):c.acquire_qualified_public_rankings(self.share(),NOW)
 def test_real_four_fund_responses_keep_original_dates_and_partial_top_ten(self):
  probe=json.loads((ROOT/'probe.json').read_text());self.assertEqual(len(probe['rows']),4)
  import hashlib
  for receipt in probe['rows']:
   isin=receipt['isin'];body=raw(isin);self.assertEqual(hashlib.sha256(body).hexdigest(),receipt['sha256'])
   values,errors=parse_fields(json.loads(body),{'isin':isin,'currency':CLASS_CONFIG[isin]['currency']},NOW,CLASS_CONFIG[isin]['fundTicker']);self.assertEqual(errors,[]);self.assertEqual(set(values),{'countries','holdings','sectors'})
   self.assertTrue(all(v['asOf']=='2026-10-23'for v in values.values()));self.assertEqual(len(values['holdings']['rows']),10);self.assertLess(sum(x['weightPct']for x in values['holdings']['rows']),100)
 def test_ordinary_document_wrapper_retains_primary_incident_and_real_fallback_fields(self):
  with patch('wisdomtree_ranked_fields.download',side_effect=denied()),patch('wisdomtree_rankings_transport.public_browser_rankings',return_value=raw()):
   result=augment_document({},self.share(),NOW,b'PDF really acquired by caller',browser_fetch=lambda _:raw())
  self.assertTrue(all(k in result for k in ['countries','holdings','sectors']));errors=result['collectionErrors'];self.assertEqual(len(errors),1);self.assertEqual(errors[0]['field'],'rankings-primary-http');self.assertTrue(errors[0]['qualifiedFallbackAvailable']);self.assertEqual(errors[0]['qualifiedFields'],['countries','holdings','sectors'])
 def test_older_browser_snapshot_never_renews_newer_financial_values_or_proofs(self):
  previous={'holdings':{'asOf':'2026-10-28','checkedAt':'2026-10-29','sha256':'b'*64,'rows':[{'name':'Known current company','weightPct':3}]}}
  with patch('wisdomtree_ranked_fields.download',side_effect=denied()),patch('wisdomtree_rankings_transport.public_browser_rankings',return_value=raw()):result=augment_document(copy.deepcopy(previous),self.share(),NOW,b'PDF',browser_fetch=lambda _:raw())
  self.assertEqual(result['holdings'],previous['holdings']);self.assertTrue(any(a.get('deferred')for a in result['sourceAttempts']));self.assertNotIn('holdings',result['collectionErrors'][-1]['qualifiedFields'])

 def test_injected_document_downloader_does_not_launch_browser_implicitly(self):
  with patch('wisdomtree_ranked_fields.download',side_effect=denied()),patch('wisdomtree_rankings_transport.public_browser_rankings')as browser:
   result=augment_document({},self.share(),NOW,b'isolated PDF')
   browser.assert_not_called();self.assertNotIn('holdings',result);self.assertTrue(result['collectionErrors'])
 def test_same_date_conflict_remains_refused_and_is_not_claimed_qualified(self):
  values,_=parse_fields(json.loads(raw()),self.share(),NOW,'WCLD LN');prior=copy.deepcopy(values);prior['holdings']['rows'][0]['weightPct']+=.1
  with patch('wisdomtree_ranked_fields.download',side_effect=denied()):
   result=augment_document(prior,self.share(),NOW,b'PDF',browser_fetch=lambda _:raw())
  self.assertNotIn('holdings',result);self.assertTrue(any(e['field']=='holdings'for e in result['collectionErrors']));self.assertNotIn('holdings',result['collectionErrors'][-1]['qualifiedFields'])

if __name__=='__main__':unittest.main()
