"""Official statement adapters for European issuers, Visa and Costco.

Amounts remain in their reporting currency. European half-years never become
quarters; owner-attributable profit and adjusted profit are never interchanged.
"""
import calendar
import datetime as dt
import io
import re
import urllib.parse
from functools import lru_cache
from bs4 import BeautifulSoup
import pdfplumber
from company_publications import get, numbers, sections

EUROPE = {'lvmh', 'air-liquide', 'schneider', 'totalenergies'}
EXTENDED = EUROPE | {'visa', 'costco'}


@lru_cache(maxsize=16)
def load(url):
    return get(url, max_bytes=30_000_000)


@lru_cache(maxsize=12)
def pdf_text(raw):
    if not raw.startswith(b'%PDF'):
        raise ValueError('Expected official financial PDF')
    with pdfplumber.open(io.BytesIO(raw)) as pdf:
        # Dedicated financial documents, never whole registration documents.
        return '\n'.join(p.extract_text(x_tolerance=1) or '' for p in pdf.pages[:45])


def links(url):
    raw = load(url)
    soup = BeautifulSoup(raw, 'html.parser')
    result = {urllib.parse.urljoin(url, a['href']) for a in soup.find_all('a', href=True)}
    # Schneider's public page also embeds its archive document URLs in JSON.
    for value in re.findall(r'(?:https?://|/ww/en/assets/)[^"<>\\\s]+\.pdf', raw.decode('utf-8')):
        result.add(urllib.parse.urljoin(url, value))
    return sorted(result)


def value(text, label, count, notes=False, optional=False):
    matches = re.findall(r'^\s*' + label + r'\s+([^\n]+)$', text, re.I | re.M)
    matches = [m for m in matches if re.match(r'^\s*\$?\s*\(?-?\d', m)]
    if len(matches) != 1:
        if optional and not matches:
            return None
        raise ValueError('Missing or ambiguous statement row: ' + label)
    vals = numbers(matches[0])
    if notes and len(vals)-count in (1,2) and all(0 < abs(v) < 100 and int(v) == v for v in vals[:-count]):
        vals = vals[-count:]
    if len(vals) != count:
        raise ValueError('Changed statement columns: ' + label)
    return vals


def period(end, previous_end, revenue, income, eps=None, previous_revenue=None, previous_income=None, duration=12):
    result = {'start':None, 'end':end, 'previousEnd':previous_end,
              'revenue':revenue*1e6, 'netIncome':income*1e6, 'durationMonths':duration,
              'margin':income/revenue*100,
              'previousRevenue':previous_revenue*1e6 if previous_revenue is not None else None,
              'previousNetIncome':previous_income*1e6 if previous_income is not None else None}
    if revenue <= 0:
        raise ValueError('Nonpositive consolidated revenue')
    if eps is not None:
        result['dilutedEPS'] = eps
    return result


