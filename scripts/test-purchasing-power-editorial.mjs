import assert from 'node:assert/strict'
import { buildTweetText, purchasingPowerStory, computeBrut, computePoste, fmtEUR } from '../src/pages/purchasing-power/lib.js'
let count = 0
for (let startYear = 2010; startYear <= 2025; startYear++) {
  for (const amount of [100, 500, 1000, 5000]) {
    for (const [mode, posteId] of [['brut', null], ['erosion', null], ['par-poste', 'loyer'], ['par-poste', 'alimentation'], ['par-poste', 'carburant']]) {
      const state = { amount, startYear, mode, posteId }, d = purchasingPowerStory(state), text = buildTweetText(state)
      const original = mode === 'par-poste' ? computePoste(amount, startYear, posteId) : computeBrut(amount, startYear)
      assert.equal(d.factor, original.factor)
      assert.ok(text.includes(fmtEUR(d.endAmount)))
      assert.ok(text.includes(d.observation))
      assert.doesNotMatch(text, /Repère INSEE|panier personnel|budget peut évoluer|NaN|undefined/)
      count++
    }
    for (const [mode, posteId] of [['brut', null], ['par-poste', 'alimentation']]) {
      const state = { amount, startYear, mode, posteId }, price = purchasingPowerStory(state).pricePct
      for (const growthPct of [-20, price - 1, price, price + 1, 50]) {
        const d = purchasingPowerStory({ ...state, growthPct }), text = buildTweetText({ ...state, growthPct })
        assert.ok(text.includes(fmtEUR(d.testedAmount)))
        assert.match(text, growthPct === price ? /exactement|autant/ : growthPct > price ? /davantage/ : /moins|augmenté davantage/)
        if (growthPct < price) assert.doesNotMatch(text, /ton budget progresse davantage|ton revenu a davantage/)
        count++
      }
    }
  }
}
for (const growthPct of [NaN, Infinity, -100, -101]) assert.throws(() => purchasingPowerStory({ amount: 100, startYear: 2020, mode: 'brut', growthPct }))
const salary = buildTweetText({ amount: 2000, startYear: 2020, mode: 'brut' })
assert.ok(salary.includes(fmtEUR(2200)) && salary.includes(fmtEUR(2385)))
const food = buildTweetText({ amount: 300, startYear: 2020, mode: 'par-poste', posteId: 'alimentation' })
assert.ok(food.includes(fmtEUR(360)) && food.includes(fmtEUR(376)))
const energy = buildTweetText({ amount: 150, startYear: 2020, mode: 'par-poste', posteId: 'carburant' })
assert.ok(energy.includes(fmtEUR(179)) && energy.includes(fmtEUR(241)) && energy.includes(fmtEUR(62)))
console.log(`${count} scénarios éditoriaux : données conservées, comparaisons et conclusions vérifiées.`)
