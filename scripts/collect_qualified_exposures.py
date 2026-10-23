"""Collect complete exact-share issuer records; no assisted or cached source handoff."""
import copy
import argparse, datetime as dt, hashlib, json, re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from collect_etf_pilot import product_data_url, parse_share, source_date, replication_characteristics
from collect_etf_holdings import parse_holdings, collect_holdings
from data_automation import get_text, UTC, write_json_atomic
from apply_etf_collection import merge_collection
ROOT=Path(__file__).resolve().parents[1]
MICS={'London Stock Exchange':'XLON','Deutsche Boerse Xetra':'XETR','Xetra':'XETR','Euronext Amsterdam':'XAMS','Nyse Euronext - Euronext Paris':'XPAR','Borsa Italiana':'ETFP','SIX Swiss Exchange':'XSWX'}
def holdings_sectors(body,as_of):
  points=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
  sectors={}
  names=points['sectorName']['value'];weights=points['holdingPercent']['value'];kinds=points['assetClass']['value']
  if len(names)!=len(weights):raise ValueError('Truncated holdings sector columns')
  for name,weight,kind in zip(names,weights,kinds):
   label=name if kind=='Equity' else 'Cash and/or Derivatives'
   if not label:raise ValueError('Missing equity sector')
   sectors[label]=sectors.get(label,0)+weight
  return {'asOf':as_of,'method':'Sector of all published holdings, signed cash/derivatives included, no renormalisation','rows':[{'name':k,'weightPct':round(v,6)}for k,v in sectors.items()]}

