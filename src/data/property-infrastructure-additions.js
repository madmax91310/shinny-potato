// Revue officielle du 05/10/2026 ; confiance élevée. Compositions, règles et performances ont leurs dates propres.
// Données des indices FTSE exacts : ni immobilier général, ni infrastructure 50/50, ni poids des ETF.
export const PROPERTY_INFRA_FACTS = {
  "ftse-epra-nareit-developed-dividend-plus": {
    "2026-08-31": {
      "index": "FTSE EPRA Nareit Developed Dividend+",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition de l’indice · FTSE Russell",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=ENGD",
        "checkedAt": "2026-10-05"
      },
      "provenance": "Fiche officielle FTSE Russell au 2026-08-31, consultée le 05/10/2026 et recoupée avec la page LSEG de la série. Confiance élevée. Poids et comptage de l’indice, jamais du fonds. Autres pays calculé par différence à 100 % des cinq pays affichés.",
      "constituents": 313,
      "markets": "Immobilier coté des pays développés, hors Grèce ; filtre de rendement des dividendes",
      "countries": [
        [
          "🇺🇸 États-Unis",
          66.37
        ],
        [
          "🇯🇵 Japon",
          7.04
        ],
        [
          "🇬🇧 Royaume-Uni",
          4.2
        ],
        [
          "🇦🇺 Australie",
          3.84
        ],
        [
          "🇸🇬 Singapour",
          3.37
        ],
        [
          "🌍 Autres",
          15.18
        ]
      ],
      "sectors": [
        [
          "🛍️ Commerces",
          18.72
        ],
        [
          "🏘️ Diversifié",
          16.81
        ],
        [
          "🏭 Industriel",
          14.62
        ],
        [
          "🏠 Résidentiel",
          12.42
        ],
        [
          "💻 Centres de données",
          12.13
        ],
        [
          "🏥 Santé",
          8.01
        ],
        [
          "📦 Stockage individuel",
          5.52
        ],
        [
          "🏢 Bureaux",
          5.11
        ],
        [
          "🏨 Hôtels et loisirs",
          2.71
        ],
        [
          "🧩 Spécialisé",
          2.67
        ],
        [
          "🏭 Industriel / bureaux",
          1.3
        ]
      ],
      "holdings": [
        [
          "Prologis",
          7.68
        ],
        [
          "Equinix",
          5.97
        ],
        [
          "Simon Property Group",
          3.93
        ],
        [
          "Digital Realty Trust",
          3.89
        ],
        [
          "Realty Income",
          3.31
        ],
        [
          "Public Storage",
          2.99
        ],
        [
          "Vivmark Residential",
          2.87
        ],
        [
          "Ventas",
          2.56
        ],
        [
          "Iron Mountain",
          1.97
        ],
        [
          "Extra Space Storage",
          1.71
        ]
      ],
      "topWeight": 36.89,
      "sectorClassification": "FTSE EPRA Nareit · sous-secteurs immobiliers",
      "descriptionTemplates": {
        "immobilier-infrastructures": "Immobilier coté des marchés développés, hors Grèce, avec un filtre de dividendes ; pondération par capitalisation flottante."
      },
      "methodologySources": [
        {
          "label": "Règles de sélection · FTSE Russell",
          "url": "https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-epra-nareit-dividend-plus-index-ground-rules.pdf",
          "checkedAt": "2026-10-05"
        }
      ],
      "methodologyNote": "Règles v3.1 de mai 2026 : entrée à 3 % et maintien à 1 %. La fiche de composition d’août et la présentation iShares affichent encore 2 %. Cette divergence est signalée ; le seuil des règles ne redéfinit pas rétroactivement la photographie d’août."
    }
  },
  "ftse-global-core-infrastructure": {
    "2026-09-30": {
      "index": "FTSE Global Core Infrastructure",
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "source": {
        "label": "Composition de l’indice · FTSE Russell",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=FGCII",
        "checkedAt": "2026-10-05"
      },
      "provenance": "Fiche officielle FTSE Russell au 2026-09-30, consultée le 05/10/2026 et recoupée avec la page LSEG de la série. Confiance élevée. Poids et comptage de l’indice, jamais du fonds. Autres pays calculé par différence à 100 % des cinq pays affichés.",
      "constituents": 277,
      "markets": "Infrastructures cotées des pays développés et émergents, sélectionnées dans le FTSE Global All Cap",
      "countries": [
        [
          "🇺🇸 États-Unis",
          62.99
        ],
        [
          "🇨🇦 Canada",
          13.02
        ],
        [
          "🇯🇵 Japon",
          4.12
        ],
        [
          "🇬🇧 Royaume-Uni",
          3.86
        ],
        [
          "🇪🇸 Espagne",
          1.98
        ],
        [
          "🌍 Autres",
          14.03
        ]
      ],
      "sectors": [
        [
          "💡 Électricité conventionnelle",
          34.42
        ],
        [
          "🛢️ Oléoducs et gazoducs",
          17.41
        ],
        [
          "🚆 Chemins de fer",
          17.15
        ],
        [
          "💡 Services publics multiples",
          10.47
        ],
        [
          "🚢 Services de transport",
          5.38
        ],
        [
          "🔥 Distribution de gaz",
          5.2
        ],
        [
          "🏠 REIT d’infrastructures",
          4.0
        ],
        [
          "💧 Eau",
          3.15
        ],
        [
          "📡 Services télécoms",
          1.48
        ],
        [
          "📡 Équipements télécoms",
          0.89
        ],
        [
          "🌱 Électricité alternative",
          0.4
        ],
        [
          "🧳 Voyages et tourisme",
          0.05
        ],
        [
          "🏗️ Construction",
          0.0
        ]
      ],
      "holdings": [
        [
          "Union Pacific",
          5.28
        ],
        [
          "NextEra Energy",
          5.17
        ],
        [
          "Enbridge",
          3.39
        ],
        [
          "Southern Company",
          3.12
        ],
        [
          "Duke Energy",
          2.9
        ],
        [
          "CSX",
          2.82
        ],
        [
          "Williams Companies",
          2.71
        ],
        [
          "National Grid",
          2.5
        ],
        [
          "American Tower",
          2.49
        ],
        [
          "Canadian Pacific Kansas City",
          2.48
        ]
      ],
      "topWeight": 32.86,
      "sectorClassification": "ICB · sous-secteurs",
      "descriptionTemplates": {
        "immobilier-infrastructures": "Infrastructures cotées des marchés développés et émergents ; filtre de revenus Core et pondération par capitalisation investissable."
      },
      "methodologySources": [
        {
          "label": "Règles de sélection · FTSE Russell",
          "url": "https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-infrastructure-index-series-ground-rules.pdf",
          "checkedAt": "2026-10-05"
        }
      ]
    }
  }
};

