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
                     'src/pages/investment-calculator/lib.js', 'src/data/monthly-fx.json']:
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

    def test_market_collector_change_still_requires_recollection(self):
        self.assert_refused('scripts/refresh_monthly_history.py', 'market')

    def test_market_configuration_change_still_requires_recollection(self):
        self.assert_refused('scripts/monthly-automation.json', 'market')

    def test_competing_primary_market_observation_still_requires_recollection(self):
        self.assert_refused('src/data/automated-etf-monthly.json', 'market')


if __name__ == '__main__':
    unittest.main()
