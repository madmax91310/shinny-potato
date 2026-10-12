"""Official, renewable earnings archives for the second company expansion.

Financial values and document URLs are discovered on every collection. Only
consolidated GAAP statements and four actually published quarters are accepted.
Annual-minus-nine-month EPS is deliberately unsupported.
"""
import datetime as dt
import io
import json
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse, urlencode
from bs4 import BeautifulSoup
import pdfplumber
from company_publications import get, row, MONTHS

SOURCES = {
 'mastercard': ('embedded', 'https://investor.mastercard.com/financials-and-sec-filings/quarterly-results/default.aspx'),
 'broadcom': ('links', 'https://investors.broadcom.com/financial-information/quarterly-results'),
 'intuit': ('links', 'https://investors.intuit.com/financial-information/financial-results'),
 'coca-cola': ('links', 'https://investors.coca-colacompany.com/financial-information/financial-results'),
 'mcdonalds': ('links', 'https://corporate.mcdonalds.com/corpmcd/investors/financial-information.html'),
 'salesforce': ('q4', 'https://investor.salesforce.com'),
 'servicenow': ('q4', 'https://investor.servicenow.com'),
 'sp-global': ('q4', 'https://investor.spglobal.com'),
 'adobe': ('links','https://www.adobe.com/investor-relations/financial-documents.html'),
 'pepsico': ('links','https://investors.pepsico.com/financial-information/quarterly-earnings'),
 'texas-instruments': ('links','https://investor.ti.com/financial-information/earnings-annual-reports'),
 'intuitive-surgical': ('links','https://isrg.intuitive.com/press-releases'),
}
ROUND2 = set(SOURCES)
SYMBOLS = dict(zip(['mastercard','broadcom','intuit','coca-cola','mcdonalds','salesforce','servicenow','sp-global','adobe','pepsico','texas-instruments','intuitive-surgical'], ['MA','AVGO','INTU','KO','MCD','CRM','NOW','SPGI','ADBE','PEP','TXN','ISRG']))
IDENTITY = {'mastercard':r'Mastercard', 'broadcom':r'Broadcom', 'intuit':r'Intuit',
 'coca-cola':r'Coca.Cola', 'mcdonalds':r'McDonald', 'salesforce':r'Salesforce',
 'servicenow':r'ServiceNow', 'sp-global':r'S&P Global','adobe':r'Adobe','pepsico':r'PepsiCo','texas-instruments':r'Texas Instruments','intuitive-surgical':r'Intuitive'}


