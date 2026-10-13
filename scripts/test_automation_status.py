import unittest
from unittest.mock import Mock
from publish_automation_status import update_status, read_report, publication_summary, repair_publication_history, include_configured_workflows, normalize_report

def run(id=1,conclusion='failure',workflow='update-economic-data.yml',**kwargs):
 return {'id':id,'path':'.github/workflows/'+workflow,'head_branch':'master','event':'schedule','status':'completed','conclusion':conclusion,'updated_at':f'2026-10-{id:02d}T10:00:00Z','html_url':f'https://github.com/test/repo/actions/runs/{id}',**kwargs}
class StatusTests(unittest.TestCase):
 def test_all_configured_workflows_are_visible_without_false_success(self):
  state=include_configured_workflows({'schemaVersion':1,'workflows':{}})
  for key in ['update-inflation.yml','update-practical-sheets.yml']:
   self.assertEqual(state['workflows'][key]['status'],'unknown')
  self.assertEqual(include_configured_workflows(state),state)
 def test_practical_failures_reviews_and_recovery_are_separate(self):
  workflow='update-practical-sheets.yml'
  report={'sources':{'ibonds':{'status':'error','label':'iBonds','error':'HTTP 403'},'etf':{'status':'ok','reviewRequired':True}},'failed':['ibonds'],'changed':['etf']}
  failed=update_status({},run(workflow=workflow),[],[report])
  self.assertEqual(set(failed['workflows'][workflow]['dataFailures']),{'practical:ibonds','practical:etf'})
  report['sources']['ibonds']={'status':'ok'};report['failed']=[]
  recovered=update_status(failed,run(2,'failure',workflow=workflow),[],[report])
  self.assertEqual(set(recovered['workflows'][workflow]['dataFailures']),{'practical:etf'})
  report['sources']['etf']['reviewRequired']=False;report['changed']=[]
  fixed=update_status(recovered,run(3,'success',workflow=workflow),[],[report])
  self.assertEqual(fixed['workflows'][workflow]['status'],'success')
 def test_inflation_report_marks_exact_series_as_collected(self):
  self.assertEqual(normalize_report({'seriesId':'011814631','rates':{'2026-09':-.3},'checkedAt':'2026-10-11'})['successes'],[{'id':'inflation:011814631'}])
 def test_regulatory_reports_keep_retained_failure_and_clear_only_checked_sources(self):
  report={'_collector':'fiscal-observation','observations':{'sources':{'av':{'title':'Assurance-vie'},'pea':{}}},'failures':{'av':'Wording changed'}}
  failed=update_status({},run(workflow='update-regulatory-data.yml'),[],[report])
  self.assertEqual(failed['workflows']['update-regulatory-data.yml']['dataFailures']['fiscal-observation:av']['cause'],'Wording changed')
  report['failures']={}
  recovered=update_status(failed,run(2,'success',workflow='update-regulatory-data.yml'),[],[report])
  self.assertEqual(recovered['workflows']['update-regulatory-data.yml']['dataFailures'],{})
  broker={'_collector':'broker-observation','observations':{'brokers':{'one':{}}},'failures':{'one:profile:pea':'PDF absent'},'successfulSources':['one']}
  failed=update_status({},run(workflow='update-regulatory-data.yml'),[],[broker])
  broker['failures']={}
  still=update_status(failed,run(2,'success',workflow='update-regulatory-data.yml'),[],[broker])
  self.assertIn('broker-observation:one:profile:pea',still['workflows']['update-regulatory-data.yml']['dataFailures'])
  broker['successfulSources'].append('one:profile:pea')
  fixed=update_status(still,run(3,'success',workflow='update-regulatory-data.yml'),[],[broker])
  self.assertEqual(fixed['workflows']['update-regulatory-data.yml']['dataFailures'],{})

 def test_collection_success_is_distinct_from_failed_publication(self):
  jobs=[{'name':'refresh','conclusion':'success'},{'name':'deploy / build','conclusion':'failure','steps':[{'name':'audit','conclusion':'failure'}]}]
  result=update_status({},run(),jobs)['workflows']['update-economic-data.yml']
  self.assertEqual(result['status'],'failure')
  self.assertEqual(result['collectionStatus'],'success')
  self.assertEqual(result['publicationStatus'],'failure')
  self.assertIsNone(result['lastSuccessAt'])
  self.assertEqual(result['lastCollectionSuccessAt'],'2026-10-01T10:00:00Z')
 def test_publication_date_survives_collection_failure(self):
  jobs=[{'name':'refresh','conclusion':'success'},{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-01T09:59:00Z','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success'}]}]
  first=update_status({},run(1,'success'),jobs)
  row=first['workflows']['update-economic-data.yml']
  self.assertEqual(row['lastPublicationSuccessAt'],'2026-10-01T09:59:00Z')
  failed=update_status(first,run(2),[{'name':'refresh','conclusion':'failure'}])['workflows']['update-economic-data.yml']
  self.assertEqual(failed['lastPublicationSuccessAt'],row['lastPublicationSuccessAt'])
  self.assertEqual(failed['lastCollectionSuccessAt'],row['lastCollectionSuccessAt'])
  self.assertEqual(failed['publicationStatus'],'not-run')

 def test_successful_job_with_skipped_pages_is_not_publication(self):
  published=[{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-01T09:59:00Z','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success'}]}]
  previous=update_status({},run(1,'success'),published)
  skipped=[{'name':'refresh','conclusion':'success'},{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-02T09:59:00Z','steps':[{'name':'Skip superseded production snapshots','conclusion':'success'},{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'skipped'}]}]
  result=update_status(previous,run(2,'success'),skipped)['workflows']['update-economic-data.yml']
  self.assertEqual(result['publicationStatus'],'not-run')
  self.assertEqual(result['lastPublicationSuccessAt'],'2026-10-01T09:59:00Z')
  self.assertEqual(result['collectionStatus'],'success')
  self.assertEqual(publication_summary(run(2,'success'),[{'name':'deploy / deploy','conclusion':'success'}]),('not-run',None))

 def test_backfill_repairs_false_publication_without_replaying_data(self):
  published=[{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-01T09:59:00Z','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success','completed_at':'2026-10-01T09:58:00Z'}]}]
  skipped=[{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-02T09:59:00Z','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'skipped'}]}]
  state=update_status({},run(2,'success'),skipped)
  row=state['workflows']['update-economic-data.yml'];row['publicationStatus']='success';row['lastPublicationSuccessAt']='2026-10-02T09:59:00Z';row['dataFailures']={'retained':{'cause':'Still unresolved'}}
  fixed=repair_publication_history(state,[(run(1,'success'),published),(run(2,'success'),skipped)])
  after=fixed['workflows']['update-economic-data.yml']
  self.assertEqual(after['publicationStatus'],'not-run')
  self.assertEqual(after['lastPublicationSuccessAt'],'2026-10-01T09:58:00Z')
  self.assertEqual(after['dataFailures'],row['dataFailures'])
  self.assertEqual(after['lastCollectionSuccessAt'],row['lastCollectionSuccessAt'])
  self.assertEqual(row['lastPublicationSuccessAt'],'2026-10-02T09:59:00Z','Input is preserved')
  self.assertEqual(repair_publication_history(fixed,[]),fixed,'No evidence does not erase history')

 def test_large_issuer_report_is_bounded_and_projected(self):
  path=Mock();path.name='additional-observation.json';path.stem='additional-observation'
  path.stat.return_value.st_size=12_000_000
  path.read_text.return_value='{"shares":[{"isin":"test","status":"validated","rawComponents":{"holdings":"unused raw publication"}}]}'
  report=read_report(path,'collect-etf-pilot.yml')
  self.assertEqual(report,{'successes':[{'id':'etf-additional-observation-test'}],'errors':[]})
  with self.assertRaises(ValueError):read_report(path,'update-scpi.yml')
  path.stat.return_value.st_size=128_000_001
  with self.assertRaises(ValueError):read_report(path,'collect-etf-pilot.yml')
 def test_presentation_report_alerts_only_failed_records_and_recovers(self):
  for workflow in ('update-scpi.yml','update-insurance.yml','update-presentation-actors.yml'):
   failed=update_status({},run(workflow=workflow),[],[{'observations':[{'id':'one','status':'failure','reason':'PDF changed'},{'id':'two','status':'success'}]}])
   self.assertEqual(set(failed['workflows'][workflow]['dataFailures']),{'one'})
   self.assertEqual(failed['workflows'][workflow]['dataFailures']['one']['cause'],'PDF changed')
   still=update_status(failed,run(2,'success',workflow=workflow),[],[{'observations':[{'id':'two','status':'success'}]}])
   self.assertEqual(still['workflows'][workflow]['status'],'failure')
   recovered=update_status(still,run(3,'success',workflow=workflow),[],[{'observations':[{'id':'one','status':'success'}]}])
   self.assertEqual(recovered['workflows'][workflow]['status'],'success')
 def test_failure_recovery_and_no_false_alert(self):
  failed=update_status({},run(),[])
  self.assertEqual(failed['workflows']['update-economic-data.yml']['status'],'failure')
  recovered=update_status(failed,run(2,'success'),[])
  self.assertEqual(recovered['workflows']['update-economic-data.yml']['status'],'success')
  self.assertEqual(recovered,update_status(recovered,run(),[]))
 def test_only_the_recovered_data_clears(self):
  failed=update_status({},run(),[],[{'errors':[{'id':'insee-wealth','error':'Table absente'}]}])
  daily=update_status(failed,run(2,'success'),[],[{'successes':[{'id':'livret-a'}]}])
  self.assertEqual(daily['workflows']['update-economic-data.yml']['status'],'failure')
  recovered=update_status(daily,run(3,'success'),[],[{'successes':[{'id':'insee-wealth'}]}])
  self.assertEqual(recovered['workflows']['update-economic-data.yml']['status'],'success')
 def test_cancelled_and_pr_runs_do_not_change_production(self):
  for event in [run(conclusion='cancelled'),run(event='pull_request'),run(head_branch='feature')]:self.assertEqual(update_status({},event,[]),{})
 def test_last_success_and_failure_step(self):
  previous=update_status({},run(1,'success'),[])
  failed=update_status(previous,run(2),[{'name':'refresh','conclusion':'failure','steps':[{'name':'collect','conclusion':'failure'}]}])['workflows']['update-economic-data.yml']
  self.assertEqual(failed['lastSuccessAt'],'2026-10-01T10:00:00Z')
  self.assertEqual(failed['failures'][0]['step'],'collect')

class NewCollectorStatusTests(unittest.TestCase):
 def test_named_collection_jobs_are_independent_from_deploy(self):
  for workflow,job in [('update-investor-13f.yml','update'),('update-gold-monthly.yml','update'),('refresh-automated-index-sheets.yml','collect')]:
   row=update_status({},run(1,'success',workflow),[{'name':job,'conclusion':'success'}])['workflows'][workflow]
   self.assertEqual(row['collectionStatus'],'success')
   self.assertIsNotNone(row['lastCollectionSuccessAt'])
   self.assertEqual(row['publicationStatus'],'not-run')
   row=update_status({},run(1,'success',workflow),[{'name':'deploy / deploy','conclusion':'success'}])['workflows'][workflow]
   self.assertEqual(row['collectionStatus'],'unknown')
 def test_records_reports_recover_only_their_own_share(self):
  for workflow in ['update-lifestrategy.yml','update-qualified-exposures.yml']:
   failed=update_status({},run(workflow=workflow),[],[{'records':[{'isin':'one'}],'failed':[{'isin':'two','error':'Changed page'}]}])
   still=update_status(failed,run(2,'success',workflow),[],[{'records':[{'isin':'one'}],'failed':[]}])
   self.assertIn('two',still['workflows'][workflow]['dataFailures'])
   fixed=update_status(still,run(3,'success',workflow),[],[{'records':[{'isin':'two'}],'failed':[]}])
   self.assertEqual(fixed['workflows'][workflow]['dataFailures'],{})
  self.assertEqual(normalize_report({'records':[],'excluded':[{'isin':'new','error':'No source','active':False}]}),{'successes':[],'errors':[]})
 def test_composite_report_preserves_each_failure_domain(self):
  report={'funds':{'shares':[{'isin':'A','status':'failed','reason':'Issuer HTML'}]},'monthly':{'series':[{'id':'A','status':'validated'}]},'qualified':[{'id':'B','status':'failed','reason':'Factsheet'}],'levels':{'successes':[],'errors':[{'id':'A','error':'Daily price'}]}}
  normalized=normalize_report(report)
  self.assertEqual({r['id']for r in normalized['errors']},{'funds:etf-issuer-A','qualified:B','levels:A'})
  self.assertEqual(normalized['successes'],[{'id':'monthly:A'}])
  state=update_status({},run(workflow='update-non-bond-expansion.yml'),[],[report])
  fixed=update_status(state,run(2,'success','update-non-bond-expansion.yml'),[],[{'monthly':{'series':[{'id':'A','status':'validated'}]}}])
  self.assertEqual(len(fixed['workflows']['update-non-bond-expansion.yml']['dataFailures']),3)
 def test_selected_indices_and_nonstandard_report_filename(self):
  path=Mock();path.name='selected-index-observations.json';path.stem='selected-index-observations';path.stat.return_value.st_size=200
  path.read_text.return_value='{"indices":[{"id":"world","facts":{},"returns":{"values":[1]},"errors":[{"field":"composition","reason":"Missing weights"}]}]}'
  self.assertEqual(read_report(path,'refresh-automated-index-sheets.yml')['errors'][0]['id'],'index-world-composition')

if __name__ == '__main__': unittest.main()
