// Affiche éditoriale, une image PNG pour la famille d'indices sélectionnée.
// Les valeurs proviennent exclusivement de data.js et des YTD saisis dans le formulaire.
const PALETTE = {
  paper: '#f5f2e8', ink: '#0f2930', muted: '#586c6c', line: '#bcc9c2',
  emerald: '#05766a', ochre: '#be754e', blue: '#467888', gold: '#d2ae70', brand: '#0c554e',
}
const COLORS = [PALETTE.emerald, PALETTE.ochre, PALETTE.blue, '#77678b', '#9b7055']
const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = 'Arial, "Helvetica Neue", sans-serif'

function label(ctx, value, x, y, size, color, weight = 400, family = SANS, align = 'left') {
  ctx.font = `${weight} ${size}px ${family}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(String(value), x, y)
  ctx.textAlign = 'left'
}

function wrapped(ctx, value, x, y, width, size, color, weight = 400, lineHeight = 1.25) {
  ctx.font = `${weight} ${size}px ${SANS}`
  const words = String(value).split(/\s+/)
  let row = ''
  for (const word of words) {
    const next = row ? `${row} ${word}` : word
    if (ctx.measureText(next).width > width && row) {
      label(ctx, row, x, y, size, color, weight)
      y += size * lineHeight
      row = word
    } else row = next
  }
  if (row) {
    label(ctx, row, x, y, size, color, weight)
    y += size * lineHeight
  }
  return y
}

function rule(ctx, x, y, length, color, thickness = 2) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, length, thickness)
}

function percent(value) {
  if (value === '' || value === null || value === undefined) return 'À compléter'
  const n = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(n)) return 'À compléter'
  return `${n > 0 ? '+' : ''}${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

function count(index, family) {
  const chain = family.diversification?.chain || []
  const name = index.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const match = chain.find((item) => item.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(name))
  return match?.match(/\((\d[\d\s]*)\s*(?:lignes)?\)/)?.[1]?.replace(/\s/g, '') || null
}

function matchingPerformance(index, family, position) {
  const normalized = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const key = normalized(index.name)
  return family.perfFunds.find((f) => normalized(f.label).includes(key))
    || (family.perfFunds.length === family.indices.length ? family.perfFunds[position] : null)
}

export async function renderIndexImage(family, perfValues = {}) {
  await document.fonts.ready
  const indices = family.indices
  const COL = 745, PAD = 95, W = Math.max(2400, PAD * 2 + COL * indices.length - 65)
  const groups = indices.map((index) => family.etfGroups.find((g) => g.indexName === index.name)
    || family.etfGroups.find((g) => g.indexName.toLowerCase().includes(index.name.toLowerCase()))
    || null)
  const longest = Math.max(...groups.map((g) => g?.funds?.length || 0), 1)
  const perfTop = 1818 + Math.max(0, longest - 2) * 410
  const H = perfTop + 632 + (Object.values(perfValues).some((value) => value?.ytdEnabled) ? 150 : 0)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'top'
  ctx.fillStyle = PALETTE.paper
  ctx.fillRect(0, 0, W, H)
  rule(ctx, 0, 0, W, PALETTE.gold, 23)

  // En-tête centré et détails graphiques discrets de la maquette émeraude/or.
  ctx.fillStyle = '#e5dcc7'
  ctx.beginPath(); ctx.moveTo(0, 23); ctx.lineTo(255, 23); ctx.lineTo(0, 245); ctx.fill()
  ctx.beginPath(); ctx.moveTo(W, 23); ctx.lineTo(W - 255, 23); ctx.lineTo(W, 245); ctx.fill()
  label(ctx, '@Epargnantlibre', W / 2, 62, 41, PALETTE.brand, 700, SANS, 'center')
  const title = family.id === 'europe' ? 'EUROPE' : family.label.replace(/^[^\p{L}\p{N}]+/u, '').toLocaleUpperCase('fr-FR')
  const titleSize = Math.min(181, Math.floor((W - 360) / Math.max(title.length * 0.68, 1)))
  label(ctx, title, W / 2, 130, titleSize, '#0d4944', 700, SERIF, 'center')
  label(ctx, `${indices.length} INDICES  /  ${groups.reduce((n, g) => n + (g?.funds?.length || 0), 0)} ETF`, W / 2, 345, 58, PALETTE.ink, 700, SANS, 'center')
  label(ctx, 'Une comparaison en un coup d’œil', W / 2, 420, 44, PALETTE.muted, 400, SANS, 'center')
  rule(ctx, PAD, 498, W - PAD * 2, PALETTE.gold, 7)

  indices.forEach((index, i) => {
    const x = PAD + i * COL, color = COLORS[i % COLORS.length], group = groups[i]
    if (i) rule(ctx, x - 27, 548, 3, PALETTE.line, perfTop + 490 - 548)
    const number = count(index, family)
    if (number) {
      rule(ctx, x, 592, 24, color, 152)
      label(ctx, number, x + 48, 550, 161, color, 700, SERIF)
    } else {
      rule(ctx, x, 592, 24, color, 152)
      label(ctx, String(i + 1).padStart(2, '0'), x + 48, 550, 150, color, 700, SERIF)
    }
    wrapped(ctx, index.name.toUpperCase(), x, 770, COL - 68, 59, PALETTE.ink, 700, 1.08)
    rule(ctx, x, 865, COL - 65, color, 11)
    label(ctx, 'ETF  /  ISIN  /  FRAIS', x, 900, 43, PALETTE.muted, 700)
    let y = 974
    for (const fund of group?.funds || []) {
      const europeNames = {
        FR0011550193: 'ETZ · BNP Easy', LU0908500753: 'Amundi Core',
        IE00B53L3W79: 'iShares Core (Acc)', IE00B4K6B022: 'HSBC EURO STOXX 50',
        FR0013412038: 'PCEU · Amundi PEA',
      }
      const shortName = family.id === 'europe' && europeNames[fund.isin]
        ? europeNames[fund.isin]
        : fund.ticker ? `${fund.ticker} · ${fund.name.split(' ')[0]}` : fund.name.replace(/ UCITS ETF.*$/i, '')
      y = wrapped(ctx, shortName, x, y, COL - 60, 51, PALETTE.ink, 700, 1.15)
      const placement = /CTO uniquement/i.test(fund.note || '') || group.pea === false ? 'CTO' : 'PEA'
      label(ctx, `${fund.isin} · ${placement}`, x, y + 12, 43, PALETTE.muted)
      label(ctx, fund.ter, x, y + 77, 88, color, 700)
      if (fund.aum) label(ctx, fund.aum.replace(/ au .*/, ''), x, y + 184, 43, PALETTE.muted)
      y = Math.max(y + 240, y + 324 - 59)
    }
    if (group?.narrativeNote) wrapped(ctx, 'Pas d’ETF directement disponible pour cet indice.', x, 985, COL - 65, 45, PALETTE.muted)
    if (!group) wrapped(ctx, 'Aucun ETF listé pour cet indice.', x, 985, COL - 65, 45, PALETTE.muted)

    label(ctx, 'PERFORMANCES', x, perfTop, 47, PALETTE.ink, 700)
    const perf = matchingPerformance(index, family, i)
    const extra = perfValues[perf?.key]
    if (perf?.perfNote || !perf) wrapped(ctx, perf?.perfNote || 'Historique non disponible.', x, perfTop + 89, COL - 65, 42, PALETTE.muted)
    const rows = perf?.perfNote || !perf ? [] : [['2023', perf.y2023], ['2024', perf.y2024], ['2025', perf.y2025]]
    if (extra?.ytdEnabled) rows.push(['YTD', extra.ytd])
    rows.forEach(([year, value], j) => {
      const yy = perfTop + 89 + j * 131
      label(ctx, year, x, yy, 48, PALETTE.muted)
      label(ctx, percent(value), x + 208, yy, value == null ? 42 : 57, PALETTE.ink, 700)
      rule(ctx, x, yy + 96, COL - 65, PALETTE.line)
    })
  })

  rule(ctx, 0, H - 80, W, PALETTE.brand, 80)
  label(ctx, 'ÉPARGNANT LIBRE', W / 2, H - 53, 37, PALETTE.paper, 700, SANS, 'center')
  return canvas
}

export async function downloadIndexImage(family, perfValues) {
  const canvas = await renderIndexImage(family, perfValues)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Impossible de générer le PNG')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `comparateur-indices-${family.id}.png`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
