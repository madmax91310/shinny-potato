"""Compatible dated dependencies, never a fresh-source success from Git/cache."""
import copy
import datetime as dt
import gzip
import hashlib
import io
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch
import lifestrategy_retained_holdings as retained
from lifestrategy_holdings import derive

FIXTURE = json.loads(gzip.decompress((Path(__file__).parent / 'fixtures/lifestrategy-nav/compatible-september-and-newer-october.json.gz').read_bytes()))
NOW = dt.datetime(2026, 11, 16, 16, tzinfo=dt.timezone.utc)


class RetainedLifeStrategyTest(unittest.TestCase):
    def restored(self, selected=None, parents=None):
        with patch.object(retained, 'bootstrap_books', return_value=FIXTURE['retained']) as load:
            result = retained.restore_dependencies(FIXTURE['latest'], parents or FIXTURE['parents'], selected or FIXTURE['parents'], NOW, Path('.'))
        self.assertEqual(load.call_count, 1)
        return result

    def test_real_eight_exact_books_restore_four_derivations_without_redating(self):
        restored, proofs, errors = self.restored()
        self.assertEqual(errors, {})
        self.assertEqual(set(restored), retained.SHARES)
        self.assertEqual(len(proofs), 8)
        for isin, book in restored.items():
            self.assertEqual({k:v for k,v in book.items() if k != retained.HISTORY}, FIXTURE['latest'][isin])
            archive = book[retained.HISTORY]['2026-09-30']
            self.assertEqual({k:v for k,v in archive.items() if k != 'retentionEvidence'}, FIXTURE['retained'][isin])
        expected = dict(zip(FIXTURE['parents'], [20.266324409933, 39.909759510398004, 59.773788365533, 79.699191899022]))
        for isin, parent in FIXTURE['parents'].items():
            with self.assertRaisesRegex(ValueError, 'dates differ'):
                derive(isin, parent, FIXTURE['latest'], {}, NOW)
            result = derive(isin, parent, restored, {}, NOW)
            self.assertEqual(result['asOf'], '2026-09-30')
            self.assertEqual(result['checkedAt'], '2026-11-14T14:51:25.690636+00:00')
            self.assertEqual(result['scope'], 'equity-lookthrough')
            self.assertAlmostEqual(sum(r['weightPct'] for r in result['rows']), expected[isin], places=10)
            self.assertLess(sum(r['weightPct'] for r in result['rows']), 100)
            self.assertTrue(all(d['retainedSnapshotProof']['sourceControlRenewed'] is False for d in result['dependencies']))

    def test_idempotence_and_targeted_scope(self):
        selected = ['IE00BMVB5K07']
        restored, proofs, errors = self.restored(selected)
        self.assertEqual(len(restored), 3)
        with patch.object(retained, 'bootstrap_books', side_effect=AssertionError('No repeated cold recovery')):
            again = retained.restore_dependencies({**FIXTURE['latest'], **restored}, FIXTURE['parents'], selected, NOW, Path('.'))
        self.assertEqual(again, ({}, [], {}))
        for isin in retained.SHARES - set(restored):
            self.assertNotIn(isin, restored)

    def test_next_month_retains_original_observation_and_bounded_history(self):
        isin = 'IE00BK5BQW10'
        previous = copy.deepcopy(FIXTURE['retained'][isin])
        candidate = copy.deepcopy(FIXTURE['latest'][isin])
        result = retained.carry_snapshots(isin, previous, candidate, NOW)
        self.assertEqual(result[retained.HISTORY]['2026-09-30'], previous)
        self.assertEqual({k:v for k,v in result.items() if k != retained.HISTORY}, candidate)
        again = retained.carry_snapshots(isin, result, candidate, NOW)
        self.assertEqual(again, result)
        later = {**candidate, 'asOf':'2026-11-30', 'checkedAt':'2026-12-01T07:00:00+00:00'}
        evolved = retained.carry_snapshots(isin, result, later, dt.datetime(2026, 12, 1, tzinfo=dt.timezone.utc))
        self.assertEqual(evolved[retained.HISTORY]['2026-10-31']['checkedAt'], candidate['checkedAt'])
        self.assertEqual(retained.compatible_book(isin, evolved, '2026-10-31', dt.datetime(2026, 12, 1, tzinfo=dt.timezone.utc)), candidate)
        self.assertEqual(retained.carry_snapshots('unrelated', previous, candidate, NOW), candidate)

    def test_missing_expired_partial_and_wrong_identity_do_not_unlock(self):
        isin = 'IE00BK5BQW10'
        restored, _, _ = self.restored()
        for modify in [lambda r:r.update(complete=False), lambda r:r.update(basis='index'),
                       lambda r:r.update(sourcePartial=True), lambda r:r.update(approximation=True),
                       lambda r:r.update(sourceUrl='https://another.example'), lambda r:r.update(sha256='invalid'),
                       lambda r:r.update(checkedAt='2026-10-01T07:00:00+00:00')]:
            book = copy.deepcopy(restored[isin]); modify(book[retained.HISTORY]['2026-09-30'])
            with self.assertRaises(ValueError): retained.compatible_book(isin, book, '2026-09-30', NOW)
        with self.assertRaises(ValueError): retained.compatible_book(isin, restored[isin], '2026-08-31', NOW)
        with self.assertRaises(ValueError): retained.compatible_book('IE00BKX55R35', restored[isin], '2026-09-30', NOW)
        with self.assertRaises(ValueError): derive('IE00BMVB5R75', FIXTURE['parents']['IE00BMVB5R75'], restored, {isin:'current source failed'}, NOW)

    def test_recovery_failure_is_bounded_and_other_parent_failure_is_isolated(self):
        with patch.object(retained, 'bootstrap_books', side_effect=OSError('archive unavailable')) as load:
            updated, proofs, errors = retained.restore_dependencies(FIXTURE['latest'], FIXTURE['parents'], FIXTURE['parents'], NOW, Path('.'))
        self.assertEqual(load.call_count, 1)
        self.assertEqual(updated, {})
        self.assertEqual(set(errors), set(FIXTURE['parents']))
        self.assertEqual(proofs, [])
        parents = copy.deepcopy(FIXTURE['parents']); parents['IE00BMVB5K07']['underlyingHoldings']['rows'][0]['weightPct'] += .01
        updated, _, errors = self.restored(parents=parents)
        self.assertEqual(set(errors), {'IE00BMVB5K07'})
        self.assertTrue(updated)

    def test_immutable_cold_recovery_checks_hash_and_never_queries_latest(self):
        raw = json.dumps(FIXTURE['retained']).encode()
        retained.bootstrap_books.cache_clear()
        with patch.object(retained, 'BOOTSTRAP_SHA256', hashlib.sha256(raw).hexdigest()), \
             patch.object(retained.subprocess, 'run', return_value=types.SimpleNamespace(returncode=128)), \
             patch.object(retained.urllib.request, 'urlopen', return_value=io.BytesIO(raw)) as request:
            self.assertEqual(retained.bootstrap_books('.'), FIXTURE['retained'])
            self.assertIn(retained.BOOTSTRAP_COMMIT, request.call_args.args[0].full_url)
            self.assertNotIn('/master/', request.call_args.args[0].full_url)
        retained.bootstrap_books.cache_clear()
        with patch.object(retained.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout=raw)), self.assertRaisesRegex(ValueError, 'pinned bytes'):
            retained.bootstrap_books('.')
        retained.bootstrap_books.cache_clear()

    def test_ordinary_derivation_writes_only_retained_children_and_original_clocks(self):
        import collect_dca_complete_holdings as collector
        class Clock(dt.datetime):
            @classmethod
            def now(cls, tz=None): return NOW
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            files = {'scripts/dca-complete-holdings-sources.json':{isin:{'parser':'lifestrategy-lookthrough'} for isin in FIXTURE['parents']},
                     'scripts/generated-holdings-sources.json':{}, 'scripts/dca-equity-identities.json':{}, 'scripts/dca-equity-extra-identities.json':{},
                     'src/data/dca-complete-holdings.json':FIXTURE['latest'], 'src/data/dca-security-classifications.json':{},
                     'src/data/lifestrategy.json':FIXTURE['parents']}
            for name, value in files.items():
                path=root/name;path.parent.mkdir(parents=True, exist_ok=True);path.write_text(json.dumps(value))
            output=root/'result.json'
            with patch.object(collector, 'ROOT', root), patch.object(collector, 'dt', types.SimpleNamespace(datetime=Clock)), \
                 patch.object(retained, 'bootstrap_books', return_value=FIXTURE['retained']), \
                 patch('sys.argv', ['collector','--apply','--only',*FIXTURE['parents'],'--output',str(output)]):
                collector.main()
            report=json.loads(output.read_text())
            self.assertEqual(report['errors'], [])
            self.assertEqual(len(report['successes']),4)
            from producer_report_contract import _complete_holdings_results
            native = _complete_holdings_results(report)
            self.assertEqual(native['errors'], [])
            self.assertTrue(all(r['sourceAttempted'] is False and r['phase'] == 'validation' for r in native['successes']))
            self.assertTrue(all(r['checkedAt'] == '2026-11-14T14:51:25.690636+00:00' for r in native['successes']))
            self.assertEqual(len(report['restoredDependencySnapshots']),8)
            after=json.loads((root/'src/data/dca-complete-holdings.json').read_text())
            for isin, old in FIXTURE['latest'].items():
                self.assertEqual({k:v for k,v in after[isin].items() if k != retained.HISTORY}, old)
            for isin in FIXTURE['parents']:
                self.assertEqual(after[isin]['checkedAt'], '2026-11-14T14:51:25.690636+00:00')
                self.assertEqual(after[isin]['validatedAt'], NOW.isoformat())
                self.assertEqual(report['observations'][isin]['scope'], 'equity-lookthrough')

if __name__ == '__main__': unittest.main()
