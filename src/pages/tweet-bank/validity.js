import { MARKET_STORIES } from './market-stories.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
// Explicit editorial review: an archive month is never treated as a data snapshot.
// Product guides also carry the registry's own control dates: the oldest control among the
// shares cited in the text bounds the validity, never the hand-written review date alone (18/10/2026).
const ISIN_PATTERN = /\b[A-Z]{2}[A-Z0-9]{9}\d\b/g
export function evidenceCheckedAt(text, records = AUTOMATED_ETF) {
  const dates = [...new Set(String(text ?? '').match(ISIN_PATTERN) ?? [])].flatMap(isin => {
    const record = records[isin]
    const latest = record ? [record.characteristicChecks?.terPct?.checkedAt ?? record.characteristics?.checkedAt].filter(Boolean).map(value => value.slice(0, 10)).sort()[0] : null
    return latest ? [latest] : []
  })
  return dates.length ? dates.sort()[0] : null
}
function reviewed(tweet, reviewedAt, maxAge = 30) {
  const evidence = evidenceCheckedAt(tweet.text)
  return { kind: 'reviewed', reviewedAt, checkedAt: evidence && evidence < reviewedAt ? evidence : (evidence ?? reviewedAt), evidence, maxAge }
}
const reviewedPedagogyIds = new Set(['pedagogy:world-sp500', 'pedagogy:dividendes-cto', 'pedagogy:projet-trois-ans', 'pedagogy:epargne-precaution', 'pedagogy:world-emergents', 'pedagogy:etf-frais', 'pedagogy:ordre-limite-etf', 'pedagogy:etf-change-euro', 'pedagogy:reequilibrer-portefeuille', 'pedagogy:investir-somme-en-plusieurs-fois', 'pedagogy:etf-obligataire-taux', 'pedagogy:world-ex-usa-chiffre', 'pedagogy:world-small-chiffre', 'pedagogy:world-acwi-imi-chiffre', 'pedagogy:world-acwi-chiffre', 'pedagogy:world-europe-chiffre', 'pedagogy:emergents-retirer-chine', 'pedagogy:world-quality-pays', 'pedagogy:oblig-courtes-longues-reel', 'pedagogy:em-dette-dollar-local'])
const generalIds = new Set([2, 20, 28, 34, 39, 44])
const personalIds = new Set(['story:profil-monsieur-tout-le-monde', 'story:bitcoin-3500-reflexions-proches', 'bilan:dca-septembre-530', 'story:pea-investir-pas-casino', 'bilan:pea-presque-10000-octobre-2026', 1, 3, 6, 7, 8, 9, 11, 14, 16, 18, 19, 22, 25, 29, 30, 33, 38, 40, 42, 43, 45, 46, 47])
const marketIds = new Set([10, 15, 17, 21, 24, 27, 32, 37])
export function reviewPolicy(tweet) {
  // Liste explicite de textes historiques relus : la catégorie seule ne certifie rien.
  const story = MARKET_STORIES.find(item => item.id === tweet.id && item.text === tweet.text)
  if (story) return { kind: 'historical', checkedAt: story.reviewedAt, maxAge: null }
  // Frais et fiscalité contrôlés le 18/10/2026 ; sources conservées dans l’entrée.
  if (tweet.id === 'simulation:world-pea-cto-30-ans') return { kind: 'reviewed', checkedAt: '2026-10-18', maxAge: 30 }
  // Récit validé par l’auteur, sans données chiffrées ou caractéristiques de produits à actualiser.
  if (tweet.id === 'story:parler-investissement-proches') return { kind: 'general', maxAge: null }
  // Guide ETF actifs : ISIN, frais et stratégies vérifiés le 13/10/2026 ; sources dans l’entrée.
  if (tweet.id === 'guide:active-etfs') return reviewed(tweet, '2026-10-13')
  // ISIN, frais, PEA et levier quotidien revus auprès des émetteurs le 13/10/2026.
  // Références officielles dans tweet.sources ; exemple arithmétique hors coûts.
  if (tweet.id === 'guide:leveraged-etfs') return reviewed(tweet, '2026-10-13')
  // Guide matières premières : ISIN, TER, gestion, taux de swap et expositions
  // vérifiés auprès des émetteurs le 12/10/2026. Sources hors du texte copié :
  // https://www.invesco.com/uk/en/financial-products/etfs/invesco-bloomberg-commodity-ucits-etf.html
  // https://www.ishares.com/uk/professionals/en/products/287254/ishares-diversified-commodity-swap-ucits-etf
  // https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/IE00BYMLZY74/
  // https://www.ishares.com/uk/individual/en/products/258441/ishares-physical-gold-etc-fund
  // https://www.ishares.com/gls-download/literature/fact-sheet/ssln-ishares-physical-silver-etc-fund-fact-sheet-en-gb.pdf
  // https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/CSL/EU/EN-GB/GB00B15KXQ89/
  // https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/CSL/EU/EN-GB/GB00B15KXV33/
  // https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/CSL/EU/EN-GB/GB00B15KYH63/
  if (tweet.id === 'guide:commodities') return reviewed(tweet, '2026-10-12')
  // Guides covered call et multi-actifs : ISIN, frais, distributions et allocations
  // vérifiés le 12/10/2026 auprès des émetteurs. Sources hors du texte copié :
  // https://globalxetfs.eu/funds/qyld/
  // https://globalxetfs.eu/funds/xylu/
  // https://globalxetfs.eu/funds/syld/
  // https://am.jpmorgan.com/fr/en/asset-management/institutional/insights/portfolio-insights/etf-perspectives/equity-premiumincome-active-etfs/
  // https://am.jpmorgan.com/de/en/asset-management/institutional/products/jpm-global-equity-premium-income-active-ucits-etf-usd-dist-ie0003uvyc20
  // https://am.jpmorgan.com/nl/en/asset-management/institutional/products/jpm-us-equity-premium-income-active-ucits-etf-usd-dist-ie000u5mjoz6
  // https://am.jpmorgan.com/be/en/asset-management/adv/products/jpm-nasdaq-equity-premium-income-active-ucits-etf-usd-dist-ie000u9j8hx9
  // https://www.fr.vanguard/professionnel/produits/etf/lifestrategy/9490/lifestrategy-20-equity-ucits-etf-eur-accumulating
  // https://www.fr.vanguard/professionnel/produits/etf/lifestrategy/9492/lifestrategy-40-equity-ucits-etf-eur-accumulating
  // https://www.fr.vanguard/professionnel/produits/etf/lifestrategy/9494/lifestrategy-60-equity-ucits-etf-eur-accumulating
  // https://www.fr.vanguard/professionnel/produits/etf/lifestrategy/9496/lifestrategy-80-equity-ucits-etf-eur-accumulating
  // https://www.vaneck.com/nl/en/multi-asset-etf/
  if (['guide:covered-call', 'guide:multi-asset'].includes(tweet.id)) return reviewed(tweet, '2026-10-12')
  // Revue du texte et des quatre produits auprès des émetteurs le 12/10/2026.
  // https://www.ishares.com/uk/individual/en/products/258441/ishares-physical-gold-etc-fund
  // https://www.invesco.com/uk/en/financial-products/etfs/invesco-physical-gold-etc.html
  // https://www.vaneck.com/fr/fr/investissements/gold-miners-etf/
  // https://www.ishares.com/uk/individual/en/products/251908/ishares-gold-producers-ucits-etf
  // https://www.gold.org/goldhub/how-to-invest
  if (tweet.id === 'guide:gold-ways') return reviewed(tweet, '2026-10-12')
  if (generalIds.has(tweet.id)) return { kind: 'general', maxAge: null }
  if (reviewedPedagogyIds.has(tweet.id)) return reviewed(tweet, '2026-10-04', 180)
  if (personalIds.has(tweet.id)) return { kind: 'personal', maxAge: 0 }
  if (marketIds.has(tweet.id)) return { kind: 'market', maxAge: 0 }
  return { kind: 'verification', maxAge: 30 }
}
export const bankToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const age = (date, today) => (Date.parse(today) - Date.parse(date)) / 86400000
export function contentValidity(tweet, draft, today = bankToday()) {
  const policy = reviewPolicy(tweet)
  const edited = draft?.text !== undefined && draft.text !== tweet.text
  if (draft?.text !== undefined && !draft.text.trim()) return { ready: false, label: 'Texte vide' }
  if (!edited && !draft?.checkedAt && policy.kind === 'historical' && policy.checkedAt <= today) return { ready: true, label: `Récit historique relu le ${policy.checkedAt} · pilote, ton à valider` }
  if (!edited && !draft?.checkedAt && policy.kind === 'general') return { ready: true, label: 'Texte général' }
  if (!edited && !draft?.checkedAt && policy.kind === 'reviewed' && age(policy.checkedAt, today) >= 0 && age(policy.checkedAt, today) <= policy.maxAge) return { ready: true, label: policy.evidence ? `Relu le ${policy.reviewedAt} · données contrôlées le ${policy.evidence}` : `Relu le ${policy.checkedAt}` }
  if (['personal', 'market'].includes(policy.kind) && !edited) return { ready: false, label: 'Actualise le texte avant vérification' }
  const checked = draft?.checkedAt
  const asOf = draft?.asOf
  // A checkbox saved on an old draft cannot certify a newly edited text.
  const verified = draft?.verifiedText === draft?.text && draft?.verifiedAsOf === asOf
  if (!validDate(asOf) || asOf > today || !validDate(checked) || checked > today || !verified || age(checked, today) > (policy.maxAge ?? 180)) {
    return { ready: false, label: policy.kind === 'personal' ? 'Bilan personnel à actualiser' : 'À vérifier avant réutilisation' }
  }
  return { ready: true, label: `Vérifié le ${checked} · référence ${asOf}` }
}
export function renderBankCopy(tweet, draft, today = bankToday()) {
  if (!contentValidity(tweet, draft, today).ready) throw new Error('Ce texte doit être vérifié avant copie.')
  const text = draft?.text ?? tweet.text
  if (!draft?.checkedAt || reviewPolicy(tweet).kind === 'historical') return text
  const label = reviewPolicy(tweet).kind === 'personal' ? 'Bilan personnel arrêté au' : 'Données de référence au'
  return `${text}\n\n📅 ${label} ${draft.asOf}.`
}
