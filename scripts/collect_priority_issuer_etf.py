"""Exact-share fees, dated fund assets and published NAV returns for remaining issuers."""
from issuer_calendar_capture import capture_year_end
import json
import re
from collect_public_issuer import Page, only, money, base
from issuer_documents import public_page, download, pdf_text, proof, document_date, bounded_return, validated_rows
from data_automation import reject, ResponseFormatError


def silver(text, share, now):
    if share['isin'] != 'IE000UL6CLP7' or share['currency'] != 'USD':
        reject('Wrong Silver Miners share configuration')
    tokens = Page(text).tokens
    from globalx_sections import fact_sections
    sections = fact_sections(text, Page)
    if sections is not None:
        facts, trading = sections
        block = '\n'.join(facts + trading)
        stamp = document_date(only([t.removeprefix('As of ') for t in facts
                                    if t.startswith('As of ')], 'Silver Miners facts date'), now)
    else:
        starts = [i for i, t in enumerate(tokens[:-1]) if t == 'Key Information' and tokens[i+1].startswith('As of ')]
        if not starts:
            raise ResponseFormatError('Incomplete Silver Miners HTML: dated key information missing')
        start = only(starts, 'Silver Miners dated facts')
        # End on the final required trading field, not a decorative section heading.
        # Bound the search so another product or footer cannot fill a truncated block.
        ends = [i for i in range(start + 2, min(len(tokens) - 1, start + 120)) if tokens[i] == 'Management Style']
        if not ends:
            raise ResponseFormatError('Incomplete Silver Miners HTML: trading details missing')
        end = only(ends, 'Silver Miners management style') + 2
        block = '\n'.join(tokens[start:end])
        stamp = document_date(tokens[start+1].removeprefix('As of '), now)
    identities = re.findall(r'Primary ISIN\n([A-Z0-9]{12})', block)
    if not identities:
        raise ResponseFormatError('Incomplete Silver Miners HTML: primary ISIN missing')
    if only(list(dict.fromkeys(identities)), 'Silver Miners ISIN') != share['isin']:
        reject('Wrong Silver Miners exact share')
    if 'USD Accumulating' not in '\n'.join(tokens) or 'Physical - Full Replication - Passively Managed Index Tracking' not in block:
        reject('Silver Miners income policy or replication changed')
    # Trading details have their own date; the fund assets use the key facts date.
    ter = float(only(re.findall(r'Total Expense Ratio\n([\d.]+)\n%', block), 'Silver Miners fee'))
    if not 0 <= ter <= 5: reject('Invalid Silver Miners fee')
    amount, currency = money(only(re.findall(r'Fund AUM\n([^\n]+)', block), 'Silver Miners AUM'))
    if currency != 'USD': reject('Silver Miners AUM currency changed')
    digest = proof(text.encode()); result = base(share, stamp, digest)
    result['characteristics']['terPct'] = ter
    result['aum'] = dict(amount=amount, currency=currency, scope='fund', asOf=stamp, sourceUrl=share['sourceUrl'], sha256=digest)
    chunks = []
    for m in re.finditer(r'self\.__next_f\.push\((.*?)\)</script>', text):
        payload = json.loads(m[1])
        if len(payload) > 1 and isinstance(payload[1], str): chunks.append(payload[1])
    rsc = '\n'.join(chunks); candidates = []
    for m in re.finditer(r'"performance":\s*(?=\{)', rsc):
        value, _ = json.JSONDecoder().raw_decode(rsc[m.end():])
        if 'PERFORMANCE_HISTORY' in value: candidates.append(value)
    if not candidates:
        raise ResponseFormatError('Incomplete Silver Miners HTML: performance payload missing')
    performance = only(candidates, 'Silver Miners performance')
    if performance['ETF_TICKER'] != 'SILV': reject('Wrong Silver Miners performance ticker')
    document_date(performance['AS_OF_DATE'], now)
    history = performance['PERFORMANCE_HISTORY']; date = document_date(history['month_end_date'], now)
    returns = history['cumulative']['month_end']['fund_nav']
    result['performance'] = dict(currency='USD', basis='fund', years={}, asOf=date, sourceUrl=share['sourceUrl'], sha256=digest,
        method='cumulative exact-share NAV total return, gross income reinvested, net of fees',
        observations=[dict(label=label, value=bounded_return(100 * returns[key]), asOf=date) for key, label in
            [('ONE_MONTH','1 mois'),('THREE_MONTH','3 mois'),('ONE_YEAR','1 an'),('YTD','Depuis janvier'),('SINCE_INCEPTION','Depuis le lancement')]])
    launch = document_date(only(re.findall(r'Inception Date\n([^\n]+)', block), 'Silver Miners inception'), now, max_age=36500)
    capture_year_end(result['performance'], launch, now)
    # Use only explicitly dated portfolio tables, never lending collateral.
    page = Page(text)
    for field, title, header in [
        ('countries', 'Country Breakdown', ['', 'Country', 'Weight (%)']),
        ('holdings', 'Top Holdings', ['Net Assets (%)', 'Ticker', 'Name', 'Country', 'SEDOL', 'Market Price ($)', 'Shares Held', 'Market Value ($)']),
    ]:
        tables = [t for t in page.tables if title + ' As of' in t['context'] and t['rows'][0] == header]
        if not tables:
            raise ResponseFormatError('Incomplete Silver Miners portfolio: ' + title)
        table = only(tables, title)
        date = document_date(only(re.findall(r'As of (\d+ [A-Za-z]+ \d{4})', table['context'].split(title, 1)[1]), title + ' date'), now)
        rows = [dict(name=r[2], weightPct=float(r[0])) if field == 'holdings'
                else dict(name=r[1], weightPct=float(r[2])) for r in table['rows'][1:]]
        result[field] = dict(rows=validated_rows(rows, complete=field != 'holdings'), asOf=date,
                             basis='fund', sourceUrl=share['sourceUrl'], sha256=digest)
    result['unavailable'] = ['performance-calendar: issuer discrete returns are rolling years, not calendar years; separately collected exact-share market histories preserved',
                             'sectors: no complete sector allocation published in the official page']
    # The issuer currently hides this chart. Re-evaluate the dated, fund-scoped
    # table every day so a future publication does not require a manual refresh.
    sector_tables = [t for t in page.tables if 'Sector Breakdown As of' in t['context']
                     and 'Reference Index' not in t['context']
                     and t['rows'] and t['rows'][0] == ['', 'Sector', 'Weight (%)']]
    qualification = dict(status='not-published', checkedAt=now.date().isoformat(),
        sourceUrl=share['sourceUrl'], sha256=digest,
        reason='Aucun tableau sectoriel complet du fonds dans la page officielle contrôlée.',
        evidence={'datedCountryTable': True, 'datedHoldingsTable': True, 'sectorTables': len(sector_tables)})
    if sector_tables:
        try:
            table = only(sector_tables, 'Silver Miners sectors')
            date = document_date(only(re.findall(r'As of (\d+ [A-Za-z]+ \d{4})', table['context'].split('Sector Breakdown', 1)[1]), 'sector date'), now)
            rows = validated_rows([dict(name=r[1], weightPct=float(r[2])) for r in table['rows'][1:] if len(r) == 3])
            if len(rows) != len(table['rows'])-1:
                reject('Malformed Silver Miners sector table')
            result['sectors'] = dict(rows=rows, asOf=date, basis='fund', sourceUrl=share['sourceUrl'], sha256=digest)
            qualification.update(status='qualified', reason='Table sectorielle complète du fonds, datée et validée.', asOf=date)
            result['unavailable'] = [r for r in result['unavailable'] if not r.startswith('sectors:')]
        except (ValueError, IndexError) as error:
            qualification.update(status='unqualified', reason=str(error))
            result.setdefault('collectionErrors', []).append(dict(field='sectors', url=share['sourceUrl'], reason=str(error)))
    elif 'Sector Breakdown' in page.tokens:
        qualification.update(status='unqualified', reason='Section sectorielle détectée mais tableau complet non reconnu ; format à qualifier.')
        result.setdefault('collectionErrors', []).append(dict(field='sectors', url=share['sourceUrl'], reason=qualification['reason']))
    result['fieldQualification'] = {'sectors': qualification}
    if result['performance']['years']:
        result['unavailable'] = [reason for reason in result['unavailable'] if not reason.startswith('performance-calendar:')]
    return result


