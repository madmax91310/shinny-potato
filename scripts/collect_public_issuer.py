"""Dated exact-share issuer HTML; tables retain their economic scope."""
import re
import urllib.error
import urllib.request
import http.cookiejar
import datetime as dt
from html.parser import HTMLParser
from data_automation import reject, number, get_text
from issuer_documents import download, document_date, proof, validated_rows


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.skip = 0; self.tokens = []; self.tables = []
        self.table = None; self.row = None; self.cell = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
        if self.skip: return
        if tag == 'table': self.table = {'context': ' '.join(self.tokens[-10:]), 'rows': []}
        if tag == 'tr' and self.table is not None: self.row = []
        if tag in ('td', 'th') and self.row is not None: self.cell = []

    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)
        if self.skip: return
        if tag in ('td', 'th') and self.cell is not None:
            self.row.append(' '.join(self.cell)); self.cell = None
        if tag == 'tr' and self.row is not None:
            self.table['rows'].append(self.row); self.row = None
        if tag == 'table' and self.table is not None:
            self.tables.append(self.table); self.table = None

    def handle_data(self, text):
        text = ' '.join(text.split())
        if text and not self.skip:
            self.tokens.append(text)
            if self.cell is not None: self.cell.append(text)


def only(items, label):
    if len(items) != 1: reject('Missing or ambiguous issuer ' + label)
    return items[0]


def money(value):
    m = re.fullmatch(r'(US\$|\$|€|EUR |USD |GBP |£)([\d,.]+)', value.strip())
    if not m: reject('Unqualified AUM currency or amount')
    currency = {'US$':'USD', '$':'USD', '€':'EUR', '£':'GBP'}.get(m[1], m[1].strip())
    amount = number(float(m[2].replace(',', '')))
    if amount <= 0: reject('Invalid issuer AUM')
    return amount, currency


def base(share, stamp, digest):
    return {**share, 'productId':share['isin'], 'unavailable':[],
            'characteristics':{'asOf':stamp,'sourceUrl':share['sourceUrl'],'sha256':digest}}


def composition(rows, stamp, share, digest, complete=True, basis='fund'):
    rows = [{'name':r[0], 'weightPct':float(r[1].rstrip('%'))} for r in rows]
    return {'rows':validated_rows(rows, complete), 'asOf':stamp, 'basis':basis,
            'sourceUrl':share['sourceUrl'], 'sha256':digest}


def wisdomtree(text, share, now):
    page = Page(text)
    def table(title):
        return only([t['rows'] for t in page.tables if t['rows'] and t['rows'][0][0] == title], title)
    overview = table('Product Overview'); fields = dict(overview[1:])
    if fields.get('ISIN') != share['isin'] or fields.get('Base Currency') != share['currency']:
        reject('Wrong WisdomTree exact share/currency')
    stamp = document_date(only(re.findall(r'As of (\d{2}/\d{2}/\d{4})', ' '.join(overview[0])), 'overview date'), now)
    fees = table('Fees'); fees_stamp = document_date(fees[0][1].removeprefix('As of '), now)
    charges = dict(fees[1:])
    fee = charges.get('Total expense ratio (TER)', charges.get('Management Fee (MER)'))
    if fee is None: reject('Missing WisdomTree explicit fee')
    ter = float(fee.rstrip('%'))
    if not 0 <= ter <= 5: reject('Invalid WisdomTree expenses')
    digest = proof(text.encode()); result = base(share, fees_stamp, digest)
    result['characteristics'].update(terPct=round(ter, 4))
    # MER/TER and the separately disclosed commodity swap charge have different labels.
    if 'Annual Swap Rate' in charges:
        swap=float(charges['Annual Swap Rate'].rstrip('%'))
        if not 0<=swap<=5:reject('Invalid WisdomTree swap rate')
        result['characteristics']['annualSwapRatePct']=swap
    nav = table('Net Asset Value'); amount, currency = money(dict(nav[1:])['Total AUM of fund'])
    result['aum'] = {'amount':amount,'currency':currency,'scope':'fund',
                     'asOf':document_date(nav[0][1].removeprefix('As of '),now),
                     'sourceUrl':share['sourceUrl'],'sha256':digest}
    for field, title in [('holdings','Holdings'),('sectors','Sector Breakdown'),('countries','Country Allocation')]:
        candidates = [t for t in page.tables if (title+' As of' in t['context'] if field!='countries' else t['context'].endswith(title)) and t['rows'] and t['rows'][0] in (['Name','Weight (%)'],['Country','Weight (%)'])]
        if not candidates: result['unavailable'].append(field+': no published equity allocation'); continue
        t = only(candidates, title)
        dates = re.findall(r'\d{2}/\d{2}/\d{4}', t['context'])
        # Country allocation shares the dated holdings section on this issuer page.
        allocation_stamp = document_date(dates[-1],now) if dates else stamp
        rows = [r for r in t['rows'][1:] if r[0] != 'Remaining Portfolio']
        result[field] = composition(rows, allocation_stamp, share, digest, complete=field!='holdings')
    result['unavailable'].append('performance: HTML calendar series not published; prior exact-share history preserved')
    return result


