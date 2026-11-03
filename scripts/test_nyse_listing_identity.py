import copy
import base64
import urllib.error
import datetime as dt
import hashlib
import json
from pathlib import Path
import unittest
from exchange_listing_refresh import refresh
from nyse_listing_identity import qualify,spotify_identifier_bridge
from producer_report_plans import build_plan
from producer_report_contract import finish,normalize_contract
ROOT=Path(__file__).resolve().parents[1]
ROWS=json.loads((ROOT/'scripts/fixtures/nyse-identities-20261102/official-identity-subsets.json').read_text())
REFERENCE=json.loads((ROOT/'scripts/fixtures/nyse-identities-20261102/registered-references.json').read_text())
NOW=dt.datetime(2026,11,2,12,tzinfo=dt.timezone.utc)
EMPTY=b'ACT Symbol|Security Name|Exchange|ETF\nFile Creation Time: 11022026\n'

def registered(ticker='NET'):
 return copy.deepcopy(next(r for r in REFERENCE['listings']if r['ticker']==ticker))
def isin(row):
 return REFERENCE['isinByListingId'][row['id']]
def payload(ticker='NET'):
 return json.dumps({'quote':next(r['identity']for r in ROWS if r['ticker']==ticker)}).encode()

class NyseIdentity(unittest.TestCase):
 def test_historical_fixture_does_not_track_a_newer_live_directory(self):
  self.assertEqual(REFERENCE['referenceCommit'],'0c244dcbf1d76373bf26a6c35d13df7c567c0e22')
  row=registered();self.assertEqual(row['listingObservation']['asOf'],'2026-10-30')
  self.assertEqual(qualify(row,isin(row),payload(),NOW)['asOf'],'2026-10-30')
  newer=copy.deepcopy(row);newer['listingObservation']['asOf']='2026-11-02'
  with self.assertRaisesRegex(ValueError,'Older'):qualify(newer,isin(newer),payload(),NOW)
  self.assertEqual(registered(),row)
 def test_seven_exact_identifiers_not_fuzzy_name_or_price_evidence(self):
  for ticker in ['NET','RDDT','NU','GEV','SNOW','VRT','CCJ']:
   with self.subTest(ticker=ticker):
    row=registered(ticker);before=copy.deepcopy(row);r=qualify(row,isin(row),payload(ticker),NOW)
    self.assertEqual(row,before);self.assertEqual(r['asOf'],'2026-10-30');self.assertEqual(r['registeredIsin'],isin(row));self.assertNotIn('last',r)
    self.assertEqual(r['primaryReference'],before['listingObservation'])
 def test_spotify_requires_the_official_sec_bridge_and_current_matching_nyse_identifier(self):
  row=registered('SPOT');receipt=spotify_identifier_bridge()
  self.assertEqual(receipt['filingDate'],'2026-08-25')
  result=qualify(row,isin(row),payload('SPOT'),NOW)
  self.assertEqual(result['identifierReference'],receipt);self.assertEqual(result['cusip'],'L8681T102')
  changed=json.loads(payload('SPOT'));changed['quote']['cusip']='L00000000'
  with self.assertRaisesRegex(ValueError,'identifier differs'):qualify(row,isin(row),json.dumps(changed).encode(),NOW)
  with self.assertRaisesRegex(ValueError,'bridge missing'):qualify(row,'LU0000000000',payload('SPOT'),NOW)
 def test_identity_type_currency_class_issuer_and_date_contradictions_fail(self):
  row=registered();base=json.loads(payload())
  for key,value in [('exchg','NASDAQ'),('dispname','OTHER'),('cusip','000000000'),('desc','OTHER INC'),('desc','Cloudflare Class B Common Stock'),('desc','Cloudflare ADS'),('currency','EUR'),('micCode','XNAS'),('isin','US0000000000'),('instrumentType','ETF'),('time','Tuesday, November 03, 2026 07:00:00 PM ET')]:
   q=copy.deepcopy(base);q['quote'][key]=value
   with self.subTest(key=key,value=value),self.assertRaises(ValueError):qualify(row,isin(row),json.dumps(q).encode(),NOW)
  row['listingObservation']['asOf']='2026-11-01'
  with self.assertRaisesRegex(ValueError,'Older'):qualify(row,isin(row),payload(),NOW)
 def test_empty_directory_uses_bounded_fallback_and_preserves_primary_clock(self):
  old={'listings':[registered()]};calls=[]
  def fetch(url,**kw):calls.append(url);return EMPTY if 'nasdaqtrader' in url else payload()
  new,r=refresh(old,NOW,fetch)
  self.assertEqual(len(calls),2);self.assertEqual(len(r['successes']),1);self.assertEqual(r['directoryOutcomes'][0]['status'],'failed')
  self.assertEqual(new['listings'][0]['listingObservation']['primaryReference'],old['listings'][0]['listingObservation'])
  again,r=refresh(new,NOW+dt.timedelta(hours=1),fetch)
  self.assertEqual(r['successes'][0]['status'],'unchanged-verified')
  self.assertEqual(again['listings'][0]['listingObservation']['primaryReference'],old['listings'][0]['listingObservation'])
  for k in old['listings'][0]:
   if k!='listingObservation':self.assertEqual(new['listings'][0][k],old['listings'][0][k])
 def test_failure_preserves_all_original_fields_and_healthy_directory_mismatch_does_not_fallback(self):
  old={'listings':[registered()]};calls=[]
  def offline(url,**kw):calls.append(url);raise OSError('offline')
  new,r=refresh(old,NOW,offline);self.assertEqual(new,old);self.assertEqual(len(calls),2)
  calls=[]
  healthy=b'ACT Symbol|Security Name|Exchange|ETF\nOTHER|Other Inc Common Stock|N|N\nFile Creation Time: 11022026\n'
  def mismatch(url,**kw):calls.append(url);return healthy
  new,r=refresh(old,NOW,mismatch);self.assertEqual(new,old);self.assertEqual(len(calls),1)
 def test_browser_is_bounded_to_transport_failure_and_revalidates_exact_identity(self):
  old={'listings':[registered()]};calls=[]
  def blocked(url,**kw):
   if 'nasdaqtrader'in url:return EMPTY
   raise urllib.error.HTTPError(url,403,'Forbidden',{},None)
  def browser(tickers):
   calls.append(tickers);return {'records':{'NET':{'url':'https://www.nyse.com/api/nyseservice/v1/quotes?symbol=NET','body':base64.b64encode(payload()).decode(),'retrievedAt':NOW.isoformat()}},'errors':{}}
  new,r=refresh(old,NOW,blocked,browser)
  self.assertEqual(calls,[['NET']]);self.assertEqual(len(r['successes']),1);self.assertIn('403',new['listings'][0]['listingObservation']['transport']['primaryHttpError'])
  for code in [404,429,500]:
   def other(url,**kw):
    if 'nasdaqtrader'in url:return EMPTY
    raise urllib.error.HTTPError(url,code,'failure',{},None)
   calls.clear();unchanged,r=refresh(old,NOW,other,browser);self.assertEqual(unchanged,old);self.assertFalse(calls)
  def malformed(tickers):return {'records':{},'errors':{'NET':'modified/empty response'}}
  unchanged,r=refresh(old,NOW,blocked,malformed);self.assertEqual(unchanged,old);self.assertIn('modified/empty',r['errors'][0]['error'])
  def wrong(tickers):
   q=json.loads(payload());q['quote']['cusip']='000000000';return {'records':{'NET':{'url':'https://www.nyse.com/api/nyseservice/v1/quotes?symbol=NET','body':base64.b64encode(json.dumps(q).encode()).decode(),'retrievedAt':NOW.isoformat()}}}
  unchanged,r=refresh(old,NOW,blocked,wrong);self.assertEqual(unchanged,old);self.assertIn('identifier differs',r['errors'][0]['error'])
 def test_primary_recovery_returns_to_real_directory_observation(self):
  old={'listings':[registered()]}
  new,_=refresh(old,NOW,lambda url,**kw:EMPTY if 'nasdaqtrader'in url else payload())
  recovered=b'ACT Symbol|Security Name|Exchange|ETF\nNET|Cloudflare, Inc. Class A Common Stock|N|N\nFile Creation Time: 11022026\n'
  final,r=refresh(new,NOW,lambda *a,**kw:recovered)
  self.assertFalse(r['errors']);self.assertEqual(r['directoryOutcomes'][0]['status'],'succeeded');self.assertNotIn('primaryReference',final['listings'][0]['listingObservation'])
 def test_live_quote_between_start_and_completed_read_is_valid_but_future_quote_is_not(self):
  started=dt.datetime(2026,11,2,15,0,0,tzinfo=dt.timezone.utc);completed=started+dt.timedelta(seconds=2);old={'listings':[registered()]}
  def source(stamp):
   q=json.loads(payload());q['quote']['time']=stamp
   return lambda url,**kw:EMPTY if 'nasdaqtrader'in url else json.dumps(q).encode()
  new,r=refresh(old,started,source('Monday, November 02, 2026 10:00:01 AM ET'),clock=lambda:completed)
  self.assertEqual(len(r['successes']),1);self.assertEqual(new['listings'][0]['listingObservation']['checkedAt'],completed.isoformat());self.assertEqual(r['successes'][0]['checkedAt'],completed.isoformat());self.assertEqual(new['listings'][0]['listingObservation']['asOf'],'2026-11-02')
  new,r=refresh(old,started,source('Monday, November 02, 2026 10:00:03 AM ET'),clock=lambda:completed)
  self.assertEqual(new,old);self.assertIn('Future',r['errors'][0]['error'])
 def test_completed_clock_before_start_never_renews_proof(self):
  old={'listings':[registered()]}
  new,r=refresh(old,NOW,lambda url,**kw:EMPTY if 'nasdaqtrader'in url else payload(),clock=lambda:NOW-dt.timedelta(seconds=1))
  self.assertEqual(new,old);self.assertIn('clock precedes',r['errors'][0]['error'])
 def test_unchanged_native_results_use_the_same_ids_as_the_frozen_plan(self):
  from refresh_qualified_listings import listing_report
  p=build_plan('refresh_qualified_listings',['--common-identities-only']);expected=[r['id'].removeprefix('listing:')for r in p['items']]
  identities={'successes':[{'id':i,'status':'unchanged-verified','field':'listing-identity','checkedAt':NOW.isoformat(),'sourceUrl':'https://issuer.test/directory'}for i in expected if i!='directory:us-other'],'errors':[], 'directoryOutcomes':[{'id':'directory:us-other','status':'succeeded','field':'primary-directory','checkedAt':NOW.isoformat(),'sourceUrl':'https://issuer.test/directory'}]}
  native=listing_report([],identities,expected,NOW.isoformat(),True)
  self.assertTrue(all(r['id'].startswith('listing:')for r in native['outcomes']))
  self.assertEqual(set(native['validated']),set(expected)-{'directory:us-other'})
  p.update(producer='refresh_qualified_listings',reportStem='listing-observation',declaredAt=NOW.isoformat(),nonce='test',sha256='pending')
  p['sha256']=hashlib.sha256(json.dumps({k:v for k,v in p.items()if k!='sha256'},sort_keys=True).encode()).hexdigest()
  result=finish(native,p)['resultContract'];self.assertEqual(result['issues'],[])
  self.assertEqual(len(result['outcomes']),len(expected));self.assertTrue(all(r['status']in ('succeeded','unchanged-verified')for r in result['outcomes']))
  normalized=normalize_contract(result);self.assertFalse(normalized['errors']);self.assertEqual(len(normalized['successes']),len(expected))
 def test_directory_rollovers_use_completed_source_read_without_relaxing_future_guard(self):
  from test_exchange_listing_refresh import document,body
  for started,completed,stamp in [(dt.datetime(2026,11,2,23,59,59,tzinfo=dt.timezone.utc),dt.datetime(2026,11,3,0,0,1,tzinfo=dt.timezone.utc),'11032026'),(dt.datetime(2026,12,31,23,59,59,tzinfo=dt.timezone.utc),dt.datetime(2027,1,1,0,0,1,tzinfo=dt.timezone.utc),'01012027')]:
   new,r=refresh(document(),started,lambda *a,**k:body(date=stamp),clock=lambda:completed)
   self.assertFalse(r['errors']);self.assertEqual(new['listings'][0]['listingObservation']['asOf'],completed.date().isoformat());self.assertEqual(r['successes'][0]['checkedAt'],completed.isoformat())
  old=document();new,r=refresh(old,started,lambda *a,**k:body(date='01022027'),clock=lambda:completed);self.assertEqual(new,old);self.assertIn('Future',r['errors'][0]['error'])
 def test_actual_ordinary_report_replay_removes_only_namespace_errors(self):
  import gzip,tempfile
  from refresh_qualified_listings import listing_report
  from report_partial_failures import partial_failures
  old=json.loads(gzip.decompress((ROOT/'scripts/fixtures/nyse-identities-20261102/listing-report-41450098899.json.gz').read_bytes()))
  self.assertEqual(len(old['resultContract']['issues']),20)
  common=[r for r in old['outcomes']if r['field']=='listing-identity'];common_ids={r['id']for r in common}
  identities={'successes':common,'errors':[],'directoryOutcomes':[r for r in old['outcomes']if r['field']=='primary-directory']}
  # Reuse the old report's already-validated issuer markers; no source rows or
  # fresh consultation are invented by this report-only replay.
  results=[(i,[True],None)for i in old['validated']if i not in common_ids]
  corrected=listing_report(results,identities,old['scope']['expectedIds'],old['checkedAt'])
  corrected=finish(corrected,old['resultContract']['inputPlan'])
  self.assertEqual(corrected['resultContract']['issues'],[])
  self.assertEqual(corrected['validated'],old['validated']);self.assertEqual(corrected['checkedAt'],old['checkedAt'])
  a=normalize_contract(old['resultContract']);b=normalize_contract(corrected['resultContract'])
  self.assertEqual({r['id']for r in a['successes']},{r['id']for r in b['successes']});self.assertFalse(b['errors'])
  with tempfile.TemporaryDirectory()as folder:
   path=Path(folder)/'listing-observation.json';path.write_text(json.dumps(old));self.assertEqual(len(partial_failures([path])),20)
   path.write_text(json.dumps(corrected));self.assertEqual(partial_failures([path]),[])
 def test_predeclared_scope_primary_failure_and_missing_individual_are_independent(self):
  p=build_plan('refresh_qualified_listings',['--common-identities-only']);ids=[r['id']for r in p['items']]
  common=json.loads((ROOT/'src/data/shared-listing-identities.json').read_text())['listings']
  selected=[r for r in common if r.get('sourceId')in('nasdaq','us-other','nordic-main')]
  self.assertEqual(len(ids),len(selected)+1);self.assertEqual(len(ids),len(set(ids)));self.assertIn('listing:directory:us-other',ids)
  p.update(producer='refresh_qualified_listings',reportStem='listing-observation',declaredAt=NOW.isoformat(),nonce='test',sha256='pending')
  p['sha256']=hashlib.sha256(json.dumps({k:v for k,v in p.items()if k!='sha256'},sort_keys=True).encode()).hexdigest()
  result=finish({'contractResults':{'successes':[{'id':'listing:US18915M1071','status':'succeeded','checkedAt':NOW.isoformat(),'sourceAttempted':True}], 'errors':[{'id':'listing:directory:us-other','status':'failed','error':'empty primary','sourceAttempted':True}]}},p)
  normalized=normalize_contract(result['resultContract'])
  self.assertEqual(len(normalized['successes']),1);self.assertEqual(len(normalized['errors']),len(ids)-1)
  self.assertTrue(any(r.get('kind')=='omission'for r in normalized['errors']))

if __name__=='__main__':unittest.main()
