import datetime as dt
import unittest
import json
from pathlib import Path
from collect_index_documents import msci_composition
from refresh_index_companies import refresh, report_results

class RefreshCompaniesTests(unittest.TestCase):
    def test_korea_official_table_is_not_the_capped_fund(self):
        root=Path(__file__).resolve().parents[1]
        config=next(c for c in json.loads((root/'scripts/index-company-sources.json').read_text())['additionalIndices'] if c['id']=='msci-korea')
        facts=msci_composition((root/'scripts/fixtures/index-companies/korea.txt').read_text(),config,dt.datetime(2026,10,21,tzinfo=dt.timezone.utc))
        self.assertEqual(facts['asOf'],'2026-09-30')
        self.assertEqual(facts['index'],'MSCI Korea')
        self.assertEqual(len(facts['holdings']),10)
        self.assertEqual(facts['holdings'][0],['SAMSUNG ELECTRONICS CO',35.31])
        self.assertEqual(facts['holdings'][2],['SAMSUNG ELECTRONICS PREF',4.4])

    def test_partial_failure_retains_valid_data_and_original_date(self):
        previous={'dow-jones':{'facts':{'asOf':'2026-09-30','source':{'checkedAt':'2026-10-20'},'holdings':[['A',5]]}}}
        def collect(config,now):
            return {'id':config['id'],'errors':[{'field':'composition','reason':'offline'}]}
        result, _=refresh(previous,[{'id':'dow-jones'}],dt.datetime(2026,10,21,tzinfo=dt.timezone.utc),collect)
        self.assertEqual(result['dow-jones']['facts'],previous['dow-jones']['facts'])
        self.assertEqual(result['dow-jones']['status']['status'],'failed')
        self.assertEqual(result['dow-jones']['status']['lastSuccessAt'],'2026-10-20')
        self.assertNotIn('status',previous['dow-jones'])
    def test_one_failure_does_not_discard_another_index(self):
        def collect(config,now):
            return {'id':config['id'],'errors':[],'facts':{'asOf':'2026-09-30','source':{'checkedAt':'2026-10-21'}}} if config['id']=='ok' else {'id':config['id'],'errors':[{'field':'composition','reason':'offline'}]}
        result,_=refresh({},[{'id':'ok'},{'id':'failed'}],dt.datetime(2026,10,21,tzinfo=dt.timezone.utc),collect)
        self.assertIn('facts',result['ok'])
        self.assertEqual(result['failed']['status']['status'],'failed')

    def test_basket_failure_remains_distinct_from_successful_index_table(self):
        from producer_report_plans import build_plan
        from producer_report_contract import finish
        from publish_automation_status import normalize_report
        plan={**build_plan('refresh_index_companies',[],report_stem='index-company-observations'),'producer':'refresh_index_companies','reportStem':'index-company-observations'}
        import hashlib
        plan.update(declaredAt='2026-11-07T19:00:00+00:00',nonce='isolated-regression')
        plan['sha256']=hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()
        self.assertTrue(any(i['id']=='index-msci-korea-company-fund' for i in plan['items']))
        rows=[{'id':'msci-korea','facts':{'asOf':'2026-10-31','source':{'checkedAt':'2026-11-07','url':'https://official.example/index'}},
               'errors':[{'field':'companyFund','reason':'Portfolio and classification dates differ'}]}]
        result=report_results(rows)
        report=finish({'contractResults':result,'indices':rows},plan)
        outcomes={r['id']:r for r in report['resultContract']['outcomes']}
        self.assertEqual(outcomes['index-msci-korea-composition']['status'],'succeeded')
        self.assertEqual(outcomes['index-msci-korea-composition']['asOf'],'2026-10-31')
        failure=outcomes['index-msci-korea-company-fund']
        self.assertEqual(failure['status'],'failed')
        self.assertNotIn('checkedAt',failure)
        self.assertTrue(any(r['id']=='index-msci-korea-company-fund' for r in normalize_report(report)['errors']))
        # An omitted complementary result must be an omission, never inferred
        # from success of the main table or a retained companyFund registry.
        omitted=finish({'contractResults':report_results([{**rows[0],'errors':[]}])},plan)
        missing=next(r for r in omitted['resultContract']['outcomes']if r['id']=='index-msci-korea-company-fund')
        self.assertEqual(missing['kind'],'omission')
        success=report_results([{'id':'msci-korea','errors':[],'companyFund':{'asOf':'2026-10-31','checkedAt':'2026-11-07','sourceUrl':'https://official.example/basket'}}])
        self.assertEqual(success['successes'][0]['id'],'index-msci-korea-company-fund')
        self.assertEqual(success['successes'][0]['checkedAt'],'2026-11-07')

if __name__=='__main__':unittest.main()
