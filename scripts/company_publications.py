"""Issuer earnings releases: no API key, no browser impersonation.

Only consolidated GAAP statements are accepted. Missing or changed layouts fail
closed; neither highlights nor non-GAAP reconciliation tables become accounts.
"""
import calendar
import datetime as dt
import io
from functools import lru_cache
import re
import urllib.error
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup
import pdfplumber

UA = 'EpargnantLibre/1.0 https://github.com/madmax91310/shinny-potato'
MONTHS = {m.lower():i for i,m in enumerate(calendar.month_name) if m}
NUMBER = r'\(?-?\d[\d,]*(?:\.\d+)?\)?'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent':UA})
    with urllib.request.urlopen(req, timeout=20) as response:
        raw = response.read(10_000_001)
        if len(raw) > 10_000_000:
            raise ValueError('Publication too large')
        return raw


@lru_cache(maxsize=8)
def sections(raw):
    if raw.startswith(b'%PDF'):
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
        # Individual statements end at the next consolidated statement heading.
        return re.split(r'(?=\b(?:CONDENSED )?CONSOLIDATED (?:STATEMENTS|BALANCE))', text)
    soup = BeautifulSoup(raw, 'html.parser')
    tables = []
    for table in soup.find_all('table'):
        rows = []
        for tr in table.find_all('tr'):
            if tr.find_parent('table') is not table:
                continue
            cells = tr.find_all(['td','th'], recursive=False)
            rows.append(' '.join(' '.join(c.get_text(' ', strip=True).split()) for c in cells if not c.find('table')))
        # Microsoft places the statement caption in the preceding heading.
        tables.append('\n'.join(rows))
    return tables


def numbers(text):
    text = re.sub(r'(?<=\d)\s+(?=,)', '', text)
    text = text.replace('$','').replace('\u2212','-')
    text = re.sub(r'\s+\)', ')', text)
    values = []
    for token in re.findall(NUMBER, text):
        sign = -1 if token.startswith('(') or token.startswith('-') else 1
        values.append(sign * float(token.strip('()-').replace(',','')))
    return values


def row(text, labels, count=None, occurrence=0):
    for label in labels:
        matches = re.findall(r'^\s*' + label + r'\s+([^\n]+)$', text, re.I | re.M)
        if matches:
            values = numbers(matches[occurrence])
            if count is not None and len(values) != count:
                raise ValueError('Unexpected columns for ' + label)
            return values
    return None


def statement(raw, ident):
    choices = []
    for text in sections(raw):
        normalized = ' '.join(text.split()).lower()
        if not ((ident == 'microsoft' or 'in millions' in normalized) and ('three months ended' in normalized or 'quarter ended' in normalized)):
            continue
        if ident == 'microsoft':
            valid = 'total revenue' in normalized and 'weighted average shares outstanding' in normalized
        else:
            valid = ('statements of income' in normalized or 'statements of operations' in normalized)
        if valid:
            choices.append(text)
    if len(choices) != 1:
        raise ValueError('Missing or ambiguous consolidated income statement')
    text = choices[0]
    revenue = row(text,[r'Total net sales(?:\s*\(1\))?',r'Total revenue',r'Revenues',r'Revenue',r'Total net sales'])
    if not revenue or len(revenue) not in (2,4):
        raise ValueError('Missing revenue/column structure')
    count = len(revenue)
    net = row(text,[r'Net income'],count)
    operating = row(text,[r'Operating income',r'Income from operations'],count)
    eps = row(text,[r'Diluted net income per share',r'Diluted earnings per share',r'Diluted'],count)
    if not net or not operating or not eps or min(revenue) <= 0:
        raise ValueError('Incomplete consolidated statement')
    # Restrict dates/years to the header, before the first financial row.
    header = re.split(r'\n\s*(?:Revenue|Net sales|Total net sales|Total revenue)',text,flags=re.I)[0]
    years = [int(y) for y in re.findall(r'\b20\d{2}\b',header)]
    if len(years) != count or abs(years[0]-years[1]) != 1:
        raise ValueError('Unrecognised comparative-year columns')
    current = 0 if years[0] > years[1] else 1
    dates = re.findall(r'\b('+'|'.join(calendar.month_name[1:])+r')\s+(\d{1,2}),',header,re.I)
    if not dates:
        raise ValueError('Missing statement end date')
    month, day = dates[current if len(dates) >= 2 and ident in ('apple','nvidia') else 0]
    end = dt.date(years[current],MONTHS[month.lower()],int(day))
    prior_date = dates[1-current] if len(dates) >= 2 and ident in ('apple','nvidia') else (month,day)
    previous_end = dt.date(years[1-current],MONTHS[prior_date[0].lower()],int(prior_date[1]))
    def period(offset, duration):
        i = offset + current; j = offset + 1-current
        return {'start':None, 'end':end.isoformat(), 'previousStart':None,'previousEnd':previous_end.isoformat(),
                'revenue':revenue[i]*1e6, 'previousRevenue':revenue[j]*1e6,
                'netIncome':net[i]*1e6, 'previousNetIncome':net[j]*1e6,
                'operatingIncome':operating[i]*1e6,'previousOperatingIncome':operating[j]*1e6,
                'dilutedEPS':eps[i], 'previousDilutedEPS':eps[j], 'durationMonths':duration,
                'tags':{'revenue':'Consolidated GAAP revenue','netIncome':'Consolidated GAAP net income',
                        'dilutedEPS':'Consolidated GAAP diluted EPS','operatingIncome':'Consolidated GAAP operating income'}}
    quarter = period(0,3)
    annual = period(2,12) if count == 4 and re.search(r'(?:twelve months|year) ended',header,re.I) else None
    return {'quarter':quarter,'annual':annual}, text


