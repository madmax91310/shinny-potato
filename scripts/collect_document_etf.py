"""Exact-share public issuer factsheets; publish only explicitly labelled fields."""
import re
import datetime as dt
import urllib.error
import urllib.request
import http.cookiejar
from urllib.parse import urlparse
from html.parser import HTMLParser
from data_automation import number, reject
from issuer_documents import download, pdf_text, document_date, proof, bounded_return, validated_rows


def match(pattern,text):
    results=re.findall(pattern,text,re.M)
    if not results or len(set(results))!=1:reject('Missing or ambiguous issuer field: '+pattern)
    return results[0]


def parse(text,share,now):
    isin=share['isin'];kind=share['documentType']
    if isin not in text:reject('Exact ISIN absent from issuer document')
    result={**share,'productId':isin,'unavailable':[]}
    if kind=='wisdomtree':
        stamp=document_date(match(r'Document Date:\s*(\d{2}/\d{2}/\d{4})',text),now)
        if match(r'Base Currency\s+([A-Z]{3})\s*$',text)!=share['currency'] or match(r'ISIN\s+([A-Z0-9]{12})\s*$',text)!=isin:reject('Wrong WisdomTree exact share/currency')
        ter=float(match(r'Management Fee\s+([\d.]+)%',text))
        section=match(r'(Calendar Year Performance \(Net of fees\)[\s\S]*?)Rolling 12-month',text)
        years=re.findall(r'\b(20\d{2})\b',section.split(share['name'])[0])
        row=match(re.escape(share['name'])+r'\s+((?:-?[\d.]+%\s*)+)',section)
        values=re.findall(r'(-?[\d.]+)%',row)
        if len(years)!=len(values) or len(set(years))!=len(years) or any(int(y)>=now.year for y in years):reject('WisdomTree calendar columns invalid')
        result['performance']={'currency':share['currency'],'basis':'fund','method':'calendar-year exact ETP NAV total return, net of fees','years':{y:bounded_return(float(v)) for y,v in zip(years,values)}}
        result['unavailable'].append('aum: not published in this factsheet')
    elif kind=='hsbc':
        stamp=document_date(match(r'Monthly report (\d+ [A-Za-z]+ 20\d{2})',text),now)
        if match(r'Share class base currency\s+([A-Z]{3})',text)!=share['currency'] or match(r'ISIN\s+([A-Z0-9]{12})',text)!=isin:reject('Wrong HSBC exact share/currency')
        ter=float(match(r'Ongoing charge figure[^\d\n]*([\d.]+)%',text))
        amount=float(match(r'Fund size\s+EUR ([\d,]+)',text).replace(',',''))
        result['aum']={'amount':number(amount),'currency':'EUR','scope':'fund','asOf':stamp}
        for field,start,end in [('sectors','Sector allocation','Past performance'),('countries','Geographical allocation','Top 10')]:
            sections=re.findall(re.escape(start)+r'[^\n]*\n([\s\S]*?)'+re.escape(end),text)
            if len(sections)!=1:result['unavailable'].append(field+': no unique complete table');continue
            rows=[{'name':n.strip(),'weightPct':float(w)} for n,w in re.findall(r'^\s*([A-Za-z &]+?)\s+([\d.]+)\s*$',sections[0],re.M)]
            result[field]={'rows':validated_rows(rows),'asOf':stamp,'basis':'fund'}
        result['unavailable'].append('performance: factsheet contains rolling returns, not calendar-year returns')
    elif kind=='lg':
        stamp=document_date(match(r'(\d+ [A-Za-z]+ 20\d{2}) Fact Sheet',text),now)
        if 'USD Accumulating ETF Class' not in text or match(r'Base currency\s+([A-Z]{3})',text)!=share['currency']:reject('Wrong L&G share currency/convention')
        ter=float(match(r'Ongoing charge\s+([\d.]+)%',text))
        amount=float(match(r'Fund size\s+\$([\d,.]+)m',text).replace(',',''))*1e6
        result['aum']={'amount':number(amount),'currency':'USD','scope':'fund','asOf':stamp}
        result['unavailable'].append('performance: rolling periods are not calendar years; index tables require separate scoped extraction')
    elif kind=='21shares':
        day,month,year=match(r'Factsheet as of (\d+)[^\n]*\n\s*([A-Za-z]+),\s+(20\d{2})',text)
        stamp=document_date(f'{day} {month} {year}',now)
        if match(r'ISIN\s+([A-Z0-9]{12})',text)!=isin:reject('Wrong 21Shares exact share')
        ter=float(match(r'Fee\s+([\d.]+)%',text));amount=float(match(r'AUM\s+\$([\d,.]+)',text).replace(',',''))
        result['aum']={'amount':number(amount),'currency':'USD','scope':'share-class','asOf':stamp}
        result['unavailable'].append('performance: no complete calendar-year table in factsheet')
    else:reject('Unknown document layout')
    if not 0<=ter<=5:reject('Invalid issuer expenses')
    result['characteristics']={'terPct':ter}
    return result


