import { AUTOMATED_ETF } from './automated-etf.js';
import { EXPOSURE_ADDITIONS } from './exposure-additions.js';
import { INSTRUMENT_REFERENCE_EVIDENCE } from './instrument-reference-evidence.js';
// Frais annuels publiés dans l'application, indexés par ISIN. Valeurs héritées des
// trois bibliothèques ETF et de leurs vérifications ; cette centralisation n'est
// pas une nouvelle vérification chez l'émetteur. Mettre à jour ici puis contrôler
// les mentions de frais dans les textes éditoriaux lors d'une modification.
export const ETF_TER_BY_ISIN = Object.freeze({
...Object.fromEntries(EXPOSURE_ADDITIONS.map(r => [r.isin, r.ter])),
  // iShares IUFS, IE00B4JNQZ49, 0,15 %, vérifié le 02/10/2026 sur profil et fiche officiels.
  // https://www.ishares.com/uk/individual/en/products/280523/ishares-sp-500-financials-sector-ucits-etf
  'IE00B4JNQZ49': '0,15',
  "LU0290358497": "0,10",
  "IE00B3FH7618": "0,07",
  "IE00BDBRDM35": "0,10",
  "IE00B0M62X26": "0,09",
  "IE00BZCQB185": "0,65",
  "IE00B1FZS467": "0,65",

  // Or et crypto ajoutés le 25/09/2026 (nouvelle famille Comparateur d'indices + 2 fiches ETF) :
  // TER confirmés via justETF/fiches émetteur (recherche web du 25/09/2026).
  'CH0454664001': '1,49',
  'DE000A27Z304': '2,00',
  'GB00BJYDH287': '0,15',
  'GB00BLD4ZL17': '0,15',
  'GB00BLD4ZM24': '0,00',
  'IE00B579F325': '0,12',
  'JE00B1VS3770': '0,39',
  'DE000A0H08Q4': '0,46',
  'FR0010524777': '0,60',
  'FR0010527275': '0,60',
  'FR0011440478': '0,55',
  'FR0011550185': '0,14',
  'FR0011550193': '0,19',
  'FR0011869320': '0,85',
  'FR0011871078': '0,65',
  'FR0011871110': '0,30',
  'FR0011871128': '0,12',
  'FR0013411980': '0,20',
  // Part TOPIX couverte EUR, fiche Amundi du 30/04/2026.
  // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260430
  'FR0013411998': '0,48',
  'FR0013412004': '0,30',
  'FR0013412012': '0,30',
  'FR0013412020': '0,30',
  'FR0013412038': '0,15',
  'FR0013416716': '0,12',
  'FR001400S9V0': '0,30',
  'FR001400U5Q4': '0,20',
  'FR0014017NX3': '0,30',
  'GB00B15KXQ89': '0,49',
  'IE0002XZSHO1': '0,20',
  'IE0002Y8CX98': '0,40',
  'IE0007Y8Y157': '0,55',
  'IE000C6ITGC8': '0,50',
  // iShares S&P 500 Swap PEA SPEA : BlackRock, TER au 25/09/2026.
  // https://www.blackrock.com/fr/intermediaries/products/342916/
  'IE000DQLYVB9': '0,10',
  'IE000I8KRLL9': '0,35',
  'IE000L6ZMMC4': '0,07',
  'IE000M7V94E1': '0,55',
  'IE000QDFFK00': '0,14',
  'IE000RDRMSD1': '0,50',
  'IE000W8WMSL2': '0,50',
  'IE000XZSV718': '0,03',
  'IE000YU9K6K2': '0,55',
  'IE000YYE6WK5': '0,55',
  'IE00B02KXK85': '0,74',
  'IE00B1FZS350': '0,59',
  'IE00B1XNHC34': '0,65',
  'IE00B3F81R35': '0,09',
  'IE00B3VVMM84': '0,17',
  'IE00B44Z5B48': '0,12',
  'IE00B4K48X80': '0,12',
  'IE00B4K6B022': '0,05',
  // iShares Core MSCI World SWDA, fiche BlackRock consultée le 27/09/2026.
  // https://www.ishares.com/uk/individual/en/products/251882/ishares-core-msci-world-ucits-etf
  'IE00B4L5Y983': '0,20',
  'IE00B4L5YX21': '0,12',
  'IE00B4NCWG09': '0,20',
  'IE00B4ND3602': '0,12',
  'IE00B4WXJJ64': '0,07',
  // BlackRock /253740 et justETF, contrôlés le 30/09/2026 : TER 0,03 %, confiance élevée.
  'IE00B52SFT06': '0,03',
  'IE00B53L3W79': '0,10',
  'IE00B5M1WJ87': '0,30',
  'IE00B66F4759': '0,50',
  'IE00B6R52259': '0,20',
  'IE00B6YX5D40': '0,35',
  'IE00B8FHGS14': '0,30',
  'IE00B8GKDB10': '0,29',
  'IE00B9CQXS71': '0,45',
  'IE00BD4TXV59': '0,06',
  'IE00BDFBTQ78': '0,50',
  'IE00BF0M2Z96': '0,49',
  'IE00BF3N7094': '0,50',
  'IE00BF4RFH31': '0,35',
  // Xtrackers MSCI World ex USA 1C, DWS au 24/09/2026.
  // https://etf.dws.com/en-gb/knowledge/focus-topics/stocks-shares-isa-in-the-uk/
  'IE0006WW1TQ4': '0,15',
  'IE00BFZPF546': '0,50',
  'IE00BGV5VN51': '0,35',
  'IE00BJ5JNY98': '0,18',
  'IE00BJ5JNZ06': '0,18',
  'IE00BJ5JP097': '0,18',
  'IE00BJ5JPG56': '0,28',
  'IE00BK5BCD43': '0,49',
  'IE00BK5BCH80': '0,49',
  'IE00BK5BQT80': '0,14',
  'IE00BK5BR733': '0,17',
  'IE00BKM4GZ66': '0,18',
  'IE00BM67HK77': '0,25',
  'IE00BM67HS53': '0,25',
  'IE00BM8R0J59': '0,45',
  'IE00BMG6Z448': '0,18',
  'IE00BP3QZ601': '0,25',
  // BlackRock /270051 et justETF, contrôlés le 30/09/2026 : TER 0,25 %, confiance élevée.
  'IE00BP3QZ825': '0,25',
  'IE00BP3QZB59': '0,25',
  'IE00BQT3WG13': '0,40',
  'IE00BTJRMP35': '0,18',
  'IE00BYPLS672': '0,69',
  'IE00BYTRR863': '0,30',
  'IE00BYXG2H39': '0,35',
  'IE00BYYHSQ67': '0,38',
  'IE00BYZK4552': '0,40',
  'IE00BZ56SW52': '0,38',
  'LU0908500753': '0,07',
  'LU1681043599': '0,38',
  'LU1681047236': '0,09',
  'LU1681048630': '0,25',
  'LU1834983634': '0,30',
  // Amundi STOXX Europe 600 Basic Resources, fiche au 30/06/2026 : 0,30 %.
  // https://www.amundietf.com/pdfDocuments/monthly-factsheet/LU1834983550/ENG/LUX/RETAIL/ETF/20260630
  'LU1834983550': '0,30',
  'LU1834986900': '0,30',
  'LU1834988518': '0,30',
  'LU1875395870': '0,19',
  'LU2089238385': '0,05',
  'LU2196470426': '0,09',
  'LU3038520774': '0,35',

  // Supports déjà utilisés : profils ISIN contrôlés le 03/10/2026.
  "IE00B5BMR087": "0,07",
  "IE00B53SZB19": "0,30",
  "FR0010342592": "0,60",
  "FR0010755611": "0,50",
  "FR0013380607": "0,25",
  "IE00B43HR379": "0,15",
  "IE00BD6FTQ80": "0,19",
  "IE00BDFL4P12": "0,19",
  "LU1437018838": "0,24",
  "LU1737652823": "0,24",
  "IE00BK5BR626": "0,29",
  "IE00BKPSFC54": "0,38",
  "LU1931975079": "0,07",
  "IE00BZ163G84": "0,07",
  "IE00B3T9LM79": "0,12",
  "LU1681045370": "0,20",
  "IE00B469F816": "0,18",
  "IE00B14X4Q57": "0,10",
  "IE00BMW42413": "0,18",
  "IE0000N55FP4": "0,25",
  "IE00B42NKQ00": "0,15",
  "IE00B3WJKG14": "0,15",
  "IE00BG0J4C88": "0,40",
  "IE00B40B8R38": "0,15",
  "IE00B4KBBD01": "0,15",
  "NL0011683594": "0,38",
  "NL0009690239": "0,25",
  "LU2970735911": "0,15",
  "IE00BK95B138": "0,07",
  "IE00B5W4TY14": "0,65",
  "IE00B0M63623": "0,74",
  "IE00BKPX3K41": "0,74",
  ...Object.fromEntries(Object.entries(AUTOMATED_ETF).filter(([, r]) => r.characteristics).map(([isin, r]) => [isin, r.characteristics.terPct.toFixed(2).replace('.', ',')])),
});

