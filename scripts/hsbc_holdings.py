"""Complete HSBC physical equity workbook; preserve published NAV weights."""
import io
import math
import re
import xlrd
from issuer_documents import download, pdf_text, document_date
from collect_document_etf import parse as parse_factsheet
from collect_physical_holdings import observation, digest

ISIN='IE00B4K6B022'
NAME='HSBC EURO STOXX 50 UCITS ETF'
ROOT='https://www.assetmanagement.hsbc.co.uk/api/v1/download/document/ie00b4k6b022/gb/en/'
HEADERS=['ISIN','CUSIP','SecurityName','NumberOfShare','MarketValue','Country','LocalCurrencyCode','Weighting']
CONTROL={'Capital Cash Ctrl','Capital Cash Ctrl Class B','Class Ffx Control','Class Ffx Control Class S',
         'Futures Liability','Capital Cash Ctrl Class J','Capital Cash Ctrl Class S',
         'Accrued Mgment Chg Capital Crystalised','Accrued Mgment Chg Capital B','Accrued Mgment Chg Capital J'}
ACCOUNT=re.compile(r'(?:Eur|Gbp|Usd) (?:Capital Cash|Reclaimable Tax On Dividends|Initial Margin|Accrued Mgment Chg Capital S|Stocklending Commission Receivable|Futures Broker Account|Accrued Passive Hedging Fees S|Irrec Overseas Tax On Divs Receivable)')
FUTURE=re.compile(r'Euro Stoxx 50 Future (?:Mar|Jun|Sep|Dec) \d{2}')

def parse_workbook(raw, now):
    if len(raw)>2_000_000 or not raw.startswith(bytes.fromhex('d0cf11e0a1b11ae1')):
        raise ValueError('Unexpected HSBC full-holdings workbook')
    book=xlrd.open_workbook(file_contents=raw,on_demand=True)
    try:
        if book.sheet_names()!=['Report']:raise ValueError('HSBC holdings sheets changed')
        sheet=book.sheet_by_index(0)
        if not 20<=sheet.nrows<=10000 or sheet.ncols!=8:raise ValueError('HSBC holdings size changed')
        rows=[sheet.row_values(i) for i in range(sheet.nrows)]
        if rows[1][:2]!=['Name',NAME] or rows[2][0]!='Date' or rows[3][0]!='Fund Size' or rows[6]!=HEADERS:
            raise ValueError('Wrong HSBC fund identity or workbook schema')
        if sheet.cell_type(2,1)!=xlrd.XL_CELL_DATE:raise ValueError('HSBC observation date missing')
        stamp=document_date(xlrd.xldate_as_datetime(rows[2][1],book.datemode).date().isoformat(),now)
        return parse_positions(rows[7:],stamp)
    finally:book.release_resources()

def parse_positions(values, stamp):
    records=[];excluded=[];total_weight=0;market_total=0
    for row in values:
        if len(row)!=8:raise ValueError('Misaligned HSBC position')
        isin,_,name,quantity,market,country,currency,weight=row
        if not isinstance(name,str) or not name or currency not in ['EUR','GBP','USD']:
            raise ValueError('Unknown HSBC position identity/currency')
        if any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) for x in [market,weight]):
            raise ValueError('Nonfinite HSBC value or weight')
        total_weight+=weight;market_total+=market
        if not isin:
            if name not in CONTROL and not ACCOUNT.fullmatch(name):raise ValueError('Unqualified HSBC account: '+name)
            excluded.append({'name':name,'weightPct':weight,'kind':'cash-receivable-payable'})
        elif FUTURE.fullmatch(name):
            if not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',isin):raise ValueError('Invalid HSBC future identity')
            excluded.append({'isin':isin,'name':name,'weightPct':weight,'kind':'index-future'})
        else:
            if (not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',isin) or weight<0 or market<0
                    or re.search(r'\b(?:ETF|UCITS|fund|warrant|swap|forward|option|futures?|certificate|rights?)\b',name,re.I)):
                raise ValueError('Unqualified HSBC equity security: '+name)
            records.append({'isin':isin,'name':name,'weightPct':weight})
    if abs(total_weight-100)>len(values)*0.000005+1e-9 or market_total<=0 or len(records)<10:
        raise ValueError('Truncated or non-long-only HSBC portfolio')
    for row in values:
        if abs(100*row[4]/market_total-row[7])>0.00002:
            raise ValueError('HSBC market values and published weights do not reconcile')
    if len({r['isin'] for r in records})!=len(records):raise ValueError('Duplicate HSBC security')
    return records,stamp,excluded

def collect(share,now):
    if share.get('isin')!=ISIN or share.get('currency')!='EUR':raise ValueError('Unsupported HSBC exact share')
    document=download(ROOT+'factsheet');text=pdf_text(document)
    parse_factsheet(text,{'isin':ISIN,'currency':'EUR','documentType':'hsbc'},now)
    if NAME not in text or not re.search(r'Replication method\s+Physical-\s*Full',text):
        raise ValueError('HSBC physical replication is not confirmed')
    raw=download(ROOT+'holdings');rows,stamp,excluded=parse_workbook(raw,now)
    return observation(rows,stamp,ROOT+'holdings',raw,excludedPositions=excluded,
        identitySourceUrl=ROOT+'factsheet',identitySha256=digest(document),sourceUrls=[ROOT+'holdings',ROOT+'factsheet'],
        note='Weights are the published Weighting column and reconcile with all reported market values. The unqualified Fund Size header is not used as AUM or to derive weights.')
