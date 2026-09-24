// Bibliothèque de faits marquants et statistiques historiques sur les grands indices boursiers,
// destinée à générer des tweets "le saviez-vous". Contrairement au reste de l'app (qui calcule
// depuis des séries de prix brutes, cf. investment-calculator/portfolio-generator), CHAQUE fait ici
// est une statistique DÉJÀ PUBLIÉE par un institut de recherche reconnu — jamais recalculée
// maison. Recherche menée le 22/09/2026 (WebSearch, résumés IA recoupés par une deuxième requête
// indépendante en cas d'incertitude) : cf. commentaire de chaque fait pour la source exacte.
// Plusieurs statistiques rencontrées lors de cette recherche n'ont volontairement PAS été retenues
// faute de source primaire clairement identifiable ou faute de convergence entre sources
// contradictoires (ex. répartition fine des bear markets par tranche d'ampleur, probabilité de
// rebond après une année négative, "36 années sur 97" — chiffres trouvés mais non rattachables
// avec certitude à un institut de la liste de référence) — cf. CLAUDE.md, section sourcing.
//
// CAC 40 : scope volontairement restreint à 2 repères ponctuels bien recoupés (record 2000-2021,
// pire séance du 12/03/2020). Contrairement aux indices américains, aucun institut de recherche
// dédié ne publie de séries statistiques longues sur le CAC 40 (fréquence des corrections, séries
// d'années, fenêtres glissantes...) — Euronext ne publie que des factsheets descriptifs, Vernimmen
// ne couvre que les dividendes. Pas d'ajout arbitraire pour "égaliser" avec les indices US.

export const FAMILIES = [
  { id: "chocs", label: "⚡ Chocs et corrections", emoji: "⚡" },
  { id: "continuite", label: "📈 Continuité et séquences", emoji: "📈" },
  { id: "cac40", label: "🇫🇷 CAC 40", emoji: "🇫🇷" },
];

