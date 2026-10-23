"""Bounded public route diagnosis; downloads alone never qualify financial fields."""
import argparse,concurrent.futures,datetime as dt,hashlib,json,pathlib,time
from issuer_documents import download
ROUTES={
 'fred-short':'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXTAUS&cosd=2026-08-01',
 'fred-download':'https://fred.stlouisfed.org/graph/fredgraph.csv?cosd=1999-01-01&coed=2026-10-23&id=DEXTAUS',
 'fed-h10-history':'https://www.federalreserve.gov/releases/h10/hist/dat00_ta.htm',
 'fed-h10-data':'https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H10',
 'wisdom-copper-eu':'https://www.wisdomtree.eu/en-gb/etps/commodities/wisdomtree-copper',
 'wisdom-copper-dataspan':'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/ETP/EU/EN-GB/GB00B15KXQ89',
 'wisdom-cloud-eu':'https://www.wisdomtree.eu/en-gb/etfs/thematic/wisdomtree-cloud-computing-ucits-etf-usd-acc',
}
def main():
 p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
 def one(pair):
  key,url=pair;t=time.monotonic();row={'id':key,'sourceUrl':url,'attemptedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'qualification':'access-check-only'}
  try:
   body,final=download(url,max_bytes=12000000,timeout=20,max_attempts=1,return_source=True)
   (a.output/(key+'.raw')).write_bytes(body);row.update(status='downloaded-unqualified',size=len(body),sha256=hashlib.sha256(body).hexdigest(),finalUrl=final)
  except Exception as e:row.update(status='unavailable',error=str(e))
  row['elapsedSeconds']=round(time.monotonic()-t,2);return row
 rows=list(concurrent.futures.ThreadPoolExecutor(4).map(one,ROUTES.items()));(a.output/'routes.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
