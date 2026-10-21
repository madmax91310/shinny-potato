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

ROOT = pathlib.Path(__file__).resolve().parents[1]
ECB = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml'


def sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def calendars(universe, start, end):
    result = {}
    for name in sorted({a['calendar'] for a in universe}):
        cal = xc.get_calendar(name, start=(dt.date.fromisoformat(start)-dt.timedelta(days=7)).isoformat(), end=(dt.date.fromisoformat(end)+dt.timedelta(days=7)).isoformat())
        result[name] = {s.date().isoformat(): cal.session_close(s).isoformat()
                        for s in cal.sessions_in_range(start, end)}
    return result


def parse_prices(raw, asset, calendar, now, previous=None):
    if asset.get('yahooExchange') and raw['chart']['result'][0]['meta'].get('exchangeName')!=asset['yahooExchange']:
        raise ValueError('Place de cotation action différente de la place qualifiée')
    rows, zone = yahoo_chart(raw, {**asset, 'field': 'adjclose', 'yahooInstrumentType': asset['instrumentType']}, '1d')
    completed = {d: close for d, close in calendar.items() if dt.datetime.fromisoformat(close) + dt.timedelta(hours=2) < now}
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
            'convention': 'synthetic-total-return-100-at-anchor', 'responseSha256': sha(raw)}


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
        if not all(0 < row.get(c, 0) < 100 for c in ['USD', 'GBP', 'CHF']):
            raise ValueError('Change BCE absent ou incohérent')
        rates[date] = {c: row[c] for c in ['USD', 'GBP', 'CHF']}
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
    output.update({'version': 1, 'universe': universe, 'generatedAt': now.isoformat(),
                   'calendarFrom': start, 'calendarThrough': end, 'calendars': calendars(universe,start,end)})
    output.setdefault('series', {})
    output['status'] = copy.deepcopy(previous.get('status',{}))
    output.setdefault('revisions', [])
    for asset in universe:
        key = asset['id']
        if required is not None and key not in required:
            output['status'].setdefault(key,{'ok':False,'error':'Cotation à qualifier par une collecte manuelle complète'})
            continue
        url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+quote(asset['symbol'],safe='')+'?'+urlencode({
            'period1': int(dt.datetime.fromisoformat(start).replace(tzinfo=UTC).timestamp()),
            'period2': int(now.timestamp()), 'interval': '1d', 'events': 'div,splits'})
        try:
            raw, actual = chart_response(url, fetch)
            series = parse_prices(raw, asset, output['calendars'][asset['calendar']], now, previous.get('series',{}).get(key))
            series.update({'sourceUrl': actual, 'retrievedAt': now.isoformat(), 'isin': asset['isin'],
                           'listingEvidenceId': asset['evidenceId'], 'symbol': asset['symbol'], 'currency': asset['currency']})
            old = previous.get('series',{}).get(key,{}).get('points',{})
            corrections = [{'date': d, 'before': old[d], 'after': p} for d,p in series['points'].items()
                           if d in old and (abs(old[d]['synthetic']-p['synthetic'])>1e-7 or abs(old[d]['close']-p['close'])>1e-7)]
            if corrections:
                output['revisions'].append({'at': now.isoformat(), 'asset':key, 'sourceSha256':series['responseSha256'], 'changes':corrections})
            output['series'][key] = series
            output['status'][key] = {'ok':True,'attemptedAt':now.isoformat(),'asOf':max(series['points'])}
        except Exception as error:
            output['status'][key] = {'ok':False,'attemptedAt':now.isoformat(),'error':str(error)}
    try:
        fx = parse_fx(fetch_ecb(ECB, max_bytes=12_000_000),now,start)
        fx['rates'] = {d:r for d,r in fx['rates'].items() if d >= start}
        fx['retrievedAt'] = now.isoformat()
        old_rates=previous.get('fx',{}).get('rates',{})
        changes=[{'date':d,'before':old_rates[d],'after':r} for d,r in fx['rates'].items() if d in old_rates and old_rates[d]!=r]
        if changes:
            output['revisions'].append({'at':now.isoformat(),'asset':'ECB','changes':changes})
        output['fx']=fx
        output['status']['ECB']={'ok':True,'asOf':max(fx['rates']),'attemptedAt':now.isoformat()}
    except Exception as error:
        output['status']['ECB']={'ok':False,'error':str(error),'attemptedAt':now.isoformat()}
    # Conservative global accounting cutoff: yesterday, after all supported markets close.
    output['asOf']=(today-dt.timedelta(days=1)).isoformat()
    return output


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=pathlib.Path,default=ROOT)
    p.add_argument('--qualify-all',action='store_true')
    p.add_argument('--report',type=pathlib.Path)
    args=p.parse_args()
    path=args.root/'data/ai-portfolios/market.json'
    previous=json.loads(path.read_text()) if path.exists() else {}
    universe=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {universe} from './scripts/ai-portfolio-universe.mjs'; console.log(JSON.stringify(universe()))"],cwd=ROOT))
    book_path=args.root/'data/ai-portfolios/book.json'
    book=json.loads(book_path.read_text()) if book_path.exists() else {'competitions':[]}
    defaults=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {defaultConfig} from './src/pages/ai-portfolios/data.js'; console.log(JSON.stringify(defaultConfig()))"],cwd=ROOT))
    required={a for c in book['competitions'] for a in c['config']['universe']} or set(defaults['universe'])
    result=collect(previous,universe,dt.datetime.now(UTC),required=None if args.qualify_all else required)
    write_json_atomic(path,result)
    print(json.dumps(result['status'],ensure_ascii=False,indent=2))
    relevant={k:v for k,v in result['status'].items() if k in required or k=='ECB'}
    if args.report:
        write_json_atomic(args.report,{'successes':[{'id':k} for k,v in relevant.items() if v['ok']],
                                      'errors':[{'id':k,'field':'Clôture quotidienne / change','error':v['error']} for k,v in relevant.items() if not v['ok']]})
    # Preserve healthy sources and emit a failing outcome for monitoring/retry.
    return 0 if all(s['ok'] for s in relevant.values()) else 1


if __name__=='__main__':
    raise SystemExit(main())
