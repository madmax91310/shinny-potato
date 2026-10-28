"""Official historical XLSX export, discovered in EUHistoricalDataExportSection.

This transport is distinct from the NAV-modal JSON endpoint. A successful POST
alone does not qualify the product, its income treatment, or any consumer.
"""
import json,urllib.request,urllib.error,re
import base64,pathlib,subprocess
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

def download_with_identity(url,data,source_url):
 """A normal browser may initialise the public publisher session after a 403.

 Both responses remain fresh source observations. Browser failure stays failure;
 no cache, previously archived workbook or other host is used as a fallback.
 """
 try:return download(url,data),None,'official-xlsx-post'
 except urllib.error.HTTPError as error:
  if error.code!=403:raise
 script=pathlib.Path(__file__).with_name('download-wisdomtree-history.mjs')
 result=subprocess.run(['node',str(script),url,source_url,json.dumps(data)],capture_output=True,timeout=85)
 if result.returncode:raise ValueError('Official same-origin browser export failed: '+result.stderr.decode(errors='replace')[-1500:])
 if len(result.stdout)>14_000_000:raise ValueError('Official browser response exceeds bound')
 result=json.loads(result.stdout)
 if result['status']!=200 or result['url']!=url or result['identityUrl']!=source_url:raise ValueError('Official browser source binding changed')
 body=base64.b64decode(result['body'],validate=True);identity=base64.b64decode(result['identityBody'],validate=True)
 if len(body)>2_000_000 or len(identity)>8_000_000:raise ValueError('Official browser response exceeds bound')
 return body,identity,'publisher-same-origin-browser-export'


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

def qualify_return_windows(nav,performance,source,now):
 """Keep each corroborated calendar; refuse overlapping uncorroborated returns.

 No value or tolerance is changed. A refusal names a return interval (start,end],
 not a corrupt price point shared with the independently checked following year.
 """
 from issuer_nav_history import calendar_checks,calendar_boundaries
 checks=[];restrictions=[]
 for year,value in sorted(performance['years'].items()):
  year=int(year)
  if year>=now.year or f'{year-1}-12'<source['periodStart']:continue
  start,end=calendar_boundaries(nav,year)  # Missing bounds fail, never become a numeric disagreement.
  try:checks.extend(calendar_checks(nav,{str(year):value},2,now))
  except ValueError as error:
   if not str(error).startswith('Official daily/annual convention disagreement:'):raise
   actual=(nav[end]/nav[start]-1)*100
   restrictions.append({'start':f'{year-1}-12','end':f'{year}-12','year':year,'reason':f"NAV quotidiennes et calendrier officiel non rapprochés pour {year} : {actual:.8f} % / {value} %. Convention de rendement de cette fenêtre non qualifiée ; les fenêtres indépendamment corroborées sont conservées.",'dailyDerived':actual,'published':value,'differencePp':actual-value,'startDate':start,'endDate':end,'startValue':nav[start],'endValue':nav[end],'currency':source['navCurrency']})
 required=set(source['requiredQualifiedCalendarYears'])
 if not required or not required.issubset({c['year']for c in checks}):raise ValueError('Requested independent return windows not qualified')
 return checks,restrictions
