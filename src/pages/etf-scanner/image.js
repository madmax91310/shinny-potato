import { percent, compare } from './lib.js'
import { displayLabel } from './data.js'

// Fixed editorial grid: long names and all twelve allocations keep their own space.
export function renderScannerImage(a, b, lines, label) {
  const result = b ?? a, canvas = document.createElement('canvas')
  const allocationRows = Math.ceil(lines.length / 3), footerY = 922 + Math.max(0, allocationRows - 1) * 46
  canvas.width = 1600; canvas.height = footerY + 140
  const c = canvas.getContext('2d')
  const ink = '#173c32', muted = '#64776f', green = '#26785a', paper = '#f4f7f4', rule = '#dce6df'
  c.fillStyle = paper; c.fillRect(0, 0, canvas.width, canvas.height)
  function text(value, x, y, size = 26, color = ink, bold = false, width = 1472) {
    c.fillStyle = color; c.font = `${bold ? '600' : '400'} ${size}px Arial`
    const source = String(value); let s = source
    while (c.measureText(s).width > width && s.length) s = s.slice(0, -1)
    if (s !== source) {
      while (c.measureText(s + '…').width > width && s.length) s = s.slice(0, -1)
      s += '…'
    }
    c.fillText(s, x, y)
  }
  function card(x, y, w, h, color = '#ffffff') {
    c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, 22); c.fill()
  }
  function line(x, y, w) { c.strokeStyle = rule; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke() }
  text('ÉPARGNANT LIBRE', 64, 60, 22, green, true)
  text(b ? 'ALLOCATION APRÈS' : 'SCANNER ETF', 1210, 60, 20, muted, true, 326)
  text('Ton portefeuille, en clair', 64, 132, 62, ink, true)
  text(result.complete ? 'Les compositions complètes de tes ETF, réunies par titre.' : `Analyse partielle · ${percent(result.analyzedWeight)} du portefeuille couvert`, 64, 180, 27, muted)
  const metrics = [['Titres actions identifiés', result.positions.length.toLocaleString('fr-FR')], ['Poids des 10 premières lignes', percent(result.top10)], ['Poids des titres communs', percent(result.sharedWeight)]]
  metrics.forEach(([name, value], i) => {
    const x = 64 + i * 498, dark = i === 1
    card(x, 214, 476, 138, dark ? ink : '#ffffff')
    text(name, x + 26, 251, 22, dark ? '#c8ded4' : muted, false, 424)
    text(value, x + 26, 324, 58, dark ? '#ffffff' : ink, true, 424)
  })
  card(64, 382, 922, 414); card(1010, 382, 526, 414)
  text('Les 5 premières positions', 92, 429, 29, ink, true, 860)
  text('Poids dans le portefeuille', 92, 466, 21, muted)
  const top = result.positions.slice(0, 5), maxWeight = Math.max(1, top[0]?.weight ?? 0)
  top.forEach((r, i) => {
    const y = 516 + i * 53
    text(String(i + 1).padStart(2, '0'), 92, y, 20, muted)
    text(r.name, 140, y, 25, ink, i === 0, 480)
    c.fillStyle = rule; c.beginPath(); c.roundRect(648, y - 15, 180, 8, 4); c.fill()
    c.fillStyle = green; c.beginPath(); c.roundRect(648, y - 15, 180 * r.weight / maxWeight, 8, 4); c.fill()
    text(percent(r.weight), 854, y, 25, ink, true, 110)
    if (i < top.length - 1) line(140, y + 18, 818)
  })
  text('Principaux pays', 1040, 429, 29, ink, true, 466)
  result.countries.slice(0, 4).forEach((r, i) => {
    const y = 484 + i * 52
    text(displayLabel(r.name), 1040, y, 25, ink, false, 330)
    text(percent(r.weight), 1392, y, 24, green, true, 120)
  })
  line(1040, 676, 466)
  const sector = result.sectors[0]
  text('Premier secteur', 1040, 715, 21, muted)
  text(sector ? `${displayLabel(sector.name)} · ${percent(sector.weight)}` : 'Non renseigné', 1040, 758, 27, ink, true, 466)
  text(b ? 'Ta répartition après' : 'Ta répartition', 64, 843, 27, ink, true)
  lines.forEach((l, i) => {
    const rows = Math.ceil(lines.length / 3), col = Math.floor(i / rows), row = i % rows
    const x = 64 + col * 498, y = 880 + row * 46
    text(percent(l.weight), x, y, 24, green, true, 95)
    text(label(l.isin).replace(/^iShares (?:Core )?/, '').replace(/\bUCITS ETF\b/g, '').replace(/\s+/g, ' ').trim(), x + 100, y, 22, ink, false, 366)
    text(l.isin, x + 100, y + 19, 15, muted, false, 366)
  })
  const delta = b && compare(a, b)
  line(64, footerY, 1472)
  text(delta ? `Concentration des 10 premières lignes : ${percent(a.top10)} avant → ${percent(b.top10)} après` : `${result.sharedCount.toLocaleString('fr-FR')} titres présents dans plusieurs ETF · Actions identifiées : ${percent(result.identifiedWeight)}`, 64, footerY + 38, 24, ink, true)
  const dates = [...new Set(result.sources.map(s => s.asOf))].sort().join(' / ')
  text(`Compositions au ${dates} · Sources des fonds dans l’export JSON`, 64, footerY + 83, 20, muted)
  text('Rapprochement par ISIN · Classes d’actions distinctes · Liquidités et dérivés hors doublons', 64, footerY + 114, 20, muted)
  return canvas
}
