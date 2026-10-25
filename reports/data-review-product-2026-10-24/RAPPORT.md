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

Les 20 captures de référence se répartissent en 14 déclenchements `push`, cinq
`workflow_dispatch` et un `schedule`. Les colonnes de tentatives du CSV retranscrivent
les déclarations originales des producteurs, pas une reconstruction a posteriori.
Lorsqu'un ancien rapport ne détaille pas la tentative d'un champ différé, la relecture
courante conserve une tentative inconnue ; cette clarification ne réécrit pas le rapport
natif archivé et ne renouvelle aucune preuve source. Le reçu du rattrapage ordinaire est
disponible séparément dans `moniteur-reprise-ordinaire.json`.

### Complément planifié 13F et distinction des contrôles inchangés

La consultation des événements planifiés des **20 workflows** est conservée dans
`passages-planifies-verifies.json`. Deux passages postérieurs à #950 sont disponibles :
Radar `40204955299` et 13F `40212273808`. Pour les 18 autres, aucun passage planifié
postérieur n'est encore disponible au relevé ; leurs preuves actuelles sont les push ou
lancements manuels déjà décrits. Le raccordement mensuel de candidats n'a pas de passage
planifié récent observable. Ces réserves ne sont ni des pannes ajoutées ni des crons
inventés à partir d'une relance manuelle.

Le passage 13F planifié a réellement récupéré et validé **28 relevés inchangés** ; son
rapport et son manifeste sont archivés dans `planifie-13f/`. L'enregistrement a ensuite
été refusé : « Remote inputs changed after collection ». Ce refus est conservé. La
recette avec ses vrais jobs et le vrai réducteur restitue collecte/validation réussies,
enregistrement échoué et publication non exécutée. Aucun contrôle commun assoupli.

Le rapport natif déclarait déjà `status=validated` et `changed=false`, mais l'adaptateur
perdait cette distinction et produisait `succeeded`. Le dernier correctif conserve
`unchanged-verified` uniquement sur cette preuve explicite, jamais sur cache, échec ou
absence d'indicateur de changement. Trois régressions ciblées vérifient ces situations,
la conservation des périodes et l'absence de mutation du rapport natif. **1 134 tests
Python et build passent.** La relecture isolée de ces mêmes octets restitue 28 contrôles
inchangés, sans nouvelle collecte ni date source renouvelée.

Ce passage supplémentaire est distinct des 20 captures de référence / 5 361 résultats
du CSV initial : ses 28 résultats ne sont pas artificiellement ajoutés au nombre de
producteurs uniques, ni utilisés pour réécrire les anciennes déclarations. Les comptes
rendus originaux, leurs SHA et le résultat de la relecture sont conservés séparément.

La recette navigateur CI existante exerce aussi ce rapport 13F natif et ses vrais jobs
GitHub archivés : les 28 contrôles inchangés traversent le lecteur et le réducteur ; le
refus d'enregistrement reste visible dans la boîte sur ordinateur et mobile. Cette
recette locale passe, sans requête fournisseur ni écriture de production.

## Livraison finale — contrats producteurs et consommation publique

Les PR #950, #951, #952, #955, #956, #958 et #960 sont fusionnées. La CI complète de
#960 (`40220697225`) passe : build, Python, smoke, quatre partitions navigateur et quatre
partitions de publications. Le dernier code métier modifié passe aussi les **1 134 tests
Python** locaux et la recette Chromium du vrai rapport 13F / refus d'enregistrement.
Les travaux #953/#954/#957/#959 intégrés à master sont conservés, sans reprise de leurs
fichiers dans ce dernier lot de preuves.

Le bilan final conserve **37 cas initiaux**, tous avec un rapport versionné et un
manifeste indépendant ingérés. **20 workflows** produisent **41 rapports versionnés
distincts** ; les quatre rapports complémentaires déjà contractuels sont préservés.
Deux rapports de qualification ont légitimement un périmètre vide déclaré : ils sont
comptés dans les rapports, sans inventer de ligne d'actif. Le CSV contient maintenant
**5 417 résultats sur 22 captures** : les 20 captures de référence et les deux compléments
13F. Les répétitions temporelles des mêmes 28 gestionnaires ne sont pas des actifs
supplémentaires. Les 43 observations de rapports versionnés correspondent à 41 couples
workflow/fichier distincts. Ces unités natives ne certifient pas indépendamment chaque
scalaire financier du catalogue.

Répartition des 5 417 résultats : 3 653 réussites natives (dont validations locales),
696 contrôles source inchangés, 732 non tentés, 260 différés, 49 attentes, neuf caches,
huit non applicables et dix échecs individuels. Zéro erreur technique de contrat dans
les 22 artefacts vérifiés ; omissions, doublons et hors-périmètre sont exercés en
isolation et en CI. Le CSV conserve les déclarations originales, leurs tentatives
GitHub et le type de capture ; les drapeaux `*_reported` ne reconstruisent pas une
preuve source absente dans un ancien rapport.