def globalx(text, share, now):
    page=Page(text); tokens=page.tokens
    start=tokens.index('Key Information'); end=tokens.index('Distributions',start)
    block='\n'.join(tokens[start:end])
    if only(re.findall(r'Primary ISIN\n([A-Z0-9]{12})',block),'Global X ISIN') != share['isin']:
        reject('Wrong Global X exact share')
    stamp=document_date(only(re.findall(r'As of (\d+ [A-Za-z]+ \d{4})',block),'Global X date'),now)
    ter=float(only(re.findall(r'Total Expense Ratio\n([\d.]+)\n%',block),'Global X fee'))
    if not 0<=ter<=5:reject('Invalid Global X expenses')
    amount,currency=money(only(re.findall(r'Fund AUM\n([^\n]+)',block),'Global X AUM'))
    if share['currency']!='USD' or currency!='USD':reject('Wrong Global X USD share convention')
    digest=proof(text.encode());result=base(share,stamp,digest);result['characteristics']['terPct']=ter
    result['aum']={'amount':amount,'currency':currency,'scope':'fund','asOf':stamp,'sourceUrl':share['sourceUrl'],'sha256':digest}
    result['unavailable'] += ['performance: no full 2020–2025 history','exposures: reference index and substitution basket require separate validation']
    return result


def bitwise(text, share, now):
    page=Page(text);block='\n'.join(page.tokens)
    if share['currency']!='USD' or re.search(r'ISIN\n'+re.escape(share['isin'])+r'\n',block) is None or 'Price Reference Currency\nUSD' not in block:
        reject('Wrong Bitwise exact share/currency')
    stamp=dt.datetime.strptime(only(re.findall(r'Data as of\n(\d{2}-\d{2}-\d{4})',block),'Bitwise date'),'%d-%m-%Y').date().isoformat()
    document_date(stamp,now)
    ter=float(only(re.findall(r'TER\n([\d.]+)% p.a.',block),'Bitwise TER'))
    if not 0<=ter<=5:reject('Invalid Bitwise TER')
    amount,currency=money(only(re.findall(r'AUM market value \(USD\)\n([^\n]+)',block),'Bitwise AUM'))
    digest=proof(text.encode());result=base(share,stamp,digest);result['characteristics']['terPct']=ter
    result['aum']={'amount':amount,'currency':currency,'scope':'share-class','asOf':stamp,'sourceUrl':share['sourceUrl'],'sha256':digest}
    # Launch in June 2020: its partial-year return cannot replace a full-year proxy.
    result['unavailable'] += ['performance: 2020 is a partial launch year; full-year simulation proxy preserved','exposures: single crypto asset, no equity countries/sectors']
    return result


