"""Public issuer holdings API; FIGIs are joined to independently proved ISINs."""
import datetime as dt
import json
import math
import os
import re
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from issuer_documents import download, pdf_text, document_date, proof
from security_identifier_observations import API, digest

ROOT = Path(__file__).resolve().parents[1]
CLASSES = {'IE00BJGWQN72': (3104137, 'WCLD LN', 'WisdomTree Cloud Computing UCITS ETF - USD Acc')}


def mapping_request(jobs):
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
        jobs, responses = observation['request'], observation['response']
        if not isinstance(responses, list) or len(jobs) != len(responses):
            raise ValueError('Misaligned FIGI mapping proof')
        for job, response in zip(jobs, responses):
            if not isinstance(response,dict) or response.get('error'):
                raise ValueError('Failed independent identifier lookup; previous portfolio preserved')
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


def parse(payload, share, now, mapping):
    class_id, ticker, _ = CLASSES[share['isin']]
    if not isinstance(payload, list) or len(payload) < 11:
        raise ValueError('Incomplete WisdomTree API portfolio')
    rows, stamps, seen, total, cash = [], set(), set(), 0, 0
    for item in payload:
        if item.get('wtClassID') != class_id or item.get('fundTicker') != ticker or item.get('assetGroup') != 'EQ':
            raise ValueError('Wrong WisdomTree API fund or asset group')
        stamps.add(document_date(item['dt'][:10], now))
        weight = item['wgt']
        if type(weight) not in (int, float) or not math.isfinite(weight) or not 0 <= weight <= 1:
            raise ValueError('Invalid API portfolio weight')
        if any(type(item.get(k)) not in (int,float) or not math.isfinite(item[k]) or abs(item[k]-1) > .00001 for k in ['checkSumWgtEntity','checkSumWgtAssetGroup']):
            raise ValueError('Unqualified API portfolio checksum')
        total += weight
        if item.get('securityName') == 'CASH W-O' and item.get('figi') is None and item.get('securityTicker') is None:
            cash += weight*100
            continue
        figi = item.get('figi')
        if not re.fullmatch(r'BBG[A-Z0-9]{9}', figi or '') or figi in seen or not item.get('securityName'):
            raise ValueError('Missing or duplicate API security FIGI')
        seen.add(figi)
        rows.append({'isin': mapping.get(figi), 'figi': figi, 'name': item['securityName'], 'weightPct': weight*100})
    if len(stamps) != 1 or abs(total-1) > .00001 or not any(row['isin'] for row in rows):
        raise ValueError('Incomplete/mixed-date API portfolio or missing identities')
    return rows, stamps.pop(), cash


