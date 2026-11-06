import hashlib,json,pathlib,subprocess,datetime
root=pathlib.Path('/workspace/evidence/publication-final')
version=json.load(open(root/'latest-public-version/build-info.json'))
snapshot=version.get('dataSha',version['sha'])
raw=json.loads(subprocess.check_output(['git','show',snapshot+':src/data/automated-etf-monthly.json'],cwd='/workspace/filtered'))
rows=json.load(open(root/'latest-calculator/results.json'))
result={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'publicVersion':version,'snapshotForSourceComparison':snapshot,'bindings':[]}
for row in rows:
    assert row['publicVersion']==version
    body=(root/'latest-calculator'/row['history']['file']).read_bytes();assert hashlib.sha256(body).hexdigest()==row['history']['sha256']
    served=json.loads(body);source=raw[served['id']]
    for field in ['isin','currency','checkedAt','periodStart','periodEnd']:
        assert served.get(field)==source.get(field),(served['id'],field)
    for field in ['points','anniversaryPoints']:
        public=[[p['date'],p['price']] if isinstance(p,dict) else p for p in served[field]]
        assert public==source[field],(served['id'],field)
    if 'historyExcludedMonths' in source: assert served['historyExcludedMonths']==source['historyExcludedMonths']
    result['bindings'].append({'case':row['key'],'recordSHA256':row['history']['sha256'],'sourceSnapshot':snapshot,'allReturnAndHistoricalQuoteObservationsMatch':True,'priceProofDatePreserved':True})
(root/'latest-public-record-bindings.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'cases':len(result['bindings']),'snapshot':snapshot,'allMatched':True}))
