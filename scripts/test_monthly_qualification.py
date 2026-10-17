import unittest
from unittest.mock import patch
import datetime as dt
from qualify_monthly_candidates import qualify
class Qualification(unittest.TestCase):
 def test_identity_and_first_partial_month(self):
  source=dict(symbol='TEST.L',currency='USD',isin='IE000TEST000',id='test')
  meta=dict(symbol='TEST.L',currency='USD',instrumentType='ETF',firstTradeDate=int(dt.datetime(2024,3,15,tzinfo=dt.timezone.utc).timestamp()))
  fetch=lambda u:{'chart':{'result':[{'meta':meta}]}}
  seen=[]
  def collect(c,n):seen.append(c);return {'qualified':True}
  with patch('refresh_anniversary_levels.collect_one',return_value={'isin':source['isin']}):
   c,r=qualify(source,dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),fetch,collect)
  self.assertEqual(c['periodStart'],'2024-04');self.assertEqual(source.get('periodStart'),None)
  meta['currency']='GBP'
  with self.assertRaises(ValueError):qualify(source,dt.datetime(2026,10,16),fetch,collect)
  self.assertEqual(len(seen),1)
 def test_registered_etc_preserves_yahoo_type(self):
  source=dict(symbol='ETC.L',currency='USD',isin='IE000TEST000',id='test',instrumentType='ETC',listingEvidenceId='exact-proof')
  meta=dict(symbol='ETC.L',currency='USD',instrumentType='EQUITY',firstTradeDate=1609459200)
  fetch=lambda u:{'chart':{'result':[{'meta':meta}]}}
  with patch('refresh_anniversary_levels.collect_one',return_value={'isin':source['isin']}):
   config,result=qualify(source,dt.datetime(2026,10,17),fetch,lambda c,n:{'ok':True})
  self.assertEqual(config['instrumentType'],'ETC')
  self.assertEqual(config['yahooInstrumentType'],'EQUITY')
  for patch_source in [dict(source,instrumentType='ETF'),{k:v for k,v in source.items() if k!='listingEvidenceId'}]:
   with self.assertRaises(ValueError):qualify(patch_source,dt.datetime(2026,10,17),fetch,lambda c,n:{})
 def test_missing_start_is_explicit_and_contiguous_suffix_is_registered(self):
  source=dict(symbol='ETF.L',currency='EUR',isin='IE000TEST000',id='test')
  meta=dict(symbol='ETF.L',currency='EUR',instrumentType='ETF',firstTradeDate=None)
  fetch=lambda u:{'chart':{'result':[{'meta':meta}]}}
  with self.assertRaisesRegex(ValueError,'inception'):qualify(source,dt.datetime(2026,10,17),fetch,lambda c,n:{})
  meta['firstTradeDate']=1609459200
  def collect(c,n):
   self.assertTrue(c['qualifyContiguousSuffix'])
   return dict(periodStart='2026-01',qualifyContiguousSuffix=True,qualificationCoverage={'requestedStart':'2021-02','retainedStart':'2026-01'})
  with patch('refresh_anniversary_levels.collect_one',return_value={'isin':source['isin']}):
   c,result=qualify(source,dt.datetime(2026,10,17),fetch,collect)
  self.assertEqual(c['periodStart'],'2026-01')
  self.assertNotIn('qualifyContiguousSuffix',c)
  self.assertNotIn('qualifyContiguousSuffix',result)
 def test_equity_requires_exact_listing_evidence(self):
  source=dict(symbol='TEST',currency='USD',isin='US0378331005',id='test',instrumentType='EQUITY',consumerScope='equity',listingEvidence={'isin':'US0378331005'})
  meta=dict(symbol='TEST',currency='USD',instrumentType='EQUITY',firstTradeDate=1609459200)
  with patch('refresh_anniversary_levels.collect_one',return_value={'isin':source['isin']}):
   config,_=qualify(source,dt.datetime(2026,10,17),lambda u:{'chart':{'result':[{'meta':meta}]}},lambda c,n:{'ok':True})
  self.assertNotIn('verifyMonthlyDisagreements',config)
  source.pop('listingEvidence')
  with self.assertRaises(ValueError):qualify(source,dt.datetime(2026,10,17),lambda u:{'chart':{'result':[{'meta':meta}]}},lambda c,n:{})
 def test_london_pence_unit_is_verified_without_changing_identity(self):
  source=dict(symbol='AZN.L',currency='GBP',isin='GB0009895292',id='test',instrumentType='EQUITY',consumerScope='equity',listingEvidence={'isin':'GB0009895292','exchange':'London Stock Exchange'})
  meta=dict(symbol='AZN.L',currency='GBp',instrumentType='EQUITY',firstTradeDate=1609459200)
  with patch('refresh_anniversary_levels.collect_one',return_value={'isin':source['isin']}):
   config,_=qualify(source,dt.datetime(2026,10,17),lambda u:{'chart':{'result':[{'meta':meta}]}},lambda c,n:{'ok':True})
  self.assertEqual(config['currency'],'GBp');self.assertEqual(source['currency'],'GBP')
  self.assertEqual(config['quoteUnitEvidence']['unitsPerCurrency'],100)
 def test_failed_collection_does_not_publish(self):
  source=dict(symbol='X',currency='EUR')
  def fail(c,n):raise ValueError('cross-check mismatch')
  fetch=lambda u:{'chart':{'result':[{'meta':dict(symbol='X',currency='EUR',instrumentType='ETF',firstTradeDate=1609459200)}]}}
  with self.assertRaisesRegex(ValueError,'cross-check'):qualify(source,dt.datetime(2026,10,16),fetch,fail)
if __name__=='__main__':unittest.main()
