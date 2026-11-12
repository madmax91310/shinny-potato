"""Exercise setup failures with fake tools: no APT/network or publication."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'scripts/ensure-ci-runtime.sh'

MOCK = r'''
import json, os, pathlib, sys
name = pathlib.Path(sys.argv[0]).name
root = pathlib.Path(os.environ['MOCK_ROOT'])
args = sys.argv[1:]
with (root/'calls').open('a') as f: f.write(json.dumps([name, *args])+'\n')
if name == 'timeout': os.execvp(args[1], args[1:])
if name == 'sleep': sys.exit(0)
if name in ('pdftotext', 'pdfinfo'):
    sys.exit(0 if os.environ.get('PDF_READY') == '1' or (root/'pdf-installed').exists() else 1)
if name == 'sudo':
    if args[-1] == 'update': sys.exit(int(os.environ.get('APT_UPDATE_STATUS', '0')))
    if os.environ.get('APT_INSTALL_STATUS'): sys.exit(int(os.environ['APT_INSTALL_STATUS']))
    if os.environ.get('PDF_BROKEN_AFTER_INSTALL') != '1': (root/'pdf-installed').touch()
    sys.exit(0)
if name == 'npx':
    if 'install-deps' in args:
        count = root/'deps-count'
        n = int(count.read_text()) if count.exists() else 0
        count.write_text(str(n+1))
        statuses = os.environ.get('DEPS_STATUSES', '0').split(',')
        sys.exit(int(statuses[min(n,len(statuses)-1)]))
    sys.exit(int(os.environ.get('DOWNLOAD_STATUS', '0')))
if name == 'node':
    sys.stdin.read()
    count = root/'probe-count'
    n = int(count.read_text()) if count.exists() else 0
    count.write_text(str(n+1))
    statuses = os.environ.get('PROBE_STATUSES', '0').split(',')
    sys.exit(int(statuses[min(n,len(statuses)-1)]))
sys.exit(99)
'''


class RuntimeSetupTests(unittest.TestCase):
    def run_helper(self, mode, *, real_node=False, **settings):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            for name in ('pdftotext', 'pdfinfo', 'sudo', 'npx', 'node', 'timeout', 'sleep'):
                tool = folder / name
                tool.write_text('#!' + sys.executable + '\n' + MOCK)
                tool.chmod(0o755)
            if real_node:
                (folder/'node').unlink()
                (folder/'node').symlink_to(shutil.which('node'))
                (folder/'package.json').write_text('{}')
                module = folder/'node_modules/playwright'
                module.mkdir(parents=True)
                # Exercise the embedded JavaScript, including working-snapshot
                # module resolution and dependency-error classification.
                (module/'index.js').write_text('''
const fs = require('node:fs')
module.exports.chromium = {launch: async () => {
 const marker = process.env.MOCK_ROOT + '/launched'
 if (!fs.existsSync(marker)) {
  fs.writeFileSync(marker, '')
  if (process.env.LAUNCH_ERROR) throw Error(process.env.LAUNCH_ERROR)
 }
 return {newPage: async () => ({setContent: async () => {},
  textContent: async () => 'CI browser runtime'}), close: async () => {}}
}}
''')
            # The publisher must retain the setup helper when composition checks
            # out an older tree. Execute exactly that copied-file arrangement.
            copied = folder / 'preserved-runtime.sh'
            shutil.copyfile(HELPER, copied)
            env = {**os.environ, **settings, 'MOCK_ROOT': tmp, 'PATH': tmp + ':' + os.environ['PATH']}
            result = subprocess.run(['bash', str(copied), mode], env=env, cwd=tmp,
                                    capture_output=True, text=True, timeout=10)
            import json
            calls = [json.loads(line) for line in (folder/'calls').read_text().splitlines()] if (folder/'calls').exists() else []
            return result.returncode, calls

    def test_working_pdf_tools_never_contact_apt(self):
        status, calls = self.run_helper('poppler', PDF_READY='1')
        self.assertEqual(status, 0)
        self.assertFalse(any(c[0] == 'sudo' for c in calls))

    def test_missing_pdf_tools_are_installed_and_verified(self):
        status, calls = self.run_helper('poppler')
        self.assertEqual(status, 0)
        apt = [c for c in calls if c[0] == 'sudo']
        self.assertEqual(len(apt), 2)
        self.assertIn('APT::Update::Error-Mode=any', apt[0])
        self.assertTrue(all('Acquire::Retries=2' in c for c in apt))
        self.assertEqual(calls[-1][0], 'pdfinfo')

    def test_apt_failures_stop_setup(self):
        for setting in ('APT_UPDATE_STATUS', 'APT_INSTALL_STATUS'):
            with self.subTest(setting=setting):
                status, calls = self.run_helper('poppler', **{setting: '100'})
                self.assertEqual(status, 100)
                if setting == 'APT_UPDATE_STATUS':
                    self.assertFalse(any('install' in c for c in calls))

    def test_successful_package_install_does_not_hide_broken_tools(self):
        self.assertNotEqual(self.run_helper('poppler', PDF_BROKEN_AFTER_INSTALL='1')[0], 0)

    def test_working_chromium_never_installs_system_dependencies(self):
        status, calls = self.run_helper('chromium')
        self.assertEqual(status, 0)
        self.assertIn(['npx', '--no-install', 'playwright', 'install', 'chromium'], calls)
        self.assertFalse(any('install-deps' in c for c in calls))

    def test_browser_download_failure_is_not_hidden(self):
        status, calls = self.run_helper('chromium', DOWNLOAD_STATUS='7')
        self.assertEqual(status, 7)
        self.assertFalse(any(c[0] == 'node' or 'install-deps' in c for c in calls))

    def test_missing_libraries_trigger_bounded_repair_and_new_probe(self):
        status, calls = self.run_helper('chromium', PROBE_STATUSES='78,0', DEPS_STATUSES='100,0')
        self.assertEqual(status, 0)
        self.assertEqual(sum(c[0] == 'npx' and 'install-deps' in c for c in calls), 2)
        self.assertEqual(sum(c[0] == 'node' for c in calls), 2)

    def test_permanent_dns_failure_stops_after_two_attempts(self):
        status, calls = self.run_helper('chromium', PROBE_STATUSES='78', DEPS_STATUSES='100')
        self.assertNotEqual(status, 0)
        self.assertEqual(sum(c[0] == 'npx' and 'install-deps' in c for c in calls), 2)
        self.assertEqual(sum(c[0] == 'node' for c in calls), 1)

    def test_non_dependency_browser_failure_does_not_install_packages(self):
        status, calls = self.run_helper('chromium', PROBE_STATUSES='1')
        self.assertEqual(status, 1)
        self.assertFalse(any('install-deps' in c for c in calls))

    def test_repaired_dependencies_do_not_hide_launch_failure(self):
        self.assertEqual(self.run_helper('chromium', PROBE_STATUSES='78,1')[0], 1)

    def test_unknown_mode_is_an_error(self):
        self.assertEqual(self.run_helper('unknown')[0], 2)

    def test_real_probe_repairs_only_recognized_dependency_errors(self):
        for message in ('Host system is missing dependencies to run browsers.',
                        'error while loading shared libraries: libExample.so',
                        'Sandbox permission denied'):
            with self.subTest(message=message):
                status, calls = self.run_helper('chromium', real_node=True, LAUNCH_ERROR=message)
                repaired = any(c[0] == 'npx' and 'install-deps' in c for c in calls)
                self.assertEqual(repaired, message != 'Sandbox permission denied')
                self.assertEqual(status, 1 if message == 'Sandbox permission denied' else 0)


if __name__ == '__main__':
    unittest.main()
