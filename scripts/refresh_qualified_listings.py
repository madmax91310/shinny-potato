"""Renew exact listing evidence from the issuers' public PDF trading tables."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import hashlib
import html
import json
from pathlib import Path
import re
from data_automation import UTC,write_json_atomic
from issuer_documents import download,pdf_text
ROOT=Path(__file__).resolve().parents[1]
def parse(source,body,checked):
 if source.get('format')=='amundi-api':
  products=json.loads(body)['products']
  if len(products)!=1 or products[0]['productId']!=source['isin'] or products[0]['characteristics']['ISIN']!=source['isin']:raise ValueError('Wrong exact-share document')
  rows=products[0]['characteristics']['LISTINGS']
  text='\n'.join(' '.join([row['exchangePlace'],row['tradingCurrency'],row['ticker'],row['ric'],source['isin']]) for row in rows)
 elif source.get('format')=='html':
  document=body.decode('utf-8')
  if source['isin'] not in document:raise ValueError('Wrong exact-share document')
  text='\n'.join(re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',row))).strip() for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',document,re.S|re.I))
  # The row extraction retains a separate exact identity check on the document.
 else:text=pdf_text(body)
 if source.get('format')!='html' and source['isin'] not in text:raise ValueError('Wrong exact-share document')
 rows=[]
 for spec in source['rows']:
  matches=list(re.finditer(spec['pattern'],text,re.M))
  if len(matches)!=1:raise ValueError('Ambiguous or missing official listing row')
  match=matches[0];symbol=spec.get('symbol') or match[1]
  if not re.fullmatch(r'[A-Za-z0-9]+\.[A-Za-z]+',symbol):raise ValueError('Invalid official listing symbol')
  excerpt=source['isin']+' | '+match[0].strip()
  evidence_id=f'{source["isin"]}-{spec["mic"]}-{spec["ticker"]}-{spec["currency"]}'
  rows.append({k:spec[k] for k in ['ticker','mic','exchange','currency']}|dict(symbol=symbol,evidenceId=evidence_id,sourceUrl=source['url'],checkedAt=checked,excerpt=excerpt,sha256=hashlib.sha256(body).hexdigest()))
 return rows

def main():
 p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--output',type=Path);args=p.parse_args()
 sources=json.loads((ROOT/'scripts/qualified-listing-sources.json').read_text())['sources'];path=ROOT/'src/data/qualified-listing-records.json'
 records=json.loads(path.read_text()) if path.exists() else {};checked=dt.datetime.now(UTC).date().isoformat()
 def one(s):
  try:
   if s.get('format')=='amundi-api':
    from collect_amundi_etf import fetch_api,request_payload
    payload=request_payload([s],dt.datetime.now(UTC));payload['characteristics']=['ISIN','LISTINGS','MAIN_LISTINGS'];payload['breakDown']={'aggregationFields':[]};payload['metrics']=[];payload['historics']=[]
    body=json.dumps(fetch_api(payload),ensure_ascii=False,sort_keys=True).encode()
   else:body=download(s['url'])
   return s['isin'],parse(s,body,checked),None
  except Exception as e:return s['isin'],None,str(e)
 with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(one,sources))
 for isin,rows,error in results:
  if rows:records[isin]=rows
 if args.apply:write_json_atomic(path,records)
 report={'checkedAt':checked,'validated':[isin for isin,rows,error in results if rows],'failed':[{'isin':isin,'reason':error} for isin,rows,error in results if error]}
 if args.output:write_json_atomic(args.output,report)
 print(json.dumps(report))
 if any(error for _,_,error in results):raise SystemExit(1)
if __name__=='__main__':main()
