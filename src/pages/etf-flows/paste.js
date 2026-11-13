// Local conversion only: no provider fetch, inferred dates, or licence grant.
export const FLOW_SOURCES = [
  {id: 'express', label: 'ETF Express · récap européen', url: 'https://etfexpress.com/2026/11/09/european-etf-market-wrap-flows-performance-and-leaders-week-45-2026/', publisher: 'ETF Express', provider: 'Trackinsight'},
]
const amountPattern = /([+−-]?)\s*([€$])\s*(\d+(?:[.,]\d+)?)\s*(billion|million|bn|Md|[BMKk])?\b|([+−-]?)\s*(\d+(?:[.,]\d+)?)\s*(billion|million|bn|Md|[BMKk])?\s*([€$])/gi
const scales = {billion: 1e9, million: 1e6, bn: 1e9, md: 1e9, b: 1e9, m: 1e6, k: 1e3}
const cleanLabel = text => text.replace(/^\s*(?:[•·]|\d+[.)])\s*/, '').replace(/[|:;=]+\s*$/, '').trim()
export function parsePastedFlows(text, group) {
  if (!['asset','geography','sector','fund'].includes(group)) throw Error('Choisis une rubrique.')
  if (typeof text !== 'string' || text.length > 50000) throw Error('Colle un extrait de 50 000 caractères maximum.')
  const rows = [], warnings = [], currencies = new Set(), labels = new Set()
  const lines = text.replace(/\u00a0|\u202f/g,' ').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
  for (let i=0;i<lines.length;i++) {
    let line=lines[i]
    // Trackinsight's copied cards often put the label on the preceding line.
    if (/^[+−-]\s*(?:[€$]|\d)/.test(line) && i && !/[€$%]/.test(lines[i-1]) && !/^\d+$/.test(lines[i-1])) line=lines[i-1]+' : '+line
    // Never turn a performance, asset size or year-to-date card into weekly flows.
    if (/%|\b(?:returns?|performance|AuM|net assets|assets under management|encours|fees?|expense ratio|YTD)\b/i.test(line)) {
      if (/[€$%]/.test(line)) warnings.push('Ligne exclue (performance, encours ou YTD) : '+line)
      continue
    }
    const matches=[...line.matchAll(amountPattern)]
    if (!matches.length) continue
    // Long prose / mixed directions must be split by the user, never guessed.
    const positive=/\b(?:inflows?|attracted|gathered|took in|apports?|entrées?)\b/i.test(line)
    const negative=/\b(?:outflows?|withdrawals?|lost|sorties?|retraits?)\b/i.test(line)
    if (positive && negative) {warnings.push('Sens ambigu, sépare les entrées des sorties : '+line);continue}
    let previous=0
    for (const m of matches) {
      const sign=m[1]||m[5], symbol=m[2]||m[8], n=m[3]||m[6], suffix=m[4]||m[7]||''
      const currency=symbol==='€'?'EUR':'USD'
      // Reject ambiguous thousands rather than silently treating them as decimals.
      const tail=line.slice(m.index+m[0].length)
      if (/^[.,]\d/.test(tail) || (/^[.,]/.test(n)) || (/[.,]\d{3}$/.test(n) && !suffix)) {warnings.push('Nombre ambigu : '+line);continue}
      if (!sign && !positive && !negative) {warnings.push('Signe ou sens du flux absent : '+line);continue}
      if ((sign==='+' && negative) || (/[−-]/.test(sign) && positive)) {warnings.push('Signe contradictoire : '+line);continue}
      let label=cleanLabel(line.slice(previous,m.index))
      previous=m.index+m[0].length
      // Additional amounts must be explicit parenthesised category pairs.
      if (matches.length>1) {
        if (!label.endsWith('(')) {warnings.push('Plusieurs montants : colle une exposition par ligne.');continue}
        label=cleanLabel(label.replace(/^\s*\)?\s*,?\s*(?:(?:and|et)\s+)?/i,'').slice(0,-1))
      } else {
        label=label.replace(/\s+(?:ETFs?\s+)?(?:recorded|attracted|gathered|received|took in|lost|saw|enregistr\S*|ont?\s+attir\S*)\b.*$/i,'').trim()
      }
      if (!label || label.length>60 || /\b(?:According to|followed by|followed|while|ahead of)\b/i.test(label)) {warnings.push('Libellé à simplifier : '+line);continue}
      const key=label.toLowerCase()
      if (labels.has(key)) {warnings.push('Doublon à vérifier : '+label);continue}
      const amount=Number(n.replace(',','.'))*(scales[suffix.toLowerCase()]??1)*((/[−-]/.test(sign)||(!sign&&negative))?-1:1)
      if (!Number.isFinite(amount)) {warnings.push('Montant hors limites : '+label);continue}
      labels.add(key);currencies.add(currency)
      const raw=`${amount<0?'−':'+'}${Math.abs(amount)} ${currency}`
      rows.push({id:`paste-${rows.length+1}`,group,label,originalLabel:label,raw,amount,evidence:line})
    }
  }
  if (currencies.size>1) warnings.push('Plusieurs devises : importe séparément les extraits EUR et USD.')
  if (rows.length>80) warnings.push('Limite de 80 lignes : réduis l’extrait.')
  if (!rows.length) warnings.push('Aucun flux reconnu. Exemple de format : Financials : +421,7 M€')
  return {rows,currency:currencies.size===1?[...currencies][0]:null,warnings}
}