def parse_europe(text, ident, year, half=False):
    identity = {'lvmh':'LVMH','air-liquide':'Air Liquide','schneider':'Schneider','totalenergies':'TotalEnergies'}[ident]
    if identity.lower() not in text.lower():
        raise ValueError('Wrong issuer financial document')
    headings = list(re.finditer(r'^\s*(?:\d+\.\s*)?(?:Consolidated income statement|Consolidated statement of income)\s*$', text, re.I | re.M))
    headings = [m for i,m in enumerate(headings) if not (i+1 < len(headings) and headings[i+1].start()-m.end() < 80 and headings[i+1].group().strip().lower() == m.group().strip().lower())]
    if ident == 'lvmh':
        headings = [m for m in headings if m.group().strip() == 'CONSOLIDATED INCOME STATEMENT']
    if ident == 'totalenergies':
        # Separate quarter and full-year statements. Select only the full-year block.
        annuals = []
        for match in headings:
            block = text[match.end():]
            block = re.split(r'\n\s*Consolidated statement of comprehensive income\s*\n', block, flags=re.I)[0]
            if re.search(r'\b(?:year|years)\b', block[:350], re.I):
                annuals.append(block)
        if len(annuals) != 1:
            raise ValueError('Missing or ambiguous TotalEnergies annual statement')
        block = annuals[0]
        if '(M$)' not in block[:400]:
            raise ValueError('Wrong TotalEnergies reporting currency')
        header = re.split(r'\nSales\s', block, flags=re.I)[0]
        years = [int(y) for y in re.findall(r'\b20\d{2}\b', header)]
        revenue_label = r'Revenues? from sales'
        income_label = r'TotalEnergies share'
        eps_label = r'(?:Fully-diluted|Diluted) earnings per share \(\$\)'
    else:
        if len(headings) != 1:
            raise ValueError('Missing or ambiguous consolidated income statement')
        block = text[headings[0].end():]
        block = re.split(r'\n\s*(?:\d+\.\s*)?(?:Consolidated statement of comprehensive|Consolidated balance sheet|Other comprehensive income|Statement of net income)', block, flags=re.I)[0]
        header = re.split(r'\nRevenue\s', block, flags=re.I)[0]
        if not re.search(r'(?:EUR millions|millions of euros)', header, re.I):
            raise ValueError('Wrong euro statement unit')
        years = [int(y) for y in re.findall(r'\b20\d{2}\b', header)]
        if half and ident != 'lvmh' and not re.search(r'(?:half|six.month|\bH1\b)', header, re.I):
            raise ValueError('Not an explicit half-year statement')
        if not half and re.search(r'half', header, re.I):
            raise ValueError('Half-year cannot become annual accounts')
        revenue_label = r'Revenue'
        income_label = {'lvmh':r'Net profit, Group share', 'air-liquide':r'[-■]?\s*Net profit \(Group share\)',
                        'schneider':r'attributable to owners of the parent'}[ident]
        eps_label = {'lvmh':r'Diluted Group share of net earnings per share \(EUR\)',
                     'air-liquide':r'Diluted earnings per share \(in euros\)',
                     'schneider':r'Diluted earnings \(attributable to owners of the parent\) per share \(in euros per share\)'}[ident]
    selected_columns = None
    if ident == 'lvmh' and half:
        dates = re.findall(r'(June|Dec\.)\s+(\d{1,2}),\s*(20\d{2})', header)
        if len(dates) != 3 or any(day not in ('30','31') for _,day,_ in dates):
            raise ValueError('Changed LVMH half-year date columns')
        selected_columns = [i for i,(month,day,y) in enumerate(dates) if month=='June' and day=='30']
        if len(selected_columns) != 2 or {int(dates[i][2]) for i in selected_columns} != {year,year-1}:
            raise ValueError('Mismatched LVMH half-year comparatives')
    if len(years) not in (2,3) or (selected_columns is None and len(set(years)) != len(years)) or max(years) != year:
        raise ValueError('Unrecognised statement years')
    count = len(years)
    revenue = value(block, revenue_label, count, notes=True)
    income = value(block, income_label, count, notes=True)
    eps = value(block, eps_label, count, notes=True, optional=ident=='air-liquide')
    operating = value(block, r'Operating (?:income|profit)', count, notes=True, optional=True)
    if selected_columns is not None:
        operating = [operating[i] for i in selected_columns] if operating else None
        years = [years[i] for i in selected_columns]
        revenue = [revenue[i] for i in selected_columns]
        income = [income[i] for i in selected_columns]
        eps = [eps[i] for i in selected_columns] if eps else None
    results = []
    for i, y in enumerate(years):
        previous = years.index(y-1) if y-1 in years else None
        end = f'{y}-06-30' if half else f'{y}-12-31'
        result = period(end, f'{y-1}-06-30' if half else f'{y-1}-12-31', revenue[i], income[i],
                        eps[i] if eps else None, revenue[previous] if previous is not None else None,
                        income[previous] if previous is not None else None, 6 if half else 12)
        if operating is not None:result['operatingIncome'] = operating[i]*1e6
        result['incomeBasis'] = 'Résultat net part du groupe (IFRS)'
        results.append(result)
    return sorted(results, key=lambda r:r['end'])


