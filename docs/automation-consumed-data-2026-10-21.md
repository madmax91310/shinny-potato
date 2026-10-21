# Automatisation des données consommées — 21 octobre 2026

## Périmètre demandé

L’objectif porte sur chaque champ utilisé par chaque actif dans un outil actif. Une collecte configurée, un document accessible ou un build réussi ne certifie pas son renouvellement. Les références, archives, textes éditoriaux et hypothèses saisies restent séparés des observations financières. Les données non publiées ne deviennent jamais des zéros ou des observations automatisées.

Analyse d’entreprise est retirée à la demande de l’utilisateur : route, composant, dossiers, catalogue financier, collecteur, scripts spécifiques et contrôles associés. Les comptes, BPA, PER, FCF, prévisions et valorisations propres à cet outil ne sont plus requis. Les historiques boursiers, identités et classifications utilisés ailleurs sont conservés. Les candidats servant uniquement à l’ancien outil ne créent plus d’obligation d’exposition.

Les anciens incidents de ce collecteur sont classés « retirés du périmètre », avec motif et date, et ne sont pas présentés comme des données réparées. Le suivi et la reprise automatique excluent explicitement ce collecteur retiré. Le registre conserve cette décision pour interpréter les anciens statuts.

## Travaux livrés

| Chantier | Résultat |
|---|---|
| Usages des données | Vue « Données utilisées par outil » dans l’inventaire. Chaque usage relie actif, champ requis, source, dates, collecteur et statut. Export JSON. Les consommateurs non reconnus restent signalés. Les références de champs sont mutualisées pour éviter de dupliquer les observations à chaque outil. |
| Périmètres hors catalogue | Les statistiques de ménages et paramètres réglementaires restent des obligations. Le suivi inclut les champs des portefeuilles 13F, les paramètres effectivement référencés par le simulateur et les fiches pratiques, ainsi que les devises utilisées par les classements. Une revue de disponibilité d’un trimestre 13F ne renouvelle pas la date des poids conservés. |
| Incidents | Regroupement par collecteur, champ, cause et devise ; détail par actif, recherche, sources et diagnostic conservés. Les échecs de fournisseurs différents ne sont pas fusionnés. Le retrait d’un outil reste distinct d’un retour à la normale. |
| Saxo | Découverte de la brochure déplacée vers la page officielle `pricing-overview`, corroborée par les documents légaux. Les contrôles de PDF, clauses, dates et identité restent applicables. La collecte locale complète a validé les 14 sources réglementaires/tarifaires sans échec. |
| Change | Nouvelle collecte réelle du croisement TWD/EUR : 333 mois validés, avec source FRED/Federal Reserve et BCE. Les autres observations conservent leurs preuves. |
| Métadonnées | Renouvellement réel de 11 instruments ciblés. La contradiction PEA d’iShares Euro Dividend persiste entre sources ; aucune valeur n’est choisie par défaut. |
| ETF/ETC complémentaires | Collecte réelle sans erreur : renouvellement des frais et encours des six ETC WisdomTree de matières premières. Les douze alertes de fraîcheur correspondantes ne sont plus présentes dans le contrôle local. Le renouvellement GitHub doit être confirmé séparément. |
| Statistiques INSEE | Collectes réelles des sept familles ménages : 29 observations validées. |
| Publication concurrente | Les collectes mensuelles disposent d’une revalidation explicite sur l’arbre effectivement rebasé, avec audits, reconstruction et vérification de propagation. Un conflit, une divergence de projection ou un contrôle financier en échec empêche toujours la publication. Les métadonnées ont également une revalidation après rebase. |
| Collecteurs State Street | Deux collecteurs de positions restent raccordés après renouvellement du libellé émetteur « Optimised ». Leur admission exige les caractéristiques physiques indépendantes de la part exacte ; un libellé synthétique ou une contradiction les bloque. |
| Audits historiques | Le workflow de validation des extensions utilise l’audit commun qui vérifie séparément les captures immuables et les conventions de rendement actuelles, notamment Nasdaq. |
| Recherche de positions | Découverte quotidienne des liens L&G liés à la part exacte, avec empreintes des sources et contrôle des domaines. Les quatre CSV observés sont des paniers de création PCF : la clause indique que les positions du fonds peuvent différer. Ils ne sont donc pas promus en portefeuilles complets. Une panne de ce catalogue ne bloque pas les autres émetteurs. |

## Limites restantes

Le relevé avant retrait comptait 199 incidents ouverts, dont 160 liés au collecteur d’entreprises retiré, et 111 raccordements à traiter. Ces compteurs se recoupent et ne s’additionnent pas. Les nouveaux compteurs se lisent dans le site publié, après renouvellement du suivi GitHub ; un succès local ne doit pas fermer artificiellement un incident de production.

Les limites de fournisseurs restent ouvertes : accès WisdomTree Cloud refusé depuis GitHub, compositions physiques non qualifiées, compositions intégrales des indices économiques non disponibles dans les fiches top dix, ventilations non publiées ou contradictoires, premières années civiles incomplètes, documents ou conditions propres à une part/contrat à qualifier. Les données disponibles de la part exacte et leurs alternatives calculées restent consommées avec leur convention explicite.

Les états « cycles à confirmer » et « renouvellement à qualifier » ne sont pas des certificats d’autonomie. La vue par outil indique les obligations restantes ; elle ne transforme pas le pourcentage de collecteurs programmés en pourcentage de valeurs automatiquement renouvelées.

## Validation

Compilation et budgets de routes. Audits du catalogue et des preuves, tests des obligations par outil, retrait explicite sans faux succès, reprise des publications sans écrasement concurrent, cohérence des calendriers, et rejet des paniers PCF comme positions du fonds. Recette Chromium en 390 et 1440 px : usages, ménages, 13F, source retenue en erreur, regroupement des incidents et retrait du collecteur.

La livraison n’est déclarée publiée qu’après validation du portail de production et vérification des réponses HTTP publiques, de `build-info.json` et de la nouvelle vue d’usages.
