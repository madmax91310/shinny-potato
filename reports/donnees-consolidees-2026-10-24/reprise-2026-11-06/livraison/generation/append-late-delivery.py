"""Reconcile late validated repairs into the SAME delivery; never infer success from a job."""
import csv,json,pathlib,datetime
csv.field_size_limit(32*1024*1024)
R=pathlib.Path('/tmp/automation-20261106');O=R/'livraison';P=R/'proofs'
def read(n):
 with (O/n).open(encoding='utf-8-sig',newline='')as f:return list(csv.DictReader(f,delimiter=';'))
def write(n,rows):
 fields=list(dict.fromkeys(k for r in rows for k in r))
 with (O/n).open('w',encoding='utf-8-sig',newline='')as f:
  w=csv.DictWriter(f,fields,delimiter=';');w.writeheader();w.writerows(rows)
ready=lambda f:(P/f).exists()
gx=all(ready(f)for f in ['globalx-ordinary-production/publication.json','globalx-public/proof.json','globalx-presentation-public/proof.json'])
ru=all(ready(f)for f in ['russell-production/publication.json','russell-public/proof.json'])
sc=all(ready(f)for f in ['scpi-guard/production.json','scpi-guard/publication.json']);proofs={}
if gx:
 for k in ['instrument:IE00BMH5Y871:completeHoldings','instrument:IE00BMH5Y871:holdings','instrument:IE00BMH5Y871:aum','collection:update-exposure-expansion.yml:etf-exposure-expansion-IE00BMH5Y871','collection:update-qualified-exposures.yml:dca-holdings:IE00BMH5Y871']:
  proofs[k]=('Global X Cybersecurity BUG : source réelle, enregistrement, publication, présentation, recouvrement et exports vérifiés.30actions99.796%,trésorerie nette0.204%,poids natifs sans renormalisation. Ce contrôle du compte de règlement ne modifie ni encours ni expositions économiques.','PR1192 ; globalx-ordinary-production/receipt.json,publication.json ; globalx-public/proof.json ; globalx-presentation-public/proof.json')
if ru:proofs['collection:collect-etf-pilot.yml:index-russell-1000-composition']=('Russell1000 : PDF officiel31octobre,1022titres,11secteurs imprimés qualifiés et publiés ; Bibliothèque et JSON vérifiés. Aucun nouveau raccordement Coulisses, faute de top10 mensuel ; trimestre30juin distinct.','PR1193 ; russell-production/receipt.json,publication.json ; russell-public/proof.json')
if sc:proofs['producer-safety:scpi-independent-etf-revalidation']=('Refus SCPI42280725727 reproduit puis corrigé sans modifier les contrôles financiers ; rebase et revalidation de l’arbre combiné obligatoires. Reprise ordinaire après fusion vérifiée ; la course Git elle-même est prouvée en isolation, pas provoquée en production.','PR1195 ; scpi-guard/pr-receipt.json,production.json ;105tests Git et validations exactes du commit')
rows=read('rapprochement-diagnostics-initial-final.csv')
for r in rows:
 if r['clé_initiale']in proofs:r['résultat_démontré_du_lot'],r['preuve_ciblée_du_lot']=proofs[r['clé_initiale']]
write('rapprochement-diagnostics-initial-final.csv',rows)
repaired=read('reparations-et-preuves.csv')
for k,(v,p)in proofs.items():repaired.append({'cause_identifiée':k,'résultat':v,'preuve':p,'diagnostics_initiaux_concernés':json.dumps([r['identité_initiale']for r in rows if r['clé_initiale']==k],ensure_ascii=False)})
write('reparations-et-preuves.csv',repaired)
causes=read('causes-consolidees.csv')
for r in causes:
 matches={k:{'résultat':proofs[k][0],'preuve':proofs[k][1]}for k in json.loads(r['clés'])if k in proofs}
 if matches:
  old=json.loads(r['résultats_ciblés_du_lot']);old.update(matches);r['résultats_ciblés_du_lot']=json.dumps(old,ensure_ascii=False);r['statut_du_groupe']='réparation ciblée prouvée ; présence native/historique conservée séparément, aucune clôture de champ distinct extrapolée'
