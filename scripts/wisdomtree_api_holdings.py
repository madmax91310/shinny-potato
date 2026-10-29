"""Public issuer holdings API; FIGIs are joined to independently proved ISINs."""
import datetime as dt
import http.client
import json
import math
import os
import re
import subprocess
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from issuer_documents import download, pdf_text, document_date, proof
from security_identifier_observations import API, digest, candidate_name, candidate_isins
from wisdomtree_identity_cache import expand_observation, compact_observation, lookup_key, recent_lookup_keys

ROOT = Path(__file__).resolve().parents[1]
# Exact share/class/listing identities corroborated by issuer pages and factsheets
# on 2026-10-29. Only existing catalogue shares; no weights come from a proxy.
CLASS_CONFIG = json.loads((ROOT/'scripts/wisdomtree-holdings-classes.json').read_text())
CLASSES = {isin:(r['classId'],r['fundTicker'],r['title']) for isin,r in CLASS_CONFIG.items()}
# Literal cash/currency account labels observed in the issuer API, with no
# security FIGI and no listing ticker. Unknown blank identities still fail.
CASH_LABELS = {'CASH W-O','KOREAN WON','HONG KONG DOLLAR','EURO INCOME A/C',
 'STERLING POUND','JAPANESE YEN','AUSTRALIAN DOLLAR','NORWEGIAN KRONE',
 'SOUTH TAIWAN DOLLAR','SWISS FRANC','CHINESE RENIMBI','CANADIAN DOLLAR',
 'SOUTH AFRICAN RAND','EURO','SWEDISH KRONA','INDONESIAN RUPIAH',
 'SINGAPORE DOLLAR','DANISH KRONE','POLISH ZLOTY','CZECHOSLOVAKIAN KORUNA'}
_MAPPING_LOCK = threading.Lock()
_LAST_MAPPING_REQUEST = 0.0


def pending_identity(observation, now):
    """Prove a publisher placeholder with two independent identifier queries.

    Its suffix is a lookup hypothesis, never an ISIN inferred from a name.
    The exact security FIGI, share class, type and published ticker must agree.
    """
    binding=observation.get('issuerPendingIdentity') or {}
    token=binding.get('identifier','')
    match=re.fullmatch(r'FIGI-PENDING-([A-Z0-9]{7}|[A-Z0-9]{9})',token)
    jobs=observation.get('request',[]);responses=observation.get('response',[])
    if not match or observation.get('sourceUrl')!=API or observation.get('sha256')!=digest(responses):
        raise ValueError('Unbound pending identifier evidence')
    days=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.staticCharacteristic']['checkDays']
    age=(now-dt.datetime.fromisoformat(observation['checkedAt'])).total_seconds()/86400
    if not 0<=age<=days:raise ValueError('Expired pending identifier evidence')
    suffix=match[1];kind=pending_namespace(suffix)
    if (len(jobs)!=len(responses) or len(jobs)<2 or jobs[0]!={'idType':kind,'idValue':suffix}
            or not binding.get('securityTicker') or not re.fullmatch(r'[a-f0-9]{64}',binding.get('sourceSha256',''))
            or binding.get('sourceUrl') not in {f'https://www.wisdomtree.com/api/fund-holdings/{v[0]}' for v in CLASSES.values()}):
        raise ValueError('Wrong publisher pending-identifier binding')
    ticker=binding['securityTicker'].split()[0]
    def exact(reply):
        return {(r.get('figi'),r.get('shareClassFIGI'),r.get('securityType')) for r in reply.get('data',[])
                if r.get('marketSector')=='Equity' and r.get('securityType') in ('Common Stock','ADR','NY Reg Shrs')
                and r.get('ticker')==ticker
                and re.fullmatch(r'BBG[A-Z0-9]{9}',r.get('figi')or'')
                and re.fullmatch(r'BBG[A-Z0-9]{9}',r.get('shareClassFIGI')or'')}
    source=exact(responses[0]);matches=set()
    for job,reply in zip(jobs[1:],responses[1:]):
        if job.get('idType')!='ID_ISIN' or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',job.get('idValue','')):
            raise ValueError('Invalid pending ISIN hypothesis')
        if source&exact(reply):matches.add(job['idValue'])
    if len(matches)!=1:raise ValueError('Missing or ambiguous pending identifier crosswalk')
    return token,matches.pop()


