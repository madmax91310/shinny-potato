import assert from 'node:assert/strict'
import { BROKERS } from '../src/pages/broker-comparator/data.js'
import { BROKER_EVIDENCE, EVIDENCE_FIELDS, PDF_DOCUMENTS } from '../src/pages/broker-comparator/evidence.js'

const officialHosts = new Set([
  'assets.traderepublic.com', 'www.boursobank.com', 'www.fortuneo.fr',
  'www.xtb.com', 'xtb.com', 'xas-new-cdn.xtb.com', 'ca-paris.credit-agricole.fr',
  'www.boursedirect.fr', 'groupe.boursedirect.fr', 'www.home.saxo',
])
for (const [id, document] of Object.entries(PDF_DOCUMENTS)) {
  const url = new URL(document.url)
  assert(officialHosts.has(url.hostname), `${id}: hébergeur non officiel`)
  assert(/\.pdf(?:$|\?)/i.test(url.pathname + url.search) || id === 'bdPlans', `${id}: PDF attendu`)
  assert(document.checked && document.edition, `${id}: édition et contrôle requis`)
}
assert.equal(Object.keys(BROKER_EVIDENCE).length, BROKERS.length)
for (const broker of BROKERS) {
  const evidence = BROKER_EVIDENCE[broker.id]
  assert(evidence, `${broker.id}: registre absent`)
  assert.deepEqual(Object.keys(evidence).sort(), EVIDENCE_FIELDS.map(([field]) => field).sort())
  assert(!('liquidites' in broker) && !('liquidites' in broker.post), `${broker.id}: ancienne ligne cash`)
  for (const kind of ['cto', 'pea']) {
    const cash = broker.cash[kind]
    const proof = evidence[kind === 'cto' ? 'cashCto' : 'cashPea']
    assert(cash.resume && cash.detail && cash.post, `${broker.id}: espèces ${kind} incomplètes`)
    assert(cash.rate === null && cash.cap === null, `${broker.id}: taux/plafond sans PDF chiffré`)
    if (proof.status === 'non établi') assert(/vérifier/i.test(cash.resume), `${broker.id}: cash ${kind} présenté comme prouvé`)
  }
  for (const [field, item] of Object.entries(evidence)) {
    assert(item.summary && ['confirmé', 'partiel', 'non établi'].includes(item.status), `${broker.id}.${field}: état invalide`)
    if (item.status !== 'non établi') assert(item.refs?.length, `${broker.id}.${field}: référence absente`)
    for (const ref of item.refs ?? []) {
      assert(PDF_DOCUMENTS[ref.document] && Number.isInteger(ref.page) && ref.page > 0, `${broker.id}.${field}: page PDF invalide`)
      assert(!PDF_DOCUMENTS[ref.document].availability, `${broker.id}.${field}: PDF indisponible`)
    }
    for (const id of item.checked ?? []) assert(PDF_DOCUMENTS[id], `${broker.id}.${field}: document inconnu`)
  }
}
console.log(`Registre PDF : ${BROKERS.length} courtiers, ${EVIDENCE_FIELDS.length} champs chacun, ${Object.keys(PDF_DOCUMENTS).length} documents référencés.`)
