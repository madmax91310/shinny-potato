"""Documented cash-only merger rights, distinct from company shares.

These are historical reference qualifications, not fresh issuer observations.
Live holdings keep their original NAV weights, source class and observation date.
No security identifier, market price or company exposure is inferred.
"""
import copy
import datetime as dt
import math


ARCELLX = {
    'id': 'arcellx-cash-cvr-20260428',
    'issuer': 'Arcellx, Inc.',
    'effectiveDate': '2026-04-28',
    'paymentDate': '2030-03-31',
    'reviewedAt': '2026-11-12',
    'kind': 'contingent-cash-right',
    'method': 'Completed merger: former common shares converted into cash and a contractual contingent cash payment; this right is not a common share in Arcellx or Gilead.',
    'sources': [
        {'url': 'https://www.sec.gov/Archives/edgar/data/1786205/000110465926050318/tm2612746d7_8k.htm',
         'sha256': '9f44ef0df09b1111c475982d7e8b99e467bb4ee6f4b60f72e9e8c21ad848ca1d',
         'documentDate': '2026-04-28', 'cik': '1786205'},
        {'url': 'https://www.sec.gov/Archives/edgar/data/882095/000110465926049874/tm2612748d1_8k.htm',
         'sha256': 'f9656c2910fc0f51f3922849f295bcff7b46113d6a3d2aaf1b11d24b7aa9adb5',
         'documentDate': '2026-04-28', 'cik': '882095'},
    ],
}


def qualified_cash_right(position, as_of):
    """Return proof only for the exact documented unlisted USD cash right.

    A different name, identifier, currency, venue, ticker or historical period
    remains in the original unqualified equity perimeter. In particular, CVR
    is never a general exclusion rule and its value is never treated as zero.
    """
    if (position.get('name') != 'ARCELLX INC CVR'
            or position.get('isin') is not None
            or position.get('assetClass') != 'Equity'
            or position.get('currency') != 'USD'
            or position.get('exchange') != 'NO MARKET (E.G. UNLISTED)'
            or position.get('ticker') is not None
            or position.get('country') != 'United States'):
        return None
    weight = position.get('weightPct')
    if type(weight) not in (int, float) or not math.isfinite(weight) or not 0 < weight <= 100:
        return None
    stamp = dt.date.fromisoformat(as_of)
    if not dt.date.fromisoformat(ARCELLX['effectiveDate']) <= stamp <= dt.date.fromisoformat(ARCELLX['paymentDate']):
        return None  # A new qualification is required beyond the contractual payment date.
    return {'sourcePosition': copy.deepcopy(position), 'asOf': as_of,
            'qualifiedKind': ARCELLX['kind'], 'qualification': copy.deepcopy(ARCELLX)}
