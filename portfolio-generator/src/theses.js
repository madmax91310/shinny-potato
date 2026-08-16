// Bibliothèque de thèses de portefeuille — remplace l'ancien moteur "catégories aléatoires".
// Chaque thèse est une combinaison curatée d'actifs qui partagent une même logique narrative
// (cf. règle #3 du brief original : jamais de mélange sans thèse commune). Les pourcentages des
// combos ont été validés pour respecter les bornes de "pire année" du palier de risque associé
// (voir TIER_WORST_BOUNDS ci-dessous) — ne pas changer un combo sans revalider ces bornes, y
// compris pour CHAQUE option d'un slot idOptions (voir plus bas).

export const TIER_ORDER = ["prudent", "defensif", "equilibre", "dynamique", "offensif"];

export const TIER_LABELS = {
  prudent: "Prudent",
  defensif: "Défensif",
  equilibre: "Équilibré",
  dynamique: "Dynamique",
  offensif: "Offensif",
};

// bound = pire année cible pour le palier. min/max en points de %, null = pas de limite.
export const TIER_WORST_BOUNDS = {
  prudent: { min: -8, max: null, text: "pire année ≥ -8 %" },
  defensif: { min: -12, max: null, text: "pire année ≥ -12 %" },
  equilibre: { min: -20, max: -10, text: "pire année entre -20 % et -10 %" },
  dynamique: { min: -25, max: -15, text: "pire année entre -25 % et -15 %" },
  offensif: { min: null, max: -15, text: "pire année ≤ -15 %, sans plancher" },
};

// Familles d'actifs interchangeables : un slot qui porte `idOptions` (plutôt qu'un `id` unique)
// laisse le moteur choisir l'émetteur le moins utilisé dans la session, pour ne jamais
// surreprésenter un seul ETF (règle : aucun support > 40% des tweets générés). Les options d'une
// même famille sont soit strictement jumelles (même sous-jacent, même performance : or physique,
// bitcoin physique, obligations corporate € IG), soit des indices proches mais pas identiques
// (monde / émergents / dividendes) — dans ce dernier cas chaque option a été revalidée sur les
// bornes de pire année du combo qui l'utilise.
export const GOLD_OPTIONS = ["or", "or_wisdomtree", "or_ishares", "or_amundi"];
export const BITCOIN_OPTIONS = ["bitcoin", "bitcoin_wisdomtree", "bitcoin_etcgroup", "bitcoin_21shares"];
export const CORPBOND_OPTIONS = ["oblig_corp_ig", "oblig_corp_amundi", "oblig_corp_vanguard", "oblig_corp_spdr"];
export const WORLD_OPTIONS = ["msci_world", "msci_world_ishares", "ftse_allworld_vanguard", "msci_acwi"];
export const EM_OPTIONS = ["msci_em", "msci_em_amundi", "ftse_em_vanguard", "msci_em_spdr"];
export const DIVIDEND_OPTIONS = ["strat_dividendes", "high_dividend", "quality_dividend"];

