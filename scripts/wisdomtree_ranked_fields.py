"""Exact issuer Fund/Sector fields, independent of the country classifications.

Only the six already qualified shares use this route. A top ten is never a
complete portfolio, and neither Incorporated nor Aggregate Country is borrowed.
"""
import hashlib
import http.client
import json
import math
import subprocess
from collect_wisdomtree_holdings import acquire_qualified_public_rankings, parse_public_rankings
from collect_wisdomtree_allocations import SECTOR_NAMES
from issuer_documents import document_date, download, validated_rows
from wisdomtree_api_holdings import CLASS_CONFIG


def parse_fields(payload, share, now, listing):
    config = CLASS_CONFIG[share['isin']]
    if share.get('currency') != config['currency']:
        raise ValueError('Wrong exact-share base currency')
    allowed = [config['fundTicker'], *[r['ticker'] for r in config.get('rankingsListingAlternatives', [])]]
    if listing not in allowed or not isinstance(payload, list) or not payload:
        raise ValueError('Missing/unqualified exact-share ranking route')
    if any(not isinstance(r, dict) or r.get('wtID') != config['rankingsEntityId']
           or r.get('ticker') != listing or r.get('entityName') != config['title']
           or type(r.get('rankClassificationID')) is not int for r in payload):
        raise ValueError('Wrong exact-share rankings identity')
    values, errors = {}, []
    try:
        rows, stamp = parse_public_rankings(payload, share, now, {}, listing, require_identity=False)
        rows = sorted(rows, key=lambda r: (-r['weightPct'], r['name'], r['sedol']))[:10]
        values['holdings'] = {'rows': validated_rows([{'name': r['name'], 'weightPct': r['weightPct']} for r in rows], complete=False),
                              'asOf': stamp, 'basis': 'fund', 'rankClassificationID': 1,
                              'scope': 'top-10', 'method': 'Top ten of the exact issuer Fund ranking; original fund weights, not renormalised'}
    except (KeyError, TypeError, ValueError) as error:
        errors.append({'field': 'holdings', 'reason': str(error)})
    try:
        selected = [r for r in payload if r['rankClassificationID'] == 2]
        if not selected or any(r.get('rankClassification') != 'Sector' or r.get('name') not in SECTOR_NAMES for r in selected):
            raise ValueError('Missing or unknown issuer Sector classification')
        dates = {document_date(r['dt'][:10], now) for r in selected}
        if len(dates) != 1:
            raise ValueError('Mixed sector observation dates')
        if any(type(r.get('pct')) not in (int, float) or not math.isfinite(r['pct']) or not 0 <= r['pct'] <= 1 for r in selected):
            raise ValueError('Invalid issuer sector fraction')
        values['sectors'] = {'rows': validated_rows([{'name': r['name'], 'weightPct': r['pct'] * 100} for r in selected]),
                             'asOf': dates.pop(), 'basis': 'fund', 'rankClassificationID': 2,
                             'method': 'Exact issuer Fund Sector ranking; original percentages, not country or index groups'}
    except (KeyError, TypeError, ValueError) as error:
        errors.append({'field': 'sectors', 'reason': str(error)})
    return values, errors


def augment_document(result, share, now, document_body, acquire=acquire_qualified_public_rankings):
    if share['isin'] not in CLASS_CONFIG:
        return result
    # This is the actual PDF acquired in this attempt, not a read of a cache.
    # Its document date and identity proof remain separate from the API dates.
    identity_url = f'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/{share["isin"]}'
    network_urls = []
    def fetch(url, **kwargs):
        if url == identity_url == share['factsheetUrl']:
            return document_body
        network_urls.append(url)
        return download(url, **kwargs)
    try:
        raw, url, identity, listing, attempts = acquire(share, now, fetch)
        values, errors = parse_fields(json.loads(raw), share, now, listing['ticker'])
        digest = hashlib.sha256(raw).hexdigest()
        used, deferred = [], []
        for field, value in values.items():
            prior = result.get(field)
            if prior and prior.get('asOf', '') >= value['asOf']:
                if prior['asOf'] == value['asOf']:
                    signature = lambda observation: sorted((' '.join(r['name'].casefold().split()), r['weightPct']) for r in observation['rows'])
                    if signature(prior) != signature(value):
                        # No majority or implicit rounding tolerance. Keep the
                        # stored value dated, quarantine this attempted field.
                        result.pop(field)
                        errors.append({'field': field, 'reason': 'Same-date document/API values differ; publication precision or names not reconciled; previous stored field retained without renewed control'})
                        continue
                deferred.append({'field': field, 'reason': 'API snapshot not newer than the qualified primary document', 'asOf': value['asOf']})
                continue
            result[field] = {**value, 'sourceUrl': url, 'sha256': digest,
                             'identitySourceUrl': identity['identitySourceUrl'], 'identitySha256': identity['identitySha256'],
                             'identityAsOf': identity['identityAsOf']}
            used.append(field)
        result.setdefault('sourceAttempts', []).extend([*attempts, {'url': url, 'status': 'validated' if not errors else 'partial',
                                                                   'fields': used, 'deferred': deferred}])
        result.setdefault('collectionErrors', []).extend({**e, 'url': url, 'phase': 'validation'} for e in errors)
    except (OSError, ValueError, TypeError, KeyError, http.client.HTTPException, subprocess.SubprocessError) as error:
        result.setdefault('collectionErrors', []).extend({'field': field, 'url': network_urls[-1] if network_urls else identity_url,
                                                          'phase': 'acquisition' if isinstance(error, (OSError, http.client.HTTPException)) else 'validation',
                                                          'networkAttempted': bool(network_urls), 'reason': str(error)} for field in ('holdings', 'sectors'))
    return result
