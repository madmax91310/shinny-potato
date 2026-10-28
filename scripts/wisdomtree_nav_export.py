"""Official historical XLSX export, discovered in EUHistoricalDataExportSection.

This transport is distinct from the NAV-modal JSON endpoint. A successful POST
alone does not qualify the product, its income treatment, or any consumer.
"""
import json,urllib.request,re
from issuer_nav_history import xlsx_rows,dated

def payload(source,now):
 return {'locale':'en-IE','productName':None,'fromDate':source['periodStart']+'-01','toDate':now.date().isoformat(),'includeNav':True,'includeAum':False}

def download(url,data):
 request=urllib.request.Request(url,data=json.dumps(data).encode(),headers={'User-Agent':'EpargnantLibre-Data/1.0','Content-Type':'application/json','Accept':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
 with urllib.request.urlopen(request,timeout=30)as response:
  if response.headers.get_content_type()!='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':raise ValueError('Expected official NAV workbook, not HTML or an anti-robot page')
  body=response.read(2_000_001)
  if len(body)>2_000_000:raise ValueError('NAV export exceeds bounded response size')
  return body

def parse(body,identity,source,now):
 rows=xlsx_rows(body);id=str(identity['wtClassID'])
 if id!=str(source['wisdomClassId'])or identity['ISIN']!=source['isin']or identity['fundCurrency']!=source['navCurrency']:
  raise ValueError('XLSX class ID is not bound to the exact official share/currency')
 if sum(r.get('B')==id and all(not v for k,v in r.items()if k!='B')for r in rows)!=1:
  raise ValueError('Wrong or ambiguous WisdomTree export class ID')
 if sum(r.get('B')=='Date'and r.get('C')=='NAV'for r in rows)!=1:raise ValueError('WisdomTree NAV export columns changed')
 if not any(r.get('B')=='* The NAV values presented below have been rounded to 5 decimal places.'for r in rows):raise ValueError('WisdomTree NAV export precision statement changed')
 selected=[(r['B'],r['C'])for r in rows if isinstance(r.get('B'),str)and re.fullmatch(r'\d{4}-\d{2}-\d{2}',r['B'])]
 points=dated(selected,now)
 if any(day<source['periodStart']+'-01'for day in points):raise ValueError('NAV export ignored requested window')
 return points
