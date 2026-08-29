// Punchlines de clôture pour le format "Performance depuis [année]" — génériques (jamais liées à
// un actif précis), pool distinct de anniversairePunchlines.js pour qu'aucune des deux ne se
// répète d'un format à l'autre (contrainte du brief d'origine). Pas de placeholder ici : aucune
// n'a besoin de rappeler l'année ou le chiffre (déjà dans le corps du tweet juste au-dessus).
//
// Trois registres (audit "pools de punchlines" du 29/08/2026) : la quasi-totalité des gabarits
// d'origine présumaient un gain, alors que la performance affichée peut être négative — sélection
// par signe réel dans lib.js (pickPerformanceDepuisPunchline). Une punchline a aussi été retirée
// pour affirmation non garantie : "Le Livret A, sur la même période, n'a même pas fait illusion."
// affirmait que l'actif battait systématiquement le Livret A, ce qui n'est vérifié nulle part et
// peut même contredire la ligne de contexte Livret A/inflation quand le toggle est activé.
export const PERFORMANCE_DEPUIS_PUNCHLINES_NEUTRE = [
  "Le chiffre est là, sans filtre.",
  "Une période, un chiffre, aucune promesse pour la suivante.",
];

export const PERFORMANCE_DEPUIS_PUNCHLINES_GAIN = [
  "Pas besoin de timing parfait. Juste besoin d'avoir commencé.",
  "Ce n'est pas de la chance. C'est du temps de marché.",
  "Combien de fois tu as remis ça à plus tard ?",
  "Le meilleur moment pour investir, c'était hier. Le deuxième meilleur, c'est aujourd'hui.",
  "Pendant que certains attendaient le bon moment, le marché, lui, avançait.",
  "La volatilité fait peur à court terme. Sur cette durée, elle s'efface derrière la tendance.",
  "Tu attends encore quoi, exactement ?",
  "Zéro martingale. Juste de la durée, et le bon actif au départ.",
];

export const PERFORMANCE_DEPUIS_PUNCHLINES_PERTE = [
  "Le marché ne monte pas en ligne droite. Cette période le rappelle.",
  "Toutes les histoires ne finissent pas en ligne montante. Celle-ci non plus, sur cette période.",
  "Pas de martingale non plus dans l'autre sens — le risque, c'est aussi ça.",
  "Le temps ne rattrape pas systématiquement tout. Cette période en est la preuve.",
  "Une performance négative fait aussi partie du jeu. Pas de quoi la cacher.",
  "Tenir une position n'a rien d'automatique. Celle-ci le montre.",
];
