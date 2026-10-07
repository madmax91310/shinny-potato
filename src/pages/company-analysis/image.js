import { amount, canPublish, dateLabel, calculatedRatios, activeValuation, fresh } from './lib.js'

const ART = {
  apple: 'iPhone, Mac et services',
  microsoft: 'Logiciels et cloud Azure',
  nvidia: 'Puces, centres de données et IA',
  alphabet: 'Google, YouTube et cloud',
  amazon: 'Commerce en ligne et cloud AWS',
}
const finite = value => typeof value === 'number' && Number.isFinite(value)
const fr = value => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)
const images = new Map()
function loadArt(id) {
  if (!ART[id]) return Promise.resolve(null)
  if (!images.has(id)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Impossible de charger l’illustration de cette entreprise.'))
      image.src = `${import.meta.env?.BASE_URL ?? '/'}asset-art/company-light/${id}.webp`
    }).catch(error => { images.delete(id); throw error })
    images.set(id, promise)
  }
  return images.get(id)
}
function change(current, previous, income = false) {
  if (!finite(previous)) return ''
  if (income && (current < 0 || previous < 0)) {
    if (current < 0 && previous < 0) return current > previous ? 'Perte réduite sur un an' : current < previous ? 'Perte accrue sur un an' : 'Perte stable sur un an'
    if (current >= 0 && previous < 0) return current > 0 ? 'Retour au bénéfice' : 'Retour à l’équilibre'
    return 'Après un bénéfice'
  }
  if (previous <= 0) return ''
  const growth = (current / previous - 1) * 100
  return `${growth >= 0 ? '+' : '−'}${fr(Math.abs(growth))} % sur un an`
}
// Presentation model shares the same observations and freshness gates as the tweet.
export function companyImageModel(company, now = new Date()) {
  if (!canPublish(company, now)) throw new Error('Les comptes sont indisponibles ou trop anciens pour générer une image.')
  const a = company.annual
  const ratio = calculatedRatios(company, now).peTTM ?? activeValuation(company, now)?.peTTM
  const pe = finite(ratio) && ratio > 0 ? ratio : null
  const quoteDate = company.quote && finite(company.quote.price) && company.quote.price > 0 && fresh(company.quote.asOf, 10, now) ? company.quote.asOf : null
  const amountParts = value => {
    const formatted = amount(value, company.currency)
    const split = formatted.indexOf(' ')
    return [formatted.slice(0, split), formatted.slice(split + 1).replace('USD', '$').replace('EUR', '€')]
  }
  return {
    name: company.name,
    subtitle: ART[company.id] ?? company.symbol,
    annualDate: `Exercice clos le ${dateLabel(a.end)}`,
    columns: [
      { label: 'Chiffre d’affaires', parts: amountParts(a.revenue), change: change(a.revenue, a.previousRevenue) },
      { label: a.netIncome < 0 ? 'Perte nette' : 'Bénéfice net', parts: amountParts(Math.abs(a.netIncome)), change: change(a.netIncome, a.previousNetIncome, true) },
      { label: 'Marge nette', parts: [`${fr(a.netIncome / a.revenue * 100)} %`, ''], change: '' },
    ],
    pe: pe === null ? null : `${fr(pe)}×`,
    valuationDate: quoteDate ? `Cours au ${dateLabel(quoteDate)}` : pe ? `Ratio au ${dateLabel(activeValuation(company, now).observedAt)}` : '',
  }
}
function text(ctx, value, x, y, size, color, maxWidth, weight = 400, family = 'Arial, sans-serif') {
  let fitted = size
  ctx.font = `${weight} ${fitted}px ${family}`
  while (maxWidth && ctx.measureText(value).width > maxWidth && fitted > 16) {
    fitted -= 1; ctx.font = `${weight} ${fitted}px ${family}`
  }
  ctx.fillStyle = color; ctx.fillText(value, x, y)
}
export async function renderCompanyImage(company, now = new Date()) {
  const model = companyImageModel(company, now)
  const art = await loadArt(company.id)
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 1200
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f8f9fb'; ctx.fillRect(0, 0, 1200, 1200)
  if (art) {
    ctx.drawImage(art, 0, 554, 1200, 600)
    const blend = ctx.createLinearGradient(0, 554, 0, 676)
    blend.addColorStop(0, '#f8f9fb'); blend.addColorStop(1, 'rgba(248,249,251,0)')
    ctx.fillStyle = blend; ctx.fillRect(0, 554, 1200, 122)
  }
  text(ctx, model.name, 56, 182, 142, '#111317', 1088, 800)
  text(ctx, model.subtitle, 60, 242, 38, '#434b56', 1080)
  text(ctx, model.annualDate, 60, 286, 26, '#657080', 810)
  model.columns.forEach((column, i) => {
    const x = 60 + i * 275
    text(ctx, column.label, x, 357, 27, '#14171c', 244, 600)
    text(ctx, column.parts[0], x, 455, 88, '#0063c9', 246, 800)
    text(ctx, column.parts[1], x, 500, 37, '#0063c9', 246, 700)
    text(ctx, column.change, x, 543, 26, '#424b57', 246)
    if (i < 2) { ctx.strokeStyle = '#cbd2db'; ctx.lineWidth = 1; ctx.beginPath();ctx.moveTo(x + 258, 331);ctx.lineTo(x + 258, 552);ctx.stroke() }
  })
  ctx.fillStyle = '#e7eef7';ctx.beginPath();ctx.roundRect(899, 317, 251, 242, 20);ctx.fill()
  text(ctx, model.valuationDate, 921, 351, 21, '#475365', 205)
  text(ctx, 'PER', 921, 401, 29, '#14171c', 205, 600)
  text(ctx, model.pe ?? 'Non disponible', 919, 487, model.pe ? 77 : 27, model.pe ? '#0063c9' : '#657080', 210, model.pe ? 800 : 400)
  if (model.pe) text(ctx, 'Bénéfices sur 12 mois', 921, 530, 22, '#475365', 205)
  ctx.fillStyle = '#f8f9fb';ctx.fillRect(0, 1140, 1200, 60)
  ctx.textAlign = 'center';text(ctx, 'Épargnant Libre', 600, 1180, 30, '#111317', 450, 400, 'Georgia, serif')
  return canvas
}
