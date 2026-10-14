"""Renewable consolidated GAAP releases for Nike and Disney."""
import datetime as dt
import io
import json
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import pdfplumber
from company_publications import get
from company_round2_publications import statement_periods

SOURCES={'nike':'https://investors.nike.com/financial-information/financial-results',
         'disney':'https://investors.thewaltdisneycompany.com'}
ROUND4=set(SOURCES)
SYMBOLS={'nike':'NKE','disney':'DIS'}
IDENTITY={'nike':r'NIKE,?\s*Inc', 'disney':r'Walt Disney'}

def discover(ident):
    archive=SOURCES[ident]
    if ident=='nike':
        soup=BeautifulSoup(get(archive),'html.parser')
        rows=[(a['href'],' FY 'in a.get_text(' ',strip=True))for a in soup.select('a[href]')if a.get_text(' ',strip=True).startswith('Earnings Release ')]
        allowed={'investors.nike.com'}
    else:
        url=archive+'/feed/FinancialReport.svc/GetFinancialReportList?reportTypes=First%20Quarter%7CSecond%20Quarter%7CThird%20Quarter%7CFourth%20Quarter&year=-1&startIndex=0&length=100'
        reports=json.loads(get(url,max_bytes=20_000_000))['GetFinancialReportListResult'];rows=[]
        reports=reports[:16]
        for report in reports:
            documents=[d['DocumentPath']for d in report['Documents']if d['DocumentCategory']=='news' and d['DocumentPath'].endswith('.pdf')]
            if len(documents)>1:raise ValueError('Ambiguous Disney earnings release')
            if documents:rows.append((documents[0],report['ReportSubType']=='Fourth Quarter'))
        allowed={'s206.q4cdn.com'}
    urls=list(dict.fromkeys([u for u,_ in rows[:5]]+[u for u,annual in rows if annual][:3]))
    if len(urls)<4 or any(urlparse(u).scheme!='https' or urlparse(u).hostname not in allowed for u in urls):raise ValueError('Incomplete or unqualified official earnings archive')
    return urls

def parse(raw,ident,url,today):
    if ident=='nike':
        soup=BeautifulSoup(raw,'html.parser')
        if not re.search(IDENTITY[ident],soup.get_text(' ',strip=True),re.I):raise ValueError('Wrong Nike issuer')
        sections=[]
        for table in soup.find_all('table'):
            content=table.get_text(' ',strip=True)
            if not all(x in content for x in ['NET INCOME','Weighted average common','THREE MONTHS ENDED']):continue
            caption=table.find_previous(string=re.compile('CONSOLIDATED STATEMENTS OF INCOME',re.I))
            if not caption and not re.search(r'CONSOLIDATED (?:STATEMENTS OF INCOME|INCOME STATEMENTS)',soup.get_text(' ',strip=True),re.I):raise ValueError('Missing GAAP statement caption')
            rows=[]
            for row in table.find_all('tr'):
                cells=[c.get_text(' ',strip=True)for c in row.find_all(['td','th'],recursive=False)]
                drop={i for i,v in enumerate(cells)if '%'in v}
                for i in list(drop):
                    if cells[i]=='%' and i and re.fullmatch(r'\(?-?[\d,.]+\)?',cells[i-1]):drop.add(i-1)
                rows.append(' '.join(v for i,v in enumerate(cells)if i not in drop))
            content='CONSOLIDATED STATEMENTS OF INCOME\n'+'\n'.join(rows)
            content=re.sub(r'(\d{1,2})/(\d{1,2})/(20\d{2})',lambda m:dt.date(int(m[3]),int(m[1]),int(m[2])).strftime('%B %d, %Y'),content)
            sections.append(content)
    else:
        if not raw.startswith(b'%PDF'):raise ValueError('Disney financial PDF required')
        with pdfplumber.open(io.BytesIO(raw))as pdf:content='\n'.join(p.extract_text(x_tolerance=1)or''for p in pdf.pages[:40])
        if not re.search(IDENTITY[ident],content,re.I):raise ValueError('Wrong Disney issuer')
        starts=list(re.finditer(r'(?im)^CONDENSED CONSOLIDATED STATEMENTS OF (?:OPERATIONS|INCOME)\s*$',content));sections=[]
        for start in starts:
            section=content[start.start():];end=re.search(r'(?im)^CONDENSED CONSOLIDATED (?:BALANCE|STATEMENTS OF CASH)',section)
            if end:section=section[:end.start()]
            lines=[]
            for line in section.splitlines():
                if re.match(r'Net income(?: attributable)?',line,re.I):
                    if not line.startswith('Net income attributable to The Walt Disney Company'):continue
                    line=re.sub(r'^Net income attributable to The Walt Disney Company(?: \(Disney\))?', 'Net income',line)
                lines.append(line)
            section='\n'.join(lines)
            section=re.sub(r'Weighted average number of common and common\s+equivalent shares outstanding:', 'Weighted average shares outstanding:', section)
            sections.append(section)
    periods=[]
    for section in sections:
        periods.extend(statement_periods(section,ident,url,today))
    if not periods:raise ValueError('No qualified consolidated GAAP periods')
    if ident=='disney':
        for p in periods:p['incomeBasis']='part du groupe'
    return periods

