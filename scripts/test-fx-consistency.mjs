import assert from 'node:assert/strict'
import annualFx from '../src/data/annual-fx.json' with { type: 'json' }
import monthlyFx from '../src/data/monthly-fx.json' with { type: 'json' }
import { EUR_USD, euroReturn } from '../src/data/duel-assets.js'

// One ECB file feeds two registries: the annual year-end rate must be the final December
// observation of the monthly registry, and the duels must read it from there, with no table of
// their own.
assert.equal(annualFx.currency, 'USD per EUR')
let compared = 0
for (const [year, row] of Object.entries(annualFx.years)) {
  const december = monthlyFx.months[`${year}-12`]
  if (!december) continue
  assert.equal(row.value, december.rates.USD, `${year} : taux annuel ${row.value} ≠ dernière observation de décembre ${december.rates.USD}`)
  assert.equal(row.asOf.slice(0, 7), `${year}-12`)
  compared++
}
assert.ok(compared >= 20, `Années comparées : ${compared}`)
assert.deepEqual(Object.keys(EUR_USD).sort(), Object.keys(annualFx.years).sort(), 'Les duels ne gardent aucun taux de change en dur')
// A USD return converted to EUR follows the year-end rates: +10 % in USD with a 10 % stronger
// euro leaves 0 % in EUR.
const item = { currency: 'USD', values: [], calendarReturns: { 2024: 10 } }
const expected = ((1.1) * EUR_USD[2023] / EUR_USD[2024] - 1) * 100
assert.ok(Math.abs(euroReturn(item, 2024) - expected) < 1e-9)
// Cross rates (currencies without an ECB reference) are derived from two official series and
// must stay recomputable from the stored observations; the ECB month-end itself is untouched.
// Exact decimal arithmetic makes the contract independent of Python/JS binary ties.
function crossValue(a,b) {
 const decimal=n=>{const [whole,fraction='']=String(n).split('.');return [BigInt(whole+fraction),10n**BigInt(fraction.length)]}
 const [x,sx]=decimal(a),[y,sy]=decimal(b),den=sx*sy,num=x*y*10000n
 return Number((2n*num+den)/(2n*den))/10000
}
assert.equal(crossValue(33.06,1.3275),43.8872)
let crossMonths = 0
for (const [currency, info] of Object.entries(monthlyFx.derived ?? {})) {
  assert.ok(/^https:\/\/(fred\.stlouisfed\.org|www\.federalreserve\.gov)\//.test(info.sourceUrl), `${currency} : source du taux croisé non officielle`)
  assert.equal(info.secondarySourceUrl, monthlyFx.sourceUrl)
  for (const [month, row] of Object.entries(info.observations)) {
    assert.ok(row.asOf.startsWith(month), `${currency} ${month} : observation hors du mois`)
    assert.equal(monthlyFx.months[month]?.rates?.[currency], crossValue(row.perUsd,row.usdPerEur), `${currency} ${month} : taux publié ≠ produit des deux séries`)
    assert.equal(row.value,monthlyFx.months[month]?.rates?.[currency])
    assert.ok(row.asOf <= monthlyFx.months[month].asOf, `${currency} ${month} : le jour commun ne peut pas dépasser le dernier jour BCE`)
    crossMonths++
  }
}
console.log(`Change : ${compared} taux annuels BCE identiques à la dernière observation de décembre ; conversion des duels vérifiée ; ${crossMonths} mois de taux croisés recomposés.`)

// Different Fed and ECB month ends must not create a mixed-date TWD/USD rate.
const {monthlyCurrencyFactor,historyInCurrency}=await import('../src/data/history-currency.js')
const fixture={sourceUrl:'https://www.ecb.europa.eu/reference',months:{'2026-09':{asOf:'2026-09-30',rates:{EUR:1,USD:1.25,JPY:180,TWD:33}}},derived:{TWD:{sourceUrl:'https://www.federalreserve.gov/h10',observations:{'2026-09':{asOf:'2026-09-29',value:33,perUsd:30,usdPerEur:1.1,ecbRates:{EUR:1,USD:1.1,JPY:165}}}}}}
assert.equal(monthlyCurrencyFactor('2026-09','TWD','USD',fixture),1.1/33)
assert.equal(monthlyCurrencyFactor('2026-09','TWD','JPY',fixture),165/33)
assert.equal(monthlyCurrencyFactor('2026-09','EUR','USD',fixture),1.25)
assert(Math.abs(monthlyCurrencyFactor('2026-09','USD','TWD',fixture)*monthlyCurrencyFactor('2026-09','TWD','USD',fixture)-1)<1e-14)
const converted=historyInCurrency({currency:'TWD',points:[{date:'2026-09',price:3300}]},'USD',undefined,undefined,fixture)
assert.equal(converted.points[0].price,110)
assert.equal(converted.fxSourceUrls.length,2)
assert.match(converted.methodNote,/mêmes dates/)
const legacy=structuredClone(fixture);delete legacy.derived.TWD.observations['2026-09'].ecbRates
assert.equal(monthlyCurrencyFactor('2026-09','TWD','USD',legacy),1.1/33)
assert.throws(()=>monthlyCurrencyFactor('2026-09','TWD','JPY',legacy),/absent/)
console.log('Mixed-date TWD cross refused; same-day USD/JPY, reverse conversion and source labels passed.')