def collect(share, now, fetch=download, post=mapping_request):
    from collect_physical_holdings import observation
    class_id, ticker, title = CLASSES[share['isin']]
    if share['currency'] != 'USD':
        raise ValueError('Wrong API share currency')
    document_url = f'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/{share["isin"]}'
    document = fetch(document_url)
    text = pdf_text(document)
    if (share['isin'] not in text or title not in ' '.join(text.split())
            or not re.search(r'Replication Method\s+Physical \(fully replicated\)', text)
            or not re.search(r'Base Currency\s+USD\b', text)
            or not re.search(r'WCLD\s+WCLD LN', text)):
        raise ValueError('API fund identity not confirmed by official factsheet')
    limit = json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.staticCharacteristic']['checkDays']
    identity_date = document_date(re.search(r'Document Date:\s*(\d{2}/\d{2}/\d{4})', text)[1], now, max_age=limit)
    if (now.date()-dt.date.fromisoformat(identity_date)).days > limit:
        raise ValueError('Expired API fund identity document')
    url = f'https://www.wisdomtree.com/api/fund-holdings/{class_id}'
    capture_method='public-http-json'
    try:
        raw = fetch(url, headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                                 'Accept':'application/json','Referer':'https://www.wisdomtree.com/gb/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc'})
    except urllib.error.HTTPError as error:
        if error.code!=403 or os.environ.get('WISDOMTREE_BROWSER_CAPTURE')!='1':
            raise
        result=subprocess.run(['node',str(ROOT/'scripts/capture-wisdomtree-api.mjs'),url],cwd=ROOT,capture_output=True,timeout=45)
        if result.returncode:
            raise ValueError('Issuer API HTTP 403; public browser also failed: '+result.stderr.decode(errors='replace')[-700:])
        raw=result.stdout
        capture_method='public-browser-json'
    payload = json.loads(raw)
    previous = json.loads((ROOT/'src/data/dca-complete-holdings.json').read_text())
    observations = previous.get(share['isin'], {}).get('identityObservations', [])
    mapping = identity_map(observations, now)
    max_age = json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.staticCharacteristic']['checkDays']
    observations = [o for o in observations if 0 <= (now-dt.datetime.fromisoformat(o['checkedAt'])).total_seconds()/86400 <= max_age]
    already_tested = {job['idValue'] for o in observations for job in o['request']}
    # Names only propose candidates. The issuer's exact listing FIGI must be in
    # the response to an independent ID_ISIN request before assigning an ISIN.
    names = {re.sub('[^A-Z0-9]', '', r.get('securityName', '').upper()) for r in payload if r.get('figi') not in mapping}
    candidates = sorted({r['isin'] for fund in previous.values() for r in fund.get('rows', [])
                         if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d', r.get('isin') or '')
                         and r['isin'] not in already_tested
                         and re.sub('[^A-Z0-9]', '', r['name'].upper()) in names})
    for start in range(0, min(len(candidates), 80), 10):
        # This API exposes the US listings of this qualified fund. Restrict the
        # identity response to that venue instead of storing worldwide aliases.
        jobs = [{'idType':'ID_ISIN', 'idValue': value, 'exchCode':'US'} for value in candidates[start:start+10]]
        response = post(jobs)
        evidence = {'sourceUrl': API, 'checkedAt': now.isoformat(), 'request': jobs,
                    'response': response, 'sha256': digest(response)}
        identity_map([evidence], now)
        observations = [*observations, evidence]
    mapping = identity_map(observations, now)
    queried_figis = {job['idValue'] for o in observations for job in o['request'] if job['idType']=='ID_BB_GLOBAL'}
    missing_figis = sorted({r['figi'] for r in payload if re.fullmatch(r'BBG[A-Z0-9]{9}',r.get('figi')or'') and r['figi'] not in mapping and r['figi'] not in queried_figis})
    for start in range(0, min(len(missing_figis),80),10):
        jobs = [{'idType':'ID_BB_GLOBAL','idValue':value} for value in missing_figis[start:start+10]]
        response = post(jobs)
        evidence = {'sourceUrl':API,'checkedAt':now.isoformat(),'request':jobs,'response':response,'sha256':digest(response)}
        observations = [*observations,evidence]
    mapping = identity_map(observations, now)
    unresolved_names = {re.sub('[^A-Z0-9]','',r.get('securityName','').upper()) for r in payload if r.get('figi') not in mapping}
    unrestricted_tested = {job['idValue'] for o in observations for job in o['request'] if job['idType']=='ID_ISIN' and not job.get('exchCode')}
    unrestricted = sorted({r['isin'] for fund in previous.values() for r in fund.get('rows',[])
                           if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',r.get('isin')or'')
                           and r['isin'] not in unrestricted_tested
                           and re.sub('[^A-Z0-9]','',r['name'].upper()) in unresolved_names})
    for start in range(0,min(len(unrestricted),20),10):
        jobs=[{'idType':'ID_ISIN','idValue':value} for value in unrestricted[start:start+10]]
        response=post(jobs)
        observations=[*observations,{'sourceUrl':API,'checkedAt':now.isoformat(),'request':jobs,'response':response,'sha256':digest(response)}]
    mapping = identity_map(observations, now)
    rows, stamp, cash = parse(payload, share, now, mapping)
    return observation(rows, stamp, url, raw, allow_unidentified=True,
                       captureMethod=capture_method,
                       excludedWeightPctByType={'Cash': cash}, identityObservations=observations,
                       identitySourceUrl=document_url, identitySha256=proof(document), identityAsOf=identity_date,
                       sourceUrls=[url, document_url, API],
                       identityMethod='Exact issuer listing FIGI matched to independent ISIN query; unknown identities retained')
