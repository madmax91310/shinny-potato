import assert from 'node:assert/strict'
import { buildTweetText, derive, fmtEUR, fmtPct, pct } from '../src/pages/investment-calculator/lib.js'
import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS } from '../src/data/market-history.js'

const state = { assetId: 'bitcoin', amountRaw: '1000', mode: 'lump', startYear: 2020, startMonth: 1, overridePriceRaw: '' }
const conclusion = (s, d) => buildTweetText(s, d).split('\n').find(line => line.startsWith('📌'))
const question = (s, d) => buildTweetText(s, d).split('\n').find(line => line.startsWith('💬'))
const bitcoin = derive(state)
assert.match(conclusion(state, bitcoin), /suppose d’avoir conservé le placement de janvier 2020 à/)
assert.ok(!buildTweetText(state, bitcoin).includes('Livret A'))
assert.match(question(state, bitcoin), /gardé tes bitcoins.*vendu une partie/)
assert.match(buildTweetText(state, bitcoin), /🚀 Performance :/)
const monthly = { ...bitcoin, effectiveMode: 'dca', result: { ...bitcoin.result, totalInvested: 2000, finalValue: 2500 } }
assert.match(conclusion(state, monthly), /l’ensemble des versements.*somme investie dès le départ/)
assert.match(buildTweetText(state, monthly), /Gain rapporté aux sommes versées : \+25,0 %/)
assert.match(question(state, monthly), /maintenu tes versements dans le Bitcoin/)
assert.ok(!conclusion(state, monthly).includes('sans versement supplémentaire'))
const monthlyLoss = {...monthly, result:{...monthly.result, finalValue:1500}}
assert.match(buildTweetText(state, monthlyLoss), /Perte rapportée aux sommes versées : -25,0 %/)
assert.match(conclusion(state, monthlyLoss), /n’aurait donc pas évité une perte/)
assert.match(question(state, monthlyLoss), /malgré cette perte/)
const overridden = { ...state, overridePriceRaw: '100' }
assert.match(conclusion(overridden, bitcoin), /prix final saisi/)
assert.match(conclusion(overridden, monthly), /versements jusqu’en septembre 2026/)
const sp = { ...state, assetId: 'sp500' }
const spGain = { ...bitcoin, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 2449 } }
assert.match(conclusion(sp, spGain), /sans versement supplémentaire/)
assert.match(question(sp, spGain), /sur cet indice.*réparti les achats/)
assert.match(conclusion(sp, { ...bitcoin, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 750 } }), /n’aurait pas suffi à retrouver/)
assert.match(question(sp, { ...bitcoin, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 750 } }), /Face à cette baisse/)
assert.match(conclusion(sp, { ...bitcoin, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 1000.1 } }), /sans gain ni perte au dollar près/)
const euro = { ...state, assetId: 'custom', customLabel: 'Mon placement' }
const example = { ...bitcoin, isCustom: true, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 1090 }, livretA: { finalValue: 1120 } }
assert.match(conclusion(euro, example), /Mon placement termine en hausse.*en dessous du Livret A simulé/)
assert.match(question(euro, example), /gardé cette somme sur un Livret A/)
assert.match(conclusion(euro, { ...example, result: { ...example.result, finalValue: 750 } }), /termine en baisse/)
assert.match(conclusion(euro, { ...example, result: { ...example.result, finalValue: 1120.1 } }), /même montant à l’euro près/)
assert.match(conclusion(euro, { ...example, result: { ...example.result, finalValue: 1300 } }), /deux prix saisis/)

// Exercise actual asset coverage, forced lump modes, currencies and historical endpoints.
let count = 0
for (const assetId of Object.keys(ASSETS)) for (const mode of ['lump','dca']) {
  const asset = ASSETS[assetId]
  const [year, month] = asset.points[0].date.split('-').map(Number)
  const s = {...state, assetId, mode, startYear:Math.max(year,2020), startMonth:year>=2020?month:1}
  const d = derive(s)
  const text = buildTweetText(s,d)
  assert.doesNotMatch(text,/undefined|NaN|Tu as commencé avec|Tu as du Bitcoin en portefeuille/)
  assert(text.includes(fmtEUR(d.result.finalValue,asset.currency)))
  assert(text.includes(fmtEUR(d.result.totalInvested,asset.currency)))
  assert(text.includes(fmtPct(pct(d.result.finalValue,d.result.totalInvested))))
  assert(!conclusion(s,d).includes(fmtEUR(d.result.finalValue,asset.currency)))
  if (asset.currency==='USD') assert(!text.includes('Livret A'))
  if (d.effectiveMode==='dca') {
    assert.match(text, /(?:Gain|Perte) rapporté[e]? aux sommes versées/)
    assert(text.split('\n')[0].includes('par mois'))
  } else {
    assert.match(text,/Performance :/)
    assert(!text.split('\n')[0].includes('par mois'))
  }
  if (INCONSISTENT_MONTHLY_DATA_IDS.has(assetId)) assert.equal(d.effectiveMode,'lump')
  count++
}
console.log(`Conclusions : ${count} scénarios réels, gains/pertes, DCA, prix saisi, devises, indices et Livret A vérifiés.`)
