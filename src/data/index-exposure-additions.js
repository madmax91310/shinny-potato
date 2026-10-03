// Revue officielle du 03/10/2026. Méthodologie nominale et photographie datée restent distinctes.
export const INDEX_EXPOSURE_ADDITIONS = {
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
