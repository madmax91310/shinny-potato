"""Exact EUR distributing share: raw NAV + explicit gross cash, never Yahoo repairs.

The full issuer distribution note establishes period coverage. Public issuer/FCA
ex-date declarations establish events. The current two-event table may extend
only an already covered period. Missing or contradictory cash is never zero.
"""
import base64
import copy
import datetime as dt
import hashlib
import io
import json
import math
import pathlib
import re
import subprocess
import tempfile
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile
from decimal import Decimal
from bs4 import BeautifulSoup

ISIN='IE00B4K6B022'
NAME='HSBC EURO STOXX 50 UCITS ETF'
PAGE='https://www.assetmanagement.hsbc.co.uk/en/institutional-investor/funds/ie00b4k6b022'
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ROOT=pathlib.Path(__file__).resolve().parents[1]


def positive(value):
    if isinstance(value,bool):raise ValueError('Boolean HSBC financial value')
    n=Decimal(str(value))
    if not n.is_finite()or n<=0:raise ValueError('Invalid HSBC positive financial value')
    return n


def nav_workbook(raw,source,now):
    if source['isin']!=ISIN or source['navCurrency']!='EUR':raise ValueError('Unsupported HSBC exact share')
    with zipfile.ZipFile(io.BytesIO(raw))as book:
        if sum(i.file_size for i in book.infolist())>35_000_000:raise ValueError('Oversized HSBC workbook')
        sheets=[n for n in book.namelist()if re.fullmatch(r'xl/worksheets/sheet\d+\.xml',n)]
        if len(sheets)!=1:raise ValueError('Ambiguous HSBC NAV worksheet')
        rows=[]
        for row in ET.fromstring(book.read(sheets[0])).findall('.//s:row',NS):
            cells=[]
            for i,c in enumerate(row.findall('s:c',NS)):
                if c.find('s:f',NS)is not None:raise ValueError('Formula in HSBC NAV workbook')
                if c.get('r')and re.sub(r'\d','',c.get('r'))!=chr(65+i):raise ValueError('Misaligned HSBC NAV columns')
                if c.get('t')not in ('str','n',None):raise ValueError('HSBC NAV cell type changed')
                v=c.find('s:v',NS);cells.append(v.text if v is not None else '')
            rows.append(cells)
    if rows[:6]!=[['NAV history report'],[NAME],['Share Class : EUR'],[ISIN],[],['Date','Currency','NAV','Shares','AUM']]:raise ValueError('Wrong HSBC NAV identity, class, currency or columns')
    nav={};missing=[];unit_checks=[];missing_units=[];previous=None
    for row in rows[6:]:
        if len(row)!=5:raise ValueError('Truncated HSBC NAV row')
        day=dt.datetime.strptime(row[0],'%m/%d/%Y %I:%M:%S %p').date()
        if day>now.date()or previous is not None and day>=previous:raise ValueError('HSBC NAV dates duplicated, unordered or future')
        previous=day;date=day.isoformat()
        if row[1]!='EUR':raise ValueError('HSBC NAV currency changed')
        if row[2]=='-':
            if date[:7]>=source['periodStart']:missing.append(date)
            continue
        value=positive(row[2])
        if date[:7]<source['periodStart']:continue
        if '-'in row[3:]:
            # These auxiliary columns do not calculate the NAV return. Keep
            # unknown quantities explicit; never turn them into zero or discard
            # the issuer's actually published, identified raw NAV.
            missing_units.append(date);nav[date]=float(value);continue
        shares,aum=positive(row[3]),positive(row[4])
        # Only source rounding: NAV and AUM use their actual published decimal precision. No
        # market/NAV alert tolerance is changed.
        aum_rounding=Decimal(5).scaleb(-max(0,-Decimal(row[4]).as_tuple().exponent)-1)
        nav_rounding=Decimal(5).scaleb(-max(0,-Decimal(row[2]).as_tuple().exponent)-1)
        tolerance=shares*nav_rounding+aum_rounding+Decimal('0.000001')
        if abs(value*shares-aum)>tolerance:raise ValueError('HSBC raw NAV/share/AUM units disagree: '+date)
        nav[date]=float(value);unit_checks.append({'date':date,'nav':float(value),'shares':float(shares),'aum':float(aum)})
    nav=dict(sorted(nav.items()))
    if not nav or min(nav)[:7]!=source['periodStart']:raise ValueError('HSBC requested NAV start missing')
    return nav,{'rawNavUnitChecks':len(unit_checks),'rawNavUnitStart':unit_checks[-1]if unit_checks else None,'rawNavUnitEnd':unit_checks[0]if unit_checks else None,'explicitMissingNavDates':missing,'auxiliaryUnitsNotPublished':missing_units,'inputKind':'raw per-share NAV verified against reported AUM and shares; not an adjusted return series'}


