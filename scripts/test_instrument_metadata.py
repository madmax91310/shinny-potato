import datetime as dt
import json
import unittest
from collect_instrument_metadata import parse_text,parse_json,parse_listings,collect
class MetadataTests(unittest.TestCase):
    ISIN='IE00B4L5Y983'
    def test_amundi_official_explicit_pea_false_is_exact_share_evidence(self):
        from pathlib import Path
        body=Path(__file__).with_name('fixtures').joinpath('official-documents','amundi-explicit-pea-LU3038520774.json').read_bytes()
        self.assertFalse(parse_json(body,'LU3038520774')['pea'])
        with self.assertRaises(ValueError): parse_json(body,'LU0000000000')
        doc=json.loads(body); facts=doc['products'][0]['characteristics']
        for absent in (None,'false','true','No',0,1,{},[]):
            facts['FUND_PEA']=absent
            self.assertNotIn('pea',parse_json(json.dumps(doc).encode(),'LU3038520774'))
        del facts['FUND_PEA']
        self.assertNotIn('pea',parse_json(json.dumps(doc).encode(),'LU3038520774'))
        facts['FUND_PEA']=True
        self.assertTrue(parse_json(json.dumps(doc).encode(),'LU3038520774')['pea'])
    def test_amundi_acquisition_requests_the_explicit_tax_characteristic(self):
        from unittest.mock import patch
        from collect_instrument_metadata import fetch_amundi
        with patch('collect_amundi_etf.fetch_api',return_value={}) as api:
            fetch_amundi('LU3038520774')
        payload=api.call_args.args[0]
        self.assertEqual(payload['productIds'],['LU3038520774'])
        self.assertIn('FUND_PEA',payload['characteristics'])
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
    def test_french_issuer_page_pea_field(self):
        # BlackRock France product pages: « Régime fiscal PEA » followed by Oui, or a dash when undocumented.
        self.assertTrue(parse_text(self.ISIN+'\nRégime fiscal PEA\nOui\n',self.ISIN)['pea'])
        self.assertFalse(parse_text(self.ISIN+'\nRégime fiscal PEA : Non\n',self.ISIN)['pea'])
        self.assertNotIn('pea',parse_text(self.ISIN+'\nRégime fiscal PEA\n-\n',self.ISIN))
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
        self.assertEqual(parse_json(body,'IE00BLNMYC90'),{'distribution':'Capitalizing','domicile':'Ireland','replicationMethod':'Direct Replication (physically)'})
        rows=parse_listings(body,{'isin':'IE00BLNMYC90'},'https://etf.dws.com/api/pdp/en-gb/etf/IE00BLNMYC90/pdpMetaTagsTealium','2026-10-18')
        self.assertIn(('ETFP','XDEW','EUR','XDEW.MI'),[(r['mic'],r['ticker'],r['currency'],r['symbol']) for r in rows])
        self.assertTrue(all(r['evidenceId'].startswith('IE00BLNMYC90-') for r in rows))
        # An unrelated NAV link is not product identity; exact facts remain mandatory.
        changed=body.replace(b'IE00BLNMYC90',b'IE00B4L5Y983',1)
        self.assertEqual(parse_listings(changed,{'isin':'IE00BLNMYC90'},'https://etf.dws.com','2026-10-18'),[{**r,'sha256':__import__('hashlib').sha256(changed).hexdigest(),'sourceUrl':'https://etf.dws.com'} for r in rows])
        with self.assertRaises(ValueError):parse_listings(body.replace(b'IE00BLNMYC90',b'IE00B4L5Y983'),{'isin':'IE00BLNMYC90'},'https://etf.dws.com','2026-10-18')
        wrong=json.loads(body)
        wrong['pdpResult']['pageSections']['keyFacts']['accordionItems'][0]['listBundle'][0]['items'][0]['value']=self.ISIN
        with self.assertRaises(ValueError):parse_listings(json.dumps(wrong).encode(),{'isin':'IE00BLNMYC90'},'https://etf.dws.com','2026-10-18')
    def test_dws_collateral_and_recommendations_cannot_change_product_listings(self):
        from pathlib import Path
        from copy import deepcopy
        doc=json.loads(Path(__file__).with_name('fixtures').joinpath('official-documents','dws-exact-share.json').read_bytes())
        isin='IE00BLNMYC90';url='https://etf.dws.com/api/pdp/en-gb/etf/'+isin+'/pdpMetaTagsTealium'
        parse=lambda value:parse_listings(json.dumps(value).encode(),{'isin':isin},url,'2026-10-18')
        expected=[(r['mic'],r['ticker'],r['currency'],r['symbol']) for r in parse(doc)]
        sections=doc['pdpResult']['pageSections']
        unrelated=deepcopy(sections['keyFacts']['accordionItems'][3])
        unrelated['table']['values'][0]['BloombergTicker']['value']='FOREIGN GY'
        sections['securityKeyFacts']={'isin':self.ISIN,'table':unrelated['table']}
        sections['topProducts']={'cards':[{'isin':'IE00BP3QZ601','table':unrelated['table']}]}
        self.assertEqual([(r['mic'],r['ticker'],r['currency'],r['symbol']) for r in parse(doc)],expected)
        self.assertEqual(parse_json(json.dumps(doc).encode(),isin),{'distribution':'Capitalizing','domicile':'Ireland','replicationMethod':'Direct Replication (physically)'})
        doc['pdpResult']['pageFrame']={'productHeader':{'identifier':[{'key':'ISIN','value':self.ISIN}]}}
        with self.assertRaisesRegex(ValueError,'header identity'):parse(doc)
        doc['pdpResult']['pageFrame']['productHeader']['identifier'][0]['value']=isin
        doc['tealium']={'attributes':{'product_id':self.ISIN}}
        with self.assertRaisesRegex(ValueError,'product identity'):parse(doc)
        del doc['tealium']
        basic=sections['keyFacts']['accordionItems'][0]
        basic['listBundle'][0]['items'].append({'key':'ISIN','value':self.ISIN})
        with self.assertRaisesRegex(ValueError,'Ambiguous'):parse(doc)
        basic['listBundle'][0]['items'].pop()
        sections['keyFacts']['accordionItems'].append(deepcopy(basic))
        with self.assertRaisesRegex(ValueError,'multiple DWS'):parse(doc)
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
        def consent(url,return_source=False):raise ValueError('Expected official PDF at '+url+'; received VanEck France | ETF Provider')
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
    def test_french_language_vaneck_factsheet_is_read_through_english_gates(self):
        from unittest.mock import patch
        import subprocess
        import collect_instrument_metadata as module
        def consent(url,return_source=False):raise ValueError('Expected official PDF at '+url+'; received VanEck France')
        calls=[]
        def run(cmd,**kwargs):
            calls.append(cmd[-1])
            if '/nl/en/' in cmd[-1]:return subprocess.CompletedProcess(cmd,0,stdout=b'%PDF-1.7 fixture',stderr=b'')
            return subprocess.CompletedProcess(cmd,1,stdout=b'',stderr=b'Error: Official VanEck regional gate still active')
        french='https://www.vaneck.com/fr/fr/library/fact-sheets/nucl-fact-sheet.pdf'
        with patch.object(module,'download',consent),patch.object(module.subprocess,'run',run):
            self.assertEqual(module.fetch_document(french,module.download),(b'%PDF-1.7 fixture','https://www.vaneck.com/nl/en/library/fact-sheets/nucl-fact-sheet.pdf'))
        # The browser helper only accepts English regional documents: /fr/fr/ is never passed to it.
        self.assertEqual(calls,['https://www.vaneck.com/fr/en/library/fact-sheets/nucl-fact-sheet.pdf','https://www.vaneck.com/nl/en/library/fact-sheets/nucl-fact-sheet.pdf'])
    def test_vaneck_factsheet_layout(self):
        import re
        import collect_instrument_metadata as module
        fixtures=module.ROOT/'scripts/fixtures'
        cases={'official-documents/presentation-six/gdx-full.txt':('IE00BQQP9F84','Accumulating','Ireland'),
               'presentation-performance/qntm.txt':('IE0007Y8Y157','Accumulating','Ireland'),
               'official-documents/vaneck-tdiv-facts.txt':('NL0011683594','Distributing','Netherlands')}
        for path,(isin,distribution,domicile) in cases.items():
            with self.subTest(path=path):
                self.assertEqual(parse_text((fixtures/path).read_text(),isin),{'distribution':distribution,'domicile':domicile,'replicationMethod':'Physical (Full replication)'})
        text=(fixtures/'official-documents/presentation-six/gdx-full.txt').read_text()
        src={'isin':'IE00BQQP9F84','listings':[{'ticker':'G2X','mic':'XETR','exchange':'Xetra','currency':'EUR'},{'ticker':'GDX','mic':'XLON','exchange':'London Stock Exchange','currency':'USD'},{'ticker':'GDX','mic':'XETR','exchange':'Xetra','currency':'EUR'}]}
        from unittest.mock import patch
        with patch.object(module,'text_of',lambda body:text):
            rows=parse_listings(b'%PDF-fixture',src,'https://www.vaneck.com/nl/en/library/fact-sheets/gdx-fact-sheet.pdf','2026-10-18')
        # GDX trades on Xetra as G2X: the Xetra row is not attributed to the GDX ticker.
        self.assertEqual([r['evidenceId'] for r in rows],['IE00BQQP9F84-XETR-G2X-EUR','IE00BQQP9F84-XLON-GDX-USD'])
    def test_issuer_routes_come_from_the_shared_registry(self):
        from issuer_routes import vaneck_factsheet_candidates, ROUTES
        url='https://www.vaneck.com/fr/en/library/fact-sheets/smh-fact-sheet.pdf'
        self.assertEqual(vaneck_factsheet_candidates(url),[url]+[f'https://www.vaneck.com/{r}/en/library/fact-sheets/smh-fact-sheet.pdf' for r in ROUTES['vaneck']['factsheetRegions']])
        self.assertEqual(len(vaneck_factsheet_candidates('https://www.vaneck.com/nl/en/library/fact-sheets/smh-fact-sheet.pdf')),2)
        gdig='https://www.vaneck.com/ucits/library/fact-sheets/gdig-fact-sheet.pdf'
        self.assertEqual(vaneck_factsheet_candidates(gdig),[gdig]+[f'https://www.vaneck.com/{r}/en/library/fact-sheets/gdig-fact-sheet.pdf' for r in ('dk','nl','uk')])
    def test_mirror_documents_never_produce_listings(self):
        src={'isin':self.ISIN,'listings':[{'ticker':'TEST','mic':'XLON','exchange':'London Stock Exchange','currency':'USD'}]}
        body=(self.ISIN+'<table><tr><td>London Stock Exchange</td><td>TEST</td><td>USD</td></tr></table>').encode()
        self.assertEqual(parse_listings(body,src,'https://swissfunddata.ch/sfdpub/docs/x.pdf','2026-10-18'),[])
        self.assertEqual(parse_listings(body,src,'https://dokumenty.analizy.pl/pobierz/etf/X/KA/2026-09-30','2026-10-18'),[])
        self.assertEqual(len(parse_listings(body,src,'https://www.ishares.com/doc','2026-10-18')),1)
if __name__=='__main__':unittest.main()

