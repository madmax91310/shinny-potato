import unittest
from publish_automation_status import normalize_report, update_status
from test_automation_status import run


class RankingAttempts(unittest.TestCase):
    def test_targeted_fx_retry_does_not_certify_skipped_histories_or_ecb(self):
        report={'series':[{'id':'stock','status':'validated'}],
                'fxSources':{'ECB':{'id':'fx:ECB','status':'validated'}, 'TWD':{'id':'fx:TWD','status':'validated'}},
                'attemptedIds':['fx:TWD']}
        self.assertEqual(normalize_report(report),{'successes':[{'id':'history:fx:TWD'}],'errors':[]})
        workflow='update-market-monthly.yml'
        first={'series':[{'id':'stock','status':'failed','reason':'original stock failure'}], 'attemptedIds':['stock']}
        failed=update_status({},run(1,'failure',workflow),[],[first])
        retained=update_status(failed,run(2,'success',workflow),[],[report])
        before=failed['workflows'][workflow]['dataFailures']['history:stock']
        self.assertEqual(retained['workflows'][workflow]['dataFailures']['history:stock'],before)
        recovered=update_status(retained,run(3,'success',workflow),[],[{'series':[{'id':'stock','status':'validated'}],'attemptedIds':['stock']}])
        self.assertNotIn('history:stock',recovered['workflows'][workflow]['dataFailures'])

    def test_empty_retry_cannot_reset_a_prior_failure_date(self):
        self.assertEqual(normalize_report({'series':[{'id':'old','status':'failed','reason':'old error'}], 'attemptedIds':[]}),{'successes':[],'errors':[]})
        for value in [None, 'stock', ['stock','stock'], [None]]:
            with self.assertRaises(ValueError):normalize_report({'series':[], 'attemptedIds':value})


if __name__ == '__main__':unittest.main()
