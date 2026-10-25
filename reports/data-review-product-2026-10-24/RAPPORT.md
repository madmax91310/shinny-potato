# Données à revoir — produit de supervision

Périmètre : supervision, contrats de remontée et interface. Collecteurs, raccordements,
calendriers financiers et reprises source restent sous la responsabilité du chantier
« Automatisation des données ». Coordination : `docs/data-operations-coordination.md`.
Base actualisée sur master `3ecbbee9`, incluant #920/#921/#922, #903, #924, #926 et #928 et le retrait de
Portefeuilles IA. Aucun composant exclusif IA réintroduit, aucune donnée financière modifiée.

## Corrections et preuves

| Avant, requalifié sur le code | Après | Contrôle exécuté |
| --- | --- | --- |
| Enregistrement GitHub refusé : requête de 96 201 516 octets | Périmètres de rapports partagés par empreinte dans le même statut ; aucune ligne retirée | restitution intégrale, 700 champs, état actif/historique conservé, référence absente/altérée refusée ; producteur ordinaire 40127021202 réussi ; 9 534 070 octets avant encodage |
| Artefact absent sans résultat source explicite | Incident de preuve lié au producteur, run et tentative | absence, expiration, récupération de l'artefact exact |
| JSON inconnu assimilable à un rapport vide réussi | Contrats nom/producteur/famille et identité des résultats | 40 fichiers réels de 19 producteurs, aucun rejet de leur schéma actuel |
| TypeError/KeyError pouvait arrêter un cycle | Isolation par rapport et par producteur ; incident d'observation | payloads invalides et maintien du résultat indépendant |
| Reprise ciblée des cotations rejetée par un nom de format singulier/pluriel incohérent | Adaptateur `listings` raccordé au contrat explicite | reprise ciblée, périmètre vide et résultat attendu absent |
| Couverture d'une reprise ciblée ambiguë | `attemptedIds` vérifié lorsqu'émis ; qualification visible sinon | périmètre vide, résultat tenté absent, résultat hors périmètre |
| Cache et succès global confondus avec contrôle source | Dates par champ, artefact et publication distinctes | cache, absence de changement, résultat partiel |
| Nouvelle tentative pouvait réparer une preuve historique différente | Identité run/tentative immuable ; relecture exacte et bornée | nouveau run, rerun, archive datée hors tentative, réparation exacte |
| Disparition d'une alerte pouvait être interprétée comme résolution | Preuve ciblée obligatoire ; incident conservé sans preuve | anciennes périodes, champs, étapes et conflits |
| Collecte terminée dans un workflow encore en attente | Résultats et erreurs source observés avant la fin globale ; attente distincte | panne source, cache, API indisponible, retour terminal |
| Ancien workflow or sans contrat d’artefact | Qualification historique, sans faux artefact promis absent | contrat de version par étapes réelles |
| Réussite composite ne prouvant pas la branche initialement en échec | Qualification maintenue avec erreur et preuve antérieures | succès d’un rapport composite insuffisant pour résoudre la branche |
| Un flux radar sans erreur suffisait à perdre un ancien conflit | Registre durable, empreinte archivée et stabilité DWS vérifiés | mauvaise empreinte, stabilité < 4 h, preuve conforme |
| Livraison déduite de la seule ascendance Git | Empreintes réelles de l'artefact public et identité du code livré requises | manifeste nul/invalide, divergence, égalité exacte |
| Déploiement vert sans contrôle public explicite | Publication non certifiée et incident de preuve | vérification absente ou échouée |
| Plusieurs événements manqués ne restituaient que la dernière exécution | Toutes les exécutions ordinaires non observées sont réduites dans l’ordre | échec intermédiaire puis succès, aucune répétition des événements observés |
| Échec du contexte ou de l'API de surveillance | Incident propre et dernières alertes conservées | contexte absent, panne réseau, producteur indépendant |
| Revue hebdomadaire hors registre | Contrôle explicite, sans inventer une collecte source | échec de ses contrôles |
| Moniteur absent/périmé/invalide pouvait laisser un écran rassurant | Alerte principale, bilan source dégradé ; vérification GitHub indépendante | absence, schéma invalide, ancienneté, réseau, dernier run échoué |
| Inventaires secondaires et listes tronquées | Boîte commune, recherche, filtres, regroupement, pagination complète | accès au 181e cas, dernière page, export des 181 cas |
| Copie dépendante du presse-papiers | Diagnostic complet et repli sélectionnable | copie autorisée/refusée sur mobile et ordinateur |
| Historique borné aux 100 résolutions et 30 événements | Historique durable ; reprise des épisodes attestés par Git | 2 745 commits lus, union idempotente, aucune réouverture |
| Retrait de périmètre confondu avec réparation | Retraits, attentes et résolutions séparés | attente/succession, retrait IA, preuve de résolution |
| Outils attribués au périmètre global d'un collecteur | Contrats par champ utilisés lorsqu'ils existent ; périmètre du collecteur conservé au diagnostic | tous les usages requis non raccordés conservés |
| Divergences financières réparties entre rapports | Tous les cas ouverts/résiduels dans la boîte commune et le registre financier | 79 cas conservés ; téléchargement des 90 comparaisons |

