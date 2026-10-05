// Revue officielle du 03/10/2026. Méthodologie nominale et photographie datée restent distinctes.
export const INDEX_EXPOSURE_ADDITIONS = {
  "acwi-imi": {
  "2026-09-30": {
    "index": "MSCI ACWI IMI",
    "asOf": "2026-09-30",
    "snapshot": "30 septembre 2026",
    "source": {
      "label": "Composition et rendements nets USD · MSCI",
      "url": "https://www.msci.com/documents/10199/255599/msci-acwi-imi-net.pdf",
      "checkedAt": "2026-10-05"
    },
    "provenance": "Fiche officielle MSCI datée du 30/09/2026, consultée le 05/10/2026 ; compositions d’indice distinctes du fonds échantillonné.",
    "constituents": 8036,
    "markets": "23 pays développés et 24 pays émergents, grandes, moyennes et petites capitalisations",
    "countries": [
      [
        "🇺🇸 États-Unis",
        62.99
      ],
      [
        "🇯🇵 Japon",
        5.83
      ],
      [
        "🇹🇼 Taïwan",
        3.5
      ],
      [
        "🇬🇧 Royaume-Uni",
        3.09
      ],
      [
        "🇨🇦 Canada",
        2.99
      ],
      [
        "🌍 Autres",
        21.6
      ]
    ],
    "sectors": [
      [
        "💻 Technologie",
        31.32
      ],
      [
        "🏦 Finance",
        15.94
      ],
      [
        "🏭 Industrie",
        11.19
      ],
      [
        "🏥 Santé",
        8.71
      ],
      [
        "🛍️ Consommation discrétionnaire",
        8.43
      ],
      [
        "📡 Communication",
        7.5
      ],
      [
        "🛒 Consommation de base",
        4.47
      ],
      [
        "🪨 Matériaux",
        4.06
      ],
      [
        "⚡ Énergie",
        4.02
      ],
      [
        "💡 Services publics",
        2.28
      ],
      [
        "🏠 Immobilier",
        2.08
      ]
    ],
    "holdings": [
      [
        "Nvidia",
        4.58
      ],
      [
        "Apple",
        4.26
      ],
      [
        "Microsoft",
        3.15
      ],
      [
        "Amazon",
        2.1
      ],
      [
        "Alphabet A",
        1.76
      ],
      [
        "TSMC",
        1.67
      ],
      [
        "Alphabet C",
        1.39
      ],
      [
        "Meta",
        1.39
      ],
      [
        "Broadcom",
        1.38
      ],
      [
        "Micron",
        1.05
      ]
    ],
    "topWeight": 22.73,
    "descriptionTemplates": {
      "monde-toutes-tailles": "Marchés développés et émergents, grandes, moyennes et petites entreprises ; {{constituents}} titres au 30/09/2026."
    }
  }
},
  "sp500-equal-weight": {
    "methodology": {
      "index": "S&P 500 Equal Weight",
      "asOf": null,
      "snapshot": "Méthodologie contrôlée le 3 octobre 2026",
      "source": {
        "label": "Méthode de pondération · S&P DJI",
        "url": "https://www.spglobal.com/spdji/en/indices/equity/sp-500-equal-weight-index/",
        "checkedAt": "2026-10-03"
      },
      "provenance": "Même univers que le S&P 500 ; poids de 0,2 % par société à chaque rééquilibrage trimestriel. 500 est le périmètre nominal de sociétés, pas un comptage de titres ni une photographie de positions.",
      "constituents": null,
      "targetConstituents": 500,
      "markets": "États-Unis, grandes entreprises",
      "countries": [
        [
          "🇺🇸 États-Unis",
          100
        ]
      ],
      "sectors": [],
      "holdings": [],
      "topWeight": null,
      "descriptionTemplates": {
        "usa-constructions": "Les mêmes entreprises que le S&P 500, avec 0,2 % par société à chaque rééquilibrage trimestriel."
      }
    }
  },
  "russell-2000": {
    "2026-08-31": {
      "index": "Russell 2000",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et rendement total USD · FTSE Russell",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=True&issueName=US2000USD",
        "checkedAt": "2026-10-03"
      },
      "provenance": "Nombre de constituants et secteurs lus dans la fiche FTSE Russell datée du 31/08/2026. Classement des entreprises publié sans leurs poids ; pas de poids reconstruits depuis l’ETF.",
      "constituents": 1953,
      "targetConstituents": 2000,
      "markets": "États-Unis, petites capitalisations",
      "countries": [
        [
          "🇺🇸 États-Unis",
          100
        ]
      ],
      "sectors": [
        [
          "🏥 Santé",
          20.81
        ],
        [
          "🏦 Finance",
          18.45
        ],
        [
          "🏭 Industrie",
          15.63
        ],
        [
          "🛍️ Consommation discrétionnaire",
          11.36
        ],
        [
          "💻 Technologie",
          10.87
        ],
        [
          "⚡ Énergie",
          6.56
        ],
        [
          "🏠 Immobilier",
          5.96
        ],
        [
          "🪨 Matériaux",
          4.04
        ],
        [
          "💡 Services publics",
          3.05
        ],
        [
          "🛒 Consommation de base",
          1.65
        ],
        [
          "📡 Communication",
          1.63
        ]
      ],
      "holdings": [],
      "topWeight": null,
      "descriptionTemplates": {
        "usa-constructions": "Petites entreprises américaines : {{constituents}} titres au 31/08/2026 ; pondération par capitalisation flottante."
      }
    }
  }
};
