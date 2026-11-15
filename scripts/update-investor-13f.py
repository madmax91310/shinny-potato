"""Refresh selected 13F managers from FolioFact's public holdings API."""
import datetime as dt
import argparse
from email.utils import parsedate_to_datetime
import json
import math
import re
import html
import hashlib
import xml.etree.ElementTree as ET
import os
import pathlib
import sys
import time
import urllib.request
import urllib.error
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANAGERS = {
    'morfit': ('valueact-capital', 'Mason Morfit', 'ValueAct Capital Management LP'),
    'dorsey': ('dorsey-asset-management', 'Pat Dorsey', 'Dorsey Asset Management LLC'),
    'vinall': ('rv-capital', 'Robert Vinall', 'RV Capital GmbH'),
    'marks': ('oaktree-capital-management', 'Howard Marks', 'Oaktree Capital Management LP'),
    'watsa': ('fairfax-financial-holdings', 'Prem Watsa', 'Fairfax Financial Holdings Ltd'),
    'gavin-baker': ('atreides-management', 'Gavin Baker', 'Atreides Management LP'),

    'einhorn': ('greenlight-capital', 'David Einhorn', 'Greenlight Capital Inc.'),
    'halvorsen': ('viking-global-investors', 'Andreas Halvorsen', 'Viking Global Investors LP'),
    'gerstner': ('altimeter-capital-management', 'Brad Gerstner', 'Altimeter Capital Management LP'),
    'gayner': ('markel-group', 'Tom Gayner', 'Markel Group Inc.'),

    'tepper': ('appaloosa', 'David Tepper', 'Appaloosa LP'),
    'ackman': ('pershing-square-capital-management', 'Bill Ackman', 'Pershing Square Capital Management LP'),
    'berkshire': ('berkshire-hathaway', 'Berkshire Hathaway', 'Berkshire Hathaway Inc.'),
    'cathie-wood': ('ark-investment-management', 'Cathie Wood', 'ARK Investment Management LLC'),
    'thiel': ('thiel-macro-llc', 'Peter Thiel', 'Thiel Macro LLC'),
    'druckenmiller': ('duquesne-family-office', 'Stanley Druckenmiller', 'Duquesne Family Office LLC'),
    'loeb': ('third-point', 'Daniel Loeb', 'Third Point LLC'),
    'aschenbrenner': ('situational-awareness', 'Leopold Aschenbrenner', 'Situational Awareness LP'),
    'li-lu': ('himalaya-capital-management', 'Li Lu', 'Himalaya Capital Management LLC'),
    'gates-trust': ('gates-foundation-trust', 'Gates Foundation Trust', 'Gates Foundation Trust'),
    'klarman': ('baupost-group', 'Seth Klarman', 'Baupost Group LLC'),
    'terry-smith': ('fundsmith', 'Terry Smith', 'Fundsmith LLP'),
    'pabrai': ('pabrai-investment-funds', 'Mohnish Pabrai', 'Dalal Street LLC'),
    'hohn': ('tci-fund-management', 'Christopher Hohn', 'TCI Fund Management Ltd'),
    'baker-bros': ('baker-bros-advisors', 'Baker Bros. Advisors', 'Baker Bros. Advisors LP'),
    'icahn': ('icahn-capital', 'Carl Icahn', 'Carl C. Icahn (déclarant 13F)'),
    'laffont': ('coatue-management', 'Philippe Laffont', 'Coatue Management LLC'),
    'renaissance': ('renaissance-technologies', 'Renaissance Technologies', 'Renaissance Technologies LLC'),
}
_last_request_at = 0
MAX_RATE_LIMIT_RETRIES = 3
MAX_RETRY_AFTER_SECONDS = 300


def current_date():
    return dt.datetime.now(dt.timezone.utc).date()


def filing_period(value, now=None):
    period = dt.date.fromisoformat(value)
    today = now or current_date()
    if (period.month, period.day) not in ((3, 31), (6, 30), (9, 30), (12, 31)) or period > today:
        raise ValueError('Invalid or future 13F quarter end')
    return period


