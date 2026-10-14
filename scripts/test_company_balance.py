import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from company_balance import parse_balance, collect_balance, validate_balance

TODAY = dt.date(2026, 10, 12)

class IssuerBalanceTest(unittest.TestCase):
    def test_real_issuer_annual_excerpts(self):
        excerpts = json.loads((Path(__file__).parent/'source-snapshots/company-balance-excerpts.json').read_text())
        for ident, item in excerpts.items():
            with self.subTest(ident=ident), patch('company_balance.sections', return_value=[item['text']]):
                rows = parse_balance(b'', ident, item['end'], TODAY)
                self.assertEqual(rows[-1]['equity'], item['closingEquity'])
                self.assertEqual(len(rows), 2)

    def test_adobe_ignores_earnings_dates_before_balance_caption(self):
        item=json.loads((Path(__file__).parent/'source-snapshots/company-balance-excerpts.json').read_text())['adobe']
        whole='Adobe earnings November 28, 2025 November 29, 2024\n'+item['text']+'\nCondensed Consolidated Statements of Cash Flows\nNovember 28, 2025 November 29, 2024\n'
        with patch('company_balance.sections',return_value=[whole]):
            rows=parse_balance(b'', 'adobe', item['end'], TODAY)
        self.assertEqual(rows[-1]['cash'],5431000000)
        self.assertEqual(rows[-1]['currentLiabilities'],10200000000)
        for text in [whole.replace('11,623','11,624,000'),whole+item['text']]:
            with patch('company_balance.sections',return_value=[text]), self.assertRaises(ValueError):
                parse_balance(b'', 'adobe',item['end'],TODAY)

    def test_numeric_row_does_not_consume_different_label(self):
        from company_balance import row
        self.assertIsNone(row("Total liabilities and shareholders' equity $ 100 90", [r'Total liabilities'], 2))
        self.assertEqual(row('Total assets $ 3 83,266 $ 359,241', [r'Total assets'], 2), [383266,359241])
        with self.assertRaises(ValueError): row('Total assets 1 2 3', [r'Total assets'], 2)

    def test_equation_invalid_numbers_and_subtotals(self):
        b = {'assets':100,'liabilities':60,'equity':40,'currentAssets':30,'currentLiabilities':20,'liabilitiesAndEquity':100}
        validate_balance(b)
        for field, value in [('equity', -2000000), ('assets', float('nan')), ('cash',31), ('currentLiabilities',61), ('liabilities',True)]:
            with self.subTest(field=field), self.assertRaises(ValueError): validate_balance({**b,field:value})

    def test_dates_units_duplicate_and_missing_rows(self):
        item=json.loads((Path(__file__).parent/'source-snapshots/company-balance-excerpts.json').read_text())['apple']
        for text in [item['text'].replace('In millions','In thousands'),item['text'].replace('Total current liabilities','Unknown liabilities'),item['text']+'\nTotal assets 359241 364980']:
            with patch('company_balance.sections',return_value=[text]), self.assertRaises(ValueError):parse_balance(b'', 'apple',item['end'],TODAY)
        for end,today in [('2025-09-30',TODAY),(item['end'],dt.date(2024,1,1))]:
            with patch('company_balance.sections',return_value=[item['text']]), self.assertRaises(ValueError):parse_balance(b'', 'apple',end,today)

    def test_untrusted_source_and_wrong_income_rejected(self):
        c={'annual':{'end':'2025-12-31','sourceUrl':'https://untrusted.test/report'}}
        with self.assertRaises(ValueError):collect_balance({'id':'apple'},c,TODAY)
        c['annual'].update(sourceUrl='https://www.apple.com/report',revenue=100,netIncome=10)
        with patch('company_balance.get',return_value=b'x'),patch('company_balance.statement',return_value=({'annual':{'end':'2025-12-31','revenue':101,'netIncome':10}},'')),self.assertRaises(ValueError):collect_balance({'id':'apple'},c,TODAY)

if __name__ == '__main__': unittest.main()
