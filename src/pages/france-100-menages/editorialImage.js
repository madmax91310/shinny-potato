import { formatHouseholdNumber, getHouseholdVisual } from '../../data/household-statistics.js'

const INK = '#071D35', GREEN = '#008663', PAPER = '#FFF9E9', SKIN = '#F5AF86'
// Explicit subject coverage: these drawings are editorial metaphors, never data charts.
export const HOUSEHOLD_EDITORIAL_ART = Object.freeze({
  'wealth-share': ['house', 'Patrimoine'], 'wealth-top10': ['house', 'Patrimoine'], 'wealth-median': ['house', 'Patrimoine'],
  'young-wealth': ['house', 'Patrimoine'], 'thirties-wealth': ['house', 'Patrimoine'],
  pea: ['document', 'PEA'], cto: ['document', 'CTO'], lep: ['document', 'LEP'], ldds: ['document', 'LDDS'], pel: ['document', 'PEL'],
  'livret-assurance': ['documents', 'Épargne'], 'retirement-savings': ['clock', 'Retraite'], 'employee-savings': ['briefcase', ''],
  homeowners: ['house', ''], 'young-homeowners': ['key', ''], 'other-homes': ['houses', ''],
  debt: ['document', 'Crédit'], 'debt-types': ['document', 'Crédits'], 'securities-workers': ['document', 'Titres'],
  inheritance: ['gift', ''], donation: ['gift', ''], 'salary-top10': ['document', 'Salaire'], 'salary-median': ['document', 'Salaire'],
  'unexpected-expense': ['bill', 'Facture'], 'bills-on-time': ['bill', 'Facture'], 'personal-spending': ['wallet', ''],
  heating: ['radiator', ''], holidays: ['suitcase', ''], 'protein-meals': ['plate', ''],
})

function shape(ctx, path, fill, stroke = INK, width = 9) {
  const p = new Path2D(path); ctx.fillStyle = fill; ctx.fill(p)
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(p) }
}
function rect(ctx, x, y, w, h, fill, radius = 0) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke()
}
function line(ctx, path, color = INK, width = 9) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(new Path2D(path))
}
function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke() }
function text(ctx, value, x, y, size, color = INK, weight = 900) {
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y)
}
function lines(ctx, value, width, size) {
  ctx.font = `900 ${size}px Arial, sans-serif`
  // Keep monetary amounts and units together (notably 1 000 €).
  const words = String(value).replace(/\u202f/g, ' ').match(/\d+(?:[,.]\d+)?(?:\s+\d{3})*(?:\s+[€%])?|\S+(?:\s+[?!:;])?/g) ?? []
  const result = []; let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (current && ctx.measureText(next).width > width) { result.push(current); current = word } else current = next
  }
  if (current) result.push(current)
  return result
}
function paragraph(ctx, value, x, y, width, height, preferred, color = INK) {
  let size = preferred, rows
  do { rows = lines(ctx, value, width, size); if (rows.length * size * 1.15 <= height) break; size-- } while (size > 24)
  rows.forEach((row, i) => text(ctx, row, x, y + i * size * 1.15, size, color))
}
function metric(ctx, value, x, y, width, preferred) {
  let size = preferred
  while (size > 45) { ctx.font = `900 ${size}px Arial, sans-serif`; if (ctx.measureText(value).width <= width) break; size-- }
  if (value.endsWith('%')) {
    const prefix = value.slice(0, -1)
    text(ctx, prefix, x, y, size)
    const offset = ctx.measureText(prefix).width
    text(ctx, '%', x + offset, y, size, GREEN)
  } else text(ctx, value, x, y, size)
}

