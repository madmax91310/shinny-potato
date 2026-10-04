import { allocationQuestions } from './allocationEditorial.js';
import { compactHooks, compactRole, portfolioAssetLabel } from './compact.js';
import { assetEditorial } from "./asset-editorial.js";
import { PRO_EUROPE_CORE_IDS } from "./theses.js";

// Le texte décrit la composition finale, indépendamment du profil et du mode.
const WORLD = ["msci_world", "msci_world_ishares", "msci_world_amundi_pea", "msci_acwi", "msci_acwi_ishares", "ftse_allworld_vanguard"];
const SP500 = ["sp500", "sp500_ishares"];
const EURO = ["eurostoxx50", "eurostoxx50_ishares"];
const LEVERAGE = ["lqq", "cl2"];
const isTheme = s => s.id.startsWith("sect_") || ["tech_europe", "infrastructure_ishares"].includes(s.id);
const weight = (selection, test) => selection.filter(test).reduce((sum, s) => sum + s.pct, 0);

function overlap(selection) {
  if (selection.some(s => WORLD.includes(s.id)) && selection.some(s => SP500.includes(s.id))) return "L’indice monde contient déjà des actions américaines : ajouter le S&P 500 renforce cette exposition, avec des entreprises en commun."; 
  if (selection.some(s => EURO.includes(s.id)) && selection.some(s => s.id === "cac40")) return "Le CAC 40 et l’Euro Stoxx 50 ont des entreprises en commun : leurs deux poids ne représentent pas deux expositions indépendantes."; 
  if (selection.filter(s => WORLD.includes(s.id)).length > 1) return "Les indices monde se recoupent largement : plusieurs fonds ne multiplient pas automatiquement la diversification."; 
  if (selection.some(s => assetEditorial(s).kind === "world-all") && selection.some(s => assetEditorial(s).kind === "emerging")) return "L’indice mondial contient déjà des marchés émergents : la ligne ajoutée renforce leur place au lieu d’apporter une exposition entièrement nouvelle.";
  if (selection.filter(s => assetEditorial(s).kind === "factor").length > 1) return "Ces fonds changent les critères de sélection des actions, mais leurs entreprises peuvent se recouper avec celles d’un indice large et entre elles.";
  if (selection.filter(s => SP500.includes(s.id)).length > 1 || selection.filter(s => EURO.includes(s.id)).length > 1) return "Deux fonds suivent ici le même indice : leur exposition se cumule, même si leurs caractéristiques diffèrent."; 
  if (selection.filter(s => s.id.startsWith("bitcoin")).length > 1) return "Plusieurs supports Bitcoin restent exposés au même actif : changer de produit ne diversifie pas le cours suivi."; 
  if (selection.filter(s => s.id === "or" || s.id.startsWith("or_")).length > 1) return "Plusieurs supports sur l’or restent exposés au même métal : leur poids doit se lire ensemble."; 
  return null;
}

const to = label => label.startsWith("le ") ? "au " + label.slice(3) : label.startsWith("les ") ? "aux " + label.slice(4) : "à " + label;
const of = label => label.startsWith("le ") ? "du " + label.slice(3) : label.startsWith("les ") ? "des " + label.slice(4) : label.startsWith("E") ? "d’" + label : "de " + label;

