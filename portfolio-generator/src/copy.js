// Textes variantes — tirés au hasard à chaque génération pour éviter la répétition.

export const INTROS = [
  "Voici comment ce portefeuille aurait traversé les 6 dernières années 👇",
  "Un exemple concret de répartition, avec les vrais chiffres derrière 👇",
  "Zoom sur une allocation possible, actif par actif 👇",
  "Comment ce mix aurait performé depuis 2020, en détail 👇",
  "Un exemple de patrimoine construit ligne par ligne, à décortiquer 👇",
  "Voici la composition, la logique... et les résultats passés 👇",
  "Décortiquons ensemble cette répartition, actif par actif 👇",
];

// Paliers de risque (basés sur le risque pondéré moyen du portefeuille)
export const RISK_TIERS = {
  prudent: {
    label: "Prudent",
    taglines: [
      "la priorité absolue va à la protection du capital.",
      "on privilégie la stabilité, quitte à sacrifier un peu de performance.",
      "dormir tranquille compte plus que viser la lune.",
      "le capital d'abord, la performance ensuite.",
    ],
    warnings: [
      "⚠️ Profil prudent : la performance sera limitée, mais les creux aussi.",
      "⚠️ Ici, on protège le capital avant de chercher du rendement.",
      "⚠️ Ce profil vise la régularité, pas la performance maximale.",
      "⚠️ Peu de volatilité attendue, donc peu de surprises dans les deux sens.",
    ],
    engagements: [
      "Toi aussi tu privilégies la sécurité avant tout ? 👇",
      "Un profil trop prudent à ton goût, ou au contraire rassurant ? 👇",
      "Tu places le curseur où entre sécurité et performance ? 👇",
    ],
  },
  defensif: {
    label: "Défensif",
    taglines: [
      "un peu de dynamisme, sans sacrifier la prudence.",
      "on accepte un peu de volatilité pour un peu plus de rendement.",
      "l'objectif : amortir les chocs sans renoncer à la croissance.",
      "un équilibre penché du côté de la sécurité.",
    ],
    warnings: [
      "⚠️ Profil défensif : les baisses sont amorties, pas éliminées.",
      "⚠️ Une poche de sécurité qui n'empêche pas totalement les creux.",
      "⚠️ Moins de secousses qu'un portefeuille 100 % actions, mais pas zéro risque.",
      "⚠️ Pensé pour limiter la casse en cas de mauvaise année.",
    ],
    engagements: [
      "Ce dosage sécurité/performance te correspond ? 👇",
      "Trop défensif, ou au bon endroit pour toi ? 👇",
      "C'est ce genre d'équilibre que tu recherches ? 👇",
    ],
  },
  equilibre: {
    label: "Équilibré",
    taglines: [
      "un compromis assumé entre performance et stabilité.",
      "ni trop prudent, ni trop offensif : le juste milieu.",
      "on vise la croissance sans s'exposer à tous les excès du marché.",
      "un peu de tout, pour ne dépendre d'aucun scénario unique.",
    ],
    warnings: [
      "⚠️ Profil équilibré : des hauts et des bas, mais globalement plus lissés.",
      "⚠️ Ni le plus rassurant, ni le plus risqué : un vrai compromis.",
      "⚠️ Les creux existent, mais restent en général gérables sur la durée.",
      "⚠️ Pensé pour tenir sur la durée sans trop de montagnes russes.",
    ],
    engagements: [
      "L'équilibre parfait pour toi, ou tu préfères trancher plus franchement ? 👇",
      "Ce type de compromis te correspond ? 👇",
      "Tu es plutôt team équilibre ou team extrêmes ? 👇",
    ],
  },
  dynamique: {
    label: "Dynamique",
    taglines: [
      "on accepte plus de volatilité pour viser plus de performance.",
      "la croissance prime, quitte à accepter des creux marqués.",
      "un profil qui suppose de tenir bon dans les mauvaises années.",
      "on met le curseur clairement du côté de la performance.",
    ],
    warnings: [
      "⚠️ Profil dynamique : attends-toi à des baisses parfois marquées.",
      "⚠️ Ce type de portefeuille demande des nerfs solides dans les creux.",
      "⚠️ La performance vient avec son lot de baisses temporaires.",
      "⚠️ Pas fait pour un horizon court : il faut du temps devant soi.",
    ],
    engagements: [
      "Tu serais capable de tenir ce genre de portefeuille dans une mauvaise année ? 👇",
      "Ce niveau de risque, ça te tente ou ça t'inquiète ? 👇",
      "Dynamique comme ça, ou tu vises encore plus offensif ? 👇",
    ],
  },
  offensif: {
    label: "Offensif",
    taglines: [
      "la performance prime, quitte à traverser de sacrées turbulences.",
      "un profil réservé à ceux qui ont du temps devant eux et les nerfs solides.",
      "on assume une forte volatilité pour viser un potentiel de gain élevé.",
      "un pari clair sur la croissance, sans filet de sécurité important.",
    ],
    warnings: [
      "⚠️ Profil offensif : de fortes variations sont à prévoir, dans les deux sens.",
      "⚠️ Ce portefeuille peut perdre beaucoup avant de regagner beaucoup.",
      "⚠️ Réservé à un horizon long et à une tolérance au risque élevée.",
      "⚠️ Attends-toi à des montagnes russes, certaines années pouvant être violentes.",
    ],
    engagements: [
      "Ce niveau de risque est-il trop élevé pour toi ? 👇",
      "Qui ici tiendrait un portefeuille aussi offensif sans paniquer ? 👇",
      "Toi, jusqu'où tu es prêt à pousser le curseur du risque ? 👇",
    ],
  },
};