export function formatEtfTer(isin, format = 'tweet') {
  const ter = ETF_TER_BY_ISIN[isin];
  if (!ter) throw new Error(`Frais annuels manquants pour l'ISIN ${isin}`);
  if (format === 'sheet') return `${ter}%`;
  if (format === 'index') return `${ter} %`;
  return ter;
}

// Les frais sont ceux observés au contrôle ; leur date d’entrée en vigueur n’est pas publiée.
const primaryTerSources = {
...Object.fromEntries(EXPOSURE_ADDITIONS.map(r => [r.isin, r.source])),
  IE00B4JNQZ49: 'https://www.ishares.com/uk/individual/en/products/280523/ishares-sp-500-financials-sector-ucits-etf',
  "LU0290358497": "https://etf.dws.com/download/asset/5643099c-7044-46a2-bfd8-b24c4752c7f6",
  "IE00B3FH7618": "https://www.ishares.com/uk/individual/en/products/251741/ishares-euro-government-bond-01yr-ucits-etf",
  "IE00BDBRDM35": "https://www.ishares.com/uk/individual/en/products/291770/ishares-global-aggregate-bond-ucits-etf-eur-hedged-%28acc%29-fund?siteEntryPassthrough=true",
  "IE00B0M62X26": "https://www.ishares.com/uk/individual/en/products/251739/ishares-euro-inflation-linked-government-bond-ucits-etf",
  "IE00BMG6Z448": "https://www.ishares.com/uk/individual/en/products/315592/ishares-msci-em-ex-china-ucits-etf?siteEntryPassthrough=true&switchLocale=y",
  "IE00BZCQB185": "https://www.ishares.com/uk/individual/en/products/297617/ishares-msci-india-ucits-etf",
  "IE00B1FZS467": "https://www.ishares.com/uk/individual/en/products/251809/ishares-global-infrastructure-ucits-etf",

  IE00B52SFT06: 'https://www.blackrock.com/fr/intermediaries/products/253740/ishares-msci-usa-b-ucits-etf',
  IE00BP3QZ825: 'https://www.ishares.com/uk/individual/en/products/270051/?siteEntryPassthrough=true&switchLocale=y',
  LU1681048630: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/INSTITUTIONNEL/ETF',
};
export const ETF_TER_EVIDENCE = Object.freeze(Object.fromEntries(Object.keys(ETF_TER_BY_ISIN).map(isin => [isin, {
  ...INSTRUMENT_REFERENCE_EVIDENCE[isin],
  ...(AUTOMATED_ETF[isin]?.characteristics ? { checkedAt: AUTOMATED_ETF[isin].characteristics.checkedAt } : {}),
  sourceUrls: [AUTOMATED_ETF[isin]?.sourceUrl, primaryTerSources[isin], ...INSTRUMENT_REFERENCE_EVIDENCE[isin].sourceUrls].filter(Boolean),
  checkedAt: AUTOMATED_ETF[isin]?.characteristics?.checkedAt ?? (isin === 'IE00B4JNQZ49' ? '2026-10-02' : ["LU0290358497", "IE00B3FH7618", "IE00BDBRDM35", "IE00B0M62X26", "IE00BMG6Z448", "IE00BZCQB185", "IE00B1FZS467"].includes(isin) ? '2026-10-01' : INSTRUMENT_REFERENCE_EVIDENCE[isin].checkedAt),
  dateStatus: 'not-published',
  method: primaryTerSources[isin] ? 'Frais publiés par l’émetteur pour la part exacte' : 'TER publié sur le profil de la part, consulté par ISIN',
  note: isin === 'LU1681048630'
    ? 'Fiche officielle Amundi au 31/08/2026 : frais de gestion et autres frais administratifs ou d’exploitation 0,25 %. justETF affiche 0,35 % : divergence conservée explicitement, priorité à l’émetteur.'
    : 'Frais observés au contrôle ; aucune date d’entrée en vigueur déduite de la consultation.',
}])));
