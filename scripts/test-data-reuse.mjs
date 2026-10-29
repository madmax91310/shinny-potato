import assert from 'node:assert/strict'
import { monthlyDrawdown, HISTORY_FACTS, HISTORY_STATISTIC_IDS } from '../src/data/history-statistics.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { CATALOG } from '../src/data/duel-assets.js'
import { buildDuel } from '../src/pages/portfolio-duels/lib.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { FEE_COMPARISON_ASSETS } from '../src/data/fee-comparison-assets.js'
import { buildTweetText as fees, computeComparison } from '../src/pages/fee-impact/lib.js'
import { buildTweetText as factTweet } from '../src/pages/market-facts/lib.js'
import { ALLOCATION_CASES, weightedExposure } from '../src/data/allocation-cases.js'
import { PROFILES } from '../src/pages/portfolio-generator/theses.js'
// Cas fabriqué : baisse de 50 %, nouveau sommet ensuite, récupération six mois après le sommet.
const points = [['2020-01', 100], ['2020-02', 80], ['2020-03', 50], ['2020-04', 75], ['2020-07', 100], ['2020-08', 120]].map(([date, price]) => ({ date, price }))
const drawdown = monthlyDrawdown(points)
assert.equal(drawdown.drawdown, -50)
assert.equal(drawdown.peak.date, '2020-01')
assert.equal(drawdown.trough.date, '2020-03')
assert.equal(drawdown.recovery.date, '2020-07')
assert.equal(drawdown.monthsToRecovery, 6)
assert.equal(monthlyDrawdown(points.slice(0, 4)).recovery, null)
assert.equal(monthlyDrawdown([{ date: '2020-01', price: 100 }, { date: '2020-02', price: 101 }]).drawdown, 0)
assert.throws(() => monthlyDrawdown([{date: '2020-01', price: 0}]))
for (const fact of HISTORY_FACTS) {
  const text = factTweet(fact)
  assert.match(text, /mensuel/)
  assert.match(text, /(?:dividendes|revenus) (?:(?:non|nets|bruts) )?réinvestis/)
  assert.match(text, /(?:Hors|hors) frais(?: du courtier)? et fiscalité/)
  assert(!/NaN|undefined/.test(text))
}
for (const id of ['paypal', 'nvidia']) {
  const fact = HISTORY_FACTS.find(item => item.id === `monthly-drawdown-${id}`)
  assert.equal(fact.family, 'actions-historiques')
  assert.match(fact.note, /dividendes réinvestis et divisions d’actions/)
  assert(!/ETF|Frais du fonds|EQUITY/.test(`${fact.note} ${fact.hook}`))
}
assert.equal(HISTORY_FACTS.length, HISTORY_STATISTIC_IDS.length * 2)
for (const item of ALLOCATION_CASES) {
  assert.equal(item.sources.length, 2)
  assert(item.sources.every(source => source.url.startsWith('https://')))
  assert.match(item.text, /Photographie des indices au \d{4}-\d{2}-\d{2}/)
}
assert.equal(buildDuel(DUELS.find(x => x.id === 'semiconducteurs_monde-contre-blockchain_ishares')).years[0], 2023)
assert.equal(buildDuel(DUELS.find(x => x.id === 'world-avec-quality_dividend')).years[0], 2021)
for (const record of DATA_CATALOG.filter(x => x.type === 'instrument')) {
  assert.equal(record.consumers.some(c => c.path === '/duels-portefeuilles'), CATALOG.some(x => x.isin === record.id))
  assert.equal(record.consumers.some(c => c.path === '/impact-frais'), FEE_COMPARISON_ASSETS.some(x => x.isin === record.id))
}
const a = FEE_COMPARISON_ASSETS.find(x => x.isin === 'FR001400U5Q4')
const b = FEE_COMPARISON_ASSETS.find(x => x.isin === 'IE00BP3QZ601')
const state = { amount: 100, years: 10, returnRate: 7, fee1: a.fee, fee2: b.fee, isin1: a.isin, isin2: b.isin }
assert.match(fees(state), /sans comparer leurs performances réelles/)
assert(fees(state).includes(a.isin) && fees(state).includes(b.isin))
assert.equal(computeComparison({...state, fee2: a.fee}).ecart, 0)
assert.equal(Number(weightedExposure(72.14, 63.59, .5).toFixed(2)), 67.87) // (72,14 + 63,59)/2 arrondi à deux décimales.
assert.equal(Number(weightedExposure(72.14, 0, .2).toFixed(2)), 57.71) // 80 % × 72,14 % + 20 % × 0 %.
const options = new Set(PROFILES.flatMap(p => Object.values(p.riskCombos).flatMap(c => c.assets.flatMap(a => a.idOptions ?? [a.id]))))
for (const id of ['monetaire_xeon', 'oblig_0_1_ishares', 'oblig_global_agg_eur_hedged', 'actions_india_ishares', 'infrastructure_ishares', 'sect_financieres', 'smallcap_monde', 'oblig_hy_ishares_acc', 'oblig_em_local_ishares_acc']) assert(options.has(id), `Option automatique absente : ${id}`)
console.log('Réutilisation : drawdown, récupération, séries courtes, frais, compositions, consommateurs et options automatiques OK.')

