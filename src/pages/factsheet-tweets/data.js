import { getIndexComposition, getIndexFacts } from '../../data/index-facts.js'
import { getInstrumentFactsheetReturns } from '../../data/instrument-comparator-returns.js'
// Relevé de fiches officielles, figé au 31 août 2026 (au 30 juin pour deux fonds).
// Composition = indice sous-jacent, jamais les titres détenus par le fonds synthétique.
// Les rendements du fonds sont les lignes « Portefeuille » des tableaux Amundi.
const emFund = 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF/20260630'

export const SHEETS = [
  // Ajouts du 27/09/2026. Composition et performances ont des sources et des
  // dates propres : l'indice n'est jamais assimilé à l'ETF synthétique.
  {
    ...getIndexComposition('em-standard', '2026-08-31'),
    id: 'em-standard', title: 'MSCI Emerging Markets', index: 'MSCI Emerging Markets', snapshot: '31 août 2026',
    source: [getIndexFacts('em-standard', '2026-08-31').source],
    intro: 'Le MSCI Emerging Markets ne se résume plus à la Chine. Regarde où se concentre son poids 🌏',
    returns: [[2025, 33.57], [2024, 7.50], [2023, 9.83], [2022, -20.09], [2021, -2.54]],
    performance: { kind: 'indice', detail: 'MSCI Emerging Markets, rendements nets en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 9.29 },
    insight: 'Taïwan et la Corée du Sud pèsent ensemble près de la moitié de l’indice. Trois entreprises technologiques représentent déjà plus d’un quart du panier.',
    takeaway: 'L’indice couvre de nombreux pays, mais son poids dépend fortement des semi-conducteurs. Un ETF émergents filtré ESG peut avoir une composition différente.',
  },
  {
    ...getIndexComposition('topix', '2026-04-30'),
    id: 'topix', title: 'TOPIX', index: 'TOPIX', snapshot: '30 avril 2026',
    source: [
      getIndexFacts('topix', '2026-04-30').source,
      { label: 'Méthode de pondération · JPX', url: 'https://www.jpx.co.jp/english/markets/indices/topix/' },
      { label: 'Rendements de la part PEA non couverte · Amundi', url: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411980/FRA/FRA/INSTITUTIONNEL/ETF/20260430' },
    ],
    intro: 'Pour investir au Japon, le TOPIX va bien au-delà des 225 valeurs du Nikkei 🇯🇵',
    isin: 'FR0013411980', returns: getInstrumentFactsheetReturns('FR0013411980'),
    performance: { kind: 'ETF', detail: 'part Amundi PEA Japon TOPIX non couverte, rendement du portefeuille en euros, net de frais', date: '30 avril 2026', historyNote: 'Les rendements ci-dessus sont ceux de l’ETF en euros, pas de l’indice TOPIX en yens. La composition de l’indice est datée d’avril 2026.' },
    insight: 'Toyota et les banques ont un poids important. Le TOPIX est pondéré par capitalisation flottante, contrairement au Nikkei 225 pondéré par le prix des actions.',
    takeaway: 'La part TOPIX PEA non couverte reste exposée au change yen/euro. Une autre part PEA couverte existe, avec des frais différents.',
  },
  {
    ...getIndexComposition('nikkei225', '2026-08-31'),
    id: 'nikkei225', title: 'Nikkei 225', index: 'Nikkei 225', snapshot: '31 août 2026',
    source: [
      getIndexFacts('nikkei225', '2026-08-31').source,
      { label: 'Rendements de la part 1C JPY · DWS', url: 'https://etf.dws.com/Download/Past%20Performance/LU2196470426/FR/FR' },
    ],
    intro: 'Le Nikkei 225 ne donne pas le plus de poids aux entreprises les plus grosses. Voici sa vraie logique 🇯🇵',
    isin: 'LU2196470426', returns: getInstrumentFactsheetReturns('LU2196470426'),
    performance: { kind: 'ETF', detail: 'part Xtrackers Nikkei 225 1C en yens, rendement du fonds net de frais, dividendes réinvestis', date: '31 décembre 2025', historyNote: 'Les poids sont ceux de l’indice au 31 août 2026 ; les rendements sont ceux de la part 1C en yens, pas une performance convertie en euros.' },
    insight: 'Advantest, Fast Retailing et Tokyo Electron dépassent ensemble 29 % de l’indice. La technologie pesait plus de 55 % au 31 août 2026.',
    takeaway: 'Malgré ses 225 actions, le Nikkei est très sensible à quelques titres dont le prix ajusté est élevé. La comparaison avec un ETF TOPIX en euros exige de tenir compte du change.',
  },
  {
    ...getIndexComposition('acwi', '2026-08-31'),
    id: 'acwi', title: 'MSCI ACWI', index: 'MSCI ACWI', snapshot: '31 août 2026', source: [getIndexFacts('acwi', '2026-08-31').source],
    intro: 'Tu connais le MSCI World. Le MSCI ACWI va plus loin en ajoutant les marchés émergents 🌍',
    returns: [[2025, 22.87], [2024, 18.02], [2023, 22.81], [2022, -17.96], [2021, 19.04]], performance: { kind: 'indice', detail: 'MSCI ACWI, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 13.12 },
    insight: 'Les émergents entrent dans le panier, mais les États-Unis représentent encore près de 64 % de l’indice.',
    takeaway: 'Le MSCI ACWI couvre davantage de marchés que le MSCI World. « Tous pays » ne signifie pas « tous les titres » : les petites capitalisations restent à part.',
  },
  {
    ...getIndexComposition('ftse-all-world', '2026-08-31'),
    id: 'ftse-all-world', title: 'FTSE All-World', index: 'FTSE All-World', snapshot: '31 août 2026', source: [getIndexFacts('ftse-all-world', '2026-08-31').source],
    intro: 'Un autre indice permet de suivre les marchés développés et émergents : le FTSE All-World 🌍',
    returns: [[2025, 23.1], [2024, 17.7], [2023, 22.6], [2022, -17.7], [2021, 18.9]], performance: { kind: 'indice', detail: 'FTSE All-World, rendement total en dollars, dividendes réinvestis ; secteurs selon la classification ICB de FTSE', date: '31 août 2026', annualizedFiveYear: 11.4 },
    insight: 'Plus de 4 200 valeurs, mais les États-Unis pèsent toujours près de 62 %. Le nombre de titres ne dit pas tout de leur poids.',
    takeaway: 'Il inclut les marchés émergents et les grandes et moyennes capitalisations. Ses secteurs ICB ne sont pas directement comparables aux secteurs GICS des fiches MSCI.',
  },
  {
    ...getIndexComposition('world-small-cap', '2026-08-31'),
    id: 'world-small-cap', title: 'MSCI World Small Cap', index: 'MSCI World Small Cap', snapshot: '31 août 2026', source: [getIndexFacts('world-small-cap', '2026-08-31').source],
    intro: 'Le MSCI World laisse de côté les petites capitalisations. Le MSCI World Small Cap leur est consacré 🔎',
    returns: [[2025, 20.44], [2024, 8.65], [2023, 16.34], [2022, -18.37], [2021, 16.18]], performance: { kind: 'indice', detail: 'MSCI World Small Cap, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 10.80 },
    insight: 'Les dix premières valeurs ne pèsent que 4,21 % : le profil est bien différent de celui du MSCI World classique.',
    takeaway: '« Small Cap » décrit un segment de taille, pas une liste d’entreprises nécessairement petites en valeur absolue. L’indice exclut les émergents.',
  },
  {
    ...getIndexComposition('world-ex-usa', '2026-08-31'),
    id: 'world-ex-usa', title: 'MSCI World ex USA', index: 'MSCI World ex USA', snapshot: '31 août 2026', source: [getIndexFacts('world-ex-usa', '2026-08-31').source],
    intro: 'Et si tu retirais les États-Unis du MSCI World ? C’est le principe du MSCI World ex USA 🌍',
    returns: [[2025, 32.55], [2024, 5.26], [2023, 18.60], [2022, -13.82], [2021, 13.17]], performance: { kind: 'indice', detail: 'MSCI World ex USA, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 10.33 },
    insight: 'Le Japon passe en tête avec plus de 20 %. La finance devient le premier secteur, devant l’industrie et la technologie.',
    takeaway: 'Retirer les États-Unis modifie toute la répartition. Ce n’est pas pour autant un indice « tout sauf États-Unis » : seuls les marchés développés restent inclus.',
  },
  {
    ...getIndexComposition('world', '2026-08-31'),
    id: 'world', title: 'MSCI World', index: 'MSCI World', snapshot: '31 août 2026', source: [getIndexFacts('world', '2026-08-31').source],
    intro: 'Tout le monde connaît le MSCI World. Mais connais-tu vraiment ce qu’il y a dedans ? 🌍',
    returns: [[2025, 21.60], [2024, 19.19], [2023, 24.42], [2022, -17.73], [2021, 22.35]], performance: { kind: 'indice', detail: 'MSCI World, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 13.56 },
    insight: 'Le nom dit « World ». Les États-Unis pèsent pourtant plus de 72 % : ce n’est pas une répartition égale entre les pays.',
    takeaway: 'Une seule ligne peut donner accès à 1 280 entreprises, mais les dix premières représentent déjà plus d’un quart de l’indice.',
  },
  {
    ...getIndexComposition('stoxx600', '2026-08-31'),
    id: 'stoxx600', title: 'STOXX Europe 600', index: 'STOXX Europe 600', snapshot: '31 août 2026', source: [getIndexFacts('stoxx600', '2026-08-31').source],
    intro: 'Le STOXX Europe 600 rassemble 600 entreprises européennes. Mais comment le poids se partage-t-il entre les pays ? 🇪🇺',
    returns: [[2025, 16.94], [2024, 6.05], [2023, 12.94], [2022, -13.04], [2021, 22.44]], performance: { kind: 'indice', detail: 'STOXX Europe 600, en EUR, hors dividendes (Price Return)', date: '31 août 2026', trailingOneYear: 18.4, annualizedFiveYear: 6.8 },
    insight: 'Le Royaume-Uni arrive devant la France et l’Allemagne. « Europe » ne signifie pas uniquement zone euro.',
    takeaway: 'Les banques et l’industrie pèsent chacun environ 15 % : la technologie n’est pas le moteur dominant ici.',
  },
  {
    ...getIndexComposition('eurostoxx50', '2026-08-31'),
    id: 'eurostoxx50', title: 'EURO STOXX 50', index: 'EURO STOXX 50', snapshot: '31 août 2026', source: [getIndexFacts('eurostoxx50', '2026-08-31').source],
    intro: 'L’EURO STOXX 50 tient en 50 entreprises de la zone euro. Voici ce que cela donne dans la composition 🇪🇺',
    returns: [[2025, 18.60], [2024, 8.38], [2023, 19.51], [2022, -11.87], [2021, 21.17]], performance: { kind: 'indice', detail: 'EURO STOXX 50, en EUR, hors dividendes (Price Return)', date: '31 août 2026', trailingOneYear: 20.0, annualizedFiveYear: 9.0 },
    insight: 'France et Allemagne réunies : près de 62 % de l’indice. C’est une exposition à la zone euro, pas à toute l’Europe.',
    takeaway: 'ASML pèse presque 9 % à elle seule. Avec 50 valeurs, le poids de chaque grande entreprise se voit vite.',
  },
  {
    ...getIndexComposition('mscieurope', '2026-08-31'),
    id: 'mscieurope', title: 'MSCI Europe', index: 'MSCI Europe', snapshot: '31 août 2026', source: [getIndexFacts('mscieurope', '2026-08-31').source],
    intro: 'Il existe un indice européen que peu de gens connaissent : le MSCI Europe 🇪🇺',
    returns: [[2025, 19.39], [2024, 8.59], [2023, 15.83], [2022, -9.49], [2021, 25.13]], performance: { kind: 'indice', detail: 'MSCI Europe, rendement net en euros, dividendes réinvestis', date: '31 août 2026', tenYear: 9.31 },
    insight: 'Royaume-Uni et Suisse figurent parmi les premiers poids : ici, « Europe » dépasse la seule zone euro.',
    takeaway: 'La finance pèse plus d’un quart. Ce n’est pas le même équilibre sectoriel que dans le MSCI World.',
  },
  {
    ...getIndexComposition('em-esg', '2026-08-31'),
    id: 'em-esg', title: 'Émergents ESG (Amundi PEA)', index: 'MSCI EM ex-Egypt ESG Broad CTB Select', snapshot: '31 août 2026 (indice) · 30 juin 2026 (ETF)',
    source: [getIndexFacts('em-esg', '2026-08-31').source, { label: 'Performances de l’ETF, Amundi', url: emFund }, { label: 'Changement d’indice en 2023, Amundi', url: 'https://www.amundietf.fr/pdfDocuments/download/863110a3-3a8e-43e7-ac7c-eb509bd2b05f/NoticeToShareholders_FR0013412020_FRA_FRA_20230825.pdf' }], isin: 'FR0013412020',
    intro: 'Cet ETF émergent éligible au PEA suit un indice ESG. Mais trois marchés y concentrent l’essentiel 🌏',
    returns: getInstrumentFactsheetReturns('FR0013412020'), performance: { kind: 'ETF', detail: 'Amundi PEA Emergent ESG Transition, performances nettes de la part en EUR', date: '30 juin 2026', historyNote: 'L’indice de référence a changé le 27 septembre 2023 : les années antérieures reflètent l’historique réel du fonds, pas celui de l’indice actuel.' },
    insight: 'Taïwan, Corée du Sud et Chine pèsent près de 70 %. Le poids de TSMC dépasse à lui seul 15 %.',
    takeaway: 'L’étiquette ESG modifie la sélection, mais elle n’efface pas la concentration géographique et technologique.',
  },
  {
    ...getIndexComposition('sp500-pea', '2026-06-30'),
    id: 'sp500-pea', title: 'S&P 500 (Amundi PEA)', index: 'S&P 500', snapshot: '30 juin 2026',
    source: [getIndexFacts('sp500-pea', '2026-06-30').source, { label: 'Méthodologie de l’indice, S&P DJI', url: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/' }], isin: 'FR0011871128',
    intro: 'Cet ETF S&P 500 est éligible au PEA. Voici la composition de l’indice qu’il suit 🇺🇸',
    returns: getInstrumentFactsheetReturns('FR0011871128'), performance: { kind: 'ETF', detail: 'Amundi PEA S&P 500 UCITS ETF Acc, rendements nets de la part en EUR', date: '30 juin 2026' },
    insight: 'Les dix premières lignes pèsent plus de 36 %. Les 504 titres ne représentent pas 504 parts égales.',
    takeaway: 'La technologie pèse plus du tiers de l’indice : le S&P 500 a aussi un fort biais sectoriel.',
  },
  {
    ...getIndexComposition('nasdaq-pea', '2026-08-31'),
    id: 'nasdaq-pea', title: 'Nasdaq 100 (Amundi PEA)', index: 'NASDAQ-100 Notional Net Total Return', snapshot: '31 août 2026',
    source: [getIndexFacts('nasdaq-pea', '2026-08-31').source], isin: 'FR0011871110',
    intro: 'Un ETF Nasdaq 100 éligible au PEA, mais quelle place prennent réellement ses premières entreprises ? 💻',
    returns: getInstrumentFactsheetReturns('FR0011871110'), performance: { kind: 'ETF', detail: 'Amundi PEA Nasdaq-100 UCITS ETF Acc, rendements nets de la part en EUR', date: '31 août 2026' },
    insight: 'Près de 58 % en technologie et plus de 46 % dans les dix premières lignes : le pari est assumé.',
    takeaway: 'Ce n’est pas un indice qui couvre toutes les entreprises américaines : la finance en est pratiquement absente.',
  },
]
