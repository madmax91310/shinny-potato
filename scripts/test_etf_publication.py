"""ETF publication: real Git races and the actual workflow validation hooks."""
import ast
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import unittest
import test_validated_data_commit as harness

ROOT = Path(__file__).resolve().parents[1]
PRIMARY = ['src/data/annual-fx.json', 'src/data/official-performance-currencies.json',
           'src/data/automated-etf.json', 'src/data/automated-indices.json']
DERIVED = ['docs/automation-coverage.md', 'docs/automation-gaps.md', 'docs/automation-gaps.json',
           'docs/asset-field-coverage.md', 'public/data/asset-field-coverage.json', 'docs/app-inventory.md',
           'scripts/instrument-metadata-sources.json', 'scripts/generated-holdings-sources.json']
INSURANCE = 'src/data/automated-insurance.json'
SCPI = 'src/data/automated-scpi.json'
PUBLICATION_OUTPUTS = ['src/data/anniversary-levels.json','src/data/purchasing-power-observations.json']
REGULATORY_OUTPUTS = ['src/data/automated-broker-tariffs.json','src/data/automated-regulatory.json']
INDEPENDENT_OUTPUTS = [INSURANCE,SCPI,*PUBLICATION_OUTPUTS,*REGULATORY_OUTPUTS]


