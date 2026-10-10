import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INVESTOR_PROFILES, investorIntroduction } from '../src/data/investor-profiles.js'
import { INVESTORS, buildTweet, normalizePortfolio, portfolioCompanies, portfolioEditorial, movementExcerpt, dateFR, percentage } from '../src/pages/investor-portfolio/data.js'
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
  assert(tweet.includes('💼 Ses principales positions au 30 juin 2026'))
  assert(tweet.includes('Cette ligne représente') && !tweet.includes('Ces cinq lignes'))
  assert(/\bje\b|mon attention|me frappe|m’intéresse/i.test(tweet), 'Un regard personnel dans le tweet')
  for (const label of ['💼 Ses principales positions', '💬 ']) assert(tweet.includes(label))
  assert(!/undefined|NaN|\\\\n/.test(tweet))
  assert(!tweet.includes('place-t-il'))
  assert(buildTweet(portfolio, 'Ma présentation.').includes('Ma présentation.'))
  assert(!buildTweet(portfolio, 'Ma présentation.').includes(profile.intro))
  assert(buildTweet(portfolio, '  ').includes(profile.intro))
}
console.log(`${INVESTORS.length} présentations sourcées : couverture complète, tweets cohérents et personnalisation OK.`)

for (const [slug] of INVESTORS) {
  const portfolio = normalizePortfolio(JSON.parse(readFileSync(new URL(`../public/data/investors/${slug}.json`, import.meta.url), 'utf8')))
  assert.equal(portfolio.identity.slug, slug)
  assert.equal(portfolio.identity.dataProvider, slug === 'ackman' ? 'Tracefour' : 'FolioFact')
  assert.equal(new URL(portfolio.sourceUrl).hostname, slug === 'ackman' ? 'tracefour.com' : 'foliofact.com')
  assert(buildTweet(portfolio).includes(investorIntroduction(slug)))
}
console.log(`${INVESTORS.length} instantanés 13F locaux sont présents et exploitables.`)

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
assert(portfolioEditorial(liLu).explanation.includes('85,1 %'))
assert(buildTweet(make(splitClasses)).includes('52,0 %'))
const balanced = Array.from({ length: 10 }, (_, i) => ({ issuerName: 'Société ' + i, ticker: 'T' + i, weight: .1 }))
assert(!portfolioEditorial(make(balanced)).hook.includes('seulement'))
assert(portfolioEditorial(make(balanced)).explanation.includes('50,0 %'))
const fund = { issuerName: 'Vanguard ETF', ticker: 'ETF', weight: 1 }
assert(portfolioEditorial(make([fund])).hook.includes('ligne'))
assert(!portfolioEditorial(make([fund])).hook.includes('entreprise'))
console.log('Hooks calculés, catégories regroupées, concentration et fonds : cas limites validés.')

const movements = { periodEnd: '2026-06-30', quarterChanges: { priorPeriodLabel: 'Q1 2026', exits: [
  { issuerName: 'Sortie', ticker: 'EXIT', putCall: null },
  { issuerName: 'Option sortie', ticker: 'OPT', putCall: 'PUT' },
] }, holdings: [
  { issuerName: 'Alphabet A', ticker: 'GOOGL', weight: .4, isNew: true, sharesChangePct: 999 },
  { issuerName: 'Alphabet C', ticker: 'GOOG', weight: .2, isNew: false, sharesChangePct: 18 },
  { issuerName: 'Baisse', ticker: 'DOWN', weight: .1, sharesChangePct: -12 },
  { issuerName: 'Poids seul', ticker: 'WEIGHT', weight: .1, deltaWeightPp: 8 },
  { issuerName: 'Option', ticker: 'OPT', weight: .1, putCall: 'CALL', isNew: true },
] }
const excerpt = movementExcerpt(movements)
assert(excerpt.includes('depuis le T1 2026'))
assert.equal(excerpt.split('\n').length, 5)
assert(excerpt.includes('Nouvelle ligne : Alphabet $GOOGL'))
assert(excerpt.includes('Alphabet $GOOG : nombre d’actions +18 %'))
assert(excerpt.includes('nombre d’actions −12 %') && excerpt.includes('Ligne sortie : Sortie $EXIT'))
assert(!/WEIGHT|OPT|999/.test(excerpt))
assert.equal(movementExcerpt({ holdings: movements.holdings }), '')
assert.equal(movementExcerpt({ ...movements, holdings: [], quarterChanges: { priorPeriodLabel: 'Q1 2026', exits: [] } }), '')
const withMoves = buildTweet({ ...make(movements.holdings), snapshot: movements })
assert(withMoves.indexOf('🔄 Quelques mouvements') > withMoves.indexOf('💼 Ses principales positions'))
assert(withMoves.indexOf('🔄 Quelques mouvements') < withMoves.indexOf('À elles seules'))
console.log('Encart mouvements : quatre lignes, quantités, classes distinctes, options exclues et comparaison manquante validés.')

