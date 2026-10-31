import csv,gzip,json,pathlib,collections,datetime,hashlib,shutil,os,re
csv.field_size_limit(16*1024*1024)
base=pathlib.Path('/workspace/finalisation-donnees-20261027'); root=pathlib.Path('/dev/shm/data-automation-20261028'); source=pathlib.Path(os.environ.get('RECONCILE_SNAPSHOT_DIR',str(root/'public'))); out=root/'consolidated-30oct';out.mkdir(exist_ok=True)
def source_bytes(name):
 p=source/name
 return p.read_bytes()if p.exists()else gzip.decompress((source/(name+'.gz')).read_bytes())
a=json.loads(source_bytes('diagnostics-action.json'));full=json.loads(source_bytes('diagnostics-all.json'));active={r['id']:r for r in a['rows']};allrows={r['id']:r for r in full['rows']};assert len(allrows)==len(full['rows']); assert len(active)==len(a['rows'])
proof={'exportedAt':a['generatedAt'],'monitorCheckedAt':a['monitorCheckedAt'],'code':json.loads(source_bytes('build-info.json')),'sourceHashes':{n:hashlib.sha256(source_bytes(n)).hexdigest()for n in ['diagnostics-action.json','diagnostics-all.json','automation-status.json','data-review-inbox.json','asset-field-coverage.json']}}
# Link an original identity to an explicit resolved historical event. Absence
# alone is never a resolution, and an active recurrence takes precedence.
resolved_history={}
for raw in allrows.values():
 # Public grouped exports retain the exact closure receipt in their signal,
 # not necessarily on the presentation row. Never infer it from the ID alone.
 matches=[v for v in raw.get('signals',[])if v.get('id')==raw['id'] and v.get('resolvedAt')]
 r={**raw,**matches[0],'kind':raw['kind']}if len(matches)==1 else raw
 stamp=r.get('resolvedAt');key=r['id']
 if key.startswith('history:') and stamp and key.endswith(':'+stamp):
  original=key[len('history:'):-len(stamp)-1]
  if original not in resolved_history or stamp>resolved_history[original]['resolvedAt']:resolved_history[original]=r
