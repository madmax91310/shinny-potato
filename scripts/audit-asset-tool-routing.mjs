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
import { TOPICS } from '../src/data/practical-sheet-topics.js'
import { CATALOG as DUEL_CATALOG } from '../src/data/duel-assets.js'
import { DISTINCT_ASSET_ISINS } from '../src/data/distinct-asset-selections.js'
import { DISTINCT_PORTFOLIO_CANDIDATES } from '../src/data/distinct-portfolio-assets.js'
import { latestCommonYears } from '../src/data/annual-window.js'
import { RESOURCE_DUEL_CHOICES } from '../src/data/resource-selections.js'
import monthlyReturns from '../src/data/monthly-duel-returns.json' with {type:'json'}

const read = path => JSON.parse(readFileSync(path, 'utf8'))
const now = new Date()
const configs = [...read('scripts/monthly-automation.json').series, ...read('scripts/non-bond-monthly-sources.json').series]
const sources = new Map(configs.map(s => [s.id, s]))
const levels = {...read('src/data/anniversary-levels.json'), ...read('src/data/non-bond-levels.json')}
const simulations = new Set(read('src/data/simulation-links.json'))
const catalog = read('src/pages/dca-profiles/catalog.json')
const fullSources = read('scripts/dca-complete-holdings-sources.json')
// Why an asset shown in a sheet, a comparison or a DCA profile still has no automatic history.
const qualification = read('scripts/source-snapshots/monthly-qualification-status.json')
const metadataStatus = read('src/data/instrument-metadata-status.json')
const listingCandidates = new Set(read('scripts/listing-candidates.json').candidates.map(c => c.isin))
const COLLECTABLE = { XPAR:'.PA', XAMS:'.AS', XETR:'.DE', XLON:'.L', ETFP:'.MI', XSWX:'.SW' }
const GENERATOR_YEARS = 6
const CURATED_NAV = new Set(RESOURCE_DUEL_CHOICES.map(([, isin]) => isin))
function historyBlocker(isin, histories, completeYears) {
  // Deliberate: curated resource ETCs keep their issuer NAV calendar in the Duels only.
  if (CURATED_NAV.has(isin) && completeYears >= 3) return {code:'curated-duel', detail:'Choix éditorial : rendement officiel (VL) dans les Duels ; pas de second calendrier de marché dans le Générateur'}
  if (histories.length) return completeYears < GENERATOR_YEARS ? {code:'history-short', detail:`${completeYears} année(s) complète(s) ; ${GENERATOR_YEARS} requises en génération automatique`} : null
  const listings = INSTRUMENT_LISTINGS_BY_ISIN[isin] ?? []
  const status = qualification[isin]
  if (status?.status === 'failed' || status?.status === 'pending') return {code:'qualification-failed', detail:status.reason ?? 'Qualification non aboutie'}
  if (!listings.length) {
    const errors = metadataStatus[isin]?.errors ?? []
    return {code:'no-listing', detail:[listingCandidates.has(isin) ? 'Cotations candidates déclarées, en attente du document émetteur' : 'Aucune cotation documentée ni candidate', ...errors.map(e => `${new URL(e.sourceUrl).host} : ${e.error}`)].join(' · ')}
  }
  if (!listings.some(l => COLLECTABLE[l.mic] && ['EUR','USD'].includes(l.currency) && l.evidenceId)) return {code:'listing-not-collectable', detail:listings.map(l => `${l.mic}/${l.currency}${l.evidenceId ? '' : ' sans preuve'}`).join(', ')}
  return {code:'collection-pending', detail:'Cotation documentée ; série en attente de la prochaine collecte mensuelle'}
}
const used = new Set(PROFILES.flatMap(p => Object.keys(p.riskCombos).flatMap(r => getRecipes(p.id, r).flatMap(recipe => recipe.assets.flatMap(slot => slot.idOptions ?? [slot.id])))))
const coverage = new Map(catalogCoverage(references, now).map(r => [r.isin, r]))
const histories = Object.entries(ASSETS)
const errors = []
// Every collected exact-share series must keep its source, identity and real destinations.
for (const [id, asset] of Object.entries(ETF_MONTHLY_HISTORIES)) {
  const source = sources.get(id)
  if (!source || source.isin !== asset.isin || source.currency !== asset.currency) errors.push(`${id}: source/identity mismatch`)
  if (!ASSET_ORDER.includes(id) || (getAnnualReturnStartYears(id).length > 0 && !simulations.has(id))) errors.push(`${id}: historical consumer missing`)
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
  const candidate = DISTINCT_PORTFOLIO_CANDIDATES.find(a=>a.isin===e.isin)
  const qualifiedYears = candidate ? latestCommonYears([monthlyReturns[e.isin]?.years ?? {}],{minimum:1}) : []
  const completeYears = latestCommonYears([monthlyReturns[e.isin]?.years ?? {}],{minimum:1}).length
  const generator = portfolio.some(a => used.has(a.id) && !a.manualOnly) ? 'automatic' : portfolio.length ? 'manual' : 'missing'
  const blocker = generator === 'missing' && (ETFS.some(a => a.isin === e.isin) || DEFAULT_THEMES.some(t => t.etfs.some(a => a.isin === e.isin)) || refs.length) ? historyBlocker(e.isin, h, completeYears) : null
  return {...e, practical:TOPICS.filter(t=>t.products?.includes(e.isin)).map(t=>t.id), duel:DUEL_CATALOG.some(a=>a.isin===e.isin),
    qualification:candidate ? {completeYears:qualifiedYears,minimumDuel:3,minimumGenerator:6,reason:qualifiedYears.length<3?'Historique de la part trop court pour les duels et le générateur':qualifiedYears.length<6?'Historique utilisable en manuel ; six années communes requises en génération automatique':'Historique suffisamment long ; contrôles de construction et de risque maintenus'} : null,
    sheet:ETFS.some(a => a.isin === e.isin), comparison:DEFAULT_THEMES.some(t => t.etfs.some(a => a.isin === e.isin)),
    generator, blocker,
    dca:refs.length > 0, countries:exposure('countries'), sectors:exposure('sectors'),
    holdings:holdings ? {...holdings, automatic:Boolean(fullSources[e.isin])} : null, monthly,
    historyCandidate:!h.length && (INSTRUMENT_LISTINGS_BY_ISIN[e.isin] ?? []).some(l => l.symbol && l.evidenceId),
    decision:refs.length || h.length || ETFS.some(a => a.isin === e.isin) || portfolio.length ? 'keep-used' : 'review-unused'}
}).sort((a,b) => a.isin.localeCompare(b.isin))
const summary = {instruments:rows.length, sheets:rows.filter(r=>r.sheet).length, comparisons:rows.filter(r=>r.comparison).length,
  practical:rows.filter(r=>r.practical.length).length, duels:rows.filter(r=>r.duel).length,
  generatorAutomatic:rows.filter(r=>r.generator==='automatic').length, dca:rows.filter(r=>r.dca).length,
  fullExposure:rows.filter(r=>r.countries.status==='available' && r.sectors.status==='available').length,
  outsideExposure:rows.filter(r=>r.countries.status==='not-applicable' && r.sectors.status==='not-applicable').length,
  automaticHistories:Object.keys(ETF_MONTHLY_HISTORIES).length,
  historyCandidates:rows.filter(r=>r.historyCandidate).length, unused:rows.filter(r=>r.decision==='review-unused').length,
  blockers:Object.fromEntries(['no-listing','listing-not-collectable','qualification-failed','collection-pending','history-short','curated-duel'].map(code => [code, rows.filter(r => r.blocker?.code === code).length]))}
