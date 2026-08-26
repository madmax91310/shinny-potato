// Bibliothèque à double axe, indépendants l'un de l'autre :
//   Axe 1 — RISK_LEVELS : la volatilité acceptée et l'horizon (Prudent → Offensif).
//   Axe 2 — PROFILES : la thèse / conviction de l'investisseur (Généraliste → Thématique).
// Un portefeuille = un profil + un niveau de risque. Toutes les paires ne sont pas valides
// (cf. `riskCombos` de chaque profil, qui ne définit une entrée que pour les niveaux compatibles
// — voir aussi le tableau de compatibilité exposé par `isCompatible()` en bas de fichier).

export const RISK_ORDER = ["prudent", "defensif", "equilibre", "dynamique", "offensif"];

export const RISK_LABELS = {
  prudent: "Prudent",
  defensif: "Défensif",
  equilibre: "Équilibré",
  dynamique: "Dynamique",
  offensif: "Offensif",
};

// bound = pire année plancher pour le niveau de risque. min = perte maximale acceptable
// (en points de %, négatif), null = pas de plancher. Pas de plafond : un portefeuille plus
// prudent que nécessaire reste valide pour son niveau.
export const RISK_BOUNDS = {
  prudent: { min: -5, max: null, text: "perte max acceptable < 5 %" },
  defensif: { min: -10, max: null, text: "perte max acceptable < 10 %" },
  equilibre: { min: -20, max: null, text: "perte max acceptable < 20 %" },
  dynamique: { min: -30, max: null, text: "perte max acceptable < 30 %" },
  offensif: { min: null, max: null, text: "pas de plancher — la performance prime" },
};

// Rétro-compatibilité de nommage avec engine.js (mêmes clés, nouveau sens : uniquement l'axe
// risque désormais, plus jamais mélangé avec la thèse).
export const TIER_ORDER = RISK_ORDER;
export const TIER_LABELS = RISK_LABELS;
export const TIER_WORST_BOUNDS = RISK_BOUNDS;

// Familles d'actifs interchangeables (cf. moteur : jamais plus de 40% des tweets générés sur un
// même émetteur). Or / Bitcoin / obligations corporate € IG sont des jumeaux stricts (même
// sous-jacent) ; Monde / Émergents / Dividendes sont des indices proches mais pas identiques,
// chaque option étant revalidée sur les bornes de pire année du combo qui l'utilise.
export const GOLD_OPTIONS = ["or", "or_wisdomtree", "or_ishares", "or_amundi"];
export const BITCOIN_OPTIONS = ["bitcoin", "bitcoin_wisdomtree", "bitcoin_etcgroup", "bitcoin_21shares"];
export const CORPBOND_OPTIONS = ["oblig_corp_ig", "oblig_corp_amundi", "oblig_corp_vanguard", "oblig_corp_spdr"];
export const WORLD_OPTIONS = ["msci_world", "msci_world_ishares", "msci_world_amundi_pea", "ftse_allworld_vanguard", "msci_acwi"];
export const EM_OPTIONS = ["msci_em", "msci_em_amundi", "ftse_em_vanguard", "msci_em_spdr"];
// dividend_leaders (VanEck TDIV) ajouté lors de l'audit "enrichissement sectoriel" (août 2026) :
// stratégie dividende mondiale distincte des trois autres (indice Morningstar propre), vérifiée
// réelle avant ajout — cf. data.js pour le détail des sources et la résolution d'une contradiction
// de signe trouvée sur l'année 2022.
export const DIVIDEND_OPTIONS = ["strat_dividendes", "high_dividend", "quality_dividend", "dividend_leaders"];
// Réservé au profil Rentier (cf. sa règle "uniquement des lignes distribuantes") : jumeaux Dist
// vérifiés des trois fonds ci-dessus, plus foncieres_etf_dist utilisé directement par id ailleurs
// dans les riskCombos de ce profil.
export const DIVIDEND_OPTIONS_DIST = ["strat_dividendes_dist", "high_dividend_dist", "quality_dividend_dist"];
// Groupes par actif sous-jacent ajoutés lors de l'audit "enrichissement bibliothèque" : chaque
// membre partage le même tableau `r` que l'actif d'origine (même sous-jacent réel, vérifié un par
// un). Plusieurs suggestions du prompt d'origine ont été écartées plutôt que groupées à l'aveugle :
// les fonds "Lyxor" ont presque tous été rebaptisés Amundi depuis 2021-2023 (noms obsolètes), et
// iShares Developed Markets Property Yield (IWDP) suit en réalité l'indice "FTSE EPRA/NAREIT
// Developed Dividend+" (screené haut rendement), pas l'indice Global Developed de foncieres_etf —
// performance différente, donc non groupé.
export const SP500_OPTIONS = ["sp500", "sp500_ishares"];
export const NASDAQ100_OPTIONS = ["nasdaq100", "nasdaq100_ishares"];
export const EUROSTOXX50_OPTIONS = ["eurostoxx50", "eurostoxx50_ishares"];
export const COMMODITY_OPTIONS = ["mp_large", "mp_large_icom"];
// Immobilier coté : foncieres_etf (FTSE EPRA Nareit Global Developed) et immo_gpr (GPR Global 100,
// ajouté lors de l'audit "enrichissement sectoriel") suivent des indices différents mais proches
// (même logique que EM_OPTIONS/DIVIDEND_OPTIONS ci-dessus) — jamais utilisé pour les tiers Rentier
// (foncieres_etf_dist reste seul, cf. DIVIDEND_OPTIONS_DIST), immo_gpr n'ayant pas de part Dist
// vérifiée.
export const IMMOBILIER_OPTIONS = ["foncieres_etf", "immo_gpr"];
// Obligations haut rendement € : jumeau strict (même indice Markit iBoxx EUR Liquid High Yield),
// ajouté lors du même audit.
export const HIGHYIELD_OPTIONS = ["oblig_hy", "oblig_hy_amundi"];
// "Thématique" : le secteur pari change à chaque génération. Les secteurs les plus extrêmes
// (semi-conducteurs, technologie, robotique, cybersécurité — tous ajoutés lors de l'audit
// "enrichissement sectoriel", pire année historique entre -28% et -35%, comparable à sect_semi)
// sont réservés aux niveaux de risque qui peuvent absorber leur volatilité. À l'inverse, la santé
// (sect_sante), la consommation défensive (sect_conso_defensive) et les services aux collectivités
// (sect_utilities) sont structurellement défensifs (pire année historique entre -1% et -7%) : ils
// ne doivent jamais être piochés en Dynamique/Offensif, d'où THEME_OPTIONS_AGGRESSIVE qui les
// exclut tous. L'énergie propre (sect_energie_propre) a un profil à part — +141,80% en 2020 suivi
// de quatre années consécutives négatives (2021-2024) : seuls les paliers de risque sans plancher
// serré (Dynamique/Offensif) encaissent cette amplitude, jamais mélangée aux secteurs plus mesurés
// de THEME_OPTIONS_FULL.
export const THEME_OPTIONS_CALM = ["sect_sante", "sect_energie", "sect_conso_defensive", "sect_utilities"];
export const THEME_OPTIONS_FULL = ["sect_semi", "sect_sante", "sect_energie", "sect_conso_defensive", "sect_utilities", "sect_tech", "sect_robotique", "sect_cybersecurite"];
export const THEME_OPTIONS_AGGRESSIVE = ["sect_semi", "sect_energie", "sect_tech", "sect_robotique", "sect_cybersecurite", "sect_energie_propre"];
// ETF à levier (réplication synthétique 2x quotidien) : lqq (Nasdaq-100) et cl2 (MSCI USA, plus
// large que le seul Nasdaq-100) — indices proches mais pas identiques (même logique que
// WORLD_OPTIONS/EM_OPTIONS ci-dessus), chaque option revalidée sur les bornes de pire année du
// combo qui l'utilise. Groupés pour que la génération alterne entre les deux plutôt que de
// toujours piocher le même pari à levier — ajouté lors de l'audit "variété levier" (août 2026).
export const LEVERAGE_OPTIONS = ["lqq", "cl2"];

