"""A qualified inline snapshot must survive older shards and an ordinary checkpoint."""
import copy
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

from ai_portfolio_series import bucket, hydrate, persist, write_json_atomic


class SeriesPersistence(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = pathlib.Path(self.temp.name)
        self.old = {'qualified': True, 'listingEvidenceId': None, 'responseSha256': 'old',
                    'retrievedAt': '2026-10-22T05:07:25+00:00', 'points': {'2026-10-21': {'close': 42, 'synthetic': 100}}}
        self.qualified = {**copy.deepcopy(self.old), 'listingEvidenceId': 'exact-source', 'responseSha256': 'verified',
                          'retrievedAt': '2026-10-22T19:50:31+00:00'}
        self.market = {'universe': [{'id': 'a', 'seriesFile': 'series/' + bucket('a')}],
                       'series': {'a': copy.deepcopy(self.qualified)}}
        self.shard = self.folder / 'series' / bucket('a')
        write_json_atomic(self.shard, {'a': self.old, 'unrelated': {'points': {'2026-01-01': 7}}})

    def test_hydration_preserves_the_qualified_resident_snapshot(self):
        hydrate(self.market, self.folder)
        self.assertEqual(self.market['series']['a'], self.qualified)

    def test_checkpoint_repairs_the_divergent_shard_without_a_new_collection(self):
        result = persist(self.market, self.folder, {'a'}, set())
        cold = {**result, 'series': {}}
        hydrate(cold, self.folder)
        self.assertEqual(cold['series']['a'], self.qualified)
        self.assertEqual(json.loads(self.shard.read_text())['unrelated'], {'points': {'2026-01-01': 7}})
        self.assertEqual(cold['series']['a']['retrievedAt'], '2026-10-22T19:50:31+00:00')

    def test_requested_hydration_does_not_load_other_quotes(self):
        cold = {**self.market, 'series': {}}
        hydrate(cold, self.folder, {'other'})
        self.assertEqual(cold['series'], {})

    def test_missing_resident_keeps_the_existing_shard_fallback(self):
        cold = {**self.market, 'series': {}}
        hydrate(cold, self.folder, {'a'})
        self.assertEqual(cold['series']['a'], self.old)

    def test_unchanged_checkpoints_do_not_rewrite_buckets(self):
        persist(self.market, self.folder, {'a'}, {'a'})
        with patch('ai_portfolio_series.write_json_atomic') as writer:
            persist(self.market, self.folder, {'a'}, set())
        writer.assert_not_called()

    def test_nonresident_shards_are_not_mass_rewritten(self):
        original = self.shard.read_bytes()
        result = persist(self.market, self.folder, set(), set())
        self.assertEqual(result['series'], {})
        self.assertEqual(self.shard.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
