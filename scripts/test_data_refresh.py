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

    def test_insee_failure_writes_diagnostic_without_touching_active_data(self):
        import tempfile
        from unittest.mock import patch
        from update_inflation import main
        root = pathlib.Path(__file__).resolve().parents[1]
        active = [root / 'src/data/inflation-monthly.js',
                  root / 'scripts/source-snapshots/inflation-automated.json']
        before = [path.read_bytes() for path in active]
        with tempfile.TemporaryDirectory() as directory:
            baseline, output = pathlib.Path(directory)/'baseline.json', pathlib.Path(directory)/'report.json'
            baseline.write_text('{"2026-09": -0.3}')
            with patch('sys.argv', ['update_inflation', '--baseline', str(baseline), '--output', str(output), '--apply']), patch('update_inflation.get_text', side_effect=TimeoutError('TLS timeout')):
                with self.assertRaises(TimeoutError):
                    main()
            report = json.loads(output.read_text())
            self.assertEqual(report['successes'], [])
            self.assertEqual(report['errors'][0]['id'], 'inflation:011814631')
            self.assertIn('TLS timeout', report['errors'][0]['error'])
            self.assertNotIn('rates', report)
            self.assertNotIn('sourceUpdatedAt', report)
        self.assertEqual([path.read_bytes() for path in active], before)

    def test_insee_official_fallback_after_transport_failure(self):
        from unittest.mock import patch
        from update_inflation import collect_rates, URL, FALLBACK_URL
        with patch('update_inflation.get_text', side_effect=[TimeoutError('read timeout'), self.xml]) as fetch:
            body, report = collect_rates(NOW)
        self.assertEqual(body, self.xml)
        self.assertEqual(report['sourceUrl'], FALLBACK_URL)
        self.assertEqual(report['transportFailures'][0]['url'], URL)
        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(report['rates'], parse_rates(self.xml, NOW)['rates'])

    def test_insee_invalid_observations_and_access_refusal_never_fall_back(self):
        import urllib.error
        from unittest.mock import patch
        from update_inflation import collect_rates, URL
        for response in (self.xml.replace('011814631', '000000000'), '<html/>',
                         urllib.error.HTTPError(URL, 403, 'Forbidden', {}, None)):
            with self.subTest(response=str(response)[:40]):
                kwargs = {'side_effect': response} if isinstance(response, Exception) else {'return_value': response}
                with patch('update_inflation.get_text', **kwargs) as fetch:
                    with self.assertRaises((ValueError, urllib.error.HTTPError)):
                        collect_rates(NOW)
                self.assertEqual(fetch.call_count, 1)

    def test_insee_primary_success_does_not_request_fallback(self):
        from unittest.mock import patch
        from update_inflation import collect_rates, URL
        with patch('update_inflation.get_text', return_value=self.xml) as fetch:
            _, report = collect_rates(NOW)
        self.assertEqual(report['sourceUrl'], URL)
        self.assertEqual(report['transportFailures'], [])
        self.assertEqual(fetch.call_count, 1)

    def test_issuer_matches_active_fund_not_benchmark(self):
        report = parse_share(markup(self.components), SHARE, NOW)
        self.assertEqual(report['performance']['years']['2020'], 15.95)
        self.assertEqual(report['performance']['years']['2025'], 21.16)
        self.assertEqual(report['aum']['scope'], 'share-class')
        self.assertEqual(report['sectors']['asOf'], '2026-10-02')
        self.assertEqual(report['countries']['sourceComponent'], 'exposureBreakdowns.geography.countries')
        self.assertEqual(report['sectors']['sourceComponent'], 'exposureBreakdowns.sector')

    def test_ishares_missing_aum_rejected_without_fund_substitution(self):
        for defect in ('missing', 'null-point', 'value', 'prefix', 'asOfDate', 'wrong-currency', 'zero'):
            components = copy.deepcopy(self.components)
            facts = components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
            facts['totalNetAssetsFundLevel'] = copy.deepcopy(facts['totalNetAssets'])
            if defect == 'missing': del facts['totalNetAssets']
            elif defect == 'null-point': facts['totalNetAssets'] = None
            else:
                key, value = {'wrong-currency': ('prefix', 'EUR'), 'zero': ('value', 0)}.get(defect, (defect, None))
                facts['totalNetAssets'][key] = value
            for body in (markup(components), {'productId': 1, 'currencyCode': 'USD', 'componentsByNameMap': components}):
                with self.subTest(defect=defect, transport=type(body).__name__), self.assertRaises(ValueError):
                    parse_share(body, {**SHARE, 'productId': 1}, NOW)

    def test_ishares_null_aum_preserves_entire_record_and_recovers(self):
        import tempfile
        from collect_etf_pilot import collect, apply_valid_shares
        share = {**SHARE, 'productId': 1, 'collectHoldings': False}
        good = copy.deepcopy(self.components)
        bad = copy.deepcopy(good)
        bad['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['totalNetAssets']['value'] = None
        previous = {SHARE['isin']: {'aum': {'amount': 123, 'asOf': '2026-10-01'}, 'checkedAt': '2026-10-01'}}
        baseline = {SHARE['isin']: {'currency': 'USD'}}
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory)/'data.json'
            path.write_text(json.dumps(previous))
            report = collect({'instruments': [share]}, baseline, NOW, lambda *args: json.dumps({'productId': 1, 'currencyCode': 'USD', 'componentsByNameMap': bad}))
            self.assertEqual(len(report['failures']), 1)
            self.assertIn('Official iShares AUM unavailable', report['failures'][0]['reason'])
            self.assertFalse(apply_valid_shares(report, path, baseline))
            self.assertEqual(json.loads(path.read_text()), previous)
            report = collect({'instruments': [share]}, baseline, NOW, lambda *args: json.dumps({'productId': 1, 'currencyCode': 'USD', 'componentsByNameMap': good}))
            self.assertEqual(report['failures'], [])
            path.write_text('{}')
            self.assertTrue(apply_valid_shares(report, path, baseline))
            self.assertEqual(json.loads(path.read_text())[SHARE['isin']]['aum']['scope'], 'share-class')

    def test_optional_inception_and_first_partial_year(self):
        facts = self.components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        facts.pop('inceptionDate', None)
        self.assertIn('2020', parse_share(markup(self.components), SHARE, NOW)['performance']['years'])
        facts['inceptionDate'] = {'value': '20200601'}
        report = parse_share(markup(self.components), {**SHARE, 'requireFullHistory': False}, NOW)
        self.assertNotIn('2020', report['performance']['years'])
        self.assertIn('2021', report['performance']['years'])

    def test_recent_share_integrates_first_single_nav_calendar(self):
        facts=self.components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        facts['inceptionDate']={'value':20240529}
        calendar=self.components['performance']['containersByNameMap']['returns']['subContainersByNameMap']['calendar']['dataPointsByNameMap']
        for key,point in calendar.items():
            if key.endswith('Year'):point['active']=key=='oneYear'
        r=parse_share(markup(self.components),{**SHARE,'requireFullHistory':False},NOW)
        self.assertEqual(r['performance']['years'],{'2025':21.16})
        facts['inceptionDate']={'value':20250529}
        self.assertEqual(parse_share(markup(self.components),{**SHARE,'requireFullHistory':False},NOW)['performance']['years'],{})

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


class ReplicationCharacteristicsTests(unittest.TestCase):
    def test_both_inputs_remain_exact_and_structures_are_not_invented(self):
        from collect_etf_pilot import replication_characteristics
        for structure, method in [('Physical', 'Replicated'), ('Physical', 'Optimised'),
                                  ('Synthetic', 'Swap'), ('Physical metal', 'Physical Replication'),
                                  (None, 'Novel method')]:
            facts = {key: {'value': value} for key, value in
                     [('productStructure', structure), ('fundMethodologyTypeCode', method)]}
            result = replication_characteristics(facts)
            self.assertEqual(result['replicationMethodRaw'],
                             {'productStructure': structure, 'fundMethodologyTypeCode': method})
            self.assertEqual(result['replicationMethod'],
                             f'{structure} ({method})' if structure else method)
        self.assertEqual(replication_characteristics({}), {})
