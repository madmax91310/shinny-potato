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
        self.assertEqual(current['example'],enriched)
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
        self.assertEqual(report['errors'],[])
        newer=copy.deepcopy(current);newer['prices']['asOf']='2026-10'
        unchanged,report=refresh(newer,NOW,xml)
        self.assertEqual(unchanged['prices'],newer['prices'])
        self.assertEqual(len(report['errors']),3)
    def test_xndx_daily_identity_and_finished_session(self):
        config=next(c for c in configurations() if c['id']=='nasdaq100')
        self.assertEqual((config['parser'],config['symbol'],config['variant']),('fred','XNDX','TOTAL'))
        config={**config,'parser':'yahoo','symbol':'^XNDX'}
        stamp=int(dt.datetime(2026,10,7,20,tzinfo=UTC).timestamp())
        body={'chart':{'error':None,'result':[{'meta':{'symbol':'^XNDX','currency':'USD','dataGranularity':'1d','exchangeTimezoneName':'America/New_York'},'timestamp':[stamp],'indicators':{'quote':[{'close':[36000.25]}]}}]}}
        r=collect_level(config,NOW,json_fetch=lambda _:body)
        self.assertEqual((r['symbol'],r['variant'],r['value'],r['asOf']),('^XNDX','TOTAL',36000.25,'2026-10-07'))
        body['chart']['result'][0]['meta']['symbol']='^NDX'
        with self.assertRaises(ValueError):collect_level(config,NOW,json_fetch=lambda _:body)

    def test_xndx_fred_daily_concordance_and_explicit_source_migration(self):
        from refresh_anniversary_levels import xndx_source_upgrade
        config=next(c for c in configurations()if c['id']=='nasdaq100')
        raw=b'observation_date,NASDAQXNDX\n2026-10-06,35900.1\n2026-10-07,36000.25\n2026-10-08,37000\n'
        table=b"""<table aria-label="metadata - NASDAQ-100 Total Return"><tr><th>Title</th><td>NASDAQ-100 Total Return</td></tr><tr><th>Series ID</th><td>NASDAQXNDX</td></tr><tr><th>Source</th><td>Nasdaq, Inc.</td></tr><tr><th>Frequency</th><td>Daily</td></tr><tr><th>Units</th><td>Index</td></tr></table><table id="data-table-observations"><thead><tr><th>DATE</th><th>VALUE</th></tr></thead><tbody><tr><th>2026-10-06</th><td>35900.1</td></tr></tbody></table><div id="extra-rows">#2026-10-07|36000.25 #2026-10-08|37000</div>"""
        calls=[]
        def fetch(url):calls.append(url);return raw if 'fredgraph.csv' in url else table
        new=collect_level(config,NOW,byte_fetch=fetch)
        self.assertEqual((new['value'],new['asOf'],new['seriesId']),(36000.25,'2026-10-07','NASDAQXNDX'))
        self.assertEqual(len(calls),2);self.assertEqual(len(new['sourceHashes']),2)
        old={'value':35900.1,'asOf':'2026-10-06','parser':'yahoo','symbol':'^XNDX','currency':'USD','variant':'TOTAL','indexCode':None}
        merged,report=refresh_levels({'nasdaq100':old},NOW,lambda *_:new,selected=[config])
        self.assertFalse(report['errors']);self.assertEqual(merged['nasdaq100'],new)
        for bad in [{**new,'variant':'PRICE'},{**new,'symbol':'NDX'},{**new,'isin':'US0000000000'},{**new,'sourceHashes':{}},{**new,'asOf':'2026-10-05'}]:
            retained,report=refresh_levels({'nasdaq100':old},NOW,lambda *_:bad,selected=[config])
            self.assertTrue(report['errors']);self.assertEqual(retained['nasdaq100'],old)
        self.assertFalse(xndx_source_upgrade('other',old,new))
        for bad in [raw.replace(b'NASDAQXNDX',b'NASDAQ100'),raw.replace(b'36000.25',b'-1'),raw.replace(b'2026-10-07',b'2026-10-06')]:
            with self.assertRaises(ValueError):collect_level(config,NOW,byte_fetch=lambda u:bad if 'fredgraph.csv'in u else table)
        def conflict(url):return raw if 'fredgraph.csv' in url else table.replace(b'36000.25',b'36001.25')
        with self.assertRaises(ValueError):collect_level(config,NOW,byte_fetch=conflict)
        for bad in [table.replace(b'NASDAQXNDX',b'NASDAQ100'),table.replace(b'2026-10-08|37000',b'2026-10-07|37000'),table.replace(b'Nasdaq, Inc.',b'Other')]:
            with self.assertRaises(ValueError):collect_level(config,NOW,byte_fetch=lambda u:raw if 'fredgraph.csv'in u else bad)

    def test_completed_session_and_preservation(self):
        self.assertEqual(completed([(dt.date(2026,10,7),100),(dt.date(2026,10,8),200)],NOW),('2026-10-07',100))
        with self.assertRaises(ValueError):completed([(dt.date(2026,9,20),100)],NOW)
        current={'bitcoin':{'value':100,'asOf':'2026-10-07'}}
        def fail(config,now):raise ValueError('Network unavailable')
        updated,report=refresh_levels(current,NOW,fail)
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
