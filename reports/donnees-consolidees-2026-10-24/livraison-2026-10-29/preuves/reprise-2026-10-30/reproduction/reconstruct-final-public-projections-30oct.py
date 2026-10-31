import pathlib,json,subprocess,hashlib,datetime,gzip
r=pathlib.Path('/dev/shm/data-automation-20261028');repo=r/'bnp';o=r/'published-source-overlay';version=json.loads((r/'public/build-info.json').read_bytes() if (r/'public/build-info.json').exists() else gzip.decompress((r/'public/build-info.json.gz').read_bytes()));manifest=json.loads((r/'public/publication-manifest.json').read_bytes() if (r/'public/publication-manifest.json').exists() else gzip.decompress((r/'public/publication-manifest.json.gz').read_bytes()))['files'];code=version['sha'];info=json.load(open(r/'matrix-final-30oct/published-inputs.json'));missing={x['path']for x in info['inputFiles']if not x['verified']}
def git(*a):return subprocess.check_output(['git',*a],cwd=repo)
def sha(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
paths=git('ls-tree','-r','--name-only',code).decode().splitlines()
count=0
for path in paths:
 if not(path.endswith(('.js','.mjs','.json'))and(path.startswith(('src/','scripts/'))or path=='package.json'))or path in manifest:continue
 p=o/path;p.parent.mkdir(parents=True,exist_ok=True);b=git('show',code+':'+path)
 if p.is_symlink():p.unlink()
 p.write_bytes(b);count+=1
(o/'docs').mkdir(exist_ok=True)
outputs=['src/data/equity-history-links.json','src/data/ranking-index-annual.json','src/data/ranking-annual.json','src/data/tool-links.json','src/pages/dca-profiles/catalog.json','src/pages/dca-profiles/exposures.json',*[f'src/pages/dca-profiles/exposures-extra-{i}.json'for i in range(3)],'src/pages/dca-profiles/holdings.json','src/pages/dca-profiles/holdings-manifest.json',*[f'src/pages/dca-profiles/holdings-{i}.json'for i in range(32)]]
for path in outputs:
 p=o/path
 if p.is_symlink():
  b=p.read_bytes();p.unlink();p.write_bytes(b)
for script in ['build-equity-history-links.mjs','build-ranking-annual.mjs','build-tool-links.mjs','build-dca-exposures.mjs']:
 subprocess.run(['node',str(o/'scripts'/script)],cwd=o,check=True,stdout=subprocess.DEVNULL)
checks=[{'path':p,'expected':manifest[p],'actual':sha((o/p).read_bytes()),'matches':sha((o/p).read_bytes())==manifest[p]}for p in sorted(set(outputs)&manifest.keys())]
receipt={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'code':code,'data':version.get('dataSha'),'codeFiles':count,'projections':checks,'allMatched':all(x['matches']for x in checks),'noWorkingDataModified':True};(r/'proofs-29oct/published-derived-json-reconstruction-final-30oct.json').write_text(json.dumps(receipt,indent=2));print(receipt)
assert receipt['allMatched'],'Unmatched projections remain unverified, not fabricated'
