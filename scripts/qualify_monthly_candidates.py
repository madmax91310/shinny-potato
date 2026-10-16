"""Qualify missing exact ETF listings; publish only complete, cross-checked histories."""
import argparse
import datetime as dt
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote
from data_automation import get_json, month_shift, UTC, write_json_atomic
from refresh_monthly_history import collect_one
ROOT=Path(__file__).resolve().parents[1]

def qualify(source, now, fetch=get_json, collect=collect_one):
    c=dict(source)
    url='https://query2.finance.yahoo.com/v8/finance/chart/'+quote(c['symbol'])+'?range=1mo&interval=1mo'
    meta=fetch(url)['chart']['result'][0]['meta']
    if meta['symbol']!=c['symbol'] or meta['currency']!=c['currency'] or meta['instrumentType']!='ETF':
        raise ValueError('Listing identity/type/currency mismatch; no replacement guessed')
    first=dt.datetime.fromtimestamp(meta['firstTradeDate'],UTC)
    start=month_shift(dt.datetime(first.year,first.month,1,tzinfo=UTC),1)
    c['periodStart']=max('2015-01',start.strftime('%Y-%m'))
    if c['periodStart']>=now.strftime('%Y-%m'):raise ValueError('No completed historical month')
    c['verifyMonthlyDisagreements']=True
    result=collect(c,now)
    from refresh_anniversary_levels import collect_one as collect_level
    result['qualifiedAnniversary']=collect_level({**c,'field':'close'},now)
    return c,result

def apply_qualified(rows):
    def read(path):return json.loads((ROOT/path).read_text())
    config=read('scripts/monthly-automation.json');records=read('src/data/automated-etf-monthly.json');evidence=read('scripts/source-snapshots/monthly-automated.json')
    identities=read('src/data/auto-history-identities.json')
    levels=read('src/data/anniversary-levels.json')
    for source,result in rows:
        if source['id'] in records or any(r['id']==source['id'] for r in config['series']):continue
        if not result.get('proofRows') or not result.get('responseSha256'):raise ValueError('Missing monthly qualification proof')
        if result['periodStart']!=source['periodStart'] or result['isin']!=source['isin']:raise ValueError('Qualified history identity changed')
        level=result.get('qualifiedAnniversary')
        if not level or level.get('isin')!=source['isin']:raise ValueError('Missing qualified daily anniversary close')
        levels[source['id']]=level
        config['series'].append(source)
        records[source['id']]={k:v for k,v in result.items() if k not in ['proofRows','rawResponse','qualifiedAnniversary']}
        evidence[source['id']]={k:v for k,v in result.items() if k not in ['rawResponse','points','anniversaryPoints','qualifiedAnniversary']}
        identities[source['id']]=dict(icon='📊',scene='world',title=source['ticker'],ticker=source['ticker'],instrumentType='ETF')
    for path,data in [('scripts/monthly-automation.json',config),('src/data/automated-etf-monthly.json',records),('scripts/source-snapshots/monthly-automated.json',evidence),('src/data/auto-history-identities.json',identities),('src/data/anniversary-levels.json',levels)]:write_json_atomic(ROOT/path,data)

def main():
    p=argparse.ArgumentParser();p.add_argument('--candidates',type=Path,required=True);p.add_argument('--limit',type=int,default=12);p.add_argument('--apply',action='store_true');a=p.parse_args()
    path=ROOT/'scripts/source-snapshots/monthly-qualification-status.json';status=json.loads(path.read_text()) if path.exists() else {}
    candidates=sorted(json.loads(a.candidates.read_text()),key=lambda c:(status.get(c['isin'],{}).get('checkedAt',''),c['isin']))[:a.limit]
    now=dt.datetime.now(UTC)
    def one(c):
        try:return c,qualify(c,now),None
        except Exception as e:return c,None,str(e)
    with ThreadPoolExecutor(max_workers=3)as pool:results=list(pool.map(one,candidates))
    valid=[]
    successful={c['isin'] for c,result,error in results if result}
    for c,result,error in results:
        if error and c['isin'] in successful:continue
        status[c['isin']]=dict(checkedAt=now.isoformat(),status='failed' if error else 'validated',reason=error)
        if result:valid.append(result)
    if a.apply:
        apply_qualified(valid);write_json_atomic(path,status)
    print(json.dumps({'attempted':len(results),'qualified':[s['isin'] for s,r in valid],'pending':[{'isin':c['isin'],'reason':error} for c,result,error in results if error]}))
    # Unqualified candidates never enter the active registry; retained in status and
    # retried in age order. A pending candidate is not a failed active collection.
if __name__=='__main__':main()