function drawDocument(ctx, label, bill = false) {
  shape(ctx, 'M80 65 L375 65 L440 130 L440 475 L80 475 Z', GREEN)
  shape(ctx, 'M375 65 L375 130 L440 130 Z', INK, null)
  text(ctx, label, 112, 168, label.length > 6 ? 50 : 74, PAPER)
  line(ctx, 'M118 285 L362 285 M118 325 L320 325', PAPER, 12)
  if (bill) line(ctx, 'M125 385 L185 425 L265 370', PAPER, 12)
}
function object(ctx, kind, label) {
  if (kind === 'document' || kind === 'bill') drawDocument(ctx, label, kind === 'bill')
  else if (kind === 'documents') { ctx.save(); ctx.translate(-20, -40); ctx.rotate(-.12); drawDocument(ctx, 'Livret A'); ctx.restore(); ctx.save(); ctx.translate(50, 40); ctx.rotate(.12); drawDocument(ctx, 'Assurance'); ctx.restore() }
  else if (kind === 'house' || kind === 'houses') {
    if (kind === 'houses') { ctx.save(); ctx.translate(-30, -85); ctx.scale(.75, .75); object(ctx, 'house', ''); ctx.restore() }
    shape(ctx, 'M75 230 L260 75 L445 230 L415 265 L400 250 L400 480 L125 480 L125 250 L108 267 Z', GREEN)
    rect(ctx, 225, 330, 78, 150, PAPER); rect(ctx, 160, 270, 50, 55, PAPER); rect(ctx, 315, 270, 50, 55, PAPER)
    line(ctx, 'M100 230 L260 100 L420 230', PAPER, 12)
  } else if (kind === 'key') {
    circle(ctx, 240, 170, 108, GREEN); circle(ctx, 240, 170, 40, PAPER)
    shape(ctx, 'M215 275 L215 475 L325 475 L325 420 L270 420 L270 380 L305 380 L305 330 L270 330 L270 275 Z', GREEN)
  } else if (kind === 'gift') {
    rect(ctx, 100, 235, 340, 240, GREEN); rect(ctx, 75, 190, 390, 65, PAPER)
    shape(ctx, 'M250 190 C80 160 135 45 205 95 C245 120 265 172 270 190 C300 80 425 75 412 137 C400 192 327 193 270 190', GREEN)
    rect(ctx, 235, 193, 65, 282, PAPER)
  } else if (kind === 'briefcase' || kind === 'suitcase') {
    shape(ctx, 'M195 160 L195 105 Q195 80 220 80 L315 80 Q340 80 340 105 L340 160', GREEN)
    rect(ctx, 85, 160, 375, 320, GREEN, 25)
    if (kind === 'briefcase') { line(ctx, 'M90 260 L455 260', PAPER, 12); rect(ctx, 243, 245, 60, 55, PAPER) }
    else { line(ctx, 'M170 200 L170 438 M375 200 L375 438', PAPER, 14); rect(ctx, 220, 230, 100, 95, PAPER, 8) }
  } else if (kind === 'clock') {
    circle(ctx, 270, 270, 195, GREEN); circle(ctx, 270, 270, 155, PAPER)
    line(ctx, 'M270 158 L270 270 L350 315', INK, 15)
    line(ctx, 'M270 135 L270 150 M405 270 L390 270 M270 405 L270 390 M135 270 L150 270')
  } else if (kind === 'radiator') {
    for (let i = 0; i < 5; i++) rect(ctx, 90 + i * 72, 180, 62, 275, GREEN, 24)
    line(ctx, 'M110 455 L110 485 M420 455 L420 485 M145 130 Q110 95 145 60 M270 130 Q235 95 270 60 M395 130 Q360 95 395 60')
  } else if (kind === 'plate') {
    circle(ctx, 270, 270, 195, GREEN); circle(ctx, 270, 270, 153, PAPER)
    shape(ctx, 'M168 260 Q205 185 255 245 Q290 315 210 325 Q170 320 168 260', GREEN)
    shape(ctx, 'M315 180 Q410 205 345 270 Q300 245 315 180', GREEN)
    line(ctx, 'M117 140 L117 390 M97 140 L97 215 M137 140 L137 215 M410 140 L410 390', INK, 8)
  } else if (kind === 'wallet') {
    rect(ctx, 165, 90, 230, 245, PAPER, 10); line(ctx, 'M200 145 L345 145 M200 183 L315 183')
    rect(ctx, 75, 235, 385, 240, GREEN, 25); rect(ctx, 330, 300, 140, 100, PAPER, 15); circle(ctx, 385, 350, 16, GREEN)
  } else throw new Error(`Illustration inconnue : ${kind}`)
}

