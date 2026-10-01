"""Refresh selected SEC 13F portfolios for the static investor tool."""
import datetime as dt
import json
import os
import pathlib
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANAGERS = {
    'li-lu': ('1709323', 'Li Lu', 'Himalaya Capital Management LLC'),
    'gates-trust': ('1166559', 'Gates Foundation Trust', 'Gates Foundation Trust'),
    'klarman': ('1061768', 'Seth Klarman', 'Baupost Group LLC'),
}
HEADERS = {'User-Agent': os.environ.get('SEC_USER_AGENT', 'Epargnant Libre research contact github.com/madmax91310/shinny-potato'), 'Accept-Encoding': 'identity'}


def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError):
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def local_tag(element):
    return element.tag.rsplit('}', 1)[-1].lower()


def field(element, name):
    return next((child.text.strip() for child in element if local_tag(child) == name.lower() and child.text), '')


def parse_table(xml):
    root = ET.fromstring(xml)
    rows = []
    for item in root.iter():
        if local_tag(item) != 'infotable':
            continue
        value = float(field(item, 'value') or 0)
        if value <= 0:
            continue
        rows.append({'issuerName': field(item, 'nameOfIssuer'), 'ticker': '', 'cusip': field(item, 'cusip'),
                     'putCall': field(item, 'putCall') or None, 'value': value})
    return rows


def latest_filing(submissions):
    recent = submissions['filings']['recent']
    filings = [dict(zip(recent.keys(), values)) for values in zip(*recent.values())]
    eligible = [row for row in filings if row['form'] in ('13F-HR', '13F-HR/A') and row['reportDate']]
    if not eligible:
        raise ValueError('No 13F holdings filing')
    return max(eligible, key=lambda row: (row['reportDate'], row['filingDate']))


def make_portfolio(slug, cik, display, entity):
    submissions = json.loads(get(f'https://data.sec.gov/submissions/CIK{int(cik):010d}.json'))
    filing = latest_filing(submissions)
    accession = filing['accessionNumber'].replace('-', '')
    base = f'https://www.sec.gov/Archives/edgar/data/{cik}/{accession}'
    index = json.loads(get(f'{base}/index.json'))
    xmls = [entry['name'] for entry in index['directory']['item'] if entry['name'].lower().endswith('.xml') and 'primary_doc' not in entry['name'].lower()]
    rows = []
    for name in xmls:
        try:
            parsed = parse_table(get(f'{base}/{name}'))
        except ET.ParseError:
            continue
        if len(parsed) > len(rows):
            rows = parsed
    if not rows:
        raise ValueError(f'No information table for {slug} in {filing["accessionNumber"]}')
    # A 13F includes options. Keep equity and option rows separate, then express
    # equity weights against the total filing value, consistent with Tracefour.
    total = sum(row['value'] for row in rows)
    if total <= 0:
        raise ValueError('Non-positive filing total')
    holdings = [{**row, 'weight': row['value'] / total} for row in rows]
    return {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(), 'data': {
        'identity': {'slug': slug, 'archetype': 'hedge_fund', 'displayName': display, 'entityName': entity, 'dataProvider': 'SEC'},
        'snapshot': {'periodEnd': filing['reportDate'], 'filedAt': filing['filingDate'], 'holdings': holdings},
        'sourceUrl': f'{base}/{filing["accessionNumber"]}-index.html',
    }}


def main():
    directory = ROOT / 'public/data/investors'
    directory.mkdir(parents=True, exist_ok=True)
    for slug, (cik, display, entity) in MANAGERS.items():
        portfolio = make_portfolio(slug, cik, display, entity)
        destination = directory / f'{slug}.json'
        if destination.exists():
            previous = json.loads(destination.read_text())
            if previous['data'] == portfolio['data']:
                print(slug, 'unchanged')
                continue
        destination.write_text(json.dumps(portfolio, ensure_ascii=False, indent=2) + '\n')
        print(slug, portfolio['data']['snapshot']['periodEnd'], len(portfolio['data']['snapshot']['holdings']))
        time.sleep(.2)


if __name__ == '__main__':
    main()
