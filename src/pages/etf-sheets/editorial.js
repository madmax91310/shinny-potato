import { getInstrumentFacts } from '../../data/instrument-facts.js'

// Intentions propres à chaque exposition ; les données financières restent dans le registre.
const GOALS = {
  gaming_vaneck: 'investir dans les entreprises du jeu vidéo et de l’eSport',
  medical_innovation_ishares: 'investir dans les entreprises de l’innovation médicale',
  acwi_imi_spdr: 'réunir développés, émergents et petites entreprises dans une seule ligne',
  pea_global_amundi: "réunir pays développés et émergents dans une seule ligne de ton PEA",
  "msci-world": "investir dans plusieurs pays développés, sans choisir les actions une par une",
  "support-msci_world": "investir dans plusieurs pays développés, sans choisir les actions une par une",
  "support-msci_world_ishares": "investir dans plusieurs pays développés, sans choisir les actions une par une",
  "sp500": "investir dans les actions américaines, sans sélectionner les entreprises une par une",
  "sp500-spea": "investir dans les actions américaines, sans sélectionner les entreprises une par une",
  "support-sp500_ishares": "investir dans les actions américaines, sans sélectionner les entreprises une par une",
  "nasdaq100": "suivre le Nasdaq-100, sans acheter ses entreprises une par une",
  "support-nasdaq100_ishares": "suivre le Nasdaq-100, sans acheter ses entreprises une par une",
  "eurostoxx50": "investir dans la zone euro, sans sélectionner les grandes entreprises une par une",
  "support-eurostoxx50_ishares": "investir dans la zone euro, sans sélectionner les grandes entreprises une par une",
  "msci-em": "investir dans les pays émergents, sans choisir un marché à la fois",
  "support-msci_em_amundi": "investir dans les pays émergents, sans choisir un marché à la fois",
  "support-ftse_em_vanguard": "investir dans les pays émergents, sans choisir un marché à la fois",
  "support-msci_em_spdr": "investir dans les pays émergents, sans choisir un marché à la fois",
  "msci-acwi": "réunir pays développés et émergents dans une seule ligne",
  "ftse-all-world": "réunir pays développés et émergents dans une seule ligne",
  "support-msci_acwi": "réunir pays développés et émergents dans une seule ligne",
  "russell2000_spdr": "suivre les petites entreprises américaines, sans construire ta propre sélection",
  "small-caps": "suivre les petites entreprises américaines, sans construire ta propre sélection",
  "sp500_equal_weight": "investir aux États-Unis avec le même poids pour chaque entreprise de l’indice",
  "world_ex_usa": "investir dans les pays développés en dehors des États-Unis",
  "monetaire-eur": "placer une partie de ton portefeuille sur le marché monétaire en euros",
  "obligations-etat-0-1": "investir dans des obligations d’État en euros à très courte échéance",
  "support-oblig_etat_eur_short": "investir dans des obligations d’État en euros à très courte échéance",
  "obligations-globales-eur": "réunir plusieurs marchés obligataires avec une couverture en euros",
  "obligations-inflation": "investir dans des obligations indexées sur l’inflation",
  "em-ex-chine": "investir dans les pays émergents en excluant la Chine",
  "inde": "investir en Inde, sans choisir les entreprises une par une",
  "infrastructures": "investir dans les infrastructures, sans sélectionner chaque entreprise",
  "topix-pea-hedged": "suivre les actions japonaises avec une couverture du change",
  "basic-resources-pea": "investir dans les entreprises de ressources naturelles, sans les choisir une par une",
  "semiconducteurs": "investir dans les semi-conducteurs, sans miser sur un seul fabricant",
  "sante-biotech": "investir dans la santé et les biotechnologies, sans sélectionner chaque entreprise",
  "support-sect_sante": "investir dans le secteur de la santé, sans choisir les actions une par une",
  "energie": "investir dans le secteur de l’énergie, sans choisir les actions une par une",
  "support-sect_energie": "investir dans le secteur de l’énergie, sans choisir les actions une par une",
  "defense": "investir dans la défense, sans miser sur une seule entreprise",
  "cybersecurite": "investir dans la cybersécurité, sans choisir les actions une par une",
  "support-sect_cybersecurite": "investir dans la cybersécurité, sans choisir les actions une par une",
  "eau": "investir dans les entreprises liées à l’eau, sans les sélectionner une par une",
  "luxe": "investir dans le luxe, sans choisir les marques une par une",
  "financieres": "investir dans le secteur financier, sans sélectionner chaque banque ou assureur",
  "support-sect_financieres": "investir dans le secteur financier, sans sélectionner chaque banque ou assureur",
  "immobilier-reit": "investir dans l’immobilier coté, sans acheter les foncières une par une",
  "support-foncieres_etf": "investir dans l’immobilier coté, sans acheter les foncières une par une",
  "support-immo_gpr": "investir dans l’immobilier coté, sans acheter les foncières une par une",
  "support-foncieres_etf_dist": "recevoir les distributions d’un fonds d’immobilier coté",
  "technologie": "investir dans la technologie, sans choisir les actions une par une",
  "support-sect_tech": "investir dans la technologie, sans choisir les actions une par une",
  "quantique": "investir dans les entreprises liées au quantique, sans miser sur une seule",
  "robotique": "investir dans la robotique, sans choisir les entreprises une par une",
  "blockchain": "investir dans les entreprises liées à la blockchain, sans les sélectionner une par une",
  "nucleaire": "investir dans la filière nucléaire, sans choisir les entreprises une par une",
  "batteries-ve": "investir dans les batteries et les véhicules électriques, sans sélectionner chaque entreprise",
  "spatial": "investir dans les activités spatiales, sans miser sur une seule entreprise",
  "dividendes": "suivre une sélection d’actions à dividendes, sans composer toi-même le portefeuille",
  "support-strat_dividendes_dist": "suivre une sélection d’actions à dividendes, sans composer toi-même le portefeuille",
  "support-dividend_leaders": "suivre une sélection d’actions à dividendes, sans composer toi-même le portefeuille",
  "support-high_dividend": "investir dans des actions à dividendes élevés avec des revenus réinvestis",
  "support-high_dividend_dist": "recevoir les distributions d’une sélection d’actions à dividendes élevés",
  "support-quality_dividend": "associer critères de qualité et dividendes avec des revenus réinvestis",
  "support-quality_dividend_dist": "recevoir les distributions d’actions sélectionnées pour leur qualité et leurs dividendes",
  "covered-call": "comprendre comment une stratégie d’options couvertes produit des revenus",
  "low-volatility": "suivre des actions sélectionnées pour leur plus faible volatilité",
  "value": "investir dans des actions sélectionnées selon des critères de valorisation",
  "quality": "suivre des entreprises sélectionnées selon des critères de qualité",
  "momentum": "suivre une sélection d’actions fondée sur leur dynamique de cours",
  "or": "t’exposer au cours de l’or, sans stocker toi-même des lingots",
  "support-or": "t’exposer au cours de l’or, sans stocker toi-même des lingots",
  "support-or_wisdomtree": "t’exposer au cours de l’or, sans stocker toi-même des lingots",
  "support-or_amundi": "t’exposer au cours de l’or, sans stocker toi-même des lingots",
  "bitcoin": "t’exposer au bitcoin depuis un compte-titres, sans gérer toi-même un portefeuille crypto",
  "support-bitcoin_wisdomtree": "t’exposer au bitcoin depuis un compte-titres, sans gérer toi-même un portefeuille crypto",
  "support-bitcoin_etcgroup": "t’exposer au bitcoin depuis un compte-titres, sans gérer toi-même un portefeuille crypto",
  "support-bitcoin_21shares": "t’exposer au bitcoin depuis un compte-titres, sans gérer toi-même un portefeuille crypto",
  "obligations-etat": "investir dans des obligations d’État, sans choisir chaque émission",
  "high-yield": "investir dans des obligations à haut rendement, sans choisir chaque émetteur",
  "support-oblig_hy_amundi": "investir dans des obligations à haut rendement, sans choisir chaque émetteur",
  "high-yield-acc": "investir dans des obligations à haut rendement avec les revenus réinvestis",
  "corp-bond-ig": "investir dans des obligations d’entreprises bien notées, sans choisir chaque émission",
  "support-oblig_corp_amundi": "investir dans des obligations d’entreprises bien notées, sans choisir chaque émission",
  "support-oblig_corp_vanguard": "investir dans des obligations d’entreprises bien notées, sans choisir chaque émission",
  "support-oblig_corp_spdr": "investir dans des obligations d’entreprises bien notées, sans choisir chaque émission",
  "em-local-bond": "investir dans la dette émergente en devises locales",
  "oblig_em_usd_ishares": "investir dans la dette émergente libellée en dollars",
  "oblig_eur_long_ishares": "investir dans des obligations en euros à longue échéance",
  "support-lqq": "comprendre une exposition au Nasdaq-100 avec un levier quotidien de deux",
  "support-cl2": "comprendre une exposition aux actions américaines avec un levier quotidien de deux",
  "support-cac40": "suivre le CAC 40, sans acheter ses entreprises une par une",
  "support-msci_europe": "investir dans les actions européennes, sans choisir les entreprises une par une",
  "support-argent": "t’exposer au cours de l’argent, sans stocker toi-même le métal",
  "support-mp_large": "réunir plusieurs matières premières dans une seule ligne",
  "support-mp_large_icom": "réunir plusieurs matières premières dans une seule ligne",
  "support-ethereum": "t’exposer à l’ether depuis un compte-titres, sans gérer toi-même un portefeuille crypto",
  "support-tech_europe": "investir dans la technologie européenne, sans sélectionner chaque entreprise",
  "support-smallcap_europe": "investir dans les petites entreprises européennes, sans les sélectionner une par une",
  "support-sect_energie_propre": "investir dans les énergies propres, sans miser sur une seule entreprise",
  "support-sect_conso_defensive": "investir dans la consommation de base, sans choisir les actions une par une",
  "support-sect_utilities": "investir dans les services aux collectivités, sans choisir chaque entreprise",
  "support-oblig_etat_us": "investir dans des obligations d’État américaines, sans choisir chaque émission",
  "support-actions_japon": "investir au Japon, sans choisir les actions une par une",
  "support-actions_coree": "investir en Corée du Sud, sans choisir les actions une par une",
  "support-actions_taiwan": "investir à Taïwan, sans choisir les actions une par une",
  "support-actions_asie_ex_japon": "investir en Asie en dehors du Japon, sans sélectionner chaque entreprise",
}

