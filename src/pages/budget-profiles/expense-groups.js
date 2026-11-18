import { budgetRowSymbol } from './presentation.js'

const constrained = new Set(['housing', 'energy', 'insurance', 'education', 'health', 'tax', 'bills', 'transport', 'food', 'pets', 'childcare', 'care', 'debt', 'credit'])
const discretionary = new Set(['child', 'hair', 'clothing', 'gift', 'dining', 'media', 'music', 'digital', 'leisure'])
const plain = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function expenseGroup(row) {
  if (row.constraint) return row.constraint
  const label = plain(row.label)
  if (/courses.*(?:restaurant|repas (?:hors|a l.exterieur))|sante.*(?:vetements|coiff|divers)|(?:vetements|coiff).*sante|(?:telecom|telephone|transport|assurance|essence).*\b(?:sport|streaming|loisirs|abonnements)\b|\b(?:scolaire|ecole|garde|garderie|creche|cantine).*activit|^(?:charges et abonnements|depenses courantes)/.test(label)) return 'mixed'
  if (/^(?:provision (?:cadeaux|vacances|voyages)|abonnements? loisirs)|restaurant|sorties|loisirs/.test(label) && !/\b(?:logement|enfants? et garde|sante)\b/.test(label)) return 'flexible'
  if (/copropriet|participation (?:au foyer|aux depenses)|charges fixes|charges locatives|loyer|credit|cotisation obligatoire|redevance|frais professionnels/.test(label)) return 'fixed'
  const { kind } = budgetRowSymbol(row)
  if (constrained.has(kind)) return 'fixed'
  if (discretionary.has(kind)) return 'flexible'
  return 'mixed'
}
