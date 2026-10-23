"""Real Git regression tests: dirty generators, concurrent writers, conflicts."""
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
import textwrap
import unittest

SCRIPT = Path(__file__).with_name('commit-validated-data.sh').resolve()

class CommitValidatedData(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.remote = self.root / 'remote.git'
        self.local = self.root / 'local'
        self.other = self.root / 'other'
        self.git(self.root, 'init', '--bare', '--initial-branch=master', str(self.remote))
        self.git(self.root, 'clone', str(self.remote), str(self.local))
        self.configure(self.local)
        for name in ('validated.json', 'generated.json', 'other.txt'):
            (self.local / name).write_text('original\n')
        self.git(self.local, 'add', '.')
        self.git(self.local, 'commit', '-m', 'base')
        self.git(self.local, 'push', 'origin', 'master')
        self.git(self.root, 'clone', str(self.remote), str(self.other))
        self.configure(self.other)

    def git(self, cwd, *args):
        return subprocess.check_output(['git', '-C', str(cwd), *args], stderr=subprocess.PIPE, text=True).strip()

    def configure(self, path):
        self.git(path, 'config', 'user.name', 'Test')
        self.git(path, 'config', 'user.email', 'test@example.com')

    def publish(self, extra_env=None):
        return subprocess.run(['bash', str(SCRIPT), 'validated update', 'validated.json'], cwd=self.local,
            env={**os.environ, 'GITHUB_OUTPUT': str(self.root / 'output'), **(extra_env or {})}, capture_output=True, text=True)

    def advance_remote(self, name):
        (self.other / name).write_text('concurrent update\n')
        self.git(self.other, 'add', name)
        self.git(self.other, 'commit', '-m', 'concurrent')
        self.git(self.other, 'push', 'origin', 'master')

    def racing_validation(self, conflict=False, fail_retry=False):
        """Advance the remote after fetch, while validation dirties its checkout."""
        script = self.root / 'validate-race.py'
        script.write_text(textwrap.dedent(f'''\
            from pathlib import Path
            import os
            import subprocess
            root = Path({str(self.root)!r})
            assert os.environ['VALIDATED_DATA_ORIGINAL_BASE'] == {self.git(self.local, 'rev-parse', 'HEAD')!r}
            counter = root / 'validation-count'
            attempt = int(counter.read_text()) + 1 if counter.exists() else 1
            counter.write_text(str(attempt))
            Path('generated.json').write_text('temporary validation output\\n')
            if attempt == 1:
                other = root / 'other'
                target = {'validated.json' if conflict else 'other.txt'!r}
                (other / target).write_text('concurrent update\\n')
                for args in [('add', target), ('commit', '-m', 'racing writer'), ('push', 'origin', 'master')]:
                    subprocess.run(['git', '-C', str(other), *args], check=True)
            elif {fail_retry!r}:
                raise SystemExit(23)
            else:
                assert Path('other.txt').read_text() == 'concurrent update\\n'
            '''))
        return f'{shlex.quote(sys.executable)} {shlex.quote(str(script))}'

    def test_retry_after_rejection_discards_only_private_validation_outputs(self):
        (self.local / 'validated.json').write_text('validated update\n')
        (self.local / 'generated.json').write_text('caller staged output\n')
        self.git(self.local, 'add', 'generated.json')
        before_index = (self.local / '.git/index').read_bytes()
        before_head = self.git(self.local, 'rev-parse', 'HEAD')
        result = self.publish({'VALIDATED_DATA_CHECK': self.racing_validation()})
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual((self.root / 'validation-count').read_text(), '2')
        self.assertEqual(self.git(self.remote, 'show', 'master:validated.json'), 'validated update')
        self.assertEqual(self.git(self.remote, 'show', 'master:other.txt'), 'concurrent update')
        self.assertEqual(self.git(self.remote, 'show', 'master:generated.json'), 'original')
        self.assertEqual(self.git(self.local, 'rev-parse', 'HEAD'), before_head)
        self.assertEqual((self.local / '.git/index').read_bytes(), before_index)
        self.assertEqual((self.local / 'generated.json').read_text(), 'caller staged output\n')
        self.assertEqual((self.local / 'validated.json').read_text(), 'validated update\n')

    def test_retry_does_not_resolve_a_racing_data_conflict(self):
        (self.local / 'validated.json').write_text('validated update\n')
        result = self.publish({'VALIDATED_DATA_CHECK': self.racing_validation(conflict=True)})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('CONFLICT', result.stdout + result.stderr)
        self.assertEqual((self.root / 'validation-count').read_text(), '1')
        self.assertEqual(self.git(self.remote, 'show', 'master:validated.json'), 'concurrent update')
        self.assertEqual((self.local / 'validated.json').read_text(), 'validated update\n')
        self.assertFalse((self.root / 'output').exists())

    def test_retry_runs_financial_revalidation_and_propagates_failure(self):
        (self.local / 'validated.json').write_text('validated update\n')
        result = self.publish({'VALIDATED_DATA_CHECK': self.racing_validation(fail_retry=True)})
        self.assertEqual(result.returncode, 23, result.stdout + result.stderr)
        self.assertEqual((self.root / 'validation-count').read_text(), '2')
        self.assertEqual(self.git(self.remote, 'show', 'master:validated.json'), 'original')
        self.assertEqual(self.git(self.remote, 'show', 'master:other.txt'), 'concurrent update')
        self.assertFalse((self.root / 'output').exists())

    def test_dirty_files_and_index_preserved_with_concurrent_remote(self):
        (self.local / 'validated.json').write_text('validated update\n')
        (self.local / 'generated.json').write_text('generated but not validated\n')
        self.git(self.local, 'add', 'generated.json')
        before = self.git(self.local, 'diff', '--cached')
        self.advance_remote('other.txt')
        result = self.publish({'VALIDATED_DATA_CHECK': 'test -f validated.json && test -f other.txt'})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.git(self.remote, 'show', 'master:validated.json'), 'validated update')
        self.assertEqual(self.git(self.remote, 'show', 'master:generated.json'), 'original')
        self.assertEqual(self.git(self.remote, 'show', 'master:other.txt'), 'concurrent update')
        self.assertEqual(self.git(self.local, 'diff', '--cached'), before)
        self.assertEqual((self.local / 'generated.json').read_text(), 'generated but not validated\n')
        self.assertEqual(dict(line.split('=',1) for line in (self.root / 'output').read_text().splitlines()), {'commit_sha':self.git(self.remote, 'rev-parse', 'master'),'changed':'true'})

    def test_conflict_never_overwrites_remote_or_local(self):
        (self.local / 'validated.json').write_text('local update\n')
        self.advance_remote('validated.json')
        head = self.git(self.remote, 'rev-parse', 'master')
        self.assertNotEqual(self.publish().returncode, 0)
        self.assertEqual(self.git(self.remote, 'rev-parse', 'master'), head)
        self.assertEqual((self.local / 'validated.json').read_text(), 'local update\n')
        self.assertFalse((self.root / 'output').exists())

    def test_rebased_validation_failure_never_publishes(self):
        (self.local / 'validated.json').write_text('local update\n')
        self.advance_remote('other.txt')
        head = self.git(self.remote, 'rev-parse', 'master')
        result = self.publish({'VALIDATED_DATA_CHECK': 'test "$(cat other.txt)" = original'})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.git(self.remote, 'rev-parse', 'master'), head)
        self.assertFalse((self.root / 'output').exists())

    def test_changed_inputs_require_explicit_revalidation(self):
        (self.local / 'validated.json').write_text('derived from original other.txt\n')
        self.advance_remote('other.txt')
        head = self.git(self.remote, 'rev-parse', 'master')
        result = self.publish()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Remote inputs changed after collection', result.stderr)
        self.assertEqual(self.git(self.remote, 'rev-parse', 'master'), head)
        self.assertEqual(self.git(self.remote, 'show', 'master:validated.json'), 'original')
        self.assertFalse((self.root / 'output').exists())

    def test_no_change_does_not_publish_generated_files(self):
        head = self.git(self.remote, 'rev-parse', 'master')
        (self.local / 'generated.json').write_text('generated\n')
        self.assertEqual(self.publish().returncode, 0)
        self.assertEqual(self.git(self.remote, 'rev-parse', 'master'), head)
        self.assertIn('changed=false', (self.root / 'output').read_text())

if __name__ == '__main__':
    unittest.main()