write('causes-consolidees.csv',causes)
tools=read('bilan-par-outil.csv')
for r in tools:
 adds=[]
 if gx and r['route']=='/le-dca-de':adds+=['BUG :30actions99.796% et trésorerie nette0.204%, recouvrement avec S&P500 recalculé indépendamment, aperçu et PNG vérifiés bureau/mobile.']
 if gx and r['route']=='/fiches-etf':adds+=['BUG : encours109843360.8USD au5novembre, dix plus grandes actions identifiées, texte/aperçu/PNG vérifiés ; pays/secteurs conservent leur date31octobre.']
 if gx and r['route']=='/bibliotheque-donnees':adds+=['BUG : encours/source/date/devise et export JSON vérifiés.']
 if ru and r['route']=='/bibliotheque-donnees':adds+=['Russell1000 : composition31octobre,1022titres,11secteurs,source et export JSON vérifiés ; positions trimestrielles30juin distinctes. Aucun nouveau PNG ou usage de calcul revendiqué.']
 if sc and r['route']=='/presentations':adds+=['Enregistrement SCPI requalifié face aux seules sorties ETF indépendantes, puis voie ordinaire après fusion vérifiée ; aucune panne financière masquée.']
 if adds:r['fonctionnement_nouveau_démontré']+=' '+' '.join(adds)
write('bilan-par-outil.csv',tools)
m=read('matrice-donnees-usages.csv')
for r in m:
 if gx and r['instrument']=='IE00BMH5Y871':
  field=r['champ']+' '+r['clé_du_contrat']
  if any(x in field for x in ['aum','holdings','completeHoldings','Encours','positions','Composition complète']):r['preuve_nouvelle_du_lot']='BUG : preuves ciblées du producteur ordinaire et des consommateurs publics ; détails par champ dans globalx-ordinary-production et recettes bureau/mobile. Aucun autre champ certifié par extension.'
 if ru and r['instrument']=='russell-1000'and'Composition'in r['champ']:r['preuve_nouvelle_du_lot']='Russell : contrôle du PDF exact et JSON public, pas admission massive dans les outils ni mélange des positions trimestrielles.'
write('matrice-donnees-usages.csv',m)
wtproofs=[P/'wisdomtree-four-public'/i/'proof.json'for i in ['IE0002Y8CX98','IE000W8WMSL2','IE00BDVPNG13','IE00BZ56SW52']]
if all(p.exists()for p in wtproofs):
 tools=read('bilan-par-outil.csv')
 for row in tools:
  if row['route']=='/le-dca-de':
   row['fonctionnement_nouveau_démontré']+=' Acquisitions WisdomTree déjà rétablies et préservées :4livres42/47/58/439titres vérifiés dans le navigateur public et leurs PNG bureau/mobile ; Defence admet le recouvrement, trois autres gardent Partiel. Aucune nouvelle réparation ni baisse de seuil comptée pour ces acquisitions.'
   row['fonctions_ou_preuves_encore_manquantes']+=' Photographie5novembre : Quantum100.0001%,AI100.0002%,GGRA100.0008%, refus du taux intégral conservé ; il manque une qualification de ces dépassements, pas un nouveau connecteur de collecte. Les pays Unknown restent un champ séparé.'
 write('bilan-par-outil.csv',tools)