def validate_portfolio(portfolio, slug, now=None):
    """Validate the full declared denominator before excluding options in the UI."""
    data = portfolio['data']
    identity, snapshot = data.get('identity', {}), data['snapshot']
    if identity.get('slug') != slug or identity.get('archetype') != 'hedge_fund':
        raise ValueError('Investor identity mismatch: ' + slug)
    period = filing_period(snapshot['periodEnd'], now)
    today = now or current_date()
    # Operational stale-feed guard; this is not an assertion about SEC deadlines.
    if (today - period).days > 200:
        raise ValueError('13F source older than 200 days: ' + slug)
    rows = snapshot.get('holdings', [])
    if not rows:
        raise ValueError('Empty 13F holdings: ' + slug)
    keys = set()
    for row in rows:
        weight, name = row.get('weight'), row.get('issuerName')
        if not isinstance(name, str) or not name.strip() or not isinstance(row.get('ticker', ''), str):
            raise ValueError('Invalid security identity: ' + slug)
        if row.get('putCall') not in (None, 'PUT', 'CALL') or isinstance(weight, bool) or not isinstance(weight, (int, float)) or not math.isfinite(weight) or not 0 < weight <= 1:
            raise ValueError('Invalid security weight/type: ' + slug)
        ticker = row.get('ticker')
        key = (row.get('cusip') or row.get('securityId') or (name if not ticker or ticker == 'Unmapped CUSIP' else ticker), row.get('shareClass'), row.get('putCall'))
        if key in keys:
            raise ValueError('Duplicate security across holdings pages: ' + slug)
        keys.add(key)
    if not any(row.get('putCall') is None for row in rows) or not .95 <= sum(row['weight'] for row in rows) <= 1.02:
        raise ValueError('Incomplete declared 13F portfolio: ' + slug)
    if 'declaredTotal' in snapshot:
        total = snapshot['declaredTotal']
        if isinstance(total, bool) or not isinstance(total, (int, float)) or not math.isfinite(total) or total <= 0 or snapshot.get('currency') != 'USD' or snapshot.get('valueUnit') != 1 or not snapshot.get('valueUnitSource'):
            raise ValueError('Invalid monetary units: ' + slug)
        for row in rows:
            value = row.get('value')
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0 or row.get('currency') != 'USD' or row.get('unit') != 1 or not math.isclose(row['weight'], value / total, rel_tol=1e-10):
                raise ValueError('Invalid position value or weight: ' + slug)
        if not math.isclose(sum(row['value'] for row in rows), total, rel_tol=0, abs_tol=.5 * len(rows)):
            raise ValueError('Declared values do not reconcile with filing total: ' + slug)
    source = urllib.parse.urlparse(data.get('sourceUrl', ''))
    if source.scheme != 'https' or source.hostname not in ('foliofact.com', 'tracefour.com', 'www.sec.gov'):
        raise ValueError('Missing investor source: ' + slug)


def retry_after_seconds(value):
    """Accept HTTP delta-seconds or an HTTP date; malformed hints use backoff."""
    if value is None:
        return None
    value = value.strip()
    if value.isascii() and value.isdigit():
        return int(value)
    try:
        deadline = parsedate_to_datetime(value)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=dt.timezone.utc)
        return max(0, (deadline - dt.datetime.now(dt.timezone.utc)).total_seconds())
    except (ValueError, TypeError, OverflowError):
        return None


