import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INVESTOR_PROFILES, investorIntroduction } from '../src/data/investor-profiles.js'
import { INVESTORS, buildTweet, normalizePortfolio } from '../src/pages/investor-portfolio/data.js'
import { editorialCopy, draftBasis } from '../src/pages/investor-portfolio/editorial.js'
import { publicationPlan } from '../src/pages/investor-portfolio/publication.js'
assert.deepEqual(Object.keys(INVESTOR_PROFILES).sort(), INVESTORS.map(([id])=>id).sort())
const read = path => JSON.parse(readFileSync(path,'utf8'))
const endings = new Set()
for (const [slug] of INVESTORS) {
  const profile=INVESTOR_PROFILES[slug]
  assert(investorIntroduction(slug) && profile.checkedAt && profile.sourceUrls.every(url=>new URL(url).protocol==='https:'))
  const payload=read(`public/data/investors/${slug}.json`), portfolio=normalizePortfolio(payload), before=JSON.stringify(portfolio)
  const tweet=buildTweet(portfolio)
  const editorial = editorialCopy(portfolio)
  assert(!/\bNaN\b|\bundefined\b|#|—|ma lecture|ce qu.il faut retenir|décryptage|\{\w+\}/i.test(tweet))
  if (editorial.text) {
    assert(editorial.text.length >= 600 && editorial.short.length <= 270)
    assert(editorial.weights.length >= 3)
    const end = editorial.text.split('\n\n').at(-1)
    assert(end.includes('?') && !endings.has(end))
    endings.add(end)
  }
  if(portfolio.problem) { assert(tweet.includes('Données incomplètes')); assert.throws(()=>publicationPlan(portfolio)) }
  else {
    const plan=publicationPlan(portfolio)
    if (editorial.status === 'reviewed') {
      const next = structuredClone(portfolio)
      next.snapshot.periodEnd = next.snapshot.periodEnd === '2026-09-30' ? '2026-06-30' : '2026-09-30'
      assert.notEqual(draftBasis(next), draftBasis(portfolio))
      const updated = editorialCopy(next)
      assert.equal(updated.status, 'review')
      assert(updated.comparisons.every(({ rows, weight }) => rows.reduce((sum, row) => sum + row.value, 0) / next.total === weight))
      assert.equal(buildTweet(next), tweet, 'Le texte relu reste disponible pour la révision')
      const amended = structuredClone(portfolio)
      amended.holdings[0].value++
      amended.total++
      assert.equal(editorialCopy(amended).status, 'review')
    }
    assert(Math.abs(plan.total-portfolio.holdings.reduce((sum,r)=>sum+r.value,0))<.01)
  }
  assert.equal(before,JSON.stringify(portfolio),'Génération sans mutation')
  for(const change of ['date','duplicate','nan','option','name','incomplete']) {
    const bad=structuredClone(payload), rows=bad.data.snapshot.holdings
    if(change==='date')bad.data.snapshot.periodEnd='2026-06-29'
    if(change==='duplicate')rows.push({...rows[0]})
    if(change==='nan')rows[0].weight=NaN
    if(change==='option')rows[0].putCall='UNKNOWN'
    if(change==='name')rows[0].issuerName=42
    if(change==='incomplete')bad.data.snapshot.holdings=[{issuerName:'Partial',ticker:'PART',weight:.1}]
    assert.throws(()=>normalizePortfolio(bad),undefined,change)
  }
}
const reviews=read('public/data/investors/review-metadata.json')
assert.deepEqual(reviews.map(r=>r.data.identity.slug).sort(),INVESTORS.map(([id])=>id).sort())
for(const review of reviews) {
  const stored=read(`public/data/investors/${review.data.identity.slug}.json`)
  assert.equal(review.data.snapshot.periodEnd,stored.data.snapshot.periodEnd)
  assert.equal(review.as_of,stored.as_of)
  assert(!review.data.snapshot.holdings)
}
console.log(`${INVESTORS.length} profils sourcés, photographie, états incomplets, montants, textes relus, états de révision et métadonnées vérifiés.`)
await import('./test-investor-functional.mjs')
