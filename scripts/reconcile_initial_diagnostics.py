"""Reconcile an immutable initial inventory with the public inbox, without editing supervision."""
import argparse,csv,datetime as dt,json,pathlib,collections

def stamp(value):
 try:return dt.datetime.fromisoformat(str(value).replace('Z','+00:00')).timestamp()
 except (ValueError,TypeError):return None

def index_rows(rows,wanted):
 result=collections.defaultdict(list)
 def walk(node,parent):
  if isinstance(node,dict):
   for key in ['id','key']:
    value=node.get(key)
    if isinstance(value,str)and value in wanted and parent not in result[value]:result[value].append(parent)
   for value in node.values():
    if isinstance(value,(dict,list)):walk(value,parent)
  elif isinstance(node,list):
   for value in node:walk(value,parent)
 for row in rows:walk(row,row)
 return result

def proved_resolution(row,initial):
 evidence=row.get('resolutionEvidence')
 if not isinstance(evidence,dict):return False
 after=stamp(evidence.get('checkedAt')or evidence.get('completedAt'));failed=stamp(initial.get('completedAt')or initial.get('attemptedAt')or initial.get('firstSeenAt'))
 if after is None or failed is None or after<=failed:return False
 # Same identity alone does not bind a historical workflow episode: require
 # its run and the named failed steps, not an unrelated green workflow.
 if initial['id'].startswith('workflow:'):
  if row.get('runId')!=initial.get('runId'):return False
  checks=evidence.get('checks',[])
  if not initial.get('failedSteps')or not all(any(c.get('step')==s.get('step') and c.get('job')==s.get('job')for c in checks)for s in initial['failedSteps']):return False
 return bool(evidence.get('sourceUrl')or evidence.get('runUrl'))

