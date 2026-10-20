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
from refresh_monthly_history import yahoo_chart, msci_rows, get_msci_json

ROOT = pathlib.Path(__file__).resolve().parents[1]
IDS = {'ethereum','stoxx600','sp500','msciWorld','nasdaq100','soxx','silver','apple','microsoft','broadcom','tesla','berkshire','asml','msciEmerging','msciWorldSmallCap','msciAcwi','msciAcwiImi','msciWorldExUsa','nvidia','amazon','google','meta','lvmh','airliquide','netflix','visa','cocacola','costco','mcdonalds','intel','paypal','schneider','hermes','loreal','nestle','sap'}

def configurations():
    sources = json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']
    etfs = [s for s in sources if s.get('consumerScope') == 'catalog' and s.get('collectAnniversary')]
    active = json.loads((ROOT/'src/data/automated-monthly.json').read_text())
    equities = [s for s in sources if s.get('consumerScope') == 'equity' and s['id'] in active]
    sources = [{**s, 'field': 'close'} for s in sources if s['id'] in IDS or s in etfs or s in equities]
    # XNDX publishes daily candles for its supported 1d/5d ranges, not arbitrary
    # period1/period2 windows. Its monthly economic series remains FRED XNDX.
    for source in sources:
        if source['id'] == 'nasdaq100':
            if (source.get('symbol'),source.get('currency'),source.get('variant'),source.get('seriesId')) != ('XNDX','USD','TOTAL','NASDAQXNDX'):
                reject('Nasdaq monthly/daily return convention differs')
            source.update(parser='yahoo',symbol='^XNDX',timezone='America/New_York')
    sources += [{'id':'bitcoin','label':'Bitcoin','parser':'yahoo','symbol':'BTC-USD','currency':'USD','field':'close','timezone':'UTC'},
                {'id':'cac40','label':'CAC 40','parser':'yahoo','symbol':'^FCHI','currency':'EUR','field':'close','timezone':'Europe/Paris'}]
    if {s['id'] for s in sources} != IDS | {'bitcoin','cac40'} | {s['id'] for s in etfs} | {s['id'] for s in equities}: reject('Configuration anniversaire incomplète')
    from refresh_anniversary_indices import configurations as index_configurations
    return sources + index_configurations()

def completed(rows, now, timezone='UTC'):
    today = now.astimezone(ZoneInfo(timezone)).date()
    candidates = [r for r in rows if r[0] < today]
    if not candidates: reject('Aucune séance terminée')
    day, value = max(candidates)
    if (today - day).days > 7: reject('Dernière séance trop ancienne')
    return day.isoformat(), number(value)

def collect_one(config, now, json_fetch=None, byte_fetch=download):
    start, end = now.date()-dt.timedelta(days=15), now.date()
    parser = config['parser']
    # Daily levels need the same bounded transient recovery as monthly MSCI
    # histories. Keep Yahoo on its existing retry policy and injected fetches
    # unchanged for deterministic validation.
    json_fetch = json_fetch or (get_msci_json if parser == 'msci' else get_json)
    if parser == 'yahoo':
        if config['id']=='nasdaq100':
            asof,value,url,body=xndx_supported_ranges(config,now,json_fetch)
        else:
            url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+quote(config['symbol'],safe='')+'?'+urlencode({
                'period1':int(dt.datetime.combine(start,dt.time(),UTC).timestamp()),
                'period2':int(dt.datetime.combine(end,dt.time(),UTC).timestamp()),'interval':'1d','events':'splits'})
            body=json_fetch(url); rows, zone=yahoo_chart(body,config,'1d')
            asof,value=completed([(r[0],r[1]) for r in rows],now,zone)
    elif parser == 'msci':
        url='https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?'+urlencode({
            'currency_symbol':config['currency'],'index_variant':config['variant'],'start_date':start.strftime('%Y%m%d'),
            'end_date':(end-dt.timedelta(days=1)).strftime('%Y%m%d'),'data_frequency':'DAILY','index_codes':config['indexCode']})
        body=json_fetch(url);rows=msci_rows(body,config)
        if any(not start <= day < end for day, _ in rows):
            reject('MSCI observations outside requested completed-session window')
        asof,value=completed(rows,now)
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
    elif parser in ('russell','ftse'):
        from refresh_anniversary_indices import ftse_rows
        rows,raw=ftse_rows(config,byte_fetch)
        url=config['sourceUrls'][-1]
        body={source:hashlib.sha256(document).hexdigest() for source,document in raw.items()}
        if parser=='russell': asof,value=completed(rows,now)
        else:
            cutoff=dt.date(now.year,now.month,1)
            finished=[(day,value) for day,value in rows if day<cutoff]
            if not finished:reject('No completed FTSE All-World month')
            day,value=max(finished)
            if (now.date()-day).days>45:reject('FTSE All-World month too old')
            asof=day.isoformat()
    else: reject('Source inconnue')
    return {'value':value,'asOf':asof,'currency':config['currency'],'parser':parser,
            'symbol':config.get('symbol'),'indexCode':config.get('indexCode'),'variant':config.get('variant'),
            'sourceUrl':url,'sha256':hashlib.sha256(json.dumps(body,sort_keys=True,allow_nan=False).encode()).hexdigest(),
            'method':('Clôture XNDX Total Return USD, dividendes bruts réinvestis ; fenêtres Yahoo prises en charge concordantes et séance terminée' if config.get('symbol')=='^XNDX' else 'Dernière séance terminée ; cours brut') if parser=='yahoo' else ('Niveau officiel de fin de mois, Total Return USD' if parser=='ftse' else 'Niveau officiel de fin de séance, variante exacte'),
            'maxAgeDays':45 if parser=='ftse' else 7,
            **({'sourceUrls':list(body['sources']),'sourceHashes':body['sources'],'quoteMethod':'supported-xndx-ranges'}if config['id']=='nasdaq100'and parser=='yahoo' else {}),
            **({key:config[key] for key in ('isin','ticker','mic','listingEvidenceId') if key in config} if config.get('isin') else {})}

