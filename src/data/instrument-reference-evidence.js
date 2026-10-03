import { EXPOSURE_ADDITIONS } from './exposure-additions.js';
// Profils individuels consultés le 30/09/2026. Les preuves chiffrées sont figées dans scripts/source-snapshots/instrument-profiles-2026-09-30.json.
export const INSTRUMENT_REFERENCE_EVIDENCE = {
...Object.fromEntries(EXPOSURE_ADDITIONS.map(r => [r.isin, { sourceUrls: [r.source], checkedAt: '2026-10-03', dateStatus: 'not-applicable', scope: `Part ${r.isin}`, method: 'Identification par ISIN dans la publication émetteur', note: 'Devise de cotation distincte de celle de rendement.' }])),
  "LU0290358497": {
  "sourceUrls": [
    "https://etf.dws.com/download/asset/5643099c-7044-46a2-bfd8-b24c4752c7f6"
  ],
  "checkedAt": "2026-10-01",
  "dateStatus": "not-applicable",
  "scope": "Part LU0290358497",
  "method": "Identité et caractéristiques recoupées sur la publication de l’émetteur",
  "note": "Nom éditorial de la part ; devise de cotation distincte de la devise de rendement."
},
  "IE00B3FH7618": {
  "sourceUrls": [
    "https://www.ishares.com/uk/individual/en/products/251741/ishares-euro-government-bond-01yr-ucits-etf"
  ],
  "checkedAt": "2026-10-01",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B3FH7618",
  "method": "Identité et caractéristiques recoupées sur la publication de l’émetteur",
  "note": "Nom éditorial de la part ; devise de cotation distincte de la devise de rendement."
},
  "IE00BDBRDM35": {
  "sourceUrls": [
    "https://www.ishares.com/uk/individual/en/products/291770/ishares-global-aggregate-bond-ucits-etf-eur-hedged-%28acc%29-fund?siteEntryPassthrough=true"
  ],
  "checkedAt": "2026-10-01",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BDBRDM35",
  "method": "Identité et caractéristiques recoupées sur la publication de l’émetteur",
  "note": "Nom éditorial de la part ; devise de cotation distincte de la devise de rendement."
},
  "IE00BZCQB185": {
  "sourceUrls": [
    "https://www.ishares.com/uk/individual/en/products/297617/ishares-msci-india-ucits-etf"
  ],
  "checkedAt": "2026-10-01",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BZCQB185",
  "method": "Identité et caractéristiques recoupées sur la publication de l’émetteur",
  "note": "Nom éditorial de la part ; devise de cotation distincte de la devise de rendement."
},
  "IE00B1FZS467": {
  "sourceUrls": [
    "https://www.ishares.com/uk/individual/en/products/251809/ishares-global-infrastructure-ucits-etf"
  ],
  "checkedAt": "2026-10-01",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B1FZS467",
  "method": "Identité et caractéristiques recoupées sur la publication de l’émetteur",
  "note": "Nom éditorial de la part ; devise de cotation distincte de la devise de rendement."
},

  "IE00B4L5Y983": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B4L5Y983"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B4L5Y983",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BK5BQT80": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BQT80"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BK5BQT80",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "CH0454664001": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=CH0454664001"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part CH0454664001",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "FR0011550185": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0011550185"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0011550185",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0013411998": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0013411998"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0013411998",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0014017NX3": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0014017NX3"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0014017NX3",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE0006WW1TQ4": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE0006WW1TQ4"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE0006WW1TQ4",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "DE000A0H08Q4": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=DE000A0H08Q4"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part DE000A0H08Q4",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "DE000A27Z304": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=DE000A27Z304"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part DE000A27Z304",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "FR0010342592": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=FR0010342592"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part FR0010342592",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "FR0010524777": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0010524777"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0010524777",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0010527275": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0010527275"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0010527275",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0010755611": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=FR0010755611"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part FR0010755611",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "FR0011440478": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0011440478"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0011440478",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0011550193": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0011550193"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0011550193",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0011869320": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0011869320"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0011869320",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0011871078": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0011871078"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0011871078",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0011871110": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0011871110"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0011871110",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0011871128": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0011871128"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0011871128",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0013380607": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=FR0013380607"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part FR0013380607",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "FR0013411980": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0013411980"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0013411980",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0013412004": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0013412004"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0013412004",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0013412012": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0013412012"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0013412012",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0013412020": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0013412020"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0013412020",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0013412038": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR0013412038"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR0013412038",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR0013416716": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=FR0013416716"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part FR0013416716",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "FR001400S9V0": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR001400S9V0"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR001400S9V0",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "FR001400U5Q4": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=FR001400U5Q4"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part FR001400U5Q4",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "GB00B15KXQ89": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=GB00B15KXQ89"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part GB00B15KXQ89",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "GB00BJYDH287": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=GB00BJYDH287"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part GB00BJYDH287",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "GB00BLD4ZL17": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=GB00BLD4ZL17"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part GB00BLD4ZL17",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "GB00BLD4ZM24": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=GB00BLD4ZM24"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part GB00BLD4ZM24",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE0000N55FP4": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE0000N55FP4"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE0000N55FP4",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE0002XZSHO1": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE0002XZSHO1"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE0002XZSHO1",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE0002Y8CX98": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE0002Y8CX98"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE0002Y8CX98",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE0007Y8Y157": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE0007Y8Y157"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE0007Y8Y157",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000C6ITGC8": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000C6ITGC8"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000C6ITGC8",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000DQLYVB9": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000DQLYVB9"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000DQLYVB9",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000I8KRLL9": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000I8KRLL9"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000I8KRLL9",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000L6ZMMC4": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000L6ZMMC4"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000L6ZMMC4",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000M7V94E1": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000M7V94E1"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000M7V94E1",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000QDFFK00": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000QDFFK00"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000QDFFK00",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000RDRMSD1": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000RDRMSD1"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000RDRMSD1",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000W8WMSL2": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000W8WMSL2"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000W8WMSL2",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000XZSV718": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000XZSV718"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000XZSV718",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000YU9K6K2": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000YU9K6K2"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000YU9K6K2",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE000YYE6WK5": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE000YYE6WK5"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE000YYE6WK5",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B02KXK85": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B02KXK85"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B02KXK85",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B0M62X26": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B0M62X26"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B0M62X26",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B0M63623": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B0M63623"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B0M63623",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B14X4Q57": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B14X4Q57"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B14X4Q57",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B1FZS350": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B1FZS350"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B1FZS350",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B1XNHC34": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B1XNHC34"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B1XNHC34",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B3F81R35": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B3F81R35"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B3F81R35",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B3T9LM79": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B3T9LM79"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B3T9LM79",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B3VVMM84": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B3VVMM84"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B3VVMM84",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B3WJKG14": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B3WJKG14"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B3WJKG14",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B40B8R38": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B40B8R38"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B40B8R38",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B42NKQ00": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B42NKQ00"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B42NKQ00",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B43HR379": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B43HR379"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B43HR379",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B44Z5B48": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B44Z5B48"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B44Z5B48",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B469F816": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B469F816"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B469F816",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B4JNQZ49": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B4JNQZ49"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B4JNQZ49",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B4K48X80": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B4K48X80"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B4K48X80",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B4K6B022": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B4K6B022"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B4K6B022",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B4KBBD01": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B4KBBD01"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B4KBBD01",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B4L5YX21": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B4L5YX21"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B4L5YX21",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B4NCWG09": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B4NCWG09"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B4NCWG09",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B4ND3602": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B4ND3602"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B4ND3602",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B4WXJJ64": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B4WXJJ64"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B4WXJJ64",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B52SFT06": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B52SFT06"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B52SFT06",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B53L3W79": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B53L3W79"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B53L3W79",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B53SZB19": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B53SZB19"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B53SZB19",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B579F325": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B579F325"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B579F325",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B5BMR087": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B5BMR087"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B5BMR087",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B5M1WJ87": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B5M1WJ87"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B5M1WJ87",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B5W4TY14": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B5W4TY14"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B5W4TY14",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B66F4759": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B66F4759"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B66F4759",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B6R52259": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B6R52259"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B6R52259",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B6YX5D40": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B6YX5D40"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B6YX5D40",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B8FHGS14": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00B8FHGS14"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00B8FHGS14",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00B8GKDB10": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B8GKDB10"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B8GKDB10",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00B9CQXS71": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00B9CQXS71"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00B9CQXS71",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BD4TXV59": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BD4TXV59"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BD4TXV59",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BD6FTQ80": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BD6FTQ80"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BD6FTQ80",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BDFBTQ78": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BDFBTQ78"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BDFBTQ78",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BDFL4P12": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BDFL4P12"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BDFL4P12",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BF0M2Z96": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BF0M2Z96"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BF0M2Z96",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BF3N7094": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BF3N7094"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BF3N7094",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BF4RFH31": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BF4RFH31"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BF4RFH31",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BFZPF546": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BFZPF546"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BFZPF546",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BG0J4C88": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BG0J4C88"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BG0J4C88",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BGV5VN51": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BGV5VN51"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BGV5VN51",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BJ5JNY98": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JNY98"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BJ5JNY98",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BJ5JNZ06": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JNZ06"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BJ5JNZ06",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BJ5JP097": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JP097"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BJ5JP097",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BJ5JPG56": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JPG56"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BJ5JPG56",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BK5BCD43": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BCD43"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BK5BCD43",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BK5BCH80": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BCH80"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BK5BCH80",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BK5BR626": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BR626"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BK5BR626",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BK5BR733": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BR733"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BK5BR733",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BK95B138": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BK95B138"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BK95B138",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BKM4GZ66": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BKM4GZ66"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BKM4GZ66",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BKPSFC54": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BKPSFC54"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BKPSFC54",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BKPX3K41": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BKPX3K41"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BKPX3K41",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BM67HK77": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BM67HK77"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BM67HK77",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BM67HS53": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BM67HS53"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BM67HS53",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BM8R0J59": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BM8R0J59"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BM8R0J59",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BMG6Z448": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BMG6Z448"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BMG6Z448",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BMW42413": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BMW42413"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BMW42413",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BP3QZ601": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZ601"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BP3QZ601",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BP3QZ825": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZ825"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BP3QZ825",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BP3QZB59": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZB59"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BP3QZB59",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BQT3WG13": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BQT3WG13"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BQT3WG13",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BTJRMP35": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BTJRMP35"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BTJRMP35",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BYPLS672": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BYPLS672"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BYPLS672",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BYTRR863": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BYTRR863"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BYTRR863",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BYXG2H39": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BYXG2H39"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BYXG2H39",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BYYHSQ67": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BYYHSQ67"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BYYHSQ67",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BYZK4552": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BYZK4552"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BYZK4552",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "IE00BZ163G84": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=IE00BZ163G84"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part IE00BZ163G84",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "IE00BZ56SW52": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=IE00BZ56SW52"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part IE00BZ56SW52",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "JE00B1VS3770": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=JE00B1VS3770"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part JE00B1VS3770",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "LU0908500753": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU0908500753"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU0908500753",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1437018838": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=LU1437018838"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part LU1437018838",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "LU1681043599": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=LU1681043599"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part LU1681043599",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "LU1681045370": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=LU1681045370"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part LU1681045370",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "LU1681047236": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU1681047236"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU1681047236",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1681048630": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU1681048630"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU1681048630",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1737652823": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=LU1737652823"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part LU1737652823",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "LU1834983550": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU1834983550"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU1834983550",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1834983634": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU1834983634"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU1834983634",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1834986900": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU1834986900"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU1834986900",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1834988518": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU1834988518"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU1834988518",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1875395870": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU1875395870"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU1875395870",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU1931975079": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=LU1931975079"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part LU1931975079",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "LU2089238385": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU2089238385"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU2089238385",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU2196470426": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU2196470426"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU2196470426",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "LU2970735911": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=LU2970735911"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part LU2970735911",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "LU3038520774": {
    "sourceUrls": [
      "https://www.justetf.com/en/etf-profile.html?isin=LU3038520774"
    ],
    "checkedAt": "2026-09-30",
    "dateStatus": "not-applicable",
    "scope": "Identification de la part LU3038520774",
    "method": "Profil individuel justETF consulté par ISIN",
    "note": "Produit identifié ; les variantes de libellé sont éditoriales, pas des noms juridiques certifiés."
  },
  "NL0009690239": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=NL0009690239"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part NL0009690239",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
},
  "NL0011683594": {
  "sourceUrls": [
    "https://www.justetf.com/en/etf-profile.html?isin=NL0011683594"
  ],
  "checkedAt": "2026-10-03",
  "dateStatus": "not-applicable",
  "scope": "Part NL0011683594",
  "method": "Profil consulté par ISIN ; caractéristiques et TER observés",
  "note": "Capture instrument-supports-2026-10-03.json. Les anciens encours conservent leur date de contrôle ; aucun statut PEA déduit."
}
};
