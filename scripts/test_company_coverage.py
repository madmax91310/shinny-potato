"""Published statement regressions: share units, annual columns, reconciliation."""
import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from company_extended_publications import parse_us
from company_round3_publications import parse

SAMPLES = json.loads((Path(__file__).parent/'source-snapshots/company-coverage-statements.json').read_text())

class Coverage(unittest.TestCase):
    def costco(self, text):
        with patch('company_extended_publications.sections', return_value=[text]):
            return parse_us(b'issuer', 'costco')

    def test_costco_explicit_thousands_and_annual_columns(self):
        result = self.costco(SAMPLES['costco'])
        self.assertEqual(result['annual']['averageDilutedShares'], 444427000)
        self.assertEqual(result['annual']['previousAverageDilutedShares'], 444803000)
        self.assertEqual(result['quarter']['averageDilutedShares'], 444364000)

    def test_costco_unknown_unit_or_inconsistent_count_is_omitted(self):
        for text in [SAMPLES['costco'].replace('000’s', 'millions'),
                     SAMPLES['costco'].replace('444,427', '44,427')]:
            self.assertNotIn('averageDilutedShares', self.costco(text)['annual'])

    def test_costco_external_caption_and_53_week_comparative(self):
        from html import escape
        title = 'COSTCO WHOLESALE CORPORATION CONSOLIDATED STATEMENTS OF INCOME (dollars in millions, except per share data) (unaudited)'
        rows = ''.join('<tr><td>'+escape(line)+'</td></tr>' for line in SAMPLES['costco2024'].splitlines())
        raw = ('<p>'+title+'</p><table>'+rows+'</table>').encode()
        annual = parse_us(raw, 'costco')['annual']
        self.assertEqual(annual['end'], '2024-09-01')
        self.assertEqual(annual['previousEnd'], '2023-09-03')
        self.assertEqual(annual['previousAverageDilutedShares'], 444452000)
        with self.assertRaises(ValueError):
            parse_us(raw.replace(b'CONSOLIDATED STATEMENTS OF INCOME', b'ADJUSTED RESULTS'), 'costco')

    def test_wm_annual_count_from_issuer_statement(self):
        # This is the PDF's consolidated income statement, not its adjusted EPS summary.
        with patch('company_round3_publications.text', return_value=SAMPLES['waste-management']):
            result = parse(b'issuer', 'waste-management', SAMPLES['sources']['waste-management'], dt.date(2026,10,14))
        annual = next(p for p in result if p['durationMonths'] == 12)
        self.assertEqual(annual['averageDilutedShares'], 404200000)
        self.assertEqual(annual['previousAverageDilutedShares'], 403400000)

if __name__ == '__main__':
    unittest.main()
