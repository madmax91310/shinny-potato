"""Recalculate all 32 reviewed values from archived official DWS responses."""
import datetime as dt
import json
from pathlib import Path
from collect_dws_etf import parse_holdings

root = Path(__file__).parent / 'fixtures' / 'radar-review-583'
rows = json.loads((root / 'comparison.json').read_text())
assert len(rows) == 32
for isin in sorted({r['isin'] for r in rows}):
    body = json.loads((root / f'{isin}.json').read_text())
    parsed = parse_holdings(body, {'isin': isin}, dt.datetime(2026, 10, 14, tzinfo=dt.timezone.utc),
                            f'https://etf.dws.com/api/pdp/en-gb/etf/{isin}/holdings')
    for row in [r for r in rows if r['isin'] == isin]:
        field, name = row['field'].split(':', 1)
        block = parsed[field]
        assert block['complete'] is True
        assert block['sha256'] == row['sha256']
        assert block['asOf'] == row['livePeriod']
        value = next((r['weightPct'] for r in block['rows'] if r['name'] == name), 0)
        assert value == row['liveValue'], row['key']
print('32 fields verified against six archived DWS responses.')
