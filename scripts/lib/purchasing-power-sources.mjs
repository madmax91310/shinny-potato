// Parliament is deliberately narrower than the general household news feeds.
// A budget, healthcare or energy keyword alone does not prove a household impact.
const normalize = s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[’']/g, ' ')
const clean = s => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const HOUSEHOLD = {
  logement: /\bptz\b|pret a taux zero|credit immobilier|assurance emprunteur|acquisition.*(?:logement|immobilier)|frais.*(?:notaire|acquisition)|\bloyers?\b|aides? au logement|\bapl\b|maprimerenov|renovation energetique|accession.*propriete|financement du logement|acces au logement/,
  fiscalite: /\bpea\b|assurance.vie|livret [a-z]|\blep\b|\bpel\b|epargne|prelevement forfaitaire unique|\bpfu\b|impot sur le revenu|taxe fonciere|taxe d habitation|credit d impot|fiscalite.*(?:particuliers|menages|epargne|placements)|succession|donation/,
  depenses: /pouvoir d achat|frais bancaires|assurance.*(?:habitation|automobile)|titres?.restaurant|factures?|tarifs?.*(?:gaz|electricite|energie)|prix.*(?:gaz|electricite|carburant)|franchises medicales|participation forfaitaire|cout.*(?:mutuelle|transport)|consommateurs?.*(?:prix|tarif|frais)/,
  revenus: /\bsmic\b|prime d activite|\brsa\b|allocations? (?:familiales|chomage)|prestations? (?:familiales|sociales)|cheque energie|aides? sociales?|revalorisation.*(?:salaires?|pensions?|retraites?)|conge parental|remuneration.*salaries|\bretraites?\b|\bpensions?\b/,
}
export function parseParliamentaryTopic(title, summary) {
  const t = normalize(`${title} ${summary}`)
  if (/\bentreprises?\b|\bprofessionnels?\b/.test(t) && !/particuliers|menages|foyers|consommateurs|salaries/.test(t)) return null
  return Object.keys(HOUSEHOLD).find(key => HOUSEHOLD[key].test(t)) ?? null
}
export function parliamentaryStatus(title, summary, fallback) {
  const evidence = [title, ...summary.split(/(?<=[.!?])\s+/)].find(clause => {
    const s = normalize(clause)
    return !/pas encore|(?:ne |n ).*pas|pourrait|serait|devrait/.test(s) && /rejete|retire|adopte|depose/.test(s)
  })
  if (!evidence) return fallback
  const s = normalize(evidence)
  const status = /rejete/.test(s) ? 'Rejet indiqué' : /retire/.test(s) ? 'Retrait indiqué' : /adopte/.test(s) ? /commission/.test(s) ? 'Adoption en commission indiquée' : /seance|assemblee nationale|senat/.test(s) ? 'Adoption en chambre indiquée' : 'Vote indiqué · étape à vérifier' : 'Dépôt indiqué · en discussion'
  return { status, evidence: evidence.slice(0, 450) }
}
const MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
export function parseOfficialListing(html, source) {
  const items = []
  if (source.id === 'cre-prix') {
    if (!/card-body|card-time/.test(html)) throw new Error('La liste CRE a changé de format.')
    for (const [, card] of html.matchAll(/<div class="card-body">([\s\S]*?)<\/div>/g)) {
      const link = card.match(/<a\b[^>]*href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
      if (!link) continue
      const title = clean(link[2])
      if (!/prix repère|tarifs? réglementés?|facture|consommateurs? résidentiels?/i.test(title)) continue
      const date = card.match(/<time\b[^>]*datetime="([^"]+)"/i)?.[1]
      if (!date) throw new Error('Date CRE manquante.')
      items.push({ title, summary: title, link: link[1], date })
    }
  } else if (source.id === 'banque-france-credit') {
    if (!/publication-card|card-vertical/.test(html)) throw new Error('La liste Banque de France a changé de format.')
    for (const [, href, card] of html.matchAll(/<a\b[^>]*href\s*=\s*"([^"]*\/credits-aux-particuliers-\d{4}-\d{2})"[^>]*>([\s\S]*?)<\/a>/g)) {
      const title = clean(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? '')
      if (!title) continue
      const date = normalize(clean(card)).match(/\b(\d{1,2}) (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre) (20\d{2})\b/)
      if (!date) throw new Error('Date de publication Banque de France manquante.')
      items.push({ title: `Crédit immobilier et consommation : ${title}`, summary: 'Nouvelle publication des crédits aux particuliers. Consulter la source pour les taux des crédits à l’habitat, hors frais et assurance, et la période statistique.', link: href, date: `${date[3]}-${String(MONTHS.indexOf(date[2])+1).padStart(2,'0')}-${date[1].padStart(2,'0')}` })
    }
    if (!items.length) throw new Error('Aucune publication de crédits aux particuliers trouvée.')
  } else throw new Error('Source HTML inconnue.')
  return `<rss><channel>${items.map(i => `<item><title>${escape(i.title)}</title><description>${escape(i.summary)}</description><link>${escape(i.link)}</link><pubDate>${escape(i.date)}</pubDate></item>`).join('')}</channel></rss>`
}

export function atomToRss(xml) {
  if (xml.length > 2000000 || /<!DOCTYPE|<!ENTITY/i.test(xml) || !/<feed\b/.test(xml) || !/<\/feed>\s*$/.test(xml)) throw new Error('Flux de dossier Sénat invalide.')
  const entries = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)]
  if (entries.length !== (xml.match(/<entry\b/g) ?? []).length) throw new Error('Flux de dossier tronqué.')
  const text = (s, tag) => clean(s.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? '')
  const label = text(xml.split('<entry')[0], 'title').replace(/^Sénat - /, '')
  return `<rss><channel>${entries.map(([, e]) => {
    const link = e.match(/<link\b[^>]*href="([^"]+)"[^>]*rel="alternate"/)?.[1] ?? text(e, 'id')
    return `<item><title>${escape(`${label} : ${text(e, 'title')}`)}</title><description>${escape(text(e, 'summary'))}</description><link>${escape(link)}</link><pubDate>${escape(text(e, 'updated') || text(e, 'published'))}</pubDate></item>`
  }).join('')}</channel></rss>`
}