function role(s, selection) {
  const info = assetEditorial(s);
  const euros = selection.find(a => a.id === "fonds_euros");
  let place = "";
  if (selection.length === 1) place = "Ici, on lui confie toute l’épargne : il n’y a aucune autre poche pour prendre le relais.";
  else if (["bitcoin", "ethereum", "leverage"].includes(info.kind)) place = s.pct <= 15
    ? `On limite ici la mise à ${s.pct}% de l’épargne, sans pouvoir rendre ses mouvements plus petits.`
    : `On lui confie ${s.pct}% de l’épargne : ses mouvements deviennent un choix important à assumer dans cette répartition.`;
  else if (s.pct >= 50) place = "On lui confie au moins la moitié de l’épargne : ce choix pèsera donc beaucoup dans le résultat.";

  let link = "";
  if (["world-developed", "world-all"].includes(info.kind) && euros && euros.pct > s.pct) place = `On lui donne ici ${s.pct}% de l’épargne, tout en gardant davantage en fonds euros.`;
  else if (info.kind === "emerging" && selection.some(a => assetEditorial(a).kind === "world-all")) link = " L’indice mondial choisi contient déjà des marchés émergents : cette ligne renforce leur place au lieu de les ajouter pour la première fois.";
  else if (info.kind === "emerging" && selection.some(a => assetEditorial(a).kind === "world-developed")) link = " À côté du World, on ajoute ici des marchés que celui-ci ne couvre pas.";
  else if (info.kind === "us" && selection.some(a => WORLD.includes(a.id))) link = " Le fonds mondial contient déjà des entreprises américaines : on choisit donc de leur donner encore plus de poids.";
  else if (info.kind === "small" && selection.some(a => WORLD.includes(a.id))) link = " À côté de l’indice mondial de grandes et moyennes entreprises, cette ligne fait une place aux plus petites.";
  else if (["bitcoin", "ethereum"].includes(info.kind) && euros) link = s.pct <= 15 ? " Cette petite poche ne joue pas le même rôle que le fonds euros." : " Cette ligne ne joue pas le même rôle que le fonds euros.";
  else if (info.kind === "theme" && selection.some(a => WORLD.includes(a.id))) link = " À côté du fonds mondial, on assume donc une préférence pour ce thème ; certaines entreprises peuvent déjà être présentes dans les deux.";
  return `${info.text}${place ? ` ${place}` : ""}${link}`;
}

const isGold = s => s.id === "or" || s.id.startsWith("or_");
const isBond = s => s.cat === "obligataire" && !["fonds_euros", "monetaire_xeon"].includes(s.id);

