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
NOW=dt.datetime(2026,11,2,12,tzinfo=dt.timezone.utc)
EMPTY=b'ACT Symbol|Security Name|Exchange|ETF\nFile Creation Time: 11022026\n'

def registered(ticker='NET'):
 return copy.deepcopy(next(r for r in json.loads((ROOT/'scripts/fixtures/nyse-identities-20261102/registered-reference-20261102T045231.json').read_text())['listings']if r.get('ticker')==ticker and r.get('sourceId')=='us-other'))
def isin(row):
 return next(r['isin']for r in json.loads((ROOT/'src/data/global-equities.json').read_text())if r.get('aiListingId')==row['id'])
def payload(ticker='NET'):
 return json.dumps({'quote':next(r['identity']for r in ROWS if r['ticker']==ticker)}).encode()

class NyseIdentity(unittest.TestCase):
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
   calls.append(tickers);return {'records':{'NET':{'url':'https://www.nyse.com/api/nyseservice/v1/quotes?symbol=NET','body':base64.b64encode(payload()).decode()}},'errors':{}}
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
   q=json.loads(payload());q['quote']['cusip']='000000000';return {'records':{'NET':{'url':'https://www.nyse.com/api/nyseservice/v1/quotes?symbol=NET','body':base64.b64encode(json.dumps(q).encode()).decode()}}}
  unchanged,r=refresh(old,NOW,blocked,wrong);self.assertEqual(unchanged,old);self.assertIn('identifier differs',r['errors'][0]['error'])
 def test_primary_recovery_returns_to_real_directory_observation(self):
  old={'listings':[registered()]}
  new,_=refresh(old,NOW,lambda url,**kw:EMPTY if 'nasdaqtrader'in url else payload())
  recovered=b'ACT Symbol|Security Name|Exchange|ETF\nNET|Cloudflare, Inc. Class A Common Stock|N|N\nFile Creation Time: 11022026\n'
  final,r=refresh(new,NOW,lambda *a,**kw:recovered)
  self.assertFalse(r['errors']);self.assertEqual(r['directoryOutcomes'][0]['status'],'succeeded');self.assertNotIn('primaryReference',final['listings'][0]['listingObservation'])
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
