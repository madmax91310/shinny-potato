"""Exact identifier crosswalks. Names propose candidates; FIGIs qualify identities."""
import datetime as dt
import hashlib
import json
import re
import unicodedata
import html
import difflib
import time
import urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'src/data/security-identifier-observations.json'
API='https://api.openfigi.com/v3/mapping'

def candidate_name(value):
    """Propose crosswalk queries only. This key is never a security identity."""
    text = ''.join(c for c in unicodedata.normalize('NFKD', html.unescape(value).upper()) if not unicodedata.combining(c))
    text = re.sub(r'\b(?:GBP|USD|EUR|GBX|JPY|SEK|NOK|CHF|CNY|KRW|HKD|IDR)\s*\d+(?:[.,]\d+)?\b', '', text)
    text = re.sub(r'\b(?:GBP|USD|EUR|GBX|JPY|SEK|NOK|CHF|CNY|KRW|HKD|IDR)\s+NPV\b|\bNPV\b', '', text)
    text = re.sub(r'\b(?:ORDINARY|ORD|COMMON)\s+(?:SHARES?|STOCK)\b', '', text)
    text = re.sub(r'\b(?:INCORPORATED|INC|CORPORATION|CORP|PLC|LIMITED|LTD|HOLDINGS|HLDGS|HLDG)\b', '', text)
    text = re.sub(r'\b(?:SPONSORED|SPON|CO|COMPANY|SA|SE|NV|AG|OYJ)\b|/NJ\b', '', text)
    text = re.sub(r'\bCLASS\b', 'CL', text)
    text = re.sub(r'\bADR\s+REPRESENTING\b', 'ADR', text)
    return re.sub('[^A-Z0-9]', '', text)

def candidate_isins(name, candidates):
    """At most three hypotheses from existing proved portfolios, never a join.

    Small spelling/abbreviation differences only trigger independent identifier
    queries. An ambiguous or wrong hypothesis cannot pass qualified().
    """
    key=candidate_name(name)
    exact=candidates.get(key,set())
    if exact:return set(exact) if len(exact)<=3 else set()
    nearby=difflib.get_close_matches(key,[k for k in candidates if k[:2]==key[:2]],n=3,cutoff=.82)
    values=set().union(*(candidates[k] for k in nearby))
    return values if len(values)<=3 else set()

def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def qualified(row,now):
    jobs=row.get('request',[]);response=row.get('response',[])
    if row.get('sourceUrl')!=API or row.get('sha256')!=digest(response):raise ValueError('Invalid identifier evidence')
    age=(now-dt.datetime.fromisoformat(row['checkedAt'])).total_seconds()/86400
    policy=json.loads((ROOT/'src/data/freshness-policy.json').read_text())
    if not 0<=age<=policy['fields']['etf.staticCharacteristic']['checkDays']:raise ValueError('Expired identifier evidence')
    if len(jobs)!=len(response)or len(jobs)<2 or jobs[0].get('idType')!='ID_SEDOL' or not re.fullmatch(r'[A-Z0-9]{7}',jobs[0].get('idValue','')):raise ValueError('Unbound SEDOL evidence')
    # Equity depositary receipts retain their own exact ISIN/FIGI; no
    # equivalence with the underlying stock is inferred (SES FDR proof in
    # reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026/).
    def identifiers(result):
        return {(r.get('figi'),r.get('shareClassFIGI'),r.get('securityType')) for r in result.get('data',[])if r.get('marketSector')=='Equity'and (r.get('securityType') in ('Common Stock','ADR','NY Reg Shrs') or (r.get('securityType')=='Receipt' and r.get('securityType2')=='Depositary Receipt'))and re.fullmatch(r'BBG[A-Z0-9]{9}',(r.get('figi')or''))and re.fullmatch(r'BBG[A-Z0-9]{9}',(r.get('shareClassFIGI')or''))}
    source=identifiers(response[0]);matches=set()
    for job,result in zip(jobs[1:],response[1:]):
        if job.get('idType')!='ID_ISIN'or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',job.get('idValue','')):raise ValueError('Invalid candidate ISIN')
        if source&identifiers(result):matches.add(job['idValue'])
    if len(matches)!=1:raise ValueError('Missing or ambiguous exact FIGI crosswalk')
    return jobs[0]['idValue'],matches.pop()

