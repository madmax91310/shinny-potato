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

if __name__=='__main__':unittest.main()
