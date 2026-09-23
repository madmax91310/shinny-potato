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

// La phrase personnelle est saisie dans l'interface. En l'absence de saisie, le tweet copié
// garde une mention explicite de brouillon pour éviter qu'une punchline factice soit publiée.
export const PUNCHLINE_DRAFT = '[Brouillon à compléter : ta phrase sur cet écart de frais]'
