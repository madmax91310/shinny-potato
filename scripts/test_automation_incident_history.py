import json
import subprocess
import unittest

from monitor_incident_history import expand_incident_history, pack_incident_history
from automation_status_storage import decode_status, encode_status


class IncidentHistoryStorageTest(unittest.TestCase):
    def setUp(self):
        observations = [{'cause': 'Dernière photographie inchangée ' * 200, 'runId': 21}]
        self.state = {'schemaVersion': 1, 'monitoring': {'checkedAt': '2026-11-22',
            'active': {'one': {'firstSeenAt': '2026-11-20', 'observations': observations},
                       'two': {'lastSeenAt': '2026-11-22', 'observations': observations}},
            'resolved': {'old': {'observations': observations}}}}
        self.packed = pack_incident_history(self.state)

    def test_lossless_and_shared_in_both_readers(self):
        self.assertEqual(len(self.packed['incidentHistoryArchives']), 1)
        self.assertEqual(expand_incident_history(self.packed), self.state)
        import base64
        envelope = json.loads(base64.b64decode(encode_status(self.packed, compressed=True)))
        self.assertEqual(decode_status(envelope), self.state)
        reader = """import {decodeMonitorStorage} from './src/lib/monitor-storage.js';
import {readFileSync} from 'node:fs';
console.log(JSON.stringify(await decodeMonitorStorage(JSON.parse(readFileSync(0, 'utf8')))));"""
        result = subprocess.check_output(['node', '--input-type=module', '-e', reader],
                                         input=json.dumps(envelope), text=True)
        self.assertEqual(json.loads(result), self.state)

    def test_corrupt_hash_and_missing_reference_are_refused(self):
        records = self.packed['incidentHistoryArchives']
        digest = next(iter(records))
        records['0' * 64] = records.pop(digest)
        with self.assertRaisesRegex(ValueError, 'Empreinte'):
            expand_incident_history(self.packed)
        records[digest] = records.pop('0' * 64)
        self.packed['monitoring']['active']['one']['observationHistoryRef'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'Référence'):
            expand_incident_history(self.packed)
