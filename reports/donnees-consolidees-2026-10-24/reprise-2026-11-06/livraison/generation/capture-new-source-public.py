import pathlib,json,urllib.request,subprocess,hashlib,datetime,time
R=pathlib.Path('/tmp/automation-20261106');repo=R/'repo';b='https://madmax91310.github.io/shinny-potato/';q='?source-proof='+str(time.time_ns())
build=json.load(urllib.request.urlopen(b+'build-info.json'+q));m=json.load(urllib.request.urlopen(b+'data/publication-manifest.json'+q));data={};blobs={}
for name in ['exposure-etf-expansion-records.json','dca-complete-holdings.json','automated-indices.json']:
 blob=m['files']['src/data/'+name];raw=subprocess.check_output(['git','cat-file','blob',blob],cwd=repo);assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob;data[name]=json.loads(raw);blobs[name]=blob
assert build==json.load(urllib.request.urlopen(b+'build-info.json'+q+'-after'))
context={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':build,'blobs':blobs,'stableBuild':True};target='IE00BMH5Y871';e=data['exposure-etf-expansion-records.json'][target];h=data['dca-complete-holdings.json'][target];r=data['automated-indices.json']['russell-1000']
assert e['holdings']['sha256']=='76879c3635a63dce8e744d27469b39dc5e5ad98ce6386fa733f7ec4c3c4136c5','Global X presentation still held'
assert h.get('settlementCashProof',{}).get('netCashWeightPct')==.204,'Global X complete portfolio still held'
assert r['facts']['asOf']=='2026-10-31'and dict(r['facts']['sectors'])['💻 Technologie']==40.51,'Russell October sectors still held'
for folder,record in [('globalx-ordinary-production',{'presentation':e,'holdings':h}),('russell-production',r)]:
 p=R/'proofs'/folder;(p/'publication.json').write_text(json.dumps({**context,'record':record},ensure_ascii=False,indent=2))
# Isolated browser oracles only. Never stage these generated private overlays.
for name,isin,row in [('exposure-etf-expansion-records.json',target,e),('dca-complete-holdings.json',target,h),('automated-indices.json','russell-1000',r)]:
 p=pathlib.Path('/dev/shm/automation-recovery-scope-20261106/src/data')/name;j=json.load(p.open());j[isin]=row;p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(context))
