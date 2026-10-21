"""Exact MSCI Korea physical approximation, never Korea 20/35 weights.

HANARO publishes its full physical subscription portfolio with security ISINs.
BlackRock supplies names/country/GICS attributes only, joined by exact ISIN on the
same snapshot date. Its fund's capped benchmark weights are deliberately unread.
"""
import html
import json
import math
import re
from collections import defaultdict
from issuer_documents import download, pdf_text, proof, document_date
from collect_index_documents import SECTOR_LABELS


def text(value):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', value)).split())


def parse_portfolio(body, now):
    page = body.decode('utf-8')
    if not re.search(r'<h[1-6][^>]*>\s*HANARO MSCI KOREA TR\s*</h[1-6]>', page) or '<dd>332940</dd>' not in page:
        raise ValueError('Wrong HANARO exact fund identity')
    if not re.search(r'<p>\s*MSCI KOREA Gross TR 지수\s*</p>', page):
        raise ValueError('HANARO benchmark changed; standard MSCI Korea required')
    inputs = re.findall(r'<input\b[^>]*\bid="pdfDate"[^>]*>', page)
    if len(inputs) != 1: raise ValueError('Ambiguous portfolio snapshot date')
    dates = re.findall(r'\bvalue="(\d{4}\.\d{2}\.\d{2})"', inputs[0])
    if len(dates) != 1: raise ValueError('Missing portfolio snapshot date')
    stamp = document_date(dates[0].replace('.', '-'), now)
    blocks = re.findall(r'<tbody\b[^>]*data-target="fundHoldingsListTableBody"[^>]*>(.*?)</tbody>', page, re.S)
    counts = re.findall(r'data-target="pdfTotalCount">\s*(\d+)\s*</i>', page)
    if len(blocks) != 1 or len(counts) != 1: raise ValueError('Missing full portfolio table/count')
    rows = []
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', blocks[0], re.S):
        cells = [text(c) for c in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, re.S)]
        if len(cells) != 6 or int(cells[0]) != len(rows) + 1: raise ValueError('Incomplete or reordered portfolio rows')
        if not re.fullmatch(r'\d+(?:\.\d+)?', cells[5]): raise ValueError('Invalid published percentage')
        value, weight = int(cells[4].replace(',', '')), float(cells[5])
        if value < 0 or not math.isfinite(weight) or not 0 <= weight <= 100: raise ValueError('Invalid long-only position')
        rows.append({'isin': cells[1], 'name': cells[2], 'weightPct': weight, 'valuation': value})
    if len(rows) != int(counts[0]) or len(rows) < 11 or len({r['isin'] for r in rows}) != len(rows):
        raise ValueError('Incomplete or duplicated physical portfolio')
    if abs(sum(r['weightPct'] for r in rows) - 100) > .1: raise ValueError('Published portfolio weights inconsistent')
    # Only the issuer's explicit KRW cash code may be excluded from equities.
    if any(not re.fullmatch(r'KR7\d{9}', r['isin']) and r['isin'] != 'KRD010010001' for r in rows):
        raise ValueError('Unknown instrument/derivative/fund in physical portfolio')
    total = sum(r['valuation'] for r in rows)
    if total <= 0 or any(abs(r['valuation'] / total * 100 - r['weightPct']) > .03 for r in rows):
        raise ValueError('Published weights disagree with portfolio valuations')
    return stamp, [r for r in rows if r['isin'] != 'KRD010010001']


def classify(body, rows, stamp):
    data = json.loads(body)
    points = data['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    if str(points['asOfDate']['value']) != stamp.replace('-', ''): raise ValueError('Portfolio and classification dates differ')
    # No holdingPercent is read: capped-fund weights cannot enter this calculation.
    keys = ['isin', 'issueName', 'sectorName', 'countryOfRisk', 'assetClass']
    columns = [points[k]['value'] for k in keys]
    if len({len(c) for c in columns}) != 1: raise ValueError('Misaligned security attributes')
    identities = {}
    for isin, name, sector, country, kind in zip(*columns):
        if kind != 'Equity': continue
        attributes = (name, sector, country)
        if isin in identities and identities[isin] != attributes: raise ValueError('Conflicting security attributes')
        identities[isin] = attributes
    sectors, countries, result = defaultdict(float), defaultdict(float), []
    for row in rows:
        if row['isin'] not in identities: raise ValueError('Unknown exact security ISIN: ' + row['isin'])
        name, sector, country = identities[row['isin']]
        if sector == 'Communication': sector = 'Communication Services'
        if sector not in SECTOR_LABELS or country not in ('Korea (South)', 'South Korea', 'Korea'):
            raise ValueError('Unqualified stock sector/country')
        sectors[SECTOR_LABELS[sector]] += row['weightPct']
        countries['Corée du Sud'] += row['weightPct']
        result.append({'isin': row['isin'], 'name': name, 'sourceName': row['name'], 'weightPct': row['weightPct']})
    return result, sorted(countries.items(), key=lambda r: -r[1]), sorted(sectors.items(), key=lambda r: -r[1])


def collect(config, now, fetch=download):
    page = fetch(config['url'])
    stamp, rows = parse_portfolio(page, now)
    document = fetch(config['prospectusUrl']); wording = ' '.join(pdf_text(document).split())
    if 'NH-Amundi HANARO MSCI KOREA Total Return' not in wording or 'MSCI KOREA Gross TR 지수를 완전복제' not in wording:
        raise ValueError('Exact benchmark and full physical replication not proved in issuer prospectus')
    attributes = fetch(config['classificationUrl'])
    rows, countries, sectors = classify(attributes, rows, stamp)
    return {'asOf': stamp, 'checkedAt': now.isoformat(), 'basis': 'physical-creation-basket', 'complete': True, 'rows': rows,
        'countries': countries, 'sectors': sectors, 'sourceUrl': config['url'], 'sha256': proof(page),
        'sourceLabel': 'NH-Amundi HANARO MSCI Korea TR', 'sourceProductCode': 'KRX 332940',
        'identitySourceUrl': config['prospectusUrl'], 'identityCheckedAt': now.date().isoformat(), 'identitySha256': proof(document),
        'classificationSourceUrl': config['classificationUrl'], 'classificationSha256': proof(attributes),
        'classificationAsOf': stamp, 'classificationCheckedAt': now.isoformat(),
        'indexIdentitySourceUrl': config['indexIdentitySourceUrl'],
        'method': 'Approximation par le panier physique de souscription publié par HANARO, ETF suivant le MSCI Korea Gross TR standard. Ce panier peut différer des positions comptables du fonds. Poids conservés sans renormalisation ; liquidités dans le reste. Noms, pays et secteurs raccordés par ISIN depuis le fichier iShares du même jour. Aucun poids du MSCI Korea 20/35 n’est utilisé.'}
