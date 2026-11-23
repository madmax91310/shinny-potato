"""Complete DWS lists must retain all securities and reject fund look-through."""
import copy
import datetime as dt
import json
import unittest
from pathlib import Path
from collect_dca_complete_holdings import attach_composition
from collect_dws_etf import parse_holdings

class CompleteDws(unittest.TestCase):
    def test_complete_securities_preserve_editorial_top_ten(self):
        body = json.loads((Path(__file__).parent/'fixtures/official-documents/dws-physical-holdings.json').read_text())
        qualified={'IE00BYQNZ507':{'isin':'IE00BYQNZ507','kind':'non-equity-money-market-fund',
            'sha256':'a'*64,'sourceUrl':'https://download.dws.com/qualification','asOf':'2026-02-16','checkedAt':'2026-10-16T00:00:00Z'}}
        result = parse_holdings(body, {'isin':'IE00BM67HK77'}, dt.datetime(2026,10,16,tzinfo=dt.timezone.utc), 'https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HK77/holdings', complete=True,non_equity_funds=qualified)
        full = result['completeHoldings']
        self.assertTrue(full['complete'])
        self.assertGreater(len(full['rows']),10)
        self.assertEqual(len(result['holdings']['rows']),10)
        self.assertGreater(sum(r['weightPct'] for r in full['rows']),99.5)
        self.assertEqual(full['asOf'],result['holdings']['asOf'])
        self.assertNotIn('IE00BYQNZ507',[r['isin'] for r in full['rows']])
        newer_sectors = {**result, 'sectors': {**result['sectors'], 'asOf': '2026-10-16'}}
        self.assertNotIn('compositionFacts', attach_composition(copy.deepcopy(full), newer_sectors,
                         'same-dws-holdings-payload-allocations', full['sourceUrl'], full['sha256']))
        bound = attach_composition(copy.deepcopy(full), result, 'same-dws-holdings-payload-allocations',
                                   full['sourceUrl'], full['sha256'])['compositionFacts']
        for field in ('countries', 'sectors'):
            self.assertEqual(bound[field]['asOf'], full['asOf'])
            self.assertEqual(bound[field]['sha256'], full['sha256'])
            self.assertEqual(bound[field]['rows'], result[field]['rows'])
        bad=copy.deepcopy(body)
        bad['tables'][0]['values'][0]['column_5']['value']='Mutual Fund'
        with self.assertRaises(ValueError):
            parse_holdings(bad, {'isin':'IE00BM67HK77'}, dt.datetime(2026,10,16,tzinfo=dt.timezone.utc), 'https://etf.dws.com/source', complete=True)
