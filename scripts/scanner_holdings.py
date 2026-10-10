"""Complete physical portfolios for the scanner, separate from top-ten cards.

Reuse the daily issuer collection's complete payload; never replace an index
exposure with a synthetic fund's substitute basket or another fund's portfolio.
"""
import datetime as dt
import hashlib
import json
import re
from urllib.parse import urlsplit

from collect_etf_holdings import parse_holdings
from data_automation import UTC, reject


def iso_date(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        reject('Missing ISO composition date')
    return dt.date.fromisoformat(value)


def freshness(snapshot, now, policy):
    """Source checks do not refresh the economic snapshot date."""
    today = now.astimezone(UTC).date()
    age = (today - iso_date(snapshot['asOf'])).days
    check_age = (today - iso_date(snapshot['checkedAt'])).days
    if age < 0 or check_age < 0:
        reject('Future scanner evidence date')
    return {'snapshotAgeDays': age, 'checkAgeDays': check_age,
            'fresh': age <= policy['maxSnapshotAgeDays']
                     and check_age <= policy['maxCheckAgeDays']}


def parse_complete_ishares(share, now):
    body = {'productId': share['productId'], 'currencyCode': share['currency'],
            'componentsByNameMap': share['rawComponents']}
    facts = body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value'] != share['isin']:
        reject('Wrong complete-portfolio share identity')
    if share.get('holdingsAssetClass', 'Equity') != 'Equity':
        reject('Scanner first version requires an equity portfolio')
    methodology = facts['fundMethodologyTypeCode']['value']
    if methodology not in ('Optimised', 'Replicated', 'Physical Replication'):
        reject('Unqualified physical replication: ' + str(methodology))
    url = share['sourceUrl']
    if urlsplit(url).scheme != 'https' or urlsplit(url).hostname not in ('www.blackrock.com', 'www.ishares.com'):
        reject('Unexpected complete-portfolio source')
    top, _ = parse_holdings(body, share, now)
    points = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    fields = ('issueName', 'holdingPercent', 'isin', 'countryOfRisk', 'assetClass',
              'sectorName', 'ticker', 'marketCurrencyCode', 'exchange')
    columns = {k: points[k]['value'] for k in fields}
    size = len(columns['issueName'])
    if any(not isinstance(v, list) or len(v) != size for v in columns.values()):
        reject('Incomplete scanner holdings columns')
    rows, identities = [], set()
    for values in zip(*(columns[k] for k in fields)):
        name, weight, isin, country, asset, sector, ticker, currency, exchange = values
        if not isinstance(name, str) or not name.strip():
            reject('Missing scanner position name')
        isin = isin if isin not in (None, '', '-') else None
        if asset == 'Equity':
            # Corporate-action rights/CVRs may have no ISIN. Retain them and
            # disclose their exact weight; never manufacture a matching identity.
            if isin is not None:
                if not isinstance(isin, str) or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d', isin):
                    reject('Invalid equity ISIN in complete portfolio')
                identities.add(isin)
        rows.append({'name': name, 'weightPct': weight, 'isin': isin,
                     'assetClass': asset, 'country': country or None,
                     'sector': sector or None, 'ticker': ticker or None,
                     'currency': currency or None, 'exchange': exchange or None})
    equity_weight = sum(r['weightPct'] for r in rows if r['assetClass'] == 'Equity')
    unidentified = [r for r in rows if r['assetClass'] == 'Equity' and r['isin'] is None]
    total = sum(r['weightPct'] for r in rows)
    # Five-decimal percentages accumulate rounding error across large portfolios.
    # A top-ten response or materially truncated portfolio never qualifies.
    if abs(total - 100) > max(0.02, size * 0.000005 + 0.001):
        reject('Complete portfolio weights do not reconcile')
    if not 90 <= equity_weight <= 101:
        reject('Unqualified equity portfolio coverage')
    if len(identities) < 10:
        reject('Insufficient complete equity portfolio')
    payload = {'schemaVersion': 1, 'isin': share['isin'], 'basis': 'fund',
               'scope': 'all-published-positions', 'complete': True,
               'provider': 'iShares', 'index': share['index'],
               'replicationMethod': methodology, 'asOf': top['asOf'],
               'sourceUrl': url, 'positionCount': len(rows),
               'equityPositionCount': sum(r['assetClass'] == 'Equity' for r in rows),
               'uniqueEquityIsinCount': len(identities),
               'unidentifiedEquityPositionCount': len(unidentified),
               'unidentifiedEquityWeightPct': round(sum(r['weightPct'] for r in unidentified), 8),
               'equityWeightPct': round(equity_weight, 8),
               'portfolioWeightPct': round(total, 8),
               'method': 'All published physical fund positions; original NAV weights including cash and derivatives; no renormalisation. Multiple positions with one ISIN retained for later aggregation. Unidentified rights/CVRs disclosed, never matched by name. Fund holdings are not complete index constituents.',
               'rows': rows}
    payload['sha256'] = hashlib.sha256(json.dumps(payload, sort_keys=True, allow_nan=False).encode()).hexdigest()
    return payload


def merge_snapshot(incoming, previous, checked_at, now, policy):
    """Reject rollback and oscillation at the same source date; preserve evidence."""
    if previous:
        for key in ('isin', 'basis', 'scope', 'index', 'replicationMethod'):
            if incoming[key] != previous[key]:
                reject('Scanner portfolio convention changed: ' + key)
        if incoming['asOf'] < previous['asOf']:
            reject('Older scanner composition; previous snapshot preserved')
        if incoming['asOf'] == previous['asOf'] and incoming['sha256'] != previous['sha256']:
            reject('Conflicting scanner composition at the same source date')
        before, after = previous['equityPositionCount'], incoming['equityPositionCount']
        if abs(after - before) > max(10, before * 0.15):
            reject('Suspicious scanner equity-count change')
    result = {**incoming, 'checkedAt': checked_at,
              'modifiedAt': previous['modifiedAt'] if previous and incoming['sha256'] == previous['sha256'] else checked_at}
    if not freshness(result, now, policy)['fresh']:
        reject('Stale complete scanner composition')
    return result


def observed_coverage(record, now, policy):
    """Report partial PEA evidence without certifying a full portfolio."""
    holdings = (record or {}).get('holdings', {})
    rows = holdings.get('rows', [])
    result = {'available': False, 'status': 'complete-source-not-qualified',
              'reason': 'No complete, dated economic-exposure source qualified. Top positions and substitute baskets cannot support complete overlap.',
              'basis': holdings.get('basis'), 'asOf': holdings.get('asOf'),
              'index': (record or {}).get('characteristics', {}).get('index'),
              'checkedAt': holdings.get('checkedAt'),
              'sourceUrl': holdings.get('sourceUrl') or (record or {}).get('sourceUrl'),
              'publishedPositionCount': len(rows),
              'publishedWeightPct': round(sum(r['weightPct'] for r in rows), 8)}
    if result['asOf'] and result['checkedAt']:
        result['freshness'] = freshness(result, now, policy)
    else:
        result['freshness'] = {'fresh': False, 'snapshotAgeDays': None, 'checkAgeDays': None}
    return result
