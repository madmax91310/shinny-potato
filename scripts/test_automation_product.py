"""Real readers and lifecycle exercised offline; no production writes or source mocks admitted as data."""
import copy
import base64
import hashlib
import gzip
import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from publish_automation_status import (REGISTRY, REPORT_CONTRACTS, artifact_reports, normalize_report,
    read_report_safely, update_status, reconcile_publication, attempt_artifacts, merge_proof_retry, radar_resolution_evidence, qualified_receipt, review_projection_evidence)
from automation_monitoring import evaluate_monitoring, restore_history

NOW='2026-10-24T12:00:00Z'
CTX={'schemaVersion':1,'alerts':[],'entities':[],'historyAlerts':[],'fieldAlerts':[]}

def event(workflow, number=100, conclusion='success'):
    return {'id':number,'path':'.github/workflows/'+workflow,'head_branch':'master','event':'workflow_dispatch',
            'status':'completed','conclusion':conclusion,'updated_at':NOW,'html_url':f'https://github.com/test/repo/actions/runs/{number}'}

def jobs(workflow, failure=None):
    config=REGISTRY[workflow]
    names=list(dict.fromkeys([*config.get('collectionSteps',[]),*config.get('validationSteps',[]),'Validate collected observations','Commit validated observations']))
    return [{'name':config['collectionJob'],'conclusion':'failure' if failure else 'success','steps':[
        {'name':n,'conclusion':'failure' if failure==n else 'success'} for n in names]}]

