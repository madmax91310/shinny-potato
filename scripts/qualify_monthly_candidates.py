"""Qualify missing exact ETF listings; publish only complete, cross-checked histories."""
import argparse
import datetime as dt
import json
import sys
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
    expected_types = {'ETF','EQUITY'} if c.get('instrumentType') in ('ETC','ETN','ETP') and c.get('listingEvidenceId') and c.get('isin') else {'EQUITY'} if c.get('instrumentType')=='EQUITY' and c.get('consumerScope')=='equity' and c.get('listingEvidence',{}).get('isin')==c.get('isin') else {'ETF'}
    if (c.get('consumerScope')=='equity' and c.get('currency')=='GBP' and meta.get('currency')=='GBp'
            and c.get('listingEvidence',{}).get('exchange')=='London Stock Exchange'):
        c['currency']='GBp'
        c['quoteUnitEvidence']={'provider':'Yahoo chart metadata','currency':'GBp','sourceCurrency':'GBP','unitsPerCurrency':100,'symbol':meta.get('symbol')}
    if meta['symbol']!=c['symbol'] or meta['currency']!=c['currency'] or meta['instrumentType'] not in expected_types:
        raise ValueError('Listing identity/type/currency mismatch; no replacement guessed')
    c['yahooInstrumentType'] = meta['instrumentType']
    first_trade = meta.get('firstTradeDate')
    if not isinstance(first_trade,(int,float)) or isinstance(first_trade,bool):
        raise ValueError('Exact listing inception timestamp missing; no historical start guessed')
    first=dt.datetime.fromtimestamp(first_trade,UTC)
    start=month_shift(dt.datetime(first.year,first.month,1,tzinfo=UTC),1)
    c['periodStart']=max('2015-01',start.strftime('%Y-%m'))
    if c['periodStart']>=now.strftime('%Y-%m'):raise ValueError('No completed historical month')
    if c.get('consumerScope')!='equity':c['verifyMonthlyDisagreements']=True
    result=collect({**c,'qualifyContiguousSuffix':True},now)
    if result.get('qualificationCoverage'):
        c['periodStart']=result['periodStart']
        c['qualificationCoverage']=result['qualificationCoverage']
        if 'dailyWindowMonths' in c:
            c['dailyWindowMonths']=[key for key in c['dailyWindowMonths'] if key>=c['periodStart']]
            result['dailyWindowMonths']=c['dailyWindowMonths']
    result.pop('qualifyContiguousSuffix',None)
    from refresh_anniversary_levels import collect_one as collect_level
    result['qualifiedAnniversary']=collect_level({**c,'field':'close'},now)
    return c,result

def apply_qualified(rows):
    def read(path):return json.loads((ROOT/path).read_text())
    equities=read('src/data/automated-monthly.json')
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
        target=equities if source.get('consumerScope')=='equity' else records
        target[source['id']]={k:v for k,v in result.items() if k not in ['proofRows','rawResponse','qualifiedAnniversary']}
        evidence[source['id']]={k:v for k,v in result.items() if k not in ['rawResponse','points','anniversaryPoints','qualifiedAnniversary']}
        identities[source['id']]=dict(icon='📊',scene='world',title=source['ticker'],ticker=source['ticker'],instrumentType=source.get('instrumentType','ETF'))
    for path,data in [('src/data/automated-monthly.json',equities),('scripts/monthly-automation.json',config),('src/data/automated-etf-monthly.json',records),('scripts/source-snapshots/monthly-automated.json',evidence),('src/data/auto-history-identities.json',identities),('src/data/anniversary-levels.json',levels)]:write_json_atomic(ROOT/path,data)

def main():
    p=argparse.ArgumentParser();p.add_argument('--candidates',type=Path,required=True);p.add_argument('--limit',type=int,default=12);p.add_argument('--apply',action='store_true');a=p.parse_args()
    path=ROOT/'scripts/source-snapshots/monthly-qualification-status.json';status=json.loads(path.read_text()) if path.exists() else {}
    ordered=sorted(json.loads(a.candidates.read_text()),key=lambda c:(status.get(c['isin'],{}).get('checkedAt',''),c['isin']))
    # A part may have several documented symbols. Limit exact instruments rather
    # than consuming the entire quota with the first instrument's venues.
    selected=list(dict.fromkeys(c['isin'] for c in ordered))[:a.limit]
    candidates=[c for c in ordered if c['isin'] in selected]
    now=dt.datetime.now(UTC)
    def one(c):
        try:return c,qualify(c,now),None
        except Exception as e:return c,None,str(e)
    results=[]
    with ThreadPoolExecutor(max_workers=3)as pool:
        for index,row in enumerate(pool.map(one,candidates),1):
            results.append(row)
            if index%10==0 or index==len(candidates):print(f'Qualification progress: {index}/{len(candidates)}; {sum(result is not None for _,result,_ in results)} validated',file=sys.stderr,flush=True)
    valid=[]
    successful={c['isin'] for c,result,error in results if result}
    for c,result,error in results:
        if error and c['isin'] in successful:continue
        status[c['isin']]=dict(checkedAt=now.isoformat(),status='failed' if error else 'validated',reason=error)
        if result:valid.append(result)
    if a.apply:
        apply_qualified(valid);write_json_atomic(path,status)
    print(json.dumps({'attempted':len(results),'qualified':list(dict.fromkeys(s['isin'] for s,r in valid)),'pending':[{'isin':c['isin'],'reason':error} for c,result,error in results if error and c['isin'] not in successful],'rejectedAlternatives':[{'isin':c['isin'],'symbol':c['symbol'],'reason':error} for c,result,error in results if error and c['isin'] in successful]}))
    # Unqualified candidates never enter the active registry; retained in status and
    # retried in age order. A pending candidate is not a failed active collection.
if __name__=='__main__':main()
