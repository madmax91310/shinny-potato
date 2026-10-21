import { annualColumns, rankRows } from './engine.js'
import { COLORS } from './palette.js'

export function annualRankingError(result) {
  const columns = annualColumns(result)
  if (columns.some(column => column.partial)) return 'Le classement annuel exige des années civiles complètes. Choisis « Année par année » et les années communes indiquées ci-dessous ; la période libre contient une année partielle.'
  if (columns.length > 7) return 'Le classement annuel présente au maximum 7 années pour garder les noms et les performances lisibles. Réduis la période ; la présentation actuelle reste disponible.'
  if (columns.length === 1) return 'Le classement annuel exige au moins 2 années civiles complètes communes.'
  if (!columns.length) return 'Aucune année civile complète commune.'
  return ''
}

export function annualRankingColumns(result) {
  const error = annualRankingError(result)
  if (error) throw new Error(error)
  const names = result.assets.map(asset => asset.shortLabel ?? asset.label)
  const labels = result.assets.map((asset, i) => {
    const name = names[i]
    if (names.filter(other => other === name).length === 1) return name
    const full = asset.label ?? name
    return result.assets.filter(other => other.label === full).length > 1 ? `${full} (${asset.isin ?? asset.id})` : full
  })
  return annualColumns(result).map(column => {
    if (column.rows.length !== result.assets.length || new Set(column.rows.map(row => row.id)).size !== result.assets.length) throw new Error('Performance annuelle absente ou dupliquée.')
    return { ...column, rows: rankRows(column.rows.map(row => {
    const order = result.assets.findIndex(asset => asset.id === row.id)
    if (order < 0 || !Number.isFinite(row.value)) throw new Error('Performance annuelle absente ou invalide.')
    return { ...row, order, label: labels[order], color: result.assets[order].rankingColor ?? COLORS[order] }
    })).map((row, _, rows) => ({ ...row, tied: rows.some(other => other.id !== row.id && other.value === row.value) })) }
  })
}

export function annualRankingLayout(assetCount, yearCount, nameHeight = 0) {
  if (!Number.isInteger(assetCount) || assetCount < 2 || assetCount > 6 || !Number.isInteger(yearCount) || yearCount < 2 || yearCount > 7) throw new Error('Choisis 2 à 6 actifs et 2 à 7 années complètes.')
  const margin = 36, rankWidth = 66, gap = 10
  const width = Math.max(1000, margin * 2 + rankWidth + yearCount * 236)
  const cellWidth = (width - margin * 2 - rankWidth) / yearCount
  const rowHeight = Math.max(assetCount <= 3 ? 180 : 166, nameHeight + 92)
  const tableY = 156, headerHeight = 52
  return { width, height: tableY + headerHeight + assetCount * rowHeight + 52, margin, rankWidth, gap, cellWidth, rowHeight, tableY, headerHeight }
}

export function contrastText(hex) {
  const channels = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  return luminance > .179 ? '#101c29' : '#ffffff'
}

export const annualImagePercent = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`