export const PROPERTY_INFRA_RETURNS = {
  "ftse-epra-nareit-developed-dividend-plus": {
    "2025-12-31": {
      "values": [
        [
          2025,
          9.5
        ],
        [
          2024,
          2.2
        ],
        [
          2023,
          10.1
        ],
        [
          2022,
          -23.4
        ],
        [
          2021,
          26.5
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "FTSE EPRA Nareit Developed Dividend+ · USD, dividendes réinvestis (Total Return FTSE), hors frais ETF",
        "date": "Années calendaires 2021–2025"
      },
      "source": {
        "label": "Rendements Total Return USD · FTSE Russell",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=ENGD",
        "checkedAt": "2026-10-05"
      },
      "sourceUrls": [
        "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=ENGD",
        "https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-epra-nareit-dividend-plus-index-ground-rules.pdf"
      ],
      "checkedAt": "2026-10-05",
      "periodStart": "2021-01-01",
      "periodEnd": "2025-12-31",
      "currency": "USD",
      "method": "dividendes réinvestis (Total Return FTSE)",
      "note": "Ligne Year-on-Year Performance – Total Return, USD, de l’indice exact. Les rendements Net Index/Benchmark iShares et ceux de la part sont différents et ne sont pas utilisés. Années postérieures au lancement ; fiche publiée au 2026-08-31, contrôlée le 05/10/2026. Confiance élevée. Aucune série mensuelle déduite de ces observations annuelles."
    }
  },
  "ftse-global-core-infrastructure": {
    "2025-12-31": {
      "values": [
        [
          2025,
          13.7
        ],
        [
          2024,
          9.8
        ],
        [
          2023,
          1.6
        ],
        [
          2022,
          -5.8
        ],
        [
          2021,
          17.8
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "FTSE Global Core Infrastructure · USD, dividendes réinvestis (Total Return FTSE), hors frais ETF",
        "date": "Années calendaires 2021–2025"
      },
      "source": {
        "label": "Rendements Total Return USD · FTSE Russell",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=FGCII",
        "checkedAt": "2026-10-05"
      },
      "sourceUrls": [
        "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=FGCII",
        "https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-infrastructure-index-series-ground-rules.pdf"
      ],
      "checkedAt": "2026-10-05",
      "periodStart": "2021-01-01",
      "periodEnd": "2025-12-31",
      "currency": "USD",
      "method": "dividendes réinvestis (Total Return FTSE)",
      "note": "Ligne Year-on-Year Performance – Total Return, USD, de l’indice exact. Les rendements Net Index/Benchmark iShares et ceux de la part sont différents et ne sont pas utilisés. Années postérieures au lancement ; fiche publiée au 2026-09-30, contrôlée le 05/10/2026. Confiance élevée. Aucune série mensuelle déduite de ces observations annuelles."
    }
  }
};
