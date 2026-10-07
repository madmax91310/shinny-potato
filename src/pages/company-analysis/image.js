import { metrics, dateLabel } from './lib.js'

export function renderCompanyImage(company, now = new Date()) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 1200
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#101b24'; ctx.fillRect(0, 0, 1200, 1200)
  ctx.fillStyle = '#7bd8bd'; ctx.font = '24px sans-serif'; ctx.fillText('ÉPARGNANT LIBRE', 64, 65)
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 72px sans-serif'; ctx.fillText(company.name, 64, 175)
  ctx.fillStyle = '#b9c8d2'; ctx.font = '25px sans-serif'; ctx.fillText(company.symbol, 64, 224)
  const rows = metrics(company, now)
  rows.forEach((row, i) => {
    const x = i % 2 ? 620 : 64, y = 335 + Math.floor(i / 2) * 155
    ctx.fillStyle = '#b9c8d2'; ctx.font = '22px sans-serif'; ctx.fillText(row.label, x, y)
    ctx.fillStyle = '#7bd8bd'; ctx.font = 'bold 44px sans-serif'; ctx.fillText(row.value, x, y + 58)
  })
  ctx.fillStyle = '#b9c8d2'; ctx.font = '22px sans-serif'
  ctx.fillText(`Exercice du ${dateLabel(company.annual.start)} au ${dateLabel(company.annual.end)}`, 64, 840)
  ctx.fillText('Comptes publiés : SEC / EDGAR', 64, 888)
  if (rows.some(row => row.label.startsWith('PER'))) {
    ctx.fillText(`Ratios : Alpha Vantage · relevé du ${dateLabel(company.valuation.observedAt)}`, 64, 946)
    ctx.fillText('PER prévisionnel : estimations, horizon fournisseur non précisé', 64, 992)
  }
  ctx.fillText('Les chiffres décrivent une entreprise ; ils ne suffisent pas à juger son action.', 64, 1120)
  return canvas
}
