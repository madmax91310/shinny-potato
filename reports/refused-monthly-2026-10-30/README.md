# Neuf fenêtres refusées — investigation du 30 octobre 2026

Base examinée : `89e2305` sur master. Bilan de référence : PR #1064.

**Aucune fenêtre supplémentaire rétablie : 70/79 restent qualifiées, neuf restent refusées.**
Aucun seuil, historique de production, critère d'admission, calendrier de collecte ou texte d'image modifié. Les 77 anciennes divergences et les deux résidus restent distincts. Les refus ci-dessous décrivent les pièces qui manquent aujourd'hui ; ils ne démontrent pas une impossibilité définitive.

## Résultat par fenêtre

| ISIN | Année | Observation réellement obtenue | Pièce encore nécessaire |
|---|---|---|---|
| DE000A0H08P6 | 2019 | Nouvelle réponse BlackRock acquise. Les facteurs janvier/octobre se rapprochent ; avril/juillet échouent au contrôle existant. Le rapport fiscal officiel confirme le montant de juillet, 0,374603 EUR. | Convention/facteurs de réinvestissement exacts expliquant ces deux écarts ; aucune tolérance augmentée. |
| DE000A27Z304 | 2021 | Page officielle et code client examinés ; le JSON public consulté reste daté du 9 février 2023, sans série quotidienne qualifiable. | NAV quotidiennes exactes ou clôtures officielles, devise historique, continuité et opérations sur toute la fenêtre. |
| DE000A27Z304 | 2023 | Même limite. La présence d'une performance annuelle sur la page ne fournit pas douze rendements mensuels. | Même pièce, avec bornes de décembre 2022 et décembre 2023. |
| DE000A27Z304 | 2024 | Même limite. Aucune série reconstituée depuis Bitcoin ni depuis des performances annuelles. | Même pièce, avec bornes de décembre 2023 et décembre 2024. |
| FR0010755611 | 2021 | API Amundi : NAV et indice ajusté disponibles ; politique capitalisation et/ou distribution, champ des montants distribués nul. | Calendrier exhaustif de distributions ou qualification indépendante de l'indice réinvesti et des unités/splits. |
| FR0010755611 | 2024 | Même réponse ; les NAV ne suffisent pas seules à qualifier les distributions historiques. | Même pièce pour cette fenêtre, et convention des ajustements. |
| FR0013411998 | 2025 | API Amundi : champ des montants distribués nul, politique mixte. Rapport annuel 2025 et prospectus recherchés ; ils ne prouvent pas l'absence de distribution sur toute l'année civile. | Distributions exhaustives de l'année civile ou indice réinvesti indépendamment qualifié. |
| FR0013412004 | 2025 | API Amundi : même limite. La fiche officielle maintient la politique mixte malgré le nom Acc. | Même pièce, pour la part exacte. |
| IE00B4K6B022 | 2024 | Deux déclarations HSBC/RNS acquises depuis l'archive officielle FCA : détachements explicitement nommés au 01/02/2024 (0,2214 EUR) et au 08/08/2024 (1,2623 EUR), distincts des paiements. | Contradiction des avis Euronext du 01/08 et 08/08 non arbitrée ; bornes quotidiennes NAV/clôture, convention de réinvestissement et éventuel remplacement de l'avis à qualifier. |

Les quatre montants iShares et les écarts numériques sont dans `replay.json`. Deux écarts excèdent la tolérance numérique actuelle, sans modification des niveaux émetteur. Le document fiscal couvre mars 2019–février 2020 : il confirme juillet, pas à lui seul tout le calendrier 2019.

## Avancée HSBC, sans réparation prématurée

Les deux routes FCA auparavant en HTTP 403 ont répondu HTTP 200 dans cet environnement le 30 octobre, vers 08:12 UTC. Les tables de la part exacte nomment explicitement les dates de détachement. Ce résultat ne démontre pas l'accessibilité depuis GitHub Actions.

L'extraction distingue l'ISIN, la devise du dividende et celle de cotation : la ligne britannique du communiqué cote en GBX, mais les distributions sont en EUR. Elle ne prend aucune date ni aucun montant sur un fonds voisin. Les anciennes hypothèses de suppression d'un saut dans Yahoo restent des hypothèses : aucune n'est appliquée. L'avis FCA précise la date de l'émetteur ; il ne constitue pas une preuve d'annulation d'un avis Euronext.

Le rejeu existant `scripts/reconcile_hsbc_distributions.py` et les preuves antérieures restent intacts. Le nouvel inspecteur est un outil de recherche en lecture seule ; il ne change pas les conventions des consommateurs.

## Acquisitions et reproductibilité

`sources.json` conserve URL, heure de consultation, taille et SHA256 des octets décompressés de chaque acquisition retenue. `sources/` conserve les réponses et la requête Amundi. L'inspecteur vérifie toutes les empreintes avant lecture. Il rejoue une capture datée ; il ne simule jamais une nouvelle consultation et n'écrit aucun registre de l'application.

```sh
python scripts/inspect_refused_monthly_evidence.py --output /tmp/refused-monthly-replay.json
python -m unittest discover -s scripts -p 'test_refused_monthly_evidence.py'
```

Aucune nouvelle reprise planifiée n'est annoncée comme une collecte réparée. Les documents historiques acquis constituent une preuve réutilisable, pas un renouvellement automatique de fraîcheur.

## Exécutions examinées

- [41018522954](https://github.com/madmax91310/shinny-potato/actions/runs/41018522954), lancement manuel du 30 octobre à 07:11 UTC : acquisition, validations, build et vérification des consommateurs réussis ; échec à l'enregistrement. Le garde de rebase détecte des changements amont hors de son périmètre autorisé et exige une recollecte depuis master. Pas de déploiement dans cette exécution. Ce refus protège la cohérence ; il n'est pas contourné.
- [41021945751](https://github.com/madmax91310/shinny-potato/actions/runs/41021945751), lancement manuel de 07:44 UTC : encore en cours à la consultation, acquisition réussie et validation des séries en cours. Aucune publication attestée par cette observation.
- Le prochain passage complet prévu est le 2 novembre à 06:15 UTC ; les reprises de seules sources échouées restent quotidiennes à 06:45 UTC. Un lancement manuel ne vaut pas passage planifié.

## Validation effectivement exécutée

- 32 tests Python réussis : nouveau lecteur de notices (4), indice BlackRock (10), NAV Amundi (8), NAV distribuante Amundi (7), rapprochement des distributions (3).
- `test-financial-window-safety.mjs` réussi : 79 cas ouverts/résiduels rapprochés de leurs consommateurs, 70 voies NAV indépendantes préservées ; refus propagé au calculateur, vidéo comparative, classements, change, anniversaire et projections annuelles. Les 41 refus de cotations actives dans ce test ne sont pas 41 nouvelles fenêtres : plusieurs anciens cours restent protégés même lorsqu'une voie NAV indépendante existe.
- Snapshot courant `nine-consumers.json.gz` : les neuf cas du tableau n'ont aucune fenêtre admise parmi leurs consommateurs courants.
- Contrôles complémentaires : fenêtres de rendement, consommateurs NAV et consommateurs mensuels (résultats consignés dans `validation.json`).

Pas de modification de l'application à déployer : ce lot livre des preuves, leur extraction reproductible et des tests. La fusion de ces éléments ne sera pas présentée comme une restauration financière ou un déploiement de nouvelles données.
