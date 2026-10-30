"""Complete issuer portfolios. Exact identities, dates and unscaled NAV weights."""
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import time
from urllib.parse import urljoin, urlsplit
from urllib.parse import urlencode
from bs4 import BeautifulSoup
from issuer_documents import download, document_date, public_page
from holdings_reconciliation import HoldingsSourceError

ISIN = re.compile(r'[A-Z]{2}[A-Z0-9]{9}\d')


def digest(body):
    return hashlib.sha256(body if isinstance(body, bytes) else body.encode()).hexdigest()


def source_proof(share, kind, body):
    """Optional CI artifact, including rejected observations for diagnosis."""
    directory = os.environ.get('PHYSICAL_SOURCE_PROOF_DIR')
    if directory:
        root = Path(directory)
        root.mkdir(parents=True, exist_ok=True)
        raw = body if isinstance(body, bytes) else json.dumps(body, sort_keys=True).encode()
        (root / (share['isin'] + '-' + kind + '.raw')).write_bytes(raw)


def checked_rows(rows, minimum=1, allow_unidentified=False):
    if len(rows) < minimum:
        raise ValueError('Incomplete physical portfolio')
    for row in rows:
        weight = row['weightPct']
        identity = row.get('isin')
        if ((not ISIN.fullmatch(identity or '') and not (allow_unidentified and identity is None))
                or not isinstance(row.get('name'), str) or not row['name']
                or isinstance(weight, bool) or not isinstance(weight, (int, float))
                or not math.isfinite(weight) or weight < 0):
            raise ValueError('Unqualified physical security identity/weight')
    identified = [row['isin'] for row in rows if row.get('isin')]
    if len(set(identified)) != len(identified):
        raise ValueError('Duplicate physical security')
    if not 0 < sum(row['weightPct'] for row in rows) <= 100.5:
        raise ValueError('Invalid physical portfolio NAV weights')
    return [row for row in rows if row['weightPct'] > 0]


def observation(rows, stamp, url, raw, allow_unidentified=False, **extra):
    return dict(rows=checked_rows(rows, allow_unidentified=allow_unidentified), asOf=stamp, basis='fund', complete=True,
                sourceUrl=url, sha256=digest(raw),
                method='Complete published physical equity securities; cash and non-equity positions excluded; original fund NAV weights, no renormalisation',
                unidentifiedSecurityCount=sum(not r.get('isin') for r in rows),
                unidentifiedWeightPct=sum(r['weightPct'] for r in rows if not r.get('isin')),
                **extra)


def globalx_page(page, share):
    from collect_public_issuer import Page
    tokens = Page(page).tokens
    block = '\n'.join(tokens)
    identities = set(re.findall(r'Primary ISIN\n([A-Z0-9]{12})', block))
    if identities != {share['isin']} or share['currency'] != 'USD' or 'USD Accumulating' not in tokens:
        raise ValueError('Wrong Global X accumulating share')
    styles = set(re.findall(r'Management Style\n([^\n]+)', block))
    if styles != {'Physical - Full Replication - Passively Managed Index Tracking'}:
        raise ValueError('Global X physical replication not confirmed')
    soup = BeautifulSoup(page, 'html.parser')
    links = {urljoin(share['sourceUrl'], a['href']) for a in soup.select('a[href]')
             if a.get_text(' ', strip=True) == 'Download Full Holdings (.csv)'}
    ticker = urlsplit(share['sourceUrl']).path.strip('/').split('/')[-1]
    expected = 'https://globalxetfs.eu/api/funds/' + ticker + '/topholdingscsv'
    if links != {expected}:
        raise ValueError('Missing or ambiguous Global X full portfolio link')
    return expected


