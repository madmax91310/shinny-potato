"""Complete issuer-published index exposure, explicitly distinct from fund assets.

Uses the shared holdings producer, retention and public-page acquisition pattern.
The exact subject share's current issuer document qualifies its benchmark; no
physical ETF holdings, collateral weights or top ten fill missing index members.
"""
import base64
import copy
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import threading
import urllib.error
from functools import lru_cache
from issuer_documents import download, document_date, pdf_text

ROOT=Path(__file__).resolve().parents[1]
CONTRACTS=json.loads((ROOT/'src/data/native-index-composition-contracts.json').read_text())
METHOD='invesco-published-economic-index-v1'
_ACQUISITION_LOCKS={}
_LOCKS_LOCK=threading.Lock()
_METHODOLOGY_LOCK=threading.Lock()

def digest(raw):
    return hashlib.sha256(raw if isinstance(raw,bytes)else raw.encode()).hexdigest()

def contracts(isin):
    share=CONTRACTS['shares'].get(isin,{})
    index=CONTRACTS['indices'].get(share.get('indexId'),{})
    if index.get('methodCode')!=METHOD:raise ValueError('Unqualified issuer-published economic index')
    return share,index

def qualify_metadata(raw,index,now):
    data=json.loads(raw)
    expected={'benchmarkFullName':index['benchmarkName'],'baseCurrency':index['currency'],
              'indexBloombergTicker':index['benchmarkTicker'],'indexRic':index['benchmarkRic']}
    benchmarks=data.get('benchmarkRelationships')
    if (data.get('aliases',{}).get('isin')!=index['publisherIsin']
            or data.get('shareClassFullName')!=index['publisherShareName']
            or data.get('replicationMethod')!='Synthetic' or data.get('hedgedIndicator')is not False
            or data.get('shareClassCurrency')!=index['currency']
            or data.get('distributionFrequency')!='Accumulating'
            or data.get('account',{}).get('productType')!='ETF'
            or not isinstance(benchmarks,list)or len(benchmarks)!=1
            or any(benchmarks[0].get(k)!=v for k,v in expected.items())):
        raise ValueError('Wrong exact publisher share or economic benchmark')
    return document_date(data['effectiveDate'],now)