def normalize(text):return ' '.join(text.split())


def announcement(raw,url):
    soup=BeautifulSoup(raw,'html.parser');text=soup.get_text(' ',strip=True)
    if 'RNS Number'not in text:raise ValueError('Official cash declaration identity missing')
    matches=[]
    for table in soup.find_all('table'):
        fields={}
        for tr in table.find_all('tr'):
            if tr.find_parent('table')is not table:continue
            cells=tr.find_all(['td','th'],recursive=False)
            if len(cells)==2:fields[normalize(cells[0].get_text(' ',strip=True))]=normalize(cells[1].get_text(' ',strip=True))
        if fields.get('ISIN(s)')==ISIN:matches.append(fields)
    if len(matches)!=1:raise ValueError('Cash declaration exact ISIN missing or ambiguous')
    f=matches[0]
    if f.get('Issuer/Company Name')!='HSBC ETFs plc'or not re.fullmatch(r'HSBC Euro Stoxx 50 UCITS ETF\s*-?\s*EUR \(Dist\)',f.get('Security/Securities','')):raise ValueError('Cash declaration exact EUR distributing class changed')
    amount=re.fullmatch(r'(\d+\.\d{4}) EUR',f.get('Dividend Amount (Gross) and Currency',''))
    if not amount:raise ValueError('Gross cash currency or units missing')
    dates={k:dt.datetime.strptime(f[k],'%d/%m/%Y').date().isoformat()for k in ['Ex-Date','Record Date','Pay Date']}
    if not dates['Ex-Date']<=dates['Record Date']<=dates['Pay Date']:raise ValueError('Cash declaration date order changed')
    return {'exDate':dates['Ex-Date'],'payDate':dates['Pay Date'],'recordDate':dates['Record Date'],'amount':float(positive(amount[1])),'currency':'EUR','sourceUrl':url,'sourceSha256':hashlib.sha256(raw).hexdigest(),'kind':'explicit gross cash and ex-date, issuer RNS on FCA NSM'}


def current_cash(body,source_url):
    if body.get('headings')!=['','Latest dividend payment','Previous dividend payment']:raise ValueError('HSBC current cash scope changed')
    rows=body['items']
    if len(rows)!=4 or [r[0]for r in rows]!=['Gross dividend per unit ( EUR )','Ex date','Payment date','Record date']or any(len(r)!=3 for r in rows):raise ValueError('HSBC current cash columns changed')
    events=[]
    for col in [1,2]:
        event={'exDate':dt.datetime.strptime(rows[1][col],'%d %b %Y').date().isoformat(),'payDate':dt.datetime.strptime(rows[2][col],'%d %b %Y').date().isoformat(),'recordDate':dt.datetime.strptime(rows[3][col],'%d %b %Y').date().isoformat(),'amount':float(positive(rows[0][col])),'currency':'EUR','sourceUrl':source_url,'kind':'explicit current issuer gross cash and ex-date'}
        if not event['exDate']<=event['recordDate']<=event['payDate']:raise ValueError('Current cash date order changed')
        events.append(event)
    if not events[0]['exDate']>events[1]['exDate']:raise ValueError('Current cash duplicate or unordered')
    return events


