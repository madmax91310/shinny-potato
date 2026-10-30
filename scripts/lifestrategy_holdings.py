"""Exact published fund look-through, preserving portfolio NAV weights and dates."""
import datetime as dt
import hashlib
import json
from collect_physical_holdings import checked_rows, finite_weight

# These exact issuer fund labels already identify the allocation underliers in
# derive-exposure-sleeves.mjs. North America is a fund-level, unhedged portfolio.
EQUITIES = {
    'Vanguard FTSE All-World UCITS ETF (USD) Accumulating': 'IE00BK5BQT80',
    'Vanguard FTSE Developed World UCITS ETF (USD) Accumulating': 'IE00BK5BQV03',
    'Vanguard FTSE Emerging Markets UCITS ETF (USD) Accumulating': 'IE00BK5BR733',
    'Vanguard FTSE Developed Europe UCITS ETF (EUR) Accumulating': 'IE00BK5BQX27',
    'Vanguard S&P 500 UCITS ETF (USD) Accumulating': 'IE00BFMXXD54',
    'Vanguard FTSE North America UCITS ETF': 'IE00BKX55R35',
    'Vanguard FTSE Japan UCITS ETF (USD) Accumulating': 'IE00BFMXYX26',
    'Vanguard FTSE Developed Asia Pacific ex Japan UCITS ETF (USD) Accumulating': 'IE00BK5BQZ41',
}
BONDS = {
    'Vanguard USD Treasury Bond UCITS ETF EUR Hedged Accumulating',
    'Vanguard Global Aggregate Bond UCITS ETF EUR Hedged Accumulating',
    'Vanguard EUR Eurozone Government Bond UCITS ETF (EUR) Accumulating',
    'Vanguard USD Corporate Bond UCITS ETF EUR Hedged Accumulating',
    'Vanguard EUR Corporate Bond UCITS ETF (EUR) Accumulating',
    'Vanguard U.K. Gilt UCITS ETF EUR Hedged Accumulating',
}
FUNDS = {'IE00BMVB5K07', 'IE00BMVB5M21', 'IE00BMVB5P51', 'IE00BMVB5R75'}


def fresh(observation, now):
    date = dt.date.fromisoformat(observation['asOf'])
    checked = dt.datetime.fromisoformat(observation['checkedAt']).date()
    if (not observation.get('sourceUrl') or not 0 <= (now.date()-date).days <= 93
            or not 0 <= (now.date()-checked).days <= 35):
        raise ValueError('Stale or unsourced LifeStrategy dependency')
    return date.isoformat()


def derive(isin, record, underliers, errors, now):
    if isin not in FUNDS or record['isin'] != isin or record['currency'] != 'EUR':
        raise ValueError('Wrong LifeStrategy exact share')
    holdings, allocation = record['holdings'], record['assetAllocation']
    dates = [fresh(holdings, now), fresh(allocation, now)]
    if not record.get('documentSha256'):
        raise ValueError('LifeStrategy fund holdings lack document evidence')
    if dates[0] != dates[1]:
        raise ValueError('LifeStrategy fund weights and asset allocation dates differ')
    allocation_rows = {r['name']: finite_weight(r['weightPct']) for r in allocation['rows']}
    if len(allocation_rows) != len(allocation['rows']) or set(allocation_rows) != {'Actions', 'Obligations', 'Liquidités'}:
        raise ValueError('Unqualified LifeStrategy asset allocation')
    if any(v < 0 for v in allocation_rows.values()) or abs(sum(allocation_rows.values())-100) > .05:
        raise ValueError('Invalid LifeStrategy allocation weights')
    fund_rows = holdings['rows']
    if len({r['name'] for r in fund_rows}) != len(fund_rows):
        raise ValueError('Repeated LifeStrategy underlying fund')
    equity_weight = bond_weight = 0
    for row in fund_rows:
        weight = finite_weight(row['weightPct'])
        if not 0 <= weight <= 100:
            raise ValueError('Invalid LifeStrategy fund weight')
        if row['name'] in EQUITIES:
            equity_weight += weight
        elif row['name'] in BONDS:
            bond_weight += weight
        else:
            raise ValueError('Unqualified LifeStrategy underlying fund: ' + row['name'])
    # Fund holdings are published to one decimal; retain that rounding.
    tolerance = len(fund_rows) * .05 + .02
    if (abs(equity_weight-allocation_rows['Actions']) > tolerance
            or abs(bond_weight-allocation_rows['Obligations']) > tolerance
            or abs(equity_weight+bond_weight+allocation_rows['Liquidités']-100) > tolerance):
        raise ValueError('Missing or inconsistent LifeStrategy fund weights')
    rows, dependencies = {}, []
    sources = {holdings['sourceUrl'], allocation['sourceUrl']}
    for fund in fund_rows:
        key = EQUITIES.get(fund['name'])
        if key is None or fund['weightPct'] == 0:
            continue
        if key in errors:
            raise ValueError('LifeStrategy dependency collection failed: ' + key)
        source = underliers.get(key)
        if not source or source.get('complete') is not True or not source.get('sha256'):
            raise ValueError('Missing complete LifeStrategy equity dependency: ' + key)
        stamp = fresh(source, now)
        # Same reporting date: no implied trading history between mismatched snapshots.
        if stamp != holdings['asOf']:
            raise ValueError('LifeStrategy and underlying portfolio dates differ: ' + key)
        securities = checked_rows(source['rows'], minimum=11)
        dates.append(stamp)
        sources.add(source['sourceUrl'])
        dependencies.append(dict(isin=key, weightPct=fund['weightPct'], asOf=stamp,
                                 checkedAt=source['checkedAt'], sourceUrl=source['sourceUrl'],
                                 sha256=source['sha256']))
        for security in securities:
            target = rows.setdefault(security['isin'], dict(
                isin=security['isin'], name=security['name'], weightPct=0))
            target['weightPct'] += fund['weightPct'] * security['weightPct'] / 100
    final = checked_rows(sorted(rows.values(), key=lambda r: -r['weightPct']), minimum=11)
    total = sum(r['weightPct'] for r in final)
    if total > equity_weight + .1:
        raise ValueError('LifeStrategy equity exposure exceeds its published fund weights')
    evidence = dict(isin=isin, documentSha256=record['documentSha256'],
                    holdings=holdings, allocation=allocation, dependencies=dependencies)
    controls=[holdings['checkedAt'],allocation['checkedAt'],*(d['checkedAt']for d in dependencies)]
    def control_time(value):
        stamp=dt.datetime.fromisoformat(value.replace('Z','+00:00'))
        return (stamp if stamp.tzinfo else stamp.replace(tzinfo=dt.timezone.utc)).timestamp()
    return dict(rows=final, asOf=min(dates), sourceUrl=holdings['sourceUrl'], sourceUrls=sorted(sources),
                checkedAt=min(controls,key=control_time),validatedAt=now.isoformat(),
                basis='fund', complete=True, scope='equity-lookthrough',
                equitySleeveWeightPct=allocation_rows['Actions'],
                excludedWeightPctByType={'Bonds': allocation_rows['Obligations'],
                                         'Cash': allocation_rows['Liquidités'],
                                         'Underlying non-equity positions': equity_weight-total},
                dependencies=dependencies, sha256=hashlib.sha256(json.dumps(evidence, sort_keys=True).encode()).hexdigest(),
                method='Complete equity look-through through exact published Vanguard underliers at the same reporting date; original rounded fund NAV weights; bonds, cash and underlying derivatives excluded; no renormalisation')
