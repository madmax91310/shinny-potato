"""Refresh exact-stock classifications from official complete BlackRock holdings."""
import argparse
import datetime as dt
import json
from pathlib import Path
from data_automation import get_json, UTC, write_json_atomic
from collect_etf_holdings import parse_holdings
ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://www.blackrock.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data?appSubType=ISHARES&appType=PRODUCT_PAGE&component=keyFundFacts%2Choldings.all&locale=en_GB&portfolioId=251882&targetSite=ishares-uk&userType=individual&excludeContent=true&includeConfig=true'
SECTORS = {'Information Technology','Financials','Industrials','Health Care','Consumer Discretionary','Consumer Staples','Communication','Communication Services','Energy','Materials','Utilities','Real Estate'}
SECONDARY_SOURCE = 'https://www.blackrock.com/varnish-api/uk-retail01-product-data/product-data/api/v2/get-product-data?appSubType=ISHARES&appType=PRODUCT_PAGE&component=keyFundFacts%2Cperformance%2CexposureBreakdowns%2Choldings.all%2Clistings%2CfundamentalsAndRisk&locale=en_GB&portfolioId=296576&targetSite=ishares-uk&userType=individual&excludeContent=true&includeConfig=true'
def parse(body, identities, now, *, source=SOURCE, source_isin='IE00B4L5Y983', product_id='251882'):
    facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!=source_isin: raise ValueError('Unexpected source share')
    holdings,_=parse_holdings(body,{'productId':product_id,'currency':'USD'},now)
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    keys=['isin','issueName','countryOfRisk','sectorName','assetClass']
    columns=[p[k]['value'] for k in keys]
    if len({len(c) for c in columns})!=1: raise ValueError('Misaligned classification columns')
    indexed={}
    for isin,name,country,sector,kind in zip(*columns):
        if kind=='Equity' and isin in identities.values():
            if isin in indexed: raise ValueError('Duplicate security identity')
            indexed[isin]=(name,country,sector)
    records={};missing=[]
    for asset,isin in identities.items():
        row=indexed.get(isin)
        if not row or not row[1] or row[1]=='-' or row[2] not in SECTORS:
            missing.append(asset);continue
        name,country,sector=row
        records[asset]={'isin':isin,'name':name,'kind':'equity'}
        for field,label,method in [('countries',country,'Country of risk'),('sectors',sector,'GICS sector according to BlackRock')]:
            records[asset][field]={'asOf':holdings['asOf'],'checkedAt':now.date().isoformat(),'basis':'equity','method':method,'sourceUrl':source,'compatibility':'country-risk' if field=='countries' else 'gics','rows':[{'name':label,'weightPct':100}]}
    return records,missing

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    now=dt.datetime.now(UTC);ids=json.loads((ROOT/'scripts/dca-equity-identities.json').read_text())
    records,missing=parse(get_json(SOURCE),ids,now)
    # Mid/small caps requested in the DCA editor may be outside the MSCI World.
    # Read their exact identities from the existing official World Small Cap source.
    if missing:
        extra,missing=parse(get_json(SECONDARY_SOURCE),{asset:ids[asset] for asset in missing},now,
                            source=SECONDARY_SOURCE,source_isin='IE00BF4RFH31',product_id='296576')
        records.update(extra)
        for asset,record in extra.items():
            print('Validated supplementary equity: '+json.dumps({'asset':asset,'record':record},sort_keys=True))
    path=ROOT/'src/data/dca-equity-exposures.json'
    previous=json.loads(path.read_text()) if path.exists() else {}
    for asset,r in records.items():
        if asset in previous and any(r[f]['asOf']<previous[asset][f]['asOf'] for f in ['countries','sectors']):raise ValueError('Classification observation regressed')
    if args.apply: write_json_atomic(path,{**previous,**records})
    write_json_atomic(args.output,{'checkedAt':now.isoformat(),'updated':list(records),'missing':missing})
    print(f'DCA equities: {len(records)}/{len(ids)} exact securities refreshed.')
    if missing:raise SystemExit('Missing classifications retained with original dates: '+', '.join(missing))
if __name__=='__main__':__import__('producer_report_contract').run('collect_dca_equities', main)
