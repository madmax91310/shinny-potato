"""Replay real classes of recording refusals in isolated Git repositories."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import market_reader_revalidation as reader
import observation_rebase_guard as shared

ROOT = Path(__file__).resolve().parents[1]


class ReaderRevalidation(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        original = Path.cwd()
        self.addCleanup(os.chdir, original)
        os.chdir(self.repo)
        self.git('init', '-q')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.git('config', 'user.name', 'Isolated fixture')
        self.base = self.commit({
            reader.BASELINE: "import { ASSETS } from '../src/data/market-history.js';\n",
            'src/data/market-history.js': 'export const ASSETS = {};\n',
            'src/pages/budget-profiles/data.js': 'export const BUDGET_PROFILES = [];\n',
            reader.AUDIT_READER: '# workflow-reader contracts\n',
            reader.WORKFLOW: 'jobs:\n  refresh:\n    concurrency:\n'+reader.OLD_GROUP+'\n    steps:\n      - run: python scripts/refresh_non_bond_sources.py\n',
            reader.PREPARE: reader.OLD_PREPARE,
            'scripts/monthly-automation.json': json.dumps({'series': [{
                'parser': 'official-nav', 'isin': 'GB00B15KXQ89',
                'calendarRegistry': 'src/data/automated-etf.json'}]}),
            'src/data/automated-etf.json': json.dumps({'GB00B15KXQ89': {
                'productId': 'GB00B15KXQ89', 'currency': 'USD', 'aum': 100,
                'performance': {'currency': 'USD', 'basis': 'fund-nav-total-return',
                                'years': {'2024': 12.3}, 'method': 'income reinvested'}}}),
        })

    def git(self, *args):
        return subprocess.check_output(['git', *args], text=True, stderr=subprocess.PIPE).strip()

    def commit(self, files):
        for path, text in files.items():
            p = self.repo/path
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text)
        self.git('add', '.')
        self.git('commit', '-qm', 'isolated upstream change')
        return self.git('rev-parse', 'HEAD')

    def test_actual_concurrency_migration_and_audit_reader_are_independent(self):
        before = (self.repo/reader.WORKFLOW).read_text()
        end = self.commit({reader.WORKFLOW: before.replace(reader.OLD_GROUP, reader.NEW_GROUP),
                           reader.AUDIT_READER: '# new shared-writer contract\n'})
        with self.assertRaises(ValueError):
            shared.check('market', self.base, end)
        proof = reader.check(self.base, end)
        self.assertEqual(proof['qualifiedPublicationReaders'], sorted([reader.WORKFLOW, reader.AUDIT_READER]))
        self.assertTrue(proof['financialRevalidationRequired'])
        self.assertFalse(proof['sourceControlsRenewedByThisAdapter'])
        self.assertNotIn(reader.WORKFLOW, shared.ALLOWED['market'])

    def test_workflow_acquisition_command_cannot_hide_in_the_migration(self):
        before = (self.repo/reader.WORKFLOW).read_text()
        after = before.replace(reader.OLD_GROUP, reader.NEW_GROUP).replace('refresh_non_bond_sources.py', 'other_collector.py')
        end = self.commit({reader.WORKFLOW: after})
        with self.assertRaises(ValueError):
            reader.check(self.base, end)

    def test_seven_budget_readers_are_not_monthly_baseline_inputs(self):
        end = self.commit({p: 'dated personal publication reader\n' for p in reader.BUDGET_READERS})
        self.assertFalse(reader.baseline_dependencies(self.base) & reader.BUDGET_READERS)
        self.assertEqual(set(reader.check(self.base, end)['qualifiedPublicationReaders']), reader.BUDGET_READERS)

    def test_budget_starts_being_acquired_so_it_is_no_longer_a_reader(self):
        self.base = self.commit({reader.BASELINE: "import '../src/pages/budget-profiles/data.js';\n"})
        end = self.commit({'src/pages/budget-profiles/data.js': 'changed financial input\n'})
        with self.assertRaisesRegex(ValueError, 'acquisition dependency'):
            reader.check(self.base, end)

    def test_unresolved_dynamic_baseline_fails_closed(self):
        self.base = self.commit({reader.BASELINE: 'import(selectedSource);\n'})
        end = self.commit({'src/pages/budget-profiles/data.js': 'changed\n'})
        with self.assertRaisesRegex(ValueError, 'dynamic baseline'):
            reader.check(self.base, end)

    def test_unknown_or_collector_or_fx_changes_still_require_recollection(self):
        for path in ['scripts/refresh_monthly_history.py', 'src/data/monthly-fx.json', 'src/data/unexamined.json']:
            with self.subTest(path=path):
                end = self.commit({path: 'changed acquisition input\n'})
                with self.assertRaises(ValueError):
                    reader.check(self.base, end)

    def test_calendar_return_change_remains_protected(self):
        p = 'src/data/automated-etf.json'
        row = json.loads((self.repo/p).read_text())
        row['GB00B15KXQ89']['performance']['years']['2024'] = 13.3
        end = self.commit({p: json.dumps(row)})
        with self.assertRaises(ValueError):
            reader.check(self.base, end)

    def test_independent_aum_keeps_the_existing_calendar_comparison(self):
        p = 'src/data/automated-etf.json'
        row = json.loads((self.repo/p).read_text())
        row['GB00B15KXQ89']['aum'] = 200
        end = self.commit({p: json.dumps(row)})
        self.assertTrue(reader.check(self.base, end)['financialRevalidationRequired'])

    def test_initial_adapter_rollout_keeps_all_projection_commands(self):
        added = {p: (ROOT/p).read_text() for p in reader.ROLLOUT_FILES}
        end = self.commit({reader.PREPARE: reader.NEW_PREPARE, **added})
        proof = reader.check(self.base, end)
        self.assertIn(reader.PREPARE, proof['qualifiedPublicationReaders'])
        for command in ['build-equity-history-links', 'build-monthly-duel-returns', 'build-equity-duel-returns', 'build-ranking-annual', 'build-performance-links']:
            self.assertIn(command, reader.NEW_PREPARE)
        self.assertIn('test_audit_workflows.py', reader.NEW_PREPARE)
        self.assertIn('test_market_reader_revalidation.py', reader.NEW_PREPARE)

    def test_later_adapter_change_requires_recollection(self):
        self.base = self.commit({p: (ROOT/p).read_text() for p in reader.ROLLOUT_FILES})
        end = self.commit({'scripts/market_reader_revalidation.py': '# another admission policy\n'})
        with self.assertRaises(ValueError):
            reader.check(self.base, end)

    def test_unknown_projection_changes_are_not_a_rollout(self):
        end = self.commit({reader.PREPARE: reader.NEW_PREPARE.replace('build-ranking-annual', 'different-financial-projector')})
        with self.assertRaises(ValueError):
            reader.check(self.base, end)

    def test_other_producers_keep_the_original_guard(self):
        original = set(shared.ALLOWED['etf'])
        end = self.commit({reader.AUDIT_READER: '# new workflow check\n'})
        reader.check(self.base, end)
        self.assertEqual(shared.ALLOWED['etf'], original)
        with self.assertRaises(ValueError):
            shared.check('etf', self.base, end)


class FinancialPublicationGate(unittest.TestCase):
    def test_reader_admission_never_skips_a_failed_financial_validation(self):
        import shlex
        import sys
        import test_validated_data_commit as harness
        f = harness.CommitValidatedData()
        f.setUp()
        self.addCleanup(f.doCleanups)
        path = f.local/reader.AUDIT_READER
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('# prior workflow checks\n')
        f.git(f.local, 'add', reader.AUDIT_READER)
        f.git(f.local, 'commit', '-m', 'acquisition base')
        f.git(f.local, 'push', 'origin', 'master')
        f.git(f.other, 'pull', '--ff-only')
        (f.other/reader.AUDIT_READER).write_text('# updated publication reader checks\n')
        f.git(f.other, 'add', reader.AUDIT_READER)
        f.git(f.other, 'commit', '-m', 'independent upstream reader')
        f.git(f.other, 'push', 'origin', 'master')
        remote_before = f.git(f.other, 'rev-parse', 'HEAD')
        (f.local/'validated.json').write_text('validated source observation\n')
        adapter = ROOT/'scripts/market_reader_revalidation.py'
        command = (f'{shlex.quote(sys.executable)} {shlex.quote(str(adapter))} '
                   '--base "$VALIDATED_DATA_ORIGINAL_BASE" --upstream HEAD^')
        env = {'VALIDATED_DATA_PREPARE': command,
               'VALIDATED_DATA_DERIVED_PATHS': '[]',
               'VALIDATED_DATA_CHECK': 'exit 23'}
        result = f.publish(env)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertEqual(f.git(f.other, 'rev-parse', 'HEAD'), remote_before)
        f.git(f.other, 'fetch', 'origin', 'master')
        self.assertEqual(f.git(f.other, 'rev-parse', 'origin/master'), remote_before)
        result = f.publish({**env, 'VALIDATED_DATA_CHECK': "test -f validated.json"})
        self.assertEqual(result.returncode, 0, result.stderr)
        f.git(f.other, 'pull', '--ff-only')
        self.assertEqual((f.other/'validated.json').read_text(), 'validated source observation\n')


if __name__ == '__main__':
    unittest.main()
