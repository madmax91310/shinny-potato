import assert from 'node:assert/strict'
import { PROFILES } from '../src/pages/dca-profiles/data.js'
import { buildTweetText, pickUnseenProfile } from '../src/pages/dca-profiles/lib.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'
assert.equal(PROFILES.length, 100)
assert.equal(new Set(PROFILES.map(profile => profile.id)).size, 100)
for (const profile of PROFILES) {
  assert(profile.age >= 18 && profile.age <= 65)
  assert(profile.lines.length >= 2 && profile.lines.length <= 5, `${profile.id} : 2 à 5 lignes attendues`)
  const broadEquity = new Set(['world', 'allworld', 'acwi', 'sp500', 'equalweight'])
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
assert(new Set(added.flatMap(profile => profile.lines.map(line => line.asset))).size >= 12)
console.log('100 profils DCA : budgets, format, navigation et tirage sans répétition validés.')

const extension = PROFILES.slice(50)
assert.equal(extension.length, 50)
assert.equal(new Set(PROFILES.map(p => p.name)).size, 100)
assert.equal(new Set(PROFILES.map(p => p.job)).size, 100)
assert(extension.some(p => p.monthly === 50))
assert.equal(extension.filter(p => p.monthly > 1000).length, 9)
assert(new Set(extension.flatMap(p => p.lines.map(l => l.asset))).size >= 20)
assert(extension.every(p => p.lines.length <= 5))

// Editorial contract: balanced catalogue, broad core and bounded convictions.
assert.equal(PROFILES.filter(p=>p.editorialGroup==='classic').length,50)
assert.equal(PROFILES.filter(p=>p.editorialGroup==='conviction').length,50)
assert.equal(new Set(PROFILES.map(p => p.lines.map(l => `${l.asset}:${l.amount}`).sort().join('|'))).size,100)
const cores=new Set(['world','acwi','allworld','sp500','equalweight'])
const regional=new Set(['europe','emerging','small','russell'])
for(const p of PROFILES){
 assert(cores.has(p.lines[0].asset),p.id)
 assert(p.holdings.every(Number.isInteger),p.id)
 assert.equal(p.holdings.reduce((a,b)=>a+b,0),100,p.id)
 assert(p.lines.every(l=>l.amount%5===0),p.id)
 if(p.lines.length===2)assert(!cores.has(p.lines[1].asset)&&!regional.has(p.lines[1].asset),p.id)
 if(p.monthly<=175)assert.equal(p.lines.length,2,p.id)
 const crypto=p.lines.reduce((sum,l,i)=>sum+(['btc','eth'].includes(l.asset)?p.holdings[i]:0),0)
 assert(crypto<=22,p.id)
 if(p.editorialGroup==='classic')assert(p.holdings[0]>=68,p.id)
}

// Les exports gardent uniquement la structure chiffrée et la question habituelle.
for(const id of ['ines','manon','sophie']) {
 const p=PROFILES.find(p=>p.id===id)
 assert(!buildTweetText(p).includes('actions détenues en direct'),id)
}
