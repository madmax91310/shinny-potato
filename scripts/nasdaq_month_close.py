"""A narrowly qualified SBUX close, never a generic quote-discard policy.

Yahoo's terminal regular-market quote can differ from its historical close.
Keep the historical daily/monthly close only when the same completed session
is independently corroborated by Nasdaq's exact common-stock identity and
historical table. No quote, price, adjustment or comparison tolerance is changed.
"""
import datetime as dt
from decimal import Decimal, InvalidOperation
import hashlib
import json
import re
import struct
from zoneinfo import ZoneInfo

POLICY = 'nasdaq-sbux-common-stock-historical-close'
INFO = 'https://api.nasdaq.com/api/quote/SBUX/info?assetclass=stocks'


def qualify(config, session, canonical, daily_close, quote, meta, fetch):
    identity = tuple(config.get(k) for k in ('id', 'symbol', 'currency', 'timezone', 'parser', 'field', 'consumerScope', 'instrumentType'))
    if identity != ('sbux', 'SBUX', 'USD', 'America/New_York', 'yahoo', 'adjclose', 'equity', 'EQUITY') or config.get('terminalCloseCorroboration') != POLICY:
        raise ValueError('Unqualified Nasdaq terminal-close policy or instrument')
    if canonical != daily_close or meta.get('priceHint') != 2 or meta.get('currency') != 'USD' or meta.get('symbol') != 'SBUX' or meta.get('exchangeName') != 'NMS':
        raise ValueError('Nasdaq corroboration requires the exact agreeing USD historical candles')
    stamp = meta.get('regularMarketTime')
    if type(stamp) is not int:
        raise ValueError('Missing terminal regular quote timestamp')
    quote_time = dt.datetime.fromtimestamp(stamp, dt.timezone.utc).astimezone(ZoneInfo('America/New_York'))
    if quote_time.date() != session or quote_time.time() not in (dt.time(13), dt.time(16)):
        raise ValueError('Terminal quote outside the completed Nasdaq closing session')

    def cents(value):
        if isinstance(value, bool):
            raise ValueError('Invalid quote amount')
        try:
            parsed = Decimal(str(value))
            if not parsed.is_finite() or parsed <= 0:
                raise ValueError('Invalid quote amount')
            return parsed.quantize(Decimal('.01'))
        except InvalidOperation as error:
            raise ValueError('Invalid quote precision') from error

    # No numerical tolerance: Yahoo publishes historical prices as binary32.
    # Accept only the exact decimal quote or its exact IEEE754 single-precision
    # representation, never an arbitrary price merely rounding to the same cent.
    def quoted_representations(value):
        number = float(value)
        return (number, struct.unpack('!f', struct.pack('!f', number))[0])

    regular = cents(meta.get('regularMarketPrice'))
    if Decimal(str(meta.get('regularMarketPrice'))) != regular or quote not in quoted_representations(regular) or cents(quote) == cents(canonical):
        raise ValueError('Terminal quote is not the independently identified conflicting regular quote')
    first = session.replace(day=1)
    following = (first.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
    last = following - dt.timedelta(days=1)
    history_url = ('https://api.nasdaq.com/api/quote/SBUX/historical?assetclass=stocks'
                   f'&fromdate={first.isoformat()}&todate={last.isoformat()}&limit=100')
    bodies = {INFO: fetch(INFO), history_url: fetch(history_url)}
    for body in bodies.values():
        if body.get('status', {}).get('rCode') != 200 or body['status'].get('bCodeMessage') or not isinstance(body.get('data'), dict):
            raise ValueError('Official Nasdaq close source unavailable or malformed')
    info, history = bodies[INFO]['data'], bodies[history_url]['data']
    if type(info.get('isNasdaqListed')) is not bool or (info.get('symbol'), info.get('companyName'), info.get('stockType'), info.get('exchange'), info.get('isNasdaqListed'), info.get('assetClass')) != (
            'SBUX', 'Starbucks Corporation Common Stock', 'Common Stock', 'NASDAQ-GS', True, 'STOCKS'):
        raise ValueError('Official Nasdaq common-stock identity changed')
    if history.get('symbol') != 'SBUX':
        raise ValueError('Wrong Nasdaq historical symbol')
    table = history.get('tradesTable') or {}
    if table.get('headers', {}).get('date') != 'Date' or table.get('headers', {}).get('close') != 'Close/Last':
        raise ValueError('Official Nasdaq historical format changed')
    rows = table.get('rows')
    if not isinstance(rows, list) or not 1 <= len(rows) <= 31 or type(history.get('totalRecords')) is not int or history.get('totalRecords') != len(rows):
        raise ValueError('Incomplete official Nasdaq historical response')
    dates = [dt.datetime.strptime(row['date'], '%m/%d/%Y').date() for row in rows]
    if dates != sorted(set(dates), reverse=True) or dates[0] != session or any(not first <= day <= session for day in dates):
        raise ValueError('Official Nasdaq closing-date coverage mismatch')
    money = rows[0].get('close', '')
    if not re.fullmatch(r'\$\d[\d,]*\.\d{2}', money):
        raise ValueError('Unqualified Nasdaq USD close format')
    official_close = Decimal(money[1:].replace(',', ''))
    if canonical not in quoted_representations(official_close):
        raise ValueError('Official Nasdaq close differs from historical daily/monthly candles')
    return {
        'kind': 'exact-stock-official-historical-close',
        'isin': 'US8552441094', 'symbol': 'SBUX', 'market': 'NASDAQ-GS', 'currency': 'USD',
        'sessionDate': session.isoformat(), 'officialClose': float(official_close),
        'canonicalHistoricalClose': canonical, 'dailyHistoricalClose': daily_close,
        'excludedRegularQuote': quote, 'publishedPriceDecimals': 2,
        'sourceUrls': list(bodies),
        'sourceHashes': {url: hashlib.sha256(json.dumps(body, sort_keys=True, separators=(',', ':')).encode()).hexdigest() for url, body in bodies.items()},
        'rawResponses': bodies,
        'method': 'Nasdaq exact common-stock identity and same-session historical USD close corroborate the agreeing Yahoo daily/monthly historical candles; the distinct regular quote is not used as a monthly candle. No retained price or adjustment changed.',
        'providerQuoteDiscrepancyExplained': False,
    }


if __name__ == '__main__':
    # Read-only supplier qualification in GitHub. The Yahoo witness is an
    # immutable actual response, Nasdaq is consulted live. This neither applies
    # observations nor certifies an ordinary/scheduled production execution.
    import argparse
    import gzip
    from pathlib import Path
    from data_automation import get_json, write_json_atomic
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-control-fixture', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    manifest = json.loads((args.source_control_fixture/'manifest.json').read_text())
    config = next(row for row in json.loads(Path(__file__).with_name('monthly-automation.json').read_text())['series'] if row['id'] == 'sbux')
    witness = gzip.decompress((args.source_control_fixture/'monthly.json.gz').read_bytes())
    if hashlib.sha256(witness).hexdigest() != manifest['responses']['monthly']['sha256']:
        raise ValueError('Archived Yahoo witness hash mismatch')
    block = json.loads(witness)['chart']['result'][0]
    canonical, quote = block['indicators']['quote'][0]['close'][-2:]
    session = dt.datetime.fromtimestamp(block['meta']['regularMarketTime'], dt.timezone.utc).astimezone(ZoneInfo('America/New_York')).date()
    result = qualify(config, session, canonical, canonical, quote, block['meta'], get_json)
    write_json_atomic(args.output, {'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
        'kind':'read-only live Nasdaq control with immutable real Yahoo witness',
        'witnessSha256':manifest['responses']['monthly']['sha256'],
        'productionObservationApplied':False, 'proof':result})
    print('Official Nasdaq historical closing source qualified; no production observation applied')
