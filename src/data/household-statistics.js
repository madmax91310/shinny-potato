// Valeurs publiées, jamais estimées à partir de moyennes. « Début 2024 » n'est pas une date au jour près.
import { householdObservation, householdSources } from './economic-data.js'
import { householdEditorial } from './household-editorial.js'
export const HOUSEHOLD_SOURCES = Object.freeze(householdSources({
  wealth: { title: 'Les montants de patrimoine détenus par les ménages en 2024', url: 'https://www.insee.fr/fr/statistiques/8672665', publishedAt: '2025-12-09' },
  holdings: { title: 'La détention de patrimoine des ménages en 2024', url: 'https://www.insee.fr/fr/statistiques/8569009', publishedAt: '2025-05-14', correctedAt: '2025-12-10' },
  living: { title: 'La privation matérielle et sociale en 2025', url: 'https://www.insee.fr/fr/statistiques/8967255', publishedAt: '2026-04-15' },
  salaries: { title: 'Les salaires dans le secteur privé en 2024', url: 'https://www.insee.fr/fr/statistiques/8657156', publishedAt: '2025-10-23' },
  ageWealth: { title: 'Patrimoine selon l’âge en 2024', url: 'https://www.insee.fr/fr/statistiques/8894780', publishedAt: '2026-04-07' },
  ageHoldings: { title: 'Détention de patrimoine selon l’âge et la catégorie sociale', url: 'https://www.insee.fr/fr/statistiques/2412784', publishedAt: '2026-04-07' },
  transmissions: { title: 'Transmissions intergénérationnelles en 2024', url: 'https://www.insee.fr/fr/statistiques/8960217', publishedAt: '2026-04-07' },
}))
export const HOUSEHOLD_SCOPE = 'France hors Mayotte, ménages vivant dans un logement ordinaire.'
export const HOUSEHOLD_STATISTICS = Object.freeze([
  { id: 'wealth-share', title: 'Qui possède le patrimoine ?', category: 'Patrimoine', kind: 'share', source: 'wealth', table: 'Le patrimoine est très inégalement réparti', value: 7, unit: '%', populationPercent: 50,
    headline: '50 ménages se partagent {value} % du patrimoine', metricLabel: 'du patrimoine brut pour la moitié la moins dotée',
    note: 'Patrimoine brut : immobilier, financier, professionnel et résiduel, avant déduction des emprunts. Les deux moitiés sont classées par patrimoine brut.' },
  { id: 'wealth-top10', title: 'Le seuil des 10 %', category: 'Patrimoine', kind: 'threshold', source: 'wealth', table: 'Figure 1 : patrimoine net, D9', value: 750400, unit: 'EUR', populationPercent: 10,
    headline: 'Le seuil pour entrer dans les 10 %', metricLabel: 'de patrimoine net, dettes déduites',
    note: 'Seuil du neuvième décile de patrimoine net. Le classement net est distinct du classement brut. Les biens immobiliers et les autres actifs sont inclus.' },
  { id: 'wealth-median', title: 'Le patrimoine médian', category: 'Patrimoine', kind: 'threshold', source: 'wealth', table: 'Figure 1 : patrimoine net, médiane D5', value: 148100, unit: 'EUR', populationPercent: 50,
    headline: 'Le montant qui sépare les ménages en deux', metricLabel: 'de patrimoine net médian',
    note: 'Médiane du patrimoine net, après déduction des emprunts. Ce montant ne correspond pas à l’épargne disponible.' },
  { id: 'pea', title: 'Qui détient un PEA ?', category: 'Placements', kind: 'rate', source: 'holdings', table: 'Texte : détention des valeurs mobilières, PEA', value: 9.8, unit: '%',
    headline: 'Le PEA est-il vraiment partout ?', metricLabel: 'des ménages détiennent un PEA', note: 'Détention d’au moins un PEA par le ménage, quel que soit l’encours. Ce taux ne mesure pas toute l’exposition aux actions.' },
  { id: 'livret-assurance', title: 'Livret A et assurance-vie', category: 'Placements', kind: 'comparison', source: 'holdings', table: 'Figure 2 : Livret A ou Bleu, assurance-vie', value: 78.1, secondValue: 41.7, unit: '%',
    headline: 'Deux placements, deux réalités', metricLabel: 'Livret A ou Bleu', secondLabel: 'Assurance-vie', note: 'Les détentions peuvent se cumuler. Deux grilles indépendantes : elles ne représentent pas des groupes exclusifs.' },
  { id: 'homeowners', title: 'La résidence principale', category: 'Immobilier', kind: 'rate', source: 'holdings', table: 'Figure 1a : résidence principale, 2024', value: 57.2, unit: '%',
    headline: 'Tous propriétaires ? Pas vraiment.', metricLabel: 'propriétaires de leur résidence principale', note: 'Usufruitiers inclus. Toutes générations confondues ; ne pas interpréter ce taux comme celui des jeunes ménages.' },
  { id: 'debt', title: 'Qui rembourse un crédit ?', category: 'Crédit', kind: 'rate', source: 'holdings', table: 'Figure 1a : endettement, 2024, corrigé le 10 décembre 2025', value: 45.6, unit: '%',
    headline: 'Combien de ménages ont un crédit ?', metricLabel: 'des ménages ont un emprunt en cours', note: 'Endettement privé ou professionnel. Le taux ne mesure pas le surendettement.' },
  { id: 'inheritance', title: 'Qui a déjà hérité ?', category: 'Transmission', kind: 'rate', source: 'transmissions', table: 'Début 2024, 41 % des ménages ont déjà hérité', value: 41, unit: '%',
    headline: 'Hériter : exceptionnel ou fréquent ?', metricLabel: 'des ménages ont déjà reçu un héritage', note: 'Au moins un membre du ménage a hérité au cours de sa vie. Ce taux ne renseigne ni le montant, ni l’âge à la réception, ni un effet causal sur le patrimoine.' },
  { id: 'donation', title: 'Qui a reçu une donation ?', category: 'Transmission', kind: 'rate', source: 'transmissions', table: 'Les donations sont plus rares', value: 20, unit: '%',
    headline: 'Le coup de pouce familial en chiffres', metricLabel: 'des ménages ont reçu une donation déclarée', note: 'Donation déclarée devant un notaire, un avocat ou à l’administration fiscale, reçue par au moins un membre au cours de sa vie. Ne recense pas tous les coups de pouce familiaux.' },
  { id: 'unexpected-expense', title: 'Une dépense imprévue de 1 000 €', category: 'Niveau de vie', kind: 'rate', source: 'living', table: 'Figure 3 : faire face à une dépense inattendue de 1 000 euros', value: 28.1, unit: '%', referencePeriod: 'Début 2025', population: 'personnes', provisional: true,
    scope: 'France métropolitaine, personnes vivant dans un logement ordinaire.',
    headline: '1 000 € imprévus : un vrai obstacle', metricLabel: 'ne peuvent pas faire face à cette dépense',
    visualNote: 'Personnes en logement ordinaire. Difficulté financière déclarée. Données provisoires.',
    note: 'Impossibilité déclarée pour des raisons financières. Données provisoires. Personnes, et non ménages.' },
  { id: 'holidays', title: 'Partir une semaine en vacances', category: 'Niveau de vie', kind: 'rate', source: 'living', table: 'Figure 3 : se payer une semaine de vacances dans l’année', value: 22.2, unit: '%', referencePeriod: 'Début 2025', population: 'personnes', provisional: true,
    scope: 'France métropolitaine, personnes vivant dans un logement ordinaire.',
    headline: 'Une semaine de vacances reste inaccessible', metricLabel: 'ne peuvent pas se payer une semaine de vacances',
    visualNote: 'Personnes en logement ordinaire. Difficulté financière déclarée. Données provisoires.',
    note: 'Impossibilité déclarée pour des raisons financières. Données provisoires. Personnes, et non ménages.' },
  { id: 'salary-top10', title: 'Le salaire des 10 % les mieux payés', category: 'Salaires', kind: 'threshold', source: 'salaries', table: 'Figure 3 : distribution des salaires nets mensuels en EQTP, D9', value: 4334, unit: 'EUR', populationPercent: 10, referencePeriod: '2024', population: 'salariés',
    scope: 'France, secteur privé, apprentis, stagiaires et contrats aidés inclus ; agriculture et salariés des particuliers employeurs exclus. Salaires en équivalent temps plein.',
    headline: 'Le seuil des 10 % les mieux payés', metricLabel: 'nets par mois, en équivalent temps plein', distributionLabel: '10 sur 100 au-dessus de ce salaire',
    visualNote: 'Secteur privé. Net de cotisations, avant impôt sur le revenu. EQTP.',
    note: 'Seuil du neuvième décile. Net de cotisations sociales, avant impôt sur le revenu. Salaire en équivalent temps plein, pas la somme effectivement versée à un temps partiel.' },
  { id: 'salary-median', title: 'Le salaire qui sépare le privé en deux', category: 'Salaires', kind: 'threshold', source: 'salaries', table: 'Figure 3 : distribution des salaires nets mensuels en EQTP, médiane', value: 2190, unit: 'EUR', populationPercent: 50, referencePeriod: '2024', population: 'salariés',
    scope: 'France, secteur privé, apprentis, stagiaires et contrats aidés inclus ; agriculture et salariés des particuliers employeurs exclus. Salaires en équivalent temps plein.',
    headline: 'Le salaire qui sépare le privé en deux', metricLabel: 'nets par mois : le salaire médian en EQTP', distributionLabel: '50 sur 100 sous le salaire médian',
    visualNote: 'Secteur privé. Net de cotisations, avant impôt sur le revenu. EQTP.',
    note: 'Médiane des salaires nets mensuels en équivalent temps plein. Avant impôt sur le revenu. Ne pas confondre avec la moyenne, ni avec les montants versés aux temps partiels.' },
  { id: 'young-wealth', title: 'Le patrimoine avant 30 ans', category: 'Patrimoine', kind: 'threshold', source: 'ageWealth', table: 'Montants de patrimoine brut selon l’âge : moins de 30 ans, médiane', value: 26100, unit: 'EUR', populationPercent: 50,
    headline: 'Avant 30 ans, un autre repère', metricLabel: 'de patrimoine brut médian avant 30 ans', distributionLabel: '50 ménages sur 100 sous ce montant',
    visualNote: 'Âge de la personne de référence : moins de 30 ans. Dettes non déduites.',
    scope: 'France hors Mayotte, ménages en logement ordinaire dont la personne de référence a moins de 30 ans. Personne de référence : principal apporteur de revenus.',
    note: 'Patrimoine brut, avant déduction des emprunts. Âge du principal apporteur de revenus du ménage, pas de tous ses membres.' },
  { id: 'thirties-wealth', title: 'Les 10 % les mieux dotés à 30–39 ans', category: 'Patrimoine', kind: 'threshold', source: 'ageWealth', table: 'Montants de patrimoine brut selon l’âge : 30 à 39 ans, D9', value: 620100, unit: 'EUR', populationPercent: 10,
    headline: 'À 30–39 ans, le seuil des 10 %', metricLabel: 'de patrimoine brut pour dépasser ce seuil', distributionLabel: 'Les 10 ménages les mieux dotés de cette tranche d’âge',
    visualNote: 'Âge de la personne de référence : 30–39 ans. Dettes non déduites.',
    scope: 'France hors Mayotte, ménages en logement ordinaire dont la personne de référence a de 30 à 39 ans. Personne de référence : principal apporteur de revenus.',
    note: 'Seuil du neuvième décile de patrimoine brut. Dettes non déduites. Âge du principal apporteur de revenus du ménage.' },
  { id: 'young-homeowners', title: 'Propriétaires avant 30 ans', category: 'Immobilier', kind: 'rate', source: 'ageHoldings', table: 'Détention selon l’âge : moins de 30 ans, résidence principale', value: 17.2, unit: '%',
    headline: 'Avant 30 ans, propriétaires minoritaires', metricLabel: 'propriétaires de leur résidence principale',
    visualNote: 'Âge de la personne de référence : moins de 30 ans. Usufruitiers inclus.',
    scope: 'France hors Mayotte, ménages en logement ordinaire dont la personne de référence a moins de 30 ans. Personne de référence : principal apporteur de revenus.',
    note: 'Usufruitiers inclus. Âge du principal apporteur de revenus du ménage, pas de tous ses membres.' },
  { id: 'securities-workers', title: 'Titres financiers : cadres et ouvriers', category: 'Placements', kind: 'comparison', source: 'ageHoldings', table: 'Détention selon la catégorie sociale : valeurs mobilières, cadres et ouvriers', value: 31.7, secondValue: 8, unit: '%',
    headline: 'Les titres financiers ne sont pas partout', metricLabel: 'Ménages de cadres', secondLabel: 'Ménages d’ouvriers', comparisonNote: 'Deux populations distinctes : 100 ménages de cadres et 100 ménages d’ouvriers.',
    visualNote: 'Détention de valeurs mobilières. Profession de la personne de référence.',
    scope: 'France hors Mayotte, ménages en logement ordinaire. Catégorie sociale du principal apporteur de revenus : cadres et professions intellectuelles supérieures, ou ouvriers.',
    note: 'Taux de détention de valeurs mobilières, pas les montants investis ni toute l’exposition aux actions. Catégorie sociale du principal apporteur de revenus du ménage.' },
  {"id": "lep", "title": "Qui détient un LEP ?", "category": "Placements", "kind": "rate", "source": "holdings", "table": "Figure 2 : Livret d’épargne populaire (LEP)", "value": 21.5, "unit": "%", "headline": "Le LEP reste minoritaire", "metricLabel": "des ménages détiennent un LEP", "note": "Taux parmi tous les ménages, y compris ceux qui ne sont pas éligibles. Ne mesure pas le recours parmi les ménages éligibles.", "checkedAt": "2026-10-03"},
  {"id": "ldds", "title": "Qui détient un LDDS ?", "category": "Placements", "kind": "rate", "source": "holdings", "table": "Figure 2 : LDDS", "value": 39.7, "unit": "%", "headline": "Le LDDS dans combien de foyers ?", "metricLabel": "des ménages détiennent un LDDS", "note": "Détention d’au moins un LDDS, quel que soit son encours. Peut se cumuler avec les autres livrets.", "checkedAt": "2026-10-03"},
  {"id": "pel", "title": "Qui détient encore un PEL ?", "category": "Placements", "kind": "rate", "source": "holdings", "table": "Figure 2 : Plan épargne logement (PEL)", "value": 21.3, "unit": "%", "headline": "Le PEL a encore sa place", "metricLabel": "des ménages détiennent un PEL", "note": "Détention d’au moins un PEL, sans distinction de date d’ouverture, de taux ou de montant.", "checkedAt": "2026-10-03"},
  {"id": "retirement-savings", "title": "Une épargne pour la retraite", "category": "Placements", "kind": "rate", "source": "holdings", "table": "Figure 1a : Épargne retraite, 2024", "value": 19.1, "unit": "%", "headline": "Une épargne retraite pour une minorité", "metricLabel": "des ménages détiennent de l’épargne retraite", "note": "Épargne retraite au sens de l’enquête, pas uniquement le PER. Ne mesure pas les droits aux régimes obligatoires.", "checkedAt": "2026-10-03"},
  {"id": "employee-savings", "title": "Qui a de l’épargne salariale ?", "category": "Placements", "kind": "rate", "source": "holdings", "table": "Figure 2 : Épargne salariale", "value": 15.6, "unit": "%", "headline": "L’épargne salariale reste peu répandue", "metricLabel": "des ménages détiennent de l’épargne salariale", "note": "Taux calculé parmi tous les ménages, pas seulement les salariés ou les bénéficiaires d’un dispositif.", "checkedAt": "2026-10-03"},
  {"id": "cto", "title": "Qui détient un compte-titres ?", "category": "Placements", "kind": "rate", "source": "holdings", "table": "Texte : valeurs mobilières, compte-titres ordinaire", "value": 9.6, "unit": "%", "headline": "Le compte-titres reste minoritaire", "metricLabel": "des ménages détiennent un compte-titres ordinaire", "note": "Détention d’au moins un CTO, sans mesure des encours. Peut se cumuler avec un PEA ; ne mesure pas toute l’exposition aux actions.", "checkedAt": "2026-10-03"},
  {"id": "other-homes", "title": "Un logement en plus", "category": "Immobilier", "kind": "rate", "source": "holdings", "table": "Figure 1a : Autres logements, 2024", "value": 20.5, "unit": "%", "headline": "Un logement en plus de chez soi", "metricLabel": "des ménages possèdent un autre logement", "note": "Logement autre que la résidence principale : secondaire, vacant, loué ou mis à disposition gratuitement. Ne mesure pas uniquement l’investissement locatif.", "checkedAt": "2026-10-03"},
  {"id": "debt-types", "title": "Immobilier ou consommation ?", "category": "Crédit", "kind": "comparison", "source": "holdings", "table": "Figure 3c : Ensemble, immobilier et prêts à la consommation, corrigé le 10 décembre 2025", "value": 30, "unit": "%", "headline": "Deux crédits, deux réalités", "metricLabel": "Crédit immobilier", "note": "Deux taux parmi l’ensemble des ménages. Les crédits peuvent se cumuler. Valeurs corrigées le 10 décembre 2025.", "checkedAt": "2026-10-03", "secondValue": 24.5, "secondLabel": "Crédit consommation"},
  {"id": "heating", "title": "Chauffer suffisamment son logement", "category": "Niveau de vie", "kind": "rate", "source": "living", "table": "Figure 3 : Chauffer suffisamment leur logement", "value": 11.4, "unit": "%", "headline": "Se chauffer reste difficile", "metricLabel": "ne peuvent pas chauffer suffisamment leur logement", "note": "Impossibilité déclarée pour des raisons financières. Données provisoires. Personnes, et non ménages.", "checkedAt": "2026-10-03", "referencePeriod": "Début 2025", "population": "personnes", "provisional": true, "scope": "France métropolitaine, personnes vivant dans un logement ordinaire.", "visualNote": "Personnes en logement ordinaire. Difficulté financière déclarée. Données provisoires."},
  {"id": "bills-on-time", "title": "Payer les factures à temps", "category": "Niveau de vie", "kind": "rate", "source": "living", "table": "Figure 3 : Payer à temps les loyers, intérêts, factures", "value": 9.9, "unit": "%", "headline": "Quand les échéances deviennent un obstacle", "metricLabel": "ne peuvent pas payer leurs échéances à temps", "note": "Impossibilité déclarée pour des raisons financières. Données provisoires. Personnes, et non ménages.", "checkedAt": "2026-10-03", "referencePeriod": "Début 2025", "population": "personnes", "provisional": true, "scope": "France métropolitaine, personnes vivant dans un logement ordinaire.", "visualNote": "Personnes en logement ordinaire. Difficulté financière déclarée. Données provisoires."},
  {"id": "personal-spending", "title": "Une petite dépense pour soi", "category": "Niveau de vie", "kind": "rate", "source": "living", "table": "Figure 3 : Dépenser une petite somme librement", "value": 12.1, "unit": "%", "headline": "Une petite dépense reste hors de portée", "metricLabel": "ne peuvent pas dépenser une petite somme librement", "note": "Impossibilité déclarée pour des raisons financières. Données provisoires. Personnes, et non ménages.", "checkedAt": "2026-10-03", "referencePeriod": "Début 2025", "population": "personnes", "provisional": true, "scope": "France métropolitaine, personnes vivant dans un logement ordinaire.", "visualNote": "Personnes en logement ordinaire. Difficulté financière déclarée. Données provisoires."},
  {"id": "protein-meals", "title": "Des repas réguliers avec des protéines", "category": "Niveau de vie", "kind": "rate", "source": "living", "table": "Figure 3 : Manger de la viande, du poisson ou un équivalent végétarien tous les deux jours", "value": 11.2, "unit": "%", "headline": "Le budget touche aussi l’assiette", "metricLabel": "ne peuvent pas s’offrir un repas avec viande, poisson ou équivalent végétarien tous les deux jours", "note": "Impossibilité déclarée pour des raisons financières. Données provisoires. Personnes, et non ménages.", "checkedAt": "2026-10-03", "referencePeriod": "Début 2025", "population": "personnes", "provisional": true, "scope": "France métropolitaine, personnes vivant dans un logement ordinaire.", "visualNote": "Personnes en logement ordinaire. Difficulté financière déclarée. Données provisoires."},
].map(householdEditorial).map(record => householdObservation(record)).map((record) => {
  const period = record.referencePeriod ?? 'Début 2024'
  const fillPeriod = text => text?.replace(/Début 202[45]/g, '{period}').replace(/début 202[45]/g, '{periodLower}').replace(/En 2024/g, 'En {period}').replace(/en 2024/g, 'en {period}')
  const provision = text => record.provisional ? text : text?.replace(/Données provisoires\.?\s*/g, '').replace(/données provisoires\.?\s*/g, '')
  return Object.freeze({ ...record, headline: record.headline.replace('{value}', formatHouseholdNumber(record.value)),
    intro: fillPeriod(record.intro), body: provision(fillPeriod(record.body)), note: provision(record.note), visualNote: provision(record.visualNote),
    population: record.population ?? 'ménages', referencePeriod: period, metadata: Object.freeze({
  sourceUrls: [record.automatedEvidence?.sourceUrl ?? HOUSEHOLD_SOURCES[record.source].url], checkedAt: record.checkedAt ?? '2026-09-30', asOf: null, dateStatus: 'not-published',
  scope: record.scope ?? HOUSEHOLD_SCOPE, currency: record.unit === 'EUR' ? 'EUR' : null,
  method: `${record.source === 'living' ? 'Enquête Statistiques sur les ressources et conditions de vie.' : record.source === 'salaries' ? 'Base Tous salariés, salaires en équivalent temps plein.' : 'Enquête Histoire de vie et Patrimoine.'} Repère : ${record.table}.`,
  note: `Référence publiée : ${period}, sans jour exact. ${provision(record.note)}`,
}) }) }))
export function formatHouseholdNumber(value) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value) }
export function buildHouseholdTweet(record) {
  const replacements = { period: record.referencePeriod, periodLower: record.referencePeriod.toLocaleLowerCase('fr-FR'), value: formatHouseholdNumber(record.value), complement: formatHouseholdNumber(100 - record.value), rounded: Math.round(record.value), secondValue: formatHouseholdNumber(record.secondValue ?? 0), secondRounded: Math.round(record.secondValue ?? 0), dataStatus: record.provisional ? 'données provisoires' : 'données', provisionalNote: record.provisional ? 'Données provisoires.' : '' }
  const fill = (text) => text.replace(/\{(\w+)\}/g, (_, key) => replacements[key])
  return `${fill(record.intro)}\n\n${fill(record.body).trim()}\n\n${record.question}`
}
export function getHouseholdVisual(record) {
  if (record.kind === 'comparison') return [
    { label: record.metricLabel, count: Math.round(record.value), exact: `${formatHouseholdNumber(record.value)} %` },
    { label: record.secondLabel, count: Math.round(record.secondValue), exact: `${formatHouseholdNumber(record.secondValue)} %` },
  ]
  if (record.kind === 'share') return [{ label: '50 ménages les moins dotés', count: record.populationPercent, exact: `${formatHouseholdNumber(record.value)} % du patrimoine brut` }]
  if (record.kind === 'threshold') return [{ label: record.distributionLabel ?? (record.populationPercent === 10 ? 'Les 10 ménages les mieux dotés en patrimoine net' : 'La moitié sous le patrimoine net médian'), count: record.populationPercent, exact: `${formatHouseholdNumber(record.value)} €` }]
  return [{ label: record.metricLabel, count: Math.round(record.value), exact: `${formatHouseholdNumber(record.value)} %` }]
}
