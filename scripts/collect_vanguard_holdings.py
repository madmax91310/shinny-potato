"""Vanguard GPX fund holdings: paginated bonds, never the creation basket."""
import hashlib
import json
import math
import re
from data_automation import reject
from issuer_documents import document_date, validated_rows

QUERY = '''query FundsHoldingsQuery($portIds: [String!], $lastItemKey: String) {
  funds(portIds: $portIds) { profile {
    portId fundCurrency identifiers(altIds: ["ISIN"]) { altId altIdValue }
  } }
  borHoldings(portIds: $portIds) {
    holdings(limit: 1500, lastItemKey: $lastItemKey) {
      items { securityLongDescription marketValuePercentage sedol1
        securityType finalMaturity effectiveDate couponRate }
      totalHoldings lastItemKey
    }
  }
}'''


def parse_pages(pages, share, now):
    from collect_vanguard_etf import API
    rows, totals, dates, cursors = [], set(), set(), set()
    for index, page in enumerate(pages):
        if page.get('errors'):
            reject('Vanguard holdings query failed')
        funds = page['data']['funds']
        portfolios = page['data']['borHoldings']
        if len(funds) != 1 or len(portfolios) != 1:
            reject('Missing or duplicate Vanguard holdings portfolio')
        profile = funds[0]['profile']
        if (profile['portId'] != str(share['productCode'])
                or profile['fundCurrency'] != share['currency']
                or profile['identifiers'] != [{'altId': 'ISIN', 'altIdValue': share['isin']}]):
            reject('Wrong Vanguard holdings exact share/currency')
        data = portfolios[0]['holdings']
        total = data['totalHoldings']
        if isinstance(total, bool) or not isinstance(total, int) or not 10 <= total <= 15000:
            reject('Invalid Vanguard holdings count')
        totals.add(total)
        cursor = data['lastItemKey']
        if cursor:
            if not isinstance(cursor, str) or cursor in cursors or index == len(pages)-1:
                reject('Incomplete or repeated Vanguard holdings pagination')
            cursors.add(cursor)
        elif index != len(pages)-1:
            reject('Unexpected Vanguard page after final cursor')
        if not data['items'] or len(data['items']) > 1500:
            reject('Empty or oversized Vanguard holdings page')
        for item in data['items']:
            weight = item['marketValuePercentage']
            if (isinstance(weight, bool) or not isinstance(weight, (int, float))
                    or not math.isfinite(weight) or not -1 <= weight <= 100):
                reject('Invalid Vanguard holding weight')
            dates.add(document_date(item['effectiveDate'], now))
            rows.append(item)
    if len(totals) != 1 or len(rows) != next(iter(totals)) or len(dates) != 1:
        reject('Truncated, changing or mixed-date Vanguard portfolio')
    if not 99 <= sum(r['marketValuePercentage'] for r in rows) <= 101:
        reject('Incomplete Vanguard portfolio weights')
    bonds = [r for r in rows if r['securityType'] == 'FI.CORP']
    codes = [r['sedol1'] for r in bonds if r['sedol1']]
    identities = [r['sedol1'] or (r['securityLongDescription'], r['couponRate'], r['finalMaturity']) for r in bonds]
    if not bonds or any(not isinstance(c, str) or not re.fullmatch(r'[A-Z0-9]{7}', c) for c in codes) or len(set(identities)) != len(identities):
        reject('Missing or duplicate Vanguard bond security identity')
    top = []
    for item in sorted(bonds, key=lambda r: -r['marketValuePercentage'])[:10]:
        name, coupon, maturity = item['securityLongDescription'], item['couponRate'], item['finalMaturity']
        if (not name or isinstance(coupon, bool) or not isinstance(coupon, (int, float))
                or not math.isfinite(coupon) or not 0 <= coupon <= 100
                or not item['sedol1']
                or not isinstance(maturity, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', maturity)):
            reject('Incomplete Vanguard bond description')
        import datetime as dt
        dt.date.fromisoformat(maturity)
        if item['marketValuePercentage'] <= 0:
            reject('Non-positive Vanguard top bond weight')
        top.append({'name': f"{name} · {coupon:g}% · {maturity} · {item['sedol1']}",
                    'weightPct': item['marketValuePercentage'], 'sedol': item['sedol1'],
                    'couponPct': coupon, 'maturityDate': maturity})
    if len(top) != 10:
        reject('Incomplete Vanguard top-ten bond positions')
    return {'asOf': dates.pop(), 'basis': 'fund', 'sourceUrl': API,
            'method': 'Ten largest individual corporate bond securities by percent of fund NAV; cash and futures excluded, no renormalisation; published SEDOL, coupon and maturity retained',
            'sha256': hashlib.sha256(json.dumps(pages, sort_keys=True, allow_nan=False).encode()).hexdigest(),
            'rows': validated_rows(top, complete=False)}


def collect_one(share, now, fetch=None):
    from collect_vanguard_etf import fetch_query
    fetch = fetch or fetch_query
    pages, cursor, seen = [], None, set()
    for _ in range(10):
        page = fetch(QUERY, {'portIds': [str(share['productCode'])], 'lastItemKey': cursor}, 'FundsHoldingsQuery')
        pages.append(page)
        if page.get('errors'):
            reject('Vanguard holdings query failed: ' + str(page['errors'])[:300])
        portfolios = page['data']['borHoldings']
        if len(portfolios) != 1:
            reject('Missing or duplicate Vanguard portfolio')
        cursor = portfolios[0]['holdings']['lastItemKey']
        if not cursor:
            return parse_pages(pages, share, now)
        if not isinstance(cursor, str) or cursor in seen:
            reject('Repeated Vanguard holdings cursor')
        seen.add(cursor)
    reject('Vanguard holdings pagination limit exceeded')
