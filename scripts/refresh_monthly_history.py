"""Refresh exact existing market series; only complete, independently checked months."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import copy
import datetime as dt
import hashlib
import json
import math
import os
import pathlib
import re
import gzip
from urllib.parse import urlencode, quote
import urllib.error
from zoneinfo import ZoneInfo
from issuer_documents import download
from data_automation import UTC, get_json, get_text, month_shift, number, reject, write_json_atomic

ROOT = pathlib.Path(__file__).resolve().parents[1]


def rounded(value, precision):
    return math.floor(number(value) * 10**precision + .5) / 10**precision


def months(start, end):
    current = dt.datetime.strptime(start, '%Y-%m').replace(tzinfo=UTC)
    while current < end:
        yield current.strftime('%Y-%m')
        current = month_shift(current, 1)


def yahoo_chart(body, config, interval):
    chart = body['chart']
    if chart.get('error') or len(chart['result']) != 1:
        reject('Yahoo failed or ambiguous response')
    data = chart['result'][0]; meta = data['meta']
    if meta['symbol'] != config['symbol'] or meta['currency'] != config['currency'] or meta['dataGranularity'] != interval:
        reject('Wrong Yahoo identity/currency/interval')
    zone = meta['exchangeTimezoneName']
    if config.get('timezone') and zone != config['timezone']:
        reject('Yahoo exchange timezone changed')
    tz = ZoneInfo(zone)
    stamps = data['timestamp']; closes = data['indicators']['quote'][0]['close']
    adjusted = data['indicators'].get('adjclose', [{}])[0].get('adjclose', [])
    if not stamps or stamps != sorted(set(stamps)) or len(stamps) != len(closes):
        reject('Missing/duplicate Yahoo observations')
    if config['field'] == 'adjclose' and interval == '1d' and len(adjusted) != len(stamps):
        reject('Adjusted prices missing; raw close is not a substitute')
    rows = []
    for i, (stamp, close) in enumerate(zip(stamps, closes)):
        if close is None:
            if adjusted and adjusted[i] is not None:
                reject('Inconsistent null Yahoo session')
            continue
        date = dt.datetime.fromtimestamp(number(stamp), UTC).astimezone(tz).date()
        price = number(adjusted[i]) if config['field'] == 'adjclose' and interval == '1d' else number(close)
        rows.append((date, number(close), price))
    if len({r[0] for r in rows}) != len(rows):
        reject('Duplicate Yahoo local date')
    return rows, zone


def collect_yahoo(config, now, fetch=get_json):
    end = dt.datetime(now.year, now.month, 1, tzinfo=UTC)
    start = dt.datetime.strptime(config['periodStart'], '%Y-%m').replace(tzinfo=UTC)
    urls, raw = {}, {}
    for interval in ['1d', '1mo']:
        urls[interval] = 'https://query2.finance.yahoo.com/v8/finance/chart/' + quote(config['symbol'], safe='') + '?' + urlencode({
            'period1': int(start.timestamp()), 'period2': int(end.timestamp()),
            'interval': interval, 'events': 'div,splits'})
        raw[interval] = fetch(urls[interval])
    daily, zone = yahoo_chart(raw['1d'], config, '1d')
    monthly, monthly_zone = yahoo_chart(raw['1mo'], config, '1mo')
    if zone != monthly_zone:
        reject('Yahoo granularities have different exchange timezones')
    final = {}
    for day, close, adjusted in daily:
        if start.date() <= day < end.date():
            final[day.strftime('%Y-%m')] = (day, close, adjusted)
    buckets = {}
    for day, close, _ in monthly:
        key = day.strftime('%Y-%m')
        if start.date() <= day < end.date():
            if day.day != 1 or key in buckets:
                reject('Shifted/duplicate Yahoo monthly candle')
            buckets[key] = close
    points, proof_rows, anniversary = [], [], []
    expected = list(months(config['periodStart'], end))
    if set(final) != set(expected) or (set(buckets) != set(expected) and not config.get('allowMissingMonthly')):
        reject('Incomplete/stale Yahoo history')
    windows={}
    if config.get('allowMissingMonthly'):
        def window(key):
            boundary=month_shift(dt.datetime.strptime(key,'%Y-%m').replace(tzinfo=UTC),1)
            url='https://query2.finance.yahoo.com/v8/finance/chart/'+quote(config['symbol'],safe='')+'?'+urlencode({
                'period1':int((boundary-dt.timedelta(days=7)).timestamp()),'period2':int(boundary.timestamp()),'interval':'1d','events':'div,splits'})
            response=fetch(url);rows,tz=yahoo_chart(response,config,'1d')
            rows=[r for r in rows if r[0].strftime('%Y-%m')==key]
            if tz!=zone or not rows or rows[-1]!=final[key]:reject('Independent month-end daily window disagrees')
            return key,{'url':url,'response':response,'close':rows[-1][1]}
        with ThreadPoolExecutor(max_workers=3) as pool:windows=dict(pool.map(window,[k for k in expected if k not in buckets]))
        raw['monthEndWindows']={k:v['response'] for k,v in windows.items()}
    for key in expected:
        date, close, value = final[key]
        boundary = month_shift(dt.datetime.strptime(key, '%Y-%m').replace(tzinfo=UTC), 1).date()
        checked_close=buckets[key] if key in buckets else windows[key]['close']
        if (boundary-date).days > 7 or abs(close-checked_close) > max(.02, close * 1e-7):
            reject('Monthly close differs from final daily session')
        if config['symbol'] == 'ETH-USD':
            days = [r[0] for r in daily if r[0].strftime('%Y-%m') == key]
            if len(days) != (boundary - dt.date.fromisoformat(key+'-01')).days:
                reject('Incomplete crypto daily coverage')
        points.append([key, rounded(value, config['precision'])])
        if config.get('collectAnniversary'):
            anniversary.append([key, rounded(close, config['precision'])])
        proof_rows.append({'date': date.isoformat(), 'close': close, 'monthlyClose': buckets.get(key), 'value': value,
                           **({'windowClose':windows[key]['close'],'windowUrl':windows[key]['url']} if key in windows else {})})
    return {'points': points, 'anniversaryPoints': anniversary, 'sourceUrls': list(urls.values())+[v['url'] for v in windows.values()],
            'timezone': zone, 'proofRows': proof_rows, 'rawResponse': raw}


def msci_rows(body, config):
    if str(body['msci_index_code']) != config['indexCode'] or body['index_variant_type'] != config['variant'] or body['ISO_currency_symbol'] != config['currency']:
        reject('Wrong MSCI index/currency/NET-GROSS variant')
    rows = [(dt.datetime.strptime(str(p['calc_date']), '%Y%m%d').date(), number(p['level_eod']))
            for p in body['indexes']['INDEX_LEVELS']]
    if not rows or [r[0] for r in rows] != sorted({r[0] for r in rows}):
        reject('Missing/duplicate MSCI observations')
    return rows


def collect_msci(config, now, fetch=get_json):
    end = dt.datetime(now.year, now.month, 1, tzinfo=UTC)
    start = dt.datetime.strptime(config['periodStart'], '%Y-%m').replace(tzinfo=UTC)
    raw, urls, attempts = {}, [], []
    for frequency in ['DAILY', 'END_OF_MONTH']:
        def source_url(first, last):
            return 'https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?' + urlencode({
            'currency_symbol': config['currency'], 'index_variant': config['variant'],
            'start_date': first.strftime('%Y%m%d'), 'end_date': last.strftime('%Y%m%d'),
            'data_frequency': frequency, 'index_codes': config['indexCode']})
        first, last = (start-dt.timedelta(days=1)).date(), (end-dt.timedelta(days=1)).date()
        url = source_url(first, last)
        try:
            raw[frequency] = fetch(url)
            urls.append(url)
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            if isinstance(error, urllib.error.HTTPError) and error.code not in (429, 500, 502, 503, 504):
                raise
            # Smaller requests to the same exact MSCI series, never a proxy.
            # No fallback on identity, schema, return-convention or numeric errors.
            attempts.append({'url':url, 'reason':str(error), 'recovery':'calendar-year windows'})
            chunks, levels = [], []
            cursor = start.date()
            while cursor <= last:
                boundary = min(dt.date(cursor.year, 12, 31), last)
                chunk_url = source_url(cursor, boundary)
                body = fetch(chunk_url)
                rows = msci_rows(body, config)
                if any(not cursor <= day <= boundary for day, _ in rows):
                    reject('MSCI recovery observations outside requested window')
                chunks.append({'url':chunk_url, 'response':body})
                urls.append(chunk_url)
                levels.extend(body['indexes']['INDEX_LEVELS'])
                cursor = boundary + dt.timedelta(days=1)
            raw[frequency] = {**chunks[0]['response'], 'indexes':{'INDEX_LEVELS':levels}}
            raw[frequency+'Recovery'] = chunks
    daily = msci_rows(raw['DAILY'], config); monthly = msci_rows(raw['END_OF_MONTH'], config)
    final, buckets = {}, {}
    for day, value in daily:
        if start.date() <= day < end.date(): final[day.strftime('%Y-%m')] = (day, value)
    for day, value in monthly:
        if start.date() <= day < end.date():
            key=day.strftime('%Y-%m')
            if key in buckets: reject('Duplicate MSCI month')
            buckets[key] = (day, value)
    expected = list(months(config['periodStart'], end))
    if set(final) != set(expected) or set(buckets) != set(expected): reject('Incomplete/stale MSCI history')
    points, proof_rows = [], []
    for key in expected:
        day, value = final[key]; published_day, published = buckets[key]
        boundary = month_shift(dt.datetime.strptime(key, '%Y-%m').replace(tzinfo=UTC), 1).date()
        if day != published_day or (boundary-day).days > 7 or abs(value-published) > .0001:
            reject('MSCI monthly/daily final session disagrees')
        points.append([key, rounded(value, config['precision'])])
        proof_rows.append({'date':day.isoformat(), 'value':value, 'monthlyValue':published})
    return {'points':points, 'sourceUrls':urls, 'proofRows':proof_rows, 'rawResponse':raw,
            **({'sourceAttempts':attempts} if attempts else {})}


def collect_one(config, now):
    if config['parser'] == 'yahoo': result=collect_yahoo(config, now)
    elif config['parser'] == 'msci': result=collect_msci(config, now)
    elif config['parser'] == 'stoxx': result=collect_stoxx(config,now)
    else: reject('Unknown monthly source')
    return {**config, **result, 'checkedAt':now.date().isoformat(),
            'periodEnd':result['points'][-1][0],
            'responseSha256':hashlib.sha256(json.dumps(result['rawResponse'], sort_keys=True, allow_nan=False).encode()).hexdigest()}


def collect_stoxx(config, now, fetch=download):
    body=fetch(config['sourceUrl'])
    if body[:2]==b'\x1f\x8b':
        import io
        with gzip.GzipFile(fileobj=io.BytesIO(body)) as f:body=f.read(8_000_001)
    if len(body)>8_000_000:reject('STOXX page too large')
    text=body.decode('utf-8')
    if ("window.index_isin = '"+config['isin']+"'") not in text or 'id="overview-symbol">'+config['symbol']+'<' not in text or 'EUR (Net Return)' not in text:
        reject('Wrong STOXX exact index or return variant')
    arrays=re.findall(r'window\.chart_data\s*=\s*(\[\[.*?\]\]);',text)
    if not arrays or any(json.loads(a)!=json.loads(arrays[0]) for a in arrays):reject('STOXX daily tables absent or inconsistent')
    rows=json.loads(arrays[0]);stamps=[r[0] for r in rows]
    if stamps!=sorted(set(stamps)):reject('Duplicate/nonordered STOXX daily observations')
    end=dt.datetime(now.year,now.month,1,tzinfo=UTC);final={}
    for stamp,value in rows:
        day=dt.datetime.fromtimestamp(number(stamp)/1000,UTC).date();key=day.strftime('%Y-%m')
        if config['periodStart']<=key<end.strftime('%Y-%m'):final[key]=(day,number(value))
    expected=list(months(config['periodStart'],end))
    if set(final)!=set(expected):reject('Incomplete STOXX monthly coverage')
    proof=[];points=[]
    for key in expected:
        day,value=final[key];boundary=month_shift(dt.datetime.strptime(key,'%Y-%m').replace(tzinfo=UTC),1).date()
        if (boundary-day).days>7:reject('Stale STOXX month-end session')
        points.append([key,rounded(value,config['precision'])]);proof.append({'date':day.isoformat(),'value':value})
    return {'points':points,'sourceUrls':[config['sourceUrl']],'proofRows':proof,'rawResponse':{'dailyRows':rows}}


def refresh(config, current, baseline, now=None, collect=collect_one):
    now = now or dt.datetime.now(UTC)
    def one(source):
        try:
            result=collect(source,now)
            old=baseline[source['id']]
            if old['currency'] != result['currency'] or result['points'][0][0] != old['points'][0]['date']:
                reject('Existing series currency or coverage changed')
            if result['periodEnd'] < old['points'][-1]['date']:reject('History would regress')
            active={k:v for k,v in result.items() if k not in ['proofRows','rawResponse']}
            previous=current.get(source['id'])
            if previous:
                if any(previous[k] != active[k] for k in ['parser','currency','method','periodStart']):reject('Existing return convention changed')
                if previous.get('symbol') != active.get('symbol') or previous.get('variant') != active.get('variant') or previous.get('indexCode') != active.get('indexCode'):
                    reject('Existing exact series identity changed')
                if previous['points'] == active['points'] and previous.get('anniversaryPoints',[]) == active.get('anniversaryPoints',[]):active=previous
            return {'id':source['id'],'status':'validated','record':active,'evidence':result}
        except Exception as error:
            return {'id':source['id'],'status':'failed','reason':str(error)}
    with ThreadPoolExecutor(max_workers=3) as pool: observations=list(pool.map(one,config['series']))
    merged=copy.deepcopy(current)
    for o in observations:
        if o['status']=='validated':merged[o['id']]=o['record']
    return merged,{'checkedAt':now.isoformat(),'series':observations}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--baseline',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path)
    p.add_argument('--apply',action='store_true');args=p.parse_args()
    path=ROOT/'src/data/automated-monthly.json'; current=json.loads(path.read_text())
    merged,report=refresh(json.loads((ROOT/'scripts/monthly-automation.json').read_text()),current,json.loads(args.baseline.read_text()))
    write_json_atomic(args.output,report)
    if args.apply and merged!=current:write_json_atomic(path,merged)
    evidence_path=ROOT/'scripts/source-snapshots/monthly-automated.json'
    evidence=json.loads(evidence_path.read_text()) if evidence_path.exists() else {}
    for observation in report['series']:
        if observation['status']=='validated':
            result=observation['evidence']
            if evidence.get(observation['id'],{}).get('responseSha256') != observation['record']['responseSha256']:
                # Persist proof for the active version, not a subsequent unchanged check.
                if result['responseSha256']==observation['record']['responseSha256']:
                    evidence[observation['id']]={k:v for k,v in result.items() if k not in ['rawResponse','points','anniversaryPoints']}
    if args.apply:write_json_atomic(evidence_path,evidence)
    failed=[s for s in report['series'] if s['status']=='failed']
    print(f"Monthly histories: {len(report['series'])-len(failed)}/{len(report['series'])} validated.")
    for s in failed:print(s['id']+': '+s['reason'])
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:
            f.write('\n## Historiques mensuels\n\n| Série | État | Dernier mois / erreur |\n|---|---|---|\n')
            for s in report['series']:f.write(f"| {s['id']} | {s['status']} | {s.get('record',{}).get('periodEnd',s.get('reason'))} |\n")
    if failed:raise SystemExit(1)


if __name__=='__main__':main()
