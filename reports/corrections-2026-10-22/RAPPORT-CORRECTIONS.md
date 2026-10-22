# Corrections de l’audit du 22 octobre 2026

Travail isolé sur `fix/audit-20261022-data-reliability`, depuis `9a4ffd2`, puis intégration de `master` `5f26a78` et `77e0e93` (évolutions IA, assurance-vie et 29 raccordements de la PR #884 conservés). La dernière instruction de livraison autorise fusion et déploiement ; leur preuve est publiée séparément après exécution.

## Résultat et limites

**19 actions traitées : 11 corrigées, 6 partiellement corrigées et 2 bloquées.** « Corrigée » porte sur le défaut décrit et ses scénarios vérifiés, pas sur une certification indépendante de toutes les données du catalogue.

Les 90 écarts sur 53 parts figurent tous dans `reconciliation-90-ecarts.csv`, avec données initiales, recollectées, sources, devises, conventions et dates exactes disponibles. **5 erreurs d’usage sont corrigées par refus ciblé des fenêtres, 1 comparaison est non pertinente et 84 causes financières restent inexpliquées. Aucun historique chiffré n’a été artificiellement aligné sur la NAV.** Les 175 périodes non comparables sont conservées avec leurs motifs dans `performances-non-comparables.csv`.

La nouvelle collecte réussit pour les 53 séries de marché et les 53 fiches officielles. La qualification reste distincte de la simple présence d’un chiffre : la valeur officielle 2016 de IE00BYTRR863 est publiée mais correspond à une année de lancement incomplète. Cette comparaison est requalifiée non pertinente ; l’ancienne valeur est conservée séparément, sans être réintroduite dans le calendrier qualifié. Les dates quotidiennes exactes sous-jacentes aux calendriers annuels NAV ne sont pas publiées ; cette limite est enregistrée, sans inventer de dates.

## Preuves retrouvées et reconstruction

Tous les livrables initiaux ont été retrouvés dans `/workspace/audit-automation-20261022/audit/2026-10-22/`, y compris matrice, anomalies, non-comparables, reliquat, bilan et répertoire de preuves. `preuves/livrables-audit-retrouves.json` donne leurs chemins, tailles et SHA-256. Ils n’ont pas été reconstruits faute de fichier ; les investigations et nouvelles qualifications ont été reconstruites à partir du code actuel et des sources réinterrogées.

La matrice initiale contient 214 711 lignes / 69 994 couples outil × actif. Elle pèse 234 976 747 octets : téléchargement séparé, sans ajout d’un fichier >100 Mo à GitHub. Le bilan initial reste dans `bilan.json` et ne doit pas être lu comme le résultat de cette correction. Le nouveau bilan est `bilan-corrections.json`.

## Historiques et sens financier

La qualification commune contrôle la fenêtre mensuelle, sa couverture, la devise et une convention documentée. Elle est utilisée par calculateur, Performance depuis, anniversaire, classements et projections dérivées des portefeuilles. Les répétitions seules n’impliquent pas une corruption universelle. Les restrictions correspondent à des cotations et fenêtres documentées ; les périodes indépendamment valides subsistent. Le recoupement des 53 parts documente 26 dates de lancement, dont une série antérieure au lancement ; 27 dates restent non vérifiées dans les réponses conservées (`inceptions-53-parts.csv`). World Energy IE00BYTRR863 est lancé le 29 avril 2016 : les cours de 2015 sont refusés. La valeur 2016 reste archivée avec son ancienne date de preuve dans `excludedYears` ; le calendrier qualifié commence en 2017.

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

`restant-a-verifier.csv` contient les 84 écarts inexpliqués, les 81 modules, les 27 preuves de dates de lancement restant à vérifier et les actions non closes. C’est un reliquat ciblé de cette mission, pas la suppression ni la réécriture des 21 731 lignes du reliquat initial, fourni séparément. Les 26 outils / 1 527 profils / 650 ISIN natifs / 703 séries sont les dénominateurs de l’audit initial, pas une annonce de recollecte de tout le catalogue.

## Tests et fichiers exploitables

Les journaux réels sont dans `preuves/` : 897 tests Python avec couverture, 113 commandes CI locales, audits financiers, navigateur IA et routes. Les défauts supplémentaires découverts par la CI sont corrigés et retestés dans `preuves/validation-additionnelle.json` : schéma des champs non applicables, contrôle DWS intégral avec différés, et assertion héritée d’exclusion globale. 39 PNG de raccordements et 6 PNG des corrections ont été téléchargés et validés ; les PNG IA sont vérifiés en plus dans des compétitions isolées. La validation finale du commit et la publication effective sont consignées séparément dans `LIVRAISON.md` après exécution.

- `statut-19-actions.csv` et `.json` : statuts, preuves, tests et limites par action.
- `reconciliation-90-ecarts.csv` et `.json` : tous les cas, sans disparition d’alerte.
- `performances-non-comparables.csv` : 175 périodes conservées.
- `inceptions-53-parts.csv` : contrôle des dates de lancement des 53 parts, avec chaque reliquat.
- `modules-verification.csv` et `bilan-modules.json` : 115 modules, dont le reliquat de 81.
- `restant-a-verifier.csv` : éléments ciblés encore ouverts.
- `bilan-corrections.json` : dénominateurs et résultats structurés.
- `preuves/livrables-audit-retrouves.json` : intégrité des fichiers initiaux et chemins de récupération.

## Les 19 actions

### P0-01 — partiellement corrigée

Qualification mensuelle commune, refus ciblés des cinq fenêtres annuelles non valorisables et refus des cours de World Energy antérieurs au lancement du 29 avril 2016. Paris EUR et Londres USD sont des cotations distinctes, jamais des historiques substitués.

Limite : Mining et Copper restent à investiguer ; les cours de la cotation suisse Aerospace ne sont pas réparés.

Preuves : preuves/historiques-recollectes.json | preuves/qualification-quatre-historiques.json | preuves/aerospace-2025.json | preuves/ssga-2016-verification.json | preuves/ssga-application.json | preuves/navigateur-corrections.log. Tests : test-audit-history-quality.mjs | test-market-calendar-performance.mjs | test-performance-rankings.mjs.

### P0-02 — partiellement corrigée

90 couples part × année relus, 53 collectes de cours et 53 collectes de fiches officielles réussies ; bornes, conventions, change et sources conservés. Cinq refus corrigent le calcul utilisateur ; la comparaison SSGA 2016 est requalifiée non pertinente et la fusion ne réintroduit plus cette année incomplète.

Limite : 84 causes financières encore inexpliquées. Une réussite de collecte ne garantit pas la présence de toutes les anciennes années NAV : 2016 de IE00BYTRR863 est exclu des années qualifiées car la part a été lancée le 29 avril 2016. La comparaison 2016 est non pertinente.

Preuves : preuves/historiques-recollectes.json | preuves/nav-recollectes.json | preuves/comparaisons-originales.json | preuves/ssga-2016-verification.json | preuves/ssga-application.json. Tests : reconcile-audit-cases.mjs.

### P0-03 — corrigée

SOXX identifié US4642875235 / XNAS / USD ; simulation explicitement hors dividendes. Preuve réelle du dividende et du split 3:1 de mars 2024 ; ajustement non appliqué deux fois.

Limite : Aucune admission de SOXX comme série de rendement total.

Preuves : preuves/soxx-identite-verifiee.json | preuves/soxx-evenements.json | preuves/soxx-ajuste.json. Tests : test-soxx-conventions.mjs | test-investment-conclusions.mjs.

### P1-01 — corrigée

Deux commandes YAML séparées ; échec isolé de la seconde propagé avec code 23, audits réels exécutés.

Limite : Test isolé ; aucun échec injecté en production.

Preuves : preuves/tests-workflows.log | preuves/tests-ai-runtime.log | preuves/tests-ai-coverage.log. Tests : test_audit_workflows.py.

### P1-02 — corrigée

INSEE : sélection sémantique de la distribution, contrôle de la population, de l’année et de l’unité. Données réelles 2025 : médiane 2238 et D9 4441 euros nets mensuels EQTP.

Limite : Champ de la figure : alternants, stagiaires et contrats aidés inclus ; agriculture et particuliers employeurs exclus.

Preuves : preuves/insee-corrige.json | preuves/insee-corrige.log. Tests : test_economic_data.py.

### P1-03 — bloquée

Sept grilles tarifaires sur huit sont récupérables ; accès officiels réessayés par collecteur et navigateur. Dernières valeurs valides et anciennes dates de preuve conservées.

Limite : Bourse Direct et la référence fiscale BOFiP d’IBKR restent inaccessibles (503). Pas de source alternative financièrement qualifiée.

Preuves : preuves/courtiers-recollecte.json | preuves/courtiers-navigateur.json | preuves/voies-officielles.json. Tests : test_broker_tariff_sources.py | test_broker_tariff_profiles.py.

### P1-04 — corrigée

Reprise VanEck sur déconnexion réseau, sans avaler les erreurs financières. Cinq caractéristiques/PDF réels et quatre collectes de positions récupérés et raccordés aux projections.

Limite : 212 positions dont 211 identifiées ; une position WisdomTree inconnue conserve le refus du recouvrement complet.

Preuves : preuves/positions-recollectees.json | preuves/positions-appliquees.json | preuves/positions-consommees.json | preuves/nav-recollectes.json. Tests : test_non_bond_expansion.py | test_physical_holdings.py | test_wisdomtree_api_holdings.py | test-exposure-complete.mjs.

### P1-05 — corrigée

Référence pédagogique vers DIC officiel exact FR0013416716, publié le 19 juin 2026 ; fragments structuraux et risques hachés, revue éditoriale conservée.

Limite : Accès documentaire vérifié ; aucune licence de réutilisation déduite du téléchargement.

Preuves : preuves/practical-gold-recollecte.json. Tests : test_practical_sheets.py.

### P1-06 — corrigée

DWS : onze photographies de dates différentes différées ; comparaison financière seulement à dates compatibles. Une observation ancienne ne remplace plus une récente ; incidents et derniers blocs valides conservés.

Limite : Différer pour publication ne certifie pas les poids à la nouvelle date.

Preuves : preuves/dws-recollecte.json | preuves/dws-verification-finale.json | preuves/tests-dws-gate-final.log | preuves/tests-dated-records.log | preuves/tests-radar-all.log. Tests : test_dws_reconciliation.py | test-dated-records.mjs | test-editorial-radar.mjs.

### P1-07 — corrigée

28 consultations 13F réelles sans nouvelle position ; dernier contrôle réussi persisté indépendamment de la date de collecte des positions, du trimestre et des amendements.

Limite : Échec sans renouvellement de la preuve financière ; pas de nouvelle déclaration inventée.

Preuves : preuves/collecte-13f.json | preuves/13f-application.json. Tests : test_investor_refresh.py.

### P2-01 — corrigée

Trois Vanguard composition-only qualifiés selon leurs véritables capacités. Impact des frais exige identité et TER pour son préremplissage ETF, pas des données inutilisées.

Limite : Impact des frais possède bien un préremplissage ETF dans le code actuel : l’ancienne généralisation aux seules hypothèses a été corrigée.

Preuves : preuves/tests-field-coverage.log | preuves/tests-etf-fields.log | preuves/vanguard-underliers-reels.json. Tests : test-asset-field-coverage.mjs | test_etf_field_completion.py.

### P2-02 — corrigée

Positions économiques, top10, fonds/indice et panier restent distincts. Pas de renormalisation silencieuse ; poids et identifiants inconnus préservés ; consolidation et symétrie du recouvrement testées.

Limite : Un fichier complet contenant une position sans identifiant ne certifie pas un recouvrement complet ; donuts compatibles restent utilisables.

Preuves : preuves/positions-consommees.json | preuves/tests-overlap.log | preuves/tests-dca.log. Tests : test-exposure-checker.mjs | test-exposure-complete.mjs | test-exposure-scope.mjs.

### P2-03 — bloquée

Conflit et inconnu PEA préservés après nouvelle collecte de la part exacte.

Limite : IE00B0M62S72 : conflit entre preuves courantes ; IE0003R87OG3 : statut explicite non obtenu. Aucune conversion de null en false.

Preuves : preuves/pea-recollecte.json | preuves/pea-recollecte.log. Tests : audit-instrument-catalog.mjs | test-data-qualification.mjs.

### P2-04 — corrigée

35 preuves legacy renouvelées avec identités officielles, 35 récupérations quotidiennes réelles ciblées et 35 evidenceId présents dans les projections publiques. Compétitions et exports vérifiés dans des fixtures isolées ; portefeuille de production inchangé.

Limite : Qualification ≠ admission ≠ sélection. Non-détenus rattrapés à la demande, sans collecte quotidienne massive. SEC N-CEN : quatre archives réelles, échec visible sans dater artificiellement les données précédentes.

Preuves : preuves/ai-35-preuves.json | preuves/ai-35-preuves-publiees-projection.json | preuves/navigateur-ia-final.log | preuves/sec-classifications-reel.json. Tests : test-ai-portfolios.mjs | test-ai-weekly.mjs | test_ai_security_classifications.py | playwright-ai-portfolios.mjs.

### P2-05 — partiellement corrigée

Accès, tentative, dernière réussite et données financières SCPI séparés. Huit SCPI contrôlées : sept disponibles et Remake en attente de bulletin ; aucune panne ne rajeunit la dernière preuve.

Limite : L’échéance de surveillance calculée trimestriellement à 45 jours est une politique interne, pas un engagement daté confirmé de Remake. Confirmation éditoriale encore requise ; champs anciens non requalifiés restent périmés.

Preuves : preuves/scpi-recollecte.json | preuves/tests-scpi.log. Tests : test_scpi.py | test_publication_periods.py | test_extended_scpi.py.

### P2-06 — partiellement corrigée

Contrats cachés pour 90 textes et 62 faits ; frais vivants des guides explicitement identifiés raccordés au TER commun. Archives, hypothèses, rédaction et verrous de revue conservés.

Limite : Tous les autres chiffres vivants du corpus ne sont pas encore raccordés automatiquement ; contrats de données seuls ne prouvent pas une actualisation.

Preuves : preuves/tests-tweet-bank.log. Tests : test-reusable-data-contracts.mjs | test-tweet-bank-validity.mjs.

### P3-01 — partiellement corrigée

Consommateurs dynamiques des 32 shards de positions et des projections IA déclarés ; répertoires de sortie reconnus. Aucun fichier supprimé sur simple absence d’import statique.

Limite : Les autres projections sans consommateur déclaré restent dans le reliquat initial ; le graphe n’est pas une certification de tous les usages runtime.

Preuves : preuves/tests-inventory.log. Tests : test-data-automation-inventory.mjs.

### P3-02 — partiellement corrigée

Politiques par nature conservées ; séparations contrôle/publication/prix appliquées, tests de séance, mois/année, panne et reprise. Pas de collecte quotidienne universelle.

Limite : Tous les calendriers et fournisseurs des branches restantes ne sont pas recertifiés ; échéance explicite Remake encore non confirmée.

Preuves : preuves/tests-qualification.log | preuves/tests-scpi.log | preuves/tests-ai-runtime.log. Tests : test-data-qualification.mjs | test_publication_periods.py | test_ai_portfolios.py.

### P3-03 — corrigée

Registre central des conditions documentées pour 49 hôtes ; points inconnus explicites ; licence World Bank limitée au jeu or concerné, jamais généralisée à l’hôte.

Limite : Correction de centralisation documentaire uniquement : l’accès HTTP ne donne pas une licence et les droits encore inconnus restent non vérifiés.

Preuves : preuves/tests-inventory.log. Tests : test-data-automation-inventory.mjs.

