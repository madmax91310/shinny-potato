import assert from 'node:assert/strict'
import {scanReviewDates} from './lib/source-review-dates.mjs'

const today=new Date(2026,10,6)
const iso=d=>d?[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'):null
const scan=(text,date=today)=>scanReviewDates(text,date)
// Real publication failure: the September review disappeared in November.
const old='// Sources contrôlées le 04/09/2026 ; https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf'
assert.equal(iso(scan(old).mostRecent),'2026-09-04')
assert.equal(iso(scan('// Contrôle ancien le 01/01/2001').mostRecent),'2001-01-01')
assert.equal(iso(scan('// Vérifié le 05/01/2027').mostRecent),'2027-01-05') // existing sixty-day window
assert.equal(scan('// Prévision le 06/01/2027').mostRecent,null)
assert.equal(iso(scan(old+'\n// Prévision le 01/01/2030').mostRecent),'2026-09-04')
assert.equal(iso(scan('// Contrôle le 29/02/2024').mostRecent),'2024-02-29')
assert.equal(scan('// Contrôle le 31/02/2026').mostRecent,null)
assert.equal(scan('Source identifiée, aucune date').mostRecent,null)
const mixed=scan(old+"\nOffre jusqu’au 31/12/2026")
assert.equal(iso(mixed.mostRecent),'2026-09-04')
assert.deepEqual(mixed.deadlines.map(d=>({date:d.date,daysUntil:d.daysUntil})),[{date:'31/12/2026',daysUntil:55}])
assert.equal(scan("// Ancien tarif jusqu’au 31/12/2025").deadlines.length,0)
// Month/year rollover never renews or removes an old source review.
for(let month=0;month<36;month++)assert.equal(iso(scan(old,new Date(2026,10+month,1)).mostRecent),'2026-09-04')
assert.equal(iso(scan(old+'\n// Autre contrôle le 01/10/2026').mostRecent),'2026-10-01')
assert.equal(iso(scan(old).mostRecent),'2026-09-04','Repeated scans are idempotent')
console.log('Source review dates: real September/November regression, old/future/invalid/leap dates, deadlines, 36 month rollovers and idempotence passed; no proof clock renewed.')