MARKER=re.compile(r'The Company paid the following dividends during the financial (year|period) ended\s+(\d{1,2} (?:December|June) 20\d{2}):')


def financial_cash_text(raw):
    """Read a large umbrella PDF in bounded ranges; retain only its cash note.

    The shared 8MB download/2MB extraction readers remain unchanged. These two
    explicitly selected 13–16MB reports need their own 20MB input bound; each
    text range and the retained note keep the existing 2MB extraction limit.
    """
    if not raw.startswith(b'%PDF-')or len(raw)>20_000_000:raise ValueError('Invalid HSBC financial-report PDF')
    with tempfile.TemporaryDirectory()as temp:
        pdf=pathlib.Path(temp)/'report.pdf';pdf.write_bytes(raw)
        info=subprocess.run(['pdfinfo',str(pdf)],capture_output=True,check=True,timeout=12).stdout.decode()
        found=re.search(r'^Pages:\s+(\d+)\s*$',info,re.M)
        if not found or not 1<=int(found[1])<=2000:raise ValueError('HSBC financial report page bound changed')
        tail='';captured=None;section=None;header=''
        for first in range(1,int(found[1])+1,60):
            b=subprocess.run(['pdftotext','-layout','-f',str(first),'-l',str(min(first+59,int(found[1]))),str(pdf),'-'],capture_output=True,check=True,timeout=20).stdout
            if len(b)>2_000_000:raise ValueError('HSBC report text range exceeds existing extraction bound')
            chunk=b.decode()
            if not header:header=chunk[:5000]
            if captured is None:
                combined=tail+chunk;m=MARKER.search(combined)
                if not m:tail=combined[-8000:];continue
                headings=re.findall(r'^\s*(\d+)\.\s+Distributions\s*$',combined[:m.start()],re.M)
                if not headings:raise ValueError('HSBC distribution-note heading missing')
                section=int(headings[-1]);captured=combined[m.start():]
            else:captured+=chunk
            if len(captured.encode())>2_000_000:raise ValueError('HSBC retained cash note exceeds existing extraction bound')
            stop=re.search(r'^\s*'+str(section+1)+r'\.\s+[A-Z]',captured,re.M)
            if stop:return header+'\n'+captured[:stop.start()]
        raise ValueError('HSBC complete distribution note not bounded')


def report_cash(text,asof,url):
    if not re.search(r'HSBC\s+ETFs\s+plc',text,re.I):raise ValueError('Wrong HSBC legal company report')
    markers=list(MARKER.finditer(text));periods=[]
    if not markers:raise ValueError('Explicit full-period cash statement missing')
    for n,m in enumerate(markers):
        end=dt.datetime.strptime(m[2],'%d %B %Y').date();start=end.replace(month=1,day=1)
        if (end.month,end.day)not in [(12,31),(6,30)]:raise ValueError('Unqualified report period')
        block=text[m.end():markers[n+1].start()if n+1<len(markers)else len(text)]
        if not re.search(r'Dividend\s+Ex-Date',block):raise ValueError('Report cash date is not explicitly ex-date')
        lines=block.splitlines();segments=[]
        for i,line in enumerate(lines):
            if re.search(r'HSBC\s+EURO STOXX 50 UCITS',line):
                j=i+1
                while j<len(lines)and not re.match(r'^\s*HSBC\b',lines[j]):j+=1
                segments.append('\n'.join(lines[i:j]))
        if len(segments)!=1:raise ValueError('Cash report fund missing or ambiguous')
        events=[]
        for line in segments[0].splitlines():
            r=re.search(r'EUR\s*\(DIST\)\s+EUR\s+(\d{1,2}-[A-Za-z]{3}-\d{2})\s+(\d+\.\d{4})\s*$',line,re.I)
            if r:
                ex=dt.datetime.strptime(r[1],'%d-%b-%y').date()
                if not start<=ex<=end:raise ValueError('Ex-date outside declared financial period')
                events.append({'exDate':ex.isoformat(),'amount':float(positive(r[2])),'currency':'EUR','sourceUrl':url,'kind':'full financial-period issuer distribution note, EUR (Dist)'})
            elif re.search(r'\d{1,2}-[A-Za-z]{3}-\d{2}|\d+\.\d{4}\s*$',line):raise ValueError('Unparsed report cash row; do not omit it')
        if not events or len({e['exDate']for e in events})!=len(events):raise ValueError('Cash report events missing or duplicate')
        periods.append({'start':start.isoformat(),'end':end.isoformat(),'events':events,'sourceUrl':url})
    if max(p['end']for p in periods)!=asof:raise ValueError('Financial report and directory dates disagree')
    return periods


