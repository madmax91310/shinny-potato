import { modelAllocationRows } from '../../data/investor-model-classes.js'
import { MODEL_ASSET_CLASSES, investorModel, modelNatureLabel } from '../../data/investor-models.js'

export function modelPortfolio(slug) {
  const model = investorModel(slug)
  if (!model) throw new Error('Allocation modèle inconnue.')
  return normalizeModel(model)
}

export function normalizeModel(model) {
  if (!['published-model', 'educational-adaptation'].includes(model.nature)
    || !Number.isFinite(model.denominator) || model.denominator <= 0 || !Array.isArray(model.rows) || !model.rows.length
    || !model.sourceUrls?.length || model.sourceUrls.some(url => new URL(url).protocol !== 'https:')
    || !model.publication?.trim() || !model.locator?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(model.checkedAt)) {
    throw new Error('Cette allocation ne dispose pas de preuves et de cibles exploitables.')
  }
  const ids = new Set()
  let total = 0
  for (const row of model.rows) {
    if (!MODEL_ASSET_CLASSES[row.classId] || ids.has(row.classId) || !Number.isFinite(row.units) || row.units <= 0) {
      throw new Error('Une classe d’actifs ou sa pondération est invalide.')
    }
    ids.add(row.classId); total += row.units
  }
  if (Math.abs(total - model.denominator) > 1e-9) throw new Error('Les cibles ne totalisent pas 100 %.')
  return { kind: 'model', model,
    identity: { slug: model.id, displayName: model.name, entityName: model.author, archetype: 'published-allocation', dataProvider: 'Publication' },
    snapshot: { periodEnd: null }, filingHistory: [], fetchedAt: null, sourceUrl: model.sourceUrls[0],
    holdings: modelAllocationRows(model),
  }
}

export function buildModelTweet(portfolio, intro, percentage) {
  const { model, holdings } = portfolio
  return [model.hook,
    '👤 La méthode\n' + (intro?.trim() || model.intro),
    '🧭 ' + modelNatureLabel(model) + '\n' + model.publication,
    '⚖️ Répartition cible\n' + holdings.map(row => '• ' + row.issuerName + ' : ' + percentage(row.weight)).join('\n'),
    model.denominator === 12 ? 'Chaque composante vaut exactement 1/12 ; les pourcentages affichés sont arrondis.' : '',
    '🔍 Comment elle fonctionne\n' + model.method,
    model.scope,
    'À garder en tête : ' + model.caution,
    '💬 ' + model.question,
    'Pas un conseil financier.',
  ].filter(Boolean).join('\n\n')
}
