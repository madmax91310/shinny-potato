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
