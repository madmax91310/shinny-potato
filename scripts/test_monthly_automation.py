"""Synthetic regressions for market conventions, incomplete sources and preservation."""
import copy
import datetime as dt
import unittest
import urllib.error
from urllib.parse import urlparse, parse_qs
from refresh_monthly_history import yahoo_chart, collect_yahoo, collect_msci, msci_rows, collect_stoxx, refresh, UTC

NOW=dt.datetime(2026,2,6,tzinfo=UTC)
CONFIG={'id':'test','parser':'yahoo','symbol':'TEST','currency':'USD','field':'adjclose','precision':6,'periodStart':'2026-01','method':'adjusted'}

def chart(interval='1d',close=12,adjusted=10):
    date=dt.datetime(2026,1,30 if interval=='1d' else 1,16,tzinfo=UTC)
    return {'chart':{'error':None,'result':[{'meta':{'symbol':'TEST','currency':'USD','dataGranularity':interval,'exchangeTimezoneName':'America/New_York'},
        'timestamp':[int(date.timestamp())],'indicators':{'quote':[{'close':[close]}],'adjclose':[{'adjclose':[adjusted]}]}}]}}

class Monthly(unittest.TestCase):
    def test_adjusted_daily_not_monthly_adjusted(self):
        def fetch(url):return chart('1mo' if 'interval=1mo' in url else '1d',adjusted=999 if 'interval=1mo' in url else 10)
        result=collect_yahoo(CONFIG,NOW,fetch)
        self.assertEqual(result['points'],[['2026-01',10]])
    def test_currency_and_identity_rejected(self):
        for field,value in [('currency','EUR'),('symbol','OTHER'),('dataGranularity','1mo')]:
            raw=chart();raw['chart']['result'][0]['meta'][field]=value
            with self.assertRaises(ValueError):yahoo_chart(raw,CONFIG,'1d')
    def test_adjusted_missing_and_duplicate_rejected(self):
        raw=chart();raw['chart']['result'][0]['indicators'].pop('adjclose')
        with self.assertRaises(ValueError):yahoo_chart(raw,CONFIG,'1d')
        raw=chart();raw['chart']['result'][0]['timestamp']*=2
        with self.assertRaises(ValueError):yahoo_chart(raw,CONFIG,'1d')
    def test_monthly_daily_mismatch_rejected(self):
        def fetch(url):return chart('1mo',close=15) if 'interval=1mo' in url else chart()
        with self.assertRaises(ValueError):collect_yahoo(CONFIG,NOW,fetch)
    def test_stale_missing_month_rejected(self):
        with self.assertRaises(ValueError):collect_yahoo({**CONFIG,'periodStart':'2025-12'},NOW,lambda url:chart('1mo' if 'interval=1mo' in url else '1d'))
    def test_msci_net_gross_never_substituted(self):
        config={'indexCode':'123','currency':'USD','variant':'NETR'}
        raw={'msci_index_code':'123','ISO_currency_symbol':'USD','index_variant_type':'GRTR','indexes':{'INDEX_LEVELS':[{'calc_date':20260130,'level_eod':12}]}}
        with self.assertRaises(ValueError):msci_rows(raw,config)

    def test_msci_year_windows_recover_same_exact_series(self):
        config={'indexCode':'123','currency':'USD','variant':'NETR','periodStart':'2025-01','precision':6}
        calls=[]
        def fetch(url):
            q={k:v[0] for k,v in parse_qs(urlparse(url).query).items()};calls.append(q)
            if q['start_date']=='20241231':
                raise urllib.error.HTTPError(url,500,'upstream',{},None)
            rows=[]
            for year in [2025,2026]:
                for month in range(1,13):
                    boundary=dt.date(year+int(month==12),month%12+1,1)
                    date=boundary-dt.timedelta(days=1)
                    if q['start_date']<=date.strftime('%Y%m%d')<=q['end_date']:
                        rows.append({'calc_date':date.strftime('%Y%m%d'),'level_eod':100+len(rows)})
            return {'msci_index_code':'123','ISO_currency_symbol':'USD','index_variant_type':'NETR','indexes':{'INDEX_LEVELS':rows}}
        result=collect_msci(config,NOW,fetch)
        self.assertEqual(len(result['points']),13)
        self.assertEqual(len(result['sourceAttempts']),2)
        self.assertEqual(len(result['sourceUrls']),4)
        self.assertTrue(all(q['index_codes']=='123' and q['index_variant']=='NETR' and q['currency_symbol']=='USD' for q in calls))
        # A chunk from a wrong share/variant is rejected, never substituted.
        def wrong(url):
            result=fetch(url);result['index_variant_type']='GRTR';return result
        with self.assertRaises(ValueError):collect_msci(config,NOW,wrong)

    def test_msci_invalid_payload_or_permanent_http_has_no_window_fallback(self):
        config={'indexCode':'123','currency':'USD','variant':'NETR','periodStart':'2026-01','precision':6}
        for error in [ValueError('bad JSON'),urllib.error.HTTPError('https://msci',403,'blocked',{},None)]:
            calls=[]
            def fetch(url):
                calls.append(url);raise error
            with self.assertRaises(type(error)):collect_msci(config,NOW,fetch)
            self.assertEqual(len(calls),1)
    def test_failure_keeps_history_other_source_updates(self):
        sources=[{**CONFIG,'id':'ok'},{**CONFIG,'id':'bad'}];current={'bad':{'points':[['2026-01',5]],'checkedAt':'2026-02-01'}}
        baseline={s['id']:{'currency':'USD','points':[{'date':'2026-01','price':8}]} for s in sources}
        def collect(s,now):
            if s['id']=='bad':raise ValueError('down')
            return {**s,'points':[['2026-01',10]],'periodEnd':'2026-01','checkedAt':'2026-02-06','proofRows':[],'rawResponse':{}}
        merged,report=refresh({'series':sources},current,baseline,NOW,collect)
        self.assertEqual(merged['bad'],current['bad']);self.assertEqual(merged['ok']['points'],[['2026-01',10]])
        self.assertEqual(report['series'][1]['status'],'failed')
    def test_stoxx_exact_variant_and_daily_end(self):
        config={'isin':'EU0000000001','symbol':'TEST','currency':'EUR','periodStart':'2026-01','precision':2,'sourceUrl':'https://stoxx.com/index/test/'}
        stamp=int(dt.datetime(2026,1,30,tzinfo=UTC).timestamp())*1000
        body=f"window.index_isin = 'EU0000000001'; <div id=\"overview-symbol\">TEST</div> EUR (Net Return) window.chart_data = [[{stamp},123.45]];".encode()
        self.assertEqual(collect_stoxx(config,NOW,lambda _:body)['points'],[['2026-01',123.45]])
        with self.assertRaises(ValueError):collect_stoxx(config,NOW,lambda _:body.replace(b'Net Return',b'Gross Return'))

if __name__=='__main__':unittest.main()
