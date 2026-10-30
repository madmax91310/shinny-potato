import copy,datetime as dt,gzip,json,pathlib,unittest
from collect_official_share_history import collect_one,configurations
from wisdomtree_performance_history import parse,anchor_for
ROOT=pathlib.Path(__file__).resolve().parents[1]
FIX=ROOT/'scripts/fixtures/wisdomtree-performance'
NOW=dt.datetime(2026,10,29,8,tzinfo=dt.timezone.utc)
SOURCES=[s for s in configurations()if s.get('wisdomTicker') in ('COPA','BRNT','CRUD','COFF')]
def fixture(s,kind):return gzip.decompress((FIX/(s['wisdomTicker']+'-'+kind+'.gz')).read_bytes())
class OfficialPerformance(unittest.TestCase):
 def test_all_four_sources_keep_exact_units_and_all_calendar_gates(self):
  self.assertEqual(len(SOURCES),4)
  for s in SOURCES:
   def fetch(url):return fixture(s,'identity'if url==s['factsheetUrl']else'graph'if'mode=gro10k'in url else'tabular')
   r=collect_one(s,NOW,document_fetch=fetch)
   self.assertFalse(r['anniversaryAvailable']);self.assertFalse(r['collectAnniversary'])
   self.assertEqual(r['historyUnqualifiedReturnWindows'],[])
   self.assertTrue(r['calendarProof']['calendarSourceConsultedByThisCollector'])
   anchor=r['calendarProof']['scaleProof']['anchor']
   self.assertEqual(r['latestLevel']['nativeValue'],anchor['nav'])
   self.assertEqual(r['latestLevel']['checkedAt'],anchor['sourceCheckedAt'])
   self.assertEqual(r['latestLevel']['unitQualification'],'historical-reference-only')
   self.assertEqual(r['lastOfficialValuation'],anchor['date'])
   self.assertEqual(r['periodStart'],s['periodStart'])
   self.assertEqual(r['periodEnd'],'2026-09')
   self.assertFalse(r['calendarProof']['scaleProof']['anchorIsFreshSourceCheck'])
   self.assertNotIn('shareInception',r['calendarProof'])
   self.assertEqual(len(r['calendarProof']['checks']),10 if s['wisdomTicker']=='COPA' else 4 if s['wisdomTicker']=='COFF' else 5)
 def test_ordinary_refresh_retains_guards_serializes_scope_and_isolates_failure(self):
  from refresh_monthly_history import refresh,monitoring_report
  incoming={}
  for source in SOURCES:
   def fetch(url):return fixture(source,'identity'if url==source['factsheetUrl']else'graph'if'mode=gro10k'in url else'tabular')
   incoming[source['id']]=collect_one(source,NOW,document_fetch=fetch)
  previous=copy.deepcopy(incoming)
  for record in previous.values():
   record['checkedAt']='2026-10-28T00:00:00+00:00'
   record['navHistoryTransport']='official-xlsx-post'
   record['calendarProof']={}
  baseline={k:{'currency':r['currency'],'points':[{'date':m,'price':v}for m,v in r['points']]}for k,r in previous.items()}
  merged,report=refresh({'series':SOURCES},previous,baseline,NOW,lambda s,n:copy.deepcopy(incoming[s['id']]))
  self.assertTrue(all(r['status']=='validated'for r in report['series']))
  thin=monitoring_report(report)
  self.assertTrue(all(r['controlScope']['controlledCalendarYears']for r in thin['series']))
  broken=SOURCES[0]['id']
  def partial(s,n):
   if s['id']==broken:raise TimeoutError('source unavailable')
   return copy.deepcopy(incoming[s['id']])
  kept,failed=refresh({'series':SOURCES},previous,baseline,NOW,partial)
  self.assertEqual(kept[broken],previous[broken])
  self.assertEqual(sum(r['status']=='validated'for r in failed['series']),3)

 def test_benchmark_is_not_the_product_and_identity_changes_fail(self):
  s=SOURCES[0];a=anchor_for(s);graph=json.loads(fixture(s,'graph'));table=json.loads(fixture(s,'tabular'))
  with self.assertRaises(ValueError):parse([r for r in graph if r['wtTypeID']==2],table,s,a,NOW)
  for field,value in [('currency','EUR'),('entityID','GB0000000000'),('entityGroup','idxBmk'),('levelType','Price'),('ticker','OTHER LN'),('wtListingID',1),('checkDiff',.01)]:
   t=copy.deepcopy(table);next(r for r in t if r['wtTypeID']==1 and r['windowTag']=='calYearEnd')[field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):parse(graph,t,s,a,NOW)
 def test_partial_duplicate_shift_currency_or_price_chart_is_not_admitted(self):
  s=SOURCES[0];a=anchor_for(s);graph=json.loads(fixture(s,'graph'));table=json.loads(fixture(s,'tabular'))
  for field,value in [('currency','EUR'),('levelType','NAV'),('levelTypeID',5),('officialLevel',float('nan')),('shiftTicker','OTHER'),('cntCheck',1),('wtTypeID',True),('cobDate','2027-01-01')]:
   g=copy.deepcopy(graph);next(r for r in g if r['wtTypeID']==1)[field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):parse(g,table,s,a,NOW)
  with self.assertRaises(ValueError):parse(graph[:-1],table,s,a,NOW)if graph[-1]['wtTypeID']==1 else parse([r for i,r in enumerate(graph)if i!=0],table,s,a,NOW)
  with self.assertRaises(ValueError):parse(graph+[graph[0]],table,s,a,NOW)
  with self.assertRaises(ValueError):parse(graph,table+[table[0]],s,a,NOW)
 def test_unit_anchor_is_not_a_cache_success_or_fabricated_price(self):
  s=SOURCES[0];g=json.loads(fixture(s,'graph'));t=json.loads(fixture(s,'tabular'));a=anchor_for(s)
  for patch in [{'isin':'GB0000000000'},{'currency':'EUR'},{'nav':0},{'date':'2026-10-29'}]:
   with self.assertRaises(ValueError):parse(g,t,s,{**a,**patch},NOW)
  def offline(_):raise TimeoutError('real source unavailable')
  with self.assertRaises(TimeoutError):collect_one(s,NOW,document_fetch=offline)
 def test_pre_window_product_history_never_extends_current_security(self):
  s=next(s for s in SOURCES if s['wisdomTicker']=='COFF')
  g=json.loads(fixture(s,'graph'));t=json.loads(fixture(s,'tabular'));points,proof=parse(g,t,s,anchor_for(s),NOW)
  self.assertGreater(proof['excludedPreWindowObservations'],0)
  self.assertEqual(min(points),'2021-12-01')
  self.assertEqual(proof['suppliedExactSecurityStart'],'2021-12-01')
