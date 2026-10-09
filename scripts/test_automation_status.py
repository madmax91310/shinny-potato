import unittest
from unittest.mock import Mock
from publish_automation_status import update_status, read_report

def run(id=1,conclusion='failure',workflow='update-economic-data.yml',**kwargs):
 return {'id':id,'path':'.github/workflows/'+workflow,'head_branch':'master','event':'schedule','status':'completed','conclusion':conclusion,'updated_at':f'2026-10-{id:02d}T10:00:00Z','html_url':f'https://github.com/test/repo/actions/runs/{id}',**kwargs}
class StatusTests(unittest.TestCase):
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
if __name__=='__main__':unittest.main()
