"""All configured compositions must pass the same publication gate."""
import copy
import datetime as dt
import json
import unittest
from unittest.mock import patch
from refresh_index_sources import ROOT, collect_one, validate_composition, merge_records


class CompositionGateTests(unittest.TestCase):
    def setUp(self):
        # Check live records against the real UTC clock, not a frozen snapshot date.
        self.now = dt.datetime.now(dt.timezone.utc)
        self.config = {c['id']: c for c in json.loads((ROOT / 'scripts/index-automation.json').read_text())['indices']}
        self.records = json.loads((ROOT / 'src/data/automated-indices.json').read_text())

    def test_every_configured_composition_has_valid_evidence(self):
        for key, config in self.config.items():
            if config.get('enabled', True) and config.get('collectComposition', True):
                with self.subTest(index=key):
                    validate_composition(self.records[key]['facts'], config, self.now)
                    self.assertIn('composition', config['requiredFields'])
                    if config.get('holdingsSourceUrl'):
                        self.assertIn('holdings', config['requiredFields'])

    def test_bad_composition_is_retained_without_losing_valid_returns(self):
        config = self.config['world']
        baseline = self.records['world']
        validate_composition(baseline['facts'], config, self.now)
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
            if mutation == 'future': incoming['asOf'] = (self.now.date() + dt.timedelta(days=1)).isoformat()
            observation = {'id': 'world', 'facts': incoming, 'returns': baseline['returns'], 'errors': [], 'unavailable': []}
            with self.subTest(mutation=mutation), patch('refresh_index_sources._collect_one', return_value=observation):
                result = collect_one(config, self.now)
                self.assertNotIn('facts', result)
                self.assertEqual(result['errors'][0]['field'], 'composition')
                merged = merge_records({'world': baseline}, [result])
                self.assertEqual(merged['world']['facts'], baseline['facts'])
                self.assertEqual(merged['world']['returns'], baseline['returns'])

    def test_russell_dates_remain_independent(self):
        record = self.records['russell-1000']
        validate_composition(record['facts'], self.config['russell-1000'], self.now)
        self.assertEqual(record['facts']['holdings'], [])
        self.assertNotEqual(record['facts']['asOf'], record['holdings']['asOf'])
        self.assertTrue(record['holdings']['rows'])

    def test_composition_date_boundaries_remain_strict(self):
        config = self.config['world']
        # Include a year boundary and a later year; only the date is synthetic.
        for now in [self.now, dt.datetime(2027, 1, 1, tzinfo=dt.timezone.utc),
                    dt.datetime(2030, 6, 15, tzinfo=dt.timezone.utc)]:
            for age in [0, 75, 76, -1]:
                facts = copy.deepcopy(self.records['world']['facts'])
                facts['asOf'] = (now.date() - dt.timedelta(days=age)).isoformat()
                with self.subTest(now=now.isoformat(), age=age):
                    if age in [0, 75]:
                        validate_composition(facts, config, now)
                    else:
                        with self.assertRaisesRegex(ValueError, 'future or stale'):
                            validate_composition(facts, config, now)


if __name__ == '__main__':
    unittest.main()

