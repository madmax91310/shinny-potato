// Public wording and symbols only: source categories and financial rows stay intact.
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const symbols = {
  income: '💶', business: '💼', housing: '🏠', energy: '⚡', food: '🛒', transport: '🚗',
  education: '📚', child: '🎨', bills: '📱', health: '🩺', clothing: '👕', insurance: '🛡️',
  pets: '🐾', childcare: '👪', care: '🧼', hair: '💇', media: '🎬', music: '🎵', digital: '💻', tax: '🏛️', gift: '🎁', dining: '🍽️', leisure: '🎟️', investment: '📈', savings: '💰', debt: '💳', other: '🧾',
}
export function budgetRowSymbol(row, section = 'expenses') {
  const label = normalize(row.label)
  let kind
  if (section === 'income') {
    kind = /salaire|astreinte|remuneration/.test(label) && !/heritage|dividende|ventes/.test(label) ? 'business' : 'income'
  } else if (section === 'savings') {
    kind = /remboursement|dette/.test(label) ? 'debt' : /entreprise/.test(label) ? 'business' : /provision|enveloppe.*(vacances|rentree)/.test(label) ? 'other' : /^(reserve|livret|ldds|fonds.*(urgence|precaution|securite))/.test(label) ? 'savings' :
      /\bpea\b|epargne.pension|\bcto\b|etf|bitcoin|bricks|crypto|placements?|invest|pilier|assurance.vie|\bper\b|fonds/.test(label) ? 'investment' : /epargne|apport|projets|precaution/.test(label) ? 'savings' : 'other'
  } else {
    const rules = [
      ['other', /telephone.*sante|sante.*telephone|automobile.*telephone/], ['housing', /loyer|logement|hypothe|immobilier|copropriet|habitation/],
      ['energy', /energie|electric|chauffage|\bgaz\b|\beau\b/], ['insurance', /assurance scolaire|prevoyance|protection juridique/], ['education', /ecole|scolai|\bcours\b|etudes|formation/],
      ['child', /activites.*enfant/], ['clothing', /vetement|habillement|chaussure/],
      ['hair', /^(coiffeur|coiffeuse|coiffure)( et soins.*)?$/], ['health', /sante|soins|maladie|lamal|mutuelle|dentair|optique|pharmacie/], ['tax', /impot|taxe|precompte/],
      ['bills', /telephone|telecom|internet|\bmobiles?\b/], ['transport', /voiture|auto|carburant|moto|transport|train|deplacement/],
      ['insurance', /assurance|responsabilite civile/], ['food', /courses|aliment|nourriture/],
      ['gift', /cadeau/], ['dining', /restaurant|restauration/], ['pets', /chien|animaux|veterinaire/], ['childcare', /creche|garde.*enfant|enfants et garde/], ['care', /manucure|maquillage|hygiene|menagers|menage|produits d.entretien|pressing/], ['music', /spotify|musique/], ['media', /streaming|netflix|disney|canal\+|amazon prime|medias/], ['digital', /icloud|google drive|logiciels|electronique/], ['leisure', /loisir|vacances|sortie|sport|activite|voyage/], ['debt', /dette|remboursement|credit|\bpret\b/],
    ]
    kind = rules.find(([, pattern]) => pattern.test(label))?.[0] || (row.category === 'bills' ? 'other' : row.category) || 'other'
  }
  return { kind: Object.hasOwn(symbols, kind) ? kind : 'other', emoji: symbols[kind] || symbols.other }
}
export function budgetQualification(profile) {
  if (profile.kind === 'participant') return ''
  return profile.kind === 'planned' || profile.completion?.forecast ? 'Budget prévu' : ''
}
export function budgetPublicContext(value) {
  return value.replace(/(^| · )budget personnel(?: avec |\.?(?: · |$))/gi, '$1').replace(/ · $/, '')
}
export function budgetPublicBasis(profile, basis) {
  const result = budgetSalaryLabel(basis.replace(/Moyennes\s+20\d{2}/g, 'Moyennes').replace(/(net moyen)\s+20\d{2}\b/gi, '$1').replace(/^Net (?:après impôts?(?: et cotisations)?|de cotisations, avant impôts?)\s*(?:·\s*)?/i, ''))
  return result
}
export function budgetSalaryLabel(label) {
  if (!/\bsalaires?\b/i.test(label)) return label
  return label.replace(/\s+nets?\b/gi, '').replace(/\s+(?:(?:après|avant)\s+(?:impôts?|prélèvement à la source)(?: et cotisations)?|d[’']impôts?)/gi, '').replace(/\s+déclarés?\b/gi, '')
}
export function budgetIntroduction(profile, p) {
  const qualification = budgetQualification(profile)
  const h = normalize(p.household)
  const family = /mere celibataire/.test(h) ? '👩‍👧' : /enfant|filles|fils/.test(h) && !/sans enfant|projet d.enfant|avant.*naissance/.test(h) ? '👪' : /couple|adultes|marie|concubin/.test(h) ? '👥' : /locataire|proprietaire|heberge|loge/.test(h) ? '🏠' : '👤'
  const introduction = [p.job && `💼 ${p.job}`, p.household && `${family} ${p.household.replace(/ · (?=(?:un|deux|trois) enfants?)/g, ', ')}`, p.location && `📍 ${p.location}`].filter(Boolean)
  if (qualification && !normalize(introduction.join(' ')).includes(normalize(qualification))) introduction[0] = introduction[0] ? `${introduction[0]} · ${qualification.toLowerCase()}` : `👤 ${qualification}`
  return introduction.join('\n')
}
export function budgetTransfers(profile, heading = 'Versements') {
  const n = normalize(heading)
  const kinds = profile.savings.map(row => budgetRowSymbol(row, 'savings').kind)
  const nature = /entreprise/.test(n) ? 'financement de son entreprise' : /provision/.test(n) ? 'versements' :
    /epargne/.test(n) && /invest|placement/.test(n) ? 'épargne et investissements' : /epargne/.test(n) ? 'épargne' :
      /invest|placement/.test(n) ? 'investissements' : kinds.length && kinds.every(k => k === 'investment') ? 'investissements' :
        kinds.length && kinds.every(k => k === 'savings') ? 'épargne' : kinds.length && kinds.every(k => k === 'debt') ? 'remboursements' : kinds.length && kinds.every(k => k === 'business') ? 'financement d’entreprise' : 'versements'
  if (heading === 'Versements') heading = nature[0].toUpperCase() + nature.slice(1)
  const key = nature.includes('entreprise') ? 'business' : nature === 'investissements' ? 'investment' : nature === 'remboursements' ? 'debt' : nature.includes('épargne') ? 'savings' : 'other'
  const purpose = value => normalize(value).replace(/[’']/g, ' ').replace(/\b(epargne|reserves?|versements?|les?|la|des?|du|pour|d|un|une|et)\b/g, ' ').trim().split(/\s+/).sort().join(' ')
  const single = profile.savings.length === 1 && purpose(profile.savings[0].label) === purpose(heading)
  return { heading, emoji: symbols[key], kind: key, single, before: `Reste avant ${nature}`, after: `Reste après ${nature}` }
}
export function budgetGeneralQuestion(profile, question) {
  const name = profile.name
  const owner = / et /.test(name) ? 'leur' : /^(un |une )/.test(name) ? 'ce' : 'son'
  return question.replace('cet exemple de budget', `${owner} budget`).replace('Ce budget prévu', 'Ce budget').replace(/budget personnel/gi, 'budget')
}