// Individual fee source controls reach catalogue and fee-comparison consumers.
const {buildFeeFieldEvidence} = await import('../src/data/fee-field-evidence.js');
const buildEtfTerEvidence = (_isin, record, reference) => buildFeeFieldEvidence(record, reference);
const oldFeeProof = {checkedAt:'2026-10-20',asOf:'2026-10-19',sourceUrl:'https://issuer.test/page'};
const corroboratedFee = {checkedAt:'2026-10-29',asOf:'2026-10-19',sourceAsOf:'2026-09-30',sourceUrl:'https://issuer.test/factsheet.pdf',sha256:'a'.repeat(64),controlMethod:'unchanged-fee-corroboration',observationEvidence:oldFeeProof};
const bundleWithFee = {sourceUrl:'https://issuer.test/unrelated-aum',characteristics:{terPct:.4,checkedAt:'2026-10-30'},characteristicChecks:{terPct:corroboratedFee}};
const referenceFee = {checkedAt:'2026-10-11',sourceUrls:['https://reference.test/profile']};
const feeEvidence = buildEtfTerEvidence('TEST',bundleWithFee,referenceFee);
assert.equal(feeEvidence.checkedAt,'2026-10-29');
assert.deepEqual(feeEvidence.sourceUrls,['https://issuer.test/factsheet.pdf']);
assert.equal(feeEvidence.observationAsOf,'2026-10-19');assert.equal(feeEvidence.asOf,null);assert.equal(feeEvidence.sourceAsOf,'2026-09-30');
assert.deepEqual(feeEvidence.observationEvidence,oldFeeProof);
assert.equal(feeEvidence.dateStatus,'not-published','A document/control date is not a fee effective date');
assert.deepEqual(feeEvidence.referenceSourceUrls,['https://reference.test/profile']);
const missingFeeProof=buildEtfTerEvidence('TEST',{...bundleWithFee,characteristicChecks:{terPct:{asOf:'2026-10-19'}}},referenceFee);
assert.equal(missingFeeProof.checkedAt,null);assert.deepEqual(missingFeeProof.sourceUrls,[]);
assert.equal(buildEtfTerEvidence('TEST',{...bundleWithFee,characteristicChecks:{terPct:oldFeeProof}},referenceFee).checkedAt,'2026-10-20','A later unrelated bundle control cannot renew this fee');
assert.equal(buildEtfTerEvidence('TEST',{characteristics:{checkedAt:'2026-10-12'}},referenceFee).checkedAt,'2026-10-12');
assert.equal(buildEtfTerEvidence('TEST',{},referenceFee).checkedAt,'2026-10-11');

const {readFileSync:readFeeFixture}=await import('node:fs');
const {gunzipSync:unzipFeeFixture}=await import('node:zlib');
const {normalizeEvidence:normalizeFeeEvidence}=await import('../src/data/evidence.js');
const {ETF_TER_EVIDENCE:currentFeeEvidence}=await import('../src/data/etf-ter-evidence.js');
const realFeeObservation=JSON.parse(unzipFeeFixture(readFeeFixture(new URL('./fixtures/characteristic-controls/wisdomtree-cloud-qualified-ci-20261029.json.gz',import.meta.url))));
const realFee=buildEtfTerEvidence('IE00BJGWQN72',realFeeObservation.observation.record);
assert.equal(realFee.checkedAt,'2026-10-29');assert.equal(realFee.observationAsOf,'2026-10-19');assert.equal(realFee.sourceAsOf,'2026-09-30');
assert.deepEqual(realFee.sourceUrls,['https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/IE00BJGWQN72']);
assert.equal(normalizeFeeEvidence(realFee).asOf,null,'No fee effective date inferred from the observation or document');
const catalogueFee=DATA_CATALOG.find(a=>a.id==='IE00BJGWQN72').fields.find(f=>f.label==='Frais annuels (%)');
assert.equal(catalogueFee.metadata.checkedAt,currentFeeEvidence.IE00BJGWQN72.checkedAt);
assert.equal(FEE_COMPARISON_ASSETS.find(a=>a.isin==='IE00BJGWQN72').evidence.checkedAt,currentFeeEvidence.IE00BJGWQN72.checkedAt);
