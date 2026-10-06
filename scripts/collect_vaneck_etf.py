"""VanEck's automatically replaced official UCITS factsheets, with fund/share scope retained."""
import re
import pathlib
import subprocess
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
            if re.fullmatch(r'(?:20\d{2}\s+){4,}20\d{2}',line.strip()):years=re.findall(r'20\d{2}',line)
            if 'VanEck ' in line and re.search(r'-?\d+\.\d+',line):
                values=re.findall(r'-?\d+\.\d+',line.split('VanEck ',1)[1])
        if years and values and len(values)<=len(years):
            years=years[-len(values):]
            if any(int(y)>=now.year for y in years):reject('Incomplete VanEck calendar year')
            result['performance']={'currency':share['currency'],'basis':'fund',
                'method':'calendar-year NAV total return, net income reinvested, net of fees',
                'years':{y:bounded_return(float(v))for y,v in zip(years,values)}}
        else:result['unavailable'].append('performance: numerical calendar-year row not qualified')
    return result


def collect_one(share,now,fetch=download):
    try:
        body = fetch(share['sourceUrl'])
    except ValueError as error:
        if fetch is not download or 'Expected official PDF' not in str(error):
            raise
        script = pathlib.Path(__file__).with_name('download-vaneck-document.mjs')
        result = subprocess.run(['node', str(script), share['sourceUrl']], capture_output=True, timeout=65)
        if result.returncode:
            reject(str(error) + '; browser initialisation failed: ' + result.stderr.decode('utf-8', errors='replace')[-5000:])
        body = result.stdout
    return parse_document(body,share,now)
