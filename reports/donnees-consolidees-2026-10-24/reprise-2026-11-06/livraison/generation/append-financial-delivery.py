import pathlib,json,csv,datetime
import csv
csv.field_size_limit(32 * 1024 * 1024)
R=pathlib.Path('/tmp/automation-20261106');O=R/'livraison'
def read(name):
 with open(O/name,encoding='utf-8-sig',newline='')as f:return list(csv.DictReader(f,delimiter=';'))
def write(name,rows):
 rows=list(rows);keys=list(dict.fromkeys(k for r in rows for k in r))
 with open(O/name,'w',encoding='utf-8-sig',newline='')as f:
  w=csv.DictWriter(f,fieldnames=keys,delimiter=';');w.writeheader()
  for r in rows:w.writerow({k:json.dumps(v,ensure_ascii=False)if isinstance(v,(dict,list))else v for k,v in r.items()})
path=R/'proofs/financial-public/published-usage-restrictions.json'
if not path.exists():raise SystemExit('No public financial record capture: no usage repair inferred')
restrictions=json.load(open(path));context=json.load(open(R/'proofs/financial-public/context.json'));verified=(R/'proofs/financial-public/verified.json').exists()
price=[]
for id,r in restrictions.items():
 review=r.get('anniversaryPriceReview');split=r.get('splitAdjustmentEvidence')
 if not review and not split:continue
 kind='prix réellement cotés avant opération non qualifiés ; déclaration fournisseur ou preuve officielle explicitement distinguées'if review else 'prix de parts de deux époques non directement comparables ; ancien prix conservé, comparaison à travers split refusée'
 price.append({'outil':'Il y a X ans, simple/comparatif/PNG','identifiant':'history:'+id,'isin':r['isin'],'cotation':r['symbol'],'devise':r['currency'],'type':kind,'périodes_de_prix_limitées':r['anniversaryExcludedMonths'],'raison':r['anniversaryExclusionReason'] or (f"Comparaison à travers le split officiel {split['ratio']}:1 du {split['exDate']} refusée ; prix d’époque conservés." if split else 'Voir la qualification explicite de la série.'),'opérations_déclarées_ou_prouvées':review.get('events')if review else {'exDate':split['exDate'],'ratio':split['ratio'],'source':split['sourceUrl']},'dernier_contrôle_des_cours':r['checkedAt'],'date_de_revue_des_unités':review.get('checkedAt')if review else split.get('checkedAt'),'fin_des_cours_disponibles':r['periodEnd'],'autres_restrictions_de_rendement':{'months':r['historyExcludedMonths'],'windows':r['historyUnqualifiedReturnWindows'],'reasons':r.get('historyExclusionReasons',{})},'impact_sur_rendements':'Cette revue de prix ne refuse pas globalement le rendement réinvesti ; ses autres qualifications restent applicables.','pièce_manquante':'Clôtures historiques exactes de la cotation avant les opérations et convention d’ajustement démontrée.'if review else 'Le format de comparaison de prix doit représenter correctement les quantités de parts avant/après split ; la voie rendement est distincte.','preuve_publique':context['build']})
write('prix-historiques-et-usages-limites.csv',price)
rows=read('matrice-donnees-usages.csv');overlays=0
for r in rows:
 id=r['instrument'].removeprefix('history:')if r['instrument'].startswith('history:')and r['clé_du_contrat']=='catalog:0'else None
 cap=restrictions.get(id)
 if not cap:continue
 limits={'historyExclusionReasons':cap.get('historyExclusionReasons',{}),'historyExcludedMonths':cap['historyExcludedMonths'],'historyUnqualifiedReturnWindows':cap['historyUnqualifiedReturnWindows']}
 if r['route']in ['/duels-portefeuilles','/generateur-portefeuilles']:
  r['complément_financier_du_lot']='Données communes corrigées conservées ; aucune admission ni rôle automatique ajouté. Les années complètes avant2026 sont distinctes des calculs mensuels incluant2026. Pas de nouvelle recette publique de ces deux actifs annoncée dans cet outil.'
 if r['route']=='/il-y-a-x-ans':limits.update({'anniversaryExcludedMonths':cap['anniversaryExcludedMonths'],'reason':cap['anniversaryExclusionReason'],'split':({k:cap['splitAdjustmentEvidence'][k]for k in ['exDate','ratio','sourceUrl']}if cap['splitAdjustmentEvidence']else None)})
 if any(limits.values()):
  r['restrictions_financières_par_usage']=limits;r['interprétation_du_raccordement']='Donnée effectivement raccordée ; les périodes et conventions limitées ci-contre ne sont pas certifiées par le statut natif connected.';r['preuve_des_restrictions_publiques']=str(path);overlays+=1
