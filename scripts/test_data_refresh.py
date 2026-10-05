"""Captured issuer/INSEE schemas plus corruption scenarios; never imported by the app."""
import copy
import datetime as dt
import html
import json
import pathlib
import unittest

from collect_etf_pilot import parse_share
from data_automation import UTC
from update_inflation import merge_rates, parse_rates
from probe_bitcoin_monthly import compare

FIXTURES = pathlib.Path(__file__).with_name('fixtures')
NOW = dt.datetime(2026, 10, 5, tzinfo=UTC)
SHARE = {'isin': 'IE00B4L5Y983', 'currency': 'USD'}


def markup(components):
    return ''.join(f'<walrus-render-on-client componentprops="{html.escape(json.dumps(value), quote=True)}"></walrus-render-on-client>' for value in components.values())


class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.components = json.loads((FIXTURES / 'ishares-world-pilot.json').read_text())
        self.xml = (FIXTURES / 'insee-ipc-pilot.xml').read_text()

    def test_issuer_matches_active_fund_not_benchmark(self):
        report = parse_share(markup(self.components), SHARE, NOW)
        self.assertEqual(report['performance']['years']['2020'], 15.95)
        self.assertEqual(report['performance']['years']['2025'], 21.16)
        self.assertEqual(report['aum']['scope'], 'share-class')
        self.assertEqual(report['sectors']['asOf'], '2026-10-02')

    def test_reordered_performance_columns_still_selects_nav(self):
        calendar = self.components['performance']['containersByNameMap']['returns']['subContainersByNameMap']['calendar']['dataPointsByNameMap']
        calendar['returnTypes']['value'].reverse()
        for key, value in calendar.items():
            if key.endswith('Year'):
                value['value'].reverse()
        self.assertEqual(parse_share(markup(self.components), SHARE, NOW)['performance']['years']['2020'], 15.95)

    def test_reject_identity_currency_distribution_stale_and_invalid_values(self):
        for key, value in [('isin', 'WRONG'), ('seriesBaseCurrencyCode', 'EUR'),
                           ('useOfProfitsCode', 'Distributing'), ('emeaMgt', True)]:
            components = copy.deepcopy(self.components)
            components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap'][key]['value'] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                parse_share(markup(components), SHARE, NOW)
        with self.assertRaises(ValueError):
            parse_share(markup(self.components), SHARE, dt.datetime(2027, 1, 1, tzinfo=UTC))

    def test_allocation_and_duplicate_component_fail(self):
        sectors = self.components['exposureBreakdowns']['containersByNameMap']['sector']['dataPointsByNameMap']
        sectors['fund']['value'][0] = 0
        with self.assertRaises(ValueError):
            parse_share(markup(self.components), SHARE, NOW)
        with self.assertRaises(ValueError):
            parse_share(markup(self.components) * 2, SHARE, NOW)

    def test_single_country_absence_is_not_invented(self):
        del self.components['exposureBreakdowns']['containersByNameMap']['geography']
        report = parse_share(markup(self.components), SHARE, NOW)
        self.assertEqual(report['countries'], {'status': 'not-published', 'rows': []})

    def test_insee_deflation_and_provisional_status(self):
        report = parse_rates(self.xml, NOW)
        self.assertEqual(report['rates']['2026-09'], -0.3)
        self.assertEqual(report['quality']['2026-09'], 'P')
        self.assertEqual(report['quality']['2026-08'], 'DEF')

    def test_insee_reject_other_series_stale_future_and_bad_value(self):
        for body in [self.xml.replace('011814631', '011814132'),
                     self.xml.replace('2026-09', '2026-10'),
                     self.xml.replace('OBS_VALUE="-0.3"', 'OBS_VALUE="NaN"')]:
            with self.assertRaises(ValueError):
                parse_rates(body, NOW)
        with self.assertRaises(ValueError):
            parse_rates(self.xml, dt.datetime(2027, 1, 1, tzinfo=UTC))

    def test_revisions_preserve_old_history_and_never_regress(self):
        report = parse_rates(self.xml, NOW)
        merged = merge_rates({'2017-01': -0.3, '2026-08': 0.6}, report)
        self.assertEqual(merged['2017-01'], -0.3)
        self.assertEqual(merged['2026-08'], 0.7)
        with self.assertRaises(ValueError):
            merge_rates({'2026-10': 1}, report)

    def test_bitcoin_diagnostic_never_authorizes_splicing(self):
        baseline = {'assetId': 'bitcoin', 'currency': 'USD',
                    'points': [{'date': '2026-09', 'price': 100}]}
        close = compare([{'date': '2026-09', 'price': 100.01}], baseline)
        self.assertTrue(close['qualification']['priceDiagnosticPassed'])
        self.assertFalse(close['automaticConnectionAllowed'])
        gap = compare([{'date': '2026-09', 'price': 101}, {'date': '2026-10', 'price': 102}], baseline)
        self.assertFalse(gap['qualification']['priceDiagnosticPassed'])
        self.assertEqual(gap['qualification']['monthsWithoutActiveReference'], ['2026-10'])


if __name__ == '__main__':
    unittest.main()
