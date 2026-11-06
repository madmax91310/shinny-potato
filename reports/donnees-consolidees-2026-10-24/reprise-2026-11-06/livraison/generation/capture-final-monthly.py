import pathlib,json,urllib.request,subprocess,time,datetime
R=pathlib.Path('/tmp/automation-20261106');repo=R/'repo';base='https://madmax91310.github.io/shinny-potato/';q='?monthly-final='+str(time.time_ns())
def git(ref,path):return json.loads(subprocess.check_output(['git','show',ref+':'+path],cwd=repo))
b=json.load(urllib.request.urlopen(base+'build-info.json'+q));m=json.load(urllib.request.urlopen(base+'data/publication-manifest.json'+q))['files'];status=json.loads(subprocess.check_output(['git','cat-file','blob',m['scripts/source-snapshots/monthly-collection-status.json']],cwd=repo))['series']
expected=git('b641e888850898e6fdf392e62540e45c96ccb3d9','scripts/source-snapshots/monthly-collection-status.json')['series'];pub=json.loads(subprocess.check_output(['git','cat-file','blob',m['src/data/automated-etf-monthly.json']],cwd=repo));old=git('5739c1c16cb3452af46322b4f547faf2b159bc48','src/data/automated-etf-monthly.json');out={}
for k in ['etc_natural_gasNav','etfIE00BDVPNG13Nav']:
 assert status[k]==expected[k],k+' latest source result not published'
 assert pub[k]['points']==old[k]['points'],k+' points changed, requires new numerical qualification'
 out[k]={'latestSourceObservation':status[k],'financialRecordCheckedAt':pub[k]['checkedAt'],'lastOfficialValuation':pub[k]['lastOfficialValuation'],'responseSha256':pub[k]['responseSha256'],'pointsUnchangedSinceQualified5739':True,'pointCount':len(pub[k]['points'])}
assert b==json.load(urllib.request.urlopen(base+'build-info.json'+q+'after'))
p=R/'proofs/month-end-guard/final-monthly-publication.json';p.write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':b,'blobByPath':{k:m[k]for k in ['scripts/source-snapshots/monthly-collection-status.json','src/data/automated-etf-monthly.json']},'series':out,'sourceFailureIsNotFinancialSuccess':True,'stableBuild':True},ensure_ascii=False,indent=2));print('Latest WTAI success and NGAS failure published; qualified financial points unchanged')
