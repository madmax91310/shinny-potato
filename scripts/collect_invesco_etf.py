"""Invesco's latest official exact-share factsheet and its numerical calendar-year table."""
import re
from data_automation import reject
from issuer_documents import download,pdf_text,document_date,proof,bounded_return


def parse_document(body,share,now):
    text=pdf_text(body)
    if share['isin']not in text:reject('Wrong Invesco exact share')
    stamp=document_date(re.search(r'As of (\d+ [A-Za-z]+ \d{4})',text)[1],now)
    currency=re.search(r'(?:Base currency|Fund base currency|Product base currency)\s+(USD|EUR|GBP)',text)
    if not currency or currency[1]!=share['currency']:reject('Invesco currency mismatch')
    charge=re.search(r'(?:Ongoing charge\s*\d*|Management fee\s*\d*|Fixed fee)\s+(\d+\.\d+)%',text)
    if not charge or not 0<=float(charge[1])<=5:reject('Invesco expenses missing/invalid')
    aum=re.search(r'(?:Fund size|Product size)\s+(USD|EUR) ([\d,.]+)m',text)
    if not aum or aum[1]!=share['currency']:reject('Invesco fund assets missing')
    block=pdf_text(body,(190,800)).split('Calendar year performance (%)',1)[1].split('Standardised rolling',1)[0]
    years=next((re.findall(r'20\d{2}',l)for l in block.splitlines()if len(re.findall(r'20\d{2}',l))>=5),None)
    line=next((l.strip()for l in block.splitlines()if l.strip().startswith(('ETF ','ETC '))),None)
    if not years or not line:reject('Invesco numerical calendar-year row missing')
    values=re.findall(r'-?\d+\.\d+|(?<!\S)-(?!\S)',line[3:])
    if len(values)!=len(years)or any(int(y)>=now.year for y in years):reject('Invesco calendar-year columns changed')
    returns={y:bounded_return(float(v))for y,v in zip(years,values)if v!='-'}
    return {**share,'productId':share['isin'],'terPct':float(charge[1]),'index':share['benchmark'],'distribution':share.get('distribution'),
        'aum':{'amount':float(aum[2].replace(',',''))*1e6,'currency':share['currency'],'scope':'fund','asOf':stamp},
        'documentSha256':proof(body),'performance':{'basis':'fund','currency':share['currency'],
          'method':'calendar-year NAV total return, net income reinvested, net of ongoing charges','years':returns},
        'unavailable':['composition: commodity/metal exposures are not equity sectors or share holdings']}


def collect_one(share,now,fetch=download):
    return parse_document(fetch(share['sourceUrl']),share,now)
