# Suivi consolidé des données — 24 octobre 2026

[RAPPORT.md](RAPPORT.md) est le bilan de référence. [suivi-consolide.csv](suivi-consolide.csv) est le seul suivi modifiable : il conserve toutes les provenances et distingue données, supervision, usages et niveau de preuve.

Les autres tableaux sont des vues de ce même suivi, pas des listes à maintenir séparément :

- [bilan.json](bilan.json) : compteurs, dénominateurs et limites.
- [statut-19-actions.csv](statut-19-actions.csv) : état des actions historiques.
- [reconciliation-79-ecarts.csv](reconciliation-79-ecarts.csv) : chaque cas financier encore ouvert et sa pièce manquante.
- [restant-a-verifier.csv](restant-a-verifier.csv) : contrats actifs ou vérifications explicitement incomplètes ; ces lignes ne représentent pas autant de pannes indépendantes.
- [corrections.json](corrections.json) : corrections des données séparées de celles de la supervision.
- [RECONCILIATION.md](RECONCILIATION.md) : rapprochement effectué avant modification et coordination des fichiers.

Les fichiers de `sources/` restent des instantanés immuables, avec leurs origines et empreintes dans `sources/origines.json`. Les preuves sont individuelles dans `preuves/` ; aucune archive unique n’est nécessaire pour les consulter. Les rapports antérieurs restent historiques et ne sont pas réécrits.

Le reçu final du rapport identifie séparément le code et les données réellement servis. Une documentation fusionnée après ce reçu n’est pas présentée comme une nouvelle version de l’application. Une collecte partielle, une limite documentaire et une correction d’affichage ne valent pas réparation d’une ancienne série financière.
