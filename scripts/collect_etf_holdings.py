"""Official BlackRock product-page holdings; no search, keys or manual downloads."""
import math
from urllib.parse import urlencode, urlsplit
from data_automation import get_json, number, reject
from collect_etf_pilot import source_date


def holdings_url(component, share):
    context = component['context']
    if str(context['productId']) != str(share['productId']) or context['currencyCode'] != share['currency']:
        reject('Holdings context identity changed')
    host = component['apiHost']
    if urlsplit(host).hostname not in ('www.blackrock.com', 'www.ishares.com') or '/product-data/api/' not in host:
        reject('Unexpected holdings host')
    return host + urlencode({'appSubType': context['appSubType'], 'appType': 'PRODUCT_PAGE',
        'component': 'holdings.all', 'locale': context['locale'], 'portfolioId': context['productId'],
        'targetSite': context['targetSite'], 'userType': context['userType'], 'excludeContent': 'true',
        'asOfDate': component['initAsOfDates']['all'], 'includeConfig': 'true'})


def parse_holdings(body, share, now):
    if str(body['productId']) != str(share['productId']) or body['currencyCode'] != share['currency']:
        reject('Wrong holdings product or currency')
    points = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    stamp = source_date(points['asOfDate']['value'], now)
    columns = {k: points[k]['value'] for k in ('issueName', 'holdingPercent', 'isin', 'countryOfRisk', 'assetClass')}
    size = len(columns['issueName'])
    if not size or any(not isinstance(c, list) or len(c) != size for c in columns.values()):
        reject('Truncated holdings columns')
    weights = columns['holdingPercent']
    if any(isinstance(w, bool) or not isinstance(w, (int, float)) or not math.isfinite(w) or w < -1 or w > 100 for w in weights):
        reject('Invalid holdings weights')
    if not 99 <= sum(weights) <= 101:
        reject('Incomplete holdings portfolio')
    equities = [{'name': n, 'weightPct': w, 'isin': i} for n, w, i, a in
        zip(columns['issueName'], weights, columns['isin'], columns['assetClass']) if a == 'Equity' and w > 0]
    if not equities:
        reject('No equity holdings in equity fund')
    if any(not row['name'] for row in equities):
        reject('Missing equity identity')
    countries = {}
    for country, weight in zip(columns['countryOfRisk'], weights):
        key = country if country and country != '-' else 'Other'
        countries[key] = countries.get(key, 0) + weight
    # Preserve signed cash/derivatives explicitly; never normalise equity weights.
    geography = {'asOf': stamp, 'method': 'Country of risk, all published holdings including cash/derivatives, no renormalisation',
        'rows': [{'name': n, 'weightPct': round(w, 6)} for n, w in sorted(countries.items(), key=lambda p: -p[1])]}
    return {'asOf': stamp, 'basis': 'fund', 'rows': sorted(equities, key=lambda p: -p['weightPct'])[:10]}, geography


def collect_holdings(component, share, now, fetch=get_json):
    url = holdings_url(component, share)
    holdings, countries = parse_holdings(fetch(url), share, now)
    holdings['sourceUrl'] = countries['sourceUrl'] = url
    return holdings, countries