def discover(ident):
    mode, archive = SOURCES[ident]
    if mode == 'q4':
        url = archive + '/feed/FinancialReport.svc/GetFinancialReportList?reportTypes=First%20Quarter%7CSecond%20Quarter%7CThird%20Quarter%7CFourth%20Quarter&year=-1&startIndex=0&length=100'
        reports = json.loads(get(url))['GetFinancialReportListResult']
        rows = []
        for report in reports:
            docs = [d['DocumentPath'] for d in report['Documents'] if
                    (d['DocumentCategory'] == 'news' or 'Earnings Release' in d['DocumentTitle'])
                    and d['DocumentPath'].lower().endswith('.pdf')]
            if len(docs) > 1:
                raise ValueError('Ambiguous official earnings release')
            if docs:
                rows.append({'url':docs[0], 'quarter':report['ReportSubType']=='Fourth Quarter',
                             'year':int(report['ReportYear'])})
    else:
        raw = get(archive, max_bytes=15_000_000).decode('utf-8')
        if mode == 'embedded':
            marker = 'documentCategoryData:'
            if marker not in raw: raise ValueError('Official archive structure changed')
            cats, _ = json.JSONDecoder().raw_decode(raw.split(marker,1)[1].lstrip())
            rows = [{'url':urljoin(archive,d['link']), 'quarter':d['text']=='Q4','year':int(y['year'])}
                    for c in cats if c['category']=='Earnings Release' for y in c['data']
                    for d in y['documents'] if d.get('link')]
            rows.sort(key=lambda r:(r['year'],int(re.search(r'/q([1-4])/',r['url']).group(1))),reverse=True)
        else:
            soup = BeautifulSoup(raw,'html.parser'); rows=[]
            if ident=='intuitive-surgical':
                select=next((v for v in soup.select('select[name]')if 'year' in v['name']),None)
                if select is None:raise ValueError('Issuer year archive selector changed')
                values=[o.get('value')for o in select.select('option[value]')if re.fullmatch(r'20\d{2}',o.get('value',''))][:4]
                pages=[]
                for year in values:
                    base=archive+'?'+urlencode({select['name']:year})
                    page=BeautifulSoup(get(base),'html.parser');pages.append(page)
                    extra=[urljoin(archive,a['href'])for a in page.select('a[href]')if 'page=' in a['href']][:2]
                    pages.extend(BeautifulSoup(get(u),'html.parser')for u in dict.fromkeys(extra))
                soup=BeautifulSoup(''.join(str(v)for v in pages),'html.parser')
            for a in soup.select('a[href]'):
                url = urljoin(archive,a['href']); label=a.get_text(' ',strip=True)
                if ident=='adobe': valid=label=='Earnings press release'
                elif ident=='pepsico':valid=bool(re.search(r'Press\s+Release',label,re.I))and url.lower().endswith('.pdf')
                elif ident=='texas-instruments':valid='/news-release-details/ti-reports-' in url and 'financial-results' in url
                elif ident=='intuitive-surgical':valid='/news-release-details/intuitive-announces-' in url and 'quarter-earnings' in url
                elif ident == 'mcdonalds': valid='Earnings Release' in label and url.lower().endswith('.pdf')
                elif ident == 'coca-cola': valid='earnings_release/' in url and url.lower().endswith('.pdf')
                else: valid=bool(re.search(r'/(?:[^/]*reports-(?!to)|[^/]*announces-(?:first|second|third|fourth))',url))
                if valid:
                    year=re.search(r'20\d{2}',label+' '+url)
                    if ident=='coca-cola':
                        label+=' '+a.find_previous(['h2','h3','h4']).get_text(' ',strip=True)
                    if ident=='adobe':
                        label+=' '+a.find_previous(['h3','h4']).get_text(' ',strip=True)
                        url=url.split('#')[0]
                    rows.append({'url':url, 'quarter':bool(re.search(r'fourth.quarter|(?<![A-Za-z0-9])Q4(?![A-Za-z0-9])|\b4Q\b|FY\s+20\d{2}',label+' '+url,re.I)),
                                 'year':int(year[0]) if year else 0})
            # Archive order is retained for rolling fiscal years; McDonald's
            # explicitly lists Q1..Q4 ascending inside each year.
            if ident in ('mcdonalds','texas-instruments'):
                def key(r):
                    q=re.search(r'Q([1-4])',r['url'],re.I)
                    quarter=int(q[1])if q else next((n for n,name in enumerate(['first','second','third','fourth'],1)if name+'-quarter'in r['url']),0)
                    return r['year'],quarter
                rows.sort(key=key,reverse=True)
    unique={r['url']:r for r in rows}
    rows=list(unique.values())
    if len(rows)<4: raise ValueError('Archive has fewer than four earnings releases')
    selected=rows[:5]+[r for r in rows if r['quarter']][:(2 if ident=='adobe'else 3)]
    urls=list(dict.fromkeys(r['url']for r in selected))
    # Only official archive links and their explicitly linked document CDN.
    allowed={urlparse(archive).hostname,'s25.q4cdn.com','s205.q4cdn.com','s29.q4cdn.com'}
    if any(urlparse(u).scheme!='https' or urlparse(u).hostname not in allowed for u in urls):
        raise ValueError('Archive linked an unqualified host')
    return urls


