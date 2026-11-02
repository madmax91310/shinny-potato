import sys,pathlib,json,gzip,datetime as dt,hashlib,concurrent.futures,re
sys.path.insert(0,str(pathlib.Path('scripts').resolve()))
from data_automation import get_json
from collect_vanguard_etf import fetch_api,parse_api
out=pathlib.Path('test-artifacts/financial-qualification');prior=json.load(open('reports/financial-consistency-2026-11-02/matrix.json'));ids={'IE00B4L5Y983','IE00BYYHSQ67','IE00B4ND3602','IE00BDBRDM35'}
def br(c):
 try:
  url=re.sub(r'component=[^&]+','component=keyFundFacts%2Cperformance',c['annual']['source']);body=get_json(url);raw=json.dumps(body,sort_keys=True,separators=(',',':')).encode();(out/(c['isin']+'-measure.json.gz')).write_bytes(gzip.compress(raw));co=body['componentsByNameMap'];facts=co['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap'];assert facts['isin']['value']==c['isin'];perf=co['performance']['containersByNameMap'];tab=perf.get('distributions',{}).get('subContainersByNameMap',{}).get('table',{}).get('dataPointsByNameMap',{});cash=[]
  if tab:
   for date,amount,ccy in zip(tab['exDate']['value'],tab['totalDistribution']['value'],tab['totalDistribution']['prefix']):
    if '2020'<=str(date)[:4]<='2025':cash.append({'exDate':str(date),'amount':amount,'currency':ccy.strip()})
  return {'isin':c['isin'],'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sourceUrl':url,'sha256':hashlib.sha256(raw).hexdigest(),'identity':facts['isin'],'useOfProfits':facts.get('useOfProfitsCode'),'calendarCurrency':perf['returns']['subContainersByNameMap']['calendar']['dataPointsByNameMap']['returnsByCurrency'],'cashEvents2020to2025':cash,'cashCompleteness':'Published table only; absence of older rows does not certify absence of payments'}
 except Exception as e:return {'isin':c['isin'],'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(4)as ex:r=list(ex.map(br,[c for c in prior['coverage']if c['isin']in ids]))
(out/'measure-sources.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(json.dumps(r,ensure_ascii=False,indent=2))
