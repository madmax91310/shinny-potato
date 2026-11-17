"""Independent Decimal verification of persisted SEC amounts and export selection."""
from decimal import Decimal
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
records = []
results_file = ROOT / 'test-artifacts/investor-screenprint/results.json'
images = {row['id']: row for row in json.loads(results_file.read_text())} if results_file.exists() else {}
for file in sorted((ROOT / 'public/data/investors').glob('*.json')):
    payload = json.loads(file.read_text())
    if not isinstance(payload, dict) or 'data' not in payload:
        continue
    snapshot = payload['data']['snapshot']
    if not snapshot.get('primaryVerified'):
        records.append({'slug': file.stem, 'status': 'incomplete'})
        continue
    rows = snapshot['holdings']
    total = sum(Decimal(str(row['value'])) for row in rows)
    assert total == Decimal(str(snapshot['declaredTotal'])), file.stem
    keys = [(row['cusip'], row['shareClass'], row['putCall']) for row in rows]
    assert len(keys) == len(set(keys)), file.stem
    for row in rows:
        value = Decimal(str(row['value']))
        assert value == sum(Decimal(str(item['value'])) for item in row['sourceRows']), file.stem
        assert row['currency'] == 'USD' and row['unit'] == 1
        assert abs(Decimal(str(row['weight'])) - value / total) < Decimal('1e-15'), file.stem
    eligible = sorted((row for row in rows if not row['putCall']), key=lambda row: -row['value'])
    scope_total = sum(Decimal(str(row['value'])) for row in eligible)
    image = images.get(file.stem)
    if image and image['status'] == 'ready':
        assert Decimal(str(image['total'])) == scope_total
        named = [row for row in image['entries'] if not row['other']]
        assert [row['value'] for row in named] == [row['value'] for row in eligible[:len(named)]]
        other = next((row for row in image['entries'] if row['other']), None)
        assert Decimal(str(other['value'] if other else 0)) == sum(Decimal(str(row['value'])) for row in eligible[len(named):])
        for row in image['entries']:
            assert abs(Decimal(str(row['weight'])) - Decimal(str(row['value'])) / scope_total) < Decimal('1e-14')
    records.append({'slug': file.stem, 'status': 'verified', 'periodEnd': snapshot['periodEnd'], 'declaredTotal': int(total), 'presentedTotal': int(scope_total), 'securities': len(rows), 'eligible': len(eligible), 'coverRoundingDifference': snapshot['reconciliationDifference']})
print(json.dumps({'method': 'Independent Decimal sums of source rows, security identities, reported weights and displayed Other grouping.', 'verified': sum(row['status'] == 'verified' for row in records), 'incomplete': sum(row['status'] == 'incomplete' for row in records), 'portfolios': records}, indent=2, ensure_ascii=False))
