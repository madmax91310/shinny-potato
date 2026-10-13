"""Exact-share fees, dated fund assets and published NAV returns for remaining issuers."""
import json
import re
from collect_public_issuer import Page, only, money, base
from issuer_documents import public_page, download, pdf_text, proof, document_date, bounded_return
from data_automation import reject


def silver(text, share, now):
    if share['isin'] != 'IE000UL6CLP7' or share['currency'] != 'USD':
        reject('Wrong Silver Miners share configuration')
    tokens = Page(text).tokens
    starts = [i for i, t in enumerate(tokens[:-1]) if t == 'Key Information' and tokens[i+1].startswith('As of ')]
    start = only(starts, 'Silver Miners dated facts')
    end = tokens.index('Regulatory', start)
    block = '\n'.join(tokens[start:end])
    if only(re.findall(r'Primary ISIN\n([A-Z0-9]{12})', block), 'Silver Miners ISIN') != share['isin']:
        reject('Wrong Silver Miners exact share')
    if 'USD Accumulating' not in '\n'.join(tokens) or 'Physical - Full Replication - Passively Managed Index Tracking' not in block:
        reject('Silver Miners income policy or replication changed')
    # Trading details have their own date; the fund assets use the key facts date.
    stamp = document_date(tokens[start+1].removeprefix('As of '), now)
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
    performance = only(candidates, 'Silver Miners performance')
    if performance['ETF_TICKER'] != 'SILV': reject('Wrong Silver Miners performance ticker')
    document_date(performance['AS_OF_DATE'], now)
    history = performance['PERFORMANCE_HISTORY']; date = document_date(history['month_end_date'], now)
    returns = history['cumulative']['month_end']['fund_nav']
    result['performance'] = dict(currency='USD', basis='fund', years={}, asOf=date, sourceUrl=share['sourceUrl'], sha256=digest,
        method='cumulative exact-share NAV total return, gross income reinvested, net of fees',
        observations=[dict(label=label, value=bounded_return(100 * returns[key]), asOf=date) for key, label in
            [('ONE_MONTH','1 mois'),('THREE_MONTH','3 mois'),('ONE_YEAR','1 an'),('YTD','Depuis janvier'),('SINCE_INCEPTION','Depuis le lancement')]])
    result['unavailable'] = ['performance-calendar: issuer discrete returns are rolling years, not calendar years; separately collected exact-share market histories preserved',
                             'exposures: client-loaded holdings not substituted with securities-lending collateral']
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
    result['unavailable'] = ['performance-calendar: current factsheet publishes rolling returns, no complete calendar year; separate exact-share monthly history retained',
                             'countries: top five is not a complete country allocation']
    return result


def collect_one(share, now):
    if share['parser'] == 'globalx-priority':
        if share['sourceUrl'] != 'https://globalxetfs.eu/funds/silv/': reject('Unexpected Silver Miners official source')
        return silver(public_page(share['sourceUrl']), share, now)
    if share['sourceUrl'] != 'https://res.americancentury.com/docs/avantis-global-small-cap-value-ucits-etf-fact-sheet.pdf': reject('Unexpected Avantis official source')
    return avantis(download(share['sourceUrl']), share, now)
