import datetime as dt
import unittest
from unittest.mock import patch

from bitwise_nav_history import EXCEL_EPOCH, HEADER, workbook


class BitwiseWorkbookTests(unittest.TestCase):
    def test_scope_and_cash_dimensions_remain_separate(self):
        def row(day, nav, aum, shares):
            serial = (dt.date.fromisoformat(day) - EXCEL_EPOCH).days
            return dict(zip('ABCDE', map(str, (serial, nav, aum, shares, 0.0009))))

        rows = [{'A': 'Fund Name:', 'B': 'Bitwise Physical Bitcoin ETP'},
                {'A': 'Ticker:', 'B': 'BTCE'},
                {'A': 'ISIN:', 'B': 'DE000A27Z304'}, HEADER,
                row('2020-06-10', 9, 0, 0),
                row('2020-12-31', 30, 300, 10),
                row('2021-07-30', 40, 390, 10),
                row('2021-12-31', 45, 450, 10)]
        now = dt.datetime(2022, 1, 3, tzinfo=dt.timezone.utc)
        with patch('bitwise_nav_history.xlsx_rows', return_value=rows):
            prices, units, differences = workbook(b'', now, '2020-12')
            self.assertEqual(list(prices), ['2020-12-31', '2021-07-30', '2021-12-31'])
            self.assertEqual(prices['2021-07-30'], 40)
            self.assertEqual(units['2021-07-30']['aumPerSecurity'], 39)
            self.assertEqual(differences, ['2021-07-30'])
            rows[2]['B'] = 'DE000A4AER62'
            with self.assertRaisesRegex(ValueError, 'identity'):
                workbook(b'', now, '2020-12')
