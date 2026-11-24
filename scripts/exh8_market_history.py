"""Verify EXH8's historical quote without changing any provider values."""
import datetime as dt
import gzip
import hashlib
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
ISIN = 'DE000A0H08P6'
START, END = '2018-12-28', '2019-12-30'
MONTH_ENDS = (
    START, '2019-01-31', '2019-02-28', '2019-03-29', '2019-04-30', '2019-05-31',
    '2019-06-28', '2019-07-31', '2019-08-30', '2019-09-30', '2019-10-31', '2019-11-29', END,
)
ISSUER_PATH = 'reports/reliquat-2026-10-23/preuves/DE000A0H08P6-blackrock.json.gz'
ISSUER_SHA = '973ee284696f7b1c8a55042d00bd2b73ab2e716b6dc896b50097322b91f1130d'
ISSUER_URL = ('https://www.blackrock.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data'
              '?appSubType=ISHARES&appType=PRODUCT_PAGE&component=keyFundFacts%2Cperformance'
              '&locale=en_GB&portfolioId=251959&targetSite=ishares-uk&userType=individual'
              '&excludeContent=true&includeConfig=true')
VENUE_BOUNDARIES = 'reports/data-review-2026-10-23/preuves/bornes-cotation-2026-11-22.json'
EXPECTED_ACTION_DATES = {'2019-01-15', '2019-04-15', '2019-07-15', '2019-10-15'}


def issuer_cash():
    body = gzip.decompress((ROOT / ISSUER_PATH).read_bytes())
    if hashlib.sha256(body).hexdigest() != ISSUER_SHA:
        raise ValueError('EXH8 issuer cash evidence changed')
    components = json.loads(body)['componentsByNameMap']
    facts = components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value'] != ISIN or facts['useOfProfitsCode']['value'] != 'Distributing':
        raise ValueError('Wrong EXH8 issuer cash identity')
    table = components['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
    cash = {}
    for key, amount, currency in zip(table['exDate']['value'], table['totalDistribution']['value'],
                                     table['totalDistribution']['prefix'], strict=True):
        day = dt.datetime.strptime(str(key), '%Y%m%d').date().isoformat()
        if START < day <= END:
            if currency.strip() != 'EUR' or day in cash or not math.isfinite(float(amount)) or float(amount) <= 0:
                raise ValueError('Invalid EXH8 issuer cash amount, date or currency')
            cash[day] = float(amount)
    if set(cash) != EXPECTED_ACTION_DATES:
        raise ValueError('EXH8 issuer distribution schedule incomplete')
    return cash


def verify_adjustments(quotes, events):
    dates = sorted(quotes)
    if not dates or dates[0] != START or dates[-1] != END or len(dates) != 252:
        raise ValueError('EXH8 daily sessions incomplete')
    if set(events) != EXPECTED_ACTION_DATES or not set(events) <= quotes.keys():
        raise ValueError('EXH8 dividend sessions incomplete')
    maximum = 0
    checks = []
    for before, day in zip(dates, dates[1:]):
        close0, adjusted0 = quotes[before]
        close1, adjusted1 = quotes[day]
        if not all(math.isfinite(v) and v > 0 for v in (close0, adjusted0, close1, adjusted1)):
            raise ValueError('Invalid EXH8 daily prices')
        amount = events.get(day, 0)
        if not 0 <= amount < close0:
            raise ValueError('Invalid EXH8 cash/share units')
        observed = (adjusted1 / close1) / (adjusted0 / close0)
        expected = 1 / (1 - amount / close0)
        maximum = max(maximum, abs(observed - expected))
        # The same representation tolerance already used for cash back-adjustment.
        if not math.isclose(observed, expected, rel_tol=1e-6, abs_tol=1e-8):
            raise ValueError('EXH8 unexpected market adjustment: ' + day)
        if amount:
            checks.append({'exDate': day, 'amount': amount, 'priorSession': before,
                           'priorClose': close0, 'providerFactor': observed, 'expectedFactor': expected})
    return checks, maximum


def verify_window(config, result, daily, now):
    if (config['id'], config['isin'], config['symbol'], config['mic'], config['currency'],
            config['parser'], config['field']) != ('etfEuropeRetail', ISIN, 'EXH8.DE', 'XETR', 'EUR', 'yahoo', 'adjclose'):
        raise ValueError('EXH8 market qualification outside its reviewed listing')
    rows = [r for r in result['proofRows'] if START[:7] <= r['date'][:7] <= END[:7]]
    if tuple(r['date'] for r in rows) != MONTH_ENDS or any(r.get('monthlyClose') is None for r in rows):
        raise ValueError('EXH8 does not have all 13 reviewed raw month ends')
    if (round(rows[0]['close'], 3), round(rows[-1]['close'], 3)) != (25.95, 35.62):
        raise ValueError('EXH8 differs from its reviewed historical market boundary units')

    raw_entries = result['rawResponse']['1d']['chart']['result']
    if len(raw_entries) != 1:
        raise ValueError('EXH8 ambiguous quote capture')
    raw = raw_entries[0]
    zone = ZoneInfo(raw['meta']['exchangeTimezoneName'])
    def day(timestamp):
        return dt.datetime.fromtimestamp(timestamp, zone).date().isoformat()

    events = raw.get('events', {})
    if any(day(event['date']) > START for event in events.get('splits', {}).values()):
        raise ValueError('EXH8 later split requires a new historical cash-unit qualification')
    quote_cash = {}
    for event in events.get('dividends', {}).values():
        date = day(event['date'])
        if START < date <= END:
            if date in quote_cash:
                raise ValueError('Duplicate EXH8 quote cash event')
            quote_cash[date] = float(event['amount'])
    cash = issuer_cash()
    if quote_cash != cash:
        raise ValueError('EXH8 quote cash events disagree with official distributions')

    quotes = {date.isoformat(): (close, adjusted) for date, close, adjusted in daily
              if START <= date.isoformat() <= END}
    checks, maximum = verify_adjustments(quotes, cash)
    proof = {'year': 2019, 'isin': ISIN, 'symbol': 'EXH8.DE', 'mic': 'XETR', 'currency': 'EUR',
             'method': 'raw-market-close-cash-back-adjustment', 'checkedAt': now.date().isoformat(),
             'start': START, 'end': END, 'closedMonths': len(rows), 'dailyTransitions': len(quotes) - 1,
             'cashEvents': checks, 'maxDailyFactorError': maximum,
             'issuerSource': ISSUER_URL, 'issuerEvidence': ISSUER_PATH, 'issuerEvidenceSha256': ISSUER_SHA,
             'marketBoundaryEvidence': VENUE_BOUNDARIES,
             'marketReturnPct': (quotes[END][1] / quotes[START][1] - 1) * 100}
    result['reviewedMarketWindowEvidence'] = proof
    result['sourceUrls'] = list(dict.fromkeys([*result['sourceUrls'], ISSUER_URL]))
    result['rawResponse']['exh8IssuerEvidence'] = {'sha256': ISSUER_SHA, 'path': ISSUER_PATH}
    return result
