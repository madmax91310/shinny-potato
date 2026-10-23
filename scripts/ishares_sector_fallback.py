"""Qualified sector aggregation of the complete physical portfolio; no scaling."""
import hashlib,json,math
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
    total=math.fsum(columns[1])
    if not 99<=total<=101:raise ValueError('Incomplete sector fallback portfolio')
    return {'asOf':holding['asOf'],'basis':'fund','sourceComponent':'holdings.all',
        'method':'GICS sectors from the complete physical portfolio, including signed cash/derivatives; no renormalisation',
        'portfolioWeightPct':total,'sha256':hashlib.sha256(json.dumps(body,sort_keys=True,allow_nan=False).encode()).hexdigest(),
        'rows':[{'name':label,'weightPct':math.fsum(groups[label])}for label in labels]}
