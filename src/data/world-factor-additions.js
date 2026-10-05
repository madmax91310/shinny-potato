// Revue officielle du 05/10/2026 ; confiance élevée. Sources et dates propres à chaque champ.
// Minimum Volatility : composition issue de la fiche GROSS, performances exclusivement NETR USD.
export const WORLD_FACTOR_FACTS = {
  "msci-world-momentum": {
    "2026-09-30": {
      "index": "MSCI World Momentum",
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "source": {
        "label": "Composition de l’indice · MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-momentum-index-usd-net.pdf",
        "checkedAt": "2026-10-05"
      },
      "provenance": "Fiche officielle MSCI au 30/09/2026, contrôlée le 05/10/2026 et recoupée avec la page officielle de l’indice. Confiance élevée. Les pondérations sont celles de l’indice, pas du fonds.",
      "constituents": 349,
      "markets": "Sélection de grandes et moyennes entreprises des 23 pays développés du World",
      "countries": [
        [
          "🇺🇸 États-Unis",
          61.17
        ],
        [
          "🇯🇵 Japon",
          11.19
        ],
        [
          "🇨🇦 Canada",
          6.84
        ],
        [
          "🇬🇧 Royaume-Uni",
          3.79
        ],
        [
          "🇳🇱 Pays-Bas",
          3.49
        ],
        [
          "🌍 Autres",
          13.51
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          40.18
        ],
        [
          "🏦 Finance",
          15.77
        ],
        [
          "🏭 Industrie",
          11.13
        ],
        [
          "⚡ Énergie",
          10.18
        ],
        [
          "🏥 Santé",
          8.08
        ],
        [
          "📡 Communication",
          5.16
        ],
        [
          "🪨 Matériaux",
          2.9
        ],
        [
          "🛍️ Consommation discrétionnaire",
          2.15
        ],
        [
          "🛒 Consommation de base",
          1.72
        ],
        [
          "💡 Services publics",
          1.62
        ],
        [
          "🏠 Immobilier",
          1.12
        ]
      ],
      "holdings": [
        [
          "Micron Technology",
          5.55
        ],
        [
          "AMD",
          4.62
        ],
        [
          "Intel",
          3.09
        ],
        [
          "ASML",
          2.7
        ],
        [
          "Alphabet A",
          2.7
        ],
        [
          "Johnson & Johnson",
          2.41
        ],
        [
          "Exxon Mobil",
          2.28
        ],
        [
          "Alphabet C",
          2.14
        ],
        [
          "Lam Research",
          2.02
        ],
        [
          "Applied Materials",
          2.0
        ]
      ],
      "topWeight": 29.51,
      "sectorClassification": "GICS"
    }
  },
  "msci-world-minimum-volatility-usd": {
    "2026-09-30": {
      "index": "MSCI World Minimum Volatility (USD)",
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "source": {
        "label": "Composition de l’indice · MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-minimum-volatility-index.pdf",
        "checkedAt": "2026-10-05"
      },
      "provenance": "Fiche officielle MSCI au 30/09/2026, contrôlée le 05/10/2026 et recoupée avec la page officielle de l’indice. Confiance élevée. Les pondérations sont celles de l’indice, pas du fonds.",
      "constituents": 294,
      "markets": "Sélection de grandes et moyennes entreprises des 23 pays développés du World",
      "countries": [
        [
          "🇺🇸 États-Unis",
          67.1
        ],
        [
          "🇯🇵 Japon",
          11.31
        ],
        [
          "🇨🇦 Canada",
          3.18
        ],
        [
          "🇨🇭 Suisse",
          2.81
        ],
        [
          "🇫🇷 France",
          2.4
        ],
        [
          "🌍 Autres",
          13.2
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          25.68
        ],
        [
          "🏥 Santé",
          14.41
        ],
        [
          "🏦 Finance",
          13.8
        ],
        [
          "📡 Communication",
          9.93
        ],
        [
          "🛒 Consommation de base",
          9.73
        ],
        [
          "🏭 Industrie",
          7.42
        ],
        [
          "💡 Services publics",
          7.14
        ],
        [
          "🛍️ Consommation discrétionnaire",
          5.29
        ],
        [
          "⚡ Énergie",
          4.93
        ],
        [
          "🏠 Immobilier",
          1.2
        ],
        [
          "🪨 Matériaux",
          0.47
        ]
      ],
      "holdings": [
        [
          "Johnson & Johnson",
          1.51
        ],
        [
          "Exxon Mobil",
          1.49
        ],
        [
          "Microsoft",
          1.44
        ],
        [
          "Cisco",
          1.37
        ],
        [
          "Nvidia",
          1.37
        ],
        [
          "Duke Energy",
          1.32
        ],
        [
          "Motorola Solutions",
          1.3
        ],
        [
          "Berkshire Hathaway B",
          1.24
        ],
        [
          "Southern Company",
          1.23
        ],
        [
          "AT&T",
          1.2
        ]
      ],
      "topWeight": 13.47,
      "sectorClassification": "GICS"
    }
  }
};