class ExistingBlockedShares(unittest.TestCase):
 def test_five_exact_existing_shares_retain_dates_units_and_all_calendar_gates(self):
  sources=[s for s in configurations()if s.get('wisdomTicker')in('WTAI','WCLD','COCO','NGAS','WEAT')]
  self.assertEqual(len(sources),5)
  for s in sources:
   def fetch(url):return fixture(s,'identity'if url==s['factsheetUrl']else'graph'if'mode=gro10k'in url else'tabular')
   r=collect_one(s,NOW,document_fetch=fetch)
   self.assertFalse(r['anniversaryAvailable']);self.assertFalse(r['collectAnniversary'])
   self.assertEqual(r['historyUnqualifiedReturnWindows'],[])
   self.assertTrue(set(s['requiredQualifiedCalendarYears'])<=set(r['calendarProof']['qualifiedCalendarYears']))
   self.assertEqual(r['latestLevel']['asOf'],'2026-10-21')
   self.assertEqual(r['latestLevel']['checkedAt'],anchor_for(s)['sourceCheckedAt'])
   self.assertEqual(r['calendarProof']['sourceSnapshotDate'],'2026-10-27')
   self.assertEqual(r['calendarProof']['tablePublicationDate'],'2026-10-28')
   self.assertEqual(r['periodStart'],s['periodStart'])
   if s['wisdomTicker']=='WTAI':
    self.assertEqual(r['calendarProof']['issuerProductInception'],'2018-11-30')
    self.assertEqual(r['calendarProof']['issuerChartInception'],'2018-12-05')
   if s['wisdomTicker']in('NGAS','WEAT'):
    self.assertGreater(r['calendarProof']['excludedPreWindowObservations'],0)
    self.assertEqual(r['points'][0][0],'2021-12')
 def test_independently_refreshed_table_requires_each_closed_calendar_match(self):
  s=next(s for s in configurations()if s.get('wisdomTicker')=='WTAI')
  g=json.loads(fixture(s,'graph'));t=json.loads(fixture(s,'tabular'));a=anchor_for(s)
  for field,value in [('windowRoR',.99),('dt','2019-11-30'),('cobDate','2027-01-01')]:
   bad=copy.deepcopy(t);next(r for r in bad if r['wtTypeID']==1 and r['windowTag']=='calYearEnd')[field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):parse(g,bad,s,a,NOW)
  bad=copy.deepcopy(s);bad['wisdomChartInception']='2018-11-30'
  with self.assertRaises(ValueError):parse(g,t,bad,a,NOW)
 def test_archived_nav_anchor_does_not_admit_a_different_class_or_currency(self):
  s=next(s for s in configurations()if s.get('wisdomTicker')=='WTAI')
  for patch in [{'wisdomClassId':1},{'navCurrency':'EUR'}]:
   with self.assertRaises(ValueError):anchor_for({**s,**patch})

