import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INVESTOR_PROFILES, investorIntroduction } from '../src/data/investor-profiles.js'
import { INVESTORS, buildTweet, normalizePortfolio } from '../src/pages/investor-portfolio/data.js'
assert.deepEqual(Object.keys(INVESTOR_PROFILES).sort(), INVESTORS.map(([id]) => id).sort())
for (const [slug, displayName] of INVESTORS) {
  const profile = INVESTOR_PROFILES[slug]
  assert(profile.intro && profile.intro.length < 210 && profile.intro.endsWith('.'))
  assert.equal(profile.intro.split(/[.!?]/).filter(v => v.trim()).length, 1, 'Une seule phrase par profil')
  assert(profile.sourceUrls.length && profile.sourceUrls.every(url => new URL(url).protocol === 'https:'))
  assert(profile.checkedAt)
  const portfolio = { identity: { slug, displayName, entityName: 'Entité déclarante de test' }, snapshot: { periodEnd: '2026-06-30' }, holdings: [{ issuerName: 'Entreprise de test', ticker: 'TEST', weight: .42 }] }
  const tweet = buildTweet(portfolio)
  assert(tweet.includes(investorIntroduction(slug)))
  assert(tweet.includes('Entité déclarante de test') && tweet.includes('30 juin 2026'))
  assert(tweet.includes('Cette ligne représente') && !tweet.includes('Ces cinq lignes'))
  assert(!tweet.includes('place-t-il'))
  assert(buildTweet(portfolio, 'Ma présentation.').includes('Ma présentation.'))
  assert(!buildTweet(portfolio, 'Ma présentation.').includes(profile.intro))
  assert(buildTweet(portfolio, '  ').includes(profile.intro))
}
console.log(`${INVESTORS.length} présentations sourcées : couverture complète, tweets cohérents et personnalisation OK.`)

for (const slug of ['li-lu', 'gates-trust', 'klarman']) {
  const portfolio = normalizePortfolio(JSON.parse(readFileSync(new URL(`../public/data/investors/${slug}.json`, import.meta.url), 'utf8')))
  assert.equal(portfolio.identity.slug, slug)
  assert.equal(portfolio.identity.dataProvider, 'FolioFact')
  assert.equal(new URL(portfolio.sourceUrl).hostname, 'foliofact.com')
  assert(buildTweet(portfolio).includes(investorIntroduction(slug)))
}
console.log('Les trois instantanés 13F locaux sont présents et exploitables.')
