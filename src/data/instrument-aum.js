import { EXPOSURE_ADDITIONS } from './exposure-additions.js';
// Encours revus le 02/10/2026 : relevés émetteurs datés et périmètre part/fonds explicite.
// Encours revus le 02/10/2026 : relevés émetteurs datés et périmètre part/fonds explicite.
// Taille affichée sur le profil de chaque ISIN par les fiches ETF et le comparateur.
// Reprise des libellés historiques : sans source explicite ci-dessous, aucune
// nouvelle validation des montants ni de leurs dates ne résulte de la migration.
// checkedAt est la date de consultation. asOf:null indique que le profil
// ne donne pas de date de valeur exploitable ; ne pas la déduire de checkedAt.
// Attention : pour IE00B3F81R35, l'émetteur distingue 8,437 Md€ pour la part
// et 13,148 Md€ pour le fonds entier au 25/09/2026. Le profil justETF reprend
// la taille de la part ; ne pas mélanger ces deux périmètres.
// Les commentaires des outils décrivent souvent des contrôles historiques ;
// les montants affichés proviennent des relevés ci-dessous.
// Deux vues d’un même ISIN peuvent être de dates ou d’arrondis différents ;
// elles sont conservées séparément jusqu’à un recoupement fiable.
export const INSTRUMENT_AUM_BY_ISIN = Object.freeze({
...Object.fromEntries(EXPOSURE_ADDITIONS.filter(r => r.aum).map(r => [r.isin, Object.freeze({ sheet: r.aum, index: r.aum, source: { url: r.aumSource ?? r.source, checkedAt: r.checkedAt ?? '2026-10-03', amount: r.aumAmount, ...(r.aumDate === null ? { amountMillions: r.aumAmount / 1e6 } : {}), currency: r.aumCurrency, asOf: r.aumDate, scope: r.aumDate ? 'Actif net de la part exacte' : 'Taille publiée sur le profil ISIN' } })])),
  "LU0290358497": Object.freeze({"sheet": "Fonds : 23,85 Md€ au 31/08/2026", "source": {"url": "https://etf.dws.com/download/asset/5643099c-7044-46a2-bfd8-b24c4752c7f6", "checkedAt": "2026-10-01", "amount": 23850000000, "currency": "EUR", "asOf": "2026-08-31", "scope": "Encours du fonds publié par DWS, toutes parts ; montant arrondi dans la fiche"}}),
  "IE00B3FH7618": Object.freeze({"sheet": "Part : 1 059,63 M€ au 29/09/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251741/ishares-euro-government-bond-01yr-ucits-etf", "checkedAt": "2026-10-01", "amount": 1059628645, "currency": "EUR", "asOf": "2026-09-29", "scope": "Actif net de la part EUR distribuante ; distinct des 1 329 273 700 EUR du fonds entier"}}),
  "IE00BDBRDM35": Object.freeze({"sheet": "Part : 2 512,71 M€ au 29/09/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/291770/ishares-global-aggregate-bond-ucits-etf-eur-hedged-%28acc%29-fund?siteEntryPassthrough=true", "checkedAt": "2026-10-01", "amount": 2512712082, "currency": "EUR", "asOf": "2026-09-29", "scope": "Actif net de la part EUR Hedged Acc ; distinct de l’encours total du fonds publié en USD"}}),
  "IE00B0M62X26": Object.freeze({"sheet": "Part : 1 927,64 M€ au 30/09/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251739/ishares-euro-inflation-linked-government-bond-ucits-etf", "checkedAt": "2026-10-01", "amount": 1927636788, "currency": "EUR", "asOf": "2026-09-30", "scope": "Actif net publié pour la part EUR capitalisante"}}),
  "IE00BZCQB185": Object.freeze({"sheet": "Part : 4 835,53 M$ au 30/09/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/297617/ishares-msci-india-ucits-etf", "checkedAt": "2026-10-01", "amount": 4835530130, "currency": "USD", "asOf": "2026-09-30", "scope": "Actif net de la part USD capitalisante"}}),
  "IE00B1FZS467": Object.freeze({"sheet": "Part : 2 433,79 M$ au 30/09/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251809/ishares-global-infrastructure-ucits-etf", "checkedAt": "2026-10-01", "amount": 2433789858, "currency": "USD", "asOf": "2026-09-30", "scope": "Actif net de la part USD distribuante ; distinct des 2 737 311 117 USD du fonds entier"}}),

  "CH0454664001": Object.freeze({
  "index": "602 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=CH0454664001",
    "checkedAt": "2026-09-29",
    "amountMillions": 602,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "602 M€ (relevé le 29/09/2026)"
}),
  "DE000A27Z304": Object.freeze({
  "index": "788 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=DE000A27Z304",
    "checkedAt": "2026-09-29",
    "amountMillions": 788,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "788 M€ (relevé le 29/09/2026)"
}),
  "FR0010527275": Object.freeze({ sheet: "1 468 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0010527275", checkedAt: "2026-09-29", amountMillions: 1468, currency: "EUR", asOf: null } }),
  "FR0011440478": Object.freeze({ index: "58 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011440478", checkedAt: "2026-09-29", amountMillions: 58, currency: "EUR", asOf: null } }),
  "FR0011550185": Object.freeze({ index: "3 509 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011550185", checkedAt: "2026-09-29", amountMillions: 3509, currency: "EUR", asOf: null } }),
  "FR0011550193": Object.freeze({ index: "1 075 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011550193", checkedAt: "2026-09-29", amountMillions: 1075, currency: "EUR", asOf: null } }),
  "FR0011869320": Object.freeze({ index: "150 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011869320", checkedAt: "2026-09-29", amountMillions: 150, currency: "EUR", asOf: null } }),
  "FR0011871078": Object.freeze({ index: "68 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011871078", checkedAt: "2026-09-29", amountMillions: 68, currency: "EUR", asOf: null } }),
  "FR0011871110": Object.freeze({ sheet: "1 259 M€ (relevé le 29/09/2026)", index: "1 259 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011871110", checkedAt: "2026-09-29", amountMillions: 1259, currency: "EUR", asOf: null } }),
  "FR0011871128": Object.freeze({ sheet: "1 215 M€ (relevé le 29/09/2026)", index: "1 215 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0011871128", checkedAt: "2026-09-29", amountMillions: 1215, currency: "EUR", asOf: null } }),
  "FR0013411980": Object.freeze({ index: "133 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013411980", checkedAt: "2026-09-29", amountMillions: 133, currency: "EUR", asOf: null } }),
  "FR0013411998": Object.freeze({ sheet: "61 M€ (relevé le 29/09/2026)", index: "61 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013411998", checkedAt: "2026-09-29", amountMillions: 61, currency: "EUR", asOf: null } }),
  "FR0013412004": Object.freeze({ index: "236 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412004", checkedAt: "2026-09-29", amountMillions: 236, currency: "EUR", asOf: null } }),
  "FR0013412012": Object.freeze({ index: "755 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412012", checkedAt: "2026-09-29", amountMillions: 755, currency: "EUR", asOf: null } }),
  "FR0013412020": Object.freeze({ index: "914 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412020", checkedAt: "2026-09-29", amountMillions: 914, currency: "EUR", asOf: null } }),
  "FR0013412038": Object.freeze({ index: "376 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0013412038", checkedAt: "2026-09-29", amountMillions: 376, currency: "EUR", asOf: null } }),
  "FR0013416716": Object.freeze({
  "index": "11 845 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=FR0013416716",
    "checkedAt": "2026-09-29",
    "amountMillions": 11845,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "11 845 M€ (relevé le 29/09/2026)"
}),
  "FR001400U5Q4": Object.freeze({ sheet: "1 532 M€ (relevé le 29/09/2026)", index: "1 532 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR001400U5Q4", checkedAt: "2026-09-29", amountMillions: 1532, currency: "EUR", asOf: null } }),
  "FR0014017NX3": Object.freeze({ index: "63 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=FR0014017NX3", checkedAt: "2026-09-29", amountMillions: 63, currency: "EUR", asOf: null } }),
  "GB00BJYDH287": Object.freeze({
  "index": "1 440 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=GB00BJYDH287",
    "checkedAt": "2026-09-29",
    "amountMillions": 1440,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "1 440 M€ (relevé le 29/09/2026)"
}),
  "GB00BLD4ZL17": Object.freeze({ sheet: "1 544 M€ (relevé le 29/09/2026)", index: "1 544 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=GB00BLD4ZL17", checkedAt: "2026-09-29", amountMillions: 1544, currency: "EUR", asOf: null } }),
  "GB00BLD4ZM24": Object.freeze({
  "index": "389 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=GB00BLD4ZM24",
    "checkedAt": "2026-09-29",
    "amountMillions": 389,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "389 M€ (relevé le 29/09/2026)"
}),
  "IE0002XZSHO1": Object.freeze({ index: "2 214 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE0002XZSHO1", checkedAt: "2026-09-29", amountMillions: 2214, currency: "EUR", asOf: null } }),
  "IE0006WW1TQ4": Object.freeze({ index: "6 817 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE0006WW1TQ4", checkedAt: "2026-09-29", amountMillions: 6817, currency: "EUR", asOf: null } }),
  "IE0007Y8Y157": Object.freeze({"sheet": "Fonds : 887,60 M$ au 31/08/2026", "source": {"url": "https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf", "checkedAt": "2026-10-02", "amount": 887600000, "currency": "USD", "asOf": "2026-08-31", "scope": "Encours du fonds publié par l’émetteur"}}),
  "IE000DQLYVB9": Object.freeze({ sheet: "54,41 M€ au 28/09/2026", index: "54,41 M€ au 28/09/2026", source: { url: "https://www.blackrock.com/fr/intermediaries/products/342916/", asOf: "2026-09-28", checkedAt: "2026-09-29", amount: 54413013, currency: "EUR" } }),
  "IE000I8KRLL9": Object.freeze({"sheet": "Part : 5 891,34 M$ au 31/08/2026", "source": {"url": "https://www.ishares.com/gls-download/literature/fact-sheet/semi-ishares-msci-global-semiconductors-ucits-etf-fund-fact-sheet-en-gb.pdf", "checkedAt": "2026-10-02", "amount": 5891340000, "currency": "USD", "asOf": "2026-08-31", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE000L6ZMMC4": Object.freeze({ index: "145 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000L6ZMMC4", checkedAt: "2026-09-29", amountMillions: 145, currency: "EUR", asOf: null } }),
  "IE000M7V94E1": Object.freeze({"sheet": "Fonds : 2 355,50 M$ au 31/08/2026", "source": {"url": "https://www.vaneck.com/fr/fr/library/fact-sheets/nucl-fact-sheet.pdf", "checkedAt": "2026-10-02", "amount": 2355500000, "currency": "USD", "asOf": "2026-08-31", "scope": "Encours du fonds publié par l’émetteur"}}),
  "IE000QDFFK00": Object.freeze({ index: "2 500 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE000QDFFK00", checkedAt: "2026-09-29", amountMillions: 2500, currency: "EUR", asOf: null } }),
  "IE000RDRMSD1": Object.freeze({"sheet": "Part : 304,26 M$ au 31/08/2026", "source": {"url": "https://www.ishares.com/gls-download/literature/fact-sheet/blkc-ishares-blockchain-technology-ucits-etf-fund-fact-sheet-en-gb.pdf", "checkedAt": "2026-10-02", "amount": 304260000, "currency": "USD", "asOf": "2026-08-31", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE000YU9K6K2": Object.freeze({"sheet": "Fonds : 1 752,10 M$ au 31/08/2026", "source": {"url": "https://www.vaneck.com/fr/en/library/fact-sheets/jedi-fact-sheet", "checkedAt": "2026-10-02", "amount": 1752100000, "currency": "USD", "asOf": "2026-08-31", "scope": "Encours du fonds publié par l’émetteur"}}),
  "IE000YYE6WK5": Object.freeze({"sheet": "Fonds : 7 440,00 M$ au 31/08/2026", "source": {"url": "https://www.vaneck.com/fr/en/library/fact-sheets/dfns-fact-sheet.pdf", "checkedAt": "2026-10-02", "amount": 7440000000, "currency": "USD", "asOf": "2026-08-31", "scope": "Encours du fonds publié par l’émetteur"}}),
  "IE00B02KXK85": Object.freeze({ index: "724 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B02KXK85", checkedAt: "2026-09-29", amountMillions: 724, currency: "EUR", asOf: null } }),
  "IE00B1FZS350": Object.freeze({"sheet": "Part : 1 062,77 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251801/ishares-developed-markets-property-yield-ucits-etf", "checkedAt": "2026-10-02", "amount": 1062774752, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00B3F81R35": Object.freeze({"sheet": "Part : 8 606,04 M€ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251726/?siteEntryPassthrough=true&switchLocale=y", "checkedAt": "2026-10-02", "amount": 8606036988, "currency": "EUR", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00B3VVMM84": Object.freeze({ index: "3 204 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B3VVMM84", checkedAt: "2026-09-29", amountMillions: 3204, currency: "EUR", asOf: null } }),
  "IE00B44Z5B48": Object.freeze({
  "index": "17 224 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00B44Z5B48",
    "checkedAt": "2026-09-29",
    "amountMillions": 17224,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "17 224 M€ (relevé le 29/09/2026)"
}),
  "IE00B4L5YX21": Object.freeze({
  "index": "7 580 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00B4L5YX21",
    "checkedAt": "2026-09-29",
    "amountMillions": 7580,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "7 580 M€ (relevé le 29/09/2026)"
}),
  "IE00B4NCWG09": Object.freeze({
  "index": "2 911 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00B4NCWG09",
    "checkedAt": "2026-09-29",
    "amountMillions": 2911,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "2 911 M€ (relevé le 29/09/2026)"
}),
  "IE00B4ND3602": Object.freeze({"sheet": "Produit : 38 186,32 M$ au 01/10/2026", "index": "Produit : 38 186,32 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/258441/?siteEntryPassthrough=true&switchLocale=y", "checkedAt": "2026-10-02", "amount": 38186318355, "currency": "USD", "asOf": "2026-10-01", "scope": "Encours du produit adossé à l’or physique"}}),
  "IE00B4WXJJ64": Object.freeze({"sheet": "Part : 5 210,74 M€ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251740/?siteEntryPassthrough=true&switchLocale=y", "checkedAt": "2026-10-02", "amount": 5210742961, "currency": "EUR", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00B52SFT06": Object.freeze({ index: "4 522 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B52SFT06", checkedAt: "2026-09-29", amountMillions: 4522, currency: "EUR", asOf: null } }),
  "IE00B53L3W79": Object.freeze({
  "index": "7 718 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00B53L3W79",
    "checkedAt": "2026-09-29",
    "amountMillions": 7718,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "7 718 M€ (relevé le 29/09/2026)"
}),
  "IE00B579F325": Object.freeze({
  "index": "26 624 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00B579F325",
    "checkedAt": "2026-09-29",
    "amountMillions": 26624,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "26 624 M€ (relevé le 29/09/2026)"
}),
  "IE00B5M1WJ87": Object.freeze({ index: "1 810 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00B5M1WJ87", checkedAt: "2026-09-29", amountMillions: 1810, currency: "EUR", asOf: null } }),
  "IE00B66F4759": Object.freeze({"sheet": "Part : 4 822,23 M€ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251843/?siteEntryPassthrough=true&switchLocale=y", "checkedAt": "2026-10-02", "amount": 4822232907, "currency": "EUR", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00B6R52259": Object.freeze({"sheet": "Part : 34 473,35 M$ au 31/07/2026", "source": {"url": "https://www.ishares.com/gls-download/literature/fact-sheet/ssac-ishares-msci-acwi-ucits-etf-fund-fact-sheet-en-gb.pdf", "checkedAt": "2026-10-02", "amount": 34473350000, "currency": "USD", "asOf": "2026-07-31", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00B6YX5D40": Object.freeze({"sheet": "Part : 3 884,71 M$ au 31/08/2026", "index": "Part : 3 884,71 M$ au 31/08/2026", "source": {"url": "https://www.ssga.com/library-content/products/factsheets/etfs/emea/israel/factsheet-is-en_gb-spyd-gy.pdf", "checkedAt": "2026-10-02", "amount": 3884710000, "currency": "USD", "asOf": "2026-08-31", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00B8FHGS14": Object.freeze({"sheet": "Part : 2 589,24 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/251382/ishares-msci-world-minimum-volatility-ucits-etf", "checkedAt": "2026-10-02", "amount": 2589244396, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00B8GKDB10": Object.freeze({
  "index": "9 930 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00B8GKDB10",
    "checkedAt": "2026-09-29",
    "amountMillions": 9930,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "9 930 M€ (relevé le 29/09/2026)"
}),
  "IE00B9CQXS71": Object.freeze({
  "index": "1 501 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00B9CQXS71",
    "checkedAt": "2026-09-29",
    "amountMillions": 1501,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "1 501 M€ (relevé le 29/09/2026)"
}),
  "IE00BF0M2Z96": Object.freeze({"sheet": "Fonds : 820,20 M$ au 31/08/2026", "source": {"url": "https://www.fundslibrary.co.uk/FundsLibrary.DataRetrieval//Documents.aspx?id=10bd7cf4-b986-4027-9174-6e7df8612816&type=packet_fund_class_doc_factsheet_private&user=fidelitydocumentreport", "checkedAt": "2026-10-02", "amount": 820200000, "currency": "USD", "asOf": "2026-08-31", "scope": "Encours du fonds publié par l’émetteur"}}),
  "IE00BF3N7094": Object.freeze({"sheet": "Part : 1 443,30 M€ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/290618/ishares-high-yield-corp-bond-ucits-etf", "checkedAt": "2026-10-02", "amount": 1443301518, "currency": "EUR", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BF4RFH31": Object.freeze({"sheet": "Part : 8 807,75 M$ au 01/10/2026", "index": "Part : 8 807,75 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/296576/?siteEntryPassthrough=true&switchLocale=y", "checkedAt": "2026-10-02", "amount": 8807754170, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BFZPF546": Object.freeze({"sheet": "Part : 557,94 M$ au 31/08/2026", "source": {"url": "https://www.ishares.com/gls-download/literature/fact-sheet/emga-ishares-j-p-morgan-em-local-govt-bond-ucits-etf-fund-fact-sheet-en-gb.pdf", "checkedAt": "2026-10-02", "amount": 557940000, "currency": "USD", "asOf": "2026-08-31", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BJ5JNY98": Object.freeze({"sheet": "Part : 1 351,72 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/308858/ishares-msci-world-information-technology-sector-advanced-ucits-etf", "checkedAt": "2026-10-02", "amount": 1351716351, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BJ5JP097": Object.freeze({"sheet": "Part : 174,45 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/308836/ishares-msci-world-financials-sector-advanced-ucits-etf", "checkedAt": "2026-10-02", "amount": 174445516, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BJ5JPG56": Object.freeze({ index: "2 231 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BJ5JPG56", checkedAt: "2026-09-29", amountMillions: 2231, currency: "EUR", asOf: null } }),
  "IE00BK5BCD43": Object.freeze({"sheet": "Fonds : 2 090,90 M$ au 31/08/2026", "source": {"url": "https://dokumenty.analizy.pl/pobierz/etf/E_LG001_A_USD/KA/2026-08-31", "checkedAt": "2026-10-02", "amount": 2090900000, "currency": "USD", "asOf": "2026-08-31", "scope": "Encours du fonds publié par l’émetteur"}}),
  "IE00BK5BQT80": Object.freeze({ sheet: "53 167 M€ (relevé le 29/09/2026)", index: "53 167 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BK5BQT80", checkedAt: "2026-09-29", amountMillions: 53167, currency: "EUR", asOf: null } }),
  "IE00BK5BR733": Object.freeze({
  "index": "2 148 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00BK5BR733",
    "checkedAt": "2026-09-29",
    "amountMillions": 2148,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "2 148 M€ (relevé le 29/09/2026)"
}),
  "IE00BKM4GZ66": Object.freeze({"sheet": "Part : 45 173,88 M$ au 01/10/2026", "index": "Part : 45 173,88 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/264659/?siteEntryPassthrough=true&switchLocale=y", "checkedAt": "2026-10-02", "amount": 45173877213, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BM8R0J59": Object.freeze({ sheet: "746 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BM8R0J59", checkedAt: "2026-09-29", amountMillions: 746, currency: "EUR", asOf: null } }),
  "IE00BMG6Z448": Object.freeze({ sheet: "5 048 M€ (relevé le 29/09/2026)", index: "5 048 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BMG6Z448", checkedAt: "2026-09-29", amountMillions: 5048, currency: "EUR", asOf: null } }),
  "IE00BP3QZ601": Object.freeze({"sheet": "Part : 6 469,13 M$ au 01/10/2026", "index": "Part : 6 469,13 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/270054/ishares-msci-world-quality-factor-ucits-etf", "checkedAt": "2026-10-02", "amount": 6469126268, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BP3QZ825": Object.freeze({"sheet": "Part : 6 430,16 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/270051/ishares-msci-world-momentum-factor-ucits-etf", "checkedAt": "2026-10-02", "amount": 6430157868, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BP3QZB59": Object.freeze({"sheet": "Part : 7 514,61 M$ au 01/10/2026", "index": "Part : 7 514,61 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf", "checkedAt": "2026-10-02", "amount": 7514608586, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BQT3WG13": Object.freeze({ index: "2 302 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=IE00BQT3WG13", checkedAt: "2026-09-29", amountMillions: 2302, currency: "EUR", asOf: null } }),
  "IE00BYPLS672": Object.freeze({"sheet": "Fonds : 3 871,70 M$ au 31/08/2026", "source": {"url": "https://docs.fundconnect.com/GetDocument.aspx?Isin=IE00BYPLS672&clientid=18svzhes-n8uj-xtdb-oidd-a58dzenasvsr&lang=en-GB&save=false&type=Factsheet", "checkedAt": "2026-10-02", "amount": 3871700000, "currency": "USD", "asOf": "2026-08-31", "scope": "Encours du fonds publié par l’émetteur"}}),
  "IE00BYTRR863": Object.freeze({"sheet": "Part : 574,72 M$ au 31/08/2026", "source": {"url": "https://www.ssga.com/library-content/products/factsheets/etfs/emea/israel/factsheet-is-en_gb-wnrg-na.pdf", "checkedAt": "2026-10-02", "amount": 574720000, "currency": "USD", "asOf": "2026-08-31", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BYXG2H39": Object.freeze({"sheet": "Part : 1 149,20 M$ au 31/08/2026", "source": {"url": "https://www.ishares.com/ch/institutional/en/literature/fact-sheet/btec-ishares-nasdaq-us-biotechnology-ucits-etf-fund-fact-sheet-fr-ch.pdf", "checkedAt": "2026-10-02", "amount": 1149200000, "currency": "USD", "asOf": "2026-08-31", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "IE00BYYHSQ67": Object.freeze({
  "index": "1 524 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=IE00BYYHSQ67",
    "checkedAt": "2026-09-29",
    "amountMillions": 1524,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "1 524 M€ (relevé le 29/09/2026)"
}),
  "IE00BYZK4552": Object.freeze({"sheet": "Part : 5 536,09 M$ au 01/10/2026", "source": {"url": "https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y", "checkedAt": "2026-10-02", "amount": 5536090560, "currency": "USD", "asOf": "2026-10-01", "scope": "Actif net de la part exacte, distinct de l’encours total du fonds"}}),
  "JE00B1VS3770": Object.freeze({
  "index": "6 349 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=JE00B1VS3770",
    "checkedAt": "2026-09-29",
    "amountMillions": 6349,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "6 349 M€ (relevé le 29/09/2026)"
}),
  "LU0908500753": Object.freeze({ index: "20 925 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU0908500753", checkedAt: "2026-09-29", amountMillions: 20925, currency: "EUR", asOf: null } }),
  "LU1681043599": Object.freeze({
  "index": "6 706 M€ (relevé le 29/09/2026)",
  "source": {
    "url": "https://www.justetf.com/fr/etf-profile.html?isin=LU1681043599",
    "checkedAt": "2026-09-29",
    "amountMillions": 6706,
    "currency": "EUR",
    "asOf": null
  },
  "sheet": "6 706 M€ (relevé le 29/09/2026)"
}),
  "LU1681047236": Object.freeze({ sheet: "4 066 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU1681047236", checkedAt: "2026-09-29", amountMillions: 4066, currency: "EUR", asOf: null } }),
  "LU1681048630": Object.freeze({ sheet: "343 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU1681048630", checkedAt: "2026-09-29", amountMillions: 343, currency: "EUR", asOf: null } }),
  "LU1834983550": Object.freeze({ sheet: "531 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU1834983550", checkedAt: "2026-09-29", amountMillions: 531, currency: "EUR", asOf: null } }),
  "LU2196470426": Object.freeze({ index: "441 M€ (relevé le 29/09/2026)", source: { url: "https://www.justetf.com/fr/etf-profile.html?isin=LU2196470426", checkedAt: "2026-09-29", amountMillions: 441, currency: "EUR", asOf: null } }),

  // Supports déjà utilisés : profils ISIN contrôlés le 03/10/2026.
  "IE00B5BMR087": Object.freeze({
  "sheet": "136 043 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B5BMR087",
    "checkedAt": "2026-10-03",
    "amountMillions": 136043,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B53SZB19": Object.freeze({
  "sheet": "25 754 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B53SZB19",
    "checkedAt": "2026-10-03",
    "amountMillions": 25754,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "FR0010342592": Object.freeze({
  "sheet": "1 362 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0010342592",
    "checkedAt": "2026-10-03",
    "amountMillions": 1362,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "FR0010755611": Object.freeze({
  "sheet": "1 138 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0010755611",
    "checkedAt": "2026-10-03",
    "amountMillions": 1138,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "FR0013380607": Object.freeze({
  "sheet": "1 060 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=FR0013380607",
    "checkedAt": "2026-10-03",
    "amountMillions": 1060,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B4K48X80": Object.freeze({
  "sheet": "15 726 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4K48X80",
    "checkedAt": "2026-10-03",
    "amountMillions": 15726,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B43HR379": Object.freeze({
  "sheet": "2 780 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B43HR379",
    "checkedAt": "2026-10-03",
    "amountMillions": 2780,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BD6FTQ80": Object.freeze({
  "sheet": "4 031 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BD6FTQ80",
    "checkedAt": "2026-10-03",
    "amountMillions": 4031,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BDFL4P12": Object.freeze({
  "sheet": "2 140 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BDFL4P12",
    "checkedAt": "2026-10-03",
    "amountMillions": 2140,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "LU1437018838": Object.freeze({
  "sheet": "352 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1437018838",
    "checkedAt": "2026-10-03",
    "amountMillions": 352,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "LU1737652823": Object.freeze({
  "sheet": "55 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1737652823",
    "checkedAt": "2026-10-03",
    "amountMillions": 55,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BK5BR626": Object.freeze({
  "sheet": "3 020 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BR626",
    "checkedAt": "2026-10-03",
    "amountMillions": 3020,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BKPSFC54": Object.freeze({
  "sheet": "558 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BKPSFC54",
    "checkedAt": "2026-10-03",
    "amountMillions": 558,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "LU1931975079": Object.freeze({
  "sheet": "1 320 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1931975079",
    "checkedAt": "2026-10-03",
    "amountMillions": 1320,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BZ163G84": Object.freeze({
  "sheet": "3 285 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BZ163G84",
    "checkedAt": "2026-10-03",
    "amountMillions": 3285,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B3T9LM79": Object.freeze({
  "sheet": "685 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B3T9LM79",
    "checkedAt": "2026-10-03",
    "amountMillions": 685,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B4L5Y983": Object.freeze({
  "sheet": "129 628 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4L5Y983",
    "checkedAt": "2026-10-03",
    "amountMillions": 129628,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "LU1681045370": Object.freeze({
  "sheet": "4 284 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU1681045370",
    "checkedAt": "2026-10-03",
    "amountMillions": 4284,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B469F816": Object.freeze({
  "sheet": "1 992 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B469F816",
    "checkedAt": "2026-10-03",
    "amountMillions": 1992,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B14X4Q57": Object.freeze({
  "sheet": "1 767 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B14X4Q57",
    "checkedAt": "2026-10-03",
    "amountMillions": 1767,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BMW42413": Object.freeze({
  "sheet": "274 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BMW42413",
    "checkedAt": "2026-10-03",
    "amountMillions": 274,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE0000N55FP4": Object.freeze({
  "sheet": "9 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE0000N55FP4",
    "checkedAt": "2026-10-03",
    "amountMillions": 9,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B42NKQ00": Object.freeze({
  "sheet": "1 546 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B42NKQ00",
    "checkedAt": "2026-10-03",
    "amountMillions": 1546,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B3WJKG14": Object.freeze({
  "sheet": "18 152 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B3WJKG14",
    "checkedAt": "2026-10-03",
    "amountMillions": 18152,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BG0J4C88": Object.freeze({
  "sheet": "1 940 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BG0J4C88",
    "checkedAt": "2026-10-03",
    "amountMillions": 1940,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B1XNHC34": Object.freeze({
  "sheet": "2 606 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B1XNHC34",
    "checkedAt": "2026-10-03",
    "amountMillions": 2606,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B40B8R38": Object.freeze({
  "sheet": "504 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B40B8R38",
    "checkedAt": "2026-10-03",
    "amountMillions": 504,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B4KBBD01": Object.freeze({
  "sheet": "975 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4KBBD01",
    "checkedAt": "2026-10-03",
    "amountMillions": 975,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "NL0011683594": Object.freeze({
  "sheet": "9 764 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=NL0011683594",
    "checkedAt": "2026-10-03",
    "amountMillions": 9764,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "NL0009690239": Object.freeze({
  "sheet": "433 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=NL0009690239",
    "checkedAt": "2026-10-03",
    "amountMillions": 433,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "LU2970735911": Object.freeze({
  "sheet": "71 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=LU2970735911",
    "checkedAt": "2026-10-03",
    "amountMillions": 71,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BK95B138": Object.freeze({
  "sheet": "564 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BK95B138",
    "checkedAt": "2026-10-03",
    "amountMillions": 564,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B5W4TY14": Object.freeze({
  "sheet": "762 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B5W4TY14",
    "checkedAt": "2026-10-03",
    "amountMillions": 762,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B0M63623": Object.freeze({
  "sheet": "1 526 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B0M63623",
    "checkedAt": "2026-10-03",
    "amountMillions": 1526,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00BKPX3K41": Object.freeze({
  "sheet": "101 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00BKPX3K41",
    "checkedAt": "2026-10-03",
    "amountMillions": 101,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
  "IE00B4JNQZ49": Object.freeze({
  "sheet": "1 974 M€ (relevé le 03/10/2026)",
  "source": {
    "url": "https://www.justetf.com/en/etf-profile.html?isin=IE00B4JNQZ49",
    "checkedAt": "2026-10-03",
    "amountMillions": 1974,
    "currency": "EUR",
    "asOf": null,
    "scope": "Encours affiché sur le profil ; distinction fonds/part non publiée"
  }
}),
});

export function getInstrumentAum(isin, context) {
  const value = INSTRUMENT_AUM_BY_ISIN[isin]?.[context] ?? INSTRUMENT_AUM_BY_ISIN[isin]?.index ?? INSTRUMENT_AUM_BY_ISIN[isin]?.sheet;
  if (!value) throw new Error(`Encours absent pour ${isin} (${context})`);
  return value;
}

export function getInstrumentAumBillions(isin) {
  const millions = INSTRUMENT_AUM_BY_ISIN[isin]?.source?.amountMillions;
  if (!Number.isFinite(millions)) throw new Error(`Encours EUR en millions absent pour ${isin}`);
  return `${(millions / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md€`;
}
