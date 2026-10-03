// Constructions : les rendements, noms et instruments restent dans la banque commune.
// Deux nouvelles structures par couple, en complément de sa construction historique.
import {
  PROFILES, GOLD_OPTIONS as GOLD, BITCOIN_OPTIONS as BTC,
  CORPBOND_OPTIONS as CORP, EM_OPTIONS as EM, DIVIDEND_OPTIONS_DIST as DIV,
  HIGHYIELD_OPTIONS as HY, COMMODITY_OPTIONS as MP,
  EUROSTOXX50_OPTIONS as EURO, THEME_OPTIONS_CALM, THEME_OPTIONS_FULL,
  THEME_OPTIONS_AGGRESSIVE, LEVERAGE_OPTIONS as LEVER,
} from './theses.js';

const WORLD = ['msci_world', 'msci_world_ishares', 'msci_world_amundi_pea'];
const ALLWORLD = ['ftse_allworld_vanguard', 'msci_acwi', 'msci_acwi_ishares'];
const SHORT = ['monetaire_xeon', 'oblig_0_1_ishares'];
const rows = (...pairs) => pairs.map(([ids, pct]) => ({
  ...(Array.isArray(ids) ? { idOptions: ids } : { id: ids }), pct,
  // Préserve le rôle de chaque poche lors des variations de pondération.
  minPct: Math.max(5, pct - 25), maxPct: Math.min(100, pct + 25),
}));
const recipe = (id, label, description, hook, assets) => ({ id, label, description, hook, assets });
const R = recipe;
const A = rows;

