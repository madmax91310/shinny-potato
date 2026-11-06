import subprocess,json,pathlib,datetime,sys
pr=int(sys.argv[1]);head=sys.argv[2];repo='madmax91310/shinny-potato'
def api(path):return json.loads(subprocess.check_output(['gh','api',f'repos/{repo}/'+path,'-H','Cache-Control: no-cache']))
j=api(f'pulls/{pr}');assert j['head']['sha']==head
checks=api(f'commits/{head}/check-runs?per_page=100')['check_runs'];assert all(c['head_sha']==head for c in checks)
expected={'current-snapshot','scope','build','python-checks','exposure-browser-check','smoke'}|{f'{f} ({n})'for f in ['browser-checks','tweet-midi-checks']for n in range(4)};latest={}
for c in checks:
 if c['name']not in latest or c['id']>latest[c['name']]['id']:latest[c['name']]=c
states={k:latest.get(k,{}).get('conclusion')or latest.get(k,{}).get('status','missing')for k in sorted(expected)};ready=all(v=='success'for v in states.values());print(json.dumps({'pr':pr,'head':head,'mergeable':j['mergeable'],'mergeableState':j.get('mergeable_state'),'ready14':ready,'remaining':{k:v for k,v in states.items()if v!='success'}}))
if ready:
 out={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'headRefOid':head,'mergeable':j['mergeable'],'pull':{k:j[k]for k in ['number','state','merged','mergeable','mergeable_state']},'required14':{k:latest[k]for k in sorted(expected)},'allRequired14ExactHeadSuccessful':True,'optionalSourceFailures':[{k:c[k]for k in ['name','conclusion','html_url','head_sha']}for c in checks if c['name']not in expected and c.get('conclusion')=='failure']};pathlib.Path(f'/tmp/automation-20261106/proofs/gates-{pr}-before-merge.json').write_text(json.dumps(out,indent=2))
