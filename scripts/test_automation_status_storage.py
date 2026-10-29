"""Lossless monitor transport; no producer result, date or incident is retired."""
import base64
import copy
import gzip
import hashlib
import json
import subprocess
import unittest
from unittest.mock import patch
from automation_status_storage import encode_status, decode_status, reader_ready, MAX_STATUS_BYTES
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
