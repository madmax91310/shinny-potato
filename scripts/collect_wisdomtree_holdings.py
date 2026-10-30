"""Published complete fund rankings; identity workbooks supply no weights."""
import datetime as dt
import hashlib
import json
import math
import re
import urllib.error
import threading
import time
from functools import lru_cache
from pathlib import Path
from bs4 import BeautifulSoup
from issuer_documents import download,document_date,public_page
from collect_ssga_etf import xlsx_rows

IDENTITIES=[(r['isin'],r['url'])for r in json.loads((Path(__file__).with_name('security-identity-sources.json')).read_text())]

def known_shares():
    shares={}
    for name in ['additional-etf-sources.json','exposure-etf-expansion.json']:
        for share in json.loads(Path(__file__).with_name(name).read_text())['instruments']:
            if share.get('documentType')=='wisdomtree-ucits':shares[share['isin']]=share
    return list(shares.values())

def flight_values(page):
    """Decode the publisher's existing server component stream, without I/O."""
    chunks=[]
    for script in BeautifulSoup(page,'html.parser').find_all('script'):
        t=script.string or ''
        if t.startswith('self.__next_f.push(')and t.endswith(')'):
            try:
                v=json.loads(t[len('self.__next_f.push('):-1])
                if len(v)==2 and v[0]==1 and isinstance(v[1],str):chunks.append(v[1])
            except (ValueError,TypeError):continue
    for line in ''.join(chunks).splitlines():
        try:yield json.loads(line.split(':',1)[1])
        except (ValueError,IndexError):continue


def rankings(page):
    found=[];securities=[]
    def visit(v):
        if isinstance(v,dict):
            if v.get('sectionKey')=='holdings'and isinstance(v.get('ranking'),list):found.append(v)
            if v.get('rankClassificationID')==1 and v.get('descriptorB'):securities.append(v)
            for x in v.values():visit(x)
        elif isinstance(v,list):
            for x in v:visit(x)
    for value in flight_values(page):visit(value)
    unique={json.dumps(v,sort_keys=True):v for v in found}
    if len(unique)!=1:raise ValueError('Missing/contradictory complete WisdomTree rankings')
    result=next(iter(unique.values()));rows={}
    for row in securities:
        if str(row.get('wtClassID'))!=str(result['entityId']):continue
        key=row['descriptorB']
        if key in rows and any(row.get(k)!=rows[key].get(k)for k in ('dt','pctWeight','constituentName')):raise ValueError('Contradictory complete security observations')
        rows[key]={**rows.get(key,{}),**row}
    result['ranking']=list(rows.values())
    return result

@lru_cache(maxsize=32)
def identity_document(url):return download(url,max_bytes=6_000_000)

def identities(raw,expected,now):
    rows=xlsx_rows(raw);meta={r[0]:r[1]for r in rows[:5]if len(r)>1};header=rows[5]
    if meta.get('ISIN:')!=expected:raise ValueError('Wrong identity workbook fund')
    stamp=document_date(meta['Holdings As Of:'].replace('-',' '),now);out={}
    for row in rows[6:]:
        if len(row)<len(header):continue
        isin,sedol=row[header.index('ISIN')],row[header.index('SEDOL')]
        # Numeric workbook cells omit leading zeroes of the seven-character ID.
        if isinstance(sedol,str)and sedol.isdigit():sedol=sedol.zfill(7)
        if not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',isin or '')or not re.fullmatch(r'[A-Z0-9]{7}',sedol or ''):continue
        if sedol in out and out[sedol]!=isin:raise ValueError('Ambiguous SEDOL')
        out[sedol]=isin
    if len(out)<20:raise ValueError('Truncated identity workbook')
    return out,stamp

