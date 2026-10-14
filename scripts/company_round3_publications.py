"""Renewable issuer financial feeds; strict consolidated statement layouts."""
import datetime as dt
import io
import json
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import pdfplumber
from company_publications import get as raw_get, row, MONTHS
import time
import urllib.error

def get(url, max_bytes=10_000_000):
    for attempt in range(3):
        try:return raw_get(url,max_bytes=max_bytes)
        except urllib.error.HTTPError as error:
            if error.code not in (429,500,502,503,504) or attempt==2:raise
        except (TimeoutError,urllib.error.URLError):
            if attempt==2:raise
        time.sleep(attempt+1)

from company_round2_publications import statement_periods

SOURCES = {
 'walmart': ('https://stock.walmart.com/financials/quarterly-results/default.aspx', 'WMT'),
 'netflix': ('https://ir.netflix.net', 'NFLX'),
 'booking': ('https://ir.bookingholdings.com', 'BKNG'),
 'deere': ('https://investor.deere.com', 'DE'),
 'caterpillar': ('https://investors.caterpillar.com', 'CAT'),
 'waste-management': ('https://investors.wm.com/financials/financial-results/', 'WM'),
}
ROUND3 = set(SOURCES)
IDENTITY = {'walmart':r'Walmart', 'netflix':r'Netflix', 'booking':r'Booking Holdings', 'deere':r'Deere & Company', 'caterpillar':r'Caterpillar', 'waste-management':r'Waste Management'}

def discover(ident):
    archive,_=SOURCES[ident]
    if ident == 'walmart':
        soup=BeautifulSoup(get(archive,max_bytes=20_000_000),'html.parser')
        urls=[a['href'] for a in soup.select('a[href]') if a.get_text(' ',strip=True)=='Earnings Release PDF']
        selected=urls[:4]+[u for u in urls if re.search(r'Q4|q4',u)][:2]
    elif ident == 'waste-management':
        # Explicitly qualify this archive as well; never fall back to a local snapshot.
        soup=BeautifulSoup(get(archive),'html.parser')
        selected=[urljoin(archive,a['href'])for a in soup.select('a[href]')if a.get_text(' ',strip=True)=='News Release'][:14]
    else:
        endpoint=archive+'/feed/FinancialReport.svc/GetFinancialReportList?reportTypes=First%20Quarter%7CSecond%20Quarter%7CThird%20Quarter%7CFourth%20Quarter&year=-1&startIndex=0&length=100'
        reports=json.loads(get(endpoint))['GetFinancialReportListResult']; urls=[]; annual=[]
        for report in reports:
            docs=[d['DocumentPath'] for d in report['Documents'] if d['DocumentCategory']==('letter' if ident=='netflix' else 'mdna' if ident=='caterpillar' else 'news') and (d['DocumentPath'].lower().endswith('.pdf') or ident=='caterpillar')]
            if len(docs)>1:raise ValueError('Ambiguous financial release')
            if docs:
                urls.append(docs[0])
                if report['ReportSubType']=='Fourth Quarter':annual.append(docs[0])
        selected=urls[:4]+annual[:2]
        if ident=='caterpillar':
            # The issuer's earnings PDFs use the quarter/year already discovered
            # in its official Q4 feed. Avoid dynamic HTML pages timing out on CI.
            # A renamed or missing document fails closed, including identity/date.
            codes=[]
            for u in selected:
                m=re.search(r'/([1-4]q\d{2})-results-caterpillar-inc\.html$',u)
                if not m:raise ValueError('Caterpillar release path changed')
                code=m[1]
                codes.append(f'https://www.caterpillar.com/content/dam/caterpillarDotCom/releases/{code}/{code}-caterpillar-inc-financial-results.pdf')
            selected=codes
    selected=list(dict.fromkeys(selected))
    allowed={urlparse(archive).hostname,'s22.q4cdn.com','s25.q4cdn.com'}
    if ident=='caterpillar':allowed.add('www.caterpillar.com')
    if len(selected)<4 or any(urlparse(u).scheme!='https' or urlparse(u).hostname not in allowed for u in selected):raise ValueError('Incomplete or unqualified official archive')
    return selected