def avantis(body, share, now):
    if share['isin'] != 'IE0003R87OG3' or share['currency'] != 'USD': reject('Wrong Avantis share configuration')
    text = pdf_text(body); facts = pdf_text(body, (380, 232)); flat = ' '.join(text.split())
    if share['isin'] not in text or 'Avantis Global Small Cap Value UCITS ETF' not in text or 'USD - Accumulating' not in text:
        reject('Wrong Avantis exact share')
    dates = set(re.findall(r'Marketing Communication as of (\d{2}/\d{2}/\d{4})', text))
    stamp = document_date(only(list(dates), 'Avantis document date'), now)
    if not re.search(r'FUND BASE CURRENCY\s+TOTAL AUM\s+USD\s+\$[\d.]+[BM]', facts):
        reject('Avantis fund currency or AUM layout changed')
    fee = re.search(r'ON-GOING CHARGES FEE p.a\.\s+MSCI World Small Cap Value\s+([\d.]+)%', facts)
    if not fee: reject('Avantis explicit ongoing fee missing')
    ter = float(fee[1])
    if not 0 <= ter <= 5: reject('Invalid Avantis fee')
    aum = re.search(r'FUND BASE CURRENCY\s+TOTAL AUM\s+USD\s+\$([\d.]+)([BM])', facts)
    amount = float(aum[1]) * {'B': 1e9, 'M': 1e6}[aum[2]]
    if amount <= 0: reject('Invalid Avantis AUM')
    digest = proof(body); result = base(share, stamp, digest)
    result['characteristics']['terPct'] = ter
    result['aum'] = dict(amount=amount, currency='USD', scope='fund', asOf=stamp, sourceUrl=share['sourceUrl'], sha256=digest,
                         note='Rounded fund assets as published by issuer: $'+aum[1]+aum[2])
    if 'Data assumes reinvestment of dividends and capital gains' not in flat or 'net asset value (NAV)' not in flat:
        reject('Avantis NAV return convention changed')
    block = text.split('Performance (%)', 1)[1].split('Data presented reflects', 1)[0]
    if not re.search(r'QTR\s+YTD\s+1 YR\s+3 YR\s+5 YR\s+10 YR\s+ITD', block): reject('Avantis return columns changed')
    cells = only(re.findall(r'^NAV\s+(.+)$', block, re.M), 'Avantis NAV row').split()
    # PDF columns at the right contain unrelated fund information after ITD.
    if len(cells) < 7 or any(not re.fullmatch(r'-|[-\d.]+', v) for v in cells[:7]): reject('Avantis NAV values changed')
    observations = [dict(label=label, value=bounded_return(float(cells[i])), asOf=stamp) for i,label in
                    [(0,'Trimestre'),(1,'Depuis janvier'),(2,'1 an')] if cells[i] != '-']
    # ITD is annualised in this document; do not present it as a cumulative return.
    result['performance'] = dict(currency='USD', basis='fund', years={}, observations=observations, asOf=stamp, sourceUrl=share['sourceUrl'], sha256=digest,
        method='cumulative exact-share NAV total return, income reinvested, fund fees included',
        note='Only cumulative QTR/YTD/1-year columns collected; annualised inception return excluded')
    launch = document_date(only(re.findall(r'FUND INCEPTION DATE\s+CUSIP\s+(\d{2}/\d{2}/\d{4})', facts), 'Avantis inception'), now, max_age=36500)
    capture_year_end(result['performance'], launch, now)
    result.update(avantis_composition(text, stamp, share['sourceUrl'], digest))
    result['fieldQualification'] = {'countries': avantis_country_qualification(text, stamp, share['sourceUrl'], digest, now)}
    if result['fieldQualification']['countries']['status'] == 'unqualified':
        result.setdefault('collectionErrors', []).append(dict(field='countries', url=share['sourceUrl'],
            reason=result['fieldQualification']['countries']['reason']))
    result['unavailable'] = ['performance-calendar: current factsheet publishes rolling returns, no complete calendar year; separate exact-share monthly history retained',
                             'countries: top five is not a complete country allocation']
    if result['performance']['years']:
        result['unavailable'] = [reason for reason in result['unavailable'] if not reason.startswith('performance-calendar:')]
    return result


