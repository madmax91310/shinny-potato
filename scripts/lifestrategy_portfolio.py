"""Exact LifeStrategy fund-NAV positions, distinct from its rounded PDF table."""
from decimal import Decimal, ROUND_FLOOR
import hashlib
import json

from issuer_documents import document_date

API = 'https://www.vanguard.co.uk/gpx/graphql'
QUERY = '''query LifeStrategyPortfolio($portIds: [String!]!) {
  funds(portIds: $portIds) { profile {
    portId fundCurrency etfReplicationMethodology assetClassificationLevel1
    identifiers(altIds: ["ISIN"]) { altId altIdValue }
  } }
  borHoldings(portIds: $portIds) { holdings(limit: 100) {
    items { securityLongDescription marketValuePercentage sedol1 securityType effectiveDate isin }
    totalHoldings lastItemKey
  } }
}'''
EQUITY_FUNDS = {
    'IE00BK5BQT80', 'IE00BK5BQV03', 'IE00BK5BR733', 'IE00BK5BQX27',
    'IE00BFMXXD54', 'IE00BK5BQW10', 'IE00BFMXYX26', 'IE00BK5BQZ41',
}
BOND_FUNDS = {
    'IE00BMX0B631', 'IE00BG47KH54', 'IE00BH04GL39',
    'IE00BGYWFL94', 'IE00BGYWT403', 'IE00BMX0B524',
}


def weight(value):
    if type(value) not in (int, float):
        raise ValueError('Invalid LifeStrategy NAV position weight')
    result = Decimal(str(value))
    if not result.is_finite() or abs(result) > 100 or result.as_tuple().exponent < -5:
        raise ValueError('LifeStrategy NAV weight units/precision changed')
    return result


def displayed_allocation(values):
    """Corroborate the publisher's 2dp total-preserving display, not change NAV.

    This comparison never rescales a position. All source weights and their
    small published precision residual remain in the actual observation.
    """
    units = {name: value * 100 for name, value in values.items()}
    floor = {name: int(value.to_integral_value(rounding=ROUND_FLOOR)) for name, value in units.items()}
    missing = 10000 - sum(floor.values())
    if not 0 <= missing <= len(values):
        raise ValueError('LifeStrategy allocation cannot corroborate the published display')
    order = sorted(values, key=lambda name: units[name] - floor[name], reverse=True)
    if 0 < missing < len(values) and units[order[missing-1]] - floor[order[missing-1]] == units[order[missing]] - floor[order[missing]]:
        raise ValueError('Ambiguous LifeStrategy display rounding boundary')
    for name in order[:missing]:
        floor[name] += 1
    return {name: Decimal(value) / 100 for name, value in floor.items()}


def parse_portfolio(body, config, record, now):
    _, code, isin = config
    if body.get('errors'):
        raise ValueError('LifeStrategy portfolio query failed')
    funds, portfolios = body['data']['funds'], body['data']['borHoldings']
    if len(funds) != 1 or len(portfolios) != 1:
        raise ValueError('Ambiguous LifeStrategy portfolio')
    profile = funds[0]['profile']
    if (profile['portId'] != str(code) or profile['fundCurrency'] != 'EUR'
            or profile['identifiers'] != [{'altId': 'ISIN', 'altIdValue': isin}]
            or profile['etfReplicationMethodology'] != 'Physical'
            or profile['assetClassificationLevel1'] != 'Balanced/Diversified'):
        raise ValueError('Wrong exact LifeStrategy portfolio identity or type')
    h = portfolios[0]['holdings']; items = h['items']
    if (h.get('lastItemKey') is not None or type(h.get('totalHoldings')) is not int
            or not 2 <= len(items) <= 100 or h['totalHoldings'] != len(items)):
        raise ValueError('Incomplete LifeStrategy portfolio; no partial page admitted')
    totals = {'Actions': Decimal(0), 'Obligations': Decimal(0), 'Liquidités': Decimal(0)}
    rows, excluded, dates, seen = [], [], set(), set()
    for item in items:
        stamp = document_date(item['effectiveDate'], now)
        dates.add(stamp)
        amount = weight(item['marketValuePercentage'])
        if not isinstance(item.get('securityLongDescription'), str) or not item['securityLongDescription']:
            raise ValueError('Unidentified LifeStrategy source position')
        kind, child = item['securityType'], item['isin']
        if kind == 'EQ.ETF':
            key = (child, item.get('sedol1'))
            if key in seen or not item.get('sedol1') or amount < 0:
                raise ValueError('Repeated or short LifeStrategy underlying fund')
            seen.add(key)
            category = 'Actions' if child in EQUITY_FUNDS else 'Obligations' if child in BOND_FUNDS else None
            if category is None:
                raise ValueError('Unqualified exact LifeStrategy underlying share: ' + str(child))
            totals[category] += amount
            rows.append({'isin': child, 'name': item['securityLongDescription'],
                         'weightPct': float(amount), 'assetCategory': category,
                         'sedol': item['sedol1']})
        elif kind in ('CRNY', 'CT.SPOT') and child is None:
            totals['Liquidités'] += amount
            excluded.append(dict(item))  # Signed cash/settlement positions are not zeroed.
        else:
            raise ValueError('Unqualified LifeStrategy portfolio position type: ' + str(kind))
    net = sum(totals.values())
    if len(dates) != 1 or abs(net - 100) > Decimal(len(items)) * Decimal('0.000005'):
        raise ValueError('LifeStrategy mixed dates or unreconciled original NAV weights')
    stamp = dates.pop(); allocation = record['assetAllocation']
    observed = {r['name']: Decimal(str(r['weightPct'])) for r in allocation['rows']}
    if allocation['asOf'] != stamp or observed != displayed_allocation(totals):
        raise ValueError('LifeStrategy NAV positions and published asset allocation are not corroborated')
    return {'asOf': stamp, 'checkedAt': now.isoformat(), 'basis': 'fund',
            'sourceUrl': API, 'sha256': hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest(),
            'subjectIsin': isin, 'weightBasis': 'original-fund-nav-percentage',
            'complete': True, 'sourceRowCount': len(items), 'publishedNetWeightPct': float(net),
            'rows': rows, 'nonFundPositions': excluded,
            'assetAllocationChecks': {name: {'originalNavWeightPct': float(totals[name]),
                'publishedDisplayPct': float(observed[name])} for name in totals},
            'normalizationApplied': False, 'sourceResponse': body,
            'method': 'Complete same-date issuer fund portfolio, exact held share ISINs and original fund-NAV weights; cash and signed settlement positions retained. Published 2dp asset allocation corroborated separately. Not a whole-fund company look-through or the rounded PDF allocation table.'}


def qualified_stored_portfolio(record, now):
    """Validate an acquired dependency without renewing its source-control date."""
    h = record.get('underlyingHoldings')
    if h is None:
        return None
    body = h['sourceResponse']
    digest = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
    if (digest != h['sha256'] or h.get('sourceUrl') != API
            or h.get('subjectIsin') != record['isin'] or h.get('normalizationApplied') is not False
            or h.get('weightBasis') != 'original-fund-nav-percentage'):
        raise ValueError('LifeStrategy stored parent portfolio evidence changed')
    code = body['data']['funds'][0]['profile']['portId']
    check = parse_portfolio(body, (None, code, record['isin']), record, now)
    for field in ['rows', 'nonFundPositions', 'asOf', 'assetAllocationChecks', 'sourceRowCount', 'publishedNetWeightPct']:
        if h[field] != check[field]:
            raise ValueError('LifeStrategy portfolio field differs from its acquired source: ' + field)
    return h