def income_sections(raw, ident):
    if raw.startswith(b'%PDF'):
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            text='\n'.join(p.extract_text(x_tolerance=1)or''for p in pdf.pages[:40])
        if not re.search(IDENTITY[ident],text,re.I):raise ValueError('Wrong issuer document')
        heading=r'(?im)^[ \t]*(?:(?:UNAUDITED|QUARTERLY|ANNUAL|CONDENSED) +)*CONSOLIDATED STATEMENTS? OF (?:OPERATIONS|INCOME)(?: *\(UNAUDITED\))? *$'
        starts=list(re.finditer(heading,text)); sections=[]
        for m in starts:
            end=re.search(r'(?im)^\s*(?:CONDENSED\s+)?CONSOLIDATED (?:BALANCE|STATEMENTS? OF CASH)',text[m.end():])
            candidate=text[m.start():m.end()+end.start()]if end else text[m.start():]
            # McDonald's prints quarterly and annual statements separately.
            next_heading=re.search(heading,candidate[len(m[0]):])
            if next_heading:candidate=candidate[:len(m[0])+next_heading.start()]
            sections.append(candidate)
        return sections
    soup=BeautifulSoup(raw,'html.parser')
    if not re.search(IDENTITY[ident],soup.get_text(' ',strip=True),re.I):raise ValueError('Wrong issuer document')
    sections=[]
    for table in soup.select('table'):
        lines=[' '.join(c.get_text(' ',strip=True)for c in tr.find_all(['td','th'],recursive=False))
               for tr in table.select('tr')if tr.find_parent('table')is table]
        text='\n'.join(lines)
        if not re.search(r'CONSOLIDATED STATEMENTS? OF (?:INCOME|OPERATIONS)',text,re.I):
            prev=table.find_previous(string=re.compile(r'CONSOLIDATED (?:STATEMENTS?|BALANCE)',re.I))
            if prev and re.search(r'CONSOLIDATED STATEMENTS? OF (?:INCOME|OPERATIONS)',str(prev),re.I):
                caption=prev.parent.get_text(' ',strip=True)
                if len(caption)>400:caption=str(prev)
                text=caption+'\n'+text
        if not re.search(r'(?:in|and shares in) millions',text,re.I):
            unit=table.find_previous(string=re.compile(r'in millions',re.I))
            if unit and re.search(r'CONSOLIDATED STATEMENTS? OF (?:INCOME|OPERATIONS)',unit.parent.get_text(' ',strip=True),re.I):text=unit.parent.get_text(' ',strip=True)+'\n'+text
        if re.search(r'CONSOLIDATED STATEMENTS? OF (?:INCOME|OPERATIONS)',text,re.I) and not re.search(r'RECONCILIATION|NON.GAAP',text[:250],re.I) and re.search(r'diluted',text,re.I) and re.search(r'(?:months|quarters?|years?) ended',text,re.I):
            sections.append(text)
    return sections


