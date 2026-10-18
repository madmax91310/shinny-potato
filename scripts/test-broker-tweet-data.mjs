import assert from 'node:assert/strict';
import { auditBrokerTweetData } from './audit-broker-tweet-data.mjs';
import { BROKER_TARIFFS } from '../src/data/broker-tariffs.js';
import { brokerShortCopy } from '../src/pages/broker-comparator/shortCopy.js';
const report=auditBrokerTweetData(BROKER_TARIFFS,'2026-10-18');
assert.equal(report.summary.cells,88);
assert.equal(report.summary.tweets,28);
assert.deepEqual(report.errors,[]);
// A recent tariff must not hide an old, independently collected service.
const changed=structuredClone(BROKER_TARIFFS);
changed.saxo.checkedAt='2026-10-18';
changed.saxo.profile.dca.checkedAt='2026-10-01';
changed.saxo.fields.offerAmundi.until='2026-10-17';
const aged=auditBrokerTweetData(changed,'2026-10-18',{'saxo:profile:dca':'HTTP 503'});
assert(aged.cells.find(c=>c.broker==='saxo'&&c.field==='dca').stale);
assert.equal(aged.collectionFailures['saxo:profile:dca'],'HTTP 503');
assert(!aged.offers.find(c=>c.broker==='saxo'&&c.field==='offerAmundi').active);
// Missing proof cannot be reported as complete automation.
delete changed.saxo.fields.sortant.sourceUrl;
delete changed.saxo.fields.sortant.checkedAt;
assert(auditBrokerTweetData(changed,'2026-10-18').cells.find(c=>c.broker==='saxo'&&c.field==='transfert').stale);
assert(auditBrokerTweetData(changed,'2026-10-18').errors.some(s=>s.includes('saxo:transfert')));
// PEA cash is officially unremunerated even after CTO manual reviews expire.
for (const id of ['bourso','fortuneo','bd','caidf']) {
  assert.equal(brokerShortCopy(id,BROKER_TARIFFS,'2026-11-14').cash,'❌ Sur PEA.');
}
const offer=changed.fortuneo.fields.offerAmundi;
assert(offer,'Fortuneo campaign is connected');
// Exercise a synthetic campaign independently of the next real renewal.
offer.start='2026-09-01';offer.until='2026-12-31';
assert(brokerShortCopy('fortuneo',changed,'2026-10-18').offres.some(s=>s.startsWith(offer.copy.full)));
assert.equal(brokerShortCopy('fortuneo',changed,'2027-01-01').offres.length,0);
assert.equal(brokerShortCopy('fortuneo',changed,'2026-08-31').offres.length,0);
assert(!brokerShortCopy('fortuneo',changed,'2026-10-18').offres.some(s=>/six mois|12 derniers mois/.test(s)));
console.log('Broker tweet data: 88 cells, 28 pairs, independent freshness, PEA cash scope and campaign expiry verified.');
