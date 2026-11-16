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
// Deterministic wrapping for the text detail pages; the poster measures its font.
export function labelLines(value, columns = 14, maxChars = Infinity) {
  const chars = [...String(value)]
  const short = chars.length > maxChars ? chars.slice(0, maxChars - 1).join('') + '…' : chars.join('')
  const lines = []; let line = ''
  for (const word of short.split(/\s+/)) {
    for (let part of word.match(new RegExp(`.{1,${columns}}`, 'gu')) ?? []) {
      if (line && [...line + ' ' + part].length > columns) { lines.push(line); line = '' }
      line = line ? line + ' ' + part : part
    }
  }
  if (line) lines.push(line)
  return lines
}
// These colors describe the illustration, never the financial data. A security's
// identity gives it the same color on every page, even when grouped in the main.
const palette = ['#1769cc','#e34c46','#f6ae2d','#803fb0','#00a889','#ef729b','#164455','#ae743b','#68882b','#5567a8','#e27635','#37959f']
const brands = { Amazon:'#f6ae2d', Apple:'#789ab5', Microsoft:'#1769cc', Nvidia:'#83ac32', Meta:'#5865ce', Micron:'#803fb0', TSMC:'#e34c46', Alphabet:'#37959f', 'Coca-Cola':'#e34c46', 'American Express':'#1769cc', 'Bank of America':'#803fb0', Uber:'#164455' }
export function positionColor(row) {
  if(row.other)return '#b8bdc4'
  const name=String(row.displayLabel || row.label || row.issuerName || '').replace(/ \(.*\)$/,'').replace(/ Technologies Inc$/,'')
  let hash=0;for(const char of String(row.cusip || row.securityId || name))hash=(hash*31+char.charCodeAt(0))>>>0
  return brands[name] || palette[hash%palette.length]
}
export function colorPositions(rows) {
  const used=new Set()
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
  let name=String(row.displayLabel || row.issuerName || '').replace(/ \([A-Z0-9*@#]{9}\)$/,'')
    .replace(/\b(?:Technologies|Corporation|International|Limited|Holdings|Hldgs?|Group|Corp|Inc|Ltd|Co)\b\.?/gi,'').replace(/Berkshire Hathaway/i,'Berkshire').replace(/\s+/g,' ').replace(/(?:\s*,\s*)+$/g,'').trim()
  // Preserve an explicit class discriminator; never merge securities to save space.
  if(/ \([A-Z0-9*@#]{9}\)$/.test(row.displayLabel || '')) {
    const cls=row.shareClass?.match(/(?:CL|CLASS)\s+([A-Z])\b/i)?.[1]
    name=`${name.slice(0,cls?16:10)} ${cls || '·'+row.cusip.slice(-4)}`
  }
  if(name.length>23 && row.ticker)name=row.ticker
  return name || row.issuerName
}
export const POSTER = { cx:540, cy:700, outer:332, inner:171, top:295, bottom:1110, gap:18, labelWidth:172 }
function arrange(rows, start = -Math.PI / 2) {
  let angle=start
  const entries=rows.map(row=>{
    const mid=angle+row.weight*Math.PI
    const entry={...row,color:row.color || positionColor(row),start:angle,end:angle+row.weight*Math.PI*2,mid,
      side:Math.cos(mid)<0?'left':'right',desiredY:POSTER.cy+Math.sin(mid)*405,
      // Two name lines, amount and percent badge, at readable fixed sizes.
      height:148,inside:row.weight>=.055}
    angle=entry.end;return entry
  })
  for(const side of ['left','right']) {
    const labels=entries.filter(e=>e.side===side).sort((a,b)=>a.desiredY-b.desiredY)
    if(labels.length*148+Math.max(0,labels.length-1)*POSTER.gap>POSTER.bottom-POSTER.top)return null
    let y=POSTER.top
    for(const e of labels){e.y=Math.max(y,e.desiredY-e.height/2);y=e.y+e.height+POSTER.gap}
    let end=POSTER.bottom
    for(const e of [...labels].reverse()){e.y=Math.min(e.y,end-e.height);end=e.y-POSTER.gap}
    for(const e of labels)e.x=side==='left'?32:876
  }
  return entries
}
export function publicationPlan(portfolio) {
  if (portfolio.problem) throw new Error(portfolio.problem)
  const holdings = portfolio.holdings
  if (!holdings?.length || holdings.some(r => !Number.isFinite(r.value))) throw new Error('Montants vérifiés nécessaires pour ce visuel.')
  const total = holdings.reduce((sum,r) => sum + r.value, 0)
  if (!(total > 0)) throw new Error('Total des positions absent.')
  const sorted = colorPositions([...holdings].sort((a,b) => b.value - a.value))
  let best
  // The physical area at the minimum label height bounds attempts, not the portfolio.
  const capacity = 2 * Math.floor((POSTER.bottom - POSTER.top + POSTER.gap) / (148 + POSTER.gap))
  for (let n = 1; n <= Math.min(sorted.length, capacity); n++) {
    const selected = sorted.slice(0,n).map(r => ({ ...r, label: shortPosition(r), weight: r.value / total }))
    const rest = sorted.slice(n)
    if (rest.length) selected.push({ issuerName: 'Autres positions', label: 'Autres', ticker: '', other: true, currency: portfolio.snapshot.currency, unit: 1, count: rest.length, value: rest.reduce((s,r) => s + r.value, 0), weight: rest.reduce((s,r) => s + r.value, 0) / total })
    // Rotate the real sectors to balance the available label space. Midpoints between
    // all side-transition angles cover every possible split without moving
    // labels across the donut or changing a single sector's proportion.
    let mid=0
    const transitions=[]
    for(const row of selected) {
      const angle=mid+row.weight*Math.PI
      for(const edge of [-Math.PI/2,Math.PI/2])transitions.push(((edge-angle)%(2*Math.PI)+2*Math.PI)%(2*Math.PI))
      mid+=row.weight*2*Math.PI
    }
    transitions.sort((a,b)=>a-b)
    const rotations=[-Math.PI/2,...transitions.map((a,i)=>(a+(transitions[i+1]??transitions[0]+2*Math.PI))/2)]
    let entries=null,cost=Infinity
    for(const rotation of rotations) {
      const candidate=arrange(selected,rotation)
      if(!candidate)continue
      const distance=candidate.reduce((sum,e)=>sum+Math.hypot(POSTER.cx+Math.cos(e.mid)*POSTER.outer-(e.side==='left'?210:870),POSTER.cy+Math.sin(e.mid)*POSTER.outer-e.y-74),0)
      if(distance<cost){entries=candidate;cost=distance}
    }
    if (entries) best = { entries, total, currency: portfolio.snapshot.currency, hiddenCount: rest.length }
  }
  if (!best) throw new Error('La composition ne tient pas dans le visuel. Consulter le détail.')
  if (Math.abs(best.entries.reduce((s,r) => s+r.value,0) - total) > .01 || Math.abs(best.entries.reduce((s,r) => s+r.weight,0)-1) > 1e-10) throw new Error('Regroupement incohérent.')
  return best
}
export const emojiFor = ticker => ({ apple:'🍎', 'american-express':'💳', cocacola:'🥤', 'bank-of-america':'🏦', amazon:'📦', microsoft:'💻', nvidia:'💻', AAPL:'🍎', AXP:'💳', KO:'🥤', BAC:'🏦', MSFT:'💻', AMZN:'📦', NVDA:'💻', META:'💬', V:'💳', CVX:'⛽', TSM:'💻' }[ticker] || '📌')
