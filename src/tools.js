// Registre central des outils : source unique pour le dashboard, la nav et les routes.
// status: 'disponible' une fois l'outil migré et branché, 'bientot' tant qu'il affiche un écran d'attente.
export const TOOLS = [
  {
    to: '/calculateur-investissement',
    navLabel: 'Calculateur',
    title: 'Et si tu avais investi ?',
    icon: '💰',
    description: "Simule la valeur d'un investissement passé, comparé au Livret A et à l'inflation.",
    status: 'disponible',
  },
  {
    to: '/recap-matin',
    navLabel: 'Récap Matin',
    title: "Récap' Matin marchés",
    icon: '☕',
    description: 'Mise en forme du récap matinal des marchés financiers pour publication.',
    status: 'bientot',
  },
  {
    to: '/generateur-portefeuilles',
    navLabel: 'Générateur portefeuilles',
    title: 'Générateur de portefeuilles',
    icon: '🧭',
    description: "Portefeuilles illustratifs par profil d'investisseur et niveau de risque.",
    status: 'disponible',
  },
  {
    to: '/tweets-etf',
    navLabel: 'Tweets ETF',
    title: 'Générateur de tweets ETF',
    icon: '🐦',
    description: "Tweets comparatifs d'ETF par thématique, prêts à publier.",
    status: 'disponible',
  },
  {
    to: '/lexique-financier',
    navLabel: 'Lexique financier',
    title: 'Fiches lexique financier',
    icon: '📚',
    description: 'Fiches pédagogiques de définitions de termes financiers.',
    status: 'bientot',
  },
  {
    to: '/comparatif-courtiers',
    navLabel: 'Comparatif courtiers',
    title: 'Comparatif courtiers',
    icon: '⚖️',
    description: 'Duels de courtiers en bourse (frais, PEA, DCA) prêts à publier.',
    status: 'disponible',
  },
]
