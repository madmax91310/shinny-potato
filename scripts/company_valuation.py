"""Independent renewable qualification of historical share basis.

Fail closed on any split in the whole history: comparative statements may already
be restated, so blindly multiplying counts by quote split factors is unsafe.
"""
import datetime as dt
import math
import urllib.parse

VERSION = 1

def qualify_share_basis(company, profile, fetch, today):
    rows = company.get('decision', {}).get('years', [])
    if profile['id'] in ('alphabet', 'meta', 'visa'):
        raise ValueError('Multiple share classes require a separate model')
    if len(rows) < 4 or any(not isinstance(r.get('averageDilutedShares'), (int,float))
        or not math.isfinite(r['averageDilutedShares']) or r['averageDilutedShares'] <= 0
        or not r.get('sharesBasisSource','').startswith('https://') for r in rows):
        raise ValueError('Four annual published diluted share counts required')
    first = dt.date.fromisoformat(rows[0]['end'])
    start = int(dt.datetime(first.year-1, first.month, min(first.day,28), tzinfo=dt.timezone.utc).timestamp())
    end = int(dt.datetime.combine(today+dt.timedelta(days=1),dt.time(),tzinfo=dt.timezone.utc).timestamp())
    url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(profile['symbol'])+f'?period1={start}&period2={end}&interval=1mo&events=splits'
    data = fetch(url)['chart']['result'][0]
    meta = data.get('meta', {})
    if meta.get('symbol') != profile['symbol'] or meta.get('currency') != profile['currency']:
        raise ValueError('Share basis quote identity/currency mismatch')
    timestamps = data.get('timestamp', [])
    if not timestamps or min(timestamps) > start+40*86400 or max(timestamps) < end-40*86400:
        raise ValueError('Incomplete full-window quote coverage')
    events=list(data.get('events', {}).get('splits', {}).values())
    normalised=None
    if events:
        if profile['id'] != 'nvidia':
            raise ValueError('Split in historical window: issuer restatement certification required')
        normalised=normalise_nvidia_history(rows, events)
    latest = max(x['end'] for x in [company.get('annual'),company.get('quarter'),company.get('halfYear')] if x)
    block={'version':VERSION,'observedAt':today.isoformat(),'annualEnd':company['annual']['end'],
        'accountsEndAtCollection':latest,'currency':profile['currency'],'sourceUrl':url,
        'splitCheckFrom':dt.datetime.fromtimestamp(start,dt.timezone.utc).date().isoformat(),
        'splitCheckThrough':today.isoformat(),'definition':'Published annual diluted averages; complete historical split window checked'}
    if normalised:
        block['normalisedYears']=normalised
        block['definition']='Published diluted averages normalised using issuer-confirmed split dates and restated comparatives'
    return block


def normalise_nvidia_history(rows, events, load=None):
    """Apply only issuer-confirmed splits; preserve the counts as published.

    A pre-split release is adjusted once. A post-split comparative must explicitly
    say it is restated; a current post-split fiscal year needs no adjustment.
    """
    import re
    from bs4 import BeautifulSoup
    from company_publications import get, MONTHS, sections
    load = load or get
    declarations = [
        'https://nvidianews.nvidia.com/_gallery/download_pdf/611d6beded6ae506d7268d68/',
        'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2025',
    ]
    words = {'four':4,'ten':10,'one':1}
    proofs=[]
    for url in declarations:
        raw=load(url)
        text=' '.join((' '.join(sections(raw)) if raw.startswith(b'%PDF') else BeautifulSoup(raw,'html.parser').get_text(' ',strip=True)).split())
        if not re.search(r'NVIDIA',text):raise ValueError('Wrong split declaration issuer')
        matches=re.findall(r'(four|ten)[- ]for[- ](one) (?:forward )?stock split.{0,100}?(?:effective|on) ('+'|'.join(MONTHS)+r') (\d{1,2}), (20\d{2})',text,re.I)
        for num,den,month,day,year in matches:
            proofs.append({'effectiveDate':dt.date(int(year),MONTHS[month.lower()],int(day)).isoformat(),
                'ratio':words[num.lower()]/words[den.lower()],'issuerSourceUrl':url})
    verified=[]
    for event in events:
        day=dt.datetime.fromtimestamp(int(event['date']),dt.timezone.utc).date()
        ratio=float(event['numerator'])/float(event['denominator'])
        found=[]
        for proof in proofs:
            effective=dt.date.fromisoformat(proof['effectiveDate'])
            next_session=effective+dt.timedelta(days=1)
            while next_session.weekday()>4:next_session+=dt.timedelta(days=1)
            if ratio==proof['ratio'] and effective<=day<=next_session:found.append(proof)
        if not found:raise ValueError('Split ratio/date not confirmed by NVIDIA publication')
        verified.append({**found[0],'asOf':day.isoformat()})
    documents={};normalised=[]
    for row in rows:
        url=row['sharesBasisSource']
        if not url.startswith('https://nvidianews.nvidia.com/news/'):
            raise ValueError('NVIDIA share basis requires dated issuer releases')
        if url not in documents:
            soup=BeautifulSoup(load(url),'html.parser');date=soup.select_one('.article-date')
            if date is None:raise ValueError('Missing issuer publication date')
            published=dt.datetime.strptime(date.get_text(' ',strip=True),'%B %d, %Y').date()
            documents[url]=(published,' '.join(soup.get_text(' ',strip=True).split()))
        published,text=documents[url];factor=1;adjustments=[]
        for proof in verified:
            effective=dt.date.fromisoformat(proof['effectiveDate'])
            if published<effective:
                factor*=proof['ratio'];adjustments.append({**proof,'action':'multiplied'})
            elif row['end']<proof['effectiveDate']:
                word=next(k for k,v in words.items()if v==proof['ratio'])
                if not re.search(r'retroactively adjusted.{0,160}'+word+r'[- ]for[- ]one stock split',text,re.I):
                    raise ValueError('Comparative share count restatement is not explicit')
                adjustments.append({**proof,'action':'already-restated'})
            else:adjustments.append({**proof,'action':'post-split-fiscal-year'})
        normalised.append({'end':row['end'],'reportedAverageDilutedShares':row['averageDilutedShares'],
            'averageDilutedShares':row['averageDilutedShares']*factor,'sourceUrl':url,
            'publishedAt':published.isoformat(),'adjustments':adjustments})
    return normalised