def parse_capture(capture,metadata_raw,isin,now):
    share,index=contracts(isin)
    metadata_date=qualify_metadata(metadata_raw,index,now)
    raw=base64.b64decode(capture['bodyBase64'],validate=True)
    payload=json.loads(raw)
    # The separate fund book has a different schema including numberOfHoldings.
    if set(payload)!={'effectiveDate','holdings'}:raise ValueError('Not an economic-index response')
    stamp=document_date(payload['effectiveDate'],now)
    widget=dict(isin=index['publisherIsin'],tableVariation='holdings',variationType='index',
                apiResponseKey='holdings',top10Holdings=True,displayComponent=True,maxRowCount=10,
                benchmarkProvider=index['benchmarkProvider'],downloadData=True)
    table=capture['tableText']
    census=re.search(r'Showing\s+1\s+to\s+10\s+of\s+(\d+)',table)
    date=re.search(r'\bas of\s+(\d{2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)-\d{2})\b',table)
    if (capture.get('indexId')!=share['indexId']or capture.get('sourceUrl')!=index['weightSourceUrl']
            or capture.get('pageUrl')!=index['publisherPageUrl']or capture.get('pageTitle')!=index['publisherShareName']
            or capture.get('sourceSha256')!=digest(raw)or capture.get('tableTextSha256')!=digest(table)
            or not re.fullmatch(r'[a-f0-9]{64}',capture.get('publisherPageSha256',''))
            or capture.get('widget')!=widget or capture.get('economicExposurePublished')is not True
            or capture.get('separateSubstituteBasketPublished')is not True
            or not census or not date or dt.datetime.strptime(date[1].replace('-Sept-','-Sep-'),'%d-%b-%y').date().isoformat()!=stamp
            or capture.get('publisherRowCount')!=int(census[1])):
        raise ValueError('Unqualified public economic-index table or census/date')
    rows=payload['holdings']
    if (not isinstance(rows,list)or len(rows)!=int(census[1])
            or not index['minimumMembers']<=len(rows)<=index['maximumMembers']):
        raise ValueError('Truncated economic index; top ten is not a full composition')
    identities=set();output=[]
    for row in rows:
        identity,name,weight=row.get('isin'),row.get('name'),row.get('weight')
        if (not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',identity or'')or identity in identities
                or not isinstance(name,str)or not name.strip()or type(weight)not in(int,float)
                or not math.isfinite(weight)or not 0<=weight<=100):
            raise ValueError('Invalid or duplicate economic-index member')
        identities.add(identity);output.append(dict(isin=identity,name=name,weightPct=weight))
    # Original four-decimal weights: source rounding closure only. The consumer's
    # existing stricter >100% full-overlap refusal remains unchanged.
    if abs(sum(r['weightPct']for r in output)-100)>len(rows)*.00005+.0001:
        raise ValueError('Economic-index weights do not close at published precision')
    if metadata_date<stamp:raise ValueError('Publisher benchmark identity predates the index book')
    return dict(subjectIsin=isin,indexId=share['indexId'],index=index['benchmarkName'],scope='equity-index',
        basis='index',complete=True,rows=output,asOf=stamp,sourceUrl=index['weightSourceUrl'],sha256=digest(raw),
        methodCode=METHOD,method=index['scopeNote'],metadataSourceUrl=index['metadataSourceUrl'],
        metadataSha256=digest(metadata_raw),metadataAsOf=metadata_date,
        identitySourceUrl=index['weightSourceUrl'],identitySha256=digest(raw),identityAsOf=stamp,
        identityMethod='ISIN published on each same-date economic-index row; no name-based or fund-basket join',
        coverageProof=dict(kind='complete-issuer-published-index',indexId=share['indexId'],
            sourceRowCount=len(rows),publisherRowCount=int(census[1]),originalPublishedWeights=True,
            normalizationApplied=False,publisherPageUrl=index['publisherPageUrl'],
            publisherPageSha256=capture['publisherPageSha256'],tableTextSha256=digest(table),
            economicExposurePublished=True,separateSubstituteBasketPublished=True),
        unidentifiedSecurityCount=0,unidentifiedWeightPct=0)

def qualify_subject_document(raw,isin,now,url):
    share,_=contracts(isin)
    text=pdf_text(raw);flat=' '.join(text.split())
    objective=flat.split('Evolution de la performance',1)[0].split('PERFORMANCE',1)[0]
    if (share['hedged']is not False or any(token not in flat for token in share['objectiveTokens'])
            or re.search(r'\bhedged\b|couvert(?:ure)? de change|couvert en euros',objective,re.I)):
        raise ValueError('Wrong net index, currency convention or unsupported hedged subject')
    if share['shareDocumentKind']=='amundi-index-factsheet':
        from collect_amundi_index_exposure import parse_document
        labels=re.findall(r'^\s*Indice de référence[ \t]+([^\n]+?)[ \t]*$',text,re.M)
        if (not flat.startswith(share['shareTitle'])or labels!=[share['shareBenchmarkLabel']]
                or 'Devise de référence de la classe '+share['shareCurrency']not in flat):
            raise ValueError('Wrong exact Amundi subject title, benchmark or currency')
        parsed=parse_document(raw,{'isin':isin,'sourceUrl':url},now)
        stamp=parsed['holdings']['asOf']
    else:
        from collect_document_etf import parse_legacy_factsheet
        if share['shareTitle']not in flat or 'Indice de référence : '+share['shareBenchmarkLabel']not in flat:
            raise ValueError('Wrong exact BlackRock benchmark')
        parsed=parse_legacy_factsheet(text,pdf_text(raw,(300,300)),{'isin':isin,'currency':share['shareCurrency']},now)
        if parsed['characteristics']['index']!=share['shareBenchmarkLabel']:raise ValueError('Changed BlackRock subject index')
        stamp=parsed['aum']['asOf']
    return stamp

