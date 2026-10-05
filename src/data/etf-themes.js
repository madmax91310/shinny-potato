import { getInstrumentName, affirmInstrumentPea } from './instruments.js';
import { formatEtfTer } from './etf-ter.js';
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
        nom: getInstrumentName("IE00BD4TXV59", "tweet"),
        isin: 'IE00BD4TXV59',
        frais: formatEtfTer('IE00BD4TXV59'),

        differenciateur: 'MSCI World, réplication physique complète, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00BK5BQT80", "tweet"),
        isin: 'IE00BK5BQT80',
        frais: formatEtfTer('IE00BK5BQT80'),

        // L'indice FTSE All-World couvre les grandes et moyennes capitalisations,
        // pas les small caps (document du fonds Vanguard, ISIN IE00BK5BQT80).
        differenciateur: 'grandes et moyennes capitalisations, pays développés + émergents, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00B44Z5B48", "tweet"),
        isin: 'IE00B44Z5B48',
        frais: formatEtfTer('IE00B44Z5B48'),

        differenciateur: 'MSCI ACWI, pays développés et émergents, CTO',
      }),
      createEtf({
        nom: getInstrumentName("FR001400U5Q4", "tweet"),
        isin: 'FR001400U5Q4',
        frais: formatEtfTer('FR001400U5Q4'),

        // Vérifié le 27/09/2026 : CW8 (LU1681043599) et WPEA (IE0002XZSHO1)
        // sont également éligibles PEA. Sources émetteurs :
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681043599/ENG/FRA/INSTITUTIONNEL/ETF/20260228
        // https://www.ishares.com/ch/professionals/en/products/335178/ishares-msci-world-swap-pea-ucits-etf
        differenciateur: affirmInstrumentPea('FR001400U5Q4', true, 'MSCI World éligible PEA, réplication synthétique'),
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
        nom: getInstrumentName("IE000XZSV718", "tweet"),
        isin: 'IE000XZSV718',
        frais: formatEtfTer('IE000XZSV718'),

        differenciateur: 'S&P 500, réplication physique, CTO',
      }),
      createEtf({
        nom: getInstrumentName("FR0011871128", "tweet"),
        isin: 'FR0011871128',
        frais: formatEtfTer('FR0011871128'),

        differenciateur: affirmInstrumentPea('FR0011871128', true, 'S&P 500 éligible PEA ; part créée en 2014'),
      }),
      createEtf({
        // BlackRock, page produit au 25/09/2026 : TER 0,10 %.
        // Fonds lancé le 29/05/2025, sans 2023/2024 calendaires. Sa notice
        // précise qu'il entend conserver son éligibilité au PEA.
        // https://www.blackrock.com/fr/intermediaries/products/342916/
        nom: getInstrumentName("IE000DQLYVB9", "tweet"),
        isin: 'IE000DQLYVB9',
        frais: formatEtfTer('IE000DQLYVB9'),

        differenciateur: affirmInstrumentPea('IE000DQLYVB9', true, 'S&P 500 éligible PEA ; part créée en 2025'),
      }),
      createEtf({
        nom: getInstrumentName("FR0011871110", "tweet"),
        isin: 'FR0011871110',
        frais: formatEtfTer('FR0011871110'),

        // La part S FR001400ZGR7 de la même gamme est aussi affichée dans
        // la gamme PEA Amundi (27/09/2026) : éviter toute exclusivité de part.
        // https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-pea-nasdaq100-ucits-etf-s-acc/fr001400zgr7
        differenciateur: affirmInstrumentPea('FR0011871110', true, 'Nasdaq-100 éligible PEA, exposition concentrée'),
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
        nom: getInstrumentName("IE00B4K48X80", "tweet"),
        isin: 'IE00B4K48X80',
        frais: formatEtfTer('IE00B4K48X80'),

        differenciateur: 'MSCI Europe, grandes et moyennes capitalisations, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00B53L3W79", "tweet"),
        isin: 'IE00B53L3W79',
        frais: formatEtfTer('IE00B53L3W79'),

        // Contrôle individuel du 29/09/2026 : Bourse Direct affiche cette part
        // comme éligible et justETF France la classe aussi parmi les ETF PEA.
        // La fiche émetteur ne l'explicite pas ; voir instrument-pea.js.
        differenciateur: affirmInstrumentPea('IE00B53L3W79', true, '50 grandes valeurs de la zone euro, éligible PEA selon Bourse Direct et justETF'),
      }),
      createEtf({
        nom: getInstrumentName("FR0011550193", "tweet"),
        isin: 'FR0011550193',
        frais: formatEtfTer('FR0011550193'),

        differenciateur: affirmInstrumentPea('FR0011550193', true, 'STOXX Europe 600, éligible PEA'),
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
        nom: getInstrumentName("LU1834988518", "tweet"),
        isin: 'LU1834988518',
        frais: formatEtfTer('LU1834988518'),

        differenciateur: affirmInstrumentPea('LU1834988518', true, 'STOXX Europe 600 Technology, éligible PEA'),
      }),
      createEtf({
        nom: getInstrumentName("DE000A0H08Q4", "tweet"),
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
        nom: getInstrumentName("IE00BKM4GZ66", "tweet"),
        isin: 'IE00BKM4GZ66',
        frais: formatEtfTer('IE00BKM4GZ66'),

        differenciateur: 'très large, small et mid caps incluses, CTO',
      }),
      createEtf({
        nom: getInstrumentName("FR0013412020", "tweet"),
        isin: 'FR0013412020',
        frais: formatEtfTer('FR0013412020'),

        differenciateur: affirmInstrumentPea('FR0013412020', true, 'éligible PEA, indice MSCI Emerging Markets filtré ESG'),
      }),
      createEtf({
        nom: getInstrumentName("IE00BTJRMP35", "tweet"),
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
        nom: getInstrumentName("LU1681048630", "tweet"),
        isin: 'LU1681048630',
        frais: formatEtfTer('LU1681048630'),
        differenciateur: 'suit l’indice S&P Global Luxury, CTO',
      }),
      createEtf({
        nom: getInstrumentName("FR001400S9V0", "tweet"),
        isin: 'FR001400S9V0',
        frais: formatEtfTer('FR001400S9V0'),

        differenciateur: affirmInstrumentPea('FR001400S9V0', true, 'exposition au luxe mondial, éligible PEA'),
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
        nom: getInstrumentName("IE00BGV5VN51", "tweet"),
        isin: 'IE00BGV5VN51',
        frais: formatEtfTer('IE00BGV5VN51'),

        differenciateur: 'IA et Big Data, frais les plus bas de ce trio, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00BK5BCD43", "tweet"),
        isin: 'IE00BK5BCD43',
        frais: formatEtfTer('IE00BK5BCD43'),
        differenciateur: 'indice ROBO Global Artificial Intelligence, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00BYZK4552", "tweet"),
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
        nom: getInstrumentName("IE00BJ5JNZ06", "tweet"),
        isin: 'IE00BJ5JNZ06',
        frais: formatEtfTer('IE00BJ5JNZ06'),

        differenciateur: 'santé mondiale, indice Advanced avec exclusions, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00BM67HK77", "tweet"),
        isin: 'IE00BM67HK77',
        frais: formatEtfTer('IE00BM67HK77'),

        differenciateur: 'santé mondiale, capitalisant, CTO',
      }),
      createEtf({
        nom: getInstrumentName("LU1834986900", "tweet"),
        isin: 'LU1834986900',
        frais: formatEtfTer('LU1834986900'),

        differenciateur: affirmInstrumentPea('LU1834986900', true, 'santé européenne, éligible PEA'),
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
        nom: getInstrumentName("IE00B1XNHC34", "tweet"),
        isin: 'IE00B1XNHC34',
        frais: formatEtfTer('IE00B1XNHC34'),

        differenciateur: 'indice mondial de l’énergie propre, CTO',
      }),
      createEtf({
        nom: getInstrumentName("FR0010524777", "tweet"),
        isin: 'FR0010524777',
        frais: formatEtfTer('FR0010524777'),

        differenciateur: 'indice MSCI New Energy filtré, distribuant, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00BK5BCH80", "tweet"),
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
        nom: getInstrumentName("IE00B8GKDB10", "tweet"),
        isin: 'IE00B8GKDB10',
        frais: formatEtfTer('IE00B8GKDB10'),

        differenciateur: 'rendement élevé, frais les plus bas de ce trio, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00B9CQXS71", "tweet"),
        isin: 'IE00B9CQXS71',
        frais: formatEtfTer('IE00B9CQXS71'),

        // L'indice accepte les dividendes stables OU en hausse pendant 10 ans.
        // https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy
        differenciateur: 'dividende stable ou en hausse sur 10 ans, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE00BZ56SW52", "tweet"),
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
        nom: getInstrumentName("LU2089238385", "tweet"),
        isin: 'LU2089238385',
        frais: formatEtfTer('LU2089238385'),

        differenciateur: 'grandes et moyennes capitalisations, frais les plus bas de ce quatuor, CTO',
      }),
      createEtf({
        nom: getInstrumentName("FR0013411980", "tweet"),
        isin: 'FR0013411980',
        frais: formatEtfTer('FR0013411980'),
        differenciateur: affirmInstrumentPea('FR0013411980', true, 'TOPIX en PEA, sans couverture du yen'),
      }),
      createEtf({
        nom: getInstrumentName("FR0013411998", "tweet"),
        isin: 'FR0013411998',
        frais: formatEtfTer('FR0013411998'),
        // Fiche Amundi du 30/04/2026 : PEA, frais 0,48 %.
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260430

        differenciateur: affirmInstrumentPea('FR0013411998', true, 'TOPIX en PEA, couvert contre le yen'),
      }),
      createEtf({
        nom: getInstrumentName("LU1875395870", "tweet"),
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
        nom: getInstrumentName("IE000YYE6WK5", "tweet"),
        isin: 'IE000YYE6WK5',
        frais: formatEtfTer('IE000YYE6WK5'),

        differenciateur: 'exposition mondiale incluant les États-Unis, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE0002Y8CX98", "tweet"),
        isin: 'IE0002Y8CX98',
        frais: formatEtfTer('IE0002Y8CX98'),

        differenciateur: affirmInstrumentPea('IE0002Y8CX98', false, 'défense européenne, non éligible PEA, CTO'),
      }),
      createEtf({
        nom: getInstrumentName("LU3038520774", "tweet"),
        isin: 'LU3038520774',
        frais: formatEtfTer('LU3038520774'),

        differenciateur: affirmInstrumentPea('LU3038520774', false, 'défense européenne, non éligible PEA, frais les plus bas du trio'),
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
        nom: getInstrumentName("IE0007Y8Y157", "tweet"),
        isin: 'IE0007Y8Y157',
        frais: formatEtfTer('IE0007Y8Y157'),

        differenciateur: 'lancé en 2025, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE000C6ITGC8", "tweet"),
        isin: 'IE000C6ITGC8',
        frais: formatEtfTer('IE000C6ITGC8'),

        differenciateur: 'informatique quantique, CTO',
      }),
      createEtf({
        nom: getInstrumentName("IE000W8WMSL2", "tweet"),
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
        nom: getInstrumentName("IE000YU9K6K2", "tweet"),
        isin: 'IE000YU9K6K2',
        frais: formatEtfTer('IE000YU9K6K2'),

        differenciateur: 'ETF spatial UCITS, CTO',
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
        nom: getInstrumentName("IE00BDFBTQ78", "tweet"),
        isin: 'IE00BDFBTQ78',
        frais: formatEtfTer('IE00BDFBTQ78'),

        differenciateur: 'entreprises minières mondiales, CTO',
      }),
      createEtf({
        // Fiche Amundi du 30/06/2026 : PEA oui, TER 0,30 %, indice
        // STOXX Europe 600 Basic Resources, swap.
        // https://www.amundietf.com/pdfDocuments/monthly-factsheet/LU1834983550/ENG/LUX/RETAIL/ETF/20260630
        nom: getInstrumentName("LU1834983550", "tweet"),
        isin: 'LU1834983550',
        frais: formatEtfTer('LU1834983550'),

        differenciateur: affirmInstrumentPea('LU1834983550', true, 'ressources de base européennes, éligible PEA, réplication synthétique'),
      }),
      createEtf({
        nom: getInstrumentName("LU1834983634", "tweet"),
        isin: 'LU1834983634',
        frais: formatEtfTer('LU1834983634'),

        differenciateur: affirmInstrumentPea('LU1834983634', true, 'matériaux européens, éligible PEA'),
      }),
      createEtf({
        nom: getInstrumentName("IE00BM67HS53", "tweet"),
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
        nom: getInstrumentName("IE00B4ND3602", "tweet"),
        isin: 'IE00B4ND3602',
        frais: formatEtfTer('IE00B4ND3602'),
        differenciateur: 'adossé à de l’or physique',
      }),
      createEtf({
        nom: getInstrumentName("FR0013416716", "tweet"),
        isin: 'FR0013416716',
        frais: formatEtfTer('FR0013416716'),
        differenciateur: 'adossé à de l’or physique ; émetteur de droit irlandais',
      }),
      createEtf({
        nom: getInstrumentName("IE00B4NCWG09", "tweet"),
        isin: 'IE00B4NCWG09',
        frais: formatEtfTer('IE00B4NCWG09'),
        differenciateur: 'adossé à de l’argent physique',
      }),
      createEtf({
        nom: getInstrumentName("GB00B15KXQ89", "tweet"),
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

// Texte propre à chaque famille ; caractéristiques et frais restent dans les registres partagés.
const EDITORIAL = {
  "monde": {
    transition: "Quatre ETF pour les marchés mondiaux, avec ou sans pays émergents.",
    cloture: "Le MSCI World couvre les marchés développés. Les indices ACWI et FTSE All-World incluent aussi les émergents. Parmi ces quatre produits, Amundi PEA Monde est éligible au PEA.",
    ctaEngagement: "Ton ETF mondial inclut les émergents ou tu les ajoutes séparément ?",
  },
  "usa": {
    transition: "Quatre ETF sur les actions américaines : S&P 500 ou Nasdaq-100.",
    cloture: () => `Trois ETF suivent le S&P 500 ; le quatrième suit le Nasdaq-100. Sur le S&P 500 en PEA, iShares affiche ${formatEtfTer('IE000DQLYVB9')} % de frais annuels, contre ${formatEtfTer('FR0011871128')} % pour Amundi.`,
    ctaEngagement: "Pour les actions américaines, tu détiens un S&P 500 ou un Nasdaq-100 ?",
  },
  "europe": {
    transition: "Trois ETF pour les actions européennes, avec des périmètres différents.",
    cloture: "Le MSCI Europe et le STOXX Europe 600 couvrent plusieurs marchés européens. L’EURO STOXX 50 se limite à la zone euro. Les produits BNP Paribas et iShares EURO STOXX 50 de cette liste sont éligibles au PEA.",
    ctaEngagement: "Tu préfères une exposition à toute l’Europe ou uniquement à la zone euro ?",
  },
  "tech-europe": {
    transition: "Deux ETF sur le secteur technologique européen.",
    cloture: () => `Ces deux ETF suivent le STOXX Europe 600 Technology. Amundi affiche ${formatEtfTer('LU1834988518')} % de frais annuels et une éligibilité PEA ; iShares affiche ${formatEtfTer('DE000A0H08Q4')} %.`,
    ctaEngagement: "Pour ce secteur, tu passes par le PEA ou le compte-titres ?",
  },
  "emergents": {
    transition: "Trois ETF sur les marchés émergents.",
    cloture: "L’iShares Core MSCI EM IMI inclut les petites capitalisations. Le produit Amundi est éligible au PEA et applique des filtres ESG. Les univers suivis ne sont donc pas identiques.",
    ctaEngagement: "Tu privilégies les petites capitalisations ou une exposition émergents dans le PEA ?",
  },
  "luxe": {
    transition: "Deux ETF Amundi pour les entreprises du luxe.",
    cloture: "Amundi Global Luxury suit le S&P Global Luxury. Amundi PEA Luxe Monde permet une exposition au luxe dans le PEA. Le périmètre de l’indice et l’enveloppe distinguent ces deux produits.",
    ctaEngagement: "Ton exposition au luxe est dans le PEA ou le compte-titres ?",
  },
  "ia-robotique": {
    transition: "Trois ETF dédiés à l’intelligence artificielle et à la robotique.",
    cloture: "Xtrackers cible l’IA et le big data. L&G suit le ROBO Global Artificial Intelligence ; iShares suit l’iSTOXX FactSet Automation & Robotics. Les trois produits couvrent des univers différents.",
    ctaEngagement: "Tu recherches surtout l’IA, le big data ou la robotique ?",
  },
  "sante": {
    transition: "Trois ETF sur la santé, à l’échelle mondiale ou européenne.",
    cloture: "Les produits iShares et Xtrackers ciblent la santé mondiale. Amundi suit le secteur santé du STOXX Europe 600 et est éligible au PEA. Le produit iShares applique des exclusions dans son indice Advanced.",
    ctaEngagement: "Pour la santé, tu préfères une exposition mondiale ou européenne dans le PEA ?",
  },
  "renouvelables": {
    transition: "Trois ETF sur les entreprises de l’énergie propre et des nouvelles énergies.",
    cloture: "Les indices suivis diffèrent : Global Clean Energy Transition, MSCI New Energy et Solactive Clean Energy. La part Amundi présentée distribue les revenus. L&G affiche les frais les plus bas de cette sélection.",
    ctaEngagement: "Tu privilégies quel indice pour les énergies propres ?",
  },
  "dividendes": {
    transition: "Trois ETF avec des méthodes de sélection fondées sur les dividendes.",
    cloture: "Vanguard cible le rendement des dividendes. SPDR sélectionne des entreprises ayant maintenu ou augmenté leurs dividendes pendant au moins dix ans. WisdomTree combine qualité et croissance des dividendes ; sa part présentée est capitalisante.",
    ctaEngagement: "Tu cherches des revenus versés ou des dividendes réinvestis ?",
  },
  "japon": {
    transition: "Quatre ETF pour les actions japonaises, avec ou sans couverture du yen.",
    cloture: "Deux parts Amundi suivent le TOPIX dans le PEA : l’une sans couverture, l’autre couverte en euros. Le produit Xtrackers suit le Nikkei 225 avec couverture en euros. Ces choix changent l’indice suivi et l’exposition au yen.",
    ctaEngagement: "Pour le Japon, tu gardes l’exposition au yen ou tu choisis une part couverte ?",
  },
  "defense": {
    transition: "Trois ETF sur la défense mondiale ou européenne.",
    cloture: "VanEck couvre la défense mondiale, y compris les entreprises américaines. WisdomTree et Amundi ciblent l’Europe. Amundi affiche les frais les plus bas de ce trio.",
    ctaEngagement: "Pour la défense, tu préfères une exposition européenne ou mondiale ?",
  },
  "quantique": {
    transition: "Trois ETF sur le thème de l’informatique quantique.",
    cloture: "VanEck suit le MarketVector Global Quantum Leaders. WisdomTree utilise un indice développé avec Classiq. Le thème commun ne signifie pas que les fonds suivent le même indice.",
    ctaEngagement: "Tu regardes d’abord l’indice suivi ou les entreprises détenues pour ce thème ?",
  },
  "spatial": {
    transition: "Un ETF de la sélection consacré à l’industrie spatiale.",
    cloture: "VanEck Space Innovators suit le MarketVector Global Space Industry Screened. La part présentée est capitalisante et utilise une réplication physique intégrale.",
    ctaEngagement: "Dans le spatial, quelle activité t’intéresse le plus : satellites, lanceurs ou équipements ?",
  },
  "ressources-naturelles": {
    transition: "Quatre ETF sur les entreprises minières, les ressources de base et les matériaux.",
    cloture: "VanEck et Xtrackers offrent une exposition mondiale. Les deux produits Amundi ciblent l’Europe et sont éligibles au PEA. Ces ETF détiennent des actions d’entreprises ; ils ne suivent pas directement le prix des métaux.",
    ctaEngagement: "Tu recherches les entreprises du secteur ou une exposition directe aux métaux ?",
  },
  "etc-metaux": {
    transition: "Quatre ETC pour une exposition à l’or, à l’argent ou au cuivre.",
    cloture: "Les deux produits or et le produit argent sont adossés à du métal physique. WisdomTree Copper suit des contrats à terme via swap : ses 0,49 % de frais de gestion s’accompagnent d’un taux de swap annuel de 0,45 %. Ces produits sont des ETC, non éligibles au PEA.",
    ctaEngagement: "Tu recherches une exposition à l’or, à l’argent ou au cuivre ?",
  },
}

const existingThemes = BASE_THEMES.map((theme) => ({
  ...theme,
  ...EDITORIAL[theme.id],
  cloture: typeof EDITORIAL[theme.id].cloture === 'function'
    ? EDITORIAL[theme.id].cloture()
    : EDITORIAL[theme.id].cloture,
}))

// Extension du 02/10/2026 : identité, frais et caractéristiques issus des registres communs.
const reusedTheme = (id, nom, emoji, transition, products, cloture, question) => createTheme({
  id, nom, emoji, transition, cloture, ctaEngagement: question,
  etfs: products.map(([isin, differenciateur]) => createEtf({ isin,
    nom: getInstrumentName(isin, 'tweet'), frais: formatEtfTer(isin), differenciateur })),
})
export const DEFAULT_THEMES = [...existingThemes,
 reusedTheme('jeux-video','Jeux vidéo et eSport','🎮','Un thème lié aux jeux vidéo : voici une exposition dédiée, distincte de toute la technologie.',
  [['IE00BYWQWR46','Éditeurs, développeurs et activités liées aux jeux vidéo et à l’eSport ; panier concentré.']],
  'Ce fonds cible une industrie précise. Ses principaux pays sont le Japon, les États-Unis et la Chine dans la photographie du 31 août 2026 ; son histoire comprend un changement d’indice en décembre 2022.', 'Tu ferais une place aux entreprises du jeu vidéo ?'),
 reusedTheme('innovation-medicale','Santé, innovation médicale ou biotech','🏥','Le secteur santé entier, l’innovation dans les soins ou les seules biotechnologies américaines ?',
  [['IE00BJ5JNZ06','Secteur santé des marchés développés, selon l’indice Advanced suivi.'],['IE00BYZK4776','STOXX Global Breakthrough Healthcare : sélection liée à l’innovation médicale.'],['IE00BYXG2H39','Nasdaq Biotechnology : entreprises de biotechnologie et pharmaceutiques cotées au Nasdaq.']],
  'La santé large, l’innovation médicale et la biotechnologie suivent des univers différents. Ajouter plusieurs fonds ne garantit pas que leurs entreprises ou leurs risques ne se recouvrent pas.', 'Tu privilégies le secteur entier ou une sélection spécialisée ?'),
 reusedTheme('emergents-avec-sans-chine','Émergents avec ou sans Chine','🌏','Retirer la Chine des émergents : qu’est-ce qui change dans le panier ?',
  [['IE00BKM4GZ66','MSCI EM IMI : Chine incluse, grandes, moyennes et petites entreprises.'],['IE00BMG6Z448','MSCI EM ex-China : Chine exclue, grandes et moyennes entreprises.']],
  'La différence concerne aussi les tailles : EM IMI inclut les petites capitalisations. Exclure la Chine augmente mécaniquement la place relative des autres pays ; cela ne supprime pas leurs risques.', 'Tu gardes la Chine dans ton exposition émergente ?'),
 reusedTheme('immobilier-infrastructures','Immobilier coté ou infrastructures','🏗️','Deux façons de cibler des entreprises liées aux actifs réels : que détiens-tu ?',
  [['IE00B1FZS350','Immobilier coté des pays développés avec filtre de rendement des dividendes.'],['IE00B1FZS467','Entreprises d’infrastructures mondiales selon le FTSE Global Core Infrastructure.']],
  'Ces fonds détiennent des actions : leur prix peut baisser. L’immobilier coté et les infrastructures ne constituent pas la même activité et restent sensibles, notamment, aux taux et au financement.', 'Tu choisirais l’immobilier coté ou les infrastructures ?'),

 reusedTheme('monde-toutes-tailles','World, ACWI ou ACWI IMI','🌍','Un ETF mondial : pays développés seuls, avec les émergents, ou avec les petites entreprises aussi ?',
  [['IE00B4L5Y983','MSCI World : grandes et moyennes entreprises des pays développés.'],['IE00B6R52259','MSCI ACWI : développés et émergents, grandes et moyennes.'],['IE00B3YLTY66','MSCI ACWI IMI : développés et émergents, grandes, moyennes et petites.']],
  'Trois univers différents. L’ACWI IMI ajoute les petites capitalisations, sans leur donner le même poids qu’aux géants.', 'Tu choisirais quelle couverture mondiale ?'),
 reusedTheme('world-avec-sans-usa','World avec ou sans États-Unis','🌍','Garder les États-Unis au poids du World, ou les séparer du reste des marchés développés ?',
  [['IE00B4L5Y983','MSCI World : pays développés, États-Unis inclus.'],['IE0006WW1TQ4','MSCI World ex USA : les mêmes tailles d’entreprises, hors États-Unis.']],
  'Retirer les États-Unis change le périmètre géographique. Les émergents et petites capitalisations restent absents des deux indices.', 'Tu réglerais toi-même le poids américain ?'),
 reusedTheme('grandes-petites-monde','Grandes ou petites entreprises mondiales','🔎','Ton World ne couvre pas les petites entreprises. Qu’apporte une seconde ligne ?',
  [['IE00B4L5Y983','MSCI World : grandes et moyennes entreprises des pays développés.'],['IE00BF4RFH31','MSCI World Small Cap : petites entreprises des pays développés.']],
  'Les petites capitalisations complètent une tranche de taille ; elles restent exposées aux baisses des actions et aux devises.', 'Tu ajouterais des petites entreprises à ton World ?'),
  reusedTheme('financieres', 'Financières américaines ou mondiales', '🏦',
    'Tu veux renforcer la finance : seulement aux États-Unis, ou dans plusieurs pays développés ?',
    [['IE00B4JNQZ49', 'Secteur financier américain ; exposition concentrée sur un pays.'],
     ['IE00BJ5JP097', 'Secteur financier des pays développés ; part distribuante.']],
    'Deux périmètres différents. Le fonds mondial peut aussi détenir des entreprises américaines ; choisir les deux ne garantit pas une nouvelle diversification.',
    'Tu choisirais une exposition américaine ou mondiale ?'),
  reusedTheme('semiconducteurs-tech', 'Semi-conducteurs ou technologie mondiale', '💻',
    'Toute la technologie mondiale, ou un pari plus ciblé sur les semi-conducteurs ?',
    [['IE000I8KRLL9', 'Entreprises mondiales des semi-conducteurs ; exposition spécialisée.'],
     ['IE00BJ5JNY98', 'Secteur technologique des pays développés ; exposition plus large.']],
    'Les deux fonds peuvent détenir les mêmes entreprises. Les semi-conducteurs ciblent une industrie, tandis que la technologie couvre un secteur plus large.',
    'Tu préfères le secteur entier ou une industrie précise ?'),
  reusedTheme('blockchain', 'Entreprises de la blockchain', '🔗',
    'Un ETF blockchain détient des actions. Voici le produit déjà présent dans notre sélection.',
    [['IE000RDRMSD1', 'Actions d’entreprises liées à la blockchain ; aucune détention directe de Bitcoin.']],
    'Ce fonds expose à des entreprises, avec leurs risques propres. Sa performance n’est pas celle du Bitcoin et le thème peut connaître de fortes variations.',
    'Tu recherches les entreprises du secteur ou la cryptomonnaie elle-même ?'),
]
