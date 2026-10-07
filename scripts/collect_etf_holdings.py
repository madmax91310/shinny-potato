"""Official BlackRock product-page holdings; no search, keys or manual downloads."""
import math
import datetime as dt
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
    asset_class = share.get('holdingsAssetClass', 'Equity')
    if asset_class not in ('Equity', 'Fixed Income'):
        reject('Unqualified holdings asset class')
    selected = []
    for name, weight, isin, kind in zip(columns['issueName'], weights, columns['isin'], columns['assetClass']):
        if kind != asset_class or weight <= 0:
            continue
        if not name:
            reject('Missing security identity')
        # Several bonds of one issuer have the same published name. Keep the
        # individual security identity visible, rather than merging issuers.
        label = name + ' · ' + isin if asset_class == 'Fixed Income' and isin else name
        selected.append({'name': label, 'weightPct': weight, 'isin': isin})
    identified = [r['isin'] for r in selected if r['isin'] and r['isin'] != '-']
    if not selected or (asset_class == 'Fixed Income' and len(set(identified)) != len(identified)):
        reject('Missing or duplicate securities in qualified asset class')
    top = sorted(selected, key=lambda p: -p['weightPct'])[:10]
    for row in top:
        if row['isin'] and row['isin'] != '-': continue
        if asset_class != 'Fixed Income': reject('Missing top holding security identity')
        # Some mortgage pools have no published ISIN. Their reported name,
        # coupon and maturity identify the position without inventing an ISIN.
        index = next(i for i, (n, w) in enumerate(zip(columns['issueName'], weights))
                     if n == row['name'] and w == row['weightPct'])
        maturity = points['maturityDate']['value'][index]
        coupon = points['couponRate']['value'][index]
        maturity = dt.datetime.strptime(str(maturity), '%Y%m%d').date().isoformat()
        if isinstance(coupon, bool) or not isinstance(coupon, (int, float)) or not math.isfinite(coupon) or not 0 <= coupon <= 100:
            reject('Invalid bond coupon identity')
        row.pop('isin'); row.update(maturityDate=maturity, couponPct=coupon)
        row['name'] += f' · {coupon:g}% · {maturity}'
    if len({r['name'] for r in top}) != len(top): reject('Ambiguous top holding identity')
    countries = {}
    for country, weight in zip(columns['countryOfRisk'], weights):
        key = country if country and country != '-' else 'Other'
        countries[key] = countries.get(key, 0) + weight
    # Preserve signed cash/derivatives explicitly; never normalise equity weights.
    geography = {'asOf': stamp, 'method': 'Country of risk, all published holdings including cash/derivatives, no renormalisation',
        'rows': [{'name': n, 'weightPct': round(w, 6)} for n, w in sorted(countries.items(), key=lambda p: -p[1])]}
    return {'asOf': stamp, 'basis': 'fund', 'rows': top}, geography


def collect_holdings(component, share, now, fetch=get_json):
    url = holdings_url(component, share)
    holdings, countries = parse_holdings(fetch(url), share, now)
    holdings['sourceUrl'] = countries['sourceUrl'] = url
    return holdings, countries