def collect_one(config,now):
 share={**config,'currency':config.get('currency','USD'),'collectHoldings':True,'requireFullHistory':False}
 url=product_data_url(share).replace('holdings.all','holdings.all%2Clistings%2CfundamentalsAndRisk')
 raw=get_text(url,('application/json',),20000000);body=json.loads(raw)
 components=body['componentsByNameMap']
 facts=components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
 v=lambda key:facts[key]['value']
 share['distribution']=v('useOfProfitsCode')
 # Hedged funds can publish gross exposure breakdowns. Use the complete signed
 # positions instead, without renormalising them or confusing exposure with NAV.
 parse_body=copy.deepcopy(body) if config.get('compositionFromHoldings') else body
 # A wholly unpublished country table is absent data, not a malformed one.
 # Preserve the raw response and use the exact dated holdings fallback below.
 published=body.get('componentsByNameMap',{}).get('exposureBreakdowns',{}).get('containersByNameMap',{})
 country_points=published.get('geography',{}).get('subContainersByNameMap',{}).get('countries',{}).get('dataPointsByNameMap',{})
 if country_points and country_points.get('type',{}).get('value') is None and country_points.get('fund',{}).get('value') is None:
  parse_body=copy.deepcopy(body)
  parse_body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap'].pop('geography',None)
 if config.get('compositionFromHoldings'):parse_body['componentsByNameMap'].pop('exposureBreakdowns',None)
 result=parse_share(parse_body,share,now)
 if not result.get('performance',{}).get('years'):raise ValueError('No complete annual NAV total return yet')
 holdings,countries=parse_holdings(body,share,now) if isinstance(body,dict) else collect_holdings(components['holdings'],share,now)
 result['holdings']=holdings
 if config.get('compositionFromHoldings'):
  result['sectors']=holdings_sectors(body,holdings['asOf'])
  result['countries']=countries
 if not result['countries'].get('rows'):result['countries']=countries
 if any(not result[field].get('rows') for field in ['holdings','countries','sectors']):raise ValueError('Incomplete issuer composition')
 page_url=url
 name=body.get('fundName')
 if not name or not name.startswith('iShares '):raise ValueError('Missing official fund name')
 points=components['listings']['containersByNameMap']['default']['dataPointsByNameMap']
 keys=['exchange','ticker','currencyCode','listingDate','ric']
 arrays={key:points[key]['value']for key in keys}
 if len({len(a)for a in arrays.values()})!=1:raise ValueError('Misaligned listing columns')
 listings=[]
 for cells in zip(*(arrays[key]for key in keys)):
  exchange,ticker,currency,listing_date,ric=cells
  if exchange in MICS and currency in ['USD','EUR'] and ticker and ric:
   market=MICS[exchange]
   market_name={'XETR':'Xetra','XPAR':'Euronext Paris'}.get(market,exchange)
   listings.append(dict(ticker=ticker,exchange=market_name,excerpt=' | '.join(str(v)for v in cells),mic=market,currency=currency,symbol=ric,sourceUrl=url,checkedAt=now.date().isoformat(),evidenceId=f'{config["isin"]}-{market}-{ticker}-{currency}'))
 if not listings:raise ValueError('No fully identified official listing')
 # Prefer USD London for historical calculations; the sheet uses the same exact listing.
 listing=sorted(listings,key=lambda x:(x['currency']!='USD',x['mic']!='XLON',x['ticker']))[0]
 result.update(name=name,sourceUrl=url,listing=listing,listings=listings)
 result['characteristics']={'terPct':result['terPct'],'index':result['index'],'distribution':result['distribution'],'domicile':v('domicile'),**replication_characteristics(facts),'inceptionDate':str(v(config.get('inceptionField','inceptionDate')))}
 if v('ucitsCompliantFlag')!='Yes' or v('assetClass')!=config.get('fundAssetClass',config.get('holdingsAssetClass','Equity')):raise ValueError('Unexpected UCITS/asset class')
 metrics=components.get('fundamentalsAndRisk',{}).get('containersByNameMap',{}).get('default',{}).get('dataPointsByNameMap',{})
 result['metrics']={}
 for field,label,unit,low,high in [('modelOad','Duration effective','ans',0,100),('weightedAvgLife','Maturité moyenne pondérée','ans',0,100),('yieldToWorst','Rendement actuariel moyen (YTM/YTW)','%',-20,100),('twelveMonTrlYld','Rendement des distributions sur 12 mois','%',0,100),('numHoldings','Nombre de positions hors liquidités et dérivés','positions',1,100000),('priceEarnings','PER du portefeuille selon l’émetteur','fois',0,1000),('priceBook','Cours / actif net comptable selon l’émetteur','fois',0,1000),('volatilitySourced3YrAnnualized','Volatilité annualisée sur 3 ans','%',0,200)]:
  point=metrics.get(field,{})
  if point.get('value') is None:continue
  value=point['value']
  if isinstance(value,bool) or not isinstance(value,(int,float)) or not low<=value<=high or (field=='numHoldings' and value!=int(value)):raise ValueError('Invalid issuer metric: '+field)
  result['metrics'][field]={'value':value,'label':label,'unit':unit,'asOf':source_date(point['asOfDate'],now),'checkedAt':now.date().isoformat(),'sourceUrl':url,'method':point.get('infoBubble',''),'scope':'Fund portfolio' if field!='twelveMonTrlYld' else 'Exact share, trailing 12 months'}
 if config.get('currencyHedge') is True and 'Hedged' not in result['index']:raise ValueError('Hedge benchmark changed')
 result['checkedAt']=now.isoformat();result['pageSha256']=hashlib.sha256(raw.encode()).hexdigest();result.pop('rawComponents',None)
 return result

def retain_listing_evidence(archive, records, required_ids=None):
 result={isin:[dict(row) for row in rows] for isin,rows in archive.items()}
 for record in records:
  if not record:continue
  isin=record['isin'];rows={(row['mic'],row['ticker'],row['currency']):row for row in result.get(isin,[])}
  for listing in record.get('listings',[]):
   if required_ids is not None and listing.get('evidenceId') not in required_ids:continue
   row=dict(listing);row['sha256']=row.get('sha256') or record.get('pageSha256')
   if not row.get('sourceUrl','').startswith('https://') or not re.fullmatch('[a-f0-9]{64}',row.get('sha256') or '') or not row.get('checkedAt') or not row.get('evidenceId','').startswith(isin+'-'):
    raise ValueError('Listing archive requires exact dated issuer evidence')
   key=(row['mic'],row['ticker'],row['currency'])
   if key not in rows or row['checkedAt']>=rows[key]['checkedAt']:rows[key]=row
  result[isin]=list(rows.values())
 return result

