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


class WorkflowIntegration(unittest.TestCase):
    def observed(self,native,p,workflow='update-practical-sheets.yml',name='practical-observation.json'):
        with tempfile.TemporaryDirectory()as folder:
            path=Path(folder)/name;path.write_text(json.dumps(finished(native,p)));return read_report(path,workflow)
    def test_green_job_with_omission_is_visible_to_monitor(self):
        from test_automation_product import event,jobs,CTX,NOW
        from publish_automation_status import update_status,REGISTRY
        from automation_monitoring import evaluate_monitoring
        w='update-practical-sheets.yml';p=plan(('practical:A','practical:B'))
        r=self.observed({'sources':{'A':{'status':'ok'}},'changed':[],'failed':[]},p)
        state=update_status({},event(w),jobs(w),[r]);out=evaluate_monitoring(state,CTX,{w:REGISTRY[w]},NOW,{'errors':[]})
        self.assertTrue(any('Résultat attendu absent'in row['cause']for row in out['active'].values()))
        self.assertIn('practical:B',state['workflows'][w]['dataFailures'])
    def test_partial_retry_leaves_other_incident_open(self):
        from test_automation_product import event,jobs
        from publish_automation_status import update_status
        w='update-practical-sheets.yml';state=update_status({},event(w),jobs(w),[{'successes':[],'errors':[{'id':'practical:B','error':'supplier blocked'}]}])
        p=plan(('practical:A','practical:B'),selected={'practical:A'})
        r=self.observed({'sources':{'A':{'status':'ok','lastSuccessfulCheckAt':'2026-10-25'}},'failed':[],'changed':[]},p)
        run=event(w,101);run['updated_at']='2026-10-25T12:00:00Z';new=update_status(state,run,jobs(w),[r])
        self.assertIn('practical:B',new['workflows'][w]['dataFailures'])
    def test_qualified_current_full_scope_archives_old_limitation_not_old_attempt(self):
        from test_automation_product import event,jobs
        from publish_automation_status import update_status
        w='update-practical-sheets.yml';old={'workflows':{w:{'reportQualifications':{'practical-observation.json':{'cause':'Historical scope unknown','evidence':{'sha256':'old'},'runUrl':'old'}}}}}
        r=self.observed({'sources':{'A':{'status':'ok'}},'failed':[],'changed':[]},plan(('practical:A',)))
        new=update_status(old,event(w),jobs(w),[r])['workflows'][w]
        self.assertFalse(new['reportQualifications']);self.assertTrue(new['reportQualificationHistory'][0]['historicalLimitationPreserved'])
        self.assertEqual(new['reportQualificationHistory'][0]['evidence']['sha256'],'old')
    def test_validation_cannot_renew_source_evidence_or_fix_publication(self):
        from test_automation_product import event,jobs
        from publish_automation_status import update_status
        w='refresh-automated-index-sheets.yml';identifier='qualification:world';old={'workflows':{w:{'sourceChecks':{'index-world-composition':{'checkedAt':'2026-09-01'}},'publicationStatus':'failure'}}}
        # A local control succeeds now, based on September source data.
        report={'successes':[{'id':identifier,'phase':'qualification','sourceAttempted':False,'checkedAt':'2026-09-01','validatedAt':'2026-10-25'}],'errors':[]}
        new=update_status(old,event(w),jobs(w),[report])['workflows'][w]
        self.assertNotIn(identifier,new['sourceChecks']);self.assertIn(identifier,new['validationChecks']);self.assertEqual(new['sourceChecks']['index-world-composition']['checkedAt'],'2026-09-01')
    def test_input_scope_cannot_be_shrunk_after_results(self):
        r=finished({'successes':[{'id':'A'},{'id':'B'}]},plan())['resultContract'];r['scope']['expectedIds']=['A'];r['outcomes']=r['outcomes'][:1]
        self.assertRaisesRegex(ValueError,'modified',c.validate_contract,r)
    def test_scope_request_cannot_be_extended_after_collection(self):
        r=finished({'successes':[{'id':'A'}]},plan(selected={'A'}))['resultContract'];r['scope']['requestedIds']=['A','B'];self.assertRaises(ValueError,c.validate_contract,r)
    def test_cached_anniversary_is_not_a_source_success(self):
        import refresh_anniversary_indices as m
        config={'id':'example'};now=dt.datetime(2026,10,25,tzinfo=dt.timezone.utc)
        with patch.object(m,'configurations',return_value=[config]):
            _,_,report=m.refresh({'example':{'id':'example','periodEnd':'2026-09'}},{},now,collect=lambda *_:self.fail('Cache should not fetch'))
        self.assertFalse(report['successes']);self.assertEqual(report['contractSkipped'][0]['status'],'cached')



class ProducerEntryPoints(unittest.TestCase):
    def test_every_declared_python_entry_point_keeps_pre_execution_wrapper(self):
        import ast
        names=['collect_etf_pilot','collect_amundi_etf','collect_ssga_etf','refresh_additional_etf','collect_exposure_expansion','refresh_index_sources','refresh_index_companies','collect_practical_sheets','collect_insurance','collect_scpi','collect_presentation_actors','collect_regulatory_data','collect_broker_tariffs','collect_economic_data','update_inflation','update_bitcoin_monthly','collect_lifestrategy','collect_qualified_exposures','collect_dca_equities','collect_dca_complete_holdings','collect_vanguard_sleeves','collect_exposure_sleeves','refresh_anniversary_indices','refresh_anniversary_levels','collect_instrument_metadata','update-investor-13f','refresh_non_bond_sources','collect_presentation_performance','qualify_monthly_candidates']
        for name in names:
            with self.subTest(producer=name):
                source=(plans.ROOT/'scripts'/f'{name}.py').read_text();tree=ast.parse(source)
                guard=next(n for n in tree.body if isinstance(n,ast.If)and '__name__'in ast.get_source_segment(source,n.test))
                calls=[n for n in ast.walk(guard)if isinstance(n,ast.Call)and isinstance(n.func,ast.Attribute)and n.func.attr=='run']
                self.assertEqual(len(calls),1);self.assertEqual(calls[0].args[0].value,name)
                if name!='qualify_monthly_candidates':
                    with patch('urllib.request.urlopen',side_effect=AssertionError('Planning must not query a source')):
                        p=plans.build_plan(name,[])
                    self.assertEqual(len({r['id']for r in p['items']}),len(p['items']));self.assertTrue(all(r.get('fields')for r in p['items']))
    def test_targeted_metadata_accepts_existing_comma_separated_cli(self):
        sources=plans.read('scripts/instrument-metadata-sources.json')['instruments'];ids=[r['isin']for r in sources[:2]]
        p=plans.build_plan('collect_instrument_metadata',['--only',','.join(ids)])
        self.assertEqual({r['instrument']for r in p['items']if r['selected']},set(ids))

if __name__=='__main__':unittest.main()
