// Bibliothèque de thèses de portefeuille — remplace l'ancien moteur "catégories aléatoires".
// Chaque thèse est une combinaison curatée d'actifs qui partagent une même logique narrative
// (cf. règle #3 du brief : jamais de mélange sans thèse commune). Les pourcentages des combos
// ont été validés pour respecter les bornes de "pire année" du palier de risque associé
// (voir TIER_WORST_BOUNDS dans engine.js) — ne pas changer un combo sans revalider ces bornes.

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

export const THESES = [
  {
    id: "prudent",
    tierKey: "prudent",
    label: "Le Prudent",
    accroches: [
      "La priorité n'est pas de gagner plus. C'est de ne jamais perdre gros.",
      "Zéro sensation forte, zéro mauvaise surprise : voici à quoi ça ressemble.",
      "Ici, le capital passe avant tout le reste — même avant la performance.",
    ],
    sousTitres: [
      "Voici comment ce choix se traduit concrètement 👇",
      "La composition, actif par actif 👇",
      "Ce que ça donne une fois posé sur le papier 👇",
    ],
    ctas: [
      "Tu mettrais plus ou moins d'or dans ce genre de portefeuille ? 👇",
      "Toi aussi tu dors mieux en sacrifiant un peu de performance ? 👇",
      "C'est ce niveau de sécurité que tu recherches, ou tu trouves ça trop timide ? 👇",
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
            id: "oblig_corp_ig", pct: 25,
            pourquoi: [
              "Un peu plus de rendement que le fonds euros, sans sortir de la logique « je ne veux pas de sueurs froides ».",
              "La couche intermédiaire : un peu de risque de crédit, en échange d'un coupon plus généreux.",
            ],
          },
          {
            id: "or", pct: 20,
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
            id: "or", pct: 20,
            pourquoi: [
              "La seule vraie protection contre un scénario que les obligations et le fonds euros ne couvrent pas : la perte de confiance dans la monnaie.",
              "{pct}% pour ne pas tout miser sur le système financier classique.",
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
    ],
    sousTitres: [
      "Voici ce que ça donne une fois assemblé 👇",
      "Le détail de la répartition 👇",
      "Actif par actif, la logique derrière ce choix 👇",
    ],
    ctas: [
      "Tu mettrais quoi dans un portefeuille défensif ? 👇",
      "Ce dosage entre sécurité et rendement, il te semble juste ou trop timide ? 👇",
      "Santé, immobilier, or... tu ajouterais quelle autre brique défensive ? 👇",
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
            id: "oblig_corp_ig", pct: 25,
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
            id: "or", pct: 20,
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
            id: "strat_dividendes", pct: 25,
            pourquoi: [
              "Des entreprises qui paient (et augmentent) leur dividende depuis des années — le profil actions le plus proche de l'esprit défensif.",
              "La brique « revenu régulier » du portefeuille, cohérente avec la logique de stabilité.",
            ],
          },
          {
            id: "or", pct: 15,
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
    ],
    sousTitres: [
      "Voici comment cette logique se traduit en pourcentages 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois posé noir sur blanc 👇",
    ],
    ctas: [
      "Tu protèges ton patrimoine de l'inflation comment, toi ? 👇",
      "Or, matières premières, obligations indexées... tu ferais confiance à quoi en premier ? 👇",
      "Ce genre de portefeuille, tu le vois comme une assurance ou une vraie stratégie de fond ? 👇",
    ],
    warnings: [
      "Ce portefeuille sous-performe en marché actions haussier. Il est fait pour protéger, pas pour faire croître rapidement le capital.",
      "Aucune de ces lignes ne verse de dividende ni d'intérêt classique. La logique ici est la préservation de la valeur, pas le revenu.",
    ],
    contextFallback: "Ce portefeuille n'a connu aucune année réellement négative sur la période observée.",
    // Pas de REIT/foncière ici : la hausse des taux qui accompagne l'inflation fait mécaniquement
    // baisser leur valorisation (-20 à -25% en 2022, année d'inflation record). Seuls des actifs
    // réels ou indexés (or, matières premières, obligations indexées inflation) et la poche de
    // liquidité (fonds euros) restent cohérents avec la thèse.
    combos: [
      {
        assets: [
          {
            id: "or", pct: 35,
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
        // Pas de pétrole ici : trop extrême pour une thèse de protection (l'ETC est passé sous
        // zéro en avril 2020) et redondant avec le panier large déjà présent. Invesco Bloomberg
        // Commodity (mp_large) couvre déjà l'énergie, en plus diversifié.
        assets: [
          {
            id: "or", pct: 45,
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
    ],
    sousTitres: [
      "Voici la composition qui porte cette logique 👇",
      "Le détail, ligne par ligne 👇",
      "Ce que ça donne concrètement 👇",
    ],
    ctas: [
      "Tu vises plutôt le revenu régulier ou la plus-value à la revente ? 👇",
      "SCPI, foncières, dividendes... tu ferais confiance à laquelle de ces sources de revenu ? 👇",
      "Vivre (en partie) de son portefeuille, tu y penses déjà ou c'est trop tôt pour toi ? 👇",
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
            id: "scpi", pct: 20,
            pourquoi: [
              "Des loyers versés régulièrement, portefeuille mutualisé de bureaux et commerces — le revenu « à l'ancienne ».",
              "La brique la plus classique du rentier français : le revenu locatif, sans la gestion.",
            ],
          },
          {
            id: "foncieres_etf", pct: 35,
            pourquoi: [
              "La version cotée et liquide de l'immobilier de revenu : mêmes loyers, beaucoup plus de souplesse.",
              "{pct}% : la ligne la plus lourde, car c'est elle qui distribue le plus régulièrement.",
            ],
          },
          {
            id: "strat_dividendes", pct: 30,
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
    ],
    sousTitres: [
      "Voici comment ça se traduit concrètement 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
    ],
    ctas: [
      "L'équilibre parfait pour toi, ou tu préfères trancher plus franchement ? 👇",
      "Tu es plutôt team équilibre ou team choix tranchés ? 👇",
      "Ce dosage actions / stabilisateurs, tu le trouves juste ? 👇",
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
            id: "msci_world", pct: 40,
            pourquoi: [
              "Le moteur de croissance du portefeuille : plusieurs milliers d'entreprises mondiales en une ligne.",
              "{pct}% : la part qui doit faire le gros du travail sur le long terme.",
            ],
          },
          {
            id: "oblig_corp_ig", pct: 20,
            pourquoi: [
              "Le stabilisateur. Même en pleine crise, cette poche amortit les fluctuations des autres lignes.",
              "Vient limiter la casse quand les actions traversent une mauvaise année.",
            ],
          },
          {
            id: "or", pct: 15,
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
    ],
    sousTitres: [
      "Voici à quoi ressemble ce pari 👇",
      "Le détail, ligne par ligne 👇",
      "Ce que ça donne une fois assemblé 👇",
    ],
    ctas: [
      "Tu crois au retour de l'Europe ou tu restes sur le S&P 500 ? 👇",
      "100% Europe, ça te semble courageux ou risqué ? 👇",
      "Tu miserais sur quel pays européen en premier ? 👇",
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
    ],
    sousTitres: [
      "Voici la composition qui porte cette logique 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
    ],
    ctas: [
      "Tu oserais mettre du Bitcoin dans ton portefeuille, ou tu trouves ça too risqué ? 👇",
      "Ce niveau de risque, ça te tente ou ça t'inquiète ? 👇",
      "Tu serais capable de tenir ce portefeuille dans une année à -20% ? 👇",
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
            id: "msci_world", pct: 40,
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
            id: "bitcoin", pct: 10,
            pourquoi: [
              "{pct}%, pas plus : assez pour capter un potentiel de croissance rare, pas assez pour mettre le portefeuille en danger si ça tourne mal.",
              "La ligne la plus explosive du portefeuille, volontairement limitée à une poche satellite.",
            ],
          },
          {
            id: "or", pct: 25,
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
            id: "msci_em", pct: 20,
            pourquoi: [
              "Un pari sur le rattrapage économique des pays émergents — plus de potentiel, plus de volatilité.",
              "Ajoute une deuxième source de croissance, décorrélée des États-Unis.",
            ],
          },
          {
            id: "bitcoin", pct: 15,
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
            id: "or", pct: 15,
            pourquoi: [
              "Le filet de sécurité minimal — juste assez pour amortir les pires scénarios.",
              "{pct}% pour ne pas laisser le portefeuille à 100% dépendant des marchés actions et crypto.",
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
    ],
    sousTitres: [
      "Voici à quoi ça ressemble concrètement 👇",
      "Le détail, ligne par ligne 👇",
      "Ce que ça donne une fois assemblé 👇",
    ],
    ctas: [
      "Ce niveau de risque est-il trop élevé pour toi ? 👇",
      "Qui ici tiendrait ce portefeuille sans vendre en pleine panique ? 👇",
      "Toi, jusqu'où tu pousses le curseur du risque ? 👇",
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
            id: "msci_em", pct: 25,
            pourquoi: [
              "Un deuxième moteur de croissance, sur des marchés encore plus volatils que les États-Unis.",
              "Ajoute une deuxième zone géographique à fort potentiel, et à fort risque.",
            ],
          },
          {
            id: "bitcoin", pct: 25,
            pourquoi: [
              "{pct}% : proche du maximum que ce profil s'autorise sur l'actif le plus explosif du portefeuille.",
              "La ligne qui peut, à elle seule, faire basculer l'année dans un sens ou dans l'autre.",
            ],
          },
          {
            id: "msci_world", pct: 15,
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
            id: "bitcoin", pct: 30,
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
            id: "msci_em", pct: 30,
            pourquoi: [
              "Complète le pari avec une troisième zone à fort potentiel — et zéro obligation pour amortir quoi que ce soit.",
              "Aucune des trois lignes de ce portefeuille n'a vocation à protéger les deux autres. C'est voulu.",
            ],
          },
        ],
      },
    ],
  },
];
