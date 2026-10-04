// Revue du 04/10/2026 : compositions des indices, distinctes des portefeuilles ETF.
export const INDEX_COMPOSITION_REVIEW = {
  "msci-em-ex-china": {
    "2026-09-30": {
      "index": "MSCI EM ex-China",
      "descriptionTemplates": {
        "emergents-cto": "{{constituents}} valeurs. Le MSCI EM, mais sans la Chine — pour qui veut réduire son risque chinois."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 602,
      "countries": [
        [
          "🇹🇼 Taïwan",
          36.09
        ],
        [
          "🇰🇷 Corée du Sud",
          26.68
        ],
        [
          "🌍 Autres",
          15.21
        ],
        [
          "🇮🇳 Inde",
          13.28
        ],
        [
          "🇧🇷 Brésil",
          5.1
        ],
        [
          "🇿🇦 Afrique du Sud",
          3.65
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          51.76
        ],
        [
          "🏦 Finance",
          18.95
        ],
        [
          "🏭 Industrie",
          6.58
        ],
        [
          "🪨 Matériaux",
          5.84
        ],
        [
          "🛍️ Consommation cyclique",
          3.64
        ],
        [
          "⚡ Énergie",
          3.35
        ],
        [
          "📡 Communication",
          2.87
        ],
        [
          "🛒 Consommation de base",
          2.53
        ],
        [
          "💡 Services publics",
          1.86
        ],
        [
          "🏥 Santé",
          1.81
        ],
        [
          "🏠 Immobilier",
          0.81
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI EM ex-China",
      "holdings": [
        [
          "TAIWAN SEMICONDUCTOR MFG",
          19.49
        ],
        [
          "SAMSUNG ELECTRONICS CO",
          9.42
        ],
        [
          "SK HYNIX",
          7.36
        ],
        [
          "MEDIATEK INC",
          2.27
        ],
        [
          "SAMSUNG ELECTRONICS PREF",
          1.17
        ],
        [
          "DELTA ELECTRONICS",
          1.17
        ],
        [
          "HON HAI PRECISION IND CO",
          0.98
        ],
        [
          "HDFC BANK",
          0.86
        ],
        [
          "SK SQUARE CO",
          0.79
        ],
        [
          "ASE TECHNOLOGY HOLDING",
          0.75
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/713021/msci-em-emerging-markets-ex-china-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "acwi": {
    "2026-09-30": {
      "index": "MSCI ACWI",
      "descriptionTemplates": {
        "monde": "Le MSCI World + les marchés émergents (Chine, Inde, Brésil…), {{constituents}} valeurs au 30/09/2026."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 2414,
      "countries": [
        [
          "🇺🇸 États-Unis",
          64.21
        ],
        [
          "🌍 Autres",
          21.22
        ],
        [
          "🇯🇵 Japon",
          5.2
        ],
        [
          "🇹🇼 Taïwan",
          3.46
        ],
        [
          "🇬🇧 Royaume-Uni",
          3.0
        ],
        [
          "🇨🇦 Canada",
          2.9
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          33.21
        ],
        [
          "🏦 Finance",
          16.17
        ],
        [
          "🏭 Industrie",
          10.27
        ],
        [
          "🏥 Santé",
          8.42
        ],
        [
          "🛍️ Consommation cyclique",
          8.24
        ],
        [
          "📡 Communication",
          8.01
        ],
        [
          "🛒 Consommation de base",
          4.51
        ],
        [
          "⚡ Énergie",
          3.96
        ],
        [
          "🪨 Matériaux",
          3.51
        ],
        [
          "💡 Services publics",
          2.25
        ],
        [
          "🏠 Immobilier",
          1.45
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "23 pays développés et 24 marchés émergents",
      "holdings": [
        [
          "NVIDIA",
          5.11
        ],
        [
          "APPLE",
          4.76
        ],
        [
          "MICROSOFT CORP",
          3.52
        ],
        [
          "AMAZON.COM",
          2.35
        ],
        [
          "ALPHABET A",
          1.97
        ],
        [
          "TAIWAN SEMICONDUCTOR MFG",
          1.87
        ],
        [
          "ALPHABET C",
          1.55
        ],
        [
          "META PLATFORMS A",
          1.55
        ],
        [
          "BROADCOM",
          1.55
        ],
        [
          "MICRON TECHNOLOGY",
          1.17
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/892400/msci-acwi-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-usa": {
    "2026-09-30": {
      "index": "MSCI USA",
      "descriptionTemplates": {
        "usa": "Grandes ET moyennes capitalisations US, {{constituents}} valeurs."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 513,
      "countries": [
        [
          "🇺🇸 États-Unis",
          100
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          39.5
        ],
        [
          "🏦 Finance",
          11.2
        ],
        [
          "📡 Communication",
          10.07
        ],
        [
          "🏥 Santé",
          9.34
        ],
        [
          "🛍️ Consommation cyclique",
          8.7
        ],
        [
          "🏭 Industrie",
          8.25
        ],
        [
          "🛒 Consommation de base",
          4.29
        ],
        [
          "⚡ Énergie",
          3.48
        ],
        [
          "💡 Services publics",
          1.84
        ],
        [
          "🪨 Matériaux",
          1.73
        ],
        [
          "🏠 Immobilier",
          1.6
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI USA",
      "holdings": [
        [
          "NVIDIA",
          7.96
        ],
        [
          "APPLE",
          7.42
        ],
        [
          "MICROSOFT CORP",
          5.49
        ],
        [
          "AMAZON.COM",
          3.66
        ],
        [
          "ALPHABET A",
          3.06
        ],
        [
          "ALPHABET C",
          2.42
        ],
        [
          "META PLATFORMS A",
          2.41
        ],
        [
          "BROADCOM",
          2.41
        ],
        [
          "MICRON TECHNOLOGY",
          1.82
        ],
        [
          "TESLA",
          1.54
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/984000/msci-usa-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-india": {
    "2026-09-30": {
      "index": "Inde seule",
      "descriptionTemplates": {
        "emergents-pea": "Zone couverte par PINR : indice MSCI India — un seul pays, aucune diversification régionale."
      },
      "marketCount": 1,
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 165,
      "countries": [
        [
          "🇮🇳 Inde",
          100
        ]
      ],
      "sectors": [
        [
          "🏦 Finance",
          30.23
        ],
        [
          "🛍️ Consommation cyclique",
          12.8
        ],
        [
          "🏭 Industrie",
          11.0
        ],
        [
          "🪨 Matériaux",
          8.72
        ],
        [
          "⚡ Énergie",
          7.71
        ],
        [
          "🏥 Santé",
          7.07
        ],
        [
          "💻 Technologie",
          6.75
        ],
        [
          "🛒 Consommation de base",
          5.2
        ],
        [
          "📡 Communication",
          5.06
        ],
        [
          "💡 Services publics",
          4.04
        ],
        [
          "🏠 Immobilier",
          1.42
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "Inde seule",
      "holdings": [
        [
          "HDFC BANK",
          6.44
        ],
        [
          "ICICI BANK",
          5.6
        ],
        [
          "RELIANCE INDUSTRIES",
          5.45
        ],
        [
          "BHARTI AIRTEL",
          3.94
        ],
        [
          "INFOSYS",
          2.41
        ],
        [
          "AXIS BANK",
          2.25
        ],
        [
          "MAHINDRA & MAHINDRA",
          2.05
        ],
        [
          "LARSEN & TOUBRO",
          2.02
        ],
        [
          "BAJAJ FINANCE",
          1.91
        ],
        [
          "KOTAK MAHINDRA BANK",
          1.82
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/935600/msci-india-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "mscieurope": {
    "2026-09-30": {
      "index": "MSCI Europe",
      "descriptionTemplates": {
        "europe": "Grandes et moyennes capitalisations de 15 pays développés européens."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 386,
      "countries": [
        [
          "🌍 Autres",
          25.44
        ],
        [
          "🇬🇧 Royaume-Uni",
          22.55
        ],
        [
          "🇫🇷 France",
          14.79
        ],
        [
          "🇨🇭 Suisse",
          14.16
        ],
        [
          "🇩🇪 Allemagne",
          13.62
        ],
        [
          "🇳🇱 Pays-Bas",
          9.45
        ]
      ],
      "sectors": [
        [
          "🏦 Finance",
          25.5
        ],
        [
          "🏭 Industrie",
          18.61
        ],
        [
          "🏥 Santé",
          12.72
        ],
        [
          "💻 Technologie",
          9.75
        ],
        [
          "🛒 Consommation de base",
          8.25
        ],
        [
          "🛍️ Consommation cyclique",
          6.0
        ],
        [
          "🪨 Matériaux",
          5.43
        ],
        [
          "⚡ Énergie",
          5.36
        ],
        [
          "💡 Services publics",
          4.78
        ],
        [
          "📡 Communication",
          3.08
        ],
        [
          "🏠 Immobilier",
          0.53
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "15 pays développés en Europe",
      "holdings": [
        [
          "ASML HLDG",
          5.15
        ],
        [
          "HSBC HOLDINGS (GB)",
          2.5
        ],
        [
          "ROCHE HOLDING PART",
          2.15
        ],
        [
          "SHELL",
          2.01
        ],
        [
          "NOVARTIS",
          1.92
        ],
        [
          "ASTRAZENECA",
          1.8
        ],
        [
          "NESTLE",
          1.71
        ],
        [
          "SIEMENS",
          1.65
        ],
        [
          "SAP",
          1.56
        ],
        [
          "BANCO SANTANDER",
          1.46
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/990500/msci-europe-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-world-growth": {
    "2026-09-30": {
      "index": "MSCI World Growth",
      "descriptionTemplates": {
        "style": "Entreprises à forte croissance attendue des bénéfices (tech, santé innovante…)."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 575,
      "countries": [
        [
          "🇺🇸 États-Unis",
          73.5
        ],
        [
          "🌍 Autres",
          12.54
        ],
        [
          "🇯🇵 Japon",
          5.82
        ],
        [
          "🇨🇦 Canada",
          3.08
        ],
        [
          "🇬🇧 Royaume-Uni",
          2.9
        ],
        [
          "🇫🇷 France",
          2.17
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          44.75
        ],
        [
          "🛍️ Consommation cyclique",
          12.48
        ],
        [
          "🏭 Industrie",
          12.33
        ],
        [
          "📡 Communication",
          10.16
        ],
        [
          "🏥 Santé",
          6.94
        ],
        [
          "🏦 Finance",
          6.38
        ],
        [
          "🪨 Matériaux",
          2.51
        ],
        [
          "🛒 Consommation de base",
          2.43
        ],
        [
          "⚡ Énergie",
          0.71
        ],
        [
          "💡 Services publics",
          0.7
        ],
        [
          "🏠 Immobilier",
          0.6
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI World Growth",
      "holdings": [
        [
          "NVIDIA",
          11.6
        ],
        [
          "APPLE",
          10.81
        ],
        [
          "AMAZON.COM",
          5.33
        ],
        [
          "ALPHABET A",
          4.46
        ],
        [
          "ALPHABET C",
          3.52
        ],
        [
          "BROADCOM",
          3.51
        ],
        [
          "TESLA",
          2.24
        ],
        [
          "ADVANCED MICRO DEVICES",
          2.2
        ],
        [
          "LILLY (ELI) & COMPANY",
          2.05
        ],
        [
          "ASML HLDG",
          1.56
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/105867/msci-world-growth-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-world-enhanced-value": {
    "2026-09-30": {
      "index": "MSCI World Enhanced Value",
      "descriptionTemplates": {
        "style": "{{constituents}} valeurs jugées « décotées » par rapport à leurs fondamentaux (banques, énergie, industrie…)."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 392,
      "countries": [
        [
          "🇺🇸 États-Unis",
          48.51
        ],
        [
          "🇯🇵 Japon",
          20.36
        ],
        [
          "🌍 Autres",
          12.91
        ],
        [
          "🇬🇧 Royaume-Uni",
          8.01
        ],
        [
          "🇫🇷 France",
          5.96
        ],
        [
          "🇩🇪 Allemagne",
          4.26
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          34.06
        ],
        [
          "🏦 Finance",
          15.98
        ],
        [
          "🏭 Industrie",
          10.34
        ],
        [
          "🏥 Santé",
          8.47
        ],
        [
          "🛍️ Consommation cyclique",
          8.17
        ],
        [
          "📡 Communication",
          7.79
        ],
        [
          "🛒 Consommation de base",
          4.55
        ],
        [
          "⚡ Énergie",
          3.9
        ],
        [
          "🪨 Matériaux",
          3.1
        ],
        [
          "💡 Services publics",
          2.17
        ],
        [
          "🏠 Immobilier",
          1.47
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI World Enhanced Value",
      "holdings": [
        [
          "MICRON TECHNOLOGY",
          15.85
        ],
        [
          "CISCO SYSTEMS",
          2.94
        ],
        [
          "VERIZON COMMUNICATIONS",
          2.05
        ],
        [
          "TOYOTA MOTOR CORP",
          1.64
        ],
        [
          "AT&T",
          1.63
        ],
        [
          "HEWLETT PACKARD ENT CO",
          1.6
        ],
        [
          "QUALCOMM",
          1.52
        ],
        [
          "COMCAST CORP A (NEW)",
          1.21
        ],
        [
          "SHELL",
          1.17
        ],
        [
          "PFIZER",
          1.15
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/705130/msci-world-enhanced-value-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-em-emea-esg": {
    "2026-09-30": {
      "index": "MSCI EM EMEA ex Egypt ESG Broad CTB Select",
      "descriptionTemplates": {
        "emergents-pea": "Zone couverte par PLEM : MSCI EM EMEA ex Egypt ESG Broad CTB Select, Europe émergente, Moyen-Orient et Afrique, hors Égypte."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 127,
      "countries": [
        [
          "🇿🇦 Afrique du Sud",
          29.87
        ],
        [
          "🇸🇦 Arabie saoudite",
          23.35
        ],
        [
          "🌍 Autres",
          17.03
        ],
        [
          "UNITED ARAB EMIRATES",
          12.28
        ],
        [
          "POLAND",
          11.64
        ],
        [
          "GREECE",
          5.82
        ]
      ],
      "sectors": [
        [
          "🏦 Finance",
          48.91
        ],
        [
          "🪨 Matériaux",
          13.79
        ],
        [
          "📡 Communication",
          7.76
        ],
        [
          "🛍️ Consommation cyclique",
          7.17
        ],
        [
          "🏠 Immobilier",
          7.08
        ],
        [
          "⚡ Énergie",
          5.86
        ],
        [
          "🏭 Industrie",
          3.19
        ],
        [
          "🛒 Consommation de base",
          2.84
        ],
        [
          "🏥 Santé",
          1.56
        ],
        [
          "💡 Services publics",
          1.39
        ],
        [
          "💻 Technologie",
          0.44
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI EM EMEA ex Egypt ESG Broad CTB Select",
      "holdings": [
        [
          "ANGLOGOLD ASHANTI",
          4.87
        ],
        [
          "AL RAJHI BANKING & INV",
          4.55
        ],
        [
          "GOLD FIELDS",
          3.54
        ],
        [
          "NASPERS N",
          2.91
        ],
        [
          "SAUDI NATIONAL BANK",
          2.85
        ],
        [
          "PKO BANK POLSKI",
          2.57
        ],
        [
          "FIRSTRAND",
          2.52
        ],
        [
          "SAUDI TELECOM CO",
          2.21
        ],
        [
          "NEPI ROCKCASTLE",
          2.1
        ],
        [
          "NATIONAL BANK OF KUWAIT",
          1.99
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/753537/msci-em-emea-ex-egypt-esg-broad-ctb-select-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-world-sector-neutral-quality": {
    "2026-09-30": {
      "index": "MSCI World Sector Neutral Quality",
      "descriptionTemplates": {
        "style": "{{constituents}} valeurs à la rentabilité stable et à l'endettement maîtrisé (ROE élevé, bénéfices réguliers)."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 290,
      "countries": [
        [
          "🇺🇸 États-Unis",
          73.51
        ],
        [
          "🌍 Autres",
          12.21
        ],
        [
          "🇬🇧 Royaume-Uni",
          4.31
        ],
        [
          "🇳🇱 Pays-Bas",
          3.45
        ],
        [
          "🇨🇭 Suisse",
          3.36
        ],
        [
          "🇯🇵 Japon",
          3.16
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          31.89
        ],
        [
          "🏦 Finance",
          15.32
        ],
        [
          "🏭 Industrie",
          10.9
        ],
        [
          "🏥 Santé",
          8.97
        ],
        [
          "📡 Communication",
          8.73
        ],
        [
          "🛍️ Consommation cyclique",
          8.7
        ],
        [
          "🛒 Consommation de base",
          4.65
        ],
        [
          "⚡ Énergie",
          3.72
        ],
        [
          "🪨 Matériaux",
          3.18
        ],
        [
          "💡 Services publics",
          2.47
        ],
        [
          "🏠 Immobilier",
          1.47
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI World Sector Neutral Quality",
      "holdings": [
        [
          "MICROSOFT CORP",
          6.44
        ],
        [
          "APPLE",
          5.84
        ],
        [
          "NVIDIA",
          5.42
        ],
        [
          "META PLATFORMS A",
          4.23
        ],
        [
          "VISA A",
          3.44
        ],
        [
          "ASML HLDG",
          3.25
        ],
        [
          "LILLY (ELI) & COMPANY",
          2.52
        ],
        [
          "LAM RESEARCH CORP",
          2.13
        ],
        [
          "MASTERCARD A",
          1.97
        ],
        [
          "TJX COMPANIES",
          1.9
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/705169/msci-world-sector-neutral-quality-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-world-high-dividend-yield-advanced-select": {
    "2026-09-30": {
      "index": "MSCI World High Dividend Yield Advanced Select",
      "descriptionTemplates": {
        "dividendes-cto": "{{constituents}} valeurs au 30/09/2026 : dividende et critères de qualité financière."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 190,
      "countries": [
        [
          "🇺🇸 États-Unis",
          52.64
        ],
        [
          "🌍 Autres",
          20.95
        ],
        [
          "🇯🇵 Japon",
          8.71
        ],
        [
          "🇩🇪 Allemagne",
          6.32
        ],
        [
          "🇨🇭 Suisse",
          6.31
        ],
        [
          "🇬🇧 Royaume-Uni",
          5.07
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          36.17
        ],
        [
          "🏦 Finance",
          16.95
        ],
        [
          "🏥 Santé",
          13.66
        ],
        [
          "🏭 Industrie",
          10.76
        ],
        [
          "🛍️ Consommation cyclique",
          5.36
        ],
        [
          "📡 Communication",
          5.07
        ],
        [
          "🛒 Consommation de base",
          4.51
        ],
        [
          "⚡ Énergie",
          3.21
        ],
        [
          "💡 Services publics",
          2.57
        ],
        [
          "🏠 Immobilier",
          0.87
        ],
        [
          "🪨 Matériaux",
          0.87
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI World High Dividend Yield Advanced Select",
      "holdings": [
        [
          "NVIDIA",
          3.82
        ],
        [
          "APPLE",
          3.25
        ],
        [
          "MICROSOFT CORP",
          3.24
        ],
        [
          "APPLIED MATERIALS",
          2.85
        ],
        [
          "MERCK & CO",
          2.83
        ],
        [
          "SAP",
          2.42
        ],
        [
          "CISCO SYSTEMS",
          2.25
        ],
        [
          "NOVARTIS",
          2.11
        ],
        [
          "HOME DEPOT",
          2.11
        ],
        [
          "VERIZON COMMUNICATIONS",
          2.05
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/748469/msci-world-high-dividend-yield-advanced-select-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-japan-imi": {
    "2026-09-30": {
      "index": "MSCI Japan IMI",
      "descriptionTemplates": {
        "japon": "{{constituents}} grandes, moyennes ET petites capitalisations japonaises (méthodologie MSCI, comparable aux autres indices MSCI Pays)."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 932,
      "countries": [
        [
          "🇯🇵 Japon",
          100
        ]
      ],
      "sectors": [
        [
          "🏭 Industrie",
          24.27
        ],
        [
          "🏦 Finance",
          18.05
        ],
        [
          "💻 Technologie",
          17.82
        ],
        [
          "🛍️ Consommation cyclique",
          14.32
        ],
        [
          "📡 Communication",
          6.18
        ],
        [
          "🪨 Matériaux",
          5.06
        ],
        [
          "🏥 Santé",
          5.0
        ],
        [
          "🛒 Consommation de base",
          4.42
        ],
        [
          "🏠 Immobilier",
          2.77
        ],
        [
          "💡 Services publics",
          1.19
        ],
        [
          "⚡ Énergie",
          0.92
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI Japan IMI",
      "holdings": [
        [
          "MITSUBISHI UFJ FIN GRP",
          3.76
        ],
        [
          "TOYOTA MOTOR CORP",
          2.63
        ],
        [
          "TOKYO ELECTRON",
          2.5
        ],
        [
          "SUMITOMO MITSUI FINL GRP",
          2.4
        ],
        [
          "ADVANTEST CORP",
          2.38
        ],
        [
          "HITACHI",
          2.31
        ],
        [
          "SOFTBANK GROUP CORP",
          2.27
        ],
        [
          "RECRUIT HOLDINGS CO",
          2.12
        ],
        [
          "SONY GROUP CORP",
          2.08
        ],
        [
          "KIOXIA HOLDINGS",
          1.98
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/664171/msci-japan-imi-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-china-a": {
    "2026-09-30": {
      "index": "MSCI China A",
      "descriptionTemplates": {
        "chine": "{{constituents}} valeurs : uniquement les actions domestiques cotées à Shanghai/Shenzhen (marché intérieur, via Stock Connect)."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 410,
      "countries": [
        [
          "🇨🇳 Chine",
          100
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          30.44
        ],
        [
          "🏦 Finance",
          20.01
        ],
        [
          "🏭 Industrie",
          13.4
        ],
        [
          "🪨 Matériaux",
          12.19
        ],
        [
          "🛒 Consommation de base",
          6.69
        ],
        [
          "🏥 Santé",
          4.46
        ],
        [
          "🛍️ Consommation cyclique",
          4.34
        ],
        [
          "💡 Services publics",
          3.49
        ],
        [
          "⚡ Énergie",
          3.39
        ],
        [
          "📡 Communication",
          1.15
        ],
        [
          "🏠 Immobilier",
          0.45
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI China A",
      "holdings": [
        [
          "KWEICHOW MOUTAI A (HK-C)",
          3.33
        ],
        [
          "CONTEMPORARY AMP A(HK-C)",
          2.72
        ],
        [
          "ZHONGJI INNO A(HK-C)",
          1.91
        ],
        [
          "CHINA MERCH BK A (HK-C)",
          1.8
        ],
        [
          "CHINA YANGTZE A (HK-C)",
          1.48
        ],
        [
          "CAMBRICON TECH A (HK-C)",
          1.34
        ],
        [
          "FOXCONN INDL A (HK-C)",
          1.3
        ],
        [
          "ZIJIN MINING A (HK-C)",
          1.3
        ],
        [
          "AGRI BANK OF CN A (HK-C)",
          1.26
        ],
        [
          "PING AN INS A (HK-C)",
          1.2
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/718708/msci-china-a-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-em-imi": {
    "2026-09-30": {
      "index": "MSCI EM IMI",
      "descriptionTemplates": {
        "emergents-cto": "{{constituents}} valeurs de ~24 pays émergents (Chine, Inde, Taïwan, Brésil…) — grandes, moyennes ET petites capitalisations."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 2914,
      "countries": [
        [
          "🇹🇼 Taïwan",
          28.8
        ],
        [
          "🇰🇷 Corée du Sud",
          20.65
        ],
        [
          "🇨🇳 Chine",
          18.51
        ],
        [
          "🌍 Autres",
          16.15
        ],
        [
          "🇮🇳 Inde",
          11.87
        ],
        [
          "🇧🇷 Brésil",
          4.02
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          41.59
        ],
        [
          "🏦 Finance",
          18.3
        ],
        [
          "🛍️ Consommation cyclique",
          7.69
        ],
        [
          "🏭 Industrie",
          7.65
        ],
        [
          "🪨 Matériaux",
          6.24
        ],
        [
          "📡 Communication",
          5.53
        ],
        [
          "🏥 Santé",
          3.41
        ],
        [
          "⚡ Énergie",
          3.24
        ],
        [
          "🛒 Consommation de base",
          2.88
        ],
        [
          "💡 Services publics",
          1.97
        ],
        [
          "🏠 Immobilier",
          1.5
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI EM IMI",
      "holdings": [
        [
          "TAIWAN SEMICONDUCTOR MFG",
          13.76
        ],
        [
          "SAMSUNG ELECTRONICS CO",
          6.65
        ],
        [
          "SK HYNIX",
          5.19
        ],
        [
          "TENCENT HOLDINGS LI (CN)",
          2.42
        ],
        [
          "ALIBABA GRP HLDG (HK)",
          1.63
        ],
        [
          "MEDIATEK INC",
          1.6
        ],
        [
          "SAMSUNG ELECTRONICS PREF",
          0.83
        ],
        [
          "DELTA ELECTRONICS",
          0.83
        ],
        [
          "CHINA CONSTRUCTION BK H",
          0.75
        ],
        [
          "HON HAI PRECISION IND CO",
          0.7
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/664220/msci-em-emerging-markets-imi-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "world": {
    "2026-09-30": {
      "index": "MSCI World",
      "descriptionTemplates": {
        "monde": "Les {{constituents}} grandes et moyennes entreprises de 23 pays développés au 30/09/2026.",
        "monde-segments": "Grandes et moyennes capitalisations de 23 pays développés ; les États-Unis en représentent la plus grande part."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 1249,
      "countries": [
        [
          "🇺🇸 États-Unis",
          72.94
        ],
        [
          "🌍 Autres",
          12.21
        ],
        [
          "🇯🇵 Japon",
          5.91
        ],
        [
          "🇬🇧 Royaume-Uni",
          3.41
        ],
        [
          "🇨🇦 Canada",
          3.29
        ],
        [
          "🇫🇷 France",
          2.24
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          31.78
        ],
        [
          "🏦 Finance",
          15.74
        ],
        [
          "🏭 Industrie",
          10.8
        ],
        [
          "🏥 Santé",
          9.2
        ],
        [
          "🛍️ Consommation cyclique",
          8.36
        ],
        [
          "📡 Communication",
          8.31
        ],
        [
          "🛒 Consommation de base",
          4.77
        ],
        [
          "⚡ Énergie",
          4.03
        ],
        [
          "🪨 Matériaux",
          3.21
        ],
        [
          "💡 Services publics",
          2.3
        ],
        [
          "🏠 Immobilier",
          1.52
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "23 pays développés",
      "holdings": [
        [
          "NVIDIA",
          5.81
        ],
        [
          "APPLE",
          5.41
        ],
        [
          "MICROSOFT CORP",
          4.0
        ],
        [
          "AMAZON.COM",
          2.67
        ],
        [
          "ALPHABET A",
          2.23
        ],
        [
          "ALPHABET C",
          1.76
        ],
        [
          "META PLATFORMS A",
          1.76
        ],
        [
          "BROADCOM",
          1.76
        ],
        [
          "MICRON TECHNOLOGY",
          1.33
        ],
        [
          "TESLA",
          1.12
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/990100/msci-world-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "msci-china": {
    "2026-09-30": {
      "index": "MSCI China",
      "descriptionTemplates": {
        "chine": "{{constituents}} valeurs au 30/09/2026 : actions chinoises cotées sur le continent, à Hong Kong ou à l’étranger (ADR)."
      },
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 576,
      "countries": [
        [
          "🇨🇳 Chine",
          100
        ]
      ],
      "sectors": [
        [
          "🛍️ Consommation cyclique",
          22.56
        ],
        [
          "🏦 Finance",
          20.98
        ],
        [
          "📡 Communication",
          17.94
        ],
        [
          "💻 Technologie",
          11.49
        ],
        [
          "🏥 Santé",
          6.38
        ],
        [
          "🪨 Matériaux",
          5.46
        ],
        [
          "🏭 Industrie",
          5.38
        ],
        [
          "⚡ Énergie",
          3.59
        ],
        [
          "🛒 Consommation de base",
          2.81
        ],
        [
          "💡 Services publics",
          1.89
        ],
        [
          "🏠 Immobilier",
          1.54
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI China",
      "holdings": [
        [
          "TENCENT HOLDINGS LI (CN)",
          13.86
        ],
        [
          "ALIBABA GRP HLDG (HK)",
          9.37
        ],
        [
          "CHINA CONSTRUCTION BK H",
          4.33
        ],
        [
          "ICBC H",
          2.63
        ],
        [
          "XIAOMI CORP B",
          2.26
        ],
        [
          "BANK OF CHINA H",
          2.13
        ],
        [
          "MEITUAN B",
          1.89
        ],
        [
          "NETEASE",
          1.78
        ],
        [
          "PING AN INSURANCE H",
          1.7
        ],
        [
          "PDD HOLDINGS A ADR",
          1.65
        ]
      ],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/indexes/index/302400/msci-china-index",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "ftse-em": {
    "2026-08-31": {
      "index": "FTSE EM",
      "descriptionTemplates": {
        "emergents-cto": "{{constituents}} valeurs. Une composition proche du MSCI EM, mais pas identique : la Corée du Sud y est classée comme un pays développé, donc elle est exclue."
      },
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 2290,
      "countries": [
        [
          "🇹🇼 Taïwan",
          32.8
        ],
        [
          "🇨🇳 Chine",
          27.18
        ],
        [
          "🇮🇳 Inde",
          15.69
        ],
        [
          "🇧🇷 Brésil",
          4.22
        ],
        [
          "🇿🇦 Afrique du Sud",
          3.95
        ],
        [
          "🇸🇦 Arabie saoudite",
          3.22
        ],
        [
          "🇲🇽 Mexique",
          2.2
        ],
        [
          "UAE",
          1.59
        ],
        [
          "Malaysia",
          1.56
        ],
        [
          "🇹🇭 Thaïlande",
          1.52
        ],
        [
          "Turkiye",
          1.0
        ],
        [
          "Greece",
          0.9
        ],
        [
          "Indonesia",
          0.7
        ],
        [
          "🇨🇱 Chili",
          0.68
        ],
        [
          "Kuwait",
          0.66
        ],
        [
          "Qatar",
          0.6
        ],
        [
          "Hungary",
          0.45
        ],
        [
          "Philippines",
          0.4
        ],
        [
          "🇨🇴 Colombie",
          0.25
        ],
        [
          "Czech Rep.",
          0.15
        ],
        [
          "Romania",
          0.14
        ],
        [
          "Egypt",
          0.08
        ],
        [
          "Iceland",
          0.07
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          35.07
        ],
        [
          "🏦 Banques",
          15.81
        ],
        [
          "🏭 Biens et services industriels",
          6.57
        ],
        [
          "🪨 Ressources de base",
          5.32
        ],
        [
          "⚡ Énergie",
          4.56
        ],
        [
          "📡 Télécommunications",
          3.79
        ],
        [
          "🛒 Distribution",
          3.79
        ],
        [
          "🏥 Santé",
          3.4
        ],
        [
          "🛡️ Assurance",
          2.89
        ],
        [
          "💡 Services publics",
          2.78
        ],
        [
          "💰 Services financiers",
          2.77
        ],
        [
          "🥫 Alimentation, boissons et tabac",
          2.25
        ],
        [
          "🛍️ Biens et services de consommation",
          2.02
        ],
        [
          "🚗 Automobile",
          1.88
        ],
        [
          "🧪 Chimie",
          1.7
        ],
        [
          "🏠 Immobilier",
          1.65
        ],
        [
          "🏗️ Construction et matériaux",
          1.48
        ],
        [
          "✈️ Voyages et loisirs",
          1.16
        ],
        [
          "🧴 Hygiène et distribution alimentaire",
          1.01
        ],
        [
          "📰 Médias",
          0.1
        ]
      ],
      "sectorClassification": "ICB supersecteurs",
      "markets": "FTSE EM",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=AWALLE&openfile=open",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. FTSE publie ici des supersecteurs ICB ; ils ne sont pas regroupés artificiellement en secteurs GICS."
    }
  },
  "ftse-all-world-high-dividend-yield": {
    "2026-08-31": {
      "index": "FTSE All-World High Dividend Yield",
      "descriptionTemplates": {
        "dividendes-cto": "{{constituents}} entreprises mondiales au rendement de dividende le plus élevé, sans filtre de qualité."
      },
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 2429,
      "countries": [
        [
          "🇺🇸 États-Unis",
          40.07
        ],
        [
          "🇯🇵 Japon",
          9.44
        ],
        [
          "🇬🇧 Royaume-Uni",
          6.87
        ],
        [
          "🇨🇦 Canada",
          4.52
        ],
        [
          "🇨🇭 Suisse",
          4.29
        ],
        [
          "🇫🇷 France",
          4.15
        ],
        [
          "🇦🇺 Australie",
          3.38
        ],
        [
          "🇨🇳 Chine",
          3.22
        ],
        [
          "🇩🇪 Allemagne",
          3.18
        ],
        [
          "🇹🇼 Taïwan",
          3.16
        ],
        [
          "Spain",
          2.06
        ],
        [
          "Italy",
          1.53
        ],
        [
          "Sweden",
          1.34
        ],
        [
          "🇰🇷 Corée du Sud",
          1.24
        ],
        [
          "Hong Kong",
          1.07
        ],
        [
          "🇧🇷 Brésil",
          0.95
        ],
        [
          "🇿🇦 Afrique du Sud",
          0.88
        ],
        [
          "🇳🇱 Pays-Bas",
          0.83
        ],
        [
          "Singapore",
          0.82
        ],
        [
          "🇮🇳 Inde",
          0.79
        ],
        [
          "🇸🇦 Arabie saoudite",
          0.66
        ],
        [
          "Finland",
          0.57
        ],
        [
          "Denmark",
          0.51
        ],
        [
          "🇲🇽 Mexique",
          0.43
        ],
        [
          "Israel",
          0.38
        ],
        [
          "UAE",
          0.36
        ],
        [
          "Belgium",
          0.35
        ],
        [
          "Malaysia",
          0.34
        ],
        [
          "Norway",
          0.34
        ],
        [
          "🇹🇭 Thaïlande",
          0.32
        ],
        [
          "Austria",
          0.21
        ],
        [
          "Poland",
          0.2
        ],
        [
          "Greece",
          0.17
        ],
        [
          "Ireland",
          0.16
        ],
        [
          "Indonesia",
          0.15
        ],
        [
          "Kuwait",
          0.15
        ],
        [
          "Qatar",
          0.14
        ],
        [
          "Turkiye",
          0.13
        ],
        [
          "🇨🇱 Chili",
          0.11
        ],
        [
          "Hungary",
          0.11
        ],
        [
          "Philippines",
          0.1
        ],
        [
          "Portugal",
          0.1
        ],
        [
          "🇨🇴 Colombie",
          0.06
        ],
        [
          "New Zealand",
          0.06
        ],
        [
          "Czech Rep.",
          0.04
        ],
        [
          "Romania",
          0.03
        ],
        [
          "Egypt",
          0.02
        ],
        [
          "Iceland",
          0.02
        ]
      ],
      "sectors": [
        [
          "🏦 Banques",
          19.74
        ],
        [
          "🏥 Santé",
          11.23
        ],
        [
          "🏭 Biens et services industriels",
          11.23
        ],
        [
          "⚡ Énergie",
          9.11
        ],
        [
          "💻 Technologie",
          6.36
        ],
        [
          "🛡️ Assurance",
          5.45
        ],
        [
          "🥫 Alimentation, boissons et tabac",
          5.26
        ],
        [
          "💰 Services financiers",
          5.16
        ],
        [
          "💡 Services publics",
          5.12
        ],
        [
          "📡 Télécommunications",
          4.23
        ],
        [
          "🪨 Ressources de base",
          3.24
        ],
        [
          "🧴 Hygiène et distribution alimentaire",
          2.75
        ],
        [
          "🛍️ Biens et services de consommation",
          2.27
        ],
        [
          "🚗 Automobile",
          1.82
        ],
        [
          "🛒 Distribution",
          1.81
        ],
        [
          "🧪 Chimie",
          1.65
        ],
        [
          "✈️ Voyages et loisirs",
          1.54
        ],
        [
          "🏗️ Construction et matériaux",
          1.15
        ],
        [
          "🏠 Immobilier",
          0.65
        ],
        [
          "📰 Médias",
          0.25
        ]
      ],
      "sectorClassification": "ICB supersecteurs",
      "markets": "FTSE All-World High Dividend Yield",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?issueName=AWHDY&openfile=open",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. FTSE publie ici des supersecteurs ICB ; ils ne sont pas regroupés artificiellement en secteurs GICS."
    }
  },
  "ftse-china-50": {
    "2026-08-31": {
      "index": "FTSE China 50",
      "descriptionTemplates": {
        "chine": "Seulement les {{targetConstituents}} plus grosses valeurs chinoises cotées à Hong Kong."
      },
      "targetConstituents": 50,
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 50,
      "countries": [
        [
          "🇨🇳 Chine (cotations à Hong Kong)",
          100
        ]
      ],
      "sectors": [
        [
          "🏦 Banques",
          26.02
        ],
        [
          "💻 Technologie",
          16.5
        ],
        [
          "🛒 Distribution",
          13.52
        ],
        [
          "🛡️ Assurance",
          9.22
        ],
        [
          "🛍️ Biens et services de consommation",
          5.82
        ],
        [
          "📡 Télécommunications",
          5.71
        ],
        [
          "⚡ Énergie",
          4.98
        ],
        [
          "🪨 Ressources de base",
          3.71
        ],
        [
          "🚗 Automobile",
          3.36
        ],
        [
          "🏭 Biens et services industriels",
          3.17
        ],
        [
          "🏥 Santé",
          2.82
        ],
        [
          "✈️ Voyages et loisirs",
          2.27
        ],
        [
          "🏠 Immobilier",
          0.91
        ],
        [
          "💰 Services financiers",
          0.87
        ],
        [
          "🥫 Alimentation, boissons et tabac",
          0.81
        ],
        [
          "💡 Services publics",
          0.34
        ]
      ],
      "sectorClassification": "ICB supersecteurs",
      "markets": "FTSE China 50",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?IsManual=False&issueName=XIN0&openfile=open",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. FTSE publie ici des supersecteurs ICB ; ils ne sont pas regroupés artificiellement en secteurs GICS."
    }
  },
  "russell-1000": {
    "2026-08-31": {
      "index": "Russell 1000",
      "descriptionTemplates": {
        "usa": "Les {{targetConstituents}} plus grandes valeurs US, ~93 % de la capitalisation du marché américain."
      },
      "targetConstituents": 1000,
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 1017,
      "countries": [
        [
          "🇺🇸 États-Unis",
          100
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          41.72
        ],
        [
          "🛍️ Consommation cyclique",
          12.35
        ],
        [
          "🏭 Industrie",
          11.57
        ],
        [
          "🏦 Finance",
          10.17
        ],
        [
          "🏥 Santé",
          9
        ],
        [
          "⚡ Énergie",
          3.61
        ],
        [
          "🛒 Consommation de base",
          3.49
        ],
        [
          "📡 Télécommunications",
          2.24
        ],
        [
          "💡 Services publics",
          2.18
        ],
        [
          "🏠 Immobilier",
          2.04
        ],
        [
          "🪨 Matériaux",
          1.64
        ]
      ],
      "sectorClassification": "ICB",
      "markets": "Russell 1000",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=True&issueName=US1000USD&openfile=open",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. Poids lus sur le graphique ICB de la page 2 ; 1 017 titres, distincts de la cible nominale de 1 000 sociétés."
    }
  },
  "sp500-equal-weight": {
    "2026-08-31": {
      "index": "S&P 500 Equal Weight",
      "descriptionTemplates": {
        "usa-constructions": "Les mêmes entreprises que le S&P 500, avec 0,2 % par société à chaque rééquilibrage trimestriel."
      },
      "targetConstituents": 500,
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 503,
      "countries": [
        [
          "🇺🇸 États-Unis",
          100
        ]
      ],
      "sectors": [
        [
          "🏭 Industrie",
          16.12
        ],
        [
          "🏦 Finance",
          15.98
        ],
        [
          "💻 Technologie",
          14.56
        ],
        [
          "🏥 Santé",
          13.05
        ],
        [
          "🛍️ Consommation cyclique",
          9.24
        ],
        [
          "🛒 Consommation de base",
          6.55
        ],
        [
          "💡 Services publics",
          5.64
        ],
        [
          "🏠 Immobilier",
          5.5
        ],
        [
          "🪨 Matériaux",
          5.13
        ],
        [
          "⚡ Énergie",
          4.26
        ],
        [
          "📡 Communication",
          3.96
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "États-Unis, grandes entreprises",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU2991918421/ENG/FRA/INSTITUTIONNEL/ETF/20260831",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. Section Index Data / Benchmark Sector breakdown de la fiche Amundi ; pas les positions du fonds."
    }
  },
  "topix": {
    "2026-08-31": {
      "index": "TOPIX",
      "descriptionTemplates": {
        "japon": "{{constituents}} valeurs au 31/08/2026, pondérées par capitalisation flottante."
      },
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 1636,
      "countries": [
        [
          "🇯🇵 Japon",
          100
        ]
      ],
      "sectors": [
        [
          "🏭 Industrie",
          25.94
        ],
        [
          "🏦 Finance",
          18.74
        ],
        [
          "💻 Technologie",
          15.3
        ],
        [
          "🛍️ Consommation cyclique",
          14.66
        ],
        [
          "📡 Communication",
          6.25
        ],
        [
          "🪨 Matériaux",
          5.36
        ],
        [
          "🏥 Santé",
          5.11
        ],
        [
          "🛒 Consommation de base",
          4.8
        ],
        [
          "🏠 Immobilier",
          1.64
        ],
        [
          "💡 Services publics",
          1.26
        ],
        [
          "⚡ Énergie",
          0.94
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "TOPIX",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260831",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. Sections de composition de l’indice TOPIX dans la fiche Amundi."
    }
  },
  "msci-em-latin-america-selection": {
    "2026-08-31": {
      "index": "MSCI EM Latin America Selection 20/35% Capped",
      "descriptionTemplates": {
        "emergents-pea": "PALAT suit le MSCI EM Latin America Selection 20/35 % Capped : {{constituents}} valeurs au 31/08/2026, avec sélection et plafonnement des pondérations."
      },
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 41,
      "countries": [
        [
          "🇧🇷 Brésil",
          40.09
        ],
        [
          "🇲🇽 Mexique",
          35.77
        ],
        [
          "🇨🇱 Chili",
          10.26
        ],
        [
          "🇵🇪 Pérou",
          8.31
        ],
        [
          "🇨🇴 Colombie",
          5.57
        ]
      ],
      "sectors": [
        [
          "🏦 Finance",
          40.13
        ],
        [
          "🪨 Matériaux",
          14.12
        ],
        [
          "🛒 Consommation de base",
          11.41
        ],
        [
          "💡 Services publics",
          10.86
        ],
        [
          "🏭 Industrie",
          8.98
        ],
        [
          "📡 Communication",
          4.73
        ],
        [
          "🛍️ Consommation cyclique",
          3.31
        ],
        [
          "⚡ Énergie",
          2.6
        ],
        [
          "🏠 Immobilier",
          2.6
        ],
        [
          "🏥 Santé",
          1.26
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI EM Latin America Selection 20/35% Capped",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412004/FRA/FRA/INSTITUTIONNEL/ETF/20260831",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. Sections explicitement titrées composition de l’indice et secteurs de l’indice ; variante Selection 20/35% Capped exacte."
    }
  },
  "msci-em-asia-screened": {
    "2026-09-30": {
      "index": "MSCI EM Asia Screened Select ex Thermal Coal",
      "descriptionTemplates": {
        "emergents-pea": "Zone couverte par PAASI : indice MSCI EM Asia Screened Select ex Thermal Coal — {{marketCount}} pays d'Asie émergente (Chine, Inde, Taïwan, Corée du Sud…)."
      },
      "marketCount": 8,
      "asOf": "2026-09-30",
      "snapshot": "30 septembre 2026",
      "constituents": 830,
      "countries": [
        [
          "🇹🇼 Taïwan",
          36.22
        ],
        [
          "🇰🇷 Corée du Sud",
          26.06
        ],
        [
          "🇨🇳 Chine",
          23.4
        ],
        [
          "🇮🇳 Inde",
          11.44
        ],
        [
          "🌍 Autres",
          1.74
        ],
        [
          "🇹🇭 Thaïlande",
          1.14
        ]
      ],
      "sectors": [
        [
          "💻 Technologie",
          54.56
        ],
        [
          "🏦 Finance",
          15.12
        ],
        [
          "🛍️ Consommation cyclique",
          8.28
        ],
        [
          "📡 Communication",
          6.13
        ],
        [
          "🏭 Industrie",
          5.77
        ],
        [
          "🏥 Santé",
          3.23
        ],
        [
          "🪨 Matériaux",
          2.17
        ],
        [
          "⚡ Énergie",
          1.8
        ],
        [
          "🛒 Consommation de base",
          1.66
        ],
        [
          "💡 Services publics",
          0.65
        ],
        [
          "🏠 Immobilier",
          0.63
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "MSCI EM Asia Screened Select ex Thermal Coal",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-09-30, contrôlée le 04/10/2026",
        "url": "https://www.msci.com/documents/10199/40ed8526-20a0-ef81-fc55-ee99f1315c5c",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. "
    }
  },
  "sp-global-dividend-aristocrats": {
    "2026-08-31": {
      "index": "S&P Global Dividend Aristocrats Quality Income",
      "descriptionTemplates": {
        "dividendes-cto": "{{targetConstituents}} entreprises qui versent un dividende stable ou en hausse depuis au moins 10 ans consécutifs (version mondiale).",
        "dividendes-pea": "{{targetConstituents}} entreprises mondiales, dividende stable ou en hausse depuis au moins 10 ans — l'option déjà vue dans le tweet « Dividendes (CTO) »."
      },
      "targetConstituents": 100,
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "constituents": 92,
      "countries": [
        [
          "🇺🇸 États-Unis",
          53.9
        ],
        [
          "🇨🇦 Canada",
          9.6
        ],
        [
          "🇬🇧 Royaume-Uni",
          5.6
        ],
        [
          "🇨🇳 Chine",
          3.7
        ],
        [
          "🇫🇷 France",
          3.2
        ],
        [
          "Italy",
          3.1
        ],
        [
          "🇰🇷 Corée du Sud",
          2.9
        ],
        [
          "🇨🇭 Suisse",
          2.5
        ],
        [
          "🇯🇵 Japon",
          2.5
        ],
        [
          "Hong Kong",
          2.3
        ],
        [
          "Finland",
          2
        ],
        [
          "🇦🇺 Australie",
          1.6
        ],
        [
          "Norway",
          1.1
        ],
        [
          "Portugal",
          1.1
        ],
        [
          "🇸🇦 Arabie saoudite",
          1
        ],
        [
          "Belgium",
          1
        ],
        [
          "UAE",
          1
        ],
        [
          "🇹🇼 Taïwan",
          1
        ],
        [
          "🇲🇽 Mexique",
          0.9
        ]
      ],
      "sectors": [
        [
          "🏦 Finance",
          25.1
        ],
        [
          "💡 Services publics",
          15.5
        ],
        [
          "🏠 Immobilier",
          12.2
        ],
        [
          "🏭 Industrie",
          10.7
        ],
        [
          "📡 Communication",
          9.7
        ],
        [
          "🛒 Consommation de base",
          8.4
        ],
        [
          "⚡ Énergie",
          7.7
        ],
        [
          "🏥 Santé",
          3.8
        ],
        [
          "🪨 Matériaux",
          3.7
        ],
        [
          "💻 Technologie",
          2.1
        ],
        [
          "🛍️ Consommation cyclique",
          1.1
        ]
      ],
      "sectorClassification": "GICS",
      "markets": "S&P Global Dividend Aristocrats",
      "holdings": [],
      "source": {
        "label": "Composition de l’indice au 2026-08-31, contrôlée le 04/10/2026",
        "url": "https://www.spglobal.com/spdji/en/indices/dividends-factors/sp-global-dividend-aristocrats-quality-income-index/",
        "checkedAt": "2026-10-04"
      },
      "provenance": "Composition relue dans la publication officielle : comptage, poids des pays et secteurs de l’indice, sans utiliser le portefeuille du fonds comme substitut. Poids au 31/08/2026 recoupés par deux recherches indépendantes de la publication S&P DJI ; arrondis du fournisseur au dixième."
    }
  }
};
