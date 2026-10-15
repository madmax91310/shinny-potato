import { COMMODITY_PUBLICATION_DATA } from './commodity-publication-data.js'

export function commodityAllocationLines(isin) {
  const allocation = COMMODITY_PUBLICATION_DATA[isin]
  if (!allocation) return []
  const date = allocation.asOf.split('-').reverse().join('/')
  return [`🟡 Matières premières de l’indice suivi au ${date}`,
    ...allocation.rows.map(row => `${row.label} : ${row.weightPct.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`)]
}
