"""Synthetic regressions for market conventions, incomplete sources and preservation."""
import copy
import datetime as dt
import json
import pathlib
import tempfile
import sys
import http.client
import unittest
from unittest.mock import patch
import urllib.error
from urllib.parse import urlparse, parse_qs
from refresh_monthly_history import yahoo_chart, collect_yahoo, collect_msci, msci_rows, collect_stoxx, refresh, select_series, UTC

NOW=dt.datetime(2026,2,6,tzinfo=UTC)
CONFIG={'id':'test','parser':'yahoo','symbol':'TEST','currency':'USD','field':'adjclose','precision':6,'periodStart':'2026-01','method':'adjusted'}

def chart(interval='1d',close=12,adjusted=10):
    date=dt.datetime(2026,1,30 if interval=='1d' else 1,16,tzinfo=UTC)
    return {'chart':{'error':None,'result':[{'meta':{'symbol':'TEST','currency':'USD','dataGranularity':interval,'exchangeTimezoneName':'America/New_York'},
        'timestamp':[int(date.timestamp())],'indicators':{'quote':[{'close':[close]}],'adjclose':[{'adjclose':[adjusted]}]}}]}}

class Monthly(unittest.TestCase):
    def test_candidate_suffix_never_fills_a_gap_or_relaxes_active_history(self):
        config={**CONFIG,'consumerScope':'catalog','periodStart':'2025-12'}
        def fetch(url):
            interval='1mo' if 'interval=1mo' in url else '1d'
            body=chart(interval)
            data=body['chart']['result'][0]
            dates=[dt.datetime(2025,12,1 if interval=='1mo' else 24,16,tzinfo=UTC),dt.datetime(2026,1,1 if interval=='1mo' else 30,16,tzinfo=UTC)]
            data['timestamp']=[int(d.timestamp()) for d in dates]
            data['indicators']={'quote':[{'close':[11,12]}],'adjclose':[{'adjclose':[10,11]}]}
            return body
        with self.assertRaisesRegex(ValueError,'Monthly close'):collect_yahoo(config,NOW,fetch)
        result=collect_yahoo({**config,'qualifyContiguousSuffix':True},NOW,fetch)
        self.assertEqual(result['periodStart'],'2026-01')
        self.assertEqual(result['points'],[['2026-01',11]])
        self.assertEqual(len(result['proofRows']),1)
        self.assertEqual(result['qualificationCoverage']['excluded'][0]['through'],'2025-12')
        with self.assertRaises(ValueError):collect_yahoo({**config,'consumerScope':'equity','qualifyContiguousSuffix':True},NOW,fetch)
        # A newly identified equity may explicitly retain a verified continuous suffix.
        # Its ordinary refresh still rejects the same disagreement.
        equity={**config,'consumerScope':'equity','instrumentType':'EQUITY','isin':'US0378331005','timezone':'America/New_York'}
        def equity_fetch(url):
            body=fetch(url)
            body['chart']['result'][0]['meta']['instrumentType']='EQUITY'
            return body
        with self.assertRaisesRegex(ValueError,'Monthly close'):collect_yahoo(equity,NOW,equity_fetch)
        result=collect_yahoo({**equity,'qualifyContiguousSuffix':True},NOW,equity_fetch)
        self.assertEqual(result['points'],[['2026-01',11]])
        self.assertEqual(result['periodStart'],'2026-01')
    def test_equity_bootstrap_requires_adjustments_and_identity(self):
        source={**CONFIG, 'consumerScope':'equity', 'instrumentType':'EQUITY',
                'label':'Test equity', 'timezone':'America/New_York', 'collectAnniversary':True}
        def collect(s, now):
            return {**s, 'points':[['2026-01',10]], 'anniversaryPoints':[['2026-01',12]],
                    'periodEnd':'2026-01', 'proofRows':[], 'rawResponse':{}}
        merged, report=refresh({'series':[source]}, {}, {}, NOW, collect)
        self.assertEqual(report['series'][0]['status'], 'validated')
        for key in ['instrumentType','label','timezone','collectAnniversary','symbol']:
            invalid=source.copy(); invalid.pop(key)
            result, report=refresh({'series':[invalid]}, {}, {}, NOW, collect)
            self.assertEqual(report['series'][0]['status'], 'failed')
            self.assertNotIn('test', result)
        raw=chart();raw['chart']['result'][0]['meta']['instrumentType']='ETF'
        with self.assertRaises(ValueError):yahoo_chart(raw,source,'1d')
        raw['chart']['result'][0]['meta']['instrumentType']='EQUITY'
        self.assertEqual(yahoo_chart(raw,source,'1d')[0][0][2],10)

    def test_recovery_contacts_only_failed_sources_then_stops(self):
        config={'series':[dict(CONFIG,id='ok'),dict(CONFIG,id='bad')]}
        status={'series':{'ok':{'status':'validated','periodEnd':'2026-01'},'bad':{'status':'failed'}}}
        self.assertEqual([s['id'] for s in select_series(config,status,retry_failed=True,now=NOW)['series']],['bad'])
        status['series']['bad'].update(status='validated',periodEnd='2026-01')
        self.assertEqual(select_series(config,status,retry_failed=True,now=NOW)['series'],[])
        self.assertEqual(select_series(config,{},retry_failed=True,now=NOW),config)
        self.assertEqual(select_series(config,{},only=['bad'],retry_failed=True,now=NOW)['series'],[config['series'][1]])
        self.assertEqual([s['id'] for s in select_series(config,status,['bad'])['series']],['bad'])
        for only in [[],['typo']]:
            with self.assertRaises(ValueError):select_series(config,status,only)

    def test_adjusted_daily_not_monthly_adjusted(self):
        def fetch(url):return chart('1mo' if 'interval=1mo' in url else '1d',adjusted=999 if 'interval=1mo' in url else 10)
        result=collect_yahoo({**CONFIG,'collectAnniversary':True},NOW,fetch)
        self.assertEqual(result['points'],[['2026-01',10]])
        self.assertEqual(result['anniversaryPoints'],[['2026-01',12]])

    def test_catalog_bootstrap_and_daily_recovery_of_new_registration(self):
        source={**CONFIG, 'consumerScope':'catalog', 'isin':'IE00BYYHSQ67',
                'listingEvidenceId':'IE00BYYHSQ67-XLON-WQDV-USD'}
        def collect(s,now):
            return {**s,'points':[['2026-01',10]],'periodEnd':'2026-01',
                    'checkedAt':'2026-02-06','proofRows':[],'rawResponse':{}}
        merged,report=refresh({'series':[source]}, {}, {}, NOW, collect)
        self.assertEqual(report['series'][0]['status'],'validated')
        self.assertEqual(merged['test']['points'],[['2026-01',10]])
        for field in ['isin','listingEvidenceId','consumerScope']:
            invalid=source.copy();invalid.pop(field)
            _,report=refresh({'series':[invalid]}, {}, {}, NOW, collect)
            self.assertEqual(report['series'][0]['status'],'failed')
        config={'series':[source,dict(CONFIG,id='old')]}
        selected=select_series(config,{'series':{'old':{'status':'validated','periodEnd':'2026-01'}}},retry_failed=True,now=NOW)
        self.assertEqual([s['id'] for s in selected['series']],['test'])

    def test_catalog_identity_change_preserves_prior_history(self):
        old={**CONFIG, 'consumerScope':'catalog','isin':'IE00BYYHSQ67',
             'points':[['2026-01',8]], 'periodEnd':'2026-01'}
        source={**old,'isin':'IE00BG0J4C88'}
        def collect(s,now):return {**s,'points':[['2026-01',10]],'proofRows':[],'rawResponse':{}}
        baseline={'test':{'currency':'USD','points':[{'date':'2026-01','price':8}]}}
        merged,report=refresh({'series':[source]}, {'test':old}, baseline, NOW, collect)
        self.assertEqual(report['series'][0]['status'],'failed')
        self.assertEqual(merged['test'],old)
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

    def test_candidate_discovers_and_verifies_daily_windows_without_accepting_conflict(self):
        config={**CONFIG,'consumerScope':'catalog','verifyMonthlyDisagreements':True}
        def fetch(url):return chart('1mo',close=15) if 'interval=1mo' in url else chart()
        result=collect_yahoo(config,NOW,fetch)
        self.assertNotIn('dailyWindowMonths',config)
        self.assertEqual(result['verifiedDailyWindowMonths'],['2026-01'])
        self.assertEqual(result['points'],[['2026-01',10]])
        self.assertEqual(result['proofRows'][0]['rejectedMonthlyClose'],15)
        end=int(dt.datetime(2026,2,1,tzinfo=UTC).timestamp())
        def inconsistent(url):
            if f'period1={end-7*86400}' in url:return chart(close=13)
            return fetch(url)
        with self.assertRaises(ValueError):collect_yahoo(config,NOW,inconsistent)
        with self.assertRaises(ValueError):collect_yahoo({**CONFIG,'verifyMonthlyDisagreements':True},NOW,fetch)

    def test_registered_etf_candle_recouped_by_exact_daily_window(self):
        config={**CONFIG,'consumerScope':'catalog','dailyWindowMonths':['2026-01']}
        def fetch(url):return chart('1mo',close=15) if 'interval=1mo' in url else chart()
        result=collect_yahoo(config,NOW,fetch)
        self.assertEqual(result['points'],[['2026-01',10]])
        self.assertEqual(result['proofRows'][0]['rejectedMonthlyClose'],15)
        self.assertEqual(result['proofRows'][0]['windowClose'],12)
        # A daily window must agree in date, raw close and adjusted close.
        end=int(dt.datetime(2026,2,1,tzinfo=UTC).timestamp())
        def inconsistent(url):
            if f'period1={end-7*86400}' in url:return chart(close=13)
            return fetch(url)
        with self.assertRaises(ValueError):collect_yahoo(config,NOW,inconsistent)
        with self.assertRaises(ValueError):collect_yahoo({**CONFIG,'dailyWindowMonths':['2026-01']},NOW,fetch)
    def test_sparse_session_requires_registered_date_and_both_cross_checks(self):
        now=dt.datetime(2026,1,6,tzinfo=UTC)
        cfg={**CONFIG,'periodStart':'2025-12','consumerScope':'catalog',
             'verifiedSparseMonthEnds':{'2025-12':'2025-12-24'}}
        def fetch(url):
            iv='1mo' if 'interval=1mo' in url else '1d'
            raw=chart(iv)
            day=1 if iv=='1mo' else 24
            raw['chart']['result'][0]['timestamp']=[int(dt.datetime(2025,12,day,16,tzinfo=UTC).timestamp())]
            return raw
        result=collect_yahoo(cfg,now,fetch)
        self.assertEqual(result['proofRows'][0]['sparseMonthEndSession'],'2025-12-24')
        for invalid in [dict(cfg,verifiedSparseMonthEnds={}),dict(cfg,verifiedSparseMonthEnds={'2025-12':'2025-12-23'}),dict(cfg,consumerScope='simulator')]:
            with self.assertRaises(ValueError):collect_yahoo(invalid,now,fetch)
        def inconsistent(url):
            raw=fetch(url)
            if 'interval=1mo' in url:raw['chart']['result'][0]['indicators']['quote'][0]['close']=[13]
            return raw
        with self.assertRaises(ValueError):collect_yahoo(cfg,now,inconsistent)

    def test_daily_window_allows_only_float_rounding(self):
        cfg={**CONFIG,'consumerScope':'catalog','dailyWindowMonths':['2026-01']}
        end=int(dt.datetime(2026,2,1,tzinfo=UTC).timestamp())
        def fetch(url):
            if 'interval=1mo' in url:return chart('1mo',close=15)
            return chart(adjusted=10.000005 if f'period1={end-7*86400}' in url else 10)
        self.assertEqual(collect_yahoo(cfg,NOW,fetch)['points'],[['2026-01',10]])
        def invalid(url):
            if f'period1={end-7*86400}' in url:return chart(adjusted=10.01)
            return fetch(url)
        with self.assertRaises(ValueError):collect_yahoo(cfg,NOW,invalid)

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

    def test_msci_truncated_transport_recovers_without_changing_variant(self):
        config={'indexCode':'123','currency':'USD','variant':'GRTR','periodStart':'2026-01','precision':6}
        def fetch(url):
            q={k:v[0] for k,v in parse_qs(urlparse(url).query).items()}
            if q['start_date']=='20251231':raise http.client.IncompleteRead(b'partial')
            return {'msci_index_code':'123','ISO_currency_symbol':'USD','index_variant_type':'GRTR',
                    'indexes':{'INDEX_LEVELS':[{'calc_date':'20260130','level_eod':100}]}}
        result=collect_msci(config,NOW,fetch)
        self.assertEqual(result['points'],[['2026-01',100]])
        self.assertEqual(len(result['sourceAttempts']),2)
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



