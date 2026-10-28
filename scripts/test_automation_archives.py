import base64
import copy
import unittest
from automation_monitoring import evaluate_monitoring
from automation_status_storage import archive_results, restore_results, pack_report_scopes, expand_report_archives


class ReportArchives(unittest.TestCase):
    def fixture(self):
        return {'schemaVersion':1,'workflows':{'source.yml':{'runId':12,'sourceChecks':{'x':{'checkedAt':'2026-10-21'}},
            'reportEvidenceHistory':[{'file':'results.json','sha256':'a'*64,'runId':11,'attempt':2,
                'successes':[{'id':f'field:{i}','checkedAt':'2026-10-21','verifiedInAttempt':False}for i in range(700)],
                'errors':[{'id':'failed','error':'HTTP 403','sourceAttempted':True}]}]}}}

    def test_lossless_roundtrip_preserves_failed_results_dates_and_identity(self):
        original=self.fixture();before=copy.deepcopy(original);packed=pack_report_scopes(original)
        archive=packed['workflows']['source.yml']['reportEvidenceHistory'][0]
        self.assertIn('resultArchive',archive);self.assertEqual(archive['runId'],11);self.assertEqual(archive['attempt'],2)
        self.assertEqual(archive['resultArchive']['counts'],{'successes':700,'errors':1})
        self.assertEqual(expand_report_archives(packed),original);self.assertEqual(original,before)
        self.assertEqual(pack_report_scopes(packed),packed)
        self.assertLess(len(str(packed)),len(str(original))//3)

    def test_corruption_is_isolated_visible_and_never_discards_original_evidence(self):
        packed=pack_report_scopes(self.fixture());entry=packed['workflows']['source.yml']['reportEvidenceHistory'][0]
        entry['resultArchive']['sha256']='b'*64
        with self.assertRaises(ValueError):restore_results(entry)
        packed['workflows']['independent.yml']={'sourceChecks':{'y':{'checkedAt':'2026-10-22'}}}
        result=expand_report_archives(packed)
        self.assertEqual(result['workflows']['independent.yml'],packed['workflows']['independent.yml'])
        self.assertEqual(result['workflows']['source.yml']['reportEvidenceHistory'][0],entry)
        self.assertIn('archive:source.yml:reportEvidenceHistory:0',result['observerErrors'])
        self.assertIn('archive:source.yml:reportEvidenceHistory:0',pack_report_scopes(result)['observerErrors'])

    def test_invalid_schemas_counts_and_truncations_are_rejected(self):
        entry=archive_results(self.fixture()['workflows']['source.yml']['reportEvidenceHistory'][0])
        for change in [{'encoding':'unknown'},{'decodedBytes':1},{'counts':{'errors':0}},
                       {'data':base64.b64encode(b'not gzip').decode()}, {'data':entry['resultArchive']['data'][:-10]}]:
            with self.assertRaises(ValueError):restore_results({**entry,'resultArchive':{**entry['resultArchive'],**change}})
        with self.assertRaises(ValueError):restore_results({**entry,'errors':[]})

    def test_malformed_history_does_not_stop_other_producers(self):
        state=self.fixture();state['workflows']['bad.yml']={'reportEvidenceHistory':None}
        packed=pack_report_scopes(state)
        self.assertIn('archive:bad.yml:reportEvidenceHistory',packed['observerErrors'])
        self.assertIn('resultArchive',packed['workflows']['source.yml']['reportEvidenceHistory'][0])
        monitor=evaluate_monitoring(packed,{'schemaVersion':1,'alerts':[],'entities':[]},
            {'source.yml':{'name':'Source'},'bad.yml':{'name':'Bad'}},'2026-10-28T12:00:00Z')
        self.assertIn('monitor:report-history:bad.yml',monitor['active'])
        self.assertIn('unobserved:source.yml',monitor['active'],'The independent producer is still monitored')

if __name__=='__main__':unittest.main()
