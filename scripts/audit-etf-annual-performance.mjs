#!/usr/bin/env node
// Vérifie que les performances publiées dans les Fiches ETF correspondent à la part exacte
// du Générateur, sans proposer une part à historique incomplet dans ses choix.
import { ETFS } from '../src/pages/etf-sheets/data.js'
import { ASSETS } from '../src/pages/portfolio-generator/data.js'
import { getAnnualPerformance } from '../src/pages/etf-sheets/annualPerformance.js'
import { PROFILES } from '../src/pages/portfolio-generator/theses.js'
import { VERIFIED_RETURNS } from '../src/pages/etf-sheets/verifiedReturns.js'

let errors = 0
const known = new Map(ASSETS.filter((asset) => asset.isin).map((asset) => [asset.isin, asset]))
const cards = new Set(ETFS.map((etf) => etf.isin))
for (const etf of ETFS) {
  const series = getAnnualPerformance(etf)
  if (!series) continue
  if (series.values.length !== 6 || !series.values.every((v) => v === null || Number.isFinite(v))) {
    console.error(`Série annuelle invalide : ${etf.isin}`); errors++
  }
  const asset = known.get(etf.isin)
  if (asset && series.values.every(Number.isFinite) && JSON.stringify(asset.r) !== JSON.stringify(series.values)) {
    console.error(`Divergence Fiches / Générateur : ${etf.isin}`); errors++
  }
  if (asset && !series.values.every(Number.isFinite)) {
    console.error(`Part à historique incomplet dans le Générateur : ${etf.isin}`); errors++
  }
}
const selectable = new Set()
function visit(value) {
  if (Array.isArray(value)) return value.forEach(visit)
  if (value && typeof value === 'object') {
    if (typeof value.id === 'string') selectable.add(value.id)
    if (Array.isArray(value.idOptions)) value.idOptions.forEach((id) => selectable.add(id))
    Object.values(value).forEach(visit)
  }
}
visit(PROFILES)
for (const asset of ASSETS) {
  if (cards.has(asset.isin) && VERIFIED_RETURNS[asset.isin] && !selectable.has(asset.id)) {
    console.error(`Part de fiche sans choix de portefeuille : ${asset.id}`); errors++
  }
}
console.log(`${ETFS.length} fiches, ${ETFS.filter((e) => getAnnualPerformance(e)?.values.every(Number.isFinite)).length} séries complètes, ${errors} erreur(s).`)
if (errors) process.exitCode = 1
