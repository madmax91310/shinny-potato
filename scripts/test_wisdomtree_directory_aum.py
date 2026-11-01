"""Real issuer-directory replay and isolated failures; no provider certification."""
import copy,datetime as dt,gzip,json,pathlib,unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
import urllib.error
import wisdomtree_directory_aum as module
from wisdomtree_directory_aum import parse,augment_aum,acquire
ROOT=pathlib.Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,10,30,tzinfo=dt.timezone.utc)

class DirectoryAum(unittest.TestCase):
 def setUp(self):
  self.raw=gzip.decompress((ROOT/'scripts/fixtures/wisdomtree-complete/native-aum-directory-20261030.json.gz').read_bytes());self.payload=json.loads(self.raw)
  self.shares=[]
  for name in ['additional-etf-sources.json','exposure-etf-expansion.json','non-bond-expansion-sources.json']:
   config=json.loads((ROOT/'scripts'/name).read_text());items=config['instruments']if isinstance(config,dict)else config
   self.shares.extend(r for r in items if r.get('documentType')in {'wisdomtree','wisdomtree-ucits'})
  self.share=next(s for s in self.shares if s['isin']=='IE00BJGWQN72');module._RESPONSES.clear()
 def result(self):
  return {'productId':self.share['isin'],'currency':self.share['currency'],'characteristics':{'terPct':.4,'asOf':'2026-09-30','sourceUrl':self.share['factsheetUrl'],'sha256':'a'*64},'countries':{'asOf':'2026-10-15','checkedAt':'2026-10-20','rows':[{'name':'US','weightPct':100}]},'unavailable':['HTML unavailable: current official PDF used; AUM not published, previous dated value preserved','aum: not published in this factsheet','countries: incomplete official composition']}
 def native(self,data):return next(r for r in data if r.get('ISIN')==self.share['isin'] and r.get('listingCCY')=='USD')
 def test_exact_fifteen_existing_instruments_keep_native_amount_units_and_own_dates(self):
  self.assertEqual(len(self.shares),15)
  for share in self.shares:
   with self.subTest(isin=share['isin']):
    r=parse(self.payload,share,NOW);self.assertEqual(r['currency'],share['currency']);self.assertEqual(r['asOf'],'2026-10-29');self.assertEqual(r['scope'],'fund');self.assertTrue(r['controlledListingIds'])
  r=parse(self.payload,self.share,NOW);self.assertEqual(r['amount'],400637024);self.assertNotEqual(r['amount'],self.native(self.payload)['AUMusd']);self.assertNotEqual(r['amount'],self.native(self.payload)['Net_Assets'])
 def test_non_native_conversion_is_never_used_even_when_the_native_row_is_absent(self):
  foreign=[r for r in self.payload if r.get('ISIN')==self.share['isin']and r.get('listingCCY')=='GBP'];self.assertTrue(foreign);self.assertGreater(foreign[0]['AUMusd'],500000000)
  with self.assertRaisesRegex(ValueError,'native-currency'):parse(foreign,self.share,NOW)
 def test_identity_amount_and_date_failures_do_not_fall_back_to_other_fields(self):
  mutations=[{'ISIN':'IE00WRONG000'},{'fundCurrency':'EUR'},{'baseCCY':'EUR'},{'listingCCY':'GBP'},{'displayName':'Other fund'},{'FactsheetURL':'https://example.test/document'},{'fundStructure':'ETPs'},{'leverageFactor':2},{'wtDivision':'Other region'},{'wtListingID':None},{'AUM':None},{'AUM':True},{'AUM':0},{'AUM':float('nan')},{'AUM_DateTime':None},{'AUM_DateTime':'2026-11-01T00:00:00Z'},{'AUM_DateTime':'2026-06-01T00:00:00Z'}]
  for change in mutations:
   with self.subTest(change=change):
    data=copy.deepcopy(self.payload);self.native(data).update(change)
    with self.assertRaises(ValueError):parse(data,self.share,NOW)
 def test_partial_directory_fails_only_the_expected_instrument_without_dropping_others(self):
  data=copy.deepcopy(self.payload);self.native(data)['AUM']=None;valid=[];failed=[]
  for share in self.shares:
   try:parse(data,share,NOW);valid.append(share['isin'])
   except ValueError:failed.append(share['isin'])
  self.assertEqual(failed,[self.share['isin']]);self.assertEqual(len(valid),14)
 def test_conflicting_duplicate_native_rows_are_not_averaged_or_majority_selected(self):
  data=copy.deepcopy(self.payload);extra=copy.deepcopy(self.native(data));extra['AUM']+=1;data.append(extra)
  with self.assertRaisesRegex(ValueError,'Conflicting native'):parse(data,self.share,NOW)
 def test_one_actual_current_response_is_shared_across_workers_not_fifteen_fetches(self):
  calls=[]
  def fetch(url,**kw):calls.append((url,kw));return self.raw
  with ThreadPoolExecutor(max_workers=8)as pool:results=list(pool.map(lambda _:acquire(NOW,fetch),self.shares))
  self.assertEqual(len(calls),1);self.assertEqual(len(results),15);self.assertEqual(calls[0][1]['max_attempts'],1)
 def test_failed_shared_attempt_is_explicit_for_each_missing_field_and_never_a_cache_success(self):
  calls=[]
  def fetch(*a,**kw):calls.append(1);raise OSError('isolated offline')
  for _ in range(2):
   r=augment_aum(self.result(),self.share,NOW,fetch);self.assertNotIn('aum',r);self.assertEqual([e['field']for e in r['collectionErrors']],['aum']);self.assertEqual(r['sourceAttempts'][-1]['status'],'unavailable');self.assertEqual(r['countries']['checkedAt'],'2026-10-20')
  self.assertEqual(len(calls),1)
 def test_empty_or_modified_response_keeps_last_value_and_freshness(self):
  for raw in (b'[]',b'{}',b'not-json'):
   def fetch(*a,**kw):return raw
   r=self.result();r['aum']={'amount':123,'currency':'USD','scope':'fund','asOf':'2026-10-27','checkedAt':'2026-10-28'};prior=copy.deepcopy(r['aum']);out=augment_aum(r,self.share,NOW,fetch)
   self.assertEqual(out['aum'],prior);self.assertEqual(out['sourceAttempts'][-1]['status'],'unavailable')
 def test_success_updates_aum_only_without_borrowing_source_clocks_for_other_fields(self):
  r=self.result();before=copy.deepcopy(r);out=augment_aum(r,self.share,NOW,lambda *a,**kw:self.raw)
  self.assertEqual(out['aum']['amount'],400637024);self.assertEqual(out['aum']['asOf'],'2026-10-29');self.assertNotIn('checkedAt',out['aum']);self.assertEqual(out['countries'],before['countries']);self.assertEqual(out['characteristics'],before['characteristics']);self.assertEqual(out['aum']['identityAsOf'],'2026-09-30');self.assertEqual(out['sourceAttempts'][-1]['fields'],['aum']);self.assertNotIn('aum: not published in this factsheet',out['unavailable']);self.assertIn('countries: incomplete official composition',out['unavailable'])
 def test_same_date_contradiction_is_quarantined_and_older_result_cannot_replace_newer(self):
  r=self.result();r['aum']={'amount':123,'currency':'USD','scope':'fund','asOf':'2026-10-29','checkedAt':'2026-10-20'}
  out=augment_aum(r,self.share,NOW,lambda *a,**kw:self.raw);self.assertNotIn('aum',out);self.assertIn('Same-date',out['collectionErrors'][-1]['reason'])
  r=self.result();r['aum']={'amount':123,'currency':'USD','scope':'fund','asOf':'2026-10-30','checkedAt':'2026-10-30'};before=copy.deepcopy(r['aum']);out=augment_aum(r,self.share,NOW,lambda *a,**kw:self.raw);self.assertEqual(out['aum'],before);self.assertEqual(out['sourceAttempts'][-1]['fields'],[])
 def test_missing_current_identity_prevents_directory_field_certification(self):
  r=self.result();r['characteristics'].pop('sha256');calls=[]
  out=augment_aum(r,self.share,NOW,lambda *a,**kw:calls.append(1));self.assertEqual(calls,[]);self.assertNotIn('aum',out);self.assertEqual(out['collectionErrors'][-1]['phase'],'validation')
 def test_ordinary_etf_fallback_keeps_pdf_fields_and_adds_only_directory_aum(self):
  from collect_public_issuer import collect_one
  body=gzip.decompress((ROOT/'scripts/fixtures/wisdomtree-complete/IE00BJGWQN72.pdf.gz').read_bytes());calls=[]
  def fetch(url,**kw):
   calls.append(url)
   if url==self.share['factsheetUrl']:return body
   self.assertEqual(url,module.ROUTES['wisdomtree']['fundDirectory']);return self.raw
  with patch('collect_public_issuer.get_text',side_effect=urllib.error.URLError('isolated primary403')),patch('collect_public_issuer.download',side_effect=fetch),patch('wisdomtree_ranked_fields.augment_document',side_effect=lambda result,*args:result):
   result=collect_one(self.share,NOW)
  self.assertEqual(result['aum']['amount'],400637024);self.assertEqual(result['aum']['asOf'],'2026-10-29');self.assertEqual(result['characteristics']['terPct'],.4);self.assertEqual(len(calls),2)
  self.assertEqual(result['aum']['identitySha256'],__import__('hashlib').sha256(body).hexdigest())
 def test_successful_unchanged_value_keeps_observation_period(self):
  r=self.result();value=parse(self.payload,self.share,NOW);r['aum']={**value,'checkedAt':'2026-10-29'};before=copy.deepcopy(r['aum']);out=augment_aum(r,self.share,NOW,lambda *a,**kw:self.raw)
  self.assertEqual(out['aum'],before);self.assertEqual(out['sourceAttempts'][-1]['deferred'][0]['asOf'],'2026-10-29')

 def test_public_browser_recovery_is_shared_and_does_not_repair_primary_access(self):
  calls=[]
  def primary(*args,**kwargs):calls.append('http');raise urllib.error.HTTPError(module.ROUTES['wisdomtree']['fundDirectory'],403,'Forbidden',{},None)
  def browser(url):calls.append('browser');return self.raw
  with ThreadPoolExecutor(max_workers=8)as pool:
   results=list(pool.map(lambda _:augment_aum(self.result(),self.share,NOW,primary,browser_fetch=browser),self.shares))
  self.assertEqual(calls,['http','browser'])
  for result in results:
   self.assertEqual(result['aum']['amount'],400637024);self.assertEqual(result['aum']['asOf'],'2026-10-29')
   self.assertEqual(result['countries']['checkedAt'],'2026-10-20')
   self.assertEqual([e['field']for e in result['collectionErrors']],['aum-primary-http'])
   self.assertTrue(result['collectionErrors'][0]['qualifiedFallbackAvailable'])
   self.assertEqual([a['status']for a in result['sourceAttempts'][-1]['transportAttempts']],['unavailable','downloaded'])
 def test_successful_primary_never_invokes_browser(self):
  browser=__import__('unittest.mock',fromlist=['Mock']).Mock(side_effect=AssertionError('unexpected browser'))
  payload,url,digest=acquire(NOW,lambda *a,**k:self.raw,browser_fetch=browser)
  self.assertEqual(payload,self.payload);browser.assert_not_called()
 def test_modified_primary_format_does_not_trigger_browser(self):
  for body in [b'[]',b'{}',b'not-json']:
   module._RESPONSES.clear();calls=[]
   with self.assertRaises(ValueError):acquire(NOW,lambda *a,**k:body,browser_fetch=lambda url:calls.append(url))
   self.assertEqual(calls,[])
 def test_both_transports_fail_once_and_recovery_uses_a_new_execution(self):
  calls=[]
  def primary(*a,**k):calls.append('http');raise OSError('isolated primary403')
  def browser(url):calls.append('browser');raise OSError('isolated browser403')
  for _ in range(2):
   result=self.result();result['aum']={'amount':123,'currency':'USD','scope':'fund','asOf':'2026-10-27','checkedAt':'2026-10-28'};prior=copy.deepcopy(result['aum'])
   result=augment_aum(result,self.share,NOW,primary,browser_fetch=browser)
   self.assertEqual(result['aum'],prior);self.assertEqual(len(result['sourceAttempts'][-1]['transportAttempts']),2)
   self.assertEqual([e['field']for e in result['collectionErrors']],['aum'])
  self.assertEqual(calls,['http','browser'])
  recovered=augment_aum(self.result(),self.share,NOW+dt.timedelta(days=1),primary,browser_fetch=lambda url:self.raw)
  self.assertEqual(recovered['aum']['asOf'],'2026-10-29');self.assertNotIn('checkedAt',recovered['aum'])
 def test_browser_result_cannot_regress_a_newer_retained_primary(self):
  def primary(*a,**k):raise OSError('isolated primary403')
  result=self.result();result['aum']={'amount':123,'currency':'USD','scope':'fund','asOf':'2026-10-30','checkedAt':'2026-10-30'};prior=copy.deepcopy(result['aum'])
  out=augment_aum(result,self.share,NOW,primary,browser_fetch=lambda url:self.raw)
  self.assertEqual(out['aum'],prior);self.assertEqual(out['sourceAttempts'][-1]['fields'],[])
 def test_browser_envelope_identity_status_format_and_size_are_rechecked(self):
  import base64,types
  url=module.ROUTES['wisdomtree']['fundDirectory']
  good={'url':url,'status':200,'contentType':'application/json; charset=utf-8','body':base64.b64encode(self.raw).decode()}
  with patch('wisdomtree_directory_aum.subprocess.run',return_value=types.SimpleNamespace(stdout=json.dumps(good).encode())):
   self.assertEqual(module.public_browser_directory(url),self.raw)
  for change in [{'url':url+'&other=1'},{'status':403},{'contentType':'text/html'},{'body':'not base64'},{'body':''}]:
   with self.subTest(change=change),patch('wisdomtree_directory_aum.subprocess.run',return_value=types.SimpleNamespace(stdout=json.dumps({**good,**change}).encode())):
    with self.assertRaises((ValueError,__import__('binascii').Error)):module.public_browser_directory(url)
  with patch('wisdomtree_directory_aum.subprocess.run')as run:
   with self.assertRaises(ValueError):module.public_browser_directory('https://example.test/other')
   run.assert_not_called()
 def test_browser_body_still_requires_the_exact_native_financial_contract(self):
  wrong=copy.deepcopy(self.payload);self.native(wrong)['AUM']=None
  def primary(*a,**k):raise OSError('isolated primary403')
  result=augment_aum(self.result(),self.share,NOW,primary,browser_fetch=lambda url:json.dumps(wrong).encode())
  self.assertNotIn('aum',result);self.assertEqual(result['collectionErrors'][-1]['field'],'aum')

if __name__=='__main__':unittest.main()
