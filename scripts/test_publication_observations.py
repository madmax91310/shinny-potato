import copy
import datetime as dt
import json
import pathlib
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET
from refresh_purchasing_power import SOURCES, refresh, parse_series
from refresh_anniversary_levels import completed, collect_one as collect_level, refresh as refresh_levels, configurations
from publish_automation_status import normalize_report, update_status
from data_automation import UTC

NOW=dt.datetime(2026,10,8,12,tzinfo=UTC)
ROOT=pathlib.Path(__file__).resolve().parents[1]

def xml(key):
    source=json.loads((ROOT/'scripts/fixtures/publication/insee-2026-10-08.json').read_text())
    data=source['prices']['sources'][key] if key in ('general','alimentation','energie') else source[key]['source']
    node=ET.Element('Series',dict(zip(('IDBANK','FREQ','REF_AREA','TITLE_FR'),SOURCES[key])))
    for period,value in data['values'].items():
        ET.SubElement(node,'Obs',TIME_PERIOD=period,OBS_VALUE=str(value),OBS_STATUS='P' if data['quality'][period]=='P' else 'A',OBS_QUAL=data['quality'][period])
    return ET.tostring(node,encoding='unicode')

class PublicationTests(unittest.TestCase):
    def test_anniversary_identity_enrichment_preserves_quote_convention(self):
        old={'value':100,'asOf':'2026-10-07','currency':'EUR','parser':'yahoo','symbol':'EXAMPLE.PA'}
        enriched={**old,'isin':'FR0011550193','ticker':'EXAMPLE','mic':'XPAR'}
        current,report=refresh_levels({'example':old},NOW,lambda *_:enriched,selected=[{'id':'example'}])
        self.assertEqual(current['example'],{**enriched,'checkedAt':NOW.isoformat()})
        self.assertFalse(report['errors'])
        for bad in [{**enriched,'isin':'FR0013412012'},{k:v for k,v in enriched.items() if k!='isin'},
                    {**enriched,'symbol':'OTHER.PA'},{**enriched,'currency':'USD'},
                    {**enriched,'asOf':'2026-10-06'}]:
            retained,report=refresh_levels({'example':enriched},NOW,lambda *_:bad,selected=[{'id':'example'}])
            self.assertEqual(retained['example'],enriched)
            self.assertEqual(len(report['errors']),1)

    def test_msci_daily_recovery_and_exact_completed_window(self):
        config={'id':'test','parser':'msci','indexCode':'123','currency':'USD','variant':'GRTR'}
        body={'msci_index_code':'123','ISO_currency_symbol':'USD','index_variant_type':'GRTR',
              'indexes':{'INDEX_LEVELS':[{'calc_date':'20261007','level_eod':100}]}}
        with patch('refresh_monthly_history.get_json',return_value=body) as fetch:
            record=collect_level(config,NOW)
            self.assertEqual(record['asOf'],'2026-10-07')
            self.assertEqual(record['value'],100)
            self.assertEqual(fetch.call_args.kwargs,{'max_attempts':5})
        for field,value in [('msci_index_code','456'),('ISO_currency_symbol','EUR'),('index_variant_type','NETR')]:
            bad={**body,field:value}
            with self.assertRaises(ValueError):collect_level(config,NOW,lambda _:bad)
        for day in ['20260901','20261008','20261009']:
            bad=copy.deepcopy(body);bad['indexes']['INDEX_LEVELS'][0]['calc_date']=day
            with self.assertRaisesRegex(ValueError,'outside requested'):
                collect_level(config,NOW,lambda _:bad)

    def test_exact_identity_holes_quality_and_dates(self):
        raw=xml('general')
        self.assertEqual(parse_series(raw,'general',NOW)['values']['2026-09'],102.99)
        for attrs in [{'IDBANK':'bad'},{'FREQ':'A'},{'REF_AREA':'FM'},{'TITLE_FR':'Wrong base'}]:
            node=ET.fromstring(raw);node.attrib.update(attrs)
            with self.assertRaises(ValueError):parse_series(ET.tostring(node,encoding='unicode'),'general',NOW)
        for alteration in ['duplicate','hole','future','quality','zero','nan']:
            node=ET.fromstring(raw)
            if alteration=='duplicate':node.append(copy.deepcopy(node[0]))
            elif alteration=='hole':node.remove(node[20])
            elif alteration=='future':node[-1].set('TIME_PERIOD','2026-10')
            elif alteration=='quality':node[-1].set('OBS_QUAL','UNKNOWN')
            else:node[-1].set('OBS_VALUE','0' if alteration=='zero' else 'nan')
            with self.assertRaises(ValueError):parse_series(ET.tostring(node,encoding='unicode'),'general',NOW)
    def test_atomic_prices_independent_smic_and_recovery(self):
        current=json.loads((ROOT/'scripts/fixtures/publication/insee-2026-10-08.json').read_text())
        def fetch(key):
            if key=='energie':raise ValueError('Unavailable')
            return xml(key)
        updated,report=refresh(current,NOW,fetch)
        self.assertEqual(updated['prices'],current['prices'])
        self.assertIn({'id':'purchasing-smic'},report['successes'])
        self.assertEqual(report['errors'][0]['id'],'purchasing-energie')
        _,report=refresh(current,NOW,xml)
        self.assertEqual(len(report['successes']),5)
        self.assertEqual(set(report['scope']['expectedIds']),{'purchasing-'+k for k in SOURCES})
        self.assertEqual({r['status']for r in report['outcomes']},{'unchanged-verified'})
        checked,_=refresh(current,NOW,xml)
        self.assertEqual(checked['prices']['asOf'],current['prices']['asOf'])
        self.assertEqual(checked['prices']['checkedAt'],NOW.isoformat())
        self.assertEqual(report['errors'],[])
        newer=copy.deepcopy(current);newer['prices']['asOf']='2026-10'
        unchanged,report=refresh(newer,NOW,xml)
        self.assertEqual(unchanged['prices'],newer['prices'])
        self.assertEqual(len(report['errors']),3)
    def test_xndx_forming_only_publication_retains_exact_previous_session(self):
        from refresh_anniversary_levels import XNDX_URLS
        config=next(c for c in configurations()if c['id']=='nasdaq100')
        now=dt.datetime(2026,10,23,15,tzinfo=UTC)
        raw=json.loads((ROOT/'scripts/fixtures/publication/xndx-intraday-20261023.json').read_text())
        def fetch(url):
            body=copy.deepcopy(raw)
            body['chart']['result'][0]['meta']['range']='5d' if 'range=5d' in url else '1d'
            return body
        old={'value':35396.16015625,'asOf':'2026-10-22','parser':'yahoo','symbol':'^XNDX','currency':'USD','variant':'TOTAL','quoteMethod':'supported-xndx-ranges','sourceHashes':{url:'a'*64 for url in XNDX_URLS}}
        current={'nasdaq100':old}
        updated,report=refresh_levels(current,now,lambda c,n:collect_level(c,n,json_fetch=fetch),selected=[config])
        self.assertEqual(updated,current)
        self.assertEqual(report['errors'],[])
        self.assertEqual(report['successes'],[],'An unfinished candle never renews the last successful control')
        self.assertEqual(report['waiting'][0]['retainedAsOf'],'2026-10-22')
        self.assertEqual(len(report['waiting'][0]['evidence']['sourceHashes']),2)
        for defect in [{'asOf':'2026-10-21'},{'value':35395},{'variant':'PRICE'},{'sourceHashes':{}}]:
            previous={'nasdaq100':{**old,**defect}}
            retained,failed=refresh_levels(previous,now,lambda c,n:collect_level(c,n,json_fetch=fetch),selected=[config],date_fetch=lambda _: (_ for _ in ()).throw(OSError('isolated source unavailable')))
            self.assertEqual(retained,previous)
            self.assertTrue(failed['errors'])
            self.assertEqual(failed['waiting'],[])
        # Once a close is due, a provider still returning a forming candle is a failure.
        late=dt.datetime(2026,10,23,21,tzinfo=UTC)
        with self.assertRaises(ValueError):collect_level(config,late,json_fetch=fetch)


    def xndx_recovery_case(self):
        from refresh_anniversary_levels import XNDX_URLS
        config=next(c for c in configurations()if c['id']=='nasdaq100')
        now=dt.datetime(2026,10,28,19,3,2,tzinfo=UTC)
        raw={window:json.loads((ROOT/f'scripts/fixtures/publication/xndx-recovery-20261028-yahoo{window}.json').read_text())for window in ['5d','1d']}
        def collect(c,n):return collect_level(c,n,json_fetch=lambda url:copy.deepcopy(raw['5d'if 'range=5d'in url else'1d']))
        old={'value':35781.52734375,'asOf':'2026-10-26','checkedAt':'2026-10-27T11:44:28.010154+00:00','parser':'yahoo','symbol':'^XNDX','currency':'USD','variant':'TOTAL','quoteMethod':'supported-xndx-ranges','sourceHashes':{url:'a'*64 for url in XNDX_URLS}}
        fred=(ROOT/'scripts/fixtures/publication/xndx-recovery-20261028-fred.csv').read_bytes()
        return config,now,collect,old,fred

    def test_xndx_missed_close_recovered_from_dated_independent_series_and_idempotent(self):
        config,now,collect,old,fred=self.xndx_recovery_case();calls=[]
        def fetch(url):calls.append(url);return fred
        updated,report=refresh_levels({'nasdaq100':old},now,collect,selected=[config],date_fetch=fetch)
        self.assertFalse(report['errors']);self.assertEqual(report['outcomes'][0]['status'],'succeeded')
        value=updated['nasdaq100'];self.assertEqual(value['asOf'],'2026-10-27');self.assertEqual(value['value'],36243.918)
        self.assertEqual(value['previousCloseDateEvidence']['value'],36243.92)
        self.assertEqual(value['previousCloseDateEvidence']['asOf'],value['asOf'])
        self.assertEqual(value['previousCloseDateEvidence']['seriesId'],'NASDAQXNDX')
        self.assertEqual(value['checkedAt'],now.isoformat());self.assertIn('id=NASDAQXNDX',calls[0]);self.assertIn('coed=2026-10-27',calls[0])
        self.assertNotEqual(value['value'],36373.625,'An unfinished current quote is never used')
        self.assertEqual(len(value['sourceHashes']),2);self.assertTrue(all(h!='a'*64 for h in value['sourceHashes'].values()))
        repeated,report=refresh_levels(updated,now,collect,selected=[config],date_fetch=lambda _:self.fail('Already qualified previous session needs no FRED retry'))
        self.assertEqual(repeated,updated);self.assertFalse(report['successes']);self.assertEqual(len(report['waiting']),1)

    def test_xndx_dated_recovery_never_invents_date_identity_or_source_success(self):
        config,now,collect,old,fred=self.xndx_recovery_case()
        failures=[b'',fred.replace(b'NASDAQXNDX',b'NASDAQ100'),fred.replace(b'2026-10-27,36243.92',b'2026-10-27,36243.93'),
                  fred.replace(b'2026-10-27,36243.92',b'2026-10-27,'),fred.replace(b'2026-10-27',b'2026-10-28'),
                  fred.replace(b'36243.92',b'NaN'),fred+b'2026-10-27,36243.92\n',b'<html>HTTP200 login</html>']
        for body in failures:
            with self.subTest(body=body[-70:]):
                updated,report=refresh_levels({'nasdaq100':old},now,collect,selected=[config],date_fetch=lambda _,b=body:b)
                self.assertEqual(updated,{'nasdaq100':old});self.assertFalse(report['successes']);self.assertEqual(report['outcomes'][0]['status'],'failed')
                self.assertEqual(report['outcomes'][0]['lastSuccessAt'],old['checkedAt']);self.assertEqual(report['outcomes'][0]['asOf'],old['asOf'])
        for defect in [{'currency':'EUR'},{'variant':'PRICE'},{'sourceHashes':{}},{'asOf':'2026-10-28'},{'asOf':'2026-10-27','value':36200}]:
            prior={'nasdaq100':{**old,**defect}}
            updated,report=refresh_levels(prior,now,collect,selected=[config],date_fetch=lambda _:fred)
            self.assertEqual(updated,prior);self.assertTrue(report['errors'])
        # A failed fallback does not prevent a distinct validated source from being kept.
        def sources(c,n):return collect(c,n)if c['id']=='nasdaq100'else{'value':100,'asOf':'2026-10-27','currency':'EUR','parser':'example'}
        updated,report=refresh_levels({'nasdaq100':old},now,sources,selected=[config,{'id':'other'}],date_fetch=lambda _:(_ for _ in()).throw(OSError('network down')))
        self.assertEqual(updated['nasdaq100'],old);self.assertEqual(updated['other']['value'],100)
        self.assertEqual(len(report['errors']),1);self.assertEqual(len(report['successes']),1)

    def test_xndx_dated_recovery_exchange_holiday_and_year_boundary(self):
        from refresh_anniversary_levels import PublicationPending,XNDX_URLS
        config,_,_,old,_=self.xndx_recovery_case()
        for session,expected,prior in [('2026-10-26','2026-10-23','2026-10-22'),('2027-01-04','2026-12-31','2026-12-30')]:
            now=dt.datetime.fromisoformat(session+'T16:00:00+00:00')
            def collect(*_):raise PublicationPending({'session':session,'previousClose':200.002,'sourceHashes':{url:'b'*64 for url in XNDX_URLS}})
            def fetch(url):
                self.assertIn('coed='+expected,url)
                return ('observation_date,NASDAQXNDX\n'+expected+',200.00\n').encode()
            updated,report=refresh_levels({'nasdaq100':{**old,'asOf':prior,'checkedAt':prior+'T22:00:00+00:00'}},now,collect,selected=[config],date_fetch=fetch)
            self.assertFalse(report['errors']);self.assertEqual(updated['nasdaq100']['asOf'],expected)

    def test_xndx_supported_ranges_and_completed_session(self):
        from refresh_anniversary_levels import XNDX_URLS
        config=next(c for c in configurations()if c['id']=='nasdaq100')
        stamp=int(dt.datetime(2026,10,7,20,15,tzinfo=UTC).timestamp())
        def body(url,stamp=stamp):
            return {'chart':{'error':None,'result':[{'meta':{'symbol':'^XNDX','currency':'USD','dataGranularity':'1d','exchangeTimezoneName':'America/New_York','instrumentType':'INDEX','longName':'NASDAQ-100 Total Return','range':'5d'if 'range=5d'in url else '1d'},'timestamp':[stamp],'indicators':{'quote':[{'close':[36000.25]}]}}]}}
        calls=[]
        def fetch(url):calls.append(url);return body(url)
        record=collect_level(config,NOW,json_fetch=fetch)
        self.assertEqual((record['value'],record['asOf']),(36000.25,'2026-10-07'))
        self.assertEqual(calls,XNDX_URLS);self.assertEqual(set(record['sourceHashes']),set(XNDX_URLS))
        def intraday(url):
            data=body(url);payload=data['chart']['result'][0]
            today=int(dt.datetime(2026,10,8,14,tzinfo=UTC).timestamp())
            payload['timestamp'].append(today)
            payload['indicators']['quote'][0]['close'].append(36100.0)
            return data
        # Both supported five-day windows retain the last complete session.
        # Today's forming candle must never replace it.
        midday=dt.datetime(2026,10,8,15,tzinfo=UTC)
        previous=collect_level(config,midday,json_fetch=intraday)
        self.assertEqual((previous['asOf'],previous['value']),('2026-10-07',36000.25))
        old={'value':35900.1,'asOf':'2026-10-06','parser':'fred','symbol':'XNDX','seriesId':'NASDAQXNDX','currency':'USD','variant':'TOTAL','indexCode':None}
        merged,report=refresh_levels({'nasdaq100':old},NOW,lambda *_:record,selected=[config])
        self.assertFalse(report['errors']);self.assertEqual(merged['nasdaq100'],{**record,'checkedAt':NOW.isoformat()})
        for bad in [{**record,'variant':'PRICE'},{**record,'symbol':'^NDX'},{**record,'sourceHashes':{}},{**record,'isin':'US0000000000'},{**record,'asOf':'2026-10-05'}]:
            retained,report=refresh_levels({'nasdaq100':old},NOW,lambda *_:bad,selected=[config])
            self.assertTrue(report['errors']);self.assertEqual(retained['nasdaq100'],old)
        def changed(url,key,value):
            data=body(url);data['chart']['result'][0]['meta'][key]=value;return data
        for key,value in [('symbol','^NDX'),('currency','EUR'),('instrumentType','ETF'),('longName','Nasdaq 100'),('range','1mo'),('exchangeTimezoneName','UTC')]:
            with self.assertRaises(ValueError):collect_level(config,NOW,json_fetch=lambda url:changed(url,key,value))
        def conflict(url):
            data=body(url)
            if 'query2'in url:data['chart']['result'][0]['indicators']['quote'][0]['close']=[36001.25]
            return data
        with self.assertRaises(ValueError):collect_level(config,NOW,json_fetch=conflict)
        # A current day is not a completed candle merely because it exists.
        today=int(dt.datetime(2026,10,8,19,tzinfo=UTC).timestamp())
        with self.assertRaises(ValueError):collect_level(config,NOW,json_fetch=lambda url:body(url,today))
        close=int(dt.datetime(2026,10,8,20,tzinfo=UTC).timestamp());quote=close+900
        def finished(url):
            data=body(url,quote);data['chart']['result'][0]['meta'].update(regularMarketPrice=36000.25,regularMarketTime=quote,currentTradingPeriod={'regular':{'start':close-23400,'end':close}});return data
        completed=collect_level(config,dt.datetime(2026,10,8,21,tzinfo=UTC),json_fetch=finished)
        self.assertEqual(completed['asOf'],'2026-10-08')
        with self.assertRaises(ValueError):collect_level(config,dt.datetime(2026,10,8,19,tzinfo=UTC),json_fetch=finished)
        def bad_quote(url):
            data=finished(url);data['chart']['result'][0]['meta']['regularMarketPrice']=36001
            return data
        with self.assertRaises(ValueError):collect_level(config,dt.datetime(2026,10,8,21,tzinfo=UTC),json_fetch=bad_quote)

    def test_completed_session_and_preservation(self):
        self.assertEqual(completed([(dt.date(2026,10,7),100),(dt.date(2026,10,8),200)],NOW),('2026-10-07',100))
        with self.assertRaises(ValueError):completed([(dt.date(2026,9,20),100)],NOW)
        current={'bitcoin':{'value':100,'asOf':'2026-10-07'}}
        def fail(config,now):raise ValueError('Network unavailable')
        updated,report=refresh_levels(current,NOW,fail,selected=configurations())
        self.assertEqual(updated['bitcoin'],current['bitcoin'])
        self.assertEqual(len(report['errors']),len(configurations()))
        self.assertEqual(len(configurations()),len({c['id']for c in configurations()}))
        etfs=[c for c in configurations() if c.get('consumerScope')=='catalog']
        expected = {s['id']for s in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']if s.get('consumerScope')=='catalog'and s.get('collectAnniversary')}
        self.assertEqual({c['id']for c in etfs}, expected)
        self.assertTrue(all(c['field']=='close' and c['collectAnniversary'] for c in etfs))
    def test_etf_partial_errors_cannot_be_cleared_by_other_connector(self):
        failed=normalize_report({'_collector':'primary','shares':[{'isin':'ISIN','status':'validated','collectionErrors':[{'field':'performance','reason':'Missing table'}]}]})
        recovered=normalize_report({'_collector':'secondary','shares':[{'isin':'ISIN','status':'validated'}]})
        self.assertNotEqual(failed['errors'][0]['id'],recovered['successes'][0]['id'])
        self.assertEqual(failed['successes'],[])
    def test_partial_index_alerts_and_recovery(self):
        failed=normalize_report({'indices':[{'id':'example','errors':[{'field':'composition','reason':'Identity mismatch'}],'returns':{'asOf':'2026-09-30'}}]})
        self.assertEqual(failed['errors'][0]['id'],'index-example-composition')
        self.assertEqual(failed['successes'],[{'id':'index-example-returns'}])
        r={'id':1,'path':'.github/workflows/collect-etf-pilot.yml','head_branch':'master','event':'schedule','status':'completed','conclusion':'failure','updated_at':'2026-10-08T12:00:00Z','html_url':'https://github.com/test/run'}
        state=update_status({},r,[],[failed])
        self.assertIn('index-example-composition',state['workflows']['collect-etf-pilot.yml']['dataFailures'])
        r.update(id=2,conclusion='success',updated_at='2026-10-09T12:00:00Z')
        state=update_status(state,r,[],[{'indices':[{'id':'example','facts':{'asOf':'2026-09-30'},'errors':[]}]}])
        self.assertEqual(state['workflows']['collect-etf-pilot.yml']['status'],'success')

if __name__=='__main__':unittest.main()