dws_proposals={x['id']:x for x in json.loads((root/'proofs-29oct/dws-radar-proposals-vs-published-30oct.json').read_text())['rows']}
# These are structural investigation buckets, never a proof that all fields share one fault.
def category(r):
 kind=r['kind'];cause=r.get('cause','');key=r['id']
 if key in dws_proposals:
  x=dws_proposals[key]
  if x['entity'] in {'IE00BTJRMP35','IE000L6ZMMC4'} and not x['exactProposalEqualsPublishedRegistry']:
   return 'classification partielle ; zéro non démontré', 'PR#1102 : ne pas déduire zéro du pays absent tant que le portefeuille conserve un poids Non classé. Conserver conflit et valeurs datées ; qualification pays exacts manquante. Preuves dws-radar-proposals-vs-published-30oct.json et dws-nine-published-snapshots-reconciliation-30oct.json.'
  return 'attente de stabilité documentée, pas panne de collecte', 'Photographie DWS réelle29octobre, source22:17 et18agrégats pays/secteurs égaux aux registres publics. Délai4h existant avant réconciliation, au plus tôt31octobre00:35UTC ; ancien écart non expliqué, incident non clôturé par cette analyse.97propositions explicites et9zéros sur sources entièrement classées distingués des3zéros non démontrés. Aucune tolérance changée.'
 if kind=='connection':
  if 'Recoupement externe' in r.get('field',''):return 'condition vivante encore manuelle', 'Confirmation officielle précise CTO/PEA requise ; la corroboration externe datée conserve son échéance, aucun renouvellement automatique ni négation déduite d’un silence.'
  if 'USD Accumulating' in cause:return 'convention de part non qualifiée', 'Table de la part USD distribuante exacte IE00BM8R0J59 requise ; le rendement de la part Accumulating ne peut pas la remplacer.'
  return 'raccordement / qualification documentaire', 'Document exact du véhicule, de la part ou de la condition toujours nécessaire ; ne pas déduire les champs depuis un contrôle global.'
 if kind=='qualification':return 'preuve / qualification incomplète', 'Contrat non certifié individuellement ; ne démontre pas une panne de la donnée.'
 if kind=='monitoring':return 'preuve de supervision', 'Les deux anciens périmètres incomplets restent historiques ; nouveau workflow vert insuffisant pour réécrire ces tentatives.'
 if kind=='history':return 'trace historique', 'Conserver la preuve initiale et la résolution explicite si présente.'
 if kind in ['waiting','not-applicable','editorial']:return {'waiting':'attente normale','not-applicable':'non applicable','editorial':'contenu / qualification éditoriale'}[kind],cause
 if 'contradictoire' in cause:return 'conflit financier à date identique', 'Rapprocher les réponses brutes et photographies exactes ; aucune majorité ni tolérance ajoutée.'
 if 'check-overdue' in cause:return 'contrôle à renouveler', 'Dernière valeur datée conservée ; qualifier séparément accès primaire, voie mensuelle et actualisation du champ.'
 if 'Commit validated observations' in cause:return 'enregistrement protégé', 'Vérifier les nouvelles entrées financières de master ; recollecte et revalidation nécessaires si incompatibles.'
 if key.startswith('publication:'):return 'publication', 'Le compteur diagnostique dérivé exact a été corrigé et publié par#1070 ; toute erreur de publication plus récente reste distincte et doit être rapprochée du reçu du run concerné.'
 if '403' in cause:return 'accès fournisseur refusé', 'Voie publique autorisée réellement accessible dans GitHub nécessaire ; résultat local non substituable.'
 if 'NET_ASSETS' in cause:return 'champ financier fournisseur absent', 'GlobalX : contrat de change ZAR sans poids/valeur ; aucune valeur inventée ni livre renommé complet.'
 if 'Invesco complete fund holdings unavailable' in cause:return 'portefeuille fournisseur vide', 'Deux livres Invesco ont une voie officielle réparée par#1073 et des collectes ordinaires ; comparer l’identité et la date du diagnostic à la nouvelle photographie, sans fermer les autres livres partiels.'
 if '100.5%' in cause:return 'périmètre brut / net incompatible', 'WorldHedged : clarifier la poche économique et les dérivés ; pas de renormalisation ou de seuil relevé.'
 if 'Composants officiels' in cause:return 'convention historique non rapprochée', 'Palladium2014-12 : NAV et indice de rendement officiel incompatibles ; autres périodes conservées.'
 if 'radar' in key:return 'source Radar / propriétaire existant', 'Conserver la responsabilité Radar et les erreurs distinctes ; ne pas lancer une correction concurrente.'
 return 'cause à qualifier',cause
columns=['presence_publique_30oct','classe_publique_30oct','categorie_30oct','statut_30oct','preuve_30oct','piece_manquante_30oct','reliquat_actif_avant_30oct']
def fields(key):
 r=active.get(key)or allrows.get(key)or resolved_history.get(key)
 if not r:return dict(zip(columns,['absent de cet export','','','absence seule : aucune résolution revendiquée',json.dumps(proof,ensure_ascii=False,separators=(',',':')),'Conserver les preuves antérieures ; absence ne démontre pas la réparation.']))
 cat,missing=category(r);present=key in active
 status='actif dans la boîte courante'if present else 'trace / état non actif conservé'
 if r.get('resolvedAt'):status+=' ; clôture explicite datée '+r['resolvedAt']+' ; preuve de cette étape conservée, pas certification de toute la chaîne'
 if r.get('qualificationBlock')=='historical-resolution-unproven':status+=' ; ancienne résolution non démontrée, qualification historique maintenue'
 return dict(zip(columns,[str(present),r['kind'],cat,status,json.dumps({'exportedAt':a['generatedAt'],'monitorCheckedAt':a['monitorCheckedAt'],'id':key,'observedIdentity':r['id'],'runUrl':r.get('runUrl'),'resolvedAt':r.get('resolvedAt'),'resolutionEvidence':r.get('resolutionEvidence'),'sourceHashes':proof['sourceHashes']},ensure_ascii=False,separators=(',',':')),missing]))

