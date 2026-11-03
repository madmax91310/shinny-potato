"""Lossless monitor transport; no producer result, date or incident is retired."""
import base64
import copy
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch
from automation_status_storage import encode_status, decode_status, reader_ready, MAX_STATUS_BYTES, pack_proof_checks, expand_proof_checks
from automation_recovery import persist_and_dispatch


class MonitorTransport(unittest.TestCase):
    def setUp(self):
        self.state = {'schemaVersion': 1, 'updatedAt': '2026-10-29T16:31:16Z',
                      'workflows': {'source': {'errors': [{'isin': 'LU3038520774', 'cause': 'échec'}],
                                               'proofChecks': [{'scopeRef': 'original', 'checkedAt': None}] * 10}},
                      'monitoring': {'active': {'original': {'status': 'failure'}}, 'resolved': []},
                      'reportScopes': {'original': {'expectedIds': ['part:field']}},
                      'recovery': {'source': {'status': 'reserved'}}}

    def wire(self):
        return json.loads(base64.b64decode(encode_status(self.state, compressed=True)))

    def test_legacy_and_compressed_roundtrip_deterministic(self):
        self.assertEqual(decode_status(json.loads(base64.b64decode(encode_status(self.state)))), self.state)
        self.assertEqual(decode_status(self.wire()), self.state)
        self.assertEqual(encode_status(self.state, True), encode_status(self.state, True))
        self.assertEqual(self.wire()['schemaVersion'], 2)  # old UI rejects, never an empty success

    def test_corruption_unknown_versions_sizes_and_trailing_data(self):
        for key, value in [('schemaVersion', 1), ('monitorStorage', 'unknown'), ('sha256', '0'*64),
                           ('decodedBytes', 1), ('decodedBytes', MAX_STATUS_BYTES+1), ('decodedBytes', True),
                           ('data', '!')]:
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                wire = self.wire(); wire[key] = value; decode_status(wire)
        for suffix in (b'trailing', gzip.compress(b'{}')):
            wire = self.wire(); wire['data'] = base64.b64encode(base64.b64decode(wire['data']) + suffix).decode()
            with self.assertRaises(ValueError): decode_status(wire)
        wire = self.wire(); wire['unexpected'] = True
        with self.assertRaises(ValueError): decode_status(wire)

    def test_nested_state_refused(self):
        wire = self.wire(); raw = json.dumps(wire).encode()
        nested = {**wire, 'data': base64.b64encode(gzip.compress(raw)).decode(),
                  'sha256': hashlib.sha256(raw).hexdigest(), 'decodedBytes': len(raw)}
        with self.assertRaises(ValueError): decode_status(nested)

    def test_readiness_requires_actual_public_capability(self):
        self.assertFalse(reader_ready('owner/project', lambda _: {}))
        self.assertFalse(reader_ready('owner/project', lambda _: {'schemaVersion': 1, 'monitorStorage': 'wrong'}))
        self.assertFalse(reader_ready('owner/project', lambda _: (_ for _ in ()).throw(OSError('offline'))))
        calls = []
        def source(url):
            calls.append(url)
            return {'schemaVersion': 1, 'monitorStorage': 'gzip+base64-v1'}
        self.assertTrue(reader_ready('owner/project', source))
        self.assertEqual(calls, ['https://owner.github.io/project/monitor-storage-capabilities.json'])

    def test_browser_codec_reads_python_wire(self):
        script = """import {decodeMonitorStorage} from './src/lib/monitor-storage.js';
let body=''; for await (const chunk of process.stdin) body+=chunk;
process.stdout.write(JSON.stringify(await decodeMonitorStorage(JSON.parse(body))));"""
        output = subprocess.run(['node', '--input-type=module', '-e', script], input=json.dumps(self.wire()),
                                capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(output.stdout), self.state)

    def test_shared_receipts_roundtrip_both_readers_without_changing_any_evidence(self):
        self.state['workflows']['source']['proofChecks'] = {
            f'proof:{i}': {'recordedAt': None, 'evidence': {'file': 'observation.json', 'sha256': 'a' * 64}} for i in range(10)}
        before = copy.deepcopy(self.state)
        packed = pack_proof_checks(self.state)
        self.assertEqual(self.state, before)
        self.assertEqual(len(packed['proofCheckRecords']), 1)
        self.assertEqual(expand_proof_checks(packed), before)
        self.assertEqual(pack_proof_checks(packed), packed)
        self.assertEqual(decode_status(json.loads(base64.b64decode(encode_status(packed, True)))), before)
        script = """import {decodeMonitorStorage} from './src/lib/monitor-storage.js';
let body=''; for await (const chunk of process.stdin) body+=chunk;
process.stdout.write(JSON.stringify(await decodeMonitorStorage(JSON.parse(body))));"""
        output = subprocess.run(['node', '--input-type=module', '-e', script],
                                input=json.dumps(json.loads(base64.b64decode(encode_status(packed, True)))),
                                capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(output.stdout), before)

    def test_shared_receipt_corruption_missing_refs_and_orphans_are_fatal(self):
        self.state['workflows']['source']['proofChecks'] = {
            f'proof:{i}': {'recordedAt': None, 'evidence': {'file': 'observation.json', 'sha256': 'a' * 64}} for i in range(10)}
        good = pack_proof_checks(self.state)
        for kind in ['hash', 'missing', 'orphan', 'version', 'mixed', 'ref-type', 'truncated', 'no-registry']:
            with self.subTest(kind=kind):
                packed = copy.deepcopy(good)
                key = next(iter(packed['proofCheckRecords']))
                if kind == 'hash': packed['proofCheckRecords'][key] += ' '
                elif kind == 'missing': packed['proofCheckRecords'].clear()
                elif kind == 'orphan': packed['workflows']['source']['proofChecks'].clear()
                elif kind == 'version': packed['proofCheckStorage'] = 'unknown'
                elif kind == 'mixed': packed['workflows']['source']['proofChecks']['extra'] = {'recordedAt': '2026-11-02'}
                elif kind == 'ref-type': next(iter(packed['workflows']['source']['proofChecks'].values()))['proofCheckRef'] = []
                elif kind == 'no-registry':
                    packed.pop('proofCheckRecords'); packed.pop('proofCheckStorage')
                else: packed['proofCheckRecords'][key] = packed['proofCheckRecords'][key][:-1]
                with self.assertRaises(ValueError): decode_status(json.loads(base64.b64decode(encode_status(packed, True))))
                self.assertEqual(self.state['monitoring'], good['monitoring'])

    def test_deduplication_restores_transport_budget_without_raising_its_limit(self):
        state = copy.deepcopy(self.state)
        receipt = {'runUrl': 'https://github.com/owner/repo/actions/runs/123', 'recordedAt': '2026-11-01T10:00:00Z',
                   'evidence': {'file': 'observation.json', 'sha256': 'a' * 64, 'description': 'source officielle ' * 100}}
        state['workflows']['source']['proofChecks'] = {f'proof:{i}': receipt for i in range(2000)}
        limit = 1024 * 1024
        with patch('automation_status_storage.MAX_STATUS_BYTES', limit):
            with self.assertRaises(ValueError): encode_status(state, True)
            packed = pack_proof_checks(state)
            self.assertEqual(decode_status(json.loads(base64.b64decode(encode_status(packed, True)))), state)
        self.assertEqual(MAX_STATUS_BYTES, 256 * 1024 * 1024)

    def test_shared_receipts_require_the_deployed_capability(self):
        old = {'schemaVersion': 1, 'monitorStorage': 'gzip+base64-v1'}
        new = {**old, 'proofCheckStorage': 'sha256-records-v1'}
        self.assertFalse(reader_ready('owner/repo', lambda _: old, proof_checks=True))
        self.assertTrue(reader_ready('owner/repo', lambda _: new))
        self.assertTrue(reader_ready('owner/repo', lambda _: new, proof_checks=True))
        self.assertFalse(reader_ready('owner/repo', lambda _: {**new, 'proofCheckStorage': 'unknown'}))

    def test_recorded_public_receipts_keep_all_original_fields(self):
        path = Path(__file__).with_name('fixtures') / 'source-incidents-20261102' / 'monitor-proof-checks.json'
        state = json.loads(path.read_text())
        self.assertEqual(expand_proof_checks(pack_proof_checks(state)), state)

    def test_shared_receipts_survive_both_recovery_transaction_writes(self):
        state = copy.deepcopy(self.state)
        state['workflows']['source']['proofChecks'] = {'old-proof': {'recordedAt': None, 'evidence': None}}
        state['recovery'] = {'source': {'status': 'reserved', 'attempts': [{}]}}
        packed = pack_proof_checks(state)
        payload = {'sha': 'original', 'branch': 'automation-status', 'content': encode_status(packed, True)}
        saved = []
        def write(api, path, body):
            wire = json.loads(base64.b64decode(body['content']))
            decoded = decode_status(wire)
            self.assertEqual(decoded['workflows'], state['workflows'])
            self.assertEqual(decoded['monitoring'], state['monitoring'])
            self.assertIn('proofCheckRecords', json.loads(gzip.decompress(base64.b64decode(wire['data']))))
            saved.append(decoded['recovery']['source']['status'])
            return {'content': {'sha': 'reserved'}}
        def api(path, method, body):
            self.assertEqual(saved, ['reserved'])
        with patch('automation_recovery.write_status', side_effect=write):
            persist_and_dispatch(api, 'automation-status.json', payload, packed, ['source'], compressed=True)
        self.assertEqual(saved, ['reserved', 'dispatched'])

    def test_compressed_reservation_and_dispatch_receipt_keep_same_transport(self):
        state = copy.deepcopy(self.state)
        state['recovery'] = {'source': {'status': 'reserved', 'attempts': [{}]}}
        payload = {'sha': 'original', 'branch': 'automation-status', 'content': encode_status(state, True)}
        calls = []
        def write(api, path, body):
            wire = json.loads(base64.b64decode(body['content']))
            self.assertEqual(wire['monitorStorage'], 'gzip+base64-v1')
            saved = decode_status(wire)
            calls.append(saved['recovery']['source']['status'])
            self.assertEqual(saved['monitoring'], self.state['monitoring'])
            return {'content': {'sha': 'reserved'}}
        def api(path, method, body):
            self.assertEqual(calls, ['reserved'])
            self.assertEqual(body, {'ref': 'master'})
            calls.append('POST')
        with patch('automation_recovery.write_status', side_effect=write):
            persist_and_dispatch(api, 'automation-status.json', payload, state, ['source'], compressed=True)
        self.assertEqual(calls, ['reserved', 'POST', 'dispatched'])
        calls.clear()
        with patch('automation_recovery.write_status', side_effect=RuntimeError('conflict')):
            with self.assertRaises(RuntimeError):
                persist_and_dispatch(api, 'automation-status.json', payload, state, ['source'], compressed=True)
        self.assertEqual(calls, [])


if __name__ == '__main__':
    unittest.main()
