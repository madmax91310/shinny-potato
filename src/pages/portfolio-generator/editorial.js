import { assetEditorial } from "./asset-editorial.js";
import { PROFILES, PRO_EUROPE_CORE_IDS } from "./theses.js";

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
  if (selection.filter(s => SP500.includes(s.id)).length > 1 || selection.filter(s => EURO.includes(s.id)).length > 1) return "Deux fonds suivent ici le même indice : leur exposition se cumule, même si leurs caractéristiques diffèrent."; 
  if (selection.filter(s => s.id.startsWith("bitcoin")).length > 1) return "Plusieurs supports Bitcoin restent exposés au même actif : changer de produit ne diversifie pas le cours suivi."; 
  if (selection.filter(s => s.id === "or" || s.id.startsWith("or_")).length > 1) return "Plusieurs supports sur l’or restent exposés au même métal : leur poids doit se lire ensemble."; 
  return null;
}

const to = label => label.startsWith("le ") ? "au " + label.slice(3) : label.startsWith("les ") ? "aux " + label.slice(4) : "à " + label;
const of = label => label.startsWith("le ") ? "du " + label.slice(3) : label.startsWith("les ") ? "des " + label.slice(4) : label.startsWith("E") ? "d’" + label : "de " + label;

function role(s, selection) {
  const info = assetEditorial(s);
  const top = [...selection].sort((a, b) => b.pct - a.pct)[0];
  const euros = selection.find(a => a.id === "fonds_euros");
  let place;
  if (selection.length === 1) place = "Ici, on lui confie toute l’épargne : il n’y a aucune autre poche pour prendre le relais.";
  else if (info.kind === "euros") place = s.pct >= 50
    ? `On lui laisse ${s.pct}% du capital : au moins la moitié de l’épargne reste donc en fonds euros.`
    : `Avec ${s.pct}% du capital, on garde une partie en fonds euros, mais la majorité reste investie ailleurs.`;
  else if (["bitcoin", "ethereum", "leverage"].includes(info.kind)) place = s.pct <= 15
    ? `On limite ici la mise à ${s.pct}% de l’épargne, sans pouvoir rendre ses mouvements plus petits.`
    : `On lui confie ${s.pct}% de l’épargne : ses mouvements deviennent un choix important à assumer dans cette répartition.`;
  else if (s.pct >= 50) place = `Avec ${s.pct}% du capital, on lui confie au moins la moitié de l’épargne. Son parcours comptera donc beaucoup dans le résultat.`;
  else if (s.pct <= 15) place = `On lui réserve ${s.pct}% du capital : une place complémentaire, sans lui confier l’essentiel de l’épargne.`;
  else if (s === top && selection.filter(a => a.pct === s.pct).length === 1) place = `Avec ${s.pct}%, c’est la plus grosse ligne, mais on garde davantage de capital dans les autres poches réunies.`;
  else place = `On lui donne ${s.pct}% du capital : assez pour compter dans le résultat, tout en laissant de la place aux autres choix.`;

  let link = "";
  if (["world-developed", "world-all"].includes(info.kind) && euros && euros.pct > s.pct) place = `On lui donne ici ${s.pct}% de l’épargne, tout en gardant davantage en fonds euros.`;
  else if (info.kind === "emerging" && selection.some(a => assetEditorial(a).kind === "world-developed")) link = " À côté du World, on ajoute ici des marchés que celui-ci ne couvre pas.";
  else if (info.kind === "emerging" && selection.some(a => assetEditorial(a).kind === "world-all")) link = " L’indice mondial choisi contient déjà des marchés émergents : cette ligne renforce leur place au lieu de les ajouter pour la première fois.";
  else if (info.kind === "us" && selection.some(a => WORLD.includes(a.id))) link = " Le fonds mondial contient déjà des entreprises américaines : on choisit donc de leur donner encore plus de poids.";
  else if (info.kind === "small" && selection.some(a => WORLD.includes(a.id))) link = " À côté de l’indice mondial de grandes et moyennes entreprises, cette ligne fait une place aux plus petites.";
  else if (["bitcoin", "ethereum"].includes(info.kind) && euros) link = s.pct <= 15 ? " Cette petite poche ne joue pas le même rôle que le fonds euros." : " Cette ligne ne joue pas le même rôle que le fonds euros.";
  else if (info.kind === "theme" && selection.some(a => WORLD.includes(a.id))) link = " À côté du fonds mondial, on assume donc une préférence pour ce thème ; certaines entreprises peuvent déjà être présentes dans les deux.";
  return `${info.text} ${place}${link}`;
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
  const make = (kind, hooks, intro, logic, questions) => ({ kind, hooks, intro, logic, questions });

  if (selection.length === 1) return make("single", [
    `Tu peux faire simple avec un seul support. Encore faut-il savoir ce qu’on lui confie. Regardons ce choix : ${topInfo.label} 👇`,
    `Un seul support pour son épargne, ça évite de multiplier les décisions. Mais est-ce que ${topInfo.label} suffit pour ce que tu recherches ? 👇`,
    `Pas besoin d’une longue liste de fonds pour avoir quelque chose à comprendre. Voici ce qu’implique le choix de tout confier à un seul support 👇`,
  ], "Ici, on fait le choix d’une seule ligne. Son contenu compte donc davantage que le nombre de fonds.",
  `On confie toute l’épargne ${to(topInfo.label)}. On n’a donc qu’une ligne à suivre. Avant de la garder longtemps, l’essentiel est de comprendre ce qu’elle contient et les périodes qui pourraient donner envie de la vendre.`, [
    `Tu serais à l’aise avec une seule ligne sur ${topInfo.label}, ou tu voudrais autre chose à côté ?`,
    "Tout confier à un seul support, tu trouves ça plus simple à garder ou plus difficile à assumer ?",
  ]);

  if (lever) return make("leverage", [
    "Tu veux pousser un peu plus ta conviction en Bourse. Mais jusqu’où, sans rendre le portefeuille trop difficile à garder quand ça baisse ? Voici un exemple avec du levier 👇",
    "Un ETF à levier peut donner envie quand les marchés montent. La question, c’est la place qu’on est prêt à lui laisser quand ils repartent dans l’autre sens 👇",
    "Chercher davantage de performance, c’est tentant. Accepter des mouvements amplifiés l’est moins. Voici comment un portefeuille peut faire une place au levier 👇",
  ], "On fait ici une place à un ETF à levier. C’est un choix qui mérite de regarder au-delà de la taille de la ligne.",
  `On réserve ${lever.pct}% ${to(assetEditorial(lever).label)}. Le levier amplifie les mouvements quotidiens : cette poche peut se faire sentir bien davantage que sa taille ne le laisse imaginer.${crypto ? ` On ajoute aussi ${crypto}% de crypto ; ces deux choix demandent de pouvoir supporter de fortes secousses.` : " Les autres lignes ne font pas disparaître ce risque."}`, [
    `Tu garderais les ${lever.pct}% sur cet ETF à levier, ou tu choisirais une exposition sans levier ?`,
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
    return make(crypto <= 15 ? "crypto-small" : "crypto-large", hooks,
      crypto === 100 ? "On fait ici le choix de rester entièrement en crypto." : combo ? "On garde ici une base en fonds euros, avec une place pour les entreprises et une autre pour la crypto." : "L’idée est de donner une place à la crypto en regardant aussi ce qu’on choisit autour.",
      `${euros ? `Le fonds euros garde ${euros}% du capital. ` : ""}${world ? `Les indices mondiaux prennent ${world}% pour investir dans les entreprises. ` : ""}La crypto représente ${crypto}%. ${crypto <= 15 ? "On limite le capital qu’on lui confie, mais une petite ligne peut suffire à rendre le portefeuille plus difficile à garder quand ça baisse." : "On lui donne une vraie place : ses variations deviennent donc une partie importante du choix à assumer."}${shared ? ` ${shared}` : ""}`, crypto < 100 ? [
        `La poche crypto à ${crypto}%, tu la garderais ou tu préférerais donner cette place ${to(other)} ?`,
        `Tu serais à l’aise avec ${crypto}% de crypto dans ton épargne, même pendant une forte chute ?`,
      ] : [
        "Tu garderais toute ton épargne en crypto, ou tu voudrais aussi une poche en dehors ?",
        "Plusieurs cryptos dans le même portefeuille, ça te suffit comme diversification ?",
      ]);
  }

  if (shared) return make("overlap", [
    "Tu ajoutes un fonds en pensant élargir ton portefeuille. Mais si tu achetais surtout davantage de ce que tu possèdes déjà ? Regardons cet exemple 👇",
    "Deux noms de fonds différents, ça donne vite l’impression de diversifier. Avant d’en ajouter un, voici ce qui mérite un coup d’œil 👇",
    "On peut multiplier les lignes et retrouver les mêmes entreprises derrière. Voici un portefeuille qui pose justement cette question 👇",
  ], "Ici, il faut regarder les expositions qui se répètent avant de compter les fonds.",
  shared + " Ce mélange peut être volontaire. Il faut simplement savoir ce qu’on renforce en ajoutant chaque ligne.", [
    "Tu garderais ces fonds qui se recoupent pour renforcer ta conviction, ou tu simplifierais ?",
    "Ces expositions en commun, c’est un choix que tu ferais ou une raison de retirer une ligne ?",
  ]);

  if (euros >= 50) return make("euros-majority", [
    "Tu veux investir, mais tu sais que tu vivrais mal une grosse baisse de ton épargne. Quelle place laisser aux marchés pour avoir envie de garder le portefeuille ? Voici un exemple 👇",
    "Quand la Bourse monte, on voudrait souvent en avoir davantage. Quand elle baisse, on est parfois content d’en avoir moins. Voici un portefeuille construit autour de cette hésitation 👇",
    "Tu n’as pas besoin que toute ton épargne suive les marchés pour avoir envie d’investir. Voici un exemple qui laisse une vraie place au fonds euros 👇",
  ], `On garde ici ${euros > 50 ? "la majorité" : "la moitié"} du capital en fonds euros. Les autres lignes servent à investir au-delà de cette base.`,
  `On laisse ${euros}% au fonds euros pour ne pas exposer toute l’épargne aux marchés. Les ${100 - euros}% restants portent les autres choix détaillés plus haut. Cela peut rendre les secousses plus faciles à supporter, mais aussi frustrer lorsque les marchés montent fortement.`, [
    `Tu garderais ${euros}% en fonds euros, ou tu accepterais de bouger davantage pour investir plus sur les marchés ?`,
    "Tu préfères une grosse place pour le fonds euros, ou tu aurais peur de trop rester à l’écart des marchés ?",
  ]);

  if (inflation >= 25 && inflation >= top.pct) return make("inflation", [
    "Tu vois les prix grimper et tu te demandes où placer ton épargne. L’or vient vite à l’esprit, mais les obligations indexées méritent aussi qu’on s’y arrête. Voici un exemple 👇",
    "On aimerait que son épargne suive la hausse des prix. Mais quels actifs choisir pour ça, et qu’accepte-t-on en échange ? Voici un portefeuille pour en discuter 👇",
    "Quand l’inflation inquiète, il est tentant de chercher une solution évidente. Ce portefeuille permet de regarder de plus près le choix des obligations indexées 👇",
  ], "Les obligations indexées ont ici une place importante. Il faut comprendre ce que leur lien avec l’inflation change, et ce qu’il ne change pas.",
  `On confie ${inflation}% aux obligations indexées.${gold ? ` L’or prend aussi ${gold}% pour ajouter une exposition au métal.` : ""} On fait ce choix sans pouvoir promettre que le portefeuille gagnera lorsque les prix montent. Les taux réels peuvent notamment faire baisser les obligations indexées.`, [
    gold ? "Pour cette idée de portefeuille, tu donnerais davantage de place aux obligations indexées ou à l’or ?" : `Tu garderais ${inflation}% d’obligations indexées ou tu chercherais à répartir davantage ?`,
    "Les obligations indexées, c’est une poche que tu choisirais pour ton épargne ou que tu voudrais d’abord mieux comprendre ?",
  ]);

  if (theme && theme.pct >= 25) {
    const label = assetEditorial(theme).label;
    return make("theme", [
      `Tu crois au potentiel ${of(label)}. Mais quelle place lui donner dans ton épargne sans tout faire dépendre de cette conviction ? Voici un exemple 👇`,
      `Un thème peut te convaincre sans que tu aies envie d’y mettre toute ton épargne. Regardons comment faire une place ${to(label)} dans un portefeuille 👇`,
      `On peut croire ${to(label)} et rester prudent sur les actions qu’on achète. Voici un portefeuille pour regarder où placer le curseur 👇`,
    ], `On assume ici une préférence pour ${label}. Regardons aussi ce qu’on lui associe.`,
    `On réserve ${theme.pct}% ${to(label)}.${world ? ` Les indices mondiaux prennent ${world}% pour garder une sélection d’entreprises plus large, avec des sociétés qui peuvent aussi être présentes dans le thème.` : " Le reste va aux autres supports détaillés plus haut. Il faut regarder leur contenu : plusieurs fonds peuvent garder une conviction très proche."} Le point à regarder est la place donnée à cette préférence : croire à ses usages ne garantit pas de bons rendements pour ses actions.`, [
      `Tu donnerais ${theme.pct}% de ton épargne ${to(label)}, ou tu garderais cette conviction dans une poche plus petite ?`,
      "Un thème qui te plaît, tu préfères lui réserver une petite place ou en faire une partie importante du portefeuille ?",
    ]);
  }

  if (europe >= 70) return make("europe", [
    "Tu as envie de donner davantage de place à l’Europe dans ton épargne. Mais comment faire ce choix sans le résumer à quelques grandes entreprises françaises ? Voici un exemple 👇",
    "Investir près de chez soi, ça peut sembler plus naturel. Encore faut-il regarder quels marchés européens on choisit et ce qu’on laisse de côté 👇",
    "Tu préfères donner du poids à l’Europe plutôt que suivre simplement un indice mondial. Voici ce que peut donner cette conviction dans un portefeuille 👇",
  ], "On fait ici un choix géographique assumé en faveur du bloc Europe.",
  `On consacre ${europe}% aux placements européens de cette sélection. On donne donc beaucoup de place à ces marchés, en acceptant de dépendre davantage de leur parcours.${europe < 100 ? ` Les ${100 - europe}% restants apportent les autres expositions choisies.` : " Toute l’épargne reste dans ce bloc géographique."}`, [
    "Tu ferais aussi une grande place à l’Europe, ou tu préférerais laisser un indice mondial répartir davantage ?",
    `Cette place de ${europe}% pour le bloc Europe, tu l’assumerais sur la durée ?`,
  ]);

  if (dividends >= 10 && (profileId === "rentier" || riskId === "manuel" || dividends >= 40) && (bonds >= 10 || selection.some(s => s.cat === "immobilier"))) return make("income", [
    "Tu aimerais que ton épargne apporte des revenus. Mais faut-il pour autant tout miser sur les actions à dividendes ? Voici un exemple qui leur donne de la compagnie 👇",
    "Un gros dividende attire vite l’œil. Pour construire un portefeuille, il faut aussi regarder d’où vient l’argent et ce qui peut faire baisser le capital 👇",
    "Les dividendes te plaisent, mais tu n’as pas envie que tout repose sur les mêmes entreprises. Voici comment les associer à d’autres placements 👇",
  ], "On fait une place aux actions à dividendes, en leur associant d’autres types de placements.",
  `Les actions sélectionnées pour leurs dividendes prennent ${dividends}%.${bonds ? ` Les obligations occupent ${bonds}% : on prête aux émetteurs au lieu d’acheter leurs actions.` : " L’immobilier ajoute une autre activité économique, dont le rôle dépend aussi du support coté ou non coté choisi."} On regarde donc plusieurs façons d’investir, plutôt que de choisir seulement les plus gros dividendes. Pour les versements, il faut aussi choisir des parts qui distribuent leurs revenus.`, [
    bonds ? "Tu donnerais davantage de place aux actions à dividendes ou aux obligations ?" : "Tu garderais ce mélange de dividendes et d’immobilier, ou tu préférerais simplifier ?",
    "Pour ton épargne, tu chercherais surtout des versements réguliers ou la croissance du capital ?",
  ]);

  if (world && small) return make("world-small", [
    "Un indice mondial fait déjà une place à beaucoup d’entreprises. Alors pourquoi ajouter les plus petites à côté ? Voici un exemple 👇",
    "On parle souvent des géants de la Bourse. Tu voudrais aussi investir dans les plus petites entreprises ? Regardons comment leur faire une place 👇",
    "Tu peux garder une base mondiale simple et avoir envie d’aller au-delà des grandes entreprises. Voici un portefeuille qui fait ce choix 👇",
  ], "On associe ici un indice mondial de grandes et moyennes entreprises à une poche de petites capitalisations.",
  `Les indices mondiaux prennent ${world}%, les petites capitalisations ${small}%. On cherche donc à élargir la taille des entreprises retenues, plutôt qu’à ajouter un autre émetteur sur le même indice. Cette poche peut aussi rendre les variations plus difficiles à supporter.`, [
    `Tu ferais une place de ${small}% aux petites capitalisations, ou tu garderais seulement l’indice mondial ?`,
    "Les petites entreprises, tu aimerais les ajouter à ton portefeuille ou tu préfères garder une seule ligne mondiale ?",
  ]);

  if (gold >= 25) return make("gold", [
    "Tu voudrais que ton épargne ne repose pas seulement sur les entreprises. L’or peut donner envie, mais quelle place lui laisser quand il ne verse aucun revenu ? Voici un exemple 👇",
    "L’or attire souvent quand les marchés inquiètent. Mais un portefeuille, ça se garde aussi lorsque l’inquiétude retombe. Regardons la place qu’on lui fait 👇",
    "Ajouter de l’or paraît simple. Décider ce qu’on accepte de lui confier l’est moins. Voici un portefeuille pour se poser la question 👇",
  ], "On donne ici une place importante à l’or, avec d’autres supports autour.",
  `On réserve ${gold}% à l’or. Cette partie du portefeuille ne produit ni intérêts ni dividendes : on dépend de l’évolution du métal. Les autres lignes gardent leurs propres expositions, mais rien n’assure qu’elles compenseront une baisse de l’or.`, [
    `Tu garderais ${gold}% d’or, ou tu préférerais faire plus de place aux autres supports ?`,
    "Une poche qui ne verse aucun revenu, ça te convient si elle apporte une autre exposition ?",
  ]);

  return make(top.pct >= 50 ? "dominant" : "balanced", [
    `Tu aimerais faire une place ${to(topInfo.label)} dans ton épargne. Mais que choisir pour accompagner cette idée ? Voici un portefeuille pour en discuter 👇`,
    "On choisit facilement un placement qui nous plaît. Le faire tenir avec les autres demande un peu plus de réflexion. Regardons ce portefeuille 👇",
    "Quels placements serais-tu capable de garder ensemble quand les marchés deviennent moins confortables ? Voici un exemple pour en discuter 👇",
  ], "Chaque ligne a ici une place précise. Regardons ce qu’on lui demande et ce qu’on accepte en échange.",
  top.pct >= 50 ? `On confie ${top.pct}% ${to(topInfo.label)}. C’est le choix qui prend au moins la moitié du capital ; les autres lignes servent à garder une place pour d’autres expositions. Elles ne garantissent pas qu’une mauvaise période sera compensée.` : `La plus grosse ligne, ${topInfo.label}, prend ${top.pct}%. On répartit donc davantage entre les autres choix, mais plusieurs lignes peuvent quand même baisser ensemble. La diversification se juge aussi sur ce qu’elles contiennent.`, [
    `Tu garderais ${topInfo.label} à ${top.pct}%, ou tu donnerais davantage de place à une autre ligne ?`,
    "Dans cette répartition, quelle ligne garderais-tu en priorité et laquelle retirerais-tu ?",
  ]);
}

function rotate(texts, family, history, field) {
  const last = history.at(-1);
  const candidates = texts.map((text, index) => ({ text, id: `${family}-${index}` }));
  const eligible = candidates.filter(h => h.id !== last?.[field]);
  return eligible.sort((a, b) => history.filter(p => p[field] === a.id).length - history.filter(p => p[field] === b.id).length)[0] ?? candidates[0];
}

export function buildEditorial(selection, history = [], profileId, riskId) {
  const shared = overlap(selection);
  const content = scene(selection, shared, profileId, riskId);
  const recent = history.filter(p => riskId === "manuel" ? p.riskId === "manuel" : p.profileId === profileId && p.riskId === riskId).slice(-20);
  const hook = rotate(content.hooks, content.kind, recent, "hookId");
  const cta = rotate(content.questions, content.kind, recent, "ctaTemplate");
  const lever = selection.some(s => LEVERAGE.includes(s.id));
  const warnings = ["La pire année simulée ne constitue pas une perte maximale : d’autres périodes peuvent être plus défavorables."];
  if (lever) warnings.push("Le levier 2x est quotidien, pas une multiplication par deux du rendement sur plusieurs années.");
  if (selection.some(s => s.distributing || s.id === "qyld_ucits" || s.id === "scpi")) warnings.push("Les distributions ne sont pas garanties et peuvent accompagner une baisse du capital.");
  return {
    selection: selection.map(s => ({ ...s, pourquoi: role(s, selection) })),
    hook: `${portfolioHeading(selection, profileId, riskId)}\n\n${hook.text}`,
    hookTemplate: hook.text, hookId: hook.id,
    intro: content.intro, sousTitre: "💼 La répartition", logic: content.logic,
    cta: `💬 ${cta.text}`, ctaTemplate: cta.id, warning: warnings.join(" "),
  };
}
