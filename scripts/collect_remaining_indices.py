"""Official Nikkei factsheets and STOXX price-return calendar histories."""
import datetime as dt
import gzip
import json
import re
from data_automation import UTC, reject, number
from issuer_documents import download, pdf_text, document_date, proof, validated_rows, bounded_return


def unique(values, label):
    if len(set(values)) != 1: reject('Missing or ambiguous ' + label)
    return values[0]


def nikkei_date(text, now):
    stamp = unique(re.findall(r'FS-(?:TR0|101)-(\d{8})', text), 'Nikkei publication date')
    return document_date(dt.datetime.strptime(stamp, '%Y%m%d').date().isoformat(), now)


def nikkei_composition(text, config, now):
    if not text.lstrip().startswith('Nikkei Stock Average') or 'price-weighted equity index' not in text:
        reject('Wrong Nikkei composition identity')
    stamp = nikkei_date(text, now)
    count = int(unique(re.findall(r'Number of Constituents\s+(\d+)', text), 'Nikkei constituent count'))
    holdings = []
    block = text.split('Top 10 Components by weight', 1)[1].split('Sector Weight', 1)[0]
    for line in block.splitlines():
        m = re.fullmatch(r'\s*(.+?)\s{2,}([A-Z0-9]{4})\s+(.+?)\s{2,}(\d+\.\d+)\s*', line)
        if m: holdings.append({'name': m[1], 'weightPct': float(m[4])})
    if len(holdings) != 10: reject('Incomplete Nikkei top-ten table')
    validated_rows(holdings, False)
    block = text.split('Sector Weight', 1)[1].split('Vendor Code', 1)[0]
    sectors = []
    for line in block.splitlines():
        m = re.match(r'\s*([A-Za-z /]+?)\s{2,}(\d+\.\d+)\s{2,}', line)
        if m: sectors.append({'name': m[1], 'weightPct': float(m[2])})
    validated_rows(sectors)
    return {'index': config['name'], 'asOf': stamp, 'constituents': count,
            'countries': [['🇯🇵 Japon', 100]], 'sectorMethod': 'Nikkei six-sector classification',
            'sectors': [[r['name'], r['weightPct']] for r in sectors],
            'holdings': [[r['name'], r['weightPct']] for r in holdings]}


def nikkei_returns(text, config, now):
    if not text.lstrip().startswith('Nikkei 225 Total Return Index') or config['returnVariant'] != 'TOTAL' or config['returnCurrency'] != 'JPY':
        reject('Wrong Nikkei calendar convention')
    stamp = nikkei_date(text, now)
    block = text.split('Annual Return', 1)[1].split('Risk Return', 1)[0]
    headers = [re.findall(r'20\d{2}', line) for line in block.splitlines() if len(re.findall(r'20\d{2}', line)) >= 5]
    if len(headers) != 1: reject('Missing Nikkei calendar header')
    years = headers[0]
    row = unique(re.findall(r'^\s*Nikkei 225 \(TR\)\s+(.+)$', block, re.M), 'Nikkei total-return row')
    values = re.findall(r'-?\d+\.\d+', row)
    # Last column is explicitly YTD and must not be treated as a completed year.
    if len(values) != len(years) + 1 or 'YTD' not in block or len(set(years)) != len(years) or any(int(y) >= now.year for y in years):
        reject('Invalid Nikkei calendar columns')
    return stamp, sorted([[int(y), bounded_return(float(v))] for y, v in zip(years, values)], reverse=True)


def stoxx_returns(body, config, now):
    if body[:2] == b'\x1f\x8b': body = gzip.decompress(body)
    if len(body) > 8_000_000: reject('Oversized STOXX page')
    text = body.decode()
    if "window.index_isin = '" + config['isin'] + "'" not in text or 'id="overview-symbol">' + config['symbol'] + '<' not in text or 'EUR (Price Return)' not in text:
        reject('Wrong STOXX exact index/price EUR convention')
    arrays = re.findall(r'window\.chart_data\s*=\s*(\[\[.*?\]\]);', text)
    if not arrays or any(json.loads(a) != json.loads(arrays[0]) for a in arrays): reject('Ambiguous STOXX daily series')
    rows = json.loads(arrays[0]); stamps = [r[0] for r in rows]
    if stamps != sorted(set(stamps)): reject('Duplicate or unordered STOXX daily observations')
    final = {}; newest = None
    for timestamp, value in rows:
        day = dt.datetime.fromtimestamp(number(timestamp) / 1000, UTC).date()
        if day > now.date(): reject('Future STOXX observation')
        newest = day
        if day.month == 12: final[day.year] = (day, number(value))
    if newest is None or (now.date() - newest).days > 10: reject('Stale STOXX history')
    expected = range(2020, now.year)
    returns = []
    for year in expected:
        if year not in final or year - 1 not in final: reject('Incomplete STOXX calendar history')
        for day, _ in [final[year], final[year - 1]]:
            if (dt.date(day.year, 12, 31) - day).days > 7: reject('Missing STOXX year-end session')
        returns.append([year, bounded_return(100 * (final[year][1] / final[year - 1][1] - 1))])
    stamp = document_date(newest.isoformat(), now)
    return stamp, sorted(returns, reverse=True)