const additions = {
  generaliste: {
    prudent: [
      R('monde-simple', 'Monde et socle stable', 'Une poche mondiale complète un socle de fonds euros et de supports à échéance courte.', 'Faut-il multiplier les lignes pour commencer à diversifier son épargne ?', A(['fonds_euros',65],[SHORT,20],[ALLWORLD,15])),
      R('developpes-emergents', 'Développés et émergents', 'Les marchés développés et émergents ont chacun leur ligne, avec une majorité de supports stabilisateurs.', 'Les émergents ont-ils leur place dans un portefeuille prudent ?', A(['fonds_euros',60],[SHORT,20],[WORLD,15],[EM,5])),
    ],
    defensif: [
      R('monde-simple', 'Monde et obligations', 'Un indice mondial large, une poche obligataire et le fonds euros suffisent à organiser cette construction.', 'Trois lignes suffisent-elles pour répartir le risque ?', A(['fonds_euros',40],[CORP,30],[ALLWORLD,30])),
      R('capitalisations', 'Grandes et petites entreprises', 'Les petites capitalisations complètent les grandes entreprises mondiales, avec un socle de supports stabilisateurs.', 'Pourquoi laisser les petites entreprises hors du portefeuille ?', A(['fonds_euros',40],[SHORT,25],[WORLD,25],['smallcap_monde',10])),
    ],
    equilibre: [
      R('developpes-emergents', 'Développés, émergents et obligations', 'Les actions sont réparties entre développés et émergents ; les obligations constituent le reste.', 'Un World couvre-t-il vraiment tous les marchés ?', A([WORLD,50],[EM,15],[CORP,35])),
      R('capitalisations', 'Grandes et petites entreprises avec or', 'Les tailles d’entreprises sont séparées, avec de l’or et des supports courts pour diversifier les moteurs.', 'Grandes ou petites entreprises : pourquoi choisir un seul camp ?', A([WORLD,45],['smallcap_monde',15],[SHORT,20],[GOLD,20])),
    ],
    dynamique: [
      R('actions-mondiales', 'Actions mondiales sans levier', 'Le socle développé est complété par les émergents et petites capitalisations, avec une poche d’or.', 'Peut-on construire un portefeuille dynamique sans levier ?', A([WORLD,50],[EM,20],['smallcap_monde',15],[GOLD,15])),
      R('monde-qualite', 'Monde et biais qualité', 'Le biais qualité est une conviction distincte du socle mondial, avec des émergents et des obligations.', 'Ajouter un filtre qualité au World : conviction utile ou doublon ?', A([WORLD,40],['world_quality_ishares',20],[EM,20],[CORP,20])),
    ],
    offensif: [
      R('actions-globales', 'Actions mondiales toutes capitalisations', 'Une construction entièrement en actions, répartie entre marchés développés, émergents et petites entreprises.', 'Tout miser sur les actions oblige-t-il à tout miser sur la tech ?', A([WORLD,55],[EM,25],['smallcap_monde',20])),
      R('monde-momentum', 'Monde et biais momentum', 'Le momentum complète un socle mondial ; les petites capitalisations ajoutent une autre exposition.', 'Suivre les gagnants récents : quelle place donner au momentum ?', A([ALLWORLD,50],['world_momentum_ishares',30],['smallcap_monde',20])),
    ],
  },
  rentier: {
    prudent: [
      R('dividendes-obligations', 'Dividendes et coupons', 'Les dividendes et coupons complètent une poche de fonds euros. Les versements restent variables.', 'Chercher du revenu oblige-t-il à prendre beaucoup de risque ?', A(['fonds_euros',65],[DIV,15],[HY,20])),
      R('loyers-coupons', 'Loyers et coupons', 'Le fonds euros accompagne deux sources de revenu : SCPI et obligations à haut rendement.', 'Des loyers et des coupons : que risque-t-on derrière ces revenus ?', A(['fonds_euros',65],['scpi',20],[HY,15])),
    ],
    defensif: [
      R('dividendes-coupons', 'Dividendes sans immobilier', 'Les distributions reposent sur les actions à dividendes et obligations, sans poche immobilière.', 'Un portefeuille de revenus peut-il se passer d’immobilier ?', A(['fonds_euros',45],[DIV,30],[HY,25])),
      R('immobilier-dividendes', 'Immobilier et dividendes', 'Les SCPI et actions à dividendes apportent des revenus différents, autour d’un socle de fonds euros.', 'Loyers ou dividendes : pourquoi opposer les deux ?', A(['fonds_euros',50],['scpi',20],[DIV,30])),
    ],
    equilibre: [
      R('dividendes-obligations', 'Dividendes et obligations', 'Les actions à dividendes sont accompagnées de coupons en euros et en dollars, sans stratégie d’options.', 'Du revenu sans immobilier ni options : à quoi ressemble le portefeuille ?', A([DIV,50],[HY,30],['oblig_etat_us',20])),
      R('revenus-diversifies', 'Revenus diversifiés', 'Les dividendes, immobilier coté, SCPI et coupons répartissent les sources de revenu.', 'Quatre sources de revenus : est-ce aussi quatre risques différents ?', A([DIV,40],['foncieres_etf_dist',25],['scpi',20],[HY,15])),
    ],
    dynamique: [
      R('dividendes-immobilier', 'Dividendes et immobilier sans options', 'La recherche de revenu repose sur les actions et immobilier coté, avec une poche obligataire.', 'Faut-il des options pour construire un portefeuille de revenus dynamique ?', A([DIV,55],['foncieres_etf_dist',30],[HY,15])),
      R('options-complement', 'Options en complément', 'Les options restent une source de distributions complémentaire aux dividendes et aux coupons.', 'Un revenu mensuel attire, mais quelle place donner aux options ?', A([DIV,40],['qyld_ucits',25],[HY,20],['oblig_etat_us',15])),
    ],
    offensif: [
      R('revenus-actions', 'Dividendes et deux formes d’immobilier', 'Les dividendes, immobilier coté et SCPI répartissent les revenus entre trois poches ; chacune expose à une perte en capital.', 'Immobilier coté et SCPI : que change leur association avec les dividendes ?', A([DIV,50],['foncieres_etf_dist',35],['scpi',15])),
      R('options-dividendes', 'Options, dividendes et coupons', 'Les options et dividendes sont accompagnés d’obligations américaines distribuantes ; les versements restent variables.', 'Des distributions élevées valent-elles une hausse potentiellement plafonnée ?', A(['qyld_ucits',45],[DIV,40],['oblig_etat_us',15])),
    ],
  },
  pro_europe: {
    prudent: [
      R('europe-large', 'Europe large et dette courte', 'La dette européenne courte est accompagnée d’actions européennes larges et de fonds euros.', 'Investir en Europe sans faire des actions le moteur principal : quel compromis ?', A(['oblig_etat_eur_short',65],['msci_europe',15],['fonds_euros',20])),
      R('europe-petites', 'Petites entreprises et dette courte', 'Une petite poche de petites capitalisations européennes complète les grandes et la dette courte.', 'Les petites entreprises européennes ont-elles une place dans une allocation prudente ?', A(['oblig_etat_eur_short',65],[EURO,10],['smallcap_europe',5],['fonds_euros',20])),
    ],
    defensif: [
      R('europe-large', 'Europe large et stabilisateurs', 'Un indice européen large et la dette courte constituent ensemble la majorité du portefeuille.', 'Miser sur l’Europe oblige-t-il à choisir le CAC 40 ?', A(['msci_europe',35],['oblig_etat_eur_short',40],['fonds_euros',25])),
      R('europe-tailles', 'Europe de toutes tailles', 'Les grandes et petites entreprises européennes sont séparées, aux côtés de la dette courte.', 'L’Europe des grandes entreprises raconte-t-elle toute l’histoire ?', A([EURO,25],['smallcap_europe',15],['oblig_etat_eur_short',35],['fonds_euros',25])),
    ],
    equilibre: [
      R('europe-large', 'Europe large avec dette courte', 'Une seule ligne actions européenne large accompagne la dette courte, les fonds euros et l’or.', 'Une seule ligne actions pour miser sur l’Europe : suffisant ?', A(['msci_europe',50],['oblig_etat_eur_short',25],['fonds_euros',15],[GOLD,10])),
      R('europe-petites', 'Grandes et petites entreprises européennes', 'La conviction européenne se répartit entre grandes et petites entreprises, avec des stabilisateurs.', 'Petites entreprises ou grands groupes européens : pourquoi choisir ?', A([EURO,40],['smallcap_europe',30],['fonds_euros',20],[GOLD,10])),
    ],
    dynamique: [
      R('europe-tailles', 'Europe sans biais sectoriel', 'Le marché européen large et ses petites entreprises portent la conviction, sans poche technologique dédiée.', 'Un portefeuille européen dynamique a-t-il besoin d’un pari technologique ?', A(['msci_europe',50],['smallcap_europe',25],[GOLD,25])),
      R('europe-tech', 'Europe et conviction technologique', 'La technologie européenne complète le marché large, avec dette courte et or.', 'La tech européenne mérite-t-elle sa propre ligne ?', A(['msci_europe',40],['tech_europe',30],['oblig_etat_eur_short',15],[GOLD,15])),
    ],
    offensif: [
      R('europe-actions', 'Europe entièrement en actions', 'Le marché européen large et les petites capitalisations portent toute l’allocation.', 'Tout en actions européennes : jusqu’où assumer cette conviction ?', A(['msci_europe',60],['smallcap_europe',40])),
      R('europe-tech-large', 'Technologie et grandes entreprises européennes', 'La technologie européenne constitue une conviction importante aux côtés des grandes entreprises.', 'Une conviction européenne peut-elle devenir trop dépendante de la tech ?', A([EURO,45],['tech_europe',40],['smallcap_europe',15])),
    ],
  },
  anti_inflation: {}, bouclier: {}, crypto_curieux: {}, thematique: {},
};

