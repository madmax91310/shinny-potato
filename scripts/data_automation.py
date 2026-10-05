"""Small standard-library primitives for free, unattended data collectors."""
import datetime as dt
import json
import math
import os
import pathlib
import time
import urllib.error
import urllib.request

UTC = dt.timezone.utc


def get_text(url, content_types, max_bytes=2_000_000, opener=urllib.request.urlopen, sleep=time.sleep):
    """Bounded, typed downloads for SDMX XML and issuer HTML with embedded JSON."""
    request = urllib.request.Request(url, headers={
        'Accept': ', '.join(content_types), 'User-Agent': 'EpargnantLibre-DataPilot/1.0',
    })
    for attempt in range(3):
        try:
            with opener(request, timeout=20) as response:
                if response.headers.get_content_type() not in content_types:
                    reject('Unexpected response content type')
                body = response.read(max_bytes + 1)
                if len(body) > max_bytes:
                    reject('Response exceeds the size limit')
                return body.decode('utf-8-sig')
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
        sleep(2 ** attempt)


def get_json(url, opener=urllib.request.urlopen, sleep=time.sleep):
    """Bounded retries; a successful HTML page is never treated as market data."""
    request = urllib.request.Request(url, headers={
        'Accept': 'application/json', 'User-Agent': 'EpargnantLibre-DataPilot/1.0',
    })
    for attempt in range(3):
        try:
            with opener(request, timeout=20) as response:
                if response.headers.get_content_type() != 'application/json':
                    raise ValueError('Expected a JSON response')
                body = response.read(2_000_001)
                if len(body) > 2_000_000:
                    reject('JSON response exceeds the size limit')
                return json.loads(body.decode('utf-8'),
                                  parse_constant=lambda value: reject(f'Invalid JSON number: {value}'))
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
        sleep(2 ** attempt)
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