// Plafond de fréquence par groupe : au-delà de ce ratio d'apparition dans l'historique de la
// session, un membre du groupe est exclu des tirages tant qu'une autre option reste disponible
// (cf. resolveAssetId dans engine.js). Par défaut 30% pour tout groupe non listé ici ; l'or est
// desserré à 40% (moins d'alternatives réellement distinctes) et les blocs actions US /
// obligations resserrés à 25% (plus d'alternatives, on veut une rotation plus marquée).
const FREQUENCY_CAPS = new Map([
  [GOLD_OPTIONS, 0.4],
  [SP500_OPTIONS, 0.25],
  [NASDAQ100_OPTIONS, 0.25],
  [CORPBOND_OPTIONS, 0.25],
  [LEVERAGE_OPTIONS, 0.25],
]);
const DEFAULT_FREQUENCY_CAP = 0.3;
export function getFrequencyCap(idOptions) {
  return FREQUENCY_CAPS.get(idOptions) ?? DEFAULT_FREQUENCY_CAP;
}

export const PROFILES = [
  {
    id: "generaliste",
    label: "Le Généraliste",
    accroches: [
      "Pas de conviction forte ici. Juste une diversification qui couvre un maximum de scénarios.",
      "Le portefeuille du bon sens : rien d'extrême, tout est pesé.",
      "Ni pari sectoriel, ni pari géographique : juste large, tout simplement.",
      "Un peu de tout, pour ne dépendre d'aucun scénario unique.",
      "La diversification comme seule vraie conviction.",
    ],
    sousTitres: [
      "Voici comment ça se traduit concrètement 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le détail, sans filtre 👇",
      "Ce que ça donne, ligne par ligne 👇",
    ],
    ctas: [
      "Tu es plutôt team diversification totale ou team convictions fortes ? 👇",
      "Ce dosage actions / stabilisateurs, tu le trouves juste ? 👇",
      "Tu changerais quelle ligne en premier dans ce portefeuille ? 👇",
      "Un peu de tout : rassurant, ou juste indécis ? 👇",
      "Le portefeuille « par défaut », ça te convient ou tu veux plus de caractère ? 👇",
    ],
    warnings: [
      "Ce portefeuille suit la logique de son niveau de risque, sans thèse supplémentaire. Adapte le niveau à ton horizon avant tout.",
      "La diversification limite les excès dans les deux sens : ni les pires baisses, ni les meilleures hausses.",
    ],
    contextFallback: [
      "Le stabilisateur a joué son rôle : sans lui, la baisse aurait été nettement plus marquée.",
      "L'or a absorbé une partie de la baisse — sans lui, le résultat aurait été plus sévère.",
      "La poche obligataire a joué son rôle d'amortisseur cette année-là.",
      "La diversification entre actifs décorrélés a limité les dégâts.",
    ],
    riskCombos: {
      prudent: {
        assets: [
          {
            id: "fonds_euros", pct: 55,
            pourquoi: [
              "Le socle. Plus de la moitié du portefeuille pour garantir qu'aucune mauvaise année ne fasse vraiment mal.",
              "{pct}% sur le support le plus sûr, cohérent avec un plancher de perte très serré.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 25,
            pourquoi: [
              "Un peu plus de rendement que le fonds euros, sans sortir de la logique prudente.",
              "La couche intermédiaire : un peu de risque de crédit, en échange d'un coupon plus généreux.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 10,
            pourquoi: [
              "Une toute petite dose d'actions mondiales, pour ne pas être complètement absent des marchés.",
              "{pct}% seulement : juste assez pour participer, pas assez pour subir une vraie correction.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 10,
            pourquoi: [
              "Un quatrième type d'actif, décorrélé des trois autres.",
              "La touche de diversification qui ne dépend ni des taux ni des marchés actions.",
            ],
          },
        ],
      },
      defensif: {
        assets: [
          {
            id: "fonds_euros", pct: 35,
            pourquoi: [
              "Le socle qui amortit le reste du portefeuille, sans en constituer la totalité.",
              "{pct}% pour garder une vraie marge de sécurité à ce niveau de risque.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 25,
            pourquoi: [
              "Le stabilisateur obligataire, entre le fonds euros et les actions.",
              "Vient limiter la casse quand les actions traversent une mauvaise année.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 25,
            pourquoi: [
              "Le moteur de croissance du portefeuille, sans en devenir la ligne dominante.",
              "{pct}% pour participer aux marchés actions sans dépendre uniquement d'eux.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Un quatrième type d'actif, pour ne pas dépendre que des taux ou des actions.",
              "La protection qui joue quand les deux autres lignes ne suffisent pas.",
            ],
          },
        ],
      },
      equilibre: {
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 30,
            pourquoi: [
              "Le moteur de croissance du portefeuille : plusieurs milliers d'entreprises mondiales en une ligne.",
              "{pct}% : la part qui doit faire le gros du travail sur le long terme.",
            ],
          },
          {
            idOptions: SP500_OPTIONS, pct: 15,
            pourquoi: [
              "Un pari plus concentré sur le marché américain, en complément de la ligne monde plus diversifiée géographiquement.",
              "{pct}% pour renforcer l'exposition aux États-Unis sans dépendre uniquement du seul indice mondial.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 20,
            pourquoi: [
              "Le stabilisateur. Même en pleine crise, cette poche amortit les fluctuations des autres lignes.",
              "Vient limiter la casse quand les actions traversent une mauvaise année.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Un quatrième type d'actif, décorrélé des trois autres : ni une action, ni une dette.",
              "La ligne qui protège quand ni les actions ni les obligations ne fonctionnent.",
            ],
          },
          {
            idOptions: IMMOBILIER_OPTIONS, pct: 20,
            pourquoi: [
              "Une cinquième source de performance, avec sa propre logique — celle de l'immobilier coté.",
              "Complète la diversification sans dupliquer ce que font déjà les autres lignes.",
            ],
          },
        ],
      },
      dynamique: {
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 40,
            pourquoi: [
              "Le socle actions du portefeuille, même dans sa version la plus dynamique.",
              "{pct}% : le cœur reste diversifié mondialement avant d'ajouter des paris plus ciblés.",
            ],
          },
          {
            idOptions: NASDAQ100_OPTIONS, pct: 21,
            pourquoi: [
              "La partie qui vise vraiment la surperformance : concentrée sur l'innovation américaine.",
              "Le moteur de croissance le plus agressif du portefeuille.",
            ],
          },
          {
            // Poids volontairement minime : au-delà, le pire scénario historique du combo (2022)
            // dépasse le plancher de perte de -30% de ce palier — vérifié empiriquement (cf.
            // script de stress-test). Pas un choix esthétique, une limite dure du moteur.
            idOptions: LEVERAGE_OPTIONS, pct: 4,
            pourquoi: [
              "Une toute petite dose de levier ({pct}%), gardée minime pour ne pas faire sortir ce portefeuille de son plafond de perte.",
              "{pct}% seulement : de quoi introduire le levier sans peser sur le pire scénario historique du portefeuille.",
            ],
          },
          {
            idOptions: EM_OPTIONS, pct: 20,
            pourquoi: [
              "Un pari sur le rattrapage économique des pays émergents — plus de potentiel, plus de volatilité.",
              "Ajoute une deuxième source de croissance, décorrélée des seuls marchés développés.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Le filet de sécurité minimal, face à trois lignes qui poussent toutes vers la croissance.",
              "{pct}% pour ne pas laisser le portefeuille à 100% dépendant des marchés actions.",
            ],
          },
        ],
      },
      offensif: {
        assets: [
          {
            idOptions: NASDAQ100_OPTIONS, pct: 25,
            pourquoi: [
              "Le moteur principal : {pct}% concentrés sur la tech américaine la plus agressive.",
              "La ligne la plus lourde du portefeuille, sur l'un des indices les plus volatils qui existent.",
            ],
          },
          {
            // Palier Offensif = pas de plancher de perte (RISK_BOUNDS.offensif.min = null) : poids
            // significatif possible, contrairement à la version Dynamique ci-dessus.
            idOptions: LEVERAGE_OPTIONS, pct: 15,
            pourquoi: [
              "{pct}% en ETF à levier 2x quotidien : ce palier n'a pas de plancher de perte, donc pas de raison de se limiter à un tracker classique.",
              "Le vrai pari agressif du portefeuille : {pct}% sur un support capable de gagner — ou de perdre — bien plus vite que le Nasdaq-100 lui-même.",
            ],
          },
          {
            idOptions: EM_OPTIONS, pct: 30,
            pourquoi: [
              "Un deuxième moteur de croissance, sur des marchés encore plus volatils que les États-Unis.",
              "Ajoute une deuxième zone géographique à fort potentiel, et à fort risque.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 20,
            pourquoi: [
              "La seule ligne un peu plus posée du portefeuille — et encore, elle reste 100% actions.",
              "Même la ligne « la plus sage » de ce portefeuille n'a aucun filet obligataire.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 10,
            pourquoi: [
              "{pct}% pour ajouter une dernière source de potentiel, aussi explosive soit-elle.",
              "La touche la plus spéculative de ce portefeuille déjà très offensif.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "rentier",
    label: "Le Rentier",
    accroches: [
      "L'objectif n'est pas de faire grossir le capital vite. C'est qu'il verse un revenu, chaque année.",
      "Chaque ligne de ce portefeuille a le même métier : distribuer.",
      "Ici, la performance se mesure en revenus perçus, pas en plus-value latente.",
      "Le capital travaille pour verser un chèque, pas pour battre un record.",
      "Moins de plus-value latente, plus de virements réguliers.",
    ],
    sousTitres: [
      "Voici la composition qui porte cette logique 👇",
      "Le détail, ligne par ligne 👇",
      "Ce que ça donne concrètement 👇",
      "Le détail, sans détour 👇",
      "Poste par poste, ce que ça rapporte 👇",
    ],
    ctas: [
      "Tu vises plutôt le revenu régulier ou la plus-value à la revente ? 👇",
      "SCPI, foncières, dividendes, JEPQ... ta source de revenu préférée ? 👇",
      "Vivre (en partie) de son portefeuille, tu y penses déjà ou c'est trop tôt pour toi ? 👇",
      "Tu vises quel revenu mensuel pour en vivre un jour ? 👇",
      "Immobilier physique, foncières cotées ou dividendes : ta source de revenu préférée ? 👇",
    ],
    warnings: [
      "Ce portefeuille génère des revenus — pas une performance maximale. C'est un choix assumé, pas une contrainte.",
      "La plupart de ces revenus sont fiscalisés chaque année, même sans rien vendre. À anticiper selon ton enveloppe.",
    ],
    // Uniquement des lignes en part distribuante (Dist) : la thèse est de percevoir un revenu,
    // pas de capitaliser silencieusement — cohérent avec l'immobilier, les dividendes, le haut
    // rendement obligataire et le covered call, tous choisis pour leur distribution régulière.
    // Toujours ajoutée après l'avertissement (cf. engine.js) : pour un profil qui vit de ses
    // revenus, une baisse de capital reste significative même si les distributions continuent.
    capitalNote: true,
    contextFallback: [
      "Même dans sa pire année, les revenus distribués par ces lignes ont continué à tomber.",
      "La baisse touche la valeur des parts, pas les distributions : les revenus, eux, ont continué à tomber.",
      "Le capital a reculé cette année-là, mais les lignes du portefeuille ont continué à verser.",
    ],
    riskCombos: {
      prudent: {
        assets: [
          {
            id: "fonds_euros", pct: 50,
            pourquoi: [
              "La moitié du portefeuille sur le support le plus sûr, avant même de parler de revenu.",
              "{pct}% pour que la recherche de revenu ne mette jamais le capital en danger.",
            ],
          },
          {
            idOptions: HIGHYIELD_OPTIONS, pct: 20,
            pourquoi: [
              "Un coupon nettement supérieur aux obligations classiques — le prix à payer pour plus de revenu.",
              "La première vraie source de rendement du portefeuille, en version distribuante.",
            ],
          },
          {
            id: "scpi", pct: 15,
            pourquoi: [
              "Des loyers versés régulièrement, portefeuille mutualisé de bureaux et commerces.",
              "La brique la plus classique du rentier français : le revenu locatif, sans la gestion.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS_DIST, pct: 15,
            pourquoi: [
              "Des entreprises qui versent (et augmentent) leur dividende depuis des années.",
              "Complète les trois autres lignes avec une quatrième source de revenu, en version Dist.",
            ],
          },
        ],
      },
      defensif: {
        assets: [
          {
            id: "fonds_euros", pct: 35,
            pourquoi: [
              "Le socle qui permet aux trois autres lignes d'exister sans mettre en danger l'ensemble.",
              "{pct}% de stabilité pure avant d'aller chercher du rendement.",
            ],
          },
          {
            id: "foncieres_etf_dist", pct: 15,
            pourquoi: [
              "Une dose d'immobilier coté pour aller chercher un peu plus de rendement — en quantité mesurée.",
              "{pct}% seulement : de quoi profiter du rendement immobilier sans subir sa pleine volatilité.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS_DIST, pct: 25,
            pourquoi: [
              "Des entreprises qui paient (et augmentent) leur dividende depuis des années.",
              "La brique « revenu régulier » du portefeuille, en version distribuante.",
            ],
          },
          {
            idOptions: HIGHYIELD_OPTIONS, pct: 25,
            pourquoi: [
              "Un coupon nettement supérieur aux obligations classiques — le prix à payer pour plus de revenu.",
              "La deuxième source de rendement obligataire du portefeuille.",
            ],
          },
        ],
      },
      equilibre: {
        assets: [
          {
            id: "scpi", pct: 15,
            pourquoi: [
              "Des loyers versés régulièrement, portefeuille mutualisé de bureaux et commerces — le revenu « à l'ancienne ».",
              "La brique la plus classique du rentier français : le revenu locatif, sans la gestion.",
            ],
          },
          {
            id: "foncieres_etf_dist", pct: 45,
            pourquoi: [
              "La version cotée et liquide de l'immobilier de revenu : mêmes loyers, beaucoup plus de souplesse.",
              "{pct}% : la ligne la plus lourde, car c'est elle qui distribue le plus régulièrement.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS_DIST, pct: 25,
            pourquoi: [
              "Des entreprises qui existent pour verser (et augmenter) un dividende depuis des décennies.",
              "Complète les deux lignes immobilières avec une troisième source de revenu, décorrélée du secteur.",
            ],
          },
          {
            idOptions: HIGHYIELD_OPTIONS, pct: 15,
            pourquoi: [
              "Un coupon nettement supérieur aux obligations classiques — le prix à payer pour plus de revenu.",
              "La touche de rendement obligataire qui vient compléter les trois sources de revenu déjà présentes.",
            ],
          },
        ],
      },
      dynamique: {
        assets: [
          {
            id: "jepq", pct: 45,
            pourquoi: [
              "Un revenu mensuel élevé (~9-10% par an), en échange d'une hausse plafonnée en marché très haussier.",
              "{pct}% : la ligne la plus lourde de cette version dynamique du Rentier.",
            ],
          },
          {
            id: "foncieres_etf_dist", pct: 25,
            pourquoi: [
              "Une deuxième source de revenu, décorrélée du covered call : les loyers de l'immobilier coté.",
              "Vient diversifier la source de distribution au-delà du seul JEPQ.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS_DIST, pct: 20,
            pourquoi: [
              "Une troisième source de revenu, sur des entreprises qui distribuent depuis des décennies.",
              "Complète le duo JEPQ / foncières avec une brique actions plus classique.",
            ],
          },
          {
            idOptions: HIGHYIELD_OPTIONS, pct: 10,
            pourquoi: [
              "Une dernière touche de rendement obligataire, pour diversifier les sources de revenu.",
              "{pct}% pour ne pas dépendre uniquement d'actifs actions dans la recherche de revenu.",
            ],
          },
        ],
      },
      offensif: {
        assets: [
          {
            id: "jepq", pct: 65,
            pourquoi: [
              "{pct}% : la thèse assumée jusqu'au bout — un revenu élevé, quitte à plafonner fortement la hausse.",
              "La ligne dominante de cette version offensive du Rentier : tout le portefeuille tourne autour d'elle.",
            ],
          },
          {
            id: "foncieres_etf_dist", pct: 20,
            pourquoi: [
              "Une deuxième source de revenu, pour ne pas dépendre uniquement du covered call.",
              "Vient diversifier la distribution au-delà de la seule stratégie d'options.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS_DIST, pct: 15,
            pourquoi: [
              "La touche finale de diversification, toujours dans la même logique de revenu.",
              "Complète le portefeuille sans jamais sortir de la thèse du revenu régulier.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "pro_europe",
    label: "Le Pro-Européen",
    accroches: [
      "Un portefeuille qui mise sur l'Europe plutôt que sur les États-Unis — jusqu'au bout de la logique.",
      "Majoritairement européen ici. Le pari est assumé.",
      "Pour ceux qui pensent que l'Europe est sous-valorisée, pas sous-performante.",
      "L'Europe a le potentiel. Ce portefeuille prend le pari qu'elle finira par le montrer.",
      "Ici, l'essentiel du portefeuille parle une langue européenne.",
    ],
    sousTitres: [
      "Voici à quoi ressemble ce pari 👇",
      "Le détail, ligne par ligne 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le pari, ligne par ligne 👇",
      "Ce que ça donne une fois posé sur le papier 👇",
    ],
    ctas: [
      "Tu crois au retour de l'Europe ou tu restes sur le S&P 500 ? 👇",
      "Minimum 70% Europe, ça te semble courageux ou risqué ? 👇",
      "Tu miserais sur quel pays européen en premier ? 👇",
      "Une large majorité d'actions européennes dans ton portefeuille : t'oserais ? 👇",
      "Le CAC 40 mérite plus de confiance qu'on ne le dit, non ? 👇",
    ],
    warnings: [
      "Ce portefeuille limite fortement la croissance américaine des dernières années. C'est un pari, pas une certitude.",
      "Seuls l'or et le fonds euros complètent la poche européenne : aucune autre zone géographique n'est représentée.",
    ],
    // Toujours ajoutée après l'avertissement (cf. engine.js) : la sous-performance de l'Europe
    // face aux États-Unis sur 10 ans est un fait qu'il faut assumer, pas nuancer.
    mandatoryWarning: "L'Europe a sous-performé les États-Unis sur 10 ans. Ce portefeuille assume ce contre-pied.",
    contextFallback: [
      "La baisse touche la zone euro dans son ensemble — c'est le risque assumé d'un pari majoritairement régional.",
      "Sans diversification géographique hors Europe, ce portefeuille encaisse pleinement les mauvaises années du continent.",
      "Le pari régional joue dans les deux sens : cette baisse en est la contrepartie assumée.",
    ],
    // Minimum 70% Europe partout ; les 30% restants ne tolèrent que l'or physique (actif neutre)
    // et le fonds euros (actif français) — jamais d'obligations globales, d'actions US ou
    // d'émergents hors Europe, incompatibles avec la thèse.
    riskCombos: {
      prudent: {
        assets: [
          {
            id: "oblig_etat_eur_short", pct: 55,
            pourquoi: [
              "De la dette d'État européenne à très courte échéance : le stabilisateur le plus sûr qui reste 100% Europe.",
              "{pct}% pour garder la thèse européenne tout en respectant un plancher de perte serré.",
            ],
          },
          {
            idOptions: EUROSTOXX50_OPTIONS, pct: 15,
            pourquoi: [
              "La seule ligne actions de cette version prudente : les 50 plus grandes entreprises de la zone euro.",
              "Une petite dose de croissance européenne, sans compromettre la logique prudente.",
            ],
          },
          {
            id: "fonds_euros", pct: 20,
            pourquoi: [
              "La part « neutre » tolérée par la thèse : un actif français, pas au sens strict un pari européen.",
              "Vient compléter la poche de sécurité sans sortir du plafond de 30% autorisé hors conviction Europe.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 10,
            pourquoi: [
              "L'or est le seul actif « sans nationalité » toléré par la thèse — jusqu'à 30% avec le fonds euros.",
              "Complète la poche neutre sans jamais introduire d'actions ou d'obligations non-européennes.",
            ],
          },
        ],
      },
      defensif: {
        assets: [
          {
            idOptions: EUROSTOXX50_OPTIONS, pct: 30,
            pourquoi: [
              "Le cœur actions de la zone euro : LVMH, TotalEnergies, SAP...",
              "{pct}% pour donner un vrai poids à la conviction européenne, même à ce niveau de risque.",
            ],
          },
          {
            id: "cac40", pct: 20,
            pourquoi: [
              "La France en particulier, en plus de la zone euro dans son ensemble.",
              "Vient renforcer la partie française de la thèse, aux côtés de l'Euro Stoxx 50.",
            ],
          },
          {
            id: "oblig_etat_eur_short", pct: 20,
            pourquoi: [
              "Le stabilisateur du portefeuille — et logiquement, lui aussi 100% européen.",
              "De la dette d'État à courte échéance, moins sensible aux taux que les obligations longues.",
            ],
          },
          {
            id: "fonds_euros", pct: 20,
            pourquoi: [
              "La part neutre tolérée par la thèse, en complément de l'or.",
              "Reste dans le plafond des 30% d'actifs non strictement européens.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 10,
            pourquoi: [
              "La touche de protection neutre, jusqu'au plafond des 30% autorisés.",
              "Un actif « sans nationalité », toléré par exception dans cette thèse 100% Europe.",
            ],
          },
        ],
      },
      equilibre: {
        assets: [
          {
            idOptions: EUROSTOXX50_OPTIONS, pct: 20,
            pourquoi: [
              "Le socle actions de la zone euro, cohérent avec la thèse à tous les niveaux de risque.",
              "{pct}% pour ancrer le portefeuille dans l'économie de la zone euro.",
            ],
          },
          {
            id: "msci_europe", pct: 15,
            pourquoi: [
              "Élargit la thèse au-delà de la seule zone euro : Royaume-Uni et Suisse inclus, toujours 100% Europe.",
              "{pct}% pour diversifier géographiquement sans jamais sortir du continent.",
            ],
          },
          {
            id: "tech_europe", pct: 15,
            pourquoi: [
              "La technologie européenne : un pari plus concentré, mais qui reste 100% dans la thèse.",
              "ASML, SAP, Dassault Systèmes... les rares géants tech du continent.",
            ],
          },
          {
            id: "smallcap_europe", pct: 20,
            pourquoi: [
              "Des petites capitalisations européennes, plus proches de l'économie réelle du continent.",
              "Complète les lignes précédentes avec un profil de croissance différent, toujours européen.",
            ],
          },
          {
            id: "fonds_euros", pct: 30,
            pourquoi: [
              "Le stabilisateur de cette version équilibrée — jusqu'au plafond des 30% tolérés hors pari actions pur.",
              "{pct}% pour amortir la volatilité des lignes actions, sans sortir de la thèse française.",
            ],
          },
        ],
      },
      dynamique: {
        assets: [
          {
            idOptions: EUROSTOXX50_OPTIONS, pct: 20,
            pourquoi: [
              "Le socle actions de la zone euro, même dans cette version plus offensive de la thèse.",
              "{pct}% pour garder un ancrage large avant les paris plus concentrés du reste du portefeuille.",
            ],
          },
          {
            id: "tech_europe", pct: 30,
            pourquoi: [
              "Le pari le plus concentré de ce portefeuille : la tech européenne, plus volatile que l'indice large.",
              "{pct}% : la ligne la plus lourde de cette version dynamique.",
            ],
          },
          {
            id: "smallcap_europe", pct: 20,
            pourquoi: [
              "Des petites capitalisations européennes, pour une deuxième source de croissance régionale.",
              "Vient muscler la partie croissance du portefeuille, toujours 100% dans la thèse.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 30,
            pourquoi: [
              "Le filet de sécurité de cette version dynamique — un actif neutre, jusqu'au plafond des 30% tolérés.",
              "Sans cette ligne, les trois autres actifs monteraient et descendraient quasiment ensemble.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "anti_inflation",
    label: "L'Anti-Inflation",
    accroches: [
      "Ce portefeuille n'existe pas pour battre le marché. Il existe pour que ton argent garde sa valeur.",
      "Ici, aucune ligne n'est émise par une banque centrale.",
      "La thèse est simple : protéger le pouvoir d'achat du capital, pas le faire exploser.",
      "Pas de banque centrale, pas de dévaluation possible : voilà la logique.",
      "Protéger, pas parier : la thèse tient en une phrase.",
    ],
    sousTitres: [
      "Voici comment cette logique se traduit en pourcentages 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois posé noir sur blanc 👇",
      "Le détail, sans détour 👇",
      "Ligne par ligne, la logique de protection 👇",
    ],
    ctas: [
      "Tu protèges ton patrimoine de l'inflation comment, toi ? 👇",
      "Or, matières premières, obligations indexées... tu ferais confiance à quoi en premier ? 👇",
      "Ce genre de portefeuille, tu le vois comme une assurance ou une vraie stratégie de fond ? 👇",
      "Actifs réels contre monnaie papier : t'es plutôt convaincu ou sceptique ? 👇",
      "Tu gardes quelle part de ton patrimoine en actifs réels ? 👇",
    ],
    warnings: [
      "Ce portefeuille sous-performe en marché actions haussier. Il est fait pour protéger, pas pour faire croître rapidement le capital.",
      "Aucune de ces lignes ne verse de dividende ni d'intérêt classique. La logique ici est la préservation de la valeur, pas le revenu.",
    ],
    contextFallback: [
      "Ce portefeuille n'a connu aucune année réellement négative sur la période observée.",
      "La logique de protection tient : même les pires années restent contenues.",
      "Aucun des scénarios observés n'a mis à mal la thèse de préservation du capital.",
    ],
    // Ni Bitcoin (corrélé aux actifs risqués en période de stress, -62% en 2022, l'année d'inflation
    // la plus forte de la période — l'inverse d'une protection), ni REIT/foncière (la hausse des
    // taux qui accompagne l'inflation fait mécaniquement baisser leur valorisation), ni pétrole
    // seul (trop extrême, passé sous zéro en avril 2020), ni obligations indexées globales (seule
    // la version € reste cohérente avec la thèse). Seuls des actifs réels ou indexés inflation et
    // la poche de liquidité (fonds euros) sont utilisés ici.
    riskCombos: {
      prudent: {
        assets: [
          {
            id: "fonds_euros", pct: 30,
            pourquoi: [
              "Une poche de liquidité, pour ne pas être investi à 100% sur des actifs qui bougent fort.",
              "{pct}% de stabilité pure, cohérent avec un plancher de perte très serré.",
            ],
          },
          {
            id: "oblig_inflation", pct: 30,
            pourquoi: [
              "Le seul type d'obligation cohérent avec la thèse : le capital est indexé sur l'inflation, en euros.",
              "{pct}% pour rester dans un registre obligataire tout en respectant la logique anti-inflation.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 25,
            pourquoi: [
              "Le pilier de la thèse : aucune banque centrale ne peut en imprimer davantage.",
              "Une protection qui ne dépend d'aucune politique monétaire.",
            ],
          },
          {
            idOptions: COMMODITY_OPTIONS, pct: 15,
            pourquoi: [
              "Quand l'inflation grimpe, les prix des matières premières grimpent souvent avec elle — c'est mécanique.",
              "Complète l'or avec une exposition plus large : énergie, métaux, agriculture.",
            ],
          },
        ],
      },
      defensif: {
        assets: [
          {
            idOptions: GOLD_OPTIONS, pct: 35,
            pourquoi: [
              "Le pilier de la thèse : aucune banque centrale ne peut en imprimer davantage.",
              "{pct}%, la ligne la plus lourde du portefeuille — c'est elle qui porte la logique anti-inflation.",
            ],
          },
          {
            idOptions: COMMODITY_OPTIONS, pct: 25,
            pourquoi: [
              "Quand l'inflation grimpe, les prix des matières premières grimpent souvent avec elle — c'est mécanique.",
              "Complète l'or avec une exposition plus large : énergie, métaux, agriculture.",
            ],
          },
          {
            id: "oblig_inflation", pct: 25,
            pourquoi: [
              "Le seul type d'obligation cohérent avec la thèse : le capital est indexé sur l'inflation, en euros.",
              "Complète l'or et les matières premières avec une brique obligataire qui ne trahit pas la logique du portefeuille.",
            ],
          },
          {
            id: "fonds_euros", pct: 15,
            pourquoi: [
              "Une petite poche de liquidité, pour ne pas être investi à 100% sur des actifs qui bougent fort.",
              "{pct}% de stabilité pure, en complément des trois lignes plus offensives de la thèse.",
            ],
          },
        ],
      },
      equilibre: {
        assets: [
          {
            idOptions: GOLD_OPTIONS, pct: 30,
            pourquoi: [
              "{pct}% : le cœur de la thèse. Tout le reste du portefeuille vient en complément de cette ligne.",
              "La ligne qui donne son sens à toute la thèse — tout le reste vient en soutien.",
            ],
          },
          {
            id: "argent", pct: 15,
            pourquoi: [
              "Un deuxième métal précieux, plus volatil que l'or car aussi lié à la demande industrielle — un complément, pas un remplaçant.",
              "{pct}% pour diversifier la protection au-delà du seul or, sans en faire le pilier de la thèse.",
            ],
          },
          {
            idOptions: COMMODITY_OPTIONS, pct: 25,
            pourquoi: [
              "Un panier large de matières premières — énergie, métaux, agriculture — pour ne pas dépendre d'un seul actif.",
              "La jambe la plus diversifiée de la protection : des actifs physiques variés, pas du papier.",
            ],
          },
          {
            id: "oblig_inflation", pct: 20,
            pourquoi: [
              "La touche obligataire de la thèse — mais indexée, jamais une obligation classique à taux fixe.",
              "{pct}% pour ne pas laisser le portefeuille à 100% sur des actifs physiques sans aucun revenu.",
            ],
          },
          {
            id: "fonds_euros", pct: 10,
            pourquoi: [
              "Une dernière touche de liquidité, pour garder un peu de souplesse.",
              "{pct}% seulement : la thèse reste concentrée sur les actifs réels.",
            ],
          },
        ],
      },
      dynamique: {
        assets: [
          {
            idOptions: GOLD_OPTIONS, pct: 50,
            pourquoi: [
              "{pct}% : la thèse poussée à son maximum, sans jamais sortir de la logique de protection.",
              "La ligne qui porte l'essentiel de la conviction de ce portefeuille.",
            ],
          },
          {
            idOptions: COMMODITY_OPTIONS, pct: 35,
            pourquoi: [
              "Un panier large de matières premières, pour renforcer la protection sans concentrer sur un seul actif.",
              "La deuxième jambe de la thèse, à son poids maximal dans cette version dynamique.",
            ],
          },
          {
            id: "oblig_inflation", pct: 15,
            pourquoi: [
              "La seule touche obligataire tolérée par la thèse, toujours indexée sur l'inflation.",
              "{pct}% pour garder un peu de rendement sans sortir de la logique de protection.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "bouclier",
    label: "Le Bouclier",
    accroches: [
      "On accepte un peu de mouvement, jamais la panique.",
      "Moins spectaculaire qu'un portefeuille 100% actions, beaucoup plus tranquille.",
      "Résister aux crises avant tout — la performance vient après.",
      "Le compromis pour dormir tranquille sans renoncer à tout.",
      "Amorti, pas figé : ce portefeuille bouge, juste beaucoup moins que le marché.",
    ],
    sousTitres: [
      "Voici ce que ça donne une fois assemblé 👇",
      "Le détail de la répartition 👇",
      "Actif par actif, la logique derrière ce choix 👇",
      "Actif par actif, sans surprise 👇",
      "Le détail de ce compromis 👇",
    ],
    ctas: [
      "Tu mettrais quoi dans un portefeuille pensé pour résister aux crises ? 👇",
      "Santé, or, obligations... tu ajouterais quelle autre brique de protection ? 👇",
      "Ce niveau de protection, ça te correspond ? 👇",
      "Tu sacrifierais de la performance pour dormir tranquille en cas de crise ? 👇",
      "La résistance aux crises avant tout : ta priorité aussi ? 👇",
    ],
    warnings: [
      "Ce profil limite fortement les baisses, mais plafonne aussi la performance en période haussière. Ce n'est pas un hasard.",
      "En échange de la tranquillité, ce portefeuille manquera une bonne partie des meilleures années boursières. C'est le compromis assumé.",
    ],
    contextFallback: [
      "La logique tient : aucune des lignes n'a chuté fortement la même année que les autres.",
      "La diversification a fait son travail : pas de mauvaise année généralisée sur l'ensemble des lignes.",
      "Le compromis tient sa promesse : les baisses restent contenues, jamais simultanées sur toutes les lignes.",
    ],
    riskCombos: {
      prudent: {
        assets: [
          {
            id: "fonds_euros", pct: 55,
            pourquoi: [
              "Le socle défensif par excellence, pour ne jamais mettre le capital en danger.",
              "{pct}% pour garder une vraie marge sous un plancher de perte très serré.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 25,
            pourquoi: [
              "Un peu plus de rendement que le fonds euros, sans sortir du registre défensif.",
              "Le complément logique du fonds euros : plus de coupon, presque autant de sécurité.",
            ],
          },
          {
            id: "sect_sante", pct: 10,
            pourquoi: [
              "La seule ligne réellement « actions » de cette version prudente : l'un des secteurs les plus résistants en cas de crise.",
              "Une toute petite dose d'actions, choisie pour sa résistance historique.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 10,
            pourquoi: [
              "Le filet de sécurité final, celui qui ne dépend ni des taux d'intérêt ni de la santé des entreprises.",
              "Complète la logique défensive avec une protection d'un tout autre type.",
            ],
          },
        ],
      },
      defensif: {
        assets: [
          {
            id: "fonds_euros", pct: 25,
            pourquoi: [
              "La base qui amortit tout le reste : même si les autres lignes chutent en même temps, celle-ci ne bouge pas.",
              "{pct}%, suffisant pour que le portefeuille ne parte jamais franchement dans le rouge.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 20,
            pourquoi: [
              "Un peu de rendement en plus du fonds euros, sans sortir du registre défensif.",
              "Le complément logique du fonds euros : plus de coupon, presque autant de sécurité.",
            ],
          },
          {
            id: "oblig_etat_eur", pct: 15,
            pourquoi: [
              "De la dette d'État de la zone euro, un stabilisateur plus classique que le fonds euros ou les obligations d'entreprise.",
              "{pct}% pour diversifier la poche obligataire sans sortir du registre défensif.",
            ],
          },
          {
            id: "sect_sante", pct: 25,
            pourquoi: [
              "La seule ligne réellement « actions » du portefeuille — et pas n'importe laquelle : la santé est l'un des secteurs les plus résistants en cas de crise.",
              "Si le portefeuille doit avoir une jambe actions, autant que ce soit la plus solide historiquement.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Le filet de sécurité final, celui qui ne dépend ni des taux d'intérêt ni de la santé des entreprises.",
              "Complète la logique défensive avec une protection d'un tout autre type que les obligations.",
            ],
          },
        ],
      },
      equilibre: {
        assets: [
          {
            id: "fonds_euros", pct: 45,
            pourquoi: [
              "La moitié du portefeuille reste sur la valeur la plus sûre — le reste peut respirer un peu.",
              "Le socle qui permet aux trois autres lignes d'exister sans mettre en danger l'ensemble.",
            ],
          },
          {
            idOptions: IMMOBILIER_OPTIONS, pct: 15,
            pourquoi: [
              "Une petite dose d'immobilier coté pour aller chercher un peu plus de rendement — en quantité limitée, volontairement.",
              "{pct}% seulement : de quoi profiter du rendement immobilier sans subir sa pleine volatilité.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS, pct: 25,
            pourquoi: [
              "Des entreprises qui paient (et augmentent) leur dividende depuis des années — le profil actions le plus proche de l'esprit défensif.",
              "La brique « revenu régulier » du portefeuille, cohérente avec la logique de protection.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "La protection qui ne dépend d'aucune des trois autres lignes — utile si les taux ou l'immobilier tournent mal en même temps.",
              "Vient couvrir un scénario qu'aucun des trois autres actifs ne couvre seul.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "crypto_curieux",
    label: "Le Crypto-Curieux",
    accroches: [
      "Une vraie place laissée aux actifs numériques, pour ceux qui y croient.",
      "Un pied dans la finance traditionnelle, un pied dans la crypto.",
      "La dose de Bitcoin varie, la logique reste la même : une conviction assumée, jamais all-in.",
      "Pour ceux qui veulent goûter à la volatilité crypto, sans y aller à l'aveugle.",
      "Le reste du portefeuille existe pour une seule raison : encaisser les à-coups de la crypto.",
    ],
    sousTitres: [
      "Voici comment cette conviction se traduit en pourcentages 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le détail, sans filtre 👇",
      "Ligne par ligne, la logique derrière ce dosage 👇",
    ],
    ctas: [
      "Tu oserais mettre {bitcoin_pct}% de ton portefeuille en Bitcoin ? 👇",
      "Ce niveau d'exposition crypto, ça te tente ou ça t'inquiète ? 👇",
      "Bitcoin, Ethereum, ou les deux : ton choix ? 👇",
      "Tu serais capable de tenir cette poche crypto dans une année à -60% ? 👇",
      "La crypto dans un portefeuille « sérieux » : logique ou hérésie ? 👇",
    ],
    warnings: [
      "La poche crypto peut perdre plus de 60% en un an, comme en 2022. Le reste du portefeuille est calibré pour absorber le choc, pas pour l'éviter.",
      "Ce niveau d'exposition crypto n'a de sens qu'avec un horizon long et une tolérance réelle à la volatilité.",
    ],
    contextFallback: [
      "La poche crypto explique l'essentiel de cette variation — le reste du portefeuille limite la casse, sans jamais l'annuler.",
      "Sans la ligne crypto, cette année aurait été bien plus calme — c'est le prix de la conviction assumée.",
      "Le reste du portefeuille a amorti une partie du choc crypto, sans jamais l'effacer complètement.",
    ],
    // Pas de version Prudent : même une dose minimale de Bitcoin (cf. sa volatilité, -64% en
    // 2022) est incompatible avec un plancher de perte à -5%.
    riskCombos: {
      defensif: {
        assets: [
          {
            id: "fonds_euros", pct: 58,
            pourquoi: [
              "Le socle qui absorbe l'essentiel du choc si la poche Bitcoin traverse une mauvaise année.",
              "{pct}% pour que même une chute de 60% sur la crypto reste contenue à ce niveau de risque.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 22,
            pourquoi: [
              "La partie « classique » du portefeuille, diversifiée mondialement.",
              "Vient équilibrer la conviction crypto avec une base plus large.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 10,
            pourquoi: [
              "{pct}% : le plafond de cette version défensive — assez pour exprimer la conviction, pas assez pour dépasser le plancher de perte.",
              "La dose la plus mesurée de toute la bibliothèque Crypto-Curieux, calibrée pour ce niveau de risque.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 10,
            pourquoi: [
              "Une deuxième ligne de protection, décorrélée à la fois des actions et de la crypto.",
              "Vient renforcer le filet de sécurité déjà assuré par le fonds euros.",
            ],
          },
        ],
      },
      equilibre: {
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 35,
            pourquoi: [
              "Le socle diversifié du portefeuille, avant d'ajouter la conviction crypto.",
              "{pct}% pour garder un vrai ancrage large malgré la poche Bitcoin.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 15,
            pourquoi: [
              "{pct}% : une conviction plus affirmée que la version défensive, toujours dosée avec prudence.",
              "La ligne la plus volatile du portefeuille, à ce niveau encore mesurée.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 25,
            pourquoi: [
              "Le stabilisateur obligataire, pour amortir une partie du choc si la crypto traverse une mauvaise année.",
              "Vient équilibrer la volatilité ajoutée par la ligne Bitcoin.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 25,
            pourquoi: [
              "Une deuxième ligne de protection, décorrélée de la crypto comme des obligations.",
              "Complète le filet de sécurité du portefeuille.",
            ],
          },
        ],
      },
      dynamique: {
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 35,
            pourquoi: [
              "Le socle diversifié, plus resserré que dans les versions moins risquées pour laisser de la place à la crypto.",
              "{pct}% pour garder un minimum de diversification malgré la conviction crypto affirmée.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 25,
            pourquoi: [
              "{pct}% : une conviction clairement affirmée, sur l'actif le plus volatil de la bibliothèque.",
              "Le quart du portefeuille sur un actif capable de perdre les deux tiers de sa valeur en un an.",
            ],
          },
          {
            idOptions: NASDAQ100_OPTIONS, pct: 16,
            pourquoi: [
              "Un deuxième moteur de croissance, plus classique mais tout aussi volatil que la crypto.",
              "Vient renforcer la partie « forte conviction » du portefeuille.",
            ],
          },
          {
            // Marge très serrée sur ce combo (Bitcoin 25% + Nasdaq déjà proches du plafond de
            // perte à eux seuls) : poids minime vérifié empiriquement pour rester sous -30% même
            // sur le pire exercice (2022) du combo complet — cf. script de stress-test.
            idOptions: LEVERAGE_OPTIONS, pct: 4,
            pourquoi: [
              "{pct}% de levier actions, dosé au minimum pour rester compatible avec le plafond de perte de ce niveau de risque.",
              "Une touche de levier, mais à peine — le reste du portefeuille (crypto compris) laisse très peu de marge avant le plafond de perte.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 20,
            pourquoi: [
              "Le seul vrai filet de sécurité, face à trois lignes qui poussent toutes vers le risque.",
              "Sans cette ligne, l'essentiel du portefeuille dépendrait du même scénario haussier.",
            ],
          },
        ],
      },
      offensif: {
        assets: [
          {
            idOptions: BITCOIN_OPTIONS, pct: 35,
            pourquoi: [
              "{pct}% : la conviction poussée à son maximum, sur l'actif le plus volatil de toute la bibliothèque.",
              "Plus d'un tiers du portefeuille sur un seul actif capable de tripler... ou de perdre les deux tiers de sa valeur.",
            ],
          },
          {
            id: "ethereum", pct: 25,
            pourquoi: [
              "Une deuxième cryptomonnaie, pour ne pas concentrer toute la conviction sur un seul actif numérique.",
              "Complète le Bitcoin avec un profil de risque tout aussi élevé, mais décorrélé.",
            ],
          },
          {
            idOptions: NASDAQ100_OPTIONS, pct: 15,
            pourquoi: [
              "La partie « actions » de ce portefeuille, elle aussi concentrée sur l'innovation la plus agressive.",
              "Aucune ligne de ce portefeuille n'a vocation à protéger les autres. C'est voulu.",
            ],
          },
          {
            idOptions: LEVERAGE_OPTIONS, pct: 10,
            pourquoi: [
              "{pct}% de levier actions, en plus de la conviction crypto déjà maximale : ce palier assume l'absence totale de filet.",
              "Une deuxième forme de levier à côté du Bitcoin et de l'Ethereum — {pct}% sur un ETF 2x quotidien, sans plancher de perte pour l'amortir.",
            ],
          },
          {
            idOptions: EM_OPTIONS, pct: 15,
            pourquoi: [
              "Une dernière source de croissance, sur des marchés eux aussi très volatils.",
              "Complète un portefeuille qui n'a, par construction, aucun filet de sécurité obligataire.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "thematique",
    label: "Le Thématique",
    accroches: [
      "Pas de diversification ici : un seul pari, assumé jusqu'au bout.",
      "Ce portefeuille mise sur un secteur, pas sur le marché dans son ensemble.",
      "La conviction sectorielle prime sur la prudence de la diversification.",
      "Un seul thème, une seule conviction : le reste du portefeuille n'existe que pour l'accompagner.",
      "Concentré, volontairement — c'est le prix à payer pour un pari sectoriel clair.",
    ],
    sousTitres: [
      "Voici comment ce pari se traduit en pourcentages 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le détail, sans filtre 👇",
      "Ligne par ligne, la logique du pari 👇",
    ],
    ctas: [
      "Tu miserais sur quel secteur en premier : tech, santé ou énergie ? 👇",
      "Un seul secteur : trop concentré, ou logique quand on a une vraie conviction ? 👇",
      "Ce pari sectoriel, tu le prendrais aussi ou tu préfères rester diversifié ? 👇",
      "Tu tiendrais ce portefeuille si le secteur traverse une mauvaise année ? 👇",
      "La concentration sectorielle : un risque que tu es prêt à prendre ? 👇",
    ],
    warnings: [
      "Un pari sectoriel concentré peut fortement sous-performer (ou sur-performer) le marché dans son ensemble. C'est le prix de la conviction.",
      "Aucune diversification sectorielle ici par construction. Si le secteur traverse une crise, ce portefeuille la traverse aussi.",
    ],
    contextFallback: [
      "Cette variation reflète surtout la santé du secteur choisi, pas celle du marché dans son ensemble.",
      "C'est le secteur pari qui pilote cette variation — le contrepoids diversifié n'a qu'un rôle d'amortisseur.",
      "La concentration sectorielle se voit directement ici : le reste du portefeuille ne fait qu'amortir.",
    ],
    // Pas de version Prudent : même le secteur le plus calme de la bibliothèque reste trop
    // concentré pour un plancher de perte à -5%.
    riskCombos: {
      defensif: {
        assets: [
          {
            idOptions: THEME_OPTIONS_CALM, pct: 35,
            pourquoi: [
              "Le pari sectoriel central de ce portefeuille — concentré, mais dosé pour rester dans ce niveau de risque.",
              "{pct}% sur un seul secteur : déjà une vraie conviction, sans dépasser le plancher de perte.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 30,
            pourquoi: [
              "Le contrepoids diversifié, pour ne pas dépendre entièrement du secteur choisi.",
              "Vient équilibrer la conviction sectorielle avec une base plus large.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 20,
            pourquoi: [
              "Le stabilisateur obligataire, pour amortir une mauvaise année du secteur choisi.",
              "Nécessaire à ce niveau de risque, pour compenser la concentration du pari sectoriel.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Une dernière ligne de protection, décorrélée du secteur comme des marchés actions larges.",
              "Complète le filet de sécurité nécessaire à cette version défensive du pari sectoriel.",
            ],
          },
        ],
      },
      equilibre: {
        assets: [
          {
            idOptions: THEME_OPTIONS_FULL, pct: 36,
            pourquoi: [
              "Le pari sectoriel central : {pct}% sur un seul secteur, la définition même d'une conviction assumée.",
              "La ligne la plus lourde du portefeuille — tout le reste existe pour l'accompagner.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 26,
            pourquoi: [
              "Le contrepoids diversifié, pour ne pas dépendre entièrement du secteur choisi.",
              "Vient équilibrer la conviction sectorielle avec une base plus large.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 13,
            pourquoi: [
              "Le stabilisateur obligataire, pour amortir une mauvaise année du secteur choisi.",
              "Nécessaire pour compenser la concentration du pari sectoriel à ce niveau de risque.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 25,
            pourquoi: [
              "Une dernière ligne de protection, décorrélée du secteur comme des marchés actions larges.",
              "Complète le filet de sécurité de ce portefeuille par ailleurs très concentré.",
            ],
          },
        ],
      },
      dynamique: {
        assets: [
          {
            idOptions: THEME_OPTIONS_AGGRESSIVE, pct: 55,
            pourquoi: [
              "{pct}% sur un seul secteur : la conviction poussée nettement plus loin que dans les versions moins risquées.",
              "Plus de la moitié du portefeuille dépend désormais du même pari sectoriel.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 25,
            pourquoi: [
              "Le contrepoids diversifié, réduit par rapport aux versions moins risquées pour laisser de la place au pari sectoriel.",
              "La seule vraie diversification qui reste dans ce portefeuille très concentré.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 20,
            pourquoi: [
              "Le seul filet de sécurité restant, face à un portefeuille dominé par un seul secteur.",
              "Sans cette ligne, l'essentiel du portefeuille dépendrait du même scénario sectoriel.",
            ],
          },
        ],
      },
      offensif: {
        assets: [
          {
            idOptions: THEME_OPTIONS_AGGRESSIVE, pct: 70,
            pourquoi: [
              "{pct}% : la conviction sectorielle à son maximum, sans aucun filet de sécurité pour l'amortir.",
              "L'essentiel du portefeuille repose sur un seul secteur — la définition même de ce profil, poussée à l'extrême.",
            ],
          },
          {
            idOptions: NASDAQ100_OPTIONS, pct: 10,
            pourquoi: [
              "Un deuxième pari technologique, pour renforcer la thèse sans la diluer.",
              "Vient compléter le pari sectoriel avec une deuxième source de croissance agressive.",
            ],
          },
          {
            idOptions: LEVERAGE_OPTIONS, pct: 10,
            pourquoi: [
              "{pct}% en ETF à levier 2x quotidien, en plus du pari sectoriel : la version la plus agressive de la conviction tech.",
              "Complète le pari sectoriel avec {pct}% de levier — ce palier n'a aucun plancher de perte pour freiner l'ambition.",
            ],
          },
          {
            idOptions: EM_OPTIONS, pct: 10,
            pourquoi: [
              "La seule vraie diversification qui reste dans ce portefeuille, minime et volontairement limitée.",
              "Complète un portefeuille qui n'a, par construction, aucun filet de sécurité.",
            ],
          },
        ],
      },
    },
  },
];

// Compatibilité (profil, niveau de risque) — dérivée directement de `riskCombos`, exposée pour
// l'UI (griser les chips incompatibles) sans dupliquer l'information.
export function isCompatible(profileId, riskId) {
  const profile = PROFILES.find((p) => p.id === profileId);
  return !!profile && !!profile.riskCombos[riskId];
}
export function compatibleRisksFor(profileId) {
  const profile = PROFILES.find((p) => p.id === profileId);
  return profile ? RISK_ORDER.filter((r) => profile.riskCombos[r]) : RISK_ORDER.slice();
}
export function compatibleProfilesFor(riskId) {
  return PROFILES.filter((p) => p.riskCombos[riskId]).map((p) => p.id);
}
