"""Real isolated Git races: only independent financial publications may rebase."""
import pathlib
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
                     ACTOR_OUTPUT, *CURRENT_REVIEW_OUTPUTS]:
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
    def python_graph(self, roots, forbidden):
        pending = [ROOT / 'scripts' / name for name in roots]
        seen = set()
        while pending:
            path = pending.pop().resolve()
            if path in seen:continue
            seen.add(path)
            text = path.read_text()
            for name in forbidden:
                self.assertNotEqual(path, ROOT / name)
                self.assertIsNone(re.search(r'(?<![\w-])' + re.escape(pathlib.Path(name).name) + r'(?![\w.])', text), str(path) + ': ' + name)
            for node in ast.walk(ast.parse(text)):
                names = [node.module] if isinstance(node, ast.ImportFrom) else [a.name for a in node.names] if isinstance(node, ast.Import) else []
                # The producer wrapper is imported dynamically at entry points.
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == '__import__' and node.args and isinstance(node.args[0], ast.Constant):names.append(node.args[0].value)
                for name in filter(None, names):
                    local = ROOT / 'scripts' / (name.split('.')[0] + '.py')
                    if local.is_file():pending.append(local)
        self.assertGreater(len(seen), len(roots))

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

    def test_scpi_acquisition_graph_does_not_read_actor_output(self):
        self.python_graph(['collect_scpi.py'],[ACTOR_OUTPUT])

    def test_publication_collectors_do_not_read_actor_presentations(self):
        self.python_graph(['refresh_purchasing_power.py', 'refresh_anniversary_levels.py',
                           'refresh_anniversary_indices.py'], [ACTOR_OUTPUT])

if __name__ == '__main__':
    unittest.main()