const RAW_FACTS = [
  {
    id: "corrections-27-bear-markets",
    family: "chocs",
    category: "Fréquence des corrections",
    indices: ["S&P 500"],
    // Hartford Funds / Ned Davis Research dénombre 27 épisodes depuis 1928. Les moyennes
    // « 56 mois depuis 1932 » et « 5,1 ans depuis 1945 » étaient ajoutées à la même fiche
    // sans dénominateur vérifiable : retirées le 24/09/2026, pas recalculées à l'aveugle.
    fact: "Selon le décompte de Hartford Funds, le S&P 500 a connu 27 bear markets (baisses de 20 % ou plus) depuis 1928.",
    source: "Hartford Funds, « 10 Things You Should Know About Bear Markets »",
    note: null,
  },
  {
    id: "corrections-ampleur-moyenne",
    family: "chocs",
    category: "Fréquence des corrections",
    indices: ["S&P 500"],
    fact: "La baisse moyenne d'un bear market du S&P 500 est de -33,5% depuis 1929. La pire baisse jamais enregistrée reste celle du 16 septembre 1929 au 1er juin 1932 : -86,2%.",
    source: "Dow Jones Market Data",
    note: null,
  },
  {
    id: "corrections-48-depuis-guerre",
    family: "chocs",
    category: "Fréquence des corrections",
    indices: ["S&P 500"],
    fact: "Depuis la Seconde Guerre mondiale, le S&P 500 a connu 48 corrections (baisses de 10% ou plus), mais seulement 12 d'entre elles se sont transformées en bear market (-20% ou plus).",
    source: "Carson Group (Ryan Detrick, chief market strategist)",
    note: null,
  },
  {
    id: "records-1987-pire-seance",
    family: "chocs",
    category: "Records de séance",
    indices: ["Dow Jones", "S&P 500"],
    fact: "La pire séance de l'histoire boursière moderne reste le 19 octobre 1987 (« Black Monday ») : -22,61% pour le Dow Jones et -20,4% pour le S&P 500, en une seule journée.",
    source: "Federal Reserve History",
    note: null,
  },
  {
    id: "records-1933-meilleure-seance-dow",
    family: "chocs",
    category: "Records de séance",
    indices: ["Dow Jones"],
    fact: "La meilleure séance de l'histoire du Dow Jones est le 15 mars 1933 (+15,34%), au lendemain de la réouverture des banques américaines décidée par Roosevelt après le « bank holiday ».",
    source: "Guinness World Records",
    note: null,
  },
  {
    id: "records-1933-meilleures-seances-sp500",
    family: "chocs",
    category: "Records de séance",
    indices: ["S&P 500"],
    fact: "Les trois meilleures séances de l'histoire du S&P 500 : +16,61% (15 mars 1933), +12,53% (30 octobre 1929) et +11,58% (13 octobre 2008 — le meilleur jour de l'ère boursière moderne).",
    source: "Compilation historique (Wikipedia), point du 13 octobre 2008 confirmé indépendamment par CNBC",
    note: null,
  },
  {
    id: "records-2001-nasdaq",
    family: "chocs",
    category: "Records de séance",
    indices: ["Nasdaq"],
    fact: "La meilleure séance de l'histoire du Nasdaq Composite est le 3 janvier 2001 (+14,2%), déclenchée par une baisse surprise des taux de la Fed.",
    source: "CNN Money (article du 3 janvier 2001)",
    note: null,
  },
  {
    id: "duree-bull-bear-moyenne",
    family: "chocs",
    category: "Durée bull vs bear markets",
    indices: ["S&P 500"],
    fact: "Un bull market du S&P 500 dure en moyenne 988 jours (2,7 ans) pour un gain moyen de +112%. Un bear market dure en moyenne 289 jours (9,6 mois) pour une perte moyenne de -35%.",
    source: "Ned Davis Research, cité par Hartford Funds (« 10 Things You Should Know About Bear Markets »)",
    note: null,
  },
  {
    id: "duree-frequence-bear-markets",
    family: "chocs",
    category: "Durée bull vs bear markets",
    indices: ["S&P 500"],
    fact: "Un bear market survient en moyenne tous les 3,5 ans sur le S&P 500.",
    source: "Ned Davis Research / Hartford Funds",
    note: null,
  },
  {
    id: "crash-1929",
    family: "chocs",
    category: "Crash historique",
    indices: ["Dow Jones"],
    fact: "Le krach de 1929 : le Dow Jones perd 25% en 4 séances (24 au 29 octobre), puis continue de chuter jusqu'à l'été 1932 (-89% depuis le pic, plus bas niveau du XXe siècle à 41,22 points). Il ne retrouve son niveau d'avant-crash qu'en novembre 1954 — 25 ans plus tard.",
    source: "Federal Reserve History",
    note: null,
  },
  {
    id: "crash-1987",
    family: "chocs",
    category: "Crash historique",
    indices: ["Dow Jones", "S&P 500"],
    fact: "Le « Black Monday » du 19 octobre 1987 s'est accompagné d'un volume record de 604,33 millions de titres échangés, 3 fois la moyenne quotidienne. Le marché a retrouvé son niveau d'avant-krach en environ 21 mois, vers juillet 1989.",
    source: "Federal Reserve History, corroboré par Goldman Sachs",
    note: null,
  },
  {
    id: "crash-2000-2002",
    family: "chocs",
    category: "Crash historique",
    indices: ["Nasdaq", "S&P 500"],
    fact: "L'éclatement de la bulle internet (2000-2002) : le Nasdaq perd 78% entre son pic de mars 2000 (5 048 points) et son creux d'octobre 2002 (1 114 points), effaçant plus de 5 000 milliards de dollars de capitalisation. Le S&P 500, moins concentré en valeurs technologiques, perd environ 49-50% sur la même période. Le Nasdaq n'a retrouvé son niveau nominal d'avant-krach que le 23 avril 2015 — 15 ans plus tard.",
    source: "Goldman Sachs et International Banker (ampleur de la baisse), NPR/AEI/Fortune (date de récupération du Nasdaq)",
    note: "En termes réels (ajustés de l'inflation), le Nasdaq restait environ 28% sous son pic de 2000 même après avoir dépassé son niveau nominal en 2015.",
  },
  {
    id: "crash-2008",
    family: "chocs",
    category: "Crash historique",
    indices: ["S&P 500"],
    fact: "La crise financière de 2008 : le S&P 500 perd environ 57% entre son pic du 9 octobre 2007 (1 565,15 points) et son creux du 9 mars 2009 (676,53 points), sur 17 mois — la plus forte baisse depuis la Seconde Guerre mondiale. Il retrouve son niveau de clôture d'avant-crise le 10 avril 2013.",
    source: "Federal Reserve History (baisse et durée), synthèse recoupée pour la date de récupération",
    note: null,
  },
  {
    id: "crash-2020",
    family: "chocs",
    category: "Crash historique",
    indices: ["S&P 500"],
    fact: "Le krach du Covid en 2020 reste le bear market le plus rapide de l'histoire boursière : le S&P 500 perd 33,9% en seulement 33 jours calendaires (19 février au 23 mars 2020), contre une durée médiane de 302 jours pour l'ensemble des bear markets recensés entre 1929 et 2020. Il retrouve son niveau d'avant-crash dès août 2020, environ 5 mois après le creux.",
    source: "Yardeni Research (durée médiane historique) et CNBC (vitesse de la chute)",
    note: null,
  },
  {
    id: "series-9-annees-positives",
    family: "continuite",
    category: "Séries d'années consécutives",
    indices: ["S&P 500"],
    fact: "Avant la série en cours, la plus longue série d'années civiles consécutives positives du S&P 500 est de 9 ans, de 1992 à 2001.",
    source: "Carson Group / Carson Investment Research",
    note: null,
  },
  {
    id: "series-annees-20-pourcent",
    family: "continuite",
    category: "Séries d'années consécutives",
    indices: ["S&P 500"],
    fact: "Le seul épisode où le S&P 500 a enchaîné plusieurs années consécutives à +20% ou plus est la séquence 1995-1999 (5 années d'affilée au-dessus de 20%) — un cas unique depuis 1929. D'autres séries au-dessus de la moyenne existent : 1942-1945, 1949-1952, et 2019-2021.",
    source: "Carson Group / Carson Investment Research",
    note: null,
  },
  {
    id: "annees-extremes",
    family: "continuite",
    category: "Meilleures/pires années civiles",
    indices: ["S&P 500"],
    fact: "La pire année civile de l'indice reste 1931 (-43,8%) ; la meilleure est 1933 (+54%).",
    source: "Yardeni Research (« S&P 500 Historical Monthly & Annual Returns »)",
    note: "Indice élargi pré-1957 (convention standard pour prolonger la série historique) — le S&P 500 à 500 valeurs actuel ne démarre qu'en 1957.",
  },
  {
    id: "annees-part-positives",
    family: "continuite",
    category: "Meilleures/pires années civiles",
    indices: ["S&P 500"],
    fact: "Sur environ 154 ans de données annuelles du marché actions américain, environ 73 à 74% des années civiles ont été positives.",
    source: "Dimensional Fund Advisors (« The Uncommon Average: Long-Term Context on Annual Returns »)",
    note: null,
  },
  {
    id: "fenetres-20-ans",
    family: "continuite",
    category: "Performance sur fenêtres glissantes",
    indices: ["S&P 500"],
    fact: "Sur toute période glissante de 20 ans depuis 1950, le rendement annualisé des actions américaines n'a jamais été négatif.",
    source: "J.P. Morgan Asset Management, « Guide to the Markets », corroboré par Crestmont Research",
    note: "Les bornes exactes de la fourchette de rendement varient légèrement d'une édition à l'autre du Guide selon la date d'arrêt des données.",
  },
  {
    id: "cac40-record-21-ans",
    family: "cac40",
    category: "Repère historique",
    indices: ["CAC 40"],
    fact: "Le CAC 40 a mis 21 ans à dépasser son record historique du 4 septembre 2000 (6 944,77 points) — franchi seulement en novembre 2021.",
    source: "franceinfo, corroboré par Tradingsat/BFM Bourse",
    note: null,
  },
  {
    id: "cac40-pire-seance-2020",
    family: "cac40",
    category: "Repère historique",
    indices: ["CAC 40"],
    fact: "La pire séance de l'histoire du CAC 40 reste le 12 mars 2020 (krach Covid) : -12,28% en une seule journée.",
    source: "Convergence de plusieurs sources de presse financière (BFM Bourse/Tradingsat)",
    note: "Contrairement aux indices américains, aucun institut de recherche dédié ne publie de séries statistiques longues sur le CAC 40 (fréquence des corrections, séries d'années...) — le scope reste volontairement limité à des repères ponctuels bien recoupés plutôt qu'étendu par approximation.",
  },
];