def merge_events(groups):
    events={};payments={}
    for rows in groups:
        for event in rows:
            e=copy.deepcopy(event)
            if e.get('currency')!='EUR'or not re.fullmatch(r'20\d{2}-\d{2}-\d{2}',e.get('exDate','')):raise ValueError('Unqualified cash identity or date')
            positive(e['amount']);key=e['exDate']
            if key in events and Decimal(str(events[key]['amount']))!=Decimal(str(e['amount'])):raise ValueError('Conflicting gross cash for '+key)
            pay=e.get('payDate')
            if pay:
                if pay in payments and payments[pay]!=key:raise ValueError('Conflicting ex-dates for one payment; no duplicate cash')
                payments[pay]=key
            if key not in events:events[key]={k:e[k]for k in ['exDate','amount','currency','payDate','recordDate']if k in e}|{'references':[]}
            for k in ['payDate','recordDate']:
                if k in e:
                    if k in events[key]and events[key][k]!=e[k]:raise ValueError('Conflicting cash settlement date: '+key)
                    events[key][k]=e[k]
            refs=list(e.get('references',[]))
            if e.get('sourceUrl'):refs.append({k:e[k]for k in ['sourceUrl','sourceSha256','sourceCheckedAt','kind']if k in e})
            by_ref={(r.get('sourceUrl'),r.get('sourceSha256'),r.get('kind')):r for r in events[key]['references']}
            for r in refs:
                rk=(r.get('sourceUrl'),r.get('sourceSha256'),r.get('kind'))
                if rk not in by_ref or r.get('sourceCheckedAt','')>by_ref[rk].get('sourceCheckedAt',''):by_ref[rk]=r
            events[key]['references']=list(by_ref.values())
    return [events[d]for d in sorted(events)]


