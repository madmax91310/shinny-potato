"""Complete issuer-published index exposure, explicitly distinct from fund assets.

Uses the shared holdings producer, retention and public-page acquisition pattern.
The exact subject share's current issuer document qualifies its benchmark; no
physical ETF holdings, collateral weights or top ten fill missing index members.
"""
import base64
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
from issuer_documents import download, document_date, pdf_text

ROOT=Path(__file__).resolve().parents[1]
CONTRACTS=json.loads((ROOT/'src/data/native-index-composition-contracts.json').read_text())
METHOD='invesco-published-economic-index-v1'

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
    date=re.search(r'\bas of\s+(\d{2}-[A-Za-z]{3}-\d{2})\b',table)
    if (capture.get('indexId')!=share['indexId']or capture.get('sourceUrl')!=index['weightSourceUrl']
            or capture.get('pageUrl')!=index['publisherPageUrl']or capture.get('pageTitle')!=index['publisherShareName']
            or capture.get('sourceSha256')!=digest(raw)or capture.get('tableTextSha256')!=digest(table)
            or not re.fullmatch(r'[a-f0-9]{64}',capture.get('publisherPageSha256',''))
            or capture.get('widget')!=widget or capture.get('economicExposurePublished')is not True
            or capture.get('separateSubstituteBasketPublished')is not True
            or not census or not date or dt.datetime.strptime(date[1],'%d-%b-%y').date().isoformat()!=stamp
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

def qualify_subject(isin,now,fetch=download):
    share,_=contracts(isin)
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
    if isin=='FR0011550193':
        from collect_bnp_etf import discover,parse
        instruments=json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']
        config=next(r for r in instruments if r['isin']==isin)
        discovery=share['shareDocumentDiscoveryUrl'];page=fetch(discovery)
        url,stamp=discover(page,config,now);raw=fetch(url)
        result=parse(pdf_text(raw),config,now,stamp)
        if result['characteristics']['index']!='STOXX Europe 600 NR':raise ValueError('Wrong BNP economic benchmark')
        return raw,url,stamp,dict(sourceUrl=discovery,sha256=digest(page))
    raise ValueError('Unqualified subject share')

def collect(share,now,fetch=download,capture=None):
    isin=share['isin'];subject,index=contracts(isin)
    if share.get('currency')!='EUR':raise ValueError('Wrong subject share currency')
    raw,url,stamp,discovery=qualify_subject(isin,now,fetch)
    policy=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']['etf.default']
    if (now.date()-dt.date.fromisoformat(stamp)).days>policy['dataDays']:raise ValueError('Subject benchmark proof is stale')
    metadata=fetch(index['metadataSourceUrl'])
    if capture is None:
        result=subprocess.run(['node',str(ROOT/'scripts/capture-invesco-economic-index.mjs'),subject['indexId']],
                              capture_output=True,text=True,timeout=100,check=False)
        if result.returncode:raise ValueError('Public issuer economic-index capture: '+result.stderr[-1200:])
        capture=json.loads(result.stdout)
    from collect_physical_holdings import source_proof
    source_proof(share,'economic-index-capture',capture)
    source_proof(share,'economic-index-metadata',metadata)
    source_proof(share,'subject-benchmark',raw)
    record=parse_capture(capture,metadata,isin,now)
    record.update(shareSourceUrl=url,shareAsOf=stamp,shareSha256=digest(raw),
                  sourceUrls=[url,index['metadataSourceUrl'],index['weightSourceUrl'],index['publisherPageUrl']])
    if discovery:
        record.update(shareDiscoverySourceUrl=discovery['sourceUrl'],shareDiscoverySha256=discovery['sha256'])
        record['sourceUrls'].append(discovery['sourceUrl'])
    return record
