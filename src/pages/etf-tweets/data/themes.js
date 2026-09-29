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

// Les encours varient chaque jour. Ils restent absents des textes et images de
// Tweet Midi jusqu'à ce qu'un instantané daté et sourcé soit fourni pour chaque
// produit d'un comparatif. Les frais et l'éligibilité peuvent aussi changer :
// contrôler les fiches émetteurs avant publication.
const BASE_THEMES = [
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00BD4TXV59 : https://www.justetf.com/en/etf-profile.html?isin=IE00BD4TXV59
  // IE00BK5BQT80 : https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BQT80
  // IE00B44Z5B48 : https://www.justetf.com/en/etf-profile.html?isin=IE00B44Z5B48
  // FR001400U5Q4 : https://www.justetf.com/en/etf-profile.html?isin=FR001400U5Q4
  // PEA (FR001400U5Q4) : https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-pea-monde-msci-world-ucits-etf/fr001400u5q4
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

        differenciateur: 'MSCI World, réplication physique complète, CTO',
      }),
      createEtf({
        nom: 'Vanguard FTSE All-World UCITS ETF',
        isin: 'IE00BK5BQT80',
        frais: formatEtfTer('IE00BK5BQT80'),

        // L'indice FTSE All-World couvre les grandes et moyennes capitalisations,
        // pas les small caps (document du fonds Vanguard, ISIN IE00BK5BQT80).
        differenciateur: 'grandes et moyennes capitalisations, pays développés + émergents, CTO',
      }),
      createEtf({
        nom: 'SPDR MSCI ACWI UCITS ETF',
        isin: 'IE00B44Z5B48',
        frais: formatEtfTer('IE00B44Z5B48'),

        differenciateur: 'MSCI ACWI, pays développés et émergents, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Monde (MSCI World) UCITS ETF',
        isin: 'FR001400U5Q4',
        frais: formatEtfTer('FR001400U5Q4'),

        // Vérifié le 27/09/2026 : CW8 (LU1681043599) et WPEA (IE0002XZSHO1)
        // sont également éligibles PEA. Sources émetteurs :
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681043599/ENG/FRA/INSTITUTIONNEL/ETF/20260228
        // https://www.ishares.com/ch/professionals/en/products/335178/ishares-msci-world-swap-pea-ucits-etf
        differenciateur: 'MSCI World éligible PEA, réplication synthétique',
      }),
    ],
    cloture:
      'Le choix ne se joue pas sur la performance passée, mais sur les frais, la composition et l’éligibilité PEA qui collent à TA stratégie.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE000XZSV718 : https://www.justetf.com/en/etf-profile.html?isin=IE000XZSV718
  // FR0011871128 : https://www.justetf.com/en/etf-profile.html?isin=FR0011871128
  // IE000DQLYVB9 : https://www.justetf.com/en/etf-profile.html?isin=IE000DQLYVB9
  // FR0011871110 : https://www.justetf.com/en/etf-profile.html?isin=FR0011871110
  createTheme({
    id: 'usa',
    nom: 'USA',
    emoji: '🇺🇸',
    hookAction: 'miser sur le marché le plus performant des 15 dernières années',
    hookDilemme: 'quel ETF S&P 500 ou Nasdaq choisir',
    transition:
      'Le marché américain domine les indices mondiaux. Voici 4 ETF à comparer, dont trois logeables en PEA :',
    etfs: [
      createEtf({
        nom: 'SPDR S&P 500 UCITS ETF Acc',
        isin: 'IE000XZSV718',
        frais: formatEtfTer('IE000XZSV718'),

        differenciateur: 'S&P 500, réplication physique, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA S&P 500 UCITS ETF',
        isin: 'FR0011871128',
        frais: formatEtfTer('FR0011871128'),

        differenciateur: 'le classique S&P 500 éligible PEA depuis 2014',
      }),
      createEtf({
        // BlackRock, page produit au 25/09/2026 : TER 0,10 %.
        // Fonds lancé le 29/05/2025, sans 2023/2024 calendaires. Sa notice
        // précise qu'il entend conserver son éligibilité au PEA.
        // https://www.blackrock.com/fr/intermediaries/products/342916/
        nom: 'iShares S&P 500 Swap PEA UCITS ETF',
        isin: 'IE000DQLYVB9',
        frais: formatEtfTer('IE000DQLYVB9'),

        differenciateur: 'S&P 500 éligible PEA, moins cher en TER que l’Amundi, mais fonds plus récent',
      }),
      createEtf({
        nom: 'Amundi PEA Nasdaq-100 UCITS ETF',
        isin: 'FR0011871110',
        frais: formatEtfTer('FR0011871110'),

        // La part S FR001400ZGR7 de la même gamme est aussi affichée dans
        // la gamme PEA Amundi (27/09/2026) : éviter toute exclusivité de part.
        // https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-pea-nasdaq100-ucits-etf-s-acc/fr001400zgr7
        differenciateur: 'Nasdaq-100 éligible PEA, exposition concentrée',
      }),
    ],
    cloture:
      'Le vrai choix : S&P 500 large et diversifié, ou Nasdaq concentré et plus volatil sur la tech. À arbitrer selon ton profil de risque.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00B4K48X80 : https://www.justetf.com/en/etf-profile.html?isin=IE00B4K48X80
  // IE00B53L3W79 : https://www.justetf.com/en/etf-profile.html?isin=IE00B53L3W79
  // FR0011550193 : https://www.justetf.com/en/etf-profile.html?isin=FR0011550193
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

        differenciateur: 'MSCI Europe, grandes et moyennes capitalisations, CTO',
      }),
      createEtf({
        nom: 'iShares Core EURO STOXX 50 UCITS ETF',
        isin: 'IE00B53L3W79',
        frais: formatEtfTer('IE00B53L3W79'),

        differenciateur: '50 grandes valeurs de la zone euro, éligible PEA',
      }),
      createEtf({
        nom: 'BNP Paribas Easy STOXX Europe 600 UCITS ETF',
        isin: 'FR0011550193',
        frais: formatEtfTer('FR0011550193'),

        differenciateur: 'STOXX Europe 600, éligible PEA',
      }),
    ],
    cloture:
      'Le 50 se limite aux grandes sociétés de la zone euro. Le MSCI Europe et le STOXX 600 couvrent aussi d’autres marchés européens. Vérifie ton enveloppe avant de trancher.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // LU1834988518 : https://www.justetf.com/en/etf-profile.html?isin=LU1834988518
  // DE000A0H08Q4 : https://www.justetf.com/en/etf-profile.html?isin=DE000A0H08Q4
  createTheme({
    id: 'tech-europe',
    nom: 'Tech Europe',
    emoji: '💻',
    hookAction: 'investir sur la tech européenne plutôt que sur les GAFAM',
    hookDilemme: 'si un vrai ETF tech Europe existe',
    transition:
      'Le secteur tech européen est plus étroit que son équivalent américain. Voici deux fonds qui suivent le même indice :',
    etfs: [
      createEtf({
        nom: 'Amundi STOXX Europe 600 Technology UCITS ETF',
        isin: 'LU1834988518',
        frais: formatEtfTer('LU1834988518'),

        differenciateur: 'STOXX Europe 600 Technology, éligible PEA',
      }),
      createEtf({
        nom: 'iShares STOXX Europe 600 Technology UCITS ETF (DE)',
        isin: 'DE000A0H08Q4',
        frais: formatEtfTer('DE000A0H08Q4'),

        differenciateur: 'STOXX Europe 600 Technology, CTO',
      }),
    ],
    cloture:
      'Tu ajoutes un seul secteur : si tu possèdes déjà un ETF Europe, regarde d’abord combien de ces entreprises tu détiens déjà.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00BKM4GZ66 : https://www.justetf.com/en/etf-profile.html?isin=IE00BKM4GZ66
  // FR0013412020 : https://www.justetf.com/en/etf-profile.html?isin=FR0013412020
  // IE00BTJRMP35 : https://www.justetf.com/en/etf-profile.html?isin=IE00BTJRMP35
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

        differenciateur: 'très large, small et mid caps incluses, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Emergent (MSCI Emerging) ESG Transition UCITS ETF',
        isin: 'FR0013412020',
        frais: formatEtfTer('FR0013412020'),

        differenciateur: 'éligible PEA, indice MSCI Emerging Markets filtré ESG',
      }),
      createEtf({
        nom: 'Xtrackers MSCI Emerging Markets UCITS ETF',
        isin: 'IE00BTJRMP35',
        frais: formatEtfTer('IE00BTJRMP35'),

        differenciateur: 'alternative physique par échantillonnage, CTO',
      }),
    ],
    cloture:
      'Une ligne « émergents » ne répartit pas ton argent à parts égales entre les pays. Regarde surtout le poids des plus gros marchés et ce que change le filtre ESG de la version PEA.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // LU1681048630 : https://www.justetf.com/en/etf-profile.html?isin=LU1681048630
  // FR001400S9V0 : https://www.justetf.com/en/etf-profile.html?isin=FR001400S9V0
  createTheme({
    id: 'luxe',
    nom: 'Luxe',
    emoji: '💎',
    hookAction: 'investir sur les marques de luxe mondiales',
    hookDilemme: 'quel ETF Luxe choisir',
    transition: 'Les indices « luxe » ne retiennent pas forcément les mêmes entreprises. Voici deux fonds à comparer :',
    etfs: [
      createEtf({
        nom: 'Amundi Global Luxury UCITS ETF',
        isin: 'LU1681048630',
        frais: formatEtfTer('LU1681048630'),
        differenciateur: 'suit l’indice S&P Global Luxury, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Luxe Monde UCITS ETF',
        isin: 'FR001400S9V0',
        frais: formatEtfTer('FR001400S9V0'),

        differenciateur: 'exposition au luxe mondial, éligible PEA',
      }),
    ],
    cloture:
      'Le secteur luxe est cyclique et concentré sur quelques méga-caps — un ETF thématique à forte conviction, pas un socle de portefeuille.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00BGV5VN51 : https://www.justetf.com/en/etf-profile.html?isin=IE00BGV5VN51
  // IE00BK5BCD43 : https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BCD43
  // IE00BYZK4552 : https://www.justetf.com/en/etf-profile.html?isin=IE00BYZK4552
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

        differenciateur: 'IA et Big Data, frais les plus bas de ce trio, CTO',
      }),
      createEtf({
        nom: 'L&G Artificial Intelligence UCITS ETF',
        isin: 'IE00BK5BCD43',
        frais: formatEtfTer('IE00BK5BCD43'),
        differenciateur: 'indice ROBO Global Artificial Intelligence, CTO',
      }),
      createEtf({
        nom: 'iShares Automation & Robotics UCITS ETF',
        isin: 'IE00BYZK4552',
        frais: formatEtfTer('IE00BYZK4552'),

        differenciateur: 'automatisation et robotique large, CTO',
      }),
    ],
    cloture:
      'IA pure, Big Data ou robotique/automatisation : chaque indice définit le secteur différemment, lis la méthodologie avant de choisir.',
    eligibilite: 'CTO uniquement',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00BJ5JNZ06 : https://www.justetf.com/en/etf-profile.html?isin=IE00BJ5JNZ06
  // IE00BM67HK77 : https://www.justetf.com/en/etf-profile.html?isin=IE00BM67HK77
  // LU1834986900 : https://www.justetf.com/en/etf-profile.html?isin=LU1834986900
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
        nom: 'iShares MSCI World Health Care Sector Advanced UCITS ETF',
        isin: 'IE00BJ5JNZ06',
        frais: formatEtfTer('IE00BJ5JNZ06'),

        differenciateur: 'santé mondiale, indice Advanced avec exclusions, CTO',
      }),
      createEtf({
        nom: 'Xtrackers MSCI World Health Care UCITS ETF',
        isin: 'IE00BM67HK77',
        frais: formatEtfTer('IE00BM67HK77'),

        differenciateur: 'santé mondiale, capitalisant, CTO',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe 600 Healthcare UCITS ETF',
        isin: 'LU1834986900',
        frais: formatEtfTer('LU1834986900'),

        differenciateur: 'santé européenne, éligible PEA',
      }),
    ],
    cloture:
      'Exposition mondiale ou européenne, avec ou sans exclusions dans l’indice : regarde les entreprises détenues et l’éligibilité PEA.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00B1XNHC34 : https://www.justetf.com/en/etf-profile.html?isin=IE00B1XNHC34
  // FR0010524777 : https://www.justetf.com/en/etf-profile.html?isin=FR0010524777
  // IE00BK5BCH80 : https://www.justetf.com/en/etf-profile.html?isin=IE00BK5BCH80
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

        differenciateur: 'indice mondial de l’énergie propre, CTO',
      }),
      createEtf({
        nom: 'Amundi MSCI New Energy UCITS ETF Dist',
        isin: 'FR0010524777',
        frais: formatEtfTer('FR0010524777'),

        differenciateur: 'indice MSCI New Energy filtré, distribuant, CTO',
      }),
      createEtf({
        nom: 'L&G Clean Energy UCITS ETF',
        isin: 'IE00BK5BCH80',
        frais: formatEtfTer('IE00BK5BCH80'),

        differenciateur: 'indice Solactive Clean Energy, frais les plus bas de ce trio, CTO',
      }),
    ],
    cloture:
      'Le crash de 2022 rappelle que les thématiques ESG concentrées peuvent être très volatiles — à doser en conséquence dans un portefeuille.',
    eligibilite: 'CTO uniquement',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00B8GKDB10 : https://www.justetf.com/en/etf-profile.html?isin=IE00B8GKDB10
  // IE00B9CQXS71 : https://www.justetf.com/en/etf-profile.html?isin=IE00B9CQXS71
  // IE00BZ56SW52 : https://www.justetf.com/en/etf-profile.html?isin=IE00BZ56SW52
  createTheme({
    id: 'dividendes',
    nom: 'Dividendes',
    emoji: '💵',
    hookAction: 'investir dans des entreprises qui versent des dividendes',
    hookDilemme: 'quel ETF à dividendes choisir',
    transition:
      'Rendement pur, croissance du dividende ou historique de hausses : ces 3 ETF n’ont pas la même méthodologie. Voici lesquels :',
    etfs: [
      createEtf({
        nom: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF',
        isin: 'IE00B8GKDB10',
        frais: formatEtfTer('IE00B8GKDB10'),

        differenciateur: 'rendement élevé, frais les plus bas de ce trio, CTO',
      }),
      createEtf({
        nom: 'SPDR S&P Global Dividend Aristocrats UCITS ETF',
        isin: 'IE00B9CQXS71',
        frais: formatEtfTer('IE00B9CQXS71'),

        // L'indice accepte les dividendes stables OU en hausse pendant 10 ans.
        // https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy
        differenciateur: 'dividende stable ou en hausse sur 10 ans, CTO',
      }),
      createEtf({
        nom: 'WisdomTree Global Quality Dividend Growth UCITS ETF',
        isin: 'IE00BZ56SW52',
        frais: formatEtfTer('IE00BZ56SW52'),

        differenciateur: 'qualité du dividende, part capitalisante, CTO',
      }),
    ],
    cloture:
      'Un rendement élevé n’est pas toujours signe de qualité — regarde la méthodologie de sélection avant le seul chiffre du yield.',
    eligibilite: 'CTO uniquement',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // LU2089238385 : https://www.justetf.com/en/etf-profile.html?isin=LU2089238385
  // FR0013411980 : https://www.justetf.com/en/etf-profile.html?isin=FR0013411980
  // FR0013411998 : https://www.justetf.com/en/etf-profile.html?isin=FR0013411998
  // LU1875395870 : https://www.justetf.com/en/etf-profile.html?isin=LU1875395870
  createTheme({
    id: 'japon',
    nom: 'Japon',
    emoji: '🇯🇵',
    hookAction: 'diversifier ton portefeuille sur le marché japonais',
    hookDilemme: 'quel ETF Japon choisir (et si la couverture de change compte)',
    transition:
      'TOPIX, Nikkei 225 ou indice large : le résultat dépend aussi de la couverture du yen. Voici quatre fonds :',
    etfs: [
      createEtf({
        nom: 'Amundi Prime Japan UCITS ETF',
        isin: 'LU2089238385',
        frais: formatEtfTer('LU2089238385'),

        differenciateur: 'grandes et moyennes capitalisations, frais les plus bas de ce quatuor, CTO',
      }),
      createEtf({
        nom: 'Amundi PEA Japan (TOPIX) UCITS ETF',
        isin: 'FR0013411980',
        frais: formatEtfTer('FR0013411980'),
        differenciateur: 'TOPIX en PEA, sans couverture du yen',
      }),
      createEtf({
        nom: 'Amundi PEA Japon (TOPIX) UCITS ETF EUR Hedged Acc',
        isin: 'FR0013411998',
        frais: formatEtfTer('FR0013411998'),
        // Fiche Amundi du 30/04/2026 : PEA, frais 0,48 %.
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260430

        differenciateur: 'TOPIX en PEA, couvert contre le yen',
      }),
      createEtf({
        nom: 'Xtrackers Nikkei 225 UCITS ETF',
        isin: 'LU1875395870',
        frais: formatEtfTer('LU1875395870'),

        // DWS : la part LU1875395870 est « 2D EUR Hedged », distributive.
        // https://etf.dws.com/download/asset/07d814c6-0032-4fc4-bc41-171c6dae90e4
        differenciateur: 'suit le Nikkei 225, couvert en euros, distribuant, CTO',
      }),
    ],
    cloture:
      'Couvert ou non contre le yen, en PEA ou non : ces critères comptent autant que le choix de l’indice sous-jacent.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE000YYE6WK5 : https://www.justetf.com/en/etf-profile.html?isin=IE000YYE6WK5
  // IE0002Y8CX98 : https://www.justetf.com/en/etf-profile.html?isin=IE0002Y8CX98
  // LU3038520774 : https://www.justetf.com/en/etf-profile.html?isin=LU3038520774
  // PEA (LU3038520774) : https://www.ca-sicavetfcp.fr/productsheet/view/idpart/382/idvm/LU3038520774/lg/fr/popup/1 (Non).
  createTheme({
    id: 'defense',
    nom: 'Défense',
    emoji: '🛡️',
    hookAction: 'investir sur la hausse des budgets de défense en Europe',
    hookDilemme: 'quel ETF Défense choisir',
    transition:
      'La hausse des budgets militaires attire de nouveaux fonds. Voici trois approches à comparer :',
    etfs: [
      createEtf({
        nom: 'VanEck Defense UCITS ETF',
        isin: 'IE000YYE6WK5',
        frais: formatEtfTer('IE000YYE6WK5'),

        differenciateur: 'exposition mondiale incluant les États-Unis, CTO',
      }),
      createEtf({
        nom: 'WisdomTree Europe Defence UCITS ETF',
        isin: 'IE0002Y8CX98',
        frais: formatEtfTer('IE0002Y8CX98'),

        differenciateur: 'défense européenne, non éligible PEA, CTO',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe Defense UCITS ETF',
        isin: 'LU3038520774',
        frais: formatEtfTer('LU3038520774'),

        differenciateur: 'défense européenne, non éligible PEA, frais les plus bas du trio',
      }),
    ],
    cloture:
      'Exposition mondiale ou 100% européenne, éligible PEA ou non : ces ETF récents n’ont pas tous le même profil de risque.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE0007Y8Y157 : https://www.justetf.com/en/etf-profile.html?isin=IE0007Y8Y157
  // IE000C6ITGC8 : https://www.justetf.com/en/etf-profile.html?isin=IE000C6ITGC8
  // IE000W8WMSL2 : https://www.justetf.com/en/etf-profile.html?isin=IE000W8WMSL2
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

        differenciateur: 'lancé en 2025, CTO',
      }),
      createEtf({
        nom: 'iShares Quantum Computing UCITS ETF',
        isin: 'IE000C6ITGC8',
        frais: formatEtfTer('IE000C6ITGC8'),

        differenciateur: 'compare le volume échangé et la fourchette achat/vente, CTO',
      }),
      createEtf({
        nom: 'WisdomTree Quantum Computing UCITS ETF',
        isin: 'IE000W8WMSL2',
        frais: formatEtfTer('IE000W8WMSL2'),

        differenciateur: 'indice co-développé avec Classiq, CTO',
      }),
    ],
    cloture:
      'Le thème est récent et concentré. Vérifie les entreprises réellement exposées au quantique et le risque que tu acceptes.',
    eligibilite: 'CTO pour les trois fonds présentés',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE000YU9K6K2 : https://www.justetf.com/en/etf-profile.html?isin=IE000YU9K6K2
  createTheme({
    id: 'spatial',
    nom: 'Spatial',
    emoji: '🚀',
    hookAction: 'investir sur la conquête spatiale et le New Space',
    hookDilemme: 'ce que détiennent les ETF spatiaux',
    // Nouveaux ETF spatiaux UCITS lancés en 2026, notamment iShares STRR et
    // WisdomTree WSPC : VanEck n'est plus l'unique option. Le fonds VanEck
    // reste la référence retenue ici, sans promettre un comparatif exhaustif.
    // https://www.ishares.com/uk/individual/en/products/351117/ishares-space-technologies-ucits-etf
    // https://www.wisdomtree.eu/en-gb/etfs/thematic/wspc---wisdomtree-space-economy-ucits-etf---usd-acc
    transition: 'De nouveaux ETF spatiaux UCITS sont arrivés en 2026. Voici une référence du secteur :',
    etfs: [
      createEtf({
        nom: 'VanEck Space Innovators UCITS ETF',
        isin: 'IE000YU9K6K2',
        frais: formatEtfTer('IE000YU9K6K2'),

        differenciateur: 'ETF spatial UCITS, CTO ; d’autres fonds sont arrivés en 2026',
      }),
    ],
    cloture:
      'Le thème reste concentré et volatil. Compare les entreprises détenues et la taille des nouveaux fonds avant de choisir.',
    eligibilite: 'CTO uniquement',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00BDFBTQ78 : https://www.justetf.com/en/etf-profile.html?isin=IE00BDFBTQ78
  // LU1834983550 : https://www.justetf.com/en/etf-profile.html?isin=LU1834983550
  // LU1834983634 : https://www.justetf.com/en/etf-profile.html?isin=LU1834983634
  // IE00BM67HS53 : https://www.justetf.com/en/etf-profile.html?isin=IE00BM67HS53
  createTheme({
    id: 'ressources-naturelles',
    nom: 'Ressources naturelles',
    emoji: '⛏️',
    hookAction: 't’exposer aux matières premières via les entreprises minières',
    hookDilemme: 'quel ETF ressources naturelles choisir',
    transition:
      'Mines, ressources et matériaux de base : ces ETF ne couvrent pas les mêmes entreprises. Voici 4 trackers :',
    etfs: [
      createEtf({
        nom: 'VanEck S&P Global Mining UCITS ETF',
        isin: 'IE00BDFBTQ78',
        frais: formatEtfTer('IE00BDFBTQ78'),

        differenciateur: 'entreprises minières mondiales, CTO',
      }),
      createEtf({
        // Fiche Amundi du 30/06/2026 : PEA oui, TER 0,30 %, indice
        // STOXX Europe 600 Basic Resources, swap.
        // https://www.amundietf.com/pdfDocuments/monthly-factsheet/LU1834983550/ENG/LUX/RETAIL/ETF/20260630
        nom: 'Amundi STOXX Europe 600 Basic Resources UCITS ETF',
        isin: 'LU1834983550',
        frais: formatEtfTer('LU1834983550'),

        differenciateur: 'ressources de base européennes, éligible PEA, réplication synthétique',
      }),
      createEtf({
        nom: 'Amundi STOXX Europe 600 Basic Materials UCITS ETF',
        isin: 'LU1834983634',
        frais: formatEtfTer('LU1834983634'),

        differenciateur: 'matériaux européens, éligible PEA ; vérifie la fourchette achat/vente',
      }),
      createEtf({
        nom: 'Xtrackers MSCI World Materials UCITS ETF',
        isin: 'IE00BM67HS53',
        frais: formatEtfTer('IE00BM67HS53'),

        differenciateur: 'matériaux mondiaux, frais les plus bas de ce quatuor, CTO',
      }),
    ],
    cloture:
      'Exposition mondiale, européenne (et PEA), ou ciblée matériaux : le choix dépend surtout de ton allocation géographique déjà en place.',
  }),
  // Contrôle des fiches par ISIN le 29/09/2026 : identité, indice et frais.
  // Les liens justETF ne prouvent pas à eux seuls l’éligibilité PEA ; vérifier celle-ci chez l’émetteur.
  // IE00B4ND3602 : https://www.justetf.com/en/etf-profile.html?isin=IE00B4ND3602
  // FR0013416716 : https://www.justetf.com/en/etf-profile.html?isin=FR0013416716
  // IE00B4NCWG09 : https://www.justetf.com/en/etf-profile.html?isin=IE00B4NCWG09
  // GB00B15KXQ89 : https://www.justetf.com/en/etf-profile.html?isin=GB00B15KXQ89
  createTheme({
    id: 'etc-metaux',
    nom: 'ETC (Or, Argent, Cuivre)',
    emoji: '🪙',
    hookAction: 'te protéger avec des matières premières physiques',
    hookDilemme: 'quel ETC choisir entre or, argent et cuivre',
    transition:
      'Ce ne sont pas des ETF actions mais des ETC (Exchange Traded Commodities), non éligibles au PEA. Voici les principaux :',
    etfs: [
      // Fiches émetteurs vérifiées le 28/09/2026. Les encours évoluent et les montants précédents
      // mélangeaient dates et devises : les omettre pour ce thème tant qu'une même date de
      // référence et une conversion documentée ne sont pas disponibles.
      // WisdomTree indique séparément 0,49 % de frais de gestion et 0,45 % de taux de swap annuel.
      createEtf({
        nom: 'iShares Physical Gold ETC',
        isin: 'IE00B4ND3602',
        frais: formatEtfTer('IE00B4ND3602'),
        differenciateur: 'adossé à de l’or physique',
      }),
      createEtf({
        nom: 'Amundi Physical Gold ETC',
        isin: 'FR0013416716',
        frais: formatEtfTer('FR0013416716'),
        differenciateur: 'adossé à de l’or physique ; émetteur de droit irlandais',
      }),
      createEtf({
        nom: 'iShares Physical Silver ETC',
        isin: 'IE00B4NCWG09',
        frais: formatEtfTer('IE00B4NCWG09'),
        differenciateur: 'adossé à de l’argent physique',
      }),
      createEtf({
        nom: 'WisdomTree Copper',
        isin: 'GB00B15KXQ89',
        isCopperEtc: true,
        frais: formatEtfTer('GB00B15KXQ89'),
        differenciateur: 'contrats à terme sur le cuivre via swap ; taux de swap annuel : 0,45 %',
      }),
    ],
    cloture:
      'Les trois premiers ETC sont adossés à du métal physique. Le produit cuivre présenté suit des contrats à terme via un swap : regarde la structure et les coûts avant de comparer.',
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
    cloture: 'Un gros dividende ne garantit pas une meilleure performance. Vérifie aussi si la part verse les revenus ou les réinvestit.',
    ctaEngagement: 'Tu veux recevoir les dividendes ou les voir réinvestis automatiquement ?',
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
    accroche: '🚀 Un ETF spatial peut mêler satellites, lanceurs et équipementiers. Que détient-il vraiment ?',
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