def get_json(url, raw_text=False):
    global _last_request_at
    cache = None
    cached = None
    if os.environ.get('INVESTOR_HTTP_CACHE'):
        directory = pathlib.Path(os.environ['INVESTOR_HTTP_CACHE'])
        directory.mkdir(parents=True, exist_ok=True)
        cache = directory / (hashlib.sha256(url.encode()).hexdigest() + '.json')
        try:
            cached = json.loads(cache.read_text())
        except (OSError, ValueError):
            pass
    request = urllib.request.Request(url, headers={'Accept': 'text/html' if raw_text else 'application/json', 'User-Agent': 'EpargnantLibre/1.0'})
    if cached and cached.get('etag'):
        request.add_header('If-None-Match', cached['etag'])
    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        # Apply FolioFact's 20 requests/minute pacing to retries as well.
        if urllib.parse.urlparse(url).hostname == 'www.sec.gov':
            time.sleep(max(0, .15 - (time.monotonic() - _last_request_at)))
            _last_request_at = time.monotonic()
        if urllib.parse.urlparse(url).hostname == 'foliofact.com':
            time.sleep(max(0, 3.1 - (time.monotonic() - _last_request_at)))
            _last_request_at = time.monotonic()
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read().decode('utf-8')
                result = body if raw_text else json.loads(body)
                if cache is not None and response.headers.get('ETag'):
                    temp = cache.with_suffix('.tmp')
                    temp.write_text(json.dumps({'etag': response.headers['ETag'], 'body': body}))
                    os.replace(temp, cache)
                return result
        except urllib.error.HTTPError as error:
            if error.code == 304 and cached:
                error.close()
                return cached['body'] if raw_text else json.loads(cached['body'])
            if error.code != 429 or attempt == MAX_RATE_LIMIT_RETRIES:
                error.close()
                raise
            delay = retry_after_seconds(error.headers.get('Retry-After'))
            # Never retry earlier than the provider requests. An excessive hint
            # fails visibly instead of blocking indefinitely or being truncated.
            if delay is not None and delay > MAX_RETRY_AFTER_SECONDS:
                print(f'HTTP 429: Retry-After exceeds {MAX_RETRY_AFTER_SECONDS}s budget: {url}', file=sys.stderr, flush=True)
                error.close()
                raise
            delay = delay if delay is not None else min(15 * 2 ** attempt, 60)
            error.close()
            print(f'HTTP 429: retry {attempt + 1}/{MAX_RATE_LIMIT_RETRIES} in {delay:.1f}s: {url}', file=sys.stderr, flush=True)
            time.sleep(delay)


def shares_change(row):
    # FolioFact supplies a positive magnitude for add/trim; normalize to the
    # signed sharesChangePct used by Tracefour. Never derive this from values.
    # Berkshire A/B share counts have different units; the provider folds them.
    if row.get('security', {}).get('ticker') == 'BRK.{A,B}':
        return None
    value = row.get('change_percent')
    if row.get('change') not in ('add', 'trim') or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        return None
    if row['change'] == 'trim' and value > 100:
        return None
    return value if row['change'] == 'add' else -value


