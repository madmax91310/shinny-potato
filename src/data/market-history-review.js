import GOLD_MONTHLY from './worldbank-gold-monthly.json' with { type: 'json' };
import { MONTHLY_HISTORY_ADDITIONS_REVIEW } from './monthly-history-additions.js';
import { MSCI_HISTORY_REVIEW } from './msci-history.js';
import { COMPANY_HISTORY_REVIEW } from './company-history.js';
// Contrôle du 02/10/2026. Aucun prix dupliqué ici ; captures rejouées par audit:calculator-series.
export const MARKET_HISTORY_REVIEW = {
  ...MSCI_HISTORY_REVIEW,
  ...COMPANY_HISTORY_REVIEW,
  "history:msciWorld": {
    "sourceUrls": [
        "https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=GRTR&start_date=20141231&end_date=20260930&data_frequency=END_OF_MONTH&index_codes=990100",
        "https://www.msci.com/documents/10199/255599/msci-world-index.pdf",
        "https://www.investing.com/indices/msci-world-gross-usd-historical-data"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodStart": "2015-01",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "MSCI World 990100 GRTR USD, clôture de la dernière séance de chaque mois, niveaux réels en points",
    "note": "141 niveaux mensuels officiels homogènes. Capture calculator-msci-world-2026-10-02.json ; ancienne série composite remplacée intégralement. Dix rendements annuels et août recoupés avec la fiche officielle MSCI ; clôture de septembre confirmée par Investing. Résultats historiques modifiés, DCA réactivé."
},
  "history:stoxx600": {
    "sourceUrls": [
        "https://stoxx.com/index/SXXR/?factsheet=true",
        "https://www.investing.com/indices/stoxx-europe-600-eur-nr-historical-data"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodStart": "2015-01",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "Net Return EUR, clôture de la dernière séance de chaque mois, niveaux réels en points",
    "note": "141 clôtures mensuelles issues du tableau quotidien officiel STOXX. Capture calculator-stoxx600-2026-10-02.json ; ancienne série composite remplacée intégralement, résultats historiques modifiés. Septembre recoupé avec Investing."
},
  "history:bitcoin": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD?period1=1420070400&period2=1790812800&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD?period1=1420070400&period2=1790812800&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; série entière remplacée et vérifiée",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants.  Anciennes ouvertures remplacées par des clôtures sur toute la période ; résultats modifiés.",
    "periodStart": "2015-01"
  },
  "history:ethereum": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/ETH-USD?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/ETH-USD?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:cac40": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/%5EFCHI?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/%5EFCHI?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:nasdaq100": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/%5ENDX?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/%5ENDX?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:soxx": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/SOXX?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/SOXX?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:silver": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/SI%3DF?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/SI%3DF?period1=1788220800&period2=1790899200&interval=1d",
      "https://www.investing.com/commodities/silver-historical-data?cid=1178343"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. Contrat continu Yahoo SI=F conservé. 60,098 USD au 30/09 recoupé avec le contrat Investing.com cid=1178343 ; 60,560/60,566 concernent une autre échéance. Arrondi au centime comme l’historique."
  },
  "history:lvmh": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/MC.PA?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/MC.PA?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:apple": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/AAPL?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/AAPL?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "adjclose mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:microsoft": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/MSFT?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/MSFT?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "adjclose mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:broadcom": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/AVGO?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/AVGO?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "adjclose mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:tesla": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/TSLA?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/TSLA?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "adjclose mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:nvidia": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/NVDA?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/NVDA?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:amazon": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/AMZN?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/AMZN?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:google": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/GOOGL?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/GOOGL?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:meta": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/META?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/META?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:nestle": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/NSRGY?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/NSRGY?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:sap": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/SAP?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/SAP?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:visa": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/V?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/V?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:netflix": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/NFLX?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/NFLX?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:cocacola": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/KO?period1=1788220800&period2=1790899200&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/KO?period1=1788220800&period2=1790899200&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; seul le nouveau point de septembre est contrôlé le 02/10/2026",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants. "
  },
  "history:sp500": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/%5ESP500TR?period1=1420070400&period2=1790812800&interval=1mo",
      "https://query2.finance.yahoo.com/v8/finance/chart/%5ESP500TR?period1=1420070400&period2=1790812800&interval=1d"
    ],
    "asOf": null,
    "checkedAt": "2026-10-02",
    "periodEnd": "2026-09",
    "dateStatus": "month-only",
    "sourceStatus": "documented",
    "method": "close mensuel Yahoo ; dernières séances quotidiennes concordantes ; série entière remplacée et vérifiée",
    "note": "Capture calculator-monthly-2026-10-02.json. Recoupement de deux granularités du même fournisseur, pas de deux fournisseurs indépendants.  S&P 500 Total Return : niveaux réels en points, dividendes bruts réinvestis, hors frais. Ancienne série composite remplacée.",
    "periodStart": "2015-01"
  },
  ...MONTHLY_HISTORY_ADDITIONS_REVIEW,
  'history:or': {
    sourceUrls: [GOLD_MONTHLY.url, GOLD_MONTHLY.catalogUrl, GOLD_MONTHLY.licenseUrl],
    asOf: null, checkedAt: GOLD_MONTHLY.checkedAt,
    periodStart: GOLD_MONTHLY.points[0][0], periodEnd: GOLD_MONTHLY.points.at(-1)[0],
    dateStatus: 'month-only', sourceStatus: 'documented',
    method: 'Banque mondiale, Pink Sheet : moyenne mensuelle des cours spot USD par once troy, pas une clôture',
    note: `Classeur du ${GOLD_MONTHLY.workbookUpdatedAt}, SHA-256 ${GOLD_MONTHLY.workbookSha256}. Série entière validée automatiquement. ${GOLD_MONTHLY.seriesDescription}. ${GOLD_MONTHLY.attribution}.`,
  },
};
