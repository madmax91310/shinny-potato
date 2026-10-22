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
    def test_ecb_stale(self):
        body=b'<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube><Cube time="2026-01-02"><Cube currency="USD" rate="1.1"/><Cube currency="GBP" rate="0.8"/><Cube currency="CHF" rate="0.9"/></Cube></Cube></gesmes:Envelope>'
        with self.assertRaisesRegex(ValueError,'attendu manquant'):parse_fx(body,self.now)

if __name__=='__main__':unittest.main()
