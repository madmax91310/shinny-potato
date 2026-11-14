import assert from 'node:assert/strict'
import reviewedProfiles from '../src/data/reviewed-broker-profiles.json' with { type: 'json' }
import {PARTIAL_PUBLICATION_SCOPE} from '../src/pages/broker-comparator/publicationScope.js'
import {brokerShortCopy as scopedBrokerCopy} from '../src/pages/broker-comparator/shortCopy.js'
import {BROKER_TARIFFS, brokerOffers, brokerFieldCopies, brokerProfile, applyBrokerProfile} from '../src/data/broker-tariffs.js'
import {BROKERS} from '../src/pages/broker-comparator/data.js'
import {BROKER_EDITORIAL} from '../src/pages/broker-comparator/editorial.js'
import {BROKER_EVIDENCE, OFFICIAL_SOURCES, transferConditionStatus} from '../src/pages/broker-comparator/evidence.js'
import {DATA_CATALOG} from '../src/data/catalog.js'
for (const [id,o] of Object.entries(BROKER_TARIFFS)) {
 const broker=BROKERS.find(b=>b.id===id), record=DATA_CATALOG.find(r=>r.id===`broker:${id}`)
 const copies=brokerFieldCopies(id)
 for (const [field,value] of Object.entries(o.fields??{})) {
  assert(record.fields.some(f=>JSON.stringify(f).includes(value.sourceUrl)),`${id}:${field} source lost from catalogue`)
  if (['garde','change'].includes(field)) assert(BROKER_EVIDENCE[id][field].summary.startsWith((brokerProfile(id)?.[field] ?? value).copy.full))
  if (['garde','entrant','sortant'].includes(field)) assert.equal(BROKER_EDITORIAL[id][field],brokerProfile(id)?.[field]?.copy.full ?? copies[field])
  if (field==='garde') assert.equal(broker.post.garde[0],(brokerProfile(id)?.garde ?? value).copy.full)
  if (field.startsWith('offer')) assert.equal(OFFICIAL_SOURCES[`${id}Automated${field}`].reviewUntil,value.until)
 }
}
// Exercise expiry independently of campaigns which the supplier may renew.
const datedOffers=structuredClone(BROKER_TARIFFS)
Object.assign(datedOffers.saxo.fields.offerPea,{start:'2026-02-23',until:'2026-12-31'})
Object.assign(datedOffers.saxo.fields.offerAmundi,{start:null,until:'2026-12-31'})
Object.assign(datedOffers.saxo.fields.entrant,{start:'2025-01-06',until:'2026-12-31',copy:{full:'Test : remboursement jusqu’à 150 € jusqu’au 31 décembre 2026.'},after:'Test : offre expirée.'})
assert.equal(brokerOffers('saxo','2026-02-22',datedOffers).length,1)
assert.equal(brokerOffers('saxo','2026-12-31',datedOffers).length,2)
assert.equal(brokerOffers('saxo','2027-01-01',datedOffers).length,0)
assert.match(brokerFieldCopies('saxo',datedOffers,'2026-12-31').entrant,/150 €.*31 décembre 2026/)
assert.doesNotMatch(brokerFieldCopies('saxo',datedOffers,'2027-01-01').entrant,/remboursés jusqu’à/)
assert.match(brokerFieldCopies('saxo',datedOffers,'2027-01-01').entrant,/expirée/)
assert.equal(brokerFieldCopies('saxo',datedOffers,'2025-01-05').entrant,undefined)
// Live records still drive every offer and its exact current inclusive bounds.
for(const[field,o]of Object.entries(BROKER_TARIFFS.saxo.fields)){
 if(!field.startsWith('offer'))continue
 assert(brokerOffers('saxo',o.until).includes(o.copy.full))
 const after=new Date(o.until+'T00:00:00Z');after.setUTCDate(after.getUTCDate()+1)
 assert(!brokerOffers('saxo',after.toISOString().slice(0,10)).includes(o.copy.full))
}
assert.equal(BROKER_EVIDENCE.ibkr.change.status,'partiel')
// The live adapter must follow expiry in Europe/Paris, not a permanent status
// from a dated external review. Exercise both inclusive bounds independently.
assert.equal(BROKER_EVIDENCE.tr.garde.status,brokerProfile('tr').garde.status)
const custodyReview=reviewedProfiles.claims.tr.garde
const unknownCustody=structuredClone(BROKER_TARIFFS)
unknownCustody.tr.profile.garde={...unknownCustody.tr.profile.garde,available:null,status:'partiel'}
for(const day of [custodyReview.checkedAt,custodyReview.reviewUntil]) {
 const current=brokerProfile('tr',unknownCustody,day).garde
 assert.equal(current.status,custodyReview.status)
 assert.equal(current.reviewed,true)
}
const afterCustodyReview=new Date(custodyReview.reviewUntil+'T00:00:00Z')
afterCustodyReview.setUTCDate(afterCustodyReview.getUTCDate()+1)
const expiredCustody=brokerProfile('tr',unknownCustody,afterCustodyReview.toISOString().slice(0,10)).garde
assert.equal(expiredCustody.status,'partiel')
assert.equal(expiredCustody.available,null)
assert.equal(expiredCustody.reviewed,undefined)
// Partial publication policies preserve known PEA terms and exclude unknown CTO
// terms; they never upgrade an expired review or turn an unknown fee into zero.
assert.match(PARTIAL_PUBLICATION_SCOPE.tr.garde.published,/Aucune réponse publiée/)
assert.match(PARTIAL_PUBLICATION_SCOPE.tr.garde.excluded,/gratuité du CTO non transposable/)
for(const id of ['bourso','fortuneo','bd']) {
 assert.equal(PARTIAL_PUBLICATION_SCOPE[id].cash.published,'Espèces du PEA non rémunérées.')
 assert.match(PARTIAL_PUBLICATION_SCOPE[id].cash.excluded,/Présence ou absence.*CTO/)
 assert.equal(scopedBrokerCopy(id,BROKER_TARIFFS,'2099-01-01').cash,'❌ Sur PEA.')
}
assert.equal(PARTIAL_PUBLICATION_SCOPE.tr.change.excluded,'Taux ou commission propres au PEA.')
const confirmedCustody=structuredClone(unknownCustody)
Object.assign(confirmedCustody.tr.profile.garde,{available:true,status:'confirmé'})
assert.equal(brokerProfile('tr',confirmedCustody,'2099-01-01').garde.status,'confirmé')
for (const id of ['tr', 'caidf']) {
 assert.equal(BROKER_EVIDENCE[id].transfert.status, 'partiel', `${id}: transfer fees remain unknown`);
 assert.match(BROKER_EVIDENCE[id].transfert.summary, /confirmer|non qualifiés/);
}
assert.equal(transferConditionStatus({values:{available:1}}), 'partiel');
assert.equal(transferConditionStatus({values:{available:0}}), 'confirmé');
assert.equal(transferConditionStatus({values:{available:1,fee:0}}), 'confirmé');
assert.equal(transferConditionStatus({values:{perLine:15,maximum:150}}), 'confirmé');
assert.equal(BROKERS.find(b=>b.id==='tr').garde.detail,brokerProfile('tr').garde.copy.full)
assert.doesNotMatch(BROKER_EDITORIAL.tr.garde,/aucun ✅/)
for(const id of ['xtb','caidf','saxo']) assert(BROKER_EVIDENCE[id].transfert.summary.includes(BROKER_EDITORIAL[id].entrant.split('✅').at(-1).split('❌')[0].trim().slice(0,8)) || BROKER_EVIDENCE[id].transfert.summary.includes('Transfert entrant') || BROKER_EVIDENCE[id].transfert.summary.includes('antériorité'))
const changed=structuredClone(datedOffers)
changed.saxo.fields.change.copy.full='0,30 %.'
changed.saxo.fields.offerPea.until='2026-10-01'
assert.equal(brokerFieldCopies('saxo',changed,'2026-10-08').change,'0,30 %.')
assert.equal(brokerOffers('saxo','2026-10-08',changed).length,1)
for(const [id,o] of Object.entries(BROKER_TARIFFS)) for(const [field,p] of Object.entries(o.profile ?? {})) {
 assert.equal(BROKER_EVIDENCE[id][field === 'entrant' ? 'transfert' : field].automatedEvidence.checkedAt,p.checkedAt);
 assert(DATA_CATALOG.find(r=>r.id===`broker:${id}`).fields.some(f=>f.value.description===p.copy.full));
}
// Simulate a service change and an unresolved envelope: table and exported data
// must change without editing a broker-specific manual sentence.
changed.tr.profile.dca={...changed.tr.profile.dca,available:false,copy:{full:'Service PEA suspendu par le courtier.'}};
changed.tr.profile.jeune={...changed.tr.profile.jeune,available:null};
const refreshed=applyBrokerProfile(BROKERS.find(b=>b.id==='tr'),changed);
assert.equal(refreshed.dca.resume,'Non actuellement sur PEA');
assert.equal(refreshed.post.dca[0],'Service PEA suspendu par le courtier.');
assert.equal(refreshed.pea.jeune,null);
console.log('Broker automation: all field consumers, separate scopes, source deadlines and expiry OK')

