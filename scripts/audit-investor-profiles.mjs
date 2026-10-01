import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INVESTOR_PROFILES, investorIntroduction } from '../src/data/investor-profiles.js'
import { INVESTORS, buildTweet, normalizePortfolio, portfolioCompanies, portfolioEditorial } from '../src/pages/investor-portfolio/data.js'
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
  assert(tweet.startsWith('📊 ') && tweet.split('\n')[0].includes('42,0 %'))
  for (const label of ['💼 Ses principales positions', '🔍 Ce qui distingue ce portefeuille', '📅 Photographie', '💬 ']) assert(tweet.includes(label))
  assert(!/undefined|NaN|\\\\n/.test(tweet))
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

const splitClasses = [
  { issuerName: 'Alphabet Inc.', ticker: 'GOOGL', weight: .25 },
  { issuerName: 'Alphabet Inc. CL C', ticker: 'GOOG', weight: .23 },
  { issuerName: 'Autre société', ticker: 'OTHER', weight: .52 },
]
const grouped = portfolioCompanies(splitClasses)
assert.equal(grouped.length, 2)
assert.equal(grouped.find(row => row.ticker === 'GOOG(L)').weight, .48)
assert.equal(portfolioCompanies([{ issuerName: 'Alphabet Inc.', ticker: 'GOOGL', weight: .4 }])[0].ticker, 'GOOGL')
const identity = { slug: 'tepper', displayName: 'David Tepper', entityName: 'Déclarant de test' }
const make = holdings => ({ identity, snapshot: { periodEnd: '2026-06-30' }, holdings })
const liLu = normalizePortfolio(JSON.parse(readFileSync(new URL('../public/data/investors/li-lu.json', import.meta.url), 'utf8')))
assert.equal(portfolioEditorial(liLu).hook, '📊 Près de 95 % sur seulement 4 entreprises : voici le portefeuille déclaré de Li Lu 👇')
assert(buildTweet(make(splitClasses)).includes('52,0 %'))
const balanced = Array.from({ length: 10 }, (_, i) => ({ issuerName: 'Société ' + i, ticker: 'T' + i, weight: .1 }))
assert(!portfolioEditorial(make(balanced)).hook.includes('seulement'))
assert(portfolioEditorial(make(balanced)).explanation.includes('50,0 %'))
const fund = { issuerName: 'Vanguard ETF', ticker: 'ETF', weight: 1 }
assert(portfolioEditorial(make([fund])).hook.includes('position'))
assert(!portfolioEditorial(make([fund])).hook.includes('entreprise'))
console.log('Hooks calculés, catégories regroupées, concentration et fonds : cas limites validés.')
