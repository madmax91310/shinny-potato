from copy import deepcopy
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

from automation_status_segments import (
    build_manifest, decode_segment, json_bytes, restore_manifest, segment_path,
)
from automation_status_storage import encode_status, pack_proof_checks


def fixture():
    ids = ['ETF:é', 'asset:EUR', 'ETF:é', 'asset:USD']
    active = {'id': 'f', 'name': 'ETF', 'attemptedDataIds': ids, 'observations': [{'date': '2026-11-26'}]}
    resolution = {**active, 'resolvedAt': '2026-11-25', 'resolutionEvidence': {'sha256': 'abc'}}
    retired = {'id': 'r', 'name': 'ETF retiré', 'attemptedDataIds': ids}
    receipt = {'recordedAt': '2026-11-25', 'evidence': {'scopeRef': 'a' * 64}}
    return pack_proof_checks({
        'schemaVersion': 1,
        'workflows': {'source': {
            'name': 'Source',
            'proofChecks': {'A': receipt, 'B': receipt, 'C': {'evidence': {'sha256': 'other'}}},
            'reportEvidenceHistory': [{'file': 'obs.json', 'producerContract': 'producer-results-v1',
                                       'scopeExplicit': True, 'scopePlanVerified': True}],
            'reportResultHistory': [{'successes': ['données'], 'errors': [{'id': 'a'}]}],
            'sourceChecks': {'EUR': {'checkedAt': '2026-11-25'}},
        }},
        'monitoring': {'schemaVersion': 1, 'checkedAt': '2026-11-26', 'active': {'f': active},
                       'resolved': [{'id': 'newest', 'name': 's'}, resolution, resolution], 'retired': [retired],
                       'events': [{'revision': 2, 'resolved': [resolution, {**resolution, 'oldProof': True}, resolution],
                                   'retired': [retired]}]},
        'reportScopes': {'a' * 64: {'items': [{'id': 'ETF'}]}},
        'recovery': {'source': {'attempts': [{'status': 'reserved'}]}},
    })


class Segments(unittest.TestCase):
    def test_lossless_migration_idempotence_and_legacy_budget(self):
        state = fixture()
        before = deepcopy(state)
        with patch('automation_status_storage.MAX_STATUS_BYTES', 128):
            with self.assertRaises(ValueError):
                encode_status(state, compressed=True)
            manifest, files, visited = build_manifest(state)
        restored, known = restore_manifest(manifest, files.__getitem__)
        self.assertEqual(restored, before)
        self.assertEqual(state, before)
        self.assertEqual(known, visited)
        self.assertEqual(build_manifest(restored, known), (manifest, {}, known))

    def test_segment_rotation_reuses_older_pages(self):
        state = fixture()
        rows = [{'id': str(i), 'name': 'ETF'} for i in range(24)]
        state['monitoring']['resolved'] = rows
        with patch('automation_status_segments.PAGE', 3):
            first, files, known = build_manifest(state)
            state['monitoring']['resolved'] = [{'id': 'new', 'name': 'ETF'}, *rows]
            last, new, _ = build_manifest(state, known)
            restore, _ = restore_manifest(last, (files | new).__getitem__)
        self.assertEqual(restore, state)
        self.assertNotEqual(first, last)
        historical_pages = first['incidentLists']['resolved']['pages']
        self.assertIn(historical_pages[0], last['incidentLists']['resolved']['pages'])

    def test_corruption_missing_and_excess_are_rejected(self):
        manifest, files, _ = build_manifest(fixture())
        path = segment_path(manifest['current']['pages'][0])
        with self.assertRaises(KeyError):
            restore_manifest(manifest, {k: v for k, v in files.items() if k != path}.__getitem__)
        wire = json.loads(files[path])
        for change in ({'decodedBytes': 2**30}, {'decodedBytes': wire['decodedBytes'] + 1}, {'data': '!'}):
            with self.assertRaises(ValueError):
                decode_segment(json_bytes(wire | change), Path(path).stem)
        with self.assertRaises(ValueError):
            decode_segment(files[path], '0' * 64)
        with self.assertRaises(ValueError):
            segment_path('../unsafe')

    def test_browser_reads_current_and_all_episodes_without_private_segments(self):
        state = fixture()
        manifest, files, _ = build_manifest(state)
        code = """
          import {readFileSync} from 'node:fs'
          import {decodeMonitorStorage} from './src/lib/monitor-storage.js'
          const {manifest,files}=JSON.parse(readFileSync(0,'utf8'))
          const load = path => JSON.parse(files[path])
          const status = await decodeMonitorStorage(manifest,load)
          await Promise.all([
            decodeMonitorStorage(manifest),
            decodeMonitorStorage(manifest, () => ({ decodedBytes: 1, data: 'AAAA' })),
          ].map(async operation => {
            try { await operation } catch { return }
            throw Error('Le lecteur a accepté un manifeste sans preuve valide')
          }))
          process.stdout.write(JSON.stringify(status))
        """
        data = json.dumps({'manifest': manifest, 'files': {k: v.decode() for k, v in files.items()}})
        result = subprocess.run(['node', '--input-type=module', '-e', code], input=data,
                                text=True, capture_output=True, check=True)
        public = json.loads(result.stdout)
        self.assertEqual(public['monitoring'], {k: v for k, v in state['monitoring'].items() if k != 'events'})
        self.assertEqual(public['workflows']['source']['reportEvidenceHistory'],
                         state['workflows']['source']['reportEvidenceHistory'])
        self.assertNotIn('proofChecks', public['workflows']['source'])

