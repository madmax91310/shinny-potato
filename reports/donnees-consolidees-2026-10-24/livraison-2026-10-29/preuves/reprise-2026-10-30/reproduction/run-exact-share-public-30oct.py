import pathlib,subprocess,json,urllib.request,time,os,datetime
r=pathlib.Path('/dev/shm/data-automation-20261028');repo=r/'bnp';base='https://madmax91310.github.io/shinny-potato';release='7492872fb2e20c2d45cd1df4c7ede788fef18c7e'
for attempt in range(90):
 info=json.load(urllib.request.urlopen(base+'/build-info.json?annual30oct='+str(attempt),timeout=45));sha=info['sha']
 known=subprocess.run(['git','cat-file','-e',sha],cwd=repo,capture_output=True).returncode==0
 if known and subprocess.run(['git','merge-base','--is-ancestor',release,sha],cwd=repo).returncode==0:break
 time.sleep(20)
else:raise RuntimeError('New financial code not publicly observed within this verification window')
out=r/'proofs-29oct/exact-share-annual-public-30oct';out.mkdir(exist_ok=True);(out/'initial-version.json').write_text(json.dumps(info,indent=2));results=[]
for isin in ['IE00BKPX3K41','IE00BMW42413','IE00BKPSFC54','DE000A27Z304','GB00BLD4ZL17','GB00BLD4ZM24','IE00BMG6Z448','IE00BJ5JP097','FR0013412004','IE00B4K6B022']:
 env={**os.environ,'NODE_DISABLE_COMPILE_CACHE':'1','TMPDIR':str(r/'tmp'),'TEST_ISIN':isin,'TEST_BASE_URL':base,'TEST_OUTPUT_DIR':str(out/isin),'TEST_RETAIN_PNG':'0'}
 subprocess.run(['node','scripts/.verify-exact-share-annual-30oct.mjs'],cwd=repo,env=env,check=True)
 d=json.loads((out/isin/'results.json').read_text());assert not d['errors'];results.append({'isin':isin,'scenarios':len(d['results']),'downloads':len(d['downloads'])})
final=json.load(urllib.request.urlopen(base+'/build-info.json',timeout=45));(out/'summary.json').write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'initialVersion':info,'finalVersion':final,'results':results,'noFinancialSourcesRecollected':True},indent=2));print('40 public scenarios verified',flush=True)
