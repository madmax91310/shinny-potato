"""Bounded official-document downloads and deterministic text extraction (no AI)."""
import datetime as dt
import hashlib
import http.cookiejar
import pathlib
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import urllib.parse
from data_automation import UTC, reject


def download(url, max_bytes=8_000_000, headers=None):
    # Issuer region redirects set cookies; keep them within this download chain.
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    request = urllib.request.Request(url, headers={'User-Agent': 'EpargnantLibre-Data/1.0', 'Accept-Language': 'en', **(headers or {})})
    for attempt in range(3):
        try:
            with opener.open(request, timeout=25) as response:
                body = response.read(max_bytes + 1)
                if len(body) > max_bytes:
                    reject('Official document exceeds size limit')
                if url.split('?')[0].endswith('.pdf') and not body.startswith(b'%PDF-'):
                    # A public regional landing page may initialise its cookie only after
                    # the redirect chain ends. Retry the original document with that jar.
                    if (attempt < 2 and response.geturl() != url
                            and urllib.parse.urlparse(response.geturl()).netloc == urllib.parse.urlparse(url).netloc):
                        continue
                    title = re.search(br'<title[^>]*>(.*?)</title>', body, re.I | re.S)
                    label = title[1].decode('utf-8', errors='replace').strip()[:100] if title else 'non-PDF response'
                    reject(f'Expected official PDF at {url}; received {label} at {response.geturl()}')
                return body
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2 ** attempt)


def pdf_text(body, crop=None):
    if not body.startswith(b'%PDF-'):
        reject('Expected official PDF, received another document')
    with tempfile.TemporaryDirectory() as folder:
        path = pathlib.Path(folder) / 'source.pdf'
        path.write_bytes(body)
        options = [] if crop is None else ['-x', str(crop[0]), '-y', '0', '-W', str(crop[1]), '-H', '2000']
        output = subprocess.run(['pdftotext', '-layout', *options, str(path), '-'],
                                capture_output=True, timeout=20, check=True)
    if len(output.stdout) > 2_000_000:
        reject('PDF extraction exceeds size limit')
    text = output.stdout.decode('utf-8')
    if not text.strip():
        reject('PDF has no extractable text')
    return text


def document_date(value, now=None, max_age=75):
    now = now or dt.datetime.now(UTC)
    months = {m.lower(): i for i, m in enumerate(['January','February','March','April','May','June',
              'July','August','September','October','November','December'], 1)}
    months.update({k[:3]: v for k, v in list(months.items())})
    value = value.strip().replace(',', '')
    parts = value.split()
    if len(parts) == 3 and parts[1].lower() in months:
        result = dt.date(int(parts[2]), months[parts[1].lower()], int(parts[0]))
    elif len(parts) == 3 and parts[0].lower() in months:
        result = dt.date(int(parts[2]), months[parts[0].lower()], int(parts[1]))
    elif re.fullmatch(r'\d{2}/\d{2}/\d{4}', value):
        result = dt.datetime.strptime(value, '%d/%m/%Y').date()
    else:
        result = dt.date.fromisoformat(value)
    if result > now.date() or (now.date() - result).days > max_age:
        reject('Official document date is missing, future or stale')
    return result.isoformat()


def proof(body):
    return hashlib.sha256(body).hexdigest()


def bounded_return(value):
    import math
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not -100 < value < 1000:
        reject('Invalid official return')
    return round(value, 2)


def validated_rows(rows, complete=True):
    import math
    if not rows or len({r['name'] for r in rows}) != len(rows):
        reject('Empty or duplicate official composition')
    if any(not isinstance(r['name'], str) or not r['name'] or not math.isfinite(r['weightPct']) or not 0 <= r['weightPct'] <= 100 for r in rows):
        reject('Invalid official composition')
    total = sum(r['weightPct'] for r in rows)
    if complete and not 99 <= total <= 101 or not complete and not 0 < total <= 101:
        reject('Truncated official composition')
    return rows