def text(raw, dedupe=False):
    if not raw.startswith(b'%PDF'):raise ValueError('A consolidated statement PDF is required')
    with pdfplumber.open(io.BytesIO(raw)) as pdf:
        return '\n'.join((p.dedupe_chars(tolerance=1) if dedupe else p).extract_text(x_tolerance=1)or'' for p in pdf.pages[:40])

def parse(raw, ident, url, today):
    content=text(raw, dedupe=ident=='booking')
    for word in ['Three','Six','Nine','Twelve']:
        pattern=r'\s*'.join(word)+r'\s+M\s*o\s*n\s*t\s*h\s*s\s+E\s*n\s*d\s*e\s*d'
        content=re.sub(pattern,word+' Months Ended',content,flags=re.I)
    content=re.sub(r'Y\s*e\s*a\s*r\s+E\s*n\s*d\s*e\s*d','Year Ended',content,flags=re.I)
    if ident=='booking':
        # Older PDFs overlap page captions; numerical rows remain untouched.
        content=re.sub(r'(?im)^Unaudited Consolidated Statements of\n(?:Flows\n)?Operations', 'Consolidated Statements of Operations',content)
        content=content.replace('((IInn mmiilllliioonnss), except share and per share data)', '(In millions, except share and per share data)')
    content=re.sub(r'(?im)^Unaudited Consolidated Statements of\s+Operations', 'Consolidated Statements of Operations',content)
    if not re.search(IDENTITY[ident],content,re.I):raise ValueError('Wrong issuer identity')
    heading=(r'(?im)^STATEMENTS OF CONSOLIDATED INCOME\s*$' if ident=='deere' else r'(?im)^(?:Condensed )?Consolidated Statements of (?:Income|Operations)\s*$')
    content=re.sub(r'(?im)^Condensed Consolidated Statement of Results of Operations$', 'Consolidated Statements of Operations',content)
    matches=list(re.finditer(heading,content));result=[]
    for m in matches:
        section=content[m.start():]
        end=re.search(r'(?im)^(?:CONDENSED )?CONSOLIDATED (?:BALANCE|STATEMENTS OF CASH)',section)
        if end:section=section[:end.start()]
        if ident=='walmart':
            section=re.sub(r'\(?-?[\d,.]+\)?\s*%', '', section)
            section=re.sub(r'(?im)^Consolidated net income attributable to Walmart\b','Net income',section)
            section=re.sub(r'(?im)^Diluted net income per common share attributable to Walmart\b','Diluted',section)
            # Percent-change columns are not financial observations; old annual PDFs may use two columns only.
            if 'Percent Percent' in section and len(row(section,[r'Total revenues'])or[])==2:raise ValueError('Walmart annual/Q4 column layout changed')
            result.extend(statement_periods(section,'mastercard',url,today))
        elif ident=='netflix':
            if '(in thousands, except per share data)' not in section:raise ValueError('Netflix statement units changed')
            section=section.replace('(in thousands, except per share data)','(in millions, except per share data)')
            parsed=statement_periods(section,'broadcom',url,today)
            for p in parsed:
                for k in ('revenue','netIncome','operatingIncome','interestExpense','previousRevenue','previousNetIncome','previousOperatingIncome','previousInterestExpense','averageDilutedShares','previousAverageDilutedShares'):
                    if k in p:p[k]/=1000
                if re.search(r'retroactively adjusted to reflect the ten-for-one forward stock split',section,re.I):p['epsRestatedForSplit']=True
            result.extend(parsed)
        elif ident=='booking':
            # PDF rows wrap the EPS label immediately before its numerical row.
            section=re.sub(r'Net income applicable to common stockholders per diluted\s*common share','Diluted',section,flags=re.I)
            parsed=statement_periods(section,'mastercard',url,today)
            for p in parsed:
                for k in ('averageDilutedShares','previousAverageDilutedShares'):
                    p.pop(k,None)
            result.extend(parsed)
        elif ident=='deere':
            section=section.replace('STATEMENTS OF CONSOLIDATED INCOME','CONSOLIDATED STATEMENTS OF INCOME')
            section=re.sub(r'(?im)^Net Income Attributable to Deere & Company\b','Net income',section)
            section=re.sub(r'(?im)^Net Sales and Revenues\s*$','',section)
            section=re.sub(r'(?im)^Total(?=\s+[\d,])','Revenues',section,count=1)
            header,rest=section.split('Net sales ',1)
            full=re.findall(r'('+ '|'.join(MONTHS)+r')\s+(\d{1,2}),\s*(20\d{2})',header,re.I)
            if len(full)!=2:raise ValueError('Deere comparative dates changed')
            # Preserve weekly fiscal dates rather than treating them as calendar quarters.
            dates=[' '.join([a,b+',',c])for a,b,c in full]
            header=re.sub(r'For the Three Months.*\n','',header)
            header=re.sub(r'Three Months Ended Years Ended\s*20\d{2} 20\d{2} 20\d{2} 20\d{2}', 'Three Months Ended '+dates[0]+' '+dates[1]+' Years Ended '+dates[0]+' '+dates[1],header)
            if 'Three Months Ended' not in header:
                years=re.findall(r'\b20\d{2}\b',header)
                if len(row(rest,[r'Total'])or[]) not in (2,4):raise ValueError('Deere column layout changed')
                count=len(row(rest,[r'Total']));header='CONSOLIDATED STATEMENTS OF INCOME\n(in millions)\nThree Months Ended '+dates[0]+' '+dates[1]+(' Six Months Ended '+dates[0]+' '+dates[1]if count==4 else '')+'\n'
            result.extend(statement_periods(header+'Net sales '+rest,'mastercard',url,today))
        elif ident=='caterpillar':
            section=section.replace('(Dollars in millions except per share data)','(in millions, except per share data)')
            section=re.sub(r'(?im)^Revenues of Financial Products','Financial product revenues',section)
            section=re.sub(r'(?im)^Total sales and revenues','Revenues',section)
            section=re.sub(r'(?im)^Profit(?: \d+)?(?=\s+[\d$])','Net income',section)
            section=re.sub(r'(?im)^Profit per common share [—–-] diluted(?: \d+)?','Diluted',section)
            result.extend(statement_periods(section,'mastercard',url,today))
        elif ident=='waste-management':
            section=re.sub(r'(?im)^Operating revenues','Revenues',section)
            section=re.sub(r'(?im)^Net income attributable to Waste Management, Inc\.','Net income',section)
            section=re.sub(r'(?im)^Diluted earnings per common share','Diluted',section)
            result.extend(statement_periods(section,'mastercard',url,today))
        else:raise ValueError('Consolidated statement format not qualified')
    if not result:raise ValueError('No qualified consolidated income statement')
    return result

