"""Exact index rows, return conventions, completed years and preserved good data."""
import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from collect_remaining_indices import nikkei_composition,nikkei_returns,stoxx_returns,benchmark_page_returns,metal_benchmark_returns,collect_one
from collect_index_documents import msci_composition
from derive_index_returns import derive
from refresh_index_sources import merge_records
from data_automation import UTC
F=Path(__file__).parent/'fixtures/official-documents/remaining-indices'
CONFIG=json.loads((Path(__file__).parent/'index-automation.json').read_text())['indices']
NOW=dt.datetime(2026,10,6,tzinfo=UTC)
def cfg(id):return next(c for c in CONFIG if c['id']==id)
class RemainingIndexSources(unittest.TestCase):
    def test_nikkei_exact_tables(self):
        c=cfg('nikkei225');t=(F/'nikkei.txt').read_text();p=(F/'nikkeiprice.txt').read_text()
        stamp,values=nikkei_returns(t,c,NOW)
        self.assertEqual(stamp,'2026-09-30');self.assertEqual(dict(values)[2025],28.65)
        self.assertNotIn(2026,dict(values));self.assertEqual(nikkei_composition(p,c,NOW)['constituents'],225)
        for a,b in [('Total Return Index','Price Return Index'),('2025','2026'),('FS-TR0-20260930','FS-TR0-20260130')]:
            with self.assertRaises(ValueError):nikkei_returns(t.replace(a,b),c,NOW)
        with self.assertRaises(ValueError):nikkei_returns(t,{**c,'returnCurrency':'USD'},NOW)
    def test_msci_historical_title_footer_does_not_create_a_country(self):
        t=(F/'msciselection.txt').read_text();c=cfg('msci-em-latin-america-selection')
        r=msci_composition(t,c,NOW);self.assertEqual(r['constituents'],41)
        self.assertEqual(len(r['countries']),5);self.assertAlmostEqual(sum(v for _,v in r['countries']),100,delta=.1)
        with self.assertRaises(ValueError):msci_composition(t,{**c,'documentName':'MSCI Latin America'},NOW)
    def test_ssga_and_topix_use_only_index_row(self):
        for id,file,value in [('sp-global-dividend-aristocrats','ssgaglobal.html',16.97),('sp-euro-dividend-aristocrats','ssgaeuro.html',19.47),('topix','topix.html',25.46)]:
            c=cfg(id);body=(F/file).read_bytes();stamp,values=benchmark_page_returns(body,c,NOW)
            self.assertEqual(dict(values)[2025],value)
            self.assertNotIn(2026,dict(values))
            for config in [{**c,'isin':'IE00OTHER001'},{**c,'returnCurrency':'EUR' if c['returnCurrency']!='EUR' else 'USD'},{**c,'returnVariant':'PRICE'}]:
                with self.assertRaises(ValueError):benchmark_page_returns(body,config,NOW)
        c=cfg('sp-global-dividend-aristocrats')
        with self.assertRaises(ValueError):benchmark_page_returns((F/'ssgaglobal.html').read_bytes(),{**c,'firstYear':2020},NOW)
    def stoxx_body(self):
        rows=[]
        for y in range(2019,2026):rows.append([int(dt.datetime(y,12,31,tzinfo=UTC).timestamp()*1000),100*1.1**(y-2019)])
        rows.append([int(dt.datetime(2026,10,5,tzinfo=UTC).timestamp()*1000),200])
        c=cfg('stoxx600')
        return ("window.index_isin = '"+c['isin']+"';<span id=\"overview-symbol\">"+c['symbol']+"</span>EUR (Price Return) window.chart_data = "+json.dumps(rows)+";").encode()
    def test_stoxx_price_identity_boundaries_and_freshness(self):
        body=self.stoxx_body();c=cfg('stoxx600');stamp,values=stoxx_returns(body,c,NOW)
        self.assertEqual(stamp,'2026-10-05');self.assertEqual(len(values),6);self.assertTrue(all(v==10 for _,v in values))
        with self.assertRaises(ValueError):stoxx_returns(body.replace(b'EUR (Price Return)',b'EUR (Net Return)'),c,NOW)
        with self.assertRaises(ValueError):stoxx_returns(body,c,NOW+dt.timedelta(days=15))
        with self.assertRaises(ValueError):stoxx_returns(body,{**c,'isin':'WRONG'},NOW)
        # Removing a December boundary cannot silently produce a partial history.
        text=body.decode();array=json.loads(text.split('window.chart_data = ')[1][:-1]);del array[3]
        with self.assertRaises(ValueError):stoxx_returns((text.split('window.chart_data = ')[0]+'window.chart_data = '+json.dumps(array)+';').encode(),c,NOW)
    def test_metals_use_benchmark_not_etc_returns(self):
        for metal,value in [('gold',65),('silver',149.06)]:
            c=cfg(metal+'-physical');t=(F/(metal+'.txt')).read_text()
            stamp,values=metal_benchmark_returns(t,c,NOW)
            self.assertEqual(stamp,'2026-08-31');self.assertEqual(dict(values)[2025],value)
            self.assertEqual(len(values),6)
            for a,b in [(c['isin'],'WRONG'),('Share Class Currency : USD','Share Class Currency : EUR'),('31-Aug-2026','31-Jan-2026'),('Benchmark (USD)','Benchmark (EUR)'),('2025','2026')]:
                with self.assertRaises(ValueError):metal_benchmark_returns(t.replace(a,b),c,NOW)
    def monthly(self):
        c=cfg('sp500-pea')
        return {'symbol':c['symbol'],'currency':'USD','field':'close','checkedAt':'2026-10-05','periodEnd':'2026-09',
                'points':[[f'{y}-12',100*1.1**(y-2019)] for y in range(2019,2026)]+[['2026-09',200]],
                'sourceUrls':['https://query2.finance.yahoo.com/v8/finance/chart/%5ESP500TR?a=1','https://query2.finance.yahoo.com/v8/finance/chart/%5ESP500TR?a=2']}
    def test_monthly_derivation_never_uses_proxy_or_unfinished_year(self):
        c=cfg('sp500-pea');r=self.monthly();v=derive(c,r,NOW,'hash')['returns']['values']
        self.assertEqual(len(v),6);self.assertTrue(all(value==10 for _,value in v))
        for key,value in [('symbol','SPY'),('currency','EUR'),('field','adjclose'),('checkedAt','2026-01-01'),('periodEnd','2026-10')]:
            with self.assertRaises(ValueError):derive(c,{**r,key:value},NOW,'hash')
        for points in [r['points'][1:],r['points']+[r['points'][-1]],[[k,0 if k=='2020-12' else v] for k,v in r['points']]]:
            with self.assertRaises(ValueError):derive(c,{**r,'points':points},NOW,'hash')
    def test_failed_source_preserves_previous_snapshot(self):
        previous={'nikkei225':{'returns':{'asOf':'2026-08-31','values':[[2025,28.65]],'currency':'JPY','variant':'TOTAL'}}}
        def fail(url):raise ValueError('Transport unavailable')
        observation=collect_one(cfg('nikkei225'),NOW,fetch=fail)
        self.assertEqual(len(observation['errors']),2)
        self.assertEqual(merge_records(previous,[observation]),previous)
if __name__=='__main__':unittest.main()