def europe_documents(ident, today):
    half_year = today.year if today.month >= 7 else today.year-1
    if ident == 'schneider':
        available = links('https://www.se.com/ww/en/about-us/investor-relations/financial-results/')
        for url in available:
            match = re.search(r'accounts-(fy|hy)-results-(20\d{2})\.pdf', url)
            if match:
                year = int(match[2]); half = match[1]=='hy'
                if year <= today.year and year >= today.year-6 and not half:
                    yield year, half, url.replace('https://se.com/', 'https://www.se.com/')
        # Current half-year has a maintained official short URL too.
        yield half_year, True, f'https://www.se.com/ww/en/assets/pdf/accounts-hy-results-{half_year}'
    elif ident == 'totalenergies':
        soup = BeautifulSoup(load('https://totalenergies.com/investors/results'), 'html.parser')
        for tr in soup.find_all('tr'):
            label = tr.get_text(' ',strip=True)
            match = re.search(r'(?:4Q|Full year).*?(\d{2})',label)
            if not match:
                # Some archive rows title the full year without a 4Q prefix.
                continue
            year = 2000+int(match[1])
            for a in tr.find_all('a',href=True):
                if a.get_text(' ',strip=True)=='Accounts' and year >= today.year-6:
                    yield year, False, urllib.parse.urljoin('https://totalenergies.com',a['href'])
    else:
        for year in range(today.year, today.year-6, -1):
            if ident=='lvmh':
                if year < today.year:
                    url = f'https://www.lvmh.com/en/financial-calendar/{year}-full-year-results'
                    try:
                        for doc in links(url):
                            if re.search(r'Financialdocuments-December31', urllib.parse.unquote(doc),re.I):
                                yield year, False, doc
                    except Exception:
                        continue
                if year==half_year:
                    try:
                        for doc in links(f'https://www.lvmh.com/en/financial-calendar/{year}-first-half-results'):
                            if 'financialreport' in doc.lower():yield year,True,doc
                    except Exception:pass

            else:
                if year < today.year:
                    for prefix in ('', 'investors/'):
                        try:
                            docs=links(f'https://www.airliquide.com/{prefix}{year}-annual-results')
                            selected=[u for u in docs if re.search(r'(?:pr-|press-release|results).*\.pdf', u,re.I) and not re.search(r'presentation|pre-fy|communication',u,re.I)]
                            if selected:
                                yield year,False,selected[0];break
                        except Exception:continue
                if year==half_year:
                    try:
                        docs=links(f'https://www.airliquide.com/investors/first-half-{year}-results')
                        for doc in docs:
                            if re.search(r'first-half-.*financial-report',doc,re.I):yield year,True,doc
                    except Exception:pass

        if ident == 'air-liquide':
            # The regulated-information archive is another official discovery
            # surface, independent of individual annual-result landing pages.
            for archive in ('https://www.airliquide.com/investors/regulated-information',
                            'https://www.airliquide.com/investors/documents-presentations'):
                try:
                    for doc in links(archive):
                        filename = urllib.parse.unquote(urllib.parse.urlparse(doc).path).rsplit('/',1)[-1]
                        half = re.search(r'first-half-(20\d{2}).*financial-report\.pdf$', filename, re.I)
                        annual = re.search(r'(?:pr-fy-(20\d{2})|(20\d{2})-annual-results).*\.pdf$', filename, re.I)
                        if half:
                            yield int(half[1]), True, doc
                        elif annual and not re.search(r'presentation|pre-fy|communication',filename,re.I):
                            yield int(annual[1] or annual[2]), False, doc
                except Exception:
                    continue
            yield from air_euronext_documents(today)