const report = {checkedAt:now.toISOString(), summary, errors, rows}
if (process.argv.includes('--write')) {
  const selected=rows.filter(r=>DISTINCT_ASSET_ISINS.includes(r.isin))
  writeFileSync('docs/distinct-asset-routing.json',JSON.stringify({summary:{assets:selected.length},rows:selected},null,2)+'\n')
  writeFileSync('docs/asset-tool-routing.json', JSON.stringify(report,null,2)+'\n')
  const mark = v => v ? 'Oui' : '—'
  const BLOCKER_LABELS = {'no-listing':'Sans cotation', 'listing-not-collectable':'Cotation non collectable', 'qualification-failed':'Qualification échouée', 'collection-pending':'Collecte en attente', 'history-short':'Historique court', 'curated-duel':'Choix éditorial (Duels)'}
  const blocked = Object.entries(summary.blockers).filter(([,n]) => n).map(([code,n]) => `${BLOCKER_LABELS[code]} : ${n}`).join(' · ') || 'aucun'
  const exposureLabel = v => ({available:'Oui', 'not-applicable':'Sans objet', incomplete:'Partiel', missing:'Absent'}[v.status])
  const table = rows.map(r => `| ${r.name.replaceAll('|','/')} | ${r.isin} | ${mark(r.sheet)} | ${mark(r.comparison)} | ${r.generator} | ${exposureLabel(r.countries)} / ${exposureLabel(r.sectors)} | ${r.holdings?.complete ? 'Complète' : r.holdings ? 'Partielle' : '—'} | ${mark(r.monthly.some(h=>h.performance))} / ${mark(r.monthly.some(h=>h.simulation))} / ${mark(r.monthly.some(h=>h.anniversary))} | ${r.blocker ? `${BLOCKER_LABELS[r.blocker.code]} — ${r.blocker.detail.replaceAll('|','/')}` : '—'} |`).join('\n')
  writeFileSync('docs/asset-tool-routing.md', `# Raccordements par actif et par outil\n\nGénéré le ${now.toISOString().slice(0,10)} par \`node scripts/audit-asset-tool-routing.mjs --write\`. Le JSON associé contient les sources automatiques, dates, devises et motifs détaillés.\n\n« Sans objet » ne signifie pas donnée manquante. « Complète » décrit la table collectée, pas la possibilité de calculer un recouvrement intégral : identification, fraîcheur et compatibilité restent contrôlées par le moteur. Un candidat historique possède une cotation documentée, mais sa série doit encore passer la collecte et les contrôles. Les actifs utilisés sont conservés.\n\nActifs présentés sans historique automatique (${blocked}) : la colonne « Blocage » donne la cause relevée et ce qui est attendu.\n\n| Actif | ISIN | Fiche | Comparatif | Générateur | Pays / secteurs | Positions | Performance / Simulation / Anniversaire | Blocage |\n|---|---|---|---|---|---|---|---|---|\n${table}\n`)
}
console.log(JSON.stringify({summary,errors}))
if(errors.length)process.exitCode=1
