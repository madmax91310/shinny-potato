import { formatEtfTer } from '../../../data/etf-ter.js';
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

// Données ETF vérifiées par recherche web (ISIN / TER / encours), état 25/08/2026.
// Audit "meilleurs ETF" du même jour : remplacement de 3 fonds par une alternative UCITS
// réelle moins chère à exposition quasi identique (Monde CTO, S&P 500 CTO, Japon CTO),
// correction de plusieurs encours obsolètes, et ajout de l'éligibilité PEA/CTO explicite
// sur chaque ligne qui ne l'avait pas encore (Tech Europe, Quantique). Priorité systématique :
// 1) l'option PEA quand elle existe avec un TER raisonnable, 2) sinon le TER le plus bas parmi
// les fonds CTO suffisamment liquides (encours > ~100 M€, sauf mention contraire explicite —
// cf. Amundi STOXX Europe 600 Basic Materials, seule option PEA du thème Ressources naturelles
// malgré un encours faible).
// Les encours évoluent en continu : à revérifier sur justETF.com avant publication
// si le tweet sort plusieurs semaines après la dernière mise à jour de ce fichier.
// Exceptions datées en commentaire inline : Amundi Global Luxury et Amundi TOPIX,
// encours des fiches émetteur au 31/08/2026, recoupés le 25/09/2026.
const BASE_THEMES = [
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
        nom: 'UBS Core MSCI World UCITS ETF',
        isin: 'IE00BD4TXV59',
        frais: formatEtfTer('IE00BD4TXV59'),
        encours: '10,46 Md€',
        differenciateur: 'le moins cher du marché, réplication physique complète, CTO',
      }),
      createEtf({
        nom: 'Vanguard FTSE All-World UCITS ETF',
        isin: 'IE00BK5BQT80',
        frais: formatEtfTer('IE00BK5BQT80'),
        encours: '49,05 Md€',
        // L'indice FTSE All-World couvre les grandes et moyennes capitalisations,
        // pas les small caps (document du fonds Vanguard, ISIN IE00BK5BQT80).
        differenciateur: 'grandes et moyennes capitalisations, pays développés + émergents, CTO',
      }),
      createEtf({
        nom: 'SPDR MSCI ACWI UCITS ETF',
        isin: 'IE00B44Z5B48',
        frais: formatEtfTer('IE00B44Z5B48'),
        encours: '15,7 Md€',
        differenciateur: 'le moins cher développés + émergents, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Monde (MSCI World) UCITS ETF',
        isin: 'FR001400U5Q4',
        frais: formatEtfTer('FR001400U5Q4'),
        encours: '~1,37 Md€',
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
        nom: 'SPDR S&P 500 UCITS ETF Acc',
        isin: 'IE000XZSV718',
        frais: formatEtfTer('IE000XZSV718'),
        encours: '16,04 Md€',
        differenciateur: 'frais les plus bas du marché, réplication physique, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA S&P 500 UCITS ETF',
        isin: 'FR0011871128',
        frais: formatEtfTer('FR0011871128'),
        encours: '~1,2 Md€',
        differenciateur: 'le classique S&P 500 éligible PEA depuis 2014',
      }),
      createEtf({
        nom: 'Amundi PEA Nasdaq-100 UCITS ETF',
        isin: 'FR0011871110',
        frais: formatEtfTer('FR0011871110'),
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
      'Un ETF World te laisse déjà une place pour l’Europe. Si tu veux lui donner davantage de poids, ces trois indices ne couvrent pas la même chose :',
    etfs: [
      createEtf({
        nom: 'iShares Core MSCI Europe UCITS ETF',
        isin: 'IE00B4K48X80',
        frais: formatEtfTer('IE00B4K48X80'),
        encours: '16,2 Md€',
        differenciateur: 'le plus gros MSCI Europe, CTO uniquement',
      }),
      createEtf({
        nom: 'iShares Core EURO STOXX 50 UCITS ETF',
        isin: 'IE00B53L3W79',
        frais: formatEtfTer('IE00B53L3W79'),
        encours: '~7,97 Md€',
        differenciateur: 'le plus liquide Euro Stoxx 50, 50 valeurs zone euro, PEA',
      }),
      createEtf({
        nom: 'BNP Paribas Easy STOXX Europe 600 UCITS ETF',
        isin: 'FR0011550193',
        frais: formatEtfTer('FR0011550193'),
        encours: '~1,1 Md€',
        differenciateur: 'seul grand Stoxx 600 éligible PEA',
      }),
    ],
    cloture:
      'Le 50 se limite aux grandes sociétés de la zone euro. Le MSCI Europe et le STOXX 600 couvrent aussi d’autres marchés européens. Vérifie ton enveloppe avant de trancher.',
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
        frais: formatEtfTer('LU1834988518'),
        encours: '~199 M€',
        differenciateur: `${formatEtfTer('LU1834988518', 'index')} de frais annuels, éligible PEA`,
      }),
      createEtf({
        nom: 'iShares STOXX Europe 600 Technology UCITS ETF (DE)',
        isin: 'DE000A0H08Q4',
        frais: formatEtfTer('DE000A0H08Q4'),
        encours: '~228 M€',
        differenciateur: 'le plus ancien du segment (2001), CTO uniquement',
      }),
    ],
    cloture:
      'Tu ajoutes un seul secteur : si tu possèdes déjà un ETF Europe, regarde d’abord combien de ces entreprises tu détiens déjà.',
  }),
  createTheme({
    id: 'emergents',
    nom: 'Émergents',
    emoji: '🌏',
    hookAction: 'capter la croissance des pays émergents',
    hookDilemme: 'quel ETF Emerging Markets choisir',
    transition:
      'Chine, Inde, Brésil, Taïwan : selon l’indice choisi, les pays et la taille des entreprises couvertes changent. Trois façons de s’y exposer :',
    etfs: [
      createEtf({
        nom: 'iShares Core MSCI EM IMI UCITS ETF',
        isin: 'IE00BKM4GZ66',
        frais: formatEtfTer('IE00BKM4GZ66'),
        encours: '~36,8 Md€',
        differenciateur: 'très large, small et mid caps incluses, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Emergent (MSCI Emerging) ESG Transition UCITS ETF',
        isin: 'FR0013412020',
        frais: formatEtfTer('FR0013412020'),
        encours: '~0,86 Md€',
        differenciateur: 'seul grand tracker émergents éligible PEA, indice filtré ESG',
      }),
      createEtf({
        nom: 'Xtrackers MSCI Emerging Markets UCITS ETF',
        isin: 'IE00BTJRMP35',
        frais: formatEtfTer('IE00BTJRMP35'),
        encours: '11,9 Md€',
        differenciateur: 'alternative physique par échantillonnage, CTO',
      }),
    ],
    cloture:
      'Une ligne « émergents » ne répartit pas ton argent à parts égales entre les pays. Regarde surtout le poids des plus gros marchés et ce que change le filtre ESG de la version PEA.',
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
        frais: formatEtfTer('LU1681048630'),
        // Actif géré 478,37 M€ au 31/08/2026 ; fiche Amundi vérifiée le 25/09/2026.
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/RETAIL/ETF
        encours: '~478 M€',
        differenciateur: 'référence du secteur depuis 2018, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Luxe Monde UCITS ETF',
        isin: 'FR001400S9V0',
        frais: formatEtfTer('FR001400S9V0'),
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
        frais: formatEtfTer('IE00BGV5VN51'),
        encours: '7,8 Md€',
        differenciateur: 'le plus gros encours, frais les plus bas du trio',
      }),
      createEtf({
        nom: 'L&G Artificial Intelligence UCITS ETF',
        isin: 'IE00BK5BCD43',
        frais: formatEtfTer('IE00BK5BCD43'),
        encours: '~1,6 Md€',
        differenciateur: 'pur-play IA via l’indice historique ROBO Global',
      }),
      createEtf({
        nom: 'iShares Automation & Robotics UCITS ETF',
        isin: 'IE00BYZK4552',
        frais: formatEtfTer('IE00BYZK4552'),
        encours: '~4,5 Md€',
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
        frais: formatEtfTer('IE00BJ5JNZ06'),
        encours: '~559 M€',
        differenciateur: 'le moins cher du secteur santé mondial, CTO',
      }),
      createEtf({
        nom: 'Xtrackers MSCI World Health Care UCITS ETF',
        isin: 'IE00BM67HK77',
        frais: formatEtfTer('IE00BM67HK77'),
        encours: '~3,44 Md€',
        differenciateur: 'le plus gros de la catégorie, capitalisant',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe 600 Healthcare UCITS ETF',
        isin: 'LU1834986900',
        frais: formatEtfTer('LU1834986900'),
        encours: '~839 M€',
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
        frais: formatEtfTer('IE00B1XNHC34'),
        encours: '~2,66 Md€',
        differenciateur: 'pionnier historique du secteur, encours en forte baisse depuis le pic de 2021',
      }),
      createEtf({
        nom: 'Amundi MSCI New Energy ESG Screened UCITS ETF',
        isin: 'FR0010524777',
        frais: formatEtfTer('FR0010524777'),
        encours: '~750 M€',
        differenciateur: 'filtre ESG explicite sur l’indice New Energy',
      }),
      createEtf({
        nom: 'L&G Clean Energy UCITS ETF',
        isin: 'IE00BK5BCH80',
        frais: formatEtfTer('IE00BK5BCH80'),
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
        frais: formatEtfTer('IE00B8GKDB10'),
        encours: '9,65 Md€',
        differenciateur: 'le plus gros et le moins cher, rendement pur',
      }),
      createEtf({
        nom: 'SPDR S&P Global Dividend Aristocrats UCITS ETF',
        isin: 'IE00B9CQXS71',
        frais: formatEtfTer('IE00B9CQXS71'),
        encours: '~1,5 Md€',
        differenciateur: 'hausses de dividende sur 10 ans consécutifs mini',
      }),
      createEtf({
        nom: 'WisdomTree Global Quality Dividend Growth UCITS ETF',
        isin: 'IE00BZ56SW52',
        frais: formatEtfTer('IE00BZ56SW52'),
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
        nom: 'Amundi Prime Japan UCITS ETF',
        isin: 'LU2089238385',
        frais: formatEtfTer('LU2089238385'),
        encours: '~2,45 Md€',
        differenciateur: 'le moins cher du marché, Large & Mid Cap (pas de small caps), CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Japan (TOPIX) UCITS ETF',
        isin: 'FR0013411980',
        frais: formatEtfTer('FR0013411980'),
        // Actif géré 187,05 M€ au 31/08/2026 ; fiche Amundi vérifiée le 25/09/2026.
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411980/FRA/FRA/INSTITUTIONNEL/ETF
        encours: '~187 M€',
        differenciateur: 'seul accès PEA au marché japonais',
      }),
      createEtf({
        nom: 'Xtrackers Nikkei 225 UCITS ETF',
        isin: 'LU1875395870',
        frais: formatEtfTer('LU1875395870'),
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
        frais: formatEtfTer('IE000YYE6WK5'),
        encours: '7,2 Md$',
        differenciateur: 'le plus gros, exposition mondiale incl. USA',
      }),
      createEtf({
        nom: 'WisdomTree Europe Defence UCITS ETF',
        isin: 'IE0002Y8CX98',
        frais: formatEtfTer('IE0002Y8CX98'),
        encours: '~4,5 Md€',
        differenciateur: 'pur défense européenne, non éligible PEA (UK inclus)',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe Defense UCITS ETF',
        isin: 'LU3038520774',
        frais: formatEtfTer('LU3038520774'),
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
      'Les ETF de ce thème ont peu de recul par rapport aux grands indices. Voici trois approches à comparer :',
    etfs: [
      createEtf({
        nom: 'VanEck Quantum Computing UCITS ETF',
        isin: 'IE0007Y8Y157',
        frais: formatEtfTer('IE0007Y8Y157'),
        encours: '~895 M$',
        differenciateur: 'le plus gros et le plus ancien des 3, lancé en 2025',
      }),
      createEtf({
        nom: 'iShares Quantum Computing UCITS ETF',
        isin: 'IE000C6ITGC8',
        frais: formatEtfTer('IE000C6ITGC8'),
        encours: '~66 M€',
        differenciateur: 'le plus récent des 3, encours faible : liquidité/spread à surveiller',
      }),
      createEtf({
        nom: 'WisdomTree Quantum Computing UCITS ETF',
        isin: 'IE000W8WMSL2',
        frais: formatEtfTer('IE000W8WMSL2'),
        encours: '~291 M€',
        differenciateur: 'indice co-développé avec Classiq, spécialiste quantique',
      }),
    ],
    cloture:
      'Thématique à très fort risque : peu de recul, forte volatilité attendue. À réserver à une part satellite de portefeuille.',
    eligibilite: 'CTO uniquement (composition mondiale)',
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
        frais: formatEtfTer('IE000YU9K6K2'),
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
        frais: formatEtfTer('IE00BDFBTQ78'),
        encours: '2,2 Md$',
        differenciateur: 'exposition minière mondiale la plus large, CTO',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe 600 Basic Materials UCITS ETF',
        isin: 'LU1834983634',
        frais: formatEtfTer('LU1834983634'),
        encours: '~20 M€',
        differenciateur: 'seule option ressources éligible PEA, Europe only — encours faible, liquidité à surveiller',
      }),
      createEtf({
        nom: 'Xtrackers MSCI World Materials UCITS ETF',
        isin: 'IE00BM67HS53',
        frais: formatEtfTer('IE00BM67HS53'),
        encours: '~681 M€',
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
        frais: formatEtfTer('IE00B4ND3602'),
        encours: '33 Md€',
        differenciateur: 'le plus gros et liquide ETC or européen',
      }),
      createEtf({
        nom: 'Amundi Physical Gold ETC',
        isin: 'FR0013416716',
        frais: formatEtfTer('FR0013416716'),
        encours: '10,1 Md€',
        differenciateur: 'seul grand ETC or de droit français',
      }),
      createEtf({
        nom: 'iShares Physical Silver ETC',
        isin: 'IE00B4NCWG09',
        frais: formatEtfTer('IE00B4NCWG09'),
        encours: '2,71 Md€',
        differenciateur: 'ETC argent physique le moins cher des leaders',
      }),
      createEtf({
        nom: 'WisdomTree Copper',
        isin: 'GB00B15KXQ89',
        frais: formatEtfTer('GB00B15KXQ89'),
        encours: '1,79 Md€',
        differenciateur: 'expo cuivre la plus liquide, réplication par swap (non physique)',
      }),
    ],
    cloture:
      'Attention : contrairement à l’or et l’argent, il n’existe quasi pas d’ETC cuivre physique liquide (le seul, Elementum, pèse ~2 M€) — en pratique, l’expo cuivre passe par une réplication synthétique par swap.',
    eligibilite: 'Non éligible PEA (ETC hors périmètre)',
  }),
]