class EtfPublication(unittest.TestCase):
    def setUp(self):
        self.f = harness.CommitValidatedData()
        self.f.setUp()
        self.addCleanup(self.f.doCleanups)
        for name in PRIMARY + DERIVED + INDEPENDENT_OUTPUTS + ['scripts/etf-pilot.json',
                                         'scripts/collect_etf_pilot.py', 'src/data/instrument-returns.js']:
            p = self.f.local / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('original\n')
        for name in ['observation_rebase_guard.py', 'validate-etf-publication.sh']:
            (self.f.local / 'scripts' / name).write_bytes((ROOT / 'scripts' / name).read_bytes())
        self.f.git(self.f.local, 'add', '.')
        self.f.git(self.f.local, 'commit', '-m', 'ETF producer inputs')
        self.f.git(self.f.local, 'push', 'origin', 'master')
        self.f.git(self.f.other, 'pull', '--ff-only')
        self.base = self.f.git(self.f.local, 'rev-parse', 'HEAD')
        for name in PRIMARY:
            (self.f.local / name).write_text('collected ETF observation\n')
        # Only network-free generators/auditors are substituted. Publication,
        # guard, rebase, projection staging, receipt and pushes are the real code.
        bindir = self.f.root / 'bin'
        bindir.mkdir()
        stub = '''#!/usr/bin/env python3
import json, os, pathlib, subprocess, sys
command = pathlib.Path(sys.argv[0]).name + ' ' + ' '.join(sys.argv[1:])
with open(os.environ['ETF_TEST_LOG'], 'a') as log: log.write(command + '\\n')
if os.environ.get('ETF_TEST_FAIL') == command: raise SystemExit(41)
reports = json.loads(os.environ['ETF_TEST_DERIVED'])
if 'report-automation-coverage.mjs' in command or 'build-app-inventory.mjs' in command:
    for name in reports:
        pathlib.Path(name).write_text(pathlib.Path(os.environ['ETF_TEST_INSURANCE']).read_text())
if command == 'npm run build' and os.environ.get('ETF_TEST_MUTATE'):
    pathlib.Path(os.environ['ETF_TEST_MUTATE']).write_text('unvalidated mutation\\n')
if command == 'npm run build' and os.environ.get('ETF_TEST_RACE'):
    marker = pathlib.Path(os.environ['ETF_TEST_RACE'])
    if not marker.exists():
        marker.write_text('raced')
        other = os.environ['ETF_TEST_OTHER']
        pathlib.Path(other, os.environ['ETF_TEST_INSURANCE']).write_text('second insurance update\\n')
        for args in [('add', '.'), ('commit', '-m', 'second racing writer'), ('push', 'origin', 'master')]:
            subprocess.run(['git', '-C', other, *args], check=True)
'''
        for name in ['node', 'npm']:
            p = bindir / name
            p.write_text(stub)
            p.chmod(0o755)
        self.env = {'PATH': str(bindir) + os.pathsep + os.environ['PATH'],
                    'ETF_TEST_LOG': str(self.f.root / 'checks'),
                    'ETF_TEST_DERIVED': json.dumps(DERIVED), 'ETF_TEST_INSURANCE': INSURANCE,
                    'ETF_TEST_OTHER': str(self.f.other), 'RUNNER_TEMP': str(self.f.root)}

    def publish(self, **extra):
        return subprocess.run(['bash', str(harness.SCRIPT), 'ETF observations', *PRIMARY, *DERIVED],
                              cwd=self.f.local, env={**os.environ, **self.env,
                              'GITHUB_OUTPUT': str(self.f.root / 'output'),
                              'VALIDATED_DATA_CHECK': 'bash scripts/validate-etf-publication.sh check',
                              'VALIDATED_DATA_PREPARE': 'bash scripts/validate-etf-publication.sh prepare',
                              'VALIDATED_DATA_DERIVED_PATHS': json.dumps(DERIVED), **extra},
                              capture_output=True, text=True)

    def assert_refused(self, result, before):
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'rev-parse', 'master'), before)
        self.assertFalse((self.f.root / 'output').exists())

    def test_observed_insurance_collision_revalidates_and_records_both_outputs(self):
        before_index = (self.f.local / '.git/index').read_bytes()
        self.f.advance_remote(INSURANCE)
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + INSURANCE), 'concurrent update')
        for path in PRIMARY:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'collected ETF observation')
        for path in DERIVED:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')
        self.assertEqual((self.f.local / '.git/index').read_bytes(), before_index)
        self.assertEqual(self.f.git(self.f.local, 'rev-parse', 'HEAD'), self.base)
        self.assertEqual((self.f.local / INSURANCE).read_text(), 'original\n')
        checks = (self.f.root / 'checks').read_text()
        self.assertIn('npm run audit:etf-annual-performance', checks)
        self.assertIn('npm run build', checks)
        receipt = json.loads((self.f.root / 'data-publication-receipt.json').read_text())
        self.assertEqual(receipt['commit'], self.f.git(self.f.remote, 'rev-parse', 'master'))
        for path in PRIMARY + ['public/data/asset-field-coverage.json']:
            self.assertEqual(receipt['files'][path], self.f.git(self.f.remote, 'rev-parse', 'master:' + path))

    def test_target_projection_precedes_coverage_after_source_url_change(self):
        self.f.advance_remote(INSURANCE)
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        commands = (self.f.root / 'checks').read_text()
        self.assertLess(commands.index('node scripts/build-automation-targets.mjs'),
                        commands.index('node scripts/report-automation-coverage.mjs --write'))
        for path in DERIVED[-2:]:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')
        workflow = (ROOT / '.github/workflows/collect-etf-pilot.yml').read_text()
        self.assertLess(workflow.index('- run: node scripts/build-automation-targets.mjs'),
                        workflow.index('- run: node scripts/report-automation-coverage.mjs --write'))

    def test_target_generation_failure_prevents_recording(self):
        self.f.advance_remote(INSURANCE)
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        self.assert_refused(self.publish(ETF_TEST_FAIL='node scripts/build-automation-targets.mjs'), before)

    def test_second_insurance_collision_during_revalidation_retries_safely(self):
        self.f.advance_remote(INSURANCE)
        result = self.publish(ETF_TEST_RACE=str(self.f.root / 'race'))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + INSURANCE), 'second insurance update')
        for path in DERIVED:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'second insurance update')
        self.assertEqual((self.f.root / 'checks').read_text().count('npm run build'), 2)

    def test_observed_scpi_collision_revalidates_exact_combined_tree(self):
        self.env['ETF_TEST_INSURANCE'] = SCPI
        self.f.advance_remote(SCPI)
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + SCPI), 'concurrent update')
        for path in PRIMARY:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'collected ETF observation')
        for path in DERIVED:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')
        self.assertIn('npm run build', (self.f.root / 'checks').read_text())

    def test_scpi_collision_never_bypasses_failed_financial_validation(self):
        self.env['ETF_TEST_INSURANCE'] = SCPI
        self.f.advance_remote(SCPI)
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        self.assert_refused(self.publish(ETF_TEST_FAIL='npm run audit:etf-annual-performance'), before)

    def test_second_scpi_update_rebuilds_the_reports_again(self):
        self.env['ETF_TEST_INSURANCE'] = SCPI
        self.f.advance_remote(SCPI)
        result = self.publish(ETF_TEST_RACE=str(self.f.root / 'race'))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + SCPI), 'second insurance update')
        for path in DERIVED:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'second insurance update')
        self.assertEqual((self.f.root / 'checks').read_text().count('npm run build'), 2)

    def test_anniversary_publication_race_rebuilds_combined_reports(self):
        self.independent_publication_race(PUBLICATION_OUTPUTS[0])

    def test_actual_broker_publication_after_c79_revalidates_combined_reports(self):
        self.independent_publication_race(REGULATORY_OUTPUTS[0])

    def test_independent_fiscal_publication_revalidates_combined_reports(self):
        self.independent_publication_race(REGULATORY_OUTPUTS[1])

    def test_purchasing_power_publication_race_rebuilds_combined_reports(self):
        self.independent_publication_race(PUBLICATION_OUTPUTS[1])

    def independent_publication_race(self,path):
        self.env['ETF_TEST_INSURANCE']=path
        self.f.advance_remote(path)
        result=self.publish()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:'+path),'concurrent update')
        for field in PRIMARY:self.assertEqual(self.f.git(self.f.remote,'show','master:'+field),'collected ETF observation')
        for field in DERIVED:self.assertEqual(self.f.git(self.f.remote,'show','master:'+field),'concurrent update')
        self.assertIn('npm run build',(self.f.root/'checks').read_text())

    def test_publication_race_never_bypasses_failed_financial_checks(self):
        self.f.advance_remote(PUBLICATION_OUTPUTS[0])
        before=self.f.git(self.f.remote,'rev-parse','master')
        self.assert_refused(self.publish(ETF_TEST_FAIL='npm run audit:etf-annual-performance'),before)

    def test_independent_publication_race_does_not_hide_changed_fx(self):
        for path in PUBLICATION_OUTPUTS:self.f.advance_remote(path)
        self.reject_upstream('src/data/annual-fx.json')

    def test_observed_collision_without_hooks_reproduces_original_refusal(self):
        self.f.advance_remote(INSURANCE)
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        result = self.publish(VALIDATED_DATA_CHECK='', VALIDATED_DATA_PREPARE='')
        self.assert_refused(result, before)
        self.assertIn('Remote inputs changed after collection', result.stderr)

    def test_disjoint_etf_changes_are_refused_even_when_git_can_merge(self):
        path = PRIMARY[2]
        # Two financial records far apart: no textual Git conflict is needed
        # for the acquisition guard to require recollection of the registry.
        original = '\n'.join(['first record', *['unchanged'] * 20, 'last record']) + '\n'
        (self.f.local / path).write_text(original)
        self.f.git(self.f.local, 'add', path)
        self.f.git(self.f.local, 'commit', '-m', 'two financial records')
        self.f.git(self.f.local, 'push', 'origin', 'master')
        self.f.git(self.f.other, 'pull', '--ff-only')
        (self.f.local / path).write_text(original.replace('first record', 'collected first record'))
        (self.f.other / path).write_text(original.replace('last record', 'concurrent last record'))
        self.f.git(self.f.other, 'add', path)
        self.f.git(self.f.other, 'commit', '-m', 'competing financial observation')
        self.f.git(self.f.other, 'push', 'origin', 'master')
        result = self.publish()
        self.assert_refused(result, self.f.git(self.f.other, 'rev-parse', 'HEAD'))
        self.assertNotIn('CONFLICT', result.stdout + result.stderr)
        self.assertIn('Collection inputs may have changed', result.stderr)

    def test_failed_financial_revalidation_never_publishes(self):
        self.f.advance_remote(INSURANCE)
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        result = self.publish(ETF_TEST_FAIL='npm run audit:etf-annual-performance')
        self.assert_refused(result, before)
        self.assertNotIn('npm run build', (self.f.root / 'checks').read_text())

    def test_build_failure_never_publishes(self):
        self.f.advance_remote(INSURANCE)
        self.assert_refused(self.publish(ETF_TEST_FAIL='npm run build'), self.f.git(self.f.remote, 'rev-parse', 'master'))

    def test_failed_report_regeneration_never_publishes(self):
        self.f.advance_remote(INSURANCE)
        self.assert_refused(self.publish(ETF_TEST_FAIL='node scripts/report-automation-coverage.mjs --write'),
                            self.f.git(self.f.remote, 'rev-parse', 'master'))

    def test_build_cannot_change_prepared_observations_or_reports(self):
        self.f.advance_remote(INSURANCE)
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        for path in [PRIMARY[2], DERIVED[0], *DERIVED[-2:]]:
            with self.subTest(path=path):
                self.assert_refused(self.publish(ETF_TEST_MUTATE=path), before)

    def reject_upstream(self, path):
        (self.f.other / path).parent.mkdir(parents=True, exist_ok=True)
        self.f.advance_remote(path)
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        result = self.publish()
        self.assert_refused(result, before)
        self.assertFalse((self.f.root / 'checks').exists(), 'Refuse before report regeneration or audits')


