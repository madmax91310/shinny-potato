"""One provenance-preserving follow-up for reliability and Données à revoir; no collection."""
import argparse, collections, copy, csv, datetime as dt, hashlib, json, pathlib, re, subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT=ROOT/'reports/donnees-consolidees-2026-10-24'

def read_csv(path):
    # Published receipts contain hundreds of file hashes; retain their evidence
    # when the next consolidation rereads its own CSV. Keep a bounded parser.
    previous_limit=csv.field_size_limit(16*1024*1024)
    try:
        with path.open(encoding='utf-8-sig',newline='')as f:return list(csv.DictReader(f,delimiter=';'))
    finally:csv.field_size_limit(previous_limit)
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
def identity(row):
    d,k=row['dimension'],row['cle']
    if d=='contrôle de séance ultérieure':return 'incident:collection:update-ai-portfolios.yml:'+row['id']
    if d=='comparaison financière':return 'financial:'+k
    if d=='incident après intégration' and row.get('champ')=='Clôture quotidienne ajustée':return 'incident:collection:update-ai-portfolios.yml:'+row['id']
    if d=='reliquat historique initial'and (row['id'].startswith(('scripts/','src/'))):return 'module:'+row['id']
    if d=='reliquat historique initial'and re.fullmatch(r'P[0-3]-\d+',row['id']):return 'action:'+row['id']
    if d=='échec individuel initial':return 'incident:collection:'+k
    if d=='reliquat historique initial'and re.fullmatch(r'[A-Z]{2}[A-Z0-9]{10}/20\d\d',row['id']):return 'financial:'+row['id']
    if d in ['couverture','raccordement initial']:return 'capability:'+k
    if d=='usage requis initial':return 'usage:'+k
    if d.startswith('incident historique'):return 'incident:'+re.sub(r'^\d+:','',k)
    if d in ['incident actif initial','incident actif au contrôle final','incident après intégration','incident après collecte ordinaire']:return 'incident:'+k
    if d in ['module qualifié','rôle de module actuel','rôle de module après intégration']:return 'module:'+row['id']
    if d=='action historique':return 'action:'+k
    return d+':'+k