class OrdinaryBrowserTransport(unittest.TestCase):
 def test_direct_success_and_origin_are_scoped_to_two_registered_endpoints(self):
  from unittest.mock import patch
  from wisdomtree_performance_history import acquire,urls
  s=SOURCES[0]
  with patch('wisdomtree_performance_history.download',return_value=b'[]')as fetch,patch('wisdomtree_performance_history.subprocess.run')as browser:
   bodies,proof=acquire(s)
  self.assertEqual(list(bodies),urls(s));browser.assert_not_called()
  self.assertTrue(all(u.startswith('https://dataspanapi.wisdomtree.com/funddetails/historical_performance?entity=') for u in bodies))
  self.assertEqual(proof['actualNavTransport'],'public-widget-http')
  self.assertTrue(all(c.kwargs['headers']['Origin']=='https://www.wisdomtree.com'for c in fetch.call_args_list))
 def test_only_a_403_gets_one_fresh_bounded_browser_attempt(self):
  from unittest.mock import patch
  import urllib.error,subprocess,base64
  from wisdomtree_performance_history import acquire,urls
  s=SOURCES[0];endpoints=urls(s)
  payload={'results':[{'url':u,'status':200,'body':base64.b64encode(b'[]').decode()}for u in endpoints]}
  with patch('wisdomtree_performance_history.download',side_effect=urllib.error.HTTPError(endpoints[0],403,'denied',None,None)),patch('wisdomtree_performance_history.subprocess.run',return_value=subprocess.CompletedProcess([],0,json.dumps(payload).encode(),b''))as browser:
   bodies,proof=acquire(s)
  browser.assert_called_once();self.assertEqual(browser.call_args.kwargs['timeout'],100)
  self.assertEqual(len(bodies),2);self.assertEqual(proof['accessAttempts'][0]['status'],'unavailable')
  self.assertEqual(proof['actualNavTransport'],'ordinary-public-browser-json')
  for status in [401,404,503]:
   with patch('wisdomtree_performance_history.download',side_effect=urllib.error.HTTPError(endpoints[0],status,'failed',None,None)),patch('wisdomtree_performance_history.subprocess.run')as browser,self.assertRaises(urllib.error.HTTPError):acquire(s)
   browser.assert_not_called()
 def test_failure_wrong_source_and_partial_payload_never_reuse_fixtures(self):
  from unittest.mock import patch
  import urllib.error,subprocess,base64
  from wisdomtree_performance_history import acquire,urls
  s=SOURCES[0];endpoints=urls(s);error=urllib.error.HTTPError(endpoints[0],403,'denied',None,None)
  for rows in [[],[{'url':u,'status':200,'body':base64.b64encode(b'[]').decode()}for u in endpoints[:1]],[{'url':'https://example.org','status':200,'body':'W10='}]*2]:
   with patch('wisdomtree_performance_history.download',side_effect=error),patch('wisdomtree_performance_history.subprocess.run',return_value=subprocess.CompletedProcess([],0,json.dumps({'results':rows}).encode(),b'')),self.assertRaises(ValueError):acquire(s)
  with patch('wisdomtree_performance_history.download',side_effect=error),patch('wisdomtree_performance_history.subprocess.run',return_value=subprocess.CompletedProcess([],1,b'',b'source403')),self.assertRaisesRegex(ValueError,'public browser performance failed'):acquire(s)

