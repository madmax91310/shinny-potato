"""Qualified sector aggregation of the complete physical portfolio; no scaling."""
import hashlib,json,math,re
from collect_etf_holdings import parse_holdings
from collect_etf_pilot import source_date

SECTORS={'Energy','Materials','Utilities','Financials','Health Care','Industrials','Real Estate','Communication','Consumer Staples','Consumer Discretionary','Information Technology','Cash and/or Derivatives'}
SIGNED={'Cash','Cash Collateral and Margins','FX','Futures','Forwards'}

def sectors_from_complete_holdings(body,share,now,primary):
    facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!=share['isin'] or facts['productStructure']['value']!='Physical' or facts['assetClass']['value']!='Equity':
        raise ValueError('Unqualified sector fallback fund identity or physical scope')
    points=primary['dataPointsByNameMap'];labels=points['type']['value'];weights=points['fund']['value']
    if len(labels)!=len(weights) or len(set(labels))!=len(labels) or set(labels)!=SECTORS or not all(type(w)in (int,float) and w==0 for w in weights):
        raise ValueError('Sector fallback only qualifies the documented all-zero primary table')
    holding,_=parse_holdings(body,share,now)
    if source_date(points['asOf']['value'],now)!=holding['asOf']:
        raise ValueError('Sector fallback snapshots differ')
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    columns=[p[key]['value']for key in ['sectorName','holdingPercent','assetClass']]
    if len({len(c)for c in columns})!=1:raise ValueError('Sector fallback columns are incomplete')
    groups={label:[] for label in labels}
    for sector,weight,kind in zip(*columns):
        if sector not in SECTORS or (kind!='Equity' and (kind not in SIGNED or sector!='Cash and/or Derivatives')) or (kind=='Equity' and sector=='Cash and/or Derivatives'):
            raise ValueError('Unqualified sector or non-equity position in fallback')
        groups[sector].append(weight)
    # This qualified API publishes five decimal NAV weights. Prove coverage
    # against the separately dated issuer count as well as rounding bounds.
    metric=body['componentsByNameMap']['fundamentalsAndRisk']['containersByNameMap']['default']['dataPointsByNameMap']['numHoldings']
    count=metric.get('value')
    equities=[identity for identity,kind in zip(p['isin']['value'],columns[2])if kind=='Equity']
    if (type(count)not in (int,float) or not math.isfinite(count) or int(count)!=count or count<=0
        or metric.get('active')is not True or source_date(metric['asOfDate'],now)!=holding['asOf']
        or len(equities)!=count or len(set(equities))!=count
        or any(not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]',identity or '')for identity in equities)):
        raise ValueError('Sector fallback identities or published holdings count do not prove complete coverage')
    total=math.fsum(columns[1]);rounding_bound=len(columns[1])*.000005
    if abs(total-100)>rounding_bound:raise ValueError('Sector fallback coverage exceeds published five-decimal rounding')
    return {'asOf':holding['asOf'],'basis':'fund','sourceComponent':'holdings.all',
        'method':'GICS sectors from the complete physical portfolio, including signed cash/derivatives; no renormalisation',
        'portfolioWeightPct':total,'sha256':hashlib.sha256(json.dumps(body,sort_keys=True,allow_nan=False).encode()).hexdigest(),
        'rows':[{'name':label,'weightPct':math.fsum(groups[label])}for label in labels]}

def classified_position_allocation(body,share,now):
    """Validate allocation coverage independently of full security identity coverage."""
    facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!=share['isin']or facts['productStructure']['value']!='Physical'or facts['assetClass']['value']!='Equity':
        raise ValueError('Unqualified classified-position fund identity or physical scope')
    holdings,geography=parse_holdings(body,share,now)
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    keys=['holdingPercent','assetClass','isin','issueName','ticker','exchange','marketCurrencyCode','countryOfRisk']
    if any(key not in p or not isinstance(p[key].get('value'),list)for key in keys):raise ValueError('Classified-position columns missing')
    columns={key:p[key]['value']for key in keys}
    if len({len(v)for v in columns.values()})!=1:raise ValueError('Classified-position columns incomplete')
    equities=[];unknown=[]
    for i,(weight,kind)in enumerate(zip(columns['holdingPercent'],columns['assetClass'])):
        if kind!='Equity'and kind not in SIGNED|{'Money Market'}:raise ValueError('Unqualified non-equity position scope')
        if kind=='Equity':
            equities.append(tuple(columns[key][i]for key in ['isin','issueName','ticker','exchange','marketCurrencyCode']))
            if not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',columns['isin'][i]or''):unknown.append(weight)
    try:metric=body['componentsByNameMap']['fundamentalsAndRisk']['containersByNameMap']['default']['dataPointsByNameMap']['numHoldings']
    except KeyError as error:raise ValueError('Published position count missing')from error
    count=metric.get('value')
    if (type(count)not in (int,float)or not math.isfinite(count)or int(count)!=count or count<=0 or metric.get('active')is not True
        or source_date(metric['asOfDate'],now)!=holdings['asOf']or len(equities)!=count or len(set(equities))!=count):
        raise ValueError('Published position count or unique listing coverage not proved')
    total=math.fsum(columns['holdingPercent'])
    if abs(total-100)>len(columns['holdingPercent'])*.000005:raise ValueError('Classified-position weights exceed published rounding coverage')
    coverage={'portfolioWeightPct':total,'positionCount':len(equities),'unidentifiedSecurityCount':len(unknown),'unidentifiedWeightPct':math.fsum(unknown),'overlapQualified':False}
    return holdings,{**geography,**coverage},coverage

def sectors_from_classified_positions(body,share,now,primary):
    """A complete allocation does not certify a complete security overlap."""
    points=primary['dataPointsByNameMap'];labels=points['type']['value'];weights=points['fund']['value']
    if len(labels)!=len(weights)or len(set(labels))!=len(labels)or set(labels)!=SECTORS or not all(type(w)in (int,float)and w==0 for w in weights):
        raise ValueError('Classified-position fallback only qualifies the documented all-zero primary table')
    holdings,_,coverage=classified_position_allocation(body,share,now)
    if source_date(points['asOf']['value'],now)!=holdings['asOf']:raise ValueError('Classified-position snapshots differ')
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap'];sectors=p['sectorName']['value'];weights=p['holdingPercent']['value'];kinds=p['assetClass']['value']
    if not isinstance(sectors,list)or len(sectors)!=len(weights):raise ValueError('Sector classification columns incomplete')
    groups={label:[]for label in labels}
    for sector,weight,kind in zip(sectors,weights,kinds):
        if sector not in SECTORS or(kind!='Equity'and sector!='Cash and/or Derivatives')or(kind=='Equity'and sector=='Cash and/or Derivatives'):
            raise ValueError('Unqualified published sector classification')
        groups[sector].append(weight)
    return {'asOf':holdings['asOf'],'basis':'fund','sourceComponent':'holdings.all',**coverage,
      'method':'Published GICS classification of every physical-fund position, including signed cash/derivatives; no renormalisation; security identity coverage is separate from allocation coverage',
      'sha256':hashlib.sha256(json.dumps(body,sort_keys=True,allow_nan=False).encode()).hexdigest(),
      'rows':[{'name':label,'weightPct':math.fsum(groups[label])}for label in labels]}