// Textes éditoriaux propres à chaque fiche. Les nombres reprennent les faits sourcés ci-dessus ;
// les images et questions n'ajoutent aucune statistique nouvelle.
const EDITORIAL = {
  "corrections-27-bear-markets": {
    hook: "📉 27 bear markets depuis 1928 : le S&P 500 en a vu passer des tempêtes.",
    context: "Une baisse d'au moins 20 % n'a rien d'un scénario inédit. Le nombre d'épisodes ne dit pas à quel rythme arrivera le prochain.",
    twist: "Une moyenne décrit le passé : elle ne donne pas la date de la prochaine baisse.",
    question: "Tu as déjà investi pendant un bear market, ou tu n'en as encore jamais traversé ?",
  },
  "corrections-ampleur-moyenne": {
    hook: "🫣 -33,5 % : la baisse moyenne d'un bear market du S&P 500 depuis 1929.",
    context: "Sur 10 000 € investis, une baisse de cette ampleur ramènerait temporairement la valeur à 6 650 €.",
    twist: "Et l'histoire a connu bien pire : -86,2 % lors de la chute de 1929 à 1932.",
    question: "Quelle baisse de ton portefeuille pourrais-tu encaisser sans changer ton plan ?",
  },
  "corrections-48-depuis-guerre": {
    hook: "📊 48 corrections du S&P 500 depuis la Seconde Guerre mondiale. 12 sont devenues des bear markets.",
    context: "Une baisse d'au moins 10 % ne se transforme donc pas systématiquement en chute d'au moins 20 %.",
    question: "À -10 %, tu revois ta stratégie ou tu attends de voir ?",
  },
  "records-1987-pire-seance": {
    hook: "🧨 Le 19 octobre 1987, le Dow Jones a perdu 22,61 % en une seule séance.",
    context: "Le S&P 500 a lui aussi plongé de 20,4 % ce jour-là. Le choc s'est joué en quelques heures, pas en plusieurs mois.",
    question: "Comment réagirais-tu si ton indice perdait 20 % en une journée ?",
  },
  "records-1933-meilleure-seance-dow": {
    hook: "🚀 +15,34 % en une journée : le record de hausse du Dow Jones date du 15 mars 1933.",
    context: "Cette séance suit la réouverture des banques américaines après le « bank holiday » décidé par Roosevelt.",
    question: "Aurais-tu osé rester investi au milieu d'une crise bancaire ?",
  },
  "records-1933-meilleures-seances-sp500": {
    hook: "📈 +16,61 % : la plus forte hausse quotidienne de la série historique du S&P 500 remonte au 15 mars 1933.",
    context: "Deux autres séances exceptionnelles ont suivi des périodes de crise : le 30 octobre 1929 et le 13 octobre 2008.",
    question: "Tu t'attends plutôt à voir les plus fortes hausses pendant les périodes calmes ou les crises ?",
  },
  "records-2001-nasdaq": {
    hook: "⚡ +14,2 % en une séance : le Nasdaq Composite a bondi le 3 janvier 2001.",
    context: "Une baisse surprise des taux de la Fed a déclenché cette réaction, alors que la bulle internet avait déjà éclaté.",
    question: "Une hausse spectaculaire au milieu d'un krach te rassurerait-elle ?",
  },
  "duree-bull-bear-moyenne": {
    hook: "🐂 988 jours de hausse contre 289 jours de baisse : l'écart moyen entre bull et bear markets du S&P 500.",
    context: "Dans cette étude, les phases haussières durent en moyenne bien plus longtemps que les phases baissières.",
    twist: "Les moyennes ne disent toutefois rien de la durée du cycle en cours.",
    question: "Tu surveilles davantage l'ampleur d'une baisse ou le temps qu'elle dure ?",
  },
  "duree-frequence-bear-markets": {
    hook: "⏳ Un bear market tous les 3,5 ans en moyenne, selon une étude historique du S&P 500.",
    context: "Sur un horizon d'investissement de plusieurs décennies, rencontrer une baisse d'au moins 20 % fait partie des possibilités concrètes.",
    twist: "C'est une moyenne issue d'une autre étude, avec une période et une méthode différentes du chiffre des 56 mois.",
    question: "Ton plan d'investissement prévoit-il ce que tu feras à -20 % ?",
  },
  "crash-1929": {
    hook: "🕰️ 25 ans : le temps qu'il a fallu au Dow Jones pour retrouver son niveau d'avant le krach de 1929.",
    context: "Après 25 % perdus en quatre séances d'octobre, la chute s'est prolongée jusqu'à l'été 1932.",
    twist: "Ce délai concerne le niveau nominal de l'indice, sans les dividendes.",
    question: "Un tel délai changerait-il ton choix d'horizon ou de diversification ?",
  },
  "crash-1987": {
    hook: "🧨 604 millions de titres échangés le 19 octobre 1987 : trois fois le volume quotidien habituel.",
    context: "Le choc du Black Monday a été brutal. Il a fallu ensuite environ 21 mois au marché pour retrouver son niveau d'avant-krach.",
    question: "Tu aurais regardé les cours chaque jour après une séance pareille ?",
  },
  "crash-2000-2002": {
    hook: "💻 -78 % pour le Nasdaq après l'éclatement de la bulle internet.",
    context: "Son niveau nominal de mars 2000 n'a été retrouvé qu'en avril 2015, soit environ quinze ans plus tard.",
    twist: "Le S&P 500 a également chuté sur la période, d'environ 49 à 50 %.",
    question: "Tu pourrais conserver un indice pendant quinze ans avant de revoir son ancien sommet ?",
  },
  "crash-2008": {
    hook: "🏦 -57 % : la chute du S&P 500 entre octobre 2007 et mars 2009.",
    context: "Il a fallu attendre avril 2013 pour que l'indice retrouve son ancien niveau de clôture.",
    question: "En 2008, tu aurais plutôt continué tes achats ou suspendu tes versements ?",
  },
  "crash-2020": {
    hook: "🦠 33 jours pour perdre 33,9 % : le krach du Covid a frappé le S&P 500 à une vitesse rare.",
    context: "La durée médiane des bear markets recensés entre 1929 et 2020 est de 302 jours. Le creux de mars 2020 est arrivé bien plus vite.",
    twist: "L'ancien sommet a ensuite été retrouvé dès août 2020.",
    question: "Pendant la chute de mars 2020, tu as vendu, acheté ou attendu ?",
  },
  "series-9-annees-positives": {
    hook: "📅 Neuf années civiles positives d'affilée : une séquence historique attribuée au S&P 500.",
    context: "Une longue série de gains ne signifie pas que chaque mois, ni chaque investisseur, a gagné de l'argent.",
    question: "Après plusieurs bonnes années, tu renforces encore ou tu deviens plus prudent ?",
  },
  "series-annees-20-pourcent": {
    hook: "🔥 Cinq années consécutives à +20 % ou plus : le S&P 500 l'a fait de 1995 à 1999.",
    context: "Une succession de fortes hausses peut donner l'impression que ce rythme est normal. Cette séquence reste exceptionnelle dans la série citée.",
    question: "Après cinq années pareilles, tu aurais augmenté tes attentes de rendement ?",
  },
  "annees-extremes": {
    hook: "🎢 -43,8 % en 1931, puis +54 % en 1933 : deux années extrêmes de la série historique américaine.",
    context: "Ces chiffres montrent l'écart possible d'une année civile à l'autre ; ils ne décrivent pas le rendement habituel.",
    twist: "La série prolongée avant 1957 précède l'indice S&P 500 à 500 valeurs actuel.",
    question: "Tu regardes surtout le résultat d'une année ou celui de plusieurs décennies ?",
  },
  "annees-part-positives": {
    hook: "📆 Environ 73 à 74 % des années civiles ont été positives sur une longue série du marché actions américain.",
    context: "Même avec cette majorité d'années positives, les années négatives restent une partie réelle de l'histoire.",
    twist: "Cette étude porte sur le marché américain au sens large, pas uniquement sur le S&P 500.",
    question: "Une année dans le rouge suffirait-elle à te faire changer de stratégie ?",
  },
  "fenetres-20-ans": {
    hook: "🗓️ Dans la série étudiée depuis 1950, aucune fenêtre glissante de 20 ans n'a fini avec un rendement annualisé négatif.",
    context: "Décaler la date de départ d'un mois change la fenêtre observée ; l'étude examine justement ces périodes qui se chevauchent.",
    twist: "C'est un constat historique sur les actions américaines, pas une garantie pour les vingt prochaines années.",
    question: "Ton horizon réel d'investissement est-il assez long pour supporter plusieurs cycles ?",
  },
  "cac40-record-21-ans": {
    hook: "🇫🇷 21 ans pour que le CAC 40 dépasse son sommet de septembre 2000.",
    context: "Il a franchi ce record de cours en novembre 2021. Deux décennies ont séparé ces deux niveaux de l'indice.",
    twist: "La comparaison porte sur l'indice de prix : elle exclut les dividendes réinvestis.",
    question: "Pour juger un indice, tu regardes son cours ou sa performance avec dividendes réinvestis ?",
  },
  "cac40-pire-seance-2020": {
    hook: "🇫🇷 -12,28 % en une séance : le 12 mars 2020 reste la pire journée du CAC 40.",
    context: "À cette vitesse, une seule séance suffit à bouleverser la valeur affichée d'un portefeuille exposé à l'indice.",
    question: "Face à une journée à -12 %, tu consulterais ton portefeuille ou tu couperais l'application ?",
  },
};

export const FACTS = RAW_FACTS.map((fact) => ({ ...fact, ...EDITORIAL[fact.id] }));

export function getFact(id) {
  return FACTS.find((f) => f.id === id);
}