def make_portfolio(slug, source_slug, display, entity):
    base = f'https://foliofact.com/api/v1/funds/{source_slug}'
    fund = get_json(base)
    if fund.get('fund', {}).get('slug') != source_slug:
        raise ValueError('Provider fund identity mismatch: ' + slug)
    # The larger page size keeps broad portfolios (Renaissance) within the
    # same paced request budget; every page is still validated before writing.
    table = get_json(f'{base}/holdings?per_page=100')
    period = fund['filing']['report_period_on']
    filing_period(period)
    # Ackman's FolioFact feed was still Q1 when Tracefour already served Q2 on
    # 03/10/2026. Prefer the freshest validated filing, never an older quarter.
    if slug == 'ackman':
        alternate = get_json('https://tracefour.com/data/trackers/ackman.json')
        alternate_data = alternate.get('data', {})
        alternate_snapshot = alternate_data.get('snapshot', {})
        alternate_period = alternate_snapshot.get('periodEnd', '')
        dt.date.fromisoformat(alternate_period)
        if alternate_period > period:
            identity = alternate_data.get('identity', {})
            rows = alternate_snapshot.get('holdings', [])
            weights = [row.get('weight') for row in rows]
            if identity.get('slug') != slug or identity.get('archetype') != 'hedge_fund' or not weights or any(
                    not isinstance(weight, (int, float)) or not math.isfinite(weight) or not 0 < weight <= 1 for weight in weights
            ) or not .95 <= sum(weights) <= 1.02:
                raise ValueError('Invalid alternate Ackman filing')
            identity['dataProvider'] = 'Tracefour'
            identity['personVerified'] = identity.get('displayName') == display
            identity['personSource'] = 'https://tracefour.com/trackers/ackman'
            identity['personPeriod'] = alternate_period
            alternate_data['sourceUrl'] = 'https://tracefour.com/trackers/ackman'
            # Provider valuation histories/benchmarks are not manager returns.
            # Persist only the sourced filing consumed by this tool.
            result = {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(), 'data': {
                'identity': identity, 'snapshot': alternate_snapshot, '_providerFilingHistory': alternate_data.get('filingHistory', []),
                'sourceUrl': alternate_data['sourceUrl']}}
            validate_portfolio(result, slug)
            return result
    total = float(table['total_value'])
    dt.date.fromisoformat(period)
    if not math.isfinite(total) or total <= 0 or total != float(fund['filing']['total_value']):
        raise ValueError(f'Inconsistent report for {slug}')
    if table.get('fund', {}).get('slug') != source_slug or table.get('quarter') != fund['filing'].get('quarter'):
        raise ValueError(f'Inconsistent quarter for {slug}')
    rows = list(table['holdings'])
    pagination = table.get('pagination', {})
    pages = pagination.get('total_pages', 1)
    if isinstance(pages, bool) or not isinstance(pages, int) or not 1 <= pages <= 200:
        raise ValueError('Invalid holdings page count: ' + slug)
    for page in range(2, pages + 1):
        if page == 2 or page % 10 == 0:
            print(f'{slug}: holdings page {page}/{pagination["total_pages"]}', flush=True)
        next_table = get_json(f'{base}/holdings?per_page=100&page={page}')
        if next_table.get('fund', {}).get('slug') != source_slug or next_table['quarter'] != table['quarter'] or float(next_table['total_value']) != total or next_table.get('pagination', {}).get('total_pages', pages) != pages or next_table.get('pagination', {}).get('total', pagination.get('total')) != pagination.get('total'):
            raise ValueError(f'Inconsistent holdings page for {slug}')
        rows.extend(next_table['holdings'])
    if pagination.get('total') is not None and len(rows) != int(pagination['total']):
        raise ValueError(f'Incomplete holdings pages for {slug}')
    expected_quarter = f'Q{(filing_period(period).month - 1) // 3 + 1} {period[:4]}'
    if table['quarter'] != expected_quarter:
        raise ValueError('Quarter label disagrees with report date: ' + slug)
    for row in rows:
        value = row.get('value')
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0 or row.get('position_type') not in ('direct', 'call', 'put'):
            raise ValueError('Invalid or unrecognized declared security: ' + slug)
    holdings = [
        {'issuerName': row['security']['name'], 'ticker': '' if row['security']['ticker'] == 'Unmapped CUSIP' else row['security']['ticker'] or '',
         'putCall': {'call': 'CALL', 'put': 'PUT'}.get(row.get('position_type')), 'weight': float(row['value']) / total,
         # FolioFact OpenAPI Holding.value: whole US dollars, NOT SEC legacy thousands.
         'value': row['value'], 'currency': 'USD', 'unit': 1,
         'cusip': row['security'].get('cusip'), 'securityId': row['security'].get('id'),
         'shareClass': row['security'].get('share_class'),
         'providerGroupedClasses': row['security'].get('ticker') in ('GOOG(L)', 'BRK.{A,B}'),
         'isNew': row.get('change') == 'new',
         'sharesChangePct': shares_change(row)}
        for row in rows if row.get('position_type') in ('direct', 'call', 'put') and float(row.get('value') or 0) > 0
    ]
    weight_sum = sum(row['weight'] for row in holdings)
    if not holdings or not any(row['putCall'] is None for row in holdings) or any(not math.isfinite(row['weight']) or row['weight'] > 1 for row in holdings) or not .95 <= weight_sum <= 1.02:
        raise ValueError(f'Incomplete portfolio for {slug}: {len(holdings)} rows, {weight_sum:.3f} total weight')
    if not math.isclose(sum(row['value'] for row in holdings), total, rel_tol=0, abs_tol=.5 * len(holdings)):
        raise ValueError('Declared values do not reconcile with filing total: ' + slug)
    quarter = (dt.date.fromisoformat(period).month - 1) // 3 + 1
    year = dt.date.fromisoformat(period).year
    prior_label = f'Q{quarter - 1 if quarter > 1 else 4} {year if quarter > 1 else year - 1}'
    exits = [{'issuerName': row['security']['name'], 'ticker': row['security']['ticker'] or '', 'putCall': None}
             for row in rows if row.get('position_type') == 'direct' and row.get('change') == 'sold'
             and float(row.get('value') or 0) == 0 and float(row.get('shares') or 0) == 0]
    result = {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(), 'data': {
        'identity': {'slug': slug, 'archetype': 'hedge_fund', 'displayName': display,
                     'entityName': entity, 'dataProvider': 'FolioFact',
                     'personVerified': fund.get('fund', {}).get('manager') == display or any(p.get('name') == display for p in fund.get('investors', [])),
                     'personSource': base, 'personPeriod': period},
        'snapshot': {'periodEnd': period, 'holdings': holdings,
                     'filedAt': fund['filing'].get('filed_on'),
                     'declaredTotal': total, 'currency': 'USD', 'valueUnit': 1,
                     'valueUnitSource': 'https://foliofact.com/openapi.yaml#/components/schemas/PortfolioRow',
                     'valueScope': 'Déclaration 13F · positions longues et options déclarées',
                     'securityIdentityNote': 'Identifiants et classes conservés quand transmis ; certaines classes sont regroupées par FolioFact.',
                     'quarterChanges': {'priorPeriodLabel': prior_label, 'exits': exits}},
        'sourceUrl': f'https://foliofact.com/funds/{source_slug}',
    }}
    validate_portfolio(result, slug)
    return result