def air_euronext_documents(today):
    annual_years = set()
    for page in range(6):
        query = urllib.parse.urlencode({'field_company_pr_pub_datetime_start':f'{today.year-1}-01-01',
                                       'field_company_pr_pub_datetime_end':today.isoformat(), 'page':page})
        url = 'https://live.euronext.com/en/listview/company-press-release/015007?'+query
        try:
            soup = BeautifulSoup(load(url), 'html.parser')
        except Exception:
            continue
        entries = soup.find_all('a', attrs={'data-node-nid':True})
        if not entries:
            break
        for a in entries:
            title = a.get_text(' ', strip=True)
            half = re.match(r'H1\s+(20\d{2})\s+Results', title, re.I)
            annual = re.match(r'(20\d{2})\s*:', title)
            node = a.get('data-node-nid','')
            if not (half or annual) or not re.fullmatch(r'\d+',node):
                continue
            year = int((half or annual)[1])
            if year > today.year or year < today.year-6:
                continue
            # This is the public GET used by Euronext's company-news modal.
            endpoint = 'https://live.euronext.com/ajax/node/company-press-release/'+node
            try:
                for doc in links(endpoint):
                    parsed = urllib.parse.urlparse(doc)
                    if parsed.netloc == 'live.euronext.com' and parsed.path.startswith('/sites/default/files/company_press_releases/attachments/') and parsed.path.lower().endswith('.pdf'):
                        yield year, bool(half), doc
                        if annual:
                            annual_years.add(year)
            except Exception:
                continue
        if len(annual_years) >= 2:
            break

def cached_history(old, today):
    history = (old or {}).get('history', {})
    if not history.get('observedAt') or not 3 <= len(history.get('years', [])) <= 5:
        return None
    age = (today-dt.date.fromisoformat(history['observedAt'])).days
    return history if 0 <= age <= 30 else None


def parse_total_quarter(text):
    match = re.search(r'^Consolidated statement of income\s*$', text, re.M | re.I)
    if not match:
        raise ValueError('Missing TotalEnergies quarter statement')
    block = re.split('Consolidated statement of comprehensive income', text[match.end():], maxsplit=1, flags=re.I)[0]
    header = re.split(r'\nSales\s', block)[0]
    if 'TotalEnergies' not in header or '(M$)' not in header:
        raise ValueError('Wrong issuer or reporting currency')
    quarters = [int(q) for q in re.findall(r'([1-4])(?:st|nd|rd|th) quarter', header)]
    years = [int(y) for y in re.findall(r'\b20\d{2}\b', header)]
    if len(quarters) != 3 or len(years) != 3 or quarters[0] != quarters[2] or years[0] != years[2]+1:
        raise ValueError('Changed TotalEnergies quarterly columns')
    revenue = value(block, r'Revenues? from sales', 3)
    income = value(block, r'TotalEnergies share', 3)
    eps = value(block, r'(?:Fully-diluted|Diluted) earnings per share \(\$\)', 3)
    month = quarters[0]*3
    day = calendar.monthrange(years[0], month)[1]
    result = period(f'{years[0]}-{month:02d}-{day}', f'{years[2]}-{month:02d}-{day}',
                    revenue[0], income[0], eps[0], revenue[2], income[2], 3)
    result['incomeBasis'] = 'Résultat net part du groupe (IFRS)'
    return result


def collect_total_quarters(today):
    soup = BeautifulSoup(load('https://totalenergies.com/investors/results'), 'html.parser')
    candidates = []
    for tr in soup.find_all('tr'):
        match = re.search(r'([1-4])Q\s*(\d{2})\b', tr.get_text(' ', strip=True))
        if not match:
            continue
        year, quarter = 2000+int(match[2]), int(match[1])
        month = quarter*3
        end = dt.date(year, month, calendar.monthrange(year, month)[1])
        if end > today or (today-end).days > 550:
            continue
        for a in tr.find_all('a', href=True):
            if a.get_text(' ', strip=True) == 'Accounts':
                candidates.append((end, urllib.parse.urljoin('https://totalenergies.com', a['href'])))
    rows = {}
    for expected_end, url in sorted(candidates, reverse=True):
        try:
            row = parse_total_quarter(pdf_text(load(url)))
            if row['end'] != expected_end.isoformat():
                raise ValueError('Quarter differs from official archive label')
            row['sourceUrl'] = url
            rows.setdefault(row['end'], row)
        except Exception:
            continue
        if len(rows) == 4:
            break
    quarters = sorted(rows.values(), key=lambda p:p['end'], reverse=True)
    if len(quarters) != 4 or any(not 75 <= (dt.date.fromisoformat(a['end'])-dt.date.fromisoformat(b['end'])).days <= 105 for a,b in zip(quarters, quarters[1:])):
        raise ValueError('Four published TotalEnergies quarters unavailable')
    return quarters


