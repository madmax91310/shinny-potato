"""All configured compositions must pass the same publication gate."""
import copy
import datetime as dt
import json
import unittest
from unittest.mock import patch
from refresh_index_sources import ROOT, collect_one, validate_composition, merge_records

NOW = dt.datetime(2026, 10, 14, tzinfo=dt.timezone.utc)


class CompositionGateTests(unittest.TestCase):
    def setUp(self):
        self.config = {c['id']: c for c in json.loads((ROOT / 'scripts/index-automation.json').read_text())['indices']}
        self.records = json.loads((ROOT / 'src/data/automated-indices.json').read_text())
        self.fixture = json.loads((ROOT / 'scripts/fixtures/index-composition-gate-world-2026-09-30.json').read_text())['record']

    def check_recorded_composition(self, record, config):
        # This integration check tests the stored acquisition, not today's
        # freshness. Stale observations must not prevent the next refresh from
        # starting. The real collector still validates against its actual clock.
        checked = dt.datetime.fromisoformat(record['facts']['source']['checkedAt'].replace('Z', '+00:00'))
        if checked.tzinfo is None:
            checked = checked.replace(tzinfo=dt.timezone.utc)
        self.assertLessEqual(checked, dt.datetime.now(dt.timezone.utc))
        validate_composition(record['facts'], config, checked)

    def test_every_configured_composition_has_valid_evidence(self):
        for key, config in self.config.items():
            if config.get('enabled', True) and config.get('collectComposition', True):
                with self.subTest(index=key):
                    self.check_recorded_composition(self.records[key], config)
                    self.assertIn('composition', config['requiredFields'])
                    if config.get('holdingsSourceUrl'):
                        self.assertIn('holdings', config['requiredFields'])

    def test_bad_composition_is_retained_without_losing_valid_returns(self):
        config = self.config['world']
        baseline = self.fixture
        validate_composition(baseline['facts'], config, NOW)
        for mutation in ['identity', 'country-total', 'duplicate', 'nan', 'boolean', 'count', 'missing-holdings', 'source', 'future']:
            incoming = copy.deepcopy(baseline['facts'])
            if mutation == 'identity': incoming['index'] += ' ETF'
            if mutation == 'country-total': incoming['countries'] = incoming['countries'][:1]
            if mutation == 'duplicate': incoming['sectors'][1][0] = incoming['sectors'][0][0]
            if mutation == 'nan': incoming['holdings'][0][1] = float('nan')
            if mutation == 'boolean': incoming['holdings'][0][1] = True
            if mutation == 'count': incoming['constituents'] = 1
            if mutation == 'missing-holdings': incoming['holdings'] = []
            if mutation == 'source': incoming['source'].pop('sha256')
            if mutation == 'future': incoming['asOf'] = (NOW + dt.timedelta(days=1)).date().isoformat()
            observation = {'id': 'world', 'facts': incoming, 'returns': baseline['returns'], 'errors': [], 'unavailable': []}
            with self.subTest(mutation=mutation), patch('refresh_index_sources._collect_one', return_value=observation):
                result = collect_one(config, NOW)
                self.assertNotIn('facts', result)
                self.assertEqual(result['errors'][0]['field'], 'composition')
                merged = merge_records({'world': baseline}, [result])
                self.assertEqual(merged['world']['facts'], baseline['facts'])
                self.assertEqual(merged['world']['returns'], baseline['returns'])

    def test_russell_dates_remain_independent(self):
        record = self.records['russell-1000']
        self.check_recorded_composition(record, self.config['russell-1000'])
        self.assertEqual(record['facts']['holdings'], [])
        self.assertTrue(record['holdings']['rows'])
        for stamp in [record['facts']['asOf'], '2026-06-30']:
            holdings = {**record['holdings'], 'asOf': stamp}
            merged = merge_records({}, [{'id': 'russell-1000', 'facts': record['facts'], 'holdings': holdings}])['russell-1000']
            self.assertEqual(merged['facts']['asOf'], record['facts']['asOf'])
            self.assertEqual(merged['holdings']['asOf'], stamp)
            self.assertEqual(merged['facts']['holdings'], [])

    def test_actual_gate_still_refuses_future_and_stale_observations(self):
        for offset in [1, -76]:
            facts = copy.deepcopy(self.fixture['facts'])
            facts['asOf'] = (NOW + dt.timedelta(days=offset)).date().isoformat()
            with self.subTest(offset=offset), self.assertRaisesRegex(ValueError, 'future or stale'):
                validate_composition(facts, self.config['world'], NOW)

    def test_actual_unchanged_nasdaq_source_control_is_recorded_without_rewriting_history(self):
        fixture = json.loads((ROOT / 'scripts/fixtures/index-control-clocks/nasdaq-pea-real-20261107.json').read_text())
        old = {'nasdaq-pea': fixture['previous']}
        untouched = copy.deepcopy(old)
        observation = fixture['observation']
        verified_at = dt.datetime(2026, 11, 7, 12, tzinfo=dt.timezone.utc)
        merged = merge_records(old, [observation], now=verified_at)
        self.assertEqual(old, untouched)
        self.assertEqual(merged['nasdaq-pea']['facts']['source']['checkedAt'], '2026-11-07')
        self.assertEqual(merged['nasdaq-pea']['factsHistory'], old['nasdaq-pea']['factsHistory'])
        expected = copy.deepcopy(old['nasdaq-pea']['facts'])
        expected['source']['checkedAt'] = '2026-11-07'
        self.assertEqual(merged['nasdaq-pea']['facts'], expected)
        self.assertEqual(merge_records(merged, [observation], now=verified_at), merged)

    def test_each_field_keeps_its_period_and_independent_control_at_year_roll(self):
        now = dt.datetime(2026, 1, 1, 12, tzinfo=dt.timezone.utc)
        mapping = {'facts':'composition', 'returns':'returns', 'holdings':'holdings', 'quarterlyFacts':'quarterly-composition'}
        for field, error_field in mapping.items():
            old = {'asOf':'2025-11-30', 'currency':'USD', 'variant':'TOTAL',
                   'source':{'url':'https://issuer.example/exact', 'sha256':'a'*64, 'checkedAt':'2025-12-31'}}
            baseline = {'exact':{field:old, field+'History':{'2025-11-30':copy.deepcopy(old)}}}
            incoming = copy.deepcopy(old); incoming['source']['checkedAt'] = '2026-01-01'
            for errors in [[], [{'field':error_field, 'reason':'network failed; previous value retained'}], [{'field':'unrelated', 'reason':'separate source failed'}]]:
                with self.subTest(field=field, errors=errors):
                    result = merge_records(baseline, [{'id':'exact', field:incoming, 'errors':errors}], now=now)['exact']
                    expected = '2025-12-31' if errors and errors[0]['field']==error_field else '2026-01-01'
                    self.assertEqual(result[field]['source']['checkedAt'], expected)
                    self.assertEqual(result[field]['asOf'], '2025-11-30')
                    self.assertEqual(result[field+'History'], baseline['exact'][field+'History'])

    def test_cached_older_and_future_source_clocks_cannot_create_a_successful_refresh(self):
        old = copy.deepcopy(self.fixture['facts'])
        old['source']['checkedAt'] = '2026-10-13'
        for transport, stamp in [('official-response-handoff','2026-10-14'), (None,'2026-10-12')]:
            previous = copy.deepcopy(old)
            if transport: previous['source']['transport'] = transport
            incoming = copy.deepcopy(previous); incoming['source']['checkedAt'] = stamp
            result = merge_records({'world':{'facts':previous}}, [{'id':'world','facts':incoming}], now=NOW)
            self.assertEqual(result['world']['facts'], previous)
        incoming = copy.deepcopy(old); incoming['source']['checkedAt'] = '2026-10-15'
        with self.assertRaisesRegex(ValueError, 'Future index source-control date'):
            merge_records({'world':{'facts':old}}, [{'id':'world','facts':incoming}], now=NOW)

    def test_quarterly_conflicts_preserve_last_valid_snapshot_and_other_results(self):
        quarter = json.loads((ROOT / 'scripts/fixtures/russell-composition/coherent-quarter-2026-06-30.json').read_text())
        baseline = {'quarterlyFacts': copy.deepcopy(quarter)}
        for case in ['unchanged', 'changed', 'older-period', 'older-control']:
            incoming = copy.deepcopy(quarter)
            if case == 'changed': incoming['holdings'][0][1] += 0.01
            if case == 'older-period': incoming['asOf'] = '2026-03-31'
            if case == 'older-control': incoming['source']['checkedAt'] = '2026-01-01'
            observation = {'id': 'russell-1000', 'quarterlyFacts': incoming,
                           'returns': copy.deepcopy(self.records['russell-1000']['returns']), 'errors': []}
            with self.subTest(case=case), patch('refresh_index_sources._collect_one', return_value=observation):
                result = collect_one(self.config['russell-1000'], NOW, previous=baseline)
                merged = merge_records({'russell-1000': baseline}, [result])['russell-1000']
                self.assertEqual(merged['quarterlyFacts'], quarter)
                self.assertEqual(merged['returns'], observation['returns'])
                if case == 'unchanged':
                    self.assertEqual(result['errors'], [])
                else:
                    self.assertNotIn('quarterlyFacts', result)
                    self.assertEqual(result['unqualifiedQuarterlyFacts'], incoming)
                    self.assertEqual(result['errors'][0]['field'], 'quarterly-composition')
                    self.assertEqual(result['errors'][0]['phase'], 'validation')


if __name__ == '__main__':
    unittest.main()
