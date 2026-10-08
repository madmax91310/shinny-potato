"""Latest completed-session levels using each historical series' exact currency and variant."""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote, urlencode
from zoneinfo import ZoneInfo
from data_automation import UTC, get_json, number, reject, write_json_atomic
from issuer_documents import download
from refresh_monthly_history import yahoo_chart, msci_rows

ROOT = pathlib.Path(__file__).resolve().parents[1]
IDS = {'ethereum','stoxx600','sp500','msciWorld','nasdaq100','soxx','silver','apple','microsoft','broadcom','tesla','berkshire','asml','msciEmerging','msciWorldSmallCap','msciAcwi','msciAcwiImi','msciWorldExUsa'}

def configurations():
    sources = json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']
    sources = [{**s, 'field': 'close'} for s in sources if s['id'] in IDS]
    sources += [{'id':'bitcoin','label':'Bitcoin','parser':'yahoo','symbol':'BTC-USD','currency':'USD','field':'close','timezone':'UTC'},
                {'id':'cac40','label':'CAC 40','parser':'yahoo','symbol':'^FCHI','currency':'EUR','field':'close','timezone':'Europe/Paris'}]
    if {s['id'] for s in sources} != IDS | {'bitcoin','cac40'}: reject('Configuration anniversaire incomplète')
    return sources

def completed(rows, now, timezone='UTC'):
    today = now.astimezone(ZoneInfo(timezone)).date()
    candidates = [r for r in rows if r[0] < today]
    if not candidates: reject('Aucune séance terminée')
    day, value = max(candidates)
    if (today - day).days > 7: reject('Dernière séance trop ancienne')
    return day.isoformat(), number(value)

def collect_one(config, now, json_fetch=get_json, byte_fetch=download):
    start, end = now.date()-dt.timedelta(days=15), now.date()
    parser = config['parser']
    if parser == 'yahoo':
        url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+quote(config['symbol'],safe='')+'?'+urlencode({
            'period1':int(dt.datetime.combine(start,dt.time(),UTC).timestamp()),
            'period2':int(dt.datetime.combine(end,dt.time(),UTC).timestamp()),'interval':'1d','events':'splits'})
        body=json_fetch(url); rows, zone=yahoo_chart(body,config,'1d')
        asof,value=completed([(r[0],r[1]) for r in rows],now,zone)
    elif parser == 'msci':
        url='https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?'+urlencode({
            'currency_symbol':config['currency'],'index_variant':config['variant'],'start_date':start.strftime('%Y%m%d'),
            'end_date':(end-dt.timedelta(days=1)).strftime('%Y%m%d'),'data_frequency':'DAILY','index_codes':config['indexCode']})
        body=json_fetch(url);asof,value=completed(msci_rows(body,config),now)
    elif parser == 'stoxx':
        url=config['sourceUrl']; raw=byte_fetch(url)
        if raw[:2] == b'\x1f\x8b':
            import gzip
            raw=gzip.decompress(raw)
        if len(raw)>8_000_000:reject('Document STOXX trop volumineux')
        text=raw.decode()
        if "window.index_isin = '"+config['isin']+"'" not in text or 'id="overview-symbol">'+config['symbol']+'<' not in text or 'EUR (Net Return)' not in text:
            reject('Identité ou variante STOXX incorrecte')
        arrays=re.findall(r'window\.chart_data\s*=\s*(\[\[.*?\]\]);',text)
        if not arrays or any(json.loads(a)!=json.loads(arrays[0]) for a in arrays):reject('Tables STOXX contradictoires/absentes')
        body=json.loads(arrays[0]); stamps=[r[0] for r in body]
        if stamps!=sorted(set(stamps)):reject('Séances STOXX dupliquées/désordonnées')
        asof,value=completed([(dt.datetime.fromtimestamp(number(t)/1000,UTC).date(),number(v)) for t,v in body],now)
    else: reject('Source inconnue')
    return {'value':value,'asOf':asof,'currency':config['currency'],'parser':parser,
            'symbol':config.get('symbol'),'indexCode':config.get('indexCode'),'variant':config.get('variant'),
            'sourceUrl':url,'sha256':hashlib.sha256(json.dumps(body,sort_keys=True,allow_nan=False).encode()).hexdigest(),
            'method':'Dernière séance terminée ; cours brut' if parser=='yahoo' else 'Niveau officiel de fin de séance, variante exacte',
            'maxAgeDays':7}

def refresh(current, now, collect=collect_one):
    merged=current.copy();successes=[];errors=[]
    def one(config):
        try:return config['id'],collect(config,now),None
        except Exception as e:return config['id'],None,str(e)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for id_,record,error in pool.map(one,configurations()):
            if error:errors.append({'id':'anniversary-'+id_,'error':error});continue
            old=merged.get(id_)
            if old and (record['asOf'] < old['asOf'] or any(record.get(k)!=old.get(k) for k in ['currency','parser','symbol','indexCode','variant'])):
                errors.append({'id':'anniversary-'+id_,'error':'Régression de date ou changement de convention'});continue
            merged[id_]=record;successes.append({'id':'anniversary-'+id_})
    # Gold retains its World Bank monthly average convention, never gold futures/spot.
    try:
        gold=json.loads((ROOT/'src/data/worldbank-gold-monthly.json').read_text());period,value=gold['points'][-1]
        if (now.date()-dt.date.fromisoformat(period+'-01')).days>75:reject('Moyenne mensuelle de l’or trop ancienne')
        if period >= now.strftime('%Y-%m'): reject('Moyenne mensuelle d’or inachevée')
        if merged.get('or', {}).get('asOf', '') > period: reject('Régression de la période de l’or')
        merged['or']={'value':number(value),'asOf':period,'currency':'USD','method':'Moyenne mensuelle Banque mondiale, USD par once',
                      'sourceUrl':gold.get('sourceUrl','https://thedocs.worldbank.org/en/doc/5d903e848db1d1b83e0ec8f744e55570-0350012021/related/CMO-Historical-Data-Monthly.xlsx'),
                      'maxAgeDays':75}
        successes.append({'id':'anniversary-or'})
    except Exception as e:errors.append({'id':'anniversary-or','error':str(e)})
    return merged,{'checkedAt':now.isoformat(),'successes':successes,'errors':errors}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--output',required=True,type=pathlib.Path)
    args=p.parse_args();path=ROOT/'src/data/anniversary-levels.json';old=json.loads(path.read_text()) if path.exists() else {}
    merged,report=refresh(old,dt.datetime.now(UTC));write_json_atomic(args.output,report)
    if args.apply and merged!=old:write_json_atomic(path,merged)
    print(json.dumps(report,ensure_ascii=False));return 1 if report['errors'] else 0

if __name__=='__main__':raise SystemExit(main())