def parse(page,share,now,mapping,identity_dates,*,identity_observations=None):
    from collect_public_issuer import wisdomtree
    facts=wisdomtree(page,share,now)
    if not re.search(r'Physical,?\s+Fully Replicated',BeautifulSoup(page,'html.parser').get_text(' ',strip=True),re.I):raise ValueError('Physical replication not confirmed')
    data=rankings(page);items=data['ranking']
    if len(items)<11 or len({r['descriptorB']for r in items})!=len(items):raise ValueError('Incomplete/duplicate rankings')
    stamps={document_date(r['dt'][:10],now)for r in items}
    if len(stamps)!=1 or any(r['rankClassificationID']!=1 or str(r['wtClassID'])!=str(data['entityId'])for r in items):raise ValueError('Mixed fund/date')
    stamp=stamps.pop();policy=json.loads((Path(__file__).resolve().parents[1]/'src/data/freshness-policy.json').read_text())
    independent=False
    if identity_observations is not None:
        from security_identifier_observations import qualified
        required={r['descriptorB']for r in items}
        if not required.issubset(identity_observations):raise ValueError('Incomplete independent identity evidence')
        for key in required:
            sedol,isin=qualified(identity_observations[key],now)
            if sedol!=key or mapping.get(key)!=isin:raise ValueError('Wrong independent identity mapping')
        independent=True
    if not independent and (not identity_dates or any(abs((dt.date.fromisoformat(d)-dt.date.fromisoformat(stamp)).days)>policy['fields']['etf.default']['checkDays']for d in identity_dates)):raise ValueError('Identity dates incompatible')
    weights=[r['pctWeight']for r in items]
    if any(type(w)not in (int,float)or not math.isfinite(w)or not 0<=w<=1 for w in weights):raise ValueError('Invalid weights')
    checks=[r['wgtSumCheck']for r in items if 'wgtSumCheck'in r]
    if (not checks or abs(sum(weights)-1)>0.0002
            or any(type(v)not in (int,float)or not math.isfinite(v)or abs(v-sum(weights))>0.0002 for v in checks)):
        raise ValueError('Incomplete weights')
    missing={r['descriptorB']for r in items}-mapping.keys()
    if missing:raise ValueError('Unqualified SEDOL identities: '+', '.join(sorted(missing)))
    rows=[dict(isin=mapping[r['descriptorB']],sedol=r['descriptorB'],name=r['constituentName'],weightPct=r['pctWeight']*100)for r in items]
    if any(a['name']!=b['name']or abs(a['weightPct']-b['weightPct'])>0.011 for a,b in zip(sorted(rows,key=lambda r:-r['weightPct'])[:10],facts['holdings']['rows'])):raise ValueError('Rendered/full holdings disagree')
    return rows,stamp

def collect(share,now):
    from wisdomtree_api_holdings import CLASSES, IssuerApiUnavailable, collect as api_collect
    # These two existing shares expose a newer, full precision NAV book. A
    # rounded ranking must not hide it. Only transport failure permits fallback;
    # contradictory identity/date/weight evidence still fails closed.
    api_error=None
    if share['isin'] in ('IE00BZ56SW52','IE00BKLF1R75'):
        try:return api_collect(share,now)
        except IssuerApiUnavailable as error:api_error=error
    rankings_error=''
    if share['isin'] in CLASSES:
        try:
            result=collect_public_rankings(share,now)
            if api_error:result['accessAttempts']=[{'sourceUrl':f'https://www.wisdomtree.com/api/fund-holdings/{CLASSES[share["isin"]][0]}','status':'unavailable','error':str(api_error)[:800]},*result.get('accessAttempts',[])]
            return result
        except (urllib.error.URLError,TimeoutError,ConnectionError) as error:
            rankings_error=f'Public Dataspan acquisition unavailable at {getattr(error, "url", "public issuer route")}: {error}; '
    if share['isin'] not in CLASSES:
        return collect_rankings(share,now)
    # Preserve the existing SEDOL-qualified full portfolio when it is available.
    # The public API is an independently qualified fallback for the same share,
    # not a source of identifiers inferred from rendered company names.
    if share['isin']!='IE00BJGWQN72':
        try:
            return collect_rankings(share,now)
        except ConnectionError:
            pass
        except ValueError as error:
            if not str(error).startswith(('Unqualified SEDOL identities:','Incomplete independent identity evidence')):
                raise
    try:
        return api_collect(share,now)
    except IssuerApiUnavailable as error:
        primary_error=error
    # Same exact fund, public issuer SSR portfolio. Identity/date/weight gates
    # are unchanged. The caller still refuses a date older than retained data.
    try:
        result=collect_rankings(share,now)
    except Exception as error:
        raise ValueError(f'{rankings_error}Issuer API unavailable: {primary_error}; public full portfolio unqualified: {error}') from error
    result['accessAttempts']=[{'sourceUrl':f'https://www.wisdomtree.com/api/fund-holdings/{CLASSES[share["isin"]][0]}',
        'status':'unavailable','error':str(primary_error)[:800]},
        *result.get('accessAttempts',[{'sourceUrl':result.get('sourceUrl',share['sourceUrl']),'status':'validated-public-portfolio'}])]
    return result


