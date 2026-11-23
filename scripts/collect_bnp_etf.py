"""Exact-share English factsheets discovered in BNP Paribas AM’s public catalogue."""
import datetime as dt
import json
import re
from data_automation import reject, number
from issuer_documents import download, pdf_text, document_date, proof, bounded_return, validated_rows


def exposures(text, share, stamp):
    result = {}
    def table(block, column=0, top=False, basis='fund'):
        rows = []
        for line in block.splitlines():
            cells = re.split(r' {2,}', line.strip())
            if top and basis == 'index' and len(cells) < 4: continue
            if len(cells) > column + 1 and re.fullmatch(r'\d+\.\d+', cells[column + 1]):
                name = cells[column]
                if name in ('Total', 'Total (%)', 'No. of Holdings in Benchmark'): continue
                rows.append({'name': name, 'weightPct': float(cells[column + 1])})
        validated_rows(rows, complete=not top)
        if top and len(rows) != 10: reject('Incomplete BNP top-ten exposure table')
        return {'asOf': stamp, 'basis': basis, 'rows': rows}
    if share['layout'] == 'easy-fr':
        if text.count('HOLDINGS BENCHMARK:') != 1: reject('Ambiguous BNP benchmark exposure section')
        block = text.split('HOLDINGS BENCHMARK:', 1)[1].split('Source of data:', 1)[0].split('\f', 1)[0]
        if share['isin'] == 'FR0011550185':
            result['holdings'] = table(block, top=True, basis='index')
            # Two-column rows; the last three sector rows have no left column.
            sectors = []
            for line in block.splitlines():
                cells = re.split(r' {2,}', line.strip())
                if len(cells) == 4: cells = cells[2:]
                elif len(cells) != 2 or cells[0] not in ('Other', 'Cash', 'Total'): continue
                if cells[0] != 'Total' and re.fullmatch(r'\d+\.\d+', cells[1]):
                    sectors.append({'name': cells[0], 'weightPct': float(cells[1])})
            validated_rows(sectors)
            result['sectors'] = {'asOf': stamp, 'basis': 'index', 'rows': sectors}
        elif share['isin'] == 'FR0011550193':
            main, sectors = block.split('by Sector (%)', 1)
            result['holdings'] = table(main, top=True, basis='index')
            countries = []
            for line in main.splitlines():
                cells = re.split(r' {2,}', line.strip())
                if len(cells) >= 4 and re.fullmatch(r'\d+\.\d+', cells[3]) and cells[2] != 'Total':
                    countries.append({'name': cells[2], 'weightPct': float(cells[3])})
                elif len(cells) == 2 and cells[0] == 'Other':
                    countries.append({'name': cells[0], 'weightPct': float(cells[1])})
            validated_rows(countries)
            result['countries'] = {'asOf': stamp, 'basis': 'index', 'rows': countries}
            result['sectors'] = table(sectors, basis='index')
    else:
        block = text.split('Top 10 Holdings', 1)[1].split('Total (%)', 1)[0]
        if not re.search(r'Portfolio\s+Benchmark\s+Relative', block): reject('BNP portfolio columns changed')
        result['holdings'] = table(block, top=True)
        block = text.split('Sector Breakdown (%)', 1)[1].split('Geographical Breakdown (%)', 1)[0]
        if not re.search(r'Portfolio\s+Benchmark', block): reject('BNP sector columns changed')
        result['sectors'] = table(block)
        # Geographical Breakdown is a regional table, not a country table.
    return result


CATALOGUE_URL = r'https://api\.bnpparibas-am\.com/push/fundsheet/[A-Z_]+-FSE/[A-Z]{3}/([A-Z]{3})/'
PDF_URL = r'https://docfinder\.bnpparibas-am\.com/api/files/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/[0-9]+'
WEEKEND_REFERENCE_SHARES = {'FR0011550193', 'IE000QDFFK00'}
DOCUMENT_TYPES = {'easy-fr': 'DOC_FACTSHEET', 'easy-ii': 'DOC_FACTSHEET_B2B'}


