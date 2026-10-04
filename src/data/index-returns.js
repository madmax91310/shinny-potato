import { INDEX_COMPARISON_RETURN_ADDITIONS } from './index-comparison-return-additions.js';
import { RUSSELL_INDEX_RETURNS } from './new-index-returns.js';
import { INDEX_FACTS } from './index-facts.js';
import { normalizeEvidence } from './evidence.js';
// Séries d’indices distinctes des rendements des parts ETF ; valeurs migrées sans correction.
export const INDEX_RETURNS = {
'russell-2000': RUSSELL_INDEX_RETURNS,
  "em-standard": {
    "2026-08-31": {
      "values": [
        [
          2025,
          33.57
        ],
        [
          2024,
          7.5
        ],
        [
          2023,
          9.83
        ],
        [
          2022,
          -20.09
        ],
        [
          2021,
          -2.54
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI Emerging Markets, rendements nets en dollars, dividendes réinvestis",
        "date": "31 août 2026",
        "tenYear": 9.29
      },
      "source": {
        "label": "Indice, composition et rendements nets USD · MSCI, 31/08/2026",
        "url": "https://www.msci.com/documents/10199/c0db0a48-01f2-4ba9-ad01-226fd5678111"
      }
    }
  },
  "acwi": {
    "2026-08-31": {
      "values": [
        [
          2025,
          22.87
        ],
        [
          2024,
          18.02
        ],
        [
          2023,
          22.81
        ],
        [
          2022,
          -17.96
        ],
        [
          2021,
          19.04
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI ACWI, rendement brut en dollars, dividendes réinvestis",
        "date": "31 août 2026",
        "tenYear": 13.12
      },
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-acwi.pdf"
      }
    }
  },
  "ftse-all-world": {
    "2026-08-31": {
      "values": [
        [
          2025,
          23.1
        ],
        [
          2024,
          17.7
        ],
        [
          2023,
          22.6
        ],
        [
          2022,
          -17.7
        ],
        [
          2021,
          18.9
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "FTSE All-World, rendement total en dollars, dividendes réinvestis ; secteurs selon la classification ICB de FTSE",
        "date": "31 août 2026",
        "annualizedFiveYear": 11.4
      },
      "source": {
        "label": "Composition et performances, FTSE Russell",
        "url": "https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=AWORLDS&openfile=open"
      }
    }
  },
  "world-small-cap": {
    "2026-08-31": {
      "values": [
        [
          2025,
          20.44
        ],
        [
          2024,
          8.65
        ],
        [
          2023,
          16.34
        ],
        [
          2022,
          -18.37
        ],
        [
          2021,
          16.18
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World Small Cap, rendement brut en dollars, dividendes réinvestis",
        "date": "31 août 2026",
        "tenYear": 10.8
      },
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-small-cap-index.pdf"
      }
    }
  },
  "world-ex-usa": {
    "2026-08-31": {
      "values": [
        [
          2025,
          32.55
        ],
        [
          2024,
          5.26
        ],
        [
          2023,
          18.6
        ],
        [
          2022,
          -13.82
        ],
        [
          2021,
          13.17
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World ex USA, rendement brut en dollars, dividendes réinvestis",
        "date": "31 août 2026",
        "tenYear": 10.33
      },
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-ex-usa-index.pdf"
      }
    }
  },
  "world": {
    "2026-08-31": {
      "values": [
        [
          2025,
          21.6
        ],
        [
          2024,
          19.19
        ],
        [
          2023,
          24.42
        ],
        [
          2022,
          -17.73
        ],
        [
          2021,
          22.35
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI World, rendement brut en dollars, dividendes réinvestis",
        "date": "31 août 2026",
        "tenYear": 13.56
      },
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-world-index.pdf"
      }
    }
  },
  "stoxx600": {
    "2026-08-31": {
      "values": [
        [
          2025,
          16.94
        ],
        [
          2024,
          6.05
        ],
        [
          2023,
          12.94
        ],
        [
          2022,
          -13.04
        ],
        [
          2021,
          22.44
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "STOXX Europe 600, en EUR, hors dividendes (Price Return)",
        "date": "31 août 2026",
        "trailingOneYear": 18.4,
        "annualizedFiveYear": 6.8
      },
      "source": {
        "label": "Factsheet STOXX, version EUR Price Return",
        "url": "https://stoxx.com/index/sxxp/?factsheet=true"
      }
    }
  },
  "eurostoxx50": {
    "2026-08-31": {
      "values": [
        [
          2025,
          18.6
        ],
        [
          2024,
          8.38
        ],
        [
          2023,
          19.51
        ],
        [
          2022,
          -11.87
        ],
        [
          2021,
          21.17
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "EURO STOXX 50, en EUR, hors dividendes (Price Return)",
        "date": "31 août 2026",
        "trailingOneYear": 20,
        "annualizedFiveYear": 9
      },
      "source": {
        "label": "Factsheet STOXX, version EUR Price Return",
        "url": "https://stoxx.com/index/sx5e/?factsheet=true"
      }
    }
  },
  "mscieurope": {
    "2026-08-31": {
      "values": [
        [
          2025,
          19.39
        ],
        [
          2024,
          8.59
        ],
        [
          2023,
          15.83
        ],
        [
          2022,
          -9.49
        ],
        [
          2021,
          25.13
        ]
      ],
      "performance": {
        "kind": "indice",
        "detail": "MSCI Europe, rendement net en euros, dividendes réinvestis",
        "date": "31 août 2026",
        "tenYear": 9.31
      },
      "source": {
        "label": "Composition et performances, MSCI",
        "url": "https://www.msci.com/documents/10199/255599/msci-europe-index-eur-net.pdf"
      }
    }
  }
};
for (const [id, history] of Object.entries(INDEX_COMPARISON_RETURN_ADDITIONS)) INDEX_RETURNS[id] = { ...INDEX_RETURNS[id], ...history };
for (const [id, history] of Object.entries(INDEX_RETURNS)) for (const [asOf, series] of Object.entries(history)) {
  series.metadata = normalizeEvidence({ url: series.source.url, asOf, checkedAt: series.checkedAt ?? (INDEX_FACTS[id]?.[asOf]?.source.url === series.source.url ? INDEX_FACTS[id]?.[asOf]?.metadata.checkedAt : null), periodStart: series.periodStart ?? '2021-01-01', periodEnd: series.periodEnd ?? '2025-12-31', scope: `${series.performance.kind === 'actif' ? 'Actif' : 'Indice'} ${id}`,
    currency: series.currency ?? (/dollars|USD/.test(series.performance.detail) ? 'USD' : /euros|EUR/.test(series.performance.detail) ? 'EUR' : null),
    method: series.performance.detail, note: series.note ?? 'Série historique d’indice ; ne remplace jamais le rendement d’une part.' });
}
export function getIndexReturns(id, asOf) {
  const series = INDEX_RETURNS[id]?.[asOf];
  if (!series) throw new Error(`Rendements d’indice absents : ${id}/${asOf}`);
  return series.values;
}
