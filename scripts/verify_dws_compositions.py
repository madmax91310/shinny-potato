"""Independently re-fetch complete official DWS portfolios for radar reconciliation."""
import datetime as dt
import json
import pathlib
import re
from concurrent.futures import ThreadPoolExecutor

from collect_dws_etf import parse_holdings
from data_automation import UTC, get_json


def verify(isin, record, now, fetch=get_json):
    url = f'https://etf.dws.com/api/pdp/en-gb/etf/{isin}/holdings'
    body = fetch(url)
    parsed = parse_holdings(body, {'isin': isin}, now, url)
    # The raw API also contains market values and display metadata. They can
    # change without changing the dated, qualified country/sector allocations.
    # Keep both hashes; never assert byte equality from equal financial values.
    active_hashes = {record[field].get('sha256') for field in ('countries', 'sectors')}
    if len(active_hashes) != 1 or not re.fullmatch(r'[a-f0-9]{64}', next(iter(active_hashes)) or ''):
        raise ValueError('DWS active evidence hashes are missing or inconsistent')
    active_hash = next(iter(active_hashes))
    for field in ('countries', 'sectors'):
        for key in ('basis', 'method', 'sourceUrl', 'complete'):
            if record[field].get(key) != parsed[field].get(key):
                raise ValueError(f'DWS {field}: live evidence differs from active {key}')
    periods = {record[field].get('asOf') for field in ('countries', 'sectors')}
    live_periods = {parsed[field].get('asOf') for field in ('countries', 'sectors')}
    if len(periods) != 1 or len(live_periods) != 1:
        raise ValueError('DWS country/sector snapshots have incompatible dates')
    if periods != live_periods:
        return {'entity': isin, 'deferred': True, 'reason': 'publication-lag',
                'activePeriod': next(iter(periods)), 'livePeriod': next(iter(live_periods)),
                'sourceUrl': url, 'checkedAt': now.isoformat()}
    for field in ('countries', 'sectors'):
        active, live = record[field], parsed[field]
        for key in ('asOf',):
            if active.get(key) != live.get(key):
                raise ValueError(f'DWS {field}: live evidence differs from active {key}')
        weights = lambda rows: sorted((r['name'], r['weightPct']) for r in rows)
        if weights(active['rows']) != weights(live['rows']):
            raise ValueError(f'DWS {field}: active aggregates differ from the full portfolio')
    return {'entity': isin, 'period': parsed['countries']['asOf'],
            'sourceUrl': url, 'sourceHash': parsed['countries']['sha256'],
            'activeSourceHash': active_hash,
            'evidenceRelation': 'identical-document' if active_hash == parsed['countries']['sha256'] else 'same-qualified-allocations',
            'method': parsed['countries']['method'], 'checkedAt': now.isoformat(),
            'allocations': {field: parsed[field]['rows'] for field in ('countries', 'sectors')},
            # Preserve Python's numeric representation (e.g. 1.0 vs 1) so the
            # archived bytes reproduce the canonical hash across JS/Python.
            'canonicalBody': json.dumps(body, sort_keys=True, allow_nan=False)}


def collect(records, now, fetch=get_json):
    candidates = [(isin, record) for isin, record in records.items()
                  if record.get('countries', {}).get('complete') is True
                  and record['countries'].get('sourceUrl') == f'https://etf.dws.com/api/pdp/en-gb/etf/{isin}/holdings']
    def one(item):
        isin, record = item
        try:
            return verify(isin, record, now, fetch), None
        except Exception as error:
            return None, {'family': 'etf', 'entity': isin,
                          'reason': f'Vérification indépendante DWS impossible : {type(error).__name__}: {error}'}
    with ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(one, candidates))
    return {'candidateCount': len(candidates),
            'verified': [proof for proof, error in results if proof and not proof.get('deferred')],
            'deferred': [proof for proof, error in results if proof and proof.get('deferred')],
            'errors': [error for proof, error in results if error]}


def check_report(report):
    """A publication lag is accounted for, never promoted to verified weights."""
    accounted = len(report['verified']) + len(report['deferred'])
    if report['errors'] or accounted == 0 or accounted != report['candidateCount']:
        raise ValueError('Incomplete or failed DWS verification: ' + json.dumps(report['errors']))


if __name__ == '__main__':
    root = pathlib.Path(__file__).resolve().parents[1]
    records = json.loads((root / 'src/data/automated-etf.json').read_text())
    report = collect(records, dt.datetime.now(UTC))
    print(json.dumps(report, allow_nan=False))
    import sys
    if '--check' in sys.argv:
        check_report(report)

