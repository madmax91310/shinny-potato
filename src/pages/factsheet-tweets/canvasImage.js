import { roundedComposition } from '../../data/index-concentration-core.js'
import { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'
import { getIndexArt } from './visualIdentity.js'
import { factsheetCurrency } from './performanceCurrency.js'
import { companyLabel, plainLabel, sectorLabel, sortedRows } from './editorial.js'

// Approved magazine direction: emerald, editorial typography and decorative photos.
// The illustration never carries a number or a financial observation.
const W = 1600, PAD = 44, GAP = 24, USABLE = W - PAD * 2, GUTTER = 385
const C = { ink: '#f8f3dd', green: '#123e30', paper: '#f6f1db', gold: '#9abdaa', rule: '#71998566', negative: '#a32f42', background: '#031e18', mint: '#c9e3ca' }
const font = (ctx, size, weight = 400, serif = false) => { ctx.font = `${weight} ${size}px ${serif === 'title' ? 'ExportEditorial, Georgia, serif' : serif ? 'Georgia, serif' : 'Arial, sans-serif'}` }
function lines(ctx, value, width) {
  const out = []
  for (const paragraph of String(value).split('\n')) {
    let line = ''
    for (const word of paragraph.match(/\S+(?:[\u00a0\u202f]\S+)*/g) ?? []) {
      if (ctx.measureText(line ? `${line} ${word}` : word).width <= width) { line = line ? `${line} ${word}` : word; continue }
      if (line) { out.push(line); line = '' }
      // Unusual long names wrap rather than disappear behind an ellipsis.
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > width) { out.push(line); line = '' }
        line += char
      }
    }
    if (line) out.push(line)
  }
  return out
}
function block(ctx, text, width, size, weight = 400, serif = false) {
  font(ctx, size, weight, serif)
  const wrapped = lines(ctx, text, width)
  return { lines: wrapped, size, weight, serif, height: wrapped.length * size * 1.23 }
}
function draw(ctx, b, x, y, align = 'left', color = C.ink) {
  font(ctx, b.size, b.weight, b.serif); ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.fillStyle = color
  b.lines.forEach((line, i) => ctx.fillText(line, x, y + i * b.size * 1.23))
}
function fit(ctx, text, width, size, min = 48, serif = true) {
  font(ctx, size, 700, serif)
  while (ctx.measureText(text).width > width && size > min) font(ctx, --size, 700, serif)
  return block(ctx, text, width, size, 700, serif)
}
const percent = (n, signed = false) => `${signed && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
function displayLabel(name) {
  return plainLabel(name)
    .replace(/Technologies de l.info\.?/i, 'Technologie')
    .replace(/Services de communication/i, 'Communication')
    .replace(/Consommation discrétionnaire|Consommation cyclique/i, 'Conso cyclique')
    .replace(/Consommation de base/i, 'Conso de base')
    .replace(/Services financiers/i, 'Finance')
}
// Only display aliases: no grouping of share classes or change to their weights.
export function imageCompanyLabel(name) {
  return companyLabel(name)
    .replace(/^HSBC HOLDING PLC(?: GBP)?$/i, 'HSBC')
    .replace(/^ROCHE HLDG AG-GENUSS(?: CHF)?$/i, 'Roche')
    .replace(/^NOVARTIS AG-REG$/i, 'Novartis')
    .replace(/^SHELL PLC(?: EUR)?$/i, 'Shell')
    .replace(/^NESTLE SA-REG$/i, 'Nestlé')
}
let grain
function paper(ctx, height, width = W) {
  ctx.fillStyle = C.background; ctx.fillRect(0, 0, width, height)
  const glow = ctx.createRadialGradient(width * .85, 0, 0, width * .85, 0, width)
  glow.addColorStop(0, '#1a493a'); glow.addColorStop(1, '#031e1800')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height)
  // A restrained crescent echoes the approved cover without encoding data.
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, 300); ctx.clip()
  ctx.strokeStyle = '#b9d7b51f'; ctx.lineWidth = 115
  ctx.beginPath(); ctx.ellipse(width * .78, -130, width * .34, 365, -.25, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  if (!grain) {
    grain = document.createElement('canvas'); grain.width = grain.height = 96
    const g = grain.getContext('2d'), data = g.createImageData(96, 96); let seed = 78
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      data.data[i] = data.data[i + 1] = data.data[i + 2] = seed & 256 ? 255 : 70
      data.data[i + 3] = (seed >>> 24) % 7
    }
    g.putImageData(data, 0, 0)
  }
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, width, height)
}
function panel(ctx, x, y, width, height, light = false) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, 35)
  const wash = ctx.createLinearGradient(x, y, x + width, y + height)
  wash.addColorStop(0, light ? '#fff9e8' : '#194b3a'); wash.addColorStop(1, light ? '#eae5cd' : '#06291f')
  ctx.fillStyle = wash; ctx.fill(); ctx.strokeStyle = light ? '#e5e0cb' : '#9abdaa80'; ctx.lineWidth = 1.4; ctx.stroke()
}
function labelBlock(ctx, value, width, size) {
  // Prefer slightly smaller whole words to an isolated final letter.
  while (size > 24) {
    font(ctx, size, 500)
    if (String(value).split(/\s+/).every(word => ctx.measureText(word).width <= width)) break
    size--
  }
  return block(ctx, value, width, size, 500)
}
function compositionBand(ctx, label, rows) {
  const cellWidth = (USABLE - GUTTER - 12) / Math.max(1, rows.length)
  const cells = rows.map(([name, value]) => ({
    value: fit(ctx, percent(value), cellWidth - 26, rows.length === 1 ? 110 : 86, 48),
    name: labelBlock(ctx, name, cellWidth - 32, rows.length === 1 ? 42 : 34),
  }))
  return { label, cells, cellWidth, height: Math.max(258, ...cells.map(cell => cell.value.height + cell.name.height + 72)) }
}
function illustration(ctx, art, index, y, height) {
  const x = PAD + 112, width = GUTTER - 112
  ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, y, USABLE, height, 35); ctx.clip()
  const sourceSide = art.width / 3, scale = Math.max(width / sourceSide, height / art.height)
  const sw = width / scale, sh = height / scale
  ctx.drawImage(art, index * sourceSide + (sourceSide - sw) / 2, (art.height - sh) / 2, sw, sh, x, y, width, height)
  const fade = ctx.createLinearGradient(x, y, x + width, y)
  fade.addColorStop(0, '#06291f20'); fade.addColorStop(.65, '#06291f10'); fade.addColorStop(1, '#06291f')
  ctx.fillStyle = fade; ctx.fillRect(x, y, width, height)
  ctx.restore()
}
function category(ctx, label, y, height) {
  ctx.save(); ctx.translate(PAD + 40, y + height / 2); ctx.rotate(-Math.PI / 2)
  const b = fit(ctx, label, height - 36, 34, 26, true)
  draw(ctx, b, 0, -b.height / 2, 'center'); ctx.restore()
}
function heading(ctx, value, width) {
  for (let size = 150; size >= 74; size -= 2) {
    const b = block(ctx, value, width, size, 400, 'title')
    if (b.lines.length <= 2) return b
  }
  return block(ctx, value, width, 74, 400, 'title')
}
export async function renderFactsheetImage(sheet) {
  const [art] = await Promise.all([loadArtImage('index-magazine/editorial-triptych.webp'), loadEditorialFont()])
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer l’image')
  const count = sheet.constituents ?? sheet.indexFacts?.targetConstituents
  const badgeW = count == null ? 0 : 252
  const titleW = USABLE - (badgeW ? badgeW + 42 : 0)
  const title = heading(ctx, sheet.index ?? sheet.title, titleW)
  const subtitle = block(ctx, getIndexArt(sheet).description, titleW, 38, 700)
  const headerH = Math.max(230, title.height + subtitle.height + 42)
  const bands = [
    compositionBand(ctx, 'PAYS', sortedRows(sheet.countries).filter(([name]) => !/autres|others/i.test(name)).slice(0, 4).map(([name, value]) => [displayLabel(name), value])),
    compositionBand(ctx, 'SECTEURS', sortedRows(sheet.sectors).slice(0, 4).map(([name, value]) => [displayLabel(sectorLabel(name)), value])),
    compositionBand(ctx, 'ENTREPRISES', sortedRows(sheet.holdings).slice(0, 4).map(([name, value]) => [((sheet.compositionOnly || sheet.concentration?.available) ? compositionCompanyLabel : imageCompanyLabel)(name), value])),
  ]
  const returns = sheet.returns.slice().sort((a, b) => a[0] - b[0])
  // New complete years grow the strip in balanced rows instead of shrinking type.
  const perRow = Math.min(5, Math.max(1, Math.ceil(returns.length / Math.ceil(Math.max(1, returns.length) / 5))))
  const returnRows = []
  for (let i = 0; i < returns.length; i += perRow) {
    const entries = returns.slice(i, i + perRow), width = USABLE / entries.length
    const cells = entries.map(([year, value]) => ({ year: block(ctx, year, width - 24, 32), value: fit(ctx, percent(value, true), width - 28, 70), negative: value < 0 }))
    returnRows.push({ cells, width, height: Math.max(...cells.map(cell => cell.year.height + cell.value.height + 56)) })
  }
  const perfH = returns.length ? 65 + returnRows.reduce((sum, row) => sum + row.height, 0) + 16 : 0
  const concentrationH = sheet.concentration?.available ? 168 : 0
  const natural = PAD + headerH + 30 + concentrationH + bands.reduce((sum, band) => sum + band.height + GAP, 0) + perfH + 110
  const H = Math.ceil(Math.max(1600, natural))
  bands.forEach(band => { band.height += (H - natural) / bands.length })
  canvas.width = W; canvas.height = H
  paper(ctx, H)
  draw(ctx, title, PAD + 10, PAD)
  draw(ctx, subtitle, PAD + 10, PAD + title.height + 12)
  if (badgeW) {
    const x = W - PAD - badgeW
    panel(ctx, x, PAD, badgeW, 208)
    const number = fit(ctx, count.toLocaleString('fr-FR'), badgeW - 28, 97)
    draw(ctx, number, x + badgeW / 2, PAD + 26, 'center', C.paper)
    const caption = block(ctx, sheet.constituents == null ? 'sociétés visées' : 'titres', badgeW - 24, 27)
    draw(ctx, caption, x + badgeW / 2, PAD + 148, 'center', C.paper)
  }
  let y = PAD + headerH + 30
  if (concentrationH) {
    panel(ctx, PAD, y, USABLE, 144)
    draw(ctx, block(ctx, 'Poids des 10 premières entreprises', USABLE - 520, 46, 700), PAD + 28, y + 39, 'left', C.paper)
    draw(ctx, fit(ctx, percent(sheet.concentration.topWeight), 460, 100), W - PAD - 28, y + 14, 'right', C.paper)
    y += concentrationH
  }
  for (const [bandIndex, band] of bands.entries()) {
    panel(ctx, PAD, y, USABLE, band.height); illustration(ctx, art, bandIndex, y, band.height); category(ctx, band.label, y, band.height)
    const valueH = Math.max(...band.cells.map(cell => cell.value.height), 0)
    const nameH = Math.max(...band.cells.map(cell => cell.name.height), 0)
    const top = y + (band.height - valueH - nameH - 16) / 2
    band.cells.forEach((cell, i) => {
      const x = PAD + GUTTER + 16 + i * band.cellWidth, center = x + band.cellWidth / 2
      if (i) { ctx.fillStyle = C.rule; ctx.fillRect(x, y + 34, 1, band.height - 68) }
      draw(ctx, cell.value, center, top, 'center')
      draw(ctx, cell.name, center, top + valueH + 16, 'center')
    })
    y += band.height + GAP
  }
  if (returns.length) {
  panel(ctx, PAD, y, USABLE, perfH, true)
  const currency = factsheetCurrency(sheet)
  draw(ctx, block(ctx, `PERFORMANCES ANNUELLES${currency ? ` EN ${currency}` : ''}`, USABLE - 72, 31, 400, true), PAD + 36, y + 22, 'left', C.background)
  let ry = y + 65
  for (const row of returnRows) {
    row.cells.forEach((cell, i) => {
      const x = PAD + i * row.width, center = x + row.width / 2
      if (i) { ctx.fillStyle = C.rule; ctx.fillRect(x, ry + 20, 1, row.height - 34) }
      draw(ctx, cell.year, center, ry + 21, 'center', C.background)
      draw(ctx, cell.value, center, ry + 30 + cell.year.height, 'center', cell.negative ? C.negative : C.background)
    })
    ry += row.height
  }
  }
  draw(ctx, block(ctx, 'Épargnant Libre', USABLE, 39, 400, true), W / 2, H - 66, 'center')
  return canvas
}


// No logo request participates in rendering: this canvas is self-contained.
function compositionCompanyLabel(name) {
  const aliases = {
    'SIEMENS ENERGY AG': 'Siemens Energy', 'SIEMENS HEALTHINEERS AG': 'Siemens Healthineers',
    'AIRBUS SE-BERLIN': 'Airbus', 'AIRBUS SE PARIS': 'Airbus',
    'DEUTSCHE TELEKOM NAM (XETRA)': 'Deutsche Telekom', 'INFINEON TECHNOLOGIES AG': 'Infineon',
    'MUENCHENER RUECKVER AG-REG': 'Munich Re', 'DEUTSCHE BANK NAMEN': 'Deutsche Bank', 'DHL GROUP (XETRA)': 'DHL Group',
    'GOLDMAN SACHS GROUP INC': 'Goldman Sachs', 'CATERPILLAR INC': 'Caterpillar', 'AMGEN INC': 'Amgen',
    'UNITEDHEALTH GROUP INC': 'UnitedHealth', 'TRAVELERS COMPANIES': 'Travelers', 'SHERWIN-WILLIAMS CO/THE': 'Sherwin-Williams',
    'VISA INC-CLASS A SHARES': 'Visa', 'ALPHABET INC CL A': 'Alphabet', 'TESLA INC': 'Tesla', 'ELI LILLY': 'Eli Lilly',
    'SK HYNIX': 'SK Hynix', 'SK SQUARE': 'SK Square', 'SAMSUNG ELECTRO MECHANICS LTD': 'Samsung Electro-Mechanics',
    'KB FINANCIAL GROUP': 'KB Financial', 'SHINHAN FINANCIAL GROUP': 'Shinhan Financial', 'SAMSUNG SDI LTD': 'Samsung SDI',
    'HANA FINANCIAL GROUP': 'Hana Financial', 'CELLTRION': 'Celltrion',
    'LVMH MOET HENNESSY LOUIS VUI': 'LVMH', 'L OREAL (PARIS)': 'L’Oréal', 'SANOFI - PARIS': 'Sanofi', 'AXA SA': 'AXA',
  }
  if (aliases[name.toUpperCase()]) return aliases[name.toUpperCase()]
  return imageCompanyLabel(name)
}

export async function renderCompositionImage(sheet, composition) {
  if (!composition?.available) throw new Error('Composition indisponible')
  await loadEditorialFont()
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer l’image')
  const width = 1200, margin = 48, columnW = 534, gap = 36
  const colors = ['#c4dec2','#73ac91','#e1d4a7','#4c967f','#acc7aa','#8aafba','#d1bba3','#528778','#adc3d0','#9aaf7c','#204d3e']
  const values = roundedComposition(composition)
  const entries = [...composition.top.map((row, i) => ({ name: compositionCompanyLabel(row.name), value: values[i], weight: row.weightPct, color: colors[i] })),
    { name: 'Autres entreprises', value: values[10], weight: composition.otherWeight, color: colors[10] }]
  const title = block(ctx, sheet.index ?? sheet.title, width - margin * 2, 80, 400, true)
  const titleY = 38, donutTop = titleY + title.height + 22, diameter = 660
  const legendTop = donutTop + diameter + 22
  const rows = []
  for (let i = 0; i < entries.length; i += 2) {
    const cells = entries.slice(i, i + 2).map(entry => ({ ...entry,
      label: block(ctx, `${entry.name} · ${percent(entry.value).replace(' %', '\u00a0%')}`, columnW - 40, 42, 400, true) }))
    rows.push({ cells, height: Math.max(...cells.map(cell => cell.label.height)) + 26 })
  }
  const height = Math.ceil(legendTop + rows.reduce((sum, row) => sum + row.height, 0) + 82)
  canvas.width = width; canvas.height = height
  paper(ctx, height, width)
  draw(ctx, title, width / 2, titleY, 'center')
  const cx = width / 2, cy = donutTop + diameter / 2, outer = diameter / 2, inner = 210
  let angle = -Math.PI / 2
  for (const entry of entries) {
    const end = angle + entry.weight / 100 * Math.PI * 2
    if (end > angle) {
      ctx.beginPath(); ctx.arc(cx, cy, outer, angle, end); ctx.arc(cx, cy, inner, end, angle, true); ctx.closePath()
      ctx.fillStyle = entry.color; ctx.fill()
      // Thin separators preserve very small slices, with their values in the legend.
      ctx.strokeStyle = C.background; ctx.lineWidth = 1.5; ctx.stroke()
    }
    angle = end
  }
  const center = fit(ctx, percent(composition.topWeight), inner * 2 - 22, 86, 65)
  draw(ctx, center, cx, cy - 62, 'center')
  draw(ctx, block(ctx, 'Top 10', inner * 2 - 20, 45, 400, true), cx, cy + 54, 'center')
  let y = legendTop
  for (const row of rows) {
    row.cells.forEach((entry, i) => {
      const x = margin + i * (columnW + gap)
      ctx.fillStyle = entry.color; ctx.beginPath(); ctx.roundRect(x, y + 10, 22, 30, 5); ctx.fill()
      draw(ctx, entry.label, x + 38, y)
    })
    y += row.height
  }
  draw(ctx, block(ctx, 'Épargnant Libre', width - 96, 36, 400, true), width / 2, height - 57, 'center')
  return canvas
}