// Profils thématiques : remplacent le nom + accroche si la composition s'y prête,
// mais réutilisent les avertissements/engagements du palier de risque sous-jacent.
export const THEMES = {
  proEuropeen: {
    name: "Le Pro-Européen",
    taglines: [
      "un portefeuille qui mise clairement sur l'Europe plutôt que sur les États-Unis.",
      "l'Europe (et la France) au cœur de la stratégie.",
      "pour ceux qui préfèrent investir près de chez eux.",
    ],
  },
  proAmericain: {
    name: "Le Pro-Américain",
    taglines: [
      "un portefeuille massivement exposé aux États-Unis et à sa tech.",
      "un pari clair sur la domination économique américaine.",
      "Wall Street en majorité, avec ses forces et ses excès.",
    ],
  },
  antiInflation: {
    name: "L'Anti-Inflation",
    taglines: [
      "or, matières premières et actifs réels pour se protéger de l'érosion monétaire.",
      "un bouclier pensé contre la hausse des prix.",
      "quand la confiance dans la monnaie vacille, on se tourne vers les actifs tangibles.",
    ],
  },
  tech100: {
    name: "Le 100% Tech",
    taglines: [
      "un portefeuille qui mise tout sur l'innovation et la révolution numérique.",
      "IA, semi-conducteurs, géants du numérique : tout est concentré sur la tech.",
      "un pari concentré sur les entreprises qui façonnent demain.",
    ],
  },
  everything: {
    name: "L'Everything Portfolio",
    taglines: [
      "un peu de tout, partout, pour ne dépendre d'aucun scénario économique unique.",
      "actions, obligations, or, immobilier : la diversification poussée à son maximum.",
      "l'idée qu'on ne sait jamais quel actif sera le meilleur, alors on les prend tous.",
    ],
  },
  cryptoCurieux: {
    name: "Le Crypto-Curieux",
    taglines: [
      "une vraie place laissée aux actifs numériques, pour ceux qui y croient.",
      "un pied dans la finance traditionnelle, un pied dans la crypto.",
      "pour ceux qui veulent goûter à la volatilité des cryptoactifs, sans y aller à fond.",
    ],
  },
};

export const FACT_ASSET_TEMPLATES = [
  (name, year, val) =>
    `→ En ${year}, ${name} a ${val >= 0 ? "gagné" : "perdu"} ${Math.abs(val).toFixed(1).replace(".", ",")} % à lui seul.`,
  (name, year, val) =>
    `→ Rien qu'en ${year}, ${name} a ${val >= 0 ? "grimpé" : "chuté"} de ${Math.abs(val).toFixed(1).replace(".", ",")} %.`,
  (name, year, val) =>
    `→ ${name} a connu sa ${val >= 0 ? "meilleure" : "pire"} année en ${year} (${val >= 0 ? "+" : ""}${val.toFixed(1).replace(".", ",")} %).`,
];

export const FACT_MSCI_TEMPLATES = [
  (year, worldVal, portVal) =>
    `→ En ${year}, quand le MSCI World ${worldVal >= 0 ? "gagnait" : "perdait"} ${Math.abs(worldVal).toFixed(1).replace(".", ",")} %, ce portefeuille ${portVal >= 0 ? "gagnait" : "perdait"} ${Math.abs(portVal).toFixed(1).replace(".", ",")} %.`,
  (year, worldVal, portVal) =>
    `→ Comparaison ${year} : MSCI World ${worldVal >= 0 ? "+" : ""}${worldVal.toFixed(1).replace(".", ",")} % vs ${portVal >= 0 ? "+" : ""}${portVal.toFixed(1).replace(".", ",")} % pour ce portefeuille.`,
];

export const CLOSING_LINES = [
  "Simulation basée sur données historiques, pas une garantie.",
  "À adapter selon tes enveloppes disponibles (PEA, AV, CTO).",
];

export const DISCLAIMER = "📣 Exemple illustratif, pas un conseil en investissement.";

export const SEPARATOR = "─────────────────";
