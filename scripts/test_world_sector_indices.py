"""Exact sector identities, complete direct observations and Financials PDF layout."""
import datetime as dt
import json
import pathlib
import unittest
from collect_index_documents import msci_composition
from refresh_index_sources import validate_complete_sheet, ROOT
from data_automation import UTC

NOW = dt.datetime(2026, 10, 13, tzinfo=UTC)
IDS = ['msci-world-health-care', 'msci-world-financials', 'msci-world-energy']


class WorldSectorIndices(unittest.TestCase):
    def setUp(self):
        self.config = {c['id']: c for c in json.loads((ROOT / 'scripts/index-automation.json').read_text())['indices']}
        self.records = json.loads((ROOT / 'src/data/automated-indices.json').read_text())

    def test_all_sector_observations_are_complete_direct_exact_index_returns(self):
        for id in IDS:
            with self.subTest(id=id):
                c, record = self.config[id], self.records[id]
                self.assertTrue(c['enabled'])
                self.assertEqual(c['requiredFields'], ['composition', 'returns'])
                self.assertEqual(record['facts']['index'], c['name'])
                self.assertNotIn('Advanced', record['facts']['index'])
                self.assertNotIn('Capped', record['facts']['index'])
                validate_complete_sheet({'id': id, **record, 'errors': []}, NOW)
                self.assertEqual(record['returns']['variant'], 'NET')
                self.assertEqual(record['returns']['currency'], 'USD')
                self.assertEqual(sum(w for _, w in record['facts']['sectors']), 100)
                self.assertEqual(len(record['facts']['holdings']), 10)
                for field in ['facts', 'returns']:
                    self.assertEqual(record[field]['source']['url'], c['sourceUrl'])
                    self.assertNotEqual(record[field]['source'].get('transport'), 'official-response-handoff')

    def test_financials_industry_heading_with_separate_country_legend(self):
        folder = ROOT / 'scripts/fixtures/official-documents'
        text = (folder / 'msci-world-financials-composition.txt').read_text()
        country_text = (folder / 'msci-world-financials-countries.txt').read_text()
        c = self.config['msci-world-financials']
        facts = msci_composition(text, c, NOW, country_text=country_text)
        self.assertEqual(facts['constituents'], 230)
        self.assertEqual(facts['sectors'], [['🏦 Finance', 100]])
        self.assertEqual(facts['countries'][0], ['🇺🇸 États-Unis', 51.89])
        self.assertEqual(facts['holdings'][0], ['JPMORGAN CHASE & CO', 6.18])
        self.assertAlmostEqual(sum(w for _, w in facts['countries']), 100, places=1)
        for bad in [text.replace('INDUSTRY WEIGHTS', 'OTHER TABLE'), text.replace('MSCI World Financials Index (USD)', 'MSCI World Energy Index (USD)'), text.replace(c['sectorScope']['proof'].split(' are ')[-1], 'unknown classification')]:
            with self.assertRaises(ValueError):
                msci_composition(bad, c, NOW, country_text=country_text)

    def test_daily_complete_refresh_includes_three_sectors(self):
        workflow = (ROOT / '.github/workflows/refresh-automated-index-sheets.yml').read_text()
        self.assertIn('--require-complete --apply', workflow)
        self.assertIn('schedule:', workflow)
        for id in IDS:
            self.assertIn(id, workflow)


if __name__ == '__main__':
    unittest.main()