def collect_one(config, now, fetch=download):
    result = {'id': config['id'], 'name': config['name'], 'errors': [], 'unavailable': []}
    if config.get('collectComposition'):
        try:
            if config.get('compositionParser') == 'amundi-index-document':
                from collect_index_extensions import collect_amundi_composition
                facts = collect_amundi_composition(config, now, fetch)
                body = None
            else:
                body = fetch(config['sourceUrl']); facts = nikkei_composition(pdf_text(body), config, now)
            if body is not None: facts['source'] = {'url': config['sourceUrl'], 'checkedAt': now.date().isoformat(), 'sha256': proof(body), 'label': 'Composition officielle automatisée · ' + config['name']}
            if body is not None: facts['provenance'] = 'Publication officielle Nikkei ; classification sectorielle propre à Nikkei.'
            result['facts'] = facts
        except Exception as e: result['errors'].append({'field': 'composition', 'reason': str(e), 'url': config.get('sourceUrl')})
    if config.get('returnSourceUrl'):
        try:
            body = fetch(config['returnSourceUrl'])
            if config['parser'] == 'nasdaq-factsheet':
                from collect_index_extensions import nasdaq_returns
                stamp, values = nasdaq_returns(pdf_text(body), config, now)
            elif config['parser'] == 'nikkei': stamp, values = nikkei_returns(pdf_text(body), config, now)
            elif config['parser'] == 'metal-benchmark': stamp, values = metal_benchmark_returns(pdf_text(body), config, now)
            elif config['parser'] in ('ssga-index', 'blackrock-index'): stamp, values = benchmark_page_returns(body, config, now)
            else: stamp, values = stoxx_returns(body, config, now)
            result['returns'] = {'asOf': stamp, 'currency': config['returnCurrency'], 'variant': config['returnVariant'], 'values': values,
                'periodStart': f'{min(y for y, _ in values)}-01-01', 'periodEnd': f'{max(y for y, _ in values)}-12-31',
                'source': {'url': config['returnSourceUrl'], 'checkedAt': now.date().isoformat(), 'sha256': proof(body), 'label': 'Rendements calendaires officiels automatisés · ' + config['name']},
                'performance': {'kind': config.get('kind','indice'), 'detail': config['performanceDetail'], 'date': stamp}}
        except Exception as e: result['errors'].append({'field': 'returns', 'reason': str(e), 'url': config['returnSourceUrl']})
    return result


