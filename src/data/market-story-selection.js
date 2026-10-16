// Récits narratifs : les chiffres et les dates restent calculés dans le registre partagé.
export const MONTHLY_STORY_ANGLES = {
  "nvidia": {
    "category": "Nvidia : supporter la baisse",
    "hook": "Quand on regarde la hausse de Nvidia, on peut se dire qu’il suffisait d’acheter et d’attendre, mais son histoire a aussi été marquée par de fortes baisses. 🫠",
    "twist": "💡 Ce qui me frappe dans ce parcours, c’est que pour profiter de la hausse qui a suivi, il fallait garder son argent investi pendant la chute, sans connaître la fin du graphique."
  },
  "meta": {
    "category": "Meta : garder ou vendre ?",
    "hook": "Avec le recul, garder ses actions Meta pendant la baisse peut sembler évident, mais sur le moment, tu ne savais pas encore quand le cours allait se reprendre. 👇",
    "twist": "💡 Aujourd’hui, le retour au sommet est visible sur le graphique, mais à l’époque, il fallait décider de garder ou de vendre avec ses économies en jeu, sans aucune garantie de retrouver ce niveau."
  },
  "paypal": {
    "category": "PayPal : attendre son prix d’achat",
    "hook": "Quand une action comme PayPal baisse, on peut se dire qu’on va simplement attendre de retrouver son prix d’achat, mais cette attente peut durer. ⏳",
    "twist": "💡 Ce que je trouve difficile dans cette situation, c’est de prendre du recul sur son prix d’achat, parce qu’il explique la perte sans dire ce que l’action peut rapporter ensuite. Avec cette somme disponible aujourd’hui, est-ce que tu choisirais encore PayPal ?"
  },
  "euroMoney": {
    "category": "Monétaire : une érosion qui dure",
    "hook": "Sur un placement monétaire, une petite baisse peut paraître anodine, jusqu’à ce que tu regardes combien de temps il faut pour retrouver son ancien niveau. ⏳",
    "twist": "💡 C’est ce que je regarde dans ce parcours, parce qu’une baisse limitée peut quand même durer longtemps quand cet argent doit financer un projet proche. Le mot « monétaire » ne raconte pas à lui seul ce que tu peux vivre avec ce placement."
  },
  "globalBondEur": {
    "category": "Obligations : la couverture ne protège pas de tout",
    "hook": "Quand tu lis « obligations mondiales couvertes en euros », le placement peut sembler rassurant, mais son parcours montre qu’il peut aussi baisser. 👇",
    "twist": "💡 Ce qui compte ici, c’est de comprendre ce que la couverture protège, elle vise le risque de change mais n’empêche pas les obligations de perdre de la valeur. On peut donc avoir choisi un fonds couvert en euros et quand même voir son placement reculer."
  },
  "euroInflationBond": {
    "category": "Obligations indexées : une protection à comprendre",
    "hook": "Tu choisis des obligations indexées sur l’inflation pour protéger ton argent, puis tu regardes ton fonds et tu constates qu’il a baissé. Comment est-ce possible ? 👇",
    "twist": "💡 L’indexation agit sur les paiements des obligations, mais leur prix peut quand même reculer, et donc faire baisser la valeur du fonds. C’est ce que cette histoire rappelle, la protection contre l’inflation ne garantit pas le montant que tu récupères en vendant tes parts."
  }
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
      context: `${measuredDecline} 📉\n\n${fact.context}`,
    }];
  });
}