def main():
 p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--output',type=Path,required=True);p.add_argument('--only',nargs='+');args=p.parse_args()
 configs=json.loads((ROOT/'scripts/qualified-exposure-sources.json').read_text())['instruments'];now=dt.datetime.now(UTC)
 if args.only:configs=[c for c in configs if c['id']in args.only]
 def one(c):
  try:return {'record':collect_one(c,now)}
  except Exception as e:return {'id':c['id'],'isin':c['isin'],'error':str(e)}
 with ThreadPoolExecutor(max_workers=4)as pool:rows=list(pool.map(one,configs))
 report={'checkedAt':now.isoformat(),'records':[x['record']for x in rows if 'record'in x],'excluded':[x for x in rows if 'record'not in x]}
 if args.apply:
  path=ROOT/'src/data/qualified-exposure-etfs.json';old=json.loads(path.read_text())if path.exists()else{}
  listing_path=ROOT/'src/data/qualified-listing-records.json';listing_archive=json.loads(listing_path.read_text())if listing_path.exists()else{}
  history_sources=json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']+json.loads((ROOT/'scripts/non-bond-monthly-sources.json').read_text())['series']
  required_listing_ids={source['listingEvidenceId'] for source in history_sources if source.get('listingEvidenceId')}
  current=json.loads((ROOT/'src/data/automated-etf.json').read_text());current.update({r['isin']:r['automatedRecord']for r in old.values()});valid=[]
  for r in report['records']:
   previous=old.get(r['id']);
   if previous and (previous['isin']!=r['isin']or previous['currency']!=r['currency']):raise ValueError('Share identity changed')
   try:
    merged=merge_collection({'checkedAt':now.isoformat(),'shares':[r]},current,{})
    if previous and any(r[field]['asOf']<previous[field]['asOf']for field in ['countries','sectors','holdings','aum']):raise ValueError('Observation date regressed')
    if previous and any(k not in r.get('metrics',{}) or r['metrics'][k]['asOf']<v['asOf']for k,v in previous.get('metrics',{}).items()):raise ValueError('Issuer metric missing or observation date regressed')
    # A partial current list cannot erase the dated proof of an active history.
    listing_archive=retain_listing_evidence(listing_archive,[previous,r],required_listing_ids)
    current=merged;r['automatedRecord']=merged[r['isin']];old[r['id']]=r;valid.append(r)
   except (ValueError,KeyError,TypeError)as e:report['excluded'].append({'id':r['id'],'isin':r['isin'],'error':str(e)})
  report['records']=valid
  write_json_atomic(path,old)
  write_json_atomic(listing_path,listing_archive)
  write_json_atomic(ROOT/'src/data/automated-etf.json',{k:v for k,v in current.items()if k not in {r['isin']for r in old.values()}})
 active=json.loads((ROOT/'src/data/qualified-exposure-etfs.json').read_text())if (ROOT/'src/data/qualified-exposure-etfs.json').exists()else{}
 for row in report['excluded']:row['active']=row['id']in active
 write_json_atomic(args.output,report)
 print(json.dumps({'qualified':[r['id']for r in report['records']],'excluded':report['excluded']},ensure_ascii=False))
 # Unqualified launch candidates stay excluded; failure of an already active record is fatal.
 active=json.loads((ROOT/'src/data/qualified-exposure-etfs.json').read_text())if (ROOT/'src/data/qualified-exposure-etfs.json').exists()else{}
 if any(x['id']in active for x in report['excluded']):raise SystemExit(1)
if __name__=='__main__':main()
