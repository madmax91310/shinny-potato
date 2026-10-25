import copy
import datetime as dt
import json
from pathlib import Path
import hashlib
import tempfile
import unittest
from unittest.mock import patch
import producer_report_contract as c
import producer_report_plans as plans
from publish_automation_status import read_report


def plan(ids=('A','B'),selected=None):
    p={'producer':'test','reportStem':'test','mode':'full','declaredAt':'2026-10-25T01:00:00+00:00','nonce':'test','sha256':'hash',
            'items':[{'id':i,'instrument':i,'fields':['field'],'selected':selected is None or i in selected, 'reason':'Outside targeted retry'}for i in ids]}
    p['sha256']=hashlib.sha256(json.dumps({k:v for k,v in p.items()if k!='sha256'},sort_keys=True).encode()).hexdigest();return p


def finished(native,p,**kwargs):
    p=copy.deepcopy(p);p['sha256']=hashlib.sha256(json.dumps({k:v for k,v in p.items()if k!='sha256'},sort_keys=True).encode()).hexdigest()
    return c.finish(native,p,**kwargs)

class Results(unittest.TestCase):
    def test_omitted_individual_becomes_failure_even_when_job_successful(self):
        result=c.normalize_contract(finished({'successes':[{'id':'A'}],'errors':[]},plan())['resultContract'])
        self.assertEqual([r['id']for r in result['successes']],['A'])
        self.assertEqual(result['errors'][0]['id'],'B')
        self.assertEqual(result['errors'][0]['kind'],'omission')
        self.assertFalse(result['errors'][0]['sourceAttempted'])
    def test_expected_plan_not_derived_from_result(self):
        p=plan();before=copy.deepcopy(p);finished({'successes':[{'id':'A'}]},p)
        self.assertEqual(p,before)
    def test_targeted_retry_does_not_certify_unselected_B(self):
        result=c.normalize_contract(finished({'successes':[{'id':'A'}]},plan(selected={'A'}))['resultContract'])
        self.assertEqual([r['id']for r in result['successes']],['A']);self.assertFalse(result['errors']);self.assertFalse(result['inactive'])
    def test_empty_scope_requires_reason(self):
        p=plan(());self.assertRaisesRegex(ValueError,'Empty',finished,{'successes':[]},p)
        p['emptyReason']='No configured candidates';self.assertEqual(finished({'successes':[]},p)['resultContract']['outcomes'],[])
    def test_outside_scope_is_reported_and_not_a_success(self):
        r=c.normalize_contract(finished({'successes':[{'id':'A'},{'id':'B'},{'id':'OTHER'}]},plan())['resultContract'])
        self.assertEqual(len(r['successes']),2);self.assertIn('hors périmètre',r['errors'][0]['error'])
    def test_duplicate_results_are_explicit(self):
        r=finished({'successes':[{'id':'A'},{'id':'A'},{'id':'B'}]},plan())['resultContract'];self.assertIn('dupliqué',r['issues'][0])
    def test_partial_failure_preserved(self):
        r=c.normalize_contract(finished({'successes':[{'id':'A'}],'errors':[{'id':'B','error':'403 supplier'}]},plan())['resultContract']);self.assertEqual(r['errors'][0]['error'],'403 supplier')
    def test_interruption_has_one_omission_per_expected_element(self):
        r=finished({},plan(),completed=False)['resultContract'];self.assertEqual(len(r['outcomes']),2);self.assertTrue(all(o['kind']=='omission'for o in r['outcomes']))
    def test_cache_does_not_become_control(self):
        p=plan();p['cacheRequested']=True
        r=c.normalize_contract(finished({'successes':[{'id':'A'},{'id':'B'}]},p)['resultContract']);self.assertFalse(r['successes']);self.assertFalse(r['inactive'])
    def test_unchanged_really_verified_keeps_source_date(self):
        native={'successes':[{'id':'A'}], 'outcomes':[{'id':'A','status':'unchanged-verified','sourceAttempted':True,'checkedAt':'2026-10-25T01:00:00Z','asOf':'2026-09-30'}]}
        r=finished(native,plan(('A',)))['resultContract']['outcomes'][0];self.assertEqual(r['status'],'unchanged-verified');self.assertEqual(r['asOf'],'2026-09-30')
    def test_contract_cannot_drop_an_expected_result(self):
        r=finished({'successes':[{'id':'A'},{'id':'B'}]},plan())['resultContract'];r['outcomes'].pop();self.assertRaises(ValueError,c.validate_contract,r)
    def test_contract_cannot_duplicate_or_add_outside_result(self):
        r=finished({'successes':[{'id':'A'},{'id':'B'}]},plan())['resultContract'];r['outcomes'].append(r['outcomes'][0]);self.assertRaises(ValueError,c.validate_contract,r)
    def test_retained_status_is_not_source_check(self):
        p=plan(('history:A',));r=finished({'series':[{'id':'A','status':'cached'}]},p)['resultContract'];self.assertEqual(r['outcomes'][0]['status'],'cached');self.assertFalse(c.normalize_contract(r)['successes'])
    def test_new_block_is_read_through_existing_monitoring_reader(self):
        p=plan(('practical:test',));p['reportStem']='practical-observation';native={'sources':{'test':{'status':'ok'}},'failed':[],'changed':[]}
        r=finished(native,p)
        with tempfile.TemporaryDirectory()as folder:
            path=Path(folder)/'practical-observation.json';path.write_text(json.dumps(r));result=read_report(path,'update-practical-sheets.yml')
        self.assertTrue(result['_reportEvidence']['scopeExplicit']);self.assertNotIn('_scopeWarning',result)
    def test_native_payload_untouched(self):
        native={'successes':[{'id':'A'}],'errors':[],'financial':{'value':1,'asOf':'2020-01-01'}};before=copy.deepcopy(native);r=finished(native,plan(('A',)));self.assertEqual(native,before);self.assertEqual(r['financial'],before['financial'])
    def test_start_report_survives_exception_before_native_output(self):
        with tempfile.TemporaryDirectory()as folder:
            path=Path(folder)/'report.json'
            def interrupted():raise RuntimeError('network unavailable')
            with patch.object(c.sys,'argv',['test','--output',str(path)]),patch.object(plans,'build_plan',return_value=plan()):
                self.assertRaisesRegex(RuntimeError,'network',c.run,'test',interrupted)
            r=json.loads(path.read_text());self.assertEqual(len(r['resultContract']['outcomes']),2);self.assertTrue(all(o['kind']=='omission'for o in r['resultContract']['outcomes']))

if __name__=='__main__':unittest.main()
