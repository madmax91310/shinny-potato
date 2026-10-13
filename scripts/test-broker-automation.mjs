import assert from 'node:assert/strict'
import {BROKER_TARIFFS, brokerOffers, brokerFieldCopies, applyBrokerProfile} from '../src/data/broker-tariffs.js'
import {BROKERS} from '../src/pages/broker-comparator/data.js'
import {BROKER_EDITORIAL} from '../src/pages/broker-comparator/editorial.js'
import {BROKER_EVIDENCE, OFFICIAL_SOURCES, transferConditionStatus} from '../src/pages/broker-comparator/evidence.js'
import {DATA_CATALOG} from '../src/data/catalog.js'
for (const [id,o] of Object.entries(BROKER_TARIFFS)) {
 const broker=BROKERS.find(b=>b.id===id), record=DATA_CATALOG.find(r=>r.id===`broker:${id}`)
 const copies=brokerFieldCopies(id)
 for (const [field,value] of Object.entries(o.fields??{})) {
  assert(record.fields.some(f=>JSON.stringify(f).includes(value.sourceUrl)),`${id}:${field} source lost from catalogue`)
  if (['garde','change'].includes(field)) assert(BROKER_EVIDENCE[id][field].summary.startsWith((o.profile?.[field] ?? value).copy.full))
  if (['garde','entrant','sortant'].includes(field)) assert.equal(BROKER_EDITORIAL[id][field],o.profile?.[field]?.copy.full ?? copies[field])
  if (field==='garde') assert.equal(broker.post.garde[0],(o.profile?.garde ?? value).copy.full)
  if (field.startsWith('offer')) assert.equal(OFFICIAL_SOURCES[`${id}Automated${field}`].reviewUntil,value.until)
 }
}
assert.equal(brokerOffers('saxo','2026-02-22').length,1)
assert.equal(brokerOffers('saxo','2026-12-31').length,2)
assert.equal(brokerOffers('saxo','2027-01-01').length,0)
assert.match(brokerFieldCopies('saxo',BROKER_TARIFFS,'2026-12-31').entrant,/150 €.*31 décembre 2026/)
assert.doesNotMatch(brokerFieldCopies('saxo',BROKER_TARIFFS,'2027-01-01').entrant,/remboursés jusqu’à/)
assert.match(brokerFieldCopies('saxo',BROKER_TARIFFS,'2027-01-01').entrant,/expirée/)
assert.equal(brokerFieldCopies('saxo',BROKER_TARIFFS,'2025-01-05').entrant,undefined)
assert.equal(BROKER_EVIDENCE.ibkr.change.status,'partiel')
assert.equal(BROKER_EVIDENCE.tr.garde.status,'partiel')
for (const id of ['tr', 'caidf']) {
 assert.equal(BROKER_EVIDENCE[id].transfert.status, 'partiel', `${id}: transfer fees remain unknown`);
 assert.match(BROKER_EVIDENCE[id].transfert.summary, /confirmer|non qualifiés/);
}
assert.equal(transferConditionStatus({values:{available:1}}), 'partiel');
assert.equal(transferConditionStatus({values:{available:0}}), 'confirmé');
assert.equal(transferConditionStatus({values:{available:1,fee:0}}), 'confirmé');
assert.equal(transferConditionStatus({values:{perLine:15,maximum:150}}), 'confirmé');
assert.match(BROKERS.find(b=>b.id==='tr').garde.detail,/PEA.*confirmer/)
assert.doesNotMatch(BROKER_EDITORIAL.tr.garde,/aucun ✅/)
for(const id of ['xtb','caidf','saxo']) assert(BROKER_EVIDENCE[id].transfert.summary.includes(BROKER_EDITORIAL[id].entrant.split('✅').at(-1).split('❌')[0].trim().slice(0,8)) || BROKER_EVIDENCE[id].transfert.summary.includes('Transfert entrant') || BROKER_EVIDENCE[id].transfert.summary.includes('antériorité'))
const changed=structuredClone(BROKER_TARIFFS)
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
