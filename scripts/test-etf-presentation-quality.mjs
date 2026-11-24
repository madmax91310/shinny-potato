import assert from 'node:assert/strict'
import { ETFS } from '../src/data/etf-cards.js'
import reviewedIds from '../src/data/etf-presentation-reviewed-ids.json' with {type:'json'}
import { REVIEWED_EXPOSURE_COPY } from '../src/data/etf-presentation-copy.js'
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js'
import { buildText, accountLabel, buildFactRows } from '../src/pages/etf-sheets/lib.js'
import { presentationComposition, presentationCountries } from '../src/pages/etf-sheets/presentationDetails.js'
import { formatTweetPerformance, performanceEntries } from '../src/pages/etf-sheets/annualPerformance.js'
assert.deepEqual(new Set(reviewedIds),new Set(ETFS.map(e=>e.id)),'Toute nouvelle fiche exige une revue explicite')
assert.deepEqual(new Set(Object.keys(REVIEWED_EXPOSURE_COPY)),new Set(reviewedIds))
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
  assert(text.includes(`🆔 ISIN : ${etf.isin}`),etf.id)
  assert(text.includes(`💸 ${copy.feeLabel} : ${etf.ter.replace(/(\d)\s*%/g, '$1 %')}`),etf.id)
  assert.doesNotMatch(text, /Performances annuelles|^[🟢🔴] \d{4}\s*:/mu, etf.id)
  assert.doesNotMatch(text, /^Indice suivi :|Le fonds utilise un swap : il échange|Capitalisation et\/ou distribution/m, etf.id)
  if (text.includes('🟡 Matières premières de l’indice suivi')) assert(!text.includes('🔄 '),etf.id)
  if (etf.category === 'Obligataires') assert(!text.includes('À elles trois,'),etf.id)
  assert(!/undefined|\bNaN\b|\bnull\b/.test(text),etf.id)
  assert.doesNotMatch(text,/\b\d{2}\/\d{2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|Cotation :|Encours|Devise de la part|Duration effective|Répartition par pays|hors liquidités et dérivés/,etf.id)
  assert(text.startsWith(copy.hook+'\n\n'),etf.id)
  assert(text.includes(copy.postWhatIs),etf.id)
  if (copy.closing) assert(text.includes(copy.closing),etf.id)
  if (etf.id.startsWith('lifestrategy')) assert.match(text,/⚖️ Allocation du fonds\n.*Obligations/s,etf.id)
  assert.equal(buildText(copy),text,'Le rendu est idempotent')
  if(/^(Part|Fonds)\s*:/.test(etf.aum))assert.equal(copy.aum,etf.aum,'Le périmètre de l’encours reste explicite')
  if(etf.listing) assert(text.includes(`(${etf.listing.ticker})`),etf.id)
  if(etf.pea===false)assert(text.includes('PEA : ❌'),etf.id)
  const factRows=buildFactRows(etf)
  if(copy.shareCurrency)assert(factRows.some(row=>row.text.includes('Devise de la part : '+copy.shareCurrency)),etf.id)
  assert(factRows.every(row=>typeof row.text==='string'&&row.text.length>0),etf.id)
}
assert(!accountLabel({pea:null,cto:true}).includes('PEA'))
const observation={holdings:{asOf:'2026-09-30',basis:'fund',rows:[{name:'A',weightPct:40},{name:'B',weightPct:30},{name:'C',weightPct:10}]},countries:{asOf:'2026-09-30',rows:[{name:'France',weightPct:100}]}}
assert.equal(presentationComposition(observation,{replicationMethod:'Synthetic swap'}),'','Un panier de substitution ne décrit pas l’indice')
assert.equal(presentationCountries(observation,{replicationMethod:'Hybrid Replication'}),'')
assert(presentationComposition({...observation,holdings:{...observation.holdings,basis:'index'}},{replicationMethod:'Synthetic swap'}).includes('de l’indice suivi'))
assert.match(presentationComposition(observation,{replicationMethod:'Physical'},{forPost:true}),/A, B et C pèsent 80 % du fonds/)
assert.equal(presentationComposition(observation,{replicationMethod:'Synthetic swap'},{forPost:true}),'')
const diversified = {...observation,holdings:{...observation.holdings,rows:observation.holdings.rows.map(row=>({...row,weightPct:row.weightPct/2}))}}
assert.equal(presentationComposition(diversified,{replicationMethod:'Physical'},{forPost:true}),'')
assert.match(presentationComposition(diversified,{replicationMethod:'Physical'}), /40 %/)
const cl2 = ETFS.find(etf => etf.isin === 'FR0010755611')
const cl2Text = buildText(cl2)
assert.match(cl2Text, /deux jours.*lâche 4 %/)
assert.match(cl2Text, /à 99 €.*à 96 € avant coûts/)
assert.doesNotMatch(cl2Text, /Apple|Nvidia|Microsoft|MSCI USA Leveraged 2X Index/)

assert.equal(presentationComposition({...observation,holdings:{...observation.holdings,asOf:null}},{replicationMethod:'Physical'}),'')
const rows=performanceEntries({values:[10,20],calendarYears:[2025,2026]},new Date('2026-10-23T00:00:00Z'))
assert.deepEqual(rows.map(r=>r.label),['2025'])
assert.deepEqual(performanceEntries({values:[],observations:[{label:'Depuis janvier',value:3,asOf:'2026-09-30'}]}).map(r=>r.label),['Depuis janvier'])
assert.equal(formatTweetPerformance({values:[],observations:[{label:'Depuis janvier',value:3,asOf:'2026-09-30'}]},{annualOnly:true}),'')
assert.throws(()=>getPresentationCopy({...ETFS[0],id:'new-unreviewed-share'}),/qualifier/)
console.log(`${ETFS.length} présentations : couverture, identité, périmètres, dates, devises, texte et garde-fous validés.`)
await import('./test-native-fund-details.mjs')