def enrich_filing_metadata(portfolio):
    snapshot = portfolio['data']['snapshot']
    if 'declaredTotal' not in snapshot:
        # Tracefour already carries an explicit publication date and SEC archive URL.
        matches = [item for item in portfolio['data'].get('_providerFilingHistory', []) if item.get('periodLabel') == snapshot.get('periodLabel') and item.get('filedAt') == snapshot.get('filedAt') and str(item.get('sourceUrl', '')).startswith('https://www.sec.gov/Archives/edgar/')]
        if len(matches) != 1:
            raise ValueError('Original SEC source missing from alternate provider')
        snapshot['filingUrl'] = matches[0]['sourceUrl']
        snapshot['publicationSource'] = portfolio['data']['sourceUrl']
        return
    page_url = portfolio['data']['sourceUrl']
    page = get_json(page_url, raw_text=True)
    period = snapshot['periodEnd']
    if f'/quarters/{period}' not in page:
        raise ValueError('Filing metadata disagrees with API quarter')
    filed = re.search(r'>Filed</dt>\s*<dd[^>]*>\s*(\d{4}-\d{2}-\d{2})', page)
    source = re.search(r'href="(https://www\.sec\.gov/Archives/edgar/[^"<>]+)"', page)
    if not filed or not source or not period <= filed[1] <= current_date().isoformat():
        raise ValueError('Publication date or original SEC source unavailable')
    snapshot['filedAt'] = filed[1]
    snapshot['publicationSource'] = page_url
    snapshot['filingUrl'] = html.unescape(source[1])


