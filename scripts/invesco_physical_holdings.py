"""Exact physical funds' public economic books, not native benchmark proxies.

Invesco's qualified physical fund pages use the internal widget variation 'index' for its
fund exposure tables. 'fund' is the separately configured basket component. Scope
comes from the exact-share physical metadata and published fund page and its exact replication mandate,
never from that internal route name. Synthetic/hedged shares are not admitted.
"""
import base64
import json
import math
import re
import subprocess
from pathlib import Path
from issuer_documents import download, document_date
from collect_instrument_metadata import invesco_characteristics
from holdings_reconciliation import reconcile_positions

ROOT = Path(__file__).resolve().parent
CONTRACT = json.loads((ROOT/'invesco-physical-holdings-contracts.json').read_text())


def acquisition_route(isin, route_id=None):
    share = CONTRACT['shares'].get(isin)
    if not share:
        raise ValueError('Unqualified Invesco physical share')
    if route_id is None or route_id == 'primary':
        return dict(account=CONTRACT['account'], locale='fr-FR', pageUrl=share['pageUrl'],
                    mandateLiteral=share.get('mandateLiteral'))
    route = share.get('qualifiedRoutes', {}).get(route_id)
    if not route or route.get('account') != 'en_GB' or route.get('locale') != 'en-GB':
        raise ValueError('Unqualified Invesco public acquisition route')
    return route


def metadata_url(isin, route_id=None):
    account = acquisition_route(isin, route_id)['account']
    return f'https://dng-api.invesco.com/cache/v1/accounts/{account}/shareclasses/{isin}?idType=isin'


def table_scope(table, locale, stamp):
    if locale == 'fr-FR':
        census = re.search(r'Afficher\s+1\s+à\s+10\s+de\s+(\d+)\s+produits', table)
        date = re.search(r'\bau\s+(\d{2})/(\d{2})/(\d{4})\b', table)
        valid = bool(date and f'{date[3]}-{date[2]}-{date[1]}' == stamp)
    else:
        census = re.search(r'Showing\s+1\s+to\s+10\s+of\s+(\d+)\b', table)
        date = re.search(r'\bas of\s+(\d{1,2})-([A-Za-z]{3})-(\d{2})\b', table)
        months = 'jan feb mar apr may jun jul aug sep oct nov dec'.split()
        valid = bool(date and date[2].lower() in months
            and int(date[1]) == int(stamp[8:10]) and months.index(date[2].lower())+1 == int(stamp[5:7])
            and date[3] == stamp[2:4])
    if not census or not valid:
        raise ValueError('Unqualified Invesco public table census/date')
    return int(census[1])


def qualify_metadata(raw, isin, now, route_id=None):
    share = CONTRACT['shares'].get(isin)
    if not share:
        raise ValueError('Unqualified Invesco physical share')
    fields = invesco_characteristics(raw, isin, metadata_url(isin, route_id), now.date(),
                                     account=acquisition_route(isin, route_id)['account'])
    data = json.loads(raw)
    account = data.get('account', {})
    benchmarks = data.get('benchmarkRelationships')
    if (fields.get('replicationMethod') != 'Physical' or fields.get('currencyHedge') is not False
            or data.get('distributionFrequency') != share['distribution']
            or data.get('shareClassFullName') != share['shareName']
            or data.get('shareClassCurrency') != CONTRACT['currency']
            or account.get('accountName') != share.get('fundName', CONTRACT['fundName'])
            or account.get('currency') != CONTRACT['currency']
            or account.get('investmentVehicleType') != 'ETF' or account.get('productType') != 'ETF'
            or not isinstance(benchmarks, list) or len(benchmarks) != 1
            or benchmarks[0].get('benchmarkFullName') != share.get('benchmarkName', CONTRACT['benchmarkName'])
            or benchmarks[0].get('baseCurrency') != CONTRACT['currency']
            or benchmarks[0].get('indexBloombergTicker') != share.get('benchmarkTicker', CONTRACT['benchmarkTicker'])):
        raise ValueError('Wrong Invesco physical fund scope, share or benchmark')
    return data