def globalx_csv(raw, now):
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    if reader.fieldnames != ['AS_OF_DATE', 'SEDOL', 'NAME', 'NET_ASSETS', 'TICKER',
                            'MARKET_PRICE', 'SHARES_HELD', 'MARKET_VALUE', 'ISIN', 'COUNTRY']:
        raise ValueError('Global X portfolio schema changed')
    published = list(reader)
    identified_names = {r['NAME'] for r in published if ISIN.fullmatch(r.get('ISIN') or '')}
    rows, dates, total = [], set(), 0
    cash = {'US DOLLAR', 'U.S. DOLLAR', 'EURO', 'BRITISH STERLING POUND', 'JAPANESE YEN',
            'NORWEGIAN KRONE', 'HONG KONG DOLLAR', 'CANADIAN DOLLAR', 'SWISS FRANC',
            'AUSTRALIAN DOLLAR', 'SOUTH KOREAN WON', 'KOREAN WON', 'SWEDISH KRONA',
            'DANISH KRONE', 'NEW TAIWAN DOLLAR', 'CHINESE RENMINBI', 'SINGAPORE DOLLAR',
            'SOUTH AFRICAN RAND', 'CHILEAN PESO', 'POLISH ZLOTY',
            'SWEDISH KRONE', 'MEXICAN PESO', 'PERUVIAN NEW SOL', 'SAUDI RIYAL',
            'OTHER PAYABLE & RECEIVABLES', 'CASH'}
    for record, row in enumerate(published, start=2):
        if row['AS_OF_DATE'].startswith('The information contained herein') and not row.get('NAME'):
            continue  # Explicit copyright footer, never a portfolio position.
        dates.add(document_date(row['AS_OF_DATE'], now))
        # A missing NAV weight is not a zero, including on cash/payable lines.
        # Keep enough context to diagnose the rejected raw CSV in CI.
        context = (f"Global X NET_ASSETS at CSV record {record} "
                   f"(name={row.get('NAME')!r}, isin={row.get('ISIN')!r}, "
                   f"asOf={row.get('AS_OF_DATE')!r})")
        value = row.get('NET_ASSETS')
        if value is None or not value.strip():
            raise HoldingsSourceError('Missing ' + context, {
                'kind':'missing-published-nav-weight', 'asOf':row['AS_OF_DATE'],
                'recordNumber':record, 'name':row.get('NAME'),
                'positionIsin':row.get('ISIN') or None,
                'missingFields':[key for key in ['NET_ASSETS','MARKET_VALUE'] if not (row.get(key) or '').strip()],
                'financialDataQualified':False, 'normalizationApplied':False})
        try:
            weight = float(value)
        except ValueError as exc:
            raise ValueError(f'Invalid {context}: {value!r}') from exc
        if not math.isfinite(weight) or not -5 <= weight <= 100:
            raise ValueError(f'Invalid {context}: {value!r}')
        total += weight
        if not row['ISIN']:
            if row['NAME'] in cash and not row['TICKER']:
                continue
            # Separate unlisted/restricted lines can share a name with a listed
            # security. Preserve their weights and unknown identity; never copy
            # the listed line's ISIN onto them or count them as cash.
            if row['NAME'] not in identified_names or row['TICKER'] or row['SEDOL'] or weight < 0:
                raise ValueError('Unidentified non-cash Global X position: ' + row['NAME'])
        rows.append({'isin': row['ISIN'], 'name': row['NAME'], 'weightPct': weight,
                     'sedol': row['SEDOL']})
        if not row['ISIN']:
            rows[-1]['isin'] = None
            rows[-1]['identityStatus'] = 'unpublished-separate-position'
    if len(dates) != 1 or not 99 <= total <= 100.5:
        raise ValueError('Truncated or mixed-date Global X portfolio')
    return checked_rows(rows, minimum=11, allow_unidentified=True), dates.pop()


def collect_globalx(share, now):
    page = public_page(share['sourceUrl'])
    url = globalx_page(page, share)
    raw = download(url)
    source_proof(share, 'globalx', raw)
    try:
        rows, stamp = globalx_csv(raw, now)
    except HoldingsSourceError as error:
        error.diagnostic.update(subjectIsin=share['isin'],sourceUrl=url,sha256=digest(raw),
                                checkedAt=now.isoformat())
        raise
    return observation(rows, stamp, url, raw, allow_unidentified=True,
                       identitySourceUrl=share['sourceUrl'], identitySha256=digest(page))


def collect_avantis(share, now):
    from collect_exposure_sleeves import parse_avantis
    from issuer_documents import pdf_text
    if share['isin'] != 'IE0003R87OG3' or share['currency'] != 'USD':
        raise ValueError('Unsupported Avantis share')
    page = download(share['sourceUrl'])
    text = pdf_text(page)
    if (share['isin'] not in text or 'AVWS' not in text or 'Global Small Cap Value' not in text
            or 'USD - Accumulating' not in text):
        raise ValueError('Avantis exact physical accumulating share not confirmed')
    url = share['holdingsUrl']
    raw = public_page(url)
    rows, stamp = parse_avantis(raw, now)
    return observation(rows, stamp, url, raw, identitySourceUrl=share['sourceUrl'], identitySha256=digest(page))


