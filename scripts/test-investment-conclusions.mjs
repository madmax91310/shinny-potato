import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import assert from 'node:assert/strict'
import { buildTweetText, derive, fmtEUR, fmtPct, pct } from '../src/pages/investment-calculator/lib.js'
import { ASSETS, INCONSISTENT_MONTHLY_DATA_IDS } from '../src/data/market-history.js'

const state = { assetId: 'bitcoin', amountRaw: '1000', mode: 'lump', startYear: 2020, startMonth: 1, overridePriceRaw: '' }
const monthly = { ...derive(state), effectiveMode: 'dca', result: { totalInvested: 2000, finalValue: 2500 } }
assert.match(buildTweetText(state, monthly), /Gain sur les sommes versées : \+25,0 %/)
assert.match(buildTweetText(state, { ...monthly, result: { totalInvested: 2000, finalValue: 1500 } }), /Perte sur les sommes versées : -25,0 %/)
assert.match(buildTweetText({ ...state, overridePriceRaw: '100' }, monthly), /Au prix final saisi/)
const custom = { ...derive(state), isCustom: true, result: { totalInvested: 1000, finalValue: 1090 }, livretA: { finalValue: 1120 } }
assert.match(buildTweetText({ ...state, assetId: 'custom', customLabel: 'Mon placement' }, custom), /Avec les deux prix saisis/)

// Exercise actual asset coverage, forced lump modes, currencies and historical endpoints.
let count = 0
for (const assetId of Object.keys(ASSETS)) for (const mode of ['lump','dca']) {
  const asset = ASSETS[assetId]
  const [year, month] = asset.points[0].date.split('-').map(Number)
  const s = {...state, assetId, mode, startYear:Math.max(year,2020), startMonth:year>=2020?month:1}
  const start=`${s.startYear}-${String(s.startMonth).padStart(2,'0')}`
  if(!qualifyHistoryWindow(asset,start,asset.points.at(-1).date,{contiguous:false}).qualified){assert.throws(()=>derive(s),/cours reportés/);continue}
  const d = derive(s)
  const text = buildTweetText(s,d)
  assert.doesNotMatch(text,/undefined|NaN|Tu as commencé avec|Tu as du Bitcoin en portefeuille/)
  assert(text.includes(fmtEUR(d.result.finalValue,asset.currency)))
  assert(text.includes(fmtEUR(d.result.totalInvested,asset.currency)))
  assert(text.includes(fmtPct(pct(d.result.finalValue,d.result.totalInvested))))
  assert.doesNotMatch(text, /📌|Cours ajustés|Toute la somme|Le résultat porte|Les premiers achats/)
  assert.match(text, /📈 Capital final :/)
  if (asset.sourceCredit) assert(text.includes(asset.sourceCredit))
  if (asset.currency==='USD') assert(!text.includes('Livret A'))
  if (d.effectiveMode==='dca') {
    assert.match(text, /(?:Gain|Perte) sur les sommes versées/)
    assert(text.split('\n')[0].includes('par mois'))
    assert.match(text, /Tu aurais continué tes achats pendant les baisses/)
    assert.match(text, /Total versé :/)
  } else {
    assert.match(text,/\([+-]?[\d\s,.]+ %\)/)
    assert.doesNotMatch(text, /sur les sommes versées/)
    assert(!text.split('\n')[0].includes('par mois'))
    assert.match(text, /Tu aurais gardé ce placement jusqu’au bout/)
  }
  if (INCONSISTENT_MONTHLY_DATA_IDS.has(assetId)) assert.equal(d.effectiveMode,'lump')
  count++
}
console.log(`Conclusions : ${count} scénarios réels, gains/pertes, DCA, prix saisi, devises, indices et Livret A vérifiés.`)
