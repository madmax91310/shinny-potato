"""Exact-share public sources for physical Global X and JPMorgan presentation ETFs."""
import datetime as dt
from issuer_calendar_capture import capture_year_end
import json
import re
from urllib.parse import urlparse
from collect_public_issuer import Page, only, money, base
from issuer_documents import public_page, download, pdf_text, proof, document_date, validated_rows, bounded_return
from data_automation import reject


def globalx_physical(text, share, now):
    page = Page(text)
    block = '\n'.join(page.tokens)
    if share['isin'] != 'IE0003Z9E2Y3' or share['currency'] != 'USD':
        reject('Unsupported Global X exact accumulating share')
    if f'Primary ISIN\n{share["isin"]}\n' not in block or 'USD Accumulating' not in block:
        reject('Wrong Global X share/income policy')
    key = block.split('Key Information\nAs of ', 1)[1].split('Distributions', 1)[0]
    stamp = document_date(key.splitlines()[0], now)
    style = only(re.findall(r'Management Style\n([^\n]+)', block), 'Global X management style')
    if style != 'Physical - Full Replication - Passively Managed Index Tracking':
        reject('Global X replication changed')
    ter = float(only(re.findall(r'Total Expense Ratio\n([\d.]+)\n%', key), 'TER'))
    if not 0 <= ter <= 5: reject('Invalid Global X TER')
    amount, currency = money(only(re.findall(r'Fund AUM\n([^\n]+)', key), 'AUM'))
    if currency != share['currency']: reject('Global X AUM currency mismatch')
    digest = proof(text.encode())
    result = base(share, stamp, digest)
    result['characteristics']['terPct'] = ter
    result['aum'] = dict(amount=amount, currency=currency, scope='fund', asOf=stamp, sourceUrl=share['sourceUrl'], sha256=digest)
    for field, title, header in [('countries', 'Country Breakdown', ['', 'Country', 'Weight (%)']),
                                 ('sectors', 'Sector Breakdown', ['', 'Sector', 'Weight (%)']),
                                 ('holdings', 'Top Holdings', ['Net Assets (%)', 'Ticker', 'Name', 'Country', 'SEDOL', 'Market Price ($)', 'Shares Held', 'Market Value ($)'])]:
        table = only([t for t in page.tables if title + ' As of' in t['context'] and t['rows'][0] == header], title)
        date = document_date(only(re.findall(r'As of (\d+ [A-Za-z]+ \d{4})', table['context'].split(title, 1)[1]), title + ' date'), now)
        rows = [dict(name=r[2], weightPct=float(r[0])) if field == 'holdings' else dict(name=r[1], weightPct=float(r[2])) for r in table['rows'][1:]]
        result[field] = dict(rows=validated_rows(rows, complete=field != 'holdings'), asOf=date, basis='fund', sourceUrl=share['sourceUrl'], sha256=digest)
    # Next.js embeds the same public performance props as the visible table.
    # Its discrete returns are April-to-April, never complete calendar years.
    chunks = []
    for match in re.finditer(r'self\.__next_f\.push\((.*?)\)</script>', text):
        payload = json.loads(match[1])
        if len(payload) > 1 and isinstance(payload[1], str): chunks.append(payload[1])
    rsc = '\n'.join(chunks)
    candidates = []
    for match in re.finditer(r'"performance":\s*(?=\{)', rsc):
        value, _ = json.JSONDecoder().raw_decode(rsc[match.end():])
        if 'PERFORMANCE_HISTORY' in value: candidates.append(value)
    performance = only(candidates, 'Global X public performance')
    if performance['ETF_TICKER'] != 'COPX': reject('Wrong Global X performance product')
    document_date(performance['AS_OF_DATE'], now)
    history = performance['PERFORMANCE_HISTORY']
    date = document_date(history['month_end_date'], now)
    returns = history['cumulative']['month_end']['fund_nav']
    observations = [dict(label=label, value=bounded_return(100 * returns[key]), asOf=date)
                    for key, label in [('ONE_MONTH', '1 mois'), ('THREE_MONTH', '3 mois'), ('ONE_YEAR', '1 an'), ('YTD', 'Depuis janvier'), ('SINCE_INCEPTION', 'Depuis le lancement')]]
    result['performance'] = dict(currency='USD', basis='fund', years={}, observations=observations,
        asOf=date, sourceUrl=share['sourceUrl'], sha256=digest, note='',
        method='cumulative exact-share NAV total return, gross income reinvested, net of fees')
    launch = document_date(only(re.findall(r'Inception Date\n([^\n]+)', key), 'Global X inception'), now, max_age=36500)
    capture_year_end(result['performance'], launch, now)
    return result


