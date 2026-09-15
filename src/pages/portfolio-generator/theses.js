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

// Accroche d'ouverture du tweet (hook + intro) : cf. la propriété `hooks` de chaque riskCombo
// ci-dessous. Remplace successivement la ligne fixe "📊 Exemple de répartition de patrimoine ·
// [profil]" (jusqu'au 14/09/2026), puis un système de 6 familles A-F génériques choisies par
// critères de palier/pire année (15/09/2026, abandonné le même jour) — les deux jugées trop
// formulaïques ("tu te dis '[profil]'…", "[profil] sur le papier…" répétés avec juste le palier qui
// change). Remplacé par une bibliothèque écrite à la main, PAR COMBO (profil × palier), ancrée sur
// le trait le plus marquant de CE combo précis (la ligne la plus inattendue pour son palier, un
// pari géographique ou sectoriel assumé, une absence notable) plutôt que sur une formule générique
// substituable à n'importe quel autre combo. Cf. `hooks` sur chaque riskCombo et pickHookPair dans
// engine.js pour la sélection (anti-répétition, mais jamais hook et intro dépareillés — les deux
// viennent toujours de la même paire, l'intro devant répondre explicitement à la question du hook).

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
//
// Politique de placement (audit "post-audit v2", règle 1, août 2026) : Prudent/Défensif/Équilibré
// interdits (jamais référencé dans ces paliers, pour aucun profil), Offensif libre (pas de
// plancher de perte), Dynamique autorisé UNIQUEMENT à un poids fixe pré-validé exhaustivement par
// script de stress-test (toutes les combinaisons possibles des autres idOptions du combo) pour ne
// jamais dépasser le plancher de -30% — jamais un mécanisme de recomposition au moment du tirage
// (pas de "si le drawdown dépasse X, retirer la ligne et redistribuer" dans engine.js). Toute
// nouvelle utilisation de LEVERAGE_OPTIONS en Dynamique, sur ce profil ou un autre, doit repasser
// par le même stress-test avant d'être ajoutée — jamais supposée sûre par défaut.
//
// Ajout du 14/09/2026 (Crypto-Curieux Dynamique, audit "Ajustement Crypto-Curieux Dynamique") : un
// poids fixe pré-validé peut quand même retomber sous un seuil-plancher après jitter si une autre
// ligne du même combo gagne du terrain à ses dépens — cf. CRYPTO_CURIEUX_BITCOIN_BOUNDS et la
// vérification levier ≥10% dans violatesProfileInvariant (engine.js), qui annulent tout swap de
// jitter ramenant le levier ou le Bitcoin sous leur plancher pour ce profil. Reste un filet de
// jitter, pas le mécanisme "post-audit v2" ci-dessus : la politique de placement du poids de base
// (choix du % initial, validé par stress-test avant tout ajout) est inchangée.
export const LEVERAGE_OPTIONS = ["lqq", "cl2"];