def collect_europe(profile, today, old=None):
    rows = {}; latest_half=None; errors=[]
    cached = cached_history(old,today)
    history_observed = today.isoformat()
    documents = europe_documents(profile['id'],today)
    # Calendar pages already enumerate newest first; keep them lazy so a valid
    # monthly cache avoids fetching every older archive page on each daily run.
    if profile['id'] == 'air-liquide':
        # Investor landing pages can be unavailable while their public PDFs
        # remain accessible. Re-read previously verified official document URLs
        # after discovering new reports; never recertify numbers from the cache.
        retained = {}
        for row, half in [((old or {}).get('annual'), False), ((old or {}).get('halfYear'), True)] + [(row, False) for row in (old or {}).get('history', {}).get('years', [])]:
            if row and row.get('sourceUrl'):
                url = row['sourceUrl']
                parsed_url = urllib.parse.urlparse(url)
                trusted = (parsed_url.netloc == 'www.airliquide.com' and parsed_url.path.startswith('/sites/airliquide.com/files/')) or (parsed_url.netloc == 'live.euronext.com' and parsed_url.path.startswith('/sites/default/files/company_press_releases/attachments/'))
                if parsed_url.scheme == 'https' and trusted and parsed_url.path.endswith('.pdf'):
                    key = (url, half)
                    retained[key] = max(retained.get(key, 0), int(row['end'][:4]))
        documents = sorted(set(documents) | {(year, half, url) for (url, half), year in retained.items()}, reverse=True)
    elif profile['id'] != 'lvmh':
        documents = sorted(set(documents), reverse=True)
    for year, half, url in documents:
        if len(rows)>=5 and not half:break
        try:
            parsed = parse_europe(pdf_text(load(url)),profile['id'],year,half)
            current = parsed[-1]
            if dt.date.fromisoformat(current['end']) > today:raise ValueError('Future report')
            for row in parsed:
                row['sourceUrl'] = url
            if half:
                if latest_half is None:latest_half=current
            else:
                for row in reversed(parsed):rows.setdefault(row['end'],row)
                if cached and cached['years'][-1]['end'] == current['end'] and all(cached['years'][-1][k] == current[k] for k in ['revenue','netIncome']):
                    for row in cached['years']:rows.setdefault(row['end'],row)
                    history_observed=cached['observedAt']
                    break
        except Exception as error:
            errors.append((url,type(error).__name__,str(error)[:180]))
    if len(rows)<3:
        raise ValueError('Insufficient official annual accounts: '+str(errors))
    years=sorted(rows.values(),key=lambda r:r['end'])[-5:]
    for i in range(len(years)-1,0,-1):
        if not 330 <= (dt.date.fromisoformat(years[i]['end'])-dt.date.fromisoformat(years[i-1]['end'])).days <= 400:
            years=years[i:];break
    if len(years)<3:raise ValueError('Less than three consecutive annual statements')
    annual=years[-1]
    if (today-dt.date.fromisoformat(annual['end'])).days>550:raise ValueError('Stale annual accounts')
    if latest_half and latest_half['end'] <= annual['end']:latest_half=None
    result = {'annual':annual,'quarter':None,'halfYear':latest_half,'historyYears':years,'historyObservedAt':history_observed,
              'trailingUnavailableReason':'Quatre BPA trimestriels comparables non publiés par cet émetteur'}
    if profile['id'] == 'totalenergies':
        quarters = collect_total_quarters(today)
        result.update(quarter=quarters[0], quarters=quarters,
                      trailing={'end':quarters[0]['end'], 'dilutedEPS':sum(p['dilutedEPS'] for p in quarters),
                                'revenue':sum(p['revenue'] for p in quarters), 'sourceUrls':[p['sourceUrl'] for p in quarters],
                                'definition':'Somme de quatre BPA trimestriels IFRS publiés, part du groupe'})
        result.pop('trailingUnavailableReason')
    return result


