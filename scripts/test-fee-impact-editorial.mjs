import assert from 'node:assert/strict'
import { buildTweetText, computeComparison, fmtEUR } from '../src/pages/fee-impact/lib.js'
import { AMOUNT_PRESETS, DURATION_PRESETS, RETURN_PRESETS, FEE_LEVELS } from '../src/pages/fee-impact/data.js'
import { FEE_COMPARISON_ASSETS } from '../src/data/fee-comparison-assets.js'

const base = { amount: 300, years: 25, returnRate: 7, fee1: 0.2, fee2: 1.5 }
const text = buildTweetText(base)
assert.equal(Math.round(computeComparison(base).ecart), 41686)
assert(text.startsWith(`💸 ${fmtEUR(41686)} de moins après 25 ans`))
assert(text.includes(fmtEUR(227608)) && text.includes(fmtEUR(185922)))
assert(text.includes('Dans les deux cas, tu as versé ' + fmtEUR(90000)))
assert.match(text, /gains manqués/)
assert.equal(buildTweetText({...base, fee1: base.fee2, fee2: base.fee1}).split('\n')[0], text.split('\n')[0])
assert.match(buildTweetText({...base, amount: 500, years: 20, fee2: 0.5}), /ça semble presque pareil/)
assert.match(buildTweetText({...base, amount: 100, years: 10}), /Tu investis/)
assert.match(buildTweetText({...base, fee2: 0.2}), /capitaux simulés sont identiques/)
assert.doesNotMatch(buildTweetText({...base, fee2: 0.2}), /gains manqués|de moins/)
assert.match(buildTweetText({...base, amount: 0.01, years: 1}), /inférieur à 1 €/)
assert.doesNotMatch(buildTweetText({...base, returnRate: 0}), /gains manqués/)
assert(buildTweetText({...base, punchline: ' Ma phrase. '}).includes('\nMa phrase.\n'))
const funds = FEE_COMPARISON_ASSETS.slice(0, 2)
const fundText = buildTweetText({...base, isin1: funds[0].isin, isin2: funds[1].isin, fee1: funds[0].fee, fee2: funds[1].fee})
for (const fund of funds) assert(fundText.includes(fund.name) && fundText.includes(fund.evidence.sourceUrls[0]))
assert.match(fundText, /sans comparer leurs performances réelles/)

let count = 0
for (const amount of AMOUNT_PRESETS) for (const years of DURATION_PRESETS) for (const returnRate of RETURN_PRESETS) {
  for (const f1 of FEE_LEVELS) for (const f2 of FEE_LEVELS) {
    const state = {amount, years, returnRate, fee1: f1.value, fee2: f2.value}
    const result = computeComparison(state)
    // Independent ordinary-annuity formula checks effective annual compounding.
    const capital = fee => {
      const rate = ((1+returnRate/100)*(1-fee/100))**(1/12)-1
      return rate === 0 ? amount*years*12 : amount*((1+rate)**(years*12)-1)/rate
    }
    assert(Math.abs(result.capital1-capital(f1.value)) < 1e-6)
    assert(Math.abs(result.capital2-capital(f2.value)) < 1e-6)
    const tweet = buildTweetText(state)
    assert.doesNotMatch(tweet, /NaN|undefined|Quand je vois ça|Tu connais celui/)
    assert.match(tweet, /Hypothèse de rendement constant/)
    assert.match(tweet, /Tu connais le montant des frais annuels/)
    if (f1.value !== f2.value) assert(tweet.split('\n')[0].includes(fmtEUR(result.ecart)))
    count++
  }
}
console.log(`Impact des frais : ${count} variantes, calculs indépendants, égalités, frais inversés, ETF sourcés et textes validés.`)

// Envelope fees collected from the insurance registry add to the support fee.
{
  const { ENVELOPE_FEES, envelopeFeeOption } = await import('../src/data/envelope-fees.js')
  const { effectiveFees } = await import('../src/pages/fee-impact/lib.js')
  const contract = ENVELOPE_FEES.find(option => option.fee > 0)
  assert(contract && contract.sourceUrl.startsWith('https://') && contract.checkedAt, 'Au moins un contrat avec frais sur UC sourcés')
  assert.equal(envelopeFeeOption('').fee, 0); assert.equal(envelopeFeeOption('inconnu').fee, 0)
  const withEnvelope = { ...base, envelope2: contract.id }
  assert.deepEqual(effectiveFees(withEnvelope), { fee1: base.fee1, fee2: Math.round((base.fee2 + contract.fee) * 1000) / 1000 })
  assert.equal(computeComparison(withEnvelope).capital2, computeComparison({ ...base, fee2: base.fee2 + contract.fee }).capital2)
  const envelopeText = buildTweetText(withEnvelope)
  assert.match(envelopeText, /frais d’enveloppe/)
  assert(envelopeText.includes(contract.contract) && envelopeText.includes(contract.sourceUrl))
  assert.doesNotMatch(buildTweetText(base), /enveloppe/)
  console.log(`Impact des frais : ${ENVELOPE_FEES.length - 1} contrats d’assurance-vie proposés comme frais d’enveloppe.`)
}
