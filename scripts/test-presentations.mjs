import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { PRESENTATION_ACTORS, ACTOR_FAMILIES, buildActorTweet } from '../src/data/presentation-actors.js'
import { presentationReliefModel } from '../src/pages/presentation-shared/imageExport.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'
assert.equal(TOOLS.filter(row=>row.to==='/presentations').length,1)
assert.equal(HOME_TOOLS.filter(row=>row.to==='/presentations').length,1)
assert(!TOOLS.some(row=>row.to==='/presentation-scpi'||row.to==='/presentation-assurance-vie'))
assert.equal(PRESENTATION_ACTORS.length,9)
assert.equal(new Set(PRESENTATION_ACTORS.map(row=>row.id)).size,9)
for(const family of ACTOR_FAMILIES)assert(PRESENTATION_ACTORS.some(row=>row.family===family.id))
for(const record of PRESENTATION_ACTORS) {
  const text=buildActorTweet(record)
  assert(text.includes(record.vehicle) && text.includes(record.distinction))
  assert(text.includes('pas garantis') && text.includes('pas qualifiés'))
  assert.equal(record.verification,'manual')
  assert(record.sources.every(row=>new URL(row.url).protocol==='https:'))
  const model=presentationReliefModel(record,'actor')
  assert.equal(model.highlights.length,3)
  assert.equal(model.subtitle,ACTOR_FAMILIES.find(row=>row.id===record.family).label)
  assert(model.brand)
  await access(`public/asset-art/presentation-logos/${record.id}.${['mymarguerit','bacchus'].includes(record.id)?'png':'svg'}`)
}
const byId=id=>PRESENTATION_ACTORS.find(row=>row.id===id)
assert(buildActorTweet(byId('bricks')).includes('Tu es créancier'))
assert(buildActorTweet(byId('hectarea')).includes('pas directement une parcelle'))
assert(buildActorTweet(byId('matis')).includes('pas une échéance de remboursement garantie'))
assert(buildActorTweet(byId('france-valley')).includes('ne représente pas le rendement'))
console.log('Unified presentations: one route, nine actors, source scope and ownership distinctions OK.')
