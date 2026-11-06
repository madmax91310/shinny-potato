import csv,json,gzip,pathlib,collections,hashlib,datetime,re,os
import csv
csv.field_size_limit(32 * 1024 * 1024)
ROOT=pathlib.Path(os.environ.get('AUTOMATION_REPORT_ROOT','/tmp/automation-20261106'));OUT=ROOT/'livraison';OUT.mkdir(exist_ok=True)
def read(p):
 p=pathlib.Path(p)
 return json.load(gzip.open(p,'rt') if p.suffix=='.gz' else open(p))
def rows(p):
 p=pathlib.Path(p)
 if p.exists():return read(p)
 with gzip.open(p.parent/'diagnostics-all.json.gz','rt') as f:
  import sys;sys.path.insert(0,str(ROOT/'reportingdeps'));import ijson
  return list(ijson.items(f,'rows.item'))
def write(name,data,fields=None):
 data=list(data)
 if fields is None:fields=list(dict.fromkeys(k for r in data for k in r))
 with open(OUT/name,'w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields,delimiter=';');w.writeheader()
  for r in data:w.writerow({k:(json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v) for k,v in r.items()})
def instrument_id(r):
 if r.get('asset'):return r['asset']
 match=re.match(r'etf:([A-Z]{2}[A-Z0-9]{10}):',r.get('conflictId',''))
 if match:return match[1]
 match=re.search(r'(?:[?&]id=|^instrument:)([A-Z]{2}[A-Z0-9]{10})(?:$|[&:])',r.get('to','')+' '+r.get('key',''))
 return match[1]if match else ''
def cause_group(r):
 conflict=r.get('conflictId','')
 if conflict.startswith('etf:'):
  parts=conflict.split(':')
  return (family(r),'Photographie financière à rapprocher : '+parts[1]+' / '+parts[-1]+' ; regroupement de périmètre, cause commune non présumée')
 return (family(r),r.get('cause')or '')
def family(r):
 k=r.get('key','');s=r.get('cause','')
 if r['kind'] in ['archive','history']:return 'trace historique'
 if r['kind']=='not-applicable':return 'non applicable'
 if r['kind']=='waiting':return 'attente / périmètre différé à confirmer dans le contrat'
 if k.startswith('publication:'):return 'publication : état courant à rapprocher du reçu exact'
 if k.startswith('checks:'):return 'contrôle de publication'
 if r['kind']=='qualification':return 'qualification documentaire ou convention ; pas une panne déduite'
 if r['kind']=='connection':
  if r.get('field')=='Éligibilité PEA':return 'qualification fiscale PEA manquante ; aucun statut déduit du nom ni de la classe d’actifs'
  if 'Les historiques mensuels restent automatisés' in s:return 'publication annuelle non disponible ; historique mensuel automatisé, pas une panne mensuelle'
  if 'Condition de courtage corroborée manuellement' in s:return 'recoupement documentaire manuel ; aucune panne de la valeur primaire déduite'
  if 'Raccorder les constituants de l’indice économique exact' in s:return 'raccordement manquant : composition économique exacte de l’indice'
  return 'raccordement / disponibilité à qualifier individuellement'
 if k.startswith('radar:'):return 'conflit financier ou documentaire conservé'
 if r.get('field')=='Éligibilité PEA' or k.endswith(':pea') or ':pea:'in k:return 'qualification PEA contradictoire ou inconnue'
 if 'collection:' in k:return 'collecte / validation source'
 return r['kind']+' : qualification de la donnée et de son usage'
initial=rows(ROOT/'public-initial/diagnostics-rows.json')
final_dir=ROOT/'public-final';final=rows(final_dir/'diagnostics-rows.json') if (final_dir/'diagnostics-rows.json').exists() or (final_dir/'diagnostics-all.json.gz').exists() else initial
isfinal=final is not initial
if isfinal:
 capture=read(final_dir/'capture.json');assert capture['stableBuild'] and not capture['errors'],'Unstable publication or browser errors: final capture must be repeated'
assert len(initial)>0 and len(final)>0,'No diagnostics may disappear through a parser mismatch'
bykey=collections.defaultdict(list)
for r in final:bykey[(r.get('key') or 'native-id:'+r['id'])].append(r)
# Absence from a new inbox never proves a financial repair.
reconciled=[]
for r in initial:
 matches=bykey.get((r.get('key') or 'native-id:'+r['id']),[])
 reconciled.append({'identité_initiale':r['id'],'clé_initiale':(r.get('key') or 'native-id:'+r['id']),'nom':r.get('name'),'instrument':instrument_id(r),'champ':r.get('field'),'outils':r.get('tools',[]),'type_initial':r['kind'],'cause_initiale':r.get('cause'),'catégorie':family(r),'présent_dans_export_final':bool(matches) if isfinal else 'publication finale non vérifiée','présent_dans_vue_initiale_native':any(m['kind']in['failure','connection','monitoring']for m in matches)if isfinal else None,'panne_native_actuelle':any(m['kind']=='failure' for m in matches)if isfinal else None,'trace_historique_actuelle':any(m['kind']in['archive','history']for m in matches)if isfinal else None,'types_finaux':sorted(set(m['kind'] for m in matches)) if isfinal else [],'causes_finales':sorted(set(m.get('cause') or '' for m in matches)) if isfinal else [],'statut':'observé dans la photographie finale, preuve détaillée à rapprocher' if isfinal and matches else ('non retrouvé, aucune résolution inférée' if isfinal else 'photographie initiale conservée'),'preuve_initiale':str(ROOT/'public-initial/capture.json'),'preuve_finale':str(final_dir/'capture.json') if isfinal else None})
write('rapprochement-diagnostics-initial-final.csv',reconciled)
groups=collections.defaultdict(list)
for r in final:groups[cause_group(r)].append(r)
write('causes-consolidees.csv',({'catégorie':k[0],'cause_exacte':k[1],'nombre_diagnostics':len(v),'identités':[r['id'] for r in v],'clés':sorted(set((r.get('key') or 'native-id:'+r['id']) for r in v)),'instruments':sorted(set(instrument_id(r) for r in v)),'détails_par_diagnostic':[{'id':r['id'],'key':r.get('key'),'instrument':instrument_id(r),'champ':r.get('field'),'outils':r.get('tools',[]),'attribution_qualifiée':r.get('impactQualified'),'cause_exacte':r.get('cause'),'action_attendue':r.get('action'),'étape':r.get('stage'),'dernière_donnée':r.get('asOf'),'dernier_contrôle':r.get('checkedAt'),'dernière_tentative':r.get('attemptedAt'),'dernière_réussite':r.get('lastSuccessAt'),'conflictId':r.get('conflictId')}for r in v],'champs':sorted(set(r.get('field') or '' for r in v)),'outils':sorted(set(t for r in v for t in r.get('tools',[]))),'sources':sorted(set(u for r in v for u in r.get('sourceUrls',[])))}for k,v in groups.items()))
invpath=(final_dir if isfinal else ROOT/'public-initial')/'data-automation-inventory.json.gz'
if not invpath.exists():raise SystemExit('Full inventory missing: no incomplete substitute allowed')
j=read(invpath);cu=j['consumerUsage'];toolrows={(t['path'],r['id'],(r.get('key') or 'native-id:'+r['id'])):r for t in cu['tools'] for r in t['rows']};toolnames={t['path']:t['name'] for t in cu['tools']};data=[];seen=set()
import subprocess
allassets=j['assets']+cu.get('externalAssets',[])
consumerids=sorted(set(c for a in allassets for f in a.get('fields',[]) for c in f.get('consumers',[]) if isinstance(c,str)))
normalized=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {consumerPath} from './scripts/lib/consumer-usage.mjs';import fs from 'node:fs';console.log(JSON.stringify(Object.fromEntries(JSON.parse(fs.readFileSync(0,'utf8')).map(c=>[c,consumerPath(c)]))))"],input=json.dumps(consumerids).encode(),cwd=str(ROOT/'repo')))
fieldlookup=collections.defaultdict(list)
for a in allassets:
 for f in a.get('fields',[]):fieldlookup[(a['id'],f['key'])].append((a,f))
missing=[]
for tool in cu['tools']:
 path=tool['path']
 for use in tool['rows']:
  candidates=fieldlookup.get((use['id'],use['key']),[])
  if not candidates:
   missing.append((path,use['id'],use['key']));a={'id':use['id']};f={'key':use['key'],'label':'Champ natif sans détail dans l’inventaire public','qualificationBlock':'missing-field-details'}
  else:a,f=candidates[0]
  data.append({'outil':toolnames[path],'route':path,'instrument':a['id'],'nom':a.get('name'),'champ':f.get('label'),'clé_du_contrat':f['key'],'nécessaire':use.get('required','non déclaré dans la table d’usages'),'nature':f.get('kind'),'état_déclaré':f.get('state'),'état_usage':use.get('state'),'registre':f.get('registry'),'unité_explicitement_publiée':f.get('unit'),'clé_politique_fraîcheur':f.get('freshnessPolicyKey'),'identité_source':f.get('sourceIdentity'),'consommateur_code':f.get('consumerCode'),'devise':f.get('currency'),'début':f.get('periodStart'),'fin':f.get('periodEnd'),'périmètre':f.get('scope'),'méthode':f.get('method'),'dernière_donnée':f.get('asOf'),'dernier_contrôle':f.get('checkedAt'),'dernière_tentative':f.get('lastAttemptAt'),'dernière_réussite':f.get('lastSuccessAt'),'source':f.get('sourceUrls',[]),'producteurs_et_déclenchements':f.get('workflows',[]),'certificat_ciblé':f.get('coverageReference'),'qualification_bloquante':f.get('qualificationBlock'),'raison':f.get('reason'),'prochaine_action':f.get('nextAction'),'niveau_de_preuve':'contrat et valeurs publics ; succès source/publication à rapprocher des reçus individuels, aucune certification globale','preuve_inventaire':str(invpath)})
  data[-1]['variantes_du_champ']=len(candidates)
  if len(candidates)>1:data[-1]['détails_variantes']=[f for _,f in candidates]
assert len(data)==sum(len(t['rows'])for t in cu['tools'])
assert len({(r['route'],r['instrument'],r['clé_du_contrat'])for r in data})==len(data)
write('matrice-donnees-usages.csv',data)
pertool=[]
for t in cu['tools']:
 rr=[r for r in data if r['route']==t['path']];dd=[r for r in final if t['name'] in r.get('tools',[])];counts=collections.Counter(r['état_usage'] for r in rr)
 pertool.append({'outil':t['name'],'route':t['path'],'contrats_explicitement_déclarés':len(t['rows']),'lignes_matrice':len(rr),'états_usages':dict(counts),'diagnostics_attribués_exactement_au_libellé':len(dd),'erreurs_actives_attribuées':[(r.get('key') or 'native-id:'+r['id']) for r in dd if r['kind']=='failure'],'raccordements':[(r.get('key') or 'native-id:'+r['id']) for r in dd if r['kind']=='connection'],'limite':'Les libellés de diagnostics peuvent différer du registre d’outils. Aucun zéro par absence de jointure ; détails conservés dans la matrice et les diagnostics.','fonctionnement_démontré':'voir reçus des producteurs, manifeste public et recettes ciblées ; présence du contrat seule insuffisante'})
write('bilan-par-outil.csv',pertool)
financial=read((final_dir if isfinal else ROOT/'public-initial')/'financial-reconciliation.json')
write('cas-financiers-conserves.csv',({'id':r['id'],'instrument':r['isin'],'année':r['year'],'statut_ancienne_divergence':r['status'],'ouvert':r['open'],'résidu_ouvert':r.get('residualOpen'),'cause_documentée':r.get('reason'),'pièce_manquante':r.get('missingPiece'),'consommateur_courant':r.get('currentConsumer'),'réparation_cash':r.get('currentCashRepair'),'comparaison_initiale':r.get('original'),'preuve':r.get('proof'),'dernière_vérification':r.get('latestCheck')}for r in financial['rows']))
nine={('DE000A0H08P6',2019),('DE000A27Z304',2021),('DE000A27Z304',2023),('DE000A27Z304',2024),('FR0010755611',2021),('FR0010755611',2024),('FR0013411998',2025),('FR0013412004',2025),('IE00B4K6B022',2024)}
quantitative={(r['isin'],r['year']):r for r in read(ROOT/'proofs/amundi-nine-independent/quantitative-boundaries.json')}
write('neuf-fenetres-refusees.csv',({'rapprochement_nouveau_exact':quantitative.get((r['isin'],r['year']),{}),'instrument':r['isin'],'année':r['year'],'ancienne_divergence':r['status'],'usage_courant':r.get('currentConsumer'),'pièce_manquante_initiale':r.get('missingPiece'),'investigation_nouvelle':('Réponse API officielle Amundi quotidienne et requête explicite dividendAmount/dividendCurrency obtenues ; réponses de champs cash absentes/null, jamais assimilées à des distributions financières égales à zéro. Bornes et rendement NAV rapprochés quantitativement dans preuves/amundi-nine-independent/quantitative-boundaries.json ; politique Capitalisation and/or distribution insuffisante, clôtures exactes/convention cash encore à qualifier.' if r['isin'] in ['FR0010755611','FR0013411998','FR0013412004'] else 'Aucune preuve quotidienne indépendante nouvelle admise dans ce lot ; ancienne preuve conservée.'),'nouvelle_fenêtre_admise':False,'preuve':r.get('proof')}for r in financial['rows'] if (r['isin'],r['year']) in nine))
oldpath=ROOT/'repo/reports/donnees-consolidees-2026-10-24/livraison-2026-10-29/perimetre-initial-complet.csv.gz'
oldmatches=[]
if oldpath.exists():
 with gzip.open(oldpath,'rt',encoding='utf-8-sig',newline='')as oldfile:old=list(csv.DictReader(oldfile,delimiter=';'))
 lookup=collections.defaultdict(list)
 for r in final:
  for key in {r.get('id'),r.get('key')}|{s.get(k)for s in r.get('signals',[])for k in ['id','key']}:
   if key:lookup[key].append(r)
 for r in old:
  candidates={q['id']:q for k in ['id','identifiant_regroupe','diagnostic_id_2nov']for q in lookup.get(r.get(k),[])}
  kinds=set(q['kind']for q in candidates.values())
  labels={'failure':'panne native présente, cause/étape et preuve individuelle à rapprocher','connection':'raccordement/qualification requis, pas automatiquement une panne source','monitoring':'contrôle opérationnel à rapprocher du reçu exact','qualification':'qualification documentaire présente, pas automatiquement une panne','waiting':'attente native présente','history':'trace historique conservée','archive':'archive conservée','not-applicable':'donnée non applicable','due':'contrôle à échéance','editorial':'revue éditoriale'}
  r=dict(r);r.update({'photographie_6nov':str(final_dir/'capture.json')if isfinal else str(ROOT/'public-initial/capture.json'),'publication_finale_vérifiée_6nov':isfinal,'correspondances_exactes_6nov':list(candidates),'types_6nov':sorted(kinds),'présence_vue_initiale_native_6nov':bool(kinds&{'failure','connection','monitoring'}),'panne_native_actuelle_6nov':'failure'in kinds,'trace_historique_6nov':bool(kinds&{'history','archive'}),'qualification_native_6nov':'qualification'in kinds,'attente_native_6nov':'waiting'in kinds,'non_applicable_6nov':'not-applicable'in kinds,'raccordement_native_6nov':'connection'in kinds,'signaux_exacts_6nov':[{k:q.get(k)for k in ['id','key','kind','field','stage','cause','asOf','checkedAt','attemptedAt','lastSuccessAt']}for q in candidates.values()],'convention_colonnes_antérieures':'Les colonnes d’origine et datées jusqu’au2novembre restent des photographies historiques, pas un état natif du6novembre.','statut_6nov':' ; '.join(labels.get(k,k)for k in sorted(kinds))if candidates else 'aucune correspondance exacte ; historique conservé, absence insuffisante pour conclure à une résolution'})
  oldmatches.append(r)
 write('perimetre-historique-rapproche-6nov.csv',oldmatches)
summary={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'finalPublicationCaptured':isfinal,'initialDiagnostics':len(initial),'finalDiagnostics':len(final) if isfinal else None,'initialKinds':dict(collections.Counter(r['kind']for r in initial)),'finalKinds':dict(collections.Counter(r['kind']for r in final)) if isfinal else None,'allInitialIdentitiesRetained':len(reconciled)==len(initial),'historicalInitialRowsRetained':len(oldmatches),'catalogFields':len(j['fields']),'nativeInventoryEntities':len(j['assets']),'nativeInventoryEntityTypes':dict(collections.Counter(a.get('type')for a in j['assets'])),'externalConsumerEntities':len(cu.get('externalAssets',[])),'entitiesNotCountedAsDistinctFinancialAssets':True,'toolsWithDeclaredDataConsumers':len(cu['tools']),'dataUsageMatrixRows':len(data),'nativeContractsWithoutFieldDetails':missing,'consumerUsageSummaryDeclaredNotCertified':cu['summary'],'financialComparisonsPreserved':len(financial['rows']),'refusedWindowsInConstant79Scope':len(nine),'newMonthlyWindowsAdmittedInThisLot':0,'noAbsenceInterpretedAsResolution':True}
(OUT/'bilan.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False))
