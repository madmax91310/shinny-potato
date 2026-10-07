"""BNP-authored exact-share factsheets, discovered from a public document mirror.

The mirror is disclosed in every field's provenance. Its page metrics are never
used as BNP data; only the issuer PDF is parsed. No fixed monthly UUID is stored.
"""
import datetime as dt
from html.parser import HTMLParser
import re
from urllib.parse import urlparse
from data_automation import reject, number
from issuer_documents import download, pdf_text, document_date, proof, bounded_return


class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            href = dict(attrs).get('href', '')
            if href: self.urls.append(href)


def discover(body, share, now):
    text = body.decode('utf-8')
    if share['isin'] not in text or 'id_' + share['mirrorCode'] not in text:
        reject('BNP document discovery page has wrong share identity')
    links = Links(); links.feed(text)
    pattern = r'/pobierz/etf/' + re.escape(share['mirrorCode']) + r'/KA/(\d{4}-\d{2}-\d{2})'
    candidates = {}
    for url in links.urls:
        parts = urlparse(url)
        match = re.fullmatch(pattern, parts.path)
        if match and parts.scheme == 'https' and parts.netloc == 'dokumenty.analizy.pl' and not parts.query and not parts.fragment:
            candidates[match[1]] = url
    if not candidates: reject('No current BNP factsheet link published by document mirror')
    # Do not fall back to an older file if the latest advertised PDF is invalid.
    stamp = document_date(max(candidates), now)
    return candidates[stamp], stamp


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
    if stamp != expected_date: reject('BNP publication date differs from advertised document date')
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
    return {**share, 'productId': isin, 'characteristics': {'terPct': float(fee), 'asOf': stamp, 'feesAsOf': fees_as_of},
            'aum': {'amount': number(round(aum, 2)), 'currency': currency, 'scope': 'fund', 'asOf': stamp},
            'performance': {'currency': currency, 'basis': 'fund', 'method': 'calendar-year exact-share NAV net total return, income reinvested, fund fees included',
                            'asOf': stamp, 'years': dict(sorted(calendar.items()))},
            'unavailable': ['countries/sectors/holdings: document exposure tables not qualified by this connector']}


def collect_one(share, now, fetch=download):
    page = share['discoveryUrl']
    if urlparse(page).netloc != 'www.analizy.pl' or not urlparse(page).path.startswith('/etf/' + share['isin'] + '/'):
        reject('Unexpected BNP mirror discovery URL')
    url, stamp = discover(fetch(page), share, now)
    body = fetch(url); result = parse(pdf_text(body), share, now, stamp)
    result['sourceUrl'] = url
    for field in ('characteristics', 'aum', 'performance'):
        result[field].update(sourceUrl=url, discoveryUrl=page, sha256=proof(body),
                             sourceLabel='Fiche BNP Paribas Asset Management · copie hébergée par Analizy',
                             publisher='BNP Paribas Asset Management', documentHost='Analizy')
    return result
