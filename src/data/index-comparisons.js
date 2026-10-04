import { getIndexFacts, getIndexDescription, formatIndexFact, formatIndexConstituents } from './index-facts.js';
import { getInstrumentComparatorReturns } from './instrument-comparator-returns.js';
import { getInstrumentAum, getInstrumentAumBillions } from './instrument-aum.js';
import { getInstrumentName, getInstrumentPeaStatus } from './instruments.js';
import { requireInstrumentListing } from './instrument-listings.js';
import { formatEtfTer } from './etf-ter.js';
// Centralisation du 30/09/2026 : les commentaires de revue ci-dessous restent historiques ;
// les comptages affichés utilisent les photographies explicites du registre.
// Composition partagée : src/data/index-facts.js, par photographie explicite.
// Les nombres 500/100 sont des périmètres nominaux (sociétés), pas des comptages de titres.
// Données du Comparateur d'indices — extrait de App.jsx le 14/09/2026 (audit "outils", point 3)
// pour aligner cet outil sur la convention data.js/lib.js/App.jsx du reste de l'application (cf.
// CLAUDE.md) : App.jsx était le seul composant à mélanger données et logique/rendu dans un seul
// fichier de 917 lignes. Déplacement de code strict — aucune donnée modifiée, aucune valeur
// touchée, seul l'emplacement change.
//
// Comparateur d'indices — génère un tweet comparatif (structure fixe en 5 blocs numérotés +
// verdict + question finale) pour une famille d'indices concurrents. Seules les données
// STRUCTURELLES (composition, ETF disponibles, ISIN, TER, encours, éligibilité PEA) et les
// performances annuelles disponibles sont pré-rédigées et sourcées ci-dessous. Les valeurs
// peuvent être ajustées dans le formulaire de génération (cf. App.jsx).
// Sources et niveau de confiance documentés dans le commentaire de chaque famille. Éligibilité
// PEA vérifiée fonds par fonds — jamais supposée.

// ─────────────────────────────────────────────────────────────────────────
// FAMILLES — 13 au total. Famille 1 (Europe) reprend l'exemple
// de référence fourni. Familles suivantes rédigées à partir de données réelles
// vérifiées (cf. commentaire de sourcing sur chaque famille), en reprenant
// pour plusieurs fonds les ISIN déjà vérifiés ailleurs dans l'application
// (src/data/etf-cards.js, src/data/portfolio-assets.js) —
// jamais une nouvelle donnée non recoupée quand une donnée déjà vérifiée
// cette session existe.
//
// Émergents et Dividendes ont été scindées le 02/09/2026 en versions PEA et
// CTO séparées (demande explicite) plutôt qu'un seul tweet mélangeant des
// options non-éligibles PEA.
// ─────────────────────────────────────────────────────────────────────────

