import { PROFILES, PRO_EUROPE_CORE_IDS } from "./theses.js";

// Le texte décrit la composition finale, indépendamment du profil et du mode.
const WORLD = ["msci_world", "msci_world_ishares", "msci_world_amundi_pea", "msci_acwi", "msci_acwi_ishares", "ftse_allworld_vanguard"];
const SP500 = ["sp500", "sp500_ishares"];
const EURO = ["eurostoxx50", "eurostoxx50_ishares"];
const LEVERAGE = ["lqq", "cl2"];
const isEquity = s => ["actions_larges", "emergents", "dividendes"].includes(s.cat) || (s.cat === "immobilier" && s.id !== "scpi");
const isTheme = s => s.id.startsWith("sect_") || ["tech_europe", "infrastructure_ishares"].includes(s.id);
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

// Les intitulés manuels décrivent les expositions, sans déduire un profil de risque.
function portfolioHeading(selection, profileId, riskId) {
  if (riskId !== "manuel") {
    const label = PROFILES.find(p => p.id === profileId)?.label.replace(/^(?:Le |L['’])/, "");
    return "🧩 Portefeuille" + (label ? ` ${label}` : "");
  }
  const world = weight(selection, s => WORLD.includes(s.id));
  const bitcoin = weight(selection, s => s.id.startsWith("bitcoin"));
  const gold = weight(selection, isGold);
  const tech = weight(selection, s => ["sect_tech", "tech_europe", "nasdaq100", "nasdaq100_ishares", "lqq"].includes(s.id));
  const dividends = weight(selection, s => s.cat === "dividendes" && s.id !== "qyld_ucits");
  const bonds = weight(selection, isBond);
  let label = "";
  if (world && bitcoin) label = "Monde + Bitcoin";
  else if (tech >= 10 && gold >= 10) label = "tech et or";
  else if (dividends >= 10 && bonds >= 10) label = "dividendes et obligations";
  else if (weight(selection, s => PRO_EUROPE_CORE_IDS.includes(s.id)) >= 70) label = "à dominante européenne";
  else if (weight(selection, s => s.id === "fonds_euros") >= 50) label = "à dominante fonds euros";
  else if (bitcoin >= 50) label = "à dominante Bitcoin";
  else if (gold >= 50) label = "à dominante or";
  else if (world >= 50) label = "à dominante mondiale";
  else if (dividends >= 50) label = "à dominante dividendes";
  else if (bonds >= 50) label = "à dominante obligataire";
  else if (weight(selection, isTheme) >= 50) label = "thématique";
  return "🧩 Portefeuille" + (label ? ` ${label}` : "");
}

const isGold = s => s.id === "or" || s.id.startsWith("or_");
const isBond = s => s.cat === "obligataire" && !["fonds_euros", "monetaire_xeon"].includes(s.id);

function pickHook(selection, history, profileId, riskId, shared) {
  const top = [...selection].sort((a, b) => b.pct - a.pct)[0];
  const euros = weight(selection, s => s.id === "fonds_euros");
  const crypto = weight(selection, s => s.cat === "crypto");
  const lever = selection.find(s => LEVERAGE.includes(s.id));
  const theme = [...selection].filter(isTheme).sort((a, b) => b.pct - a.pct)[0];
  const world = weight(selection, s => WORLD.includes(s.id));
  const small = weight(selection, s => ["smallcap_monde", "smallcap_europe"].includes(s.id));
  const dividends = weight(selection, s => s.cat === "dividendes" && s.id !== "qyld_ucits");
  const bonds = weight(selection, isBond);
  const gold = weight(selection, isGold);
  const inflation = weight(selection, s => s.id === "oblig_inflation");
  const europe = weight(selection, s => PRO_EUROPE_CORE_IDS.includes(s.id));
  let kind, hooks;
  if (selection.length === 1) {
    kind = "single"; hooks = [
      `100% sur ${top.name}. Une seule ligne, mais à quoi confiez-vous vraiment toute votre épargne ?`,
      `100% sur ${top.name}. Le choix paraît simple. Regardons ce qu’il implique.`,
      `Un seul support, 100% du capital. Avant de choisir ${top.name}, voici ce qu’il faut comprendre.`,
    ];
  } else if (lever) {
    kind = "leverage"; hooks = [
      `${lever.pct}% sur un ETF à levier. Sur le graphique, c’est une ligne parmi les autres. Dans les variations du portefeuille, elle peut prendre bien plus de place.`,
      `Le choix qui change la lecture de ce portefeuille : ${lever.pct}% sur ${lever.name}. Pourquoi regarder au-delà de ce pourcentage ?`,
      `Une ligne à ${lever.pct}% qui amplifie les mouvements de son indice. Voici ce qu’on a choisi de mettre autour.`,
    ];
  } else if (crypto) {
    kind = crypto <= 15 ? "crypto-small" : "crypto-large";
    hooks = crypto <= 15 ? [
      `${crypto}% de crypto. Une petite place sur le graphique. Mais quelle place dans votre tête les jours où elle décroche ?`,
      `${crypto}% de crypto, ${100 - crypto}% ailleurs. La vraie question : ce mélange vous permettra-t-il de rester investi quand la crypto chute ?`,
      `${euros ? `${euros}% de fonds euros et ` : ""}${crypto}% de crypto. Voici comment le reste du portefeuille accompagne ce choix.`,
    ] : [
      `${crypto}% de crypto. À ce poids-là, accepter l’idée est une chose. Garder le portefeuille pendant une chute en est une autre.`,
      crypto < 100 ? `La crypto prend ${crypto}% du capital. Que choisit-on pour les ${100 - crypto}% restants ?` : "100% de crypto. Plusieurs supports, mais quelles expositions derrière leurs noms ?",
      `${crypto}% de crypto : la conviction est visible. ${crypto < 100 ? "Regardons ce qu’on lui a mis à côté." : "Regardons ce que chaque ligne apporte."}`,
    ];
  } else if (shared) {
    kind = "overlap"; hooks = [
      `${selection.length} lignes dans ce portefeuille. Pourtant, certaines expositions se retrouvent plusieurs fois. Voici où.`,
      `Ajouter un fonds donne l’impression de diversifier. Dans ce portefeuille, il faut d’abord regarder ce qu’on possède déjà.`,
      `Les noms des supports changent. Certaines expositions se répètent. Regardons ce que ces ${selection.length} lignes ajoutent réellement.`,
    ];
  } else if (euros >= 50) {
    kind = "euros-majority"; hooks = [
      `${euros}% de fonds euros. Ce portefeuille peut vous frustrer quand la Bourse monte. Alors pourquoi lui laisser autant de place ?`,
      `Le fonds euros prend ${euros}% du capital. Le choix intéressant, c’est ce qu’on fait des ${100 - euros}% restants.`,
      `${euros}% de fonds euros. Avant de demander si ce portefeuille peut rapporter davantage, demandons-nous ce qu’on veut pouvoir supporter.`,
    ];
  } else if (inflation >= 25 && inflation >= top.pct) {
    kind = "inflation"; hooks = [
      `${inflation}% d’obligations indexées sur l’inflation${gold ? `, ${gold}% d’or` : ""}. Pourquoi donner la première place aux obligations ?`,
      `Ici, les obligations indexées prennent la plus grosse place : ${inflation}%. Que cherche-t-on à construire autour ?`,
      `On pense vite à l’or quand les prix grimpent. Ici, ${inflation}% du portefeuille va aux obligations indexées. Voici le compromis.`,
    ];
  } else if (theme && theme.pct >= 25) {
    kind = "theme"; hooks = [
      `Croire à un thème, c’est une chose. Lui confier ${theme.pct}% de son épargne, c’en est une autre. Voici la place donnée à ${theme.name}.`,
      `${theme.pct}% sur ${theme.name}. La conviction est claire. À quoi servent les autres lignes ?`,
      `Ce thème prend ${theme.pct}% du portefeuille. Regardons où la conviction s’arrête et où le reste commence.`,
    ];
  } else if (europe >= 70) {
    kind = "europe"; hooks = [
      `Le bloc Europe prend ${europe}% du portefeuille. Le choix est assumé. ${europe < 100 ? "Que garde-t-on à côté ?" : "Regardons ce qu’il recouvre."}`,
      `${europe}% dans le bloc Europe. Voici comment ce portefeuille donne du poids à cette conviction.`,
      `L’Europe occupe ${europe}% du capital. ${europe < 100 ? `La question intéressante : que font les ${100 - europe}% restants ?` : "Que retrouve-t-on derrière ce choix géographique ?"}`,
    ];
  } else if (dividends >= 10 && (bonds >= 10 || selection.some(s => s.cat === "immobilier"))) {
    kind = "income"; hooks = [
      `${dividends}% en actions à dividendes. Pourquoi leur ajouter ${bonds >= 10 ? "des obligations" : "de l’immobilier"} plutôt que leur laisser toute la place ?`,
      `Les dividendes ont leur place : ${dividends}% du capital. Mais ce portefeuille leur donne de la compagnie. Voici pourquoi.`,
      `On pourrait tout miser sur les actions à dividendes. Ici, elles prennent ${dividends}% du portefeuille. Regardons le choix fait pour le reste.`,
    ];
  } else if (world && small) {
    kind = "world-small"; hooks = [
      `${world}% en indices monde, et ${small}% en petites entreprises à côté. Qu’est-ce qu’on cherche à ajouter ?`,
      `Une base mondiale à ${world}%. Pourtant, ce portefeuille réserve aussi ${small}% aux petites capitalisations. Voici pourquoi.`,
      `Pourquoi ajouter des petites entreprises quand on possède déjà un indice monde ? Ce portefeuille leur réserve ${small}%.`,
    ];
  } else if (gold >= 25) {
    kind = "gold"; hooks = [
      `${gold}% d’or. À cette place, le métal compte vraiment dans le résultat. Que lui associer ?`,
      `L’or prend ${gold}% du portefeuille. Voici ce qu’on a choisi pour les ${100 - gold}% restants.`,
      `${gold}% sur un actif qui ne verse ni intérêts ni dividendes. Pourquoi lui faire cette place ?`,
    ];
  } else {
    kind = top.pct >= 50 ? "dominant" : "balanced";
    hooks = top.pct >= 50 ? [
      `${top.name} prend ${top.pct}% du capital. Pourquoi lui laisser autant de place, et que garder à côté ?`,
      `${top.pct}% sur ${top.name}. Le choix principal est fait. Voici comment les autres lignes l’accompagnent.`,
      `Plus de lignes ne veut pas dire moins de concentration. Ici, ${top.name} représente ${top.pct}% du portefeuille.`,
    ] : [
      `La plus grosse ligne prend ${top.pct}% du capital. Pourquoi ce portefeuille partage-t-il autant la place ?`,
      `${selection.length} lignes, aucune au-dessus de ${top.pct}%. Voici le choix qui les fait tenir ensemble.`,
      `${top.name} arrive en tête avec ${top.pct}%. Mais pour comprendre ce portefeuille, il faut aussi regarder les autres lignes.`,
    ];
  }
  // Identifiants stables : changer les poids ou l’émetteur ne remet pas la rotation à zéro.
  const recent = history.filter(p => riskId === "manuel"
    ? p.riskId === "manuel"
    : p.profileId === profileId && p.riskId === riskId).slice(-20);
  const last = recent.at(-1);
  const candidates = hooks.map((text, index) => ({ text, id: `${kind}-${index}` }));
  const eligible = candidates.filter(h => h.id !== last?.hookId && h.text !== last?.hookTemplate);
  return eligible.sort((a, b) => recent.filter(p => p.hookId === a.id).length - recent.filter(p => p.hookId === b.id).length)[0] ?? candidates[0];
}

export function buildEditorial(selection, history = [], profileId, riskId, recipe = null) {
  const top = [...selection].sort((a, b) => b.pct - a.pct)[0];
  const euros = selection.find(s => s.id === "fonds_euros");
  const crypto = selection.find(s => s.cat === "crypto");
  const lever = selection.find(s => LEVERAGE.includes(s.id));
  const shared = overlap(selection);
  const { text: hookText, id: hookId } = pickHook(selection, history, profileId, riskId, shared);
  const heading = portfolioHeading(selection, profileId, riskId);
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
    hook: `${heading}\n\n${hookText}`, hookTemplate: hookText, hookId,
    intro: recipe?.description ?? "Voici la place de chaque support, puis ce que leur association implique.",
    sousTitre: "💼 La répartition", logic,
    cta: `💬 Tu garderais ${top.name} à ${top.pct}% ou tu changerais sa place dans cette répartition ?`,
    ctaTemplate: "place-de-la-plus-grosse-ligne", warning: warnings.join(" "),
  };
}

