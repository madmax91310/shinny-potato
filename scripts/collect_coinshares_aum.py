"""Dated AUM from CoinShares' public product-page widgets, not cache timestamps."""
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import urllib.error
import json
import re
from urllib.parse import urlparse
from issuer_documents import download, document_date, proof
from data_automation import number, reject

PUBLIC_API = 'https://www-api.coinshares.com/api/v2/Widgets'


def parse(payload, share, now, source_url):
    isin = share['isin']
    def widget(name):
        rows = [row for row in payload if row.get('key') == name + isin]
        if len(rows) != 1:
            reject('Missing or ambiguous CoinShares exact-share widget')
        return rows[0]
    def fields(section):
        rows = section['meta']
        if len({row['key'] for row in rows}) != len(rows):
            reject('Duplicate CoinShares data field')
        return {row['key']: row['value'] for row in rows}
    metadata = widget('ISIN_STATMETADATA_')
    identities = [fields(s) for s in metadata['sections'] if any(r['key'] == 'iSIN' for r in s['meta'])]
    if len(identities) != 1 or identities[0]['iSIN'] != isin:
        reject('Wrong CoinShares exact ISIN')
    dynamic = widget('ISIN_DYNKEYSTATISTICS_')
    sections = [s for s in dynamic['sections'] if s.get('key') == isin]
    if len(sections) != 1:
        reject('Wrong CoinShares exact-share dynamic section')
    data = fields(sections[0])
    # The website explicitly labels this field Asset under Management (US$).
    if share['currency'] != 'USD' or share.get('aumCurrency') != 'USD':
        reject('CoinShares AUM currency not qualified')
    stamp = document_date(data['Rate Date'], now, max_age=10)
    amount = number(float(data['AUM']))
    if amount <= 0:
        reject('Invalid CoinShares AUM')
    return {'amount': amount, 'currency': 'USD', 'scope': 'share-class', 'asOf': stamp,
            'sourceUrl': source_url, 'sha256': proof(json.dumps(payload, sort_keys=True).encode())}


@lru_cache(maxsize=48)
def public_script(path):
    try:
        return download('https://coinshares.com' + path, max_bytes=3_000_000).decode('utf-8')
    except (urllib.error.URLError, TimeoutError):
        return ''  # Unrelated chunks can fail; the required widget configuration must still be found.


def collect(share, now):
    page_url = share['aumPageUrl']
    parsed = urlparse(page_url)
    if parsed.scheme != 'https' or parsed.netloc != 'coinshares.com' or not parsed.path.startswith('/etp/'):
        reject('Unexpected CoinShares product page')
    text = download(page_url, max_bytes=6_000_000).decode('utf-8')
    if share['isin'] not in text or 'Asset under Management (US$)' not in text:
        reject('CoinShares USD AUM label/identity absent from public page')
    # Rediscover the site's public widget configuration each run; no private API key.
    scripts = re.findall(r'<script src="(/_next/static/[^"?]+\.js)"', text)
    paths = list(dict.fromkeys(scripts))
    if not 0 < len(paths) <= 40:
        reject('Unexpected CoinShares public script count')
    with ThreadPoolExecutor(max_workers=6) as pool:
        bodies = list(pool.map(public_script, paths))
    for script in bodies:
        if 'ISIN_DYNKEYSTATISTICS_' not in script:
            continue
        keys = set(re.findall(r'"/Widgets\?ApiKey="\)\.concat\("([A-Z0-9-]{36})"', script))
        if len(keys) != 1 or PUBLIC_API.removesuffix('/Widgets') not in script:
            reject('CoinShares public widget configuration changed')
        key = keys.pop()
        url = PUBLIC_API + '?ApiKey=' + key + '&names=ISIN_DYNKEYSTATISTICS_' + share['isin'] + ',ISIN_STATMETADATA_' + share['isin']
        return parse(json.loads(download(url)), share, now, url)
    reject('CoinShares public product widget script unavailable')
