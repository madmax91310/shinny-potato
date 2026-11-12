"""Exact Xetra/EUR references from an issuer's English factsheet matrix.

The fund currency never supplies the trading currency. Other venues/currencies
remain outside this adapter; their existing dates and independent sources stay.
"""
import datetime as dt
import re
from urllib.parse import urlsplit

def blackrock_xetra_reference(text, isin, url, checked):
    parsed=urlsplit(url)
    if parsed.scheme!='https' or parsed.netloc!='www.blackrock.com' or parsed.query or parsed.fragment or not re.fullmatch(r'/gls-download/literature/fact-sheet/iues-ishares-s-p-500-energy-sector-ucits-etf-fund-fact-sheet-en-no\.pdf',parsed.path):return []
    identities=re.findall(r'\bISIN\s*:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])\b',text)
    if identities!=[isin]:raise ValueError('Wrong or ambiguous primary factsheet share identity')
    dates=re.findall(r'All other data as at\s+(\d{2}-[A-Za-z]{3}-\d{4})',text)
    if len(dates)!=1:raise ValueError('Missing or ambiguous trading-reference document date')
    reference=dt.datetime.strptime(dates[0],'%d-%b-%Y').date()
    if reference>dt.date.fromisoformat(checked):raise ValueError('Future trading-reference document date')
    if text.count('TRADING INFORMATION')!=1:return []
    block=text.split('TRADING INFORMATION',1)[1].split('This product is also listed on:',1)[0].split('\f',1)[0]
    lines=block.splitlines();headers=[i for i,line in enumerate(lines)if re.match(r'^Exchange\s{2,}',line)]
    if len(headers)!=1:raise ValueError('Missing or ambiguous factsheet exchange matrix')
    start=headers[0];segments=list(re.finditer(r'\S+(?: \S+)*',lines[start]));positions=[m.start()for m in segments[1:]]
    if not positions:raise ValueError('Empty exchange matrix')
    def cells(line):return [line[a:b].strip()for a,b in zip(positions,positions[1:]+[None])]
    venues=cells(lines[start]);i=start+1
    while i<len(lines)and not re.match(r'^Ticker\s{2,}',lines[i]):
        extra=cells(lines[i]);venues=[' '.join(filter(None,[a,b]))for a,b in zip(venues,extra)];i+=1
    def row(labels):
        found=[cells(line)for line in lines[i:]if line[:positions[0]].strip()in labels and any(cells(line))]
        if len(found)!=1 or any(not value for value in found[0]):raise ValueError('Truncated or ambiguous trading-reference row')
        return found[0]
    tickers=row({'Ticker'});currencies=row({'Listing','Listing Currency','Currency'});rics=row({'RIC'})
    matches=[n for n,venue in enumerate(venues)if venue=='Deutsche Boerse Xetra']
    if len(matches)!=1:return []
    n=matches[0];ticker=tickers[n];symbol=rics[n]
    if currencies[n]!='EUR':return []
    if not re.fullmatch(r'[A-Z0-9]+',ticker)or symbol!=ticker+'.DE':raise ValueError('Xetra ticker and explicit RIC disagree')
    return [dict(ticker=ticker,mic='XETR',exchange='Xetra',currency='EUR',symbol=symbol,priceScale=1,referenceDate=reference.isoformat(),excerpt=isin+' | '+venues[n]+' | '+ticker+' | '+currencies[n]+' | '+symbol+' | document reference '+reference.isoformat())]