def reconcile(initial_rows,originals,public_rows,active_rows,monitor):
 wanted={r['id']for r in initial_rows};old={r['id']:r for r in originals};all_index=index_rows(public_rows,wanted);active_index=index_rows(active_rows,wanted);resolved=collections.defaultdict(list)
 for r in monitor.get('monitoring',{}).get('resolved',[]):resolved[r['id']].append(r)
 output=[]
 for row in initial_rows:
  key=row['id'];initial=old.get(key,{'id':key});matches=all_index[key];active=active_index[key];raw=monitor.get('monitoring',{}).get('active',{}).get(key);proofs=[r for r in resolved[key]if proved_resolution(r,initial)];photo=initial.get('qualificationInitialeRadar')=='superseded-period';kinds={r.get('kind')for r in active};history=bool(resolved[key])or any(r.get('kind')=='history'for r in matches);qualification=bool(kinds&{'qualification','monitoring'})or bool(raw and raw.get('proofStatus')=='resolution-unproven')or bool(resolved[key]and not proofs)
  w=monitor.get('workflows',{}).get(initial.get('workflow'),{});steps=[r.get('step','')for r in initial.get('failedSteps',[])];stage='recordingStatus'if any('Commit validated observations'in s for s in steps)else'publicationStatus'if any('Verify actual public data'in s for s in steps)else'validationStatus'if any('test-income-nav-consumers'in s for s in steps)else None
  newer=stamp(w.get('completedAt'))is not None and stamp(initial.get('completedAt'))is not None and stamp(w['completedAt'])>stamp(initial['completedAt'])
  mechanism=bool(stage and w.get(stage)=='success'and newer)
  source_kind=(raw or {}).get('kind')
  conflict=bool(source_kind=='conflict'and not photo)
  overdue=bool(source_kind=='freshness'and not photo)
  qualification=qualification or source_kind in ['review','qualification','monitoring']
  failure=bool('failure'in kinds and source_kind in ['collection','checks','publication'] and not mechanism and not photo and (raw or {}).get('proofStatus')!='resolution-unproven')
  if photo:state='photographie dépassée ; contradiction historique conservée'
  elif proofs:state='résolution de l’épisode initial prouvée'+(' ; autre signal actuel conservé'if active else' ; historique conservé')
  elif mechanism:state='étape technique rétablie ; ancien périmètre restant à qualifier'if qualification else'étape technique rétablie ; trace historique conservée'
  elif conflict:state='conflit financier ou documentaire actif'
  elif overdue:state='contrôle source en retard ; valeur erronée non déduite'
  elif source_kind=='history':state='historique conservé ; pas de panne active déduite'
  elif failure:state='échec actif de collecte, validation ou publication'
  elif qualification:state='qualification encore manquante ; pas assimilée à une panne active'
  elif history:state='historique conservé ; résolution non déduite sans preuve'
  elif active:state='signal actuel : '+', '.join(sorted(kinds))
  else:state='absent de la boîte actuelle ; résolution non démontrée'
  x=dict(row);x['statut_avant_28oct']=row.get('statut','');x.update(statut=state,historique_initial_conserve=True,trace_historique_moniteur=history,presence_boite_active=bool(active),presence_brute_moniteur=raw is not None,panne_actuelle_demontree=failure,resolution_episode_initial_prouvee=bool(proofs),photographie_depassee=photo,qualification_manquante=qualification,etape_technique_retablie=mechanism,conflit_actuel=conflict,controle_en_retard=overdue,genre_signal_initial_actuel=source_kind,classes_boite_actuelle=json.dumps(sorted(kinds),ensure_ascii=False),run_initial=initial.get('runUrl',''),ids_groupes_actuels=json.dumps(sorted({r['id']for r in active})),preuve_resolution_28oct=json.dumps([{'resolvedAt':r.get('resolvedAt'),'runId':r.get('runId'),'resolutionEvidence':r['resolutionEvidence']}for r in proofs],ensure_ascii=False),preuve_etape_28oct=json.dumps({'stage':stage,'status':w.get(stage),'runId':w.get('runId'),'runUrl':w.get('runUrl'),'completedAt':w.get('completedAt'),'scopeLimit':'La réussite de cette étape ne certifie pas les champs/instruments non tentés de l’ancien run.'}if mechanism else{},ensure_ascii=False),moniteur_observe_le=monitor.get('updatedAt'),preuve_28oct='Export public complet action/all et moniteur réellement chargés ; preuves/reprise-28oct/public/');output.append(x)
 if len(output)!=len(wanted):raise ValueError('Duplicate or lost initial identity')
 return output

def main():
 p=argparse.ArgumentParser();p.add_argument('--initial-csv',type=pathlib.Path,required=True);p.add_argument('--original-json',type=pathlib.Path,required=True);p.add_argument('--public-dir',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();load=lambda name:json.loads((a.public_dir/name).read_text());rows=list(csv.DictReader(a.initial_csv.open(encoding='utf-8-sig'),delimiter=';'));result=reconcile(rows,json.loads(a.original_json.read_text()),load('diagnostics-all.json')['rows'],load('diagnostics-action.json')['rows'],load('automation-status.json'));a.output.parent.mkdir(parents=True,exist_ok=True)
 with a.output.open('w',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=list(result[0]),delimiter=';');w.writeheader();w.writerows(result)
 summary={'initial':len(rows),'exportComplet':len(load('diagnostics-all.json')['rows']),'exportActif':len(load('diagnostics-action.json')['rows']),'statuts':dict(collections.Counter(r['statut']for r in result)),'axesNonExclusifs':{k:sum(bool(r[k])for r in result)for k in ['presence_boite_active','trace_historique_moniteur','panne_actuelle_demontree','resolution_episode_initial_prouvee','photographie_depassee','qualification_manquante','etape_technique_retablie','conflit_actuel','controle_en_retard']},'denominateur':'Identités initiales ; axes non exclusifs, pas nombre de causes distinctes. Une trace active de qualification ne démontre pas une panne actuelle.'};a.output.with_suffix('.bilan.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
