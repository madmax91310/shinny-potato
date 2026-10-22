"""Exact daily adjusted closes + ECB daily FX, isolated from existing monthly tools."""
import argparse
import copy
import datetime as dt
import hashlib
import json
import pathlib
import subprocess
import xml.etree.ElementTree as ET
from urllib.parse import quote, urlencode
from zoneinfo import ZoneInfo
import exchange_calendars as xc
from data_automation import UTC, get_json, write_json_atomic
from issuer_documents import download
from market_transport import chart_response
from refresh_monthly_history import yahoo_chart
from ai_portfolio_series import hydrate, persist
from ai_portfolio_fx import enrich_twd, validate_fx_date
from ai_portfolio_catalogue import compact_catalogue

ROOT = pathlib.Path(__file__).resolve().parents[1]
ECB = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml'


def sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def calendars(universe, start, end, bounds=None):
    result = {}
    for name in sorted({a['calendar'] for a in universe}):
        if name == '24/7':
            if bounds is not None:bounds[name]={'from':start,'through':end}
            date=dt.date.fromisoformat(start); result[name]={}
            while date<=dt.date.fromisoformat(end):
                result[name][date.isoformat()]=dt.datetime.combine(date+dt.timedelta(days=1),dt.time(),tzinfo=UTC).isoformat()
                date+=dt.timedelta(days=1)
            continue
        # Precomputed holiday calendars may end before our requested future horizon.
        # Qualify their real coverage, and make that bound enforceable by accounting.
        probe=xc.get_calendar(name,start=start,end=(dt.date.fromisoformat(start)+dt.timedelta(days=7)).isoformat())
        maximum=probe.bound_max() if callable(getattr(probe,'bound_max',None)) else None
        effective_end=min(dt.date.fromisoformat(end),maximum.date()) if maximum is not None else dt.date.fromisoformat(end)
        padded_end=min(effective_end+dt.timedelta(days=7),maximum.date()) if maximum is not None else effective_end+dt.timedelta(days=7)
        cal = xc.get_calendar(name,start=(dt.date.fromisoformat(start)-dt.timedelta(days=7)).isoformat(),end=padded_end.isoformat())
        if bounds is not None:bounds[name]={'from':start,'through':effective_end.isoformat()}
        result[name] = {s.date().isoformat(): cal.session_close(s).isoformat()
                        for s in cal.sessions_in_range(start, effective_end.isoformat())}
    corrections=json.loads((ROOT/'scripts/ai-calendar-corrections.json').read_text())['closures']
    for name,closures in corrections.items():
        for date in closures:
            if name in result:result[name].pop(date,None)
    return result


