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

export const FACTS = [
  {
    id: "corrections-27-bear-markets",
    family: "chocs",
    category: "Fréquence des corrections",
    indices: ["S&P 500"],
    fact: "Depuis 1928, le S&P 500 a connu 27 bear markets (baisses de 20% ou plus) : environ un tous les 1,5 an entre 1928 et 1945, puis un tous les 5,1 ans depuis 1945 — soit un bear market tous les 56 mois en moyenne depuis 1932.",
    source: "S&P Dow Jones Indices",
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

export function getFact(id) {
  return FACTS.find((f) => f.id === id);
}
