"""Recollect each original financial case without changing histories or declaring residuals explained."""
import argparse,concurrent.futures,datetime as dt,gzip,hashlib,json,pathlib,threading
from urllib.parse import quote,urlencode
ROOT=pathlib.Path(__file__).resolve().parents[1]


def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
    rawdir=a.output/'raw';rawdir.mkdir(exist_ok=True);manifest=[];lock=threading.Lock()
    def capture(fetch):
        def wrapped(url,*args,**kwargs):
            value=fetch(url,*args,**kwargs)
            data=value if isinstance(value,bytes) else value.encode() if isinstance(value,str) else json.dumps(value,sort_keys=True,separators=(',',':')).encode()
            digest=hashlib.sha256(data).hexdigest()
            with lock:
                (rawdir/(digest+'.gz')).write_bytes(gzip.compress(data,mtime=0))
                manifest.append({'sourceUrl':url,'sha256':digest,'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat()})
            return value
        return wrapped
    import data_automation as transport,issuer_documents as documents
    transport.get_json=capture(transport.get_json);transport.get_text=capture(transport.get_text);documents.download=capture(documents.download)
    from refresh_additional_etf import collect_one as additional
    from collect_exposure_expansion import collect as expansion
    from collect_non_bond_expansion import collect_one as nonbond
    from collect_amundi_etf import collect as amundi
    from collect_etf_pilot import collect as ishares
    from collect_ssga_etf import collect as ssga
    from market_transport import chart_response
    from refresh_monthly_history import yahoo_chart
    original=json.loads((ROOT/'reports/reliquat-2026-10-23/reconciliation-90-ecarts.json').read_text())['cases']
    configs={}
    for file,adapter in [('etf-pilot.json',lambda s,n:ishares({'instruments':[s]},{},n)['shares'][0]),
                         ('ssga-etf.json',lambda s,n:ssga({'instruments':[s]},n)['shares'][0]),
                         ('amundi-etf.json',lambda s,n:amundi({'instruments':[s]},n)['shares'][0]),
                         ('additional-etf-sources.json',additional),('exposure-etf-expansion.json',expansion),
                         ('non-bond-expansion-sources.json',nonbond)]:
        for s in json.loads((ROOT/'scripts'/file).read_text())['instruments']:configs[s['isin']]=(s,adapter)
    now=dt.datetime.now(transport.UTC)
    def one(isin):
        cases=[r for r in original if r['isin']==isin];result={'isin':isin,'attemptedAt':now.isoformat()}
        try:
            source,adapter=configs[isin];value=adapter(source,now)
            if value.get('isin')!=isin and value.get('productId')!=isin:raise ValueError('Unbound official share identity')
            performance=value.get('performance')
            if not performance or not performance.get('years'):raise ValueError('No qualified exact-share official calendar')
            result['official']={'status':'validated','record':performance,'sourceUrl':performance.get('sourceUrl',value.get('sourceUrl'))}
        except Exception as e:result['official']={'status':'blocked','error':str(e)}
        symbol=cases[0]['marketSymbol'];currency=cases[0]['currency']
        start=dt.datetime.fromisoformat(min(r['marketStartDate'] for r in cases)).replace(tzinfo=transport.UTC)-dt.timedelta(days=3)
        end=dt.datetime.fromisoformat(max(r['marketEndDate'] for r in cases)).replace(tzinfo=transport.UTC)+dt.timedelta(days=4)
        url='https://query2.finance.yahoo.com/v8/finance/chart/'+quote(symbol,safe='')+'?'+urlencode({'period1':int(start.timestamp()),'period2':int(end.timestamp()),'interval':'1d','events':'div,splits'})
        try:
            payload,actual=chart_response(url,transport.get_json)
            rows,zone=yahoo_chart(payload,{'symbol':symbol,'currency':currency,'field':'adjclose'},'1d')
            bydate={str(d):{'close':close,'adjusted':adj} for d,close,adj in rows}
            result['market']={'status':'provider-validated','sourceUrl':actual,'symbol':symbol,'currency':currency,'timezone':zone,'events':payload['chart']['result'][0].get('events',{}),'boundaries':{d:bydate.get(d) for r in cases for d in [r['marketStartDate'],r['marketEndDate']]},'independentExchangeProof':False}
        except Exception as e:result['market']={'status':'blocked','sourceUrl':url,'error':str(e)}
        return result
    observations=list(concurrent.futures.ThreadPoolExecutor(4).map(one,sorted({r['isin'] for r in original})))
    indexed={r['isin']:r for r in observations};cases=[]
    for old in original:
        obs=indexed[old['isin']];row={'isin':old['isin'],'year':old['year'],'symbol':old['marketSymbol'],'initialStatus':old['status'],'status':old['status'],'initialGapPp':old.get('recollectedDifferencePp'),'missingPiece':old.get('missingPiece'),'officialStatus':obs['official']['status'],'marketStatus':obs['market']['status'],'newCauseDemonstrated':False}
        points=obs['market'].get('boundaries',{});start=points.get(old['marketStartDate']);end=points.get(old['marketEndDate'])
        if start and end:
            row.update(recollectedAdjustedReturn=(end['adjusted']/start['adjusted']-1)*100,recollectedRawCloseReturn=(end['close']/start['close']-1)*100,start=start,end=end)
        record=obs['official'].get('record',{});row['currentPublishedAnnual']=record.get('years',{}).get(str(old['year']))
        if row.get('currentPublishedAnnual') is not None and record.get('currency')==old['navCurrency'] and row.get('recollectedAdjustedReturn') is not None:
            # Original dated FX is retained as evidence; no spot conversion of a return.
            row['officialAnnualChangePp']=row['currentPublishedAnnual']-old['recollectedNavReturn']
        row['result']='New provider observations do not supply independent exchange closing prices, historic quote currency or official adjustment factors; initial case remains open.' if old['status']!='erreur corrigée' else 'Previously demonstrated cause retained; original alert preserved.'
        cases.append(row)
    report={'attemptedAt':now.isoformat(),'observations':observations,'cases':cases,'summary':{'originalCases':len(cases),'officialCalendarsValidated':sum(r['official']['status']=='validated' for r in observations),'providerHistoriesValidated':sum(r['market']['status']=='provider-validated' for r in observations),'newCausesDemonstrated':0,'publication':'not-requested'}}
    (a.output/'observation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(a.output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(report['summary']));print(json.dumps(cases,ensure_ascii=False))
    return int(any(r['official']['status']!='validated' or r['market']['status']!='provider-validated' for r in observations))
if __name__=='__main__':raise SystemExit(main())
