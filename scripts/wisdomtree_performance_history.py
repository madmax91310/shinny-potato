"""Issuer NAV(TR) chart: exact product only, never its adjacent benchmark.

The public perfchart.wisdomtree.eu client names these two Dataspan endpoints.
Chart levels are performance units. An immutable, previously qualified same-day
NAV anchors their scale; it is not a fresh quote or a successful source check.
"""
import gzip
import hashlib
import json
import math
import base64
import subprocess
import urllib.error
from pathlib import Path
from issuer_nav_history import dated, xlsx_rows
from issuer_documents import download

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://dataspanapi.wisdomtree.com/funddetails/'
# Shared transport configuration also serves the ordinary monthly registry.
# Do not duplicate a routing override in multiple producer catalogues.
PATH_STYLES = {row['id']: row for row in json.loads((ROOT/'scripts/official-nav-remainder-sources.json').read_text()) if row.get('wisdomPerformancePathStyle')}


def acquire(source):
    """One bounded browser fallback after an HTTP403, never after invalid data."""
    endpoints=urls(source)
    headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
             'Accept':'application/json','Origin':'https://www.wisdomtree.com','Referer':source['sourceUrl']}
    bodies={};attempts=[]
    try:
        for url in endpoints:
            bodies[url]=download(url,headers=headers,max_bytes=8_000_000)
            attempts.append({'url':url,'transport':'public-widget-http','status':'received'})
        return bodies,{'actualNavTransport':'public-widget-http','accessAttempts':attempts}
    except urllib.error.HTTPError as error:
        if error.code!=403:raise
        attempts.append({'url':url,'transport':'public-widget-http','status':'unavailable','error':'HTTP403'})
    process=subprocess.run(['node',str(Path(__file__).with_name('download-wisdomtree-performance.mjs')),source['id']],
                           capture_output=True,timeout=100)
    if process.returncode:raise ValueError('Ordinary public browser performance failed: '+process.stderr.decode(errors='replace')[-1200:])
    if len(process.stdout)>24_000_000:raise ValueError('Oversized browser performance response')
    result=json.loads(process.stdout)
    rows=result.get('results',[])
    if len(rows)!=2 or [r.get('url')for r in rows]!=endpoints or any(r.get('status')!=200 for r in rows):
        raise ValueError('Browser performance source scope changed')
    bodies={r['url']:base64.b64decode(r['body'],validate=True)for r in rows}
    if any(len(body)>8_000_000 for body in bodies.values()):raise ValueError('Oversized issuer performance payload')
    return bodies,{'actualNavTransport':'ordinary-public-browser-json',
                   'accessAttempts':attempts+[{'url':url,'transport':'ordinary-public-browser-json','status':'received'}for url in endpoints]}


def anchor_for(source):
    anchor = json.loads((ROOT/'scripts/wisdomtree-performance-anchors.json').read_text())[source['isin']]
    if anchor.get('format') == 'qualified-nav-modal-json':
        from issuer_nav_history import wisdomtree_identity
        raw = gzip.decompress((ROOT/anchor['navFile']).read_bytes())
        page = gzip.decompress((ROOT/anchor['pageFile']).read_bytes())
        if (hashlib.sha256(raw).hexdigest() != anchor['rawNavSha256']
                or hashlib.sha256(page).hexdigest() != anchor['rawPageSha256']):
            raise ValueError('Historical NAV/identity evidence changed')
        identity = wisdomtree_identity(page.decode(), source['isin'])
        values = [r['nav'] for r in json.loads(raw) if r['dt'] == anchor['date']]
        if (identity['wtClassID'] != source['wisdomClassId']
                or identity['fundCurrency'] != source['navCurrency']
                or identity['useOfIncome'] not in ('Accumulating', 'N/A')
                or anchor['classId'] != source['wisdomClassId']
                or anchor['isin'] != source['isin'] or anchor['currency'] != source['navCurrency']
                or values != [anchor['nav']]
                or anchor['sourceUrl'] != f"https://www.wisdomtree.com/api/fund-history/{source['wisdomClassId']}?view=navHistoryModal"):
            raise ValueError('Unqualified historical exact-share NAV anchor')
        return anchor
    raw = gzip.decompress((ROOT/anchor['workbook']).read_bytes())
    if (hashlib.sha256(raw).hexdigest() != anchor['rawWorkbookSha256']
            or anchor['isin'] != source['isin'] or anchor['currency'] != source['navCurrency']
            or anchor['classId'] != source['wisdomClassId']):
        raise ValueError('Unqualified historical NAV unit anchor')
    rows = xlsx_rows(raw)
    if sum(r.get('B') == str(anchor['classId']) for r in rows) != 1:
        raise ValueError('Anchor workbook belongs to another product')
    values = [float(r['C']) for r in rows if r.get('B') == anchor['date']]
    if values != [anchor['nav']]:
        raise ValueError('Historical NAV anchor changed')
    return anchor