export const FAMILIES = [
{
 id:'usa-constructions', label:'🇺🇸 USA : pondération et petites entreprises',
 indices: [
  {name:'S&P 500',indexFacts:getIndexFacts('sp500-pea','2026-06-30'),desc:getIndexDescription('sp500-pea','2026-06-30','usa-constructions')},
  {name:'S&P 500 Equal Weight',indexFacts:getIndexFacts('sp500-equal-weight','2026-08-31'),desc:getIndexDescription('sp500-equal-weight','2026-08-31','usa-constructions')},
  {name:'Russell 2000',indexFacts:getIndexFacts('russell-2000','2026-08-31'),desc:getIndexDescription('russell-2000','2026-08-31','usa-constructions')},
 ],
 etfGroups:[['S&P 500','IE00B5BMR087'],['S&P 500 Equal Weight','IE00BLNMYC90'],['Russell 2000','IE00BJ38QD84']].map(([indexName,isin])=>({indexName,pea:false,funds:[{isin,name:getInstrumentName(isin,'index'),...(isin !== 'IE00B5BMR087' ? {listing:requireInstrumentListing(isin)} : {}),ter:formatEtfTer(isin,'index'),aum:getInstrumentAum(isin,'index')}]})),
 diversification:{chain:[`S&P 500 : ${formatIndexFact('sp500-pea','2026-06-30','targetConstituents')} sociétés visées`, `S&P 500 Equal Weight : même univers, autre pondération`, `Russell 2000 : ${formatIndexFact('russell-2000','2026-08-31')} titres au 31/08/2026`],notes:[]},
 perfFunds:[['sp500','S&P 500 · iShares','IE00B5BMR087'],['equal','S&P 500 Equal Weight · Xtrackers','IE00BLNMYC90'],['russell','Russell 2000 · SPDR','IE00BJ38QD84']].map(([key,label,isin])=>({key,label,isin,...getInstrumentComparatorReturns(isin)})),
 perfMethodNote:'Rendements des trois parts en USD, revenus réinvestis, frais des fonds déduits. Les cotations EUR ne constituent pas une couverture de change.',
},
  {
    id: 'europe',
    label: '🇪🇺 Europe',
    intro: 'STOXX 600, EURO STOXX 50, MSCI Europe : trois façons de dire « j’investis en Europe », mais pas trois fois le même panier 🇪🇺\nOn regarde ce qui change 👇',
    indices: [
      // STOXX inclut explicitement grandes, moyennes et petites capitalisations.
      // https://stoxx.com/index/sxxp/ (consulté le 27/09/2026)
      { name: 'STOXX 600', indexFacts: getIndexFacts('stoxx600', '2026-08-31'), desc: getIndexDescription('stoxx600', '2026-08-31', 'europe'), bullets: ['✅ UK + Suisse + Scandinavie inclus'], tag: 'Le plus large 🌍' },
      { name: 'EURO STOXX 50', indexFacts: getIndexFacts('eurostoxx50', '2026-08-31'), desc: getIndexDescription('eurostoxx50', '2026-08-31', 'europe'), tag: 'Ultra-concentré (ASML, SAP, LVMH…) 🎯' },
      // https://www.msci.com/indexes/index/990500/msci-europe-index
      { name: 'MSCI Europe', indexFacts: getIndexFacts('mscieurope', '2026-09-30'), desc: getIndexDescription('mscieurope', '2026-09-30', 'europe'), tag: 'Très proche du STOXX 600 👯' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        // CORRIGÉ le 02/09/2026 : le fonds le moins cher (Amundi Core, 0,07 %) n'est PAS éligible
        // PEA (réplication physique, contient UK/Suisse) — seul BNP ETZ (swap PEA) l'est. Les deux
        // sont affichés pour ne pas laisser croire que 0,19 % est le prix plancher de cette exposition.
        indexName: 'STOXX 600', choiceNote: '1 option PEA + 1 alternative bien moins chère en CTO', pea: true,
        funds: [
          { name: getInstrumentName("FR0011550193", "index"), listing: requireInstrumentListing('FR0011550193'), isin: 'FR0011550193', ter: formatEtfTer('FR0011550193', 'index'), aum: getInstrumentAum("FR0011550193", "index"), note: '(seule option PEA)' },
          { name: getInstrumentName("LU0908500753", "index"), isin: 'LU0908500753', ter: formatEtfTer('LU0908500753', 'index'), aum: getInstrumentAum("LU0908500753", "index"), note: '(CTO uniquement — le moins cher, et de loin le plus gros encours ⚡)' },
        ],
      },
      {
        // Contrôle PEA du 29/09/2026 : C50 confirmé par Amundi. L'éligibilité
        // des parts iShares et HSBC ci-dessous n'est pas établie par leurs
        // fiches émetteurs retrouvées ; des fiches secondaires se contredisent.
        indexName: 'EURO STOXX 50', choiceNote: 'C50 et iShares confirmés en PEA ; HSBC non confirmé', pea: true, subNote: '(indice 100 % zone euro)',
        funds: [
          { name: getInstrumentName("LU1681047236", "index"), listing: requireInstrumentListing('LU1681047236'), isin: 'LU1681047236', pea: getInstrumentPeaStatus('LU1681047236'), ter: formatEtfTer('LU1681047236', 'index'), note: '(PEA confirmé par Amundi)' },
          { name: getInstrumentName("IE00B53L3W79", "index"), isin: 'IE00B53L3W79', pea: getInstrumentPeaStatus('IE00B53L3W79'), ter: formatEtfTer('IE00B53L3W79', 'index'), aum: getInstrumentAum("IE00B53L3W79", "index"), note: '(PEA confirmé par Bourse Direct et justETF)' },
          { name: getInstrumentName("IE00B4K6B022", "index"), isin: 'IE00B4K6B022', pea: getInstrumentPeaStatus('IE00B4K6B022'), ter: formatEtfTer('IE00B4K6B022', 'index'), note: '(PEA non confirmé ; TER le plus bas)' },
        ],
      },
      {
        indexName: 'MSCI Europe', choiceNote: 'un seul vrai choix', pea: true,
        funds: [{ name: getInstrumentName("FR0013412038", "index"), listing: requireInstrumentListing('FR0013412038'), isin: 'FR0013412038', ter: formatEtfTer('FR0013412038', 'index'), repl: '🔄 Synthétique', dist: 'capitalisant', aum: getInstrumentAum("FR0013412038", "index") }],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (facsheets STOXX/MSCI) le 01/09/2026.
      chain: [`STOXX 600 (${formatIndexConstituents('stoxx600', '2026-08-31')} lignes)`, `MSCI Europe (${formatIndexConstituents('mscieurope', '2026-09-30')})`, `EURO STOXX 50 (${formatIndexConstituents('eurostoxx50', '2026-08-31')})`],
      notes: ['⚠️ Le 50 concentre ton risque : ses 10 plus grosses lignes pèsent +41 % de l\'indice.', '→ Une forte dépendance à quelques grandes sociétés de la zone euro.'],
    },
    // Performance 2023-2025 des fonds ci-dessus. PCEU revu sur les fiches Amundi
    // 2026 (2025 rectifié à 19,41 le 25/09/2026) ; ETZ recoupé avec la fiche BNP ; iShares ci-dessous.
    // YTD non inclus ici (saisi par l'utilisateur, cf. formulaire).
    perfFunds: [
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille Amundi du 30/04/2026 ; confiance élevée.
      // 2025 : 19,42 → 19,41 selon la série corrigée des fiches officielles 2026.
      // https://www.amundietf.fr/pdfDocuments/download/c4f606a3-f783-4553-b7f6-143137c8d964/MonthlyFactsheet_4386409_CL78022_FRA_ENG_ETF_INSTITUTIONNEL_20260430.pdf
      { key: 'msci_europe', label: 'Amundi PEA MSCI Europe (PCEU)', ...getInstrumentComparatorReturns('FR0013412038') },
      // Vérifié le 25/09/2026 : part BNP FR0011550193, « EUR C », performances calendaires
      // du fonds ; confiance élevée. 2023/2024/2025 : 14,37/8,41/20,48.
      // https://docfinder.bnpparibas-am.com/api/files/85e997cf-94fd-48ba-9406-225f0a281549/1024
      { key: 'stoxx600', label: 'BNP STOXX 600 (ETZ)', ...getInstrumentComparatorReturns('FR0011550193') },
      // Part iShares IE00B53L3W79, ligne « Share Class » de la fiche BlackRock du 31/08/2026 :
      // https://www.ishares.com/gls-download/literature/fact-sheet/cssx5e-ishares-core-euro-stoxx-50-ucits-etf-fund-fact-sheet-en-gb.pdf
      { key: 'eurostoxx50', label: 'iShares EURO STOXX 50 (SXRT)', ...getInstrumentComparatorReturns('IE00B53L3W79') },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Exposition la plus large, en PEA ?', a: 'ETZ (BNP STOXX 600)' },
      { q: '💸 Zone euro pure, avec PEA confirmé ?', a: `Amundi Core EURO STOXX 50 (C50, ${formatEtfTer('LU1681047236', 'index')})` },
      { q: '🇫🇷 Europe large, avec UK/Suisse, fonds français en PEA ?', a: 'PCEU (Amundi MSCI Europe)' },
      { q: '⚡ Le moins cher tout court, en CTO ?', a: `Amundi Core STOXX 600 (${formatEtfTer('LU0908500753', 'index')}, ${getInstrumentAumBillions('LU0908500753')} d'encours)` },
    ],
    closing: '💬 Dans ton PEA, tu veux couvrir toute l’Europe ou te limiter à la zone euro ?',
  },

  // ── Famille 2 : Monde large ─────────────────────────────────────────
  // ENTIÈREMENT RÉVISÉ le 02/09/2026 suite au retour de l'utilisateur : la
  // version précédente sous-représentait fortement l'offre PEA réelle sur
  // cette famille (« un seul choix » MSCI World alors qu'il y en a 3 ;
  // ACWI présenté comme non-PEA alors qu'un fonds PEA existe depuis
  // juillet 2026). Sources : recherche web du 02/09/2026 (justETF,
  // BlackRock, Amundi, presse spécialisée pour le lancement GPEA).
  // Re-vérification du 04/09/2026 :
  // - GPEA : ISIN/TER (0,30 %) confirmés en 2e source indépendante ; encours désormais disponible
  //   (absent jusqu'ici, fonds trop récent au moment du premier sourcing) — deux points convergents
  //   fin datés du 12/08/2026 (46,46 M€ et 50,16 M€ selon la source), contre 16 M€ au 31/07/2026 :
  //   croissance rapide cohérente avec un fonds lancé le 15/07/2026, pas une anomalie. Encours
  //   ajouté à ~46 M€ (point le plus documenté), avec mention explicite de la jeunesse du fonds.
  // - Xtrackers FTSE All-World 1C : confirmé en 2e source indépendante (107 M€ au 11/08/2026,
  //   contre 110 M€ dans une source antérieure) — écart de 3 M€ sur un fonds encore jeune, dans la
  //   marge de bruit normale. Valeur laissée à 110 M€, sourcing renforcé.
  // - Comptages MSCI World (1 283 → 1 282 au 31/07/2026) et MSCI ACWI (2 461 → 2 460 au 31/07/2026)
  //   recomptés le 04/09/2026 : écart de 1 sur chaque, confirmé comme bruit de rebalancement normal
  //   (déjà le seuil de référence établi pour cette famille) — non corrigé.
  {
    id: 'monde',
    label: '🌍 Monde large',
    intro: '« ETF monde » : derrière ces deux mots, certains fonds incluent les émergents et d’autres non 🌍\nMSCI World, ACWI et FTSE All-World : on compare 👇',
    indices: [
      { name: 'MSCI World', indexFacts: getIndexFacts('world', '2026-09-30'), desc: getIndexDescription('world', '2026-09-30', 'monde'), tag: 'Le classique du monde développé 🏛️' },
      { name: 'MSCI ACWI', indexFacts: getIndexFacts('acwi', '2026-09-30'), desc: getIndexDescription('acwi', '2026-09-30', 'monde'), tag: 'Le monde presque entier 🌐' },
      { name: 'FTSE All-World', indexFacts: getIndexFacts('ftse-all-world', '2026-08-31'), desc: getIndexDescription('ftse-all-world', '2026-08-31', 'monde'), tag: 'Le plus large des trois 🔭' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI World', choiceNote: '3 vraies options en PEA', pea: true,
        funds: [
          { name: getInstrumentName("LU1681043599", "index"), listing: requireInstrumentListing('LU1681043599'), isin: 'LU1681043599', ter: formatEtfTer('LU1681043599', 'index'), aum: getInstrumentAum("LU1681043599", "index"), note: '(le plus gros encours, et de loin)' },
          { name: getInstrumentName("IE0002XZSHO1", "index"), listing: requireInstrumentListing('IE0002XZSHO1'), isin: 'IE0002XZSHO1', ter: formatEtfTer('IE0002XZSHO1', 'index'), aum: getInstrumentAum("IE0002XZSHO1", "index"), note: '(moins cher)' },
          { name: getInstrumentName("FR001400U5Q4", "index"), listing: requireInstrumentListing('FR001400U5Q4'), isin: 'FR001400U5Q4', ter: formatEtfTer('FR001400U5Q4', 'index'), aum: getInstrumentAum("FR001400U5Q4", "index") },
        ],
      },
      {
        // CORRIGÉ le 02/09/2026 : un ETF PEA sur l'ACWI existe depuis le 15/07/2026 (Amundi PEA
        // Global) — signalé à tort comme non-PEA dans la version précédente. SPDR (CTO) reste
        // affiché pour comparaison, bien moins cher.
        indexName: 'MSCI ACWI', choiceNote: 'enfin en PEA depuis juillet 2026', pea: true,
        funds: [
          { name: getInstrumentName("FR0014017NX3", "index"), listing: requireInstrumentListing('FR0014017NX3'), isin: 'FR0014017NX3', ter: formatEtfTer('FR0014017NX3', 'index'), aum: getInstrumentAum("FR0014017NX3", "index"), note: '(seule option PEA, lancée le 15/07/2026 — encours en forte croissance)' },
          { name: getInstrumentName("IE00B44Z5B48", "index"), isin: 'IE00B44Z5B48', ter: formatEtfTer('IE00B44Z5B48', 'index'), aum: getInstrumentAum("IE00B44Z5B48", "index"), note: '(CTO, moins cher et plus gros encours)' },
        ],
      },
      {
        indexName: 'FTSE All-World', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [
          { name: getInstrumentName("IE000L6ZMMC4", "index"), isin: 'IE000L6ZMMC4', ter: formatEtfTer('IE000L6ZMMC4', 'index'), aum: getInstrumentAum("IE000L6ZMMC4", "index"), note: '(le moins cher, fonds récent — avril 2026)' },
          { name: getInstrumentName("IE00BK5BQT80", "index"), listing: requireInstrumentListing('IE00BK5BQT80'), isin: 'IE00BK5BQT80', ter: formatEtfTer('IE00BK5BQT80', 'index'), aum: getInstrumentAum("IE00BK5BQT80", "index"), note: '(le plus gros encours, le plus connu)' },
        ],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI/FTSE, juin-juillet 2026) le 01/09/2026.
      chain: [`MSCI World (${formatIndexConstituents('world', '2026-09-30')} lignes)`, `MSCI ACWI (${formatIndexConstituents('acwi', '2026-09-30')})`, `FTSE All-World (${formatIndexConstituents('ftse-all-world', '2026-08-31')} au 31/08/2026)`],
      notes: ['⚠️ Peu importe lequel des trois tu prends : ils pèsent tous 60 à 70 % d\'actions américaines.', '→ Le vrai choix, c\'est les émergents (dedans ou pas) — pas le poids des USA, qui est de toute façon similaire partout.'],
    },
    // Performance 2023-2025 (source : justETF/extraetf, recherche web du 02/09/2026). CW8 retenu en
    // représentant PEA de MSCI World (historique complet), plutôt que DCAM ou WPEA, trop récents pour
    // avoir 3 années pleines. GPEA (ACWI, PEA) : lancé le 15/07/2026 — aucune performance annuelle
    // réelle sur 2023-2025, laissé à vérifier plutôt que de substituer une performance d'indice.
    // VWCE : performances calendaires de la part Acc USD, ligne « Fund » du KIID Vanguard
    // (arrondies au dixième) : https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf
    perfFunds: [
      { key: 'msci_world', label: 'Amundi MSCI World (CW8, PEA)', ...getInstrumentComparatorReturns('LU1681043599') },
      { key: 'acwi', label: 'Amundi PEA Global ACWI (GPEA)', y2023: null, y2024: null, y2025: null, perfNote: 'Fonds trop récent pour avoir un historique (lancé le 15/07/2026).' },
      { key: 'ftse_aw', label: 'Vanguard FTSE All-World (VWCE)', ...getInstrumentComparatorReturns('IE00BK5BQT80') },
    ],
    perfMethodNote: 'ℹ️ CW8 : rendement du fonds en euros, net de frais. VWCE : rendement du fonds en dollars, net de frais. Dividendes réinvestis dans les deux cas ; la devise change la comparaison.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💸 En PEA, tu veux le moins cher ?', a: `WPEA ou DCAM, à égalité à ${formatEtfTer('FR001400U5Q4', 'index')} — moins cher que CW8 (${formatEtfTer('LU1681043599', 'index')}), pour le même indice.` },
      { q: '💳 En PEA, tu veux le fonds avec le plus d\'encours (pas forcément le meilleur choix) ?', a: `CW8 (Amundi MSCI World) — ${getInstrumentAumBillions('LU1681043599')}, mais TER plus élevé (${formatEtfTer('LU1681043599', 'index')}) que WPEA/DCAM.` },
      { q: '🌐 Tu veux les émergents inclus, mais en PEA ?', a: 'GPEA (Amundi PEA Global ACWI) — tout nouveau, lancé en juillet 2026.' },
      { q: '💰 Le moins cher toutes catégories confondues, en CTO ?', a: `Xtrackers FTSE All-World, à ${formatEtfTer('IE000L6ZMMC4', 'index')}.` },
    ],
    closing: '💬 Tu veux les émergents dans ton ETF principal ou dans une ligne à part ?',
  },

  // ── Famille 3 : USA large ────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Amundi PEA S&P 500 /
  // Nasdaq-100 déjà vérifiés ailleurs dans l'appli (src/data/etf-cards.js).
  // Point notable : le seul ETF PEA jamais lancé sur le Russell 1000 « pur »
  // (Russell 1000 THEAM Easy, FR0010616292) a été liquidé — plus aucune
  // option PEA active sur cet indice à ce jour (vérifié via recherche web).
  {
    id: 'usa',
    label: '🇺🇸 USA large',
    intro: 'Un ETF USA peut détenir 100, 500 ou près de 1 000 valeurs. Et ça change ce que tu détiens vraiment 🇺🇸\nOn compare les quatre indices 👇',
    indices: [
      // Le comité applique notamment des critères de flottant et de liquidité ;
      // il ne prend pas mécaniquement les 500 plus grandes capitalisations.
      // https://www.spglobal.com/spdji/en/research-insights/index-literacy/the-sp-500-and-the-dow/
      { name: 'S&P 500', indexFacts: getIndexFacts('sp500-pea', '2026-06-30'), desc: getIndexDescription('sp500-pea', '2026-06-30', 'usa'), tag: 'La référence mondiale 🏆' },
      { name: 'Nasdaq 100', indexFacts: getIndexFacts('nasdaq-pea', '2026-08-31'), desc: getIndexDescription('nasdaq-pea', '2026-08-31', 'usa'), tag: 'Le plus concentré tech 💻' },
      { name: 'MSCI USA', indexFacts: getIndexFacts('msci-usa', '2026-09-30'), desc: getIndexDescription('msci-usa', '2026-09-30', 'usa'), tag: 'Un peu plus large que le S&P 500 📏' },
      { name: 'Russell 1000', indexFacts: getIndexFacts('russell-1000', '2026-08-31'), desc: getIndexDescription('russell-1000', '2026-08-31', 'usa'), tag: 'Le plus large des quatre 🌊' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'S&P 500', choiceNote: 'le plus gros ≠ le moins cher', pea: true,
        // SPEA omis de la sélection initiale : BlackRock confirme un fonds
        // coté à Paris, visant l'éligibilité PEA, TER 0,10 %, encours 54,41 M€
        // au 28/09/2026 (54 413 013 EUR relevés le 29/09). La série 2023–2025 reste celle d'Amundi : SPEA a
        // été lancé en mai 2025 et n'a pas trois années civiles complètes.
        // https://www.blackrock.com/fr/intermediaries/products/342916/
        funds: [
          { name: getInstrumentName("FR0011550185", "index"), isin: 'FR0011550185', ter: formatEtfTer('FR0011550185', 'index'), aum: getInstrumentAum("FR0011550185", "index"), note: '(le plus gros encours)' },
          { name: getInstrumentName("FR0011871128", "index"), isin: 'FR0011871128', ter: formatEtfTer('FR0011871128', 'index'), aum: getInstrumentAum("FR0011871128", "index"), note: '(historique plus long que SPEA)' },
          { name: getInstrumentName("IE000DQLYVB9", "index"), listing: requireInstrumentListing('IE000DQLYVB9'), isin: 'IE000DQLYVB9', ter: formatEtfTer('IE000DQLYVB9', 'index'), aum: getInstrumentAum("IE000DQLYVB9", "index"), note: '(le moins cher des trois ⚡ ; fonds récent)' },
        ],
      },
      {
        // CORRIGÉ le 02/09/2026 : ajout de l'alternative CTO (BNP Paribas Easy II), moins chère et
        // plus grosse que l'option PEA — cohérence avec le traitement des autres familles.
        indexName: 'Nasdaq 100', choiceNote: '1 option PEA + 1 alternative moins chère en CTO', pea: true,
        funds: [
          { name: getInstrumentName("FR0011871110", "index"), isin: 'FR0011871110', ter: formatEtfTer('FR0011871110', 'index'), aum: getInstrumentAum("FR0011871110", "index"), note: '(seule option PEA)' },
          { name: getInstrumentName("IE000QDFFK00", "index"), isin: 'IE000QDFFK00', ter: formatEtfTer('IE000QDFFK00', 'index'), aum: getInstrumentAum("IE000QDFFK00", "index"), note: '(CTO uniquement, moins cher et plus gros encours)' },
        ],
      },
      {
        indexName: 'MSCI USA', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00B52SFT06", "index"), isin: 'IE00B52SFT06', ter: formatEtfTer('IE00B52SFT06', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: getInstrumentAum("IE00B52SFT06", "index") }],
      },
      {
        indexName: 'Russell 1000', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [],
        narrativeNote: 'Il n\'existe pas de tracker qui réplique le Russell 1000 tout seul : seulement des versions Growth ou Value (iShares Russell 1000 Growth / Value UCITS ETF, en CTO). Et le seul ETF PEA qui avait été lancé sur cet indice (THEAM Easy Russell 1000) a fini par être liquidé — donc aucune option PEA active aujourd\'hui.',
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI/S&P, juillet 2026) le 01/09/2026.
      chain: [`Russell 1000 (${formatIndexFact('russell-1000', '2026-08-31', 'targetConstituents')} lignes)`, `MSCI USA (${formatIndexFact('msci-usa', '2026-09-30', 'constituents')})`, `S&P 500 (${formatIndexFact('sp500-pea', '2026-06-30', 'targetConstituents')})`, `Nasdaq 100 (${formatIndexFact('nasdaq-pea', '2026-08-31', 'targetConstituents')})`],
      notes: ['⚠️ Le Nasdaq 100 exclut tout le secteur financier et concentre près de 50 % sur ses 10 plus grosses lignes.', '→ Si ton portefeuille contient déjà un S&P 500, vérifie combien de ses grandes valeurs tu rachètes avec le Nasdaq-100.'],
    },
    // Nasdaq PEA : performances calendaires officielles de la part Amundi FR0011871110 en EUR,
    // ligne « Portefeuille » (2023-2025). L'ancienne série reprenait le Nasdaq en USD et
    // passait à tort pour les rendements de cette part en euros ; l'audit ISIN seul ne pouvait
    // pas repérer cette erreur puisque les deux outils partageaient le même proxy.
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/RETAIL/ETF
    perfFunds: [
      { key: 'sp500', label: 'Amundi PEA S&P 500', ...getInstrumentComparatorReturns('FR0011871128') },
      { key: 'nasdaq100', label: 'Amundi PEA Nasdaq-100', ...getInstrumentComparatorReturns('FR0011871110') },
      // Vérifié le 25/09/2026 : ligne « Rendement total (%) USD », 2023–2025,
      // https://www.blackrock.com/fr/intermediaries/products/253740/ishares-msci-usa-b-ucits-etf
      // Confiance élevée (émetteur, part et devise explicites).
      // BlackRock, NAV USD de la part IE00B52SFT06 : les anciens 22,33/32,69/3,82
      // correspondaient à une autre devise et n'étaient pas comparables sans note.
      // https://www.blackrock.com/fr/particuliers/products/253740/ishares-msci-usa-b-ucits-etf
      { key: 'msci_usa', label: 'iShares MSCI USA', ...getInstrumentComparatorReturns('IE00B52SFT06') },
    ],
    perfMethodNote: 'ℹ️ Les deux ETF Amundi sont présentés en euros ; iShares MSCI USA est présenté en dollars (NAV de la part USD). Les performances ne sont pas directement comparables sans tenir compte du change.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Un S&P 500 en PEA à frais affichés réduits ?', a: 'iShares SPEA (0,10 %, fonds récent), ou Amundi PEA S&P 500 (0,12 %, historique plus long). Le TER ne résume pas le coût ni la qualité de suivi.' },
      { q: '💻 Tu veux te concentrer sur le Nasdaq-100 en PEA ?', a: 'Amundi PEA Nasdaq-100, plus concentré sur les grandes valeurs technologiques.' },
      { q: '📏 Le compromis entre grandes et moyennes capitalisations, en CTO ?', a: 'iShares MSCI USA.' },
      { q: '🌊 L\'exposition la plus large possible ?', a: 'Une version Growth ou Value du Russell 1000, en CTO — pas de version PEA active pour l\'instant.' },
    ],
    closing: '💬 Pour les États-Unis, tu élargis au maximum ou tu assumes un biais Nasdaq ?',
  },

  // ── Famille 4a : Émergents (PEA) ─────────────────────────────────────
  // Scindée le 02/09/2026 depuis l'ancienne famille « Émergents » unique.
  // Amundi propose en réalité 5 déclinaisons PEA distinctes sur les
  // émergents (pas seulement PAEEM) : vérifié via recherche web du
  // 02/09/2026 (justETF, boursedirect, factsheets Amundi ETF). Une 6e piste
  // (« Amundi PEA Asie Pacifique », FR0011869312) a été écartée : elle
  // réplique le MSCI AC Asia Pacific ex Japan, un indice mixte
  // développés+émergents (Australie, Hong Kong, Singapour inclus), donc pas
  // un vrai fonds « émergents ». Ces 5 fonds ne suivent pas le même indice
  // ni la même zone : pas de comparaison « indice A vs B », mais 5 fiches
  // par zone géographique.
  // PLEM re-vérifié le 03/09/2026 via une 2e source indépendante
  // (boursedirect.fr + zonebourse.com, distincts de la recherche initiale) :
  // ISIN FR0011440478 confirmé correspondre bien à ce fonds précis, TER
  // 0,55 % confirmé exact, fonds confirmé actif (coté sur Euronext Paris,
  // données à jour août 2026, pas de mention de liquidation/fusion).
  // Encours mis à jour à 68 M€ (contre 61 M€ initialement) sur la base
  // d'un point plus récent et précisément daté (68,43 M€ au 12/08/2026,
  // zonebourse.com, en hausse depuis 37,27 M€ au 30/09/2025 — cohérent
  // avec un petit fonds en collecte, pas un signal d'anomalie).
  //
  // Re-vérification du 04/09/2026 (audit demandé sur PALAT + les 5 autres fonds jamais confirmés
  // en 2e source) :
  // - PALAT : l'écart 70 M€ / 141 M€ trouvé précédemment est tranché — 141 M€ est la valeur
  //   correcte et la plus récente, confirmée directement par la fiche mensuelle OFFICIELLE Amundi
  //   (amundietf.fr, factsheet daté du 27/02/2026 : VL 28,21 €, encours 141,43 M€). Le chiffre de
  //   70 M€ provenait d'un point antérieur (fin 2025) désormais dépassé — pas une erreur, juste plus
  //   ancien. TER 0,30 % reconfirmé par cette même fiche officielle (une source tierce donnait à
  //   tort 0,20 %, écartée). Aucun changement de valeur, sourcing renforcé.
  // - PINR : ISIN et TER (0,85 %) confirmés par la fiche officielle Amundi (30/04/2026) ET par
  //   Boursorama (31/07/2026, 157 M€) + Zonebourse (27/02/2026, 153 M€) — 3 sources convergentes
  //   dans la fourchette 148-157 M€. Encours mis à jour à 157 M€ (point le plus récent daté).
  //   Fonds confirmé actif.
  {
    id: 'emergents-pea',
    label: '🌏 Émergents (PEA)',
    intro: 'Un ETF émergents en PEA, oui. Mais entre tous les pays et une seule région, le risque n’est pas le même 🌏\nVoici les cinq déclinaisons 👇',
    indices: [
      { name: 'Émergents global (indice ESG)', indexFacts: getIndexFacts('em-esg', '2026-08-31'), desc: getIndexDescription('em-esg', '2026-08-31', 'emergents-pea'), tag: 'Le PEA généraliste 🌍' },
      { name: 'Asie émergente', indexFacts: getIndexFacts('msci-em-asia-screened', '2026-09-30'), desc: getIndexDescription('msci-em-asia-screened', '2026-09-30', 'emergents-pea'), tag: 'Concentré sur l\'Asie 🌏' },
      { name: 'Amérique latine', indexFacts: getIndexFacts('msci-em-latin-america-selection', '2026-08-31'), desc: getIndexDescription('msci-em-latin-america-selection', '2026-08-31', 'emergents-pea'), tag: 'Le pari régional le plus étroit 🌎' },
      { name: 'Inde seule', indexFacts: getIndexFacts('msci-india', '2026-09-30'), desc: getIndexDescription('msci-india', '2026-09-30', 'emergents-pea'), tag: 'Le pari 100 % Inde 🇮🇳' },
      { name: 'EMEA émergente', indexFacts: getIndexFacts('msci-em-emea-esg', '2026-09-30'), desc: getIndexDescription('msci-em-emea-esg', '2026-09-30', 'emergents-pea'), tag: 'La zone la plus confidentielle 🌍' },
    ],
    block2Title: '2️⃣ LES ETF PEA DISPONIBLES 💳',
    etfGroups: [
      {
        indexName: 'Émergents global (ESG resserré)', choiceNote: 'seule option PEA généraliste sur les émergents', pea: true,
        funds: [{ name: getInstrumentName("FR0013412020", "index"), listing: requireInstrumentListing('FR0013412020'), isin: 'FR0013412020', ter: formatEtfTer('FR0013412020', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: getInstrumentAum("FR0013412020", "index") }],
      },
      {
        indexName: 'Asie émergente', choiceNote: 'seule option PEA sur cette zone', pea: true,
        funds: [{ name: getInstrumentName("FR0013412012", "index"), listing: requireInstrumentListing('FR0013412012'), isin: 'FR0013412012', ter: formatEtfTer('FR0013412012', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: getInstrumentAum("FR0013412012", "index") }],
      },
      {
        indexName: 'Amérique latine', choiceNote: 'seule option PEA sur cette zone', pea: true,
        funds: [{ name: getInstrumentName("FR0013412004", "index"), listing: requireInstrumentListing('FR0013412004'), isin: 'FR0013412004', ter: formatEtfTer('FR0013412004', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: getInstrumentAum("FR0013412004", "index"), note: '(encours encore modeste)' }],
      },
      {
        indexName: 'Inde seule', choiceNote: 'seule option PEA sur ce pays', pea: true,
        funds: [{ name: getInstrumentName("FR0011869320", "index"), listing: requireInstrumentListing('FR0011869320'), isin: 'FR0011869320', ter: formatEtfTer('FR0011869320', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: getInstrumentAum("FR0011869320", "index"), note: '(le plus cher du lot)' }],
      },
      {
        indexName: 'EMEA émergente', choiceNote: 'seule option PEA sur cette zone', pea: true,
        funds: [{ name: getInstrumentName("FR0011440478", "index"), listing: requireInstrumentListing('FR0011440478'), isin: 'FR0011440478', ter: formatEtfTer('FR0011440478', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: getInstrumentAum("FR0011440478", "index"), note: '(la plus confidentielle)' }],
      },
    ],
    diversification: {
      // Pas de relation d'emboîtement ici (contrairement à un MSCI World → MSCI ACWI) : 5 fonds sur
      // 5 zones distinctes, pas des sous-ensembles les uns des autres.
      chain: [`PAEEM (${formatIndexFact('em-esg', '2026-08-31', 'marketCount')} pays, Égypte exclue, généraliste ESG)`, `PAASI (${formatIndexFact('msci-em-asia-screened', '2026-09-30', 'marketCount')} pays, Asie émergente)`, 'PALAT (Amérique latine)', 'PINR (Inde seule)', 'PLEM (zone EMEA émergente)'],
      notes: ['⚠️ PAEEM est le seul fonds « généraliste » du lot : les quatre autres sont des paris régionaux ou pays, à combiner avec lui plutôt qu\'à sa place.', `→ Plus la zone est étroite (Inde, Amérique latine, EMEA), plus l'encours est petit et le TER élevé — PINR grimpe à ${formatEtfTer('FR0011869320', 'index')}.`],
    },
    // Performance 2023-2025 (source : justETF/boursedirect, recherche web du 02/09/2026, recoupée sur
    // plusieurs pages par fonds).
    perfFunds: [
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF/20260131
      { key: 'paeem_pea', label: 'Amundi PEA Emergent (PAEEM)', ...getInstrumentComparatorReturns('FR0013412020') },
      // Vérifié le 25/09/2026 : ligne « Portefeuille » EUR, rapport Amundi 31/08/2026 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412012/FRA/FRA/INSTITUTIONNEL/ETF
      { key: 'paasi', label: 'Amundi PEA Asie Émergente (PAASI)', ...getInstrumentComparatorReturns('FR0013412012') },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412004/FRA/FRA/INSTITUTIONNEL/ETF/20251231
      { key: 'palat', label: 'Amundi PEA Amérique Latine (PALAT)', ...getInstrumentComparatorReturns('FR0013412004') },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011869320/FRA/FRA/RETAIL/ETF/20251231
      { key: 'pinr', label: 'Amundi PEA Inde (PINR)', ...getInstrumentComparatorReturns('FR0011869320') },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011440478/FRA/FRA/RETAIL/ETF/20251231
      { key: 'plem', label: 'Amundi PEA Emergent EMEA (PLEM)', ...getInstrumentComparatorReturns('FR0011440478') },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Tu veux un fonds PEA généraliste sur les émergents ?', a: 'PAEEM — indice ESG sur 23 pays émergents, Égypte exclue.' },
      { q: '🌏 Tu veux cibler l\'Asie émergente spécifiquement ?', a: 'PAASI.' },
      { q: '🌎 Tu veux viser l\'Amérique latine (Brésil, Mexique…) ?', a: 'PALAT — mais très volatil (-25 % en 2024, +36 % en 2025).' },
      { q: '🇮🇳 Tu veux un pari 100 % Inde ?', a: `PINR — TER ${formatEtfTer('FR0011869320', 'index')}, le plus cher du lot.` },
      { q: '🌍 Tu veux la zone EMEA émergente (Afrique du Sud, Golfe, Europe de l\'Est) ?', a: 'PLEM — la déclinaison la plus confidentielle.' },
    ],
    closing: '💬 Sur les émergents en PEA, tu gardes une ligne large ou tu ajoutes une région précise ?',
  },

  // ── Famille 4b : Émergents (CTO) ─────────────────────────────────────
  // Reprend telle quelle la comparaison qui existait avant la scission du
  // 02/09/2026 (MSCI EM IMI / FTSE EM / MSCI EM ex-China), sans aucune
  // mention PEA puisque ce tweet est explicitement pour les lecteurs en CTO.
  {
    id: 'emergents-cto',
    label: '🌏 Émergents (CTO)',
    intro: 'Corée du Sud incluse ou non ? Chine incluse ou non ? Deux ETF émergents peuvent raconter deux histoires différentes 🌏\nOn compare les trois 👇',
    indices: [
      { name: 'MSCI EM IMI', indexFacts: getIndexFacts('msci-em-imi', '2026-09-30'), desc: getIndexDescription('msci-em-imi', '2026-09-30', 'emergents-cto'), tag: 'La référence émergents, en version large 🏳️' },
      { name: 'FTSE EM', indexFacts: getIndexFacts('ftse-em', '2026-08-31'), desc: getIndexDescription('ftse-em', '2026-08-31', 'emergents-cto'), tag: 'Sans la Corée du Sud 🇰🇷' },
      { name: 'MSCI EM ex-China', indexFacts: getIndexFacts('msci-em-ex-china', '2026-09-30'), desc: getIndexDescription('msci-em-ex-china', '2026-09-30', 'emergents-cto'), tag: 'L\'anti-concentration Chine 🚫' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES (CTO) 💳',
    etfGroups: [
      {
        indexName: 'MSCI EM IMI', choiceNote: 'la référence la plus large', pea: false,
        funds: [{ name: getInstrumentName("IE00BKM4GZ66", "index"), isin: 'IE00BKM4GZ66', ter: formatEtfTer('IE00BKM4GZ66', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: getInstrumentAum("IE00BKM4GZ66", "index") }],
      },
      {
        indexName: 'FTSE EM', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [
          { name: getInstrumentName("IE00BK5BR733", "index"), isin: 'IE00BK5BR733', ter: formatEtfTer('IE00BK5BR733', 'index'), aum: getInstrumentAum("IE00BK5BR733", "index") },
          { name: getInstrumentName("IE00B3VVMM84", "index"), isin: 'IE00B3VVMM84', ter: formatEtfTer('IE00B3VVMM84', 'index'), aum: getInstrumentAum("IE00B3VVMM84", "index"), note: '(plus gros encours)' },
        ],
      },
      {
        indexName: 'MSCI EM ex-China', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00BMG6Z448", "index"), isin: 'IE00BMG6Z448', ter: formatEtfTer('IE00BMG6Z448', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: getInstrumentAum("IE00BMG6Z448", "index") }],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI/FTSE, 2026) le 01/09/2026.
      chain: [`MSCI EM IMI (${formatIndexFact('msci-em-imi', '2026-09-30', 'constituents')} lignes)`, `FTSE EM (${formatIndexFact('ftse-em', '2026-08-31', 'constituents')}, sans la Corée du Sud)`, `MSCI EM ex-China (${formatIndexFact('msci-em-ex-china', '2026-09-30', 'constituents')}, sans la Chine)`],
      notes: ['⚠️ La Chine pèse encore 25 à 30 % du MSCI EM, malgré sa baisse ces dernières années.'],
    },
    // iShares EM IMI : performances calendaires de la part USD IE00BKM4GZ66,
    // ligne « Share Class » du factsheet BlackRock EIMI ; même série dans le Générateur.
    // ftse_em CORRIGÉ le 23/09/2026 (4,12/19,20/11,13 → 7,86/12,06/25,67) : l'ancien commentaire de
    // ce fichier affirmait qu'un premier résultat de recherche "identique à la série 2021-2023 de
    // portfolio-generator" était un décalage d'années suspect, et l'avait donc écarté au profit
    // d'un autre jeu de chiffres — ce diagnostic était FAUX. Le fonds coté (IE00BK5BR733, part USD
    // Acc) a bien 7,86 % / 12,06 % / 25,67 % net de frais sur 2023/2024/2025 : confirmé par 2
    // requêtes web indépendantes le 23/09/2026, dont une directement sur les fiches officielles
    // Vanguard — valeur identique à src/data/portfolio-assets.js pour ce même ISIN.
    // L'ancien jeu de chiffres (4,12 %
    // etc.) n'a pas pu être retracé à une source fiable lors de cette revérification.
    perfFunds: [
      { key: 'msci_em', label: 'iShares Core MSCI EM IMI', ...getInstrumentComparatorReturns('IE00BKM4GZ66') },
      { key: 'ftse_em', label: 'Vanguard FTSE Emerging Markets', ...getInstrumentComparatorReturns('IE00BK5BR733') },
      // Vérifié le 25/09/2026 : ligne « Rendement total (%) USD » BlackRock,
      // précision publiée au dixième ; anciens centièmes écartés faute de confirmation.
      // Confiance élevée. https://www.blackrock.com/fr/particuliers/products/315592/
      { key: 'em_exchina', label: 'iShares MSCI EM ex-China', ...getInstrumentComparatorReturns('IE00BMG6Z448') },
    ],
    perfMethodNote: 'ℹ️ Performance totale nette de frais (dividendes réinvestis), en $ — devise des parts USD Acc, hors effet de change €/$. Le Générateur utilise aussi la part iShares en dollars ; certains autres supports y reposent encore sur un indice.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🏳️ La référence la plus large et la moins chère ?', a: 'iShares Core MSCI EM IMI.' },
      { q: '🇰🇷 Tu veux exclure la Corée du Sud (classée développée) ?', a: 'Vanguard FTSE Emerging Markets.' },
      { q: '🚫 Tu veux réduire ton risque chinois ?', a: 'iShares MSCI EM ex-China.' },
    ],
    closing: '💬 Sur les émergents, quelle place veux-tu laisser à la Chine dans ton portefeuille ?',
  },

  // ── Famille 5 : Style ────────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Value Factor déjà
  // vérifié ailleurs dans l'appli (src/data/etf-cards.js, portfolio-generator).
  // AUCUN ETF UCITS répliquant l'indice « MSCI World Growth » (au sens
  // strict) n'a été trouvé lors de cette recherche — affiché honnêtement
  // comme non confirmé plutôt que remplacé par un fonds Momentum différent.
  // Recompté le 04/09/2026 (sources MSCI datées) : MSCI World Enhanced Value 400 au 31/07/2026
  // (contre 401 affiché, écart de 1 — bruit normal, non corrigé) ; MSCI World Sector Neutral
  // Quality 301 au 30/06/2026 — exact, confirmé. « MSCI World Growth » re-recherché avec une
  // méthode différente (etfdb.com, requête ciblée) : toujours aucun ETF UCITS trouvé qui réplique
  // cet indice précis — statu quo confirmé, pas de fonds inventé.
  {
    id: 'style',
    label: '🎨 Style (facteurs)',
    intro: 'Value, Quality, Growth : ces mots changent la sélection des entreprises dans un indice mondial 🎨\nOn regarde les trois approches 👇',
    indices: [
      { name: 'MSCI World Enhanced Value', indexFacts: getIndexFacts('msci-world-enhanced-value', '2026-09-30'), desc: getIndexDescription('msci-world-enhanced-value', '2026-09-30', 'style'), bullets: ['ℹ️ Le vrai nom de l\'indice répliqué : MSCI World Enhanced Value'], tag: 'Le pari à contre-courant 📉' },
      { name: 'MSCI World Sector Neutral Quality', indexFacts: getIndexFacts('msci-world-sector-neutral-quality', '2026-09-30'), desc: getIndexDescription('msci-world-sector-neutral-quality', '2026-09-30', 'style'), bullets: ['ℹ️ Le vrai nom de l\'indice répliqué : MSCI World Sector Neutral Quality'], tag: 'Le style « qualité avant tout » 💎' },
      { name: 'MSCI World Growth', indexFacts: getIndexFacts('msci-world-growth', '2026-09-30'), desc: getIndexDescription('msci-world-growth', '2026-09-30', 'style'), tag: 'Aucun ETF trouvé pour l\'instant ⚠️' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES — AUCUNE OPTION PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI World Value', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00BP3QZB59", "index"), isin: 'IE00BP3QZB59', ter: formatEtfTer('IE00BP3QZB59', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: getInstrumentAum("IE00BP3QZB59", "index") }],
      },
      {
        indexName: 'MSCI World Quality', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00BP3QZ601", "index"), isin: 'IE00BP3QZ601', ter: formatEtfTer('IE00BP3QZ601', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: getInstrumentAum("IE00BP3QZ601", "index") }],
      },
      {
        indexName: 'MSCI World Growth', choiceNote: 'aucun fonds trouvé', pea: false,
        funds: [],
        narrativeNote: 'On n\'a trouvé aucun ETF UCITS qui réplique vraiment l\'indice « MSCI World Growth ». Les fonds « Momentum Factor » qui existent visent autre chose (l\'élan du cours, pas la croissance des bénéfices) — donc pas de faux jumeau ici, on préfère te le dire clairement.',
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI, juillet 2026) le 01/09/2026.
      chain: [`MSCI World (${formatIndexConstituents('world', '2026-09-30')} lignes, univers de départ)`, `MSCI World Value (${formatIndexFact('msci-world-enhanced-value', '2026-09-30', 'constituents')})`, `MSCI World Quality (${formatIndexFact('msci-world-sector-neutral-quality', '2026-09-30', 'constituents')})`],
      notes: ['⚠️ Contrairement à un indice classique, ces indices factoriels ne s\'emboîtent pas les uns dans les autres : ce sont des sous-ensembles indépendants du MSCI World, pas des poupées russes.'],
    },
    // Performance 2023-2025 (source : justETF, recherche web du 02/09/2026). Value Factor recoupé
    // avec la série "actions_value" déjà vérifiée cette session dans src/data/portfolio-assets.js
    // (même fonds, écart <0,1 pt sur les 3 années) — confirme la fiabilité de la recherche.
    perfFunds: [
      { key: 'value', label: 'iShares Edge MSCI World Value Factor', ...getInstrumentComparatorReturns('IE00BP3QZB59') },
      // BlackRock, NAV USD de la part IE00BP3QZ601, 2023-2025.
      // https://www.blackrock.com/ch/individual/en/products/270054/ishares-msci-world-quality-factor-ucits-etf
      // Vérifié le 25/09/2026 : part USD, rendement total calendaire BlackRock ; confiance élevée.
      // https://www.blackrock.com/fr/particuliers/products/270054/ishares-msci-world-quality-factor-ucits-etf
      { key: 'quality', label: 'iShares Edge MSCI World Quality Factor', ...getInstrumentComparatorReturns('IE00BP3QZ601') },
    ],
    perfMethodNote: 'ℹ️ Value et Quality reprennent les rendements calendaires des parts en dollars (NAV USD), dividendes réinvestis, nets de frais. Le résultat d’un investissement en euros dépend du change EUR/USD.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '📉 Tu crois à un retour de balancier vers les décotées ?', a: 'iShares Edge MSCI World Value Factor.' },
      { q: '💎 Tu préfères la stabilité des bénéfices ?', a: 'iShares Edge MSCI World Quality Factor.' },
      { q: '🌱 Tu cherches la croissance pure ?', a: 'Pas de vrai ETF dédié à ce jour, malgré nos recherches — on ne va pas t\'en inventer un.' },
    ],
    closing: '💬 Tu préfères sélectionner les valeurs selon un facteur ou garder le MSCI World sans filtre ?',
  },

  // ── Famille 6a : Dividendes (CTO) ────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). High Dividend et
  // Quality Dividend (part Dist) déjà référencés ailleurs dans l'appli
  // (src/data/portfolio-assets.js) ; part Acc et Aristocrats confirmées
  // cette session. Contenu inchangé depuis la scission du 02/09/2026 (ces
  // 3 indices n'ont toujours aucun équivalent PEA) — seul le titre du
  // bloc 2 a été mis à jour pour ne plus dire « aucune option PEA », ce
  // qui n'est plus vrai depuis l'ajout du tweet « Dividendes (PEA) ».
  // Recompté le 04/09/2026 : High Dividend (FTSE All-World High Dividend Yield) 2 397 au
  // 27/02/2026 — exact, confirmé. Quality Dividend (iShares MSCI World Quality Dividend Advanced,
  // indice réel : MSCI World High Dividend Yield Advanced Select) : 194 holdings au 24/08/2026 —
  // à l'intérieur de la fourchette déjà documentée (194-211 selon rebalancement), confirmé, pas de
  // changement. Dividend Aristocrats : nombre fixé par méthodologie (top 100 par construction),
  // reconfirmé, non un comptage à revérifier.
  //
  // AUDIT du 23/09/2026 (signalement utilisateur sur ce tweet précis) : Global Dividend Aristocrats
  // (S&P Global Dividend Aristocrats, 100 titres) exige au moins 10 ans consécutifs de dividende en
  // hausse OU stable ; le fonds US alternatif (S&P High Yield Dividend Aristocrats, IE00B6YX5D40)
  // exige lui 20 ans consécutifs de HAUSSE — un critère différent et plus strict, jamais distingué
  // dans le texte jusqu'ici (confirmé par 2 requêtes indépendantes le 23/09/2026 : méthodologie
  // S&P DJI + fiches justETF/SSGA). Corrigé ci-dessous (indices[].bullets + etfGroups[].note).
  {
    id: 'dividendes-cto',
    label: '🟣 Dividendes (CTO)',
    intro: 'Trois ETF à dividendes, trois méthodes de sélection : haut rendement, qualité financière ou historique de distribution 🟣\nOn compare les trois 👇',
    indices: [
      { name: 'High Dividend', indexFacts: getIndexFacts('ftse-all-world-high-dividend-yield', '2026-08-31'), desc: getIndexDescription('ftse-all-world-high-dividend-yield', '2026-08-31', 'dividendes-cto'), tag: 'Le rendement brut, sans filtre 💰' },
      { name: 'Quality Dividend', indexFacts: getIndexFacts('msci-world-high-dividend-yield-advanced-select', '2026-09-30'), desc: getIndexDescription('msci-world-high-dividend-yield-advanced-select', '2026-09-30', 'dividendes-cto'), tag: 'Le compromis entre rendement et solidité 💎' },
      {
        name: 'Dividend Aristocrats', indexFacts: getIndexFacts('sp-global-dividend-aristocrats', '2026-08-31'), desc: getIndexDescription('sp-global-dividend-aristocrats', '2026-08-31', 'dividendes-cto'), tag: 'Le plus exigeant des trois 🏅',
        bullets: ['ℹ️ Le critère "10 ans" vaut pour la version mondiale ci-dessous ; l\'alternative US (bloc 2) exige elle 20 ans consécutifs de hausse — un filtre différent, plus strict.'],
      },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES (CTO) 💳',
    etfGroups: [
      {
        // Parts Dist choisies ici (pas Acc) : c'est la famille Dividendes, l'investisseur veut
        // typiquement percevoir le revenu — et les deux parts Dist ci-dessous sont aussi les plus
        // gros encours de leur fonds (vérifié via recherche web le 01/09/2026).
        indexName: 'High Dividend', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00B8GKDB10", "index"), isin: 'IE00B8GKDB10', ter: formatEtfTer('IE00B8GKDB10', 'index'), repl: '🔄 Physique', dist: 'distribuant trimestriel', aum: getInstrumentAum("IE00B8GKDB10", "index") }],
      },
      {
        indexName: 'Quality Dividend', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00BYYHSQ67", "index"), isin: 'IE00BYYHSQ67', ter: formatEtfTer('IE00BYYHSQ67', 'index'), repl: '🔄 Physique', dist: 'distribuant trimestriel', aum: getInstrumentAum("IE00BYYHSQ67", "index") }],
      },
      {
        indexName: 'Dividend Aristocrats', choiceNote: 'le plus de choix', pea: false,
        funds: [
          { name: getInstrumentName("IE00B9CQXS71", "index"), isin: 'IE00B9CQXS71', ter: formatEtfTer('IE00B9CQXS71', 'index'), aum: getInstrumentAum("IE00B9CQXS71", "index"), note: '(mondial — dividende stable/en hausse depuis 10 ans)' },
          { name: getInstrumentName("IE00B6YX5D40", "index"), isin: 'IE00B6YX5D40', ter: formatEtfTer('IE00B6YX5D40', 'index'), aum: getInstrumentAum("IE00B6YX5D40", "index"), note: '(US uniquement, le moins cher ⚡ — critère plus strict : 20 ans consécutifs de hausse du dividende, contre 10 ans de dividende stable ou en hausse pour le fonds mondial ci-dessus)' },
        ],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets FTSE/MSCI/S&P, 2026) le 01/09/2026.
      chain: [`High Dividend (${formatIndexFact('ftse-all-world-high-dividend-yield', '2026-08-31', 'constituents')} lignes)`, `Quality Dividend (${formatIndexFact('msci-world-high-dividend-yield-advanced-select', '2026-09-30', 'constituents')})`, `Dividend Aristocrats mondial (${formatIndexFact('sp-global-dividend-aristocrats', '2026-08-31', 'targetConstituents')})`],
      notes: ['⚠️ Plus le filtre est exigeant (Quality, Aristocrats), plus le nombre de lignes chute.', '→ Concentration sectorielle plus forte (finance, énergie, conso de base) sur les deux derniers.'],
    },
    // Performance 2023-2025 — RECORRIGÉE le 23/09/2026 suite à un signalement utilisateur sur ce
    // tweet précis (2 des 3 séries ci-dessous étaient fausses depuis leur création, sans lien avec
    // les vraies performances des fonds).
    // - high_div (IE00B8GKDB10) : 11,51 % / 9,39 % / 26,40 % confirmé par 2 requêtes web
    //   indépendantes le 23/09/2026 (documentation officielle Vanguard + recoupement justETF/
    //   fiches fonds) — identique à la série déjà vérifiée pour ce même fonds dans
    //   src/data/portfolio-assets.js ("high_dividend"/"high_dividend_dist"), donc cohérence
    //   rétablie entre les deux outils sur cet ISIN.
    // - quality_div (IE00BYYHSQ67) : 17,16 % / 9,76 % / 23,97 %, mêmes
    //   rendements NAV officiels que la part distribuante du Générateur.
    // - aristocrats (IE00B9CQXS71) : 6,93 % / 7,74 % / 17,02 % pour 2023-2025, vérifiés le
    //   24/09/2026 directement sur la ligne "Fund Net" du tableau officiel State Street au
    //   31/08/2026. La ligne "Fund Gross"/l'ancienne série du Générateur était différente ;
    //   le Générateur utilise maintenant lui aussi la série nette de frais.
    perfFunds: [
      { key: 'high_div', label: 'Vanguard FTSE AW High Dividend', ...getInstrumentComparatorReturns('IE00B8GKDB10') },
      { key: 'quality_div', label: 'iShares MSCI World Quality Dividend', ...getInstrumentComparatorReturns('IE00BYYHSQ67') },
      { key: 'aristocrats', label: 'SPDR S&P Global Dividend Aristocrats', ...getInstrumentComparatorReturns('IE00B9CQXS71') },
    ],
    // Disclosure affichée dans le tweet lui-même (bloc 4, cf. buildTweetText) — devise, méthode et
    // nature "totale vs distribution" jamais explicités dans le texte avant le 23/09/2026, seulement
    // dans les commentaires de code (donc invisibles au lecteur).
    perfMethodNote: 'ℹ️ Performance totale nette de frais (dividendes réinvestis), en $ — devise de cotation des 3 fonds, hors effet de change €/$. Ne pas confondre avec le rendement de distribution (dividend yield), qui est un chiffre différent.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💰 Le rendement le plus élevé, sans filtre ?', a: 'Vanguard FTSE All-World High Dividend Yield.' },
      { q: '💎 Le compromis entre rendement et solidité financière ?', a: 'iShares MSCI World Quality Dividend Advanced.' },
      { q: '🏅 Le plus exigeant (20 ans de hausses consécutives) ?', a: 'SPDR S&P US Dividend Aristocrats (la version mondiale accepte un dividende stable ou en hausse pendant 10 ans).' },
    ],
    closing: '💬 Pour des dividendes, tu privilégies le montant versé ou les critères de sélection des entreprises ?',
  },

  // ── Famille 6b : Dividendes (PEA) ────────────────────────────────────
  // Ajoutée le 02/09/2026. Recherche dédiée : sur les 3 indices de la
  // famille CTO (High Dividend mondial, Quality Dividend mondial,
  // Dividend Aristocrats mondial/US), aucun n'a d'équivalent PEA — confirmé
  // à nouveau cette session. EUDV est une option PEA pour l'indice Euro
  // Dividend Aristocrats, mais ce n'est PAS le seul ETF à dividendes en PEA :
  // Amundi MSCI EMU High Dividend (FR0010717090) est aussi éligible PEA
  // selon Amundi (consulté le 27/09/2026). Les indices sont différents.
  // https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-msci-emu-high-dividend-ucits-etf-acc/fr0010717090
  // Éligibilité d'EUDV confirmée
  // par la documentation officielle State Street ET par un comparatif
  // indépendant d'ETF PEA 2026 (recherche web du 02/09/2026). Point de
  // vigilance retenu : l'équivalent Amundi sur le même indice zone euro
  // (Amundi S&P Eurozone Dividend Aristocrat Screened, LU0959210278) est
  // lui explicitement NON éligible PEA — la zone géographique seule ne
  // suffit donc pas, EUDV a la bonne structure pour cet indice.
  // → pas de comparaison multi-fonds sur le même indice ici
  // (ISIN, TER, encours, réplication, performance sourcée).
  {
    id: 'dividendes-pea',
    label: '🟣 Dividendes (PEA)',
    intro: 'Tu veux un ETF à dividendes dans ton PEA ? Voici une option centrée sur la zone euro 🟣\nOn regarde ce qu’elle couvre 👇',
    indices: [
      // Les deux indices acceptent un dividende stable OU en hausse pendant dix ans.
      // https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy
      // https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy
      { name: 'Dividend Aristocrats mondial (rappel, non-PEA)', indexFacts: getIndexFacts('sp-global-dividend-aristocrats', '2026-08-31'), desc: getIndexDescription('sp-global-dividend-aristocrats', '2026-08-31', 'dividendes-pea'), tag: 'Large mais non-PEA 🌍' },
      { name: 'Euro Dividend Aristocrats (PEA)', indexFacts: getIndexFacts('sp-euro-dividend-aristocrats', '2026-09-30'), desc: getIndexDescription('sp-euro-dividend-aristocrats', '2026-09-30', 'dividendes-pea'), tag: 'Option dividendes en PEA 🇪🇺' },
    ],
    block2Title: '2️⃣ L\'ETF PEA DISPONIBLE 💳',
    etfGroups: [
      {
        indexName: 'Euro Dividend Aristocrats', choiceNote: 'une option PEA pour cet indice', pea: true,
        funds: [{ name: getInstrumentName("IE00B5M1WJ87", "index"), listing: requireInstrumentListing('IE00B5M1WJ87'), isin: 'IE00B5M1WJ87', ter: formatEtfTer('IE00B5M1WJ87', 'index'), repl: '🔄 Physique (réplication complète, 40 valeurs)', dist: 'distribuant semestriel', aum: getInstrumentAum("IE00B5M1WJ87", "index") }],
      },
    ],
    diversification: {
      chain: [`Dividend Aristocrats mondial (${formatIndexFact('sp-global-dividend-aristocrats', '2026-08-31', 'targetConstituents')} lignes, CTO)`, `Euro Dividend Aristocrats (${formatIndexFact('sp-euro-dividend-aristocrats', '2026-09-30', 'targetConstituents')} lignes, PEA)`],
      notes: ['⚠️ Dans cette comparaison, EUDV passe de 100 valeurs mondiales à 40 valeurs zone euro. D’autres ETF à dividendes éligibles PEA existent, mais suivent un autre indice.', '→ Résultat : les trois premiers secteurs sont la finance, l’industrie et les services aux collectivités.'],
    },
    // Performance 2023-2025 (source : recherche web du 02/09/2026, recoupée sur plusieurs pages —
    // fonds EUDV et indice S&P Euro High Yield Dividend Aristocrats cohérents à moins de 0,5 pt sur
    // 2023 et 2024 ; 2025 retenu sur la valeur datée « au 31/12/2025 » plutôt qu'un « 1 an glissant »
    // trouvé par ailleurs, qui inclut une partie de 2026).
    perfFunds: [
      // Corrigé le 25/09/2026 : 2024 8,58 → 8,55, ligne « Fund Net » EUR de State Street ; confiance élevée.
      // https://www.ssga.com/uk/en_gb/intermediary/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy
      { key: 'eudv', label: 'SPDR S&P Euro Dividend Aristocrats (EUDV)', ...getInstrumentComparatorReturns('IE00B5M1WJ87') },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Tu veux cet indice Dividend Aristocrats dans ton PEA ?', a: 'EUDV (SPDR S&P Euro Dividend Aristocrats), limité à la zone euro. Pour une autre stratégie de dividendes en PEA, il existe aussi des ETF comme Amundi MSCI EMU High Dividend.' },
      { q: '🌍 Tu veux un des ETF mondiaux présentés ici ?', a: 'Les fonds mondiaux cités dans cette comparaison sont destinés au CTO (cf. « Dividendes (CTO) »).' },
    ],
    closing: '💬 La zone euro te suffit pour cette poche dividendes ou tu veux aussi des entreprises hors PEA ?',
  },

  // ── Famille 8 : Chine ────────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Attention : l'option
  // PEA sur la Chine (Amundi PEA Chine) ne réplique pas le MSCI China
  // "vanille" mais une version filtrée ESG (MSCI China Screened Select ex
  // Thermal Coal) — précisé explicitement plutôt que présenté comme
  // strictement identique. iShares China Large Cap réplique le FTSE China
  // 50 (les 50 plus grosses lignes), pas l'indice FTSE China complet.
  // Amundi PEA Chine (PASI) re-vérifié le 04/09/2026 en 2e source indépendante (ISIN/TER/encours
  // n'avaient jamais été recroisés, contrairement à sa performance sourcée séparément la fois
  // précédente) : ISIN FR0011871078 et TER 0,65 % confirmés par une recherche dédiée ET par
  // Zonebourse (dates 31/07/2026 : 74 M€, puis 12/08/2026 : 84,35 M€). Encours mis à jour à 84 M€
  // (point le plus récent daté), fonds confirmé actif (NAV cotée au 01/09/2026).
  // Comptages des indices Chine (MSCI China 576 / MSCI China A 410 / FTSE China 50 = 50) recomptés
  // le 04/09/2026 via sources fraîches (MSCI, factsheets datés 31/07/2026) — exactement identiques,
  // aucun changement nécessaire.
  {
    id: 'chine',
    label: '🇨🇳 Chine',
    intro: '« Investir en Chine » ne désigne pas forcément les mêmes entreprises selon l’indice choisi 🇨🇳\nMSCI China, China A et FTSE China 50 : on compare 👇',
    indices: [
      // MSCI China inclut aussi des actions A continentales (à 20 % de leur flottant ajusté).
      // https://www.msci.com/indexes/index/302400/msci-china-index (31/08/2026)
      { name: 'MSCI China', indexFacts: getIndexFacts('msci-china', '2026-09-30'), desc: getIndexDescription('msci-china', '2026-09-30', 'chine'), tag: 'La référence la plus suivie 🏙️' },
      { name: 'FTSE China 50', indexFacts: getIndexFacts('ftse-china-50', '2026-08-31'), desc: getIndexDescription('ftse-china-50', '2026-08-31', 'chine'), tag: 'Ultra-concentré 🎯' },
      { name: 'MSCI China A', indexFacts: getIndexFacts('msci-china-a', '2026-09-30'), desc: getIndexDescription('msci-china-a', '2026-09-30', 'chine'), tag: 'La Chine « intérieure » 🏯' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES (PEA / CTO) 💳',
    etfGroups: [
      {
        // CORRIGÉ le 02/09/2026 : pea passé à true (une option PEA existe bel et bien ci-dessous,
        // même imparfaite) — l'ancien pea:false faisait afficher le mauvais pictogramme d'en-tête.
        indexName: 'MSCI China', choiceNote: 'CTO conseillé, 1 option PEA imparfaite', pea: true,
        subNote: '(l\'option PEA ne suit pas exactement le MSCI China classique — c\'est une version filtrée ESG)',
        funds: [
          { name: getInstrumentName("IE00BJ5JPG56", "index"), isin: 'IE00BJ5JPG56', ter: formatEtfTer('IE00BJ5JPG56', 'index'), aum: getInstrumentAum("IE00BJ5JPG56", "index"), note: '(CTO, réplique le MSCI China standard)' },
          { name: getInstrumentName("FR0011871078", "index"), isin: 'FR0011871078', ter: formatEtfTer('FR0011871078', 'index'), aum: getInstrumentAum("FR0011871078", "index"), note: '(seule option PEA — indice filtré ESG, plus cher)' },
        ],
      },
      {
        // CORRIGÉ le 02/09/2026 : l'ISIN IE00B02KXK85 est en réalité la part DISTRIBUANTE (814 M€,
        // part principale) — corrigé, faussement étiqueté "capitalisant" et sans encours auparavant.
        // Une part capitalisante existe mais ne pèse que 31 M€ (peu liquide) — la part distribuante,
        // bien plus grosse, reste le choix pertinent malgré l'écart avec la convention "capitalisant"
        // du reste de l'outil.
        indexName: 'FTSE China 50', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00B02KXK85", "index"), isin: 'IE00B02KXK85', ter: formatEtfTer('IE00B02KXK85', 'index'), repl: '🔄 Physique', dist: 'distribuant trimestriel', aum: getInstrumentAum("IE00B02KXK85", "index") }],
      },
      {
        indexName: 'MSCI China A', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00BQT3WG13", "index"), isin: 'IE00BQT3WG13', ter: formatEtfTer('IE00BQT3WG13', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: getInstrumentAum("IE00BQT3WG13", "index") }],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI, 2026) le 01/09/2026.
      chain: [`MSCI China (${formatIndexFact('msci-china', '2026-09-30', 'constituents')} lignes, y compris des actions A)`, `MSCI China A (${formatIndexFact('msci-china-a', '2026-09-30', 'constituents')}, actions continentales)`, `FTSE China 50 (${formatIndexFact('ftse-china-50', '2026-08-31', 'targetConstituents')}, Hong Kong)`],
      notes: ['⚠️ MSCI China inclut déjà des actions A du marché continental. MSCI China A s\'y concentre : les deux indices peuvent donc se recouper.', '→ Le FTSE China 50 concentre l\'essentiel du risque sur une poignée de méga-caps (tech, finance).'],
    },
    // Performance 2023-2025 (source : justETF, recherche web du 02/09/2026). Amundi PEA Chine
    // ajouté le 03/09/2026 (audit avait relevé que le verdict recommande ce fonds au lecteur PEA
    // sans jamais montrer sa propre performance, seulement celle d'un fonds CTO sur un indice
    // différent) — chiffres confirmés identiques sur 3 recherches indépendantes (Boursorama,
    // Morningstar, recherche générale), aucune contradiction rencontrée contrairement à d'autres
    // fonds de cette session.
    perfFunds: [
      // Vérifié le 25/09/2026 : part USD, rendement total calendaire BlackRock ; confiance élevée.
      // https://www.blackrock.com/fr/intermediaries/products/308751/ishares-msci-china-ucits-etf
      { key: 'msci_china', label: 'iShares MSCI China', ...getInstrumentComparatorReturns('IE00BJ5JPG56') },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille Amundi ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871078/FRA/FRA/INSTITUTIONNEL/ETF/20260228
      { key: 'amundi_pea_chine', label: 'Amundi PEA Chine (Screened)', ...getInstrumentComparatorReturns('FR0011871078') },
      // BlackRock, NAV USD de la part IE00B02KXK85, dividendes réinvestis ;
      // les anciens chiffres étaient exprimés en EUR sans distinction visible.
      // https://www.ishares.com/uk/individual/en/literature/fact-sheet/fxc-ishares-china-large-cap-ucits-etf-fund-fact-sheet-en-gb.pdf
      // Vérifié le 25/09/2026 : BlackRock part USD, affichage au dixième (-13,6/31,0/28,2).
      // Anciens centièmes écartés faute de confirmation ; confiance élevée au dixième.
      // https://www.blackrock.com/fr/particuliers/products/251798/ishares-china-large-cap-ucits-etf
      { key: 'ftse_china50', label: 'iShares China Large Cap (FTSE China 50)', ...getInstrumentComparatorReturns('IE00B02KXK85') },
      // Vérifié le 25/09/2026 : part USD, rendement total calendaire BlackRock ; confiance élevée.
      // https://www.blackrock.com/fr/particuliers/products/273192/ishares-msci-china-a-ucits-etf
      { key: 'msci_china_a', label: 'iShares MSCI China A', ...getInstrumentComparatorReturns('IE00BQT3WG13') },
    ],
    perfMethodNote: 'ℹ️ Les parts iShares MSCI China, FTSE China 50 et MSCI China A sont en dollars ; Amundi PEA Chine est en euros. Comparer directement les rendements mélange les effets de change.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🏙️ La référence la plus suivie, en CTO ?', a: 'iShares MSCI China.' },
      { q: '💳 Tu veux rester en PEA malgré tout ?', a: 'Amundi PEA Chine — mais version filtrée ESG, pas le MSCI China standard.' },
      { q: '🏯 Tu veux viser le marché intérieur chinois précisément ?', a: 'iShares MSCI China A.' },
    ],
    closing: '💬 Tu préfères une exposition chinoise large ou cibler les actions du marché continental ?',
  },

  // ── Famille 9 : Japon ────────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Point notable :
  // contrairement à l'hypothèse de départ, il EXISTE une option PEA réelle
  // sur cette famille (Amundi PEA Japon, indice TOPIX) — vérifié, pas
  // supposé.
  // Re-vérification du 04/09/2026 : Amundi PEA Japon/TOPIX (ISIN FR0013411980, TER 0,20 %)
  // confirmé par une 2e source indépendante (Zonebourse/Boursorama, distincte de la recherche
  // initiale). Encours observé volatil sur l'année (115,59 M€ fin nov. 2025 → 123,75 M€ fin janv.
  // → 153,48 M€ fin févr. → 139 M€ le 12/08 → 123,92 M€ le 27/08/2026) — mouvement de va-et-vient
  // cohérent avec un petit fonds PEA (quelques gros souscripteurs), pas une anomalie ni un signal
  // de fuite. Mis à jour au point le plus récent daté (27/08/2026), fonds confirmé actif.
  // TOPIX (nombre de lignes) recompté le 04/09/2026 via sources datées (presse financière
  // japonaise, Nikkei/JPX) : 1 637 au 31/07/2026 (contre 1 641 en mai) — déclin naturel continu,
  // cohérent avec la trajectoire déjà documentée (~2 200 avant 2025 → ~1 700 début 2025). Calendrier
  // de réforme reconfirmé en détail via la documentation JPX (retrait par PALIERS TRIMESTRIELS sur
  // 8 étapes d'oct. 2026 à juil. 2028, réévaluation oct. 2027) : la note actuelle du bloc 1
  // ("passage sous 1 000 attendu vers 2028, pas dès octobre") reste exacte, aucune correction
  // nécessaire — un chiffre "~958" trouvé dans une source évoque la liste CIBLE des valeurs
  // maintenues à terme, pas la composition réelle de l'indice à cette date.
  {
    id: 'japon',
    label: '🇯🇵 Japon',
    intro: 'Le Nikkei 225, le TOPIX et le MSCI Japan ne donnent pas le même poids aux entreprises japonaises 🇯🇵\nVoici ce que ça change 👇',
    indices: [
      // Nikkei choisit des valeurs liquides de la section Prime en équilibrant
      // les secteurs, pas les 225 plus grandes par capitalisation.
      // https://indexes.nikkei.co.jp/en/nkave/index/profile
      { name: 'Nikkei 225', indexFacts: getIndexFacts('nikkei225', '2026-08-31'), desc: getIndexDescription('nikkei225', '2026-08-31', 'japon'), tag: 'Le plus connu, pas le plus rigoureux 📰' },
      { name: 'TOPIX', indexFacts: getIndexFacts('topix', '2026-08-31'), desc: getIndexDescription('topix', '2026-08-31', 'japon'), bullets: ['⚠️ Réforme en cours : retrait graduel de 600+ valeurs à partir d\'oct. 2026, étalé sur 2 ans — passage sous 1 000 valeurs attendu vers 2028, pas dès octobre'], tag: 'Le plus large et le plus représentatif 🗾' },
      { name: 'MSCI Japan IMI', indexFacts: getIndexFacts('msci-japan-imi', '2026-09-30'), desc: getIndexDescription('msci-japan-imi', '2026-09-30', 'japon'), tag: 'Le standard international 🌐' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        // CORRIGÉ le 02/09/2026 : l'ISIN LU0839027447 (part "1D") est distribuant, pas capitalisant
        // comme la ligne l'implicitait sans le préciser — remplacé par la part capitalisante "1C"
        // du même fonds (même indice, même TER), cohérent avec la convention du reste de l'outil.
        // Encours plus petit (430 M€ contre 2 012 M€ pour la part Dist) mais réel et suffisant.
        indexName: 'Nikkei 225', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("LU2196470426", "index"), isin: 'LU2196470426', ter: formatEtfTer('LU2196470426', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: getInstrumentAum("LU2196470426", "index") }],
      },
      {
        indexName: 'TOPIX', choiceNote: 'deux parts en PEA : couvert ou non ✅', pea: true,
        // Actif géré 187,05 M€ au 31/08/2026, fiche Amundi ; vérifié le 25/09/2026.
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411980/FRA/FRA/INSTITUTIONNEL/ETF
        funds: [
          { name: getInstrumentName("FR0013411980", "index"), isin: 'FR0013411980', ter: formatEtfTer('FR0013411980', 'index'), repl: '🔄 Synthétique', dist: 'capitalisant', aum: getInstrumentAum("FR0013411980", "index"), note: '(non couvert en EUR)' },
          // Fiche historique Amundi du 30/04/2026 : PEA, 0,48 %, actif géré 150,05 M€.
          // Encours affiché : relevé justETF plus récent dans instrument-aum.js.
          // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260430
          { name: getInstrumentName("FR0013411998", "index"), isin: 'FR0013411998', ter: formatEtfTer('FR0013411998', 'index'), repl: '🔄 Synthétique', dist: 'capitalisant', aum: getInstrumentAum("FR0013411998", "index"), note: '(couvert contre le yen)' },
        ],
      },
      {
        indexName: 'MSCI Japan IMI', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00B4L5YX21", "index"), isin: 'IE00B4L5YX21', ter: formatEtfTer('IE00B4L5YX21', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: getInstrumentAum("IE00B4L5YX21", "index") }],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (JPX, factsheet MSCI) le 01/09/2026 — TOPIX en
      // cours de réforme. CORRIGÉ le 03/09/2026 : la note précédente laissait croire que le seuil de
      // 1 000 valeurs serait franchi dès octobre 2026 ; en réalité cette date marque le DÉBUT d'un
      // retrait étalé sur deux ans (600+ valeurs concernées), passage sous 1 000 attendu vers 2028.
      // TOPIX recompté le 04/09/2026 (1 637 au 31/07/2026, presse financière japonaise) — MSCI Japan
      // IMI recompté à la même date (960 au 31/05/2026, MSCI) : écart de 3 avec le chiffre existant,
      // dans la marge de bruit normal de rebalancement déjà documentée pour d'autres familles
      // (≤ quelques unités), pas corrigé.
      chain: [`TOPIX (${formatIndexConstituents('topix', '2026-08-31')} lignes, septembre 2026)`, `MSCI Japan IMI (${formatIndexFact('msci-japan-imi', '2026-09-30', 'constituents')})`, `Nikkei 225 (${formatIndexConstituents('nikkei225', '2026-08-31')}, prix-pondéré)`],
      notes: ['⚠️ Le Nikkei 225, pondéré par le prix de l\'action et non la capitalisation, peut sur-pondérer des valeurs chères mais économiquement mineures.', '→ TOPIX et MSCI Japan (pondérés par capitalisation) sont jugés plus représentatifs de l\'économie japonaise réelle.'],
    },
    // Performance 2023-2025 : Nikkei 225, part 1C en JPY selon DWS (document du 16/02/2026) ;
    // TOPIX en EUR. Les devises sont distinctes, sans conversion implicite.
    // https://etf.dws.com/en-gb/AssetDownload/Index/f819db5b-2ca4-474f-9d86-914d8bea9a58/DWS-UKKIID-LU2196470426-GB-en-2026-02-16.pdf
    // MSCI Japan IMI : BlackRock publie 2023 +18,86 %, 2024 +7,47 %, 2025 +25,36 % pour
    // IE00B4L5YX21 en USD. Les deux autres ETF du tableau sont présentés en EUR : ne pas
    // juxtaposer les valeurs USD sans conversion et validation d'une série EUR comparable.
    perfFunds: [
      // Corrigé le 25/09/2026 : 2025 28,3 → 28,2, performance part 1C JPY DWS ; confiance élevée.
      // https://etf.dws.com/Download/Past%20Performance/LU2196470426/FR/FR
      { key: 'nikkei', label: 'Xtrackers Nikkei 225', ...getInstrumentComparatorReturns('LU2196470426') },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 Amundi ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411980/FRA/FRA/INSTITUTIONNEL/ETF/20251231
      { key: 'topix', label: 'Amundi PEA Japon (TOPIX)', ...getInstrumentComparatorReturns('FR0013411980') },
      { key: 'msci_japan', label: 'iShares Core MSCI Japan IMI', y2023: null, y2024: null, y2025: null, perfNote: 'Historique absent du tableau : devise différente des séries présentées.' },
    ],
    perfMethodNote: 'ℹ️ Xtrackers Nikkei 225 est présenté en yens (part JPY) et Amundi TOPIX en euros. Ces rendements ne se comparent pas directement sans tenir compte du change.',
    verdictTitle: '✅ LE VERDICT POUR UN PEA',
    verdict: [
      { q: '💳 Tu veux rester en PEA ?', a: 'Amundi PEA Japon suit le TOPIX : deux parts, avec ou sans couverture du yen (pas Nikkei).' },
      { q: '📰 Tu veux spécifiquement le Nikkei 225, en CTO ?', a: 'Xtrackers Nikkei 225.' },
      { q: '🌐 Tu veux le standard international, en CTO ?', a: 'iShares Core MSCI Japan IMI.' },
    ],
    closing: '💬 Pour le Japon, la méthode de pondération du Nikkei te gêne ou tu la choisis justement ?',
  },

  // ── Famille 11 : Or & Argent ──────────────────────────────────────────
  // Ajoutée le 25/09/2026. Pas de "concurrence entre indices" au sens propre — l'or et l'argent
  // physiques n'ont qu'une seule source de fonds réels (le métal), donc l'angle retenu compare
  // deux métaux précieux plutôt que plusieurs méthodologies d'un même sous-jacent. TER et encours
  // vérifiés via recherche web le 25/09/2026 (justETF/fiches émetteur). ISIN et rendements repris
  // du Générateur de portefeuilles (ids "or"/"or_wisdomtree"/"or_ishares"/"or_amundi"/"argent"),
  // aucune nouvelle donnée de performance saisie ici (cf. CLAUDE.md, pas de duplication).
  // Or : perfFunds reprend la série "or_ishares" (NAV BlackRock USD, source directe iShares) pour
  // rester cohérent avec le fonds affiché en premier dans le bloc 2 ci-dessous — les 3 autres
  // émetteurs ont chacun leur propre série, très proche (à 0,3 pt près), dans le Générateur.
  // Contrôle du 03/10/2026 : or et argent utilisent leurs rendements NAV officiels USD,
  // nets des frais de chaque ETC, sans conversion de devise. L’argent vient de VERIFIED_RETURNS.
  {
    id: 'or-argent',
    label: '🥇 Or & Argent',
    intro: 'Un ETC or ou un ETC argent pour protéger ton portefeuille ? Deux métaux précieux, deux profils différents 🥇\nOn décrypte les deux 👇',
    indices: [
      { name: 'Or physique', desc: 'Exposition directe au cours de l\'or, via un ETC adossé à du métal physique détenu en coffre — pas une action minière, pas de réplication synthétique.', tag: 'La valeur refuge historique 🛡️' },
      { name: 'Argent physique', desc: 'Même principe que l\'or (ETC adossé au métal physique), mais un marché plus petit et plus volatil, à la fois valeur refuge et matière première industrielle (électronique, panneaux solaires).', tag: 'Plus volatil, à double usage ⚡' },
    ],
    block2Title: '2️⃣ LES ETC DISPONIBLES (CTO) 💳',
    etfGroups: [
      {
        indexName: 'Or physique', choiceNote: 'Non éligible PEA — CTO uniquement, 4 émetteurs', pea: false,
        funds: [
          { name: getInstrumentName("IE00B4ND3602", "index"), isin: 'IE00B4ND3602', ter: formatEtfTer('IE00B4ND3602', 'index'), aum: getInstrumentAum("IE00B4ND3602", "index"), note: '(le plus gros encours)' },
          { name: getInstrumentName("IE00B579F325", "index"), isin: 'IE00B579F325', ter: formatEtfTer('IE00B579F325', 'index'), aum: getInstrumentAum("IE00B579F325", "index") },
          { name: getInstrumentName("FR0013416716", "index"), isin: 'FR0013416716', ter: formatEtfTer('FR0013416716', 'index'), aum: getInstrumentAum("FR0013416716", "index") },
          { name: getInstrumentName("JE00B1VS3770", "index"), isin: 'JE00B1VS3770', ter: formatEtfTer('JE00B1VS3770', 'index'), aum: getInstrumentAum("JE00B1VS3770", "index"), note: '(le plus cher des quatre)' },
        ],
      },
      {
        indexName: 'Argent physique', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00B4NCWG09", "index"), isin: 'IE00B4NCWG09', ter: formatEtfTer('IE00B4NCWG09', 'index'), aum: getInstrumentAum("IE00B4NCWG09", "index") }],
      },
    ],
    diversification: {
      chain: ['Or physique (exposition à 1 seul actif : le métal)', 'Argent physique (exposition à 1 seul actif : le métal)'],
      notes: ['⚠️ Contrairement aux ETF actions plus haut, un ETC or/argent ne diversifie rien : un seul actif, pas un panier de titres.', '→ L\'argent, plus utilisé par l\'industrie que l\'or, réagit aussi aux cycles économiques — pas seulement à la demande "valeur refuge".'],
    },
    perfFunds: [
      { key: 'or', label: 'Or physique', ...getInstrumentComparatorReturns('IE00B4ND3602') },
      { key: 'argent', label: 'Argent physique', ...getInstrumentComparatorReturns('IE00B4NCWG09') },
    ],
    perfMethodNote: 'ℹ️ Or et argent : rendements NAV officiels des ETC iShares en dollars, nets des frais du produit, sans conversion de devise. Aucun dividende ni coupon.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🛡️ Tu veux la valeur refuge la plus reconnue ?', a: 'Or physique.' },
      { q: '⚡ Tu acceptes plus de volatilité pour un potentiel de hausse plus marqué ?', a: 'Argent physique.' },
      { q: '💰 Le moins cher entre les 4 ETC or ?', a: 'iShares, Invesco et Amundi, à égalité.' },
    ],
    closing: '💬 Toi, l\'or, l\'argent, ou aucun métal précieux dans ton portefeuille ?',
  },

  // ── Famille 12 : Crypto ────────────────────────────────────────────────
  // Ajoutée le 25/09/2026. Même logique que la famille Or & Argent : Bitcoin et Ethereum sont
  // deux actifs différents plutôt que deux méthodologies d'un même indice. ISIN et rendements
  // repris du Générateur de portefeuilles (ids "bitcoin"/"bitcoin_wisdomtree"/"bitcoin_etcgroup"/
  // "bitcoin_21shares"/"ethereum"), aucune nouvelle donnée de performance saisie ici (perfFunds
  // reprend la série NAV CoinShares USD, fonds affiché en premier dans le bloc 2 ci-dessous).
  // TER/encours vérifiés via recherche web le 25/09/2026 (justETF/fiches émetteur).
  // Fonds ex-"ETC Group Physical Bitcoin" (DE000A27Z304) : Bitwise a racheté ETC Group et
  // rebaptisé toute sa gamme européenne "Bitwise Physical Bitcoin ETP" en janvier 2025 (même
  // ISIN/ticker BTCE, confirmé par 2 requêtes web indépendantes le 25/09/2026) — le Générateur de
  // portefeuilles porte déjà ce nom à jour pour ce même ISIN (id "bitcoin_etcgroup"), cohérent.
  {
    id: 'crypto',
    label: '₿ Crypto',
    intro: 'Bitcoin ou Ethereum en ETP, sur ton compte-titres ? Deux cryptomonnaies, deux profils différents ₿\nOn décrypte les deux 👇',
    indices: [
      { name: 'Bitcoin', desc: 'La première cryptomonnaie, souvent présentée comme un « or numérique » — une réserve de valeur pour ses partisans, avant tout un moyen d\'échange à l\'origine.', tag: 'La plus connue, la plus liquide ₿' },
      { name: 'Ethereum', desc: 'La deuxième cryptomonnaie par capitalisation, socle de nombreuses applications décentralisées (finance, contrats intelligents) — un profil et un usage différents du Bitcoin.', tag: 'Plus applicatif, plus volatil ⚡' },
    ],
    block2Title: '2️⃣ LES ETP DISPONIBLES (CTO) 💳',
    etfGroups: [
      {
        indexName: 'Bitcoin', choiceNote: 'Non éligible PEA — CTO uniquement, 4 émetteurs', pea: false,
        funds: [
          { name: getInstrumentName("GB00BLD4ZL17", "index"), isin: 'GB00BLD4ZL17', ter: formatEtfTer('GB00BLD4ZL17', 'index'), aum: getInstrumentAum("GB00BLD4ZL17", "index") },
          { name: getInstrumentName("GB00BJYDH287", "index"), isin: 'GB00BJYDH287', ter: formatEtfTer('GB00BJYDH287', 'index'), aum: getInstrumentAum("GB00BJYDH287", "index") },
          { name: getInstrumentName("CH0454664001", "index"), isin: 'CH0454664001', ter: formatEtfTer('CH0454664001', 'index'), aum: getInstrumentAum("CH0454664001", "index"), note: '(le plus ancien de la sélection, lancé en 2019)' },
          { name: getInstrumentName("DE000A27Z304", "index"), isin: 'DE000A27Z304', ter: formatEtfTer('DE000A27Z304', 'index'), aum: getInstrumentAum("DE000A27Z304", "index"), note: '(ex-ETC Group, renommé en 2025 — TER le plus élevé des quatre)' },
        ],
      },
      {
        indexName: 'Ethereum', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("GB00BLD4ZM24", "index"), isin: 'GB00BLD4ZM24', ter: formatEtfTer('GB00BLD4ZM24', 'index'), aum: getInstrumentAum("GB00BLD4ZM24", "index"), note: '(0% de frais de gestion + un rendement de staking crédité à part, ~1,25%/an)' }],
      },
    ],
    diversification: {
      chain: ['Bitcoin (exposition à 1 seul actif)', 'Ethereum (exposition à 1 seul actif)'],
      notes: ['⚠️ Comme pour l\'or et l\'argent, un ETP crypto ne diversifie rien : un seul actif, une seule source de risque.', '→ Bitcoin et Ethereum ont souvent évolué dans le même sens, mais pas systématiquement — Ethereum a connu des années nettement plus ou moins bonnes que le Bitcoin.'],
    },
    perfFunds: [
      { key: 'bitcoin', label: 'Bitcoin', ...getInstrumentComparatorReturns('GB00BLD4ZL17') },
      { key: 'ethereum', label: 'Ethereum', ...getInstrumentComparatorReturns('GB00BLD4ZM24') },
    ],
    perfMethodNote: 'ℹ️ Cours spot BTC/USD et ETH/USD (Slickcharts), pas le rendement propre de chaque ETP — qui peut différer selon les frais, le tracking, et le rendement de staking crédité à part pour l\'Ethereum. Hors effet de change €/$. Bitcoin et Ethereum sont deux actifs différents, pas deux façons d\'accéder au même actif.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '₿ Tu veux la crypto la plus connue et la plus liquide ?', a: 'Bitcoin.' },
      { q: '⚡ Tu veux l\'exposition la plus volatile des deux ?', a: 'Ethereum.' },
      { q: '💰 Le moins cher des ETP proposés ?', a: 'CoinShares ou WisdomTree, à égalité (et 0% de frais de gestion pour l\'Ethereum, staking à part).' },
    ],
    closing: '💬 Toi, Bitcoin, Ethereum, les deux, ou aucune crypto dans ton portefeuille ?',
  },

  // 27/09/2026 — famille distincte de « Monde large » : celle-ci compare
  // trois périmètres développés (USA inclus, USA exclus, petites valeurs).
  // Composition MSCI au 31/08/2026 ; ETF BlackRock et DWS (31/08/2026).
  // https://www.msci.com/indexes/index/991000/msci-world-ex-usa-index
  // https://www.msci.com/documents/10199/255599/msci-world-small-cap-index.pdf
  // https://etf.dws.com/fr-fr/AssetDownload/Index/410e8206-23cd-463b-b2a5-6018bfc1fd32/Factsheet.pdf
  {
    id: 'monde-segments',
    label: '🔎 Monde : quels segments ?',
    intro: 'World, World sans États-Unis, petites capitalisations : trois façons très différentes d’investir dans les pays développés 🌍\nOn regarde ce qui change 👇',
    indices: [
      { name: 'MSCI World', indexFacts: getIndexFacts('world', '2026-09-30'), desc: getIndexDescription('world', '2026-09-30', 'monde-segments'), tag: 'Le cœur développé 🌍' },
      { name: 'MSCI World ex USA', indexFacts: getIndexFacts('world-ex-usa', '2026-08-31'), desc: getIndexDescription('world-ex-usa', '2026-08-31', 'monde-segments'), tag: 'Réduire le poids américain 🇺🇸' },
      { name: 'MSCI World Small Cap', indexFacts: getIndexFacts('world-small-cap', '2026-08-31'), desc: getIndexDescription('world-small-cap', '2026-08-31', 'monde-segments'), tag: 'Ajouter les petites entreprises 🔎' },
    ],
    block2Title: '2️⃣ EXEMPLES D’ETF DISPONIBLES (CTO) 💳',
    etfGroups: [
      { indexName: 'MSCI World', choiceNote: 'part physique en CTO, autres options PEA dans « Monde large »', pea: false,
        funds: [{ name: getInstrumentName("IE00B4L5Y983", "index"), listing: requireInstrumentListing('IE00B4L5Y983'), isin: 'IE00B4L5Y983', ter: formatEtfTer('IE00B4L5Y983', 'index'), repl: '🔄 Physique', dist: 'capitalisant' }] },
      { indexName: 'MSCI World ex USA', choiceNote: 'fonds récent, CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE0006WW1TQ4", "index"), listing: requireInstrumentListing('IE0006WW1TQ4'), isin: 'IE0006WW1TQ4', ter: formatEtfTer('IE0006WW1TQ4', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: getInstrumentAum("IE0006WW1TQ4", "index") }] },
      { indexName: 'MSCI World Small Cap', choiceNote: 'CTO uniquement', pea: false,
        funds: [{ name: getInstrumentName("IE00BF4RFH31", "index"), listing: requireInstrumentListing('IE00BF4RFH31'), isin: 'IE00BF4RFH31', ter: formatEtfTer('IE00BF4RFH31', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: getInstrumentAum("IE00BF4RFH31", "index") }] },
    ],
    diversification: {
      chain: [`World (${formatIndexConstituents('world', '2026-09-30')}, septembre 2026)`, `World ex USA (${formatIndexConstituents('world-ex-usa', '2026-08-31')}, septembre 2026)`, `World Small Cap (${formatIndexConstituents('world-small-cap', '2026-08-31')}, septembre 2026)`],
      notes: ['⚠️ Le World ex USA conserve les grandes et moyennes capitalisations : il retire un pays, pas une tranche de taille.', '→ World Small Cap ajoute une tranche de taille absente du World classique ; il contient encore beaucoup d’entreprises américaines.'],
    },
    // SWDA et WSML : séries USD du Générateur, mêmes ISIN ; confiance élevée.
    // https://www.ishares.com/uk/individual/en/products/251882/ishares-core-msci-world-ucits-etf
    // https://www.ishares.com/uk/professionals/en/products/296576/ishares-msci-world-small-cap-ucits-etf
    // EXUS lancé le 06/03/2024 : pas de rendement propre sur les trois années.
    perfFunds: [
      { key: 'world', label: 'iShares Core MSCI World (SWDA)', ...getInstrumentComparatorReturns('IE00B4L5Y983') },
      { key: 'ex_usa', label: 'Xtrackers MSCI World ex USA (EXUS)', y2023: null, y2024: null, y2025: null, perfNote: 'Part lancée en mars 2024 : pas de série annuelle complète 2023–2025.' },
      { key: 'small_cap', label: 'iShares MSCI World Small Cap (WSML)', ...getInstrumentComparatorReturns('IE00BF4RFH31') },
    ],
    perfMethodNote: 'ℹ️ SWDA et WSML : rendements des parts en dollars, dividendes réinvestis et frais déduits. La part EXUS, plus récente, n’a pas trois années civiles complètes. Performances passées non prédictives.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🌍 Une base développée ?', a: 'MSCI World inclut grandes et moyennes sociétés, notamment américaines.' },
      { q: '🇺🇸 Réduire les États-Unis ?', a: 'World ex USA retire les sociétés américaines, sans ajouter les émergents.' },
      { q: '🔎 Ajouter les petites entreprises ?', a: 'World Small Cap complète la tranche de taille laissée de côté par le World.' },
    ],
    closing: '💬 Pour compléter un World, tu préférerais moins d’USA ou davantage de petites capitalisations ?',
  },
]