def pending_namespace(suffix):
    # International CINS are not US CUSIPs. Both still require an independent
    # identifier cross-query; this only selects the lookup namespace.
    return 'ID_SEDOL' if len(suffix)==7 else ('ID_CINS' if suffix[0].isalpha() else 'ID_CUSIP')


def collect_pending_proofs(payload, observations, candidates_by_name, now, url, raw, post):
    result=[];attempts=0
    fields=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']
    renewal=max(0,fields['etf.staticCharacteristic']['checkDays']-fields['etf.default']['checkDays'])
    for item in payload:
        token=item.get('figi') or ''
        if not re.fullmatch(r'FIGI-PENDING-([A-Z0-9]{7}|[A-Z0-9]{9})',token):continue
        retained=[o for o in observations if o.get('issuerPendingIdentity',{}).get('identifier')==token
                  and o['issuerPendingIdentity'].get('sourceUrl')==url
                  and o['issuerPendingIdentity'].get('securityTicker')==item.get('securityTicker')]
        if any((now-dt.datetime.fromisoformat(o['checkedAt'])).total_seconds()/86400<=renewal for o in retained):
            result.extend(retained);continue
        candidates=sorted(candidate_isins(re.sub(r'-New$','',item.get('securityName',''),flags=re.I),candidates_by_name))
        if not candidates or len(candidates)>3 or attempts>=20:
            result.extend(retained);continue
        suffix=token.removeprefix('FIGI-PENDING-')
        jobs=[{'idType':pending_namespace(suffix),'idValue':suffix},
              *[{'idType':'ID_ISIN','idValue':value}for value in candidates]]
        attempts+=1
        response=post(jobs)
        evidence={'sourceUrl':API,'checkedAt':now.isoformat(),'request':jobs,'response':response,'sha256':digest(response),
                  'issuerPendingIdentity':{'identifier':token,'securityTicker':item['securityTicker'],
                      'sourceUrl':url,'sourceSha256':proof(raw)}}
        try:pending_identity(evidence,now)
        except ValueError:
            result.extend(retained);continue  # Failed renewal never re-dates valid evidence.
        result.append(evidence)
    return result


class IssuerApiUnavailable(ConnectionError):
    """Both ordinary public transports failed; financial validation is separate."""


def mapping_request(jobs):
    # The shared producer collects several funds concurrently. Respect the public
    # crosswalk rate limit across threads, rather than per ETF.
    global _LAST_MAPPING_REQUEST
    with _MAPPING_LOCK:
        pause = 3 - (time.monotonic() - _LAST_MAPPING_REQUEST)
        if pause > 0:
            time.sleep(pause)
        _LAST_MAPPING_REQUEST = time.monotonic()
    request = urllib.request.Request(API, json.dumps(jobs).encode(), {
        'Content-Type': 'application/json', 'User-Agent': 'EpargnantLibre/1.0 (lepargnantlibre@gmail.com)'})
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.load(response)


