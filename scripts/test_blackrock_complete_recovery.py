import copy,datetime as dt,json,unittest
from collect_dca_complete_holdings import collect_blackrock_complete
from test_dca_complete_realestate import CompleteRealEstate

class Recovery(unittest.TestCase):
    def setUp(self):
        self.body=CompleteRealEstate().body()
        self.config={'isin':'IE00B0M63284','url':'https://www.blackrock.com/?portfolioId=251808','fundAssetClass':'Real Estate'}
        self.now=dt.datetime(2026,10,16,tzinfo=dt.timezone.utc)
    def test_partial_component_retries_once_without_relaxing_validation(self):
        partial=copy.deepcopy(self.body);del partial['componentsByNameMap']['holdings']
        responses=iter([partial,self.body]);calls=[];pauses=[]
        def fetch(*args):calls.append(args[0]);return json.dumps(next(responses))
        record,_=collect_blackrock_complete(self.config,self.now,fetch,pauses.append)
        self.assertEqual(calls,[self.config['url']]*2);self.assertEqual(pauses,[2])
        self.assertEqual(record['asOf'],'2026-10-15');self.assertTrue(record['complete'])
        self.assertEqual([r['status']for r in record['sourceAttempts']],['missing-holdings-component','validated'])
        self.assertEqual(sum(r['weightPct']for r in record['rows']),100)
    def test_persistent_missing_component_is_explicitly_blocked(self):
        del self.body['componentsByNameMap']['holdings'];calls=[]
        def fetch(*args):calls.append(1);return json.dumps(self.body)
        with self.assertRaisesRegex(ValueError,'absent after two bounded attempts'):
            collect_blackrock_complete(self.config,self.now,fetch,lambda _:None)
        self.assertEqual(len(calls),2)
    def test_wrong_identity_and_bad_financial_content_are_not_retried(self):
        for missing in [True,False]:
            body=copy.deepcopy(self.body)
            if missing:del body['componentsByNameMap']['holdings']
            else:body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['holdingPercent']['value']=[30,20]
            calls=[]
            if missing:body['productId']=999
            def fetch(*args):calls.append(1);return json.dumps(body)
            with self.assertRaises(ValueError):collect_blackrock_complete(self.config,self.now,fetch,lambda _:None)
            self.assertEqual(len(calls),1)