def qualify(nav,periods,declared,current,source,now,prior=None):
    prior=prior or {};retained=prior.get('hsbcCashQualification')
    if retained and (retained.get('schemaVersion')!=1 or retained.get('isin')!=ISIN or retained.get('currency')!='EUR'):raise ValueError('Retained HSBC cash identity changed')
    if retained and max(nav)<retained['lastNavDate']:raise ValueError('Out-of-order HSBC NAV observation')
    old_events=retained.get('events',[])if retained else []
    formal_by={(p['start'],p['end']):p for p in (retained.get('formalPeriods',[])if retained else [])}
    for p in periods:
        key=(p['start'],p['end']);old=formal_by.get(key)
        if old and {(e['exDate'],Decimal(str(e['amount'])))for e in old['events']}!={(e['exDate'],Decimal(str(e['amount'])))for e in p['events']}:raise ValueError('Conflicting complete issuer cash periods')
        formal_by[key]=p
    formal=list(formal_by.values())
    # Reconcile the complete issuer note with exact-ISIN declarations. It is
    # not sufficient merely to find a matching cash amount somewhere in a PDF.
    events=merge_events([declared,current,[e for p in periods for e in p['events']],old_events])
    if any(e['exDate']>(now.date()+dt.timedelta(days=90)).isoformat()for e in events):raise ValueError('Cash date outside bounded announcement horizon')
    for p in periods:
        official={e['exDate']:Decimal(str(e['amount']))for e in p['events']}
        observed={e['exDate']:Decimal(str(e['amount']))for e in events if p['start']<=e['exDate']<=p['end']}
        if observed!=official:raise ValueError('Cash events contradict the full issuer period: '+p['end'])
    for year in ['2024','2025']:
        p=[p for p in formal if p['start']==year+'-01-01'and p['end']==year+'-12-31']
        if not p:raise ValueError('Complete historical cash coverage missing: '+year)
        for e in p[0]['events']:
            if not any(d['exDate']==e['exDate']and d['amount']==e['amount']for d in declared):raise ValueError('Historical exact-share cash declaration missing')
    coverage=[(p['start'],p['end'])for p in formal]
    if retained:coverage.append((source['periodStart']+'-01',retained['coveredUntil']))
    coverage.append((current[-1]['exDate'],max(nav)))
    end=source['periodStart']+'-01'
    # The December base does not earn a return; financial coverage is required
    # from the first return period, 1 January 2024.
    required='2024-01-01';end=required
    for start,stop in sorted(coverage):
        if start<=end or dt.date.fromisoformat(start)<=dt.date.fromisoformat(end)+dt.timedelta(days=1):end=max(end,stop)
    if end<max(nav):raise ValueError('Cash coverage gap before latest NAV; last-two table cannot certify the omitted period')
    used=[e for e in events if min(nav)<e['exDate']<=max(nav)]
    if any(e['exDate']not in nav for e in used):raise ValueError('Exact ex-date NAV absent; no interpolation')
    factor=1.0;levels={};cash_checks=[];by_day={e['exDate']:e for e in used}
    for day,value in nav.items():
        if day in by_day:
            event=by_day[day]
            if not 0<event['amount']<value:raise ValueError('Gross cash/share units unqualified: '+day)
            f=1+event['amount']/value;factor*=f
            cash_checks.append({**event,'exDateNav':value,'reinvestmentFactor':f,'cashAddedByApplication':True})
        levels[day]=value*factor
    scale=nav[max(nav)]/levels[max(levels)];levels={d:v*scale for d,v in levels.items()}
    # Retain all partial/absent daily rows separately; a monthly calculation
    # needs its real monthly endpoint and each cash ex-date, not every daily row.
    from calendar import monthrange
    ends={d[:7]:d for d in nav if d[:7]<now.strftime('%Y-%m')}
    month_checks=[]
    for month,day in ends.items():
        y,m=map(int,month.split('-'));last=dt.date(y,m,monthrange(y,m)[1]);gap=(last-dt.date.fromisoformat(day)).days
        if gap>4:raise ValueError('HSBC published month-end NAV is unqualified: '+month)
        month_checks.append({'month':month,'navDate':day,'calendarEnd':last.isoformat(),'lagDays':gap})
    proof={'schemaVersion':1,'isin':ISIN,'currency':'EUR','events':events,'formalPeriods':formal,'coveredUntil':max(nav),'lastNavDate':max(nav),'retainedHistoricalReferenceUsed':bool(retained)}
    return levels,{'hsbcCashQualification':proof,'cashChecks':cash_checks,'monthlyEndChecks':month_checks,'constructedIncomeIndex':True,'inputConvention':'raw unadjusted issuer NAV, exact EUR distributing share','outputConvention':'internal total-return index from official NAV and gross cash reinvested at ex-date NAV; not an issuer-published adjusted series','scaleProof':{'anchorDate':max(nav),'rawNav':nav[max(nav)],'factor':scale,'method':'Recomputed from raw NAV and unique explicit gross cash events; scaled to the same-date native per-share NAV. Investor taxes and transaction fees excluded.'}}