def identity_map(observations, now):
    result, classes, listing_queries = {}, {}, []
    days = json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.staticCharacteristic']['checkDays']
    for observation in observations:
        if observation.get('sourceUrl') != API or observation.get('sha256') != digest(observation.get('response')):
            raise ValueError('Invalid FIGI mapping proof')
        age = (now - dt.datetime.fromisoformat(observation['checkedAt'])).total_seconds()/86400
        if not 0 <= age <= days:
            continue
        if observation.get('issuerPendingIdentity'):
            pending_identity(observation,now)
        jobs, responses = observation['request'], observation['response']
        if not isinstance(responses, list) or len(jobs) != len(responses):
            raise ValueError('Misaligned FIGI mapping proof')
        for job, response in zip(jobs, responses):
            if not isinstance(response,dict) or response.get('error'):
                raise ValueError('Failed independent identifier lookup; previous portfolio preserved')
            if job.get('idType') == 'ID_SEDOL' and re.fullmatch(r'[A-Z0-9]{7}',job.get('idValue','')):
                continue  # The shared registry's candidate side never assigns an ISIN.
            if observation.get('issuerPendingIdentity') and job.get('idType') in ('ID_CUSIP','ID_CINS'):
                continue
            if job.get('idType') == 'ID_BB_GLOBAL' and re.fullmatch(r'BBG[A-Z0-9]{9}', job.get('idValue', '')):
                listing_queries.append((job, response))
                continue
            if job.get('idType') != 'ID_ISIN' or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d', job.get('idValue', '')):
                raise ValueError('Unbound ISIN mapping proof')
            for row in response.get('data', []):
                figi = row.get('figi')
                if not re.fullmatch(r'BBG[A-Z0-9]{9}', figi or '') or row.get('marketSector') != 'Equity':
                    continue
                if figi in result and result[figi] != job['idValue']:
                    raise ValueError('Ambiguous FIGI identity')
                result[figi] = job['idValue']
                key = (row.get('compositeFIGI'), row.get('shareClassFIGI'))
                if all(re.fullmatch(r'BBG[A-Z0-9]{9}', value or '') for value in key):
                    classes.setdefault(key, set()).add(job['idValue'])
    # The issuer sometimes uses a venue FIGI whereas the US ISIN lookup returns
    # its composite. A separate query of that exact venue FIGI must confirm both
    # the same composite AND the same share class; a company name is insufficient.
    for job, response in listing_queries:
        matches = set()
        for row in response.get('data', []):
            if row.get('figi') == job['idValue'] and row.get('marketSector') == 'Equity':
                matches.update(classes.get((row.get('compositeFIGI'), row.get('shareClassFIGI')), set()))
        if len(matches) > 1:
            raise ValueError('Ambiguous venue FIGI identity')
        if matches:
            value = matches.pop()
            if job['idValue'] in result and result[job['idValue']] != value:
                raise ValueError('Conflicting venue FIGI identity')
            result[job['idValue']] = value
    return result


def parse(payload, share, now, mapping, *, pending_observations=()):
    class_id, ticker, _ = CLASSES[share['isin']]
    if not isinstance(payload, list) or len(payload) < 11:
        raise ValueError('Incomplete WisdomTree API portfolio')
    rows, stamps, seen, total, cash = [], set(), set(), 0, 0
    pending_map={}
    for evidence in pending_observations:
        token,isin=pending_identity(evidence,now)
        if token in pending_map and pending_map[token]!=isin:raise ValueError('Contradictory pending security identity')
        pending_map[token]=isin
    for item in payload:
        if item.get('wtClassID') != class_id or item.get('fundTicker') != ticker or item.get('assetGroup') != 'EQ':
            raise ValueError('Wrong WisdomTree API fund or asset group')
        stamps.add(document_date(item['dt'][:10], now))
        weight = item['wgt']
        is_cash = item.get('securityName') in CASH_LABELS and item.get('figi') is None and item.get('securityTicker') is None
        if type(weight) not in (int, float) or not math.isfinite(weight) or not (-1 if is_cash else 0) <= weight <= 1:
            raise ValueError('Invalid API portfolio weight')
        if any(type(item.get(k)) not in (int,float) or not math.isfinite(item[k]) or abs(item[k]-1) > .00001 for k in ['checkSumWgtEntity','checkSumWgtAssetGroup']):
            raise ValueError('Unqualified API portfolio checksum')
        total += weight
        if is_cash:
            cash += weight*100
            continue
        figi = item.get('figi')
        pending = bool(re.fullmatch(r'FIGI-PENDING-[A-Z0-9]{7,9}',figi or '') and item.get('securityTicker'))
        if not (re.fullmatch(r'BBG[A-Z0-9]{9}', figi or '') or pending) or figi in seen or not item.get('securityName'):
            raise ValueError('Missing or duplicate API security FIGI')
        seen.add(figi)
        if pending and figi in pending_map:
            bindings=[o['issuerPendingIdentity']for o in pending_observations if o['issuerPendingIdentity']['identifier']==figi]
            if not any(b['securityTicker']==item['securityTicker'] and b['sourceUrl']==f'https://www.wisdomtree.com/api/fund-holdings/{class_id}' for b in bindings):raise ValueError('Pending issuer listing changed')
        rows.append({'isin': pending_map.get(figi) if pending else mapping.get(figi), 'figi': figi, 'name': item['securityName'], 'weightPct': weight*100})
    if len(stamps) != 1 or abs(total-1) > .00001 or not any(row['isin'] for row in rows):
        raise ValueError('Incomplete/mixed-date API portfolio or missing identities')
    return rows, stamps.pop(), cash


