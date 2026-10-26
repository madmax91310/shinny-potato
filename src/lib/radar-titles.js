import {investorFilingType,etfAnnouncement} from './radar-fact-types.js'
export function readableInvestorFiling(event) {
  const type = investorFilingType(event)
  if (!type || type === 'publication' || type === 'coverage') return event
  const reason = type === 'revision'
    ? 'Le relevé a changé pour une même période. Cela peut venir de la source ou de la collecte ; cette mise à jour ne prouve pas une nouvelle opération de l’investisseur.'
    : 'Les périodes disponibles ne permettent pas d’établir une nouvelle déclaration.'
  const angle = 'Comparer les relevés et leur périmètre avant de parler de nouveaux achats ou de nouvelles ventes.'
  return { ...event, title: factualTitle(event), reason, angle,
    draft: `${factualTitle(event)}\n\n${reason}\n\nPériode déclarée : ${event.period ?? 'non documentée'}\n${event.scope ?? ''}\n\n${angle}` }
}

export function factualTitle(event) {
  if (event.family === 'economie' && event.unit && event.entity === 'salary-median') return `${event.label} : ${event.afterText} en ${event.period}`
  if (['statistical-publication','publication-watch','consumer-announcement'].includes(event.factType)) return event.label
  const filing = investorFilingType(event)
  if (filing === 'revision') return `${event.label} : relevé révisé pour la même période · ${event.period}`
  if (filing === 'unknown') return `${event.label} : période de déclaration à vérifier`
  if (!event.label || !event.fieldLabel) return event.title
  if (event.family === 'etf' && event.field === 'announcement') {
    const announcement = event.announcementEvidence ?? etfAnnouncement(event.label)
    return announcement ? `${announcement.label} : ${event.label}` : `Communiqué : ${event.label}`
  }
  if (event.family === 'pouvoir-achat') return event.label
  if (event.kind === 'new') return `${event.label} : nouvelle donnée suivie`
  if (event.kind === 'publication') return `${event.label} : ${event.fieldLabel} · ${event.period}`
  if (['number', 'boolean', 'string'].includes(typeof event.before) && ['number', 'boolean', 'string'].includes(typeof event.after)) return `${event.label} : ${event.fieldLabel.toLocaleLowerCase('fr-FR')}, ${event.beforeText} → ${event.afterText}`
  return `${event.label} : ${event.fieldLabel.toLocaleLowerCase('fr-FR')} modifiés`
}