function compositionLogic(selection, shared) {
  if (selection.length === 1) return `On confie toute l’épargne ${to(assetEditorial(selection[0]).label)}. On n’a donc qu’une ligne à suivre. Avant de la garder longtemps, l’essentiel est de comprendre ce qu’elle contient et les périodes qui pourraient donner envie de la vendre.`;
  const kinds = new Set(selection.map(s => assetEditorial(s).kind));
  const crypto = weight(selection, s => s.cat === "crypto");
  const developed = kinds.has("world-developed"), allWorld = kinds.has("world-all");
  const sentences = [];
  if (developed || allWorld) sentences.push(allWorld
    ? "L’indice mondial réunit des entreprises des pays développés et émergents."
    : "Le World fait une place aux entreprises des pays développés.");
  if (kinds.has("emerging")) sentences.push(developed && !allWorld
    ? "Les émergents ajoutent des marchés absents du World ; leur poids donne ici une vraie orientation à la poche actions."
    : allWorld ? "La ligne émergente accentue donc un choix déjà présent dans l’indice mondial." : "Les actions émergentes font le choix de marchés aux trajectoires parfois très différentes.");
  const roles = {
    euros: "Le fonds euros garde une partie de l’épargne à l’écart des marchés, quitte à rester derrière quand la Bourse s’envole.",
    "us-equal": "Le S&P 500 équipondéré répartit autrement les grandes entreprises américaines, sans changer leur univers.",
    "us-small": "Le Russell 2000 ajoute les petites entreprises américaines, avec leur sensibilité au financement et à l’économie.",
    "world-ex-us": "Les pays développés hors États-Unis permettent de régler la place américaine à part ; les émergents restent absents de cette ligne.",
    "long-bond": "Les obligations longues en euros ajoutent une forte sensibilité aux taux : elles peuvent varier beaucoup malgré leurs émetteurs d’État.",
    us: "Le S&P 500 donne davantage de place aux grandes entreprises américaines.",
    nasdaq: "Le Nasdaq renforce le choix des grandes entreprises non financières, avec une forte place pour la technologie.",
    leverage: "Le levier amplifie les mouvements quotidiens : sa taille ne suffit pas à mesurer son influence sur le portefeuille.",
    europe: "Les actions européennes portent le choix de cette région.",
    country: "La sélection par pays ajoute une conviction géographique plus précise.",
    region: "La sélection régionale renforce le choix des marchés asiatiques hors Japon.",
    small: "Les petites entreprises élargissent la sélection au-delà des grands groupes.",
    factor: selection.filter(s => assetEditorial(s).kind === "factor").length > 1
      ? "Les fonds à facteurs sélectionnent les actions de façons différentes ; leurs entreprises peuvent se recouper, sans créer autant de marchés indépendants."
      : selection.some(s => s.id === "world_minvol_ishares")
        ? "Les actions à volatilité réduite cherchent à atténuer les secousses de la poche actions, sans sortir de la Bourse."
        : "Le fonds à facteur change les critères de sélection des actions, plutôt que de sortir de la Bourse.",
    gold: "L’or apporte une exposition à un métal, sans revenu à attendre de cette ligne.",
    silver: "L’argent ajoute un métal dont la demande dépend aussi de l’industrie.",
    commodities: "Les matières premières font dépendre une partie du résultat de leurs prix, plutôt que des seuls bénéfices des entreprises.",
    money: "Le monétaire suit les taux courts en euros : on renonce à une exposition aux actions sur cette partie.",
    "short-bond": "Les obligations courtes prêtent aux États sur des échéances rapprochées pour limiter la sensibilité aux taux.",
    bond: "Les autres obligations apportent des prêts aux émetteurs ; leurs cours restent sensibles aux taux et aux risques propres aux emprunts.",
    "high-yield": "Le haut rendement cherche davantage d’intérêts en acceptant des emprunteurs plus fragiles.",
    inflation: "Les obligations indexées lient leurs paiements à l’inflation, mais une hausse des taux réels peut faire baisser le fonds.",
    "em-bond": "La dette émergente ajoute des prêts en monnaies locales, avec leurs propres variations de change.",
    "property-private": "Les SCPI apportent des loyers, en acceptant une revente qui peut prendre du temps.",
    property: "Les foncières apportent l’activité immobilière, tout en restant des actions cotées.",
    dividend: "Les actions à dividendes orientent la sélection vers les versements des entreprises, sans pouvoir compter sur leur maintien.",
    options: "La stratégie à options échange une partie de la hausse possible contre des primes ; elle conserve le risque de baisse des actions.",
    theme: `La conviction porte ici sur ${selection.filter(isTheme).map(s => assetEditorial(s).label).join(" et ")}. La réussite de ces activités ne suffit pas à assurer de bons rendements en Bourse.`,
  };
  if (crypto) sentences.push(`La crypto représente ${crypto}%. ${crypto <= 15 ? "Même une petite ligne peut rendre le portefeuille plus difficile à garder quand ça baisse." : "Ses mouvements peuvent peser fortement sur tout le portefeuille."}`);
  // Lire toutes les familles, en commençant par les plus importantes, sans
  // laisser une priorité de hook masquer une autre poche de la composition.
  const ordered = [...kinds].sort((a, b) => weight(selection, s => assetEditorial(s).kind === b) - weight(selection, s => assetEditorial(s).kind === a));
  for (const kind of ordered) if (roles[kind]) sentences.push(roles[kind]);
  if (selection.some(s => s.distributing === false && ["dividend", "bond", "high-yield", "em-bond", "short-bond", "property"].includes(assetEditorial(s).kind))) sentences.push("Les parts capitalisantes conservent et réinvestissent les revenus.");
  if (shared && !(allWorld && kinds.has("emerging") && shared.startsWith("L’indice mondial contient déjà"))
    && !shared.startsWith("Ces fonds changent les critères")) sentences.push(shared);
  if (kinds.has("theme") && (developed || allWorld)) sentences.push("Certaines entreprises du thème peuvent aussi être présentes dans l’indice mondial.");
  return sentences.join(" ");
}

