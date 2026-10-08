"""Regressions for official index parsers and independent/atomic refreshes."""
import copy
import datetime as dt
import json
import pathlib
import unittest
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from unittest.mock import patch
from data_automation import UTC
from issuer_documents import document_date, validated_rows, pdf_text, download
from collect_index_documents import msci_composition, msci_returns, ftse_composition, ftse_returns
from refresh_index_sources import merge_records
from refresh_additional_etf import refresh
from collect_amundi_index_exposure import parse_product as amundi_index
from apply_etf_collection import merge_collection
from collect_vanguard_etf import parse_api as vanguard_api
from collect_dws_etf import parse_aum_workbook, parse_holdings as dws_holdings

ROOT=pathlib.Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,10,5,tzinfo=UTC)
CONFIG=json.loads((ROOT/'scripts/index-automation.json').read_text())['indices']

class Documents(unittest.TestCase):
    def config(self,id):return next(c for c in CONFIG if c['id']==id)
    def text(self,name):return (ROOT/'scripts/fixtures/official-documents'/name).read_text()
    def test_msci_tables_and_identity(self):
        text=self.text('msci-acwi.txt');config=self.config('acwi')
        facts=msci_composition(text,config,NOW)
        self.assertEqual(len(facts['holdings']),10)
        self.assertAlmostEqual(sum(v for _,v in facts['sectors']),100,delta=1)
        self.assertAlmostEqual(sum(v for _,v in facts['countries']),100,delta=1)
        self.assertTrue(all(y < 2026 for y,_ in msci_returns(text,config,NOW)))
        with self.assertRaises(ValueError):msci_composition(text,{**config,'name':'MSCI China'},NOW)
        with self.assertRaises(ValueError):msci_returns(text,{**config,'returnVariant':'NET'},NOW)
        with self.assertRaises(ValueError):msci_returns(text,{**config,'returnCurrency':'EUR'},NOW)
        with self.assertRaises(ValueError):msci_composition(text.replace('SECTOR WEIGHTS','BAD'),config,NOW)
    def test_ftse_tables_and_variant(self):
        text=self.text('ftse-all-world.txt');config=self.config('ftse-all-world')
        facts=ftse_composition(text,config,NOW)
        self.assertEqual(len(facts['holdings']),10)
        self.assertAlmostEqual(sum(v for _,v in facts['sectors']),100,delta=1)
        returns=ftse_returns(text,config,NOW)
        self.assertEqual({2021,2022,2023,2024,2025},{y for y,_ in returns if y>=2021})
        with self.assertRaises(ValueError):ftse_returns(text,{**config,'returnVariant':'NET'},NOW)
        with self.assertRaises(ValueError):ftse_returns(text,{**config,'returnCurrency':'EUR'},NOW)
    def test_document_redirect_keeps_issuer_cookie(self):
        class Issuer(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.headers.get('Cookie') != 'issuerRegion=eu':
                    self.send_response(302);self.send_header('Set-Cookie','issuerRegion=eu; Path=/')
                    self.send_header('Location','/factsheet.pdf');self.end_headers()
                else:
                    self.send_response(200);self.end_headers();self.wfile.write(b'%PDF-proof')
            def log_message(self,*args):pass
        server=HTTPServer(('127.0.0.1',0),Issuer)
        worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
        try:self.assertEqual(download(f'http://127.0.0.1:{server.server_port}/factsheet.pdf'),b'%PDF-proof')
        finally:server.shutdown();worker.join();server.server_close()
    def test_regional_landing_initialises_document_cookie(self):
        class Issuer(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/region':
                    self.send_response(200);self.send_header('Set-Cookie','issuerRegion=eu; Path=/');self.end_headers()
                    self.wfile.write(b'<html><title>Public region</title></html>')
                elif self.headers.get('Cookie') == 'issuerRegion=eu':
                    self.send_response(200);self.end_headers();self.wfile.write(b'%PDF-proof')
                else:
                    self.send_response(302);self.send_header('Location','/region');self.end_headers()
            def log_message(self,*args):pass
        server=HTTPServer(('127.0.0.1',0),Issuer)
        worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
        try:self.assertEqual(download(f'http://127.0.0.1:{server.server_port}/factsheet.pdf'),b'%PDF-proof')
        finally:server.shutdown();worker.join();server.server_close()
    def test_invalid_dates_pdf_and_truncated_allocations(self):
        for stamp in ['2026-10-06','2026-02-30','2020-01-01']:
            with self.assertRaises(ValueError):document_date(stamp,NOW)
        with self.assertRaises(ValueError):pdf_text(b'<html>consent</html>')
        with self.assertRaises(ValueError):validated_rows([{'name':'US','weightPct':40}])
        with self.assertRaises(ValueError):validated_rows([{'name':'US','weightPct':50}]*2)
    def test_index_merge_preserves_history_and_rejects_variant_change(self):
        facts={'asOf':'2026-08-31','constituents':100,'source':{'checkedAt':'2026-10-01'}}
        old={'a':{'facts':facts,'factsHistory':{'2026-08-31':copy.deepcopy(facts)}}}
        same={**facts,'source':{'checkedAt':'2026-10-05'}}
        self.assertEqual(merge_records(old,[{'id':'a','facts':same}]),old)
        self.assertEqual(merge_records(old,[{'id':'a','facts':{**facts,'asOf':'2026-07-31'}}]),old)
        revised={**facts,'constituents':101}
        merged=merge_records(old,[{'id':'a','facts':revised}])
        self.assertEqual(merged['a']['facts']['constituents'],101)
        self.assertEqual(merged['a']['factsHistory']['2026-08-31']['constituents'],100)
        self.assertEqual(old['a']['facts']['constituents'],100)
        returns={'asOf':'2026-08-31','currency':'USD','variant':'NET'}
        with self.assertRaises(ValueError):merge_records({'a':{'returns':returns}},[{'id':'a','returns':{**returns,'variant':'GROSS'}}])
    def test_etf_failure_preserves_previous_and_does_not_block_valid_source(self):
        config={'instruments':[{'isin':'ok','provider':'Test'},{'isin':'bad','provider':'Test'}]}
        previous={'bad':{'value':'retained'}}
        def collect(s,now):
            if s['isin']=='bad':raise ValueError('Wrong share identity')
            return {'isin':'ok'}
        with patch('refresh_additional_etf.merge_collection',return_value={'ok':{'value':'new'}}):
            merged,report=refresh(config,previous,{},NOW,collect)
        self.assertEqual(merged,{'bad':{'value':'retained'},'ok':{'value':'new'}})
        self.assertEqual([o['status'] for o in report['shares']],['validated','failed'])
        self.assertEqual(previous,{'bad':{'value':'retained'}})

class CompletedIssuerCoverage(unittest.TestCase):
    now = dt.datetime(2026, 10, 6, tzinfo=UTC)
    folder = ROOT / 'scripts/fixtures/official-documents'
    shares = json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']

    def fixture(self, name):
        return json.loads((self.folder/name).read_text())

    def share(self, isin):
        return next(s for s in self.shares if s['isin'] == isin)

    def test_amundi_uses_only_the_explicit_index_date_and_index_rows(self):
        p = self.fixture('amundi-index-share.json'); s = self.share(p['productId'])
        p['characteristics']['POSITION_AS_OF_DATE'] = '2026-10-05'
        p['characteristics']['FUND_BREAKDOWNS_AS_OF_DATE'] = '2026-10-05'
        r = amundi_index(p, s, self.now)
        self.assertEqual(r['holdings']['asOf'], '2026-10-02')
        self.assertEqual(r['sectors']['basis'], 'index')
        for defect in ['identity', 'index', 'date', 'method', 'missing', 'truncated']:
            bad = copy.deepcopy(p)
            if defect == 'identity': bad['characteristics']['ISIN'] = 'WRONG'
            if defect == 'index': bad['characteristics']['BENCHMARK_NAME'] = 'MSCI World'
            if defect == 'date': bad['characteristics'].pop('INDEX_BREAKDOWNS_AS_OF_DATE')
            if defect == 'method': bad['characteristics']['FUND_REPLICATION_METHODOLOGY'] = 'Direct(Physical)'
            if defect == 'missing': bad['breakDowns'] = []
            if defect == 'truncated': bad['breakDowns'][1]['breakDownData'] = bad['breakDowns'][1]['breakDownData'][:1]
            with self.subTest(defect=defect), self.assertRaises((ValueError, KeyError)):
                amundi_index(bad, s, self.now)

    def test_dow_index_exposure_preserves_share_characteristics(self):
        p = self.fixture('amundi-dow-index-share.json')
        share = self.share('FR0007056841')
        result = amundi_index(p, share, self.now)
        self.assertEqual(result['countries']['rows'], [{'name': 'United States', 'weightPct': 100.0}])
        self.assertEqual(len(result['holdings']['rows']), 10)
        self.assertEqual(result['sectors']['basis'], 'index')
        self.assertEqual(result['sectors']['asOf'], '2026-10-02')
        previous = json.loads((ROOT/'src/data/automated-etf.json').read_text())
        before = previous[share['isin']]
        merged = merge_collection({'checkedAt': self.now.isoformat(), 'shares': [result]}, previous, {})[share['isin']]
        for field in ['characteristics', 'fees', 'aum', 'performance', 'sourceUrl', 'productId']:
            if field in before:
                self.assertEqual(merged[field], before[field])
        for field in ['countries', 'sectors', 'holdings']:
            self.assertEqual(merged[field]['basis'], 'index')
        bad = copy.deepcopy(p)
        bad['characteristics']['BENCHMARK_NAME'] = 'Dow Jones Industrial Average Price Return'
        with self.assertRaises(ValueError):
            amundi_index(bad, share, self.now)

    def test_vanguard_calendar_years_exclude_rolling_periods_and_use_fund_countries(self):
        p = self.fixture('vanguard-exact-share.json'); s = self.share('IE00B3VVMM84')
        r = vanguard_api(p, s, self.now)
        self.assertEqual(r['unavailable'], [])
        self.assertEqual(set(r['performance']['years']), {str(y) for y in range(2020, 2026)})
        self.assertEqual(r['performance']['years']['2025'], 25.67)
        self.assertEqual(r['countries']['asOf'], '2026-08-31')
        self.assertAlmostEqual(sum(p['weightPct'] for p in r['countries']['rows']), 100, delta=.01)
        self.assertTrue(all(row['name'] for row in r['countries']['rows']))
        for key, value in [('fundCurrency', 'EUR'), ('portId', '9508')]:
            bad = copy.deepcopy(p); bad['data']['funds'][0]['profile'][key] = value
            with self.assertRaises(ValueError): vanguard_api(bad, s, self.now)
        bad = copy.deepcopy(p);bad['data']['funds'][0]['profile']['identifiers'][0]['altIdValue'] = 'WRONG'
        with self.assertRaises(ValueError): vanguard_api(bad, s, self.now)

    def test_vanguard_field_failure_is_independent_and_does_not_erase_previous_values(self):
        p = self.fixture('vanguard-exact-share.json'); s = self.share('IE00B3VVMM84')
        p['data']['funds'][0]['marketAllocation'] = []
        r = vanguard_api(p, s, self.now)
        self.assertIn('performance', r); self.assertNotIn('countries', r)
        p = self.fixture('vanguard-exact-share.json')
        points = p['data']['funds'][0]['performanceDetails']['items']['quarterlyReturns']['totalReturns']['items']
        points.append(copy.deepcopy(points[0]))
        r = vanguard_api(p, s, self.now)
        self.assertNotIn('performance', r); self.assertIn('countries', r)
        p = self.fixture('vanguard-exact-share.json')
        for row in p['data']['funds'][0]['marketAllocation']: row['date'] = '2020-01-01'
        r = vanguard_api(p, s, self.now)
        self.assertNotIn('countries', r); self.assertIn('performance', r)

    def test_dws_workbook_uses_actual_value_date_currency_and_fund_scope(self):
        body = (self.folder/'dws-history.xlsx').read_bytes()
        product = self.fixture('dws-exact-share.json'); share = self.share('IE00BLNMYC90')
        r = parse_aum_workbook(body, share, self.now, 'https://etf.dws.com/history', product)
        self.assertEqual(r['asOf'], '2026-10-02') # not the 06/10 export date
        self.assertEqual(r['scope'], 'fund'); self.assertEqual(r['currency'], 'USD')
        self.assertAlmostEqual(r['amount'], 15294969181.9763)
        with self.assertRaises(ValueError): parse_aum_workbook(body, {**share, 'currency':'EUR'}, self.now, '', product)
        with self.assertRaises(ValueError): parse_aum_workbook(body, {**share, 'isin':'WRONG'}, self.now, '', product)
        with self.assertRaises(ValueError): parse_aum_workbook(body, share, dt.datetime(2027,1,1,tzinfo=UTC), '', product)

    def test_dws_physical_portfolio_preserves_cash_and_unclassified_positions(self):
        p = self.fixture('dws-physical-holdings.json'); s = self.share('IE00BM67HK77')
        r = dws_holdings(p, s, self.now, s['sourceUrl'])
        self.assertEqual(r['holdings']['asOf'], '2026-10-02')
        self.assertEqual(len(r['holdings']['rows']), 10)
        sectors = {v['name']:v['weightPct'] for v in r['sectors']['rows']}
        self.assertIn('Unassigned', sectors); self.assertIn('Cash and/or Derivatives', sectors)
        self.assertAlmostEqual(sum(sectors.values()), 100, delta=.01)
        self.assertTrue(all(row['basis']=='fund' for row in r.values()))
        for defect in ['missing-date','future-date','truncated','duplicate-security']:
            bad = copy.deepcopy(p)
            if defect == 'missing-date': bad['tables'][0]['disclaimers'] = []
            if defect == 'future-date': bad['tables'][0]['disclaimers'][0]['text'] = 'Source: DWS 07/10/2026'
            if defect == 'truncated': bad['tables'][0]['values'] = bad['tables'][0]['values'][:1]
            if defect == 'duplicate-security': bad['tables'][0]['values'].append(copy.deepcopy(bad['tables'][0]['values'][0]))
            with self.subTest(defect=defect), self.assertRaises(ValueError): dws_holdings(bad, s, self.now, '')

    def test_russell_uses_exact_benchmark_row_not_equal_weight_returns(self):
        for id in ['russell-1000','russell-2000']:
            config = next(s for s in CONFIG if s['id']==id)
            text = (self.folder/(id+'-benchmark-row.txt')).read_text()
            config = {**config, 'documentName':config['returnDocumentName']}
            returns = ftse_returns(text, config, self.now)
            self.assertEqual(len(returns), 6)
            self.assertEqual(returns[0][1], 6.06) # fabricated fixture value, not market data
            with self.assertRaises(ValueError): ftse_returns(text, {**config, 'returnCurrency':'EUR'}, self.now)
            with self.assertRaises(ValueError): ftse_returns(text, {**config, 'returnVariant':'NET'}, self.now)
            with self.assertRaises(ValueError): ftse_returns(text, {**config, 'returnRowName':'Russell 3000'}, self.now)

    def test_new_msci_sources_and_historical_snapshots(self):
        for id, file in [('msci-china','msci-china.txt'), ('msci-world-minimum-volatility-usd','msci-min-vol-net.txt')]:
            config=next(s for s in CONFIG if s['id']==id);text=(self.folder/file).read_text()
            self.assertEqual(len(msci_returns(text,config,self.now)),6)
            self.assertEqual(msci_composition(text,config,self.now)['asOf'],'2026-09-30')
            with self.assertRaises(ValueError): msci_returns(text,{**config,'returnVariant':'GROSS'},self.now)

class VanEckRegionalSources(unittest.TestCase):
    def test_transport_only_regional_fallback_and_exact_source(self):
        from collect_vaneck_etf import collect_one
        share={'sourceUrl':'https://www.vaneck.com/fr/en/library/fact-sheets/espo-fact-sheet.pdf',
               'fallbackUrls':['https://www.vaneck.com/nl/en/library/fact-sheets/espo-fact-sheet.pdf']}
        calls=[]
        def fetch(url):
            calls.append(url)
            if len(calls)==1:raise ValueError('Expected official PDF; regional landing page')
            return b'%PDF-valid'
        with patch('collect_vaneck_etf.parse_document',side_effect=lambda b,s,n:s):
            self.assertEqual(collect_one(share,NOW,fetch)['sourceUrl'],share['fallbackUrls'][0])
        self.assertEqual(calls,[share['sourceUrl'],share['fallbackUrls'][0]])
        calls.clear()
        with patch('collect_vaneck_etf.parse_document',side_effect=ValueError('Wrong identity')):
            with self.assertRaises(ValueError):collect_one(share,NOW,lambda u:calls.append(u) or b'%PDF-wrong')
        self.assertEqual(calls,[share['sourceUrl']])
        with self.assertRaises(ValueError):collect_one({**share,'fallbackUrls':['https://example.com/espo-fact-sheet.pdf']},NOW,fetch)

    def test_browser_retries_only_official_regional_transport(self):
        from collect_vaneck_etf import collect_one
        from types import SimpleNamespace
        primary = 'https://www.vaneck.com/ucits/library/fact-sheets/gdig-fact-sheet.pdf'
        regional = 'https://www.vaneck.com/nl/en/library/fact-sheets/gdig-fact-sheet.pdf'
        share = {'sourceUrl': primary, 'fallbackUrls': [regional]}
        results = [SimpleNamespace(returncode=1, stderr=b'404'), SimpleNamespace(returncode=0, stdout=b'%PDF-valid')]
        with patch('collect_vaneck_etf.download', side_effect=ValueError('Expected official PDF')), \
             patch('collect_vaneck_etf.subprocess.run', side_effect=results) as browser, \
             patch('collect_vaneck_etf.parse_document', side_effect=lambda b,s,n:s):
            # Pass the patched default downloader explicitly to enter the browser path.
            import collect_vaneck_etf as module
            self.assertEqual(collect_one(share, NOW, module.download)['sourceUrl'], regional)
            self.assertEqual([c.args[0][-1] for c in browser.call_args_list], [primary, regional])
        with patch('collect_vaneck_etf.download', side_effect=ValueError('Expected official PDF')), \
             patch('collect_vaneck_etf.subprocess.run', return_value=results[1]) as browser, \
             patch('collect_vaneck_etf.parse_document', side_effect=ValueError('Wrong identity')):
            with self.assertRaisesRegex(ValueError, 'Wrong identity'):
                collect_one(share, NOW, module.download)
            self.assertEqual(browser.call_count, 1)

    def test_gdig_outage_preserves_last_validated_record_then_recovers(self):
        from refresh_additional_etf import refresh
        import copy
        isin = 'IE00BDFBTQ78'
        share = {'isin': isin, 'provider': 'VanEck', 'sourceUrl': 'https://www.vaneck.com/ucits/library/fact-sheets/gdig-fact-sheet.pdf'}
        previous = {isin: {'checkedAt': '2026-10-01', 'aum': {'amount': 123, 'asOf': '2026-09-30'}}}
        expected = copy.deepcopy(previous)
        for reason in ('HTTP 404', 'timeout', 'Wrong VanEck UCITS share identity'):
            def fail(*args): raise ValueError(reason)
            kept, report = refresh({'instruments': [share]}, previous, {}, NOW, fail)
            self.assertEqual(kept, expected)
            self.assertEqual(previous, expected)
            self.assertEqual(report['shares'][0]['status'], 'failed')
            self.assertIn(reason, report['shares'][0]['reason'])
        with patch('refresh_additional_etf.merge_collection', return_value={isin: {'checkedAt': NOW.isoformat(), 'aum': {'amount': 456}}}):
            updated, report = refresh({'instruments': [share]}, previous, {}, NOW, lambda *args: share)
        self.assertEqual(updated[isin]['aum']['amount'], 456)
        self.assertEqual(report['shares'][0]['status'], 'validated')
        self.assertNotIn('reason', report['shares'][0])

if __name__=='__main__':unittest.main()
