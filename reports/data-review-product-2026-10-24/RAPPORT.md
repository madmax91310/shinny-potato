# Données à revoir — produit de supervision

Périmètre : supervision, contrats de remontée et interface. Collecteurs, raccordements,
calendriers financiers et reprises source restent sous la responsabilité du chantier
« Automatisation des données ». Coordination : `docs/data-operations-coordination.md`.
Base actualisée sur master `3ecbbee9`, incluant #920/#921/#922, #903, #924, #926 et #928 et le retrait de
Portefeuilles IA. Aucun composant exclusif IA réintroduit, aucune donnée financière modifiée.

## Corrections et preuves

| Avant, requalifié sur le code | Après | Contrôle exécuté |
| --- | --- | --- |
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
producteur, son résultat et le test correspondant. 537 cas isolés, 24 méthodes de recette
produit ; les 108 tests Python de supervision passent. Les défaillances sont injectées
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
