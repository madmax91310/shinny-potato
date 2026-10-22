import copy
import datetime as dt
import unittest
from collect_ai_portfolios import parse_prices, parse_fx, calendars, collect
from data_automation import UTC

class DailyTests(unittest.TestCase):
    def setUp(self):
        self.now=dt.datetime(2026,2,10,5,tzinfo=UTC)
        self.asset={'id':'test','isin':'IE00B4L5Y983','symbol':'TEST','timezone':'Europe/Amsterdam','calendar':'XAMS','currency':'EUR','instrumentType':'ETF','evidenceId':'test'}
        self.calendar=calendars([self.asset],'2026-01-01','2026-03-01')['XAMS']
        dates=[dt.datetime.fromisoformat(d+'T12:00:00+00:00') for d in self.calendar if d<'2026-02-10']
        self.raw={'chart':{'error':None,'result':[{'meta':{'symbol':'TEST','currency':'EUR','dataGranularity':'1d','instrumentType':'ETF','exchangeTimezoneName':'Europe/Amsterdam'},'timestamp':[int(d.timestamp()) for d in dates],'indicators':{'quote':[{'close':[100]*len(dates)}],'adjclose':[{'adjclose':[90]*len(dates)}]}}]}}
    def test_daily_catchup_updates_the_exact_source_certificate(self):
        from collect_ai_portfolios import record_qualification_success
        row={'sourceUrl':'https://issuer.example/exact-isin','lastSuccess':'2026-01-01','dailySourceUrl':'old-response','responseSha256':'old-hash','coverageThrough':'2026-01-01','attempts':[{'result':'HTTP Error 404'}]}
        series={'anchorDate':'2026-01-02','points':{'2026-01-02':{},'2026-02-09':{}},'sourceUrl':'https://query1.finance.yahoo.com/exact-response','retrievedAt':'2026-02-10T05:00:01+00:00','responseSha256':'new-response-hash','symbol':'EXACT.L','currency':'GBP','sourceCurrency':'GBp','priceScale':.01}
        record_qualification_success(row,series,'2026-02-10T05:00:02+00:00')
        self.assertEqual(row['sourceUrl'],'https://issuer.example/exact-isin')
        self.assertEqual(row['dailySourceUrl'],series['sourceUrl'])
        self.assertEqual(row['responseSha256'],series['responseSha256'])
        self.assertEqual(row['sourceRetrievedAt'],series['retrievedAt'])
        self.assertEqual(row['coverageThrough'],'2026-02-09')
        self.assertEqual(row['observedSourceCurrency'],'GBp')
        self.assertEqual(row['attempts'][0]['url'],series['sourceUrl'])
        self.assertEqual(row['attempts'][0]['result'],'qualified')

    def test_note_is_not_reclassified_as_a_stock(self):
        raw=copy.deepcopy(self.raw);raw['chart']['result'][0]['meta']['instrumentType']='EQUITY'
        # A real ETF with an unexpected source classification remains refused.
        with self.assertRaisesRegex(ValueError,'instrument type'):parse_prices(raw,self.asset,self.calendar,self.now)
        # Issuer-identified exchange-traded notes use the provider's security taxonomy.
        note={**self.asset,'instrumentType':'ETN','yahooInstrumentType':'EQUITY'}
        self.assertTrue(parse_prices(raw,note,self.calendar,self.now)['qualified'])
        self.assertEqual(note['instrumentType'],'ETN')

    def test_current_session_duplicates_do_not_corrupt_an_earlier_cutoff(self):
        raw=copy.deepcopy(self.raw);data=raw['chart']['result'][0]
        stamps=[int(dt.datetime(2026,2,10,h,tzinfo=UTC).timestamp()) for h in [10,12]]
        data['timestamp']+=stamps;data['indicators']['quote'][0]['close']+=[101,102];data['indicators']['adjclose'][0]['adjclose']+=[91,92]
        self.assertTrue(parse_prices(raw,self.asset,self.calendar,self.now,through='2026-02-09')['qualified'])
        # A conflicting bar inside the retained, completed history remains refused.
        data['timestamp'].insert(-2,data['timestamp'][-3]+60)
        data['indicators']['quote'][0]['close'].insert(-2,103);data['indicators']['adjclose'][0]['adjclose'].insert(-2,93)
        with self.assertRaisesRegex(ValueError,'Duplicate Yahoo local date'):
            parse_prices(raw,self.asset,self.calendar,self.now,through='2026-02-09')

    def test_pence_and_wrong_venue(self):
        asset={**self.asset,'currency':'GBP','sourceCurrency':'GBp','priceScale':.01,'yahooExchanges':['AMS']}
        raw=copy.deepcopy(self.raw);raw['chart']['result'][0]['meta'].update(currency='GBp',exchangeName='AMS')
        series=parse_prices(raw,asset,self.calendar,self.now)
        point=series['points'][series['anchorDate']]
        self.assertEqual(point['close'],1)
        self.assertEqual(point['adjusted'],.9)
        self.assertEqual(point['synthetic'],100)
        raw['chart']['result'][0]['meta']['exchangeName']='PAR'
        with self.assertRaisesRegex(ValueError,'Place retournée'):parse_prices(raw,asset,self.calendar,self.now)

    def test_certified_calendar_bound(self):
        bounds={}
        rows=calendars([{'calendar':'XBOM'}],'2026-10-01','2027-01-10',bounds)
        self.assertEqual(bounds['XBOM']['through'],'2026-12-31')
        self.assertTrue(all(d<='2026-12-31' for d in rows['XBOM']))

    def test_crypto_calendar_and_recent_history(self):
        cal=calendars([{'calendar':'24/7'}],'2026-01-01','2026-02-10')['24/7']
        self.assertEqual(len(cal),41)
        self.assertEqual(cal['2026-01-03'],'2026-01-04T00:00:00+00:00')
        raw=copy.deepcopy(self.raw)
        data=raw['chart']['result'][0]
        data['timestamp']=data['timestamp'][-19:]
        for row in [data['indicators']['quote'][0],data['indicators']['adjclose'][0]]:
            for key in row:row[key]=row[key][-19:]
        with self.assertRaisesRegex(ValueError,'20 clôtures'):parse_prices(raw,self.asset,self.calendar,self.now)

    def test_resume_checkpoints_and_due_queue(self):
        from qualify_ai_portfolios import should_attempt
        # One completed batch, a saved transient failure, then never-attempted rows.
        prior=[{'status':'qualified','lastAttempt':self.now.isoformat()} for _ in range(100)]
        prior += [{'status':'temporary-failure','lastAttempt':self.now.isoformat()}]+[{} for _ in range(250)]
        self.assertEqual(sum(should_attempt(r,'remaining',self.now) for r in prior),250)
        self.assertEqual(sum(should_attempt(r,'retry',self.now) for r in prior),251)
        self.assertEqual(sum(should_attempt(r,'all',self.now) for r in prior),351)
        self.assertEqual(sum(should_attempt(r,'due',self.now+dt.timedelta(days=2)) for r in prior),251)
        self.assertEqual(sum(should_attempt(r,'due',self.now+dt.timedelta(days=8)) for r in prior),351)

    def test_exhaustive_report_reconciliation(self):
        import tempfile,pathlib
        from qualify_ai_portfolios import reports
        rows=[{'id':str(i),'instrumentId':str(i//2),'name':str(i),'family':'Test','status':'qualified' if i%2==0 else 'blocked','lastAttempt':'2026-01-01' if i%2==0 else None} for i in range(1002)]
        with tempfile.TemporaryDirectory() as folder:
            r=reports(rows,pathlib.Path(folder))
            self.assertEqual(r['counts']['admittedInstruments'],501)
            self.assertEqual(r['counts']['qualifiedListings'],501)
            self.assertEqual(r['counts']['blocked'],501)
            self.assertEqual(r['counts']['listingCandidates'],len(rows))
            self.assertEqual(len((pathlib.Path(folder)/'qualification.csv').read_text().splitlines()),1003)

    def test_coverage_and_holidays(self):
        self.assertNotIn('2026-01-01',self.calendar)
        series=parse_prices(self.raw,self.asset,self.calendar,self.now)
        self.assertEqual(series['anchorDate'],'2026-01-02')
        self.assertTrue(all(p['synthetic']==100 for p in series['points'].values()))
        self.raw['chart']['result'][0]['indicators']['quote'][0]['close'][-1]=None
        self.raw['chart']['result'][0]['indicators']['adjclose'][0]['adjclose'][-1]=None
        with self.assertRaisesRegex(ValueError,'manquantes'):
            parse_prices(self.raw,self.asset,self.calendar,self.now)
    def test_identity_duplicate_and_adjustments(self):
        base=parse_prices(self.raw,self.asset,self.calendar,self.now)
        adjusted=copy.deepcopy(self.raw)
        adjusted['chart']['result'][0]['indicators']['adjclose'][0]['adjclose']=[80]*len(adjusted['chart']['result'][0]['timestamp'])
        self.assertEqual(base['points']['2026-01-02']['synthetic'],parse_prices(adjusted,self.asset,self.calendar,self.now,base)['points']['2026-01-02']['synthetic'])
        self.raw['chart']['result'][0]['meta']['currency']='USD'
        with self.assertRaisesRegex(ValueError,'identity'):
            parse_prices(self.raw,self.asset,self.calendar,self.now)
    def test_partial_failure_preserves_prices(self):
        previous={'calendarFrom':'2026-01-01','series':{'test':{'points':{'2026-01-02':{'synthetic':100}}}}}
        def fail(*args,**kwargs):raise ConnectionError('offline')
        result=collect(previous,[self.asset],self.now,fetch=fail,fetch_ecb=fail)
        self.assertEqual(result['series'],previous['series'])
        self.assertFalse(result['status']['test']['ok'])
        self.assertFalse(result['status']['ECB']['ok'])

    def test_unrelated_or_failed_calendar_does_not_block_healthy_collection(self):
        broken={**self.asset,'id':'unrelated','calendar':'UNDOCUMENTED-MARKET'}
        def offline_fx(*args,**kwargs):raise ConnectionError('FX offline in this isolated test')
        for required in [{'test'},{'test','unrelated'}]:
            result=collect({'calendarFrom':'2026-01-01'},[self.asset,broken],self.now,fetch=lambda *args,**kw:self.raw,fetch_ecb=offline_fx,required=required)
            self.assertTrue(result['status']['test']['ok'])
            self.assertFalse(result['status']['unrelated']['ok'])
            if 'unrelated' in required:self.assertIn('Calendrier non qualifié',result['status']['unrelated']['error'])
    def test_ecb_stale(self):
        body=b'<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube><Cube time="2026-01-02"><Cube currency="USD" rate="1.1"/><Cube currency="GBP" rate="0.8"/><Cube currency="CHF" rate="0.9"/></Cube></Cube></gesmes:Envelope>'
        with self.assertRaisesRegex(ValueError,'attendu manquant'):parse_fx(body,self.now)

if __name__=='__main__':unittest.main()

class InternationalEquityDirectory(unittest.TestCase):
    def test_jpx_foreign_class_requires_the_explicit_jdr_column(self):
        from discover_ai_equities import parse
        body=b'<table><tr><td>Ordinary issuer</td><td>1773</td><td>IR</td><td>100</td><td>MALAYSIA</td><td>Industry</td><td>June</td><td>-</td></tr><tr><td>Receipt issuer</td><td>9257</td><td>IR</td><td>100</td><td>SINGAPORE</td><td>Services</td><td>March</td><td><a href="/english/equities/products/foreign/issues/example/jdr.pdf">PDF</a></td></tr></table>'
        rows,_,_=parse(body,'jpx-foreign-classes')
        self.assertEqual([r['shareType'] for r in rows],['ordinary','depositary-receipt'])
        self.assertEqual(rows[1]['country'],'SINGAPORE')

    def test_source_types_and_isin(self):
        from discover_ai_equities import valid_isin, security_type, parse
        self.assertEqual(valid_isin('US0378331005'),'US0378331005')
        self.assertIsNone(valid_isin('US0378331006'))
        self.assertEqual(security_type('Company - American Depositary Shares'),'depositary-receipt')
        self.assertEqual(security_type('Company - Preferred Stock'),'preferred')
        self.assertEqual(security_type('Company - Class B Common Stock'),'ordinary')
        body=b'Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares\nABC|ABC Inc. - Class A Common Stock|Q|N|N|100|N|N\nABCW|ABC Inc. - Warrants|Q|N|N|100|N|N\nFile Creation Time: 1022202603:03|||||||\n'
        rows,asof,_=parse(body,'nasdaq')
        self.assertEqual(len(rows),2);self.assertEqual(asof,'2026-10-22')
        self.assertEqual(rows[0]['shareType'],'ordinary');self.assertEqual(rows[1]['shareType'],'warrant-right')
        self.assertIsNone(rows[0]['isin']);self.assertIsNone(rows[0]['country']);self.assertEqual(rows[0]['listingCountry'],'US')

    def test_failure_diagnostics_do_not_prove_delisting(self):
        from ai_equity_diagnostics import category
        for message,expected in [('HTTP Error 404: Not Found','http-404-symbol-unresolved'),('HTTP Error 429','rate-limit'),('Clôtures attendues manquantes : 2026-10-21','expected-provider-session-missing'),('Wrong Yahoo identity/currency/interval','provider-symbol-currency-interval-mismatch')]:
            self.assertEqual(category({'status':'temporary-failure','reason':message}),expected)

    def test_series_shards_keep_anchor_and_only_requested_assets(self):
        import tempfile,pathlib
        from ai_portfolio_series import persist,hydrate
        with tempfile.TemporaryDirectory() as temp:
            folder=pathlib.Path(temp);price={'qualified':True,'anchorDate':'2026-01-02','points':{'2026-01-02':{'synthetic':100}}}
            market={'series':{'a':price,'b':price},'universe':[{'id':'a'},{'id':'b'}]}
            compact=persist(market,folder,set(),{'a','b'})
            self.assertEqual(compact['series'],{})
            hydrate(compact,folder,{'a'})
            self.assertEqual(compact['series'],{'a':price})

class InternationalCalendarAndCutoff(unittest.TestCase):
    def test_official_krx_constitution_day_is_not_a_missing_session(self):
        rows=calendars([{'calendar':'XKRX'}],'2026-07-13','2026-07-22')['XKRX']
        self.assertNotIn('2026-07-17',rows)
        self.assertIn('2026-07-16',rows)
        self.assertIn('2026-07-20',rows)

    def test_certification_does_not_require_prices_after_accounting_cutoff(self):
        base=DailyTests();base.setUp();now=base.now.replace(hour=23)
        # Today's completed session is intentionally absent; yesterday's full report is valid.
        self.assertTrue(parse_prices(base.raw,base.asset,base.calendar,now,through='2026-02-09')['qualified'])
        with self.assertRaisesRegex(ValueError,'manquantes'):
            parse_prices(base.raw,base.asset,base.calendar,now,through='2026-02-10')

class TaiwanOfficialFX(unittest.TestCase):
    def fixture(self):
        import json
        base=DailyTests();base.setUp();days=calendars([{'calendar':'XTAI'}],'2026-01-01','2026-02-09')['XTAI']
        raw=[{'日期':d.replace('-',''),'NTD_USD':'30'} for d in days]
        fx={'rates':{d:{'USD':1.2,'GBP':.8,'CHF':1.1} for d in base.calendar if d<'2026-02-10'},'validThrough':'2026-02-09','expectedDates':[d for d in base.calendar if d<'2026-02-10']}
        return base,raw,fx
    def test_cbc_interbank_cross_keeps_two_exact_fixing_dates(self):
        import json
        from ai_portfolio_fx import enrich_twd,validate_fx_date
        base,raw,fx=self.fixture();body=json.dumps(raw).encode()
        result=enrich_twd(fx,base.now,'2026-01-01',lambda *a,**k:body,required=True)
        self.assertAlmostEqual(result['rates']['2026-01-09']['TWD'],36)
        self.assertEqual(result['derivedFixingOrigins']['TWD']['2026-01-09']['TWDUSDDate'],'2026-01-09')
        self.assertEqual(result['derivedFixingOrigins']['TWD']['2026-01-09']['USDEURDate'],'2026-01-09')
        validate_fx_date(result,'TWD','2026-01-11') # Official weekend carry, no invented fixing.
        untouched=enrich_twd(fx,base.now,'2026-01-01',lambda *a,**k:self.fail('Inactive catalogue must not download CBC'),previous=result,required=False)
        self.assertEqual(untouched['rates']['2026-01-09']['TWD'],36)
    def test_missing_cbc_workday_is_not_carried(self):
        import json
        from ai_portfolio_fx import enrich_twd,validate_fx_date,parse_cbc
        base,raw,fx=self.fixture();raw=[r for r in raw if r['日期']!='20260108'];body=json.dumps(raw).encode()
        result=enrich_twd(fx,base.now,'2026-01-01',lambda *a,**k:body,required=True)
        self.assertNotIn('TWD',result['rates']['2026-01-08'])
        with self.assertRaisesRegex(ValueError,'Change historique'):validate_fx_date(result,'TWD','2026-01-08')
        with self.assertRaisesRegex(ValueError,'Duplicate'):parse_cbc(json.dumps(raw+[raw[0]]).encode(),base.now,'2026-01-01')

class SecurityDescriptorDisambiguation(unittest.TestCase):
    def test_company_words_do_not_change_share_class(self):
        from discover_ai_equities import security_type
        self.assertEqual(security_type('Preferred Bank - Common Stock'),'ordinary')
        self.assertEqual(security_type('Unit Corporation - Common Stock'),'ordinary')
        self.assertEqual(security_type('Company - Depositary Shares each representing Preferred Stock'),'preferred')
        self.assertEqual(security_type('Company ADS'),'depositary-receipt')

class DurableQualificationCheckpoints(unittest.TestCase):
    def test_replay_restores_latest_attempt_without_destroying_prices(self):
        import tempfile,pathlib,json
        from qualify_ai_portfolios import replay_checkpoints
        with tempfile.TemporaryDirectory() as temp:
            folder=pathlib.Path(temp);(folder/'qualification-checkpoints').mkdir()
            old={'a':{'id':'a','status':'qualified','lastAttempt':'2026-01-01'}};market={'status':{},'series':{'a':{'anchorDate':'2026-01-01'}}}
            record=[{'id':'a','status':'temporary-failure','lastAttempt':'2026-01-02','reason':'HTTP 429'},{'id':'b','status':'qualified','lastAttempt':'2026-01-03','coverageThrough':'2026-01-02'}]
            (folder/'qualification-checkpoints/001.json').write_text(json.dumps(record))
            replay_checkpoints(market,old,folder)
            self.assertEqual(old['a']['lastAttempt'],'2026-01-02');self.assertFalse(market['status']['a']['ok']);self.assertTrue(market['status']['b']['ok'])
            self.assertEqual(market['series']['a']['anchorDate'],'2026-01-01')
            snapshot=json.dumps([old,market],sort_keys=True);replay_checkpoints(market,old,folder);self.assertEqual(json.dumps([old,market],sort_keys=True),snapshot)
