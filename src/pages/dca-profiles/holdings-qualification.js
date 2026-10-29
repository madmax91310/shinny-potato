import { qualifiedNativeIndexComposition } from '../../data/native-index-composition.js'
import { EXPOSURE_MAX_AGE_DAYS } from './exposure.js'

const securityId = value => /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value || '')
export function qualifyHoldings(h, line, reference, now = new Date()) {
  const reasons = []
  const today = Date.parse(new Date(now).toISOString().slice(0,10)), stamp = Date.parse(h?.asOf)
  const age = (today-stamp)/86400000
  if (!h) return {valid:false, complete:false, reasons:['Composition absente.']}
  if (line.isin !== reference?.isin) reasons.push('Le support confirmé ne correspond pas à la référence.')
  if (!h.sourceUrl) reasons.push('Source de composition absente.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(h.asOf || '') || !Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0,10) !== h.asOf) reasons.push('Date de composition invalide.')
  else if (age < 0) reasons.push('Date de composition future.')
  else if (age > EXPOSURE_MAX_AGE_DAYS) reasons.push('Composition périmée.')
  if (!['fund','index','equity'].includes(h.basis)) reasons.push('Périmètre de composition non qualifié.')
  if ((h.synthetic || reference?.synthetic) && h.basis === 'fund') reasons.push('Panier de substitution exclu de l’exposition économique.')
  if (h.basis === 'index' && h.complete === true && !qualifiedNativeIndexComposition(h,line.isin,now)) reasons.push('Composition intégrale d’indice non qualifiée pour cette part.')
  const validRows = Array.isArray(h.rows) && h.rows.length > 0 && h.rows.every(row => Number.isFinite(row.weightPct) && row.weightPct >= 0 && row.weightPct <= 100)
  if (!validRows) reasons.push('Positions absentes ou poids invalides.')
  const sourceCoverage = validRows ? h.rows.reduce((sum,row)=>sum+row.weightPct,0) : null
  if (sourceCoverage > 100.5) reasons.push('Poids actions bruts incompatibles avec le périmètre net ; aucune renormalisation.')
  if (reasons.length) return {valid:false,complete:false,reasons,sourceCoverage}
  const weights = new Map()
  for (const row of h.rows) if(securityId(row.isin)) weights.set(row.isin,(weights.get(row.isin)||0)+row.weightPct)
  if ([...weights.values()].some(weight=>weight>100)) return {valid:false,complete:false,reasons:['Poids cumulé d’un même ISIN supérieur à 100 %.'],sourceCoverage}
  const identifiedCoverage = [...weights.values()].reduce((sum,weight)=>sum+weight,0)
  const unidentifiedCoverage = h.rows.filter(row=>!securityId(row.isin)).reduce((sum,row)=>sum+row.weightPct,0)
  if (h.complete !== true || h.approximation === true) reasons.push('Liste partielle ; seules les positions publiées sont comparées.')
  if (h.rows.some(row=>!securityId(row.isin))) reasons.push('Certaines positions n’ont pas d’identifiant qualifié.')
  if (sourceCoverage < 99.5) reasons.push('Le poids couvert est insuffisant pour une comparaison intégrale.')
  if (sourceCoverage > 100.00001) reasons.push('La somme des poids publiés dépasse 100 % ; aucun taux intégral calculé.')
  return {valid:true,complete:reasons.length===0,reasons,sourceCoverage,identifiedCoverage,unidentifiedCoverage,residualWeight:100-sourceCoverage}
}
