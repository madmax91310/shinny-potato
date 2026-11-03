import { buildFeeFieldEvidence } from './fee-field-evidence.js';
import { ETF_TER_BY_ISIN } from './etf-ter.js';
import { AUTOMATED_ETF } from './automated-etf.js';
import { EXPOSURE_ADDITIONS } from './exposure-additions.js';
import { INSTRUMENT_REFERENCE_EVIDENCE } from './instrument-reference-evidence.js';
// Les frais sont ceux observés au contrôle ; leur date d’entrée en vigueur n’est pas publiée.
const primaryTerSources = {
  FR001400ZGO4: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR001400ZGO4/FRA/FRA/RETAIL/ETF/20260831',
  FR0007056841: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0007056841/FRA/FRA/RETAIL/ETF/20260831',
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
export const ETF_TER_EVIDENCE = Object.freeze(Object.fromEntries(Object.keys(ETF_TER_BY_ISIN).map(isin => {
  const reference = INSTRUMENT_REFERENCE_EVIDENCE[isin] ?? {};
  const legacyCheckedAt = isin === 'IE00B4JNQZ49' ? '2026-10-02' : ["LU0290358497", "IE00B3FH7618", "IE00BDBRDM35", "IE00B0M62X26", "IE00BMG6Z448", "IE00BZCQB185", "IE00B1FZS467"].includes(isin) ? '2026-10-01' : reference.checkedAt;
  const primarySourceUrl = primaryTerSources[isin];
  return [isin, buildFeeFieldEvidence(AUTOMATED_ETF[isin], reference, {
    primarySourceUrl, legacyCheckedAt,
    method: primarySourceUrl ? 'Frais publiés par l’émetteur pour la part exacte' : 'TER publié sur le profil de la part, consulté par ISIN',
    note: isin === 'LU1681048630'
      ? 'Fiche officielle Amundi au 31/08/2026 : frais de gestion et autres frais administratifs ou d’exploitation 0,25 %. justETF affiche 0,35 % : divergence conservée explicitement, priorité à l’émetteur.'
      : 'Frais observés au contrôle ; aucune date d’entrée en vigueur déduite de la consultation.',
  })];
})));