p=O/'LIVRAISON.md';s=p.read_text();s+='\n## Compléments validés dans le même lot\n\n'
if gx:s+='PR[#1192](https://github.com/madmax91310/shinny-potato/pull/1192) : BUG Global X Cybersecurity, collecte et enregistrement rétablis ; présentation ETF/texte/PNG, encours/JSON et recouvrement/PNG vérifiés publiquement aux deux largeurs. Le compte de règlement signé est validé par les montants publiés ; les poids des actions restent natifs. Le dénominateur de ce livre de positions n’est pas substitué à l’encours publié du fonds. Le passage après fusion est un événementpush, pas un nouveau cron.\n\n'
else:s+='PR#1192 fusionnée, résultats individuels collectés/enregistrés ; preuve publique complète encore manquante.\n\n'
if ru:s+='PR[#1193](https://github.com/madmax91310/shinny-potato/pull/1193) : Russell1000, centre du disque qualifié sans changer les valeurs imprimées ni le seuil de0.5point. Production/PDF/registre/Bibliothèque/JSON vérifiés. La fiche Coulisses reste absente faute de top10 mensuel ; aucun nouvel usage image n’est inventé. Les positions trimestrielles restent datées séparément.\n\n'
else:s+='PR#1193 fusionnée et collecte officielle enregistrée ; preuve de consommation publique encore manquante.\n\n'
if sc:s+='PR[#1195](https://github.com/madmax91310/shinny-potato/pull/1195) : garde SCPI corrigée uniquement pour les sorties ETF indépendantes ;105tests de course Git, refus d’entrées SCPI/code/politique et échec de revalidation conservés ; nouvelle voie ordinaire prouvée après fusion. Une concurrence avec les sorties acteurs a réellement été rebasée et revalidée ; la nouvelle exemption ETF reste éprouvée en CI, non observée sur une seconde course ETF de production. La première reprise réussie42281603537 avait déjà publié les observations avant ce correctif ; elle reste séparée de la preuve du nouveau garde. Un test Russell est détaché du registre vivant pour conserver son horloge historique.\n\n'
else:s+='PR#1195 : validation/fusion/production encore à rapprocher du reçu ; aucune résolution nouvelle inférée.\n\n'
if all(p.exists()for p in wtproofs):s+='WisdomTree : les quatre acquisitions complètes ne sont plus des pannes de collecte. Les huitparcours publics et PNG prouvent le recouvrement Defence42titres et les refus Partiel Quantum47/AI58/GGRA439. Les totaux publiés100.0001%,100.0002%,100.0008% restent inchangés ; leur cause n’est pas attribuée arbitrairement à des arrondis. La qualification pays Unknown appartient à une autre observation et ne se résout pas par ces positions datées différemment. Voir preuves/wisdomtree-four-public.\n\n'
s+='Les quatre parts obligataires IE0008UEVOE0,IE000SNLFDR7,IE00B4WXJG34 etIE00BCRY6557 ont aussi16groupes observés (encours,pays,secteurs,principales positions) rapprochés exactement des valeurs publiques au relevé ; preuve scheduled-bonds-nov6/publication-check.json. Ce contrôle ne certifie pas leurs autres champs. Les nouvelles recettes sont distinctes des anciennes divergences financières et des neuf fenêtres refusées. Le passage planifié6novembre42242712749 valide individuellement199positions complètes, dont HSBC/GDX/Mining ; sa nouvelle erreur GlobalX a été corrigée ensuite. La réussite de la collecte Mining ne qualifie pas automatiquement chaque CUSIP ni le recouvrement. Le cron extension hors obligations42238737026 apporte86résultats explicites pour86attendus, sans erreur ; son rapport individuel est conservé ; aucun succès global ne certifie tous les champs.\n'
p.write_text(s)
print(json.dumps({'GlobalXPublic':gx,'RussellPublic':ru,'ScpiNewGuardProduction':sc,'newExactProofKeys':len(proofs)}))
# Latest ordinary source attempts remain distinct from retained historical NAVs.
p=O/'LIVRAISON.md'
with p.open('a')as f:
 f.write('\n## Dernières tentatives mensuelles ordinaires\n\nWTAI : le producteurpush42291553949 contrôle réellement la source sans changement, un instrument explicitement attendu et17champs qualifiés ; enregistrement5a8a075. NGAS : l’essai ciblé42292584761 échoue surHTTP403 de la voie officielle. Son observation d’échec est enregistrée enb641e88, sans nouveau succès financier. Le point d’octobre4.21602288 précédemment qualifié reste conservé avec sa preuve ; les reprises bornées ne sont pas réinitialisées. Ces résultats ne créent aucune nouvelle fenêtre sur les79cas. Voir preuves/month-end-guard/final-*-source-result.json et final-monthly-publication.json ; publication/consommation rapprochées séparément.\n')

