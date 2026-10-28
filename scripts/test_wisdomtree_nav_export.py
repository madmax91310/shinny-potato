"""Real local XLSX captures; no claim that the supplier is accessible in GitHub."""
import unittest,datetime as dt,gzip,pathlib,copy
from unittest.mock import patch
from wisdomtree_nav_export import parse,payload
from issuer_nav_history import xlsx_rows,calendar_checks
F=pathlib.Path(__file__).with_name('fixtures')/'wisdomtree-export';NOW=dt.datetime(2026,10,28,tzinfo=dt.timezone.utc)
class NavExport(unittest.TestCase):
 def setUp(self):
  self.body=gzip.decompress((F/'copper.xlsx.gz').read_bytes());self.source={'isin':'GB00B15KXQ89','wisdomClassId':1000073,'navCurrency':'USD','periodStart':'2017-12'};self.identity={'ISIN':'GB00B15KXQ89','wtClassID':1000073,'fundCurrency':'USD'}
 def test_official_copper_bounds_and_rounding(self):
  p=parse(self.body,self.identity,self.source,NOW);checks=calendar_checks(p,{'2018':-22.17,'2019':6.16,'2025':37.21},2,NOW);self.assertEqual(len(checks),3);self.assertAlmostEqual(checks[1]['dailyDerived'],6.1608544711788005);self.assertEqual(p['2017-12-29'],31.20483)
 def test_wrong_class_currency_or_share_is_never_used(self):
  for k,v in [('ISIN','JE00BN7KB334'),('wtClassID',1000163),('fundCurrency','EUR')]:
   with self.assertRaises(ValueError):parse(self.body,self.identity|{k:v},self.source,NOW)
 def test_schema_change_or_removed_precision_note_fails(self):
  for column,value in [('B','Wrong Date'),('C','Price')]:
   rows=xlsx_rows(self.body);header=next(r for r in rows if r.get('B')=='Date');header[column]=value
   with patch('wisdomtree_nav_export.xlsx_rows',return_value=rows),self.assertRaises(ValueError):parse(self.body,self.identity,self.source,NOW)
  rows=[r for r in xlsx_rows(self.body)if'rounded to 5'not in r.get('B','')]
  with patch('wisdomtree_nav_export.xlsx_rows',return_value=rows),self.assertRaises(ValueError):parse(self.body,self.identity,self.source,NOW)
 def test_duplicate_invalid_and_out_of_scope_values_fail(self):
  rows=xlsx_rows(self.body);point=next(r for r in rows if r.get('B')=='2017-12-01')
  for extra in [point,{'B':'2017-11-30','C':'10'},{'B':'2027-01-01','C':'10'},{'B':'2026-10-01','C':'NaN'}]:
   with patch('wisdomtree_nav_export.xlsx_rows',return_value=rows+[extra]),self.assertRaises(ValueError):parse(self.body,self.identity,self.source,NOW)
 def test_natural_gas_contradiction_is_not_fixed_by_new_export(self):
  b=gzip.decompress((F/'natural-gas-2022.xlsx.gz').read_bytes());p=parse(b,{'ISIN':'JE00BN7KB334','wtClassID':1000163,'fundCurrency':'USD'},self.source|{'isin':'JE00BN7KB334','wisdomClassId':1000163,'periodStart':'2021-12'},NOW)
  self.assertAlmostEqual((p['2022-12-30']/p['2021-12-31']-1)*100,20)
  with self.assertRaisesRegex(ValueError,'disagreement'):calendar_checks(p,{'2022':17.51},2,NOW)
 def test_post_declares_selected_series_and_exact_window(self):
  p=payload(self.source,NOW);self.assertEqual(p['fromDate'],'2017-12-01');self.assertTrue(p['includeNav']);self.assertFalse(p['includeAum']);self.assertEqual(p['toDate'],'2026-10-28')
class BrowserTransport(unittest.TestCase):
 def test_direct_source_needs_no_browser(self):
  from wisdomtree_nav_export import download_with_identity
  with patch('wisdomtree_nav_export.download',return_value=b'workbook'),patch('wisdomtree_nav_export.subprocess.run')as browser:
   self.assertEqual(download_with_identity('url',{},'page'),(b'workbook',None,'official-xlsx-post'));browser.assert_not_called()
 def test_403_browser_keeps_same_source_and_actual_identity(self):
  import urllib.error,json,base64,subprocess
  from wisdomtree_nav_export import download_with_identity
  result={'status':200,'url':'url','identityUrl':'page','body':base64.b64encode(b'workbook').decode(),'identityBody':base64.b64encode(b'actual html').decode()}
  with patch('wisdomtree_nav_export.download',side_effect=urllib.error.HTTPError('url',403,'denied',None,None)),patch('wisdomtree_nav_export.subprocess.run',return_value=subprocess.CompletedProcess([],0,json.dumps(result).encode(),b'')):
   self.assertEqual(download_with_identity('url',{},'page'),(b'workbook',b'actual html','publisher-same-origin-browser-export'))
 def test_failure_never_uses_a_cached_export(self):
  import urllib.error,subprocess
  from wisdomtree_nav_export import download_with_identity
  with patch('wisdomtree_nav_export.download',side_effect=urllib.error.HTTPError('url',403,'denied',None,None)),patch('wisdomtree_nav_export.subprocess.run',return_value=subprocess.CompletedProcess([],1,b'',b'Official identity page unavailable: 403')),self.assertRaisesRegex(ValueError,'browser export failed'):
   download_with_identity('url',{},'page')
 def test_other_errors_do_not_retry_in_a_browser(self):
  import urllib.error
  from wisdomtree_nav_export import download_with_identity
  with patch('wisdomtree_nav_export.download',side_effect=urllib.error.HTTPError('url',503,'unavailable',None,None)),patch('wisdomtree_nav_export.subprocess.run')as browser,self.assertRaises(urllib.error.HTTPError):
   download_with_identity('url',{},'page')
  browser.assert_not_called()

class ReturnWindows(unittest.TestCase):
 def test_same_threshold_and_independent_years(self):
  from wisdomtree_nav_export import qualify_return_windows
  nav={'2020-12-31':100,'2021-12-31':110,'2022-12-30':132,'2023-12-29':145.2}
  source={'periodStart':'2020-12','navCurrency':'USD','requiredQualifiedCalendarYears':[2021,2023]}
  checks,bad=qualify_return_windows(nav,{'years':{'2021':10,'2022':19.9,'2023':10}},source,NOW)
  self.assertEqual([c['year']for c in checks],[2021,2023]);self.assertEqual([w['year']for w in bad],[2022]);self.assertEqual(bad[0]['start'],'2021-12');self.assertEqual(bad[0]['end'],'2022-12')
  with self.assertRaises(ValueError):qualify_return_windows(nav,{'years':{'2021':10,'2022':19.9,'2023':10}},source|{'requiredQualifiedCalendarYears':[2022]},NOW)
 def test_missing_complete_year_boundary_is_not_silenced(self):
  from wisdomtree_nav_export import qualify_return_windows
  with self.assertRaises(ValueError):qualify_return_windows({'2020-12-31':100,'2022-12-30':120},{'years':{'2021':10,'2022':10}},{'periodStart':'2020-12','navCurrency':'USD','requiredQualifiedCalendarYears':[2022]},NOW)
if __name__=='__main__':unittest.main()
