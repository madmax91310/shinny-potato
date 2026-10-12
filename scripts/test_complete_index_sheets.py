import copy
import datetime as dt
import json
import pathlib
import unittest
from unittest.mock import patch
import urllib.error
from data_automation import UTC
from refresh_index_sources import validate_complete_sheet, ROOT
from collect_sp_composition import collect, parse_public_data
import collect_sp_composition as collector

NOW = dt.datetime(2026, 10, 12, tzinfo=UTC)
CONFIG = json.loads((ROOT / 'scripts/index-automation.json').read_text())['indices']
US = next(c for c in CONFIG if c['id'] == 'sp-us-dividend-aristocrats')


class CompleteSheets(unittest.TestCase):
    def test_real_us_index_response_and_reject_substitutions(self):
        body = (ROOT / 'scripts/fixtures/sp-composition/us-public-data-2026-09-30.json').read_bytes()
        facts = parse_public_data(body, US, NOW)
        self.assertEqual(facts['constituents'], 155)
        self.assertEqual(len(facts['holdings']), 10)
        self.assertAlmostEqual(sum(weight for _, weight in facts['countries']), 100, places=2)
        for wrong in ['sp-euro-dividend-aristocrats', 'sp-global-dividend-aristocrats']:
            config = next(c for c in CONFIG if c['id'] == wrong)
            with self.assertRaises(ValueError): parse_public_data(body, config, NOW)

    def test_all_selected_records_complete_and_no_cached_handoff(self):
        records = json.loads((ROOT / 'src/data/automated-indices.json').read_text())
        for id in ['sp500-equal-weight', 'world-ex-usa', 'msci-world-minimum-volatility-usd',
                   'msci-world-sector-neutral-quality', 'msci-world-enhanced-value',
                   'sp-euro-dividend-aristocrats', 'sp-us-dividend-aristocrats']:
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

    def test_strict_collection_cannot_fall_back_to_manual_handoff(self):
        error = urllib.error.HTTPError(US['compositionDataUrl'], 403, 'Forbidden', {}, None)
        with patch('collect_sp_composition.download', side_effect=error), patch('sp_public_feed.read_response') as fallback:
            with self.assertRaises(urllib.error.HTTPError): collect(US, NOW, collector.download)
            fallback.assert_not_called()


if __name__ == '__main__': unittest.main()
