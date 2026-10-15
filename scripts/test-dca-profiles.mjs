import assert from 'node:assert/strict'
import { PROFILES } from '../src/pages/dca-profiles/data.js'
import { buildTweetText, pickUnseenProfile } from '../src/pages/dca-profiles/lib.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'
assert.equal(PROFILES.length, 100)
assert.equal(new Set(PROFILES.map(profile => profile.id)).size, 100)
for (const profile of PROFILES) {
  assert(profile.age >= 18 && profile.age <= 65)
  assert(profile.lines.length >= 2 && profile.lines.length <= 5, `${profile.id} : 2 à 5 lignes attendues`)
  const broadEquity = new Set(['world', 'allworld', 'acwi', 'sp500'])
  assert(profile.lines.some(line => !broadEquity.has(line.asset)), `${profile.id} : exposition complémentaire attendue`)
  assert(profile.monthly > 0 && profile.monthly <= profile.income * .25, profile.id)
  assert(profile.lines.every(line => Number.isInteger(line.amount) && line.amount > 0 && line.label && line.emoji))
  assert.equal(profile.monthly, profile.lines.reduce((total, line) => total + line.amount, 0))
  assert.equal(new Set(profile.lines.map(line => line.asset)).size, profile.lines.length)
  const tweet = buildTweetText(profile)
  assert(!tweet.includes('(profil fictif)'))
  const ending = /^[AEÉÈÊIÎOÔUÙY]/i.test(profile.name) ? `d’${profile.name}` : `de ${profile.name}`
  assert(tweet.endsWith('Pas un conseil financier'))
  assert(tweet.includes(`Que pensez-vous du DCA ${ending} ? 👇`))
  assert(!/Les versements suivent|Ses versements suivent|photographie|L’évolution réelle/.test(tweet))
  assert(!tweet.includes('undefined'))
}
const julien = PROFILES[0]
assert.equal(julien.monthly, 500)
assert.equal(julien.lines.reduce((sum, line) => sum + line.amount, 0), 500)
assert(buildTweetText(julien).includes('3200€'))
let current = julien
const seen = new Set([current.id])
const cycle = new Set(seen)
for (let index = 1; index < PROFILES.length; index++) {
  const next = pickUnseenProfile(PROFILES, current.id, seen, () => .5)
  assert(!cycle.has(next.id))
  seen.add(next.id); cycle.add(next.id); current = next
}
assert.equal(cycle.size, 100)
assert.notEqual(pickUnseenProfile(PROFILES, current.id, seen, () => 0).id, current.id)
assert(TOOLS.some(tool => tool.to === '/le-dca-de' && tool.status === 'disponible'))
assert(HOME_TOOLS.some(tool => tool.to === '/le-dca-de'))
const added = PROFILES.slice(30, 50)
assert.equal(added.length, 20)
assert.equal(added.filter(profile => profile.monthly > 1000).length, 5)
assert.equal(Math.max(...PROFILES.map(profile => profile.monthly)), 2200)
assert(new Set(added.flatMap(profile => profile.lines.map(line => line.asset))).size >= 25)
console.log('100 profils DCA : budgets, format, navigation et tirage sans répétition validés.')

const extension = PROFILES.slice(50)
assert.equal(extension.length, 50)
assert.equal(new Set(PROFILES.map(p => p.name)).size, 100)
assert.equal(new Set(PROFILES.map(p => p.job)).size, 100)
assert(extension.some(p => p.monthly === 50))
assert.equal(extension.filter(p => p.monthly > 1000).length, 9)
assert(new Set(extension.flatMap(p => p.lines.map(l => l.asset))).size >= 30)
assert(extension.every(p => p.lines.length <= 5))

// Les choix ne sont plus déduits du métier ; le catalogue reste varié et stable.
assert.equal(new Set(PROFILES.map(p => p.lines.map(l => `${l.asset}:${l.amount}`).sort().join('|'))).size, 100)
assert(PROFILES.filter(p => !p.lines.some(l => ['world', 'acwi', 'allworld'].includes(l.asset))).length >= 30)
assert(PROFILES.some(p => p.lines.some(l => l.asset === 'nintendo')))
assert(PROFILES.some(p => p.lines.every(l => !['world', 'acwi', 'allworld', 'sp500', 'europe'].includes(l.asset))))
assert(!julien.lines.some(l => ['vinci', 'saintgobain', 'legrand'].includes(l.asset)))
