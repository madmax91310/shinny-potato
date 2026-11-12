"""Qualify exact held fund shares without treating units as company exposure."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import threading
from issuer_documents import download, pdf_text, document_date
from data_automation import get_text

SOURCES = {
    'IE00BYQNZ507': {'name':'Deutsche Managed Dollar Fund','currency':'USD',
        'url':'https://download.dws.com/download?elib-assetguid=890b3c75b14d4c22be88765b92b21794'},
    'IE00BZ3FDG37': {'name':'Deutsche Managed Sterling Fund','currency':'GBP',
        'url':'https://funds.dws.com/en-IE/AssetDownload/Index?assetguid=218df76e-458a-4fda-a56e-d8e1c08bd66e'},
    'IE00BZ3FDF20': {'name':'Deutsche Managed Euro Fund','currency':'EUR',
        'url':'https://download.dws.com/download/asset/b306aceb1791490aa957609f005cbd9d'},
}
# Fund units remain securities; they are never attributed to the fund manager.
# Qualification identifies the exact held share; it does not look through its
# substitution basket or qualify an economic composition of its benchmark.
EQUITY_FUNDS = {
    'LU0514695187': {'name':'Xtrackers MSCI India Swap UCITS ETF 1C','currency':'USD',
        'replication':'Indirect Replication (Swap)',
        'url':'https://etf.dws.com/api/pdp/en-gb/etf/LU0514695187/pdpMetaTagsTealium'},
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


def parse_held_equity_fund(raw, isin, now):
    source=EQUITY_FUNDS.get(isin)
    if not source:raise ValueError('Unqualified held equity-fund identity')
    body=json.loads(raw)
    section=body['pdpResult']
    header=section['pageFrame']['productHeader']
    from collect_dws_etf import items
    fields={}
    for item in items(section['pageSections']['keyFacts']):
        key=item['key']
        if key in ('ISIN','Share class currency','Exchange traded fund / Non-exchange traded fund','Investment methodology','NAV date'):
            if key in fields:raise ValueError('Ambiguous held-fund identity field: '+key)
            fields[key]=item['value']
    if (fields.get('ISIN')!=isin or fields.get('Share class currency')!=source['currency']
            or fields.get('Exchange traded fund / Non-exchange traded fund')!='Exchange traded fund'
            or fields.get('Investment methodology')!=source['replication']
            or header['texts']['title']!=source['name']
            or [r['value']for r in header['identifier']if r['key']=='ISIN']!=[isin]):
        raise ValueError('Wrong held equity fund, share, currency or replication')
    stamp=document_date(fields['NAV date'],now)
    return {'isin':isin,'name':source['name'],'currency':source['currency'],
        'kind':'non-transparised-equity-fund','replication':source['replication'],
        'sourceUrl':source['url'],'sha256':hashlib.sha256(raw.encode()).hexdigest(),
        'asOf':stamp,'checkedAt':now.isoformat(),
        'method':'Exact issuer share identity only; economic look-through unavailable. Fund units and their original parent NAV weight remain separate from companies; no substitution-basket exposure reused.'}


def qualify_held_fund(isin, now):
    if isin in SOURCES:return qualify_liquidity_fund(isin,now)
    if isin not in EQUITY_FUNDS:raise ValueError('Fund-of-funds look-through is not qualified: '+isin)
    key=(isin,now)
    with _lock:
        if key not in _cache:
            _cache[key]=parse_held_equity_fund(get_text(EQUITY_FUNDS[isin]['url'],('application/json',),3_000_000),isin,now)
        return dict(_cache[key])
