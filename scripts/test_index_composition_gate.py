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


if __name__ == '__main__':
    unittest.main()