write('matrice-donnees-usages.csv',rows)
per=read('bilan-par-outil.csv')
for r in per:
 if r['route']in ['/calculateur-investissement','/performance-depuis','/classements-performances']:
  r['reprise_et_preuve_attendue']='Reprise ciblée ordinaire workflow_dispatch42227576144, enregistrement et publication vérifiés dans financial-public/verified.json ; cron postcorrectif42235436731 observé : NGAS seul tenté et403 ; identités contrôlées, enregistrement refusé après master concurrent, reprise existante à observer. Les deux séries réparées étaient déjà courantes et non sélectionnées par ce cron.'
  r['complément_financier_du_lot']=('BNKE : unité80:1 corrigée depuis lancement exact, périodes pré2018-11 refusées. WOOD : clôture SIX de février2026 corrigée avec facteur de revenus conservé. Calculateur16cas Decimal, Performance depuis, classementsEUR depuis janvier et février2026 (bornes WOOD/FX comprises), PNG et vidéos vérifiés en production.'if verified else 'Registres réparés servis ; recette publique pas encore entièrement validée, aucune remise en service inférée du seul manifeste.')
 if r['route']in ['/duels-portefeuilles','/generateur-portefeuilles']:
  r['complément_financier_du_lot']='Données communes corrigées conservées ; aucune admission ni rôle automatique ajouté. Les années complètes avant2026 sont distinctes des calculs mensuels incluant2026. Pas de nouvelle recette publique de ces deux actifs annoncée dans cet outil.'
 if r['route']=='/il-y-a-x-ans':r['complément_financier_du_lot']='Prix de WOOD février2026 réparé. BNKE à travers le split et les prix historiques non qualifiés restent refusés ; voir tableau par instrument/période. Le rendement reste distinct du cours d’époque.'
write('bilan-par-outil.csv',per)
if verified:
 repairs=read('reparations-et-preuves.csv')
 for key,result in [('financial:BNKE:unités','Cours ajustés homogènes et calculs rétablis : source primaire réelle, collecte ordinaire, registre, publication, consommateurs vérifiés. Aucune ancienne divergence79 clôturée par cette réparation hors de ce périmètre.'),('financial:WOOD:2026-02','PrixSIX exact26.66USD et facteur de revenus conservé ; calculs et exports rétablis. Le mécanisme interne de l’erreur Yahoo reste inconnu.')]:
  repairs.append({'cause_identifiée':key,'résultat':result,'preuve':'PR1181 ; financial-public/verified.json ; financial-github-source-controls ; producteur de production et manifeste exact','diagnostics_initiaux_concernés':[]})
 write('reparations-et-preuves.csv',repairs)
 actions=read('statut-19-actions.csv')
 for r in actions:
  if r['action']=='P0-01':r['complément_6nov']+=' BNKE/WOOD corrigés et publiés ;70fenêtres du périmètre79préservées,9encore refusées. Restrictions des prix d’époque distinctes des rendements.'
 write('statut-19-actions.csv',actions)
b=json.load(open(O/'bilan.json'));b.update({'financialPublicCapture':context['build'],'financialPublicConsumersVerified':verified,'financialNumericalRepairs':2 if verified else 0,'publishedPriceReviewRecords':len(price),'priceUsageRestrictionsExplicitlyAttachedToNativeMatrixRows':overlays,'newMonthlyWindowsInConstant79Scope':0})
(O/'bilan.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'priceRows':len(price),'matrixRowsWithExplicitRestrictions':overlays,'financialConsumersVerified':verified}))
