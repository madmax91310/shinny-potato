"""Exact-share official NAV evidence. Never label these valuations as exchange quotes."""
import datetime as dt
import io
import json
import math
import pathlib
import re
import xml.etree.ElementTree as ET
import zipfile
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[1]
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def positive(value):
    if isinstance(value, bool):
        raise ValueError('Boolean NAV')
    result = float(value)
    if not math.isfinite(result) or result <= 0:
        raise ValueError('Invalid official NAV')
    return result


def xlsx_rows(body):
    """Read cells, including inline strings; reject formulas and ambiguous sheets."""
    with zipfile.ZipFile(io.BytesIO(body)) as book:
        if sum(i.file_size for i in book.infolist()) > 35_000_000:
            raise ValueError('Oversized NAV workbook')
        shared = ([''.join(n.itertext()) for n in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('s:si', NS)]
                  if 'xl/sharedStrings.xml' in book.namelist() else [])
        sheets = [n for n in book.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', n)]
        if len(sheets) != 1:
            raise ValueError('Ambiguous NAV workbook')
        result = []
        for row in ET.fromstring(book.read(sheets[0])).findall('.//s:row', NS):
            values = {}
            for cell in row:
                if cell.find('s:f', NS) is not None:
                    raise ValueError('Formula in NAV workbook')
                key = re.sub(r'\d', '', cell.attrib['r'])
                node = cell.find('s:v', NS)
                value = node.text if node is not None else ''.join(cell.itertext())
                values[key] = shared[int(value)] if cell.attrib.get('t') == 's' else value
            result.append(values)
        return result


def unique(values, name):
    if len(values) != 1:
        raise ValueError('Missing/ambiguous official ' + name)
    return values[0]


def dated(rows, now):
    values = {}
    for date, value in rows:
        day = dt.date.fromisoformat(date)
        if day > now.date() or date in values:
            raise ValueError('Duplicate or future official NAV date')
        values[date] = positive(value)
    if len(values) < 2:
        raise ValueError('Missing official daily observations')
    return dict(sorted(values.items()))


def dws_nav(body, isin, currency, now):
    rows = xlsx_rows(body)
    for field, expected in [('ISIN', isin), ('Currency', currency)]:
        if unique([r.get('B') for r in rows if r.get('A') == field], field) != expected:
            raise ValueError('Wrong DWS NAV identity/currency')
    unique([r for r in rows if r.get('A') == 'Date' and r.get('C') == 'NAV'], 'DWS NAV column')
    return dated([(dt.datetime.strptime(r['A'], '%d.%m.%Y').date().isoformat(), r['C'])
                  for r in rows if re.fullmatch(r'\d{2}\.\d{2}\.\d{4}', r.get('A', ''))], now)


def ssga_nav(body, isin, currency, now):
    rows = xlsx_rows(body)
    for field, expected in [('ISIN:', isin), ('NAV Currency:', currency)]:
        if unique([r.get('B') for r in rows if r.get('A') == field], field) != expected:
            raise ValueError('Wrong State Street NAV identity/currency')
    unique([r for r in rows if r.get('A') == 'Date' and r.get('B') == 'NAV'], 'State Street NAV column')
    return dated([(dt.datetime.strptime(r['A'], '%d-%b-%Y').date().isoformat(), r['B'])
                  for r in rows if re.fullmatch(r'\d{2}-[A-Za-z]{3}-\d{4}', r.get('A', ''))], now)


def blackrock_nav(body, isin, currency, now):
    components = body['componentsByNameMap']
    facts = components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value'] != isin:
        raise ValueError('Wrong BlackRock exact share')
    chart = components['performance']['containersByNameMap']['chart']['dataPointsByNameMap']
    calendar = components['performance']['containersByNameMap']['returns']['subContainersByNameMap']['calendar']['dataPointsByNameMap']
    # Chart and calendar currencies are checked independently of the fund base currency.
    if chart['currencySymbol']['value'] != currency or calendar['returnsByCurrency']['value']['annualNav'] != currency:
        raise ValueError('Official chart/calendar currency mismatch')
    def points(key):
        p = chart[key]
        if len(p['asOfDate']) != len(p['value']):
            raise ValueError('Misaligned official daily observations')
        return dated([(dt.datetime.strptime(str(d), '%Y%m%d').date().isoformat(), v)
                      for d, v in zip(p['asOfDate'], p['value']) if v is not None], now)
    nav, total = points('navData'), points('performanceData')
    inception = facts.get('inceptionDate', {}).get('value')
    if inception:
        start = dt.datetime.strptime(str(inception), '%Y%m%d').date().isoformat()
        nav = {d: v for d, v in nav.items() if d >= start}
        total = {d: v for d, v in total.items() if d >= start}
    years, types = {}, calendar['returnTypes']['value']
    column = unique([i for i, t in enumerate(types) if t == 'annualNav'], 'annual NAV return')
    for p in calendar.values():
        if not isinstance(p, dict) or not p.get('active') or not re.fullmatch(r'\d{4}1231', str(p.get('asOfDate', ''))):
            continue
        if not isinstance(p.get('value'), list) or len(p['value']) != len(types):
            raise ValueError('Annual NAV columns changed')
        if p['value'][column] is not None:
            years[str(p['asOfDate'])[:4]] = float(p['value'][column])
    return {'nav': nav, 'totalReturn': total, 'years': years,
            'inception': str(inception) if inception else None,
            'distribution': facts.get('useOfProfitsCode', {}).get('value')}


def wisdomtree_nav(body, now):
    if not isinstance(body, list) or any(not isinstance(r, dict) or set(r) != {'dt', 'nav', 'closePrice', 'premiumDiscountToNav', 'pdIndicator'} for r in body):
        raise ValueError('WisdomTree historical NAV contract changed')
    return dated([(r['dt'], r['nav']) for r in body if r['nav'] is not None], now)


def wisdomtree_identity(html, isin):
    """Read the public server-provided product, not translations or a related fund."""
    parts = []
    for script in BeautifulSoup(html, 'html.parser').find_all('script'):
        text = script.get_text()
        if text.startswith('self.__next_f.push(') and text.endswith(')'):
            values = json.loads(text[len('self.__next_f.push('):-1])
            if len(values) == 2 and values[0] == 1 and isinstance(values[1], str):
                parts.append(values[1])
    found = []
    def visit(node):
        if isinstance(node, dict):
            if node.get('ISIN') == isin and 'wtClassID' in node:
                found.append(node)
            for child in node.values():
                visit(child)
        elif isinstance(node, list):
            for child in node:
                visit(child)
    for line in ''.join(parts).splitlines():
        try:
            model = json.loads(line.split(':', 1)[1])
        except (ValueError, IndexError):
            continue  # Flight import/text records are not JSON product models.
        visit(model)
    ids = {str(row['wtClassID']) for row in found}
    if len(ids) != 1 or not all(str(row['wtClassID']).isdigit() for row in found):
        raise ValueError('Missing/ambiguous official WisdomTree share class')
    if len({row['fundCurrency'] for row in found}) != 1:
        raise ValueError('Conflicting official NAV currencies')
    return found[0]


def vaneck_nav(body, title, now):
    rows = xlsx_rows(body)
    unique([r for r in rows if r.get('A') == title], 'VanEck fund title')
    unique([r for r in rows if r.get('A') == 'Date' and r.get('B') == 'NAV'], 'VanEck NAV column')
    return dated([(dt.datetime.strptime(r['A'], '%d/%m/%Y').date().isoformat(), r['B'])
                  for r in rows if re.fullmatch(r'\d{2}/\d{2}/\d{4}', r.get('A', ''))], now)


def calendar_boundaries(points, year):
    def last(y):
        candidates = [d for d in points if d.startswith(str(y) + '-12-')]
        if not candidates:
            raise ValueError('Missing official December boundary')
        result = max(candidates)
        if int(result[-2:]) < 24:
            raise ValueError('Official December boundary too early')
        return result
    return last(year - 1), last(year)


def calendar_checks(points, years, precision, now, identity_from=None):
    result = []
    for year, expected in sorted(years.items()):
        year = int(year)
        if year >= now.year or identity_from and f'{year}-01-01' < identity_from:
            continue
        try:
            start, end = calendar_boundaries(points, year)
        except ValueError:
            continue
        actual = (points[end] / points[start] - 1) * 100
        # Contract of the *published rounding*, not the audit's alert threshold.
        digits = precision[str(year)] if isinstance(precision, dict) else precision
        rounding = .5 * 10 ** (-digits) + .0001
        if abs(actual - expected) > rounding:
            raise ValueError(f'Official daily/annual convention disagreement: {year}: {actual} / {expected}')
        result.append({'year': year, 'start': start, 'end': end, 'startValue': points[start],
                       'endValue': points[end], 'dailyDerived': actual, 'published': expected,
                       'publishedDecimalPlaces': digits})
    if not result:
        raise ValueError('No independent published annual convention check available')
    return result


def monthly(points, source_currency, currency, start, now, fx=None):
    end = now.strftime('%Y-%m')
    final = {}
    for day, value in sorted(points.items()):
        key = day[:7]
        if start <= key < end:
            final[key] = (day, value)
    expected = []
    date = dt.date.fromisoformat(start + '-01')
    while date.strftime('%Y-%m') < end:
        expected.append(date.strftime('%Y-%m'))
        date = dt.date(date.year + (date.month == 12), date.month % 12 + 1, 1)
    if list(final) != expected:
        raise ValueError('Official NAV monthly coverage is incomplete')
    result, proof = [], []
    for key, (day, value) in final.items():
        if int(day[-2:]) < 24:
            raise ValueError('Official month-end NAV too early')
        factor = 1
        rate_date = None
        if source_currency != currency:
            observation = fx['months'][key]
            factor = positive(observation['rates'][currency]) / positive(observation['rates'][source_currency])
            rate_date = observation['asOf']
        converted = value * factor
        result.append([key, converted])
        proof.append({'date': day, 'nav': value, 'navCurrency': source_currency, 'value': converted,
                      'currency': currency, 'fxAsOf': rate_date, 'fxFactor': factor})
    return result, proof