export const THESES = [
  {
    id: "prudent",
    tierKey: "prudent",
    label: "Le Prudent",
    accroches: [
      "La priorité n'est pas de gagner plus. C'est de ne jamais perdre gros.",
      "Zéro sensation forte, zéro mauvaise surprise : voici à quoi ça ressemble.",
      "Ici, le capital passe avant tout le reste — même avant la performance.",
      "Ici, la sécurité n'est pas une option. C'est le point de départ.",
      "Le capital d'abord. La performance, si possible.",
    ],
    sousTitres: [
      "Voici comment ce choix se traduit concrètement 👇",
      "La composition, actif par actif 👇",
      "Ce que ça donne une fois posé sur le papier 👇",
      "Pas de grand frisson, mais pas de mauvaise nuit non plus 👇",
      "Le détail, sans surprise 👇",
    ],
    ctas: [
      "C'est ce niveau de sécurité que tu recherches, ou tu trouves ça trop timide ? 👇",
      "Tu mettrais plus ou moins d'or dans ce genre de portefeuille ? 👇",
      "Le capital garanti avant tout, ou tu acceptes un peu de risque pour plus de rendement ? 👇",
      "Trop sage pour toi, ou exactement ce qu'il te faut ? 👇",
      "Toi aussi tu dors mieux en sacrifiant un peu de performance ? 👇",
    ],
    warnings: [
      "Ce profil sacrifie la performance pour la stabilité. Sur le long terme, il sous-performera un portefeuille 100% actions.",
      "L'objectif ici n'est pas de battre le marché, c'est de ne jamais avoir à regarder son compte avec angoisse.",
    ],
    contextFallback: "Même dans sa pire année, ce portefeuille n'a jamais menacé le capital de façon significative.",
    combos: [
      {
        assets: [
          {
            id: "fonds_euros", pct: 55,
            pourquoi: [
              "Le socle. Il porte plus de la moitié du portefeuille pour garantir qu'aucune mauvaise année ne fasse vraiment mal.",
              "Plus de la moitié du portefeuille dort ici — c'est le prix à payer pour ne jamais voir le capital reculer fortement.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 25,
            pourquoi: [
              "Un peu plus de rendement que le fonds euros, sans sortir de la logique « je ne veux pas de sueurs froides ».",
              "La couche intermédiaire : un peu de risque de crédit, en échange d'un coupon plus généreux.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 20,
            pourquoi: [
              "La seule ligne un peu « vivante » du portefeuille — une assurance contre les scénarios que les deux autres lignes ne couvrent pas.",
              "{pct}%, pas plus : assez pour protéger, pas assez pour faire trembler le reste du portefeuille.",
            ],
          },
        ],
      },
      {
        assets: [
          {
            id: "fonds_euros", pct: 60,
            pourquoi: [
              "{pct}% du portefeuille sur le support le plus sûr du marché français : le choix assumé de ce profil.",
              "La base absolue. Rien ne bouge vite ici, et c'est exactement le but.",
            ],
          },
          {
            id: "oblig_etat_eur", pct: 20,
            pourquoi: [
              "De la dette d'États jugés très sûrs, pour diversifier sans sortir de la logique prudente.",
              "Complète le fonds euros avec un peu plus de liquidité, sans changer la philosophie du portefeuille.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 20,
            pourquoi: [
              "La seule vraie protection contre un scénario que les obligations et le fonds euros ne couvrent pas : la perte de confiance dans la monnaie.",
              "{pct}% pour ne pas tout miser sur le système financier classique.",
            ],
          },
        ],
      },
      {
        // Variante "obligataire" : durée courte + panier mondial en renfort du fonds euros.
        assets: [
          {
            id: "fonds_euros", pct: 35,
            pourquoi: [
              "Toujours le socle, même dans cette variante plus « obligataire » du profil prudent.",
              "{pct}% pour ancrer le portefeuille sur la valeur la plus sûre avant d'ajouter de la diversification.",
            ],
          },
          {
            id: "oblig_short", pct: 35,
            pourquoi: [
              "De la dette d'État américaine à très courte échéance : quasiment aucune sensibilité aux taux.",
              "Le complément le moins volatil qui existe dans toute la bibliothèque — parfait pour ce profil.",
            ],
          },
          {
            id: "oblig_global_agg", pct: 15,
            pourquoi: [
              "Diversifie la poche obligataire à l'échelle mondiale, sans sortir du registre prudent.",
              "Une troisième source de rendement obligataire, décorrélée de la seule zone euro.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Une petite protection supplémentaire, pour ne pas dépendre uniquement d'obligations.",
              "{pct}% : juste de quoi diversifier au-delà du seul monde obligataire.",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "defensif",
    tierKey: "defensif",
    label: "Le Défensif",
    accroches: [
      "On accepte un peu de mouvement, jamais la panique.",
      "Moins spectaculaire qu'un portefeuille 100% actions, beaucoup plus tranquille.",
      "La stabilité d'abord, la croissance en option.",
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
      "Tu mettrais quoi dans un portefeuille défensif ? 👇",
      "Santé, or, obligations... tu ajouterais quelle autre brique défensive ? 👇",
      "Ce dosage stabilité/performance, ça te correspond ? 👇",
      "Tu sacrifierais de la performance pour ne jamais voir -10% ? 👇",
      "Ce dosage entre sécurité et rendement, il te semble juste ou trop timide ? 👇",
    ],
    warnings: [
      "Ce profil limite fortement les baisses, mais plafonne aussi la performance en période haussière. Ce n'est pas un hasard.",
      "En échange de la tranquillité, ce portefeuille manquera une bonne partie des meilleures années boursières. C'est le compromis assumé.",
    ],
    contextFallback: "La logique tient : aucune des lignes n'a chuté fortement la même année que les autres.",
    combos: [
      {
        assets: [
          {
            id: "fonds_euros", pct: 30,
            pourquoi: [
              "La base qui amortit tout le reste : même si les trois autres lignes chutent en même temps, celle-ci ne bouge pas.",
              "{pct}%, suffisant pour que le portefeuille ne parte jamais franchement dans le rouge.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 25,
            pourquoi: [
              "Un peu de rendement en plus du fonds euros, sans sortir du registre défensif.",
              "Le complément logique du fonds euros : plus de coupon, presque autant de sécurité.",
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
            idOptions: GOLD_OPTIONS, pct: 20,
            pourquoi: [
              "Le filet de sécurité final, celui qui ne dépend ni des taux d'intérêt ni de la santé des entreprises.",
              "Complète la logique défensive avec une protection d'un tout autre type que les obligations.",
            ],
          },
        ],
      },
      {
        assets: [
          {
            id: "fonds_euros", pct: 45,
            pourquoi: [
              "La moitié du portefeuille reste sur la valeur la plus sûre — le reste peut respirer un peu.",
              "Le socle qui permet aux trois autres lignes d'exister sans mettre en danger l'ensemble.",
            ],
          },
          {
            id: "foncieres_etf", pct: 15,
            pourquoi: [
              "Une petite dose d'immobilier coté pour aller chercher un peu plus de rendement — en quantité limitée, volontairement.",
              "{pct}% seulement : de quoi profiter du rendement immobilier sans subir sa pleine volatilité.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS, pct: 25,
            pourquoi: [
              "Des entreprises qui paient (et augmentent) leur dividende depuis des années — le profil actions le plus proche de l'esprit défensif.",
              "La brique « revenu régulier » du portefeuille, cohérente avec la logique de stabilité.",
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
    ],
  },

  {
    id: "anti_inflation",
    tierKey: "defensif",
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
    contextFallback: "Ce portefeuille n'a connu aucune année réellement négative sur la période observée.",
    // Pas de REIT/foncière ici : la hausse des taux qui accompagne l'inflation fait mécaniquement
    // baisser leur valorisation (-20 à -25% en 2022, année d'inflation record). Pas de pétrole non
    // plus (trop extrême, passé sous zéro en avril 2020) : Invesco Bloomberg Commodity couvre déjà
    // l'énergie, en plus diversifié. Seuls des actifs réels ou indexés (or, matières premières,
    // obligations indexées inflation) et la poche de liquidité (fonds euros) restent cohérents.
    combos: [
      {
        assets: [
          {
            idOptions: GOLD_OPTIONS, pct: 35,
            pourquoi: [
              "Le pilier de la thèse : aucune banque centrale ne peut en imprimer davantage.",
              "{pct}%, la ligne la plus lourde du portefeuille — c'est elle qui porte la logique anti-inflation.",
            ],
          },
          {
            id: "mp_large", pct: 25,
            pourquoi: [
              "Quand l'inflation grimpe, les prix des matières premières grimpent souvent avec elle — c'est mécanique.",
              "Complète l'or avec une exposition plus large : énergie, métaux, agriculture.",
            ],
          },
          {
            id: "oblig_inflation", pct: 25,
            pourquoi: [
              "Le seul type d'obligation cohérent avec la thèse : le capital est indexé sur l'inflation, pas figé à taux fixe.",
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
      {
        assets: [
          {
            idOptions: GOLD_OPTIONS, pct: 45,
            pourquoi: [
              "{pct}% : le cœur de la thèse. Tout le reste du portefeuille vient en complément de cette ligne.",
              "La ligne qui donne son sens à toute la thèse — tout le reste vient en soutien.",
            ],
          },
          {
            id: "mp_large", pct: 35,
            pourquoi: [
              "Un panier large de matières premières — énergie, métaux, agriculture — pour ne pas dépendre d'un seul actif.",
              "La deuxième jambe de la protection : des actifs physiques diversifiés, pas du papier.",
            ],
          },
          {
            id: "oblig_inflation", pct: 20,
            pourquoi: [
              "La touche obligataire de la thèse — mais indexée, jamais une obligation classique à taux fixe.",
              "{pct}% pour ne pas laisser le portefeuille à 100% sur des actifs physiques sans aucun revenu.",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "rentier",
    tierKey: "equilibre",
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
      "SCPI, foncières, dividendes... tu ferais confiance à laquelle de ces sources de revenu ? 👇",
      "Vivre (en partie) de son portefeuille, tu y penses déjà ou c'est trop tôt pour toi ? 👇",
      "Tu vises quel revenu mensuel pour en vivre un jour ? 👇",
      "Immobilier physique, foncières cotées ou dividendes : ta source de revenu préférée ? 👇",
    ],
    warnings: [
      "Ce portefeuille génère des revenus — pas une performance maximale. C'est un choix assumé, pas une contrainte.",
      "La plupart de ces revenus sont fiscalisés chaque année, même sans rien vendre. À anticiper selon ton enveloppe.",
    ],
    // Toujours ajoutée après l'avertissement (cf. engine.js) : pour un profil qui vit de ses
    // revenus, une baisse de capital reste significative même si les distributions continuent.
    capitalNote: true,
    contextFallback: "Même dans sa pire année, les revenus distribués par ces lignes ont continué à tomber.",
    combos: [
      {
        assets: [
          {
            id: "scpi", pct: 15,
            pourquoi: [
              "Des loyers versés régulièrement, portefeuille mutualisé de bureaux et commerces — le revenu « à l'ancienne ».",
              "La brique la plus classique du rentier français : le revenu locatif, sans la gestion.",
            ],
          },
          {
            id: "foncieres_etf", pct: 45,
            pourquoi: [
              "La version cotée et liquide de l'immobilier de revenu : mêmes loyers, beaucoup plus de souplesse.",
              "{pct}% : la ligne la plus lourde, car c'est elle qui distribue le plus régulièrement.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS, pct: 25,
            pourquoi: [
              "Des entreprises qui existent pour verser (et augmenter) un dividende depuis des décennies.",
              "Complète les deux lignes immobilières avec une troisième source de revenu, décorrélée du secteur.",
            ],
          },
          {
            id: "oblig_hy", pct: 15,
            pourquoi: [
              "Un coupon nettement supérieur aux obligations classiques — le prix à payer pour plus de revenu.",
              "La touche de rendement obligataire qui vient compléter les trois sources de revenu déjà présentes.",
            ],
          },
        ],
      },
      {
        assets: [
          {
            id: "foncieres_etf", pct: 35,
            pourquoi: [
              "Le revenu immobilier sous sa forme la plus liquide : mêmes loyers, cotée en Bourse.",
              "{pct}% pour ancrer le portefeuille sur une source de revenu déjà éprouvée.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS, pct: 20,
            pourquoi: [
              "Une deuxième source de revenu, décorrélée de l'immobilier : les entreprises qui distribuent depuis des décennies.",
              "Vient équilibrer la part immobilière avec une brique actions génératrice de revenu.",
            ],
          },
          {
            id: "scpi", pct: 15,
            pourquoi: [
              "Une touche d'immobilier physique, pour ne pas tout miser sur le coté.",
              "{pct}% de pierre-papier classique, en complément de la foncière cotée.",
            ],
          },
          {
            id: "oblig_global_agg", pct: 30,
            pourquoi: [
              "Une quatrième source de revenu, obligataire cette fois et diversifiée à l'échelle mondiale.",
              "Vient stabiliser un portefeuille par ailleurs concentré sur l'immobilier et les actions à dividende.",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "equilibre",
    tierKey: "equilibre",
    label: "L'Équilibré",
    accroches: [
      "Ni le plus rassurant, ni le plus risqué : le compromis assumé.",
      "Un peu de tout, pour ne dépendre d'aucun scénario unique.",
      "La croissance reste la priorité, mais jamais sans filet.",
      "Le portefeuille du bon sens : rien d'extrême, tout est pesé.",
      "On vise la croissance, mais jamais les yeux fermés.",
    ],
    sousTitres: [
      "Voici comment ça se traduit concrètement 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le détail, sans filtre 👇",
      "Ce que ça donne, ligne par ligne 👇",
    ],
    ctas: [
      "L'équilibre parfait pour toi, ou tu préfères trancher plus franchement ? 👇",
      "Tu es plutôt team équilibre ou team choix tranchés ? 👇",
      "Ce dosage actions / stabilisateurs, tu le trouves juste ? 👇",
      "Tu changerais quelle ligne en premier dans ce portefeuille ? 👇",
      "Un peu de tout : rassurant, ou juste indécis ? 👇",
    ],
    warnings: [
      "Ce profil suppose de tenir la ligne plusieurs années sans paniquer au premier trimestre rouge.",
      "L'équilibre ne veut pas dire absence de risque : une baisse de 15 à 20% reste possible sur une mauvaise année.",
    ],
    contextFallback: "Le stabilisateur a joué son rôle : sans lui, la baisse aurait été nettement plus marquée.",
    combos: [
      {
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 40,
            pourquoi: [
              "Le moteur de croissance du portefeuille : plusieurs milliers d'entreprises mondiales en une ligne.",
              "{pct}% : la part qui doit faire le gros du travail sur le long terme.",
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
              "Un troisième type d'actif, décorrélé des deux premiers : ni une action, ni une dette.",
              "La ligne qui protège quand ni les actions ni les obligations ne fonctionnent.",
            ],
          },
          {
            id: "foncieres_etf", pct: 25,
            pourquoi: [
              "Une quatrième source de performance, avec sa propre logique — celle de l'immobilier coté.",
              "Complète la diversification sans dupliquer ce que font déjà les trois autres lignes.",
            ],
          },
        ],
      },
      {
        // Variante "styles & géographies" : sans immobilier, pour changer les 3 lignes principales.
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 35,
            pourquoi: [
              "Le socle mondial reste présent, même dans cette variante plus orientée « styles ».",
              "{pct}% pour garder un cœur de portefeuille diversifié avant d'ajouter des paris plus ciblés.",
            ],
          },
          {
            id: "strat_smallcap", pct: 20,
            pourquoi: [
              "Un pari sur les petites capitalisations, historiquement plus performantes sur longue période.",
              "Ajoute une source de croissance différente de celle des grandes entreprises déjà présentes.",
            ],
          },
          {
            id: "japan", pct: 20,
            pourquoi: [
              "Une diversification géographique décorrélée des cycles américains et européens.",
              "Le Japon complète le portefeuille sans dupliquer l'exposition déjà large du support mondial.",
            ],
          },
          {
            id: "oblig_global_agg", pct: 25,
            pourquoi: [
              "Le stabilisateur de cette variante : une poche obligataire mondiale plutôt que seulement européenne.",
              "Vient amortir les trois lignes actions plus ciblées de ce combo.",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "pro_europe",
    tierKey: "equilibre",
    label: "Le Pro-Européen",
    accroches: [
      "Un portefeuille qui mise sur l'Europe plutôt que sur les États-Unis — jusqu'au bout de la logique.",
      "Zéro action américaine ici. Le pari est assumé.",
      "Pour ceux qui pensent que l'Europe est sous-valorisée, pas sous-performante.",
      "L'Europe a le potentiel. Ce portefeuille prend le pari qu'elle finira par le montrer.",
      "Ici, chaque ligne parle une langue européenne.",
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
      "100% Europe, ça te semble courageux ou risqué ? 👇",
      "Tu miserais sur quel pays européen en premier ? 👇",
      "Zéro action américaine dans ton portefeuille : t'oserais ? 👇",
      "Le CAC 40 mérite plus de confiance qu'on ne le dit, non ? 👇",
    ],
    warnings: [
      "Ce portefeuille renonce entièrement à la croissance américaine des dernières années. C'est un pari, pas une certitude.",
      "L'Europe a historiquement moins performé que les États-Unis sur la dernière décennie. Ce portefeuille assume ce contre-pied.",
    ],
    contextFallback: "La baisse touche toute la zone euro à la fois — c'est le risque assumé d'un pari 100% régional.",
    combos: [
      {
        assets: [
          {
            id: "cac40", pct: 30,
            pourquoi: [
              "La France en direct : LVMH, TotalEnergies, L'Oréal... les fleurons hexagonaux.",
              "{pct}% pour ancrer le portefeuille dans l'économie française en particulier.",
            ],
          },
          {
            id: "eurostoxx50", pct: 30,
            pourquoi: [
              "Élargit le pari à toute la zone euro, sans sortir de la logique 100% européenne.",
              "La même thèse que le CAC 40, mais à l'échelle de la zone euro entière.",
            ],
          },
          {
            id: "msci_europe", pct: 20,
            pourquoi: [
              "Ajoute le Royaume-Uni et la Suisse : l'Europe au sens large, pas seulement la zone euro.",
              "Complète les deux premières lignes avec les marchés européens hors zone euro.",
            ],
          },
          {
            id: "oblig_etat_eur", pct: 20,
            pourquoi: [
              "Le seul stabilisateur du portefeuille — logiquement, lui aussi 100% européen.",
              "Même la poche de sécurité reste fidèle à la thèse : de la dette d'États européens.",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "dynamique",
    tierKey: "dynamique",
    label: "Le Dynamique",
    accroches: [
      "On accepte des baisses marquées pour viser une croissance nettement supérieure.",
      "Ce portefeuille pousse tout dans le même sens : la croissance.",
      "Un filet de sécurité minimal, pour ne pas tout miser non plus.",
      "Ce portefeuille suppose des nerfs solides et un horizon long.",
      "Haut potentiel, haute volatilité. Les deux vont ensemble.",
    ],
    sousTitres: [
      "Voici la composition qui porte cette logique 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le détail, sans filtre 👇",
      "Ce que ça donne, ligne par ligne 👇",
    ],
    ctas: [
      "Tu oserais mettre {bitcoin_pct}% en Bitcoin, ou tu trouves ça pas assez ? 👇",
      "Ce niveau de risque, ça te tente ou ça t'inquiète ? 👇",
      "Tu serais capable de tenir ce portefeuille dans une année à -20% ? 👇",
      "Nasdaq + émergents + Bitcoin : trop concentré ou logique assumée ? 👇",
      "Ce portefeuille suppose des nerfs solides et un horizon long : t'es partant ? 👇",
    ],
    warnings: [
      "Ce profil peut perdre 15 à 25% en cas de crise. Horizon minimum recommandé : 8 à 10 ans.",
      "La croissance visée ici suppose de traverser au moins une année franchement rouge sans vendre.",
    ],
    contextFallback: "Cette baisse reste dans la fourchette attendue pour ce niveau de risque — ni plus, ni moins.",
    combos: [
      {
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 40,
            pourquoi: [
              "Le socle actions du portefeuille — la partie la plus « raisonnable » de ce profil pourtant offensif.",
              "{pct}% : même dans un portefeuille dynamique, le cœur reste diversifié mondialement.",
            ],
          },
          {
            id: "nasdaq100", pct: 25,
            pourquoi: [
              "La partie qui vise vraiment la surperformance : concentrée sur l'innovation et la tech américaine.",
              "Le moteur de croissance le plus agressif du portefeuille, avant même le Bitcoin.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 10,
            pourquoi: [
              "{pct}%, pas plus : assez pour capter un potentiel de croissance rare, pas assez pour mettre le portefeuille en danger si ça tourne mal.",
              "La ligne la plus explosive du portefeuille, volontairement limitée à une poche satellite.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 25,
            pourquoi: [
              "Le seul vrai filet de sécurité du portefeuille, face à trois lignes qui poussent toutes dans le même sens.",
              "Sans cette ligne, les trois autres actifs monteraient et descendraient quasiment ensemble.",
            ],
          },
        ],
      },
      {
        assets: [
          {
            id: "sp500", pct: 35,
            pourquoi: [
              "Le cœur du portefeuille : l'indice le plus performant sur longue période.",
              "{pct}% sur l'indice américain le plus suivi au monde.",
            ],
          },
          {
            idOptions: EM_OPTIONS, pct: 20,
            pourquoi: [
              "Un pari sur le rattrapage économique des pays émergents — plus de potentiel, plus de volatilité.",
              "Ajoute une deuxième source de croissance, décorrélée des États-Unis.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 15,
            pourquoi: [
              "{pct}% : la dose maximale que ce profil s'autorise sur l'actif le plus volatil du portefeuille.",
              "La ligne la plus spéculative, dosée pour ne pas faire dérailler l'ensemble.",
            ],
          },
          {
            id: "foncieres_etf", pct: 15,
            pourquoi: [
              "Un peu d'immobilier coté pour diversifier les sources de performance.",
              "Vient équilibrer un portefeuille très concentré sur les actions et la crypto.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Le filet de sécurité minimal — juste assez pour amortir les pires scénarios.",
              "{pct}% pour ne pas laisser le portefeuille à 100% dépendant des marchés actions et crypto.",
            ],
          },
        ],
      },
      {
        // Variante "styles" : facteurs (momentum) + semi-conducteurs, sans EM ni immobilier.
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 35,
            pourquoi: [
              "Le socle mondial, même dans cette variante plus orientée facteurs et thématiques.",
              "{pct}% pour garder un cœur diversifié avant les paris plus ciblés du reste du portefeuille.",
            ],
          },
          {
            id: "sect_semi", pct: 20,
            pourquoi: [
              "Un pari sectoriel à fort potentiel, porté par la demande en intelligence artificielle.",
              "Vient muscler la partie croissance du portefeuille au-delà du seul indice mondial.",
            ],
          },
          {
            id: "strat_momentum", pct: 15,
            pourquoi: [
              "Une stratégie qui suit les tendances de marché en cours, plutôt qu'un pari statique.",
              "Ajoute une troisième logique de performance, différente du secteur et de l'indice large.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 10,
            pourquoi: [
              "{pct}%, la même dose mesurée que dans les autres variantes de ce profil.",
              "La poche satellite habituelle de ce profil : présente, mais toujours limitée.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 20,
            pourquoi: [
              "Le filet de sécurité de cette variante, face à trois lignes toutes orientées croissance.",
              "Sans cette ligne, tout le portefeuille dépendrait du même scénario haussier.",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "offensif",
    tierKey: "offensif",
    label: "L'Offensif",
    accroches: [
      "Pas de filet de sécurité. La performance avant tout, et tant pis pour les nerfs.",
      "Ce portefeuille peut perdre un tiers de sa valeur en un an. Il peut aussi en gagner le double.",
      "Réservé à ceux qui ont du temps devant eux — beaucoup de temps.",
      "Aucun filet. Aucun compromis. Que de la croissance.",
      "Le risque maximum pour le potentiel maximum.",
    ],
    sousTitres: [
      "Voici à quoi ça ressemble concrètement 👇",
      "Le détail, ligne par ligne 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le détail, sans filtre 👇",
      "Ce que ça donne, ligne par ligne 👇",
    ],
    ctas: [
      "Toi, jusqu'où tu pousses le curseur du risque ? 👇",
      "Qui ici tiendrait ce portefeuille sans vendre en pleine panique ? 👇",
      "Ce niveau de risque est-il trop élevé pour toi ? 👇",
      "{worst_pct} en {worst_year}, {best_pct} en {best_year} : tu prendrais ce deal ? 👇",
      "Aucun filet, que de la croissance : t'es fait pour ça ou pas du tout ? 👇",
    ],
    warnings: [
      "Ce portefeuille peut perdre plus de 30% en une seule année. Ce n'est pas un scénario extrême, c'est déjà arrivé.",
      "Aucune ligne de sécurité ici. Chaque actif peut chuter fortement, y compris en même temps que les autres.",
    ],
    contextFallback: "Une baisse de cette ampleur fait partie du jeu à ce niveau de risque. Ce n'est pas une anomalie.",
    combos: [
      {
        assets: [
          {
            id: "nasdaq100", pct: 35,
            pourquoi: [
              "La ligne la plus lourde du portefeuille, sur l'indice le plus volatil des marchés développés.",
              "{pct}% concentrés sur l'innovation et la tech — le pari central de ce profil.",
            ],
          },
          {
            idOptions: EM_OPTIONS, pct: 25,
            pourquoi: [
              "Un deuxième moteur de croissance, sur des marchés encore plus volatils que les États-Unis.",
              "Ajoute une deuxième zone géographique à fort potentiel, et à fort risque.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 25,
            pourquoi: [
              "{pct}% : proche du maximum que ce profil s'autorise sur l'actif le plus explosif du portefeuille.",
              "La ligne qui peut, à elle seule, faire basculer l'année dans un sens ou dans l'autre.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 15,
            pourquoi: [
              "La seule ligne un peu plus posée du portefeuille — et encore, elle reste 100% actions.",
              "Même la ligne « la plus sage » de ce portefeuille n'a aucun filet de sécurité obligataire.",
            ],
          },
        ],
      },
      {
        assets: [
          {
            idOptions: BITCOIN_OPTIONS, pct: 30,
            pourquoi: [
              "{pct}% : le maximum assumé par ce profil sur l'actif le plus volatil de toute la bibliothèque.",
              "Un tiers du portefeuille sur un actif capable de perdre les deux tiers de sa valeur en un an.",
            ],
          },
          {
            id: "nasdaq100", pct: 40,
            pourquoi: [
              "Le moteur principal : {pct}% concentrés sur la tech américaine la plus agressive.",
              "La ligne la plus lourde du portefeuille, sur l'indice historiquement le plus volatil des indices larges.",
            ],
          },
          {
            idOptions: EM_OPTIONS, pct: 30,
            pourquoi: [
              "Complète le pari avec une troisième zone à fort potentiel — et zéro obligation pour amortir quoi que ce soit.",
              "Aucune des trois lignes de ce portefeuille n'a vocation à protéger les deux autres. C'est voulu.",
            ],
          },
        ],
      },
      {
        // Variante "géographies concentrées" : semi-conducteurs + paris pays uniques (Chine, Inde).
        assets: [
          {
            id: "sect_semi", pct: 35,
            pourquoi: [
              "Le secteur le plus volatil de toute la bibliothèque : de quoi porter à lui seul l'esprit de ce profil.",
              "{pct}% sur un seul secteur : la définition même d'un pari concentré et assumé.",
            ],
          },
          {
            id: "china", pct: 25,
            pourquoi: [
              "Un pari concentré sur un seul pays émergent, avec un risque politique bien réel en prime.",
              "Plus risqué qu'un ETF émergents diversifié : tout dépend d'un seul marché.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 25,
            pourquoi: [
              "{pct}% : la dose habituelle de ce profil sur l'actif le plus explosif de la bibliothèque.",
              "Complète deux paris déjà très concentrés avec un troisième, tout aussi radical.",
            ],
          },
          {
            id: "india", pct: 15,
            pourquoi: [
              "Un deuxième pari pays, sur une dynamique de croissance différente de celle de la Chine.",
              "Diversifie un peu les paris géographiques, sans jamais revenir vers un indice large.",
            ],
          },
        ],
      },
    ],
  },
];
