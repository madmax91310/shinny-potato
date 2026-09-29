// Caractéristiques par ISIN des 41 parts des Fiches ETF.
// benchmark, incomePolicy, replicationMethod et domicile ont été contrôlés le 29/09/2026
// dans characteristicsSource (émetteur pour IE00BFZPF546 et IE00BM8R0J59,
// justETF pour les autres).
// Les tickers, le libellé de distribution et le lieu reprennent la revue historique
// des fiches, datée par reviewedAt. Ils ne sont pas certifiés par ce contrôle.
// PEA reste dans instruments.js : le statut ne se déduit ni du domicile ni de l'indice.
// Les ETC et ETP gardent leur nature distincte des fonds ETF.
export const INSTRUMENT_FACTS_BY_ISIN = Object.freeze({
  "IE000DQLYVB9": {
    "tickers": [
      "SPEA"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication synthétique (swap)",
    "benchmark": "S&P 500®",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "27/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000DQLYVB9",
      "checkedAt": "2026-09-29"
    }
  },
  "FR0013411998": {
    "tickers": [
      "PTPXH"
    ],
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique, couverture du yen en euros",
    "benchmark": "TOPIX® (EUR Hedged)",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": "JPY/EUR",
    "reviewedAt": "27/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0013411998",
      "checkedAt": "2026-09-29"
    }
  },
  "LU1834983550": {
    "tickers": [],
    "distribution": "Capitalisant",
    "location": "Luxembourg, réplication synthétique (swap)",
    "benchmark": "STOXX® Europe 600 Basic Resources",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "Luxembourg",
    "currencyHedge": null,
    "reviewedAt": "27/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1834983550",
      "checkedAt": "2026-09-29"
    }
  },
  "FR001400U5Q4": {
    "tickers": [
      "DCAM"
    ],
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique (swap)",
    "benchmark": "MSCI World",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR001400U5Q4",
      "checkedAt": "2026-09-29"
    }
  },
  "FR0011871128": {
    "tickers": [
      "PSP5"
    ],
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique (swap)",
    "benchmark": "S&P 500®",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0011871128",
      "checkedAt": "2026-09-29"
    }
  },
  "FR0011871110": {
    "tickers": [
      "PUST"
    ],
    "distribution": "Capitalisant",
    "location": "France, réplication synthétique (swap)",
    "benchmark": "Nasdaq 100®",
    "incomePolicy": "accumulating",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0011871110",
      "checkedAt": "2026-09-29"
    }
  },
  "LU1681047236": {
    "tickers": [
      "C50"
    ],
    "distribution": "Capitalisant",
    "location": "Luxembourg, réplication physique intégrale",
    "benchmark": "EURO STOXX® 50",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Luxembourg",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1681047236",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BKM4GZ66": {
    "tickers": [
      "EMIM"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI Emerging Markets Investable Market (IMI)",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BKM4GZ66",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B6R52259": {
    "tickers": [
      "SSAC"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée (échantillonnage)",
    "benchmark": "MSCI All Country World (ACWI)",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "08/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B6R52259",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BK5BQT80": {
    "tickers": [
      "VWCE"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée (échantillonnage)",
    "benchmark": "FTSE All-World",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "08/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BQT80",
      "checkedAt": "2026-09-29"
    }
  },
  "IE000I8KRLL9": {
    "tickers": [
      "SEMI"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI ACWI IMI Semiconductors & Semiconductor Equipment ESG Screened Select Capped",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000I8KRLL9",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BYXG2H39": {
    "tickers": [
      "BTEC"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée (échantillonnage)",
    "benchmark": "Nasdaq Biotechnology",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BYXG2H39",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BYTRR863": {
    "tickers": [
      "WNRG"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI World Energy",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BYTRR863",
      "checkedAt": "2026-09-29"
    }
  },
  "IE000YYE6WK5": {
    "tickers": [
      "DFNS",
      "DFND"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MarketVector Global Defense Industry",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000YYE6WK5",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BYPLS672": {
    "tickers": [
      "ISPY"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "ISE Cyber Security UCITS",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BYPLS672",
      "checkedAt": "2026-09-29"
    }
  },
  "FR0010527275": {
    "tickers": [
      "WAT"
    ],
    "distribution": "Distribuant",
    "location": "France, réplication physique intégrale",
    "benchmark": "MSCI ACWI IMI Water Filtered",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "France",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0010527275",
      "checkedAt": "2026-09-29"
    }
  },
  "LU1681048630": {
    "tickers": [
      "GLUX"
    ],
    "distribution": "Capitalisant",
    "location": "Luxembourg, réplication physique intégrale",
    "benchmark": "S&P Global Luxury",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Luxembourg",
    "currencyHedge": null,
    "reviewedAt": "25/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1681048630",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BJ5JP097": {
    "tickers": [
      "WFNS"
    ],
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique",
    "benchmark": "MSCI World Financials Advanced Select 20 35 Capped",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "08/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JP097",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B1FZS350": {
    "tickers": [
      "IWDP"
    ],
    "distribution": "Distribuant (trimestriel)",
    "location": "Irlande, réplication physique",
    "benchmark": "FTSE EPRA/NAREIT Developed Dividend+",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "08/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B1FZS350",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BJ5JNY98": {
    "tickers": [
      "WITS"
    ],
    "distribution": "Distribuant (semestriel)",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI World Information Technology Advanced Select 20 35 Capped",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "08/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JNY98",
      "checkedAt": "2026-09-29"
    }
  },
  "IE0007Y8Y157": {
    "tickers": [
      "QUTM",
      "QNTM"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MarketVector Global Quantum Leaders",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE0007Y8Y157",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BK5BCD43": {
    "tickers": [
      "AIAI"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "ROBO Global Artificial Intelligence",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BCD43",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BYZK4552": {
    "tickers": [
      "RBOT"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée (échantillonnage)",
    "benchmark": "iSTOXX® FactSet Automation & Robotics",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BYZK4552",
      "checkedAt": "2026-09-29"
    }
  },
  "IE000RDRMSD1": {
    "tickers": [
      "BLKC"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "NYSE FactSet Global Blockchain Technologies Capped",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000RDRMSD1",
      "checkedAt": "2026-09-29"
    }
  },
  "IE000M7V94E1": {
    "tickers": [
      "NUKL"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MarketVector Global Uranium and Nuclear Energy Infrastructure",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000M7V94E1",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BF0M2Z96": {
    "tickers": [
      "BATT"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "Solactive Battery Value-Chain",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BF0M2Z96",
      "checkedAt": "2026-09-29"
    }
  },
  "IE000YU9K6K2": {
    "tickers": [
      "JEDI"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique",
    "benchmark": "MarketVector Global Space Industry Screened",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE000YU9K6K2",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B6YX5D40": {
    "tickers": [
      "USDV"
    ],
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "S&P High Yield Dividend Aristocrats",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B6YX5D40",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BM8R0J59": {
    "tickers": [
      "QYLE"
    ],
    "distribution": "Distribuant (mensuel)",
    "location": "Irlande, réplication synthétique (swap) avec stratégie de vente d’options",
    "benchmark": "Cboe Nasdaq-100 BuyWrite v2 UCITS",
    "incomePolicy": "distributing",
    "replicationMethod": "Synthetic (Unfunded swap)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://globalxetfs.eu/fr/funds/qyld",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B8FHGS14": {
    "tickers": [
      "MVOL"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Minimum Volatility",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B8FHGS14",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BP3QZB59": {
    "tickers": [
      "IWVL",
      "WVAL"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique intégrale",
    "benchmark": "MSCI World Enhanced Value",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Full replication)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZB59",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BF4RFH31": {
    "tickers": [
      "WSML"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Small Cap",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BF4RFH31",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BP3QZ601": {
    "tickers": [
      "IWQU",
      "IWFQ"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Sector Neutral Quality",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "10/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZ601",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BP3QZ825": {
    "tickers": [
      "IWMO"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique optimisée",
    "benchmark": "MSCI World Momentum",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Optimized sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "08/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZ825",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B4ND3602": {
    "tickers": [
      "SGLN",
      "IGLN"
    ],
    "distribution": "Capitalisant (pas de revenu versé — l'or n'en génère aucun)",
    "location": "Irlande, adossé à de l'or physique alloué (pas de réplication synthétique)",
    "benchmark": "Gold",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Physically backed)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4ND3602",
      "checkedAt": "2026-09-29"
    }
  },
  "GB00BLD4ZL17": {
    "tickers": [
      "BITC"
    ],
    "distribution": "Capitalisant (pas de revenu versé)",
    "location": "Jersey, adossé à du bitcoin physiquement détenu (pas un produit dérivé/synthétique)",
    "benchmark": "Bitcoin",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Physically backed)",
    "domicile": "Jersey",
    "currencyHedge": null,
    "reviewedAt": "25/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=GB00BLD4ZL17",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B4WXJJ64": {
    "tickers": [
      "SEGA"
    ],
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique par échantillonnage",
    "benchmark": "Bloomberg Euro Treasury Bond",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "22/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4WXJJ64",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B66F4759": {
    "tickers": [
      "IHYA",
      "EHYA"
    ],
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique par échantillonnage",
    "benchmark": "iBoxx® EUR Liquid High Yield",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "25/08/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B66F4759",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00B3F81R35": {
    "tickers": [
      "IEAC"
    ],
    "distribution": "Distribuant",
    "location": "Irlande, réplication physique par échantillonnage",
    "benchmark": "Bloomberg Euro Corporate Bond",
    "incomePolicy": "distributing",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "14/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B3F81R35",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BF3N7094": {
    "tickers": [
      "HIGH"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique",
    "benchmark": "iBoxx® EUR Liquid High Yield",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "14/09/2026",
    "characteristicsSource": {
      "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BF3N7094",
      "checkedAt": "2026-09-29"
    }
  },
  "IE00BFZPF546": {
    "tickers": [
      "EMGA"
    ],
    "distribution": "Capitalisant",
    "location": "Irlande, réplication physique",
    "benchmark": "JP Morgan GBI-EM Global Diversified 10% Cap 1% Floor",
    "incomePolicy": "accumulating",
    "replicationMethod": "Physical (Sampling)",
    "domicile": "Irlande",
    "currencyHedge": null,
    "reviewedAt": "14/09/2026",
    "characteristicsSource": {
      "url": "https://www.ishares.com/uk/professionals/en/products/297676/ishares-j-p-morgan-em-local-govt-bond-ucits-etf-usd-%28acc%29-fund",
      "checkedAt": "2026-09-29"
    }
  }
});

export function getInstrumentFacts(isin) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin];
  if (!facts) throw new Error(`Caractéristiques absentes pour ${isin}`);
  return facts;
}

export function getInstrumentTickers(isin) {
  return getInstrumentFacts(isin).tickers;
}

export function getInstrumentDistribution(isin) {
  return getInstrumentFacts(isin).distribution;
}

export function getInstrumentLocation(isin) {
  return getInstrumentFacts(isin).location;
}
