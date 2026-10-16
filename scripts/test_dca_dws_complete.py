"""Complete DWS lists must retain all securities and reject fund look-through."""
import copy
import datetime as dt
import json
import unittest
from pathlib import Path
from collect_dws_etf import parse_holdings

class CompleteDws(unittest.TestCase):
    def test_complete_securities_preserve_editorial_top_ten(self):
        body = json.loads((Path(__file__).parent/'fixtures/official-documents/dws-physical-holdings.json').read_text())
        result = parse_holdings(body, {'isin':'IE00BM67HK77'}, dt.datetime(2026,10,16,tzinfo=dt.timezone.utc), 'https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HK77/holdings', complete=True)
        full = result['completeHoldings']
        self.assertTrue(full['complete'])
        self.assertGreater(len(full['rows']),10)
        self.assertEqual(len(result['holdings']['rows']),10)
        self.assertGreater(sum(r['weightPct'] for r in full['rows']),99.5)
        self.assertEqual(full['asOf'],result['holdings']['asOf'])
        bad=copy.deepcopy(body)
        bad['tables'][0]['values'][0]['column_5']['value']='Mutual Fund'
        with self.assertRaises(ValueError):
            parse_holdings(bad, {'isin':'IE00BM67HK77'}, dt.datetime(2026,10,16,tzinfo=dt.timezone.utc), 'https://etf.dws.com/source', complete=True)
