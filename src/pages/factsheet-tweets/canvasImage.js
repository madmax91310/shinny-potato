// Affiche 3:4 pour X. Tous les chiffres proviennent de la fiche sélectionnée.
const W = 1080
const H = 1440
const C = {
  paper: '#F2EFE8', ink: '#152A35', hero: '#315963', accent: '#327982',
  white: '#F4F1EB', muted: '#53666C', rule: '#C7C9BD', negative: '#AD6258',
}

function write(ctx, value, x, y, size, color = C.ink, weight = 400, align = 'left') {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px Arial, sans-serif`
  ctx.textBaseline = 'top'
  ctx.textAlign = align
  ctx.fillText(String(value), x, y)
  ctx.textAlign = 'left'
}

function fitted(ctx, value, x, y, width, size, color = C.ink, weight = 700, align = 'left', min = 13) {
  let font = size
  while (font > min) {
    ctx.font = `${weight} ${font}px Arial, sans-serif`
    if (ctx.measureText(String(value)).width <= width) break
    font--
  }
  let label = String(value)
  while (ctx.measureText(label).width > width && label.length > 2) label = `${label.slice(0, -2).trimEnd()}…`
  write(ctx, label, x, y, font, color, weight, align)
}

function percent(n, signed = false) {
  return `${signed && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

function label(name) {
  return name.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]/gu, '').trim()
}

function section(ctx, y, number, title) {
  write(ctx, number, 54, y + 1, 21, C.accent, 700)
  write(ctx, title, 100, y - 3, 30, C.ink, 700)
  ctx.fillStyle = C.ink
  ctx.fillRect(54, y + 39, 972, 2)
}

function bars(ctx, entries, { y, step, rows, max = 30, size = 24, color = C.accent }) {
  entries.forEach(([name, weight], i) => {
    const x = 54 + Math.floor(i / rows) * 504
    const top = y + i % rows * step
    fitted(ctx, label(name), x, top, 355, size, C.ink, 400, 'left', 17)
    write(ctx, percent(weight), x + 450, top, size + 1, color, 700, 'right')
    ctx.fillStyle = '#DDDCD3'; ctx.fillRect(x, top + 34, 450, 4)
    ctx.fillStyle = color; ctx.fillRect(x, top + 34, Math.min(450, 450 * weight / max), 4)
  })
}