## Recette

`matrice-controles.csv` / `.json` contient chaque sous-cas effectivement exécuté, son
producteur, son résultat et le test correspondant. 539 cas isolés, 26 méthodes de recette
produit ; les 110 tests Python de supervision passent. Les défaillances sont injectées
dans les lecteurs et réducteurs, jamais dans les sources de production. Cela démontre la
remontée des causes reçues, pas la capacité de chaque collecteur à qualifier toute anomalie
financière imaginable.

`ordinary-artifact-replay.json` contient les runs/tentatives, identités d'artefacts,
empreintes des 40 rapports et résultats de leur passage dans le lecteur de production.
19 producteurs, zéro erreur de lecture/contrat, 16 échecs source conservés. Le producteur or du run `40108621544` a achevé collecte et enregistrement, mais son workflow s’est terminé en échec de publication. La collecte réussie ne vaut pas livraison réussie. Les 38 rapports
sans manifeste de périmètre tenté restent explicitement à qualifier ; aucun succès fictif.

Build et contrôles des projections passent. La boîte principale utilise une projection de 1,95 Mo au lieu de charger les 35,3 Mo de l’inventaire technique ; un test compare intégralement les modèles avant/après projection (identités, causes, dates, outils, sources et signalements). L’inventaire technique reste chargé à la demande. Recette Chromium mobile 390 px et ordinateur
1 440 px : recherche globale, filtres, regroupement, pagination imbriquée, diagnostic,
export complet, indisponibilités du moniteur et récupération. La recette des consommateurs
existants vérifie aussi 15 PNG réels (or, courtiers, DCA, secteurs ETF et archive Tudigo),
le texte, les historiques et les fenêtres financières autorisées. Empreintes des artefacts
locaux dans `bilan.json` ; résultats CI et validation publique ajoutés à la PR de livraison.

`suivi-perimetre.csv` conserve toutes les entrées courantes et leurs identifiants de
signalements, périodes et causes. Le bilan explique les dénominateurs : champs,
producteurs, contrats consommateurs, points regroupés et signalements sont distincts.
Les références historiques du rapport consolidé du 24 octobre ne sont pas des verdicts
actuels : les diagnostics sont recalculés depuis les générateurs courants, le moniteur
et les registres financiers immuables. Les anciennes lacunes IA restent des retraits.

## Limites et blocages déclarés

- Les producteurs sans manifeste du périmètre tenté ne permettent pas de certifier
  l'absence d'un résultat individuel omis. Une qualification explicite reste affichée.
- Deux producteurs ne fournissent qu'un état de job : contrat individuel manquant
  visible, sans prétendre que chaque champ a été contrôlé.
- Sources WT/Copper, compositions/identités incomplètes, PEA, conflits et divergences
  financières restent des problèmes source ou de qualification, pas des réparations
  accomplies par cette PR. Aucun seuil ni contrôle financier abaissé.
- Les résolutions archivées sans preuve détaillée sont étiquetées comme historiques
  à qualifier. L'archive récupère des épisodes attestés, elle ne fabrique pas de preuve.
- Les workflows manuels de qualification isolée et le pilote Bitcoin d'observation ne
  publient pas les données actives. Leur succès n'est pas assimilé à une qualification de
  production. Les 47 fichiers de workflows sont classés dans `bilan.json` ; leurs contrôles
  PR restent dans la CI, les jobs réutilisables de publication dans leur run parent.
- L'API GitHub et les fournisseurs restent des dépendances externes. Leur indisponibilité
  est affichée ; elle ne vaut jamais absence d'incident. Une rupture dépassant la fenêtre
  des 30 runs déclenche un incident de couverture historique à reprendre.

Le périmètre de supervision testé est opérationnel ; la complétude financière et la
complétude individuelle des producteurs historiques ne sont pas déclarées démontrées.

Raccordement #924 : conservation de `requiredDataGaps`, des preuves `historyChecks`/`fieldChecks` et de ses nouvelles données. Les périmètres `scope.expectedIds/requestedIds` et résultats `unchanged-verified` sont reconnus sans confondre cache et contrôle réel. Un nouveau périmètre ciblé ne clôture pas la qualification historique d’un ancien rapport. Les diagnostics couvrent aussi les actifs externes des 23 outils ; les chaînes répétées sont référencées dans un dictionnaire, puis restituées sans changer une seule valeur.

