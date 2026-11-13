import {signedFlow, periodLabel} from './lib.js'
export const MANUAL_KEY = 'el-etf-flows-manual-v1'
export const emptyLine = () => ({label:'',amount:'',unit:'M'})
export const emptyDraft = () => ({version:1,start:'',end:'',url:'',scope:'',currency:'EUR',rows:[emptyLine()]})
export function validDraft(d) {
  return d?.version===1 && ['start','end','url','scope'].every(k=>typeof d[k]==='string' && d[k].length<=2000)
    && ['EUR','USD'].includes(d.currency) && Array.isArray(d.rows) && d.rows.length>=1 && d.rows.length<=10
    && d.rows.every(r=>r && typeof r.label==='string' && r.label.length<=60 && typeof r.amount==='string' && r.amount.length<=30 && ['M','Md'].includes(r.unit))
}
const day = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s
export function prepareManual(d, now = new Date()) {
  if (!validDraft(d)) return {errors:['Saisie illisible.'],rows:[]}
  const errors=[]
  if (!day(d.start)||!day(d.end)||d.start>d.end||(Date.parse(d.end)-Date.parse(d.start))/86400000>7) errors.push('Choisis les dates exactes d’une période de 7 jours maximum.')
  if (d.end>=now.toISOString().slice(0,10)) errors.push('Choisis une période terminée, antérieure à aujourd’hui.')
  try {if(new URL(d.url).protocol!=='https:') throw Error()} catch {errors.push('Ajoute le lien HTTPS de la page où tu as relevé les chiffres.')}
  if (!d.scope.trim()||d.scope.length>80) errors.push('Indique le périmètre décrit par la source (80 caractères maximum).')
  const rows=[], labels=new Set()
  d.rows.forEach((r,i)=>{
    if(!r.label.trim()&&!r.amount.trim())return
    const label=r.label.trim(), number=r.amount.trim().replace('−','-').replace(',','.')
    if(!label||!/^[+-]?\d+(?:\.\d+)?$/.test(number)) {errors.push(`Ligne ${i+1} : renseigne un nom et un montant, par exemple −164,9.`);return}
    const amount=Number(number)*(r.unit==='Md'?1e9:1e6)
    if(!Number.isFinite(amount)||Math.abs(amount)>1e15){errors.push(`Ligne ${i+1} : montant trop élevé.`);return}
    if(labels.has(label.toLocaleLowerCase('fr'))){errors.push(`« ${label} » est présent deux fois.`);return}
    labels.add(label.toLocaleLowerCase('fr'));rows.push({id:`manual-${i}`,label,amount})
  })
  if(!rows.length)errors.push('Ajoute au moins un flux.')
  return {errors,rows}
}
export function manualTweet(d, rows) {
  return `💸 Où va l’argent des ETF ?\n\n${periodLabel(d).replace(/^du /,'Du ')}\n${d.scope.trim()} · Sélection de flux nets\n\n${rows.map(r=>`${r.label} : ${signedFlow(r.amount,d.currency)}`).join('\n')}\n\nSource : ${d.url}\nChiffres relevés manuellement.`
}
