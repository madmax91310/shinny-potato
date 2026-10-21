"""Public access routes for one exact Yahoo chart; financial validation stays with the consumer."""
import http.client
import urllib.error
from urllib.parse import urlsplit, urlunsplit


def chart_response(url, fetch):
    parsed = urlsplit(url)
    if (parsed.scheme != 'https' or parsed.netloc != 'query2.finance.yahoo.com'
            or not parsed.path.startswith('/v8/finance/chart/') or parsed.fragment):
        raise ValueError('Unregistered market access route')
    try:
        return fetch(url), url
    except urllib.error.HTTPError as error:
        if error.code not in (403, 408, 429, 500, 502, 503, 504): raise
    except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.IncompleteRead):
        pass
    # Both official hosts serve the same chart request. Identity, daily/monthly
    # reconciliation, adjustment, currency and calendar checks are never bypassed.
    alternative = urlunsplit(parsed._replace(netloc='query1.finance.yahoo.com'))
    return fetch(alternative), alternative
