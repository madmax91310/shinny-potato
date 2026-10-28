import unittest
from unittest.mock import patch
import datetime as dt
import pathlib
import subprocess
import sys
from qualify_monthly_candidates import qualify
from refresh_monthly_history import yahoo_chart
class Qualification(unittest.TestCase):
 def test_yahoo_qualification_import_does_not_require_unused_html_parser(self):
  code="import sys;sys.path.insert(0,"+repr(str(pathlib.Path(__file__).parent.resolve()))+");import refresh_anniversary_levels;assert 'bs4' not in sys.modules"
  result=subprocess.run([sys.executable,'-S','-c',code],capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stderr)
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

class YahooSessions(unittest.TestCase):
 def chart(self,stamps,closes,adjusted=None):
  meta=dict(symbol='BHP.AX',currency='AUD',dataGranularity='1d',instrumentType='EQUITY',exchangeTimezoneName='Australia/Sydney')
  return {'chart':{'result':[{'meta':meta,'timestamp':stamps,'indicators':{'quote':[{'close':closes}],'adjclose':[{'adjclose':adjusted or closes}]}}]}}
 def test_identical_repeated_asx_session_is_kept_once(self):
  # Yahoo lists the latest ASX session twice: the regular bar at 10:00 local and a closing-time bar.
  config=dict(symbol='BHP.AX',currency='AUD',field='adjclose',consumerScope='equity')
  open_bar=int(dt.datetime(2026,10,15,23,0,tzinfo=dt.timezone.utc).timestamp())   # 16/10 10:00 Sydney
  close_bar=int(dt.datetime(2026,10,16,5,10,tzinfo=dt.timezone.utc).timestamp())  # 16/10 16:10 Sydney
  previous=int(dt.datetime(2026,10,14,23,0,tzinfo=dt.timezone.utc).timestamp())
  rows,zone=yahoo_chart(self.chart([previous,open_bar,close_bar],[59.5,60.03,60.03]),config,'1d')
  self.assertEqual(zone,'Australia/Sydney')
  self.assertEqual([(r[0].isoformat(),r[1]) for r in rows],[('2026-10-15',59.5),('2026-10-16',60.03)])
  with self.assertRaisesRegex(ValueError,'different prices'):
   yahoo_chart(self.chart([previous,open_bar,close_bar],[59.5,60.03,60.10]),config,'1d')
  with self.assertRaisesRegex(ValueError,'different prices'):
   yahoo_chart(self.chart([previous,open_bar,close_bar],[59.5,60.03,60.03],[59.5,60.03,59.99]),config,'1d')

class ReviewedExtensions(unittest.TestCase):
 def test_reviewed_operating_boundary_and_frozen_start(self):
  source=dict(symbol='TEST',currency='USD',isin='US0378331005',id='test',instrumentType='EQUITY',consumerScope='equity',listingEvidence={'isin':'US0378331005'},historyFloor='2021-09')
  meta=dict(symbol='TEST',currency='USD',instrumentType='EQUITY',firstTradeDate=946684800)
  seen=[]
  def collect(c,n):
   seen.append(c['periodStart'])
   return {'points':[['2021-09',10],['2021-10',10],['2021-11',10],['2021-12',12],['2022-01',13]],'anniversaryPoints':[['2021-11',10],['2021-12',12],['2022-01',13]],'proofRows':[{'date':'2021-11-30'},{'date':'2021-12-31'},{'date':'2022-01-31'}]}
  with patch('refresh_anniversary_levels.collect_one',return_value={'isin':source['isin']}):
   c,r=qualify(source,dt.datetime(2026,10,22),lambda u:{'chart':{'result':[{'meta':meta}]}},collect)
  self.assertEqual(seen,['2021-09'])
  self.assertEqual(c['periodStart'],'2021-12')
  self.assertEqual(r['points'],[['2021-12',12],['2022-01',13]])
  self.assertEqual(r['proofRows'][0]['date'],'2021-12-31')
  self.assertEqual(r['anniversaryPoints'][0][0],'2021-12')
 def test_extension_preserves_share_currency_convention_and_all_old_months(self):
  import tempfile,json
  from pathlib import Path
  import qualify_monthly_candidates as module
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder)
   paths={'src/data/automated-monthly.json':{},'scripts/monthly-automation.json':{'series':[{'id':'fund'}]},'src/data/automated-etf-monthly.json':{'fund':dict(id='fund',isin='IE000TEST001',currency='EUR',consumerScope='catalog',field='adjclose',points=[['2025-01',10],['2025-02',11]])},'scripts/source-snapshots/monthly-automated.json':{},'src/data/auto-history-identities.json':{'fund':{'icon':'X','scene':'chip','title':'Reviewed illustration'}},'src/data/anniversary-levels.json':{}}
   def reset():
    for name,value in paths.items():
     p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value))
   source=dict(id='fund',isin='IE000TEST001',currency='EUR',consumerScope='catalog',field='adjclose',periodStart='2024-12',ticker='FUND')
   result={**source,'points':[['2024-12',9],['2025-01',10],['2025-02',11]],'proofRows':[{'date':'2025-02-28'}],'responseSha256':'a'*64,'qualifiedAnniversary':{'isin':source['isin']}}
   with patch.object(module,'ROOT',root):
    for changed in [{'currency':'USD'},{'isin':'IE000OTHER01'},{'field':'close'}]:
     reset()
     with self.assertRaisesRegex(ValueError,'changed exact share'):module.apply_qualified([({**source,**changed},{**result,**changed})],extend=True)
    reset();module.apply_qualified([(source,{**result,'points':[['2025-02',12]]})],extend=True)
    self.assertEqual(json.loads((root/'src/data/automated-etf-monthly.json').read_text())['fund']['points'],paths['src/data/automated-etf-monthly.json']['fund']['points'])
    reset();module.apply_qualified([(source,result)],extend=True)
    self.assertEqual(json.loads((root/'src/data/automated-etf-monthly.json').read_text())['fund']['points'][0][0],'2024-12')
    identity=json.loads((root/'src/data/auto-history-identities.json').read_text())['fund']
    self.assertEqual(identity['scene'],'chip')
    self.assertEqual(identity['title'],'Reviewed illustration')