def statement_periods(text, ident, url, today):
    text=re.sub(r'(?<=[A-Za-z])\.+(?=[A-Za-z])','',text)
    text=re.sub(r'\.{2,}', ' ', text)
    text=re.sub(r'\b2\s+0(\d{2})\b',r'20\1',text)
    if not re.search(r'(?:in|and shares in) millions',text,re.I):raise ValueError('Unknown statement units')
    labels=[r'Net operating revenues',r'Total net revenue',r'Net revenues?',r'Total revenues?',r'Revenues?']
    rv=row(text,labels)
    if not rv:raise ValueError('Missing consolidated revenue')
    count=len(rv)
    header=re.split(r'(?im)^\s*(?:Net operating revenues|Net revenues?|Total net revenue|Total revenues?|Revenues?)\b',text,1)[0]
    if 'non-gaap' in header.lower():raise ValueError('Non-GAAP statement rejected')
    expected=None if ident=='mcdonalds'else count
    net=row(text,[r'Net income attributable to (?:Intuitive Surgical, Inc\.|S&P Global Inc\.|shareowners of The Coca.Cola Company|PepsiCo)',r'Net income(?: \(loss\))?'],expected)
    op=row(text,[r'Operating profit',r'Operating income(?: \(loss\))?',r'Income \(loss\) from operations',r'Income from operations(?: \(\d+\))?'],expected)
    epstext=re.split(r'(?im)^\s*Weighted.average shares',text,1)[0]
    if ident=='pepsico':eps=row(epstext,[r'Net income attributable to PepsiCo per common share'],count)
    elif ident=='broadcom' and re.search(r'Diluted (?:income|earnings)(?: \(loss\))? per share(?: \(\d+\))?\s*:',epstext):
        epstext=re.split(r'Diluted (?:income|earnings)(?: \(loss\))? per share(?: \(\d+\))?\s*:',epstext,1)[1]
        eps=row(epstext,[r'Net income(?: \(loss\))? per share'],count)
    else:eps=row(epstext,[r'Diluted net income(?: \(loss\))? per share\d*(?: \(\d+\))?',r'Diluted earnings per share',r'Earnings per share.diluted',r'Net income per share - diluted(?: \(\d+\))?',r'Diluted(?: \(\d+\))?'],expected)
    if not net or not eps:raise ValueError('Incomplete consolidated GAAP statement')
    if ident in ('sp-global','coca-cola'):
        if count not in (3,6):raise ValueError('Unknown SP Global change-column structure')
        indices=[0,1]+([3,4]if count==6 else [])
        rv,net,eps=[[a[i]for i in indices]for a in [rv,net,eps]];op=[op[i]for i in indices]if op else None;count=len(rv)
    if ident=='mcdonalds':
        if count not in (3,4):raise ValueError('Unknown McDonald change-column structure')
        rv,net,eps=rv[:2],net[:2],eps[:2];op=op[:2]if op else None;count=2
    if min(rv)<=0:raise ValueError('Nonpositive consolidated revenue')
    numeric_dates=re.findall(r'\b(\d{1,2})/(\d{1,2})/(20\d{2})\b',header)
    full=re.findall(r'\b('+'|'.join(MONTHS)+r')\s+(\d{1,2})\s*,?\s+(20\d{2})\b',header,re.I)
    if ident=='pepsico' and len(numeric_dates)==count:
        dates=[dt.date(int(y),int(m),int(d))for m,d,y in numeric_dates]
    elif len(full)==count:
        dates=[dt.date(int(y),MONTHS[m.lower()],int(d))for m,d,y in full]
    else:
        md=re.findall(r'\b('+'|'.join(MONTHS)+r')\s+(\d{1,2})\s*,?',header,re.I)
        year_lines=[re.findall(r'\b20\d{2}\b',l)for l in header.splitlines()if re.search(r'\b20\d{2}\b',l)]
        years=next((ys for ys in reversed(year_lines)if len(ys)==count),re.findall(r'\b20\d{2}\b',header))
        if len(years)!=count or not md:raise ValueError('Ambiguous comparative dates: '+header[:300].replace('\n',' | '))
        if len(md)==count:dates=[dt.date(int(y),MONTHS[m.lower()],int(d))for (m,d),y in zip(md,years)]
        elif len(md)in (1,2):dates=[dt.date(int(y),MONTHS[md[0][0].lower()],int(md[0][1]))for y in years]
        else:raise ValueError('Unknown comparative date layout')
    if any(d>today for d in dates):raise ValueError('Future financial period')
    # McDonald's has two observations plus absolute and relative changes.
    annual=bool(re.search(r'twelve months|fiscal year ended|years? ended|three.*twelve months',header,re.I))
    quarterly=bool(re.search(r'three months|three and (?:six|nine) months|fiscal quarter|quarters? ended|quarters?\s+ended',header,re.I))
    if ident=='pepsico':
        weeks=[int(v)for v in re.findall(r'(\d+) Weeks Ended',header,re.I)]
        if weeks:
            if len(weeks)not in (1,2)or weeks[0]not in (12,16,17)or count not in (2,4):raise ValueError('Unknown PepsiCo weekly fiscal structure')
            pairs=[(0,1,3)]+([(2,3,12)]if len(weeks)==2 and weeks[1]in (52,53)else [])
        elif count==4 and quarterly and annual:pairs=[(0,1,3),(2,3,12)]
        else:raise ValueError('Unknown PepsiCo fiscal period')
    elif ident=='intuitive-surgical':
        if count not in (2,3,4):raise ValueError('Unknown Intuitive column structure')
        pairs=[(0,2 if count==3 else 1,3)]if quarterly else [(0,1,12)]if annual else []
    elif ident=='broadcom':
        if count not in (3,5):raise ValueError('Unknown Broadcom quarterly-column structure')
        pairs=[(0,2,3)]+([(3,4,12)]if annual and count==5 else [])
    elif count in (2,4):
        pairs=([(0,1,3)]if quarterly else [])+([(2,3,12)]if annual and quarterly and count==4 else [(0,1,12)]if annual and not quarterly else [])
    else:raise ValueError('Unknown period column structure')
    if not pairs:
        if re.search(r'six months|nine months',header,re.I):return []
        raise ValueError('Unknown period duration')
    result=[]
    for i,j,duration in pairs:
        if not 330<=(dates[i]-dates[j]).days<=400:raise ValueError('Comparatives are not year-over-year')
        p={'start':None,'end':dates[i].isoformat(),'previousStart':None,'previousEnd':dates[j].isoformat(),'durationMonths':duration,'sourceUrl':url,'tags':{}}
        for k,values in [('revenue',rv),('netIncome',net),('dilutedEPS',eps),('operatingIncome',op)]:
            if values:
                mult=1 if k=='dilutedEPS'else 1e6;p[k]=values[i]*mult;p['previous'+k[0].upper()+k[1:]]=values[j]*mult;p['tags'][k]='Official consolidated GAAP statement'
        if ident=='pepsico' and duration==3 and weeks:p['durationWeeks']=weeks[0]
        if ident in ('sp-global','coca-cola','intuitive-surgical','pepsico'):p['incomeBasis']='part du groupe'
        # Standalone financing cost only; a net interest line is not a substitute.
        interests = row(text, [r'Interest expense(?: \(\d+\))?', r'Interest and debt expense'])
        if interests and ident in ('sp-global','coca-cola') and len(interests) in (3,6):
            interests = [interests[k] for k in ([0,1,3,4] if len(interests)==6 else [0,1])]
        if interests and len(interests) == len(rv):
            p['interestExpense'] = abs(interests[i])*1e6
            p['previousInterestExpense'] = abs(interests[j])*1e6
        share_section = re.split(r'(?im)^\s*(?:Weighted.average shares|Shares used)', text, 1)
        if len(share_section) == 2:
            counts = row(share_section[1], [r'Diluted(?: \(\d+\))?'])
            if counts and len(counts) == len(rv) and min(counts)>100:
                p['averageDilutedShares'] = counts[i]*1e6
                p['previousAverageDilutedShares'] = counts[j]*1e6
        p['margin']=p['netIncome']/p['revenue']*100;result.append(p)
    return result


