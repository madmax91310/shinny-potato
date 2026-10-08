import assert from 'node:assert/strict'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
import LEVELS from '../src/data/anniversary-levels.json' with { type: 'json' }
import { computeBrut, computePoste, computeSmicEvolution, purchasingPowerStory } from '../src/pages/purchasing-power/lib.js'
import { PURCHASING_OBSERVATIONS as o, YEAR_MAX } from '../src/data/purchasing-power.js'
import { buildAnniversaireText, buildAnniversaireComparatifText, FORMATS, MODES } from '../src/pages/tweet-midi/lib.js'
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`)
for (let year=2010; year<=YEAR_MAX; year++) {
  close(computeBrut(1000,year).factor, o.prices.latestLevels.general / o.prices.annualLevels.general[year])
  for (const [post,key] of [['alimentation','alimentation'],['carburant','energie']]) close(computePoste(1000,year,post).factor, o.prices.latestLevels[key] / o.prices.annualLevels[key][year])
  close(computePoste(1000,year,'loyer').factor,o.irl.values[o.irl.asOf]/o.irl.values[`${year}-Q1`])
  close(computeSmicEvolution(year),(o.smic.values[o.smic.asOf]/o.smic.values[`${year}-01`]-1)*100)
}
assert.throws(()=>computeBrut(1000,2009),/absent/)
assert.equal(purchasingPowerStory({amount:1000,startYear:2020,mode:'brut'}).provisional,o.prices.provisional)
assert.equal(purchasingPowerStory({amount:1000,startYear:2020,mode:'par-poste',posteId:'loyer'}).provisional,false)
const fixture={bitcoin:{value:100,asOf:'2026-10-07',currency:'USD',maxAgeDays:7}}
const clock=new Date('2026-10-08T12:00:00Z')
assert.equal(resolveAnniversaryLevel('bitcoin','',clock,fixture).value,100)
assert.equal(resolveAnniversaryLevel('bitcoin','120',clock,fixture).manual,true)
for (const raw of ['-1','0','nope',Infinity]) assert.equal(resolveAnniversaryLevel('bitcoin',raw,clock,fixture),null)
for (const date of ['2026-10-01','2026-10-06','2026-10-20']) {
  const result=resolveAnniversaryLevel('bitcoin','',new Date(date+'T12:00:00Z'),fixture)
  if (date!=='2026-10-01') assert.equal(result,null)
}
assert.equal(resolveAnniversaryLevel('missing','',clock,fixture),null)
assert.equal(resolveAnniversaryLevel('bitcoin','',clock,{bitcoin:{...fixture.bitcoin,value:NaN}}),null)
for(const [id,record] of Object.entries(LEVELS)) {
  assert.ok(record.sourceUrl.startsWith('https://'))
  assert.ok(record.value>0)
  assert.ok(['EUR','USD'].includes(record.currency))
  const at=new Date(`${record.asOf}${record.asOf.length===7?'-28':''}T12:00:00Z`)
  assert.equal(resolveAnniversaryLevel(id,'',at)?.value,record.value)
}
const item={format:FORMATS.ANNIVERSAIRE,assetId:'bitcoin',yearsBack:1,mode:MODES.SIMPLE}
const auto=resolveAnniversaryLevel('bitcoin','')
if(auto)assert.ok(buildAnniversaireText(item,'').includes(auto.label))
assert.ok(buildAnniversaireText(item,'100000').includes('Niveau saisi manuellement'))
assert.ok(buildAnniversaireComparatifText({...item,mode:MODES.COMPARATIF,assetIdA:'bitcoin',assetIdB:'ethereum'},'100000','3000').includes('Niveau saisi manuellement'))
console.log(`Ratios INSEE, SMIC, ${Object.keys(LEVELS).length} observations, dates, péremption et overrides validés.`)
