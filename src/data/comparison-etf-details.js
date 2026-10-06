import { AUTOMATED_ETF, refreshFundDetails } from './automated-etf.js';
// Exact fund holdings, or explicitly identified exposure for a synthetic fund.
// Dates refer to compositions, not to calendar-year performances.
const MANUAL_DETAILS = {
  FR0007056841: {asOf: '2026-08-31', checkedAt: '2026-10-06', basis: 'tracked-index', index: 'Dow Jones Industrial Average', source: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0007056841/FRA/FRA/RETAIL/ETF/20260831', holdings: [['Goldman Sachs',11.47],['Caterpillar',8.88],['Microsoft',5.70]], sectors: [['Finance',27.48],['Technologie',18.34],['Industrie',15.56],['Santé',13.78],['Consommation cyclique',10],['Communication',5.05],['Matériaux',3.83],['Consommation de base',3.73],['Énergie',2.24]], performance: {currency: 'EUR', basis: 'fund', years: {2023:11.66,2024:22.07,2025:0.70}, source: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0007056841/FRA/FRA/RETAIL/ETF/20260831'} },
  "IE00BKM4GZ66": {
    "asOf": "2026-08-31",
    "basis": "fund",
    "source": "https://www.ishares.com/gls-download/literature/fact-sheet/eimi-ishares-core-msci-em-imi-ucits-etf-fund-fact-sheet-en-gb.pdf",
    "holdings": [
      [
        "TSMC",
        13.31
      ],
      [
        "Samsung Electronics",
        6.17
      ],
      [
        "SK Hynix",
        4.68
      ]
    ],
    "sectors": [
      [
        "Technologie",
        39.28
      ],
      [
        "Finance",
        18.66
      ],
      [
        "Consommation cyclique",
        8.19
      ],
      [
        "Industrie",
        7.78
      ],
      [
        "Matériaux",
        6.62
      ],
      [
        "Communication",
        5.68
      ],
      [
        "Santé",
        3.51
      ],
      [
        "Énergie",
        3.11
      ],
      [
        "Consommation de base",
        2.98
      ],
      [
        "Autres",
        2.31
      ],
      [
        "Services publics",
        1.89
      ]
    ],
    "checkedAt": "2026-10-05"
  },
  "FR0013412020": {
    "asOf": "2026-06-30",
    "basis": "tracked-index",
    "index": "MSCI EM ex-Egypt ESG Broad CTB Select",
    "source": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF/20260630",
    "holdings": [
      [
        "TSMC",
        15.06
      ],
      [
        "Samsung Electronics",
        7.96
      ],
      [
        "SK Hynix",
        7.8
      ]
    ],
    "sectors": [
      [
        "Technologie",
        44.64
      ],
      [
        "Finance",
        19.04
      ],
      [
        "Consommation cyclique",
        7.53
      ],
      [
        "Industrie",
        6.81
      ],
      [
        "Communication",
        5.86
      ],
      [
        "Matériaux",
        5.03
      ],
      [
        "Consommation de base",
        3.26
      ],
      [
        "Énergie",
        2.84
      ],
      [
        "Santé",
        2.21
      ],
      [
        "Services publics",
        1.51
      ],
      [
        "Immobilier",
        1.29
      ]
    ],
    "checkedAt": "2026-10-05"
  },
  "IE00BTJRMP35": {
    "basis": "fund",
    "holdings": [
      [
        "TSMC",
        15.62
      ],
      [
        "Samsung Electronics",
        7.73
      ],
      [
        "SK Hynix",
        6.09
      ]
    ],
    "performance": {
      "currency": "USD",
      "basis": "fund",
      "values": [
        null,
        null,
        null,
        9.6,
        7.5,
        33.7
      ],
      "source": "https://etf.dws.com/Download/Past%20Performance/IE00BTJRMP35/FR/FR",
      "checkedAt": "2026-10-05",
      "precision": 1
    },
    "checkedAt": "2026-10-05",
    "asOf": "2026-10-02",
    "source": "https://etf.dws.com/api/pdp/fr-fr/etf/IE00BTJRMP35/holdings",
    "sectors": [
      [
        "Technologie",
        44.23
      ],
      [
        "Finance",
        18.9
      ],
      [
        "Consommation cyclique",
        7.27
      ],
      [
        "Industrie",
        6.18
      ],
      [
        "Communication",
        5.73
      ],
      [
        "Matériaux",
        5.68
      ],
      [
        "Énergie",
        3.36
      ],
      [
        "Santé",
        2.65
      ],
      [
        "Consommation de base",
        2.52
      ],
      [
        "Services publics",
        1.77
      ],
      [
        "Immobilier",
        0.88
      ],
      [
        "Non classé",
        0.83
      ]
    ],
    "sectorMethod": "Somme des poids publiés de tous les titres par secteur DWS ; poids non classés conservés, sans renormalisation."
  }
};

export const COMPARISON_ETF_DETAILS = Object.freeze(Object.fromEntries([...new Set([...Object.keys(MANUAL_DETAILS), ...Object.keys(AUTOMATED_ETF)])].map(isin => [isin, refreshFundDetails(isin, MANUAL_DETAILS[isin])])));