def collect(source,now,document,download_large,*,transport=None,prior=None):
    """Called by the ordinary official-NAV producer; source URLs, not values, are configured."""
    if source.get('navHistoryKind')!='official-nav-and-gross-cash'or source.get('periodStart')!='2023-12'or source.get('currency')!='EUR':raise ValueError('Unqualified HSBC NAV/cash consumer contract')
    if transport is None:
        with tempfile.TemporaryDirectory()as folder:
            cfg=pathlib.Path(folder)/'source.json';out=pathlib.Path(folder)/'source-observation.json';cfg.write_text(json.dumps(source))
            child=subprocess.run(['node',str(ROOT/'scripts/download-hsbc-nav-history.mjs'),str(cfg),str(out)],capture_output=True,text=True,timeout=220)
            if not out.exists():raise ValueError('Ordinary HSBC public browser produced no report: '+child.stderr[-500:])
            transport=json.loads(out.read_text())
            if child.returncode or transport.get('status')!='succeeded':raise ValueError('Ordinary HSBC public source failed: '+str(transport.get('error',child.stderr[-500:])))
    if transport.get('schemaVersion')!=1 or transport.get('isin')!=ISIN or transport.get('status')!='succeeded':raise ValueError('Invalid HSBC browser result')
    if transport.get('sourceUrl')!=PAGE or transport.get('requestedCashUrls')!=source['cashAnnouncementUrls'] or transport.get('expectedKinds')!=['presentation','nav-workbook','dividend-table','documents-table','cash-announcement']:raise ValueError('HSBC requested source scope changed or absent')
    start=dt.datetime.fromisoformat(transport['checkedAt'].replace('Z','+00:00'));end=dt.datetime.fromisoformat(transport['completedAt'].replace('Z','+00:00'))
    actual=dt.datetime.now(dt.timezone.utc)
    if not start<=end<=actual+dt.timedelta(seconds=30) or actual-start>dt.timedelta(minutes=15) or end-start>dt.timedelta(minutes=5):raise ValueError('HSBC browser control is stale, future or out of order; cached bodies are not a fresh source check')
    attempts=transport.get('attempts',[])
    if len(attempts)!=4 or {a.get('url') for a in attempts}!=set(source['cashAnnouncementUrls'])or any(a.get('status')!=200 for a in attempts):raise ValueError('HSBC expected cash consultations omitted or failed')
    rows=transport['observations']
    def raw(row):
        body=base64.b64decode(row['bodyBase64'],validate=True)
        if len(body)>3_000_000 or row['status']!=200 or hashlib.sha256(body).hexdigest()!=row['sha256']:raise ValueError('HSBC browser response integrity failed')
        return body
    presentations=[r for r in rows if r['kind']=='presentation'and json.loads(raw(r)).get('exchange',{}).get('selected')==transport.get('selection',{}).get('exchange')]
    presentations=list({r['sha256']:r for r in presentations}.values())
    if len(presentations)!=1:raise ValueError('Exact selected HSBC market context missing or ambiguous')
    identity=json.loads(raw(presentations[0]));selected=[s for s in identity['shareClasses']['items']if s['selected']]
    if len(selected)!=1 or selected[0]['id']!=ISIN or selected[0]['label']!='EUR'or identity['fundInformation']['title']!=NAME or identity['performance']['selected']!='EUR':raise ValueError('HSBC exact share or performance currency changed')
    # The displayed exchange quote can be GBP. It is not our data source:
    # the downloaded, ISIN-identified workbook explicitly publishes EUR NAV.
    selection=transport['selection'];listing=next((e for e in identity['exchange']['items']if e['id']==selection.get('exchange')),{})
    options=[o for g in listing.get('currency',[])for o in g['options']if o['id']==selection.get('listingId')and o['label']==selection.get('currency')]
    if selection.get('isin')!=ISIN or len(options)!=1:raise ValueError('HSBC displayed quote context changed; NAV remains separately qualified')
    document(presentations[0]['url'],supplied=raw(presentations[0]))
    def one(kind):
        matched=[r for r in rows if r['kind']==kind]
        if len(matched)!=1:raise ValueError('HSBC required browser result omitted or duplicated: '+kind)
        r=matched[0];return r['url'],document(r['url'],supplied=raw(r))
    nav_url,book=one('nav-workbook');nav,unit_proof=nav_workbook(book,source,now)
    cash_url,cash_body=one('dividend-table');current=current_cash(json.loads(cash_body),cash_url)
    docs_url,docs_body=one('documents-table');docs=json.loads(docs_body)
    declared=[]
    for url in source['cashAnnouncementUrls']:
        found=[r for r in rows if r['kind']=='cash-announcement'and r['url']==url]
        if len(found)!=1:raise ValueError('Expected historical cash source omitted or duplicated')
        declared.append(announcement(document(url,supplied=raw(found[0])),url))
    periods=[]
    for title in ['Annual report','Semi annual report']:
        choices=[d for g in docs['groups']for d in g['documents']if d['title']==title]
        if len(choices)!=1:raise ValueError('Required issuer financial report omitted or duplicated: '+title)
        d=choices[0];asof=dt.datetime.strptime(d['date'],'%d %b %Y').date()
        if asof>now.date()or (asof.month,asof.day)!=( (12,31)if title=='Annual report'else(6,30)):raise ValueError('Unqualified issuer report period')
        expected='/api/v1/download/document/ie00b4k6b022/gb/en/'+title.lower()
        if d['link']!=expected or d['language']!='en'or d['type']!='pdf':raise ValueError('Wrong official financial report identity')
        url='https://www.assetmanagement.hsbc.co.uk'+urllib.parse.quote(d['link'],safe='/')
        body=document(url,supplied=download_large(url));parsed=report_cash(financial_cash_text(body),asof.isoformat(),url)
        for p in parsed:
            p.update(sourceSha256=hashlib.sha256(body).hexdigest(),sourceCheckedAt=now.date().isoformat())
            for e in p['events']:e.update(sourceSha256=p['sourceSha256'],sourceCheckedAt=p['sourceCheckedAt'])
        periods.extend(parsed)
    for event in declared+current:event['sourceCheckedAt']=now.date().isoformat()
    if prior is None:
        registry=json.loads((ROOT/'src/data/automated-etf-monthly.json').read_text());old=registry.get(source['id'],{})
        if old and (old.get('isin')!=ISIN or old.get('currency')!='EUR'or old.get('navProvider')!='hsbc'):raise ValueError('Stored HSBC exact-share identity changed')
        prior=old.get('calendarProof',{})
    levels,proof=qualify(nav,periods,declared,current,source,now,prior)
    perf=json.loads((ROOT/'src/data/automated-etf.json').read_text())[ISIN]['performance']
    if perf.get('currency')!='EUR'or perf.get('basis')!='fund'or not perf.get('sourceUrl','').endswith('/kiid')or 'KIID precision 0.1%'not in perf.get('method',''):raise ValueError('Shared HSBC annual fund NAV convention/precision changed')
    from issuer_nav_history import calendar_checks
    checks=calendar_checks(levels,perf['years'],1,now)
    if not {2024,2025}<={r['year']for r in checks}:raise ValueError('HSBC initial independent annual checks missing')
    proof.update(unit_proof,sourceControlStartedAt=transport['checkedAt'],sourceControlCompletedAt=transport['completedAt'],sourceRuntime={'runId':__import__('os').getenv('GITHUB_RUN_ID'),'event':__import__('os').getenv('GITHUB_EVENT_NAME'),'codeRevision':__import__('os').getenv('GITHUB_SHA')},controlledInstrument=ISIN,requestedStart=source['periodStart']+'-01',controlledCalendarYears=sorted(str(c['year'])for c in checks),controlledFields=['selected share/class','EUR base NAV context','NAV/shares/AUM units','complete paid-distribution notes','gross cash ex-dates','continuous cash coverage','shared exact-share annual NAV calendar'],calendarRegistry='src/data/automated-etf.json',calendarRegistryPerformanceHash=hashlib.sha256(json.dumps(perf,sort_keys=True,separators=(',',':')).encode()).hexdigest(),calendarSourceConsultedByThisCollector=False,calendarSource={k:perf.get(k)for k in ['sourceUrl','sha256','asOf','checkedAt','method']},independentCalendarChecks=checks)
    return levels,nav,perf['years'],proof
