"""Small standard-library primitives for free, unattended data collectors."""
import datetime as dt
import http.client
import json
import math
import os
import pathlib
import re
import time
import urllib.error
import urllib.request

UTC = dt.timezone.utc


class ResponseFormatError(ValueError):
    """Transport returned a landing/consent page instead of the requested format."""


def retry_delay(error, attempt, now=None):
    """Respect issuer throttling without letting a runner wait indefinitely."""
    from email.utils import parsedate_to_datetime
    value = (getattr(error, 'headers', None) or {}).get('Retry-After')
    try:
        seconds = float(value)
    except (TypeError, ValueError):
        try:
            seconds = (parsedate_to_datetime(value) - (now or dt.datetime.now(UTC))).total_seconds()
        except (TypeError, ValueError, OverflowError):
            seconds = 0
    return min(30, max(2 ** attempt, seconds if math.isfinite(seconds) else 0))


def get_text(url, content_types, max_bytes=2_000_000, opener=urllib.request.urlopen, sleep=time.sleep):
    """Bounded, typed downloads for SDMX XML and issuer HTML with embedded JSON."""
    request = urllib.request.Request(url, headers={
        'Accept': ', '.join(content_types), 'User-Agent': 'EpargnantLibre-DataPilot/1.0',
    })
    for attempt in range(3):
        try:
            with opener(request, timeout=20) as response:
                if response.headers.get_content_type() not in content_types:
                    raise ResponseFormatError('Unexpected response content type')
                body = response.read(max_bytes + 1)
                if len(body) > max_bytes:
                    reject('Response exceeds the size limit')
                return body.decode('utf-8-sig')
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            delay = retry_delay(error, attempt)
        except (urllib.error.URLError, TimeoutError, http.client.IncompleteRead, ConnectionError):
            if attempt == 2:
                raise
            delay = 2 ** attempt
        sleep(delay)


def get_json(url, opener=urllib.request.urlopen, sleep=time.sleep, max_attempts=3):
    """Bounded retries; a successful HTML page is never treated as market data."""
    if type(max_attempts) is not int or not 1 <= max_attempts <= 5:
        reject('JSON attempts must be an integer between 1 and 5')
    request = urllib.request.Request(url, headers={
        'Accept': 'application/json', 'User-Agent': 'EpargnantLibre-DataPilot/1.0',
    })
    for attempt in range(max_attempts):
        try:
            with opener(request, timeout=20) as response:
                body = response.read(2_000_001)
                if len(body) > 2_000_000:
                    reject('JSON response exceeds the size limit')
                # MSCI's upstream proxy sometimes returns its error document with
                # HTTP 200 and application/json. Only explicit transient error
                # pages qualify for transport retries, never market/schema errors.
                error_page = re.search(
                    rb'<title>\s*(500 Internal Server Error|502 Bad Gateway|503 Service Temporarily Unavailable|503 Service Unavailable|504 Gateway Time-out)\s*</title>',
                    body, re.I)
                if body.lstrip().lower().startswith((b'<html', b'<!doctype html')) and error_page:
                    code = int(error_page[1][:3])
                    raise urllib.error.HTTPError(url, code, 'Upstream error page returned as HTTP 200', response.headers, None)
                if response.headers.get_content_type() != 'application/json':
                    raise ValueError('Expected a JSON response')
                return json.loads(body.decode('utf-8'),
                                  parse_constant=lambda value: reject(f'Invalid JSON number: {value}'))
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == max_attempts - 1:
                raise
            delay = retry_delay(error, attempt)
        except (urllib.error.URLError, TimeoutError, http.client.IncompleteRead, ConnectionError):
            if attempt == max_attempts - 1:
                raise
            delay = 2 ** attempt
        sleep(delay)
    raise RuntimeError('Retries exhausted')


def reject(message):
    raise ValueError(message)


def number(value, positive=True):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        reject('Invalid numeric value')
    if (positive and value <= 0) or (not positive and value < 0):
        reject('Numeric value outside its valid range')
    return value


def month_shift(first, offset):
    index = first.year * 12 + first.month - 1 + offset
    return dt.datetime(index // 12, index % 12 + 1, 1, tzinfo=UTC)


def completed_month_window(now, count=6):
    if now.tzinfo is None:
        reject('UTC-aware clock required')
    now = now.astimezone(UTC)
    end = dt.datetime(now.year, now.month, 1, tzinfo=UTC)
    return month_shift(end, -count), end


def write_json_atomic(destination, data):
    """Write only after all validations succeed; preserve the previous file on failure."""
    destination = pathlib.Path(destination)
    content = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + '.tmp')
    try:
        temporary.write_text(content, encoding='utf-8')
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)
