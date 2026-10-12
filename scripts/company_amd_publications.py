"""Discover AMD's official archive and parse consolidated GAAP statements.

No report URL or financial value is seeded. Future archive entries are discovered
on every collection; unknown units, dates and layouts fail closed.
"""
import datetime as dt
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from company_publications import get, row, MONTHS

ARCHIVE = 'https://ir.amd.com/financial-information/financial-results'


def parse(raw, source_url, today):
    soup = BeautifulSoup(raw, 'html.parser')
    choices = []
    for table in soup.select('table'):
        heading = table.find_previous(['p', 'h3', 'h4'])
        title = heading.get_text(' ', strip=True) if heading else ''
        if not re.search(r'ADVANCED MICRO DEVICES, INC\.\s+(?:CONDENSED )?CONSOLIDATED STATEMENTS OF OPERATIONS', title, re.I):
            continue
        if not re.search(r'\bMillions except per share', title, re.I):
            raise ValueError('Unknown AMD statement units')
        lines = []
        for tr in table.select('tr'):
            if tr.find_parent('table') is not table:
                continue
            lines.append(' '.join(c.get_text(' ', strip=True) for c in tr.find_all(['td', 'th'], recursive=False)))
        choices.append('\n'.join(lines))
    if len(choices) != 1:
        raise ValueError('Missing or ambiguous AMD consolidated GAAP statement / ' + source_url)
    text = choices[0]
    header = ' '.join(re.split(r'\n\s*Net revenue', text, flags=re.I)[0].split())
    dates = [dt.date(int(year), MONTHS[month.lower()], int(day))
             for month, day, year in re.findall(r'\b(' + '|'.join(m.title() for m in MONTHS) + r')\s+(\d{1,2}),\s+(20\d{2})', header)]
    if len(dates) not in (3, 5) or 'three months ended' not in header.lower():
        raise ValueError('Unknown AMD quarterly column layout')
    if not (75 <= (dates[0] - dates[1]).days <= 105 and 330 <= (dates[0] - dates[2]).days <= 400):
        raise ValueError('AMD quarterly/comparative dates do not align')
    if dates[0] > today:
        raise ValueError('Future AMD statement')
    annual = len(dates) == 5 and bool(re.search(r'(?:year|twelve months) ended', header, re.I))
    if len(dates) == 5 and (dates[3] != dates[0] or dates[4] != dates[2]):
        raise ValueError('Unknown AMD annual columns: ' + source_url + ' / ' + header[:450])
    values = {}
    for field, labels in [('revenue', [r'Net revenue']), ('netIncome', [r'Net income']),
                          ('operatingIncome', [r'Operating income(?: \(loss\))?']),
                          ('dilutedEPS', [r'Diluted earnings(?: \(loss\))? per share', r'Diluted net income per share', r'Diluted'])]:
        field_text = re.split(r'Shares used in per share calculation', text, flags=re.I)[0] if field == 'dilutedEPS' else text
        values[field] = row(field_text, labels, len(dates))
        if values[field] is None:
            raise ValueError('Incomplete AMD GAAP statement: ' + field + ' / ' + source_url)
    if any(v <= 0 for v in values['revenue']):
        raise ValueError('Invalid AMD revenue')
    def period(index, previous, duration):
        p = {'start': None, 'end': dates[index].isoformat(), 'previousStart': None,
             'previousEnd': dates[previous].isoformat(), 'sourceUrl': source_url,
             'durationMonths': duration, 'tags': {}}
        for field, data in values.items():
            multiplier = 1 if field == 'dilutedEPS' else 1e6
            p[field] = data[index] * multiplier
            p['previous' + field[0].upper() + field[1:]] = data[previous] * multiplier
            p['tags'][field] = 'AMD consolidated GAAP statement'
        p['margin'] = p['netIncome'] / p['revenue'] * 100
        return p
    return {'quarter': period(0, 2, 3), 'annual': period(3, 4, 12) if annual else None}


def collect(profile, today, old=None):
    if profile['id'] != 'amd' or profile['symbol'] != 'AMD':
        raise ValueError('Unsupported AMD identity')
    soup = BeautifulSoup(get(ARCHIVE), 'html.parser')
    urls = list(dict.fromkeys(a['href'] for a in soup.select('a[href]')
           if urlparse(a['href']).hostname == 'ir.amd.com'
           and re.search(r'/amd-reports-(?:first|second|third|fourth)-quarter', a['href'])))
    if not urls:
        raise ValueError('AMD archive has no earnings releases')
    # Quarterly headlines include their actual fiscal year; order by archive,
    # not an invented publication calendar. Three-to-five annual reports are
    # sufficient for history, with their most recent comparatives preferred.
    selected = list(dict.fromkeys(urls[:4] + [u for u in urls if 'fourth-quarter' in u][:3]))
    def load(url):
        return parse(get(url), url, today)
    with ThreadPoolExecutor(max_workers=3) as pool:
        reports = list(pool.map(load, selected))
    quarters = sorted({r['quarter']['end']: r['quarter'] for r in reports}.values(), key=lambda r: r['end'], reverse=True)[:4]
    annuals = sorted([r['annual'] for r in reports if r['annual']], key=lambda r: r['end'], reverse=True)
    if len(quarters) != 4 or not annuals:
        raise ValueError('AMD requires four published quarters and annual accounts')
    if any(not 75 <= (dt.date.fromisoformat(a['end']) - dt.date.fromisoformat(b['end'])).days <= 105 for a, b in zip(quarters, quarters[1:])):
        raise ValueError('Missing AMD quarter in trailing EPS')
    annual = annuals[0]
    if (today - dt.date.fromisoformat(annual['end'])).days > 550 or (today - dt.date.fromisoformat(quarters[0]['end'])).days > 200:
        raise ValueError('Stale AMD accounts')
    history = {}
    # Apply older statements first, allowing newer restated comparatives to win.
    for a in reversed(annuals):
        for previous in (True, False):
            end = a['previousEnd'] if previous else a['end']
            revenue = a['previousRevenue'] if previous else a['revenue']
            income = a['previousNetIncome'] if previous else a['netIncome']
            history[end] = {'start': None, 'end': end, 'revenue': revenue, 'netIncome': income,
                            'margin': income / revenue * 100, 'sourceUrl': a['sourceUrl']}
    years = sorted(history.values(), key=lambda r: r['end'])[-5:]
    return {'annual': annual, 'quarter': quarters[0] if quarters[0]['end'] > annual['end'] else None,
            'quarters': quarters, 'historyYears': years, 'historyObservedAt': today.isoformat(),
            'trailing': {'end': quarters[0]['end'], 'dilutedEPS': sum(p['dilutedEPS'] for p in quarters),
                         'revenue': sum(p['revenue'] for p in quarters),
                         'sourceUrls': [p['sourceUrl'] for p in quarters],
                         'definition': 'Somme de quatre trimestres GAAP publiés, sur la même base par action'}}
