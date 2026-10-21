import { roundedComposition } from '../../data/index-concentration-core.js'
import { loadEditorialFont } from '../../lib/art-resources.js'
import { getIndexArt } from './visualIdentity.js'
import { companyLabel, plainLabel, sectorLabel, sortedRows } from './editorial.js'

// Approved proposal 3: raised ivory bands, green category tabs and large live
// values. No raster contains data; composition and return dates stay independent.
const W = 1600, PAD = 44, GAP = 24, USABLE = W - PAD * 2, GUTTER = 266
const C = { ink: '#103728', green: '#214a37', paper: '#f8f3e8', gold: '#b49750', rule: '#d7ceba', negative: '#982f35' }
const font = (ctx, size, weight = 400, serif = false) => { ctx.font = `${serif ? 400 : weight} ${size}px ${serif === 'display' ? 'IndexDisplay, sans-serif' : serif ? 'ExportEditorial, Georgia, serif' : 'Arial, sans-serif'}` }
let displayReady
function loadDisplayFont() {
  if (!displayReady) displayReady = new FontFace('IndexDisplay', `url("${import.meta.env.BASE_URL}asset-art/purchasing-power/anton.ttf")`).load()
    .then(face => { document.fonts.add(face) }).catch(error => { displayReady = undefined; throw error })
  return displayReady
}
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
function fit(ctx, text, width, size, min = 48, serif = 'display') {
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
function performanceNote(sheet) {
  let detail = sheet.performance.detail
  for (const name of [sheet.index, sheet.title].filter(Boolean)) if (detail.startsWith(name)) detail = detail.slice(name.length).replace(/^[\s,·]+/, '')
  detail = detail.replace('rendements nets en dollars', 'USD · rendement net')
    .replace('rendement brut en dollars', 'USD · rendement brut')
    .replace('rendement total en dollars', 'USD · rendement total')
    .replace('rendement net en euros', 'EUR · rendement net')
    .replace('en EUR, dividendes nets réinvestis', 'EUR · dividendes nets réinvestis')
    .replace(' ; secteurs selon la classification ICB de FTSE', ' · secteurs ICB')
  return [detail, sheet.performance.date, sheet.performance.currencyNote, sheet.performance.historyNote].filter(Boolean).join(' · ')
}
let grain
function paper(ctx, height) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, height)
  if (!grain) {
    grain = document.createElement('canvas'); grain.width = grain.height = 96
    const g = grain.getContext('2d'), data = g.createImageData(96, 96); let seed = 78
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      data.data[i] = data.data[i + 1] = data.data[i + 2] = seed & 256 ? 255 : 70
      data.data[i + 3] = (seed >>> 24) % 5
    }
    g.putImageData(data, 0, 0)
  }
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, height)
}
function shape(ctx, x, y, width, height, notch = 12) {
  ctx.beginPath(); ctx.moveTo(x + notch, y); ctx.lineTo(x + width - notch, y); ctx.lineTo(x + width, y + notch)
  ctx.lineTo(x + width, y + height - notch); ctx.lineTo(x + width - notch, y + height)
  ctx.lineTo(x + notch, y + height); ctx.lineTo(x, y + height - notch); ctx.lineTo(x, y + notch); ctx.closePath()
}
function panel(ctx, x, y, width, height, green = false) {
  ctx.save(); ctx.shadowColor = '#69563036'; ctx.shadowBlur = 13; ctx.shadowOffsetY = 8
  shape(ctx, x, y, width, height); ctx.fillStyle = green ? C.green : '#fffaf0'; ctx.fill(); ctx.restore()
  const wash = ctx.createLinearGradient(x, y, x + width * .3, y + height)
  wash.addColorStop(0, green ? '#315c45' : '#fffdf5'); wash.addColorStop(1, green ? '#193c2c' : '#f2ebda')
  shape(ctx, x, y, width, height); ctx.fillStyle = wash; ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + 14, y + 3); ctx.lineTo(x + width - 14, y + 3); ctx.strokeStyle = '#ffffff95'; ctx.stroke()
}
function category(ctx, label, y, height) {
  ctx.beginPath(); ctx.moveTo(PAD + 12, y); ctx.lineTo(PAD + GUTTER - 30, y); ctx.lineTo(PAD + GUTTER, y + height / 2)
  ctx.lineTo(PAD + GUTTER - 30, y + height); ctx.lineTo(PAD + 12, y + height); ctx.lineTo(PAD, y + height - 12); ctx.lineTo(PAD, y + 12); ctx.closePath()
  ctx.fillStyle = C.green; ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke()
  const b = fit(ctx, label, GUTTER - 62, 36, 30)
  draw(ctx, b, PAD + 25, y + (height - b.height) / 2 - 5, 'left', C.paper)
  ctx.fillStyle = C.gold; ctx.fillRect(PAD + 25, y + (height + b.height) / 2 + 13, 48, 2)
}
function compositionBand(ctx, label, rows) {
  const cellWidth = (USABLE - GUTTER - 16) / Math.max(1, rows.length)
  const cells = rows.map(([name, value]) => ({
    value: fit(ctx, percent(value), cellWidth - 30, rows.length === 1 ? 104 : 86, 58),
    name: block(ctx, name, cellWidth - 34, rows.length === 1 ? 46 : 38, 400, 'display'),
  }))
  return { label, cells, cellWidth, height: Math.max(210, ...cells.map(cell => cell.value.height + cell.name.height + 64)) }
}
export async function renderFactsheetImage(sheet) {
  await Promise.all([loadEditorialFont(), loadDisplayFont()])
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer l’image')
  const count = sheet.constituents ?? sheet.indexFacts?.targetConstituents
  const badgeW = count == null ? 0 : 252
  const titleW = USABLE - (badgeW ? badgeW + 42 : 0)
  const title = block(ctx, sheet.index ?? sheet.title, titleW, 112, 700, 'display')
  const subtitle = block(ctx, getIndexArt(sheet).description, titleW, 38, 700)
  const date = sheet.indexFacts?.asOf
  const compositionDate = block(ctx, `Composition ${date ? `au ${date.split('-').reverse().join('/')}` : `: ${sheet.snapshot ?? 'archive non datée'}`}`, titleW, 29)
  const headerH = Math.max(225, title.height + subtitle.height + compositionDate.height + 33)
  const bands = [
    compositionBand(ctx, 'PAYS', sortedRows(sheet.countries).filter(([name]) => !/autres|others/i.test(name)).slice(0, 4).map(([name, value]) => [displayLabel(name), value])),
    compositionBand(ctx, 'SECTEURS', sortedRows(sheet.sectors).slice(0, 4).map(([name, value]) => [displayLabel(sectorLabel(name)), value])),
    compositionBand(ctx, 'ENTREPRISES', sortedRows(sheet.holdings).slice(0, 4).map(([name, value]) => [((sheet.compositionOnly || sheet.concentration?.available) ? compositionCompanyLabel : imageCompanyLabel)(name), value])),
  ]
  const returns = sheet.returns.slice().sort((a, b) => a[0] - b[0])
  // New complete years grow the strip in balanced rows instead of shrinking type.
  const perRow = Math.min(6, Math.max(1, Math.ceil(returns.length / Math.ceil(Math.max(1, returns.length) / 6))))
  const returnRows = []
  for (let i = 0; i < returns.length; i += perRow) {
    const entries = returns.slice(i, i + perRow), width = USABLE / entries.length
    const cells = entries.map(([year, value]) => ({ year: block(ctx, year, width - 24, 32), value: fit(ctx, percent(value, true), width - 28, 70), negative: value < 0 }))
    returnRows.push({ cells, width, height: Math.max(...cells.map(cell => cell.year.height + cell.value.height + 56)) })
  }
  const note = block(ctx, performanceNote(sheet), USABLE - 44, 27)
  const perfH = returns.length ? 65 + returnRows.reduce((sum, row) => sum + row.height, 0) + note.height + 24 : 0
  const concentrationH = sheet.concentration?.available ? 168 : 0
  const natural = PAD + headerH + 30 + concentrationH + bands.reduce((sum, band) => sum + band.height + GAP, 0) + perfH + 78
  const H = Math.ceil(Math.max(1600, natural))
  bands.forEach(band => { band.height += (H - natural) / bands.length })
  canvas.width = W; canvas.height = H
  paper(ctx, H)
  draw(ctx, title, PAD + 10, PAD)
  draw(ctx, subtitle, PAD + 10, PAD + title.height + 12)
  draw(ctx, compositionDate, PAD + 10, PAD + title.height + 12 + subtitle.height + 16)
  if (badgeW) {
    const x = W - PAD - badgeW
    panel(ctx, x, PAD, badgeW, 208, true)
    const number = fit(ctx, count.toLocaleString('fr-FR'), badgeW - 28, 97)
    draw(ctx, number, x + badgeW / 2, PAD + 26, 'center', C.paper)
    const caption = block(ctx, sheet.constituents == null ? 'sociétés visées' : 'titres', badgeW - 24, 27)
    draw(ctx, caption, x + badgeW / 2, PAD + 148, 'center', C.paper)
  }
  let y = PAD + headerH + 30
  if (concentrationH) {
    panel(ctx, PAD, y, USABLE, 144, true)
    draw(ctx, block(ctx, 'Poids des 10 premières entreprises', USABLE - 520, 46, 700), PAD + 28, y + 39, 'left', C.paper)
    draw(ctx, fit(ctx, percent(sheet.concentration.topWeight), 460, 100), W - PAD - 28, y + 14, 'right', C.paper)
    y += concentrationH
  }
  for (const band of bands) {
    panel(ctx, PAD, y, USABLE, band.height); category(ctx, band.label, y, band.height)
    const valueH = Math.max(...band.cells.map(cell => cell.value.height), 0)
    const nameH = Math.max(...band.cells.map(cell => cell.name.height), 0)
    const top = y + (band.height - valueH - nameH - 7) / 2
    band.cells.forEach((cell, i) => {
      const x = PAD + GUTTER + 16 + i * band.cellWidth, center = x + band.cellWidth / 2
      if (i) { ctx.fillStyle = C.rule; ctx.fillRect(x, y + 34, 1, band.height - 68) }
      draw(ctx, cell.value, center, top, 'center')
      draw(ctx, cell.name, center, top + valueH + 7, 'center')
    })
    y += band.height + GAP
  }
  if (returns.length) {
  panel(ctx, PAD, y, USABLE, perfH)
  ctx.fillStyle = C.green; ctx.fillRect(PAD + 1, y + 1, USABLE - 2, 63)
  draw(ctx, block(ctx, 'PERFORMANCES ANNUELLES', USABLE - 48, 32, 700), PAD + 24, y + 17, 'left', C.paper)
  let ry = y + 65
  for (const row of returnRows) {
    row.cells.forEach((cell, i) => {
      const x = PAD + i * row.width, center = x + row.width / 2
      if (i) { ctx.fillStyle = C.rule; ctx.fillRect(x, ry + 20, 1, row.height - 34) }
      draw(ctx, cell.year, center, ry + 21, 'center')
      draw(ctx, cell.value, center, ry + 30 + cell.year.height, 'center', cell.negative ? C.negative : C.ink)
    })
    ry += row.height
  }
  draw(ctx, note, PAD + 22, ry + 4)
  }
  draw(ctx, block(ctx, 'Épargnant Libre', USABLE, 33, 400, true), W / 2, H - 53, 'center')
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
  await Promise.all([loadEditorialFont(), loadDisplayFont()])
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer l’image')
  const width = 1200, margin = 48, columnW = 534, gap = 36
  const colors = ['#214a37','#b49750','#497e63','#d3a766','#7a9d85','#685b39','#87b4a3','#b87950','#366b73','#967b93','#ddd5c3']
  const values = roundedComposition(composition)
  const entries = [...composition.top.map((row, i) => ({ name: compositionCompanyLabel(row.name), value: values[i], weight: row.weightPct, color: colors[i] })),
    { name: 'Autres entreprises', value: values[10], weight: composition.otherWeight, color: colors[10] }]
  const title = block(ctx, sheet.index ?? sheet.title, width - margin * 2, 80, 700, 'display')
  const titleY = 38, donutTop = titleY + title.height + 22, diameter = 660
  const legendTop = donutTop + diameter + 22
  const rows = []
  for (let i = 0; i < entries.length; i += 2) {
    const cells = entries.slice(i, i + 2).map(entry => ({ ...entry,
      label: block(ctx, `${entry.name} · ${percent(entry.value).replace(' %', '\u00a0%')}`, columnW - 40, 42, 400, 'display') }))
    rows.push({ cells, height: Math.max(...cells.map(cell => cell.label.height)) + 26 })
  }
  const height = Math.ceil(legendTop + rows.reduce((sum, row) => sum + row.height, 0) + 82)
  canvas.width = width; canvas.height = height
  // Same ivory, green and gold palette as the original image.
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, width, height)
  draw(ctx, title, width / 2, titleY, 'center')
  const cx = width / 2, cy = donutTop + diameter / 2, outer = diameter / 2, inner = 210
  let angle = -Math.PI / 2
  for (const entry of entries) {
    const end = angle + entry.weight / 100 * Math.PI * 2
    if (end > angle) {
      ctx.beginPath(); ctx.arc(cx, cy, outer, angle, end); ctx.arc(cx, cy, inner, end, angle, true); ctx.closePath()
      ctx.fillStyle = entry.color; ctx.fill()
      // Thin separators preserve very small slices, with their values in the legend.
      ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke()
    }
    angle = end
  }
  const center = fit(ctx, percent(composition.topWeight), inner * 2 - 22, 86, 65)
  draw(ctx, center, cx, cy - 62, 'center')
  draw(ctx, block(ctx, 'Top 10', inner * 2 - 20, 45, 400, 'display'), cx, cy + 54, 'center')
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
