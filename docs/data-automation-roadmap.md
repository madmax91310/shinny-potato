# Automatisation et suivi des données

Périmètre validé le 5 octobre 2026 : lots 1, 2, 3 et 4. Le renforcement des 13F (lot 5) est exclu. Les automatisations 13F existantes restent en place.

## Livré

| Lot | Fonctionnement | Cadence | Effet sur les données actives |
|---|---|---|---|
| 1. Inflation INSEE | Collecte SDMX de la série 011814631, variation mensuelle IPC, France, ensemble des ménages, tous produits, non CVS, base 2025. Contrôle de l’identité, des mois, des valeurs, du retard et des statuts provisoire/définitif. | Le 1er et le 16 à 07:15 UTC ; lancement manuel possible. | Actualisation des mois à partir de 2026, révisions tracées, historique antérieur conservé. Commit seulement si valeurs ou qualité de publication changent ; build et déploiement Pages contrôlés. |
| 2. Connecteur ETF pilote | Cinq parts iShares : World, S&P 500, EM IMI, Japon IMI, World Small Cap. Collecte des JSON intégrés aux pages officielles : ISIN, indice, TER, distribution, encours de la part, secteurs et géographie lorsqu’elle est publiée. | Le 3 à 07:10 UTC ; lancement manuel et test réel sur PR. | Observation uniquement. Les absences ne sont pas remplacées par une répartition inventée. |
| 3. Performances annuelles des mêmes ETF | Extraction de la colonne `annualNav`, jamais du benchmark ; années calendaires complètes, USD, revenus réinvestis, frais du fonds inclus. Comparaison aux valeurs du registre commun exporté à chaque exécution. | Avec le pilote mensuel ; les publications annuelles apparaissent automatiquement lors des collectes suivantes. | Historique collecté et comparé automatiquement, sans remplacement automatique des séries actives ni déplacement de la fenêtre des simulations. |
| 4. Qualification Bitcoin | Comparaison Coinbase/Yahoo enrichie : médiane/max des écarts, mois sans référence, profondeur observée, seuil diagnostic de 0,1 % et prérequis non qualifiés. | Pilote existant, le 2 à 06:40 UTC. | Aucun raccord. Un diagnostic de prix satisfaisant ne valide pas l’identité des deux séries. |

Première collecte réelle : cinq ETF, encours/compositions au 2 octobre 2026, **30 rendements annuels 2020–2025 identiques aux valeurs actives à deux décimales**. Les pages S&P 500 et Japon ne publient pas de tableau géographique dans le composant collecté. L’inflation est identique au registre actif jusqu’à septembre 2026 ; septembre est provisoire. Captures : `scripts/source-snapshots/etf-pilot-2026-10-05.json` et `inflation-automated.json`.

Les réponses et métadonnées des collectes sont disponibles dans les artefacts GitHub pendant 35 jours ; le résumé de chaque exécution affiche les écarts ou révisions. Les échecs réseau, erreurs de schéma ou données trop anciennes font échouer le workflow ; aucune valeur active n’est écrasée par une réponse invalide. Les PR exécutent les collecteurs dans une copie jetable sans commit ni déploiement. Les tests de corruption tournent aussi avant chaque build Pages.

## Roadmap suivante, par priorité

### A. Passer du pilote ETF à la mise à jour automatique

1. Observer deux cycles mensuels complets et vérifier stabilité du schéma, dates, allocations et disponibilité. Un succès du job ne doit jamais rajeunir une composition absente.
2. Raccorder d’abord les encours de ces cinq parts au registre commun, avec montant, devise, périmètre part et date réelle. Comparer les changements ; conserver les valeurs précédentes en cas de blocage.
3. Raccorder ensuite les compositions **du fonds**, avec traduction contrôlée des secteurs/pays et traitement explicite du cash/dérivés. Ne pas les utiliser comme compositions de l’indice. Compléter les géographies absentes uniquement avec un téléchargement officiel qualifié.
4. Appliquer les performances annuelles dans la même devise et selon la même méthode, avec contrôle de tous les consommateurs. Les outils actuellement figés sur 2020–2025 doivent être adaptés explicitement avant d’intégrer 2026 : aucune extension silencieuse des simulations.
5. Déployer uniquement les changements validés ; prévoir reprise d’un déploiement interrompu et rollback vers la capture précédente.

