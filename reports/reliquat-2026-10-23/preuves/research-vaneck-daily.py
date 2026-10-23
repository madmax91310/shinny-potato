import sys,pathlib,json,gzip,hashlib,urllib.parse,concurrent.futures,datetime as dt
ROOT=pathlib.Path(__file__).resolve().parents[3];sys.path.insert(0,str(ROOT/'scripts'));from issuer_documents import download
from issuer_nav_history import xlsx_rows,dated
from data_automation import get_json
from bs4 import BeautifulSoup
p=ROOT/'reports/reliquat-2026-10-23/preuves';shares={r['isin']:r for f in ['scripts/additional-etf-sources.json','scripts/exposure-etf-expansion.json']for r in json.load(open(f))['instruments']if r.get('isin')in ['IE000M7V94E1','IE000YU9K6K2','IE00BQQP9F84','IE00BYWQWR46']}
def one(item):
 isin,s=item;now=dt.datetime.now(dt.timezone.utc);proof={'isin':isin,'checkedAt':now.isoformat(),'pageUrl':s['pageUrl']}
 try:
  raw=download(s['pageUrl']);soup=BeautifulSoup(raw,'html.parser');assert isin in soup.get_text();block=soup.find('ve-histopricesblock');ticker=soup.find('ve-fundticker').get_text(strip=True);assert ticker==s['apiTicker']
  url='https://www.vaneck.com/Main/HistoPricesBlock/GetContent/?'+urllib.parse.urlencode({'blockid':block['data-blockid'],'pageid':block['data-pageid'],'ticker':ticker});meta=get_json(url)['data'];assert meta['CurrencyName']=='USD'and meta['Ticker']==ticker
  path=meta['DownloadUrl'];assert path.startswith('/ucits/investments/')and path.endswith('/downloads/fundhistoprices/')
  data=download('https://www.vaneck.com'+path);rows=xlsx_rows(data);title=rows[0].get('A');assert s['name'].lower()in title.lower(),title
  nav=dated([(dt.datetime.strptime(r['A'],'%d/%m/%Y').date().isoformat(),r['B'])for r in rows if __import__('re').fullmatch(r'\d{2}/\d{2}/\d{4}',r.get('A',''))],now)
  file=isin+'-vaneck-daily.xlsx';(p/file).write_bytes(data);(p/(isin+'-vaneck-daily-meta.json')).write_text(json.dumps(meta,indent=2));proof.update(ok=True,sourceUrl='https://www.vaneck.com'+path,file=file,title=title,currency='USD',sha256=hashlib.sha256(data).hexdigest(),pageSha256=hashlib.sha256(raw).hexdigest(),first=min(nav),last=max(nav),observations=len(nav));print(isin,'OK',len(nav),flush=True)
 except Exception as e:proof.update(ok=False,reason=str(e));print(isin,'FAILED',str(e),flush=True)
 return proof
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:results=list(pool.map(one,shares.items()))
(p/'vaneck-daily-collectes.json').write_text(json.dumps(results,indent=2)+'\n')