XNDX_URLS=[f'https://query{host}.finance.yahoo.com/v8/finance/chart/%5EXNDX?range={window}&interval=1d&includePrePost=false'for host,window in [(1,'5d'),(2,'1d')]]

def xndx_supported_ranges(config,now,fetch):
    if (config.get('symbol'),config.get('currency'),config.get('variant'))!=('^XNDX','USD','TOTAL'):reject('Wrong XNDX convention')
    observations=[];proofs={}
    for url,window in zip(XNDX_URLS,['5d','1d']):
        data=fetch(url);rows,zone=yahoo_chart(data,config,'1d')
        payload=data['chart']['result'][0];meta=payload['meta']
        if (meta.get('instrumentType'),meta.get('longName'),meta.get('range'))!=('INDEX','NASDAQ-100 Total Return',window):reject('Wrong XNDX index or supported range')
        today=now.astimezone(ZoneInfo(zone)).date()
        candidates=[(r[0],r[1])for r in rows if r[0]<today]
        current=[r for r in rows if r[0]==today]
        if current:
            regular=meta.get('currentTradingPeriod',{}).get('regular',{})
            end=regular.get('end');start=regular.get('start');stamp=meta.get('regularMarketTime')
            if all(type(v)in (int,float)for v in [start,end,stamp]):
                close=dt.datetime.fromtimestamp(end,UTC).astimezone(ZoneInfo(zone))
                begin=dt.datetime.fromtimestamp(start,UTC).astimezone(ZoneInfo(zone))
                quote_time=dt.datetime.fromtimestamp(stamp,UTC).astimezone(ZoneInfo(zone))
                # Same-day bars are accepted only after the published session has
                # ended, with a matching post-close quote timestamp and price.
                finished=(begin.date()==close.date()==quote_time.date()==today and begin.time()==dt.time(9,30)
                    and close.time()in [dt.time(13),dt.time(16)] and end<=stamp<=now.timestamp()
                    and now.timestamp()>=end+900 and payload['timestamp'][-1]==stamp)
                if finished:
                    value=number(meta.get('regularMarketPrice'))
                    if abs(value-current[-1][1])>.005:reject('XNDX close and regular quote disagree')
                    candidates.append((today,current[-1][1]))
        if not candidates:reject('No completed XNDX session in supported range')
        day,value=max(candidates)
        if (today-day).days>7 or value<=0:reject('Stale or invalid XNDX close')
        observations.append((day.isoformat(),value))
        proofs[url]=hashlib.sha256(json.dumps(data,sort_keys=True,allow_nan=False).encode()).hexdigest()
    if observations[0]!=observations[1]:reject('Supported XNDX windows disagree')
    return observations[0][0],observations[0][1],XNDX_URLS[0],{'sources':proofs}

