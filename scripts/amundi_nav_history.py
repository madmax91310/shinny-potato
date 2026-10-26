"""Exact accumulating Amundi share NAV, checked against its own calendar returns."""
import datetime as dt
import math
from issuer_nav_history import dated, calendar_checks


def request_payload(source, now):
    from collect_amundi_etf import request_payload as base
    payload = base([source], now)
    payload['characteristics'] = ['ISIN', 'CURRENCY', 'LAUNCH_DATE', 'DISTRIBUTION_POLICY']
    payload['breakDown'] = {'aggregationFields': []}
    indicators=['officialNav','countervalorisedAdjustedNAV','navCurrency']
    if source.get('anniversaryNavKind')=='official-price-excluding-distributions':indicators+=['dividendAmount','dividendCurrency']
    payload['historics'] = [{'indicator': key, 'startDate': source['periodStart'] + '-01',
                            'endDate': now.date().isoformat()}
                           for key in indicators]
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
        # Distribution fields have their own window/amount/currency qualification.
        if key in ('dividendAmount','dividendCurrency'):continue
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
    # This endpoint's adjusted indicator is a rebased performance series, not
    # a per-share price. Anchor its scale to the official NAV on the same date.
    # Ratios retain the issuer's reinvestment/split convention; the current level
    # must never show the base-100 series as the price of one share.
    anchor=max(adjusted)
    factor=nav[anchor]/adjusted[anchor]
    normalized={day:value*factor for day,value in adjusted.items()}
    normalized[anchor]=nav[anchor]
    return normalized, years, {'shareInception': inception.isoformat(),
                            'scaleProof': {'anchorDate':anchor,'officialPerShareNav':nav[anchor],
                                           'sourceAdjustedLevel':adjusted[anchor],'factor':factor,
                                           'method':'Official adjusted performance series scaled to the same-date exact-share NAV; current share units, not a raw historical quote'},
                            'controlledFields': ['ISIN','CURRENCY','LAUNCH_DATE','DISTRIBUTION_POLICY','officialNav','countervalorisedAdjustedNAV','navCurrency','shareCalendarPerformance'],
                            'controlledInstrument': source['isin'],
                            'requestedStart': source['periodStart']+'-01',
                            'controlledCalendarYears': sorted(years),
                            'incomeTreatment': 'Capitalisation',
                            'navIndicator': 'countervalorisedAdjustedNAV',
                            'historicalCurrencyIndicator': 'navCurrency',
                            'latestRawNav': max(nav), 'latestAdjustedNav': max(adjusted),
                            'officialIncomeReinvestedChartChecks': checks}

def anniversary_price_history(body,source,now,normalized_nav):
    """Remove independently qualified cash reinvestment; retain issuer unit adjustments."""
    import copy
    from qualified_distributions import amundi_events
    product=body['products'][0]
    if product['productId']!=source['isin']or product['characteristics']['ISIN']!=source['isin']:
        raise ValueError('Wrong Amundi anniversary share')
    cutoff=max(normalized_nav);start=source['periodStart']+'-01';filtered=copy.deepcopy(body);dates={};deferred=[]
    for key in ['dividendAmount','dividendCurrency']:
        fields=[h for h in filtered['products'][0]['historics']if h['indicator']==key]
        if len(fields)!=1:raise ValueError('Missing Amundi anniversary distribution field: '+key)
        keep=[]
        for row in fields[0]['historicalData']:
            stamp=row['date']
            if isinstance(stamp,bool)or not isinstance(stamp,(int,float))or not math.isfinite(stamp):raise ValueError('Invalid anniversary distribution timestamp')
            instant=dt.datetime.fromtimestamp(stamp/1000,dt.timezone.utc)
            if instant.time()!=dt.time():raise ValueError('Non-daily anniversary distribution timestamp')
            day=instant.date().isoformat()
            if day>cutoff:
                if key=='dividendAmount':deferred.append(day)
                continue
            if day<start:continue
            keep.append(row)
        fields[0]['historicalData']=keep
        dates[key]={dt.datetime.fromtimestamp(r['date']/1000,dt.timezone.utc).date().isoformat()for r in keep}
    expected={d for d in source['anniversaryCashDates']if start<=d<=cutoff}
    if not expected.issubset(dates['dividendAmount']):raise ValueError('Known historical anniversary distributions missing')
    events,proof=amundi_events({'isin':source['isin'],'currency':source['navCurrency']},filtered,
        {'dates':sorted(dates['dividendAmount'])},{'sourceUrl':'https://www.amundietf.fr/mapi/ProductAPI/getProductsData'})
    checks=proof['officialCashDateChecks']
    # Cash factors are dimensionless in the units of their actual ex-date.
    # The official adjusted series already handles splits; do not undo them.
    prices={day:value*math.prod(c['expectedIncomeFactor']for date,c in checks.items()if day<date)for day,value in normalized_nav.items()}
    return prices,{'anniversaryPriceConvention':'Exact-share NAV price excluding cash distributions, adjusted to current share units using the official reinvested series; no second cash addition',
        'anniversaryCashChecks':checks,'anniversaryExpectedCashDates':sorted(expected),
        'anniversaryDeferredCashDates':sorted(deferred),'anniversaryPriceControlledFields':['officialNav','countervalorisedAdjustedNAV','navCurrency','dividendAmount','dividendCurrency']}
