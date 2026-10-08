import { money, percent, assumptions } from './lib.js'

export function renderProjectionImage(plan, results) {
  const keys = plan.mode === 'compare' ? ['a', 'b'] : [plan.active]
  const blocks = keys.flatMap(k => [plan.portfolios[k].name, ...assumptions(plan.portfolios[k], plan.scenario),
    ...plan.portfolios[k].events.map(e => `${plan.portfolios[k].pockets.find(p => p.id === e.pocketId)?.name} · ${e.type === 'pause' ? `pause mois ${e.month}–${e.endMonth}` : `${e.type === 'withdrawal' ? 'retrait' : 'versement mensuel'} ${money(e.amount)} au mois ${e.month}`}`)])
  const warnings = [...new Set(keys.flatMap(k=>results[k].warnings))]
  const canvas = document.createElement('canvas'); canvas.width = 1600
  const ctx = canvas.getContext('2d')
  const wrap = (text, width, font) => {
    ctx.font = font
    const lines = []; let line = ''
    for (const word of text.split(' ')) {
      if (line && ctx.measureText(`${line} ${word}`).width > width) { lines.push(line); line = word }
      else line = line ? `${line} ${word}` : word
    }
    if (line) lines.push(line)
    return lines
  }
  const smallFont = '24px Arial', footFont = '22px Arial'
  const assumptionsLines = blocks.flatMap(t=>wrap(t, 1420, smallFont))
  const footer = [`Rendements constants hypothétiques · versements en fin de mois · revenus réinvestis.`,
    `Capital avant fiscalité. Inflation : ${percent(plan.inflation)}/an. Les marchés et les taux peuvent évoluer.`, ...warnings]
  const footLines = footer.flatMap(t=>wrap(t, 1420, footFont))
  canvas.height = 1050 + assumptionsLines.length * 36 + footLines.length * 31
  ctx.fillStyle = '#101e2a'; ctx.fillRect(0,0,1600,canvas.height)
  const gradient = ctx.createLinearGradient(0,0,1600,600); gradient.addColorStop(0,'#18352f'); gradient.addColorStop(1,'#142336')
  ctx.fillStyle=gradient; ctx.fillRect(0,0,1600,910)
  ctx.fillStyle='#65d5b0';ctx.font='bold 24px Arial';ctx.fillText('ÉPARGNANT LIBRE',80,65)
  ctx.fillStyle='#ffffff';ctx.font='bold 54px Arial';ctx.fillText(keys.length===2 ? 'Deux patrimoines, un horizon' : 'Ton patrimoine au fil du temps',80,145)
  ctx.fillStyle='#c4d3dc';ctx.font='28px Arial';ctx.fillText(`${plan.years} ans · scénario ${{low:'prudent',central:'central',high:'favorable'}[plan.scenario]} · simulation illustrative`,80,200)
  const x0=165, y0=290, width=1300, height=380
  const max=Math.max(1,...keys.flatMap(k=>results[k].points.map(p=>Math.max(p.capital,p.netPaid))))*1.08
  for(let i=0;i<=4;i++) {
    const y=y0+height-height*i/4
    ctx.strokeStyle='#34505a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+width,y);ctx.stroke()
    ctx.fillStyle='#bdd0d6';ctx.font='20px Arial';ctx.textAlign='right';ctx.fillText(money(max*i/4),x0-12,y+6);ctx.textAlign='left'
  }
  keys.forEach((k,i)=>{
    const points=results[k].points
    ctx.strokeStyle=i===0?'#65d5b0':'#9bafff';ctx.lineWidth=6;ctx.beginPath()
    points.forEach((p,j)=>{const x=x0+p.year/plan.years*width,y=y0+height-p.capital/max*height;if(j) ctx.lineTo(x,y); else ctx.moveTo(x,y) });ctx.stroke()
    ctx.font='bold 28px Arial';ctx.fillStyle=ctx.strokeStyle;ctx.fillText(`${k.toUpperCase()} · ${plan.portfolios[k].name.slice(0,38)}`,80+i*760,750)
    ctx.fillStyle='#fff';ctx.font='bold 48px Arial';ctx.fillText(money(results[k].final.capital),80+i*760,815)
    ctx.font='24px Arial';ctx.fillStyle='#c4d3dc';ctx.fillText(`Versé : ${money(results[k].final.paid)} · gains : ${money(results[k].final.gains)}`,80+i*760,860)
    ctx.fillText(`Pouvoir d’achat estimé : ${money(results[k].final.real)}`,80+i*760,895)
  })
  ctx.fillStyle='#bdd0d6';ctx.font='22px Arial';ctx.fillText('Aujourd’hui',x0,710);ctx.textAlign='right';ctx.fillText(`${plan.years} ans`,x0+width,710);ctx.textAlign='left'
  ctx.fillStyle='#65d5b0';ctx.font='bold 28px Arial';ctx.fillText('LES HYPOTHÈSES UTILISÉES',80,960)
  let y=1005;ctx.font=smallFont;ctx.fillStyle='#e2eaed'
  for(const line of assumptionsLines) {ctx.fillText(line,80,y);y+=36}
  y+=30;ctx.font=footFont;ctx.fillStyle='#b5c8cf'
  for(const line of footLines) {ctx.fillText(line,80,y);y+=31}
  return canvas
}
