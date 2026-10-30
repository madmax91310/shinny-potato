# Inventaire de l’automatisation des données

Généré le 2026-10-30T00:44:40.128Z.

Inventaire du code et des observations enregistrées. Modes des fichiers déduits uniquement des chemins explicitement publiés par les workflows et de leurs imports. Les champs de catalogue restent à qualification individuelle : aucun workflow, nom de fichier, source accessible ou date de génération ne garantit une actualisation réussie. Les lignes de couverture conservent les dates et états propres des observations. Les modules non référencés au catalogue restent listés séparément.

299 modules de données ; 4577 champs du catalogue ; 4289 lignes de couverture détaillée.

PEA : 257/259 statuts avec preuve ; 2 non qualifiés.

## Familles du catalogue

| Famille | Fiches |
|---|---:|
| reference | 11 |
| series | 745 |
| insurance | 7 |
| actor | 11 |
| scpi | 8 |
| household | 29 |
| instrument | 672 |
| index | 56 |
| broker | 8 |
| lexicon | 44 |

## Modules et mises à jour

« mixed-or-derived » signale un mélange possible de données automatiques et de valeurs éditoriales/manuelles ; ce mode ne certifie aucun champ individuel.

| Module | Mode | Workflows en amont | Consommateurs directs ou indirects |
|---|---|---|---:|
| src/data/allocation-cases.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 5 |
| src/data/allowed-media.js | manual-or-editorial |  | 0 |
| src/data/anniversary-index-history.json | scheduled-output | .github/workflows/update-publication-observations.yml | 49 |
| src/data/anniversary-levels.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-non-bond-expansion.yml | 12 |
| src/data/anniversary-levels.json | scheduled-output | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml | 12 |
| src/data/annual-fx.json | scheduled-output | .github/workflows/collect-etf-pilot.yml | 9 |
| src/data/annual-performance-currency.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 19 |
| src/data/annual-portfolio-funds.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml | 29 |
| src/data/annual-window.js | manual-or-editorial |  | 116 |
| src/data/archive-source-review.js | manual-or-editorial |  | 10 |
| src/data/asset-labels.js | manual-or-editorial |  | 51 |
| src/data/asset-selection.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 38 |
| src/data/aum-observations.js | manual-or-editorial |  | 79 |
| src/data/auto-history-identities.json | scheduled-output | .github/workflows/update-market-monthly.yml | 49 |
| src/data/automated-broker-tariffs.json | scheduled-output | .github/workflows/update-regulatory-data.yml | 8 |
| src/data/automated-characteristics.js | manual-or-editorial |  | 79 |
| src/data/automated-economic.json | scheduled-output | .github/workflows/update-economic-data.yml | 86 |
| src/data/automated-equity-history.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 49 |
| src/data/automated-etf-monthly.json | scheduled-output | .github/workflows/update-market-monthly.yml | 49 |
| src/data/automated-etf.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 79 |
| src/data/automated-etf.json | scheduled-output | .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 81 |
| src/data/automated-index-sheets.js | mixed-or-derived | .github/workflows/collect-etf-pilot.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 4 |
| src/data/automated-indices.js | mixed-or-derived | .github/workflows/collect-etf-pilot.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 4 |
| src/data/automated-indices.json | scheduled-output | .github/workflows/collect-etf-pilot.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 52 |
| src/data/automated-instrument-metadata.json | scheduled-output | .github/workflows/update-instrument-metadata.yml | 80 |
| src/data/automated-insurance.json | scheduled-output | .github/workflows/update-insurance.yml | 9 |
| src/data/automated-monthly.json | scheduled-output | .github/workflows/update-market-monthly.yml | 49 |
| src/data/automated-portfolio-funds.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-instrument-metadata.yml | 29 |
| src/data/automated-practical-sheets.json | scheduled-output | .github/workflows/update-practical-sheets.yml | 4 |
| src/data/automated-presentation-actors.json | scheduled-output | .github/workflows/update-presentation-actors.yml | 8 |
| src/data/automated-regulatory.json | scheduled-output | .github/workflows/update-regulatory-data.yml | 21 |
| src/data/automated-scpi.json | scheduled-output | .github/workflows/update-scpi.yml | 4 |
| src/data/automation-workflows.json | manual-or-editorial |  | 5 |
| src/data/benchmark-changes.js | manual-or-editorial |  | 79 |
| src/data/benchmark-changes.json | manual-or-editorial |  | 79 |
| src/data/bitcoin-yahoo-monthly.json | scheduled-output | .github/workflows/update-bitcoin-monthly.yml | 49 |
| src/data/bond-exposure-cases.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 3 |
| src/data/broker-tariffs.js | mixed-or-derived | .github/workflows/update-regulatory-data.yml | 8 |
| src/data/calculator-history.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 10 |
| src/data/calendar-fx.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 60 |
| src/data/catalog-browser.js | manual-or-editorial |  | 1 |
| src/data/catalog-search.js | manual-or-editorial |  | 3 |
| src/data/catalog.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-practical-sheets.yml, .github/workflows/update-regulatory-data.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-gold-monthly.yml, .github/workflows/update-inflation.yml, .github/workflows/update-insurance.yml, .github/workflows/update-scpi.yml, .github/workflows/update-presentation-actors.yml | 2 |
| src/data/certified-monthly-indices.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml | 49 |
| src/data/commodity-allocation.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 16 |
| src/data/commodity-publication-data.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 16 |
| src/data/company-history-additions.js | manual-or-editorial |  | 49 |
| src/data/company-history.js | manual-or-editorial |  | 49 |
| src/data/comparator-return-evidence.js | manual-or-editorial |  | 24 |
| src/data/comparison-etf-details.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 17 |
| src/data/data-source-conditions.json | manual-or-editorial |  | 0 |
| src/data/dca-complete-holdings.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 8 |
| src/data/dca-equity-exposures.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 1 |
| src/data/dca-holdings-status.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 3 |
| src/data/dca-security-classifications.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 2 |
| src/data/distinct-asset-selections.js | manual-or-editorial |  | 21 |
| src/data/distinct-portfolio-assets.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-instrument-metadata.yml | 29 |
| src/data/diversification-history.js | manual-or-editorial |  | 49 |
| src/data/duel-assets.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-economic-data.yml | 9 |
| src/data/dynamic-data-consumers.json | manual-or-editorial |  | 0 |
| src/data/economic-data.js | mixed-or-derived | .github/workflows/update-economic-data.yml | 86 |
| src/data/editorial-calendar.js | manual-or-editorial |  | 36 |
| src/data/editorial-cases.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/update-qualified-exposures.yml | 3 |
| src/data/envelope-fees.js | mixed-or-derived | .github/workflows/update-insurance.yml | 3 |
| src/data/equity-candidates.json | manual-or-editorial |  | 0 |
| src/data/equity-duel-returns.json | scheduled-output | .github/workflows/update-market-monthly.yml | 29 |
| src/data/equity-history-identities.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 22 |
| src/data/equity-history-links.json | scheduled-output | .github/workflows/update-market-monthly.yml | 94 |
| src/data/etf-cards.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 57 |
| src/data/etf-completeness.json | manual-or-editorial |  | 2 |
| src/data/etf-development.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-economic-data.yml | 2 |
| src/data/etf-history-identities.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 49 |
| src/data/etf-metric-copy.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml | 14 |
| src/data/etf-monthly-history.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-non-bond-expansion.yml | 49 |
| src/data/etf-presentation-copy.js | manual-or-editorial |  | 4 |
| src/data/etf-presentation-reviewed-ids.json | manual-or-editorial |  | 0 |
| src/data/etf-publication-data.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 6 |
| src/data/etf-ter-evidence.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 7 |
| src/data/etf-ter.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 60 |
| src/data/etf-themes.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml | 15 |
| src/data/evidence-freshness.js | manual-or-editorial |  | 75 |
| src/data/evidence.js | manual-or-editorial |  | 10 |
| src/data/exposure-additions.js | manual-or-editorial |  | 78 |
| src/data/exposure-etf-expansion-records.json | scheduled-output | .github/workflows/update-exposure-expansion.yml | 79 |
| src/data/exposure-etf-expansion.js | manual-or-editorial |  | 63 |
| src/data/exposure-observations.js | manual-or-editorial |  | 18 |
| src/data/exposure-sleeves.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 1 |
| src/data/fee-comparison-assets.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 5 |
| src/data/fee-field-evidence.js | manual-or-editorial |  | 7 |
| src/data/financial-history-restrictions.json | manual-or-editorial |  | 39 |
| src/data/financial-lexicon.js | mixed-or-derived | .github/workflows/update-economic-data.yml, .github/workflows/update-regulatory-data.yml | 16 |
| src/data/financial-source-repairs.json | manual-or-editorial |  | 29 |
| src/data/french-characteristics.js | manual-or-editorial |  | 107 |
| src/data/freshness-policy.json | manual-or-editorial |  | 76 |
| src/data/global-equities.json | manual-or-editorial |  | 94 |
| src/data/history-browser.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 9 |
| src/data/history-currency.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 46 |
| src/data/history-parameters.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 27 |
| src/data/history-selection.js | manual-or-editorial |  | 16 |
| src/data/history-statistics.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 2 |
| src/data/history-visual-identities.js | manual-or-editorial |  | 22 |
| src/data/history-window-quality.js | manual-or-editorial |  | 39 |
| src/data/history-window-restrictions.json | manual-or-editorial |  | 39 |
| src/data/holdings-reconciliation.js | manual-or-editorial |  | 11 |
| src/data/household-editorial.js | manual-or-editorial |  | 7 |
| src/data/household-statistics.js | mixed-or-derived | .github/workflows/update-economic-data.yml | 7 |
| src/data/index-company-compositions.js | manual-or-editorial |  | 1 |
| src/data/index-company-compositions.json | manual-or-editorial |  | 1 |
| src/data/index-company-facts.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml | 10 |
| src/data/index-company-identities.json | manual-or-editorial |  | 10 |
| src/data/index-company-observations.json | scheduled-output | .github/workflows/refresh-automated-index-sheets.yml | 10 |
| src/data/index-company-qualified.json | scheduled-output | .github/workflows/refresh-automated-index-sheets.yml | 1 |
| src/data/index-comparison-composition.js | manual-or-editorial |  | 2 |
| src/data/index-comparison-editorial.js | manual-or-editorial |  | 2 |
| src/data/index-comparison-pairs.js | manual-or-editorial |  | 2 |
| src/data/index-comparison-performance.js | mixed-or-derived | .github/workflows/collect-etf-pilot.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 1 |
| src/data/index-comparison-return-additions.js | manual-or-editorial |  | 5 |
| src/data/index-comparisons.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/update-qualified-exposures.yml | 2 |
| src/data/index-composition-review.js | manual-or-editorial |  | 10 |
| src/data/index-concentration-core.js | manual-or-editorial |  | 12 |
| src/data/index-decision-cases.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 5 |
| src/data/index-exposure-additions.js | manual-or-editorial |  | 10 |
| src/data/index-facts.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 10 |
| src/data/index-factsheets.js | mixed-or-derived | .github/workflows/collect-etf-pilot.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 4 |
| src/data/index-history-conventions.js | manual-or-editorial |  | 25 |
| src/data/index-history-identities.js | manual-or-editorial |  | 49 |
| src/data/index-returns.js | mixed-or-derived | .github/workflows/collect-etf-pilot.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 5 |
| src/data/index-source-review.js | manual-or-editorial |  | 10 |
| src/data/inflation-monthly.js | scheduled-output | .github/workflows/update-inflation.yml | 49 |
| src/data/instrument-aum-observations.js | manual-or-editorial |  | 2 |
| src/data/instrument-aum.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 57 |
| src/data/instrument-characteristic-metadata.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml | 79 |
| src/data/instrument-comparator-returns.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 24 |
| src/data/instrument-facts.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 73 |
| src/data/instrument-listings.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml | 73 |
| src/data/instrument-metadata-status.json | scheduled-output | .github/workflows/update-instrument-metadata.yml | 3 |
| src/data/instrument-metadata.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml | 79 |
| src/data/instrument-pea.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml | 63 |
| src/data/instrument-performance-review.js | manual-or-editorial |  | 53 |
| src/data/instrument-reference-evidence.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml | 7 |
| src/data/instrument-returns.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 53 |
| src/data/instruments.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-instrument-metadata.yml | 63 |
| src/data/insurance.js | mixed-or-derived | .github/workflows/update-insurance.yml | 6 |
| src/data/investment-presets.js | manual-or-editorial |  | 52 |
| src/data/investor-profiles.js | manual-or-editorial |  | 4 |
| src/data/investor-roster.js | manual-or-editorial |  | 39 |
| src/data/lifestrategy.js | mixed-or-derived | .github/workflows/update-lifestrategy.yml | 82 |
| src/data/lifestrategy.json | scheduled-output | .github/workflows/update-lifestrategy.yml | 82 |
| src/data/maintenance-links.js | manual-or-editorial |  | 2 |
| src/data/market-calendar-performance.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 53 |
| src/data/market-history-review.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 4 |
| src/data/market-history.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 49 |
| src/data/market-story-selection.js | manual-or-editorial |  | 4 |
| src/data/monthly-automation.js | mixed-or-derived | .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-market-monthly.yml | 49 |
| src/data/monthly-duel-returns.json | scheduled-output | .github/workflows/update-market-monthly.yml | 53 |
| src/data/monthly-fx.json | scheduled-output | .github/workflows/update-market-monthly.yml | 77 |
| src/data/monthly-history-additions.js | manual-or-editorial |  | 49 |
| src/data/msci-history.js | manual-or-editorial |  | 49 |
| src/data/native-index-composition-contracts.json | manual-or-editorial |  | 11 |
| src/data/native-index-composition.js | manual-or-editorial |  | 11 |
| src/data/new-index-returns.js | manual-or-editorial |  | 5 |
| src/data/non-bond-company-histories.json | manual-or-editorial |  | 49 |
| src/data/non-bond-etf-records.json | scheduled-output | .github/workflows/update-non-bond-expansion.yml | 82 |
| src/data/non-bond-expansion.js | mixed-or-derived | .github/workflows/update-non-bond-expansion.yml | 76 |
| src/data/non-bond-levels.json | scheduled-output | .github/workflows/update-non-bond-expansion.yml | 12 |
| src/data/non-bond-monthly-records.json | scheduled-output | .github/workflows/update-non-bond-expansion.yml | 49 |
| src/data/non-bond-qualified-records.json | scheduled-output | .github/workflows/update-non-bond-expansion.yml | 82 |
| src/data/official-performance-currencies.json | scheduled-output | .github/workflows/collect-etf-pilot.yml | 23 |
| src/data/pea-group-status.js | manual-or-editorial |  | 2 |
| src/data/pea-sector-completion.js | manual-or-editorial |  | 73 |
| src/data/pel-rates.js | mixed-or-derived | .github/workflows/update-regulatory-data.yml | 2 |
| src/data/performance-links.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 10 |
| src/data/performance-links.json | scheduled-output | .github/workflows/update-market-monthly.yml | 10 |
| src/data/portfolio-admissions.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 31 |
| src/data/portfolio-asset-loader.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-economic-data.yml | 1 |
| src/data/portfolio-assets.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-economic-data.yml | 29 |
| src/data/portfolio-currencies.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml | 8 |
| src/data/portfolio-equities.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 29 |
| src/data/portfolio-exposure-data.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 2 |
| src/data/portfolio-return-evidence.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-market-monthly.yml | 17 |
| src/data/practical-sheet-topics.js | manual-or-editorial |  | 5 |
| src/data/practical-source-data.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 2 |
| src/data/preferred-instrument-tickers.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml | 38 |
| src/data/presentation-actors.js | mixed-or-derived | .github/workflows/update-presentation-actors.yml | 8 |
| src/data/presentation-etf-additions.js | manual-or-editorial |  | 75 |
| src/data/presentation-etf-expansion.js | manual-or-editorial |  | 57 |
| src/data/property-infrastructure-additions.js | manual-or-editorial |  | 10 |
| src/data/purchasing-power-observations.json | scheduled-output | .github/workflows/update-publication-observations.yml | 14 |
| src/data/purchasing-power.js | mixed-or-derived | .github/workflows/update-publication-observations.yml | 14 |
| src/data/qualified-annual-calendars.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 44 |
| src/data/qualified-etf-comparisons.js | manual-or-editorial |  | 17 |
| src/data/qualified-exposure-etfs.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 82 |
| src/data/qualified-exposure-metrics.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml | 16 |
| src/data/qualified-exposure-sheets.js | mixed-or-derived | .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml | 82 |
| src/data/qualified-listing-records.json | scheduled-output | .github/workflows/update-market-monthly.yml, .github/workflows/update-qualified-exposures.yml | 73 |
| src/data/qualified-listings.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-qualified-exposures.yml | 73 |
| src/data/ranking-annual.json | scheduled-output | .github/workflows/update-market-monthly.yml | 7 |
| src/data/ranking-ftse.json | scheduled-output | .github/workflows/update-market-monthly.yml | 7 |
| src/data/ranking-histories.json | scheduled-output | .github/workflows/update-market-monthly.yml | 49 |
| src/data/ranking-index-annual.json | scheduled-output | .github/workflows/update-market-monthly.yml | 10 |
| src/data/regulatory-data.js | mixed-or-derived | .github/workflows/update-regulatory-data.yml | 21 |
| src/data/resource-selections.js | manual-or-editorial |  | 28 |
| src/data/retired-automations.json | manual-or-editorial |  | 6 |
| src/data/reusable-data-contracts.js | manual-or-editorial |  | 5 |
| src/data/review-catalog.js | mixed-or-derived | .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-practical-sheets.yml, .github/workflows/update-regulatory-data.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-gold-monthly.yml, .github/workflows/update-inflation.yml, .github/workflows/update-insurance.yml, .github/workflows/update-scpi.yml, .github/workflows/update-presentation-actors.yml | 2 |
| src/data/review-projection.js | manual-or-editorial |  | 2 |
| src/data/reviewed-broker-profiles.json | manual-or-editorial |  | 8 |
| src/data/round3-fund-sheets.js | mixed-or-derived | .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 75 |
| src/data/routing-presentation-facts.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 73 |
| src/data/routing-presentations.js | manual-or-editorial |  | 73 |
| src/data/scpi.js | mixed-or-derived | .github/workflows/update-scpi.yml | 4 |
| src/data/search-text.js | manual-or-editorial |  | 71 |
| src/data/security-identifier-observations.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 1 |
| src/data/shared-index-history.js | mixed-or-derived | .github/workflows/update-publication-observations.yml | 49 |
| src/data/shared-listing-identities.json | scheduled-output | .github/workflows/update-market-monthly.yml | 2 |
| src/data/shared-qualified-histories.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 49 |
| src/data/simulation-links.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 10 |
| src/data/simulation-links.json | scheduled-output | .github/workflows/update-market-monthly.yml | 10 |
| src/data/simulation-proxies.js | manual-or-editorial |  | 53 |
| src/data/supporting-evidence.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 2 |
| src/data/tool-links.js | mixed-or-derived | .github/workflows/update-market-monthly.yml | 4 |
| src/data/tool-links.json | scheduled-output | .github/workflows/update-market-monthly.yml | 4 |
| src/data/vanguard-equity-underliers.json | scheduled-output | .github/workflows/update-qualified-exposures.yml | 63 |
| src/data/verified-returns.js | manual-or-editorial |  | 53 |
| src/data/world-factor-additions.js | manual-or-editorial |  | 10 |
| src/data/worldbank-gold-monthly.json | scheduled-output | .github/workflows/update-gold-monthly.yml | 49 |
| src/pages/broker-comparator/data.js | mixed-or-derived | .github/workflows/update-regulatory-data.yml | 4 |
| src/pages/dca-profiles/catalog.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 15 |
| src/pages/dca-profiles/data.js | mixed-or-derived | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 15 |
| src/pages/dca-profiles/engine.js | mixed-or-derived | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 14 |
| src/pages/dca-profiles/exposures-extra-0.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 15 |
| src/pages/dca-profiles/exposures-extra-1.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 15 |
| src/pages/dca-profiles/exposures-extra-2.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 15 |
| src/pages/dca-profiles/exposures.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 15 |
| src/pages/dca-profiles/holdings-0.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-1.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-10.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-11.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-12.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-13.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-14.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-15.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-16.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-17.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-18.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-19.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-2.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-20.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-21.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-22.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-23.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-24.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-25.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-26.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-27.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-28.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-29.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-3.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-30.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-31.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-4.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-5.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-6.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-7.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-8.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-9.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings-manifest.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 8 |
| src/pages/dca-profiles/holdings.json | scheduled-output | .github/workflows/update-exposure-expansion.yml, .github/workflows/update-qualified-exposures.yml | 1 |
| src/pages/etf-sheets/data.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/update-market-monthly.yml | 1 |
| src/pages/factsheet-tweets/companyLogoAliases.json | manual-or-editorial |  | 0 |
| src/pages/factsheet-tweets/companyLogoRegistry.json | manual-or-editorial |  | 3 |
| src/pages/factsheet-tweets/countryFlags.json | manual-or-editorial |  | 3 |
| src/pages/factsheet-tweets/data.js | mixed-or-derived | .github/workflows/collect-etf-pilot.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 2 |
| src/pages/fee-impact/data.js | manual-or-editorial |  | 4 |
| src/pages/hey-grok/data.js | manual-or-editorial |  | 8 |
| src/pages/investment-calculator/data.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 1 |
| src/pages/investor-portfolio/data.js | manual-or-editorial |  | 4 |
| src/pages/lexique-financier/data.js | mixed-or-derived | .github/workflows/update-economic-data.yml, .github/workflows/update-regulatory-data.yml | 1 |
| src/pages/market-facts/additions-20261026.json | manual-or-editorial |  | 2 |
| src/pages/market-facts/data.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml | 2 |
| src/pages/market-facts/reviewed-legacy.json | manual-or-editorial |  | 2 |
| src/pages/market-facts/stories.json | manual-or-editorial |  | 2 |
| src/pages/performance-rankings/data.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/update-publication-observations.yml, .github/workflows/update-inflation.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-economic-data.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-gold-monthly.yml, .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml | 7 |
| src/pages/performance-rankings/engine.js | manual-or-editorial |  | 13 |
| src/pages/portfolio-duels/data.js | manual-or-editorial |  | 2 |
| src/pages/portfolio-generator/data.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-economic-data.yml | 1 |
| src/pages/portfolio-generator/engine.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml, .github/workflows/update-economic-data.yml | 6 |
| src/pages/portfolio-generator/theses.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 10 |
| src/pages/practical-sheets/data.js | manual-or-editorial |  | 3 |
| src/pages/purchasing-power/data.js | mixed-or-derived | .github/workflows/update-publication-observations.yml | 1 |
| src/pages/ranking-ideas/data.js | manual-or-editorial |  | 3 |
| src/pages/ranking-ideas/public-ideas.json | manual-or-editorial |  | 2 |
| src/pages/ranking-ideas/ranking-ideas.json | manual-or-editorial |  | 3 |
| src/pages/tweet-bank/data.js | mixed-or-derived | .github/workflows/update-instrument-metadata.yml, .github/workflows/update-exposure-expansion.yml, .github/workflows/update-non-bond-expansion.yml, .github/workflows/update-lifestrategy.yml, .github/workflows/collect-etf-pilot.yml, .github/workflows/update-qualified-exposures.yml, .github/workflows/refresh-automated-index-sheets.yml, .github/workflows/update-bitcoin-monthly.yml, .github/workflows/update-market-monthly.yml | 3 |
| src/pages/tweet-bank/market-stories.json | manual-or-editorial |  | 5 |
| src/pages/tweet-midi/data/dilemmes-data.json | manual-or-editorial |  | 5 |
| src/pages/tweet-midi/engine.js | mixed-or-derived | .github/workflows/update-market-monthly.yml, .github/workflows/collect-etf-pilot.yml | 19 |
| src/pages/tweet-midi/officialAnniversaryLogos.json | manual-or-editorial |  | 17 |
| src/pages/wealth-simulator/data.js | mixed-or-derived | .github/workflows/update-economic-data.yml, .github/workflows/update-regulatory-data.yml | 2 |

