"""Official EUR calendar returns; keep the provider's return and FX conventions."""
import argparse
import datetime as dt
import json
import pathlib
import re
from collect_index_documents import identity
from data_automation import UTC, reject, write_json_atomic
from issuer_documents import download, pdf_text, proof, document_date, bounded_return

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = 'https://www.msci.com/documents/10199/255599/msci-world-index-eur-gross.pdf'
IDS = ['msciWorld', 'msciEmerging', 'msciAcwi']


def parse(text, now):
    identity(text, 'MSCI World')
    if not re.search(r'CUMULATIVE INDEX PERFORMANCE\s*[—–-]\s*GROSS RETURNS \(EUR\)', text):
        reject('Wrong official currency/return variant')
    block = text.split('ANNUAL PERFORMANCE (%)', 1)[1].split('INDEX PERFORMANCE', 1)[0]
    if not re.search(r'Year\s+MSCI World\s+Emerging\s+MSCI ACWI\s+Markets', block):
        reject('Official annual column identities changed')
    date = re.search(r'INDEX PERFORMANCE\s*[—–-]\s*GROSS RETURNS \(%\)\s*\(([A-Z]{3} \d{1,2}, \d{4})\)', text)
    if not date:
        reject('Missing official observation date')
    stamp = document_date(date[1], now)
    rows = re.findall(r'(?:^|\s)(20\d{2})\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s*$', block, re.M)
    years = [int(row[0]) for row in rows]
    if not years or years != sorted(set(years), reverse=True) or years[0] != now.year - 1:
        reject('Duplicate, unfinished or stale calendar years')
    if years != list(range(years[0], years[-1] - 1, -1)):
        reject('Gap in official calendar returns')
    return {id_: {'currency': 'EUR', 'variant': 'GRTR', 'sourceUrl': SOURCE, 'asOf': stamp,
                  'annualReturns': {row[0]: bounded_return(float(row[col + 1])) for row in rows}}
            for col, id_ in enumerate(IDS)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    body = download(SOURCE)
    records = parse(pdf_text(body), dt.datetime.now(UTC))
    path = ROOT / 'src/data/official-performance-currencies.json'
    previous = json.loads(path.read_text()) if path.exists() else {}
    for id_, record in records.items():
        record['sha256'] = proof(body)
        old = previous.get(id_, {}).get('EUR', {})
        if old and (record['asOf'] < old['asOf'] or max(record['annualReturns']) < max(old['annualReturns'])):
            reject('Official currency history would regress')
        record['annualReturns'] = {**old.get('annualReturns', {}), **record['annualReturns']}
    result = {**previous, **{id_: {'EUR': record} for id_, record in records.items()}}
    if args.apply and result != previous:
        write_json_atomic(path, result)
    print('Official MSCI EUR Gross calendar returns validated: ' + ', '.join(records))


if __name__ == '__main__':
    main()