def parse_prices(raw, asset, calendar, now, previous=None, through=None):
    if asset.get('yahooExchanges') and raw['chart']['result'][0]['meta'].get('exchangeName') not in asset['yahooExchanges']:
        raise ValueError('Place retournée différente : '+str(raw['chart']['result'][0]['meta'].get('exchangeName')))
    if asset.get('yahooExchange') and raw['chart']['result'][0]['meta'].get('exchangeName')!=asset['yahooExchange']:
        raise ValueError('Place de cotation action différente de la place qualifiée')
    meta=raw['chart']['result'][0]['meta']
    provider_name=meta.get('longName') or meta.get('shortName')
    if asset.get('qualifiedProviderName') and provider_name!=asset['qualifiedProviderName']:
        raise ValueError('Nom du produit différent de la revue de classification fournisseur.')
    if previous and previous.get('providerIdentityName') and previous['providerIdentityName']!=provider_name:
        raise ValueError('Identité fournisseur modifiée : changement de nom / ticker à revoir explicitement.')
    if previous and previous.get('providerFirstTradeDate') and previous['providerFirstTradeDate']!=meta.get('firstTradeDate'):
        raise ValueError('Première cotation fournisseur modifiée : possible réutilisation du ticker.')
    source_currency=asset.get('sourceCurrency') or asset['currency']
    completed = {d: close for d, close in calendar.items() if (through is None or d<=through) and dt.datetime.fromisoformat(close) + dt.timedelta(hours=2) < now}
    # Ignore observations outside this accounting cutoff BEFORE duplicate checks.
    # ASX can return two changing bars for today's session; neither is a completed
    # observation for yesterday's report. Historical conflicting bars still fail.
    data=raw['chart']['result'][0];stamps=data.get('timestamp',[]);tz=ZoneInfo(meta['exchangeTimezoneName'])
    keep=[]
    for i,t in enumerate(stamps):
        day=dt.datetime.fromtimestamp(t,UTC).astimezone(tz).date().isoformat()
        if through is not None and day>through:continue
        if day in calendar and day not in completed:continue
        keep.append(i)
    validated=raw
    if len(keep)!=len(stamps):
        indicators=copy.deepcopy(data.get('indicators',{}))
        for groups in indicators.values():
            for group in groups:
                for key,values in group.items():
                    if isinstance(values,list):
                        if len(values)!=len(stamps):raise ValueError('Inconsistent daily observation arrays')
                        group[key]=[values[i] for i in keep]
        validated={'chart':{**raw['chart'],'result':[{**data,'timestamp':[stamps[i] for i in keep],'indicators':indicators}]}}
    # GBp/GBX are source units; normalization is explicit and applied to both prices.
    config={**asset,'currency':source_currency,'field':'close' if asset['instrumentType']=='CRYPTOCURRENCY' else 'adjclose','yahooInstrumentType':asset.get('yahooInstrumentType',asset['instrumentType'])}
    rows, zone = yahoo_chart(validated, config, '1d')
    scale=asset.get('priceScale',1)
    rows=[(d,c*scale,a*scale) for d,c,a in rows]
    if meta.get('firstTradeDate'):
        first_trade=dt.datetime.fromtimestamp(meta['firstTradeDate'],UTC).astimezone(ZoneInfo(zone)).date()
        rows=[(d,c,a) for d,c,a in rows if d>=first_trade]
    unexpected=[d.isoformat() for d,_,_ in rows if d.isoformat() not in calendar and d<now.date()]
    if unexpected:raise ValueError('Observations hors séances certifiées : '+', '.join(unexpected[:10]))
    valid = [(d.isoformat(), close, adjusted) for d, close, adjusted in rows if d.isoformat() in completed]
    if len(valid) < 20:
        raise ValueError('Moins de 20 clôtures quotidiennes achevées')
    if any(close <= 0 or adj <= 0 for _, close, adj in valid):
        raise ValueError('Prix quotidien non positif')
    anchor = previous['anchorDate'] if previous else valid[0][0]
    values = {d: adj for d, _, adj in valid}
    if anchor not in values:
        raise ValueError('Séance d’ancrage absente ; aucun changement de base autorisé')
    # Require every expected session over the entire retained history, holidays excluded.
    missing = sorted(set(d for d in completed if d >= anchor) - set(values))
    if missing:
        raise ValueError('Clôtures attendues manquantes : '+', '.join(missing[:10]))
    points = {d: {'close': close, 'adjusted': adj, 'synthetic': 100 * adj / values[anchor]}
              for d, close, adj in valid if d >= anchor}
    return {'qualified': True, 'anchorDate': anchor, 'timezone': zone, 'points': points,
            'convention': 'synthetic-total-return-100-at-anchor', 'responseSha256': sha(raw), 'minimumUseDate': anchor, 'sourceCurrency': source_currency, 'priceScale':scale,'providerIdentityName':provider_name,'providerFirstTradeDate':meta.get('firstTradeDate')}


def parse_fx(body, now, start=None):
    root = ET.fromstring(body)
    if root.tag != '{http://www.gesmes.org/xml/2002-08-01}Envelope':
        raise ValueError('Document BCE incorrect')
    ns = '{http://www.ecb.int/vocabulary/2002-08-01/eurofxref}'
    rates = {}
    for cube in root.iter(ns+'Cube'):
        date = cube.attrib.get('time')
        if not date:
            continue
        if date in rates or dt.date.fromisoformat(date) > now.date():
            raise ValueError('Date BCE future ou dupliquée')
        row = {c.attrib['currency']: float(c.attrib['rate']) for c in cube}
        if not all(0 < row.get(c, 0) < 1e9 for c in ['USD', 'GBP', 'CHF']) or any(not 0<v<1e9 for v in row.values()):
            raise ValueError('Change BCE absent ou incohérent')
        rates[date] = row
    if not rates:
        raise ValueError('Série BCE vide')
    # TARGET holidays: the ECB does not publish on these days.
    from dateutil.easter import easter
    def expected(date):
        e = easter(date.year)
        return date.weekday() < 5 and (date.month,date.day) not in [(1,1),(5,1),(12,25),(12,26)] and date not in [e-dt.timedelta(days=2),e+dt.timedelta(days=1)]
    cutoff = now.date() if now.hour >= 18 else now.date()-dt.timedelta(days=1)
    latest = cutoff
    while not expected(latest):
        latest -= dt.timedelta(days=1)
    if latest.isoformat() not in rates:
        raise ValueError('Dernier change BCE attendu manquant : '+latest.isoformat())
    expected_dates=[]
    date=dt.date.fromisoformat(start) if start else now.date()-dt.timedelta(days=100)
    while date<=cutoff:
        if expected(date):
            expected_dates.append(date.isoformat())
            if date.isoformat() not in rates:
                raise ValueError('Change BCE attendu manquant : '+date.isoformat())
        date+=dt.timedelta(days=1)
    return {'expectedDates':expected_dates, 'sourceUrl': ECB, 'convention': 'currency per EUR; ECB reference, not closing FX',
            'validThrough': cutoff.isoformat(), 'rates': rates, 'responseSha256': hashlib.sha256(body).hexdigest()}


