import { EXPOSURE_ADDITIONS } from './exposure-additions.js';
// Cotations contrôlées le 30/09/2026 auprès des émetteurs et des places.
// Sous-ensemble documenté, pas une liste exhaustive des marchés disponibles.
// currency est la devise de négociation, jamais celle du fonds par déduction.
export const INSTRUMENT_LISTINGS_BY_ISIN = Object.freeze({
  FR001400ZGO4: [{"ticker": "PEMS", "exchange": "Euronext Paris", "mic": "XPAR", "currency": "EUR", "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR001400ZGO4/FRA/FRA/RETAIL/ETF/20260831", "checkedAt": "2026-10-09", "evidenceId": "FR001400ZGO4-XPAR-PEMS-EUR"}],
...{
  "LU1834983550": [
    {
      "ticker": "BRES",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834983550/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-04",
      "evidenceId": "LU1834983550-XPAR-BRES-EUR"
    }
  ],
  "IE00B5BMR087": [
    {
      "ticker": "CSPX",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/cspx-ishares-core-s-p-500-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B5BMR087-XLON-CSPX-USD"
    }
  ],
  "IE00B53SZB19": [
    {
      "ticker": "CNDX",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/253741/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B53SZB19-XAMS-CNDX-EUR"
    }
  ],
  "FR0010342592": [
    {
      "ticker": "LQQ",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010342592/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-04",
      "evidenceId": "FR0010342592-XPAR-LQQ-EUR"
    }
  ],
  "FR0010755611": [
    {
      "ticker": "CL2",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010755611/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-04",
      "evidenceId": "FR0010755611-XPAR-CL2-EUR"
    }
  ],
  "FR0013380607": [
    {
      "ticker": "CACC",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013380607/FRA/FRA/RETAIL/ETF",
      "checkedAt": "2026-10-04",
      "evidenceId": "FR0013380607-XPAR-CACC-EUR"
    }
  ],
  "IE00B53L3W79": [
    {
      "ticker": "CSX5",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/cssx5e-ishares-core-euro-stoxx-50-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B53L3W79-XLON-CSX5-EUR"
    }
  ],
  "IE00B4K48X80": [
    {
      "ticker": "SMEA",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/smea-ishares-core-msci-europe-ucits-etf-eur-acc-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B4K48X80-XLON-SMEA-GBP"
    }
  ],
  "IE00B43HR379": [
    {
      "ticker": "QDVG",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/280507/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B43HR379-XETR-QDVG-EUR"
    }
  ],
  "IE00B4NCWG09": [
    {
      "ticker": "SSLN",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/258443/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B4NCWG09-XPAR-SSLN-EUR"
    }
  ],
  "IE00BDFL4P12": [
    {
      "ticker": "ICOM",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/icom-ishares-diversified-commodity-swap-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BDFL4P12-XLON-ICOM-USD"
    }
  ],
  "GB00BLD4ZM24": [
    {
      "ticker": "CETH",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://coinshares.com/en/d/etp/factsheet/physical-ethereum/",
      "checkedAt": "2026-10-04",
      "evidenceId": "GB00BLD4ZM24-XPAR-CETH-EUR"
    }
  ],
  "LU1437018838": [
    {
      "ticker": "EPRA",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-04",
      "evidenceId": "LU1437018838-XPAR-EPRA-EUR"
    }
  ],
  "IE00BYYHSQ67": [
    {
      "ticker": "WQDV",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/wqdv-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BYYHSQ67-XLON-WQDV-USD"
    }
  ],
  "JE00B1VS3770": [
    {
      "ticker": "PHAU",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/MSL/EU/EN-GB/JE00B1VS3770",
      "checkedAt": "2026-10-04",
      "evidenceId": "JE00B1VS3770-ETFP-PHAU-EUR"
    }
  ],
  "GB00BJYDH287": [
    {
      "ticker": "WBTC",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/WIXL/EU/EN-GB/GB00BJYDH287",
      "checkedAt": "2026-10-04",
      "evidenceId": "GB00BJYDH287-ETFP-WBTC-EUR"
    }
  ],
  "LU1931975079": [
    {
      "ticker": "ETFCOR",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1931975079/FRA/FRA/INSTITUTIONNEL/ETF/20260731",
      "checkedAt": "2026-10-04",
      "evidenceId": "LU1931975079-ETFP-ETFCOR-EUR"
    }
  ],
  "IE00B3T9LM79": [
    {
      "ticker": "EUCO",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-bloomberg-euro-corporate-bond-ucits-etf-dist-sybc-gy",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B3T9LM79-ETFP-EUCO-EUR"
    }
  ],
  "IE00B44Z5B48": [
    {
      "ticker": "ACWE",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/intermediary/etfs/state-street-spdr-msci-all-country-world-ucits-etf-acc-spyy-gy",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B44Z5B48-XPAR-ACWE-EUR"
    }
  ],
  "LU1681045370": [
    {
      "ticker": "AEEM",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681045370/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-04",
      "evidenceId": "LU1681045370-XPAR-AEEM-EUR"
    }
  ],
  "IE00B469F816": [
    {
      "ticker": "EMRG",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-msci-emerging-markets-ucits-etf-spym-gy",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B469F816-ETFP-EMRG-EUR"
    }
  ],
  "IE00B14X4Q57": [
    {
      "ticker": "IBGS",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/literature/fact-sheet/ibgs-ishares-govt-bond-1-3yr-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B14X4Q57-XLON-IBGS-GBP"
    }
  ],
  "IE00BMW42413": [
    {
      "ticker": "ESIT",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/315818/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BMW42413-XETR-ESIT-EUR"
    }
  ],
  "IE0000N55FP4": [
    {
      "ticker": "ESCE",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/348766/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE0000N55FP4-XAMS-ESCE-EUR"
    }
  ],
  "IE00B42NKQ00": [
    {
      "ticker": "IUES",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/iues-ishares-s-p-500-energy-sector-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B42NKQ00-XLON-IUES-USD"
    }
  ],
  "IE00B3WJKG14": [
    {
      "ticker": "IUIT",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/iuit-ishares-s-p-500-information-technology-sector-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B3WJKG14-XLON-IUIT-USD"
    }
  ],
  "IE00BG0J4C88": [
    {
      "ticker": "LOCK",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/lock-ishares-digital-security-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BG0J4C88-XLON-LOCK-USD"
    }
  ],
  "IE00B40B8R38": [
    {
      "ticker": "IUCS",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/iucs-ishares-s-p-500-consumer-staples-sector-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B40B8R38-XLON-IUCS-USD"
    }
  ],
  "IE00B4KBBD01": [
    {
      "ticker": "IUUS",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/iuus-ishares-s-p-500-utilities-sector-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B4KBBD01-XLON-IUUS-USD"
    }
  ],
  "NL0011683594": [
    {
      "ticker": "TDIV",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/tdiv-fact-sheet.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "NL0011683594-XPAR-TDIV-EUR"
    }
  ],
  "NL0009690239": [
    {
      "ticker": "TRET",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/tret-fact-sheet.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "NL0009690239-XAMS-TRET-EUR"
    }
  ],
  "LU2970735911": [
    {
      "ticker": "AEHY",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU2970735911/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-10-04",
      "evidenceId": "LU2970735911-XETR-AEHY-EUR"
    }
  ],
  "IE00BK95B138": [
    {
      "ticker": "SNA2",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/309947/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BK95B138-XETR-SNA2-EUR"
    }
  ],
  "IE00B4L5YX21": [
    {
      "ticker": "IJPA",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251867/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B4L5YX21-XAMS-IJPA-EUR"
    }
  ],
  "IE00B5W4TY14": [
    {
      "ticker": "CSKR",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/253733",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B5W4TY14-ETFP-CSKR-EUR"
    }
  ],
  "IE00B0M63623": [
    {
      "ticker": "ITWN",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/itwn-ishares-msci-taiwan-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B0M63623-XLON-ITWN-GBP"
    }
  ],
  "IE00BKPX3K41": [
    {
      "ticker": "IS3Z",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/313316/ishares-msci-ac-far-east-ex-japan-ucits-etf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BKPX3K41-XETR-IS3Z-EUR"
    }
  ],
  "IE00B4JNQZ49": [
    {
      "ticker": "QDVH",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/280523/",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B4JNQZ49-XETR-QDVH-EUR"
    }
  ],
  "IE00BK5BR626": [
    {
      "ticker": "VHYA",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vanguard.co.uk/professional/product/etf/equity/9677/ftse-all-world-high-dividend-yield-ucits",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BK5BR626-ETFP-VHYA-EUR"
    }
  ],
  "IE00B8GKDB10": [
    {
      "ticker": "VHYL",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vanguard.co.uk/professional/product/etf/equity/9506/ftse-all-world-high-dividend-yield-ucits-etf-usd-distributing",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B8GKDB10-ETFP-VHYL-EUR"
    }
  ],
  "IE00BK5BR733": [
    {
      "ticker": "VFEA",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vanguard.co.uk/professional/product/etf/equity/9678/ftse-emerging-markets-ucits",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BK5BR733-ETFP-VFEA-EUR"
    }
  ],
  "IE00BZ163G84": [
    {
      "ticker": "VECP",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vanguard.co.uk/professional/product/etf/bond/9659/eur-corporate-bond-ucits-etf-eur-distributing",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BZ163G84-ETFP-VECP-EUR"
    }
  ],
  "IE00BKPSFC54": [
    {
      "ticker": "WQDA",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/gls-download/literature/fact-sheet/wqda-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BKPSFC54-XAMS-WQDA-USD"
    }
  ],
  "IE00B1XNHC34": [
    {
      "ticker": "INRG",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/ch/privatkunden/de/literature/fact-sheet/inrg-ishares-global-clean-energy-transition-ucits-etf-fund-fact-sheet-de-ch.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B1XNHC34-XLON-INRG-GBP"
    }
  ],
  "DE000A27Z304": [
    {
      "ticker": "BTCE",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://bitwiseinvestments.eu/de/products/bitwise-physical-bitcoin-etp/",
      "checkedAt": "2026-10-04",
      "evidenceId": "DE000A27Z304-XETR-BTCE-EUR"
    }
  ],
  "CH0454664001": [
    {
      "ticker": "ABTC",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://cdn.21shares.com/uploads/current-documents/factsheets/all/Factsheet_ABTC.pdf",
      "checkedAt": "2026-10-04",
      "evidenceId": "CH0454664001-XPAR-ABTC-EUR"
    }
  ],
  "IE00B9CQXS71": [
    {
      "ticker": "ZPRG",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/uk/en_gb/intermediary/etfs/spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B9CQXS71-XETR-ZPRG-EUR"
    }
  ],
  "LU1737652823": [
    {
      "ticker": "10AJ",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.justetf.com/en/etf-profile.html?isin=LU1737652823",
      "checkedAt": "2026-10-04",
      "evidenceId": "LU1737652823-XETR-10AJ-EUR"
    }
  ],
  "IE00BD6FTQ80": [
    {
      "ticker": "CMOD",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.justetf.com/en/etf-profile.html?isin=IE00BD6FTQ80",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00BD6FTQ80-ETFP-CMOD-EUR"
    }
  ],
  "FR0013416716": [
    {
      "ticker": "GOLD",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.justetf.com/en/etf-profile.html?isin=FR0013416716",
      "checkedAt": "2026-10-04",
      "evidenceId": "FR0013416716-XPAR-GOLD-EUR"
    }
  ],
  "IE00B579F325": [
    {
      "ticker": "SGLD",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://live.euronext.com/en/product/etfs/IE00B579F325-XAMS/financial-calendar",
      "checkedAt": "2026-10-04",
      "evidenceId": "IE00B579F325-XAMS-SGLD-EUR"
    }
  ]
},
...Object.fromEntries(EXPOSURE_ADDITIONS.filter(r => r.ticker).map(r => [r.isin, [{ ticker: r.ticker, exchange: r.exchange, mic: r.mic, currency: 'EUR', sourceUrl: r.listingSource ?? r.source, checkedAt: r.checkedAt ?? '2026-10-03', evidenceId: `${r.isin}-${r.mic}-${r.ticker}-EUR` }]])),
  "LU0290358497": [
  {
    "ticker": "XEON",
    "exchange": "Xetra",
    "mic": "XETR",
    "currency": "EUR",
    "sourceUrl": "https://etf.dws.com/download/asset/5643099c-7044-46a2-bfd8-b24c4752c7f6",
    "checkedAt": "2026-10-01",
    "evidenceId": "LU0290358497-XETR-XEON-EUR"
  }
],
  "IE00B3FH7618": [
  {
    "ticker": "IEGE",
    "exchange": "Euronext Amsterdam",
    "mic": "XAMS",
    "currency": "EUR",
    "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251741/ishares-euro-government-bond-01yr-ucits-etf",
    "checkedAt": "2026-10-01",
    "evidenceId": "IE00B3FH7618-XAMS-IEGE-EUR"
  }
],
  "IE00BDBRDM35": [
  {
    "ticker": "AGGH",
    "exchange": "Borsa Italiana",
    "mic": "ETFP",
    "currency": "EUR",
    "sourceUrl": "https://www.ishares.com/uk/individual/en/products/291770/ishares-global-aggregate-bond-ucits-etf-eur-hedged-%28acc%29-fund?siteEntryPassthrough=true",
    "checkedAt": "2026-10-01",
    "evidenceId": "IE00BDBRDM35-ETFP-AGGH-EUR"
  }
],
  "IE00B0M62X26": [
  {
    "ticker": "IBCI",
    "exchange": "Euronext Amsterdam",
    "mic": "XAMS",
    "currency": "EUR",
    "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251739/ishares-euro-inflation-linked-government-bond-ucits-etf",
    "checkedAt": "2026-10-01",
    "evidenceId": "IE00B0M62X26-XAMS-IBCI-EUR"
  }
],
  "IE00BMG6Z448": [
  {
    "ticker": "EXCH",
    "exchange": "Borsa Italiana",
    "mic": "ETFP",
    "currency": "EUR",
    "sourceUrl": "https://www.ishares.com/uk/individual/en/products/315592/ishares-msci-em-ex-china-ucits-etf?siteEntryPassthrough=true&switchLocale=y",
    "checkedAt": "2026-10-01",
    "evidenceId": "IE00BMG6Z448-ETFP-EXCH-EUR"
  }
],
  "IE00BZCQB185": [
  {
    "ticker": "NDIA",
    "exchange": "Euronext Amsterdam",
    "mic": "XAMS",
    "currency": "EUR",
    "sourceUrl": "https://www.ishares.com/uk/individual/en/products/297617/ishares-msci-india-ucits-etf",
    "checkedAt": "2026-10-01",
    "evidenceId": "IE00BZCQB185-XAMS-NDIA-EUR"
  }
],
  "IE00B1FZS467": [
  {
    "ticker": "INFR",
    "exchange": "Euronext Amsterdam",
    "mic": "XAMS",
    "currency": "EUR",
    "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251809/ishares-global-infrastructure-ucits-etf",
    "checkedAt": "2026-10-01",
    "evidenceId": "IE00B1FZS467-XAMS-INFR-EUR"
  }
],

  "FR0010527275": [
    {
      "ticker": "WAT",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010527275/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0010527275-XPAR-WAT-EUR"
    },
    {
      "ticker": "WAT",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010527275/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0010527275-ETFP-WAT-EUR"
    }
  ],
  "FR0011440478": [
    {
      "ticker": "PLEM",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011440478/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0011440478-XPAR-PLEM-EUR"
    }
  ],
  "FR0011550193": [
    {
      "ticker": "ETZ",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.borsaitaliana.it/borsa/etf/scheda/FR0011550193-XPAR.html",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0011550193-XPAR-ETZ-EUR"
    }
  ],
  "FR0011869320": [
    {
      "ticker": "PINR",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011869320/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0011869320-XPAR-PINR-EUR"
    }
  ],
  "FR0011871110": [
    {
      "ticker": "PUST",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0011871110-XPAR-PUST-EUR"
    }
  ],
  "FR0011871128": [
    {
      "ticker": "PSP5",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.borsaitaliana.it/borsa/etf/scheda/FR0011871128-XPAR.html",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0011871128-XPAR-PSP5-EUR"
    }
  ],
  "FR0013411998": [
    {
      "ticker": "PTPXH",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0013411998-XPAR-PTPXH-EUR"
    }
  ],
  "FR0013412004": [
    {
      "ticker": "PALAT",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412004/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0013412004-XPAR-PALAT-EUR"
    }
  ],
  "FR0013412012": [
    {
      "ticker": "PAASI",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412012/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0013412012-XPAR-PAASI-EUR"
    }
  ],
  "FR0013412020": [
    {
      "ticker": "PAEEM",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0013412020-XPAR-PAEEM-EUR"
    }
  ],
  "FR0013412038": [
    {
      "ticker": "PCEU",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412038/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0013412038-XPAR-PCEU-EUR"
    }
  ],
  "FR001400U5Q4": [
    {
      "ticker": "DCAM",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR001400U5Q4/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR001400U5Q4-XPAR-DCAM-EUR"
    }
  ],
  "FR0014017NX3": [
    {
      "ticker": "GPEA",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.borsaitaliana.it/borsa/etf/scheda/FR0014017NX3-XPAR.html",
      "checkedAt": "2026-09-30",
      "evidenceId": "FR0014017NX3-XPAR-GPEA-EUR"
    }
  ],
  "GB00BLD4ZL17": [
    {
      "ticker": "BITC",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://coinshares.com/etp/physical-bitcoin/",
      "checkedAt": "2026-09-30",
      "evidenceId": "GB00BLD4ZL17-XPAR-BITC-EUR"
    },
    {
      "ticker": "BITC",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://coinshares.com/etp/physical-bitcoin/",
      "checkedAt": "2026-09-30",
      "evidenceId": "GB00BLD4ZL17-XAMS-BITC-EUR"
    },
    {
      "ticker": "BITC",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://coinshares.com/etp/physical-bitcoin/",
      "checkedAt": "2026-09-30",
      "evidenceId": "GB00BLD4ZL17-XETR-BITC-EUR"
    }
  ],
  "IE0002XZSHO1": [
    {
      "ticker": "WPEA",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/ch/professionals/en/products/335178/?switchLocale=Y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0002XZSHO1-XPAR-WPEA-EUR"
    }
  ],
  "IE0006WW1TQ4": [
    {
      "ticker": "EXUS",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://etf.dws.com/download/asset/82292b8e-bf9e-44f2-b20d-722c743110a3",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0006WW1TQ4-ETFP-EXUS-EUR"
    },
    {
      "ticker": "EXUS",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://etf.dws.com/download/asset/82292b8e-bf9e-44f2-b20d-722c743110a3",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0006WW1TQ4-XETR-EXUS-EUR"
    },
    {
      "ticker": "EXUS",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://etf.dws.com/download/asset/82292b8e-bf9e-44f2-b20d-722c743110a3",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0006WW1TQ4-XLON-EXUS-USD"
    },
    {
      "ticker": "EXUS",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://etf.dws.com/download/asset/82292b8e-bf9e-44f2-b20d-722c743110a3",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0006WW1TQ4-XSWX-EXUS-CHF"
    }
  ],
  "IE0007Y8Y157": [
    {
      "ticker": "QUTM",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0007Y8Y157-XETR-QUTM-EUR"
    },
    {
      "ticker": "QNTM",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0007Y8Y157-ETFP-QNTM-EUR"
    },
    {
      "ticker": "QNTM",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0007Y8Y157-XLON-QNTM-USD"
    },
    {
      "ticker": "QNTM",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE0007Y8Y157-XSWX-QNTM-CHF"
    }
  ],
  "IE000DQLYVB9": [
    {
      "ticker": "SPEA",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/ch/professionals/en/products/342916/?switchLocale=Y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000DQLYVB9-XPAR-SPEA-EUR"
    }
  ],
  "IE000I8KRLL9": [
    {
      "ticker": "SEMI",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/319084/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000I8KRLL9-XAMS-SEMI-USD"
    },
    {
      "ticker": "SEMI",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/319084/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000I8KRLL9-XSWX-SEMI-USD"
    },
    {
      "ticker": "SEMI",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/319084/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000I8KRLL9-XLON-SEMI-GBP"
    },
    {
      "ticker": "SEMI",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/319084/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000I8KRLL9-XMEX-SEMI-MXN"
    }
  ],
  "IE000M7V94E1": [
    {
      "ticker": "NUKL",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/fr/fr/library/fact-sheets/nucl-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000M7V94E1-XETR-NUKL-EUR"
    }
  ],
  "IE000RDRMSD1": [
    {
      "ticker": "BLKC",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/328618/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000RDRMSD1-XAMS-BLKC-USD"
    },
    {
      "ticker": "BLKC",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/328618/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000RDRMSD1-XSWX-BLKC-USD"
    },
    {
      "ticker": "BLKC",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/328618/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000RDRMSD1-XLON-BLKC-GBP"
    },
    {
      "ticker": "BLKC",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/328618/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000RDRMSD1-XMEX-BLKC-MXN"
    }
  ],
  "IE000YU9K6K2": [
    {
      "ticker": "JEDI",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/fr/en/library/fact-sheets/jedi-fact-sheet",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YU9K6K2-ETFP-JEDI-EUR"
    },
    {
      "ticker": "JEDI",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/fr/en/library/fact-sheets/jedi-fact-sheet",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YU9K6K2-XETR-JEDI-EUR"
    },
    {
      "ticker": "JEDI",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.vaneck.com/fr/en/library/fact-sheets/jedi-fact-sheet",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YU9K6K2-XLON-JEDI-USD"
    },
    {
      "ticker": "JEDI",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.vaneck.com/fr/en/library/fact-sheets/jedi-fact-sheet",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YU9K6K2-XSWX-JEDI-CHF"
    }
  ],
  "IE000YYE6WK5": [
    {
      "ticker": "DFNS",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/dfns-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YYE6WK5-XPAR-DFNS-EUR"
    },
    {
      "ticker": "DFNS",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/dfns-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YYE6WK5-ETFP-DFNS-EUR"
    },
    {
      "ticker": "DFNS",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/dfns-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YYE6WK5-XLON-DFNS-USD"
    },
    {
      "ticker": "DFNS",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/dfns-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YYE6WK5-XSWX-DFNS-CHF"
    },
    {
      "ticker": "DFEN",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.vaneck.com/uk/en/library/fact-sheets/dfns-fact-sheet.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE000YYE6WK5-XETR-DFEN-EUR"
    }
  ],
  "IE00B1FZS350": [
    {
      "ticker": "IWDP",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251801/ishares-developed-markets-property-yield-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B1FZS350-XAMS-IWDP-EUR"
    },
    {
      "ticker": "IWDP",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251801/ishares-developed-markets-property-yield-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B1FZS350-ETFP-IWDP-EUR"
    },
    {
      "ticker": "IWDP",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251801/ishares-developed-markets-property-yield-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B1FZS350-XSWX-IWDP-USD"
    },
    {
      "ticker": "IWDP",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251801/ishares-developed-markets-property-yield-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B1FZS350-XLON-IWDP-GBP"
    }
  ],
  "IE00B3F81R35": [
    {
      "ticker": "IEAC",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251726/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B3F81R35-XAMS-IEAC-EUR"
    },
    {
      "ticker": "IEAC",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251726/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B3F81R35-ETFP-IEAC-EUR"
    },
    {
      "ticker": "IEAC",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251726/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B3F81R35-XLON-IEAC-EUR"
    },
    {
      "ticker": "IEAC",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251726/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B3F81R35-XSWX-IEAC-CHF"
    }
  ],
  "IE00B4L5Y983": [
    {
      "ticker": "SWDA",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251882/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4L5Y983-ETFP-SWDA-EUR"
    },
    {
      "ticker": "SWDA",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251882/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4L5Y983-XSWX-SWDA-USD"
    },
    {
      "ticker": "SWDA",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251882/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4L5Y983-XLON-SWDA-GBP"
    }
  ],
  "IE00B4ND3602": [
    {
      "ticker": "SGLN",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/258441/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4ND3602-ETFP-SGLN-EUR"
    },
    {
      "ticker": "SGLN",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/258441/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4ND3602-XLON-SGLN-GBP"
    },
    {
      "ticker": "IGLN",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/258441/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4ND3602-XLON-IGLN-USD"
    },
    {
      "ticker": "IGLN",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/258441/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4ND3602-XMEX-IGLN-MXN"
    }
  ],
  "IE00B4WXJJ64": [
    {
      "ticker": "SEGA",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251740/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4WXJJ64-ETFP-SEGA-EUR"
    },
    {
      "ticker": "SEGA",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251740/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B4WXJJ64-XLON-SEGA-GBP"
    }
  ],
  "IE00B5M1WJ87": [
    {
      "ticker": "EUDV",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B5M1WJ87-XPAR-EUDV-EUR"
    },
    {
      "ticker": "EUDV",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B5M1WJ87-ETFP-EUDV-EUR"
    },
    {
      "ticker": "EUDV",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B5M1WJ87-XLON-EUDV-GBP"
    },
    {
      "ticker": "EUDV",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B5M1WJ87-XSWX-EUDV-CHF"
    }
  ],
  "IE00B66F4759": [
    {
      "ticker": "IHYG",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251843/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B66F4759-ETFP-IHYG-EUR"
    },
    {
      "ticker": "IHYG",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251843/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B66F4759-XLON-IHYG-EUR"
    },
    {
      "ticker": "IHYG",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251843/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B66F4759-XSWX-IHYG-CHF"
    },
    {
      "ticker": "IHYG",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251843/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B66F4759-XMEX-IHYG-MXN"
    }
  ],
  "IE00B6R52259": [
    {
      "ticker": "SSAC",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251850/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B6R52259-XAMS-SSAC-EUR"
    },
    {
      "ticker": "SSAC",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251850/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B6R52259-XSWX-SSAC-USD"
    },
    {
      "ticker": "SSAC",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251850/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B6R52259-XLON-SSAC-GBP"
    }
  ],
  "IE00B6YX5D40": [
    {
      "ticker": "USDV",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-sp-us-dividend-aristocrats-ucits-etf-dist-spyd-gy",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B6YX5D40-ETFP-USDV-EUR"
    },
    {
      "ticker": "USDV",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-sp-us-dividend-aristocrats-ucits-etf-dist-spyd-gy",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B6YX5D40-XLON-USDV-GBP"
    },
    {
      "ticker": "USDV",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-sp-us-dividend-aristocrats-ucits-etf-dist-spyd-gy",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B6YX5D40-XSWX-USDV-CHF"
    }
  ],
  "IE00B8FHGS14": [
    {
      "ticker": "MVOL",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251382/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B8FHGS14-ETFP-MVOL-EUR"
    },
    {
      "ticker": "MVOL",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251382/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B8FHGS14-XLON-MVOL-USD"
    },
    {
      "ticker": "MVOL",
      "exchange": "Cboe Europe",
      "mic": "CEUX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251382/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B8FHGS14-CEUX-MVOL-USD"
    },
    {
      "ticker": "MVOL",
      "exchange": "Santiago Stock Exchange",
      "mic": "XSGO",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251382/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B8FHGS14-XSGO-MVOL-USD"
    },
    {
      "ticker": "MVOL",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "CHF",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251382/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B8FHGS14-XSWX-MVOL-CHF"
    },
    {
      "ticker": "MVOL",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/251382/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00B8FHGS14-XMEX-MVOL-MXN"
    }
  ],
  "IE00BF0M2Z96": [
    {
      "ticker": "BATT",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.borsaitaliana.it/CAETF/2025-92213-SUPPLEMENTS-6c5bd598-b83f-40ba-925d-a07046bf4e10.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BF0M2Z96-ETFP-BATT-EUR"
    },
    {
      "ticker": "BATT",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.borsaitaliana.it/CAETF/2025-92213-SUPPLEMENTS-6c5bd598-b83f-40ba-925d-a07046bf4e10.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BF0M2Z96-XLON-BATT-USD"
    }
  ],
  "IE00BF3N7094": [
    {
      "ticker": "HIGH",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/290618/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BF3N7094-XAMS-HIGH-EUR"
    },
    {
      "ticker": "HIGH",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/290618/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BF3N7094-XLON-HIGH-EUR"
    }
  ],
  "IE00BF4RFH31": [
    {
      "ticker": "WSML",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/296576/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BF4RFH31-XLON-WSML-USD"
    },
    {
      "ticker": "WSML",
      "exchange": "Berne Stock Exchange",
      "mic": "XBRN",
      "currency": "CHF",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/296576/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BF4RFH31-XBRN-WSML-CHF"
    },
    {
      "ticker": "WSML",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/296576/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BF4RFH31-XMEX-WSML-MXN"
    }
  ],
  "IE00BFZPF546": [
    {
      "ticker": "EMGA",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/297676/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BFZPF546-XPAR-EMGA-EUR"
    },
    {
      "ticker": "EMGA",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/297676/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BFZPF546-XLON-EMGA-USD"
    },
    {
      "ticker": "EMGA",
      "exchange": "Santiago Stock Exchange",
      "mic": "XSGO",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/297676/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BFZPF546-XSGO-EMGA-USD"
    },
    {
      "ticker": "EMGA",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/297676/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BFZPF546-XMEX-EMGA-MXN"
    }
  ],
  "IE00BJ5JNY98": [
    {
      "ticker": "WITS",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/308858/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BJ5JNY98-ETFP-WITS-EUR"
    },
    {
      "ticker": "WITS",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/308858/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BJ5JNY98-XAMS-WITS-USD"
    },
    {
      "ticker": "WITS",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/308858/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BJ5JNY98-XSWX-WITS-USD"
    },
    {
      "ticker": "WITS",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/308858/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BJ5JNY98-XLON-WITS-GBP"
    }
  ],
  "IE00BJ5JP097": [
    {
      "ticker": "WFNS",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/308836/ishares-msci-world-financials-sector-advanced-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BJ5JP097-XAMS-WFNS-USD"
    },
    {
      "ticker": "WFNS",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/308836/ishares-msci-world-financials-sector-advanced-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BJ5JP097-XSWX-WFNS-USD"
    }
  ],
  "IE00BK5BCD43": [
    {
      "ticker": "AIAI",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.borsaitaliana.it/CAETF/2025-92212-SUPPLEMENTS-ec3a89e8-685a-41c4-9208-0d21cd7b5f21.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BK5BCD43-ETFP-AIAI-EUR"
    },
    {
      "ticker": "AIAI",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.borsaitaliana.it/CAETF/2025-92212-SUPPLEMENTS-ec3a89e8-685a-41c4-9208-0d21cd7b5f21.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BK5BCD43-XLON-AIAI-USD"
    }
  ],
  "IE00BK5BQT80": [
    {
      "ticker": "VWCE",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.vanguard.co.uk/professional/product/etf/equity/9679/ftse-all-world-ucits",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BK5BQT80-XAMS-VWCE-EUR"
    },
    {
      "ticker": "VWCE",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.vanguard.co.uk/professional/product/etf/equity/9679/ftse-all-world-ucits",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BK5BQT80-ETFP-VWCE-EUR"
    },
    {
      "ticker": "VWCE",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.vanguard.co.uk/professional/product/etf/equity/9679/ftse-all-world-ucits",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BK5BQT80-XETR-VWCE-EUR"
    }
  ],
  "IE00BKM4GZ66": [
    {
      "ticker": "EMIM",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/264659/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BKM4GZ66-XAMS-EMIM-EUR"
    },
    {
      "ticker": "EMIM",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/264659/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BKM4GZ66-XLON-EMIM-GBP"
    }
  ],
  "IE00BM8R0J59": [
    {
      "ticker": "QYLE",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://globalxetfs.eu/funds/qyld",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BM8R0J59-XETR-QYLE-EUR"
    }
  ],
  "IE00BP3QZ601": [
    {
      "ticker": "IWQU",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270054/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ601-ETFP-IWQU-EUR"
    },
    {
      "ticker": "IWQU",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270054/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ601-XLON-IWQU-USD"
    },
    {
      "ticker": "IWQU",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270054/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ601-XSWX-IWQU-USD"
    },
    {
      "ticker": "IWQU",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270054/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ601-XMEX-IWQU-MXN"
    },
    {
      "ticker": "IWFQ",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270054/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ601-XLON-IWFQ-GBP"
    }
  ],
  "IE00BP3QZ825": [
    {
      "ticker": "IWMO",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270051/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ825-ETFP-IWMO-EUR"
    },
    {
      "ticker": "IWMO",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270051/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ825-XLON-IWMO-USD"
    },
    {
      "ticker": "IWMO",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270051/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ825-XSWX-IWMO-USD"
    },
    {
      "ticker": "IWMO",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270051/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZ825-XMEX-IWMO-MXN"
    }
  ],
  "IE00BP3QZB59": [
    {
      "ticker": "IWVL",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZB59-ETFP-IWVL-EUR"
    },
    {
      "ticker": "IWVL",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZB59-XLON-IWVL-USD"
    },
    {
      "ticker": "IWVL",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZB59-XSWX-IWVL-USD"
    },
    {
      "ticker": "IWVL",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZB59-XMEX-IWVL-MXN"
    },
    {
      "ticker": "IWFV",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "GBP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BP3QZB59-XLON-IWFV-GBP"
    }
  ],
  "IE00BYPLS672": [
    {
      "ticker": "ISPY",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.borsaitaliana.it/CAETF/2025-92214-SUPPLEMENTS-650e8c0e-ea76-4490-ad4e-32661d4a6888.pdf",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYPLS672-ETFP-ISPY-EUR"
    }
  ],
  "IE00BYTRR863": [
    {
      "ticker": "WNRG",
      "exchange": "Euronext Amsterdam",
      "mic": "XAMS",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-msci-world-energy-ucits-etf-wnrg-na",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYTRR863-XAMS-WNRG-EUR"
    },
    {
      "ticker": "WNRG",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-msci-world-energy-ucits-etf-wnrg-na",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYTRR863-ETFP-WNRG-EUR"
    },
    {
      "ticker": "WNRG",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-msci-world-energy-ucits-etf-wnrg-na",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYTRR863-XLON-WNRG-USD"
    },
    {
      "ticker": "WNRG",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-msci-world-energy-ucits-etf-wnrg-na",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYTRR863-XSWX-WNRG-USD"
    }
  ],
  "IE00BYXG2H39": [
    {
      "ticker": "BTEC",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/291450/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYXG2H39-XLON-BTEC-USD"
    },
    {
      "ticker": "BTEC",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/291450/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYXG2H39-XSWX-BTEC-USD"
    }
  ],
  "IE00BYZK4552": [
    {
      "ticker": "RBOT",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYZK4552-ETFP-RBOT-EUR"
    },
    {
      "ticker": "RBOT",
      "exchange": "London Stock Exchange",
      "mic": "XLON",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYZK4552-XLON-RBOT-USD"
    },
    {
      "ticker": "RBOT",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "USD",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYZK4552-XSWX-RBOT-USD"
    },
    {
      "ticker": "RBOT",
      "exchange": "Bolsa Mexicana De Valores",
      "mic": "XMEX",
      "currency": "MXN",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYZK4552-XMEX-RBOT-MXN"
    },
    {
      "ticker": "RBOT",
      "exchange": "Santiago Stock Exchange",
      "mic": "XSGO",
      "currency": "CLP",
      "sourceUrl": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y",
      "checkedAt": "2026-09-30",
      "evidenceId": "IE00BYZK4552-XSGO-RBOT-CLP"
    }
  ],
  "LU1681043599": [
    {
      "ticker": "CW8",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681043599/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681043599-XPAR-CW8-EUR"
    },
    {
      "ticker": "CW8",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681043599/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681043599-ETFP-CW8-EUR"
    }
  ],
  "LU1681047236": [
    {
      "ticker": "C50",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681047236-XPAR-C50-EUR"
    },
    {
      "ticker": "C50",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681047236-ETFP-C50-EUR"
    },
    {
      "ticker": "C50",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681047236-XSWX-C50-EUR"
    }
  ],
  "LU1681048630": [
    {
      "ticker": "GLUX",
      "exchange": "Euronext Paris",
      "mic": "XPAR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681048630-XPAR-GLUX-EUR"
    },
    {
      "ticker": "GLUX",
      "exchange": "Borsa Italiana",
      "mic": "ETFP",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681048630-ETFP-GLUX-EUR"
    },
    {
      "ticker": "GLUX",
      "exchange": "Xetra",
      "mic": "XETR",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681048630-XETR-GLUX-EUR"
    },
    {
      "ticker": "GLUX",
      "exchange": "SIX Swiss Exchange",
      "mic": "XSWX",
      "currency": "EUR",
      "sourceUrl": "https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/INSTITUTIONNEL/ETF",
      "checkedAt": "2026-09-30",
      "evidenceId": "LU1681048630-XSWX-GLUX-EUR"
    }
  ]
});

