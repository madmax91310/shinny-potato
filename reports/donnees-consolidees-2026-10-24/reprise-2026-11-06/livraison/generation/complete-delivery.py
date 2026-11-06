import pathlib,json,csv,gzip,collections,datetime,subprocess,sys,os
import csv
csv.field_size_limit(32 * 1024 * 1024)
R=pathlib.Path(os.environ.get('AUTOMATION_REPORT_ROOT','/tmp/automation-20261106'));O=R/'livraison'
def readcsv(name):
 with open(O/name,encoding='utf-8-sig',newline='')as f:return list(csv.DictReader(f,delimiter=';'))
def write(name,rows):
 rows=list(rows);keys=list(dict.fromkeys(k for r in rows for k in r))
 with open(O/name,'w',encoding='utf-8-sig',newline='')as f:
  w=csv.DictWriter(f,fieldnames=keys,delimiter=';');w.writeheader()
  for r in rows:w.writerow({k:json.dumps(v,ensure_ascii=False)if isinstance(v,(dict,list))else v for k,v in r.items()})
# Explicit proof applies only to this cause/step. Never close a whole instrument.
proofs={
 'instrument:IE00BM8R0J59:holdings':('blocage actuel confirmé, aucune réparation financière ni valeur rejetée renouvelée','qyld-current/qualification.json ; réponse officielle actuelle : table unique datée03novembre, poids contradictoires NVDA/AAPL/MSFT/AMZN'),
 'collection:update-scpi.yml:remake-live':('collecte rétablie, enregistrement/publication/PNG vérifiés','PR1180 ; push42186981489 refusé par garde ; reprise automatique42188004577 réussie ; manifeste public et repaired-public/proof.json'),
 'collection:update-insurance.yml:placement-direct-vie':('collecte et usage rétablis','PR1180 ; producteur42186981515 ; manifeste et repaired-public/proof.json'),
 'collection:update-regulatory-data.yml:broker-observation:saxo_offer':('offre exacte réactualisée et consommée','PR1180 ; producteur42186981501 ; repaired-public/proof.json'),
 'checks:update-regulatory-data.yml':('régression de fixture de campagne corrigée ; ne certifie pas tous les tarifs','PR1180 ; broker-automation-tests.log ; CI exacte et collecte42186981501'),
 'checks:deploy-pages.yml':('défaut du filtre de dates de revue corrigé ; les autres échecs/annulations de publication restent indépendants et ouverts selon leur reçu','PR1180 ; gates-1180-before-merge.json ; publication42186981343 et version997a840'),
 'instrument:IE00B4K6B022:completeHoldings':('compte à recevoir identifié et collecte réparée ; recouvrement complet encore refusé pour couverture actions insuffisante','PR1182 ; collecte42187394984 ; hsbc-public-final/proof.json ; 50actions99.14936%, aucun ajustement de dividende'),
 'instrument:IE00BQQP9F84:completeHoldings':('ancienne publication Other dépassée à la recette conservée ; publication émetteur contrôlée exploitable, pas un correctif de code de ce lot','collecte42187394984 ; gdx-public-final/proof.json ; 59positions identifiées99.98%'),
 'instrument:IE00BDFBTQ78:completeHoldings':('ancien Other absent de la nouvelle publication ; identités natives encore incomplètes, recouvrement non rétabli','collecte42187394984 ; mining-export/BILAN.json ; 0.07% sans rapprochement CUSIP indépendant'),
 'collection:update-editorial-radar.yml:radar-source:dws':('voie de presse contrôlée à la recette datée, puis automatisation volontairement arrêtée par#1188/#1189 ; usage désormais manuel','PR1183 ; production42193331548 ; artefact13490583160 ; date extraction ancienne conservée'),
 'collection:update-editorial-radar.yml:radar-source:xtrackers':('voie de presse contrôlée à la recette datée, puis automatisation volontairement arrêtée par#1188/#1189 ; usage désormais manuel','PR1183 ; production42193331548 ; artefact13490583160 ; date extraction ancienne conservée'),
}
recovery=R/'proofs/monthly-automatic-recovery/publication.json'
if recovery.exists():
 proofs['collection:update-market-monthly.yml:history:etc_natural_gasNav']=('collecte réelle renouvelée, enregistrée, publiée et consommée ; correction de niveau octobre publiée, aucun ancien écart annuel clôturé','reprise automatique42242620055 ; source19643dc4, enregistrement5739c1c, monthly-automatic-recovery/publication.json ; ngas-public/proof.json, calculateur quatre cas Decimal et PNG')
 proofs['producer-safety:monthly-recovery-request-scope']=('périmètre de reprise conservé par#1190 ; POST automatique ciblé réellement observé : une seule série NGAS, empreinte du rapport d’origine vérifiée ; collecte/enregistrement/publication de cette reprise suivis séparément','gates-1190-before-merge.json ; recovery-scope-production.json ; reprise automatique42288297918 après refus naturel42280175362 ; aucune défaillance artificielle produite en production')
