// Audit the consumers, not just the presence of a source or an ETF factsheet.
import { readFileSync, writeFileSync } from 'node:fs'
import { ETFS } from '../src/data/etf-cards.js'
import { DEFAULT_THEMES } from '../src/data/etf-themes.js'
import { ASSETS as PORTFOLIO } from '../src/data/portfolio-assets.js'
import { PROFILES } from '../src/pages/portfolio-generator/theses.js'
import { getRecipes } from '../src/pages/portfolio-generator/recipes.js'
import { ASSETS, ASSET_ORDER } from '../src/data/market-history.js'
import { getAnnualReturnStartYears, getValidYearsBackOptions } from '../src/pages/tweet-midi/data/marketHistory.js'
import { references } from '../src/pages/dca-profiles/engine.js'
import { catalogCoverage } from '../src/pages/dca-profiles/verification.js'
import { INSTRUMENT_LISTINGS_BY_ISIN } from '../src/data/instrument-listings.js'
import { ETF_MONTHLY_HISTORIES } from '../src/data/etf-monthly-history.js'

const read = path => JSON.parse(readFileSync(path, 'utf8'))
const now = new Date()
const configs = [...read('scripts/monthly-automation.json').series, ...read('scripts/non-bond-monthly-sources.json').series]
const sources = new Map(configs.map(s => [s.id, s]))
const levels = {...read('src/data/anniversary-levels.json'), ...read('src/data/non-bond-levels.json')}
const simulations = new Set(read('src/data/simulation-links.json'))
const catalog = read('src/pages/dca-profiles/catalog.json')
const fullSources = read('scripts/dca-complete-holdings-sources.json')
const used = new Set(PROFILES.flatMap(p => Object.keys(p.riskCombos).flatMap(r => getRecipes(p.id, r).flatMap(recipe => recipe.assets.flatMap(slot => slot.idOptions ?? [slot.id])))))
const coverage = new Map(catalogCoverage(references, now).map(r => [r.isin, r]))
const histories = Object.entries(ASSETS)
const errors = []
// Every collected exact-share series must keep its source, identity and real destinations.
for (const [id, asset] of Object.entries(ETF_MONTHLY_HISTORIES)) {
  const source = sources.get(id)
  if (!source || source.isin !== asset.isin || source.currency !== asset.currency) errors.push(`${id}: source/identity mismatch`)
  if (!ASSET_ORDER.includes(id) || !simulations.has(id) || !getAnnualReturnStartYears(id).length) errors.push(`${id}: historical consumer missing`)
  if (asset.anniversaryPoints?.length && (!source?.collectAnniversary || levels[id]?.isin !== asset.isin)) errors.push(`${id}: anniversary collection missing`)
}
const instruments = new Map()
for (const e of ETFS) instruments.set(e.isin, {isin:e.isin, name:e.name, kind:'etf'})
for (const e of Object.values(catalog)) if (e.isin && !instruments.has(e.isin)) instruments.set(e.isin, {isin:e.isin, name:e.name, kind:e.kind})
for (const [,e] of histories) if (e.isin && !instruments.has(e.isin)) instruments.set(e.isin, {isin:e.isin, name:e.label, kind:e.instrumentType})
const rows = [...instruments.values()].map(e => {
  const h = histories.filter(([,a]) => a.isin === e.isin)
  const refs = Object.entries(catalog).filter(([,a]) => a.isin === e.isin)
  const c = coverage.get(e.isin)
  const exposure = field => !c ? {status:'missing'} : c[field].outside >= 99.5 ? {status:'not-applicable', reason:c[field].reason} : {status:c[field].coverage >= 99.5 ? 'available' : 'incomplete', ...c[field]}
  const portfolio = PORTFOLIO.filter(a => a.isin === e.isin)
  const monthly = h.map(([id,a]) => ({id, automatic:sources.has(id), first:a.points[0]?.date, last:a.points.at(-1)?.date, currency:a.currency,
    performance:getAnnualReturnStartYears(id).length > 0, simulation:simulations.has(id), anniversary:Boolean(a.anniversaryPoints?.length && levels[id] && getValidYearsBackOptions(id,now).length)}))
  const holdings = refs.find(([,a]) => a.holdings)?.[1].holdings
  return {...e, sheet:ETFS.some(a => a.isin === e.isin), comparison:DEFAULT_THEMES.some(t => t.etfs.some(a => a.isin === e.isin)),
    generator:portfolio.some(a => used.has(a.id) && !a.manualOnly) ? 'automatic' : portfolio.length ? 'manual' : 'missing',
    dca:refs.length > 0, countries:exposure('countries'), sectors:exposure('sectors'),
    holdings:holdings ? {...holdings, automatic:Boolean(fullSources[e.isin])} : null, monthly,
    historyCandidate:!h.length && (INSTRUMENT_LISTINGS_BY_ISIN[e.isin] ?? []).some(l => l.symbol && l.evidenceId),
    decision:refs.length || h.length || ETFS.some(a => a.isin === e.isin) || portfolio.length ? 'keep-used' : 'review-unused'}
}).sort((a,b) => a.isin.localeCompare(b.isin))
const summary = {instruments:rows.length, sheets:rows.filter(r=>r.sheet).length, comparisons:rows.filter(r=>r.comparison).length,
  generatorAutomatic:rows.filter(r=>r.generator==='automatic').length, dca:rows.filter(r=>r.dca).length,
  fullExposure:rows.filter(r=>r.countries.status==='available' && r.sectors.status==='available').length,
  outsideExposure:rows.filter(r=>r.countries.status==='not-applicable' && r.sectors.status==='not-applicable').length,
  automaticHistories:Object.keys(ETF_MONTHLY_HISTORIES).length,
  historyCandidates:rows.filter(r=>r.historyCandidate).length, unused:rows.filter(r=>r.decision==='review-unused').length}
