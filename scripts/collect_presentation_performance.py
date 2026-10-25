"""Refresh exact-share cumulative returns where no full calendar year is published."""
import argparse
import datetime as dt
import json
import pathlib
import re
from concurrent.futures import ThreadPoolExecutor
from issuer_documents import download, pdf_text, document_date, proof, bounded_return
from data_automation import UTC, reject, write_json_atomic
from apply_etf_collection import merge_collection

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = [
    {'isin': isin, 'currency': 'EUR', 'provider': 'Amundi', 'parser': 'amundi',
     'sourceUrl': f'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/{isin}/FRA/FRA/INSTITUTIONNEL/ETF',
     'method': 'calendar-year share total return, income reinvested, fund fees included'}
    for isin in ['FR001400U5Q4', 'LU2970735911']
] + [
    {'isin': 'IE000DQLYVB9', 'currency': 'EUR', 'provider': 'iShares', 'parser': 'ishares',
     'sourceUrl': 'https://www.blackrock.com/fr/particuliers/literature/fact-sheet/spea-ishares-s-p-500-swap-pea-ucits-etf-fund-fact-sheet-fr-fr.pdf',
     'method': 'calendar-year exact share NAV total return, net of fees'},
    {'isin': 'IE0007Y8Y157', 'currency': 'USD', 'provider': 'VanEck', 'parser': 'vaneck',
     'sourceUrl': 'https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf',
     'fallbackUrls': ['https://www.vaneck.com/nl/en/library/fact-sheets/qntm-fact-sheet.pdf', 'https://www.vaneck.com/ucits/library/fact-sheets/qntm-fact-sheet.pdf'],
     'method': 'calendar-year NAV total return, net income reinvested, net of fees'}
]


def parse(text, share, now):
    if share['isin'] not in text:
        reject('Wrong cumulative-performance share')
    if share['parser'] == 'amundi':
        if not re.search(r'Devise de référence de la classe\s+' + share['currency'] + r'\b', text):
            reject('Wrong Amundi performance currency')
        stamp = document_date(re.search(r'\b\d{2}/\d{2}/\d{4}\b', text)[0], now)
        block = text.split('Performances glissantes', 1)[1].split('Performances calendaires', 1)[0]
        if not re.search(r'1 mois\s+3 mois\s+1 an\s+3 ans\s+5 ans', block):
            reject('Amundi cumulative columns changed')
        starts = re.search(r'^ Depuis le\s+(.+)$', block, re.M)[1].split()
        if len(starts) != 7 or starts[0] != f'31/12/{int(stamp[:4])-1}':
            reject('Amundi YTD origin or columns changed')
        cells = re.search(r'^ Portefeuille\s+(.+)$', block, re.M)[1].split()
        if len(cells) != 7: reject('Amundi cumulative row changed')
        entries = [(0, 'Depuis janvier'), (1, '1 mois'), (2, '3 mois'), (3, '1 an'), (6, 'Depuis le lancement')]
        values = [(label, bounded_return(float(cells[i].rstrip('%').replace(',', '.')))) for i, label in entries if cells[i] != '-']
    elif share['parser'] == 'ishares':
        if not re.search(r"Devise de la Classe d'Actions\s*:\s*EUR", text) or 'revenu brut réinvesti' not in text:
            reject('iShares currency or reinvestment convention changed')
        months = {'janv.':1,'févr.':2,'mars':3,'avr.':4,'mai':5,'juin':6,'juil.':7,'août':8,'sept.':9,'oct.':10,'nov.':11,'déc.':12}
        day, month, year = re.search(r"l'actif net au (\d{2}-[a-zéû.]+-20\d{2})", text)[1].split('-')
        stamp = document_date(dt.date(int(year), months[month], int(day)).isoformat(), now)
        block = text.split('PERFORMANCE CUMULÉE ET ANNUALISÉE', 1)[1]
        if not re.search(r'1 mois\s+3m\s+6 mois\s+DDA\s+1 An', block): reject('iShares columns changed')
        cells = re.search(r'^ Classe d[’\x27]Actions\s+(.+)$', block, re.M)[1].split()
        if len(cells) != 8: reject('iShares cumulative row changed')
        # Since-inception is in the annualised section; never label it cumulative.
        values = [(label, bounded_return(float(cells[i].replace(',', '.')))) for i, label in [(0,'1 mois'),(1,'3 mois'),(3,'Depuis janvier'),(4,'1 an')] if cells[i] != '-']
    else:
        if not re.search(r'Base Currency\s+USD', text) or 'net income reinvested, net of fees' not in text:
            reject('VanEck currency or reinvestment convention changed')
        block = text.split('Performance History (%)', 1)[1].split('Past performance', 1)[0]
        stamp = document_date(re.search(r'Month End as of (\d{1,2} [A-Za-z]+ 20\d{2})', block)[1], now)
        if not re.search(r'1 MO\*\s+3 MO\*\s+YTD\*\s+1 YR\s+3 YR\s+5 YR\s+10 YR\s+INCEPTION', block): reject('VanEck columns changed')
        numeric = r'(?:-?\d+(?:\.\d+)?|--)'
        rows = re.findall(r'\bETF[ \t]+(' + numeric + r'(?:[ \t]+' + numeric + r'){7})[ \t]*$', block, re.M)
        if len(rows) != 1: reject('VanEck ETF row changed: ' + repr(block[:1800]))
        cells = rows[0].split()
        # Multi-year and inception columns may be annualised; use only <=1 year.
        values = [(label, bounded_return(float(cells[i]))) for i, label in [(0,'1 mois'),(1,'3 mois'),(2,'Depuis janvier'),(3,'1 an')] if cells[i] != '--']
    if not values: reject('No published cumulative observations')
    return {'currency': share['currency'], 'basis': 'fund', 'method': share['method'], 'years': {},
            'observationMethod': 'published exact-share NAV returns; income reinvested; periods <=1 year cumulative',
            'observations': [{'label': label, 'value': value, 'asOf': stamp} for label, value in values],
            'asOf': stamp, 'sourceUrl': share['sourceUrl']}