def collect_one(share,now):
    body=download(share['sourceUrl']);result=parse(pdf_text(body),share,now)
    result['sha256']=proof(body)
    for field in ['aum','performance','sectors','countries']:
        if field in result:result[field].update(sourceUrl=share['sourceUrl'],sha256=proof(body))
    return result


class Text(HTMLParser):
    def __init__(self):super().__init__();self.parts=[]
    def handle_data(self,value):
        if value.strip():self.parts.append(value.strip())


def parse_legacy(text,share,now):
    if f'var portfolioId = "{share["productId"]}";' not in text:reject('Wrong legacy iShares product')
    fields={}
    for key,body in re.findall(r'<div class="product-data-item col-([\w-]+)[^"]*">([\s\S]*?)(?=<div class="product-data-item|<script|<div class="product-data-list|</section>)',text):
        if key in fields:reject('Duplicate legacy iShares field')
        p=Text();p.feed(body);fields[key]=p.parts
    if fields['isin'][-1]!=share['isin'] or fields['seriesBaseCurrencyCode'][-1]!=share['currency']:reject('Wrong legacy iShares share/currency')
    aum=fields['totalNetAssets'];date=match(r'(?:au|as of) (\d{2}/[A-Za-zéû.]+/20\d{2})',' '.join(aum))
    day,month,year=date.split('/');names={'janv.':1,'févr.':2,'mars':3,'avr.':4,'mai':5,'juin':6,'juil.':7,'août':8,'sept.':9,'oct.':10,'nov.':11,'déc.':12}
    names.update({name.lower():i for i,name in enumerate(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],1)})
    stamp=document_date(dt.date(int(year),names[month.lower()],int(day)).isoformat(),now)
    amount=aum[-1].split(' ',1)
    if amount[0]!=share['currency']:reject('Wrong legacy iShares AUM currency')
    value=float(re.sub(r'[\s’]','',amount[1]).replace(',','.'));ter=float(fields['emeaMgt'][-1].replace('%','').replace(',','.'))
    if not 0<=ter<=5:reject('Invalid legacy iShares TER')
    return {**share,'characteristics':{'terPct':ter},'aum':{'amount':number(value),'currency':share['currency'],'scope':'share-class','asOf':stamp},
        'unavailable':['performance: new share lacks full 2020–2025 calendar history','exposures: swap basket is not the tracked-index composition']}


def collect_legacy(share,now,fetch=None):
    from data_automation import get_text
    if fetch is None:
        # The public legacy pages reject the generic collector agent on hosted
        # runners. Keep regional cookies and send normal HTML request headers.
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        def open_page(request, **kwargs):
            request.add_header('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
            request.add_header('Accept-Language', 'en-GB,en;q=0.9,fr;q=0.8')
            return opener.open(request, **kwargs)
        def fetch(url, content_types, max_bytes):
            return get_text(url, content_types, max_bytes, opener=open_page)
    urls = [share['sourceUrl'], *share.get('fallbackUrls', [])]
    # Only transport failures qualify for an alternate official page. A response
    # with the wrong ISIN, currency or stale date must still fail validation.
    for position, url in enumerate(urls):
        parsed = urlparse(url)
        if (parsed.scheme != 'https' or parsed.hostname not in ('www.ishares.com', 'www.blackrock.com')
                or f'/products/{share["productId"]}/' not in parsed.path):
            reject('Unexpected legacy iShares official source')
        try:
            text = fetch(url, ('text/html',), 6_000_000)
        except (urllib.error.URLError, TimeoutError):
            if position == len(urls) - 1:
                raise
            continue
        result = parse_legacy(text, share, now)
        result['sourceUrl'] = url
        result['aum'].update(sourceUrl=url, sha256=proof(text.encode()))
        return result
