"""Prevent the actual monthly/anniversary shared-file race43734795200."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SharedAnniversaryWriterLock(unittest.TestCase):
    def test_market_and_anniversary_lock_the_same_production_writer_before_checkout(self):
        workflows = [ROOT/'.github/workflows'/name for name in
                     ('update-market-monthly.yml', 'update-publication-observations.yml')]
        groups = []
        for path in workflows:
            text = path.read_text()
            refresh = text.split('  refresh:\n', 1)[1]
            if path.name == 'update-market-monthly.yml':
                caller = refresh.split('\n  deploy:', 1)[0]
                self.assertIn('uses: ./.github/workflows/validate-record-market-monthly.yml', caller)
                lock = caller.split('    uses:', 1)[0]
                steps = path.with_name('validate-record-market-monthly.yml').read_text()
                self.assertIn('needs: [refresh, tweet-midi]', steps)
                self.assertIn("needs.tweet-midi.result == 'success'", steps)
                steps += path.with_name('monthly-market-publication-paths.json').read_text()
            else:
                lock, steps = refresh.split('    steps:\n', 1)
            self.assertIn('src/data/anniversary-levels.json', steps)
            self.assertIn('actions/checkout@', steps)
            self.assertRegex(lock, r'(?m)^    concurrency:$')
            self.assertRegex(lock, r'(?m)^      cancel-in-progress: false$')
            self.assertRegex(lock, r'(?m)^      queue: max$')
            groups.append(re.search(r'(?m)^      group: (.+)$', lock).group(1))
        self.assertEqual(groups[0], groups[1])
        self.assertIn('active-market-data-', groups[0])
        self.assertIn("format('{0}-{1}', github.workflow, github.ref)", groups[0])
        self.assertIn("|| 'production'", groups[0])


if __name__ == '__main__':
    unittest.main()
