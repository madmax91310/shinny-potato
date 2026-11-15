"""Exact JEPG calendar returns from the issuer's public historical-data service.

The UK page's ten labels map to oneYear..tenYears (not rolling durations).
YTD is a different property and is never admitted as a complete calendar year.
The existing Singapore product response qualifies identity and gross-income NAV
convention; its latest NAV must also agree with the history response.
"""
import datetime as dt
import json
import math
import re

from issuer_documents import document_date, proof, bounded_return
from jpm_holdings import ISIN, URL, qualified_fund

HISTORY_URL = ('https://am.jpmorgan.com/FundsMarketingHandler/historicalData'
               '?cusip=IE0003UVYC20&country=gb&role=per&userLoggedIn=false&language=en')
SLOTS = ['oneYear', 'twoYears', 'threeYears', 'fourYears', 'fiveYears',
         'sixYears', 'sevenYears', 'eightYears', 'nineYears', 'tenYears']
CONVENTION = ('Share class performance is shown based on the NAV (net asset value) of the share class '
              'with income (gross) reinvested including actual ongoing charges excluding any entry and exit fees.')


def parse(body, identity_body, share, now):
    if share.get('isin') != ISIN or share.get('currency') != 'USD':
        raise ValueError('Unsupported JPM calendar share/currency')
    fund = qualified_fund(json.loads(identity_body))
    disclosures = fund['aemDisclosures']['pdpBottomAll']
    text = ' '.join(re.sub(r'<[^>]*>', ' ', ' '.join(disclosures)).split())
    if CONVENTION not in text:
        raise ValueError('JPM exact-share NAV reinvestment convention changed')
    history = json.loads(body)
    if (history.get('error') or history.get('cachedForCountry') != 'gb'
            or history.get('cachedForRole') != 'per' or history.get('fundTypeCode') != 'N_ETF'):
        raise ValueError('Unexpected JPM historical-data context')
    nav = fund['shareClass']['nav']
    stamp = document_date(nav['date'], now)
    price = nav['price']
    if (nav.get('currencyCode') != 'USD' or type(price) not in (int, float)
            or not math.isfinite(price) or price <= 0):
        raise ValueError('Invalid exact-share JPM identity NAV')
    points = history['historicalNAVList']
    if not points or len({p['date'] for p in points}) != len(points):
        raise ValueError('Missing or duplicate JPM identity NAV history')
    latest = max(points, key=lambda p: p['date'])
    if (latest.get('date') != stamp or type(latest.get('navPrice')) not in (int, float)
            or latest.get('navPrice') != price or latest.get('rebasedPriceIndicator') != 'N'):
        raise ValueError('JPM history and exact-share identity NAV disagree')
    table = history['historicalCalendarYearPerformanceReturn']
    labels = table['labels']
    if (not isinstance(labels, list) or len(labels) != len(SLOTS) or any(not isinstance(y, str) or not re.fullmatch(r'20\d{2}', y) for y in labels)
            or list(map(int, labels)) != list(range(now.year - len(SLOTS), now.year))):
        raise ValueError('JPM latest complete calendar labels missing or changed; YTD is not a complete year')
    candidates = [r for r in table['performanceData'] if r.get('performanceFactor') == 'JPM - USD (dist)']
    if len(candidates) != 1:
        raise ValueError('Missing or duplicate exact-share JPM calendar row')
    row = candidates[0]
    if row.get('benchmarkIdentifier') is not None or row.get('translationKey') is not None:
        raise ValueError('Unexpected JPM calendar benchmark row')
    date = document_date(row['effectiveDate'], now)
    if date < f'{now.year - 1}-12-31':
        raise ValueError('JPM latest calendar observation predates the complete year end')
    if date > stamp:
        raise ValueError('JPM calendar observation is newer than its identity NAV')
    launch = dt.date.fromisoformat(fund['shareClass']['shareClassInceptionDate'])
    years = {}
    for year, slot in zip(labels, SLOTS):
        if launch > dt.date(int(year), 1, 1):
            continue
        value = row.get(slot)
        if type(value) not in (int, float) or not math.isfinite(value):
            raise ValueError('Missing JPM complete-year return: ' + year)
        years[year] = bounded_return(round(value * 100, 6))
    if not years:
        raise ValueError('JPM share has no complete calendar year')
    return {'currency': 'USD', 'basis': 'fund', 'years': years, 'asOf': date,
            'sourceUrl': HISTORY_URL, 'sha256': proof(body),
            'identitySourceUrl': URL, 'identitySha256': proof(identity_body),
            'identityNavAsOf': stamp,
            'sourceComponent': 'historicalCalendarYearPerformanceReturn.labels/performanceData; oneYear..tenYears; YTD excluded',
            'method': 'calendar-year exact-share NAV total return, gross income reinvested, net of ongoing charges; issuer decimal returns converted to percent, no extra distribution adjustment'}
