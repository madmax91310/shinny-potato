import { GROUPS, periodLabel, signedFlow, publicScope } from './lib.js'
export function renderFlowImage(o, rows, archive = false, {manual = false} = {}) {
  if (!rows.length || rows.length > 10) throw Error('Sélectionner entre 1 et 10 lignes pour un visuel lisible.')
  const groups = manual ? [{title:'Flux sélectionnés',rows}] : Object.entries(GROUPS).map(([id, title]) => ({title, rows: rows.filter(r => r.group === id)})).filter(g => g.rows.length)
  const canvas = document.createElement('canvas'), width = 1200
  canvas.width = width; canvas.height = Math.max(960, 400 + rows.length * 110 + groups.length * 70)
  const c = canvas.getContext('2d'), height = canvas.height
  c.fillStyle = '#f6f0e3'; c.fillRect(0,0,width,height)
  c.fillStyle = '#163d35'; c.fillRect(0,0,18,height)
  c.font = 'bold 64px Arial'; c.fillText('Où va l’argent des ETF ?',64,100)
  c.font = '32px Arial'; c.fillText(`${archive ? 'ARCHIVES · ' : ''}${periodLabel(o)}`,64,158)
  c.font = '30px Arial'; c.fillText(manual ? 'Chiffres relevés manuellement' : publicScope(o),64,207)
  c.font = '24px Arial'; c.fillText(`Sélection · Flux nets en ${o.currency}`,64,251)
  c.font = '26px Arial'
  if (c.measureText(o.universe.label).width > 1072) throw Error('Libellé de périmètre trop long pour le visuel.')
  c.fillText(o.universe.label,64,290)
  let y = 350
  for (const g of groups) {
    c.fillStyle = '#163d35'; c.font = 'bold 32px Arial'; c.fillText(g.title,64,y); y += 52
    const scale = Math.max(...g.rows.map(r => Math.abs(r.amount)),1)
    for (const r of g.rows) {
      c.fillStyle = '#182b27'; c.font = 'bold 30px Arial'
      let size = 30
      while (c.measureText(r.label).width > 745 && size > 24) { c.font = `bold ${--size}px Arial` }
      if (c.measureText(r.label).width > 745) throw Error('Libellé trop long pour le visuel : raccourcir le libellé éditorial.')
      c.fillText(r.label,64,y)
      c.textAlign = 'right'; c.fillText(signedFlow(r.amount,o.currency),1136,y); c.textAlign = 'left'
      c.fillStyle = '#ddd9cf'; c.fillRect(64,y+18,1072,3)
      const bar = Math.abs(r.amount) / scale * 530
      c.fillStyle = r.amount < 0 ? '#b34d42' : '#267863'; c.fillRect(r.amount < 0 ? 600-bar : 600,y+10,bar,26)
      c.fillStyle = '#163d35'; c.fillRect(599,y+6,2,36)
      y += 110
    }
    y += 18
  }
  c.fillStyle = '#163d35'; c.font = 'bold 30px Arial'; c.fillText('Épargnant libre',64,height-48)
  return canvas
}
