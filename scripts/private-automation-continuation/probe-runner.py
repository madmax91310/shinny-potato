import base64,datetime,gzip,json,os,pathlib,shutil,subprocess,urllib.request
ROOT=pathlib.Path.cwd();TEMP=pathlib.Path(os.environ['RUNNER_TEMP']);OUT=pathlib.Path(os.environ['RECIPE_OUTPUT']);OUT.mkdir(exist_ok=True,parents=True);API='https://api.github.com/repos/madmax91310/shinny-potato';RUN=42973671232;HEAD='a54836c1df08aca0290027becb2ed35c0bad0c2b';BRANCH='reports/consolidated-automation-evidence-20261106';FOLDER='reports/donnees-consolidees-2026-10-24/reprise-2026-11-10/livraison/preuves/dws-iues-candidat-2026-11-11'
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
def api(path):return json.load(urllib.request.urlopen(urllib.request.Request(API+path,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'User-Agent':'EpargnantLibre-native-proof/1.0'}),timeout=90))
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2))
plan=json.loads((ROOT/'scripts/private-automation-continuation/metadata-candidate-plan.json').read_text());save('verification-plan.json',plan);source=api('/actions/runs/'+str(RUN));assert source['head_sha']==HEAD;save('ordinary-candidate-source-run.json',source);save('ordinary-candidate-jobs.json',api('/actions/runs/'+str(RUN)+'/jobs?per_page=100'));save('ordinary-candidate-artifacts.json',api('/actions/runs/'+str(RUN)+'/artifacts?per_page=100'))
def download(name):
 p=TEMP/name;p.mkdir();r=subprocess.run(['gh','run','download',str(RUN),'-R','madmax91310/shinny-potato','-n',name,'-D',str(p)],capture_output=True,text=True)
 if r.returncode:raise RuntimeError('Artifact unavailable: '+name+'; signed transport details withheld')
 return p
scope_dir=download('metadata-declared-evidence-scope');scope_path=next(scope_dir.rglob('metadata-evidence-scope.json'));save('original-declared-evidence-scope.json',json.loads(scope_path.read_text()))
manifest_dir=download('exact-share-metadata-source-evidence');manifest_path=next(manifest_dir.rglob('manifest.json'));manifest=json.loads(manifest_path.read_text());(OUT/'original-probe-manifest.json.gz').write_bytes(gzip.compress(manifest_path.read_bytes()));records_dir=download('metadata-qualified-records');records_path=next(records_dir.rglob('automated-instrument-metadata.json'));records=json.loads(records_path.read_text());by={r['isin']:r for r in manifest['instruments']};targets=plan['instruments'];rows=[];wanted={}
for target in targets:
 isin=target['isin'];r=by[isin];field=r['values'].get('listings');fresh=bool(field and field['checkedAt']=='2026-11-11'and field['value']);documents=[]
 if field:
  hashes={field['sha256']}|{x['sha256']for x in field['value']}
  documents=[d for d in r['documents']if d['sha256']in hashes or(isin=='IE00B42NKQ00'and'www.blackrock.com/varnish-api/'in d['sourceUrl'])]
  for d in documents:wanted[d['file']]=d
 rows.append({'isin':isin,'freshField':fresh,'sourceCheckStartedAt':r['checkedAt'],'observedListingField':field,'requiredHistoricalQuotes':target['requiredHistoricalQuotes'],'requiredQuoteDetails':target['requiredQuoteDetails'],'sourceErrorsPreserved':r['errors'],'matchingRawDocuments':documents,'registeredListingField':records.get(isin,{}).get('listings'),'scope':'Actual newly observed listing field, distinct from retained rows, prices/NAV and other metadata fields.'})
(OUT/'raw').mkdir()
for shard in range(4):
 d=download('metadata-raw-sources-'+str(shard))
 for name,meta in wanted.items():
  files=list(d.rglob(name))
  if not files:continue
  assert len(files)==1
  import hashlib
  raw=files[0].read_bytes();assert hashlib.sha256(raw).hexdigest()==meta['sha256'];(OUT/'raw'/(name+'.gz')).write_bytes(gzip.compress(raw))
assert all((OUT/'raw'/(name+'.gz')).exists()for name in wanted)
run('git','fetch','--depth=1','origin',HEAD,stdout=subprocess.DEVNULL);run('git','checkout','--detach',HEAD);shutil.copyfile(records_path,ROOT/'src/data/automated-instrument-metadata.json');script=ROOT/'scripts/probe-candidate-listing-projection.mjs';script.write_text("import{writeFileSync}from'node:fs';import{REFRESHED_LISTINGS,officialListingSource}from'../src/data/qualified-listings.js';const ids="+json.dumps([r['isin']for r in targets])+";writeFileSync(process.env.RECIPE_OUTPUT+'/consumer-listing-projection.json',JSON.stringify(Object.fromEntries(ids.map(i=>[i,(REFRESHED_LISTINGS[i]??[]).map(r=>({...r,official:officialListingSource(r)}))])),null,2));")
run('node',str(script));projected=json.loads((OUT/'consumer-listing-projection.json').read_text())
for row in rows:
 row['requiredQuoteChecks']=[{'evidenceId':q['evidenceId'],'expectedSymbol':q['symbol'],'freshInSharedConsumer':any(r.get('evidenceId')==q['evidenceId']and r.get('symbol')==q['symbol']and r.get('checkedAt')=='2026-11-11'and r['official']for r in projected[row['isin']])}for q in row['requiredQuoteDetails']]
save('nineteen-observed-listing-fields.json',{'run':RUN,'head':HEAD,'verificationSubsetCount':len(rows),'actualFullProbeCount':len(manifest['instruments']),'freshFields':sum(r['freshField']for r in rows),'rows':rows,'meaning':'Candidate execution only, not production recording/publication; subset declared from the initial failures, original full-source scope is not rewritten. An old venue row is not renewed by its containing field.'})
a=TEMP/'metadata-candidate-archive';run('git','clone','--single-branch','--depth=1','--branch',BRANCH,'https://github.com/madmax91310/shinny-potato.git',str(a),stdout=subprocess.DEVNULL);shutil.copytree(OUT,a/FOLDER,dirs_exist_ok=True);run('git','-C',str(a),'config','user.name','github-actions[bot]');run('git','-C',str(a),'config','user.email','41898282+github-actions[bot]@users.noreply.github.com');run('git','-C',str(a),'add','--',FOLDER);run('git','-C',str(a),'commit','-m','Archive individual DWS and IUES candidate source and shared-consumer proofs')
auth=base64.b64encode(('x-access-token:'+os.environ['GH_TOKEN']).encode()).decode();env=os.environ.copy();env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+auth)
try:run('git','-C',str(a),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
except subprocess.CalledProcessError:run('git','-C',str(a),'fetch','origin',BRANCH);run('git','-C',str(a),'rebase','origin/'+BRANCH);run('git','-C',str(a),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
assert all(r['freshField']and all(q['freshInSharedConsumer']for q in r['requiredQuoteChecks'])for r in rows),'Individual missing fields or consumed quote evidence retained explicitly; no blanket qualification'
print('CANDIDATE_LISTING_PROOF_ARCHIVED',len(rows),flush=True)