def product_page(url,fetch_page=None):
    """Bounded public transport only; callers still qualify the exact product."""
    from issuer_routes import wisdomtree_product_candidates
    attempts=[]
    for route in wisdomtree_product_candidates(url):
        try:
            page=(fetch_page or public_page)(route,max_bytes=12_000_000)
            return page,route,attempts
        except (urllib.error.URLError,TimeoutError,ConnectionError)as error:
            if isinstance(error,urllib.error.HTTPError)and error.code not in (403,408,429,500,502,503,504):raise
            attempts.append({'sourceUrl':route,'status':'unavailable','error':str(error)[:500]})
    raise ConnectionError('Public issuer routes unavailable: '+json.dumps(attempts))


def collect_rankings(share,now):
    from collect_physical_holdings import observation
    page,route,attempts=product_page(share['sourceUrl'])
    share={**share,'sourceUrl':route}
    from security_identifier_observations import qualified_observations,qualified,API,requires_independent_identity
    required={r['descriptorB']for r in rankings(page)['ranking']} if requires_independent_identity(share['isin']) else set()
    static=qualified_observations(now) if required else {}
    if requires_independent_identity(share['isin']) and required and required.issubset(static):
        evidence={key:static[key]for key in required}
        mapping={key:qualified(value,now)[1]for key,value in evidence.items()}
        rows,stamp=parse(page,share,now,mapping,[],identity_observations=evidence)
        proofs={f'{API}#SEDOL={key}':value['sha256']for key,value in evidence.items()}
        return observation(rows,stamp,share['sourceUrl'],page,identitySourceHashes=proofs,
          identityEvidenceRegistry='src/data/security-identifier-observations.json',
          identityCheckedAt={key:value['checkedAt']for key,value in evidence.items()},identityMethod='Exact SEDOL to ISIN; identity-source weights never imported',
          identityQualification='Independent common FIGI proofs under the existing static-identity freshness policy; portfolio date unchanged',
          sourceUrls=[share['sourceUrl'],*proofs],accessAttempts=[*attempts,{'sourceUrl':share['sourceUrl'],'status':'validated-public-portfolio'}])
    snapshot=complete_identity_mapping(now)
    mapping,dates,proofs=snapshot
    rows,stamp=parse(page,share,now,mapping,dates)
    return observation(rows,stamp,share['sourceUrl'],page,identitySourceHashes=proofs,identityAsOfDates=dates,
      accessAttempts=[*attempts,{'sourceUrl':share['sourceUrl'],'status':'validated-public-portfolio'}],
      sourceUrls=[share['sourceUrl'],*proofs],identityMethod='Exact SEDOL to ISIN; identity-source weights never imported',
      **({'identitySourceFailures':snapshot.source_failures}if getattr(snapshot,'source_failures',[])else{}))


_IDENTITY_SNAPSHOT_LOCK=threading.Lock()

class IdentitySnapshot(tuple):
    def __new__(cls, values, failures):
        result=super().__new__(cls,values)
        result.source_failures=failures
        return result

def qualified_identity_books(now):
    mapping={};dates=[];proofs={};failures=[]
    for expected,url in IDENTITIES:
        try:
            raw=identity_document(url);values,stamp=identities(raw,expected,now)
        except Exception as error:
            failures.append({'isin':expected,'sourceUrl':url,'error':str(error)[:350]})
            continue
        # Two valid but contradictory identifiers must still fail closed.
        if any(k in mapping and mapping[k]!=v for k,v in values.items()):raise ValueError('Contradictory identity sources')
        mapping.update(values);dates.append(stamp);proofs[url]=hashlib.sha256(raw).hexdigest()
    return mapping,dates,proofs,failures

def complete_identity_mapping(now):
    # lru_cache alone allows concurrent misses to repeat all issuer downloads.
    with _IDENTITY_SNAPSHOT_LOCK:return _cached_identity_mapping(now)

@lru_cache(maxsize=2)
def _cached_identity_mapping(now):
    mapping,dates,proofs,failures=qualified_identity_books(now)
    retained=json.loads((Path(__file__).resolve().parents[1]/'src/data/dca-complete-holdings.json').read_text())
    from security_identifier_observations import mappings,retained_identity_pairs
    for record in retained.values():
        pairs=retained_identity_pairs(record,now)
        if not pairs:continue
        stamp=record['asOf']
        for row in pairs:
            key,value=row['sedol'],row['isin']
            if key in mapping and mapping[key]!=value:raise ValueError('Conflicting retained identity')
            mapping[key]=value
        proofs[record['sourceUrl']]=record['sha256'];dates.append(stamp)
    crosswalk,identifier_proofs=mappings(now)
    for key,value in crosswalk.items():
        if key in mapping and mapping[key]!=value:raise ValueError('Conflicting qualified identifier crosswalk')
        mapping[key]=value
    proofs.update(identifier_proofs)
    return IdentitySnapshot((mapping,dates,proofs),failures)