def enrich_sec_positions(portfolio):
    """Complete the existing provider acquisition with its original SEC filing.

    Provider discovery, schedule, validation, storage and archives stay shared.
    Only exact CUSIP/class/option identities may be combined, never fuzzy names.
    """
    data = portfolio['data']
    snapshot = data['snapshot']
    original = snapshot.get('filingUrl')
    if not original or urllib.parse.urlparse(original).hostname != 'www.sec.gov':
        raise ValueError('Original SEC filing not identified')
    folder = original if original.endswith('/') else original.rsplit('/', 1)[0] + '/'
    directory = get_json(folder + 'index.json')
    names = [r['name'] for r in directory.get('directory', {}).get('item', [])
             if re.fullmatch(r'[\w.-]+\.xml', r.get('name', ''), re.I)]
    if not names or len(names) > 20:
        raise ValueError('SEC filing XML documents unavailable or ambiguous')
    primary, tables = None, []
    documents = []
    for name in names:
        document = get_json(folder + name, raw_text=True)
        root = ET.fromstring(document)
        # Namespace prefixes vary by filer; strip names without altering values.
        for element in root.iter():
            element.tag = element.tag.rsplit('}', 1)[-1]
        if root.tag == 'edgarSubmission':
            if primary is not None:
                raise ValueError('Multiple SEC cover documents')
            primary = root
            documents.append(folder + name)
        elif root.tag == 'informationTable':
            tables.extend(root.findall('infoTable'))
            documents.append(folder + name)
    if primary is None or not tables:
        raise ValueError('SEC cover or information table missing')
    period = dt.datetime.strptime(primary.findtext('.//periodOfReport', ''), '%m-%d-%Y').date().isoformat()
    if period != snapshot['periodEnd'] or period < '2023-01-03':
        # SEC changed from thousands to whole dollars in 2023. Do not guess units.
        raise ValueError('SEC report date or dollar-unit convention disagrees')
    entity = primary.findtext('.//filingManager/name')
    cik = primary.findtext('.//credentials/cik')
    total = int(primary.findtext('.//tableValueTotal', '0'))
    count = int(primary.findtext('.//tableEntryTotal', '0'))
    if not entity or not cik or total <= 0 or count != len(tables):
        raise ValueError('SEC manager, declared total or row count missing/inconsistent')
    if primary.findtext('.//isAmendment', '').lower() == 'true' and primary.findtext('.//amendmentType', '').upper() != 'RESTATEMENT':
        raise ValueError('Additional-holdings amendment requires a consolidated filing')
    groups = {}
    for row in tables:
        issuer = row.findtext('nameOfIssuer', '').strip()
        share_class = row.findtext('titleOfClass', '').strip()
        cusip = row.findtext('cusip', '').strip().upper()
        option = (row.findtext('putCall') or '').strip().upper() or None
        value = int(row.findtext('value', '-1'))
        if not issuer or not share_class or not re.fullmatch(r'[A-Z0-9*@#]{9}', cusip) or option not in (None, 'PUT', 'CALL') or value < 0:
            raise ValueError('Invalid SEC information-table security')
        if value == 0:
            continue
        key = (cusip, share_class, option)
        if key not in groups:
            groups[key] = {'issuerName': issuer, 'shareClass': share_class, 'cusip': cusip, 'securityId': cusip,
                           'ticker': '', 'putCall': option, 'value': 0, 'currency': 'USD', 'unit': 1,
                           'sourceRows': [], 'isNew': False, 'sharesChangePct': None}
        position = groups[key]
        position['value'] += value
        position['sourceRows'].append({'value': value, 'issuerName': issuer, 'shares': row.findtext('.//sshPrnamt'),
                                       'amountType': row.findtext('.//sshPrnamtType'),
                                       'investmentDiscretion': row.findtext('investmentDiscretion'),
                                       'otherManager': row.findtext('otherManager')})
    row_total = sum(row['value'] for row in groups.values())
    if abs(row_total - total) > .5 * count:
        raise ValueError('SEC information table does not reconcile with declared total')
    provider_total = snapshot.get('declaredTotal', snapshot.get('totalValueUsd'))
    if provider_total is not None and abs(row_total - provider_total) > .5 * count:
        # A factor of 1,000 is a unit conflict, not permission to silently multiply.
        raise ValueError(f'SEC/provider valuation conflict: SEC rows {row_total} USD, provider {provider_total} USD')
    snapshot['reportedCoverTotal'] = total
    snapshot['reconciliationDifference'] = row_total - total
    total = row_total
    for row in groups.values():
        row['weight'] = row['value'] / total
    # Retain the provider observation separately; no source disagreement is hidden.
    snapshot['providerDeclaredTotal'] = snapshot.get('declaredTotal', snapshot.get('totalValueUsd'))
    snapshot['providerHoldingsCount'] = len(snapshot['holdings'])
    snapshot['providerTotalDifference'] = total - snapshot['providerDeclaredTotal'] if snapshot['providerDeclaredTotal'] is not None else None
    snapshot.update(holdings=sorted(groups.values(), key=lambda r: -r['value']), declaredTotal=total,
                    currency='USD', valueUnit=1, valueUnitSource='https://www.sec.gov/files/form13f.pdf',
                    valueScope='Déclaration SEC 13F ; positions longues et options déclarées',
                    sourceDocuments=documents, originalRowCount=count, primaryVerified=True,
                    securityIdentityNote='Titres identifiés par CUSIP, classe et type. Lignes de gestion identiques additionnées ; classes distinctes conservées.')
    data['identity'].update(entityName=entity, declaringCik=cik, entitySource=original)
    data['identity']['dataProvider'] = 'SEC'
    data.pop('_providerFilingHistory', None)
    data['discoverySourceUrl'] = data['sourceUrl']
    data['sourceUrl'] = original