class ProductContracts(unittest.TestCase):
    def test_every_registered_producer_and_fault_class(self):
        # This matrix invokes the actual reducer for EVERY producer, not a copy of its implementation.
        for workflow in REGISTRY:
            for cause in ['réseau 403','identité erronée','réponse vide','format modifié','champ absent',
                          'valeur invalide','valeur suspecte','sources contradictoires','preuve absente','donnée périmée']:
                with self.subTest(workflow=workflow,cause=cause):
                    old=update_status({},event(workflow),jobs(workflow),[{'successes':[], 'errors':[{'id':'owned:field','error':cause,'asOf':'2026-09','lastSuccessAt':'2026-10-20'}]}])
                    frozen=copy.deepcopy(old)
                    partial=update_status(old,event(workflow,101),jobs(workflow),[{'successes':[{'id':'other:field'}],'errors':[]}])
                    self.assertIn('owned:field',partial['workflows'][workflow]['dataFailures'])
                    self.assertEqual(old,frozen)
                    self.assertEqual(partial['workflows'][workflow]['dataFailures']['owned:field']['asOf'],'2026-09')
                    clean=update_status(partial,event(workflow,102),jobs(workflow),[{'successes':[{'id':'owned:field'}],'errors':[]}])
                    self.assertNotIn('owned:field',clean['workflows'][workflow]['dataFailures'])
    def test_pipeline_classes_for_every_applicable_producer(self):
        for workflow, config in REGISTRY.items():
            for fault in ['validation', 'generation', 'recording', 'publication', 'unobserved', 'no-change', 'monitor-outage', 'recovery']:
                with self.subTest(workflow=workflow,fault=fault):
                    if fault in ('generation','recording','publication') and (config.get('validationOnly') or config.get('publishes') is False):
                        continue  # Explicitly non-applicable: this control does not publish data.
                    if fault=='unobserved':
                        m=evaluate_monitoring({},CTX,{workflow:config},NOW,{'errors':[]})
                        self.assertIn('unobserved:'+workflow,m['active']);continue
                    if fault=='monitor-outage':
                        m=evaluate_monitoring({'observerErrors':{workflow:{'cause':'network'}}},CTX,{workflow:config},NOW,{'errors':[]})
                        self.assertIn('monitor:'+workflow,m['active']);continue
                    if fault=='recovery':
                        old=update_status({},event(workflow),jobs(workflow),[{'errors':[{'id':'x','error':'network'}]}])
                        new=update_status(old,event(workflow,101),jobs(workflow),[{'successes':[{'id':'x'}]}])
                        self.assertNotIn('x',new['workflows'][workflow]['dataFailures']);continue
                    if fault=='no-change':
                        old=update_status({},event(workflow),jobs(workflow),[{'errors':[{'id':'x','error':'network'}]}])
                        new=update_status(old,event(workflow,101),jobs(workflow),[{'successes':[],'errors':[]}])
                        self.assertIn('x',new['workflows'][workflow]['dataFailures']);continue
                    if fault=='validation':
                        step=(config.get('validationSteps')or['Validate collected observations'])[0]
                        js=jobs(workflow,step)
                        row=update_status({},event(workflow,conclusion='failure'),js)['workflows'][workflow]
                        self.assertEqual(row['validationStatus'],'failure');continue
                    if fault=='recording' and not config.get('controlOnly'):
                        row=update_status({},event(workflow,conclusion='failure'),jobs(workflow,'Commit validated observations'))['workflows'][workflow]
                        self.assertEqual(row['recordingStatus'],'failure');continue
                    js=jobs(workflow)+[{'name':'deploy / build'if fault=='generation'else'deploy / publish','conclusion':'failure','steps':[{'name':'Generate consumer projections'if fault=='generation'else'Verify actual public data','conclusion':'failure'}]}]
                    row=update_status({},event(workflow,conclusion='failure'),js)['workflows'][workflow]
                    self.assertEqual(row['publicationStatus'],'failure')

    def test_bad_readers_are_isolated_and_never_report_success(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'report.json'
            for payload in [{},[],None,{'whatever':1},{'schemaVersion':99,'successes':[],'errors':[]},
                            {'schemaVersion':True,'successes':[]}, {'checkedAt':'wrong','successes':[]},
                            {'checkedAt':'2099-01-01','successes':[]},{'series':[None]}, {'series':[{'status':'validated'}]},
                            {'observations':[{}]}, {'shares':[None]}, {'successes':None,'errors':[]}]:
                with self.subTest(payload=payload):
                    path.write_text(json.dumps(payload));bad=read_report_safely(path,'update-scpi.yml')
                    self.assertTrue(bad['errors']);self.assertFalse(bad['successes'])
                    state=update_status({},event('update-scpi.yml'),jobs('update-scpi.yml'),[bad,{'successes':[{'id':'independent'}],'errors':[]}])
                    self.assertIn('report-read:report:run:100:attempt:1',state['workflows']['update-scpi.yml']['proofFailures'])
    def test_artifact_absence_expiry_and_step_not_attempted(self):
        for workflow,contract in REPORT_CONTRACTS.items():
            with self.subTest(workflow=workflow),tempfile.TemporaryDirectory() as directory:
                actual=jobs(workflow)
                # Use contract step exactly, including auxiliary qualification reports.
                actual[0]['steps'] += [{'name':s,'conclusion':'success'} for r in contract['reports'] for s in r['steps']]
                missing=artifact_reports('test/repo',workflow,actual,[],directory)
                self.assertTrue(missing[0]['errors'])
                expired=artifact_reports('test/repo',workflow,actual,[{'name':contract['artifact'],'expired':True}],directory)
                self.assertTrue(expired[0]['errors'])
                self.assertEqual(artifact_reports('test/repo',workflow,[{'name':'setup','conclusion':'failure','steps':[]}],[],directory),[])
                def download(*args):
                    for r in contract['reports']:
                        fixtures=json.loads(Path('scripts/fixtures/automation-reports/real-producer-contracts.json').read_text())
                        fixture=next(f for f in fixtures if f['workflow']==workflow and f['file']==r['name'])
                        (Path(directory)/r['name']).write_text(json.dumps(fixture['input']))
                recovered=artifact_reports('test/repo',workflow,actual,[{'name':contract['artifact']}],directory,download)
                self.assertFalse(any(e['id'].startswith(('report-read:','artifact-read:')) for r in recovered for e in r.get('errors',[])))
    def test_real_producer_schemas_and_normalization_parity(self):
        fixtures=json.loads(Path('scripts/fixtures/automation-reports/real-producer-contracts.json').read_text())
        for f in fixtures:
            with self.subTest(workflow=f['workflow'],file=f['file']):
                actual=normalize_report(f['input'])
                self.assertEqual({k:sorted(actual.get(k,[]),key=lambda r:r['id'])for k in ['successes','errors','inactive']}, {k:sorted(v,key=lambda r:r['id'])for k,v in f['expected'].items()})
        self.assertEqual({f['workflow']for f in fixtures},set(REPORT_CONTRACTS))

    def test_targeted_results_contract(self):
        self.assertEqual(normalize_report({'series':[{'id':'not-tried','status':'failed'}],'attemptedIds':[]})['errors'],[])
        with self.assertRaises(ValueError):normalize_report({'series':[],'attemptedIds':['absent']})
        with self.assertRaises(ValueError):normalize_report({'series':[{'id':'x','status':'strange'}]})
    def test_shared_scope_matches_attempted_results_and_preserves_source_clock(self):
        payload={'scope':{'expectedIds':['x'],'requestedIds':['x']},'successes':[{'id':'x'}],'errors':[],
                 'outcomes':[{'id':'x','status':'unchanged-verified','checkedAt':'2026-10-24'}]}
        self.assertEqual(normalize_report(payload)['successes'],[{'id':'x'}])
        with self.assertRaises(ValueError):normalize_report({**payload,'successes':[]})
        with self.assertRaises(ValueError):normalize_report({**payload,'outcomes':[{'id':'x','status':'failed'}]})
        with self.assertRaises(ValueError):normalize_report({**payload,'scope':{'expectedIds':['x','missing'],'requestedIds':['x']}})
        skipped={**payload,'outcomes':[{'id':'x','status':'not-attempted'}]}
        self.assertFalse(normalize_report(skipped)['successes'])
        w='update-gold-monthly.yml'
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'gold-observation.json';path.write_text(json.dumps({'schemaVersion':1,**payload}))
            report=read_report_safely(path,w)
        old=update_status({},event(w),jobs(w),[{'errors':[{'id':'x','error':'Network'}]}])
        old['monitoring']=evaluate_monitoring(old,CTX,{w:REGISTRY[w]},NOW,{'errors':[]})
        run={**event(w,101),'updated_at':'2026-10-24T13:00:00Z'}
        new=update_status(old,run,jobs(w),[report])
        row=new['workflows'][w]
        self.assertEqual(row['lastCollectionSuccessAt'],'2026-10-24')
        self.assertFalse(row['dataFailures']);self.assertFalse(row['reportQualifications'])
        old['workflows'][w]['reportQualifications']={'gold-observation.json':{'cause':'Ancien périmètre non démontré','evidence':{'sha256':'older-report'}}}
        self.assertIn('gold-observation.json',update_status(old,run,jobs(w),[report])['workflows'][w]['reportQualifications'])
        monitor=evaluate_monitoring(new,CTX,{w:REGISTRY[w]},'2026-10-24T14:00:00Z',{'errors':[]})
        self.assertNotIn('collection:'+w+':x',monitor['active'])
    def test_cache_does_not_renew_source_success(self):
        workflow='update-scpi.yml';old=update_status({},event(workflow),jobs(workflow),[{'successes':[{'id':'x'}],'errors':[]}])
        old['workflows'][workflow]['lastCollectionSuccessAt']='2026-10-20'
        now=update_status(old,event(workflow,101),jobs(workflow),[{'companies':{'x':{'quote':'cached-with-original-observation-date'}}}])
        self.assertEqual(now['workflows'][workflow]['lastCollectionSuccessAt'],'2026-10-20')
        legacy={'workflows':{workflow:{'monitorVersion':2,'lastCollectionSuccessAt':'2026-10-24T11:00:00Z'}}}
        upgraded=update_status(legacy,event(workflow),jobs(workflow),[{'successes':[],'errors':[]}])['workflows'][workflow]
        self.assertIsNone(upgraded['lastCollectionSuccessAt'])
        self.assertEqual(upgraded['legacyLastCollectionSuccessAt'],'2026-10-24T11:00:00Z')
    def test_cache_and_unknown_status_in_legacy_families(self):
        for family, identity in [('shares',{'isin':'IE0000000000'}),('indices',{'id':'world','facts':True}),('managers',{'slug':'manager'})]:
            for status in ('cached','unchanged','not-attempted'):
                with self.subTest(family=family,status=status):
                    result=normalize_report({family:[{**identity,'status':status}]})
                    self.assertFalse(result['successes']);self.assertFalse(result['errors'])
            with self.assertRaises(ValueError):normalize_report({family:[{**identity,'status':'unknown-new-format'}]})
        with self.assertRaises(ValueError):normalize_report({'observations':[{'id':'x','status':'unknown-new-format'}]})
    def test_commit_and_publication_failures_are_distinct(self):
        workflow='update-scpi.yml';s=update_status({},event(workflow,conclusion='failure'),jobs(workflow,'Commit validated observations'),[{'successes':[{'id':'x'}],'errors':[]}])
        self.assertEqual(s['workflows'][workflow]['recordingStatus'],'failure')
        s['workflows'][workflow]['publicationReceipt']={'schemaVersion':1,'commit':'a'*40,'files':{'src/data/x.json':'1'*40}}
        s['workflows'][workflow]['publicationStatus']='failure'
        stale=reconcile_publication(s,{'sha':'b'*40,'dataSha':'c'*40,'builtAt':NOW},{'schemaVersion':1,'files':{'src/data/x.json':'2'*40}},lambda a,b:'ahead')
        self.assertEqual(stale['workflows'][workflow]['publicationStatus'],'failure')
        exact=reconcile_publication(s,{'sha':'b'*40,'dataSha':'c'*40,'builtAt':NOW},{'schemaVersion':1,'files':{'src/data/x.json':'1'*40}},lambda a,b:'ahead')
        self.assertEqual(exact['workflows'][workflow]['publicationStatus'],'success')
    def test_monitors_disabled_unobserved_and_observer_failures(self):
        registry={'x.yml':{'name':'X','tools':[],'maxAgeHours':48}}
        s={'workflowAvailability':{'x.yml':{'state':'disabled_manually'}},'observerErrors':{'reader':{'cause':'KeyError'}}}
        m=evaluate_monitoring(s,CTX,registry,NOW,{'errors':[]})
        self.assertIn('disabled:x.yml',m['active']);self.assertIn('unobserved:x.yml',m['active']);self.assertIn('monitor:reader',m['active'])
    def test_missing_context_retains_incidents_and_history_is_durable(self):
        old={'id':'calendar:old','kind':'freshness','name':'Old','tools':[],'cause':'missing'}
        s={'monitoring':{'active':{'calendar:old':old},'resolved':[{'id':str(i)}for i in range(150)],'events':[{'revision':i}for i in range(40)]}}
        m=evaluate_monitoring(s,{**CTX,'incomplete':True},{},NOW,{'errors':[]})
        self.assertIn('calendar:old',m['active']);self.assertEqual(len(m['resolved']),150);self.assertEqual(len(m['events']),40)
    def test_original_proof_is_not_repaired_by_a_new_run(self):
        w='update-scpi.yml'
        failed=update_status({},event(w),jobs(w),[{'errors':[{'id':'artifact-read:scpi-observations','error':'Absent'}]}])
        later=update_status(failed,event(w,101),jobs(w),[{'successes':[{'id':'artifact-read:scpi-observations'}],'errors':[]}])
        key='artifact-read:scpi-observations:run:100:attempt:1'
        self.assertIn(key,later['workflows'][w]['proofFailures'])
        repaired=merge_proof_retry(later,event(w),[{'successes':[{'id':'artifact-read:scpi-observations'}],'errors':[]}])
        self.assertNotIn(key,repaired['workflows'][w]['proofFailures'])
        self.assertEqual(repaired['workflows'][w]['runId'],101)

    def test_rerun_archive_is_not_old_attempt_proof(self):
        run={**event('update-scpi.yml'),'run_started_at':'2026-10-24T10:00:00Z','updated_at':'2026-10-24T11:00:00Z'}
        artifacts=[{'id':1,'created_at':'2026-10-24T10:30:00Z'},{'id':2,'created_at':'2026-10-24T12:30:00Z'}]
        self.assertEqual([a['id']for a in attempt_artifacts(artifacts,run)],[1])

    def test_waiting_is_a_withdrawal_not_a_repair(self):
        w='update-scpi.yml'
        failed=update_status({},event(w),jobs(w),[{'errors':[{'id':'quarter','error':'Missing'}]}])
        failed['monitoring']=evaluate_monitoring(failed,CTX,{w:REGISTRY[w]},NOW,{'errors':[]})
        waiting=update_status(failed,event(w,101),jobs(w),[{'observations':[{'id':'quarter','status':'waiting','reason':'Not due yet'}]}])
        monitor=evaluate_monitoring(waiting,CTX,{w:REGISTRY[w]},NOW,{'errors':[]})
        key='collection:'+w+':quarter'
        self.assertFalse(any(r['id']==key for r in monitor['resolved']))
        self.assertTrue(any(r['id']==key and r['retirementStatus']=='waiting'for r in monitor['retired']))

    def test_historical_union_is_idempotent_and_does_not_reopen(self):
        seed=json.loads(gzip.decompress(Path('scripts/fixtures/automation-reports/history-baseline.json.gz').read_bytes()))
        state={'monitoring':{'active':{},'revision':10000}}
        merged=restore_history(state,seed)
        self.assertEqual(merged['monitoring']['active'],{})
        self.assertEqual(len(merged['monitoring']['resolved']),len(seed['resolved']))
        self.assertEqual(restore_history(merged,seed),merged)
        self.assertEqual(state,{'monitoring':{'active':{},'revision':10000}})

    def test_publication_rejects_null_hash_and_missing_public_check(self):
        self.assertFalse(qualified_receipt({'schemaVersion':1,'commit':'a'*40,'files':{'src/data/x.json':None}}))
        from publish_automation_status import publication_summary
        self.assertEqual(publication_summary(event('update-scpi.yml'),[{'name':'deploy','conclusion':'success','steps':[{'name':'Run actions/deploy-pages@v5.0.1','conclusion':'success'}]}]),('unverified',None))

    def test_consumer_projection_opens_and_recovers_only_on_matching_public_bytes(self):
        manifest={'files':{'public/data/data-automation-inventory.json':'a'*40}}
        projection={'schemaVersion':1,'contract':'data-review-inbox-v1','backlog':[],'assets':[],'consumerUsage':{'tools':[]},'inventoryBlobSha':'b'*40}
        with self.assertRaises(ValueError):review_projection_evidence(projection,manifest,{'sha':'c'*40})
        state={'observerErrors':{'review-projection':{'cause':'Consumer projection stale'}}}
        monitor=evaluate_monitoring(state,CTX,{},NOW,{'errors':[]})
        self.assertIn('monitor:review-projection',monitor['active'])
        state={'monitoring':monitor}
        self.assertIn('monitor:review-projection',evaluate_monitoring(state,CTX,{},NOW,{'errors':[]})['active'])
        state['observerChecks']={'review-projection':{'checkedAt':'2026-10-23T12:00:00Z'}}
        self.assertIn('monitor:review-projection',evaluate_monitoring(state,CTX,{},NOW,{'errors':[]})['active'])
        projection['inventoryBlobSha']='a'*40
        proof=review_projection_evidence(projection,manifest,{'sha':'c'*40})
        state['observerChecks']={'review-projection':proof}
        repaired=evaluate_monitoring(state,CTX,{},dt.datetime.now(dt.timezone.utc).isoformat(),{'errors':[]})
        self.assertNotIn('monitor:review-projection',repaired['active'])
        self.assertEqual(repaired['resolved'][0]['resolutionEvidence'],proof)

    def test_dws_resolution_requires_the_actual_archived_hash_and_four_hours(self):
        body=b'{"official":"portfolio"}'
        digest=hashlib.sha256(body).hexdigest();identifier='etf:fund:field:period'
        proof={'kind':'verified-source-revision','status':'confirmed','sourceHash':digest,'checkedAt':'2026-10-23T12:00:00Z','stableSince':'2026-10-23T08:00:00Z','evidencePath':'dws-snapshots/'+digest+'.json'}
        ledger={'conflicts':{identifier:{'resolvedAt':'2026-10-23T12:01:00Z','resolution':proof}}}
        active={'radar:x':{'conflictId':identifier}}
        api=lambda path:{'content':base64.b64encode(body+b'\n').decode()}
        self.assertTrue(radar_resolution_evidence(api,ledger,active)[identifier]['evidenceVerified'])
        with self.assertRaises(ValueError):radar_resolution_evidence(lambda path:{'content':base64.b64encode(b'wrong').decode()},ledger,active)
        proof['stableSince']='2026-10-23T08:00:01Z'
        self.assertEqual(radar_resolution_evidence(api,ledger,active),{})

    def test_weekly_review_failure_is_supervised(self):
        workflow='review-freshness.yml';s=update_status({},event(workflow,conclusion='failure'),jobs(workflow,'Vérifier les sources et les séries du code'))
        self.assertEqual(s['workflows'][workflow]['validationStatus'],'failure')
        m=evaluate_monitoring(s,CTX,{workflow:REGISTRY[workflow]},NOW,{'errors':[]})
        self.assertIn('checks:'+workflow,m['active'])

if __name__=='__main__':unittest.main()
