import datetime as dt
import pathlib
import unittest
from collect_performance_currency import parse
from data_automation import UTC


class OfficialCurrencyTests(unittest.TestCase):
    def setUp(self):
        self.text = (pathlib.Path(__file__).parent / 'fixtures/msci-official-currency.txt').read_text()
        self.now = dt.datetime(2026, 10, 16, tzinfo=UTC)

    def test_real_official_columns(self):
        records = parse(self.text, self.now)
        self.assertEqual(records['msciWorld']['annualReturns']['2025'], 7.21)
        self.assertEqual(records['msciEmerging']['annualReturns']['2025'], 18.46)
        self.assertEqual(records['msciAcwi']['annualReturns']['2025'], 8.33)
        self.assertEqual(records['msciWorld']['annualReturns']['2016'], 11.39)

    def test_wrong_convention_and_columns_rejected(self):
        for original, replacement in [('GROSS RETURNS (EUR)', 'NET RETURNS (EUR)'),
                                      ('GROSS RETURNS (EUR)', 'GROSS RETURNS (USD)'),
                                      ('MSCI ACWI', 'MSCI USA'), ('2025', '2026')]:
            with self.subTest(replacement=replacement), self.assertRaises(ValueError):
                parse(self.text.replace(original, replacement), self.now)

    def test_stale_document_rejected(self):
        with self.assertRaises(ValueError):
            parse(self.text, dt.datetime(2027, 2, 1, tzinfo=UTC))


if __name__ == '__main__':
    unittest.main()
