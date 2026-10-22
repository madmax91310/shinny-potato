"""Reconcile provider taxonomy with exact issuer identity, never accept a different product.
Produces per-listing evidence; contradictory or generic provider names stay unresolved.
"""
import concurrent.futures,csv,datetime as dt,hashlib,json,pathlib,re,subprocess,unicodedata
from data_automation import UTC,write_json_atomic
from issuer_documents import download,pdf_text
ROOT=pathlib.Path(__file__).resolve().parents[1]
FOLDER=ROOT/'data/ai-portfolios'

def tokens(value):
 value=unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode().lower()
 return {t for t in re.findall(r'[a-z0-9]+',value) if t not in {'ucits','etf','etp','etc','etn','acc','dist','physical','usd','eur','gbp','plc','inc','the','and'}}

def main():
 start=json.loads((FOLDER/'market.json').read_text())['calendarFrom'];rows=json.loads((FOLDER/'qualification.json').read_text())['candidates'];candidates=[r for r in rows if r.get('reason')=='Qualified listing instrument type changed' and r.get('instrumentType')!='EQUITY'];folder=FOLDER/'provider-type-proofs';folder.mkdir(exist_ok=True);now=dt.datetime.now(UTC)
 def review(r):
  record={'id':r['id'],'isin':r['isin'],'evidenceId':r.get('evidenceId'),'checkedAt':now.isoformat(),'status':'unresolved','reason':None,'identitySource':r.get('sourceUrl')}
  try:
   values=[]
   for host in ['query2','query1']:
    key=hashlib.sha256(((r.get('lastAttempt') or now.isoformat())[:10]+start+r['symbol']+host+'adjusted').encode()).hexdigest()+'.json';path=pathlib.Path('/tmp/ai-daily-response-cache')/key
    if path.exists():
     entry=json.loads(path.read_text())
     if entry.get('raw') and entry['raw']['chart'].get('result'):values.append(entry)
   if not values:raise ValueError('No observed provider metadata in the dated response cache; explicit collection needed.')
   meta=values[0]['raw']['chart']['result'][0]['meta'];name=meta.get('longName') or meta.get('shortName') or ''
   record.update(providerName=name,providerType=meta.get('instrumentType'),providerSymbol=meta.get('symbol'),providerSourceUrl=values[0]['url'],providerRetrievedAt=values[0].get('retrievedAt'))
   expected=tokens(r['name']);actual=tokens(name)
   if not expected or len(expected&actual)/len(expected)<.8:raise ValueError('Provider name does not establish the exact issuer product; taxonomy change refused.')
   if meta.get('symbol')!=r['symbol'] or meta.get('exchangeName') not in r.get('yahooExchanges',[]) or meta.get('currency') not in [r['currency'],r.get('sourceCurrency'),'GBp' if r['currency']=='GBP' else r['currency']]:raise ValueError('Exact symbol, venue or currency mismatch')
   body=download(r['sourceUrl'],max_bytes=12_000_000,max_attempts=1,timeout=25);text=pdf_text(body) if body.startswith(b'%PDF-') else body.decode('utf-8',errors='replace')
   compact=re.sub(r'\s+','',text).upper()
   if r['isin'] not in compact:raise ValueError('Exact ISIN not found in the freshly retrieved issuer document')
   proof=hashlib.sha256(body).hexdigest();(folder/(proof+'.bin')).write_bytes(body);record.update(identityResponseSha256=proof,identityProofFile='provider-type-proofs/'+proof+'.bin')
   financial=r['instrumentType']
   if financial=='ETF' and re.search(r'\bETC\b|exchange.traded commodit',text,re.I):financial='ETC'
   if meta.get('instrumentType') not in ['EQUITY','ETF']:raise ValueError('Unsupported provider security taxonomy')
   record.update(status='approved',financialInstrumentType=financial,reason='Exact issuer ISIN + non-generic product name + exact source symbol/venue/currency; provider label retained separately from financial type.')
  except Exception as e:record['reason']=str(e)
  return record
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(review,candidates))
 write_json_atomic(FOLDER/'provider-type-reviews.json',{'version':1,'generatedAt':now.isoformat(),'reviews':results})
 print(json.dumps({'examined':len(results),'approved':sum(r['status']=='approved' for r in results),'unresolved':sum(r['status']!='approved' for r in results)},ensure_ascii=False))
if __name__=='__main__':main()
