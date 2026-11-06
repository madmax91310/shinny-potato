"""Attach the existing publication's freshness rules; do not invent missing contracts."""
import pathlib,json,gzip,csv,subprocess
import csv
csv.field_size_limit(32 * 1024 * 1024)
R=pathlib.Path('/tmp/automation-20261106');O=R/'livraison';repo=R/'repo'
capture=json.load(open(R/'public-final/capture.json'));ref=capture['after']['sha']
policy=json.loads(subprocess.check_output(['git','show',ref+':src/data/freshness-policy.json'],cwd=repo))
coverage=json.load(gzip.open(R/'public-final/asset-field-coverage.json.gz','rt'))
# The published report uses this exact selector. Refuse any intervening selector change.
file='scripts/report-asset-fields.mjs'
published=subprocess.check_output(['git','show',ref+':'+file],cwd=repo).decode()
current=(repo/file).read_text();section=lambda t:t[t.index('export function etfFreshnessKey'):t.index('// Observation periods')]
assert section(current)==section(published),'Published freshness selector differs; do not approximate it'
fields=sorted({r['field']for r in coverage['rows']if r['type']=='instrument'})
cmd="import {etfFreshnessKey}from'./scripts/report-asset-fields.mjs';console.log(JSON.stringify(Object.fromEntries("+json.dumps(fields)+".map(f=>[f,etfFreshnessKey(f)]))))"
etf=json.loads(subprocess.check_output(['node','--input-type=module','-e',cmd],cwd=repo))
lookup={}
for r in coverage['rows']:
 t,f=r['type'],r['field'];k=None
 if t=='instrument':k=etf[f]
 elif t in ['equity','series']:k='series.monthly'
 elif t=='index':k='index.returns'if f=='returns'else'index.facts'
 elif t in ['scpi','insurance']:k='product.annual'if f in policy['fields']['product.annual']['fields']else'product.default'
 if k:lookup[(r['id'],f)]={'key':k,**policy['fields'][k],'effectiveDate':f=='price','coverageState':r['state']}
with open(O/'matrice-donnees-usages.csv',encoding='utf-8-sig',newline='')as f:rows=list(csv.DictReader(f,delimiter=';'))
matched=0
for r in rows:
 c=json.loads(r.get('certificat_ciblé')or'null');p=lookup.get((c['id'],c['field']))if c else None
 key=r.get('clé_politique_fraîcheur')
 if not p and key in policy['fields']:p={'key':key,**policy['fields'][key],'mapping':'clé explicitement déclarée par le contrat natif ; aucun succès source déduit'}
 r['fraîcheur_attendue']=json.dumps(p,ensure_ascii=False)if p else'contrat individuel non publié dans cet inventaire ; voir registre et politique communs, aucune fréquence déduite'
 r['preuve_politique_fraîcheur']=ref+':src/data/freshness-policy.json ; scripts/report-asset-fields.mjs'
 r['unité']= r.get('unité_explicitement_publiée') or ('non applicable au champ non applicable'if r['état_usage']=='not-applicable'else'non exposée par cet inventaire de contrats ; unité/convention du registre à consulter, aucune unité inventée')
 if p:matched+=1
keys=list(dict.fromkeys(k for r in rows for k in r))
with open(O/'matrice-donnees-usages.csv','w',encoding='utf-8-sig',newline='')as f:
 w=csv.DictWriter(f,fieldnames=keys,delimiter=';');w.writeheader();w.writerows(rows)
b=json.load(open(O/'bilan.json'));b.update({'usageRowsWithPublishedFreshnessPolicy':matched,'usageRowsWithoutExplicitPublishedFreshnessMapping':len(rows)-matched,'missingUnitNotCountedAsSourceOutage':True});(O/'bilan.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
(O/'politique-fraicheur-publiee.json').write_text(json.dumps({'publicCodeRef':ref,'policy':policy,'doesNotCertifyProviderExecutions':True},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'matrixRows':len(rows),'freshnessPolicyMapped':matched,'unmappedExplicitlyRetained':len(rows)-matched}))
