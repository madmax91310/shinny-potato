import {qualifyRadarFact} from '../../lib/radar-qualification.js'
export function editorialAudience(event) {
  const qualification = qualifyRadarFact(event)
  if (qualification.audience === 'professional' || /survey|intentions/.test(qualification.nature)) return qualification.population
  if (event.populationScope) return event.populationScope
  if (event.family === 'economie') return event.population ?? 'Ménages et salariés dans le périmètre de la publication.'
  return ({ etf: 'Épargnants qui détiennent ou comparent cet ETF.', courtiers: 'Clients de ce courtier, selon le marché et la formule concernés.', epargne: 'Épargnants concernés par le produit ou le régime indiqué.', assurance: 'Souscripteurs de ce contrat, selon ses conditions.', scpi: 'Associés et nouveaux souscripteurs de cette SCPI.', investisseurs: 'Lecteurs qui suivent les positions déclarées de cet investisseur.', 'pouvoir-achat': 'Particuliers concernés par les conditions décrites dans la source.' })[event.family] ?? 'Lecteurs intéressés par cette exposition.'
}


