import assert from 'node:assert/strict'
import HISTORY from '../src/data/anniversary-index-history.json' with { type: 'json' }
import CONFIG from './anniversary-indices.json' with { type: 'json' }
import LEVELS from '../src/data/anniversary-levels.json' with { type: 'json' }
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, MARKET_ASSETS, getHistoricalPrice, getValidYearsBackOptions, ymForYearsBack } from '../src/pages/tweet-midi/data/marketHistory.js'
import { buildAnniversaireText, buildAnniversaireComparatifText, getMarketAsset, TODAY, FORMATS, MODES } from '../src/pages/tweet-midi/lib.js'
import { resolveAnniversaryLevel } from '../src/data/anniversary-levels.js'
const clock = new Date('2026-10-11T12:00:00Z')
for (const config of CONFIG.series) {
  const record=HISTORY[config.id],asset=getMarketAsset(config.id)
  assert.equal(asset.currency,'USD');assert.equal(asset.priceUnit,'points')
  assert.ok(asset.anniversaryVariant.includes('réinvestis'))
  assert.ok(ANNIVERSAIRE_ELIGIBLE_ASSETS.some(a=>a.id===config.id))
  assert.equal(MARKET_ASSETS.some(a=>a.id===config.id), true, 'Official monthly histories are shared within their actual available windows')
  assert.equal(ANNIVERSAIRE_ELIGIBLE_ASSETS.filter(a=>a.id===config.id).length, 1, 'No duplicate anniversary choice')
  for (const [date,value] of record.points) assert.equal(getHistoricalPrice(config.id,date),value)
  const options=getValidYearsBackOptions(config.id,clock)
  assert.ok(options.length>0)
  for(const year of options)assert.ok(record.points.some(([date])=>date===ymForYearsBack(year,clock)))
  const level=LEVELS[config.id]
  assert.equal(level.currency,config.currency);assert.equal(level.variant,config.variant)
  // Active observations advance with collection; the history fixture's clock must not reject them.
  for(const asOf of [level.asOf,'2027-01-04']) {
    const observations={[config.id]:{...level,asOf}}
    const observedAt=new Date(`${asOf}T12:00:00Z`)
    assert.equal(resolveAnniversaryLevel(config.id,'',observedAt,observations)?.value,level.value)
  }
  const yearsBack=Math.min(...getValidYearsBackOptions(config.id,TODAY))
  const item={format:FORMATS.ANNIVERSAIRE,mode:MODES.SIMPLE,assetId:config.id,yearsBack}
  const text=buildAnniversaireText(item,'20000')
  assert.ok(text.includes(asset.label));assert.ok(text.includes('points'));assert.ok(text.includes('réinvestis'))
  const comparison=buildAnniversaireComparatifText({...item,mode:MODES.COMPARATIF,assetIdA:config.id,assetIdB:'nvidia'},'20000','150')
  assert.ok(comparison.includes(asset.label));assert.ok(comparison.includes('Nvidia'))
}
assert.deepEqual(getValidYearsBackOptions('ftseAllWorld',clock),[1,2])
// The first available month is October 2024; September 2026 only has one anniversary.
assert.deepEqual(getValidYearsBackOptions('ftseAllWorld',new Date('2026-09-15T12:00:00Z')),[1])
console.log('Nine official indices: exact levels, variants, available windows and both text modes verified.')
