import { getInstrumentAnnualPerformance } from './instrument-returns.js';
import { INDEX_RETURNS, getIndexReturns } from './index-returns.js'
import { getIndexComposition, getIndexFacts } from './index-facts.js'
import { getInstrumentFactsheetReturns } from './instrument-comparator-returns.js'
// Relevé de fiches officielles, figé au 31 août 2026 (au 30 juin pour deux fonds).
// Composition = indice sous-jacent, jamais les titres détenus par le fonds synthétique.
// Les rendements du fonds sont les lignes « Portefeuille » des tableaux Amundi.
const emFund = 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF/20260630'

// Réutilisation de photographies déjà vérifiées ; les performances conservent leur propre source et période.
function reusedIndexSheet(id, title, intro, insight, takeaway, methodologyPanels, asOf = '2026-09-30') {
 const composition = getIndexFacts(id, asOf);
 const returns = INDEX_RETURNS[id]['2025-12-31'];
 return { ...getIndexComposition(id,asOf), id, title, index: composition.index,
  snapshot: composition.snapshot, source: [composition.source, returns.source, ...(composition.methodologySources ?? [])],
  returns: getIndexReturns(id,'2025-12-31'), performance: returns.performance,
  intro, insight, takeaway, methodologyPanels };
}

export const SHEETS = [
 reusedIndexSheet('ftse-epra-nareit-developed-dividend-plus','Immobilier développé Dividend+',
  '🏠 Immobilier coté : que sélectionne le FTSE EPRA Nareit Developed Dividend+ ? 👇',
  'Ce panier regroupe des sociétés immobilières et des REIT. Il reste concentré sur les États-Unis et ne correspond pas à un achat direct de logements.',
  'Les loyers, le financement et les taux peuvent peser sur ces entreprises. Un dividende ne protège pas le capital.',
  [['LA SÉLECTION','Immobilier des pays développés hors Grèce. Règles de mai 2026 : dividende anticipé ≥ 3 % pour entrer, ≥ 1 % pour rester.'],['LES POIDS ET LA DATE','Capitalisation flottante ; revue annuelle en septembre. Photo du 31/08/2026 : sa fiche mentionne encore 2 %, contrairement aux règles publiées.']], '2026-08-31'),
 reusedIndexSheet('ftse-global-core-infrastructure','Infrastructures mondiales Core',
  '🏗️ Réseaux, transport, énergie : que contient vraiment le FTSE Global Core Infrastructure ? 👇',
  'Les pays émergents sont inclus, mais les États-Unis dominent. Ce panier comprend aussi des REIT d’infrastructures : les deux expositions peuvent se recouper.',
  'Les infrastructures cotées restent des actions, exposées aux taux, à la réglementation et aux marchés. Ce n’est pas une protection du capital.',
  [['LA SÉLECTION','Univers FTSE Global All Cap : au moins 65 % des revenus dans les activités Core pour entrer ; sortie sous 55 %.'],['LA PONDÉRATION','Capitalisation investissable, revue en mars et septembre. Cet indice ne suit pas la répartition sectorielle de la variante 50/50.']]),

 reusedIndexSheet('msci-world-momentum','World Momentum',
  '🔎 Momentum : comment les gagnants récents du World sont-ils sélectionnés ? 👇',
  'Le filtre Momentum change les poids sectoriels et les principales positions. Il n’ajoute ni émergents ni petites capitalisations.',
  'Les tendances peuvent se retourner ; le Momentum peut sous-performer le World classique.',
  [['LA SÉLECTION','Scores combinant les performances sur six et douze mois, hors dernier mois et ajustées du risque.'],['LES POIDS','Capitalisation flottante multipliée par le score Momentum ; rééquilibrage trimestriel depuis août 2025.']]),
 reusedIndexSheet('msci-world-minimum-volatility-usd','World Minimum Volatility (USD)',
  '🔎 Minimum Volatility : comment réduire le risque estimé du panier World ? 👇',
  'Le panier résulte d’une optimisation sous contraintes. Il ne suffit pas de choisir individuellement les actions les moins volatiles.',
  'USD désigne la référence de l’optimisation, pas une couverture en euros. Le risque actions et le risque de change subsistent.',
  [['LA SÉLECTION','Optimisation de la variance estimée du portefeuille World, avec corrélations et contraintes de diversification.'],['CE QUE ÇA CHANGE','Une volatilité recherchée plus faible, sans protection du capital ni garantie de battre le World.']]),

 reusedIndexSheet('msci-world-sector-neutral-quality','World Sector Neutral Quality',
  '🔎 Quality : quels critères changent la sélection des entreprises du World ? 👇',
  'La neutralité sectorielle n’impose pas des poids géographiques identiques à ceux du World : les États-Unis restent dominants.',
  'Le filtre Quality cherche des fondamentaux spécifiques, sans garantir une meilleure performance ni éviter les baisses.',
  [['LA SÉLECTION','Rentabilité des capitaux propres élevée, faible endettement et bénéfices peu variables ; comparaison entre entreprises du même secteur GICS.'],['LE PÉRIMÈTRE','Grandes et moyennes entreprises des pays développés ; ce n’est pas un indice incluant les émergents ou les petites capitalisations.']]),
 reusedIndexSheet('msci-world-enhanced-value','World Enhanced Value',
  '🔎 Value : un prix jugé faible au regard des fondamentaux, mais selon quels critères ? 👇',
  'Un filtre de valorisation peut déplacer fortement le poids des pays et des principales entreprises par rapport au World.',
  'Une entreprise peu chère peut le rester ou connaître des difficultés : le filtre Value conserve un risque actions.',
  [['LA SÉLECTION','Comparaison au sein des secteurs GICS à partir du prix sur valeur comptable, du prix sur bénéfices anticipés et de la valeur d’entreprise sur flux de trésorerie opérationnel.'],['LE PÉRIMÈTRE','Grandes et moyennes entreprises des pays développés, sélectionnées pour leurs caractéristiques de valorisation.']]),
 reusedIndexSheet('msci-em-ex-china','Marchés émergents hors Chine',
  '🌏 Retirer la Chine des émergents : quels pays et entreprises prennent davantage de place ? 👇',
  'Sans la Chine, Taïwan et la Corée du Sud occupent une place importante. Exclure un pays peut renforcer la concentration ailleurs.',
  'Le MSCI EM ex-China couvre les grandes et moyennes entreprises ; les petites capitalisations de l’EM IMI sont une autre différence.',
  [['LE PÉRIMÈTRE','Grandes et moyennes capitalisations des marchés émergents, en excluant la Chine.'],['LA PONDÉRATION','Poids liés à la capitalisation ajustée du flottant ; les pays restants ne reçoivent pas des parts égales.']]),

 {
  ...getIndexComposition('acwi-imi','2026-09-30'), id:'acwi-imi', title:'MSCI ACWI IMI', index:'MSCI ACWI IMI', snapshot:'30 septembre 2026', source:[getIndexFacts('acwi-imi','2026-09-30').source],
  intro:'🌍 Un World laisse les émergents et les petites entreprises de côté. Le MSCI ACWI IMI les inclut : qu’est-ce que tu achètes en plus ? 👇',
  returns:getIndexReturns('acwi-imi','2026-09-30'), performance:{kind:'indice',detail:'MSCI ACWI IMI, rendement net USD, dividendes nets réinvestis, hors frais ETF',date:'30 septembre 2026',tenYear:12.05},
  insight:'Ajouter les petites capitalisations élargit le panier, mais ne donne pas le même poids à chaque taille d’entreprise. Les grandes restent dominantes.',
  takeaway:'ACWI IMI associe développés, émergents et petites capitalisations ; le World Small Cap couvre uniquement les petites des pays développés.',
  methodologyPanels:[['LES ENTREPRISES','Grandes, moyennes et petites capitalisations de 23 pays développés et 24 émergents. Environ 99 % de l’univers mondial investissable en actions.'],['LEUR POIDS','Pondération par capitalisation ajustée du flottant : un petit titre ne pèse pas autant qu’un géant.'],['CE QUE ÇA CHANGE','Le MSCI ACWI classique laisse les petites capitalisations à part. IMI ajoute cette tranche de taille, avec toujours une forte place pour les États-Unis.']],
 },
{
 ...getIndexComposition('sp500-equal-weight','methodology'),id:'sp500-equal-weight',title:'S&P 500 Equal Weight',index:'S&P 500 Equal Weight',snapshot:getIndexFacts('sp500-equal-weight','methodology').snapshot,
 source:[getIndexFacts('sp500-equal-weight','methodology').source,{label:'Performances de l’ETF · DWS',url:'https://etf.dws.com/Download/Past%20Performance/IE00BLNMYC90/FR/FR'}],
 intro: "🇺🇸 Avec le S&P 500 Equal Weight, tu retrouves les entreprises du S&P 500, mais chacune reçoit le même poids au rééquilibrage.\n\nVoici comment cette règle change ton exposition, avec les chiffres et les performances 👇",
 isin:'IE00BLNMYC90',returns:[2025,2024,2023,2022,2021].map(y=>[y,getInstrumentAnnualPerformance('IE00BLNMYC90').values[y-2020]]),
 performance:{kind:'ETF',detail:'Part Xtrackers 1C, rendement NAV USD, dividendes réinvestis, net de frais',date:'31 décembre 2025'},
 insight:'Le poids des géants baisse parce que les entreprises partent du même poids. Cela ne supprime pas le risque du marché américain.',takeaway: "Tu changes le poids des entreprises dans ton placement, tout en restant sur le même univers que le S&P 500.",
 methodologyPanels:[['LES ENTREPRISES','Le même univers que le S&P 500 : environ 500 sociétés américaines. Le nombre de titres peut différer du nombre de sociétés.'],['LEUR POIDS','Chaque société reçoit 0,2 % à chaque rééquilibrage trimestriel. Ensuite, les poids évoluent avec les cours.'],['CE QUE ÇA CHANGE','Les plus petites sociétés du S&P 500 prennent davantage de place. Les secteurs restent ceux du marché américain, avec d’autres poids.']],
},
{
 ...getIndexComposition('russell-2000','2026-08-31'),id:'russell-2000',title:'Russell 2000',index:'Russell 2000',snapshot:'31 août 2026',source:[getIndexFacts('russell-2000','2026-08-31').source],
 intro: "🇺🇸 Tu veux investir dans les petites entreprises américaines ? Le Russell 2000 cible ce segment de la Bourse.\n\nVoici sa répartition et ses performances 👇",returns:getIndexReturns('russell-2000','2026-08-31'),
 performance:{kind:'indice',detail:'Russell 2000, rendement total USD, dividendes réinvestis, hors frais ETF',date:'31 août 2026',tenYear:10.55},
 insight:'Le panier vise environ 2 000 petites entreprises ; le nombre exact varie avec les révisions et opérations sur titres.',takeaway: "Tu investis dans les petites capitalisations américaines, un segment dont les entreprises peuvent être plus sensibles au financement.",
 methodologyPanels:[['LES ENTREPRISES','Les petites capitalisations américaines. Le Russell 2000 est un sous-ensemble du Russell 3000.'],['LEUR POIDS','La pondération suit la capitalisation ajustée du flottant. Deux révisions de composition par an à partir de 2026, et ajouts d’introductions en Bourse trimestriels.'],['CE QUE ÇA CHANGE','Les plus grandes entreprises américaines sont à part. Une exposition mondiale aux small caps conserve d’autres pays ; le Russell 2000 cible les États-Unis.']],
},
  // Ajouts du 27/09/2026. Composition et performances ont des sources et des
  // dates propres : l'indice n'est jamais assimilé à l'ETF synthétique.
  {
    ...getIndexComposition('em-standard', '2026-08-31'),
    id: 'em-standard', title: 'MSCI Emerging Markets', index: 'MSCI Emerging Markets', snapshot: '31 août 2026',
    source: [getIndexFacts('em-standard', '2026-08-31').source],
    intro: "🌏 Tu investis dans un ETF MSCI Emerging Markets. Mais quels pays et quelles entreprises prennent le plus de place dans ton placement ?\n\nVoici la répartition des marchés émergents et leurs performances 👇",
    returns: getIndexReturns('em-standard', '2026-08-31'),
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
    intro: "🇯🇵 Tu investis dans un ETF TOPIX. Mais quels secteurs et quelles entreprises japonaises pèsent le plus dans ton placement ?\n\nVoici ce que contient cet indice, avec sa répartition et les performances de l’ETF cité 👇",
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
    intro: "🇯🇵 Le Nikkei 225 réunit 225 actions japonaises. Mais certaines pèsent beaucoup plus que les autres.\n\nVoici sa répartition, ses principales lignes et les performances de l’ETF cité 👇",
    isin: 'LU2196470426', returns: getInstrumentFactsheetReturns('LU2196470426'),
    performance: { kind: 'ETF', detail: 'part Xtrackers Nikkei 225 1C en yens, rendement du fonds net de frais, dividendes réinvestis', date: '31 décembre 2025', historyNote: 'Les poids sont ceux de l’indice au 31 août 2026 ; les rendements sont ceux de la part 1C en yens, pas une performance convertie en euros.' },
    insight: 'Advantest, Fast Retailing et Tokyo Electron dépassent ensemble 29 % de l’indice. La technologie pesait plus de 55 % au 31 août 2026.',
    takeaway: 'Malgré ses 225 actions, le Nikkei est très sensible à quelques titres dont le prix ajusté est élevé. La comparaison avec un ETF TOPIX en euros exige de tenir compte du change.',
  },
  {
    ...getIndexComposition('acwi', '2026-08-31'),
    id: 'acwi', title: 'MSCI ACWI', index: 'MSCI ACWI', snapshot: '31 août 2026', source: [getIndexFacts('acwi', '2026-08-31').source],
    intro: "🌍 Avec un ETF MSCI ACWI, tu investis dans les pays développés et émergents. Mais comment ton argent se répartit entre eux ?\n\nVoici les pays, les secteurs et les entreprises qui pèsent le plus, avec les performances de l’indice 👇",
    returns: getIndexReturns('acwi', '2026-08-31'), performance: { kind: 'indice', detail: 'MSCI ACWI, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 13.12 },
    insight: 'Les émergents entrent dans le panier, mais les États-Unis représentent encore près de 64 % de l’indice.',
    takeaway: 'Le MSCI ACWI couvre davantage de marchés que le MSCI World. « Tous pays » ne signifie pas « tous les titres » : les petites capitalisations restent à part.',
  },
  {
    ...getIndexComposition('ftse-all-world', '2026-08-31'),
    id: 'ftse-all-world', title: 'FTSE All-World', index: 'FTSE All-World', snapshot: '31 août 2026', source: [getIndexFacts('ftse-all-world', '2026-08-31').source],
    intro: "🌍 Avec un ETF FTSE All-World, tu investis dans les pays développés et émergents. Mais quels marchés prennent le plus de place ?\n\nVoici sa répartition, ses principales entreprises et ses performances 👇",
    returns: getIndexReturns('ftse-all-world', '2026-08-31'), performance: { kind: 'indice', detail: 'FTSE All-World, rendement total en dollars, dividendes réinvestis ; secteurs selon la classification ICB de FTSE', date: '31 août 2026', annualizedFiveYear: 11.4 },
    insight: 'Plus de 4 200 valeurs, mais les États-Unis pèsent toujours près de 62 %. Le nombre de titres ne dit pas tout de leur poids.',
    takeaway: 'Il inclut les marchés émergents et les grandes et moyennes capitalisations. Ses secteurs ICB ne sont pas directement comparables aux secteurs GICS des fiches MSCI.',
  },
  {
    ...getIndexComposition('world-small-cap', '2026-08-31'),
    id: 'world-small-cap', title: 'MSCI World Small Cap', index: 'MSCI World Small Cap', snapshot: '31 août 2026', source: [getIndexFacts('world-small-cap', '2026-08-31').source],
    intro: "🔎 Le MSCI World Small Cap te donne accès aux petites capitalisations des pays développés. Mais dans quels pays et quels secteurs ?\n\nVoici sa répartition, ses principales entreprises et ses performances 👇",
    returns: getIndexReturns('world-small-cap', '2026-08-31'), performance: { kind: 'indice', detail: 'MSCI World Small Cap, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 10.80 },
    insight: 'Les dix premières valeurs ne pèsent que 4,21 % : le profil est bien différent de celui du MSCI World classique.',
    takeaway: "Tu ajoutes des petites capitalisations des pays développés à ton exposition. Les marchés émergents restent à part. « Small Cap » décrit un segment de taille, pas des entreprises nécessairement petites en valeur absolue.",
  },
  {
    ...getIndexComposition('world-ex-usa', '2026-08-31'),
    id: 'world-ex-usa', title: 'MSCI World ex USA', index: 'MSCI World ex USA', snapshot: '31 août 2026', source: [getIndexFacts('world-ex-usa', '2026-08-31').source],
    intro: "🌍 Le MSCI World ex USA retire les États-Unis du panier. Quels pays et quels secteurs prennent alors le relais ?\n\nVoici sa répartition, ses principales entreprises et ses performances 👇",
    returns: getIndexReturns('world-ex-usa', '2026-08-31'), performance: { kind: 'indice', detail: 'MSCI World ex USA, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 10.33 },
    insight: 'Le Japon passe en tête avec plus de 20 %. La finance devient le premier secteur, devant l’industrie et la technologie.',
    takeaway: "En retirant les États-Unis, tu changes aussi les poids des pays et des secteurs. Tu restes dans les marchés développés : les émergents ne sont pas inclus.",
  },
  {
    ...getIndexComposition('world', '2026-08-31'),
    id: 'world', title: 'MSCI World', index: 'MSCI World', snapshot: '31 août 2026', source: [getIndexFacts('world', '2026-08-31').source],
    intro: "🌍 Tu investis dans un ETF MSCI World. Mais quels pays, quels secteurs et quelles entreprises pèsent le plus dans ton placement ?\n\nVoici ce que contient réellement cet indice, avec sa répartition et ses performances 👇",
    returns: getIndexReturns('world', '2026-08-31'), performance: { kind: 'indice', detail: 'MSCI World, rendement brut en dollars, dividendes réinvestis', date: '31 août 2026', tenYear: 13.56 },
    insight: 'Le nom dit « World ». Les États-Unis pèsent pourtant plus de 72 % : ce n’est pas une répartition égale entre les pays.',
    takeaway: "Avec un ETF MSCI World, tu investis dans de nombreuses grandes et moyennes entreprises des pays développés. Les marchés émergents ne sont pas inclus.\n\nMais ton argent n’est pas réparti à parts égales : les États-Unis, la technologie et quelques grandes entreprises pèsent particulièrement lourd dans ton résultat.",
  },
  {
    ...getIndexComposition('stoxx600', '2026-08-31'),
    id: 'stoxx600', title: 'STOXX Europe 600', index: 'STOXX Europe 600', snapshot: '31 août 2026', source: [getIndexFacts('stoxx600', '2026-08-31').source],
    intro: "🇪🇺 Tu investis dans un ETF STOXX Europe 600. Mais quelle place occupent le Royaume-Uni, la France ou la Suisse dans ton placement ?\n\nVoici les pays, les secteurs et les entreprises de l’indice, avec ses performances 👇",
    returns: getIndexReturns('stoxx600', '2026-08-31'), performance: { kind: 'indice', detail: 'STOXX Europe 600, en EUR, hors dividendes (Price Return)', date: '31 août 2026', trailingOneYear: 18.4, annualizedFiveYear: 6.8 },
    insight: 'Le Royaume-Uni arrive devant la France et l’Allemagne. « Europe » ne signifie pas uniquement zone euro.',
    takeaway: 'Les banques et l’industrie pèsent chacun environ 15 % : la technologie n’est pas le moteur dominant ici.',
  },
  {
    ...getIndexComposition('eurostoxx50', '2026-08-31'),
    id: 'eurostoxx50', title: 'EURO STOXX 50', index: 'EURO STOXX 50', snapshot: '31 août 2026', source: [getIndexFacts('eurostoxx50', '2026-08-31').source],
    intro: "🇪🇺 Avec un ETF EURO STOXX 50, tu investis dans 50 grandes valeurs de la zone euro. Mais quelles entreprises pèsent le plus ?\n\nVoici sa répartition et ses performances 👇",
    returns: getIndexReturns('eurostoxx50', '2026-08-31'), performance: { kind: 'indice', detail: 'EURO STOXX 50, en EUR, hors dividendes (Price Return)', date: '31 août 2026', trailingOneYear: 20.0, annualizedFiveYear: 9.0 },
    insight: 'France et Allemagne réunies : près de 62 % de l’indice. C’est une exposition à la zone euro, pas à toute l’Europe.',
    takeaway: 'ASML pèse presque 9 % à elle seule. Avec 50 valeurs, le poids de chaque grande entreprise se voit vite.',
  },
  {
    ...getIndexComposition('mscieurope', '2026-08-31'),
    id: 'mscieurope', title: 'MSCI Europe', index: 'MSCI Europe', snapshot: '31 août 2026', source: [getIndexFacts('mscieurope', '2026-08-31').source],
    intro: "🇪🇺 Un ETF MSCI Europe ne se limite pas à la zone euro. Alors, quels pays et quels secteurs retrouves-tu dans ton placement ?\n\nVoici la répartition de l’indice, ses principales entreprises et ses performances 👇",
    returns: getIndexReturns('mscieurope', '2026-08-31'), performance: { kind: 'indice', detail: 'MSCI Europe, rendement net en euros, dividendes réinvestis', date: '31 août 2026', tenYear: 9.31 },
    insight: 'Royaume-Uni et Suisse figurent parmi les premiers poids : ici, « Europe » dépasse la seule zone euro.',
    takeaway: "Avec plus d’un quart de l’indice dans la finance, ton placement n’a pas le même équilibre sectoriel qu’un ETF MSCI World.",
  },
  {
    ...getIndexComposition('em-esg', '2026-08-31'),
    id: 'em-esg', title: 'Émergents ESG (Amundi PEA)', index: 'MSCI EM ex-Egypt ESG Broad CTB Select', snapshot: '31 août 2026 (indice) · 30 juin 2026 (ETF)',
    source: [getIndexFacts('em-esg', '2026-08-31').source, { label: 'Performances de l’ETF, Amundi', url: emFund }, { label: 'Changement d’indice en 2023, Amundi', url: 'https://www.amundietf.fr/pdfDocuments/download/863110a3-3a8e-43e7-ac7c-eb509bd2b05f/NoticeToShareholders_FR0013412020_FRA_FRA_20230825.pdf' }], isin: 'FR0013412020',
    intro: "🌏 Le MSCI EM ex-Egypt ESG Broad CTB Select applique des filtres ESG aux marchés émergents. Mais quels pays et quelles entreprises restent dans ton placement ?\n\nVoici sa répartition et les performances de l’ETF cité 👇",
    returns: getInstrumentFactsheetReturns('FR0013412020'), performance: { kind: 'ETF', detail: 'Amundi PEA Emergent ESG Transition, performances nettes de la part en EUR', date: '30 juin 2026', historyNote: 'L’indice de référence a changé le 27 septembre 2023 : les années antérieures reflètent l’historique réel du fonds, pas celui de l’indice actuel.' },
    insight: 'Taïwan, Corée du Sud et Chine pèsent près de 70 %. Le poids de TSMC dépasse à lui seul 15 %.',
    takeaway: 'L’étiquette ESG modifie la sélection, mais elle n’efface pas la concentration géographique et technologique.',
  },
  {
    ...getIndexComposition('sp500-pea', '2026-06-30'),
    id: 'sp500-pea', title: 'S&P 500 (Amundi PEA)', index: 'S&P 500', snapshot: '30 juin 2026',
    source: [getIndexFacts('sp500-pea', '2026-06-30').source, { label: 'Méthodologie de l’indice, S&P DJI', url: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/' }], isin: 'FR0011871128',
    intro: "🇺🇸 Tu investis dans un ETF S&P 500. Mais quels secteurs et quelles entreprises pèsent le plus dans ton placement ?\n\nVoici la répartition de l’indice et les performances de l’ETF cité 👇",
    returns: getInstrumentFactsheetReturns('FR0011871128'), performance: { kind: 'ETF', detail: 'Amundi PEA S&P 500 UCITS ETF Acc, rendements nets de la part en EUR', date: '30 juin 2026' },
    insight: 'Les dix premières lignes pèsent plus de 36 %. Les 504 titres ne représentent pas 504 parts égales.',
    takeaway: 'La technologie pèse plus du tiers de l’indice : le S&P 500 a aussi un fort biais sectoriel.',
  },
  {
    ...getIndexComposition('nasdaq-pea', '2026-08-31'),
    id: 'nasdaq-pea', title: 'Nasdaq 100 (Amundi PEA)', index: 'NASDAQ-100 Notional Net Total Return', snapshot: '31 août 2026',
    source: [getIndexFacts('nasdaq-pea', '2026-08-31').source], isin: 'FR0011871110',
    intro: "💻 Tu investis dans un ETF Nasdaq-100. Mais quelle place prennent la technologie et les plus grandes entreprises dans ton placement ?\n\nVoici la répartition de l’indice et les performances de l’ETF cité 👇",
    returns: getInstrumentFactsheetReturns('FR0011871110'), performance: { kind: 'ETF', detail: 'Amundi PEA Nasdaq-100 UCITS ETF Acc, rendements nets de la part en EUR', date: '31 août 2026' },
    insight: 'Près de 58 % en technologie et plus de 46 % dans les dix premières lignes : le pari est assumé.',
    takeaway: 'Ce n’est pas un indice qui couvre toutes les entreprises américaines : la finance en est pratiquement absente.',
  },
]
