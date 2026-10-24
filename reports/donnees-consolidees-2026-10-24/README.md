# Suivi consolidé des données communes

État courant : [RAPPORT.md](RAPPORT.md), livraison courte : [LIVRAISON.md](LIVRAISON.md).

- [Matrice donnée × outil](matrice-donnees-usages.csv) : tous les contrats de la capture publiée, A/B/non applicable, sources, fraîcheur, preuve et blocage.
- [Chaînes mutualisées](chaines-donnees.csv) et [dénominateurs](matrice-bilan.json).
- [Suivi unique](suivi-consolide.csv), [reliquat](restant-a-verifier.csv), [bilan](bilan.json).
- [19 actions](statut-19-actions.csv), [79 divergences conservées](reconciliation-79-ecarts.csv).
- [Corrections](corrections.json), [rapprochements documentés](rapprochements-livres.json), [coordination](COORDINATION.md).

Les vues sont générées depuis le suivi ; elles ne constituent pas une seconde liste indépendante. Les sources héritées dans `sources/` restent immuables. Les preuves antérieures restent dans `preuves/`, les nouvelles chaînes de cette finalisation dans `preuves/autonomie-commune/`.

Un B reste non résolu et ne prouve pas à lui seul une valeur financière fausse. Une collecte, une publication et une utilisation sont des preuves distinctes. Les hypothèses, archives et champs non requis ne sont pas des pannes. Le périmètre IA supprimé par #923 n'est pas restauré ; il n'est pas classé comme donnée réparée.
