// Revue du 02/10/2026 : positionsSource date le contrôle des positions ; positionsAsOf date le relevé.
// Les corrections de structure sont sourcées séparément dans characteristicsSource.
import { getInstrumentListings } from './instrument-listings.js';
export { getInstrumentListings } from './instrument-listings.js';
// Caractéristiques par ISIN des parts des Fiches ETF.
// benchmark, incomePolicy, replicationMethod et domicile ont été contrôlés le 29/09/2026
// dans characteristicsSource (émetteur pour IE00BFZPF546 et IE00BM8R0J59,
// justETF pour les autres).
// Les tickers ont été contrôlés le 30/09/2026 : instrument-listings.js fournit
// les places, devises et preuves. location décrit le domicile et la réplication,
// pas la place de cotation. distribution/reviewedAt gardent leur revue historique.
// PEA reste dans instruments.js : le statut ne se déduit ni du domicile ni de l'indice.
// Les ETC et ETP gardent leur nature distincte des fonds ETF.
export const INSTRUMENT_FACTS_BY_ISIN = Object.freeze({
  "LU0290358497": {
  "distribution": "Capitalisant",
  "location": "Luxembourg, réplication synthétique (swap)",
  "benchmark": "Solactive €STR +8.5 Daily Total Return Index",
  "incomePolicy": "accumulating",
  "replicationMethod": "Synthetic (Unfunded swap)",
  "domicile": "Luxembourg",
  "currencyHedge": null,
  "reviewedAt": "02/10/2026",
  "positionsLabel": "Indice de taux monétaire €STR + 8,5 pb",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://etf.dws.com/download/asset/5643099c-7044-46a2-bfd8-b24c4752c7f6",
    "checkedAt": "2026-10-01"
  }
},
  "IE00B3FH7618": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "Bloomberg Euro Short Treasury Index (EUR)",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Irlande",
  "currencyHedge": null,
  "reviewedAt": "02/10/2026",
  "positionsLabel": "34 obligations détenues (29/09/2026)",
  "positionsAsOf": "2026-09-29",
  "characteristicsSource": {
    "url": "https://www.ishares.com/uk/individual/en/products/251741/ishares-euro-government-bond-01yr-ucits-etf",
    "checkedAt": "2026-10-01"
  }
},
  "IE00BDBRDM35": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique, couverture en euros",
  "benchmark": "Bloomberg Global Aggregate Bond Index",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Irlande",
  "currencyHedge": "EUR",
  "reviewedAt": "02/10/2026",
  "positionsLabel": "19 977 obligations détenues (29/09/2026)",
  "positionsAsOf": "2026-09-29",
  "characteristicsSource": {
    "url": "https://www.ishares.com/uk/individual/en/products/291770/ishares-global-aggregate-bond-ucits-etf-eur-hedged-%28acc%29-fund?siteEntryPassthrough=true",
    "checkedAt": "2026-10-01"
  }
},
  "IE00B0M62X26": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "Bloomberg Euro Government Inflation-Linked Bond Index (EUR)",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Irlande",
  "currencyHedge": null,
  "reviewedAt": "02/10/2026",
  "positionsLabel": "38 obligations détenues (29/09/2026)",
  "positionsAsOf": "2026-09-29",
  "characteristicsSource": {
    "url": "https://www.ishares.com/uk/individual/en/products/251739/ishares-euro-inflation-linked-government-bond-ucits-etf",
    "checkedAt": "2026-10-01"
  }
},
  "IE00BMG6Z448": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Emerging Markets ex China Index (Net)",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Irlande",
  "currencyHedge": null,
  "reviewedAt": "02/10/2026",
  "positionsLabel": "570 actions détenues (29/09/2026)",
  "positionsAsOf": "2026-09-29",
  "characteristicsSource": {
    "url": "https://www.ishares.com/uk/individual/en/products/315592/ishares-msci-em-ex-china-ucits-etf?siteEntryPassthrough=true&switchLocale=y",
    "checkedAt": "2026-10-01"
  }
},
  "IE00BZCQB185": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI India Index (Net)",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Irlande",
  "currencyHedge": null,
  "reviewedAt": "02/10/2026",
  "positionsLabel": "165 actions détenues (29/09/2026)",
  "positionsAsOf": "2026-09-29",
  "characteristicsSource": {
    "url": "https://www.ishares.com/uk/individual/en/products/297617/ishares-msci-india-ucits-etf",
    "checkedAt": "2026-10-01"
  }
},
  "IE00B1FZS467": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "FTSE Global Core Infrastructure Index (USD)",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Irlande",
  "currencyHedge": null,
  "reviewedAt": "02/10/2026",
  "positionsLabel": "275 actions détenues (29/09/2026)",
  "positionsAsOf": "2026-09-29",
  "characteristicsSource": {
    "url": "https://www.ishares.com/uk/individual/en/products/251809/ishares-global-infrastructure-ucits-etf",
    "checkedAt": "2026-10-01"
  }
},
  "IE000DQLYVB9": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication synthétique (swap)",
    "benchmark": "S&P 500®",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000DQLYVB9",
      "checkedAt": "2026-09-29"
    }
  },
  "FR0013411998": {
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique, couverture du yen en euros",
    "benchmark": "TOPIX® (EUR Hedged)",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": "JPY/EUR",
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0013411998",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "1 636 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "LU1834983550": {
    "distribution": "Capitalisant",
    "location": "Luxembourg, réplication synthétique (swap)",
    "benchmark": "STOXX® Europe 600 Basic Resources",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "Luxembourg",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1834983550",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "21 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834983550/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "FR001400U5Q4": {
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique (swap)",
    "benchmark": "MSCI World",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR001400U5Q4",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "1 280 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR001400U5Q4/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "FR0011871128": {
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique (swap)",
    "benchmark": "S&P 500®",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0011871128",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "Indice S&P 500 : environ 500 entreprises",
    "positionsAsOf": null,
    "positionsSource": {
      "url": "https://www.borsaitaliana.it/borsa/etf/scheda/FR0011871128-XPAR.html",
      "checkedAt": "2026-10-02",
      "scope": "Indice suivi, pas le panier détenu par le fonds synthétique"
    }
  },
  "FR0011871110": {
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique (swap)",
    "benchmark": "Nasdaq 100®",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0011871110",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "102 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "LU1681047236": {
    "distribution": "Capitalisant",
    "location": "Luxembourg, réplication physique intégrale",
    "benchmark": "EURO STOXX® 50",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Luxembourg",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1681047236",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "50 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "IE00BKM4GZ66": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI Emerging Markets Investable Market (IMI)",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BKM4GZ66",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "2 956 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/264659/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00B6R52259": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée (échantillonnage)",
    "benchmark": "MSCI All Country World (ACWI)",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B6R52259",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "1 695 titres détenus (07/08/2026)",
    "positionsAsOf": "2026-08-07",
    "positionsSource": {
      "url": "https://www.ishares.com/gls-download/literature/fact-sheet/ssac-ishares-msci-acwi-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BK5BQT80": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée (échantillonnage)",
    "benchmark": "FTSE All-World",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BQT80",
      "checkedAt": "2026-09-29"
    }
  },
  "IE000I8KRLL9": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI ACWI IMI Semiconductors & Semiconductor Equipment ESG Screened Select Capped",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000I8KRLL9",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "258 titres détenus (03/09/2026)",
    "positionsAsOf": "2026-09-03",
    "positionsSource": {
      "url": "https://www.ishares.com/gls-download/literature/fact-sheet/semi-ishares-msci-global-semiconductors-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BYXG2H39": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "Nasdaq Biotechnology",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.ishares.com/ch/institutional/en/literature/fact-sheet/btec-ishares-nasdaq-us-biotechnology-ucits-etf-fund-fact-sheet-fr-ch.pdf",
      "checkedAt": "2026-10-02"
    },
    "positionsLabel": "255 titres détenus (04/09/2026)",
    "positionsAsOf": "2026-09-04",
    "positionsSource": {
      "url": "https://www.ishares.com/ch/institutional/en/literature/fact-sheet/btec-ishares-nasdaq-us-biotechnology-ucits-etf-fund-fact-sheet-fr-ch.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BYTRR863": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI World Energy 35/20 Capped Index",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.ssga.com/library-content/products/factsheets/etfs/emea/israel/factsheet-is-en_gb-wnrg-na.pdf",
      "checkedAt": "2026-10-02"
    },
    "positionsLabel": "51 titres détenus (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.ssga.com/library-content/products/factsheets/etfs/emea/israel/factsheet-is-en_gb-wnrg-na.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE000YYE6WK5": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MarketVector Global Defense Industry",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000YYE6WK5",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "45 titres détenus (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.vaneck.com/fr/en/library/fact-sheets/dfns-fact-sheet.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BYPLS672": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "ISE Cyber Security UCITS",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BYPLS672",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "30 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://docs.fundconnect.com/GetDocument.aspx?Isin=IE00BYPLS672&clientid=18svzhes-n8uj-xtdb-oidd-a58dzenasvsr&lang=en-GB&save=false&type=Factsheet",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "FR0010527275": {
    "distribution": "Distribuant",
    "location": "France, réplication physique intégrale",
    "benchmark": "MSCI ACWI IMI Water Filtered",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0010527275",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "44 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010527275/FRA/FRA/RETAIL/ETF",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "LU1681048630": {
    "distribution": "Capitalisant",
    "location": "Luxembourg, réplication physique intégrale",
    "benchmark": "S&P Global Luxury",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Luxembourg",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1681048630",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "80 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "IE00BJ5JP097": {
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique",
    "benchmark": "MSCI World Financials Advanced Select 20 35 Capped",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JP097",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "228 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/308836/ishares-msci-world-financials-sector-advanced-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00B1FZS350": {
    "distribution": "Distribuant (trimestriel)",
    "location": "Irlande, réplication physique",
    "benchmark": "FTSE EPRA/NAREIT Developed Dividend+",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B1FZS350",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "319 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/251801/ishares-developed-markets-property-yield-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BJ5JNY98": {
    "distribution": "Distribuant (semestriel)",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI World Information Technology Advanced Select 20 35 Capped",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JNY98",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "130 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/308858/ishares-msci-world-information-technology-sector-advanced-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE0007Y8Y157": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MarketVector Global Quantum Leaders",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE0007Y8Y157",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "31 titres détenus (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BK5BCD43": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "ROBO Global Artificial Intelligence",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BCD43",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "53 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://dokumenty.analizy.pl/pobierz/etf/E_LG001_A_USD/KA/2026-08-31",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "IE00BYZK4552": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée (échantillonnage)",
    "benchmark": "STOXX Global Automation & Robotics Net USD Index",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-10-02"
    },
    "positionsLabel": "158 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE000RDRMSD1": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "NYSE FactSet Global Blockchain Technologies Capped",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000RDRMSD1",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "39 titres détenus (03/09/2026)",
    "positionsAsOf": "2026-09-03",
    "positionsSource": {
      "url": "https://www.ishares.com/gls-download/literature/fact-sheet/blkc-ishares-blockchain-technology-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE000M7V94E1": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MarketVector Global Uranium and Nuclear Energy Infrastructure",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000M7V94E1",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "25 titres détenus (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.vaneck.com/fr/fr/library/fact-sheets/nucl-fact-sheet.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BF0M2Z96": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "Solactive Battery Value-Chain",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BF0M2Z96",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "46 valeurs dans l’indice (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.fundslibrary.co.uk/FundsLibrary.DataRetrieval//Documents.aspx?id=10bd7cf4-b986-4027-9174-6e7df8612816&type=packet_fund_class_doc_factsheet_private&user=fidelitydocumentreport",
      "checkedAt": "2026-10-02",
      "scope": "valeurs dans l’indice"
    }
  },
  "IE000YU9K6K2": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique",
    "benchmark": "MarketVector Global Space Industry Screened",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000YU9K6K2",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "25 titres détenus (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.vaneck.com/fr/en/library/fact-sheets/jedi-fact-sheet",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00B6YX5D40": {
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "S&P High Yield Dividend Aristocrats",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B6YX5D40",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "155 titres détenus (31/08/2026)",
    "positionsAsOf": "2026-08-31",
    "positionsSource": {
      "url": "https://www.ssga.com/library-content/products/factsheets/etfs/emea/israel/factsheet-is-en_gb-spyd-gy.pdf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BM8R0J59": {
    "distribution": "Distribuant (mensuel)",
    "location": "Irlande, réplication synthétique (swap) avec stratégie de vente d’options",
    "benchmark": "Cboe Nasdaq-100 BuyWrite v2 UCITS",
    "incomePolicy": "distributing",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://globalxetfs.eu/fr/funds/qyld",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "Indice Nasdaq-100 et stratégie de vente d’options d’achat",
    "positionsAsOf": null,
    "positionsSource": {
      "url": "https://globalxetfs.eu/funds/qyld",
      "checkedAt": "2026-10-02",
      "scope": "Indice suivi, pas le panier détenu par le fonds synthétique"
    }
  },
  "IE00B8FHGS14": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Minimum Volatility",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B8FHGS14",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "296 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/251382/ishares-msci-world-minimum-volatility-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BP3QZB59": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI World Enhanced Value",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZB59",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "391 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BF4RFH31": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Small Cap",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BF4RFH31",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "3 577 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/296576/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BP3QZ601": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Sector Neutral Quality",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZ601",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "290 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/270054/ishares-msci-world-quality-factor-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00BP3QZ825": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Momentum",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZ825",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "351 titres détenus (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/270051/ishares-msci-world-momentum-factor-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "titres détenus"
    }
  },
  "IE00B4ND3602": {
    "distribution": "Aucun revenu distribué",
    "location": "Irlande, adossé à de l'or physique alloué (pas de réplication synthétique)",
    "benchmark": "Gold",
    "incomePolicy": "none",
    "replicationMethod": "Physical (Physically backed)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4ND3602",
      "checkedAt": "2026-09-29"
    }
  },
  "GB00BLD4ZL17": {
    "distribution": "Aucun revenu distribué",
    "location": "Jersey, adossé à du bitcoin physiquement détenu (pas un produit dérivé/synthétique)",
    "benchmark": "Bitcoin",
    "incomePolicy": "none",
    "replicationMethod": "Physical (Physically backed)",
    "domicile": "Jersey",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=GB00BLD4ZL17",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B4WXJJ64": {
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique par échantillonnage",
    "benchmark": "Bloomberg Euro Treasury Bond",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4WXJJ64",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "552 obligations détenues (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/251740/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-10-02",
      "scope": "obligations détenues"
    }
  },
  "IE00B66F4759": {
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique par échantillonnage",
    "benchmark": "iBoxx® EUR Liquid High Yield",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B66F4759",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "665 obligations détenues (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/251843/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-10-02",
      "scope": "obligations détenues"
    }
  },
  "IE00B3F81R35": {
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique par échantillonnage",
    "benchmark": "Bloomberg Euro Corporate Bond",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B3F81R35",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "4 214 obligations détenues (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/251726/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-10-02",
      "scope": "obligations détenues"
    }
  },
  "IE00BF3N7094": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique",
    "benchmark": "iBoxx® EUR Liquid High Yield",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BF3N7094",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "665 obligations détenues (30/09/2026)",
    "positionsAsOf": "2026-09-30",
    "positionsSource": {
      "url": "https://www.ishares.com/uk/individual/en/products/290618/ishares-high-yield-corp-bond-ucits-etf",
      "checkedAt": "2026-10-02",
      "scope": "obligations détenues"
    }
  },
  "IE00BFZPF546": {
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique",
    "benchmark": "JP Morgan GBI-EM Global Diversified 10% Cap 1% Floor",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "02/10/2026",
    "characteristicsSource": {
      "url": "https://www.ishares.com/uk/professionals/en/products/297676/ishares-j-p-morgan-em-local-govt-bond-ucits-etf-usd-%28acc%29-fund",
      "checkedAt": "2026-09-29"
    },
    "positionsLabel": "339 obligations détenues (03/09/2026)",
    "positionsAsOf": "2026-09-03",
    "positionsSource": {
      "url": "https://www.ishares.com/gls-download/literature/fact-sheet/emga-ishares-j-p-morgan-em-local-govt-bond-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-02",
      "scope": "obligations détenues"
    }
  },

  // Supports déjà utilisés : profils ISIN contrôlés le 03/10/2026.
  "LU1681043599": {
  "distribution": "Capitalisant",
  "location": "Luxembourg, réplication synthétique (swap)",
  "benchmark": "MSCI World",
  "incomePolicy": "accumulating",
  "replicationMethod": "Synthetic (Unfunded swap)",
  "domicile": "Luxembourg",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI World",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1681043599",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B5BMR087": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P 500®",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P 500®",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B5BMR087",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B53SZB19": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "Nasdaq 100®",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Nasdaq 100®",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B53SZB19",
    "checkedAt": "2026-10-03"
  }
},
  "FR0010342592": {
  "distribution": "Capitalisant",
  "location": "France, réplication synthétique (swap)",
  "benchmark": "Nasdaq 100® Leverage (2x)",
  "incomePolicy": "accumulating",
  "replicationMethod": "Synthetic (Unfunded swap)",
  "domicile": "France",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Nasdaq 100® Leverage (2x)",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0010342592",
    "checkedAt": "2026-10-03"
  }
},
  "FR0010755611": {
  "distribution": "Capitalisant",
  "location": "France, réplication synthétique (swap)",
  "benchmark": "MSCI USA Leveraged (2x)",
  "incomePolicy": "accumulating",
  "replicationMethod": "Synthetic (Unfunded swap)",
  "domicile": "France",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI USA Leveraged (2x)",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0010755611",
    "checkedAt": "2026-10-03"
  }
},
  "FR0013380607": {
  "distribution": "Capitalisant",
  "location": "France, réplication physique",
  "benchmark": "CAC 40®",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "France",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : CAC 40®",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0013380607",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B53L3W79": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "EURO STOXX® 50",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : EURO STOXX® 50",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B53L3W79",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B4K48X80": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Europe",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Europe",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4K48X80",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B43HR379": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P 500 Capped 35/20 Health Care",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P 500 Capped 35/20 Health Care",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B43HR379",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B579F325": {
  "distribution": "Capitalisant",
  "location": "Irlande, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Gold",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETC",
  "positionsLabel": "Exposition suivie : Gold",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B579F325",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B4NCWG09": {
  "distribution": "Capitalisant",
  "location": "Irlande, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Silver",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETC",
  "positionsLabel": "Exposition suivie : Silver",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4NCWG09",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BD6FTQ80": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication synthétique (swap)",
  "benchmark": "Bloomberg Commodity",
  "incomePolicy": "accumulating",
  "replicationMethod": "Synthetic (Unfunded swap)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Bloomberg Commodity",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BD6FTQ80",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BDFL4P12": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication synthétique (swap)",
  "benchmark": "Bloomberg Commodity",
  "incomePolicy": "accumulating",
  "replicationMethod": "Synthetic (Unfunded swap)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Bloomberg Commodity",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BDFL4P12",
    "checkedAt": "2026-10-03"
  }
},
  "GB00BLD4ZM24": {
  "distribution": "Capitalisant",
  "location": "Jersey, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Ethereum",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Jersey",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETN",
  "positionsLabel": "Exposition suivie : Ethereum",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=GB00BLD4ZM24",
    "checkedAt": "2026-10-03"
  }
},
  "LU1437018838": {
  "distribution": "Capitalisant",
  "location": "Luxembourg, réplication physique",
  "benchmark": "FTSE EPRA/NAREIT Developed",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Luxembourg",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : FTSE EPRA/NAREIT Developed",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1437018838",
    "checkedAt": "2026-10-03"
  }
},
  "LU1737652823": {
  "distribution": "Distribuant",
  "location": "Luxembourg, réplication physique",
  "benchmark": "FTSE EPRA/NAREIT Developed",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Luxembourg",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : FTSE EPRA/NAREIT Developed",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1737652823",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B9CQXS71": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P Global Dividend Aristocrats",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P Global Dividend Aristocrats",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B9CQXS71",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BK5BR626": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "FTSE All-World High Dividend Yield",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : FTSE All-World High Dividend Yield",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BR626",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B8GKDB10": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "FTSE All-World High Dividend Yield",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : FTSE All-World High Dividend Yield",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B8GKDB10",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BKPSFC54": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI World High Dividend Yield Advanced Select",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI World High Dividend Yield Advanced Select",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BKPSFC54",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BYYHSQ67": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI World High Dividend Yield Advanced Select",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI World High Dividend Yield Advanced Select",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BYYHSQ67",
    "checkedAt": "2026-10-03"
  }
},
  "JE00B1VS3770": {
  "distribution": "Capitalisant",
  "location": "Jersey, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Gold",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Jersey",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETC",
  "positionsLabel": "Exposition suivie : Gold",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=JE00B1VS3770",
    "checkedAt": "2026-10-03"
  }
},
  "FR0013416716": {
  "distribution": "Capitalisant",
  "location": "Irlande, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Gold",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETC",
  "positionsLabel": "Exposition suivie : Gold",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0013416716",
    "checkedAt": "2026-10-03"
  }
},
  "GB00BJYDH287": {
  "distribution": "Capitalisant",
  "location": "Jersey, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Bitcoin",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Jersey",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETN",
  "positionsLabel": "Exposition suivie : Bitcoin",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=GB00BJYDH287",
    "checkedAt": "2026-10-03"
  }
},
  "DE000A27Z304": {
  "distribution": "Capitalisant",
  "location": "Allemagne, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Bitcoin",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Germany",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETN",
  "positionsLabel": "Exposition suivie : Bitcoin",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=DE000A27Z304",
    "checkedAt": "2026-10-03"
  }
},
  "CH0454664001": {
  "distribution": "Capitalisant",
  "location": "Suisse, adossement physique ; titre de dette, distinct d’un fonds UCITS",
  "benchmark": "Bitcoin",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Physically backed)",
  "domicile": "Switzerland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETN",
  "positionsLabel": "Exposition suivie : Bitcoin",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=CH0454664001",
    "checkedAt": "2026-10-03"
  }
},
  "LU1931975079": {
  "distribution": "Distribuant",
  "location": "Luxembourg, réplication physique",
  "benchmark": "Bloomberg Euro Aggregate Corporate Bond",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Sampling)",
  "domicile": "Luxembourg",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Bloomberg Euro Aggregate Corporate Bond",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1931975079",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BZ163G84": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "Bloomberg Euro Corporate Bond",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Bloomberg Euro Corporate Bond",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BZ163G84",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B3T9LM79": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "Bloomberg Euro Corporate Bond",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Bloomberg Euro Corporate Bond",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B3T9LM79",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B4L5Y983": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI World",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI World",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4L5Y983",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B44Z5B48": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI All Country World (ACWI)",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI All Country World (ACWI)",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B44Z5B48",
    "checkedAt": "2026-10-03"
  }
},
  "LU1681045370": {
  "distribution": "Capitalisant",
  "location": "Luxembourg, réplication synthétique (swap)",
  "benchmark": "MSCI Emerging Markets",
  "incomePolicy": "accumulating",
  "replicationMethod": "Synthetic (Unfunded swap)",
  "domicile": "Luxembourg",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Emerging Markets",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1681045370",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BK5BR733": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "FTSE Emerging",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : FTSE Emerging",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BR733",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B469F816": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Emerging Markets",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Emerging Markets",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B469F816",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B14X4Q57": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "Bloomberg Euro Government Bond 1-3",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Bloomberg Euro Government Bond 1-3",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B14X4Q57",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BMW42413": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Europe Information Technology 20/35 Capped",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Europe Information Technology 20/35 Capped",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BMW42413",
    "checkedAt": "2026-10-03"
  }
},
  "IE0000N55FP4": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Europe Small Cap",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Europe Small Cap",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE0000N55FP4",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B42NKQ00": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P 500 Capped 35/20 Energy",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P 500 Capped 35/20 Energy",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B42NKQ00",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B3WJKG14": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P 500 Capped 35/20 Information Technology",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P 500 Capped 35/20 Information Technology",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B3WJKG14",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BG0J4C88": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "STOXX® Global Digital Security",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : STOXX® Global Digital Security",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BG0J4C88",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B1XNHC34": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P Global Clean Energy Transition",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P Global Clean Energy Transition",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B1XNHC34",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B40B8R38": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P 500 Capped 35/20 Consumer Staples",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P 500 Capped 35/20 Consumer Staples",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B40B8R38",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B4KBBD01": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P 500 Capped 35/20 Utilities",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P 500 Capped 35/20 Utilities",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4KBBD01",
    "checkedAt": "2026-10-03"
  }
},
  "NL0011683594": {
  "distribution": "Distribuant",
  "location": "Pays-Bas, réplication physique",
  "benchmark": "Morningstar Developed Markets Large Cap Dividend Leaders Screened Select",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Netherlands",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : Morningstar Developed Markets Large Cap Dividend Leaders Screened Select",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=NL0011683594",
    "checkedAt": "2026-10-03"
  }
},
  "NL0009690239": {
  "distribution": "Distribuant",
  "location": "Pays-Bas, réplication physique",
  "benchmark": "GPR Global 100",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Netherlands",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : GPR Global 100",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=NL0009690239",
    "checkedAt": "2026-10-03"
  }
},
  "LU2970735911": {
  "distribution": "Capitalisant",
  "location": "Luxembourg, réplication physique",
  "benchmark": "iBoxx® EUR Liquid High Yield",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Sampling)",
  "domicile": "Luxembourg",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : iBoxx® EUR Liquid High Yield",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU2970735911",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BK95B138": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "ICE US Treasury Core Bond",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : ICE US Treasury Core Bond",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK95B138",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B4L5YX21": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Japan IMI",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (sampling)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Japan IMI",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4L5YX21",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B5W4TY14": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Korea 20/35",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Korea 20/35",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B5W4TY14",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B0M63623": {
  "distribution": "Distribuant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI Taiwan 20/35",
  "incomePolicy": "distributing",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI Taiwan 20/35",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B0M63623",
    "checkedAt": "2026-10-03"
  }
},
  "IE00BKPX3K41": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "MSCI AC Far East ex Japan",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : MSCI AC Far East ex Japan",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BKPX3K41",
    "checkedAt": "2026-10-03"
  }
},
  "IE00B4JNQZ49": {
  "distribution": "Capitalisant",
  "location": "Irlande, réplication physique",
  "benchmark": "S&P 500 Capped 35/20 Financials",
  "incomePolicy": "accumulating",
  "replicationMethod": "Physical (Full replication)",
  "domicile": "Ireland",
  "currencyHedge": null,
  "reviewedAt": "03/10/2026",
  "instrumentType": "ETF",
  "positionsLabel": "Exposition suivie : S&P 500 Capped 35/20 Financials",
  "positionsAsOf": null,
  "characteristicsSource": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4JNQZ49",
    "checkedAt": "2026-10-03"
  }
},
});

export function getInstrumentFacts(isin) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin];
  if (!facts) throw new Error(`Caractéristiques absentes pour ${isin}`);
  return facts;
}

export function getInstrumentTickers(isin) {
  return [...new Set(getInstrumentListings(isin).map(listing => listing.ticker))];
}

export function getInstrumentDistribution(isin) {
  return getInstrumentFacts(isin).distribution;
}

export function getInstrumentLocation(isin) {
  return getInstrumentFacts(isin).location;
}

// Libellés datés de positions, distincts des dates d’encours.
export function getInstrumentPositions(isin) {
  const label = INSTRUMENT_FACTS_BY_ISIN[isin]?.positionsLabel;
  if (!label) throw new Error(`Positions absentes pour ${isin}`);
  return label;
}