const OVERRIDES = {
  'msci-em': {
    hook: 'Un ETF World couvre beaucoup de pays, mais les marchés émergents n’en font pas partie. Cet ETF permet de leur faire une place dans ton portefeuille 👇',
    whyInteresting: 'Tu ajoutes des entreprises de pays absents du MSCI World, avec aussi des petites capitalisations.\n\nCe que je trouve intéressant ici, c’est de pouvoir choisir la place des émergents dans le portefeuille. Cela élargit l’exposition, mais les risques politiques et les variations des monnaies restent à prendre en compte.',
  },
  'covered-call': {
    hook: 'Recevoir de l’argent chaque mois avec un ETF, ça peut donner envie. Avec ce fonds, ces distributions viennent d’une stratégie qui limite aussi une partie de la hausse du Nasdaq-100 👇',
    whyInteresting: 'Cette stratégie vise des versements réguliers, ce qui peut intéresser quelqu’un qui cherche des revenus.\n\nPour ma part, je regarde aussi ce que devient la valeur des parts. Les sommes reçues comptent, mais c’est en les ajoutant à cette évolution qu’on peut comparer le résultat à celui d’un ETF Nasdaq-100 classique.',
  },
  'monetaire-eur': {
    hook: 'Tu as peut-être déjà croisé XEON en cherchant où placer des euros sur ton compte-titres. Son rendement suit les taux au jour le jour : voici comment cet ETF fonctionne 👇',
    whyInteresting: 'Le rendement vient des taux courts en euros. Les revenus restent investis dans le fonds, puisque cette part est capitalisante.\n\nC’est surtout ce lien avec les taux que je retiens : si ceux-ci baissent, le rendement du placement baisse aussi.',
  },
  ia: {
    hook: '🤖 Quand on parle d’investissement dans l’IA, on pense souvent aux fabricants de puces. Cet ETF va aussi chercher du côté des logiciels et des applications 👇',
    whatIs: 'Cet ETF suit un indice qui sélectionne des entreprises liées à plusieurs activités de l’intelligence artificielle : infrastructures, logiciels et applications.\n\nIl ne se limite donc pas aux fabricants de puces ou aux entreprises qui développent des modèles d’IA.',
    whyInteresting: 'Tu réunis plusieurs activités liées à l’IA dans une seule ligne.\n\nC’est ce qui m’intéresse ici : comprendre quelles entreprises le fonds retient derrière ce thème très large. Deux ETF portant « IA » dans leur nom ne proposent pas forcément la même exposition.\n\nLa sélection dépend des règles de l’indice : toutes les entreprises associées à l’IA ne sont pas forcément présentes.',
    whatToKnow: 'Le développement de l’IA ne garantit pas la hausse des actions de ces entreprises.\n\nTu peux aussi détenir certaines de ces sociétés dans ton ETF World ou technologique. Ajouter ce fonds peut renforcer une exposition que tu as déjà.',
    verdict: 'L&G Artificial Intelligence rassemble plusieurs métiers liés à l’IA. Pour comprendre ce que tu achètes, regarde les entreprises détenues et leur poids, au-delà du nom du thème.',
    question: 'Tu voudrais investir dans toute la chaîne de l’IA ou privilégier une activité précise ?',
  },
  'msci-world': {
    hook: '🌍 Investir dans plusieurs pays avec une seule ligne dans ton PEA, c’est ce que permet cet ETF World 👇',
    whatIs: 'Cet ETF suit le MSCI World : de grandes et moyennes entreprises de pays développés, dans plusieurs secteurs.\n\nLes entreprises ayant les plus grosses capitalisations occupent le plus de place. Les États-Unis et leurs grands groupes pèsent donc fortement dans cette exposition.',
    whyInteresting: 'Tu suis de grandes et moyennes entreprises de pays développés, sans sélectionner les actions une par une.\n\nCe que j’apprécie dans cette approche, c’est de ne pas avoir à deviner quelles entreprises feront les meilleures performances. En revanche, les émergents et les petites capitalisations restent en dehors.\n\nLa réplication synthétique permet de rendre cette exposition accessible dans un PEA.',
    whatToKnow: 'Le MSCI World n’inclut ni les marchés émergents ni les petites capitalisations.\n\nDétenir beaucoup d’entreprises ne signifie pas que chaque pays a le même poids. Et cet ETF reste exposé aux baisses des marchés actions.',
    verdict: 'Amundi PEA Monde permet de suivre le MSCI World dans ton PEA. Si tu veux aussi des émergents ou des petites capitalisations, ces expositions sont à chercher ailleurs.',
    question: 'Dans ton PEA, tu gardes un World seul ou tu ajoutes d’autres expositions à côté ?',
  },
}