def collect_one(share, now):
    if share['parser']=='wisdomtree-html':
        opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        def open_page(request, **kwargs):
            # Same public-page headers used by the qualified legacy iShares collector.
            request.add_header('User-Agent','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
            request.add_header('Accept-Language','en-GB,en;q=0.9')
            return opener.open(request, **kwargs)
        try:
            text=get_text(share['sourceUrl'],('text/html',),12_000_000,opener=open_page)
        except (urllib.error.URLError,TimeoutError):
            body=download(share['factsheetUrl'],headers={'User-Agent':'Mozilla/5.0','Accept':'application/pdf'})
            return wisdomtree_factsheet(body,share,now)
    else:
        text=download(share['sourceUrl'], max_bytes=12_000_000).decode('utf-8')
    result = {'wisdomtree-html':wisdomtree,'globalx-html':globalx,'bitwise-html':bitwise}[share['parser']](text,share,now)
    if share['parser'] == 'wisdomtree-html':
        try:
            body=download(share['factsheetUrl'],headers={'User-Agent':'Mozilla/5.0','Accept':'application/pdf'})
        except (urllib.error.URLError, TimeoutError) as error:
            # Independently dated HTML AUM/fees remain valid even when the
            # calendar PDF is temporarily unavailable. Keep the failure visible.
            result['collectionErrors'] = [{'field':'performance', 'url':share['factsheetUrl'], 'reason':str(error)}]
            return result
        document=wisdomtree_factsheet(body,share,now)
        if document.get('performance'):
            result['performance']=document['performance']
            result['unavailable']=[item for item in result['unavailable'] if not item.startswith('performance:')]
    return result


def wisdomtree_factsheet(body, share, now):
    """Transport fallback: current official PDF, never a re-dated cached HTML page."""
    from issuer_documents import pdf_text, bounded_return
    from collect_document_etf import parse as document_parse
    from urllib.parse import urlparse
    url=share['factsheetUrl'];parsed=urlparse(url)
    if parsed.scheme!='https' or parsed.netloc!='dataspanapi.wisdomtree.com' or not parsed.path.startswith('/pdr/documents/FACTSHEET/') or not parsed.path.endswith('/'+share['isin']):
        reject('Unexpected WisdomTree official factsheet URL')
    text=pdf_text(body);dates=re.findall(r'Document Date:\s*(\d{2}/\d{2}/\d{4})',text)
    stamp=document_date(only(dates,'WisdomTree factsheet date'),now)
    share={**share,'sourceUrl':url};digest=proof(body)
    if share['documentType']=='wisdomtree':
        result=document_parse(text,share,now)
        swap=re.findall(r'Annual Swap Rate\s+([\d.]+)%',text)
        if swap:result['characteristics']['annualSwapRatePct']=float(only(swap,'swap rate'))
    else:
        currency=only(re.findall(r'Base Currency\s+([A-Z]{3})\s*$',text,re.M),'factsheet currency')
        if currency!=share['currency'] or share['isin'] not in text or share['documentName'] not in ' '.join(text.split()):
            reject('Wrong WisdomTree UCITS exact share/currency')
        ter=float(only(re.findall(r'Total Expense Ratio\s+([\d.]+)%',text),'factsheet TER'))
        if not 0<=ter<=5:reject('Invalid WisdomTree TER')
        result=base(share,stamp,digest);result['characteristics']['terPct']=ter
        if 'Calendar Year Performance (Net of fees)' in text:
            block=text.split('Calendar Year Performance (Net of fees)',1)[1].split('Rolling 12-month',1)[0]
            chunks=[c.strip()for c in re.split(r'\n\s*\n',block)if c.strip()]
            years=re.findall(r'\b(20\d{2})\b',chunks[0]);row=chunks[1]
            values=re.findall(r'(-?[\d.]+)%',row)
            label=' '.join(re.sub(r'-?[\d.]+%','',row).split())
            if label!=share['documentName'] or len(values)!=len(years) or len(set(years))!=len(years) or any(int(y)>=now.year for y in years):
                reject('WisdomTree fund calendar row/columns mismatch')
            launch=dt.datetime.strptime(only(re.findall(r'Inception Date\s+(\d{2}/\d{2}/\d{4})',text),'inception date'),'%d/%m/%Y').date()
            result['performance']={'currency':currency,'basis':'fund','years':{y:bounded_return(float(v))for y,v in zip(years,values)if launch<=dt.date(int(y),1,1)},'method':'calendar-year exact-share NAV return, net of fees'}
    result['characteristics'].update(asOf=stamp,sourceUrl=url,sha256=digest)
    if 'performance'in result:result['performance'].update(asOf=stamp,sourceUrl=url,sha256=digest)
    if share['documentType'] == 'wisdomtree-ucits':
        from collect_wisdomtree_allocations import allocations
        result.update(allocations(body, stamp, url, digest))
        if 'countries' not in result:
            result['unavailable'].append('countries: PDF publishes only ten countries; complete previous allocation preserved')
    result['unavailable'].append('HTML unavailable: current official PDF used; AUM not published, previous dated value preserved')
    return result