def qualify_share_document(share,now,fetch=download):
    class_id,ticker,title=CLASSES[share['isin']]
    currency=CLASS_CONFIG[share['isin']]['currency']
    if share['currency']!=currency:raise ValueError('Wrong API share currency')
    document_url = f'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/{share["isin"]}'
    document = fetch(document_url)
    text = pdf_text(document)
    if (share['isin'] not in text or title not in ' '.join(text.split())
            or not re.search(r'Replication Method\s+Physical(?: \(fully replicated\)|,?\s+Fully Replicated)', text)
            or not re.search(r'Base Currency\s+'+currency+r'\b', text)
            or not re.search(r'\b'+re.escape(ticker.split()[0])+r'\s+'+re.escape(ticker)+r'\b', text)):
        raise ValueError('API fund identity not confirmed by official factsheet')
    limit = json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.staticCharacteristic']['checkDays']
    identity_date = document_date(re.search(r'Document Date:\s*(\d{2}/\d{2}/\d{4})', text)[1], now, max_age=limit)
    if (now.date()-dt.date.fromisoformat(identity_date)).days > limit:
        raise ValueError('Expired API fund identity document')
    # A trading-currency listing is an access route for this same exact ISIN,
    # never a different share or a currency conversion of its holdings weights.
    normalized=' '.join(text.split())
    alternatives=[]
    for listing in CLASS_CONFIG[share['isin']].get('rankingsListingAlternatives',[]):
        fields=[listing['exchange'],listing['tradingCurrency'],listing['exchangeTicker'],listing['ticker'],listing['ric'],listing['sedol'],share['isin']]
        if re.search(r'\b'+r'\s+'.join(re.escape(value) for value in fields)+r'\b',normalized):
            alternatives.append(listing)
    return {'identitySourceUrl':document_url,'identitySha256':proof(document),'identityAsOf':identity_date,
            **({'qualifiedRankingListings':alternatives} if alternatives else {})}


