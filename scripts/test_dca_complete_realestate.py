"""Listed property funds must be explicitly qualified, without accepting swaps or bonds."""
import datetime as dt
import unittest
from collect_dca_complete_holdings import parse_complete

class CompleteRealEstate(unittest.TestCase):
    def body(self):
        points = {k: {'value': v} for k,v in {
            'asOfDate': 20261015, 'isin': ['US0378331005','US5949181045'],
            'issueName':['First listed company','Second listed company'], 'holdingPercent':[60,40],
            'assetClass':['Equity','Equity'], 'countryOfRisk':['United States']*2,
            'sectorName':['Real Estate']*2, 'ticker':['ONE','TWO'],
            'marketCurrencyCode':['USD']*2, 'exchange':['NYSE']*2}.items()}
        facts={k:{'value':v} for k,v in {'isin':'IE00B0M63284','productStructure':'Physical','assetClass':'Real Estate'}.items()}
        return {'productId':251808,'currencyCode':'EUR','componentsByNameMap':{
            'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':facts}}},
            'holdings':{'containersByNameMap':{'all':{'dataPointsByNameMap':points}}}}}
    def parse(self, body, kind='Real Estate'):
        return parse_complete(body,'IE00B0M63284','https://www.blackrock.com/?portfolioId=251808',dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),kind)
    def test_explicit_qualification_and_weights(self):
        result,_=self.parse(self.body())
        self.assertTrue(result['complete']);self.assertEqual(sum(r['weightPct'] for r in result['rows']),100)
        with self.assertRaises(ValueError):self.parse(self.body(),'Equity')
    def test_wrong_identity_structure_and_partial_portfolio(self):
        for key,value in [('isin','WRONG'),('productStructure','Swap'),('assetClass','Fixed Income')]:
            body=self.body();body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap'][key]['value']=value
            with self.assertRaises(ValueError):self.parse(body)
        for weights in ([60,20],[110,-10],[60,float('nan')]):
            body=self.body();body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['holdingPercent']['value']=weights
            with self.assertRaises(ValueError):self.parse(body)
