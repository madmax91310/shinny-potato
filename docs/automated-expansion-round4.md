# Ajouts automatisés du 12 octobre 2026 — quatrième extension

## Ajouts et consommateurs

| Part exacte | Présentation ETF | Comparatif ETF | Performance depuis / Et si tu avais investi / Il y a X ans |
|---|---|---|---|
| iShares STOXX World Equity Multifactor, IE00BZ0PKT83 | Oui, API officielle complète | World / multifactoriel | IFSW Londres USD, octobre 2015 à septembre 2026 |
| iShares iBonds Dec 2028 Term € Corp EUR Acc, IE0008UEVOE0 | Oui, API officielle complète | Non | B28A Paris EUR, octobre 2023 à septembre 2026 |
| iShares Physical Silver ETC, IE00B4NCWG09 | Fiche existante conservée | Non | ISLN Londres USD, janvier 2015 à septembre 2026 |
| Global X Silver Miners USD Acc, IE000UL6CLP7 | Non, historique seulement | Non | SILV Londres USD, juin 2022 à septembre 2026 |

Les prix sont ceux de chaque part et cotation, sans conversion arbitraire. Le métal physique est un ETC, les mines d'argent un fonds d'actions. Aucun raccordement de leur historique à celui du cours spot ou des futures argent.

Les simulations utilisent les cours ajustés des revenus et divisions, les anniversaires les cours bruts. Les premières périodes de cotation incomplètes sont exclues. Les clôtures quotidiennes de fin de mois et les bougies mensuelles sont recoupées. La bougie argent d'août 2015 est rejetée : une requête quotidienne indépendante de fin de mois concorde avec les séances quotidiennes ; les deux valeurs et l'URL de contrôle sont conservées dans la preuve. La tolérance reste inchangée.

Le multifactoriel a changé d'indice pendant son histoire : les textes ne présentent pas tout son historique comme celui de la stratégie STOXX actuelle. L'iBonds conserve son risque de taux, de crédit et de perte en capital ; son échéance ne garantit aucun rendement. Les secteurs obligataires sont ceux publiés par l'émetteur, et les obligations du portefeuille gardent leur ISIN pour distinguer plusieurs emprunts du même émetteur.

## Mises à jour sans intervention

Le workflow quotidien `update-qualified-exposures.yml` collecte les deux nouvelles fiches, leurs encours datés, caractéristiques, compositions, rendements NAV et cotations. Le workflow existant `update-market-monthly.yml` collecte les quatre séries les 2/4/8/16 du mois et reprend quotidiennement les échecs. Les derniers cours d'anniversaire sont actualisés quotidiennement. Les collecteurs rejettent les changements d'identité, de devise, les sources périmées et les historiques incomplets ; ils conservent les dernières données valides et leur date réelle.

L'iBonds cessera de publier de nouveaux cours après la liquidation prévue du fonds : l'historique sera alors à archiver, sans inventer de mois supplémentaires. L'échec de fraîcheur restera signalé jusqu'à cette transition explicite.

La qualification PR vérifie les sources sur GitHub Actions, les identités officielles de l'argent et des mines, les cours mensuels et les dernières séances, les registres partagés et les exports dans Chromium. Elle n'utilise pas de captures locales comme source de secours. Les simulations et le comparatif versement unique/DCA existant consomment directement les nouveaux actifs.

## Doublons et exclusions

- Eau, agriculture, bois, consommation, communication, platine, palladium et Avantis Small Cap Value : déjà raccordés, aucune duplication.
- Obligations euro indexées inflation : `euroInflationBond` existe déjà et possède sa collecte mensuelle ; aucune deuxième série du même ISIN.
- Visa, Air Liquide et Schneider Electric : déjà dans Analyse entreprise.
- ASML, L'Oréal et Novo Nordisk : aucun collecteur de comptes qualifié dans le pipeline actuel, donc aucune nouvelle fiche Analyse entreprise.
- Convertibles State Street IE00BNH72088 : collecte réelle rejetée par la validation numérique, source non qualifiée pour publication.
- Actions privilégiées Invesco IE00BG482169 : rendements récupérables mais le collecteur actuel ne fournit pas la composition complète des titres ; aucune fiche ajoutée.
- Mines d'argent : la page collectée ne publie pas la répartition sectorielle complète attendue ; les données historiques sont qualifiées séparément, sans inventer une composition.
- Réseaux électriques : aucun nouveau connecteur complet qualifié. Stockage : des fiches batteries existent déjà, sans nouvelle fiche en double.
- Investisseurs connus : aucun rendement global de fonds qualifié dans les données disponibles. Les rendements de lignes et les changements de valeur 13F ne sont pas utilisés comme performances de gestion.
