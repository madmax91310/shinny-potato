import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js'
import { advanceRadar } from './lib/editorial-radar.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const BROKERS = { bourso: 'BoursoBank', bourseDirect: 'Bourse Direct', 'bourse-direct': 'Bourse Direct', saxo: 'Saxo', tradeRepublic: 'Trade Republic', 'trade-republic': 'Trade Republic', tr: 'Trade Republic', xtb: 'XTB', fortuneo: 'Fortuneo', degiro: 'DEGIRO', ibkr: 'Interactive Brokers', interactiveBrokers: 'Interactive Brokers' }
export async function collectObservations(root = ROOT) {
  const observations = [], errors = []
  const load = async path => {
    try { return JSON.parse(await readFile(resolve(root, path), 'utf8')) }
    catch (error) { errors.push({ family: 'radar', entity: path, reason: `Source locale indisponible : ${error.message}` }); return null }
  }
  const add = (base, field, fieldLabel, value, evidence = {}, extra = {}) => {
    if (value === null || value === undefined) return
    observations.push({ ...base, field, fieldLabel, value, ...(evidence.sha256 ? { sourceHash: evidence.sha256 } : {}), sourceUrl: evidence.sourceUrl ?? evidence.source?.url ?? base.sourceUrl, period: evidence.asOf ?? evidence.effectiveAt ?? evidence.referencePeriod ?? evidence.year?.toString() ?? base.period ?? evidence.checkedAt ?? base.checkedAt, checkedAt: evidence.checkedAt ?? evidence.source?.checkedAt ?? base.checkedAt, scope: evidence.scope ?? base.scope, ...extra })
  }
  const etfs = await load('src/data/automated-etf.json')
  for (const [isin, r] of Object.entries(etfs ?? {})) {
    const c = r.characteristics ?? {}, label = INSTRUMENTS_BY_ISIN[isin]?.name ?? `${r.provider ?? 'ETF'} ${isin}`
    const base = { family: 'etf', entity: isin, label, sourceUrl: r.sourceUrl, checkedAt: c.checkedAt, scope: `Part ${isin}`, tool: '/fiches-etf', maxAgeDays: 60 }
    add(base, 'ter', 'Frais annuels', c.terPct, c, { unit: '% / an', priority: 'high', discovery: true, angle: 'À exposition comparable, quelles différences avec les autres ETF disponibles ?', reason: 'Toute modification confirmée des frais annuels est signalée.' })
    if (r.aum) add(base, 'aum', 'Encours', r.aum.amount, r.aum, { scope: `${isin} · ${r.aum.scope} · ${r.aum.currency}`, unit: r.aum.currency, relativeThreshold: .2, reason: 'Variation cumulée de l’encours d’au moins 20 %, même part/fonds et même devise. Ce n’est pas une mesure des flux nets.' })
    for (const field of ['countries', 'sectors']) {
      const block = r[field]
      if (!block?.asOf || !Array.isArray(block.rows) || !block.rows.length) continue
      const basis = block.basis ?? 'fund'
      for (const row of block.rows) add({ ...base, checkedAt: block.checkedAt ?? c.checkedAt }, `${field}:${row.name ?? row.label}`, `${field === 'countries' ? 'Poids du pays' : 'Poids du secteur'} ${row.name ?? row.label}`, row.weightPct, block, { scope: `${isin} · ${basis} · ${block.method ?? field}`, threshold: 2, unit: '%', angle: 'Cette exposition est-elle aussi diversifiée que son nom le laisse penser ?', reason: 'Variation cumulée d’au moins 2 points de pourcentage, même périmètre.' })
    }
    if (r.holdings?.asOf && r.holdings.rows?.length === 10 && r.holdings.basis !== 'substitute-basket') {
      const block = r.holdings
      add({ ...base, checkedAt: block.checkedAt ?? c.checkedAt }, 'top10', 'Poids des dix premières lignes', block.rows.reduce((sum, row) => sum + row.weightPct, 0), block, { scope: `${isin} · ${block.basis ?? 'fund'} · dix lignes publiées`, threshold: 2, unit: '%', reason: 'Variation cumulée d’au moins 2 points des dix premières lignes publiées ; catégories d’actions non regroupées.' })
    }
  }
  const indices = await load('src/data/automated-indices.json')
  for (const [id, record] of Object.entries(indices ?? {})) {
    const f = record.facts
    if (!f?.asOf || !f.source?.url) continue
    const base = { family: 'indices', entity: id, label: f.index ?? id, sourceUrl: f.source.url, checkedAt: f.source.checkedAt, period: f.asOf, scope: `Indice ${f.index ?? id}`, tool: '/tweets-factsheets', maxAgeDays: 90 }
    add(base, 'count', 'Nombre de titres', f.constituents, f, { relativeThreshold: .05, threshold: 10, discovery: true })
    for (const field of ['countries', 'sectors']) for (const [label, weight] of f[field] ?? []) add(base, `${field}:${label}`, `${field === 'countries' ? 'Poids du pays' : 'Poids du secteur'} ${label}`, weight, f, { threshold: 2, unit: '%', angle: 'Que contient vraiment cet indice, et quelle différence avec son concurrent ?' })
    if (f.holdings?.length === 10) add(base, 'top10', 'Poids des dix premières lignes', f.holdings.reduce((sum, row) => sum + row[1], 0), f, { threshold: 2, unit: '%' })
  }
  const economic = await load('src/data/automated-economic.json')
  const savings = Object.values(economic?.savings ?? {}).sort((a, b) => a.effectiveAt.localeCompare(b.effectiveAt)).at(-1)
  if (savings) add({ family: 'epargne', entity: 'livret-a', label: 'Livret A', sourceUrl: savings.sourceUrl, checkedAt: savings.checkedAt, scope: 'Taux réglementé · date d’effet indiquée', tool: '/simulateur-patrimoine' }, 'rate', 'Taux annuel', savings.rate, savings, { unit: '%', priority: 'high' })
  for (const [id, r] of Object.entries(economic?.households ?? {})) add({ family: 'economie', entity: id, label: r.table?.split(' - Lecture')[0].slice(0, 180) ?? id, scope: `${r.population} · ${id}`, tool: '/france-100-menages', maxAgeDays: 400 }, 'value', 'Repère publié', r.value, r, { period: `${r.year}`, rule: 'publication' })
  for (const [id, r] of Object.entries(economic?.benchmarks ?? {})) add({ family: 'epargne', entity: id.split(':')[0], label: id.startsWith('scpi') ? 'SCPI · moyenne du marché' : 'Fonds euros · moyenne du marché', scope: r.method, tool: '/pouvoir-achat', maxAgeDays: 400 }, 'annual', 'Rendement annuel publié', r.value, r, { unit: '%', period: `${r.year}`, rule: 'publication' })
  const regulatory = await load('src/data/automated-regulatory.json')
  for (const [id, r] of Object.entries(regulatory?.sources ?? {})) for (const [field, value] of Object.entries(r.values ?? {})) {
    if (typeof value !== 'number') continue
    add({ family: 'epargne', entity: id, label: r.title ?? id, scope: r.scope ?? 'Régime général', tool: '/fiche-lexique', period: r.publishedAt ?? r.checkedAt }, field, field, value, r, { priority: 'high' })
  }
  const brokers = await load('src/data/automated-broker-tariffs.json')
  for (const [id, r] of Object.entries(brokers?.brokers ?? {})) {
    const base = { family: 'courtiers', entity: id, label: BROKERS[id] ?? id, sourceUrl: r.sourceUrl, checkedAt: r.checkedAt, scope: r.scope ?? `${id} · barème documenté`, tool: '/comparatif-courtiers', priority: 'high' }
    if (r.values && Object.keys(r.values).length) add(base, 'tariff', 'Frais de courtage', r.values, r, { discovery: true, angle: 'Combien coûte le même ordre chez deux courtiers, sur le même marché ?' })
    for (const [field, f] of Object.entries(r.fields ?? {})) {
      if (f.values && Object.keys(f.values).length) add(base, field, field, f.values, f)
    }
    for (const [field, f] of Object.entries(r.profile ?? {})) {
      if (!f.sourceUrl || !['confirmé', 'confirmed'].includes(f.status) || f.available === null || typeof f.available !== 'boolean') continue
      add(base, `profile:${field}`, `Disponibilité du service ${field}`, f.available, f)
    }
  }
  const scpi = await load('src/data/automated-scpi.json')
  for (const r of scpi?.records ?? []) {
    const base = { family: 'scpi', entity: r.id, label: r.name, sourceUrl: r.sourceUrl, checkedAt: r.checkedAt, scope: `SCPI ${r.name}`, tool: '/presentations?famille=scpi' }
    if (r.price) add(base, 'price', 'Prix de souscription', r.price.value, r.price, { unit: '€', priority: 'high', discovery: true, angle: 'Que change ce prix pour les associés et les nouveaux souscripteurs ?' })
    if (r.occupancy) add(base, 'occupancy', 'Taux d’occupation financier', r.occupancy.value, r.occupancy, { threshold: 2, unit: '%' })
    for (const year of (r.annual?.years ?? []).slice().sort((a, b) => a.year - b.year).slice(-1)) add(base, 'distribution', 'Taux de distribution annuel', year.distribution, r.annual, { unit: '%', period: `${year.year}`, rule: 'publication', scope: `${r.name} · taux de distribution annuel` })
    for (const field of ['subscriptionFee', 'managementFee', 'minimum']) add(base, field, field === 'minimum' ? 'Minimum de souscription' : field === 'subscriptionFee' ? 'Frais de souscription' : 'Frais de gestion', r.conditions?.[field], r.conditions ?? {}, { unit: field === 'minimum' ? '€' : '%', scope: `${r.name} · ${field === 'managementFee' ? r.conditions?.managementBasis ?? 'base non précisée' : field}` })
  }
  const insurance = await load('src/data/automated-insurance.json')
  for (const r of insurance?.records ?? []) {
    const base = { family: 'assurance', entity: r.id, label: r.name, sourceUrl: r.sourceUrl, checkedAt: r.checkedAt, scope: `${r.name} · gestion libre`, tool: '/presentations?famille=insurance' }
    for (const [field, label] of Object.entries({ subscription: 'Frais de versement', arbitrage: 'Frais d’arbitrage', units: 'Frais de gestion des unités de compte', etfTrade: 'Frais d’opération ETF' })) add(base, `fees:${field}`, label, r.fees?.[field], r.fees ?? {}, { unit: '%', priority: 'high', discovery: field === 'units' })
    for (const fund of r.euroFunds ?? []) {
      const year = (fund.years ?? []).slice().sort((a, b) => a.year - b.year).at(-1)
      if (year) add(base, `euro:${fund.name}`, `Rendement de ${fund.name}`, year.return, fund, { unit: '%', period: `${year.year}`, rule: 'publication', scope: `${r.name} · ${fund.name} · rendement publié, conditions de la source` })
    }
  }
  const purchasing = await load('src/data/purchasing-power-observations.json')
  for (const [id, value] of Object.entries(purchasing?.prices?.latestLevels ?? {})) {
    const r = purchasing.prices.sources[id]
    add({ family: 'economie', entity: `prices-${id}`, label: r.title, sourceUrl: r.sourceUrl, checkedAt: purchasing.checkedAt ?? r.checkedAt ?? r.sourceUpdatedAt, scope: `${r.seriesId} · base ${purchasing.prices.baseYear} · ${r.scope}`, tool: '/pouvoir-achat' }, 'index', 'Indice des prix publié', value, {}, { period: purchasing.prices.asOf, rule: 'publication' })
  }
  let paths = []
  try { paths = (await readdir(resolve(root, 'public/data/investors'))).filter(path => path.endsWith('.json')) } catch { errors.push({ family: 'investisseurs', entity: '', reason: 'Déclarations 13F indisponibles.' }) }
  for (const path of paths) {
    const payload = await load(`public/data/investors/${path}`), d = payload?.data, s = d?.snapshot, identity = d?.identity
    if (!s?.periodEnd || identity?.archetype !== 'hedge_fund') continue
    // Ignore live prices, derived performance, daily as_of and weight changes.
    const positions = (s.holdings ?? []).filter(r => !r.putCall && r.ticker).map(r => ({ ticker: r.ticker, changePct: Number.isFinite(r.sharesChangePct) ? Math.round(r.sharesChangePct * 100) / 100 : null, isNew: r.isNew === true })).sort((a, b) => a.ticker.localeCompare(b.ticker))
    const exits = (s.quarterChanges?.exits ?? []).filter(r => !r.putCall).map(r => r.ticker ?? r.issuerName).sort()
    const base = { family: 'investisseurs', entity: identity.slug, label: identity.displayName, sourceUrl: d.sourceUrl ?? `https://tracefour.com/trackers/${identity.slug}`, checkedAt: payload.as_of, period: s.periodEnd, scope: 'Déclaration 13F · positions longues publiées, hors options · publication différée', tool: '/portefeuilles-investisseurs' }
    add(base, 'filing', 'Positions et mouvements déclarés', { positions, exits }, {}, { rule: 'publication', priority: 'high', discovery: true, angle: 'Quelles nouvelles positions, sorties et variations du nombre d’actions sont déclarées ? Un changement de poids ne prouve pas un achat ou une vente.' })
  }
  return { observations, errors }
}
export async function run({ statePath, outputDir, now = new Date(), sourceRevision = '' }) {
  let previous = null
  if (statePath) { try { previous = JSON.parse(await readFile(statePath, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error } }
  const { observations, errors } = await collectObservations()
  if (!observations.length || errors.some(error => error.family === 'radar')) throw new Error('Sources locales incomplètes : aucun remplacement de l’historique radar.')
  const result = advanceRadar(previous, observations, { now, errors, sourceRevision })
  await mkdir(outputDir, { recursive: true })
  for (const [name, value] of [['state.json', result.state], ['feed.json', result.feed]]) {
    const path = resolve(outputDir, name)
    await writeFile(`${path}.tmp`, `${JSON.stringify(value, null, 2)}\n`)
    await rename(`${path}.tmp`, path)
  }
  console.log(`Radar : ${result.feed.observationCount} observations, ${result.newEvents.length} nouveaux signaux, ${result.feed.errors.length} réserves.`)
  return result
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), get = key => args[args.indexOf(key) + 1]
  if (!args.includes('--output')) throw new Error('--output obligatoire')
  await run({ statePath: args.includes('--state') ? resolve(get('--state')) : null, outputDir: resolve(get('--output')), sourceRevision: process.env.RADAR_SOURCE_SHA ?? '' })
}
