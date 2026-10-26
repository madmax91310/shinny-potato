import {fieldQualification} from './lib/data-qualification.mjs'
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { PRESENTATION_ACTORS, ACTOR_FAMILIES, applyActorOffer, buildActorTweet } from '../src/data/presentation-actors.js'
import { presentationReliefModel } from '../src/pages/presentation-shared/image-model.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'
assert.equal(TOOLS.filter(row=>row.to==='/presentations').length,1)
assert.equal(HOME_TOOLS.filter(row=>row.to==='/presentations').length,1)
assert(!TOOLS.some(row=>row.to==='/presentation-scpi'||row.to==='/presentation-assurance-vie'))
assert.equal(PRESENTATION_ACTORS.length,11)
assert.equal(new Set(PRESENTATION_ACTORS.map(row=>row.id)).size,11)
for(const family of ACTOR_FAMILIES)assert(PRESENTATION_ACTORS.some(row=>row.family===family.id))
for(const record of PRESENTATION_ACTORS) {
  const text=buildActorTweet(record)
  assert(text.includes(record.vehicle) && text.includes(record.distinction))
  assert(text.includes('pas garantis'))
  assert.equal(record.verification,'public-terms')
  assert(record.selectedOffer && Array.isArray(record.selectedOffer.missing))
  assert.equal(Object.keys(record.selectedOffer.fields).length,5)
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
console.log('Unified presentations: one route, eleven actors, source scope and ownership distinctions OK.')

const classique=byId('fundora'),horizon=applyActorOffer(classique,'horizon')
assert(buildActorTweet(classique).includes('2 à 3 %'))
assert(buildActorTweet(horizon).includes('4 à 10 %'))
assert.notDeepEqual(classique.highlights,horizon.highlights)
assert(buildActorTweet(byId('matis')).includes('60 mois'))
assert(buildActorTweet(byId('matis')).includes('24 mois'))
assert(buildActorTweet(byId('mymarguerit')).includes('8 %'))
assert(buildActorTweet(byId('enerfip')).includes('non libéré'))
assert(buildActorTweet(byId('hectarea')).includes('ne constitue pas une revente'))

const {DATA_CATALOG}=await import('../src/data/catalog.js')
const {buildReview}=await import('../src/pages/data-review/lib.js')
const review=buildReview('2026-10-09')
assert.equal(DATA_CATALOG.filter(record=>record.type==='actor').length,11)
assert.equal(review.items.filter(item=>item.id.startsWith('qualification:actor:')).length,10)
assert.equal(review.items.filter(item=>item.id.startsWith('qualification:insurance:')).length,1)

const anaxago=byId('anaxago'), partB=applyActorOffer(anaxago,'axclimat-i-b')
assert.equal(anaxago.offers.length,2)
assert(buildActorTweet(anaxago).includes('1,9 %/an'))
assert(!buildActorTweet(anaxago).includes('20 % à la souscription'))
assert(buildActorTweet(partB).includes('1,7 %/an') && buildActorTweet(partB).includes('20 % à la souscription'))
for (const record of [anaxago,partB]) {
  assert(buildActorTweet(record).includes('Souscriptions clôturées le 04/02/2026'))
  assert(presentationReliefModel(record,'actor').qualifier.includes('Souscriptions clôturées'))
}
const valley=byId('france-valley'),forets=applyActorOffer(valley,'gfi-forets'),europe=applyActorOffer(valley,'fonciere-europe')
assert.equal(valley.offers.length,3)
assert(buildActorTweet(forets).includes('10000 €') && buildActorTweet(forets).includes('0,9 % TTC/an'))
assert(buildActorTweet(europe).includes('Actions de la SAS') && buildActorTweet(europe).includes('107090 €'))
assert(!buildActorTweet(europe).includes('Parts du GFI France Valley Patrimoine'))
assert.notDeepEqual(presentationReliefModel(forets,'actor').highlights,presentationReliefModel(europe,'actor').highlights)
assert(buildActorTweet(byId('bricks')).includes('1,2 € TTC'))
for (const actor of PRESENTATION_ACTORS) for (const offer of actor.offers) {
  const record=applyActorOffer(actor,offer.id),text=buildActorTweet(record)
  if(record.activity?.status==='ceased'){assert(text.includes('cessé son activité'));assert(!text.includes('💸'))}
  else assert(text.includes('👇') && text.includes('💸'))
  assert(text.length < 1700, `${actor.id}/${offer.id}`)
  assert(text.split('\n\n').at(-1).startsWith(record.activity?.status==='ceased'?'Avis officiel contrôlé':'💬 '))
  assert(!/undefined|NaN|qualifié|qualifiée/.test(text))
  assert.equal((text.match(/🔎 /g) ?? []).length,offer.warnings.length ? 1 : 0)
  // Retain the selected offer's main fee rates and warnings, while omitting secondary costs.
  for (const figure of (record.activity?.status==='ceased'?'':offer.fields.fees.value).split('. ').slice(0, actor.id === 'bacchus' ? 0 : 2).join(' ').match(/\d+(?:[.,]\d+)?/g) ?? []) {
    assert(text.includes(figure), `${actor.id}/${offer.id}: missing main fee ${figure}`)
  }
  for (const warning of offer.warnings) assert(text.includes(warning))
}

for (const id of ['bricks','enerfip','hectarea','matis']) {
  const record=byId(id),offer=record.selectedOffer
  assert.equal(offer.scopeType,'platform')
  assert(buildActorTweet(record).includes('Fiche générale'))
  assert(offer.projectRequirements.length > 0)
  assert.equal(Boolean(offer.missing.length),id === 'hectarea')
  const catalog=DATA_CATALOG.find(row=>row.id === `actor:${id}`)
  assert(catalog.fields.some(row=>row.label?.includes('Conditions variables') || row.name?.includes('Conditions variables')))
}

const ceased=byId('tudigo')
assert.equal(ceased.activity.status,'ceased')
assert(buildActorTweet(ceased).includes('cessé son activité'))
assert(!buildActorTweet(ceased).includes('Souscription :'))
assert(presentationReliefModel(ceased,'actor').qualifier.includes('Activité cessée'))
const archive=DATA_CATALOG.find(r=>r.id==='actor:tudigo')
assert.equal(archive.fields.filter(f=>f.archived).length,5)
assert(archive.fields.some(f=>f.label==='Statut de l’activité'))
for(const f of archive.fields.filter(f=>f.archived))assert.equal(fieldQualification(f,archive).kind,'archive')
