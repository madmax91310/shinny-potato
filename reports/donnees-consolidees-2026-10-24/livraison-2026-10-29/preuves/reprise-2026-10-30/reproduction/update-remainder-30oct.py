import csv,gzip,pathlib,json,collections
csv.field_size_limit(16000000)
r=pathlib.Path('/dev/shm/data-automation-20261028');base=pathlib.Path('/workspace/finalisation-donnees-20261027');out=r/'consolidated-30oct'
def read(p):
 with (gzip.open(p,'rt',encoding='utf-8-sig',newline='')if p.suffix=='.gz'else p.open(encoding='utf-8-sig',newline=''))as f:q=csv.DictReader(f,delimiter=';');return q.fieldnames,list(q)
names,old=read(base/'restant-a-verifier.csv.gz');_,matrix=read(out/'matrice-donnees-usages.csv.gz');_,actions=read(out/'statut-19-actions.csv');_,ledger=read(out/'suivi-consolide.csv.gz');by={x['id_suivi']:x for x in matrix};acts={'action:'+x['action']:x for x in actions};diag={x['id_suivi']:x for x in ledger};extra=['statut_final_30oct','nature_reliquat_final_30oct','limite_usage_finale_30oct','preuve_finale_30oct'];rows=[];ids=set()
for x in old:
 key=x['id_suivi'];assert key not in ids;ids.add(key);x.update(statut_final_30oct=x['statut_final_29oct'],nature_reliquat_final_30oct=x['nature_reliquat_final_29oct'],limite_usage_finale_30oct=x['limite_usage_finale_29oct'],preuve_finale_30oct=x['preuve_finale_29oct'])
 if key in by:
  q=by[key]
  if q.get('preuve_intervention_30oct'):x.update(statut_final_30oct='corrigé et vérifié sur le périmètre exact'if q['etat']=='A'else'non applicable'if q['etat']=='non applicable'else'limite financière conservée',nature_reliquat_final_30oct=q['nature_ecart'],limite_usage_finale_30oct=q.get('limite_preuve_30oct',''),preuve_finale_30oct=q['preuve_intervention_30oct'])
 elif key in acts:
  q=acts[key];x.update(statut_final_30oct=q['statut'],limite_usage_finale_30oct=q['limitation'],preuve_finale_30oct=q['preuve_production_30oct']or q['preuves'])
 elif key in diag and diag[key].get('presence_publique_30oct'):
  q=diag[key];x.update(statut_final_30oct=q['statut_30oct'],nature_reliquat_final_30oct=q['categorie_30oct'],limite_usage_finale_30oct=q['piece_manquante_30oct'],preuve_finale_30oct=q['preuve_30oct'])
 rows.append(x)
# A reopened action must reappear in the same follow-up, never a parallel list.
for key,q in acts.items():
 if key not in ids and q['statut']=='partiellement corrigée':rows.append({'id_suivi':key,'axe':'fiabilité et automatisation','statut_final_29oct':q['statut_avant_30oct'],'nature_reliquat_final_29oct':'action consolidée','probleme':q['constat_initial'],'outils':q['outils'],'limite_usage_finale_29oct':'État antérieur conservé dans statut-19-actions.csv','preuve_finale_29oct':q['preuves'],'origines':'Réouverture explicite30octobre sur observations ordinaires actuelles','statut_final_30oct':q['statut'],'nature_reliquat_final_30oct':'régression d’accès source démontrée','limite_usage_finale_30oct':q['limitation'],'preuve_finale_30oct':q['preuve_production_30oct']});ids.add(key)
assert {x['id_suivi']for x in old}<={x['id_suivi']for x in rows}
with gzip.open(out/'restant-a-verifier.csv.gz','wt',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=names+extra,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows)
print({'priorIdentitiesPreserved':len(old),'currentFollowupRows':len(rows),'notAnActiveOutageCount':True})
