"""Qualify exact non-equity fund shares from their current official KIDs."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import threading
from issuer_documents import download, pdf_text, document_date

SOURCES = {
    'IE00BYQNZ507': {'name':'Deutsche Managed Dollar Fund','currency':'USD',
        'url':'https://download.dws.com/download?elib-assetguid=890b3c75b14d4c22be88765b92b21794'},
    'IE00BZ3FDF20': {'name':'Deutsche Managed Euro Fund','currency':'EUR',
        'url':'https://download.dws.com/download/asset/b306aceb1791490aa957609f005cbd9d'},
}
_cache = {}
_lock = threading.Lock()

def parse_liquidity_document(body, isin, now, text=None):
    source=SOURCES.get(isin)
    if not source:raise ValueError('Unqualified DWS fund share: '+isin)
    if not body.startswith(b'%PDF-'):raise ValueError('DWS fund qualification requires an official PDF')
    text=re.sub(r'\s+',' ',pdf_text(body) if text is None else text).strip()
    identity=rf'Share class: Z-Class, ISIN: {isin}, German Security Code: [A-Z0-9]+, Currency: {source["currency"]}'
    if source['name'] not in text or not re.search(identity,text):
        raise ValueError('Wrong DWS liquidity fund identity, class or currency')
    match=re.findall(r'accurate as at (\d{2}\.\d{2}\.\d{4})',text)
    if len(match)!=1:raise ValueError('Missing or ambiguous DWS liquidity KID date')
    policy=json.loads((Path(__file__).resolve().parents[1]/'src/data/freshness-policy.json').read_text())
    as_of=document_date(dt.datetime.strptime(match[0],'%d.%m.%Y').date().isoformat(),now,
                        max_age=policy['fields']['etf.staticCharacteristic']['dataDays'])
    lower=text.lower()
    if not all(phrase in lower for phrase in ['short term debt','money market fund','397 days','60 days']):
        raise ValueError('DWS money-market-only mandate is not confirmed')
    return {'isin':isin,'kind':'non-equity-money-market-fund','currency':source['currency'],
        'name':source['name'],'sourceUrl':source['url'],'sha256':hashlib.sha256(body).hexdigest(),
        'asOf':as_of,'checkedAt':now.isoformat(),
        'method':'Exact Z-Class KID; short-term debt and money-market mandate; not direct equity or a cash deposit'}

def qualify_liquidity_fund(isin, now):
    if isin not in SOURCES:raise ValueError('Fund-of-funds look-through is not qualified: '+isin)
    key=(isin,now)
    with _lock:
        if key not in _cache:
            _cache[key]=parse_liquidity_document(download(SOURCES[isin]['url']),isin,now)
        return dict(_cache[key])
