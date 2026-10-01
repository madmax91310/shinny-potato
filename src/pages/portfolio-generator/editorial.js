// Le texte décrit la composition finale, indépendamment du profil et du mode.
const WORLD = ["msci_world", "msci_world_ishares", "msci_world_amundi_pea", "msci_acwi", "msci_acwi_ishares", "ftse_allworld_vanguard"];
const SP500 = ["sp500", "sp500_ishares"];
const EURO = ["eurostoxx50", "eurostoxx50_ishares"];
const LEVERAGE = ["lqq", "cl2"];
const isEquity = s => ["actions_larges", "emergents", "dividendes"].includes(s.cat) || (s.cat === "immobilier" && s.id !== "scpi");
const isTheme = s => s.id.startsWith("sect_") || s.id === "tech_europe";
const weight = (selection, test) => selection.filter(test).reduce((sum, s) => sum + s.pct, 0);

function overlap(selection) {
  if (selection.some(s => WORLD.includes(s.id)) && selection.some(s => SP500.includes(s.id))) return "L’indice monde contient déjà des actions américaines : ajouter le S&P 500 renforce cette exposition, avec des entreprises en commun."; 
  if (selection.some(s => EURO.includes(s.id)) && selection.some(s => s.id === "cac40")) return "Le CAC 40 et l’Euro Stoxx 50 ont des entreprises en commun : leurs deux poids ne représentent pas deux expositions indépendantes."; 
  if (selection.filter(s => WORLD.includes(s.id)).length > 1) return "Les indices monde se recoupent largement : plusieurs fonds ne multiplient pas automatiquement la diversification."; 
  if (selection.filter(s => SP500.includes(s.id)).length > 1 || selection.filter(s => EURO.includes(s.id)).length > 1) return "Deux fonds suivent ici le même indice : leur exposition se cumule, même si leurs caractéristiques diffèrent."; 
  if (selection.filter(s => s.id.startsWith("bitcoin")).length > 1) return "Plusieurs supports Bitcoin restent exposés au même actif : changer de produit ne diversifie pas le cours suivi."; 
  if (selection.filter(s => s.id === "or" || s.id.startsWith("or_")).length > 1) return "Plusieurs supports sur l’or restent exposés au même métal : leur poids doit se lire ensemble."; 
  return null;
}

