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
if __name__=='__main__':unittest.main()
