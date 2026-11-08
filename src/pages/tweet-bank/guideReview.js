import { AUTOMATED_ETF } from '../../data/automated-etf.js'

// Review of every remaining guide on 08/11/2026. Missing evidence is explicit;
// an HTTP 200 alone, an archive month or a matching illustration certifies nothing.
const restrictions = {
  37: 'Archive : bornes du rendement sur un an et univers du classement non documentés.',
  49: 'À vérifier : WisdomTree Cybersecurity et Global X Cloud Computing ; les frais de l’image d’archive ne sont pas tous qualifiés.',
  50: 'À vérifier : frais et parts Xtrackers LU0292096186, Fidelity IE00BYXVGZ48 et WisdomTree IE00BZ56RN96 de l’image d’archive.',
}
const externalSources = {
  49: [
    {label:'Global X · Data Center : part IE00BMH5Y327, frais 0,50 %',url:'https://globalxetfs.eu/funds/vpn',checkedAt:'2026-11-08'},
    {label:'Global X · Lithium : part IE00BLCHJN13, frais 0,60 %',url:'https://globalxetfs.eu/funds/litu',checkedAt:'2026-11-08'},
    {label:'WisdomTree Cybersecurity · document officiel à revérifier',url:'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/IE00BLPK3577/'},
  ],
  50: [{label:'Global X · SuperDividend : part IE00077FRP95, frais 0,45 %, distributions mensuelles variables',url:'https://globalxetfs.eu/funds/sdiv',checkedAt:'2026-11-08'}],
}
export function reviewLegacyGuide(tweet) {
  if (!Object.hasOwn(restrictions, tweet.id)) return tweet
  const sources = [...(tweet.sources ?? []), ...(externalSources[tweet.id] ?? [])]
  for (const isin of new Set(tweet.text.match(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/g) ?? [])) {
    const r = AUTOMATED_ETF[isin], p = r?.characteristicChecks?.terPct
    if (p?.sourceUrl && !sources.some(s => s.url === p.sourceUrl)) sources.push({label:`${isin} · frais de la part`,url:p.sourceUrl,checkedAt:p.checkedAt})
  }
  return {...tweet, sources, liveGuideFees: tweet.id === 50,
    ...(tweet.id === 37 ? {text:'📚 Archive transmise en août 2026. Les dates de début et de fin du rendement sur un an et le périmètre du classement n’étaient pas fournis ; ces chiffres ne constituent pas un classement actuel.\n\n'+tweet.text} : {}),
    reviewRestriction: restrictions[tweet.id],
    ...(tweet.image ? {image:{...tweet.image,note:'Image d’archive : date de référence des frais non fournie. '+restrictions[tweet.id]}} : {}),
    reviewNotes: [restrictions[tweet.id], 'Les contrôles des parts présentes dans les registres communs sont conservés avec leurs dates. Les références manquantes ne sont pas ajoutées artificiellement au catalogue.'],
  }
}
