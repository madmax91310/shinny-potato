import base64,datetime,gzip,hashlib,json,os,pathlib,shutil,subprocess,time,urllib.error,urllib.request
ROOT=pathlib.Path.cwd();TEMP=pathlib.Path(os.environ['RUNNER_TEMP']);OUT=pathlib.Path(os.environ['RECIPE_OUTPUT']);OUT.mkdir(exist_ok=True,parents=True);API='https://api.github.com/repos/madmax91310/shinny-potato';BASE='https://madmax91310.github.io/shinny-potato/';EXPECTED='72751babb2c6541cd2519d3a20fa20941c0fb99f';TRIGGER=EXPECTED;BRANCH='reports/consolidated-automation-evidence-20261106';FOLDER='reports/donnees-consolidees-2026-10-24/reprise-2026-11-10/livraison/preuves/dws-iues-production-2026-11-11'
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def read(url,auth=False):
 h={'Cache-Control':'no-cache','User-Agent':'EpargnantLibre-production-proof/1.0'}
 if auth:h['Authorization']='Bearer '+os.environ['GH_TOKEN']
 for attempt in range(4):
  try:return json.load(urllib.request.urlopen(urllib.request.Request(url,headers=h),timeout=90))
  except urllib.error.HTTPError as e:
   if e.code not in(429,502,503,504)or attempt==3:raise
   print('PUBLIC_READ_RETRY',e.code,attempt,flush=True);time.sleep(10)
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2))
RECOVERY_RUN=42992945306
result=subprocess.run(['gh','run','download',str(RECOVERY_RUN),'-R','madmax91310/shinny-potato','-n','isolated-public-automation-proof-20261111','-D',str(OUT)],capture_output=True,text=True)
if result.returncode:raise RuntimeError('Existing public receipts unavailable; signed transport withheld')
proof=json.loads((OUT/'listing-public-consumers.json').read_text());b=proof['before'];assert b==proof['after']and len(proof['rows'])==8 and not proof['errors'];assert b['sha']==EXPECTED;assert read(BASE+'build-info.json')==b
ui=json.loads((OUT/'public-inbox/public-inbox-browser.json').read_text());assert ui['public']==b and not ui['errors'];assert (OUT/'public-inbox/public-export.json.gz').exists()
save('verification-archive-resume.json',{'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'originalFinancialRun':42986450005,'actualFullInboxRun':RECOVERY_RUN,'reusedActualReceipts':8,'reusedFullActualUIExport':True,'resumeScope':'Fetch missing code commit trees, record exact financial blob boundaries and archive already acquired original native/public proofs','ownHarnessFailure':'Previous resume captured the entire real public UI export successfully, then tried resolving a code commit absent from its shallow checkout. No application, supplier or data failure.','supplierRecollection':False,'browserRerun':False,'redeployment':False,'public':b})
data=b['dataSha'];run('git','fetch','--filter=blob:none','--depth=1','origin',data,EXPECTED,'99d974afa4a21712c92cc91ca84b7464f75585d8',stdout=subprocess.DEVNULL);run('git','cat-file','-e',EXPECTED+'^{commit}')
# Exact source/code identities delimit re-use of already executed financial tests.
code_paths=['src/data/market-history.js','src/data/history-window-quality.js','src/pages/investment-calculator/lib.js','src/pages/dca-profiles/analytics.js','src/data/index-facts.js','src/data/index-company-compositions.js']
financial_paths=['src/data/automated-monthly.json','src/data/automated-etf-monthly.json','src/data/non-bond-monthly-records.json','src/data/monthly-fx.json','src/data/dca-complete-holdings.json','src/data/exposure-etf-expansion-records.json','src/data/automated-indices.json','src/data/index-company-observations.json']
old='99d974afa4a21712c92cc91ca84b7464f75585d8';run('git','fetch','--depth=1','origin',old,stdout=subprocess.DEVNULL)
save('financial-test-reuse-boundaries.json',{'oldCode':old,'currentCode':EXPECTED,'codeFiles':{p:{'old':git('rev-parse',old+':'+p),'current':git('rev-parse',EXPECTED+':'+p)} for p in code_paths},'currentFinancialData':{p:git('rev-parse',data+':'+p) for p in financial_paths},'meaning':'Old browser runs remain dated original executions. Identical financial code and input blobs permit bounded reuse, not a newly executed test on every instrument.'})
assert read(BASE+'build-info.json')==b,'Public snapshot moved; capture again before production assertion'
archive=TEMP/'listing-production-evidence';run('git','clone','--single-branch','--depth=1','--branch',BRANCH,'https://github.com/madmax91310/shinny-potato.git',str(archive),stdout=subprocess.DEVNULL);shutil.copytree(OUT,archive/FOLDER,dirs_exist_ok=True)
run('git','-C',str(archive),'config','user.name','github-actions[bot]');run('git','-C',str(archive),'config','user.email','41898282+github-actions[bot]@users.noreply.github.com');run('git','-C',str(archive),'add','--',FOLDER);run('git','-C',str(archive),'commit','-m','Prove ordinary DWS and IUES listing refresh and public consumers')
auth=base64.b64encode(('x-access-token:'+os.environ['GH_TOKEN']).encode()).decode();env=os.environ.copy();env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+auth)
try:run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
except subprocess.CalledProcessError:
 run('git','-C',str(archive),'fetch','origin',BRANCH);run('git','-C',str(archive),'rebase','origin/'+BRANCH);run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
print('LISTING_PRODUCTION_ARCHIVED',git('-C',str(archive),'rev-parse','HEAD'),b,flush=True)
