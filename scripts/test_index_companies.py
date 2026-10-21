import datetime as dt
import unittest
import json
from pathlib import Path
from collect_index_documents import msci_composition
from refresh_index_companies import refresh

class RefreshCompaniesTests(unittest.TestCase):
    def test_korea_official_table_is_not_the_capped_fund(self):
        root=Path(__file__).resolve().parents[1]
        config=next(c for c in json.loads((root/'scripts/index-company-sources.json').read_text())['additionalIndices'] if c['id']=='msci-korea')
        facts=msci_composition((root/'scripts/fixtures/index-companies/korea.txt').read_text(),config,dt.datetime(2026,10,21,tzinfo=dt.timezone.utc))
        self.assertEqual(facts['asOf'],'2026-09-30')
        self.assertEqual(facts['index'],'MSCI Korea')
        self.assertEqual(len(facts['holdings']),10)
        self.assertEqual(facts['holdings'][0],['SAMSUNG ELECTRONICS CO',35.31])
        self.assertEqual(facts['holdings'][2],['SAMSUNG ELECTRONICS PREF',4.4])

    def test_partial_failure_retains_valid_data_and_original_date(self):
        previous={'dow-jones':{'facts':{'asOf':'2026-09-30','source':{'checkedAt':'2026-10-20'},'holdings':[['A',5]]}}}
        def collect(config,now):
            return {'id':config['id'],'errors':[{'field':'composition','reason':'offline'}]}
        result, _=refresh(previous,[{'id':'dow-jones'}],dt.datetime(2026,10,21,tzinfo=dt.timezone.utc),collect)
        self.assertEqual(result['dow-jones']['facts'],previous['dow-jones']['facts'])
        self.assertEqual(result['dow-jones']['status']['status'],'failed')
        self.assertEqual(result['dow-jones']['status']['lastSuccessAt'],'2026-10-20')
        self.assertNotIn('status',previous['dow-jones'])
    def test_one_failure_does_not_discard_another_index(self):
        def collect(config,now):
            return {'id':config['id'],'errors':[],'facts':{'asOf':'2026-09-30','source':{'checkedAt':'2026-10-21'}}} if config['id']=='ok' else {'id':config['id'],'errors':[{'field':'composition','reason':'offline'}]}
        result,_=refresh({},[{'id':'ok'},{'id':'failed'}],dt.datetime(2026,10,21,tzinfo=dt.timezone.utc),collect)
        self.assertIn('facts',result['ok'])
        self.assertEqual(result['failed']['status']['status'],'failed')

if __name__=='__main__':unittest.main()