class ClosedMonthRecovery(unittest.TestCase):
    def test_rollover_selects_only_missing_periods_then_stops(self):
        config={'series':[dict(CONFIG,id=key)for key in ['due','current','failed','unrecorded']]}
        status={'series':{'due':{'status':'validated','periodEnd':'2026-09'},
                          'current':{'status':'validated','periodEnd':'2026-10'},
                          'failed':{'status':'failed'},'retired':{'status':'failed'}}}
        now=dt.datetime(2026,11,1,tzinfo=UTC)
        selected=select_series(config,status,retry_failed=True,now=now)
        self.assertEqual([s['id']for s in selected['series']],['due','failed','unrecorded'])
        self.assertEqual(select_series(config,status,only=['current'],retry_failed=True,now=now)['series'],[])
        self.assertEqual([s['id']for s in select_series(config,status,only=['due'],retry_failed=True,now=now)['series']],['due'])
        self.assertEqual([s['id']for s in select_series(config,status,only=['current'],now=now)['series']],['current'])
        for row in config['series']:status['series'][row['id']]={'status':'validated','periodEnd':'2026-10'}
        self.assertEqual(select_series(config,status,retry_failed=True,now=now)['series'],[])

    def test_month_and_year_boundaries_require_only_closed_months(self):
        config={'series':[CONFIG]};status={'series':{'test':{'status':'validated','periodEnd':'2026-11'}}}
        for now,expected in [(dt.datetime(2026,12,31,23,59,59,tzinfo=UTC),[]),
                             (dt.datetime(2027,1,1,tzinfo=UTC),['test'])]:
            self.assertEqual([s['id']for s in select_series(config,status,retry_failed=True,now=now)['series']],expected)
        status['series']['test']['periodEnd']='2026-12'
        self.assertEqual(select_series(config,status,retry_failed=True,now=dt.datetime(2027,1,1,tzinfo=UTC))['series'],[])

    def test_unknown_invalid_or_future_coverage_cannot_silently_skip_a_source(self):
        config={'series':[CONFIG]};now=dt.datetime(2026,11,1,tzinfo=UTC)
        for period in [None,'','2026-13','2026-11',False]:
            with self.subTest(period=period):
                status={'series':{'test':{'status':'validated','periodEnd':period}}}
                self.assertEqual(select_series(config,status,retry_failed=True,now=now)['series'],[CONFIG])

    def test_main_uses_one_clock_for_selection_and_collection(self):
        import refresh_monthly_history as monthly
        reference=dt.datetime(2026,11,1,tzinfo=UTC)
        clocks=[];observed=[]
        class Clock(dt.datetime):
            @classmethod
            def now(cls,tz=None):
                clocks.append(reference)
                return reference if len(clocks)==1 else reference.replace(month=12)
        class StopBeforeNetwork(Exception):pass
        def collect(config,current,baseline,now=None):
            observed.append((config,now));raise StopBeforeNetwork()
        with tempfile.TemporaryDirectory()as directory:
            root=pathlib.Path(directory)
            for name,value in {
                'src/data/automated-monthly.json':{},'baseline.json':{},
                'scripts/monthly-automation.json':{'series':[CONFIG]},
                'scripts/source-snapshots/monthly-collection-status.json':{'series':{'test':{'status':'validated','periodEnd':'2026-09'}}},
            }.items():
                path=root/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value))
            argv=['refresh_monthly_history','--retry-failed','--baseline',str(root/'baseline.json'),'--output',str(root/'report.json')]
            with patch.object(monthly,'ROOT',root),patch.object(monthly.dt,'datetime',Clock),patch.object(monthly,'refresh',side_effect=collect),patch.object(sys,'argv',argv),self.assertRaises(StopBeforeNetwork):
                monthly.main()
        self.assertEqual(len(clocks),1)
        self.assertEqual(observed,[({'series':[CONFIG]},reference)])



