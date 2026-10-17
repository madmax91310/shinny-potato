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

// Angles gabarits pour toute baisse mesurée sans angle écrit à la main : le récit reste celui du
// registre (ampleur, dates, délai de retour) ; le gabarit distingue actions, obligations et indices,
// et ne parle de « hausse qui a suivi » que si le niveau a été retrouvé (18/10/2026).
const GENERIC_ANGLES = {
  'actions-historiques': {
    category: label => `${label} : supporter la baisse`,
    hook: label => `Quand on regarde le parcours de ${label}, on peut se dire qu’il suffisait d’acheter et d’attendre, mais son historique a aussi été marqué par une forte baisse. 🫠`,
    recovered: '💡 Pour profiter de la remontée qui a suivi, il fallait garder son argent investi pendant la chute, sans connaître la fin du graphique.',
    pending: '💡 Le niveau d’avant la baisse n’a pas encore été retrouvé : garder ou vendre reste une décision à prendre sans connaître la suite.',
  },
  'obligations-historiques': {
    category: label => `${label} : une baisse qui dure`,
    hook: label => `Un placement comme ${label} peut sembler calme, jusqu’à ce que tu regardes combien de temps il a fallu pour retrouver son ancien niveau. ⏳`,
    recovered: '💡 Une baisse limitée peut quand même durer longtemps ; c’est ce qui compte quand cet argent doit financer un projet proche.',
    pending: '💡 Le niveau d’avant la baisse n’est pas encore retrouvé : un placement jugé prudent peut rester en retrait pendant des mois.',
  },
  'indices-historiques': {
    category: label => `${label} : traverser la baisse`,
    hook: label => `Un indice large comme ${label} finit souvent par remonter sur un graphique, mais il faut d’abord traverser la baisse avec ses économies. 👇`,
    recovered: '💡 Ce qui compte dans ce parcours, c’est le temps passé sous l’ancien sommet : c’est là que se décide la capacité à rester investi.',
    pending: '💡 Le sommet précédent n’est pas encore retrouvé : la patience demandée par un indice large se mesure en années, pas en semaines.',
  },
};
export function storyAngle(fact) {
  const id = fact.id.replace(/^monthly-drawdown-/, '');
  if (MONTHLY_STORY_ANGLES[id]) return MONTHLY_STORY_ANGLES[id];
  const template = GENERIC_ANGLES[fact.family] ?? GENERIC_ANGLES['actions-historiques'];
  const label = (fact.indices?.[0] ?? id).replace(/^Indice /, '');
  const recovered = /pour retrouver le niveau/.test(fact.context);
  return { category: template.category(label), hook: template.hook(label), twist: recovered ? template.recovered : template.pending, derived: true };
}

export function selectMonthlyMarketStories(facts) {
  // Only series with reinvested income tell a complete story: a price index (CAC 40) omits dividends, so its decline is not comparable.
  const declines = facts.filter(fact => fact.id.startsWith('monthly-drawdown-') && fact.hook.includes(' a perdu ') && /réinvestis/.test(fact.methodNote ?? '') && !/non réinvestis/.test(fact.methodNote ?? ''));
  // Angles écrits d’abord, dans leur ordre ; puis les angles gabarits par identifiant.
  const ordered = [...MONTHLY_MARKET_STORY_IDS.map(id => declines.find(fact => fact.id === `monthly-drawdown-${id}`)).filter(Boolean),
    ...declines.filter(fact => !MONTHLY_STORY_ANGLES[fact.id.replace(/^monthly-drawdown-/, '')]).sort((a, b) => a.id.localeCompare(b.id))];
  return ordered.map(fact => {
    // Sans baisse observée, ces angles ne sont plus justifiés : pas de faux récit.
    const measuredDecline = fact.hook.split('. C’est le passage')[0] + '.';
    return { ...fact, ...storyAngle(fact), methodInDetails: true, context: `${measuredDecline} 📉\n\n${fact.context}` };
  });
}