with gzip.open(out/'matrice-donnees-usages.csv.gz','rt',encoding='utf-8-sig',newline='')as f:matrix_by_id={r['id_suivi']:r for r in csv.DictReader(f,delimiter=';')}
with (out/'statut-19-actions.csv').open(encoding='utf-8-sig',newline='')as f:action_by_id={'action:'+r['action']:r for r in csv.DictReader(f,delimiter=';')}
with (out/'reconciliation-79-ecarts.csv').open(encoding='utf-8-sig',newline='')as f:financial_by_id={'financial:'+r['isin']+'/'+r['year']:r for r in csv.DictReader(f,delimiter=';')}
def reconciled_domain(row):
 identity=row['id_suivi']
 if identity in matrix_by_id:
  m=matrix_by_id[identity];row.setdefault('statut_donnees_avant_30oct',row.get('statut_donnees',''))
  row.update(statut_donnees=m['etat']+' : '+m['nature_ecart'],statut_30oct=m['etat']+' : '+m['nature_ecart'],categorie_30oct=m['nature_ecart'],preuve_30oct=m.get('preuve_intervention_30oct')or m.get('preuve',''),piece_manquante_30oct=m.get('blocage',''),reliquat_actif=str(m['etat']=='B'),statut_supervision='Contrat donnée×usage ; une qualification B ne constitue pas un incident fournisseur par défaut.')
 if identity in action_by_id:
  a=action_by_id[identity];row.setdefault('statut_donnees_avant_30oct',row.get('statut_donnees',''))
  row.update(statut_donnees=a['statut'],statut_30oct=a['statut'],preuve_30oct=a.get('preuve_production_30oct',''),reliquat_actif=str(a['statut']in ['partiellement corrigée','bloquée']))
 if identity in financial_by_id:
  f=financial_by_id[identity]
  row.update(statut_donnees=f['status'],usage_mensuel_30oct=f['usage_securise'],reliquat_actif=str(f['ancienne_divergence_resolue_30oct']!='True'),statut_supervision='Ancienne divergence distincte du rétablissement mensuel ; présence en boîte dans les colonnes publiques, aucune clôture inférée de la NAV indépendante.')
 return row

seen=set();seen_ledger=set();n=0;new=0;new_usage=0
with gzip.open(base/'suivi-consolide.csv.gz','rt',encoding='utf-8-sig',newline='')as src,gzip.open(out/'suivi-consolide.csv.gz','wt',encoding='utf-8-sig',newline='')as dest:
 reader=csv.DictReader(src,delimiter=';');oldnames=reader.fieldnames;names=list(dict.fromkeys(oldnames+columns+['statut_donnees_avant_30oct','usage_mensuel_30oct']));writer=csv.DictWriter(dest,fieldnames=names,delimiter=';',lineterminator='\n');writer.writeheader()
 for row in reader:
  n+=1;key=row.get('diagnostic_id_29oct')or (row['id_suivi'][len('incident:'):]if row['id_suivi'].startswith('incident:')else '')
  if key:
   previous=row.get('reliquat_actif','');row['statut_donnees_avant_30oct']=row.get('statut_donnees','');row.update(fields(key));row['statut_donnees']=row['statut_30oct'] if key in allrows or key in resolved_history or key in active else row['statut_donnees_avant_30oct'];row['reliquat_actif_avant_30oct']=previous;row['reliquat_actif']=str(key in active)if(key in allrows or key in resolved_history or key in active)else previous;seen.add(key)
  seen_ledger.add(row['id_suivi']);writer.writerow(reconciled_domain(row))
 for identity,m in matrix_by_id.items():
  if identity in seen_ledger:continue
  row={'id_suivi':identity,'axe':'fiabilité et automatisation','type_defaut':m['nature_ecart'],'outils':m['outil'],'probleme':m['blocage'],'preuves':m['preuve'],'origines':'Matrice consolidée courante30octobre, identité datée conservée'};writer.writerow(reconciled_domain(row));new_usage+=1
 for key,r in allrows.items():
  if key in seen:continue
  row={'id_suivi':'incident:'+key,'axe':'fiabilité et automatisation','type_defaut':category(r)[0],'statut_donnees':'observation publique courante, aucune résolution implicite','statut_supervision':'export public consommé','reliquat_actif':str(key in active),'niveau_preuve':'réponse publique et export navigateur réels','probleme':r.get('cause',''),'piece_manquante':category(r)[1],'outils':json.dumps(r.get('tools',[]),ensure_ascii=False),'preuves':json.dumps([r.get('runUrl'),proof],ensure_ascii=False),'origines':json.dumps([{'dimension':'reprise consolidée30oct','cle':key,'snapshot':a['generatedAt']}],ensure_ascii=False),'details':json.dumps({k:r.get(k)for k in ['id','field','stage','sourceUrls','runId','attempt','resolvedAt']},ensure_ascii=False),'diagnostic_id_29oct':key,**fields(key)};writer.writerow(row);new+=1
