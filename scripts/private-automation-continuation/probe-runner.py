import base64,datetime,gzip,hashlib,json,os,pathlib,shutil,subprocess,time,urllib.request
ROOT=pathlib.Path.cwd();TEMP=pathlib.Path(os.environ['RUNNER_TEMP']);OUT=pathlib.Path(os.environ['RECIPE_OUTPUT']);OUT.mkdir(parents=True,exist_ok=True)
EXPECTED='c6d56dbb0a63269342c73e4464280979bf9660fa';BASE='https://madmax91310.github.io/shinny-potato/';API='https://api.github.com/repos/madmax91310/shinny-potato';BRANCH='reports/consolidated-automation-evidence-20261106';FOLDER='reports/donnees-consolidees-2026-10-24/reprise-2026-11-10/livraison/preuves/vaneck-production-2026-11-11'
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def read(u,auth=False):
 h={'Cache-Control':'no-cache','User-Agent':'EpargnantLibre-production-proof/1.0'}
 if auth:h['Authorization']='Bearer '+os.environ['GH_TOKEN']
 for attempt in range(4):
  try:return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=h),timeout=90))
  except urllib.error.HTTPError as e:
   if e.code not in (429,502,503,504)or attempt==3:raise
   delay=int(e.headers.get('Retry-After','10'));print('PUBLIC_READ_RETRY',e.code,attempt+1,flush=True);time.sleep(max(1,delay))
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
save('verification-plan.json',{'declaredAt':datetime.datetime.now(datetime.UTC).isoformat(),'expectedCode':EXPECTED,'instruments':['IE00BMC38736','IE0003UVYC20'],'fields':['source/record/publication identities','presentation and permitted DCA/overlap capabilities'],'mode':'Read-only; no issuer request, register change, fault injection or forced deployment'})
deadline=time.monotonic()+5700
while True:
 b=read(BASE+'build-info.json')
 if b.get('sha')==EXPECTED:break
 if time.monotonic()>deadline:raise RuntimeError('Ordinary code publication not observed; no production claim')
 print('WAITING_ORDINARY_PUBLICATION',b.get('sha'),flush=True);time.sleep(45)
data=b.get('dataSha')or b['sha'];m=read(BASE+'data/publication-manifest.json');save('public-build-info.json',b);save('publication-manifest.json',m)
run('git','fetch','--depth=1','origin',data,stdout=subprocess.DEVNULL);run('git','checkout','--detach',data)
helper=git('rev-parse','HEAD:scripts/vaneck-document.mjs');assert helper=='ca61be9ca7aa9e9b17b7c9c869af79a2f23b2211'
p='src/data/exposure-etf-expansion-records.json';blob=git('rev-parse','HEAD:'+p);assert m['files'][p]==blob
save('source-record-adoption.json',{'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'public':b,'path':p,'sourceBlob':blob,'helperBlob':helper,'instrument':'IE00BMC38736','record':json.loads((ROOT/p).read_text())['IE00BMC38736']})
runs=read(API+'/actions/runs?branch=master&per_page=100',True)['workflow_runs'];rs=[r for r in runs if r['head_sha']==EXPECTED and r.get('event')=='push'and r.get('path')=='.github/workflows/update-exposure-expansion.yml'];assert len(rs)==1
r=rs[0];save('ordinary-source-run.json',r);rid=str(r['id']);save('ordinary-source-jobs.json',read(API+'/actions/runs/'+rid+'/jobs?per_page=100',True));save('ordinary-source-artifacts.json',read(API+'/actions/runs/'+rid+'/artifacts?per_page=100',True))
t=OUT/'producer-contract';t.mkdir();d=subprocess.run(['gh','run','download',rid,'-R','madmax91310/shinny-potato','-n','exposure-expansion-observations','-D',str(t)],capture_output=True,text=True)
if d.returncode:raise RuntimeError('Native producer artifact retrieval failed; signed transport details withheld')
p2='src/data/automated-etf.json';blob2=git('rev-parse','HEAD:'+p2);assert m['files'][p2]==blob2
save('jepg-record-adoption.json',{'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'public':b,'path':p2,'sourceBlob':blob2,'instrument':'IE0003UVYC20','record':json.loads((ROOT/p2).read_text())['IE0003UVYC20']})
active=read(API+'/actions/runs/42952247354',True);save('ordinary-active-etf-run.json',active);save('ordinary-active-etf-jobs.json',read(API+'/actions/runs/42952247354/jobs?per_page=100',True))
at=TEMP/'active-native-report';at.mkdir();ad=subprocess.run(['gh','run','download','42952247354','-R','madmax91310/shinny-potato','-n','active-etf-observation','-D',str(at)],capture_output=True,text=True)
if ad.returncode:raise RuntimeError('Active ETF artifact retrieval failed; signed transport withheld')
contracts=[]
for f in at.rglob('*.json'):
 obj=json.loads(f.read_text())
 if isinstance(obj,dict)and('resultContract'in obj or f.name.endswith('.contract-plan.json')):contracts.append({'file':str(f.relative_to(at)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'resultContract':obj.get('resultContract'),'plan':obj if f.name.endswith('.contract-plan.json')else None,'errors':obj.get('errors')or obj.get('failures')})
assert contracts,'Native source contracts must remain explicit'
(OUT/'active-etf-native-contracts.json.gz').write_bytes(gzip.compress(json.dumps(contracts,ensure_ascii=False).encode()))
checks=read(API+'/commits/b8a3c48d9ec4d4fba81e01819f28a7901ea9a818/check-runs?per_page=100',True);required=['current-snapshot','scope','build','python-checks','exposure-browser-check','smoke']+['browser-checks ('+str(i)+')'for i in range(4)]+['tweet-midi-checks ('+str(i)+')'for i in range(4)]
assert all(any(c['name']==n and c['conclusion']=='success'for c in checks['check_runs'])for n in required);save('required-pr-checks.json',checks)
shutil.copyfile(TEMP/'probe-public-browser.mjs',ROOT/'scripts/probe-smh-public.mjs');run('npm','ci');run('node','scripts/build-dca-exposures.mjs');run('node','scripts/build-index-company-compositions.mjs');run('npx','playwright','install','--with-deps','chromium');run('node','scripts/probe-smh-public.mjs')
proof=json.loads((OUT/'smh-public-consumers.json').read_text());assert proof['before']==b==proof['after']and not proof['errors']
a=TEMP/'vaneck-production-evidence';run('git','clone','--single-branch','--depth=1','--branch',BRANCH,'https://github.com/madmax91310/shinny-potato.git',str(a),stdout=subprocess.DEVNULL);shutil.copytree(OUT,a/FOLDER,dirs_exist_ok=True)
run('git','-C',str(a),'config','user.name','github-actions[bot]');run('git','-C',str(a),'config','user.email','41898282+github-actions[bot]@users.noreply.github.com');run('git','-C',str(a),'add','--',FOLDER);run('git','-C',str(a),'commit','-m','Prove ordinary VanEck production and public consumers')
auth=base64.b64encode(('x-access-token:'+os.environ['GH_TOKEN']).encode()).decode();env=os.environ.copy();env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+auth)
try:run('git','-C',str(a),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
except subprocess.CalledProcessError:
 run('git','-C',str(a),'fetch','origin',BRANCH);run('git','-C',str(a),'rebase','origin/'+BRANCH);run('git','-C',str(a),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
print('VANECK_PRODUCTION_ARCHIVED',git('-C',str(a),'rev-parse','HEAD'),'code',b['sha'],'data',data,'producer',r['id'],flush=True)
