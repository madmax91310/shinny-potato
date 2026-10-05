import { loadArtImage } from '../tweet-midi/anniversaryArt.js'
import { getIndexArt, loadIndexArt } from './visualIdentity.js'
const W = 1600, H = 1080
const C = { ink: '#F8F3F8', muted: '#C3B8CA', accent: '#FFAA79', positive: '#D7B6FF', negative: '#FF6D72', rule: '#744835' }
function write(ctx, text, x, y, size, color=C.ink, weight=400, align='left') {
 ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.textBaseline='top';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(String(text),x,y);ctx.textAlign='left'
}
function fitted(ctx,text,x,y,width,size,color=C.ink,weight=700,min=16) {
 while(size>min){ctx.font=`${weight} ${size}px Arial`;if(ctx.measureText(String(text)).width<=width)break;size--}
 write(ctx,text,x,y,size,color,weight)
}
function paragraph(ctx,text,x,y,width,size=22,color=C.muted,lineHeight=size*1.35) {
 ctx.font=`400 ${size}px Arial`;let line='',top=y
 for(const word of String(text).split(/\s+/)){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>width&&line){write(ctx,line,x,top,size,color);top+=lineHeight;line=word}else line=next}
 if(line)write(ctx,line,x,top,size,color);return top+lineHeight
}
function percent(n,signed=false){return `${signed&&n>0?'+':n<0?'−':''}${Math.abs(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} %`}
function label(n){return n.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]/gu,'').trim()}
function rule(ctx,x,y,width){ctx.fillStyle=C.rule;ctx.fillRect(x,y,width,1)}
function list(ctx,title,entries,x,y){write(ctx,title,x,y,26,C.ink,700);rule(ctx,x,y+35,575);entries.slice(0,3).forEach(([name,value],i)=>{const top=y+48+i*43;fitted(ctx,label(name),x,top,390,28,C.ink,400,16);ctx.textAlign='right';ctx.font='700 30px Arial';ctx.fillStyle=C.accent;ctx.textBaseline='top';ctx.fillText(percent(value),1540,top);ctx.textAlign='left'})}
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

export async function renderFactsheetImage(sheet) {
 const identity=getIndexArt(sheet)
 const art=await (identity.scene==='sp500' ? loadArtImage('approved/index-sp500.webp') : loadIndexArt(sheet))
 const canvas=document.createElement('canvas');canvas.width=W*1.5;canvas.height=H*1.5
 const ctx=canvas.getContext('2d');ctx.scale(1.5,1.5)
 const background=ctx.createLinearGradient(0,0,W,H);background.addColorStop(0,'#190f20');background.addColorStop(.5,'#130d1a');background.addColorStop(1,'#0d0b12');ctx.fillStyle=background;ctx.fillRect(0,0,W,H)
 if(identity.scene==='sp500') ctx.drawImage(art,0,0,1520,1013)
 else {
  const layer=document.createElement('canvas');layer.width=940;layer.height=790
  const l=layer.getContext('2d'),scale=Math.min(940/art.width,790/art.height),aw=art.width*scale,ah=art.height*scale
  l.drawImage(art,(940-aw)/2,(790-ah)/2,aw,ah);l.globalCompositeOperation='destination-in'
  const fade=l.createLinearGradient(0,0,940,0);fade.addColorStop(0,'transparent');fade.addColorStop(.08,'white');fade.addColorStop(.88,'white');fade.addColorStop(1,'transparent');l.fillStyle=fade;l.fillRect(0,0,940,790)
  ctx.drawImage(layer,0,0)
 }
 // Les noms exacts des indices longs restent dans le bloc de titre, avec la marge droite.
 fitted(ctx,sheet.index??sheet.title,970,45,585,100,C.ink,700,16)
 const count=sheet.constituents
 const country=sheet.countries?.length===1 ? label(sheet.countries[0][0])+' · ' : ''
 paragraph(ctx,count==null?`${sheet.indexFacts.targetConstituents.toLocaleString('fr-FR')} sociétés visées par la méthode`:`${country}${count.toLocaleString('fr-FR')} titres`,970,160,575,29)
 if(sheet.methodologyPanels){
  let y=245
  for(const [title,text] of sheet.methodologyPanels){write(ctx,title,970,y,25,C.accent,700);y=paragraph(ctx,text,970,y+36,575,25,C.ink,33)+24}
 }else{
  list(ctx,'SECTEURS',sheet.sectors,970,255);list(ctx,'PRINCIPALES POSITIONS',sheet.holdings,970,465)
  const top=sheet.topWeight??sheet.holdings.slice(0,10).reduce((sum,[,v])=>sum+v,0)
  write(ctx,percent(top),970,665,92,C.accent,700)
  write(ctx,'Poids des 10 premières lignes',970,773,27,C.muted)
 }
 if(identity.scene!=='sp500') {
  fitted(ctx,identity.description,55,755,830,24,C.accent,700)
  if(sheet.countries?.length){const countries=sheet.countries.slice(0,3).map(([name,value])=>`${label(name)} ${percent(value)}`).join(' · ');paragraph(ctx,countries,55,790,830,18)}
 }
 rule(ctx,55,835,1490)
 write(ctx,'PERFORMANCES',55,862,26,C.ink,700)
 const returns=sheet.returns.slice().sort((a,b)=>a[0]-b[0]),step=1490/returns.length
 returns.forEach(([year,value],i)=>{const x=55+i*step;write(ctx,year,x,907,25,C.muted);fitted(ctx,percent(value,true),x,946,step-26,48,value<0?C.negative:C.positive,700,25);if(i)rule(ctx,x-20,907,1)})
 rule(ctx,55,1008,1490)
 const note=performanceNote(sheet)
 fitted(ctx,`${note.detail} · ${sheet.performance.date}`,55,1025,1230,20,C.muted,400,14)
 if(note.history)fitted(ctx,note.history,55,1052,1230,16,C.muted,400,13)
 write(ctx,'Épargnant Libre',1545,1025,23,C.muted,400,'right')
 return canvas
}
