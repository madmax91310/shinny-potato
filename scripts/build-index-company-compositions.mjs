// Compact derived data. Full portfolios stay in the canonical holdings register.
import { writeFileSync } from 'node:fs'
import { SHEETS } from '../src/data/index-factsheets.js'
import { INSTRUMENT_FACTS_BY_ISIN } from '../src/data/instrument-facts.js'
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import holdings from '../src/data/dca-complete-holdings.json' with { type: 'json' }
import holdingsStatus from '../src/data/dca-holdings-status.json' with { type: 'json' }
import observations from '../src/data/index-company-observations.json' with { type: 'json' }
import qualified from '../src/data/index-company-qualified.json' with { type: 'json' }
import config from './index-company-sources.json' with { type: 'json' }
import identities from '../src/data/index-company-identities.json' with { type: 'json' }
import { calculateConcentration, retainQualifiedComposition } from '../src/data/index-concentration-core.js'

const output = {}
const labelRows = rows => rows.map(row => [row.label ?? row.name, row.weightPct])
const missing = reason => ({ available: false, reason })
for (const definition of [...SHEETS, ...config.additionalIndices.map(c => ({ ...c, title: c.name }))]) {
  const id = definition.id, extra = config.additionalIndices.find(row => row.id === id)
  const original = extra ? observations[id]?.facts : definition.indexFacts
  output[id] = missing('Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact.')
  // Index tables first: the three one-security-per-company universes are qualified
  // by their own index rules; every line also needs its reviewed ISIN.
  if (extra && original) {
    const rows = original.holdings.map(([name, weightPct]) => ({ name, weightPct, isin: config.reviewedSecurityLabels[name] }))
    const record = { rows, asOf: original.asOf, sourceUrl: original.source.url, checkedAt: original.source.checkedAt, sha256: original.source.sha256,
      complete: false, topCompaniesCertified: extra.singleSecurityPerCompany === true }
    const result = calculateConcentration(record, identities)
    output[id] = { ...result, asOf: original.asOf, checkedAt: original.source.checkedAt, sourceUrl: original.source.url, sourceLabel: original.source.label,
      approximation: false, method: extra.method, methodologyUrl: extra.methodologyUrl, refresh: observations[id]?.status }
    output[id].visualFacts = original
    if (id === 'msci-korea') output[id].reason = 'La fiche MSCI Korea publie dix titres, soit neuf entreprises après regroupement des deux catégories Samsung Electronics. Le dixième émetteur ne peut pas être déterminé. MSCI Korea 20/35 est un autre indice.'
    continue
  }
  const proxy = config.physicalProxies[id]
  if (!proxy) continue
  const full = holdings[proxy.isin], fund = AUTOMATED_ETF[proxy.isin]
  const observed = fund?.characteristics
  const facts = INSTRUMENT_FACTS_BY_ISIN[proxy.isin] ?? { benchmark: observed?.index, replicationMethod: observed?.replicationMethod, characteristicsSource: { url: observed?.sourceUrl, checkedAt: observed?.checkedAt } }
  try {
    if (observed?.index !== proxy.observedBenchmark || !/^(Physical|Physique|Physisch|Direct Replication \(physically\))/.test(observed?.replicationMethod ?? '')) throw new Error('Le benchmark ou la réplication actuellement collectés ont changé : qualification à revoir')
    if (facts?.benchmark !== proxy.benchmark || !/^(Physical|Physique|Physisch|Direct Replication \(physically\))/.test(facts.replicationMethod ?? '')) throw new Error('Benchmark exact ou réplication physique non confirmé')
    if (full?.basis !== 'fund' || full.complete !== true) throw new Error('Composition physique complète absente')
    if (full.rows.some(row => INSTRUMENT_FACTS_BY_ISIN[row.isin]?.replicationMethod)) throw new Error('Fonds sous-jacent présent : transparisation de même date exigée')
    // A single composition date for all three bands and the concentration visual.
    if (!['countries','sectors'].every(key => fund?.[key]?.asOf === full.asOf && fund[key].rows?.length)) throw new Error('Dates des positions, pays et secteurs incompatibles ; aucun mélange de photographies')
    const record = { ...full, checkedAt: full.checkedAt ?? holdingsStatus[proxy.isin]?.lastSuccessAt }
    const result = calculateConcentration(record, identities)
    if (!result.available) throw new Error(result.reason)
    output[id] = { ...result, sourceRowCount: full.rows.length, asOf: full.asOf, checkedAt: record.checkedAt,
      sourceUrl: full.sourceUrl, sourceLabel: INSTRUMENTS_BY_ISIN[proxy.isin]?.name ?? proxy.isin, sourceIsin: proxy.isin,
      identitySourceUrl: facts.characteristicsSource.url, identityCheckedAt: facts.characteristicsSource.checkedAt,
      observedIdentitySourceUrl: observed.sourceUrl, observedIdentityCheckedAt: observed.checkedAt,
      approximation: true, method: `Positions d’un ETF physique suivant exactement ${proxy.benchmark}. Poids publiés rapportés à l’actif total, sans renormalisation. Liquidités et écarts de réplication inclus dans le reste.`,
      refresh: holdingsStatus[proxy.isin],
      visualFacts: { asOf: full.asOf, countries: labelRows(fund.countries.rows), sectors: labelRows(fund.sectors.rows),
        holdings: result.top.map(row => [row.name, row.weightPct]), source: { url: full.sourceUrl, checkedAt: record.checkedAt },
        // A fund's security count is never presented as the index's count.
        constituents: null, targetConstituents: null }
    }
  } catch (error) { output[id] = missing(error.message) }
}
const failures = []
for (const [id, candidate] of Object.entries(output)) {
  const previous = qualified[id]?.companies
  output[id] = retainQualifiedComposition(candidate, previous)
  if (!candidate.available && previous?.available) failures.push({ id, field: 'company-composition', error: candidate.reason })
  if (process.argv.includes('--apply') && candidate.available && (!previous || candidate.asOf >= previous.asOf)) {
    const record = qualified[id] ??= {}
    record.companies = candidate
    ;(record.companiesHistory ??= {})[candidate.asOf] ??= candidate
  }
}
if (process.argv.includes('--apply')) writeFileSync(new URL('../src/data/index-company-qualified.json', import.meta.url), JSON.stringify(qualified, null, 2) + '\n')
const reportAt = process.argv.indexOf('--report')
if (reportAt >= 0) writeFileSync(process.argv[reportAt + 1], JSON.stringify({ errors: failures, successes: Object.keys(output).filter(id => output[id].available).map(id => ({ id })) }) + '\n')
writeFileSync(new URL('../src/data/index-company-compositions.json', import.meta.url), JSON.stringify(output) + '\n')
console.log(`Concentration: ${Object.values(output).filter(row => row.available).length}/${Object.keys(output).length} indices qualifiés`)
