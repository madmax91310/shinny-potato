"""Reconcile current published contracts by meaning, never by a shifted catalogue index."""
import csv,gzip,pathlib,json,collections,datetime,hashlib
csv.field_size_limit(16000000)
r=pathlib.Path('/dev/shm/data-automation-20261028');out=r/'consolidated-30oct';current=r/'matrix-final-30oct'
def read(p):
 with gzip.open(p,'rt',encoding='utf-8-sig',newline='')as f:q=csv.DictReader(f,delimiter=';');return q.fieldnames,list(q)
oldcols,old=read(out/'matrice-donnees-usages.csv.gz');newcols,new=read(current/'matrice-donnees-usages.csv.gz');initial={x['id_suivi']for x in old}
def semantic(x):return (x['route'],x['actif_identifiant'],x['donnee'],x['cle_champ'].split(':')[0])
oldcounts=collections.Counter(semantic(x)for x in old)
by=collections.defaultdict(list)
for x in new:by[semantic(x)].append(x)
cols=list(dict.fromkeys(oldcols+newcols+['id_publication_30oct','presence_usage_30oct','liaison_semantique_30oct']))
rows=[];used=set();matched=set();cross=[]
retired={'IE00BKPX3K41','IE00BMW42413','IE00BKPSFC54','DE000A27Z304','GB00BLD4ZL17','GB00BLD4ZM24'}
for prior in old:
 candidates=by[semantic(prior)]
 if len(candidates)==1 and oldcounts[semantic(prior)]==1:
  live=candidates[0];x={**prior,**live,'id_suivi':prior['id_suivi'],'id_publication_30oct':live['id_suivi'],'presence_usage_30oct':'présent dans l’inventaire public courant','liaison_semantique_30oct':'route, identité, libellé de donnée et famille de contrat identiques ; numéro de champ non utilisé comme preuve'}
  matched.add(live['id_suivi'])
  # Dated consumer proofs remain bounded. A later observation needs its own
  # qualification; it cannot inherit an old positive consumer certification.
  if prior['etat']=='A' and prior.get('preuve_intervention_30oct') and prior['derniere_donnee']==live['derniere_donnee']:
   for k in ['etat','nature_ecart','blocage','preuve_intervention_30oct','usage_verifie_30oct','limite_preuve_30oct']:x[k]=prior[k]
   x['limite_preuve_30oct']+=' Preuve datée du consommateur conservée sur la même période ; les autres champs ne sont pas certifiés.'
  if prior['etat']=='non applicable'and(prior.get('requise')=='False' or prior['nature']in{'archive','simulation','reference','editorial'}):
   for k in ['etat','requise','nature','nature_ecart','blocage','preuve_intervention_30oct','usage_verifie_30oct','limite_preuve_30oct']:x[k]=prior.get(k,'')
 else:
  x=dict(prior);x.update(id_publication_30oct='',presence_usage_30oct='contrat historique conservé ; correspondance actuelle non démontrée',liaison_semantique_30oct='absent ou ambigu dans l’inventaire courant ; absence seule non utilisée pour déclarer une réparation')
  if prior['actif_identifiant']in retired and prior['donnee']=='Historique de simulation 2020–2025':x.update(etat='non applicable',requise='False',nature='archive',nature_ecart='ancien proxy archivé, remplacé dans cet usage par le calendrier exact non vide',blocage='Le champ historique reste une preuve du passé ; il n’est plus une donnée vivante requise. Les refus mensuels et anciennes divergences restent suivis séparément.',preuve_intervention_30oct='PR#1097 et test-exact-share-annual-consumers.mjs',limite_preuve_30oct='Retrait du raccordement proxy ; aucune année financière manquante inventée.')
  elif prior['route']!='/le-budget-de'and prior['requise']=='True'and prior['nature']not in{'reference','archive','simulation','editorial'}:x.update(etat='B',nature_ecart='preuve documentaire ou qualification incomplète',blocage='Correspondance actuelle du contrat historique à qualifier ; aucune panne déduite de cette seule absence. '+prior.get('blocage',''))
 rows.append(x);used.add(x['id_suivi']);cross.append({'id_origine':prior['id_suivi'],'id_publication':x.get('id_publication_30oct',''),'statut_liaison':x['presence_usage_30oct'],'route':x['route'],'actif':x['actif_identifiant'],'donnee':x['donnee']})
for live in new:
 if live['id_suivi']in matched:continue
 x=dict(live);key=live['id_suivi']
 if key in used:key='usage-courant30oct:'+hashlib.sha256(('|'.join(semantic(live))+'|'+live['id_suivi']).encode()).hexdigest()[:24]
 assert key not in used,('Ambiguous current contract',semantic(live));used.add(key)
 x.update(id_suivi=key,id_publication_30oct=live['id_suivi'],presence_usage_30oct='nouveau contrat public courant, ajouté sans perdre les identités initiales',liaison_semantique_30oct='identité nouvelle ; aucun indice de catalogue réutilisé silencieusement')
 rows.append(x)
assert len(used)==len(rows)and initial<=used
with gzip.open(out/'matrice-donnees-usages.csv.gz','wt',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=cols,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows)
with gzip.open(out/'liaison-identites-matrice.csv.gz','wt',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=list(cross[0]),delimiter=';',lineterminator='\n');w.writeheader();w.writerows(cross)
b=json.loads((out/'matrice-bilan.json').read_text());b.update(generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),usages=len(rows),outils=len({x['route']for x in rows}),profils_identifiants_uniques=len({x['actif_identifiant']for x in rows}),statuts=dict(collections.Counter(x['etat']for x in rows)),types=dict(collections.Counter(x['nature']for x in rows)),diagnostics=dict(collections.Counter(x['nature_ecart']for x in rows)),currentPublishedContracts=len(new),currentContractsMatchedByMeaning=len(matched),previousContractIdentitiesPreserved=len(initial),currentPublishedInputReceipt='preuves/reprise-2026-10-30/published-inputs-final-30oct.json',notAnAutomationCoverageRate=True)
(out/'matrice-bilan.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n');print({k:b[k]for k in['usages','outils','statuts','currentPublishedContracts','currentContractsMatchedByMeaning','previousContractIdentitiesPreserved']})
