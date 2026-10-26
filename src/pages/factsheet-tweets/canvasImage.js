import { roundedComposition } from '../../data/index-concentration-core.js'
import { getIndexArt } from './visualIdentity.js'
import { factsheetCurrency } from './performanceCurrency.js'
import { companyLabel, plainLabel, sectorLabel, sortedRows } from './editorial.js'
import { countryFlag, drawFlag, drawSector } from './reliefArt.js'
import { companyLogo, companyInitials } from './companyLogos.js'

const W = 1600, PAD = 38, GAP = 18, USABLE = W - PAD * 2
const C = { ink: '#291016', navy: '#38170f', rule: '#673c342b', negative: '#d52e39', positive: '#064d4e', background: '#fff7e7', muted: '#603a30' }
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
    .replace(/^Conso Cyclique$/i, 'Conso cyclique')
    .replace(/^Conso non Cyclique$/i, 'Conso non cyclique')
}
// Only display aliases: no grouping of share classes or change to their weights.
export function imageCompanyLabel(name) {
  const labels = { 'ADVANCED MICRO DEVICES': 'AMD', 'SPACE EXPLORATION TECHNOLOGIES COR': 'SpaceX', 'AIR LIQUIDE SA': 'Air Liquide', 'SAFRAN SA': 'Safran', 'BNP PARIBAS': 'BNP Paribas' }
  if (labels[name]) return labels[name]
  if (name === 'SAMSUNG ELECTRONICS PREF') return 'Samsung Electronics (préférentielles)'
  return companyLabel(name)
    .replace(/^HSBC HOLDING PLC(?: GBP)?$/i, 'HSBC')
    .replace(/^ROCHE HLDG AG-GENUSS(?: CHF)?$/i, 'Roche')
    .replace(/^NOVARTIS AG-REG$/i, 'Novartis')
    .replace(/^SHELL PLC(?: EUR)?$/i, 'Shell')
    .replace(/^NESTLE SA-REG$/i, 'Nestlé')
}
export function compositionCompanyLabel(name) {
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

// Relief is composed dynamically: bevels, surface highlights and shadows carry no data.
function paper(ctx, height, width = W) {
  const wash=ctx.createLinearGradient(0,0,width,height)
  wash.addColorStop(0,'#fff9ec');wash.addColorStop(.55,'#f7eed9');wash.addColorStop(1,'#fff9ec')
  ctx.fillStyle=wash;ctx.fillRect(0,0,width,height)
}
function panel(ctx,x,y,width,height,style='peach',radius=55) {
  const palettes={peach:['#ffd9b5','#f8b08d','#efa481'],lavender:['#e3d4f5','#c1a7e1','#b79bd5'],mint:['#c4f4e8','#94dad3','#82ccc5'],ivory:['#fffcf2','#fff5df','#e7d6b4']}
  const colors=palettes[style]??palettes.peach
  ctx.save();ctx.shadowColor='#6b40294f';ctx.shadowBlur=22;ctx.shadowOffsetY=16
  const wash=ctx.createLinearGradient(x,y,x+width*.3,y+height)
  colors.forEach((color,i)=>wash.addColorStop(i/2,color))
  ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.fillStyle=wash;ctx.fill()
  ctx.shadowColor='transparent';ctx.lineWidth=4
  const edge=ctx.createLinearGradient(x,y,x,y+height)
  edge.addColorStop(0,'#ffffffd9');edge.addColorStop(.45,'#ffffff40');edge.addColorStop(1,'#8b654066')
  ctx.strokeStyle=edge;ctx.stroke()
  ctx.save();ctx.beginPath();ctx.roundRect(x+5,y+5,width-10,height-10,radius-4);ctx.clip()
  const shine=ctx.createLinearGradient(x,y,x,y+32)
  shine.addColorStop(0,'#ffffffb0');shine.addColorStop(1,'#ffffff00')
  ctx.fillStyle=shine;ctx.fillRect(x,y,width,32)
  ctx.beginPath();ctx.roundRect(x+12,y+10,width-24,height-23,radius-10)
  ctx.strokeStyle='#ffffff48';ctx.lineWidth=5;ctx.stroke();ctx.restore();ctx.restore()
}
function logoSupport(ctx, image, name, x, y, size) {
  ctx.save()
  ctx.shadowColor = '#001c4038'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5
  ctx.beginPath(); ctx.roundRect(x, y, size, size, size * .23); ctx.fillStyle = '#f8fcff'; ctx.fill()
  ctx.shadowColor = 'transparent'; ctx.lineWidth = 1.5; ctx.strokeStyle = '#d2e8fa'; ctx.stroke()
  if (image) {
    // A white mark keeps its native colour on a dark insert; never recolour it.
    const dark = image.dataset?.support === 'dark'
    if (dark) { ctx.beginPath(); ctx.roundRect(x + 4, y + 4, size - 8, size - 8, size * .19); ctx.fillStyle = '#123c70'; ctx.fill() }
    const factor = Math.min(/\.(png|avif|webp)$/.test(image.src) ? 1 : Infinity, (size - 18) / image.width, (size - 18) / image.height)
    const w = image.width * factor, h = image.height * factor
    ctx.drawImage(image, x + (size - w) / 2, y + (size - h) / 2, w, h)
  } else {
    draw(ctx, block(ctx, companyInitials(name), size - 12, size * .34, 700), x + size / 2, y + size * .3, 'center', C.navy)
  }
  ctx.restore()
}
function heading(ctx,value,width) { return fit(ctx,value,width,185,106,false) }
export async function renderFactsheetImage(sheet) {
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')
  if(!ctx)throw new Error('Impossible de créer l’image')
  const holdings=sortedRows(sheet.holdings).slice(0,4)
  const countries=sortedRows(sheet.countries).filter(([name])=>!/autres|others/i.test(name)).slice(0,4)
  const [logos,flags]=await Promise.all([Promise.all(holdings.map(([name])=>companyLogo(sheet,name))),Promise.all(countries.map(([name])=>countryFlag(name)))])
  const count=sheet.constituents??sheet.indexFacts?.targetConstituents
  const badgeW=count==null?0:280,titleW=USABLE-(badgeW?badgeW+30:0)
  const title=heading(ctx,sheet.index??sheet.title,titleW)
  const subtitle=block(ctx,getIndexArt(sheet).description,titleW,51,700)
  const headerH=Math.max(276,title.height+subtitle.height+24)
  const definitions=[
    {label:'PAYS',style:'peach',kind:'country',rows:countries.map(([name,value],i)=>({name:displayLabel(name),raw:name,value,image:flags[i]}))},
    {label:'SECTEURS',style:'lavender',kind:'sector',rows:sortedRows(sheet.sectors).slice(0,4).map(([name,value])=>({name:displayLabel(sectorLabel(name)),raw:name,value}))},
    {label:'ENTREPRISES',style:'mint',kind:'company',rows:holdings.map(([name,value],i)=>({name:((sheet.compositionOnly||sheet.concentration?.available)?compositionCompanyLabel:imageCompanyLabel)(name),raw:name,value,image:logos[i]}))},
  ]
  const bands=definitions.map(band=>{
    const width=USABLE/Math.max(4,band.rows.length)
    const cells=band.rows.map(row=>({...row,nameBlock:block(ctx,row.name,width-32,band.kind==='sector'?40:49,700),valueBlock:fit(ctx,percent(row.value),width-28,99,76,false)}))
    const nameH=Math.max(61,...cells.map(cell=>cell.nameBlock.height)),valueH=Math.max(118,...cells.map(cell=>cell.valueBlock.height))
    return {...band,cells,width,nameH,valueH,height:Math.max(422,100+126+15+nameH+8+valueH+26)}
  })
  const returns=(sheet.returns??[]).slice().sort((a,b)=>a[0]-b[0])
  const perRow=Math.min(5,Math.max(1,Math.ceil(returns.length/Math.ceil(Math.max(1,returns.length)/5))))
  const returnRows=[]
  for(let i=0;i<returns.length;i+=perRow){
    const entries=returns.slice(i,i+perRow),width=USABLE/entries.length
    const cells=entries.map(([year,value])=>({year:block(ctx,year,width-24,38,700),value:fit(ctx,Number.isFinite(value)?percent(value,true):'Indisponible',width-28,78,48,false),negative:value<0}))
    returnRows.push({cells,width,height:Math.max(...cells.map(cell=>cell.year.height+cell.value.height+42))})
  }
  const perfTitle=block(ctx,`PERFORMANCES ANNUELLES${factsheetCurrency(sheet)?` EN ${factsheetCurrency(sheet)}`:''}`,USABLE-70,43,700)
  const perfH=returns.length?perfTitle.height+28+returnRows.reduce((sum,row)=>sum+row.height,0)+16:0
  const concentrationH=sheet.concentration?.available?150:0
  const H=Math.ceil(PAD+headerH+GAP+concentrationH+bands.reduce((sum,band)=>sum+band.height+GAP,0)+perfH+86)
  canvas.width=W;canvas.height=H;paper(ctx,H)
  ctx.save();ctx.shadowColor='#572c2440';ctx.shadowBlur=5;ctx.shadowOffsetY=4
  draw(ctx,title,PAD+14,PAD-4,'left',C.navy);ctx.restore()
  draw(ctx,subtitle,PAD+16,PAD+title.height+3,'left',C.navy)
  if(badgeW){
    const x=W-PAD-badgeW
    panel(ctx,x,PAD-5,badgeW,270,'peach',125)
    draw(ctx,fit(ctx,count.toLocaleString('fr-FR'),badgeW-26,130,77,false),x+badgeW/2,PAD+40,'center',C.navy)
    draw(ctx,block(ctx,sheet.constituents==null?'sociétés visées':'titres',badgeW-26,sheet.constituents==null?30:43,700),x+badgeW/2,PAD+180,'center',C.navy)
  }
  let y=PAD+headerH+GAP
  if(concentrationH){
    panel(ctx,PAD,y,USABLE,concentrationH-GAP,'ivory')
    draw(ctx,block(ctx,'Poids des 10 premières entreprises',USABLE-500,40,700),PAD+32,y+39,'left',C.navy)
    draw(ctx,fit(ctx,percent(sheet.concentration.topWeight),430,78,64,false),W-PAD-32,y+19,'right',C.navy);y+=concentrationH
  }
  for(const band of bands){
    panel(ctx,PAD,y,USABLE,band.height,band.style)
    draw(ctx,block(ctx,band.label,USABLE-80,54,700),PAD+54,y+27)
    const offset=(USABLE-band.cells.length*band.width)/2
    if(!band.cells.length)draw(ctx,block(ctx,'Données indisponibles',USABLE-100,48,700),W/2,y+200,'center',C.muted)
    band.cells.forEach((cell,i)=>{
      const center=PAD+offset+(i+.5)*band.width,iconY=y+105
      if(band.kind==='country')drawFlag(ctx,cell.image,center-84,iconY+4,168,126)
      else if(band.kind==='sector')drawSector(ctx,cell.raw,center-60,iconY,120)
      else logoSupport(ctx,cell.image,cell.name,center-61,iconY-2,122)
      draw(ctx,cell.nameBlock,center,y+241,'center',C.ink)
      draw(ctx,cell.valueBlock,center,y+241+band.nameH+9,'center',band.kind==='company'?'#042d31':C.ink)
    })
    y+=band.height+GAP
  }
  if(returns.length){
    panel(ctx,PAD,y,USABLE,perfH,'ivory')
    draw(ctx,perfTitle,PAD+50,y+24,'left',C.navy);y+=perfTitle.height+30
    for(const row of returnRows){
      row.cells.forEach((cell,i)=>{
        const x=PAD+i*row.width,center=x+row.width/2
        if(i){ctx.fillStyle=C.rule;ctx.fillRect(x,y+15,1.5,row.height-24)}
        draw(ctx,cell.year,center,y+10,'center',C.navy)
        draw(ctx,cell.value,center,y+cell.year.height+18,'center',cell.negative?C.negative:C.positive)
      });y+=row.height
    }
  }
  draw(ctx,block(ctx,'Épargnant Libre',USABLE,39,700),W/2,H-60,'center',C.navy)
  return canvas
}

export async function renderCompositionImage(sheet, composition) {
  if(!composition?.available) throw new Error('Composition indisponible')
  const logos=await Promise.all(composition.top.map(row=>companyLogo(sheet,row.name,row.securities)))
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')
  if(!ctx)throw new Error('Impossible de créer l’image')
  const width=1200,margin=44,columnW=538,gap=36
  const colors=['#e49c7b','#b49bd3','#6abbb6','#f2c3a4','#8470ae','#94d6c4','#cea4be','#467f83','#dfc4ec','#c99764','#f3e5c6']
  const values=roundedComposition(composition)
  const entries=[...composition.top.map((row,i)=>({name:compositionCompanyLabel(row.name),value:values[i],weight:row.weightPct,color:colors[i],image:logos[i]})),
    {name:'Autres entreprises',value:values[10],weight:composition.otherWeight,color:colors[10],other:true}]
  const title=block(ctx,sheet.index??sheet.title,width-margin*2,76,700)
  const titleY=38,donutTop=titleY+title.height+28,diameter=600
  const legendTop=donutTop+diameter+60
  const rows=[]
  for(let i=0;i<entries.length;i+=2){
    const cells=entries.slice(i,i+2).map(entry=>({...entry,label:block(ctx,entry.name,columnW-124,36,500),valueBlock:block(ctx,percent(entry.value),columnW-124,42,700)}))
    rows.push({cells,height:Math.max(...cells.map(cell=>cell.label.height+cell.valueBlock.height+18),92)+26})
  }
  const height=Math.ceil(legendTop+rows.reduce((sum,row)=>sum+row.height,0)+90)
  canvas.width=width;canvas.height=height;paper(ctx,height,width)
  draw(ctx,title,width/2,titleY,'center',C.navy)
  panel(ctx,margin,donutTop-8,width-margin*2,diameter+44,'lavender')
  const cx=width/2,cy=donutTop+diameter/2+10,outer=diameter/2-20,inner=185
  let angle=-Math.PI/2
  for(const entry of entries){
    const end=angle+entry.weight/100*Math.PI*2
    if(end>angle){ctx.beginPath();ctx.arc(cx,cy,outer,angle,end);ctx.arc(cx,cy,inner,end,angle,true);ctx.closePath();ctx.fillStyle=entry.color;ctx.fill();ctx.strokeStyle='#84669a';ctx.lineWidth=1.5;ctx.stroke()}
    angle=end
  }
  draw(ctx,fit(ctx,percent(composition.topWeight),inner*2-20,78,58,false),cx,cy-58,'center')
  draw(ctx,block(ctx,'Top 10',inner*2-20,42,700),cx,cy+49,'center',C.navy)
  let y=legendTop
  for(const row of rows){
    row.cells.forEach((entry,i)=>{
      const x=margin+i*(columnW+gap)
      ctx.fillStyle=entry.color;ctx.beginPath();ctx.roundRect(x,y+5,8,row.height-30,4);ctx.fill()
      if(!entry.other)logoSupport(ctx,entry.image,entry.name,x+20,y+13,68)
      draw(ctx,entry.valueBlock,x+104,y+3,'left',C.navy)
      draw(ctx,entry.label,x+104,y+entry.valueBlock.height+12,'left',C.navy)
    });y+=row.height
  }
  draw(ctx,block(ctx,'Épargnant Libre',width-88,34,700),width/2,height-57,'center',C.navy)
  return canvas
}