def parse(raw,ident,url,today):
    periods=[]
    for text in income_sections(raw,ident):
        if 'percentage of total revenues' in text.lower():continue
        header=re.split(r'(?im)^\s*(?:Net operating revenues|Net revenues?|Total net revenue|Total revenues?|Revenues?)\b',text,1)[0]
        if re.search(r'six months|nine months',header,re.I)and not re.search(r'three months|three and|quarters? ended|twelve months|year ended',header,re.I):continue
        periods.extend(statement_periods(text,ident,url,today))
    if not periods:raise ValueError('No consolidated financial statement')
    return periods


def collect(profile,today,old=None):
    ident=profile['id']
    if ident not in ROUND2 or profile['currency']!='USD' or profile.get('symbol')!=SYMBOLS[ident]:raise ValueError('Unsupported round-two issuer')
    urls=discover(ident)
    def load(url):
        try:return parse(get(url),ident,url,today)
        except Exception as e:raise ValueError(str(e)+' / '+url)from e
    with ThreadPoolExecutor(max_workers=3)as pool:reports=list(pool.map(load,urls))
    periods=[p for report in reports for p in report]
    all_quarters=sorted({p['end']:p for p in periods if p['durationMonths']==3}.values(),key=lambda p:p['end'],reverse=True)
    if ident=='pepsico':
        for a,b in zip(all_quarters[:4],all_quarters[1:5]):
            days=(dt.date.fromisoformat(a['end'])-dt.date.fromisoformat(b['end'])).days
            if days%7 or days//7 not in (12,16,17):raise ValueError('PepsiCo fiscal-week boundary changed: '+a['end']+' / '+b['end'])
            if a.get('durationWeeks',days//7)!=days//7:raise ValueError('PepsiCo declared fiscal weeks disagree with dates')
            a['durationWeeks']=days//7;a['start']=(dt.date.fromisoformat(b['end'])+dt.timedelta(days=1)).isoformat()
    quarters=all_quarters[:4]
    annuals=sorted({p['end']:p for p in periods if p['durationMonths']==12}.values(),key=lambda p:p['end'],reverse=True)
    if len(quarters)!=4 or len(annuals)<2:raise ValueError('Four quarters and renewable annual history required')
    if any(not 75<=(dt.date.fromisoformat(a['end'])-dt.date.fromisoformat(b['end'])).days<=(120 if ident=='pepsico'else 105) for a,b in zip(quarters,quarters[1:])):raise ValueError('Missing published quarter')
    if (today-dt.date.fromisoformat(annuals[0]['end'])).days>550 or (today-dt.date.fromisoformat(quarters[0]['end'])).days>200:raise ValueError('Stale official accounts')
    history={}
    for a in reversed(annuals):
        for previous in (True,False):
            end=a['previousEnd']if previous else a['end'];rev=a['previousRevenue']if previous else a['revenue'];net=a['previousNetIncome']if previous else a['netIncome']
            history[end]={'start':None,'end':end,'revenue':rev,'netIncome':net,'margin':net/rev*100,'sourceUrl':a['sourceUrl']}
    # Detect splits between the oldest and newest release; SEC historical EPS
    # will not be substituted without a matching declared share basis.
    annual=annuals[0]
    return {'annual':annual,'quarter':quarters[0]if quarters[0]['end']>annual['end']else None,
      'quarters':quarters,'historyYears':sorted(history.values(),key=lambda p:p['end'])[-5:],'historyObservedAt':today.isoformat(),
      'trailing':{'end':quarters[0]['end'],'dilutedEPS':sum(p['dilutedEPS']for p in quarters),'revenue':sum(p['revenue']for p in quarters),
                  'sourceUrls':[p['sourceUrl']for p in quarters],'definition':'Somme de quatre trimestres GAAP réellement publiés'}}


def normalise_eps_basis(accounts, profile, quote, quote_body):
    """Put four published EPS values on the declared current share basis.

    Original reported EPS is retained. A market split event alone is never
    sufficient: the same ratio/effective date must occur in issuer footnotes.
    """
    oldest = accounts.get('quarters', [{}])[-1].get('end')
    events = [e for e in quote_body['chart']['result'][0].get('events', {}).get('splits', {}).values()
              if oldest and oldest < dt.datetime.fromtimestamp(int(e['date']),dt.timezone.utc).date().isoformat() <= quote['asOf']]
    if not events:return
    if profile['id']!='servicenow':raise ValueError('A new issuer split requires declared share-basis qualification')
    source=accounts['quarters'][0]['sourceUrl']
    raw=get(source)
    if raw.startswith(b'%PDF'):
        with pdfplumber.open(io.BytesIO(raw))as pdf:text=' '.join(p.extract_text()or''for p in pdf.pages)
    else:text=BeautifulSoup(raw,'html.parser').get_text(' ',strip=True)
    text=' '.join(text.split())
    notice=re.search(r'(five|[0-9]+)[- ]for[- ](one|[0-9]+) stock split.{0,80}?effective ('+'|'.join(MONTHS)+r') (\d{1,2}), (20\d{2})',text,re.I)
    if not notice:raise ValueError('Missing issuer split declaration and effective date')
    if len(events)!=1:raise ValueError('Multiple splits require further issuer qualification')
    event=events[0];day=dt.datetime.fromtimestamp(int(event['date']),dt.timezone.utc).date()
    effective=dt.date(int(notice[5]),MONTHS[notice[3].lower()],int(notice[4]))
    num=5 if notice[1].lower()=='five'else float(notice[1])
    den=1 if notice[2].lower()=='one'else float(notice[2])
    declared_ratio=num/den
    ratio=float(event['numerator'])/float(event['denominator'])
    if ratio!=declared_ratio or not 0<=(day-effective).days<=1:raise ValueError('Issuer and quote split ratio/date disagree')
    proof={'asOf':day.isoformat(),'effectiveDate':effective.isoformat(),'ratio':ratio,'issuerSourceUrl':source,
           'sourceUrl':quote['sourceUrl'],'declaration':notice[0]}
    for quarter in accounts['quarters']:
        if quarter['end'] < day.isoformat():
            # A subsequently republished quarterly statement can already be
            # restated. Its actual issuer footnote is the only accepted proof.
            prior=get(quarter['sourceUrl'])
            if prior.startswith(b'%PDF'):
                with pdfplumber.open(io.BytesIO(prior))as pdf:prior_text=' '.join(p.extract_text()or''for p in pdf.pages)
            else:prior_text=BeautifulSoup(prior,'html.parser').get_text(' ',strip=True)
            adjusted=bool(re.search(r'retroactively adjusted.{0,120}five[- ]for[- ]one stock split',' '.join(prior_text.split()),re.I))
            if not adjusted:
                quarter['reportedDilutedEPS']=quarter['dilutedEPS']
                quarter['dilutedEPS']/=ratio
                quarter['epsSplitAdjustments']=[proof]
        quarter['epsShareBasisAsOf']=quote['asOf']
    accounts['trailing'].update(dilutedEPS=sum(p['dilutedEPS']for p in accounts['quarters']),
        shareBasisAsOf=quote['asOf'],splitAdjustments=[proof],
        definition='Somme de quatre BPA GAAP publiés, remis sur la même base par action après la division déclarée par l’émetteur')