def collect(profile,today,old=None):
    ident=profile['id']
    if profile['currency']!='USD' or profile['symbol']!=SOURCES[ident][1]:raise ValueError('Unsupported share identity')
    urls=discover(ident)
    def load(url):
        try:return parse(get(url,max_bytes=20_000_000),ident,url,today)
        except Exception as error:raise ValueError(str(error)+' / '+url)from error
    with ThreadPoolExecutor(max_workers=2)as pool:reports=list(pool.map(load,urls))
    periods=[p for rows in reports for p in rows]
    quarters=sorted({p['end']:p for p in reversed(periods) if p['durationMonths']==3}.values(),key=lambda p:p['end'],reverse=True)[:4]
    annuals=sorted({p['end']:p for p in periods if p['durationMonths']==12}.values(),key=lambda p:p['end'],reverse=True)
    if len(quarters)!=4 or len(annuals)<2:raise ValueError('Four published quarters and annual history required')
    if any(not 75 <= (dt.date.fromisoformat(a['end'])-dt.date.fromisoformat(b['end'])).days<=105 for a,b in zip(quarters,quarters[1:])):raise ValueError('Missing actual quarterly statement')
    if (today-dt.date.fromisoformat(quarters[0]['end'])).days>200:raise ValueError('Stale quarterly statement')
    history={}
    for a in reversed(annuals):
        for prev in (True,False):
            end=a['previousEnd']if prev else a['end'];revenue=a['previousRevenue']if prev else a['revenue'];net=a['previousNetIncome']if prev else a['netIncome']
            history[end]={'start':None,'end':end,'revenue':revenue,'netIncome':net,'margin':net/revenue*100,'sourceUrl':a['sourceUrl']}
    return {'annual':annuals[0],'quarter':quarters[0]if quarters[0]['end']>annuals[0]['end']else None,'quarters':quarters,'historyYears':sorted(history.values(),key=lambda p:p['end'])[-5:],'historyObservedAt':today.isoformat(),'trailing':{'end':quarters[0]['end'],'dilutedEPS':sum(p['dilutedEPS']for p in quarters),'revenue':sum(p['revenue']for p in quarters),'sourceUrls':[p['sourceUrl']for p in quarters],'definition':'Somme de quatre trimestres GAAP réellement publiés'}}


