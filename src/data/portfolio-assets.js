import { getInstrumentName } from './instruments.js';
import { getInstrumentReturnValues } from './instrument-returns.js';
// Bibliothèque d'actifs — rendements calendaires 2020-2025 : supports exacts quand
// l'émetteur publie la série, et proxies ou historiques mixtes explicitement signalés sinon.
// Les séries USD et EUR ne sont pas converties dans une devise commune.
// r = [2020, 2021, 2022, 2023, 2024, 2025]
//
// Roster de 72 supports (dont 2 non-ETF : fonds_euros, produit d'assurance-vie sans ISIN ; scpi,
// générique non plus) : chaque actif n'existe que parce qu'il a un rôle clair dans au moins une
// thèse de portefeuille (src/theses.js). Pas de ligne "parce qu'il en fallait une de plus" — voir
// CLAUDE.md du projet pour la philosophie de sélection. 8 actifs sans rôle identifié (china, india,
// japan, oblig_global_agg, oblig_short, petrole, strat_momentum, strat_smallcap) ont été retirés lors
// d'un audit en août 2026 pour que ce roster reste vrai. 4 jumeaux distribuants (suffixe _dist,
// flag distributing: true) ont été ajoutés ensuite, réservés au profil Rentier qui exige des parts
// distribuantes (cf. warning dans theses.js). 5 jumeaux supplémentaires (Monde, S&P 500, Nasdaq-100,
// Euro Stoxx 50, matières premières) ont été ajoutés lors d'un audit "enrichissement bibliothèque" —
// chacun vérifié réel et partageant une exposition proche de l'actif
// d'origine du groupe (cf. SP500_OPTIONS, NASDAQ100_OPTIONS, EUROSTOXX50_OPTIONS, COMMODITY_OPTIONS
// dans theses.js). Les rendements propres à chaque part ne se déduisent pas du sous-jacent commun.
// 9 actifs supplémentaires (6 secteurs thématiques, dividendes, immobilier, obligataire
// haut rendement) ont été ajoutés lors d'un audit "enrichissement sectoriel" en août 2026 — chacun
// vérifié un par un (existence réelle, indice sous-jacent exact, historique 2020-2025) via recherche
// web (cf. commentaires individuels ci-dessous pour le détail des sources et le niveau de confiance),
// puis intégrés dans theses.js via THEME_OPTIONS_*, DIVIDEND_OPTIONS, IMMOBILIER_OPTIONS et
// HIGHYIELD_OPTIONS. Plusieurs fonds suggérés dans le prompt d'origine de cet audit ont été
// explicitement écartés faute de vérification suffisante (fonds trop récents pour avoir un
// historique 2020-2025, ou données contradictoires non résolues) — voir le rapport de session.
// 2 ETF à levier (lqq, Amundi Nasdaq-100 Daily 2x Leveraged ; cl2, Amundi MSCI USA Daily 2x
// Leveraged) ajoutés en août 2026 à la demande explicite d'un audit de cohérence : rendements
// réels de la part cotée pour chacun (jamais un ×2 synthétique d'une série existante), groupés
// via LEVERAGE_OPTIONS dans theses.js pour que la génération alterne entre les deux plutôt que de
// toujours piocher le même pari, intégrés à poids minime en Dynamique et à poids significatif en
// Offensif après vérification empirique du plancher de perte de chaque palier (cf. theses.js et
// le script de stress-test de la session pour le détail des bornes testées).
//
// ISIN ajoutés le 13/09/2026 (audit "ISIN pour chaque ETF", demande utilisateur) : les 68 actifs
// réellement ETF de ce fichier portent désormais un champ `isin` (fonds_euros et scpi exclus, pas
// des ETF). Sourcing en 3 temps : (1) 18 ISIN déjà présents dans les commentaires individuels
// ci-dessous (audits précédents) — repris tels quels ; (2) ~11 recoupés directement avec les ISIN
// déjà vérifiés ailleurs dans l'app (Fiches ETF, Tweet ETF, Comparateur d'indices — même fonds,
// jamais re-sourcés en double), avec vigilance particulière sur les parts Acc/Dist qui portent des
// ISIN distincts même pour un nom d'affichage proche (une confusion de ce type, détectée et
// corrigée avant publication : oblig_hy avait failli hériter par erreur de l'ISIN Acc d'un fonds
// tiers alors que ce fonds précis — IHYG — est Dist) ; (3) ~35 recherchés via WebSearch (WebFetch
// bloqué dans ce sandbox), ticker déjà connu par le commentaire existant quand disponible (cas le
// plus fiable), sinon nom complet du fonds. Deux cas particuliers documentés directement sur leur
// actif plutôt qu'ici : strat_dividendes (aucune part Acc distincte trouvée, partage l'ISIN de son
// jumeau Dist). oblig_etat_us a depuis été identifié précisément (BlackRock GOVT).
//
// 2 supports ajoutés le 14/09/2026 (audit "double-outil", cherchés en parallèle pour ce fichier et
// le Calculateur d'investissement) : sect_financieres (secteur financier US, absent jusqu'ici) et
// smallcap_monde (small cap monde, complète smallcap_europe). Non assignés à un combo — cf.
// commentaire individuel de chacun en fin de fichier pour le détail du sourcing et pourquoi le
// Calculateur n'a finalement pas pu les recevoir.

export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

// Catégories utilisées uniquement pour la colorimétrie de l'interface (liste d'allocation, légende).
// L'émoji affiché dans le texte du tweet est porté par chaque actif individuellement (cf. plus bas),
// car la nomenclature demandée classe par "rôle" plutôt que par catégorie de fonds.
export const CATEGORIES = {
  obligataire: { label: "Obligataire / fonds euros", color: "#3987e5" },
  actions_larges: { label: "Actions développées", color: "#199e70" },
  matieres_premieres: { label: "Matières premières", color: "#d95926" },
  dividendes: { label: "Dividendes", color: "#c98500" },
  immobilier: { label: "Immobilier", color: "#d55181" },
  emergents: { label: "Actions émergentes", color: "#008300" },
  crypto: { label: "Crypto", color: "#e66767" },
};

