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
// Fixed readable monospace type makes wrapping deterministic in Node and Canvas.
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
const palette = ['#186447', '#298565', '#54a17b', '#92bd9c', '#b4d7b4', '#538d8a', '#79a8a1', '#a3c5be', '#d5e4d0', '#628264', '#8ab28b', '#c0d6c5']
function arrange(rows, start = -Math.PI / 2) {
  let angle = start
  const entries = rows.map((row, i) => {
    const mid = angle + row.weight * Math.PI
    const entry = { ...row, color: palette[i % palette.length], start: angle, end: angle + row.weight * Math.PI * 2, mid,
      side: Math.cos(mid) < 0 ? 'left' : 'right', desiredY: 638 + Math.sin(mid) * 235,
      lines: labelLines(row.label, 14, 40), inside: row.weight >= .14 }
    entry.height = 148 + entry.lines.length * 29
    angle = entry.end
    return entry
  })
  for (const side of ['left', 'right']) {
    const cards = entries.filter(e => e.side === side).sort((a,b) => a.desiredY - b.desiredY)
    const top = 310, bottom = 1020, gap = 12
    if (cards.reduce((s,e) => s + e.height + gap, -gap) > bottom - top) return null
    let y = top
    for (const card of cards) { card.y = Math.max(y, card.desiredY - card.height / 2); y = card.y + card.height + gap }
    let end = bottom
    for (const card of [...cards].reverse()) { card.y = Math.min(card.y, end - card.height); end = card.y - gap }
    for (const card of cards) card.x = side === 'left' ? 28 : 784
  }
  return entries
}
export function publicationPlan(portfolio) {
  if (portfolio.problem) throw new Error(portfolio.problem)
  const holdings = portfolio.holdings
  if (!holdings?.length || holdings.some(r => !Number.isFinite(r.value))) throw new Error('Montants vérifiés nécessaires pour ce visuel.')
  const total = holdings.reduce((sum,r) => sum + r.value, 0)
  if (!(total > 0)) throw new Error('Total des positions absent.')
  const sorted = [...holdings].sort((a,b) => b.value - a.value)
  let best
  // The physical area at the minimum card height bounds attempts, not the portfolio.
  const capacity = Math.floor(2 * (1020 - 310 + 12) / (177 + 12))
  for (let n = 1; n <= Math.min(sorted.length, capacity); n++) {
    const selected = sorted.slice(0,n).map(r => ({ ...r, label: r.displayLabel || r.issuerName, weight: r.value / total }))
    const rest = sorted.slice(n)
    if (rest.length) selected.push({ issuerName: 'Autres positions', label: 'Autres positions', ticker: '', other: true, count: rest.length, value: rest.reduce((s,r) => s + r.value, 0), weight: rest.reduce((s,r) => s + r.value, 0) / total })
    // Rotate the real sectors to balance both card columns. Midpoints between
    // all side-transition angles cover every possible split without moving
    // leaders across the donut or changing a single sector's proportion.
    let mid=0
    const transitions=[]
    for(const row of selected) {
      const angle=mid+row.weight*Math.PI
      for(const edge of [-Math.PI/2,Math.PI/2])transitions.push(((edge-angle)%(2*Math.PI)+2*Math.PI)%(2*Math.PI))
      mid+=row.weight*2*Math.PI
    }
    transitions.sort((a,b)=>a-b)
    const rotations=[-Math.PI/2,...transitions.map((a,i)=>(a+(transitions[i+1]??transitions[0]+2*Math.PI))/2)]
    let entries=null
    for(const rotation of rotations) { entries=arrange(selected,rotation);if(entries)break }
    if (entries) best = { entries, total, currency: portfolio.snapshot.currency, hiddenCount: rest.length }
  }
  if (!best) throw new Error('La composition ne tient pas dans le visuel. Consulter le détail.')
  if (Math.abs(best.entries.reduce((s,r) => s+r.value,0) - total) > .01 || Math.abs(best.entries.reduce((s,r) => s+r.weight,0)-1) > 1e-10) throw new Error('Regroupement incohérent.')
  return best
}
export const emojiFor = ticker => ({ apple:'🍎', 'american-express':'💳', cocacola:'🥤', 'bank-of-america':'🏦', amazon:'📦', microsoft:'💻', nvidia:'💻', AAPL:'🍎', AXP:'💳', KO:'🥤', BAC:'🏦', MSFT:'💻', AMZN:'📦', NVDA:'💻', META:'💬', V:'💳', CVX:'⛽', TSM:'💻' }[ticker] || '📌')