def collect(share, now, fetch=download, post=mapping_request):
    from collect_physical_holdings import observation
    class_id,ticker,_=CLASSES[share['isin']]
    identity=qualify_share_document(share,now,fetch)
    document_url=identity['identitySourceUrl']
    url = f'https://www.wisdomtree.com/api/fund-holdings/{class_id}'
    capture_method='public-http-json'
    try:
        raw = fetch(url, headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                                 'Accept':'application/json','Referer':share.get('sourceUrl','https://www.wisdomtree.com/')})
    except urllib.error.HTTPError as error:
        if error.code not in (403,408,429,500,502,503,504):raise
        if error.code!=403 or os.environ.get('WISDOMTREE_BROWSER_CAPTURE')!='1':
            raise IssuerApiUnavailable(f'Public issuer API unavailable: HTTP {error.code}') from error
        result=subprocess.run(['node',str(ROOT/'scripts/capture-wisdomtree-api.mjs'),url],cwd=ROOT,capture_output=True,timeout=80)
        if result.returncode:
            raise IssuerApiUnavailable('Issuer API HTTP 403; public browser also failed: '+result.stderr.decode(errors='replace')[-700:])
        raw=result.stdout
        capture_method='public-browser-json'
    except (urllib.error.URLError,TimeoutError,ConnectionError,http.client.IncompleteRead) as error:
        raise IssuerApiUnavailable('Public issuer API unavailable: '+str(error)) from error
    payload = json.loads(raw)
    previous = json.loads((ROOT/'src/data/dca-complete-holdings.json').read_text())
    observations = [expand_observation(o)for o in previous.get(share['isin'], {}).get('identityObservations', [])]
    # Reuse independently acquired exact ISIN/FIGI evidence from the ordinary
    # identifier producer. Do not re-query or re-date it, nor match by a name.
    from security_identifier_observations import qualified_observations
    registry=qualified_observations(now)
    wanted_figis={r.get('figi') for r in payload}
    shared={key:o for key,o in registry.items() if wanted_figis.intersection(identity_map([o],now))}
    observations=[*observations,*shared.values()]

    mapping = identity_map(observations, now)
    max_age = json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.staticCharacteristic']['checkDays']
    observations = [o for o in observations if 0 <= (now-dt.datetime.fromisoformat(o['checkedAt'])).total_seconds()/86400 <= max_age]
    check_days=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.default']['checkDays']
    renewal=max(0,max_age-check_days)
    recent=recent_lookup_keys(observations,now,renewal,check_days)
    current_mapping=identity_map([o for o in observations if (now-dt.datetime.fromisoformat(o['checkedAt'])).total_seconds()/86400<=renewal],now)
    already_tested = {key[1] for key in recent if key[0]=='ID_ISIN' and key[2] is None}
    candidates_by_name={}
    for fund in previous.values():
        for row in fund.get('rows',[]):
            if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',row.get('isin') or ''):
                candidates_by_name.setdefault(candidate_name(row['name']),set()).add(row['isin'])
    # Names only propose candidates. The issuer's exact listing FIGI must be in
    # the response to an independent ID_ISIN request before assigning an ISIN.
    lookup_names={}
    for evidence in observations:
        for job,reply in zip(evidence['request'],evidence['response']):
            if job.get('idType')=='ID_BB_GLOBAL':
                lookup_names[job['idValue']]=[r.get('name','')for r in reply.get('data',[])if r.get('figi')==job['idValue']]
    priority={}
    for row in payload:
        if row.get('figi') in current_mapping:continue
        for name in [row.get('securityName',''),*lookup_names.get(row.get('figi'),[])]:
            for isin in candidate_isins(re.sub(r'-New$','',name,flags=re.I),candidates_by_name)-already_tested:
                priority[isin]=max(priority.get(isin,0),row.get('wgt',0))
    candidates=sorted(priority,key=lambda isin:(-priority[isin],isin))
    # Sourced lookup seeds share the existing registry. They never assign an
    # identity: an independent query must return the exact issuer FIGI again.
    seeds=json.loads((ROOT/'scripts/security-identifier-candidates.json').read_text()).get('figiCandidates',[])
    seeded=[]
    for seed in seeds:
        if not re.fullmatch(r'BBG[A-Z0-9]{9}',seed.get('figi','')) or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',seed.get('isin','')) or not seed.get('sourceUrls'):
            raise ValueError('Invalid FIGI lookup candidate registry')
        if seed['figi'] in wanted_figis and seed['figi']not in current_mapping and seed['isin']not in already_tested:seeded.append(seed['isin'])
    candidates=list(dict.fromkeys([*seeded,*candidates]))
    for start in range(0, min(len(candidates), 80), 10):
        # Share currency is not the underlying listing country. Query exact
        # ISINs globally; only the returned exact FIGI/share class can join.
        jobs = [{'idType':'ID_ISIN', 'idValue': value} for value in candidates[start:start+10]]
        response = post(jobs)
        evidence = {'sourceUrl': API, 'checkedAt': now.isoformat(), 'request': jobs,
                    'response': response, 'sha256': digest(response)}
        identity_map([evidence], now)
        observations = [*observations, evidence]
    mapping = identity_map(observations, now)
    queried_figis = {key[1]for key in recent if key[0]=='ID_BB_GLOBAL'}
    missing_figis = sorted({r['figi'] for r in payload if re.fullmatch(r'BBG[A-Z0-9]{9}',r.get('figi')or'') and r['figi'] not in current_mapping and r['figi'] not in queried_figis})
    for start in range(0, min(len(missing_figis),80),10):
        jobs = [{'idType':'ID_BB_GLOBAL','idValue':value} for value in missing_figis[start:start+10]]
        response = post(jobs)
        evidence = {'sourceUrl':API,'checkedAt':now.isoformat(),'request':jobs,'response':response,'sha256':digest(response)}
        observations = [*observations,evidence]
    mapping = identity_map(observations, now)
    unresolved_names = {candidate_name(r.get('securityName','')) for r in payload if r.get('figi') not in mapping}
    unrestricted_tested = {job['idValue'] for o in observations for job in o['request'] if job['idType']=='ID_ISIN' and not job.get('exchCode')}
    unrestricted = sorted({r['isin'] for fund in previous.values() for r in fund.get('rows',[])
                           if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',r.get('isin')or'')
                           and r['isin'] not in unrestricted_tested
                           and candidate_name(r['name']) in unresolved_names})
    for start in range(0,min(len(unrestricted),20),10):
        jobs=[{'idType':'ID_ISIN','idValue':value} for value in unrestricted[start:start+10]]
        response=post(jobs)
        observations=[*observations,{'sourceUrl':API,'checkedAt':now.isoformat(),'request':jobs,'response':response,'sha256':digest(response)}]
    mapping = identity_map(observations, now)
    # A global query can omit a smaller venue. A matching share class only
    # proposes another ISIN query, restricted to that observed venue. Assignment
    # still requires the response to contain the issuer's exact security FIGI.
    hypotheses={}
    for evidence in observations:
        for job,reply in zip(evidence['request'],evidence['response']):
            if job.get('idType')=='ID_ISIN':
                for r in reply.get('data',[]):
                    if re.fullmatch(r'BBG[A-Z0-9]{9}',r.get('shareClassFIGI')or''):
                        hypotheses.setdefault(r['shareClassFIGI'],set()).add(job['idValue'])
    tested=recent_lookup_keys(observations,now,renewal,check_days)
    targeted=set()
    for evidence in observations:
        for job,reply in zip(evidence['request'],evidence['response']):
            if job.get('idType')!='ID_BB_GLOBAL' or job['idValue'] in current_mapping:continue
            for r in reply.get('data',[]):
                if r.get('figi')!=job['idValue'] or not re.fullmatch(r'[A-Z0-9]{2}',r.get('exchCode')or''):continue
                for isin in hypotheses.get(r.get('shareClassFIGI'),[]):
                    if lookup_key({'idType':'ID_ISIN','idValue':isin,'exchCode':r['exchCode'],'includeUnlistedEquities':True})not in tested:targeted.add((isin,r['exchCode']))
    for start in range(0,min(len(targeted),20),10):
        jobs=[{'idType':'ID_ISIN','idValue':isin,'exchCode':venue,'includeUnlistedEquities':True}for isin,venue in sorted(targeted)[start:start+10]]
        response=post(jobs)
        evidence={'sourceUrl':API,'checkedAt':now.isoformat(),'request':jobs,'response':response,'sha256':digest(response)}
        identity_map([evidence],now)
        observations.append(evidence)
    mapping = identity_map(observations, now)
    pending=collect_pending_proofs(payload,observations,candidates_by_name,now,url,raw,post)
    observations=[o for o in observations if not o.get('issuerPendingIdentity')]+pending
    rows, stamp, cash = parse(payload, share, now, mapping,pending_observations=pending)
    from holdings_reconciliation import reconcile_positions
    positions=[{'name':r['name'],'isin':r['isin'],'weightPct':r['weightPct'],'assetClass':'Equity'}for r in rows]
    positions.extend({'name':r['securityName'],'weightPct':r['wgt']*100,'assetClass':'Cash'}for r in payload
                     if r.get('figi') is None and r.get('securityTicker') is None and r.get('securityName') in CASH_LABELS)
    reconciliation=reconcile_positions(positions,list(range(len(rows))),stamp)
    return observation(rows, stamp, url, raw, allow_unidentified=True,
                       navReconciliation=reconciliation,
                       subjectIsin=share['isin'],scope='complete-equity-sleeve-with-published-cash',
                       captureMethod=capture_method,
                       excludedWeightPctByType={'Cash': cash}, identityObservations=[compact_observation(o) for o in observations if o not in shared.values()],
                       identityEvidenceRegistry='src/data/security-identifier-observations.json',
                       identitySourceHashes={key:o['sha256'] for key,o in shared.items()},
                       **identity,
                       sourceUrls=[url, document_url, API],
                       identityMethod='Exact issuer listing FIGI matched to independent ISIN query; unknown identities retained')
