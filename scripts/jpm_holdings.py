"""JPM dailyHoldingsAll: direct equities kept separate from the option overlay."""
import json
import math
import re
from issuer_documents import download, document_date
from collect_physical_holdings import observation, checked_rows

ISIN='IE0003UVYC20'
URL='https://am.jpmorgan.com/FundsMarketingHandler/product-data?cusip=IE0003UVYC20&country=sg&role=per&language=en&userLoggedIn=false'
NAME='JPM Global Equity Premium Income Active UCITS ETF - USD (dist)'

def parse(body,now):
    fund=body['fundData'];share=fund['shareClass']
    if (body.get('error') or share.get('cusip')!=ISIN or share.get('headerTicker')!=ISIN
            or share.get('name')!=NAME or share.get('currencyCode')!='USD'
            or share.get('originalCurrencyCode')!='USD' or share.get('distributingCode')!='DIST'
            or fund.get('currencyCode')!='USD' or fund.get('assetClass')!='Equity'
            or fund.get('fundTypeCode')!='N_ETF' or fund.get('isLiquidatedOrMergedAway') is not False
            or fund.get('isCriticalDataMissing') is not False):
        raise ValueError('Wrong JPM exact share, currency, strategy or fund state')
    full=fund['dailyHoldingsAll'];stamp=document_date(full['effectiveDate'],now)
    positions=full['data']
    count=fund['numberOfHoldings']
    if isinstance(count,bool) or count!=len(positions) or count<20:
        raise ValueError('Truncated JPM dailyHoldingsAll list')
    # fundValuationDate dates the separate fund headline, never used below.
    # Qualify the complete positions by their own effectiveDate/navDate, top
    # list and independently reconciled market values, without mixing snapshots.
    records=[];excluded=[];total=0;market_total=0
    for p in positions:
        weight=p['marketValuePercent'];value=p['marketValue'];kind=p['securityType']
        if (any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) for v in [weight,value])
                or p.get('navDate')!=stamp or not re.fullmatch(r'[A-Z]{3}',p.get('currencyCode') or '')):
            raise ValueError('Invalid JPM holding weight, value, date or currency')
        total+=weight;market_total+=value
        if kind in ['Common Stock','Fund - Real Estate Investment Trust']:
            if weight<0 or value<0:raise ValueError('Short JPM equity position')
            records.append({'isin':p['securityIsin'],'name':p['securityDescription'],'weightPct':weight})
        elif kind in ['Cash','Option - Index','Right']:
            excluded.append({'name':p['securityDescription'],'publishedIdentifier':p.get('securityIsin'),
                             'kind':kind,'weightPct':weight})
        else:raise ValueError('Unqualified JPM security type: '+str(kind))
    if abs(total-100)>0.000001 or market_total<=0:raise ValueError('JPM portfolio NAV total does not reconcile')
    for p in positions:
        if abs(100*p['marketValue']/market_total-p['marketValuePercent'])>0.000001:
            raise ValueError('JPM market values and weights differ')
    top=fund['dailyHoldings']
    by_isin={p['securityIsin']:p['marketValuePercent'] for p in positions if p.get('securityIsin')}
    if top.get('effectiveDate')!=stamp or not top.get('data') or any(by_isin.get(p['securityIsin'])!=p['marketValuePercent'] for p in top['data']):
        raise ValueError('JPM top positions and complete list differ')
    return checked_rows(records),stamp,excluded

def collect(share,now):
    if share.get('isin')!=ISIN or share.get('currency')!='USD':raise ValueError('Unsupported JPM exact share')
    raw=download(URL,max_bytes=6_000_000);rows,stamp,excluded=parse(json.loads(raw),now)
    result=observation(rows,stamp,URL,raw,excludedPositions=excluded,scope='direct-equity-securities')
    result['method']='Complete direct equity and listed REIT positions in dailyHoldingsAll; index options, cash and rights retained separately, with original NAV weights; no option look-through or renormalisation'
    result['snapshotDates']={'holdings':stamp,'headlineValuationRaw':json.loads(raw)['fundData'].get('fundValuationDate'),
                             'headlineValuationUsedInCalculation':False}
    return result
