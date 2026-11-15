# Préparation des performances 2026

Relevé 2026-11-15T14:13:53.566111+00:00. Code public `bc4b7a73959b4b2b449c2d76329e81431ba8d81e`, données `84597a3943d8516152ceb140120b4de44b16e4c5`. Même suivi [#881](https://github.com/madmax91310/shinny-potato/issues/881). Correctifs : [#1299](https://github.com/madmax91310/shinny-potato/pull/1299) ; [#1303](https://github.com/madmax91310/shinny-potato/pull/1303) ; [#1307](https://github.com/madmax91310/shinny-potato/pull/1307) ; [#1312](https://github.com/madmax91310/shinny-potato/pull/1312) ; [#1313](https://github.com/madmax91310/shinny-potato/pull/1313).

Le CSV `preparation-annuelle-2026-series-configurees.csv` couvre **720 configurations de séries**, toutes retrouvées dans la matrice archivée des consommateurs. Ce dénominateur n’est ni un nombre d’actifs uniques ni un nombre de fournisseurs certifiés.

- Bornes décembre 2025 et décembre 2026, conventions, devise, méthode, workflow et consommateurs figurent par série. Une borne présente n’est pas assimilée à une borne qualifiée.
- Pour les lancements documentés, la première année civile complète est conservée. Une année de lancement partielle est non applicable, pas une donnée à fabriquer.
- Producteur mensuel ordinaire : 06:15 UTC les 2,4,8,16 ; reprise ciblée quotidienne 06:45. Producteur ETF/indices : 07:10 quotidien. Or/Bitcoin : reprises tardives complétées. Horaires nominaux, soumis aux délais GitHub et aux publications fournisseurs.
- Les tests isolés vérifient 2026 après clôture, l’exclusion de 2027 en cours, les périodes communes, les trous, les rendements géométriques, les libellés ETF, les Duels, l’absence de change et la conservation des archives. Aucun changement de date de production.
- La nouvelle borne BCE refuse une dernière séance de décembre manquante. La collecte MSCI est exécutée indépendamment et ses échecs sont explicitement conservés.
- Les calendriers JPMorgan distinguent YTD, année de lancement et année complète ; décembre qualifié reste nécessaire. Aucun montant annuel 2026 définitif ajouté aujourd’hui.

**Reste à observer en janvier 2027** : acquisition réelle des dernières séances et distributions 2026, disponibilité des bornes de change, qualification individuelle, enregistrement, publication et consommation des années complètes. Les tests de changement d’année ne prouvent pas ces étapes futures. Les limitations financières de chaque série restent applicables.
