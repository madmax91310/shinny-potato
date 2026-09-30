import assert from 'node:assert/strict'
import { BROKERS, buildTweet, documentedForAll } from '../src/pages/broker-comparator/data.js'
import { BROKER_EVIDENCE, EVIDENCE_FIELDS, OFFICIAL_SOURCES, SECONDARY_SOURCES } from '../src/pages/broker-comparator/evidence.js'

const officialHosts = new Set([
  'assets.traderepublic.com', 'www.boursobank.com', 'www.fortuneo.fr',
  'www.xtb.com', 'xtb.com', 'xas-new-cdn.xtb.com', 'ca-paris.credit-agricole.fr',
  'www.boursedirect.fr', 'epargne.boursedirect.fr', 'groupe.boursedirect.fr', 'www.home.saxo', 'www.help.saxo',
  'www.interactivebrokers.ie', 'www.credit-agricole.fr', 'traderepublic.com', 'support.traderepublic.com',
])
for (const [id, document] of Object.entries(OFFICIAL_SOURCES)) {
  const url = new URL(document.url)
  assert(officialHosts.has(url.hostname), `${id}: hébergeur non officiel`)
  assert(document.kind === 'page' || /\.pdf(?:$|\?)/i.test(url.pathname + url.search) || id === 'bdPlans', `${id}: PDF attendu`)
  assert(document.checked && document.edition, `${id}: édition et contrôle requis`)
}
const secondaryHosts = new Set(['www.moneyvox.fr', 'www.cafedelabourse.com', 'brokerchooser.com', 'www.lemonde.fr', 'starfinance.fr', 'www.epargnant30.fr', 'moneyradar.org', 'finance-heros.fr', 'forum.finance-heros.fr', 'trading.prorealtime.com', 'pea.fr', 'sinvestir.fr', 'placements-boursiers.fr', 'www.detective-banque.fr'])
for (const [id, document] of Object.entries(SECONDARY_SOURCES)) {
  assert(secondaryHosts.has(new URL(document.url).hostname), `${id}: source externe non autorisée`)
  assert(['secondary-page', 'secondary-pdf'].includes(document.kind), `${id}: type externe absent`)
  assert(document.checked && document.edition, `${id}: édition et contrôle requis`)
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
      assert(source && (source.kind?.endsWith('page') ? ref.page === undefined : Number.isInteger(ref.page) && ref.page > 0), `${broker.id}.${field}: référence invalide`)
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
    assert(!/à vérifier|à confirmer|non établi|non renseigné|PEA-PME \?|PEA Jeune \?/i.test(post), `${ids}: lacune dans le post`)
    for (const [field, label] of [['frais', '💰 Quand tu passes un ordre'], ['dca', '📅 Si tu investis automatiquement'], ['garde', '🛡️ Les frais de garde'], ['cash', '💵 Liquidités rémunérées'], ['transfert', '🔄 Si tu transfères ton PEA']]) {
      assert.equal(post.includes(label), documentedForAll(ids, field), `${ids}: critère ${field} publié sans preuve complète`)
    }
  }
}
console.log(`Registre : ${BROKERS.length} courtiers, ${EVIDENCE_FIELDS.length} champs chacun, ${Object.keys(OFFICIAL_SOURCES).length} sources officielles et ${Object.keys(SECONDARY_SOURCES).length} externes.`)