const baker = normalizePortfolio(JSON.parse(readFileSync(new URL('../public/data/investors/baker-bros.json', import.meta.url), 'utf8')))
const renaissance = normalizePortfolio(JSON.parse(readFileSync(new URL('../public/data/investors/renaissance.json', import.meta.url), 'utf8')))
assert(buildTweet(baker).includes('Felix et Julian Baker'))
assert(buildTweet(baker).includes('Les frères Baker'))
assert(buildTweet(renaissance).includes('société de gestion quantitative'))
assert(buildTweet(renaissance).includes('décédé en 2024'))
assert(buildTweet(renaissance).includes('Renaissance Technologies déclare'))
assert(!buildTweet(renaissance).includes('portefeuille déclaré de Jim Simons'))
console.log('Baker Bros et Renaissance : identités collectives et fondateur historique correctement distingués.')

const reviews = JSON.parse(readFileSync(new URL('../public/data/investors/review-metadata.json', import.meta.url), 'utf8'))
assert.deepEqual(reviews.map(row => row.data.identity.slug).sort(), INVESTORS.map(([slug]) => slug).sort())
for (const review of reviews) {
  const stored = JSON.parse(readFileSync(new URL(`../public/data/investors/${review.data.identity.slug}.json`, import.meta.url), 'utf8'))
  assert.equal(review.data.snapshot.periodEnd, stored.data.snapshot.periodEnd)
  assert.equal(review.as_of, stored.as_of)
  assert(!('holdings' in review.data.snapshot))
}
console.log('Calendrier : métadonnées synchronisées pour tous les investisseurs, sans charger leurs positions.')

// All named observations must follow the current holdings after a refresh.
const readPortfolio = slug => normalizePortfolio(JSON.parse(readFileSync(new URL(`../public/data/investors/${slug}.json`, import.meta.url), 'utf8')))
const fallbackRows = [
  { issuerName: 'Leader nouveau', ticker: 'NEW', weight: .65 },
  { issuerName: 'Autre nouvelle entreprise', ticker: 'OTHER', weight: .35 },
]
const oldNames = /Micron|TSMC|Sandisk|Howard Hughes|Microsoft|Brookfield|Vista Energy|Warrior Met Coal|Transocean|Moody’s|Incyte|Lam Research|Alphabet/
const hooks = new Set(), observations = new Set()
for (const [slug] of INVESTORS) {
  const portfolio = readPortfolio(slug), before = JSON.stringify(portfolio)
  const editorial = portfolioEditorial(portfolio), tweet = buildTweet(portfolio)
  assert.equal(JSON.stringify(portfolio), before, 'La rédaction ne modifie pas les données')
  assert(!/undefined|NaN|\\n/.test(tweet))
  assert(!tweet.includes('📄 Positions issues') && !tweet.includes('🔍 Ce qui distingue'))
  assert(tweet.includes(dateFR(portfolio.snapshot.periodEnd)))
  for (const row of editorial.top) assert(tweet.includes(percentage(row.weight)))
  assert(editorial.question.endsWith('?'))
  hooks.add(editorial.hook); observations.add(editorial.explanation)
  const refreshed = { ...portfolio, holdings: fallbackRows }
  const changed = portfolioEditorial(refreshed)
  assert(!oldNames.test(changed.explanation), `${slug}: anciennes positions retirées du commentaire`)
  assert(changed.explanation.includes('100,0 %'), `${slug}: nouvelle concentration prise en compte`)
  assert(buildTweet(refreshed).includes('65,0 %'))
}
assert.equal(hooks.size, INVESTORS.length)
assert.equal(observations.size, INVESTORS.length)
const ackman = readPortfolio('ackman')
assert(buildTweet(ackman).includes('Microsoft et Amazon aux côtés'))
assert(buildTweet(ackman).includes('57,9 %'))
const refreshedAckman = { ...ackman, holdings: ackman.holdings.filter(row => row.ticker !== 'BN') }
assert(!portfolioEditorial(refreshedAckman).explanation.includes('Brookfield'))
const renaissanceEditorial = portfolioEditorial(readPortfolio('renaissance'))
assert(renaissanceEditorial.hook.includes('2\u202f970 positions'))
assert(renaissanceEditorial.explanation.includes('8,1 %'))
const concentrated = portfolioEditorial(make(fallbackRows))
assert(/65,0 %.*contre 35,0 %/.test(concentrated.explanation))
const near = portfolioEditorial(make([{ issuerName: 'A', ticker: 'A', weight: .28 }, { issuerName: 'B', ticker: 'B', weight: .277 }, { issuerName: 'C', ticker: 'C', weight: .1 }]))
assert(near.explanation.includes('presque à égalité'))
const memory = readPortfolio('aschenbrenner')
const reducedMemory = { ...memory, holdings: memory.holdings.map(row => ['MU', 'SNDK'].includes(row.ticker) ? { ...row, weight: .005 } : row).sort((a,b) => b.weight - a.weight) }
assert(!portfolioEditorial(reducedMemory).explanation.includes('stockage et la mémoire'))
console.log(`${hooks.size} accroches et commentaires personnels : données courantes, disparition des anciennes lignes et changements de poids vérifiés.`)