def collect(profile,today,old=None):
    ident=profile['id']
    if ident not in ROUND4 or profile['symbol']!=SYMBOLS[ident] or profile['currency']!='USD':raise ValueError('Wrong company identity')
    def load(url):
        try:return parse(get(url,max_bytes=20_000_000),ident,url,today)
        except Exception as e:raise ValueError(str(e)+' / '+url)from e
    with ThreadPoolExecutor(max_workers=3)as pool:periods=[p for report in pool.map(load,discover(ident))for p in report]
    quarters=sorted({p['end']:p for p in periods if p['durationMonths']==3}.values(),key=lambda p:p['end'],reverse=True)[:4]
    annuals=sorted({p['end']:p for p in periods if p['durationMonths']==12}.values(),key=lambda p:p['end'],reverse=True)
    if len(quarters)!=4 or len(annuals)<2:raise ValueError('Four published quarters and two annual statements required')
    if any(not 75<=(dt.date.fromisoformat(a['end'])-dt.date.fromisoformat(b['end'])).days<=105 for a,b in zip(quarters,quarters[1:])):raise ValueError('Missing published quarter')
    if (today-dt.date.fromisoformat(quarters[0]['end'])).days>200:raise ValueError('Stale quarterly accounts')
    history={}
    for a in reversed(annuals):
        for prev in [True,False]:
            end=a['previousEnd']if prev else a['end'];revenue=a['previousRevenue']if prev else a['revenue'];income=a['previousNetIncome']if prev else a['netIncome']
            history[end]={'start':None,'end':end,'revenue':revenue,'netIncome':income,'margin':income/revenue*100,'sourceUrl':a['sourceUrl']}
    return {'annual':annuals[0],'quarter':quarters[0]if quarters[0]['end']>annuals[0]['end']else None,'quarters':quarters,
            'trailing':{'end':quarters[0]['end'],'revenue':sum(p['revenue']for p in quarters),'sourceUrls':[p['sourceUrl']for p in quarters],'dilutedEPS':sum(p['dilutedEPS']for p in quarters),'periods':[p['end']for p in quarters],'observedAt':today.isoformat(),'definition':'Somme de quatre BPA dilués GAAP trimestriels publiés'},
            'historyYears':[history[k]for k in sorted(history)[-5:]],'historyObservedAt':today.isoformat()}