// Une ouverture et une question propres au choix réel de chaque famille. Les ETF et leurs
// données restent ceux de BASE_THEMES ; Tweet Midi réutilise directement cette sortie.
const EDITORIAL = {
  monde: {
    accroche: '🌍 MSCI World, ACWI, All-World : « investir dans le monde » ne veut pas dire acheter la même chose.',
    cloture: 'Regarde d’abord si tu veux les émergents, puis ton enveloppe et les frais. Deux ETF « Monde » peuvent se recouvrir largement.',
    ctaEngagement: 'Ton ETF mondial inclut les émergents ou tu les ajoutes séparément ?',
  },
  usa: {
    accroche: '🇺🇸 S&P 500 ou Nasdaq-100 : même pays, mais pas le même pari.',
    cloture: 'Le S&P 500 couvre davantage de secteurs. Le Nasdaq-100 donne plus de poids aux grandes valeurs de croissance : vérifie aussi ce que ton World contient déjà.',
    ctaEngagement: 'Si tu as déjà un World, pourquoi ajouterais-tu un ETF américain ?',
  },
  europe: {
    accroche: '🇪🇺 Europe ne veut pas forcément dire zone euro : le choix de l’indice change les pays que tu achètes.',
    cloture: 'Entre un indice européen large et 50 valeurs de la zone euro, la diversification n’est pas la même. Regarde le périmètre avant les frais.',
    ctaEngagement: 'Pour renforcer l’Europe, tu préfères toute la région ou uniquement la zone euro ?',
  },
  'tech-europe': {
    accroche: '💻 Tu veux de la tech européenne en Bourse ? L’offre en ETF est bien plus étroite qu’aux États-Unis.',
    cloture: 'La tech européenne est un thème ciblé. Compare la composition des fonds avant de l’ajouter à un indice Europe que tu détiens déjà.',
    ctaEngagement: 'Tu chercherais la tech européenne dans un ETF dédié ou dans un indice Europe plus large ?',
  },
  emergents: {
    accroche: '🌏 « Pays émergents » couvre des marchés très différents. Quel poids veux-tu donner à chacun ?',
    cloture: 'Regarde la part des grandes places asiatiques, la taille des entreprises suivies et l’éligibilité PEA avant de comparer uniquement les frais.',
    ctaEngagement: 'Tu préfères un ETF émergents séparé pour fixer son poids toi-même ?',
  },
  luxe: {
    accroche: '👜 Acheter le luxe en ETF, c’est souvent retrouver les mêmes grandes marques avec des poids différents.',
    cloture: 'Ces fonds restent concentrés sur quelques groupes. Vérifie s’ils sont déjà présents dans ton portefeuille Europe.',
    ctaEngagement: 'Tu achèterais un ETF luxe en plus d’un indice Europe ?',
  },
  'ia-robotique': {
    accroche: '🤖 Un ETF « IA » peut détenir des puces, des logiciels ou des industriels de la robotique.',
    cloture: 'Le nom du thème ne suffit pas : compare les premières lignes et la méthode de sélection pour voir ce que tu achètes vraiment.',
    ctaEngagement: 'Tu veux investir dans les puces, les logiciels ou toute la chaîne IA ?',
  },
  sante: {
    accroche: '🧬 Santé mondiale ou européenne : deux ETF du même secteur peuvent avoir des poids très différents.',
    cloture: 'Le choix de la région change les entreprises détenues, la devise d’exposition et la possibilité de passer par le PEA.',
    ctaEngagement: 'Pour la santé, tu chercherais une exposition mondiale ou une ligne éligible PEA ?',
  },
  renouvelables: {
    accroche: '🌱 Les énergies renouvelables ont une belle histoire à raconter. Leur parcours en Bourse a été bien moins régulier.',
    cloture: 'Ces ETF ciblent des entreprises sensibles aux taux, aux coûts et aux politiques publiques. Le thème ne protège pas d’une forte baisse.',
    ctaEngagement: 'Tu serais prêt à garder cette ligne si le secteur continuait de décevoir ?',
  },
  dividendes: {
    accroche: '💸 Tous les ETF à dividendes ne cherchent pas la même chose : rendement actuel, qualité ou historique de hausse.',
    cloture: 'Un gros dividende n’est pas automatiquement une meilleure performance. Compare la sélection des entreprises et le rendement total.',
    ctaEngagement: 'Tu privilégies le revenu versé maintenant ou la progression du dividende ?',
  },
  japon: {
    accroche: '🇯🇵 Investir au Japon : même indice ou pas, la couverture du yen peut changer ton résultat en euros.',
    cloture: 'Demande-toi si tu veux garder le risque de change et si le PEA est nécessaire pour cette exposition.',
    ctaEngagement: 'Tu garderais l’exposition au yen ou choisirais une part couverte ?',
  },
  defense: {
    accroche: '🛡️ Défense européenne ou mondiale : ces ETF ne misent pas sur les mêmes budgets ni les mêmes entreprises.',
    cloture: 'Compare la zone couverte, le poids des premières positions et l’ancienneté du fonds. Tes convictions personnelles comptent aussi.',
    ctaEngagement: 'Si tu investissais dans la défense, tu choisirais l’Europe ou une exposition mondiale ?',
  },
  quantique: {
    accroche: '⚛️ Quantique : plusieurs ETF portent le même thème, mais leurs entreprises ne font pas toutes du quantique leur métier principal.',
    cloture: 'Regarde la part des spécialistes et celle des grands groupes. Le secteur est jeune, concentré et peut varier fortement.',
    ctaEngagement: 'Tu chercherais les spécialistes du quantique ou un fonds qui inclut aussi de grands groupes ?',
  },
  spatial: {
    accroche: '🚀 Investir dans le spatial sans choisir une seule entreprise : que contient vraiment l’ETF accessible en Europe ?',
    cloture: 'Satellites, équipements, lanceurs : lis les premières positions avant de supposer que toutes profitent des mêmes contrats.',
    ctaEngagement: 'Dans le spatial, quelle activité voudrais-tu réellement détenir ?',
  },
  'ressources-naturelles': {
    accroche: '⛏️ Un ETF de minières ne suit pas directement le prix des matières premières.',
    cloture: 'Tu détiens des entreprises, avec leurs coûts et leurs risques propres. Vérifie aussi les régions couvertes par chaque indice.',
    ctaEngagement: 'Tu veux les sociétés minières ou une exposition directe aux matières premières ?',
  },
  'etc-metaux': {
    accroche: '🥇 Or, argent, cuivre : ces produits n’ont ni le même métal ni forcément la même méthode de réplication.',
    cloture: 'Ce sont des ETC, pas des ETF actions. Pour le cuivre présenté ici, la réplication passe par un swap : lis la structure du produit avant de comparer les frais.',
    ctaEngagement: 'Tu chercherais plutôt l’or physique ou une exposition au cuivre ?',
  },
}

export const DEFAULT_THEMES = BASE_THEMES.map((theme) => ({
  ...theme,
  ...EDITORIAL[theme.id],
}))