// Les outils partagent ces objets : empêcher une modification locale du catalogue.
for (const listings of Object.values(INSTRUMENT_LISTINGS_BY_ISIN)) {
  listings.forEach(Object.freeze);
  Object.freeze(listings);
}

export function getInstrumentListings(isin) {
  return INSTRUMENT_LISTINGS_BY_ISIN[isin] ?? [];
}

export function formatInstrumentListings(isin) {
  return getInstrumentListings(isin).map(({ ticker, exchange, currency }) => `${ticker} · ${exchange} · ${currency}`).join(" / ");
}

// Choix éditorial commun : EUR d'abord, puis Paris / Amsterdam / Milan / Xetra.
// Ce choix n'affirme ni la liquidité ni la disponibilité chez un courtier.
export function getPreferredInstrumentListing(isin) {
  const rank = ({ currency, mic }) => (currency === 'EUR' ? 0 : currency === 'USD' ? 100 : 200)
    + ({ XPAR: 0, XAMS: 1, ETFP: 2, XETR: 3, XLON: 4, XSWX: 5 }[mic] ?? 9);
  return [...getInstrumentListings(isin)].sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

export function requireInstrumentListing(isin) {
  const listing = getPreferredInstrumentListing(isin);
  if (!listing) throw new Error(`Cotation documentée absente pour ${isin}`);
  return listing;
}

export function formatInstrumentListing(listing) {
  return listing ? `${listing.ticker} · ${listing.exchange} · ${listing.currency}` : '';
}
