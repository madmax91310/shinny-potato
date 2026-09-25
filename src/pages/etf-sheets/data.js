import { formatEtfTer } from '../../data/etf-ter.js';
// Bibliothèque de fiches ETF — contenu pré-rédigé, données stockées en dur, aucune donnée de
// marché en temps réel. Modifie librement un champ (isin, ter, positions, aum, distribution,
// pea, cto, location, whatIs, whyInteresting, whatToKnow, verdict, question) sans rien casser
// ailleurs.
//
// Audit "meilleurs ETF" du 25/08/2026 (même passe que le générateur de tweets ETF) : la fiche
// msci-world utilisait le CW8 (Amundi MSCI World, 0,38%) — remplacé par Amundi PEA Monde
// (MSCI World), 0,20%, cohérent avec la correction faite côté tweets ETF. Plusieurs autres
// fiches contenaient des ISIN erronés ou périmés (semiconducteurs, energie, blockchain,
// nucleaire, covered-call, sp500, nasdaq100, eurostoxx50, luxe), des TER inexacts (value,
// obligations-etat) ou des champs distribution inversés Capitalisant/Distribuant (eau,
// obligations-etat, high-yield), corrigés après vérification web (justETF, fiches émetteurs).
// La plupart des encours ont aussi été rafraîchis (souvent fortement sous-estimés). Voir
// l'historique git pour le détail fonds par fonds.
//
// lastVerified (ajouté le 14/09/2026, audit "outils") : date de la vérification la plus récente
// déjà documentée dans les commentaires de CHAQUE fiche (jamais une date ajoutée séparément à la
// main), affichée dans l'UI à côté de l'encours (cf. App.jsx) — l'encours étant le champ qui bouge
// le plus vite de toute la fiche. 25/08/2026 pour les 26 fiches de l'audit "meilleurs ETF" d'origine
// (aucune date plus récente documentée pour elles depuis) ; 08/09/2026 pour les 6 fiches de l'audit
// "densité" (msci-acwi, ftse-all-world, financieres, immobilier-reit, technologie, momentum) ;
// 10/09/2026 pour quality (TER/encours corrigés après l'audit croisé avec le Comparateur d'indices,
// une date plus récente que son propre ajout du 08/09/2026). Les 3 fiches obligataires qui n'avaient
// aucun commentaire daté (corp-bond-ig, high-yield-acc, em-local-bond) ont été revérifiées le même
// jour (14/09/2026, cf. leurs commentaires individuels) — les 36 fiches portent désormais une date.
// Un encours a été recoupé ensuite : Amundi Global Luxury au 31/08/2026 (vérifié le
// 25/09/2026). Les dates lastVerified désignent une revue de la fiche, pas nécessairement
// la date de chaque encours cité ; se reporter aux commentaires individuels.

export const CATEGORY_ORDER = [
    "Cœur de portefeuille",
    "Sectoriels classiques",
    "Thématiques émergentes",
    "Spatial",
    "Stratégiques",
    "Matières premières & Crypto",
    "Obligataires"
  ];

export const CATEGORY_EMOJI = {
    "Cœur de portefeuille": "🔵",
    "Sectoriels classiques": "🟢",
    "Thématiques émergentes": "🟠",
    "Spatial": "🚀",
    "Stratégiques": "🟣",
    "Matières premières & Crypto": "🟡",
    "Obligataires": "⚪"
  };

