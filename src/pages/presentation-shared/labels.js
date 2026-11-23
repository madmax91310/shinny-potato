// Labels shared by the three presentation families. Units and publication dates stay explicit.
export const format = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
export const dateLabel = value => value ? value.split('-').reverse().join('/') : null
export const annualPublicationNote = publication => publication?.awaitingPublication
  ? publication.latestPublishedYear == null
    ? `Rendement annuel ${publication.expectedYear} en attente de publication.`
    : `Dernier exercice publié : ${publication.latestPublishedYear}. Les chiffres ${publication.expectedYear} restent en attente de publication.`
  : ''
