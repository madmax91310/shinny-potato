"""Stage known missing funds; promote only complete qualified observations."""
import datetime as dt
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from collect_wisdomtree_holdings import collect,known_shares
from discover_lg_holdings import known_shares as lg_shares, collect as collect_lg
from data_automation import write_json_atomic
ROOT=Path(__file__).resolve().parents[1]

def discover(shares,configured,holdings,now,fetch=collect):
    def one(share):
        row={'isin':share['isin'],'sourceUrl':share['sourceUrl'],'lastAttemptAt':now.isoformat(),'qualification':'complete-holdings-discovery','financialDataQualified':False}
        if share['isin']in configured:return {**row,'status':'active-collector','lastAttemptAt':None,'lastSuccessAt':holdings.get(share['isin'],{}).get('checkedAt')}
        try:
            value=collect_lg(share,now) if share.get('parser')=='lg-api' else fetch(share,now)
            if value.get('complete')is not True or not value.get('rows')or value['asOf']>now.date().isoformat():raise ValueError('Incomplete/future discovered observation')
            if holdings.get(share['isin'],{}).get('asOf','')>value['asOf']:raise ValueError('Date regression')
            return {**row,'status':'qualified','financialDataQualified':True,'observation':value}
        except Exception as e:return {**row,**getattr(e,'evidence',{}),'status':'qualification-required','error':str(e)[:800]}
    report=list(ThreadPoolExecutor(max_workers=3).map(one,shares))
    enabled=dict(configured);records=dict(holdings)
    for share,row in zip(shares,report):
        if not row['financialDataQualified']:continue
        records[share['isin']]={**row.pop('observation'),'checkedAt':now.isoformat()}
        enabled[share['isin']]={k:share[k]for k in ['isin','name','currency','sourceUrl','provider']}
        enabled[share['isin']]['parser']='wisdomtree-complete'
    return enabled,records,{'schemaVersion':1,'checkedAt':now.isoformat(),'observations':{r['isin']:r for r in report},
      'method':'Known catalogue shares only. Missing identities or inconsistent holdings remain pending. Access checks never qualify financial data.'}

def main():
    staged=known_shares()
    catalogue_error=None
    try:staged+=lg_shares()
    except Exception as error:catalogue_error=str(error)[:800]
    config=ROOT/'scripts/generated-holdings-sources.json';raw=ROOT/'src/data/dca-complete-holdings.json'
    enabled,records,report=discover(staged,json.loads(config.read_text()),json.loads(raw.read_text()),dt.datetime.now(dt.timezone.utc))
    if catalogue_error:
        for share in [s for name in ['additional-etf-sources.json','exposure-etf-expansion.json','non-bond-expansion-sources.json']for s in json.loads((ROOT/'scripts'/name).read_text())['instruments']]:
            if share.get('parser')=='lg-api':
                report['observations'][share['isin']]={'isin':share['isin'],'sourceUrl':share['sourceUrl'],
                    'lastAttemptAt':report['checkedAt'],'qualification':'complete-holdings-discovery',
                    'financialDataQualified':False,'status':'qualification-required','error':'L&G catalogue unavailable: '+catalogue_error}
    write_json_atomic(config,enabled);write_json_atomic(raw,records)
    write_json_atomic(ROOT/'public/data/holdings-discovery.json',report)
    print('Holdings discovery:',{s:sum(r['status']==s for r in report['observations'].values())for s in ['qualified','qualification-required','active-collector']})
if __name__=='__main__':main()
