"""Official captured CSV and live-page contracts; no invented pre-launch levels."""
import copy,datetime as dt,gzip,json,pathlib,unittest
from landg_nav_history import identity,parse
from issuer_nav_history import calendar_checks
F=pathlib.Path(__file__).with_name('fixtures')/'landg-history';NOW=dt.datetime(2026,10,28,tzinfo=dt.timezone.utc)
class LandgNav(unittest.TestCase):
 def setUp(self):
  self.source=next(s for s in json.loads(pathlib.Path(__file__).with_name('official-nav-remainder-sources.json').read_text())if s['id']=='etfIE00BK5BCD43Nav');self.catalogue=json.loads(gzip.decompress((F/'catalogue.json.gz').read_bytes()));self.page=gzip.decompress((F/'ai-page.html.gz').read_bytes());self.csv=gzip.decompress((F/'ai.csv.gz').read_bytes())
 def go(self):
  url,facts,proof=identity(self.page,self.catalogue,self.source,NOW);nav,proof=parse(self.csv,self.source,self.catalogue,proof,NOW);return nav,proof,calendar_checks(nav,facts['performance']['years'],2,NOW,self.source['identityFrom'])
 def test_all_official_calendars_and_no_prelaunch_extension(self):
  nav,p,c=self.go();self.assertEqual(p['requestedStart'],'2019-07-02');self.assertEqual(len(c),6);self.assertEqual(min(nav),'2019-07-02');self.assertEqual(len(p['excludedBeforeShareLaunch']),3);self.assertFalse(p['cashAddedByApplication']);self.assertAlmostEqual(next(c for c in c if c['year']==2023)['dailyDerived'],56.507585635216);self.assertEqual(p['unusedFields'],['Absolute NAV change'])
 def test_generic_200_catalogue_is_not_an_identity(self):
  self.page=b'<html><title>Fund Centre</title></html>'
  with self.assertRaisesRegex(ValueError,'schema'):self.go()
 def test_wrong_share_currency_or_launch_fails(self):
  for key,value in [('shareClassId',5185),('isin','OTHER'),('identityFrom','2019-06-27'),('navCurrency','EUR')]:
   original=copy.deepcopy(self.source);self.source[key]=value
   with self.assertRaises((ValueError,KeyError)):self.go()
   self.source=original
 def test_modified_schema_duplicates_invalid_values_or_currency_fails(self):
  original=self.csv
  for body in [original.replace(b'Mid/NAV',b'Price'),original+original.splitlines()[1]+b'\n',original.replace(b'40.6153',b'NaN',1),original.replace(b',USD',b',EUR',1)]:
   self.csv=body
   with self.assertRaises(ValueError):self.go()
 def test_newer_catalogue_anchor_never_reuses_old_export_as_current(self):
  self.csv=self.csv.replace(b'2026-10-27,40.6153',b'2026-10-27,40.6154',1)
  with self.assertRaisesRegex(ValueError,'anchor'):self.go()
 def test_changed_daily_nav_does_not_borrow_calendar_success(self):
  self.csv=self.csv.replace(b'2023-12-29,',b'2023-12-28,',1)
  with self.assertRaises(ValueError):self.go()
 def test_full_collector_serialises_the_actual_control_scope(self):
  from collect_official_share_history import collect_one
  from refresh_monthly_history import monitoring_report
  r=collect_one(self.source,NOW,json_fetch=lambda url:self.catalogue,document_fetch=lambda url:self.page if url==self.source['sourceUrl']else self.csv)
  thin=monitoring_report({'checkedAt':NOW.isoformat(),'series':[{'id':r['id'],'status':'validated','record':r,'evidence':r}]})
  self.assertEqual(thin['series'][0]['controlScope'],{'controlledInstrument':'IE00BK5BCD43','controlledFields':r['calendarProof']['controlledFields'],'requestedStart':'2019-07-02','controlledCalendarYears':[str(y)for y in range(2020,2026)]})
 def test_clean_energy_full_calendars(self):
  self.source=next(s for s in json.loads(pathlib.Path(__file__).with_name('official-nav-remainder-sources.json').read_text())if s['id']=='etfIE00BK5BCH80Nav');self.page=gzip.decompress((F/'clean-page.html.gz').read_bytes());self.csv=gzip.decompress((F/'clean.csv.gz').read_bytes());nav,p,c=self.go();self.assertEqual(len(c),5);self.assertEqual(p['excludedBeforeShareLaunch'],[]);self.assertAlmostEqual(next(c for c in c if c['year']==2025)['dailyDerived'],52.014639752731014)
if __name__=='__main__':unittest.main()
