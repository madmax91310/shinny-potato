"""Fund-level published allocations for LifeStrategy's three additional equity underliers."""
import argparse,datetime as dt,json,re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from issuer_documents import download,pdf_text,document_date,validated_rows
from collect_vanguard_etf import fetch_api,parse_api
from data_automation import UTC,write_json_atomic
ROOT=Path(__file__).resolve().parents[1]
SOURCES=[('9674','IE00BFMXYX26','FTSE_Japan','Japan'),('9676','IE00BK5BQZ41','FTSE_Developed_Asia_Pacific_ex_Japan','Developed Asia Pacific ex Japan'),('9523','IE00BKX55R35','FTSE_North_America','North America')]
def collect(c,now):
 code,isin,file,name=c;policy='Distributing' if code=='9523' else 'Accumulating'
 url=f'https://fund-docs.vanguard.com/{file}_UCITS_ETF_USD_{policy}_{code}_FR_INT_EN.pdf'
 body=download(url);text=pdf_text(body)
 if isin not in text or f'Vanguard FTSE {name}' not in ' '.join(text.split()):raise ValueError('Vanguard underlying identity mismatch')
 stamp=document_date(re.search(r'Factsheet \| (\d+ [A-Za-z]+ \d{4})',text)[1],now)
 sector=text.split('Weighted exposure',1)[1].split('Sector categories',1)[0];rows=[]
 for line in sector.splitlines():
  cells=re.split(r' {2,}',line.strip())
  for i in range(len(cells)-1):
   if re.fullmatch(r'[A-Za-z &]+',cells[i]) and re.fullmatch(r'\d+\.\d+%?',cells[i+1]):rows.append({'name':cells[i],'weightPct':float(cells[i+1].rstrip('%'))})
 validated_rows(rows)
 api=parse_api(fetch_api(code),{'isin':isin,'productCode':code,'currency':'USD'},now)
 if not api.get('countries'):raise ValueError('Vanguard complete country table absent')
 return isin,{'name':f'Vanguard FTSE {name} UCITS ETF','isin':isin,'checkedAt':now.date().isoformat(),'sourceUrl':url,'countries':api['countries'],
  'sectors':{'asOf':stamp,'basis':'fund','sourceUrl':url,'rows':rows},'note':'Fund-level underlying allocation; North America PDF uses the distributing class of the same unhedged physical fund.'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--apply',action='store_true');ap.add_argument('--output',type=Path,required=True);args=ap.parse_args();now=dt.datetime.now(UTC)
 path=ROOT/'src/data/vanguard-equity-underliers.json';old=json.loads(path.read_text()) if path.exists() else {};errors=[];updated=[]
 def one(c):
  try:return collect(c,now),None
  except Exception as e:return None,{'isin':c[1],'error':str(e)}
 with ThreadPoolExecutor(max_workers=3) as pool:
  for value,error in pool.map(one,SOURCES):
   if error:errors.append(error);continue
   isin,r=value
   if any(r[f]['asOf']<old.get(isin,{}).get(f,{}).get('asOf','') for f in ['countries','sectors']):raise ValueError('Date regression')
   old[isin]=r;updated.append(isin)
 if args.apply:write_json_atomic(path,old)
 report={'updated':updated,'successes':[{'id':'vanguard-underlier:'+isin} for isin in updated],'errors':[{'id':'vanguard-underlier:'+e['isin'],'field':'Pays/secteurs du fonds sous-jacent',**e} for e in errors]}
 write_json_atomic(args.output,report);print(json.dumps(report))
 if errors:raise SystemExit(1)
if __name__=='__main__':__import__('producer_report_contract').run('collect_vanguard_sleeves', main)
