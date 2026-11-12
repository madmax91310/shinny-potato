"""Exact official geographic display percentage; never round holdings or gaps."""
import copy
import datetime as dt
import html
import json
import pathlib
import unittest

from collect_ssga_etf import allocation, parse_page
from apply_etf_collection import merge_collection

ROOT = pathlib.Path(__file__).resolve().parents[1]
NOW = dt.datetime(2026, 11, 12, tzinfo=dt.timezone.utc)


class PublishedCountry(unittest.TestCase):
    def setUp(self):
        fixture = ROOT / 'scripts/fixtures/ssga-spyl-country-display/components.json'
        self.components = json.loads(fixture.read_text())
        self.share = next(r for r in json.loads((ROOT / 'scripts/additional-etf-sources.json').read_text())['instruments'] if r['isin'] == 'IE000XZSV718')

    def page(self, components=None, share=None):
        body = ''.join(f'<input id="{k}" value="{html.escape(json.dumps(v), quote=True)}">' for k, v in (components or self.components).items())
        return parse_page(body, share or self.share, NOW)[0]

    def test_actual_published_percentage_and_raw_precision_are_both_retained(self):
        original = copy.deepcopy(self.components)
        result = self.page()['countries']
        self.assertEqual(result['rows'], [{'name':'United States','weightPct':100.0}])
        self.assertEqual(result['sourceOriginalWeightPct'], '100.000031')
        self.assertEqual(result['sourceDisplayWeight'], '100,00%')
        self.assertEqual(result['weightRepresentation'], 'issuer-published-two-decimal-percent')
        self.assertEqual(result['asOf'], '2026-11-11')
        self.assertFalse(result['normalizationApplied'])
        self.assertEqual(self.components, original)

    def test_default_representation_and_other_instruments_are_not_rounded(self):
        share = {k:v for k,v in self.share.items() if k != 'countryWeightRepresentation'}
        result = self.page(share=share)['countries']
        self.assertEqual(result['rows'][0]['weightPct'], 100.000031)
        self.assertNotIn('weightRepresentation', result)

    def test_recollection_is_idempotent_and_only_one_existing_share_is_qualified(self):
        config = json.loads((ROOT / 'scripts/additional-etf-sources.json').read_text())
        self.assertEqual({r['isin'] for r in config['instruments'] if r.get('countryWeightRepresentation')}, {'IE000XZSV718'})
        report = {'checkedAt':NOW.isoformat(),'shares':[self.page()]}
        first = merge_collection(report, {}, {})
        second = merge_collection(report, first, first)
        self.assertEqual(first, second)
        self.assertEqual(second['IE000XZSV718']['countries']['sourceOriginalWeightPct'], '100.000031')

    def test_partial_coverage_is_never_rounded_up(self):
        component = copy.deepcopy(self.components['fund-geographical-breakdown'])
        component['attrArray'][0]['weight']['originalValue'] = '99.9999'
        result = allocation(component, NOW, published_single_country=True)
        self.assertEqual(result['rows'][0]['weightPct'], 99.9999)
        self.assertNotIn('weightRepresentation', result)

    def test_missing_or_different_published_value_is_not_invented(self):
        for value in [None, '', '100.00', '100.01%', '100,000%', '99,99%', 'NaN%']:
            with self.subTest(value=value):
                component = copy.deepcopy(self.components['fund-geographical-breakdown'])
                component['attrArray'][0]['weight']['value'] = value
                with self.assertRaises(ValueError):
                    allocation(component, NOW, published_single_country=True)

    def test_original_and_published_precision_must_agree(self):
        for value in ['100.005', '100.006', '100.1', '101', '1.00000031', 'NaN']:
            with self.subTest(value=value):
                component = copy.deepcopy(self.components['fund-geographical-breakdown'])
                component['attrArray'][0]['weight']['originalValue'] = value
                with self.assertRaises(ValueError):
                    allocation(component, NOW, published_single_country=True)

    def test_unknown_or_signed_positions_are_not_removed(self):
        for weight in ['0', '-0.000031']:
            component = copy.deepcopy(self.components['fund-geographical-breakdown'])
            extra = copy.deepcopy(component['attrArray'][0])
            extra['name']['value'] = 'Unknown'
            extra['weight']['originalValue'] = weight
            component['attrArray'].append(extra)
            with self.assertRaises(ValueError):
                allocation(component, NOW, published_single_country=True)

    def test_scope_and_exact_share_guards_remain(self):
        for key, value in [('isin','IE00B3YLTY66'), ('currency','EUR'), ('countryWeightRepresentation','unqualified')]:
            share = {**self.share, key:value}
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.page(share=share)
        component = copy.deepcopy(self.components['fund-geographical-breakdown'])
        component['attrArray'][0]['name']['value'] = 'Ireland'
        with self.assertRaises(ValueError):
            allocation(component, NOW, published_single_country=True)

    def test_future_observation_remains_rejected(self):
        components = copy.deepcopy(self.components)
        components['fund-geographical-breakdown']['asOfDateSimple'] = '13 Nov 2026'
        with self.assertRaises(ValueError):
            self.page(components)
