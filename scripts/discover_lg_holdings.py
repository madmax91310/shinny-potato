"""Discover exact-share L&G documents; creation baskets never qualify a portfolio."""
import hashlib
import json
import re
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from issuer_documents import download, public_page

API='https://fundcentres.landg.com/srp/api/fund-centre/47?audience=79&language=1'

class UnqualifiedHoldings(ValueError):
    def __init__(self, message, evidence):
        super().__init__(message)
        self.evidence=evidence

def document_link(page,share):
    states=[]
    for script in BeautifulSoup(page,'html.parser').find_all('script'):
        text=(script.string or '').strip()
        if not text.startswith('{'):continue
        try:state=json.loads(text)
        except ValueError:continue
        if isinstance(state,dict)and 'activeShareClass'in state:states.append(state)
    if len(states)!=1:raise ValueError('Missing or ambiguous L&G share state')
    state=states[0];active=state['activeShareClass']['data'];fund=state['activeFund']['data']
    if (active['data']['shareclassISIN']!=share['isin']or active['currency']!=share['currency']
            or active['parentId']!=fund['localId']or fund['data']['productType']!='ETF'):
        raise ValueError('Wrong L&G portfolio identity/currency/fund')
    parts=[p['canvas']['part']for p in state['pageSections']if p.get('key')=='portfolioBreakdown']
    if len(parts)!=1:raise ValueError('Missing or ambiguous L&G portfolio section')
    docs=parts[0]['downloads']['part']['data'].get(str(active['id']),[])
    if len(docs)!=1 or docs[0]['name']!='Download full fund holdings':raise ValueError('Exact-share holdings document missing')
    parsed=urlparse(docs[0]['url'])
    if (parsed.scheme!='https'or parsed.hostname not in ['fundcentres.landg.com','fundcentres.lgim.com']
            or parsed.username or parsed.password or parsed.query or parsed.fragment
            or not re.fullmatch(r'/srp/documents-id/[a-f0-9-]{36}/Fundholdings\.csv',parsed.path)):
        raise ValueError('Unqualified L&G holdings document URL')
    return 'https://fundcentres.landg.com'+parsed.path

def collect(share,now,fetch=download,page_fetch=public_page):
    page=page_fetch(share['pageUrl'])
    try:url=document_link(page,share)
    except ValueError as error:
        # The browser-facing route sometimes serves the generic fund explorer.
        # Retry the same official URL as a document; exact share checks still apply.
        if str(error)!='Missing or ambiguous L&G share state':raise
        page=fetch(share['pageUrl']).decode('utf-8')
        url=document_link(page,share)
    body=fetch(url)
    text=body.decode('utf-8-sig')
    evidence={'discoveredSourceUrl':url,'identitySourceUrl':share['pageUrl'],
              'identitySha256':hashlib.sha256(page.encode()).hexdigest(),'sourceSha256':hashlib.sha256(body).hexdigest()}
    if f'ETF Trading ID{share["isin"]}'not in text:raise ValueError('Wrong L&G CSV share identity')
    if ('Basket Trade Date'in text and 'Basket Client Disclaimer'in text
            and 'Cash Component is a balancing number'in text):
        evidence['documentBasis']='creation-basket'
        raise UnqualifiedHoldings('Published PCF/creation basket; issuer states ETF holdings may differ. Not qualified as the complete invested portfolio; weights and source dates are not promoted.',evidence)
    raise UnqualifiedHoldings('Changed holdings schema requires qualification before portfolio use.',evidence)

def known_shares():
    from pathlib import Path
    payload=json.loads(download(API));meta=payload['metadata'];result=[]
    configured={s['isin']:s for name in ['additional-etf-sources.json','exposure-etf-expansion.json','non-bond-expansion-sources.json']
                for s in json.loads(Path(__file__).with_name(name).read_text())['instruments'] if s.get('parser')=='lg-api'}
    for share in configured.values():
        matches=[]
        for fund in payload['funds']:
            for raw in fund['share_classes']:
                row=dict(zip([f['code_name']for f in meta['share_class_fields']],raw['data']))
                if row.get('shareclassISIN')==share['isin']:matches.append(row)
        if len(matches)!=1:raise ValueError('Ambiguous L&G catalogue identity')
        route=matches[0]['shareclassPageURL']
        if not route.startswith('/en/')or share['isin']not in route:raise ValueError('Invalid L&G share route')
        result.append({**share,'pageUrl':'https://fundcentres.landg.com'+route})
    return result
