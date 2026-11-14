"""Real isolated Git races: only independent financial publications may rebase."""
import pathlib
import copy
import gzip
from unittest.mock import patch
import ast
import re
import json
import shlex
import sys
import unittest
import test_validated_data_commit as harness

GUARD = pathlib.Path(__file__).with_name('observation_rebase_guard.py').resolve()
ROOT = GUARD.parents[1]
CURRENT_REVIEW_OUTPUTS = [
    'docs/data-operations-coordination.md',
    'scripts/fixtures/qualified-monthly-return-resolutions-20261029.json',
    'scripts/test-bdf-debt-charts.mjs',
    'scripts/lib/radar-queue.mjs',
    'scripts/test-radar-requalification-queue.mjs',
    'scripts/test-monthly-return-resolution.mjs',
    'scripts/test-review-inbox.mjs',
    'scripts/test_automation_monitoring.py',
    'src/pages/data-review/review-causes.js',
    'src/pages/data-review/review-inbox.js',
]
ACTOR_OUTPUT = 'src/data/automated-presentation-actors.json'
BUDGET_EDITORIAL_READERS = [
    'docs/budget-editorial-polish-2026-11-02.csv',
    'docs/budget-editorial-polish-2026-11-02.md',
    'scripts/fixtures/budget-editorial/before-2026-11-02.json',
    'scripts/test-budget-editorial-context.mjs',
    'src/pages/budget-profiles/publication-context.json',
]
PRIVATE_SERVICE_READERS = [
    'services/tweet-bank-private/README.md',
    'services/tweet-bank-private/tests/api.mjs',
    'services/tweet-bank-private/worker/index.js',
    'services/tweet-bank-private/worker/page.js',
    'services/tweet-bank-private/tests/browser.mjs',
    'services/tweet-bank-private/scripts/preview.mjs',
    '.github/workflows/test-tweet-bank-private.yml',
]


SCPI_ETF_RACE = json.loads((ROOT/'scripts/fixtures/scpi-etf-recording-race-20261106.json').read_text())['changedPaths']
ETF_BUDGET_RACE = json.loads((ROOT/'scripts/fixtures/etf-budget-recording-race-20261114.json').read_text())['changedPaths']
SUBSCRIBER_RACE = json.loads((ROOT/'scripts/fixtures/subscriber-reader-recording-race-20261114.json').read_text())

ECONOMIC_PATH = 'src/data/automated-economic.json'

def economic_fixture(name):
    return json.loads(gzip.decompress((ROOT / 'scripts/fixtures/economic-control-race-20261102' / (name+'.json.gz')).read_bytes()))


class EconomicInputSignatureTests(unittest.TestCase):
    def eligible(self, before, after):
        import observation_rebase_guard as guard
        with patch.object(guard, 'git_json', side_effect=[before, after]):
            return guard.economic_values_unchanged('base', 'upstream')

    def test_actual_control_only_update_preserves_all_financial_inputs(self):
        self.assertTrue(self.eligible(economic_fixture('before'), economic_fixture('after')))

    def test_financial_definitions_periods_and_input_sets_are_not_receipts(self):
        before=economic_fixture('before')
        mutations=[
            lambda r:r['savings']['2026-08-01'].__setitem__('rate',9.9),
            lambda r:r['savings']['2026-08-01'].__setitem__('effectiveAt','2026-09-01'),
            lambda r:r['households']['debt'].__setitem__('value',False),
            lambda r:r['households']['debt'].__setitem__('referencePeriod','2026-01'),
            lambda r:r['households']['debt'].__setitem__('population','different population'),
            lambda r:r['households']['debt'].__setitem__('sourceUrl','https://example.invalid/other'),
            lambda r:r['households']['debt'].__setitem__('unit','different unit'),
            lambda r:r['benchmarks']['scpi:2025'].__setitem__('method','different financial convention'),
            lambda r:r['benchmarks']['fonds_euros:2025'].__setitem__('discoveryStatus','new qualification'),
            lambda r:r['households'].__setitem__('new-record',copy.deepcopy(r['households']['debt'])),
            lambda r:r['households'].pop('debt'),
            lambda r:r.__setitem__('schemaVersion',True),
            lambda r:r.__setitem__('schemaVersion',2),
            lambda r:r.__setitem__('unknown-section',{}),
        ]
        for n,mutate in enumerate(mutations):
            with self.subTest(mutation=n):
                after=copy.deepcopy(before);mutate(after)
                self.assertFalse(self.eligible(before,after))

    def test_unqualified_receipts_and_backdated_or_future_checks_fail_closed(self):
        before=economic_fixture('before')
        for field,value in [('checkedAt','2026-10-01'),('checkedAt','2099-01-01'),('checkedAt','not-a-date'),('checkedAt','2026-02-30'),('sha256','invalid')]:
            with self.subTest(field=field,value=value):
                after=copy.deepcopy(before);after['savings']['2026-08-01'][field]=value
                self.assertFalse(self.eligible(before,after))
        invalid=copy.deepcopy(before);invalid['households']['debt']['value']=float('nan')
        with self.assertRaises(ValueError):self.eligible(invalid,copy.deepcopy(invalid))


class SubscriberInputSignatureTests(unittest.TestCase):
    def eligible(self, path, before=None, after=None):
        import observation_rebase_guard as guard
        source=SUBSCRIBER_RACE['inputs'][path]
        with patch.object(guard,'git_json',side_effect=[source['before']if before is None else before,source['after']if after is None else after]):
            return guard.subscriber_test_addition_only('base','upstream',path)

    def test_actual_package_and_browser_additions_are_not_acquisition_changes(self):
        for path in SUBSCRIBER_RACE['inputs']:
            with self.subTest(path=path):self.assertTrue(self.eligible(path))

    def test_dependencies_lifecycle_commands_and_financial_checks_remain_protected(self):
        original=SUBSCRIBER_RACE['inputs']['package.json']['after']
        mutations=[
            lambda r:r.setdefault('dependencies',{}).__setitem__('unqualified','1.0'),
            lambda r:r['scripts'].__setitem__('preinstall','unqualified'),
            lambda r:r['scripts'].__setitem__('build','unqualified'),
            lambda r:r['scripts'].__setitem__('verify:tweet-midi','unqualified'),
            lambda r:r['scripts'].__setitem__('test:dca',r['scripts']['test:dca'].replace('node scripts/test-dca-engine.mjs && ','')),
            lambda r:r['scripts'].__setitem__('test:dca',r['scripts']['test:dca']+' && node scripts/unqualified.mjs'),
            lambda r:r['scripts'].__setitem__('test:dca',r['scripts']['test:dca']+' && node scripts/test-subscriber-profiles.mjs'),
            lambda r:r.__setitem__('private',1),
        ]
        for n,mutate in enumerate(mutations):
            after=copy.deepcopy(original);mutate(after)
            with self.subTest(mutation=n):self.assertFalse(self.eligible('package.json',after=after))

    def test_browser_gate_addition_never_removes_reorders_or_replaces_existing_checks(self):
        original=SUBSCRIBER_RACE['inputs']['scripts/ci-browser-checks.json']['after']
        for after in [original[1:],list(reversed(original)),original+['unknown'],original+[original[-1]],{'checks':original}]:
            with self.subTest(change=str(after)[:50]):self.assertFalse(self.eligible('scripts/ci-browser-checks.json',after=after))

    def test_current_unchanged_values_are_allowed_but_removal_is_not_an_addition(self):
        for path,values in SUBSCRIBER_RACE['inputs'].items():
            self.assertTrue(self.eligible(path,before=values['after']))
            self.assertFalse(self.eligible(path,before=values['after'],after=values['before']))


