import json,pathlib,subprocess,urllib.request,datetime,time,decimal,re,hashlib
R=pathlib.Path('/tmp/automation-20261106');o=R/'proofs/ngas-other-public';j=json.load(open(o/'proof.json'));D=decimal.Decimal;decimal.getcontext().prec=45;base='https://madmax91310.github.io/shinny-potato/';suffix='?ngas-oracle='+str(time.time_ns());build=json.load(urllib.request.urlopen(base+'build-info.json'+suffix,timeout=30));assert all(r['before']==build==r['after']for r in j['results']);m=json.load(urllib.request.urlopen(base+'data/publication-manifest.json'+suffix,timeout=30));records={};blobs={}
for name in ['automated-etf-monthly.json','automated-monthly.json','monthly-fx.json']:
 blob=m['files']['src/data/'+name];raw=subprocess.check_output(['git','cat-file','blob',blob],cwd=R/'repo');assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob;blobs[name]=blob;data=json.loads(raw)
 if name=='monthly-fx.json':fx=data['months']
 else:records.update(data)
points={k:{m:D(str(v))for m,v in records[k]['points']}for k in ['etc_natural_gasNav','apple']};assert points['etc_natural_gasNav']['2026-10']==D('4.21602288')
def rate(id,month,currency):return D(1)if currency==records[id]['currency']else D(str(fx[month]['rates'][records[id]['currency']]))/D(str(fx[month]['rates'][currency]))
def value(id,month,currency):return points[id][month]/rate(id,month,currency)
def ret(id,start,end,currency):return (value(id,end,currency)/value(id,start,currency)-1)*100
def num(s):return D(s.replace('−','-').replace(',','.'))
def rounded(x,step):return x.quantize(D(step),rounding=decimal.ROUND_HALF_UP)
proof=[]
for r in j['results']:
 if r['route']=='performance':
  for year,shown in re.findall(r'(202[2-5]) : ([+−-]?\d+,\d) %',r['text']):
   expected=ret('etc_natural_gasNav',str(int(year)-1)+'-12',year+'-12','USD');assert rounded(expected,'.1')==num(shown);proof.append({'case':r['key'],'year':year,'currency':'USD','expectedPct':str(expected),'shownPct':str(num(shown))})
  shown=re.search(r'Sur toute la période : ([+−-]?\d+,\d) %',r['text'])[1];assert num(shown)==rounded(ret('etc_natural_gasNav','2021-12','2025-12','USD'),'.1')
 else:
  for label,id in [('Apple','apple'),('WisdomTree Natural Gas · VL','etc_natural_gasNav')]:
   line=next(l for l in r['text'].splitlines()if label in l);shown=re.search(r': ([+−-]?\d+,\d+) %',line)[1]
   expected=ret(id,'2026-09','2026-10','EUR')if r['route']=='comparison'else ((value(id,'2025-12','EUR')/value(id,'2021-12','EUR'))**(D(1)/4)-1)*100
   assert num(shown)==rounded(expected,'.01'),(id,expected,shown);proof.append({'case':r['key'],'id':id,'currency':'EUR','expectedPct':str(expected),'shownPct':str(num(shown))})
  if r['route']=='annual':
   cells=re.findall(r'(WisdomTree Natural Gas · VL|Apple)([+−-]?\d+,\d+) %',r['annual']);assert len(cells)==8,len(cells)
   for index,(label,shown)in enumerate(cells):
    year=2022+index%4;id='apple'if label=='Apple'else'etc_natural_gasNav';expected=ret(id,f'{year-1}-12',f'{year}-12','EUR');assert num(shown)==rounded(expected,'.1');proof.append({'case':r['key'],'id':id,'year':year,'currency':'EUR','expectedPct':str(expected),'shownPct':str(num(shown))})
(o/'independent-values.json').write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':build,'exactPublishedBlobs':blobs,'importsApplicationCalculationCode':False,'checks':proof,'annual2026NotAdmitted':True},indent=2));print(len(proof),'independent public NGAS/performance/ranking values verified')