function role(s, selection) {
  let explanation;
  if (s.id === "fonds_euros") explanation = "Cette poche apporte la stabilité du fonds euros ; les conditions de garantie dépendent du contrat. Elle réduit la part du total soumise aux variations des autres supports."; 
  else if (LEVERAGE.includes(s.id)) explanation = "Le levier vise deux fois la variation quotidienne de l’indice. Il amplifie les mouvements ; sur plusieurs années, le résultat n’est pas simplement celui de l’indice multiplié par deux."; 
  else if (s.id === "qyld_ucits") explanation = "La vente d’options génère des primes mais limite une partie de la hausse du Nasdaq-100. Les distributions peuvent varier et le capital reste exposé aux baisses."; 
  else if (s.cat === "crypto") explanation = "Cette exposition crypto peut provoquer de fortes variations. Son poids dans le capital ne mesure pas à lui seul sa contribution au risque."; 
  else if (s.id === "or" || s.id.startsWith("or_")) explanation = "L’or ajoute une exposition au métal, sans bénéfices d’entreprises ni intérêts. Son cours peut baisser : il ne garantit pas la protection du reste."; 
  else if (s.cat === "matieres_premieres") explanation = "Cette ligne dépend des cours des matières premières. Elle apporte un autre moteur de performance, sensible aux cycles économiques et aux variations de prix."; 
  else if (s.id === "scpi") explanation = "L’immobilier non coté apporte une exposition aux loyers et à la valeur des biens. Les revenus ne sont pas garantis et la revente peut prendre du temps."; 
  else if (s.cat === "immobilier") explanation = "Ces sociétés immobilières sont cotées : leurs cours réagissent aux marchés et aux taux. Cette poche garde donc un risque de baisse comparable à celui d’actions."; 
  else if (s.id.startsWith("oblig_hy")) explanation = "Les obligations à haut rendement exposent davantage au défaut des émetteurs. Le revenu potentiel plus élevé s’accompagne d’un risque de crédit plus fort."; 
  else if (s.id === "oblig_inflation") explanation = "Les obligations indexées intègrent l’inflation dans leurs paiements, mais leur prix reste sensible aux taux réels. Elles peuvent donc baisser malgré une inflation élevée."; 
  else if (["oblig_etat_eur_short", "oblig_0_1_ishares"].includes(s.id)) explanation = "Les échéances courtes réduisent la sensibilité aux taux par rapport à des obligations longues. Le prix peut néanmoins varier."; 
  else if (s.id === "monetaire_xeon") explanation = "Cette exposition monétaire suit les taux courts. Son rendement évolue avec eux et ce fonds ne constitue pas un dépôt bancaire garanti."; 
  else if (s.cat === "obligataire") explanation = "Les obligations ajoutent une exposition aux taux et à la solvabilité des émetteurs. Leur cours peut baisser : cette poche ne remplace pas une garantie du capital."; 
  else if (WORLD.includes(s.id)) explanation = "Cet indice répartit l’exposition entre de nombreuses entreprises et plusieurs pays. Il donne une base large à la poche actions, tout en restant exposé aux baisses des marchés."; 
  else if (SP500.includes(s.id)) explanation = "Cette ligne renforce les grandes entreprises américaines. Elle concentre une partie de la poche actions sur les États-Unis, même si ces sociétés vendent dans le monde entier."; 
  else if (isTheme(s)) explanation = "Cette ligne cible un secteur ou un thème précis. Elle peut évoluer différemment d’un indice large, mais reste sensible aux difficultés des entreprises de cette spécialité."; 
  else if (s.cat === "emergents") explanation = "Cette ligne expose aux marchés émergents et à leurs devises. Elle ajoute des entreprises et des risques économiques et politiques différents des marchés développés."; 
  else if (s.cat === "dividendes") explanation = "La sélection privilégie des entreprises selon leurs dividendes. Ceux-ci peuvent être réduits ; les actions restent exposées aux baisses, et leur versement dépend de la part choisie."; 
  else explanation = "Cette ligne apporte l’exposition actions décrite ci-dessus. Les bénéfices des entreprises, les marchés et les devises peuvent faire varier sa valeur."; 
  const max = Math.max(...selection.map(a => a.pct));
  const place = s.pct >= 50 ? "Elle représente au moins la moitié du capital."
    : s.pct === max && selection.filter(a => a.pct === max).length === 1 ? "C’est la plus grosse ligne de cette composition."
    : s.pct <= 15 ? "Son poids en fait une poche complémentaire."
    : "Elle occupe une place importante dans la répartition."; 
  return explanation + " " + place;
}

