import { percent, compare } from './lib.js'
import { displayLabel } from './data.js'
export function renderScannerImage(a, b, lines, label) {
  const result = b ?? a, canvas = document.createElement('canvas')
  canvas.width = 1600; canvas.height = 1200
  const c = canvas.getContext('2d')
  const ink = '#20392f', green = '#317a58', cream = '#f7f2e8', accent = '#d9b769'
  c.fillStyle = cream; c.fillRect(0, 0, 1600, 1200)
  const text = (s, x, y, size = 28, color = ink, bold = false, max = 1430) => {
    c.fillStyle = color; c.font = `${bold ? 'bold ' : ''}${size}px Arial`
    while (c.measureText(s).width > max && size > 16) { size--; c.font = `${bold ? 'bold ' : ''}${size}px Arial` }
    c.fillText(s, x, y)
  }
  text('Ce que tes ETF ont en commun', 75, 85, 54, ink, true)
  text(lines.map(l => `${percent(l.weight)} ${label(l.isin)}`).join('  ·  '), 75, 140, 26)
  const metrics = [ ['Titres actions identifiés', result.positions.length.toLocaleString('fr-FR')], ['Poids des 10 premières lignes', percent(result.top10)], ['Titres présents dans plusieurs ETF', percent(result.sharedWeight)] ]
  metrics.forEach(([name, value], i) => {
    const x = 75 + i * 495
    c.fillStyle = i === 1 ? green : '#e9e2d2'; c.fillRect(x, 180, 465, 155)
    text(name, x + 24, 225, 23, i === 1 ? '#ffffff' : ink, false, 420)
    text(value, x + 24, 295, 55, i === 1 ? '#ffffff' : ink, true)
  })
  text('Principales positions', 75, 405, 34, ink, true)
  result.positions.slice(0, 7).forEach((r, i) => {
    const y = 465 + i * 65
    text(r.name, 75, y, 26, ink, false, 620)
    c.fillStyle = '#e9e2d2'; c.fillRect(735, y - 24, 240, 24)
    c.fillStyle = green; c.fillRect(735, y - 24, 240 * r.weight / Math.max(1, result.positions[0].weight), 24)
    text(percent(r.weight), 1000, y, 27, ink, true)
  })
  text('Pays', 1170, 405, 32, ink, true, 350)
  result.countries.slice(0, 4).forEach((r, i) => { text(displayLabel(r.name), 1170, 461 + i * 58, 24, ink, false, 350); text(percent(r.weight), 1170, 487 + i * 58, 22, green, true) })
  text('Premier secteur', 1170, 755, 27, ink, true, 350)
  text(displayLabel(result.sectors[0].name), 1170, 800, 23, ink, false, 350)
  text(percent(result.sectors[0].weight), 1170, 835, 32, green, true)
  const delta = b && compare(a, b)
  c.fillStyle = accent; c.fillRect(75, 930, 1450, 70)
  text(delta ? `10 premières lignes : ${percent(a.top10)} avant → ${percent(b.top10)} après` : `Compositions couvertes : ${percent(result.analyzedWeight)} du portefeuille`, 100, 975, 29, ink, true, 1400)
  const dates = [...new Set(result.sources.map(s => s.asOf))].sort().join(' / ')
  text(`Compositions des fonds : ${dates} · Source : iShares / BlackRock`, 75, 1048, 24)
  text(`Rapprochement par ISIN · Actions identifiées : ${percent(result.identifiedWeight)} du portefeuille`, 75, 1090, 23)
  text(`${result.complete ? '' : 'Analyse partielle · '}Liquidités et dérivés hors doublons · Pas un conseil financier`, 75, 1130, 23)
  text('Épargnant Libre', 1255, 1174, 23, green, true, 270)
  return canvas
}
