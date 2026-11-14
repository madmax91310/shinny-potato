import { analyzeBudget, budgetPublicPresentation, budgetPublicIncomeRows, budgetPublicSavingsRows, budgetImageExpenses, euro, hasSeparateBudgetCapacity } from './lib.js'
import { budgetQualification } from './presentation.js'

export const SOCIAL_SIZE = { width: 1080, height: 1350 }
// Only presentation changes: source labels, amounts and the text export stay intact.
export function socialBudgetLabel(label) {
  return label.replace(/^(?:Sa )?part (?:du |de la |de l’|de l'|des |d’|d')/i, '')
    .replace(/^Provision personnelle pour /i, 'Provision : ')
    .replace(/\bpersonnels?\b/gi, '').replace(/\bpersonnelles?\b/gi, '')
    .replace(/\s+à sa charge$/i, '').replace(/\s+/g, ' ').trim()
    .replace(/^./u, c => c.toLocaleUpperCase('fr'))
    .replace(/^Loyer et des charges hors énergie et eau$/i, 'Loyer, charges hors eau/énergie')
    .replace(/^Internet et forfait mobile$/i, 'Internet et mobile')
    .replace(/^Entretien et des petits équipements$/i, 'Entretien et équipement')
    .replace(/^Soins et frais de santé$/i, 'Soins et santé')
    .replace(/^Épargne pour apport immobilier$/i, 'Apport immobilier')
    .replace(/^Énergie et de l’eau$/i, 'Énergie et eau')
}
const palette = { ink: '#10182f', background: '#1c2127', cream: '#fff8e5', muted: '#c8ced9', income: '#dbd1ff', expense: '#ffc4ae', savings: '#c5f4cb', balance: '#f6e9c4' }
function type(ctx, size, weight = 600) { ctx.font = `${weight} ${size}px Arial, sans-serif` }
function wrap(ctx, text, width, size, weight = 600) {
  type(ctx, size, weight)
  const result = []; let line = ''
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > width) { result.push(line); line = '' }
    for (const char of word) {
      if (ctx.measureText(line + char).width > width) { result.push(line); line = '' }
      line += char
    }
    line += ' '
  }
  if (line.trim()) result.push(line.trim())
  return result.map(s => s.trim())
}
function text(ctx, value, x, y, size, color = palette.ink, weight = 600, align = 'left') {
  type(ctx, size, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.fillText(value, x, y)
}
function box(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.fill() }
function rowPlan(ctx, row, width, money) {
  const amount = money(row.amount); type(ctx, 32, 700)
  const label = wrap(ctx, socialBudgetLabel(row.label), width - ctx.measureText(amount).width - 22, 32)
  return { label, amount, height: Math.max(47, label.length * 39 + 12) }
}
function paintRows(ctx, rows, x, y, width) {
  for (const row of rows) {
    row.label.forEach((line, i) => text(ctx, line, x, y + i * 39, 32))
    text(ctx, row.amount, x + width, y, 32, palette.ink, 700, 'right')
    y += row.height
  }
}
export function planSocialBudget(ctx, profile) {
  const a = analyzeBudget(profile)
  if (a.errors.length) throw new Error(a.errors.join(' '))
  const p = budgetPublicPresentation(profile), money = n => euro(n, profile.currency)
  const name = p.name + (profile.age && !p.name.includes(' et ') && !p.name.includes(String(profile.age)) ? `, ${profile.age} ans` : '')
  const title = wrap(ctx, name, 984, 62, 800)
  const details = wrap(ctx, [p.job, p.household.replace(/ · sa part du budget du couple/gi, ''), p.location, budgetQualification(profile)].filter(Boolean).join(' · '), 984, 30, 500)
  const notes = wrap(ctx, [p.basis && !/^Montants mensuels$/i.test(p.basis) ? p.basis : '', p.incomeNote].filter(Boolean).join(' · '), 984, 28, 500)
  const header = 90 + title.length * 74 + details.length * 37 + notes.length * 34 + 12
  const finance = profile.editorialCreation?.finance || []
  const highlights = finance.map(item => item.type === 'financial-stock' ? `${item.label} : ${money(item.amount)}` : item.type === 'project' ? `${item.label}${item.targetAmount === undefined ? '' : ' : '}${item.initialFunding === undefined ? '' : money(item.initialFunding) + ' → '}${item.targetAmount === undefined ? '' : money(item.targetAmount)}${item.horizonMonths ? ' en ' + item.horizonMonths + ' mois' : ''}` : '').filter(Boolean)
  // A combined project includes both the deposit and the emergency reserve.
  if (profile.id === 'prepared-lot2-08-2026-10-30' && finance.some(f => f.type === 'project' && f.targetAmount === 25000 && f.initialFunding === 7000 && f.horizonMonths === 36)) {
    highlights.splice(0, highlights.length, 'Apport : 2 000 € → 20 000 € dans 3 ans', 'Réserve de sécurité : 5 000 €')
  }
  const sections = [
    {title:'REVENUS / MOIS',total:a.income,color:palette.income,rows:budgetPublicIncomeRows(profile)},
    {title:'DÉPENSES / MOIS',total:a.expenses,color:palette.expense,rows:budgetImageExpenses(profile),note:/part (?:du|de|des|d’)/i.test(budgetImageExpenses(profile).map(r=>r.label).join(' ')) ? 'Sa part personnelle' : ''},
  ]
  if (profile.savings.length) sections.push({title:'ÉPARGNE / MOIS',total:a.savings,color:palette.savings,rows:budgetPublicSavingsRows(profile)})
  if (hasSeparateBudgetCapacity(profile,a)) highlights.push(`Capacité ${profile.kind === 'planned' ? 'envisagée' : 'annoncée'} : ${money(profile.capacity)}`)
  if (highlights.length) sections.push({title:'ÉPARGNE ET PROJETS',color:palette.cream,rows:highlights.map(label=>({label,highlight:true}))})
  const entries=sections.flatMap((section,index)=>section.rows.map((row,rowIndex)=>({section:index,first:rowIndex===0,...(row.highlight ? {label:wrap(ctx,row.label,440,30),height:wrap(ctx,row.label,440,30).length*37+16,highlight:true} : rowPlan(ctx,row,440,money))})))
  const partition=entries=>{
    const cards=[]
    for(const entry of entries){let c=cards.at(-1);if(!c||c.section!==entry.section){const source=sections[entry.section],section=entry.first?source:{...source,title:source.title.replace(' / MOIS','')+' · SUITE',total:undefined,note:''};const heading=wrap(ctx,section.title,440,28,800);c={...section,section:entry.section,heading,rows:[],height:40+heading.length*34+(section.total===undefined?0:54)+(section.note?38:0)};cards.push(c)}c.rows.push(entry);c.height+=entry.height}
    return {cards,height:cards.reduce((sum,c)=>sum+c.height+14,0)}
  }
  let columns,best=Infinity
  for(let i=1;i<=entries.length;i++){const candidate=[partition(entries.slice(0,i)),partition(entries.slice(i))],height=Math.max(...candidate.map(c=>c.height));if(height<best){best=height;columns=candidate}}
  // Never silently truncate or squeeze an exceptional user-created 72-row budget.
  if(header+best>1166) throw Object.assign(new Error('Ce budget contient trop de détails pour le format 4:5. Choisis la version détaillée pour conserver tous les postes.'), { code: 'BUDGET_SOCIAL_OVERFLOW' })
  return {a,p,money,title,details,notes,header,columns,used:header+best}
}
export async function renderSocialBudgetImage(profile) {
  const canvas=document.createElement('canvas');Object.assign(canvas,SOCIAL_SIZE)
  const ctx=canvas.getContext('2d'),plan=planSocialBudget(ctx,profile),{a,p,money}=plan
  ctx.fillStyle=palette.background;ctx.fillRect(0,0,1080,1350)
  text(ctx,'LE BUDGET DE',48,32,30,palette.cream,800)
  let y=80
  plan.title.forEach(line=>{text(ctx,line,48,y,62,palette.cream,800);y+=74})
  plan.details.forEach(line=>{text(ctx,line,48,y,30,palette.muted,500);y+=37})
  plan.notes.forEach(line=>{text(ctx,line,48,y,28,palette.muted,500);y+=34})
  plan.columns.forEach((column,index)=>{
    const x=48+index*504;let top=plan.header
    for(const card of column.cards){
      box(ctx,x,top,480,card.height,card.color);let rowY=top+20
      card.heading.forEach(line=>{text(ctx,line,x+20,rowY,28,palette.ink,800);rowY+=34})
      if(card.total!==undefined){text(ctx,money(card.total),x+20,rowY,40,palette.ink,800);rowY+=54}
      if(card.note){text(ctx,card.note,x+20,rowY,28);rowY+=38}
      for(const row of card.rows){if(row.highlight){row.label.forEach((line,i)=>text(ctx,line,x+20,rowY+i*37,30))}else paintRows(ctx,[row],x+20,rowY,440);rowY+=row.height}
      top+=card.height+14
    }
  })
  box(ctx,48,1178,984,112,a.balance<0?'#ffaaa8':palette.balance)
  text(ctx,'Avant versements',72,1195,28);text(ctx,money(a.available),72,1232,40,palette.ink,800)
  const balance=a.balance<0?'Manque après versements':p.balanceLabel==='Reste disponible après versements'?'Reste après versements':p.balanceLabel
  const balanceLines=wrap(ctx,balance,450,28)
  if(balanceLines.length>1){text(ctx,a.balance<0?'Manque':'Reste disponible',538,1195,28)}else text(ctx,balance,538,1195,28)
  text(ctx,money(Math.abs(a.balance)),538,1232,40,palette.ink,800)
  text(ctx,'Épargnant Libre',540,1306,26,palette.cream,500,'center')
  return canvas
}