def discover(body, share, now, country):
    catalogue = json.loads(body)
    identity = catalogue.get('fundshare_selection', {})
    if (identity.get('isin'), identity.get('currency')) != (share['isin'], share['currency']):
        reject('BNP catalogue has wrong share identity or currency')
    documents = catalogue.get('publications', {}).get('ENG', {}).get('documents', [])
    candidates = [entry for entry in documents
                  if entry.get('doc_type') == DOCUMENT_TYPES[share['layout']] and entry.get('country') == country]
    if not candidates:
        reject('No exact English BNP factsheet listed in the issuer catalogue')

    def dates(entry):
        pair = (entry.get('reference_date'), entry.get('publication_date'))
        if any(not isinstance(value, str) or not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', value) for value in pair):
            reject('Missing or invalid BNP catalogue dates')
        return pair

    # Select the latest issue by its reference period, then its publication
    # date. Validate that issue even when an older candidate could pass.
    candidates.sort(key=dates)
    entry = candidates[-1]
    reference, publication = dates(entry)
    if len(candidates) > 1 and dates(candidates[-2]) == (reference, publication):
        reject('Ambiguous latest BNP factsheet')
    url = entry.get('url', '')
    if (entry.get('language') != 'ENG' or entry.get('format') != 'pdf'
            or not isinstance(url, str) or not re.fullmatch(PDF_URL, url)):
        reject('Invalid BNP Docfinder factsheet')
    reference = document_date(reference, now)
    publication = document_date(publication, now)
    if publication < reference:
        reject('BNP catalogue publication predates its document reference')
    expected = reference
    if share['isin'] in WEEKEND_REFERENCE_SHARES:
        end = dt.date.fromisoformat(reference)
        if end.weekday() >= 5 and (end + dt.timedelta(days=1)).month != end.month:
            friday = (end - dt.timedelta(days=end.weekday() - 4)).isoformat()
            # The product and the actual PDF must both corroborate this date.
            if catalogue.get('reference_date') == friday:
                expected = friday
    return url, reference, publication, expected


def unique(pattern, text):
    values = re.findall(pattern, text, re.M)
    if not values or len(set(values)) != 1: reject('Missing or ambiguous BNP field: ' + pattern)
    return values[0]


def parse(text, share, now, expected_date):
    if share['documentName'] not in text.split('\f', 1)[0] or 'bnpparibas-am.com' not in text:
        reject('Wrong BNP issuer document title or authorship')
    isin = unique(r'ISIN [Cc]ode\s+([A-Z0-9]{12})', text)
    if isin != share['isin']: reject('Wrong BNP exact ISIN')
    currency = share['currency']
    if share['layout'] == 'easy-fr':
        if 'Fund Factsheet ' + currency + ' C, Capitalisation' not in text.split('\f', 1)[0]:
            reject('Wrong BNP exact share currency or distribution')
        raw_date = unique(r'DASHBOARD AS AT (\d{2}\.\d{2}\.\d{4})', text)
        stamp = dt.datetime.strptime(raw_date, '%d.%m.%Y').date().isoformat()
        if (unique(r'Base Currency\s+([A-Z]{3})', text) != currency
                or unique(r'^\s*Benchmark[ \t]{2,}([^\n]+?)\s*$', text).strip() != share['expectedIndex']):
            reject('Wrong BNP base currency or benchmark')
        fee, fee_date = unique(r'Real Ongoing Charges \((\d{2}\.\d{2}\.\d{2})\)\s+([\d.]+)%', text)[::-1]
        fees_as_of = dt.datetime.strptime(fee_date, '%d.%m.%y').date().isoformat()
        if fees_as_of > stamp: reject('Future BNP fee observation')
        aum = float(unique(r'Fund Size \((?:Euro|EUR) millions\)\s+([\d,]+\.\d+)', text).replace(',', '')) * 1e6
        if text.count('Calendar Performance at ') != 1: reject('Missing or ambiguous BNP calendar table')
        block = text.split('Calendar Performance at ', 1)[1].split('Source:', 1)[0]
        row_label = 'FUND'
    elif share['layout'] == 'easy-ii':
        stamp = unique(r'Factsheet: (\d{2}/\d{2}/\d{4})', text)
        stamp = dt.datetime.strptime(stamp, '%d/%m/%Y').date().isoformat()
        benchmark = re.search(r'100% NASDAQ-100 Notional Net Total\s*\n[^\n]*\s{2,}Return Index\b', text)
        if (unique(r'Shareclass currency\s+([A-Z]{3})', text) != currency
                or share['expectedIndex'] != 'NASDAQ-100 Notional Net Total Return Index' or not benchmark):
            reject('Wrong BNP II exact share currency or benchmark')
        if unique(r'Share type\s+(\w+)', text) != 'Accumulation': reject('Wrong BNP II share distribution')
        fee = unique(r'^Ongoing charges\s+([\d.]+)%', text)
        fees_as_of = None  # The PDF does not publish a separate fee observation date.
        aum = float(unique(r'Assets Under Management \(M\)\n[^\n]*\n[^\n]*\b' + currency + r'\n[^\n]*?\s{2,}([\d ]+\.\d+)\s{2,}', text).replace(' ', '')) * 1e6
        if text.count('Annual Calendar Performance (%)') != 1: reject('Missing or ambiguous BNP II calendar table')
        block = text.split('Annual Calendar Performance (%)', 1)[1].split('Past performance', 1)[0]
        row_label = r'Portfolio\*'
    else: reject('Unknown BNP document layout')
    document_date(stamp, now)
    if stamp != expected_date:
        reject(f'BNP PDF observation date {stamp} differs from expected reference {expected_date}')
    headers = [re.findall(r'20\d{2}', line) for line in block.splitlines() if len(re.findall(r'20\d{2}', line)) >= 3]
    if len(headers) != 1: reject('Missing or ambiguous BNP calendar header')
    years = headers[0]
    values = unique(r'^\s*' + row_label + r'\s+(.+)$', block).split()
    if len(years) != len(values) or len(set(years)) != len(years) or any(int(y) >= now.year for y in years):
        reject('Invalid BNP completed calendar columns')
    calendar = {y: bounded_return(float(v)) for y, v in zip(years, values) if v != '-'}
    if not calendar: reject('No completed BNP calendar performance')
    if set(map(int, calendar)) != set(range(min(map(int, calendar)), now.year)):
        reject('Missing BNP complete calendar year within published history')
    if not 0 <= float(fee) <= 5: reject('Invalid BNP ongoing charges')
    result = {**share, 'productId': isin, 'characteristics': {'terPct': float(fee), 'index': share['expectedIndex'], 'distribution': 'Capitalisation', 'asOf': stamp, 'feesAsOf': fees_as_of},
            'aum': {'amount': number(round(aum, 2)), 'currency': currency, 'scope': 'fund', 'asOf': stamp},
            'performance': {'currency': currency, 'basis': 'fund', 'method': 'calendar-year exact-share NAV net total return, income reinvested, fund fees included',
                            'asOf': stamp, 'years': dict(sorted(calendar.items()))},
            'unavailable': []}
    try:
        result.update(exposures(text, share, stamp))
    except (ValueError, IndexError) as error:
        result['collectionErrors'] = [{'field': 'exposures', 'reason': str(error)}]
    if 'countries' not in result:
        result['unavailable'].append('countries: no complete country table published; regional geography is not a country allocation')
    return result


def load_factsheet(share, now, fetch=None):
    page = share['discoveryUrl']
    route = re.fullmatch(CATALOGUE_URL + re.escape(share['isin']), page)
    if not route:
        reject('Unexpected BNP issuer catalogue URL')

    def fetch_official(url):
        if fetch is not None:
            return fetch(url)
        return download(url, url_validator=lambda candidate: candidate == url)

    catalogue = fetch_official(page)
    url, reference, publication, expected = discover(catalogue, share, now, route[1])
    body = fetch_official(url)
    result = parse(pdf_text(body), share, now, expected)
    evidence = dict(sourceUrl=page, sha256=proof(catalogue), advertisedAsOf=reference,
                    publicationDate=publication)
    if expected != reference:
        evidence['catalogueReferenceDate'] = expected
    return result, body, url, evidence


def collect_one(share, now, fetch=None):
    result, body, url, evidence = load_factsheet(share, now, fetch)
    result['sourceUrl'] = url
    digest = proof(body)
    for field in ('characteristics', 'aum', 'performance', 'countries', 'sectors', 'holdings'):
        if field not in result:
            continue
        result[field].update(sourceUrl=url, discoveryUrl=evidence['sourceUrl'], sha256=digest,
                             sourceLabel='Fiche BNP Paribas Asset Management',
                             publisher='BNP Paribas Asset Management', documentHost='BNP Paribas Asset Management',
                             documentAdvertisedAsOf=evidence['advertisedAsOf'],
                             documentPublicationDate=evidence['publicationDate'])
    if share.get('collectTrackedCountries'):
        from collect_tracked_exposure import collect_one as tracked_exposure
        try:
            # parse() above independently checks the current BNP benchmark.
            result['countries'] = tracked_exposure(share, now, share['expectedIndex'], fetch or download)['countries']
            result['unavailable'] = [s for s in result['unavailable'] if not s.startswith('countries:')]
        except Exception as error:
            result.setdefault('collectionErrors', []).append({'field': 'countries', 'reason': str(error)})
    return result
