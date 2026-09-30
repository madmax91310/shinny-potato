import assert from 'node:assert/strict';
import { validateListingEvidence } from './lib/listing-evidence.mjs';
const fixture = {
  today: '2026-09-30', published: { FR001400U5Q4: ['DCAM'] },
  listings: { FR001400U5Q4: [{ ticker: 'DCAM', mic: 'XPAR', exchange: 'Euronext Paris', currency: 'EUR', sourceUrl: 'https://www.amundietf.fr/example', checkedAt: '2026-09-30', evidenceId: 'a' }] },
  evidence: { a: { isin: 'FR001400U5Q4', identityEvidence: 'ISIN FR001400U5Q4', sourceUrl: 'https://www.amundietf.fr/example', checkedAt: '2026-09-30', excerpt: 'Euronext Paris EUR DCAM FP' } },
};
assert.deepEqual(validateListingEvidence(fixture), []);
for (const mutate of [
  x => { x.listings = {}; },
  x => { x.evidence = {}; },
  x => { x.evidence.a.isin = 'IE000DQLYVB9'; },
  x => { x.listings.FR001400U5Q4[0].currency = 'USD'; },
  x => { x.listings.FR001400U5Q4[0].mic = 'XLON'; x.listings.FR001400U5Q4[0].exchange = 'London Stock Exchange'; },
  x => { x.evidence.a.excerpt = 'Euronext Paris EUR SPEA FP'; },
  x => { x.evidence.a.sourceUrl = x.listings.FR001400U5Q4[0].sourceUrl = 'https://www.amundietf.fr.evil.example/proof'; },
  x => { x.evidence.a.checkedAt = x.listings.FR001400U5Q4[0].checkedAt = '2026-02-30'; },
  x => { x.evidence.a.checkedAt = x.listings.FR001400U5Q4[0].checkedAt = '2025-01-01'; },
  x => { x.evidence.a.checkedAt = x.listings.FR001400U5Q4[0].checkedAt = '2026-10-01'; },
]) {
  const changed = structuredClone(fixture); mutate(changed);
  assert.ok(validateListingEvidence(changed).length, 'Une preuve invalide doit bloquer la publication');
}
console.log('Preuve valide acceptée ; 10 régressions de preuve refusées.');
