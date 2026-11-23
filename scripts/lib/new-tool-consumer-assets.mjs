import { FAMILIES } from '../../src/data/index-comparisons.js'
import { getIndexComparisonPerformance } from '../../src/data/index-comparison-performance.js'
import { getIndexComparisonComposition } from '../../src/data/index-comparison-composition.js'
import POLICY from '../../src/data/freshness-policy.json' with { type: 'json' }
import WEEKLY_FLOWS from '../../src/data/etf-flows-weekly.json' with { type: 'json' }
import FLOWS from '../../src/data/etf-flows.json' with { type: 'json' }
import PORTFOLIOS from '../../src/pages/public-portfolios/catalogue.json' with { type: 'json' }
import BUNDLED_PORTFOLIOS from '../../src/pages/public-portfolios/initial-feed.json' with { type: 'json' }

export function additionalToolConsumerAssets(workflows, now) {
  const route = path => [{ path }]
  const producers = (...names) => workflows.filter(workflow =>
    names.some(name => workflow.path.endsWith('/' + name)))
    .map(({ path, name, crons }) => ({ path, name, crons }))
  function indexField(key, label, metadata, present, registry, policy) {
    const age = (Date.parse(now) - Date.parse(metadata?.checkedAt)) / 86400000
    const fresh = present && metadata?.sourceStatus === 'documented' && age >= 0 &&
      age <= POLICY.fields[policy].checkDays
    return { key, label, kind: key === 'returns' ? 'history' : 'live', registry,
      state: fresh ? 'scheduled-evidence' : 'blocked',
      checkedAt: metadata?.checkedAt ?? null, asOf: metadata?.asOf ?? null,
      periodStart: metadata?.periodStart ?? null, periodEnd: metadata?.periodEnd ?? null,
      sourceUrls: metadata?.sourceUrls ?? [], currency: metadata?.currency ?? null,
      method: metadata?.method ?? null, scope: metadata?.scope ?? null,
      freshnessPolicyKey: policy, consumers: route('/comparateur-indices'),
      workflows: producers('refresh-automated-index-sheets.yml', 'collect-etf-pilot.yml', 'update-market-monthly.yml'),
      reason: fresh ? null : 'Ventilation ou rendement exact indisponible ou contrôle à renouveler.' }
  }
  const indices = FAMILIES.flatMap(family => getIndexComparisonPerformance(family).map((row, position) => {
    const index = family.indices[position]
    const composition = getIndexComparisonComposition(index)
    const fields = [indexField('returns', 'Rendements annuels comparés', row.metadata,
      row.years.some(year => Number.isFinite(row.calendarReturns[year])), 'src/data/index-returns.js', 'index.returns')]
    if (row.kind === 'indice' || index.indexFacts) {
      for (const [key, label] of [['countries', 'Pays de l’indice'], ['sectors', 'Secteurs de l’indice']]) {
        fields.push(indexField(key, label, index.indexFacts?.metadata,
          Boolean(composition?.[key]?.length), 'src/data/index-facts.js', 'index.facts'))
      }
    }
    return { id: `index-comparison:${family.id}:${row.key}`, name: index.name, type: 'index', fields }
  }))
  const portfolioProducers = producers('refresh-public-portfolios.yml')
  const portfolios = PORTFOLIOS.map(portfolio => {
    const entry = BUNDLED_PORTFOLIOS.entries.find(item => item.catalogueId === portfolio.id)
    return { id: 'public-portfolio:' + portfolio.id, name: portfolio.pseudo ?? portfolio.id, type: 'portfolio',
      fields: [{ key: 'allocation', label: 'Collecte du relevé public', kind: 'live',
        state: portfolioProducers.length ? 'scheduled-evidence' : 'blocked', registry: 'src/pages/public-portfolios/initial-feed.json',
        checkedAt: entry?.lastSuccessAt || null, asOf: entry?.observation?.effective || null,
        sourceUrls: [portfolio.url], consumers: route('/portefeuilles-publics'),
        workflows: portfolioProducers,
        reason: 'La preuve ci-jointe concerne le flux initial. Le relevé courant provient d’une branche séparée et exige sa propre preuve.' }] }
  })
  const flows = { id: 'etf-flows:weekly-europe', name: 'Flux nets hebdomadaires des ETF européens', type: 'series',
    fields: [{ key: 'net-flows', label: 'Flux nets et périmètre de la publication', kind: 'live', state: 'blocked',
      registry: 'src/data/etf-flows.json', checkedAt: null, asOf: null,
      sourceUrls: [FLOWS.collection.latestCandidate?.url, FLOWS.collection.reviewUrl].filter(Boolean),
      consumers: route('/flux-etf'), workflows: [],
      reason: FLOWS.collection.reason,
      nextAction: 'Qualifier les droits de réutilisation, la définition de l’univers européen et l’accès à une source récurrente.' }] }
  const latest = WEEKLY_FLOWS.editions[0]
  const automatedFlows = { id: 'etf-flows:weekly-us-listed', name: 'Flux nets hebdomadaires des fonds cotés aux États-Unis', type: 'series',
    fields: [{ key: 'net-flows', label: 'Flux nets des fonds, pays et secteurs', kind: 'live',
      state: latest ? 'scheduled-evidence' : 'blocked', registry: 'src/data/etf-flows-weekly.json',
      checkedAt: latest?.validatedAt ?? null, asOf: latest?.sessions.at(-1) ?? null,
      periodStart: latest?.sessions[0] ?? null, periodEnd: latest?.sessions.at(-1) ?? null,
      sourceUrls: latest ? [latest.sources.weekly, ...latest.sources.daily, latest.sources.taxonomy] : [],
      currency: 'USD', scope: 'Univers américain ETFIQ avec relevés vérifiés à chaque séance',
      method: 'Somme des créations et rachats nets quotidiens, classés par exposition ETFIQ pour les pays et secteurs.',
      freshnessPolicyKey: 'etf.weeklyFlows', consumers: route('/flux-etf'), workflows: producers('update-etf-flows.yml'),
      reason: latest ? null : 'Première édition ETFIQ en attente de validation.' }] }
  return [...indices, ...portfolios, flows, automatedFlows]
}

export function indexComparatorFundConsumers(assets) {
  const instruments = new Set(FAMILIES.flatMap(family =>
    family.etfGroups.flatMap(group => (group.funds ?? []).map(fund => fund.isin))))
  const fieldsUsed = new Set(['Frais annuels', 'Frais', 'Éligibilité PEA', 'Identité'])
  return assets.map(asset => !instruments.has(asset.id) ? asset : { ...asset, fields: asset.fields.map(field =>
    fieldsUsed.has(field.label) ? { ...field, consumers: [...(field.consumers ?? []), { path: '/comparateur-indices' }] } : field) })
}