def parse_us(raw, ident):
    if ident=='visa':
        text=pdf_text(raw)
        match=re.search(r'^Visa Consolidated Statements of Operations(?: \(unaudited\))?\s*$',text,re.M)
        if not match:raise ValueError('Missing Visa GAAP statement')
        text=text[match.end():]
        text=re.split(r'\nVisa Consolidated Statements of Cash Flows',text)[0]
        header=re.split(r'\nNet revenue',text)[0]
        if not re.search(r'in millions, except per share data', header, re.I) or not re.search(r'^Net revenue\s+\$', text, re.M):
            raise ValueError('Wrong Visa statement unit or reporting currency')
        years=[int(y) for y in re.findall(r'\b20\d{2}\b',header)]
        dates=re.findall(r'\b('+'|'.join(calendar.month_name[1:])+r')\s+(\d{1,2}),',header)
        count=len(years)
        if count not in (2,4) or not re.search(r'Three Months Ended', header):
            raise ValueError('Changed Visa quarterly period or columns')
        revenue=value(text,r'Net revenue',count)
        income=value(text,r'Net income',count)
        eps_text=text.split('Diluted Earnings Per Share',1)[1].split('Diluted Weighted-average Shares',1)[0]
        eps=value(eps_text,r'Class A common stock',count)
        month=dates[0][0]; day=int(dates[0][1]); end=f'{years[0]}-{list(calendar.month_name).index(month):02d}-{day:02d}'
        previous_end=f'{years[1]}-{list(calendar.month_name).index(month):02d}-{day:02d}'
        annual = count==4 and re.search(r'(?:Year|Twelve Months) Ended',header,re.I)
        q=period(end,previous_end,revenue[0],income[0],eps[0],revenue[1],income[1],3)
        a=period(end,previous_end,revenue[2],income[2],eps[2],revenue[3],income[3]) if annual else None
    else:
        choices=[s for s in sections(raw) if re.search(r'COSTCO WHOLESALE CORPORATION (?:CONDENSED )?CONSOLIDATED STATEMENTS OF INCOME', s)]
        if len(choices)!=1:raise ValueError('Missing Costco consolidated income statement')
        text=choices[0]; header=re.split(r'\nREVENUE',text)[0]
        if not re.search(r'dollars in millions, except per share data', header, re.I):
            raise ValueError('Wrong Costco statement unit')
        dates=re.findall(r'\b('+'|'.join(calendar.month_name[1:])+r')\s+(\d{1,2}),\s*(20\d{2})',header)
        count=len(dates)
        if count not in (2,4):raise ValueError('Changed Costco dates')
        weeks=[int(x) for x in re.findall(r'(\d+) Weeks Ended',header)]
        if not weeks or weeks[0] not in (12,16,17):raise ValueError('Wrong Costco quarter duration')
        revenue=value(text,r'Total revenue',count)
        income=value(text,r'NET INCOME',count)
        eps=value(text.split('NET INCOME PER COMMON SHARE:',1)[1].split('Shares used in calculation',1)[0],r'Diluted',count)
        def end(date):return f'{date[2]}-{list(calendar.month_name).index(date[0]):02d}-{int(date[1]):02d}'
        q=period(end(dates[0]),end(dates[1]),revenue[0],income[0],eps[0],revenue[1],income[1],3)
        q.pop('durationMonths')
        q['durationWeeks']=weeks[0]
        a=period(end(dates[2]),end(dates[3]),revenue[2],income[2],eps[2],revenue[3],income[3]) if count==4 and len(weeks)>1 and weeks[1] in (52,53) else None
    return {'annual':a,'quarter':q}