export function renderFactsheetImage(sheet) {
  if (sheet.methodologyPanels) return renderMethodologyImage(sheet)
  const canvas = document.createElement('canvas')
  canvas.width = W * 2; canvas.height = H * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, 208)
  write(ctx, 'ÉPARGNANT LIBRE', 540, 22, 25, C.white, 700, 'center')
  fitted(ctx, sheet.title.toLocaleUpperCase('fr-FR'), 540, 52, 1000, 72, C.white, 700, 'center', 36)
  fitted(ctx, `${sheet.markets} · ${sheet.marketCap ?? `${sheet.constituents.toLocaleString('fr-FR')} entreprises`}`, 540, 145, 1010, 23, C.white, 400, 'center', 17)
  fitted(ctx, `COMPOSITION AU ${sheet.snapshot.toLocaleUpperCase('fr-FR')}`, 540, 180, 1000, 17, '#B7CBD0', 700, 'center', 13)

  ctx.fillStyle = C.hero; ctx.fillRect(0, 208, W, 150)
  // Un léger bord en pointe relie les deux bandeaux sans changer leur hauteur.
  ctx.fillStyle = C.ink
  ctx.beginPath(); ctx.moveTo(0, 208); ctx.lineTo(0, 216); ctx.lineTo(540, 204); ctx.lineTo(W, 216); ctx.lineTo(W, 208); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#95B2B4'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, 216); ctx.lineTo(540, 204); ctx.lineTo(W, 216); ctx.stroke()

  const main = sheet.countries.find(([name]) => label(name).toLowerCase() !== 'autres') ?? sheet.countries[0]
  const topTen = sheet.topWeight ?? sheet.holdings.slice(0, 10).reduce((sum, [, weight]) => sum + weight, 0)
  const perf = sheet.performance.tenYear != null
    ? [sheet.performance.tenYear, 'SUR 10 ANS · PAR AN']
    : sheet.performance.annualizedFiveYear != null
      ? [sheet.performance.annualizedFiveYear, 'SUR 5 ANS · PAR AN']
      : [sheet.returns[0][1], `EN ${sheet.returns[0][0]}`]
  write(ctx, '1ER PAYS', 54, 224, 18, C.white, 700)
  fitted(ctx, percent(main[1]), 54, 242, 480, 80, C.white, 700, 'left', 57)
  fitted(ctx, label(main[0]).toLocaleUpperCase('fr-FR'), 57, 325, 480, 26, C.white, 700)
  ctx.fillStyle = '#93B2B4'; ctx.fillRect(550, 221, 2, 125)
  write(ctx, sheet.constituents.toLocaleString('fr-FR'), 595, 214, 54, C.white, 700)
  write(ctx, 'ENTREPRISES', 595, 272, 19, C.white, 700)
  fitted(ctx, `${perf[0] > 0 ? '+' : ''}${percent(perf[0])}${sheet.performance.tenYear != null || sheet.performance.annualizedFiveYear != null ? ' / AN' : ''}`, 595, 294, 452, 37, C.white)
  fitted(ctx, perf[1], 595, 337, 456, 16, C.white)

  section(ctx, 401, '01', 'RÉPARTITION PAR PAYS')
  // Le nombre de pays listés peut varier (6 pour MSCI Europe, 8 pour STOXX 600).
  bars(ctx, sheet.countries, { y: 459, step: 49, rows: Math.ceil(sheet.countries.length / 2), size: 25, max: Math.max(30, ...sheet.countries.map(([, weight]) => weight)) })

  section(ctx, 655, '02', 'SECTEURS')
  bars(ctx, sheet.sectors, { y: 710, step: 49, rows: Math.ceil(sheet.sectors.length / 2), size: 23, color: C.hero, max: Math.max(30, ...sheet.sectors.map(([, weight]) => weight)) })

  section(ctx, 1010, '03', 'DIX PREMIÈRES ENTREPRISES')
  write(ctx, `TOP 10 : ${percent(topTen)}`, 1026, 1020, 21, C.accent, 700, 'right')
  sheet.holdings.slice(0, 10).forEach(([name, weight], i) => {
    const x = 54 + Math.floor(i / 5) * 504
    const y = 1066 + i % 5 * 34
    write(ctx, String(i + 1).padStart(2, '0'), x, y, 18, C.accent, 700)
    fitted(ctx, name, x + 42, y, 315, 24, C.ink, 400, 'left', 17)
    write(ctx, percent(weight), x + 450, y, 24, C.ink, 700, 'right')
  })

  section(ctx, 1256, '04', 'PERFORMANCES')
  sheet.returns.slice().reverse().forEach(([year, result], i) => {
    const x = 54 + i * 205
    write(ctx, year, x, 1335, 20, C.muted)
    fitted(ctx, percent(result, true), x, 1360, 190, 26, result < 0 ? C.negative : C.ink, 700, 'left', 18)
  })
  ctx.fillStyle = C.ink; ctx.fillRect(54, 1405, 972, 2)
  fitted(ctx, `${sheet.performance.detail} · ${sheet.performance.date}`, 54, sheet.performance.historyNote ? 1409 : 1413, 972, sheet.performance.historyNote ? 12 : 16, C.muted, 400, 'left', 11)
  if (sheet.performance.historyNote) fitted(ctx, sheet.performance.historyNote, 54, 1423, 972, 11, C.muted, 400, 'left', 10)
  return canvas
}

function renderMethodologyImage(sheet) {
 const canvas = document.createElement('canvas'); canvas.width=W*2;canvas.height=H*2;
 const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);
 ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,230);
 write(ctx,'ÉPARGNANT LIBRE',540,28,24,C.white,700,'center');
 fitted(ctx,sheet.title,540,75,990,65,C.white,700,'center',34);
 fitted(ctx,sheet.markets,540,150,980,28,C.white,400,'center');
 fitted(ctx,sheet.snapshot,540,194,980,20,C.white,400,'center');
 ctx.fillStyle=C.hero;ctx.fillRect(0,230,W,130);
 const count=sheet.constituents??sheet.indexFacts.targetConstituents;
 write(ctx,count.toLocaleString('fr-FR'),540,246,65,C.white,700,'center');
 write(ctx,sheet.constituents===null?'SOCIÉTÉS VISÉES PAR LA MÉTHODE':'TITRES AU 31 AOÛT 2026',540,322,22,C.white,700,'center');
 function paragraph(value,y) {
  ctx.font='30px Arial';let line='',top=y;
  for(const word of value.split(' ')) { const candidate=line?line+' '+word:word;
   if(ctx.measureText(candidate).width>930 && line) {write(ctx,line,64,top,30);top+=44;line=word;} else line=candidate;
  }if(line)write(ctx,line,64,top,30);
 }
 sheet.methodologyPanels.forEach(([title,value],i)=>{const y=410+i*240;section(ctx,y,String(i+1).padStart(2,'0'),title);paragraph(value,y+65);});
 section(ctx,1140,'04','PERFORMANCES');
 sheet.returns.slice().reverse().forEach(([year,result],i)=>{const x=54+i*205;write(ctx,year,x,1214,22,C.muted);fitted(ctx,percent(result,true),x,1260,190,32,result<0?C.negative:C.ink,700);});
 paragraph(sheet.performance.kind==='ETF'?'Performances de l’ETF cité, distinctes de la méthodologie d’indice.':'Performances de l’indice, distinctes des rendements de l’ETF.',1330);
 fitted(ctx,sheet.performance.detail,54,1420,970,15,C.muted,400);
 return canvas;
}