def avantis_country_qualification(text, stamp, url, digest, now):
    """Record what the exact factsheet actually discloses; never infer countries from ISINs."""
    lines = text.splitlines()
    headers = [(i, line.index('Top 5 Countries %')) for i, line in enumerate(lines) if 'Top 5 Countries %' in line]
    result = dict(status='unqualified', checkedAt=now.date().isoformat(), asOf=stamp,
                  sourceUrl=url, sha256=digest,
                  reason='Format géographique modifié ou absent : nouvelle qualification nécessaire.')
    if len(headers) != 1:
        return result
    start, column = headers[0]
    rows = []
    for line in lines[start+1:]:
        if 'DUE TO MARKET VOLATILITY' in line: break
        match = re.fullmatch(r'(.+?)\s{2,}(\d+\.\d+)', line[column:].strip())
        if match: rows.append(dict(name=match[1], weightPct=float(match[2])))
    try:
        validated_rows(rows, complete=False)
        if len(rows) != 5: reject('Expected exactly five countries')
    except ValueError:
        return result
    total = round(sum(r['weightPct'] for r in rows), 2)
    result.update(status='not-published',
        reason=f'La fiche ne publie que les cinq premiers pays ({total:g} %). Le solde ne peut pas être attribué à des pays sans source complète.',
        evidence={'scope':'top-five-countries', 'rows': rows, 'coveragePct': total})
    return result


