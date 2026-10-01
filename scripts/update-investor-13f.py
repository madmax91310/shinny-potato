"""Refresh selected 13F managers from FolioFact's public holdings API."""
import datetime as dt
import json
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
    history = get_json(f'{base}/history')
    print('History schema', slug, json.dumps(history, ensure_ascii=False)[:1200], flush=True)
    raise NotImplementedError('Verify filing date schema')


def main():
    directory = ROOT / 'public/data/investors'
    directory.mkdir(parents=True, exist_ok=True)
    for slug, (source_slug, display, entity) in MANAGERS.items():
        portfolio = make_portfolio(slug, source_slug, display, entity)
        destination = directory / f'{slug}.json'
        if destination.exists():
            previous = json.loads(destination.read_text())
            if previous['data'] == portfolio['data']:
                print(slug, 'unchanged')
                continue
        destination.write_text(json.dumps(portfolio, ensure_ascii=False, indent=2) + '\n')
        print(slug, portfolio['data']['snapshot']['periodEnd'], len(portfolio['data']['snapshot']['holdings']))
        time.sleep(.2)


if __name__ == '__main__':
    main()
