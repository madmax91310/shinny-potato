# Roadmap actifs — priorités 1 et 2

## Ajouts

- Mastercard (MA), Adobe (ADBE), Home Depot (HD) : historiques USD ajustés des dividendes et divisions, janvier 2015 à septembre 2026 ; 141 observations par série. Cours bruts distincts pour « Il y a X ans » et clôture quotidienne datée.
- iShares STOXX Europe 600 Banks UCITS ETF (DE), DE000A0F5UJ7, EXV1 sur Xetra en EUR.
- iShares STOXX Europe 600 Insurance UCITS ETF (DE), DE000A0H08K7, EXH5 sur Xetra en EUR.

Les deux ETF ont leur composition, caractéristiques, frais, encours daté et rendements NAV calendaires officiels. L'ETF assurances publie un encours de **fonds**, conservé comme tel ; il ne devient jamais un encours de part. Ses champs `baseCurrencyCode`, `launchDate` et `totalNetAssetsFundLevel` sont enregistrés explicitement. La classification sectorielle « Banks » conserve sa granularité.

## Outils

Les cinq actifs sont disponibles dans Et si tu avais investi, Performance depuis et Il y a X ans, avec leurs conventions respectives et leurs illustrations existantes. Les ETF sont également dans Présentation ETF, le comparatif banques/assurances, le Générateur manuel et les Duels personnalisés. Aucun poids ni profil automatique du Générateur n'est changé. Aucun statut PEA n'est déduit de leur exposition européenne.

## Collecte

Le workflow `update-non-bond-expansion.yml` renouvelle les sources tous les jours à 07:15 UTC. Les identités et compositions iShares viennent de l'API officielle ; les cotations Xetra sont vérifiées dans les tableaux officiels (EXV1 et EXH5). Le RIC fourni par iShares diffère du symbole Yahoo ; les historiques utilisent les tickers exacts sur Xetra, validés en EUR et recoupés entre les requêtes quotidiennes et mensuelles. Les cinq séries ont été collectées en direct le 13 octobre 2026 ; les preuves datées et empreintes sont dans `non-bond-monthly-active.json`.

Les échecs préservent la dernière observation valide et font échouer le workflow pour alimenter le suivi d'automatisation. Les observations de clôture brutes restent distinctes des rendements ajustés. Aucun prix manquant n'est interpolé.

## Validation

Collecte directe des cinq séries : 5/5 ; 141 mois chacune. Collecte des deux sources iShares : 2/2. Régressions : périmètre d'encours, identité de part, absence du champ explicitement enregistré, exclusion de l'année de lancement, classification bancaire. Audits des historiques, catalogue, provenance, comparatifs et duels, ainsi que build et budgets des bundles. Contrôles navigateur et collecte de renouvellement exécutés dans la CI avant fusion.
