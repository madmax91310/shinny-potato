import base64
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import automation_status_git as transport
from automation_recovery import persist_and_dispatch
from automation_status_storage import encode_status


class StatusGitTransport(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.remote, self.repo = root / 'remote.git', root / 'checkout'
        self.run_git(root, 'init', '--bare', str(self.remote))
        self.run_git(root, 'clone', str(self.remote), str(self.repo))
        self.run_git(self.repo, 'config', 'user.name', 'Fixture')
        self.run_git(self.repo, 'config', 'user.email', 'fixture@example.invalid')
        self.run_git(self.repo, 'checkout', '-b', 'automation-status')
        (self.repo / 'automation-status.json').write_text('{"old":true}\n')
        (self.repo / 'other.txt').write_text('preserve this file\n')
        self.run_git(self.repo, 'add', '.')
        self.run_git(self.repo, 'commit', '-m', 'Initial fixture')
        self.run_git(self.repo, 'push', 'origin', 'automation-status')
        self.original = self.run_git(self.repo, 'rev-parse', 'HEAD:automation-status.json')
        self.checkout_head = self.run_git(self.repo, 'rev-parse', 'HEAD')
        self.index = (self.repo / '.git/index').read_bytes()

    def run_git(self, cwd, *args, input=None):
        return subprocess.run(['git', *args], cwd=cwd, input=input, check=True,
                              capture_output=True).stdout.decode().strip()

    def payload(self, state=None, sha=None):
        # UTF-8, incidents, dates and proof scopes must survive byte for byte.
        state = state if state is not None else {'incidents': [{'id': 'source:or', 'date': '2026-10-23'}],
                    'proof': {'expectedIds': ['exact-share'], 'attemptedIds': []}, 'archive': 'é' * 600000}
        return {'branch': 'automation-status', 'message': 'Persist fixture',
                'sha': self.original if sha is None else sha, 'content': encode_status(state)}

    def remote_json(self):
        return json.loads(self.run_git(self.repo, '--git-dir=' + str(self.remote),
                                      'show', 'automation-status:automation-status.json'))

    def test_large_write_preserves_bytes_other_files_source_branch_and_index(self):
        payload = self.payload()
        result = transport.write_status(lambda *args: self.fail('No large Contents API request'),
                                        'automation-status.json', payload, repo=self.repo)
        actual = subprocess.run(['git', '--git-dir=' + str(self.remote), 'show',
                                 'automation-status:automation-status.json'], check=True, capture_output=True).stdout
        self.assertEqual(actual, base64.b64decode(payload['content']))
        self.assertEqual(result['content']['sha'], self.run_git(self.repo, '--git-dir=' + str(self.remote), 'rev-parse', 'automation-status:automation-status.json'))
        self.assertEqual(self.run_git(self.repo, '--git-dir=' + str(self.remote), 'show', 'automation-status:other.txt'), 'preserve this file')
        self.assertEqual(self.run_git(self.repo, 'rev-parse', 'HEAD'), self.checkout_head)
        self.assertEqual((self.repo / '.git/index').read_bytes(), self.index)

    def test_old_observation_cannot_overwrite_new_status(self):
        payload = self.payload()
        transport.write_status(None, 'automation-status.json', payload, repo=self.repo)
        with self.assertRaisesRegex(ValueError, 'status changed'):
            transport.write_status(None, 'automation-status.json', payload, repo=self.repo)
        self.assertEqual(self.remote_json()['incidents'][0]['date'], '2026-10-23')

    def test_concurrent_advance_is_refused_without_force_or_dispatch(self):
        real_run = subprocess.run
        pushed = []

        def concurrent(command, **kwargs):
            if command[:2] == ['git', 'push']:
                pushed.append(command)
                head = self.run_git(self.repo, '--git-dir=' + str(self.remote), 'rev-parse', 'automation-status')
                tree = self.run_git(self.repo, '--git-dir=' + str(self.remote), 'rev-parse', head + '^{tree}')
                other = self.run_git(self.repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                                     'commit-tree', tree, '-p', head, input=b'Concurrent fixture\n')
                # Copy the concurrent commit into the remote without changing the status file.
                real_run(['git', 'push', 'origin', other + ':refs/heads/automation-status'],
                         cwd=self.repo, check=True, capture_output=True)
            return real_run(command, **kwargs)

        calls = []
        with patch.object(transport, 'ROOT', self.repo), patch.object(transport.subprocess, 'run', side_effect=concurrent):
            with self.assertRaisesRegex(RuntimeError, 'push refused'):
                persist_and_dispatch(lambda *args: calls.append(args), 'automation-status.json', self.payload(), {}, ['collector.yml'])
        self.assertEqual(calls, [])
        self.assertEqual(len(pushed), 1)
        self.assertFalse(any(arg.startswith('--force') for arg in pushed[0]))
        self.assertEqual(self.remote_json(), {'old': True})

    def test_reservation_is_durable_before_post_and_outcome_is_written_after(self):
        state = {'archive': 'é' * 600000, 'recovery': {'collector.yml': {
            'status': 'reserved', 'attempts': [{'status': 'reserved', 'at': '2026-10-26T17:00:00Z'}]}}}
        calls = []

        def dispatch(path, method, body):
            calls.append((path, method, body))
            self.assertEqual(self.remote_json()['recovery']['collector.yml']['status'], 'reserved')

        with patch.object(transport, 'ROOT', self.repo):
            persist_and_dispatch(dispatch, 'automation-status.json', self.payload(state), state, ['collector.yml'])
        self.assertEqual(calls, [('/actions/workflows/collector.yml/dispatches', 'POST', {'ref': 'master'})])
        self.assertEqual(self.remote_json()['recovery']['collector.yml']['status'], 'dispatched')
        self.assertEqual(self.remote_json()['archive'], state['archive'])

    def test_uncertain_push_is_not_replayed_or_followed_by_dispatch(self):
        real_run = subprocess.run
        calls = []
        state = {'archive': 'é' * 600000, 'recovery': {'collector.yml': {
            'status': 'reserved', 'attempts': [{'status': 'reserved', 'at': '2026-10-26T17:00:00Z'}]}}}

        def uncertain(command, **kwargs):
            result = real_run(command, **kwargs)
            if command[:2] == ['git', 'push']:
                return subprocess.CompletedProcess(command, 1, stdout=b'', stderr=b'connection lost')
            return result

        with patch.object(transport, 'ROOT', self.repo), patch.object(transport.subprocess, 'run', side_effect=uncertain):
            with self.assertRaisesRegex(RuntimeError, 'push refused'):
                persist_and_dispatch(lambda *args: calls.append(args), 'automation-status.json', self.payload(state), state, ['collector.yml'])
        self.assertEqual(calls, [])
        self.assertEqual(self.remote_json()['recovery']['collector.yml']['status'], 'reserved', 'An uncertain push may already have persisted the reservation; never blindly dispatch')

    def test_small_reports_keep_existing_conditional_api(self):
        calls = []
        payload = {'sha': 'expected', 'content': encode_status({'one': 'small'})}
        result = transport.write_status(lambda *args: calls.append(args) or {'content': {'sha': 'new'}},
                                        'automation-status.json', payload, repo=self.repo)
        self.assertEqual(calls, [('/contents/automation-status.json', 'PUT', payload)])
        self.assertEqual(result['content']['sha'], 'new')

    def test_identical_competing_commit_does_not_authorize_a_second_dispatch(self):
        real_run = subprocess.run
        calls = []
        state = {'archive': 'é' * 600000, 'recovery': {'collector.yml': {
            'status': 'reserved', 'attempts': [{'status': 'reserved', 'at': '2026-10-26T17:00:00Z'}]}}}

        def competing(command, **kwargs):
            if command[:2] == ['git', 'push']:
                real_run(command, **kwargs)  # Another writer has persisted the identical commit.
            return real_run(command, **kwargs)

        with patch.object(transport, 'ROOT', self.repo), patch.object(transport.subprocess, 'run', side_effect=competing):
            with self.assertRaisesRegex(RuntimeError, 'not newly recorded'):
                persist_and_dispatch(lambda *args: calls.append(args), 'automation-status.json', self.payload(state), state, ['collector.yml'])
        self.assertEqual(calls, [])
        self.assertEqual(self.remote_json()['recovery']['collector.yml']['status'], 'reserved')


if __name__ == '__main__':
    unittest.main()