def collect(previous, universe, now, fetch=get_json, fetch_ecb=download, required=None):
    today = now.date()
    # Full anchor history is needed to normalize Yahoo back-adjustments consistently.
    # One bounded request per exact instrument (not per participant); no unrelated assets.
    start = previous.get('calendarFrom', (today-dt.timedelta(days=100)).isoformat())
    end = (today+dt.timedelta(days=70)).isoformat()
    output = copy.deepcopy(previous)
    calendar_bounds=copy.deepcopy(previous.get('calendarValidity',{}))
    calendar_rows=copy.deepcopy(previous.get('calendars',{}));calendar_errors={}
    needed_calendars={a['calendar'] for a in universe if a.get('calendar') and (required is None or a['id'] in required)}
    for name in sorted(needed_calendars):
        try:calendar_rows.update(calendars([{'calendar':name}],start,end,calendar_bounds))
        except Exception as e:calendar_errors[name]='Calendrier non qualifié : '+str(e)
    output.update({'version': 1, 'universe': universe, 'generatedAt': now.isoformat(),
                   'calendarFrom': start, 'calendarThrough': end, 'calendars':calendar_rows,'calendarValidity':calendar_bounds})
    output.setdefault('series', {})
    output['status'] = copy.deepcopy(previous.get('status',{}))
    output.setdefault('revisions', [])
    for asset in universe:
        key = asset['id']
        asset=copy.deepcopy(asset)
        prior_series=previous.get('series',{}).get(key,{})
        if prior_series.get('listingEvidenceId')==asset.get('evidenceId') and prior_series.get('symbol'):
            asset['symbol']=prior_series['symbol']
            asset['sourceCurrency']=prior_series.get('sourceCurrency',asset.get('sourceCurrency'))
            asset['priceScale']=prior_series.get('priceScale',asset.get('priceScale',1))
        if required is not None and key not in required:
            output['status'].setdefault(key,{'ok':False,'error':'Cotation à qualifier par une collecte manuelle complète'})
            continue
        if asset.get('calendar') in calendar_errors:
            output['status'][key]={'ok':False,'error':calendar_errors[asset['calendar']],'attemptedAt':now.isoformat()}
            continue
        if asset.get('discoveryBlock') or not asset.get('calendar'):
            output['status'][key]={'ok':False,'error':asset.get('discoveryBlock') or 'Calendrier non qualifié','attemptedAt':now.isoformat()}
            continue
        url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+quote(asset['symbol'],safe='')+'?'+urlencode({
            'period1': int(dt.datetime.fromisoformat(start).replace(tzinfo=UTC).timestamp()),
            'period2': int(now.timestamp()), 'interval': '1d', 'events': 'div,splits'})
        try:
            raw, actual = chart_response(url, fetch)
            series = parse_prices(raw, asset, output['calendars'][asset['calendar']], now, previous.get('series',{}).get(key),through=(today-dt.timedelta(days=1)).isoformat())
            series.update({'sourceUrl': actual, 'retrievedAt': now.isoformat(), 'isin': asset['isin'],
                           'listingEvidenceId': asset['evidenceId'], 'symbol': asset['symbol'], 'currency': asset['currency']})
            old = previous.get('series',{}).get(key,{}).get('points',{})
            corrections = [{'date': d, 'before': old[d], 'after': p} for d,p in series['points'].items()
                           if d in old and (abs(old[d]['synthetic']-p['synthetic'])>1e-7 or abs(old[d]['close']-p['close'])>1e-7)]
            if corrections:
                output['revisions'].append({'at': now.isoformat(), 'asset':key, 'sourceSha256':series['responseSha256'], 'changes':corrections})
            output['series'][key] = series
            output['status'][key] = {'ok':True,'attemptedAt':now.isoformat(),'asOf':max(series['points']),'sourceUrl':actual}
        except Exception as error:
            output['status'][key] = {'ok':False,'attemptedAt':now.isoformat(),'error':str(error),'requestedUrl':url}
    try:
        fx = parse_fx(fetch_ecb(ECB, max_bytes=12_000_000),now,start)
        fx['rates'] = {d:r for d,r in fx['rates'].items() if d >= (dt.date.fromisoformat(start)-dt.timedelta(days=7)).isoformat()}
        fx['retrievedAt'] = now.isoformat()
        try:
            needs_twd=any(a['currency']=='TWD' and (required is None or a['id'] in required) for a in universe)
            fx=enrich_twd(fx,now,start,fetch_ecb,previous=previous.get('fx',{}),required=needs_twd)
            if needs_twd:output['status']['CBC']={'ok':True,'attemptedAt':now.isoformat(),'asOf':max(fx['supplemental']['TWD']['rates'])}
        except Exception as e:
            output['status']['CBC']={'ok':False,'error':str(e),'attemptedAt':now.isoformat()}
            fx=enrich_twd(fx,now,start,fetch_ecb,previous=previous.get('fx',{}),required=False)
        old_rates=previous.get('fx',{}).get('rates',{})
        changes=[{'date':d,'before':old_rates[d],'after':r} for d,r in fx['rates'].items() if d in old_rates and old_rates[d]!=r]
        if changes:
            output['revisions'].append({'at':now.isoformat(),'asset':'ECB','changes':changes})
        output['fx']=fx
        output['status']['ECB']={'ok':True,'asOf':max(fx['rates']),'attemptedAt':now.isoformat()}
    except Exception as error:
        output['status']['ECB']={'ok':False,'error':str(error),'attemptedAt':now.isoformat()}
    # A valid price series with an unsupported currency is not an admissible asset.
    for asset in universe:
        key=asset['id']
        if required is not None and key not in required:continue
        if not output['status'].get(key,{}).get('ok') or asset['currency']=='EUR':continue
        rates=output.get('fx',{}).get('rates',{})
        try:
            for d in output['series'][key]['points']:
                validate_fx_date(output['fx'],asset['currency'],d)
        except Exception as error:output['status'][key]={'ok':False,'attemptedAt':now.isoformat(),'error':str(error)}
    # Conservative global accounting cutoff: yesterday, after all supported markets close.
    output['asOf']=(today-dt.timedelta(days=1)).isoformat()
    return output