## Qualification et raccordements

117 raccordements demandent une action. Les états bruts de couverture restent conservés : une composition actions hors périmètre n’est pas une nouvelle donnée collectée.

| Nature des champs | Nombre |
|---|---:|
| reference | 688 |
| live | 2591 |
| unavailable | 14 |
| archive | 169 |
| history | 1059 |
| simulation | 12 |
| editorial | 44 |

| État de raccordement | Nombre |
|---|---:|
| current | 4026 |
| not-applicable | 102 |
| tracked-index-needed | 31 |
| outside-equity-scope | 43 |
| waiting-first-year | 13 |
| check-overdue | 23 |
| collection-error | 5 |
| not-published | 18 |
| source-conflict | 1 |
| unqualified | 14 |
| manual | 1 |
| connector-needed | 24 |
| waiting-publication | 3 |
| archived | 3 |

Le CSV `data/data-connections-backlog.csv` contient chaque raccordement restant avec source, tentative, dernier succès, consommateurs et action. Les champs financiers sans provenance, les modules non qualifiés et les archives restent visibles séparément dans le JSON.

## Statuts PEA restant à qualifier

| ISIN | État | Action |
|---|---|---|
| IE0003R87OG3 | unqualified | Qualifier une déclaration PEA explicite liée à cet ISIN ; absence et tiret restent inconnus. |
| IE00B0M62S72 | source-conflict | Obtenir une clarification explicite de l’émetteur ou un accord des sources contradictoires. |

## Exploitation

Le JSON public `data/data-automation-inventory.json` fournit les champs du catalogue, leurs sources, dates, consommateurs, valeurs numériques présentes (chemins uniquement), workflows et crons UTC, ainsi que la couverture détaillée et les diagnostics PEA. Il est régénéré à chaque build. Les derniers résultats réseau restent dans le suivi des automatisations ; cet inventaire ne prétend pas avoir relu chaque fournisseur.

Priorités : 1. statuts PEA inconnus et contradiction ; 2. champs vivants sans source/date ou sans collecteur ; 3. champs absents, en retard ou conservés après panne ; 4. modules hors catalogue et données éditoriales à séparer des chiffres. Les champs non applicables ou en attente de publication gardent leur qualification.
