// Faits d’indices, distincts des caractéristiques et rendements des ETF.
// Clé = indice + photographie : une nouvelle date ajoute une entrée, elle ne remplace pas l’histoire.
// Sources migrées du dépôt au 30/09/2026 : cette date ne constitue pas une recertification externe.
export const INDEX_FACTS = {
  "em-standard": {
    "2026-08-31": {
      "index": "MSCI Emerging Markets",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Indice, composition et rendements nets USD · MSCI, 31/08/2026",
        "url": "https://www.msci.com/documents/10199/c0db0a48-01f2-4ba9-ad01-226fd5678111"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 1178,
      "markets": "24 pays émergents, grandes et moyennes capitalisations",
      "marketCap": "12 338 milliards $ de capitalisation ajustée du flottant",
      "countries": [["🇹🇼 Taïwan", 27.44], ["🇰🇷 Corée du Sud", 20.84], ["🇨🇳 Chine", 20.62], ["🇮🇳 Inde", 11.25], ["🇧🇷 Brésil", 3.94], ["🌍 Autres", 15.9]],
      "sectors": [["💻 Technologie", 41.56], ["🏦 Finance", 19.71], ["🛍️ Consommation cyclique", 8.02], ["🏭 Industrie", 6.54], ["🪨 Matériaux", 6.3], ["📡 Communication", 6.13], ["⚡ Énergie", 3.44], ["🛒 Consommation de base", 2.73], ["🏥 Santé", 2.72], ["💡 Services publics", 1.86], ["🏠 Immobilier", 0.99]],
      "holdings": [["TSMC", 15.14], ["Samsung Electronics", 7.2], ["SK Hynix", 5.48], ["Tencent", 2.88], ["Alibaba", 1.98], ["MediaTek", 1.45], ["Delta Electronics", 0.92], ["Samsung Electronics Pref", 0.89], ["China Construction Bank H", 0.83], ["Hon Hai Precision", 0.78]]
    }
  },
  "topix": {
    "2026-04-30": {
      "index": "TOPIX",
      "asOf": "2026-04-30",
      "snapshot": "30 avril 2026",
      "source": {
        "label": "Composition de l’indice · fiche Amundi, 30/04/2026",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260430"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 1650,
      "markets": "actions japonaises pondérées par la capitalisation flottante",
      "countries": [["🇯🇵 Japon", 100]],
      "sectors": [["🏭 Industrie", 27.64], ["🏦 Finance", 16.65], ["🛍️ Consommation cyclique", 14.45], ["💻 Technologie", 14.37], ["📡 Communication", 6.33], ["🪨 Matériaux", 5.8], ["🏥 Santé", 5.51], ["🛒 Consommation de base", 4.8], ["🏠 Immobilier", 2.04], ["💡 Services publics", 1.35], ["⚡ Énergie", 1.06]],
      "holdings": [["Mitsubishi UFJ Financial", 3.34], ["Toyota", 3.07], ["Hitachi", 2.37], ["Sumitomo Mitsui Financial", 2.26], ["Sony Group", 2.05], ["Mitsubishi Corp", 2.01], ["SoftBank Group", 1.91], ["Tokyo Electron", 1.79], ["Mizuho Financial", 1.79], ["Mitsui & Co", 1.69]]
    },
    "2026-07-31": {
      "index": "TOPIX",
      "asOf": "2026-07-31",
      "snapshot": "31 juillet 2026",
      "constituents": 1637,
      "source": {
        "label": "JPX, source déjà citée par le comparateur ; comptage de juillet hérité",
        "url": "https://www.jpx.co.jp/english/markets/indices/topix/"
      },
      "provenance": "Comparateur : revue du 04/09/2026, attribution à la presse japonaise sans URL archivée ; valeur historique conservée, non recertifiée."
    }
  },
  "nikkei225": {
    "2026-08-31": {
      "index": "Nikkei 225",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et secteurs · Nikkei, 31/08/2026",
        "url": "https://indexes.nikkei.co.jp/en/nkave/archives/summary?dt=08312026&idx=nk225"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 225,
      "markets": "actions de la Bourse de Tokyo, pondérées par le prix ajusté des actions",
      "marketCap": "1 060 380 milliards ¥ de capitalisation totale des composants (ce n’est pas la pondération de l’indice)",
      "countries": [["🇯🇵 Japon", 100]],
      "sectors": [["💻 Technologie", 55.36], ["🛍️ Biens de consommation", 20.7], ["🪨 Matériaux", 12.59], ["🏭 Biens d’équipement et autres", 7.02], ["🏦 Finance", 3.01], ["🚆 Transport et services publics", 1.32]],
      "holdings": [["Advantest", 12.26], ["Fast Retailing", 8.79], ["Tokyo Electron", 8.56], ["SoftBank Group", 6.31], ["Recruit Holdings", 2.76], ["TDK", 2.33], ["Ibiden", 2.07], ["KDDI", 1.8], ["Kioxia", 1.77], ["Fujikura", 1.67]]
    }
  },
  "acwi": {
    "2026-08-31": {
      "index": "MSCI ACWI",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-acwi.pdf"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 2458,
      "markets": "23 pays développés et 24 marchés émergents",
      "marketCap": "104 043 milliards $ de capitalisation ajustée du flottant",
      "countries": [["🇺🇸 États-Unis", 63.59], ["🇯🇵 Japon", 5.09], ["🇹🇼 Taïwan", 3.25], ["🇬🇧 Royaume-Uni", 3.11], ["🇨🇦 Canada", 3.05], ["🌍 Autres", 21.91]],
      "sectors": [["💻 Technologie", 31.2], ["🏦 Finance", 16.95], ["🏭 Industrie", 10.59], ["🛍️ Consommation discrétionnaire", 8.72], ["🏥 Santé", 8.49], ["📡 Communication", 7.69], ["🛒 Consommation de base", 4.65], ["⚡ Énergie", 4.01], ["🪨 Matériaux", 3.8], ["💡 Services publics", 2.33], ["🏠 Immobilier", 1.56]],
      "holdings": [["Nvidia", 4.9], ["Apple", 4.47], ["Microsoft", 3.44], ["Amazon", 2.42], ["Alphabet A", 1.9], ["TSMC", 1.8], ["Broadcom", 1.6], ["Alphabet C", 1.49], ["Meta", 1.21], ["Micron", 1.04]],
      "topWeight": 24.26
    },
    "legacy-undated": {
      "index": "MSCI ACWI",
      "asOf": null,
      "snapshot": "juin–juillet 2026, date exacte non documentée",
      "constituents": 2461,
      "source": {
        "label": "MSCI, référence existante ; photographie historique non datée précisément",
        "url": "https://www.msci.com/documents/10199/255599/msci-acwi.pdf"
      },
      "provenance": "Ancien comparateur, revue du 01/09/2026. Conservé pour traçabilité ; ne pas utiliser comme photographie actuelle."
    }
  },
  "ftse-all-world": {
    "2026-08-31": {
      "index": "FTSE All-World",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et performances, FTSE Russell",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=AWORLDS&openfile=open"
      },
      "provenance": "Migration de la fiche FTSE déjà sourcée au 31/08/2026. Correction du comparateur : 4 263 → 4 264 pour cette même photographie ; aucune nouvelle vérification externe.",
      "constituents": 4264,
      "markets": "marchés développés et émergents",
      "marketCap": "107 192 milliards $ de capitalisation flottante nette",
      "countries": [["🇺🇸 États-Unis", 61.71], ["🇯🇵 Japon", 5.98], ["🇹🇼 Taïwan", 3.3], ["🇬🇧 Royaume-Uni", 3.2], ["🇨🇦 Canada", 3], ["🌍 Autres", 22.81]],
      "sectors": [["💻 Technologie", 34.09], ["🏦 Finance", 15.49], ["🏭 Industrie", 12.31], ["🛍️ Consommation discrétionnaire", 11.04], ["🏥 Santé", 7.98], ["⚡ Énergie", 4.15], ["🛒 Consommation de base", 3.89], ["🪨 Matériaux de base", 3.44], ["📡 Télécommunications", 3.33], ["💡 Services publics", 2.55], ["🏠 Immobilier", 1.74]],
      "holdings": [["Nvidia", 4.79], ["Apple", 4.26], ["Microsoft", 3.51], ["Amazon", 2.35], ["Alphabet A", 1.84], ["TSMC", 1.72], ["Broadcom", 1.6], ["Alphabet C", 1.48], ["Meta", 1.17], ["Micron", 1.01]],
      "topWeight": 23.73
    }
  },
  "world-small-cap": {
    "2026-08-31": {
      "index": "MSCI World Small Cap",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-small-cap-index.pdf"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 3866,
      "markets": "23 pays développés, petites capitalisations",
      "marketCap": "10 840 milliards $ de capitalisation ajustée du flottant",
      "countries": [["🇺🇸 États-Unis", 61.76], ["🇯🇵 Japon", 12.58], ["🇬🇧 Royaume-Uni", 4.57], ["🇨🇦 Canada", 4.29], ["🇦🇺 Australie", 3.51], ["🌍 Autres", 13.29]],
      "sectors": [["🏭 Industrie", 19.31], ["🏦 Finance", 14.68], ["💻 Technologie", 14.33], ["🏥 Santé", 11.11], ["🛍️ Consommation discrétionnaire", 10.11], ["🪨 Matériaux", 8.31], ["🏠 Immobilier", 7.51], ["⚡ Énergie", 5.08], ["🛒 Consommation de base", 4], ["📡 Communication", 3.04], ["💡 Services publics", 2.52]],
      "holdings": [["Sandisk", 2.08], ["Moderna", 0.43], ["ATI", 0.26], ["nVent Electric", 0.22], ["Tenet Healthcare", 0.21], ["US Foods", 0.21], ["Carpenter Technology", 0.21], ["Royal Gold", 0.2], ["Roku A", 0.19], ["Woodward", 0.19]],
      "topWeight": 4.21
    }
  },
  "world-ex-usa": {
    "2026-08-31": {
      "index": "MSCI World ex USA",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-ex-usa-index.pdf"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 755,
      "markets": "22 pays développés, hors États-Unis",
      "marketCap": "25 547 milliards $ de capitalisation ajustée du flottant",
      "countries": [["🇯🇵 Japon", 20.73], ["🇬🇧 Royaume-Uni", 12.67], ["🇨🇦 Canada", 12.41], ["🇫🇷 France", 8.46], ["🇨🇭 Suisse", 8.09], ["🌍 Autres", 37.64]],
      "sectors": [["🏦 Finance", 28.01], ["🏭 Industrie", 17.79], ["💻 Technologie", 10.1], ["🏥 Santé", 8.89], ["🛍️ Consommation discrétionnaire", 7.67], ["🪨 Matériaux", 7.52], ["🛒 Consommation de base", 6.13], ["⚡ Énergie", 5.41], ["📡 Communication", 3.57], ["💡 Services publics", 3.55], ["🏠 Immobilier", 1.37]],
      "holdings": [["ASML", 2.56], ["HSBC", 1.39], ["Roche", 1.2], ["Royal Bank of Canada", 1.12], ["Novartis", 1.09], ["Shell", 1], ["Nestlé", 0.98], ["Siemens", 0.96], ["Mitsubishi UFJ", 0.96], ["AstraZeneca", 0.96]],
      "topWeight": 12.24
    }
  },
  "world": {
    "2026-08-31": {
      "index": "MSCI World",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-index.pdf"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 1280,
      "markets": "23 pays développés",
      "marketCap": "91 705 milliards $ de capitalisation ajustée du flottant",
      "countries": [["🇺🇸 États-Unis", 72.14], ["🇯🇵 Japon", 5.78], ["🇬🇧 Royaume-Uni", 3.53], ["🇨🇦 Canada", 3.46], ["🇫🇷 France", 2.36], ["🌍 Autres", 12.74]],
      "sectors": [["💻 Technologie", 29.81], ["🏦 Finance", 16.58], ["🏭 Industrie", 11.13], ["🏥 Santé", 9.27], ["🛍️ Consommation discrétionnaire", 8.82], ["📡 Communication", 7.9], ["🛒 Consommation de base", 4.91], ["⚡ Énergie", 4.09], ["🪨 Matériaux", 3.47], ["💡 Services publics", 2.39], ["🏠 Immobilier", 1.64]],
      "holdings": [["Nvidia", 5.56], ["Apple", 5.07], ["Microsoft", 3.9], ["Amazon", 2.74], ["Alphabet A", 2.15], ["Broadcom", 1.82], ["Alphabet C", 1.69], ["Meta", 1.37], ["Micron", 1.18], ["Tesla", 1.13]],
      "topWeight": 26.61
    },
    "legacy-undated": {
      "index": "MSCI World",
      "asOf": null,
      "snapshot": "juin–juillet 2026, date exacte non documentée",
      "constituents": 1283,
      "source": {
        "label": "MSCI, référence existante ; photographie historique non datée précisément",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-index.pdf"
      },
      "provenance": "Ancien comparateur, revue du 01/09/2026. Conservé pour traçabilité ; ne pas utiliser comme photographie actuelle."
    }
  },
  "stoxx600": {
    "2026-08-31": {
      "index": "STOXX Europe 600",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Factsheet STOXX, version EUR Price Return",
        "url": "https://stoxx.com/index/sxxp/?factsheet=true"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 600,
      "markets": "17 pays européens développés",
      "marketCap": "13 481 milliards € de capitalisation flottante",
      "countries": [["🇬🇧 Royaume-Uni", 22.9], ["🇫🇷 France", 15], ["🇨🇭 Suisse", 13.7], ["🇩🇪 Allemagne", 13.4], ["🇳🇱 Pays-Bas", 7.9], ["🇪🇸 Espagne", 6], ["🇮🇹 Italie", 5.7], ["🌍 Autres", 15.4]],
      "sectors": [["🏦 Banques", 15.7], ["🏭 Biens et services industriels", 15.4], ["🏥 Santé", 12.3], ["💻 Technologie", 8.9], ["⚡ Énergie", 6.5], ["🛡️ Assurance", 6], ["🛒 Alimentation et boissons", 4.9], ["💡 Services publics", 4.4], ["🛍️ Produits et services de consommation", 4.2], ["💰 Services financiers", 4.2]],
      "holdings": [["ASML", 4.18], ["HSBC", 2.274], ["Roche", 1.959], ["Novartis", 1.855], ["Shell", 1.634], ["AstraZeneca", 1.607], ["Nestlé", 1.605], ["Siemens", 1.555], ["SAP", 1.432], ["Banco Santander", 1.38]]
    }
  },
  "eurostoxx50": {
    "2026-08-31": {
      "index": "EURO STOXX 50",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Factsheet STOXX, version EUR Price Return",
        "url": "https://stoxx.com/index/sx5e/?factsheet=true"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 50,
      "markets": "grandes entreprises de la zone euro",
      "marketCap": "4 461 milliards € de capitalisation flottante",
      "countries": [["🇫🇷 France", 31.7], ["🇩🇪 Allemagne", 30.2], ["🇳🇱 Pays-Bas", 13.5], ["🇪🇸 Espagne", 11.6], ["🇮🇹 Italie", 8.9], ["🇧🇪 Belgique", 2.8], ["🇫🇮 Finlande", 1.3]],
      "sectors": [["🏦 Banques", 19.7], ["🏭 Biens et services industriels", 17.4], ["💻 Technologie", 15.8], ["⚡ Énergie", 7.5], ["🛡️ Assurance", 7], ["🛍️ Produits et services de consommation", 6.4], ["🏥 Santé", 5.4], ["💡 Services publics", 4.5], ["🧪 Chimie", 3.5], ["🚘 Automobiles", 2.6]],
      "holdings": [["ASML", 8.689], ["Siemens", 4.699], ["SAP", 4.329], ["Banco Santander", 4.17], ["TotalEnergies", 3.854], ["Allianz", 3.844], ["Schneider Electric", 3.811], ["BBVA", 3.161], ["UniCredit", 2.844], ["Iberdrola", 2.83]]
    }
  },
  "mscieurope": {
    "2026-08-31": {
      "index": "MSCI Europe",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-europe-index-eur-net.pdf"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 396,
      "markets": "15 pays développés en Europe",
      "marketCap": "12 453 milliards € de capitalisation ajustée du flottant",
      "countries": [["🇬🇧 Royaume-Uni", 22.38], ["🇫🇷 France", 14.93], ["🇨🇭 Suisse", 14.29], ["🇩🇪 Allemagne", 13.99], ["🇳🇱 Pays-Bas", 8.79], ["🌍 Autres", 25.61]],
      "sectors": [["🏦 Finance", 25.76], ["🏭 Industrie", 18.87], ["🏥 Santé", 12.7], ["💻 Technologie", 9], ["🛒 Consommation de base", 8.29], ["🛍️ Consommation discrétionnaire", 6.31], ["🪨 Matériaux", 5.55], ["⚡ Énergie", 4.96], ["💡 Services publics", 4.71], ["📡 Communication", 3.27], ["🏠 Immobilier", 0.6]],
      "holdings": [["ASML", 4.53], ["HSBC", 2.46], ["Roche", 2.12], ["Novartis", 1.93], ["Shell", 1.76], ["Nestlé", 1.74], ["Siemens", 1.7], ["AstraZeneca", 1.7], ["SAP", 1.6], ["Banco Santander", 1.45]],
      "topWeight": 20.99
    }
  },
  "em-esg": {
    "2026-08-31": {
      "index": "MSCI EM ex-Egypt ESG Broad CTB Select",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition de l’indice, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-em-ex-egypt-esg-leaders-select-issuer-capped-index-usd-net.pdf"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 1048,
      "markets": "23 marchés émergents, Égypte exclue",
      "countries": [["🇹🇼 Taïwan", 27.75], ["🇰🇷 Corée du Sud", 20.83], ["🇨🇳 Chine", 20.71], ["🇮🇳 Inde", 11.15], ["🇧🇷 Brésil", 3.76], ["🌍 Autres", 15.8]],
      "sectors": [["💻 Technologie", 41.72], ["🏦 Finance", 20.3], ["🛍️ Consommation discrétionnaire", 8.17], ["🏭 Industrie", 6.36], ["📡 Communication", 6.04], ["🪨 Matériaux", 5.77], ["🛒 Consommation de base", 3.22], ["⚡ Énergie", 3.08], ["🏥 Santé", 2.59], ["💡 Services publics", 1.45], ["🏠 Immobilier", 1.31]],
      "holdings": [["TSMC", 15.22], ["Samsung Electronics", 7.16], ["SK Hynix", 5.55], ["Tencent", 2.79], ["Alibaba", 1.94], ["MediaTek", 1.42], ["Samsung Electronics Pref.", 1.03], ["China Construction Bank", 1.01], ["Delta Electronics", 1], ["Reliance Industries", 0.84]],
      "topWeight": 37.96
    }
  },
  "sp500-pea": {
    "2026-06-30": {
      "index": "S&P 500",
      "asOf": "2026-06-30",
      "snapshot": "30 juin 2026",
      "source": {
        "label": "Composition et performances de l’ETF, Amundi",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871128/FRA/FRA/RETAIL/ETF/20260630"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 504,
      "markets": "États-Unis, selon la classification de la fiche Amundi",
      "countries": [["🇺🇸 États-Unis", 100]],
      "sectors": [["💻 Technologie", 37.37], ["🏦 Finance", 11.87], ["📡 Communication", 9.76], ["🛍️ Consommation discrétionnaire", 9.38], ["🏥 Santé", 9.07], ["🏭 Industrie", 8.88], ["🛒 Consommation de base", 4.68], ["⚡ Énergie", 3.02], ["💡 Services publics", 2.25], ["🏠 Immobilier", 1.88], ["🪨 Matériaux", 1.84]],
      "holdings": [["Nvidia", 7.38], ["Apple", 6.47], ["Microsoft", 4.28], ["Amazon", 3.68], ["Alphabet A", 3.24], ["Broadcom", 2.76], ["Alphabet C", 2.6], ["Micron", 2.02], ["Meta", 1.93], ["Tesla", 1.81]],
      "topWeight": 36.17
    }
  },
  "nasdaq-pea": {
    "2026-08-31": {
      "index": "NASDAQ-100 Notional Net Total Return",
      "asOf": "2026-08-31",
      "snapshot": "31 août 2026",
      "source": {
        "label": "Composition et performances de l’ETF, Amundi",
        "url": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/RETAIL/ETF/20260831"
      },
      "provenance": "Migration de la fiche existante ; aucune nouvelle vérification externe.",
      "constituents": 102,
      "markets": "grandes sociétés non financières cotées au Nasdaq",
      "countries": [["🇺🇸 États-Unis", 94.78], ["🇮🇪 Irlande", 1.82], ["🇳🇱 Pays-Bas", 1.32], ["🇨🇦 Canada", 1], ["🇬🇧 Royaume-Uni", 0.66], ["🌍 Autres", 0.42]],
      "sectors": [["💻 Technologie", 58.27], ["📡 Communication", 13.89], ["🛍️ Consommation discrétionnaire", 11.13], ["🛒 Consommation de base", 6.22], ["🏥 Santé", 4.01], ["🏭 Industrie", 3.62], ["💡 Services publics", 1.14], ["🪨 Matériaux", 1], ["⚡ Énergie", 0.52], ["🏦 Finance", 0.21]],
      "holdings": [["Nvidia", 8.41], ["Apple", 7.5], ["Microsoft", 6.09], ["Micron", 4.64], ["Amazon", 4.58], ["AMD", 3.35], ["Alphabet A", 3.22], ["Alphabet C", 2.99], ["Broadcom", 2.79], ["Tesla", 2.78]],
      "topWeight": 46.35
    }
  }
};

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
deepFreeze(INDEX_FACTS);

export function getIndexFacts(id, asOf) {
  const facts = INDEX_FACTS[id]?.[asOf];
  if (!facts) throw new Error(`Photographie d’indice absente : ${id} / ${asOf}`);
  return facts;
}

// Façade de composition : ne fournit jamais les rendements de l’indice ou de l’ETF.
export function getIndexComposition(id, asOf) {
  const facts = getIndexFacts(id, asOf);
  const { constituents, markets, marketCap, countries, sectors, holdings, topWeight } = facts;
  return { indexFacts: facts, constituents, markets, marketCap, countries, sectors, holdings, topWeight };
}
export function formatIndexConstituents(id, asOf) {
  return getIndexFacts(id, asOf).constituents.toLocaleString('fr-FR').replaceAll('\u202f', ' ');
}
