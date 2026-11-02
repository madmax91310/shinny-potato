"""Append current observations to the existing consolidated ledgers, never certify disappearance."""
import csv,gzip,io,json,pathlib,sys,collections,runpy
csv.field_size_limit(8000000)
base,capture,matrix_dir,out=map(pathlib.Path,sys.argv[1:]);out.mkdir(parents=True,exist_ok=True)
def read(p):
 raw=p.read_bytes();raw=gzip.decompress(raw) if p.suffix=='.gz' else raw;r=csv.DictReader(io.StringIO(raw.decode('utf-8-sig')),delimiter=';');return list(r.fieldnames),list(r)
def write(p,fields,rows):
 s=io.StringIO(newline='');w=csv.DictWriter(s,fieldnames=fields,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows);raw=s.getvalue().encode('utf-8-sig');p.write_bytes(gzip.compress(raw,mtime=0) if p.suffix=='.gz' else raw)
def js(name):return json.loads(gzip.decompress((capture/(name+'.json.gz')).read_bytes()))
allrows=js('diagnostics-all')['rows'];active=js('diagnostics-action')['rows'];cur={r.get('id',r.get('key')):r for r in allrows};act={r.get('id',r.get('key')) for r in active};assert len(cur)==len(allrows) and act<=set(cur)
observed=dict(cur);origin={k:'preuves/reprise-2026-11-02/public-final/diagnostics-all.json.gz#'+k for k in cur}
history_names=['public-release-8001d05','public-after-radar-9f2c','public-after-monthly-1e2','public-after-1137-records','public-final-2nov','public-final-2nov-live']
for history_name in history_names:
 path=capture.parent/history_name/'diagnostics-all.json.gz'
 if not path.exists():continue
 for x in json.loads(gzip.decompress(path.read_bytes()))['rows']:
  k=x.get('id',x.get('key'))
  if k not in observed:observed[k]=x;origin[k]='preuves/reprise-2026-11-02/photographies-intermediaires/'+history_name+'/diagnostics-all.json.gz#'+k
proof='preuves/reprise-2026-11-02/public-final/';extra=['diagnostic_id_2nov','presence_2nov','classe_2nov','nature_2nov','motif_2nov','run_2nov','preuve_2nov','limite_2nov','preuve_observation_2nov_origine','observation_constatee_2nov']
def classify(x):
 kind=x['kind'];cause=x.get('cause','')
 if kind=='failure':
  if 'Monthly NAV/return end not independently qualified' in cause:return 'qualification de borne mensuelle ; période antérieure conservée'
  if 'contradictoir' in cause.lower() or 'conflit' in cause.lower() or 'Poids différents' in cause:return 'conflit financier/documentaire ; arbitrage non démontré'
  if 'Commit validated observations' in cause:return 'enregistrement refusé ; collecte et publication à distinguer'
  if 'Échéance de vérification' in cause:return 'calendrier à rapprocher de la source ; panne non déduite'
  return 'défaut individuel à conserver ; voir dernière observation'
 return {'monitoring':'preuve de surveillance/incomplétude de rapport ; pas autant de pannes de données','qualification':'preuve/qualification par usage non démontrée ; panne non déduite','connection':'raccordement ou preuve externe à qualifier','waiting':'attente normale déclarée','not-applicable':'non applicable ou archive','editorial':'revue humaine / hypothèse / contenu éditorial','history':'trace historique'}.get(kind,'classification à vérifier')
def decorate(r,k):
 previous=observed.get(k);r['preuve_observation_2nov_origine']=origin.get(k,'');r['observation_constatee_2nov']=json.dumps({f:previous.get(f)for f in ['id','kind','name','field','tools','cause','runId','stage']} ,ensure_ascii=False)if previous else''
 x=cur.get(k);r.update(diagnostic_id_2nov=k or '',presence_2nov='actif' if k in act else 'historique ou hors boîte active' if x else 'absent de cette photographie ; résolution non déduite',classe_2nov=x['kind'] if x else '',nature_2nov=classify(x) if x else 'identité antérieure conservée',motif_2nov=x.get('cause','') if x else '',run_2nov=str(x.get('runId','')) if x else '',preuve_2nov=proof+'diagnostics-all.json.gz'+('#'+k if k else ''),limite_2nov='Une présence, absence ou réussite globale ne certifie pas une réparation ; preuves natives et consommateurs bornés séparés.')
 return r
# Canonical union already contains the five intermediate identities absent from the initial/final pair.
oldcsv=base/'preuves/reprise-2026-11-01/reconciliation-diagnostics-1nov.csv';fields,diag=read(oldcsv);old_diag=[r['diagnostic_id'] for r in diag];seen=set(old_diag)
for x in observed.values():
 k=x.get('id',x.get('key'))
 if k not in seen:diag.append({'diagnostic_id':k});seen.add(k)
fields += [f for f in extra if f not in fields]
for r in diag:decorate(r,r['diagnostic_id'])
assert old_diag==[r['diagnostic_id'] for r in diag[:len(old_diag)]];assert set(cur)<=seen
write(out/'reconciliation-diagnostics-2nov.csv.gz',fields,diag)
fields,ledger=read(base/'suivi-consolide.csv.gz');old_ledger=[r['id_suivi'] for r in ledger];fields += [f for f in extra if f not in fields];seen_ids=set(old_ledger);linked=set()
for r in ledger:
 keys=[r.get('diagnostic_id_1nov'),r.get('diagnostic_id_29oct'),r.get('id_suivi')];k=next((k for k in keys if k in observed),None)
 if k:decorate(r,k);linked.add(k)
 else:r.update(presence_2nov='ligne antérieure conservée ; pas de rapprochement exact actuel',limite_2nov='Ne constitue ni une panne nouvelle ni une résolution.')