def parse_capture(capture, metadata_raw, isin, now):
    from collect_physical_holdings import checked_rows, digest
    share = CONTRACT['shares'][isin]
    route_id = capture.get('acquisitionRoute', 'primary')
    route = acquisition_route(isin, route_id)
    metadata = qualify_metadata(metadata_raw, isin, now, route_id)
    url = f"https://dng-api.invesco.com/cache/v1/accounts/{route['account']}/shareclasses/{isin}/holdings/index?idType=isin&loadType=initial"
    raw = base64.b64decode(capture['bodyBase64'], validate=True)
    payload = json.loads(raw)
    mode = share.get('mandate', 'physical-sampling')
    if mode not in ('physical-sampling', 'full-physical-replication'):
        raise ValueError('Unqualified Invesco replication mandate')
    mandate_field = 'physicalReplicationMandateConfirmed' if mode == 'full-physical-replication' else 'samplingMandateConfirmed'
    table = capture['tableText']
    stamp = document_date(payload['effectiveDate'], now)
    census = table_scope(table, route['locale'], stamp)
    widget = capture.get('widget', {})
    if (capture.get('isin') != isin or capture.get('pageUrl') != route['pageUrl']
            or capture.get('pageTitle') != share['shareName'] or capture.get('sourceUrl') != url
            or capture.get(mandate_field) is not True
            or digest(raw) != capture.get('sourceSha256') or payload != capture.get('payload')
            or digest(table) != capture.get('tableTextSha256') or capture.get('asOf') != stamp
            or widget != dict(isin=isin, tableVariation='holdings', variationType='index',
                              apiResponseKey='holdings', top10Holdings=True, displayComponent=True, maxRowCount=10)):
        raise ValueError('Unqualified Invesco public sampled-fund table proof')
    entries = payload['holdings']
    if (type(capture.get('publisherRowCount')) is not int or census < 11
            or census != capture['publisherRowCount'] or len(entries) != census):
        raise ValueError('Truncated Invesco public table; ten-row view is not a complete source')
    positions, rows, selected, identities = [], [], [], set()
    residual_count = 0
    for item in entries:
        weight, identity, name = item['weight'], item.get('isin'), item.get('name')
        if type(weight) not in (int, float) or not math.isfinite(weight) or not isinstance(name, str) or not name:
            raise ValueError('Invalid Invesco security or weight')
        if name == 'Cash and/or Derivatives' and not identity:
            residual_count += 1
            if residual_count > 1 or not -1 <= weight <= 100:
                raise ValueError('Ambiguous Invesco non-equity residual')
            positions.append(dict(name=name, weightPct=weight, assetClass='Cash and/or Derivatives'))
        else:
            if not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d', identity or '') or identity in identities or not 0 <= weight <= 100:
                raise ValueError('Invalid, short or duplicate Invesco equity identity')
            identities.add(identity)
            row = dict(isin=identity, name=name, weightPct=weight)
            positions.append(dict(**row, assetClass='Equity'))
            if weight > 0:
                selected.append(len(positions)-1)
                rows.append(row)
    # Four-decimal source weights: only a rounding check, never a rescaling.
    if abs(sum(p['weightPct'] for p in positions)-100) > len(positions)*.00005+.0001:
        raise ValueError('Invesco original published NAV weights do not reconcile at source precision')
    reconciliation = reconcile_positions(positions, selected, stamp)
    return checked_rows(rows, 11), stamp, raw, reconciliation, metadata


def collect(share, now, raw_identity):
    from collect_physical_holdings import digest, observation, source_proof
    isin = share['isin']
    if share.get('holdingsContract') != CONTRACT['methodCode'] or share.get('currency') != CONTRACT['currency']:
        raise ValueError('Unqualified Invesco physical collection contract')
    route_id = CONTRACT['shares'][isin].get('preferredAcquisitionRoute', 'primary')
    route = acquisition_route(isin, route_id)
    raw_metadata = download(metadata_url(isin, route_id))
    qualify_metadata(raw_metadata, isin, now, route_id)
    completed = subprocess.run(['node', str(ROOT/'capture-invesco-physical.mjs'), isin, route_id],
                               capture_output=True, timeout=100, check=False)
    if completed.returncode:
        raise ValueError('Invesco public fund capture failed: '+completed.stderr.decode(errors='replace')[-1500:])
    capture = json.loads(completed.stdout)
    source_proof(share, 'invesco-public-table', base64.b64decode(capture['bodyBase64'], validate=True))
    source_proof(share, 'invesco-public-census', capture)
    source_proof(share, 'invesco-exact-share', raw_metadata)
    rows, stamp, raw, reconciliation, metadata = parse_capture(capture, raw_metadata, isin, now)
    result = observation(rows, stamp, capture['sourceUrl'], raw,
                         methodCode=CONTRACT['methodCode'], subjectIsin=isin,
                         navReconciliation=reconciliation,
                         excludedWeightPctByType=reconciliation['excludedWeightPctByType'],
                         identitySourceUrl=share['sourceUrl'], identitySha256=digest(raw_identity),
                         metadataSourceUrl=metadata_url(isin, route_id), metadataSha256=digest(raw_metadata),
                         metadataAsOf=metadata['effectiveDate'],
                         coverageProof={'kind':('issuer-physical-replicated-fund-public-table' if CONTRACT['shares'][isin].get('mandate')=='full-physical-replication' else 'issuer-physical-sampled-fund-public-table'),
                            'acquisitionRoute':route_id, 'accessConditions':route.get('accessConditions'),
                            'pageUrl':capture['pageUrl'], 'pageTitle':capture['pageTitle'],
                            'asOf':stamp, 'publisherRowCount':capture['publisherRowCount'],
                            'tableTextSha256':capture['tableTextSha256'],
                            'zeroEquityRowCount':sum(bool(p.get('isin')) and p['weight']==0
                                                     for p in json.loads(raw)['holdings']),
                            'normalizationApplied':False})
    result['method'] = ('Complete public economic securities table of the exact physical fund, '
                        'matched to the publisher table census/date and physical unhedged share metadata. '
                        'Internal widget variation index is not a native benchmark composition; the disabled basket component is not substituted. '
                        'Original fund NAV weights; zero weights and Cash and/or Derivatives excluded without renormalisation.')
    return result
