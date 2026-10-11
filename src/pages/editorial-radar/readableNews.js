// Explain parliamentary publications without changing the underlying observations.
const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
export function parliamentarySubject(label = '') {
  return label
    .replace(/^N[°º]\s*\d+\s*(?:rapport(?: d’information| d'information)?\s*)?[-–:]\s*/i, '')
    .replace(/^.*?\b(?:visant à|tendant à|relative? à|sur les? propositions? de loi.*?visant à|sur la proposition de loi.*?visant à)\s+/i, '')
    .replace(/\s*[-–:]\s*(?:texte(?: de la commission)?|rapport|amendement)\s*(?:N[°º])?\s*\d+.*$/i, '')
    .replace(/\s*\(\d+\)\.?$/g, '')
    .replace(/\s*\.$/, '').trim()
}
export function explainParliamentary(item) {
  if (item.family !== 'pouvoir-achat' || !/^(Assemblée nationale|Sénat)/.test(item.publisher ?? '')) return null
  const rawTitle = item.originalLabel ?? item.label ?? item.title ?? ''
  const rawSummary = item.originalSummary ?? item.summary ?? ''
  const subject = parliamentarySubject(rawTitle)
  const text = normalize(`${rawTitle} ${rawSummary}`)
  const resolution = /proposition de resolution|resolution en application/.test(text) || /\/ppr\d/.test(item.sourceUrl ?? '')
  const report = /rapport/.test(normalize(rawTitle))
  let title = subject ? subject[0].toUpperCase() + subject.slice(1) : 'Un texte concernant le budget des particuliers'
  let summary = `Le sujet concerne ${subject ? subject[0].toLowerCase() + subject.slice(1) : 'le budget des particuliers'}.`
  let angle = 'Quelles règles pourraient changer, et pour quelles personnes ?'
  if (/preserver le modele francais du financement du logement/.test(text)) {
    title = 'Crédit immobilier : défendre les prêts à taux fixe'
    summary = 'Le texte demande de préserver les prêts immobiliers à taux fixe. Pour les emprunteurs, l’enjeu est de garder un taux qui n’augmente pas lorsque les taux du marché montent.'
    angle = 'Expliquer l’intérêt d’un taux fixe pour quelqu’un qui achète son logement.'
  } else if (/moderniser et reequilibrer le fonctionnement du titre.restaurant/.test(text)) {
    title = 'Titres-restaurant : des changements sont à l’étude'
    summary = 'Une proposition vise à changer les règles des titres-restaurant utilisés par les salariés. Les points à vérifier sont les achats autorisés et les conditions d’utilisation. Le résumé officiel récupéré ne précise pas encore les règles qui seraient retenues.'
    angle = 'Quels achats les salariés pourraient-ils payer avec leurs titres-restaurant ?'
  } else if (/\bptz\b|pret a taux zero/.test(text)) {
    title = `PTZ : ${subject.replace(/^.*?(?:PTZ|prêt à taux zéro)\s*[:–-]?\s*/i, '') || 'une évolution à suivre'}`
    summary = `Le sujet porte sur le prêt à taux zéro, qui permet de financer une partie d’un achat immobilier sans intérêts. La proposition concerne ${subject[0]?.toLowerCase() ?? ''}${subject.slice(1)}.`
    angle = 'Qui pourrait obtenir ce prêt, pour quel achat et pour quel montant ?'
  } else {
    const stakes = {
      logement: 'Pour les particuliers, le point à vérifier est l’effet sur le coût du logement ou l’accès à un crédit.',
      fiscalite: 'Le point à vérifier est ce que cela pourrait changer pour les impôts ou l’épargne des personnes concernées.',
      depenses: 'Le point à vérifier est ce que cela pourrait changer pour les achats ou les factures des personnes concernées.',
      revenus: 'Le point à vérifier est ce que cela pourrait changer pour les revenus ou les aides des personnes concernées.',
    }
    summary = `L’objectif du texte : ${subject[0]?.toLowerCase() ?? ''}${subject.slice(1)}. ${stakes[item.topic] ?? ''}`.trim()
  }
  const officialStatus = item.officialStatus ?? item.status
  const stages = {
    'Dépôt indiqué · en discussion': 'Le texte a été présenté. Il doit encore être examiné.',
    'Proposition / en discussion': 'Le texte est encore en discussion.',
    'Adoption en commission indiquée': 'Un groupe de parlementaires a approuvé le texte en commission. Cette étape ne suffit pas à le rendre applicable.',
    'Adoption en chambre indiquée': 'Le texte a été approuvé par l’Assemblée ou le Sénat. Ce vote ne suffit pas à confirmer son application.',
    'Vote indiqué · étape à vérifier': 'Un vote est mentionné. La source ne suffit pas à préciser l’étape ni à confirmer l’application.',
    'Rejet indiqué': 'La proposition a été rejetée lors de l’étape mentionnée.',
    'Retrait indiqué': 'La proposition a été retirée lors de l’étape mentionnée.',
    'Promulgation indiquée': 'Le texte est devenu une loi. Sa date d’application reste à vérifier.',
    'Application indiquée': 'La source indique que la mesure est entrée en application.',
    'Application annoncée': 'La source annonce une application à venir.',
    'Annonce': 'Une annonce a été faite. Les règles et leur date d’application restent à confirmer.',
    'À préciser': 'Le document a été publié, mais l’étape du texte n’est pas précisée dans les informations récupérées.',
  }
  let status = stages[officialStatus] ?? stages['À préciser']
  if (report && /Proposition|Dépôt|À préciser/.test(officialStatus ?? '')) status = 'Un rapport a été publié pour examiner la proposition. La publication de ce rapport ne signifie pas que les changements sont applicables.'
  if (resolution) status += ' Il s’agit d’une demande politique : elle ne change pas, à elle seule, les règles pour les particuliers.'
  return { title, summary, status, angle }
}
export function readableNews(item) {
  const explanation = explainParliamentary(item)
  if (!explanation) return item
  return { ...item, originalLabel: item.originalLabel ?? item.label, originalSummary: item.originalSummary ?? item.summary, officialStatus: item.officialStatus ?? item.status,
    label: explanation.title, ...(item.title ? { title: explanation.title } : {}), summary: explanation.summary, status: explanation.status, angle: explanation.angle,
    ...(item.draft ? { draft: `🔖 Sauvegarde ce tweet\n\n${explanation.title}\n\n${explanation.summary}\n\n📌 ${explanation.status}\n\n💬 ${explanation.angle}\n\nSource : ${item.sourceUrl}` } : {}) }
}
