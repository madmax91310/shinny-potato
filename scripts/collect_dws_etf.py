"""DWS official public product API: exact-share TER and calendar NAV total returns."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import json
import pathlib
import re
from data_automation import UTC, get_text, number, reject, write_json_atomic
from issuer_documents import bounded_return
from apply_etf_collection import apply

ROOT = pathlib.Path(__file__).resolve().parents[1]


def items(value):
    if isinstance(value, dict):
        if 'key' in value and 'value' in value:
            yield value
        for child in value.values():
            yield from items(child)
    elif isinstance(value, list):
        for child in value:
            yield from items(child)


def parse_product(body, share, now):
    sections = body['pdpResult']['pageSections']
    facts = {}
    for item in items(sections['keyFacts']):
        key = re.sub('<[^>]+>', '', item['key'])
        if key in ['ISIN', 'Share class currency', 'Income treatment', 'Fund all-in fee (TER)']:
            if key in facts:
                reject('Duplicate DWS characteristic')
            facts[key] = item['value']
    if facts['ISIN'] != share['isin'] or facts['Share class currency'] != share['currency']:
        reject('Wrong DWS share identity or currency')
    match = re.fullmatch(r'=?\s*([\d.]+)%', facts['Fund all-in fee (TER)'])
    if not match:
        reject('Unexpected DWS expense format')
    ter = number(float(match[1]), positive=False)
    if ter > 5:
        reject('Invalid DWS expenses')
    tabs = sections.get('performanceSection', {}).get('performanceTables', {}).get('tabs', [])
    tables = [t['table'] for t in tabs if t['header'] == 'Calendar year']
    if len(tables) > 1:
        reject('DWS calendar-year table missing or ambiguous')
    index = next((p['value'] for p in items(sections['indexKeyFacts']) if p['key'] == 'Index name'), None)
    result = {**share, 'productId': share['isin'], 'terPct': ter, 'index': index,
              'distribution': facts['Income treatment'],
              'unavailable': ['aum: no separately published valuation date/currency qualified',
                              'composition: public holdings API omits snapshot date']}
    if not tables:
        result['unavailable'].append('performance: calendar-year table not published')
        return result
    table = tables[0]
    columns = {c['key']: c['value'] for c in table['columns'] if re.fullmatch(r'\d{4}', c['value'])}
    if len(set(columns.values())) != len(columns):
        reject('Duplicate DWS calendar year')
    rows = [r for r in table['values'] if r.get('column_0', {}).get('value') == f"Total return ({share['currency']})"]
    if len(rows) != 1:
        reject('DWS exact-share total-return row missing')
    years = {}
    for key, year in columns.items():
        if int(year) >= now.year:
            reject('Incomplete DWS current year')
        point = rows[0][key]
        if point['type'] == 'empty':
            continue
        years[year] = bounded_return(point['sortValue'])
    if years:
        result['performance'] = {'basis': 'fund', 'currency': share['currency'],
            'method': 'calendar-year NAV total return, income reinvested, net of fund fees', 'years': dict(sorted(years.items()))}
    return result

