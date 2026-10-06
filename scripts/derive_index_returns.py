"""Calendar returns from already validated exact monthly series (no proxy substitution)."""
import calendar
import datetime as dt
import json
import pathlib
import re
from data_automation import reject, number
from issuer_documents import document_date, bounded_return, proof
ROOT = pathlib.Path(__file__).resolve().parents[1]


def derive(config, record, now, digest):
    if record.get('symbol') != config['symbol'] or record.get('currency') != config['returnCurrency']:
        reject('Derived index symbol/currency changed')
    if config['id'] == 'sp500-pea' and record.get('field') != 'close': reject('S&P total-return index must use raw index levels')
    if config['id'] == 'ethereum' and record.get('field') != 'close': reject('Crypto must use spot closes')
    document_date(record['checkedAt'], now, 45)
    end = record['periodEnd']
    if not re.fullmatch(r'20\d{2}-\d{2}', end) or end >= now.strftime('%Y-%m'): reject('Unfinished monthly series')
    y, m = map(int, end.split('-')); stamp = document_date(dt.date(y, m, calendar.monthrange(y, m)[1]).isoformat(), now)
    points = record['points']
    keys = [p[0] for p in points]
    if not keys or keys != sorted(set(keys)) or keys[-1] != end: reject('Duplicate, unordered or truncated monthly series')
    levels = {k: number(v) for k, v in points}; values = []
    for year in range(2020, now.year):
        a, b = f'{year-1}-12', f'{year}-12'
        if a not in levels or b not in levels: reject('Missing December boundary for calendar return')
        values.append([year, bounded_return(100 * (levels[b] / levels[a] - 1))])
    urls = record['sourceUrls']
    if len(urls) < 2 or any(not u.startswith('https://query2.finance.yahoo.com/v8/finance/chart/') for u in urls): reject('Unqualified monthly data provenance')
    return {'id': config['id'], 'name': config['name'], 'errors': [], 'unavailable': [],
            'returns': {'asOf': stamp, 'currency': config['returnCurrency'], 'variant': config['returnVariant'],
            'values': sorted(values, reverse=True), 'periodStart': '2020-01-01', 'periodEnd': f'{now.year-1}-12-31',
            'source': {'url': urls[0], 'sourceUrls': urls, 'checkedAt': record['checkedAt'], 'sha256': digest,
                       'label': 'Clôtures décembre/décembre · série mensuelle exacte validée'},
            'performance': {'kind': config.get('kind', 'indice'), 'detail': config['performanceDetail'], 'date': stamp}}}


def collect_one(config, now):
    path = ROOT / config['dataPath']; body = path.read_bytes(); data = json.loads(body)
    record = data[config['dataKey']] if config.get('dataKey') else data
    try: return derive(config, record, now, proof(body))
    except Exception as error:
        return {'id': config['id'], 'name': config['name'], 'errors': [{'field': 'returns', 'reason': str(error), 'url': config['dataPath']}], 'unavailable': []}
