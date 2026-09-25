import { formatEtfTer } from '../../data/etf-ter.js';
// Données du Comparateur d'indices — extrait de App.jsx le 14/09/2026 (audit "outils", point 3)
// pour aligner cet outil sur la convention data.js/lib.js/App.jsx du reste de l'application (cf.
// CLAUDE.md) : App.jsx était le seul composant à mélanger données et logique/rendu dans un seul
// fichier de 917 lignes. Déplacement de code strict — aucune donnée modifiée, aucune valeur
// touchée, seul l'emplacement change.
//
// Comparateur d'indices — génère un tweet comparatif (structure fixe en 5 blocs numérotés +
// verdict + question finale) pour une famille d'indices concurrents. Seules les données
// STRUCTURELLES (composition, ETF disponibles, ISIN, TER, encours, éligibilité PEA) sont
// pré-rédigées et sourcées ci-dessous — jamais la performance, saisie à la main à chaque
// génération (cf. formulaire dans App.jsx), comme le reste de la bibliothèque de l'appli.
// Sources et niveau de confiance documentés dans le commentaire de chaque famille. Éligibilité
// PEA vérifiée fonds par fonds — jamais supposée.

// ─────────────────────────────────────────────────────────────────────────
// FAMILLES — 10 au total. Famille 1 (Europe) reprend telle quelle l'exemple
// de référence fourni. Familles 2-10 rédigées à partir de données réelles
// vérifiées (cf. commentaire de sourcing sur chaque famille), en reprenant
// pour plusieurs fonds les ISIN déjà vérifiés ailleurs dans l'application
// (src/pages/etf-sheets/data.js, src/pages/portfolio-generator/data.js) —
// jamais une nouvelle donnée non recoupée quand une donnée déjà vérifiée
// cette session existe.
//
// Émergents et Dividendes ont été scindées le 02/09/2026 en versions PEA et
// CTO séparées (demande explicite) plutôt qu'un seul tweet mélangeant des
// options non-éligibles PEA.
// ─────────────────────────────────────────────────────────────────────────

