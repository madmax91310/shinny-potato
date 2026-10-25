// Deterministic editorial qualification. The weights live in radar-editorial;
// these distinctions describe evidence, not a prediction of audience or views.
const normal = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[’']/g, ' ')
export function qualifyRadarFact(event) {
  const title = normal(event.label ?? event.title ?? event.value?.title)
  const body = normal(event.summary ?? event.evidence?.excerpt ?? '')
  const text = title + ' ' + body
  const professionalFinance = /pret|credit|financement|tresorerie/.test(title) && /commercants?|entrepreneurs?|professionnels?|entreprises?|reprise d activite/.test(text) && !/credit immobilier|pret immobilier|menages|clients particuliers|emprunteurs particuliers/.test(text)
  const professionalSurvey = /promoteurs?|promotion immobiliere|industriels?|climat des affaires|production industrielle/.test(title) && !/salaires?|remuneration|niveau de vie/.test(title)
  const forecast = /previsions?|anticipations?|perspectives|attendus?|attendues?|devraient|pourrai(?:t|ent)|d ici|a venir/.test(title) && /taux|prix|credit|chantier|conjoncture|inflation/.test(title)
  const survey = /sondage|barometre|personnes interrogees|sondes|enquete.*(?:francais|menages|epargnants)/.test(text)
  const intentions = survey && /prevoient|envisagent|souhaitent|intentions?|aspirations?|inquiet|perceptions?|se declarent/.test(text)
  const household = /menages|francais|particuliers|salaries|epargnants|emprunteurs|locataires|proprietaires/.test(text)
  const nature = professionalFinance ? 'professional-financing' : professionalSurvey ? 'professional-survey' : forecast ? 'forecast' : intentions ? 'household-intentions' : survey && household ? 'household-survey' : event.factType === 'statistical-publication' ? 'observed-statistic' : event.correctionOf || event.status === 'Correction / démenti' ? 'correction' : 'documented-announcement'
  const labels = { 'professional-financing':'Financement professionnel', 'professional-survey':'Enquête auprès de professionnels', forecast:'Prévision ou anticipation', 'household-intentions':'Sondage : intentions ou perceptions', 'household-survey':'Enquête auprès des ménages', 'observed-statistic':'Statistique observée', correction:'Correction ou démenti', 'documented-announcement':'Annonce documentée' }
  const population = professionalFinance ? 'Professionnels concernés par le financement ; aucune offre aux ménages déduite.' : professionalSurvey ? 'Professionnels interrogés ; leurs opinions ne mesurent pas les prix payés par les ménages.' : survey && household ? 'Personnes interrogées dans le périmètre de l’enquête ; intentions et réponses déclarées.' : event.populationScope ?? event.population ?? null
  return { version:1, nature, label:labels[nature], population, audience:professionalFinance || professionalSurvey ? 'professional' : household ? 'household' : 'unknown', impact:forecast || intentions || professionalSurvey ? 'prospective' : survey ? 'reported' : 'documented', reasons:[labels[nature], ...(population ? [population] : ['Population non documentée : aucun nombre de personnes déduit.'])] }
}
export function publicationTime(event) {
  return event.changeEvidence?.observedAt ?? (event.correctionOf && event.correctionPublishedAt ? event.correctionPublishedAt : event.publishedAt ?? (event.field === 'announcement' ? event.period : event.detectedAt))
}