// Satellite géographique "Asie" (profil Thématique, cf. son combo Équilibré) — ajouté le 08/09/2026
// à la demande utilisateur, en réponse au constat que la seule ligne Asie disponible (actions_japon)
// était fixe (jamais soumise à rotation), donc présente à 100% des tirages de ce combo précis. Les
// 4 membres suivent des indices pays/région réels et distincts (pas des jumeaux stricts comme
// GOLD_OPTIONS/BITCOIN_OPTIONS) : Japon (marché développé calme), Corée et Taïwan (paris pays
// uniques, très volatils, portés par les semi-conducteurs), Asie-Pacifique hors Japon (le plus
// diversifié des quatre, Chine/Taïwan/Corée/Inde/Asean réunis). Chaque option revalidée sur les
// bornes de pire année du combo qui l'utilise, comme tous les autres groupes ci-dessus.
export const ASIA_OPTIONS = ["actions_japon", "actions_coree", "actions_taiwan", "actions_asie_ex_japon"];

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
        hooks: [
          {
            hook: "55% de fonds euros, 10% d'actions monde. Tu appellerais ça un vrai portefeuille prudent ?",
            intro: "Le capital ne bouge presque pas, même dans une mauvaise année.",
          },
          {
            hook: "10% d'actions, le reste en fonds euros et obligations. Ça te semble trop calme ?",
            intro: "C'est fait pour : viser -3,7% dans la pire année, pas plus.",
          },
        ],
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
        hooks: [
          {
            hook: "35% de fonds euros mais 25% d'actions monde cette fois. Ça change quoi par rapport à un Prudent ?",
            intro: "Le risque grimpe un peu — jusqu'à -6% dans la pire année au lieu de -4%.",
          },
          {
            hook: "Toujours 15% d'or dans ce Défensif. C'est beaucoup ou pas tant que ça ?",
            intro: "Assez pour amortir un vrai coup dur, pas assez pour piloter la performance.",
          },
        ],
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
        hooks: [
          {
            hook: "20% d'immobilier coté dans ce portefeuille Équilibré. Tu t'attendais à autant ?",
            intro: "Six lignes différentes, aucune qui dépasse 30% — la diversification pure.",
          },
          {
            hook: "-12,3% la pire année pour un Équilibré. Ça te paraît beaucoup ou raisonnable ?",
            intro: "Sur six lignes différentes, aucune ne pèse plus de 30% du portefeuille.",
          },
        ],
        // Insertion actions_value du 30/08/2026 : ligne réduite pour compenser = SP500_OPTIONS
        // (15% -> 5%), la ligne la plus proche en rôle (pari actions concentré, à contenu
        // fortement growth/tech) — WORLD_OPTIONS/CORPBOND_OPTIONS/GOLD_OPTIONS/IMMOBILIER_OPTIONS
        // laissés intacts, rôles distincts (diversification large, stabilisateur, protection,
        // classe d'actif différente).
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 30,
            pourquoi: [
              "Le moteur de croissance du portefeuille : plusieurs milliers d'entreprises mondiales en une ligne.",
              "{pct}% : la part qui doit faire le gros du travail sur le long terme.",
            ],
          },
          {
            idOptions: SP500_OPTIONS, pct: 5,
            pourquoi: [
              "Un pari plus concentré sur le marché américain, en complément de la ligne monde plus diversifiée géographiquement.",
              "{pct}% pour renforcer l'exposition aux États-Unis sans dépendre uniquement du seul indice mondial.",
            ],
          },
          {
            id: "actions_value", pct: 10,
            pourquoi: [
              "Le pendant « value » du pari S&P 500 : des entreprises jugées sous-valorisées plutôt que la croissance pure.",
              "{pct}% pour équilibrer le style croissance déjà présent avec une approche plus factorielle.",
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
        hooks: [
          {
            hook: "20% de marchés émergents dans ce Dynamique. Tu miserais là-dessus ?",
            intro: "Le pari le plus risqué du lot, juste derrière l'indice monde à 40%.",
          },
          {
            hook: "4% en ETF à levier, noyés dans un portefeuille à 40% d'indice monde. Ça vaut le coup pour si peu ?",
            intro: "À ce poids-là, c'est un accélérateur discret, pas le moteur du portefeuille.",
          },
        ],
        // Insertion actions_value du 30/08/2026 : ligne réduite pour compenser = NASDAQ100_OPTIONS
        // (21% -> 9%, le pendant "growth" qu'actions_value vient équilibrer côté "value") —
        // LEVERAGE_OPTIONS laissé strictement inchangé à 4% (plafond dur déjà validé par
        // stress-test, cf. commentaire ci-dessous), EM_OPTIONS/GOLD_OPTIONS non touchés (rôles
        // distincts : croissance émergente, protection).
        //
        // actions_japon (satellite Japon, 8%) retiré le 07/09/2026 (retour utilisateur : présence
        // jugée incohérente pour un profil "Généraliste" qui promet justement l'absence de
        // conviction forte, cf. son accroche "Aucune conviction forte" — un pari géographique fixe
        // à 100% de présence, jamais soumis à rotation contrairement à toutes les autres lignes du
        // combo, contredisait cette promesse). Poids reversé vers WORLD_OPTIONS (32% -> 40%, son
        // rôle d'origine avant l'insertion du 30/08/2026 — même "socle diversifié large" that Japan
        // prétendait renforcer). Le satellite Japon reste utilisé tel quel dans le profil
        // Thématique (cf. plus bas), dont la thèse assumée est justement la conviction concentrée —
        // un pari géographique fixe y est cohérent avec le discours du profil, contrairement à ici.
        // Pire année 2022 du combo revérifiée après retrait : légèrement MEILLEURE qu'avant
        // (-15,56% max vs -15,03% dans le pire sous-cas testé, contre un plancher de -30% —
        // confortablement dans les clous, jamais le facteur limitant de ce combo).
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 40,
            pourquoi: [
              "Le socle actions du portefeuille, même dans sa version la plus dynamique.",
              "{pct}% : le cœur reste diversifié mondialement avant d'ajouter des paris plus ciblés.",
            ],
          },
          {
            idOptions: NASDAQ100_OPTIONS, pct: 9,
            pourquoi: [
              "La partie qui vise vraiment la surperformance : concentrée sur l'innovation américaine.",
              "Le moteur de croissance le plus agressif du portefeuille.",
            ],
          },
          {
            id: "actions_value", pct: 12,
            pourquoi: [
              "Le pendant « value » du pari Nasdaq : des entreprises jugées sous-valorisées plutôt que la croissance pure.",
              "{pct}% pour ne pas dépendre uniquement du style croissance dans la partie actions concentrées.",
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
        hooks: [
          {
            hook: "10% de Bitcoin et 15% d'ETF à levier dans le même portefeuille Généraliste. Ça te tente ?",
            intro: "Sans surprise, la pire année tombe à -30,6% — le prix de cette ambition.",
          },
          {
            hook: "-30,6% la pire année pour ce Généraliste Offensif. Tu encaisserais ça sans paniquer ?",
            intro: "En échange, 25% de Nasdaq-100 et 20% d'émergents pour viser la croissance.",
          },
        ],
        // Rééquilibrage EM_OPTIONS/WORLD_OPTIONS du 08/09/2026 (audit "cohérence des pondérations") :
        // pour un profil dont la thèse est la diversification, le socle World/ACWI/All-World doit
        // toujours peser au moins autant que n'importe quelle ligne actions plus concentrée du même
        // combo (régionale/sectorielle/single-pays) — invariante détectée en défaut ici (World 20%
        // < EM 30% ET < Nasdaq100 25%, les deux paris concentrés dépassaient le socle diversifié).
        // EM_OPTIONS réduit (30% -> 20%, le violateur le plus large) et WORLD_OPTIONS relevé d'autant
        // (20% -> 30%) : World redevient la ligne la plus lourde du combo, NASDAQ100_OPTIONS
        // (25%) et EM_OPTIONS (20%) repassent tous deux sous le socle diversifié. LEVERAGE_OPTIONS/
        // BITCOIN_OPTIONS non touchés (rôles distincts : levier synthétique, actif non-actions — pas
        // des "lignes actions plus concentrées" au sens de cette invariante).
        assets: [
          {
            idOptions: NASDAQ100_OPTIONS, pct: 25,
            pourquoi: [
              "Le moteur principal : {pct}% concentrés sur la tech américaine la plus agressive.",
              "Un des paris les plus concentrés du portefeuille, sur l'un des indices les plus volatils qui existent.",
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
            idOptions: EM_OPTIONS, pct: 20,
            pourquoi: [
              "Un deuxième moteur de croissance, sur des marchés encore plus volatils que les États-Unis.",
              "Ajoute une deuxième zone géographique à fort potentiel, et à fort risque — sans dépasser le socle diversifié.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 30,
            pourquoi: [
              "La ligne la plus lourde du portefeuille — même dans sa version la plus offensive, la diversification reste le socle.",
              "{pct}% : la base reste 100% actions, mais jamais dépassée par un seul pari plus concentré.",
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
        hooks: [
          {
            hook: "20% en obligations high yield pour un Rentier Prudent, ça surprend un peu, non ?",
            intro: "C'est ce qui permet de sortir un vrai rendement sans sacrifier la sécurité du fonds euros.",
          },
          {
            hook: "15% de SCPI, 15% de dividendes. Le duo pour générer du revenu sans trop bouger, ça te parle ?",
            intro: "Le fonds euros reste quand même la moitié du portefeuille.",
          },
        ],
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
        hooks: [
          {
            hook: "25% en dividendes et 25% en high yield. Deux sources de revenu côte à côte, ça te semble équilibré ?",
            intro: "Le fonds euros descend à 35% pour laisser plus de place au rendement.",
          },
          {
            hook: "15% d'immobilier coté en plus des dividendes et du high yield. Trois sources de revenu, ça fait beaucoup ?",
            intro: "C'est le prix pour viser plus de rendement qu'un profil Prudent.",
          },
        ],
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
        hooks: [
          {
            hook: "45% en foncières cotées, plus 15% de SCPI. Ça fait 60% d'immobilier pour un Rentier. Volontaire ou excessif ?",
            intro: "C'est l'idée : l'immobilier reste la source de rendement la plus lisible pour ce profil.",
          },
          {
            hook: "Presque la moitié du portefeuille en foncières cotées. Tu trouves ça trop concentré ?",
            intro: "Le reste vient diversifier avec dividendes, high yield et un peu de Treasury américain.",
          },
        ],
        // Insertion oblig_etat_us du 30/08/2026 : ligne réduite pour compenser = HIGHYIELD_OPTIONS
        // (15% -> 8%), seule autre poche obligataire du combo, donc le rôle le plus proche — scpi/
        // foncieres_etf_dist/DIVIDEND_OPTIONS_DIST laissés intacts (rôles distincts : immobilier
        // physique, immobilier coté, actions à dividende). oblig_etat_us est une part USD
        // (Distribution), compatible avec la règle "uniquement des parts distribuantes" du profil.
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
            id: "oblig_etat_us", pct: 7,
            pourquoi: [
              "Un coupon régulier hors zone euro, en part distribuante — cohérent avec la thèse de revenu de ce profil.",
              "{pct}% pour diversifier la devise de la poche à revenu fixe, sans sortir de la logique Dist.",
            ],
          },
          {
            idOptions: HIGHYIELD_OPTIONS, pct: 8,
            pourquoi: [
              "Un coupon nettement supérieur aux obligations classiques — le prix à payer pour plus de revenu.",
              "La touche de rendement obligataire qui vient compléter les trois sources de revenu déjà présentes.",
            ],
          },
        ],
      },
      dynamique: {
        hooks: [
          {
            hook: "45% du portefeuille en JEPQ, un fonds qui vend des options. Tu sais ce que ça implique ?",
            intro: "Ça plafonne la hausse en marché haussier, mais ça verse un revenu mensuel élevé.",
          },
          {
            hook: "Le covered call (JEPQ) devient la ligne dominante à 45%. Un pari sur le revenu plutôt que sur la performance — ça te va ?",
            intro: "Le reste (foncières, dividendes, high yield) vient juste diversifier la source de ce revenu.",
          },
        ],
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
        hooks: [
          {
            hook: "65% du portefeuille sur un seul fonds à vente d'options (JEPQ). Ça te paraît trop concentré pour un Rentier ?",
            intro: "Pour ce profil, c'est assumé : maximiser le revenu mensuel plutôt que diversifier les sources.",
          },
          {
            hook: "Un Rentier Offensif, c'est deux tiers du portefeuille sur une seule stratégie de revenu. Ça te choque ?",
            intro: "Le pari, c'est que la prime d'options rapporte plus que ce qu'elle plafonne en hausse.",
          },
        ],
        // Exception de drawdown minimum (audit "post-audit v6", août 2026) : le covered call du
        // JEPQ plafonne mécaniquement son propre drawdown (la prime d'option limite la baisse
        // autant que la hausse) — un pire exercice "sage" pour ce combo n'est donc jamais un
        // signe de mauvais calibrage, contrairement à un Bouclier Équilibré trop plat (cf.
        // correction 2). Le niveau Offensif se justifie ici par la thèse "revenus maximaux au prix
        // d'un plafond de hausse", pas par l'amplitude du risque en capital — cohérent avec
        // RISK_BOUNDS.offensif (pas de plancher : la performance, ou ici le revenu, prime). Tout
        // audit futur sur un plancher de drawdown minimum doit exempter ce combo précis.
        drawdownFloorException:
          "Le covered call de JEPQ plafonne mécaniquement le drawdown. Le niveau Offensif est justifié par la thèse revenus maximaux, pas par le risque en capital.",
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
        hooks: [
          {
            hook: "55% en obligations d'État court terme, seulement 15% d'actions. C'est encore un vrai pari sur l'Europe, ça ?",
            intro: "Oui, mais version ultra-prudente : la sécurité avant la conviction.",
          },
          {
            hook: "75% du portefeuille en fonds euros et obligations courtes. Tu appellerais ça 'Pro-Européen' quand même ?",
            intro: "La conviction Europe est là, juste dosée au minimum pour ce palier de risque.",
          },
        ],
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
        hooks: [
          {
            hook: "30% d'Euro Stoxx 50 et 20% de CAC 40. Un pari France + zone euro assumé, tu en penses quoi ?",
            intro: "La moitié du portefeuille mise sur les grandes valeurs européennes, sans détour par les US.",
          },
          {
            hook: "Toujours zéro action américaine ici. Un choix que tu ferais ?",
            intro: "50% du portefeuille reste concentré sur la zone euro, le reste sécurise le capital.",
          },
        ],
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
        hooks: [
          {
            hook: "20% de small caps européennes dans ce portefeuille Équilibré. Tu savais que ça existait comme pari ?",
            intro: "Plus volatil que les grandes valeurs, mais toujours 100% Europe.",
          },
          {
            hook: "Quatre lignes différentes, toutes européennes, zéro action US. C'est le genre de discipline que tu tiendrais ?",
            intro: "Même la tech ici, c'est la version européenne du secteur — pas les géants américains.",
          },
        ],
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
        hooks: [
          {
            hook: "30% d'or dans un portefeuille censé miser sur l'Europe. Ça te semble contradictoire ?",
            intro: "Pas vraiment : l'or amortit la volatilité des 50% restants, concentrés sur la tech et les small caps européennes.",
          },
          {
            hook: "30% de tech européenne, 30% d'or, zéro action américaine. Un mélange qui te tente ?",
            intro: "C'est le pari Europe poussé à son maximum, avec l'or comme seul filet de sécurité.",
          },
        ],
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
      // Ajouté le 08/09/2026 (audit "couverture des paliers") : contrairement au Bouclier, la thèse
      // géographique de ce profil (Europe plutôt que États-Unis) reste cohérente même sans plancher
      // de perte — rien dans son identité n'empêche une version "la performance prime". Composition
      // extrapolée de Dynamique ci-dessus : les deux paris de croissance (tech_europe/smallcap_europe)
      // poussés plus loin, EUROSTOXX50_OPTIONS (socle) et GOLD_OPTIONS (protection) réduits d'autant
      // — même mouvement que chaque autre profil entre son propre palier Dynamique et Offensif
      // (le socle/la protection cèdent du poids aux paris les plus concentrés). RISK_BOUNDS.offensif
      // n'a pas de plancher (min: null) : pas de stress-test de borne nécessaire pour ce combo.
      offensif: {
        hooks: [
          {
            hook: "70% du portefeuille entre tech européenne et small caps. Le pari Europe le plus poussé du lot, ça te tente ?",
            intro: "Zéro action américaine, zéro grande capitalisation classique — juste la conviction à l'état pur.",
          },
          {
            hook: "-21% la pire année, entièrement sur des paris européens. Tu encaisserais ça pour rester fidèle à cette conviction ?",
            intro: "L'or à 15% est la seule ligne qui n'est pas un pari direct sur l'Europe.",
          },
        ],
        assets: [
          {
            idOptions: EUROSTOXX50_OPTIONS, pct: 15,
            pourquoi: [
              "Le seul ancrage qui reste dans cette version offensive — le reste du portefeuille est 100% pari.",
              "{pct}% : juste de quoi garder un pied dans le socle de la zone euro.",
            ],
          },
          {
            id: "tech_europe", pct: 40,
            pourquoi: [
              "{pct}% : la ligne la plus lourde du portefeuille — la tech européenne poussée à son maximum.",
              "Le pari le plus concentré de la thèse, sans aucun plancher de perte pour l'amortir.",
            ],
          },
          {
            id: "smallcap_europe", pct: 30,
            pourquoi: [
              "Une deuxième source de croissance régionale, à son poids maximal dans cette version offensive.",
              "{pct}% : aussi lourd que dans peu d'autres combos de ce profil.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 15,
            pourquoi: [
              "Le seul filet de sécurité restant, réduit au minimum pour laisser place aux paris de croissance.",
              "{pct}% : moins qu'ailleurs dans ce profil — ce palier n'a pas de plancher à protéger.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "anti_inflation",
    label: "L'Anti-Inflation",
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
        hooks: [
          {
            hook: "-0,2% la pire année pour ce portefeuille. Tu t'attendais à si peu de dégâts en 2022 ?",
            intro: "Logique : l'or et les matières premières ont justement grimpé cette année-là.",
          },
          {
            hook: "25% d'or, 15% de matières premières, même au palier Prudent. Ça te semble beaucoup pour débuter ?",
            intro: "C'est le dosage minimum pour que la protection contre l'inflation soit réelle, pas symbolique.",
          },
        ],
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
        hooks: [
          {
            hook: "La pire année de ce portefeuille, c'est... +1,4%. Tu y crois ?",
            intro: "Normal : l'or et les matières premières font justement leur travail quand tout le reste dévisse.",
          },
          {
            hook: "35% d'or, 25% de matières premières. Plus de la moitié du portefeuille dans les deux, ça te paraît extrême ?",
            intro: "Pour ce profil, c'est le cœur du réacteur, pas un simple filet de sécurité.",
          },
        ],
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
        hooks: [
          {
            hook: "15% d'argent en plus de l'or et des matières premières. Tu connaissais ce trio anti-inflation ?",
            intro: "À eux trois, ils pèsent 70% du portefeuille — et 2022 n'a même pas été une mauvaise année pour lui.",
          },
          {
            hook: "Encore une pire année positive : +2,3%. Ce portefeuille a-t-il seulement un point faible ?",
            intro: "Oui : il ne suit pas la hausse des marchés actions quand tout va bien.",
          },
        ],
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
        hooks: [
          {
            hook: "Trois lignes seulement, 85% entre or et matières premières. Tu ferais confiance à un portefeuille aussi concentré ?",
            intro: "C'est voulu : à ce palier, la conviction anti-inflation prime sur la diversification classique.",
          },
          {
            hook: "50% d'or à lui seul. Ça te paraît être une vraie diversification ou un pari unique déguisé ?",
            intro: "Un pari unique assumé — sur l'inflation, pas sur telle ou telle entreprise.",
          },
        ],
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
      // Ajouté le 08/09/2026 (audit "couverture des paliers") : la thèse de protection reste
      // cohérente sans plancher de perte — protéger le pouvoir d'achat n'est pas incompatible avec
      // "la performance prime" (contrairement au Bouclier, dont la thèse EST le plafonnement de la
      // performance). oblig_inflation retiré : comme dans tous les autres profils, aucun combo
      // Offensif de la bibliothèque ne garde de ligne obligataire pure — le stabilisateur cède toute
      // sa place aux deux jambes de la thèse (or, matières premières), poussées à leur maximum.
      // RISK_BOUNDS.offensif n'a pas de plancher (min: null) : pas de stress-test de borne nécessaire.
      offensif: {
        hooks: [
          {
            hook: "Deux lignes. Aucune action, aucune obligation. Juste 60% d'or et 40% de matières premières. Tu retirerais tout le reste comme ça ?",
            intro: "C'est la version la plus pure du pari anti-inflation — rien pour l'amortir, rien pour le diluer.",
          },
          {
            hook: "Même la pire année de ce portefeuille est positive (+4,5%, en 2023 et pas en 2022). Il a un vrai point faible ?",
            intro: "Oui : sans actions, il rate toute la croissance boursière classique quand l'inflation retombe.",
          },
        ],
        assets: [
          {
            idOptions: GOLD_OPTIONS, pct: 60,
            pourquoi: [
              "{pct}% : la thèse à son maximum absolu, sans plus aucun filet obligataire pour la tempérer.",
              "La ligne qui porte à elle seule l'essentiel du portefeuille — la conviction poussée jusqu'au bout.",
            ],
          },
          {
            idOptions: COMMODITY_OPTIONS, pct: 40,
            pourquoi: [
              "La deuxième jambe de la thèse, à son poids maximal dans toute la bibliothèque de ce profil.",
              "{pct}% : plus aucune obligation pour amortir, seulement les deux actifs réels de la thèse.",
            ],
          },
        ],
      },
    },
  },

  {
    id: "bouclier",
    label: "Le Bouclier",
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
    // Pas de version Dynamique ni Offensif (audit "couverture des paliers", 08/09/2026) : la thèse
    // du profil est justement de plafonner la performance en échange de la tranquillité (cf.
    // warnings ci-dessus, "ce n'est pas un hasard") — un "Bouclier offensif, sans plancher de
    // perte" contredirait l'identité même du profil, contrairement à Pro-Européen ou Anti-Inflation
    // (thèses géographique/protection, compatibles avec une version plus risquée sans se renier).
    // Même logique que l'absence de version Prudent chez Crypto-Curieux/Thématique ci-dessous, à
    // l'autre bout de l'échelle de risque.
    riskCombos: {
      prudent: {
        hooks: [
          {
            hook: "10% de santé, 55% de fonds euros. Le secteur défensif par excellence, mais à petite dose — ça t'étonne ?",
            intro: "À ce palier, la sécurité vient d'abord du fonds euros, la santé n'est qu'un complément.",
          },
          {
            hook: "-2,6% la pire année, quasi aucun mouvement. Tu trouves ça rassurant ou trop timide ?",
            intro: "C'est le prix de la stabilité : ce portefeuille ne vise pas à sur-performer, juste à ne pas décevoir.",
          },
        ],
        // Insertion oblig_etat_us du 30/08/2026 : ce combo n'avait pas de ligne "oblig_etat_eur"
        // à remplacer (contrairement à la demande initiale, qui supposait sa présence — vérifié,
        // absente ici) — traité comme un COMPLÉMENT plutôt qu'un remplacement. Ligne réduite pour
        // compenser : CORPBOND_OPTIONS (25% -> 18%), seule autre poche obligataire du combo, donc
        // le rôle le plus proche ; fonds_euros/sect_sante/GOLD_OPTIONS laissés intacts (rôles
        // distincts : sécurité pure, seule ligne actions, protection non-obligataire).
        assets: [
          {
            id: "fonds_euros", pct: 55,
            pourquoi: [
              "Le socle défensif par excellence, pour ne jamais mettre le capital en danger.",
              "{pct}% pour garder une vraie marge sous un plancher de perte très serré.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 18,
            pourquoi: [
              "Un peu plus de rendement que le fonds euros, sans sortir du registre défensif.",
              "Le complément logique du fonds euros : plus de coupon, presque autant de sécurité.",
            ],
          },
          {
            id: "oblig_etat_us", pct: 7,
            pourquoi: [
              "Une deuxième zone géographique pour la poche obligataire, hors zone euro.",
              "{pct}% pour diversifier la devise de la poche obligataire, sans sortir du registre défensif.",
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
        hooks: [
          {
            hook: "La santé passe à 25%, à égalité avec le fonds euros. Un secteur qui prend enfin du poids, ça te rassure ou pas ?",
            intro: "C'est justement le secteur réputé le plus résistant en cas de récession.",
          },
          {
            hook: "Cinq lignes différentes, aucune qui dépasse 25%. Ça te semble bien réparti ?",
            intro: "C'est le principe du Bouclier : jamais tout miser sur une seule protection.",
          },
        ],
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
        hooks: [
          {
            hook: "30% d'immobilier, 27% de dividendes. Le fonds euros passe en dernier à 15%. Tu t'attendais à ce changement ?",
            intro: "À ce palier, la protection vient des revenus réguliers plutôt que du capital garanti.",
          },
          {
            hook: "30% d'immobilier, 27% de dividendes — plus de la moitié du portefeuille à eux deux. Redondant ou complémentaire, à ton avis ?",
            intro: "Complémentaire : l'un dépend du marché immobilier, l'autre des entreprises qui versent — rarement corrélés.",
          },
        ],
        assets: [
          {
            // Poids réduit de 45% à 15% lors du diagnostic "post-audit v5" (août 2026) : à 45%,
            // le pire exercice du combo plafonnait à -4,10% (2022), sous le plancher de -6%
            // attendu pour ce palier (cf. correction 2) — le fonds euros n'a historiquement aucune
            // année négative sur 2020-2025, donc chaque point qui lui est retiré au profit des
            // trois autres lignes fait mécaniquement grimper le pire exercice simulé. Vérifié
            // empiriquement (script de stress-test) : à 15%, le combo tient -8,56% (2022), avec
            // marge confortable des deux côtés de la fourchette 6-20%.
            id: "fonds_euros", pct: 15,
            pourquoi: [
              "Une base de sécurité réduite, volontairement : à ce niveau de risque, la protection vient surtout de la diversification entre les trois autres lignes.",
              "{pct}% seulement — juste de quoi ne jamais être à 100% exposé aux marchés, sans diluer le reste du compromis.",
            ],
          },
          {
            idOptions: IMMOBILIER_OPTIONS, pct: 30,
            pourquoi: [
              "Une vraie dose d'immobilier coté, pour aller chercher du rendement tout en restant dans un compromis mesuré.",
              "{pct}% : la ligne qui porte l'essentiel de la volatilité de ce portefeuille, contenue par les trois autres.",
            ],
          },
          {
            idOptions: DIVIDEND_OPTIONS, pct: 27,
            pourquoi: [
              "Des entreprises qui paient (et augmentent) leur dividende depuis des années — le profil actions le plus proche de l'esprit défensif.",
              "La brique la plus lourde du portefeuille, cohérente avec la logique de protection.",
            ],
          },
          {
            // Insertion testée le 30/08/2026 : aucune règle documentée n'exclut cet actif du
            // profil Bouclier (contrairement à Anti-Inflation/Pro-Européen/Rentier, cf. audit des
            // règles d'exclusion). Ligne réduite pour compenser = DIVIDEND_OPTIONS (35% -> 27%),
            // même rôle "ligne actions" du combo. Un test à 5% avait aussi été validé sur le palier
            // Prudent (marge 2,00pt), mais Équilibré a été retenu ici pour sa marge nettement plus
            // confortable (~9pt attendu) plutôt que de forcer la ligne la plus tendue du profil.
            id: "actions_value", pct: 8,
            pourquoi: [
              "Une deuxième approche actions, orientée style value plutôt que dividende pur.",
              "{pct}% pour diversifier la brique actions au-delà du seul critère de dividende.",
            ],
          },
          {
            idOptions: GOLD_OPTIONS, pct: 20,
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
    sousTitres: [
      "Voici comment cette conviction se traduit en pourcentages 👇",
      "Le détail, actif par actif 👇",
      "Ce que ça donne une fois assemblé 👇",
      "Le détail, sans filtre 👇",
      "Ligne par ligne, la logique derrière ce dosage 👇",
    ],
    // Révisé le 14/09/2026 (audit "Ajustement Crypto-Curieux Dynamique") : "Bitcoin, Ethereum, ou
    // les deux" implique la présence des deux cryptos, alors qu'Ethereum n'apparaît jamais hors du
    // palier Offensif (cf. riskCombos ci-dessous — id fixe "ethereum", jamais en Défensif/Équilibré/
    // Dynamique). Gardé dans le pool mais désormais filtré par resolvePortfolioPlaceholders
    // (engine.js) : jamais résolu si aucune ligne "ethereum" dans le tirage réel, pour que le pool
    // Bitcoin-only (les 5 autres CTA) reste seul disponible sur ces trois paliers, conformément à
    // la règle "le CTA reflète toujours la composition réelle".
    ctas: [
      "Tu serais capable de tenir cette poche crypto dans une année à -60% ? 👇",
      "Ce niveau d'exposition crypto, ça te tente ou ça t'inquiète ? 👇",
      "La crypto dans un portefeuille « sérieux » : logique ou hérésie ? 👇",
      "Tu aurais mis plus ou moins de Bitcoin ? 👇",
      "Bitcoin à {bitcoin_pct}% : trop agressif ou pas assez ambitieux ? 👇",
      "Bitcoin, Ethereum, ou les deux : ton choix ? 👇",
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
        hooks: [
          {
            hook: "10% de Bitcoin, 58% de fonds euros. Le dosage le plus prudent possible pour tester la crypto, ça te correspond ?",
            intro: "Même si Bitcoin s'effondre, le reste du portefeuille encaisse l'essentiel du choc.",
          },
          {
            hook: "Tu veux toucher au Bitcoin sans y laisser ta sécurité ? C'est exactement ce dosage à 10%.",
            intro: "Le fonds euros à lui seul pèse plus de cinq fois la ligne Bitcoin.",
          },
        ],
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
        hooks: [
          {
            hook: "15% de Bitcoin, 25% d'or. Deux valeurs refuges très différentes côte à côte, ça te paraît cohérent ?",
            intro: "L'un est censé protéger contre l'inflation, l'autre reste hyper spéculatif — pas le même pari du tout.",
          },
          {
            hook: "La ligne Bitcoin est passée à 15% par rapport au palier Défensif. Tu sens la différence de risque rien qu'à ce chiffre ?",
            intro: "La pire année passe de -8% à -17% — c'est le prix de cette montée en puissance.",
          },
        ],
        // Insertion oblig_etat_us + actions_value du 30/08/2026 : lignes réduites pour compenser =
        // CORPBOND_OPTIONS (25% -> 19%, seule autre poche obligataire, rôle le plus proche
        // d'oblig_etat_us) et WORLD_OPTIONS (35% -> 25%, rôle de contrepoids diversifié le plus
        // proche d'actions_value) — BITCOIN_OPTIONS (conviction centrale) et GOLD_OPTIONS
        // (protection) laissés intacts. Le palier Dynamique de ce profil n'a pas été touché par cette
        // insertion du 30/08/2026 (il a été révisé séparément le 14/09/2026, cf. plus bas).
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 25,
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
            id: "actions_value", pct: 10,
            pourquoi: [
              "Une diversification par le style plutôt que par la géographie, décorrélée de la conviction crypto.",
              "{pct}% pour équilibrer le socle diversifié avec une approche factorielle différente.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 19,
            pourquoi: [
              "Le stabilisateur obligataire, pour amortir une partie du choc si la crypto traverse une mauvaise année.",
              "Vient équilibrer la volatilité ajoutée par la ligne Bitcoin.",
            ],
          },
          {
            id: "oblig_etat_us", pct: 6,
            pourquoi: [
              "Une deuxième zone géographique pour le stabilisateur obligataire, hors zone euro.",
              "{pct}% pour diversifier la devise de la poche obligataire, sans en faire une ligne dominante.",
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
        hooks: [
          {
            hook: "19% de Bitcoin et 10% d'ETF à levier dans le même portefeuille. Tu cumulerais ces deux paris-là ?",
            intro: "Deux sources de volatilité différentes, empilées plutôt que choisies l'une contre l'autre.",
          },
          {
            hook: "-28% la pire année pour un Crypto-Curieux Dynamique. Ça reste dans tes clous ou c'est déjà trop ?",
            intro: "En échange, Bitcoin et le levier tech peuvent tirer la performance bien au-dessus d'un portefeuille classique.",
          },
        ],
        // Révisé le 14/09/2026 (audit "Ajustement Crypto-Curieux Dynamique") : Bitcoin 25% -> 19%
        // et LEVERAGE_OPTIONS 4% -> 10%, World/Nasdaq/Gold inchangés. Deux problèmes corrigés par le
        // même ajustement : (1) 9% de Bitcoin observé en tirage réel (jitter) ne justifiait plus
        // l'étiquette du profil — un plancher Bitcoin [15%, 30%] est désormais imposé après chaque
        // swap de jitter (cf. CRYPTO_CURIEUX_BITCOIN_BOUNDS dans engine.js), donc la base doit déjà
        // être strictement à l'intérieur ; (2) 4% de levier n'avait aucun impact narratif — un
        // plancher de 10% est imposé de la même façon (cf. la même fonction).
        // Choix du financement des +6pt de levier : réduire Bitcoin plutôt que World/Nasdaq/Gold.
        // Script de stress-test (toutes les combinaisons de idOptions, WORLD_OPTIONS x BITCOIN_OPTIONS
        // x NASDAQ100_OPTIONS x LEVERAGE_OPTIONS x GOLD_OPTIONS, 320 combos) : réduire World, Nasdaq
        // ou Gold pour financer le levier fait TOUJOURS dépasser le plancher de -30% (le pire cas
        // 2022 atteint jusqu'à -32,58%), parce que lqq/cl2 sont presque aussi négatifs que Bitcoin
        // cette année-là (lqq -59,2%, Bitcoin -64%, contre -14,72% pour le socle World et -0,4% pour
        // l'or) — déplacer du poids d'une ligne défensive vers le levier aggrave donc le pire
        // scénario bien plus qu'il ne le change en le déplaçant depuis Bitcoin, dont le rendement
        // 2022 est du même ordre. Résultat vérifié : pire cas -28,77% (contre -29,06% pour l'ancien
        // combo à 25%/4% — marge légèrement meilleure qu'avant, pas dégradée), confortablement sous
        // le plancher de -30% de ce palier, sur les 320 combos testés.
        assets: [
          {
            idOptions: WORLD_OPTIONS, pct: 35,
            pourquoi: [
              "Le socle diversifié, plus resserré que dans les versions moins risquées pour laisser de la place à la crypto.",
              "{pct}% pour garder un minimum de diversification malgré la conviction crypto affirmée.",
            ],
          },
          {
            idOptions: BITCOIN_OPTIONS, pct: 19,
            pourquoi: [
              "{pct}% : une conviction clairement affirmée, sur l'actif le plus volatil de la bibliothèque.",
              "Un cinquième du portefeuille sur un actif capable de perdre les deux tiers de sa valeur en un an.",
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
            // 4% -> 10% le 14/09/2026 : financé en réduisant Bitcoin (25% -> 19%) plutôt que
            // World/Nasdaq/Gold — cf. commentaire en tête de ce combo pour le détail du stress-test.
            // Pire scénario 2022 du combo complet vérifié sur les 320 combinaisons de idOptions :
            // -28,77%, sous le plancher de -30% de ce palier.
            idOptions: LEVERAGE_OPTIONS, pct: 10,
            pourquoi: [
              "{pct}% de levier actions, un poids qui pèse vraiment dans la performance du portefeuille tout en restant sous le plafond de perte de ce niveau de risque.",
              "Une vraie dose de levier, plus symbolique cette fois — {pct}% qui comptent réellement sur la trajectoire du portefeuille.",
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
        hooks: [
          {
            hook: "60% du portefeuille entre Bitcoin et Ethereum. Aucun or, aucun fonds euros pour amortir. Tu irais jusque-là ?",
            intro: "-52,4% la pire année : c'est le prix à payer pour ce niveau de conviction crypto.",
          },
          {
            hook: "Ni or, ni obligations, ni fonds euros — juste crypto, tech et émergents. Ça te semble être un vrai portefeuille ou un pari pur ?",
            intro: "Assumé comme un pari pur : ce palier n'a de toute façon aucun plancher de perte.",
          },
        ],
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
        hooks: [
          {
            hook: "35% sur un secteur unique, mais choisi parmi les plus calmes (santé, énergie, utilities...). Ça reste 'Thématique' à tes yeux ?",
            intro: "Oui, juste avec un secteur qui ne fait pas de vagues plutôt qu'un pari extrême.",
          },
          {
            hook: "-7,6% la pire année pour un portefeuille censé miser sur un secteur précis. Tu t'attendais à si peu de casse ?",
            intro: "C'est parce qu'à ce palier, le secteur tiré au sort reste toujours un des plus défensifs du lot.",
          },
        ],
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
        hooks: [
          {
            hook: "36% sur un secteur qui peut être aussi bien la santé que les semi-conducteurs. Tu prendrais ce pari sans savoir lequel à l'avance ?",
            intro: "25% d'or vient justement compenser le fait que le secteur tiré peut être un des plus volatils du lot.",
          },
          {
            hook: "8% du portefeuille en satellite Asie — Japon, Corée, Taïwan ou toute la zone. Tu savais que ce profil pouvait aller jusque-là ?",
            intro: "Une petite ligne, mais qui ajoute une vraie diversification géographique au pari sectoriel principal.",
          },
        ],
        // Insertion actions_japon du 30/08/2026 : ligne réduite pour compenser =
        // WORLD_OPTIONS (26% -> 14%), même rôle de "contrepoids diversifié" qu'une ligne
        // géographique ciblée comme actions_japon — CORPBOND_OPTIONS (stabilisateur) et
        // GOLD_OPTIONS (protection) laissés intacts, rôles distincts non substituables.
        // Insertion oblig_etat_us du 30/08/2026 (2e passe) : ligne réduite pour compenser =
        // CORPBOND_OPTIONS (13% -> 7%), seule autre poche obligataire du combo. Marge de plancher
        // déjà serrée sur ce combo (~1,7pt avant cette insertion, cf. historique git) : vérifié par
        // stress-test avant de pousser, toujours >0 après ajout (oblig_etat_us a un pire exercice
        // 2022 légèrement moins sévère que CORPBOND_OPTIONS, -12,6% contre -13,86%).
        // Élargissement actions_japon -> ASIA_OPTIONS du 08/09/2026 (demande utilisateur, cf.
        // theses.js pour la liste des 4 membres) : ligne réduite de 12% à 8% pour compenser, poids
        // reversé vers WORLD_OPTIONS (14% -> 18%, même rôle) — nécessaire car Corée/Taïwan (nouveaux
        // membres) ont un pire exercice 2022 bien plus sévère que le Japon seul (-29% contre -16%).
        // Marge déjà très serrée sur ce combo (cf. ci-dessus) : vérifié par script de stress-test sur
        // les 2 (secteur) x 2 (World) x 4 (Asie) = 16 combinaisons possibles avant de pousser — pire
        // cas (semi-conducteurs + Corée + FTSE All-World) à -19,34% en 2022, encore sous le plancher
        // de -20% mais avec une marge volontairement reconstituée (0,66pt) plutôt que de laisser le
        // poids d'origine (12%) ramener cette marge à 0,07pt (pire cas testé à -19,93%) — techniquement
        // toujours valide (le jitter revalide chaque swap et n'aurait jamais pu la faire dépasser),
        // mais une marge aussi fine aurait rendu ce combo trop fragile à la moindre future révision.
        assets: [
          {
            idOptions: THEME_OPTIONS_FULL, pct: 36,
            pourquoi: [
              "Le pari sectoriel central : {pct}% sur un seul secteur, la définition même d'une conviction assumée.",
              "La ligne la plus lourde du portefeuille — tout le reste existe pour l'accompagner.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 18,
            pourquoi: [
              "Le contrepoids diversifié, pour ne pas dépendre entièrement du secteur choisi.",
              "Vient équilibrer la conviction sectorielle avec une base plus large.",
            ],
          },
          {
            idOptions: ASIA_OPTIONS, pct: 8,
            pourquoi: [
              "Une deuxième source de diversification géographique, décorrélée du pari sectoriel comme du bloc World.",
              "{pct}% pour ne pas dépendre uniquement des États-Unis dans la partie diversifiée du portefeuille.",
            ],
          },
          {
            idOptions: CORPBOND_OPTIONS, pct: 7,
            pourquoi: [
              "Le stabilisateur obligataire, pour amortir une mauvaise année du secteur choisi.",
              "Nécessaire pour compenser la concentration du pari sectoriel à ce niveau de risque.",
            ],
          },
          {
            id: "oblig_etat_us", pct: 6,
            pourquoi: [
              "Une deuxième zone géographique pour le stabilisateur obligataire, hors zone euro.",
              "{pct}% pour diversifier la devise de la poche obligataire, sans en faire une ligne dominante.",
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
        hooks: [
          {
            hook: "55% du portefeuille sur un seul secteur, potentiellement les semi-conducteurs ou l'énergie propre. Ça te paraît raisonnable ?",
            intro: "20% d'or vient contrebalancer un pari sectoriel qui peut swinguer très fort dans les deux sens.",
          },
          {
            hook: "-22% la pire année, pour un portefeuille où plus de la moitié dépend d'un seul secteur. Tu resterais investi ?",
            intro: "C'est le compromis de ce palier : conviction sectorielle forte, mais jamais sans filet (l'or, le monde).",
          },
        ],
        // Insertion actions_value du 30/08/2026 : ligne réduite pour compenser = WORLD_OPTIONS
        // (25% -> 15%), même rôle de "contrepoids diversifié" — THEME_OPTIONS_AGGRESSIVE (pari
        // central) et GOLD_OPTIONS (protection) laissés intacts. Choisi sur ce palier plutôt que
        // sur Équilibré (déjà chargé, marge serrée) pour garder une marge confortable.
        assets: [
          {
            idOptions: THEME_OPTIONS_AGGRESSIVE, pct: 55,
            pourquoi: [
              "{pct}% sur un seul secteur : la conviction poussée nettement plus loin que dans les versions moins risquées.",
              "Plus de la moitié du portefeuille dépend désormais du même pari sectoriel.",
            ],
          },
          {
            idOptions: WORLD_OPTIONS, pct: 15,
            pourquoi: [
              "Le contrepoids diversifié, réduit par rapport aux versions moins risquées pour laisser de la place au pari sectoriel.",
              "La seule vraie diversification qui reste dans ce portefeuille très concentré.",
            ],
          },
          {
            id: "actions_value", pct: 10,
            pourquoi: [
              "Une diversification par le style plutôt que par le secteur, décorrélée du pari central.",
              "{pct}% pour ne pas dépendre uniquement du bloc World comme seule vraie diversification.",
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
        hooks: [
          {
            hook: "70% sur un seul secteur, plus 10% de levier en renfort. Un pari de cette taille, tu le ferais ?",
            intro: "Le reste du portefeuille n'existe que pour accompagner cette conviction, jamais pour la freiner.",
          },
          {
            hook: "-35% la pire année. C'est le prix d'un pari sectoriel poussé à l'extrême, sans aucun filet de sécurité. Ça te tente encore ?",
            intro: "Sans plancher de perte à ce palier, la conviction sectorielle est laissée totalement libre.",
          },
        ],
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
