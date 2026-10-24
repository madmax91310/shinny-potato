"""Use the actual producer serializer and monitor: cached qualification cannot clear an issuer failure."""
import json,pathlib,subprocess,unittest
from publish_automation_status import update_status,normalize_report
from test_automation_status import run
ROOT=pathlib.Path(__file__).resolve().parents[1]
class IndexReportOwnership(unittest.TestCase):
 def report(self,failed=False):
  code="import{indexQualificationReport}from'./scripts/index-qualification-report.mjs';const output={cac40:{available:true,checkedAt:'2026-10-01',asOf:'2026-09-30',"+('retained:true,'if failed else'')+"},optional:{available:false,reason:'Top 10 non admis'}};console.log(JSON.stringify(indexQualificationReport(output,"+json.dumps([{'id':'cac40','error':'Composition incohérente'}]if failed else[])+",'2026-10-02T10:00:00Z')))"
  return json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True))
 def test_local_qualification_does_not_recover_a_failed_network_observation(self):
  workflow='refresh-automated-index-sheets.yml'
  state=update_status({},run(workflow=workflow),[],[{'errors':[{'id':'cac40','error':'Official source offline'}]}])
  report=self.report();updated=update_status(state,run(2,'success',workflow=workflow),[],[report])
  self.assertIn('cac40',updated['workflows'][workflow]['dataFailures']);self.assertFalse(report['sourceAttempted']);self.assertEqual(report['scope']['networkRequestedIds'],[])
  self.assertEqual(report['successes'][0]['id'],'qualification:cac40');self.assertEqual(report['successes'][0]['checkedAt'],'2026-10-01');self.assertEqual(report['outcomes'][1]['status'],'not-applicable')
 def test_retention_after_qualification_failure_is_never_both_success_and_error(self):
  report=self.report(True);self.assertEqual(report['successes'],[]);self.assertEqual(report['errors'][0]['id'],'qualification:cac40');self.assertEqual(normalize_report(report)['errors'][0]['sourceId'],'cac40')
if __name__=='__main__':unittest.main()
