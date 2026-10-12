"""Collect complete exact-share issuer records; no assisted or cached source handoff."""
import argparse, datetime as dt, hashlib, json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from bs4 import BeautifulSoup
from collect_etf_pilot import fetch_product, Components, parse_share
from collect_etf_holdings import parse_holdings, collect_holdings
from data_automation import get_text, UTC, write_json_atomic
from issuer_documents import public_page
from apply_etf_collection import merge_collection
ROOT=Path(__file__).resolve().parents[1]
MICS={'London Stock Exchange':'XLON','Deutsche Boerse Xetra':'XETR','Euronext Amsterdam':'XAMS','Borsa Italiana':'ETFP','SIX Swiss Exchange':'XSWX'}
def collect_one(config,now):
 share={**config,'currency':'USD','collectHoldings':True,'requireFullHistory':False}
 body,url,attempts=fetch_product(share,get_text)
 if isinstance(body,str):p=Components();p.feed(body);components=p.components
 else:components=body['componentsByNameMap']
 facts=components['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
 v=lambda key:facts[key]['value']
 share['distribution']=v('useOfProfitsCode')
 result=parse_share(body,share,now)
 if not result.get('performance',{}).get('years'):raise ValueError('No complete annual NAV total return yet')
 holdings,countries=parse_holdings(body,share,now) if isinstance(body,dict) else collect_holdings(components['holdings'],share,now)
 result['holdings']=holdings
 if not result['countries'].get('rows'):result['countries']=countries
 if any(not result[field].get('rows') for field in ['holdings','countries','sectors']):raise ValueError('Incomplete issuer composition')
 page_url=f'https://www.ishares.com/uk/individual/en/products/{share["productId"]}/?siteEntryPassthrough=true&switchLocale=y'
 page=public_page(page_url,('text/html',),6000000);soup=BeautifulSoup(page,'html.parser')
 if config['isin'] not in page:raise ValueError('Product page ISIN mismatch')
 headings=[h.get_text(' ',strip=True) for h in soup.find_all('h1') if 'iShares' in h.get_text()]
 if len(set(headings))!=1:raise ValueError('Ambiguous issuer name')
 listings=[]
 table=soup.find('table',attrs={'data-id':'listings-table'})
 if not table:raise ValueError('Missing official listing table')
 for row in table.select('tbody tr'):
  cells=[td.get_text(' ',strip=True) for td in row.find_all('td')]
  if len(cells)>=7 and cells[0] in MICS and cells[2] in ['USD','EUR'] and cells[1] and cells[6] not in ['-','']:
   listings.append(dict(ticker=cells[1],exchange='Xetra' if MICS[cells[0]]=='XETR' else cells[0],excerpt=' | '.join(cells),mic=MICS[cells[0]],currency=cells[2],symbol=cells[6],sourceUrl=page_url,checkedAt=now.date().isoformat(),evidenceId=f'{config["isin"]}-{MICS[cells[0]]}-{cells[1]}-{cells[2]}'))
 if not listings:raise ValueError('No fully identified official listing')
 # Prefer USD London for historical calculations; the sheet uses the same exact listing.
 listing=sorted(listings,key=lambda x:(x['currency']!='USD',x['mic']!='XLON',x['ticker']))[0]
 result.update(name=headings[0],sourceUrl=url,listing=listing,listings=listings)
 result['characteristics']={'terPct':result['terPct'],'index':result['index'],'distribution':result['distribution'],'domicile':v('domicile'),'replicationMethod':v('productStructure')+' ('+v('fundMethodologyTypeCode')+')','inceptionDate':str(v('inceptionDate'))}
 if v('ucitsCompliantFlag')!='Yes' or v('assetClass')!='Equity':raise ValueError('Unexpected UCITS/asset class')
 result['checkedAt']=now.isoformat();result['pageSha256']=hashlib.sha256(page.encode()).hexdigest();result.pop('rawComponents',None)
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
 write_json_atomic(args.output,report)
 print(json.dumps({'qualified':[r['id']for r in report['records']],'excluded':report['excluded']},ensure_ascii=False))
 # Unqualified launch candidates stay excluded; failure of an already active record is fatal.
 active=json.loads((ROOT/'src/data/qualified-exposure-etfs.json').read_text())if (ROOT/'src/data/qualified-exposure-etfs.json').exists()else{}
 if any(x['id']in active for x in report['excluded']):raise SystemExit(1)
if __name__=='__main__':main()