// Explications propres aux expositions ; aucun chiffre de marché figé dans la copie.
const EXPOSURE_COPY = {
  'basic-resources-pea': {
    hook: '⛏️ Investir dans les ressources naturelles, ça peut aussi passer par les entreprises qui les produisent.\n\nCet ETF éligible au PEA permet de s’y exposer en une seule ligne 👇',
    whatIs: 'L’indice regroupe les entreprises du secteur des ressources de base présentes dans le STOXX Europe 600. Tu investis dans leurs actions : leur activité peut s’étendre bien au-delà de l’Europe.',
    whyInteresting: 'Tu réunis ces entreprises dans une seule ligne de ton PEA, sans les sélectionner une par une.\n\nQuand le prix de leurs matières premières augmente, leurs revenus peuvent en profiter. Mais si leurs coûts d’énergie ou d’exploitation augmentent aussi, leurs bénéfices ne suivent pas forcément.',
    whatToKnow: 'La sélection se concentre sur un seul secteur, sensible aux prix des matières premières et au cycle industriel.\n\nSi tu détiens déjà un ETF Europe large, certaines de ces entreprises peuvent être présentes dans ton portefeuille. Ajouter cet ETF revient alors à renforcer leur poids.',
    closing: 'Tu investis donc dans des producteurs, avec leurs coûts et leurs marges. C’est une exposition différente d’un ETC qui suit le cours d’un métal.',
    question: 'Tu as déjà un ETF sectoriel dans ton portefeuille ?',
  },
  semiconducteurs: {
    hook: '💻 Les puces sont présentes dans les ordinateurs, les voitures et les centres de données.\n\nCet ETF permet de s’exposer aux entreprises des semi-conducteurs en une seule ligne 👇',
    whyInteresting: 'Tu réunis plusieurs entreprises du secteur sans devoir sélectionner un seul fabricant.\n\nLeurs résultats dépendent aussi des commandes, des stocks et des investissements : une hausse de la demande ne profite pas forcément à toutes au même moment.',
    whatToKnow: 'La sélection reste concentrée sur une industrie. Un ralentissement des commandes ou des restrictions commerciales peut peser sur plusieurs entreprises à la fois.\n\nSi tu détiens déjà un ETF World ou technologique, certaines de ces sociétés peuvent être présentes. Cette ligne renforce alors leur poids.',
    question: 'Tu as une ligne dédiée aux semi-conducteurs ou tu les gardes dans tes ETF plus larges ?',
  },
  cybersecurite: {
    hook: '🔐 Protéger les données et les réseaux, c’est aussi l’activité d’entreprises cotées.\n\nCet ETF permet de s’y exposer en une seule ligne 👇',
    whyInteresting: 'Tu réunis plusieurs entreprises de sécurité numérique sans les choisir une par une.\n\nLe besoin de protéger les systèmes explique leur activité. Leurs profits dépendent aussi de la concurrence, des contrats remportés et du coût de développement de leurs produits.',
    whatToKnow: 'La croissance des besoins de cybersécurité ne garantit pas la hausse de ces actions. Les attentes peuvent déjà être intégrées dans leurs cours.\n\nCertaines entreprises peuvent aussi être présentes dans tes ETF mondiaux ou technologiques : ajouter cette ligne augmente alors leur poids.',
    question: 'Tu as déjà un ETF thématique dans ton portefeuille ?',
  },
}

