"""VanEck's automatically replaced official UCITS factsheets, with fund/share scope retained."""
import re
import pathlib
import subprocess
import urllib.error
from urllib.parse import urlparse
from data_automation import reject
from issuer_documents import download,pdf_text,document_date,proof,validated_rows,bounded_return


def parse_document(body,share,now):
    text=pdf_text(body)
    if share['isin']not in text:reject('Wrong VanEck UCITS share identity')
    stamp=document_date(re.search(r'\b\d{1,2} [A-Za-z]+ 20\d{2}\b',text)[0],now)
    if re.search(r'Base Currency\s+(USD|EUR|GBP)',text)[1]!=share['currency']:reject('VanEck base currency mismatch')
    assets=re.search(r'Net Assets\s+(USD |EUR |€)([\d,.]+)([MB])',text)
    if not assets or assets[1].strip().replace('€','EUR')!=share['currency']:reject('VanEck asset currency mismatch')
    ter=float(re.search(r'Total Expense Ratio\s+(\d+\.\d+)%',text)[1])
    if not 0<=ter<=5:reject('Invalid VanEck TER')
    result={**share,'productId':share['isin'],'terPct':ter,'index':share['benchmark'],'distribution':share.get('distribution'),
        'aum':{'amount':float(assets[2].replace(',',''))*(1e6 if assets[3]=='M' else 1e9),'currency':share['currency'],'scope':'fund','asOf':stamp},
        'documentSha256':proof(body),'unavailable':[]}
    country=[];left=pdf_text(body,(0,185))
    if 'Country Breakdown'in left:
        block=left.split('Country Breakdown',1)[1].split('\f',1)[0]
        for line in block.splitlines():
            m=re.match(r'\s*([^\d%]+?)\s{2,}(\d+\.\d+)%\s*$',line)
            if m:country.append({'name':m[1].strip(),'weightPct':float(m[2])})
        validated_rows(country)
        result['countries']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':country}
    holdings=[];right=pdf_text(body,(190,410))
    block=(right if 'Top 10 Holdings' in right else text).split('Top 10 Holdings',1)[1].split('SUBTOTAL',1)[0]
    for line in block.splitlines():
        m=re.match(r'\s*([^\d%]+?)\s{2,}(\d+\.\d+)%\s*$',line)
        if m:holdings.append({'name':m[1].strip(),'weightPct':float(m[2])})
    if len(holdings)!=10:reject('Incomplete VanEck holdings table')
    validated_rows(holdings,complete=False)
    result['holdings']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':holdings}
    result['unavailable'].append('sectors: factsheet does not publish a complete sector table')
    # An exact numerical ETF row is used, never the benchmark row or the bar chart.
    if 'Past Performance as of'in text:
        block=text.split('Past Performance as of',1)[1].split('Past performance does not',1)[0]
        years=[];values=[]
        for line in block.splitlines():
            cells=re.split(r' {2,}',line.strip())
            header=re.search(r'(?:^| {2,})(20\d{2}(?:\s+20\d{2})*)\s*$',line.strip())
            if header: years=re.findall(r'20\d{2}',header[1])
            if 'VanEck ' in line and 'Benchmark' not in line:
                # Numeric columns are separated from the ETF label by two or
                # more spaces. Integer returns (9, 16...) are valid observations.
                cells=re.split(r' {2,}',line.split('VanEck ',1)[1].strip(),maxsplit=1)
                numeric=cells[1].split() if len(cells)==2 else []
                if numeric and any(not re.fullmatch(r'-?\d+(?:\.\d+)?',c) for c in numeric):
                    reject('Invalid VanEck numerical calendar row')
                if numeric: values=numeric
        header=re.search(r'Fund Data\s+(20\d{2}(?:\s+20\d{2})*)',block)
        if header: years=re.findall(r'20\d{2}',header[1])
        if years and values and len(values)<=len(years):
            import datetime as dt
            launch=re.search(r'Inception Date\s+(\d{1,2} [A-Za-z]+ 20\d{2})',text)
            if not launch: reject('Missing VanEck fund inception date')
            inception=dt.date.fromisoformat(document_date(launch[1],now,max_age=36500))
            first_full=inception.year + (0 if (inception.month,inception.day)==(1,1) else 1)
            numeric_years=list(map(int,years))
            if numeric_years != list(range(min(numeric_years),now.year)):
                reject('Missing, duplicate or unfinished VanEck calendar column')
            years=[y for y in years if int(y)>=first_full]
            if len(values)!=len(years): reject('Missing complete VanEck calendar observation')
            result['performance']={'currency':share['currency'],'basis':'fund',
                'method':('calendar-year NAV total return, income distributions gross of Dutch withholding tax, net of fund fees'
                          if share['isin'].startswith('NL') else 'calendar-year NAV total return, net income reinvested, net of fees'),
                'years':{y:bounded_return(float(v))for y,v in zip(years,values)}}
        else:result['unavailable'].append('performance: numerical calendar-year row not qualified')
    return result


def official_transport_url(value):
    parsed = urlparse(value)
    return (parsed.scheme == 'https' and parsed.netloc == 'www.vaneck.com'
            and not parsed.username and not parsed.password)


def collect_one(share,now,fetch=download):
    urls=[share['sourceUrl'], *share.get('fallbackUrls',[])]
    document=pathlib.PurePosixPath(urlparse(share['sourceUrl']).path).name
    for url in urls:
        parsed=urlparse(url)
        if (parsed.scheme!='https' or parsed.netloc!='www.vaneck.com' or parsed.query or parsed.fragment
                or not re.fullmatch(r'/(?:ucits|[a-z]{2}/en)/library/fact-sheets/[a-z0-9]+-fact-sheet\.pdf',parsed.path)
                or pathlib.PurePosixPath(parsed.path).name!=document):
            reject('Unexpected VanEck regional document URL')
    last_error=None
    for url in urls:
        try:
            body=download(url, url_validator=official_transport_url) if fetch is download else fetch(url)
        except (urllib.error.URLError, TimeoutError) as error:
            last_error=error;continue
        except ValueError as error:
            if 'Expected official PDF' not in str(error):raise
            last_error=error;continue
        # An incompatible document must fail, never trigger another source.
        return complement(parse_document(body,{**share,'sourceUrl':url},now),share,now,fetch)
    if fetch is not download:raise last_error
    script=pathlib.Path(__file__).with_name('download-vaneck-document.mjs')
    for url in urls:
        try:
            result=subprocess.run(['node',str(script),url],capture_output=True,timeout=120)
        except subprocess.TimeoutExpired as error:
            last_error=error;continue
        if result.returncode:
            last_error=ValueError(str(last_error)+'; browser initialisation failed: '+result.stderr.decode('utf-8',errors='replace')[-5000:])
            continue
        # Identity/date/content validation remains fatal; never seek another PDF
        # after a successful transport returned an incompatible document.
        return complement(parse_document(result.stdout,{**share,'sourceUrl':url},now),share,now,fetch)
    reject(str(last_error))



def complement(result, share, now, fetch):
    if not share.get('pageUrl'): return result
    from collect_vaneck_allocations import collect
    try:
        result['sectors'] = collect(share, now, fetch)
        result['unavailable'] = [s for s in result['unavailable'] if not s.startswith('sectors:')]
    except Exception as error:
        result.setdefault('collectionErrors', []).append({'field': 'sectors', 'reason': str(error)})
    return result
