"""Exact accumulating Amundi share NAV, checked against its own calendar returns."""
import datetime as dt
import math
from issuer_nav_history import dated, calendar_checks


def request_payload(source, now):
    from collect_amundi_etf import request_payload as base
    payload = base([source], now)
    payload['characteristics'] = ['ISIN', 'CURRENCY', 'LAUNCH_DATE', 'DISTRIBUTION_POLICY']
    payload['breakDown'] = {'aggregationFields': []}
    payload['historics'] = [{'indicator': key, 'startDate': source['periodStart'] + '-01',
                            'endDate': now.date().isoformat()}
                           for key in ['officialNav', 'countervalorisedAdjustedNAV', 'navCurrency']]
    return payload


def parse(body, source, now):
    products = body.get('products', [])
    if len(products) != 1:
        raise ValueError('Amundi NAV requires one exact share')
    product = products[0]; facts = product['characteristics']
    if product['productId'] != source['isin'] or facts['ISIN'] != source['isin']:
        raise ValueError('Wrong Amundi NAV share')
    if facts['CURRENCY'] != source['navCurrency'] or product['currencies']['CURRENCY'] != facts['CURRENCY']:
        raise ValueError('Wrong Amundi NAV currency')
    # Historical cash distributions require a separately qualified reinvestment path.
    if facts['DISTRIBUTION_POLICY'] != 'Capitalisation':
        raise ValueError('Amundi NAV requires explicitly accumulating share')
    inception = dt.date.fromisoformat(facts['LAUNCH_DATE'])
    if inception > dt.date.fromisoformat(source['periodStart'] + '-01'):
        raise ValueError('Amundi NAV requested before exact-share launch')
    series = {}
    for history in product['historics']:
        key = history['indicator']
        if key in series:
            raise ValueError('Duplicate Amundi NAV indicator')
        values = {}
        for row in history['historicalData']:
            stamp = row['date']
            if isinstance(stamp, bool) or not isinstance(stamp, (int, float)) or not math.isfinite(stamp):
                raise ValueError('Invalid Amundi NAV timestamp')
            date = dt.datetime.fromtimestamp(stamp / 1000, dt.timezone.utc)
            if date.time() != dt.time() or date.date() < inception or date.date() > now.date():
                raise ValueError('Unqualified Amundi NAV date')
            day = date.date().isoformat()
            if day in values:
                raise ValueError('Duplicate Amundi NAV date')
            values[day] = row['data']
        series[key] = values
    nav = dated(series['officialNav'].items(), now)
    adjusted = dated(series['countervalorisedAdjustedNAV'].items(), now)
    currencies = series['navCurrency']
    if any(currencies.get(day) != source['navCurrency'] for day in set(nav) | set(adjusted)):
        raise ValueError('Historical Amundi NAV currency not qualified')
    if not set(adjusted).issubset(nav):
        raise ValueError('Adjusted Amundi NAV incomplete or stale against official NAV')
    years = {}
    for metric in product['metrics']:
        year = str(metric['period']); value = metric['value']
        if metric['indicator'] != 'shareCalendarPerformance' or year in years or not year.isdigit() or not 2020 <= int(year) < now.year:
            raise ValueError('Wrong Amundi calendar metric')
        if value is None:
            continue
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not -1 < value < 10:
            raise ValueError('Invalid Amundi calendar return')
        years[year] = round(value * 100, 2)
    checks = calendar_checks(adjusted, years, 2, now)
    # Every supplied full calendar year must agree, not just a convenient example.
    expected = {int(y) for y in years if f'{int(y)-1}-12' >= source['periodStart']}
    if {c['year'] for c in checks} != expected:
        raise ValueError('Missing Amundi complete calendar-year bounds')
    return adjusted, years, {'shareInception': inception.isoformat(),
                            'controlledFields': ['ISIN','CURRENCY','LAUNCH_DATE','DISTRIBUTION_POLICY','officialNav','countervalorisedAdjustedNAV','navCurrency','shareCalendarPerformance'],
                            'controlledInstrument': source['isin'],
                            'requestedStart': source['periodStart']+'-01',
                            'controlledCalendarYears': sorted(years),
                            'incomeTreatment': 'Capitalisation',
                            'navIndicator': 'countervalorisedAdjustedNAV',
                            'historicalCurrencyIndicator': 'navCurrency',
                            'latestRawNav': max(nav), 'latestAdjustedNav': max(adjusted),
                            'officialIncomeReinvestedChartChecks': checks}
