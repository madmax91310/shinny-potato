"""Exercise the production guard against real Git histories, without network."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


GUARD = Path(__file__).with_name('check-pages-head.sh').resolve()


class PagesHeadTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name) / 'repo'
        self.remote = Path(self.temp.name) / 'origin.git'
        subprocess.run(['git', 'init', '--bare', str(self.remote)], check=True, capture_output=True)
        self.repo.mkdir()
        self.git('init', '-b', 'master')
        self.git('config', 'user.name', 'Pages test')
        self.git('config', 'user.email', 'pages-test@example.invalid')
        self.git('remote', 'add', 'origin', str(self.remote))
        self.git('commit', '--allow-empty', '-m', 'initial')
        self.git('push', 'origin', 'master')

    def git(self, *args):
        return subprocess.run(['git', *args], cwd=self.repo, check=True,
                              capture_output=True, text=True).stdout.strip()

    def guard(self):
        output = Path(self.temp.name) / 'outputs'
        output.write_text('')
        result = subprocess.run(['bash', str(GUARD)], cwd=self.repo,
                                env={**os.environ, 'GITHUB_OUTPUT': str(output)},
                                capture_output=True, text=True)
        return result, output.read_text()

    def test_current_snapshot_can_publish_including_unchanged_retry(self):
        for _ in range(2):
            result, output = self.guard()
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(output, 'current=true\n')

    def test_new_13f_commit_can_publish_even_if_caller_started_on_old_sha(self):
        self.git('commit', '--allow-empty', '-m', 'updated 13F')
        self.git('push', 'origin', 'master')
        result, output = self.guard()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, 'current=true\n')

    def test_old_build_cannot_overwrite_new_master_including_late_rerun(self):
        old_sha = self.git('rev-parse', 'HEAD')
        self.git('commit', '--allow-empty', '-m', 'new master includes 13F')
        self.git('push', 'origin', 'master')
        self.git('checkout', '--detach', old_sha)
        result, output = self.guard()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, 'current=false\n')
        self.assertIn('Skipping superseded', result.stdout)

    def test_remote_failure_fails_closed(self):
        self.git('remote', 'set-url', 'origin', str(self.remote) + '-missing')
        result, output = self.guard()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(output, '')

    def test_missing_master_fails_closed(self):
        subprocess.run(['git', '--git-dir', str(self.remote), 'update-ref', '-d',
                        'refs/heads/master'], check=True, capture_output=True)
        result, output = self.guard()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(output, '')


if __name__ == '__main__':
    unittest.main()
