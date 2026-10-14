"""Qualified issuer balances; ROIC stays unavailable without a qualified NOPAT.

Only explicitly qualified GAAP adapters are accepted. No SEC mirrors, estimates,
net debt inferred from a long-term-only debt line, or cache recertification.
"""
import datetime as dt
import re
from urllib.parse import urlparse
from company_publications import get, sections, numbers, statement, MONTHS

SUPPORTED = {'apple': 'www.apple.com', 'microsoft': 'www.microsoft.com',
             'nvidia': 'nvidianews.nvidia.com', 'alphabet': 's206.q4cdn.com',
             'amazon': 'ir.aboutamazon.com', 'adobe':'www.adobe.com'}
VERSION = 1


def row(text, labels, count):
    for label in labels:
        matches = re.findall(r'^\s*' + label + r'\s+([^\n]+)$', text, re.I | re.M)
        matches = [m for m in matches if not re.search(r'[A-Za-z]', m)]
        if not matches: continue
        if len(matches) != 1: raise ValueError('Ambiguous balance row: ' + label)
        # PDF glyph spacing can split the leading digit of a comma-grouped
        # amount (Apple: "$ 3 83,266"). Join only that known numeric pattern.
        value = re.sub(r'\$\s*(\d)\s+(\d{2},\d{3}\b)', r'$ \1\2', matches[0])
        values = numbers(value)
        if len(values) != count: raise ValueError('Unknown balance columns: ' + label)
        return values
    return None


def parse_balance(raw, ident, expected_end, today):
    candidates = []
    for text in sections(raw):
        if ident == 'adobe':
            blocks = re.split(r'(?im)^Condensed Consolidated Balance Sheets\s*$', text)
            if len(blocks) == 1:continue
            if len(blocks) != 2:raise ValueError('Ambiguous Adobe balance caption')
            text = 'CONSOLIDATED BALANCE SHEETS\n' + re.split(r'(?im)^Condensed Consolidated Statements of Cash Flows\s*$', blocks[1])[0]
        if not re.search(r'CONSOLIDATED BALANCE SHEETS', text, re.I):
            # Microsoft's caption and unit are outside the table. Check both
            # in the actual HTML, never infer them from a numeric row alone.
            if ident != 'microsoft' or 'Total current assets' not in text:
                continue
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(raw, 'html.parser')
            tables = [t for t in soup.find_all('table') if 'Total current assets' in ' '.join(t.get_text(' ', strip=True).split()) and not t.find('table')]
            if len(tables) != 1:
                raise ValueError('Ambiguous Microsoft balance table')
            caption = tables[0].find('caption')
            preceding = caption.get_text(' ', strip=True) if caption else ''
            if not re.search(r'BALANCE SHEETS', preceding, re.I) or not re.search(r'in millions', preceding, re.I):
                raise ValueError('Missing Microsoft balance caption/unit')
        elif not re.search(r'in millions', text, re.I):
            raise ValueError('Unknown balance units')
        header = re.split(r'(?im)^\s*(?:ASSETS|Current assets)', text, 1)[0]
        years = re.findall(r'\b20\d{2}\b', header)
        dates = re.findall(r'\b(' + '|'.join(MONTHS) + r')\s+(\d{1,2}),', header, re.I)
        if len(years) != 2 or len(dates) not in (1, 2):
            raise ValueError('Unknown balance date columns')
        ends = [dt.date(int(y), MONTHS[dates[i if len(dates) == 2 else 0][0].lower()],
                        int(dates[i if len(dates) == 2 else 0][1])).isoformat() for i, y in enumerate(years)]
        if len(set(ends)) != 2 or expected_end not in ends or any(dt.date.fromisoformat(e) > today for e in ends):
            raise ValueError('Balance period mismatch')
        text = re.sub(r'\.{2,}', ' ', text)
        text = text.replace('’', "'")
        labels = {'assets': [r'Total assets'], 'currentAssets': [r'Total current assets'],
                  'currentLiabilities': [r'Total current liabilities'],
                  'equity': [r'Total (?:shareholders|stockholders)\x27 equity', r'Shareholders\x27 equity'],
                  'liabilitiesAndEquity': [r'Total liabilities and (?:shareholders|stockholders)\x27 equity']}
        values = {k: row(text, v, 2) for k, v in labels.items()}
        if any(v is None for v in values.values()):
            raise ValueError('Incomplete classified consolidated balance')
        optional = {'cash': [r'Cash and cash equivalents'], 'inventories': [r'Inventories']}
        for key, label in optional.items():
            values[key] = row(text, label, 2)
        liabilities = row(text, [r'Total liabilities'], 2)
        if liabilities is None:
            # Amazon does not report a total-liabilities row. Reconcile all
            # separately published non-current totals, including leases.
            if ident != 'amazon':
                raise ValueError('Missing consolidated liabilities')
            components = [row(text, [label], 2) for label in
                          [r'Long-term lease liabilities', r'Long-term debt', r'Other long-term liabilities']]
            if any(v is None for v in components):
                raise ValueError('Incomplete Amazon liabilities')
            liabilities = [values['currentLiabilities'][i] + sum(v[i] for v in components) for i in range(2)]
        balances = []
        for i, end in enumerate(ends):
            b = {k: v[i] * 1e6 for k, v in values.items() if v is not None}
            b.update(asOf=end, liabilities=liabilities[i] * 1e6)
            validate_balance(b)
            balances.append(b)
        candidates.append(sorted(balances, key=lambda b: b['asOf']))
    if len(candidates) != 1:
        raise ValueError('Missing or ambiguous qualified balance')
    return candidates[0]


