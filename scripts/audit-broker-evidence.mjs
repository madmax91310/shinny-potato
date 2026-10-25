import { ALLOWED_MEDIA_HOSTS } from '../src/data/allowed-media.js'
import { PARTIAL_PUBLICATION_SCOPE } from '../src/pages/broker-comparator/publicationScope.js'
import { brokerShortCopy } from '../src/pages/broker-comparator/shortCopy.js'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BROKERS, buildTweet } from '../src/pages/broker-comparator/data.js'
import { BROKER_EVIDENCE, EVIDENCE_FIELDS, OFFICIAL_SOURCES, SECONDARY_SOURCES } from '../src/pages/broker-comparator/evidence.js'
import { BROKER_LOGOS } from '../src/pages/broker-comparator/versus-image.js'
import { brokerPublicationCopy, brokerWeakPoint } from '../src/pages/broker-comparator/publicationCopy.js'
import { BROKER_EDITORIAL } from '../src/pages/broker-comparator/editorial.js'

// La reformulation conserve tous les nombres et laisse passer les prochaines
// publications, même si le collecteur change de vocabulaire ou de disponibilité.
const numbers = text => text.match(/\d+(?:[ .,]\d+)*\s*(?:%|€|USD)?/g) ?? [];
for (const copy of Object.values(BROKER_EDITORIAL)) {
  for (const value of Object.values(copy)) {
    for (const text of typeof value === 'string' ? [value] : Array.isArray(value) ? value : []) {
      assert.deepEqual(numbers(brokerPublicationCopy(text)), numbers(text));
    }
  }
}
assert.equal(brokerPublicationCopy('Nouveau tarif : 0,17 %. Service suspendu depuis le 12/10/2026.'), 'Nouveau tarif : 0,17 %. Service suspendu depuis le 12/10/2026.');
assert.equal(brokerWeakPoint({dca: 'Disponibilité à confirmer.', faible: 'Disponibilité à confirmer.'}), 'Disponibilité à confirmer.');