def prepare_update(destination, portfolio):
    """Never replace a newer filing with an older provider response."""
    if destination.exists():
        previous = json.loads(destination.read_text())
        old_period = dt.date.fromisoformat(previous['data']['snapshot']['periodEnd'])
        new_period = dt.date.fromisoformat(portfolio['data']['snapshot']['periodEnd'])
        if new_period < old_period:
            raise ValueError(f'Refusing older report for {destination.stem}: {new_period} < {old_period}')
        if {k: v for k, v in previous['data'].items() if k != 'filingHistory'} == portfolio['data']:
            return None
        # Tracefour's history has a different schema; only local archived
        # snapshots have a usable snapshotUrl. Never invent an archive path.
        history = {item['periodEnd']: item for item in previous['data'].get('filingHistory', [])
                   if item.get('periodEnd') and item.get('snapshotUrl')}
        if new_period != old_period:
            history[old_period.isoformat()] = {'periodEnd': old_period.isoformat(), 'sourceUrl': previous['data'].get('sourceUrl'),
                                             'snapshotUrl': f'data/investors/archive/{destination.stem}/{old_period.isoformat()}.json'}
        portfolio['data']['filingHistory'] = sorted(history.values(), key=lambda row: row['periodEnd'], reverse=True)
    return json.dumps(portfolio, ensure_ascii=False, indent=2) + '\n'


