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
    def test_supplementary_exact_share(self):
        from collect_dca_equities import collect, SOURCE, SECONDARY_SOURCE
        primary=self.body()
        secondary=self.body()
        secondary['productId']='296576'
        secondary['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['isin']['value']='IE00BF4RFH31'
        fields=secondary['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        fields['isin']['value'][0]='US58506Q1094'
        fields['issueName']['value'][0]='MEDPACE HOLDINGS'
        fields['sectorName']['value'][0]='Health Care'
        calls=[]
        def fetch(url):
            calls.append(url)
            return primary if url==SOURCE else secondary
        now=dt.datetime(2026,10,15,tzinfo=dt.timezone.utc)
        records,missing=collect({'apple':'US0378331005','medpace':'US58506Q1094'},now,fetch)
        self.assertFalse(missing)
        self.assertEqual(calls,[SOURCE,SECONDARY_SOURCE])
        self.assertEqual(records['medpace']['sectors']['rows'],[{'name':'Health Care','weightPct':100}])
        self.assertEqual(records['medpace']['countries']['sourceUrl'],SECONDARY_SOURCE)
        self.assertEqual(records['medpace']['countries']['asOf'],'2026-10-13')
        calls.clear()
        collect({'apple':'US0378331005'},now,fetch)
        self.assertEqual(calls,[SOURCE])
        secondary['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['isin']['value']='WRONG'
        with self.assertRaises(ValueError):
            collect({'medpace':'US58506Q1094'},now,fetch)
    def test_medpace_real_captured_source(self):
        import gzip
        import json
        from pathlib import Path
        from collect_dca_equities import SECONDARY_SOURCE
        root=Path(__file__).resolve().parents[1]
        body=json.loads(gzip.decompress((root/'scripts/fixtures/qualified-cash-rights/IE00BF4RFH31.json.gz').read_bytes()))
        actual,missing=parse(body,{'medpace':'US58506Q1094'},dt.datetime(2026,11,13,tzinfo=dt.timezone.utc),
                             source=SECONDARY_SOURCE,source_isin='IE00BF4RFH31',product_id='296576')
        self.assertFalse(missing)
        stored=json.loads((root/'src/data/dca-equity-exposures.json').read_text())['medpace']
        # A real dated issuer response proves the classification, rather than an inferred country.
        self.assertEqual(actual['medpace']['countries']['rows'],stored['countries']['rows'])
        self.assertEqual(actual['medpace']['sectors']['rows'],stored['sectors']['rows'])
        self.assertEqual(actual['medpace']['countries']['asOf'],'2026-11-12')
        self.assertEqual(actual['medpace']['countries']['sourceUrl'],SECONDARY_SOURCE)
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