hsbc_current=R/'proofs/hsbc-current-perimeter/observation.json'
if hsbc_current.exists():
 h=json.load(open(hsbc_current))
 proofs['instrument:IE00B4K6B022:completeHoldings']=('Collecte et identification du compte rétablies ; actions publiées, recouvrement complet encore refusé. Photographie'+h['asOf']+' : actions'+str(h['equityWeightPct'])+'%, contrat à terme restant hors transparisation économique. Aucun seuil abaissé.','PR1182 ; hsbc-public-final/proof.json recette datée ; hsbc-current-perimeter/observation.json état publié rapproché. Notionnel/multiplicateur/change et composition datée du sous-jacent nécessaires ; valeur comptable du future non assimilée à son exposition.')
activ=R/'proofs/activimmo-public/proof.json'
if activ.exists():proofs['collection:update-scpi.yml:activimmo']=('collecte, enregistrement, publication et usages rétablis','PR1185 ; voir preuves/activimmo-production.json et activimmo-public/proof.json ; géographie et secteurs30septembre, locataires366, TOF91.5%')
if activ.exists():
 for key in ['usage:scpi:activimmo:coverage:snapshot','scpi:activimmo:snapshot']:
  proofs[key]=('photographieActivImmo réactualisée et consommée ; champs et dates du registre publiés vérifiés, pas de certification des autresSCPI','PR1185 ; activimmo-public/proof.json et registre public exact ; reçu individuel activimmo du producteur42208631141')
jpm=R/'proofs/jepg-public/proof.json'
if jpm.exists():
 for key in ['instrument:IE0003UVYC20:aum','instrument:IE0003UVYC20:holdings','usage:IE0003UVYC20:catalog:4']:
  proofs[key]=(('Top10 JEPG natif réactualisé ;10positions partielles, aucun recouvrement complet certifié.'if key.endswith(':holdings')else'Encours USD du fonds JEPG réactualisé et consommé ; le catalogue et son JSON exposent cet encours, pas un nouveau champ top10. Pays/secteurs PDF antérieurs non déclarés réparés.'),'PR1187 ; jepg-github-production/receipt.json et jepg-public/context.json,proof.json ; source réelle, enregistrement et consommateurs publiés vérifiés')
rr=readcsv('rapprochement-diagnostics-initial-final.csv')
for r in rr:
 key=r['clé_initiale']
 if key in proofs:r['résultat_démontré_du_lot'],r['preuve_ciblée_du_lot']=proofs[key]
 else:r['résultat_démontré_du_lot']='aucune résolution nouvelle démontrée dans ce lot ; état public et cause exacte conservés'
write('rapprochement-diagnostics-initial-final.csv',rr)
# Retain every current cause, exact field actions and qualified targeted receipts.
causes=readcsv('causes-consolidees.csv')
for c in causes:
 keys=json.loads(c['clés']);matched={k:{'résultat':proofs[k][0],'preuve':proofs[k][1]}for k in keys if k in proofs}
 c['résultats_ciblés_du_lot']=matched
 c['statut_du_groupe']=('trace historique conservée, pas une panne courante'if c['catégorie']=='trace historique'else 'non applicable, aucune donnée fabriquée'if c['catégorie']=='non applicable'else 'résultats ciblés joints ; aucune résolution extrapolée aux autres identités/champs'if matched else 'qualification et prochaine action natives conservées ; aucune résolution nouvelle démontrée dans ce lot')
