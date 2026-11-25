import { downloadPublicationBlob } from '../../design-system/downloadBlob.js'
import { getIndexComparisonComposition } from '../../data/index-comparison-composition.js'
import { getIndexComparisonEditorial } from '../../data/index-comparison-editorial.js'
import { asIndexComparisonPair } from '../../data/index-comparison-pairs.js'
import { renderComparisonPaper, comparisonPercent } from '../../design-system/comparisonPaper.js'
import { getIndexComparisonPerformance } from '../../data/index-comparison-performance.js'
import { fmtPct } from './lib.js'
export const getIndexImageFacts = getIndexComparisonComposition

export function getIndexPaperCards(family) {
  family = asIndexComparisonPair(family)
  const editorial = getIndexComparisonEditorial(family)
  const performance = getIndexComparisonPerformance(family)
  const year = performance[0].years.findLast(year => performance.every(row => Number.isFinite(row.calendarReturns[year])))
  return family.indices.map((index,i)=>{
    const facts = getIndexImageFacts(index)
    const count = facts?.count ?? facts?.targetCount
    const sections = [['PAYS','countries'],['SECTEURS','sectors']].map(([title,field])=>({ title,kind:field,
      evidence:facts?.asOf?`Indice · ${facts.asOf.split('-').reverse().join('/')}`:null,
      rows:(facts?.[field] ?? []).filter(([label])=>!/autres|other/i.test(label)).slice(0,3)
        .map(([label,value])=>({label:label.replace(/^[^\p{L}\p{N}]+/u,''),value:comparisonPercent(value)})) }))
    const series = performance[i]
    if (year && series.currency) sections.push({
      title: `PERFORMANCE · ${series.currency}`,
      rows: [{ label: `${year} · ${series.method}`, value: fmtPct(series.calendarReturns[year]) }],
    })
    return {
      name:(index.indexFacts?.index ?? index.name).replace(' (rappel, non-PEA)', '').replace(' (PEA)', '').replace('Émergents global (indice ESG)', 'Émergents ESG'),
      subtitle:'', summary:editorial.visualPoints[i].join('\n'),
      metric:Number.isFinite(count)?{value:count.toLocaleString('fr-FR')}:null,
      metricLabel:Number.isFinite(facts?.count)?'Titres':'Sociétés visées', metricIcon:'globe',
      sections,
    }
  })
}
export async function renderIndexImage(family) {
  return renderComparisonPaper(getIndexPaperCards(family))
}
export async function downloadIndexImage(family) {
  const canvas = await renderIndexImage(family)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Impossible de générer le PNG')
  downloadPublicationBlob(blob, `comparateur-indices-${asIndexComparisonPair(family).pairId}.png`)
}
