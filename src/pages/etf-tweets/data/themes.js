let uid = 0
function nextId(prefix) {
  uid += 1
  return `${prefix}-${uid}-${Date.now().toString(36)}`
}

export function createEtf(overrides = {}) {
  return {
    id: nextId('etf'),
    nom: '',
    isin: '',
    frais: '',
    encours: '',
    differenciateur: '',
    ...overrides,
  }
}

export function createTheme(overrides = {}) {
  return {
    id: '',
    nom: '',
    emoji: '📊',
    hookAction: '',
    hookDilemme: '',
    transition: '',
    etfs: [],
    cloture: '',
    ctaEngagement: 'Le tien, c’est lequel ? Dis-le en commentaire 👇',
    ctaPartage: 'Repartage ce tweet à quelqu’un qui débute en bourse 🔁',
    eligibilite: '',
    mentionReglementaire: 'Pas un conseil en investissement.',
    ...overrides,
  }
}

// Données ETF vérifiées par recherche web (ISIN / TER / encours), état mi-août 2026.
// Les encours évoluent en continu : à revérifier sur justETF.com avant publication
// si le tweet sort plusieurs semaines après la dernière mise à jour de ce fichier.
export const DEFAULT_THEMES = [
  createTheme({
    id: 'monde',
    nom: 'Monde',
    emoji: '🌍',
    hookAction: 'investir sur les plus grandes entreprises mondiales',
    hookDilemme: 'quel ETF World choisir',
    transition:
      'Il existe plusieurs ETF pour capter la croissance mondiale. Voici 4 références à connaître :',
    etfs: [
      createEtf({
        nom: 'iShares Core MSCI World UCITS ETF',
        isin: 'IE00B4L5Y983',
        frais: '0,20',
        encours: '128,9 Md€',
        differenciateur: 'le plus gros et liquide, CTO uniquement',
      }),
      createEtf({
        nom: 'Vanguard FTSE All-World UCITS ETF',
        isin: 'IE00BK5BQT80',
        frais: '0,14',
        encours: '48,4 Md€',
        differenciateur: '+3600 valeurs, small caps incluses, CTO',
      }),
      createEtf({
        nom: 'SPDR MSCI ACWI UCITS ETF',
        isin: 'IE00B44Z5B48',
        frais: '0,12',
        encours: '15,7 Md€',
        differenciateur: 'le moins cher, développés + émergents, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Monde (MSCI World) UCITS ETF',
        isin: 'FR001400U5Q4',
        frais: '0,20',
        encours: '~378 M€',
        differenciateur: 'seul MSCI World éligible PEA, réplication synthétique',
      }),
    ],
    cloture:
      'Le choix ne se joue pas sur la performance passée, mais sur les frais, la composition et l’éligibilité PEA qui collent à TA stratégie.',
  }),
  createTheme({
    id: 'usa',
    nom: 'USA',
    emoji: '🇺🇸',
    hookAction: 'miser sur le marché le plus performant des 15 dernières années',
    hookDilemme: 'quel ETF S&P 500 ou Nasdaq choisir',
    transition:
      'Le marché américain domine les indices mondiaux. Voici 3 façons d’y accéder, dont deux logeables en PEA :',
    etfs: [
      createEtf({
        nom: 'iShares Core S&P 500 UCITS ETF',
        isin: 'IE00B5BMR087',
        frais: '0,07',
        encours: '159,5 Md$',
        differenciateur: 'frais les plus bas, réplication physique, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA S&P 500 UCITS ETF',
        isin: 'FR0011871128',
        frais: '0,12',
        encours: '~1,2 Md€',
        differenciateur: 'le classique S&P 500 éligible PEA depuis 2014',
      }),
      createEtf({
        nom: 'Amundi PEA Nasdaq-100 UCITS ETF',
        isin: 'FR0011871110',
        frais: '0,30',
        encours: '~1,13 Md€',
        differenciateur: 'tech US concentrée, seul Nasdaq en PEA',
      }),
    ],
    cloture:
      'Le vrai choix : S&P 500 large et diversifié, ou Nasdaq concentré et plus volatil sur la tech. À arbitrer selon ton profil de risque.',
  }),
  createTheme({
    id: 'europe',
    nom: 'Europe',
    emoji: '🇪🇺',
    hookAction: 'diversifier ton portefeuille sur les valeurs européennes',
    hookDilemme: 'quel indice Europe choisir (MSCI Europe, Euro Stoxx 50 ou Stoxx 600)',
    transition:
      'Le marché européen reste sous-pondéré dans beaucoup de portefeuilles. Voici 3 trackers pour s’y exposer :',
    etfs: [
      createEtf({
        nom: 'iShares Core MSCI Europe UCITS ETF',
        isin: 'IE00B4K48X80',
        frais: '0,12',
        encours: '16,2 Md€',
        differenciateur: 'le plus gros MSCI Europe, CTO uniquement',
      }),
      createEtf({
        nom: 'iShares Core EURO STOXX 50 UCITS ETF',
        isin: 'IE00B53L3W79',
        frais: '0,10',
        encours: '~7,97 Md€',
        differenciateur: 'le plus liquide Euro Stoxx 50, 50 valeurs zone euro, PEA',
      }),
      createEtf({
        nom: 'BNP Paribas Easy STOXX Europe 600 UCITS ETF',
        isin: 'FR0011550193',
        frais: '0,19',
        encours: '~1,1 Md€',
        differenciateur: 'seul grand Stoxx 600 éligible PEA',
      }),
    ],
    cloture:
      'MSCI Europe, Euro Stoxx 50 ou Stoxx 600 : le nombre de valeurs et l’éligibilité PEA changent tout selon ton enveloppe fiscale.',
  }),
  createTheme({
    id: 'tech-europe',
    nom: 'Tech Europe',
    emoji: '💻',
    hookAction: 'investir sur la tech européenne plutôt que sur les GAFAM',
    hookDilemme: 'si un vrai ETF tech Europe existe',
    transition:
      'Contrairement aux US, l’offre est très étroite : peu d’émetteurs, des encours modestes. Voici les 2 options qui existent réellement :',
    etfs: [
      createEtf({
        nom: 'Amundi STOXX Europe 600 Technology UCITS ETF',
        isin: 'LU1834988518',
        frais: '0,30',
        encours: '~218 M€',
        differenciateur: 'le plus gros et le moins cher du segment',
      }),
      createEtf({
        nom: 'iShares STOXX Europe 600 Technology UCITS ETF (DE)',
        isin: 'DE000A0H08Q4',
        frais: '0,46',
        encours: '~228 M€',
        differenciateur: 'le plus ancien du segment, lancé en 2001',
      }),
    ],
    cloture:
      'La tech européenne pèse peu face aux US en Bourse — ces ETF restent des supports de niche, pas un pilier de portefeuille.',
  }),
  createTheme({
    id: 'emergents',
    nom: 'Émergents',
    emoji: '🌏',
    hookAction: 'capter la croissance des pays émergents',
    hookDilemme: 'quel ETF Emerging Markets choisir',
    transition:
      'Chine, Inde, Brésil, Taïwan... les émergents pèsent de plus en plus dans l’économie mondiale. Voici 3 trackers pour y accéder :',
    etfs: [
      createEtf({
        nom: 'iShares Core MSCI EM IMI UCITS ETF',
        isin: 'IE00BKM4GZ66',
        frais: '0,18',
        encours: '25,4 Md€',
        differenciateur: 'très large, small et mid caps incluses, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Émergents (MSCI EM) UCITS ETF',
        isin: 'FR0013412020',
        frais: '0,30',
        encours: '~0,8 Md€',
        differenciateur: 'seul grand tracker émergents éligible PEA',
      }),
      createEtf({
        nom: 'Xtrackers MSCI Emerging Markets UCITS ETF',
        isin: 'IE00BTJRMP35',
        frais: '0,18',
        encours: '11,9 Md€',
        differenciateur: 'alternative physique par échantillonnage, CTO',
      }),
    ],
    cloture:
      'La composition (poids Chine/Inde) et l’éligibilité PEA sont les deux critères qui doivent guider ton choix.',
  }),
  createTheme({
    id: 'luxe',
    nom: 'Luxe',
    emoji: '💎',
    hookAction: 'investir sur les marques de luxe mondiales',
    hookDilemme: 'quel ETF Luxe choisir',
    transition: 'LVMH, Hermès, L’Oréal... le secteur du luxe a ses trackers dédiés. Voici les 2 options disponibles :',
    etfs: [
      createEtf({
        nom: 'Amundi S&P Global Luxury UCITS ETF',
        isin: 'LU1681048630',
        frais: '0,25',
        encours: '~400 M€',
        differenciateur: 'référence du secteur depuis 2018, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Luxe Monde UCITS ETF',
        isin: 'FR001400S9V0',
        frais: '0,30',
        encours: '~10 M€',
        differenciateur: 'seul ETF luxe éligible PEA, encours encore faible',
      }),
    ],
    cloture:
      'Le secteur luxe est cyclique et concentré sur quelques méga-caps — un ETF thématique à forte conviction, pas un socle de portefeuille.',
  }),
  createTheme({
    id: 'ia-robotique',
    nom: 'IA / Robotique',
    emoji: '🤖',
    hookAction: 'investir sur la révolution de l’intelligence artificielle',
    hookDilemme: 'quel ETF IA choisir face à la multitude d’options',
    transition:
      'L’IA est le thème le plus commenté en Bourse depuis 2023. Voici 3 ETF qui y donnent accès, avec des approches différentes :',
    etfs: [
      createEtf({
        nom: 'Xtrackers Artificial Intelligence and Big Data UCITS ETF',
        isin: 'IE00BGV5VN51',
        frais: '0,35',
        encours: '7,8 Md€',
        differenciateur: 'le plus gros encours, frais les plus bas du trio',
      }),
      createEtf({
        nom: 'L&G Artificial Intelligence UCITS ETF',
        isin: 'IE00BK5BCD43',
        frais: '0,49',
        encours: '~1,6 Md€',
        differenciateur: 'pur-play IA via l’indice historique ROBO Global',
      }),
      createEtf({
        nom: 'iShares Automation & Robotics UCITS ETF',
        isin: 'IE00BYZK4552',
        frais: '0,40',
        encours: '~4,2 Md€',
        differenciateur: 'automatisation et robotique large, pas l’IA pure',
      }),
    ],
    cloture:
      'IA pure, Big Data ou robotique/automatisation : chaque indice définit le secteur différemment, lis la méthodologie avant de choisir.',
    eligibilite: 'CTO uniquement',
  }),
  createTheme({
    id: 'sante',
    nom: 'Santé',
    emoji: '🩺',
    hookAction: 'investir sur un secteur défensif et structurellement porteur',
    hookDilemme: 'quel ETF Santé choisir',
    transition:
      'Vieillissement démographique, innovation pharma... la santé est un thème de long terme. Voici 3 trackers pour s’y exposer :',
    etfs: [
      createEtf({
        nom: 'iShares MSCI World Health Care Sector UCITS ETF',
        isin: 'IE00BJ5JNZ06',
        frais: '0,18',
        encours: '~559 M€',
        differenciateur: 'le moins cher du secteur santé mondial, CTO',
      }),
      createEtf({
        nom: 'Xtrackers MSCI World Health Care UCITS ETF',
        isin: 'IE00BM67HK77',
        frais: '0,25',
        encours: '~3,44 Md€',
        differenciateur: 'le plus gros de la catégorie, capitalisant',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe 600 Healthcare UCITS ETF',
        isin: 'LU1834986900',
        frais: '0,30',
        encours: '~990 M€',
        differenciateur: 'seule option santé éligible PEA, Europe only',
      }),
    ],
    cloture:
      'Exposition mondiale ou européenne, le choix change beaucoup ta diversification — et seule l’option européenne est logeable en PEA.',
  }),
  createTheme({
    id: 'renouvelables',
    nom: 'Renouvelables',
    emoji: '♻️',
    hookAction: 'investir sur la transition énergétique',
    hookDilemme: 'quel ETF énergies renouvelables choisir après la chute de 2022',
    transition:
      'Le secteur a connu un vrai trou d’air depuis son pic de 2021. Voici 3 trackers pour s’y exposer aujourd’hui :',
    etfs: [
      createEtf({
        nom: 'iShares Global Clean Energy Transition UCITS ETF',
        isin: 'IE00B1XNHC34',
        frais: '0,65',
        encours: '~389 M€',
        differenciateur: 'pionnier historique, encours ÷15 depuis 2022',
      }),
      createEtf({
        nom: 'Amundi MSCI New Energy ESG Screened UCITS ETF',
        isin: 'FR0010524777',
        frais: '0,60',
        encours: '~750 M€',
        differenciateur: 'filtre ESG explicite sur l’indice New Energy',
      }),
      createEtf({
        nom: 'L&G Clean Energy UCITS ETF',
        isin: 'IE00BK5BCH80',
        frais: '0,49',
        encours: '~661 M€',
        differenciateur: 'lancé en 2020, moins cher, sans le passif de 2022',
      }),
    ],
    cloture:
      'Le crash de 2022 rappelle que les thématiques ESG concentrées peuvent être très volatiles — à doser en conséquence dans un portefeuille.',
    eligibilite: 'CTO uniquement',
  }),
  createTheme({
    id: 'dividendes',
    nom: 'Dividendes',
    emoji: '💵',
    hookAction: 'construire un revenu passif régulier en Bourse',
    hookDilemme: 'quel ETF à dividendes choisir',
    transition:
      'Rendement pur, croissance du dividende ou historique de hausses : ces 3 ETF n’ont pas la même méthodologie. Voici lesquels :',
    etfs: [
      createEtf({
        nom: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF',
        isin: 'IE00B8GKDB10',
        frais: '0,29',
        encours: '9,65 Md€',
        differenciateur: 'le plus gros et le moins cher, rendement pur',
      }),
      createEtf({
        nom: 'SPDR S&P Global Dividend Aristocrats UCITS ETF',
        isin: 'IE00B9CQXS71',
        frais: '0,45',
        encours: '~1,5 Md€',
        differenciateur: 'hausses de dividende sur 10 ans consécutifs mini',
      }),
      createEtf({
        nom: 'WisdomTree Global Quality Dividend Growth UCITS ETF',
        isin: 'IE00BZ56SW52',
        frais: '0,38',
        encours: '~658 M€',
        differenciateur: 'pondère qualité et croissance, pas que le yield',
      }),
    ],
    cloture:
      'Un rendement élevé n’est pas toujours signe de qualité — regarde la méthodologie de sélection avant le seul chiffre du yield.',
    eligibilite: 'CTO uniquement',
  }),
  createTheme({
    id: 'japon',
    nom: 'Japon',
    emoji: '🇯🇵',
    hookAction: 'diversifier ton portefeuille sur le marché japonais',
    hookDilemme: 'quel ETF Japon choisir (et si la couverture de change compte)',
    transition:
      'Le Japon reste sous-représenté dans la plupart des portefeuilles européens. Voici 3 trackers pour s’y exposer :',
    etfs: [
      createEtf({
        nom: 'iShares Core MSCI Japan IMI UCITS ETF',
        isin: 'IE00B4L5YX21',
        frais: '0,12',
        encours: '7,14 Md€',
        differenciateur: 'le moins cher, couverture large incl. small caps',
      }),
      createEtf({
        nom: 'Amundi PEA Japan (TOPIX) UCITS ETF',
        isin: 'FR0013411980',
        frais: '0,20',
        encours: '~100 M€',
        differenciateur: 'seul accès PEA au marché japonais',
      }),
      createEtf({
        nom: 'Xtrackers Nikkei 225 UCITS ETF',
        isin: 'LU1875395870',
        frais: '0,19',
        encours: '~282 M€',
        differenciateur: 'suit le Nikkei 225, couverture yen/euro incluse',
      }),
    ],
    cloture:
      'Couvert ou non contre le yen, en PEA ou non : ces critères comptent autant que le choix de l’indice sous-jacent.',
  }),
  createTheme({
    id: 'defense',
    nom: 'Défense',
    emoji: '🛡️',
    hookAction: 'investir sur la hausse des budgets de défense en Europe',
    hookDilemme: 'quel ETF Défense choisir',
    transition:
      'Le secteur a explosé depuis 2024 avec la hausse des budgets militaires européens. Voici 3 trackers pour y accéder :',
    etfs: [
      createEtf({
        nom: 'VanEck Defense UCITS ETF',
        isin: 'IE000YYE6WK5',
        frais: '0,55',
        encours: '7,2 Md$',
        differenciateur: 'le plus gros, exposition mondiale incl. USA',
      }),
      createEtf({
        nom: 'WisdomTree Europe Defence UCITS ETF',
        isin: 'IE0002Y8CX98',
        frais: '0,40',
        encours: '~4,5 Md€',
        differenciateur: 'pur défense européenne, non éligible PEA (UK inclus)',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe Defense UCITS ETF',
        isin: 'LU3038520774',
        frais: '0,35',
        encours: '~530 M€',
        differenciateur: 'seul éligible PEA, frais les plus bas du trio',
      }),
    ],
    cloture:
      'Exposition mondiale ou 100% européenne, éligible PEA ou non : ces ETF récents n’ont pas tous le même profil de risque.',
  }),
  createTheme({
    id: 'quantique',
    nom: 'Quantique',
    emoji: '⚛️',
    hookAction: 'investir sur l’informatique quantique avant qu’elle ne soit mainstream',
    hookDilemme: 'quel ETF quantique choisir parmi ceux tout juste lancés',
    transition:
      'Le thème est si récent qu’aucun de ces ETF n’a encore un an d’historique. Voici les 3 qui existent :',
    etfs: [
      createEtf({
        nom: 'VanEck Quantum Computing UCITS ETF',
        isin: 'IE0007Y8Y157',
        frais: '0,55',
        encours: '~895 M$',
        differenciateur: 'le plus gros et le plus ancien des 3, lancé en 2025',
      }),
      createEtf({
        nom: 'iShares Quantum Computing UCITS ETF',
        isin: 'IE000C6ITGC8',
        frais: '0,50',
        encours: '~66 M€',
        differenciateur: 'le plus récent des 3, encours encore faible',
      }),
      createEtf({
        nom: 'WisdomTree Quantum Computing UCITS ETF',
        isin: 'IE000W8WMSL2',
        frais: '0,50',
        encours: '',
        differenciateur: 'indice co-développé avec Classiq, spécialiste quantique',
      }),
    ],
    cloture:
      'Thématique à très fort risque : peu de recul, forte volatilité attendue. À réserver à une part satellite de portefeuille.',
  }),
  createTheme({
    id: 'spatial',
    nom: 'Spatial',
    emoji: '🚀',
    hookAction: 'investir sur la conquête spatiale et le New Space',
    hookDilemme: 's’il existe un vrai ETF accessible pour ça',
    transition: 'L’offre est très restreinte pour un investisseur européen. Voici le seul ETF UCITS solide sur le sujet :',
    etfs: [
      createEtf({
        nom: 'VanEck Space Innovators UCITS ETF',
        isin: 'IE000YU9K6K2',
        frais: '0,55',
        encours: '~2,0 Md$',
        differenciateur: 'seul ETF spatial UCITS actif et liquide en Europe',
      }),
    ],
    cloture:
      'Un seul acteur liquide sur ce thème en Europe — c’est un pari de conviction, pas un choix parmi plusieurs concurrents.',
    eligibilite: 'CTO uniquement',
  }),
  createTheme({
    id: 'ressources-naturelles',
    nom: 'Ressources naturelles',
    emoji: '⛏️',
    hookAction: 't’exposer aux matières premières via les entreprises minières',
    hookDilemme: 'quel ETF ressources naturelles choisir',
    transition:
      'Mines, matériaux de base : plusieurs façons d’y accéder selon ta zone géographique cible. Voici 3 trackers :',
    etfs: [
      createEtf({
        nom: 'VanEck S&P Global Mining UCITS ETF',
        isin: 'IE00BDFBTQ78',
        frais: '0,50',
        encours: '2,2 Md$',
        differenciateur: 'exposition minière mondiale la plus large, CTO',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe 600 Basic Materials UCITS ETF',
        isin: 'LU1834983634',
        frais: '',
        encours: '',
        differenciateur: 'seule option ressources éligible PEA, Europe only',
      }),
      createEtf({
        nom: 'Xtrackers MSCI World Materials UCITS ETF',
        isin: 'IE00BM67HS53',
        frais: '0,25',
        encours: '~304 M€',
        differenciateur: 'frais parmi les plus bas du segment matériaux, CTO',
      }),
    ],
    cloture:
      'Exposition mondiale, européenne (et PEA), ou ciblée matériaux : le choix dépend surtout de ton allocation géographique déjà en place.',
  }),
  createTheme({
    id: 'etc-metaux',
    nom: 'ETC (Or, Argent, Cuivre)',
    emoji: '🪙',
    hookAction: 'te protéger avec des matières premières physiques',
    hookDilemme: 'quel ETC choisir entre or, argent et cuivre',
    transition:
      'Ce ne sont pas des ETF actions mais des ETC (Exchange Traded Commodities), non éligibles au PEA. Voici les principaux :',
    etfs: [
      createEtf({
        nom: 'iShares Physical Gold ETC',
        isin: 'IE00B4ND3602',
        frais: '0,12',
        encours: '33 Md€',
        differenciateur: 'le plus gros et liquide ETC or européen',
      }),
      createEtf({
        nom: 'Amundi Physical Gold ETC',
        isin: 'FR0013416716',
        frais: '0,12',
        encours: '10,1 Md€',
        differenciateur: 'seul grand ETC or de droit français',
      }),
      createEtf({
        nom: 'iShares Physical Silver ETC',
        isin: 'IE00B4NCWG09',
        frais: '0,20',
        encours: '2,71 Md€',
        differenciateur: 'ETC argent physique le moins cher des leaders',
      }),
      createEtf({
        nom: 'WisdomTree Copper',
        isin: 'GB00B15KXQ89',
        frais: '0,49',
        encours: '1,79 Md€',
        differenciateur: 'seule expo cuivre pure, réplication par swap (non physique)',
      }),
    ],
    cloture:
      'Attention : contrairement à l’or et l’argent, il n’existe pas d’ETC cuivre physique — seulement une réplication synthétique par swap.',
    eligibilite: 'Non éligible PEA (ETC hors périmètre)',
  }),
]
