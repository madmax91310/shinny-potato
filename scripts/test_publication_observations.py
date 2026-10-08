import copy
import datetime as dt
import json
import pathlib
import unittest
import xml.etree.ElementTree as ET
from refresh_purchasing_power import SOURCES, refresh, parse_series
from refresh_anniversary_levels import completed, refresh as refresh_levels, configurations
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
    def test_completed_session_and_preservation(self):
        self.assertEqual(completed([(dt.date(2026,10,7),100),(dt.date(2026,10,8),200)],NOW),('2026-10-07',100))
        with self.assertRaises(ValueError):completed([(dt.date(2026,9,20),100)],NOW)
        current={'bitcoin':{'value':100,'asOf':'2026-10-07'}}
        def fail(config,now):raise ValueError('Network unavailable')
        updated,report=refresh_levels(current,NOW,fail)
        self.assertEqual(updated['bitcoin'],current['bitcoin'])
        self.assertEqual(len(report['errors']),20)
        self.assertEqual(len(configurations()),20)
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
