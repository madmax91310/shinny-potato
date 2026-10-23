"""Published complete fund rankings; identity workbooks supply no weights."""
import datetime as dt
import hashlib
import json
import math
import re
import urllib.error
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

def rankings(page):
    chunks=[];found=[];securities=[]
    for script in BeautifulSoup(page,'html.parser').find_all('script'):
        t=script.string or ''
        if t.startswith('self.__next_f.push(')and t.endswith(')'):
            try:
                v=json.loads(t[len('self.__next_f.push('):-1])
                if len(v)==2 and v[0]==1 and isinstance(v[1],str):chunks.append(v[1])
            except (ValueError,TypeError):continue
    def visit(v):
        if isinstance(v,dict):
            if v.get('sectionKey')=='holdings'and isinstance(v.get('ranking'),list):found.append(v)
            if v.get('rankClassificationID')==1 and v.get('descriptorB'):securities.append(v)
            for x in v.values():visit(x)
        elif isinstance(v,list):
            for x in v:visit(x)
    for line in ''.join(chunks).splitlines():
        try:visit(json.loads(line.split(':',1)[1]))
        except (ValueError,IndexError):continue
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

def parse(page,share,now,mapping,identity_dates):
    from collect_public_issuer import wisdomtree
    facts=wisdomtree(page,share,now)
    if not re.search(r'Physical,?\s+Fully Replicated',BeautifulSoup(page,'html.parser').get_text(' ',strip=True),re.I):raise ValueError('Physical replication not confirmed')
    data=rankings(page);items=data['ranking']
    if len(items)<11 or len({r['descriptorB']for r in items})!=len(items):raise ValueError('Incomplete/duplicate rankings')
    stamps={document_date(r['dt'][:10],now)for r in items}
    if len(stamps)!=1 or any(r['rankClassificationID']!=1 or str(r['wtClassID'])!=str(data['entityId'])for r in items):raise ValueError('Mixed fund/date')
    stamp=stamps.pop();policy=json.loads((Path(__file__).resolve().parents[1]/'src/data/freshness-policy.json').read_text())
    if not identity_dates or any(abs((dt.date.fromisoformat(d)-dt.date.fromisoformat(stamp)).days)>policy['fields']['etf.default']['checkDays']for d in identity_dates):raise ValueError('Identity dates incompatible')
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
    if share['isin'] not in CLASSES:
        return collect_rankings(share,now)
    try:
        return api_collect(share,now)
    except IssuerApiUnavailable as error:
        primary_error=error
    # Same exact fund, public issuer SSR portfolio. Identity/date/weight gates
    # are unchanged. The caller still refuses a date older than retained data.
    try:
        result=collect_rankings(share,now)
    except Exception as error:
        raise ValueError(f'Issuer API unavailable: {primary_error}; public full portfolio unqualified: {error}') from error
    result['accessAttempts']=[{'sourceUrl':f'https://www.wisdomtree.com/api/fund-holdings/{CLASSES[share["isin"]][0]}',
        'status':'unavailable','error':str(primary_error)[:800]},
        *result.get('accessAttempts',[{'sourceUrl':result.get('sourceUrl',share['sourceUrl']),'status':'validated-public-portfolio'}])]
    return result


def collect_rankings(share,now):
    from collect_physical_holdings import observation
    from issuer_routes import wisdomtree_product_candidates
    attempts=[]
    for route in wisdomtree_product_candidates(share['sourceUrl']):
        try:
            page=public_page(route,max_bytes=12_000_000)
            share={**share,'sourceUrl':route}
            break
        except (urllib.error.URLError,TimeoutError,ConnectionError)as error:
            if isinstance(error,urllib.error.HTTPError)and error.code not in (403,408,429,500,502,503,504):raise
            attempts.append({'sourceUrl':route,'status':'unavailable','error':str(error)[:500]})
    else:raise ConnectionError('Public issuer routes unavailable: '+json.dumps(attempts))
    mapping={};dates=[];proofs={}
    for expected,url in IDENTITIES:
        raw=identity_document(url);values,stamp=identities(raw,expected,now)
        if any(k in mapping and mapping[k]!=v for k,v in values.items()):raise ValueError('Contradictory identity sources')
        mapping.update(values);dates.append(stamp);proofs[url]=hashlib.sha256(raw).hexdigest()
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
    rows,stamp=parse(page,share,now,mapping,dates)
    return observation(rows,stamp,share['sourceUrl'],page,identitySourceHashes=proofs,identityAsOfDates=dates,
      accessAttempts=[*attempts,{'sourceUrl':share['sourceUrl'],'status':'validated-public-portfolio'}],
      sourceUrls=[share['sourceUrl'],*proofs],identityMethod='Exact SEDOL to ISIN; identity-source weights never imported')