def requires_independent_identity(isin):
    return isin in json.loads((ROOT/'scripts/security-identifier-candidates.json').read_text()).get('independentPortfolioFunds',[])

def qualified_observations(now):
    """Original, independently checked identity proofs; never portfolio dates."""
    if not PATH.exists():return {}
    out={}
    for key,row in json.loads(PATH.read_text()).get('observations',{}).items():
        try:
            sedol,_=qualified(row,now)
            if sedol==key:out[key]=row
        except (ValueError,KeyError,TypeError):continue
    return out

def mappings(now):
    observations=qualified_observations(now)
    return ({key:qualified(row,now)[1]for key,row in observations.items()},
            {f'{API}#SEDOL={key}':row['sha256']for key,row in observations.items()})

def configured_candidates():
    """Seeds enable discovery, never grant identities or bypass independent queries."""
    payload=json.loads((ROOT/'scripts/security-identifier-candidates.json').read_text())
    if payload.get('schemaVersion')!=1:raise ValueError('Invalid candidate registry version')
    result={}
    for row in payload['candidates']:
        if (not re.fullmatch(r'[A-Z0-9]{7}',row.get('sedol',''))
                or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',row.get('isin',''))
                or not row.get('sourceUrls') or any(not u.startswith('https://') for u in row['sourceUrls'])):
            raise ValueError('Invalid sourced identifier candidate')
        result.setdefault(row['sedol'],set()).add(row['isin'])
    return result

