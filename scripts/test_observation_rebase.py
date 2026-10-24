"""Real isolated Git races: only independent financial publications may rebase."""
import pathlib
import shlex
import sys
import unittest
import test_validated_data_commit as harness

GUARD = pathlib.Path(__file__).with_name('observation_rebase_guard.py').resolve()


class ObservationRebaseTests(unittest.TestCase):
    def setUp(self):
        self.f = harness.CommitValidatedData()
        self.f.setUp()
        self.addCleanup(self.f.doCleanups)
        for name in ['src/data/automated-insurance.json', 'src/data/automated-scpi.json',
                     'src/data/automated-etf-monthly.json', 'src/data/worldbank-gold-monthly.json', 'scripts/collect_scpi.py']:
            p = self.f.local / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('original\n')
        self.f.git(self.f.local, 'add', '.')
        self.f.git(self.f.local, 'commit', '-m', 'producer inputs')
        self.f.git(self.f.local, 'push', 'origin', 'master')
        self.f.git(self.f.other, 'pull', '--ff-only')
        (self.f.local / 'validated.json').write_text('validated update\n')

    def publish(self, kind='scpi', validation='test -f validated.json'):
        command = (f'{shlex.quote(sys.executable)} {shlex.quote(str(GUARD))} '
                   f'--kind {kind} --base "$VALIDATED_DATA_ORIGINAL_BASE" --upstream HEAD^ && {validation}')
        return self.f.publish({'VALIDATED_DATA_CHECK': command})

    def test_insurance_race_preserves_both_validated_outputs(self):
        self.f.advance_remote('src/data/automated-insurance.json')
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:src/data/automated-insurance.json'), 'concurrent update')

    def test_index_collection_can_revalidate_after_independent_scpi(self):
        self.f.advance_remote('src/data/automated-scpi.json')
        result=self.publish('indices');self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:src/data/automated-scpi.json'),'concurrent update')

    def test_index_collection_cannot_reuse_changed_collection_inputs(self):
        self.assert_refused('src/data/automated-etf-monthly.json','indices')

    def test_publication_can_revalidate_after_scpi(self):
        self.f.advance_remote('src/data/automated-scpi.json')
        result = self.publish('publication')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:src/data/automated-scpi.json'), 'concurrent update')

    def assert_refused(self, path, kind='scpi', validation='true'):
        self.f.advance_remote(path)
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        result = self.publish(kind, validation)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.f.git(self.f.remote, 'rev-parse', 'master'), before)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'original')
        self.assertFalse((self.f.root / 'output').exists())

    def test_gold_registry_is_a_market_projection_input_but_publication_must_recollect(self):
        self.f.advance_remote('src/data/worldbank-gold-monthly.json')
        result=self.publish('market')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:src/data/worldbank-gold-monthly.json'),'concurrent update')

    def test_gold_input_change_cannot_reuse_anniversary_collection(self):
        self.assert_refused('src/data/worldbank-gold-monthly.json','publication')

    def test_collector_code_change_requires_recollection(self):
        self.assert_refused('scripts/collect_scpi.py')

    def test_competing_scpi_observation_is_not_overwritten(self):
        self.assert_refused('src/data/automated-scpi.json')

    def test_history_change_cannot_reuse_daily_price_collection(self):
        self.assert_refused('src/data/automated-etf-monthly.json', 'publication')

    def test_financial_revalidation_failure_prevents_push(self):
        self.assert_refused('src/data/automated-insurance.json', validation='false')


if __name__ == '__main__':
    unittest.main()
