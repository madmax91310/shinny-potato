"""Complete physical equity holdings, kept separately from editorial top tens."""
import argparse, datetime as dt, json, re, hashlib, copy, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit, parse_qs
from data_automation import get_json, get_text, UTC, write_json_atomic
from observation_status import holdings_status
from collect_etf_holdings import parse_holdings
from holdings_reconciliation import reconcile_positions, HoldingsPerimeterError
ROOT=Path(__file__).resolve().parents[1]
def collect_blackrock_complete(config,now,fetch=get_text,sleep=time.sleep):
    """Retry only a missing component on an otherwise exact product response."""
    attempts=[]
    for attempt in range(2):
        raw=fetch(config['url'],('application/json',),25_000_000)
        body=json.loads(raw)
        digest=hashlib.sha256(raw.encode()).hexdigest()
        components=body.get('componentsByNameMap',{})
        if 'holdings' not in components:
            facts=components.get('keyFundFacts',{}).get('containersByNameMap',{}).get('default',{}).get('dataPointsByNameMap',{})
            product=parse_qs(urlsplit(config['url']).query).get('portfolioId',[])
            if facts.get('isin',{}).get('value')!=config['isin'] or product!=[str(body.get('productId'))]:
                raise ValueError('Wrong BlackRock identity in response without complete holdings')
            attempts.append({'attempt':attempt+1,'sha256':digest,'status':'missing-holdings-component'})
            if attempt==0:
                sleep(2)
                continue
            raise ValueError('BlackRock exact-share holdings component absent after two bounded attempts: '+json.dumps(attempts))
        try:
            record,securities=parse_complete(body,config['isin'],config['url'],now,config.get('fundAssetClass','Equity'))
        except HoldingsPerimeterError as error:
            error.diagnostic.update(sourceUrl=config['url'],sha256=digest,checkedAt=now.isoformat())
            raise
        record['sha256']=digest
        if attempts:
            record['sourceAttempts']=[*attempts,{'attempt':attempt+1,'sha256':digest,'status':'validated'}]
        return record,securities

def physical_ssga_page(page):
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(page,'html.parser')
    values=[]
    for row in soup.select('tr'):
        label=row.find('th');value=row.find('td')
        if label and value and label.get_text(' ',strip=True) in ('Replication Method','Méthode de Réplication','Méthode de réplication','Replikationsmethode'):
            values.append(value.get_text(' ',strip=True))
    return len(values)==1 and values[0] in ('Replicated','Optimised','Optimized','Optimisé','Optimisée','Réplication','Optimiert')

