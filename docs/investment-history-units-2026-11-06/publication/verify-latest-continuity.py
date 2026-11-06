import pathlib,json,subprocess,hashlib,urllib.request,concurrent.futures,datetime
root=pathlib.Path('/workspace/evidence/publication-final');a='d517425c4aec4635bc87ea2c2e2ea3c1077e6a8a';b='ad419ccfcc929e2b67a794255ef9c04caa60e579';v=json.load(open(root/'latest-public-version/build-info.json'));out={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'previousDataSha':a,'publicVersion':v,'codeObjects':{}}
paths=['src/pages/investment-calculator','src/pages/tweet-midi','src/lib/investment-series.js','src/data/anniversary-price-quality.js','src/data/history-window-quality.js','src/data/automated-equity-history.js','src/data/etf-monthly-history.js','src/data/monthly-automation.js','scripts/refresh_monthly_history.py','scripts/qualified_history_units.py','scripts/qualify_anniversary_price_units.py','scripts/lib/history-unit-proof.mjs']
for path in paths:
 x,y=(subprocess.check_output(['git','rev-parse',r+':'+path],cwd='/workspace/filtered',text=True).strip()for r in [a,b]);assert x==y,path;out['codeObjects'][path]=x
records={}
for f in ['automated-monthly.json','automated-etf-monthly.json','non-bond-monthly-records.json']:
 x,y=(json.loads(subprocess.check_output(['git','show',r+':src/data/'+f],cwd='/workspace/filtered'))for r in [a,b]);assert x.keys()==y.keys()
 for id,r in x.items():
  for k in r.keys()|y[id].keys():
   if k.startswith(('anniversary','historyExcl')):assert r.get(k)==y[id].get(k),(id,k)
 records[f]=(x,y)
out['allHistoricalQuoteObservationsAndWindowProtectionsUnchanged']=True
x,y=records['automated-etf-monthly.json'];bank='etfLU1829219390';wood='etf_timber_ishares';assert x[bank]['points']==y[bank]['points'];assert x[bank]['splitAdjustmentEvidence']['checks']==y[bank]['splitAdjustmentEvidence']['checks'];assert x[wood]['historicalQuoteRepairEvidence']['checks']==y[wood]['historicalQuoteRepairEvidence']['checks'];assert [p for p in x[wood]['points']if p[0]>='2026-01']==[p for p in y[wood]['points']if p[0]>='2026-01'];assert x['etc_natural_gasNav']==y['etc_natural_gasNav']
out['bankReturnPointsAndOfficialChecksUnchanged']=True;out['wood2026ReturnPointsAndOfficialChecksUnchanged']=True;out['failedNaturalGasWholeRecordAndProofDateUnchanged']=True
old=dict(x[wood]['points']);changes=[{'month':m,'before':old.get(m),'after':p}for m,p in y[wood]['points']if old.get(m)!=p];out['woodEarlierProviderMicrovariations']=changes
previous=json.load(open(root/'public-calculator/results.json'));latest=json.load(open(root/'latest-calculator/results.json'));assert len(latest)==8
for oldr,new in zip(previous,latest):
 for k in ['key','independentFinalValue','displayed','copiedText','downloadedSha256','previewSha256']:assert oldr[k]==new[k],(new['key'],k)
out['eightReplayedPublicCalculatorCasesIdenticalIncludingPNG']=True
rows=json.load(open(root/'public-restrictions/results.json'));assert len(rows)==22;sources={r['source']['url']:r['source']for r in rows if r.get('source')};d=root/'latest-restriction-records';d.mkdir(exist_ok=True)
def check(item):
 url,s=item
 with urllib.request.urlopen(url,timeout=30)as response:body=response.read()
 sha=hashlib.sha256(body).hexdigest();assert sha==s['sha256'];name=s['file'].split('/')[-1];(d/name).write_bytes(body);return{'url':url,'sha256':sha,'sameAsEarlierPublicRecipe':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:out['restrictionPublicResponseBindings']=list(pool.map(check,sources.items()))
out['restrictionCasesReused']=22;out['method']='Unchanged consumer/collector code, unchanged raw historical quote observations and exclusions, and identical freshly fetched public response bytes for the three assets used by the 22 restriction cases.'
(root/'latest-continuity.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'currentDataSha':b,'newPublicCalculatorCases':8,'reusedRestrictionCases':22,'unchangedRestrictionRecords':len(sources),'woodEarlierMicrovariations':len(changes),'allChecksPassed':True}))
