import { metrics, dateLabel, calculatedRatios } from './lib.js'

export function renderCompanyImage(company, now = new Date()) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 1200
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#101b24'; ctx.fillRect(0, 0, 1200, 1200)
  ctx.fillStyle = '#7bd8bd'; ctx.font = '24px sans-serif'; ctx.fillText('ÉPARGNANT LIBRE', 64, 65)
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 72px sans-serif'; ctx.fillText(company.name, 64, 175)
  ctx.fillStyle = '#b9c8d2'; ctx.font = '25px sans-serif'; ctx.fillText(company.symbol, 64, 224)
  const rows = metrics(company, now)
  const step = Math.min(150, 640 / Math.ceil(rows.length / 2))
  rows.forEach((row, i) => {
    const x = i % 2 ? 620 : 64, y = 315 + Math.floor(i / 2) * step
    ctx.fillStyle = '#b9c8d2'; ctx.font = '21px sans-serif'; ctx.fillText(row.label, x, y, 510)
    ctx.fillStyle = '#7bd8bd'; ctx.font = 'bold 44px sans-serif'; ctx.fillText(row.value, x, y + 58)
  })
  ctx.fillStyle = '#b9c8d2'; ctx.font = '22px sans-serif'
  ctx.fillText(`Dernier exercice annuel clos le ${dateLabel(company.annual.end)}`, 64, 965)
  ctx.fillText('Comptes publiés par l’entreprise · montants en USD', 64, 1007)
  if (calculatedRatios(company, now).peTTM) ctx.fillText(`PER : clôture du ${dateLabel(company.quote.asOf)} / BPA sur 12 mois clos le ${dateLabel(company.trailing.end)}`, 64, 1049)
  else if (company.valuation) ctx.fillText(`Ratios fournisseur : relevé du ${dateLabel(company.valuation.observedAt)}`, 64, 1049)
  ctx.fillText('Les chiffres décrivent une entreprise ; ils ne suffisent pas à juger son action.', 64, 1120)
  return canvas
}
