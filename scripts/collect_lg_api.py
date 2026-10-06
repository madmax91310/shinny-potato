"""L&G public fund-centre schema, calendar years and current exact-share factsheets."""
import json
import re
from urllib.parse import urlparse
from issuer_documents import download, document_date, proof, pdf_text, bounded_return, validated_rows
from data_automation import reject, number


def decode(fields, values):
    keys=[f['code_name'] for f in fields]
    if len(keys)!=len(values) or len(set(keys))!=len(keys):reject('L&G schema/row mismatch')
    return dict(zip(keys, values))


def parse(payload, share, now, digest):
    meta=payload['metadata'];matches=[]
    for f in payload['funds']:
        fund=decode(meta['fund_fields'],f['data'])
        for s in f['share_classes']:
            data=decode(meta['share_class_fields'],s['data'])
            if data['shareclassISIN']==share['isin']:matches.append((fund,data))
    if len(matches)!=1:reject('Missing or duplicate L&G exact ISIN')
    fund,data=matches[0]
    if data['shareclassCurrency']!=share['currency'] or fund['baseCurrency']!=share['currency'] or data['shortName']!='USD Acc':
        reject('Wrong L&G share currency/distribution')
    stamp=document_date(meta['as_at_date'],now)
    ter=float(data['ter'])
    if not 0<=ter<=5:reject('Invalid L&G TER')
    result={**share,'productId':share['isin'],'characteristics':{'terPct':ter,'asOf':stamp,'sourceUrl':share['sourceUrl'],'sha256':digest},'unavailable':[]}
    amount=number(float(data['netAssetValueFund']));assets_stamp=document_date(data['netAssetValueFund__date'],now)
    if amount<=0:reject('Invalid L&G fund assets')
    result['aum']={'amount':amount,'currency':fund['baseCurrency'],'scope':'fund','asOf':assets_stamp,'sourceUrl':share['sourceUrl'],'sha256':digest}
    year_end=meta['year_end_date']
    if not re.fullmatch(r'20\d{2}-12-31',year_end) or int(year_end[:4])>=now.year:reject('Unfinished L&G calendar year')
    launch=data['launchDate'];last=int(year_end[:4]);years={}
    for offset in range(1,11):
        y=last-offset+1;value=data.get(f'cal{offset}y')
        if value is not None and launch<=f'{y}-01-01' and y>=2020:years[str(y)]=bounded_return(float(value))
    if any(str(y) not in years for y in range(2020,2026)):
        result['unavailable'].append('performance: incomplete 2020–2025 calendar window; existing simulation proxy preserved')
    result['performance']={'currency':share['currency'],'basis':'fund','years':years,'asOf':stamp,
                          'method':'calendar-year exact-share NAV total return, net income reinvested, net of fees',
                          'sourceUrl':share['sourceUrl'],'sha256':digest}
    docs=data['factSheet']
    if len(docs)!=1 or docs[0][2]!='English':reject('Ambiguous L&G current factsheet')
    url=docs[0][0];parsed=urlparse(url)
    if parsed.scheme!='https' or parsed.netloc!='fundcentres.landg.com' or not parsed.path.startswith('/srp/documents-id/') or not parsed.path.endswith('.pdf'):
        reject('Unexpected L&G factsheet source')
    document_date(docs[0][3],now)
    result['factsheetUrl']=url
    return result


def parse_exposure(body, share, now, url):
    text=pdf_text(body)
    if share['isin'] not in text or 'USD Accumulating ETF Class' not in text or 'Index breakdown' not in text or 'The breakdowns below relate to the Index.' not in text:
        reject('Wrong L&G factsheet identity/exposure scope')
    dates=re.findall(r'(\d+ [A-Za-z]+ 20\d{2}) Fact Sheet',text)
    if len(dates)!=1:reject('Missing L&G exposure snapshot')
    stamp=document_date(dates[0],now);digest=proof(body)
    # Crop the three labelled columns; do not read chart percentages or currencies.
    left=pdf_text(body,(0,195));middle=pdf_text(body,(195,195));right=pdf_text(body,(390,210))
    def rows(block):
        output=[]
        for line in block.splitlines():
            m=re.match(r'\s*(?:l |[\U0001F1E6-\U0001F1FF\U0001F310]+ )?([A-Za-z][A-Za-z &.,()\-/]+?)\s{2,}(\d+\.\d+)\s*$',line)
            if m:output.append({'name':m[1].strip(),'weightPct':float(m[2])})
        return output
    sections={
      'countries':rows(left.split('Country (%)',1)[1].split('Index description',1)[0]),
      'sectors':rows(middle.split('Sector (%)',1)[1].split('Index description',1)[0]),
      'holdings':rows(right.split('Top 10 constituents (%)',1)[1].split('Index fund',1)[0])}
    if len(sections['holdings'])!=10:reject('L&G top ten incomplete')
    return {field:{'rows':validated_rows(value,field!='holdings'),'asOf':stamp,'basis':'index',
                   'sourceUrl':url,'sha256':digest}for field,value in sections.items()}


def collect_one(share,now):
    body=download(share['sourceUrl']);result=parse(json.loads(body),share,now,proof(body))
    url=result.pop('factsheetUrl')
    # A failed exact-share composition is visible rather than silently recertified.
    result.update(parse_exposure(download(url),share,now,url))
    return result
