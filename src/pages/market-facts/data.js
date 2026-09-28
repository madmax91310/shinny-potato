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

// Textes éditoriaux propres à chaque fiche. Les nombres reprennent les faits sourcés ci-dessus ;
// les images et questions n'ajoutent aucune statistique nouvelle.
const EDITORIAL = {
  "corrections-27-bear-markets": {
    hook: "📉 On parle souvent du prochain krach comme s'il allait être le premier.",
    context: "Le décompte de Hartford Funds recense 27 bear markets du S&P 500 depuis 1928. Chaque fois, l'indice a perdu au moins 20 % depuis un sommet.",
    twist: "Ce chiffre n'annonce évidemment pas quand le prochain arrivera. Il rappelle surtout qu'une grosse baisse fait partie de l'histoire des marchés.",
    question: "Tu as déjà traversé une baisse de cette ampleur en restant investi ?",
  },
  "corrections-ampleur-moyenne": {
    hook: "🫣 « Je tiendrai pendant un krach. » Plus facile à dire quand les cours montent.",
    context: "Depuis 1929, la baisse moyenne d'un bear market du S&P 500 est de 33,5 %. Sur 10 000 € investis, cela représenterait une valeur affichée de 6 650 €.",
    twist: "Et c'est une moyenne : la chute de 1929 à 1932 a atteint 86,2 % dans la série citée.",
    question: "À quel niveau de baisse commencerais-tu vraiment à douter de ton plan ?",
  },
  "corrections-48-depuis-guerre": {
    hook: "📉 Le S&P 500 baisse de 10 %. Et tout de suite, la même question : jusqu'où ?",
    context: "Depuis la Seconde Guerre mondiale, Carson Group recense 48 corrections d'au moins 10 %. Douze ont ensuite franchi le seuil de 20 % d'un bear market.",
    twist: "Une correction mérite d'être prise au sérieux, mais elle ne raconte pas à elle seule la suite du marché.",
    question: "À -10 %, tu regardes les cours plus souvent ou tu suis ton plan habituel ?",
  },
  "records-1987-pire-seance": {
    hook: "🧨 Imagine ouvrir ton portefeuille le soir et voir une baisse de plus de 20 %.",
    context: "C'est ce qu'a vécu Wall Street le 19 octobre 1987 : -22,61 % pour le Dow Jones et -20,4 % pour le S&P 500, en une seule séance.",
    question: "Tu aurais regardé les cours minute par minute, ou fermé l'application ?",
  },
  "records-1933-meilleure-seance-dow": {
    hook: "🚀 La meilleure séance du Dow Jones n'a pas eu lieu en plein marché euphorique.",
    context: "Le 15 mars 1933, l'indice a gagné 15,34 % en une journée, après la réouverture des banques américaines décidée par Roosevelt en pleine crise bancaire.",
    question: "Tu aurais parié sur un tel rebond à ce moment-là ?",
  },
  "records-1933-meilleures-seances-sp500": {
    hook: "📈 Les plus gros rebonds arrivent parfois quand l'ambiance est au plus bas.",
    context: "Dans la série historique du S&P 500, la plus forte séance remonte au 15 mars 1933 : +16,61 %. Deux autres records de hausse datent du 30 octobre 1929 et du 13 octobre 2008.",
    question: "Ces dates t'étonnent, ou tu t'attendais à voir de fortes hausses en pleine crise ?",
  },
  "records-2001-nasdaq": {
    hook: "⚡ Le Nasdaq a gagné 14,2 % en une journée. Et pourtant, la bulle internet avait déjà éclaté.",
    context: "C'était le 3 janvier 2001, après une baisse surprise des taux de la Fed. Une séance spectaculaire au milieu d'une période très difficile pour l'indice.",
    question: "Un rebond pareil t'aurait redonné confiance, ou rendu encore plus méfiant ?",
  },
  "duree-bull-bear-moyenne": {
    hook: "🐂 Les baisses font plus de bruit. Mais dans cette étude, les hausses ont duré bien plus longtemps.",
    context: "Pour le S&P 500, Ned Davis Research mesure en moyenne 988 jours pour un bull market, contre 289 jours pour un bear market.",
    twist: "Cela décrit des cycles passés. Personne ne connaît la durée de celui qu'on traverse aujourd'hui.",
    question: "Quand le marché baisse, c'est l'ampleur ou la durée qui te pèse le plus ?",
  },
  "duree-frequence-bear-markets": {
    hook: "⏳ Si tu investis sur plusieurs décennies, tu verras probablement de grosses baisses.",
    context: "Dans le décompte historique de Ned Davis Research, un bear market du S&P 500 revient en moyenne tous les 3,5 ans. On parle d'une baisse d'au moins 20 %.",
    twist: "Une moyenne n'est pas un calendrier : les marchés ne prennent pas rendez-vous tous les trois ans et demi.",
    question: "Tu sais déjà ce que tu ferais si ton indice perdait 20 % ?",
  },
  "crash-1929": {
    hook: "🕰️ En 1929, le Dow Jones a perdu 25 % en quatre séances. La suite a été encore plus longue.",
    context: "La baisse s'est prolongée jusqu'en 1932. L'indice n'a retrouvé son sommet d'avant-krach qu'en novembre 1954, vingt-cinq ans plus tard.",
    twist: "Il s'agit du niveau de l'indice, sans compter les dividendes.",
    question: "Vingt-cinq ans pour revoir un sommet : ça change ta façon de penser ton horizon ?",
  },
  "crash-1987": {
    hook: "🧨 Le 19 octobre 1987, Wall Street a échangé trois fois plus de titres qu'un jour ordinaire.",
    context: "604 millions de titres ont changé de mains pendant le Black Monday. Après cette séance, il a fallu environ 21 mois au marché pour retrouver son niveau d'avant-krach.",
    question: "Après un choc comme celui-là, tu aurais continué à suivre la Bourse chaque jour ?",
  },
  "crash-2000-2002": {
    hook: "💻 Le Nasdaq a mis quinze ans à retrouver son sommet de la bulle internet.",
    context: "Entre mars 2000 et octobre 2002, il a perdu 78 %. Son ancien niveau nominal n'a été dépassé qu'en avril 2015.",
    twist: "Le S&P 500 a aussi chuté sur cette période, d'environ 49 à 50 % : la crise a largement dépassé les seules valeurs internet.",
    question: "Quinze ans sans revoir ton ancien sommet : tu aurais tenu ?",
  },
  "crash-2008": {
    hook: "🏦 En mars 2009, le S&P 500 avait perdu environ 57 % depuis son sommet d'octobre 2007.",
    context: "La crise financière avait déjà duré dix-sept mois. L'indice n'a retrouvé son ancien niveau de clôture qu'en avril 2013.",
    question: "Pendant une baisse aussi longue, tu aurais pu continuer tes versements ?",
  },
  "crash-2020": {
    hook: "🦠 Au début du Covid, le S&P 500 a perdu 33,9 % en 33 jours.",
    context: "Pour mesurer la vitesse du choc : la durée médiane des bear markets recensés entre 1929 et 2020 était de 302 jours. Le creux est arrivé en un peu plus d'un mois.",
    twist: "L'indice a ensuite retrouvé son ancien sommet dès août 2020. À l'époque, rien ne garantissait un rebond aussi rapide.",
    question: "Tu te souviens de ce que tu as fait pendant la chute de mars 2020 ?",
  },
  "series-9-annees-positives": {
    hook: "📅 Neuf années de Bourse positives d'affilée. Puis le compteur repart de zéro.",
    context: "Le S&P 500 a connu une telle série de 1991 à 1999, puis une autre de 2009 à 2017, dividendes compris.",
    twist: "Ces séries ne racontent pas les baisses vécues en cours d'année. Elles mesurent seulement le résultat de chaque année civile.",
    question: "Après neuf années dans le vert, tu te serais senti rassuré ou inquiet ?",
  },
  "series-annees-20-pourcent": {
    hook: "🔥 +20 % ou plus, cinq années de suite. C'est ce qu'a fait le S&P 500 de 1995 à 1999.",
    context: "Une série pareille peut vite donner l'impression que ces rendements sont devenus la norme. Dans la série historique étudiée, cet enchaînement reste exceptionnel.",
    question: "À force de voir de telles hausses, tu aurais fini par les attendre chaque année ?",
  },
  "annees-extremes": {
    hook: "🎢 Une année à -43,8 %. Une autre à +54 %. Les marchés ont connu les deux en deux ans.",
    context: "Dans la série historique américaine, 1931 est la pire année civile et 1933 la meilleure. Ces extrêmes montrent combien une seule année peut déformer notre impression du long terme.",
    twist: "La partie de cette série antérieure à 1957 précède le S&P 500 à 500 valeurs que l'on connaît aujourd'hui.",
    question: "Tu te fies davantage au résultat de l'année ou à ton horizon complet ?",
  },
  "annees-part-positives": {
    hook: "📆 Sur une longue période, près de trois années sur quatre ont fini dans le vert aux États-Unis.",
    context: "Dimensional Fund Advisors trouve environ 73 à 74 % d'années civiles positives sur quelque 154 ans de données. Il reste donc aussi des années où l'investisseur termine dans le rouge.",
    twist: "L'étude porte sur le marché actions américain dans son ensemble, et non sur le seul S&P 500.",
    question: "Une année négative te ferait-elle remettre en cause ta stratégie ?",
  },
  "fenetres-20-ans": {
    hook: "🗓️ Vingt ans, c'est long. Sur la période étudiée depuis 1950, ça a changé le résultat.",
    context: "Dans les données de J.P. Morgan sur les actions américaines, aucune période glissante de vingt ans ne s'est terminée avec un rendement annualisé négatif.",
    twist: "Ce constat dépend de la période et du marché étudiés. Il ne promet rien pour les vingt prochaines années.",
    question: "Tu connais la date à laquelle tu auras réellement besoin de l'argent investi ?",
  },
  "cac40-record-21-ans": {
    hook: "🇫🇷 « Le CAC 40 a mis 21 ans à retrouver son record. » C'est vrai, avec une précision essentielle.",
    context: "Son ancien sommet de cours, atteint en septembre 2000, n'a été dépassé qu'en novembre 2021.",
    twist: "Ce calcul suit l'indice de prix et laisse les dividendes réinvestis de côté. Pour juger ce qu'aurait rapporté un placement, il faut les prendre en compte.",
    question: "Quand tu compares deux indices, tu vérifies s'ils incluent les dividendes ?",
  },
  "cac40-pire-seance-2020": {
    hook: "🇫🇷 Le 12 mars 2020, le CAC 40 a perdu 12,28 % en une seule séance.",
    context: "C'est sa pire journée historique. Pour quelqu'un qui regardait son portefeuille ce soir-là, la baisse ne ressemblait plus à une simple ligne rouge sur un graphique.",
    question: "Tu te souviens de ta réaction ce jour-là, ou tu n'investissais pas encore ?",
  },
};

export const FACTS = RAW_FACTS.map((fact) => ({ ...fact, ...EDITORIAL[fact.id] }));

export function getFact(id) {
  return FACTS.find((f) => f.id === id);
}
