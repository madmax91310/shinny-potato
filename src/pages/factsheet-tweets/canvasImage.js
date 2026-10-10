import { loadArtImage } from '../tweet-midi/anniversaryArt.js'
import { getIndexArt, loadIndexArt } from './visualIdentity.js'
import { companyLabel, plainLabel, sortedRows, sumRows } from './editorial.js'

const W = 1600, H = 1120
const C = { ink: '#F0F2EB', muted: '#A6B9AE', accent: '#E5C386', negative: '#FA9293', rule: '#2D423B' }
function write(ctx, text, x, y, size=28, color=C.ink, weight=400, align='left') {
  ctx.font=`${weight} ${size}px Arial, sans-serif`; ctx.textBaseline='top'; ctx.textAlign=align
  ctx.fillStyle=color; ctx.fillText(String(text),x,y); ctx.textAlign='left'
}
// Wrap names instead of reducing them to tiny type. The last line is bounded.
function paragraph(ctx, text, x, y, width, size=28, color=C.ink, weight=400, maxLines=2) {
  ctx.font=`${weight} ${size}px Arial, sans-serif`
  const words=String(text).split(/\s+/), lines=[]
  let line=''
  for (const word of words) {
    const next=line?`${line} ${word}`:word
    if (ctx.measureText(next).width>width && line) { lines.push(line); line=word } else line=next
  }
  if(line) lines.push(line)
  if(lines.length>maxLines) {
    lines[maxLines-1]=lines.slice(maxLines-1).join(' ')
    lines.length=maxLines
  }
  for(let i=0;i<lines.length;i++) {
    let value=lines[i]
    if(ctx.measureText(value).width>width) {
      while(value.length && ctx.measureText(value+'…').width>width) value=value.slice(0,-1)
      value+='…'
    }
    write(ctx,value,x,y+i*size*1.18,size,color,weight)
  }
  return y+lines.length*size*1.18
}
function percent(n,signed=false) {
  return `${signed&&n>0?'+':n<0?'−':''}${Math.abs(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} %`
}
function rule(ctx,x,y,width) {ctx.fillStyle=C.rule;ctx.fillRect(x,y,width,1)}
function card(ctx,x,y,width,height) {
  ctx.fillStyle='#142623';ctx.beginPath();ctx.roundRect(x,y,width,height,18);ctx.fill()
  ctx.strokeStyle=C.rule;ctx.lineWidth=1;ctx.stroke()
}
function heading(ctx,text,x,y) {write(ctx,text,x,y,24,C.muted,700)}
function displayLabel(name) {
  return plainLabel(name)
    .replace(/Technologies de l.info\.?/i,'Technologie')
    .replace(/Services de communication/i,'Communication')
    .replace(/Consommation discrétionnaire/i,'Conso discrétionnaire')
    .replace(/Consommation de base/i,'Conso de base')
    .replace(/Services financiers/i,'Finance')
}
function ranking(ctx,rows,x,y,width) {
  rows.slice(0,4).forEach(([name,value],i)=>{
    const top=y+i*66
    paragraph(ctx,displayLabel(name),x,top,width-138,28,C.ink,400,1)
    write(ctx,percent(value),x+width,top,29,C.accent,700,'right')
    ctx.fillStyle='#253D33';ctx.fillRect(x,top+41,width,5)
    ctx.fillStyle='#BD9C62';ctx.fillRect(x,top+41,width*Math.min(value,100)/100,5)
  })
}
function performanceNote(sheet) {
  const detail = sheet.performance.detail
    .replace(sheet.title + ', ', '')
    .replace('rendements nets en dollars', 'USD · rendement net')
    .replace('rendement brut en dollars', 'USD · rendement brut')
    .replace('rendement total en dollars', 'USD · rendement total')
    .replace('rendement net en euros', 'EUR · rendement net')
    .replace('en EUR, hors dividendes (Price Return)', 'EUR · hors dividendes')
    .replace(' ; secteurs selon la classification ICB de FTSE', ' · secteurs ICB')
  const fundNotes = {
    'sp500-equal-weight': 'ETF Xtrackers 1C · USD · dividendes réinvestis · net de frais',
    topix: 'ETF Amundi TOPIX · EUR · non couvert · net de frais',
    nikkei225: 'ETF Xtrackers 1C · JPY · dividendes réinvestis · net de frais',
    'em-esg': 'ETF Amundi PEA Émergent ESG · EUR · net de frais',
    'sp500-pea': 'ETF Amundi PEA S&P 500 · EUR · net de frais',
    'nasdaq-pea': 'ETF Amundi PEA Nasdaq-100 · EUR · net de frais',
  }
  const history = sheet.performance.historyNote
    ? /27 septembre 2023/.test(sheet.performance.historyNote)
      ? 'Indice changé le 27/09/2023 ; historique du fonds.'
      : 'Rendements de l’ETF ; composition de l’indice.'
    : null
  return { detail: fundNotes[sheet.id] ?? detail, history }
}


