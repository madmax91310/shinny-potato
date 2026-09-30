// Valeurs publiées, jamais estimées à partir de moyennes. « Début 2024 » n'est pas une date au jour près.
export const HOUSEHOLD_SOURCES = Object.freeze({
  wealth: { title: 'Les montants de patrimoine détenus par les ménages en 2024', url: 'https://www.insee.fr/fr/statistiques/8672665', publishedAt: '2025-12-09' },
  holdings: { title: 'La détention de patrimoine des ménages en 2024', url: 'https://www.insee.fr/fr/statistiques/8569009', publishedAt: '2025-05-14', correctedAt: '2025-12-10' },
  transmissions: { title: 'Transmissions intergénérationnelles en 2024', url: 'https://www.insee.fr/fr/statistiques/8960217', publishedAt: '2026-04-07' },
})
export const HOUSEHOLD_SCOPE = 'France hors Mayotte, ménages vivant dans un logement ordinaire.'
export const HOUSEHOLD_STATISTICS = Object.freeze([
  { id: 'wealth-share', title: 'Qui possède le patrimoine ?', category: 'Patrimoine', kind: 'share', source: 'wealth', table: 'Le patrimoine est très inégalement réparti', value: 7, unit: '%', populationPercent: 50,
    headline: '50 ménages se partagent 7 % du patrimoine', metricLabel: 'du patrimoine brut pour la moitié la moins dotée',
    note: 'Patrimoine brut : immobilier, financier, professionnel et résiduel, avant déduction des emprunts. Les deux moitiés sont classées par patrimoine brut.',
    question: 'Ces écarts te surprennent ?',
    intro: '🇫🇷 Imagine 100 ménages et tout leur patrimoine mis en commun.',
    body: 'Les 50 les moins dotés se partageraient seulement {value} % du total.\n\nLes 50 autres en posséderaient {complement} %.\n\n🏠 On parle ici de patrimoine brut : immobilier, placements, biens professionnels… avant déduction des dettes.\n\nQuand on parle du « patrimoine des Français », cette répartition mérite d’être regardée.' },
  { id: 'wealth-top10', title: 'Le seuil des 10 %', category: 'Patrimoine', kind: 'threshold', source: 'wealth', table: 'Figure 1 : patrimoine net, D9', value: 750400, unit: 'EUR', populationPercent: 10,
    headline: 'Le seuil pour entrer dans les 10 %', metricLabel: 'de patrimoine net, dettes déduites',
    note: 'Seuil du neuvième décile de patrimoine net. Le classement net est distinct du classement brut. Les biens immobiliers et les autres actifs sont inclus.',
    question: 'Tu aurais imaginé un seuil plus haut ou plus bas ?',
    intro: '💰 Combien faut-il posséder pour faire partie des 10 % de ménages les mieux dotés en France ?',
    body: '{value} € de patrimoine net.\n\n🏠 Immobilier, placements et autres biens sont comptés, puis les dettes sont déduites.\n\nCe n’est donc ni un salaire, ni une somme disponible sur un compte bancaire.' },
  { id: 'wealth-median', title: 'Le patrimoine médian', category: 'Patrimoine', kind: 'threshold', source: 'wealth', table: 'Figure 1 : patrimoine net, médiane D5', value: 148100, unit: 'EUR', populationPercent: 50,
    headline: 'Le montant qui sépare les ménages en deux', metricLabel: 'de patrimoine net médian',
    note: 'Médiane du patrimoine net, après déduction des emprunts. Ce montant ne correspond pas à l’épargne disponible.',
    question: 'Et toi, quel chiffre avais-tu en tête ?',
    intro: '👀 {value} € : c’est le montant qui sépare les ménages français en deux.',
    body: 'La moitié possède moins de patrimoine net.\nL’autre moitié possède davantage.\n\n🏠 Ce montant comprend les biens immobiliers, les placements et les autres biens, après déduction des dettes.\n\nIl ne correspond pas à l’épargne disponible.' },
  { id: 'pea', title: 'Qui détient un PEA ?', category: 'Placements', kind: 'rate', source: 'holdings', table: 'Texte : détention des valeurs mobilières, PEA', value: 9.8, unit: '%',
    headline: 'Le PEA est-il vraiment partout ?', metricLabel: 'des ménages détiennent un PEA', note: 'Détention d’au moins un PEA par le ménage, quel que soit l’encours. Ce taux ne mesure pas toute l’exposition aux actions.',
    question: 'Avant de comparer les ETF, combien de personnes connaissent déjà cette enveloppe ?',
    intro: '📱 Ton fil X peut donner l’impression que le PEA est partout.',
    body: 'En France, seulement {value} % des ménages en détiennent un.\n\nSur 100 ménages, cela représente environ {rounded}.\n\n👀 Nos discussions entre investisseurs donnent une vision très particulière de l’épargne.' },
  { id: 'livret-assurance', title: 'Livret A et assurance-vie', category: 'Placements', kind: 'comparison', source: 'holdings', table: 'Figure 2 : Livret A ou Bleu, assurance-vie', value: 78.1, secondValue: 41.7, unit: '%',
    headline: 'Deux placements, deux réalités', metricLabel: 'Livret A ou Bleu', secondLabel: 'Assurance-vie', note: 'Les détentions peuvent se cumuler. Deux grilles indépendantes : elles ne représentent pas des groupes exclusifs.',
    question: 'Quel chiffre te surprend le plus ?',
    intro: '💶 Le Livret A et l’assurance-vie sont connus de tous. Mais combien de ménages en possèdent vraiment ?',
    body: 'Sur 100 ménages, environ :\n\n🏦 {rounded} détiennent un Livret A ou Bleu.\n📁 {secondRounded} détiennent une assurance-vie.\n\nUn même ménage peut évidemment avoir les deux.' },
  { id: 'homeowners', title: 'La résidence principale', category: 'Immobilier', kind: 'rate', source: 'holdings', table: 'Figure 1a : résidence principale, 2024', value: 57.2, unit: '%',
    headline: 'Tous propriétaires ? Pas vraiment.', metricLabel: 'propriétaires de leur résidence principale', note: 'Usufruitiers inclus. Toutes générations confondues ; ne pas interpréter ce taux comme celui des jeunes ménages.',
    question: 'La propriété reste-t-elle un objectif pour toi ?',
    intro: '🏠 Être propriétaire semble parfois être une étape que tout le monde finit par franchir.',
    body: 'Pourtant, sur 100 ménages français, environ {rounded} sont propriétaires de leur résidence principale, usufruitiers inclus.\n\nCe chiffre rassemble toutes les générations.\n\nIl ne raconte donc pas, à lui seul, la situation des jeunes qui cherchent à acheter.' },
  { id: 'debt', title: 'Qui rembourse un crédit ?', category: 'Crédit', kind: 'rate', source: 'holdings', table: 'Figure 1a : endettement, 2024, corrigé le 10 décembre 2025', value: 45.6, unit: '%',
    headline: 'Presque un ménage sur deux a un crédit', metricLabel: 'des ménages ont un emprunt en cours', note: 'Endettement privé ou professionnel. Valeur corrigée par l’Insee le 10 décembre 2025. Le taux ne mesure pas le surendettement.',
    question: 'Quand tu compares des patrimoines, regardes-tu aussi les dettes ?',
    intro: '💳 Presque un ménage sur deux rembourse un crédit en France.',
    body: '{value} % ont un emprunt en cours.\n\n🏠 Immobilier, consommation ou activité professionnelle : derrière ce chiffre, les situations sont très différentes.\n\nPosséder un bien ne dit pas combien il reste à rembourser.' },
  { id: 'inheritance', title: 'Qui a déjà hérité ?', category: 'Transmission', kind: 'rate', source: 'transmissions', table: 'Début 2024, 41 % des ménages ont déjà hérité', value: 41, unit: '%',
    headline: 'Hériter : exceptionnel ou fréquent ?', metricLabel: 'des ménages ont déjà reçu un héritage', note: 'Au moins un membre du ménage a hérité au cours de sa vie. Ce taux ne renseigne ni le montant, ni l’âge à la réception, ni un effet causal sur le patrimoine.',
    question: 'Parle-t-on suffisamment de l’héritage quand on raconte sa réussite financière ?',
    intro: '🧬 Sur 100 ménages français, {rounded} ont déjà reçu un héritage.',
    body: 'Cela signifie qu’au moins un membre du ménage a hérité de biens ou d’argent au cours de sa vie.\n\nLe chiffre ne dit ni combien, ni à quel âge.\n\nMais il mérite une place dans les discussions sur la construction du patrimoine.' },
  { id: 'donation', title: 'Qui a reçu une donation ?', category: 'Transmission', kind: 'rate', source: 'transmissions', table: 'Les donations sont plus rares', value: 20, unit: '%',
    headline: 'Le coup de pouce familial en chiffres', metricLabel: 'des ménages ont reçu une donation déclarée', note: 'Donation déclarée devant un notaire, un avocat ou à l’administration fiscale, reçue par au moins un membre au cours de sa vie. Ne recense pas tous les coups de pouce familiaux.',
    question: 'Devrait-on davantage les évoquer quand on présente son parcours patrimonial ?',
    intro: '🎁 Un patrimoine peut aussi se construire avec de l’argent transmis du vivant des proches.',
    body: 'En France, {value} % des ménages ont déjà reçu une donation déclarée.\n\nSur 100 ménages, cela représente {rounded}.\n\n👀 On parle souvent du salaire et de l’effort d’épargne. Les transmissions familiales font aussi partie de l’histoire.' },
].map((record) => Object.freeze({ ...record, referencePeriod: 'Début 2024', metadata: Object.freeze({
  sourceUrls: [HOUSEHOLD_SOURCES[record.source].url], checkedAt: '2026-09-30', asOf: null, dateStatus: 'not-published',
  scope: HOUSEHOLD_SCOPE, currency: record.unit === 'EUR' ? 'EUR' : null,
  method: `Enquête Histoire de vie et Patrimoine 2023-2024. Repère : ${record.table}.`,
  note: `Référence publiée : début 2024, sans jour exact. ${record.note}`,
}) })))
export const formatHouseholdNumber = (value) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
export function buildHouseholdTweet(record, { includeUrl = true } = {}) {
  const replacements = { value: formatHouseholdNumber(record.value), complement: formatHouseholdNumber(100 - record.value), rounded: Math.round(record.value), secondRounded: Math.round(record.secondValue ?? 0) }
  const fill = (text) => text.replace(/\{(\w+)\}/g, (_, key) => replacements[key])
  const source = HOUSEHOLD_SOURCES[record.source]
  return `${fill(record.intro)}\n\n${fill(record.body)}\n\n${record.question}\n\n📚 Insee, données début 2024.${includeUrl ? `\n${source.url}` : ''}`
}
export function getHouseholdVisual(record) {
  if (record.kind === 'comparison') return [
    { label: record.metricLabel, count: Math.round(record.value), exact: `${formatHouseholdNumber(record.value)} %` },
    { label: record.secondLabel, count: Math.round(record.secondValue), exact: `${formatHouseholdNumber(record.secondValue)} %` },
  ]
  if (record.kind === 'share') return [{ label: '50 ménages les moins dotés', count: record.populationPercent, exact: `${formatHouseholdNumber(record.value)} % du patrimoine brut` }]
  if (record.kind === 'threshold') return [{ label: record.populationPercent === 10 ? 'Les 10 ménages les mieux dotés en patrimoine net' : 'La moitié sous le patrimoine net médian', count: record.populationPercent, exact: `${formatHouseholdNumber(record.value)} €` }]
  return [{ label: record.metricLabel, count: Math.round(record.value), exact: `${formatHouseholdNumber(record.value)} %` }]
}
