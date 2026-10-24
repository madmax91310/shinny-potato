"""Regression coverage for oversized diagnostics and exact listing renewals."""
import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import collect_instrument_metadata as metadata
from refresh_monthly_history import monitoring_report
from publish_automation_status import read_report_safely, normalize_report

class Renewals(unittest.TestCase):
    def test_large_price_payload_does_not_enter_monitoring_report(self):
        report={'checkedAt':'2026-10-19','series':[
            {'id':'ok','status':'validated','record':{'periodEnd':'2026-09','points':[[1,2]]*10000},
             'evidence':{'rawResponse':'x'*9000000,'responseSha256':'digest'}},
            {'id':'bad','status':'failed','reason':'source timeout'}]}
        compact=monitoring_report(report)
        self.assertLess(len(json.dumps(compact)),500)
        self.assertEqual(normalize_report(compact),normalize_report(report))
        self.assertEqual(compact['series'][0]['responseSha256'],'digest')
        self.assertIn('rawResponse',report['series'][0]['evidence'])

    def test_oversized_report_is_an_incident_then_recovers(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'monthly-observation.json'
            with path.open('wb') as f:f.truncate(523898629)
            bad=read_report_safely(path,'update-market-monthly.yml')
            self.assertEqual(bad['errors'][0]['id'],'report-read:monthly-observation')
            path.write_text(json.dumps({'series':[{'id':'ok','status':'validated'}]}))
            good=read_report_safely(path,'update-market-monthly.yml')
            self.assertTrue(any(r['id']=='report-read:monthly-observation' and len(r['evidence']['sha256'])==64 for r in good['successes']))
            self.assertIn({'id':'history:ok'},good['successes'])
            self.assertEqual(good['errors'],[])

    def test_explicit_foreign_and_french_pea_labels(self):
        isin='IE00B3YLTY66'
        self.assertFalse(metadata.parse_text(isin+"\nPEA berechtigt\nKeine",isin)['pea'])
        self.assertFalse(metadata.parse_text(isin+"\nEligibilité au plan d'Epargne en Actions (PEA):\nNon",isin)['pea'])
        self.assertNotIn('pea',metadata.parse_text(isin+"\nISA Eligibility Yes",isin))
        self.assertFalse(metadata.parse_text(isin+'\nPEA Eligible No',isin)['pea'])

    def test_globalx_streamed_rows_belong_to_their_exact_share(self):
        isin='IE00BM8R0J59'; other='IE00BM8R0H36'
        header='<thead><tr><th>Exchange</th><th>Trading Currency</th><th>Ticker</th></tr></thead>'
        body=(f'<div><h2>USD Accumulating (ISIN: {other})</h2><table>{header}'
              '<tr><td>Xetra</td><td>EUR</td><td>WRONG GY</td></tr></table></div>'
              f'<div><h2>USD Distributing (ISIN: {isin})</h2><table>{header}'
              '<tbody><template id="P:24"></template></tbody></table></div>'
              '<table hidden><tbody id="S:24"><tr><td>Deutsche Börse Xetra</td><td>EUR</td><td>QYLE GY</td></tr></tbody></table>'
              '<script>$RS("S:24","P:24")</script>').encode()
        rows=metadata.globalx_listing_rows(body,isin)
        self.assertEqual([(r['ticker'],r['currency']) for r in rows],[('QYLE','EUR')])
        self.assertNotIn('symbol',rows[0])
        with self.assertRaises(ValueError):metadata.globalx_listing_rows(body.replace(b'P:24"',b'P:25"',1),isin)
        with self.assertRaises(ValueError):metadata.globalx_listing_rows(body.replace(other.encode(),isin.encode()),isin)

    def test_listing_without_quote_provider_symbol_is_still_documented(self):
        isin='IE00B66F4759'
        doc={'componentsByNameMap':{'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':{'isin':{'value':isin}}}}},
             'listings':{'containersByNameMap':{'default':{'dataPointsByNameMap':{k:{'value':v} for k,v in {
                 'exchange':['Bolsa Mexicana De Valores'],'ticker':['IHYG'],'currencyCode':['MXN'],'ric':[None]}.items()}}}}}}
        rows=metadata.parse_listings(json.dumps(doc).encode(),{'isin':isin},'https://www.blackrock.com/data','2026-10-19')
        self.assertEqual(rows[0]['mic'],'XMEX');self.assertNotIn('symbol',rows[0])

    def test_vanguard_discovers_listings_without_seed_tickers(self):
        text=('IE00BK5BQX27\nKey ETF facts   Exchange ticker   SEDOL   Reuters   Bloomberg\n'
              'London Stock Exchange\nGBP  VEUA  BJSBDC0  VEUA.L  VEUA LN\n'
              'USD  VWCG  BJSB5S0  VWCG.L  VWCG LN\n'
              'NYSE Euronext\nEUR  VWCG  BQB3BT5  VWCG.AS  VWCG NA\nBase currency EUR')
        rows=metadata.vanguard_listing_rows(text,'IE00BK5BQX27')
        self.assertEqual([(r['mic'],r['currency']) for r in rows],[('XLON','GBP'),('XLON','USD'),('XAMS','EUR')])
        with self.assertRaises(ValueError):metadata.vanguard_listing_rows(text.replace('VWCG.AS','VWCG.DE'),'IE00BK5BQX27')
        with self.assertRaises(ValueError):metadata.vanguard_listing_rows(text+'\nIE00B4L5Y983','IE00BK5BQX27')

    def test_multishare_pdf_requires_identity_on_same_listing_row(self):
        isin='IE00BF0M2Z96';other='IE00B4L5Y983'
        source={'isin':isin,'listings':[{'ticker':'BATT','mic':'ETFP','exchange':'Borsa Italiana','currency':'EUR'}]}
        url='https://www.borsaitaliana.it/fund.pdf'
        text=f'{other}\nBorsa Italiana EUR {isin} BATT IM BATT.MI\n'
        with patch.object(metadata,'text_of',return_value=text):
            self.assertEqual(len(metadata.parse_listings(b'%PDF-fixture',source,url,'2026-10-19')),1)
        with patch.object(metadata,'text_of',return_value=f'{isin}\nBorsa Italiana EUR {other} BATT IM BATT.MI'):
            self.assertEqual(metadata.parse_listings(b'%PDF-fixture',source,url,'2026-10-19'),[])

    def test_vanguard_venue_above_currency_row(self):
        isin='IE00BK5BQT80';source={'isin':isin,'listings':[{'ticker':'VWCE','mic':'ETFP','exchange':'Borsa Italiana','currency':'EUR'}]}
        with patch.object(metadata,'text_of',return_value=isin+'\nBorsa Italiana S.p.A.\nEUR     VWCE    VWCE.MI\n'):
            rows=metadata.parse_listings(b'%PDF-fixture',source,'https://fund-docs.vanguard.com/fund.pdf','2026-10-19')
        self.assertEqual(len(rows),1)

    def test_complementary_tables_are_combined_without_reassigning_symbols(self):
        isin='IE00B4L5Y983';source={'isin':isin,'urls':['https://www.ishares.com/a','https://www.ishares.com/b'],
             'listings':[{'ticker':'A','mic':'XLON','exchange':'London Stock Exchange','currency':'USD'},
                         {'ticker':'B','mic':'XPAR','exchange':'Euronext Paris','currency':'EUR'}]}
        def fetch(url):
            row='London Stock Exchange USD A' if url.endswith('/a') else 'Euronext Paris EUR B'
            return (isin+'<table><tr><td>'+row+'</td></tr></table>').encode()
        values,errors=metadata.collect(source,dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),fetch)
        self.assertEqual({r['ticker'] for r in values['listings']['value']},{'A','B'})
        self.assertEqual(errors,[])

if __name__=='__main__':unittest.main()
