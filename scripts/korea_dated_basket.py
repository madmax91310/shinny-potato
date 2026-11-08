"""Official date-selected HANARO creation basket, with server date and file cross-check.

No date is inferred from the classification request. The issuer's download name
must explicitly confirm it and both public formats must agree on every row.
"""
import io
import html
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, ROUND_HALF_UP
from email.message import Message
from urllib.parse import unquote_plus
from issuer_documents import download, document_date, proof

NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ROOT='https://www.hanaroetf.com'
CODE='CEBA1E927AC1478B'


def classification_date(raw, now):
    p=json.loads(raw)['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    value=str(p['asOfDate']['value'])
    if not re.fullmatch(r'20\d{6}',value):raise ValueError('Invalid classification observation date')
    return document_date(value[:4]+'-'+value[4:6]+'-'+value[6:],now)


def workbook_rows(raw):
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        if len(z.infolist())>30 or sum(i.file_size for i in z.infolist())>2_000_000:
            raise ValueError('Oversized HANARO basket workbook')
        if [p for p in z.namelist()if re.fullmatch(r'xl/worksheets/sheet\d+\.xml',p)]!=['xl/worksheets/sheet1.xml']:
            raise ValueError('Ambiguous HANARO basket worksheet')
        strings=[''.join(r.itertext()) for r in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS)]
        rows=[]
        for r in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:row',NS):
            cells=[]
            for i,c in enumerate(r.findall('s:c',NS)):
                if c.find('s:f',NS)is not None or re.sub(r'\d','',c.get('r',''))!=chr(65+i):
                    raise ValueError('Formula or shifted HANARO basket cell')
                kind=c.get('t');v=c.find('s:v',NS)
                if kind=='s':value=strings[int(v.text)]
                elif kind=='inlineStr':value=''.join(c.find('s:is',NS).itertext())
                elif kind in (None,'n'):value=v.text if v is not None else ''
                else:raise ValueError('Unknown HANARO basket cell type')
                cells.append(value)
            rows.append(cells)
    if len(rows)<13 or rows[1]!=['번호','종목코드','종목명','수량(주)','평가금액(원)','비중(%)']:
        raise ValueError('HANARO basket workbook columns changed')
    result=[]
    for row in rows[2:]:
        if len(row)!=6:raise ValueError('Truncated HANARO workbook row')
        numeric=[Decimal(row[i])for i in (0,3,4,5)]
        if any(not v.is_finite() or v<0 for v in numeric)or any(v!=v.to_integral_value() for v in numeric[:3]):
            raise ValueError('Invalid HANARO workbook value')
        result.append([str(int(numeric[0])),row[1],row[2],f'{int(numeric[1]):,}',f'{int(numeric[2]):,}',str(numeric[3].quantize(Decimal('.01'),rounding=ROUND_HALF_UP))])
    return result


def dated_portfolio(config, stamp, latest_stamp, now, parse_rows, fetch=download, fetch_export=None):
    if config['url']!=ROOT+'/fund/'+CODE or not stamp<latest_stamp:
        raise ValueError('Unsupported date-aligned physical basket')
    stamp=document_date(stamp,now)
    date=stamp.replace('-','.')
    fragment_url=f'{ROOT}/api/v1/fund/{CODE}/get-fund-holdings-list?baseDate={date}'
    export_url=f'{ROOT}/fund/pdfExcelDownload/{CODE}/{date}'
    fragment=fetch(fragment_url)
    raw,metadata=(fetch_export or (lambda u:download(u,return_metadata=True,max_bytes=2_000_000)))(export_url)
    message=Message();message['Content-Disposition']=metadata.get('headers',{}).get('Content-Disposition','')
    name=unquote_plus(message.get_filename() or '')
    if metadata.get('url')!=export_url or name!=f'HANARO MSCI KOREA TR_PDF_{date}.xlsx':
        raise ValueError('Issuer download does not confirm exact fund and requested basket date')
    text=fragment.decode('utf-8')
    counts=re.findall(r'<input\b[^>]*name="totalFundHoldingsListSize"\s+value="(\d+)"',text)
    if len(counts)!=1:raise ValueError('Missing dated portfolio count')
    cells=[[' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', c)).split()) for c in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>',r,re.S)]
           for r in re.findall(r'<tr\b[^>]*>(.*?)</tr>',text,re.S)]
    workbook=workbook_rows(raw)
    if len(cells)!=len(workbook):raise ValueError('Dated HTML/Excel portfolio counts differ')
    for a,b in zip(cells,workbook):
        if len(a)!=6 or a[:5]!=b[:5] or Decimal(a[5])!=Decimal(b[5]):
            raise ValueError('Dated HTML/Excel portfolio values differ')
    rows=parse_rows(text,int(counts[0]))
    return rows,{'sourceUrl':export_url,'sha256':proof(raw),'datedBasketProof':{
        'requestedAsOf':stamp,'serverFileName':name,'fragmentUrl':fragment_url,'fragmentSha256':proof(fragment),
        'latestPublisherAsOf':latest_stamp,'publicationPageUrl':config['url'],
        'method':'Same-date physical basket explicitly confirmed by issuer download filename and every HTML/Excel position; latest mismatched basket excluded'}}
