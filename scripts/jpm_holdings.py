"""JPM dailyHoldingsAll: direct equities kept separate from the option overlay."""
import json
import math
import re
from collections import Counter
from issuer_documents import download, document_date
from collect_physical_holdings import observation, checked_rows

ISIN='IE0003UVYC20'
URL='https://am.jpmorgan.com/FundsMarketingHandler/product-data?cusip=IE0003UVYC20&country=sg&role=per&language=en&userLoggedIn=false'
NAME='JPM Global Equity Premium Income Active UCITS ETF - USD (dist)'

def ranked_position_key(position):
    isin = position.get('securityIsin')
    kind = position.get('securityType')
    currency = position.get('currencyCode')
    date = position.get('navDate')
    value, weight = position.get('marketValue'), position.get('marketValuePercent')
    if (not all(isinstance(field, str) and field for field in (kind, currency, date))
            or any(type(amount) not in (int, float) or not math.isfinite(amount) for amount in (value, weight))):
        return None
    if isinstance(isin, str) and isin:
        identity = ('isin', isin, kind, currency)
    elif (isin is None and kind == 'Cash'
          and all(isinstance(position.get(key), str) and position[key].strip()
                  for key in ('securityId', 'securityDescription'))):
        # Cash can appear in the official ranking without a security ISIN.
        # Match the publisher's row; never use this key as a securities identity.
        identity = ('cash', position['securityId'], position['securityDescription'], currency)
    else:
        return None
    return identity, date, value, weight

def qualified_fund(body):
    fund=body['fundData'];share=fund['shareClass']
    if (body.get('error') or share.get('cusip')!=ISIN or share.get('headerTicker')!=ISIN
            or share.get('name')!=NAME or share.get('currencyCode')!='USD'
            or share.get('originalCurrencyCode')!='USD' or share.get('distributingCode')!='DIST'
            or fund.get('currencyCode')!='USD' or fund.get('assetClass')!='Equity'
            or fund.get('fundTypeCode')!='N_ETF' or fund.get('isLiquidatedOrMergedAway') is not False
            or fund.get('isCriticalDataMissing') is not False):
        raise ValueError('Wrong JPM exact share, currency, strategy or fund state')
    return fund


def parse(body,now):
    fund=qualified_fund(body)
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
    complete_keys = Counter(ranked_position_key(position) for position in positions)
    ranked_keys = Counter(ranked_position_key(position) for position in top.get('data') or [])
    if (top.get('effectiveDate') != stamp or not ranked_keys or None in ranked_keys
            or any(count != 1 or complete_keys[key] != 1 for key, count in ranked_keys.items())):
        raise ValueError('JPM top positions and complete list differ')
    return checked_rows(records),stamp,excluded

def collect(share,now):
    if share.get('isin')!=ISIN or share.get('currency')!='USD':raise ValueError('Unsupported JPM exact share')
    raw=download(URL,max_bytes=6_000_000);rows,stamp,excluded=parse(json.loads(raw),now)
    result=observation(rows,stamp,URL,raw,excludedPositions=excluded,scope='direct-equity-securities')
    result['method']='Complete direct equity and listed REIT positions in dailyHoldingsAll; index options, cash and rights retained separately, with native portfolio market-value weights; headline AUM is a separate metric; no option look-through or renormalisation'
    result['snapshotDates']={'holdings':stamp,'headlineValuationRaw':json.loads(raw)['fundData'].get('fundValuationDate'),
                             'headlineValuationUsedInCalculation':False}
    return result
