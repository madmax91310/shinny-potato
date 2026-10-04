import { HISTORY_FACTS } from '../../data/history-statistics.js';
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
  { id: 'actions-historiques', label: '📉 Historiques des actions', emoji: '📉' },
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
    // Saturna Capital (étude historique en rendement total) : 1991-1999, et non
    // 1992-2001. Une autre série de neuf ans existe de 2009 à 2017.
    // https://www.saturna.com/sites/saturna.com/files/2026-01/Equity-Markets-Q4-2025.pdf
    fact: "Le S&P 500 a connu neuf années civiles consécutives de rendement total positif entre 1991 et 1999. Il a connu une autre séquence de neuf années positives entre 2009 et 2017.",
    source: "Saturna Capital, « Equity Markets Commentary », T4 2025",
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

// Textes éditoriaux : fait et périmètre dès l’accroche, explication, portée, question.
// Revue éditoriale du 04/10/2026 : aucune nouvelle statistique de marché.
// Black Monday arrondi à 22,6 % (Federal Reserve History) ; montants en euros
// illustratifs, sans conversion de devise. Les autres valeurs gardent leurs sources.
const EDITORIAL = {
  "corrections-27-bear-markets": {
    "hook": "📉 Le S&P 500 a connu 27 baisses d’au moins 20 % depuis 1928 dans le décompte de Hartford Funds. Voici ce que ce chiffre mesure 👇",
    "context": "Ces épisodes sont appelés « bear markets » : la baisse se mesure depuis un sommet jusqu’au creux qui suit.",
    "twist": "💡 Ce décompte rappelle que les fortes baisses font partie de l’histoire de cet indice. Il ne donne ni la date ni l’ampleur de la prochaine.",
    "question": "💬 Tu as déjà traversé une baisse de cette ampleur en restant investi ?"
  },
  "corrections-ampleur-moyenne": {
    "hook": "📉 33,5 % de baisse en moyenne lors des bear markets du S&P 500 depuis 1929, selon la série citée. Que représente cette baisse sur ton capital ? 👇",
    "context": "Une exposition de 10 000 € suivant exactement une baisse de 33,5 % tomberait à 6 650 €, hors frais et effet de change. C’est une illustration, pas une conversion de la performance en euros.",
    "twist": "💡 Une moyenne ne fixe pas une perte maximale : la baisse de 1929 à 1932 a atteint 86,2 % dans cette série historique. Avant 1957, celle-ci repose sur les indices prédécesseurs du S&P 500 actuel.",
    "question": "💬 À quel niveau de baisse commencerais-tu à douter de ton plan ?"
  },
  "corrections-48-depuis-guerre": {
    "hook": "📉 Sur 48 corrections du S&P 500 recensées depuis la Seconde Guerre mondiale, 12 ont atteint une baisse d’au moins 20 %. Une baisse de 10 % ne raconte pas toute la suite 👇",
    "context": "Dans le décompte de Carson Group, une correction désigne une baisse d’au moins 10 % depuis un sommet. Le seuil de 20 % correspond à un « bear market ».",
    "twist": "💡 Ces épisodes passés montrent qu’une correction ne se prolonge pas systématiquement jusqu’à ce seuil. Ce rapport n’est pas une probabilité pour la prochaine baisse.",
    "question": "💬 À moins 10 %, tu regardes les cours plus souvent ou tu gardes ton rythme habituel ?"
  },
  "records-1987-pire-seance": {
    "hook": "📉 Le Dow Jones a perdu 22,6 % en une seule journée. Voici ce qui s’est passé le 19 octobre 1987 👇",
    "context": "Cette séance est restée dans l’histoire sous le nom de « Black Monday ». Le S&P 500 a lui aussi chuté, de 20,4 %.\n\nPour mesurer le choc, une exposition de 10 000 € suivant exactement une baisse de 22,6 % serait tombée à environ 7 740 €, hors frais et effet de change.",
    "twist": "💡 Le risque en Bourse ne se mesure pas seulement à la performance de fin d’année. Il faut aussi pouvoir traverser les baisses entre deux dates.",
    "question": "💬 Tu avais envisagé qu’une baisse aussi forte puisse arriver en une seule séance ?"
  },
  "records-1933-meilleure-seance-dow": {
    "hook": "📈 Le Dow Jones a gagné 15,34 % en une journée, le 15 mars 1933. Son meilleur rebond de séance est survenu en pleine crise bancaire 👇",
    "context": "Les banques américaines venaient de rouvrir après la fermeture temporaire décidée par Roosevelt.",
    "twist": "💡 Une très forte hausse peut arriver au milieu d’une crise. Une seule séance ne suffit toutefois pas à confirmer que les difficultés sont terminées.",
    "question": "💬 Après une hausse pareille, tu aurais attendu ou recommencé à investir ?"
  },
  "records-1933-meilleures-seances-sp500": {
    "hook": "📈 +16,61 % en une séance : le 15 mars 1933 détient le record de hausse dans la série historique prolongée du S&P 500 👇",
    "context": "Deux autres fortes hausses de cette série datent du 30 octobre 1929 (+12,53 %) et du 13 octobre 2008 (+11,58 %).\n\nLes chiffres antérieurs à 1957 concernent les indices prédécesseurs : le S&P 500 à 500 valeurs n’existait pas encore.",
    "twist": "💡 Ces fortes séances sont survenues pendant des crises. Un marché en difficulté peut connaître un rebond brutal sans avoir achevé sa baisse.",
    "question": "💬 Une forte hausse en pleine crise te rassure ou tu attends de voir la suite ?"
  },
  "records-2001-nasdaq": {
    "hook": "⚡ Le Nasdaq Composite a gagné 14,2 % le 3 janvier 2001. La bulle internet avait pourtant déjà éclaté 👇",
    "context": "Cette séance a suivi une baisse surprise des taux de la Réserve fédérale américaine.",
    "twist": "💡 Une journée de rebond ne résume pas une période boursière. Elle peut survenir alors que l’indice traverse encore une longue baisse.",
    "question": "💬 Un rebond pareil t’aurait redonné confiance ou tu aurais attendu ?"
  },
  "duree-bull-bear-moyenne": {
    "hook": "📆 988 jours de hausse contre 289 jours de baisse en moyenne : voici les durées des cycles du S&P 500 dans l’étude de Ned Davis Research 👇",
    "context": "Un « bull market » désigne une phase de marché haussier. Un « bear market » correspond à une baisse d’au moins 20 % depuis un sommet.",
    "twist": "💡 Dans cette étude, les phases de hausse ont duré plus longtemps en moyenne. Ces durées ne donnent pas une date de fin au cycle en cours.",
    "question": "💬 Quand le marché baisse, c’est l’ampleur ou la durée qui te pèse le plus ?"
  },
  "duree-frequence-bear-markets": {
    "hook": "📉 Une baisse d’au moins 20 % tous les 3,5 ans en moyenne : c’est le rythme des bear markets du S&P 500 dans le décompte de Ned Davis Research 👇",
    "context": "La baisse se mesure depuis un sommet. Cette fréquence est une moyenne historique, avec des écarts variables entre les épisodes.",
    "twist": "💡 Ce repère sert à envisager des baisses pendant une longue période d’investissement. Il ne permet pas de programmer ses achats ou ses ventes tous les trois ans et demi.",
    "question": "💬 Tu sais déjà ce que tu ferais si ton indice perdait 20 % ?"
  },
  "crash-1929": {
    "hook": "🕰️ Après le krach de 1929, le Dow Jones a attendu novembre 1954 pour retrouver son sommet : vingt-cinq ans plus tard 👇",
    "context": "Il avait perdu 25 % en quatre séances d’octobre 1929. La baisse s’est ensuite prolongée jusqu’en 1932.",
    "twist": "💡 Ce délai concerne le niveau nominal de l’indice, sans dividendes réinvestis ni correction de l’inflation. Il ne mesure donc pas à lui seul le résultat d’un investisseur.",
    "question": "💬 Un délai aussi long change-t-il la place que tu donnerais aux actions ?"
  },
  "crash-1987": {
    "hook": "🧨 Pendant le Black Monday du 19 octobre 1987, 604 millions de titres ont été échangés : environ trois fois le volume quotidien habituel 👇",
    "context": "Le retour au niveau d’avant-krach a ensuite pris environ 21 mois, dans le repère de marché cité.",
    "twist": "💡 Le volume décrit l’intensité des échanges pendant le choc. Il ne permet pas, à lui seul, de savoir quand les cours se stabiliseront.",
    "question": "💬 Pendant une séance de panique, tu suivrais les cours ou tu prendrais du recul ?"
  },
  "crash-2000-2002": {
    "hook": "💻 Le Nasdaq Composite a perdu 78 % entre mars 2000 et octobre 2002. Il a fallu attendre avril 2015 pour dépasser son ancien sommet 👇",
    "context": "L’éclatement de la bulle internet a aussi touché le S&P 500, qui a perdu environ 49 à 50 % sur cette période.",
    "twist": "💡 Le délai du Nasdaq concerne son niveau nominal, sans dividendes ni inflation. Il montre aussi qu’une exposition concentrée peut traverser des baisses très différentes de celles d’un indice plus large.",
    "question": "💬 Quinze ans avant de revoir un sommet : quelle place donnerais-tu à un indice aussi concentré ?"
  },
  "crash-2008": {
    "hook": "🏦 Le S&P 500 a perdu environ 57 % entre octobre 2007 et mars 2009. La chute s’est étalée sur dix-sept mois 👇",
    "context": "Pendant la crise financière, l’indice a reculé depuis son sommet du 9 octobre 2007 jusqu’au creux du 9 mars 2009.",
    "twist": "💡 Une baisse peut durer bien plus qu’une mauvaise semaine. Si tu dois vendre pour financer une dépense, ton horizon et ta réserve disponible comptent autant que ta capacité à supporter les fluctuations.",
    "question": "💬 Pendant une baisse aussi longue, tu aurais pu continuer tes versements ?"
  },
  "crash-2020": {
    "hook": "⚡ En 2020, le S&P 500 a perdu environ un tiers de sa valeur en 33 jours calendaires. Du sommet au creux, à peine plus d’un mois 👇",
    "context": "Le 19 février, l’indice atteint un sommet.\n\nLe 23 mars, il a perdu 33,9 %, pendant le choc du Covid.",
    "twist": "💡 Attendre que les marchés commencent à baisser pour réfléchir à sa stratégie peut laisser très peu de temps pour décider.\n\nSavoir pourquoi tu investis, pour combien de temps et avec quelle réserve disponible donne des repères quand les cours chutent.",
    "question": "💬 En mars 2020, tu avais déjà un plan ou tu décidais au jour le jour ?"
  },
  "series-9-annees-positives": {
    "hook": "📈 Le S&P 500 a terminé neuf années de suite dans le vert, de 1991 à 1999. Vendre parce que « ça monte depuis trop longtemps » aurait pu te faire sortir bien tôt 👇",
    "context": "Chaque année civile de cette période a affiché une performance positive, dividendes réinvestis. Une autre série de neuf années positives a eu lieu de 2009 à 2017.\n\nCela ne signifie pas que l’indice montait tous les jours : une année positive peut contenir des baisses importantes.",
    "twist": "💡 Une série de hausses ne donne pas, à elle seule, la date de la prochaine chute. Elle ne garantit pas non plus que la hausse continuera.",
    "question": "💬 Après plusieurs années positives, tu continues tes versements ou tu commences à attendre une baisse ?"
  },
  "series-annees-20-pourcent": {
    "hook": "🔥 Le S&P 500 a gagné au moins 20 % par an pendant cinq années de suite, de 1995 à 1999, dans la série de rendement total citée 👇",
    "context": "Cette séquence inclut les dividendes réinvestis. Dans la série historique étudiée depuis 1929, un tel enchaînement reste exceptionnel.",
    "twist": "💡 Une suite de très bonnes années peut modifier tes attentes. Elle ne transforme pas ces rendements en objectif réaliste pour chaque année suivante.",
    "question": "💬 À force de voir de telles hausses, tu aurais fini par les attendre chaque année ?"
  },
  "annees-extremes": {
    "hook": "🎢 Moins 43,8 % en 1931, plus 54 % en 1933 : voici deux années extrêmes de la série historique prolongée du S&P 500 👇",
    "context": "Ce sont deux années civiles distinctes, pas une baisse immédiatement suivie de cette hausse. La période antérieure à 1957 repose sur les indices prédécesseurs du S&P 500 actuel.",
    "twist": "💡 Une année extrême ne décrit pas le résultat sur toute la durée de détention. Le point de départ et les années intermédiaires comptent aussi.",
    "question": "💬 Tu juges ton portefeuille sur l’année écoulée ou sur tout ton horizon ?"
  },
  "annees-part-positives": {
    "hook": "📆 Environ 73 à 74 % des années ont été positives sur quelque 154 ans de données du marché actions américain étudiées par Dimensional 👇",
    "context": "Ce chiffre porte sur le marché américain dans son ensemble, pas uniquement sur le S&P 500. Il compare les résultats de chaque année civile.",
    "twist": "💡 Une majorité d’années positives laisse aussi des années négatives. Ce constat historique ne fixe pas la probabilité de gain de l’année prochaine.",
    "question": "💬 Une année négative te ferait-elle remettre en cause ta stratégie ?"
  },
  "fenetres-20-ans": {
    "hook": "🗓️ Aucune période glissante de vingt ans négative pour les actions américaines dans la série de J.P. Morgan étudiée depuis 1950. Voici la limite de ce constat 👇",
    "context": "L’étude compare les rendements annualisés de périodes de vingt ans ayant des dates de départ différentes. Elle concerne les actions américaines, dans le périmètre de l’édition citée.",
    "twist": "💡 Ce résultat historique n’est pas une garantie pour les vingt prochaines années, ni pour un autre marché. Il ne décrit pas non plus les baisses traversées pendant ces vingt ans.",
    "question": "💬 Tu connais la date à laquelle tu auras réellement besoin de l’argent investi ?"
  },
  "cac40-record-21-ans": {
    "hook": "🇫🇷 Le CAC 40 a attendu vingt et un ans pour dépasser son record de septembre 2000. Mais ce chiffre laisse les dividendes de côté 👇",
    "context": "L’ancien sommet de son indice de prix n’a été dépassé qu’en novembre 2021.",
    "twist": "💡 Le niveau de l’indice et la performance avec dividendes réinvestis ne mesurent pas la même chose. Pour juger le résultat d’un placement, les revenus reçus comptent aussi.",
    "question": "💬 Quand tu compares deux indices, tu vérifies s’ils incluent les dividendes ?"
  },
  "cac40-pire-seance-2020": {
    "hook": "🇫🇷 Le CAC 40 a perdu 12,28 % le 12 mars 2020. Une seule séance, pendant le choc du Covid 👇",
    "context": "Cette journée est son record historique de baisse dans les données citées.",
    "twist": "💡 Une forte baisse peut se produire avant que tu aies le temps de modifier tes placements. Garder disponible l’argent destiné aux dépenses proches évite de dépendre d’une vente ce jour-là.",
    "question": "💬 Tu investissais déjà à cette date ? Comment avais-tu réagi ?"
  }
};

const publishedFacts = RAW_FACTS.map((fact) => ({ ...fact, ...EDITORIAL[fact.id] }));

export function getFact(id) {
  return FACTS.find((f) => f.id === id);
}

export const FACTS = [...publishedFacts, ...HISTORY_FACTS];
