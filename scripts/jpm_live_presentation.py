"""Renew JEPG's fund AUM/top ten from the already qualified public holdings API.

Monthly PDF characteristics, calendar returns and classifications keep their own
source and period. The API's proprietary classifications are not substituted.
"""
import json
import math
import re

from issuer_documents import download, document_date, proof, validated_rows
from jpm_holdings import ISIN, URL, qualified_fund
from collect_physical_holdings import checked_rows


def parse_live(body, share, now):
    if share.get('isin') != ISIN or share.get('currency') != 'USD':
        raise ValueError('Unsupported JPM presentation share/currency')
    document = json.loads(body)
    # Same exact identity/strategy checks as the full-book collector. AUM and
    # top ten do not require a complete portfolio; that separate gate is intact.
    fund = qualified_fund(document)
    result = {}
    errors = []
    for field, reader in [('aum', parse_aum), ('holdings', parse_top_ten)]:
        try:
            result[field] = reader(fund, body, now)
        except (ValueError, KeyError, TypeError) as error:
            errors.append({'field': field + '-current-source', 'url': URL, 'reason': str(error)})
    if not result:
        raise ValueError('; '.join(e['field'] + ': ' + e['reason'] for e in errors))
    if errors:
        result['collectionErrors'] = errors
    return result


def parse_aum(fund, body, now):
    aum = fund['aum']
    amount = aum['value']
    if (isinstance(amount, bool) or not isinstance(amount, (int, float))
            or not math.isfinite(amount) or amount <= 0):
        raise ValueError('Invalid JPM fund AUM')
    if (aum.get('currencyCode') not in (None, 'USD')
            or aum.get('currencyCode') is None and fund.get('isDisplayAumInUsd') is not True):
        raise ValueError('Unqualified JPM AUM display currency')
    aum_date = document_date(aum['date'], now)
    return {'sourceUrl': URL, 'sha256': proof(body), 'amount': amount,
            'currency': 'USD', 'scope': 'fund', 'asOf': aum_date,
            'sourceComponent': 'fundData.aum.value'}


def parse_top_ten(fund, body, now):
    observation = fund['dailyHoldings']
    stamp = document_date(observation['effectiveDate'], now)
    top = observation['data']
    if not isinstance(top, list) or len(top) != 10:
        raise ValueError('Unqualified JPM ten direct equity positions')
    for row in top:
        weight = row.get('marketValuePercent')
        if (row.get('securityType') not in ['Common Stock', 'Fund - Real Estate Investment Trust']
                or row.get('navDate') != stamp
                or not re.fullmatch(r'[A-Z]{3}', row.get('currencyCode') or '')
                or isinstance(weight, bool) or not isinstance(weight, (int, float))
                or not math.isfinite(weight) or not 0 < weight <= 100):
            raise ValueError('Invalid JPM top-ten type, weight, date or currency')
    rows = validated_rows([
        {'isin': r['securityIsin'], 'name': r['securityDescription'],
         'weightPct': r['marketValuePercent']} for r in top
    ], complete=False)
    checked_rows(rows)  # exact security identifiers and duplicates, no weight rewrite
    return {'sourceUrl': URL, 'sha256': proof(body), 'rows': rows,
            'asOf': stamp, 'basis': 'fund', 'complete': False,
            'sourceComponent': 'fundData.dailyHoldings',
            'method': 'Published top ten direct equity/REIT positions; native portfolio market-value weights, no renormalisation or complete-overlap inference'}


def collect(share, now, document, fetch=download):
    """Keep the two sources independent, including partial failure receipts."""
    result = None
    document_error = None
    attempts = []
    try:
        result = document()
        attempts.append({'url': share['sourceUrl'], 'status': 'validated',
                         'fields': ['characteristics.terPct', 'performance', 'countries', 'sectors', 'aum', 'holdings']})
    except Exception as error:
        document_error = str(error)
        attempts.append({'url': share['sourceUrl'], 'status': 'failed', 'reason': document_error})
    try:
        fields = parse_live(fetch(URL, max_bytes=6_000_000), share, now)
        field_errors = fields.pop('collectionErrors', [])
    except Exception as error:
        if result is None:
            raise ValueError('JPM document: ' + str(document_error) + '; current API: ' + str(error)) from error
        result.setdefault('collectionErrors', []).extend(
            {'field': field + '-current-source', 'url': URL, 'reason': str(error)}
            for field in ['aum', 'holdings'])
        attempts.append({'url': URL, 'status': 'failed', 'fields': ['aum', 'holdings'], 'reason': str(error)})
    else:
        if result is None:
            # The shared merge supports exposure-only partial observations;
            # absent PDF values must not gain a successful control timestamp.
            result = {**share, 'productId': ISIN, 'exposureOnly': True, 'unavailable': []}
            result['collectionErrors'] = [
                {'field': field, 'url': share['sourceUrl'], 'reason': str(document_error)}
                for field in ['characteristics.terPct', 'performance', 'countries', 'sectors']]
        result.update(fields)
        result.setdefault('collectionErrors', []).extend(field_errors)
        for field in ['aum', 'holdings']:
            error = next((e for e in field_errors if e['field'] == field + '-current-source'), None)
            attempts.append({'url': URL, 'status': 'failed' if error else 'validated', 'fields': [field],
                             **({'reason': error['reason']} if error else {})})
    result.setdefault('sourceAttempts', []).extend(attempts)
    return result
