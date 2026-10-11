import { getIndexArt } from './visualIdentity.js'
import { companyLabel, plainLabel, sectorLabel, sortedRows, sumRows } from './editorial.js'

const W = 1600, H = 1120
const C = { ink: '#111820', muted: '#627087', accent: '#0646CE', negative: '#C73241', rule: '#A9BCE9' }
let globePromise
function loadGlobe() {
  if (!globePromise) globePromise = (async () => {
    const image = new Image()
    image.src = `${import.meta.env.BASE_URL}asset-art/index-editorial-globe.webp`
    await image.decode()
    return image
  })().catch(error => { globePromise = null; throw error })
  return globePromise
}
function write(ctx, text, x, y, size=28, color=C.ink, weight=400, align='left') {
  ctx.font=`${weight} ${size}px Georgia, 'Times New Roman', serif`; ctx.textBaseline='top'; ctx.textAlign=align
  ctx.fillStyle=color; ctx.fillText(String(text),x,y); ctx.textAlign='left'
}
// Wrap names instead of reducing them to tiny type. The last line is bounded.
function paragraph(ctx, text, x, y, width, size=28, color=C.ink, weight=400, maxLines=2) {
  ctx.font=`${weight} ${size}px Georgia, 'Times New Roman', serif`
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
function heading(ctx,text,x,y) {write(ctx,text,x,y,24,C.accent,700)}
function displayLabel(name) {
  return plainLabel(name)
    .replace(/Technologies de l.info\.?/i,'Technologie')
    .replace(/Services de communication/i,'Communication')
    .replace(/Consommation discrétionnaire|Consommation cyclique/i,'Conso cyclique')
    .replace(/Consommation de base/i,'Conso de base')
    .replace(/Services financiers/i,'Finance')
}
function ranking(ctx,rows,x,y,width,{size=28,maxLines=1}={}) {
  rows.slice(0,4).forEach(([name,value],i)=>{
    const top=y+i*66
    paragraph(ctx,displayLabel(name),x,top,width-138,size,C.ink,400,maxLines)
    write(ctx,percent(value),x+width,top,29,C.accent,700,'right')
  })
}
function performanceNote(sheet) {
  const detail = sheet.performance.detail
    .replace(sheet.title + ', ', '')
    .replace('rendements nets en dollars', 'USD · rendement net')
    .replace('rendement brut en dollars', 'USD · rendement brut')
    .replace('rendement total en dollars', 'USD · rendement total')
    .replace('rendement net en euros', 'EUR · rendement net')
    .replace('en EUR, dividendes nets réinvestis', 'EUR · dividendes nets réinvestis')
    .replace('en EUR, hors dividendes (Price Return)', 'EUR · hors dividendes')
    .replace(' ; secteurs selon la classification ICB de FTSE', ' · secteurs ICB')

  const history = sheet.performance.historyNote
    ? /27 septembre 2023/.test(sheet.performance.historyNote)
      ? 'Indice changé le 27/09/2023 ; historique du fonds.'
      : 'Rendements de l’ETF ; composition de l’indice.'
    : null
  return { detail, history }
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
  const art=await loadGlobe()
  const canvas=document.createElement('canvas');canvas.width=W*1.5;canvas.height=H*1.5
  const ctx=canvas.getContext('2d');ctx.scale(1.5,1.5)
  ctx.fillStyle='#FAFAF7';ctx.fillRect(0,0,W,H)
  // The globe is decorative: the figures and rankings remain live application data.
  ctx.drawImage(art,1082,25,470,470)
  const title=sheet.index??sheet.title
  ctx.font="700 100px Georgia, 'Times New Roman', serif"
  const titleSize=ctx.measureText(title).width<=1010?100:58
  paragraph(ctx,title,60,30,1010,titleSize,C.ink,700,2)
  paragraph(ctx,identity.description,64,177,1000,30,C.ink,700,1)
  const date=sheet.indexFacts?.asOf
  write(ctx,`Composition au ${date?date.split('-').reverse().join('/'):sheet.snapshot}`,64,224,24,C.muted)
  const [value,caption]=hero(sheet)
  write(ctx,percent(value),62,255,110,C.accent,700)
  paragraph(ctx,caption,68,392,980,26,C.ink,700,1)
  const count=sheet.constituents??sheet.indexFacts?.targetConstituents
  const countText=count==null?'Nombre de titres non publié':`${count.toLocaleString('fr-FR')} ${sheet.constituents==null?'sociétés visées':'titres dans l’indice'}`
  const top=sheet.topWeight??sumRows(sortedRows(sheet.holdings).slice(0,10))
  rule(ctx,60,438,990)
  write(ctx,countText,68,459,28,C.accent,700)
  write(ctx,`10 premières lignes : ${percent(top)}`,1050,459,26,C.accent,700,'right')
  heading(ctx,'PRINCIPAUX PAYS',64,539);rule(ctx,64,575,432)
  ranking(ctx,sortedRows(sheet.countries).filter(([n])=>!/autres|others/i.test(n)),64,601,432)
  heading(ctx,'PRINCIPAUX SECTEURS',558,539);rule(ctx,558,575,432)
  ranking(ctx,sortedRows(sheet.sectors).slice(0,3).map(([name,value])=>[sectorLabel(name),value]),558,601,432,{size:26,maxLines:2})
  write(ctx,'Poids dans l’indice',558,799,24,C.muted)
  heading(ctx,'PRINCIPALES ENTREPRISES',1050,539);rule(ctx,1050,575,490)
  ctx.fillStyle=C.rule;ctx.fillRect(523,539,1,288);ctx.fillRect(1017,539,1,288)
  sortedRows(sheet.holdings).slice(0,4).forEach(([name,v],i)=>{
    const y=601+i*60
    write(ctx,String(i+1).padStart(2,'0'),1048,y+3,24,C.muted)
    paragraph(ctx,companyLabel(name),1092,y,285,26,C.ink,400,2)
    write(ctx,percent(v),1516,y,29,C.accent,700,'right')
  })
  heading(ctx,'PERFORMANCES ANNUELLES',60,852);rule(ctx,510,869,1030)
  const returns=sheet.returns.slice().sort((a,b)=>a[0]-b[0]),step=1480/returns.length
  returns.forEach(([year,v],i)=>{
    const x=60+i*step;write(ctx,year,x,900,28,C.muted)
    write(ctx,percent(v,true),x,941,44,v<0?C.negative:C.accent,700)
  })
  rule(ctx,60,1000,1480)
  const note=performanceNote(sheet)
  paragraph(ctx,`${note.detail} · ${sheet.performance.date}`,60,1016,1480,24,C.muted,400,2)
  if(note.history) paragraph(ctx,note.history,60,1084,1190,24,C.muted,400,1)
  else write(ctx,'Pas un conseil financier',60,1084,24,C.muted)
  write(ctx,'Épargnant Libre',1540,1084,24,C.muted,700,'right')
  return canvas
}