export const ASSETS = [
  // Vérifiés le 01/10/2026 : parts des nouvelles présentations, sélection manuelle uniquement.
  {
    id: "monetaire_xeon", name: getInstrumentName("LU0290358497", "portfolio"), isin: "LU0290358497", cat: "obligataire", emoji: "🔵",
    manualOnly: true, r: getInstrumentReturnValues("LU0290358497"),
    confidenceNote: "Rendements NAV de la part en euros ; arrondis publiés par l’émetteur. Le fonds a changé d’indice en décembre 2020 et novembre 2023.",
    desc: ["Son indice reflète un taux monétaire en euros, le €STR, auquel s’ajoute une petite marge avant les frais. Le fonds reçoit cette performance grâce à un swap. Tu t’exposes donc aux taux au jour le jour, plutôt qu’à un panier d’actions ou à des obligations de longue durée.", "L’intérêt est de comprendre une exposition dont le rendement évolue avec les taux courts. Cette part capitalise les revenus : ils restent investis dans le fonds, sans versement à réinvestir toi-même.", "Le rendement n’est pas fixé à l’avance : il diminue lorsque les taux courts baissent et peut devenir négatif. Le swap ajoute un risque de contrepartie. Il faut aussi compter les frais du fonds et ceux du courtier : ce placement ne bénéficie pas de la garantie d’un dépôt bancaire."],
  },
  {
    id: "oblig_0_1_ishares", name: getInstrumentName("IE00B3FH7618", "portfolio"), isin: "IE00B3FH7618", cat: "obligataire", emoji: "🔵",
    manualOnly: true, r: getInstrumentReturnValues("IE00B3FH7618"),
    confidenceNote: "Rendements NAV de la part en euros ; arrondis publiés par l’émetteur.",
    desc: ["Ce fonds rassemble des obligations d’État de la zone euro dont l’échéance est courte, entre zéro et un an. Leur remboursement approche, ce qui limite leur sensibilité aux mouvements de taux par rapport à des obligations plus longues. Cette part distribue les revenus.", "L’intérêt est d’accéder à plusieurs emprunts d’État en euros avec une seule ligne. Pour comprendre son comportement, la durée des obligations compte davantage que la seule présence du mot « État » dans le nom.", "Une échéance courte ne garantit pas ton capital. La valeur des parts peut baisser, et le fonds renouvelle ses obligations : tu ne détiens pas un placement qui te rembourse automatiquement à une date choisie. Les revenus évolueront aussi avec les taux."],
  },
  {
    id: "oblig_global_agg_eur_hedged", name: getInstrumentName("IE00BDBRDM35", "portfolio"), isin: "IE00BDBRDM35", cat: "obligataire", emoji: "🔵",
    manualOnly: true, r: getInstrumentReturnValues("IE00BDBRDM35"),
    confidenceNote: "Rendements NAV de la part en euros ; arrondis publiés par l’émetteur.",
    desc: ["Le fonds rassemble des obligations mondiales de catégorie investment grade : États, entreprises et titres adossés à des actifs. Cette part ajoute une couverture du risque de change vers l’euro. Tu suis donc un large marché obligataire, avec un mécanisme destiné à limiter l’effet des devises.", "L’intérêt est de réunir de nombreux emprunteurs et plusieurs marchés dans une seule ligne. La part capitalise les revenus, tandis que la couverture évite de laisser les mouvements des monnaies expliquer seuls une grande partie du résultat en euros.", "La couverture ne supprime ni le risque de taux ni le risque de crédit, et elle a un coût. Le fonds peut subir des baisses marquées malgré ses nombreuses lignes. L’émetteur annonce aussi la suppression d’une ligne de cotation le 15 décembre 2026 : vérifie la place utilisée auprès de ton courtier."],
  },
  {
    id: "actions_india_ishares", name: getInstrumentName("IE00BZCQB185", "portfolio"), isin: "IE00BZCQB185", cat: "emergents", emoji: "🟢",
    manualOnly: true, r: getInstrumentReturnValues("IE00BZCQB185"),
    confidenceNote: "Rendements NAV de la part en dollars ; le résultat en euros dépend du change.",
    desc: ["Le MSCI India rassemble de grandes et moyennes entreprises du marché indien. Tu t’exposes à leurs actions, avec des poids différents selon leur capitalisation. La croissance économique du pays peut soutenir leur activité, mais elle ne détermine pas à elle seule le rendement de ton placement.", "L’intérêt est de suivre ce marché en une seule ligne, sans devoir sélectionner les entreprises toi-même. Cela rend l’exposition précise : tu renforces volontairement un pays plutôt que l’ensemble des marchés émergents.", "Le fonds reste concentré sur un pays et ses entreprises. Les valorisations, la réglementation et la roupie influencent le résultat. Ses frais de 0,65 % par an méritent aussi une comparaison avec les alternatives : une économie dynamique ne garantit pas des actions toujours rentables."],
  },
  {
    id: "infrastructure_ishares", name: getInstrumentName("IE00B1FZS467", "portfolio"), isin: "IE00B1FZS467", cat: "actions_larges", emoji: "🟢",
    manualOnly: true, r: getInstrumentReturnValues("IE00B1FZS467"),
    confidenceNote: "Rendements NAV de la part en dollars ; le résultat en euros dépend du change.",
    desc: ["Son indice rassemble des sociétés cotées liées aux infrastructures dans plusieurs pays. Tu détiens leurs actions : leurs contrats, leurs investissements et leur financement comptent pour leurs résultats. Le caractère essentiel de leurs services ne garantit pas la stabilité de leur cours.", "L’intérêt est de réunir plusieurs acteurs de cet univers dans une seule ligne. Cette part distribue des revenus : pour évaluer le placement, il faut regarder les versements et l’évolution de la valeur des parts ensemble.", "Ces actions restent sensibles aux taux, à l’endettement et aux décisions réglementaires. Les dividendes peuvent varier. Les frais de 0,65 % par an comptent aussi : des services indispensables ne rendent pas le placement sans risque."],
  },

  // ── 🔵 Obligataire / fonds euros ──────────────────────
  // Sources ACPR vérifiées le 24/09/2026 ; revoir lors de la publication du millésime 2026.
  {
    id: "fonds_euros", name: "Fonds euros (assurance-vie)", cat: "obligataire", emoji: "🔵",
    // ACPR, revalorisation moyenne des supports euros des contrats individuels,
    // nette des prélèvements sur encours et AVANT prélèvements sociaux, 2020-2025.
    // Rapports ACPR n° 126, 140, 149, 163, 175 et 180 (voir sources de l'audit).
    r: [1.28, 1.28, 1.91, 2.60, 2.63, 2.63],
    confidenceNote: "Moyennes ACPR des fonds euros de contrats individuels, nettes des frais prélevés sur l'encours mais avant prélèvements sociaux ; ton contrat peut servir un taux différent.",
    desc: [
      "le socle sécuritaire des assurances-vie : capital garanti, rendement modeste mais stable.",
      "une poche plus stable que les actions ; son taux servi varie selon le contrat et l'année.",
      "le support préféré des épargnants prudents : liquidité et garantie du capital avant tout.",
    ],
  },
  {
    id: "oblig_etat_eur", name: getInstrumentName("IE00B4WXJJ64", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "IE00B4WXJJ64",
    // 2020/2021/2023/2024/2025 CORRIGÉS le 30/08/2026 : les 3 tentatives précédentes via
    // WebSearch/WebFetch avaient toutes échoué (domaine ishares.com/blackrock.com bloqué pour
    // cette session, résultats de recherche incohérents ou de simples échos de requête). Résolu
    // via une capture d'écran du fact sheet officiel iShares fournie directement par l'utilisateur
    // (iShares Core € Govt Bond UCITS ETF, EUR Distributing, iShares III plc — tableau "Calendar
    // year performance", part Share Class, consultée le 30/08/2026), qui donne l'année 2022 à
    // -18,52% — identique à l'ancrage déjà vérifié, confirmant qu'il s'agit bien du même fonds/de
    // la même part. Valeurs des autres années tirées du même tableau : 2020 +4,84%, 2021 -3,53%,
    // 2023 +7,06%, 2024 +1,75%, 2025 +0,61%. Ce même fact sheet éclaire au passage la tentative
    // écartée précédente : -0,01% n'était pas 2022 mais très probablement l'année 2017 du même
    // tableau (valeur identique sur la capture), confirmant que le mauvais alignement calendaire
    // évoqué dans les tentatives WebSearch précédentes était réel.
    r: getInstrumentReturnValues('IE00B4WXJJ64'),
    desc: [
      "prête de l'argent aux États de la zone euro (France, Allemagne...) contre un intérêt régulier.",
      "sensible aux taux d'intérêt : quand la BCE relève ses taux, ce type d'ETF encaisse (2022 en est l'exemple).",
      "le contraire d'un actif spectaculaire : de la dette publique européenne, jugée très sûre.",
    ],
  },
  {
    id: "oblig_corp_ig", name: getInstrumentName("IE00B3F81R35", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "IE00B3F81R35",
    // 2020/2021/2023/2024/2025 CORRIGÉS le 30/08/2026 : 2 tentatives WebSearch précédentes
    // avaient échoué sur ce même fonds (domaine bloqué, ou une séquence de 4 rendements réels —
    // 4,64% / 2,29% / -1,41% / 6,14% — mais étiquetée avec deux jeux d'années incompatibles selon
    // la requête). Résolu via une capture d'écran du fact sheet officiel iShares fournie
    // directement par l'utilisateur (iShares Core € Corp Bond UCITS ETF, EUR Distributing,
    // iShares III plc — tableau "Calendar year performance", part Share Class, consultée le
    // 30/08/2026), qui donne l'année 2022 à -13,86% — identique à l'ancrage déjà vérifié,
    // confirmant le bon fonds. Cette même capture montre que les 4 valeurs trouvées précédemment
    // (4,64% / 2,29% / -1,41% / 6,14%) étaient en fait les années 2016/2017/2018/2019 — jamais
    // 2021-2025 comme le suggéraient les deux recherches — ce qui confirme rétroactivement le
    // problème d'alignement calendaire déjà suspecté. Valeurs des autres années tirées du même
    // tableau : 2020 +2,53%, 2021 -1,15%, 2023 +8,04%, 2024 +4,58%, 2025 +3,13%. Répliquées à
    // l'identique sur les jumeaux Amundi/Vanguard/SPDR (même sous-jacent, cf. CORPBOND_OPTIONS
    // dans theses.js).
    r: getInstrumentReturnValues('IE00B3F81R35'),
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_hy", name: getInstrumentName("IE00B66F4759", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "IE00B66F4759",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/uk/individual/en/products/251843/
    // Rendements NAV annuels EUR, revenus réinvestis, part IE00B66F4759 :
    // https://www.ishares.com/uk/individual/en/products/251843/
    r: getInstrumentReturnValues('IE00B66F4759'),
    desc: [
      "des obligations d'entreprises plus fragiles, donc mieux rémunérées : plus de coupon.",
      "le compartiment obligataire le plus généreux en revenu, avec un vrai risque de crédit en face.",
      "verse un coupon nettement supérieur aux obligations d'État, contre un peu plus de risque.",
    ],
  },

  {
    id: "oblig_inflation", name: getInstrumentName("IE00B0M62X26", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "IE00B0M62X26",
    // 2022 (-9,73%) CORRIGÉ le 30/08/2026 (audit web) puis 2020/2021/2023/2024/2025 CORRIGÉS le
    // même jour (capture d'écran) : la fiche officielle BlackRock/iShares (IBCI, EUR
    // Accumulating, iShares plc — tableau "Calendar year performance", part Share Class, capture
    // fournie par l'utilisateur) confirme 2022 à l'identique (-9,73%), validant définitivement le
    // bon fonds après la contradiction signalée lors de l'audit du 25/08/2026 (une autre recherche
    // avait renvoyé +1,20%, probable confusion avec un fonds au nom proche type "Global Inflation
    // Linked" — écarté). Valeurs des autres années tirées du même tableau : 2020 +2,87%, 2021
    // +6,08%, 2023 +5,87%, 2024 -0,04%, 2025 +0,83%.
    r: getInstrumentReturnValues('IE00B0M62X26'),
    desc: [
      "des obligations d'État dont le capital et le coupon sont indexés sur l'inflation de la zone euro.",
      "protège le pouvoir d'achat du capital investi, contrairement à une obligation classique à taux fixe.",
      "a tout de même chuté en 2022 : la hausse des taux réels a pesé plus lourd que la protection inflation.",
    ],
  },

  // ── 🟢 Actions développées ─────────────────────────────
  {
    id: "msci_world", name: getInstrumentName("LU1681043599", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "LU1681043599",
    // Source : fiche officielle Amundi du fonds LU1681043599 au 31/08/2026, tableau
    // "Calendar year performance / Portfolio" en EUR, net des frais du fonds. La ligne
    // "Benchmark" est distincte (2025 : 6,77 % contre 6,39 % pour le fonds).
    r: getInstrumentReturnValues('LU1681043599'),
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "sp500", name: getInstrumentName("FR0011871128", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "FR0011871128",
    // Contrôle individuel le 24/09/2026 : ISIN, devise EUR et six rendements 2020-2025
    // recoupés avec la fiche émetteur ci-dessous. Confiance : élevée (fonds, pas indice).
    // Rendements calendaires du fonds en EUR, ligne « Portefeuille » de la fiche Amundi
    // (30/06/2026), pour chacune des années 2020-2025 :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871128/FRA/FRA/RETAIL/ETF/20260630
    r: getInstrumentReturnValues('FR0011871128'),
    desc: [
      "les 500 plus grandes entreprises cotées aux États-Unis, tirées par la tech ces dernières années.",
      "l'indice le plus suivi au monde, souvent utilisé comme référence absolue de performance.",
      "un pari implicite sur la capacité des entreprises américaines à rester leaders mondiaux.",
    ],
  },
  {
    // Jumeau strict de "sp500" — même indice S&P 500, fonds vérifié réel (ISIN IE00B5BMR087,
    // ticker CSPX, l'un des plus gros ETF actions d'Europe). Part USD (non-PEA), contrairement à
    // sp500 qui est la version PEA d'Amundi : leurs performances propres diffèrent.
    id: "sp500_ishares", name: getInstrumentName("IE00B5BMR087", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B5BMR087",
    // Contrôle individuel le 24/09/2026 : ISIN, devise USD et six années 2020-2025
    // recoupés avec la fiche émetteur ci-dessous. Confiance : élevée.
    // NAV calendaire de la part iShares en USD, dividendes réinvestis :
    // https://www.ishares.com/gls-download/literature/fact-sheet/cspx-ishares-core-s-p-500-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B5BMR087'),
    confidenceNote: 'Rendements officiels de la part iShares en dollars ; ils ne sont pas directement comparables aux rendements en euros de la part Amundi PEA.',
    desc: [
      "les 500 plus grandes entreprises cotées aux États-Unis, tirées par la tech ces dernières années.",
      "l'indice le plus suivi au monde, souvent utilisé comme référence absolue de performance.",
      "un pari implicite sur la capacité des entreprises américaines à rester leaders mondiaux.",
    ],
  },
  {
    id: "nasdaq100", name: getInstrumentName("FR0011871110", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "FR0011871110",
    // Contrôle individuel le 24/09/2026 : ISIN, devise EUR et six années 2020-2025
    // recoupés avec la fiche émetteur ci-dessous. Confiance : élevée.
    // Rendements calendaires de la part Amundi en EUR, ligne « Portefeuille » :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/RETAIL/ETF
    r: getInstrumentReturnValues('FR0011871110'),
    desc: [
      "les 100 plus grandes entreprises non financières du Nasdaq : très orienté technologie.",
      "concentré sur des géants comme Apple, Microsoft ou Nvidia : un pari sur l'innovation US.",
      "un des supports les plus volatils parmi les grands indices actions.",
    ],
  },
  {
    // Part iShares USD distincte : rendements calendaires de cette part en dollars publiés
    // par BlackRock, pas ceux de la part Amundi en euros. Une cotation en EUR ne change pas
    // la devise dans laquelle BlackRock calcule sa série de performance :
    // https://www.blackrock.com/fr/particuliers/products/253741/ishares-nasdaq-100-ucits-etf
    id: "nasdaq100_ishares", name: getInstrumentName("IE00B53SZB19", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B53SZB19",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.blackrock.com/fr/intermediaries/products/253741/ishares-nasdaq-100-ucits-etf
    r: getInstrumentReturnValues('IE00B53SZB19'),
    confidenceNote: "Rendements officiels de la part iShares en dollars ; dans une simulation de portefeuille en euros, l'effet de change n'est pas neutralisé.",
    desc: [
      "les 100 plus grandes entreprises non financières du Nasdaq : très orienté technologie.",
      "concentré sur des géants comme Apple, Microsoft ou Nvidia : un pari sur l'innovation US.",
      "un des supports les plus volatils parmi les grands indices actions.",
    ],
  },
  {
    // ETF à levier (réplication synthétique 2x quotidien du Nasdaq-100, pas annuel — l'effet de
    // capitalisation quotidienne fait dériver la performance longue durée d'un simple ×2 du
    // sous-jacent, à la hausse comme à la baisse). ISIN FR0010342592, ticker LQQ, TER 0,60%,
    // domicilié France, éligible PEA (non éligible PEA-PME). Source des rendements annuels :
    // NAV du fonds EUR, ligne « Portefeuille », années calendaires 2020-2025 :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010342592/FRA/FRA/RETAIL/ETF/20260331
    // Le levier se réinitialise chaque jour ; la performance annuelle n'est pas 2x celle de l'indice.
    id: "lqq", name: getInstrumentName("FR0010342592", "portfolio"), cat: "actions_larges", emoji: "⚡",
    isin: "FR0010342592",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010342592/FRA/FRA/RETAIL/ETF/20260831
    r: getInstrumentReturnValues('FR0010342592'),
    desc: [
      "vise 2 fois la performance quotidienne du Nasdaq-100, financée par swap.",
      "un des supports les plus volatils de la bibliothèque : a perdu plus de la moitié de sa valeur en 2022 (-57,69 %).",
      "la capitalisation quotidienne du levier fait dériver la performance longue durée d'un simple x2 du Nasdaq-100 — jamais une martingale.",
    ],
  },
  {
    // Deuxième ETF à levier de la bibliothèque, aux côtés de "lqq" (cf. LEVERAGE_OPTIONS dans
    // theses.js) : même mécanique (réplication synthétique 2x quotidien, pas annuel), mais sur un
    // sous-jacent plus large que le seul Nasdaq-100 (large et mid caps US, moins concentré tech) —
    // apporte de la variété sans dupliquer le même pari. ISIN FR0010755611, ticker CL2, TER 0,50%,
    // domicilié France, éligible PEA (confirmé), lancé le 16/06/2009. Source des rendements
    // annuels : NAV « Portefeuille » en EUR, fiche officielle Amundi 2025 :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010755611/FRA/FRA/INSTITUTIONNEL/ETF/20251231
    id: "cl2", name: getInstrumentName("FR0010755611", "portfolio"), cat: "actions_larges", emoji: "⚡",
    isin: "FR0010755611",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010755611/FRA/FRA/INSTITUTIONNEL/ETF/20260831
    r: getInstrumentReturnValues('FR0010755611'),
    desc: [
      "vise 2 fois la performance quotidienne du MSCI USA (large et mid caps américaines), financée par swap.",
      "moins concentré sur la tech que le levier Nasdaq-100, mais tout aussi volatil (-31% en 2022).",
      "la capitalisation quotidienne du levier fait dériver la performance longue durée d'un simple x2 du MSCI USA — jamais une martingale.",
    ],
  },
  {
    id: "cac40", name: getInstrumentName("FR0013380607", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "FR0013380607",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013380607/FRA/FRA/RETAIL/ETF
    // Rendements calendaires de la part Amundi en EUR, ligne « Portefeuille » (2020-2025),
    // distincts du CAC 40 Gross Total Return suivi par le fonds :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013380607/FRA/FRA/RETAIL/ETF
    r: getInstrumentReturnValues('FR0013380607'),
    desc: [
      "les 40 plus grosses capitalisations françaises, de LVMH à TotalEnergies en passant par L'Oréal.",
      "éligible au PEA, avec une fiscalité avantageuse après 5 ans de détention en France.",
      "un classique du portefeuille « patriote » des investisseurs particuliers français.",
    ],
  },
  {
    id: "eurostoxx50", name: getInstrumentName("LU1681047236", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "LU1681047236",
    // Rendements calendaires du fonds en EUR, ligne « Portefeuille » de la fiche Amundi
    // (31/08/2026) : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/FRA/FRA/INSTITUTIONNEL/ETF
    r: getInstrumentReturnValues('LU1681047236'),
    desc: [
      "les 50 plus grandes entreprises de la zone euro, dont LVMH, TotalEnergies ou SAP.",
      "souvent éligible au PEA, ce qui en fait un classique pour les investisseurs français.",
      "un bon indicateur de la santé économique de la zone euro dans son ensemble.",
    ],
  },
  {
    // Part iShares distincte : rendements calendaires propres au fonds en EUR, ligne
    // « Share Class » de la fiche BlackRock (31/08/2026), et non ceux du fonds Amundi :
    // https://www.ishares.com/gls-download/literature/fact-sheet/cssx5e-ishares-core-euro-stoxx-50-ucits-etf-fund-fact-sheet-en-gb.pdf
    id: "eurostoxx50_ishares", name: getInstrumentName("IE00B53L3W79", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B53L3W79",
    r: getInstrumentReturnValues('IE00B53L3W79'),
    desc: [
      "les 50 plus grandes entreprises de la zone euro, dont LVMH, TotalEnergies ou SAP.",
      "souvent éligible au PEA, ce qui en fait un classique pour les investisseurs français.",
      "un bon indicateur de la santé économique de la zone euro dans son ensemble.",
    ],
  },
  {
    id: "msci_europe", name: getInstrumentName("IE00B4K48X80", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B4K48X80",
    // Contrôle individuel le 24/09/2026 : ISIN, devise EUR et six années 2020-2025
    // recoupés avec la fiche émetteur ci-dessous. Confiance : élevée.
    // Fiche BlackRock SMEA, ligne Share Class EUR (Acc), 2020-2025.
    // https://www.ishares.com/gls-download/literature/fact-sheet/smea-ishares-core-msci-europe-ucits-etf-eur-acc-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B4K48X80'),
    desc: [
      "une exposition large aux grandes entreprises européennes, au-delà de la seule zone euro.",
      "inclut le Royaume-Uni et la Suisse en plus de la zone euro : diversification géographique intéressante.",
      "un bon complément pour ne pas dépendre uniquement des marchés américains.",
    ],
  },
  {
    id: "sect_sante", name: getInstrumentName("IE00B43HR379", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B43HR379",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/uk/individual/en/products/280507/
    // Rendements NAV calendaires USD, revenus réinvestis :
    // https://www.ishares.com/uk/individual/en/products/280507/
    r: getInstrumentReturnValues('IE00B43HR379'),
    confidenceNote: 'Rendements du fonds publiés en dollars ; les résultats en euros dépendent du change EUR/USD.',
    desc: [
      "laboratoires pharmaceutiques et biotech : un secteur réputé plus défensif.",
      "moins corrélé aux cycles économiques classiques, mais sensible aux décisions réglementaires.",
      "traverse généralement mieux les crises boursières que les secteurs cycliques.",
    ],
  },

  // ── 🟤 Actions émergentes ──────────────────────────────
  {
    id: "msci_em", name: getInstrumentName("IE00BKM4GZ66", "portfolio"), cat: "emergents", emoji: "🟤",
    isin: "IE00BKM4GZ66",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/de/privatanleger/de/literature/fact-sheet/eimi-ishares-core-msci-em-imi-ucits-etf-fund-fact-sheet-de-de.pdf
    // Fiche BlackRock EIMI, ligne Share Class USD (Acc), 2020-2025.
    // https://www.ishares.com/de/privatanleger/de/literature/fact-sheet/eimi-ishares-core-msci-em-imi-ucits-etf-fund-fact-sheet-de-de.pdf
    r: getInstrumentReturnValues('IE00BKM4GZ66'),
    confidenceNote: "Rendements officiels de la part iShares en dollars, nets de frais ; le résultat d'un investisseur en euros peut différer selon le change.",
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },

  // ── 🟡 Or ───────────────────────────────────────────────
  {
    id: "or", name: getInstrumentName("IE00B579F325", "portfolio"), cat: "matieres_premieres", emoji: "🟡",
    isin: "IE00B579F325",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE00B579F325_factsheet_en.pdf
    // Invesco, performance calendaire du Certificate Value (CV) nette des frais fixes, USD.
    // https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE00B579F325_factsheet_en.pdf
    r: getInstrumentReturnValues('IE00B579F325'),
    confidenceNote: "Rendements officiels de cet ETC Invesco en dollars, nets des frais fixes ; une cotation en euros donne un résultat différent selon le change.",
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu ; son cours peut monter quand les actions baissent, sans que ce soit automatique.",
      "une exposition différente des actions, dont le prix reste lui aussi volatil.",
    ],
  },

  // ── 🛢️ Autres matières premières ───────────────────────
  {
    id: "argent", name: getInstrumentName("IE00B4NCWG09", "portfolio"), cat: "matieres_premieres", emoji: "🛢️",
    isin: "IE00B4NCWG09",
    // Contrôle individuel du proxy le 24/09/2026 : rendements USD iShares et conversion EUR indicative, 2020-2025 ; calcul non publié par l’émetteur. Confiance : proxy documenté, pas rendement du produit affiché.
    // Sources : https://www.ishares.com/uk/individual/en/products/258443/ et https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2025/12/20251231.pdf
    // Estimation EUR du rendement annuel de CET ETC (et non du cours spot ni des futures) :
    // BlackRock publie en USD 2020-2025 : +46,2/-13,0/+3,5/-0,8/+21,3/+148,6 %.
    // https://www.ishares.com/uk/individual/en/products/258443/
    // Conversion sans couverture : (1 + rendement USD) × (EUR/USD fin année précédente)
    // / (EUR/USD fin année courante) - 1. Taux de référence BCE des derniers jours ouvrés :
    // 2019 1,1234 ; 2020 1,2271 ; 2021 1,1326 ; 2022 1,0666 ; 2023 1,1050 ;
    // 2024 1,0389 ; 2025 1,1750. Les rendements BlackRock sont arrondis au dixième et les
    // taux BCE relevés en journée : résultat indicatif, pas performance publiée en EUR du fonds.
    // https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2025/12/20251231.pdf
    r: getInstrumentReturnValues('IE00B4NCWG09'),
    confidenceNote: "Rendements annuels de l'ETC publiés en dollars par BlackRock, convertis approximativement en euros avec les taux de fin d'année de la BCE. Ce ne sont pas des rendements officiels en euros.",
    desc: [
      "souvent surnommé « l'or du pauvre », plus volatil que l'or car aussi utilisé dans l'industrie.",
      "profite à la fois de la demande refuge et de la demande industrielle.",
      "un actif plus spéculatif que l'or, avec des variations plus marquées dans les deux sens.",
    ],
  },
  {
    id: "mp_large", name: getInstrumentName("IE00BD6FTQ80", "portfolio"), cat: "matieres_premieres", emoji: "🛢️",
    isin: "IE00BD6FTQ80",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.invesco.com/content/dam/invesco/uk/en/product-documents/etf/share-class/factsheet/IE00BD6FTQ80_factsheet_en-uk.pdf
    // Source : fiche officielle Invesco, NAV en USD, revenus réinvestis (2020-2025) :
    // https://www.invesco.com/content/dam/invesco/uk/en/product-documents/etf/share-class/factsheet/IE00BD6FTQ80_factsheet_en-uk.pdf
    r: getInstrumentReturnValues('IE00BD6FTQ80'),
    confidenceNote: 'Rendements NAV Invesco publiés en dollars ; leur équivalent en euros varie avec le change.',
    desc: [
      "un panier diversifié : énergie, métaux, agriculture réunis en une seule ligne.",
      "réputé pour bien se comporter en période d'inflation élevée, comme en 2021-2022.",
      "peu corrélé aux actions et obligations, un bon outil de diversification globale.",
    ],
  },
  {
    // Jumeau strict de "mp_large" — vérifié réel (ISIN IE00BDFL4P12, ticker ICOM) : réplique
    // bien l'indice Bloomberg Commodity, confirmé via la fiche produit iShares.
    id: "mp_large_icom", name: getInstrumentName("IE00BDFL4P12", "portfolio"), cat: "matieres_premieres", emoji: "🛢️",
    isin: "IE00BDFL4P12",
    // Contrôle individuel le 24/09/2026 : ISIN, devise USD et six années 2020-2025
    // recoupés avec la fiche émetteur ci-dessous. Confiance : élevée.
    // NAV annuelle de la part ICOM en USD, revenus réinvestis :
    // https://www.ishares.com/gls-download/literature/fact-sheet/icom-ishares-diversified-commodity-swap-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00BDFL4P12'),
    confidenceNote: 'Rendements de la part iShares en dollars ; leur équivalent en euros dépend du change.',
    desc: [
      "un panier diversifié : énergie, métaux, agriculture réunis en une seule ligne.",
      "réputé pour bien se comporter en période d'inflation élevée, comme en 2021-2022.",
      "peu corrélé aux actions et obligations, un bon outil de diversification globale.",
    ],
  },
  // ── 🟠 Crypto ───────────────────────────────────────────
  {
    id: "bitcoin", name: getInstrumentName("GB00BLD4ZL17", "portfolio"), cat: "crypto", emoji: "🟠",
    isin: "GB00BLD4ZL17",
    // Contrôle individuel du proxy le 24/09/2026 : cours spot BTC/USD, 2020-2025 ; ce ne sont pas les rendements de l’ETP CoinShares. Confiance : proxy documenté, pas rendement du produit affiché.
    // Sources : https://www.slickcharts.com/currency/BTC/returns et https://investor.coinshares.com/pressreleases/coinshares-lists-physically-backed-crypto-etps-on-euronext-paris-amsterdam
    // Rendements BTC/USD publiés par Slickcharts, 2020-2025 : variation entre les
    // clôtures annuelles successives, même convention pour toutes les années.
    // https://www.slickcharts.com/currency/BTC/returns
    // Le fournisseur ne précise pas l'heure de clôture dans ce tableau ; la valeur
    // peut différer d'un cours figé à minuit UTC. 2020 précède l'ETP CoinShares :
    // 2020 est un proxy spot antérieur au lancement de l'ETP, signalé dans l'interface.
    // Même proxy pour les ETP WisdomTree, Bitwise et 21Shares.
    r: getInstrumentReturnValues('GB00BLD4ZL17'),
    confidenceNote: "Simulation sur le cours spot BTC/USD (Slickcharts), avant frais et change ; 2020 précède le lancement de l'ETP CoinShares et n'est pas sa performance.",
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "ethereum", name: getInstrumentName("GB00BLD4ZM24", "portfolio"), cat: "crypto", emoji: "🟠",
    isin: "GB00BLD4ZM24",
    // Rendements ETH/USD publiés par Slickcharts, 2020-2025 : variation entre les
    // clôtures annuelles successives, selon la même convention que le proxy BTC.
    // https://www.slickcharts.com/currency/ETH/returns
    // Cours spot uniquement : ne capte pas le staking de l'ETP CoinShares. 2020
    // précède son lancement en février 2021 et ne constitue pas son rendement.
    // Vérifié le 25/09/2026 : les six rendements 2020-2025 et la convention de
    // clôture annuelle correspondent au tableau Slickcharts ; l'émetteur CoinShares
    // (https://coinshares.com/uk/etp/physical-ethereum/) confirme l'ISIN, le staking
    // et le lancement le 23/02/2021. Confiance élevée pour le proxy spot USD,
    // pas d'attribution de ces rendements à l'ETP lui-même.
    r: getInstrumentReturnValues('GB00BLD4ZM24'),
    confidenceNote: "Simulation sur le cours spot ETH/USD (Slickcharts), sans staking, frais ni change ; 2020 précède le lancement de l'ETP CoinShares et n'est pas sa performance.",
    desc: [
      "la deuxième plus grande cryptomonnaie, socle de nombreuses applications décentralisées.",
      "encore plus volatil que le bitcoin sur certaines périodes, avec des cycles très marqués.",
      "un actif spéculatif à forte amplitude, à réserver à une poche satellite du portefeuille.",
    ],
  },

  // ── ⚪ Immobilier ────────────────────────────────────────
  // Sources ASPIM vérifiées le 24/09/2026 ; revoir lors de la publication du millésime 2026.
  {
    id: "scpi", name: "SCPI (rendement générique)", cat: "immobilier", emoji: "⚪",
    // ASPIM/IEIF : 2021-2025 = rendement global immobilier (RGI), taux de distribution
    // + variation de la valeur de réalisation ; 2020 = ancienne performance globale
    // (TDVM 4,18 % + variation moyenne du prix de part 1,12 %), méthode non identique.
    // 2022 : 2,1 % ASPIM, 2023 : -5,78 %, 2024 : -1,1 %, 2025 : +3,1 % RGI.
    // La PGA 2025 (+1,5 %) dépend du prix de part et n'est PAS le RGI.
    r: [5.30, 5.85, 2.1, -5.78, -1.1, 3.1],
    confidenceNote: "Moyenne du marché SCPI : rendement global immobilier ASPIM (loyers + variation de la valeur du patrimoine) de 2021 à 2025. L'année 2020 suit l'ancienne méthode ; ces chiffres ne sont ni le revenu distribué ni le résultat d'une vente de parts, et les frais d'achat varient.",
    desc: [
      "de l'immobilier locatif mutualisé (bureaux, commerces...), avec un rendement historiquement régulier.",
      "a traversé une période difficile en 2023-2024 avec la baisse de valorisation du parc immobilier.",
      "un support prisé en assurance-vie ou en direct pour générer des revenus complémentaires.",
    ],
  },
  {
    id: "foncieres_etf", name: getInstrumentName("LU1437018838", "portfolio"), cat: "immobilier", emoji: "⚪",
    isin: "LU1437018838",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025 ; part C de la fiche commune C/D. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20251231
    distributing: false,
    // Performances calendaires « Portefeuille » de la fiche Amundi au 31/12/2025,
    // part (C) LU1437018838, en euros, revenu réinvesti :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20251231
    r: getInstrumentReturnValues('LU1437018838'),
    confidenceNote: 'Rendements du fonds Amundi en euros, dividendes réinvestis ; le prix de marché peut différer de la valeur liquidative.',
    desc: [
      "des sociétés immobilières cotées en Bourse : bureaux, entrepôts, commerces, logistique.",
      "beaucoup plus liquide que la pierre-papier classique, mais aussi plus volatil.",
      "distribue généralement une grande partie de ses revenus sous forme de dividendes.",
    ],
  },
  {
    // Jumeau distribuant de "foncieres_etf" (part Dist, vérifiée réelle, réservée au profil
    // Rentier — cf. DIST_TWINS et Rentier dans theses.js) : même sous-jacent (FTSE EPRA Nareit
    // Global Developed), seule la politique de distribution change.
    id: "foncieres_etf_dist", name: getInstrumentName("LU1737652823", "portfolio"), cat: "immobilier", emoji: "⚪",
    isin: "LU1737652823",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025 ; part D de la fiche commune C/D. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20251231
    distributing: true,
    // Fiche Amundi commune aux parts C et D : tableau « Portefeuille » revenu réinvesti.
    // Référence part D : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1737652823/ENG/FRA/INSTITUTIONNEL/ETF/20251231
    r: getInstrumentReturnValues('LU1737652823'),
    confidenceNote: 'Rendements du fonds Amundi en euros, dividendes réinvestis ; la part distribuante verse ses revenus séparément.',
    desc: [
      "des sociétés immobilières cotées en Bourse : bureaux, entrepôts, commerces, logistique.",
      "beaucoup plus liquide que la pierre-papier classique, mais aussi plus volatil.",
      "distribue généralement une grande partie de ses revenus sous forme de dividendes.",
    ],
  },

  // ── 🟣 Dividendes ────────────────────────────────────────
  {
    id: "strat_dividendes", name: getInstrumentName("IE00B9CQXS71", "portfolio"), cat: "dividendes", emoji: "🟣",
    // ISIN ajouté le 13/09/2026 (audit "ISIN pour chaque ETF") : IE00B9CQXS71 est en réalité la
    // SEULE part existante de ce fonds — recherche dédiée d'une part Acc distincte infructueuse
    // (justETF/SSGA ne référencent qu'une part, distribuante trimestrielle). "strat_dividendes"
    // est lui aussi distribuant : les deux ids sont des alias du MÊME fonds pour les profils
    // de portefeuille, pas deux parts Acc et Dist distinctes.
    isin: "IE00B9CQXS71",
    distributing: true,
    // Référence part Dist : https://www.ssga.com/library-content/products/fund-docs/etfs/emea/kid-supplement/PRIIPS%20Performance%20file_IE00B9CQXS71.pdf
    // Source : State Street, tableau "Fund Net" au 31/08/2026 (rendements calendaires USD
    // dividendes réinvestis, nets de frais). La série antérieure mélangeait plusieurs lignes
    // du tableau et divergeait de 0,20 à 0,53 point du rendement net du fonds.
    r: getInstrumentReturnValues('IE00B9CQXS71'),
    confidenceNote: 'Rendements nets du fonds publiés en dollars, dividendes réinvestis ; leur valeur en euros peut différer.',
    desc: [
      "des entreprises qui versent (et augmentent) leur dividende depuis des années : profil plutôt défensif.",
      "recherché pour générer un revenu régulier en plus de la performance en capital.",
      "a tendance à mieux résister lors des phases de baisse des marchés.",
    ],
  },
  {
    // Alias du même fonds SPDR distribuant, réservé au profil Rentier.
    id: "strat_dividendes_dist", name: getInstrumentName("IE00B9CQXS71", "portfolio", "strat_dividendes_dist"), cat: "dividendes", emoji: "🟣",
    isin: "IE00B9CQXS71",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ssga.com/lu/fr/intermediary/etfs/state-street-spdr-sp-global-dividend-aristocrats-ucits-etf-dist-zprg-gy
    distributing: true,
    // Même part et même série que strat_dividendes : https://www.ssga.com/library-content/products/fund-docs/etfs/emea/kid-supplement/PRIIPS%20Performance%20file_IE00B9CQXS71.pdf
    r: getInstrumentReturnValues('IE00B9CQXS71'),
    confidenceNote: 'Rendements nets du fonds publiés en dollars, dividendes réinvestis ; leur valeur en euros peut différer.',
    desc: [
      "des entreprises qui versent (et augmentent) leur dividende depuis des années : profil plutôt défensif.",
      "recherché pour générer un revenu régulier en plus de la performance en capital.",
      "a tendance à mieux résister lors des phases de baisse des marchés.",
    ],
  },
  {
    id: "high_dividend", name: getInstrumentName("IE00BK5BR626", "portfolio"), cat: "dividendes", emoji: "🟣",
    isin: "IE00BK5BR626",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025 ; fiche arrondie à 0,1 point. Confiance : élevée à cette précision ; les décimales supplémentaires restent indicatives.
    // Source primaire : https://www.vanguard.co.uk/professional/product/etf/equity/9677/ftse-all-world-high-dividend-yield-ucits%20-etf-usd-accumulating
    distributing: false,
    // Référence part Acc : https://www.vanguard.co.uk/professional/product/etf/equity/9677/ftse-all-world-high-dividend-yield-ucits%20-etf-usd-accumulating
    // Source : performance annuelle calendaire réelle du fonds (nette de frais), fiches
    // Vanguard, années 2020-2025. NB : ce fonds existe bien en version Acc (ISIN IE00BK5BR626)
    // ET Dist (IE00B8GKDB10) — contrairement à une hypothèse initiale qui le pensait Dist-only.
    r: getInstrumentReturnValues('IE00BK5BR626'),
    confidenceNote: 'Rendements Vanguard en dollars, revenus réinvestis ; le change peut modifier la performance en euros.',
    desc: [
      "sélectionne les entreprises mondiales au rendement de dividende le plus élevé.",
      "plus large et plus « value » que les aristocrates du dividende, avec un couponnage souvent supérieur.",
      "profite des secteurs traditionnellement généreux en dividendes : énergie, finance, télécoms.",
    ],
  },
  {
    // Jumeau distribuant de "high_dividend" (part Dist, ISIN IE00B8GKDB10, vérifiée réelle),
    // réservé au profil Rentier.
    id: "high_dividend_dist", name: getInstrumentName("IE00B8GKDB10", "portfolio"), cat: "dividendes", emoji: "🟣",
    isin: "IE00B8GKDB10",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025 ; fiche arrondie à 0,1 point. Confiance : élevée à cette précision ; les décimales supplémentaires restent indicatives.
    // Source primaire : https://www.vanguard.co.uk/professional/product/etf/equity/9506/ftse-all-world-high-dividend-yield-ucits-etf-usd-distributing
    distributing: true,
    // Référence part Dist : https://www.vanguard.co.uk/professional/product/etf/equity/9506/ftse-all-world-high-dividend-yield-ucits-etf-usd-distributing
    r: getInstrumentReturnValues('IE00B8GKDB10'),
    confidenceNote: 'Rendements Vanguard en dollars, revenus réinvestis ; le change peut modifier la performance en euros.',
    desc: [
      "sélectionne les entreprises mondiales au rendement de dividende le plus élevé.",
      "plus large et plus « value » que les aristocrates du dividende, avec un couponnage souvent supérieur.",
      "profite des secteurs traditionnellement généreux en dividendes : énergie, finance, télécoms.",
    ],
  },
  {
    id: "quality_dividend", name: getInstrumentName("IE00BKPSFC54", "portfolio"), cat: "dividendes", emoji: "🟣",
    isin: "IE00BKPSFC54",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2021-2025 seulement ; 2020 emprunté à la part Dist. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/wqda-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf
    distributing: false,
    // Rendements NAV USD de la part Acc : benchmark modifié le 1er juin 2022.
    // Part Acc lancée en mai 2020 : 2020 reprend le rendement de la part Dist
    // du même fonds, publié par BlackRock ; objectif/indice modifié en juin 2022.
    // https://www.ishares.com/gls-download/literature/fact-sheet/wqda-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00BKPSFC54'),
    confidenceNote: 'Rendements NAV en dollars ; 2020 provient de la part distribuante du même fonds (part Acc lancée en mai 2020). Indice modifié en juin 2022.',
    desc: [
      "combine dividende régulier et critères de qualité financière (rentabilité, faible endettement).",
      "vise des entreprises capables de maintenir leur dividende même en période difficile.",
      "un compromis entre le rendement pur et la solidité du bilan des entreprises sélectionnées.",
    ],
  },
  {
    // Part Dist du même fonds, réservée au profil Rentier ; historique propre à cette part.
    id: "quality_dividend_dist", name: getInstrumentName("IE00BYYHSQ67", "portfolio"), cat: "dividendes", emoji: "🟣",
    isin: "IE00BYYHSQ67",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/wqdv-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf
    distributing: true,
    // https://www.ishares.com/gls-download/literature/fact-sheet/wqdv-ishares-msci-world-quality-dividend-advanced-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00BYYHSQ67'),
    confidenceNote: 'Performances NAV publiées en dollars, dividendes réinvestis ; une cotation en euros peut donner un autre résultat.',
    desc: [
      "combine dividende régulier et critères de qualité financière (rentabilité, faible endettement).",
      "vise des entreprises capables de maintenir leur dividende même en période difficile.",
      "un compromis entre le rendement pur et la solidité du bilan des entreprises sélectionnées.",
    ],
  },

  // ── 🟢 Actions développées — styles complémentaires ─────
  {
    id: "or_wisdomtree", name: getInstrumentName("JE00B1VS3770", "portfolio"), cat: "matieres_premieres", emoji: "🟡",
    isin: "JE00B1VS3770",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/MSL/EU/EN-GB/JE00B1VS3770
    // Performance calendaire nette de frais en USD de l'ETC JE00B1VS3770.
    // https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/MSL/EU/EN-GB/JE00B1VS3770
    r: getInstrumentReturnValues('JE00B1VS3770'),
    confidenceNote: "Rendements de cet ETC WisdomTree en dollars, nets de frais ; le résultat en euros dépend du change.",
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu ; son cours peut aussi baisser quand les actions baissent.",
      "une exposition différente des actions, dont le prix reste lui aussi volatil.",
    ],
  },
  {
    id: "or_ishares", name: getInstrumentName("IE00B4ND3602", "portfolio"), cat: "matieres_premieres", emoji: "🟡",
    isin: "IE00B4ND3602",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025 ; fiche arrondie à 0,1 point. Confiance : élevée à cette précision ; les décimales supplémentaires restent indicatives.
    // Source primaire : https://www.ishares.com/uk/individual/en/products/258441/ishares-physical-gold-etc-fund
    // BlackRock SGLN, ligne Total Return USD de l'ISIN IE00B4ND3602.
    // https://www.ishares.com/uk/individual/en/products/258441/ishares-physical-gold-etc-fund
    r: getInstrumentReturnValues('IE00B4ND3602'),
    confidenceNote: "Rendements NAV de cet ETC iShares publiés en dollars ; le change peut modifier le résultat en euros.",
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu ; son cours peut aussi baisser quand les actions baissent.",
      "une exposition différente des actions, dont le prix reste lui aussi volatil.",
    ],
  },
  {
    id: "or_amundi", name: getInstrumentName("FR0013416716", "portfolio"), cat: "matieres_premieres", emoji: "🟡",
    isin: "FR0013416716",
    // Amundi FR0013416716, ligne ETC des années calendaires 2020-2025 en USD.
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013416716/ENG/FRA/INSTITUTIONNEL/AMUNDI
    // Vérifié le 25/09/2026 : tableau "Calendar year performance / ETC" de la
    // fiche Amundi au 31/08/2026, ISIN FR0013416716, devise USD : 2020-2025
    // 23,98 / -3,89 / -0,54 / 13,66 / 26,44 / 64,80 %. Confiance élevée.
    r: getInstrumentReturnValues('FR0013416716'),
    confidenceNote: "Rendements de cet ETC Amundi publiés en dollars, nets de frais ; le change peut modifier le résultat en euros.",
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu ; son cours peut aussi baisser quand les actions baissent.",
      "une exposition différente des actions, dont le prix reste lui aussi volatil.",
    ],
  },
  // Source émetteur vérifiée le 24/09/2026.
  {
    id: "bitcoin_wisdomtree", name: getInstrumentName("GB00BJYDH287", "portfolio"), cat: "crypto", emoji: "🟠",
    isin: "GB00BJYDH287",
    // NAV calendaire nette des frais du produit GB00BJYDH287, en USD.
    // https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/WIXL/EU/EN-GB/GB00BJYDH287
    r: getInstrumentReturnValues('GB00BJYDH287'),
    confidenceNote: "Rendements de cet ETP WisdomTree en dollars, nets de frais ; le résultat en euros dépend du change.",
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  // Source émetteur vérifiée le 24/09/2026.
  {
    id: "bitcoin_etcgroup", name: getInstrumentName("DE000A27Z304", "portfolio"), cat: "crypto", emoji: "🟠",
    isin: "DE000A27Z304",
    // NAV USD publiée par Bitwise ; 2020 commence au lancement du 08/06/2020
    // et ne représente pas une année calendaire complète.
    // https://bitwiseinvestments.eu/de/products/bitwise-physical-bitcoin-etp/
    r: getInstrumentReturnValues('DE000A27Z304'),
    confidenceNote: "2020 : cours spot BTC/USD, pas la performance de l'ETP lancé en juin ; 2021-2025 : NAV Bitwise USD nette de frais. Change EUR exclu.",
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "bitcoin_21shares", name: getInstrumentName("CH0454664001", "portfolio"), cat: "crypto", emoji: "🟠",
    isin: "CH0454664001",
    // Contrôle individuel du proxy le 24/09/2026 : cours spot BTC/USD, 2020-2025 ; les performances officielles de la part diffèrent. Confiance : proxy documenté, pas rendement du produit affiché.
    // Sources : https://www.slickcharts.com/currency/BTC/returns et https://cdn.21shares.com/uploads/current-documents/past-performance/ABTC/CH0454664001_21SharesAG%28FR%29.pdf
    // Jumeau strict de "bitcoin" — même source (cours BTC/USD, cf. commentaire ci-dessus).
    // Référence produit (pas source de la série proxy BTC/USD) : https://www.21shares.com/fr-eu/product/abtc
    r: getInstrumentReturnValues('CH0454664001'),
    confidenceNote: "Simulation sur les clôtures annuelles BTC/USD (Slickcharts), avant les frais de l'ETP 21Shares ; ce ne sont pas ses rendements et l'effet de change en euros n'est pas pris en compte.",
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "oblig_corp_amundi", name: getInstrumentName("LU1931975079", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "LU1931975079",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025 ; part D. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1931975079/FRA/FRA/INSTITUTIONNEL/ETF/20260731
    // Rendements calendaires EUR « Portefeuille » de cette part Amundi :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1931975079/FRA/FRA/INSTITUTIONNEL/ETF/20260331
    r: getInstrumentReturnValues('LU1931975079'),
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_corp_vanguard", name: getInstrumentName("IE00BZ163G84", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "IE00BZ163G84",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025 ; fiche arrondie à 0,1 point. Confiance : élevée à cette précision ; les décimales supplémentaires restent indicatives.
    // Source primaire : https://fund-docs.vanguard.com/ie00bz163g84-en.pdf
    // Rendements propres de la part Vanguard (fonds, non indice), publiés au dixième en EUR :
    // https://fund-docs.vanguard.com/ie00bz163g84-en.pdf
    r: getInstrumentReturnValues('IE00BZ163G84'),
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_corp_spdr", name: getInstrumentName("IE00B3T9LM79", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "IE00B3T9LM79",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-bloomberg-euro-corporate-bond-ucits-etf-dist-sybc-gy
    // NAV « Fonds Net » de la part SPDR en EUR, 2020-2025 :
    // https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-bloomberg-euro-corporate-bond-ucits-etf-dist-sybc-gy
    r: getInstrumentReturnValues('IE00B3T9LM79'),
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },

  // ── Variantes "monde" — indices proches mais pas strictement identiques : composition et
  // performance propres à chacun (l'ACWI et le FTSE All-World incluent les émergents).
  {
    id: "msci_world_ishares", name: getInstrumentName("IE00B4L5Y983", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B4L5Y983",
    // Contrôle individuel le 24/09/2026 : ISIN, devise USD et six années 2020-2025
    // recoupés avec la fiche émetteur ci-dessous. Confiance : élevée.
    // BlackRock SWDA, ligne Share Class USD (Acc), 2020-2025.
    // https://www.ishares.com/gls-download/literature/fact-sheet/swda-ishares-core-msci-world-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B4L5Y983'),
    confidenceNote: "Rendements de la part iShares en dollars, nets de frais ; le résultat en euros peut différer selon le change.",
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    // Jumeau strict de "msci_world" — même source. Fonds réel vérifié (Amundi PEA Monde (MSCI
    // World) UCITS ETF, ISIN FR001400U5Q4, lancé le 04/03/2025, ticker DCAM — pas "EWLD" comme
    // suggéré initialement) : les 6 années de la série représentent la performance réelle de
    // l'indice répliqué, le fonds lui-même n'existant que depuis 2025.
    id: "msci_world_amundi_pea", name: getInstrumentName("FR001400U5Q4", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "FR001400U5Q4",
    // Contrôle individuel du proxy le 24/09/2026 : indice MSCI World net EUR, 2020-2025 ; la part Amundi a été lancée en 2025. Confiance : proxy documenté, pas rendement du produit affiché.
    // Sources : https://www.msci.com/resources/factsheets/index_fact_sheet/msci-world-index-eur-net.pdf et https://www.amundietf.fr/pdfDocuments/kid-priips/FR001400U5Q4/FRA/FRA/20260428
    // Référence produit (la série proxy reste MSCI World EUR net) : https://www.amundietf.fr/pdfDocuments/kid-priips/FR001400U5Q4/FRA/FRA/20260428
    // Référence indice : https://www.msci.com/resources/factsheets/index_fact_sheet/msci-world-index-eur-net.pdf
    r: getInstrumentReturnValues('FR001400U5Q4'),
    confidenceNote: "Simulation sur l'indice MSCI World net en euros : cette part Amundi n'existait pas avant 2025 et l'historique n'est pas celui du fonds.",
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "msci_acwi", name: getInstrumentName("IE00B44Z5B48", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B44Z5B48",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ssga.com/ie/en_gb/intermediary/etfs/state-street-spdr-msci-all-country-world-ucits-etf-acc-spyy-gy
    // State Street SPYY, ligne Fund Net, part Acc en USD, 2020-2025.
    // https://www.ssga.com/ie/en_gb/intermediary/etfs/state-street-spdr-msci-all-country-world-ucits-etf-acc-spyy-gy
    r: getInstrumentReturnValues('IE00B44Z5B48'),
    confidenceNote: "Rendements officiels de la part SPDR en dollars, nets de frais ; le change peut modifier la performance en euros.",
    desc: [
      "le MSCI World auquel on ajoute les marchés émergents : une exposition mondiale quasi complète.",
      "une seule ligne pour couvrir l'essentiel de la capitalisation boursière mondiale.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
    ],
  },
  {
    id: "ftse_allworld_vanguard", name: getInstrumentName("IE00BK5BQT80", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00BK5BQT80",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025 ; fiche arrondie à 0,1 point. Confiance : élevée à cette précision ; les décimales supplémentaires restent indicatives.
    // Source primaire : https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf
    // Performance calendaire réelle de la part IE00BK5BQT80, en USD (ligne Fund,
    // arrondie au dixième dans le KIID Vanguard), 2020-2025 :
    // https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf
    r: getInstrumentReturnValues('IE00BK5BQT80'),
    confidenceNote: "Rendements officiels de la part Vanguard en dollars, dividendes réinvestis ; une cotation en euros peut donner un résultat différent. Chiffres arrondis au dixième par Vanguard.",
    desc: [
      "l'équivalent Vanguard du « monde entier en une ligne », émergents compris.",
      "l'un des ETF actions les moins chers du marché, plébiscité pour l'investissement de long terme.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
    ],
  },
  {
    id: "msci_em_amundi", name: getInstrumentName("LU1681045370", "portfolio"), cat: "emergents", emoji: "🟤",
    isin: "LU1681045370",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681045370/FRA/FRA/INSTITUTIONNEL/ETF
    // Rendements calendaires de la part Amundi en EUR, ligne « Portefeuille » (2020-2025) :
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681045370/FRA/FRA/INSTITUTIONNEL/ETF
    r: getInstrumentReturnValues('LU1681045370'),
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  {
    id: "ftse_em_vanguard", name: getInstrumentName("IE00BK5BR733", "portfolio"), cat: "emergents", emoji: "🟤",
    isin: "IE00BK5BR733",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025 ; fiche arrondie à 0,1 point. Confiance : élevée à cette précision ; les décimales supplémentaires restent indicatives.
    // Source primaire : https://www.vanguard.co.uk/professional/product/etf/equity/9678/ftse-emerging-markets-ucits
    // Référence part Acc : https://www.vanguard.co.uk/professional/product/etf/equity/9678/ftse-emerging-markets-ucits
    // Source : performance annuelle réelle du fonds Vanguard FTSE Emerging Markets UCITS ETF
    // (part USD, nette de frais), années 2020-2025 — sciemment différente de "msci_em" : le
    // FTSE Emerging Markets a une composition distincte du MSCI EM (ex. la Corée du Sud, classée
    // « développée » par FTSE, « émergente » par MSCI). Base devise : USD, donnée EUR précise
    // non trouvée de façon fiable — à ne pas comparer terme à terme avec les lignes en EUR.
    r: getInstrumentReturnValues('IE00BK5BR733'),
    confidenceNote: "Rendements de la part Vanguard en dollars ; le résultat d'un portefeuille en euros peut différer selon le change EUR/USD.",
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  {
    id: "msci_em_spdr", name: getInstrumentName("IE00B469F816", "portfolio"), cat: "emergents", emoji: "🟤",
    isin: "IE00B469F816",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-msci-emerging-markets-ucits-etf-spym-gy
    // State Street SPYM, ligne Fonds Net USD, 2020-2025 ; indice MSCI EM standard.
    // https://www.ssga.com/fr/fr/intermediary/etfs/state-street-spdr-msci-emerging-markets-ucits-etf-spym-gy
    r: getInstrumentReturnValues('IE00B469F816'),
    confidenceNote: "Rendements officiels de la part SPDR en dollars, nets de frais ; le change peut modifier la performance en euros.",
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  // ── 🔵 Obligataire — durée courte ────────────────────────
  {
    id: "oblig_etat_eur_short", name: getInstrumentName("IE00B14X4Q57", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "IE00B14X4Q57",
    // Contrôle individuel le 24/09/2026 : part et devise EUR, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/uk/individual/en/literature/fact-sheet/ibgs-ishares-govt-bond-1-3yr-ucits-etf-fund-fact-sheet-en-gb.pdf
    // Rendements calendaires de la part distribuante EUR (2020-2025), ligne « Share Class »
    // de la fiche officielle BlackRock, ISIN IE00B14X4Q57. L'année 2025 est +2,30 %
    // (l'ancien +3,0 % n'avait pas été vérifié) :
    // https://www.ishares.com/uk/individual/en/literature/fact-sheet/ibgs-ishares-govt-bond-1-3yr-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B14X4Q57'),
    desc: [
      "de la dette d'État de la zone euro à très courte échéance : la version la moins sensible aux taux.",
      "sa faible durée l'a protégé d'une bonne partie du choc de taux subi par les obligations longues en 2022.",
      "un quasi-équivalent de trésorerie rémunérée, mais 100% européen.",
    ],
  },

  // ── 🟢 Europe — styles complémentaires ───────────────────
  {
    id: "tech_europe", name: getInstrumentName("IE00BMW42413", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00BMW42413",
    // 2021/2022/2023/2024/2025 CORRIGÉS le 30/08/2026 : d'abord 2022 (-28,76%) et 2023 (+35,04%)
    // via deux sources web convergentes (fiche indice MSCI + fiche fonds), puis 2021 (+36,57%),
    // 2024 (+7,93%) et 2025 (+9,64%) confirmés via une capture d'écran du fact sheet officiel
    // iShares fournie directement par l'utilisateur (iShares MSCI Europe Information Technology
    // Sector UCITS ETF, EUR Accumulating, iShares VI plc — tableau "Calendar year performance",
    // part Share Class, consultée le 30/08/2026), qui reprend à l'identique les valeurs 2022/2023
    // déjà en place et tranche la contradiction précédente sur 2024 (7,93% confirmé côté fonds,
    // contre 12,53% trouvé pour un indice proche mais visiblement pas exactement celui répliqué
    // par ce fonds — écarté). 2020 reste NON VÉRIFIÉ : le tableau du fact sheet lui-même démarre
    // en 2021 (fonds lancé le 18/11/2020). Pour 2020, indice MSCI Europe IT 20/35
    // Capped net EUR +11,61 % : https://www.msci.com/documents/10199/255599/msci-europe-it-2035-capped-index-eur-net.pdf
    r: getInstrumentReturnValues('IE00BMW42413'),
    confidenceNote: "2020 : indice MSCI Europe Information Technology 20/35 Capped net EUR avant l'année complète du fonds ; 2021-2025 : part iShares EUR, nette de frais.",
    desc: [
      "la technologie européenne : un secteur beaucoup plus restreint qu'aux États-Unis, mais bien réel.",
      "ASML, SAP, Dassault Systèmes... les rares géants tech du continent réunis en une ligne.",
      "plus volatil que l'indice européen large, pour une thèse qui reste 100% régionale.",
    ],
  },
  {
    id: "smallcap_europe", name: getInstrumentName("IE0000N55FP4", "portfolio"), cat: "actions_larges", emoji: "🟢",
    // ISIN vérifié le 13/09/2026 (audit "ISIN pour chaque ETF") : ce fonds UCITS EUR (ESCE) a été
    // lancé le 25/03/2026 : série 2020-2025 du SPDR MSCI Europe Small Cap
    // UCITS ETF (fonds net EUR) créé en 2005 et suivant le même indice MSCI.
    isin: "IE0000N55FP4",
    // confidenceNote : badge visible en UI (cf. AllocationList, App.jsx) plutôt que seulement en
    // commentaire de code — demande utilisateur, audit "outils" du 14/09/2026.
    confidenceNote: "2020-2025 : rendements nets EUR du SPDR MSCI Europe Small Cap UCITS ETF, plus ancien et suivant le même indice. La part iShares affichée a été lancée en 2026 : ce n'est pas son historique propre.",
    // https://www.ssga.com/ie/en_gb/intermediary/etfs/state-street-spdr-msci-europe-small-cap-ucits-etf-smc-fp
    r: getInstrumentReturnValues('IE0000N55FP4'),
    desc: [
      "des petites capitalisations européennes, plus proches de l'économie réelle du continent.",
      "un potentiel de croissance supérieur aux grandes valeurs, sans sortir de la logique 100% Europe.",
      "moins suivi par les analystes internationaux, donc parfois sous-évalué.",
    ],
  },
  {
    id: "sect_energie", name: getInstrumentName("IE00B42NKQ00", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B42NKQ00",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/iues-ishares-s-p-500-energy-sector-ucits-etf-fund-fact-sheet-en-gb.pdf
    // Référence part IUES : https://www.blackrock.com/fr/particuliers/products/280503/ishares-sp-500-energy-sector-ucits-etf
    // Source : fonds réel (IUES, part USD Acc), fiche officielle BlackRock/iShares (performance
    // annuelle par calendrier) recoupée avec la performance de l'indice de référence sur chaque
    // année — écart de quelques dixièmes de point, cohérent avec le TER. 2020 (-34,32%) et 2023
    // (-1,97%)/2024 (5,06%) recoupés une seconde fois via une source indépendante. Corrige la
    // version précédente, non vérifiée, qui indiquait à tort -3,0% pour 2025 (signe et magnitude
    // faux) et sous-estimait 2021/2022.
    r: getInstrumentReturnValues('IE00B42NKQ00'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "pétrolières et gazières : un secteur ultra-cyclique, très lié au prix du baril.",
      "a connu l'une des pires années boursières en 2020... puis l'une des meilleures en 2022.",
      "un baromètre direct des tensions géopolitiques et de la demande énergétique mondiale.",
    ],
  },

  // ── 🟣 Revenu — covered call ──────────────────────────────
  // QYLD UCITS existe depuis novembre 2022 ; la simulation reprend l'historique
  // homogène de l'ETF américain Global X QYLD, couvert dès avant janvier 2020.
  // Les deux ETF suivent des variantes distinctes de l'indice buy-write (BXNT/BXNTU).
  {
    id: "qyld_ucits", name: getInstrumentName("IE00BM8R0J59", "portfolio"), cat: "dividendes", emoji: "🟣",
    // Rendements calendaires NAV, distributions réinvesties, de l'ETF américain QYLD :
    // https://assets-cms.globalxetfs.com/Statutory-Prospectus_Covered-Calls.pdf (p. 16).
    // Fonds UCITS / ISIN / variante BXNTU : https://globalxetfs.eu/funds/qyld
    isin: "IE00BM8R0J59",
    // Contrôle individuel du proxy le 24/09/2026 : fonds américain QYLD, 2020-2025 ; la part UCITS date de novembre 2022. Confiance : proxy documenté, pas rendement du produit affiché.
    // Sources : https://assets-cms.globalxetfs.com/Statutory-Prospectus_Covered-Calls.pdf et https://globalxetfs.eu/funds/qyld
    // Revue du 25/09/2026 : le tableau de performance de la page Global X est affiché par
    // défaut pour la part USD capitalisante, distincte de l'ISIN distribuant ci-dessous.
    // En l'absence de rendements calendaires vérifiés pour cette part distribuante,
    // conserver le proxy américain sur les six années, sans attribuer ses chiffres au fonds UCITS.
    confidenceNote: '2020-2025 : historique NAV USD, dividendes réinvestis, de l’ETF américain Global X QYLD lancé en 2013, utilisé comme approximation. L’ETF UCITS a été lancé en novembre 2022 : il suit la variante BXNTU et ces rendements ne sont pas ceux de sa part UCITS. Risque de change pour un investisseur en euros.',
    r: getInstrumentReturnValues('IE00BM8R0J59'),
    desc: [
      "un ETF distribuant mensuel : vend des options d'achat sur le Nasdaq-100 pour générer un revenu variable.",
      "verse un revenu mensuel variable, au prix d'une hausse plafonnée en marché très haussier.",
      "amortit une partie des baisses grâce aux primes encaissées, sans jamais les annuler complètement.",
    ],
  },

  // ── 🟢 Actions développées — secteurs thématiques (audit "enrichissement sectoriel", août 2026) ──
  // Chaque actif ci-dessous a été vérifié individuellement (existence réelle du fonds, indice exact
  // répliqué, historique 2020-2025) avant ajout. Non encore intégrés dans theses.js — cf. rapport de
  // session pour le détail des fonds suggérés à l'origine et écartés (obsolètes, track record
  // insuffisant, ou indice non vérifiable avec confiance).
  {
    id: "sect_tech", name: getInstrumentName("IE00B3WJKG14", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B3WJKG14",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/iuit-ishares-s-p-500-information-technology-sector-ucits-etf-fund-fact-sheet-en-gb.pdf
    // Rendements NAV USD de la part IUIT, ligne Share Class, 2020-2025.
    // https://www.ishares.com/gls-download/literature/fact-sheet/iuit-ishares-s-p-500-information-technology-sector-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B3WJKG14'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "Apple, Microsoft, Nvidia... le cœur technologique du S&P 500 concentré en une seule ligne.",
      "un secteur qui a tiré la performance du marché américain ces dernières années, au prix d'une volatilité plus élevée.",
      "très sensible aux taux d'intérêt et au cycle de l'innovation : de fortes hausses, mais aussi de sévères corrections.",
    ],
  },
  {
    id: "sect_robotique", name: getInstrumentName("IE00BYZK4552", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00BYZK4552",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/rbot-ishares-automation-robotics-ucits-etf-fund-fact-sheet-en-gb.pdf
    // Rendements NAV USD de la part RBOT, ligne Share Class, 2020-2025.
    // https://www.ishares.com/gls-download/literature/fact-sheet/rbot-ishares-automation-robotics-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00BYZK4552'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "des entreprises qui construisent les robots et les automatismes industriels de demain.",
      "un pari sur l'automatisation croissante de l'industrie et de la logistique à l'échelle mondiale.",
      "un secteur de niche encore jeune, avec des cycles marqués entre euphorie et dégonflement.",
    ],
  },
  {
    id: "sect_cybersecurite", name: getInstrumentName("IE00BG0J4C88", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00BG0J4C88",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/lock-ishares-digital-security-ucits-etf-fund-fact-sheet-en-gb.pdf
    // Référence part LOCK : https://www.blackrock.com/fr/intermediaries/products/297843/ishares-digital-security-ucits-etf-fund
    // Source : fonds réel vérifié (ISIN IE00BG0J4C88, ticker LOCK, lancé le 7 septembre 2018),
    // réplique le STOXX Global Digital Security Index, part USD (donnée EUR précise non trouvée de
    // façon fiable). 2020 (26,79%) confirmé par deux recherches indépendantes concordantes. 2021,
    // 2022, 2023, 2024, 2025 : une seule source (fiche fonds BlackRock), non recoupée indépendamment.
    r: getInstrumentReturnValues('IE00BG0J4C88'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "des entreprises spécialisées dans la protection des données et des systèmes informatiques.",
      "un secteur porté par une menace structurelle : la cybercriminalité ne recule jamais durablement.",
      "reste corrélé à la tech au sens large, avec les mêmes accès de volatilité.",
    ],
  },
  {
    id: "sect_energie_propre", name: getInstrumentName("IE00B1XNHC34", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B1XNHC34",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/ch/privatkunden/de/literature/fact-sheet/inrg-ishares-global-clean-energy-transition-ucits-etf-fund-fact-sheet-de-ch.pdf
    // NAV USD propre à la part INRG, revenus réinvestis, 2020-2025 :
    // https://www.ishares.com/ch/privatkunden/de/literature/fact-sheet/inrg-ishares-global-clean-energy-transition-ucits-etf-fund-fact-sheet-de-ch.pdf
    r: getInstrumentReturnValues('IE00B1XNHC34'),
    confidenceNote: 'Rendements de cette part iShares en dollars ; le change peut modifier le résultat en euros.',
    desc: [
      "panneaux solaires, éoliennes, hydrogène... les acteurs de la transition énergétique mondiale.",
      "un secteur en forte croissance sur le papier, mais très dépendant des taux d'intérêt et des subventions publiques.",
      "a connu l'une des plus fortes hausses boursières de 2020, suivie de plusieurs années de forte baisse.",
    ],
  },
  {
    id: "sect_conso_defensive", name: getInstrumentName("IE00B40B8R38", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B40B8R38",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/iucs-ishares-s-p-500-consumer-staples-sector-ucits-etf-fund-fact-sheet-en-gb.pdf
    // NAV USD de la part IUCS, 2020-2025 :
    // https://www.ishares.com/gls-download/literature/fact-sheet/iucs-ishares-s-p-500-consumer-staples-sector-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B40B8R38'),
    confidenceNote: 'Rendements de cette part iShares en dollars ; le change peut modifier le résultat en euros.',
    desc: [
      "alimentation, hygiène, produits du quotidien : les entreprises dont on ne se passe jamais, même en récession.",
      "un secteur réputé défensif, qui limite généralement la casse quand le reste du marché recule.",
      "moins spectaculaire qu'un secteur de croissance, mais plus stable sur la durée.",
    ],
  },
  {
    id: "sect_utilities", name: getInstrumentName("IE00B4KBBD01", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B4KBBD01",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/iuus-ishares-s-p-500-utilities-sector-ucits-etf-fund-fact-sheet-en-gb.pdf
    // NAV USD de la part IUUS, 2020-2025 :
    // https://www.ishares.com/gls-download/literature/fact-sheet/iuus-ishares-s-p-500-utilities-sector-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B4KBBD01'),
    confidenceNote: 'Rendements de cette part iShares en dollars ; le change peut modifier le résultat en euros.',
    desc: [
      "eau, électricité, gaz : des services essentiels, souvent en situation de quasi-monopole régional.",
      "un secteur défensif au rendement régulier, mais sensible aux taux d'intérêt du fait de son fort endettement.",
      "traverse généralement mieux les crises boursières que les secteurs cycliques.",
    ],
  },

  // ── 🟣 Dividendes — audit "enrichissement sectoriel" ──────
  {
    id: "dividend_leaders", name: getInstrumentName("NL0011683594", "portfolio"), cat: "dividendes", emoji: "🟣",
    isin: "NL0011683594",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.vaneck.com/uk/en/blog/etf-insights/vaneck-dividend-leaders-ucits-etf-turns-10--a-decade-of-dividends/
    distributing: true,
    // Rendements NAV EUR TDIV, dividendes réinvestis, publiés par VanEck (2020-2025).
    // https://www.vaneck.com/uk/en/blog/etf-insights/vaneck-dividend-leaders-ucits-etf-turns-10--a-decade-of-dividends/
    r: getInstrumentReturnValues('NL0011683594'),
    confidenceNote: 'Rendements NAV en euros, dividendes réinvestis ; le montant perçu dépend des distributions.',
    desc: [
      "une sélection mondiale des entreprises les plus solides côté dividende, filtrée par Morningstar.",
      "vise la régularité du versement autant que son niveau, pour limiter les mauvaises surprises.",
      "un profil « value » assumé, qui peut sous-performer en marché de croissance pure.",
    ],
  },

  // ── ⚪ Immobilier — audit "enrichissement sectoriel" ──────
  {
    id: "immo_gpr", name: getInstrumentName("NL0009690239", "portfolio"), cat: "immobilier", emoji: "⚪",
    isin: "NL0009690239",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.vaneck.com/pl/pl/news-and-insights/blog/opinie-dot-etf/15-lat-w-brany-notowanych-nieruchomoci-argumenty-przemawiajce-za-inwestycjami-w-fundusze-typu-reit-w-ramach-zdywersyfikowanego-portfela-nieruchomoci/
    distributing: true,
    // Source : fonds réel vérifié (ISIN NL0009690239, ticker TRET, lancé le 14 avril 2011, devise de
    // base EUR), réplique le GPR (Global Property Research) Global 100 Index — sciemment différent de
    // l'indice FTSE EPRA Nareit Global Developed utilisé par foncieres_etf : composition et
    // performance propres, à ne pas regrouper avec ce dernier (cf. avertissement sur IWDP/FTSE
    // EPRA Nareit Developed Dividend+ dans les commentaires de theses.js).
    // Performance NAV EUR, dividendes réinvestis :
    // https://www.vaneck.com/ch/fr/blog/etf-insights/ans-dimmobilier-cote-linteret-des-reit-dans-le-cadre-dune-allocation-immobiliere-diversifiee/
    r: getInstrumentReturnValues('NL0009690239'),
    desc: [
      "des sociétés immobilières cotées à l'échelle mondiale, sélectionnées via l'indice GPR Global 100.",
      "un indice différent de celui des autres foncières de la bibliothèque : composition et performance propres.",
      "comme toute foncière cotée, sensible aux taux d'intérêt autant qu'à la santé du marché immobilier.",
    ],
  },

  // ── 🔵 Obligataire — jumeau haut rendement (audit "enrichissement sectoriel") ──
  {
    id: "oblig_hy_amundi", name: getInstrumentName("LU2970735911", "portfolio"), cat: "obligataire", emoji: "🔵",
    isin: "LU2970735911",
    // Amundi Acc lancée le 15 juillet 2025, indice Markit iBoxx EUR Liquid High Yield.
    // Série 2020-2025 de la part Acc EUR du Xtrackers LU1109943388 (lancée en 2017),
    // nette de frais et suivant le même indice selon les émetteurs.
    // https://etf.dws.com/en/AssetDownload/Index/1ebf0fe4-b1c2-4d0f-a165-da75e3bcca7e/DWS-PASTPERF-LU1109943388-LU-en-2026-02-16.pdf
    // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU2970735911/FRA/FRA/RETAIL/ETF
    // Vérifié le 25/09/2026 : le PDF DWS "Past performance" de la part
    // LU1109943388 donne 2020-2025 : 1,5 / 3,1 / -9,6 / 11,6 / 6,8 / 4,7 %.
    // La fiche Amundi au 31/08/2026 confirme l'ISIN LU2970735911, le même
    // indice Markit iBoxx EUR Liquid High Yield et l'absence d'années civiles
    // complètes pour cette part créée en juillet 2025. Confiance élevée pour
    // l'historique Xtrackers ; il reste un proxy, pas le rendement de la part Amundi.
    // À ne pas confondre avec l'autre fonds
    // Amundi "Euro High Yield Bond ESG UCITS ETF" (LU1215415214), qui réplique un indice ESG-screené
    // différent (iBoxx MSCI ESG EUR High Yield Corporates) et n'est donc pas un jumeau valide.
    r: getInstrumentReturnValues('LU2970735911'),
    confidenceNote: "2020-2025 : rendements nets EUR de l'ETF Xtrackers LU1109943388 suivant le même indice Markit iBoxx EUR Liquid High Yield. La part Amundi affichée a été lancée en juillet 2025 et n'a pas d'année civile complète sur cette période.",
    desc: [
      "des obligations d'entreprises plus fragiles, donc mieux rémunérées : plus de coupon.",
      "le compartiment obligataire le plus généreux en revenu, avec un vrai risque de crédit en face.",
      "verse un coupon nettement supérieur aux obligations d'État, contre un peu plus de risque.",
    ],
  },

  // ── Ajoutés le 30/08/2026, capture d'écran de fact sheet officiel fournie par l'utilisateur —
  // PAS ENCORE ASSIGNÉS à un combo profil × risque dans theses.js (donc invisibles dans les
  // générations tant que l'utilisateur n'a pas choisi leur allocation) : présents uniquement dans
  // cette bibliothèque pour l'instant.
  {
    id: "oblig_etat_us", name: getInstrumentName("IE00BK95B138", "portfolio"), cat: "obligataire", emoji: "🔵",
    // BlackRock GOVT, part USD distribuante, indice ICE U.S. Treasury Core Bond Index.
    // Son tableau officiel 2020-2025 correspond exactement aux six valeurs ci-dessous.
    isin: "IE00BK95B138",
    // Nom CONFIRMÉ le 30/08/2026 : capture d'écran de l'en-tête du fact sheet officiel fournie par
    // l'utilisateur (catégorie "OBLIGATIONS", badge "GOVT", part USD (Distribution)) — même fonds
    // que celui dont le tableau de performance avait été fourni plus tôt le même jour. Performance
    // part de fonds 2020-2025 : +7,9% / -2,5% / -12,6% / +4,1% / +0,7% / +6,2%, très proche de son
    // indice de référence chaque année (écart 0,1 à 0,3pt : +8,0% / -2,4% / -12,3% / +3,9% / +0,7%
    // / +6,2%), cohérent avec un simple TER.
    r: getInstrumentReturnValues('IE00BK95B138'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "des obligations d'État américaines : risque de défaut jugé faible, mais cours sensible aux taux et au dollar.",
      "très sensible aux taux de la Fed : leurs mouvements pèsent directement sur la valeur de ces obligations.",
      "un actif refuge classique, mais qui reste exposé au risque de change EUR/USD pour un investisseur européen.",
    ],
  },
  {
    id: "actions_japon", name: getInstrumentName("IE00B4L5YX21", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B4L5YX21",
    // Source : capture d'écran du fact sheet officiel BlackRock/iShares fournie par l'utilisateur le
    // 30/08/2026 (iShares Core MSCI Japan IMI UCITS ETF, part U.S. Dollar (Capitalisation)) —
    // performance part de fonds 2020-2025 : +13,03% / +0,92% / -15,88% / +18,86% / +7,47% /
    // +25,36%, très proche de son indice de référence chaque année (écart <0,1pt : +13,10% / +0,98%
    // / -15,78% / +18,96% / +7,57% / +25,45%), cohérent avec un simple TER. Fonds coté en USD, pas
    // de version EUR vérifiée à ce stade — même limite de proxy de devise que or/sect_tech/
    // sect_robotique/etc. déjà documentée ailleurs dans ce fichier (rendement réel en EUR pour un
    // investisseur européen non couvert diffère selon l'évolution EUR/USD chaque année).
    r: getInstrumentReturnValues('IE00B4L5YX21'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "les grandes et moyennes entreprises japonaises cotées à Tokyo, de l'automobile à l'électronique en passant par la finance.",
      "une exposition supplémentaire au Japon, dont les actions peuvent aussi évoluer dans le même sens que les marchés américains et européens.",
      "longtemps boudé par les investisseurs occidentaux, le marché japonais a connu un net regain depuis 2023.",
    ],
  },
  {
    // Rendements calendaires officiels de la part iShares en USD (2020-2025), ligne « Total
    // Return » ; le fonds suit le MSCI Korea 20/35. Le MSCI classe la Corée comme marché émergent.
    // https://www.ishares.com/uk/individual/en/products/253733
    id: "actions_coree", name: getInstrumentName("IE00B5W4TY14", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B5W4TY14",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025 ; fiche arrondie à 0,1 point. Confiance : élevée à cette précision ; les décimales supplémentaires restent indicatives.
    // Source primaire : https://www.ishares.com/uk/professional/en/products/253733/ishares-msci-korea-ucits-etf-acc-fund
    r: getInstrumentReturnValues('IE00B5W4TY14'),
    confidenceNote: "Rendements de la part iShares en dollars ; le résultat en euros d'un portefeuille peut différer selon le change EUR/USD.",
    desc: [
      "les grandes entreprises sud-coréennes cotées à Séoul — Samsung, SK Hynix, Hyundai — très exposées aux semi-conducteurs.",
      "un marché émergent au sens MSCI, parmi les plus volatils de la zone Asie.",
      "porté depuis 2025 par la demande mondiale de mémoire et de puces liées à l'IA.",
    ],
  },
  {
    // Rendements calendaires de la part iShares en USD (2020-2025), ligne « Total Return » :
    // https://www.ishares.com/ch/professionals/en/products/251878/ishares-msci-taiwan-ucits-etf
    id: "actions_taiwan", name: getInstrumentName("IE00B0M63623", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B0M63623",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/itwn-ishares-msci-taiwan-ucits-etf-fund-fact-sheet-en-gb.pdf
    r: getInstrumentReturnValues('IE00B0M63623'),
    confidenceNote: "Rendements de la part iShares en dollars ; le résultat en euros d'un portefeuille peut différer selon le change EUR/USD.",
    desc: [
      "le marché taïwanais, dominé par TSMC — le plus grand fondeur de semi-conducteurs au monde.",
      "un pari concentré sur la chaîne de production des puces électroniques mondiales.",
      "2025 a prolongé un rallye porté par la demande de puces liées à l'intelligence artificielle.",
    ],
  },
  {
    // Part iShares lancée en avril 2020 : 2021-2025 sont les performances calendaires
    // « Total Return » publiées en USD par BlackRock ; 2020 reprend la part Dist
    // déjà existante du même fonds (fonds Acc lancé en avril). L'indice EXCLUT l'Inde.
    // https://www.ishares.com/uk/individual/en/products/313316/ishares-msci-ac-far-east-ex-japan-ucits-etf
    id: "actions_asie_ex_japon", name: getInstrumentName("IE00BKPX3K41", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00BKPX3K41",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2021-2025 seulement ; 2020 emprunté à la part Dist. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/gls-download/literature/fact-sheet/iffi-ishares-msci-ac-far-east-ex-japan-ucits-etf-fund-fact-sheet-en-gb.pdf
    // https://www.ishares.com/gls-download/literature/fact-sheet/iffi-ishares-msci-ac-far-east-ex-japan-ucits-etf-fund-fact-sheet-en-gb.pdf
    // https://www.ishares.com/uk/professionals/en/products/251848/ishares-msci-ac-far-east-ex-japan-ucits-etf
    r: getInstrumentReturnValues('IE00BKPX3K41'),
    confidenceNote: '2020 : rendement de la part distribuante du même fonds, en dollars et dividendes réinvestis (part Acc lancée en avril). 2021-2025 : rendements de la part Acc en dollars.',
    desc: [
      "Chine, Taïwan, Corée, Asean... l'Asie développée et émergente réunie en une seule ligne, hors Japon et Inde.",
      "plus diversifié qu'un pari sur un seul pays asiatique, mais toujours concentré sur une seule région du monde.",
      "expose surtout à la Chine et à Taïwan, les deux plus gros poids de l'indice.",
    ],
  },
  {
    id: "actions_value", name: getInstrumentName("IE00BP3QZB59", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00BP3QZB59",
    // Nom CONFIRMÉ le 30/08/2026 : capture d'écran de l'en-tête du fact sheet officiel fournie par
    // l'utilisateur (catégorie "ACTIONS", ticker IWVL, part USD (Capitalisation)) — même fonds que
    // celui dont le tableau de performance avait été fourni plus tôt le même jour, hypothèse initiale
    // confirmée exacte. Performance part de fonds 2020-2025 : -3,9% / +20,0% / -10,0% / +19,4% /
    // +5,3% / +39,6% (rendement total), très proche de son indice de référence chaque année (écart
    // <0,3pt : -4,0% / +20,0% / -9,9% / +19,3% / +5,1% / +39,4%), cohérent avec un simple TER. Fonds
    // coté en USD, pas de version EUR vérifiée à ce stade — même limite de proxy de devise que
    // or/actions_japon/sect_tech/etc. déjà documentée ailleurs dans ce fichier.
    r: getInstrumentReturnValues('IE00BP3QZB59'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "un filtre factoriel qui privilégie les entreprises jugées sous-valorisées par rapport à leurs fondamentaux.",
      "l'opposé du style croissance : moins de tech, plus de banques, d'énergie et d'industrie.",
      "historiquement plus cyclique, avec des phases de sur- et sous-performance marquées face à l'indice large.",
    ],
  },

  // ── Ajoutés le 14/09/2026 (audit "double-outil", demande utilisateur) — PAS ENCORE ASSIGNÉS à un
  // combo profil × risque dans theses.js (même logique que oblig_etat_us/actions_japon/actions_value
  // ci-dessus) : présents uniquement dans cette bibliothèque pour l'instant, à assigner après
  // stress-test si retenus. Recherchés en parallèle du Calculateur d'investissement (cf. CLAUDE.md,
  // section duplication) — seule la performance annuelle a pu être sourcée de façon fiable pour les
  // deux ; une série de prix réels exploitable pour le Calculateur n'a PAS pu être trouvée avec une
  // confiance suffisante (WebSearch ne renvoie que les rendements % du fonds, jamais un niveau de
  // part exploitable — reconstruire une série de prix à partir des % aurait reproduit l'erreur déjà
  // corrigée sur "soxx" plus haut dans ce fichier), donc ces deux actifs restent Générateur de
  // portefeuilles uniquement pour l'instant. Deux autres candidats testés en parallèle (cuivre :
  // WisdomTree Copper, pétrole : WisdomTree WTI Crude Oil) ont été abandonnés faute de données
  // exploitables (cuivre : deux sources en contradiction non résolue sur 2022/2023, écart de
  // plusieurs points ; pétrole : aucune donnée annuelle synthétisable trouvée) — cf. rapport de
  // session pour le détail.
  {
    id: "sect_financieres", name: getInstrumentName("IE00B4JNQZ49", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00B4JNQZ49",
    // Source : fiche officielle BlackRock/iShares (performance annuelle par calendrier, part de
    // fonds — IUFS), années 2020-2025. Recoupé avec l'indice de référence (S&P 500 Capped 35/20
    // Financials Index) sur chaque année : écart <0,3pt, cohérent avec le TER — le fonds suit
    // fidèlement son indice. Secteur totalement absent de la bibliothèque jusqu'ici (9 secteurs déjà
    // couverts : santé, semi-conducteurs, tech, robotique, cybersécurité, énergie propre, conso
    // défensive, utilities, énergie — jamais financières/banques).
    r: getInstrumentReturnValues('IE00B4JNQZ49'),
    confidenceNote: 'Rendements de la part iShares publiés en dollars ; le résultat en euros peut différer selon le change EUR/USD.',
    desc: [
      "banques, assurances, gestion d'actifs : le secteur financier américain réuni en une seule ligne.",
      "un secteur cyclique, sensible aux taux d'intérêt et à la santé du crédit.",
      "absent du reste de la bibliothèque jusqu'ici, malgré son poids dans l'économie réelle.",
    ],
  },
  {
    id: "smallcap_monde", name: getInstrumentName("IE00BF4RFH31", "portfolio"), cat: "actions_larges", emoji: "🟢",
    isin: "IE00BF4RFH31",
    // Contrôle individuel le 24/09/2026 : part et devise USD, performances 2020-2025. Confiance : élevée pour la période indiquée.
    // Source primaire : https://www.ishares.com/uk/individual/en/products/296576/
    // Rendements NAV de la part WSML (2020-2025). Complète
    // smallcap_europe (Europe uniquement) par une exposition small cap MONDIALE — pas un doublon,
    // composition et pondération géographique différentes (majoritairement US ici).
    // NAV annuelle USD, part IE00BF4RFH31, iShares :
    // https://www.ishares.com/uk/individual/en/products/296576/
    r: getInstrumentReturnValues('IE00BF4RFH31'),
    confidenceNote: 'Rendements NAV de la part iShares en dollars ; le résultat en euros peut différer avec le taux de change.',
    desc: [
      "des petites capitalisations de l'ensemble des pays développés, pas seulement l'Europe.",
      "complète le small cap européen déjà présent par une exposition mondiale, à majorité américaine.",
      "un potentiel de croissance supérieur aux grandes valeurs, avec une volatilité plus marquée.",
    ],
  },
  // Rendements des parts des Fiches ETF, réutilisés par référence.
  {
    id: 'msci_acwi_ishares', name: getInstrumentName("IE00B6R52259", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00B6R52259',
    r: getInstrumentReturnValues('IE00B6R52259'),
    confidenceNote: 'Rendements NAV de la part iShares en dollars ; le résultat en euros dépend du change.',
    desc: ['un seul ETF pour les pays développés et émergents.', 'une exposition mondiale large en complément du MSCI World.', 'un cœur de portefeuille simple, qui reste exposé aux baisses des actions.'],
  },
  {
    id: 'immo_ishares_yield', name: getInstrumentName("IE00B1FZS350", "portfolio"), cat: 'immobilier', emoji: '⚪', isin: 'IE00B1FZS350',
    r: getInstrumentReturnValues('IE00B1FZS350'),
    confidenceNote: 'Rendements NAV de la part iShares en dollars ; le résultat en euros dépend du change.',
    desc: ['des foncières cotées dans les pays développés.', 'une sélection orientée dividendes immobiliers.', 'reste un placement en actions, sensible aux taux.'],
  },
  {
    id: 'sect_biotech_ishares', name: getInstrumentName("IE00BYXG2H39", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BYXG2H39',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BYXG2H39'),
    confidenceNote: 'Rendements de la part en dollars ; une cotation en euros peut donner un autre résultat.',
    desc: ['biotechnologie américaine ; une poche santé cyclique', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'sect_energy_spdr', name: getInstrumentName("IE00BYTRR863", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BYTRR863',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BYTRR863'),
    confidenceNote: 'Rendements de la part en dollars ; une cotation en euros peut donner un autre résultat.',
    desc: ['énergie mondiale, sensible aux prix des matières premières', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'sect_tech_world_ishares', name: getInstrumentName("IE00BJ5JNY98", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BJ5JNY98',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BJ5JNY98'),
    confidenceNote: 'Rendements de la part en dollars ; une cotation en euros peut donner un autre résultat.',
    desc: ['technologie mondiale, exposée aux grands groupes de croissance', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'sect_ai_lg', name: getInstrumentName("IE00BK5BCD43", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BK5BCD43',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BK5BCD43'),
    confidenceNote: 'Rendements de la part en dollars ; une cotation en euros peut donner un autre résultat.',
    desc: ['entreprises exposées à l’intelligence artificielle', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'sect_batteries_lg', name: getInstrumentName("IE00BF0M2Z96", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BF0M2Z96',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BF0M2Z96'),
    confidenceNote: 'Rendements de la part en dollars ; une cotation en euros peut donner un autre résultat.',
    desc: ['chaîne de valeur des batteries et du stockage électrique', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'sect_water_amundi', name: getInstrumentName("FR0010527275", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'FR0010527275',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('FR0010527275'),
    confidenceNote: 'Rendements de la part publiés en euros.',
    desc: ['entreprises actives dans le traitement et la distribution d’eau', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'sect_luxury_amundi', name: getInstrumentName("LU1681048630", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'LU1681048630',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('LU1681048630'),
    confidenceNote: 'Rendements de la part publiés en euros.',
    desc: ['industrie mondiale du luxe, dépendante de la consommation', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'dividend_aristocrats_us_spdr', name: getInstrumentName("IE00B6YX5D40", "portfolio"), cat: 'dividendes', emoji: '🟠', isin: 'IE00B6YX5D40',
    // Source émetteur et contrôle 2020–2025 dans data/verified-returns.js.
    r: getInstrumentReturnValues('IE00B6YX5D40'),
    confidenceNote: 'Rendements de la part en dollars ; une cotation en euros peut donner un autre résultat.',
    desc: ['actions américaines sélectionnées pour leur historique de dividendes', 'une exposition spécialisée à doser dans le portefeuille.', 'son cours peut connaître de fortes variations.'],
  },
  {
    id: 'sect_cyber_lg', name: getInstrumentName("IE00BYPLS672", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BYPLS672',
    // Historique 2020–2025 de la part USD Acc L&G ; source dans src/data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BYPLS672'),
    confidenceNote: 'Rendements de la part en dollars ; le résultat en euros dépend du change.',
    desc: ['entreprises spécialisées dans la cybersécurité.', 'une exposition thématique au développement de la sécurité informatique.', 'reste exposé aux variations du secteur technologique.'],
  },
  {
    id: 'world_minvol_ishares', name: getInstrumentName("IE00B8FHGS14", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00B8FHGS14',
    // Historique de la part exacte (USD) et source émetteur dans src/data/verified-returns.js.
    r: getInstrumentReturnValues('IE00B8FHGS14'),
    confidenceNote: 'Rendements de la part en dollars ; le résultat en euros dépend du change.',
    desc: ['actions mondiales sélectionnées pour leur volatilité historiquement plus faible', 'une variante mondiale avec une sélection de titres spécifique.', 'son comportement peut différer nettement d’un indice World classique.'],
  },
  {
    id: 'world_quality_ishares', name: getInstrumentName("IE00BP3QZ601", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BP3QZ601',
    // Historique de la part exacte (USD) et source émetteur dans src/data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BP3QZ601'),
    confidenceNote: 'Rendements de la part en dollars ; le résultat en euros dépend du change.',
    desc: ['actions mondiales sélectionnées sur des critères de qualité', 'une variante mondiale avec une sélection de titres spécifique.', 'son comportement peut différer nettement d’un indice World classique.'],
  },
  {
    id: 'world_momentum_ishares', name: getInstrumentName("IE00BP3QZ825", "portfolio"), cat: 'actions_larges', emoji: '🟢', isin: 'IE00BP3QZ825',
    // Historique de la part exacte (USD) et source émetteur dans src/data/verified-returns.js.
    r: getInstrumentReturnValues('IE00BP3QZ825'),
    confidenceNote: 'Rendements de la part en dollars ; le résultat en euros dépend du change.',
    desc: ['actions mondiales sélectionnées selon leur dynamique de cours', 'une variante mondiale avec une sélection de titres spécifique.', 'son comportement peut différer nettement d’un indice World classique.'],
  },
  {
    id: 'oblig_hy_ishares_acc', name: getInstrumentName("IE00BF3N7094", "portfolio"), cat: 'obligataire', emoji: '🔵', isin: 'IE00BF3N7094',
    // Part capitalisante : disponible en composition manuelle, sans remplacer les parts
    // distribuantes du profil Rentier. Rendements de la part exacte dans src/data/verified-returns.js.
    manualOnly: true,
    r: getInstrumentReturnValues('IE00BF3N7094'),
    desc: ['obligations d’entreprises européennes à haut rendement.', 'les coupons sont réinvestis dans la part.', 'un risque de crédit supérieur aux obligations de meilleure qualité.'],
  },
  {
    id: 'oblig_em_local_ishares_acc', name: getInstrumentName("IE00BFZPF546", "portfolio"), cat: 'obligataire', emoji: '🔵', isin: 'IE00BFZPF546',
    // Dette souveraine émergente en monnaies locales : disponible en composition manuelle,
    // pas assimilée aux emprunts d’État EUR ou US des profils automatiques.
    manualOnly: true,
    r: getInstrumentReturnValues('IE00BFZPF546'),
    confidenceNote: 'Rendements NAV de la part en dollars ; les devises émergentes et le change EUR/USD influencent le résultat en euros.',
    desc: ['obligations souveraines émergentes en devises locales.', 'exposition au crédit des États et à leurs monnaies.', 'la valeur peut varier fortement avec les taux et les changes.'],
  },
];

export function getAsset(id) {
  return ASSETS.find((a) => a.id === id);
}