Le passage ordinaire **13F `40223458923`**, lancé manuellement après #960, a réellement
émis 28 `unchanged-verified` avec le code **9789184**, après collecte/validation et
avant enregistrement. Son rapport et son plan sont rapprochés par le moniteur publié :
SHA natif `0c1c7b4e0e078281eaa434206e9230baf3f84443c3491e0f99e5daa8bfc292b3`,
28 contrôles inchangés et une preuve technique de lecture supplémentaire, distincte
des 28 résultats financiers. Les périodes restent au trimestre effectivement déclaré.
Ce passage est manuel : il ne prouve pas un cron après le dernier ajustement 13F.

La consommation publique est vérifiée sur mobile et ordinateur : code Pages **ddf584c**,
moniteur contrôlé le 25/10 à **19:11:05 UTC**, rapport 13F corrigé présent dans les données
réellement chargées, aucun contrat individuel courant manquant dans le centre de suivi,
aucune erreur JavaScript ni requête échouée observée. L'export JSON garde les diagnostics
et le registre des périmètres. Les versions sont distinctes : `ddf584c` est le code
Pages réellement servi ; `9789184` est le code du producteur GitHub corrigé. Le correctif
13F concerne le producteur et le lecteur, sans changement de calcul ou de maquette.

Le contrôle public du 25/10 a d'abord conservé le refus d'enregistrement planifié 13F,
puis observé sa reprise par l'exécution ordinaire **40219074040**, antérieure au dernier
ajustement du contrat. Cette reprise n'est pas attribuée à notre correction de format.
La collecte et l'enregistrement du passage corrigé sont réussis ; sa publication
financière reste à vérifier dans son parent en cours. L'ingestion/publication de son
rapport dans le moniteur est prouvée séparément. Une réussite de collecte ne vaut pas
publication des registres financiers.

Deux réserves de complétude restent historiques : `derived-index-observation.json`
(mensuel) et `selected-index-observations.json` (indices). Les nouvelles exécutions
ciblées sont déclarées, mais ne reconstituent pas les anciens périmètres inconnus.
Ces réserves ne sont ni deux pannes ni deux producteurs encore sans contrat.
Les sources WisdomTree/Radar et les deux champs de métadonnées en échec restent des
incidents de données, séparés du contrat de remontée. Aucune convention, date financière,
protection PEA, qualification de composition ni contrôle historique n'est assoupli.

Les deux passages planifiés disponibles après #950 (Radar et 13F) sont documentés.
L'ingestion exacte de l'ancien artefact Radar planifié reste non attestée ; les rapports
courants de ce producteur sont ingérés. Pour les 18 autres workflows, aucun passage
planifié postérieur à #950 n'était disponible au relevé ; leurs exécutions ordinaires
push/manuelles sont prouvées. Aucune attente du prochain cron n'est déguisée en réussite.

Un refus GitHub du moniteur (`40222263276`, HTTP 403 « The rule did not run because of
a timeout ») est également conservé. Le rattrapage `40224502410` et l'événement ordinaire
`40224605041` ont ensuite réussi et publié les preuves. Les règles GitHub n'ont pas été
modifiées ; l'erreur n'est pas attribuée aux identifiants ni à une cause non démontrée.
Les interruptions de runners précédentes gardent elles aussi leur diagnostic d'origine.

Preuves séparées : `contrats-executes.csv`, `contrats-executes-bilan.json`,
`production-contract-receipts.json`, `parcours-public-final.json`,
`moniteur-consomme-public-final.json.gz`, `ci-960-validee.json`,
`publication-pages-verifiee.json` et le dossier `13f-apres-correction/`, tous dans
`preuves-contrats-producteurs-20261025/`. Le suivi principal reste
`suivi-perimetre.csv` / `bilan.json` ; aucune liste de corrections concurrente créée.

### Vérification ultérieure de publication

Au contrôle final, le parent 13F **40223458923** est terminé en succès. Le site sert
maintenant le code **e0811c0** (incluant #960) et les données **2f06b06**, voie
`validated-code-data`. Le fichier public `public/data/investors/review-metadata.json`
correspond exactement au snapshot **e0811c0** demandé par son producteur (blob Git
`a24d0e565f092c12800b7a59e91b8fb478913251`). Les relevés restent inchangés ; aucune
nouvelle période financière n'est annoncée. Le parcours navigateur mobile/ordinateur
passe aussi sur cette version, sans contrat individuel courant manquant ni erreur
observée. La mention précédente de publication en attente était l'état du relevé initial.

Le moniteur chargé dans ce dernier parcours conserve encore `publicationStatus=not-run`
pour le parent coalescé et un diagnostic de publication ; cette qualification de preuve
reste distincte de la présence publique du fichier vérifiée ici. Elle n'est pas déclarée
réparée par la seule réussite du workflow. Les réserves de crons et les deux périmètres
historiques inconnus restent inchangés. Les preuves supplémentaires se trouvent dans
`publication-financiere-13f-finale.json` et `parcours-public-derniere-version.json`.