def jpm_document(body, share, now):
    text = pdf_text(body)
    normalized = ' '.join(text.split())
    right = pdf_text(body, (290, 310))
    right_labels = ' '.join(right.split())
    if (share['isin'] not in text or f'1 Class: {share["documentName"]}' not in right_labels
            or '2 Benchmark: MSCI World Index (Total Return Net)' not in right_labels):
        reject('Wrong JPMorgan exact share')
    stamp = document_date(only(re.findall(r'^Factsheet \| (\d+ [A-Za-z]+ \d{4})', text, re.M), 'JPMorgan document date'), now)
    facts = pdf_text(body, (100, 190))
    if not re.search(r'Share class\s+Class launch\s*\n\s*currency USD\s+\d+ [A-Za-z]+ \d{4}', facts) or not re.search(r'Fund reference\s*\n\s*currency USD', text):
        reject('JPMorgan share currency mismatch')
    if 'income (gross) reinvested including actual ongoing charges' not in normalized:
        reject('JPMorgan performance convention changed')
    ter = float(only(re.findall(r'Total Expense Ratio\*\s+([\d.]+)%', text), 'TER'))
    if not 0 <= ter <= 5: reject('Invalid JPMorgan TER')
    amount = float(only(re.findall(r'Fund assets[^\n]*\n[^\n]*?USD ([\d.]+)m', text), 'fund assets')) * 1e6
    if amount <= 0: reject('Invalid JPMorgan AUM')
    digest = proof(body)
    result = base(share, stamp, digest)
    result['characteristics']['terPct'] = ter
    result['aum'] = dict(amount=amount, currency='USD', scope='fund', asOf=stamp, sourceUrl=share['sourceUrl'], sha256=digest)
    calendar = right.split('Calendar Year Performance (%)', 1)[1].split('Return (%)', 1)[0]
    lines = [line.strip() for line in calendar.splitlines() if line.strip()]
    years = lines[0].split(); values = lines[1].split()
    if len(years) != len(values) or len(set(years)) != len(years) or any(not re.fullmatch(r'20\d{2}', y) or int(y) >= now.year for y in years):
        reject('JPMorgan calendar columns changed')
    launch = dt.date.fromisoformat(document_date(only(re.findall(r'Class launch\s*\n\s*currency USD\s+(\d+ [A-Za-z]+ \d{4})', facts), 'class launch'), now, max_age=36500))
    returns = {y: bounded_return(float(v)) for y, v in zip(years, values) if v != '-' and launch <= dt.date(int(y), 1, 1)}
    if not returns or max(map(int, returns)) != now.year - 1: reject('JPMorgan complete calendar missing')
    result['performance'] = dict(currency='USD', basis='fund', years=returns, asOf=stamp,
        sourceUrl=share['sourceUrl'], sha256=digest, method='calendar-year exact-share NAV total return, gross income reinvested, net of ongoing charges')
    for field, start, end in [('countries', 'Regions (%)', 'Figures shown'), ('sectors', 'Sectors (%)', 'Figures shown')]:
        section = right.split(start, 1)[1].split(end, 1)[0]
        rows = [dict(name=m[2].strip(), weightPct=float(m[1])) for m in re.finditer(r'^\s*n ([\d.]+)\s+(.+)$', section, re.M)]
        result[field] = dict(rows=validated_rows(rows), asOf=stamp, basis='fund', sourceUrl=share['sourceUrl'], sha256=digest)
    names = pdf_text(body, (0, 145)).split('Top 10', 1)[1].split('Value at Risk', 1)[0]
    names = [x.strip().replace('--', '-') for x in names.splitlines() if x.strip() and x.strip() != 'Coca']
    weights = pdf_text(body, (240, 50)).split('% of assets', 1)[1].split('Fund', 1)[0]
    weights = re.findall(r'^\s*(\d+\.\d+)\s*$', weights, re.M)
    if len(names) != 10 or len(weights) != 10: reject('JPMorgan top ten changed')
    result['holdings'] = dict(rows=validated_rows([dict(name=n, weightPct=float(w)) for n, w in zip(names, weights)], complete=False),
        asOf=stamp, basis='fund', sourceUrl=share['sourceUrl'], sha256=digest)
    return result


def collect_one(share, now):
    parsed = urlparse(share['sourceUrl'])
    if share['parser'] == 'globalx-physical':
        if share['sourceUrl'] != 'https://globalxetfs.eu/funds/copx/': reject('Unexpected Global X official source')
        return globalx_physical(public_page(share['sourceUrl']), share, now)
    expected = 'https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/sg/en/literature/fact-sheet/factsheet-jpmorgan-global-equity-premium-income-active-ucits-etf.pdf'
    if parsed.scheme != 'https' or share['sourceUrl'] != expected: reject('Unexpected JPMorgan official source')
    return jpm_document(download(expected), share, now)
