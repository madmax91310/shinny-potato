import assert from 'node:assert/strict'
import { QUALIFIED_EXPOSURE_SHEETS, QUALIFIED_FACTS } from '../src/data/qualified-exposure-sheets.js'
import baseRecords from '../src/data/qualified-exposure-etfs.json' with { type:'json' }
import { ETFS } from '../src/data/etf-cards.js'
import { getETFArt } from '../src/pages/etf-sheets/visualIdentity.js'
import { buildText } from '../src/pages/etf-sheets/lib.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import nonBondRecords from '../src/data/non-bond-qualified-records.json' with {type:'json'};
const records={...baseRecords,...nonBondRecords};
for(const s of QUALIFIED_EXPOSURE_SHEETS){
 const r=records[s.id],sheet=ETFS.find(x=>x.id===s.id)
 assert.equal(sheet.name,r.name);assert.equal(QUALIFIED_FACTS[r.isin].benchmark,r.characteristics.index)
 assert.equal(sheet.listing.isin,undefined);assert(r.listings.some(l=>l.evidenceId===sheet.listing.evidenceId))
 for(const field of ['countries','sectors','holdings'])assert(r[field].rows.length&&r[field].asOf)
 assert.deepEqual(AUTOMATED_ETF[r.isin].performance.years,r.performance.years)
 assert(/^[a-f0-9]{64}$/.test(r.pageSha256));getETFArt(s.id)
 const text=buildText(sheet);assert(text.includes(r.isin));assert(!/non renseign|undefined|NaN/.test(text))
}
// New launch candidates only enter after a complete calendar year is actually published.
if (records['world-utilities']) assert(Object.keys(records['world-utilities'].performance.years).length > 0)
console.log(`${QUALIFIED_EXPOSURE_SHEETS.length} complete automatic issuer sheets, exact listings and source-derived fields verified.`)
