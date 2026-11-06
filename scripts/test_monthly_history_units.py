import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
from zoneinfo import ZoneInfo
from unittest.mock import patch
from qualified_history_units import bnke_split, wood_quotes, BNKE_NOTICE, SIX_ID, SIX_PRICES, withhold_isolated_scale_points
from refresh_monthly_history import collect_yahoo, refresh, yahoo_chart

ROOT=Path(__file__).resolve().parents[1]
FIX=ROOT/'scripts/fixtures/investment-units-20261106'
NOW=dt.datetime(2026,11,6,tzinfo=dt.timezone.utc)

def read(name):
    p=FIX/name
    return json.loads(gzip.decompress(p.read_bytes()) if name.endswith('.gz') else p.read_bytes())

class HistoryUnits(unittest.TestCase):
    def setUp(self):
        sources=json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']
        self.bank=next(s for s in sources if s['id']=='etfLU1829219390')
        self.wood=next(s for s in sources if s['id']=='etf_timber_ishares')
        self.responses={r['url']:read(r['file'])for r in read('receipts.json')}
        self.responses.update({SIX_ID:read('wood-six-identity.json'),SIX_PRICES:read('wood-six-feb-chart.json')})
        self.notice=gzip.decompress((FIX/'bnke-notice.html.gz').read_bytes())
        self.nav=read('bnke-official.json.gz')

    def bank_result(self,responses=None):
        with patch('qualified_history_units.download',return_value=self.notice),patch('collect_amundi_etf.fetch_api',return_value=self.nav):
            return collect_yahoo(self.bank,NOW,lambda u:(responses or self.responses)[u])

    def test_real_split_neutralised_and_actual_historical_quote_preserved(self):
        r=self.bank_result();p=dict(r['points']);a=dict(r['anniversaryPoints'])
        self.assertEqual(p['2026-09'],4.9175);self.assertEqual(p['2026-10'],4.3505)
        self.assertEqual(a['2026-09'],393.399994)
        self.assertEqual(r['splitAdjustmentEvidence']['ratio'],80)
        self.assertEqual(r['splitAdjustmentEvidence']['exDate'],'2026-10-27')
        self.assertEqual(r['splitAdjustmentEvidence']['unverifiedMonths'],[])
        # Independent issuer monthly return is close, never equated to market return.
        n={c['date'][:7]:c['officialAdjustedNav']for c in r['splitAdjustmentEvidence']['checks']}
        self.assertLess(abs((p['2026-10']/p['2020-01']-n['2026-10']/n['2020-01'])*100),1)

    def test_next_collection_and_already_adjusted_provider_do_not_double_adjust(self):
        before=self.bank_result();responses=copy.deepcopy(self.responses)
        for u,b in responses.items():
            if 'BNKE.PA'not in u:continue
            d=b['chart']['result'][0]
            for i,stamp in enumerate(d['timestamp']):
                if dt.datetime.fromtimestamp(stamp,ZoneInfo('Europe/Paris')).date().isoformat()<'2026-10-01':
                    for indicator in ['quote','adjclose']:
                        if indicator not in d['indicators']:continue
                        key='close'if indicator=='quote'else'adjclose'
                        v=d['indicators'][indicator][0][key][i]
                        if v is not None:d['indicators'][indicator][0][key][i]=v/80
        after=self.bank_result(responses)
        self.assertEqual(before['points'],after['points']);self.assertEqual(before['anniversaryPoints'],after['anniversaryPoints'])
        again=bnke_split(self.bank,before,NOW,lambda _:self.notice,lambda _:self.nav)
        self.assertEqual(again['points'],before['points'])
        self.assertEqual(again['anniversaryPoints'],before['anniversaryPoints'])
        self.assertEqual(again['splitAdjustmentEvidence'],before['splitAdjustmentEvidence'])
        self.assertEqual(again['sourceUrls'],before['sourceUrls'])

    def test_wrong_split_document_or_currency_never_admitted(self):
        result=self.bank_result()
        for a,b in [('LU1829219390','LU0000000000'),('factor 1:80','factor 1:40'),('27 October 2026','28 October 2026')]:
            with self.subTest(a=a),self.assertRaises(ValueError):bnke_split(self.bank,result,NOW,lambda _:self.notice.replace(a.encode(),b.encode()),lambda _:self.nav)
        bad=copy.deepcopy(self.nav);bad['products'][0]['characteristics']['CURRENCY']='USD'
        with self.assertRaises(ValueError):bnke_split(self.bank,result,NOW,lambda _:self.notice,lambda _:bad)

    def test_wrong_identity_and_future_event_refused(self):
        for c in [{**self.bank,'mic':'XAMS'},{**self.bank,'isin':'LU0000000000'}]:
            with self.assertRaises(ValueError):bnke_split(c,{},NOW,lambda _:self.notice,lambda _:self.nav)
        with self.assertRaises(ValueError):bnke_split(self.bank,{},dt.datetime(2026,10,20),lambda _:self.notice,lambda _:self.nav)

    def test_incomplete_official_month_is_withheld_without_interpolation(self):
        nav=copy.deepcopy(self.nav)
        for h in nav['products'][0]['historics']:
            h['historicalData']=[r for r in h['historicalData']if dt.datetime.fromtimestamp(r['date']/1000,dt.timezone.utc).date().isoformat()!='2026-09-30']
        r=bnke_split(self.bank,self.bank_result(),NOW,lambda _:self.notice,lambda _:nav)
        self.assertIn('2026-09',r['historyExcludedMonths'])
        self.assertIn('2026-09',r['historyExclusionReasons'])
        self.assertEqual(dict(r['points'])['2026-10'],4.3505)

    def test_real_isolated_month_uses_exchange_price_and_no_guessed_dividend(self):
        r=collect_yahoo(self.wood,NOW,lambda u:self.responses[u])
        self.assertEqual(dict(r['points'])['2026-02'],26.274302)
        self.assertEqual(dict(r['anniversaryPoints'])['2026-02'],26.66)
        self.assertEqual(len(r['historicalQuoteRepairEvidence']['checks']),3)
        raw=next(b for u,b in self.responses.items()if 'WOOD.SW'in u and 'interval=1d'in u)
        daily,_=yahoo_chart(raw,self.wood,'1d');old={}
        for day,close,value in daily:old[day.strftime('%Y-%m')]=round(value,6)
        for p in r['points']:
            if p[0]!='2026-02':self.assertEqual(p[1],old[p[0]])

    def test_shared_yahoo_error_without_primary_repair_is_only_quarantined(self):
        config={k:v for k,v in self.wood.items()if k!='historicalQuoteRepairSource'}
        r=collect_yahoo(config,NOW,lambda u:self.responses[u])
        self.assertEqual(dict(r['points'])['2026-02'],2627.430176)
        self.assertEqual(r['historyExcludedMonths'],['2026-02'])
        self.assertFalse(r['scaleInvestigation']['financialValidation'])
        self.assertEqual(dict(r['points'])['2026-03'],23.480318)

    def test_second_exchange_repair_is_idempotent(self):
        d=next(b for u,b in self.responses.items()if 'WOOD.SW'in u and 'interval=1d'in u)
        m=next(b for u,b in self.responses.items()if 'WOOD.SW'in u and 'interval=1mo'in u)
        daily,_=yahoo_chart(d,self.wood,'1d');monthly,_=yahoo_chart(m,self.wood,'1mo')
        a,b,p,_=wood_quotes(self.wood,daily,monthly,NOW,lambda u:self.responses[u])
        c,e,q,_=wood_quotes(self.wood,a,b,NOW,lambda u:self.responses[u])
        self.assertEqual((a,b),(c,e));self.assertEqual(q['status'],'already-correct')

    def test_unexplained_quote_or_wrong_exchange_never_rescaled(self):
        for mutate in ['price','identity','currency','missing','factor']:
            responses=copy.deepcopy(self.responses)
            if mutate=='price':responses[SIX_PRICES]['valors'][0]['data']['Close'][5]=27
            elif mutate=='identity':responses[SIX_ID]['rowData'][0][0]='IE0000000000'
            elif mutate=='currency':responses[SIX_ID]['rowData'][0][2]='GBp'
            elif mutate=='missing':responses[SIX_PRICES]['valors'][0]['data']['Date'].pop()
            else:
                b=next(b for u,b in responses.items()if 'WOOD.SW'in u and 'interval=1d'in u)['chart']['result'][0]
                b['indicators']['adjclose'][0]['adjclose']=[v*2 if v and v>100 else v for v in b['indicators']['adjclose'][0]['adjclose']]
            with self.subTest(mutate=mutate),self.assertRaises(ValueError):collect_yahoo(self.wood,NOW,lambda u:responses[u])

    def test_automatic_detection_withholds_only_isolated_unverified_month_without_editing(self):
        source={'points':[['2026-01',25],['2026-02',2600],['2026-03',23]],'anniversaryPoints':[['2026-01',25],['2026-02',2600],['2026-03',23]]}
        result=withhold_isolated_scale_points(source)
        self.assertEqual(result['points'],source['points']);self.assertEqual(result['anniversaryPoints'],source['anniversaryPoints'])
        self.assertEqual(result['historyExcludedMonths'],['2026-02'])
        self.assertFalse(result['scaleInvestigation']['financialValidation'])
        self.assertEqual(withhold_isolated_scale_points(result),result)
        real={'points':[['2024-04',2.21],['2024-05',8.275],['2024-06',12.0]]}
        self.assertEqual(withhold_isolated_scale_points(real),real)

    def test_failed_collection_keeps_last_verified_values_and_dates(self):
        previous=json.loads((ROOT/'src/data/automated-etf-monthly.json').read_text())[self.bank['id']]
        with patch('qualified_history_units.download',side_effect=OSError('official source unavailable')):
            merged,report=refresh({'series':[self.bank]},{self.bank['id']:previous},{},NOW,collect=lambda c,n:collect_yahoo(c,n,lambda u:self.responses[u]))
        self.assertEqual(merged[self.bank['id']],previous);self.assertEqual(report['series'][0]['status'],'failed');self.assertEqual(report['series'][0]['reason'],'official source unavailable')

if __name__=='__main__':unittest.main()
