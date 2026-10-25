"""Refresh selected 13F managers from FolioFact's public holdings API."""
import datetime as dt
import argparse
from email.utils import parsedate_to_datetime
import json
import math
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
        key = (name if not ticker or ticker == 'Unmapped CUSIP' else ticker, row.get('putCall'))
        if key in keys:
            raise ValueError('Duplicate security across holdings pages: ' + slug)
        keys.add(key)
    if not any(row.get('putCall') is None for row in rows) or not .95 <= sum(row['weight'] for row in rows) <= 1.02:
        raise ValueError('Incomplete declared 13F portfolio: ' + slug)
    source = urllib.parse.urlparse(data.get('sourceUrl', ''))
    if source.scheme != 'https' or source.hostname not in ('foliofact.com', 'tracefour.com'):
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


def get_json(url):
    global _last_request_at
    request = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent': 'EpargnantLibre/1.0'})
    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        # Apply FolioFact's 20 requests/minute pacing to retries as well.
        if urllib.parse.urlparse(url).hostname == 'foliofact.com':
            time.sleep(max(0, 3.1 - (time.monotonic() - _last_request_at)))
            _last_request_at = time.monotonic()
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
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
            alternate_data['sourceUrl'] = 'https://tracefour.com/trackers/ackman'
            # Provider valuation histories/benchmarks are not manager returns.
            # Persist only the sourced filing consumed by this tool.
            result = {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(), 'data': {
                'identity': identity, 'snapshot': alternate_snapshot,
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
         'isNew': row.get('change') == 'new',
         'sharesChangePct': shares_change(row)}
        for row in rows if row.get('position_type') in ('direct', 'call', 'put') and float(row.get('value') or 0) > 0
    ]
    weight_sum = sum(row['weight'] for row in holdings)
    if not holdings or not any(row['putCall'] is None for row in holdings) or any(not math.isfinite(row['weight']) or row['weight'] > 1 for row in holdings) or not .95 <= weight_sum <= 1.02:
        raise ValueError(f'Incomplete portfolio for {slug}: {len(holdings)} rows, {weight_sum:.3f} total weight')
    quarter = (dt.date.fromisoformat(period).month - 1) // 3 + 1
    year = dt.date.fromisoformat(period).year
    prior_label = f'Q{quarter - 1 if quarter > 1 else 4} {year if quarter > 1 else year - 1}'
    exits = [{'issuerName': row['security']['name'], 'ticker': row['security']['ticker'] or '', 'putCall': None}
             for row in rows if row.get('position_type') == 'direct' and row.get('change') == 'sold'
             and float(row.get('value') or 0) == 0 and float(row.get('shares') or 0) == 0]
    result = {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(), 'data': {
        'identity': {'slug': slug, 'archetype': 'hedge_fund', 'displayName': display,
                     'entityName': entity, 'dataProvider': 'FolioFact'},
        'snapshot': {'periodEnd': period, 'holdings': holdings,
                     'quarterChanges': {'priorPeriodLabel': prior_label, 'exits': exits}},
        'sourceUrl': f'https://foliofact.com/funds/{source_slug}',
    }}
    validate_portfolio(result, slug)
    return result


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
            content = prepare_update(destination, portfolio)
        except Exception as error:
            failures.append(f'{slug}: {error}')
            checks.append({'slug': slug, 'status': 'failed', 'reason': str(error)})
            print(f'{slug}: failed — {error}', flush=True)
            if destination.exists():
                stored = json.loads(destination.read_text())
                reviews.append({**prior_reviews.get(slug, {}), 'as_of': stored.get('as_of'), 'data': {
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
        reviews.append({'as_of': current.get('as_of'), 'lastSuccessfulPollAt': portfolio['as_of'], 'positionsCollectedAt': current.get('as_of'), 'data': {
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
