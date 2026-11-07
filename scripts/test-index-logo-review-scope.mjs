import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { reviewedLogoSheets } from './index-logo-review-scope.mjs'

const existing = {id:'existing',holdings:[['Reviewed',12]]}
const added = {id:'newly-qualified',holdings:[['Unreviewed',9]]}
const sheets = [added,existing]
const archive = {uses:[{sheet:'existing',name:'Reviewed'}]}
const before = JSON.stringify({sheets,archive})
assert.deepEqual(reviewedLogoSheets(sheets,archive),[existing])
assert.equal(reviewedLogoSheets(sheets,null),sheets)
assert.throws(()=>reviewedLogoSheets([added],archive),/Reviewed logo sheet missing: existing/)
assert.equal(JSON.stringify({sheets,archive}),before)
// All archived aliases, file hashes, SVG safety and byte parity are still
// checked by the actual generator against the current production data.
execFileSync('node',['scripts/build-index-logo-registry.mjs','--check'],{stdio:'pipe'})
console.log('Reviewed logo scope: newly qualified sheets keep initials; existing evidence and missing-sheet guard preserved.')
