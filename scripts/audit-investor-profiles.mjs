import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INVESTOR_PROFILES, investorIntroduction } from '../src/data/investor-profiles.js'
import { INVESTORS, buildTweet, normalizePortfolio, percentage } from '../src/pages/investor-portfolio/data.js'
import { publicationPlan, portfolioOwner } from '../src/pages/investor-portfolio/publication.js'
assert.deepEqual(Object.keys(INVESTOR_PROFILES).sort(), INVESTORS.map(([id])=>id).sort())
const read = path => JSON.parse(readFileSync(path,'utf8'))
for (const [slug] of INVESTORS) {
  const profile=INVESTOR_PROFILES[slug]
  assert(investorIntroduction(slug) && profile.checkedAt && profile.sourceUrls.every(url=>new URL(url).protocol==='https:'))
  const payload=read(`public/data/investors/${slug}.json`), portfolio=normalizePortfolio(payload), before=JSON.stringify(portfolio)
  const tweet=buildTweet(portfolio)
  assert(tweet.startsWith(`Portefeuille de ${portfolioOwner(portfolio)} :`))
  assert(!/NaN|undefined|#|performance|rendement/.test(tweet))
  if(portfolio.problem) { assert(tweet.includes('Données incomplètes')); assert.throws(()=>publicationPlan(portfolio)) }
  else {
    const plan=publicationPlan(portfolio)
    for(const row of plan.entries) assert(tweet.includes(row.label) && tweet.includes(percentage(row.weight)))
    assert(tweet.endsWith('Quelle ligne aimerais-tu avoir dans ton portefeuille ? 👇'))
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
console.log(`${INVESTORS.length} profils sourcés, photographie, états incomplets, montants, texte court et métadonnées vérifiés.`)
await import('./test-investor-functional.mjs')
