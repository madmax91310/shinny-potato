import copy,datetime as dt,json,unittest
from collect_dca_complete_holdings import collect_blackrock_complete
import test_dca_complete_realestate as fixtures

class Recovery(unittest.TestCase):
    def setUp(self):
        self.body=fixtures.CompleteRealEstate().body()
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
    def empty(self):
        body=copy.deepcopy(self.body)
        points=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        for key in ('asOfDate','issueName','holdingPercent','isin','countryOfRisk','assetClass'):
            points[key]['value']=None
        # The observed API response advertises hasData even with null columns.
        body['componentsByNameMap']['holdings']['hasData']=True
        return body
    def test_entirely_null_snapshot_retries_exact_url_and_retains_both_hashes(self):
        partial=self.empty();responses=iter([partial,self.body]);calls=[];pauses=[]
        def fetch(*args):calls.append(args[0]);return json.dumps(next(responses))
        record,_=collect_blackrock_complete(self.config,self.now,fetch,pauses.append)
        self.assertEqual(calls,[self.config['url']]*2);self.assertEqual(pauses,[2])
        self.assertEqual(record['asOf'],'2026-10-15')
        self.assertEqual([r['status']for r in record['sourceAttempts']],['empty-holdings-snapshot','validated'])
        self.assertNotEqual(record['sourceAttempts'][0]['sha256'],record['sha256'])
        self.assertEqual(record['sourceAttempts'][-1]['sha256'],record['sha256'])
        self.assertEqual(sum(r['weightPct']for r in record['rows']),100)
    def test_persistent_empty_snapshot_is_not_source_success(self):
        calls=[]
        def fetch(*args):calls.append(1);return json.dumps(self.empty())
        with self.assertRaisesRegex(ValueError,'empty after two bounded attempts'):
            collect_blackrock_complete(self.config,self.now,fetch,lambda _:None)
        self.assertEqual(len(calls),2)
    def test_only_the_latest_published_date_is_requested_and_returned(self):
        from urllib.parse import parse_qs,urlsplit
        partial=self.empty()
        partial['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['dateList']={'value':[20260930,20261015]}
        responses=iter([partial,partial,self.body]);calls=[]
        def fetch(*args):calls.append(args[0]);return json.dumps(next(responses))
        record,_=collect_blackrock_complete(self.config,self.now,fetch,lambda _:None)
        self.assertEqual(len(calls),3)
        self.assertEqual(calls[:2],[self.config['url']]*2)
        self.assertEqual(parse_qs(urlsplit(calls[2]).query)['asOfDate'],['20261015'])
        self.assertEqual(parse_qs(urlsplit(calls[2]).query)['component'],['holdings.all'])
        self.assertEqual(record['asOf'],'2026-10-15')
        self.assertEqual(record['sourceUrl'],calls[2])
        self.assertEqual(record['sourceAttempts'][-1]['requestedAsOfDate'],'20261015')
        self.assertEqual(record['identitySourceUrl'],self.config['url'])
        self.assertNotEqual(record['identitySha256'],record['sha256'])
    def test_wrong_returned_date_or_invalid_date_list_is_not_admitted(self):
        for dates in [[20261016],['not-a-date'],[20261015,20261015]]:
            partial=self.empty()
            partial['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['dateList']={'value':dates}
            responses=iter([partial,partial,self.body]);calls=[]
            def fetch(*args):calls.append(args[0]);return json.dumps(next(responses))
            with self.assertRaises(ValueError):collect_blackrock_complete(self.config,self.now,fetch,lambda _:None)
            self.assertEqual(len(calls),3 if dates==[20261016] else 2)
    def test_dated_book_identity_and_weights_still_require_independent_validation(self):
        for kind in ['product','currency','share','weights']:
            partial=self.empty()
            partial['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['dateList']={'value':[20261015]}
            dated=copy.deepcopy(self.body)
            if kind=='product':dated['productId']=999
            if kind=='currency':dated['currencyCode']='USD' if self.body['currencyCode']!='USD' else 'EUR'
            if kind=='share':dated['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['isin']['value']='WRONG'
            if kind=='weights':dated['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['holdingPercent']['value']=[30,20]
            responses=iter([partial,partial,dated]);calls=[]
            def fetch(*args):calls.append(args[0]);return json.dumps(next(responses))
            with self.assertRaises(ValueError):collect_blackrock_complete(self.config,self.now,fetch,lambda _:None)
            self.assertEqual(len(calls),3)
    def test_existing_requested_period_is_never_replaced_by_another_date(self):
        from urllib.parse import parse_qs,urlsplit
        partial=self.empty()
        partial['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['dateList']={'value':[20261015,20260930]}
        responses=iter([partial,self.body]);calls=[]
        def fetch(*args):calls.append(args[0]);return json.dumps(next(responses))
        url=self.config['url']+'&asOfDate=20260930'
        with self.assertRaisesRegex(ValueError,'requested published holdings snapshot'):
            collect_blackrock_complete({**self.config,'url':url},self.now,fetch,lambda _:None)
        self.assertEqual(calls,[url,url])
        self.assertEqual(parse_qs(urlsplit(calls[1]).query)['asOfDate'],['20260930'])
    def test_empty_wrong_identity_currency_or_changed_schema_never_retries(self):
        for kind in ['isin','product','currency','schema']:
            body=self.empty();calls=[]
            if kind=='isin':body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['isin']['value']='WRONG'
            if kind=='product':body['productId']=999
            if kind=='currency':body['currencyCode']='USD' if self.body['currencyCode']!='USD' else 'EUR'
            if kind=='schema':del body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['asOfDate']
            def fetch(*args):calls.append(1);return json.dumps(body)
            with self.assertRaises((ValueError,KeyError,TypeError)):
                collect_blackrock_complete({**self.config,'currency':self.body['currencyCode']},self.now,fetch,lambda _:None)
            self.assertEqual(len(calls),1)
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
