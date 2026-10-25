"""Join the observed producer field scopes once, without inflating usage counts."""
from pathlib import Path
import csv,json
csv.field_size_limit(16*1024*1024)
root=Path(__file__).resolve().parents[2];proof=root/'preuves/reprise-20261025';path=root/'collectes-controles.csv'
with path.open(encoding='utf-8-sig',newline='')as stream:rows=list(csv.DictReader(stream,delimiter=';'))
extra=['champs_declares_par_instrument','portee_inconnue','phase_collecte','phase_validation','phase_enregistrement','phase_publication','preuve_detaillee']
for r in rows:
 for key in extra:r[key]='non déclaré dans cette preuve'
source=json.loads((proof/'controle-mensuel-production-scope.json').read_text());url='https://github.com/madmax91310/shinny-potato/actions/runs/'+str(source['run'])
controls={r['controlScope']['controlledInstrument']:{'id':r['id'],**r['controlScope'],'sourceState':r.get('sourceState'),'usageLimits':r.get('usageLimits')}for r in source['controlledFieldScopes']}
# Acquisition is proved; the failed recording is deliberately not called publication.
rows=[r for r in rows if not(r['workflow']=='update-market-monthly.yml'and r['execution']==url and str(r['rapport']).endswith('monthly-observation.json'))]
observed=json.loads((proof/'observation-mensuelle-production.json').read_text())['series']
rows.append({'workflow':'update-market-monthly.yml','execution':url,'rapport_sha256':source['reportSha256'],'rapport':'monthly-observation.json','identifiants_controles_exacts':json.dumps([{'id':r['id'],'status':r['status'],'sourceState':r.get('sourceState')}for r in observed],ensure_ascii=False,separators=(',',':')),'limite':'Contrôles source et qualifications déclarés, sans certification des usages ; échec d’enregistrement conservé. La reprise possède sa propre exécution.',
 'champs_declares_par_instrument':json.dumps(controls,ensure_ascii=False,separators=(',',':')),'portee_inconnue':json.dumps(source['unknownFieldScopes'],ensure_ascii=False,separators=(',',':')),'phase_collecte':source['phase']['collection'],'phase_validation':source['phase']['validation'],'phase_enregistrement':source['phase']['recording'],'phase_publication':source['phase']['publication'],'preuve_detaillee':'preuves/reprise-20261025/controle-mensuel-production-scope.json'})
with path.open('w',encoding='utf-8-sig',newline='')as stream:
 writer=csv.DictWriter(stream,list(rows[0]),delimiter=';');writer.writeheader();writer.writerows(rows)
assert len(controls)==8
print('One production collection, 8 exact instrument/field scopes; unknown field scopes and failed recording retained separately.')
