import datetime as dt
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

from openpyxl import Workbook
from update_gold_monthly import TARGET, discover_workbook, prepare, read_gold, main

URL = 'https://thedocs.worldbank.org/en/doc/example-0050012026/related/CMO-Historical-Data-Monthly.xlsx'
TODAY = dt.date(2026, 11, 4)
BASE = json.loads((TARGET.parents[2] / 'scripts/source-snapshots/calculator-worldbank-gold-2026-10-03.json').read_text())
ACTIVE = json.loads(TARGET.read_text())
BASE.update({key: ACTIVE[key] for key in ('seriesDescription', 'dataProviders')})


def fixture(points=None, unit='($/troy oz)', description=None):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = 'Monthly Prices'
    for row in [('World Bank Commodity Price Data (The Pink Sheet)',), ('monthly prices',),
                ('nominal USD',), ('Updated on November 03, 2026',),
                (None, 'Silver', 'Gold'), (None, '($/troy oz)', unit)]:
        sheet.append(row)
    for month, value in points if points is not None else BASE['points'] + [['2026-10', 4400]]:
        sheet.append([month.replace('-', 'M'), 30, value])
    sheet = workbook.create_sheet('Description')
    sheet.append([None, description or BASE['seriesDescription']] + [None] * 17 + [BASE['dataProviders']])
    stream = io.BytesIO()
    workbook.save(stream)
    return stream.getvalue()


class GoldRefreshTests(unittest.TestCase):
    def test_full_same_source_extension(self):
        result, changed = prepare(BASE, fixture(), URL, TODAY)
        self.assertTrue(changed)
        self.assertEqual(result['points'][:-1], BASE['points'])
        self.assertEqual(result['points'][-1], ['2026-10', 4400])
        self.assertNotIn('crossCheck', result)

    def test_missing_duplicate_and_invalid_months(self):
        rows = BASE['points'] + [['2026-10', 4400]]
        for points in (rows[:40] + rows[41:], rows + [rows[-1]], rows + [['2026-11', 4400]]):
            with self.subTest(points=points[-1]), self.assertRaises(ValueError):
                read_gold(fixture(points), TODAY)

    def test_invalid_prices_and_units(self):
        for value in (None, True, -1, 0, '4400'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                read_gold(fixture(BASE['points'] + [['2026-10', value]]), TODAY)
        with self.assertRaises(ValueError):
            read_gold(fixture(unit='EUR/oz'), TODAY)

    def test_methodology_change_requires_review(self):
        with self.assertRaisesRegex(ValueError, 'methodology'):
            prepare(BASE, fixture(description='Gold, monthly futures settlement'), URL, TODAY)

    def test_source_truncation_and_major_revision(self):
        with self.assertRaisesRegex(ValueError, 'truncated'):
            prepare(BASE, fixture(BASE['points'][:-1]), URL, TODAY)
        revised = [p[:] for p in BASE['points']]
        revised[0][1] *= 2
        with self.assertRaisesRegex(ValueError, 'revision'):
            prepare(BASE, fixture(revised), URL, TODAY)

    def test_small_publisher_revision_is_retained(self):
        revised = [p[:] for p in BASE['points']]
        revised[0][1] += 1
        result, _ = prepare(BASE, fixture(revised), URL, TODAY)
        self.assertEqual(result['points'][0], revised[0])

    def test_no_change_does_not_refresh_check_date(self):
        body = fixture(BASE['points'])
        previous, _ = prepare(BASE, body, URL, TODAY)
        _, changed = prepare(previous, body, URL, TODAY + dt.timedelta(days=1))
        self.assertFalse(changed)

    def test_official_link_discovery_and_rejection(self):
        self.assertEqual(discover_workbook(f'<a href="{URL}">Monthly prices</a>'), URL)
        for html in ('<html>blocked</html>', f'<a href="{URL.replace("thedocs.worldbank.org", "example.org")}">prices</a>',
                     f'<a href="{URL}"></a><a href="{URL.replace("example-", "other-")}"></a>'):
            with self.assertRaises(ValueError):
                discover_workbook(html)

    def test_failure_preserves_active_file(self):
        with tempfile.TemporaryDirectory() as directory:
            output = pathlib.Path(directory) / 'gold.json'
            original = TARGET.read_bytes()
            output.write_bytes(original)
            with patch('sys.argv', ['update', '--output', str(output)]), \
                 patch('update_gold_monthly.download', return_value=b'<html>not data</html>'), \
                 self.assertRaises(ValueError):
                main()
            self.assertEqual(output.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
