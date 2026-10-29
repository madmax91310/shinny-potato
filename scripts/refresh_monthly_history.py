"""Refresh exact existing market series; only complete, independently checked months."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import copy
import datetime as dt
import hashlib
import http.client
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
from market_transport import chart_response
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
    if config.get('yahooInstrumentType') and meta.get('instrumentType') != config['yahooInstrumentType']:
        reject('Qualified listing instrument type changed')
    zone = meta['exchangeTimezoneName']
    if config.get('timezone') and zone != config['timezone']:
        reject('Yahoo exchange timezone changed')
    if config.get('consumerScope') == 'equity' and meta.get('instrumentType') != 'EQUITY':
        reject('Expected an equity, not an index, fund or derivative')
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
        # Yahoo repeats the latest ASX session as two bars (market open and closing time) with
        # identical prices; one session with identical close and adjusted close is kept once.
        # Any other repeated local date is still rejected, with the sessions named so the
        # failure can be diagnosed from the status file.
        collapsed, conflicts = {}, {}
        for date, close, price in rows:
            if date in collapsed and (collapsed[date][1], collapsed[date][2]) != (close, price):
                conflicts.setdefault(date, [collapsed[date]]).append((date, close, price))
            collapsed[date] = (date, close, price)
        if conflicts:
            detail = '; '.join(f'{date.isoformat()} ' + ' & '.join(f'{bar[1]}/{bar[2]}' for bar in bars) for date, bars in sorted(conflicts.items()))
            reject(f'Duplicate Yahoo local date with different prices ({interval}, {zone}): {detail[:300]}')
        rows = [collapsed[date] for date in sorted(collapsed)]
    return rows, zone


def collect_yahoo(config, now, fetch=get_json):
    from qualified_split_comparison import qualify as qualify_split, comparison_value
    split_notice=qualify_split(config,now)
    end = dt.datetime(now.year, now.month, 1, tzinfo=UTC)
    start = dt.datetime.strptime(config['periodStart'], '%Y-%m').replace(tzinfo=UTC)
    urls, raw = {}, {}
    for interval in ['1d', '1mo']:
        urls[interval] = 'https://query2.finance.yahoo.com/v8/finance/chart/' + quote(config['symbol'], safe='') + '?' + urlencode({
            'period1': int(start.timestamp()), 'period2': int(end.timestamp()),
            'interval': interval, 'events': 'div,splits'})
        raw[interval], urls[interval] = chart_response(urls[interval], fetch)
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
    qualifying_suffix = config.get('qualifyContiguousSuffix') is True
    exact_equity = (config.get('consumerScope') == 'equity' and config.get('instrumentType') == 'EQUITY'
                    and re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]', config.get('isin', ''))
                    and config.get('symbol') and config.get('timezone'))
    if qualifying_suffix and (config.get('consumerScope') != 'catalog' and not exact_equity or config.get('field') != 'adjclose'):
        reject('Contiguous suffix qualification requires an exact adjusted security')
    missing = [key for key in expected if key not in final or (key not in buckets and not config.get('allowMissingMonthly'))]
    excluded = []
    if missing and qualifying_suffix:
        last_missing = max(missing)
        excluded.append({'through':last_missing,'reason':'Incomplete daily/monthly coverage before the retained continuous window'})
        expected = [key for key in expected if key > last_missing]
    elif set(final) != set(expected) or (set(buckets) != set(expected) and not config.get('allowMissingMonthly')):
        reject('Incomplete/stale Yahoo history')
    if not expected:
        reject('No complete continuous month remains')
    windows={}
    window_months=set(config.get('dailyWindowMonths', []))
    # A qualified exact-share candidate can verify a conflicting monthly candle
    # against a second, bounded daily response. Never accept the conflict itself.
    if config.get('verifyMonthlyDisagreements'):
        if config.get('consumerScope') != 'catalog' or config.get('field') != 'adjclose':
            reject('Monthly discrepancy verification requires an exact adjusted fund share')
        window_months |= {key for key in expected if key in buckets and abs(final[key][1]-buckets[key]) > max(.02,final[key][1]*1e-7)}
        # Generated verification windows are evidence, not a mutation of the registered source.
    sparse_ends=config.get('verifiedSparseMonthEnds', {})
    if sparse_ends and (config.get('consumerScope') != 'catalog' or config.get('field') != 'adjclose'
            or any(k not in expected or not isinstance(v,str) or not v.startswith(k+'-') for k,v in sparse_ends.items())):
        reject('Unregistered sparse ETF month-end session')
    if window_months and (config.get('consumerScope') != 'catalog' or config.get('field') != 'adjclose'
                          or not window_months <= set(expected)):
        reject('Unregistered ETF daily window verification')
    if config.get('allowMissingMonthly') or window_months or sparse_ends:
        def window(key):
            boundary=month_shift(dt.datetime.strptime(key,'%Y-%m').replace(tzinfo=UTC),1)
            url='https://query2.finance.yahoo.com/v8/finance/chart/'+quote(config['symbol'],safe='')+'?'+urlencode({
                'period1':int((boundary-dt.timedelta(days=14 if key in sparse_ends else 7)).timestamp()),'period2':int(boundary.timestamp()),'interval':'1d','events':'div,splits'})
            response,url=chart_response(url,fetch);rows,tz=yahoo_chart(response,config,'1d')
            rows=[r for r in rows if r[0].strftime('%Y-%m')==key]
            compared=[comparison_value(a,b,rows[-1][0],split_notice,rel_tol=(1e-7 if i==0 else 1e-6)) for i,(a,b) in enumerate(zip(rows[-1][1:],final[key][1:]))] if rows else []
            if (tz!=zone or not rows or rows[-1][0]!=final[key][0]
                    or any(not math.isclose(a[0],b,rel_tol=(1e-7 if i==0 else 1e-6),abs_tol=1e-6) for i,(a,b) in enumerate(zip(compared,final[key][1:])))):reject(f'Independent month-end daily window disagrees: {key}, window {rows[-1] if rows else None}, full {final[key]}')
            return key,{'url':url,'response':response,'close':compared[0][0],
                        **({'splitComparison':{'originalClose':rows[-1][1],'originalAdjustedClose':rows[-1][2],'ratio':split_notice['ratio'],'normalisedClose':compared[0][1],'normalisedAdjustedClose':compared[1][1]}} if any(a[1]for a in compared)else{})}
        keys=[k for k in expected if k in window_months or k in sparse_ends or k not in buckets]
        with ThreadPoolExecutor(max_workers=3) as pool:windows=dict(pool.map(window,keys))
        raw['monthEndWindows']={k:v['response'] for k,v in windows.items()}
    for key in expected:
        date, close, value = final[key]
        boundary = month_shift(dt.datetime.strptime(key, '%Y-%m').replace(tzinfo=UTC), 1).date()
        checked_close=windows[key]['close'] if key in windows else buckets[key]
        original_checked_close=checked_close
        checked_close,split_compared=comparison_value(checked_close,close,date,split_notice)
        sparse_verified = (key in sparse_ends and date.isoformat() == sparse_ends[key]
            and key in buckets and key in windows and (boundary-date).days <= 10
            and abs(close-buckets[key]) <= max(.02, close * 1e-7))
        if ((boundary-date).days > 7 and not sparse_verified) or abs(close-checked_close) > max(.02, close * 1e-7):
            reason = f'Monthly close differs from final daily session: {key}, session {date}, daily {close}, check {checked_close}'
            if not qualifying_suffix:
                reject(reason)
            excluded.append({'through':key,'reason':reason})
            points.clear(); proof_rows.clear(); anniversary.clear()
            continue
        if config['symbol'] == 'ETH-USD':
            days = [r[0] for r in daily if r[0].strftime('%Y-%m') == key]
            if len(days) != (boundary - dt.date.fromisoformat(key+'-01')).days:
                reject('Incomplete crypto daily coverage')
        points.append([key, rounded(value, config['precision'])])
        if config.get('collectAnniversary'):
            anniversary.append([key, rounded(close, config['precision'])])
        proof_rows.append({'date': date.isoformat(), 'close': close, 'monthlyClose': None if key in windows else buckets.get(key), 'value': value,
                           **({'rejectedMonthlyClose':buckets.get(key), 'verificationReason':'Registered historical candle discrepancy; exact daily month-end window agrees'} if key in window_months else {}),
                           **({'sparseMonthEndSession':date.isoformat(),'verificationReason':'Registered sparse quoted session agrees with monthly candle and independent daily window'} if sparse_verified else {}),
                           **({'windowClose':windows[key]['close'],'windowUrl':windows[key]['url']} if key in windows else {})})
        if split_compared:proof_rows[-1]['splitComparison']={'originalComparisonClose':original_checked_close,'ratio':split_notice['ratio'],'sourceUrl':split_notice['sourceUrl']}
        if key in windows and windows[key].get('splitComparison'):proof_rows[-1]['windowSplitComparison']=windows[key]['splitComparison']
    if not points:
        reject('No verified continuous month remains')
    qualification = ({'periodStart':points[0][0], 'qualificationCoverage':{
        'requestedStart':config['periodStart'],'retainedStart':points[0][0], 'excluded':excluded,
        'method':'Latest continuous suffix of independently verified full months; no missing month filled',
    }} if excluded else {})
    result = {**qualification, **({'verifiedDailyWindowMonths':sorted(window_months)} if window_months else {}), 'points': points, 'anniversaryPoints': anniversary, 'sourceUrls': list(urls.values())+[v['url'] for v in windows.values()],
            'timezone': zone, 'proofRows': proof_rows, 'rawResponse': raw}
    if split_notice:
        result['splitComparisonEvidence']=split_notice
        result['sourceUrls'].append(split_notice['sourceUrl'])
        raw['splitComparisonEvidence']=split_notice
    if config.get('distributionEvidence'):
        from qualified_distributions import reconcile_adjustments
        result=reconcile_adjustments(config,result,daily,now)
    return result


def msci_rows(body, config):
    if str(body['msci_index_code']) != config['indexCode'] or body['index_variant_type'] != config['variant'] or body['ISO_currency_symbol'] != config['currency']:
        reject('Wrong MSCI index/currency/NET-GROSS variant')
    rows = [(dt.datetime.strptime(str(p['calc_date']), '%Y%m%d').date(), number(p['level_eod']))
            for p in body['indexes']['INDEX_LEVELS']]
    if not rows or [r[0] for r in rows] != sorted({r[0] for r in rows}):
        reject('Missing/duplicate MSCI observations')
    return rows


def get_msci_json(url):
    return get_json(url, max_attempts=5)


def collect_msci(config, now, fetch=get_msci_json):
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
        except (urllib.error.URLError, TimeoutError, http.client.IncompleteRead, ConnectionError) as error:
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


def collect_fred(config, now, fetch=lambda url: get_text(url, ('text/csv', 'application/csv', 'text/plain'))):
    """Nasdaq XNDX distributed by FRED; exact daily month-end levels, never averages."""
    import csv
    import io
    if (config.get('seriesId'), config.get('symbol'), config.get('currency'), config.get('variant')) != ('NASDAQXNDX', 'XNDX', 'USD', 'TOTAL'):
        reject('Wrong FRED index or return convention')
    end = dt.datetime(now.year, now.month, 1, tzinfo=UTC)
    start = dt.date.fromisoformat(config['periodStart']+'-01')
    base = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=NASDAQXNDX'
    urls = [base, base+'&cosd='+start.isoformat()+'&coed='+(end.date()-dt.timedelta(days=1)).isoformat()]
    raw = [fetch(url) for url in urls]
    def parse(text):
        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames != ['observation_date', 'NASDAQXNDX']:
            reject('Wrong FRED CSV series')
        rows = []
        dates = []
        for row in reader:
            day = dt.date.fromisoformat(row['observation_date'])
            dates.append(day)
            if row['NASDAQXNDX'] not in ('', '.'):
                value = number(float(row['NASDAQXNDX']))
                if value <= 0: reject('Invalid FRED level')
                if start <= day < end.date(): rows.append((day, value))
        if dates != sorted(set(dates)): reject('Duplicate or unordered FRED dates')
        return rows
    daily, check = map(parse, raw)
    if not daily or daily != check: reject('Independent FRED date window disagrees')
    final = {}
    for day, value in daily: final[day.strftime('%Y-%m')] = (day, value)
    expected = list(months(config['periodStart'], end))
    if set(final) != set(expected): reject('Incomplete/stale FRED monthly history')
    points, proof = [], []
    for key in expected:
        day, value = final[key]
        boundary = month_shift(dt.datetime.strptime(key,'%Y-%m').replace(tzinfo=UTC),1).date()
        if (boundary-day).days > 4: reject('Missing FRED month-end sessions')
        points.append([key, rounded(value, config['precision'])])
        proof.append({'date':day.isoformat(), 'value':value, 'windowValue':value})
    return {'points':points, 'sourceUrls':urls+['https://fred.stlouisfed.org/series/NASDAQXNDX', 'https://indexes.nasdaq.com/Index/Overview/XNDX'],
            'proofRows':proof, 'rawResponse':raw}


def collect_one(config, now):
    if config['parser'] == 'official-nav':
        from collect_official_share_history import collect_one as collect_nav
        return collect_nav(config, now)
    if config['parser'] == 'yahoo': result=collect_yahoo(config, now)
    elif config['parser'] == 'msci': result=collect_msci(config, now)
    elif config['parser'] == 'fred': result=collect_fred(config,now)
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
            scope=result.get('calendarProof')or{}
            if scope.get('controlledFields') or source.get('navProvider')=='landg' or source.get('navHistoryKind')=='official-income-reinvested-chart':
                required=['controlledInstrument','controlledFields','requestedStart','controlledCalendarYears']
                missing=[key for key in required if key not in scope]
                if missing:reject('Missing mandatory source-control scope: '+', '.join(missing))
                if (not scope['controlledFields']or not isinstance(scope['controlledFields'],list)or any(not isinstance(v,str)or not v.strip()for v in scope['controlledFields'])
                        or scope['controlledInstrument']!=(source.get('isin')or source['id'])
                        or not isinstance(scope['controlledCalendarYears'],list)):
                    reject('Invalid exact source-control scope')
                dt.date.fromisoformat(scope['requestedStart'])
            old=baseline.get(source['id'])
            prior=current.get(source['id'])
            # The isolated non-bond producer has a company-only baseline. A
            # reviewed NAV migration already has its own validated prior series;
            # use that coverage, never authorize a new NAV bootstrap implicitly.
            if (old is None and source.get('parser') == 'official-nav' and prior
                    and prior.get('parser') == 'official-nav'
                    and prior.get('valuationBasis') == 'fund-nav-total-return'):
                old={'currency':prior['currency'],
                     'points':[{'date':p[0],'price':p[1]} for p in prior['points']]}
            if old is None:
                # Explicitly identified ETF parts and equities may bootstrap.
                # Existing simulator histories still require their baseline.
                equity = (source.get('consumerScope') == 'equity' and source.get('instrumentType') == 'EQUITY'
                          and source.get('symbol') and source.get('timezone') and source.get('label')
                          and source.get('parser') == 'yahoo' and source.get('field') == 'adjclose'
                          and source.get('collectAnniversary') is True)
                if not equity and (source.get('consumerScope') != 'catalog' or source.get('parser') != 'yahoo'
                        or source.get('field') != 'adjclose' or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]', source.get('isin',''))
                        or not source.get('listingEvidenceId')):
                    reject('Unregistered monthly history bootstrap')
                if result['points'][0][0] != source['periodStart']:
                    reject('New history coverage differs from its registered start')
            else:
                if old['currency'] != result['currency'] or result['points'][0][0] != old['points'][0]['date']:
                    reject('Existing series currency or coverage changed')
                if result['periodEnd'] < old['points'][-1]['date']:reject('History would regress')
            active={k:v for k,v in result.items() if k not in ['proofRows','rawResponse']}
            previous=current.get(source['id'])
            if previous:
                if any(previous[k] != active[k] for k in ['parser','currency','method','periodStart']):reject('Existing return convention changed')
                if any(previous.get(key) != active.get(key) for key in ['symbol','variant','indexCode','isin','field','consumerScope','mic','ticker','valuationBasis','navCurrency','navProvider','productId','identityFrom','navHistoryKind','dwsIdentityBasis']):
                    reject('Existing exact series identity changed')
                # A stale response can also rescale historical adjusted levels.
                # Date monotonicity is independent of whether the months changed.
                prior_level=previous.get('latestLevel')or{}
                next_level=active.get('latestLevel')or{}
                if next_level and prior_level and next_level['asOf']<prior_level['asOf']:
                    reject('Latest NAV observation would regress')
                if active['checkedAt']<previous.get('checkedAt',''):
                    reject('Source control date would regress')
                if previous['points'] == active['points'] and previous.get('anniversaryPoints',[]) == active.get('anniversaryPoints',[]):
                    # Keep the newly validated daily observation and proof even
                    # when completed monthly prices are unchanged.
                    active={**previous,**active}
            unchanged=bool(previous and previous['points']==active['points'] and previous.get('anniversaryPoints',[])==active.get('anniversaryPoints',[]))
            return {'id':source['id'],'status':'validated','sourceState':'unchanged-verified'if unchanged else'succeeded','record':active,'evidence':result}
        except Exception as error:
            return {'id':source['id'],'status':'failed','reason':str(error)}
    with ThreadPoolExecutor(max_workers=3) as pool: observations=list(pool.map(one,config['series']))
    merged=copy.deepcopy(current)
    for o in observations:
        if o['status']=='validated':merged[o['id']]=o['record']
    return merged,{'checkedAt':now.isoformat(),'series':observations}


def monitoring_report(report):
    """Keep diagnostics bounded; full prices/proofs remain in the validated registries."""
    return {'checkedAt': report['checkedAt'], **({'scope':report['scope']}if 'scope'in report else{}), 'series': [
        {key: row[key] for key in ('id', 'status', 'sourceState', 'reason') if key in row} |
        ({'periodEnd': row['record']['periodEnd'],
          'responseSha256': row['evidence'].get('responseSha256'),
          **({'usageState':'partial','usageLimits':{key:row['record'][key]for key in ['historyExcludedMonths','anniversaryExcludedMonths','historyUnqualifiedReturnWindows']if row['record'].get(key)}}
             if any(row['record'].get(key)for key in ['historyExcludedMonths','anniversaryExcludedMonths','historyUnqualifiedReturnWindows'])else{}),
          **({'controlScope':{key:row['evidence']['calendarProof'][key]for key in ['controlledInstrument','controlledFields','requestedStart','controlledCalendarYears']}}
             if row['evidence'].get('calendarProof',{}).get('controlledFields')else{})}
         if row['status'] == 'validated' else {})
        for row in report['series']]}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--baseline',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path)
    p.add_argument('--apply',action='store_true')
    p.add_argument('--evidence-output',type=pathlib.Path,help='Optional full qualification evidence; no change to collection or admission rules')
    scope=p.add_mutually_exclusive_group()
    scope.add_argument('--only',nargs='+',help='Exact configured series IDs to refresh')
    scope.add_argument('--retry-failed',action='store_true',help='Retry only failed sources from the last observation')
    args=p.parse_args()
    path=ROOT/'src/data/automated-monthly.json'
    etf_path=ROOT/'src/data/automated-etf-monthly.json'
    current={**json.loads(path.read_text()), **(json.loads(etf_path.read_text()) if etf_path.exists() else {})}
    status_path=ROOT/'scripts/source-snapshots/monthly-collection-status.json'
    status=json.loads(status_path.read_text()) if status_path.exists() else {'series':{}}
    config=select_series(json.loads((ROOT/'scripts/monthly-automation.json').read_text()),status,args.only,args.retry_failed)
    merged,report=refresh(config,current,json.loads(args.baseline.read_text()))
    report['scope']={'requestedIds':[s['id']for s in config['series']],'expectedIds':[s['id']for s in config['series']],'selection':'failed-or-missing'if args.retry_failed else'explicit'if args.only is not None else'configured-universe'}
    if args.evidence_output:write_json_atomic(args.evidence_output,report)
    write_json_atomic(args.output,monitoring_report(report))
    if args.apply and report['series']:
        for observation in report['series']:
            status['series'][observation['id']]={
                'status':observation['status'],'checkedAt':report['checkedAt'],
                **({'reason':observation['reason']} if observation['status']=='failed' else {
                    'periodEnd':observation['record']['periodEnd'],
                    'responseSha256':observation['evidence']['responseSha256']})}
        write_json_atomic(status_path,status)
    if args.apply and merged!=current:
        write_json_atomic(path,{k:v for k,v in merged.items() if v.get('consumerScope') != 'catalog'})
        write_json_atomic(etf_path,{k:v for k,v in merged.items() if v.get('consumerScope') == 'catalog'})
    evidence_path=ROOT/'scripts/source-snapshots/monthly-automated.json'
    ls_seed_path=ROOT/'scripts/source-snapshots/monthly-lifestrategy.json'
    seed_path=ROOT/'scripts/source-snapshots/monthly-automated-round4.json'
    evidence=json.loads(ls_seed_path.read_text()) if ls_seed_path.exists() else {}
    evidence.update(json.loads(seed_path.read_text()) if seed_path.exists() else {})
    evidence.update(json.loads(evidence_path.read_text()) if evidence_path.exists() else {})
    for observation in report['series']:
        if observation['status']=='validated':
            result=observation['evidence']
            if (evidence.get(observation['id'],{}).get('responseSha256') != observation['record']['responseSha256'] or
                    evidence.get(observation['id'],{}).get('checkedAt') != result.get('checkedAt') or
                    evidence.get(observation['id'],{}).get('calendarProof') != result.get('calendarProof')):
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


def select_series(config,status,only=None,retry_failed=False):
    ids={s['id'] for s in config['series']}
    if only is not None and (not only or set(only)-ids):
        reject('Unknown or empty monthly series selection')
    if retry_failed:
        # Bootstrap the observation once; later daily checks only contact failures.
        selected=({key for key,value in status.get('series',{}).items() if value['status']=='failed'} | (ids-set(status.get('series',{})))) if status.get('series') else ids
        if only is not None:selected &= set(only)
    else:
        selected=set(only) if only is not None else ids
    return {**config,'series':[s for s in config['series'] if s['id'] in selected]}


if __name__=='__main__':main()