WORLD_FACTOR_FACTS['msci-world-momentum']['2026-09-30'].methodologySources = [
 { label: 'Règles de sélection · MSCI', url: 'https://www.msci.com/indexes/documents/methodology/2_MSCI_Momentum_Indexes_Methodology_20250417.pdf', checkedAt: '2026-10-05' },
 { label: 'Rééquilibrage trimestriel depuis août 2025 · MSCI', url: 'https://app2.msci.com/webapp/index_ann/DocGet?pub_key=kiUSObVqj%2Fs%3D', checkedAt: '2026-10-05' },
];

export const WORLD_FACTOR_RETURNS = {
  "msci-world-momentum": {
    "2025-12-31": {
      "values": [
        [
          2025,
          21.33
        ],
        [
          2024,
          30.15
        ],
        [
          2023,
          11.75
        ],
        [
          2022,
          -17.79
        ],
        [
          2021,
          14.64
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World Momentum · rendement net USD, dividendes nets réinvestis, hors frais ETF",
        "date": "Années calendaires 2021–2025"
      },
      "source": {
        "label": "Rendements nets USD · MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-momentum-index-usd-net.pdf",
        "checkedAt": "2026-10-05"
      },
      "sourceUrls": [
        "https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=NETR&start_date=20200101&end_date=20251231&data_frequency=END_OF_MONTH&index_codes=703755",
        "https://www.msci.com/documents/10199/255599/msci-world-momentum-index-usd-net.pdf"
      ],
      "checkedAt": "2026-10-05",
      "periodStart": "2021-01-01",
      "periodEnd": "2025-12-31",
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": "Années après le lancement de l’indice ; rendements d’indice, distincts de ceux de la part ETF. Confiance élevée. Tableau annualisé de la fiche MSCI NET USD, recoupé avec les niveaux officiels NETR."
    }
  },
  "msci-world-minimum-volatility-usd": {
    "2025-12-31": {
      "values": [
        [
          2025,
          10.54
        ],
        [
          2024,
          10.87
        ],
        [
          2023,
          7.42
        ],
        [
          2022,
          -9.79
        ],
        [
          2021,
          14.26
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World Minimum Volatility (USD) · rendement net USD, dividendes nets réinvestis, hors frais ETF",
        "date": "Années calendaires 2021–2025"
      },
      "source": {
        "label": "Niveaux NETR USD · MSCI, recoupés avec le benchmark iShares",
        "url": "https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=NETR&start_date=20200101&end_date=20251231&data_frequency=END_OF_MONTH&index_codes=129896",
        "checkedAt": "2026-10-05"
      },
      "sourceUrls": [
        "https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=NETR&start_date=20200101&end_date=20251231&data_frequency=END_OF_MONTH&index_codes=129896",
        "https://www.ishares.com/uk/individual/en/literature/fact-sheet/mvol-ishares-edge-msci-world-minimum-volatility-ucits-etf-fund-fact-sheet-en-gb.pdf"
      ],
      "checkedAt": "2026-10-05",
      "periodStart": "2021-01-01",
      "periodEnd": "2025-12-31",
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": "Années après le lancement de l’indice ; rendements d’indice, distincts de ceux de la part ETF. Confiance élevée. Calculs sur les dernières clôtures de décembre NETR, recoupés avec la ligne Benchmark de la fiche iShares. La fiche de composition MSCI est GROSS : ses rendements ne sont pas utilisés."
    }
  }
};
