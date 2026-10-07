"""Discover the fund sector widget on the exact VanEck UCITS page."""
import datetime as dt
from html.parser import HTMLParser
import json
import re
from urllib.parse import urlparse, urlencode
from data_automation import reject
from issuer_documents import document_date, validated_rows, proof


class Widgets(HTMLParser):
    def __init__(self):
        super().__init__(); self.widgets = []; self.tag = None; self.values = {}
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 've-holdingsweightingschartblock': self.widgets.append(attrs)
        self.tag = tag if tag in ('ve-fundticker', 've-country', 've-language') else None
    def handle_data(self, data):
        if self.tag: self.values[self.tag] = data.strip()
    def handle_endtag(self, tag):
        if tag == self.tag: self.tag = None


def discover(body, share):
    text = body.decode('utf-8'); parser = Widgets(); parser.feed(text)
    # Schema.org identifies the UCITS part; ticker alone could identify a US ETF.
    identifiers = set(re.findall(r'data-value="([A-Z0-9]{12})"', text))
    if identifiers != {share['isin']} or parser.values.get('ve-fundticker') != share['apiTicker']:
        reject('Wrong VanEck UCITS page identity')
    if parser.values.get('ve-country') != 'uk' or parser.values.get('ve-language') != 'en':
        reject('Unexpected VanEck page region')
    fund_section = re.search(r'<section\b[^>]*\bid="portfolio"[^>]*>(.*?)</section>', text, re.S)
    if not fund_section: reject('No VanEck fund portfolio section')
    fund = Widgets(); fund.feed(fund_section[1])
    candidates = []
    for widget in fund.widgets:
        block, page = widget.get('data-blockid', ''), widget.get('data-pageid', '')
        if not block.isdigit() or not page.isdigit(): reject('Invalid VanEck widget identity')
        candidates.append('https://www.vaneck.com/Main/HoldingsWeightingsChartBlock/GetContent/?' + urlencode({
            'blockid': block, 'pageid': page, 'ticker': share['apiTicker'], 'reactlang': 'en', 'reactctr': 'uk'}))
    if not candidates: reject('No VanEck fund allocation widget')
    return list(dict.fromkeys(candidates))


def parse(body, share, url, now):
    data = json.loads(body)['data']
    # Index widgets are explicitly excluded, even when using the same ticker.
    if data.get('Title') != 'Sector Weightings (%)': return None
    classification = data.get('WeightingsType')
    if (data.get('Ticker') != share['apiTicker'] or classification not in ('Sector', 'SubIndustry')
            or data.get('SecondColumnTitle') != '% of Net Assets'):
        reject('VanEck sector scope changed')
    stamp = document_date(data['AsOfDate'], now)
    rows = []
    for point in data['Holdings']:
        point_date = dt.datetime.strptime(point['AsOfDate'], '%m/%d/%y').date().isoformat()
        if point['Ticker'] != share['apiTicker'] or point['LabelType'] != classification or point_date != stamp:
            reject('Mixed VanEck allocation identity or dates')
        rows.append({'name': point['Label'], 'weightPct': float(point['Weight'])})
    validated_rows(rows)
    return {'asOf': stamp, 'basis': 'fund', 'method': 'Published ' + classification + ' weights, percent of net assets, no renormalisation',
            'sourceUrl': url, 'discoveryUrl': share['pageUrl'], 'sha256': proof(body), 'rows': rows}


def collect(share, now, fetch):
    page = urlparse(share['pageUrl'])
    if page.scheme != 'https' or page.netloc != 'www.vaneck.com' or not re.fullmatch(r'/uk/en/investments/[a-z-]+/', page.path):
        reject('Unexpected VanEck product page URL')
    matches = []
    for url in discover(fetch(share['pageUrl']), share):
        sectors = parse(fetch(url), share, url, now)
        if sectors: matches.append(sectors)
    if len(matches) != 1: reject('Missing or ambiguous VanEck fund sector widget')
    return matches[0]