def disney_cash(raw, annual):
    """Only the dated annual consolidated cash table, never the DTC summary."""
    from company_publications import row, MONTHS
    from company_round3_publications import text
    content=text(raw)
    candidates=[]
    for heading in re.finditer(r'(?im)^CONDENSED CONSOLIDATED STATEMENTS OF CASH FLOWS\s*$', content):
        block=content[heading.end():]
        header=block.split('OPERATING ACTIVITIES',1)[0]
        if not re.search(r'Year Ended',header,re.I) or not re.search(r'in millions',header,re.I):continue
        years=re.findall(r'\b20\d{2}\b',header)
        dates=re.findall(r'('+'|'.join(MONTHS)+r')\s+(\d{1,2}),',header,re.I)
        if len(years)!=2 or len(dates)!=2:continue
        ends=[dt.date(int(y),MONTHS[m.lower()],int(d)).isoformat()for (m,d),y in zip(dates,years)]
        if ends!=[annual['end'],annual['previousEnd']]:continue
        block=block.split('Cash, cash equivalents and restricted cash, end',1)[0]
        # A printed dash in an amount cell is a reported zero, not a missing row.
        block=re.sub(r'(?<!\S)[—–](?!\S)', '0', block)
        labels={
            'operatingCashFlow':[r'Cash provided by operations'],
            'capitalExpenditure':[r'Investments in parks, resorts and other property'],
            'dividendsPaid':[r'Dividends'],
            'shareRepurchases':[r'Repurchases of common stock'],
            'shareBasedCompensation':[r'Equity-based compensation'],
        }
        values={k:row(block,v,2)for k,v in labels.items()}
        if not values['operatingCashFlow'] or not values['capitalExpenditure']:continue
        candidates.append(values)
    if len(candidates)!=1:raise ValueError('No unique dated Disney annual cash table')
    for i,prefix in [(0,''),(1,'previous')]:
        for k,values in candidates[0].items():
            if values is not None:
                annual[prefix+k[0].upper()+k[1:]if prefix else k]=(values[i]if k=='operatingCashFlow'else abs(values[i]))*1e6
        key=lambda k:prefix+k[0].upper()+k[1:]if prefix else k
        annual[key('freeCashFlow')]=annual[key('operatingCashFlow')]-annual[key('capitalExpenditure')]
    return annual


def publication_decision(profile,company,today):
    from company_decision import DECISION_VERSION, FCF_METHOD
    ident=profile['id'];documents={};rows=[]
    for ref in company.get('history',{}).get('years',[]) or [company['annual']]:
        url=ref['sourceUrl']
        if url not in documents:
            raw=get(url,max_bytes=20_000_000)
            annuals=[p for p in parse(raw,ident,url,today)if p['durationMonths']==12]
            if len(annuals)!=1:raise ValueError('Ambiguous annual statement')
            a=annuals[0]
            if ident=='disney':disney_cash(raw,a)
            documents[url]=a
        a=documents[url];prefix='previous'if ref['end']==a['previousEnd']else''
        key=lambda k:prefix+k[0].upper()+k[1:]if prefix else k
        if ref['end']not in(a['end'],a['previousEnd'])or any(a[key(k)]!=ref[k]for k in ['revenue','netIncome']):raise ValueError('Decision/income period mismatch')
        r={k:ref[k]for k in ['end','revenue','netIncome']}
        r.update(sourceUrl=url,sourceUnits='USD millions',incomeBasis='part du groupe'if ident=='disney'else'consolidated')
        for k in ['averageDilutedShares','operatingIncome','interestExpense','operatingCashFlow','capitalExpenditure','freeCashFlow','dividendsPaid','shareRepurchases','shareBasedCompensation']:
            if key(k)in a:r[k]=a[key(k)]
        if 'averageDilutedShares'in r:r['sharesBasisSource']=url
        if 'freeCashFlow'in r:r['freeCashFlowDefinition']=FCF_METHOD
        rows.append(r)
    return {'componentVersion':DECISION_VERSION,'currency':'USD','observedAt':today.isoformat(),
            'sourceUrls':sorted({r['sourceUrl']for r in rows}),'years':rows,'annualEnd':company['annual']['end'],'method':FCF_METHOD}