def qualify_subject(isin,now,fetch=download):
    share,_=contracts(isin)
    if share.get('shareDocumentKind')=='ubs-index-factsheet':
        from collect_remaining_documents import ubs_urls,ubs
        errors=[]
        for primary in ubs_urls(now):
            for url in (primary,primary.replace('https://swissfunddata.ch/','https://www.swissfunddata.ch/')):
                try:raw=fetch(url,headers={'User-Agent':'Mozilla/5.0','Accept':'application/pdf'})
                except (urllib.error.URLError,TimeoutError,ConnectionError)as error:
                    errors.append(f'{url}: {error}');continue
                text=pdf_text(raw);flat=' '.join(text.split())
                labels=re.findall(r'^\s*Index name[ \t]+([^\n]+?)[ \t]*$',text,re.M)
                if share['shareTitle']not in flat or labels!=[share['shareBenchmarkLabel']]:
                    raise ValueError('Wrong exact UBS share or net benchmark')
                record=ubs(text,{'isin':isin,'currency':share['shareCurrency'],'sourceUrl':url},now,digest(raw),performance_text=pdf_text(raw,raw=True))
                return raw,url,record['countries']['asOf'],None
        raise ConnectionError('UBS current benchmark proof unavailable: '+'; '.join(errors))
    if share.get('shareDocumentKind') in ('amundi-index-factsheet','blackrock-index-factsheet'):
        url=share['shareDocumentBase'];raw=fetch(url)
        return raw,url,qualify_subject_document(raw,isin,now,url),None
    if isin=='FR0011871110':
        url=share['shareDocumentBase'];raw=fetch(url);text=' '.join(pdf_text(raw).split())
        title='Amundi PEA Nasdaq-100 UCITS ETF Acc'
        header=text.split("Objectif d'investissement",1)[0]
        dates=set(re.findall(r'\b\d{2}/\d{2}/\d{4}\b',header))
        if (not header.startswith(title)or len(dates)!=1 or 'C : '+isin not in text
                or 'Type de Réplication Synthétique'not in text
                or '100% NASDAQ 100 NOTIONAL NET TOTAL RETURN'not in text):
            raise ValueError('Wrong Amundi subject share or notional net benchmark')
        stamp=document_date(dates.pop(),now)
        return raw,url,stamp,None
    if isin=='FR0011550193'or share.get('shareDocumentKind')=='bnp-index-factsheet':
        from collect_bnp_etf import discover,parse
        instruments=json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']
        config=next(r for r in instruments if r['isin']==isin)
        discovery=share['shareDocumentDiscoveryUrl'];page=fetch(discovery)
        url,stamp=discover(page,config,now);raw=fetch(url)
        result=parse(pdf_text(raw),config,now,stamp)
        expected=share.get('shareBenchmarkLabel','STOXX Europe 600 NR')
        if result['characteristics']['index']!=expected:raise ValueError('Wrong BNP economic benchmark')
        return raw,url,stamp,dict(sourceUrl=discovery,sha256=digest(page))
    raise ValueError('Unqualified subject share')

@lru_cache(maxsize=16)
def _acquire_index(index_id,now,fetch):
    index=CONTRACTS['indices'][index_id]
    try:
        metadata=fetch(index['metadataSourceUrl'])
        result=subprocess.run(['node',str(ROOT/'scripts/capture-invesco-economic-index.mjs'),index_id],
                              capture_output=True,text=True,timeout=100,check=False)
        if result.returncode:raise ValueError('Public issuer economic-index capture: '+result.stderr[-1200:])
        return metadata,json.loads(result.stdout)
    except Exception as error:return error

def acquire_index(index_id,now,fetch):
    # Multiple subject parts share one dated publication; collapse concurrent
    # cache misses instead of launching a browser for every part. No old-run cache.
    with _LOCKS_LOCK:lock=_ACQUISITION_LOCKS.setdefault(index_id,threading.Lock())
    with lock:result=_acquire_index(index_id,now,fetch)
    if isinstance(result,Exception):raise result
    return result

@lru_cache(maxsize=4)
def _currency_method(index_id,now,fetch):
    try:raw=fetch(CONTRACTS['indices'][index_id]['currencyWeightContract']['sourceUrl'])
    except Exception as error:return error
    rule=CONTRACTS['indices'][index_id]['currencyWeightContract']
    if digest(raw)!=rule['sha256']:raise ValueError('Changed MSCI currency methodology requires qualification')
    text=' '.join(pdf_text(raw).split())
    if (rule['section']not in text or 'MSCI Index Calculation Methodology | May 2026'not in text
            or 'Calculation of the The World Index in EUR'not in text):
        raise ValueError('Missing official unhedged reporting-currency conversion rule')
    return raw,dict(sourceUrl=rule['sourceUrl'],sha256=digest(raw),version=rule['version'],
                    checkedAt=now.isoformat(),rule=rule['rule'],originalWeightsUnchanged=True)