def parse_public_rankings(payload,share,now,mapping,listing_ticker=None,*,require_identity=True):
    from wisdomtree_api_holdings import CLASS_CONFIG
    config=CLASS_CONFIG[share['isin']]
    expected_ticker=listing_ticker or config['fundTicker']
    if expected_ticker not in [config['fundTicker'],*[r['ticker']for r in config.get('rankingsListingAlternatives',[])]]:raise ValueError('Unqualified exact-share listing')
    if not isinstance(payload,list) or not payload:raise ValueError('Missing public issuer rankings')
    # The endpoint also publishes sectors, countries and index members. Only
    # rankClassificationID=1 / Fund is a holding. Never add those other weights.
    if any(r.get('wtID')!=config['rankingsEntityId'] or r.get('ticker')!=expected_ticker or r.get('entityName')!=config['title'] for r in payload):
        raise ValueError('Wrong exact WisdomTree rankings fund or listing')
    if any(type(r.get('rankClassificationID'))is not int for r in payload):raise ValueError('Invalid rankings classification identifier')
    selected=[r for r in payload if r.get('rankClassificationID')==1]
    if len(selected)<11 or any(r.get('rankClassification')!='Fund' for r in selected):raise ValueError('Partial or non-fund rankings')
    dates={document_date(r['dt'][:10],now)for r in selected}
    if len(dates)!=1:raise ValueError('Mixed public rankings dates')
    sedols=[r.get('additionalInfo2')for r in selected]
    if any(not re.fullmatch(r'[A-Z0-9]{7}',s or '')for s in sedols)or len(set(sedols))!=len(sedols):raise ValueError('Missing/duplicate rankings security identifiers')
    weights=[r['pct']for r in selected]
    if any(type(w)not in (float,int)or not math.isfinite(w)or not 0<=w<=1 for w in weights)or abs(sum(weights)-1)>.0002:
        raise ValueError('Incomplete public fund ranking weights')
    ranks={}
    for r in selected:
        rank=r.get('ranking')
        if type(rank)is not int or rank<1 or not r.get('name'):raise ValueError('Invalid fund ranking')
        if rank in ranks and ranks[rank]!=r['pct']:raise ValueError('Conflicting tied fund rank')
        ranks[rank]=r['pct']
    if set(ranks)!=set(range(1,max(ranks)+1))or any(a<b for a,b in zip([ranks[k]for k in sorted(ranks)],[ranks[k]for k in sorted(ranks)][1:])):
        raise ValueError('Truncated or unordered fund ranking sequence')
    rows=[{'isin':mapping.get(r['additionalInfo2']),'sedol':r['additionalInfo2'],'name':r['name'],'weightPct':r['pct']*100}for r in selected]
    if require_identity and not any(r['isin']for r in rows):raise ValueError('No independently qualified rankings identities')
    return rows,dates.pop()


_RANKINGS_LOCK=threading.Lock()
_RANKINGS_NEXT_AT=0.0
_RANKINGS_CLOCK=time.monotonic
_RANKINGS_SLEEP=time.sleep


def acquire_public_rankings(url,fetch,headers):
    """One bounded public feed, shared by concurrently collected exact shares.

    Identical requests succeeded for five funds and intermittently failed for a
    different sixth fund on GitHub. Pace the public service and back off instead
    of multiplying parallel requests or accepting different financial content.
    """
    from issuer_routes import ROUTES
    global _RANKINGS_NEXT_AT
    route=ROUTES['wisdomtree']
    interval=route['fundRankingsMinimumIntervalSeconds']
    attempts=route['fundRankingsMaximumAttempts']
    if type(interval)not in (int,float)or not 1<=interval<=10 or type(attempts)is not int or not 1<=attempts<=3:
        raise ValueError('Unbounded public rankings transport policy')
    for attempt in range(attempts):
        with _RANKINGS_LOCK:
            pause=max(0,_RANKINGS_NEXT_AT-_RANKINGS_CLOCK())
            if pause:_RANKINGS_SLEEP(pause)
            _RANKINGS_NEXT_AT=_RANKINGS_CLOCK()+interval
            try:
                # download() normally has its own retries: disable them here so
                # there is only this one bounded budget for the public feed.
                return fetch(url,max_bytes=8_000_000,headers=headers,max_attempts=1)
            except (urllib.error.URLError,TimeoutError,ConnectionError)as error:
                if isinstance(error,urllib.error.HTTPError)and error.code not in (403,408,429,500,502,503,504):raise
                if attempt==attempts-1:raise
                _RANKINGS_NEXT_AT=max(_RANKINGS_NEXT_AT,_RANKINGS_CLOCK()+interval*2**(attempt+1))


