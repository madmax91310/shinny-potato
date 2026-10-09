import observations from './automated-presentation-actors.json' with { type: 'json' }
// Qualitative actor presentations, manually checked against public official pages.
// These are not project subscriptions or automatically refreshed performance records.
export const ACTOR_FAMILIES = [
  ['private-equity', 'Private equity'], ['bovins', 'Bovins'], ['vignobles', 'Vignobles'],
  ['forets', 'Forêts et actifs naturels'], ['energie', 'Énergies renouvelables'],
  ['terres', 'Terres agricoles'], ['immobilier', 'Financement immobilier'], ['art', 'Art'],
].map(([id, label]) => ({ id, label }))
const actor = (id, name, family, data) => ({ id, name, family, checkedAt: '2026-10-09', editorialCheckedAt: '2026-10-09', verification: 'manual', ...data })
const MANUAL_ACTORS = [
  actor('fundora', 'Fundora', 'private-equity', {
    role: 'Plateforme d’accès au non coté', offer: 'Stratégies de private equity sous mandat',
    exposure: 'Entreprises non cotées, via des fonds professionnels', vehicle: 'Mandat de gestion avec Kyoseil AM ; accès indirect aux fonds',
    intro: 'Le private equity, c’est investir dans des entreprises qui ne sont pas cotées en Bourse. Fundora propose une porte d’entrée vers des fonds professionnels, avec une gestion sous mandat.',
    mechanism: 'Kyoseil AM sélectionne les investissements et mutualise les sommes confiées pour accéder aux fonds. La stratégie retenue détermine les entreprises et les fonds auxquels tu es exposé.',
    distinction: 'Le nom de la plateforme ne décrit pas à lui seul ton placement : il faut regarder le mandat, la stratégie et les fonds sous-jacents.',
    income: 'La création de valeur dépend des entreprises et des sorties réalisées par les fonds. Un objectif de rendement reste un objectif.',
    liquidity: 'Liquidité limitée ; calendrier de sortie et éventuels appels de fonds propres à la stratégie.',
    risks: 'Perte en capital, valorisations peu fréquentes, sélection des fonds et immobilisation de l’argent.',
    access: 'Ticket et frais à vérifier dans la documentation de la stratégie choisie.',
    highlights: [['Exposition', 'Non coté'], ['Accès', 'Mandat'], ['Liquidité', 'Limitée']],
    sources: [{ label: 'Fonctionnement, mandat et stratégies', url: 'https://www.fundora.fr/' }],
  }),
  actor('anaxago', 'Anaxago', 'private-equity', {
    role: 'Plateforme d’investissement', offer: 'Clubs deals et fonds de private equity',
    exposure: 'Entreprises non cotées, dont le capital-risque', vehicle: 'Clubs deals ou fonds selon l’offre',
    intro: 'Anaxago permet de s’exposer à des entreprises non cotées, à travers des opérations de co-investissement ou des fonds.',
    mechanism: 'Un club deal concentre l’investissement sur une opération. Un fonds peut répartir les capitaux entre plusieurs entreprises ou gérants. Le véhicule choisi change donc beaucoup la diversification.',
    distinction: 'Anaxago propose aussi des investissements immobiliers : leurs chiffres ne représentent pas la performance des offres de private equity.',
    income: 'Les gains éventuels dépendent de la croissance des entreprises et de leur cession ; ils ne sont pas assurés.',
    liquidity: 'Sortie dépendante de l’opération ou du fonds ; revente rapide non garantie.',
    risks: 'Perte en capital, échec d’une entreprise, concentration d’un club deal et illiquidité.',
    access: 'Ticket, frais et durée propres au club deal ou au fonds retenu.',
    highlights: [['Exposition', 'Non coté'], ['Offres', 'Fonds'], ['Autre accès', 'Club deals']],
    sources: [{ label: 'Private equity : fonctionnement et offres', url: 'https://www.anaxago.com/investir-private-equity' }],
  }),
  actor('mymarguerit', 'MyMarguerit', 'bovins', {
    role: 'Opérateur d’investissement en cheptel', offer: 'Bovins mis en location auprès d’éleveurs',
    exposure: 'Cheptel bovin en France', vehicle: 'Propriété de bovins avec gestion et location',
    intro: 'On peut aussi investir dans des bovins. Avec MyMarguerit, le fonctionnement présenté consiste à devenir propriétaire d’animaux qui sont ensuite loués à des éleveurs partenaires.',
    mechanism: 'L’opérateur organise la gestion du cheptel. L’éleveur utilise les animaux pour son activité ; l’investisseur est exposé à cette économie agricole.',
    distinction: 'L’actif présenté est le bovin. Ce n’est ni une part de terre agricole, ni une action de l’exploitation.',
    income: 'Les revenus dépendent du contrat et du fonctionnement du cheptel. Les projections commerciales ne sont pas des revenus garantis.',
    liquidity: 'Modalités de cession, délais et valorisation à vérifier dans le contrat.',
    risks: 'Perte en capital, risques sanitaires, renouvellement des animaux, exploitation et conditions de sortie.',
    access: 'Ticket, frais, assurance et traitement du renouvellement à qualifier dans les documents contractuels.',
    highlights: [['Actif détenu', 'Bovins'], ['Fonctionnement', 'Location'], ['Exposition', 'France']],
    sources: [{ label: 'Propriété, location et risques du cheptel', url: 'https://www.mymarguerit.com/' }],
  }),
  actor('bacchus', 'Bacchus Conseil', 'vignobles', {
    role: 'Spécialiste des groupements viticoles', offer: 'Parts de GFV / GFA viticoles',
    exposure: 'Foncier viticole via un groupement', vehicle: 'Parts d’un groupement foncier viticole ou agricole',
    intro: 'S’exposer à un vignoble peut passer par un groupement foncier. Bacchus Conseil présente des GFV et GFA viticoles, avec des offres rattachées à des domaines.',
    mechanism: 'Tu détiens des parts du groupement qui porte le foncier. Le domaine, l’exploitant et les conditions du groupement sont à examiner pour chaque offre.',
    distinction: 'Détenir des parts de foncier viticole ne revient pas à acheter des bouteilles pour spéculer sur leur prix.',
    income: 'Revenus et éventuelles dotations en vin dépendent du groupement et de ses conditions.',
    liquidity: 'Cession de parts dépendante d’un acquéreur et des règles du groupement.',
    risks: 'Perte en capital, aléas climatiques et sanitaires, exploitation, valorisation du foncier et faible liquidité.',
    access: 'Ticket, frais, bail et éventuelles dotations à vérifier dans le dossier du domaine.',
    highlights: [['Véhicule', 'GFV / GFA'], ['Exposition', 'Vignobles'], ['Détention', 'Parts']],
    sources: [{ label: 'Groupements et domaines présentés', url: 'https://bacchusconseil.com/gfv-gfa/' }, { label: 'Parcours investisseur', url: 'https://bacchusconseil.com/investir/' }],
  }),
  actor('france-valley', 'France Valley', 'forets', {
    role: 'Société de gestion d’actifs naturels', offer: 'GFI et fonds viticoles ou agricoles',
    exposure: 'Forêts, vignes et terres agricoles selon le fonds', vehicle: 'Parts de groupements ou de fonds ; forme propre à chaque produit',
    intro: 'France Valley propose des investissements dans des actifs naturels : forêts, vignes et terres agricoles. Chaque fonds a son propre patrimoine et ses propres conditions.',
    mechanism: 'Tu souscris des parts d’un véhicule qui porte les actifs. Pour les forêts, la société présente notamment des groupements forestiers d’investissement, les GFI.',
    distinction: 'Un indice de performance de toute la classe d’actifs forestiers ne représente pas le rendement d’un fonds France Valley.',
    income: 'Les revenus et la valeur des parts dépendent de l’exploitation et de la valeur des actifs détenus.',
    liquidity: 'Liquidité non garantie ; la page officielle recommande d’envisager ces actifs sur au moins dix ans.',
    risks: 'Perte en capital, blocage des parts, incendie, tempête, gel et risques phytosanitaires.',
    access: 'Minimum et frais à vérifier fonds par fonds ; aucun ticket commun à tous les produits n’est retenu ici.',
    highlights: [['Offre forestière', 'GFI'], ['Actifs', 'Naturels'], ['Horizon annoncé', '≥ 10 ans']],
    sources: [{ label: 'Produits, fonctionnement et risques', url: 'https://www.france-valley.com/' }],
  }),
  actor('enerfip', 'Enerfip', 'energie', {
    role: 'Plateforme de financement participatif', offer: 'Financement de projets de transition énergétique',
    exposure: 'Énergies renouvelables, efficacité énergétique et mobilité durable', vehicle: 'Titres du projet ; notamment obligations simples selon l’opération',
    intro: 'Enerfip met en relation des investisseurs et des porteurs de projets liés à la transition énergétique. Le ticket annoncé commence à 10 €.',
    mechanism: 'Tu choisis une opération et souscris les titres proposés. Les exemples officiels comprennent des obligations simples : tu finances alors un émetteur qui doit te rembourser selon un échéancier.',
    distinction: 'Financer un projet énergétique ne donne pas automatiquement la propriété de panneaux solaires ou d’une éolienne.',
    income: 'Taux, échéances et modalités de paiement propres au projet. Les intérêts annoncés et le remboursement peuvent ne pas être reçus.',
    liquidity: 'Durée et possibilités de sortie à lire dans les documents de l’opération.',
    risks: 'Perte en capital, défaillance de l’émetteur, retard du projet et illiquidité.',
    access: 'À partir de 10 € annoncés par la plateforme ; frais et éligibilité à vérifier pour chaque projet.',
    highlights: [['Accès annoncé', 'Dès 10 €'], ['Financement', 'Projets'], ['Exposition', 'Énergie']],
    sources: [{ label: 'Accès et exemples d’instruments', url: 'https://www.enerfip.eu/fr' }],
  }),
  actor('hectarea', 'Hectarea', 'terres', {
    role: 'Acteur du financement foncier agricole', offer: 'Obligations adossées au foncier agricole',
    exposure: 'Terres agricoles louées à des exploitants', vehicle: 'Obligations de la foncière propriétaire du terrain',
    intro: 'Hectarea permet de financer des terres agricoles à partir de 100 € annoncés. Pour l’offre présentée ici, l’investisseur souscrit une obligation.',
    mechanism: 'La foncière détient le terrain et le loue à l’agriculteur par un bail rural. L’investisseur finance la partie foncière, sans investir dans la société d’exploitation.',
    distinction: 'Une obligation de la foncière est une créance : tu ne détiens pas directement une parcelle et tu n’es pas actionnaire de la ferme.',
    income: 'Les intérêts et le remboursement suivent le contrat obligataire, avec un risque de non-paiement.',
    liquidity: 'Échéance et éventuelle sortie anticipée propres au contrat ; liquidité non garantie.',
    risks: 'Perte en capital, défaillance de la foncière, valeur du terrain et illiquidité.',
    access: 'À partir de 100 € pour les projets présentés ; frais et durée à lire dans les documents du projet.',
    highlights: [['Accès annoncé', 'Dès 100 €'], ['Instrument', 'Obligations'], ['Sous-jacent', 'Terres']],
    sources: [{ label: 'Obligations, foncière, bail et minimum', url: 'https://app.hectarea.io/club/investir/' }],
  }),
  actor('bricks', 'Bricks', 'immobilier', {
    role: 'Plateforme de financement participatif immobilier', offer: 'Obligations de projets immobiliers',
    exposure: 'Financement de projets immobiliers', vehicle: 'Obligations émises par les porteurs de projets',
    intro: 'Bricks propose de financer des projets immobiliers dès 10 € annoncés. L’offre obligataire permet de prêter de l’argent à un porteur de projet.',
    mechanism: 'L’émetteur utilise le financement pour son opération et prévoit des intérêts et un remboursement. Le calendrier et les garanties éventuelles sont propres au dossier.',
    distinction: 'Tu es créancier de l’émetteur. Tu ne détiens pas des parts de SCPI et tu n’achètes pas directement une fraction d’immeuble.',
    income: 'Les intérêts annoncés ne sont pas garantis ; le remboursement dépend de l’émetteur et de l’opération.',
    liquidity: 'Pas de sortie immédiate garantie ; conditions de cession à vérifier par opération.',
    risks: 'Perte en capital, retards, défaut de remboursement et concentration sur quelques projets.',
    access: 'À partir de 10 € annoncés ; frais, échéancier et sûretés à vérifier dans la fiche du projet.',
    highlights: [['Accès annoncé', 'Dès 10 €'], ['Instrument', 'Obligations'], ['Financement', 'Immobilier']],
    sources: [{ label: 'Accès, obligations et risques', url: 'https://www.bricks.co/' }],
  }),
  actor('matis', 'Matis', 'art', {
    role: 'Opérateur de co-investissement dans l’art', offer: 'Offres par œuvre via une société projet',
    exposure: 'Œuvres d’art sélectionnées pour leur revente', vehicle: 'Obligations convertibles de la société projet',
    intro: 'Matis permet de s’exposer à des œuvres d’art à travers des offres de co-investissement. La page française annonce un accès à partir de 20 000 €.',
    mechanism: 'Une société projet est créée pour l’œuvre. Les investisseurs souscrivent des obligations convertibles ; Matis organise la sélection et confie les œuvres à des galeries en vue d’une revente.',
    distinction: 'Tu détiens un titre de la société projet : cela ne signifie pas que tu peux disposer personnellement du tableau.',
    income: 'Le résultat dépend notamment du prix de revente et des conditions du titre. La plus-value est non garantie.',
    liquidity: 'Horizon cible de revente annoncé de 24 mois : c’est une cible, pas une échéance de remboursement garantie.',
    risks: 'Perte en capital, prix de revente, frais, concentration sur une œuvre et absence de revente au moment attendu.',
    access: 'À partir de 20 000 € annoncés ; frais et clauses de conversion propres à l’offre.',
    highlights: [['Accès annoncé', '20 000 €'], ['Instrument', 'Oblig. conv.'], ['Horizon cible', '24 mois']],
    sources: [{ label: 'Offre française, titres, ticket et horizon cible', url: 'https://www.matis.club/comment-investir' }],
  }),
]
const offerCache = new WeakMap()
export function applyActorOffer(record, offerId = record.offers?.[0]?.id) {
  const selected = record.offers?.find(row => row.id === offerId)
  if (!selected || record.selectedOffer?.id === offerId) return record
  const cached = offerCache.get(record)?.get(offerId)
  if (cached) return cached
  const result = { ...record, ...selected.presentation, selectedOffer: selected, offer: selected.name, access: selected.fields.access.value,
    income: selected.fields.income.value, liquidity: selected.fields.exit.value,
    highlights: selected.highlights, checkedAt: observations[record.id]?.checkedAt ?? record.checkedAt,
    verification: 'public-terms',
    sources: [...new Map([...record.sources, ...Object.values(selected.fields).flatMap(field => (field.sourceUrls ?? [field.sourceUrl]).map(url => ({ label: 'Conditions publiques de l’offre', url })))].map(source => [source.url, source])).values()] }
  const cache = offerCache.get(record) ?? new Map()
  cache.set(offerId, result); offerCache.set(record, cache)
  return result
}
export const PRESENTATION_ACTORS = MANUAL_ACTORS.map(record => applyActorOffer({ ...record,
  // Editorial explanation remains manual; only offer terms are collected.
  intro: record.intro.replace(/ La page française annonce.*$/, '').replace(/ Le ticket annoncé commence.*$/, '').replace(/ à partir de 100 € annoncés/, '').replace(/ dès 10 € annoncés/, ''),
  offers: observations[record.id]?.offers ?? [],
}))
export const familyLabel = id => ACTOR_FAMILIES.find(row => row.id === id)?.label ?? id
const actorQuestions = {
  'private-equity': 'Tu envisagerais d’investir dans le non coté, ou tu préfères rester en Bourse ?',
  bovins: 'Tu savais qu’on pouvait investir dans des bovins ?',
  vignobles: 'Tu envisagerais de détenir des parts d’un vignoble ?',
  forets: 'Les forêts ont-elles une place dans ton épargne ?',
  energie: 'Tu as déjà financé un projet d’énergie renouvelable ?',
  terres: 'Tu envisagerais de financer des terres agricoles ?',
  immobilier: 'Tu as déjà prêté de l’argent pour financer un projet immobilier ?',
  art: 'Tu envisagerais d’investir dans une œuvre d’art ?',
}
export function buildActorTweet(record) {
  return [
    `${record.intro}\n\nVoici les détails 👇`,
    `📄 L’offre présentée : ${record.offer}.\n${record.name} — ${record.role}.`,
    ...(record.selectedOffer?.availability?.status === 'closed' ? [`📌 Souscriptions clôturées le ${record.selectedOffer.availability.asOf.split('-').reverse().join('/')}. Cette présentation décrit l’offre publiée ; elle ne permet pas de souscrire aujourd’hui.`] : []),
    `⚙️ Comment ça fonctionne ?\n${record.mechanism}`,
    `📦 Ce que tu détiens\n${record.vehicle}.\n${record.distinction}`,
    `💶 Pour commencer\n${record.access}`,
    `💰 D’où peuvent venir les revenus ?\n${record.income}`,
    ...(record.selectedOffer ? [
      `💸 Ce que l’offre coûte\n${record.selectedOffer.fields.fees.value}`,
      `⏳ Combien de temps prévoir ?\n${record.selectedOffer.fields.duration.value}`,
    ] : []),
    `🚪 Si tu veux récupérer ton argent\n${record.liquidity}`,
    ...(record.selectedOffer ? [
      `🔎 Avant d’investir, voici ce qu’il reste à vérifier\n${record.selectedOffer.scope}\nÀ compléter : ${record.selectedOffer.missing.join(' ; ')}.`,
      ...record.selectedOffer.warnings.map(warning => `🔎 Point à confirmer\n${warning}`),
    ] : []),
    `⚠️ Les risques à comprendre\n${record.risks}\nLe capital et les revenus ne sont pas garantis.`,
    `📌 Ces informations concernent l’offre présentée. ${record.selectedOffer?.availability?.status === 'closed' ? 'Les souscriptions sont clôturées ; consulte ses documents pour comprendre les conditions présentées.' : 'Vérifie qu’elle est ouverte à la souscription et demande ses documents contractuels.'} Les coûts non publiés et les performances réalisées ne sont pas qualifiés dans cette fiche.`,
    `📚 Sources officielles consultées le ${record.checkedAt.split('-').reverse().join('/')} :\n${record.sources.map(row => row.url).join('\n')}`,
    `💬 ${actorQuestions[record.family] ?? 'Tu connaissais ce type de placement ?'}`,
  ].join('\n\n')
}