if __name__=='__main__':unittest.main()

class DocumentedWidgetPath(unittest.TestCase):
 def test_only_the_wti_existing_share_changes_to_the_actual_issuer_widget_path(self):
  from wisdomtree_performance_history import urls
  wti=next(s for s in configurations()if s.get('wisdomTicker')=='CRUD')
  self.assertEqual(urls(wti),[f'https://dataspanapi.wisdomtree.com/funddetails/historical_performance?entity=CRUD&mode={mode}'for mode in ['gro10k','tabular']])
  for source in configurations():
   if source.get('navHistoryTransport')=='official-dataspan-nav-tr'and source.get('wisdomTicker')not in ('CRUD','WTAI','COPA','BRNT','WCLD','COCO','COFF','NGAS','WEAT'):
    self.assertTrue(all('/historical_performance/?'in u for u in urls(source)))
  ordinary=next(s for s in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']if s['id']==wti['id'])
  self.assertNotIn('wisdomPerformancePathStyle',ordinary)
  self.assertEqual(urls(ordinary),urls(wti),'Ordinary producer must consume the shared route')
  for key,value in [('isin','GB00B15KXQ89'),('wisdomClassId',1),('wisdomTicker','COPA'),('navCurrency','EUR')]:
   with self.assertRaises(ValueError):urls({**ordinary,key:value})
  for bad in ['unregistered','https://another.invalid/','../']:
   with self.assertRaises(ValueError):urls({**wti,'wisdomPerformancePathStyle':bad})

 def test_active_ai_incident_uses_its_own_exact_shared_client_route(self):
  from wisdomtree_performance_history import urls
  from collect_official_share_history import configurations
  source=next(s for s in configurations()if s.get('wisdomTicker')=='WTAI')
  self.assertEqual(source['isin'],'IE00BDVPNG13');self.assertEqual(source['navCurrency'],'USD')
  self.assertEqual(urls(source),[f'https://dataspanapi.wisdomtree.com/funddetails/historical_performance?entity=WTAI&mode={mode}'for mode in ['gro10k','tabular']])
  ordinary=next(s for s in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']if s['id']==source['id'])
  self.assertEqual(urls(ordinary),urls(source))
  with self.assertRaises(ValueError):urls({**ordinary,'isin':'GB00B15KXV33'})


class RemainingIssuerWidgets(unittest.TestCase):
 def test_all_seven_incident_routes_keep_exact_shared_identity_and_modes(self):
  from wisdomtree_performance_history import urls
  sources=[s for s in configurations()if s.get('wisdomTicker')in {'COPA','BRNT','WCLD','COCO','COFF','NGAS','WEAT'}]
  self.assertEqual(len(sources),7)
  ordinary={s['id']:s for s in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']}
  for s in sources:
   with self.subTest(isin=s['isin']):
    self.assertEqual(urls(s),[f"https://dataspanapi.wisdomtree.com/funddetails/historical_performance?entity={s['wisdomTicker']}&mode={m}"for m in ['gro10k','tabular']])
    self.assertEqual(urls(s),urls(ordinary[s['id']]))
    with self.assertRaises(ValueError):urls({**ordinary[s['id']],'navCurrency':'EUR'})