export const FAMILIES = [
  {
    id: 'europe',
    label: '🇪🇺 Europe',
    intro: 'STOXX 600, EURO STOXX 50, MSCI Europe : trois façons de dire « j’investis en Europe », mais pas trois fois le même panier 🇪🇺\nOn regarde ce qui change 👇',
    indices: [
      { name: 'STOXX 600', desc: 'Les 600 plus grandes entreprises européennes, 17 pays.', bullets: ['✅ UK + Suisse + Scandinavie inclus'], tag: 'Le plus large 🌍' },
      { name: 'EURO STOXX 50', desc: 'Les 50 plus grosses boîtes de la zone euro uniquement.', tag: 'Ultra-concentré (ASML, SAP, LVMH…) 🎯' },
      { name: 'MSCI Europe', desc: 'Les grandes valeurs de 15 pays développés européens.', tag: 'Très proche du STOXX 600 👯' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        // CORRIGÉ le 02/09/2026 : le fonds le moins cher (Amundi Core, 0,07 %) n'est PAS éligible
        // PEA (réplication physique, contient UK/Suisse) — seul BNP ETZ (swap PEA) l'est. Les deux
        // sont affichés pour ne pas laisser croire que 0,19 % est le prix plancher de cette exposition.
        indexName: 'STOXX 600', choiceNote: '1 option PEA + 1 alternative bien moins chère en CTO', pea: true,
        funds: [
          { name: 'BNP Paribas Easy STOXX Europe 600 UCITS ETF', ticker: 'ETZ', isin: 'FR0011550193', ter: formatEtfTer('FR0011550193', 'index'), aum: '1 205 M€ au 30/01/2026', note: '(seule option PEA)' },
          { name: 'Amundi Core STOXX Europe 600 UCITS ETF', isin: 'LU0908500753', ter: formatEtfTer('LU0908500753', 'index'), aum: '21 171 M€', note: '(CTO uniquement — le moins cher, et de loin le plus gros encours ⚡)' },
        ],
      },
      {
        indexName: 'EURO STOXX 50', choiceNote: 'le plus de choix', pea: true, subNote: '(indice 100 % zone euro)',
        funds: [
          { name: 'iShares Core EURO STOXX 50 (Acc)', isin: 'IE00B53L3W79', ter: formatEtfTer('IE00B53L3W79', 'index'), aum: '7 667 M€' },
          { name: 'HSBC EURO STOXX 50', isin: 'IE00B4K6B022', ter: formatEtfTer('IE00B4K6B022', 'index'), note: '(le moins cher ⚡)' },
        ],
      },
      {
        indexName: 'MSCI Europe', choiceNote: 'un seul vrai choix', pea: true,
        funds: [{ name: 'Amundi PEA MSCI Europe UCITS ETF (Acc)', ticker: 'PCEU', isin: 'FR0013412038', ter: formatEtfTer('FR0013412038', 'index'), repl: '🔄 Synthétique', dist: 'capitalisant', aum: '383 M€ au 31/08/2026' }],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (facsheets STOXX/MSCI) le 01/09/2026.
      chain: ['STOXX 600 (600 lignes)', 'MSCI Europe (396)', 'EURO STOXX 50 (50)'],
      notes: ['⚠️ Le 50 concentre ton risque : ses 10 plus grosses lignes pèsent +41 % de l\'indice.', '→ Une forte dépendance à quelques grandes sociétés de la zone euro.'],
    },
    // Performance 2023-2025 des fonds ci-dessus. PCEU revu sur les fiches Amundi
    // 2026 (2025 rectifié à 19,41 le 25/09/2026) ; ETZ recoupé avec la fiche BNP ; iShares ci-dessous.
    // YTD non inclus ici (saisi par l'utilisateur, cf. formulaire).
    perfFunds: [
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille Amundi du 30/04/2026 ; confiance élevée.
      // 2025 : 19,42 → 19,41 selon la série corrigée des fiches officielles 2026.
      // https://www.amundietf.fr/pdfDocuments/download/c4f606a3-f783-4553-b7f6-143137c8d964/MonthlyFactsheet_4386409_CL78022_FRA_ENG_ETF_INSTITUTIONNEL_20260430.pdf
      { key: 'msci_europe', label: 'Amundi PEA MSCI Europe (PCEU)', y2023: 15.95, y2024: 8.60, y2025: 19.41 },
      // Vérifié le 25/09/2026 : part BNP FR0011550193, « EUR C », performances calendaires
      // du fonds ; confiance élevée. 2023/2024/2025 : 14,37/8,41/20,48.
      // https://docfinder.bnpparibas-am.com/api/files/85e997cf-94fd-48ba-9406-225f0a281549/1024
      { key: 'stoxx600', label: 'BNP STOXX 600 (ETZ)', y2023: 14.37, y2024: 8.41, y2025: 20.48 },
      // Part iShares IE00B53L3W79, ligne « Share Class » de la fiche BlackRock du 31/08/2026 :
      // https://www.ishares.com/gls-download/literature/fact-sheet/cssx5e-ishares-core-euro-stoxx-50-ucits-etf-fund-fact-sheet-en-gb.pdf
      { key: 'eurostoxx50', label: 'iShares EURO STOXX 50 (SXRT)', y2023: 22.78, y2024: 11.54, y2025: 21.78 },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Exposition la plus large, en PEA ?', a: 'ETZ (BNP STOXX 600)' },
      { q: '💸 Le moins cher + zone euro pure, en PEA ?', a: `EURO STOXX 50 (HSBC, ${formatEtfTer('IE00B4K6B022', 'index')})` },
      { q: '🇫🇷 Europe large, avec UK/Suisse, fonds français en PEA ?', a: 'PCEU (Amundi MSCI Europe)' },
      { q: '⚡ Le moins cher tout court, en CTO ?', a: `Amundi Core STOXX 600 (${formatEtfTer('LU0908500753', 'index')}, 21 Md€ d'encours)` },
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
      { name: 'MSCI World', desc: 'Les 1 283 plus grandes entreprises de 23 pays développés.', tag: 'Le classique du monde développé 🏛️' },
      { name: 'MSCI ACWI', desc: 'Le MSCI World + les marchés émergents (Chine, Inde, Brésil…), 2 461 valeurs.', tag: 'Le monde presque entier 🌐' },
      { name: 'FTSE All-World', desc: 'Grandes et moyennes entreprises des pays développés et émergents, comme l’ACWI : 4 263 valeurs au 31/08/2026.', tag: 'Le plus large des trois 🔭' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI World', choiceNote: '3 vraies options en PEA', pea: true,
        funds: [
          { name: 'Amundi MSCI World Swap UCITS ETF (Acc)', ticker: 'CW8', isin: 'LU1681043599', ter: formatEtfTer('LU1681043599', 'index'), aum: '6 495 M€', note: '(le plus gros encours, et de loin)' },
          { name: 'iShares MSCI World Swap PEA UCITS ETF (Acc)', ticker: 'WPEA', isin: 'IE0002XZSHO1', ter: formatEtfTer('IE0002XZSHO1', 'index'), aum: '2 071 M€', note: '(moins cher)' },
          { name: 'Amundi PEA Monde (MSCI World) UCITS ETF (Acc)', ticker: 'DCAM', isin: 'FR001400U5Q4', ter: formatEtfTer('FR001400U5Q4', 'index'), aum: '1 370 M€' },
        ],
      },
      {
        // CORRIGÉ le 02/09/2026 : un ETF PEA sur l'ACWI existe depuis le 15/07/2026 (Amundi PEA
        // Global) — signalé à tort comme non-PEA dans la version précédente. SPDR (CTO) reste
        // affiché pour comparaison, bien moins cher.
        indexName: 'MSCI ACWI', choiceNote: 'enfin en PEA depuis juillet 2026', pea: true,
        funds: [
          { name: 'Amundi PEA Global (MSCI ACWI) UCITS ETF (Acc)', ticker: 'GPEA', isin: 'FR0014017NX3', ter: formatEtfTer('FR0014017NX3', 'index'), aum: '46 M€', note: '(seule option PEA, lancée le 15/07/2026 — encours en forte croissance)' },
          { name: 'SPDR MSCI ACWI UCITS ETF (Acc)', isin: 'IE00B44Z5B48', ter: formatEtfTer('IE00B44Z5B48', 'index'), aum: '15 900 M€', note: '(CTO, moins cher et plus gros encours)' },
        ],
      },
      {
        indexName: 'FTSE All-World', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [
          { name: 'Xtrackers FTSE All-World UCITS ETF 1C', isin: 'IE000L6ZMMC4', ter: formatEtfTer('IE000L6ZMMC4', 'index'), aum: '110 M€', note: '(le moins cher, fonds récent — avril 2026)' },
          { name: 'Vanguard FTSE All-World UCITS ETF (Acc)', ticker: 'VWCE', isin: 'IE00BK5BQT80', ter: formatEtfTer('IE00BK5BQT80', 'index'), aum: '50 000 M€', note: '(le plus gros encours, le plus connu)' },
        ],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI/FTSE, juin-juillet 2026) le 01/09/2026.
      chain: ['MSCI World (1 283 lignes)', 'MSCI ACWI (2 461)', 'FTSE All-World (4 263 au 31/08/2026)'],
      notes: ['⚠️ Peu importe lequel des trois tu prends : ils pèsent tous 60 à 70 % d\'actions américaines.', '→ Le vrai choix, c\'est les émergents (dedans ou pas) — pas le poids des USA, qui est de toute façon similaire partout.'],
    },
    // Performance 2023-2025 (source : justETF/extraetf, recherche web du 02/09/2026). CW8 retenu en
    // représentant PEA de MSCI World (historique complet), plutôt que DCAM ou WPEA, trop récents pour
    // avoir 3 années pleines. GPEA (ACWI, PEA) : lancé le 15/07/2026 — aucune performance annuelle
    // réelle sur 2023-2025, laissé à vérifier plutôt que de substituer une performance d'indice.
    // VWCE : performances calendaires de la part Acc USD, ligne « Fund » du KIID Vanguard
    // (arrondies au dixième) : https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf
    perfFunds: [
      { key: 'msci_world', label: 'Amundi MSCI World (CW8, PEA)', y2023: 19.46, y2024: 26.33, y2025: 6.39 },
      { key: 'acwi', label: 'Amundi PEA Global ACWI (GPEA)', y2023: null, y2024: null, y2025: null, perfNote: 'Fonds trop récent pour avoir un historique (lancé le 15/07/2026).' },
      { key: 'ftse_aw', label: 'Vanguard FTSE All-World (VWCE)', y2023: 22.0, y2024: 17.2, y2025: 22.6 },
    ],
    perfMethodNote: 'ℹ️ CW8 : rendement du fonds en euros, net de frais. VWCE : rendement du fonds en dollars, net de frais. Dividendes réinvestis dans les deux cas ; la devise change la comparaison.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💸 En PEA, tu veux le moins cher ?', a: `WPEA ou DCAM, à égalité à ${formatEtfTer('FR001400U5Q4', 'index')} — moins cher que CW8 (${formatEtfTer('LU1681043599', 'index')}), pour le même indice.` },
      { q: '💳 En PEA, tu veux le fonds avec le plus d\'encours (pas forcément le meilleur choix) ?', a: `CW8 (Amundi MSCI World) — 6,5 Md€, mais TER plus élevé (${formatEtfTer('LU1681043599', 'index')}) que WPEA/DCAM.` },
      { q: '🌐 Tu veux les émergents inclus, mais en PEA ?', a: 'GPEA (Amundi PEA Global ACWI) — tout nouveau, lancé en juillet 2026.' },
      { q: '💰 Le moins cher toutes catégories confondues, en CTO ?', a: `Xtrackers FTSE All-World, à ${formatEtfTer('IE000L6ZMMC4', 'index')}.` },
    ],
    closing: '💬 Tu veux les émergents dans ton ETF principal ou dans une ligne à part ?',
  },

  // ── Famille 3 : USA large ────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Amundi PEA S&P 500 /
  // Nasdaq-100 déjà vérifiés ailleurs dans l'appli (etf-sheets/data.js).
  // Point notable : le seul ETF PEA jamais lancé sur le Russell 1000 « pur »
  // (Russell 1000 THEAM Easy, FR0010616292) a été liquidé — plus aucune
  // option PEA active sur cet indice à ce jour (vérifié via recherche web).
  {
    id: 'usa',
    label: '🇺🇸 USA large',
    intro: 'Un ETF USA peut détenir 100, 500 ou près de 1 000 valeurs. Et ça change ce que tu détiens vraiment 🇺🇸\nOn compare les quatre indices 👇',
    indices: [
      { name: 'S&P 500', desc: 'Les 500 plus grandes entreprises cotées aux États-Unis.', tag: 'La référence mondiale 🏆' },
      { name: 'Nasdaq 100', desc: 'Les 100 plus grosses non-financières du Nasdaq : ultra tech.', tag: 'Le plus concentré tech 💻' },
      { name: 'MSCI USA', desc: 'Grandes ET moyennes capitalisations US, 527 valeurs.', tag: 'Un peu plus large que le S&P 500 📏' },
      { name: 'Russell 1000', desc: 'Les 1 000 plus grandes valeurs US, ~93 % de la capitalisation du marché américain.', tag: 'Le plus large des quatre 🌊' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'S&P 500', choiceNote: 'le plus gros ≠ le moins cher', pea: true,
        // BNP Paribas Easy plus gros encours (3,3 Md€ vs 1,15 Md€) mais TER légèrement supérieur —
        // vérifié via recherche web le 01/09/2026, corrige un choix initial qui ne montrait que l'option Amundi.
        funds: [
          { name: 'BNP Paribas Easy S&P 500 UCITS ETF (Acc)', isin: 'FR0011550185', ter: formatEtfTer('FR0011550185', 'index'), aum: '3,3 Md€', note: '(le plus gros encours)' },
          { name: 'Amundi PEA S&P 500 UCITS ETF (Acc)', isin: 'FR0011871128', ter: formatEtfTer('FR0011871128', 'index'), aum: '1,15 Md€', note: '(le moins cher ⚡)' },
        ],
      },
      {
        // CORRIGÉ le 02/09/2026 : ajout de l'alternative CTO (BNP Paribas Easy II), moins chère et
        // plus grosse que l'option PEA — cohérence avec le traitement des autres familles.
        indexName: 'Nasdaq 100', choiceNote: '1 option PEA + 1 alternative moins chère en CTO', pea: true,
        funds: [
          { name: 'Amundi PEA Nasdaq-100 UCITS ETF (Acc)', isin: 'FR0011871110', ter: formatEtfTer('FR0011871110', 'index'), aum: '1,17 Md€', note: '(seule option PEA)' },
          { name: 'BNP Paribas Easy II Nasdaq 100 UCITS ETF (Acc)', isin: 'IE000QDFFK00', ter: formatEtfTer('IE000QDFFK00', 'index'), aum: '2,73 Md€', note: '(CTO uniquement, moins cher et plus gros encours)' },
        ],
      },
      {
        indexName: 'MSCI USA', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI USA UCITS ETF (Acc)', isin: 'IE00B52SFT06', ter: formatEtfTer('IE00B52SFT06', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: '2,9 Md€' }],
      },
      {
        indexName: 'Russell 1000', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [],
        narrativeNote: 'Il n\'existe pas de tracker qui réplique le Russell 1000 tout seul : seulement des versions Growth ou Value (iShares Russell 1000 Growth / Value UCITS ETF, en CTO). Et le seul ETF PEA qui avait été lancé sur cet indice (THEAM Easy Russell 1000) a fini par être liquidé — donc aucune option PEA active aujourd\'hui.',
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI/S&P, juillet 2026) le 01/09/2026.
      chain: ['Russell 1000 (1 000 lignes)', 'MSCI USA (527)', 'S&P 500 (500)', 'Nasdaq 100 (100)'],
      notes: ['⚠️ Le Nasdaq 100 exclut tout le secteur financier et concentre près de 50 % sur ses 10 plus grosses lignes.', '→ Si ton portefeuille contient déjà un S&P 500, vérifie combien de ses grandes valeurs tu rachètes avec le Nasdaq-100.'],
    },
    // Nasdaq PEA : performances calendaires officielles de la part Amundi FR0011871110 en EUR,
    // ligne « Portefeuille » (2023-2025). L'ancienne série reprenait le Nasdaq en USD et
    // passait à tort pour les rendements de cette part en euros ; l'audit ISIN seul ne pouvait
    // pas repérer cette erreur puisque les deux outils partageaient le même proxy.
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/RETAIL/ETF
    perfFunds: [
      { key: 'sp500', label: 'Amundi PEA S&P 500', y2023: 21.68, y2024: 32.85, y2025: 3.45 },
      { key: 'nasdaq100', label: 'Amundi PEA Nasdaq-100', y2023: 49.32, y2024: 33.58, y2025: 6.01 },
      // Vérifié le 25/09/2026 : ligne « Rendement total (%) USD », 2023–2025,
      // https://www.blackrock.com/fr/intermediaries/products/253740/ishares-msci-usa-b-ucits-etf
      // Confiance élevée (émetteur, part et devise explicites).
      // BlackRock, NAV USD de la part IE00B52SFT06 : les anciens 22,33/32,69/3,82
      // correspondaient à une autre devise et n'étaient pas comparables sans note.
      // https://www.blackrock.com/fr/particuliers/products/253740/ishares-msci-usa-b-ucits-etf
      { key: 'msci_usa', label: 'iShares MSCI USA', y2023: 26.7, y2024: 24.8, y2025: 17.4 },
    ],
    perfMethodNote: 'ℹ️ Les deux ETF Amundi sont présentés en euros ; iShares MSCI USA est présenté en dollars (NAV de la part USD). Les performances ne sont pas directement comparables sans tenir compte du change.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Tu veux rester en PEA ?', a: 'Amundi PEA S&P 500 (large et simple) ou Amundi PEA Nasdaq-100 (concentré tech).' },
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
      { name: 'Émergents global (indice ESG)', desc: 'PAEEM suit désormais le MSCI EM ex-Egypt ESG Broad CTB Select : univers de 23 pays émergents, Égypte exclue, avec des filtres ESG et climatiques (pas les mêmes lignes qu’un fonds CTO classique).', tag: 'Le PEA généraliste 🌍' },
      { name: 'Asie émergente', desc: 'Zone couverte par PAASI : indice MSCI EM Asia Screened Select ex Thermal Coal — 8 pays d\'Asie émergente (Chine, Inde, Taïwan, Corée du Sud…).', tag: 'Concentré sur l\'Asie 🌏' },
      { name: 'Amérique latine', desc: 'Zone couverte par PALAT : indice MSCI Emerging Markets Latin America — Brésil et Mexique en tête.', tag: 'Le pari régional le plus étroit 🌎' },
      { name: 'Inde seule', desc: 'Zone couverte par PINR : indice MSCI India — un seul pays, aucune diversification régionale.', tag: 'Le pari 100 % Inde 🇮🇳' },
      { name: 'EMEA émergente', desc: 'Zone couverte par PLEM : indice MSCI Emerging EMEA ESG Transition — Europe de l\'Est, Moyen-Orient et Afrique émergents (Afrique du Sud, pays du Golfe…).', tag: 'La zone la plus confidentielle 🌍' },
    ],
    block2Title: '2️⃣ LES ETF PEA DISPONIBLES 💳',
    etfGroups: [
      {
        indexName: 'Émergents global (ESG resserré)', choiceNote: 'seule option PEA généraliste sur les émergents', pea: true,
        funds: [{ name: 'Amundi PEA Emergent (MSCI Emerging) ESG Transition UCITS ETF', ticker: 'PAEEM', isin: 'FR0013412020', ter: formatEtfTer('FR0013412020', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: '867 M€' }],
      },
      {
        indexName: 'Asie émergente', choiceNote: 'seule option PEA sur cette zone', pea: true,
        funds: [{ name: 'Amundi PEA Asie Emergente (MSCI Emerging Asia) Screened UCITS ETF', ticker: 'PAASI', isin: 'FR0013412012', ter: formatEtfTer('FR0013412012', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: '735 M€' }],
      },
      {
        indexName: 'Amérique latine', choiceNote: 'seule option PEA sur cette zone', pea: true,
        funds: [{ name: 'Amundi PEA Amérique Latine (MSCI Emerging Latin America Selection) UCITS ETF', ticker: 'PALAT', isin: 'FR0013412004', ter: formatEtfTer('FR0013412004', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: '141 M€', note: '(encours encore modeste)' }],
      },
      {
        indexName: 'Inde seule', choiceNote: 'seule option PEA sur ce pays', pea: true,
        funds: [{ name: 'Amundi PEA Inde (MSCI India) UCITS ETF', ticker: 'PINR', isin: 'FR0011869320', ter: formatEtfTer('FR0011869320', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: '157 M€', note: '(le plus cher du lot)' }],
      },
      {
        indexName: 'EMEA émergente', choiceNote: 'seule option PEA sur cette zone', pea: true,
        funds: [{ name: 'Amundi PEA Emergent EMEA (MSCI Emerging EMEA) ESG Transition UCITS ETF', ticker: 'PLEM', isin: 'FR0011440478', ter: formatEtfTer('FR0011440478', 'index'), repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: '68 M€', note: '(la plus confidentielle)' }],
      },
    ],
    diversification: {
      // Pas de relation d'emboîtement ici (contrairement à un MSCI World → MSCI ACWI) : 5 fonds sur
      // 5 zones distinctes, pas des sous-ensembles les uns des autres.
      chain: ['PAEEM (23 pays, Égypte exclue, généraliste ESG)', 'PAASI (8 pays, Asie émergente)', 'PALAT (Amérique latine)', 'PINR (Inde seule)', 'PLEM (zone EMEA émergente)'],
      notes: ['⚠️ PAEEM est le seul fonds « généraliste » du lot : les quatre autres sont des paris régionaux ou pays, à combiner avec lui plutôt qu\'à sa place.', `→ Plus la zone est étroite (Inde, Amérique latine, EMEA), plus l'encours est petit et le TER élevé — PINR grimpe à ${formatEtfTer('FR0011869320', 'index')}.`],
    },
    // Performance 2023-2025 (source : justETF/boursedirect, recherche web du 02/09/2026, recoupée sur
    // plusieurs pages par fonds).
    perfFunds: [
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF/20260131
      { key: 'paeem_pea', label: 'Amundi PEA Emergent (PAEEM)', y2023: 3.66, y2024: 13.39, y2025: 21.04 },
      // Vérifié le 25/09/2026 : ligne « Portefeuille » EUR, rapport Amundi 31/08/2026 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412012/FRA/FRA/INSTITUTIONNEL/ETF
      { key: 'paasi', label: 'Amundi PEA Asie Émergente (PAASI)', y2023: 1.21, y2024: 16.36, y2025: 21.78 },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412004/FRA/FRA/INSTITUTIONNEL/ETF/20251231
      { key: 'palat', label: 'Amundi PEA Amérique Latine (PALAT)', y2023: 24.63, y2024: -25.29, y2025: 35.75 },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011869320/FRA/FRA/RETAIL/ETF/20251231
      { key: 'pinr', label: 'Amundi PEA Inde (PINR)', y2023: 15.09, y2024: 16.57, y2025: -11.15 },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011440478/FRA/FRA/RETAIL/ETF/20251231
      { key: 'plem', label: 'Amundi PEA Emergent EMEA (PLEM)', y2023: 7.89, y2024: 12.77, y2025: 15.11 },
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
      { name: 'MSCI EM IMI', desc: '3 017 valeurs de ~24 pays émergents (Chine, Inde, Taïwan, Brésil…) — grandes, moyennes ET petites capitalisations.', tag: 'La référence émergents, en version large 🏳️' },
      { name: 'FTSE EM', desc: '2 290 valeurs. Une composition proche du MSCI EM, mais pas identique : la Corée du Sud y est classée comme un pays développé, donc elle est exclue.', tag: 'Sans la Corée du Sud 🇰🇷' },
      { name: 'MSCI EM ex-China', desc: '625 valeurs. Le MSCI EM, mais sans la Chine — pour qui veut réduire son risque chinois.', tag: 'L\'anti-concentration Chine 🚫' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES (CTO) 💳',
    etfGroups: [
      {
        indexName: 'MSCI EM IMI', choiceNote: 'la référence la plus large', pea: false,
        funds: [{ name: 'iShares Core MSCI EM IMI UCITS ETF (Acc)', isin: 'IE00BKM4GZ66', ter: formatEtfTer('IE00BKM4GZ66', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: '36 800 M€' }],
      },
      {
        indexName: 'FTSE EM', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [
          { name: 'Vanguard FTSE Emerging Markets UCITS ETF (Acc)', isin: 'IE00BK5BR733', ter: formatEtfTer('IE00BK5BR733', 'index'), aum: '2,0 Md€' },
          { name: 'Vanguard FTSE Emerging Markets UCITS ETF (Dist)', isin: 'IE00B3VVMM84', ter: formatEtfTer('IE00B3VVMM84', 'index'), aum: '3,2 Md€', note: '(plus gros encours)' },
        ],
      },
      {
        indexName: 'MSCI EM ex-China', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI EM ex-China UCITS ETF (Acc)', isin: 'IE00BMG6Z448', ter: formatEtfTer('IE00BMG6Z448', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: '6,3 Md€' }],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI/FTSE, 2026) le 01/09/2026.
      chain: ['MSCI EM IMI (3 017 lignes)', 'FTSE EM (2 290, sans la Corée du Sud)', 'MSCI EM ex-China (625, sans la Chine)'],
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
    // Vanguard — valeur identique à portfolio-generator/data.js pour ce même ISIN.
    // L'ancien jeu de chiffres (4,12 %
    // etc.) n'a pas pu être retracé à une source fiable lors de cette revérification.
    perfFunds: [
      { key: 'msci_em', label: 'iShares Core MSCI EM IMI', y2023: 11.58, y2024: 7.21, y2025: 31.58 },
      { key: 'ftse_em', label: 'Vanguard FTSE Emerging Markets', y2023: 7.86, y2024: 12.06, y2025: 25.67 },
      // Vérifié le 25/09/2026 : ligne « Rendement total (%) USD » BlackRock,
      // précision publiée au dixième ; anciens centièmes écartés faute de confirmation.
      // Confiance élevée. https://www.blackrock.com/fr/particuliers/products/315592/
      { key: 'em_exchina', label: 'iShares MSCI EM ex-China', y2023: 19.7, y2024: 3.6, y2025: 34.8 },
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
  // vérifié ailleurs dans l'appli (etf-sheets/data.js, portfolio-generator).
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
      { name: 'MSCI World Value', desc: '401 valeurs jugées « décotées » par rapport à leurs fondamentaux (banques, énergie, industrie…).', bullets: ['ℹ️ Le vrai nom de l\'indice répliqué : MSCI World Enhanced Value'], tag: 'Le pari à contre-courant 📉' },
      { name: 'MSCI World Quality', desc: '301 valeurs à la rentabilité stable et à l\'endettement maîtrisé (ROE élevé, bénéfices réguliers).', bullets: ['ℹ️ Le vrai nom de l\'indice répliqué : MSCI World Sector Neutral Quality'], tag: 'Le style « qualité avant tout » 💎' },
      { name: 'MSCI World Growth', desc: 'Entreprises à forte croissance attendue des bénéfices (tech, santé innovante…).', tag: 'Aucun ETF trouvé pour l\'instant ⚠️' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES — AUCUNE OPTION PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI World Value', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Edge MSCI World Value Factor UCITS ETF (Acc)', isin: 'IE00BP3QZB59', ter: formatEtfTer('IE00BP3QZB59', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: '6,1 Md€' }],
      },
      {
        indexName: 'MSCI World Quality', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Edge MSCI World Quality Factor UCITS ETF (Acc)', isin: 'IE00BP3QZ601', ter: formatEtfTer('IE00BP3QZ601', 'index'), repl: '🔄 Physique optimisée', dist: 'capitalisant', aum: '5,3 Md€' }],
      },
      {
        indexName: 'MSCI World Growth', choiceNote: 'aucun fonds trouvé', pea: false,
        funds: [],
        narrativeNote: 'On n\'a trouvé aucun ETF UCITS qui réplique vraiment l\'indice « MSCI World Growth ». Les fonds « Momentum Factor » qui existent visent autre chose (l\'élan du cours, pas la croissance des bénéfices) — donc pas de faux jumeau ici, on préfère te le dire clairement.',
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI, juillet 2026) le 01/09/2026.
      chain: ['MSCI World (1 283 lignes, univers de départ)', 'MSCI World Value (401)', 'MSCI World Quality (301)'],
      notes: ['⚠️ Contrairement à un indice classique, ces indices factoriels ne s\'emboîtent pas les uns dans les autres : ce sont des sous-ensembles indépendants du MSCI World, pas des poupées russes.'],
    },
    // Performance 2023-2025 (source : justETF, recherche web du 02/09/2026). Value Factor recoupé
    // avec la série "actions_value" déjà vérifiée cette session dans portfolio-generator/data.js
    // (même fonds, écart <0,1 pt sur les 3 années) — confirme la fiabilité de la recherche.
    perfFunds: [
      { key: 'value', label: 'iShares Edge MSCI World Value Factor', y2023: 19.41, y2024: 5.25, y2025: 39.63 },
      // BlackRock, NAV USD de la part IE00BP3QZ601, 2023-2025.
      // https://www.blackrock.com/ch/individual/en/products/270054/ishares-msci-world-quality-factor-ucits-etf
      // Vérifié le 25/09/2026 : part USD, rendement total calendaire BlackRock ; confiance élevée.
      // https://www.blackrock.com/fr/particuliers/products/270054/ishares-msci-world-quality-factor-ucits-etf
      { key: 'quality', label: 'iShares Edge MSCI World Quality Factor', y2023: 25.7, y2024: 16.6, y2025: 15.4 },
    ],
    perfMethodNote: 'ℹ️ Value est présenté en euros ; Quality reprend la performance de la part en dollars (NAV USD). Le change empêche de comparer directement ces rendements.',
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
  // (portfolio-generator/data.js) ; part Acc et Aristocrats confirmées
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
      { name: 'High Dividend', desc: '2 397 entreprises mondiales au rendement de dividende le plus élevé, sans filtre de qualité.', tag: 'Le rendement brut, sans filtre 💰' },
      { name: 'Quality Dividend', desc: '~200 valeurs (194-211 selon la date de rebalancement) : dividende + critères de solidité financière (rentabilité, faible endettement).', tag: 'Le compromis entre rendement et solidité 💎' },
      {
        name: 'Dividend Aristocrats', desc: '100 entreprises qui versent un dividende stable ou en hausse depuis au moins 10 ans consécutifs (version mondiale).', tag: 'Le plus exigeant des trois 🏅',
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
        funds: [{ name: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF (Dist)', isin: 'IE00B8GKDB10', ter: formatEtfTer('IE00B8GKDB10', 'index'), repl: '🔄 Physique', dist: 'distribuant trimestriel', aum: '9,8 Md€ (01/09/2026)' }],
      },
      {
        indexName: 'Quality Dividend', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI World Quality Dividend Advanced UCITS ETF (Dist)', isin: 'IE00BYYHSQ67', ter: formatEtfTer('IE00BYYHSQ67', 'index'), repl: '🔄 Physique', dist: 'distribuant trimestriel', aum: '1,5 Md€ (01/09/2026)' }],
      },
      {
        indexName: 'Dividend Aristocrats', choiceNote: 'le plus de choix', pea: false,
        funds: [
          { name: 'SPDR S&P Global Dividend Aristocrats UCITS ETF', isin: 'IE00B9CQXS71', ter: formatEtfTer('IE00B9CQXS71', 'index'), aum: '1,6 Md€ (01/09/2026)', note: '(mondial — dividende stable/en hausse depuis 10 ans)' },
          { name: 'SPDR S&P US Dividend Aristocrats UCITS ETF', isin: 'IE00B6YX5D40', ter: formatEtfTer('IE00B6YX5D40', 'index'), aum: '3,4 Md€ (01/09/2026)', note: '(US uniquement, le moins cher ⚡ — mais critère plus strict : 20 ans consécutifs de hausse du dividende, contre 10 ans pour le fonds mondial ci-dessus)' },
        ],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets FTSE/MSCI/S&P, 2026) le 01/09/2026.
      chain: ['High Dividend (2 397 lignes)', 'Quality Dividend (~200)', 'Dividend Aristocrats mondial (100)'],
      notes: ['⚠️ Plus le filtre est exigeant (Quality, Aristocrats), plus le nombre de lignes chute.', '→ Concentration sectorielle plus forte (finance, énergie, conso de base) sur les deux derniers.'],
    },
    // Performance 2023-2025 — RECORRIGÉE le 23/09/2026 suite à un signalement utilisateur sur ce
    // tweet précis (2 des 3 séries ci-dessous étaient fausses depuis leur création, sans lien avec
    // les vraies performances des fonds).
    // - high_div (IE00B8GKDB10) : 11,51 % / 9,39 % / 26,40 % confirmé par 2 requêtes web
    //   indépendantes le 23/09/2026 (documentation officielle Vanguard + recoupement justETF/
    //   fiches fonds) — identique à la série déjà vérifiée pour ce même fonds dans
    //   portfolio-generator/data.js ("high_dividend"/"high_dividend_dist"), donc cohérence
    //   rétablie entre les deux outils sur cet ISIN.
    // - quality_div (IE00BYYHSQ67) : 17,16 % / 9,76 % / 23,97 %, mêmes
    //   rendements NAV officiels que la part distribuante du Générateur.
    // - aristocrats (IE00B9CQXS71) : 6,93 % / 7,74 % / 17,02 % pour 2023-2025, vérifiés le
    //   24/09/2026 directement sur la ligne "Fund Net" du tableau officiel State Street au
    //   31/08/2026. La ligne "Fund Gross"/l'ancienne série du Générateur était différente ;
    //   le Générateur utilise maintenant lui aussi la série nette de frais.
    perfFunds: [
      { key: 'high_div', label: 'Vanguard FTSE AW High Dividend', y2023: 11.51, y2024: 9.39, y2025: 26.40 },
      { key: 'quality_div', label: 'iShares MSCI World Quality Dividend', y2023: 17.16, y2024: 9.76, y2025: 23.97 },
      { key: 'aristocrats', label: 'SPDR S&P Global Dividend Aristocrats', y2023: 6.93, y2024: 7.74, y2025: 17.02 },
    ],
    // Disclosure affichée dans le tweet lui-même (bloc 4, cf. buildTweetText) — devise, méthode et
    // nature "totale vs distribution" jamais explicités dans le texte avant le 23/09/2026, seulement
    // dans les commentaires de code (donc invisibles au lecteur).
    perfMethodNote: 'ℹ️ Performance totale nette de frais (dividendes réinvestis), en $ — devise de cotation des 3 fonds, hors effet de change €/$. Ne pas confondre avec le rendement de distribution (dividend yield), qui est un chiffre différent.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💰 Le rendement le plus élevé, sans filtre ?', a: 'Vanguard FTSE All-World High Dividend Yield.' },
      { q: '💎 Le compromis entre rendement et solidité financière ?', a: 'iShares MSCI World Quality Dividend Advanced.' },
      { q: '🏅 Le plus exigeant (20 ans de hausses consécutives) ?', a: 'SPDR S&P US Dividend Aristocrats (10 ans pour la version mondiale).' },
    ],
    closing: '💬 Pour des dividendes, tu privilégies le montant versé ou les critères de sélection des entreprises ?',
  },

  // ── Famille 6b : Dividendes (PEA) ────────────────────────────────────
  // Ajoutée le 02/09/2026. Recherche dédiée : sur les 3 indices de la
  // famille CTO (High Dividend mondial, Quality Dividend mondial,
  // Dividend Aristocrats mondial/US), aucun n'a d'équivalent PEA — confirmé
  // à nouveau cette session. Une seule vraie option PEA existe pour viser
  // le dividende, et elle est structurellement limitée à la zone euro :
  // EUDV (SPDR S&P Euro Dividend Aristocrats), éligibilité PEA confirmée
  // par la documentation officielle State Street ET par un comparatif
  // indépendant d'ETF PEA 2026 (recherche web du 02/09/2026). Point de
  // vigilance retenu : l'équivalent Amundi sur le même indice zone euro
  // (Amundi S&P Eurozone Dividend Aristocrat Screened, LU0959210278) est
  // lui explicitement NON éligible PEA — la zone géographique seule ne
  // suffit donc pas, seul EUDV a la bonne structure. Un seul fonds réel
  // → pas de comparaison multi-fonds ici, mais un contenu complet et honnête
  // (ISIN, TER, encours, réplication, performance sourcée).
  {
    id: 'dividendes-pea',
    label: '🟣 Dividendes (PEA)',
    intro: 'Tu veux un ETF à dividendes dans ton PEA ? La sélection se resserre vite sur la zone euro 🟣\nOn regarde ce que couvre cette option 👇',
    indices: [
      { name: 'Dividend Aristocrats mondial (rappel, non-PEA)', desc: '100 entreprises mondiales, dividende en hausse depuis au moins 10 ans — l\'option déjà vue dans le tweet « Dividendes (CTO) ».', tag: 'Large mais non-PEA 🌍' },
      { name: 'Euro Dividend Aristocrats (PEA)', desc: '40 entreprises de la zone euro uniquement, même critère de hausse du dividende sur 10 ans — le prix à payer pour rester en PEA : un univers bien plus restreint.', tag: 'Le seul dividende PEA 🇪🇺' },
    ],
    block2Title: '2️⃣ L\'ETF PEA DISPONIBLE 💳',
    etfGroups: [
      {
        indexName: 'Euro Dividend Aristocrats', choiceNote: 'seule option PEA sur les dividendes, même en zone euro uniquement', pea: true,
        funds: [{ name: 'SPDR S&P Euro Dividend Aristocrats UCITS ETF (Dist)', ticker: 'EUDV', isin: 'IE00B5M1WJ87', ter: formatEtfTer('IE00B5M1WJ87', 'index'), repl: '🔄 Physique (réplication complète, 40 valeurs)', dist: 'distribuant semestriel', aum: '1 810 M€' }],
      },
    ],
    diversification: {
      chain: ['Dividend Aristocrats mondial (100 lignes, CTO)', 'Euro Dividend Aristocrats (40 lignes, PEA)'],
      notes: ['⚠️ En PEA, tu passes de 100 valeurs mondiales à seulement 40 valeurs zone euro — la contrepartie de l\'éligibilité PEA.', '→ Résultat : plus concentré sur la finance et l\'énergie européennes, secteurs traditionnellement gros payeurs de dividendes en zone euro.'],
    },
    // Performance 2023-2025 (source : recherche web du 02/09/2026, recoupée sur plusieurs pages —
    // fonds EUDV et indice S&P Euro High Yield Dividend Aristocrats cohérents à moins de 0,5 pt sur
    // 2023 et 2024 ; 2025 retenu sur la valeur datée « au 31/12/2025 » plutôt qu'un « 1 an glissant »
    // trouvé par ailleurs, qui inclut une partie de 2026).
    perfFunds: [
      // Corrigé le 25/09/2026 : 2024 8,58 → 8,55, ligne « Fund Net » EUR de State Street ; confiance élevée.
      // https://www.ssga.com/uk/en_gb/intermediary/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy
      { key: 'eudv', label: 'SPDR S&P Euro Dividend Aristocrats (EUDV)', y2023: 18.39, y2024: 8.55, y2025: 20.06 },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Tu veux du dividende en restant 100 % PEA ?', a: 'EUDV (SPDR S&P Euro Dividend Aristocrats) — seule option, mais limitée à la zone euro.' },
      { q: '🌍 Tu veux le choix le plus large, dividende mondial ?', a: 'Aucune option PEA à ce jour — direction le CTO (cf. le tweet « Dividendes (CTO) »).' },
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
      { name: 'MSCI China', desc: '576 valeurs cotées à Hong Kong ou à New York (ADR), plutôt qu\'en Chine continentale — c\'est ce qu\'on appelle la Chine « offshore ».', tag: 'La référence la plus suivie 🏙️' },
      { name: 'FTSE China 50', desc: 'Seulement les 50 plus grosses valeurs chinoises cotées à Hong Kong.', tag: 'Ultra-concentré 🎯' },
      { name: 'MSCI China A', desc: '410 valeurs : uniquement les actions domestiques cotées à Shanghai/Shenzhen (marché intérieur, via Stock Connect).', tag: 'La Chine « intérieure » 🏯' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES (PEA / CTO) 💳',
    etfGroups: [
      {
        // CORRIGÉ le 02/09/2026 : pea passé à true (une option PEA existe bel et bien ci-dessous,
        // même imparfaite) — l'ancien pea:false faisait afficher le mauvais pictogramme d'en-tête.
        indexName: 'MSCI China', choiceNote: 'CTO conseillé, 1 option PEA imparfaite', pea: true,
        subNote: '(l\'option PEA ne suit pas exactement le MSCI China classique — c\'est une version filtrée ESG)',
        funds: [
          { name: 'iShares MSCI China UCITS ETF (Acc)', isin: 'IE00BJ5JPG56', ter: formatEtfTer('IE00BJ5JPG56', 'index'), aum: '2,19 Md€', note: '(CTO, réplique le MSCI China standard)' },
          { name: 'Amundi PEA Chine (MSCI China) Screened UCITS ETF', isin: 'FR0011871078', ter: formatEtfTer('FR0011871078', 'index'), aum: '84 M€', note: '(seule option PEA — indice filtré ESG, plus cher)' },
        ],
      },
      {
        // CORRIGÉ le 02/09/2026 : l'ISIN IE00B02KXK85 est en réalité la part DISTRIBUANTE (814 M€,
        // part principale) — corrigé, faussement étiqueté "capitalisant" et sans encours auparavant.
        // Une part capitalisante existe mais ne pèse que 31 M€ (peu liquide) — la part distribuante,
        // bien plus grosse, reste le choix pertinent malgré l'écart avec la convention "capitalisant"
        // du reste de l'outil.
        indexName: 'FTSE China 50', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares China Large Cap UCITS ETF (Dist)', isin: 'IE00B02KXK85', ter: formatEtfTer('IE00B02KXK85', 'index'), repl: '🔄 Physique', dist: 'distribuant trimestriel', aum: '815 M€' }],
      },
      {
        indexName: 'MSCI China A', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI China A UCITS ETF (Acc)', isin: 'IE00BQT3WG13', ter: formatEtfTer('IE00BQT3WG13', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: '2,4 Md€' }],
      },
    ],
    diversification: {
      // Comptages exacts vérifiés via recherche web (factsheets MSCI, 2026) le 01/09/2026.
      chain: ['MSCI China (576 lignes, offshore + ADR)', 'MSCI China A (410, domestique uniquement)', 'FTSE China 50 (50, ultra-concentré)'],
      notes: ['⚠️ MSCI China et MSCI China A ne se recoupent quasiment pas : deux marchés séparés, avec des règles complètement différentes (régulation classique d\'un côté, contrôle des capitaux chinois de l\'autre).', '→ Le FTSE China 50 concentre l\'essentiel du risque sur une poignée de méga-caps (tech, finance).'],
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
      { key: 'msci_china', label: 'iShares MSCI China', y2023: -11.4, y2024: 19.2, y2025: 30.8 },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille Amundi ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871078/FRA/FRA/INSTITUTIONNEL/ETF/20260228
      { key: 'amundi_pea_chine', label: 'Amundi PEA Chine (Screened)', y2023: -15.98, y2024: 17.15, y2025: 14.64 },
      // BlackRock, NAV USD de la part IE00B02KXK85, dividendes réinvestis ;
      // les anciens chiffres étaient exprimés en EUR sans distinction visible.
      // https://www.ishares.com/uk/individual/en/literature/fact-sheet/fxc-ishares-china-large-cap-ucits-etf-fund-fact-sheet-en-gb.pdf
      // Vérifié le 25/09/2026 : BlackRock part USD, affichage au dixième (-13,6/31,0/28,2).
      // Anciens centièmes écartés faute de confirmation ; confiance élevée au dixième.
      // https://www.blackrock.com/fr/particuliers/products/251798/ishares-china-large-cap-ucits-etf
      { key: 'ftse_china50', label: 'iShares China Large Cap (FTSE China 50)', y2023: -13.6, y2024: 31.0, y2025: 28.2 },
      // Vérifié le 25/09/2026 : part USD, rendement total calendaire BlackRock ; confiance élevée.
      // https://www.blackrock.com/fr/particuliers/products/273192/ishares-msci-china-a-ucits-etf
      { key: 'msci_china_a', label: 'iShares MSCI China A', y2023: -13.8, y2024: 11.3, y2025: 26.0 },
    ],
    perfMethodNote: 'ℹ️ Les parts iShares MSCI China, FTSE China 50 et MSCI China A sont en dollars ; Amundi PEA Chine est en euros. Comparer directement les rendements mélange les effets de change.',
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🏙️ La référence la plus suivie, en CTO ?', a: 'iShares MSCI China.' },
      { q: '💳 Tu veux rester en PEA malgré tout ?', a: 'Amundi PEA Chine — mais version filtrée ESG, pas le MSCI China standard.' },
      { q: '🏯 Tu veux viser le marché intérieur chinois précisément ?', a: 'iShares MSCI China A.' },
    ],
    closing: '💬 Tu veux surtout les entreprises chinoises cotées hors du continent ou le marché intérieur ?',
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
      { name: 'Nikkei 225', desc: 'Les 225 plus grandes valeurs de la Bourse de Tokyo, indice pondéré par le PRIX de l\'action (pas la capitalisation).', tag: 'Le plus connu, pas le plus rigoureux 📰' },
      { name: 'TOPIX', desc: '1 637 valeurs (juillet 2026) du 1er compartiment de la Bourse de Tokyo, pondérées par capitalisation.', bullets: ['⚠️ Réforme en cours : retrait graduel de 600+ valeurs à partir d\'oct. 2026, étalé sur 2 ans — passage sous 1 000 valeurs attendu vers 2028, pas dès octobre'], tag: 'Le plus large et le plus représentatif 🗾' },
      { name: 'MSCI Japan IMI', desc: '957 grandes, moyennes ET petites capitalisations japonaises (méthodologie MSCI, comparable aux autres indices MSCI Pays).', tag: 'Le standard international 🌐' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        // CORRIGÉ le 02/09/2026 : l'ISIN LU0839027447 (part "1D") est distribuant, pas capitalisant
        // comme la ligne l'implicitait sans le préciser — remplacé par la part capitalisante "1C"
        // du même fonds (même indice, même TER), cohérent avec la convention du reste de l'outil.
        // Encours plus petit (430 M€ contre 2 012 M€ pour la part Dist) mais réel et suffisant.
        indexName: 'Nikkei 225', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'Xtrackers Nikkei 225 UCITS ETF 1C (Acc)', isin: 'LU2196470426', ter: formatEtfTer('LU2196470426', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: '430 M€' }],
      },
      {
        indexName: 'TOPIX', choiceNote: 'un seul choix, mais PEA ✅', pea: true,
        // Actif géré 187,05 M€ au 31/08/2026, fiche Amundi ; vérifié le 25/09/2026.
        // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411980/FRA/FRA/INSTITUTIONNEL/ETF
        funds: [{ name: 'Amundi PEA Japon (TOPIX) UCITS ETF', isin: 'FR0013411980', ter: formatEtfTer('FR0013411980', 'index'), repl: '🔄 Synthétique', dist: 'capitalisant', aum: '187 M€ au 31/08/2026' }],
      },
      {
        indexName: 'MSCI Japan IMI', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Core MSCI Japan IMI UCITS ETF (Acc)', isin: 'IE00B4L5YX21', ter: formatEtfTer('IE00B4L5YX21', 'index'), repl: '🔄 Physique', dist: 'capitalisant', aum: '7,2 Md€' }],
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
      chain: ['TOPIX (1 637 lignes, juillet 2026)', 'MSCI Japan IMI (957)', 'Nikkei 225 (225, prix-pondéré)'],
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
      { key: 'nikkei', label: 'Xtrackers Nikkei 225', y2023: 30.5, y2024: 20.9, y2025: 28.2 },
      // Vérifié le 25/09/2026 : part EUR, ligne Portefeuille 2023–2025 Amundi ; confiance élevée.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411980/FRA/FRA/INSTITUTIONNEL/ETF/20251231
      { key: 'topix', label: 'Amundi PEA Japon (TOPIX)', y2023: 15.27, y2024: 14.56, y2025: 10.22 },
      { key: 'msci_japan', label: 'iShares Core MSCI Japan IMI', y2023: null, y2024: null, y2025: null, perfNote: 'Historique absent du tableau : devise différente des séries présentées.' },
    ],
    perfMethodNote: 'ℹ️ Xtrackers Nikkei 225 est présenté en yens (part JPY) et Amundi TOPIX en euros. Ces rendements ne se comparent pas directement sans tenir compte du change.',
    verdictTitle: '✅ LE VERDICT POUR UN PEA',
    verdict: [
      { q: '💳 Tu veux rester en PEA ?', a: 'Amundi PEA Japon — seule option, mais indice TOPIX (pas Nikkei).' },
      { q: '📰 Tu veux spécifiquement le Nikkei 225, en CTO ?', a: 'Xtrackers Nikkei 225.' },
      { q: '🌐 Tu veux le standard international, en CTO ?', a: 'iShares Core MSCI Japan IMI.' },
    ],
    closing: '💬 Pour le Japon, la méthode de pondération du Nikkei te gêne ou tu la choisis justement ?',
  },
]
