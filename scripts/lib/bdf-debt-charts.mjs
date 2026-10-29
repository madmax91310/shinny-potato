// Read the issuer's literal chart data. Never execute downloaded JavaScript.
import {htmlElement} from './radar-article-body.mjs'
import {cleanText} from './purchasing-power-news.mjs'

function literal(text, start) {
  const open=text[start],close=open==='['?']':open==='{'?'}':null
  if(!close)throw Error('Graphique BDF : littéral attendu')
  let depth=0,quote=null,escaped=false
  for(let i=start;i<text.length;i++){
    const c=text[i]
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='"'||c==="'"){quote=c;continue}
    if(c===open)depth++
    if(c===close&&--depth===0)return text.slice(start,i+1)
  }
  throw Error('Graphique BDF : littéral tronqué')
}
function arrayField(text,name){
  const matches=[...text.matchAll(new RegExp(`\\b${name}\\s*:\\s*\\[`,'g'))]
  if(matches.length!==1)throw Error(`Graphique BDF : tableau ${name} absent ou ambigu`)
  return literal(text,matches[0].index+matches[0][0].lastIndexOf('['))
}
function objects(array){
  const rows=[];let rest=array.slice(1,-1).trim()
  while(rest){if(rest[0]!=='{')throw Error('Graphique BDF : série non littérale');const row=literal(rest,0);rows.push(row);rest=rest.slice(row.length).trim();if(rest){if(rest[0]!==',')throw Error('Graphique BDF : séparateur invalide');rest=rest.slice(1).trim()}}
  return rows
}
function textField(text,name){
  const matches=[...text.matchAll(new RegExp(`\\b${name}\\s*:\\s*'((?:\\\\u[0-9a-fA-F]{4}|[^'\\\\])*)'`,'g'))]
  if(matches.length!==1)throw Error(`Graphique BDF : ${name} absent ou ambigu`)
  return matches[0][1].replace(/\\u([0-9a-fA-F]{4})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16)))
}
const definitions=[
  {heading:'Ménages : dette et patrimoine financier',units:/Ratios en % du PIB/,population:'Ménages',series:[
    ['Dette des ménages (axe de droite)','YAxis2','% du PIB'],
    ['Patrimoine financier (axe de gauche)','YAxis','% du PIB']]},
  {heading:'SNF : dette et levier',units:/Ratios respectivement en % du PIB et % des fonds propres/,population:'Sociétés non financières',series:[
    ['Levier (axe de droite)','YAxis2','% des fonds propres'],
    ['Dette en % du PIB (axe de gauche)','YAxis','% du PIB']]},
]
export function bdfDebtCharts(html,title,publishedAt){
  const period=title.match(/\b(20\d{2})[-\s]+[QT]([1-4])\b/)
  if(!period)throw Error('Graphique BDF : trimestre de la publication absent')
  const end=new Date(Date.UTC(Number(period[1]),Number(period[2])*3,0)).toISOString().slice(0,10)
  if(!publishedAt||end>publishedAt.slice(0,10))throw Error('Graphique BDF : période postérieure à la publication')
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>/\.highcharts\s*\(/.test(s))
  if(scripts.length!==2)throw Error('Graphique BDF : deux graphiques complets attendus')
  const results=[],seen=new Set(),containers=[...html.matchAll(/<div\b[^>]*data-type=["']webstat-xml-container["'][^>]*>/gi)]
  for(const script of scripts){
    const id=script.match(/jQuery\(\s*['"]#(chart\d+)['"]\s*\)\.highcharts\s*\(/)?.[1]
    if(!id||seen.has(id))throw Error('Graphique BDF : identité de graphique ambiguë');seen.add(id)
    const marker=new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`),bodies=containers.map(m=>htmlElement(html,m.index)).filter(s=>marker.test(s))
    if(bodies.length!==1)throw Error('Graphique BDF : contexte du graphique absent ou ambigu')
    const context=cleanText(bodies[0]),specs=definitions.filter(d=>context.includes(d.heading)&&d.units.test(context))
    if(specs.length!==1)throw Error('Graphique BDF : population ou unités non qualifiées')
    const spec=specs[0],axes=objects(arrayField(script,'xAxis'))
    if(axes.length!==1||textField(axes[0],'id')!=='XAxis')throw Error('Graphique BDF : axe temporel non qualifié')
    const categories=arrayField(axes[0],'categories'),labels=[...categories.matchAll(/'T([1-4]) (20\d{2})'/g)].map(m=>({quarter:Number(m[1]),year:Number(m[2])}))
    if(!/^\[\s*'T[1-4] 20\d{2}'(?:\s*,\s*'T[1-4] 20\d{2}')*\s*\]$/.test(categories)||!labels.length)throw Error('Graphique BDF : périodes non littérales')
    if(labels.some((p,i)=>i&&p.year*4+p.quarter!==labels[i-1].year*4+labels[i-1].quarter+1))throw Error('Graphique BDF : périodes dupliquées ou discontinues')
    const last=labels.at(-1)
    if(last.year!==Number(period[1])||last.quarter!==Number(period[2]))throw Error('Graphique BDF : bornes différentes du trimestre demandé')
    const rows=objects(arrayField(script,'series')),names=new Set()
    if(rows.length!==spec.series.length)throw Error('Graphique BDF : série omise ou supplémentaire')
    for(const row of rows){
      const name=textField(row,'name'),definition=spec.series.find(s=>s[0]===name),axis=textField(row,'yAxis')
      if(!definition||names.has(name)||axis!==definition[1]||textField(row,'xAxis')!=='XAxis')throw Error('Graphique BDF : identité ou axe de série incohérent');names.add(name)
      const data=JSON.parse(arrayField(row,'data'))
      if(data.length!==labels.length||data.some(v=>v!==null&&(typeof v!=='number'||!Number.isFinite(v)))||typeof data.at(-1)!=='number')throw Error('Graphique BDF : valeurs absentes ou décalées')
      results.push({label:name.replace(/ \(axe de (?:droite|gauche)\)$/,''),population:spec.population,value:data.at(-1),unit:definition[2],chartId:id,axis,observations:data.length,period:`${last.year}-Q${last.quarter}`})
    }
  }
  if(definitions.some(d=>results.filter(r=>r.population===d.population).length!==d.series.length))throw Error('Graphique BDF : périmètre incomplet')
  const format=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2})
  return {period:`${period[1]}-Q${period[2]}`,series:results,summary:`T${period[2]} ${period[1]} — `+results.map(r=>`${r.population} : ${r.label}, ${format.format(r.value)} ${r.unit}`).join(' ; ')}
}
