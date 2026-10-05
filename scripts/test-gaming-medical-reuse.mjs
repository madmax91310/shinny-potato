import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ETFS } from '../src/data/etf-cards.js'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { ASSETS as HISTORY } from '../src/data/market-history.js'
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js'
import { AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js'
import { getInstrumentPeaStatus } from '../src/data/instruments.js'
import { getInstrumentFacts } from '../src/data/instrument-facts.js'
import { getComparisonPerformance } from '../src/pages/tweet-midi/comparisonPerformance.js'
import { buildDuel } from '../src/pages/portfolio-duels/lib.js'
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { CATALOG, euroReturn, EUR_USD } from '../src/data/duel-assets.js'
import { INDEX_DECISION_CASES } from '../src/data/index-decision-cases.js'
import { getIndexFacts } from '../src/data/index-facts.js'
import { SHEETS } from '../src/data/index-factsheets.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
const capture = JSON.parse(readFileSync(new URL('./source-snapshots/gaming-medical-2026-10-05.json', import.meta.url)))
for (const proof of capture.funds) {
 const sheet = ETFS.find(x => x.isin === proof.isin)
 const performance = getInstrumentAnnualPerformance(proof.isin)
 assert.equal(sheet.id, proof.id)
 assert.deepEqual(performance.values, AUTOMATED_PERFORMANCE[proof.isin]?.values ?? proof.values, 'Les rendements du fonds doivent suivre la publication émetteur, sans substitution d’indice')
 assert.equal(performance.currency, 'USD')
 assert.equal(performance.source, AUTOMATED_PERFORMANCE[proof.isin]?.source ?? proof.perfSource)
 assert.equal(getInstrumentPeaStatus(proof.isin), null, 'Le statut PEA absent reste inconnu')
 assert.equal(sheet.pea, null)
 assert.equal(sheet.listing.currency, 'EUR')
 assert.equal(getInstrumentFacts(proof.isin).positionsAsOf, proof.positionsDate)
 assert.equal(getComparisonPerformance(proof.isin).label, 'ETF')
 assert.equal(getComparisonPerformance(proof.isin).referenceIsin, proof.isin)
 const asset = CATALOG.find(x => x.isin === proof.isin)
 const expected = ((1 + performance.values[5] / 100) * EUR_USD[2024] / EUR_USD[2025] - 1) * 100
 assert.ok(Math.abs(euroReturn(asset,2025)-expected)<1e-10, 'Une cotation EUR ne transforme pas les rendements NAV USD en rendements EUR')
 assert.equal(HISTORY[proof.id], undefined, 'Pas de série mensuelle inventée à partir des tableaux annuels')
 const record = DATA_CATALOG.find(x => x.type === 'instrument' && x.id === proof.isin)
 for (const path of ['/fiches-etf','/comparatif-etf','/generateur-portefeuilles','/duels-portefeuilles','/impact-frais']) assert(record.consumers.some(c => c.path === path), `${proof.isin}: ${path}`)
}
assert.equal(buildDuel(DUELS.find(x => x.id === 'emergents-chine')).years[0],2022, 'Ex-China : aucune année avant la première année complète du fonds')
for (const id of ['world-jeux-video','world-innovation-medicale','sante-innovation-biotech','world-immo-infrastructure']) assert.equal(buildDuel(DUELS.find(x => x.id === id)).years[0],2020)
for (const id of ['msci-world-sector-neutral-quality','msci-world-enhanced-value','msci-em-ex-china']) {
 const sheet = SHEETS.find(x => x.id === id)
 assert.deepEqual(sheet.countries,getIndexFacts(id,'2026-09-30').countries)
 assert.equal(sheet.performance.kind,'indice')
 assert.equal(sheet.performance.date,'Années calendaires 2023–2025')
 const text=buildFactsheetTweet(sheet)
 assert.match(text,/performances de l’indice/)
 assert.doesNotMatch(text,/performances de l’ETF|undefined|NaN/)
 assert.equal(sheet.source.length,2,'Composition et rendements gardent leurs références distinctes')
 const record=DATA_CATALOG.find(x=>x.type==='index' && x.id===id)
 if(id!=='msci-world-enhanced-value') assert(record.consumers.some(c=>c.path==='/cas-concrets'))
}
for (const item of INDEX_DECISION_CASES) assert.doesNotMatch(item.text,/undefined|NaN/)
assert.match(INDEX_DECISION_CASES[0].text,/petites capitalisations/)
console.log('Jeux vidéo, innovation médicale et réutilisation : parts exactes, devises, PEA inconnu, périodes communes et compositions d’indice vérifiés.')
