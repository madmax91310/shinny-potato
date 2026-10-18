import { loadArtImage, loadEditorialFont } from '../lib/art-resources.js'

// Blank raster paper only: all identities and figures stay dynamic.
const INK = '#123b2b', GOLD = '#b79645', PAPER = '#f8f4e9'
const FONT = 'Arial, sans-serif'
export const comparisonPercent = value => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
export function comparisonLayout(count) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Sélection vide')
  const columns = count <= 3 ? count : count === 4 ? 2 : 3
  const rows = Math.ceil(count / columns)
  return { columns, rows, compact: count >= 4, width: count >= 4 ? 1800 : 1500,
    height: count <= 3 ? 1500 : rows * 1050 + 130 }
}
function font(ctx, size, weight = 400, family = FONT) { ctx.font = `${weight} ${size}px ${family}` }
function wrapped(ctx, value, width, size, weight, family) {
  font(ctx, size, weight, family)
  return String(value ?? '').split('\n').flatMap(paragraph => {
    const lines = []; let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= width) { line = next; continue }
      if (line) { lines.push(line); line = '' }
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = '' }
        line += char
      }
    }
    if (line) lines.push(line)
    return lines
  })
}
function block(ctx, value, width, size, { weight = 400, serif = false } = {}) {
  const family = serif ? 'ExportEditorial, Georgia, serif' : FONT
  const lines = wrapped(ctx, value, width, size, weight, family)
  return { lines, size, weight, family, height: lines.length * size * 1.22 }
}
function drawBlock(ctx, item, x, y, { align = 'left', color = INK } = {}) {
  font(ctx, item.size, item.weight, item.family)
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'
  item.lines.forEach((line, i) => ctx.fillText(line, x, y + i * item.size * 1.22))
}
function round(ctx, x, y, w, h, fill, radius = 17) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill()
}
function icon(ctx, kind, x, y, size, color = INK) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 48, size / 48)
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2.6
  if (kind === 'coins') {
    for (const [xx, yy] of [[4, 24], [23, 10]]) {
      ctx.fillRect(xx, yy + 3, 20, 19)
      for (const offset of [6, 14, 22]) { ctx.beginPath(); ctx.ellipse(xx + 10, yy + offset, 10, 4, 0, 0, 2 * Math.PI); ctx.stroke() }
      ctx.beginPath(); ctx.ellipse(xx + 10, yy, 10, 4, 0, 0, 2 * Math.PI); ctx.fill()
    }
  } else if (kind === 'leaf') {
    for (const [cx, cy, rotation] of [[15, 24, -.5], [31, 15, .5]]) { ctx.beginPath(); ctx.ellipse(cx, cy, 7, 15, rotation, 0, Math.PI * 2); ctx.fill() }
    ctx.beginPath(); ctx.moveTo(20, 44); ctx.lineTo(29, 18); ctx.stroke()
  } else if (kind === 'bank') {
    ctx.beginPath(); ctx.moveTo(3, 15); ctx.lineTo(24, 3); ctx.lineTo(45, 15); ctx.closePath(); ctx.fill()
    for (const xx of [8, 21, 34]) ctx.fillRect(xx, 19, 6, 21)
    ctx.fillRect(3, 43, 42, 4)
  } else if (kind === 'technology') {
    ctx.strokeRect(6, 8, 36, 25); ctx.fillRect(22, 33, 4, 6); ctx.fillRect(9, 40, 30, 3)
  } else if (kind === 'finance') {
    ctx.fillRect(7, 26, 8, 18); ctx.fillRect(21, 17, 8, 27); ctx.fillRect(35, 7, 8, 37)
  } else if (kind === 'industry') {
    ctx.beginPath(); ctx.moveTo(5, 44); ctx.lineTo(5, 23); ctx.lineTo(19, 30); ctx.lineTo(19, 20); ctx.lineTo(33, 28); ctx.lineTo(36, 5); ctx.lineTo(42, 5); ctx.lineTo(44, 44); ctx.closePath(); ctx.fill()
  } else {
    ctx.beginPath(); ctx.arc(24, 24, 20, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(24, 24, 9, 20, 0, 0, Math.PI * 2); ctx.stroke()
    for (const yy of [15, 32]) { ctx.beginPath(); ctx.moveTo(6, yy); ctx.lineTo(42, yy); ctx.stroke() }
  }
  ctx.restore()
}
function sectorIcon(label) {
  if (/techn|logiciel|semi|informat/i.test(label)) return 'technology'
  if (/financ|banqu/i.test(label)) return 'finance'
  if (/industr|matéri|énerg/i.test(label)) return 'industry'
  return 'globe'
}
// Vector flags avoid OS-dependent emoji rendering in downloaded PNGs.
function flag(ctx, label, x, y, size) {
  const w = size * 1.24, h = size * .84
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.clip()
  ctx.fillStyle = '#faf9f4'; ctx.fillRect(x, y, w, h)
  if (/^(États-Unis|United States)$/.test(label)) {
    ctx.fillStyle = '#b93338'; for (let i = 0; i < 13; i += 2) ctx.fillRect(x, y + h * i / 13, w, h / 13)
    ctx.fillStyle = '#284c7a'; ctx.fillRect(x, y, w * .44, h * .55)
    ctx.fillStyle = '#fff'; for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) ctx.fillRect(x + 3 + a * w * .075, y + 3 + b * h * .11, 1.6, 1.6)
  } else if (/^(Japon|Japan)$/.test(label)) {
    ctx.fillStyle = '#c42c3e'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * .27, 0, Math.PI * 2); ctx.fill()
  } else if (/^(Royaume-Uni|United Kingdom)$/.test(label)) {
    ctx.fillStyle = '#284c7a'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#fff'; ctx.lineWidth = h * .18
    for (const [a,b] of [[0,h],[h,0]]) { ctx.beginPath(); ctx.moveTo(x, y+a); ctx.lineTo(x+w, y+b); ctx.stroke() }
    ctx.fillStyle = '#fff'; ctx.fillRect(x+w*.39,y,w*.22,h);ctx.fillRect(x,y+h*.35,w,h*.3)
    ctx.fillStyle = '#c43840';ctx.fillRect(x+w*.44,y,w*.12,h);ctx.fillRect(x,y+h*.42,w,h*.16)
  } else if (/^(Taïwan|Taiwan)$/.test(label)) {
    ctx.fillStyle = '#d33d41';ctx.fillRect(x,y,w,h);ctx.fillStyle='#264b8c';ctx.fillRect(x,y,w*.52,h*.55)
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+w*.26,y+h*.27,h*.12,0,Math.PI*2);ctx.fill()
  } else if (/^(France|Italie|Italy|Allemagne|Germany|Pays-Bas|Netherlands)$/.test(label)) {
    const vertical = /France|Italie|Italy/.test(label)
    const colors = /France/.test(label)?['#254b8a','#fff','#cb4147']:/Italie|Italy/.test(label)?['#248159','#fff','#c83d45']:/Allemagne|Germany/.test(label)?['#272b2b','#b9393d','#d3af3b']:['#b73b3e','#fff','#2e5287']
    colors.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(x+(vertical?i*w/3:0),y+(vertical?0:i*h/3),vertical?w/3:w,vertical?h:h/3)})
  } else { ctx.restore(); icon(ctx, 'globe', x, y - 4, size, GOLD); return }
  ctx.restore()
}
function measureCard(ctx, card, width, scale) {
  const pad = 24 * scale, inner = width - pad * 2
  const title = block(ctx, card.name, inner, 55 * scale, { serif: true, weight: 700 })
  const subtitle = block(ctx, card.subtitle, inner, 33 * scale, { weight: 700 })
  const summary = block(ctx, card.summary, inner - 58 * scale, 32 * scale)
  const metric = card.metric ? block(ctx, card.metric.value, inner - 95 * scale, 76 * scale, { weight: 700 }) : null
  const sections = card.sections.filter(s => s.rows.length).map(section => {
    const rows = section.rows.map(row => {
      const value = row.value ?? ''; font(ctx, 36 * scale, 700)
      const valueWidth = value ? ctx.measureText(value).width + 17 * scale : 0
      const available = inner - 70 * scale - valueWidth
      font(ctx,32*scale)
      const longest = Math.max(...String(row.label).split(/\s+/).map(word=>ctx.measureText(word).width))
      const labelSize = Math.max(27*scale,Math.min(32*scale,32*scale*available/longest))
      const label = block(ctx, row.label, available, labelSize)
      return { ...row, label, valueWidth, height: Math.max(70 * scale, label.height + 20 * scale) }
    })
    const heading = block(ctx, section.title, inner - 28 * scale, 31 * scale, { weight: 700 })
    const evidence = section.evidence ? block(ctx, section.evidence, inner, 24 * scale) : null
    return { ...section, rows, heading, evidence, height: heading.height + 31 * scale + rows.reduce((sum,r)=>sum+r.height,0) + (evidence ? evidence.height + 12 * scale : 0) + 17 * scale }
  })
  return { ...card, title, subtitle, summary, metric, sections, pad, inner,
    header: title.height + subtitle.height + 157 * scale,
    summaryHeight: summary.lines.length ? Math.max(64 * scale, summary.height + 20 * scale) : 0 }
}
export async function renderComparisonPaper(cards) {
  const layout = comparisonLayout(cards.length)
  const [art] = await Promise.all([loadArtImage('comparison-paper-card.webp'), loadEditorialFont()])
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de générer le visuel')
  const W = layout.width, pad = 32, gap = layout.compact ? 28 : 20
  const colW = (W - 2 * pad - (layout.columns - 1) * gap) / layout.columns
  const scale = layout.compact ? .82 : 1
  const measured = cards.map(card => measureCard(ctx, card, colW, scale))
  const rowLayouts = Array.from({ length: layout.rows }, (_, index) => {
    const group = measured.slice(index * layout.columns, (index + 1) * layout.columns)
    const header = Math.max(...group.map(c=>c.header))
    const metricH = group.some(c=>c.metric) ? Math.max(150 * scale, ...group.map(c=>(c.metric?.height ?? 0)+75*scale)) : 0
    const badgeH = group.some(c=>c.badge || c.productType) ? 83 * scale : 0
    const summaryH = Math.max(...group.map(c=>c.summaryHeight))
    const count = Math.max(...group.map(c=>c.sections.length))
    const sections = Array.from({length:count},(_,i)=>Math.max(...group.map(c=>c.sections[i]?.height ?? 0)))
    const natural = header + metricH + badgeH + summaryH + sections.reduce((sum,h)=>sum+h,0) + 55 * scale
    const dense = group.some(card=>card.sections.length > 1)
    const minimum = layout.compact ? (dense?960:640) : dense ? (cards.length===1?1000:cards.length===2?1160:1360) : 860
    return { header, metricH, badgeH, summaryH, sections, height: Math.max(minimum,natural) }
  })
  canvas.width = W; canvas.height = Math.ceil(pad * 2 + 80 + rowLayouts.reduce((sum,row)=>sum+row.height,0)+(layout.rows-1)*gap)
  ctx.fillStyle = PAPER; ctx.fillRect(0,0,W,canvas.height)
  let top = pad
  rowLayouts.forEach((row,rowIndex)=>{
    const group = measured.slice(rowIndex*layout.columns,(rowIndex+1)*layout.columns)
    const left = (W-(group.length*colW+(group.length-1)*gap))/2
    group.forEach((card,column)=>{
      const x=left+column*(colW+gap), innerX=x+card.pad, center=x+colW/2
      ctx.save(); ctx.shadowColor='#735b3430';ctx.shadowBlur=12;ctx.shadowOffsetY=9
      round(ctx,x,top,colW,row.height,'#f8f4e9',24);ctx.restore()
      ctx.save();ctx.beginPath();ctx.roundRect(x,top,colW,row.height,24);ctx.clip()
      const split=Math.round(art.height*.17)
      // Keep the textured paper lip, but limit the green fold to a small corner
      // so even a full-width, multiline name never sits on dark decoration.
      ctx.drawImage(art,art.width*.5,0,art.width*.5,split,x,top,colW,row.header)
      ctx.save();ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+120*scale,top);ctx.lineTo(x,top+72*scale);ctx.closePath();ctx.clip()
      ctx.drawImage(art,0,0,art.width*.25,split*.25,x,top,120*scale,72*scale);ctx.restore()
      ctx.drawImage(art,0,split,art.width,art.height-split,x,top+row.header,colW,row.height-row.header)
      ctx.restore()
      const headerTextY=top+102*scale+(row.header-card.header)/2
      drawBlock(ctx,card.title,center,headerTextY,{align:'center'})
      drawBlock(ctx,card.subtitle,center,headerTextY+card.title.height+14*scale,{align:'center'})
      ctx.fillStyle=GOLD;ctx.fillRect(innerX+10*scale,top+row.header+2,card.inner-20*scale,3)
      let y=top+row.header+18*scale
      if(row.metricH){
        if(card.metric){
          round(ctx,innerX,y,card.inner,row.metricH-15*scale,'#dfe6cebb')
          icon(ctx,card.metricIcon??'coins',innerX+18*scale,y+row.metricH/2-24*scale,54*scale,GOLD)
          drawBlock(ctx,block(ctx,card.metricLabel,card.inner-100*scale,32*scale,{weight:700}),innerX+87*scale,y+18*scale)
          drawBlock(ctx,card.metric,innerX+87*scale,y+62*scale)
        }
        y+=row.metricH
      }
      if(row.badgeH){
        const badge=card.badge ?? card.productType
        if(badge){round(ctx,innerX,y,card.inner,67*scale,badge==='PEA'?'#e3e8d3bb':'#ebdfc6aa');icon(ctx,badge==='PEA'?'leaf':badge==='CTO'?'bank':'globe',center-89*scale,y+12*scale,40*scale);drawBlock(ctx,block(ctx,badge,card.inner-80*scale,40*scale,{weight:700}),center+15*scale,y+12*scale,{align:'center'})}
        y+=row.badgeH
      }
      if(card.summary.lines.length){icon(ctx,'globe',innerX+5*scale,y+5*scale,43*scale,GOLD);drawBlock(ctx,card.summary,innerX+59*scale,y+6*scale)}
      y+=row.summaryH+12*scale
      const extra=Math.max(0,row.height-(row.header+row.metricH+row.badgeH+row.summaryH+row.sections.reduce((a,b)=>a+b,0)+55*scale))
      card.sections.forEach((section,sectionIndex)=>{
        const start=y, headH=section.heading.height+22*scale
        round(ctx,innerX,y,card.inner,headH,INK,12*scale)
        drawBlock(ctx,section.heading,innerX+16*scale,y+11*scale,{color:'#fffdf5'})
        y+=headH+6*scale
        section.rows.forEach((item,i)=>{
          const iconSize=41*scale, iconY=y+(item.height-iconSize)/2
          if(section.kind==='countries')flag(ctx,item.label.lines.join(' '),innerX+6*scale,iconY,iconSize)
          else {round(ctx,innerX+3*scale,iconY-4*scale,49*scale,49*scale,i%2?'#e2d4b7':'#d6dfc8',25*scale);icon(ctx,sectorIcon(item.label.lines.join(' ')),innerX+9*scale,iconY+2*scale,37*scale,i%2?GOLD:INK)}
          drawBlock(ctx,item.label,innerX+65*scale,y+(item.height-item.label.height)/2)
          if(item.value)drawBlock(ctx,block(ctx,item.value,item.valueWidth,36*scale,{weight:700}),innerX+card.inner-6*scale,y+(item.height-44*scale)/2,{align:'right'})
          y+=item.height
          if(i<section.rows.length-1){ctx.fillStyle='#cfbf9a88';ctx.fillRect(innerX+64*scale,y-1,card.inner-70*scale,1)}
        })
        if(section.evidence)drawBlock(ctx,section.evidence,innerX+2*scale,y+9*scale,{color:'#536355'})
        y=start+row.sections[sectionIndex]+extra/Math.max(1,card.sections.length)
      })
    })
    top+=row.height+gap
  })
  const signature=block(ctx,'Épargnant Libre',W-100,35,{serif:true,weight:500}),sy=canvas.height-65
  font(ctx,35,500,'ExportEditorial, Georgia, serif'); const sw=ctx.measureText('Épargnant Libre').width
  ctx.fillStyle=GOLD;ctx.fillRect(pad+100,sy+20,(W-sw)/2-pad-130,2);ctx.fillRect((W+sw)/2+30,sy+20,(W-sw)/2-pad-130,2)
  drawBlock(ctx,signature,W/2,sy,{align:'center'})
  return canvas
}