def xndx_source_upgrade(identifier,old,record):
    if identifier!='nasdaq100' or not old:return False
    convention=lambda r:tuple(r.get(k)for k in ('parser','symbol','currency','variant'))
    if convention(old)!=('fred','XNDX','USD','TOTAL')or old.get('seriesId')!='NASDAQXNDX':return False
    if convention(record)!=('yahoo','^XNDX','USD','TOTAL')or record.get('quoteMethod')!='supported-xndx-ranges':return False
    if any(old.get(k)!=record.get(k)for k in ('indexCode','isin','ticker','mic','listingEvidenceId')):return False
    sources=record.get('sourceHashes',{})
    return (set(sources)==set(XNDX_URLS)and record.get('sourceUrl')in sources
            and all(re.fullmatch(r'[a-f0-9]{64}',v or '')for v in sources.values()))


def refresh(current, now, collect=collect_one, selected=None):
    merged=current.copy();successes=[];errors=[]
    def one(config):
        try:return config['id'],collect(config,now),None
        except Exception as e:return config['id'],None,str(e)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for id_,record,error in pool.map(one,configurations() if selected is None else selected):
            if error:errors.append({'id':'anniversary-'+id_,'error':error});continue
            old=merged.get(id_)
            # Older equity/index observations predate exact-identity metadata.
            # Enrich absent identifiers while preserving the same quote convention;
            # an existing identifier must never change or disappear.
            convention_changed = old and (any(record.get(k)!=old.get(k) for k in ['currency','parser','symbol','indexCode','variant']) or
                any(old.get(k) is not None and record.get(k)!=old[k] for k in ['isin','ticker','mic','listingEvidenceId']))
            # One explicit transport migration; the economic index stays XNDX
            # Total Return USD. Every other convention change still fails closed.
            if xndx_source_upgrade(id_,old,record):convention_changed=False
            if old and (record['asOf'] < old['asOf'] or convention_changed):
                errors.append({'id':'anniversary-'+id_,'error':'Régression de date ou changement de convention'});continue
            merged[id_]=record;successes.append({'id':'anniversary-'+id_})
    # Gold retains its World Bank monthly average convention, never gold futures/spot.
    try:
        if selected is not None:return merged,{'checkedAt':now.isoformat(),'successes':successes,'errors':errors}
        gold=json.loads((ROOT/'src/data/worldbank-gold-monthly.json').read_text());period,value=gold['points'][-1]
        if gold.get('unit') != 'USD per troy ounce' or gold.get('column') != 'Gold' or not gold.get('url', '').startswith('https://thedocs.worldbank.org/'): reject('Identité ou unité de la moyenne d’or modifiée')
        if (now.date()-dt.date.fromisoformat(period+'-01')).days>75:reject('Moyenne mensuelle de l’or trop ancienne')
        if period >= now.strftime('%Y-%m'): reject('Moyenne mensuelle d’or inachevée')
        if merged.get('or', {}).get('asOf', '') > period: reject('Régression de la période de l’or')
        merged['or']={'value':number(value),'asOf':period,'currency':'USD','method':'Moyenne mensuelle Banque mondiale, USD par once',
                      'sourceUrl':gold['url'], 'sha256':gold['workbookSha256'],
                      'maxAgeDays':75}
        successes.append({'id':'anniversary-or'})
    except Exception as e:errors.append({'id':'anniversary-or','error':str(e)})
    return merged,{'checkedAt':now.isoformat(),'successes':successes,'errors':errors}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--output',required=True,type=pathlib.Path);p.add_argument('--only',nargs='+')
    args=p.parse_args();path=ROOT/'src/data/anniversary-levels.json';old=json.loads(path.read_text()) if path.exists() else {}
    selected=None
    if args.only:
        all_sources=configurations()
        if set(args.only)-{c['id']for c in all_sources}:reject('Unknown anniversary source selection')
        selected=[c for c in all_sources if c['id']in args.only]
    merged,report=refresh(old,dt.datetime.now(UTC),selected=selected);write_json_atomic(args.output,report)
    if args.apply and merged!=old:write_json_atomic(path,merged)
    print(json.dumps(report,ensure_ascii=False));return 1 if report['errors'] else 0

if __name__=='__main__':raise SystemExit(main())
