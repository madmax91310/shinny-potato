"""Replay scheduled43727084478 without weakening calendar or push guards."""
import copy
import json
from pathlib import Path
import shlex
import sys
import unittest
import test_validated_data_commit as harness

ROOT = Path(__file__).resolve().parents[1]
RACE = json.loads((ROOT/'scripts/fixtures/publication-exposure-race-20261115.json').read_text())


class PublicationExposureRace(unittest.TestCase):
    def setUp(self):
        self.f = harness.CommitValidatedData()
        self.f.setUp()
        self.addCleanup(self.f.doCleanups)
        self.config = {'series': [{'id': 'etfIE00BDVPNG13Nav', 'isin': RACE['controlledIsin'],
                                  'parser': 'official-nav', 'calendarRegistry': RACE['registry']}]}
        self.write(self.f.local, 'scripts/monthly-automation.json', self.config)
        for path in RACE['changedPaths']:
            self.write(self.f.local, path, RACE['before'] if path == RACE['registry'] else {'version': 'before'})
        self.f.git(self.f.local, 'add', '.')
        self.f.git(self.f.local, 'commit', '-m', 'recorded collection inputs')
        self.f.git(self.f.local, 'push', 'origin', 'master')
        self.f.git(self.f.other, 'pull', '--ff-only')
        (self.f.local/'validated.json').write_text('validated update\n')

    def write(self, root, path, value):
        target = root/path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(value))

    def publish(self, mutate=None, validation='test -f validated.json', extra=None):
        registry = copy.deepcopy(RACE['after'])
        if mutate:
            mutate(registry[RACE['controlledIsin']])
        # Even a harmless top-ten change must not exempt the used calendar.
        registry[RACE['controlledIsin']]['holdings'] = {'scope': 'partial', 'rows': []}
        for path in RACE['changedPaths']:
            self.write(self.f.other, path, registry if path == RACE['registry'] else {'version': 'newer exposure'})
        if extra:
            self.write(self.f.other, extra, {'unqualified': True})
        self.f.git(self.f.other, 'add', '.')
        self.f.git(self.f.other, 'commit', '-m', 'concurrent exposure publication')
        self.f.git(self.f.other, 'push', 'origin', 'master')
        command = (f'{shlex.quote(sys.executable)} {shlex.quote(str(ROOT/"scripts/observation_rebase_guard.py"))}'
                   f' --kind publication --base "$VALIDATED_DATA_ORIGINAL_BASE" --upstream HEAD^ && {validation}')
        return self.f.publish({'VALIDATED_DATA_CHECK': command})

    def test_actual_paths_preserve_newer_exposures_and_original_observations(self):
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'validated update')
        for path in RACE['changedPaths'][1:]:
            self.assertEqual(json.loads(self.f.git(self.f.remote, 'show', 'master:'+path)), {'version': 'newer exposure'})
        self.assertEqual(json.loads((self.f.local/RACE['registry']).read_text()), RACE['before'])

    def test_failed_financial_revalidation_does_not_publish(self):
        result = self.publish(validation='false')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.f.git(self.f.remote, 'show', 'master:validated.json'), 'original')

    def test_changed_used_calendar_remains_blocked(self):
        result = self.publish(mutate=lambda r: r['performance']['years'].__setitem__('2025', 999))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('recollect from master', result.stderr)

    def test_changed_share_identity_remains_blocked(self):
        result = self.publish(mutate=lambda r: r.__setitem__('productId', 'another-share'))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('recollect from master', result.stderr)

    def test_unexamined_neighbour_and_collector_code_remain_blocked(self):
        for path in ('src/pages/dca-profiles/holdings-31.json', 'scripts/refresh_anniversary_levels.py'):
            with self.subTest(path=path):
                result = self.publish(extra=path)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('recollect from master', result.stderr)


if __name__ == '__main__':
    unittest.main()