class ObservationRebaseTests(unittest.TestCase):
    def setUp(self):
        self.f = harness.CommitValidatedData()
        self.f.setUp()
        self.addCleanup(self.f.doCleanups)
        for name in ['src/data/automated-insurance.json', 'src/data/automated-scpi.json',
                     'src/data/automated-etf-monthly.json', 'src/data/worldbank-gold-monthly.json', 'scripts/collect_scpi.py',
                     'docs/editorial-radar-couverture-2026-10-25.md', 'scripts/lib/radar-consumer.mjs',
                     'scripts/lib/radar-publications.mjs', 'scripts/test-radar-coverage.mjs',
                     'scripts/refresh_monthly_history.py', 'scripts/monthly-automation.json',
                     'scripts/collect_etf_pilot.py', 'scripts/etf-pilot.json',
                     '.github/workflows/investment-image-check.yml', 'scripts/test-export-copy.mjs',
                     'scripts/test-investment-emerald.mjs',
                     'src/pages/investment-calculator/editorialArt.js',
                     'src/pages/investment-calculator/imageExport.js',
                     'scripts/playwright-acwi-allocation-recovery.mjs',
                     'scripts/test_metadata_listing_retention.py',
                     'src/data/automated-practical-sheets.json',
                     'public/asset-art/investment-obsidian/gold.webp',
                     'public/data/investors/ackman.json',
                     'public/data/investors/review-metadata.json',
                     'public/data/investors/other.json',
                     'src/pages/hey-grok/App.css',
                     'src/pages/investment-calculator/lib.js', 'src/data/monthly-fx.json',
                     'scripts/source-snapshots/inflation-automated.json',
                     'scripts/collect_presentation_actors.py', 'src/data/inflation-monthly.js',
                     ACTOR_OUTPUT, 'src/data/exposure-etf-expansion-records.json',
                     'src/pages/dca-profiles/catalog.json',
                     'src/pages/dca-profiles/exposures-extra-0.json',
                     'src/pages/dca-profiles/exposures-extra-1.json',
                     'src/pages/dca-profiles/exposures-extra-2.json',
                     'src/pages/dca-profiles/exposures.json',
                     'src/pages/dca-profiles/holdings-14.json',
                     'src/pages/dca-profiles/holdings-28.json',
                     'src/pages/dca-profiles/holdings-8.json',
                     'src/pages/dca-profiles/holdings.json',
                     *CURRENT_REVIEW_OUTPUTS, *PRIVATE_SERVICE_READERS, *BUDGET_EDITORIAL_READERS,
                     *SCPI_ETF_RACE, *ETF_BUDGET_RACE, *SUBSCRIBER_RACE['changedPaths'], 'src/data/freshness-policy.json',
                     'src/pages/budget-profiles/data.js',
                     'src/pages/budget-profiles/lib.js',
                     'src/pages/budget-profiles/unqualified-context.json']:
            p = self.f.local / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('original\n')
        self.f.git(self.f.local, 'add', '.')
        self.f.git(self.f.local, 'commit', '-m', 'producer inputs')
        self.f.git(self.f.local, 'push', 'origin', 'master')
        self.f.git(self.f.other, 'pull', '--ff-only')
        (self.f.local / 'validated.json').write_text('validated update\n')

    def scpi_etf_late_race(self, fail_validation=False):
        script=self.f.root/'validate-scpi-independent-etf-race.py'
        script.write_text(f"""from pathlib import Path
import subprocess
root=Path({str(self.f.root)!r});paths={SCPI_ETF_RACE!r}
counter=root/'scpi-ETF-validation-count'
attempt=int(counter.read_text())+1 if counter.exists()else 1
counter.write_text(str(attempt))
if attempt==1:
    other=root/'other'
    for name in paths:(other/name).write_text('new independent ETF observation\\n')
    for args in [('add',*paths),('commit','-m','actual independent ETF output race'),('push','origin','master')]:
        subprocess.run(['git','-C',str(other),*args],check=True)
else:
    for name in paths:assert Path(name).read_text()=='new independent ETF observation\\n'
    if {fail_validation!r}:raise SystemExit(23)
""")
        return self.publish('scpi',f'{shlex.quote(sys.executable)} {shlex.quote(str(script))}')

    def test_actual_scpi_etf_late_race_preserves_both_writers_and_revalidates(self):
        result=self.scpi_etf_late_race()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertEqual((self.f.root/'scpi-ETF-validation-count').read_text(),'2')
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'validated update')
        for path in SCPI_ETF_RACE:self.assertEqual(self.f.git(self.f.remote,'show','master:'+path),'new independent ETF observation')

    def test_scpi_etf_independence_never_bypasses_failed_combined_validation(self):
        result=self.scpi_etf_late_race(fail_validation=True)
        self.assertEqual(result.returncode,23,result.stdout+result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')

    def test_scpi_etf_outputs_never_hide_changed_scpi_inputs_or_other_files(self):
        for path in ['scripts/collect_scpi.py','src/data/automated-scpi.json','src/data/freshness-policy.json','src/pages/dca-profiles/holdings-32.json','src/pages/dca-profiles/holdings-private.json']:
            with self.subTest(path=path):
                # A separate real Git fixture is required for each refusal.
                f=harness.CommitValidatedData();f.setUp()
                try:
                    target=f.other/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text('changed input')
                    for args in [('add',path),('commit','-m','protected input'),('push','origin','master')]:f.git(f.other,*args)
                    command=f'{shlex.quote(sys.executable)} {shlex.quote(str(GUARD))} --kind scpi --base "$VALIDATED_DATA_ORIGINAL_BASE" --upstream HEAD^'
                    (f.local/'validated.json').write_text('candidate')
                    result=f.publish({'VALIDATED_DATA_CHECK':command})
                    self.assertNotEqual(result.returncode,0)
                    self.assertIn(path,result.stdout+result.stderr)
                finally:f.doCleanups()

    def test_scpi_dca_allowance_does_not_qualify_monthly_acquisition(self):
        self.assert_refused('src/pages/dca-profiles/catalog.json','market')

    def test_dca_view_allowance_does_not_extend_to_other_producers(self):
        self.assert_refused('src/pages/dca-profiles/holdings-16.json','publication')

    def economic_late_race(self, after, fail_validation=False, kind='market'):
        before=economic_fixture('before')
        target=self.f.local/ECONOMIC_PATH
        target.write_text(json.dumps(before))
        self.f.git(self.f.local,'add',ECONOMIC_PATH)
        self.f.git(self.f.local,'commit','-m','original economic acquisition inputs')
        self.f.git(self.f.local,'push','origin','master')
        self.f.git(self.f.other,'pull','--ff-only')
        script=self.f.root/'validate-economic-late-race.py'
        new_text=json.dumps(after)
        script.write_text(f"""from pathlib import Path
import json,subprocess
root=Path({str(self.f.root)!r})
counter=root/'economic-validation-count'
attempt=int(counter.read_text())+1 if counter.exists() else 1
counter.write_text(str(attempt))
if attempt==1:
    other=root/'other'
    (other/{ECONOMIC_PATH!r}).write_text({new_text!r})
    for args in [('add',{ECONOMIC_PATH!r}),('commit','-m','real control-only economic race'),('push','origin','master')]:
        subprocess.run(['git','-C',str(other),*args],check=True)
else:
    assert json.loads(Path({ECONOMIC_PATH!r}).read_text())==json.loads({new_text!r})
    if {fail_validation!r}:raise SystemExit(23)
""")
        return self.publish(kind,f'{shlex.quote(sys.executable)} {shlex.quote(str(script))}')

    def test_actual_economic_late_race_preserves_newer_receipts_and_revalidates(self):
        after=economic_fixture('after')
        result=self.economic_late_race(after)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertEqual((self.f.root/'economic-validation-count').read_text(),'2')
        self.assertEqual(json.loads(self.f.git(self.f.remote,'show','master:'+ECONOMIC_PATH)),after)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'validated update')

    def test_economic_receipts_never_bypass_failed_financial_revalidation(self):
        result=self.economic_late_race(economic_fixture('after'),fail_validation=True)
        self.assertEqual(result.returncode,23,result.stdout+result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')

    def test_a_financial_economic_change_still_requires_recollection(self):
        after=economic_fixture('after');after['savings']['2026-08-01']['rate']+=0.01
        result=self.economic_late_race(after)
        self.assertNotEqual(result.returncode,0)
        self.assertIn(ECONOMIC_PATH,result.stdout+result.stderr)
        self.assertEqual((self.f.root/'economic-validation-count').read_text(),'1')
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')

    def test_economic_qualification_does_not_extend_to_other_producers(self):
        result=self.economic_late_race(economic_fixture('after'),kind='publication')
        self.assertNotEqual(result.returncode,0)
        self.assertIn(ECONOMIC_PATH,result.stdout+result.stderr)

    def publish(self, kind='scpi', validation='test -f validated.json'):
        command = (f'{shlex.quote(sys.executable)} {shlex.quote(str(GUARD))} '
                   f'--kind {kind} --base "$VALIDATED_DATA_ORIGINAL_BASE" --upstream HEAD^ && {validation}')
        return self.f.publish({'VALIDATED_DATA_CHECK': command})

    def test_private_service_race_preserves_both_changes_and_revalidates_latest_tree(self):
        for path in PRIVATE_SERVICE_READERS:
            self.f.advance_remote(path)
        validation = ' && '.join(f'test "$(cat {shlex.quote(path)})" = "concurrent update"' for path in PRIVATE_SERVICE_READERS)
        result = self.publish('market', validation)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        for path in PRIVATE_SERVICE_READERS:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')

    def test_actual_budget_editorial_race_preserves_prose_and_observations(self):
        for path in BUDGET_EDITORIAL_READERS:
            self.f.advance_remote(path)
        validation = ' && '.join(f'test "$(cat {shlex.quote(path)})" = "concurrent update"' for path in BUDGET_EDITORIAL_READERS)
        result = self.publish('market', validation)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        for path in BUDGET_EDITORIAL_READERS:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')

    def test_actual_etf_budget_race_preserves_both_writers_and_revalidates(self):
        for path in ETF_BUDGET_RACE:
            self.f.advance_remote(path)
        validation = ' && '.join(f'test "$(cat {shlex.quote(path)})" = "concurrent update"' for path in ETF_BUDGET_RACE)
        result = self.publish('etf', validation)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        for path in ETF_BUDGET_RACE:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')

    def test_etf_budget_race_never_bypasses_failed_validation(self):
        self.assert_refused(ETF_BUDGET_RACE[-1], 'etf', 'false')

    def test_etf_budget_race_still_refuses_acquisition_input(self):
        for path in ETF_BUDGET_RACE:
            self.f.advance_remote(path)
        self.assert_refused('scripts/collect_etf_pilot.py', 'etf')

    def test_etf_budget_race_still_refuses_its_source_configuration(self):
        self.assert_refused('scripts/etf-pilot.json', 'etf')

    def test_etf_budget_race_does_not_qualify_neighbours_or_other_writers(self):
        import observation_rebase_guard as guard
        self.assertEqual(guard.ETF_BUDGET_READERS, set(ETF_BUDGET_RACE))
        for path in ['src/pages/budget-profiles/data.js', 'src/pages/budget-profiles/lib.js',
                     'src/pages/budget-profiles/unqualified-context.json', 'scripts/unqualified-budget-test.mjs']:
            self.assertNotIn(path, guard.ALLOWED['etf'])
        self.assert_refused('src/pages/budget-profiles/data.js', 'etf')

    def test_etf_budget_race_does_not_extend_to_monthly_or_publication(self):
        import observation_rebase_guard as guard
        for kind in ['market', 'publication']:
            self.assertTrue(set(ETF_BUDGET_RACE).isdisjoint(guard.ALLOWED[kind]))

    def subscriber_late_race(self, kind='market', fail_retry=False, extra_path=None):
        for path,values in SUBSCRIBER_RACE['inputs'].items():
            target=self.f.local/path;target.parent.mkdir(parents=True,exist_ok=True)
            target.write_text(json.dumps(values['before']))
        exports=['scripts/export-monthly-baseline.mjs','scripts/export-equity-candidates.mjs',
                 'scripts/export-monthly-candidates.mjs','scripts/export-etf-pilot-baseline.mjs','scripts/build-automation-targets.mjs']
        for path in exports:(self.f.local/path).write_text('export const acquisition = [];\n')
        self.f.git(self.f.local,'add','package.json','scripts/ci-browser-checks.json',*exports)
        self.f.git(self.f.local,'commit','-m','actual input signatures')
        self.f.git(self.f.local,'push','origin','master')
        self.f.git(self.f.other,'pull','--ff-only')
        script=self.f.root/'validate-subscriber-late-race.py'
        script.write_text(f'''import json,pathlib,subprocess,sys
counter=pathlib.Path({str(self.f.root/'subscriber-validation-count')!r})
attempt=int(counter.read_text())+1 if counter.exists() else 1
counter.write_text(str(attempt))
inputs={SUBSCRIBER_RACE['inputs']!r}
paths={sorted(set(SUBSCRIBER_RACE['changedPaths'])-set(SUBSCRIBER_RACE['inputs']))!r}
if attempt==1:
    other=pathlib.Path({str(self.f.other)!r})
    for name in paths:
        (other/name).write_text('concurrent update\\n')
    for name,values in inputs.items():
        (other/name).write_text(json.dumps(values['after']))
    extra={extra_path!r}
    if extra:
        target=other/extra;target.parent.mkdir(parents=True,exist_ok=True);target.write_text('changed protected input\\n')
    for args in [['add','.'],['commit','-m','subscriber writer during validation'],['push','origin','master']]:
        subprocess.run(['git','-C',str(other),*args],check=True,capture_output=True)
else:
    for name in paths:assert pathlib.Path(name).read_text()=='concurrent update\\n'
    for name,values in inputs.items():assert json.loads(pathlib.Path(name).read_text())==values['after']
    if {fail_retry!r}:sys.exit(1)
''')
        validation=f'{shlex.quote(sys.executable)} {shlex.quote(str(script))}'
        if kind not in ('market','etf'):return self.publish(kind,validation)
        adapter=ROOT/'scripts/market_reader_revalidation.py'
        command=(f'{shlex.quote(sys.executable)} {shlex.quote(str(adapter))} --kind {kind} '
                 f'--base "$VALIDATED_DATA_ORIGINAL_BASE" --upstream HEAD^ && {validation}')
        return self.f.publish({'VALIDATED_DATA_CHECK':command})

    def test_actual_subscriber_race_during_market_validation_revalidates_and_preserves_both_writers(self):
        result=self.subscriber_late_race()
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual((self.f.root/'subscriber-validation-count').read_text(),'2')
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'validated update')
        for path,values in SUBSCRIBER_RACE['inputs'].items():
            self.assertEqual(json.loads(self.f.git(self.f.remote,'show','master:'+path)),values['after'])

    def test_subscriber_race_is_independent_of_etf_acquisition_too(self):
        result=self.subscriber_late_race(kind='etf')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual((self.f.root/'subscriber-validation-count').read_text(),'2')

    def test_subscriber_race_never_publishes_a_failed_second_validation(self):
        result=self.subscriber_late_race(fail_retry=True)
        self.assertNotEqual(result.returncode,0)
        self.assertEqual((self.f.root/'subscriber-validation-count').read_text(),'2')
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')

    def test_subscriber_readers_cannot_hide_changed_collection_inputs(self):
        result=self.subscriber_late_race(extra_path='scripts/monthly-automation.json')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('scripts/monthly-automation.json',result.stderr)
        self.assertEqual((self.f.root/'subscriber-validation-count').read_text(),'1')

    def test_subscriber_readers_do_not_qualify_financial_engines(self):
        result=self.subscriber_late_race(extra_path='src/pages/dca-profiles/engine.js')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('src/pages/dca-profiles/engine.js',result.stderr)

    def test_subscriber_allowance_does_not_extend_to_other_producers(self):
        result=self.subscriber_late_race(kind='publication')
        self.assertNotEqual(result.returncode,0)
        self.assertEqual((self.f.root/'subscriber-validation-count').read_text(),'1')

    def test_budget_editorial_race_never_bypasses_financial_validation(self):
        self.assert_refused(BUDGET_EDITORIAL_READERS[-1], 'market', 'false')

    def test_budget_prose_cannot_hide_changed_monthly_acquisition_inputs(self):
        for path in BUDGET_EDITORIAL_READERS:
            self.f.advance_remote(path)
        self.assert_refused('scripts/monthly-automation.json', 'market')

    def test_budget_allowance_does_not_cover_the_data_module(self):
        self.assert_refused('src/pages/budget-profiles/data.js', 'market')

    def test_budget_allowance_does_not_cover_the_calculation_engine(self):
        self.assert_refused('src/pages/budget-profiles/lib.js', 'market')

    def test_budget_allowance_does_not_cover_neighbouring_configuration(self):
        self.assert_refused('src/pages/budget-profiles/unqualified-context.json', 'market')

    def test_budget_allowance_does_not_extend_to_other_producers(self):
        self.assert_refused(BUDGET_EDITORIAL_READERS[-1], 'publication')

    def test_private_service_race_does_not_bypass_financial_revalidation(self):
        self.assert_refused(PRIVATE_SERVICE_READERS[2], 'market', 'false')

    def test_private_service_change_cannot_hide_changed_acquisition_input(self):
        self.f.advance_remote(PRIVATE_SERVICE_READERS[2])
        self.assert_refused('scripts/monthly-automation.json', 'market')

    def test_private_service_change_does_not_allow_a_directory_or_other_producer(self):
        self.assert_refused('services/tweet-bank-private/unqualified.js', 'market')

    def test_private_service_is_not_assumed_independent_for_unexamined_producers(self):
        self.assert_refused(PRIVATE_SERVICE_READERS[2], 'publication')

    def calendar_race(self, change, path='src/data/automated-etf.json'):
        config = {'series': [{'id': 'copperNav', 'parser': 'official-nav',
                             'isin': 'GB00B15KXQ89', 'calendarRegistry': path}]}
        row = {'productId': 'GB00B15KXQ89', 'currency': 'USD', 'aum': 100,
               'performance': {'currency': 'USD', 'basis': 'NAV',
                               'years': {'2024': 12.3}, 'sourceUrl': 'official',
                               'method': 'reinvested', 'checkedAt': '2026-10-27'}}
        for name, data in [('scripts/monthly-automation.json', config),
                           (path, {'GB00B15KXQ89': row})]:
            (self.f.local / name).write_text(json.dumps(data))
        self.f.git(self.f.local, 'add', path, 'scripts/monthly-automation.json')
        self.f.git(self.f.local, 'commit', '-m', 'calendar acquisition inputs')
        self.f.git(self.f.local, 'push', 'origin', 'master')
        self.f.git(self.f.other, 'pull', '--ff-only')
        change(row)
        (self.f.other / path).write_text(json.dumps({'GB00B15KXQ89': row}))
        self.f.git(self.f.other, 'add', path)
        self.f.git(self.f.other, 'commit', '-m', 'concurrent ETF observation')
        self.f.git(self.f.other, 'push', 'origin', 'master')
        return self.publish('market')

    def test_new_wisdomtree_calendar_registry_aum_does_not_change_acquisition(self):
        result=self.calendar_race(lambda row:row.update(aum=200),'src/data/exposure-etf-expansion-records.json')
        self.assertEqual(result.returncode,0,result.stderr)

    def test_new_wisdomtree_calendar_registry_check_does_not_borrow_a_source_success(self):
        result=self.calendar_race(lambda row:row['performance'].update(checkedAt='2026-10-29'),'src/data/exposure-etf-expansion-records.json')
        self.assertEqual(result.returncode,0,result.stderr)

    def test_new_wisdomtree_calendar_registry_return_change_requires_recollection(self):
        result=self.calendar_race(lambda row:row['performance']['years'].update({'2024':14.3}),'src/data/exposure-etf-expansion-records.json')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('Collection inputs may have changed',result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')

    def test_new_wisdomtree_calendar_registry_currency_change_requires_recollection(self):
        result=self.calendar_race(lambda row:row['performance'].update(currency='EUR'),'src/data/exposure-etf-expansion-records.json')
        self.assertNotEqual(result.returncode,0)
        self.assertIn('Collection inputs may have changed',result.stderr)

    def test_market_aum_only_change_preserves_calendar_receipt(self):
        result = self.calendar_race(lambda row: row.update(aum=200))
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_market_control_date_only_does_not_borrow_new_proof(self):
        result = self.calendar_race(lambda row: row['performance'].update(checkedAt='2026-10-28'))
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_market_changed_used_calendar_requires_recollection(self):
        result = self.calendar_race(lambda row: row['performance']['years'].update({'2024': 14.3}))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Collection inputs may have changed', result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'original')

    def test_market_changed_calendar_convention_requires_recollection(self):
        result = self.calendar_race(lambda row: row['performance'].update(currency='EUR'))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Collection inputs may have changed', result.stderr)

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

    def test_etf_collection_revalidates_after_independent_scpi(self):
        self.f.advance_remote('src/data/automated-scpi.json')
        result=self.publish('etf');self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:src/data/automated-scpi.json'),'concurrent update')

    def test_etf_scpi_race_never_bypasses_failed_financial_revalidation(self):
        self.assert_refused('src/data/automated-scpi.json','etf',validation='false')

    def test_etf_scpi_race_never_allows_competing_etf_observations(self):
        self.f.advance_remote('src/data/automated-scpi.json')
        self.assert_refused('src/data/automated-etf-monthly.json','etf')

    def test_etf_scpi_race_never_allows_changed_source_code(self):
        self.f.advance_remote('src/data/automated-scpi.json')
        self.assert_refused('scripts/collect_scpi.py','etf')

    def test_etf_actor_race_preserves_both_validated_outputs(self):
        self.f.advance_remote(ACTOR_OUTPUT)
        result = self.publish('etf')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + ACTOR_OUTPUT), 'concurrent update')
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')

    def test_etf_actor_race_cannot_bypass_financial_validation(self):
        self.assert_refused(ACTOR_OUTPUT, 'etf', validation='false')

    def test_etf_actor_parser_and_financial_inputs_stay_protected(self):
        self.f.advance_remote(ACTOR_OUTPUT)
        for path in ('scripts/collect_presentation_actors.py', 'src/data/automated-etf-monthly.json',
                     'scripts/monthly-automation.json'):
            with self.subTest(path=path):
                self.assert_refused(path, 'etf')

    def test_index_collection_cannot_reuse_changed_collection_inputs(self):
        self.assert_refused('src/data/automated-etf-monthly.json','indices')

    def test_publication_can_revalidate_after_scpi(self):
        self.f.advance_remote('src/data/automated-scpi.json')
        result = self.publish('publication')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:src/data/automated-scpi.json'), 'concurrent update')

    def assert_inflation_receipt_independent(self,kind):
        self.f.advance_remote('scripts/source-snapshots/inflation-automated.json')
        result=self.publish(kind)
        self.assertEqual(result.returncode,0,result.stderr)

    def test_market_inflation_receipt_is_independent(self):
        self.assert_inflation_receipt_independent('market')

    def test_publication_inflation_receipt_is_independent(self):
        self.assert_inflation_receipt_independent('publication')

    def test_actor_inflation_receipt_is_independent(self):
        self.assert_inflation_receipt_independent('actors')

    def test_actor_independence_never_bypasses_revalidation(self):
        self.assert_refused('scripts/source-snapshots/inflation-automated.json','actors',validation='false')

    def test_actor_exposure_race_preserves_each_independent_output(self):
        paths=['src/data/exposure-etf-expansion-records.json',
               'src/pages/dca-profiles/catalog.json',
               'src/pages/dca-profiles/exposures-extra-0.json',
               'src/pages/dca-profiles/exposures-extra-1.json',
               'src/pages/dca-profiles/exposures-extra-2.json',
               'src/pages/dca-profiles/exposures.json',
               'src/pages/dca-profiles/holdings-14.json',
               'src/pages/dca-profiles/holdings-28.json',
               'src/pages/dca-profiles/holdings-8.json',
               'src/pages/dca-profiles/holdings.json']
        for path in paths:
            with self.subTest(path=path):
                self.f.advance_remote(path)
        result=self.publish('actors')
        self.assertEqual(result.returncode,0,result.stderr)
        for path in paths:
            self.assertEqual(self.f.git(self.f.remote,'show','master:'+path),'concurrent update')
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'validated update')

    def test_actor_exposure_race_never_bypasses_financial_validation(self):
        self.assert_refused('src/pages/dca-profiles/holdings.json','actors',validation='false')

    def test_actor_exception_does_not_extend_to_source_or_other_holdings(self):
        for path in ('src/data/freshness-policy.json','scripts/collect_scpi.py',
                     'scripts/presentation_actors_expansion.py','src/pages/dca-profiles/holdings-15.json'):
            with self.subTest(path=path):self.assert_refused(path,'actors')

    def test_actor_registry_and_parser_and_active_inflation_stay_protected(self):
        for path in (ACTOR_OUTPUT,'scripts/collect_presentation_actors.py','src/data/inflation-monthly.js'):
            with self.subTest(path=path):
                self.assert_refused(path,'actors')

    def test_scpi_actor_race_preserves_both_outputs_after_financial_validation(self):
        self.f.advance_remote(ACTOR_OUTPUT)
        result=self.publish('scpi')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:'+ACTOR_OUTPUT),'concurrent update')
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'validated update')

    def test_scpi_actor_race_cannot_bypass_failed_financial_validation(self):
        self.assert_refused(ACTOR_OUTPUT,'scpi',validation='false')

    def test_scpi_actor_parser_and_own_registry_remain_protected(self):
        for path in ('scripts/collect_presentation_actors.py','src/data/automated-scpi.json','scripts/collect_scpi.py'):
            with self.subTest(path=path):self.assert_refused(path,'scpi')

    def test_publication_active_inflation_and_inputs_remain_protected(self):
        self.assert_refused('src/data/inflation-monthly.js','publication')

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

    def test_etf_gold_race_preserves_gold_and_validated_etf_after_revalidation(self):
        path = 'src/data/worldbank-gold-monthly.json'
        self.f.advance_remote(path)
        result = self.publish('etf', f'test "$(cat {path})" = "concurrent update"')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')

    def test_etf_gold_race_never_bypasses_failed_financial_revalidation(self):
        self.assert_refused('src/data/worldbank-gold-monthly.json', 'etf', validation='false')

    def test_gold_race_does_not_hide_changed_etf_fx(self):
        self.f.advance_remote('src/data/worldbank-gold-monthly.json')
        self.assert_refused('src/data/annual-fx.json', 'etf')

    def test_gold_race_does_not_hide_competing_etf_observations(self):
        self.f.advance_remote('src/data/worldbank-gold-monthly.json')
        self.assert_refused('src/data/automated-etf.json', 'etf')

    def test_gold_race_does_not_hide_changed_etf_collector(self):
        self.f.advance_remote('src/data/worldbank-gold-monthly.json')
        self.assert_refused('scripts/collect_etf_pilot.py', 'etf')

    def test_gold_race_does_not_hide_changed_etf_configuration(self):
        self.f.advance_remote('src/data/worldbank-gold-monthly.json')
        self.assert_refused('scripts/etf-pilot.json', 'etf')

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

    def test_market_radar_readers_rebase_only_with_latest_tree_revalidation(self):
        paths = ['docs/editorial-radar-couverture-2026-10-25.md',
                 'scripts/lib/radar-consumer.mjs', 'scripts/lib/radar-publications.mjs',
                 'scripts/test-radar-coverage.mjs']
        for path in paths:
            self.f.advance_remote(path)
        validation = ' && '.join(f'test "$(cat {shlex.quote(path)})" = "concurrent update"' for path in paths)
        result = self.publish('market', validation)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        for path in paths:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')

    def test_market_reader_change_does_not_bypass_financial_revalidation(self):
        self.f.advance_remote('scripts/lib/radar-consumer.mjs')
        before = self.f.git(self.f.remote, 'rev-parse', 'master')
        result = self.publish('market', 'false')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('Collection inputs may have changed', result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'rev-parse', 'master'), before)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'original')

    def test_image_only_race_preserves_latest_renderer_and_validated_observations(self):
        paths = ['.github/workflows/investment-image-check.yml', 'scripts/test-export-copy.mjs',
                 'scripts/test-investment-emerald.mjs',
                 'src/pages/investment-calculator/editorialArt.js',
                 'src/pages/investment-calculator/imageExport.js']
        for path in paths:
            self.f.advance_remote(path)
        validation = ' && '.join(f'test "$(cat {shlex.quote(path)})" = "concurrent update"' for path in paths)
        result = self.publish('market', validation)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        for path in paths:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')

    def test_current_consumer_and_document_race_revalidates_the_combined_tree(self):
        paths = ['scripts/playwright-acwi-allocation-recovery.mjs',
                 'scripts/test_metadata_listing_retention.py',
                 'src/data/automated-practical-sheets.json',
                 'public/asset-art/investment-obsidian/gold.webp']
        for path in paths:
            self.f.advance_remote(path)
        validation = ' && '.join(f'test "$(cat {shlex.quote(path)})" = "concurrent update"' for path in paths)
        result = self.publish('market', validation)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        for path in paths:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')

    def test_practical_receipts_never_bypass_failed_financial_revalidation(self):
        self.assert_refused('src/data/automated-practical-sheets.json', 'market', 'false')

    def test_practical_independence_is_not_assumed_for_other_collectors(self):
        self.assert_refused('src/data/automated-practical-sheets.json', 'publication')

    def test_consumer_change_does_not_hide_a_changed_acquisition_configuration(self):
        self.f.advance_remote('scripts/test_metadata_listing_retention.py')
        self.assert_refused('scripts/monthly-automation.json', 'market')

    def test_exact_render_asset_does_not_allow_other_public_files(self):
        self.assert_refused('public/asset-art/investment-obsidian/unqualified.webp', 'market')

    def test_image_change_never_bypasses_failed_financial_revalidation(self):
        self.assert_refused('src/pages/investment-calculator/imageExport.js', 'market', 'false')

    def test_image_independence_is_not_assumed_for_other_producers(self):
        self.assert_refused('src/pages/investment-calculator/imageExport.js', 'publication')

    def test_calculator_engine_change_still_requires_market_recollection(self):
        self.assert_refused('src/pages/investment-calculator/lib.js', 'market')

    def test_image_change_does_not_hide_a_concurrent_collection_input_change(self):
        self.f.advance_remote('src/pages/investment-calculator/imageExport.js')
        self.assert_refused('scripts/monthly-automation.json', 'market')

    def test_fx_change_still_requires_market_recollection(self):
        self.assert_refused('src/data/monthly-fx.json', 'market')

    def test_reader_independence_is_not_assumed_for_other_collectors(self):
        self.assert_refused('scripts/lib/radar-consumer.mjs', 'publication')

    def test_actual_13f_and_grok_race_revalidates_combined_tree(self):
        for path in ['public/data/investors/ackman.json','public/data/investors/review-metadata.json','src/pages/hey-grok/App.css']:
            self.f.advance_remote(path)
        result=self.publish('market', "test -f validated.json")
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'validated update')
        for path in ['public/data/investors/ackman.json','public/data/investors/review-metadata.json','src/pages/hey-grok/App.css']:
            self.assertNotEqual(self.f.git(self.f.remote,'show','master:'+path),'original')

    def test_13f_and_grok_changes_never_bypass_failed_revalidation(self):
        self.f.advance_remote('public/data/investors/ackman.json')
        self.assert_refused('src/pages/hey-grok/App.css','market','false')

    def test_13f_and_grok_changes_do_not_hide_changed_fx(self):
        self.f.advance_remote('public/data/investors/ackman.json')
        self.f.advance_remote('src/pages/hey-grok/App.css')
        self.assert_refused('src/data/monthly-fx.json','market')

    def test_no_general_investor_or_other_producer_exception(self):
        self.assert_refused('public/data/investors/other.json','market')

    def test_13f_independence_is_not_assumed_for_other_producers(self):
        self.assert_refused('public/data/investors/ackman.json','publication')

    def test_actual_review_race_preserves_all_changes_and_revalidates(self):
        for path in CURRENT_REVIEW_OUTPUTS:self.f.advance_remote(path)
        validation = ' && '.join(f'test "$(cat {shlex.quote(path)})" = "concurrent update"' for path in CURRENT_REVIEW_OUTPUTS)
        result = self.publish('market', validation)
        self.assertEqual(result.returncode, 0, result.stderr)
        for path in CURRENT_REVIEW_OUTPUTS:
            self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + path), 'concurrent update')

    def test_review_race_does_not_bypass_failed_financial_validation(self):
        self.assert_refused(CURRENT_REVIEW_OUTPUTS[-1], 'market', 'false')

    def test_review_race_does_not_hide_changed_fx(self):
        for path in CURRENT_REVIEW_OUTPUTS:self.f.advance_remote(path)
        self.assert_refused('src/data/monthly-fx.json', 'market')

    def test_review_allowance_is_not_assumed_for_other_producers(self):
        self.assert_refused(CURRENT_REVIEW_OUTPUTS[-1], 'publication')

    def test_other_review_module_is_not_assumed_independent(self):
        self.assert_refused('src/pages/data-review/unqualified-reader.js', 'market')

    def test_actual_actor_race_preserves_new_presentations_and_revalidates(self):
        self.f.advance_remote(ACTOR_OUTPUT)
        result = self.publish('publication', f'test "$(cat {ACTOR_OUTPUT})" = "concurrent update"')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:' + ACTOR_OUTPUT), 'concurrent update')

    def test_actor_race_does_not_bypass_failed_validation(self):
        self.assert_refused(ACTOR_OUTPUT, 'publication', 'false')

    def test_actor_race_does_not_hide_changed_gold_acquisition(self):
        self.f.advance_remote(ACTOR_OUTPUT)
        self.assert_refused('src/data/worldbank-gold-monthly.json', 'publication')

    def test_market_collector_change_still_requires_recollection(self):
        self.assert_refused('scripts/refresh_monthly_history.py', 'market')

    def test_market_configuration_change_still_requires_recollection(self):
        self.assert_refused('scripts/monthly-automation.json', 'market')

    def test_competing_primary_market_observation_still_requires_recollection(self):
        self.assert_refused('src/data/automated-etf-monthly.json', 'market')