def consolidate(legacy,inventory,financial,forensics,actions,modules,monitor,review,repairs=None,validated=False,reconciliations=None,previous=None):
    cases={}
    # Episodes discovered after the initial audit must survive the next capture.
    # Their disappearance from active/resolved lists is not a proof of recovery.
    for row in previous or []:
        if not row['id_suivi'].startswith('incident:'):continue
        retained=copy.deepcopy(row)
        for key in ['origines','details','preuves','outils']:
            if isinstance(retained.get(key),str):retained[key]=json.loads(retained[key])
        for key in ['reliquat_actif','verification_en_attente']:
            if isinstance(retained.get(key),str):retained[key]=retained[key]=='True'
        retained['origines']=[]  # Reattached exactly once from the immutable inventory below.
        cases[row['id_suivi']]=retained
    def item(key,axis=None,kind=None):
        result=cases.setdefault(key,{'id_suivi':key,'axe':axis or 'fiabilité','type_defaut':kind or 'qualification','statut_donnees':'non revérifié dans cette reprise','statut_supervision':'non applicable','reliquat_actif':False,'niveau_preuve':'instantané hérité, pas nouvelle certification','probleme':'','piece_manquante':'','outils':[],'preuves':[],'origines':[],'details':{}})
        if axis is not None:result['axe']=axis
        if kind is not None:result['type_defaut']=kind
        return result
    for r in legacy:
        c=item(identity(r));c['origines'].append({'dimension':r['dimension'],'cle':r['cle'],'avant':r['avant'],'etat_source':r['apres'],'sha256_ligne':digest(r)})
        c['details'].setdefault('etat_herite',r['apres']);c['details'].setdefault('motif_herite',r['motif'])
        c['preuves']=list(dict.fromkeys([*c['preuves'],r['preuve']]))
    pending={'connector-needed','tracked-index-needed','not-published','unqualified','manual','source-conflict','collection-error','blocked','unconfirmed'}
    for r in inventory['connections']:
        key='capability:'+':'.join(str(r[k])for k in ['type','id','field']);c=item(key,'raccordement'if r['actionState']in ['connector-needed','tracked-index-needed']else'collecte et actualisation')
        c.update(statut_donnees=r['actionState'],reliquat_actif=bool(r.get('requiresAction')),niveau_preuve='registre courant ; observation et contrôle distingués',probleme=r.get('reason')or'',piece_manquante=r.get('nextAction')or'',outils=r.get('tools',[]),details=r,preuves=['public/data/data-automation-inventory.json'])
        if r['actionState']=='not-published':c['type_defaut']='limite documentaire ou publication non annoncée'
        elif r['actionState']=='collection-error':c['type_defaut']='donnée ou accès fournisseur'
        elif r['actionState']in ['not-applicable','outside-equity-scope']:c.update(type_defaut='non applicable',reliquat_actif=False)
    usage={t['path']+'|'+r['id']+'|'+r['key']:{**r,'tool':t['path']}for t in inventory['consumerUsage']['tools']for r in t['rows']}
    for key,r in usage.items():
        c=item('usage:'+key,'raccordement','contrat de donnée par usage')
        c.update(statut_donnees=r['state'],reliquat_actif=bool(r.get('required')and r['state']in ['blocked','unconfirmed','qualification-needed','scheduled-evidence']),niveau_preuve='contrat actuel du consommateur ; pas admission déduite de la collecte',outils=[r['tool']],details=r,preuves=['public/data/data-automation-inventory.json'])
    for key,c in cases.items():
        if key.startswith('usage:')and key[6:]not in usage:
            c.update(statut_donnees='contrat absent du registre actuel, à vérifier',niveau_preuve='non vérifié ; absence ne vaut pas résolution',piece_manquante='Identité du contrat courant ou preuve de retrait.')
    forensic={r['isin']+'/'+r['year']:r for r in forensics}
    for r in financial['rows']:
        k=r['isin']+'/'+str(r['year']);c=item('financial:'+k)
        c.update(statut_donnees=r['status'],reliquat_actif=bool(r.get('open')or r.get('residualOpen')),niveau_preuve='preuves financières conservées ; qualification des fenêtres courantes',probleme=r.get('reason',''),piece_manquante=forensic.get(k,{}).get('missingPiece')or r.get('missingPiece',''),outils=['Calculateur','Performance depuis','Classements','Portefeuilles'],details={'diagnostic':r,'investigation':forensic.get(k)},preuves=['public/data/financial-reconciliation.json','sources/reconciliation-79-ecarts.csv'])
    for r in actions:
        item('action:'+r['action']).update(statut_donnees=r['statut'],reliquat_actif=r['statut']in ['bloquée','partiellement corrigée'],niveau_preuve='bilan cumulé ; détail des cas dans ce même suivi',probleme=r['limitation'],details=r,preuves=['sources/statut-19-actions.csv'])
    for r in modules:
        item('module:'+r['module']).update(statut_donnees=r['statut'],axe='fiabilité',type_defaut='vérification de module',niveau_preuve='périmètre individuel hérité ; test local distinct du fournisseur',reliquat_actif=False,probleme=r.get('reliquat',''),details=r,preuves=['sources/modules-verification.csv'])
    reviews={r['id']:r for r in [*review['schedule'],*review['items']]}
    for k,c in cases.items():
        if not k.startswith('revue initiale:'):continue
        r=reviews.get(k.split(':',1)[1])
        if r:c.update(statut_donnees=r['category'],axe='fiabilité',type_defaut='revue ou contrôle, pas panne automatique',reliquat_actif=r['category']in ['stale','expired','reserve','undated','future-date'],niveau_preuve='calendrier actuel, source et revue séparées',probleme=r.get('reason',''),outils=r.get('tools',[]),details=r,preuves=['preuves/revue-courante.json'])
    active=monitor['monitoring']['active'];resolved={r['id']:r for r in monitor['monitoring'].get('resolved',[])};retired={r['id']:r for r in monitor['monitoring'].get('retired',[])}
    for workflow,row in monitor.get('workflows',{}).items():
        for identifier,proof in row.get('retiredDataFailures',{}).items():
            key='collection:'+workflow+':'+identifier
            retired.setdefault(key,{'id':key,**proof})
    for k,c in list(cases.items()):
        if k.startswith('incident:')and k[9:]not in active:
            old=resolved.get(k[9:])or retired.get(k[9:]);c.update(axe='supervision',statut_supervision='résolution/retour historique prouvé'if old else'non actif dans la capture ; clôture financière non déduite',reliquat_actif=False)
            historical_resolution=any(o['etat_source'] in ('resolved','résolu dans le moniteur de production') for o in c['origines'])
            if old or historical_resolution:
                c.update(statut_donnees='non applicable (cycle de supervision)',statut_supervision=('retrait documenté d’une attribution ; aucune réparation financière déduite' if k[9:] in retired else 'résolution documentée dans le cycle courant') if old else 'résolution documentée dans l’instantané hérité ; absent de la capture actuelle',verification_en_attente=False,niveau_preuve='preuve du cycle de supervision, pas nouvelle certification financière')
            else:c['verification_en_attente']=True
            if old:c['details']['cycle_actuel']=old
    for key,r in active.items():
        c=item('incident:'+key,'supervision','signal courant');c.update(statut_donnees='dernière donnée à qualifier séparément',statut_supervision='actif dans le moniteur observé',reliquat_actif=True,niveau_preuve='moniteur de production, capture datée',probleme=r.get('cause',''),outils=r.get('tools',[]),details=r,preuves=['preuves/moniteur-courant.json'])
    for r in repairs or []:
        proved=r.get('productionValidated',validated)
        item(r['id'],r['axe'],r['type']).update(statut_donnees=r.get('donnees','sans changement de valeur'),statut_supervision=r.get('supervision','non applicable'),reliquat_actif=not proved,niveau_preuve='tests et publication vérifiés'if proved else'correction locale prouvée ; GitHub et publication requis',probleme=r['probleme'],details=r,preuves=r['preuves'])
    for reconciliation in reconciliations or []:
        assert reconciliation['id_suivi'] in cases, 'Rapprochement sans origine : '+reconciliation['id_suivi']
        c=cases[reconciliation['id_suivi']]
        c['details']['rapprochement']=reconciliation['rapprochement']
        c.update({k:v for k,v in reconciliation.items()if k not in ('id_suivi','rapprochement')})
    assert sum(len(c['origines'])for c in cases.values())==len(legacy),'Une entrée héritée a disparu'
    assert len([k for k in cases if k.startswith('financial:')])==len(financial['rows'])
    removed=json.loads((ROOT/'src/data/retired-automations.json').read_text())['workflows']
    removed_names={r['toolName']for r in removed.values()if r.get('toolName')}
    removed_paths=[p for tool in json.loads((ROOT/'scripts/removed-tool-scopes.json').read_text())['tools']for p in tool['paths']]
    removed_followups={p for tool in json.loads((ROOT/'scripts/removed-tool-scopes.json').read_text())['tools']for p in tool.get('followupIds',[])}
    for c in cases.values():
        labels=c['outils'] or (re.split(r'\s*[;|]\s*',c['details'].get('outils',''))if isinstance(c['details'].get('outils'),str)else [])
        exclusive=bool(labels) and set(labels) <= removed_names
        component=c['id_suivi'].removeprefix('module:')
        removed_component=any(component==p or component.startswith(p+'/')for p in removed_paths)
        retired_workflow=next((wf for wf in removed if wf in c['id_suivi']),None)
        if exclusive or retired_workflow or removed_component or c['id_suivi']in removed_followups:
            c.update(statut_donnees='périmètre supprimé',statut_supervision='périmètre supprimé ; aucune donnée réparée',reliquat_actif=False,verification_en_attente=False)
        else:c['outils']=[t for t in c['outils']if t not in removed_names]
    for c in cases.values():
        c.setdefault('verification_en_attente', c['statut_donnees']=='non revérifié dans cette reprise' or c['id_suivi'].startswith('module:') and c['details'].get('reliquat_initial_81')=='True')
    return sorted(cases.values(),key=lambda c:c['id_suivi'])