export function getPresentationCopy(etf) {
  const type = getInstrumentFacts(etf.isin).instrumentType
  const kind = type === 'ETC' || /\bETC\b/.test(etf.name) ? 'l’ETC' : type === 'ETN' || /\bETP\b/.test(etf.name) ? 'l’ETP' : 'l’ETF'
  const goal = GOALS[etf.id]
  const access = etf.pea === true && kind === 'l’ETF' ? ' éligible au PEA' : ''
  const support = kind === 'l’ETC' ? 'Cet ETC' : kind === 'l’ETP' ? 'Cet ETP' : 'Cet ETF'
  const hook = goal ? `Tu veux ${goal} ?\n\n${support}${access} permet de s’y exposer en une seule ligne 👇` : etf.hook
  const exposureId = etf.id === 'support-sect_cybersecurite' ? 'cybersecurite' : etf.id
  const copy = { ...etf, hook, ...OVERRIDES[etf.id], ...EXPOSURE_COPY[exposureId] }
  const question = copy.question.startsWith('Pour cette exposition, tu regardes')
    ? ['Sectoriels classiques', 'Thématiques émergentes'].includes(copy.category)
      ? 'Tu as déjà un ETF sectoriel ou thématique dans ton portefeuille ?'
      : copy.category === 'Obligataires'
        ? 'Dans tes ETF obligataires, tu regardes surtout la durée ou la qualité des emprunteurs ?'
        : 'Tu détiens déjà cette exposition dans ton portefeuille ?'
    : copy.question
  return { ...copy, question, aum: copy.aum.replace(/^(?:Part|Fonds)\s*:\s*/, '') }
}

export function presentationTicker(etf) {
  return etf.isin === 'FR001400U5Q4' ? '' : etf.listing?.ticker ?? ''
}
