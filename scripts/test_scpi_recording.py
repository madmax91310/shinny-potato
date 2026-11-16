"""Isolated source/write races: no supplier calls or production observations."""
import copy
import importlib.util
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch, call

SCRIPTS = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('scpi_recording', SCRIPTS / 'commit-scpi-observations.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def report(failed=False, code_sha=None):
    items = [{'id': key, 'instrument': {'type': 'scpi', 'id': key}, 'selected': True,
              'fields': ['declared financial observation']} for key in ('a', 'b')]
    plan = {'producer': 'collect_scpi', 'reportStem': 'scpi-observation', 'items': items, 'codeSha': code_sha,
            'durablePlan': True, 'nonce': 'isolated-source-' + str(code_sha)}
    plan['sha256'] = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    rows = [{'id': key, 'status': 'failure' if failed and key == 'b' else 'success',
             **({'reason': 'Source unavailable'} if failed and key == 'b' else {'checkedAt': '2026-11-16T08:00:00Z'})}
            for key in ('a', 'b')]
    return {'observations': rows, 'resultContract': {'schemaVersion': 1,
            'protocol': 'producer-results-v1', 'inputPlan': plan,
            'scope': {'kind': 'collect_scpi', 'items': items, 'expectedIds': ['a', 'b'], 'requestedIds': ['a', 'b']},
            'outcomes': [{**item, 'status': 'failed' if r['status'] == 'failure' else 'succeeded',
                          'sourceAttempted': True} for r, item in zip(rows, items)]}}


class ScpiRecording(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.root, self.remote = self.directory / 'work', self.directory / 'origin.git'
        self.root.mkdir()
        self.command(['git', 'init', '--bare', '-q', str(self.remote)])
        self.git('init', '-q', '-b', 'master')
        self.git('config', 'user.name', 'Isolated SCPI regression')
        self.git('config', 'user.email', 'test@example.invalid')
        (self.root / 'scripts').mkdir()
        for name in ['commit-validated-data.sh', 'data_publication.py',
                     'stage_validated_projections.py', 'observation_rebase_guard.py']:
            shutil.copyfile(SCRIPTS / name, self.root / 'scripts' / name)
        # Real isolated writer and input guard; a small financial validator for
        # synthetic records replaces only the app's full build, never the guard.
        (self.root / 'scripts/validate-producer-publication.sh').write_text(
            'set -e\npython3 scripts/observation_rebase_guard.py --kind scpi --base "$VALIDATED_DATA_ORIGINAL_BASE"\n'
            'python3 -c \'import json; x=json.load(open("src/data/automated-scpi.json")); '
            'c=json.load(open("source-config.json")); assert x["a"]["value"]==c["a"], "Financial validation failed"\'\n')
        self.file = self.root / 'src/data/automated-scpi.json'
        self.file.parent.mkdir(parents=True)
        self.old = {'a': {'value': 10, 'asOf': '2026-09-30', 'checkedAt': '2026-11-15'},
                    'b': {'value': 20, 'asOf': '2026-09-30', 'checkedAt': '2026-11-15'}}
        self.file.write_text(json.dumps(self.old))
        (self.root / 'source-config.json').write_text(json.dumps({'a': 11, 'b': 20}))
        (self.root / 'package.json').write_text('{}')
        self.git('add', '.')
        self.git('commit', '-qm', 'Synthetic source base')
        self.base = self.git('rev-parse', 'HEAD')
        self.git('remote', 'add', 'origin', str(self.remote))
        self.git('push', '-q', 'origin', 'master')
        initial = copy.deepcopy(self.old)
        initial['a'].update(value=11, checkedAt='2026-11-16')
        self.file.write_text(json.dumps(initial))
        self.source_report = self.directory / 'scpi-observation.json'
        self.source_report.write_text(json.dumps(report(code_sha=self.base)))
        self.source_report.with_name('scpi-observation.contract-plan.json').write_text('{"initialPlan":true}')
        self.real_run = subprocess.run
        self.acquisitions, self.validations = [], []
        delay = patch.object(module.time, 'sleep')
        delay.start()
        self.addCleanup(delay.stop)

    def command(self, args, **kwargs):
        return subprocess.run(args, check=True, capture_output=True, text=True, **kwargs).stdout.strip()

    def git(self, *args):
        return self.command(['git', '-C', str(self.root), *args])

    def advance(self, changes=None):
        directory = self.directory / ('advance-' + str(len(list(self.directory.glob('advance-*')))))
        self.command(['git', 'clone', '-q', str(self.remote), str(directory)])
        for args in [('user.name', 'Concurrent regression'), ('user.email', 'test@example.invalid')]:
            self.command(['git', '-C', str(directory), 'config', *args])
        for name, value in (changes or {'docs/budget-complementary-bank-2026-11-16/README.md': 'independent',
                                       'src/data/other.json': '{"concurrent":20}',
                                       'source-config.json': '{"a":12,"b":20}'}).items():
            p = directory / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(value)
        self.command(['git', '-C', str(directory), 'add', '.'])
        self.command(['git', '-C', str(directory), 'commit', '-qm', 'Concurrent inputs'])
        self.command(['git', '-C', str(directory), 'push', '-q'])
        return self.command(['git', '-C', str(directory), 'rev-parse', 'HEAD'])

    def acquire(self, args, **kwargs):
        if args[:2] != ['python3', 'scripts/collect_scpi.py']:
            return self.real_run(args, **kwargs)
        root = Path(kwargs['cwd'])
        self.acquisitions.append(root)
        self.assertNotEqual(root, self.root)
        self.assertEqual(json.loads((root / 'source-config.json').read_text())['a'], 12)
        values = json.loads((root / 'src/data/automated-scpi.json').read_text())
        values['a'].update(value=12, checkedAt='2026-11-16')
        (root / 'src/data/automated-scpi.json').write_text(json.dumps(values))
        target = Path(args[-1])
        target.write_text(json.dumps(report(getattr(self, 'partial', False), code_sha=module.revision(root))))
        target.with_name(target.stem + '.contract-plan.json').write_text('{"freshPlan":true}')
        return subprocess.CompletedProcess(args, 1 if getattr(self, 'partial', False) else 0)

    def validate(self, root):
        self.validations.append(root)
        value = json.loads((root / 'src/data/automated-scpi.json').read_text())
        self.assertEqual(value['a']['value'], 12)
        self.assertEqual(value['b'], self.old['b'])

    def test_real_guard_refusal_recollects_current_inputs_then_records_only_owned_data(self):
        self.advance()
        before = self.git('status', '--porcelain'), self.file.read_bytes()
        with patch.object(module.subprocess, 'run', side_effect=self.acquire), patch.object(module, 'validate', side_effect=self.validate):
            result = module.publish(self.root, self.source_report)
        self.assertEqual((result['changed'], result['collection_failed']), ('true', 'false'))
        self.assertEqual((len(self.acquisitions), len(self.validations)), (1, 1))
        self.assertEqual((self.git('status', '--porcelain'), self.file.read_bytes()), before)
        self.git('fetch', '-q', 'origin', 'master')
        saved = json.loads(self.git('show', 'origin/master:src/data/automated-scpi.json'))
        self.assertEqual(saved['a']['value'], 12)
        self.assertEqual(saved['a']['asOf'], '2026-09-30')
        self.assertEqual(saved['b'], self.old['b'])
        self.assertEqual(self.git('show', 'origin/master:src/data/other.json'), '{"concurrent":20}')
        final = json.loads(self.source_report.read_text())
        self.assertEqual([x['status'] for x in final['recordingAttempts']], ['failed', 'succeeded'])
        self.assertEqual(json.loads((self.directory / 'scpi-recording-attempts/attempt-1/scpi-observation.json').read_text()), report(code_sha=self.base))
        self.assertEqual(json.loads(self.source_report.with_name('scpi-observation.contract-plan.json').read_text()), {'freshPlan': True})
        self.assertEqual(self.git('worktree', 'list', '--porcelain').count('worktree '), 1)

    def test_partial_recollection_keeps_failed_values_dates_and_explicit_failure(self):
        self.partial = True
        self.advance()
        with patch.object(module.subprocess, 'run', side_effect=self.acquire), patch.object(module, 'validate', side_effect=self.validate):
            result = module.publish(self.root, self.source_report)
        self.assertEqual(result['collection_failed'], 'true')
        final = json.loads(self.source_report.read_text())
        self.assertEqual(final['observations'][1]['status'], 'failure')
        self.git('fetch', '-q', 'origin', 'master')
        self.assertEqual(json.loads(self.git('show', 'origin/master:src/data/automated-scpi.json'))['b'], self.old['b'])

    def test_financial_failure_without_an_input_refusal_is_not_retried(self):
        bad = copy.deepcopy(self.old); bad['a']['value'] = 99
        self.file.write_text(json.dumps(bad))
        with patch.object(module.subprocess, 'run', side_effect=self.acquire), patch.object(module, 'validate') as validate:
            with self.assertRaisesRegex(RuntimeError, 'no unsafe retry'):
                module.publish(self.root, self.source_report)
        self.assertEqual(self.acquisitions, [])
        validate.assert_not_called()
        self.assertEqual(self.git('ls-remote', 'origin', 'refs/heads/master').split()[0], self.base)

    def test_failed_revalidation_does_not_record_and_cleans_the_private_checkout(self):
        upstream = self.advance()
        with patch.object(module.subprocess, 'run', side_effect=self.acquire), patch.object(module, 'validate', side_effect=ValueError('Financial check refused')):
            with self.assertRaisesRegex(ValueError, 'Financial check refused'):
                module.publish(self.root, self.source_report)
        self.assertEqual(self.git('ls-remote', 'origin', 'refs/heads/master').split()[0], upstream)
        self.assertEqual(self.git('worktree', 'list', '--porcelain').count('worktree '), 1)

    def test_validation_cannot_silently_modify_the_acquired_financial_values(self):
        upstream = self.advance()
        def mutate(root):
            path = root / 'src/data/automated-scpi.json'
            values = json.loads(path.read_text()); values['a']['value'] = 13
            path.write_text(json.dumps(values))
        with patch.object(module.subprocess, 'run', side_effect=self.acquire), patch.object(module, 'validate', side_effect=mutate):
            with self.assertRaisesRegex(ValueError, 'modified the acquired financial observations'):
                module.publish(self.root, self.source_report)
        self.assertEqual(self.git('ls-remote', 'origin', 'refs/heads/master').split()[0], upstream)

    def test_missing_result_or_unverified_cache_cannot_be_recorded(self):
        for defect in ('omitted', 'cache', 'interrupted', 'empty', 'other-producer', 'malformed-contract', 'malformed-observation'):
            data = report(code_sha=self.base)
            if defect == 'omitted': data['resultContract']['outcomes'].pop()
            elif defect == 'cache': data['resultContract']['outcomes'][0]['sourceAttempted'] = False
            elif defect == 'interrupted': data['producerStarted'] = 'producer-results-v1'
            elif defect == 'other-producer': data['resultContract']['scope']['kind'] = 'other'
            elif defect == 'malformed-contract': data['resultContract'] = None
            elif defect == 'malformed-observation': data['observations'][0] = 'Invalid row'
            else: data['observations'] = []
            self.source_report.write_text(json.dumps(data))
            with self.subTest(defect=defect), patch.object(module, 'record') as record:
                with self.assertRaises(ValueError): module.publish(self.root, self.source_report)
                record.assert_not_called()

    def test_dependency_change_requires_a_fresh_workflow_not_an_old_runtime(self):
        upstream = self.advance({'package.json': '{"changed":true}'})
        with patch.object(module.subprocess, 'run', side_effect=self.acquire), patch.object(module, 'validate'):
            with self.assertRaisesRegex(RuntimeError, 'runtime dependencies changed'):
                module.publish(self.root, self.source_report)
        self.assertEqual(self.acquisitions, [])
        self.assertEqual(self.git('ls-remote', 'origin', 'refs/heads/master').split()[0], upstream)

    def test_a_plan_from_a_different_checkout_or_without_a_durable_plan_cannot_record(self):
        for missing in (False, True):
            data = report(code_sha='0' * 40)
            if missing: del data['resultContract']['inputPlan']
            self.source_report.write_text(json.dumps(data))
            with self.subTest(missing=missing), patch.object(module, 'record') as record:
                with self.assertRaisesRegex(ValueError, 'does not match the collection checkout'):
                    module.publish(self.root, self.source_report)
                record.assert_not_called()

    def test_an_earlier_guard_trace_does_not_hide_a_later_financial_failure(self):
        message = 'observation_rebase_guard.py\nValueError: ' + module.INPUT_REFUSAL + '\nAssertionError: Financial check failed'
        with patch.object(module, 'record', return_value=subprocess.CompletedProcess([], 1, message)), patch.object(module, 'validate') as validate:
            with self.assertRaisesRegex(RuntimeError, 'no unsafe retry'):
                module.publish(self.root, self.source_report)
        validate.assert_not_called()

    def test_interruption_before_new_report_keeps_attempt_history_and_does_not_record(self):
        upstream = self.advance()
        def interrupted(args, **kwargs):
            if args[:2] == ['python3', 'scripts/collect_scpi.py']:
                return subprocess.CompletedProcess(args, 2)
            return self.real_run(args, **kwargs)
        with patch.object(module.subprocess, 'run', side_effect=interrupted), patch.object(module, 'validate') as validate:
            with self.assertRaisesRegex(RuntimeError, 'no complete auditable report'):
                module.publish(self.root, self.source_report)
        validate.assert_not_called()
        self.assertEqual(self.git('ls-remote', 'origin', 'refs/heads/master').split()[0], upstream)
        self.assertFalse(self.source_report.exists())
        self.assertFalse(self.source_report.with_name('scpi-observation.contract-plan.json').exists())
        final = json.loads((self.directory / 'scpi-recording-attempts/recording-status.json').read_text())
        self.assertEqual(final['attempts'][0]['recoveryPhase'], 'acquisition')
        self.assertIn('no complete auditable report', final['attempts'][0]['recoveryError'])
        self.assertEqual(self.git('worktree', 'list', '--porcelain').count('worktree '), 1)

    def test_retry_plan_without_a_report_does_not_reuse_the_old_successes(self):
        upstream = self.advance()
        latest = {}
        def interrupted(args, **kwargs):
            if args[:2] == ['python3', 'scripts/collect_scpi.py']:
                target = Path(args[-1]); latest.update(report(code_sha=module.revision(kwargs['cwd'])))
                target.with_name(target.stem + '.contract-plan.json').write_text(json.dumps(latest))
                return subprocess.CompletedProcess(args, 2)
            return self.real_run(args, **kwargs)
        with patch.object(module.subprocess, 'run', side_effect=interrupted), patch.object(module, 'validate') as validate:
            with self.assertRaisesRegex(RuntimeError, 'no complete auditable report'):
                module.publish(self.root, self.source_report)
        validate.assert_not_called()
        self.assertFalse(self.source_report.exists())
        self.assertEqual(json.loads(self.source_report.with_name('scpi-observation.contract-plan.json').read_text()), latest)
        self.assertTrue((self.directory / 'scpi-recording-attempts/attempt-1/scpi-observation.json').exists())
        self.assertEqual(self.git('ls-remote', 'origin', 'refs/heads/master').split()[0], upstream)

    def test_invalid_retry_report_remains_invalid_in_the_registered_artifact(self):
        upstream = self.advance()
        def malformed(args, **kwargs):
            if args[:2] == ['python3', 'scripts/collect_scpi.py']:
                Path(args[-1]).write_text('{')
                return subprocess.CompletedProcess(args, 0)
            return self.real_run(args, **kwargs)
        with patch.object(module.subprocess, 'run', side_effect=malformed), patch.object(module, 'validate') as validate:
            with self.assertRaises(json.JSONDecodeError):
                module.publish(self.root, self.source_report)
        validate.assert_not_called()
        self.assertEqual(self.source_report.read_text(), '{')
        self.assertEqual(self.git('ls-remote', 'origin', 'refs/heads/master').split()[0], upstream)

    def test_repeated_input_races_exhaust_three_attempts_without_publishing(self):
        calls = []
        def refuse(root, output):
            calls.append(root)
            self.advance({'docs/race.txt': str(len(calls)), 'source-config.json': '{"a":12,"b":20}'})
            return subprocess.CompletedProcess([], 1, 'observation_rebase_guard.py\nValueError: ' + module.INPUT_REFUSAL)
        with patch.object(module, 'record', side_effect=refuse), patch.object(module.subprocess, 'run', side_effect=self.acquire), patch.object(module, 'validate', side_effect=self.validate):
            with self.assertRaisesRegex(RuntimeError, 'no unsafe retry'):
                module.publish(self.root, self.source_report)
        self.assertEqual(len(calls), 3)
        self.assertEqual(len(self.acquisitions), 2)
        self.assertEqual(module.time.sleep.call_args_list, [call(2), call(4)])
        self.git('fetch', '-q', 'origin', 'master')
        self.assertEqual(json.loads(self.git('show', 'origin/master:src/data/automated-scpi.json')), self.old)
        self.assertEqual(self.git('worktree', 'list', '--porcelain').count('worktree '), 1)

    def test_retry_validation_and_artifact_remain_bound_to_the_ordinary_workflow(self):
        workflow = (SCRIPTS.parent / '.github/workflows/update-scpi.yml').read_text()
        for pattern in module.PYTHON_TESTS:
            self.assertIn("-p '" + pattern + "'", workflow)
        for command in ('node scripts/test-scpi.mjs', 'npm run audit:data-catalog', 'npm run build'):
            self.assertIn(command, workflow)
        current_artifact = workflow.split('name: scpi-observations', 1)[1].split('- uses:', 1)[0]
        self.assertIn('/scpi-observation.json', current_artifact)
        self.assertIn('/scpi-observation.contract-plan.json', current_artifact)
        self.assertNotIn('*.json', current_artifact)
        self.assertIn('name: scpi-recording-attempts', workflow)
        self.assertLess(workflow.index('python scripts/commit-scpi-observations.py'), workflow.index('name: scpi-observations'))
        self.assertIn('steps.commit.outputs.collection_failed', workflow)
        self.assertEqual(module.WRITER[-1], 'src/data/automated-scpi.json')

    def test_unowned_write_paths_and_unbounded_retries_are_refused(self):
        with patch.object(module, 'record') as record:
            for command in (module.WRITER + ['src/data/other.json'], ['bash', 'other.sh']):
                with self.assertRaises(ValueError): module.publish(self.root, self.source_report, command=command)
            for attempts in (0, 4, True):
                with self.assertRaises(ValueError): module.publish(self.root, self.source_report, attempts=attempts)
            record.assert_not_called()


class ArtifactContract(unittest.TestCase):
    def reports(self, directory):
        from publish_automation_status import artifact_reports
        jobs = [{'name': 'refresh', 'conclusion': 'success', 'steps': [
            {'name': 'Collect observations: collect', 'conclusion': 'success'}]}]
        return artifact_reports('isolated/replay', 'update-scpi.yml', jobs,
                                [{'id': 1, 'name': 'scpi-observations'}], directory,
                                download=lambda *args: None)

    def fixture(self, directory):
        source = SCRIPTS / 'fixtures/scpi/recording-20261116'
        for name in ('scpi-observation.json', 'scpi-observation.contract-plan.json'):
            shutil.copyfile(source / name, Path(directory) / name)

    def test_real_report_with_separate_support_attempts_has_no_out_of_contract_error(self):
        with tempfile.TemporaryDirectory() as folder:
            main, support = Path(folder) / 'main', Path(folder) / 'support'
            main.mkdir(); support.mkdir()
            self.fixture(main); self.fixture(support)
            rows = self.reports(main)
            self.assertEqual([e for r in rows for e in r.get('errors', [])], [])
            expected = json.loads((main / 'scpi-observation.json').read_text())['resultContract']['scope']['expectedIds']
            self.assertTrue(set(expected) <= {r['id'] for report in rows for r in report.get('successes', [])})
            # Reproduce the old packaging defect without weakening the reader.
            shutil.copyfile(main / 'scpi-observation.json', main / 'scpi-observation-attempt-1.json')
            errors = [e for r in self.reports(main) for e in r.get('errors', [])]
            self.assertTrue(any(e['id'] == 'report-read:scpi-observation-attempt-1' for e in errors))

    def test_latest_interrupted_plan_reports_omissions_instead_of_earlier_successes(self):
        with tempfile.TemporaryDirectory() as folder:
            self.fixture(folder)
            primary = Path(folder) / 'scpi-observation.json'
            placeholder = Path(folder) / 'scpi-observation.contract-plan.json'
            primary.write_bytes(placeholder.read_bytes())
            expected = json.loads(placeholder.read_text())['resultContract']['scope']['expectedIds']
            rows = self.reports(folder)
            errors = {e['id'] for r in rows for e in r.get('errors', [])}
            self.assertTrue({'report-result:collect_scpi:' + id for id in expected} <= errors)
            successes = {e['id'] for r in rows for e in r.get('successes', [])}
            self.assertFalse(set(expected) & successes)


if __name__ == '__main__':
    unittest.main()
