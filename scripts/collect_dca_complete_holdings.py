"""Complete physical equity holdings, kept separately from editorial top tens."""
import argparse, datetime as dt, json, re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit, parse_qs
from data_automation import get_json, get_text, UTC, write_json_atomic
from observation_status import holdings_status
from collect_etf_holdings import parse_holdings
ROOT=Path(__file__).resolve().parents[1]
def parse_complete(body,isin,url,now,fund_asset_class="Equity"):
    facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!=isin:raise ValueError('Wrong exact share identity')
    if fund_asset_class not in ('Equity','Real Estate') or facts.get('productStructure',{}).get('value')!='Physical' or facts.get('assetClass',{}).get('value')!=fund_asset_class:raise ValueError('Only explicitly qualified physical equity or listed real-estate funds are supported')
    product=parse_qs(urlsplit(url).query)['portfolioId'][0]
    h,_=parse_holdings(body,{'productId':product,'currency':body['currencyCode']},now)
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    keys=['isin','issueName','holdingPercent','assetClass','countryOfRisk','sectorName','ticker','marketCurrencyCode','exchange']
    cols=[p[k]['value'] for k in keys]
    if len({len(c) for c in cols})!=1:raise ValueError('Misaligned holdings')
    rows=[]; securities=[]
    for security,name,weight,kind,country,sector,ticker,currency,exchange in zip(*cols):
        if kind=='Equity' and (isinstance(weight,bool) or not isinstance(weight,(int,float)) or not __import__('math').isfinite(weight) or weight<0):raise ValueError('Invalid or short equity position')
        if kind!='Equity' or weight==0:continue
        rows.append({'isin':security,'name':name,'weightPct':weight})
        if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]',security or ''):
            securities.append({'isin':security,'name':name,'country':country,'sector':sector,'ticker':ticker,'currency':currency,'exchange':exchange})
    total=sum(r['weightPct'] for r in rows)
    if not rows or total>100.5:raise ValueError('Non-long-only equity composition')
    return {'asOf':h['asOf'],'basis':'fund','sourceUrl':url,'complete':True,'rows':rows},securities

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');ap.add_argument('--only',nargs='+');ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    config={**json.loads((ROOT/'scripts/dca-complete-holdings-sources.json').read_text()),**json.loads((ROOT/'scripts/generated-holdings-sources.json').read_text())};now=dt.datetime.now(UTC)
    path=ROOT/'src/data/dca-complete-holdings.json';previous=json.loads(path.read_text()) if path.exists() else {}
    if args.only:
        if set(args.only)-set(config):raise ValueError('Unknown complete holdings selection')
        config={k:v for k,v in config.items() if k in args.only}
    errors={};fresh={};evidence={}
    identities={**json.loads((ROOT/'scripts/dca-equity-identities.json').read_text()),**json.loads((ROOT/'scripts/dca-equity-extra-identities.json').read_text())}
    wanted=set(identities.values())
    def one(item):
        isin,c=item
        try:
            if c.get('parser') == 'ssga':
                from collect_ssga_etf import parse_page, parse_holdings, get_xlsx, Inputs
                from urllib.parse import urljoin
                from bs4 import BeautifulSoup
                page=get_text(c['sourceUrl'],('text/html',),6_000_000)
                result,path=parse_page(page,c,now)
                inputs=Inputs();inputs.feed(page)
                if inputs.data['fund-quick-info']['attrs'].get('fund-assetclass-en',{}).get('value')!='Equity':raise ValueError('Only equity State Street funds are qualified')
                text=BeautifulSoup(page,'html.parser').get_text(' ',strip=True)
                if not re.search(r'Replikationsmethode\s+Optimiert|Replication Method\s+(?:Optimized|Replicated)|Méthode de réplication\s+(?:Optimisée|Réplication)',text):raise ValueError('Physical State Street replication not confirmed')
                if not path:raise ValueError('Missing State Street holdings download')
                url=urljoin(c['sourceUrl'],path)
                h=parse_holdings(get_xlsx(url),c,now,complete=True);h['sourceUrl']=url
                return isin,(h,[]),None
            if c.get('parser') == 'dws':
                from collect_dws_etf import parse_product, parse_holdings
                product = parse_product(json.loads(get_text(c['sourceUrl'], ('application/json',), 3_000_000)), c, now)
                if product.get('replication') != 'Direct Replication (physically)':
                    raise ValueError('Only physical DWS portfolios are qualified')
                url = c['sourceUrl'].rsplit('/', 1)[0] + '/holdings'
                body = json.loads(get_text(url, ('application/json',), 25_000_000))
                return isin, (parse_holdings(body, c, now, url, complete=True)['completeHoldings'], []), None
            return isin,parse_complete(json.loads(get_text(c['url'],('application/json',),25_000_000)),isin,c['url'],now,c.get('fundAssetClass','Equity')),None
        except Exception as e:return isin,None,str(e)
    with ThreadPoolExecutor(max_workers=6) as pool:
        for isin,result,error in pool.map(one,config.items()):
            if error:errors[isin]=error;continue
            h,securities=result
            if previous.get(isin,{}).get('asOf','')>h['asOf']:errors[isin]='Date regression';continue
            fresh[isin]={**h,'checkedAt':now.isoformat()}
            for r in securities:
                if r['isin'] not in wanted:continue
                if r['isin'] not in evidence or evidence[r['isin']]['asOf']<h['asOf']:evidence[r['isin']]={**r,'asOf':h['asOf'],'checkedAt':now.isoformat(),'sourceUrl':h['sourceUrl']}
    if args.apply:
        write_json_atomic(path,{**previous,**fresh})
        ep=ROOT/'src/data/dca-security-classifications.json';old=json.loads(ep.read_text()) if ep.exists() else {}
        for isin,r in evidence.items():
            if r['asOf']>=old.get(isin,{}).get('asOf',''):old[isin]=r
        write_json_atomic(ep,old)
        status_path=ROOT/'src/data/dca-holdings-status.json'
        status=json.loads(status_path.read_text()) if status_path.exists() else {}
        for isin in config:
            status[isin]=holdings_status(status.get(isin,{}),previous.get(isin,{}),fresh.get(isin),errors.get(isin),now)
        write_json_atomic(status_path,status)
    write_json_atomic(args.output,{'updated':list(fresh),'successes':[{'id':'dca-holdings:'+isin} for isin in fresh],'errors':[{'id':'dca-holdings:'+isin,'field':'Composition complète','error':error} for isin,error in errors.items()]})
    print(f'Complete holdings: {len(fresh)}/{len(config)}; identified securities: {len(evidence)}; errors: {errors}')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()

