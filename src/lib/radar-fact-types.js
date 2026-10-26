const normal = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
// The collection date and a legacy `publication` label cannot establish a new
// reporting period. The guard also applies to events already in the feed.
export function investorFilingType(event) {
  if (event.family !== 'investisseurs' || event.field !== 'filing') return null
  if (event.kind === 'new') return 'coverage'
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  if (!validDate(event.period) || !validDate(event.beforePeriod)) return 'unknown'
  if (event.period === event.beforePeriod) return 'revision'
  return event.period > event.beforePeriod ? 'publication' : 'unknown'
}

// Only explicit issuer wording qualifies an announcement. A launch is not a
// listing, French distribution permission, or availability at a retail broker.
export function etfAnnouncement(title = '') {
  const t = normal(title)
  if (!/\betfs?\b|exchange.traded|\bucits\b/.test(t)) return null
  if (/\b(?:report|research|study|webinar|survey|guide|rapport|etude|guide)\b/.test(t)) return null
  if (/\b(?:not|no|may|might|could|considering|rumour|rumor)\b|ne .*pas|pourrait|envisage/.test(t)) return null
  if (/\b(?:will|plans? to|expected to|scheduled to)\b|lancera|sera |va lancer/.test(t) && /launch|lanc/.test(t)) return { type: 'launch', stage: 'announced', label: 'Lancement annoncé', evidence: title }
  if (/\b(?:merger|merge[sd]?|fusion)\b/.test(t)) return {type:'merger',stage:'announced',label:'Fusion annoncée',evidence:title}
  if (/delist|radiation|retrait de (?:la )?cotation/.test(t)) return {type:'delisting',stage:'announced',label:'Retrait de cotation annoncé',evidence:title}
  if (/\b(?:closure|clos(?:es|ing)|liquidation|fermeture|dissolution)\b/.test(t)) return {type:'closure',stage:'announced',label:'Fermeture annoncée',evidence:title}
  if (/nouvel indice|changement d.indice|changes? (?:its )?(?:benchmark|index)|eligible.*pea|eligibilite.*pea/.test(t)) return {type:'characteristic-change',stage:'announced',label:'Changement de caractéristique annoncé',evidence:title}
  if (/registered for distribution in france|commercialisation.*france|available.*retail.*france/.test(t)) return {type:'france-distribution',stage:'announced',label:/registered/.test(t)?'Enregistrement pour distribution en France annoncé':'Commercialisation en France annoncée',evidence:title}
  if (/nouvelle place de cotation|additional listing|cross.list/.test(t)) return { type: 'listing', stage: 'trading', label: 'Nouvelle place de cotation annoncée', evidence: title }
  if (/premiere cotation|first trading date|first listing/.test(t)) return { type: 'first-trading', stage: /will|prevu|annonce|sera/.test(t) ? 'announced' : 'trading', label: 'Première cotation annoncée', evidence: title }
  if (/cote .*sur|lists? .*on|(?:will|expected to).{0,20}(?:trad|list)|seront cotes|sera cote/.test(t)) return { type: 'trading', stage: /will|expected|sera/.test(t) ? 'announced' : 'trading', label: 'Cotation ou négociation annoncée', evidence: title }
  if (/\b(?:now trading|begins? trading|starts? trading|commences? trading|listed today)\b|desormais (?:cote|negociable)|debut des negociations/.test(t)) return { type: 'trading', stage: 'trading', label: 'Négociation annoncée par l’émetteur', evidence: title }
  if (/\b(?:will launch|plans? to launch|to launch|upcoming launch)\b|lancera|va lancer|lancement (?:prevu|annonce)|sera lance/.test(t)) return { type: 'launch', stage: 'announced', label: 'Lancement annoncé', evidence: title }
  if (/\blaunch(?:es|ed|ing)?\b|\bintroduces?\b|\blance\b|\blancement\b/.test(t)) return { type: 'launch', stage: 'launched', label: 'Lancement déclaré par l’émetteur', evidence: title }
  if (/expands?.*(?:range|offering)|renforce (?:sa gamme|son offre)|enrichit (?:sa gamme|son offre)|nouvelles solutions|elargit (?:sa gamme|son offre)/.test(t)) return { type: 'announcement', stage: 'candidate', label: 'Nouvelle offre à qualifier', evidence: title }
  return null
}