export const ETFS = [
    // ---------- CŒUR DE PORTEFEUILLE ----------
    {
      id: "msci-world",
      category: "Cœur de portefeuille",
      name: "Amundi PEA Monde (MSCI World) UCITS ETF",
      tickers: ["DCAM"],
      isNew: true,
      isin: "FR001400U5Q4",
      ter: formatEtfTer("FR001400U5Q4", "sheet"),
      positions: "~1 500 positions",
      aum: "~1,37 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: true,
      cto: true,
      location: "France, réplication synthétique (swap)",
      whatIs: "Un seul ETF pour suivre environ 1 500 grandes et moyennes entreprises de 23 pays développés. « Monde » ne veut toutefois pas dire répartition égale : les États-Unis représentent environ 70 % de l’indice, et les géants technologiques y occupent une grande place.",
      whyInteresting: `Si tu veux une ligne principale sur ton PEA sans choisir toi-même tes pays et tes secteurs, c’est une solution simple. Sa réplication synthétique lui permet de suivre le MSCI World tout en restant éligible au PEA, avec ${formatEtfTer("FR001400U5Q4", "index")} de frais annuels.`,
      whatToKnow: "Tu détiens beaucoup d’entreprises, mais ton résultat dépend fortement du marché américain. Il n’y a pas de petites capitalisations. Et si tu investis sur CTO, compare les frais : d’autres ETF World y coûtent moins cher.",
      verdict: "Une base simple pour un PEA de long terme, à condition d’être à l’aise avec son poids américain.",
      question: "Dans ton PEA, tu préfères un seul ETF World ou ajouter d’autres régions à côté ?"
    },
    {
      id: "sp500",
      category: "Cœur de portefeuille",
      name: "Amundi PEA S&P 500 UCITS ETF",
      tickers: ["PSP5"],
      isNew: false,
      isin: "FR0011871128",
      ter: formatEtfTer("FR0011871128", "sheet"),
      positions: "500 positions",
      aum: "~1,15 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: true,
      cto: true,
      location: "France, réplication synthétique (swap)",
      whatIs: "Réplique le S&P 500, l'indice des 500 plus grandes capitalisations cotées aux États-Unis. Fortement pondéré tech : Apple, Nvidia, Microsoft, Amazon et Alphabet pèsent à eux cinq plus d'un quart de l'indice. 100% USA, tous secteurs représentés mais la tech domine largement.",
      whyInteresting: "Tu suis les grandes entreprises américaines dans un PEA, avec une seule ligne. La réplication synthétique rend cette exposition possible dans cette enveloppe.",
      whatToKnow: "Tu restes investi uniquement aux États-Unis, avec un poids important des grandes valeurs technologiques. Une ligne MSCI World en détient déjà beaucoup : vérifie ce que cet ETF ajoute à ton portefeuille.",
      verdict: "Si tu veux concentrer ta poche actions sur les États-Unis tout en restant sur PEA, cet ETF va droit au but. Il ne t’apporte aucune exposition aux autres marchés.",
      question: "Tu détiens déjà un ETF World : ajouterais-tu aussi du S&P 500, sachant que les grandes valeurs américaines y sont déjà présentes ?"
    },
    {
      id: "nasdaq100",
      category: "Cœur de portefeuille",
      name: "Amundi PEA Nasdaq-100 UCITS ETF",
      tickers: ["PUST"],
      isNew: false,
      isin: "FR0011871110",
      ter: formatEtfTer("FR0011871110", "sheet"),
      positions: "100 positions",
      aum: "~1,17 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: true,
      cto: true,
      location: "France, réplication synthétique (swap)",
      whatIs: "Réplique le Nasdaq-100, les 100 plus grosses valeurs non-financières cotées au Nasdaq. Ultra tech : Nvidia, Apple, Microsoft, Broadcom, Amazon en tête. Quasi aucune banque, aucune valeur pétrolière — un pari pur sur la croissance et la technologie américaine.",
      whyInteresting: "Tu veux donner plus de place aux grandes valeurs de croissance américaines ? Cet ETF le permet depuis un PEA, sans sélectionner toi-même les entreprises.",
      whatToKnow: "Le Nasdaq-100 dépend fortement de quelques grands noms de la tech. Si tu possèdes déjà un ETF World ou S&P 500, tu renforces souvent les mêmes titres. Les baisses peuvent être marquées.",
      verdict: "Une exposition assumée aux grandes valeurs non financières du Nasdaq. À considérer pour accentuer ce biais, pas pour diversifier un portefeuille déjà chargé en tech.",
      question: "Si tu as déjà un ETF World ou S&P 500, quelle place laisserais-tu encore au Nasdaq-100 ?"
    },
    {
      id: "eurostoxx50",
      category: "Cœur de portefeuille",
      name: "Amundi Core EURO STOXX 50 UCITS ETF",
      tickers: ["C50"],
      isNew: false,
      isin: "LU1681047236",
      ter: formatEtfTer("LU1681047236", "sheet"),
      positions: "50 positions",
      aum: "~4,02 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: true,
      cto: true,
      location: "Luxembourg, réplication physique intégrale",
      whatIs: "Réplique l'Euro Stoxx 50, les 50 plus grandes capitalisations de la zone euro. Top positions : LVMH, ASML, SAP, TotalEnergies, Siemens. Un mix de luxe, de tech européenne, d'énergie et d'industrie, très différent de la composition d'un indice américain.",
      whyInteresting: "Une seule ligne pour suivre 50 grandes entreprises de la zone euro dans un PEA. Elle peut donner davantage de poids à l’Europe dans un portefeuille dominé par les États-Unis.",
      whatToKnow: "Cinquante titres, c’est moins diversifié qu’un indice mondial. Regarde aussi les secteurs présents : l’exposition à la technologie américaine y est faible.",
      verdict: "Cinquante grandes sociétés de la zone euro à faible coût. Le nombre limité de lignes mérite d’être assumé.",
      question: "Pour ajouter de l’Europe, tu choisirais ces 50 grandes valeurs ou un indice européen plus large ?"
    },
    {
      id: "msci-em",
      category: "Cœur de portefeuille",
      name: "iShares Core MSCI EM IMI UCITS ETF",
      tickers: ["EMIM"],
      isNew: false,
      isin: "IE00BKM4GZ66",
      ter: formatEtfTer("IE00BKM4GZ66", "sheet"),
      positions: "~3 000 positions",
      aum: "~36,8 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée (échantillonnage)",
      whatIs: "Réplique le MSCI Emerging Markets IMI, environ 3 000 valeurs de pays émergents toutes tailles confondues. Chine, Taïwan, Inde et Corée du Sud en tête. Top positions : Taiwan Semiconductor, Tencent, Samsung, Alibaba — un mix de tech asiatique et de conglomérats locaux.",
      whyInteresting: "Cet ETF ajoute les petites, moyennes et grandes entreprises des marchés émergents à un portefeuille centré sur les pays développés.",
      whatToKnow: "Le poids des pays et des devises change avec l’indice. Tu prends aussi des risques politiques et réglementaires supplémentaires : ce n’est pas une façon automatique de réduire la volatilité.",
      verdict: "Il ajoute les marchés émergents, y compris leurs petites capitalisations, à un portefeuille centré sur les pays développés. La diversification s’accompagne de risques propres à ces marchés.",
      question: "Tu préfères détenir les émergents séparément ou dans un ETF ACWI tout-en-un ?"
    },
    // Ajouté le 08/09/2026 (audit "densité", catégorie volontairement restreinte aux World/ACWI/
    // All-World à la demande de l'utilisateur). ISIN/TER/encours vérifiés via WebSearch (WebFetch
    // bloqué dans ce sandbox), croisés en 2e requête indépendante — écarts ≤1% sur le TER et les
    // positions, convergents. Encours : plusieurs chiffres selon la part/devise regardée (fonds
    // total vs part USD Acc spécifique) — retenu celui de la part précise listée ici (ISIN ci-
    // dessous), pas le total tous compartiments confondus, cohérent avec la convention du reste
    // du fichier (chaque fiche cite l'encours DE SA part, pas du fonds entier).
    {
      id: "msci-acwi",
      category: "Cœur de portefeuille",
      name: "iShares MSCI ACWI UCITS ETF USD (Acc)",
      tickers: ["SSAC"],
      isNew: true,
      isin: "IE00B6R52259",
      ter: formatEtfTer("IE00B6R52259", "sheet"),
      positions: "~1 970 positions",
      aum: "~35 Md$",
      lastVerified: "08/09/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée (échantillonnage)",
      whatIs: "Réplique le MSCI ACWI (All Country World Index), qui combine environ 1 970 valeurs de pays développés ET de marchés émergents en une seule ligne — la version \"tout compris\" du MSCI World, émergents inclus. Top positions : Nvidia, Apple, Microsoft, Amazon, Alphabet — même dominance tech US que le World, avec un peu plus de diversification géographique.",
      whyInteresting: "Un seul ETF réunit pays développés et émergents. Pratique si tu veux cette couverture sans suivre deux lignes séparées.",
      whatToKnow: "Les États-Unis conservent une place majeure : ajouter les émergents ne fait pas disparaître la concentration des grands indices mondiaux. Cet ETF n’est pas éligible au PEA.",
      verdict: "Un ETF mondial qui inclut aussi les pays émergents. Pratique si tu veux une seule ligne en CTO et ne souhaites pas fixer leur poids toi-même.",
      question: "Tu laisserais l’indice déterminer la place des émergents ou tu choisirais leur poids séparément ?"
    },
    // Sourcing : TER du VWCE recoupé en 3 requêtes successives, chiffres apparemment contradictoires
    // (0,14% / 0,19% / 0,22%) résolus comme une chronologie de baisses de frais Vanguard (0,22%
    // jusqu'en octobre 2025, 0,19% jusqu'au 28/07/2026, 0,14% depuis) et non comme une contradiction
    // — confirmé par un article daté nommant explicitement la baisse du 28/07/2026. Même situation
    // que l'écart PALAT/PLEM déjà rencontré ailleurs dans l'app : plusieurs valeurs valides à des
    // dates différentes, pas une erreur.
    {
      id: "ftse-all-world",
      category: "Cœur de portefeuille",
      name: "Vanguard FTSE All-World UCITS ETF (USD) Accumulating",
      tickers: ["VWCE"],
      isNew: true,
      isin: "IE00BK5BQT80",
      ter: formatEtfTer("IE00BK5BQT80", "sheet"),
      positions: "3 784 positions (31/08/2026)",
      aum: "~50,8 Md€",
      // Comptages fonds / indice recoupés chez Vanguard le 24/09/2026 (données au 31/08) ;
      // encours, frais et autres champs de la fiche restent datés du 08/09/2026.
      lastVerified: "08/09/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Suit le FTSE All-World, un indice de grandes et moyennes entreprises de pays développés et émergents. Au 31/08/2026, le fonds détient 3 784 titres et son indice en compte 4 263. Le MSCI ACWI couvre lui aussi les grandes et moyennes capitalisations de pays développés et émergents ; les deux indices ne sélectionnent pas exactement les mêmes valeurs.",
      whyInteresting: `Tu peux couvrir les grandes entreprises des pays développés et émergents avec une seule ligne. Les frais annuels affichés pour cette part sont de ${formatEtfTer("IE00BK5BQT80", "index")}.`,
      whatToKnow: "Il n’est pas éligible au PEA. Les grandes capitalisations pèsent le plus lourd dans l’indice : posséder beaucoup de titres ne signifie pas que chacun influence autant la performance.",
      verdict: "Une seule ligne pour mêler pays développés et émergents en CTO. Vérifie ce que tu possèdes déjà avant d’en ajouter une deuxième très proche.",
      question: "Si tu détenais déjà un MSCI World, remplacerais-tu cette ligne par un All-World ou ajouterais-tu les émergents à part ?"
    },

    // ---------- SECTORIELS CLASSIQUES ----------
    {
      id: "semiconducteurs",
      category: "Sectoriels classiques",
      name: "iShares MSCI Global Semiconductors UCITS ETF",
      tickers: ["SEMI"],
      isNew: false,
      isin: "IE000I8KRLL9",
      ter: formatEtfTer("IE000I8KRLL9", "sheet"),
      positions: "~30 positions",
      aum: "~5,1 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le MSCI ACWI IMI Semiconductors & Semiconductor Equipment. Concentré sur les fabricants de puces et équipementiers mondiaux : Nvidia, TSMC, Broadcom, ASML, AMD en tête. C'est le maillon matériel de toute la chaîne de valeur IA.",
      whyInteresting: "Cet ETF cible les fabricants de puces et leurs fournisseurs. C’est une manière de suivre les investissements en calcul, en électronique et en infrastructures numériques.",
      whatToKnow: "La demande en puces suit des cycles. Quelques entreprises peuvent peser lourd dans le résultat, et une exposition technologique déjà importante dans ton portefeuille accentue ce risque.",
      verdict: "Il rassemble les fabricants de puces plutôt que de faire reposer toute cette conviction sur Nvidia. Le secteur reste très cyclique.",
      question: "Tu préfères répartir ton exposition aux puces entre plusieurs fabricants ou choisir une entreprise ?"
    },
    {
      id: "sante-biotech",
      category: "Sectoriels classiques",
      name: "iShares Nasdaq US Biotechnology UCITS ETF",
      tickers: ["BTEC"],
      isNew: false,
      isin: "IE00BYXG2H39",
      ter: formatEtfTer("IE00BYXG2H39", "sheet"),
      positions: "~200 positions",
      aum: "~1,1 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le Nasdaq Biotechnology Index, environ 200 entreprises biotech et pharma cotées au Nasdaq. Top positions : Amgen, Gilead, Vertex, Regeneron — un mix de biotechs innovantes et de laboratoires déjà établis.",
      whyInteresting: "Il donne accès à des entreprises de biotechnologie cotées aux États-Unis, sans miser sur un seul traitement ou laboratoire.",
      whatToKnow: "Une biotech peut fortement varier après un essai clinique ou une décision réglementaire. Le secteur est bien moins défensif qu’un indice de santé généraliste.",
      verdict: "Une exposition ciblée aux biotechnologies américaines, avec des résultats très dépendants des essais cliniques et des autorisations.",
      question: "Pour investir dans la santé, tu choisirais la biotech ou un indice santé plus large ?"
    },
    {
      id: "energie",
      category: "Sectoriels classiques",
      name: "SPDR MSCI World Energy UCITS ETF",
      tickers: ["WNRG"],
      isNew: false,
      isin: "IE00BYTRR863",
      ter: formatEtfTer("IE00BYTRR863", "sheet"),
      positions: "~100 positions",
      aum: "~466 M€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée",
      whatIs: "Réplique le MSCI World Energy, environ 100 entreprises mondiales du secteur pétrole, gaz et énergie. Top positions : ExxonMobil, Chevron, Shell, TotalEnergies — les grandes majors énergétiques occidentales.",
      whyInteresting: "Il rassemble des entreprises mondiales du secteur énergétique. Si tu veux augmenter leur poids dans ton portefeuille, tu vois précisément le secteur que tu ajoutes.",
      whatToKnow: "Les cours du pétrole et du gaz pèsent sur les résultats. Les dividendes peuvent varier, et cet ETF reste concentré sur un secteur sensible aux décisions politiques.",
      verdict: "Pour ajouter les grandes sociétés énergétiques mondiales à ton portefeuille. Leur résultat reste lié au cycle des hydrocarbures.",
      question: "Tu vois cette ligne comme une exposition durable ou comme un pari sur le cycle du pétrole ?"
    },
    {
      id: "defense",
      category: "Sectoriels classiques",
      name: "VanEck Defense UCITS ETF",
      tickers: ["DFNS", "DFND"],
      isNew: false,
      isin: "IE000YYE6WK5",
      ter: formatEtfTer("IE000YYE6WK5", "sheet"),
      positions: "~30 positions",
      aum: "~6,6 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le MarketVector Global Defense Index, un panier d'entreprises mondiales de défense et d'armement. Top positions : Palantir, RTX, Lockheed Martin, Rheinmetall, Thales — un mix USA-Europe centré sur les grands programmes militaires.",
      whyInteresting: "Cet ETF donne accès à des entreprises liées à la défense sans devoir choisir un fabricant précis. Leur activité dépend notamment des commandes publiques.",
      whatToKnow: "Une hausse des budgets ne garantit pas une hausse du cours : les attentes peuvent déjà être intégrées dans les prix. Le fonds reste sectoriel et ses frais sont à comparer à ceux d’un ETF large.",
      verdict: "Un accès diversifié aux entreprises de défense, avec une question à se poser avant les chiffres : est-ce compatible avec tes convictions ?",
      question: "La défense aurait-elle sa place dans ton portefeuille, même avec un poids limité ?"
    },
    {
      id: "cybersecurite",
      category: "Sectoriels classiques",
      name: "L&G Cyber Security UCITS ETF",
      tickers: ["ISPY"],
      isNew: false,
      isin: "IE00BYPLS672",
      ter: formatEtfTer("IE00BYPLS672", "sheet"),
      positions: "~30 positions",
      aum: "~3,2 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique l'ISE Cyber Security Select Index, une trentaine de pure players de la cybersécurité. Top positions : Palo Alto Networks, CrowdStrike, Fortinet, Cisco — les principaux fournisseurs de solutions de protection numérique.",
      whyInteresting: "Il cible les entreprises dont l’activité est liée à la cybersécurité. C’est une exposition ciblée si tu veux suivre ce marché plutôt que la technologie dans son ensemble.",
      whatToKnow: `La demande peut progresser sans que chaque action monte : concurrence, valorisations et bénéfices comptent aussi. Avec des frais de ${formatEtfTer("IE00BYPLS672", "index")} par an, le thème doit justifier sa place dans ton portefeuille.`,
      verdict: "Il permet de suivre plusieurs entreprises de cybersécurité sans choisir un seul gagnant. Reste à vérifier le prix payé pour cette croissance attendue.",
      question: "Tu préfères une exposition dédiée à la cybersécurité ou la tech déjà présente dans ton ETF World ?"
    },
    {
      id: "eau",
      category: "Sectoriels classiques",
      name: "Amundi MSCI Water UCITS ETF (Dist)",
      tickers: ["WAT"],
      isNew: false,
      isin: "FR0010527275",
      ter: formatEtfTer("FR0010527275", "sheet"),
      positions: "~30 positions",
      aum: "~1,56 Md€",
      lastVerified: "25/08/2026",
      distribution: "Distribuant",
      pea: false,
      cto: true,
      location: "France, réplication physique intégrale",
      whatIs: "Réplique le World Water Index, des entreprises liées au traitement, à la distribution et à la gestion de l'eau. Top positions : American Water Works, Veolia, Xylem, Ecolab — un mix d'utilities et d'équipementiers industriels.",
      whyInteresting: "Il regroupe des entreprises liées à l’eau, notamment dans les services et les équipements. L’intérêt est d’identifier cette activité dans une ligne dédiée.",
      whatToKnow: `L’eau est indispensable, mais cela ne rend pas les actions du fonds peu risquées. Regarde les entreprises réellement détenues et les frais de ${formatEtfTer("FR0010527275", "index")} par an avant de te fier au thème.`,
      verdict: "Une exposition aux entreprises liées à l’eau, qui ne revient pas à investir directement dans le prix de cette ressource.",
      question: "Dans un ETF eau, tu cherches surtout les services publics ou les technologies de traitement ?"
    },
    {
      id: "luxe",
      category: "Sectoriels classiques",
      name: "Amundi S&P Global Luxury UCITS ETF",
      tickers: ["GLUX"],
      isNew: false,
      isin: "LU1681048630",
      ter: formatEtfTer("LU1681048630", "sheet"),
      positions: "~80 positions",
      // Actif géré 478,37 M€ au 31/08/2026, fiche émetteur Amundi ; vérifié le 25/09/2026.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/RETAIL/ETF
      aum: "~478 M€",
      lastVerified: "25/09/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Luxembourg, réplication physique optimisée",
      whatIs: "Réplique le S&P Global Luxury Index, des entreprises mondiales du luxe et des biens haut de gamme. Top positions : LVMH, Hermès, L'Oréal, Ferrari, Richemont — les grandes maisons de luxe européennes et quelques acteurs mondiaux.",
      whyInteresting: "Tu investis dans des marques de luxe mondiales via un seul fonds. C’est une exposition à leur capacité à vendre à des prix élevés, sans choisir une maison en particulier.",
      whatToKnow: "Le secteur dépend aussi de la demande des consommateurs, notamment en Chine. Une marque forte n’empêche ni une baisse des ventes ni une baisse de son cours.",
      verdict: "Un panier de marques mondiales, mais quelques groupes pèsent lourd et leurs ventes restent sensibles aux consommateurs aisés.",
      question: "Tu ajouterais un ETF luxe si tu possèdes déjà ses principales valeurs dans un indice européen ?"
    },
    // Ajouté le 08/09/2026 (audit "densité", 3 secteurs GICS classiques manquants : financières,
    // immobilier coté, technologie large). ISIN/TER vérifiés et croisés en 2e requête indépendante
    // (écarts ≤0,1%, convergents). Encours (AUM) de l'iShares Property Yield (immobilier) a montré
    // 4 valeurs différentes selon les requêtes (46M / 972M / 1 034M / 1 730M) — écart bien plus large
    // qu'une simple différence de date : le premier chiffre (46M) et le dernier (1 730M) ont été
    // écartés comme non fiables (units/devises probablement mal lus par la recherche), retenu le
    // point médian des deux chiffres convergents (972M et 1 034M, écart 6% seulement) = ~1 003 M€,
    // arrondi à ~1 Md€.
    {
      id: "financieres",
      category: "Sectoriels classiques",
      name: "iShares MSCI World Financials Sector Advanced UCITS ETF USD (Dist)",
      tickers: ["WFNS"],
      isNew: true,
      isin: "IE00BJ5JP097",
      ter: formatEtfTer("IE00BJ5JP097", "sheet"),
      positions: "228 positions",
      aum: "~125 M€",
      lastVerified: "08/09/2026",
      distribution: "Distribuant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique",
      whatIs: "Réplique le MSCI World Financials Advanced Select 20/35 Capped, environ 228 banques, assureurs et sociétés de paiement des marchés développés. Top positions : JPMorgan Chase, Visa, Berkshire Hathaway, Mastercard, Goldman Sachs — un mix de banques classiques et de réseaux de paiement.",
      whyInteresting: "Cet ETF donne davantage de poids aux banques, assureurs et autres sociétés financières mondiales. Utile si c’est précisément ce secteur que tu veux renforcer.",
      whatToKnow: "Une hausse des taux peut aider certaines banques et en pénaliser d’autres. Les crises de crédit restent un risque majeur. La part distribue des revenus, à prendre en compte sur CTO.",
      verdict: "Pour augmenter délibérément la part des banques et autres sociétés financières dans un portefeuille mondial.",
      question: "Tu veux surpondérer la finance ou laisser ton ETF World déterminer son poids ?"
    },
    {
      id: "immobilier-reit",
      category: "Sectoriels classiques",
      name: "iShares Developed Markets Property Yield UCITS ETF USD (Dist)",
      tickers: ["IWDP"],
      isNew: true,
      isin: "IE00B1FZS350",
      ter: formatEtfTer("IE00B1FZS350", "sheet"),
      positions: "339 positions",
      aum: "~1 Md€",
      lastVerified: "08/09/2026",
      distribution: "Distribuant (trimestriel)",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique",
      whatIs: "Réplique un indice de foncières cotées (REIT) des marchés développés, environ 339 sociétés qui possèdent et gèrent de l'immobilier (bureaux, entrepôts, data centers, commerces). Top positions : Prologis (entrepôts logistiques), Equinix (data centers), Simon Property Group, Digital Realty Trust, Realty Income.",
      whyInteresting: "Il permet d’acheter des foncières cotées sans gérer directement un bien immobilier. Tu gardes la liquidité d’un ETF et reçois les distributions de cette part.",
      whatToKnow: `Les foncières cotées peuvent chuter comme les autres actions, surtout quand les taux montent. Ne confonds pas leurs distributions avec des loyers garantis ; les frais sont de ${formatEtfTer("IE00B1FZS350", "index")} par an.`,
      verdict: "De l’immobilier coté, achetable comme une action. Sa liquidité ne le protège ni des baisses en Bourse ni des variations de taux.",
      question: "Tu choisirais les foncières cotées pour leur liquidité, malgré leurs variations quotidiennes ?"
    },
    {
      id: "technologie",
      category: "Sectoriels classiques",
      name: "iShares MSCI World Information Technology Sector Advanced UCITS ETF USD (Dist)",
      tickers: ["WITS"],
      isNew: true,
      isin: "IE00BJ5JNY98",
      ter: formatEtfTer("IE00BJ5JNY98", "sheet"),
      positions: "161 positions",
      aum: "~1,04 Md€",
      lastVerified: "08/09/2026",
      distribution: "Distribuant (semestriel)",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le MSCI World Information Technology Advanced Select 20/35 Capped, environ 161 entreprises du secteur technologique mondial — plus large qu'un pari pur semi-conducteurs ou IA. Top positions : Nvidia (17,3%), Apple (14,2%), Microsoft (10,3%), Broadcom (7,1%), ASML — logiciel, matériel et semi-conducteurs réunis.",
      whyInteresting: "Il permet de renforcer le secteur technologique mondial sans choisir une seule activité, comme les puces ou les logiciels.",
      whatToKnow: "Quelques très grandes entreprises pèsent lourd dans le fonds. Compare ses premières positions à celles de tes ETF World et Nasdaq-100 pour mesurer le chevauchement.",
      verdict: "Une façon de surpondérer toute la tech mondiale. Regarde les premières lignes : elles peuvent déjà peser lourd dans ton ETF World.",
      question: "Combien de tes principales positions se retrouveraient à la fois ici et dans ton ETF World ?"
    },

    // ---------- THÉMATIQUES ÉMERGENTES / NICHE ----------
    {
      id: "quantique",
      category: "Thématiques émergentes",
      name: "VanEck Quantum Computing UCITS ETF A",
      tickers: ["QUTM", "QNTM"],
      isNew: true,
      isin: "IE0007Y8Y157",
      ter: formatEtfTer("IE0007Y8Y157", "sheet"),
      positions: "30 positions",
      aum: "~755 M€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Un panier d’environ 30 entreprises liées à l’informatique quantique. Certaines en font leur activité centrale ; pour d’autres, le quantique n’est qu’une partie de leurs projets. Acheter cet ETF ne revient donc pas à acheter uniquement des spécialistes du secteur.",
      whyInteresting: "Tu peux suivre ce thème sans devoir choisir toi-même entre une jeune entreprise très risquée et un groupe déjà établi. C’est surtout une façon de prendre une position ciblée sur une technologie dont l’usage commercial reste à construire.",
      whatToKnow: `Avec environ 30 lignes, le fonds reste concentré et ses variations peuvent être fortes. Les frais sont de ${formatEtfTer("IE0007Y8Y157", "index")} par an et il n’est pas éligible au PEA. Les hausses passées ne disent pas si ces entreprises transformeront la technologie en bénéfices.`,
      verdict: "Une petite position thématique éventuelle, pour qui accepte une forte volatilité et un résultat très incertain.",
      question: "Si tu voulais investir dans le quantique, tu choisirais cet ETF ou quelques entreprises précises ?"
    },
    {
      id: "ia",
      category: "Thématiques émergentes",
      name: "L&G Artificial Intelligence UCITS ETF",
      tickers: ["AIAI"],
      isNew: false,
      isin: "IE00BK5BCD43",
      ter: formatEtfTer("IE00BK5BCD43", "sheet"),
      // Fiche L&G du 31/08/2026, ISIN IE00BK5BCD43 : encours 2 090,9 M$.
      // Conversion indicative avec la parité BCE/Banque de France au même jour
      // (1 € = 1,1596 $) : 2 090,9 / 1,1596 = 1 803,1 M€.
      // https://dokumenty.analizy.pl/pobierz/etf/E_LG001_A_USD/KA/2026-08-31
      // https://www.banque-france.fr/fr/statistiques/taux-et-cours/taux-de-change-parites-quotidiennes-2026-08-31
      // La fiche donne 53 sociétés dans l'indice et les principales positions de
      // l'indice ; le portefeuille de l'ETF peut légèrement différer.
      positions: "53 sociétés dans l’indice (31/08/2026)",
      aum: "~1,8 Md€ au 31/08/2026",
      lastVerified: "25/09/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le ROBO Global Artificial Intelligence Index, des entreprises actives sur toute la chaîne de valeur de l'IA : infrastructure, logiciels, applications. Parmi les principales sociétés de l’indice au 31/08/2026 : Tempus AI, Palo Alto Networks, Everpure, Elastic et Cloudflare. Le portefeuille du fonds peut différer de l’indice.",
      whyInteresting: "Cet ETF cherche des entreprises liées à l’intelligence artificielle dans plusieurs métiers, au-delà des seuls fabricants de puces.",
      whatToKnow: "Le thème ne dit pas combien ces entreprises gagneront grâce à l’IA. Regarde les titres détenus et leur poids : tu peux déjà posséder plusieurs de ces sociétés dans un ETF technologique ou mondial.",
      verdict: "Cet ETF rassemble plusieurs métiers liés à l’IA. Vérifie sa composition avant de supposer qu’il suit uniquement les fabricants de modèles ou de puces.",
      question: "Tu veux investir dans les fabricants de puces, les logiciels ou l’ensemble de la chaîne IA ?"
    },
    {
      id: "robotique",
      category: "Thématiques émergentes",
      name: "iShares Automation & Robotics UCITS ETF",
      tickers: ["RBOT"],
      isNew: false,
      isin: "IE00BYZK4552",
      ter: formatEtfTer("IE00BYZK4552", "sheet"),
      positions: "~120 positions",
      aum: "~4,5 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le iSTOXX FactSet Automation & Robotics Index, des entreprises liées à l'automatisation industrielle et à la robotique. Top positions : Nvidia, Fanuc, Intuitive Surgical, Keyence — mix de robotique industrielle et de robotique chirurgicale.",
      whyInteresting: "Il réunit des entreprises de l’automatisation et de la robotique. Cela donne une exposition à plusieurs usages, de l’industrie à d’autres équipements.",
      whatToKnow: "La composition compte plus que l’étiquette « robotique » : certaines sociétés n’en tirent qu’une partie de leurs revenus. Les investissements industriels peuvent ralentir avec l’économie.",
      verdict: "Une exposition à l’automatisation des entreprises, plus concrète que le seul récit autour de l’IA générative.",
      question: "Tu préfères la robotique industrielle ou les entreprises de logiciels d’IA ?"
    },
    {
      id: "blockchain",
      category: "Thématiques émergentes",
      name: "iShares Blockchain Technology UCITS ETF",
      tickers: ["BLKC"],
      isNew: false,
      isin: "IE000RDRMSD1",
      ter: formatEtfTer("IE000RDRMSD1", "sheet"),
      positions: "~50 positions",
      aum: "~308 M€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique un indice d'entreprises liées à l'écosystème blockchain : mineurs de cryptomonnaies, plateformes d'échange, fournisseurs d'infrastructure. Top positions : Coinbase, Strategy (ex-MicroStrategy), Marathon Digital, Robinhood.",
      whyInteresting: "Tu suis des sociétés cotées actives dans l’écosystème blockchain et crypto, sans acheter toi-même de cryptomonnaies.",
      whatToKnow: "Tu détiens des actions, pas du bitcoin. Leurs cours peuvent pourtant suivre fortement le marché crypto et subir en plus les risques propres à chaque entreprise.",
      verdict: "Tu achètes ici des actions d’entreprises liées à la blockchain, pas du Bitcoin. Leurs risques d’entreprise s’ajoutent au cycle crypto.",
      question: "Tu préférerais détenir directement du Bitcoin ou des sociétés exposées à son écosystème ?"
    },
    {
      id: "nucleaire",
      category: "Thématiques émergentes",
      name: "VanEck Uranium and Nuclear Technologies UCITS ETF",
      tickers: ["NUKL"],
      isNew: false,
      isin: "IE000M7V94E1",
      ter: formatEtfTer("IE000M7V94E1", "sheet"),
      positions: "~25 positions",
      aum: "~2,0 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le MarketVector Uranium & Nuclear Technologies Index : mines d'uranium, exploitants de centrales, équipementiers, et acteurs émergents de la fusion nucléaire. Top positions : Cameco, Constellation Energy, NuScale, Oklo.",
      whyInteresting: "Il rassemble des entreprises liées à l’uranium et à la filière nucléaire. Cela donne accès à plusieurs maillons d’une même industrie.",
      whatToKnow: "Un besoin accru d’électricité ne garantit pas des gains pour chaque entreprise du fonds. Les prix de l’uranium, les coûts des projets et les décisions publiques peuvent peser lourd.",
      verdict: "Il réunit plusieurs maillons du nucléaire. La demande d’électricité ne suffit pas, à elle seule, à garantir la hausse de ces actions.",
      question: "Tu chercherais plutôt les producteurs d’uranium ou les industriels du nucléaire ?"
    },
    {
      id: "batteries-ve",
      category: "Thématiques émergentes",
      name: "L&G Battery Value-Chain UCITS ETF",
      tickers: ["BATT"],
      isNew: false,
      isin: "IE00BF0M2Z96",
      ter: formatEtfTer("IE00BF0M2Z96", "sheet"),
      positions: "~40 positions",
      aum: "~730 M€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique la Solactive Battery Value-Chain Index, toute la chaîne de valeur des batteries : extraction de lithium, fabricants de cellules, constructeurs de véhicules électriques. Top positions : Tesla, CATL, Albemarle, BYD.",
      whyInteresting: "Le fonds couvre plusieurs activités autour des batteries et des véhicules électriques, au lieu de miser sur un seul constructeur.",
      whatToKnow: "La croissance du marché ne protège pas les marges des entreprises. Surcapacités, prix des matières premières et concurrence peuvent rendre cette ligne très volatile.",
      verdict: "Une exposition à toute la chaîne des batteries, pas seulement aux constructeurs automobiles. Le thème a déjà montré qu’une tendance de fond peut décevoir en Bourse.",
      question: "Tu regarderais plutôt les fabricants de batteries ou les fournisseurs de matériaux ?"
    },

    // ---------- SPATIAL ----------
    {
      id: "spatial",
      category: "Spatial",
      name: "VanEck Space Innovators UCITS ETF",
      tickers: ["JEDI"],
      isNew: true,
      isin: "IE000YU9K6K2",
      ter: formatEtfTer("IE000YU9K6K2", "sheet"),
      positions: "25 positions",
      aum: "~2,0 Md$",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique",
      whatIs: "Réplique l'indice MarketVector Global Space Industry Screened : environ 25 entreprises actives dans l'économie spatiale (fabricants de satellites, lanceurs, équipements de communication, tourisme spatial).",
      whyInteresting: "Cet ETF donne accès à plusieurs sociétés liées aux services et aux technologies spatiales. Il évite de faire dépendre cette exposition d’une seule entreprise.",
      whatToKnow: "L’univers reste étroit et le thème couvre des métiers très différents. Vérifie les positions : le nom de l’ETF ne suffit pas à dire quelle part des revenus vient réellement du spatial.",
      verdict: "Une exposition très ciblée à l’économie spatiale, avec peu de recul sur plusieurs entreprises du secteur.",
      question: "Quelles activités spatiales voudrais-tu réellement détenir : satellites, lanceurs ou équipements ?"
    },

    // ---------- STRATÉGIQUES ----------
    {
      id: "dividendes",
      category: "Stratégiques",
      name: "SPDR S&P US Dividend Aristocrats UCITS ETF",
      tickers: ["USDV"],
      isNew: false,
      isin: "IE00B6YX5D40",
      ter: formatEtfTer("IE00B6YX5D40", "sheet"),
      positions: "~120 positions",
      aum: "~3,4 Md€",
      lastVerified: "25/08/2026",
      distribution: "Distribuant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique le S&P High Yield Dividend Aristocrats, des entreprises américaines ayant augmenté leur dividende chaque année depuis au moins 20 ans. Sélection dominée par la consommation, l'industrie et la santé plutôt que par la tech.",
      whyInteresting: "L’indice sélectionne des sociétés américaines ayant augmenté leur dividende pendant une longue période. Cette part distribue les revenus aux porteurs.",
      whatToKnow: "Un historique de hausses n’est pas une promesse : le dividende peut être réduit. Le fonds écarte beaucoup de valeurs de croissance et les distributions ont une incidence fiscale sur CTO.",
      verdict: "Une sélection de sociétés américaines ayant augmenté leur dividende pendant au moins vingt ans. La régularité du versement ne garantit pas le rendement total.",
      question: "Tu regardes d’abord le dividende versé ou la performance totale de ton placement ?"
    },
    {
      id: "covered-call",
      category: "Stratégiques",
      name: "Global X Nasdaq 100 Covered Call UCITS ETF",
      tickers: ["QYLE"],
      isNew: false,
      isin: "IE00BM8R0J59",
      ter: formatEtfTer("IE00BM8R0J59", "sheet"),
      positions: "~100 positions",
      aum: "~780 M€",
      lastVerified: "25/08/2026",
      distribution: "Distribuant (mensuel)",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique avec overlay d'options",
      whatIs: "Réplique le Nasdaq-100 tout en vendant systématiquement des options d'achat (covered calls) sur l'indice pour générer un revenu. Combine les 100 valeurs du Nasdaq avec une stratégie de vente d'options mensuelle.",
      whyInteresting: "Ce fonds vend des options sur le Nasdaq-100 et verse des distributions mensuelles. Il peut intéresser quelqu’un qui souhaite percevoir des revenus réguliers.",
      whatToKnow: "Les distributions ne sont pas un rendement garanti. La vente d’options limite une partie de la hausse lorsque le Nasdaq s’envole, tandis que le fonds reste exposé aux baisses.",
      verdict: "Des distributions régulières en échange d’une partie du potentiel de hausse du Nasdaq-100. À comparer avec la détention directe de l’indice.",
      question: "Accepterais-tu de limiter la hausse possible pour recevoir des distributions mensuelles ?"
    },
    {
      id: "low-volatility",
      category: "Stratégiques",
      name: "iShares Edge MSCI World Minimum Volatility UCITS ETF",
      tickers: ["MVOL"],
      isNew: false,
      isin: "IE00B8FHGS14",
      ter: formatEtfTer("IE00B8FHGS14", "sheet"),
      positions: "~300 positions",
      aum: "~2,3 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée",
      whatIs: "Réplique le MSCI World Minimum Volatility Index, qui sélectionne et pondère les titres du MSCI World pour minimiser la volatilité globale du portefeuille. Sur-pondère la santé et les biens de consommation défensifs, sous-pondère la tech et l'énergie.",
      whyInteresting: "L’indice privilégie une combinaison d’actions historiquement moins volatiles. Cela peut modifier le profil d’un portefeuille très exposé aux titres de croissance.",
      whatToKnow: "« Minimum volatility » ne veut pas dire sans baisse. Le fonds peut reculer avec le marché et manquer une partie des fortes hausses ; regarde aussi ses frais face à un ETF World.",
      verdict: "Un ETF World sélectionné pour réduire les fluctuations. Il peut quand même baisser et sa composition s’éloigne de l’indice classique.",
      question: "Tu accepterais de t’écarter du MSCI World pour chercher des variations moins fortes ?"
    },
    {
      id: "value",
      category: "Stratégiques",
      name: "iShares Edge MSCI World Value Factor UCITS ETF",
      tickers: ["IWVL", "WVAL"],
      isNew: false,
      isin: "IE00BP3QZB59",
      ter: formatEtfTer("IE00BP3QZB59", "sheet"),
      positions: "~350 positions",
      aum: "~6,1 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée",
      whatIs: "Réplique le MSCI World Enhanced Value Index, qui sélectionne les entreprises décotées par rapport à leurs fondamentaux (PER bas, price-to-book bas). Sur-pondère la finance, l'énergie et l'industrie, sous-pondère la tech chère.",
      whyInteresting: "Il privilégie des entreprises jugées moins chères selon les critères de l’indice. Tu peux ainsi ajouter un biais value à un portefeuille mondial.",
      whatToKnow: "Une action peu chère peut le rester longtemps. Ce fonds ne garantit ni un rattrapage ni une meilleure performance qu’un indice mondial classique.",
      verdict: "Il privilégie les sociétés jugées moins chères selon les critères de l’indice. Une valorisation basse ne promet pas un rebond.",
      question: "Tu serais prêt à garder ce biais value plusieurs années s’il fait moins bien que le World ?"
    },
    {
      id: "small-caps",
      category: "Stratégiques",
      name: "iShares MSCI World Small Cap UCITS ETF",
      tickers: ["WSML"],
      isNew: false,
      isin: "IE00BF4RFH31",
      ter: formatEtfTer("IE00BF4RFH31", "sheet"),
      positions: "~3 400 positions",
      aum: "~7,7 Md€",
      lastVerified: "25/08/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée",
      whatIs: "Réplique le MSCI World Small Cap Index, environ 3 400 petites capitalisations des marchés développés. Extrêmement diversifié : aucune ligne individuelle ne dépasse 0,5% du fonds.",
      whyInteresting: "Tu ajoutes de petites entreprises des marchés développés, souvent absentes des grands ETF World. C’est une exposition différente des mégacapitalisations.",
      whatToKnow: "Ces sociétés peuvent être plus sensibles au crédit et leurs actions moins liquides. Leur taille ne garantit pas une prime de performance.",
      verdict: "Il complète un World classique avec de petites entreprises des marchés développés. Leur taille apporte une autre exposition, avec davantage de variations possibles.",
      question: "Si tu ajoutes des small caps à ton World, quel poids leur donnerais-tu ?"
    },
    // Ajouté le 08/09/2026 (audit "densité", 2 facteurs manquants dans la catégorie Stratégiques :
    // qualité, momentum). Attention lors de la recherche : la 1re requête sur le facteur Quality a
    // renvoyé par erreur l'ISIN du fonds Momentum (IE00BP3QZ825) — repéré et corrigé avant publication
    // en revérifiant chaque ISIN individuellement plutôt que de faire confiance à un premier résultat.
    // Encours du Momentum : 1re requête a donné 2,44 Md CHF (incohérent avec 2 requêtes suivantes,
    // convergentes à 5,3-6,0 Md€/$) — écarté comme donnée isolée non recoupée, retenu ~5,3 Md€
    // (justETF, confirmé par un chiffre de holdings daté du même jour).
    // TER corrigé le 10/09/2026 (audit "cohérence inter-outils") : 0,30% publié initialement le
    // 08/09/2026 était erroné — comparaison avec le Comparateur d'indices (même ISIN, 0,25% déjà
    // en place) a révélé la divergence, tranchée par 2 nouvelles requêtes indépendantes (justETF,
    // Fidelity, Morningstar convergent toutes sur 0,25%) plutôt qu'en se fiant à la donnée déjà en
    // place — l'écart initial venait probablement d'une confusion avec un TER "brut" avant remise.
    // Encours aligné à ~5,4 Md€ à la même occasion (nouvelle requête : 5 434 M€/£4 540 M/5,79 Md$,
    // convergents entre devises), plutôt que le ~6,3 Md$ initial issu de la même recherche fautive.
    {
      id: "quality",
      category: "Stratégiques",
      name: "iShares Edge MSCI World Quality Factor UCITS ETF (Acc)",
      tickers: ["IWQU", "IWFQ"],
      isNew: true,
      isin: "IE00BP3QZ601",
      ter: formatEtfTer("IE00BP3QZ601", "sheet"),
      positions: "290 positions",
      aum: "~5,4 Md€",
      lastVerified: "10/09/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée",
      whatIs: "Réplique le MSCI World Quality Factor, environ 290 entreprises sélectionnées pour leur rentabilité élevée, leur endettement maîtrisé et la stabilité de leurs résultats. Top positions : Nvidia, Apple, Microsoft, Visa, Meta — les mêmes géants que le World, mais filtrés sur des critères de qualité financière plutôt que sur la seule capitalisation.",
      whyInteresting: "L’indice privilégie des entreprises selon des critères financiers de qualité. C’est une manière précise de sélectionner des actions mondiales plutôt que de suivre leur seule taille.",
      whatToKnow: "Plusieurs grandes lignes peuvent déjà se trouver dans ton ETF World. Compare les positions et les frais pour savoir ce que cette sélection change vraiment.",
      verdict: "Un filtre de solidité appliqué aux grandes actions mondiales. Avant de l’ajouter, compare ses premières positions à celles de ton ETF World.",
      question: "Tu vois assez de différence avec le World classique pour payer ce filtre supplémentaire ?"
    },
    {
      id: "momentum",
      category: "Stratégiques",
      name: "iShares Edge MSCI World Momentum Factor UCITS ETF (Acc)",
      tickers: ["IWMO"],
      isNew: true,
      isin: "IE00BP3QZ825",
      ter: formatEtfTer("IE00BP3QZ825", "sheet"),
      positions: "434 positions",
      aum: "~5,3 Md€",
      lastVerified: "08/09/2026",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée",
      whatIs: "Réplique le MSCI World Momentum Factor, environ 434 entreprises sélectionnées pour leur tendance de prix haussière récente — l'indice \"achète ce qui monte\" et rééquilibre régulièrement. Top positions récentes : Micron, Nvidia, Broadcom, Alphabet, ASML.",
      whyInteresting: "Le fonds privilégie les actions qui ont récemment mieux progressé selon les règles de son indice. Il permet de suivre ce facteur sans choisir les titres toi-même.",
      whatToKnow: "Les tendances se retournent. La composition peut changer aux rééquilibrages et le fonds peut acheter après une hausse, puis vendre après une baisse.",
      verdict: "Il renforce les titres dont la tendance récente est favorable. Cette règle peut se retourner lorsque les leaders changent rapidement.",
      question: "Tu pourrais conserver un ETF momentum après un retournement brutal des valeurs en tête ?"
    },

    // ---------- MATIÈRES PREMIÈRES & CRYPTO ----------
    // Ajouté le 25/09/2026. Or et Bitcoin choisis comme représentants (même logique qu'ailleurs
    // dans ce fichier : une fiche par exposition, pas par émetteur) — cohérents avec les choix
    // déjà faits dans le Générateur de portefeuilles (ids "or" et "bitcoin") pour ne pas
    // recréer un choix déjà tranché. TER et encours vérifiés via recherche web le 25/09/2026
    // (justETF, fiches émetteur), ISIN et rendements repris tels quels du Générateur (aucune
    // nouvelle donnée de performance saisie ici — cf. CLAUDE.md, pas de duplication de données).
    {
      id: "or",
      category: "Matières premières & Crypto",
      name: "iShares Physical Gold ETC",
      tickers: ["SGLN", "IGLN"],
      isNew: false,
      isin: "IE00B4ND3602",
      ter: formatEtfTer("IE00B4ND3602", "sheet"),
      // Encours et TER : recherche web du 25/09/2026 (justETF/fiches iShares). C'est le plus gros
      // des 4 ETC or déjà identifiés dans le Comparateur d'indices (iShares/Invesco/Amundi à
      // 0,12%, WisdomTree à 0,39%) — choisi pour cette raison, pas au hasard.
      positions: "1 seul actif : le métal physique détenu en coffre — pas un panier de titres",
      aum: "~34,3 Md€",
      lastVerified: "25/09/2026",
      distribution: "Capitalisant (pas de revenu versé — l'or n'en génère aucun)",
      pea: false,
      cto: true,
      location: "Irlande, adossé à de l'or physique alloué (pas de réplication synthétique)",
      whatIs: "Chaque part de cet ETC correspond à une quantité d'or physique détenue en coffre pour le compte des porteurs. Ce n'est pas une action minière ni un fonds synthétique : le cours suit directement le cours spot de l'or, moins les frais.",
      whyInteresting: "Historiquement, l'or a joué un rôle de valeur refuge en période d'inflation ou d'incertitude, et reste peu corrélé aux actions. C'est un moyen simple d'y être exposé sans acheter et stocker du métal toi-même.",
      whatToKnow: "L'or ne verse aucun dividende ni coupon : sa seule source de gain est la variation de son cours. Ce cours peut aussi baisser, parfois plusieurs années de suite. Non éligible PEA, et le rendement en euros dépend aussi du taux de change €/$.",
      verdict: "Une exposition directe et simple au métal physique, sans diversification interne — un seul actif, pas un panier de titres.",
      question: "L'or, une assurance que tu gardes en petite dose ou une ligne que tu évites complètement ?"
    },
    {
      id: "bitcoin",
      category: "Matières premières & Crypto",
      name: "CoinShares Physical Bitcoin ETP",
      tickers: ["BITC"],
      isNew: false,
      isin: "GB00BLD4ZL17",
      ter: formatEtfTer("GB00BLD4ZL17", "sheet"),
      // Encours et TER : recherche web du 25/09/2026 (justETF/CoinShares). Choisi comme
      // représentant car c'est le même émetteur/ISIN que le Générateur de portefeuilles utilise
      // comme ligne principale ("bitcoin"), pas le moins cher dans l'absolu (WisdomTree égale son
      // TER à 0,15%) mais celui déjà retenu ailleurs dans l'appli.
      positions: "1 seul actif : le bitcoin détenu en garde institutionnelle — pas un panier de titres",
      aum: "~1,4 Md€",
      lastVerified: "25/09/2026",
      distribution: "Capitalisant (pas de revenu versé)",
      pea: false,
      cto: true,
      location: "Jersey, adossé à du bitcoin physiquement détenu (pas un produit dérivé/synthétique)",
      whatIs: "Chaque part de cet ETP correspond à une quantité de bitcoin détenue par un dépositaire agréé pour le compte des porteurs. Ce n'est pas un contrat à terme ni un fonds qui réplique le bitcoin de façon synthétique.",
      whyInteresting: "Ça permet de détenir une exposition au bitcoin sur un compte-titres classique, sans gérer soi-même un portefeuille crypto (clés privées, plateforme d'échange).",
      whatToKnow: "Le bitcoin est extrêmement volatil : des variations de plusieurs dizaines de pourcents dans l'année, dans un sens comme dans l'autre, ne sont pas rares. Non éligible PEA. Aucun revenu versé, et la valeur peut tomber à une fraction de son point haut.",
      verdict: "Une façon simple d'être exposé au bitcoin depuis un compte-titres, mais sans aucune diversification : un seul actif, à l'amplitude de variation parmi les plus fortes de cette bibliothèque.",
      question: "Le bitcoin dans ton portefeuille : une conviction assumée ou une ligne que tu préfères éviter ?"
    },

    // ---------- OBLIGATAIRES ----------
    {
      id: "obligations-etat",
      category: "Obligataires",
      name: "iShares Core Euro Government Bond UCITS ETF (Dist)",
      tickers: ["SEGA"],
      isNew: false,
      isin: "IE00B4WXJJ64",
      ter: formatEtfTer("IE00B4WXJJ64", "sheet"),
      // iShares, fiche IE00B4WXJJ64, données au 22/09/2026 : 552 lignes, duration 6,70 ans.
      // https://www.ishares.com/uk/professionals/en/products/251740/ishares-euro-government-bond-ucits-etf
      positions: "552 positions",
      aum: "~5,3 Md€",
      lastVerified: "22/09/2026",
      distribution: "Distribuant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique par échantillonnage",
      whatIs: "Cet ETF détient des obligations émises par plusieurs États de la zone euro, avec des échéances différentes. Sa duration effective était d’environ 6,7 ans en septembre 2026 : c’est le chiffre à regarder pour comprendre sa réaction aux taux.",
      whyInteresting: `Il ajoute des obligations à un portefeuille composé surtout d’actions, pour ${formatEtfTer("IE00B4WXJJ64", "index")} de frais annuels. Cela peut aider à répartir les risques, même si les obligations ne protègent pas lors de toutes les baisses boursières.`,
      whatToKnow: "Avec une duration d’environ 6,7 ans, une hausse parallèle des taux d’un point pourrait entraîner une baisse approximative de 6,7 % du prix, toutes choses égales par ailleurs. Il porte aussi le risque des États présents dans l’indice et n’est pas éligible au PEA.",
      verdict: "Utile si tu veux des obligations d’État en portefeuille, mais à choisir en comprenant d’abord sa sensibilité aux taux.",
      question: "Pour ta poche prudente, tu préfères ces obligations ou un fonds à duration plus courte ?"
    },
    {
      id: "high-yield",
      category: "Obligataires",
      name: "iShares Euro High Yield Corporate Bond UCITS ETF (Dist)",
      tickers: ["IHYA", "EHYA"],
      isNew: false,
      isin: "IE00B66F4759",
      ter: formatEtfTer("IE00B66F4759", "sheet"),
      positions: "~500 positions",
      aum: "~5,8 Md€",
      lastVerified: "25/08/2026",
      distribution: "Distribuant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique optimisée",
      whatIs: "Réplique un indice d'obligations d'entreprises notées \"spéculatives\" (BB et en dessous), libellées en euros. Diversifié sur environ 500 émetteurs de secteurs variés.",
      whyInteresting: "Il rassemble des obligations d’entreprises en euros moins bien notées. Leurs intérêts sont généralement plus élevés pour rémunérer un risque de crédit supérieur.",
      whatToKnow: "Si les défauts augmentent, le cours peut baisser malgré les coupons. En période de crise, ce segment peut se comporter davantage comme des actions que comme des obligations d’État.",
      verdict: "Des obligations d’entreprises offrant davantage de rendement, avec un risque de défaut plus élevé. Elles ne jouent pas le même rôle que des obligations d’État.",
      question: "Quel risque de baisse accepterais-tu pour chercher plus de revenus obligataires ?"
    },
    // Revérifié le 14/09/2026 (audit "outils", complétion des 3 fiches obligataires sans date de
    // sourcing documentée) : ISIN, TER, encours et éligibilité PEA/CTO confirmés exacts via justETF/
    // iShares (Fund NAV 13 229,54 M€ au 11/09/2026, cohérent avec les 13,36 Md€ déjà en place, écart
    // de simple fluctuation de NAV). Aucune correction nécessaire.
    {
      id: "corp-bond-ig",
      category: "Obligataires",
      name: "iShares Core € Corp Bond UCITS ETF (Dist)",
      tickers: ["IEAC"],
      isNew: true,
      isin: "IE00B3F81R35",
      lastVerified: "14/09/2026",
      ter: formatEtfTer("IE00B3F81R35", "sheet"),
      positions: "~3 000 positions",
      aum: "~13,36 Md€",
      distribution: "Distribuant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique intégrale",
      whatIs: "Réplique un indice large d'obligations d'entreprises \"investment grade\" (notées BBB- et au-dessus) libellées en euros, tous secteurs confondus.",
      whyInteresting: "Il permet d’investir dans de nombreuses obligations d’entreprises en euros de catégorie investment grade. Cette part distribue les revenus.",
      whatToKnow: "Investment grade ne veut pas dire sans risque : les taux et la qualité de crédit font varier le prix. Les distributions peuvent aussi compter dans ta fiscalité sur CTO.",
      verdict: "Des obligations d’entreprises bien notées pour diversifier la poche obligataire. La qualité de crédit n’efface pas le risque de taux.",
      question: "Pour tes obligations, tu privilégierais les entreprises bien notées ou les États ?"
    },
    // Revérifié le 14/09/2026 (audit "outils", complétion des 3 fiches obligataires sans date de
    // sourcing documentée) : ISIN, TER et éligibilité PEA/CTO confirmés exacts. Encours CORRIGÉ :
    // ~1,37 Md€ -> ~1,59 Md€ (justETF, fonds à 1 592 M€), l'ancienne valeur sous-estimait la
    // croissance réelle du fonds sur ce segment high yield capitalisant.
    {
      id: "high-yield-acc",
      category: "Obligataires",
      name: "iShares € High Yield Corp Bond UCITS ETF (Acc)",
      tickers: ["HIGH"],
      isNew: true,
      isin: "IE00BF3N7094",
      lastVerified: "14/09/2026",
      ter: formatEtfTer("IE00BF3N7094", "sheet"),
      positions: "~500 positions",
      aum: "~1,59 Md€",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique",
      whatIs: "Version capitalisante de l'exposition high yield en euros : obligations d'entreprises notées \"spéculatives\" (BB et en dessous), coupons réinvestis automatiquement.",
      whyInteresting: "Il donne accès aux obligations d’entreprises en euros à haut rendement en capitalisant les revenus. C’est une autre façon de détenir cette exposition que la part distribuante.",
      whatToKnow: "La capitalisation des revenus ne réduit pas le risque de défaut. Vérifie aussi la taille du fonds et sa liquidité si tu compares les deux parts.",
      verdict: "La version capitalisante du crédit à haut rendement. Les intérêts sont réinvestis dans le fonds, mais le risque de crédit reste le même.",
      question: "Sur du high yield, tu veux des distributions ou préfères-tu leur réinvestissement automatique ?"
    },
    // Revérifié le 14/09/2026 (audit "outils", complétion des 3 fiches obligataires sans date de
    // sourcing documentée) : ISIN, TER et éligibilité PEA/CTO confirmés exacts. Encours NON TRANCHÉ :
    // justETF donne 274 M£ (~350-390 M$ selon conversion), cohérent avec les ~407 M$ déjà en place ;
    // une autre requête a renvoyé 5,46 Md$ mais accolée dans le même résultat à un ISIN différent
    // (IE00B5M4WH52, un fonds jumeau sans le qualificatif "USD (Acc)") — écarté comme probable
    // confusion de part plutôt que retenu, WebFetch étant bloqué dans ce sandbox pour trancher via la
    // fiche officielle. Valeur conservée (cohérente avec la source la mieux attribuée à cet ISIN
    // précis), même principe que l'écart non tranché sur oblig_etat_eur_short/MSCI Japan IMI.
    {
      id: "em-local-bond",
      category: "Obligataires",
      name: "iShares J.P. Morgan EM Local Govt Bond UCITS ETF (Acc)",
      tickers: ["EMGA"],
      isNew: true,
      isin: "IE00BFZPF546",
      lastVerified: "14/09/2026",
      ter: formatEtfTer("IE00BFZPF546", "sheet"),
      positions: "~200 positions",
      aum: "~407 M$",
      distribution: "Capitalisant",
      pea: false,
      cto: true,
      location: "Irlande, réplication physique",
      whatIs: "Réplique un indice de dette d'État de pays émergents, émise en devise locale (et non en dollar) : Brésil, Mexique, Afrique du Sud, Indonésie, Inde, etc.",
      whyInteresting: "Il réunit des obligations d’État émergents libellées dans leurs monnaies locales. Tu t’exposes donc à la fois aux taux et aux devises de ces pays.",
      whatToKnow: "Une monnaie qui baisse face à l’euro peut effacer les intérêts reçus. Il faut aussi compter avec le risque souverain : le rendement affiché ne raconte pas tout.",
      verdict: "Une exposition à la fois aux obligations et aux devises émergentes. Une dépréciation des monnaies locales peut effacer les coupons reçus.",
      question: "Dans ta poche obligataire, prendrais-tu aussi le risque des monnaies émergentes ?"
    }
  ];
