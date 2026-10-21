// Shared deterministic accounting used by browser preview and durable automation.
import { EXECUTION_RULE, METHOD } from './data.js'
export const day = value => value.slice(0,10)
export function assert(ok,message) { if(!ok) throw Error(message) }
export const clone = value => structuredClone(value)
export const addDays = (date,n) => new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10)
const finite = n => typeof n==='number'&&Number.isFinite(n)
export function validateConfig(c,market) {
  assert(c&&typeof c.name==='string'&&c.name.trim().length>0&&c.name.length<=80,'Nom requis (80 caractères maximum).')
  assert(finite(c.initialCapital)&&c.initialCapital>0&&c.initialCapital<=1e9,'Capital invalide.')
  assert(['EUR','USD','GBP','CHF'].includes(c.currency),'Devise commune non prise en charge.')
  assert(/^\d{4}-\d{2}-\d{2}$/.test(c.launchDate)&&!isNaN(Date.parse(c.launchDate)),'Date de lancement invalide.')
  assert(Number.isInteger(c.minLines)&&c.minLines>=1&&Number.isInteger(c.maxLines)&&c.maxLines>=c.minLines&&c.maxLines<=20,'Nombre de lignes invalide.')
  assert(finite(c.maxWeight)&&c.maxWeight>0&&c.maxWeight<=100,'Poids maximum invalide.')
  assert(['monthly','unlimited'].includes(c.frequency),'Fréquence invalide.')
  assert(finite(c.feeBps)&&c.feeBps>=0&&c.feeBps<=100,'Frais invalides (0 à 100 points de base).')
  assert(c.cash==='unremunerated'&&c.income==='synthetic-total-return','Méthode non prise en charge.')
  assert(Array.isArray(c.participants)&&c.participants.length>=1&&c.participants.length<=8,'Prévoir 1 à 8 participants.')
  assert(new Set(c.participants.map(p=>p.id)).size===c.participants.length,'Identifiants participants dupliqués.')
  for(const p of c.participants) assert(/^[a-z0-9-]{1,40}$/.test(p.id)&&p.id!=='world'&&typeof p.name==='string'&&p.name.trim()&&p.name.length<=60&&typeof p.model==='string'&&p.model.trim()&&p.model.length<=100&&/^#[a-f0-9]{6}$/i.test(p.color),'Participant, modèle ou couleur invalide.')
  assert(Array.isArray(c.universe)&&c.universe.length>=1&&new Set(c.universe).size===c.universe.length&&c.universe.every(id=>market.universe.some(a=>a.id===id)), 'Univers invalide.')
  assert(c.universe.includes(c.benchmark),'Référence exacte absente de l’univers.')
}
export function nextExecution(registeredAt,launchDate,market,universe=market.universe.map(a=>a.id)) {
  const earliest = [addDays(day(registeredAt),1),launchDate].sort().at(-1)
  const calendars = market.universe.filter(a=>universe.includes(a.id)).map(a=>market.calendars[a.calendar])
  assert(calendars.length&&calendars.every(Boolean),'Calendriers indisponibles.')
  const next = Object.keys(calendars[0]).sort().find(d=>d>=earliest&&calendars.every(c=>c[d]))
  assert(next,'Calendriers à prolonger avant enregistrement.')
  return next
}
function latestKey(rows,date) { return Object.keys(rows??{}).filter(d=>d<=date).sort().at(-1) }
export function fxAt(currency,date,market) {
  if(currency==='EUR') return {rate:1,date}
  const fxDate = market.fx?.expectedDates?.filter(d=>d<=date).at(-1)??latestKey(market.fx?.rates,date)
  assert(fxDate&&date<=market.fx.validThrough,'Change quotidien non validé pour cet arrêté.')
  const rate=market.fx.rates[fxDate]?.[currency]
  assert(finite(rate)&&rate>0,`Change ${currency} manquant au ${date}.`)
  return {rate,date:fxDate}
}
export function quoteAt(id,date,common,market,exact=false) {
  const asset=market.universe.find(a=>a.id===id),series=market.series[id]
  assert(asset&&series?.anchorDate,`Source non validée : ${id}.`)
  const calendar=market.calendars[asset.calendar]
  assert(calendar&&date>=market.calendarFrom&&date<=market.calendarThrough,'Calendrier hors couverture.')
  const expected=latestKey(calendar,date)
  assert(expected,`Calendrier manquant : ${asset.calendar}.`)
  const priceDate=exact?date:expected,point=series.points[priceDate]
  assert(calendar[priceDate]&&point,`Clôture attendue manquante : ${asset.ticker} ${priceDate}.`)
  const base=fxAt(asset.currency,date,market),target=fxAt(common,date,market)
  return {price:point.synthetic/base.rate*target.rate,synthetic:point.synthetic,rawClose:point.close,
    currency:asset.currency,priceDate,fxDate:base.date,commonFxDate:target.date}
}
export function coverage(id,market,asOf) {
  try {
    const asset=market.universe.find(a=>a.id===id),s=market.series[id]
    assert(s?.qualified,'Couverture quotidienne non validée.')
    assert(market.status?.[id]?.ok,'Dernière collecte en échec : '+(market.status?.[id]?.error??'source indisponible'))
    quoteAt(id,asOf,'EUR',market)
    assert(Object.keys(s.points).length>=20,'Moins de 20 clôtures qualifiées.')
    return {ok:true,reason:`${Object.keys(s.points).length} clôtures · ${asset.ticker} · dernière ${Object.keys(s.points).sort().at(-1)}`}
  } catch(e) {return {ok:false,reason:e.message}}
}
export function emptyPortfolio(config) { return {cash:config.initialCapital,positions:{},flows:{},fees:0} }
export function mark(portfolio,date,config,market) {
  const positions=Object.entries(portfolio.positions).filter(([,units])=>units>1e-10).map(([id,units])=>{
    const quote=quoteAt(id,date,config.currency,market),value=units*quote.price
    const flow=portfolio.flows[id]??0
    return {id,units,...quote,value,netInvested:flow,pnl:value-flow,contribution:(value-flow)/config.initialCapital*100}
  })
  const value=portfolio.cash+positions.reduce((sum,p)=>sum+p.value,0)
  return {date,value,cash:portfolio.cash,fees:portfolio.fees,pnl:value-config.initialCapital,
    performance:(value/config.initialCapital-1)*100,closedResults:Object.entries(portfolio.flows).filter(([id])=>!(portfolio.positions[id]>1e-10)).map(([id,flow])=>({id,pnl:-flow,contribution:-flow/config.initialCapital*100})),positions:positions.map(p=>({...p,weight:p.value/value*100}))}
}
export function validateDecision(d,competition,market,asOf) {
  const c=competition.config
  assert(c.participants.some(p=>p.id===d.participant),'Participant inconnu.')
  assert(['hold','target','trades'].includes(d.kind),'Type de décision invalide.')
  assert(typeof d.model==='string'&&d.model.trim()&&d.model.length<=100,'Modèle utilisé requis.')
  assert(typeof d.reason==='string'&&d.reason.trim()&&d.reason.length<=10000,'Justification requise (10 000 caractères maximum).')
  assert(!d.original||typeof d.original==='string'&&d.original.length<=50000,'Réponse originale trop longue.')
  assert(/^\d{4}-\d{2}-\d{2}$/.test(d.decisionDate)&&d.decisionDate<=(market.generatedAt?.slice(0,10)??asOf)&&!isNaN(Date.parse(d.decisionDate)),'Date de décision future ou invalide.')
  const others=competition.decisions.filter(x=>x.id!==d.id&&x.participant===d.participant&&x.status!=='cancelled')
  assert(!others.some(x=>['recorded','pending'].includes(x.status)),'Une opération attend déjà son exécution.')
  if(c.frequency==='monthly') assert(!others.some(x=>(x.registeredAt??x.decisionDate).slice(0,7)===(d.registeredAt??market.generatedAt??asOf).slice(0,7)),'Une décision par mois d’enregistrement, conservation comprise.')
  if(d.kind==='hold') return
  const entries=Object.entries(d.kind==='target'?d.weights??{}:d.amounts??{})
  assert(entries.length>0&&entries.length<=c.maxLines*2,'Allocation ou mouvements requis.')
  for(const [id,value] of entries) {
    assert(finite(value),'Montant ou poids invalide.')
    assert(c.universe.includes(id),'Actif hors univers de la compétition.')
    if(d.kind==='target') assert(value>=0&&value<=c.maxWeight,'Poids cible hors limites.')
    assert(coverage(id,market,asOf).ok,coverage(id,market,asOf).reason)
  }
  if(d.kind==='target') {
    assert(entries.reduce((sum,[,w])=>sum+w,0)<=100+1e-8,'Les poids dépassent 100 %.')
    const n=entries.filter(([,w])=>w>0).length
    assert(n===0||n>=c.minLines&&n<=c.maxLines,'Nombre de lignes cible hors limites.')
  }
}
export function planDecision(portfolio,d,date,c,market,{benchmark=false,estimate=false}={}) {
  const before=mark(portfolio,date,c,market)
  const ids=[...new Set([...Object.keys(portfolio.positions),...Object.keys(d.weights??{}),...Object.keys(d.amounts??{})])]
  if(d.kind==='hold') return {before,after:before,trades:[],portfolio:clone(portfolio),fee:0}
  const feeRate=c.feeBps/10000
  const quotes=Object.fromEntries(ids.map(id=>[id,quoteAt(id,date,c.currency,market,!estimate)]))
  // Target weights apply to NAV after fees; solve the monotonic self-financing equation.
  let capital=before.value
  if(d.kind==='target') for(let i=0;i<100;i++) {
    const turnover=ids.reduce((s,id)=>s+Math.abs(capital*(d.weights[id]??0)/100-(portfolio.positions[id]??0)*quotes[id].price),0)
    const next=before.value-turnover*feeRate
    if(Math.abs(next-capital)<1e-9){capital=next;break} capital=next
  }
  const next=clone(portfolio),trades=[]
  for(const id of ids) {
    const oldValue=(portfolio.positions[id]??0)*quotes[id].price
    const amount=d.kind==='target'?capital*(d.weights[id]??0)/100-oldValue:(d.amounts[id]??0)
    if(Math.abs(amount)<1e-7) continue
    const units=amount/quotes[id].price,fee=Math.abs(amount)*feeRate
    assert((next.positions[id]??0)+units>=-1e-8,'Vente supérieure à la position.')
    next.positions[id]=Math.max(0,(next.positions[id]??0)+units)
    next.cash-=amount+fee;next.fees+=fee
    next.flows[id]=(next.flows[id]??0)+amount
    trades.push({id,amount,units,fee,...quotes[id],date})
  }
  assert(next.cash>=-1e-6,'Liquidités insuffisantes, frais compris.')
  next.cash=Math.max(0,next.cash)
  const after=mark(next,date,c,market),n=after.positions.length
  if(!benchmark) {
    assert(n===0||n>=c.minLines&&n<=c.maxLines,'Nombre de lignes après mouvements hors limites.')
    for(const p of after.positions) {
      const bought=trades.some(t=>t.id===p.id&&t.amount>0)
      assert(!bought||p.weight<=c.maxWeight+1e-7,'Achat dépassant le poids maximum : '+p.id)
    }
  }
  return {before,after,trades,portfolio:next,fee:next.fees-portfolio.fees}
}
export function portfolioAt(competition,participant,date) {
  const p=emptyPortfolio(competition.config)
  for(const d of competition.decisions.filter(d=>d.participant===participant&&d.status==='executed'&&d.executionDate<=date).sort((a,b)=>a.executionDate.localeCompare(b.executionDate)||a.registeredAt.localeCompare(b.registeredAt))) {
    for(const t of d.execution.trades) {p.positions[t.id]=(p.positions[t.id]??0)+t.units;p.cash-=t.amount+t.fee;p.fees+=t.fee;p.flows[t.id]=(p.flows[t.id]??0)+t.amount}
  }
  return p
}
export function runCompetition(input,market,asOf) {
  const comp=clone(input)
  if(comp.status!=='launched') return comp
  for(const d of comp.decisions.sort((a,b)=>a.executionDate.localeCompare(b.executionDate)||a.registeredAt.localeCompare(b.registeredAt))) {
    if(!['recorded','pending'].includes(d.status)||d.executionDate>asOf) continue
    let portfolio,plan
    try {
      portfolio=portfolioAt(comp,d.participant,d.executionDate)
      // A missing planned close waits on this exact date; never jump to a cheaper session.
      const ids=[...new Set([...Object.keys(portfolio.positions),...Object.keys(d.weights??{}),...Object.keys(d.amounts??{})])]
      for(const id of ids) quoteAt(id,d.executionDate,comp.config.currency,market,true)
      plan=planDecision(portfolio,d,d.executionDate,d.rules??comp.config,market,{benchmark:d.participant==='world'})
    } catch(e) {
      if(/manquant|indisponible|couverture|non validé/.test(e.message)) {d.status='pending';d.error=e.message}
      else {d.status='failed';d.error=e.message}
      continue
    }
    d.status='executed';d.executedAt=market.generatedAt;d.execution=plan;delete d.error
  }
  return comp
}
export function snapshot(comp,date,market) {
  const rows=[...comp.config.participants,{id:'world',name:(comp.config.benchmark==='IE00B4L5Y983-ETFP'?'World':'Réf.')+' ('+(market.universe.find(a=>a.id===comp.config.benchmark)?.ticker??comp.config.benchmark)+')',color:'#b48b26'}].map(p=>{
    const portfolio=portfolioAt(comp,p.id,date)
    try {return {...p,...mark(portfolio,date,comp.config,market),complete:true}}
    catch(e) {return {...p,date,complete:false,error:e.message}}
  })
  const started=comp.status==='launched'&&date>=comp.startDate
  const ready=rows.every(r=>r.complete)&&comp.decisions.some(d=>d.participant==='world'&&d.status==='executed'&&d.executionDate<=date)
    &&comp.config.participants.every(p=>comp.decisions.some(d=>d.participant===p.id&&d.status==='executed'&&d.executionDate<=date))
    &&!comp.decisions.some(d=>d.executionDate<=date&&['recorded','pending','failed'].includes(d.status))
  const ref=rows.find(r=>r.id==='world')
  return {date,started,complete:!!(started&&ready),rows:rows.map(r=>({...r,vsWorld:r.complete&&ref.complete?r.performance-ref.performance:null}))}
}
export function periodReport(comp,date,market) {
  const current=snapshot(comp,date,market)
  const baseline=offset=>{
    const nominal=offset,partial=nominal<comp.startDate
    return {snapshot:partial?null:snapshot(comp,nominal,market),partial,date:partial?comp.startDate:nominal}
  }
  const week=baseline(addDays(date,-7)),month=baseline(new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7))-1,0)).toISOString().slice(0,10))
  return {...current,weekStart:week.date,partialWeek:week.partial,
    complete:current.complete&&(!week.snapshot||week.snapshot.complete),rows:current.rows.map(r=>{
      const growth=base=>{const prev=base.snapshot?.rows.find(x=>x.id===r.id);return r.complete&&(!prev||prev.complete)?(r.value/(prev?.value??comp.config.initialCapital)-1)*100:null}
      return {...r,weekly:growth(week),monthly:growth(month)}
    })}
}
export function weeklyDates(comp,asOf) {
  if(comp.status!=='launched') return []
  const result=[]
  for(let d=comp.startDate;d<=asOf;d=addDays(d,1)) if(new Date(d+'T12:00:00Z').getUTCDay()===5) result.push(d)
  return result.reverse()
}
export const money=(value,currency='EUR')=>new Intl.NumberFormat('fr-FR',{style:'currency',currency,maximumFractionDigits:0}).format(value)
export const percent=value=>value==null?'—':`${value>=0?'+':''}${value.toFixed(2).replace('.',',')} %`
export function tweet(report,comp,participant=null,market=null) {
  if(!report?.complete) return ''
  const rows=participant?report.rows.filter(p=>p.id===participant):[...report.rows].sort((a,b)=>b.value-a.value)
  const since='depuis le départ'
  if(!participant) return `📊 La course au ${report.date}${report.partialWeek?' · semaine partielle':''}\nSemaine / ${since}\n\n`+rows.map(p=>`${p.name} : ${percent(p.weekly)} / ${percent(p.performance)}`).join('\n')+'\n\nPortefeuilles fictifs.\nPas un conseil financier'
  const r=rows[0]
  const last=comp.decisions.filter(d=>d.participant===participant&&d.status==='executed'&&d.executionDate<=report.date).sort((a,b)=>a.executionDate.localeCompare(b.executionDate)).at(-1)
  return `🔎 ${r.name}, au ${report.date}\n${money(r.value,comp.config.currency)} · semaine ${percent(r.weekly)} · ${since} ${percent(r.performance)}\n\n`+r.positions.map(p=>`${market?.universe.find(a=>a.id===p.id)?.ticker??p.id.split('-')[0]} ${p.weight.toFixed(1)} %`).join(' · ')+`\nLiquidités ${money(r.cash,comp.config.currency)}`+(last?`\nDernière décision (${last.executionDate}) : ${last.kind==='hold'?'conserver':last.execution.trades.length+' mouvements'}.`:'')+'\n\nPortefeuille fictif. Pas un conseil financier'
}
export function prompt(comp,participant,market,date) {
  const c=comp.config,p=c.participants.find(p=>p.id===participant),s=snapshot(comp,date,market).rows.find(r=>r.id===participant)
  return `Tu participes à « ${c.name} ». Participant : ${p.name} ; modèle déclaré : ${p.model}.\nDossier commun arrêté au ${date}. Aucun contenu d’actualité ajouté.\nCapital fictif initial : ${money(c.initialCapital,c.currency)}. Devise : ${c.currency}. Référence exacte : ${c.benchmark} (${market.universe.find(a=>a.id===c.benchmark)?.name??c.benchmark}).\nRègles : ${c.minLines} à ${c.maxLines} lignes, ${c.maxWeight} % maximum par ligne à l’achat, aucune vente à découvert ni levier, ${c.frequency==='monthly'?'une décision mensuelle':'fréquence libre'}. Liquidités non rémunérées autorisées. Frais simulés ${c.feeBps} pb par achat/vente.\n${EXECUTION_RULE}\n${METHOD}\nUnivers admissible (couverture contrôlée) :\n${market.universe.filter(a=>c.universe.includes(a.id)&&coverage(a.id,market,date).ok).map(a=>`${a.id} | ${a.name} | ${a.ticker} | ${a.mic} | ${a.currency}`).join('\n')}\n${s?.complete?`État comptable : valeur ${money(s.value,c.currency)}, résultat ${percent(s.performance)}, liquidités ${money(s.cash,c.currency)}.\n`+s.positions.map(x=>`${x.id} : ${x.weight.toFixed(2)} %, ${money(x.value,c.currency)}`).join('\n'):'Aucun portefeuille valorisé.'}\nHistorique :\n${comp.decisions.filter(d=>d.participant===participant).map(d=>`${d.decisionDate} ${d.kind} ${d.status} : ${d.reason}`).join('\n')||'Aucune décision.'}\nRéponds par CONSERVER ou une allocation cible : identifiant exact, poids en %, liquidités résiduelles et justification. Précise ton modèle et la date de décision. L’utilisateur transmet et saisit ta réponse lui-même. Aucun ordre réel.`
}