class CurrentAcquisitionIndependence(unittest.TestCase):
    def test_subscriber_readers_are_outside_market_etf_and_baseline_acquisition(self):
        import market_reader_revalidation as reader
        self.python_graph(['refresh_monthly_history.py','collect_ranking_sources.py',
                           'qualify_monthly_candidates.py','refresh_qualified_listings.py',
                           'collect_etf_pilot.py','collect_amundi_etf.py','collect_ssga_etf.py',
                           'refresh_additional_etf.py','collect_presentation_performance.py',
                           'collect_annual_fx.py','collect_performance_currency.py','refresh_index_sources.py'],
                          reader.SUBSCRIBER_READERS,match_names=False)
        pending=[ROOT/'scripts'/name for name in ['export-monthly-baseline.mjs','export-equity-candidates.mjs',
                                                 'export-monthly-candidates.mjs','export-etf-pilot-baseline.mjs']]
        seen=set()
        while pending:
            path=pending.pop().resolve()
            if path in seen:continue
            seen.add(path)
            self.assertNotIn(path,[ROOT/name for name in reader.SUBSCRIBER_READERS])
            if path.suffix not in('.js','.mjs'):continue
            text=path.read_text()
            # App.jsx also occurs in unrelated reader comments. The resolved
            # import path above, not that shared basename, identifies the module.
            for name in reader.SUBSCRIBER_READERS:self.assertNotIn(name,text,str(path))
            for relative in re.findall(r"(?:from\s*|import\s*|import\s*\(\s*)['\"](\.[^'\"]+)['\"]",text):pending.append(path.parent/relative)
        self.assertGreater(len(seen),4)

    def test_etf_acquisition_and_baseline_do_not_read_exact_budget_readers(self):
        self.python_graph(['collect_etf_pilot.py', 'collect_amundi_etf.py',
                           'collect_ssga_etf.py', 'refresh_additional_etf.py',
                           'collect_presentation_performance.py', 'collect_annual_fx.py',
                           'collect_performance_currency.py', 'refresh_index_sources.py',
                           'wisdomtree_directory_aum.py'], ETF_BUDGET_RACE, match_names=False)
        pending = [ROOT/'scripts/export-etf-pilot-baseline.mjs'];seen=set()
        while pending:
            path=pending.pop().resolve()
            if path in seen:continue
            seen.add(path)
            self.assertNotIn(path, [ROOT/name for name in ETF_BUDGET_RACE])
            if path.suffix not in ('.js','.mjs'):continue
            text=path.read_text()
            for name in ETF_BUDGET_RACE:self.assertNotIn(pathlib.Path(name).name,text,str(path))
            for relative in re.findall(r"(?:from\s*|import\s*|import\s*\(\s*)['\"](\.[^'\"]+)['\"]",text):pending.append(path.parent/relative)
        self.assertGreater(len(seen),1)

    def python_graph(self, roots, forbidden, match_names=True):
        pending = [ROOT / 'scripts' / name for name in roots]
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:continue
            seen.add(path)
            text = path.read_text()
            for name in forbidden:
                self.assertNotEqual(path, ROOT / name)
                needle = pathlib.Path(name).name if match_names else name
                self.assertIsNone(re.search(r'(?<![\w-])' + re.escape(needle) + r'(?![\w.])', text), str(path) + ': ' + name)
            for node in ast.walk(ast.parse(text)):
                names = [node.module] if isinstance(node, ast.ImportFrom) else [a.name for a in node.names] if isinstance(node, ast.Import) else []
                # The producer wrapper is imported dynamically at entry points.
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == '__import__' and node.args and isinstance(node.args[0], ast.Constant):names.append(node.args[0].value)
                for name in filter(None, names):
                    local = ROOT / 'scripts' / (name.split('.')[0] + '.py')
                    if local.is_file():pending.append(local)
        self.assertGreater(len(seen), len(roots))

    def test_private_service_is_downstream_of_market_acquisition_and_baselines(self):
        self.python_graph(['refresh_monthly_history.py','collect_ranking_sources.py',
                           'qualify_monthly_candidates.py','refresh_qualified_listings.py'],
                          PRIVATE_SERVICE_READERS, match_names=False)
        pending = [ROOT/'scripts'/name for name in ['export-monthly-baseline.mjs','export-equity-candidates.mjs','export-monthly-candidates.mjs']]
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:
                continue
            seen.add(path)
            self.assertNotIn(str(path.relative_to(ROOT)), PRIVATE_SERVICE_READERS)
            if path.suffix not in ('.js','.mjs'):
                continue
            text = path.read_text()
            self.assertNotIn('tweet-bank-private', text, str(path))
            for relative in re.findall(r"(?:from\s*|import\s*|import\s*\(\s*)['\"](\.[^'\"]+)['\"]", text):
                pending.append(path.parent/relative)
        self.assertGreater(len(seen), 50)

    def test_budget_prose_is_not_a_monthly_acquisition_or_baseline_input(self):
        self.python_graph(['refresh_monthly_history.py', 'collect_ranking_sources.py',
                           'qualify_monthly_candidates.py', 'refresh_qualified_listings.py'],
                          BUDGET_EDITORIAL_READERS, match_names=False)
        pending = [ROOT/'scripts'/name for name in ['export-monthly-baseline.mjs',
                   'export-equity-candidates.mjs', 'export-monthly-candidates.mjs']]
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:
                continue
            seen.add(path)
            self.assertNotIn(str(path.relative_to(ROOT)), BUDGET_EDITORIAL_READERS)
            if path.suffix not in ('.js', '.mjs'):
                continue
            text = path.read_text()
            self.assertNotIn('publication-context', text, str(path))
            for relative in re.findall(r"(?:from\s*|import\s*|import\s*\(\s*)['\"](\.[^'\"]+)['\"]", text):
                pending.append(path.parent/relative)
        self.assertGreater(len(seen), 50)

    def test_market_collectors_and_baselines_do_not_read_exact_review_outputs(self):
        self.python_graph(['refresh_monthly_history.py', 'collect_ranking_sources.py',
                           'qualify_monthly_candidates.py', 'refresh_qualified_listings.py'], CURRENT_REVIEW_OUTPUTS)
        pending = [ROOT / 'scripts' / name for name in ['export-monthly-baseline.mjs', 'export-equity-candidates.mjs', 'export-monthly-candidates.mjs']]
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:continue
            seen.add(path)
            self.assertNotIn(str(path.relative_to(ROOT)), CURRENT_REVIEW_OUTPUTS)
            if path.suffix not in ['.js', '.mjs']:continue
            text = path.read_text()
            for name in CURRENT_REVIEW_OUTPUTS:self.assertIsNone(re.search(r'(?<![\w-])' + re.escape(pathlib.Path(name).name) + r'(?![\w.])', text), str(path) + ': ' + name)
            for relative in re.findall(r"(?:from\s*|import\s*|import\s*\(\s*)['\"](\.[^'\"]+)['\"]", text):pending.append(path.parent / relative)

    def test_market_guard_changes_run_its_actual_workflow_and_regressions(self):
        workflow = (ROOT / '.github/workflows/update-market-monthly.yml').read_text()
        for path in ['scripts/observation_rebase_guard.py', 'scripts/test_observation_rebase.py']:
            self.assertEqual(workflow.count("      - '" + path + "'"), 2)
        self.assertIn("run: python -m unittest discover -s scripts -p 'test_observation_rebase.py'", workflow)


    def test_etf_acquisition_graph_does_not_read_actor_output(self):
        self.python_graph(['collect_etf_pilot.py', 'collect_amundi_etf.py',
                           'collect_ssga_etf.py', 'refresh_additional_etf.py',
                           'collect_presentation_performance.py', 'collect_annual_fx.py',
                           'collect_performance_currency.py', 'refresh_index_sources.py'], [ACTOR_OUTPUT])
        pending = [ROOT / 'scripts/export-etf-pilot-baseline.mjs']
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:continue
            seen.add(path)
            self.assertNotEqual(path, ROOT / ACTOR_OUTPUT)
            if path.suffix not in ('.js', '.mjs'):continue
            text = path.read_text()
            self.assertNotIn(pathlib.Path(ACTOR_OUTPUT).name, text, str(path))
            for relative in re.findall(r"(?:from\s*|import\s*|import\s*\(\s*)['\"](\.[^'\"]+)['\"]", text):
                pending.append(path.parent / relative)
        self.assertGreater(len(seen), 1)

    def test_etf_acquisition_and_baseline_do_not_read_monthly_gold(self):
        forbidden = 'src/data/worldbank-gold-monthly.json'
        self.python_graph(['collect_etf_pilot.py', 'collect_amundi_etf.py',
                           'collect_ssga_etf.py', 'refresh_additional_etf.py',
                           'collect_presentation_performance.py', 'collect_annual_fx.py',
                           'collect_performance_currency.py', 'refresh_index_sources.py'], [forbidden])
        pending = [ROOT / 'scripts/export-etf-pilot-baseline.mjs']
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:
                continue
            seen.add(path)
            self.assertNotEqual(path, ROOT / forbidden)
            if path.suffix not in ('.js', '.mjs'):
                continue
            text = path.read_text()
            self.assertNotIn(pathlib.Path(forbidden).name, text, str(path))
            for relative in re.findall(r"(?:from\s*|import\s*|import\s*\(\s*)['\"](\.[^'\"]+)['\"]", text):
                pending.append(path.parent / relative)
        self.assertGreater(len(seen), 1)

    def test_scpi_acquisition_graph_does_not_read_actor_output(self):
        self.python_graph(['collect_scpi.py'],[ACTOR_OUTPUT])

    def test_publication_collectors_do_not_read_actor_presentations(self):
        self.python_graph(['refresh_purchasing_power.py', 'refresh_anniversary_levels.py',
                           'refresh_anniversary_indices.py'], [ACTOR_OUTPUT])

if __name__ == '__main__':
    unittest.main()