def apply_use_contracts(cases,rows):
    """Join the evidence view to the unique follow-up; no independent manual status list."""
    by_id={c['id_suivi']:c for c in cases}
    assert len({r['id_suivi']for r in rows})==len(rows),'Contrats de données dupliqués'
    for r in rows:
        assert r['id_suivi']in by_id,'Contrat sans entrée dans le suivi : '+r['id_suivi']
        assert r['etat']in ['A','B','non applicable'],'État de qualification inconnu'
        c=by_id[r['id_suivi']]
        c['details']['autonomie']={k:r.get(k)for k in ['etat','chaine','dernier_controle_reussi','derniere_donnee','politique','blocage','publication_code','publication_donnees']}
        c.update(statut_donnees=r['etat'],reliquat_actif=r['etat']=='B',piece_manquante=r['blocage']if r['etat']=='B'else'',niveau_preuve='Jointure de la capture publiée, des registres et des phases GitHub ; limites du contrat dans la matrice, pas certification fournisseur')
        c['preuves']=list(dict.fromkeys([*c['preuves'],'matrice-donnees-usages.csv#'+r['id_suivi'],'chaines-donnees.csv#'+r['chaine']]))
    return cases

def write_views(cases,output):
    def write(name,rows):
        if not rows:return
        keys=list(dict.fromkeys(k for r in rows for k in r))
        with(output/name).open('w',encoding='utf-8-sig',newline='')as f:
            writer=csv.DictWriter(f,keys,delimiter=';');writer.writeheader();writer.writerows({k:json.dumps(v,ensure_ascii=False,separators=(',',':'))if isinstance(v,(dict,list))else v for k,v in r.items()}for r in rows)
    def existing(name,key):
        return {key(r):r for r in read_csv(output/name)}if(output/name).exists()else{}
    old_actions=existing('statut-19-actions.csv',lambda r:r['action'])
    actions=[]
    for c in cases:
        if not c['id_suivi'].startswith('action:'):continue
        code=c['id_suivi'].removeprefix('action:');r={**old_actions.get(code,{}),**{k:v for k,v in c['details'].items()if k!='rapprochement'}}
        r.update(statut=c['statut_donnees'],reliquat_actif=c['reliquat_actif'],preuve_consolidee=c['preuves'],rapprochement=c['details'].get('rapprochement',{}))
        if c['statut_donnees']=='périmètre supprimé':r['limitation']='Action exclusivement Portefeuilles IA retirée par #923 ; aucune donnée financière déclarée réparée.'
        actions.append(r)
    write('statut-19-actions.csv',actions)
    old_financial=existing('reconciliation-79-ecarts.csv',lambda r:r['isin']+'/'+r['year'])
    financial=[]
    for c in cases:
        if not c['id_suivi'].startswith('financial:')or not c['reliquat_actif']:continue
        key=c['id_suivi'].removeprefix('financial:');investigation=c['details'].get('investigation')or{}
        r={**old_financial.get(key,{}),**investigation};rapprochement=c['details'].get('rapprochement',{})
        r.update(id_suivi=c['id_suivi'],statut_consolide=c['statut_donnees'],piece_manquante=c['piece_manquante'],preuve_consolidee=c['preuves'])
        if 'recherche_primaire_marche_24oct'in rapprochement:r['recherche_marche_officiel_24oct']=rapprochement['recherche_primaire_marche_24oct']
        if 'distributions_officielles_24oct'in rapprochement:r['distributions_officielles_24oct']=rapprochement['distributions_officielles_24oct']
        financial.append(r)
    write('reconciliation-79-ecarts.csv',financial)
    write('restant-a-verifier.csv',[c for c in cases if c['reliquat_actif']or c.get('verification_en_attente')])

