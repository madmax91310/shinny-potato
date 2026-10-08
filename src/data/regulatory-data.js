import observations from './automated-regulatory.json' with { type: 'json' }

export function regulatoryValues(snapshot = observations) {
  const values = Object.assign({}, ...Object.values(snapshot.sources).map(source => source.values))
  return { ...values, peaTotal: values.peaIncome + values.peaSocial,
    dividendTotal: values.dividendIncome + values.dividendSocial }
}
export const REGULATORY = Object.freeze(regulatoryValues())
export const regulatoryNumber = key => new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 2}).format(REGULATORY[key]).replace(/\u202f/g, ' ')
export const regulatoryMoney = value => new Intl.NumberFormat('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value).replace(/\u202f/g, ' ')
export const REGULATORY_OBSERVATIONS = observations.sources

export const REGULATORY_LEXICON_SOURCES = {
  pea: ['pea', 'peaTax', 'social'], cto: ['cto', 'dividends'],
  'assurance-vie': ['av'], 'livret-a': ['livret'], ldds: ['ldds'],
  dividende: ['dividends'], 'flat-tax': ['cto', 'dividends', 'av'],
  'abattement-pea': ['social'], 'prelevements-sociaux': ['cto', 'av'],
  per: ['per'], 'pee-perco': ['pee'], lmnp: ['lmnp', 'property'],
  'rendement-locatif': ['rent'], 'plus-value-immobiliere': ['property'],
}
