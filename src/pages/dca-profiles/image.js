const NAVY = '#071d36', BLUE = '#0759dc', IVORY = '#fff4d8', YELLOW = '#ffcf36'
const euro = amount => new Intl.NumberFormat('fr-FR').format(amount) + ' €'
function text(ctx, value, x, y, width, size, color = IVORY, weight = 800) {
  do { ctx.font = `${weight} ${size--}px Arial, sans-serif` } while (ctx.measureText(value).width > width && size > 20)
  ctx.fillStyle = color
  ctx.fillText(value, x, y)
}
function wrap(ctx, value, width, size) {
  ctx.font = `700 ${size}px Arial, sans-serif`
  const lines = ['']
  for (const word of value.split(/\s+/)) {
    const index = lines.length - 1, candidate = `${lines[index]} ${word}`.trim()
    if (lines[index] && ctx.measureText(candidate).width > width) lines.push(word)
    else lines[index] = candidate
  }
  return lines
}
function grain(ctx, x, y, width, height, seed = 17) {
  ctx.save()
  let value = seed
  for (let i = 0; i < width * height / 65; i++) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    const px = x + value % width
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    const py = y + value % height
    ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.055)'
    ctx.fillRect(px, py, 1.5, 1.5)
  }
  ctx.restore()
}
// An abstract skyline: decorative, without attributing a landmark to a profile's city.
function skyline(ctx) {
  ctx.save(); ctx.globalAlpha = .32; ctx.fillStyle = BLUE
  for (let i = 0; i < 18; i++) {
    const x = 855 + i * 40, h = 28 + (i * 47) % 70
    ctx.fillRect(x, 148 - h, 34, h)
    ctx.beginPath(); ctx.moveTo(x,148-h); ctx.lineTo(x+17,136-h); ctx.lineTo(x+34,148-h); ctx.fill()
  }
  ctx.strokeStyle = BLUE; ctx.lineWidth = 3
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(875+i*12,166+i*9);ctx.lineTo(1495-i*12,166+i*9);ctx.stroke() }
  ctx.restore()
}
function globe(ctx, x, y, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4
  ctx.beginPath(); ctx.arc(x,y,30,0,Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(x,y,13,30,0,0,Math.PI*2); ctx.stroke()
  for (const offset of [-12,12]) { ctx.beginPath();ctx.ellipse(x,y+offset,27,8,0,0,Math.PI*2);ctx.stroke() }
  ctx.restore()
}
function assetIcon(ctx, asset, x, y, color) {
  ctx.save(); ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=4
  if (asset === 'gold') {
    for (let i=0;i<3;i++) { ctx.beginPath();ctx.ellipse(x,y+18-i*15,28,10,0,0,Math.PI*2);ctx.stroke() }
  } else if (asset === 'total' || asset === 'engie') {
    ctx.beginPath();ctx.moveTo(x,y-32);ctx.bezierCurveTo(x-48,y+15,x-20,y+40,x,y+32);ctx.bezierCurveTo(x+35,y+32,x+35,y+8,x,y-32);ctx.stroke()
  } else if (asset === 'btc') {
    text(ctx,'₿',x-23,y+25,64,66,color)
  } else {
    for (let i=0;i<3;i++)ctx.strokeRect(x-30+i*23,y+28-(24+i*15),18,24+i*15)
    ctx.beginPath();ctx.moveTo(x-37,y+30);ctx.lineTo(x+43,y+30);ctx.stroke()
  }
  ctx.restore()
}
export function renderDcaImage(profile) {
  if (!profile?.lines?.length || profile.lines.length > 5) throw new Error('Profil DCA incomplet.')
  const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1067
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = NAVY; ctx.fillRect(0,0,1600,1067); grain(ctx,0,0,1600,1067)
  skyline(ctx)
  text(ctx,profile.name,50,145,730,142)
  text(ctx,`${profile.age} ans · ${profile.family}`,50,202,730,39)
  const occupation = `${profile.job} ${profile.location}`
  let jobSize = 33, jobLines = wrap(ctx,occupation,710,jobSize)
  while (jobLines.length > 2 && jobSize > 24) jobLines = wrap(ctx,occupation,710,--jobSize)
  jobLines.forEach((line,i)=>text(ctx,line,50,251+i*40,710,jobSize,IVORY,700))
  ctx.fillStyle = YELLOW; ctx.beginPath();ctx.roundRect(50,317,715,72,16);ctx.fill()
  text(ctx,`${profile.variable ? 'En moyenne ' : ''}${euro(profile.income)} net / mois`,75,365,665,43,NAVY)
  ctx.fillStyle = IVORY; ctx.fillRect(805,47,2,342)
  text(ctx,euro(profile.monthly),870,295,670,149,YELLOW,900)
  text(ctx,'investis / mois',870,370,670,63)
  const areaTop = 430, areaHeight = 560, count = profile.lines.length
  const rowHeight = Math.min(170,areaHeight/count), top = areaTop+(areaHeight-rowHeight*count)/2
  profile.lines.forEach((line,i)=>{
    const y=top+i*rowHeight, light=i%2===1, color=light?NAVY:IVORY
    ctx.fillStyle=light?IVORY:BLUE;ctx.fillRect(0,y,1600,rowHeight);grain(ctx,0,Math.round(y),1600,Math.ceil(rowHeight),i+42)
    const center=y+rowHeight/2
    text(ctx,euro(line.amount),110,center+27,350,78,color,900)
    ctx.fillStyle=color;ctx.fillRect(482,center-33,2,66)
    if(line.label.startsWith('ETF')) globe(ctx,560,center,color)
    else assetIcon(ctx,line.asset,560,center,color)
    const labels=wrap(ctx,line.label,875,59)
    if(labels.length===1) text(ctx,line.label,650,center+22,890,59,color)
    else labels.forEach((label,index)=>text(ctx,label,650,center-8+index*43,890,42,color))
  })
  ctx.strokeStyle='#9ab1cc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(50,1020);ctx.lineTo(1180,1020);ctx.stroke()
  text(ctx,'Épargnant Libre',1220,1034,330,34,IVORY,800)
  return canvas
}
