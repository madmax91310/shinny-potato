import copy
import datetime as dt
import json
import unittest
from data_automation import UTC
from refresh_index_sources import validate_complete_sheet, ROOT

NOW = dt.datetime(2026, 10, 12, tzinfo=UTC)


class CompleteSheets(unittest.TestCase):
    def test_all_selected_records_complete_and_no_cached_handoff(self):
        records = json.loads((ROOT / 'src/data/automated-indices.json').read_text())
        for id in ['sp500-equal-weight', 'world-ex-usa', 'msci-world-minimum-volatility-usd',
                   'msci-world-sector-neutral-quality', 'msci-world-enhanced-value']:
            observation = {'id': id, **records[id], 'errors': []}
            validate_complete_sheet(observation, NOW)
            for field in ['countries', 'sectors', 'holdings']:
                bad = copy.deepcopy(observation); bad['facts'][field] = []
                with self.assertRaises(ValueError): validate_complete_sheet(bad, NOW)
            for change in ['price', 'missing-year', 'handoff', 'error']:
                bad = copy.deepcopy(observation)
                if change == 'price': bad['returns']['variant'] = 'PRICE'
                if change == 'missing-year': bad['returns']['values'] = [row for row in bad['returns']['values'] if row[0] != NOW.year - 1]
                if change == 'handoff': bad['facts']['source']['transport'] = 'official-response-handoff'
                if change == 'error': bad['errors'] = [{'field': 'composition', 'reason': '403'}]
                with self.subTest(id=id, change=change), self.assertRaises(ValueError):
                    validate_complete_sheet(bad, NOW)


if __name__ == '__main__': unittest.main()
