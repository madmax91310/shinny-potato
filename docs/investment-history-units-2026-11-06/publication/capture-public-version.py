import datetime, hashlib, json, pathlib, re, subprocess, urllib.request, time

root=pathlib.Path('/workspace/evidence/publication-final/public-version')
root.mkdir(parents=True,exist_ok=True)
base='https://madmax91310.github.io/shinny-potato/'
def fetch(path):
    req=urllib.request.Request(base+path,headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=45) as response:
        body=response.read()
        return body,{'url':response.url,'status':response.status,'headers':dict(response.headers),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)}

receipt={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'resources':[]}
info,meta=fetch('build-info.json?audit='+str(time.time_ns()))
root.joinpath('build-info.json').write_bytes(info);receipt['resources'].append(meta)
version=json.loads(info);receipt['version']=version
assert 'sha' in version
subprocess.run(['git','fetch','origin','master'],cwd='/workspace/filtered',check=True,capture_output=True)
subprocess.run(['git','merge-base','--is-ancestor','fa930db1a89fb36cca3bcacef901012544d7ac46',version['sha']],cwd='/workspace/filtered',check=True)
receipt['containsMergedFix']=True
index,meta=fetch('?audit='+str(time.time_ns()));root.joinpath('index.html').write_bytes(index);receipt['resources'].append(meta)
manifest,meta=fetch('data/publication-manifest.json?audit='+str(time.time_ns()))
root.joinpath('publication-manifest.json').write_bytes(manifest);receipt['resources'].append(meta)
receipt['sourceBindings']=[]
for path in ['src/data/automated-etf-monthly.json','scripts/refresh_monthly_history.py','scripts/qualified_history_units.py','scripts/qualified_split_comparison.py','scripts/qualify_anniversary_price_units.py']:
    claimed=json.loads(manifest)['files'].get(path)
    gitblob=subprocess.check_output(['git','rev-parse',version.get('dataSha',version['sha'])+':'+path],cwd='/workspace/filtered',text=True).strip()
    if claimed is not None: assert claimed==gitblob,path+' differs from source snapshot'
    receipt['sourceBindings'].append({'path':path,'manifestBlob':claimed,'snapshotBlob':gitblob,'presentInManifest':claimed is not None})
for path in sorted(set(re.findall(r'(?:src|href)="(/shinny-potato/assets/[^"?#]+)"',index.decode()))):
    data,meta=fetch(path.removeprefix('/shinny-potato/'));root.joinpath(path.rsplit('/',1)[-1]).write_bytes(data);receipt['resources'].append(meta)
after,_=fetch('build-info.json?audit='+str(time.time_ns()));assert json.loads(after)==version,'Public version changed during capture'
root.joinpath('receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'version':version,'containsMergedFix':True,'resources':len(receipt['resources'])},indent=2))