def refresh(directory, fetch_portfolio=make_portfolio, report_path=None):
    # Each manager is validated independently: a validated filing is saved even if
    # another provider fails, and a failed manager keeps its last validated filing.
    # Failures still end the run in error so they stay visible in monitoring.
    pending = []
    reviews = []
    checks = []
    failures = []
    review_path = directory / 'review-metadata.json'
    prior_reviews = {r['data']['identity']['slug']: r for r in json.loads(review_path.read_text())} if review_path.exists() else {}
    for slug, (source_slug, display, entity) in MANAGERS.items():
        destination = directory / f'{slug}.json'
        try:
            portfolio = fetch_portfolio(slug, source_slug, display, entity)
            validate_portfolio(portfolio, slug)
            if fetch_portfolio is make_portfolio:
                enrich_filing_metadata(portfolio)
                enrich_sec_positions(portfolio)
                validate_portfolio(portfolio, slug)
            content = prepare_update(destination, portfolio)
        except Exception as error:
            failures.append(f'{slug}: {error}')
            checks.append({'slug': slug, 'status': 'failed', 'reason': str(error)})
            print(f'{slug}: failed — {error}', flush=True)
            if destination.exists():
                stored = json.loads(destination.read_text())
                reviews.append({**prior_reviews.get(slug, {}), 'as_of': stored.get('as_of'), 'lastAttemptAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'lastAttemptStatus': 'failed', 'lastError': str(error), 'data': {
                    'identity': stored['data'].get('identity', {'slug': slug, 'displayName': display}),
                    'snapshot': {'periodEnd': stored['data']['snapshot']['periodEnd']},
                    'sourceUrl': stored['data'].get('sourceUrl', f'https://foliofact.com/funds/{source_slug}'),
                }})
            continue
        checks.append({'slug': slug, 'status': 'validated', 'periodEnd': portfolio['data']['snapshot']['periodEnd'], 'changed': content is not None})
        if content is not None:
            if destination.exists():
                previous = json.loads(destination.read_text())
                prior_period = previous['data']['snapshot']['periodEnd']
                # A same-quarter amendment replaces the current snapshot, never
                # the archived filing of a preceding quarter.
                if prior_period != portfolio['data']['snapshot']['periodEnd']:
                    archive = directory / 'archive' / slug / f'{prior_period}.json'
                    if not archive.exists():
                        pending.append((archive, json.dumps(previous, ensure_ascii=False, indent=2) + '\n'))
            pending.append((destination, content))
        # Review screens only need metadata, not thousands of security lines.
        # Preserve the stored check date on unchanged data so this index does
        # not create a new commit on every successful poll.
        current = json.loads(content) if content else json.loads(destination.read_text())
        reviews.append({'as_of': current.get('as_of'), 'lastAttemptAt': portfolio['as_of'], 'lastAttemptStatus': 'validated', 'lastError': None, 'lastSuccessfulPollAt': portfolio['as_of'], 'positionsCollectedAt': current.get('as_of'), 'data': {
            'identity': current['data'].get('identity', {'slug': slug, 'displayName': display}),
            'snapshot': {'periodEnd': current['data']['snapshot']['periodEnd']},
            'sourceUrl': current['data'].get('sourceUrl', f'https://foliofact.com/funds/{source_slug}'),
        }})
        print(slug, portfolio['data']['snapshot']['periodEnd'], 'changed' if content else 'unchanged')
        time.sleep(.2)
    validated = len(checks) - len(failures)
    report = {'checkedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
              'status': ('failed' if not validated else 'partial') if failures else 'validated', 'readyToApply': validated > 0,
              'managers': checks}
    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(f'\n## Contrôle des {len(MANAGERS)} investisseurs\n\n')
            summary.write(f'{len(failures)} investisseur(s) conservé(s) à leur dernier relevé validé ; les {validated} autres sont enregistrés.\n'
                          if failures else 'Tous les relevés sont validés.\n')
            for check in checks:
                summary.write(f"- {check['slug']} : {check['status']} — {check.get('periodEnd', check.get('reason'))}\n")
    review_file = directory / 'review-metadata.json'
    review_content = json.dumps(reviews, ensure_ascii=False, indent=2) + '\n'
    if not review_file.exists() or review_file.read_text() != review_content:
        pending.append((review_file, review_content))
    directory.mkdir(parents=True, exist_ok=True)
    for destination, content in pending:
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix('.json.tmp')
        temporary.write_text(content, encoding='utf-8')
        os.replace(temporary, destination)
    if failures:
        raise RuntimeError(f'Investor refresh partial; {len(failures)} manager(s) kept at their last validated filing: ' + '; '.join(failures))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=pathlib.Path, help='Diagnostic report, including every manager on failure')
    parser.add_argument('--directory', type=pathlib.Path, default=ROOT / 'public/data/investors')
    args = parser.parse_args()
    refresh(args.directory, report_path=args.output)


if __name__ == '__main__':
    __import__('producer_report_contract').run('update-investor-13f', main)