function scene(selection, shared, profileId, riskId) {
  const top = [...selection].sort((a, b) => b.pct - a.pct)[0];
  const topInfo = assetEditorial(top);
  const euros = weight(selection, s => s.id === "fonds_euros");
  const crypto = weight(selection, s => s.cat === "crypto");
  const cryptoLine = selection.find(s => s.cat === "crypto");
  const cryptoName = cryptoLine ? assetEditorial(cryptoLine).label : "la crypto";
  const lever = selection.find(s => LEVERAGE.includes(s.id));
  const theme = [...selection].filter(isTheme).sort((a, b) => b.pct - a.pct)[0];
  const world = weight(selection, s => WORLD.includes(s.id));
  const small = weight(selection, s => assetEditorial(s).kind === "small");
  const dividends = weight(selection, s => s.cat === "dividendes" && s.id !== "qyld_ucits");
  const bonds = weight(selection, isBond);
  const gold = weight(selection, isGold);
  const inflation = weight(selection, s => s.id === "oblig_inflation");
  const europe = weight(selection, s => PRO_EUROPE_CORE_IDS.includes(s.id));
  const make = (kind, hooks, intro, questions) => ({ kind, hooks, intro, questions });

  if (selection.length === 1) return make("single", [
    `Tu peux faire simple avec un seul support. Encore faut-il savoir ce qu’on lui confie. Regardons ce choix : ${topInfo.label} 👇`,
    `Un seul support pour son épargne, ça évite de multiplier les décisions. Mais est-ce que ${topInfo.label} suffit pour ce que tu recherches ? 👇`,
    `Pas besoin d’une longue liste de fonds pour avoir quelque chose à comprendre. Voici ce qu’implique le choix de tout confier à un seul support 👇`,
  ], "Ici, on fait le choix d’une seule ligne. Son contenu compte donc davantage que le nombre de fonds.",
  [
    `Tu serais à l’aise avec une seule ligne sur ${topInfo.label}, ou tu voudrais autre chose à côté ?`,
    "Tout confier à un seul support, tu trouves ça plus simple à garder ou plus difficile à assumer ?",
  ]);

  if (lever) return make("leverage", [
    "Tu veux pousser un peu plus ta conviction en Bourse. Mais jusqu’où, sans rendre le portefeuille trop difficile à garder quand ça baisse ? Voici un exemple avec du levier 👇",
    "Un ETF à levier peut donner envie quand les marchés montent. La question, c’est la place qu’on est prêt à lui laisser quand ils repartent dans l’autre sens 👇",
    "Chercher davantage de performance, c’est tentant. Accepter des mouvements amplifiés l’est moins. Voici comment un portefeuille peut faire une place au levier 👇",
  ], "On fait ici une place à un ETF à levier. C’est un choix qui mérite de regarder au-delà de la taille de la ligne.",
  [
    `${crypto ? "Tu garderais à la fois la crypto et le levier, ou tu choisirais une seule de ces deux expositions ?" : `Tu garderais les ${lever.pct}% sur cet ETF à levier, ou tu choisirais une exposition sans levier ?`}`,
    "Le levier, tu lui ferais une place dans ton épargne ou tu préfères rester sur des ETF classiques ?",
  ]);

  if (crypto) {
    const other = world ? "le fonds mondial" : euros ? "le fonds euros" : assetEditorial(selection.find(s => s.cat !== "crypto") ?? top).label;
    const combo = world && euros >= 50 && crypto <= 15;
    const hooks = combo ? [
      `Tu veux investir en Bourse et garder un peu ${of(cryptoName)}, mais tu n’as pas envie de voir toute ton épargne faire les montagnes russes. Comment leur faire une place sans leur laisser toute la place ? Voici un exemple 👇`,
      `Tu aimerais garder ${cryptoName} dans ton épargne, sans avoir l’impression que tout dépend de son prochain mouvement. Voici un portefeuille qui lui fait une place, avec des actions et un fonds euros à côté 👇`,
      `Tu peux avoir envie de Bourse et ${of(cryptoName)}, tout en voulant garder une bonne partie de ton épargne à l’écart de leurs secousses. À quoi pourrait ressembler ce mélange ? 👇`,
    ] : crypto <= 15 ? [
      `Tu as envie de faire une place ${to(cryptoName)}, sans en faire le centre de ton épargne. Comment choisir ce qu’on lui met à côté ? Voici un exemple 👇`,
      `Garder un peu ${of(cryptoName)}, oui. Passer ses journées à surveiller son cours, moins. Voici une façon de lui faire une place dans un portefeuille 👇`,
      `On peut s’intéresser ${to(cryptoName)} sans vouloir lui confier l’essentiel de son épargne. Regardons ce qu’on a choisi de garder autour 👇`,
    ] : [
      "Croire à la crypto, c’est assez facile quand elle monte. Garder le même portefeuille quand elle chute demande autre chose. Voici un exemple pour se poser la question 👇",
      "Tu veux donner une vraie place à la crypto dans ton épargne. Avant de regarder ce qu’elle pourrait rapporter, regardons ce que ce choix demande d’assumer 👇",
      "La crypto te tente, mais quel portefeuille serais-tu vraiment capable de garder pendant une mauvaise période ? Voici un exemple 👇",
    ];
    return make(combo ? "crypto-combo" : crypto <= 15 ? "crypto-small" : "crypto-large", hooks,
      crypto === 100 ? "On fait ici le choix de rester entièrement en crypto." : combo ? "On garde ici une base en fonds euros, avec une place pour les entreprises et une autre pour la crypto." : "L’idée est de donner une place à la crypto en regardant aussi ce qu’on choisit autour.",
      crypto < 100 ? [
        `La poche crypto à ${crypto}%, tu la garderais ou tu préférerais donner cette place ${to(other)} ?`,
        `Tu serais à l’aise avec ${crypto}% de crypto dans ton épargne, même pendant une forte chute ?`,
      ] : [
        "Tu garderais toute ton épargne en crypto, ou tu voudrais aussi une poche en dehors ?",
        "Plusieurs cryptos dans le même portefeuille, ça te suffit comme diversification ?",
      ]);
  }

  if (selection.some(s => assetEditorial(s).kind === "options")) return make("income-options", [
    "Recevoir des revenus de son portefeuille, c’est tentant. Mais qu’est-ce qu’on accepte en échange ? Voici un exemple avec des options 👇",
    "Tu aimerais recevoir des versements sans vendre tes parts. Avant de regarder leur montant, regarde ce qui les finance 👇",
    "Un portefeuille qui distribue des revenus peut sembler séduisant. Le choix devient plus intéressant quand on regarde ce qu’il abandonne pour les obtenir 👇",
  ], "Ici, les revenus recherchés ne viennent pas seulement des dividendes : une stratégie vend aussi des options.", [
    "Échanger une partie de la hausse possible contre des primes, c’est un compromis que tu ferais ?",
    "Tu préférerais ces distributions ou garder davantage de participation à une forte hausse des actions ?",
    "Dans ce mélange, tu garderais la stratégie à options ou tu chercherais tes revenus ailleurs ?",
  ]);

  if (dividends >= 10 && (profileId === "rentier" || selection.some(s => assetEditorial(s).kind === "dividend" && s.distributing)) && (bonds >= 10 || euros || selection.some(s => s.cat === "immobilier"))) return make("income", [
    "Recevoir des revenus de son portefeuille, c’est tentant. Mais qu’est-ce qu’on accepte en échange ? Voici un exemple 👇",
    "Un gros dividende attire vite l’œil. Pour construire un portefeuille, il faut aussi regarder d’où vient l’argent et ce qui peut faire baisser le capital 👇",
    "Tu aimerais que ton épargne apporte des revenus, sans tout faire dépendre des dividendes. À quoi pourrait ressembler ce choix ? 👇",
  ], "On associe les actions à dividendes à d’autres placements, pour regarder plusieurs sources de revenus.", [
    bonds ? "Tu chercherais tes revenus plutôt dans les dividendes ou dans les intérêts des obligations ?" : "Pour recevoir des revenus, tu garderais ce mélange ou tu préférerais simplifier ?",
    "Pour ton épargne, tu chercherais surtout des versements réguliers ou la croissance du capital ?",
    "Tu accepterais des versements moins élevés pour dépendre moins des actions à dividendes ?",
  ]);

  if (europe >= 70 && bonds >= 40) return make("europe-lending", [
    "Investir en Europe, ça ne veut pas forcément dire acheter ses actions. Voici un portefeuille qui fait aussi le choix de lui prêter 👇",
    "Tu veux garder une préférence pour l’Europe sans tout faire dépendre de ses Bourses. Quels placements peuvent accompagner ce choix ? 👇",
    "On parle souvent d’actions quand on veut investir en Europe. Ce portefeuille part d’une autre question : quelle place donner aux emprunts ? 👇",
  ], "La préférence européenne passe ici largement par les obligations, avec les autres placements à côté.", [
    "Pour investir en Europe, tu préférerais prêter aux émetteurs ou détenir davantage d’actions ?",
    "Dans ce portefeuille, tu garderais la place des obligations ou tu renforcerais la poche actions ?",
    "Cette préférence pour l’Europe, tu l’exprimerais aussi à travers les obligations ?",
  ]);

  if (selection.filter(s => assetEditorial(s).kind === "factor").length > 1) return make("factors", [
    "Plusieurs fonds choisissent les actions avec des critères différents. Mais achètes-tu vraiment des entreprises différentes ? Regardons derrière les étiquettes 👇",
    "Tu peux choisir les actions pour leur solidité, leur tendance ou leurs variations. Que se passe-t-il quand tu réunis plusieurs de ces approches ? 👇",
    "Plusieurs stratégies dans un portefeuille, ça peut sembler complémentaire. Encore faut-il regarder les entreprises qu’elles choisissent 👇",
  ], "On associe plusieurs critères de sélection des actions. Leur contenu compte autant que leur nom.", [
    "Tu garderais plusieurs méthodes de sélection, ou tu préférerais une seule ligne mondiale ?",
    "Parmi ces approches, laquelle te semblerait la plus facile à garder quand elle déçoit ?",
    "Tu chercherais à combiner ces stratégies ou tu choisirais celle que tu comprends le mieux ?",
  ]);

  if (shared) return make("overlap", [
    "Tu ajoutes un fonds en pensant élargir ton portefeuille. Mais si tu achetais surtout davantage de ce que tu possèdes déjà ? Regardons cet exemple 👇",
    "Deux noms de fonds différents, ça donne vite l’impression de diversifier. Avant d’en ajouter un, voici ce qui mérite un coup d’œil 👇",
    "On peut multiplier les lignes et retrouver les mêmes entreprises derrière. Voici un portefeuille qui pose justement cette question 👇",
  ], "Ici, il faut regarder les expositions qui se répètent avant de compter les fonds.",
  [
    selection.some(s => SP500.includes(s.id)) ? "Les entreprises américaines sont déjà dans l’indice mondial. Tu renforcerais leur place ou tu garderais une seule ligne ?" : "Tu garderais ces fonds qui se recoupent pour renforcer ta conviction, ou tu simplifierais ?",
    "Ces expositions en commun, c’est un choix que tu ferais ou une raison de retirer une ligne ?",
  ]);

  if (euros >= 50 && profileId === "bouclier" && riskId !== "manuel") return make("shield-euros", [
    "Un portefeuille peut sembler rassurant sur le papier. Le vrai test, c’est de pouvoir le garder quand les marchés baissent. Voici une construction à examiner 👇",
    "Tu veux investir sans que chaque mauvaise semaine en Bourse te donne envie de tout vendre. Voici un portefeuille construit autour de cette question 👇",
    "Quand ça baisse, on découvre parfois que son portefeuille était trop difficile à garder. Comment faire une place aux marchés sans tout leur confier ? 👇",
  ], "Le fonds euros sert de base. Les autres lignes ouvrent une place aux marchés autour de ce choix.", [
    "Tu garderais cette place pour le fonds euros, ou tu accepterais davantage de variations pour investir plus sur les marchés ?",
    "Dans cette construction, quelle ligne risquerait le plus de te donner envie de vendre pendant une baisse ?",
    "Tu préférerais garder cette base en fonds euros ou réduire davantage la poche actions ?",
  ]);

  if (euros >= 50) return make("euros-majority", [
    "Tu veux investir, mais tu sais que tu vivrais mal une grosse baisse de ton épargne. Quelle place laisser aux marchés pour avoir envie de garder le portefeuille ? Voici un exemple 👇",
    "Quand la Bourse monte, on voudrait souvent en avoir davantage. Quand elle baisse, on est parfois content d’en avoir moins. Voici un portefeuille construit autour de cette hésitation 👇",
    "Tu n’as pas besoin que toute ton épargne suive les marchés pour avoir envie d’investir. Voici un exemple qui laisse une vraie place au fonds euros 👇",
  ], `On garde ici ${euros > 50 ? "la majorité" : "la moitié"} du capital en fonds euros. Les autres lignes servent à investir au-delà de cette base.`,
  [
    "Tu garderais cette place pour le fonds euros, ou tu accepterais davantage de variations pour investir plus sur les marchés ?",
    "Tu préfères une grosse place pour le fonds euros, ou tu aurais peur de trop rester à l’écart des marchés ?",
  ]);

  if (inflation >= 25 && inflation >= top.pct) return make("inflation", [
    "Tu vois les prix grimper et tu te demandes où placer ton épargne. L’or vient vite à l’esprit, mais les obligations indexées méritent aussi qu’on s’y arrête. Voici un exemple 👇",
    "On aimerait que son épargne suive la hausse des prix. Mais quels actifs choisir pour ça, et qu’accepte-t-on en échange ? Voici un portefeuille pour en discuter 👇",
    "Quand l’inflation inquiète, il est tentant de chercher une solution évidente. Ce portefeuille permet de regarder de plus près le choix des obligations indexées 👇",
  ], "Les obligations indexées ont ici une place importante. Il faut comprendre ce que leur lien avec l’inflation change, et ce qu’il ne change pas.",
  [
    gold ? "Pour cette idée de portefeuille, tu donnerais davantage de place aux obligations indexées ou à l’or ?" : `Tu garderais ${inflation}% d’obligations indexées ou tu chercherais à répartir davantage ?`,
    "Les obligations indexées, c’est une poche que tu choisirais pour ton épargne ou que tu voudrais d’abord mieux comprendre ?",
  ]);

  if (inflation >= 25 && gold >= 25) return make("inflation-gold", [
    "Quand les prix grimpent, l’or vient vite à l’esprit. Mais les obligations indexées font un autre pari. Voici un portefeuille qui les associe 👇",
    "Tu voudrais que ton épargne résiste mieux à la hausse des prix. Avant de choisir l’or ou les obligations indexées, regarde ce qui les fait bouger 👇",
    "L’or et les obligations indexées reviennent souvent quand on parle d’inflation. Les réunir demande quand même de comprendre leurs différences 👇",
  ], "On associe ici deux façons différentes d’aborder l’inflation, avec les autres placements autour.", [
    "Dans ce mélange, tu donnerais davantage de place à l’or ou aux obligations indexées ?",
    "Tu garderais ces deux expositions ou tu préférerais une construction plus simple ?",
    "Lequel de ces deux choix te semble le plus facile à garder pendant une mauvaise période ?",
  ]);

  if (theme && theme.pct >= 25) {
    const label = assetEditorial(theme).label;
    return make("theme", [
      `Tu crois au potentiel ${of(label)}. Mais jusqu’où pousser cette conviction dans ton épargne ? Voici un exemple 👇`,
      `Un thème peut te convaincre sans que tu aies envie d’y mettre toute ton épargne. Regardons comment faire une place ${to(label)} dans un portefeuille 👇`,
      `Tu peux t’intéresser ${to(label)} sans vouloir tout miser sur ce thème. Voici un portefeuille pour regarder où placer le curseur 👇`,
    ], `On assume ici une préférence pour ${label}. Regardons aussi ce qu’on lui associe.`,
    [
      `Tu donnerais ${theme.pct}% de ton épargne ${to(label)}, ou tu garderais cette conviction dans une poche plus petite ?`,
      "Un thème qui te plaît, tu préfères lui réserver une petite place ou en faire une partie importante du portefeuille ?",
    ]);
  }

  if (europe >= 70) return make("europe", [
    "Tu as envie de donner davantage de place à l’Europe dans ton épargne. Mais comment faire ce choix sans le résumer à quelques grandes entreprises françaises ? Voici un exemple 👇",
    "Investir près de chez soi, ça peut sembler plus naturel. Encore faut-il regarder quels marchés européens on choisit et ce qu’on laisse de côté 👇",
    "Tu préfères donner du poids à l’Europe plutôt que suivre simplement un indice mondial. Voici ce que peut donner cette conviction dans un portefeuille 👇",
  ], "On fait ici un choix géographique assumé en faveur du bloc Europe.",
  [
    "Tu ferais aussi une grande place à l’Europe, ou tu préférerais laisser un indice mondial répartir davantage ?",
    `Cette place de ${europe}% pour le bloc Europe, tu l’assumerais sur la durée ?`,
  ]);

  const emerging = weight(selection, s => assetEditorial(s).kind === "emerging");
  if (world && emerging >= 25) return make("world-emerging", [
    "Un World paraît déjà très large. Pourtant, certains marchés restent en dehors. Voici un portefeuille qui leur donne une vraie place 👇",
    "Investir dans le monde, d’accord. Mais faut-il laisser aux marchés émergents une petite place ou en faire un choix plus fort ? 👇",
    "Tu peux choisir une base mondiale et vouloir aller plus loin dans les marchés émergents. Voici ce que ce choix change dans un portefeuille 👇",
  ], "Les marchés émergents ont ici une place importante à côté de la base mondiale.", [
    "Tu garderais cette place pour les émergents ou tu renforcerais plutôt le World ?",
    "Les marchés émergents, tu voudrais les ajouter toi-même ou les laisser dans un indice mondial qui les inclut déjà ?",
    "Cette préférence pour les émergents, tu serais à l’aise pour la garder longtemps ?",
  ]);

  if (world && small) return make("world-small", [
    "Un indice mondial fait déjà une place à beaucoup d’entreprises. Alors pourquoi ajouter les plus petites à côté ? Voici un exemple 👇",
    "On parle souvent des géants de la Bourse. Tu voudrais aussi investir dans les plus petites entreprises ? Regardons comment leur faire une place 👇",
    "Tu peux garder une base mondiale simple et avoir envie d’aller au-delà des grandes entreprises. Voici un portefeuille qui fait ce choix 👇",
  ], "On associe ici un indice mondial de grandes et moyennes entreprises à une poche de petites capitalisations.",
  [
    `Tu ferais une place de ${small}% aux petites capitalisations, ou tu garderais seulement l’indice mondial ?`,
    "Les petites entreprises, tu aimerais les ajouter à ton portefeuille ou tu préfères garder une seule ligne mondiale ?",
  ]);

  if (gold >= 25) return make("gold", [
    "Tu voudrais que ton épargne ne repose pas seulement sur les entreprises. L’or peut donner envie, mais quelle place lui laisser quand il ne verse aucun revenu ? Voici un exemple 👇",
    "L’or attire souvent quand les marchés inquiètent. Mais un portefeuille, ça se garde aussi lorsque l’inquiétude retombe. Regardons la place qu’on lui fait 👇",
    "Ajouter de l’or paraît simple. Décider ce qu’on accepte de lui confier l’est moins. Voici un portefeuille pour se poser la question 👇",
  ], "On donne ici une place importante à l’or, avec d’autres supports autour.",
  [
    `Tu garderais ${gold}% d’or, ou tu préférerais faire plus de place aux autres supports ?`,
    "Une poche qui ne verse aucun revenu, ça te convient si elle apporte une autre exposition ?",
  ]);

  return make(top.pct >= 50 ? "dominant" : "balanced", [
    `Tu aimerais faire une place ${to(topInfo.label)} dans ton épargne. Mais que choisir pour accompagner cette idée ? Voici un portefeuille pour en discuter 👇`,
    "On choisit facilement un placement qui nous plaît. Le faire tenir avec les autres demande un peu plus de réflexion. Regardons ce portefeuille 👇",
    "Quels placements serais-tu capable de garder ensemble quand les marchés deviennent moins confortables ? Voici un exemple pour en discuter 👇",
  ], "Chaque ligne a ici une place précise. Regardons ce qu’on lui demande et ce qu’on accepte en échange.",
  [
    `Tu garderais ${topInfo.label} à ${top.pct}%, ou tu donnerais davantage de place à une autre ligne ?`,
    "Dans cette répartition, quelle ligne garderais-tu en priorité et laquelle retirerais-tu ?",
  ]);
}

