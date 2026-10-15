// Revue éditoriale T1, 10/10/2026 : sélection par angle, jamais par seuil de baisse.
// Les dates, pertes et récupérations viennent toujours du calcul mensuel partagé.
export const MONTHLY_STORY_ANGLES = {
  nvidia: {
    category: 'Nvidia : supporter la baisse',
    hook: 'La hausse de Nvidia peut faire oublier les fortes baisses traversées par ses actionnaires 🫠',
    twist: 'C’est facile de regarder une action après une hausse et de se dire qu’il suffisait de l’acheter. Mais pour profiter de la suite, il fallait aussi garder son argent investi pendant cette baisse, sans connaître la fin du graphique.\n\nLe parcours compte autant que le point d’arrivée pour comprendre ce qu’un investissement aurait demandé.',
  },
  meta: {
    category: 'Meta : garder ou vendre ?',
    hook: 'L’histoire de Meta montre à quel point garder une action pendant une forte baisse peut être difficile 🫠',
    twist: 'Après une telle chute, attendre le rebond n’offre aucune garantie. Le retour au sommet se voit aujourd’hui sur le graphique, mais il ne pouvait pas servir de réponse au moment de décider.\n\nLe résultat final ne suffit pas à décrire l’incertitude traversée.',
  },
  paypal: {
    category: 'PayPal : attendre son prix d’achat',
    hook: 'Avec PayPal, attendre de retrouver son prix d’achat ne garantit ni le retour à l’équilibre ni le délai nécessaire.',
    twist: 'L’ancien prix d’achat explique la perte, mais ne dit pas ce que l’action peut rapporter à partir d’aujourd’hui.\n\nLa question reste celle du placement actuel : avec cette somme disponible maintenant, choisirais-tu encore PayPal ?',
  },
  euroMoney: {
    category: 'Monétaire : une érosion qui dure',
    hook: 'Sur un placement monétaire, le temps passé sous un ancien niveau compte autant que la taille de la baisse.',
    twist: 'Une baisse peut sembler petite à côté de celles des actions et quand même durer longtemps. Pour une somme destinée à un projet proche, cette durée peut compter.\n\nLe mot « monétaire » ne résume pas le parcours réel du fonds.',
  },
  globalBondEur: {
    // Risques recoupés dans la fiche iShares AGGH le 10/10/2026 :
    // https://www.ishares.com/uk/individual/en/products/291770/ishares-core-global-aggregate-bond-ucits-etf
    category: 'Obligations : la couverture ne protège pas de tout',
    hook: '« Obligations mondiales couvertes en euros » peut sembler rassurant. Le fonds reste pourtant exposé à des baisses.',
    twist: 'La couverture en euros vise le risque de change. Elle n’empêche pas les obligations de perdre de la valeur.\n\nSon rôle dans le portefeuille dépend aussi des baisses qu’il peut traverser. Son nom ne suffit pas à les décrire.',
  },
  euroInflationBond: {
    // Risques recoupés dans la fiche iShares IBCI le 10/10/2026 :
    // https://www.ishares.com/ch/individual/en/products/251739/ishares-euro-inflation-linked-government-bond-ucits-etf
    category: 'Obligations indexées : une protection à comprendre',
    hook: 'Des obligations indexées sur l’inflation peuvent perdre de la valeur malgré cette indexation.',
    twist: 'L’indexation des obligations sur l’inflation ne garantit pas la valeur du fonds. Leur prix peut aussi baisser.\n\nLes paiements indexés d’une obligation et le montant récupéré à la vente des parts sont deux choses différentes.',
  },
};

export const MONTHLY_MARKET_STORY_IDS = Object.keys(MONTHLY_STORY_ANGLES);

export function selectMonthlyMarketStories(facts) {
  return MONTHLY_MARKET_STORY_IDS.flatMap(id => {
    const fact = facts.find(item => item.id === `monthly-drawdown-${id}`);
    // Sans baisse observée, ces angles ne sont plus justifiés : pas de faux récit.
    if (!fact || !fact.hook.includes(' a perdu ')) return [];
    const measuredDecline = fact.hook.split('. C’est le passage')[0] + '.';
    return [{
      ...fact,
      ...MONTHLY_STORY_ANGLES[id],
      context: `${measuredDecline}\n\n${fact.context}\n\nLes clôtures mensuelles peuvent masquer une baisse plus forte en cours de mois.`,
    }];
  });
}
