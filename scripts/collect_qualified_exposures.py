"""Collect complete exact-share issuer records; no assisted or cached source handoff."""
import argparse, datetime as dt, hashlib, json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from collect_etf_pilot import product_data_url, parse_share
from collect_etf_holdings import parse_holdings, collect_holdings
from data_automation import get_text, UTC, write_json_atomic
from apply_etf_collection import merge_collection
ROOT=Path(__file__).resolve().parents[1]
MICS={'London Stock Exchange':'XLON','Deutsche Boerse Xetra':'XETR','Xetra':'XETR','Euronext Amsterdam':'XAMS','Nyse Euronext - Euronext Paris':'XPAR','Borsa Italiana':'ETFP','SIX Swiss Exchange':'XSWX'}
def collect_one(config,now):
 share={**config,'currency':config.get('currency','USD'),'collectHoldings':True,'requireFullHistory':False}
 url=product_data_url(share).replace('holdings.all','holdings.all%2Clistings')
 raw=get_text(url,('application/json',),10000000);body=json.loads(raw)
 components=body['componentsByNameMap']
 facts=components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
 v=lambda key:facts[key]['value']
 share['distribution']=v('useOfProfitsCode')
 result=parse_share(body,share,now)
 if not result.get('performance',{}).get('years'):raise ValueError('No complete annual NAV total return yet')
 holdings,countries=parse_holdings(body,share,now) if isinstance(body,dict) else collect_holdings(components['holdings'],share,now)
 result['holdings']=holdings
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
 result['characteristics']={'terPct':result['terPct'],'index':result['index'],'distribution':result['distribution'],'domicile':v('domicile'),'replicationMethod':v('productStructure')+' ('+v('fundMethodologyTypeCode')+')','inceptionDate':str(v(config.get('inceptionField','inceptionDate')))}
 if v('ucitsCompliantFlag')!='Yes' or v('assetClass')!=config.get('holdingsAssetClass','Equity'):raise ValueError('Unexpected UCITS/asset class')
 result['checkedAt']=now.isoformat();result['pageSha256']=hashlib.sha256(raw.encode()).hexdigest();result.pop('rawComponents',None)
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
  current=json.loads((ROOT/'src/data/automated-etf.json').read_text());current.update({r['isin']:r['automatedRecord']for r in old.values()});valid=[]
  for r in report['records']:
   previous=old.get(r['id']);
   if previous and (previous['isin']!=r['isin']or previous['currency']!=r['currency']):raise ValueError('Share identity changed')
   try:
    merged=merge_collection({'checkedAt':now.isoformat(),'shares':[r]},current,{})
    if previous and any(r[field]['asOf']<previous[field]['asOf']for field in ['countries','sectors','holdings','aum']):raise ValueError('Observation date regressed')
    current=merged;r['automatedRecord']=merged[r['isin']];old[r['id']]=r;valid.append(r)
   except (ValueError,KeyError,TypeError)as e:report['excluded'].append({'id':r['id'],'isin':r['isin'],'error':str(e)})
  report['records']=valid
  write_json_atomic(path,old)
  write_json_atomic(ROOT/'src/data/automated-etf.json',{k:v for k,v in current.items()if k not in {r['isin']for r in old.values()}})
 active=json.loads((ROOT/'src/data/qualified-exposure-etfs.json').read_text())if (ROOT/'src/data/qualified-exposure-etfs.json').exists()else{}
 for row in report['excluded']:row['active']=row['id']in active
 write_json_atomic(args.output,report)
 print(json.dumps({'qualified':[r['id']for r in report['records']],'excluded':report['excluded']},ensure_ascii=False))
 # Unqualified launch candidates stay excluded; failure of an already active record is fatal.
 active=json.loads((ROOT/'src/data/qualified-exposure-etfs.json').read_text())if (ROOT/'src/data/qualified-exposure-etfs.json').exists()else{}
 if any(x['id']in active for x in report['excluded']):raise SystemExit(1)
if __name__=='__main__':main()