function rotate(texts, family, history, field) {
  const last = history.at(-1);
  const candidates = texts.map((text, index) => ({ text, id: `${family}-${index}` }));
  const matches = (p, candidate) => p?.[field] === candidate.id || (field === "hookId" ? p?.hookTemplate === candidate.text : p?.cta === `💬 ${candidate.text}`);
  const eligible = candidates.filter(h => !matches(last, h));
  return eligible.sort((a, b) => history.filter(p => matches(p, a)).length - history.filter(p => matches(p, b)).length)[0] ?? candidates[0];
}

export function buildEditorial(selection, history = [], profileId, riskId) {
  const shared = overlap(selection);
  const content = scene(selection, shared, profileId, riskId);
  // Une série de publications peut alterner profils, paliers et mode manuel.
  const recent = history.slice(-20);
  const hook = rotate(compactHooks(selection), content.kind, recent, "hookId");
  const cta = rotate(allocationQuestions(selection) ?? content.questions, content.kind, recent, "ctaTemplate");
  const lever = selection.some(s => LEVERAGE.includes(s.id));
  const warnings = [];
  if (lever) warnings.push("Le levier 2x est quotidien, pas une multiplication par deux du rendement sur plusieurs années.");
  if (selection.some(s => s.distributing || s.id === "qyld_ucits" || s.id === "scpi")) warnings.push("Les distributions ne sont pas garanties et peuvent accompagner une baisse du capital.");
  return {
    selection: selection.map(s => ({ ...s, desc: assetEditorial(s).description, pourquoi: role(s, selection), shortRole: compactRole(s, selection), shortName: portfolioAssetLabel(s) })),
    hook: hook.text,
    hookTemplate: hook.text, hookId: hook.id,
    intro: content.intro, sousTitre: "💼 La répartition", logic: compositionLogic(selection, shared),
    cta: `💬 ${cta.text}`, ctaTemplate: cta.id, warning: warnings.join(" "),
  };
}