def parse(graph, table, source, anchor, now):
    if not isinstance(graph, list) or not graph or not isinstance(table, list) or not table:
        raise ValueError('Empty or changed official performance response')
    ticker, listing = source['wisdomTicker'], source['wisdomListingId']
    name, currency = source['wisdomProductName'], source['navCurrency']
    # Tabular product rows bind the chart's listing to the exact ISIN. A name
    # match or a benchmark row alone is never an instrument identity proof.
    products = [r for r in table if r.get('wtTypeID') == 1]
    if not products:
        raise ValueError('Exact product absent from official performance table')
    seen = set()
    for row in products:
        key = (row.get('windowTag'), row.get('dt'), row.get('rorWindow'))
        if key in seen:
            raise ValueError('Duplicate official product performance window')
        seen.add(key)
        if (row.get('entityID') != source['isin'] or row.get('entityGroup') != 'product'
                or row.get('entityListingID') != listing or row.get('wtListingID') != listing
                or row.get('ticker') != ticker+' LN' or row.get('entityName') != name
                or row.get('currency') != currency or row.get('levelTypeID') != 2
                or row.get('levelType') != 'NAV (TR)'
                or row.get('windowTag') not in ('calYearEnd','monthEnd')
                or any(row.get(k) != (0 if row['windowTag']=='calYearEnd' else None)
                       for k in ('checkDiff', 'checkDiffSumEntityGroup', 'checkDiffSumDataSet'))):
            raise ValueError('Official performance share/currency/convention conflict')
    fund = []
    for row in graph:
        if type(row.get('wtTypeID')) is not int or row['wtTypeID'] not in (1, 2, 3):
            raise ValueError('Unknown issuer chart entity type')
        if row['wtTypeID'] != 1:
            continue  # Adjacent benchmark is deliberately not a fund observation.
        if (row.get('entityListingID') != listing or row.get('wtListingID') != listing
                or row.get('tickerA') != ticker+' LN' or row.get('name') != name
                or row.get('currency') != currency or row.get('baseCCY') != currency
                or row.get('levelTypeID') != 2 or row.get('levelType') != 'NAV (TR)'
                or row.get('shiftTicker') is not None
                or row.get('listingShiftDisposition') != 'listingShift'
                or row.get('entityInceptionDt') != source.get('wisdomChartInception', source['wisdomInception'])
                or row.get('inceptionDt') != source['wisdomInception']):
            raise ValueError('Unqualified product identity, historical currency or listing shift')
        if row['cobDate'] < source['wisdomInception']:
            raise ValueError('Official performance precedes the exact product')
        fund.append(row)
    if not fund or any(type(r.get('cntCheck')) is not int or r['cntCheck'] != len(fund) for r in fund):
        raise ValueError('Incomplete issuer product chart')
    points = dated([(r['cobDate'], r['officialLevel']) for r in fund], now)
    if len(points) != len(fund):
        raise ValueError('Duplicate official performance date')
    # Earlier product history may precede the current legal security (Coffee).
    # Keep it only in the raw evidence; never supply it before the approved window.
    excluded = sum(day < source['periodStart']+'-01' for day in points)
    points = {day:value for day,value in points.items() if day >= source['periodStart']+'-01'}
    if not points:raise ValueError('No official performance in supplied exact-security window')
    end = max(points)
    # The table's cobDate is its refresh date, not the valuation date of each
    # completed calendar window (dt). The official widget updates these feeds
    # independently. Never compare its current/rolling return to an older chart.
    # Only closed, individually corroborated calendar windows qualify here.
    table_dates = {r['cobDate'] for r in products}
    if len(table_dates) != 1 or next(iter(table_dates)) < end or next(iter(table_dates)) > now.date().isoformat():
        raise ValueError('Unqualified table publication chronology')
    from issuer_nav_history import calendar_checks
    closed_checks = []
    for row in products:
        if row['windowTag'] != 'calYearEnd':
            continue
        year = int(row['dt'][:4])
        if row['dt'] != f'{year}-12-31' or year >= now.year:
            raise ValueError('Unqualified closed calendar period')
        if f'{year-1}-12-01' < source['periodStart']+'-01':
            continue
        value = row.get('windowRoR')
        if type(value) not in (int, float) or not math.isfinite(value):
            raise ValueError('Invalid published calendar return')
        check = calendar_checks(points, {str(year):round(value*100, 2)}, 2, now)
        if not check or check[0]['year'] != year:
            raise ValueError('Closed table calendar lacks daily valuation bounds')
        closed_checks.extend(check)
    if not closed_checks:
        raise ValueError('No independently matched completed table calendar')
    if (anchor['isin'], anchor['currency']) != (source['isin'], currency) or anchor['date'] not in points:
        raise ValueError('Exact same-day NAV unit anchor unavailable')
    nav = anchor['nav']
    if type(nav) not in (int, float) or not math.isfinite(nav) or nav <= 0:
        raise ValueError('Invalid historical NAV unit anchor')
    scale = nav / points[anchor['date']]
    normalized = {day: value*scale for day, value in points.items()}
    normalized[anchor['date']] = nav
    proof = {'controlledInstrument': source['isin'], 'controlledFields': [
        'tabular.entityID', 'tabular.entityGroup', 'tabular.wtListingID', 'tabular.currency',
        'tabular.levelType', 'gro10k.wtTypeID', 'gro10k.wtListingID', 'gro10k.tickerA',
        'gro10k.name', 'gro10k.currency', 'gro10k.baseCCY', 'gro10k.entityInceptionDt',
        'gro10k.levelType', 'gro10k.shiftTicker', 'gro10k.cntCheck', 'gro10k.cobDate', 'gro10k.officialLevel'],
        'requestedStart': source['periodStart']+'-01', 'incomeTreatment': 'Issuer exact-product NAV (TR); no additional cash',
        'navHistoryTransport': 'official-dataspan-nav-tr', 'dailyObservations': len(points),
        'sourceSnapshotDate': end, 'issuerProductInception': source['wisdomInception'],
        'issuerChartInception': source.get('wisdomChartInception', source['wisdomInception']),
        'tablePublicationDate': next(iter(table_dates)), 'closedTableCalendarChecks': closed_checks,
        'snapshotQualification': 'Closed calendar dt/December valuation bounds matched individually at unchanged published two-decimal precision; current and rolling table returns are not used',
        'excludedPreWindowObservations':excluded,'suppliedExactSecurityStart':source['periodStart']+'-01',
        'scaleProof': {'anchor': anchor, 'sourcePerformanceLevel': points[anchor['date']], 'factor': scale,
            'method': 'Official exact-product NAV(TR) performance units anchored to independently qualified same-day per-share NAV; no raw historical price claim',
            'anchorIsFreshSourceCheck': False}}
    return normalized, proof


def urls(source):
    ticker = source['wisdomTicker']
    if not ticker.isalpha() or not ticker.isupper():
        raise ValueError('Invalid registered issuer ticker')
    registered=PATH_STYLES.get(source.get('id'))
    if registered and any(source.get(k)!=registered.get(k) for k in ('isin','wisdomClassId','wisdomTicker','navCurrency')):
        raise ValueError('Issuer path identity differs from the shared registered share')
    style=source.get('wisdomPerformancePathStyle',registered.get('wisdomPerformancePathStyle') if registered else 'canonical')
    if style not in ('canonical','issuer-widget'):raise ValueError('Unqualified issuer performance path style')
    path='historical_performance' + ('/' if style=='canonical' else '')
    return [ORIGIN+path+'?entity='+ticker+'&mode='+mode for mode in ('gro10k', 'tabular')]
