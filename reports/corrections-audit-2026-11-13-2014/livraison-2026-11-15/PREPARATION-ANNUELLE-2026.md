# Préparation des performances annuelles 2026 — 16 novembre 2026

Les deux tableaux séparés décrivent les raccordements : `preparation-annuelle-2026-series-configurees.csv` contient 721 configurations existantes, et `preparation-annuelle-2026-familles.csv` indique sources, méthodes, bornes, workflows, consommateurs et observations encore nécessaires. Il ne s’agit pas de 721 historiques financièrement certifiés.

Les corrections #1341 et #1347 sont publiées. L&G utilise maintenant les six années complètes explicitement déclarées par sa source, au lieu de la plage figée 2020–2025. Les quatre parts ont été contrôlées dans l’API réelle. Le test du texte portefeuille repose sur ses vraies bornes : le défaut sur 2021–2026 a été reproduit avant correction, puis deux scénarios EUR/NAV de janvier 2027 passent après correction.

Une source encore étiquetée 2025 conserve 2025. L’année en cours et une année de lancement incomplète restent exclues. Aucune date de production ni donnée financière réelle n’a été modifiée pour cette recette.

Les reprises mensuelles existantes ciblent les mois clos absents : passages complets les 2, 4, 8 et 16, reprise quotidienne à 06:45 UTC. Les bornes de fin 2025 et fin 2026, revenus, splits, conversions et profondeurs dépendent du contrat de chaque série. Les six refus et les restrictions Palladium restent ciblés ; un calendrier annuel ne complète pas un historique mensuel.

Pour les SCPI, le taux de distribution déclaré reste distinct d’un rendement de marché et d’une cible. Les contrôles réels Iroko/Remake et le scénario isolé de janvier 2027 sont conservés. Un rapport annuel 2026 dont la publication n’est pas encore attendue ne devient pas une panne. Les positions trimestrielles 13F ne sont pas une performance annuelle : cette exigence est non applicable.

Restent à observer : données définitives de décembre 2026, revenus, ajustements et changes ; acquisition réelle en janvier 2027 ; qualification, enregistrement et publication ; apparition dans les sélecteurs, calculs, textes et PNG. Aucun cron fournisseur postcorrectif du 16 novembre n’est visible au relevé de 13:24 UTC. Un lancement manuel et un test de changement d’année ne remplacent pas ces preuves futures.


---

# Archive du bilan précédent — état daté, ne pas confondre avec la livraison ci-dessus

# Préparation des performances 2026

Relevé 2026-11-15T23:44:48.417698+00:00. Code public `fdf1b581402f909f04d1e4f6bfe98126742b0c20`, données `eb865db0b760ed5b47fdfd003bf51df60e92a14c`, voie `validated-data`. Suivi unique [#881](https://github.com/madmax91310/shinny-potato/issues/881). Les preuves antérieures restent datées ; ce complément ne les réécrit pas.

Le CSV `preparation-annuelle-2026-series-configurees.csv` couvre **721 configurations de séries**, toutes raccordées à au moins un consommateur déclaré dans l’inventaire public actuel (720 figuraient dans la matrice archivée). Ce dénominateur n’est ni un nombre d’actifs uniques ni un nombre de fournisseurs certifiés.

- Bornes décembre 2025 et décembre 2026, conventions, devise, méthode, workflow et consommateurs figurent par série. Une borne présente n’est pas assimilée à une borne qualifiée.
- Pour les lancements documentés, la première année civile complète est conservée. Une année de lancement partielle est non applicable, pas une donnée à fabriquer.
- Producteur mensuel ordinaire : 06:15 UTC les 2,4,8,16 ; reprise ciblée quotidienne 06:45. Producteur ETF/indices : 07:10 quotidien. Or/Bitcoin : reprises tardives complétées. Horaires nominaux, soumis aux délais GitHub et aux publications fournisseurs.
- Les tests isolés vérifient 2026 après clôture, l’exclusion de 2027 en cours, les périodes communes, les trous, les rendements géométriques, les libellés ETF, les Duels, l’absence de change et la conservation des archives. Aucun changement de date de production.
- La nouvelle borne BCE refuse une dernière séance de décembre manquante. La collecte MSCI est exécutée indépendamment et ses échecs sont explicitement conservés.
- Les calendriers JPMorgan distinguent YTD, année de lancement et année complète ; décembre qualifié reste nécessaire. Aucun montant annuel 2026 définitif ajouté aujourd’hui.

**Reste à observer en janvier 2027** : acquisition réelle des dernières séances et distributions 2026, disponibilité des bornes de change, qualification individuelle, enregistrement, publication et consommation des années complètes. Les tests de changement d’année ne prouvent pas ces étapes futures. Les limitations financières de chaque série restent applicables.

## Complément de validation

Les tests isolés du changement d’année ont été rejoués sur le code courant : périodes communes, calculs géométriques, années et libellés ETF, Duels, absence de change et archives. Réussite dans `preuves/annual-rollover-current.log`. Ils modifient uniquement la mémoire du test ; aucune date de production ni valeur annuelle 2026 définitive ajoutée. Les 721 configurations disposent d’un consommateur courant déclaré ; cela ne constitue pas 721 sources financièrement certifiées. L’acquisition des bornes définitives fin 2026 et le passage planifié de janvier 2027 restent à observer.