def add_cash_flow(raw, annual, ident):
    if annual is None:
        return
    for text in sections(raw):
        if not re.search(r'(?:cash flows|net cash from operations)',text,re.I):
            continue
        if not re.search(r'(?:twelve months|year) ended',text,re.I):
            continue
        ocf = row(text,[r'Cash generated by operating activities',r'Net cash provided by operating activities',r'Net cash provided by \(used in\) operating activities',r'Net cash from operations'])
        capex = row(text,[r'Payments for acquisition of property, plant and equipment',r'Purchases of property and equipment',r'Additions to property and equipment',r'Purchases related to property and equipment and intangible assets'])
        if ocf and capex and len(ocf) == len(capex) and len(ocf) in (2,4):
            # Issuer order is verified by the income statement and fixed per adapter.
            i = -1 if ident in ('alphabet','amazon') else -2 if len(ocf)==4 else 0
            annual['freeCashFlow'] = (ocf[i] - abs(capex[i]))*1e6
            annual['tags']['freeCashFlow'] = 'GAAP operating cash flow less cash purchases of property and equipment'
            if ident == 'nvidia':
                annual['freeCashFlowDefinition'] = 'Flux d’exploitation moins acquisitions d’immobilisations et d’actifs incorporels'
            return


def balance(raw, ident, end):
    for text in sections(raw):
        if not re.search(r'balance sheets',text,re.I) and not (ident=='microsoft' and 'Current portion of long-term debt' in text):
            continue
        cash = row(text,[r'Cash and cash equivalents'],2)
        if not cash:
            continue
        i=1 if ident in ('alphabet','amazon') else 0
        result={'asOf':end,'cash':cash[i]*1e6}
        if ident=='apple':
            debts=[row(text,[r'Commercial paper'],2),row(text,[r'Term debt'],2,0),row(text,[r'Term debt'],2,1)]
        elif ident=='microsoft':
            debts=[row(text,[r'Current portion of long-term debt'],2),row(text,[r'Long-term debt'],2)]
        elif ident=='nvidia':
            debts=[row(text,[r'Short-term debt'],2),row(text,[r'Long-term debt'],2)]
        else:
            debts=[]  # Current debt is folded into other liabilities in these releases.
        if debts and all(d is not None for d in debts):
            result['debt']=sum(d[i] for d in debts)*1e6
            result['netDebt']=result['debt']-result['cash']
            result['definition']='Dette financière publiée, hors locations, moins trésorerie et équivalents ; placements exclus'
        return result
    return None


def shares(raw, ident, end):
    if ident not in ('apple','microsoft','amazon'):
        return None
    text = '\n'.join(sections(raw))
    if ident == 'apple':
        m = re.search(r'([\d,]+) and [\d,]+ shares issued and outstanding', text)
        val = float(m[1].replace(',', '')) * 1000 if m else None
    elif ident == 'microsoft':
        m = re.search(r'Common stock and paid-in capital.*?outstanding ([\d,]+) and', text)
        val = float(m[1].replace(',', '')) * 1e6 if m else None
    else:
        vals = row(text, [r'Common shares outstanding'])
        val = vals[-2] * 1e6 if vals and len(vals) == 7 else None
    return {'asOf':end, 'outstanding':val} if val and val > 0 else None


