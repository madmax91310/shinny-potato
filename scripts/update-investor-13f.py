"""Refresh selected 13F managers from FolioFact's public holdings API."""
import datetime as dt
import json
import os
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANAGERS = {
    'li-lu': ('himalaya-capital-management', 'Li Lu', 'Himalaya Capital Management LLC'),
    'gates-trust': ('gates-foundation-trust', 'Gates Foundation Trust', 'Gates Foundation Trust'),
    'klarman': ('baupost-group', 'Seth Klarman', 'Baupost Group LLC'),
}


def get_json(url):
    request = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent': 'EpargnantLibre/1.0'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def make_portfolio(slug, source_slug, display, entity):
    base = f'https://foliofact.com/api/v1/funds/{source_slug}'
    fund = get_json(base)
    table = get_json(f'{base}/holdings')
    period = fund['filing']['report_period_on']
    total = float(table['total_value'])
    dt.date.fromisoformat(period)
    if total <= 0 or total != float(fund['filing']['total_value']):
        raise ValueError(f'Inconsistent report for {slug}')
    rows = table['holdings']
    holdings = [
        {'issuerName': row['security']['name'], 'ticker': row['security']['ticker'] or '',
         'putCall': None, 'weight': float(row['value']) / total}
        for row in rows if row.get('position_type') == 'direct' and float(row.get('value') or 0) > 0
    ]
    weight_sum = sum(row['weight'] for row in holdings)
    if len(holdings) < 5 or not .95 <= weight_sum <= 1.02:
        raise ValueError(f'Incomplete portfolio for {slug}: {len(holdings)} rows, {weight_sum:.3f} total weight')
    return {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(), 'data': {
        'identity': {'slug': slug, 'archetype': 'hedge_fund', 'displayName': display,
                     'entityName': entity, 'dataProvider': 'FolioFact'},
        'snapshot': {'periodEnd': period, 'holdings': holdings},
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
        if previous['data'] == portfolio['data']:
            return None
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
            pending.append((destination, content))
        print(slug, portfolio['data']['snapshot']['periodEnd'], 'changed' if content else 'unchanged')
        time.sleep(.2)
    directory.mkdir(parents=True, exist_ok=True)
    for destination, content in pending:
        temporary = destination.with_suffix('.json.tmp')
        temporary.write_text(content, encoding='utf-8')
        os.replace(temporary, destination)


def main():
    refresh(ROOT / 'public/data/investors')


if __name__ == '__main__':
    main()