def finite_weight(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('Non-finite portfolio weight')
    return value


def amundi_composition(data, share, now):
    products = data['products']
    if len(products) != 1:
        raise ValueError('Missing or ambiguous Amundi portfolio')
    product = products[0]
    facts = product['characteristics']
    if (product['productId'] != share['isin'] or facts['ISIN'] != share['isin']
            or facts['CURRENCY'] != share['currency']
            or facts['FUND_REPLICATION_METHODOLOGY'] != 'Direct(Physical)'):
        raise ValueError('Wrong Amundi exact share/currency/physical replication')
    composition = product['composition']
    entries = composition['compositionData']
    count = composition['totalNumberOfInstruments']
    if type(count) is not int or count != len(entries) or not 11 <= count <= 15000:
        raise ValueError('Truncated Amundi complete portfolio')
    stamp = document_date(facts['POSITION_AS_OF_DATE'], now)
    rows, excluded, total = [], {}, 0
    for entry in entries:
        item = entry['compositionCharacteristics']
        weight = finite_weight(entry['weight'])
        kind = item['type']
        # Payables and receivables are separate signed cash lines. Their net
        # NAV weight is checked below; no negative equity position is admitted.
        minimum = -1 if kind == 'CASH' else -.01
        if weight != finite_weight(item['weight']) or not minimum <= weight <= 1:
            raise ValueError('Inconsistent Amundi weight')
        if document_date(item['date'], now) != stamp:
            raise ValueError('Mixed-date Amundi portfolio')
        total += weight
        if kind in ('CASH', 'FUTURE', 'ETF', 'RIGHT'):
            excluded[kind] = excluded.get(kind, 0) + weight * 100
        elif kind in ('EQUITY_ORDINARY', 'PREFERENCE_SHARES', 'DEPOSITORY_RECEIPT'):
            rows.append(dict(isin=item['isin'], name=item['name'], weightPct=weight * 100))
        else:
            raise ValueError('Unqualified Amundi security type: ' + str(kind))
    if not 0.99 <= total <= 1.005:
        raise ValueError('Incomplete Amundi NAV weights')
    return checked_rows(rows, 11), stamp, excluded


def collect_amundi(share, now):
    from collect_amundi_etf import request_payload, fetch_api, API
    payload = request_payload([share], now)
    payload['composition'] = {'compositionFields': [
        'date', 'type', 'bbg', 'isin', 'name', 'weight', 'quantity', 'currency', 'sector', 'country', 'countryOfRisk']}
    body = fetch_api(payload)
    source_proof(share, 'amundi', body)
    rows, stamp, excluded = amundi_composition(body, share, now)
    return observation(rows, stamp, API, json.dumps(body, sort_keys=True),
                       excludedWeightPctByType=excluded)


VANGUARD_QUERY = '''query CompleteEquityHoldings($portIds: [String!], $lastItemKey: String) {
  funds(portIds: $portIds) { profile {
    portId fundCurrency etfReplicationMethodology assetClassificationLevel1
    identifiers(altIds: ["ISIN"]) { altId altIdValue }
  } }
  borHoldings(portIds: $portIds) {
    holdings(limit: 1500, lastItemKey: $lastItemKey) {
      items { securityLongDescription marketValuePercentage sedol1 securityType effectiveDate isin }
      totalHoldings lastItemKey
    }
  }
}'''


def vanguard_pages(pages, share, now):
    rows, dates, totals, cursors, excluded, all_items = [], set(), set(), set(), {}, []
    positions = set()
    for index, page in enumerate(pages):
        if page.get('errors'):
            raise ValueError('Vanguard holdings query error')
        funds, portfolios = page['data']['funds'], page['data']['borHoldings']
        if len(funds) != 1 or len(portfolios) != 1:
            raise ValueError('Ambiguous Vanguard portfolio')
        p = funds[0]['profile']
        if (p['portId'] != str(share['productCode']) or p['fundCurrency'] != share['currency']
                or p['identifiers'] != [{'altId': 'ISIN', 'altIdValue': share['isin']}]
                or p['etfReplicationMethodology'] != 'Physical'
                or p['assetClassificationLevel1'] != 'Equity'):
            raise ValueError('Wrong Vanguard exact physical equity share')
        portfolio = portfolios[0]['holdings']
        total, cursor, items = portfolio['totalHoldings'], portfolio['lastItemKey'], portfolio['items']
        if type(total) is not int or not 11 <= total <= 15000 or not items or len(items) > 1500:
            raise ValueError('Invalid Vanguard page size/count')
        totals.add(total)
        if cursor:
            if not isinstance(cursor, str) or cursor in cursors or index == len(pages) - 1:
                raise ValueError('Incomplete or repeated Vanguard cursor')
            cursors.add(cursor)
        elif index != len(pages) - 1:
            raise ValueError('Unexpected Vanguard page after final cursor')
        for item in items:
            dates.add(document_date(item['effectiveDate'], now))
            weight = finite_weight(item['marketValuePercentage'])
            if not -1 <= weight <= 100:
                raise ValueError('Invalid Vanguard weight')
            kind = item['securityType']
            if kind in ('EQ.STOCK', 'EQ.REIT', 'EQ.DRCPT', 'EQ.PREF', 'EQ.FSH'):
                if weight < 0:
                    raise ValueError('Short physical equity position')
                if weight == 0:
                    continue  # Worthless/reclaim rows remain counted in the full issuer file.
                key = (item['isin'], item.get('sedol1'))
                if key in positions:
                    raise ValueError('Repeated Vanguard security/listing position')
                positions.add(key)
                rows.append(dict(isin=item['isin'], name=item['securityLongDescription'], weightPct=weight,
                                 sedol=item.get('sedol1')))
            elif kind in ('CRNY', 'CT.SPOT', 'CT.FOREX', 'CT.PORTSWAP', 'DE.IND', 'EQ.RIGHT', 'EQ.WRT'):
                excluded[kind] = excluded.get(kind, 0) + weight
            else:
                raise ValueError('Unqualified Vanguard security type: ' + str(kind))
        all_items.extend(items)
    if len(totals) != 1 or len(all_items) != next(iter(totals)) or len(dates) != 1:
        raise ValueError('Truncated, changing or mixed-date Vanguard portfolio')
    if not 99 <= sum(item['marketValuePercentage'] for item in all_items) <= 100.5:
        raise ValueError('Incomplete Vanguard NAV weights')
    # One ISIN may trade on multiple venues with different SEDOLs.
    # Distinct issuer positions are summed by exact ISIN, never by a fuzzy name.
    aggregated = {}
    for row in rows:
        if not ISIN.fullmatch(row['isin'] or ''):
            raise ValueError('Missing Vanguard positive equity ISIN')
        if row['isin'] not in aggregated:
            aggregated[row['isin']] = dict(isin=row['isin'], name=row['name'], weightPct=0, sourcePositions=0)
        aggregated[row['isin']]['weightPct'] += row['weightPct']
        aggregated[row['isin']]['sourcePositions'] += 1
    return checked_rows(list(aggregated.values()), 11), dates.pop(), excluded


def collect_vanguard(share, now):
    from collect_vanguard_etf import fetch_query, API
    pages, cursor, seen = [], None, set()
    for _ in range(12):
        page = fetch_query(VANGUARD_QUERY, {'portIds': [str(share['productCode'])],
                                          'lastItemKey': cursor}, 'CompleteEquityHoldings')
        pages.append(page)
        cursor = page['data']['borHoldings'][0]['holdings']['lastItemKey']
        if not cursor:
            break
        if cursor in seen:
            raise ValueError('Repeated Vanguard cursor')
        seen.add(cursor)
    rows, stamp, excluded = vanguard_pages(pages, share, now)
    return observation(rows, stamp, API, json.dumps(pages, sort_keys=True),
                       excludedWeightPctByType=excluded, pageCount=len(pages))


def invesco_composition(body, now):
    if not isinstance(body,dict):
        raise ValueError('Invalid Invesco complete holdings response')
    entries = body.get('holdings')
    count = body.get('numberOfHoldings')
    if entries is None and type(count) is int and count == 0 and body.get('effectiveDate') is None:
        raise HoldingsSourceError('Invesco complete fund holdings unavailable: null portfolio, zero count and no observation date',
            {'kind':'unavailable-complete-fund-file','asOf':None,'sourceRowCount':0,
             'financialDataQualified':False,'normalizationApplied':False})
    if not isinstance(entries,list):
        raise ValueError('Invalid Invesco full holdings table')
    cash = [r for r in entries if r.get('name') == 'Cash and/or Derivatives' and not r.get('isin')]
    if type(count) is not int or count < 11 or len(cash) > 1 or len(entries) != count + len(cash):
        raise ValueError('Truncated Invesco full holdings')
    for item in entries:
        if not -1 <= finite_weight(item['weight']) <= 100:
            raise ValueError('Invalid Invesco weight')
    rows = [dict(isin=r.get('isin'), name=r['name'], weightPct=r['weight']) for r in entries if r not in cash]
    # Published weights are rounded to two decimals: retain them, never fill the residual.
    tolerance = len(entries) * .005 + .01
    if abs(sum(r['weight'] for r in entries) - 100) > tolerance:
        raise ValueError('Inconsistent Invesco rounded NAV weights')
    return checked_rows(rows, 11), document_date(body['effectiveDate'], now)


def collect_invesco(share, now):
    from issuer_documents import pdf_text
    raw_identity = download(share['sourceUrl'])
    text = pdf_text(raw_identity)
    if (share['isin'] not in text or not re.search(r'Replication method\s+Physical\b', text)
            or not re.search(r'(?:Fund base currency|Base currency)\s+' + share['currency'] + r'\b', text)):
        raise ValueError('Wrong Invesco exact physical share/currency')
    if share.get('holdingsContract'):
        from invesco_physical_holdings import collect
        return collect(share, now, raw_identity)
    url = 'https://dng-api.invesco.com/cache/v1/accounts/en_GB/shareclasses/' + share['isin'] + '/holdings/fund?idType=isin'
    attempts=[]
    for attempt in range(2):
        raw = download(url)
        source_proof(share,'invesco-'+str(attempt+1),raw)
        try:
            rows, stamp = invesco_composition(json.loads(raw), now)
        except HoldingsSourceError as error:
            attempts.append({'attempt':attempt+1,'sha256':digest(raw),'status':'missing-complete-fund-file'})
            error.diagnostic.update(subjectIsin=share['isin'],sourceUrl=url,sha256=digest(raw),
                                    checkedAt=now.isoformat(),sourceAttempts=list(attempts))
            if attempt==0:
                time.sleep(2)
                continue
            raise
        attempts.append({'attempt':attempt+1,'sha256':digest(raw),'status':'validated'})
        return observation(rows, stamp, url, raw, identitySourceUrl=share['sourceUrl'],
                           identitySha256=digest(raw_identity),sourceAttempts=attempts)


def vaneck_url(page, share):
    soup = BeautifulSoup(page, 'html.parser')
    identities = {tag.get('data-value') for tag in soup.select('[data-value]')
                  if ISIN.fullmatch(tag.get('data-value', ''))}
    ticker = soup.select_one('ve-fundticker')
    country, language = soup.select_one('ve-country'), soup.select_one('ve-language')
    if (identities != {share['isin']} or not ticker or ticker.get_text(strip=True) != share['apiTicker']
            or not country or country.get_text(strip=True) != 'uk'
            or not language or language.get_text(strip=True) != 'en'):
        raise ValueError('Wrong VanEck exact UCITS share (US tickers are not interchangeable)')
    blocks = soup.select('section#holdings ve-holdingsblock')
    if len(blocks) != 1:
        raise ValueError('Missing or ambiguous VanEck full holdings widget')
    block, pageid = blocks[0].get('data-blockid', ''), blocks[0].get('data-pageid', '')
    if not block.isdigit() or not pageid.isdigit():
        raise ValueError('Invalid VanEck portfolio widget')
    return 'https://www.vaneck.com/Main/HoldingsBlock/GetContent/?' + urlencode(
        dict(blockid=block, pageid=pageid, ticker=share['apiTicker'], reactlang='en', reactctr='uk'))


def vaneck_composition(body, share, now):
    import datetime as dt
    data = body['data']
    if (data['Ticker'] != share['apiTicker'] or data['IsTopTen'] is not False
            or data.get('IsWeightings') or data.get('IndexTicker')
            or data['Title'] != 'All Holdings (%)'):
        raise ValueError('Not the exact VanEck full fund portfolio')
    items = data['Holdings']
    stocks = [row for row in items if row['AssetClass'] == 'Stock']
    cash = [row for row in items if row['AssetClass'] == 'Cash']
    if int(data['TotalAmount']) != len(items) - len(cash) or len(cash) > 1 or len(stocks) < 11:
        raise ValueError('Truncated VanEck full portfolio')
    stamp = document_date(data['AsOfDate'], now)
    rows, total, excluded = [], 0, {}
    positions = set()
    portfolio_ticker = {'TRET': 'TRETNL', 'TDIV': 'TDIVNL'}.get(share['apiTicker'], share['apiTicker'])
    for item in items:
        if (item['Ticker'] != share['apiTicker'] or item['PortfolioTicker'] != portfolio_ticker
                or item['LabelType'] != 'Holdings'
                or dt.datetime.strptime(item['AsOfDate'], '%m/%d/%y').date().isoformat() != stamp):
            raise ValueError('Mixed VanEck portfolio identities/dates')
        weight = float(item['Weight'])
        if not math.isfinite(weight) or not -5 <= weight <= 100:
            raise ValueError('Invalid VanEck weight')
        total += weight
        if item['AssetClass'] == 'Stock':
            # Blank ISINs are a published identification gap, never invented or joined by name.
            # The UI rejects complete overlap whenever any row lacks an ISIN.
            key = (item['LabelOrder'], item['FIGI'])
            if key in positions:
                raise ValueError('Repeated VanEck position')
            positions.add(key)
            rows.append(dict(isin=item['ISIN'] or None, name=item['HoldingName'], weightPct=weight,
                             figi=item['FIGI'], ticker=item['Label']))
        elif item['AssetClass'] == 'Cash':
            excluded['Cash'] = excluded.get('Cash', 0) + weight
        elif (item['AssetClass'] == 'Other' and share['apiTicker'] == 'UCTNUCL'
              and item['ISIN'] == 'CA85210A1049' and item['HoldingName'] == 'Sprott Physical Uranium Trust'):
            excluded['Physical uranium trust'] = excluded.get('Physical uranium trust', 0) + weight
        else:
            raise ValueError('Unqualified VanEck asset class: ' + item['AssetClass'])
    if abs(total - 100) > max(.1, len(items) * .005 + .01):
        raise ValueError('Incomplete VanEck NAV weights')
    return checked_rows(rows, 11, allow_unidentified=True), stamp, excluded


def collect_vaneck(share, now):
    page = public_page(share['pageUrl'])
    url = vaneck_url(page, share)
    raw = download(url)
    source_proof(share, 'vaneck', raw)
    body=json.loads(raw)
    rows, stamp, excluded = vaneck_composition(body, share, now)
    from security_identifier_observations import resolve_venue_tickers
    identities, proofs, failures=resolve_venue_tickers(body['data']['Holdings'],share,url,digest(raw),stamp,now)
    for row in rows:
        if not row.get('isin'):
            native=[r for r in body['data']['Holdings'] if r.get('Label')==row['ticker'] and r.get('AssetClass')=='Stock']
            if len(native)==1:row['isin']=identities.get((row['ticker'],native[0].get('CurrencyCode')))
    source_proof(share,'vaneck-identities',proofs)
    return observation(rows, stamp, url, raw, allow_unidentified=True,
                       identitySourceUrl=share['pageUrl'], identitySha256=digest(page),
                       identityHistory=proofs,identitySourceFailures=failures,
                       excludedWeightPctByType=excluded)


def collect_hsbc(share, now):
    from hsbc_holdings import collect
    return collect(share,now)

def collect_jpm(share, now):
    from jpm_holdings import collect
    return collect(share,now)

from collect_topix_holdings import collect as collect_topix
from collect_wisdomtree_holdings import collect as collect_wisdomtree

COLLECTORS = {'wisdomtree-complete':collect_wisdomtree,'jpx-topix':collect_topix,'jpm-complete':collect_jpm,'hsbc-complete':collect_hsbc,'globalx-complete': collect_globalx, 'avantis-complete': collect_avantis,
              'amundi-complete': collect_amundi, 'vanguard-complete': collect_vanguard,
              'invesco-complete': collect_invesco, 'vaneck-complete': collect_vaneck}
