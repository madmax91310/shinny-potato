"""Actual issuer pages, exact-share parser, shared merge and stale-proof behavior."""
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest
from collect_presentation_etf import globalx_physical
from collect_priority_issuer_etf import silver
from apply_etf_collection import merge_collection
from refresh_additional_etf import refresh

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    'IE00BLCHJB90': 'Indxx Global Robotics & Artificial Intelligence Thematic v2 Index',
    'IE000NDWFGA5': 'Solactive Global Uranium & Nuclear Components Total Return v2 Index',
    'IE00BMH5Y871': 'Indxx Cybersecurity v2 Index',
    'IE000UL6CLP7': 'Solactive Global Silver Miners Total Return v2 Index',
}
NOW = dt.datetime(2026, 11, 1, tzinfo=dt.timezone.utc)

class PublicationBenchmarks(unittest.TestCase):
    def test_actual_response_identity_and_benchmark(self):
        sources = json.loads((ROOT/'docs/publication-expansion-sources-2026-11-01.json').read_text())['assets']
        config = sum([json.loads((ROOT/name).read_text())['instruments'] for name in
                      ['scripts/additional-etf-sources.json', 'scripts/exposure-etf-expansion.json']], [])
        for isin, expected in EXPECTED.items():
            with self.subTest(isin=isin):
                receipt = next(r for r in sources if r['isin'] == isin)
                raw = gzip.decompress((ROOT/receipt['fixture']).read_bytes())
                self.assertEqual(hashlib.sha256(raw).hexdigest(), receipt['sha256'])
                text = raw.decode().replace('\r\n', '\n')
                self.assertEqual(hashlib.sha256(text.encode()).hexdigest(), receipt['parserTextSha256'])
                share = next(s for s in config if s['isin'] == isin)
                result = (silver if isin == 'IE000UL6CLP7' else globalx_physical)(text, share, NOW)
                self.assertEqual(result['characteristics']['index'], expected)
                # The observation stays in October, although the check is in November.
                self.assertEqual(result['characteristics']['asOf'], '2026-10-30')
                merged = merge_collection({'checkedAt': '2026-11-01', 'shares': [result]}, {}, {})[isin]
                self.assertEqual(merged['characteristicChecks']['index']['asOf'], '2026-10-30')
                self.assertEqual(merged['characteristicChecks']['index']['checkedAt'], '2026-11-01')
                current = {isin: merged}
                # A later partial parse must retain the last validated index and its real proof.
                partial = {**result, 'characteristics': {k:v for k,v in result['characteristics'].items() if k != 'index'}}
                after = merge_collection({'checkedAt': '2026-11-02', 'shares': [partial]}, current, {})[isin]
                self.assertEqual(after['characteristics']['index'], expected)
                self.assertEqual(after['characteristicChecks']['index'], merged['characteristicChecks']['index'])
                # An independent source failure preserves the entire last valid record.
                def fail(*_):
                    raise ValueError('source unavailable')
                retained, report = refresh({'instruments': [share]}, current, {}, NOW, collect=fail)
                self.assertEqual(retained, current)
                self.assertEqual(report['shares'][0]['status'], 'failed')
