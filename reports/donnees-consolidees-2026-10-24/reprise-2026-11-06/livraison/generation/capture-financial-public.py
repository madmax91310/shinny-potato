import pathlib,json,urllib.request,subprocess,gzip,hashlib,time,datetime
R=pathlib.Path('/tmp/automation-20261106');O=R/'proofs/financial-public';O.mkdir(exist_ok=True)
base='https://madmax91310.github.io/shinny-potato/';suffix='?financial-verification='+str(time.time_ns())
build=json.load(urllib.request.urlopen(base+'build-info.json'+suffix,timeout=30));manifest=json.load(urllib.request.urlopen(base+'data/publication-manifest.json'+suffix,timeout=30))
files={};all_records={}
for name in ['automated-monthly.json','automated-etf-monthly.json','non-bond-monthly-records.json','monthly-fx.json']:
 path='src/data/'+name;blob=manifest['files'][path];body=subprocess.check_output(['git','cat-file','blob',blob],cwd=R/'repo')
 assert hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()==blob
 with gzip.open(O/(name+'.gz'),'wb')as f:f.write(body)
 files[path]={'blob':blob,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)}
 if name!='monthly-fx.json':all_records.update(json.loads(body))
bank=all_records['etfLU1829219390'];wood=all_records['etf_timber_ishares']
production=json.load(open(R/'proofs/financial-targeted-recording.json'))
report=json.load(open(R/'proofs/financial-github-targeted/monthly-observation.json'))
assert set(report['scope']['expectedIds'])=={'etfLU1829219390','etf_timber_ishares'}
for row in report['series']:
 assert row['status']=='validated' and all_records[row['id']]['responseSha256']==row['responseSha256'],'Public/ordinary targeted producer mismatch'
ref=build.get('dataSha',build['sha'])
subprocess.run(['git','merge-base','--is-ancestor',production['commit'],ref],cwd=R/'repo',check=True)
assert bank.get('splitAdjustmentEvidence',{}).get('ratio')==80,'BNKE repair not yet served'
assert wood.get('historicalQuoteRepairEvidence',{}).get('isin')=='IE00B27YCF74','WOOD proof not yet served'
assert dict(wood['anniversaryPoints'])['2026-02']==26.66
for r in [bank,wood]:assert r['checkedAt']>='2026-11-06'
ref=build.get('dataSha',build['sha']);evidence=json.loads(subprocess.check_output(['git','show',ref+':scripts/source-snapshots/monthly-automated.json'],cwd=R/'repo'))
pairs={}
for id in [bank['id'],wood['id']]:
 assert all_records[id]['responseSha256']==evidence[id]['responseSha256'],'Published price/proof source mismatch'
 pairs[id]={'record':all_records[id],'evidence':evidence[id]}
(O/'published-unit-proof-pairs.json').write_text(json.dumps(pairs,ensure_ascii=False,indent=2))
# All active restrictions in these three exact published registers are retained,
# not inferred from source success or metadata names.
restrictions={id:{'id':id,'isin':r.get('isin'),'symbol':r.get('symbol'),'currency':r.get('currency'),'checkedAt':r.get('checkedAt'),'periodStart':r.get('periodStart'),'periodEnd':r.get('periodEnd'),'sourceUrls':r.get('sourceUrls',[]),'historyExcludedMonths':r.get('historyExcludedMonths',[]),'historyExclusionReasons':r.get('historyExclusionReasons',{}),'financialField':r.get('field'),'valuationBasis':r.get('valuationBasis'),'method':r.get('method'),'historyUnqualifiedReturnWindows':r.get('historyUnqualifiedReturnWindows',[]),'anniversaryExcludedMonths':r.get('anniversaryExcludedMonths',[]),'anniversaryExclusionReason':r.get('anniversaryExclusionReason'),'anniversaryPriceReview':r.get('anniversaryPriceReview'),'splitAdjustmentEvidence':r.get('splitAdjustmentEvidence')}for id,r in all_records.items()if any(r.get(k)for k in ['historyExcludedMonths','historyUnqualifiedReturnWindows','anniversaryExcludedMonths','anniversaryPriceReview','splitAdjustmentEvidence'])}
(O/'published-usage-restrictions.json').write_text(json.dumps(restrictions,ensure_ascii=False,indent=2))
after=json.load(urllib.request.urlopen(base+'build-info.json'+suffix+'-after',timeout=30));assert after==build,'Publication changed during capture'
context={'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':build,'manifestFiles':files,'sourceDataRef':ref,'stableBuild':True,'unitRecordIds':list(pairs),'restrictionRecords':len(restrictions),'liveProviderControlNotInferredFromThisPublicRead':True,'ordinaryTargetedProduction':production}
(O/'context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2));print(json.dumps(context,ensure_ascii=False))
