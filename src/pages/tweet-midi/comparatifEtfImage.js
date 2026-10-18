import { isComparisonEtc } from '../etf-tweets/lib/comparisonPolicy.js'
import { LIFESTRATEGY_RECORDS } from '../../data/lifestrategy.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { getComparisonComposition, COMPOSITION_LABELS, compositionEvidenceLabel } from '../etf-tweets/lib/comparisonComposition.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getPreferredInstrumentListing } from '../../data/instrument-listings.js'
import { getInstrumentPeaStatus } from '../../data/instruments.js'
import { INSTRUMENT_FACTS_BY_ISIN } from '../../data/instrument-facts.js'
import { renderComparisonPaper, comparisonPercent } from '../../design-system/comparisonPaper.js'
export { comparisonLayout } from '../../design-system/comparisonPaper.js'
export { getComparisonComposition as getComparisonImageComposition } from '../etf-tweets/lib/comparisonComposition.js'

function identity(fund) {
  const issuer = fund.nom.match(/^(State Street SPDR|BNP Paribas Easy|WisdomTree|Xtrackers(?: II)?|Vanguard|iShares|Amundi|VanEck|Invesco|L&G|SPDR|Avantis|Global X)\b/)?.[0]
  let name = fund.nom.slice(issuer?.length ?? 0).trim()
    .replace(/\s+UCITS ETF.*$/i, '').replace(/\s+ETF$/i, '')
    .replace(/\s+Swap PEA\b/g, '').replace(/^PEA (?:Monde|Global) \(([^)]+)\)$/, '$1')
  if (!name) name = fund.nom
  const ticker = getPreferredInstrumentListing(fund.isin)?.ticker
  return { name, subtitle: [issuer, ticker].filter(Boolean).join(' · ') }
}
function summary(fund) {
  return fund.differenciateur.replace(/(?:non[ -]éligible\s+|éligible\s+|hors\s+|en\s+)?\bPEA\b(?: selon [^,;]+)?|\bCTO\b/gi, '')
    .replace(/\s+([,;])/g, '$1').replace(/[,;]\s*[,;]/g, ',')
    .replace(/^[\s·,;:|–—-]+|[\s·,;:|–—-]+$/g, '').trim()
}
const observationSection = (title, observation) => ({ title,
  evidence: observation?.asOf ? `Fonds · ${observation.asOf.split('-').reverse().join('/')}` : null,
  rows: [...(observation?.rows ?? [])].sort((a,b)=>b.weightPct-a.weightPct).slice(0,3)
    .map(row=>({label:row.name ?? row.label,value:comparisonPercent(row.weightPct)})) })

export function getComparisonPaperCards(theme) {
  if (!theme?.etfs?.length) throw new Error('Sélection ETF vide')
  return theme.etfs.map(fund => {
    const pea = getInstrumentPeaStatus(fund.isin)
    const sections = []
    const multi = LIFESTRATEGY_RECORDS[fund.isin]
    const automated = AUTOMATED_ETF[fund.isin]
    if (multi) {
      sections.push(observationSection('ACTIONS / OBLIGATIONS', multi.assetAllocation), observationSection('FONDS SOUS-JACENTS', multi.holdings))
    } else if (automated?.commodityAllocation?.rows?.length) {
      sections.push(observationSection('MATIÈRES PREMIÈRES', automated.commodityAllocation))
      sections[0].evidence = `Indice suivi · ${automated.commodityAllocation.asOf.split('-').reverse().join('/')}`
    } else if (!isComparisonEtc(fund)) {
      for (const field of ['countries', 'sectors']) {
        const composition = getComparisonComposition(fund.isin, field)
        if (composition.rows.length) sections.push({ title: field === 'countries' ? 'PAYS' : 'SECTEURS', kind: field,
          evidence: compositionEvidenceLabel(composition),
          rows: composition.rows.map(([label,value])=>({label:COMPOSITION_LABELS[label] ?? label,value:comparisonPercent(value)})) })
      }
    }
    // Rates and individual commodities are not equity portfolios.
    if (!sections.length) {
      const benchmark = INSTRUMENT_FACTS_BY_ISIN[fund.isin]?.benchmark
      if (benchmark) sections.push({ title: 'EXPOSITION', rows: [{ label: benchmark }] })
      if (fund.isCopperEtc && Number.isFinite(automated?.characteristics?.annualSwapRatePct)) {
        sections.push({ title:'SWAP ANNUEL EN SUPPLÉMENT', rows:[{label:'Taux de swap',value:`${automated.characteristics.annualSwapRatePct.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`}] })
      }
    }
    const id = identity(fund)
    let description = summary(fund)
    if (description.startsWith(`${id.name} :`)) description = description.slice(id.name.length+2).trim()
    description = description.charAt(0).toLocaleUpperCase('fr')+description.slice(1)
    return { ...id, metricLabel:'Frais / an', metric:{value:`${fund.frais.replace(/\s*%$/,'')} %`},
      badge:pea === null ? null : pea ? 'PEA' : 'CTO', productType:isComparisonEtc(fund)?'ETC':'ETF', summary:description, sections }
  })
}
export async function renderComparatifEtfImage(theme) {
  return renderComparisonPaper(getComparisonPaperCards(theme))
}
export async function downloadComparatifEtfImage(theme) {
  const canvas = await renderComparatifEtfImage(theme)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Échec de la génération du PNG')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `comparatif-etf-${theme.id}.png`
  document.body.append(link); startPublicationDownload(link); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
