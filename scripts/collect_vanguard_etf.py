"""Vanguard's live factsheet link: exact-share dated assets, expenses and published exposures."""
from html.parser import HTMLParser
import re
from urllib.parse import urlsplit
from data_automation import reject
from issuer_documents import download, pdf_text, document_date, proof, validated_rows


class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a' and attrs.get('href'):self.links.append(attrs['href'])


def parse_document(body,share,now):
    text=pdf_text(body)
    if share['isin']not in text:reject('Wrong Vanguard factsheet share')
    stamp=document_date(re.search(r'Factsheet \| (\d+ [A-Za-z]+ \d{4})',text)[1],now)
    currency=re.search(r'Base currency[^\n]*\n\s*(USD|EUR|GBP)\b',text)
    if not currency or currency[1]!=share['currency']:reject('Vanguard base currency changed')
    aum=re.search(r'Share class assets \(million\)\s*([\$€£])([\d,]+(?:\.\d+)?) as at (\d+ [A-Za-z]+ \d{4})',text)
    if not aum or {'$':'USD','€':'EUR','£':'GBP'}[aum[1]]!=share['currency']:reject('Vanguard exact-share assets missing')
    aum_date=document_date(aum[3],now)
    ter=re.search(r'Ongoing Charges Figure\S*\s+(\d+\.\d+)%',text)
    if not ter or float(ter[1])>5:reject('Vanguard expenses missing/invalid')
    result={**share,'productId':share['isin'],'terPct':float(ter[1]),'index':share['benchmark'],
      'distribution':share['distribution'],'aum':{'amount':float(aum[2].replace(',',''))*1e6,
       'currency':share['currency'],'scope':'share-class','asOf':aum_date},
      'documentSha256':proof(body),'unavailable':['performance: factsheet publishes rolling twelve-month returns, not calendar years',
       'countries: factsheet geography is a truncated top-country table']}
    if share.get('equity',True):
        holdings=[];block=text.split('Top 10 holdings',1)[1].split('Weighted exposure',1)[0]
        for line in block.splitlines():
            cells=re.split(r' {2,}',line.strip())
            if len(cells)>=2 and re.fullmatch(r'\d+\.\d+%?',cells[-1]) and not re.fullmatch(r'[\d.,$%]+',cells[-2]):
                holdings.append({'name':cells[-2],'weightPct':float(cells[-1].rstrip('%'))})
        if len(holdings)!=10:reject('Vanguard top-ten holdings table incomplete')
        validated_rows(holdings,complete=False)
        result['holdings']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':holdings}
        sectors=[];block=text.split('Weighted exposure',1)[1].split('Sector categories',1)[0]
        for line in block.splitlines():
            cells=re.split(r' {2,}',line.strip())
            for i in range(len(cells)-1):
                if re.fullmatch(r'[A-Za-z &]+',cells[i]) and re.fullmatch(r'\d+\.\d+%?',cells[i+1]):
                    sectors.append({'name':cells[i],'weightPct':float(cells[i+1].rstrip('%'))})
        validated_rows(sectors)
        result['sectors']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':sectors}
    return result


def collect_one(share,now,fetch=download):
    page=fetch(share['pageUrl']).decode('utf-8');parser=Links();parser.feed(page)
    links=[u for u in parser.links if urlsplit(u).hostname=='fund-docs.vanguard.com'and
           f"_{share['productCode']}_"in u and u.endswith('_UK_EN.pdf')]
    if len(set(links))!=1:reject('Vanguard current factsheet link ambiguous')
    url=links[0]
    return parse_document(fetch(url),{**share,'sourceUrl':url},now)