Validation finale : les exécutions CI et les vérifications du site public sont consignées dans les PR #925 et #931. Un échec source individuel du contrôle ETF demeure un échec déclaré, même lorsque la validation du code est réussie.

Incident réel de persistance : le run `40125533871` confirme le refus GitHub « file too large », requête de 96 201 516 octets. Le transport expose désormais le motif borné sans jeton ni contenu du statut. La correction de stockage partage les périmètres identiques : `reportScopes` contient leurs valeurs intégrales, `scopeRef` les référence depuis chaque preuve ; `expand_report_scopes` restitue le contrat complet. Les données, erreurs, dates et épisodes ne sont ni filtrés ni tronqués. Le run ordinaire `40127021202` a réussi l’enregistrement : 24 automatisations, 6 périmètres uniques, 9 534 070 octets avant encodage. Les 981 épisodes résolus précédents sont conservés dans le statut relu après publication ; toutes les références se restituent.

L’historique propre du moniteur est conservé par tentative et par étape ; une réussite d’une autre étape ne le clôture pas. La reprise initiale observe les 100 derniers runs disponibles, qualifie au plus 6 nouvelles exécutions et 2 journaux par cycle, avec budget de 75 secondes ; les éléments différés restent explicitement à qualifier. L’archive est durable après observation, sa couverture antérieure à la fenêtre initiale reste déclarée non démontrée. L’export JSON transporte aussi le registre des périmètres référencés.

## Complément du 25/10 — comptes rendus individuels des producteurs

Le relevé actuel remplace le compteur historique 34 : **35 qualifications de rapports et deux producteurs limités au job, sur 20 workflows**. Le détail et les origines restent dans `suivi-perimetre.csv` et la section `producerContracts` de `bilan.json`. Les anciennes données et preuves restent datées ; aucun contrôle financier général n’est recommencé.

Les points d’entrée natifs déclarent leur travail à partir des configurations/arguments avant acquisition. Le manifeste est conservé séparément du résultat, dans le même artefact. Les formats financiers natifs sont préservés ; le bloc `resultContract` réutilise statuts et périmètres reconnus. Les unités sont celles des opérations natives : produit/champs validés ensemble, indice × composition ou rendement, champ de métadonnées, source documentaire, gestionnaire, etc. Cette complétude de rapport n’est pas une certification indépendante des valeurs financières.

Chaque unité attendue reçoit un statut ou une omission. La sélection, les tentatives prouvées et les tentatives inconnues restent distinctes. Un résultat absent ne prouve pas qu’aucune requête n’a été faite. Les exclusions/quota, attentes, cache et données non applicables gardent leurs raisons. Les omissions ont leur propre identité technique : elles ne remplacent ni ne réparent une erreur financière préexistante. Le lecteur peut exploiter le manifeste indépendant lorsque le rapport manque ou est tronqué, sans attribuer de périmètre aux anciens rapports dépourvus de cette déclaration.

Les validations locales restent séparées des contrôles source. Les indices d’anniversaire déjà présents sont déclarés en cache. Les contrôles différés du Radar ne renouvellent plus artificiellement leurs tentatives ; seuls les appels HTTP réellement observés sont déclarés comme tels. Un HTTP 304 réellement reçu peut produire `unchanged-verified`. L’accès HTTP reste distinct d’une qualification du contenu et de ses conditions de réutilisation.

Les deux producteurs job-only possèdent désormais des rapports déclarés, mais cette évolution de registre ne suffit pas à lever leur qualification : le moniteur exige les fichiers effectivement observés. Les anciens périmètres incomplets restent historiques ; une exécution ciblée ne certifie pas le catalogue complet. Les contrôles source, validations, enregistrements et publications restent séparés.

Recettes isolées : omissions avec workflow vert, résultat dupliqué/hors périmètre, vide normal/anormal, échec partiel, interruption et rapport tronqué, cache, vérification inchangée, reprise ciblée laissant les autres incidents ouverts. La recette navigateur utilise les vrais lecteur/réducteur avec un moniteur simulé, sur mobile et ordinateur, diagnostic complet compris ; elle n’est pas une collecte fournisseur. Les fixtures de schéma des deux nouveaux producteurs proviennent des artefacts GitHub ordinaires de branche, jamais de collectes fictives en production.

À ce stade de préparation : exécutions de branche attestées ; passage des manifestes indépendants, ingestion du moniteur, déploiement et recettes publiques sur master encore à vérifier. Le bilan sera complété après ces contrôles. Aucun composant exclusivement Portefeuilles IA n’est rétabli ; les données d’Analyse d’entreprise restent hors périmètre.

## Preuves ordinaires du 25/10 — suite du même suivi

