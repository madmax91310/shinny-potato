import json,csv,pathlib,collections,subprocess,hashlib
R=pathlib.Path(__file__).resolve().parents[1];P=R/'reports/corrections-2026-10-22'
plan=json.load(open(P/'plan-corrections.json'))
# Statuses deliberately retain unresolved causes, access failures and unverified branches.
items=[
('partiellement corrigée','Qualification mensuelle commune et refus ciblés des cinq fenêtres annuelles non valorisables. Paris EUR et Londres USD sont des cotations distinctes, jamais des historiques substitués.','Mining et Copper restent à investiguer ; les cours de la cotation suisse Aerospace ne sont pas réparés.','historiques-recollectes.json;qualification-quatre-historiques.json;aerospace-2025.json;navigateur-corrections.log','test-audit-history-quality.mjs;test-market-calendar-performance.mjs;test-performance-rankings.mjs'),
('partiellement corrigée','90 couples part × année relus, 53 collectes de cours et 53 collectes de fiches officielles réussies ; bornes, conventions, change et sources conservés. Cinq refus corrigent le calcul utilisateur.','85 causes financières encore inexpliquées. Une réussite de collecte ne garantit pas la présence de toutes les anciennes années NAV : 2016 de IE00BYTRR863 est absent du calendrier actuel.','historiques-recollectes.json;nav-recollectes.json;comparaisons-originales.json','reconcile-audit-cases.mjs'),
('corrigée','SOXX identifié US4642875235 / XNAS / USD ; simulation explicitement hors dividendes. Preuve réelle du dividende et du split 3:1 de mars 2024 ; ajustement non appliqué deux fois.','Aucune admission de SOXX comme série de rendement total.','soxx-identite-verifiee.json;soxx-evenements.json;soxx-ajuste.json','test-soxx-conventions.mjs;test-investment-conclusions.mjs'),
('corrigée','Deux commandes YAML séparées ; échec isolé de la seconde propagé avec code 23, audits réels exécutés.','Test isolé ; aucun échec injecté en production.','tests-workflows.log;tests-ai-runtime.log;tests-ai-coverage.log','test_audit_workflows.py'),
('corrigée','INSEE : sélection sémantique de la distribution, contrôle de la population, de l’année et de l’unité. Données réelles 2025 : médiane 2238 et D9 4441 euros nets mensuels EQTP.','Champ de la figure : alternants, stagiaires et contrats aidés inclus ; agriculture et particuliers employeurs exclus.','insee-corrige.json;insee-corrige.log','test_economic_data.py'),
('bloquée','Sept grilles tarifaires sur huit sont récupérables ; accès officiels réessayés par collecteur et navigateur. Dernières valeurs valides et anciennes dates de preuve conservées.','Bourse Direct et la référence fiscale BOFiP d’IBKR restent inaccessibles (503). Pas de source alternative financièrement qualifiée.','courtiers-recollecte.json;courtiers-navigateur.json;voies-officielles.json','test_broker_tariff_sources.py;test_broker_tariff_profiles.py'),
('corrigée','Reprise VanEck sur déconnexion réseau, sans avaler les erreurs financières. Cinq caractéristiques/PDF réels et quatre collectes de positions récupérés et raccordés aux projections.','212 positions dont 211 identifiées ; une position WisdomTree inconnue conserve le refus du recouvrement complet.','positions-recollectees.json;positions-appliquees.json;positions-consommees.json;nav-recollectes.json','test_non_bond_expansion.py;test_physical_holdings.py;test_wisdomtree_api_holdings.py;test-exposure-complete.mjs'),
('corrigée','Référence pédagogique vers DIC officiel exact FR0013416716, publié le 19 juin 2026 ; fragments structuraux et risques hachés, revue éditoriale conservée.','Accès documentaire vérifié ; aucune licence de réutilisation déduite du téléchargement.','practical-gold-recollecte.json','test_practical_sheets.py'),
('corrigée','DWS : onze photographies de dates différentes différées ; comparaison financière seulement à dates compatibles. Une observation ancienne ne remplace plus une récente ; incidents et derniers blocs valides conservés.','Différer pour publication ne certifie pas les poids à la nouvelle date.','dws-recollecte.json;dws-verification-finale.json;tests-dws-gate-final.log;tests-dated-records.log;tests-radar-all.log','test_dws_reconciliation.py;test-dated-records.mjs;test-editorial-radar.mjs'),
('corrigée','28 consultations 13F réelles sans nouvelle position ; dernier contrôle réussi persisté indépendamment de la date de collecte des positions, du trimestre et des amendements.','Échec sans renouvellement de la preuve financière ; pas de nouvelle déclaration inventée.','collecte-13f.json;13f-application.json','test_investor_refresh.py'),
('corrigée','Trois Vanguard composition-only qualifiés selon leurs véritables capacités. Impact des frais exige identité et TER pour son préremplissage ETF, pas des données inutilisées.','Impact des frais possède bien un préremplissage ETF dans le code actuel : l’ancienne généralisation aux seules hypothèses a été corrigée.','tests-field-coverage.log;tests-etf-fields.log;vanguard-underliers-reels.json','test-asset-field-coverage.mjs;test_etf_field_completion.py'),
('corrigée','Positions économiques, top10, fonds/indice et panier restent distincts. Pas de renormalisation silencieuse ; poids et identifiants inconnus préservés ; consolidation et symétrie du recouvrement testées.','Un fichier complet contenant une position sans identifiant ne certifie pas un recouvrement complet ; donuts compatibles restent utilisables.','positions-consommees.json;tests-overlap.log;tests-dca.log','test-exposure-checker.mjs;test-exposure-complete.mjs;test-exposure-scope.mjs'),
('bloquée','Conflit et inconnu PEA préservés après nouvelle collecte de la part exacte.','IE00B0M62S72 : conflit entre preuves courantes ; IE0003R87OG3 : statut explicite non obtenu. Aucune conversion de null en false.','pea-recollecte.json;pea-recollecte.log','audit-instrument-catalog.mjs;test-data-qualification.mjs'),
('corrigée','35 preuves legacy renouvelées avec identités officielles, 35 récupérations quotidiennes réelles ciblées et 35 evidenceId présents dans les projections publiques. Compétitions et exports vérifiés dans des fixtures isolées ; portefeuille de production inchangé.','Qualification ≠ admission ≠ sélection. Non-détenus rattrapés à la demande, sans collecte quotidienne massive. SEC N-CEN : quatre archives réelles, échec visible sans dater artificiellement les données précédentes.','ai-35-preuves.json;ai-35-preuves-publiees-projection.json;navigateur-ia-final.log;sec-classifications-reel.json','test-ai-portfolios.mjs;test-ai-weekly.mjs;test_ai_security_classifications.py;playwright-ai-portfolios.mjs'),
('partiellement corrigée','Accès, tentative, dernière réussite et données financières SCPI séparés. Huit SCPI contrôlées : sept disponibles et Remake en attente de bulletin ; aucune panne ne rajeunit la dernière preuve.','L’échéance de surveillance calculée trimestriellement à 45 jours est une politique interne, pas un engagement daté confirmé de Remake. Confirmation éditoriale encore requise ; champs anciens non requalifiés restent périmés.','scpi-recollecte.json;tests-scpi.log','test_scpi.py;test_publication_periods.py;test_extended_scpi.py'),
('partiellement corrigée','Contrats cachés pour 90 textes et 62 faits ; frais vivants des guides explicitement identifiés raccordés au TER commun. Archives, hypothèses, rédaction et verrous de revue conservés.','Tous les autres chiffres vivants du corpus ne sont pas encore raccordés automatiquement ; contrats de données seuls ne prouvent pas une actualisation.','tests-tweet-bank.log','test-reusable-data-contracts.mjs;test-tweet-bank-validity.mjs'),
('partiellement corrigée','Consommateurs dynamiques des 32 shards de positions et des projections IA déclarés ; répertoires de sortie reconnus. Aucun fichier supprimé sur simple absence d’import statique.','Les autres projections sans consommateur déclaré restent dans le reliquat initial ; le graphe n’est pas une certification de tous les usages runtime.','tests-inventory.log','test-data-automation-inventory.mjs'),
('partiellement corrigée','Politiques par nature conservées ; séparations contrôle/publication/prix appliquées, tests de séance, mois/année, panne et reprise. Pas de collecte quotidienne universelle.','Tous les calendriers et fournisseurs des branches restantes ne sont pas recertifiés ; échéance explicite Remake encore non confirmée.','tests-qualification.log;tests-scpi.log;tests-ai-runtime.log','test-data-qualification.mjs;test_publication_periods.py;test_ai_portfolios.py'),
('corrigée','Registre central des conditions documentées pour 49 hôtes ; points inconnus explicites ; licence World Bank limitée au jeu or concerné, jamais généralisée à l’hôte.','Correction de centralisation documentaire uniquement : l’accès HTTP ne donne pas une licence et les droits encore inconnus restent non vérifiés.','tests-inventory.log','test-data-automation-inventory.mjs'),
]
assert len(plan)==len(items)==19
rows=[]
for p,(status,change,remaining,proofs,tests)in zip(plan,items):
 rows.append({'action':p['id'],'priorité':p['priorité'],'statut':status,'constat_initial':p['constat'],'correction_démontrée':change,'limitation':remaining,'outils':p['outils'],'actifs':' | '.join(p['actifs']),'fichiers_de_départ':' | '.join(p['fichiers']),'preuves':' | '.join('preuves/'+x for x in proofs.split(';')),'tests':tests.replace(';',' | ')})