const report = {checkedAt:now.toISOString(), summary, errors, rows}
if (process.argv.includes('--write')) {
  writeFileSync('docs/asset-tool-routing.json', JSON.stringify(report,null,2)+'\n')
  const mark = v => v ? 'Oui' : '—'
  const exposureLabel = v => ({available:'Oui', 'not-applicable':'Sans objet', incomplete:'Partiel', missing:'Absent'}[v.status])
  const table = rows.map(r => `| ${r.name.replaceAll('|','/')} | ${r.isin} | ${mark(r.sheet)} | ${mark(r.comparison)} | ${r.generator} | ${exposureLabel(r.countries)} / ${exposureLabel(r.sectors)} | ${r.holdings?.complete ? 'Complète' : r.holdings ? 'Partielle' : '—'} | ${mark(r.monthly.some(h=>h.performance))} / ${mark(r.monthly.some(h=>h.simulation))} / ${mark(r.monthly.some(h=>h.anniversary))} |`).join('\n')
  writeFileSync('docs/asset-tool-routing.md', `# Raccordements par actif et par outil\n\nGénéré le ${now.toISOString().slice(0,10)} par \`node scripts/audit-asset-tool-routing.mjs --write\`. Le JSON associé contient les sources automatiques, dates, devises et motifs détaillés.\n\n« Sans objet » ne signifie pas donnée manquante. « Complète » décrit la table collectée, pas la possibilité de calculer un recouvrement intégral : identification, fraîcheur et compatibilité restent contrôlées par le moteur. Un candidat historique possède une cotation documentée, mais sa série doit encore passer la collecte et les contrôles. Les actifs utilisés sont conservés.\n\n| Actif | ISIN | Fiche | Comparatif | Générateur | Pays / secteurs | Positions | Performance / Simulation / Anniversaire |\n|---|---|---|---|---|---|---|---|\n${table}\n`)
}
console.log(JSON.stringify({summary,errors}))
if(errors.length)process.exitCode=1