# Initial661 identities remain intact, including absent rows with no positive resolution proof.
with gzip.open(base/'perimetre-initial-complet.csv.gz','rt',encoding='utf-8-sig',newline='')as src,gzip.open(out/'perimetre-initial-complet.csv.gz','wt',encoding='utf-8-sig',newline='')as dest:
 reader=csv.DictReader(src,delimiter=';');writer=csv.DictWriter(dest,fieldnames=list(dict.fromkeys(reader.fieldnames+columns)),delimiter=';',lineterminator='\n');writer.writeheader();count=0
 for row in reader:count+=1;row.update(fields(row['id']));writer.writerow(row)
 assert count==661,count
# Append current public identity membership to the existing cause follow-up; historical groups remain.
with gzip.open(base/'causes-consolidees.csv.gz','rt',encoding='utf-8-sig',newline='')as src,gzip.open(out/'causes-consolidees.csv.gz','wt',encoding='utf-8-sig',newline='')as dest:
 reader=csv.DictReader(src,delimiter=';');writer=csv.DictWriter(dest,fieldnames=reader.fieldnames,delimiter=';',lineterminator='\n');writer.writeheader()
 for row in reader:
  if not row['groupe_structurel'].startswith('reprise30oct:'):writer.writerow(row)
 groups=collections.defaultdict(list)
 def unit(r):
  cat=category(r)[0]
  if r['kind']=='connection':return cat+' | '+r.get('name','')+' | '+r.get('field','')
  if 'contradictoire' in r.get('cause',''):
   m=re.search(r'etf:([A-Z]{2}[A-Z0-9]{9}\d):(countries|sectors|aum|holdings)',r['cause']);stamp=re.search(r'\((20\d{2}-\d{2}-\d{2})\)',r['cause'])
   if m:return cat+' | '+m[1]+' | '+m[2]+' | '+(stamp[1]if stamp else 'période à qualifier')
  if r['kind']=='failure':return cat+' | '+r.get('name','')+' | '+r.get('field','')
  return cat
 for r in active.values():groups[unit(r)].append(r)
 assert len({x['id']for rs in groups.values()for x in rs})==len(active)
 assert sum(len(rs)for rs in groups.values())==len(active)
 for cat,rs in sorted(groups.items()):writer.writerow({'groupe_structurel':'reprise30oct:'+cat,'nombre_identites':len(rs),'classes_actuelles':json.dumps(collections.Counter(r['kind']for r in rs),ensure_ascii=False),'statuts_finaux':'Actifs au relevé '+a['generatedAt'],'identites_exactes':json.dumps([r['id']for r in rs],ensure_ascii=False),'impacts_individuels':json.dumps([{k:r.get(k)for k in ['id','name','field','tools','stage','cause','runUrl']}for r in rs],ensure_ascii=False),'preuve_commune':json.dumps(proof,ensure_ascii=False),'limite_regroupement':'Catégorie d’investigation, pas certification d’une cause commune ni preuve que tous les calculs listés sont affectés.'})
# Current groups are investigation/repair units, never a blanket attribution of
# a provider failure to every member of a structural category.
# The row identities and source/field/tool impacts remain exact.
summary={**proof,'initialIdentitiesPreserved':661,'previousLedgerIdentitiesPreserved':n,'newPublicIdentitiesAdded':new,'additionalMatrixIdentities':new_usage,'ledgerIdentities':n+new+new_usage,'activeByClass':dict(collections.Counter(r['kind']for r in active.values())),'allByClass':dict(collections.Counter(r['kind']for r in allrows.values())),'investigationCategories':{k:len(v)for k,v in groups.items()},'financial79':{'qualifiedMonthly':70,'refusedMonthly':9,'oldQuoteDivergences':77,'residuals':2},'completeAutomationClaimed':False}
(out/'actualisation-30oct.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items()if k not in ['sourceHashes','code']},ensure_ascii=False,indent=2))
