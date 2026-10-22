"""Use SEC N-CEN registrant CIKs to distinguish registered funds from ordinary issuers.
Absence from these filings never proves that an issuer is not a fund.
"""
import argparse,csv,datetime as dt,hashlib,io,json,pathlib,zipfile
from issuer_documents import download
from data_automation import UTC,write_json_atomic
ROOT=pathlib.Path(__file__).resolve().parents[1];DEST=ROOT/'data/ai-portfolios/equity-scope'
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache-dir',type=pathlib.Path,default=pathlib.Path('/tmp/ai-ncen-cache'));p.add_argument('--refresh',action='store_true');args=p.parse_args();args.cache_dir.mkdir(parents=True,exist_ok=True)
 now=dt.datetime.now(UTC);quarter=(now.month-1)//3;year=now.year
 if quarter==0:quarter=4;year-=1
 prior_path=DEST/'sec-fund-classifications.json';prior=json.loads(prior_path.read_text()) if prior_path.exists() else {};by_cik=dict(prior.get('registrants',{}));sources=[]
 for offset in range(4):
  n=year*4+quarter-1-offset;y,q=divmod(n,4);period=f'{y}q{q+1}';url=f'https://www.sec.gov/files/dera/data/form-n-cen-data-sets/{period}_ncen.zip';path=args.cache_dir/(period+'.zip')
  try:
   retrieved=dt.datetime.fromtimestamp(path.stat().st_mtime,UTC).isoformat() if path.exists() and not args.refresh else now.isoformat();body=path.read_bytes() if path.exists() and not args.refresh else download(url,max_bytes=30_000_000,max_attempts=1,timeout=45);path.write_bytes(body);sha=hashlib.sha256(body).hexdigest();z=zipfile.ZipFile(io.BytesIO(body))
   submissions={r['ACCESSION_NUMBER']:r for r in csv.DictReader(io.StringIO(z.read('SUBMISSION.tsv').decode('utf-8-sig')),delimiter='\t')};rows=list(csv.DictReader(io.StringIO(z.read('REGISTRANT.tsv').decode('utf-8-sig')),delimiter='\t'))
   for r in rows:
    cik=str(int(r['CIK']));accession=r['ACCESSION_NUMBER'];date=dt.datetime.strptime(submissions[accession]['FILING_DATE'],'%d-%b-%Y').date().isoformat()
    if date>now.date().isoformat():raise ValueError('Future SEC filing')
    if by_cik.get(cik,{}).get('filingDate','')<=date:by_cik[cik]={'cik':cik,'name':r['REGISTRANT_NAME'],'formType':r['INVESTMENT_COMPANY_TYPE'],'accessionNumber':accession,'filingDate':date,'sourceUrl':url,'sourceSha256':sha,'lei':r.get('LEI') or None}
   sources.append({'period':period,'url':url,'sha256':sha,'registrantRows':len(rows),'status':'success','retrievedAt':retrieved})
  except Exception as e:sources.append({'period':period,'url':url,'status':'blocked','reason':str(e)})
 write_json_atomic(prior_path,{'version':1,'checkedAt':now.isoformat(),'sources':sources,'registrants':by_cik,'coverageLimit':'SEC currently omits N-CEN schema 3.1 filings. No match is not proof of an ordinary operating company. Source: https://www.sec.gov/data-research/sec-markets-data/form-n-cen-data-sets'})
 print(json.dumps({'sources':len(sources),'successfulSources':sum(s['status']=='success' for s in sources),'registrantCIKs':len(by_cik)}))
if __name__=='__main__':main()
