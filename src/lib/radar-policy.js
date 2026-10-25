// Editorial scope only. Never changes the shared financial registers.
export const normalizeEditorial = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[’']/g, ' ')
export const RADAR_TOPICS = {
  banques: 'Banques et services', frais: 'Frais bancaires', credit: 'Crédit immobilier et PTZ', immobilier: 'Marché immobilier', location: 'Règles de location', statistiques: 'Statistiques des ménages', epargne: 'Épargne et placements', etf: 'ETF', energie: 'Électricité et gaz', carburants: 'Carburants', securite: 'Sécurité de l’argent', travail: 'Épargne salariale et salaires',
}
const excluded = /\bimpots?\b|fiscali|\btaxes?\b|taxe fonciere|prelevement a la source|loi de finances|budget 20\d\d|\bplf(?:ss)?\b|prestations? sociales?|allocations?|\bapl\b|\brsa\b|prime d activite|aides? au logement|cheque energie|maprimerenov|aides? sociales?|bourses? (?:etudiant|scolaire)|pensions? de retraite|revalorisation des retraites/
export function editorialExclusion(event) {
  const title = normalizeEditorial(event.label ?? event.title ?? event.value?.title)
  // The principal subject controls scope. Incidental taxes/benefits in a
  // statistical study or a TTC price convention do not change that subject.
  return excluded.test(title) ? 'Hors périmètre : fiscalité, prestations sociales ou aides au logement.' : null
}
export function editorialTopic(title, summary = '') {
  if (editorialExclusion({label:title})) return null
  const t = normalizeEditorial(title), s = normalizeEditorial(summary)
  if (/\b(?:entreprises?|professionnels?)\b/.test(t) && !/salarie|particulier|menage|foyer|consommateur|epargne salariale/.test(t)) return null
  const rules = [
    ['securite', /arnaqu|escroqu|fraude bancaire|met(?:tent)? en garde|mise en garde|alerte.*epargn|remboursement.*fraude|protection.*depos|usurpation/],
    ['carburants', /carburants?|gazole|gasoil|sans.plomb|cout a la pompe/],
    ['energie', /electricite|\bgaz\b|heures creuses|heures pleines|tarifs? reglementes?|factures? d energie/],
    ['etf', /\betfs?\b|\bucits\b/],
    ['travail', /salaires?|remunerations?|\bsmic\b|epargne salariale|interessement|participation salariale|\bpee\b|per collectif|retraite collective/],
    ['frais', /frais bancaires|frais de courtage|tarifs? bancaires|tenue de compte|frais de change|commissions? de courtage/],
    ['credit', /credit.*(?:immobilier|habitat)|taux.*(?:emprunt|immobilier)|assurance emprunteur|\bptz\b|pret a taux zero/],
    ['location', /loyers?|location|bailleurs?|locataires?|garantie locative/],
    ['immobilier', /immobili|prix au m|transactions.*logement|logements? anciens|logements? neufs/],
    ['statistiques', /niveaux? de vie|patrimoine|inegalites?|inflation|prix a la consommation|pauvrete|epargne des menages/],
    ['epargne', /fonds en euros|livrets?|epargne|assurance.vie|\bpea\b|compte.titres|liquidites/],
    ['banques', /wero|offre bourse|matrimoine|credit mutuel|\bcic\b|caisse d epargne|banqu|revolut|boursobank|fortuneo|bourse direct|trade republic|\bxtb\b|carte bancaire|neobanque/],
  ]
  return rules.find(([,pattern]) => pattern.test(t))?.[0] ?? (/(?:montant|taux|frais|tarif|€|euros|rembours)/.test(s) ? rules.find(([,pattern]) => pattern.test(s))?.[0] : null) ?? null
}
export const frenchRevolutScope = (title,summary) => /france|french|francais/.test(normalizeEditorial(title)) || /french (?:customers|clients|residents)|clients? (?:francais|en france)|(?:disponible|lance|offre).{0,50}en france/.test(normalizeEditorial(summary))
export function consumerQuality(event, now = Date.now()) {
  const reasons = []
  if (/^https:\/\/www\.revolut\.com\/fr-FR\/news\//.test(event.sourceUrl??'') && !frenchRevolutScope(event.label,event.summary)) reasons.push('Portée française de l’annonce Revolut non documentée')
  const change=qualifiedOfferChange(event,now)
  if (event.publishedAt ? !Number.isFinite(Date.parse(event.publishedAt)) || Date.parse(event.publishedAt) > now : !change) reasons.push('Date de publication absente ou future ; aucun changement entre deux versions qualifié')
  if (!event.evidence?.sourceHash || !event.evidence?.excerpt) reasons.push('Preuve d’extraction absente')
  if (!event.populationScope || !event.summary) reasons.push('Public ou fait non documenté')
  if (!['official', 'professional-association', 'journalistic'].includes(event.evidenceLevel)) reasons.push('Niveau de preuve non qualifié')
  if (event.promotionEndsAt && !event.correctionOf && Date.parse(event.promotionEndsAt+'T23:59:59Z') < now) reasons.push('Promotion expirée')
  if (/rumeur|non confirme|pourrait|en discussion/i.test(`${event.status} ${event.label}`) && !event.correctionOf) reasons.push('Annonce encore incertaine ou proposition')
  if (event.status === 'Information sans nouveauté établie') reasons.push('Nouveauté non établie')
  return reasons
}
export function qualifiedOfferChange(event,now=Date.now()) {
  const c=event.changeEvidence
  return c?.version===1 && c.sourceUrl===event.sourceUrl && /^[a-f0-9]{64}$/.test(c.beforeHash??'') && /^[a-f0-9]{64}$/.test(c.afterHash??'') && c.beforeHash!==c.afterHash && Date.parse(c.beforeCheckedAt)<Date.parse(c.observedAt) && Date.parse(c.observedAt)<=now && c.afterHash===event.evidence?.sourceHash && Array.isArray(c.changes) && c.changes.length>0 && c.changes.every(row=>row.key&&row.before&&row.after&&row.before!==row.after)
}
