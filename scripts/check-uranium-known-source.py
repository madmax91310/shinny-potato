"""Read-only GitHub qualification through the ordinary, single-share producer.

An explicitly partial native failure remains a failure of the complete book.
This control only proves the fresh known subset; it never records production.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ISIN = 'IE000NDWFGA5'
root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1])
output.mkdir(parents=True, exist_ok=True)
books_path = root / 'src/data/dca-complete-holdings.json'
status_path = root / 'src/data/dca-holdings-status.json'
before = json.loads(books_path.read_text())
status_before = json.loads(status_path.read_text())
report_path = output / 'dca-complete-holdings.json'
result = subprocess.run([sys.executable, str(root / 'scripts/collect_dca_complete_holdings.py'),
    '--apply', '--only', ISIN, '--output', str(report_path)], cwd=root)
assert result.returncode in (0, 1), 'Producer interrupted before normal result'
report = json.loads(report_path.read_text())
contract = report['resultContract']
expected_id = 'dca-holdings:' + ISIN
assert [item['id'] for item in contract['inputPlan']['items'] if item['selected']] == [expected_id]
assert contract['scope']['attemptedIds'] == [expected_id]
assert contract['scope']['networkRequestedIds'] == [expected_id]
assert not contract['issues'] and not contract['unscopedFailures']
selected = [item for item in contract['outcomes'] if item['selected']]
assert len(selected) == 1 and selected[0]['id'] == expected_id
assert all(item['selected'] or item['status'] == 'not-attempted' for item in contract['outcomes'])
after = json.loads(books_path.read_text())
assert {k:v for k,v in before.items() if k != ISIN} == {k:v for k,v in after.items() if k != ISIN}, 'Single-share run changed another book'
observation = report['observations'][ISIN]
record = after[ISIN]
assert observation['sha256'] == record['sha256']
assert record['checkedAt'] > before[ISIN]['checkedAt'], 'No fresh acquisition'
assert record['rows'] and record['asOf'] >= before[ISIN]['asOf']
if record.get('sourcePartial'):
    assert result.returncode == 1 and len(report['errors']) == 1 and not report['successes']
    assert report['errors'][0]['id'] == 'dca-holdings:' + ISIN
    assert record['complete'] is False and record['unvaluedPositions']
    proof = record['partialSourceProof']
    assert proof['knownSecurityWeightsQualified'] is True and proof['financialDataQualified'] is False
    assert proof['normalizationApplied'] is False
    assert all(r['weightPct'] is None for r in record['unvaluedPositions'])
    assert json.loads(status_path.read_text())[ISIN]['lastSuccessAt'] == status_before[ISIN]['lastSuccessAt'], 'Partial check renewed complete-source success'
    assert selected[0]['status'] == 'failed' and selected[0]['phase'] == 'validation'
    scope = 'known-security-weights-only; complete-book-error-preserved'
else:
    assert result.returncode == 0 and record['complete'] is True and not report['errors']
    scope = 'complete-book-qualified-by-ordinary-producer'
(output / 'uranium-record.json').write_text(json.dumps(record, indent=2) + '\n')
(output / 'known-source-control.json').write_text(json.dumps({
    'isin': ISIN, 'scope': scope, 'asOf': record['asOf'], 'checkedAt': record['checkedAt'],
    'sha256': record['sha256'], 'knownSecurityRows': len(record['rows']),
    'completeBookQualified': record['complete'], 'ordinaryProducerExitCode': result.returncode,
    'productionWrite': False}, indent=2) + '\n')
print(f'{ISIN}: {scope}; no production write')
