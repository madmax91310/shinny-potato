"""BNP exact EUR accumulation share: public individual-investor API, not an index."""
import datetime as dt
import math
import re
from decimal import Decimal
from issuer_nav_history import dated, calendar_boundaries

ORIGIN = 'https://api.bnpparibas-am.com'


def endpoints(source):
    if (source.get('isin'), source.get('navCurrency'), source.get('currency'),
            source.get('shareClassId'), source.get('identityFrom'), source.get('periodStart')) != (
            'FR0011550185', 'EUR', 'EUR', 14258, '2013-09-16', '2019-12'):
        raise ValueError('Unqualified BNP share, native currency or history epoch')
    identity = ORIGIN + '/push/fundsheet/IP_FR-IND/FRE/FRA/' + source['isin']
    nav = ORIGIN + '/push-raw/navs/fast?currency=EUR&product_gids=' + source['isin'] + '&granularity=day'
    if source.get('sourceUrl') != identity:
        raise ValueError('Unqualified BNP public individual-investor endpoint')
    return identity, nav, nav.removesuffix('day') + 'month'


def parse(facts, body, monthly_body, source, now):
    endpoints(source)
    isin = source['isin']; selection = facts['fundshare_selection']; portfolio = facts['portfolio']; field = facts['nav']
    identifier = str(source['shareClassId'])
    if (facts['fundshare_id'] != identifier or selection['isin'] != isin
            or selection['codes']['ISIN'] != isin or portfolio['isin_code'] != isin
            or selection['main_code'] != {'type': 'isin', 'value': isin}
            or selection['currency'] != 'EUR' or selection['currencies'] != ['EUR']
            or portfolio['base_currency_code'] != 'EUR' or field['compartment_currency'] != 'EUR'
            or selection['share_types_codes'][identifier] != isin
            or selection['share_types'][identifier] != 'EUR C, Capitalisation'
            or field['dividend_policy'] != 'C' or portfolio['launch_date'] != source['identityFrom']):
        raise ValueError('BNP exact share, EUR currency, accumulation or launch changed')
    shares = [r for r in selection['shares'] if r['isin_code'] == isin]
    if len(shares) != 1 or shares[0]['product_id'] != identifier or shares[0]['share_type'] != 'EUR C, Capitalisation':
        raise ValueError('Ambiguous BNP share class mapping')
    if (facts['header']['legal_name'] != 'BNP PARIBAS EASY S&P 500 UCITS ETF'
            or field['calculation_detailed_frequency'] != 'Journaliere'
            or field['nav_decimalisation'] != '4. Ten-thousandth - 0.0001'):
        raise ValueError('BNP instrument or daily NAV definition changed')
    if set(body) != {isin} or not isinstance(body[isin], list):
        raise ValueError('BNP daily NAV identity/schema changed')
    rows = body[isin]
    if any(not isinstance(r, dict) or set(r) != {'date', 'value', 'type'} or r['type'] != 'PRICE_NAV' for r in rows):
        raise ValueError('BNP daily observations are not exact NAV prices')
    # The source deliberately returns unordered rows. Sort only after enforcing
    # unique real dates/positive finite prices; never silently deduplicate.
    all_nav = dated([(r['date'], r['value']) for r in rows], now)
    if any(d < source['identityFrom'] for d in all_nav):
        raise ValueError('BNP daily observation precedes exact-share launch')
    if dt.date.fromisoformat(facts['reference_date']) > now.date():
        raise ValueError('Future BNP fund snapshot')
    anchor = field['two_latest_nav']['EUR']
    if len(anchor) != 2 or any(r['currency'] != 'Euro' for r in anchor):
        raise ValueError('BNP native NAV anchor changed')
    for r in anchor:
        if r['date'] not in all_nav or not math.isclose(all_nav[r['date']], r['nav'], rel_tol=0, abs_tol=1e-8):
            raise ValueError('BNP daily NAV differs from dated exact-share anchor')
    if max(all_nav) != max(r['date'] for r in anchor) or field['nav_info']['EUR']['date'] != max(all_nav):
        raise ValueError('BNP latest observation and financial snapshot differ')
    # A pre-2019 unit discontinuity is not adjusted speculatively. Nor do we
    # use the 2019 annual calendar (its start is 28Dec rather than 31Dec2018).
    # Supply only Dec2019 onwards; older raw evidence is retained, not admitted.
    nav = {d: v for d, v in all_nav.items() if d[:7] >= source['periodStart']}
    if set(monthly_body) != {isin} or not isinstance(monthly_body[isin], list):
        raise ValueError('BNP monthly NAV identity/schema changed')
    month_rows = monthly_body[isin]
    if any(not isinstance(r, dict) or set(r) != {'date', 'value', 'type'} or r['type'] != 'PRICE_NAV' for r in month_rows):
        raise ValueError('BNP monthly observations are not exact NAV prices')
    published = dated([(r['date'], r['value']) for r in month_rows], now)
    supplied = [(d, v) for d, v in published.items() if source['periodStart'] <= d[:7] < now.strftime('%Y-%m')]
    month_ends = {d[:7]: (d, v) for d, v in supplied}
    daily_ends = {d[:7]: (d, v) for d, v in nav.items() if d[:7] < now.strftime('%Y-%m')}
    if len(month_ends) != len(supplied) or month_ends != daily_ends:
        raise ValueError('BNP daily/monthly final valuation dates or NAV disagree')
    calendar = facts['performances']['perfs']['calendar']['shares']
    selected = [r for r in calendar if r['currency'] == 'EUR']
    years = {}; precision = {}; bounds = []
    for r in selected:
        if not re.fullmatch(r'INDEXTYPE_-\d+Y', r['type']):
            raise ValueError('BNP calendar type changed')
        start = dt.date.fromisoformat(r['begin']); year = start.year + 1
        if year >= now.year or f'{year-1}-12' < source['periodStart']:
            continue
        first, last = calendar_boundaries(nav, year)
        if first != r['begin'] or str(year) in years:
            raise ValueError('BNP calendar bound differs from supplied month-end NAV')
        value = r['value']
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= -100:
            raise ValueError('Invalid BNP annual return')
        years[str(year)] = value
        precision[str(year)] = max(0, -Decimal(str(value)).as_tuple().exponent)
        if precision[str(year)] < 4:
            raise ValueError('BNP detailed calendar numeric precision changed')
        bounds.append({'year': year, 'begin': first, 'end': last, 'currency': r['currency']})
    if not years or sorted(map(int, years)) != list(range(2020, max(map(int, years)) + 1)):
        raise ValueError('BNP supplied annual qualification is incomplete')
    proof = {'controlledInstrument': isin, 'requestedStart': source['periodStart'] + '-01',
             'controlledFields': ['fundshare_id', 'fundshare_selection.ISIN', 'share_types_codes', 'EUR C, Capitalisation',
                 'portfolio.launch_date', 'nav.dividend_policy', 'nav.compartment_currency', 'nav.two_latest_nav.EUR',
                 'daily.ISIN', 'daily.date', 'daily.type:PRICE_NAV', 'daily.value',
                 'monthly.ISIN', 'monthly.date', 'monthly.type:PRICE_NAV', 'monthly.value',
                 'calendar.shares.EUR.begin', 'calendar.shares.EUR.value'],
             'controlledCalendarYears': sorted(years), 'identityFrom': source['identityFrom'],
             'nativeCurrency': 'EUR', 'incomePolicy': 'Capitalisation', 'cashAddedByApplication': False,
             'calendarBounds': bounds, 'currentNavAnchor': anchor, 'sourceReferenceDate': facts['reference_date'],
             'controlledMonthEnds': [{'date': d, 'value': v} for d, v in month_ends.values()],
             'excludedBeforeSuppliedStart': {'count': len(all_nav) - len(nav), 'before': source['periodStart'],
                 'reason': 'Older unit continuity not qualified; 2019 annual start differs from month end. No split factor fabricated.'},
             'publicProfile': 'IP_FR-IND/FRE/FRA', 'navGraphHiddenByIssuerUI': field['hide_nav_graph']}
    return nav, years, precision, proof
