"""Actual GitHub producer receipts, frozen scopes and the existing monitor reader."""
import copy
import gzip
import json
from pathlib import Path
import tempfile
import unittest
from producer_report_contract import finish
from publish_automation_status import read_report

FIX=Path(__file__).parent/'fixtures/lifestrategy-nav/producer-contracts'
FILES=['lifestrategy.json','lifestrategy-held-share.json','lifestrategy-held-allocations.json','lifestrategy-lookthrough.json']

def load(name):return json.loads(gzip.decompress((FIX/(name+'.gz')).read_bytes()))

class LifeStrategyReportConsumers(unittest.TestCase):
    def test_all_four_real_reports_are_read_and_keep_their_actual_scope(self):
        for name in FILES:
            with self.subTest(report=name),tempfile.TemporaryDirectory()as tmp:
                p=Path(tmp)/name;r=load(name);p.write_text(json.dumps(r));plan=load(name[:-5]+'.contract-plan.json')
                result=read_report(p,'update-lifestrategy.yml',plan)
                self.assertFalse(result['errors'])
                selected=[x for x in r['resultContract']['outcomes']if x.get('selected')]
                self.assertEqual(len(result['successes']),len(selected))
                self.assertTrue(all(x['status']=='succeeded'for x in selected))
                self.assertTrue(result['_reportEvidence']['scopePlanVerified'])
                if name=='lifestrategy-lookthrough.json':self.assertTrue(all(x.get('phase')=='validation'and x.get('sourceAttempted')is False for x in selected))
    def test_missing_individual_result_is_not_certified_by_other_successes(self):
        for name in FILES:
            native=load(name);plan=native.pop('resultContract')['inputPlan'];requested=[i for i in plan['items']if i['selected']]
            if name=='lifestrategy.json':native['records'].pop()
            elif name=='lifestrategy-held-allocations.json':native['successes'].pop();native['updated'].pop()
            else:native['successes'].pop()
            result=finish(native,plan)
            missing=[x for x in result['resultContract']['outcomes']if x.get('selected')and x['status']=='failed']
            with self.subTest(report=name):self.assertEqual(len(missing),1);self.assertEqual(len([x for x in result['resultContract']['outcomes']if x.get('selected')]),len(requested))

if __name__=='__main__':unittest.main()
