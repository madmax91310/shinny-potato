import { analyzeBudget, budgetPublicPresentation, budgetPublicIncomeRows, budgetPublicSavingsRows, budgetImageExpenses, euro, hasSeparateBudgetCapacity } from './lib.js'
import { budgetQualification, budgetPublicBasis, budgetRowSymbol } from './presentation.js'

export const SOCIAL_SIZE = { width: 1080, height: 1350 }
export const SOCIAL_BODY_SIZE = 40
const C = { ink:'#10182f', background:'#1c2127', cream:'#fff8e5', muted:'#c8ced9', income:'#dbd1ff', expense:'#ffc4ae', savings:'#c5f4cb', balance:'#f6e9c4', deficit:'#ffaaa8' }
const M=32, GAP=20, INNER=1016, END=1186, STEP=50
const type=(ctx,size,weight=600)=>{const font=`${weight} ${size}px Arial, sans-serif`;if(ctx.font!==font)ctx.font=font}
const wrapCache=new WeakMap(),measureCache=new WeakMap(),rowCache=new WeakMap()
function measure(ctx,value) {
  let cache=measureCache.get(ctx);if(!cache){cache=new Map();measureCache.set(ctx,cache)}
  const key=ctx.font+'|'+value
  if(!cache.has(key))cache.set(key,ctx.measureText(value))
  return cache.get(key)
}
function wrap(ctx,value,width,size=SOCIAL_BODY_SIZE,weight=600) {
  type(ctx,size,weight);let cache=wrapCache.get(ctx);if(!cache){cache=new Map();wrapCache.set(ctx,cache)}
  const key=JSON.stringify([value,width,size,weight]);if(cache.has(key))return cache.get(key)
  const result=[];let line=''
  const tokens=String(value).replace(/\d[\d \u00a0\u202f]*(?:[.,]\d+)?\s*(?:€|CHF|EUR|USD)/g,amount=>amount.replace(/\s/g,'\u00a0')).split(/[^\S\u00a0\u202f]+/).filter(Boolean)
  for(const word of tokens) {
    if(line&&measure(ctx,line+' '+word).width>width){result.push(line);line=''}
    for(const char of (line?' ':'')+word){if(measure(ctx,line+char).width>width){result.push(line);line=''}line+=char}
  }
  if(line)result.push(line);cache.set(key,result);return result
}
export function socialBudgetLabel(label) {
  return label.replace(/^Assurance-vieillesse luxembourgeoise$/i,'Assurance vieillesse (Luxembourg)').replace(/^Assurance-vie luxembourgeoise$/i,'Assurance-vie (Luxembourg)').replace(/^Sa part /i,'Part ').replace(/^(Part) (?:du |de la |de l[’']|des |d[’'])/i,'$1 ')
    .replace(/^Provision personnelle pour /i,'Provision ')
    .replace(/loyer et des charges hors énergie et eau/i,'loyer et charges (hors eau/énergie)')
    .replace(/énergie et de l’eau/i,'énergie et eau').replace(/entretien et des petits équipements/i,'entretien et équipement')
    .replace(/internet et forfait mobile/i,'internet et mobile').replace(/soins et frais de santé/i,'soins et santé')
    .replace(/^Épargne pour apport immobilier$/i,'Apport immobilier').replace(/\s+/g,' ').trim()
    .replace(/^./u,c=>c.toLocaleUpperCase('fr'))
}
const duration=n=>n%12===0?`${n/12} an${n===12?'':'s'}`:`${n} mois`
export function socialBudgetHighlights(profile) {
  if(profile.kind==='participant')return []
  const money=(n,currency=profile.currency)=>euro(n,currency),result=[]
  const finance=profile.editorialCreation?.finance||[]
  const emilie = profile.id==='prepared-lot2-08-2026-10-30' && finance.some(f=>f.type==='project'&&f.targetAmount===25000&&f.initialFunding===7000&&f.horizonMonths===36&&f.monthlyFunding===500)
  for(const [i,item] of finance.entries()) {
    if(emilie)continue
    if(item.type==='financial-stock')result.push({id:`stock:${i}`,label:`${item.label} : ${money(item.amount,item.currency)}${item.investmentMonths?` · depuis ${duration(item.investmentMonths)}`:''}${item.acceleratedMonthlyFunding?` · ${money(item.acceleratedMonthlyFunding)}/mois depuis ${duration(item.acceleratedFundingMonths)}`:''}`})
    if(item.type==='project') {
      const facts=[item.initialFunding!==undefined&&item.targetAmount!==undefined?`${money(item.initialFunding)} → ${money(item.targetAmount)}`:item.targetAmount!==undefined?`objectif ${money(item.targetAmount)}`:item.initialFunding!==undefined&&`déjà ${money(item.initialFunding)}`,item.horizonMonths&&`dans ${duration(item.horizonMonths)}`,item.monthlyFunding!==undefined&&`${money(item.monthlyFunding)}/mois`,item.consideredMonthlyFunding!==undefined&&`${money(item.consideredMonthlyFunding)}/mois envisagés`,item.fundingMonths&&`pendant ${duration(item.fundingMonths)}`,item.consideredRent!==undefined&&`loyer envisagé ${money(item.consideredRent)} contre ${money(item.currentRent)} actuellement (+${money(item.monthlyImpact)}/mois)`,item.alternativeRepair!==undefined&&`ou réparation à ${money(item.alternativeRepair)}`,item.requiresReallocation&&'versements à réorganiser',item.requiresPositiveBalance&&'achat reporté tant que le budget est déficitaire',item.fundedWithinExpenseEnvelope&&'financé par l’enveloppe déjà dans les dépenses',item.reviewAfterTarget&&'versement à revoir après cet objectif'].filter(Boolean)
      result.push({id:`project:${i}`,label:`${item.label} : ${facts.join(' · ')}`})
      for(const [j,part]of(item.components||[]).entries())result.push({id:`component:${i}:${j}`,label:`${part.label} : ${money(part.amount)}`})
    }
  }
  if(emilie)result.push(
    {id:'stock:livret',label:'Livret : 7 000 €'},
    {id:'stock:security',label:'Dont sécurité : 5 000 €'},
    {id:'project:apport',label:'Apport : 2 000 € → 20 000 € dans 3 ans'})
  const funding={
    'prepared-lot2-03-2026-10-30':'Lave-linge : sur l’enveloppe projets de 100 €/mois ; les 150 € de précaution restent séparés.',
    'prepared-lot2-06-2026-10-30':'Travaux : avec les 350 €/mois du Livret A, sans retrait. Réduire le PER permettrait de les avancer.',
    'finary-ingenieur-colocation-projet-2026-08-18':'Sur les 750 € envisagés : 170 € pour le séjour et 580 € sur le PEA. Rien n’est encore versé.'
  }
  if(funding[profile.id])result.push({id:'funding',label:funding[profile.id]})
  return result
}
function sectionsFor(profile,a,p,mode = 'social') {
  const rows=(key,items)=>items.map((r,i)=>({...r,id:`${key}:${i}`,label:mode === 'social' ? socialBudgetLabel(r.label) : r.label}))
  const basis=budgetPublicBasis(profile,p.basis)
  const note=[basis&&!/^Montants mensuels$/i.test(basis)&&basis,p.incomeNote].filter(Boolean).join(' · ').replace('Le salaire est celui de 2026 ; les dépenses reprennent la moyenne de 2025.', 'Salaire prévu, comparé aux dépenses moyennes de l’année précédente.')
  const sections=[{id:'income',title:'REVENUS',color:C.income,total:a.income,rows:[...(note?[{id:'income-note',label:note}]:[]),...rows('income',budgetPublicIncomeRows(profile))]}]
  sections.push({id:'expenses',title:'DÉPENSES',color:C.expense,total:a.expenses,rows:rows('expenses',budgetImageExpenses(profile,mode))})
  const transferKinds=new Set(budgetPublicSavingsRows(profile).map(row=>budgetRowSymbol(row,'savings').kind))
  const transferKind=transferKinds.size===1?[...transferKinds][0]:'other'
  if(profile.savings.length)sections.push({id:'savings',title:({savings:'ÉPARGNE',investment:'PLACEMENTS',business:'ENTREPRISE',debt:'REMBOURSEMENTS'})[transferKind]||'VERSEMENTS',color:C.savings,total:a.savings,rows:rows('savings',budgetPublicSavingsRows(profile))})
  const highlights=socialBudgetHighlights(profile)
  if(hasSeparateBudgetCapacity(profile,a))highlights.push({id:'capacity',label:`Capacité ${profile.kind==='planned'?'envisagée':'annoncée'} : ${euro(profile.capacity,profile.currency)}/mois`})
  if(profile.kind==='participant'&&profile.context.trim())highlights.push({id:'context',label:profile.context})
  if(highlights.length)sections.push({id:'projects',title:'RÉSERVES ET PROJETS',color:C.cream,rows:highlights})
  return sections
}
function rowPlan(ctx,row,width,money,single=false) {
  const amount=row.amount===undefined?'':money(row.amount)
  let cache=rowCache.get(ctx);if(!cache){cache=new Map();rowCache.set(ctx,cache)}
  const key=JSON.stringify([row,width,amount,single]);if(cache.has(key))return cache.get(key)
  type(ctx,SOCIAL_BODY_SIZE,700)
  const available=width-(amount&&!single?measure(ctx,amount).width+18:0)
  const longest=Math.max(0,...String(row.label).split(/\s+/).map(word=>measure(ctx,word).width))
  const stacked=!!amount&&!single&&(available<160||longest>available),lines=wrap(ctx,row.label,stacked?width:available)
  const result={...row,lines,stacked,amountText:single?'':amount,height:lines.length*STEP+8+(stacked?STEP:0)}
  cache.set(key,result);return result
}
function cardsFor(ctx,entries,width,money) {
  if(width<=0&&entries.length)return {cards:[],height:Infinity}
  const cards=[];const inner=width-36
  for(const entry of entries) {
    let card=cards.at(-1)
    if(!card||card.section.id!==entry.section.id) {
      const first=entry.rowIndex===0&&!entry.fragment
      const section=entry.section,title=section.title+(first?'':' · SUITE'),total=first?section.total:undefined
      type(ctx,30,800);const titleWidth=measure(ctx,title).width;type(ctx,44,800)
      if(total!==undefined&&measure(ctx,money(total)).width>inner)return {cards:[],height:Infinity}
      const inline=total!==undefined&&titleWidth+measure(ctx,money(total)).width+22<=inner
      const heading=wrap(ctx,title,inner,30,800),header=22+(inline?54:heading.length*36+(total===undefined?0:54))+10
      card={section,title,heading,total,inline,header,height:header+8,rows:[],width};cards.push(card)
    }
    const plan=rowPlan(ctx,entry.row,inner,money,entry.section.rows.filter(r=>r.amount!==undefined).length===1&&entry.section.total!==undefined)
    card.rows.push(plan);card.height+=plan.height
  }
  return {cards,height:cards.reduce((sum,c)=>sum+c.height+GAP,0)}
}
function bestColumns(ctx,entries,money,limit) {
  let best=null
  for(const widths of [[1016,0],[676,320],[648,348],[628,368],[596,400],[498,498],[400,596],[368,628],[320,676]]) {
    const expense=entries.filter(e=>e.section.id==='expenses'),other=entries.filter(e=>e.section.id!=='expenses')
    for(const lists of [[expense,other],[other,expense]]) {
      if(!expense.length||!other.length)continue
      const columns=lists.map((list,i)=>cardsFor(ctx,list,widths[i],money)),height=Math.max(...columns.map(c=>c.height))
      if(height<=limit&&(!best||height<best.height))best={columns,widths,height}
    }
    for(let i=0;i<=entries.length;i++) {
      const columns=[cardsFor(ctx,entries.slice(0,i),widths[0],money),cardsFor(ctx,entries.slice(i),widths[1],money)]
      const height=Math.max(...columns.map(c=>c.height))
      if(height<=limit&&(!best||height<best.height))best={columns,widths,height}
    }
  }
  return best
}
function entriesFor(sections){return sections.flatMap(section=>section.rows.map((row,rowIndex)=>({section,row,rowIndex})))}
function splitOversize(ctx,entries,money,limit) {
  return entries.flatMap(entry=>{
    if(cardsFor(ctx,[entry],498,money).height<=limit)return [entry]
    // Split exceptionally long user content across pages, keeping its amount once.
    const lines=wrap(ctx,entry.row.label,280),size=Math.max(1,Math.floor((limit-230)/STEP))
    const parts=[]
    for(let i=0;i<lines.length;i+=size)parts.push({...entry,fragment:i>0,row:{...entry.row,id:entry.row.id+`:part:${i/size}`,label:lines.slice(i,i+size).join(' '),...(i>0&&{amount:undefined})}})
    return parts
  })
}
export function planSocialBudget(ctx,profile,mode = 'social') {
  const a=analyzeBudget(profile);if(a.errors.length)throw new Error(a.errors.join(' '))
  const p=budgetPublicPresentation(profile),amounts=new Map()
  const money=n=>{if(!amounts.has(n))amounts.set(n,(profile.approximate?'≈ ':'')+euro(n,profile.currency));return amounts.get(n)}
  const name=p.name+(profile.age&&!p.name.includes(' et ')&&!p.name.includes(String(profile.age))?`, ${profile.age} ans`:'')
  const title=wrap(ctx,name,INNER,62,800)
  const parts=[p.job,p.household,p.location].filter(Boolean),qualification=budgetQualification(profile)
  if(qualification&&!parts.join(' ').toLocaleLowerCase('fr').includes(qualification.toLocaleLowerCase('fr')))parts.push(qualification)
  const context=parts.join(' · ')
  let details=wrap(ctx,context,INNER,36,500)
  const sections=sectionsFor(profile,a,p,mode)
  if(details.length>5){sections.unshift({id:'situation',title:'SITUATION',color:C.cream,rows:[{id:'situation',label:context}]});details=wrap(ctx,budgetQualification(profile),INNER,36,500)}
  const header=88+title.length*74+details.length*44+16,limit=END-header
  // Preserve the original narrative verbatim on separate readable pages. It
  // contains wealth, funding conditions and alternatives absent from ledger rows.
  const contextSection={id:'context',title:'PATRIMOINE ET PROJETS',color:C.cream,rows:profile.kind==='participant'?[]:profile.context.trim().split(/\n\s*\n/).filter(Boolean).map((label,i)=>({id:`context:${i}`,label}))}
  const contextPages=[]
  for(const row of contextSection.rows) {
    const lines=wrap(ctx,row.label,INNER-36)
    const size=Math.max(1,Math.floor((END-header-160)/STEP))
    for(let i=0;i<lines.length;i+=size) {
      const fragment={...row,id:row.id+`:part:${i/size}`,label:lines.slice(i,i+size).join(' ')}
      const column=cardsFor(ctx,[{section:contextSection,row:fragment,rowIndex:0}],INNER,money)
      contextPages.push({kind:'context',columns:[column],widths:[INNER],height:column.height})
    }
  }
  const entries=entriesFor(sections),candidate=bestColumns(ctx,entries,money,Infinity),single=candidate.height<=limit?candidate:null
  const fit={header,required:candidate.height,available:limit}
  if(single)return {a,p,money,title,details,header,sections,pages:[{kind:'complete',...single},...contextPages],single:true,fit}
  const pages=[],remaining=splitOversize(ctx,entries,money,Math.min(limit,1050-header))
  for(let from=0;from<remaining.length;) {
    const pageLimit=pages.length?limit:1050-header
    let fit=null,end=from,low=from+1,high=remaining.length
    while(low<=high) {
      const to=Math.floor((low+high)/2),candidate=bestColumns(ctx,remaining.slice(from,to),money,pageLimit)
      if(candidate){fit=candidate;end=to;low=to+1}else high=to-1
    }
    if(!fit)throw new Error('Le contenu ne peut pas être composé à cette taille de caractères. Réduis la longueur d’un libellé.')
    pages.push({kind:pages.length?'details':'primary',...fit});from=end
  }
  return {a,p,money,title,details,header,sections,pages:[...pages,...contextPages],single:false,fit}
}
function draw(ctx,value,x,y,size=SOCIAL_BODY_SIZE,color=C.ink,weight=600,align='left') {
  type(ctx,size,weight);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(value,x,y)
}
function box(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.fill()}
function paintColumns(ctx,page,plan) {
  let x=M
  page.columns.forEach((column,index)=>{
    let y=plan.header
    for(const card of column.cards) {
      box(ctx,x,y,card.width,card.height,card.section.color);let top=y+18
      for(const line of card.heading){draw(ctx,line,x+18,top,30,C.ink,800);top+=36}
      if(card.total!==undefined){draw(ctx,plan.money(card.total),card.inline?x+card.width-18:x+18,card.inline?y+15:top,44,C.ink,800,card.inline?'right':'left');top+=54}
      top=y+card.header
      for(const row of card.rows){for(const [i,line]of row.lines.entries())draw(ctx,line,x+18,top+i*STEP);if(row.amountText)draw(ctx,row.amountText,x+card.width-18,top+(row.stacked?row.lines.length*STEP:0),SOCIAL_BODY_SIZE,C.ink,700,'right');top+=row.height}
      y+=card.height+GAP
    }
    x+=page.widths[index]+GAP
  })
}
function paintPrimaryTotals(ctx,plan) {
  const {a,money}=plan
  const stats=[['REVENUS / MOIS',a.income,C.income],['TOTAL DÉPENSES',a.expenses,C.expense],['TOTAL VERSEMENTS',a.savings,C.savings],[a.balance<0?(a.savings?'DÉFICIT APRÈS VERSEMENTS':'DÉFICIT MENSUEL'):(a.savings?'RESTE APRÈS VERSEMENTS':'RESTE DISPONIBLE'),Math.abs(a.balance),a.balance<0?C.deficit:C.balance]]
  for(const [i,[label,value,color]]of stats.entries()){
    const x=M+(i%2)*518,y=1070+Math.floor(i/2)*116
    box(ctx,x,y,498,104,color);draw(ctx,label,x+18,y+12,30,C.ink,800);draw(ctx,money(value),x+18,y+47,44,C.ink,800)
  }
}
export async function renderSocialBudgetImages(profile,mode = 'social') {
  if(document.fonts?.ready)await document.fonts.ready
  const measure=document.createElement('canvas').getContext('2d'),plan=planSocialBudget(measure,profile,mode)
  return plan.pages.map((page,index)=>{
    const canvas=document.createElement('canvas');Object.assign(canvas,SOCIAL_SIZE);const ctx=canvas.getContext('2d')
    ctx.fillStyle=C.background;ctx.fillRect(0,0,1080,1350)
    draw(ctx,'LE BUDGET DE',M,26,30,C.cream,800)
    if(plan.pages.length>1)draw(ctx,`${index+1} / ${plan.pages.length}`,1048,26,30,C.cream,800,'right')
    let y=78;for(const line of plan.title){draw(ctx,line,M,y,62,C.cream,800);y+=74}for(const line of plan.details){draw(ctx,line,M,y,36,C.muted,500);y+=44}
    paintColumns(ctx,page,plan)
    if(page.kind==='primary')paintPrimaryTotals(ctx,plan)
    else {
      const a=plan.a,hasTransfers=a.savings>0
      box(ctx,M,1194,INNER,106,a.balance<0?C.deficit:C.balance)
      if(hasTransfers){draw(ctx,a.available<0?'Manque avant versements':'Avant versements',M+20,1207,30);draw(ctx,plan.money(Math.abs(a.available)),M+20,1245,42,C.ink,800)}
      const x=hasTransfers?548:M+20
      draw(ctx,a.balance<0?(hasTransfers?'Déficit après versements':'Déficit mensuel'):hasTransfers?'Après versements':'Reste disponible',x,1207,30)
      draw(ctx,plan.money(Math.abs(a.balance)),x,1245,42,C.ink,800)
    }
    draw(ctx,index<plan.pages.length-1?'Suite des postes et projets : image '+(index+2)+'/'+plan.pages.length:'Montants mensuels · Épargnant Libre',540,1312,26,C.cream,500,'center')
    canvas.budgetFormat=mode;canvas.budgetPage=index+1;canvas.budgetPageCount=plan.pages.length
    canvas.budgetLayout={kind:page.kind,fontSize:SOCIAL_BODY_SIZE,sourceRows:page.columns?.flatMap(c=>c.cards.flatMap(card=>card.rows.map(row=>({id:row.id,label:row.label,amount:row.amount}))))||[]}
    return canvas
  })
}
export async function renderSocialBudgetImage(profile){const pages=await renderSocialBudgetImages(profile);pages[0].budgetPages=pages;return pages[0]}
