"""Same qualified public rankings via an ordinary browser after HTTP access failure."""
import base64
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlencode,quote
from issuer_routes import ROUTES
from wisdomtree_api_holdings import CLASS_CONFIG


def qualified_url(url):
    tickers={c['fundTicker']for c in CLASS_CONFIG.values()}|{r['ticker']for c in CLASS_CONFIG.values()for r in c.get('rankingsListingAlternatives',[])}
    allowed={ROUTES['wisdomtree']['fundRankings']+'?'+urlencode({'ticker':t,'isoCode':'en-GB'},quote_via=quote)for t in tickers}
    return isinstance(url,str)and url in allowed


def public_browser_rankings(url):
    if not qualified_url(url):raise ValueError('Unqualified browser rankings URL')
    result=subprocess.run(['node',str(Path(__file__).with_name('download-wisdomtree-rankings.mjs')),url],capture_output=True,check=True,timeout=55)
    if len(result.stdout)>11_000_000:raise ValueError('Browser rankings envelope exceeds bound')
    envelope=json.loads(result.stdout)
    if envelope.get('url')!=url or envelope.get('status')!=200 or not re.fullmatch(r'application/json(?:;.*)?',str(envelope.get('contentType','')),re.I):raise ValueError('Unqualified browser rankings response')
    raw=base64.b64decode(envelope['body'],validate=True)
    if not 0<len(raw)<=8_000_000:raise ValueError('Browser rankings body outside bound')
    payload=json.loads(raw)
    if not isinstance(payload,list)or not payload:raise ValueError('Empty/modified browser rankings')
    return raw