class AcquisitionIndependence(unittest.TestCase):
    def test_baseline_static_module_graph_does_not_read_insurance(self):
        pending = [ROOT / 'scripts/export-etf-pilot-baseline.mjs']
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:
                continue
            seen.add(path)
            for forbidden in INDEPENDENT_OUTPUTS:self.assertNotEqual(path.name,Path(forbidden).name)
            if path.suffix not in ['.js', '.mjs']:
                continue
            text = path.read_text()
            for forbidden in INDEPENDENT_OUTPUTS:self.assertNotIn(Path(forbidden).stem,text,str(path))
            if path.suffix in ['.js', '.mjs']:
                for relative in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', text):
                    pending.append(path.parent / relative)

    def test_python_collectors_and_local_imports_do_not_read_insurance(self):
        pending = [ROOT / 'scripts' / name for name in ['collect_etf_pilot.py', 'collect_amundi_etf.py',
                   'collect_ssga_etf.py', 'refresh_additional_etf.py', 'collect_presentation_performance.py',
                   'collect_annual_fx.py', 'collect_performance_currency.py', 'refresh_index_sources.py']]
        seen = set()
        while pending:
            path = pending.pop()
            if path in seen:
                continue
            seen.add(path)
            text = path.read_text()
            for forbidden in INDEPENDENT_OUTPUTS:self.assertNotIn(Path(forbidden).stem,text,str(path))
            for node in ast.walk(ast.parse(text)):
                names = [node.module] if isinstance(node, ast.ImportFrom) else [a.name for a in node.names] if isinstance(node, ast.Import) else []
                for name in filter(None, names):
                    local = ROOT / 'scripts' / (name.split('.')[0] + '.py')
                    if local.exists():
                        pending.append(local)

    def test_workflow_uses_same_validation_contract_and_explicit_ownership(self):
        workflow = (ROOT / '.github/workflows/collect-etf-pilot.yml').read_text()
        self.assertIn('run: bash scripts/validate-etf-publication.sh validate', workflow)
        self.assertIn('VALIDATED_DATA_CHECK: bash scripts/validate-etf-publication.sh check', workflow)
        self.assertIn('VALIDATED_DATA_PREPARE: bash scripts/validate-etf-publication.sh prepare', workflow)
        declared = json.loads(re.search(r"VALIDATED_DATA_DERIVED_PATHS: '([^']+)'", workflow)[1])
        registry = json.loads((ROOT / 'src/data/automation-workflows.json').read_text())
        self.assertEqual(registry['collect-etf-pilot.yml']['validationSteps'],
                         ['Validate ETF observations and consumers', 'Validate collected observations'])
        self.assertEqual(declared, DERIVED)
        self.assertFalse(set(declared) & set(PRIMARY))


def rejected_input(path):
    def test(self):
        self.reject_upstream(path)
    return test


for index, path in enumerate(['scripts/etf-pilot.json', 'scripts/collect_etf_pilot.py',
                               'src/data/instrument-returns.js', *PRIMARY, 'src/data/unqualified-output.json']):
    setattr(EtfPublication, f'test_recollect_changed_input_{index}', rejected_input(path))


if __name__ == '__main__':
    unittest.main()
