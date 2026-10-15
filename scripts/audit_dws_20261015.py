"""Offline production audit; requires original radar-data Git history. No writes/network."""
import collections
import datetime as dt
import hashlib
import json
import subprocess
from collect_dws_etf import parse_holdings

OPEN = '5873d0c3fa7d75867d197d809c7313af50bf4227'
CLOSED = '0ccbf11603cf252c48b1c3053af36fd57eb57480'
CONFIRMED = '952b418301080a338a1934f69fc84d514328f990'


def read(ref, path):
    return json.loads(subprocess.check_output(['git', 'show', f'{ref}:{path}']))


def main():
    opened, closed, confirmed = [read(ref, 'state.json') for ref in (OPEN, CLOSED, CONFIRMED)]
    conflicts = {k: c for k, c in opened['conflicts'].items() if not c.get('resolvedAt')}
    assert len(conflicts) == 39
    assert {c['period'] for c in conflicts.values()} == {'2026-10-13'}
    entities = {c['accepted']['entity'] for c in conflicts.values()}
    assert len(entities) == 7
    reconciled = [c for c in confirmed['conflicts'].values() if c.get('resolvedAt') == confirmed['lastCheckedAt']]
    assert len(reconciled) == 34
    assert all(c['resolution']['kind'] == 'verified-source-revision' for c in reconciled)
    parsed_cache = {}
    now = dt.datetime(2026, 10, 15, 18, tzinfo=dt.timezone.utc)
    for key, conflict in conflicts.items():
        final = closed['conflicts'][key]
        assert final['resolvedAt'] == closed['lastCheckedAt']
        assert 'resolution' not in final  # historical production omission
        assert final['accepted'] == conflict['accepted']
        for proposal in conflict['proposals']:
            retained = next(p for p in final['proposals'] if p['id'] == proposal['id'])
            assert retained['observation'] == proposal['observation']
            assert retained['firstSeenAt'] == proposal['firstSeenAt']
            assert retained['lastSeenAt'] >= proposal['lastSeenAt']
        for row in [conflict['accepted'], *(p['observation'] for p in conflict['proposals'])]:
            digest = row['sourceHash']
            if digest not in parsed_cache:
                body = read(CLOSED, f'dws-snapshots/{digest}.json')
                assert hashlib.sha256(json.dumps(body, sort_keys=True, allow_nan=False).encode()).hexdigest() == digest
                parsed_cache[digest] = parse_holdings(body, {'isin': row['entity']}, now, row['sourceUrl'])
            field, name = row['field'].split(':', 1)
            parsed = parsed_cache[digest][field]
            assert parsed['asOf'] == row['period']
            actual = next((r['weightPct'] for r in parsed['rows'] if r['name'] == name), 0)
            assert abs(actual - row['value']) < 1e-7, (key, actual, row['value'])
    changed = collections.Counter()
    for entity in sorted(entities):
        key = f'{entity}:2026-10-13'
        hashes = [s['compositionChecks'][key]['sourceHash'] for s in (confirmed, opened)]
        bodies = [read(CLOSED, f'dws-snapshots/{h}.json') for h in hashes]
        old, new = [{r['header']['value']: r for r in b['tables'][0]['values']} for b in bodies]
        assert old.keys() == new.keys()
        for isin, row in old.items():
            for column, value in row.items():
                if value != new[isin][column]: changed[column] += 1
            assert row['column_1'] == new[isin]['column_1']
            assert row['column_2'] == new[isin]['column_2']
    assert changed['column_3'] > 0
    feed = read(CLOSED, 'feed.json')
    assert not [e for e in feed['events'] if e['entity'] in entities and e['detectedAt'] == closed['lastCheckedAt']]
    print(json.dumps({'conflicts': 39, 'entities': 7, 'archived_hashes_reparsed': len(parsed_cache),
                      'verified_resolutions_at_0030': 34, 'later_period_closures_at_1757': 39,
                      'changed_source_columns': dict(changed), 'new_DWS_signals_at_closure': 0}, indent=2))


if __name__ == '__main__':
    main()
