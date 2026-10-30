import unittest
import io
import json
import pathlib
import subprocess
import tempfile
import zipfile
from unittest.mock import Mock
from publish_automation_status import update_status, read_report, publication_summary, repair_publication_history, include_configured_workflows, normalize_report, require_completed_job_evidence

def run(id=1,conclusion='failure',workflow='update-economic-data.yml',**kwargs):
 return {'id':id,'path':'.github/workflows/'+workflow,'head_branch':'master','event':'schedule','status':'completed','conclusion':conclusion,'updated_at':f'2026-10-{id:02d}T10:00:00Z','html_url':f'https://github.com/test/repo/actions/runs/{id}',**kwargs}
class StatusTests(unittest.TestCase):
 def test_explicit_fresh_quarter_closes_only_its_own_incident(self):
  def report(rows):return {'_collector':'company-universe-observation','companies':rows}
  initial=update_status({},run(workflow='update-scpi.yml'),[],[report({
      'a':{'quarter':'retained with original observation date; annual-only fallback'},
      'b':{'quarter':'retained with original observation date; annual-only fallback'}})])
  accounts_only=update_status(initial,run(2,workflow='update-scpi.yml'),[],[report({'a':{'accounts':'updated'}})])
  failures=accounts_only['workflows']['update-scpi.yml']['dataFailures']
  self.assertIn('company-universe-observation:a:quarter',failures)
  recovered=update_status(accounts_only,run(3,workflow='update-scpi.yml'),[],[report({'a':{'accounts':'updated','quarter':'updated'}})])
  failures=recovered['workflows']['update-scpi.yml']['dataFailures']
  self.assertNotIn('company-universe-observation:a:quarter',failures)
  self.assertIn('company-universe-observation:b:quarter',failures)

 def test_dca_equity_report_tracks_missing_and_recovered_classifications(self):
  report={'_collector':'dca-equities','updated':['airliquide'],'missing':['nintendo']}
  failed=update_status({},run(workflow='update-qualified-exposures.yml'),[],[report])
  self.assertEqual(set(failed['workflows']['update-qualified-exposures.yml']['dataFailures']),{'dca-equity:nintendo'})
  report.update(updated=['nintendo'],missing=[])
  recovered=update_status(failed,run(2,'success',workflow='update-qualified-exposures.yml'),[],[report])
  self.assertEqual(recovered['workflows']['update-qualified-exposures.yml']['dataFailures'],{})

 def test_four_phases_with_validation_failure_and_setup_failure(self):
  from publish_automation_status import REGISTRY
  workflow='update-scpi.yml';config=REGISTRY[workflow]
  def evaluate(steps, conclusion='failure'):
   return update_status({},run(workflow=workflow,conclusion=conclusion),[{'name':config['collectionJob'],'conclusion':conclusion,'steps':steps}],[])['workflows'][workflow]
  collected=[{'name':n,'conclusion':'success'} for n in config['collectionSteps']]
  row=evaluate(collected+[{'name':config['validationSteps'][0],'conclusion':'failure'},{'name':'Validate collected observations','conclusion':'skipped'},{'name':'Commit validated observations','conclusion':'skipped'}])
  self.assertEqual([row[k] for k in ['collectionStatus','validationStatus','recordingStatus','publicationStatus']],['success','failure','not-run','not-run'])
  row=evaluate([{'name':'Setup dependencies','conclusion':'failure'}])
  self.assertEqual(row['collectionStatus'],'unknown')
  self.assertEqual(row['validationStatus'],'unknown')
  row=evaluate(collected+[{'name':'Validate collected observations','conclusion':'success'},{'name':'Commit validated observations','conclusion':'failure'}])
  self.assertEqual(row['collectionStatus'],'success');self.assertEqual(row['validationStatus'],'success');self.assertEqual(row['recordingStatus'],'failure')
  row=evaluate(collected+[{'name':config['collectionSteps'][0],'conclusion':'failure'},{'name':'Validate collected observations','conclusion':'success'}])
  self.assertEqual(row['collectionStatus'],'failure')
  row=evaluate([{'name':n,'conclusion':'skipped'} for n in config['collectionSteps']])
  self.assertEqual(row['collectionStatus'],'not-run')
  row=evaluate(collected+[{'name':'Validate collected observations','conclusion':'success'},{'name':'Commit validated observations','conclusion':'success'}],'success')
  self.assertEqual(row['recordingStatus'],'success');self.assertEqual(row['publicationStatus'],'not-run')

 def test_recording_failure_is_distinct_from_collection(self):
  jobs=[{'name':'refresh','conclusion':'failure','steps':[{'name':'Commit validated observations','conclusion':'failure'}]}]
  report={'successes':[{'id':'company:A'}], 'errors':[]}
  row=update_status({},run(workflow='update-scpi.yml'),jobs,[report])['workflows']['update-scpi.yml']
  self.assertEqual(row['collectionStatus'],'success')
  self.assertEqual(row['recordingStatus'],'failure')
  self.assertEqual(row['publicationStatus'],'not-run')
  self.assertEqual(row['status'],'failure')
  report['errors']=[{'id':'company:B','error':'Source unavailable'}]
  row=update_status({},run(workflow='update-scpi.yml'),jobs,[report])['workflows']['update-scpi.yml']
  self.assertEqual(row['collectionStatus'],'failure')
  self.assertEqual(row['recordingStatus'],'failure')
 def test_insee_requires_a_real_production_collection_even_without_changes(self):
  state=include_configured_workflows({'schemaVersion':1,'workflows':{}})
  report={'seriesId':'011814631','rates':{'2026-09':-.6},'checkedAt':'2026-10-14T08:00:00Z','changes':[]}
  jobs=[{'name':'collect','conclusion':'success'}]
  pr=run(14,'success',workflow='update-inflation.yml',event='pull_request',head_branch='fix/insee')
  self.assertEqual(update_status(state,pr,jobs,[report]),state)
  production=run(14,'success',workflow='update-inflation.yml',event='push')
  recorded=update_status(state,production,jobs,[report])['workflows']['update-inflation.yml']
  self.assertEqual(recorded['collectionStatus'],'success')
  self.assertEqual(recorded['completedAt'],production['updated_at'])
  self.assertEqual(recorded['lastCollectionSuccessAt'],production['updated_at'])
  self.assertEqual(recorded['publicationStatus'],'not-run')
  self.assertIsNone(recorded['lastPublicationSuccessAt'])
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
 def test_insee_timeout_is_actionable_and_only_real_recovery_clears_it(self):
  workflow='update-inflation.yml'
  report={'seriesId':'011814631','checkedAt':'2026-10-14','successes':[], 'errors':[{'id':'inflation:011814631','name':'Inflation mensuelle INSEE','error':'TimeoutError: TLS timeout'}]}
  failed=update_status({},run(workflow=workflow),[{'name':'collect','conclusion':'failure'}],[report])
  row=failed['workflows'][workflow]
  self.assertEqual(row['collectionStatus'],'failure')
  self.assertIn('TLS timeout',str(row['dataFailures']))
  self.assertIsNone(row['lastCollectionSuccessAt'])
  recovered=update_status(failed,run(2,'success',workflow),[{'name':'collect','conclusion':'success'}],[{'seriesId':'011814631','rates':{'2026-09':-.3},'checkedAt':'2026-10-14'}])
  self.assertEqual(recovered['workflows'][workflow]['dataFailures'],{})
  self.assertEqual(recovered['workflows'][workflow]['collectionStatus'],'success')

 def test_radar_feed_reports_unreadable_families_not_contradictions(self):
  feed={'_collector':'feed','schemaVersion':1,'coverage':{'etf':120,'investisseurs':0,'indices':50},'events':[],
        'errors':[{'family':'investisseurs','entity':'','reason':'Déclarations 13F indisponibles.'},
                  {'family':'indices','entity':'world','reason':'Valeur contradictoire pour la même période (2026-09) : Secteurs. Dernière observation conservée.'}]}
  report=normalize_report(feed)
  self.assertEqual([e['id'] for e in report['errors']],['radar:investisseurs'])
  self.assertEqual(report['errors'][0]['error'],'Déclarations 13F indisponibles.')
  self.assertEqual({s['id'] for s in report['successes']},{'radar:etf','radar:indices'})
  failed=update_status({},run(1,'success','update-editorial-radar.yml'),[],[feed])
  self.assertIn('radar:investisseurs',failed['workflows']['update-editorial-radar.yml']['dataFailures'])
  recovered=update_status(failed,run(2,'success','update-editorial-radar.yml'),[],[{**feed,'coverage':{**feed['coverage'],'investisseurs':28},'errors':[]}])
  self.assertEqual(recovered['workflows']['update-editorial-radar.yml']['dataFailures'],{})

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
  self.assertIsNone(result['lastCollectionSuccessAt'], 'Un job vert sans preuve source ne date pas un contrôle source')
 def test_publication_date_survives_collection_failure(self):
  jobs=[{'name':'refresh','conclusion':'success'},{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-01T09:59:00Z','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success'},{'name':'Verify actual public data','conclusion':'success'}]}]
  first=update_status({},run(1,'success'),jobs)
  row=first['workflows']['update-economic-data.yml']
  self.assertEqual(row['lastPublicationSuccessAt'],'2026-10-01T09:59:00Z')
  failed=update_status(first,run(2),[{'name':'refresh','conclusion':'failure'}])['workflows']['update-economic-data.yml']
  self.assertEqual(failed['lastPublicationSuccessAt'],row['lastPublicationSuccessAt'])
  self.assertEqual(failed['lastCollectionSuccessAt'],row['lastCollectionSuccessAt'])
  self.assertEqual(failed['publicationStatus'],'not-run')

 def test_successful_job_with_skipped_pages_is_not_publication(self):
  published=[{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-01T09:59:00Z','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success'},{'name':'Verify actual public data','conclusion':'success'}]}]
  previous=update_status({},run(1,'success'),published)
  skipped=[{'name':'refresh','conclusion':'success'},{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-02T09:59:00Z','steps':[{'name':'Skip superseded production snapshots','conclusion':'success'},{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'skipped'}]}]
  result=update_status(previous,run(2,'success'),skipped)['workflows']['update-economic-data.yml']
  self.assertEqual(result['publicationStatus'],'not-run')
  self.assertEqual(result['lastPublicationSuccessAt'],'2026-10-01T09:59:00Z')
  self.assertEqual(result['collectionStatus'],'success')
  self.assertEqual(publication_summary(run(2,'success'),[{'name':'deploy / deploy','conclusion':'success'}]),('not-run',None))

 def test_deploy_success_without_public_byte_verification_is_not_certified(self):
  job={'name':'deploy / publish','conclusion':'failure','steps':[
    {'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success'},
    {'name':'Verify actual public data','conclusion':'failure'}]}
  self.assertEqual(publication_summary(run(),[job]),('failure',None))
  job['steps'][1].update(conclusion='success',completed_at='2026-10-01T10:01:00Z')
  self.assertEqual(publication_summary(run(),[job]),('success','2026-10-01T10:01:00Z'))

 def test_backfill_repairs_false_publication_without_replaying_data(self):
  published=[{'name':'deploy / deploy','conclusion':'success','completed_at':'2026-10-01T09:59:00Z','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success','completed_at':'2026-10-01T09:58:00Z'},{'name':'Verify actual public data','conclusion':'success','completed_at':'2026-10-01T09:58:00Z'}]}]
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
  path.read_bytes.side_effect=lambda: path.read_text().encode()
  report=read_report(path,'collect-etf-pilot.yml')
  self.assertEqual({k:report[k]for k in ('successes','errors')},{'successes':[{'id':'etf-additional-observation-test'}],'errors':[]})
  self.assertEqual(len(report['_reportEvidence']['sha256']),64)
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

class MissingTerminalJobsTests(unittest.TestCase):
 def test_empty_and_missing_terminal_job_evidence_is_not_a_phase_result(self):
  terminal=run(workflow='update-investor-13f.yml')
  for jobs in ([], [{'name':'deploy','steps':[]}], [{'name':'update','conclusion':'failure','steps':[]}]):
   with self.subTest(jobs=jobs):
    with self.assertRaises(ValueError):require_completed_job_evidence(terminal,jobs,'update')
  for conclusion in ('skipped','cancelled'):
   require_completed_job_evidence(terminal,[{'name':'update','conclusion':conclusion,'steps':[]}],'update')
  for conclusion in ('skipped','cancelled','neutral'):
   ignored={**terminal,'conclusion':conclusion}
   self.assertEqual(require_completed_job_evidence(ignored,[],'update'),[])
  with self.assertRaises(ValueError):
   require_completed_job_evidence(terminal,[{'name':'update','conclusion':None,'steps':[{'status':'in_progress'}]}],'update')

 def test_real_13f_recording_failure_is_recovered_from_missing_jobs_same_attempt(self):
  terminal=run(workflow='update-investor-13f.yml')
  old=update_status({},terminal,[])
  self.assertEqual(old['workflows']['update-investor-13f.yml']['recordingStatus'],'not-run')
  jobs=[{'name':'update','conclusion':'failure','steps':[
   {'name':'Collect observations: python -u scripts update-investor-13f.py --output  RUNNER_TEMP investor-observations.json','conclusion':'success'},
   {'name':'Validate collected observations','conclusion':'success'},
   {'name':'Commit validated observations','conclusion':'failure'}]}]
  require_completed_job_evidence(terminal,jobs,'update')
  repaired=update_status(old,terminal,jobs)
  row=repaired['workflows']['update-investor-13f.yml']
  self.assertEqual(row['recordingStatus'],'failure')
  self.assertEqual(row['failures'],[{'job':'update','step':'Commit validated observations'}])
  self.assertIsNone(row['lastCollectionSuccessAt'],'Job evidence cannot invent a source-control clock')
  from automation_recovery import recovery_reason
  import datetime as dt
  self.assertEqual(recovery_reason(row,{'maxAgeHours':48},dt.datetime(2026,10,2,tzinfo=dt.timezone.utc)),'recording-failed')
  self.assertEqual(update_status(repaired,terminal,[]),repaired,'A later empty response must not erase known terminal evidence')
  retained=old['workflows']['update-investor-13f.yml']
  retained['dataFailures']={'exact-manager':{'cause':'Quarter identity conflict','completedAt':'2026-09-30T10:00:00Z'}}
  still=update_status(old,terminal,jobs)['workflows']['update-investor-13f.yml']
  self.assertIn('exact-manager',still['dataFailures'],'Job hydration must not close a financial conflict')
  self.assertNotEqual(still['publicationStatus'],'success')
  newer=update_status(repaired,run(2,'success',workflow='update-investor-13f.yml'),jobs)
  self.assertEqual(update_status(newer,terminal,jobs),newer,'An older attempt cannot replace newer evidence')

class NewCollectorStatusTests(unittest.TestCase):
 def test_named_collection_jobs_are_independent_from_deploy(self):
  for workflow,job in [('update-investor-13f.yml','update'),('update-gold-monthly.yml','update'),('refresh-automated-index-sheets.yml','collect')]:
   row=update_status({},run(1,'success',workflow),[{'name':job,'conclusion':'success'}])['workflows'][workflow]
   self.assertEqual(row['collectionStatus'],'success')
   self.assertIsNone(row['lastCollectionSuccessAt'], 'Le succès du job seul ne renouvelle pas la source')
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
  self.assertEqual(normalize_report({'records':[],'excluded':[{'isin':'new','error':'No source','active':False}]}),{'successes':[],'errors':[],'inactive':[{'id':'new'}]})
 def test_inactive_candidate_retires_only_its_legacy_alert(self):
  workflow='update-qualified-exposures.yml'
  previous=update_status({},run(workflow=workflow),[],[{'errors':[{'id':'candidate','error':'No annual history'},{'id':'active','error':'Missing source'}]}])
  report={'records':[],'excluded':[{'isin':'candidate','active':False,'error':'No annual history'}]}
  current=update_status(previous,run(2,'success',workflow),[],[report])['workflows'][workflow]
  self.assertEqual(set(current['dataFailures']),{'active'})
  self.assertEqual(current['collectionStatus'],'failure')
  self.assertEqual(normalize_report(report)['successes'],[])
 def test_backfill_retires_legacy_candidate_from_same_run(self):
  workflow='update-qualified-exposures.yml'
  event=run(1,'success',workflow)
  old=update_status({},event,[{'name':'refresh','conclusion':'success'}],[{'errors':[{'id':'never-active','error':'No annual NAV'}]}])
  current=update_status(old,event,[{'name':'refresh','conclusion':'success'}],[{'records':[],'excluded':[{'isin':'never-active','error':'No annual NAV'}]}])['workflows'][workflow]
  self.assertEqual(current['dataFailures'],{})
  self.assertEqual(current['status'],'success')
  self.assertEqual(current['collectionStatus'],'success')
  self.assertEqual(current['runId'],event['id'])
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
  path.read_bytes.side_effect=lambda: path.read_text().encode()
  self.assertEqual(read_report(path,'refresh-automated-index-sheets.yml')['errors'][0]['id'],'index-world-composition')

 def test_radar_feed_above_one_megabyte_is_read_from_its_blob(self):
  import base64,json
  from publish_automation_status import read_large_file
  body=base64.b64encode(json.dumps({'schemaVersion':1,'errors':[]}).encode()).decode()
  calls=[]
  def api(path):
   calls.append(path)
   return {'encoding':'none','content':'','sha':'abc'} if path.startswith('/contents/') else {'content':body,'encoding':'base64'}
  self.assertEqual(read_large_file(api,'feed.json','radar-data'),{'schemaVersion':1,'errors':[]})
  self.assertEqual(calls,['/contents/feed.json?ref=radar-data','/git/blobs/abc'])
  calls.clear()
  self.assertEqual(read_large_file(lambda path:calls.append(path) or {'encoding':'base64','content':body,'sha':'abc'},'feed.json','radar-data')['schemaVersion'],1)
  self.assertEqual(len(calls),1)

 def test_waiting_or_in_grace_items_retire_their_previous_alert(self):
  state=update_status({},run(1,workflow='update-scpi.yml'),[],[{'observations':[{'id':'remake-live','name':'Remake','status':'failure','reason':'Missing current official bulletin'}]}])
  self.assertIn('remake-live',state['workflows']['update-scpi.yml']['dataFailures'])
  state=update_status(state,run(2,conclusion='success',workflow='update-scpi.yml'),[],[{'observations':[{'id':'remake-live','name':'Remake','status':'waiting','reason':'next edition expected by 2026-11-14'}]}])
  self.assertNotIn('remake-live',state['workflows']['update-scpi.yml']['dataFailures'])
  state=update_status({},run(1,workflow='update-instrument-metadata.yml'),[],[{'successes':[],'errors':[{'id':'IE1:domicile','error':'not observed'}]}])
  state=update_status(state,run(2,conclusion='success',workflow='update-instrument-metadata.yml'),[],[{'successes':[],'errors':[],'inactive':[{'id':'IE1:domicile'}]}])
  self.assertEqual(state['workflows']['update-instrument-metadata.yml']['dataFailures'],{})

 def test_radar_regression_guard_is_not_a_source_failure(self):
  report={'_collector':'feed','coverage':{'etf':1},'errors':[{'family':'etf','entity':'IE1','reason':'Observation plus ancienne ignorée : Frais annuels.'}]}
  self.assertEqual(normalize_report(report),{'successes':[{'id':'radar:etf'}],'errors':[]})
  report['errors'].append({'family':'etf','reason':'Source illisible'})
  self.assertEqual(normalize_report(report)['errors'][0]['error'],'Source illisible')

 def test_failed_browser_check_keeps_its_annotated_name(self):
  jobs=[{'name':'deploy / browser-checks (0)','conclusion':'failure','steps':[{'name':'Run node scripts/run-browser-checks.mjs 0 4','conclusion':'failure'}],
         'annotations':[{'title':'Échec node scripts/playwright-tools.mjs','message':'strict mode violation'},{'title':'Node.js 20 is deprecated','message':'x'}]}]
  state=update_status({},run(1),jobs,[])
  failure=state['workflows']['update-economic-data.yml']['failures'][0]
  self.assertEqual(failure['checks'],['node scripts/playwright-tools.mjs — strict mode violation'])

if __name__ == '__main__': unittest.main()

class AuditRegressionTests(unittest.TestCase):
 def test_older_run_finishing_later_cannot_restore_obsolete_failure(self):
  latest=run(2,'success',updated_at='2026-10-18T15:20:00Z')
  old=run(1,'failure',updated_at='2026-10-18T15:23:00Z',run_attempt=3)
  state=update_status({},latest,[],[{'successes':[{'id':'exact-share'}]}])
  self.assertEqual(update_status(state,old,[],[{'errors':[{'id':'exact-share','error':'Old parser'}]}]),state)
 def test_continue_on_error_does_not_hide_collection_failure(self):
  jobs=[{'name':'refresh','conclusion':'success','steps':[{'name':'Collect observations: collect','conclusion':'success'}]},
        {'name':'report-failures','conclusion':'failure','steps':[]}]
  row=update_status({},run(workflow='update-market-monthly.yml'),jobs)['workflows']['update-market-monthly.yml']
  self.assertEqual(row['collectionStatus'],'failure')
 def test_per_source_reports_and_independent_company_fields(self):
  report=normalize_report({'series':[],'fxFailed':False,'crossFxFailed':True})
  self.assertEqual(report['errors'][0]['id'],'history:fx:TWD')
  report=normalize_report({'validated':['one'],'failed':[{'isin':'two','reason':'PDF missing'}]})
  self.assertEqual(report['errors'][0]['id'],'listing:two')
  report=normalize_report({'_collector':'universe','companies':{'TER':{'quote':'updated','forecast':'stale','primarySource':'403','accounts':'updated'}}})
  self.assertEqual([x['id'] for x in report['errors']],['universe:TER:forecast'])
 def test_publication_requires_built_files_or_complete_snapshot_ancestry(self):
  from publish_automation_status import reconcile_publication
  state={'workflows':{'monthly':{'publicationStatus':'failure','dataFailures':{'fx':'timeout'},'publicationReceipt':{'schemaVersion':1,'commit':'a'*40,'files':{'src/data/monthly.json':'d'*40}}}}}
  build={'sha':'b'*40,'dataSha':'a'*40,'builtAt':'2026-10-18T21:00:00Z'}
  missing={'schemaVersion':1,'files':{}}
  self.assertEqual(reconcile_publication(state,build,missing,lambda *_:'ahead'),state,'Fallback may exclude files')
  exact={'schemaVersion':1,'files':{'src/data/monthly.json':'d'*40}}
  row=reconcile_publication(state,build,exact,lambda *_:'behind')['workflows']['monthly']
  self.assertEqual(row['publicationStatus'],'success');self.assertEqual(row['dataFailures'],{'fx':'timeout'})
  del build['dataSha']
  self.assertEqual(reconcile_publication(state,build,missing,lambda *_:'ahead')['workflows']['monthly']['publicationStatus'],'failure')

class LegacyPublicationProof(unittest.TestCase):
 def test_uses_recorded_build_checkout_and_rejects_missing_or_ambiguous_proof(self):
  from publish_automation_status import checkout_snapshot
  sha='f7326440fd877d65ebd24f51197a6f3f46a6e44c'
  log=f'2026-10-18T16:29:14Z [command]/usr/bin/git log -1 --format=%H\n2026-10-18T16:29:14Z {sha}\n'
  self.assertEqual(checkout_snapshot(log),sha)
  self.assertIsNone(checkout_snapshot('head_sha='+sha))
  self.assertIsNone(checkout_snapshot(log+log))


class LargeStatusFile(unittest.TestCase):
 def test_large_status_reads_the_exact_observed_sha_without_refetching_the_branch(self):
  import base64,json
  from publish_automation_status import decode_json_file
  state={'schemaVersion':1,'workflows':{},'padding':'x'*1_100_000}
  encoded=base64.b64encode(json.dumps(state).encode()).decode()
  calls=[]
  def api(path):
   calls.append(path)
   self.assertEqual(path,'/git/blobs/observed-status-sha')
   return {'content':encoded,'encoding':'base64'}
  file={'sha':'observed-status-sha','content':'','encoding':'none'}
  self.assertEqual(decode_json_file(api,file),state)
  self.assertEqual(calls,['/git/blobs/observed-status-sha'])
  self.assertEqual(file['sha'],'observed-status-sha')


class ArtifactDownloadTests(unittest.TestCase):
 def test_reruns_download_only_latest_immutable_id(self):
  from publish_automation_status import download_status_artifact
  body=io.BytesIO()
  with zipfile.ZipFile(body,'w') as archive:archive.writestr('data-publication-receipt.json',json.dumps({'schemaVersion':1,'files':{'source':'blob'}}))
  runner=Mock(return_value=Mock(stdout=body.getvalue()))
  with tempfile.TemporaryDirectory() as directory:
   self.assertTrue(download_status_artifact('owner/repo',[{'id':1,'name':'receipt'},{'id':3,'name':'receipt','expired':True},{'id':2,'name':'receipt'}],'receipt',directory,runner=runner))
   self.assertEqual(json.loads((pathlib.Path(directory)/'data-publication-receipt.json').read_text())['files'],{'source':'blob'})
  self.assertEqual(runner.call_args.args[0],['gh','api','/repos/owner/repo/actions/artifacts/2/zip'])

 def test_transient_download_retries_exact_id_and_never_invents_evidence(self):
  from publish_automation_status import download_status_artifact
  runner=Mock(side_effect=subprocess.CalledProcessError(1,['gh']))
  with tempfile.TemporaryDirectory() as directory:
   with self.assertRaises(subprocess.CalledProcessError):
    download_status_artifact('owner/repo',[{'id':4,'name':'receipt'}],'receipt',directory,runner=runner,sleep=lambda _:None)
   self.assertEqual(list(pathlib.Path(directory).iterdir()),[])
  self.assertEqual(runner.call_count,2)

 def test_unavailable_and_unsafe_archives_never_create_a_receipt(self):
  from publish_automation_status import download_status_artifact
  runner=Mock()
  with tempfile.TemporaryDirectory() as directory:
   self.assertFalse(download_status_artifact('owner/repo',[],'receipt',directory,runner=runner))
   runner.assert_not_called()
   body=io.BytesIO()
   with zipfile.ZipFile(body,'w') as archive:archive.writestr('../receipt.json','{}')
   runner.return_value=Mock(stdout=body.getvalue())
   with self.assertRaises(ValueError):download_status_artifact('owner/repo',[{'id':4,'name':'receipt'}],'receipt',directory,runner=runner)
   self.assertEqual(list(pathlib.Path(directory).iterdir()),[])