def us_candidates(ident,today):
    for year in range(today.year,today.year-6,-1):
        for q in (4,3,2,1):
            if ident=='visa':
                month={4:9,3:6,2:3,1:12}[q]; endyear=year-1 if q==1 else year
                if dt.date(endyear,month,calendar.monthrange(endyear,month)[1])>today:continue
                yield year,q,f'https://s1.q4cdn.com/050606653/files/doc_financials/{year}/q{q}/Q{q}-{year}-Earnings-Release_vF.pdf'
            else:
                # Fiscal year is the year of the August/September year end.
                endyear=year-1 if q==1 else year;month={4:8,3:5,2:2,1:11}[q]
                if dt.date(endyear,month,1)>today:continue
                words=['','First','Second','Third','Fourth']
                slug=(f'Costco-Wholesale-Corporation-Reports-Fourth-Quarter-and-Fiscal-Year-{year}-Operating-Results' if q==4 else
                      f'Costco-Wholesale-Corporation-Reports-First-Quarter-Fiscal-Year-{year}-Operating-Results' if q==1 else
                      f'Costco-Wholesale-Corporation-Reports-Second-Quarter-and-Year-to-Date-Operating-Results-for-Fiscal-{year}-and-February-Sales-Results' if q==2 else
                      f'Costco-Wholesale-Corporation-Reports-{words[q]}-Quarter-and-Year-To-Date-Operating-Results-For-Fiscal-{year}')
                yield year,q,f'https://investor.costco.com/news/news-details/{endyear}/{slug}/default.aspx'


def collect_us(profile,today,old=None):
    reports=[]; years={}
    cached = cached_history(old,today)
    history_observed=today.isoformat()
    for year,q,url in us_candidates(profile['id'],today):
        # Once four current published quarters exist, only older annual reports are needed.
        if len(reports)>=4 and q!=4:continue
        try:
            parsed=parse_us(load(url),profile['id'])
            if dt.date.fromisoformat(parsed['quarter']['end'])>today:continue
            for key in ('annual','quarter'):
                if parsed[key]:parsed[key]['sourceUrl']=url
            reports.append(parsed)
            if parsed['annual']:
                annual=parsed['annual'];years.setdefault(annual['end'],annual)
                prev={'start':None,'end':annual['previousEnd'],'revenue':annual['previousRevenue'],
                      'netIncome':annual['previousNetIncome'],'sourceUrl':url}
                years.setdefault(prev['end'],prev)
        except Exception:continue
        if len(reports)>=4 and cached:
            annuals = [r['annual'] for r in reports if r['annual']]
            current = max(annuals,key=lambda r:r['end']) if annuals else None
            if current and cached['years'][-1]['end']==current['end'] and all(cached['years'][-1][k]==current[k] for k in ['revenue','netIncome']):
                for row in cached['years']:years.setdefault(row['end'],row)
                history_observed=cached['observedAt']
                break
        if len(years)>=3 and len(reports)>=4:break
    annuals=[r['annual'] for r in reports if r['annual']]
    if not annuals:raise ValueError('No official US annual statement')
    annual=max(annuals,key=lambda r:r['end'])
    quarters=sorted({r['quarter']['end']:r['quarter'] for r in reports}.values(),key=lambda r:r['end'],reverse=True)[:4]
    latest=quarters[0]
    if (today-dt.date.fromisoformat(annual['end'])).days>550 or (today-dt.date.fromisoformat(latest['end'])).days>200:
        raise ValueError('Stale US issuer statements')
    result={'annual':annual,'quarter':latest if latest['end']>annual['end'] else None,
            'quarters':quarters,'historyYears':sorted(years.values(),key=lambda r:r['end'])[-5:],'historyObservedAt':history_observed}
    bound=120 if profile['id']=='costco' else 105
    if len(quarters)==4 and all(75<=(dt.date.fromisoformat(a['end'])-dt.date.fromisoformat(b['end'])).days<=bound for a,b in zip(quarters,quarters[1:])):
        result['trailing']={'end':latest['end'],'dilutedEPS':sum(p['dilutedEPS'] for p in quarters),
                            'revenue':sum(p['revenue'] for p in quarters),'sourceUrls':[p['sourceUrl'] for p in quarters],
                            'definition':'Somme de quatre BPA trimestriels GAAP publiés ; calendrier fiscal 12/16/17 semaines pour Costco'}
    return result


def collect(profile,today,old=None):
    return collect_europe(profile,today,old) if profile['id'] in EUROPE else collect_us(profile,today,old)