export function buildEditorial(selection, history = [], profileId, riskId) {
  const top = [...selection].sort((a, b) => b.pct - a.pct)[0];
  const euros = selection.find(s => s.id === "fonds_euros");
  const crypto = selection.find(s => s.cat === "crypto");
  const lever = selection.find(s => LEVERAGE.includes(s.id));
  const theme = selection.find(s => isTheme(s) && s.pct >= 25);
  const shared = overlap(selection);
  let hooks;
  if (selection.length === 1) hooks = [
    `100% sur ${top.name} : combien d’expositions se cachent derrière cette seule ligne ? 👇`,
    `Un seul support pour tout le capital : que contient ${top.name} ? 👇`,
  ];
  else if (euros && crypto) hooks = [
    `${euros.pct}% de fonds euros et ${crypto.pct}% sur ${crypto.name} : que change ce mélange dans un portefeuille ? 👇`,
    `Une poche stable à ${euros.pct}% face à une ligne crypto à ${crypto.pct}% : où se cache le risque ? 👇`,
  ];
  else if (shared) hooks = [
    `${selection.length} lignes, mais des entreprises ou des actifs en commun : est-ce vraiment autant de diversification ? 👇`,
    "Deux supports différents peuvent cacher la même exposition. Qu’en est-il de ce portefeuille ? 👇",
  ];
  else if (lever) hooks = [
    `${lever.pct}% sur ${lever.name} : pourquoi cette ligne peut-elle peser plus que son poids ? 👇`,
    `Un ETF à levier à ${lever.pct}% dans le portefeuille : que faut-il regarder au-delà du pourcentage ? 👇`,
  ];
  else if (theme) hooks = [
    `${theme.pct}% sur ${theme.name} : jusqu’où ce thème influence-t-il le portefeuille ? 👇`,
    `Un seul thème à ${theme.pct}% : que font les autres lignes de ce portefeuille ? 👇`,
  ];
  else if (euros && euros.pct >= 40) hooks = [
    `${euros.pct}% de fonds euros : à quoi sert le reste de ce portefeuille ? 👇`,
    `Un fonds euros à ${euros.pct}% : où se joue la performance des autres lignes ? 👇`,
  ];
  else hooks = [
    `${top.pct}% sur ${top.name} : que racontent les autres lignes de ce portefeuille ? 👇`,
    `${selection.length} lignes, la plus grosse à ${top.pct}% : où se concentre réellement l’exposition ? 👇`,
  ];
  const last = [...history].reverse().find(p => p.profileId === profileId && p.riskId === riskId);
  const hookIndex = last?.hookTemplate === hooks[0] ? 1 : 0;
  const equityPct = weight(selection, isEquity);
  const bondPct = weight(selection, s => s.cat === "obligataire" && s.id !== "fonds_euros");
  const parts = [];
  if (euros) parts.push(`${euros.pct}% de fonds euros`);
  if (equityPct) parts.push(`${equityPct}% d’actions, immobilier coté compris`);
  if (bondPct) parts.push(`${bondPct}% de supports obligataires ou monétaires`);
  const otherPct = weight(selection, s => !isEquity(s) && s.cat !== "obligataire");
  if (otherPct) parts.push(`${otherPct}% sur les autres actifs détaillés ci-dessus`);
  let logic = `La répartition réunit ${parts.join(", ")}. `;
  logic += shared ?? (top.pct >= 50
    ? `${top.name} représente à lui seul ${top.pct}% du capital : son évolution compte particulièrement dans le total.`
    : "Les lignes répartissent le capital entre plusieurs expositions, mais elles peuvent baisser ensemble.");
  if (crypto || lever) logic += " Le poids investi ne suffit pas à mesurer le risque : les expositions très volatiles peuvent avoir un effet marqué sur les variations."; 
  const warnings = ["La pire année simulée ne constitue pas une perte maximale : d’autres périodes peuvent être plus défavorables."];
  if (lever) warnings.push("Le levier 2x est quotidien, pas une multiplication par deux du rendement sur plusieurs années.");
  if (selection.some(s => s.distributing || s.id === "qyld_ucits" || s.id === "scpi")) warnings.push("Les distributions ne sont pas garanties et peuvent accompagner une baisse du capital.");
  return {
    selection: selection.map(s => ({ ...s, pourquoi: role(s, selection) })),
    hook: "📊 " + hooks[hookIndex], hookTemplate: hooks[hookIndex],
    intro: "Voici la place de chaque support, puis ce que leur association implique.",
    sousTitre: "💼 La répartition", logic,
    cta: `💬 Tu garderais ${top.name} à ${top.pct}% ou tu changerais sa place dans cette répartition ?`,
    ctaTemplate: "place-de-la-plus-grosse-ligne", warning: warnings.join(" "),
  };
}