def candidates(ident, today):
    # Published report locations, bounded by completed fiscal-quarter end months.
    periods = []
    end_months = (1,4,7,10) if ident=='nvidia' else (3,6,9,12)
    for year in (today.year,today.year-1):
        for month in end_months:
            date = dt.date(year,month,calendar.monthrange(year,month)[1])
            if date <= today:
                periods.append((date,year,month))
    for _,year,month in sorted(periods,reverse=True)[:7]:
        if ident=='apple':
            q = {3:2,6:3,9:4,12:1}[month]
            pubyear = year+1 if month==12 else year
            pubmonths = {1:(1,2),2:(4,5),3:(7,8),4:(10,11)}[q]
            word = ['','first','second','third','fourth'][q]
            yield [f'https://www.apple.com/newsroom/{pubyear}/{m:02d}/apple-reports-{word}-quarter-results/' for m in pubmonths if dt.date(pubyear,m,1)<=today]
        elif ident=='alphabet':
            q = month//3
            yield [f'https://s206.q4cdn.com/479360582/files/doc_financials/{year}/q{q}/{year}q{q}-alphabet-earnings-release.pdf']
        elif ident=='microsoft':
            q = {3:3,6:4,9:1,12:2}[month]; fy=year+(month>=9)
            yield [f'https://www.microsoft.com/en-us/Investor/earnings/FY-{fy}-Q{q}/press-release-webcast']
        elif ident=='nvidia':
            q={1:4,4:1,7:2,10:3}[month];fy=year+(month!=1)
            word=['','First','Second','Third','Fourth'][q]
            slug=f'NVIDIA-Announces-Financial-Results-for-{word}-Quarter-'+(f'and-Fiscal-{fy}' if q==4 else f'Fiscal-{fy}')
            yield [f'https://nvidianews.nvidia.com/news/{slug.lower()}',f'https://investor.nvidia.com/news/press-release-details/{year}/{slug}/default.aspx']
        elif ident=='amazon':
            q=month//3;pubyear=year+(q==4);word=['','First','Second','Third','Fourth'][q]
            yield [f'https://ir.aboutamazon.com/news-release/news-release-details/{pubyear}/Amazon-com-Announces-{word}-Quarter-Results/default.aspx']


def collect(profile, today, old=None):
    reports=[];errors=[]
    for urls in candidates(profile['id'],today):
        for url in urls:
            try:
                raw=get(url)
                if profile['id']=='apple':
                    soup=BeautifulSoup(raw,'html.parser')
                    links=[a['href'] for a in soup.find_all('a',href=True) if re.search(r'Consolidated_Financial_Statements\.pdf$',a['href'],re.I)]
                    if len(links)!=1:raise ValueError('Missing official statements PDF')
                    url=urllib.parse.urljoin(url,links[0]);raw=get(url)
                parsed,_=statement(raw,profile['id'])
                if dt.date.fromisoformat(parsed['quarter']['end'])>today:raise ValueError('Future accounts')
                add_cash_flow(raw,parsed['annual'],profile['id'])
                parsed['balance']=balance(raw,profile['id'],parsed['quarter']['end'])
                parsed['shares']=shares(raw,profile['id'],parsed['quarter']['end'])
                for period in (parsed['annual'],parsed['quarter']):
                    if period:
                        period['sourceUrl']=url
                        # Retain exact SEC dates only when the whole period matches.
                        for existing in ((old or {}).get('annual'),(old or {}).get('quarter')):
                            if existing and existing['end']==period['end'] and existing.get('durationMonths',12 if existing is (old or {}).get('annual') else 3)==period['durationMonths']:
                                period['start']=existing.get('start');period['previousStart']=existing.get('previousStart')
                reports.append(parsed);break
            except Exception as exc:
                errors.append({'url':url,'error':type(exc).__name__})
        if len(reports)>=4 and any(r['annual'] for r in reports):break
    annuals=[r['annual'] for r in reports if r['annual']]
    if not annuals:raise ValueError('No annual issuer statement: '+str(errors))
    annual=max(annuals,key=lambda r:r['end'])
    quarters=sorted({r['quarter']['end']:r['quarter'] for r in reports}.values(),key=lambda r:r['end'],reverse=True)
    latest=quarters[0]
    if (today-dt.date.fromisoformat(annual['end'])).days>550 or (today-dt.date.fromisoformat(latest['end'])).days>200:
        raise ValueError('Stale issuer accounts')
    quarter=latest if latest['end']>annual['end'] else None
    result={'annual':annual,'quarter':quarter,'quarters':quarters[:4]}
    latest_report=max(reports,key=lambda r:r['quarter']['end'])
    if latest_report.get('balance'):
        result['balance']={**latest_report['balance'],'sourceUrl':latest['sourceUrl']}
    if latest_report.get('shares'):
        result['shares']={**latest_report['shares'],'sourceUrl':latest['sourceUrl']}
    # A trailing EPS is the sum of four *published* quarterly EPS, never FY +/- YTD EPS.
    if len(quarters)>=4 and all(75<=(dt.date.fromisoformat(a['end'])-dt.date.fromisoformat(b['end'])).days<=105 for a,b in zip(quarters[:3],quarters[1:4])):
        result['trailing']={'end':latest['end'],'dilutedEPS':sum(p['dilutedEPS'] for p in quarters[:4]),
                            'revenue':sum(p['revenue'] for p in quarters[:4]),
                            'sourceUrls':[p['sourceUrl'] for p in quarters[:4]],
                            'definition':'Somme de quatre trimestres GAAP publiés, sur la même base par action'}
    return result
