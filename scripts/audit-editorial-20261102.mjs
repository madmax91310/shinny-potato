// Capture des textes complets réellement produits, sans écrire dans les registres.
import { writeFileSync } from 'node:fs'
import { EDITORIAL_WEEK } from '../src/data/editorial-calendar.js'
import { SHEETS } from '../src/pages/factsheet-tweets/data.js'
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js'
import { ETFS } from '../src/data/etf-cards.js'
import { buildText } from '../src/pages/etf-sheets/lib.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { buildTweetText as comparison } from '../src/pages/etf-tweets/lib/tweetFormat.js'
import { ALL_PROFILES } from '../src/pages/dca-profiles/data.js'
import { buildTweetText as dca } from '../src/pages/dca-profiles/lib.js'
import { BUDGET_PROFILES } from '../src/pages/budget-profiles/data.js'
import { buildBudgetText } from '../src/pages/budget-profiles/lib.js'
import { FACTS } from '../src/pages/market-facts/data.js'
import { buildTweetText as fact } from '../src/pages/market-facts/lib.js'
import { TOPICS } from '../src/pages/practical-sheets/data.js'
import { buildSheet, buildTweet as practical } from '../src/pages/practical-sheets/lib.js'
import { buildManualPortfolio, renderTweetText } from '../src/pages/portfolio-generator/engine.js'
import { buildRanking, buildTweet as ranking } from '../src/pages/performance-rankings/engine.js'
import { derive, buildTweetText as calculator } from '../src/pages/investment-calculator/lib.js'
import { buildPerformanceDepuisText, buildPerformanceDepuisComparatifText } from '../src/pages/tweet-midi/engines/performance.js'
import { buildAnniversaireText } from '../src/pages/tweet-midi/engines/anniversaire.js'
import { QUESTIONS } from '../src/pages/hey-grok/data.js'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { readFileSync, readdirSync } from 'node:fs'
import { normalizePortfolio, buildTweet as investor } from '../src/pages/investor-portfolio/data.js'
import { INVESTOR_MODELS } from '../src/data/investor-models.js'
import { modelPortfolio } from '../src/pages/investor-portfolio/models.js'
import { BROKERS, buildTweet as broker } from '../src/pages/broker-comparator/data.js'
const texts = [], refusals = []
const add = (family, id, generate) => {
  try { texts.push({ family, id, text: generate() }) }
  catch (error) { refusals.push({ family, id, reason: error.message }) }
}
for (const s of SHEETS.filter(s => !s.compositionOnly)) add('indices', s.id, () => buildFactsheetTweet(s))
for (const e of ETFS) add('fiches-etf', e.id, () => buildText(e))
for (const t of DEFAULT_THEMES) add('comparatif', t.id, () => comparison(t))
for (const p of ALL_PROFILES) add('dca', p.id, () => dca(p))
for (const p of BUDGET_PROFILES) add('budget', p.id, () => buildBudgetText(p))
for (const f of FACTS) add('faits', f.id, () => fact(f))
for (const t of TOPICS) add('pratique', t.id, () => practical(buildSheet(t.id)))
for (const q of QUESTIONS) add('grok', q.id, () => q.text)
for (const t of TWEETS) add('banque', t.id, () => t.text)
for (const name of readdirSync(new URL('../public/data/investors/',import.meta.url)).filter(n=>n.endsWith('.json') && !['manifest.json','review-metadata.json'].includes(n))) add('investisseur',name,()=>investor(normalizePortfolio(JSON.parse(readFileSync(new URL('../public/data/investors/'+name,import.meta.url))))))
for (const model of INVESTOR_MODELS) add('investisseur',model.id,()=>investor(modelPortfolio(model.id)))
const holdings=[.4,.2,.15,.1,.1,.05].map((weight,i)=>({weight,issuerName:`Entreprise ${i}`,ticker:`TEST${i}`}))
add('investisseur','synthetique-six-lignes',()=>investor({identity:{slug:'test',displayName:'Gestionnaire de test'},snapshot:{periodEnd:'2026-06-30',holdings},holdings}))
for (let i=0;i<BROKERS.length;i++) for(let j=i+1;j<BROKERS.length;j++) add('courtier',`${BROKERS[i].id}-${BROKERS[j].id}`,()=>broker([BROKERS[i].id,BROKERS[j].id]))
for (const [id, rows] of Object.entries({ simple:[['msci_world',100]], complexe:[['msci_world',40],['sp500',20],['or',20],['bitcoin',10],['fonds_euros',10]], court:[['bitcoin',100]], negatif:[['oblig_eur_long_ishares',100]] })) {
  add('generateur', id, () => renderTweetText(buildManualPortfolio(rows.map(([id,pct])=>({id,pct})), 'generaliste', [])))
}
for (const mode of ['lump','dca']) for (const assetId of ['bitcoin','apple','msciWorld']) for (const startYear of [2020,2025]) {
  const s={assetId,mode,startYear,startMonth:1,amountRaw:'1000',overridePriceRaw:'',currency:'native'}
  add('calculateur',`${assetId}-${mode}-${startYear}`,()=>calculator(s,derive(s)))
}
for (const customEnd of ['50','100','200']) {
  const s={assetId:'custom',mode:'lump',startYear:2025,startMonth:1,amountRaw:'1000',customStart:'100',customEnd,customLabel:'un support personnalisé au nom particulièrement long'}
  add('calculateur',`personnalise-${customEnd}`,()=>calculator(s,derive(s)))
}
for (const year of [2020,2025]) {
  add('performance',`simple-${year}`,()=>buildPerformanceDepuisText({assetId:'apple',year}))
  add('performance',`comparatif-${year}`,()=>buildPerformanceDepuisComparatifText({mode:'comparatif',assetIdA:'apple',assetIdB:'microsoft',year}))
}
for (const yearsBack of [1,5,10]) for (const level of ['100','100000']) add('anniversaire',`${yearsBack}-${level}`,()=>buildAnniversaireText({assetId:'bitcoin',yearsBack},level))
for (const [name, instrumentType] of [['actions','EQUITY'],['fonds','ETF']]) for (const years of [1,3]) {
  const assets=[10,-20].map((value,i)=>({id:`a${i}`,label:`Support ${i} au nom particulièrement long`,shortLabel:`Support ${i}`,instrumentType,isin:`test${i}`,basis:'fund-nav',frequency:'annual',currency:'USD',years:{2023:value,2024:value,2025:value}}))
  add('classement',`${name}-${years}`,()=>ranking(buildRanking(assets,{mode:'period',start:`${2025-years}-12`,end:'2025-12'}),'Sélection manuelle'))
}
const world=SHEETS.find(s=>s.id==='acwi')
for(const [id,countries,holdings] of [['partiel',[['Japon',40]],[]],['sans-majorite',[['Japon',60],['États-Unis',40]],[['APPLE',1]]]]) add('indices',id,()=>buildFactsheetTweet({...world,countries,holdings}))
const output={base:process.env.AUDIT_BASE ?? null,calendar:EDITORIAL_WEEK,texts,refusals}
if (process.argv[2]) writeFileSync(process.argv[2],JSON.stringify(output,null,2)+'\n')
console.log(JSON.stringify({texts:texts.length,refusals,families:Object.fromEntries([...new Set(texts.map(t=>t.family))].map(f=>[f,texts.filter(t=>t.family===f).length]))},null,2))