def benchmark_page_returns(body, config, now):
    from collect_public_issuer import Page
    from collect_ssga_etf import Inputs, date
    text = gzip.decompress(body).decode() if body[:2] == b'\x1f\x8b' else body.decode()
    page = Page(text)
    if config['parser'] == 'ssga-index':
        parser = Inputs(); parser.feed(text)
        facts = parser.data['fund-quick-info']['attrs']
        if facts['isin']['value'] != config['isin'] or facts['base-fund-currency']['value'] != config['returnCurrency'] or facts['benchmark']['value'] != config['expectedIndex']:
            reject('Wrong State Street benchmark/currency/exact share')
        info = parser.data['index-quick-info']['attrs']
        if info['index-name']['value'] != config['expectedIndex']: reject('State Street index identity changed')
        # Only the INDEX NET TOTAL RETURN component, never the fund/gross/difference.
        row = parser.data['data-point-cal']['index-perf-cal-net-total-mon']
        if row['label'] != 'Index' or config['returnVariant'] != 'NET': reject('Wrong benchmark return convention')
        stamp = date(row['asOfDateSimple'], now); years = []
        for key, point in row['attrs'].items():
            if key == 'ytd': continue
            y = point['label']
            if not y.isdigit() or int(y) >= now.year or int(y) in [p[0] for p in years]: reject('Invalid benchmark calendar year')
            if int(y) >= config.get('firstYear', 2020): years.append([int(y), bounded_return(float(point['originalValue']))])
        if 'Index Change:' in row.get('glossary', '') and config.get('firstYear', 2020) <= 2020:
            reject('Linked benchmarks cannot replace an exact-index history')
    else:
        def fact(label):
            entries = [page.tokens[i+1] for i, t in enumerate(page.tokens[:-1]) if t == label]
            if label == 'ISIN': entries = [v for v in entries if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{10}', v)]
            return unique(entries, label)
        if fact('ISIN') != config['isin'] or fact('Benchmark Index') != config['expectedIndex'] or fact('Fund Base Currency') != config['returnCurrency'] or config['returnVariant'] != 'TOTAL':
            reject('Wrong BlackRock TOPIX benchmark/JPY/exact share')
        tables = [t for t in page.tables if t['rows'] and len(t['rows'][0]) >= 6 and all(re.fullmatch('20\\d{2}', y) for y in t['rows'][0][1:])]
        if len(tables) != 1: reject('Missing or ambiguous calendar-year table')
        table = tables[0]['rows']; header = table[0][1:]
        rows = [r for r in table[1:] if r[0] == 'Index (%)']
        if len(rows) != 1 or len(rows[0]) != len(table[0]): reject('Missing exact Index calendar row')
        # The performance block gives the same dated Index observation in its discrete table.
        dates = [r[0].split('as of ', 1)[1].replace('/', '-') for t in page.tables for r in t['rows'] if r and r[0].startswith('Index (%) as of ')]
        stamp = document_date(unique(dates, 'BlackRock index performance date'), now)
        if len(set(header)) != len(header) or any(int(y) >= now.year for y in header): reject('Invalid TOPIX completed calendar years')
        years = [[int(y), bounded_return(float(v))] for y, v in zip(header, rows[0][1:])]
    if not all(y in [p[0] for p in years] for y in range(max(2021, config.get('firstYear', 2020)), now.year)):
        reject('Missing completed index calendar years')
    return stamp, sorted(years, reverse=True)


def metal_benchmark_returns(text, config, now):
    # BlackRock's published Benchmark line is the metal reference, not ETC NAV.
    if config['documentName'] not in ' '.join(text.splitlines()[:12]) or config['isin'] not in text:
        reject('Wrong physical-metal factsheet identity')
    currency = unique(re.findall(r'Share Class Currency\s*:\s*([A-Z]{3})',text),'metal currency')
    if currency != config['returnCurrency'] or currency != 'USD' or config['returnVariant'] != 'PRICE':
        reject('Wrong physical-metal price/currency convention')
    benchmark = unique(re.findall(r'^\s*Benchmark \(USD\)\s+(.+?)\s*$',text,re.M),'metal Benchmark USD label')
    if benchmark != config['expectedIndex']: reject('Physical-metal reference changed')
    stamp = document_date(unique(re.findall(r'Performance, Portfolio Breakdowns and Net Asset information as at:\s*(\d+-[A-Za-z]+-20\d{2})',text),'metal performance date').replace('-',' '),now)
    if text.count('CALENDAR YEAR PERFORMANCE') != 1: reject('Ambiguous metal calendar table')
    block=text.split('CALENDAR YEAR PERFORMANCE',1)[1].split('GROWTH OF HYPOTHETICAL',1)[0]
    headers=[re.findall(r'20\d{2}',line) for line in block.splitlines() if len(re.findall(r'20\d{2}',line))>=5]
    if len(headers)!=1:reject('Missing metal completed calendar header')
    years=headers[0]; row=unique(re.findall(r'^\s*Benchmark\s+(.+)$',block,re.M),'metal Benchmark calendar row')
    values=re.findall(r'-?\d+\.\d+',row)
    if len(values)!=len(years) or len(set(years))!=len(years) or any(int(y)>=now.year for y in years):reject('Invalid metal calendar years')
    if not all(str(y) in years for y in range(2020,now.year)):reject('Incomplete metal calendar history')
    return stamp, sorted([[int(y),bounded_return(float(v))] for y,v in zip(years,values) if int(y)>=2020],reverse=True)
