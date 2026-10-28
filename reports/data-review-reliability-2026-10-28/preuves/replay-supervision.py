import json,sys,datetime,pathlib,urllib.request,gzip
sys.path.insert(0,'scripts')
from automation_history_coverage import recover_skipped_history_gaps
from automation_legacy_phases import qualify_legacy_phases
from automation_monitor_self import observe_monitor_history
from publish_automation_status import checkout_snapshot,legacy_publication_receipt,reconcile_publication,qualify_consumer_bindings,REGISTRY
from automation_monitoring import evaluate_monitoring
out=pathlib.Path('/workspace/scratch/data-review-20261028');source=out/'baseline';read=lambda p:json.loads(pathlib.Path(p).read_text());captured={}
def api(path):
 if path not in captured:
  request=urllib.request.Request('https://api.github.com/repos/madmax91310/shinny-potato'+path,headers={'Accept':'application/vnd.github+json','User-Agent':'EpargnantLibre-ReadOnlyEvidence'})
  captured[path]=json.load(urllib.request.urlopen(request,timeout=30))
 return captured[path]
now=datetime.datetime.now(datetime.timezone.utc).isoformat();state=read(source/'automation-status.json')
state=recover_skipped_history_gaps(state,api,now)
assert 'history-window:update-editorial-radar.yml'not in state['observerErrors']
state=observe_monitor_history(state,api,'madmax91310/shinny-potato',now)
key='40213617352:1';f=state['monitorSelf']['failures'][key]
print('SELF_DEBUG',state.get('observerErrors'),state['monitorSelf']['coverage'],[(k, len(v.get('jobs',[])))for k,v in captured.items()if '/jobs?'in k],flush=True)
(out/'github-read-responses.json.gz').write_bytes(gzip.compress(json.dumps(captured,separators=(',',':')).encode()))
assert not f['qualificationPending']and f.get('resolvedAt'),f
run=read(out/'bitcoin-run.json');jobs=read(out/'bitcoin-jobs.json')['jobs'];source_sha=checkout_snapshot((out/'bitcoin-source-checkout.txt').read_text());assert source_sha==run['head_sha']
state=qualify_legacy_phases(state,run,jobs,source_sha,now);bitcoin=state['workflows']['update-bitcoin-monthly.yml'];assert bitcoin['recordingStatus']=='success'and bitcoin['validationStatus']=='success'
receipt=legacy_publication_receipt('madmax91310/shinny-potato',jobs,api,producer='update-bitcoin-monthly.yml',source_sha=source_sha,read_log=lambda job:(out/'bitcoin-build-checkout.txt').read_text());assert receipt and len(receipt['files'])==3
bitcoin['publicationReceipt']=receipt
manifest=read(source/'publication-manifest.json');state=reconcile_publication(state,read(source/'build-info.json'),manifest,lambda *_:None)
bitcoin=state['workflows']['update-bitcoin-monthly.yml'];assert bitcoin['publicationStatus']=='unverified';assert len(bitcoin['partialPublicationEvidence']['matchedFiles'])==2
context=qualify_consumer_bindings(read(out/'context-after.json'),manifest)
# The actual immutable Radar branch used by the captured monitor remains unchanged.
import subprocess
radar=json.loads(subprocess.check_output(['git','show','b46e37bf:feed.json']));radar['resolvedConflicts']={}
state['monitoring']=evaluate_monitoring(state,context,REGISTRY,now,radar)
assert 'monitor:history-window:update-editorial-radar.yml'not in state['monitoring']['active']
proof={'verifiedAt':now,'readOnly':True,'historyGap':state['observerChecks']['history-window:update-editorial-radar.yml'],'monitorStartupEpisode':f,'bitcoinPhases':bitcoin['legacyPhaseEvidence'],'bitcoinReceipt':receipt,'bitcoinPublication':bitcoin['partialPublicationEvidence'],'apiReads':list(captured)}
(out/'supervision-replay-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2));(out/'after-monitor.json.gz').write_bytes(gzip.compress(json.dumps(state,ensure_ascii=False,separators=(',',':')).encode()));(out/'github-read-responses.json.gz').write_bytes(gzip.compress(json.dumps(captured,separators=(',',':')).encode()))
print(json.dumps({'now':now,'reads':len(captured),'historyWindow':proof['historyGap']['totalRuns'],'startupResolved':f['resolvedAt'],'bitcoinMatched':len(proof['bitcoinPublication']['matchedFiles']),'bitcoinUnconfirmed':proof['bitcoinPublication']['unconfirmedFiles'],'observerErrors':len(state['observerErrors'])}))
