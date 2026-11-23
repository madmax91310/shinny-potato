"""Renew JEPG's fund AUM/top ten from the already qualified public holdings API.

Monthly PDF characteristics and calendar returns keep their own source and period.
API allocations have independent dates and explicitly distinct issuer taxonomies.
"""
import json
import math
import re

from issuer_documents import download, document_date, proof, validated_rows
from jpm_holdings import ISIN, URL, parse as parse_complete_book, qualified_fund
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
    from jpm_published_exposures import allocation
    for field, reader in [('aum', parse_aum), ('holdings', parse_top_ten),
                          ('countries',lambda f,b,n:allocation(f,b,n,'countries')),
                          ('sectors',lambda f,b,n:allocation(f,b,n,'sectors'))]:
        try:
            result[field] = reader(fund, body, now)
        except (ValueError, KeyError, TypeError) as error:
            errors.append({'field': field + '-current-source', 'url': URL, 'reason': str(error)})
    if all(field in result for field in ('countries','sectors')) and result['countries']['asOf']==result['sectors']['asOf']:
        cash=[next(r['weightPct']for r in result[field]['rows']if r['name']=='Cash') for field in ('countries','sectors')]
        if cash[0]!=cash[1]:
            for field in ('countries','sectors'):
                result.pop(field)
                errors.append({'field':field+'-current-source','url':URL,'reason':'Same-date JPM fund allocation cash weights disagree'})
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
    # The publisher's ten largest positions can include cash. Only a dated,
    # independently reconciled full book can then establish the tenth equity.
    if any(row.get('securityType') == 'Cash' for row in top):
        equities, book_date, _ = parse_complete_book({'fundData': fund}, now)
        if book_date != stamp or len(equities) < 10:
            raise ValueError('Missing qualified JPM equity ranking after retained cash')
        rows = sorted(equities, key=lambda row: -row['weightPct'])[:10]
        return {'sourceUrl': URL, 'sha256': proof(body), 'rows': validated_rows(rows, complete=False),
                'asOf': stamp, 'basis': 'fund', 'complete': False,
                'sourceComponent': 'fundData.dailyHoldingsAll',
                'method': 'Ten largest direct equities/REITs from the reconciled same-date fund book; cash remains outside the equity ranking; original NAV weights, no renormalisation'}
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


def collect(share, now, document, fetch=download, calendar_fetch=None):
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
        identity_body = fetch(URL, max_bytes=6_000_000)
        fields = parse_live(identity_body, share, now)
        field_errors = fields.pop('collectionErrors', [])
    except Exception as error:
        if result is None:
            raise ValueError('JPM document: ' + str(document_error) + '; current API: ' + str(error)) from error
        result.setdefault('collectionErrors', []).extend(
            {'field': field + '-current-source', 'url': URL, 'reason': str(error)}
            for field in ['aum', 'holdings', 'countries', 'sectors'])
        attempts.append({'url': URL, 'status': 'failed', 'fields': ['aum', 'holdings', 'countries', 'sectors'], 'reason': str(error)})
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
        for field in ['aum', 'holdings', 'countries', 'sectors']:
            error = next((e for e in field_errors if e['field'] == field + '-current-source'), None)
            attempts.append({'url': URL, 'status': 'failed' if error else 'validated', 'fields': [field],
                             **({'reason': error['reason']} if error else {})})
        if calendar_fetch is not None and not result.get('performance'):
            from jpm_calendar import HISTORY_URL, parse as parse_calendar
            try:
                result['performance'] = parse_calendar(calendar_fetch(HISTORY_URL, max_bytes=6_000_000), identity_body, share, now)
                attempts.append({'url': HISTORY_URL, 'status': 'validated', 'fields': ['performance']})
            except Exception as error:
                result.setdefault('collectionErrors', []).append({'field': 'performance-current-source', 'url': HISTORY_URL, 'reason': str(error)})
                attempts.append({'url': HISTORY_URL, 'status': 'failed', 'fields': ['performance'], 'reason': str(error)})
    result.setdefault('sourceAttempts', []).extend(attempts)
    return result
