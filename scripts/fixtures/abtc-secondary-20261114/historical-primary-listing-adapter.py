"""Exact current ABTC listing evidence; no NAV, fees or historical inference."""
import datetime as dt
import gzip
import io
import json
import zlib

URL = 'https://api.primary.21shares.com/api/product_details/ABTC'
ISIN = 'CH0454664001'
MAX_BYTES = 8_000_000


def decode_document(body, source_url, final_url):
    if source_url != URL or final_url != URL:
        raise ValueError('Unqualified 21Shares product route or redirect')
    if not isinstance(body, bytes) or len(body) > MAX_BYTES:
        raise ValueError('21Shares document exceeds transport limit')
    if body.startswith(b'\x1f\x8b'):
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(body)) as stream:
                body = stream.read(MAX_BYTES + 1)
        except (OSError, EOFError, zlib.error) as error:
            raise ValueError('Invalid or truncated 21Shares gzip document') from error
        if len(body) > MAX_BYTES:
            raise ValueError('21Shares decoded document exceeds size limit')
    return body


def listing_rows(body, source, url, checked):
    if url != URL or source.get('isin') != ISIN:
        raise ValueError('Unqualified exact 21Shares instrument')

    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('Duplicate 21Shares JSON key: ' + key)
            result[key] = value
        return result

    doc = json.loads(body, object_pairs_hook=unique)
    if not isinstance(doc, dict):
        raise ValueError('Missing 21Shares product response object')
    product = doc.get('data')
    if (doc.get('success') is not True or not isinstance(product, dict)
            or product.get('ticker') != 'ABTC'
            or not isinstance(product.get('product_name'), str)
            or product['product_name'].casefold() != '21shares bitcoin etp'
            or not isinstance(product.get('details'), dict)
            or product['details'].get('isin') != ISIN):
        raise ValueError('Wrong or unsuccessful 21Shares exact-product response')
    try:
        published = dt.datetime.fromisoformat(doc['lastUpdated'].replace('Z', '+00:00'))
        if published.tzinfo is None or published.date() > dt.date.fromisoformat(checked):
            raise ValueError('Future or undated 21Shares response')
    except (KeyError, TypeError, AttributeError) as error:
        raise ValueError('Missing 21Shares response date') from error
    # The configured quote, not the fund's USD base currency or another venue.
    expected = source.get('listings', [])
    if len(expected) != 1 or any(expected[0].get(k) != v for k, v in {
            'ticker': 'ABTC', 'mic': 'XPAR', 'exchange': 'Euronext Paris',
            'currency': 'EUR'}.items()):
        raise ValueError('21Shares route requires the existing exact Paris EUR quote')
    exchanges = product.get('exchanges')
    if not isinstance(exchanges, list):
        raise ValueError('Missing 21Shares exchange table')
    venues = [row for row in exchanges if isinstance(row, dict)
              and row.get('exchange') == 'Euronext Paris']
    if len(venues) != 1 or not isinstance(venues[0].get('local_tickers'), list):
        raise ValueError('Missing or ambiguous 21Shares Paris venue')
    quotes = [row for row in venues[0]['local_tickers'] if isinstance(row, dict)
              and row.get('name') == 'ABTC FP' and row.get('currency') == 'EUR']
    if len(quotes) != 1:
        raise ValueError('Missing or ambiguous 21Shares exact Paris EUR quote')
    reference = expected[0]
    return [{k: reference[k] for k in ['ticker', 'mic', 'exchange', 'currency', 'symbol']
             if k in reference} | {'excerpt': ISIN + ' | Euronext Paris | ABTC FP | EUR | '
                                  'issuer response ' + doc['lastUpdated']}]
