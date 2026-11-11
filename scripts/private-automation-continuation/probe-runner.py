import base64,datetime,gzip,json,os,pathlib,shutil,subprocess,time,urllib.request
ROOT=pathlib.Path.cwd();TEMP=pathlib.Path(os.environ['RUNNER_TEMP']);OUT=pathlib.Path(os.environ['RECIPE_OUTPUT']);OUT.mkdir(parents=True,exist_ok=True)
EXPECTED='99d974afa4a21712c92cc91ca84b7464f75585d8';TRIGGER='99d974afa4a21712c92cc91ca84b7464f75585d8';BASE='https://madmax91310.github.io/shinny-potato/';API='https://api.github.com/repos/madmax91310/shinny-potato';BRANCH='reports/consolidated-automation-evidence-20261106';FOLDER='reports/donnees-consolidees-2026-10-24/reprise-2026-11-10/livraison/preuves/ishares-physical-production-2026-11-11';ISINS=['IE0008471009','IE0008470928','IE00B1YZSC51']
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def read(u,auth=False):
 h={'Cache-Control':'no-cache','User-Agent':'EpargnantLibre-production-proof/1.0'}
 if auth:h['Authorization']='Bearer '+os.environ['GH_TOKEN']
 for attempt in range(4):
  try:return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=h),timeout=90))
  except urllib.error.HTTPError as e:
   if e.code not in (429,502,503,504)or attempt==3:raise
   print('PUBLIC_READ_RETRY',e.code,attempt+1,flush=True);time.sleep(max(1,int(e.headers.get('Retry-After','10'))))
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
save('verification-plan.json',{'declaredAt':datetime.datetime.now(datetime.UTC).isoformat(),'expectedCode':EXPECTED,'producerTrigger':TRIGGER,'instruments':ISINS,'fields':['declared complete-book targets','real producer observations','registered complete books','public manifest adoption','ETF and DCA selection/calculation/text/preview/PNG desktop/mobile'],'mode':'Read-only after ordinary production; no financial source recollection, register change or forced deployment'})
deadline=time.monotonic()+5700
while True:
 b=read(BASE+'build-info.json')
 if b['sha']==EXPECTED:break
 if time.monotonic()>deadline:raise RuntimeError('Ordinary publication not yet observed; no production claim')
 print('WAITING_ORDINARY_PUBLICATION',b.get('sha'),flush=True);time.sleep(45)