// Les expositions réelles conservent des rôles distincts, sans promesse de couverture.
for (const [risk, weights] of Object.entries({
  prudent: [45,20,10,25], defensif: [40,25,15,20], equilibre: [40,30,20,10],
  dynamique: [35,35,30,0], offensif: [40,20,40,0],
})) {
  const [inflation,gold,commodity,euros] = weights;
  additions.anti_inflation[risk] = [
    R('obligations-indexees', 'Obligations indexées et actifs réels', 'Les obligations indexées sont associées à l’or et, selon le palier, à d’autres supports. Les taux peuvent peser sur leur cours.', 'Des obligations indexées protègent-elles de toutes les conséquences de l’inflation ?', risk === 'prudent' ? A(['oblig_inflation',50],[GOLD,25],['fonds_euros',25]) : ['defensif','dynamique'].includes(risk) ? A(['oblig_inflation',inflation+commodity],[GOLD,gold],...(euros ? [['fonds_euros',euros]] : [])) : A(['oblig_inflation',inflation],[GOLD,gold],[MP,commodity],...(euros ? [['fonds_euros',euros]] : []))),
    R('metaux', 'Métaux et obligations indexées', 'L’or et l’argent remplacent le panier large de matières premières, avec des obligations indexées et éventuellement un fonds euros.', 'Or et argent face à l’inflation : diversification ou pari sur les métaux ?', A([GOLD,gold+commodity-5],['argent',5],['oblig_inflation',inflation],...(euros ? [['fonds_euros',euros]] : []))),
  ];
}
for (const [risk, w] of Object.entries({prudent:[65,20,15],defensif:[45,25,30],equilibre:[25,25,50]})) {
  additions.bouclier[risk] = [
    R('obligations-courtes', 'Fonds euros et obligations courtes', 'Le socle stable accompagne une poche actions mondiale ; les supports courts limitent la sensibilité aux taux.', 'Une petite poche actions peut-elle suffire à faire travailler le portefeuille ?', A(['fonds_euros',w[0]],[SHORT,w[1]],[WORLD,w[2]])),
    R('volatilite-reduite', 'Actions à volatilité réduite et or', 'Les actions à volatilité réduite complètent les fonds euros et l’or ; elles restent exposées aux baisses.', 'Des actions moins volatiles : jusqu’où peut-on compter sur ce filtre ?', A(['fonds_euros',w[0]],['world_minvol_ishares',w[2]],[GOLD,w[1]])),
  ];
}
for (const [risk, w] of Object.entries({defensif:[55,10,20,15],equilibre:[25,15,40,20],dynamique:[0,20,60,20],offensif:[0,40,45,15]})) {
  const [euros,btc,world,gold] = w;
  additions.crypto_curieux[risk] = [
    R('monde-bitcoin', 'Monde et Bitcoin sans levier', 'Un socle mondial et une poche Bitcoin forment le cœur de cette construction ; les stabilisateurs dépendent du palier.', 'Ajouter Bitcoin au World : quelle place laisser au reste ?', risk === 'defensif' ? A(['fonds_euros',65],[BTC,10],[WORLD,25]) : risk === 'equilibre' ? A([WORLD,50],[BTC,15],[SHORT,35]) : risk === 'dynamique' ? A([WORLD,65],[BTC,20],[GOLD,15]) : A([WORLD,60],[BTC,40])),
    R('crypto-stabilisateurs', 'Crypto et plusieurs stabilisateurs', 'Bitcoin est accompagné d’actions à volatilité réduite, de supports courts et d’or ; la poche crypto reste risquée.', 'Bitcoin entouré de stabilisateurs : où se concentre encore le risque ?', A(...(euros ? [['fonds_euros',euros]] : []),[BTC,btc],['world_minvol_ishares',world-10],[SHORT,10],[GOLD,gold])),
  ];
}
for (const [risk, w] of Object.entries({defensif:[35,30,25,10],equilibre:[35,35,15,15],dynamique:[55,20,10,15],offensif:[70,15,5,10]})) {
  const [theme,world,bond,gold] = w;
  const themes = risk === 'defensif' ? THEME_OPTIONS_CALM : risk === 'equilibre' ? THEME_OPTIONS_FULL : THEME_OPTIONS_AGGRESSIVE;
  additions.thematique[risk] = [
    R('theme-stabilisateurs', 'Thème, obligations et or', 'La conviction sectorielle garde une place centrale, avec un socle mondial, des supports courts et de l’or.', 'Une conviction forte : que doit faire le reste du portefeuille ?', A([themes,theme],[WORLD,world],[SHORT,bond],[GOLD,gold])),
    R('theme-geographies', 'Thème et diversification géographique', 'La conviction sectorielle est entourée de marchés développés et émergents, avec une poche d’or.', 'Un thème mondial suffit-il à diversifier les pays du portefeuille ?', A([themes,theme],[WORLD,risk === 'equilibre' ? world-10 : world],[EM,risk === 'defensif' ? 10 : bond],...(risk === 'defensif' ? [[SHORT,bond-10]] : []),[GOLD,risk === 'equilibre' ? gold+10 : gold])),
  ];
}

