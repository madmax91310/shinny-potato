"""TEMPORARY diagnostic: which SEC requests does a GitHub-hosted runner get refused?"""
import gzip
import json
import urllib.error
import urllib.request

URLS = [
    'https://www.sec.gov/divisions/investment/13ffaq',
    'https://www.sec.gov/rules-regulations/staff-guidance/division-investment-management-frequently-asked-questions/frequently-asked-questions-about-form-13f',
    'https://www.sec.gov/files/company_tickers.json',
    'https://data.sec.gov/submissions/CIK0000320193.json',
]
CONTACT = 'EpargnantLibre-Data madmax91310@users.noreply.github.com'
VARIANTS = {
    'contact-nohyphen': {'User-Agent': 'EpargnantLibre madmax91310@users.noreply.github.com'},
    'contact-name-words': {'User-Agent': 'Epargnant Libre Data Collection madmax91310@users.noreply.github.com'},
    'contact-plain-domain': {'User-Agent': 'EpargnantLibre admin@example.org'},
    'contact-only': {'User-Agent': CONTACT},
    'contact+gzip': {'User-Agent': CONTACT, 'Accept-Encoding': 'gzip, deflate'},
    'contact+gzip+accept': {'User-Agent': CONTACT, 'Accept-Encoding': 'gzip, deflate',
                            'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8'},
    'url-agent': {'User-Agent': 'EpargnantLibre/1.0 https://github.com/madmax91310/shinny-potato'},
    'browser': {'User-Agent': 'Mozilla/5.0 (public financial reference collection)'},
}

import os, time, urllib.request as _u
try:
    print('runner-ip', _u.urlopen('https://api.ipify.org', timeout=10).read().decode())
except Exception as e:
    print('runner-ip unknown', e)
for url in URLS:
    for name, headers in VARIANTS.items():
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as r:
                raw = r.read(400_000)
                if r.headers.get('Content-Encoding') == 'gzip':
                    raw = gzip.decompress(raw)
                print(json.dumps({'url': url[:40], 'variant': name, 'status': r.status, 'final': r.url,
                                  'bytes': len(raw), 'has13F': b'13F' in raw}))
        except urllib.error.HTTPError as e:
            body = e.read()
            if e.headers.get('Content-Encoding') == 'gzip':
                try:
                    body = gzip.decompress(body)
                except Exception:
                    pass
            import re
            title = re.search(rb'<title>(.*?)</title>', body, re.S)
            print(json.dumps({'url': url[:40], 'variant': name, 'status': e.code,
                              'title': title.group(1).decode('utf-8', 'replace') if title else body[:120].decode('utf-8', 'replace')}))
        except Exception as e:
            print(json.dumps({'url': url, 'variant': name, 'error': repr(e)[:300]}))

# Throttled IPs are released after ~10 minutes per SEC guidance; check whether a later try differs.
time.sleep(60)
for name in ('contact-only', 'browser'):
    try:
        with urllib.request.urlopen(urllib.request.Request(URLS[0], headers=VARIANTS[name]), timeout=30) as r:
            print('after-60s', name, r.status)
    except urllib.error.HTTPError as e:
        print('after-60s', name, e.code)
