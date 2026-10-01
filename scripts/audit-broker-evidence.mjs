import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BROKERS, buildTweet } from '../src/pages/broker-comparator/data.js'
import { BROKER_EVIDENCE, EVIDENCE_FIELDS, OFFICIAL_SOURCES, SECONDARY_SOURCES } from '../src/pages/broker-comparator/evidence.js'
import { BROKER_LOGOS } from '../src/pages/broker-comparator/versus-image.js'

assert.deepEqual(Object.keys(BROKER_LOGOS).sort(), BROKERS.map((b) => b.id).sort(), 'un logo officiel par courtier')
for (const [id, logo] of Object.entries(BROKER_LOGOS)) {
  const source = new URL(logo.source)
  assert.equal(source.protocol, 'https:', `${id}: source de logo non sécurisée`)
  const svg = readFileSync(new URL(`../public/broker-logos/${logo.file}`, import.meta.url), 'utf8')
  assert(svg.includes('<svg') && !/<script\b|<!DOCTYPE|(?:href|src)=["']https?:/i.test(svg), `${id}: SVG non autonome`)
}

const officialHosts = new Set([
  'assets.traderepublic.com', 'www.boursorama.com', 'www.boursobank.com', 'www.fortuneo.fr',
  'www.xtb.com', 'xtb.com', 'xas-new-cdn.xtb.com', 'ca-paris.credit-agricole.fr',
  'www.boursedirect.fr', 'epargne.boursedirect.fr', 'groupe.boursedirect.fr', 'www.home.saxo', 'www.help.saxo',
  'www.interactivebrokers.ie', 'www.ibkrguides.com', 'www.credit-agricole.fr', 'www.ca-sicavetfcp.fr', 'traderepublic.com', 'support.traderepublic.com',
])
for (const [id, document] of Object.entries(OFFICIAL_SOURCES)) {
  if (document.kind === 'customer-notice') {
    assert(/^broker-evidence\/[a-z0-9-]+\.jpg$/.test(document.url), `${id}: chemin de capture invalide`)
    const capture = readFileSync(new URL(`../public/${document.url}`, import.meta.url))
    assert(capture[0] === 0xff && capture[1] === 0xd8, `${id}: capture JPEG absente ou invalide`)
    assert(document.checked && document.edition, `${id}: date de réception et édition requises`)
    continue
  }
  const url = new URL(document.url)
  assert(officialHosts.has(url.hostname), `${id}: hébergeur non officiel`)
  assert(document.kind === 'page' || /\.pdf(?:$|\?)/i.test(url.pathname + url.search) || id === 'bdPlans', `${id}: PDF attendu`)
  assert(document.checked && document.edition, `${id}: édition et contrôle requis`)
}
const secondaryHosts = new Set(['www.moneyvox.fr', 'www.cafedelabourse.com', 'brokerchooser.com', 'www.lemonde.fr', 'starfinance.fr', 'www.epargnant30.fr', 'moneyradar.org', 'finance-heros.fr', 'forum.finance-heros.fr', 'trading.prorealtime.com', 'www.prorealtime.com', 'pea.fr', 'sinvestir.fr', 'placements-boursiers.fr', 'www.detective-banque.fr', 'www.placeaurendement.com', 'investimieux.com'])
for (const [id, document] of Object.entries(SECONDARY_SOURCES)) {
  assert(secondaryHosts.has(new URL(document.url).hostname), `${id}: source externe non autorisée`)
  assert(['secondary-page', 'secondary-pdf'].includes(document.kind), `${id}: type externe absent`)
  assert(document.checked && document.edition, `${id}: édition et contrôle requis`)
}
// Réserves de la PR #155 : une recherche terminée ou un document muet ne les clôt pas.
// Toute résolution doit identifier une preuve officielle explicite de portée complète.
const reservations = [
  ['tr', 'pme'], ['bourso', 'cash'], ['ibkr', 'dca'], ['ibkr', 'pme'], ['ibkr', 'jeune'],
  ['fortuneo', 'dca'], ['fortuneo', 'cash'], ['caidf', 'cash'], ['bd', 'cash'],
]
for (const [broker, field] of reservations) {
  const item = BROKER_EVIDENCE[broker][field]
  const review = item.review
  assert(review?.checked && review.gap && review.documents?.length, `${broker}.${field}: revue de la réserve absente`)
  for (const document of review.documents) assert(OFFICIAL_SOURCES[document], `${broker}.${field}: document relu inconnu`)
  assert(['unresolved', 'resolved'].includes(review.outcome), `${broker}.${field}: conclusion de revue invalide`)
  if (review.outcome === 'unresolved') {
    assert.equal(item.status, 'corroboré', `${broker}.${field}: réserve ouverte promue en confirmation`)
  } else {
    assert.equal(item.status, 'confirmé', `${broker}.${field}: résolution sans confirmation`)
    assert(review.explicitStatement && review.scope && review.decisiveRefs?.length, `${broker}.${field}: preuve explicite de portée complète requise`)
    for (const ref of review.decisiveRefs) {
      assert(OFFICIAL_SOURCES[ref.document], `${broker}.${field}: résolution sans preuve officielle`)
      assert(item.refs.some(itemRef => itemRef.document === ref.document && itemRef.page === ref.page), `${broker}.${field}: preuve décisive absente des références`)
    }
  }
}
assert.equal(Object.keys(BROKER_EVIDENCE).length, BROKERS.length)
for (const broker of BROKERS) {
  const evidence = BROKER_EVIDENCE[broker.id]
  assert(evidence, `${broker.id}: registre absent`)
  assert.deepEqual(Object.keys(evidence).sort(), EVIDENCE_FIELDS.map(([field]) => field).sort())
  assert(!('liquidites' in broker) && !('liquidites' in broker.post), `${broker.id}: ancienne ligne cash`)
  assert(broker.cash.resume && broker.cash.detail && broker.cash.post, `${broker.id}: liquidités incomplètes`)
  const cashProof = evidence.cash
  if (cashProof.status === 'non établi') assert.equal(broker.cash.resume, 'À vérifier', `${broker.id}: cash présenté comme prouvé`)
  else if (cashProof.status === 'corroboré') assert.equal(broker.cash.resume, 'Non*', `${broker.id}: source secondaire non signalée`)
  else assert.equal(broker.cash.resume, 'Oui', `${broker.id}: offre de rémunération non annoncée`)
  for (const [field, item] of Object.entries(evidence)) {
    assert(item.summary && ['confirmé', 'corroboré', 'partiel', 'non établi'].includes(item.status), `${broker.id}.${field}: état invalide`)
    if (item.status !== 'non établi') assert(item.refs?.length, `${broker.id}.${field}: référence absente`)
    for (const ref of item.refs ?? []) {
      const source = OFFICIAL_SOURCES[ref.document] ?? SECONDARY_SOURCES[ref.document]
      assert(source && (source.kind?.endsWith('page') || source.kind === 'customer-notice' ? ref.page === undefined : Number.isInteger(ref.page) && ref.page > 0), `${broker.id}.${field}: référence invalide`)
      assert(!source.availability, `${broker.id}.${field}: source indisponible`)
    }
    if (item.status === 'confirmé') assert(item.refs.every(({ document }) => document in OFFICIAL_SOURCES), `${broker.id}.${field}: confirmation sans source officielle`)
    if (item.status === 'corroboré') assert(item.refs.some(({ document }) => document in SECONDARY_SOURCES), `${broker.id}.${field}: corroboration sans source externe`)
    for (const id of item.checked ?? []) assert(OFFICIAL_SOURCES[id], `${broker.id}.${field}: document inconnu`)
  }
  for (const field of ['frais', 'dca', 'garde', 'ifu']) {
    if (evidence[field].status === 'non établi')
      assert(/vérifier/i.test(broker[field].resume), `${broker.id}.${field}: donnée non établie présentée comme confirmée`)
    if (evidence[field].status === 'corroboré')
      assert(/\*/.test(broker[field].resume), `${broker.id}.${field}: source externe non signalée`)
  }
  if (evidence.boursomarkets.status === 'non établi')
    assert.equal(broker.boursomarkets.resume, 'Sans objet', `${broker.id}: offre BoursoMarkets attribuée sans preuve`)
  for (const [field, key] of [['pea', 'pea'], ['pme', 'pme'], ['jeune', 'jeune']]) {
    if (evidence[field].status === 'non établi')
      assert.equal(broker.pea[key], null, `${broker.id}.${field}: réponse oui/non sans preuve`)
  }
  if (evidence.pme.status === 'corroboré') assert.equal(broker.pea.pme, false, `${broker.id}: PEA-PME selon source externe`)
}
for (let i = 0; i < BROKERS.length; i++) {
  for (let j = i + 1; j < BROKERS.length; j++) {
    const ids = [BROKERS[i].id, BROKERS[j].id]
    const post = buildTweet(ids)
    assert(!/undefined|\bNaN\b|PEA-PME \?|PEA Jeune \?|à vérifier|non vérifié|non établie|aucune offre spécifique|preuve corroborée|détails dans le registre|conversion|💱/i.test(post), `${ids}: lacune dans le post`)
    for (const label of ['💰 Frais de courtage PEA', '📅 Achats automatiques sur PEA', '🗂️ Frais de garde', '🌱 Enveloppes proposées', '🧾 IFU fourni', '💵 Liquidités rémunérées', '🔄 Transfert du PEA', '⚠️ Le point faible à retenir']) {
      assert(post.includes(label), `${ids}: critère ${label} absent du duel`)
    }
    for (const broker of [BROKERS[i], BROKERS[j]]) {
      if (BROKER_EVIDENCE[broker.id].cash.status === 'corroboré')
        assert(post.includes(`${broker.nom} : ${broker.cash.post}`), `${ids}: cash externe présenté sans réserve`)
      if (BROKER_EVIDENCE[broker.id].dca.status === 'corroboré')
        assert(post.includes('📅 Achats automatiques sur PEA') && /analyses|divergent/i.test(broker.post.dca.join(' ')), `${ids}: DCA externe présenté sans réserve`)
    }
    const hasOffers = ids.some(id => ['bourso', 'fortuneo', 'bd', 'saxo'].includes(id))
    assert.equal(post.includes('🎁 Les offres'), hasOffers, `${ids}: bloc offres vide ou absent`)
    for (const label of ['💰 Frais de courtage PEA', '📅 Achats automatiques sur PEA', '🗂️ Frais de garde', '🧾 IFU fourni', '💵 Liquidités rémunérées', '🔄 Transfert du PEA', '⚠️ Le point faible à retenir']) {
      const section = post.split(label + '\n\n')[1]?.split(/\n\n(?=🌱|🎁|📅|🗂️|🧾|💵|🔄|⚠️|💬|🤝)/u)[0]
      for (const broker of [BROKERS[i], BROKERS[j]]) {
        assert(section?.includes(`${broker.nom} : `), `${ids}: ${label} sans réponse pour ${broker.nom}`)
        const answer = section.split(`${broker.nom} : `)[1]?.split('\n')[0]
        assert(answer && answer.trim().length > 0 && !/^(?:[-—?]|N\/A)$/.test(answer.trim()), `${ids}: réponse vide ${label} ${broker.nom}`)
      }
    }
    for (const id of ids) {
      assert.equal(BROKER_EVIDENCE[id].transfert.status, 'confirmé', `${id}: transfert non documenté`)
      assert.equal(BROKER_EVIDENCE[id].ifu.status, 'confirmé', `${id}: IFU non documenté`)
      assert(post.includes(BROKER_EVIDENCE[id].transfert.summary), `${id}: transfert non raccordé au registre`)
    }
    assert.equal(post.includes('je suis affilié à XTB'), ids.includes('xtb'), `${ids}: transparence affiliation`)
  }
}
console.log(`Registre : ${BROKERS.length} courtiers, ${EVIDENCE_FIELDS.length} champs chacun, ${Object.keys(OFFICIAL_SOURCES).length} sources officielles et ${Object.keys(SECONDARY_SOURCES).length} externes.`)

const counts = Object.values(BROKER_EVIDENCE).flatMap(fields => Object.values(fields)).reduce((result, item) => {
  const key = item.status === 'non établi' && /sans objet/i.test(item.summary) ? 'sans objet' : item.status
  result[key] = (result[key] ?? 0) + 1
  return result
}, {})
console.log(`État des 80 cellules : ${JSON.stringify(counts)} ; réserves encore ouvertes : ${reservations.filter(([b, f]) => BROKER_EVIDENCE[b][f].review.outcome === 'unresolved').length}.`)
