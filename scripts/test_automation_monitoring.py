import copy
import unittest
from automation_monitoring import evaluate_monitoring, sync_monitoring_issue, MARKER
from publish_automation_status import normalize_report, update_status

NOW = '2026-10-14T08:00:00Z'
REGISTRY = {'x.yml': {'name': 'Indices', 'maxAgeHours': 48, 'tools': ['Coulisses des indices']}}
CONTEXT = {'schemaVersion': 1, 'alerts': [], 'entities': [{'name': 'MSCI World', 'aliases': ['world'], 'tools': ['Coulisses des indices'], 'field': 'Composition'}]}
STATE = {'workflows': {'x.yml': {'completedAt': NOW, 'status': 'success', 'collectionStatus': 'success'}}}

def evaluate(state, context=CONTEXT, now=NOW, radar=None):
    return evaluate_monitoring(state, context, REGISTRY, now, {'errors': []} if radar is None else radar)

class MonitoringTests(unittest.TestCase):
    def test_exact_return_window_recovery_uses_ordinary_qualified_history_not_generic_source_success(self):
        identifier='automated-etf-monthly:etc_wti_crude_oilNav'
        key='history:'+identifier+':return-window:2020-12:2021-12'
        row={'id':key.removeprefix('history:'),'name':'WTI NAV','kind':'history','dataId':'GB00B15KXV33','currency':'USD','method':'Exact share NAV TR','checkedAt':'2026-10-28','unqualifiedReturnWindow':{'start':'2020-12','end':'2021-12'},'cause':'Unqualified interval','tools':['Calculateur']}
        neighbour={**row,'id':identifier+':return-window:2021-12:2022-12','unqualifiedReturnWindow':{'start':'2021-12','end':'2022-12'}}
        first=evaluate(STATE,{**CONTEXT,'historyAlerts':[row,neighbour]},now='2026-10-29T10:00:00Z')
        self.assertIn(key,first['active'])
        window={'start':'2020-12','end':'2021-12','convention':'fund-nav-total-return','sourceRuntime':{'kind':'github','runId':'40849049488','attempt':'1','event':'push'}}
        proof={k:row[k]for k in ('dataId','currency','method')}
        proof.update(checkedAt='2026-10-29',responseSha256='a'*64,periods=['2020-12','2021-12'],qualifiedReturnWindows=[window])
        state={**STATE,'monitoring':first}
        def recover(value):
            return evaluate(state,{**CONTEXT,'historyAlerts':[],'historyChecks':{identifier:value}},now='2026-10-29T12:00:00Z')
        result=recover(proof)
        self.assertNotIn(key,result['active'])
        self.assertIn('history:'+neighbour['id'],result['active'],'A restored interval does not qualify another interval')
        resolved=next(r for r in result['resolved']if r['id']==key)
        self.assertEqual(resolved['resolutionEvidence']['kind'],'qualified-monthly-return-window')
        mutations=[lambda p:p.pop('qualifiedReturnWindows'),lambda p:p.pop('responseSha256'),lambda p:p.update(checkedAt='2026-10-27'),lambda p:p.update(checkedAt='2026-10-30'),lambda p:p.update(currency='EUR'),lambda p:p.update(dataId='OTHER'),lambda p:p.update(method='Raw price'),lambda p:p.update(periods=['2021-12']),lambda p:p['qualifiedReturnWindows'][0].update(end='2022-12'),lambda p:p['qualifiedReturnWindows'][0].update(convention='price'),lambda p:p['qualifiedReturnWindows'][0]['sourceRuntime'].update(kind='local'),lambda p:p['qualifiedReturnWindows'][0]['sourceRuntime'].update(event='pull_request')]
        for mutate in mutations:
            bad=copy.deepcopy(proof);mutate(bad)
            self.assertIn(key,recover(bad)['active'])
        self.assertIn(key,recover({})['active'],'Disappearance is not a positive interval proof')

    def test_retired_tool_is_not_a_data_recovery_and_other_alerts_remain(self):
        state = copy.deepcopy(STATE)
        state['monitoring'] = {'active': {
            'old-company': {'id':'old-company','workflow':'update-company-analysis.yml','name':'Comptes','kind':'collection','tools':['Analyse d’entreprise']},
            'history:still-failed': {'id':'history:still-failed','name':'Change','kind':'history','tools':['Performances']}
        }}
        result = evaluate(state)
        self.assertEqual([r['id'] for r in result['retired']], ['old-company'])
        self.assertNotIn('old-company', [r['id'] for r in result['resolved']])
        self.assertIn('history:still-failed', result['active'])
        state['monitoring'] = result
        again = evaluate(state)
        self.assertEqual(len(again['retired']), 1)

    def test_failure_keeps_first_seen_and_recovers_once(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml']['dataFailures'] = {'index-world-composition': {'cause': 'Missing weights'}}
        first = evaluate(state)
        incident = next(iter(first['active'].values()))
        self.assertEqual(incident['name'], 'MSCI World')
        self.assertEqual(incident['field'], 'Composition')
        self.assertEqual(incident['tools'], ['Coulisses des indices'])
        state['monitoring'] = first
        again = evaluate(state, now='2026-10-14T09:00:00Z')
        self.assertEqual(again['revision'], 1)
        self.assertEqual(next(iter(again['active'].values()))['firstSeenAt'], NOW)
        state['workflows']['x.yml']['dataFailures'] = {}
        self.assertTrue(evaluate(state)['active'], 'Une disparition sans preuve ne clôture pas le champ')
        state['workflows']['x.yml']['sourceChecks']={'index-world-composition':{'checkedAt':NOW,'runUrl':'https://github.com/test/repo/actions/runs/2'}}
        state['monitoring'] = again
        self.assertTrue(evaluate(state, now='2026-10-14T10:00:00Z')['active'], 'Une preuve antérieure à la panne ne démontre pas sa résolution')
        state['workflows']['x.yml']['sourceChecks']['index-world-composition']['checkedAt']='2026-10-14T09:30:00Z'
        resolved = evaluate(state, now='2026-10-14T10:00:00Z')
        self.assertEqual(resolved['active'], {})
        self.assertEqual(len(resolved['resolved']), 1)
        state['monitoring'] = resolved
        self.assertEqual(evaluate(state)['revision'], 2)

    def test_changed_official_document_is_a_review_not_a_broken_collector(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml']['dataFailures'] = {
            'clause': {'name': 'Clause', 'cause': 'Clause officielle absente ou modifiée : X | Passage actuel le plus proche : « Y »'},
            'identity': {'name': 'Contrat', 'cause': 'Wrong contract identity | attendu : « A » ; titre actuel : « B »'},
            'network': {'name': 'Réseau', 'cause': 'HTTP Error 403: Forbidden'}}
        active = evaluate(state)['active']
        self.assertEqual(active['collection:x.yml:clause']['kind'], 'review')
        self.assertEqual(active['collection:x.yml:identity']['kind'], 'review')
        self.assertEqual(active['collection:x.yml:network']['kind'], 'collection')

    def test_published_data_with_failed_advisory_check_is_not_a_publication_failure(self):
        state = copy.deepcopy(STATE)
        row = state['workflows']['x.yml']
        row.update({'status': 'failure', 'publicationStatus': 'success',
                    'failures': [{'job': 'deploy / browser-checks (2)', 'step': 'Run node scripts/run-browser-checks.mjs 2 4'},
                                 {'job': 'deploy / advisory-checks', 'step': 'Run echo'}]})
        incident = evaluate(state)['active']['checks:x.yml']
        self.assertEqual((incident['kind'], incident['field']), ('checks', 'Contrôle après publication'))
        self.assertIn('browser-checks (2)', incident['cause'])
        row['failures'][0]['checks'] = ['node scripts/playwright-tools.mjs — strict mode violation']
        named = evaluate(state)['active']['checks:x.yml']['cause']
        self.assertIn('browser-checks (2) : node scripts/playwright-tools.mjs — strict mode violation', named)
        del row['failures'][0]['checks']
        row['publicationStatus'] = 'failure'
        self.assertEqual(evaluate(state)['active']['publication:x.yml']['kind'], 'publication')
        # A failed collector step is never relabelled as a mere check, even when publication succeeded.
        row.update({'publicationStatus': 'success', 'failures': [{'job': 'refresh', 'step': 'Collect observations'}]})
        self.assertEqual(evaluate(state)['active']['workflow:x.yml']['kind'], 'collection')

    def test_silent_collector_and_data_deadline_independent_of_success(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml']['completedAt'] = '2026-10-11T08:00:00Z'
        context = {**CONTEXT, 'alerts': [{'id': 'investor:test', 'name': 'Manager', 'field': 'Portefeuille', 'category': 'stale', 'dueAt': '2026-10-01', 'tools': ['Présentation investisseur']}]}
        result = evaluate(state, context)
        self.assertEqual(set(result['active']), {'overdue:x.yml', 'calendar:investor:test'})
        state['workflows']['x.yml']['completedAt'] = NOW
        self.assertIn('calendar:investor:test', evaluate(state, context)['active'])
        for stamp in [None, 'invalid', '2027-01-01T00:00:00Z']:
            state['workflows']['x.yml']['completedAt'] = stamp
            self.assertIn('unobserved:x.yml', evaluate(state)['active'])

    def test_field_incident_survives_missing_report_and_green_workflow(self):
        context={**CONTEXT,'fieldAlerts':[{'id':'ETF:holdings','name':'ETF','field':'Positions','kind':'collection','cause':'403','checkedAt':'2026-09-01','asOf':'2026-08-31'}]}
        first=evaluate(STATE,context)
        self.assertIn('field:ETF:holdings',first['active'])
        state={**STATE,'monitoring':first}
        missing=evaluate(state,CONTEXT)
        self.assertIn('field:ETF:holdings',missing['active'])
        self.assertEqual(missing['resolved'],[])
        good=evaluate(state,{**CONTEXT,'fieldAlerts':[],'fieldChecks':{'ETF:holdings':{'checkedAt':NOW,'asOf':'2026-09-30'}}})
        self.assertNotIn('field:ETF:holdings',good['active'])
        self.assertEqual(len(good['resolved']),1)
        self.assertEqual(first['active']['field:ETF:holdings']['checkedAt'],'2026-09-01')

    def test_conflict_and_unreadable_radar_cannot_fake_recovery(self):
        radar = {'errors': [{'entity': 'world', 'reason': 'Valeur contradictoire pour la même période (2026-09) : Secteurs'}]}
        first = evaluate(STATE, radar=radar)
        state = {**STATE, 'monitoring': first}
        unreadable = evaluate_monitoring(state, CONTEXT, REGISTRY, NOW, None)
        self.assertTrue(set(first['active']) < set(unreadable['active']))
        self.assertEqual(unreadable['resolved'], [])
        recovered = evaluate({**STATE, 'monitoring': unreadable})
        self.assertEqual(len(recovered['active']), 1)
        self.assertEqual(len(recovered['resolved']), 1)
        self.assertTrue(next(iter(recovered['active'].values()))['proofStatus']=='resolution-unproven')
        observed_again = evaluate({**STATE, 'monitoring': recovered}, radar=radar)
        renewed = next(r for r in observed_again['active'].values() if r.get('kind') == 'conflict')
        self.assertNotIn('proofStatus', renewed, 'A reobserved source contradiction must not retain the historical-qualification marker')

    def test_repaired_field_gap_needs_exact_new_proof_and_cannot_clear_usage(self):
        identifier = 'gap:instrument:IE00BYZK4776:listings'
        usage = 'gap:usage:IE00BYZK4776:catalog:6'
        row = {'name':'HEAL','field':'Cotations','checkedAt':'2026-09-01','lastSuccessAt':'2026-09-01','kind':'review','cause':'London proof missing'}
        context = {**CONTEXT,'fieldAlerts':[{**row,'id':identifier},{**row,'id':usage}]}
        first = evaluate(STATE,context)
        state = {**STATE,'monitoring':first}
        proof = {'checkedAt':NOW,'sourceUrl':'https://apidata.londonstockexchange.com/nrdp/v1?tidm=HEAL','asOf':None}
        current = {**CONTEXT,'fieldAlerts':[],'fieldChecks':{identifier:proof}}
        healed = evaluate(state,current)
        self.assertNotIn('field:'+identifier,healed['active'])
        self.assertIn('field:'+usage,healed['active'])
        self.assertEqual(healed['resolved'][0]['resolutionEvidence'],proof)
        self.assertEqual(first['active']['field:'+identifier]['checkedAt'],'2026-09-01')
        # A still-reported gap wins over a current field; no cache, stale proof,
        # future timestamp or success for another instrument clears this case.
        self.assertIn('field:'+identifier,evaluate(state,{**current,'fieldAlerts':context['fieldAlerts']})['active'])
        for checks in [{}, {'gap:instrument:OTHER:listings':proof}, {identifier:{**proof,'checkedAt':'2026-09-01'}}, {identifier:{**proof,'checkedAt':'2027-01-01'}}]:
            self.assertIn('field:'+identifier,evaluate(state,{**current,'fieldChecks':checks})['active'])

    def test_investor_report_does_not_clear_another_manager(self):
        def run(n): return {'id': n, 'path': 'update-investor-13f.yml', 'head_branch': 'master', 'event': 'schedule', 'status': 'completed', 'conclusion': 'failure', 'updated_at': f'2026-10-{n:02d}T08:00:00Z', 'html_url': 'https://github.com/test/repo/actions/runs/1'}
        report = {'readyToApply': False, 'managers': [{'slug': 'a', 'status': 'failed', 'reason': '429'}, {'slug': 'b', 'status': 'validated'}]}
        self.assertEqual(normalize_report(report)['successes'], [{'id': 'investor:b'}])
        failed = update_status({}, run(1), [], [report])
        partial = update_status(failed, run(2), [], [{'managers': [{'slug': 'b', 'status': 'validated'}]}])
        self.assertIn('investor:a', partial['workflows']['update-investor-13f.yml']['dataFailures'])
        fixed = update_status(partial, run(3), [], [{'managers': [{'slug': 'a', 'status': 'validated'}]}])
        self.assertEqual(fixed['workflows']['update-investor-13f.yml']['dataFailures'], {})

class FakeAPI:
    def __init__(self, created_at=None):
        self.issue = None
        self.created_at = created_at
        self.comments = []
        self.writes = []
        self.fail_after_comment = False
        self.fail_after_patch = False
    def __call__(self, path, method='GET', body=None):
        if method == 'GET':
            return self.comments if '/comments?' in path else [self.issue] if self.issue else []
        self.writes.append((method, path, body))
        if method == 'POST' and path == '/issues':
            self.issue = {**body, 'number': 1, 'state': 'open', 'user': {'login': 'github-actions[bot]'}}
            return self.issue
        if method == 'PATCH':
            self.issue.update(body)
            if self.fail_after_patch:
                self.fail_after_patch = False
                raise TimeoutError('Response lost after issue update')
            return self.issue
        self.comments.append({**body, 'user': {'login': 'github-actions[bot]'}, **({'created_at': self.created_at} if self.created_at else {})})
        if self.fail_after_comment:
            self.fail_after_comment = False
            raise TimeoutError('Response lost after GitHub accepted comment')
        return self.comments[-1]

class NotificationTests(unittest.TestCase):
    def monitor(self, at=NOW, active=None, revision=1):
        return {'checkedAt':at,'revision':revision,'active':active or {},'events':[]}

    def feed(self):
        return {'id':'monitor:radar','name':'Flux Radar','kind':'unobserved','cause':'Lecture impossible','firstSeenAt':NOW,'tools':['Radar éditorial']}

    def baseline(self,api):
        initial=self.monitor(active={'monitor:radar':self.feed()})
        sync_monitoring_issue(initial,api,'test/repo')
        return initial

    def test_initialization_is_silent_and_repeated_source_failures_keep_evidence(self):
        api=FakeAPI()
        state=copy.deepcopy(STATE)
        state['workflows']['x.yml']['dataFailures']={'index-world-composition':{'cause':'HTTP 403'}}
        first=evaluate(state)
        sync_monitoring_issue(first,api,'test/repo')
        for hour in range(9,20):
            state['monitoring']=first
            first=evaluate(state,now=f'2026-10-14T{hour:02}:00:00Z')
            sync_monitoring_issue(first,api,'test/repo')
        self.assertEqual(api.comments,[])
        self.assertTrue(first['active'])
        self.assertGreaterEqual(len(next(iter(first['active'].values()))['observations']),1)
        writes=len(api.writes);sync_monitoring_issue(first,api,'test/repo')
        self.assertEqual(len(api.writes),writes)

    def test_global_feed_failure_crosses_criticality_even_without_revision_change(self):
        api=FakeAPI();initial=self.baseline(api)
        later={**initial,'checkedAt':'2026-10-14T09:05:00Z'}
        sync_monitoring_issue(later,api,'test/repo')
        self.assertEqual(len(api.comments),1)
        self.assertIn('Flux global du Radar',api.comments[0]['body'])
        sync_monitoring_issue({**later,'checkedAt':'2026-10-14T09:30:00Z'},api,'test/repo')
        self.assertEqual(len(api.comments),1)

    def test_critical_reminders_spaced_24_hours(self):
        api=FakeAPI();initial=self.baseline(api)
        sync_monitoring_issue({**initial,'checkedAt':'2026-10-14T09:05:00Z'},api,'test/repo')
        sync_monitoring_issue({**initial,'checkedAt':'2026-10-15T08:00:00Z'},api,'test/repo')
        self.assertEqual(len(api.comments),1)
        sync_monitoring_issue({**initial,'checkedAt':'2026-10-15T09:06:00Z'},api,'test/repo')
        self.assertEqual(len(api.comments),2)
        self.assertIn('rappel espacé',api.comments[-1]['body'])
        sync_monitoring_issue({**initial,'checkedAt':'2026-10-15T09:07:00Z'},api,'test/repo')
        self.assertEqual(len(api.comments),2)

    def test_response_lost_after_comment_recovers_receipt_without_resend(self):
        api=FakeAPI();initial=self.baseline(api)
        later={**initial,'checkedAt':'2026-10-14T09:05:00Z'}
        api.fail_after_comment=True
        with self.assertRaises(TimeoutError):sync_monitoring_issue(later,api,'test/repo')
        self.assertEqual(len(api.comments),1)
        sync_monitoring_issue(later,api,'test/repo')
        self.assertEqual(len(api.comments),1)

    def test_response_lost_after_body_patch_does_not_silence_pending_alert(self):
        api=FakeAPI();initial=self.baseline(api)
        later={**initial,'checkedAt':'2026-10-14T09:05:00Z','revision':2}
        api.fail_after_patch=True
        with self.assertRaises(TimeoutError):sync_monitoring_issue(later,api,'test/repo')
        self.assertEqual(api.comments,[])
        sync_monitoring_issue(later,api,'test/repo')
        self.assertEqual(len(api.comments),1)

    def test_material_coverage_escalation_not_attempt_or_single_source(self):
        api=FakeAPI()
        def row(source):return {'id':source,'workflow':'update-editorial-radar.yml','dataId':source,'name':source,'kind':'collection','firstSeenAt':NOW,'cause':'HTTP 403'}
        active={'insee':row('insee'),'fortuneo':row('fortuneo')}
        first=self.monitor(active=active);sync_monitoring_issue(first,api,'test/repo')
        later=self.monitor('2026-10-14T10:01:00Z',active)
        sync_monitoring_issue(later,api,'test/repo');self.assertEqual(len(api.comments),1)
        same=copy.deepcopy(later);same['active']['insee']['runUrl']='https://github.com/new-attempt'
        sync_monitoring_issue(same,api,'test/repo');self.assertEqual(len(api.comments),1)
        active['credit-logement']=row('credit-logement')
        sync_monitoring_issue(self.monitor('2026-10-14T10:05:00Z',active,2),api,'test/repo')
        self.assertEqual(len(api.comments),2)

    def test_recovery_updates_issue_and_history_without_recovery_spam(self):
        api=FakeAPI();initial=self.baseline(api)
        sync_monitoring_issue({**initial,'checkedAt':'2026-10-14T09:05:00Z'},api,'test/repo')
        recovered=self.monitor('2026-10-14T10:00:00Z',revision=2)
        sync_monitoring_issue(recovered,api,'test/repo')
        self.assertEqual(api.issue['state'],'closed');self.assertEqual(len(api.comments),1)
        writes=len(api.writes);sync_monitoring_issue(recovered,api,'test/repo')
        self.assertEqual(len(api.writes),writes)

    def test_old_critical_history_rolls_out_without_retroactive_burst(self):
        api=FakeAPI()
        api.issue={'number':1,'body':MARKER+'\n<!-- monitor-notified:99 -->','title':'Old','state':'open','user':{'login':'github-actions[bot]'}}
        monitor=self.monitor('2026-10-15T08:00:00Z',{'monitor:radar':self.feed()},100)
        sync_monitoring_issue(monitor,api,'test/repo')
        self.assertEqual(api.comments,[])
        self.assertIn('monitor-notification-state:',api.issue['body'])

    def test_healthy_first_pass_does_not_notify(self):
        api=FakeAPI();sync_monitoring_issue(evaluate(STATE),api,'test/repo');self.assertEqual(api.writes,[])


class AlertCenterTests(unittest.TestCase):
    def test_escalation_ignores_runs_dates_and_repeated_failure(self):
        context = {**CONTEXT, 'historyAlerts': [{'id': 'fund:gaps', 'name': 'Fund', 'kind': 'history', 'field': 'Monthly', 'cause': 'Missing month', 'missingPeriods': ['2026-07'], 'tools': ['Performance depuis']}]}
        first = evaluate(STATE, context)
        state = {**STATE, 'monitoring': first}
        again = evaluate(state, context, now='2026-10-14T09:00:00Z')
        self.assertEqual(first['revision'], again['revision'])
        context = copy.deepcopy(context)
        context['historyAlerts'][0]['missingPeriods'].append('2026-08')
        worse = evaluate(state, context)
        self.assertEqual(worse['revision'], first['revision'] + 1)
        self.assertEqual(worse['events'][-1]['escalated'], ['history:fund:gaps'])
        self.assertEqual(worse['active']['history:fund:gaps']['firstSeenAt'], NOW)
        # Recovery is not inferred from the collector run: the gap must disappear.
        unreadable = evaluate({**STATE, 'monitoring': worse}, CONTEXT)
        self.assertIn('history:fund:gaps', unreadable['active'])
        recovered = evaluate({**STATE, 'monitoring': worse}, {**CONTEXT, 'historyAlerts': [],'historyChecks':{'fund':{'periods':['2026-07','2026-08']}}})
        self.assertFalse(recovered['active'])
        self.assertEqual(len(recovered['resolved']), 1)

    def test_anomaly_and_last_success_are_preserved(self):
        state = copy.deepcopy(STATE)
        state['workflows']['x.yml'].update(lastCollectionSuccessAt='2026-10-10T08:00:00Z', dataFailures={'index-world-composition': {'cause': 'Suspicious ETF change'}})
        row = evaluate(state)['active']['collection:x.yml:index-world-composition']
        self.assertEqual(row['kind'], 'anomaly')
        self.assertIsNone(row['lastSuccessAt'], 'Le succès global ne date pas ce champ individuel')
        state['workflows']['x.yml']['dataFailures']['index-world-composition']['lastSuccessAt']='2026-10-10T08:00:00Z'
        row=evaluate(state)['active']['collection:x.yml:index-world-composition']
        self.assertEqual(row['lastSuccessAt'], '2026-10-10T08:00:00Z')

    def test_partial_data_recovery_and_escalation_notify_once(self):
        api = FakeAPI(created_at=NOW)
        context = {**CONTEXT, 'historyAlerts': [
            {'id': 'a', 'name': 'A', 'kind': 'history', 'cause': 'Missing', 'missingPeriods': ['2026-07'], 'tools': []},
            {'id': 'b', 'name': 'B', 'kind': 'history', 'cause': 'Missing', 'missingPeriods': ['2026-07'], 'tools': []}]}
        first = evaluate(STATE, context)
        sync_monitoring_issue(first, api, 'test/repo')
        context = copy.deepcopy(context)
        context['historyAlerts'][0]['missingPeriods'].append('2026-08')
        worse = evaluate({**STATE, 'monitoring': first}, context)
        sync_monitoring_issue(worse, api, 'test/repo')
        self.assertEqual(api.comments, [], 'Local data escalation remains in the incident history, without a critical global failure')
        count = len(api.writes)
        sync_monitoring_issue(worse, api, 'test/repo')
        self.assertEqual(len(api.writes), count)
        context['historyAlerts'] = context['historyAlerts'][1:]
        context['historyChecks']={'a':{'periods':['2026-07','2026-08']}}
        partial = evaluate({**STATE, 'monitoring': worse}, context)
        sync_monitoring_issue(partial, api, 'test/repo')
        self.assertEqual(len(api.comments), 0)
        self.assertEqual(api.issue['state'], 'open')
        same = evaluate({**STATE, 'monitoring': partial}, context, now='2026-10-14T10:00:00Z')
        sync_monitoring_issue(same, api, 'test/repo')
        self.assertEqual(len(api.comments), 0)

if __name__ == '__main__': unittest.main()