def normalise_eps_basis(accounts, profile, quote, quote_body):
    """Certify event ratio/date with issuer notice; retain every reported EPS."""
    oldest=accounts['quarters'][-1]['end']
    events=[e for e in quote_body['chart']['result'][0].get('events',{}).get('splits',{}).values() if oldest < dt.datetime.fromtimestamp(int(e['date']),dt.timezone.utc).date().isoformat()<=quote['asOf']]
    if not events:return
    if len(events)!=1 or profile['id'] not in ('netflix','booking'):raise ValueError('New split requires issuer share-basis qualification')
    source=accounts['quarters'][0]['sourceUrl'];content=' '.join(text(get(source,max_bytes=20_000_000)).split())
    if profile['id']=='netflix':
        m=re.search(r'ten-for-one forward stock split which was effected on ('+'|'.join(MONTHS)+r') (\d{1,2}), (20\d{2})',content,re.I);ratio=10
    else:
        m=re.search(r'On ('+'|'.join(MONTHS)+r') (\d{1,2}), (20\d{2}), the Company effected the 25-for-1 stock split',content,re.I);ratio=25
    if not m:raise ValueError('Missing issuer split ratio/date declaration')
    effective=dt.date(int(m[3]),MONTHS[m[1].lower()],int(m[2]));event=events[0];day=dt.datetime.fromtimestamp(int(event['date']),dt.timezone.utc).date()
    # First trading date after the declared Friday effect can be the following Monday.
    sessions={dt.datetime.fromtimestamp(int(t),dt.timezone.utc).date() for t in quote_body['chart']['result'][0].get('timestamp',[])}
    following=min((d for d in sessions if d>effective),default=None)
    if float(event['numerator'])/float(event['denominator'])!=ratio or day not in (effective,following):raise ValueError('Issuer and market split disagree')
    proof={'asOf':day.isoformat(),'effectiveDate':effective.isoformat(),'ratio':ratio,'issuerSourceUrl':source,'sourceUrl':quote['sourceUrl'],'declaration':m[0]}
    for q in accounts['quarters']:
        raw=' '.join(text(get(q['sourceUrl'],max_bytes=20_000_000)).split())
        restated=bool(re.search(r'(?:All share and per share information has been|Share and per share amounts have been) retroactively adjusted',raw,re.I)) and m[0].lower() in raw.lower()
        if q['end']<day.isoformat() and not restated:
            q['reportedDilutedEPS']=q['dilutedEPS'];q['dilutedEPS']/=ratio;q['epsSplitAdjustments']=[proof]
        q['epsShareBasisAsOf']=quote['asOf']
    accounts['trailing'].update(dilutedEPS=sum(q['dilutedEPS']for q in accounts['quarters']),shareBasisAsOf=quote['asOf'],splitAdjustments=[proof],definition='Somme de quatre BPA GAAP publiés, sur une base par action commune après division déclarée par l’émetteur')


