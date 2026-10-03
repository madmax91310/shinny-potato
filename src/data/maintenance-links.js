// Consultation uniquement : ces liens ne remplacent pas les preuves enregistrées.
function parse(raw) {
  try { const url = new URL(raw); return url.protocol === 'https:' ? url : null } catch { return null }
}
function frozen(url) {
  return /(?:19|20)\d{2}[-/]?(?:0[1-9]|1[0-2])(?:[-/]?[0-3]\d)?/.test(url.pathname)
    || ['period1', 'period2', 'start_date', 'end_date'].some(key => url.searchParams.has(key))
}
function consultation(raw) {
  const url = parse(raw)
  if (!url) return null
  // Le ticker est lu dans la preuve, jamais déduit du nom de l'actif.
  if (/^query[12]\.finance\.yahoo\.com$/.test(url.hostname) && url.pathname.startsWith('/v8/finance/chart/')) {
    const ticker = url.pathname.slice('/v8/finance/chart/'.length)
    if (ticker && !ticker.includes('/')) return { url: `https://finance.yahoo.com/quote/${ticker}/history/`, label: 'Consulter l’historique Yahoo', kind: 'page' }
  }
  if (frozen(url)) return null
  return { url: raw, label: /\.pdf$/i.test(url.pathname) ? 'Consulter le document disponible' : 'Consulter la source actuelle', kind: 'page' }
}
export function maintenanceLinks(record, field) {
  if (field.metadata.sourceStatus === 'archive-unverifiable') return []
  const links = []
  const add = link => { if (link && !links.some(x => x.url === link.url)) links.push(link) }
  for (const raw of field.metadata.sourceUrls ?? []) {
    const direct = consultation(raw)
    if (direct) { add(direct); continue }
    const url = parse(raw)
    if (!url) continue
    // Recherche explicite, sans inventer le chemin d'un nouveau PDF daté.
    const subject = record.type === 'instrument' ? record.id : record.name
    const terms = /monthly-factsheet|MonthlyFactsheet/i.test(url.pathname) ? 'fiche mensuelle' : 'publication'
    const search = new URL('https://www.google.com/search')
    search.searchParams.set('q', `site:${url.hostname} ${subject} ${terms}`)
    add({ url: search.href, label: `Rechercher la nouvelle publication · ${url.hostname.replace(/^www\./, '')}`, kind: 'search' })
  }
  if (record.type === 'instrument') {
    const identity = record.fields.find(x => x.label === 'Identité')
    const profile = identity?.metadata.sourceUrls?.find(raw => {
      const url = parse(raw)
      return url && !frozen(url) && !/\.pdf$/i.test(url.pathname)
    })
    if (profile) add({ url: profile, label: 'Ouvrir le profil de l’ETF', kind: 'profile' })
  }
  return links
}
