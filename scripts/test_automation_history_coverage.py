import copy
import unittest
from automation_history_coverage import recover_skipped_history_gaps


class HistoryCoverage(unittest.TestCase):
    def run_row(self,id,conclusion='skipped'):
        return {'id':id,'path':'.github/workflows/x.yml','head_branch':'master','status':'completed',
                'event':'workflow_run','conclusion':conclusion,'created_at':'2026-10-25T13:00:00Z','updated_at':'2026-10-25T13:01:00Z'}
    def fixture(self):
        return {'workflows':{'independent':{'checkedAt':'2026-10-25'}},'observerErrors':{'history-window:x.yml':{
            'cause':'Dernier run observé : 1','anchorRunId':1,'throughAt':'2026-10-25T14:00:00Z'}}}
    def api(self,rows,total=None):
        def read(path):
            if path=='/actions/runs/1':return self.run_row(1,'failure')
            page=int(path.rsplit('page=',1)[1]);return {'total_count':len(rows)if total is None else total,'workflow_runs':rows[(page-1)*100:page*100]}
        return read
    def test_complete_skipped_interval_is_a_proof_not_a_later_green_run(self):
        state=self.fixture();original=copy.deepcopy(state);rows=[self.run_row(1,'failure')]+[self.run_row(i)for i in range(2,152)]
        done=recover_skipped_history_gaps(state,self.api(rows),'2026-10-28T12:00:00Z')
        self.assertEqual(state,original);self.assertNotIn('history-window:x.yml',done['observerErrors'])
        proof=done['observerChecks']['history-window:x.yml'];self.assertEqual(proof['totalRuns'],151)
        self.assertEqual(len(proof['ignoredRunIds']),150);self.assertEqual(len(proof['enumerationSha256']),2)
        self.assertEqual(done['workflows'],state['workflows'])
    def test_real_success_failure_or_unknown_in_gap_needs_a_real_replay(self):
        for conclusion in ['success','failure',None,'action_required','cancelled','neutral']:
            rows=[self.run_row(1,'failure'),self.run_row(2,conclusion)]
            pending=recover_skipped_history_gaps(self.fixture(),self.api(rows),'2026-10-28T12:00:00Z')
            self.assertEqual(pending['observerErrors']['history-window:x.yml']['unreviewedRunIds'],[2])
            self.assertFalse(pending.get('observerChecks'))
    def test_partial_listing_missing_anchor_and_network_error_keep_gap(self):
        for api in [self.api([self.run_row(2)]),self.api([self.run_row(1)],total=200),lambda path:(_ for _ in ()).throw(OSError('network'))]:
            pending=recover_skipped_history_gaps(self.fixture(),api,'2026-10-28T12:00:00Z')
            self.assertIn('history-window:x.yml',pending['observerErrors']);self.assertFalse(pending.get('observerChecks'))

if __name__=='__main__':unittest.main()
