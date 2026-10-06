# Roadmap — priorités 1 et 2, état du 6 octobre 2026

## Changements réalisés

- UBS World : découverte mensuelle conservée, repli entre swissfunddata.ch et www.swissfunddata.ch, puis mois précédent ; contrôle du PDF, ISIN, devise et fraîcheur. Collecte du document du 31 août validée ; diagnostics de transport conservés.
- iShares Consumer Staples : ajout du libellé officiel « Fertilizers & Agricultural Chemicals » au registre des sous-secteurs autorisés, sans regroupement ni changement de poids. La collecte GitHub a révélé ce libellé manquant ; les libellés inconnus restent rejetés.
- WisdomTree : les champs HTML valides restent applicables lorsqu’un téléchargement PDF échoue. Le problème du PDF reste visible et provoque un signal d’échec ; les anciennes performances sont conservées. Ce changement ne supprime pas les blocages HTTP 403 de l’émetteur.
- TOPIX et Nasdaq-100 : compositions issues des sections « Données de l’indice » des fiches mensuelles Amundi du 31 août 2026. Pays et secteurs complets, dix principales positions et nombre de constituants ; le panier de substitution est exclu. Recherche du dernier mois clos, puis du mois précédent, avec concordance des dates.
- Nasdaq : rendements annuels depuis la fiche officielle XNDX Total Return USD du 30 septembre 2026. Année en cours exclue ; six années closes exigées. Cette convention historique reste distincte du Notional Net Total Return décrit dans la composition.

Couverture active : 151/154 instruments avec au moins un champ, 34 compositions d’indices (contre 32) et 45 séries annuelles (contre 44). Les historiques mensuels des simulateurs restent à 46/46.

## Sources qui bloquent encore la fin des priorités

| Périmètre | Résultat des collectes réelles | Suite nécessaire |
|---|---|---|
| BNP FR0011550185, FR0011550193, IE000QDFFK00 | Composant officiel Fundsheet inaccessible (HTTP 502) | Qualifier une découverte récurrente du document exact actuel ; ne pas réutiliser un ancien PDF comme source courante |
| WisdomTree, encours | Les pages HTML peuvent renvoyer 403 ; les PDF de repli ne publient pas tous les encours | Rétablir l’accès à la page ou qualifier une autre source officielle datée |
| S&P 500 Equal Weight : composition et annuels | Document américain actuel renvoyant une page HTML ; autre fiche UCITS accessible mais benchmark NET USD | Trouver une publication récurrente TOTAL USD correspondant exactement à la série existante ; ne pas substituer NET à TOTAL |
| S&P 500 : composition | URL Amundi actuelle datée indisponible ; document par défaut ancien | Publication mensuelle actuelle exacte avec tableaux complets |
| STOXX 600, EURO STOXX 50 : compositions | Anciennes fiches PDF de 2023 ; page courante EURO STOXX 50 limitée aux dix secteurs et positions principaux ; page STOXX 600 limitée par HTTP 429 | Répartitions complètes, numériques et actuelles, sans résidu inventé |
| Russell 1000 et 2000 : compositions | Graphiques sectoriels sans poids exploitables et positions sans pondérations | Tableaux officiels numériques complets |
| S&P Global et Euro Dividend Aristocrats : compositions | Les allocations accessibles décrivent le fonds | Répartitions de l’indice explicitement identifiées |

Il reste donc huit compositions et un calendrier annuel à raccorder, en plus des trois instruments BNP. Les rendements annuels déjà automatisés de ces indices restent actifs. Les valeurs précédentes sont conservées lors des erreurs ; celles-ci sont signalées. Les collecteurs réessaient aux dates prévues, mais un changement de schéma ou d’accès peut demander une réparation.

## Validation

Tests hors réseau : identité, devise, variante de rendement, date future/ancienne, calendrier incomplet, exclusion YTD, périmètre indice/fonds, repli UBS et conservation des champs indépendants. Fixtures réduites issues des publications officielles, sans republication des documents complets. Audits applicatifs de composition, provenance, performances et compilation exécutés avant publication.
