"""Exercise publication order against real Git histories and local HTTP proofs."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import unittest

GUARD = Path(__file__).with_name('check-pages-head.sh').resolve()

class PagesHeadTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name) / 'repo'; self.remote = Path(self.temp.name) / 'origin.git'
        subprocess.run(['git', 'init', '--bare', str(self.remote)], check=True, capture_output=True)
        self.repo.mkdir(); self.git('init', '-b', 'master')
        self.git('config', 'user.name', 'Pages test'); self.git('config', 'user.email', 'pages-test@example.invalid')
        self.git('remote', 'add', 'origin', str(self.remote)); self.git('commit', '--allow-empty', '-m', 'initial')
        self.git('push', 'origin', 'master')
        self.info = {'sha': self.git('rev-parse', 'HEAD')}; self.deployments = []; self.states = {}; self.http_status = 200
        owner = self
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                value = owner.deployments if '/deployments?' in self.path else owner.states.get(self.path, []) if self.path.startswith('/statuses/') else owner.info
                self.send_response(owner.http_status); self.send_header('Content-Type', 'application/json'); self.end_headers()
                self.wfile.write(json.dumps(value).encode())
            def log_message(self, *args): pass
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        self.url = f'http://127.0.0.1:{self.server.server_port}'

    def git(self, *args):
        return subprocess.run(['git', *args], cwd=self.repo, check=True, capture_output=True, text=True).stdout.strip()

    def commit(self, path, value='new'):
        target = self.repo / path; target.parent.mkdir(parents=True, exist_ok=True); target.write_text(value)
        self.git('add', path); self.git('commit', '-m', path); self.git('push', 'origin', 'master')
        return self.git('rev-parse', 'HEAD')

    def guard(self, *args, api=False, code=""):
        output = Path(self.temp.name) / 'outputs'; output.write_text('')
        result = subprocess.run(['bash', str(GUARD), *args], cwd=self.repo,
            env={**os.environ, 'GITHUB_OUTPUT': str(output), 'PAGES_PUBLISHED_URL': self.url+'/build-info.json',
                 'PAGES_CODE_SHA': code, 'GITHUB_REPOSITORY': 'test/repo' if api else '', 'GITHUB_API_URL': self.url, 'GITHUB_TOKEN': 'test-fixture'},
            capture_output=True, text=True)
        return result, output.read_text()

    def test_current_snapshot_and_unchanged_retry(self):
        for _ in range(2):
            result, output = self.guard(); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=true\n')

    def test_new_13f_snapshot_can_publish(self):
        self.commit('public/data/investors/example.json')
        result, output = self.guard(); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=true\n')

    def test_new_data_does_not_starve_validated_code(self):
        built = self.git('rev-parse', 'HEAD'); self.commit('src/data/automated-monthly.json')
        self.git('checkout', '--detach', built)
        result, output = self.guard(); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=true\n')

    def test_new_code_still_supersedes_old_build(self):
        built = self.git('rev-parse', 'HEAD'); self.commit('src/code.js'); self.git('checkout', '--detach', built)
        result, output = self.guard(); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=false\n')
        self.assertIn('Skipping superseded', result.stdout)
        result, output = self.guard('--validation'); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=true\n')

    def test_no_rollback_of_published_code_or_fallback_data(self):
        built = self.git('rev-parse', 'HEAD'); latest = self.commit('src/data/automated-monthly.json')
        self.git('checkout', '--detach', built)
        for info in [{'sha': latest}, {'sha': built, 'dataSha': latest}]:
            self.info = info
            result, output = self.guard(); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=false\n')

    def test_fallback_cannot_replace_a_newer_published_code(self):
        old_code = self.git('rev-parse', 'HEAD')
        published = self.commit('src/new-code.js')
        self.commit('src/data/automated-monthly.json')
        self.info = {'sha': published}
        result, output = self.guard(code=old_code)
        self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=false\n')
        self.info = {'sha': old_code}
        result, output = self.guard(code=old_code)
        self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=true\n')

    def test_shallow_fallback_checkout_fetches_code_history_before_comparing(self):
        code = self.git('rev-parse', 'HEAD')
        self.commit('src/data/automated-monthly.json')
        shallow = Path(self.temp.name) / 'shallow'
        subprocess.run(['git', 'clone', '--depth=1', '--branch=master', self.remote.as_uri(), str(shallow)], check=True, capture_output=True)
        self.repo = shallow
        self.assertEqual(self.git('rev-parse', '--is-shallow-repository'), 'true')
        result, output = self.guard(code=code)
        self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=true\n')

    def test_deployment_api_protects_against_stale_cdn(self):
        built = self.git('rev-parse', 'HEAD'); latest = self.commit('src/data/automated-monthly.json'); self.git('checkout', '--detach', built)
        self.deployments = [{'sha': latest, 'statuses_url': self.url+'/statuses/1'}]
        self.states['/statuses/1'] = [{'state': 'success', 'environment_url': 'https://example.github.io/repo/'}]
        result, output = self.guard(api=True); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=false\n')
        # A skipped deployment is marked success too, but published no page URL.
        self.states['/statuses/1'][0]['environment_url'] = ''
        result, output = self.guard(api=True); self.assertEqual(result.returncode, 0, result.stderr); self.assertEqual(output, 'current=true\n')

    def test_unknown_or_unavailable_publication_fails_closed(self):
        for info in [{}, {'sha': 'bad'}, {'sha': self.info['sha'], 'dataSha': 'bad'}]:
            self.info = info; result, output = self.guard(); self.assertNotEqual(result.returncode, 0); self.assertEqual(output, '')
        self.http_status = 503; result, output = self.guard(); self.assertNotEqual(result.returncode, 0); self.assertEqual(output, '')

    def test_remote_failure_and_missing_master_fail_closed(self):
        subprocess.run(['git', '--git-dir', str(self.remote), 'update-ref', '-d', 'refs/heads/master'], check=True, capture_output=True)
        result, output = self.guard(); self.assertNotEqual(result.returncode, 0); self.assertEqual(output, '')
        self.git('remote', 'set-url', 'origin', str(self.remote)+'-missing')
        result, output = self.guard(); self.assertNotEqual(result.returncode, 0); self.assertEqual(output, '')

if __name__ == '__main__': unittest.main()