function illustration(ctx, record) {
  const art = HOUSEHOLD_EDITORIAL_ART[record.id]; if (!art) throw new Error(`Sujet non illustré : ${record.id}`)
  ctx.save(); ctx.translate(965, 120); ctx.scale(.98, .98)
  ctx.save(); ctx.translate(0, 25); ctx.rotate(-.16); object(ctx, ...art); ctx.restore()
  // A large, deliberately flat editorial hand grips the subject, matching the selected poster.
  shape(ctx, 'M620 720 L415 720 L320 605 C278 559 265 520 279 477 L350 306 C365 271 396 267 421 288 L526 390 C569 432 570 515 604 549 L650 599 Z', SKIN)
  shape(ctx, 'M340 352 C307 323 307 292 334 273 C354 260 376 266 398 281 L447 323 C466 340 457 362 437 370 C418 377 400 365 382 351 L352 329', SKIN)
  shape(ctx, 'M272 409 C244 384 265 350 293 356 L384 401 C409 415 397 451 372 450 Z', SKIN)
  shape(ctx, 'M261 470 C231 446 252 412 282 418 L374 460 C401 475 386 510 361 507 Z', SKIN)
  shape(ctx, 'M272 529 C242 505 259 473 290 479 L363 513 C388 527 373 560 348 558 Z', SKIN)
  shape(ctx, 'M297 579 C268 558 277 529 308 533 L350 552 C375 564 364 594 342 592 Z', SKIN)
  line(ctx, 'M430 380 Q405 428 450 472 M410 466 Q393 494 401 528', INK, 8)
  shape(ctx, 'M442 675 L604 541 L660 595 L660 770 L520 770 Z', PAPER)
  shape(ctx, 'M480 719 L638 580 L670 620 L670 800 L535 800 Z', INK)
  ctx.restore()
}

export function renderEditorialHouseholdImage(record) {
  const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 1350
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Le navigateur ne permet pas de générer cette image.')
  ctx.scale(1.5, 1.5); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1600, 900)
  illustration(ctx, record)
  const width = 885, title = record.id === 'pea' ? 'LE PEA, SI RARE ?' : record.title
  if (record.id === 'pea') {
    text(ctx, 'LE PEA,', 65, 55, 110)
    text(ctx, 'SI RARE ?', 65, 177, 110, GREEN)
  } else paragraph(ctx, title.toLocaleUpperCase('fr-FR'), 65, 55, width, 230, 97)
  if (record.kind === 'comparison') {
    getHouseholdVisual(record).forEach((row, i) => {
      metric(ctx, row.exact, 65, 305 + i * 215, width, 138)
      paragraph(ctx, row.label, 65, 451 + i * 215, width, 66, 43)
    })
  } else {
    metric(ctx, `${formatHouseholdNumber(record.value)} ${record.unit === 'EUR' ? '€' : '%'}`, 65, 310, width, 250)
    const label = record.population === 'personnes' ? `des personnes ${record.metricLabel}` : record.metricLabel
    paragraph(ctx, label, 65, 592, width, 135, 43)
    if (record.kind === 'share') paragraph(ctx, 'Pour les 50 ménages les moins dotés en patrimoine brut', 65, 728, width, 55, 30)
  }
  text(ctx, record.referencePeriod, 65, 795, 29, INK, 400)
  text(ctx, 'Épargnant Libre', 65, 844, 34)
  ctx.fillStyle = GREEN; ctx.fillRect(249, 886, 65, 4)
  return canvas.toDataURL('image/png')
}
