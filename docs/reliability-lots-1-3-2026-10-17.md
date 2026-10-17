# Fiabilité, surveillance et raccordements — lots 1 à 3 (17 octobre 2026)

Suite de l’audit structurel du 17 octobre 2026. Les chiffres ont été recomptés sur le dépôt du jour.

## Lot 1 — chaîne collecte → production

**Constat du 17 octobre au matin.** Dix des dix-neuf collectes programmées ont échoué ou ont été
annulées alors que la collecte et le commit avaient réussi :

| Collecte | Cause réelle |
|---|---|
| Données économiques | `deploy / build` bloqué par `audit:etf-annual-performance` (cotation MTPI/EXCH d’une part, sans rapport avec la donnée collectée) |
| Observations de publication, SCPI, assurance-vie, acteurs, fiches pratiques | shards navigateur 0 et 2 : contrôles qui figeaient une valeur mouvante (« Données à revoir », « Réutilisation des données ») |
| Émetteurs ETF, 35 ETF des allocations | annulées : le groupe de concurrence `active-market-data-production` n’avait pas de file d’attente, chaque nouvelle arrivée annulait le run en attente |

**Voie « données seules »** (`scope` → `advisory-checks`, fusionnée le 17 octobre à 17 h 50) :
vérifiée sur des commits réels avec `classify-deploy-scope.mjs` : un commit de collecteur au-dessus du
commit publié est classé « données seules » ; un commit qui traverse une fusion de code garde le
portail complet. Les contrôles navigateur éditoriaux ne retiennent plus une donnée validée ; le build,
les tests Python et le smoke restent bloquants. À observer sur cinq jours de collectes.

**Corrections apportées.**
- `queue: max` sur les quatorze groupes de concurrence des collecteurs qui n’en avaient pas ;
  `test_audit_workflows.py` l’exige désormais pour tout groupe `cancel-in-progress: false`.
- `playwright-tools.mjs` : les années « 2025 » figées (dernière année complète d’un actif, STOXX,
  fiches d’indices) sont dérivées de la dernière clôture de décembre de chaque série et des rendements
  publiés de chaque fiche. Vérifié : 19/19 outils en local sur Chromium.
- Les captures des shards navigateur ne sont plus téléversées qu’en cas d’échec (un shard vert
  produisait jusqu’à 2 Go d’exports PNG par passage).
- Conservation des dernières valeurs : `test_validated_data_commit`, `test_etf_resilience`,
  `test_active_refresh`, `test_issuer_reliability`, `test_data_automation` passent ; une source en
  panne garde sa dernière observation et déclenche le signal de collecte.
- `test-export-copy.mjs` utilise le serveur de développement Vite : toute modification de fichier
  pendant son exécution provoque un rechargement et un faux échec. Il reste exact en CI.

## Lot 2 — surveillance

- `scripts/report_partial_failures.py` lit les rapports d’un collecteur avec les règles du statut des
  automatisations et fait échouer un job `report-failures` sans bloquer la publication validée.
  Branché sur Bitcoin (indices dérivés), fiches d’indices automatisées et radar éditorial. L’or et
  l’inflation ne peuvent pas échouer partiellement : une seule série, l’étape échoue entièrement.
- Le flux du radar (`feed.json`) est désormais un rapport du statut : une famille de sources illisible
  apparaît comme échec de collecte ; les contradictions de même période restent des signaux de revue.
- `automation-workflows.json` porte les routes exactes des outils alimentés (`paths`) ; le test
  `test-automation-overview.mjs` exige qu’un collecteur sur deux ne soit jamais hors manifeste, que
  chaque route existe et que chaque entrée ait ses étapes de collecte.
- « Données à revoir » affiche l’ancienneté de la dernière exécution, la cause relevée (étapes en
  échec et sources) et des liens vers les outils alimentés.
- Issue « Fiabilité des données » : un commentaire n’est posté que pour un incident de données
  (collecte, contradiction, publication, échéance), pour la fermeture, ou passé six heures de calme ;
  un contrôle qui rechute ou une simple résolution ne réécrit que la description.
- Radar éditorial : une seule issue suivie, dont la description liste les signaux des quatorze derniers
  jours et se ferme d’elle-même sans signal récent ; les nouveaux signaux arrivent en commentaire ;
  les anciennes issues « N nouveaux signaux » sont fermées automatiquement une fois leurs signaux
  reconnus. Les accusés de notification restent dans la description et les commentaires.
- Le repli d’un sujet des « 100 ménages » sur sa valeur manuelle devient un incident de surveillance
  et s’affiche dans l’outil.

## Lot 3 — raccordements

| Point | Avant | Après |
|---|---|---|
| LDDS | taux du Livret A | `REGULATORY.lddsRate` (service-public) |
| PEL | 0 % | `src/data/pel-rates.js` : taux brut par génération d’ouverture (2003 → 2026), plafond 61 200 €, sélecteur de génération ; sources service-public, recoupées |
| Plafonds PEA / PEL | avertissement manuel | plafonds légaux appliqués par la projection, avertissement limité aux conditions non simulées |
| Impact des frais | TER seul | frais d’enveloppe des 7 contrats d’assurance-vie collectés, ajoutés au support, sourcés dans le texte |
| Inflation annuelle | table manuelle 2010-2025 | chiffres INSEE publiés conservés ; années complètes manquantes dérivées de la série mensuelle collectée ; `test-inflation-consistency.mjs` borne l’écart à 0,15 point |
| Change | table `historicalFx` en dur dans les duels | registre BCE unique ; `test-fx-consistency.mjs` vérifie que le taux annuel est la dernière observation de décembre |
| Conventions de performance | textes redits dans trois outils | `src/lib/performance-conventions.js` (devise, dividendes, conversion, période) ; notes de méthode des trois indices dans le registre |
| Courtiers | date du jour sur la carte | date de contrôle des grilles et date de la dernière grille officielle |
| 100 ménages | repli silencieux | mention « collecte Insee » ou « valeur manuelle » dans la fiche, incident de surveillance |
| Fonds euros / SCPI du Générateur | — | vérifié : 2025 lu dans `automated-economic.json` (ACPR 2,63 %, ASPIM 3,1 %), 2020-2024 historiques sourcés |

La dérivation de l’inflation annuelle à partir des variations mensuelles arrondies s’écarte jusqu’à
0,12 point du chiffre officiel : elle sert de bouche-trou, jamais de remplacement. Une dérivation
exacte demanderait la collecte des niveaux d’indice INSEE.

## Reste à faire sur ces lots

- Observer cinq jours de collectes sur la voie « données seules » avant de la considérer stable.
- Faire lire la fiche PEL (F16140) par le collecteur réglementaire pour remplacer la table manuelle.
- Collecter les niveaux d’indice INSEE pour une moyenne annuelle exacte.
