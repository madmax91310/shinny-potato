import assert from 'node:assert/strict'
import { ETFS } from '../src/data/etf-cards.js'
import reviewedIds from '../src/data/etf-presentation-reviewed-ids.json' with {type:'json'}
import { REVIEWED_EXPOSURE_COPY } from '../src/data/etf-presentation-copy.js'
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js'
import { buildText, accountLabel, buildFactRows } from '../src/pages/etf-sheets/lib.js'
import { presentationComposition, presentationCountries } from '../src/pages/etf-sheets/presentationDetails.js'
import { performanceEntries } from '../src/pages/etf-sheets/annualPerformance.js'
assert.deepEqual(new Set(reviewedIds),new Set(ETFS.map(e=>e.id)),'Toute nouvelle fiche exige une revue explicite')
assert.equal(new Set(ETFS.map(e=>e.isin)).size,ETFS.length)
for(const etf of ETFS) {
  assert(REVIEWED_EXPOSURE_COPY[etf.id],etf.id)
  const copy=getPresentationCopy(etf),text=buildText(etf)
  for(const key of ['hook','whatIs','whyInteresting','whatToKnow','question']) {
    assert.equal(typeof copy[key],'string',`${etf.id}/${key}`)
    assert(copy[key].length>20,`${etf.id}/${key}`)
    assert(!/Cette sélection reste exposée aux baisses de la Bourse|Une sélection d’entreprises sur un thème|Pour cette exposition, tu regardes|Tu utiliserais cette exposition pour compléter/.test(copy[key]),`${etf.id}/${key}: secours générique`)
  }
  assert.notEqual(copy.whatIs,copy.whyInteresting)
  assert.notEqual(copy.whyInteresting,copy.whatToKnow)
  assert(text.endsWith('\n\nPas un conseil financier.'),etf.id)
  for(const heading of ['🔍 Ce que tu achètes','✅ Pourquoi s’y intéresser ?','⚠️ Le point de vigilance','💬 '])assert(text.includes(heading),etf.id)
  assert(text.includes(etf.isin))
  assert(!/undefined|\bNaN\b|\bnull\b/.test(text),etf.id)
  assert.equal(buildText(copy),text,'Le rendu est idempotent')
  if(/^(Part|Fonds)\s*:/.test(etf.aum))assert.equal(copy.aum,etf.aum,'Le périmètre de l’encours reste explicite')
  if(etf.listing) assert(text.includes(`(${etf.listing.ticker})`),etf.id)
  if(etf.pea===false)assert(text.includes('PEA : ❌'),etf.id)
  if(copy.shareCurrency)assert(text.includes('Devise de la part : '+copy.shareCurrency))
  assert(buildFactRows(etf).every(row=>typeof row.text==='string'&&row.text.length>0),etf.id)
}
assert(!accountLabel({pea:null,cto:true}).includes('PEA'))
const observation={holdings:{asOf:'2026-09-30',basis:'fund',rows:[{name:'A',weightPct:40},{name:'B',weightPct:30},{name:'C',weightPct:10}]},countries:{asOf:'2026-09-30',rows:[{name:'France',weightPct:100}]}}
assert.equal(presentationComposition(observation,{replicationMethod:'Synthetic swap'}),'','Un panier de substitution ne décrit pas l’indice')
assert.equal(presentationCountries(observation,{replicationMethod:'Hybrid Replication'}),'')
assert(presentationComposition({...observation,holdings:{...observation.holdings,basis:'index'}},{replicationMethod:'Synthetic swap'}).includes('de l’indice suivi'))
assert.equal(presentationComposition({...observation,holdings:{...observation.holdings,asOf:null}},{replicationMethod:'Physical'}),'')
const rows=performanceEntries({values:[10,20],calendarYears:[2025,2026]},new Date('2026-10-23T00:00:00Z'))
assert.deepEqual(rows.map(r=>r.label),['2025'])
assert.deepEqual(performanceEntries({values:[],observations:[{label:'Depuis janvier',value:3,asOf:'2026-09-30'}]}).map(r=>r.label),['Depuis janvier'])
assert.throws(()=>getPresentationCopy({...ETFS[0],id:'new-unreviewed-share'}),/qualifier/)
console.log(`${ETFS.length} présentations : couverture, identité, périmètres, dates, devises, texte et garde-fous validés.`)