class ReviewedNavPrefix(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root=pathlib.Path(__file__).resolve().parent
        cls.rows=json.loads((root/'fixtures/wisdomtree-oil-2020-prefix-20261108.json').read_text())['series']
        from reviewed_nav_prefix import planned_prefix_sources
        cls.registered=json.loads((root/'monthly-automation.json').read_text())
        cls.sources={s['id']:s for s in planned_prefix_sources(cls.registered)['series']}

    def test_two_exact_live_captures_preserve_every_old_value_and_are_idempotent(self):
        for row in self.rows:
            with self.subTest(id=row['id']):
                id=row['id'];before={id:copy.deepcopy(row['previous']),'unrelated':{'unchanged':True}}
                baseline={id:{'currency':'USD','points':[{'date':m,'price':v}for m,v in row['previous']['points']]}}
                snapshot=copy.deepcopy(before)
                result,report=refresh({'series':[self.sources[id]]},before,baseline,dt.datetime(2026,11,8,tzinfo=UTC),lambda *a:copy.deepcopy(row['candidate']))
                self.assertEqual(report['series'][0]['status'],'validated',report)
                self.assertEqual(before,snapshot);self.assertEqual(result['unrelated'],before['unrelated'])
                self.assertEqual(result[id]['periodStart'],'2019-12')
                after=dict(result[id]['points'])
                for month,value in before[id]['points']:self.assertEqual(after[month],value)
                self.assertIn(2020,result[id]['calendarProof']['qualifiedCalendarYears'])
                nextbase={id:{'currency':'USD','points':[{'date':m,'price':v}for m,v in result[id]['points']]}}
                again,repeat=refresh({'series':[self.sources[id]]},result,nextbase,dt.datetime(2026,11,8,tzinfo=UTC),lambda *a:copy.deepcopy(row['candidate']))
                self.assertEqual(repeat['series'][0]['status'],'validated',repeat)
                self.assertEqual(repeat['series'][0]['sourceState'],'unchanged-verified')
                self.assertEqual(again[id]['points'],result[id]['points'])
                self.assertEqual(len(again[id]['points']),len(result[id]['points']))

    def test_no_changed_or_missing_suffix_identity_or_uncorroborated_year_is_admitted(self):
        row=self.rows[0];id=row['id'];source=self.sources[id];prior=row['previous']
        baseline={id:{'currency':'USD','points':[{'date':m,'price':v}for m,v in prior['points']]}}
        for mutation in ['changed','missing','year','identity','currency','policy','quote','duplicate','reordered','empty']:
            s=copy.deepcopy(source);r=copy.deepcopy(row['candidate']);old=copy.deepcopy(prior)
            if mutation=='changed':r['points'][-2][1]+=0.00000001
            elif mutation=='missing':r['points']=[p for p in r['points']if p[0]!=prior['points'][1][0]]
            elif mutation=='year':r['calendarProof']['checks']=[c for c in r['calendarProof']['checks']if c['year']!=2020]
            elif mutation=='identity':r['isin']='GB0000000000'
            elif mutation=='currency':r['currency']='EUR'
            elif mutation=='policy':s.pop('reviewedHistoryPrefix')
            elif mutation=='quote':old['parser']='yahoo'
            elif mutation=='duplicate':r['points'].insert(1,copy.deepcopy(r['points'][0]))
            elif mutation=='reordered':r['points'][0],r['points'][1]=r['points'][1],r['points'][0]
            else:r['points']=[]
            with self.subTest(mutation=mutation):
                merged,report=refresh({'series':[s]},{id:old},baseline,dt.datetime(2026,11,8,tzinfo=UTC),lambda *a:r)
                self.assertEqual(report['series'][0]['status'],'failed')
                self.assertEqual(merged[id],old)

    def test_pending_prefix_is_automatically_targeted_once_and_other_current_series_are_not(self):
        sources=[self.sources[r['id']]for r in self.rows]+[CONFIG]
        status={'series':{s['id']:{'status':'validated','periodEnd':'2026-10'}for s in sources}}
        config={'series':sources};now=dt.datetime(2026,11,8,tzinfo=UTC)
        chosen=select_series(config,status,retry_failed=True,now=now)
        self.assertEqual({s['id']for s in chosen['series']},{r['id']for r in self.rows})
        for r in self.rows:status['series'][r['id']]['periodStart']='2019-12'
        self.assertEqual(select_series(config,status,retry_failed=True,now=now)['series'],[])

    def test_configuration_is_recorded_only_with_its_individual_validated_observations(self):
        from reviewed_nav_prefix import recorded_prefix_config
        selected={'series':[self.sources[r['id']]for r in self.rows]}
        reports=[]
        for i,row in enumerate(self.rows):
            reports.append({'id':row['id'],'status':'validated','record':row['candidate']} if i==0 else {'id':row['id'],'status':'failed','reason':'network unavailable'})
        before=copy.deepcopy(self.registered)
        after=recorded_prefix_config(before,selected,reports)
        a={s['id']:s for s in after['series']};b={s['id']:s for s in before['series']}
        self.assertEqual(a[self.rows[0]['id']],self.sources[self.rows[0]['id']])
        self.assertEqual(a[self.rows[1]['id']],b[self.rows[1]['id']])
        self.assertEqual(before,self.registered)
        for id in set(a)-{self.rows[0]['id']}:self.assertEqual(a[id],b[id])
        self.assertEqual(recorded_prefix_config(before,selected,[]),before)
        self.assertEqual(recorded_prefix_config(before,selected,[{'id':r['id'],'status':'failed'}for r in self.rows]),before)

    def test_canonical_plans_declare_only_the_two_reviewed_prefixes(self):
        root=pathlib.Path(__file__).resolve().parent
        canonical={s['id']:s for s in json.loads((root/'official-nav-remainder-sources.json').read_text())if s.get('reviewedHistoryPrefix')}
        planned={id:s for id,s in self.sources.items()if s.get('reviewedHistoryPrefix')}
        self.assertEqual(set(canonical),{r['id']for r in self.rows});self.assertEqual(set(planned),set(canonical))
        for id,s in canonical.items():
            for key in ['periodStart','isin','currency','navProvider','navHistoryTransport','requiredQualifiedCalendarYears','reviewedHistoryPrefix']:
                self.assertEqual(planned[id][key],s[key])
            self.assertIn(2020,s['requiredQualifiedCalendarYears'])

if __name__=='__main__':unittest.main()
