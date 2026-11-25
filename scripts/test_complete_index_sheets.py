import copy
import datetime as dt
import json
import unittest
from data_automation import UTC
from refresh_index_sources import validate_complete_sheet, ROOT
from collect_index_documents import msci_returns

NOW = dt.datetime(2026, 10, 12, tzinfo=UTC)


class CompleteSheets(unittest.TestCase):
    def test_acwi_document_keeps_exact_net_columns_separate_at_rollover(self):
        config = json.loads((ROOT / 'scripts/index-automation.json').read_text())
        records = {record['id']: record for record in config['indices']}
        text = """MSCI ACWI Index (USD)
CUMULATIVE INDEX PERFORMANCE — NET RETURNS (USD)
ANNUAL PERFORMANCE (%)
                                                         MSCI
    Year    MSCI ACWI        MSCI World    Emerging
                                           Markets
    2026         12.34          23.45        34.56
    2025         22.34          21.09        33.57
    2024         17.49          18.67         7.50
    2023         22.20          23.79         9.83
    2022        -18.36         -18.14       -20.09
    2021         18.54          21.82        -2.54
INDEX PERFORMANCE — NET RETURNS (%)
"""
        january = dt.datetime(2027, 1, 5, tzinfo=UTC)
        for id, expected in [('acwi-net', 12.34), ('world-net', 23.45)]:
            record = {**records[id], 'documentName': 'MSCI ACWI'}
            self.assertEqual(msci_returns(text, record, january)[0], [2026, expected])
            with self.assertRaisesRegex(ValueError, 'unfinished'):
                msci_returns(text, record, NOW)
            with self.assertRaisesRegex(ValueError, 'columns not identified'):
                msci_returns(text.replace('MSCI ACWI        MSCI World', 'MSCI World        MSCI ACWI'), record, january)
            with self.assertRaisesRegex(ValueError, 'currency or variant'):
                msci_returns(text.replace('NET RETURNS', 'GROSS RETURNS'), record, january)

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
