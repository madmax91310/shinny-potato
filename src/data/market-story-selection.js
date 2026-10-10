// Revue éditoriale T1, 10/10/2026 : sélection par angle, jamais par seuil de baisse.
// Les dates, pertes et récupérations viennent toujours du calcul mensuel partagé.
export const MONTHLY_STORY_ANGLES = {
  nvidia: {
    category: 'Nvidia : supporter la baisse',
    hook: 'Quand je regarde Nvidia, j’essaie aussi de regarder les passages où je n’aurais probablement pas eu envie de garder l’action 🫠',
    twist: 'C’est facile de regarder une action après une hausse et de se dire qu’il suffisait de l’acheter. Mais pour profiter de la suite, il fallait aussi garder son argent investi pendant cette baisse, sans connaître la fin du graphique.\n\nC’est ce passage que je regarderais avant de me dire que j’ai raté une occasion.',
  },
  meta: {
    category: 'Meta : garder ou vendre ?',
    hook: 'Je peux me dire que je garderais une action pendant une baisse. Avec Meta, je trouve le test beaucoup moins confortable 🫠',
    twist: 'Après une chute pareille, je me demanderais probablement si je suis patient ou si je m’accroche à un mauvais choix. Le retour au sommet se voit aujourd’hui sur le graphique, mais il ne pouvait pas servir de réponse au moment de décider.\n\nJe trouve cette hésitation beaucoup plus intéressante que de regarder seulement le résultat final.',
  },
  paypal: {
    category: 'PayPal : attendre son prix d’achat',
    hook: 'Avec PayPal, je pense à cette phrase qu’on peut se dire devant une action en perte : « Je vendrai quand je serai revenu à mon prix d’achat. »',
    twist: 'Ce qui me ferait hésiter, c’est de laisser mon ancien prix d’achat décider de la suite. Il explique ma perte, mais il ne dit pas si je choisirais encore cette action aujourd’hui.\n\nJe me poserais plutôt la question suivante : si je disposais de cet argent maintenant, est-ce que j’achèterais toujours PayPal ?',
  },
  euroMoney: {
    category: 'Monétaire : une érosion qui dure',
    hook: 'Sur un placement monétaire, je regarderais autant le temps passé sous un ancien niveau que la taille de la baisse.',
    twist: 'Une baisse peut sembler petite à côté de celles des actions et quand même durer longtemps. Si je réserve cet argent pour un projet proche, c’est cette durée qui m’intéresse.\n\nJe regarderais donc le parcours réel du fonds avant de me contenter du mot « monétaire ».',
  },
  globalBondEur: {
    // Risques recoupés dans la fiche iShares AGGH le 10/10/2026 :
    // https://www.ishares.com/uk/individual/en/products/291770/ishares-core-global-aggregate-bond-ucits-etf
    category: 'Obligations : la couverture ne protège pas de tout',
    hook: '« Obligations mondiales couvertes en euros » peut sembler rassurant. Je regarderais quand même ce qui peut faire baisser le fonds.',
    twist: 'La couverture en euros vise le risque de change. Elle n’empêche pas les obligations de perdre de la valeur.\n\nSi j’ajoute ce fonds pour rendre mon portefeuille plus confortable, je veux aussi comprendre les baisses que cette ligne peut traverser. Son nom ne suffit pas à me le dire.',
  },
  euroInflationBond: {
    // Risques recoupés dans la fiche iShares IBCI le 10/10/2026 :
    // https://www.ishares.com/ch/individual/en/products/251739/ishares-euro-inflation-linked-government-bond-ucits-etf
    category: 'Obligations indexées : une protection à comprendre',
    hook: 'En lisant « obligations indexées sur l’inflation », je pourrais croire que mon placement est protégé contre toute baisse. Je préfère regarder le fonds de plus près.',
    twist: 'L’indexation des obligations sur l’inflation ne garantit pas la valeur du fonds. Leur prix peut aussi baisser.\n\nC’est la distinction que je voudrais comprendre avant d’investir : ce qui est indexé dans une obligation et ce que je peux réellement retrouver en vendant mes parts.',
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
