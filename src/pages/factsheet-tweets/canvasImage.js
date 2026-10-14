import { getIndexArt } from './visualIdentity.js'
import { companyLabel, plainLabel, sectorLabel, sortedRows, sumRows } from './editorial.js'

const W = 1600, H = 2000
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
  let lines
  for (; size >= 22; size--) {
    ctx.font=`${weight} ${size}px Georgia, 'Times New Roman', serif`
    lines=[]; let line=''
    for (const word of String(text).split(/\s+/)) {
      const next=line?`${line} ${word}`:word
      if (line && ctx.measureText(next).width>width) {lines.push(line);line=word} else line=next
    }
    if(line)lines.push(line)
    if(lines.length<=maxLines && lines.every(line=>ctx.measureText(line).width<=width))break
  }
  if(size<22)throw new Error(`Texte trop long pour la fiche indice : ${text}`)
  for(let i=0;i<lines.length;i++) write(ctx,lines[i],x,y+i*size*1.22,size,color,weight)
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


export async function renderFactsheetImage(sheet) {
  const identity=getIndexArt(sheet), art=await loadGlobe()
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H
  const ctx=canvas.getContext('2d')
  ctx.fillStyle='#FAFAF7';ctx.fillRect(0,0,W,H)
  write(ctx,'Épargnant Libre',80,45,29,C.ink,700)
  const date=sheet.indexFacts?.asOf
  write(ctx,`Composition au ${date?date.split('-').reverse().join('/'):sheet.snapshot}`,1520,45,26,C.muted,400,'right')
  ctx.drawImage(art,1120,210,400,400)
  paragraph(ctx,sheet.index??sheet.title,80,120,1440,91,C.ink,700,2)
  const count=sheet.constituents??sheet.indexFacts?.targetConstituents
  const countText=count==null?identity.description:`${count.toLocaleString('fr-FR')} ${sheet.constituents==null?'sociétés visées':'titres dans l’indice'}`
  paragraph(ctx,countText,85,350,1010,36,C.muted,400,2)
  const holdings=sortedRows(sheet.holdings), top=sheet.topWeight??sumRows(holdings.slice(0,10))
  const topCount=sheet.topWeight!=null?10:Math.min(10,holdings.length)
  write(ctx,percent(top),80,445,135,C.accent,700)
  paragraph(ctx,`du poids dans les ${topCount} premières lignes`,85,610,1010,36,C.ink,700,2)
  rule(ctx,80,710,1440)
  heading(ctx,'PRINCIPAUX PAYS',80,750);heading(ctx,'PRINCIPAUX SECTEURS',850,750)
  const countries=sortedRows(sheet.countries).filter(([n])=>!/autres|others/i.test(n)).slice(0,4)
  const sectors=sortedRows(sheet.sectors).slice(0,3).map(([n,v])=>[sectorLabel(n),v])
  for (const [rows,x] of [[countries,80],[sectors,850]]) rows.forEach(([name,value],i)=>{
    paragraph(ctx,displayLabel(name),x,810+i*80,430,34,C.ink,400,2)
    write(ctx,percent(value),x+660,810+i*80,38,C.accent,700,'right')
  })
  ctx.fillStyle=C.rule;ctx.fillRect(800,750,1,360)
  rule(ctx,80,1150,1440);heading(ctx,'PRINCIPALES ENTREPRISES',80,1190)
  holdings.slice(0,4).forEach(([name,value],i)=>{
    const y=1250+i*85
    write(ctx,String(i+1).padStart(2,'0'),80,y,31,C.muted)
    paragraph(ctx,companyLabel(name),175,y,1080,39,C.ink,400,2)
    write(ctx,percent(value),1520,y,43,C.accent,700,'right')
  })
  rule(ctx,80,1600,1440);heading(ctx,'PERFORMANCES ANNUELLES',80,1640)
  const returns=sheet.returns.slice().sort((a,b)=>a[0]-b[0]),step=1440/returns.length
  returns.forEach(([year,value],i)=>{
    const x=80+i*step
    write(ctx,year,x,1700,32,C.muted)
    paragraph(ctx,percent(value,true),x,1750,step-15,46,value<0?C.negative:C.accent,700,1)
  })
  const note=performanceNote(sheet)
  paragraph(ctx,`${note.detail} · ${sheet.performance.date}`,80,1830,1440,27,C.muted,400,2)
  if(note.history)paragraph(ctx,note.history,80,1910,1440,23,C.muted,400,1)
  write(ctx,'Pas un conseil financier',80,1960,24,C.muted)
  return canvas
}
