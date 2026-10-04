// Séries d’indices et de références physiques. Les lignes de parts ETF sont exclues.
// La clé désigne la fin de période couverte, pas la date de composition.
export const INDEX_COMPARISON_RETURN_ADDITIONS = {
  "sp500-pea": {
    "2025-12-31": {
      "values": [
        [
          2023,
          26.29
        ],
        [
          2024,
          25.02
        ],
        [
          2025,
          17.88
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "S&P 500 · USD · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.spglobal.com/spdji/en/documents/commentary/market-attributes-us-equities-202512.pdf"
      },
      "currency": "USD",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "sp500-equal-weight": {
    "2025-12-31": {
      "values": [
        [
          2023,
          13.87
        ],
        [
          2024,
          13.01
        ],
        [
          2025,
          11.43
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "S&P 500 Equal Weight · USD · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.invesco.com/us-rest/contentdetail?contentId=e3fc7c23dbd92610VgnVCM1000006e36b50aRCRD&dnsName=us"
      },
      "currency": "USD",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "nasdaq-pea": {
    "2025-12-31": {
      "values": [
        [
          2023,
          55.13
        ],
        [
          2024,
          25.88
        ],
        [
          2025,
          21.02
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "Nasdaq-100 · USD · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://indexes.nasdaq.com/docs/FS_XNDX.pdf"
      },
      "currency": "USD",
      "method": "dividendes réinvestis",
      "note": "Version Total Return XNDX ; distincte de l’indice prix NDX et de la version nette suivie par certains ETF.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-usa": {
    "2025-12-31": {
      "values": [
        [
          2023,
          27.1
        ],
        [
          2024,
          25.08
        ],
        [
          2025,
          17.75
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI USA · USD · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-usa-index-gross.pdf"
      },
      "currency": "USD",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "russell-1000": {
    "2025-12-31": {
      "values": [
        [
          2023,
          26.53
        ],
        [
          2024,
          24.51
        ],
        [
          2025,
          17.37
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "Russell 1000 · USD · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=True&issueName=US1000USD"
      },
      "currency": "USD",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "mscieurope": {
    "2025-12-31": {
      "values": [
        [
          2023,
          12.73
        ],
        [
          2024,
          5.75
        ],
        [
          2025,
          16.34
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI Europe · EUR · hors dividendes",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-europe-index-eur-price.pdf"
      },
      "currency": "EUR",
      "method": "hors dividendes",
      "note": "Version prix choisie pour comparer les trois indices européens sur la même base, sans dividendes.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "em-esg": {
    "2025-12-31": {
      "values": [
        [
          2023,
          5.32
        ],
        [
          2024,
          7.18
        ],
        [
          2025,
          38.26
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI EM ex-Egypt ESG Broad CTB Select · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-em-ex-egypt-esg-leaders-select-issuer-capped-index-usd-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": "Historique partiellement rétrosimulé : indice lancé le 6 juillet 2023.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-em-asia-screened": {
    "2025-12-31": {
      "values": [
        [
          2023,
          0.96
        ],
        [
          2024,
          9.99
        ],
        [
          2025,
          39.04
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI EM Asia Screened Select ex Thermal Coal · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/40ed8526-20a0-ef81-fc55-ee99f1315c5c"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": "Historique partiellement rétrosimulé : indice lancé le 6 juillet 2023.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-india": {
    "2025-12-31": {
      "values": [
        [
          2023,
          20.81
        ],
        [
          2024,
          11.22
        ],
        [
          2025,
          2.62
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI India · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-india-index-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-em-imi": {
    "2025-12-31": {
      "values": [
        [
          2023,
          11.67
        ],
        [
          2024,
          7.09
        ],
        [
          2025,
          31.38
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI EM IMI · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.ishares.com/gls-download/literature/fact-sheet/eimi-ishares-core-msci-em-imi-ucits-etf-fund-fact-sheet-en-gb.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-em-ex-china": {
    "2025-12-31": {
      "values": [
        [
          2023,
          20.03
        ],
        [
          2024,
          3.56
        ],
        [
          2025,
          34.61
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI EM ex-China · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-emerging-markets-ex-china-index-usd-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-world-enhanced-value": {
    "2025-12-31": {
      "values": [
        [
          2023,
          19.31
        ],
        [
          2024,
          5.09
        ],
        [
          2025,
          39.39
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World Enhanced Value · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-enhanced-value-index-net-usd.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-world-sector-neutral-quality": {
    "2025-12-31": {
      "values": [
        [
          2023,
          25.83
        ],
        [
          2024,
          16.81
        ],
        [
          2025,
          15.49
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World Sector Neutral Quality · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-sector-neutral-quality-index-usd-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-world-growth": {
    "2025-12-31": {
      "values": [
        [
          2023,
          37
        ],
        [
          2024,
          25.92
        ],
        [
          2025,
          21.14
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World Growth · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-growth-index-usd-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-world-high-dividend-yield-advanced-select": {
    "2025-12-31": {
      "values": [
        [
          2023,
          17.09
        ],
        [
          2024,
          9.82
        ],
        [
          2025,
          23.92
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World High Dividend Yield Advanced Select · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-high-dividend-yield-advanced-select-index-usd-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-china": {
    "2025-12-31": {
      "values": [
        [
          2023,
          -11.2
        ],
        [
          2024,
          19.42
        ],
        [
          2025,
          31.17
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI China · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-china-a-index-usd-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-china-a": {
    "2025-12-31": {
      "values": [
        [
          2023,
          -13.47
        ],
        [
          2024,
          11.7
        ],
        [
          2025,
          26.48
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI China A · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-china-a-index-usd-net.pdf"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "ftse-em": {
    "2025-12-31": {
      "values": [
        [
          2023,
          8.6
        ],
        [
          2024,
          12.4
        ],
        [
          2025,
          26.0
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "FTSE Emerging · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=AWALLE&openfile=open"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "ftse-all-world-high-dividend-yield": {
    "2025-12-31": {
      "values": [
        [
          2023,
          12.3
        ],
        [
          2024,
          10.1
        ],
        [
          2025,
          27.3
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "FTSE All-World High Dividend Yield · USD · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?issueName=AWHDY&openfile=open"
      },
      "currency": "USD",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "sp-global-dividend-aristocrats": {
    "2025-12-31": {
      "values": [
        [
          2023,
          6.9
        ],
        [
          2024,
          7.48
        ],
        [
          2025,
          16.97
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "S&P Global Dividend Aristocrats Quality Income · USD · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy"
      },
      "currency": "USD",
      "method": "dividendes nets réinvestis",
      "note": "Ligne Index (net total return), pas la performance de la part. Le fonds suit la variante Quality Income depuis février 2020.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "sp-euro-dividend-aristocrats": {
    "2025-12-31": {
      "values": [
        [
          2023,
          17.95
        ],
        [
          2024,
          8.23
        ],
        [
          2025,
          19.47
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "S&P Euro High Yield Dividend Aristocrats · EUR · dividendes nets réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy"
      },
      "currency": "EUR",
      "method": "dividendes nets réinvestis",
      "note": "Ligne Index (net total return), pas la performance de la part.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "ftse-china-50": {
    "2025-12-31": {
      "values": [
        [
          2023,
          -12.6
        ],
        [
          2024,
          31.7
        ],
        [
          2025,
          29.8
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "FTSE China 50 · HKD · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?issueName=XIN0&openfile=open"
      },
      "currency": "HKD",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "nikkei225": {
    "2025-12-31": {
      "values": [
        [
          2023,
          30.66
        ],
        [
          2024,
          21.33
        ],
        [
          2025,
          28.69
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "Nikkei 225 · JPY · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://indexes.nikkei.co.jp/en/nkave/factsheet?idx=nk225tr"
      },
      "currency": "JPY",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "topix": {
    "2025-12-31": {
      "values": [
        [
          2023,
          28.26
        ],
        [
          2024,
          20.45
        ],
        [
          2025,
          25.46
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "TOPIX · JPY · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.blackrock.com/jp/individual-en/en/products/279438/ishares-core-topix-etf"
      },
      "currency": "JPY",
      "method": "dividendes réinvestis",
      "note": "Table Calendar Year, ligne Index, benchmark TOPIX Total Return ; pas la ligne Total Return du fonds.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-japan-imi": {
    "2025-12-31": {
      "values": [
        [
          2023,
          27.59
        ],
        [
          2024,
          20.35
        ],
        [
          2025,
          25.59
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI Japan IMI · JPY · dividendes réinvestis",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.msci.com/documents/10199/255599/msci-japan-imi-jpy-gross.pdf"
      },
      "currency": "JPY",
      "method": "dividendes réinvestis",
      "note": null,
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "gold-physical": {
    "2025-12-31": {
      "values": [
        [
          2023,
          13.8
        ],
        [
          2024,
          26.59
        ],
        [
          2025,
          65.0
        ]
      ],
      "performance": {
        "kind": "actif",
        "detail": "Or physique · USD · cours de référence du métal",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.ishares.com/gls-download/literature/fact-sheet/sgln-ishares-physical-gold-etc-fund-fact-sheet-en-gb.pdf"
      },
      "currency": "USD",
      "method": "cours de référence du métal",
      "note": "Ligne Benchmark, LBMA Gold Price ; distincte du rendement de l’ETC après frais.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "silver-physical": {
    "2025-12-31": {
      "values": [
        [
          2023,
          -0.65
        ],
        [
          2024,
          21.5
        ],
        [
          2025,
          149.06
        ]
      ],
      "performance": {
        "kind": "actif",
        "detail": "Argent physique · USD · cours de référence du métal",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.ishares.com/gls-download/literature/fact-sheet/ssln-ishares-physical-silver-etc-fund-fact-sheet-en-gb.pdf"
      },
      "currency": "USD",
      "method": "cours de référence du métal",
      "note": "Ligne Benchmark, référence physique argent publiée par BlackRock ; distincte du rendement de l’ETC après frais.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-em-latin-america-selection": {
    "2025-12-31": {
      "values": [
        [
          2023,
          null
        ],
        [
          2024,
          null
        ],
        [
          2025,
          null
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI EM Latin America Selection 20/35% Capped · devise à confirmer · série à confirmer",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412004/FRA/FRA/INSTITUTIONNEL/ETF"
      },
      "currency": null,
      "method": "série à confirmer",
      "note": "La fiche du fonds publie une ligne indice, mais sa devise et les éventuels changements de benchmark sur 2023–2025 ne sont pas suffisamment établis. Aucun chiffre publié dans le tweet.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "msci-em-emea-esg": {
    "2025-12-31": {
      "values": [
        [
          2023,
          null
        ],
        [
          2024,
          null
        ],
        [
          2025,
          null
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI EM EMEA ex-Egypt ESG Broad CTB Select · devise à confirmer · série à confirmer",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Source officielle · performances de l’indice ou de l’actif",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011440478/FRA/FRA/INSTITUTIONNEL/ETF"
      },
      "currency": null,
      "method": "série à confirmer",
      "note": "La fiche du fonds publie une ligne indice, mais sa devise et les éventuels changements de benchmark sur 2023–2025 ne sont pas suffisamment établis. Aucun chiffre publié dans le tweet.",
      "checkedAt": "2026-10-04",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31"
    }
  },
  "bitcoin": {
    "2025-12-31": {
      "values": [
        [
          2023,
          155.42
        ],
        [
          2024,
          121.05
        ],
        [
          2025,
          -6.34
        ]
      ],
      "performance": {
        "kind": "actif",
        "detail": "Bitcoin · USD · cours spot",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Cours spot · Slickcharts",
        "url": "https://www.slickcharts.com/currency/BTC/returns"
      },
      "currency": "USD",
      "method": "cours spot",
      "note": "Cours spot USD, clôture de l’année précédente à clôture de l’année courante. Table annuelle Slickcharts relue le 04/10/2026 ; frais des ETP et staking exclus.",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31",
      "checkedAt": "2026-10-04"
    }
  },
  "ethereum": {
    "2025-12-31": {
      "values": [
        [
          2023,
          90.64
        ],
        [
          2024,
          46.07
        ],
        [
          2025,
          -10.97
        ]
      ],
      "performance": {
        "kind": "actif",
        "detail": "Ethereum · USD · cours spot",
        "date": "Années calendaires 2023–2025"
      },
      "source": {
        "label": "Cours spot · Slickcharts",
        "url": "https://www.slickcharts.com/currency/ETH/returns"
      },
      "currency": "USD",
      "method": "cours spot",
      "note": "Cours spot USD, clôture de l’année précédente à clôture de l’année courante. Table annuelle Slickcharts relue le 04/10/2026 ; frais des ETP et staking exclus.",
      "periodStart": "2023-01-01",
      "periodEnd": "2025-12-31",
      "checkedAt": "2026-10-04"
    }
  }
};
