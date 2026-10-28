"""Archived official inputs; mutations are isolated, never provider validations."""
import copy,datetime as dt,gzip,json,pathlib,unittest,hashlib
from issuer_nav_history import dws_nav
from collect_dws_etf import parse_product
from collect_official_share_history import collect_one,configurations
from dws_income_history import qualify
ROOT=pathlib.Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/dws-income';NOW=dt.datetime(2026,10,28,tzinfo=dt.timezone.utc)
class DwsIncome(unittest.TestCase):
 def setUp(self):
  self.body=json.loads(gzip.decompress((F/'product.json.gz').read_bytes()));self.chart=json.loads(gzip.decompress((F/'chart.json.gz').read_bytes()));self.raw=gzip.decompress((F/'history.xlsx.gz').read_bytes());self.source=copy.deepcopy(next(s for s in configurations()if s['id']=='etfLU1875395870Nav'));self.nav=dws_nav(self.raw,self.source['isin'],'EUR',NOW);self.facts=parse_product(self.body,{'isin':self.source['isin'],'currency':'EUR'},NOW)
 def go(self):return qualify(self.body,self.chart,self.facts,self.source,self.nav,NOW)
 def test_archived_receipt_binds_all_three_actual_inputs(self):
  report=json.loads(gzip.decompress((F/'collection.json.gz').read_bytes()))['series'][0]['record']
  for url,digest in report['rawSourceHashes'].items():
   file='history.xlsx.gz'if'historicaldata/download'in url else'chart.json.gz'if url.endswith('/performancechart')else'product.json.gz'
   self.assertEqual(hashlib.sha256(gzip.decompress((F/file).read_bytes())).hexdigest(),digest)
 def test_exact_share_all_years_cash_and_month_ends(self):
  points,p=self.go();self.assertEqual([r['year']for r in p['officialIncomeReinvestedChartChecks']],list(range(2019,2026)));self.assertEqual(len(p['officialPublishedCashEvents']),12);self.assertEqual(len(p['monthlyShareUnitChecks']),94);self.assertEqual(points[max(points)],self.nav[max(self.nav)]);self.assertTrue(all(not x['cashAddedByApplication']for x in p['officialPublishedCashEvents']));self.assertEqual([x['date']for x in p['dailyQualificationLimit']['unqualifiedDailyUnitDates']],['2026-05-11']);self.assertFalse(p['dailyQualificationLimit']['admittedForArbitraryDailyPurchase'])
 def test_no_double_cash_or_repeated_adjustment(self):
  points,p=self.go();again,_=self.go();self.assertEqual(points,again)
  self.assertAlmostEqual((points['2019-12-30']/points['2018-12-28']-1)*100,19.45891593997766)
  self.assertAlmostEqual((points['2025-12-31']/points['2024-12-31']-1)*100,29.626867939753954)
 def test_changed_cash_amount_is_refused(self):
  t=next(a for a in self.body['pdpResult']['pageSections']['keyFacts']['accordionItems']if a['id']=='fundinformation-dividends')['table']['values'];t[0]['column_1']['value']='0.8'
  with self.assertRaisesRegex(ValueError,'cash factor'):self.go()
 def test_wrong_series_currency_launch_and_unknown_columns_are_refused(self):
  for field,value in [('identifier','NAV (JPY)'),('chartType','Index'),('notVisibleBefore',0)]:
   old=copy.deepcopy(self.chart);self.chart['seriesConfiguration'][0][field]=value
   with self.assertRaises(ValueError):self.go()
   self.chart=old
  self.chart['values'][-1][1][0][1]+=1
  with self.assertRaisesRegex(ValueError,'columns'):self.go()
 def test_month_end_unit_error_is_not_hidden_by_valid_annual_returns(self):
  self.nav['2026-05-29']*=1.001
  with self.assertRaisesRegex(ValueError,'monthly income/share unit disagreement'):self.go()
 def test_annual_error_missing_fund_dates_and_price_channel_fail(self):
  self.facts['performance']['years']['2019']+=1
  with self.assertRaisesRegex(ValueError,'disagreement'):self.go()
  self.setUp();self.chart['values'].append(self.chart['values'][-1])
  with self.assertRaisesRegex(ValueError,'duplicate'):self.go()
  self.setUp();self.source['collectAnniversary']=True
  with self.assertRaisesRegex(ValueError,'performance-only'):self.go()
 def test_failure_keeps_prior_record_and_does_not_renew_source_date(self):
  from refresh_monthly_history import refresh
  r=self.collect();r['checkedAt']='2026-10-27';s=self.source;baseline={s['id']:{'currency':'EUR','points':[{'date':d,'price':v}for d,v in r['points']]}}
  def fail(*a):raise ValueError('Supplier unavailable')
  merged,report=refresh({'series':[s]},{s['id']:r},baseline,NOW,collect=fail);self.assertEqual(merged[s['id']],r);self.assertEqual(report['series'][0]['status'],'failed');self.assertNotIn('evidence',report['series'][0])
 def collect(self):
  return collect_one(self.source,NOW,json_fetch=lambda url:self.chart if url.endswith('/performancechart')else self.body,document_fetch=lambda url:self.raw)
 def test_collector_retains_convention_and_does_not_create_price_points(self):
  r=self.collect();self.assertEqual(len(r['points']),94);self.assertFalse(r['anniversaryAvailable']);self.assertNotIn('anniversaryPoints',r);self.assertEqual(r['nativeValuationCurrency'],'EUR');self.assertEqual(r['financialConvention'],'exact-share issuer income-reinvested series scaled to same-date per-share NAV; no exchange-price claim');self.assertEqual(len(r['rawSourceHashes']),3)
if __name__=='__main__':unittest.main()
