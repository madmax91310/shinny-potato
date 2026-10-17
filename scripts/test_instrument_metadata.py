import datetime as dt
import json
import unittest
from collect_instrument_metadata import parse_text,parse_json,parse_listings,collect
class MetadataTests(unittest.TestCase):
    ISIN='IE00B4L5Y983'
    def test_explicit_fields_and_negatives(self):
        text=self.ISIN+'\nEligible PEA: Non\nCurrency Hedged: No\nUse of Income: Accumulating\nDomicile: Ireland\nReplication: Physical'
        r=parse_text(text,self.ISIN)
        self.assertFalse(r['pea']);self.assertFalse(r['currencyHedge'])
        self.assertEqual(r['distribution'],'Accumulating');self.assertEqual(r['domicile'],'Ireland')
    def test_no_inference_from_product_name_or_navigation(self):
        self.assertEqual(parse_text(self.ISIN+'\nWorld Swap PEA ETF\nInvest with your PEA',self.ISIN),{})
    def test_identity_and_conflicts_rejected(self):
        for text in ['PEA eligibility: Yes',self.ISIN+' IE00BP3QZ601\nEligible PEA: Yes',self.ISIN+'\nEligible PEA: Yes\nEligible PEA: No']:
            with self.assertRaises(ValueError):parse_text(text,self.ISIN)
    def test_unavailable_source_never_renews_a_value(self):
        def fail(url):raise ValueError('HTTP 403')
        values,errors=collect({'isin':self.ISIN,'urls':['https://issuer.test']},dt.datetime(2026,10,17,tzinfo=dt.timezone.utc),fail)
        self.assertFalse(values);self.assertIn('403',errors[0]['error'])
    def test_disagreeing_sources_do_not_publish_pea(self):
        values,_=collect({'isin':self.ISIN,'urls':['one','two']},dt.datetime(2026,10,17,tzinfo=dt.timezone.utc),lambda u:(self.ISIN+'\nEligible PEA: '+('Yes' if u=='one' else 'No')).encode())
        self.assertNotIn('pea',values)
    def test_explicit_pea_badge_is_distinct_from_name(self):
        self.assertTrue(parse_text(self.ISIN+'\nÉligible au PEA\n',self.ISIN)['pea'])
        self.assertNotIn('pea',parse_text(self.ISIN+' PEA World',self.ISIN))
    def test_listing_tokens_must_share_a_table_row(self):
        src={'isin':self.ISIN,'listings':[{'ticker':'TEST','mic':'XLON','exchange':'London Stock Exchange','currency':'USD'}]}
        valid=(self.ISIN+'<table><tr><td>London Stock Exchange</td><td>TEST</td><td>USD</td></tr></table>').encode()
        rows=parse_listings(valid,src,'https://issuer.test','2026-10-17')
        self.assertEqual(rows[0]['evidenceId'],self.ISIN+'-XLON-TEST-USD')
        invalid=(self.ISIN+'<table><tr><td>London Stock Exchange TEST</td></tr><tr><td>USD</td></tr></table>').encode()
        self.assertEqual(parse_listings(invalid,src,'https://issuer.test','2026-10-17'),[])
    def test_structured_identity(self):
        def doc(isin):return json.dumps({'componentsByNameMap':{'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':{'isin':{'value':isin},'domicile':{'value':'Ireland'}}}}}}}).encode()
        self.assertEqual(parse_json(doc(self.ISIN),self.ISIN),{'domicile':'Ireland'})
        with self.assertRaises(ValueError):parse_json(doc('IE00BP3QZ601'),self.ISIN)
if __name__=='__main__':unittest.main()