p=O/'LIVRAISON.md'
with p.open('a')as f:f.write('\nJEPG : l’examen hors ligne de la réponse officielle déjà acquise précise les limites des pays quotidiens : ARCH CAPITAL BMG0450A1053(0.143427842179479%) etHKT HK0000093390(0.050446582457264%) sans pays, huitoptions d’indice de valeur comptable signée, liquidités séparées et secteurs tousnuls. Aucune déduction depuis le préfixeISIN ni renormalisation. Cette liste ne remplace pas la ventilation mensuelle officielle non liée à ses en-têtes. Il s’agit de qualification/documentation, sans nouvelle collecte ni renouvellement de preuve. Voir preuves/jepg-current/daily-country-qualification.json.\n')

p=O/'LIVRAISON.md'
with p.open('a')as f:f.write('\nPublication : la première tentative42279131940 a échoué à22:06 après10minutes en syncing_files, sans panne générale annoncée parGitHub. La voie ordinaire42278834427 a ensuite sélectionné b641e88, réussi les14contrôles, déployé via le job128202036797 et vérifié la publication réelle. Cette récupération est distincte de la reprise ciblée du premier job : celle-ci termine ensuite avec succès en ignorant proprement le déploiement désormais dépassé, sans republier un ancien code. Les aperçus,PNG etJSON publics concernés ont été contrôlés après publication. Voir preuves/pages-code-retry.json,postmerge-nested-full-gate.json,postmerge-publication-verified.json.\n')

p=O/'LIVRAISON.md'
with p.open('a')as f:f.write('\nMoniteur public : le décalage de cache max-age300 a été observé puis résorbé sans modification du consommateur. La capture finale charge le blob4dd3beaaebd6ad423349db89b5a07997dae450ff réellement consommé ; l’ancien échec Pages n’est plus une panne active dans ce relevé, NGAS403 reste visible. Les qualifications composites GlobalX/Russell non reliées à un certificat de champ restent conservées : les preuves ciblées et les usages vérifiés ne sont pas transformés en certification de tous leurs champs ni de la branche historique initiale. Voir preuves/final-monitor-consumption.json et monitor-publication-cache.json.\n')
# Keep the machine-readable bilan synchronized with the late, individually proved deliveries.
b=json.load((O/'bilan.json').open());capture=json.load((R/'public-final/capture.json').open());b.update({'sourcePRsDelivered':[1180,1181,1182,1183,1185,1187,1190,1191,1192,1193,1195],'lateDeliveryPublicProofs':{'GlobalX':gx,'Russell':ru,'ScpiGuard':sc},'finalPublicBuild':capture['after'],'finalMonitorGitBlob':json.load((P/'final-monitor-consumption.json').open())['monitorGitBlob'],'final14ControlsProof':'preuves/postmerge-nested-full-gate.json','finalPublicationProof':'preuves/postmerge-publication-verified.json','latestMonthlyIndividualResults':{'etfIE00BDVPNG13Nav':'unchanged-verified; actual source control,17fields; publication verified','etc_natural_gasNav':'failed403; failure published; qualified financial points conserved; bounded recovery unchanged'},'specificInitialDiagnosticRowsWithNewProof':sum(bool(r.get('preuve_ciblée_du_lot'))for r in rows),'lateProofKeysAreNotDistinctRepairCauses':True,'completedAutomationClaimed':False});(O/'bilan.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