// Live tariff updates and offer expiry must reach the compact publication too.
const { brokerShortCopy } = await import('../src/pages/broker-comparator/shortCopy.js');
const { buildBrokerTweet } = await import('../src/pages/broker-comparator/lib.js');
changed.saxo.values.minimum=3;
changed.saxo.values.rate=0.09;
changed.saxo.profile.dca.programmed.purchaseFee=1;
const short=brokerShortCopy('saxo',changed,'2026-10-08');
assert.match(short.frais,/0,09 %.*minimum 3 €/);
assert.match(short.verdict,/à partir de 3 €/);
assert.match(short.dca,/1 € de courtage à l’achat/);
assert(!short.offres.some(offer=>offer.includes('70 actions')));
const future=buildBrokerTweet(BROKERS.filter(b=>['tr','saxo'].includes(b.id)),changed,'2027-01-01');
assert(!future.includes('70 actions') && !future.includes('ETF Amundi de la sélection'));
assert(!/offre.*expirée|à confirmer/.test(future));

assert(!brokerShortCopy('tr',changed).verdict.includes('achats programmés'));

// External reviews expire and never override an explicit issuer observation.
assert.equal(brokerProfile('tr', BROKER_TARIFFS, '2026-10-13').pme.available, false);
assert.equal(brokerProfile('tr', BROKER_TARIFFS, '2026-11-14').pme.available, null);
const issuerChange = structuredClone(BROKER_TARIFFS);
issuerChange.tr.profile.pme = {...issuerChange.tr.profile.pme,available:true,status:'confirmé'};
assert.equal(brokerProfile('tr', issuerChange, '2026-10-13').pme.available, true);
assert.equal(brokerProfile('tr', issuerChange, '2026-10-13').pme.reviewed, undefined);
for (const id of ['tr','bourso','fortuneo','bd']) for (const [key, review] of Object.entries(brokerProfile(id))) {
 if (!review.reviewed) continue;
 assert.equal(new Set(review.refs.map(r => new URL(r.sourceUrl).hostname)).size, 2);
 assert.equal(BROKER_EVIDENCE[id][key].status, 'corroboré');
 assert(DATA_CATALOG.find(r => r.id === `broker:${id}`).fields.some(f => f.value.description === review.copy.full));
}
