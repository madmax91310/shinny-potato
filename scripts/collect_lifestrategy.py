"""Exact LifeStrategy shares: Vanguard PDF assets/holdings, page allocation, GPX returns."""
import argparse
import datetime as dt
import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from bs4 import BeautifulSoup
from collect_vanguard_etf import fetch_api, parse_api
from issuer_documents import download, pdf_text, document_date, validated_rows
from data_automation import UTC, write_json_atomic

ROOT = Path(__file__).resolve().parents[1]
CONFIG = [(r['equityPct'], r['productCode'], r['isin']) for r in json.loads((ROOT/'scripts/lifestrategy-sources.json').read_text())['instruments'] if r.get('enabled', True)]
MONTHS = {'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
          'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12}
MONTHS.update({'janv': 1, 'févr': 2, 'avr': 4, 'juil': 7, 'sept': 9, 'oct': 10, 'nov': 11, 'déc': 12})

def french_date(value, now):
    m = re.search(r'\b(\d{1,2})\s+(\w+)\.?\s+(\d{4})\b', value.casefold())
    if not m or m[2] not in MONTHS:
        raise ValueError('Missing French observation date')
    return document_date(dt.date(int(m[3]), MONTHS[m[2]], int(m[1])).isoformat(), now)

def parse_sources(html, pdf, api, config, now):
    equity, code, isin = config
    soup = BeautifulSoup(html, 'html.parser')
    identity = json.loads(soup.find('script', id='financial-product-json-ld').text)
    ids = {r['name']: r['value'] for r in identity['identifier']}
    props = {r['name']: r['value'] for r in identity['additionalProperty']}
    if ids.get('ISIN') != isin or ids.get('PortId') != code or props.get('Currency') != 'EUR':
        raise ValueError('LifeStrategy page share identity changed')
    text = pdf_text(pdf)
    if isin not in text or f'LifeStrategy® {equity}%' not in text or 'Accumulating' not in text:
        raise ValueError('LifeStrategy PDF share identity changed')
    stamp = french_date(re.search(r"Fiche d'information \| ([^\n]+)", text)[1], now)
    aum = re.search(r"Encours classe d'actifs \(million\)\s*([\d ,]+)\s*€ au ([^\n]+)", text)
    if not aum:
        raise ValueError('Exact-share PDF assets missing; fund total is not a substitute')
    aum_date = french_date(aum[2], now)
    ter = float(re.search(r'([\d.]+)%', identity['feesAndCommissionsSpecification'])[1])
    pdf_ter = re.search(r'Le Montant des frais courants \(MFC\)†\s*([\d,]+) %', text)
    if not pdf_ter or float(pdf_ter[1].replace(',', '.')) != ter or not 0 < ter < 5:
        raise ValueError('PDF/page expenses disagree')
    block = text.split('Allocation aux fonds Vanguard sous-jacents', 1)[1].split('Total', 1)[0]
    holdings = []
    for line in block.splitlines():
        m = re.match(r'\s*(Vanguard .+?)\s{2,}(\d+[,.]\d+)%?\s*$', line)
        if m:
            holdings.append({'name': m[1], 'weightPct': float(m[2].replace(',', '.'))})
    validated_rows(holdings)
    allocation = soup.find('europe-core-asset-allocations')
    if allocation is None:
        raise ValueError('Missing published asset allocation')
    allocation_date = french_date(allocation.get_text(' ', strip=True).split('Au ', 1)[1], now)
    rows = []
    labels = {'Obligation': 'Obligations', 'Action': 'Actions', 'Réserves à court terme': 'Liquidités'}
    for tr in allocation.find_all('tr'):
        cells = [c.get_text(' ', strip=True) for c in tr.find_all('td')]
        if len(cells) == 2:
            if cells[0] not in labels:
                raise ValueError('Unknown Vanguard asset allocation category')
            rows.append({'name': labels[cells[0]], 'weightPct': float(cells[1].replace('%', '').replace('\xa0', '').replace(',', '.').strip())})
    validated_rows(rows)
    if abs(next(r['weightPct'] for r in rows if r['name'] == 'Actions') - equity) > 5:
        raise ValueError('Unexpected equity allocation')
    extra = parse_api(api, {'isin': isin, 'productCode': code, 'currency': 'EUR', 'equity': False}, now)
    if not extra.get('performance') or '2020' in extra['performance']['years']:
        raise ValueError('Missing complete calendar returns or partial launch year')
    url = identity['url']
    pdf_url = next(a['href'] for a in soup.find_all('a', href=True) if f'_{code}_FR_INT_FR.pdf' in a['href'])
    ticker = f'V{equity}A'
    if not re.search(rf'Deutsche Börse\s*\n\s*EUR[^\n]*\b{ticker}\b[^\n]*\b{ticker}\.DE\b', text):
        raise ValueError('Exact Xetra EUR listing missing')
    checked = now.date().isoformat()
    digest = hashlib.sha256(html.encode()).hexdigest()
    evidence = f'{isin}-XETR-{ticker}-EUR'
    listing = {'ticker': ticker, 'mic': 'XETR', 'exchange': 'Xetra', 'currency': 'EUR',
               'symbol': ticker+'.DE', 'sourceUrl': pdf_url, 'checkedAt': now.date().isoformat(),
               'evidenceId': evidence, 'excerpt': f'{isin} | Deutsche Börse | EUR | {ticker} | {ticker}.DE'}
    observed = lambda source, date, values: {'asOf': date, 'checkedAt': checked, 'sourceUrl': source,
                                           'basis': 'fund', 'rows': values}
    # Recheck the exact fund's disclosures daily. Fund holdings and the equity
    # sleeve alone cannot establish whole-fund economic country/sector weights.
    fund = api['data']['funds'][0]  # identity already validated by parse_api
    market_rows = fund.get('marketAllocation') or []
    qualifications = {}
    for field, keywords in [('countries', r'country|market allocation|répartition géographique'),
                            ('sectors', r'sector|secteur')]:
        headings = [h.get_text(' ', strip=True) for h in soup.find_all(['h2', 'h3', 'h4'])
                    if re.search(keywords, h.get_text(' ', strip=True), re.I)]
        detected = bool(headings or (field == 'countries' and market_rows))
        qualifications[field] = {
            'status': 'unqualified' if detected else 'not-published',
            'checkedAt': checked, 'sourceUrl': url, 'sha256': digest,
            'reason': ('Nouvelle section économique détectée : vérifier le périmètre du fonds entier avant intégration.' if detected else
                       'Aucune répartition économique complète du fonds dans la page et les données qualifiées ; les fonds sous-jacents et la poche actions ne constituent pas une allocation pays/secteurs du fonds entier.'),
            'evidence': {'headings': headings, 'marketAllocationRows': len(market_rows) if field == 'countries' else None,
                         'underlyingFunds': len(holdings), 'holdingsAsOf': stamp,
                         'assetAllocationAsOf': allocation_date, 'documentSha256': hashlib.sha256(pdf).hexdigest()}}
    return {'id': f'lifestrategy{equity}', 'isin': isin,
            'name': f'Vanguard LifeStrategy {equity}% Equity UCITS ETF (EUR) Accumulating',
            'currency': 'EUR', 'sourceUrl': url, 'checkedAt': checked, 'pageSha256': digest,
            'documentSha256': hashlib.sha256(pdf).hexdigest(), 'terPct': ter,
            'characteristics': {'terPct': ter, 'checkedAt': checked, 'sourceUrl': pdf_url, 'listings': [listing],
                               'index': f'Gestion active multi-actifs {equity}/{100-equity}, sans indice de référence',
                               'distribution': 'Accumulating', 'domicile': 'Irlande',
                               'replicationMethod': 'Gestion active, détention physique de fonds indiciels'},
            'aum': {'amount': float(aum[1].replace(' ', '').replace(',', '.'))*1e6,
                    'currency': 'EUR', 'scope': 'share-class', 'asOf': aum_date, 'checkedAt': now.date().isoformat(),
                    'sourceUrl': pdf_url, 'precisionNote': 'Encours de la part arrondi au million dans la fiche Vanguard'},
            'holdings': observed(pdf_url, stamp, holdings),
            'assetAllocation': observed(url, allocation_date, rows),
            'performance': {**extra['performance'], 'checkedAt': checked},
            'fieldQualification': qualifications,
            'unavailable': ['countries: no qualified whole-fund look-through', 'sectors: asset allocation is not an equity sector table']}

def collect_one(config, now):
    equity, code, isin = config
    url = f'https://www.fr.vanguard/professionnel/produits/etf/lifestrategy/{code}/lifestrategy-{equity}-equity-ucits-etf-eur-accumulating'
    html = download(url).decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    links = {a['href'] for a in soup.find_all('a', href=True) if f'_{code}_FR_INT_FR.pdf' in a['href'] and a['href'].startswith('https://fund-docs.vanguard.com/')}
    if len(links) != 1:
        raise ValueError('Current LifeStrategy factsheet link ambiguous')
    return parse_sources(html, download(links.pop()), fetch_api(code), config, now)

def main():
    p = argparse.ArgumentParser(); p.add_argument('--apply', action='store_true'); p.add_argument('--output', type=Path, required=True)
    args = p.parse_args(); now = dt.datetime.now(UTC)
    def one(config):
        try: return {'record': collect_one(config, now)}
        except Exception as error: return {'isin': config[2], 'error': str(error)}
    with ThreadPoolExecutor(max_workers=4) as pool: results = list(pool.map(one, CONFIG))
    report = {'checkedAt': now.isoformat(), 'records': [r['record'] for r in results if 'record' in r],
              'failed': [r for r in results if 'record' not in r]}
    for record in report['records']:
        report['failed'].extend({'isin': record['isin'], 'field': field, 'error': q['reason']}
                               for field, q in record['fieldQualification'].items() if q['status'] == 'unqualified')
    path = ROOT/'src/data/lifestrategy.json'
    old = json.loads(path.read_text()) if path.exists() else {}
    for r in report['records']:
        prev = old.get(r['isin'])
        if prev and any(r[f]['asOf'] < prev[f]['asOf'] for f in ['aum', 'holdings', 'assetAllocation']):
            raise ValueError('LifeStrategy observation date regressed')
        old[r['isin']] = r
    if args.apply: write_json_atomic(path, old)
    write_json_atomic(args.output, report)
    print(json.dumps({'validated': [r['isin'] for r in report['records']], 'failed': report['failed']}))
    if report['failed']: raise SystemExit(1)

if __name__ == '__main__': __import__('producer_report_contract').run('collect_lifestrategy', main)
