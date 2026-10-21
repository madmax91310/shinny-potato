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