def write_reports(cases,legacy,output,metadata):
    output.mkdir(parents=True,exist_ok=True)
    with(output/'suivi-consolide.csv').open('w',encoding='utf-8-sig',newline='')as f:
        w=csv.DictWriter(f,list(cases[0]),delimiter=';');w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False,separators=(',',':'))if isinstance(v,(dict,list))else v for k,v in c.items()}for c in cases)
    write_views(cases,output)
    active=[c for c in cases if c['reliquat_actif']]
    summary={'schemaVersion':1,**metadata,'lignes_heritees':len(legacy),'origines_reconciliees':sum(len(c['origines'])for c in cases),'cas_uniques':len(cases),'actifs_ou_usages_non_additionnables_aux_cas':True,'suivi_par_axe':dict(collections.Counter(c['axe']for c in active)),'reliquat_actif_cas':len(active),'verification_en_attente':sum(c.get('verification_en_attente',False)for c in cases),'financier':{'comparaisons':sum(c['id_suivi'].startswith('financial:')for c in cases),'encore_ouverts':sum(c['id_suivi'].startswith('financial:')for c in active)},'non_reverifies':sum(c['statut_donnees']=='non revérifié dans cette reprise'for c in cases),'limite':'Suivi consolidé de contrats et de preuves existants, pas nouvel audit ni certification des fournisseurs. Les usages et contrôles ne sont pas tous des pannes et peuvent partager une même cause.'}
    summary['actions_19']={'total':sum(c['id_suivi'].startswith('action:') for c in cases),'statuts':dict(collections.Counter(c['statut_donnees'] for c in cases if c['id_suivi'].startswith('action:')))}
    summary['supervision']={'signaux_actifs_moniteur':sum(c['id_suivi'].startswith('incident:') and c['statut_supervision']=='actif dans le moniteur observé' for c in cases),'cycles_resolus_documentes':sum(c['id_suivi'].startswith('incident:') and c['statut_supervision'].startswith('résolution documentée') for c in cases),'attributions_retirees_documentees':sum(c['id_suivi'].startswith('incident:') and c['statut_supervision'].startswith('retrait documenté') for c in cases)}
    summary['definitions']={'cas_uniques':'Enregistrements dédoublonnés du suivi ; les actions parentes, capacités et usages peuvent partager une cause. Ne pas lire ce nombre comme des pannes ou actifs uniques.','verification_en_attente':'Inclut les 81 modules hérités sans nouvelle validation fournisseur ; ne signifie pas panne active.','productionValidated':'Concerne les corrections dotées de preuves de production dans ce suivi ; ne certifie pas toutes les données ni les modules.'}
    (output/'bilan.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    return summary

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--monitor',type=pathlib.Path,required=True);p.add_argument('--review',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,default=REPORT);p.add_argument('--inventory',type=pathlib.Path,default=ROOT/'public/data/data-automation-inventory.json');p.add_argument('--financial',type=pathlib.Path,default=ROOT/'public/data/financial-reconciliation.json');p.add_argument('--validated',action='store_true');p.add_argument('--previous',type=pathlib.Path,default=REPORT/'suivi-consolide.csv');args=p.parse_args()
    load=lambda p:json.loads(p.read_text());legacy=read_csv(ROOT/'reports/data-review-2026-10-23/suivi-avant-apres.csv')
    repairs=load(REPORT/'corrections.json')if(REPORT/'corrections.json').exists()else[]
    cases=consolidate(legacy,load(args.inventory),load(args.financial),read_csv(REPORT/'sources/reconciliation-79-ecarts.csv'),read_csv(REPORT/'sources/statut-19-actions.csv'),read_csv(REPORT/'sources/modules-verification.csv'),load(args.monitor),load(args.review),repairs,args.validated,reconciliations=load(REPORT/'rapprochements-livres.json'),previous=read_csv(args.previous)if args.previous.exists()else None)
    matrix_path=args.output/'matrice-donnees-usages.csv'
    if matrix_path.exists():apply_use_contracts(cases,read_csv(matrix_path))
    (args.output/'preuves').mkdir(parents=True,exist_ok=True)
    for src,name in [(args.monitor,'moniteur-courant.json'),(args.review,'revue-courante.json')]:
        if src.resolve()!=(args.output/'preuves'/name).resolve():(args.output/'preuves'/name).write_bytes(src.read_bytes())
    metadata={'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'inventoryGeneratedAt':load(args.inventory)['generatedAt'],'monitorCheckedAt':load(args.monitor)['monitoring']['checkedAt'],'productionValidated':args.validated}
    print(json.dumps(write_reports(cases,legacy,args.output,metadata),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