def csvwrite(name,records):
 with open(P/name,'w',encoding='utf-8-sig',newline='')as f:
  w=csv.DictWriter(f,fieldnames=list(records[0]),delimiter=';');w.writeheader();w.writerows(records)
csvwrite('statut-19-actions.csv',rows);(P/'statut-19-actions.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
cases=json.load(open(P/'reconciliation-90-ecarts.json'));modules=json.load(open(P/'bilan-modules.json'));ci=json.load(open(P/'preuves/controles-ci.json'))
counts=dict(collections.Counter(r['statut']for r in rows));bilan={'base_initiale':'9a4ffd2fb7c3bb643c265718117b066f57d69530','master_intégré':'5f26a78','actions':{'total':19,'statuts':counts},'écarts':{'total':90,'parts_uniques':53,'statuts':cases['counts'],'périodes_non_comparables_conservées':175,'collectes_cours_parts_réussies':53,'collectes_fiches_NAV_parts_réussies':53,'années_NAV_demandées_absentes_du_calendrier_actuel':1},'modules':modules,'tests_python':{'exécutés':894,'réussis':894},'contrôles_CI_locaux':{'exécutés':len(ci),'réussis':sum(x['exitCode']==0 for x in ci),'échoués':sum(x['exitCode']!=0 for x in ci)},'preuve_IA':{'preuves_legacy_initiales':35,'preuves_identité_renouvelées':35,'cotations_requalifiées_en_réseau':35,'preuves_projetées_publiques':35,'transactions_production_ajoutées':0},'périmètre_initial_non_recertifié':{'outils_routés':26,'profils_catalogue':1527,'ISIN_natifs':650,'séries':703,'matrice_lignes':214711,'couples_outil_actif':69994,'reliquat_lignes_initiales':21731},'avertissement':'Corrections des 19 actions, pas certification indépendante de toutes les données. Les 85 causes restantes ne sont pas résolues ; les 175 non-comparaisons restent conservées.'}
(P/'bilan-corrections.json').write_text(json.dumps(bilan,ensure_ascii=False,indent=2)+'\n')
remaining=[]
for c in cases['cases']:
 if c['status']=='anomalie encore inexpliquée':remaining.append({'type':'écart financier','id':str(c['isin'])+'/'+str(c['year']),'statut':'cause non démontrée','motif':c['demonstratedCause'],'preuve':'reconciliation-90-ecarts.csv','action':'Obtenir les NAV historiques quotidiennes et qualifier les ajustements/cotations aux deux bornes ; aucune modification automatique de la série.'})
for m in csv.DictReader(open(P/'modules-verification.csv',encoding='utf-8-sig'),delimiter=';'):
 if m['reliquat_initial_81']=='True':remaining.append({'type':'module du reliquat initial','id':m['module'],'statut':m['statut'],'motif':m['reliquat'],'preuve':m['preuve_reseau']or m['tests_lies'],'action':'Vérifier les branches non citées par le point d’entrée réel ; les tests locaux ne prouvent pas l’accès fournisseur.'})
for r in rows:
 if r['statut']!='corrigée':remaining.append({'type':'action du plan','id':r['action'],'statut':r['statut'],'motif':r['limitation'],'preuve':r['preuves'],'action':r['correction_démontrée']})
csvwrite('restant-a-verifier.csv',remaining)
text='''# Corrections de l’audit du 22 octobre 2026

Travail isolé sur `fix/audit-20261022-data-reliability`, depuis `9a4ffd2`, puis intégration de `master` `5f26a78` (évolutions IA et assurance-vie conservées). La dernière instruction de livraison autorise fusion et déploiement ; leur preuve est publiée séparément après exécution.

## Résultat et limites

**19 actions traitées : 11 corrigées, 6 partiellement corrigées et 2 bloquées.** « Corrigée » porte sur le défaut décrit et ses scénarios vérifiés, pas sur une certification indépendante de toutes les données du catalogue.

Les 90 écarts sur 53 parts figurent tous dans `reconciliation-90-ecarts.csv`, avec données initiales, recollectées, sources, devises, conventions et dates exactes disponibles. **5 erreurs d’usage sont corrigées par refus ciblé des fenêtres ; 85 causes financières restent inexpliquées. Aucun historique chiffré n’a été artificiellement aligné sur la NAV.** Les 175 périodes non comparables sont conservées avec leurs motifs dans `performances-non-comparables.csv`.

La nouvelle collecte réussit pour les 53 séries de marché et les 53 fiches officielles. Cela ne signifie pas que chaque ancienne année reste publiée : la NAV 2016 de IE00BYTRR863 n’est plus exposée dans le calendrier actuel. Les dates quotidiennes exactes sous-jacentes aux calendriers annuels NAV ne sont pas publiées ; cette limite est enregistrée, sans inventer de dates.

## Preuves retrouvées et reconstruction

Tous les livrables initiaux ont été retrouvés dans `/workspace/audit-automation-20261022/audit/2026-10-22/`, y compris matrice, anomalies, non-comparables, reliquat, bilan et répertoire de preuves. `preuves/livrables-audit-retrouves.json` donne leurs chemins, tailles et SHA-256. Ils n’ont pas été reconstruits faute de fichier ; les investigations et nouvelles qualifications ont été reconstruites à partir du code actuel et des sources réinterrogées.

La matrice initiale contient 214 711 lignes / 69 994 couples outil × actif. Elle pèse 234 976 747 octets : téléchargement séparé, sans ajout d’un fichier >100 Mo à GitHub. Le bilan initial reste dans `bilan.json` et ne doit pas être lu comme le résultat de cette correction. Le nouveau bilan est `bilan-corrections.json`.

## Historiques et sens financier

La qualification commune contrôle la fenêtre mensuelle, sa couverture, la devise et une convention documentée. Elle est utilisée par calculateur, Performance depuis, anniversaire, classements et projections dérivées des portefeuilles. Les répétitions seules n’impliquent pas une corruption universelle. Les restrictions correspondent à des cotations et fenêtres documentées ; les périodes indépendamment valides subsistent.

Aerospace IE000U9ODG19 : la cotation suisse USD donne des cours reportés et aucun volume déclaré par la source en 2025 ; le 0 % ne permet pas de valoriser le placement. Sa fenêtre est refusée. La cotation Paris EUR, présentée distinctement avec sa devise, donne 37,02855 % pour 2025. La NAV USD 54,55 % donne 36,64851 % après la conversion existante : l’écart résiduel ne reçoit pas de cause arbitraire. Il n’y a aucune substitution d’ETF, de part ou de calendrier NAV dans les niveaux de prix.

L’or Invesco dispose d’une cotation Londres USD séparée ; Amsterdam EUR reste sélectionnable dans ses périodes valides. Mining et Copper restent investigués sans blocage global fondé sur un seuil de répétition. SOXX est une série prix USD hors dividendes, avec ISIN exact et preuve réelle du split et du dividende de mars 2024.

## Collectes, consommation et pannes

INSEE récupère réellement médiane et D9 2025 avec population et unités contrôlées. VanEck et les quatre collectes de positions sont appliqués puis projetés vers les données consommées. Le DIC Amundi or exact remplace la référence juridique inadéquate. Les onze divergences DWS de dates de publication sont différées sans faux signal financier ; les observations hors ordre n’écrasent pas les récentes.

Les 28 contrôles 13F réels sans changement persistent leur propre réussite, indépendamment des dates des positions et du trimestre. Les échecs n’actualisent pas les preuves des valeurs conservées. Les amendements restent couverts par les tests.

Bourse Direct et BOFiP demeurent inaccessibles malgré les essais HTTP et navigateur. Les conditions IBKR concernées ne sont donc pas déclarées réparées. Sept tarifs sur huit restent collectables. Les deux statuts PEA litigieux restent conflit/inconnu après contrôle de la part exacte.

Les huit SCPI ont été consultées : sept accessibles et Remake en attente. La séparation accès/publication/donnée est effective. L’échéance calculée à 45 jours après fin de trimestre reste une règle interne de surveillance : aucun engagement daté de l’émetteur n’a été confirmé ; cette action reste partielle.

## Compositions et IA

Les compositions partielles ne sont plus renormalisées pour simuler une couverture complète. Les poids inconnus, dates, bases économiques et identifiants sont conservés. Les 212 positions récupérées comprennent 211 identifiées ; l’inconnue WisdomTree maintient l’exclusion du recouvrement complet. L’ordre des actifs ne modifie pas la consolidation ni le résultat.

Les 35 preuves IA legacy sont renouvelées par identités officielles et 35 récupérations réelles ciblées, jusqu’aux fichiers publics de détail. La production ne contient aucune compétition et aucune transaction n’y a été ajoutée. Les compétitions, liquidités, frais, positions, transactions, dividendes, performances et exports sont exercés dans des tests isolés. Détenus/référence et non-détenus conservent leurs calendriers distincts ; aucun rafraîchissement quotidien de tout l’univers n’a été imposé.

La vérification additionnelle SEC N-CEN a trouvé et corrigé l’identification/pacing et un succès silencieux sur panne. Quatre archives officielles réelles ont été récupérées. Le workflow conserve l’indépendance des collectes et signale l’échec sans interrompre inutilement la valorisation des détenus.

## Maintenance et périmètre encore ouvert

Les contrats cachés couvrent 90 textes et 62 faits ; les TER explicitement vivants des guides sont raccordés sans réécrire archives ou hypothèses, ni lever les verrous de revue. Les autres chiffres vivants non raccordés restent au reliquat. Les consommateurs dynamiques des 32 shards de positions et des projections IA sont déclarés sans supprimer de fichier d’après le seul graphe statique.

Les conditions d’accès/réutilisation sont centralisées pour 49 hôtes, avec inconnues explicites. La licence World Bank or reste limitée au jeu de données documenté. Un HTTP 200 ne devient jamais une licence. Les calendriers restent différenciés selon les données ; tous les fournisseurs et branches ne sont pas recertifiés.

Les formats de tweets et maquettes PNG sont conservés. Les nouvelles cotations réutilisent les visuels du même instrument. Le budget technique de code d’une route a augmenté de 4 Ko pour accueillir le contrôle financier partagé ; aucun seuil financier n’a été changé.

## Réconciliation du reliquat

`modules-verification.csv` conserve les 115 modules initiaux et identifie chacun des 81 initialement sans sonde directe. Il distingue rôle, preuve réseau limitée aux branches citées, scénarios locaux et lignes/branches non couvertes. Les nombres actualisés sont dans `bilan-modules.json`. Aucun module ne disparaît et une couverture de tests n’est jamais appelée preuve d’accès réseau.

`restant-a-verifier.csv` contient les 85 écarts inexpliqués, les 81 modules et les actions non closes. C’est un reliquat ciblé de cette mission, pas la suppression ni la réécriture des 21 731 lignes du reliquat initial, fourni séparément. Les 26 outils / 1 527 profils / 650 ISIN natifs / 703 séries sont les dénominateurs de l’audit initial, pas une annonce de recollecte de tout le catalogue.

## Tests et fichiers exploitables

Les journaux réels sont dans `preuves/` : 894 tests Python avec couverture, 113 commandes CI locales, audits financiers, navigateur IA et routes. Les défauts supplémentaires découverts par la CI sont corrigés et retestés dans `preuves/validation-additionnelle.json` : schéma des champs non applicables, contrôle DWS intégral avec différés, et assertion héritée d’exclusion globale. 39 PNG de raccordements et 5 PNG des corrections ont été téléchargés et validés ; les PNG IA sont vérifiés en plus dans des compétitions isolées. La validation finale du commit et la publication effective sont consignées séparément dans `LIVRAISON.md` après exécution.

- `statut-19-actions.csv` et `.json` : statuts, preuves, tests et limites par action.
- `reconciliation-90-ecarts.csv` et `.json` : tous les cas, sans disparition d’alerte.
- `performances-non-comparables.csv` : 175 périodes conservées.
- `modules-verification.csv` et `bilan-modules.json` : 115 modules, dont le reliquat de 81.
- `restant-a-verifier.csv` : éléments ciblés encore ouverts.
- `bilan-corrections.json` : dénominateurs et résultats structurés.
- `preuves/livrables-audit-retrouves.json` : intégrité des fichiers initiaux et chemins de récupération.

## Les 19 actions

'''
for row in rows:text+=f"### {row['action']} — {row['statut']}\n\n{row['correction_démontrée']}\n\nLimite : {row['limitation']}\n\nPreuves : {row['preuves']}. Tests : {row['tests']}.\n\n"
(P/'RAPPORT-CORRECTIONS.md').write_text(text)
print(counts)