def refresh(current, now=None, fetch=download):
    now = now or dt.datetime.now(UTC)
    def one(share):
        try:
            if current.get(share['isin'], {}).get('performance', {}).get('years'):
                return {'isin': share['isin'], 'status': 'annual-active'}
            source = share
            if share['parser'] == 'vaneck':
                from collect_vaneck_etf import download_document
                body, url = download_document(share, fetch)
                source = {**share, 'sourceUrl': url}
            else:
                body = fetch(share['sourceUrl'])
            perf = parse(pdf_text(body), source, now)
            perf['sha256'] = proof(body)
            if perf['asOf'] < current.get(share['isin'], {}).get('performance', {}).get('asOf', ''):
                reject('Older cumulative observation; active performance preserved')
            return {'isin': share['isin'], 'status': 'validated', 'share': {
                **share, 'productId': current.get(share['isin'], {}).get('productId', share['isin']), 'exposureOnly': True, 'performance': perf}}
        except Exception as error:
            return {'isin': share['isin'], 'status': 'failed', 'reason': str(error)}
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(one, SOURCES))
    merged = current
    for result in results:
        if result['status'] == 'validated':
            merged = merge_collection({'checkedAt': now.isoformat(), 'shares': [result['share']]}, merged, {})
    return merged, {'checkedAt': now.isoformat(), 'shares': results}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=pathlib.Path, required=True)
    p.add_argument('--apply', action='store_true')
    args = p.parse_args()
    path = ROOT/'src/data/automated-etf.json'
    merged, report = refresh(json.loads(path.read_text()))
    write_json_atomic(args.output, report)
    if args.apply: write_json_atomic(path, merged)
    for r in report['shares']: print(r['isin'], r['status'], r.get('reason', ''))
    if any(r['status'] == 'failed' for r in report['shares']): raise SystemExit(1)

if __name__ == '__main__':
    __import__('producer_report_contract').run('collect_presentation_performance', main)
