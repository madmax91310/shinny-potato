# Données partagées : reprise des points 1–3

Périmètre : actions et ETF employés dans les performances, simulations, prix historiques et Actifs & expositions. Comptes, prévisions et valorisations exclusivement utilisés dans Analyse d’entreprise exclus. Aucune exclusion des actions utilisées ailleurs.

## 1. Inventaire vérifiable

Le build produit public/data/shared-market-coverage.json à partir des consommateurs effectifs. Le bilan relie identités, sources, dates, conventions, destinations, état de configuration et dernières collectes. Il est accessible dans Données à revoir, sous la couverture par champ, avec téléchargement détaillé. Il est régénéré à chaque build et ne constitue pas une seconde base entretenue manuellement.

## 2. Historiques et propagation

Le rapport compare intégralement les observations enregistrées aux points utilisés, leur devise et les prix historiques séparés. Une divergence bloque le build. Les limites d’identité restent explicites : un ADR et une action ordinaire ne sont pas fusionnés par leur nom. Un contrôle récent ne garantit pas une publication nouvelle ; la période et la dernière collecte restent distinctes.

## 3. Compositions partielles

La concentration respecte le caractère complet ou partiel de chaque composition, même lorsque des poids arrondis atteignent 100 %. Les identifiants invalides ne permettent pas une prétendue composition complète. Les comparaisons intégrales restent interdites sur une liste partielle. Une photographie future ou une date impossible ne remplace pas la dernière observation utilisable.

## Vérifications et limites

Au contrôle local du 19 octobre : 635 historiques, dont 390 actions, 647 supports d’exposition ; 125 listes partielles, un support sans liste exploitable et deux liaisons d’identité à qualifier. Ce constat ne signifie pas que toutes les compositions sont intégrales ou toutes les sources disponibles. Les états sont calculés de nouveau à la construction.

Build et budgets, suite DCA, 368 actions automatisées et leurs trois consommateurs, navigateur sur le bilan mobile et 420 exports DCA vérifiés. Les tests de non-régression couvrent les compositions partielles totalisant 100 %, les dates futures et impossibles. La livraison effective doit être confirmée par la PR, le workflow Pages et build-info.json.