write('causes-consolidees.csv',causes)
# A current inbox trace can lag behind a proved provider repair: retain both.
write('reparations-et-preuves.csv',({'cause_identifiée':k,'résultat':v[0],'preuve':v[1],'diagnostics_initiaux_concernés':[r['identité_initiale']for r in rr if r['clé_initiale']==k]}for k,v in proofs.items()))
rows=readcsv('matrice-donnees-usages.csv')
for r in rows:
 state=r['état_usage'];block=r['qualification_bloquante'];reason=r['raison']
 r['catégorie_du_reliquat']=('archive/hypothèse/référence/non applicable à requalifier selon nature explicite'if state in ['not-applicable','reference','editorial','manual-assumption']else 'preuve de tentative/qualification manquante, aucune panne déduite'if state in ['unconfirmed','scheduled-evidence']else 'voie déclarée raccordée ; preuve individuelle à lire, pas certification globale'if state=='connected'else 'usage bloqué ou raccordement manquant, cause financière/source exacte conservée')
 if block in ['field-check-required','field-certificate-missing','source-cycle-proof-missing','targeted-field-certificate-unlinked'] or state in ['scheduled-evidence','qualification-needed']:
  r['catégorie_du_reliquat']='preuve ou qualification incomplète ; panne de collecte et indisponibilité du calcul non démontrées par ce seul statut'
 if block=='not-published' and 'Les historiques mensuels restent automatisés' in reason:
  r['catégorie_du_reliquat']='calendrier annuel émetteur non publié ; voie mensuelle distincte conservée, pas une panne mensuelle déduite'
 if block=='manual' and r['champ']=='Éligibilité PEA':
  r['catégorie_du_reliquat']='qualification fiscale explicite manquante ; aucune éligibilité ni inéligibilité déduite, pas une panne générale de tous les usages'
 r['preuve_nouvelle_du_lot']='aucune certification supplémentaire de ce champ'
 if r['instrument']in ['scpi:remake-live','insurance:placement-direct-vie']or (activ.exists()and r['instrument']=='scpi:activimmo'):
  r['preuve_nouvelle_du_lot']='registre public exact et producteur ordinaire réel ; champs présents seulement, voir matrice native/source et recette PNG du produit'
 if jpm.exists()and r['instrument']=='IE0003UVYC20':
  c=json.loads(r['certificat_ciblé'])if r.get('certificat_ciblé')else None
  if c and c.get('field')in ['aum','holdings']:r['preuve_nouvelle_du_lot']='JEPG : preuve API ciblée du champ, producteur ordinaire enregistré/publié et recette publique ; aucune certification des autres champs PDF.'
 if r['instrument']=='IE00B4K6B022'and r['clé_du_contrat'].endswith('completeHoldings'):
  r['preuve_nouvelle_du_lot']='collecte actuelle réparée ;50actions ; recouvrement intégral toujours refusé, pas de normalisation'
write('matrice-donnees-usages.csv',rows)
# Every active tool retained, including the five not in the native financial contracts.
tools=json.load(open(R/'proofs/tools-current.json'));byroute={r['route']:r for r in readcsv('bilan-par-outil.csv')}
notes={
 '/presentations':('Remake Live et Placement-direct Vie : source → producteur → registre → texte et PNG bureau/mobile vérifiés. '+('ActivImmoT3 vérifié en production.'if activ.exists()else 'ActivImmoT3 : collecte locale/GitHub et recette locale réussies, production pas encore prouvée.'),'LinxeaVie : périmètre fonds actuel Netissima/Vertessima différent de la fiche conservée ; qualifier explicitement Eurossima et les conditions. Autres acteurs/assurances : limites natives de la matrice conservées.'),
 '/comparatif-courtiers':('BoursoMarkets et offre PEA Saxo actualisés par le producteur, texte/PNG bureau/mobile vérifiés.','TradeRepublic : anciennes FAQ redirigées vers accueil ; contrat officiel09/2026 accessible mais clauses exactes non qualifiées. BourseDirect : conditions de liquidités non démontrées ; pas de date renouvelée sur échec.'),
 '/le-dca-de':('GDX :59positions99.98%, comparaison entreprise par entreprise et exports vérifiés. HSBC : compte natif qualifié,50actions ; GGRA :439positions, identités consolidées, aperçu et export vérifiés.','Recouvrement complet HSBC99.14936% et GGRA100.0005% dans la photographie antérieure (100.0008% au5novembre) refusé par les gardes existantes. Mining0.07% sans identité native prouvée ; autres compositions partielles et expositions non qualifiées conservées.'),
 '/radar-editorial':('Deux voies presse DWS/Xtrackers réparées et collectées en production ; contrôle listing réellement réussi sans dater à nouveau les anciens articles.','Autres accès/extractions et contradictions financières restent distincts ;Alertes courantes comptées dans bilan.json et conservées individuellement dans le rapprochement final. Aucun mouvement déduit de révisions non qualifiées.'),
 '/donnees-a-revoir':('Export public complet, moniteur et inventaire consommés capturés ; aucune interface ni contrat#968 réécrit.','L’historique reste distinct d’une panne active ; la disparition d’une clé ne suffit pas pour conclure à sa résolution.'),
 '/le-budget-de':('Budgets rédigés/sourcés et hypothèses : pas des clôtures à recollecter quotidiennement. Lot concurrent#1184 préservé.','Ce lot ne certifie pas à nouveau ses70budgets ni ses exports ; PR et validation propres au chantier budget.'),
 '/idees-classements':('Contenu éditorial, idées et archives : aucune actualisation financière universelle exigible.','Chiffres vivants éventuels non recertifiés dans ce lot ; qualification antérieure conservée.'),
 '/hey-grok':('Questions, sélections et hypothèses éditoriales : aucune source financière inventée.','Les réponses externes deGrok ne sont pas certifiées par l’application.'),
 '/dilemme':('Hypothèses/saisies de scénario conservées ; pas assimilées à une panne de collecte.','Pas de nouvelle recette financière individualisée dans ce lot.'),
}
notes['/radar-editorial']=('DWS/Xtrackers presse contrôlés avant l’arrêt explicite#1188/#1189. Radar désormais sur demande, collect=true ; aucune reprise automatique réactivée.','Choix manuel actuel conservé, pas une panne. Les contradictions financières et les anciennes erreurs restent datées ; les sources financières partagées poursuivent leurs propres calendriers.')
if jpm.exists():
 notes['/fiches-etf']=('JEPG : encours du fonds et top10 natif actualisés par le producteur API, texte/PNG bureau/mobile vérifiés ; aucun changement de maquette.','Pays et secteurs du PDF restent antérieurs ; taxonomie API non substituée. Les autres limites individuelles restent dans la matrice.')
 notes['/bibliotheque-donnees']=('JEPG : encours et sa source/date/devise retrouvés dans la fiche et l’export JSON réel bureau/mobile.','Le catalogue ne publie pas un champ top10 JEPG distinct ; aucune nouvelle recette de ce champ dans cette bibliothèque ni certification globale des autres fiches.')
