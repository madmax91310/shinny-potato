import { AUTOMATED_ETF } from './automated-etf.js'

export function commodityAllocationLines(isin) {
  const allocation = AUTOMATED_ETF[isin]?.commodityAllocation
  if (!allocation) return []
  const date = allocation.asOf.split('-').reverse().join('/')
  return [`🟡 Matières premières de l’indice suivi au ${date}`,
    ...allocation.rows.map(row => `${row.label} : ${row.weightPct.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`)]
}