function protectSlots(assets, profileId) {
  return assets.map((slot, index) => {
    const options = slot.idOptions ?? [slot.id];
    const fixed = options.some(id => LEVER.includes(id)) || (profileId === 'thematique' && index === 0);
    return fixed ? { ...slot, minPct: slot.pct, maxPct: slot.pct } : slot;
  });
}

export function getRecipes(profileId, riskId) {
  const base = PROFILES.find(p => p.id === profileId)?.riskCombos[riskId];
  if (!base) return [];
  // Une ligne World ne devient plus implicitement ACWI, Quality ou Momentum.
  // Les nouveaux biais factoriels et petites capitalisations ont leurs propres recettes.
  const assets = base.assets.map(slot => {
    let options = slot.idOptions;
    if (options?.includes('msci_world')) options = WORLD;
    if (options?.includes('msci_em')) options = EM;
    if (options?.includes('oblig_corp_ig')) options = CORP;
    return { ...slot, ...(options ? { idOptions: options } : {}),
      minPct: Math.max(5, slot.pct - 25), maxPct: Math.min(100, slot.pct + 25) };
  });
  return [
    { ...base, id: 'historique', label: 'Construction historique', assets: protectSlots(assets, profileId) },
    ...additions[profileId][riskId].map(r => ({ ...r, assets: protectSlots(r.assets, profileId) })),
  ];
}

export function withinRecipe(selection, recipe) {
  return selection.every((s, i) => s.pct >= recipe.assets[i].minPct && s.pct <= recipe.assets[i].maxPct);
}