history={'/calculateur-investissement','/classements-performances','/performance-depuis','/generateur-portefeuilles','/duels-portefeuilles','/il-y-a-x-ans'}
out=[]
for t in tools:
 r=byroute.get(t['route'],{'outil':t['name'],'route':t['route'],'contrats_explicitement_déclarés':0,'limite':'outil absent du tableau natif des consommateurs financiers ; classé explicitement ci-dessous, pas assimilé à zéro donnée nécessaire'})
 r['fonctionnement_nouveau_démontré'],r['fonctions_ou_preuves_encore_manquantes']=notes.get(t['route'],('Données et raccordements antérieurs conservés ; détails champ×usage dans la matrice publique complète.','Aucune nouvelle certification exhaustive de toutes les données de cet outil par ce lot.'))
 if t['route']in history:r['fonctions_ou_preuves_encore_manquantes']='Neuf fenêtres mensuelles encore refusées sur79 ; voir neuf-fenetres-refusees.csv et ses fenêtres/conventions propres.70fenêtres préservées ; calendriers annuels indépendants ne comptent pas comme rétablissement mensuel. Autres limites par champ dans la matrice.'
 r['reprise_et_preuve_attendue']='Producteurs ordinaires et reprises bornées conservés ; reçus planifiés déjà disponibles dans preuves/scheduled-holdings-artifact et preuves/scheduled-non-bond-artifact, avec leurs périmètres exacts. Pour chaque nouvelle correction, le push ou la reprise ne prouve pas un cron ; voir reçu individuel et bilan daté.'
 out.append(r)
assert len(out)==len(tools)==26
if hsbc_current.exists():
 h=json.load(open(hsbc_current))
 for row in out:
  if row['route']=='/le-dca-de':
   row['fonctions_ou_preuves_encore_manquantes']=row['fonctions_ou_preuves_encore_manquantes'].replace('HSBC99.14936%', 'HSBC'+str(h['equityWeightPct'])+'% (photographie'+h['asOf']+', notionnel du contrat à terme non qualifié)')
write('bilan-par-outil.csv',out)
# Original19 statuses are archival qualification levels, not a new full certification.
p=R/'repo/reports/donnees-consolidees-2026-10-24/statut-19-actions.csv'
with open(p,encoding='utf-8-sig',newline='')as f:actions=list(csv.DictReader(f,delimiter=';'))
for r in actions:
 r['complément_6nov']='statut antérieur conservé ; corrections et preuves actuelles dans reparations-et-preuves.csv, aucune recertification globale'
 if r['action']=='P1-04':r['complément_6nov']='HSBC compte natif réparé/collecté/publié ; GDX courant requalifié. Mining0.07% reste non résolu, compositions insuffisantes et identités WisdomTree non inventées.'
 if r['action']=='P2-04'or r['action']=='P1-01':r['complément_6nov']='périmètre exclusivement IA supprimé, jamais réactivé'
write('statut-19-actions.csv',actions)
b=json.load(open(O/'bilan.json'));b.update({'activeToolsRetainedInPerToolReport':26,'actions19StatusesPreserved':dict(collections.Counter(r['statut']for r in actions)),'specificInitialDiagnosticRowsWithNewProof':sum(r['clé_initiale']in proofs for r in rr),'evidenceDoesNotCertifyUnrelatedFields':True,'completedAutomationClaimed':False})
(O/'bilan.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(b,ensure_ascii=False))
