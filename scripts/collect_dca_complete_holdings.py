"""Complete physical iShares holdings, kept separately from editorial top tens."""
import argparse, datetime as dt, json, re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit, parse_qs
from data_automation import get_json, get_text, UTC, write_json_atomic
from collect_etf_holdings import parse_holdings
ROOT=Path(__file__).resolve().parents[1]
def parse_complete(body,isin,url,now):
    facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!=isin:raise ValueError('Wrong exact share identity')
    if facts.get('productStructure',{}).get('value')!='Physical' or facts.get('assetClass',{}).get('value')!='Equity':raise ValueError('Only physical equity funds are qualified')
    product=parse_qs(urlsplit(url).query)['portfolioId'][0]
    h,_=parse_holdings(body,{'productId':product,'currency':body['currencyCode']},now)
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    keys=['isin','issueName','holdingPercent','assetClass','countryOfRisk','sectorName','ticker','marketCurrencyCode','exchange']
    cols=[p[k]['value'] for k in keys]
    if len({len(c) for c in cols})!=1:raise ValueError('Misaligned holdings')
    rows=[]; securities=[]
    for security,name,weight,kind,country,sector,ticker,currency,exchange in zip(*cols):
        if kind!='Equity' or weight<=0:continue
        rows.append({'isin':security,'name':name,'weightPct':weight})
        if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]',security or ''):
            securities.append({'isin':security,'name':name,'country':country,'sector':sector,'ticker':ticker,'currency':currency,'exchange':exchange})
    total=sum(r['weightPct'] for r in rows)
    if not rows or total>100.5:raise ValueError('Non-long-only equity composition')
    return {'asOf':h['asOf'],'basis':'fund','sourceUrl':url,'complete':True,'rows':rows},securities

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    config=json.loads((ROOT/'scripts/dca-complete-holdings-sources.json').read_text());now=dt.datetime.now(UTC)
    path=ROOT/'src/data/dca-complete-holdings.json';previous=json.loads(path.read_text()) if path.exists() else {}
    errors={};fresh={};evidence={}
    identities={**json.loads((ROOT/'scripts/dca-equity-identities.json').read_text()),**json.loads((ROOT/'scripts/dca-equity-extra-identities.json').read_text())}
    wanted=set(identities.values())
    def one(item):
        isin,c=item
        try:return isin,parse_complete(json.loads(get_text(c['url'],('application/json',),25_000_000)),isin,c['url'],now),None
        except Exception as e:return isin,None,str(e)
    with ThreadPoolExecutor(max_workers=6) as pool:
        for isin,result,error in pool.map(one,config.items()):
            if error:errors[isin]=error;continue
            h,securities=result
            if previous.get(isin,{}).get('asOf','')>h['asOf']:errors[isin]='Date regression';continue
            fresh[isin]=h
            for r in securities:
                if r['isin'] not in wanted:continue
                if r['isin'] not in evidence or evidence[r['isin']]['asOf']<h['asOf']:evidence[r['isin']]={**r,'asOf':h['asOf'],'sourceUrl':h['sourceUrl']}
    if args.apply:
        write_json_atomic(path,{**previous,**fresh})
        ep=ROOT/'src/data/dca-security-classifications.json';old=json.loads(ep.read_text()) if ep.exists() else {}
        for isin,r in evidence.items():
            if r['asOf']>=old.get(isin,{}).get('asOf',''):old[isin]=r
        write_json_atomic(ep,old)
    write_json_atomic(args.output,{'updated':list(fresh),'successes':[{'id':'dca-holdings:'+isin} for isin in fresh],'errors':[{'id':'dca-holdings:'+isin,'field':'Composition complète','error':error} for isin,error in errors.items()]})
    print(f'Complete holdings: {len(fresh)}/{len(config)}; identified securities: {len(evidence)}; errors: {errors}')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
