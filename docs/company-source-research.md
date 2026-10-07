# Sources sans compte ni clé — vérification du 7 octobre 2026

Les vérifications sont en lecture seule et ne modifient pas les observations
publiées. Le script `scripts/probe_company_sources.py` et le workflow
`probe-company-sources.yml` sont isolés sur la branche
`codex/company-source-research`. Le workflow ne déploie rien et ne s'exécute pas
sur master.

## Résultats vérifiés depuis GitHub Actions

[Premier test](https://github.com/madmax91310/shinny-potato/actions/runs/37580703294)
sur un runner Ubuntu 26.04, avec Python 3.12 et un User-Agent déclarant le projet.

- SEC companyfacts : HTTP 403 pour AAPL, MSFT, NVDA, GOOGL et AMZN.
  Même résultat pour Apple avec curl. Le problème n'est donc pas propre à urllib.
- Yahoo fundamentals-timeseries : réponses exploitables sans compte, cookie
  ni clé pour les cinq symboles. Revenus, bénéfices, PER TTM, PER prévisionnel
  et PEG reçus. Aucune garantie de disponibilité future : endpoint utilisé par
  le site et par yfinance, sans contrat de service pour notre application.

| Symbole | Date des trois ratios | PER TTM | PER prévisionnel | PEG |
| --- | --- | ---: | ---: | ---: |
| AAPL | 2026-09-17 | 38.646789 | 35.2113 | 2.706 |
| MSFT | 2026-09-22 | 27.743733 | 25.1256 | 1.6173 |
| NVDA | 2026-09-23 | 28.509482 | 24.8756 | 0.4791 |
| GOOGL | 2026-09-22 | 17.619669 | 22.8311 | 1.2549 |
| AMZN | 2026-09-23 | 20.053902 | 23.6407 | 1.4781 |

Ce sont des observations historiques de la source, pas des ratios calculés au
cours du 6 octobre. Leur téléchargement aujourd'hui ne rajeunit pas leur date.
L'actuelle limite de fraîcheur de sept jours les exclurait tous. Ne pas contourner
ce contrôle en mettant simplement observedAt à aujourd'hui.

## Méthode et limites

Endpoint testé :
`https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{symbol}`
avec types `trailingPeRatio,trailingForwardPeRatio,trailingPegRatio` et
`annualTotalRevenue,quarterlyTotalRevenue,annualNetIncome,quarterlyNetIncome`,
et bornes Unix `period1`, `period2`.

- Vérifier l'identité dans meta.symbol, chaque type, la devise des résultats,
  periodType, les dates et les valeurs finies. Dater chaque indicateur séparément.
- Les dates des comptes Yahoo sont parfois normalisées à la fin du mois :
  Apple Q3 2026 est donné au 30 juin, contre le 27 juin dans les comptes SEC.
  Ne pas inventer des dates exactes de début/fin à partir de ces observations.
- Yahoo ne fournit ici ni la date de dépôt SEC ni la date de publication de
  chaque résultat. Son dernier bénéfice trimestriel Amazon reçu correspond
  à mars 2026 : la présence de données dans d'autres séries ne permet pas de
  remplacer un trimestre manquant ou de mélanger les périodes.
- Le code yfinance associe PegRatio au libellé « PEG Ratio (5yr expected) ».
  Cela ne documente pas toute la formule du fournisseur, ni la base de BPA
  utilisée pour le PER prévisionnel. Ne pas affirmer que ce dernier représente
  exactement le prochain exercice sans autre preuve.
- Le README yfinance rappelle l'usage personnel de l'API Yahoo et renvoie aux
  conditions Yahoo pour les droits sur les données. Un appel public qui répond
  ne prouve pas un droit de redistribution sur un site public.

Sources : [code yfinance](https://github.com/ranaroussi/yfinance/blob/main/yfinance/scrapers/quote.py),
[README yfinance](https://github.com/ranaroussi/yfinance/blob/main/README.md),
[API SEC](https://www.sec.gov/search-filings/edgar-application-programming-interfaces),
[FAQ SEC](https://www.sec.gov/about/webmaster-frequently-asked-questions).

## Autres essais

- Yahoo quoteSummary / earningsTrend, appel anonyme : HTTP 401.
  Aucun contournement de connexion ou de contrôle d'accès essayé.
- Nasdaq `https://api.nasdaq.com/api/analyst/AAPL/earnings-forecast` répond
  localement sans clé avec des prévisions annuelles et trimestrielles de BPA,
  le nombre d'estimations et l'exercice fiscal. Le champ asOf est null : la date
  de collecte ne doit pas être présentée comme la date de révision du consensus.
  Le test de ces prévisions depuis GitHub est disponible dans
  [le second workflow](https://github.com/madmax91310/shinny-potato/actions/runs/37580853841).
  Résultat confirmé : TimeoutError pour les cinq symboles depuis le runner.
  Le workflow vert signifie que le diagnostic s'est terminé et a conservé
  son rapport ; il ne signifie pas que Nasdaq était accessible.

La recherche trouve donc une source anonyme de ratios datés, mais ne valide pas
encore une chaîne complète, fiable et fraîche pour la publication automatique.
