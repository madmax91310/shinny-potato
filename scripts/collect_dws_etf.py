"""DWS official product API: exact-share returns, dated fund AUM and physical holdings."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import json
import pathlib
import re
import hashlib
import math
import io
import zipfile
import xml.etree.ElementTree as ET
from urllib.parse import urlencode
from zoneinfo import ZoneInfo
from data_automation import UTC, get_text, number, reject, write_json_atomic
from issuer_documents import bounded_return, document_date, validated_rows, download
from apply_etf_collection import apply
from dws_liquidity_funds import SOURCES as LIQUIDITY_FUNDS

ROOT = pathlib.Path(__file__).resolve().parents[1]

# Explicit GICS industry-to-sector relationships for the two sector funds.
# Unknown classifications remain unknown; do not infer a sector from a company name.
INDUSTRY_SECTORS = {
    **{name:'Utilities' for name in ['Electric Utilities','Gas Utilities','Multi-Utilities','Water Utilities','Independent Power Producers & Energy Traders','Renewable Electricity']},
    **{name: 'Industrials' for name in ['Aerospace & Defense', 'Electrical Components & Equipment',
       'Industrial Machinery & Supplies & Components', 'Construction Machinery & Heavy Transportation Equipment',
       'Trading Companies & Distributors', 'Industrial Conglomerates', 'Heavy Electrical Equipment',
       'Rail Transportation', 'Building Products', 'Construction & Engineering', 'Human Resource & Employment Services',
       'Air Freight & Logistics', 'Research & Consulting Services', 'Environmental & Facilities Services',
       'Agricultural & Farm Machinery', 'Passenger Ground Transportation', 'Diversified Support Services',
       'Cargo Ground Transportation', 'Marine Transportation', 'Passenger Airlines', 'Data Processing & Outsourced Services',
       'Highways & Railtracks', 'Airport Services', 'Security & Alarm Services', 'Commercial Printing']},
    **{name: 'Materials' for name in ['Diversified Metals & Mining', 'Gold', 'Specialty Chemicals',
       'Industrial Gases', 'Construction Materials', 'Steel', 'Copper',
       'Paper & Plastic Packaging Products & Materials', 'Diversified Chemicals',
       'Fertilizers & Agricultural Chemicals', 'Commodity Chemicals',
       'Metal, Glass & Plastic Containers', 'Paper Products', 'Aluminum', 'Forest Products', 'Silver']},
    **{name: 'Health Care' for name in ['Pharmaceuticals', 'Health Care Facilities',
       'Health Care Technology', 'Life Sciences Tools & Services', 'Health Care Services',
       'Health Care Supplies', 'Health Care Distributors', 'Health Care Equipment',
       'Biotechnology', 'Managed Health Care']},
    'Oil & Gas Refining & Marketing': 'Energy', 'Unknown': 'Unassigned',
}


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
        if key in ['ISIN', 'Share class currency', 'Income treatment', 'Fund all-in fee (TER)', 'Investment methodology', 'Share class launch date', 'Fund domicile', 'UCITS compliant']:
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
              'replication': facts.get('Investment methodology'),
              'unavailable': ['aum: no separately published valuation date/currency qualified',
                              'composition: physical securities portfolio not yet collected' if facts.get('Investment methodology') == 'Direct Replication (physically)' else 'composition: synthetic substitute basket excluded; tracked index exposure not qualified']}
    result['characteristics'] = {'terPct':ter, 'index':index, 'distribution':facts['Income treatment']}
    for field, key in [('domicile','Fund domicile'),('replicationMethod','Investment methodology'),('inceptionDate','Share class launch date')]:
        if facts.get(key): result['characteristics'][field] = facts[key]
    if share.get('collectIdentity'):
        if facts.get('UCITS compliant') is not True or not facts.get('Fund domicile') or not index:
            reject('Incomplete DWS exact-share identity')
        trading = [a for a in sections['keyFacts']['accordionItems'] if a['id']=='fundinformation-tradinginformation']
        if len(trading)!=1:reject('Ambiguous DWS listing table')
        mics={'XETRA':'XETR','London Stock Exchange':'XLON','Borsa Italiana':'ETFP','SIX Swiss Exchange':'XSWX'}
        listings=[]
        for r in trading[0]['table']['values']:
            value=lambda k:r[k]['value']
            exchange=value('StockExchange');currency=value('Currency');ric=value('ReutersRic')
            if exchange not in mics or currency not in ('EUR','USD') or not ric or ric=='--':continue
            ticker=value('BloombergTicker').split()[0];mic=mics[exchange]
            listings.append({'ticker':ticker,'exchange':'Xetra' if mic=='XETR' else exchange,'mic':mic,'currency':currency,'symbol':ric,'sourceUrl':share['sourceUrl'],'checkedAt':now.date().isoformat(),'evidenceId':f'{share["isin"]}-{mic}-{ticker}-{currency}', 'excerpt':f'{share["isin"]} | {exchange} | {ticker} | {currency} | {ric}'})
        if not listings:reject('No identified DWS listing')
        result['characteristics']={'terPct':ter,'index':index,'distribution':facts['Income treatment'],'domicile':facts['Fund domicile'],'replicationMethod':facts['Investment methodology'],'inceptionDate':facts['Share class launch date'],'listings':listings}
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
    launch = facts.get('Share class launch date')
    inception = None
    if launch:
        # Some exact-share dates carry a merger explanation and an HTML footnote.
        # Use the leading share-class date, never a second date in that note.
        date = re.match(r'^(\d{2}/\d{2}/\d{4})(?:\s|<|$)', launch)
        if not date:
            reject('Invalid DWS share launch date')
        inception = dt.datetime.strptime(date[1], '%d/%m/%Y').date()
    for key, year in columns.items():
        if int(year) >= now.year:
            reject('Incomplete DWS current year')
        point = rows[0][key]
        if point['type'] == 'empty' or (inception and inception > dt.date(int(year), 1, 1)):
            continue
        years[year] = bounded_return(point['sortValue'])
    if years:
        result['performance'] = {'basis': 'fund', 'currency': share['currency'],
            'method': 'calendar-year NAV total return, income reinvested, net of fund fees', 'years': dict(sorted(years.items()))}
    return result


def parse_holdings(body, share, now, url, *, complete=False, non_equity_funds=None):
    tables = body.get('tables', [])
    if len(tables) != 1:
        reject('Missing/ambiguous DWS securities table')
    table = tables[0]
    columns = {c['key']: c['value'] for c in table['columns']}
    if columns != {'header': 'ISIN', 'column_0': 'Name', 'column_1': '% Weight',
                   'column_2': 'Market value', 'column_3': 'Country',
                   'column_4': 'Industry', 'column_5': 'Asset class'}:
        reject('DWS holdings columns changed')
    dates = re.findall(r'Source: DWS (\d{2}/\d{2}/\d{4})',
                      ' '.join(d['text'] for d in table.get('disclaimers', [])))
    if len(set(dates)) != 1:
        reject('Missing/ambiguous DWS holdings publication date')
    stamp = document_date(dates[0], now)
    positions = table['values']
    if not positions or len({p['header']['value'] for p in positions}) != len(positions):
        reject('Missing/duplicate DWS security identity')
    sectors, countries, holdings = {}, {}, []
    total = 0
    for p in positions:
        value = p['column_1']['sortValue']
        if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not -100 <= value <= 100:
            reject('Invalid DWS securities weight')
        asset = p['column_5']['value']
        if asset in ('Equities', 'Depository Receipts', 'Preferred Stock', 'Right', 'Real Estate Investment Trust'):
            if value < 0:
                reject('Unqualified DWS equity exposure')
            sector = INDUSTRY_SECTORS.get(p['column_4']['value'], p['column_4']['value'])
            country = p['column_3']['value']
            if country in (None, '', '--', 'Unknown'):
                country = 'Non classé'
            holdings.append({'name': p['column_0']['value'], 'isin': p['header']['value'], 'weightPct': value})
        elif asset in ('Cash', 'Future', 'FX Forward'):
            # Keep the net cash/derivative allocation; never renormalise equities.
            sector = country = 'Cash and/or Derivatives'
        elif asset in ('Mutual Fund', 'Warrants'):
            # Fund shares and warrants are securities, not direct equity holdings.
            # Preserve the published registration country and mark its sector
            # unassigned; no look-through exposure or cash equivalence is inferred.
            isin = p['header']['value']
            if value < 0 or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d', isin):
                reject('Unqualified DWS fund holding')
            sector = 'Unassigned'
            country = p['column_3']['value']
            if country in (None, '', '--', 'Unknown'): country = 'Non classé'
            holdings.append({'name': p['column_0']['value'], 'isin': isin,
                             'assetClass': asset, 'weightPct': value})
        else:
            reject('Unqualified DWS asset class: ' + asset)
        total += value
        sectors[sector] = sectors.get(sector, 0) + value
        countries[country] = countries.get(country, 0) + value
    if not 99 <= total <= 101 or len(holdings) < 10:
        reject('Truncated DWS securities portfolio')
    digest = hashlib.sha256(json.dumps(body, sort_keys=True, allow_nan=False).encode()).hexdigest()
    result = {}
    for field, groups in [('sectors', sectors), ('countries', countries)]:
        rows = [{'name': k, 'weightPct': round(v, 6)} for k, v in groups.items() if v != 0]
        if (len({r['name'] for r in rows}) != len(rows) or
            any(not math.isfinite(r['weightPct']) or not -100 <= r['weightPct'] <= 200 or
                (r['weightPct'] < 0 and r['name'] != 'Cash and/or Derivatives') for r in rows) or
            not 99 <= sum(r['weightPct'] for r in rows) <= 101):
            reject('Invalid complete DWS net allocation')
        result[field] = {'asOf': stamp, 'basis': 'fund', 'sourceUrl': url, 'sha256': digest, 'complete': True,
            'method': 'Full physical securities portfolio; registration country and industry; net cash/derivatives retained',
            'rows': sorted(rows, key=lambda r: -r['weightPct'])}
    if complete:
        excluded=[]
        for position in holdings:
            if position.get('assetClass') != 'Mutual Fund' and position['isin'] not in LIQUIDITY_FUNDS:continue
            evidence=(non_equity_funds or {}).get(position['isin'],{})
            if (evidence.get('isin')!=position['isin'] or evidence.get('kind')!='non-equity-money-market-fund'
                    or not re.fullmatch(r'[0-9a-f]{64}',evidence.get('sha256',''))
                    or not evidence.get('sourceUrl') or not evidence.get('asOf') or not evidence.get('checkedAt')):
                reject('Fund-of-funds look-through is not qualified')
            excluded.append({**position,'qualification':evidence})
        if sum(p['weightPct'] for p in holdings) > 100.5:
            reject('Non-long-only complete DWS portfolio')
        excluded_ids={p['isin'] for p in excluded}
        direct=[dict(p) for p in holdings if p['isin'] not in excluded_ids]
        if len(direct)<10:reject('Incomplete direct DWS equity list')
        result['completeHoldings'] = {'asOf': stamp, 'basis': 'fund', 'sourceUrl': url,
            'sha256': digest, 'complete': True, 'rows': direct,
            'excludedPositions':excluded,'excludedNonEquityFundWeightPct':sum(p['weightPct'] for p in excluded),
            'method':'Complete physical securities; qualified non-equity money-market fund shares and net cash/derivatives excluded; original fund NAV weights, no renormalisation',
            'sourceUrls':[url,*sorted({p['qualification']['sourceUrl'] for p in excluded})]}
    holdings = sorted(holdings, key=lambda r: -r['weightPct'])[:10]
    names = [p['name'] for p in holdings]
    for p in holdings:
        if names.count(p['name']) > 1:
            p['name'] += ' (' + p['isin'] + ')'
    validated_rows(holdings, complete=False)
    result['holdings'] = {'asOf': stamp, 'basis': 'fund', 'sourceUrl': url, 'sha256': digest, 'rows': holdings}
    return result


def parse_aum_workbook(body, share, now, url, product):
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(io.BytesIO(body)) as book:
        if sum(i.file_size for i in book.infolist()) > 30_000_000:
            reject('Oversized DWS workbook')
        strings = [''.join(n.itertext()) for n in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('s:si', ns)]
        sheets = [n for n in book.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', n)]
        if len(sheets) != 1:
            reject('Ambiguous DWS historical workbook')
        rows = []
        for row in ET.fromstring(book.read(sheets[0])).findall('.//s:sheetData/s:row', ns):
            cells = {}
            for cell in row:
                value = cell.find('s:v', ns)
                if value is not None:
                    if cell.find('s:f', ns) is not None:
                        reject('Unexpected DWS workbook formula')
                    cells[re.sub(r'\d', '', cell.attrib['r'])] = strings[int(value.text)] if cell.attrib.get('t') == 's' else value.text
            rows.append(cells)
    def header(label):
        values = [r.get('B') for r in rows if r.get('A') == label]
        if len(values) != 1:
            reject('Missing/duplicate DWS workbook identity')
        return values[0]
    if header('ISIN') != share['isin'] or header('Currency') != share['currency']:
        reject('DWS historical workbook share or currency changed')
    # This header dates the export, not its valuations. DWS rolls it over at
    # European midnight while the runner may still be on the preceding UTC day.
    # Keep the actual AUM/NAV dates below subject to the original UTC checks.
    export_date = document_date(header('As of').replace('.', '/'),
                                now.astimezone(ZoneInfo('Europe/Berlin')))
    headings = [i for i, row in enumerate(rows) if row.get('A') == 'Date']
    if len(headings) != 1 or rows[headings[0]].get('B') != 'Asset Under Management':
        reject('DWS workbook AUM column changed')
    points = []
    for row in rows[headings[0]+1:]:
        if not re.fullmatch(r'\d{2}\.\d{2}\.\d{4}', row.get('A', '')):
            continue
        stamp = document_date(row['A'].replace('.', '/'), now)
        points.append((stamp, number(float(row['B']))))
    if not points or len({date for date, _ in points}) != len(points):
        reject('Missing/duplicate DWS historical AUM dates')
    stamp, amount = max(points)
    if export_date < stamp:
        reject('DWS export predates its AUM valuation')
    # The product explicitly labels its AUM as FUND, not share-class. The
    # historical download supplies this field in the stated workbook currency.
    facts = {i['key']: i['value'] for i in items(product['pdpResult']['pageSections']['keyFacts'])}
    if 'Total AUM of fund' not in facts or document_date(facts['NAV date'], now) != stamp:
        reject('DWS dated fund-AUM context does not match the workbook')
    return {'amount': amount, 'currency': share['currency'], 'scope': 'fund', 'asOf': stamp,
            'exportDate': export_date, 'exportTimezone': 'Europe/Berlin',
            'sourceUrl': url, 'sha256': hashlib.sha256(body).hexdigest(),
            'method': 'DWS dated historical fund AUM, all share classes, workbook currency; not exact-share assets'}


def collect_one(share, now, fetch=get_text, fetch_document=download):
    body = json.loads(fetch(share['sourceUrl'], ('application/json',), 3_000_000),
                      parse_constant=lambda _: reject('Non-finite issuer JSON'))
    result = parse_product(body, share, now)
    history_url = share['sourceUrl'].split('?', 1)[0].rsplit('/', 1)[0] + '/historicaldata/download'
    query = urlencode({'startDate': (now.date()-dt.timedelta(days=14)).isoformat(),
                       'endDate': now.date().isoformat(), 'includeTax': 'false'})
    try:
        result['aum'] = parse_aum_workbook(fetch_document(history_url + '?' + query), share, now, history_url, body)
        result['unavailable'] = [v for v in result['unavailable'] if not v.startswith('aum:')]
    except Exception as error:
        result['unavailable'].append('aum: ' + str(error))
    if result.get('replication') == 'Direct Replication (physically)':
        url = share['sourceUrl'].split('?', 1)[0].rsplit('/', 1)[0] + '/holdings'
        try:
            holdings = json.loads(fetch(url, ('application/json',), 8_000_000),
                                  parse_constant=lambda _: reject('Non-finite DWS holdings JSON'))
            result.update(parse_holdings(holdings, share, now, url))
            result['unavailable'] = [v for v in result['unavailable'] if not v.startswith('composition:')]
        except Exception as error:
            result['unavailable'].append('composition: ' + str(error))
    return result
