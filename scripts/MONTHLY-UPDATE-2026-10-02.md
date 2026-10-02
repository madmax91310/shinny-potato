# Mise à jour mensuelle du 2 octobre 2026

Le dernier mois complet est septembre 2026. Aucun point d’octobre n’est ajouté.

## Séries intégrées

22 actifs : STOXX Europe 600 Net Return, Bitcoin, Ethereum, CAC 40, Nasdaq 100, SOXX, argent (SI=F), LVMH, Apple, Microsoft, Broadcom, Tesla, Nvidia, Amazon, Alphabet classe A (GOOGL), Meta, Nestlé ADR (NSRGY), SAP ADR, Visa, Netflix, Coca-Cola et S&P 500 Total Return.

Les données et leurs méthodes sont partagées par le calculateur, ses exports et les formats historiques de Tweet Midi. Les rendements annuels affichés par Performance depuis s’arrêtent toujours en 2025. Les duels et le générateur de portefeuilles utilisent d’autres séries annuelles.

La capture `source-snapshots/calculator-monthly-2026-10-02.json` conserve les réponses Yahoo mensuelles, les dernières séances quotidiennes extraites, leurs timestamps, fuseaux, URLs et colonnes. Deux granularités du même fournisseur ne constituent pas deux sources indépendantes. `audit:calculator-series` rejoue le contrôle des 301 points : 141 pour Bitcoin, 141 pour le S&P 500 et 19 clôtures nouvelles.

Les mois des cotations européennes sont déterminés dans le fuseau de la place : un timestamp du 30 septembre à 22 h UTC correspond au 1er octobre à Paris et doit être exclu. Les nouveaux points viennent du 30 septembre dans le fuseau de leur marché.

### Changements de convention et effets

Bitcoin : les 140 ouvertures mensuelles précédentes sont remplacées par 141 clôtures mensuelles. Les anciens résultats peuvent donc changer même à période identique. Les ouvertures précédemment vérifiées restent dans la capture du 29 septembre. Toute la série active utilise maintenant `close`, arrondi au centime.

S&P 500 : l’ancienne série composite rebasée est remplacée par 141 niveaux réels de l’indice **S&P 500 Total Return** en dollars, dividendes bruts réinvestis, hors frais. Le nouvel historique concorde avec les dernières séances quotidiennes et les dix rendements annuels 2016–2025 vérifiés. Le DCA peut être réactivé. Les niveaux sont des points d’indice, pas le prix d’une part d’ETF.

Apple, Microsoft, Broadcom et Tesla : nouveau point `adjclose`, conformément à la méthode de leur historique. Les points historiques figés ne sont pas réécrits ; le fournisseur peut réviser ses ajustements de dividendes.

SOXX : nouveau point `close`, ajusté des splits mais hors dividendes, conformément à la série certifiée du 30 septembre.

Argent : la clôture Yahoo du contrat continu `SI=F`, 60,098 USD, est arrondie à 60,10 USD. Elle a été recoupée avec https://www.investing.com/commodities/silver-historical-data?cid=1178343. Les 60,560/60,566 USD figurant dans d’autres résultats concernent une autre échéance ; ils ne remplacent pas la série continue. Les frais de roulement ne sont pas simulés.

Pour les actions et le CAC 40 à historique épars, seul le nouveau point de septembre est certifié le 2 octobre. Cela ne certifie pas rétroactivement les anciens points et ne permet pas de réactiver le DCA. Les blocages existants sont maintenus.

## Séries restant en août

- Or : le fichier officiel Banque mondiale téléchargé le 2 octobre reste marqué « Updated on September 02, 2026 » ; sa dernière observation Gold est `2026M08` à 4 411 USD. La moyenne de septembre est absente. Conserver la moyenne mensuelle, jamais la remplacer par un cours de fin de mois. Source : https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx
- MSCI World : la fiche officielle disponible reste datée du 31 août 2026, USD Gross Returns. Les observations USD Net ou Price de septembre ne sont pas compatibles. Source : https://www.msci.com/documents/10199/255599/msci-world-index.pdf

La borne globale passe à septembre, mais chaque actif conserve sa propre date de fin. Les simulations et comparatifs ne doivent pas prolonger l’or et le MSCI World jusqu’en septembre.

## Validation

Le contrôle des données couvre les clôtures mensuelles/quotidiennes, les dates dans le fuseau de la place, les périodes du catalogue, les rendements annuels S&P 500, les quantités achetées en DCA, le nombre de versements, les valeurs finales et les séries utilisées par l’export vidéo. Le navigateur exerce les textes de septembre, les fins d’août, le DCA S&P 500, les blocages des séries éparses, les PNG, l’historique Bitcoin dans Tweet Midi et la fiche de provenance SOXX.

## STOXX 600 : historique officiel complet

Le tableau quotidien de https://stoxx.com/index/SXXR/?factsheet=true a pu être téléchargé intégralement. Capture calculator-stoxx600-2026-10-02.json : 3 037 séances depuis décembre 2014, 141 dernières séances de chaque mois de janvier 2015 à septembre 2026, ISIN EU0009658210, Net Return EUR. Les anciennes 140 valeurs composites sont conservées dans la capture pour comparaison mais remplacées dans la banque active par les niveaux réels. Pas de raccord arbitraire ni d’interpolation. Les résultats historiques changent et le DCA est réactivé.

Août : 1 662,91 points ; septembre : 1 622,67 points, soit −2,41985 %. Le calcul de raccord 220 591 sur l’ancienne base n’est donc plus utilisé. Les dix rendements annuels 2016–2025 des niveaux quotidiens concordent à 0,02 point près avec le benchmark général STOXX Europe 600 Index-NR EUR publié par Franklin Templeton (distinct de son indice PAB et du fonds). La table annuelle de la page STOXX contient des rendements divergents ; les niveaux quotidiens, concordants avec ce recoupement, sont retenus. 2025 est ainsi +19,80 %, contre +20,66 % dans l’ancienne série composite.

Source du recoupement annuel : https://www.franklintempleton.lu/our-funds/price-and-performance-etfs/products/29820/SINGLCLASS/franklin-stoxx-europe-600-paris-aligned-climate-ucits-etf/IE00BMDPBY65. Septembre est aussi confirmé par Investing. Le calculateur affiche des points et la méthode Net Return EUR. L’audit rejoue l’agrégation, les rendements annuels, les quantités DCA, la vidéo et les consommateurs Tweet Midi. Le format Anniversaire conserve son exclusion des indices Total Return pour éviter une saisie manuelle d’un indice Price incompatible.

Écarts annuels résiduels : tableau quotidien +15,7992 % en 2023 contre +15,81 % chez Franklin, puis +8,7917 % en 2024 contre +8,78 %. Tolérance de recoupement 0,02 point, sans ajustement des niveaux officiels pour forcer une égalité.
