import copy
import unittest
from automation_legacy_phases import CONTRACTS,qualify_legacy_phases


class LegacyPhases(unittest.TestCase):
    def fixture(self):
        sha=next(iter(CONTRACTS));c=CONTRACTS[sha]
        run={'id':12,'run_attempt':1,'head_branch':'master','path':'.github/workflows/'+c['workflow'],'updated_at':'2026-10-08T14:00:00Z'}
        row={'runId':12,'attempt':1,'collectionStatus':'success','validationStatus':'unknown','recordingStatus':'not-run',
             'checkedAt':'2026-10-05','dataFailures':{'unresolved':{'cause':'Still open'}}}
        state={'workflows':{c['workflow']:row}}
        steps=[{'name':name,'conclusion':'success','completed_at':'2026-10-08T13:59:00Z'}for key in ['collectionSteps','validationSteps','recordingSteps']for name in c[key]]
        jobs=[{'id':123,'name':c['job'],'steps':steps}]
        return sha,c,run,state,jobs
    def test_exact_source_code_and_steps_qualify_only_phase_metadata(self):
        sha,c,run,state,jobs=self.fixture();before=copy.deepcopy(state)
        after=qualify_legacy_phases(state,run,jobs,sha,'2026-10-28T12:00:00Z')['workflows'][c['workflow']]
        self.assertEqual(state,before);self.assertEqual(after['recordingStatus'],'success');self.assertEqual(after['validationStatus'],'success')
        self.assertEqual(after['checkedAt'],'2026-10-05');self.assertEqual(after['dataFailures'],before['workflows'][c['workflow']]['dataFailures'])
        self.assertEqual(after['legacyPhaseEvidence']['phases']['validation']['completedAt'],'2026-10-08T13:59:00Z')
    def test_other_code_missing_skipped_or_failed_checks_do_not_qualify(self):
        sha,c,run,state,jobs=self.fixture()
        self.assertEqual(qualify_legacy_phases(state,run,jobs,'unknown','2026-10-28'),state)
        for conclusion in ['failure','skipped',None]:
            broken=copy.deepcopy(jobs);broken[0]['steps'][2]['conclusion']=conclusion
            after=qualify_legacy_phases(state,run,broken,sha,'2026-10-28')['workflows'][c['workflow']]
            self.assertEqual(after['validationStatus'],'unknown')
        self.assertEqual(qualify_legacy_phases(state,{**run,'id':99},jobs,sha,'2026-10-28'),state)
    def test_existing_failure_is_not_overridden(self):
        sha,c,run,state,jobs=self.fixture();state['workflows'][c['workflow']]['validationStatus']='failure'
        after=qualify_legacy_phases(state,run,jobs,sha,'2026-10-28')['workflows'][c['workflow']]
        self.assertEqual(after['validationStatus'],'failure')

if __name__=='__main__':unittest.main()
