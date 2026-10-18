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
        rows=parse_listings(valid,src,'https://www.ishares.com/doc','2026-10-17')
        self.assertEqual(rows[0]['evidenceId'],self.ISIN+'-XLON-TEST-USD')
        invalid=(self.ISIN+'<table><tr><td>London Stock Exchange TEST</td></tr><tr><td>USD</td></tr></table>').encode()
        self.assertEqual(parse_listings(invalid,src,'https://www.ishares.com/doc','2026-10-17'),[])
    def test_amundi_api_metadata_and_listings_are_exact(self):
        payload={'products':[{'productId':self.ISIN,'characteristics':{'ISIN':self.ISIN,'DISTRIBUTION_POLICY':'Capitalisation','FUND_REPLICATION_METHODOLOGY':'Indirect (Swap Based)',
            'LISTINGS':[{'exchangePlace':'Euronext Paris','tradingCurrency':'EUR','ticker':'PAASI FP','ric':'PAASI.PA'},{'exchangePlace':'LSE','tradingCurrency':'USD','ticker':'PAAS LN','ric':'PAAS.L'},{'exchangePlace':'Bolsa Mexicana','tradingCurrency':'MXN','ticker':'PAASIN MM','ric':'PAASIN.MX'}]}}]}
        body=json.dumps(payload).encode()
        self.assertEqual(parse_json(body,self.ISIN),{'distribution':'Capitalisation','replicationMethod':'Indirect (Swap Based)'})
        rows=parse_listings(body,{'isin':self.ISIN},'https://www.amundietf.fr/mapi/ProductAPI/getProductsData','2026-10-18')
        self.assertEqual([(r['mic'],r['ticker'],r['currency'],r['symbol']) for r in rows],[('XPAR','PAASI','EUR','PAASI.PA'),('XLON','PAAS','USD','PAAS.L')])
        self.assertEqual(rows[0]['evidenceId'],self.ISIN+'-XPAR-PAASI-EUR');self.assertEqual(rows[0]['exchange'],'Euronext Paris')
        payload['products'][0]['characteristics']['ISIN']='IE00BP3QZ601'
        with self.assertRaises(ValueError):parse_json(json.dumps(payload).encode(),self.ISIN)
        with self.assertRaises(ValueError):parse_listings(json.dumps(payload).encode(),{'isin':self.ISIN},'https://www.amundietf.fr/mapi/ProductAPI/getProductsData','2026-10-18')
    def test_dws_product_page_exchange_table(self):
        from pathlib import Path
        body=Path(__file__).with_name('fixtures').joinpath('official-documents','dws-exact-share.json').read_bytes()
        self.assertEqual(parse_json(body,'IE00BLNMYC90'),{})
        rows=parse_listings(body,{'isin':'IE00BLNMYC90'},'https://etf.dws.com/api/pdp/en-gb/etf/IE00BLNMYC90/pdpMetaTagsTealium','2026-10-18')
        self.assertIn(('ETFP','XDEW','EUR','XDEW.MI'),[(r['mic'],r['ticker'],r['currency'],r['symbol']) for r in rows])
        self.assertTrue(all(r['evidenceId'].startswith('IE00BLNMYC90-') for r in rows))
        with self.assertRaises(ValueError):parse_listings(body.replace(b'IE00BLNMYC90',b'IE00B4L5Y983',1),{'isin':'IE00BLNMYC90'},'https://etf.dws.com','2026-10-18')
    def test_factsheet_venue_abbreviations_share_the_row(self):
        src={'isin':self.ISIN,'listings':[{'ticker':'ANAU','mic':'XPAR','exchange':'Euronext Paris','currency':'EUR','symbol':'ANAU.PA'}]}
        body=(self.ISIN+'<table><tr><td>EURONEXT P</td><td>EUR</td><td>ANAU FP</td></tr></table>').encode()
        rows=parse_listings(body,src,'https://www.ishares.com/doc','2026-10-18')
        self.assertEqual((rows[0]['evidenceId'],rows[0]['symbol']),(self.ISIN+'-XPAR-ANAU-EUR','ANAU.PA'))
    def test_structured_identity(self):
        def doc(isin):return json.dumps({'componentsByNameMap':{'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':{'isin':{'value':isin},'domicile':{'value':'Ireland'}}}}}}}).encode()
        self.assertEqual(parse_json(doc(self.ISIN),self.ISIN),{'domicile':'Ireland'})
        with self.assertRaises(ValueError):parse_json(doc('IE00BP3QZ601'),self.ISIN)
    def test_renewal_grace_matches_active_field_freshness(self):
        import collect_instrument_metadata as module
        now=dt.datetime(2026,10,17,tzinfo=dt.timezone.utc)
        self.assertFalse(module.renewal_overdue({'checkedAt':'2026-10-10'},now))
        self.assertTrue(module.renewal_overdue({'checkedAt':'2026-10-09'},now))
        for broken in [{},{'checkedAt':None},{'checkedAt':'unknown'}]:
            self.assertTrue(module.renewal_overdue(broken,now))
        # Static legal characteristics tolerate a long issuer outage, but not forever.
        self.assertFalse(module.renewal_overdue({'checkedAt':'2026-01-01'},now,'domicile'))
        self.assertTrue(module.renewal_overdue({'checkedAt':'2025-10-16'},now,'replicationMethod'))
        self.assertTrue(module.renewal_overdue({'checkedAt':'2026-10-09'},now,'pea'))
        self.assertTrue(module.renewal_overdue({},now,'domicile'))
        freshness=(module.ROOT/'scripts/report-asset-fields.mjs').read_text()
        self.assertEqual(module.RENEWAL_GRACE_DAYS,7)
        self.assertIn('freshness(etfFreshnessKey(field))',freshness)
        self.assertEqual(module.STATIC_RENEWAL_DAYS,{'domicile':365,'replicationMethod':365})
    def test_vaneck_consent_page_uses_browser_download_only_for_official_factsheets(self):
        from unittest.mock import patch
        import subprocess
        import collect_instrument_metadata as module
        def consent(url):raise ValueError('Expected official PDF at '+url+'; received VanEck France | ETF Provider')
        calls=[]
        # US runners are sent to the US site by the French gate; the Dutch gate succeeds.
        def run(cmd,**kwargs):
            calls.append(cmd[-1])
            if '/nl/en/' in cmd[-1]:return subprocess.CompletedProcess(cmd,0,stdout=b'%PDF-1.7 fixture',stderr=b'')
            return subprocess.CompletedProcess(cmd,1,stdout=b'',stderr=b'Error: Official VanEck regional gate still active')
        official='https://www.vaneck.com/fr/en/library/fact-sheets/smh-fact-sheet.pdf'
        dutch='https://www.vaneck.com/nl/en/library/fact-sheets/smh-fact-sheet.pdf'
        with patch.object(module,'download',consent),patch.object(module.subprocess,'run',run):
            self.assertEqual(module.fetch_document(official,module.download),(b'%PDF-1.7 fixture',dutch))
            with self.assertRaisesRegex(ValueError,'Expected official PDF'):
                module.fetch_document('https://www.vaneck.com/fr/en/other.pdf',module.download)
        self.assertEqual(calls,[official,dutch])
        calls.clear()
        def blocked(cmd,**kwargs):
            calls.append(cmd[-1]);return subprocess.CompletedProcess(cmd,1,stdout=b'',stderr=b'Error: gate')
        with patch.object(module,'download',consent),patch.object(module.subprocess,'run',blocked):
            with self.assertRaisesRegex(ValueError,'browser initialisation failed.*uk/en'):
                module.fetch_document(official,module.download)
        self.assertEqual(len(calls),3)
        with self.assertRaisesRegex(ValueError,'Expected official PDF'):
            module.fetch_document(official,consent)  # injected fetchers are never escalated to a browser
    def test_issuer_routes_come_from_the_shared_registry(self):
        from issuer_routes import vaneck_factsheet_candidates, ROUTES
        url='https://www.vaneck.com/fr/en/library/fact-sheets/smh-fact-sheet.pdf'
        self.assertEqual(vaneck_factsheet_candidates(url),[url]+[f'https://www.vaneck.com/{r}/en/library/fact-sheets/smh-fact-sheet.pdf' for r in ROUTES['vaneck']['factsheetRegions']])
        self.assertEqual(len(vaneck_factsheet_candidates('https://www.vaneck.com/nl/en/library/fact-sheets/smh-fact-sheet.pdf')),2)
    def test_mirror_documents_never_produce_listings(self):
        src={'isin':self.ISIN,'listings':[{'ticker':'TEST','mic':'XLON','exchange':'London Stock Exchange','currency':'USD'}]}
        body=(self.ISIN+'<table><tr><td>London Stock Exchange</td><td>TEST</td><td>USD</td></tr></table>').encode()
        self.assertEqual(parse_listings(body,src,'https://swissfunddata.ch/sfdpub/docs/x.pdf','2026-10-18'),[])
        self.assertEqual(parse_listings(body,src,'https://dokumenty.analizy.pl/pobierz/etf/X/KA/2026-09-30','2026-10-18'),[])
        self.assertEqual(len(parse_listings(body,src,'https://www.ishares.com/doc','2026-10-18')),1)
if __name__=='__main__':unittest.main()