Le périmètre initial courant comporte **37 qualifications** : 35 qualifications de
rapports et deux contrats limités au job, regroupées dans **20 workflows**. Ce compteur
remplace le relevé historique de 34. Les producteurs fournissent maintenant **41 rapports
avec `producer-results-v1`** ; quatre rapports historiques complémentaires restent
conservés. La différence vient notamment des deux contrats de job, désormais détaillés
en six rapports. Il ne s'agit ni de 41 collecteurs réseau distincts, ni d'une mesure de
couverture des champs financiers du catalogue.

Les 20 points d'entrée ordinaires GitHub ont réellement produit leurs artefacts après
#950. Les manifestes indépendants et les rapports natifs passent dans le lecteur de
production ; leurs empreintes, instruments, champs et sélections sont conservés dans
`preuves-contrats-producteurs-20261025/contrats-executes.csv` et les 20 captures
`<run>-contracts.json.gz`. Une reprise mensuelle `retry_failed` a remplacé un passage
complet avant toute collecte pour éviter une recollecte inutile. Le raccordement d'actifs
a été exercé avec quotas nuls et sélection qualifiée existante, sans extension de catalogue.
Les lancements `push`, `workflow_dispatch` et `schedule` restent explicitement distingués.

Ces rapports décrivent **5 361 unités de validation natives** : 3 625 résultats réussis,
668 contrôles source inchangés, 732 non tentés, 260 différés, 49 attentes normales,
neuf caches, huit non applicables et dix échecs individuels. Ces nombres ne sont ni des
actifs uniques ni des contrôles réseau indépendants. Les dix échecs conservés concernent
quatre positions WisdomTree, quatre sources Radar et deux champs de métadonnées
(cotation IE00BYZK4776 et conflit PEA IE00B0M62S72). Les qualifications locales ne sont
pas présentées comme des consultations fournisseurs.

Aucune omission, duplication ou sortie hors périmètre n'a été observée dans cette série
de rapports natifs. Leur détection est démontrée en isolation, avec les vrais lecteurs et
réducteurs, y compris quand le workflow est vert. Les tests couvrent aussi vide justifié
ou anormal, interruption/rapport tronqué, résultat partiel, cache sans contrôle source,
contrôle inchangé, conservation des incidents hors reprise ciblée et indépendance des
étapes collecte/validation/enregistrement/publication. Le périmètre est figé avant les
résultats ; les tentatives non décrites par un ancien rapport restent inconnues.

Correctifs issus de cette recette : lecture du sous-dossier Radar et du manifeste
indépendant (#951), horloge déterministe du test Radar sans modification du seuil de
production (#952), relecture versionnée des caches de rapports et conservation des
qualifications historiques (#955), copies mémoire préservant les périmètres mutualisés
(#956), puis lecture des `scopeRef` persistées (#958). Les rapports financiers natifs ne
sont pas réécrits. Les incidents de collecte, d'enregistrement et de publication restent
indépendants de la qualification de complétude.

Sur le dernier correctif de code : **1 131 tests Python et build réussis**, ainsi que la
recette navigateur d'omission sur mobile et ordinateur. Les contrôles de contrat sont
exécutés par la CI et le producteur ordinaire du moniteur ; une sortie attendue sans
statut fait échouer la validation du contrat. Les interruptions réelles de runners sont
conservées dans `incident-runner-moniteur.json`, sans cause supposée. La duplication
mémoire corrigée a été mesurée séparément sur les preuves réelles ; elle ne démontre
pas à elle seule la cause de ces interruptions.

Les reçus d'ingestion et la vérification publique finale sont détaillés dans
`production-contract-receipts.json`, `moniteur-apres.json.gz` et `bilan.json` ; ils ne sont
pas déduits de la couleur globale des workflows. Un rapport ciblé ne certifie pas les
unités exclues. Les anciens rapports sans manifeste restent des limites historiques,
jamais des tentatives reconstruites rétroactivement. Les défauts financiers et blocages
externes préexistants restent hors de cette réparation des comptes rendus.

État d'ingestion après le rattrapage ordinaire `40215683385` : **37/37 cas initiaux**
ont une preuve versionnée avec manifeste rapproché dans le moniteur public (statut
`520a6f07d1e3486353ce8978a299e2cc0bc0fbff`, contrôle du 25/10 à 17:38:17 UTC).
Deux qualifications historiques restent ouvertes : `derived-index-observation.json`
(mensuel) et `selected-index-observations.json` (indices). Les nouvelles reprises sont
ciblées et ne certifient pas les anciens périmètres inconnus. Elles ne représentent pas
deux nouveaux producteurs sans contrat. Le passage planifié Radar `40204955299` est
attesté dans GitHub ; l'ingestion des mêmes octets précis n'est pas démontrée, contrairement
aux rapports ordinaires actuels ingérés de ce producteur. Les 19 autres workflows ont été
exercés par push ou lancement manuel : aucun futur cron n'est présenté comme observé.
