import { qualifyExposureClassification } from './exposure-classification.js'
import { frenchCharacteristic } from '../data/french-characteristics.js'

// An undeclared taxonomy is only comparable with the same support. Published
// method + issuer identify a taxonomy conservatively; Sector and SubIndustry
// remain distinct even when their dates and fund/index scope match.
function taxonomy(observation, isin, field) {
  const qualified = qualifyExposureClassification(observation,field)
  if (qualified) return {classificationId:qualified.id,classification:qualified.label}
  const method = observation.method?.trim().replace(/\s+/g, ' ').toLowerCase()
  const issuer = observation.provider || new URL(observation.sourceUrl).hostname
  if (!method) return { classificationId:`${field}:support:${isin}`, classification:'Classification non documentée · support distinct' }
  const classification = /registration country/.test(method) ? 'Pays d’enregistrement'
    : /subindustry/.test(method) ? 'Sous-secteurs de la source'
    : field === 'sectors' ? 'Secteurs de la source' : 'Pays selon la méthode de la source'
  return {classificationId:[field,issuer,method].join(':'),classification}
}

// Des dates ou classifications différentes ne sont jamais fusionnées.
export function portfolioExposure(lines, records, field) {
  if (!['countries', 'sectors'].includes(field) || !lines.length || lines.some(l => !Number.isFinite(l.pct) || l.pct <= 0) || Math.abs(lines.reduce((s,l) => s+l.pct,0)-100) > .01) return []
  const groups = new Map()
  for (const line of lines) {
    const o = records[line.isin]?.[field]
    if (!o || !/^\d{4}-\d{2}-\d{2}$/.test(o.asOf ?? '') || !['fund','index'].includes(o.basis) || !o.sourceUrl || !o.rows?.length) continue
    if (o.rows.some(r => !r.name || !Number.isFinite(r.weightPct) || r.weightPct < 0 || r.weightPct > 100)) continue
    const sum = o.rows.reduce((s,r) => s+r.weightPct,0)
    if (sum <= 0 || sum > 100.5 || new Set(o.rows.map(r => r.name.toLowerCase())).size !== o.rows.length) continue
    let classificationId, classification
    try { ({classificationId,classification}=taxonomy(o,line.isin,field)) } catch { continue }
    const key = [o.asOf,o.basis,classificationId].join('|')
    const group = groups.get(key) ?? { asOf:o.asOf, basis:o.basis, classificationId, classification, coverage:0, detailedCoverage:0, complete:true, rows:new Map(), sources:new Set() }
    group.coverage += line.pct
    group.detailedCoverage += line.pct*Math.min(sum,100)/100
    group.complete &&= Math.abs(sum-100) <= .5
    group.sources.add(o.sourceUrl)
    for (const row of o.rows) {
      const name = frenchCharacteristic(row.label ?? row.name)
      group.rows.set(name,(group.rows.get(name) ?? 0)+line.pct*row.weightPct/100)
    }
    groups.set(key,group)
  }
  return [...groups.values()].map(g => ({ ...g, complete:g.complete && Math.abs(g.coverage-100)<.01, sources:[...g.sources], rows:[...g.rows].map(([name,weight])=>({name,weight})).sort((a,b)=>b.weight-a.weight) }))
}

// Compare only matching complete photographs; absence of a country is not a zero.
export function comparePortfolioExposure(left, right, records, field) {
  const a = portfolioExposure(left, records, field)
  const b = portfolioExposure(right, records, field)
  const results = []
  for (const x of a.filter(g => g.complete)) {
    const y = b.find(g => g.asOf === x.asOf && g.basis === x.basis && g.classificationId === x.classificationId && g.complete)
    if (!y) continue
    const rows = x.rows.flatMap(row => {
      const other = y.rows.find(r => r.name === row.name)
      return other ? [{ name: row.name, a: row.weight, b: other.weight, difference: other.weight - row.weight }] : []
    }).sort((a,b) => Math.abs(b.difference) - Math.abs(a.difference))
    results.push({ asOf:x.asOf, basis:x.basis, classification:x.classification, classificationId:x.classificationId, rows, sources:[...new Set([...x.sources,...y.sources])] })
  }
  return results
}
