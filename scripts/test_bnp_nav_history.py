import copy,datetime as dt,gzip,json,pathlib,unittest
from bnp_nav_history import parse,endpoints
from issuer_nav_history import calendar_checks,monthly
from collect_official_share_history import collect_one
from refresh_monthly_history import refresh,monitoring_report
F=pathlib.Path(__file__).with_name('fixtures')/'bnp-nav'
NOW=dt.datetime(2026,10,28,tzinfo=dt.timezone.utc)

class BnpNav(unittest.TestCase):
 def setUp(self):
  self.source=next(s for s in json.loads(pathlib.Path(__file__).with_name('official-nav-remainder-sources.json').read_text())if s['id']=='etfFR0011550185Nav')
  self.facts=json.loads(gzip.decompress((F/'fundsheet.json.gz').read_bytes()));self.daily=json.loads(gzip.decompress((F/'daily-nav.json.gz').read_bytes()));self.monthly=json.loads(gzip.decompress((F/'monthly.json.gz').read_bytes()))
 def go(self):return parse(self.facts,self.daily,self.monthly,self.source,NOW)
 def record(self):
  identity,nav,monthly=endpoints(self.source)
  return collect_one(self.source,NOW,json_fetch=lambda u:copy.deepcopy(self.facts if u==identity else self.monthly if u==monthly else self.daily))
 def test_exact_2021_native_eur_and_six_calendar_checks(self):
  nav,years,digits,p=self.go();checks=calendar_checks(nav,years,digits,NOW,self.source['identityFrom'])
  self.assertEqual([c['year']for c in checks],list(range(2020,2026)))
  y=next(c for c in checks if c['year']==2021);self.assertEqual((y['start'],y['end']),('2020-12-31','2021-12-31'));self.assertAlmostEqual(y['dailyDerived'],38.202989205834335)
  self.assertEqual(min(nav),'2019-12-02');self.assertTrue(p['excludedBeforeSuppliedStart']['count']);self.assertFalse(p['cashAddedByApplication']);self.assertEqual(p['identityFrom'],'2013-09-16')
  points,_=monthly(nav,'EUR','EUR','2019-12',NOW);self.assertEqual(len(points),82);self.assertEqual(points[-1][0],'2026-09')
 def test_unordered_source_is_sorted_without_deduplication(self):
  a=self.go()[0];self.daily['FR0011550185'].reverse();self.assertEqual(self.go()[0],a)
 def test_older_unused_history_is_not_an_admission_requirement(self):
  before=self.go()[0];self.daily['FR0011550185']=[r for r in self.daily['FR0011550185']if r['date']>='2019-12-01'];self.assertEqual(self.go()[0],before)
 def test_duplicate_dates_and_indicative_prices_rejected(self):
  original=copy.deepcopy(self.daily)
  self.daily['FR0011550185'].append(self.daily['FR0011550185'][0])
  with self.assertRaises(ValueError):self.go()
  self.daily=original;self.daily['FR0011550185'][0]['type']='INAV'
  with self.assertRaisesRegex(ValueError,'exact NAV'):self.go()
 def test_exact_part_currency_accumulation_and_launch_required(self):
  changes=[('fundshare_id',14259),('nav.dividend_policy','C/D'),('portfolio.launch_date','2008-06-10'),('fundshare_selection.currency','USD'),('portfolio.isin_code','FR0011550177')]
  for path,value in changes:
   original=copy.deepcopy(self.facts);target=self.facts;parts=path.split('.')
   for k in parts[:-1]:target=target[k]
   target[parts[-1]]=value
   with self.assertRaises(ValueError,msg=path):self.go()
   self.facts=original
 def test_changed_native_anchor_refuses_stale_or_different_payload(self):
  self.facts['nav']['two_latest_nav']['EUR'][0]['nav']+=.0001
  with self.assertRaisesRegex(ValueError,'anchor'):self.go()
 def test_calendar_bound_is_not_assumed_to_be_month_end(self):
  row=next(r for r in self.facts['performances']['perfs']['calendar']['shares']if r['currency']=='EUR'and r['begin']=='2020-12-31');row['begin']='2020-12-30'
  with self.assertRaisesRegex(ValueError,'calendar bound'):self.go()
 def test_benchmark_never_substitutes_for_missing_share_calendar(self):
  self.facts['performances']['perfs']['calendar']['shares']=[]
  with self.assertRaisesRegex(ValueError,'qualification'):self.go()
 def test_future_invalid_duplicate_identity_or_empty_payload_refused(self):
  original=copy.deepcopy(self.daily)
  for payload in [{}, {'FR0011550177':[]},{'FR0011550185':[]},{'FR0011550185':[{'date':'2026-10-29','value':1,'type':'PRICE_NAV'}]}, {'FR0011550185':[{'date':'2026-09-30','value':float('nan'),'type':'PRICE_NAV'}]}]:
   self.daily=payload
   with self.assertRaises(ValueError):self.go()
  self.daily=original
 def test_month_gap_is_never_filled(self):
  self.daily['FR0011550185']=[r for r in self.daily['FR0011550185']if not r['date'].startswith('2024-06')]
  with self.assertRaisesRegex(ValueError,'daily/monthly'):self.go()
 def test_missing_last_session_is_not_replaced_by_previous_day(self):
  self.daily['FR0011550185']=[r for r in self.daily['FR0011550185']if r['date']!='2021-06-30']
  with self.assertRaisesRegex(ValueError,'daily/monthly'):self.go()
 def test_monthly_price_or_duplicate_is_not_accepted(self):
  original=copy.deepcopy(self.monthly);self.monthly['FR0011550185'][80]['value']+=.0001
  with self.assertRaisesRegex(ValueError,'daily/monthly'):self.go()
  self.monthly=original;self.monthly['FR0011550185'].append(self.monthly['FR0011550185'][80])
  with self.assertRaisesRegex(ValueError,'Duplicate'):self.go()
 def test_collector_control_scope_unchanged_success_and_network_failure(self):
  r=self.record();self.assertFalse(r['anniversaryAvailable']);self.assertEqual(r['calendarProof']['controlledCalendarYears'],[str(y)for y in range(2020,2026)])
  active={k:v for k,v in r.items()if k!='proofRows'};config={'series':[self.source]};baseline={r['id']:{'currency':'EUR','points':[{'date':m,'price':v}for m,v in r['points']]}}
  merged,report=refresh(config,{r['id']:active},baseline,NOW,collect=lambda *_:copy.deepcopy(r));self.assertEqual(merged[r['id']],active);self.assertEqual(report['series'][0]['sourceState'],'unchanged-verified')
  thin=monitoring_report(report)['series'][0];self.assertEqual(thin['controlScope']['controlledInstrument'],'FR0011550185');self.assertEqual(thin['controlScope']['requestedStart'],'2019-12-01')
  def fail(*_):raise OSError('isolated network failure')
  unchanged,bad=refresh(config,{r['id']:active},baseline,NOW+dt.timedelta(days=1),collect=fail);self.assertEqual(unchanged[r['id']],active);self.assertEqual(bad['series'][0]['status'],'failed')

if __name__=='__main__':unittest.main()