function hero(sheet) {
  const countries=sortedRows(sheet.countries), holdings=sortedRows(sheet.holdings)
  const usa=countries.find(([name])=>/États-Unis/i.test(name))
  if(sheet.id==='acwi' && usa) return [usa[1],'DU POIDS DANS LES ENTREPRISES AMÉRICAINES']
  if(sheet.id==='eurostoxx50' && holdings.length) return [holdings[0][1],`DU POIDS DANS ${companyLabel(holdings[0][0]).toUpperCase()}`]
  if(countries.length>1 && countries[0]) return [countries[0][1],`DU POIDS : ${plainLabel(countries[0][0]).toUpperCase()}`]
  return [sheet.topWeight??sumRows(holdings.slice(0,10)), 'DU POIDS DANS LES 10 PREMIÈRES LIGNES']
}
export async function renderFactsheetImage(sheet) {
  const identity=getIndexArt(sheet)
  const art=await (identity.scene==='sp500'?loadArtImage('approved/index-sp500.webp'):loadIndexArt(sheet))
  const canvas=document.createElement('canvas');canvas.width=W*1.5;canvas.height=H*1.5
  const ctx=canvas.getContext('2d');ctx.scale(1.5,1.5)
  const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#10231D');bg.addColorStop(1,'#080F12')
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H)
  const layer=document.createElement('canvas');layer.width=740;layer.height=430
  const l=layer.getContext('2d'), ah=740*art.height/art.width
  l.drawImage(art,0,-60,740,ah);l.globalCompositeOperation='destination-in'
  const fade=l.createLinearGradient(0,0,740,0)
  fade.addColorStop(0,'transparent');fade.addColorStop(.15,'white');fade.addColorStop(.85,'white');fade.addColorStop(1,'transparent')
  l.fillStyle=fade;l.fillRect(0,0,740,430)
  const bottom=l.createLinearGradient(0,0,0,430)
  bottom.addColorStop(0,'transparent');bottom.addColorStop(.15,'white');bottom.addColorStop(.75,'white');bottom.addColorStop(1,'transparent')
  l.fillStyle=bottom;l.fillRect(0,0,740,430)
  ctx.save();ctx.globalAlpha=.8;ctx.drawImage(layer,790,20);ctx.restore()
  ctx.fillStyle='#C7A86D';ctx.fillRect(60,57,5,45)
  paragraph(ctx,sheet.index??sheet.title,88,48,800,56,C.ink,700,2)
  paragraph(ctx,identity.description,64,186,850,28,C.muted,400,1)
  const date=sheet.indexFacts?.asOf
  write(ctx,`Composition au ${date?date.split('-').reverse().join('/'):sheet.snapshot}`,64,224,24,C.muted)
  const [value,caption]=hero(sheet)
  write(ctx,percent(value),62,263,92,C.accent,700)
  paragraph(ctx,caption,68,365,820,26,C.muted,700,1)
  const count=sheet.constituents??sheet.indexFacts?.targetConstituents
  const countText=count==null?'Nombre de titres non publié':`${count.toLocaleString('fr-FR')} ${sheet.constituents==null?'sociétés visées':'titres dans l’indice'}`
  const top=sheet.topWeight??sumRows(sortedRows(sheet.holdings).slice(0,10))
  write(ctx,countText,68,405,28)
  write(ctx,`10 premières lignes : ${percent(top)}`,900,405,26,C.muted)
  card(ctx,60,462,462,332);heading(ctx,'PRINCIPAUX PAYS',84,486)
  ranking(ctx,sortedRows(sheet.countries).filter(([n])=>!/autres|others/i.test(n)),84,533,414)
  card(ctx,542,462,462,332);heading(ctx,'PRINCIPAUX SECTEURS',566,486)
  ranking(ctx,sortedRows(sheet.sectors).slice(0,3),566,533,414)
  write(ctx,'Poids dans l’indice',566,753,24,C.muted)
  card(ctx,1024,462,516,332);heading(ctx,'PRINCIPALES ENTREPRISES',1048,486)
  sortedRows(sheet.holdings).slice(0,4).forEach(([name,v],i)=>{
    const y=533+i*62
    write(ctx,String(i+1).padStart(2,'0'),1048,y+3,24,C.muted)
    paragraph(ctx,companyLabel(name),1092,y,292,26,C.ink,400,2)
    write(ctx,percent(v),1516,y,29,C.accent,700,'right')
  })
  rule(ctx,60,823,1480);heading(ctx,'PERFORMANCES ANNUELLES',60,845)
  const returns=sheet.returns.slice().sort((a,b)=>a[0]-b[0]),step=1480/returns.length
  returns.forEach(([year,v],i)=>{
    const x=60+i*step;write(ctx,year,x,886,28,C.muted)
    write(ctx,percent(v,true),x,928,44,v<0?C.negative:C.accent,700)
  })
  rule(ctx,60,989,1480)
  const note=performanceNote(sheet)
  paragraph(ctx,`${note.detail} · ${sheet.performance.date}`,60,1005,1480,24,C.muted,400,2)
  if(note.history) paragraph(ctx,note.history,60,1084,1190,24,C.muted,400,1)
  else write(ctx,'Pas un conseil financier',60,1084,24,C.muted)
  write(ctx,'Épargnant Libre',1540,1084,24,C.muted,700,'right')
  return canvas
}
