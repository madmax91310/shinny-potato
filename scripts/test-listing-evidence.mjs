import assert from 'node:assert/strict';
import { validateListingEvidence } from './lib/listing-evidence.mjs';
const fixture = {
  today: '2026-09-30', published: { FR001400U5Q4: ['DCAM'] },
  listings: { FR001400U5Q4: [{ ticker: 'DCAM', mic: 'XPAR', exchange: 'Euronext Paris', currency: 'EUR', sourceUrl: 'https://www.amundietf.fr/example', checkedAt: '2026-09-30', evidenceId: 'a' }] },
  evidence: { a: { isin: 'FR001400U5Q4', identityEvidence: 'ISIN FR001400U5Q4', sourceUrl: 'https://www.amundietf.fr/example', checkedAt: '2026-09-30', excerpt: 'Euronext Paris EUR DCAM FP' } },
};
assert.deepEqual(validateListingEvidence(fixture), []);
const multiToken=structuredClone(fixture);
multiToken.published.FR001400U5Q4=['PPFB GY'];multiToken.listings.FR001400U5Q4[0].ticker='PPFB GY';multiToken.evidence.a.excerpt='Euronext Paris EUR PPFB GY';
assert.deepEqual(validateListingEvidence(multiToken),[]);
for(const excerpt of ['Euronext Paris EUR XPPFB GY','Euronext Paris EUR PPFBGY','Euronext Paris EUR PPFB GYX']) {
 const bad=structuredClone(multiToken);bad.evidence.a.excerpt=excerpt;assert(validateListingEvidence(bad).some(error=>error.includes('ticker absent')));
}
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

// Un ticker correct sur une autre place/devise ne doit pas contourner le choix commun.
const { validatePublishedListingSelection } = await import('./audit-instrument-listings.mjs');
const { getPreferredInstrumentListing } = await import('../src/data/instrument-listings.js');
const isin = 'IE000DQLYVB9';
const selected = getPreferredInstrumentListing(isin);
assert.equal(validatePublishedListingSelection([{ isin, listing: selected }]).length, 0);
for (const mutation of [
  { isin, listing: { ...selected, currency: 'USD' } },
  { isin, listing: { ...selected, mic: 'XLON', exchange: 'London Stock Exchange' } },
  { isin, listing: null },
  { isin, listing: selected, ticker: selected.ticker },
]) assert.equal(validatePublishedListingSelection([mutation]).length, 1);
console.log('Choix publié : 4 mutations place/devise/absence/copie refusées.');

// A fresh official listing set can retire an exchange without deleting archive evidence.
const {currentListingEvidence}=await import('./lib/current-listing-evidence.mjs')
const archive={old:{isin:'managed'},manual:{isin:'manual'}}
const fresh={new:{isin:'managed'},orphanNew:{isin:'managed'}}
const evidence=currentListingEvidence(archive,fresh,{managed:[]},{managed:[{evidenceId:'new'}]})
assert(!evidence.old)
assert(evidence.manual,'Unmanaged archive still audited')
assert(evidence.orphanNew,'New orphan evidence must still fail validation')
assert(archive.old,'Historical evidence retained unchanged')

const newerProof = { isin: 'FR001400U5Q4', checkedAt: '2026-10-18', excerpt: 'new issuer proof' };
const olderProof = { ...newerProof, checkedAt: '2026-10-17', excerpt: 'older collector proof' };
for (const sources of [
  [{ a: newerProof }, { a: olderProof }],
  [{ a: olderProof }, { a: newerProof }],
]) assert.equal(currentListingEvidence({}, sources, {}, {}).a, newerProof);
assert.equal(currentListingEvidence({ a: newerProof }, { a: olderProof }, {}, {}).a, newerProof);
assert.deepEqual(currentListingEvidence({ retired: olderProof }, [], { FR001400U5Q4: [] }, {}), {});
assert.equal(currentListingEvidence({}, { a: olderProof }, {}, {}).a, olderProof);
console.log('Listing evidence keeps the newest observation regardless of collector order.');