def acquire_qualified_public_rankings(share,now,fetch=download):
    from urllib.parse import urlencode,quote
    from issuer_routes import ROUTES
    from wisdomtree_api_holdings import CLASS_CONFIG,qualify_share_document
    identity=qualify_share_document(share,now,fetch)
    config=CLASS_CONFIG[share['isin']]
    route=ROUTES['wisdomtree']
    attempts=[]
    listings=[{'ticker':config['fundTicker']},*identity.get('qualifiedRankingListings',[])]
    for listing in listings:
        url=route['fundRankings']+'?'+urlencode({'ticker':listing['ticker'],'isoCode':'en-GB'},quote_via=quote)
        try:
            raw=acquire_public_rankings(url,fetch,{**route['fundRankingsRequestHeaders'],'Referer':share.get('sourceUrl','https://www.wisdomtree.com/')})
        except (urllib.error.URLError,TimeoutError,ConnectionError)as error:
            if isinstance(error,urllib.error.HTTPError)and error.code not in (403,408,429,500,502,503,504):raise
            attempts.append({'sourceUrl':url,'status':'unavailable','error':str(error)[:500]})
            continue
        break
    else:
        raise ConnectionError('Qualified exact-share public rankings unavailable: '+json.dumps(attempts))
    # Validate the entire fund/date/weight perimeter before exposing any names
    # as lookup hypotheses. This stage does not assign a security identity.
    parse_public_rankings(json.loads(raw),share,now,{},listing['ticker'],require_identity=False)
    return raw,url,identity,listing,attempts


def public_identity_candidates(share,now,fetch=download):
    raw,url,identity,listing,_=acquire_qualified_public_rankings(share,now,fetch)
    rows,stamp=parse_public_rankings(json.loads(raw),share,now,{},listing['ticker'],require_identity=False)
    return [{'descriptorB':r['sedol'],'constituentName':r['name'],'weightPct':r['weightPct'],
             'candidateSourceUrl':url,'candidateAsOf':stamp,'candidateShareIsin':share['isin']}for r in rows]


def collect_public_rankings(share,now,fetch=download):
    from collect_physical_holdings import observation
    raw,url,identity,listing,attempts=acquire_qualified_public_rankings(share,now,fetch)
    snapshot=complete_identity_mapping(now)
    mapping,dates,proofs=snapshot
    rows,stamp=parse_public_rankings(json.loads(raw),share,now,mapping,listing['ticker'])
    # Mapping dates stay distinct from portfolio dates, under the same existing
    # identity compatibility window used by the SSR collector.
    policy=json.loads((Path(__file__).resolve().parents[1]/'src/data/freshness-policy.json').read_text())
    if not dates or any(abs((dt.date.fromisoformat(d)-dt.date.fromisoformat(stamp)).days)>policy['fields']['etf.default']['checkDays']for d in dates):
        raise ValueError('Rankings identity dates incompatible')
    result=observation(rows,stamp,url,raw,allow_unidentified=True,**identity,
        identitySourceHashes=proofs,identityAsOfDates=dates,
        identityMethod='Exact SEDOL to ISIN; identity-source weights never imported',
        captureMethod='public-dataspan-fund-rankings',requestedListingTicker=listing['ticker'],
        accessAttempts=[*attempts,{'sourceUrl':url,'status':'validated-public-portfolio'}],
        sourceUrls=[url,identity['identitySourceUrl'],*proofs],
        coverageProof={'rankClassificationID':1,'rankClassification':'Fund','rowCount':len(rows),
            'publishedWeightPct':sum(r['weightPct']for r in rows),'otherRankingGroupsExcluded':True})
    result['method']='Complete issuer Fund ranking (rankClassificationID 1); original published pct weights, no renormalisation; sector/country/index groups excluded; identities independently matched by exact SEDOL; access listings are document-qualified routes for the same ISIN, no trading-currency conversion of fund weights'
    if getattr(snapshot,'source_failures',[]):result['identitySourceFailures']=snapshot.source_failures
    return result
