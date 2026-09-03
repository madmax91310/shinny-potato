// Données du Calculateur d'impact des frais (TER) — outil de SIMULATION pédagogique : contrairement
// aux autres outils de l'app, aucune donnée de marché réelle n'est sourcée ici. Le rendement brut et
// les niveaux de frais sont des hypothèses assumées et présentées comme telles dans le tweet généré
// (jamais comme une performance ou un TER réel constaté) — c'est le calcul (intérêts composés) qui
// est réel, pas les chiffres d'entrée.

export const AMOUNT_PRESETS = [100, 300, 500, 1000]
export const DURATION_PRESETS = [10, 15, 20, 25, 30]
export const RETURN_PRESETS = [5, 6, 7, 8]

// Niveaux de frais annuels (TER, %) proposés pour les deux côtés de la comparaison — repère indicatif
// (0,10-0,20 % : ETF indiciel large peu coûteux ; 0,50-1 % : ETF/fonds indiciel plus cher ou fonds
// actif à frais modérés ; 1,5-2 % : fonds actif classique) plutôt qu'une donnée de marché précise.
export const FEE_LEVELS = [
  { value: 0.1, label: '0,10 %' },
  { value: 0.2, label: '0,20 %' },
  { value: 0.5, label: '0,50 %' },
  { value: 1, label: '1 %' },
  { value: 1.5, label: '1,5 %' },
  { value: 2, label: '2 %' },
]

export const DEFAULT_FEE_LOW = 0.2
export const DEFAULT_FEE_HIGH = 1.5

// Bibliothèque de punchlines — distincte de celles des autres outils de l'app, centrée sur l'effet
// cumulé des frais (pas la performance). Deux variantes (marquées ci-dessous) font le lien avec le
// choix d'enveloppe (PEA/CTO) SANS jamais entrer dans un calcul de fiscalité — volontairement une
// minorité du pool pour rester occasionnelles, pas systématiques (cf. brief).
export const PUNCHLINES = [
  "1 % de frais par an, ça ne semble rien. Cumulé sur 20-30 ans, ça se chiffre en dizaines de milliers d'euros.",
  "Les frais, c'est le seul paramètre de ton investissement que tu contrôles à 100 %.",
  "Un rendement, ça se discute. Des frais, ça se lit noir sur blanc avant de signer.",
  "Personne ne t'envoie de relevé annuel des frais que tu as payés. C'est bien le problème.",
  "Deux investisseurs, même effort d'épargne, même rendement brut — un écart de dizaines de milliers d'euros à l'arrivée, juste sur les frais.",
  // Variante liée à l'enveloppe (PEA/CTO) — occasionnelle, jamais un calcul de fiscalité.
  "Et ça, c'est avant même de parler de fiscalité PEA vs CTO — les frais, c'est la première chose à regarder, quelle que soit ton enveloppe.",
  "Un point de frais en moins, c'est un point de rendement en plus, chaque année, sans rien faire de différent.",
  "Le prospectus donne le TER en une ligne. Ce calcul montre ce que cette ligne vaut vraiment sur la durée.",
  // Variante liée à l'enveloppe (PEA/CTO) — occasionnelle.
  "Avant de choisir entre PEA et CTO, regarde déjà ce que les frais du fonds ou de l'ETF te coûtent — le reste vient après.",
]

export const ENGAGEMENT_QUESTIONS = [
  'Tu connais le TER exact de ce que tu détiens ?',
  "Ça vaut le coup d'aller vérifier, non ?",
  'Frais bas ou frais hauts, tu te situes où ?',
  'Ce chiffre te surprend ?',
  'Tu regardes les frais avant ou après avoir choisi un placement ?',
]