for k in sorted(set(observed)-linked):
 uid='diagnostic_2nov:'+k;assert uid not in seen_ids;seen_ids.add(uid);x=observed[k];r={'id_suivi':uid,'axe':'diagnostic public daté ; suivi consolidé existant','type_defaut':classify(x),'reliquat_actif':str(k in act),'probleme':x.get('cause',''),'outils':json.dumps(x.get('tools',[]),ensure_ascii=False),'origines':'export public actuel ; identités antérieures conservées'};ledger.append(decorate(r,k))
_,matrix=read(matrix_dir/'matrice-donnees-usages.csv.gz');matrix_added=[]
for r in matrix:
 uid=r['id_suivi']
 if uid in seen_ids:continue
 seen_ids.add(uid);matrix_added.append(uid);ledger.append({'id_suivi':uid,'axe':'contrat données×usage ; déclaration documentaire','type_defaut':'preuve par usage ; aucune panne déduite','statut_donnees':r['etat'],'probleme':r['blocage'],'outils':r['outil'],'origines':'matrice unique actualisée ; contrats ajoutés depuis#1130 et autres déclarations conservées','presence_2nov':r['presence_usage_2nov_courant'],'classe_2nov':'contrat consommateur, pas diagnostic de panne','preuve_2nov':'matrice-donnees-usages.csv.gz#'+uid,'limite_2nov':'Une qualification non confirmée ne devient pas une panne ; les sources mutualisées doivent être rapprochées champ par champ.'})
assert old_ledger==[r['id_suivi'] for r in ledger[:len(old_ledger)]];assert len(seen_ids)==len(ledger)
write(out/'suivi-consolide.csv.gz',fields,ledger)
fields,remaining=read(base/'restant-a-verifier.csv.gz');old_remaining=[r['id_suivi'] for r in remaining];fields += [f for f in extra if f not in fields];by={r['id_suivi']:r for r in ledger};seen_remaining=set(old_remaining)
for r in remaining:r.update({f:by[r['id_suivi']].get(f,'') for f in extra})
for r in ledger:
 if r['id_suivi'] in seen_remaining or r.get('presence_2nov')!='actif':continue
 remaining.append({k:r.get(k,'') for k in fields});seen_remaining.add(r['id_suivi'])
for r in matrix:
 if r['id_suivi'] in seen_remaining or r['presence_usage_2nov_courant']!='True' or r['requise_2nov_courant']!='True':continue
 if r['etat'].startswith('A') or r['etat']=='non applicable':continue
 remaining.append({'id_suivi':r['id_suivi'],'axe':'preuve données×usage à rapprocher ; pas une panne présumée','probleme':r['blocage'],'outils':r['outil'],'presence_2nov':'contrat requis présent ; preuve/usage à qualifier','preuve_2nov':'matrice-donnees-usages.csv.gz#'+r['id_suivi'],'limite_2nov':'Déclaration distincte des défaillances actuelles et de leurs causes mutualisées.'});seen_remaining.add(r['id_suivi'])
assert old_remaining==[r['id_suivi'] for r in remaining[:len(old_remaining)]];write(out/'restant-a-verifier.csv.gz',fields,remaining)
fields,initial=read(base/'perimetre-initial-complet.csv.gz');fields += [f for f in extra if f not in fields];assert len(initial)==661
for r in initial:decorate(r,r['id'])
write(out/'perimetre-initial-complet.csv.gz',fields,initial)
fields,financial=read(base/'reconciliation-79-ecarts.csv');old_cases=[(r['isin'],r['year']) for r in financial];pub=json.loads((capture/'financial-reconciliation.json').read_text());pub={r['id']:r for r in pub['rows'] if r.get('open') or r.get('residualOpen')};assert len(financial)==len(pub)==79;fields += [f for f in ['qualification_mensuelle_2nov','voies_publiques_2nov','preuve_2nov','limite_2nov'] if f not in fields];qualified=0
for r in financial:
 k=r['isin']+'/'+r['year'];windows=pub[k].get('currentConsumer',{}).get('windows',[]);ok=any(w.get('qualification',{}).get('qualified') for w in windows);qualified+=ok;r.update(qualification_mensuelle_2nov=str(ok),voies_publiques_2nov=json.dumps(windows,ensure_ascii=False),preuve_2nov=proof+'financial-reconciliation.json#'+k,limite_2nov='Usage indépendant distinct de l’explication de l’ancienne cotation ;77divergences et2résidus conservés.')
assert old_cases==[(r['isin'],r['year']) for r in financial];assert qualified==70;write(out/'reconciliation-79-ecarts.csv',fields,financial)
summary={'oldDiagnosticIdentitiesPreserved':len(old_diag),'canonicalDiagnosticIdentitiesAfter':len(diag),'allIntermediateObservedIdentities':len(observed),'currentPublicDiagnostics':len(cur),'currentActiveDiagnostics':len(act),'activeClasses':dict(collections.Counter(cur[k]['kind'] for k in act)),'initial661Preserved':len(initial),'oldLedgerRowsPreserved':len(old_ledger),'ledgerRowsAfter':len(ledger),'previousMatrixIdentitiesNotPreviouslyInLedgerAdded':len(matrix_added),'oldRemainingRowsPreserved':len(old_remaining),'remainingRowsAfter':len(remaining),'old79CasesPreserved':len(financial),'qualifiedMonthlyWindows':qualified,'refusedMonthlyWindows':79-qualified,'limit':'Rows are identities/contracts and history, not a count of independent outages. Absence never closes a cause without bounded evidence.'};(out/'ledger-current-reconciliation.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False))
