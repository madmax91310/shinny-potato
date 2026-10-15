import { QUALIFIED_METRICS } from './qualified-exposure-metrics.js'
const LABELS = {
  modelOad: ['Duration ajustée des options', 'ans', 'Elle décrit la sensibilité aux taux, pas la durée pendant laquelle tu dois conserver tes parts.'],
  yieldToWorst: ['Rendement actuariel au pire', '%', 'C’est une mesure du portefeuille obligataire, pas une promesse de rendement pour tes parts.'],
  twelveMonTrlYld: ['Distributions sur les douze derniers mois', '%', 'Ce taux décrit les distributions passées ; il ne représente ni la performance totale ni les revenus futurs.'],
  priceEarnings: ['PER du portefeuille', 'fois', 'Il dépend des bénéfices retenus par l’émetteur et ne suffit pas à dire si cet ETF est bon marché.'],
}
export function metricCopy(isin) {
  const metrics = QUALIFIED_METRICS[isin] ?? {}
  const key = Object.keys(LABELS).find(k => Number.isFinite(metrics[k]?.value) && metrics[k].value >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(metrics[k].asOf ?? '') && metrics[k].sourceUrl)
  if (!key) return ''
  const m=metrics[key], [label,unit,note]=LABELS[key]
  return `${label} : ${m.value.toLocaleString('fr-FR',{maximumFractionDigits:2})} ${unit} au ${m.asOf.split('-').reverse().join('/')}. ${note}`
}