def validate_balance(b):
    import math
    fields = ('assets', 'liabilities', 'equity', 'currentAssets', 'currentLiabilities', 'liabilitiesAndEquity')
    if any(isinstance(b.get(k), bool) or not isinstance(b.get(k), (int, float)) or not math.isfinite(b[k]) for k in fields):
        raise ValueError('Invalid balance component')
    if any(b[k] < 0 for k in fields if k != 'equity') or any(not math.isfinite(b[k]) or b[k] < 0 for k in ('cash', 'inventories') if k in b):
        raise ValueError('Negative unsigned balance component')
    if abs(b['assets'] - b['liabilitiesAndEquity']) > 1e6 or abs(b['assets'] - b['liabilities'] - b['equity']) > 1e6:
        raise ValueError('Balance equation does not reconcile')
    if b['currentAssets'] > b['assets'] or b['currentLiabilities'] > b['liabilities'] or any(b[k] > b['currentAssets'] for k in ('cash', 'inventories') if k in b):
        raise ValueError('Invalid balance subtotals')
    return b


def collect_balance(profile, company, today):
    ident = profile['id']
    if ident not in SUPPORTED:
        raise NotImplementedError('No qualified issuer balance adapter')
    a = company['annual']
    latest = max((company.get(k) or {}).get('end', '') for k in ('annual', 'quarter', 'halfYear'))
    observations = {}
    annual_balances = None
    for period in [a, next(p for k in ('annual', 'quarter', 'halfYear') if (p := company.get(k)) and p['end'] == latest)]:
        url = period.get('sourceUrl', '')
        if urlparse(url).scheme != 'https' or urlparse(url).hostname != SUPPORTED[ident]:
            raise ValueError('Unexpected issuer document host')
        raw = get(url)
        parsed = None
        if ident == 'adobe':
            from company_round2_publications import parse
            periods = parse(raw, ident, url, today)
            matching = [p for p in periods if p['end'] == period['end'] and p['durationMonths'] == period['durationMonths']]
            if len(matching) != 1:raise ValueError('Ambiguous Adobe balance income period')
            income = matching[0]
        else:
            parsed, _ = statement(raw, ident)
        kind = 'annual' if period['end'] == a['end'] else 'quarter'
        if parsed is not None:income = parsed[kind]
        if not income or any(income[k] != period[k] for k in ('end', 'revenue', 'netIncome')):
            raise ValueError('Balance document income mismatch')
        balances = parse_balance(raw, ident, period['end'], today)
        if period['end'] == a['end']:
            annual_balances = balances
            if [b['asOf'] for b in balances] != [a['previousEnd'], a['end']]:
                raise ValueError('Annual equity opening/closing dates mismatch')
        for b in balances:
            observations[b['asOf']] = {**b, 'sourceUrl': url}
    # Keep the annual comparison together from one document: a later quarter
    # must not change just one endpoint of the annual ROE denominator.
    return {'componentVersion': VERSION, 'observedAt': today.isoformat(),
            'annualEnd': a['end'], 'revenue': a['revenue'], 'netIncome': a['netIncome'],
            'accountsEndAtCollection': latest, 'annualBalances': [{**b, 'sourceUrl': a['sourceUrl']} for b in annual_balances],
            'latestBalance': observations[latest],
            'method': 'Consolidated GAAP issuer balance; opening and closing annual equity from the same comparative document'}
