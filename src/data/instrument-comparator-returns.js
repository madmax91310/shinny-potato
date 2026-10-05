// Rendements calendaires 2023–2025 repris du Comparateur d’indices lorsque
// le Générateur ne possède pas déjà la série de la même part (ISIN).
// IE00BP3QZB59 conserve ici les trois chiffres publiés dans le comparateur :
// la publication BlackRock confirme leur devise USD, désormais corrigée dans
// la note éditoriale et la provenance ; aucune conversion de devise implicite.
// Les commentaires de provenance restent auprès des familles du comparateur.
import { getInstrumentReturnValues } from './instrument-returns.js';

export const COMPARATOR_ISIN_BY_FAMILY_KEY = Object.freeze({
 'monde-toutes-tailles': {},
 'monde-facteurs': {}, // La famille affiche les rendements des indices, aucune ligne perfFunds.
'usa-constructions': {sp500:'IE00B5BMR087',equal:'IE00BLNMYC90',russell:'IE00BJ38QD84'},
  "europe": {
    "msci_europe": "FR0013412038",
    "stoxx600": "FR0011550193",
    "eurostoxx50": "IE00B53L3W79"
  },
  "monde": {
    "msci_world": "LU1681043599",
    "acwi": "FR0014017NX3",
    "ftse_aw": "IE00BK5BQT80"
  },
  "usa": {
    "sp500": "FR0011871128",
    "nasdaq100": "FR0011871110",
    "msci_usa": "IE00B52SFT06"
  },
  "emergents-pea": {
    "paeem_pea": "FR0013412020",
    "paasi": "FR0013412012",
    "palat": "FR0013412004",
    "pinr": "FR0011869320",
    "plem": "FR0011440478"
  },
  "emergents-cto": {
    "msci_em": "IE00BKM4GZ66",
    "ftse_em": "IE00BK5BR733",
    "em_exchina": "IE00BMG6Z448"
  },
  "style": {
    "value": "IE00BP3QZB59",
    "quality": "IE00BP3QZ601"
  },
  "dividendes-cto": {
    "high_div": "IE00B8GKDB10",
    "quality_div": "IE00BYYHSQ67",
    "aristocrats": "IE00B9CQXS71"
  },
  "dividendes-pea": {
    "eudv": "IE00B5M1WJ87"
  },
  "chine": {
    "msci_china": "IE00BJ5JPG56",
    "amundi_pea_chine": "FR0011871078",
    "ftse_china50": "IE00B02KXK85",
    "msci_china_a": "IE00BQT3WG13"
  },
  "japon": {
    "nikkei": "LU2196470426",
    "topix": "FR0013411980",
    "msci_japan": "IE00B4L5YX21"
  },
  "or-argent": {
    "or": "IE00B4ND3602",
    "argent": "IE00B4NCWG09"
  },
  "crypto": {
    "bitcoin": "GB00BLD4ZL17",
    "ethereum": "GB00BLD4ZM24"
  },
  "monde-segments": {
    "world": "IE00B4L5Y983",
    "ex_usa": "IE0006WW1TQ4",
    "small_cap": "IE00BF4RFH31"
  }
});

export const COMPARATOR_RETURNS_BY_ISIN = Object.freeze({
  'FR0011440478': Object.freeze([7.89, 12.77, 15.11]),
  'FR0011550193': Object.freeze([14.37, 8.41, 20.48]),
  'FR0011869320': Object.freeze([15.09, 16.57, -11.15]),
  'FR0011871078': Object.freeze([-15.98, 17.15, 14.64]),
  'FR0013411980': Object.freeze([15.27, 14.56, 10.22]),
  'FR0013412004': Object.freeze([24.63, -25.29, 35.75]),
  'FR0013412012': Object.freeze([1.21, 16.36, 21.78]),
  'FR0013412020': Object.freeze([3.66, 13.39, 21.04]),
  'FR0013412038': Object.freeze([15.95, 8.6, 19.41]),
  'IE00B02KXK85': Object.freeze([-13.6, 31, 28.2]),
  'IE00B52SFT06': Object.freeze([26.7, 24.8, 17.4]),
  'IE00B5M1WJ87': Object.freeze([18.39, 8.55, 20.06]),
  'IE00BP3QZB59': Object.freeze([19.41, 5.25, 39.63]),
  'IE00BJ5JPG56': Object.freeze([-11.4, 19.2, 30.8]),
  'IE00BMG6Z448': Object.freeze([19.7, 3.6, 34.8]),
  'IE00BQT3WG13': Object.freeze([-13.8, 11.3, 26]),
  'LU2196470426': Object.freeze([30.5, 20.9, 28.2]),
});

export function getInstrumentComparatorReturns(isin) {
  const values = COMPARATOR_RETURNS_BY_ISIN[isin] ?? getInstrumentReturnValues(isin).slice(3);
  if (values.length !== 3) throw new Error(`Trois rendements attendus pour ${isin}`);
  return { y2023: values[0], y2024: values[1], y2025: values[2] };
}

// Compléments 2021–2022 qui figurent uniquement dans les fiches de composition.
const FACTSHEET_EARLIER_RETURNS_BY_ISIN = Object.freeze({
  FR0013411980: [],
  LU2196470426: [[2022, -7.7], [2021, 6.3]],
  FR0013412020: [[2022, -15.01], [2021, 4.45]],
});

export function getInstrumentFactsheetReturns(isin) {
  const common = ['FR0011871128', 'FR0011871110'].includes(isin);
  if (common) {
    const values = getInstrumentReturnValues(isin);
    return [2025, 2024, 2023, 2022, 2021].map(year => [year, values[year - 2020]]);
  }
  const earlier = FACTSHEET_EARLIER_RETURNS_BY_ISIN[isin];
  if (!earlier) throw new Error(`Fiche de composition absente pour ${isin}`);
  const values = getInstrumentComparatorReturns(isin);
  return [[2025, values.y2025], [2024, values.y2024], [2023, values.y2023], ...earlier];
}
