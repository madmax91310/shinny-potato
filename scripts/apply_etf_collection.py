"""Apply a fully validated issuer collection to the active shared ETF registry."""
import copy
import datetime as dt
import json
from data_automation import reject, write_json_atomic

SECTORS = {
    'Information Technology': 'Technologie', 'Financials': 'Finance',
    'Consumer Discretionary': 'Consommation cyclique', 'Consumer Staples': 'Consommation de base',
    'Industrials': 'Industrie', 'Materials': 'Matériaux', 'Communication': 'Communication',
    'Health Care': 'Santé', 'Energy': 'Énergie', 'Utilities': 'Services publics',
    'Real Estate': 'Immobilier', 'Cash and/or Derivatives': 'Liquidités et/ou dérivés', 'Other': 'Autres',
}


def merge_collection(report, current, baseline):
    next_records = copy.deepcopy(current)
    checked = report['checkedAt'][:10]
    for share in report['shares']:
        isin = share['isin']
        old = next_records.get(isin, {})
        if old and (old['currency'] != share['currency'] or old['productId'] != share['productId']):
            reject('Active automated share identity changed')
        record = {**old, 'currency': share['currency'], 'productId': share['productId'], 'sourceUrl': share['sourceUrl']}
        for field in ('aum', 'sectors', 'countries'):
            incoming = copy.deepcopy(share[field])
            if field != 'aum' and not incoming.get('rows'):
                continue  # Absence cannot erase or re-date a previously published value.
            active_date = old.get(field, {}).get('asOf') or baseline[isin].get(field + 'AsOf')
            if active_date and incoming['asOf'] < active_date:
                continue
            if field == 'sectors':
                for row in incoming['rows']:
                    if row['name'] not in SECTORS:
                        reject('Unknown issuer sector: ' + row['name'])
                    row['label'] = SECTORS[row['name']]
            previous = {k: v for k, v in old.get(field, {}).items() if k != 'checkedAt'}
            record[field] = old[field] if previous == incoming else {**incoming, 'checkedAt': checked}
        characteristics = {'terPct': share['terPct'], 'index': share['index'], 'distribution': share['distribution']}
        previous = {k: v for k, v in old.get('characteristics', {}).items() if k != 'checkedAt'}
        if checked >= old.get('characteristics', {}).get('checkedAt', ''):
            record['characteristics'] = old['characteristics'] if previous == characteristics else {**characteristics, 'checkedAt': checked}
        performance = share['performance']
        # Never silently change the currency/method or the 2020–2025 simulation window.
        if performance['currency'] != baseline[isin]['currency'] or performance['basis'] != 'fund':
            reject('Incompatible performance')
        if any(str(year) not in performance['years'] for year in range(2020, 2026)):
            reject('Incomplete active performance window')
        if checked >= (old.get('performance', {}).get('checkedAt') or baseline[isin].get('performanceCheckedAt') or ''):
            previous = {k: v for k, v in old.get('performance', {}).items() if k != 'checkedAt'}
            record['performance'] = old['performance'] if previous == performance else {**performance, 'checkedAt': checked}
        next_records[isin] = record
    return next_records


def apply(report, destination, baseline):
    current = json.loads(destination.read_text()) if destination.exists() else {}
    merged = merge_collection(report, current, baseline)
    if merged != current:
        write_json_atomic(destination, merged)
    return merged != current
