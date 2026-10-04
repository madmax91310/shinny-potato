"""Refresh selected 13F managers from FolioFact's public holdings API."""
import datetime as dt
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
}
_last_request_at = 0
MAX_RATE_LIMIT_RETRIES = 3
MAX_RETRY_AFTER_SECONDS = 300


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
    table = get_json(f'{base}/holdings')
    period = fund['filing']['report_period_on']
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
            alternate_data.pop('filingHistory', None)
            return alternate
    total = float(table['total_value'])
    dt.date.fromisoformat(period)
    if not math.isfinite(total) or total <= 0 or total != float(fund['filing']['total_value']):
        raise ValueError(f'Inconsistent report for {slug}')
    if table.get('quarter') != fund['filing'].get('quarter'):
        raise ValueError(f'Inconsistent quarter for {slug}')
    rows = list(table['holdings'])
    pagination = table.get('pagination', {})
    for page in range(2, int(pagination.get('total_pages', 1)) + 1):
        next_table = get_json(f'{base}/holdings?page={page}')
        if next_table['quarter'] != table['quarter'] or float(next_table['total_value']) != total:
            raise ValueError(f'Inconsistent holdings page for {slug}')
        rows.extend(next_table['holdings'])
    if pagination.get('total') is not None and len(rows) != int(pagination['total']):
        raise ValueError(f'Incomplete holdings pages for {slug}')
    holdings = [
        {'issuerName': row['security']['name'], 'ticker': row['security']['ticker'] or '',
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
    return {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(), 'data': {
        'identity': {'slug': slug, 'archetype': 'hedge_fund', 'displayName': display,
                     'entityName': entity, 'dataProvider': 'FolioFact'},
        'snapshot': {'periodEnd': period, 'holdings': holdings,
                     'quarterChanges': {'priorPeriodLabel': prior_label, 'exits': exits}},
        'sourceUrl': f'https://foliofact.com/funds/{source_slug}',
    }}


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


def refresh(directory, fetch_portfolio=make_portfolio):
    # Validate all responses before changing any snapshot. A provider failure keeps
    # the last successful set intact and fails the workflow visibly.
    pending = []
    for slug, (source_slug, display, entity) in MANAGERS.items():
        portfolio = fetch_portfolio(slug, source_slug, display, entity)
        destination = directory / f'{slug}.json'
        content = prepare_update(destination, portfolio)
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
        print(slug, portfolio['data']['snapshot']['periodEnd'], 'changed' if content else 'unchanged')
        time.sleep(.2)
    directory.mkdir(parents=True, exist_ok=True)
    for destination, content in pending:
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix('.json.tmp')
        temporary.write_text(content, encoding='utf-8')
        os.replace(temporary, destination)


def main():
    refresh(ROOT / 'public/data/investors')


if __name__ == '__main__':
    main()
