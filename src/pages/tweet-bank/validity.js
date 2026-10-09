// Explicit editorial review: an archive month is never treated as a data snapshot.
const reviewedPedagogyIds = new Set(['pedagogy:world-sp500', 'pedagogy:dividendes-cto', 'pedagogy:projet-trois-ans', 'pedagogy:epargne-precaution', 'pedagogy:world-emergents', 'pedagogy:etf-frais', 'pedagogy:ordre-limite-etf', 'pedagogy:etf-change-euro', 'pedagogy:reequilibrer-portefeuille', 'pedagogy:investir-somme-en-plusieurs-fois', 'pedagogy:etf-obligataire-taux', 'pedagogy:world-ex-usa-chiffre', 'pedagogy:world-small-chiffre', 'pedagogy:world-acwi-imi-chiffre', 'pedagogy:world-acwi-chiffre', 'pedagogy:world-europe-chiffre', 'pedagogy:emergents-retirer-chine', 'pedagogy:world-quality-pays', 'pedagogy:oblig-courtes-longues-reel', 'pedagogy:em-dette-dollar-local'])
const generalIds = new Set([2, 20, 28, 34, 39, 44])
const personalIds = new Set([1, 3, 6, 7, 8, 9, 11, 14, 16, 18, 19, 22, 25, 29, 30, 33, 38, 40, 42, 43, 45, 46, 47])
const marketIds = new Set([10, 15, 17, 21, 24, 27, 32, 37])
export function reviewPolicy(tweet) {
  if (generalIds.has(tweet.id)) return { kind: 'general', maxAge: null }
  if (reviewedPedagogyIds.has(tweet.id)) return { kind: 'reviewed', checkedAt: '2026-10-04', maxAge: 180 }
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
  if (!edited && !draft?.checkedAt && policy.kind === 'general') return { ready: true, label: 'Texte général' }
  if (!edited && !draft?.checkedAt && policy.kind === 'reviewed' && age(policy.checkedAt, today) >= 0 && age(policy.checkedAt, today) <= policy.maxAge) return { ready: true, label: `Relu le ${policy.checkedAt}` }
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
  if (!draft?.checkedAt) return text
  const label = reviewPolicy(tweet).kind === 'personal' ? 'Bilan personnel arrêté au' : 'Données de référence au'
  return `${text}\n\n📅 ${label} ${draft.asOf}.`
}
