import unittest,datetime as dt
from collect_dca_equities import parse
class DcaEquities(unittest.TestCase):
    def body(self):
        values={'asOfDate':20261013,'issueName':['APPLE','MICROSOFT'],'holdingPercent':[50,50],'isin':['US0378331005','US5949181045'],'countryOfRisk':['United States','United States'],'sectorName':['Information Technology','Information Technology'],'assetClass':['Equity','Equity']}
        return {'productId':'251882','currencyCode':'USD','componentsByNameMap':{'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':{'isin':{'value':'IE00B4L5Y983'}}}}},'holdings':{'containersByNameMap':{'all':{'dataPointsByNameMap':{k:{'value':v} for k,v in values.items()}}}}}}
    def test_exact_identity(self):
        records,missing=parse(self.body(),{'apple':'US0378331005','other':'XX0000000000'},dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
        self.assertEqual(missing,['other']);self.assertEqual(records['apple']['countries']['rows'][0]['weightPct'],100)
        self.assertEqual(records['apple']['sectors']['compatibility'],'gics')
    def test_wrong_share(self):
        b=self.body();b['productId']='bad'
        with self.assertRaises(ValueError):parse(b,{'apple':'US0378331005'},dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
    def test_unqualified_sector(self):
        b=self.body();b['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['sectorName']['value'][0]='Unknown'
        records,missing=parse(b,{'apple':'US0378331005'},dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
        self.assertEqual(records,{});self.assertEqual(missing,['apple'])
if __name__=='__main__':unittest.main()

class CompleteHoldings(unittest.TestCase):
    def test_identity_and_partial_security_list(self):
        from collect_dca_complete_holdings import parse_complete
        b=DcaEquities().body()
        facts=b['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        facts.update(productStructure={'value':'Physical'},assetClass={'value':'Equity'})
        p=b['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        for k,v in {'ticker':['AAPL','MSFT'],'marketCurrencyCode':['USD','USD'],'exchange':['NASDAQ','NASDAQ']}.items():p[k]={'value':v}
        url='https://www.blackrock.com/product-data/api/v2/get-product-data?portfolioId=251882'
        h,securities=parse_complete(b,'IE00B4L5Y983',url,dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
        self.assertTrue(h['complete']);self.assertEqual(len(securities),2)
        self.assertEqual(h['compositionFacts']['asOf'],h['asOf'])
        self.assertEqual(h['compositionFacts']['countries']['rows'],[{'name':'United States','weightPct':100}])
        p['holdingPercent']['value']=[49.8,50]
        h,_=parse_complete(b,'IE00B4L5Y983',url,dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
        self.assertEqual(h['compositionFacts']['sectors']['rows'][0]['weightPct'],99.8, 'Partial equity sleeve is never normalized')
        p['sectorName']['value'][0]='Unknown'
        h,_=parse_complete(b,'IE00B4L5Y983',url,dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
        self.assertNotIn('compositionFacts',h, 'Incomplete classification cannot qualify a same-date visual')

        with self.assertRaises(ValueError):parse_complete(b,'IE00B5BMR087',url,dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
        facts['productStructure']['value']='Synthetic'
        with self.assertRaises(ValueError):parse_complete(b,'IE00B4L5Y983',url,dt.datetime(2026,10,15,tzinfo=dt.timezone.utc))
