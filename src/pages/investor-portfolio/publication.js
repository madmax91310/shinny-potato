import shortNames from './short-names.json' with {type:'json'}
import { arrangeOrbit, POSTER, measure } from './orbit-layout.js'
export { POSTER } from './orbit-layout.js'
// Shared by the image, copy and exports. No monetary value is inferred from a weight.
export const MAIN_IMAGE = { width: 1080, height: 1350 }
export const entityPortfolio = slug => ['berkshire','gates-trust','renaissance','baker-bros'].includes(slug)
export function portfolioOwner({identity,snapshot,kind}) {
  if(kind === 'model' || entityPortfolio(identity.slug)) return identity.displayName
  return identity.personVerified === true && identity.personPeriod === snapshot.periodEnd && identity.personSource
    ? identity.displayName : identity.entityName || 'l’entité déclarante'
}
export const cash = (value, currency) => !currency ? `${value.toLocaleString('fr-FR')} (devise inconnue)` : new Intl.NumberFormat('fr-FR', { style: 'currency', currency, notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
export const reportedAmount = row => !Number.isFinite(row.value) ? 'Montant indisponible' : row.unit === 1 && row.currency === 'USD' ? cash(row.value,row.currency) : `${row.value.toLocaleString('fr-FR')} (unité ${row.unit ?? '?'}, ${row.currency || 'devise inconnue'})`
export const weightLabel = weight => weight > 0 && weight < .001 ? '< 0,1 %' : `${(weight * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
export function monetaryStatus(snapshot) {
  const rows = snapshot.holdings
  if (snapshot.primaryVerified !== true) return 'Déclaration SEC originale non vérifiée pour ce relevé. Actualisation nécessaire.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.filedAt || '') || snapshot.filedAt < snapshot.periodEnd || snapshot.filedAt > new Date().toISOString().slice(0,10) || !Array.isArray(snapshot.sourceDocuments) || snapshot.sourceDocuments.length < 2 || snapshot.sourceDocuments.some(url => !String(url).startsWith('https://www.sec.gov/Archives/edgar/'))) return 'Date de publication ou documents SEC incomplets.'
  if (rows?.some(row => !/^[A-Z0-9*@#]{9}$/.test(row.cusip || '') || !row.shareClass)) return 'Identifiants ou classes de titres incomplets.'
  if (!Number.isSafeInteger(snapshot.declaredTotal) || snapshot.declaredTotal <= 0 || !snapshot.valueUnitSource || snapshot.valueUnit !== 1 || snapshot.currency !== 'USD' || !rows?.length) return 'Montants et unités non documentés dans ce relevé. Actualisation nécessaire.'
  if (rows.some(r => !Number.isSafeInteger(r.value) || r.value <= 0 || r.currency !== snapshot.currency || r.unit !== 1 || Math.abs(r.weight - r.value / snapshot.declaredTotal) > 1e-9)) return 'Montants, devises ou poids incohérents.'
  if (Math.abs(rows.reduce((sum, r) => sum + r.value, 0) - snapshot.declaredTotal) > rows.length * .5) return 'La somme des positions ne correspond pas au total déclaré.'
  return null
}
// These colors describe the illustration, never the financial data. A security's
// identity gives it the same color on every page, even when grouped in the main.
const palette = ['#1769cc','#e34c46','#f6ae2d','#803fb0','#00a889','#ef729b','#164455','#ae743b','#68882b','#5567a8','#e27635','#37959f']
const brands = { Amazon:'#26364c', Apple:'#b0b0b0', Microsoft:'#1769cc', Nvidia:'#83ac32', Meta:'#5865ce', Micron:'#803fb0', TSMC:'#e6e8ea', Alphabet:'#00d660', 'Coca-Cola':'#e60023', 'American Express':'#006fcf', 'Bank of America':'#58d3e5', Uber:'#164455' }
export function positionColor(row) {
  if(row.other)return '#f4d539'
  const name=String(row.displayLabel || row.label || row.issuerName || '').replace(/ \(.*\)$/,'').replace(/ Technologies Inc$/,'')
  let hash=0;for(const char of String(row.cusip || row.securityId || name))hash=(hash*31+char.charCodeAt(0))>>>0
  return brands[name] || palette[hash%palette.length]
}
export function colorPositions(rows) {
  const used=new Set(['#f4d539'])
  const rgb=color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16))
  const separation=color=>Math.min(...[...used].map(other=>Math.hypot(...rgb(color).map((v,i)=>v-rgb(other)[i]))))
  return rows.map(row=>{
    let color=positionColor(row)
    // Avoid near twins as well as identical colors (e.g. Nvidia / Cerebras).
    if(separation(color)<95)color=palette.filter(c=>!used.has(c)).sort((a,b)=>separation(b)-separation(a))[0] || color
    used.add(color)
    return {...row,color}
  })
}
export const posterCash=(value,currency)=>cash(value,currency).replace(/\s*\$US/,' $')
export function shortPosition(row) {
  const issuerNames={'SPACE EXPLORATION TECHN CORP':'SpaceX'}
  const distinct=/ \([A-Z0-9*@#]{9}\)$/.test(row.displayLabel || '')
  let base=String(shortNames[row.cusip] || issuerNames[row.issuerName] || (distinct?row.issuerName:null) || row.displayLabel || row.issuerName || '')
  if(distinct && !shortNames[row.cusip] && !issuerNames[row.issuerName] && base===base.toUpperCase())base=base.toLocaleLowerCase('fr-FR').replace(/\b\p{L}/gu,c=>c.toLocaleUpperCase('fr-FR'))
  let name=base.replace(/ \([A-Z0-9*@#]{9}\)$/,'')
    .replace(/\b(?:Technologies|Corporation|International|Limited|Holdings|Hldgs?|Group|Corp|Inc|Ltd|Co|Del|New|Plc)\b\.?/gi,'').replace(/Occidental Pete/i,'Occidental').replace(/Moodys/i,'Moody’s').replace(/Berkshire Hathaway/i,'Berkshire').replace(/^[,\s]+|[,\s]+$/g,'').replace(/\s+/g,' ').trim()
  // Preserve an explicit class discriminator; never merge securities to save space.
  if(distinct) {
    const cls=row.shareClass?.match(/(?:CL|CLASS|SER|SERIES)\s+([A-Z])\b/i)?.[1]
    name=`${name} ${cls || '·'+row.cusip.slice(-4)}`
  }
  if(row.cusip==='464286772' && row.shareClass==='MSCI STH KOR ETF')name='iShares Corée'
  if(name.length>23 && row.ticker)name=row.ticker
  return name || row.issuerName
}
const planCache=new WeakMap()
export function publicationPlan(portfolio) {
  if (portfolio.problem) throw new Error(portfolio.problem)
  const holdings = portfolio.holdings
  if (!holdings?.length || holdings.some(r => !Number.isFinite(r.value))) throw new Error('Montants vérifiés nécessaires pour ce visuel.')
  const signature=JSON.stringify([portfolioOwner(portfolio),portfolio.snapshot.currency,holdings.map(r=>[r.value,r.unit,r.currency,r.cusip,r.shareClass,r.displayLabel,r.issuerName,r.ticker])])
  const cached=planCache.get(holdings)
  if(cached?.signature===signature)return cached.plan
  const total = holdings.reduce((sum,r) => sum + r.value, 0)
  if (!(total > 0)) throw new Error('Total des positions absent.')
  const sorted = colorPositions([...holdings].sort((a,b) => b.value - a.value))
  let best
  const capacity=Math.floor(2*Math.PI*POSTER.badgeOrbit/(POSTER.badgeRadius*2+7))
  // Capacity comes from the uniform circle badges and the available perimeter.
  // Every admissible position remains in the data and the detailed exports.
  for(let n=Math.min(sorted.length,capacity);n>=1&&!best;n--) {
    const selected=sorted.slice(0,n).map(r=>({...r,label:shortPosition(r),weight:r.value/total}))
    const rest=sorted.slice(n)
    if(rest.length){const value=rest.reduce((s,r)=>s+r.value,0);selected.push({issuerName:'Autres positions',label:`Autres · ${rest.length} positions`,other:true,ticker:'',currency:portfolio.snapshot.currency,unit:1,count:rest.length,value,weight:value/total,color:'#f4d539'})}
    if(new Set(selected.map(r=>r.color)).size!==selected.length)continue
    let layout=null
    const other=selected.find(r=>r.other)
    const base=other?-Math.PI/2-Math.PI*2*(1-other.weight)-Math.PI*other.weight:-80*Math.PI/180
    const rotations=[base,...Array.from({length:16},(_,i)=>base+(i%2?1:-1)*Math.ceil((i+1)/2)*Math.PI/36),...Array.from({length:36},(_,i)=>(-80+i*10)*Math.PI/180)]
    for(const rotation of rotations) {
      const candidate=arrangeOrbit(selected,rotation,portfolio.snapshot.currency,measure(portfolioOwner(portfolio),60)>980?260:202)
      if(candidate){layout=candidate;break}
    }
    if(layout)best={entries:layout.entries,total,currency:portfolio.snapshot.currency,hiddenCount:rest.length}
  }
  if (!best) throw new Error('La composition ne tient pas dans le visuel. Consulter le détail.')
  if (Math.abs(best.entries.reduce((s,r) => s+r.value,0) - total) > .01 || Math.abs(best.entries.reduce((s,r) => s+r.weight,0)-1) > 1e-10) throw new Error('Regroupement incohérent.')
  planCache.set(holdings,{signature,plan:best})
  return best
}
export const emojiFor = ticker => ({ apple:'🍎', 'american-express':'💳', cocacola:'🥤', 'bank-of-america':'🏦', amazon:'📦', microsoft:'💻', nvidia:'💻', AAPL:'🍎', AXP:'💳', KO:'🥤', BAC:'🏦', MSFT:'💻', AMZN:'📦', NVDA:'💻', META:'💬', V:'💳', CVX:'⛽', TSM:'💻' }[ticker] || '📌')

// A publication is a short editorial series; the complete archive stays separate.
export function editorialSeries(portfolio) {
  const main=publicationPlan(portfolio), named=main.entries.filter(r=>!r.other).length
  const rows=colorPositions([...portfolio.holdings].sort((a,b)=>b.value-a.value))
  const top=rows.slice(0,Math.min(12,rows.length))
  const coverage=top.reduce((s,r)=>s+r.value,0)/main.total
  const remaining=rows.slice(named)
  // Keep a short four-image editorial series, separate from the full archive.
  const complements=Math.min(coverage<.5?3:2,Math.ceil(remaining.length/12))
  return {main,coverage,topCount:top.length,pages:[{kind:'summary'},...Array.from({length:complements},(_,i)=>({kind:'continuation',start:named+i*12,rows:remaining.slice(i*12,(i+1)*12)}))],coveredCount:named+Math.min(remaining.length,complements*12)}
}
