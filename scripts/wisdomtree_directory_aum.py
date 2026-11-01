"""Native-currency AUM from the issuer's publicly linked collective directory.

One response is shared only within this producer execution, including failures.
Listing-currency conversions (AUMusd), NAV and Net_Assets are never substituted.
"""
import copy
import hashlib
import json
import math
import re
import threading
import base64
import subprocess
import urllib.error
from pathlib import Path
from issuer_documents import download, document_date
from issuer_routes import ROUTES

_LOCK=threading.Lock()
_RESPONSES={}


class DirectoryAcquisitionError(ValueError):
    def __init__(self,message,attempts):
        super().__init__(message)
        self.source_attempts=copy.deepcopy(attempts)


def public_browser_directory(url):
    """One ordinary Chromium request to the same public endpoint; no cache."""
    if url!=ROUTES['wisdomtree']['fundDirectory']:
        raise ValueError('Unqualified browser directory URL')
    output=subprocess.run(['node',str(Path(__file__).with_name('download-wisdomtree-directory.mjs'))],
                          capture_output=True,check=True,timeout=55)
    if len(output.stdout)>11_000_000:
        raise ValueError('Browser directory envelope exceeds bound')
    result=json.loads(output.stdout)
    if (result.get('url')!=url or result.get('status')!=200
            or not re.fullmatch(r'application/json(?:;.*)?',str(result.get('contentType','')),re.I)):
        raise ValueError('Unqualified browser directory response')
    body=base64.b64decode(result['body'],validate=True)
    if not 0<len(body)<=8_000_000:
        raise ValueError('Browser directory body exceeds bound or is empty')
    return body


def acquire(now,fetch=download,*,browser_fetch=None,with_attempts=False):
    url=ROUTES['wisdomtree']['fundDirectory']
    browser_fetch=browser_fetch or (public_browser_directory if fetch is download else None)
    key=(now.isoformat(),fetch,url,browser_fetch)
    with _LOCK:
        if key not in _RESPONSES:
            attempts=[]
            try:
                try:
                    body=fetch(url,max_bytes=8_000_000,max_attempts=1,headers=ROUTES['wisdomtree']['fundRankingsRequestHeaders'],url_validator=lambda candidate:candidate==url)
                    attempts.append({'url':url,'transport':'http','status':'downloaded'})
                except (OSError,urllib.error.URLError,TimeoutError) as error:
                    attempts.append({'url':url,'transport':'http','status':'unavailable','reason':str(error)})
                    if browser_fetch is None:
                        raise
                    try:
                        body=browser_fetch(url)
                        attempts.append({'url':url,'transport':'ordinary-public-browser','status':'downloaded'})
                    except Exception as browser_error:
                        attempts.append({'url':url,'transport':'ordinary-public-browser','status':'unavailable','reason':str(browser_error)})
                        raise
                # Format or financial errors never trigger a second transport.
                payload=json.loads(body)
                if not isinstance(payload,list)or not payload:raise ValueError('Empty issuer collective directory')
                _RESPONSES[key]=(payload,hashlib.sha256(body).hexdigest(),None,attempts)
            except Exception as error:
                _RESPONSES[key]=(None,None,error,attempts)
        payload,digest,error,attempts=_RESPONSES[key]
    if error:raise DirectoryAcquisitionError('Public issuer directory acquisition failed: '+str(error),attempts) from error
    result=(payload,url,digest)
    return (*result,copy.deepcopy(attempts)) if with_attempts else result


def parse(payload,share,now):
    if not isinstance(payload,list)or not payload or any(not isinstance(r,dict)for r in payload):raise ValueError('Invalid issuer collective directory')
    isin=share['isin'];currency=share['currency'];expected_name=share.get('documentName')or share['name']
    if share.get('documentType')not in {'wisdomtree','wisdomtree-ucits'}or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]',str(isin))or not re.fullmatch(r'[A-Z]{3}',str(currency))or not expected_name:raise ValueError('Unqualified requested issuer instrument')
    normalize=lambda s:re.sub(r'[^a-z0-9]','',str(s).casefold())
    rows=[r for r in payload if r.get('ISIN')==isin]
    if not rows:raise ValueError('Expected exact-share AUM missing from collective directory: '+isin)
    # AUMusd on a non-native listing can be a second conversion of a value
    # already expressed in the fund currency. No average or majority selection.
    native=[r for r in rows if r.get('fundCurrency')==currency==r.get('baseCCY')==r.get('listingCCY')]
    if not native:raise ValueError('No exact-share native-currency AUM listing: '+isin)
    expected_structure='UCITS ETFs'if share['documentType']=='wisdomtree-ucits'else'ETPs'
    observations=[]
    max_age=json.loads((Path(__file__).resolve().parents[1]/'src/data/freshness-policy.json').read_text())['fields']['etf.default']['dataDays']
    for row in native:
        if (str(row.get('wtDivisionID'))!='2' or row.get('wtDivision')!='WT-Europe'
                or row.get('fundStructure')!=expected_structure
                or normalize(row.get('displayName'))!=normalize(expected_name)
                or row.get('FactsheetURL')!=share['factsheetUrl']
                or type(row.get('leverageFactor'))not in(int,float)or row['leverageFactor']!=1
                or not re.fullmatch(r'[1-9]\d*',str(row.get('wtListingID','')))
                or not row.get('bloombergTicker')):
            raise ValueError('Wrong exact-share/native-listing AUM identity: '+isin)
        amount=row.get('AUM');stamp=row.get('AUM_DateTime')
        if type(amount)not in(int,float)or not math.isfinite(amount)or amount<=0:raise ValueError('Missing or invalid publisher AUM')
        if not isinstance(stamp,str)or not re.fullmatch(r'20\d\d-\d\d-\d\dT00:00:00(?:\.0+)?Z?',stamp):raise ValueError('Missing or invalid AUM observation date')
        observations.append({'amount':amount,'currency':currency,'scope':'fund','asOf':document_date(stamp[:10],now,max_age=max_age)})
    if any(o!=observations[0]for o in observations[1:]):raise ValueError('Conflicting native listings for the same exact-share AUM')
    return {**observations[0],
            'method':'Issuer collective directory AUM, native fund/base/listing currency; no AUMusd, NAV-times-shares or Net_Assets substitution',
            'controlledListingIds':sorted(str(r['wtListingID'])for r in native),
            'nonNativeListingsExcluded':len(rows)-len(native)}


