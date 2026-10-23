"""Reconcile a proved historical cash distribution with provider adjustments.

The dated official capture is immutable evidence of a past corporate action,
not a newly checked live value. No cash dividend is added to a calculation.
"""
import copy
import datetime as dt
import gzip
import hashlib
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]

def official_events(config):
    reference=config['distributionEvidence']
    path=ROOT/reference['path']
    body=gzip.decompress(path.read_bytes())
    if hashlib.sha256(body).hexdigest()!=reference['sha256']:
        raise ValueError('Official distribution evidence hash changed')
    metadata=json.loads((ROOT/reference['metadataPath']).read_text())
    matches=[r for r in metadata if r.get('isin')==config['isin'] and r.get('sha256')==reference['sha256']]
    if len(matches)!=1 or not matches[0].get('ok') or not matches[0].get('checkedAt'):
        raise ValueError('Official distribution capture provenance missing')
    source=matches[0]
    if not source['sourceUrl'].startswith('https://www.blackrock.com/varnish-api/'):
        raise ValueError('Unqualified official distribution source')
    components=json.loads(body)['componentsByNameMap']
    facts=components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!=config['isin'] or facts['useOfProfitsCode']['value']!='Distributing':
        raise ValueError('Wrong distributing share identity')
    table=components['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
    dates,amounts,currencies=table['exDate']['value'],table['totalDistribution']['value'],table['totalDistribution']['prefix']
    if len(dates)!=len(amounts) or len(dates)!=len(currencies) or len(set(dates))!=len(dates):
        raise ValueError('Official distribution columns changed')
    events={}
    for day,amount,currency in zip(dates,amounts,currencies):
        day=dt.datetime.strptime(str(day),'%Y%m%d').date().isoformat()
        if day not in reference['dates']:continue
        amount=float(amount)
        if currency.strip()!=config['currency'] or not math.isfinite(amount) or amount<=0:
            raise ValueError('Official dividend currency/amount not qualified')
        events[day]=amount
    if set(events)!=set(reference['dates']):raise ValueError('Official distribution date not documented')
    return events,source

def reconcile_adjustments(config,result,daily,now):
    if result.get('distributionAdjustmentProof'):
        raise ValueError('Reconciliation already applied; start from the immutable provider capture')
    if len(result['points'])!=len(result['proofRows']):raise ValueError('Monthly proof rows misaligned')
    if config['parser']!='yahoo' or config['field']!='adjclose':
        raise ValueError('Official dividend reconciliation requires adjusted exchange prices')
    events,source=official_events(config)
    raw=result['rawResponse']['1d']['chart']['result'][0]
    quote_ref=config['distributionEvidence']['quoteEvidence']
    quote_body=gzip.decompress((ROOT/quote_ref['path']).read_bytes())
    if hashlib.sha256(quote_body).hexdigest()!=quote_ref['sha256']:raise ValueError('Historical quote evidence hash changed')
    reference=json.loads(quote_body)['1d']['chart']['result'][0]
    if reference['meta']['symbol']!=config['symbol'] or reference['meta']['currency']!=config['currency']:
        raise ValueError('Historical quote identity/currency changed')
    reference_zone=ZoneInfo(reference['meta']['exchangeTimezoneName'])
    reference_prices={dt.datetime.fromtimestamp(t,reference_zone).date().isoformat():reference['indicators']['quote'][0]['close'][i] for i,t in enumerate(reference['timestamp'])}
    zone=ZoneInfo(raw['meta']['exchangeTimezoneName'])
    stamp=lambda t:dt.datetime.fromtimestamp(t,zone).date().isoformat()
    splits=raw.get('events',{}).get('splits',{})
    quotes={day.isoformat():(close,adjusted)for day,close,adjusted in daily}
    repairs=[];checks=[]
    for day,amount in sorted(events.items()):
        if any(stamp(r['date'])>=day for r in splits.values()):
            raise ValueError('A subsequent split requires a new qualification of historical per-share cash amounts')
        previous=sorted(d for d in quotes if d<day)
        if not previous or day not in quotes:raise ValueError('Dividend ex-date or prior session missing')
        before=previous[-1]
        if (dt.date.fromisoformat(day)-dt.date.fromisoformat(before)).days>4:
            raise ValueError('Dividend sessions too far apart')
        q0,a0=quotes[before];q1,a1=quotes[day]
        reference_close=reference_prices.get(before)
        if reference_close is None or not math.isclose(q0,reference_close,rel_tol=1e-6,abs_tol=1e-8):
            raise ValueError('Historical quote share units changed; requalify the per-share cash amount')
        factor=1-amount/q0
        if not 0<factor<1 or min(q0,a0,q1,a1)<=0:raise ValueError('Dividend adjustment values invalid')
        observed=(a1/q1)/(a0/q0)
        # Floating representation tolerance of daily provider levels; not an
        # admission threshold or the market/NAV discrepancy alert threshold.
        if math.isclose(observed,1/factor,rel_tol=1e-6,abs_tol=1e-8):status='already-adjusted'
        elif math.isclose(observed,1,rel_tol=1e-6,abs_tol=1e-8):
            status='missing-adjustment';repairs.append((day,factor))
        else:raise ValueError('Ambiguous existing dividend adjustment; refuse another adjustment')
        checks.append(dict(exDate=day,amount=amount,currency=config['currency'],previousSession=before,
            previousClose=q0,providerAdjustmentRatio=observed,expectedAdjustmentRatio=1/factor,
            backAdjustmentFactor=factor,status=status,sourceUrl=source['sourceUrl'],
            evidenceCheckedAt=source['checkedAt'],evidenceSha256=source['sha256']))
    result=copy.deepcopy(result)
    def factor_for(day):return math.prod(factor for exdate,factor in repairs if day<exdate)
    precision=config['precision']
    for point,row in zip(result['points'],result['proofRows']):
        row['providerAdjustedValue']=row['value']
        row['officialDividendFactor']=factor_for(row['date'])
        row['value']*=row['officialDividendFactor']
        point[1]=math.floor(row['value']*10**precision+.5)/10**precision
    # Raw anniversary quotes are a separate price-only convention. They must
    # not become reinvested performance levels or receive a second cash flow.
    result['distributionAdjustmentProof']=checks
    result['rawResponse']['officialDistributionEvidence']={'sha256':source['sha256'],
        'sourceUrl':source['sourceUrl'],'checkedAt':source['checkedAt'],'events':events}
    result['sourceUrls']=list(dict.fromkeys(result['sourceUrls']+[source['sourceUrl']]))
    return result
