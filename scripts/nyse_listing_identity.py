"""Exact registered NYSE ordinary-share continuity; no price or universe acquisition.

The US/CA/KY ISIN's nine-character NSIN is the existing CUSIP/CINS, not
an identifier inferred from a ticker. Other numbering systems need a separate
qualified bridge. The API does not certify currency or share-class labels:
those existing reference fields are retained only after this security match.
"""
import datetime as dt
import hashlib
import gzip
from functools import lru_cache
from pathlib import Path
import xml.etree.ElementTree as ET
import json
import re
from zoneinfo import ZoneInfo


def issuer_root(value):
    value = re.sub(r'\bClass\s+[A-Z]\b', '', value, flags=re.I)
    value = re.sub(r'\b(?:common stock|ordinary shares?)\b', '', value, flags=re.I)
    words = re.sub(r'[^A-Z0-9]+', ' ', value.upper()).split()
    while words and words[-1] in {'INC','CORPORATION','CORP','LTD','LIMITED','LLC','CO','SA'}:
        words.pop()
    # S.A. is punctuation in the legal suffix, never an issuer alias.
    if words[-2:] == ['S','A']: words = words[:-2]
    return ' '.join(words)


@lru_cache(maxsize=1)
def spotify_identifier_bridge():
    """Reviewed immutable reference, not a new SEC consultation each run."""
    path=Path(__file__).resolve().parent/'fixtures/nyse-identities-20261102'
    receipt=json.loads((path/'spotify-sec-npx.provenance.json').read_text())
    raw=gzip.decompress((path/'spotify-sec-npx.xml.gz').read_bytes())
    if hashlib.sha256(raw).hexdigest()!=receipt['sha256']:
        raise ValueError('SEC identifier reference fingerprint changed')
    ns={'i':'http://www.sec.gov/edgar/document/npxproxy/informationtable'}
    rows=[r for r in ET.fromstring(raw) if r.findtext('i:isin',namespaces=ns)==receipt['isin']]
    if not rows or any((r.findtext('i:cusip',namespaces=ns),r.findtext('i:issuerName',namespaces=ns))!=(receipt['cusip'],receipt['issuerName'])for r in rows):
        raise ValueError('SEC reference has missing or contradictory identifier records')
    return receipt


def qualify(row, isin, body, now):
    if (row.get('sourceId'),row.get('mic'),row.get('currency'),row.get('shareType'),row.get('instrumentType')) != ('us-other','XNYS','USD','ordinary','EQUITY'):
        raise ValueError('NYSE fallback outside already-qualified USD ordinary-share listing')
    bridge=None
    if re.fullmatch(r'(?:US|CA|KY)[A-Z0-9]{9}[0-9]', isin):cusip=isin[2:-1]
    elif isin=='LU1778762911' and row['ticker']=='SPOT':
        bridge=spotify_identifier_bridge();cusip=bridge['cusip']
    else:raise ValueError('Official NYSE CUSIP to registered ISIN bridge missing for '+isin)
    q = json.loads(body)['quote']
    if (q.get('exchg'),q.get('dispname'),q.get('cusip')) != ('NYSE',row['ticker'],cusip):
        raise ValueError('Exact NYSE venue, ticker or registered security identifier differs')
    for key, expected in [('currency','USD'),('micCode','XNYS'),('isin',isin),('instrumentType','COMMON_STOCK')]:
        if key in q and q[key] != expected: raise ValueError('Contradictory NYSE identity field: '+key)
    name=q.get('desc','')
    from exchange_listing_refresh import security_type
    if security_type(name) != 'ordinary' or not issuer_root(name) or issuer_root(name) != issuer_root(row['name']):
        raise ValueError('NYSE issuer or security type changed; existing proof retained')
    classes=re.findall(r'\bClass\s+([A-Z])\b',name,re.I)
    if classes and (len(set(c.upper()for c in classes)) != 1 or classes[0].upper() != row.get('shareClass')):
        raise ValueError('NYSE explicit share class contradicts registered class')
    stamp=dt.datetime.strptime(q['time'],'%A, %B %d, %Y %I:%M:%S %p ET').replace(tzinfo=ZoneInfo('America/New_York'))
    if now.tzinfo is None or stamp > now: raise ValueError('Future or unqualified NYSE timestamp')
    asof=stamp.date().isoformat()
    if asof < max(row.get('sourceAsOf',''),row.get('listingObservation',{}).get('asOf','')):
        raise ValueError('Older NYSE observation refused')
    previous=row.get('listingObservation',{})
    primary=previous.get('primaryReference',previous)
    return {'sourceName':name,'sourceUrl':'https://www.nyse.com/api/nyseservice/v1/quotes?symbol='+row['ticker'],
            'asOf':asof,'checkedAt':now.isoformat(),'sha256':hashlib.sha256(body).hexdigest(),
            'identityMethod':('SEC statutory ISIN/CUSIP bridge + current exact NYSE security, ticker and exchange'if bridge else'Exact registered ISIN NSIN = official NYSE CUSIP/CINS, ticker and exchange')+'; existing reference currency/class retained',
            **({'identifierReference':bridge}if bridge else{}),
            'registeredIsin':isin,'cusip':q['cusip'], 'primaryReference':primary}
