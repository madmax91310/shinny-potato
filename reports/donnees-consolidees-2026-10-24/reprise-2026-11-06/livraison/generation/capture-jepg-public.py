import pathlib,json,urllib.request,subprocess,hashlib,time,datetime
R=pathlib.Path('/tmp/automation-20261106');O=R/'proofs/jepg-public';O.mkdir(exist_ok=True);base='https://madmax91310.github.io/shinny-potato/';q='?jepg-proof='+str(time.time_ns())
build=json.load(urllib.request.urlopen(base+'build-info.json'+q));manifest=json.load(urllib.request.urlopen(base+'data/publication-manifest.json'+q));blob=manifest['files']['src/data/automated-etf.json'];body=subprocess.check_output(['git','cat-file','blob',blob],cwd=R/'repo');assert hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()==blob
r=json.loads(body)['IE0003UVYC20'];url='https://am.jpmorgan.com/FundsMarketingHandler/product-data?cusip=IE0003UVYC20&country=sg&role=per&language=en&userLoggedIn=false'
assert r['aum'].get('sourceComponent')=='fundData.aum.value','JEPG API data not served yet'
assert r['aum']['sourceUrl']==url and r['aum']['currency']=='USD'and r['aum']['scope']=='fund'
assert r['holdings']['sourceUrl']==url and len(r['holdings']['rows'])==10 and not r['holdings']['complete']
assert r['aum']['asOf']>='2026-11-05'and r['holdings']['asOf']>='2026-11-05'
receipt=json.load(open(R/'proofs/jepg-github-production/receipt.json'));subprocess.run(['git','merge-base','--is-ancestor',receipt['commit'],build.get('dataSha',build['sha'])],cwd=R/'repo',check=True)
prod=json.load(open(R/'proofs/jepg-github-production/jepg-observation.json'));assert prod['status']=='validated'and not prod.get('collectionErrors')
for field in ['aum','holdings']:assert r[field]['sha256']==prod['record'][field]['sha256'],'Public/ordinary producer field proof mismatch'
after=json.load(urllib.request.urlopen(base+'build-info.json'+q+'after'));assert after==build
context={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':build,'registryBlob':blob,'registrySha256':hashlib.sha256(body).hexdigest(),'stableBuild':True,'ordinaryProducerReceipt':str(R/'proofs/jepg-github-production/receipt.json'),'provedFields':['aum','holdings']};(O/'context.json').write_text(json.dumps(context,indent=2));(O/'record.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
# The private browser oracle reads exactly the published data, never substitutes
# it into production. Keep unrelated local test records untouched.
p=pathlib.Path('/dev/shm/automation-jepg-20261106/src/data/automated-etf.json');j=json.loads(p.read_text());j['IE0003UVYC20']=r;p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n');print(json.dumps(context))