def retained_identity_pairs(record,now):
    """Only current proved portfolios can avoid an independent identity renewal."""
    if not record.get('complete') or not re.fullmatch(r'[a-f0-9]{64}',record.get('sha256') or ''):return []
    try:age=(now.date()-dt.date.fromisoformat(record['asOf'])).days
    except (ValueError,TypeError,KeyError):return []
    days=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.default']['checkDays']
    if not 0<=age<=days:return []
    return [r for r in record.get('rows',[]) if re.fullmatch(r'[A-Z0-9]{7}',r.get('sedol')or'')
            and re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',r.get('isin')or'')]

def retain_identifier_proof(previous,candidate,now):
    """A failed renewal must not erase the last proved identifier or re-date it.

    An expired historical proof is retained for traceability; mappings(now)
    still excludes it under the unchanged freshness policy.
    """
    try:
        qualified(candidate,now)
        return candidate
    except (ValueError,KeyError,TypeError):
        try:
            original_check=dt.datetime.fromisoformat(previous['checkedAt'])
            if original_check>now:return candidate
            qualified(previous,original_check)
            return previous
        except (ValueError,KeyError,TypeError):return candidate


def refresh(now,max_requests=12):
    if type(max_requests) is not int or not 1 <= max_requests <= 24:
        raise ValueError('Invalid bounded identifier request budget')
    from collect_wisdomtree_holdings import IDENTITIES,identity_document,identities,rankings,known_shares,product_page,public_identity_candidates
    from wisdomtree_api_holdings import CLASS_CONFIG
    from issuer_documents import public_page
    from data_automation import write_json_atomic
    cache=json.loads(PATH.read_text())if PATH.exists()else {'schemaVersion':1,'observations':{}}
    known,_=mappings(now)
    policy=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']
    # Renew in the existing control/recovery window, before an identity expires.
    # Admission still uses the unchanged static-characteristic maximum age.
    renewal_age=max(0,policy['etf.staticCharacteristic']['checkDays']-policy['etf.default']['checkDays'])
    independent_known={key for key,row in qualified_observations(now).items()
                       if (now-dt.datetime.fromisoformat(row['checkedAt'])).total_seconds()/86400<=renewal_age}
    for fund,url in IDENTITIES:
        try:
            values,_=identities(identity_document(url),fund,now);known.update(values)
        except Exception as e:print('Identity workbook pending:',fund,str(e)[:200])
    raw=json.loads((ROOT/'src/data/dca-complete-holdings.json').read_text())
    candidates={}
    normalize=candidate_name
    for fund in raw.values():
        if not fund.get('complete')or not re.fullmatch(r'[a-f0-9]{64}',fund.get('sha256','')):continue
        for r in fund.get('rows',[]):
            if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',r.get('isin')or''):
                candidates.setdefault(normalize(r.get('name','')),set()).add(r['isin'])
        for r in retained_identity_pairs(fund,now):known[r['sedol']]=r['isin']
    seeds=configured_candidates()
    shares=known_shares()
    pending=[]
    for share in shares:
        if share.get('documentType')!='wisdomtree-ucits':continue
        try:
            # Same issuer feed and exact-share qualification as the holdings
            # producer. A blocked HTML front end cannot strand the crosswalk.
            rows=public_identity_candidates(share,now) if share['isin'] in CLASS_CONFIG else rankings(product_page(share['sourceUrl'])[0])['ranking']
            pending.extend({**r,'requiresIndependentIdentity':requires_independent_identity(share['isin'])}for r in rows)
        except Exception as e:print('Identity discovery pending:',share['isin'],str(e)[:200])
    pending.sort(key=lambda row:((cache.get('lastAttempts',{}).get(row['descriptorB'])or cache['observations'].get(row['descriptorB'],{})).get('checkedAt',''),row['descriptorB']not in seeds,-row.get('weightPct',0)))
    attempts=0;seen=set();transport_failure=None
    for r in pending:
        sedol=r['descriptorB'];values=sorted(candidate_isins(r['constituentName'],candidates) | seeds.get(sedol,set()) | ({known[sedol]} if r.get('requiresIndependentIdentity') and sedol in known else set()))
        if (sedol in independent_known if r.get('requiresIndependentIdentity') else sedol in known) or sedol in seen or not values or len(values)>3:continue
        seen.add(sedol)
        old=cache['observations'].get(sedol,{})
        last_attempt=cache.get('lastAttempts',{}).get(sedol,old)
        tested={job.get('idValue') for job in last_attempt.get('request',[])[1:]}
        if last_attempt.get('checkedAt','')[:10]==now.date().isoformat() and tested==set(values):continue
        if attempts>=max_requests:break
        jobs=[{'idType':'ID_SEDOL','idValue':sedol},*[{'idType':'ID_ISIN','idValue':v}for v in values]]
        request=urllib.request.Request(API,json.dumps(jobs).encode(),{'Content-Type':'application/json','User-Agent':'EpargnantLibre/1.0 (lepargnantlibre@gmail.com)'})
        # Public OpenFIGI mapping: remain below 25 requests per minute, including
        # the next run's independent lookup. An HTTP failure still stops the batch.
        if attempts:time.sleep(3)
        attempts+=1
        try:
            with urllib.request.urlopen(request,timeout=25)as response:result=json.load(response)
            row={'sourceUrl':API,'checkedAt':now.isoformat(),'request':jobs,'response':result,'sha256':digest(result)}
            # Persist failed identity attempts for diagnostics, never as mappings.
            try:qualified(row,now);row['status']='qualified'
            except ValueError as e:row['status']='qualification-required';row['error']=str(e)
            if r.get('candidateSourceUrl'):
                row['candidateSource']={'sourceUrl':r['candidateSourceUrl'],'asOf':r['candidateAsOf'],'shareIsin':r['candidateShareIsin']}
            cache.setdefault('lastAttempts',{})[sedol]=row
            cache['observations'][sedol]=retain_identifier_proof(old,row,now)
        except Exception as e:
            transport_failure=f'{API} SEDOL={sedol}: {e}'
            print('Identifier service failed:',transport_failure[:500]);break
    write_json_atomic(PATH,cache)
    print('Identifier crosswalk requests:',attempts,'qualified:',len(mappings(now)[0]))
    if transport_failure:raise SystemExit(1)
if __name__=='__main__':refresh(dt.datetime.now(dt.timezone.utc))
