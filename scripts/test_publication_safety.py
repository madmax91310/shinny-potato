"""Exercise the real Pages order guard without a network or local HTTP server."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

GUARD = Path(__file__).with_name('check-pages-head.mjs').resolve()


class FallbackPublicationOrder(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.remote = self.root / 'origin.git'
        self.repo = self.root / 'repo'
        self.repo.mkdir()
        self.run_git('init', '--bare', '--initial-branch=master', str(self.remote))
        self.run_git('init', '-b', 'master')
        self.run_git('config', 'user.email', 'order@example.invalid')
        self.run_git('config', 'user.name', 'Order test')
        self.run_git('remote', 'add', 'origin', str(self.remote))
        self.old_code = self.commit('src/code.js', 'published old code')
        self.new_code = self.commit('src/code.js', 'published newer code')
        self.data = self.commit('src/data/active.json', '{"value":2}')
        self.mock = self.root / 'fetch.mjs'
        self.mock.write_text('globalThis.fetch = async () => new Response(process.env.AUDIT_PUBLISHED_INFO, {status:200});\n')

    def run_git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.repo, stderr=subprocess.PIPE, text=True).strip()

    def commit(self, name, content):
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        self.run_git('add', name)
        self.run_git('commit', '-m', name)
        self.run_git('push', 'origin', 'master')
        return self.run_git('rev-parse', 'HEAD')

    def guard(self, code, published=None, fallback=True):
        output = self.root / 'output'
        output.write_text('')
        result = subprocess.run(['node', '--import', str(self.mock), str(GUARD)], cwd=self.repo,
            env={**os.environ, 'GITHUB_REPOSITORY': '', 'GITHUB_OUTPUT': str(output),
                 'PAGES_PUBLISHED_URL': 'https://fixture.invalid/build-info.json',
                 'PAGES_CODE_SHA': code, 'PAGES_FALLBACK': 'true' if fallback else '',
                 'AUDIT_PUBLISHED_INFO': json.dumps(published or {'sha': self.new_code})},
            capture_output=True, text=True)
        return result, output.read_text()

    def test_missing_fallback_code_never_authorizes_publication(self):
        result, output = self.guard('')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('exact built code identity', result.stderr)
        self.assertEqual(output, '')

    def test_old_code_with_new_data_cannot_replace_newer_published_code(self):
        result, output = self.guard(self.old_code)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, 'current=false\n')

    def test_unchanged_published_code_can_receive_fresh_data(self):
        result, output = self.guard(self.old_code, {'sha': self.old_code})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, 'current=true\n')

    def test_normal_publication_keeps_default_code_identity(self):
        result, output = self.guard('', fallback=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, 'current=true\n')


if __name__ == '__main__':
    unittest.main()