def record_qualification_success(row, series, attempted_at):
    """Keep the certificate consistent with the exact response admitted by daily catch-up."""
    dates=sorted(series['points'])
    row.update(lastSuccess=attempted_at,coverageFrom=series['anchorDate'],coverageThrough=dates[-1],
               observedCoverageFrom=dates[0],observedCoverageThrough=dates[-1],
               dailySourceUrl=series['sourceUrl'],sourceRetrievedAt=series['retrievedAt'],
               responseSha256=series['responseSha256'],qualifiedSymbol=series['symbol'],
               observedSourceCurrency=series.get('sourceCurrency',series['currency']),priceScale=series.get('priceScale',1),
               attempts=[{'url':series['sourceUrl'],'result':'qualified','at':attempted_at,'retrievedAt':series['retrievedAt']}])


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=pathlib.Path,default=ROOT)
    p.add_argument('--qualify-all',action='store_true')
    p.add_argument('--report',type=pathlib.Path)
    p.add_argument('--assets',default='',help='Comma-separated exact listing IDs to catch up before admission')
    p.add_argument('--request',type=pathlib.Path,help='Catch up all assets from a downloaded decision/configuration request')
    args=p.parse_args()
    if args.qualify_all:
        subprocess.run(['python3',str(ROOT/'scripts/qualify_ai_portfolios.py'),'--root',str(args.root),'--mode','all'],check=True)
    path=args.root/'data/ai-portfolios/market.json'
    previous=json.loads(path.read_text()) if path.exists() else {}
    universe=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {universe} from './scripts/ai-portfolio-universe.mjs'; console.log(JSON.stringify(universe()))"],cwd=ROOT))
    book_path=args.root/'data/ai-portfolios/book.json'
    book=json.loads(book_path.read_text()) if book_path.exists() else {'competitions':[]}
    defaults=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {defaultConfig} from './src/pages/ai-portfolios/data.js'; console.log(JSON.stringify(defaultConfig()))"],cwd=ROOT))
    required=set()
    for c in book['competitions']:
        required.add(c['config']['benchmark'])
        if c['config'].get('executionPolicy')!='affected-markets-v2':required.update(c['config']['universe'])
        positions={}
        for d in c['decisions']:
            if d['status']=='cancelled':continue
            if d['status'] in ['recorded','pending']:
                required.update(k for k,v in d.get('weights',{}).items() if v)
                required.update(k for k,v in d.get('amounts',{}).items() if v)
            for t in d.get('execution',{}).get('trades',[]):
                key=(d['participant'],t['id']);positions[key]=positions.get(key,0)+t['units']
        required.update(key[1] for key,units in positions.items() if units>1e-10)
    if not required:required.add(defaults['benchmark'])
    required.update(k for k in args.assets.split(',') if k)
    if args.request:
        op=json.loads(args.request.read_text())['operation']
        config=op.get('config',{})
        if config.get('benchmark'):required.add(config['benchmark'])
        if config and config.get('executionPolicy')!='affected-markets-v2':required.update(config.get('universe',[]))
        for field in ['weights','amounts']:required.update(k for k,v in op.get('decision',{}).get(field,{}).items() if v)
    old_assets={a['id']:a for a in previous.get('universe',[])}
    universe=[{**old_assets.get(a['id'],{}),**a} for a in universe]
    # Keep blocked entries visible; only supported calendars are built.
    universe=[a for a in universe if a.get('calendar') and not a.get('discoveryBlock')]
    # Keep frozen legacy listing identities for existing decisions, including the old IDs.
    for a in previous.get('universe',[]):
        if a['id'] in required and not any(x['id']==a['id'] for x in universe): universe.append({**a,'discoveryBlock':'Cotation archivée absente du registre actuel : changement de ticker, suspension ou radiation à revoir explicitement.'})
    unknown=required-{a['id'] for a in universe}
    if unknown:raise ValueError('Identifiants absents du registre : '+', '.join(sorted(unknown)))
    hydrate(previous,args.root/'data/ai-portfolios',required)
    resident=set(previous.get('series',{}))
    result=collect(previous,universe,dt.datetime.now(UTC),required=required)
    # Retain all inventory statuses in the application, including blocked identities.
    active={a['id'] for a in result['universe']}
    result['universe'] += [a for k,a in old_assets.items() if k not in active]
    qualification=args.root/'data/ai-portfolios/qualification.json'
    if qualification.exists():
        from qualify_ai_portfolios import reports
        rows=json.loads(qualification.read_text())['candidates']
        for row in rows:
            key=row['id']
            if key not in required:continue
            status=result['status'].get(key,{})
            if row.get('discoveryBlock'):
                row.update(status='excluded' if row.get('permanentExclusion') else 'blocked',reason=row['discoveryBlock'])
                continue
            row.update(status='qualified' if status.get('ok') else 'temporary-failure',lastAttempt=status.get('attemptedAt'),reason='Clôtures quotidiennes actualisées et contrôlées.' if status.get('ok') else status.get('error','Source indisponible'))
            if status.get('ok'):
                series=result['series'][key]
                record_qualification_success(row,series,status['attemptedAt'])
            elif status.get('requestedUrl'):
                row['attempts']=[{'requestedUrl':status['requestedUrl'],'result':status['error'],'at':status['attemptedAt']}]
        reports(rows,args.root/'data/ai-portfolios')
        metadata={r['id']:r for r in rows}
        result['universe']=[{**a,**metadata.get(a['id'],{})} for a in result['universe']]
    result['universe']=compact_catalogue([r for r in result['universe'] if not r.get('permanentExclusion') or r['id'] in required])
    write_json_atomic(path,persist(result,args.root/'data/ai-portfolios',resident,required))
    relevant={k:v for k,v in result['status'].items() if k in required or k=='ECB'}
    print(json.dumps(relevant,ensure_ascii=False,indent=2))
    if args.report:
        write_json_atomic(args.report,{'successes':[{'id':k} for k,v in relevant.items() if v['ok']],
                                      'errors':[{'id':k,'field':'Clôture quotidienne / change','error':v['error']} for k,v in relevant.items() if not v['ok']]})
    # Preserve healthy sources and emit a failing outcome for monitoring/retry.
    return 0 if all(s['ok'] for s in relevant.values()) else 1


if __name__=='__main__':
    raise SystemExit(main())
