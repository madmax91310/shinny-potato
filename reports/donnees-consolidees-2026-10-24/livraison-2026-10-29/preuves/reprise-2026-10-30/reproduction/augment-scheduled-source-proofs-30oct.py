import pathlib,csv,gzip,json
r=pathlib.Path('/dev/shm/data-automation-20261028');o=r/'consolidated-30oct';p=r/'proofs-29oct';csv.field_size_limit(16000000)
full=json.loads((p/'six-native-aum-scheduled-proof-30oct.json').read_text());source=json.loads((p/'seven-native-aum-scheduled-source-only-proof-30oct.json').read_text());by={x['isin']:('chaîne source→enregistrement→publication observée sur cron première tentative41068552867','six-native-aum-scheduled-proof-30oct.json')for x in full['rows']};by.update({x['isin']:('collecte fournisseur planifiée première tentative41068013127 démontrée ; enregistrement refusé à cette tentative, publication ultérieure distincte','seven-native-aum-scheduled-source-only-proof-30oct.json')for x in source['rows']})
with gzip.open(o/'matrice-donnees-usages.csv.gz','rt',encoding='utf-8-sig',newline='')as f:q=csv.DictReader(f,delimiter=';');cols=list(q.fieldnames);rows=list(q)
new='preuve_cron_fournisseur_30oct'
if new not in cols:cols.append(new)
updated=0
for x in rows:
 if x['actif_identifiant']not in by or x['donnee']!='Encours' or x['route']not in ['/fiches-etf','/bibliotheque-donnees']:continue
 text,file=by[x['actif_identifiant']];x[new]=text+' ; preuves/reprise-2026-10-30/'+file;x['limite_preuve_30oct']+=' Complément vérifié : '+text+'. La preuve ne certifie aucun autre champ ni un futur passage.';updated+=1
assert updated==26,updated
with gzip.open(o/'matrice-donnees-usages.csv.gz','wt',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=cols,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows)
print('13 exact AUM fields /26 existing consumer contracts have individually scoped scheduled-source proof;6 full scheduled publications,7 source only')
