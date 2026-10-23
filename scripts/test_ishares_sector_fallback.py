import copy,datetime as dt,json,pathlib,unittest,math
from collect_etf_pilot import parse_share
from ishares_sector_fallback import sectors_from_complete_holdings
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Fallback(unittest.TestCase):
    def setUp(self):
        self.body=json.loads((ROOT/'scripts/fixtures/ishares-sp500-zero-sectors-20261022.json').read_text())
        self.share=next(s for s in json.loads((ROOT/'scripts/etf-pilot.json').read_text())['instruments']if s['isin']=='IE00B5BMR087')
        self.now=dt.datetime(2026,10,23,tzinfo=dt.timezone.utc)
    def primary(self,body):return body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']
    def points(self,body):return body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    def test_actual_dated_complete_portfolio_preserves_weights_and_warning(self):
        result=parse_share(self.body,self.share,self.now)
        self.assertEqual(result['sectors']['asOf'],'2026-10-22')
        self.assertEqual(result['sectors']['sourceComponent'],'holdings.all')
        self.assertAlmostEqual(sum(r['weightPct']for r in result['sectors']['rows']),99.99996)
        self.assertAlmostEqual(next(r['weightPct']for r in result['sectors']['rows']if r['name']=='Information Technology'),37.52611)
        self.assertTrue(result['collectionErrors'][0]['fallbackQualified'])
        self.assertEqual(len(result['sectors']['sha256']),64)
        with self.assertRaises(ValueError):parse_share(self.body,{k:v for k,v in self.share.items()if k!='sectorFallback'},self.now)
    def test_partial_primary_is_not_silently_replaced(self):
        self.primary(self.body)['dataPointsByNameMap']['fund']['value'][0]=10
        with self.assertRaises(ValueError):parse_share(self.body,self.share,self.now)
    def test_wrong_identity_currency_date_or_classification_is_rejected(self):
        for defect in ['identity','currency','date','sector','scope','partial']:
            b=copy.deepcopy(self.body);p=self.points(b)
            if defect=='identity':b['productId']=1
            if defect=='currency':b['currencyCode']='EUR'
            if defect=='date':p['asOfDate']['value']=20261021
            if defect=='sector':p['sectorName']['value'][0]='Unknown'
            if defect=='scope':p['assetClass']['value'][0]='Mutual Fund'
            if defect=='partial':p['holdingPercent']['value']=[w/2 for w in p['holdingPercent']['value']]
            with self.subTest(defect=defect),self.assertRaises(ValueError):parse_share(b,self.share,self.now)
    def test_signed_cash_is_retained_without_scaling(self):
        p=self.points(self.body);i=p['assetClass']['value'].index('Cash');difference=p['holdingPercent']['value'][i]+.2;p['holdingPercent']['value'][i]=-.2;p['holdingPercent']['value'][0]+=difference
        result=sectors_from_complete_holdings(self.body,self.share,self.now,self.primary(self.body))
        self.assertAlmostEqual(math.fsum(r['weightPct']for r in result['rows']),math.fsum(p['holdingPercent']['value']))
        self.assertLess(next(r['weightPct']for r in result['rows']if r['name']=='Cash and/or Derivatives'),0)

    def test_small_truncation_and_unexplained_weight_gap_are_rejected(self):
        for defect in ['count','gap']:
            b=copy.deepcopy(self.body);p=self.points(b)
            if defect=='count':
                index=p['assetClass']['value'].index('Equity')
                for point in p.values():
                    if isinstance(point.get('value'),list):point['value'].pop(index)
            else:p['holdingPercent']['value'][0]-=.1
            with self.subTest(defect=defect),self.assertRaises(ValueError):parse_share(b,self.share,self.now)