### B. Étendre par émetteur, pas par outil

Après validation du pilote : autres parts iShares réellement utilisées, puis un connecteur Amundi, puis Vanguard/DWS/State Street selon leur poids dans le catalogue. Chaque connecteur doit vérifier part, devise, méthode, photographie et droits de réutilisation avant activation. Ajouter une fiche une seule fois au registre partagé ; les outils consommateurs réutilisent cette fiche.

Objectif : automatiser en priorité encours, compositions et performances qui vieillissent vite. Les caractéristiques (indice, TER, réplication, distribution) sont collectées comme signal de changement, puis revues si elles diffèrent. Le statut PEA nécessite sa propre preuve et ne se déduit ni du domicile ni du type d’indice.

### C. Résoudre les séries historiques homogènes

Pour Bitcoin : vérifier disponibilité d’une source couvrant tous les mois actifs depuis janvier 2015 ; comparer aux consommateurs et documenter son périmètre. Si Coinbase est retenu, migrer toute la série avec une décision explicite ; ne pas conserver Yahoo avant une date et Coinbase après. Le seuil diagnostic de 0,1 % n’est pas un seuil d’autorisation.

Pour les autres actifs : qualifier un seul fournisseur par série (prix ou total return, devise, horaires, dividendes, profondeur) avant d’ajouter une collecte mensuelle. Ne pas convertir un cours brut en performance dividendes réinvestis.

### D. Un suivi centré sur les exceptions

| Fréquence | Tâche automatisée cible | Intervention nécessaire |
|---|---|---|
| À chaque collecte | Identité, schema, dates, complétude, valeurs, écarts avec la dernière capture | Seulement si échec, retard ou variation inhabituelle |
| Chaque mois | Encours, compositions ETF, historiques mensuels ; inflation après ses publications | Traiter les sources absentes ou changements d’identité/méthode |
| Janvier puis février | Détecter et intégrer les performances de l’année achevée | Adapter la fenêtre des outils ; pas de rendement annuel incomplet |
| Chaque semestre | Vérification des caractéristiques, statuts PEA et conditions fournisseurs | Revue des preuves qui ne disposent pas de source structurée fiable |
| Une fois par an | Contrôler les connecteurs, séries arrêtées, liens, droits et couvertures | Décider des changements de source ou de périmètre |

Prochaine évolution de l’interface « Données à revoir » : afficher par source la dernière collecte réussie, la dernière photographie disponible, le prochain passage et le mode réel (« automatique », « pilote », « manuel »). Produire une liste courte d’exceptions dédupliquée par source, plutôt qu’un rappel pour chacun des outils dépendants. Une notification externe n’est pas configurée dans ce lot.

## Commandes de vérification

```sh
python -m unittest discover -s scripts -p 'test_data*.py'
node scripts/export-inflation-baseline.mjs > /tmp/inflation-baseline.json
python scripts/update_inflation.py --baseline /tmp/inflation-baseline.json --output /tmp/inflation-observation.json
node scripts/export-etf-pilot-baseline.mjs > /tmp/etf-baseline.json
python scripts/collect_etf_pilot.py --baseline /tmp/etf-baseline.json --output /tmp/etf-observation.json
```

Ajouter `--apply` à l’inflation applique seulement une collecte entièrement validée. Les pilotes ETF/Bitcoin ne disposent pas de mode d’application.

Sources techniques : [SDMX INSEE](https://www.insee.fr/fr/information/2862759), [série IPC actuelle](https://www.insee.fr/fr/statistiques/serie/011814631), [page officielle World](https://www.ishares.com/uk/individual/en/products/251882/), [Coinbase candles](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles). Pages iShares publiques : JSON intégré au HTML, pas une API contractuellement stable.