def parse_complete(body,isin,url,now,fund_asset_class="Equity"):
    localized=False
    facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if facts['isin']['value']!=isin:raise ValueError('Wrong exact share identity')
    if facts.get('productStructure',{}).get('value')=='Physisch' and facts.get('assetClass',{}).get('value')=='Aktien':
        # Literal issuer translations only; no geographic/sector translation is inferred.
        localized=True;body=copy.deepcopy(body)
        facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        facts['productStructure']['value']='Physical';facts['assetClass']['value']='Equity'
        points=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        points['assetClass']['value']=[{'Aktien':'Equity','Geldmarkt':'Cash'}.get(v,v) for v in points['assetClass']['value']]
    if fund_asset_class not in ('Equity','Real Estate') or facts.get('productStructure',{}).get('value')!='Physical' or facts.get('assetClass',{}).get('value')!=fund_asset_class:raise ValueError('Only explicitly qualified physical equity or listed real-estate funds are supported')
    product=parse_qs(urlsplit(url).query)['portfolioId'][0]
    h,_=parse_holdings(body,{'productId':product,'currency':body['currencyCode']},now)
    p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    keys=['isin','issueName','holdingPercent','assetClass','countryOfRisk','sectorName','ticker','marketCurrencyCode','exchange']
    cols=[p[k]['value'] for k in keys]
    if len({len(c) for c in cols})!=1:raise ValueError('Misaligned holdings')
    rows=[]; securities=[]; allocations={'countries':{},'sectors':{}}; classified=True
    positions=[];selected=[]
    for security,name,weight,kind,country,sector,ticker,currency,exchange in zip(*cols):
        positions.append({'isin':security,'name':name,'weightPct':weight,'assetClass':kind,
                          'ticker':ticker,'currency':currency,'exchange':exchange})
        if kind=='Equity' and (isinstance(weight,bool) or not isinstance(weight,(int,float)) or not __import__('math').isfinite(weight) or weight<0):raise ValueError('Invalid or short equity position')
        if kind!='Equity' or weight==0:continue
        selected.append(len(positions)-1)
        rows.append({'isin':security,'name':name,'weightPct':weight})
        if localized or not all(isinstance(v,str) and v.strip() and v not in ('-', 'Unknown', 'Other') for v in (country,sector)):
            classified=False
        else:
            for field,label in [('countries',country),('sectors',sector)]:
                allocations[field][label]=allocations[field].get(label,0)+weight
        if not localized and re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]',security or ''):
            securities.append({'isin':security,'name':name,'country':None if localized else country,'sector':None if localized else sector,'ticker':ticker,'currency':currency,'exchange':exchange})
    total=sum(r['weightPct'] for r in rows)
    if not rows:raise ValueError('No physical equity composition')
    reconciliation=reconcile_positions(positions,selected,h['asOf'])
    if total>100.5:
        raise HoldingsPerimeterError(f'Equity NAV weights {total:.6f}% exceed the existing 100.5% limit; published net NAV {reconciliation["publishedNetWeightPct"]:.6f}%; excluded classes {json.dumps(reconciliation["excludedWeightPctByType"],sort_keys=True)}; unsupported gross/net perimeter, no renormalisation',
            {'kind':'unsupported-gross-net-perimeter','subjectIsin':isin,'asOf':h['asOf'],
             'benchmark':facts.get('indexSeriesName',{}).get('value'),
             'navReconciliation':reconciliation,'financialDataQualified':False})
    record={'asOf':h['asOf'],'basis':'fund','sourceUrl':url,'complete':True,'rows':rows,'navReconciliation':reconciliation,'method':'Complete physical equity holdings from the exact BlackRock share; original NAV weights, non-equity positions excluded, no renormalisation'}
    # Attributes and equity weights come from these exact dated holdings, never
    # the independently dated exposure tables or a later security lookup.
    if classified and total <= 100:
        record['compositionFacts']={'asOf':h['asOf'],'basis':'fund','method':'same-snapshot-equity-country-of-risk-and-sector',
            **{field:{'asOf':h['asOf'],'rows':[{'name':label,'weightPct':weight} for label,weight in sorted(values.items(),key=lambda item:-item[1])]}
               for field,values in allocations.items()}}
    return record,securities

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');ap.add_argument('--only',nargs='+');ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    config={**json.loads((ROOT/'scripts/dca-complete-holdings-sources.json').read_text()),**json.loads((ROOT/'scripts/generated-holdings-sources.json').read_text())};now=dt.datetime.now(UTC)
    path=ROOT/'src/data/dca-complete-holdings.json';previous=json.loads(path.read_text()) if path.exists() else {}
    if args.only:
        if set(args.only)-set(config):raise ValueError('Unknown complete holdings selection')
        config={k:v for k,v in config.items() if k in args.only}
    errors={};fresh={};evidence={};rejected={}
    identities={**json.loads((ROOT/'scripts/dca-equity-identities.json').read_text()),**json.loads((ROOT/'scripts/dca-equity-extra-identities.json').read_text())}
    wanted=set(identities.values())
    def one(item):
        isin,c=item
        try:
            from collect_physical_holdings import COLLECTORS
            if c.get('parser') in COLLECTORS:
                return isin, (COLLECTORS[c['parser']](c, now), []), None
            if c.get('parser') == 'ssga':
                from collect_ssga_etf import parse_page, parse_holdings, get_xlsx, Inputs
                from urllib.parse import urljoin
                from bs4 import BeautifulSoup
                page=get_text(c['sourceUrl'],('text/html',),6_000_000)
                page_hash=hashlib.sha256(page.encode()).hexdigest()
                result,path=parse_page(page,c,now)
                inputs=Inputs();inputs.feed(page)
                if inputs.data['fund-quick-info']['attrs'].get('fund-assetclass-en',{}).get('value')!='Equity':raise ValueError('Only equity State Street funds are qualified')
                if not physical_ssga_page(page):raise ValueError('Physical State Street replication not confirmed')
                if not path:raise ValueError('Missing State Street holdings download')
                url=urljoin(c['sourceUrl'],path)
                raw=get_xlsx(url)
                h=parse_holdings(raw,c,now,complete=True);h.update(sourceUrl=url,sha256=hashlib.sha256(raw).hexdigest(),identitySourceUrl=c['sourceUrl'],identitySha256=page_hash,method='Complete physical equity securities published in the issuer workbook; cash excluded, no renormalisation')
                return isin,(h,[]),None
            if c.get('parser') == 'dws':
                from collect_dws_etf import parse_product, parse_holdings
                product = parse_product(json.loads(get_text(c['sourceUrl'], ('application/json',), 3_000_000)), c, now)
                if product.get('replication') != 'Direct Replication (physically)':
                    raise ValueError('Only physical DWS portfolios are qualified')
                url = c['sourceUrl'].rsplit('/', 1)[0] + '/holdings'
                body = json.loads(get_text(url, ('application/json',), 25_000_000))
                from dws_liquidity_funds import qualify_liquidity_fund, SOURCES as LIQUIDITY_FUNDS
                fund_isins={p['header']['value'] for table in body.get('tables',[]) for p in table.get('values',[])
                            if p.get('column_5',{}).get('value')=='Mutual Fund' or p.get('header',{}).get('value') in LIQUIDITY_FUNDS}
                qualifications={fund_isin:qualify_liquidity_fund(fund_isin,now) for fund_isin in fund_isins}
                return isin, (parse_holdings(body, c, now, url, complete=True,non_equity_funds=qualifications)['completeHoldings'], []), None
            return isin,collect_blackrock_complete({**c,'isin':isin},now),None
        except Exception as e:return isin,None,e
    direct={isin:c for isin,c in config.items() if c.get('parser')!='lifestrategy-lookthrough'}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for isin,result,error in pool.map(one,direct.items()):
            if error:
                errors[isin]=str(error)
                if isinstance(error,HoldingsPerimeterError):rejected[isin]=error.diagnostic
                continue
            h,securities=result
            if previous.get(isin,{}).get('asOf','')>h['asOf']:errors[isin]='Date regression';continue
            fresh[isin]={**h,'checkedAt':now.isoformat()}
            for r in securities:
                if r['isin'] not in wanted:continue
                if r['isin'] not in evidence or evidence[r['isin']]['asOf']<h['asOf']:evidence[r['isin']]={**r,'asOf':h['asOf'],'checkedAt':now.isoformat(),'sourceUrl':h['sourceUrl']}
    derived={isin:c for isin,c in config.items() if c.get('parser')=='lifestrategy-lookthrough'}
    if derived:
        from lifestrategy_holdings import derive
        records=json.loads((ROOT/'src/data/lifestrategy.json').read_text())
        for isin in derived:
            try:
                h=derive(isin,records[isin],{**previous,**fresh},errors,now)
                if previous.get(isin,{}).get('asOf','')>h['asOf']:raise ValueError('Date regression')
                fresh[isin]={**h,'checkedAt':now.isoformat()}
            except Exception as e:errors[isin]=str(e)
    if args.apply:
        write_json_atomic(path,{**previous,**fresh})
        ep=ROOT/'src/data/dca-security-classifications.json';old=json.loads(ep.read_text()) if ep.exists() else {}
        for isin,r in evidence.items():
            if r['asOf']>=old.get(isin,{}).get('asOf',''):old[isin]=r
        write_json_atomic(ep,old)
        status_path=ROOT/'src/data/dca-holdings-status.json'
        status=json.loads(status_path.read_text()) if status_path.exists() else {}
        for isin in config:
            old=status.get(isin,{})
            status[isin]=holdings_status(old,previous.get(isin,{}),fresh.get(isin),errors.get(isin),now)
            # Keep the rejected source's own clock separate from retained data.
            # A transport failure must not renew this diagnostic either.
            diagnostic=rejected.get(isin) or (old.get('lastRejectedObservation') if isin not in fresh else None)
            if diagnostic:status[isin]['lastRejectedObservation']=diagnostic
        write_json_atomic(status_path,status)
    # Bounded proof in the ordinary producer artifact, including PR runs that
    # deliberately do not commit or publish their acquired observations.
    observations={isin:{**{key:h[key] for key in ['asOf','checkedAt','basis','scope','sourceUrl','sourceUrls','sha256','method','identitySourceUrl','identitySha256','identityAsOf','identityMethod'] if key in h},
        'completeFile':h.get('complete') is True,'rows':len(h['rows']),
        'publishedEquityWeightPct':sum(r['weightPct'] for r in h['rows']),
        'identifiedEquityWeightPct':sum(r['weightPct'] for r in h['rows'] if re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]',r.get('isin') or ''))}
        for isin,h in fresh.items()}
    write_json_atomic(args.output,{'observations':observations,'rejectedObservations':rejected,'updated':list(fresh),'successes':[{'id':'dca-holdings:'+isin} for isin in fresh],'errors':[{'id':'dca-holdings:'+isin,'field':'Composition complète','error':error} for isin,error in errors.items()]})
    # Audit each success even if an unrelated support fails later in this run.
    # Only bounded public-source metadata; never the thousands of holding rows.
    for isin,entry in observations.items():
        fields=['asOf','checkedAt','basis','scope','sourceUrl','sha256','rows','publishedEquityWeightPct','identifiedEquityWeightPct']
        print('Validated holdings observation: '+json.dumps({'isin':isin,**{key:entry[key]for key in fields if key in entry}},sort_keys=True))
    print(f'Complete holdings: {len(fresh)}/{len(config)}; identified securities: {len(evidence)}; errors: {errors}')
    if errors:raise SystemExit(1)
if __name__=='__main__':__import__('producer_report_contract').run('collect_dca_complete_holdings', main)

