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
record = after[ISIN]
observation = report['observations'].get(ISIN)
rejected = report['rejectedObservations'].get(ISIN)
status_after = json.loads(status_path.read_text())[ISIN]
if observation is None:
    assert rejected and rejected.get('knownSecurityWeightsQualified') is True, 'No qualified source observation'
    assert record == before[ISIN] and record['complete'] is True, 'Previously complete book must be retained'
    assert result.returncode == 1 and not report['successes']
    assert status_after['lastSuccessAt'] == status_before[ISIN]['lastSuccessAt']
    scope = 'known-security-weights-only; previous complete book retained'
    evidence = rejected
else:
    assert observation['sha256'] == record['sha256']
    assert record['checkedAt'] > before[ISIN]['checkedAt'], 'No fresh acquisition'
    assert record['rows'] and record['asOf'] >= before[ISIN]['asOf']
    if record.get('sourcePartial'):
        assert result.returncode == 1 and len(report['errors']) == 1 and not report['successes']
        assert record['complete'] is False and record['unvaluedPositions']
        assert status_after['lastSuccessAt'] == status_before[ISIN]['lastSuccessAt']
        scope = 'known-security-weights-only; complete-book-error-preserved'
        evidence = record['partialSourceProof']
    else:
        assert result.returncode == 0 and record['complete'] is True and not report['errors']
        scope = 'complete-book-qualified-by-ordinary-producer'
        evidence = {**record, 'knownSecurityRows': len(record['rows'])}
if evidence.get('knownSecurityWeightsQualified'):
    assert evidence['financialDataQualified'] is False and evidence['normalizationApplied'] is False
    assert evidence['unvaluedPositions'] and all(r['weightPct'] is None for r in evidence['unvaluedPositions'])
    assert selected[0]['status'] == 'failed' and selected[0]['phase'] == 'validation'
    assert evidence['asOf'] >= before[ISIN]['asOf'] and evidence['checkedAt'] > before[ISIN]['checkedAt']
(output / 'uranium-record.json').write_text(json.dumps(record, indent=2) + '\n')
(output / 'known-source-control.json').write_text(json.dumps({
    'isin': ISIN, 'scope': scope, 'asOf': evidence['asOf'], 'checkedAt': evidence['checkedAt'],
    'sha256': evidence['sha256'], 'knownSecurityRows': evidence['knownSecurityRows'],
    'completeBookQualified': not evidence.get('knownSecurityWeightsQualified'),
    'ordinaryProducerExitCode': result.returncode, 'productionWrite': False}, indent=2) + '\n')
print(f'{ISIN}: {scope}; no production write')