def augment_aum(result,share,now,fetch=download,*,browser_fetch=None):
    """A failed secondary route never certifies a retained value or erases a primary."""
    url=ROUTES['wisdomtree']['fundDirectory'];prior=copy.deepcopy(result.get('aum'))
    try:
        identity=result.get('characteristics',{})
        if (result.get('productId')!=share['isin'] or result.get('currency')!=share['currency']
                or not re.fullmatch(r'[a-f0-9]{64}',str(identity.get('sha256','')))
                or not identity.get('sourceUrl') or not identity.get('asOf')):
            raise ValueError('Current exact-share issuer identity proof missing before directory AUM')
        document_date(identity['asOf'],now)
        payload,url,digest,attempts=acquire(now,fetch,browser_fetch=browser_fetch,with_attempts=True)
        value=parse(payload,share,now)
        # A usable field via the second transport does not repair primary access.
        for attempt in attempts:
            if attempt['status']=='unavailable':
                result.setdefault('collectionErrors',[]).append({'field':'aum-primary-http','url':url,
                    'phase':'acquisition','reason':attempt['reason'],'qualifiedFallbackAvailable':True})
        if prior and prior.get('asOf','')>=value['asOf']:
            if prior['asOf']==value['asOf'] and any(prior.get(k)!=value.get(k)for k in ('amount','currency','scope')):
                result.pop('aum',None)
                raise ValueError('Same-date primary/directory AUM conflict; previous stored value retained without renewed control')
            result.setdefault('sourceAttempts',[]).append({'url':url,'status':'validated','fields':[],'transportAttempts':attempts,
                'deferred':[{'field':'aum','asOf':value['asOf'],'reason':'Directory observation not newer than the independently acquired primary'}]})
            return result
        result['aum']={**value,'sourceUrl':url,'sha256':digest,'identitySourceUrl':identity['sourceUrl'],
                       'identitySha256':identity['sha256'],'identityAsOf':identity['asOf']}
        result.setdefault('sourceAttempts',[]).append({'url':url,'status':'validated','fields':['aum'],'sharedCurrentResponse':True,'transportAttempts':attempts})
        result['unavailable']=[s.replace('AUM not published, previous dated value preserved','AUM independently collected from the official collective directory')for s in result.get('unavailable',[]) if s!='aum: not published in this factsheet']
    except (OSError,ValueError,TypeError,KeyError) as error:
        result.setdefault('sourceAttempts',[]).append({'url':url,'status':'unavailable','fields':['aum'],'reason':str(error),
            **({'transportAttempts':error.source_attempts}if isinstance(error,DirectoryAcquisitionError)else{})})
        result.setdefault('collectionErrors',[]).append({'field':'aum','url':url,'phase':'acquisition'if 'acquisition failed'in str(error)else'validation',
            'retainedPrimary': 'aum' in result,'reason':str(error)+('; independently acquired primary AUM retained' if 'aum' in result else '')})
    return result


if __name__=='__main__':
    # Independent source control, never an apply/publication entry point.
    import argparse
    import datetime as dt
    import gzip
    from data_automation import write_json_atomic
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser-control',required=True,type=Path)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    shares=[]
    for name in ['additional-etf-sources.json','exposure-etf-expansion.json','non-bond-expansion-sources.json']:
        config=json.loads((root/'scripts'/name).read_text())
        items=config['instruments']if isinstance(config,dict)else config
        shares.extend(r for r in items if r.get('documentType')in {'wisdomtree','wisdomtree-ucits'})
    expected=[s['isin']for s in shares]
    if not expected or len(set(expected))!=len(expected):raise ValueError('Empty or duplicate expected AUM scope')
    out=args.browser_control;out.mkdir(parents=True,exist_ok=True)
    now=dt.datetime.now(dt.timezone.utc);rows=[];digest=None
    try:
        body=public_browser_directory(ROUTES['wisdomtree']['fundDirectory'])
        digest=hashlib.sha256(body).hexdigest()
        (out/'response.json.gz').write_bytes(gzip.compress(body,mtime=0))
        payload=json.loads(body)
        for share in shares:
            try:rows.append({'isin':share['isin'],'field':'aum','status':'validated',**parse(payload,share,now)})
            except Exception as error:rows.append({'isin':share['isin'],'field':'aum','status':'failed','reason':str(error)})
    except Exception as error:
        rows=[{'isin':s,'field':'aum','status':'failed','reason':str(error)}for s in expected]
    write_json_atomic(out/'qualification.json',{'checkedAt':now.isoformat(),'sourceUrl':ROUTES['wisdomtree']['fundDirectory'],
        'sourceTransport':'ordinary-public-browser','sha256':digest,'expectedIds':expected,'rows':rows,
        'productionObservationApplied':False,'publication':'not-requested'})
    print(json.dumps({'expected':len(expected),'validated':sum(r['status']=='validated'for r in rows),'publication':'not-requested'}))
    if any(r['status']!='validated'for r in rows):raise SystemExit(1)