def currency_method(index_id,now,fetch):
    with _METHODOLOGY_LOCK:result=_currency_method(index_id,now,fetch)
    if isinstance(result,Exception):raise result
    return result

@lru_cache(maxsize=4)
def return_weight_method(index_id,now,fetch):
    rule=CONTRACTS['indices'][index_id]['returnWeightContract'];raws=[];proofs=[]
    for config in rule['documents']:
        raw=fetch(config['sourceUrl'])
        if digest(raw)!=config['sha256']:raise ValueError('Changed Russell return-weight methodology requires qualification')
        raws.append(raw);proofs.append(dict(sourceUrl=config['sourceUrl'],sha256=digest(raw),version=config['version']))
    texts=[' '.join(pdf_text(raw).split())for raw in raws]
    if (not all(s in texts[0]for s in ['v7.2','August 2026','float-adjusted, market capitalization-weighted indexes','Net total return indexes based on specified withholding tax rates'])
            or not all(s in texts[1]for s in ['v1.2','September 2026','price, total and net returns','AEMV equals the index float-adjusted market value based on the primary exchange closing prices'])):
        raise ValueError('Missing official common equity-market-value / separate net-dividend rules')
    return raws,dict(documents=proofs,checkedAt=now.isoformat(),rule=rule['rule'],originalWeightsUnchanged=True,
                     targetReturnSeriesUnchanged=True)

def collect(share,now,fetch=download,capture=None):
    isin=share['isin'];subject,index=contracts(isin)
    if share.get('currency')!=subject.get('shareCurrency','EUR'):raise ValueError('Wrong subject share currency')
    raw,url,stamp,discovery=qualify_subject(isin,now,fetch)
    policy=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.default']
    if (now.date()-dt.date.fromisoformat(stamp)).days>policy['dataDays']:raise ValueError('Subject benchmark proof is stale')
    if capture is None:
        metadata,capture=acquire_index(subject['indexId'],now,fetch)
    else:metadata=fetch(index['metadataSourceUrl'])
    from collect_physical_holdings import source_proof
    source_proof(share,'economic-index-capture',capture)
    source_proof(share,'economic-index-metadata',metadata)
    source_proof(share,'subject-benchmark',raw)
    record=parse_capture(capture,metadata,isin,now)
    if subject.get('referenceOnly'):
        record['approximation']=True
        record['coverageProof']['referenceOnlyForSubject']=True
        record['method']+=' Benchmark reference only for this physical fund; actual fund assets, cash and tracking differences are not observed. Full fund overlap is not certified.'
    if index.get('currencyWeightContract'):
        _,proof=currency_method(subject['indexId'],now,fetch)
        source_proof(share,'unhedged-index-currency-method',proof)
        record['coverageProof']['currencyWeightProof']=copy.deepcopy(proof)
    if index.get('returnWeightContract'):
        _,proof=return_weight_method(subject['indexId'],now,fetch)
        source_proof(share,'equity-return-variant-method',proof)
        record['coverageProof']['returnWeightProof']=copy.deepcopy(proof)
        record['coverageProof']['targetBenchmark']=subject['targetBenchmark']
        record['method']+=' '+index['returnWeightContract']['rule']
    record.update(shareSourceUrl=url,shareAsOf=stamp,shareSha256=digest(raw),
                  sourceUrls=[url,index['metadataSourceUrl'],index['weightSourceUrl'],index['publisherPageUrl']])
    if index.get('currencyWeightContract'):record['sourceUrls'].append(index['currencyWeightContract']['sourceUrl'])
    if index.get('returnWeightContract'):record['sourceUrls'].extend(d['sourceUrl']for d in index['returnWeightContract']['documents'])
    if discovery:
        record.update(shareDiscoverySourceUrl=discovery['sourceUrl'],shareDiscoverySha256=discovery['sha256'])
        record['sourceUrls'].append(discovery['sourceUrl'])
    return record