def publication_decision(profile, company, today):
    """Annual components from the same consolidated income/cash-flow documents."""
    from company_decision import FCF_METHOD
    ident=profile['id'];documents={};years=[]
    labels={
      'walmart':[r'Payments for property and equipment'],
      'netflix':[r'Purchases of property and equipment'],
      'booking':[r'Additions to property and equipment'],
      'caterpillar':[r'Capital expenditures - excluding equipment leased to others'],
      'deere':[r'Purchases of property and equipment'],
      'waste-management':[r'Capital expenditures'],
    }[ident]
    for ref in company.get('history',{}).get('years',[]) or [company['annual']]:
        url=ref['sourceUrl']
        if url not in documents:
            raw=get(url,max_bytes=20_000_000);annuals=[p for p in parse(raw,ident,url,today)if p['durationMonths']==12]
            if len(annuals)!=1:raise ValueError('Ambiguous annual income statement')
            a=annuals[0];content=text(raw,dedupe=ident=='booking')
            content=re.sub(r'Y\s*e\s*a\s*r\s+E\s*n\s*d\s*e\s*d','Year Ended',content,flags=re.I)
            content=re.sub(r'(?im)^Unaudited Consolidated Statements of Cash\s*Flows','Consolidated Statements of Cash Flows',content)
            cash=[]
            for m in re.finditer(r'(?im)^(?:Condensed )?Consolidated Statements? of Cash Flows?\s*$',content):
                block=content[m.start():];header=re.split(r'(?im)^\s*(?:Cash flows from operating|OPERATING ACTIVITIES|Net income|Consolidated net income)',block,1)[0]
                if not re.search(r'(?:Year|Years|Twelve Months) Ended',header,re.I):continue
                unit=1000 if re.search(r'in thousands',header,re.I)else 1e6 if re.search(r'in millions',header,re.I)else None
                if unit is None:continue
                expected=[int(a['end'][:4]),int(a['previousEnd'][:4])];columns=[int(y)for y in re.findall(r'\b20\d{2}\b',header)]
                selected=[0,1]if columns==expected else[3,4]if ident=='netflix' and len(columns)==5 and columns[-2:]==expected else None
                if selected is None:continue
                ocf=row(block,[r'Net cash provided by operating activities',r'Net cash provided by \(used in\) operating activities',r'Net cash provided by \(used for\) operating activities'])
                capex=row(block,labels)
                if not ocf or not capex or len(ocf)!=len(columns) or len(capex)!=len(columns):continue
                cash.append((unit,[ocf[i]for i in selected],[capex[i]for i in selected]))
            if len(cash)>1:raise ValueError('Conflicting consolidated annual cash tables')
            if cash:
                unit,ocf,capex=cash[0]
                for i,prefix in [(0,''),(1,'previous')]:
                    for k,v in [('operatingCashFlow',ocf[i]*unit),('capitalExpenditure',abs(capex[i])*unit),('freeCashFlow',(ocf[i]-abs(capex[i]))*unit)]:a[prefix+k[0].upper()+k[1:]if prefix else k]=v
            documents[url]=a
        a=documents[url];previous=ref['end']==a['previousEnd'];prefix='previous'if previous else''
        def key(k):return prefix+k[0].upper()+k[1:]if prefix else k
        if ref['end']not in(a['end'],a['previousEnd'])or any(a[key(k)]!=ref[k]for k in ['revenue','netIncome']):raise ValueError('Decision/income period mismatch')
        result={k:ref[k]for k in ['end','revenue','netIncome']};result.update(sourceUrl=url,tags={})
        for k in ['operatingIncome','interestExpense','operatingCashFlow','capitalExpenditure','freeCashFlow','averageDilutedShares']:
            if key(k)in a:result[k]=a[key(k)]
        if 'averageDilutedShares' in result:result['sharesBasisSource']=url
        if 'freeCashFlow'in result:result['freeCashFlowDefinition']=FCF_METHOD
        years.append(result)
    if not years or years[-1]['end']!=company['annual']['end']:raise ValueError('Annual decision history mismatch')
    return {'observedAt':today.isoformat(),'annualEnd':company['annual']['end'],'years':years,'method':FCF_METHOD}