data=b.get('dataSha')or b['sha'];m=read(BASE+'data/publication-manifest.json');save('public-build-info.json',b);save('publication-manifest.json',m)
run('git','fetch','--depth=1','origin',data,stdout=subprocess.DEVNULL);run('git','checkout','--detach',data)
paths=['src/data/dca-complete-holdings.json','src/data/dca-holdings-status.json'];blobs={p:git('rev-parse','HEAD:'+p)for p in paths};assert all(m['files'].get(p)==v for p,v in blobs.items());full=json.loads((ROOT/paths[0]).read_text());status=json.loads((ROOT/paths[1]).read_text());cfg={**json.loads((ROOT/'scripts/dca-complete-holdings-sources.json').read_text()),**json.loads((ROOT/'scripts/generated-holdings-sources.json').read_text())};assert all(i in cfg for i in ISINS)
save('target-and-record-adoption.json',{'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'public':b,'blobs':blobs,'sourceConfiguration':{i:cfg[i]for i in ISINS},'registered':{i:full[i]for i in ISINS},'status':{i:status[i]for i in ISINS},'meaning':'Three existing exact funds. Complete physical equity books and their original cash/weights/dates, not exact index portfolios.'})
runs=read(API+'/actions/runs?branch=master&per_page=100',True)['workflow_runs'];selected=[r for r in runs if r['head_sha']==TRIGGER and r.get('event')=='push'and r.get('path')=='.github/workflows/update-qualified-exposures.yml'];assert len(selected)==1;r=selected[0];rid=str(r['id']);save('ordinary-source-run.json',r);save('ordinary-source-jobs.json',read(API+'/actions/runs/'+rid+'/jobs?per_page=100',True));save('ordinary-source-artifacts.json',read(API+'/actions/runs/'+rid+'/artifacts?per_page=100',True))
t=TEMP/'native-physical-reports';t.mkdir();d=subprocess.run(['gh','run','download',rid,'-R','madmax91310/shinny-potato','-n','qualified-exposures-observation','-D',str(t)],capture_output=True,text=True)
if d.returncode:raise RuntimeError('Native producer artifact unavailable; signed transport details withheld')
files=[]
for f in t.rglob('dca-complete-holdings.json'):
 obj=json.loads(f.read_text())
 if isinstance(obj,dict)and'resultContract'in obj and'observations'in obj:files.append((f,obj))
assert len(files)==1;f,report=files[0]
for i in ISINS:
 obs=report['observations'][i];assert obs['completeFile']is True;assert obs['asOf']==full[i]['asOf']and obs['sha256']==full[i]['sha256'];assert obs['rows']==len(full[i]['rows']);assert full[i]['complete']is True
save('three-native-source-results.json',{'run':int(rid),'event':r['event'],'trigger':TRIGGER,'observations':{i:report['observations'][i]for i in ISINS},'otherErrorsPreserved':report.get('errors',[]),'meaning':'These three source/validation outcomes are distinct from global parent failure and other qualification limits.'})
(OUT/'original-native-report.json.gz').write_bytes(gzip.compress(json.dumps(report,ensure_ascii=False).encode()))
for plan in t.rglob('dca-complete-holdings.contract-plan.json'):shutil.copyfile(plan,OUT/'original-native-contract-plan.json')
checks=read(API+'/commits/f8a331db0ecf95f2d6fc92c1c488c5113d4f8423/check-runs?per_page=100',True);required=['current-snapshot','scope','build','python-checks','exposure-browser-check','smoke']+['browser-checks ('+str(i)+')'for i in range(4)]+['tweet-midi-checks ('+str(i)+')'for i in range(4)]
assert all(any(c['name']==n and c['conclusion']=='success'for c in checks['check_runs'])for n in required);save('required-pr-checks.json',checks)
shutil.copyfile(TEMP/'probe-public-browser.mjs',ROOT/'scripts/probe-ishares-public.mjs');run('npm','ci');run('node','scripts/build-dca-exposures.mjs');run('node','scripts/build-index-company-compositions.mjs');run('npx','playwright','install','--with-deps','chromium');run('node','scripts/probe-ishares-public.mjs')
proof=json.loads((OUT/'ishares-public-consumers.json').read_text());assert proof['before']==b==proof['after']and not proof['errors'];assert len(proof['receipts'])==8
archive=TEMP/'ishares-production-evidence';run('git','clone','--single-branch','--depth=1','--branch',BRANCH,'https://github.com/madmax91310/shinny-potato.git',str(archive),stdout=subprocess.DEVNULL);shutil.copytree(OUT,archive/FOLDER,dirs_exist_ok=True)
run('git','-C',str(archive),'config','user.name','github-actions[bot]');run('git','-C',str(archive),'config','user.email','41898282+github-actions[bot]@users.noreply.github.com');run('git','-C',str(archive),'add','--',FOLDER);run('git','-C',str(archive),'commit','-m','Prove restored iShares full-book production and public consumers')
auth=base64.b64encode(('x-access-token:'+os.environ['GH_TOKEN']).encode()).decode();env=os.environ.copy();env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+auth)
try:run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
except subprocess.CalledProcessError:
 run('git','-C',str(archive),'fetch','origin',BRANCH);run('git','-C',str(archive),'rebase','origin/'+BRANCH);run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
print('ISHARES_PRODUCTION_ARCHIVED',git('-C',str(archive),'rev-parse','HEAD'),'code',b['sha'],'data',data,'producer',rid,flush=True)