def avantis_composition(text, stamp, url, digest):
    # Read the Fund column, not the adjacent benchmark or active-weight chart.
    section = text.split('Sector Allocation %', 1)[1].split('DUE TO MARKET VOLATILITY', 1)[0]
    labels = ['Consumer Discretionary', 'Energy', 'Financials', 'Consumer Staples', 'Materials',
              'Industrials', 'Communication Services', 'Information Technology', 'Utilities', 'Health Care', 'Real Estate']
    sectors = []
    for label in labels:
        values = re.findall(re.escape(label) + r'\s{2,}(\d+\.\d+)\s+(\d+\.\d+)', section)
        value = only(values, 'Avantis fund sector ' + label)
        sectors.append(dict(name=label, weightPct=float(value[0])))
    validated_rows(sectors)
    lines = text.splitlines()
    header = only([i for i,line in enumerate(lines) if 'Top 10 Holdings %' in line], 'Avantis holdings heading')
    column = lines[header].index('Top 10 Holdings %')
    holdings = []
    total = None
    for line in lines[header+1:]:
        cell = line[column:].strip()
        if cell.startswith('Top Ten Holdings Total'):
            total = float(cell.split()[-1]); break
        match = re.fullmatch(r'(.+?)\s{2,}(\d+\.\d+)', cell)
        if match:
            holdings.append(dict(name=match[1], weightPct=float(match[2])))
    validated_rows(holdings, complete=False)
    if len(holdings) != 10 or total is None or abs(sum(row['weightPct'] for row in holdings)-total) > .06:
        reject('Avantis top holdings incomplete or total inconsistent')
    return {field:dict(rows=rows, asOf=stamp, basis='fund', sourceUrl=url, sha256=digest)
            for field,rows in [('sectors',sectors),('holdings',holdings)]}


def collect_one(share, now):
    if share['parser'] == 'globalx-priority':
        if share['sourceUrl'] != 'https://globalxetfs.eu/funds/silv/': reject('Unexpected Silver Miners official source')
        attempts = []
        for attempt in range(2):
            try:
                result = silver(public_page(share['sourceUrl']), share, now)
                if attempts:
                    result['sourceAttempts'] = attempts + [{'url': share['sourceUrl'], 'status': 'validated'}]
                return result
            except ResponseFormatError as error:
                attempts.append({'url': share['sourceUrl'], 'reason': str(error)})
                if attempt:
                    raise
    if share['sourceUrl'] != 'https://res.americancentury.com/docs/avantis-global-small-cap-value-ucits-etf-fact-sheet.pdf': reject('Unexpected Avantis official source')
    return avantis(download(share['sourceUrl']), share, now)
