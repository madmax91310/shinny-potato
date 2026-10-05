"""Collect issuer-embedded structured data for five existing shares; with optional validated application."""
import argparse
import datetime as dt
from html.parser import HTMLParser
import json
import os
import pathlib
import urllib.error

from data_automation import UTC, get_text, number, reject, write_json_atomic


class Components(HTMLParser):
    def __init__(self):
        super().__init__()
        self.components = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'walrus-render-on-client' and 'componentprops' in attrs:
            value = json.loads(attrs['componentprops'])
            key = value.get('componentId')
            if key in ('keyFundFacts', 'performance', 'exposureBreakdowns'):
                if key in self.components:
                    reject(f'Duplicate issuer component: {key}')
                self.components[key] = value


def source_date(value, now):
    parsed = dt.datetime.strptime(str(value), '%Y%m%d').date()
    if parsed > now.date() or (now.date() - parsed).days > 45:
        reject('Missing, future or stale issuer snapshot')
    return parsed.isoformat()


def allocation(container, now):
    points = container['dataPointsByNameMap']
    labels, weights = points['type']['value'], points['fund']['value']
    if not isinstance(labels, list) or not labels or len(labels) != len(weights) or len(set(labels)) != len(labels):
        reject('Invalid allocation labels')
    for weight in weights:
        number(weight, positive=False)
        if weight > 100:
            reject('Invalid allocation weight')
    if not 99 <= sum(weights) <= 101:
        reject('Incomplete allocation')
    return {'asOf': source_date(points['asOf']['value'], now),
            'rows': [{'name': name, 'weightPct': weight} for name, weight in zip(labels, weights)]}


def parse_share(body, share, now):
    parser = Components()
    parser.feed(body)
    components = parser.components
    facts = components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    value = lambda key: facts[key]['value']
    if value('isin') != share['isin'] or value('seriesBaseCurrencyCode') != share['currency']:
        reject('Unexpected share identity or currency')
    if value('useOfProfitsCode') != 'Accumulating':
        reject('Unexpected distribution policy')
    ter = number(value('emeaMgt'), positive=False)
    if ter > 5:
        reject('Invalid TER')
    aum = facts['totalNetAssets']
    if aum.get('prefix', '').strip() != share['currency']:
        reject('Share AUM currency mismatch')
    exposure = components['exposureBreakdowns']['containersByNameMap']
    # Single-country funds may omit this component. Never invent a 100% allocation.
    countries = (allocation(exposure['geography']['subContainersByNameMap']['countries'], now)
                 if 'geography' in exposure else {'status': 'not-published', 'rows': []})
    sectors = allocation(exposure['sector'], now)
    calendar = components['performance']['containersByNameMap']['returns']['subContainersByNameMap']['calendar']['dataPointsByNameMap']
    types = calendar['returnTypes']['value']
    if not isinstance(types, list) or types.count('annualNav') != 1:
        reject('Calendar NAV total return missing or ambiguous')
    position = types.index('annualNav')
    if calendar['returnsByCurrency']['value'].get('annualNav') != share['currency']:
        reject('Performance currency changed')
    returns = {}
    for key in ('oneYear', 'twoYear', 'threeYear', 'fourYear', 'fiveYear', 'sixYear',
                'sevenYear', 'eightYear', 'nineYear', 'tenYear'):
        point = calendar.get(key)
        if not point or not point.get('active'):
            continue
        stamp = str(point['asOfDate'])
        date = dt.datetime.strptime(stamp, '%Y%m%d').date()
        if date.month != 12 or date.day != 31 or date.year >= now.year or str(date.year) in returns:
            reject('Duplicate or incomplete calendar year')
        values = point['value']
        if not isinstance(values, list) or len(values) != len(types):
            reject('Performance columns changed')
        if values[position] is None and f'{date.year}0101' < str(value('inceptionDate')):
            continue
        result = float(values[position])
        if not -100 < result < 1000:
            reject('Invalid annual return')
        returns[str(date.year)] = round(result, 2)
    if not all(str(year) in returns for year in range(2020, 2026)):
        reject('Missing complete 2020–2025 fund history')
    return {**share, 'terPct': ter, 'index': value('indexSeriesName'),
            'distribution': value('useOfProfitsCode'),
            'aum': {'amount': number(aum['value']), 'currency': share['currency'],
                    'scope': 'share-class', 'asOf': source_date(aum['asOfDate'], now)},
            'countries': countries, 'sectors': sectors,
            'performance': {'currency': share['currency'], 'basis': 'fund',
                            'method': 'calendar-year NAV total return, income reinvested, fund fees included',
                            'years': dict(sorted(returns.items()))},
            'rawComponents': components}


def collect(config, baseline, now=None, fetch=get_text):
    now = now or dt.datetime.now(UTC)
    shares = []
    for share in config['instruments']:
        url = f"https://www.ishares.com/uk/individual/en/products/{share['productId']}"
        result = parse_share(fetch(url, ('text/html',), 6_000_000), share, now)
        active = baseline[share['isin']]
        if active['currency'] != share['currency']:
            reject('Active baseline has a different currency')
        result['sourceUrl'] = url
        result['comparison'] = [
            {'year': year, 'active': active['values'][year - 2020],
             'issuer': result['performance']['years'][str(year)],
             'differencePp': round(result['performance']['years'][str(year)] - active['values'][year - 2020], 4)}
            for year in range(2020, 2026)]
        shares.append(result)
    return {'schemaVersion': 1, 'status': 'observation-only', 'checkedAt': now.isoformat(),
            'automaticConnectionAllowed': False, 'shares': shares}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', required=True, type=pathlib.Path)
    parser.add_argument('--output', required=True, type=pathlib.Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    config = json.loads(pathlib.Path(__file__).with_name('etf-pilot.json').read_text())
    baseline = json.loads(args.baseline.read_text())
    report = collect(config, baseline)
    if args.apply:
        from apply_etf_collection import apply
        changed = apply(report, pathlib.Path(__file__).resolve().parents[1] / 'src/data/automated-etf.json', baseline)
        report.update(status='applied' if changed else 'unchanged', automaticConnectionAllowed=True)
    write_json_atomic(args.output, report)
    print('Five shares validated: exact ISIN, share AUM, published allocations and annual NAV total returns. Application mode: ' + report['status'] + '.')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        rows = ['## Pilote iShares : cinq parts', '',
                '| ISIN | Encours daté | Géographie | Écart maximal 2020–2025 (points) |',
                '|---|---|---|---:|']
        for share in report['shares']:
            delta = max(abs(row['differencePp']) for row in share['comparison'])
            geography = 'Collectée' if share['countries']['rows'] else 'Non publiée sur cette page'
            rows.append(f"| {share['isin']} | {share['aum']['asOf']} | {geography} | {delta:.4f} |")
        rows += ['', f"Mode : {report['status']}. Devise USD, part exacte, NAV total return ; aucune performance d’indice substituée."]
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as handle:
            handle.write('\n'.join(rows) + '\n')


if __name__ == '__main__':
    main()
