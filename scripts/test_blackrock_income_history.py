"""Issuer-capture regressions; local replay is not a fresh supplier consultation."""
import copy,datetime as dt,gzip,json,pathlib,unittest
from issuer_nav_history import blackrock_nav,calendar_checks
from blackrock_income_history import qualify
ROOT=pathlib.Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,10,25,tzinfo=dt.timezone.utc)
class IncomeNav(unittest.TestCase):
 def body(self,isin):
  path=next((ROOT/'reports/reliquat-2026-10-23/preuves').glob(isin+'*blackrock*.gz'))
  return json.loads(gzip.decompress(path.read_bytes()))
 def source(self,isin):
  return next(r for r in json.loads((ROOT/'scripts/official-nav-remainder-sources.json').read_text())if r['isin']==isin)
 def test_all_five_shares_preserve_issuer_returns_and_real_nav_units(self):
  for isin in ['IE00B1XNHC34','IE00B2QWCY14','IE00B4556L06','IE00BJ5JP097','IE00BJ5JP436']:
   b=self.body(isin);s=self.source(isin);r=blackrock_nav(b,isin,s['navCurrency'],NOW);nav,proof=qualify(b,r,s,NOW)
   self.assertEqual(nav[max(nav)],r['nav'][max(nav)])
   checks=calendar_checks(nav,r['years'],2,NOW)
   self.assertEqual(len(checks),len(proof['officialIncomeReinvestedChartChecks']))
   for cash in proof['officialDistributionFactorChecks']:
    before,day=cash['previousSession'],cash['returnObservationDate']
    self.assertAlmostEqual(nav[day]/nav[before],r['totalReturn'][day]/r['totalReturn'][before],places=12)
    self.assertFalse(cash['cashAddedByApplication'])
 def test_distributing_share_requires_the_explicit_series_convention(self):
  s=self.source('IE00B1XNHC34');b=self.body(s['isin']);r=blackrock_nav(b,s['isin'],'USD',NOW)
  with self.assertRaisesRegex(ValueError,'Explicit'):qualify(b,r,{**s,'navHistoryKind':None},NOW)
 def test_wrong_historical_cash_amount_or_currency_is_not_patched(self):
  s=self.source('IE00B1XNHC34')
  for field in ['value','prefix']:
   b=self.body(s['isin']);table=b['componentsByNameMap']['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
   i=next(i for i,date in enumerate(table['exDate']['value'])if str(date).startswith('2020'))
   table['totalDistribution'][field][i]=table['totalDistribution'][field][i]*2 if field=='value'else'EUR'
   r=blackrock_nav(b,s['isin'],'USD',NOW)
   with self.assertRaises(ValueError):qualify(b,r,s,NOW)
 def test_unknown_income_and_empty_requested_cash_year_fail(self):
  s=self.source('IE00B1XNHC34');b=self.body(s['isin']);r=blackrock_nav(b,s['isin'],'USD',NOW)
  with self.assertRaises(ValueError):qualify(b,{**r,'distribution':'unknown'},s,NOW)
  with self.assertRaisesRegex(ValueError,'year not covered'):qualify(b,r,{**s,'distributionValidationYears':[1999]},NOW)
 def test_annual_disagreement_is_not_hidden_by_a_matching_cash_event(self):
  s=self.source('IE00B1XNHC34');b=self.body(s['isin']);r=blackrock_nav(b,s['isin'],'USD',NOW);r['years']['2020']+=1
  with self.assertRaisesRegex(ValueError,'disagreement'):qualify(b,r,s,NOW)
 def test_retained_europe_retail_2019_anomalies_stay_blocked(self):
  isin='DE000A0H08P6';b=self.body(isin);r=blackrock_nav(b,isin,'EUR',NOW)
  s={'isin':isin,'navCurrency':'EUR','periodStart':'2015-01','navHistoryKind':'official-income-reinvested-index','distributionValidationYears':[2019]}
  with self.assertRaisesRegex(ValueError,'cash adjustment not reconciled'):qualify(b,r,s,NOW)
 def test_missing_daily_return_is_checked_across_a_bounded_cash_interval_never_filled(self):
  s=self.source('IE00B2QWCY14');b=self.body(s['isin']);r=blackrock_nav(b,s['isin'],'USD',NOW);nav,proof=qualify(b,r,s,NOW)
  self.assertNotIn('2024-01-11',nav)
  c=next(c for c in proof['officialDistributionFactorChecks']if c['exDate']=='2024-01-11')
  self.assertEqual(c['returnObservationDate'],'2024-01-12');self.assertTrue(c['missingReturnOnExDate'])
  self.assertLess(abs(c['difference']),1e-8)
 def test_month_end_missing_non_flat_nav_is_not_extended(self):
  s=self.source('IE00B1XNHC34');b=self.body(s['isin']);r=blackrock_nav(b,s['isin'],'USD',NOW)
  r['nav']['2018-06-30']+=.01
  with self.assertRaisesRegex(ValueError,'Monthly NAV/return end'):qualify(b,r,s,NOW)
 def test_no_income_monthly_contradiction_is_targeted_not_rewritten(self):
  s=self.source('IE00B4556L06');b=self.body(s['isin']);r=blackrock_nav(b,s['isin'],'USD',NOW);before=copy.deepcopy(r)
  nav,proof=qualify(b,r,s,NOW)
  self.assertEqual(proof['historyExcludedMonths'],['2014-12']);self.assertFalse(proof['anniversaryExcludedMonths'])
  self.assertEqual(r,before);self.assertIn('2014-12-31',nav)
  failed=[x for x in proof['monthlyShareUnitChecks']if not x['qualified']]
  self.assertEqual([x['month']for x in failed],['2014-12'])
 def test_newer_index_without_same_date_nav_anchor_fails(self):
  s=self.source('IE00B4556L06');b=self.body(s['isin']);r=blackrock_nav(b,s['isin'],'USD',NOW);r['totalReturn']['2026-10-23']=r['totalReturn'][max(r['totalReturn'])]
  with self.assertRaisesRegex(ValueError,'newer'):qualify(b,r,s,NOW)
class SeparateIncomeScopes(unittest.TestCase):
 """Actual 2-Nov responses: incomplete October never erases qualified months."""
 NOW=dt.datetime(2026,11,2,6,tzinfo=dt.timezone.utc)
 FIXTURES=ROOT/'scripts/fixtures/income-recovery-20261102'
 @classmethod
 def setUpClass(cls):
  cls.sources=json.loads((ROOT/'scripts/new-distributing-nav-sources.json').read_text())
  cls.receipts=json.loads((cls.FIXTURES/'receipts.json').read_text())
  from collect_official_share_history import collect_one
  cls.records={s['id']:collect_one(s,cls.NOW,json_fetch=lambda url,s=s:cls.body(s['isin']))for s in cls.sources}
 @classmethod
 def body(cls,isin):return json.loads(gzip.decompress((cls.FIXTURES/(isin+'.json.gz')).read_bytes()))
 def test_all_captured_refusals_remain_refused_under_the_original_strict_contract(self):
  import hashlib
  for receipt in self.receipts:
   raw=gzip.decompress((self.FIXTURES/(receipt['isin']+'.json.gz')).read_bytes())
   self.assertEqual(hashlib.sha256(raw).hexdigest(),receipt['sha256'])
   source={**receipt['source']};source.pop('incomeMonthEndPolicy',None)
   parsed=blackrock_nav(json.loads(raw),source['isin'],source['navCurrency'],self.NOW)
   with self.assertRaisesRegex(ValueError,'Monthly NAV/return end.*2026-10'):qualify(json.loads(raw),parsed,source,self.NOW)
 def test_complete_months_cash_and_raw_price_have_separate_proofs(self):
  for source in self.sources:
   record=self.records[source['id']];proof=record['calendarProof']
   self.assertEqual(record['periodEnd'],'2026-09');self.assertEqual(record['points'][-1][0],'2026-09')
   self.assertEqual(record['anniversaryPoints'][-1][0],'2026-09')
   self.assertEqual(record['historyExcludedMonths'],['2026-10'])
   self.assertIn('2026-10',record['anniversaryExcludedMonths'])
   self.assertEqual(record['latestLevel']['asOf'],'2026-10-30')
   self.assertEqual(record['latestLevel']['valuationBasis'],'fund-nav-price')
   self.assertEqual(record['latestLevel']['currency'],source['navCurrency'])
   self.assertEqual(record['latestLevel']['fxFactor'],1)
   self.assertEqual(proof['scaleProof']['anchorDate'],'2026-10-29')
   self.assertGreater(len(proof['officialDistributionFactorChecks']),0)
   self.assertTrue(all(not c['cashAddedByApplication']for c in proof['officialDistributionFactorChecks']))
   parsed=blackrock_nav(self.body(source['isin']),source['isin'],source['navCurrency'],self.NOW)
   self.assertEqual(record['latestLevel']['value'],parsed['nav']['2026-10-30'])
   for row in record['proofRows']:
    self.assertLessEqual(row['date'],'2026-09-30')
    self.assertAlmostEqual(row['anniversaryValue'],parsed['nav'][row['anniversaryDate']],places=10)
   self.assertGreater(len(proof['checks']),0)
 def test_old_conflict_unknown_policy_or_missing_month_is_not_a_trailing_publication_lag(self):
  from collect_official_share_history import collect_one
  source=self.sources[0];body=self.body(source['isin']);parsed=blackrock_nav(body,source['isin'],source['navCurrency'],self.NOW)
  with self.assertRaisesRegex(ValueError,'Unknown'):qualify(body,parsed,{**source,'incomeMonthEndPolicy':'ignore'},self.NOW)
  p=copy.deepcopy(parsed);p['totalReturn'].pop(max(d for d in p['totalReturn']if d.startswith('2020-08')));p['nav'][max(d for d in p['nav']if d.startswith('2020-08'))]+=1
  with self.assertRaisesRegex(ValueError,'Monthly NAV/return end'):qualify(body,p,source,self.NOW)
  b=copy.deepcopy(body);chart=b['componentsByNameMap']['performance']['containersByNameMap']['chart']['dataPointsByNameMap']
  for key in ['navData','performanceData']:
   pairs=[(d,v)for d,v in zip(chart[key]['asOfDate'],chart[key]['value'])if not str(d).startswith('202608')]
   chart[key]['asOfDate']=[d for d,v in pairs];chart[key]['value']=[v for d,v in pairs]
  with self.assertRaisesRegex(ValueError,'coverage'):collect_one(source,self.NOW,json_fetch=lambda url:b)
 def test_cash_currency_identity_and_annual_disagreements_still_fail(self):
  source=self.sources[0]
  for kind in ['cash','currency','identity','annual']:
   b=self.body(source['isin']);facts=b['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
   if kind=='identity':facts['isin']['value']=self.sources[1]['isin']
   table=b['componentsByNameMap']['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
   i=next(i for i,d in enumerate(table['exDate']['value'])if str(d).startswith('2024'))
   if kind=='cash':table['totalDistribution']['value'][i]=str(float(table['totalDistribution']['value'][i])*2)
   if kind=='currency':table['totalDistribution']['prefix'][i]='EUR'
   with self.assertRaises(ValueError):
    p=blackrock_nav(b,source['isin'],source['navCurrency'],self.NOW)
    if kind=='annual':p['years']['2024']+=1
    qualify(b,p,source,self.NOW)
 def test_failure_or_partial_response_preserves_the_last_valid_record_and_its_date(self):
  from collect_official_share_history import collect_one
  from refresh_monthly_history import refresh
  source=self.sources[0];old={source['id']:self.records[source['id']]};original=copy.deepcopy(old)
  for failure in ['outage','partial']:
   def collect(s,now):
    if failure=='outage':raise OSError('Supplier unavailable')
    return collect_one(s,now,json_fetch=lambda url:{'componentsByNameMap':{}})
   updated,report=refresh({'series':[source]},old,{},self.NOW,collect=collect)
   self.assertEqual(updated,original);self.assertEqual(old,original)
   self.assertEqual(report['series'][0]['status'],'failed')
 def test_a_conflicting_recent_distribution_cannot_certify_older_monthly_returns(self):
  source=self.sources[0];body=self.body(source['isin'])
  table=body['componentsByNameMap']['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
  i=next(i for i,d in enumerate(table['exDate']['value'])if '20260101'<=str(d)<='20261029')
  table['totalDistribution']['value'][i]=str(float(table['totalDistribution']['value'][i])*2)
  parsed=blackrock_nav(body,source['isin'],source['navCurrency'],self.NOW)
  with self.assertRaisesRegex(ValueError,'cash/share monthly units'):qualify(body,parsed,source,self.NOW)
 def test_bounded_monthly_extraction_never_fills_the_missing_return(self):
  from issuer_nav_history import monthly
  source=self.sources[0];p=blackrock_nav(self.body(source['isin']),source['isin'],source['navCurrency'],self.NOW)
  for end in ['2026-13','2027-01',source['periodStart']]:
   with self.assertRaisesRegex(ValueError,'qualified monthly end'):monthly(p['nav'],'USD','USD',source['periodStart'],self.NOW,end_exclusive=end)
  points,_=monthly(p['nav'],'USD','USD',source['periodStart'],self.NOW,end_exclusive='2026-10')
  self.assertEqual(points[-1][0],'2026-09')
 def test_a_later_published_return_restores_october_without_changing_old_months(self):
  # Deliberate test mutation, never a replacement production observation.
  from collect_official_share_history import collect_one
  source=self.sources[0];body=self.body(source['isin']);parsed=blackrock_nav(body,source['isin'],source['navCurrency'],self.NOW)
  table=body['componentsByNameMap']['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
  self.assertNotIn(20261030,table['exDate']['value'])
  series=body['componentsByNameMap']['performance']['containersByNameMap']['chart']['dataPointsByNameMap']['performanceData']
  series['asOfDate'].append(20261030);series['value'].append(parsed['totalReturn']['2026-10-29']*parsed['nav']['2026-10-30']/parsed['nav']['2026-10-29'])
  record=collect_one(source,self.NOW,json_fetch=lambda url:body)
  self.assertEqual(record['periodEnd'],'2026-10');self.assertFalse(record['historyExcludedMonths']);self.assertFalse(record['anniversaryExcludedMonths'])
  old=self.records[source['id']]
  for (_,before),(_,after)in zip(old['points'],record['points']):self.assertAlmostEqual(before,after,places=7)
 def test_actual_seventeen_producer_results_replay_with_their_original_fx_and_raw_responses(self):
  from collect_official_share_history import collect_one
  directory=self.FIXTURES/'ordinary'
  report=json.loads(gzip.decompress((directory/'collection.json.gz').read_bytes()))
  sources={s['id']:s for s in json.loads((directory/'configurations.json').read_text())}
  fx=json.loads(gzip.decompress((directory/'monthly-fx.json.gz').read_bytes()))
  now=dt.datetime.fromisoformat(report['checkedAt'])
  for row in report['series']:
   expected=row['record'];hashes=expected['rawSourceHashes']
   def raw(url,kind):
    import hashlib
    value=gzip.decompress((directory/(hashes[url]+'.'+kind+'.gz')).read_bytes())
    self.assertEqual(hashlib.sha256(value).hexdigest(),hashes[url]);return value
   replay=collect_one(sources[row['id']],now,json_fetch=lambda url:json.loads(raw(url,'json')),
                      text_fetch=lambda url,*args:raw(url,'xml').decode(),fx_data=fx)
   self.assertEqual(replay,expected,row['id'])
if __name__=='__main__':unittest.main()