assert.deepEqual(Object.keys(BROKER_LOGOS).sort(), BROKERS.map((b) => b.id).sort(), 'un logo officiel par courtier')
for (const [id, logo] of Object.entries(BROKER_LOGOS)) {
  const source = new URL(logo.source)
  assert.equal(source.protocol, 'https:', `${id}: source de logo non sécurisée`)
  const svg = readFileSync(new URL(`../public/broker-logos/${logo.file}`, import.meta.url), 'utf8')
  assert(svg.includes('<svg') && !/<script\b|<!DOCTYPE|(?:href|src)=["']https?:/i.test(svg), `${id}: SVG non autonome`)
}

const officialHosts = new Set([
  'bofip.impots.gouv.fr', 'www.service-public.gouv.fr', 'assets.traderepublic.com', 'www.boursorama.com', 'www.boursobank.com', 'www.fortuneo.fr',
  'www.xtb.com', 'xtb.com', 'xas-new-cdn.xtb.com', 'ca-paris.credit-agricole.fr',
  'www.boursedirect.fr', 'www.boursedirect.com', 'epargne.boursedirect.fr', 'groupe.boursedirect.fr', 'www.home.saxo', 'www.help.saxo',
  'www.interactivebrokers.ie', 'www.interactivebrokers.com', 'www.ibkrguides.com', 'www.credit-agricole.fr', 'www.ca-sicavetfcp.fr', 'traderepublic.com', 'support.traderepublic.com',
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
  const namedDownload = url.hostname === 'groupe.boursedirect.fr' && url.pathname.startsWith('/download/')
    && /\.pdf$/i.test(url.searchParams.get('filename') ?? '')
  assert(document.kind === 'page' || /\.pdf(?:$|\?)/i.test(url.pathname + url.search) || namedDownload, `${id}: PDF attendu`)
  assert(document.checked && document.edition, `${id}: édition et contrôle requis`)
}
const secondaryHosts = new Set(ALLOWED_MEDIA_HOSTS)
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
    assert(['corroboré','partiel','non établi'].includes(item.status), `${broker}.${field}: réserve ouverte promue en confirmation`)
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
  else if (cashProof.automatedEvidence?.available == null) assert.equal(broker.cash.resume, 'À vérifier', `${broker.id}: cash de portée inconnue`);
  else assert.equal(broker.cash.resume, 'Non sur PEA · hors PEA sous conditions', `${broker.id}: offre de rémunération non annoncée`)
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
// Every ordered pair uses the requested publication format. The evidence
// assertions above still enforce source scope and keep unknown facts unknown.
const headings = ['💰 FRAIS DE COURTAGE PEA', '🏦 ENVELOPPES', '📄 IFU', '💶 LIQUIDITÉS RÉMUNÉRÉES', '🔄 TRANSFERT DU PEA', '⚠️ POINTS FAIBLES', '🎯 VERDICT'];
const section = (post, heading) => post.split(heading + '\n\n')[1]?.split('\n\n')[0];
for (const a of BROKERS) for (const b of BROKERS) {
  if (a.id === b.id) continue;
  const ids = [a.id, b.id], post = buildTweet(ids);
  assert(post.startsWith(`${a.emoji} ${a.nom} 🆚 ${b.emoji} ${b.nom}`));
  assert(!/undefined|\bNaN\b|à confirmer|non confirm|non établi|analyses consultées|documents publics|sources officielles|pas un conseil|https?:/i.test(post), `${ids}: research leaked into tweet`);
  for (const heading of headings) {
    const lines = section(post, heading)?.split('\n');
    assert.equal(lines?.length, 2, `${ids}: one line per broker for ${heading}`);
    for (const broker of [a,b]) assert(lines.some(line => line.startsWith(`${broker.emoji} ${broker.nom} → `)));
  }
  assert.equal(post.includes('Je suis affilié à XTB'), ids.includes('xtb'));
  for (const broker of [a,b]) {
    for (const [field,label] of [['pme','PEA-PME'],['jeune','PEA Jeune']]) {
      if (broker.pea[field] == null) assert(!section(post,'🏦 ENVELOPPES').split('\n').find(line=>line.includes(broker.nom)).includes(label), `${ids}: unknown envelope converted into a claim`);
    }
    if ((BROKER_EVIDENCE[broker.id].dca.reviewedEvidence ?? BROKER_EVIDENCE[broker.id].dca.automatedEvidence)?.available == null) assert(!section(post,'📈 DCA AUTOMATIQUE')?.includes(`${broker.emoji} ${broker.nom} →`));
  }
  if (ids.includes('saxo')) {
    assert(post.includes('VIP') && post.includes('31/12/2026') && post.includes('ouverts ou transférés éligibles'));
    assert(post.includes('PEPS hors PEA') && post.includes('ventes payantes'));
    assert.match(post, /à partir de 2 € et l’accès au PEA-PME/);
  }
}
assert.equal(buildTweet([]), '');
assert.equal(buildTweet(['tr']), '');
assert(buildTweet(['tr', 'xtb', 'bd']).includes('2 courtiers'));
console.log(`Registre : ${BROKERS.length} courtiers, ${EVIDENCE_FIELDS.length} champs chacun, ${Object.keys(OFFICIAL_SOURCES).length} sources officielles et ${Object.keys(SECONDARY_SOURCES).length} externes.`)

const counts = Object.values(BROKER_EVIDENCE).flatMap(fields => Object.values(fields)).reduce((result, item) => {
  const key = item.status === 'non établi' && /sans objet/i.test(item.summary) ? 'sans objet' : item.status
  result[key] = (result[key] ?? 0) + 1
  return result
}, {})
console.log(`État des ${BROKERS.length * EVIDENCE_FIELDS.length} cellules : ${JSON.stringify(counts)} ; réserves encore ouvertes : ${reservations.filter(([b, f]) => BROKER_EVIDENCE[b][f].review.outcome === 'unresolved').length}.`)

for (const [id, fields] of Object.entries(BROKER_EVIDENCE)) for (const [field, evidence] of Object.entries(fields)) {
  if (evidence.status === 'partiel') assert(PARTIAL_PUBLICATION_SCOPE[id]?.[field]?.excluded, `${id}.${field}: missing publication scope`)
}
const tr = brokerShortCopy('tr'), ibkr = brokerShortCopy('ibkr'), ca = brokerShortCopy('caidf')
assert(!tr.sortant && !/rembours|gratuit|0 €/.test(tr.entrant))
assert(!/\d/.test(tr.change))
assert(ibkr.change.includes('PEA : conversion automatique'))
assert(!/\d/.test(ibkr.change.split('Compte général :')[0]))
assert(ca.change.startsWith('CTO :') && !/\d|PEA/.test(ca.change))
assert.equal(ca.cash, '❌ Sur PEA.')
assert(!/rembours|gratuit|0 €/.test(ca.entrant))
console.log('Six partial fields: publication scopes explicit; unsupported PEA/CTO prices excluded.')
