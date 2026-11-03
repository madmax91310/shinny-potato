"""Reporting-only reconstruction of the actual public source blobs; no working data changes."""
import pathlib,json,gzip,subprocess,hashlib,urllib.request,datetime,sys,shutil,os
r=pathlib.Path('/dev/shm/data-automation-20261028');repo=r/'bnp';public=r/'public';overlay=r/'published-source-overlay';out=r/'matrix-final-30oct';out.mkdir(exist_ok=True)
def read(name):
 p=public/name
 return p.read_bytes()if p.exists()else gzip.decompress((public/(name+'.gz')).read_bytes())
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
manifest=json.loads(read('publication-manifest.json'));version=json.loads(read('build-info.json'));entries=[]
url='https://madmax91310.github.io/shinny-potato/data/data-automation-inventory.json?matrix30oct='+datetime.datetime.now(datetime.timezone.utc).isoformat()
b=urllib.request.urlopen(urllib.request.Request(url,headers={'Cache-Control':'no-cache'}),timeout=120).read();assert blob(b)==manifest['files']['public/data/data-automation-inventory.json'],'Public inventory changed; recapture required'
(public/'data-automation-inventory.json.gz').write_bytes(gzip.compress(b));inventory=r/'tmp/current-public-inventory-30oct.json';inventory.write_bytes(b)
for name,sha in manifest['files'].items():
 if not name.endswith('.json')or(name.startswith('public/data/')and not name.startswith('public/data/investors/')):continue
 target=overlay/name;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists()and blob(target.read_bytes())==sha:entries.append({'path':name,'sha':sha,'verified':True});continue
 if target.is_symlink():target.unlink()
 try:
  raw=subprocess.check_output(['git','cat-file','blob',sha],cwd=repo,stderr=subprocess.DEVNULL);assert blob(raw)==sha;target.write_bytes(raw);entries.append({'path':name,'sha':sha,'verified':True})
 except(subprocess.CalledProcessError,AssertionError):
  target.unlink(missing_ok=True);entries.append({'path':name,'sha':sha,'verified':False})
receipt={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'version':version,'inventoryBlob':blob(b),'inputFiles':entries,'noWorkingDataModified':True};(out/'published-inputs.json').write_text(json.dumps(receipt,indent=2))
subprocess.run([sys.executable,str(r/'reconstruct-final-public-projections-30oct.py')],check=True,cwd=repo,stdout=subprocess.DEVNULL)
for entry in entries:
 target=overlay/entry['path']
 entry['verified']=target.exists() and blob(target.read_bytes())==entry['sha']
receipt['inputFiles']=entries;receipt['allInputsMatched']=all(x['verified']for x in entries);(out/'published-inputs.json').write_text(json.dumps(receipt,indent=2))
monitor=r/'tmp/current-public-monitor-30oct.json';manifestfile=r/'tmp/current-public-manifest-30oct.json';buildfile=r/'tmp/current-public-build-30oct.json'
try:
 monitor.write_bytes(read('automation-status.json'));manifestfile.write_bytes(read('publication-manifest.json'));buildfile.write_bytes(read('build-info.json'))
 subprocess.run([sys.executable,str(repo/'scripts/build_data_use_matrix.py'),'--inventory',str(inventory),'--monitor',str(monitor),'--manifest',str(manifestfile),'--publication',str(buildfile),'--source-root',str(overlay),'--output',str(out)],cwd=repo,check=True)
 for name in ['matrice-donnees-usages.csv','chaines-donnees.csv','collectes-controles.csv']:
  with(out/name).open('rb')as f,gzip.open(out/(name+'.gz'),'wb')as g:shutil.copyfileobj(f,g)
  (out/name).unlink()
 summary=json.loads((out/'matrice-bilan.json').read_text());summary['generatorCommit']=summary.pop('sourceCommit');summary['sourceCommit']=version['sha'];summary['publishedVersion']=version;summary['inputVerificationReceipt']='published-inputs.json';(out/'matrice-bilan.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
finally:
 for p in [monitor,inventory,manifestfile,buildfile]:p.unlink(missing_ok=True)
print('Exact public source blobs',sum(x['verified']for x in entries),'/',len(entries))
