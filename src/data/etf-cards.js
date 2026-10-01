import { getPreferredInstrumentListing } from './instrument-listings.js';
import { getInstrumentAum } from './instrument-aum.js';
import { getInstrumentDistribution, getInstrumentLocation, getInstrumentPositions } from './instrument-facts.js';
import { getInstrumentName, getInstrumentPea } from './instruments.js';
import { formatEtfTer } from './etf-ter.js';
// Bibliothèque de fiches ETF — contenu pré-rédigé, données stockées en dur, aucune donnée de
// marché en temps réel. Les encours sont désormais dans instrument-aum.js. Modifie les autres champs (isin, ter, positions, distribution,
// pea, cto, location, hook, whatIs, whyInteresting, whatToKnow, verdict, question) sans rien casser
// ailleurs.
// Édition du 01/10/2026 : accroches affichées et paragraphes au tutoiement, propres à chaque exposition.
// Les descriptions reformulent le périmètre déjà documenté, sans nouvelle donnée
// chiffrée. Le tweet conserve le squelette historique : caractéristiques,
// description, intérêt, limites, verdict et question.
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
  // Ajouts du 01/10/2026 : caractéristiques, dates et preuves dans les registres communs.
  {
    id: "monetaire-eur", category: "Obligataires",
    name: getInstrumentName("LU0290358497", "sheet"), listing: getPreferredInstrumentListing("LU0290358497"), isNew: true,
    isin: "LU0290358497", ter: formatEtfTer("LU0290358497", "sheet"),
    positions: getInstrumentPositions("LU0290358497"), aum: getInstrumentAum("LU0290358497", "sheet"),
    lastVerified: "01/10/2026", distribution: getInstrumentDistribution("LU0290358497"), pea: getInstrumentPea("LU0290358497"), cto: true,
    location: getInstrumentLocation("LU0290358497"),
    hook: "💶 Un ETF qui suit les taux à court terme : que devient son rendement quand la BCE baisse ses taux ?",
    whatIs: "Son indice reflète un taux monétaire en euros, le €STR, auquel s’ajoute une petite marge avant les frais. Le fonds reçoit cette performance grâce à un swap. Tu t’exposes donc aux taux au jour le jour, plutôt qu’à un panier d’actions ou à des obligations de longue durée.",
    whyInteresting: "Ici, tu suis les taux courts en euros : tu peux comprendre d’où vient le rendement, plutôt que retenir seulement le taux affiché. Cette part capitalise les revenus : ils restent investis dans le fonds, sans versement à réinvestir toi-même.",
    whatToKnow: "Le rendement n’est pas fixé à l’avance : il diminue lorsque les taux courts baissent et peut devenir négatif. Le swap ajoute un risque de contrepartie. Il faut aussi compter les frais du fonds et ceux du courtier : ce placement ne bénéficie pas de la garantie d’un dépôt bancaire.",
    verdict: "Une exposition aux taux courts en euros, dont le rendement et les risques diffèrent de ceux d’un livret.",
    question: "Pour comprendre un placement monétaire, tu regardes d’abord son taux actuel ou ce qui se passe si les taux baissent ?",
  },
  {
    id: "obligations-etat-0-1", category: "Obligataires",
    name: getInstrumentName("IE00B3FH7618", "sheet"), listing: getPreferredInstrumentListing("IE00B3FH7618"), isNew: true,
    isin: "IE00B3FH7618", ter: formatEtfTer("IE00B3FH7618", "sheet"),
    positions: getInstrumentPositions("IE00B3FH7618"), aum: getInstrumentAum("IE00B3FH7618", "sheet"),
    lastVerified: "01/10/2026", distribution: getInstrumentDistribution("IE00B3FH7618"), pea: getInstrumentPea("IE00B3FH7618"), cto: true,
    location: getInstrumentLocation("IE00B3FH7618"),
    hook: "🏛️ Deux ETF d’obligations d’État peuvent réagir très différemment aux taux. Pourquoi ?",
    whatIs: "Ce fonds rassemble des obligations d’État de la zone euro dont l’échéance est courte, entre zéro et un an. Leur remboursement approche, ce qui limite leur sensibilité aux mouvements de taux par rapport à des obligations plus longues. Cette part distribue les revenus.",
    whyInteresting: "Tu accèdes à plusieurs emprunts d’État en euros avec une seule ligne, sans acheter chaque obligation séparément. Pour comprendre son comportement, la durée des obligations compte davantage que la seule présence du mot « État » dans le nom.",
    whatToKnow: "Une échéance courte ne garantit pas ton capital. La valeur des parts peut baisser, et le fonds renouvelle ses obligations : tu ne détiens pas un placement qui te rembourse automatiquement à une date choisie. Les revenus évolueront aussi avec les taux.",
    verdict: "Des emprunts d’État à échéance courte, sans garantie de remboursement de la part à une date fixe.",
    question: "Dans un ETF obligataire, tu regardes d’abord le rendement affiché ou la sensibilité aux taux ?",
  },
  {
    id: "obligations-globales-eur", category: "Obligataires",
    name: getInstrumentName("IE00BDBRDM35", "sheet"), listing: getPreferredInstrumentListing("IE00BDBRDM35"), isNew: true,
    isin: "IE00BDBRDM35", ter: formatEtfTer("IE00BDBRDM35", "sheet"),
    positions: getInstrumentPositions("IE00BDBRDM35"), aum: getInstrumentAum("IE00BDBRDM35", "sheet"),
    lastVerified: "01/10/2026", distribution: getInstrumentDistribution("IE00BDBRDM35"), pea: getInstrumentPea("IE00BDBRDM35"), cto: true,
    location: getInstrumentLocation("IE00BDBRDM35"),
    hook: "🌍 Des obligations du monde entier dans un seul ETF : à quoi sert la couverture en euros ?",
    whatIs: "Le fonds rassemble des obligations mondiales de catégorie investment grade : États, entreprises et titres adossés à des actifs. Cette part ajoute une couverture du risque de change vers l’euro. Tu suis donc un large marché obligataire, avec un mécanisme destiné à limiter l’effet des devises.",
    whyInteresting: "Avec cette ligne, tu réunis de nombreux emprunteurs et plusieurs marchés, tout en limitant l’influence des devises sur la performance de l’ETF. Cette part garde les revenus investis dans le fonds. La couverture limite l’effet du change, mais elle ne protège pas des variations du prix des obligations.",
    whatToKnow: "La couverture ne supprime ni le risque de taux ni le risque de crédit, et elle a un coût. Le fonds peut subir des baisses marquées malgré ses nombreuses lignes. L’émetteur annonce aussi la suppression d’une ligne de cotation le 15 décembre 2026 : vérifie la place utilisée auprès de ton courtier.",
    verdict: "Une exposition obligataire mondiale avec couverture en euros, dont les risques de taux et de crédit restent présents.",
    question: "Pour des obligations mondiales, tu préfères limiter l’effet des devises ou conserver cette exposition au change ?",
  },
  {
    id: "obligations-inflation", category: "Obligataires",
    name: getInstrumentName("IE00B0M62X26", "sheet"), listing: getPreferredInstrumentListing("IE00B0M62X26"), isNew: true,
    isin: "IE00B0M62X26", ter: formatEtfTer("IE00B0M62X26", "sheet"),
    positions: getInstrumentPositions("IE00B0M62X26"), aum: getInstrumentAum("IE00B0M62X26", "sheet"),
    lastVerified: "01/10/2026", distribution: getInstrumentDistribution("IE00B0M62X26"), pea: getInstrumentPea("IE00B0M62X26"), cto: true,
    location: getInstrumentLocation("IE00B0M62X26"),
    hook: "🛒 Un ETF d’obligations indexées sur l’inflation peut baisser. Comment est-ce possible ?",
    whatIs: "Le fonds détient des obligations d’État de la zone euro dont les paiements sont liés à l’inflation selon les règles de chaque emprunt. Cette indexation modifie les sommes dues, mais les obligations continuent à se négocier en Bourse. Leur prix peut donc évoluer dans les deux sens.",
    whyInteresting: "Tu retrouves plusieurs emprunts dont les paiements sont liés à l’inflation, sans avoir à les acheter un par un. Cette part réinvestit les revenus. Elle permet aussi de comprendre pourquoi protéger les paiements d’une obligation et stabiliser le prix d’un ETF sont deux questions différentes.",
    whatToKnow: "La hausse de l’inflation ne garantit pas une hausse de l’ETF. Une augmentation des taux réels peut faire baisser le prix des obligations. Leur durée compte aussi : le fonds ne promet ni capital stable ni compensation exacte de ton inflation personnelle.",
    verdict: "Une exposition à des obligations indexées, avec un prix de marché qui reste sensible aux taux réels.",
    question: "Quand tu lis « indexé sur l’inflation », t’attends-tu à des paiements ajustés ou à un placement qui ne baisse jamais ?",
  },
  {
    id: "em-ex-chine", category: "Cœur de portefeuille",
    name: getInstrumentName("IE00BMG6Z448", "sheet"), listing: getPreferredInstrumentListing("IE00BMG6Z448"), isNew: true,
    isin: "IE00BMG6Z448", ter: formatEtfTer("IE00BMG6Z448", "sheet"),
    positions: getInstrumentPositions("IE00BMG6Z448"), aum: getInstrumentAum("IE00BMG6Z448", "sheet"),
    lastVerified: "01/10/2026", distribution: getInstrumentDistribution("IE00BMG6Z448"), pea: getInstrumentPea("IE00BMG6Z448"), cto: true,
    location: getInstrumentLocation("IE00BMG6Z448"),
    hook: "🌏 Retirer la Chine d’un ETF émergents : qu’est-ce que ça change vraiment dans ton exposition ?",
    whatIs: "Son indice couvre les grandes et moyennes entreprises des marchés émergents en excluant la Chine. Les autres pays prennent mécaniquement davantage de place dans cette sélection. Tu achètes donc une répartition différente de celle d’un ETF émergents classique.",
    whyInteresting: "Tu veux garder les marchés émergents, mais choisir à part la place de la Chine ? C’est précisément ce que cette sélection permet. Les actions chinoises sont absentes de l’indice. Tu peux donc gérer ce marché séparément, au lieu de laisser l’indice émergent global en fixer le poids.",
    whatToKnow: "Exclure la Chine ne fait pas disparaître les risques politiques, économiques ou de change des autres pays. Cela ne coupe pas non plus les liens commerciaux de leurs entreprises avec la Chine. La part a été lancée en 2021 : seules les années calendaires complètes disponibles sont affichées.",
    verdict: "Une sélection émergente sans actions chinoises dans l’indice, mais sans suppression des risques émergents.",
    question: "Pour les marchés émergents, tu garderais la Chine dans l’indice ou tu choisirais son poids séparément ?",
  },
  {
    id: "inde", category: "Cœur de portefeuille",
    name: getInstrumentName("IE00BZCQB185", "sheet"), listing: getPreferredInstrumentListing("IE00BZCQB185"), isNew: true,
    isin: "IE00BZCQB185", ter: formatEtfTer("IE00BZCQB185", "sheet"),
    positions: getInstrumentPositions("IE00BZCQB185"), aum: getInstrumentAum("IE00BZCQB185", "sheet"),
    lastVerified: "01/10/2026", distribution: getInstrumentDistribution("IE00BZCQB185"), pea: getInstrumentPea("IE00BZCQB185"), cto: true,
    location: getInstrumentLocation("IE00BZCQB185"),
    hook: "🇮🇳 Croire à la croissance de l’Inde suffit-il pour investir dans ses entreprises ?",
    whatIs: "Le MSCI India rassemble de grandes et moyennes entreprises du marché indien. Tu t’exposes à leurs actions, avec des poids différents selon leur capitalisation. La croissance économique du pays peut soutenir leur activité, mais elle ne détermine pas à elle seule le rendement de ton placement.",
    whyInteresting: "Si c’est le marché indien qui t’intéresse, cette ligne te permet de le suivre sans devoir choisir les entreprises toi-même. Cela rend l’exposition précise : tu renforces volontairement un pays plutôt que l’ensemble des marchés émergents.",
    whatToKnow: "Le fonds reste concentré sur un pays et ses entreprises. Les valorisations, la réglementation et la roupie influencent le résultat. Ses frais de 0,65 % par an méritent aussi une comparaison avec les alternatives : une économie dynamique ne garantit pas des actions toujours rentables.",
    verdict: "Une exposition ciblée au marché indien, avec des frais et un risque pays à examiner au-delà du récit économique.",
    question: "Pour investir dans les émergents, tu préfères un panier de pays ou une ligne dédiée à l’Inde ?",
  },
  {
    id: "infrastructures", category: "Sectoriels classiques",
    name: getInstrumentName("IE00B1FZS467", "sheet"), listing: getPreferredInstrumentListing("IE00B1FZS467"), isNew: true,
    isin: "IE00B1FZS467", ter: formatEtfTer("IE00B1FZS467", "sheet"),
    positions: getInstrumentPositions("IE00B1FZS467"), aum: getInstrumentAum("IE00B1FZS467", "sheet"),
    lastVerified: "01/10/2026", distribution: getInstrumentDistribution("IE00B1FZS467"), pea: getInstrumentPea("IE00B1FZS467"), cto: true,
    location: getInstrumentLocation("IE00B1FZS467"),
    hook: "🌉 Acheter des infrastructures en Bourse : quelles entreprises se cachent derrière ce mot ?",
    whatIs: "Son indice rassemble des sociétés cotées liées aux infrastructures dans plusieurs pays. Tu détiens leurs actions : leurs contrats, leurs investissements et leur financement comptent pour leurs résultats. Le caractère essentiel de leurs services ne garantit pas la stabilité de leur cours.",
    whyInteresting: "Tu retrouves plusieurs entreprises d’infrastructures dans une même ligne : tu n’as pas à faire reposer toute cette exposition sur un seul acteur. Cette part distribue des revenus : pour évaluer le placement, il faut regarder les versements et l’évolution de la valeur des parts ensemble.",
    whatToKnow: "Ces actions restent sensibles aux taux, à l’endettement et aux décisions réglementaires. Les dividendes peuvent varier. Les frais de 0,65 % par an comptent aussi : des services indispensables ne rendent pas le placement sans risque.",
    verdict: "Des actions d’entreprises d’infrastructures mondiales, avec des distributions et des fluctuations boursières.",
    question: "Les infrastructures t’intéressent pour leurs activités ou surtout pour les revenus distribués ?",
  },

    // ---------- CŒUR DE PORTEFEUILLE ----------
    // Ajouts du 27/09/2026 : parts déjà présentes dans le Comparatif ETF et
    // le Comparateur d'indices. Montants et dates issus des fiches émetteurs.
    {
      id: "sp500-spea", category: "Cœur de portefeuille",
      name: getInstrumentName("IE000DQLYVB9", "sheet"), listing: getPreferredInstrumentListing("IE000DQLYVB9"), isNew: true,
      isin: "IE000DQLYVB9", ter: formatEtfTer("IE000DQLYVB9", "sheet"),
      positions: "Indice S&P 500 : environ 500 entreprises", aum: getInstrumentAum("IE000DQLYVB9", "sheet"),
      lastVerified: "27/09/2026", distribution: getInstrumentDistribution("IE000DQLYVB9"), pea: getInstrumentPea("IE000DQLYVB9"), cto: true,
      location: getInstrumentLocation("IE000DQLYVB9"),
      // Encours de 54 413 013 EUR au 28/09/2026, consulté le 29/09/2026 sur BlackRock.
      // BlackRock : caractéristiques du fonds, TER, lancement le 29/05/2025,
      // fonds commercialisé PEA ; notice : intention de conserver l'éligibilité.
      // https://www.blackrock.com/fr/intermediaries/products/342916/
      hook: "🇺🇸 Suivre les grandes entreprises américaines dans un PEA pour peu de frais : que propose cet ETF récent ?",
      whatIs: "Son indice, le S&P 500, rassemble de grandes sociétés américaines de plusieurs secteurs. Cette part utilise un swap : un contrat permet au fonds de recevoir la performance de l’indice. C’est ce mécanisme qui rend cette exposition accessible dans un PEA.",
      whyInteresting: "Tu suis les grandes entreprises américaines avec une seule ligne et des frais réduits, tout en gardant cette exposition dans ton PEA. Mais un fonds récent mérite aussi qu’on regarde son historique et les conditions auxquelles on peut l’acheter ou le vendre.",
      whatToKnow: "Son encours est plus petit et son historique plus court que ceux des ETF S&P 500 anciens. La réplication par swap comporte un risque de contrepartie ; vérifie aussi la liquidité et l'éligibilité auprès de ton courtier avant d'acheter.",
      verdict: "Une option PEA peu chargée en frais, encore récente ; le coût affiché ne suffit pas à lui seul pour choisir.",
      question: "Pour suivre le S&P 500 en PEA, tu privilégies les frais ou l'ancienneté du fonds ?"
    },
    {
      id: "topix-pea-hedged", category: "Cœur de portefeuille",
      name: getInstrumentName("FR0013411998", "sheet"), listing: getPreferredInstrumentListing("FR0013411998"), isNew: true,
      isin: "FR0013411998", ter: formatEtfTer("FR0013411998", "sheet"),
      positions: "Indice TOPIX : 1 637 valeurs au 31/07/2026", aum: getInstrumentAum("FR0013411998", "sheet"),
      lastVerified: "27/09/2026", distribution: getInstrumentDistribution("FR0013411998"), pea: getInstrumentPea("FR0013411998"), cto: true,
      location: getInstrumentLocation("FR0013411998"),
      // Amundi, fiche historique du 30/04/2026 : 0,48 %, PEA, 150,05 M€, part couverte.
      // Encours affiché : relevé justETF plus récent dans instrument-aum.js.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260430
      hook: "🇯🇵 Investir au Japon, c’est aussi s’exposer au yen. Et si tu voulais limiter cet effet ?",
      whatIs: "Le TOPIX rassemble un large ensemble d’entreprises japonaises. Cette part ajoute une couverture entre le yen et l’euro pour limiter l’effet des variations de change. Tu suis donc les actions japonaises avec un mécanisme supplémentaire, qui influence aussi la performance de l’ETF.",
      whyInteresting: "Tu veux détenir des actions japonaises dans ton PEA, mais donner moins de place aux mouvements du yen ? Cette part ajoute justement une couverture. Cette protection a toutefois un coût : elle peut aussi te priver de l’effet favorable d’une hausse de la monnaie japonaise.",
      whatToKnow: "La couverture a un coût et peut réduire la performance lorsque le yen monte. Ne confonds pas cette part avec la part TOPIX PEA non couverte FR0013411980 : leurs rendements en euros peuvent diverger.",
      verdict: "Une exposition large au Japon en PEA pour qui veut limiter l'effet du change, sans éliminer le risque actions.",
      question: "Pour investir au Japon, tu garderais l'exposition au yen ou tu la couvrirais ?"
    },
    {
      id: "basic-resources-pea", category: "Sectoriels classiques",
      name: getInstrumentName("LU1834983550", "sheet"), listing: getPreferredInstrumentListing("LU1834983550"), isNew: true,
      isin: "LU1834983550", ter: formatEtfTer("LU1834983550", "sheet"),
      positions: "Secteur ressources de base du STOXX Europe 600", aum: getInstrumentAum("LU1834983550", "sheet"),
      lastVerified: "27/09/2026", distribution: getInstrumentDistribution("LU1834983550"), pea: getInstrumentPea("LU1834983550"), cto: true,
      location: getInstrumentLocation("LU1834983550"),
      // Amundi, fiche du 30/06/2026 : PEA, 0,30 %, 752,60 M€.
      // https://www.amundietf.com/pdfDocuments/monthly-factsheet/LU1834983550/ENG/LUX/RETAIL/ETF/20260630
      hook: "⛏️ Acheter un ETF de ressources de base : sais-tu ce qui se cache derrière le mot « ressources » ?",
      whatIs: "Son indice sélectionne les entreprises du secteur des ressources de base au sein du STOXX Europe 600. Tu achètes donc des actions de producteurs européens, dont l’activité dépend du cycle industriel et des matières premières.",
      whyInteresting: "Tu peux réunir ces producteurs européens dans une seule ligne de ton PEA, sans devoir choisir une entreprise minière en particulier. Leur résultat dépend aussi de leurs coûts et de leurs marges : le prix d’un métal ne suffit pas à expliquer le cours de leurs actions.",
      whatToKnow: "Le secteur est sensible aux prix des matières premières et au cycle industriel. Cette exposition concentrée peut déjà être présente dans un ETF Europe large.",
      verdict: "Un ETF sectoriel PEA pour cibler les producteurs de ressources, à distinguer d'un ETC sur un métal.",
      question: "Tu préfères les entreprises minières ou une exposition directe aux métaux ?"
    },
    {
      id: "msci-world",
      category: "Cœur de portefeuille",
      name: getInstrumentName("FR001400U5Q4", "sheet"),
      listing: getPreferredInstrumentListing("FR001400U5Q4"),
      isNew: true,
      isin: "FR001400U5Q4",
      ter: formatEtfTer("FR001400U5Q4", "sheet"),
      positions: "~1 500 positions",
      aum: getInstrumentAum("FR001400U5Q4", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("FR001400U5Q4"),
      pea: getInstrumentPea("FR001400U5Q4"),
      cto: true,
      location: getInstrumentLocation("FR001400U5Q4"),
      hook: "🌍 Tu achètes un ETF « World ». Mais sais-tu vraiment quelle place chaque pays y occupe ?",
      whatIs: "Le MSCI World réunit de grandes et moyennes entreprises de pays développés. Les plus grosses capitalisations occupent le plus de place : les États-Unis et leurs grands groupes influencent donc fortement la performance de l’ETF. Les marchés émergents et les petites entreprises ne font pas partie de cette exposition.",
      whyInteresting: "Tu n’as pas envie de choisir pays par pays et secteur par secteur ? Cette ligne rassemble de nombreuses entreprises de pays développés à ta place. Cette part utilise une réplication synthétique pour rendre cette exposition mondiale accessible dans un PEA.",
      whatToKnow: "Tu détiens beaucoup d’entreprises, mais la performance de l’ETF dépend fortement du marché américain. Il n’y a pas de petites capitalisations. Et si tu investis sur CTO, compare les frais : d’autres ETF World y coûtent moins cher.",
      verdict: "Une base simple pour un PEA de long terme, à condition d’être à l’aise avec son poids américain.",
      question: "Dans ton PEA, tu préfères un seul ETF World ou ajouter d’autres régions à côté ?"
    },
    {
      id: "sp500",
      category: "Cœur de portefeuille",
      name: getInstrumentName("FR0011871128", "sheet"),
      listing: getPreferredInstrumentListing("FR0011871128"),
      isNew: false,
      isin: "FR0011871128",
      ter: formatEtfTer("FR0011871128", "sheet"),
      positions: "500 positions",
      aum: getInstrumentAum("FR0011871128", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("FR0011871128"),
      pea: getInstrumentPea("FR0011871128"),
      cto: true,
      location: getInstrumentLocation("FR0011871128"),
      hook: "🇺🇸 Un seul ETF pour les grandes entreprises américaines. Mais quelle exposition ajoutes-tu vraiment ?",
      whatIs: "Le S&P 500 rassemble de grandes entreprises cotées aux États-Unis, dans plusieurs secteurs. Leur poids dépend de leur capitalisation : quelques groupes peuvent donc influencer fortement l’indice. Tu suis un marché national, même si beaucoup de ces entreprises vendent dans le monde entier.",
      whyInteresting: "Tu peux suivre le S&P 500 dans ton PEA grâce à une réplication synthétique, sans acheter une à une les actions de l’indice. C’est une façon simple de renforcer les actions américaines, à condition de regarder celles que tu détiens déjà ailleurs.",
      whatToKnow: "Tu restes investi uniquement aux États-Unis, avec un poids important des grandes valeurs technologiques. Une ligne MSCI World en détient déjà beaucoup : vérifie ce que cet ETF ajoute à ton portefeuille.",
      verdict: "Si tu veux concentrer ta poche actions sur les États-Unis tout en restant sur PEA, cet ETF va droit au but. Il ne t’apporte aucune exposition aux autres marchés.",
      question: "Tu détiens déjà un ETF World : ajouterais-tu aussi du S&P 500, sachant que les grandes valeurs américaines y sont déjà présentes ?"
    },
    {
      id: "nasdaq100",
      category: "Cœur de portefeuille",
      name: getInstrumentName("FR0011871110", "sheet"),
      listing: getPreferredInstrumentListing("FR0011871110"),
      isNew: false,
      isin: "FR0011871110",
      ter: formatEtfTer("FR0011871110", "sheet"),
      positions: "100 positions",
      aum: getInstrumentAum("FR0011871110", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("FR0011871110"),
      pea: getInstrumentPea("FR0011871110"),
      cto: true,
      location: getInstrumentLocation("FR0011871110"),
      hook: "💻 Le Nasdaq-100 te tente ? Regarde d’abord ce que ses entreprises ont en commun.",
      whatIs: "L’indice rassemble les grandes entreprises non financières cotées au Nasdaq. La technologie et les valeurs de croissance y prennent beaucoup de place, même si tous les titres ne sont pas des entreprises technologiques. La sélection dépend aussi de leur place de cotation.",
      whyInteresting: "Si tu veux donner davantage de place aux grandes entreprises du Nasdaq, cette part te permet de le faire en une seule ligne dans ton PEA. Elle peut intéresser pour renforcer ce biais, mais plusieurs de ses entreprises occupent déjà une place importante dans les indices mondiaux.",
      whatToKnow: "Le Nasdaq-100 dépend fortement de quelques grands noms de la tech. Si tu possèdes déjà un ETF World ou S&P 500, tu renforces souvent les mêmes titres. Les baisses peuvent être marquées.",
      verdict: "Une exposition assumée aux grandes valeurs non financières du Nasdaq. À considérer pour accentuer ce biais, pas pour diversifier un portefeuille déjà chargé en tech.",
      question: "Si tu as déjà un ETF World ou S&P 500, quelle place laisserais-tu encore au Nasdaq-100 ?"
    },
    {
      id: "eurostoxx50",
      category: "Cœur de portefeuille",
      name: getInstrumentName("LU1681047236", "sheet"),
      listing: getPreferredInstrumentListing("LU1681047236"),
      isNew: false,
      isin: "LU1681047236",
      ter: formatEtfTer("LU1681047236", "sheet"),
      positions: "50 positions",
      aum: getInstrumentAum("LU1681047236", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("LU1681047236"),
      pea: getInstrumentPea("LU1681047236"),
      cto: true,
      location: getInstrumentLocation("LU1681047236"),
      hook: "🇪🇺 Cinquante grandes entreprises de la zone euro dans un ETF : est-ce l’Europe que tu veux détenir ?",
      whatIs: "L’Euro STOXX 50 rassemble de grandes sociétés de la zone euro. Tu retrouves plusieurs métiers, de l’industrie aux services, dans une sélection resserrée. Son périmètre géographique laisse de côté les marchés européens qui utilisent d’autres monnaies.",
      whyInteresting: "Tu veux donner plus de place aux grandes entreprises de la zone euro ? Tu peux les retrouver dans une seule ligne de ton PEA, sans choisir chaque action. Le choix entre cet indice et un indice européen plus large dépend surtout de l’exposition recherchée.",
      whatToKnow: "Cinquante titres, c’est moins diversifié qu’un indice mondial. Regarde aussi les secteurs présents : l’exposition à la technologie américaine y est faible.",
      verdict: "Cinquante grandes sociétés de la zone euro à faible coût. Le nombre limité de lignes mérite d’être assumé.",
      question: "Pour ajouter de l’Europe, tu choisirais ces 50 grandes valeurs ou un indice européen plus large ?"
    },
    {
      id: "msci-em",
      category: "Cœur de portefeuille",
      name: getInstrumentName("IE00BKM4GZ66", "sheet"),
      listing: getPreferredInstrumentListing("IE00BKM4GZ66"),
      isNew: false,
      isin: "IE00BKM4GZ66",
      ter: formatEtfTer("IE00BKM4GZ66", "sheet"),
      positions: "~3 000 positions",
      aum: getInstrumentAum("IE00BKM4GZ66", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BKM4GZ66"),
      pea: getInstrumentPea("IE00BKM4GZ66"),
      cto: true,
      location: getInstrumentLocation("IE00BKM4GZ66"),
      hook: "🌏 Un ETF World laisse de côté les marchés émergents. Que contient une ligne qui les ajoute ?",
      whatIs: "Le MSCI Emerging Markets IMI couvre de grandes, moyennes et petites entreprises des marchés émergents. Tu accèdes à plusieurs pays, avec une place importante pour les marchés asiatiques. Le poids de chaque pays et de chaque entreprise suit les règles de l’indice.",
      whyInteresting: "Tu as un ETF World et tu veux aussi détenir les marchés émergents ? Cette ligne ajoute justement des entreprises absentes du World classique. Tu élargis la couverture géographique, tout en acceptant des risques propres à ces marchés et à leurs monnaies.",
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
      name: getInstrumentName("IE00B6R52259", "sheet"),
      listing: getPreferredInstrumentListing("IE00B6R52259"),
      isNew: true,
      isin: "IE00B6R52259",
      ter: formatEtfTer("IE00B6R52259", "sheet"),
      positions: "~1 970 positions",
      aum: getInstrumentAum("IE00B6R52259", "sheet"),
      lastVerified: "08/09/2026",
      distribution: getInstrumentDistribution("IE00B6R52259"),
      pea: getInstrumentPea("IE00B6R52259"),
      cto: true,
      location: getInstrumentLocation("IE00B6R52259"),
      hook: "🌍 Pays développés et émergents dans un seul ETF : qu’apporte le MSCI ACWI ?",
      whatIs: "Le MSCI ACWI réunit de grandes et moyennes entreprises de pays développés et émergents. Les grandes capitalisations pèsent davantage : la couverture mondiale ne signifie donc pas que tous les pays occupent une place égale. Les petites entreprises restent en dehors de cet univers.",
      whyInteresting: "Tu préfères regrouper pays développés et émergents plutôt que jongler entre plusieurs ETF ? Cette ligne réunit les deux ensembles. L’indice détermine leur poids, ce qui évite de gérer séparément un ETF World et un ETF émergents.",
      whatToKnow: "Les États-Unis conservent une place majeure : ajouter les émergents ne fait pas disparaître la concentration des grands indices mondiaux.",
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
      name: getInstrumentName("IE00BK5BQT80", "sheet"),
      listing: getPreferredInstrumentListing("IE00BK5BQT80"),
      isNew: true,
      isin: "IE00BK5BQT80",
      ter: formatEtfTer("IE00BK5BQT80", "sheet"),
      positions: "3 784 positions (31/08/2026)",
      aum: getInstrumentAum("IE00BK5BQT80", "sheet"),
      // Comptages fonds / indice recoupés chez Vanguard le 24/09/2026 (données au 31/08) ;
      // encours, frais et autres champs de la fiche restent datés du 08/09/2026.
      lastVerified: "08/09/2026",
      distribution: getInstrumentDistribution("IE00BK5BQT80"),
      pea: getInstrumentPea("IE00BK5BQT80"),
      cto: true,
      location: getInstrumentLocation("IE00BK5BQT80"),
      hook: "🌍 Un seul ETF pour les pays développés et émergents : que couvre vraiment l’All-World ?",
      whatIs: "Le FTSE All-World rassemble de grandes et moyennes entreprises de pays développés et émergents. Les plus grosses sociétés y prennent le plus de place. Le fonds peut détenir une sélection de titres pour suivre l’indice : le nombre de lignes du portefeuille et celui de l’indice peuvent différer.",
      whyInteresting: "Tu peux réunir pays développés et émergents dans une seule ligne, avec des dividendes réinvestis directement dans cette part. Tu laisses l’indice fixer la répartition entre les pays, sans devoir ajuster toi-même plusieurs ETF.",
      whatToKnow: "Les grandes capitalisations pèsent le plus lourd dans l’indice : posséder beaucoup de titres ne signifie pas que chacun influence autant la performance.",
      verdict: "Une seule ligne pour mêler pays développés et émergents en CTO. Vérifie ce que tu possèdes déjà avant d’en ajouter une deuxième très proche.",
      question: "Si tu détenais déjà un MSCI World, remplacerais-tu cette ligne par un All-World ou ajouterais-tu les émergents à part ?"
    },

    // ---------- SECTORIELS CLASSIQUES ----------
    {
      id: "semiconducteurs",
      category: "Sectoriels classiques",
      name: getInstrumentName("IE000I8KRLL9", "sheet"),
      listing: getPreferredInstrumentListing("IE000I8KRLL9"),
      isNew: false,
      isin: "IE000I8KRLL9",
      ter: formatEtfTer("IE000I8KRLL9", "sheet"),
      positions: "~30 positions",
      aum: getInstrumentAum("IE000I8KRLL9", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE000I8KRLL9"),
      pea: getInstrumentPea("IE000I8KRLL9"),
      cto: true,
      location: getInstrumentLocation("IE000I8KRLL9"),
      hook: "🔬 Derrière l’IA et nos appareils, il y a des puces. Comment investir dans les entreprises qui les produisent ?",
      whatIs: "Son indice cible les fabricants de semi-conducteurs et les équipementiers qui rendent leur production possible. Tu suis donc plusieurs maillons de la fabrication des puces, au sein d’un même secteur. Le résultat dépend à la fois de la demande et des investissements nécessaires pour y répondre.",
      whyInteresting: "Tu veux suivre les fabricants de puces, mais tu hésites à choisir une seule entreprise ? Cet ETF répartit cette exposition entre plusieurs acteurs. Le besoin de calcul peut progresser, mais les cycles industriels et la concurrence continuent à compter.",
      whatToKnow: "La demande en puces suit des cycles. Quelques entreprises peuvent peser lourd dans le résultat, et une exposition technologique déjà importante dans ton portefeuille accentue ce risque.",
      verdict: "Il rassemble les fabricants de puces plutôt que de faire reposer toute cette conviction sur Nvidia. Le secteur reste très cyclique.",
      question: "Tu préfères répartir ton exposition aux puces entre plusieurs fabricants ou choisir une entreprise ?"
    },
    {
      id: "sante-biotech",
      category: "Sectoriels classiques",
      name: getInstrumentName("IE00BYXG2H39", "sheet"),
      listing: getPreferredInstrumentListing("IE00BYXG2H39"),
      isNew: false,
      isin: "IE00BYXG2H39",
      ter: formatEtfTer("IE00BYXG2H39", "sheet"),
      positions: "~200 positions",
      aum: getInstrumentAum("IE00BYXG2H39", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BYXG2H39"),
      pea: getInstrumentPea("IE00BYXG2H39"),
      cto: true,
      location: getInstrumentLocation("IE00BYXG2H39"),
      hook: "🧬 Un traitement prometteur peut faire rêver. Que se passe-t-il quand tu investis dans un ETF biotech ?",
      whatIs: "Son indice rassemble des entreprises de biotechnologie et de pharmacie cotées au Nasdaq. Tu retrouves des laboratoires déjà établis et des entreprises dont les perspectives dépendent davantage de nouveaux traitements. Leurs résultats peuvent être très sensibles aux essais cliniques et aux autorisations.",
      whyInteresting: "Tu n’as pas à miser toute cette exposition sur la réussite d’un seul traitement : plusieurs entreprises sont réunies dans la même ligne. Cette répartition réduit le poids d’un échec individuel, sans faire disparaître les risques du secteur.",
      whatToKnow: "Une biotech peut fortement varier après un essai clinique ou une décision réglementaire. Le secteur est bien moins défensif qu’un indice de santé généraliste.",
      verdict: "Une exposition ciblée aux biotechnologies américaines, avec des résultats très dépendants des essais cliniques et des autorisations.",
      question: "Pour investir dans la santé, tu choisirais la biotech ou un indice santé plus large ?"
    },
    {
      id: "energie",
      category: "Sectoriels classiques",
      name: getInstrumentName("IE00BYTRR863", "sheet"),
      listing: getPreferredInstrumentListing("IE00BYTRR863"),
      isNew: false,
      isin: "IE00BYTRR863",
      ter: formatEtfTer("IE00BYTRR863", "sheet"),
      positions: "~100 positions",
      aum: getInstrumentAum("IE00BYTRR863", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BYTRR863"),
      pea: getInstrumentPea("IE00BYTRR863"),
      cto: true,
      location: getInstrumentLocation("IE00BYTRR863"),
      hook: "🛢️ Le pétrole monte. Est-ce que les actions d’un ETF énergie vont forcément suivre ?",
      whatIs: "Son indice rassemble des entreprises du secteur énergétique des marchés développés, notamment actives dans le pétrole et le gaz. Tu détiens leurs actions : leurs coûts, leurs investissements et leurs décisions influencent aussi le résultat, en plus du prix des hydrocarbures.",
      whyInteresting: "Tu veux donner plus de place aux entreprises énergétiques sans choisir une seule major ? Cette ligne te permet de les réunir. C’est une exposition à leur activité et à leurs bénéfices, avec une forte sensibilité au cycle énergétique.",
      whatToKnow: "Les cours du pétrole et du gaz pèsent sur les résultats. Les dividendes peuvent varier, et cet ETF reste concentré sur un secteur sensible aux décisions politiques.",
      verdict: "Pour ajouter les grandes sociétés énergétiques mondiales à ton portefeuille. Leur résultat reste lié au cycle des hydrocarbures.",
      question: "Tu vois cette ligne comme une exposition durable ou comme un pari sur le cycle du pétrole ?"
    },
    {
      id: "defense",
      category: "Sectoriels classiques",
      name: getInstrumentName("IE000YYE6WK5", "sheet"),
      listing: getPreferredInstrumentListing("IE000YYE6WK5"),
      isNew: false,
      isin: "IE000YYE6WK5",
      ter: formatEtfTer("IE000YYE6WK5", "sheet"),
      positions: "~30 positions",
      aum: getInstrumentAum("IE000YYE6WK5", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE000YYE6WK5"),
      pea: getInstrumentPea("IE000YYE6WK5"),
      cto: true,
      location: getInstrumentLocation("IE000YYE6WK5"),
      hook: "🛡️ Les budgets de défense attirent l’attention. Mais qu’achètes-tu avec un ETF sur ce secteur ?",
      whatIs: "Son indice sélectionne des entreprises liées à la défense et à ses équipements. Leur activité dépend notamment des programmes militaires et des commandes publiques. Tu réunis plusieurs fournisseurs, avec des métiers et des implantations différents.",
      whyInteresting: "Tu peux suivre plusieurs entreprises de défense sans avoir à choisir le fabricant qui décrochera les prochains contrats. Les commandes peuvent soutenir l’activité, mais les attentes des investisseurs peuvent déjà être intégrées au prix des actions.",
      whatToKnow: "Une hausse des budgets ne garantit pas une hausse du cours : les attentes peuvent déjà être intégrées dans les prix. Le fonds reste sectoriel et ses frais sont à comparer à ceux d’un ETF large.",
      verdict: "Un accès diversifié aux entreprises de défense, avec une question à se poser avant les chiffres : est-ce compatible avec tes convictions ?",
      question: "La défense aurait-elle sa place dans ton portefeuille, même avec un poids limité ?"
    },
    {
      id: "cybersecurite",
      category: "Sectoriels classiques",
      name: getInstrumentName("IE00BYPLS672", "sheet"),
      listing: getPreferredInstrumentListing("IE00BYPLS672"),
      isNew: false,
      isin: "IE00BYPLS672",
      ter: formatEtfTer("IE00BYPLS672", "sheet"),
      positions: "~30 positions",
      aum: getInstrumentAum("IE00BYPLS672", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BYPLS672"),
      pea: getInstrumentPea("IE00BYPLS672"),
      cto: true,
      location: getInstrumentLocation("IE00BYPLS672"),
      hook: "🔐 Protéger les données devient essentiel. Comment un ETF transforme-t-il ce besoin en investissement ?",
      whatIs: "Son indice rassemble des fournisseurs de solutions de cybersécurité. Tu investis dans les entreprises qui développent ces outils et ces services, avec des modèles économiques différents. Leur capacité à gagner des clients et à conserver leurs marges compte autant que la progression du marché.",
      whyInteresting: "Tu retrouves plusieurs entreprises de protection numérique dans une ligne dédiée, sans devoir choisir un seul spécialiste de la cybersécurité. Cela permet de cibler cette activité plus précisément qu’avec un ETF technologique généraliste.",
      whatToKnow: `La demande peut progresser sans que chaque action monte : concurrence, valorisations et bénéfices comptent aussi. Avec des frais de ${formatEtfTer("IE00BYPLS672", "index")} par an, le thème doit justifier sa place dans ton portefeuille.`,
      verdict: "Il permet de suivre plusieurs entreprises de cybersécurité sans choisir un seul gagnant. Reste à vérifier le prix payé pour cette croissance attendue.",
      question: "Tu préfères une exposition dédiée à la cybersécurité ou la tech déjà présente dans ton ETF World ?"
    },
    {
      id: "eau",
      category: "Sectoriels classiques",
      name: getInstrumentName("FR0010527275", "sheet"),
      listing: getPreferredInstrumentListing("FR0010527275"),
      isNew: false,
      isin: "FR0010527275",
      ter: formatEtfTer("FR0010527275", "sheet"),
      positions: "~30 positions",
      aum: getInstrumentAum("FR0010527275", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("FR0010527275"),
      pea: getInstrumentPea("FR0010527275"),
      cto: true,
      location: getInstrumentLocation("FR0010527275"),
      hook: "💧 L’eau est indispensable. Mais que détient vraiment un ETF consacré à cette ressource ?",
      whatIs: "Le fonds suit des entreprises liées au traitement, à la distribution et à la gestion de l’eau. On y retrouve des services et des équipements industriels. Tu investis donc dans les activités de ces sociétés, dont les bénéfices dépendent de leurs contrats, de leurs coûts et de leurs investissements.",
      whyInteresting: "Tu peux suivre ces métiers dans une seule ligne, sans devoir choisir entre les différentes entreprises liées à l’eau. Le besoin d’eau donne du sens au thème, mais il faut regarder comment chaque entreprise transforme ce besoin en revenus.",
      whatToKnow: `L’eau est indispensable, mais cela ne rend pas les actions du fonds peu risquées. Regarde les entreprises réellement détenues et les frais de ${formatEtfTer("FR0010527275", "index")} par an avant de te fier au thème.`,
      verdict: "Une exposition aux entreprises liées à l’eau, qui ne revient pas à investir directement dans le prix de cette ressource.",
      question: "Dans un ETF eau, tu cherches surtout les services publics ou les technologies de traitement ?"
    },
    {
      id: "luxe",
      category: "Sectoriels classiques",
      name: getInstrumentName("LU1681048630", "sheet"),
      listing: getPreferredInstrumentListing("LU1681048630"),
      isNew: false,
      isin: "LU1681048630",
      ter: formatEtfTer("LU1681048630", "sheet"),
      positions: "~80 positions",
      // Actif géré 478,37 M€ au 31/08/2026, fiche émetteur Amundi ; vérifié le 25/09/2026.
      // https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/RETAIL/ETF
      aum: getInstrumentAum("LU1681048630", "sheet"),
      lastVerified: "25/09/2026",
      distribution: getInstrumentDistribution("LU1681048630"),
      pea: getInstrumentPea("LU1681048630"),
      cto: true,
      location: getInstrumentLocation("LU1681048630"),
      hook: "💎 Une marque peut faire rêver. Est-ce suffisant pour que son action soit un bon investissement ?",
      whatIs: "Son indice rassemble des entreprises du luxe et des biens haut de gamme. Tu suis des marques présentes sur plusieurs marchés, dont les résultats dépendent de la demande, de leur image et de leur capacité à préserver leurs marges.",
      whyInteresting: "Tu t’exposes à plusieurs groupes de luxe, plutôt que de faire dépendre toute cette ligne de la réussite d’une seule maison. Une marque forte peut soutenir son activité, mais le prix payé en Bourse reste une question à part entière.",
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
      name: getInstrumentName("IE00BJ5JP097", "sheet"),
      listing: getPreferredInstrumentListing("IE00BJ5JP097"),
      isNew: true,
      isin: "IE00BJ5JP097",
      ter: formatEtfTer("IE00BJ5JP097", "sheet"),
      positions: "228 positions",
      aum: getInstrumentAum("IE00BJ5JP097", "sheet"),
      lastVerified: "08/09/2026",
      distribution: getInstrumentDistribution("IE00BJ5JP097"),
      pea: getInstrumentPea("IE00BJ5JP097"),
      cto: true,
      location: getInstrumentLocation("IE00BJ5JP097"),
      hook: "🏦 Banques, assureurs, paiements : sais-tu ce que regroupe un ETF sur les financières ?",
      whatIs: "Son indice rassemble des sociétés financières des marchés développés. Leurs métiers diffèrent : prêter, assurer ou faciliter les paiements ne repose pas sur les mêmes sources de revenus. Les taux et la qualité du crédit peuvent donc avoir des effets différents selon les entreprises.",
      whyInteresting: "Tu peux renforcer le secteur financier avec une seule ligne, tout en réunissant plusieurs métiers plutôt qu’une banque choisie isolément. Cela mérite de regarder la composition plutôt que de résumer le fonds aux seules banques.",
      whatToKnow: "Une hausse des taux peut aider certaines banques et en pénaliser d’autres. Les crises de crédit restent un risque majeur. La part distribue des revenus, à prendre en compte sur CTO.",
      verdict: "Pour augmenter délibérément la part des banques et autres sociétés financières dans un portefeuille mondial.",
      question: "Tu veux surpondérer la finance ou laisser ton ETF World déterminer son poids ?"
    },
    {
      id: "immobilier-reit",
      category: "Sectoriels classiques",
      name: getInstrumentName("IE00B1FZS350", "sheet"),
      listing: getPreferredInstrumentListing("IE00B1FZS350"),
      isNew: true,
      isin: "IE00B1FZS350",
      ter: formatEtfTer("IE00B1FZS350", "sheet"),
      positions: "339 positions",
      aum: getInstrumentAum("IE00B1FZS350", "sheet"),
      lastVerified: "08/09/2026",
      distribution: getInstrumentDistribution("IE00B1FZS350"),
      pea: getInstrumentPea("IE00B1FZS350"),
      cto: true,
      location: getInstrumentLocation("IE00B1FZS350"),
      hook: "🏢 Acheter de l’immobilier avec un ETF : pourquoi sa valeur peut-elle bouger chaque jour ?",
      whatIs: "Le fonds suit des sociétés immobilières cotées et des foncières. Tu détiens leurs actions, qui se négocient en Bourse. Leurs immeubles, leurs loyers et leur financement influencent leur activité, tandis que le marché fait varier le prix auquel tu peux acheter ou vendre ces titres.",
      whyInteresting: "Tu peux accéder à plusieurs entreprises immobilières sans acheter ni gérer un bien toi-même, depuis une seule ligne en Bourse. Cette facilité d’achat et de vente s’accompagne toutefois des fluctuations du marché boursier.",
      whatToKnow: `Les foncières cotées peuvent chuter comme les autres actions, surtout quand les taux montent. Ne confonds pas leurs distributions avec des loyers garantis ; les frais sont de ${formatEtfTer("IE00B1FZS350", "index")} par an.`,
      verdict: "De l’immobilier coté, achetable comme une action. Sa liquidité ne le protège ni des baisses en Bourse ni des variations de taux.",
      question: "Tu choisirais les foncières cotées pour leur liquidité, malgré leurs variations quotidiennes ?"
    },
    {
      id: "technologie",
      category: "Sectoriels classiques",
      name: getInstrumentName("IE00BJ5JNY98", "sheet"),
      listing: getPreferredInstrumentListing("IE00BJ5JNY98"),
      isNew: true,
      isin: "IE00BJ5JNY98",
      ter: formatEtfTer("IE00BJ5JNY98", "sheet"),
      positions: "161 positions",
      aum: getInstrumentAum("IE00BJ5JNY98", "sheet"),
      lastVerified: "08/09/2026",
      distribution: getInstrumentDistribution("IE00BJ5JNY98"),
      pea: getInstrumentPea("IE00BJ5JNY98"),
      cto: true,
      location: getInstrumentLocation("IE00BJ5JNY98"),
      hook: "💻 Un ETF technologique peut contenir beaucoup d’entreprises… et dépendre fortement de quelques-unes.",
      whatIs: "Son indice rassemble des entreprises du secteur des technologies de l’information dans les marchés développés. Il couvre plusieurs métiers, notamment les logiciels, le matériel et les semi-conducteurs. Les très grandes sociétés peuvent occuper une place importante dans cette sélection.",
      whyInteresting: "Tu veux renforcer la technologie sans choisir une seule entreprise ? Cette ligne réunit plusieurs activités du secteur. Mais une nouvelle ligne ne suffit pas à diversifier si elle reprend les entreprises qui pèsent déjà lourd dans ton portefeuille.",
      whatToKnow: "Quelques très grandes entreprises pèsent lourd dans le fonds. Compare ses premières positions à celles de tes ETF World et Nasdaq-100 pour mesurer le chevauchement.",
      verdict: "Une façon de surpondérer toute la tech mondiale. Regarde les premières lignes : elles peuvent déjà peser lourd dans ton ETF World.",
      question: "Combien de tes principales positions se retrouveraient à la fois ici et dans ton ETF World ?"
    },

    // ---------- THÉMATIQUES ÉMERGENTES / NICHE ----------
    {
      id: "quantique",
      category: "Thématiques émergentes",
      name: getInstrumentName("IE0007Y8Y157", "sheet"),
      listing: getPreferredInstrumentListing("IE0007Y8Y157"),
      isNew: true,
      isin: "IE0007Y8Y157",
      ter: formatEtfTer("IE0007Y8Y157", "sheet"),
      positions: "30 positions",
      aum: getInstrumentAum("IE0007Y8Y157", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE0007Y8Y157"),
      pea: getInstrumentPea("IE0007Y8Y157"),
      cto: true,
      location: getInstrumentLocation("IE0007Y8Y157"),
      hook: "⚛️ L’informatique quantique fait rêver. Mais que contiennent les ETF qui portent ce nom ?",
      whatIs: "Le fonds rassemble des entreprises liées à l’informatique quantique. Pour certaines, ce thème est central ; pour d’autres, il représente une partie de leurs projets. Tu réunis donc des sociétés dont l’exposition et la maturité commerciale peuvent être très différentes.",
      whyInteresting: "Tu peux suivre plusieurs acteurs du quantique sans devoir choisir entre une jeune entreprise et un groupe déjà établi. Le point décisif reste leur capacité à transformer la technologie en usages commerciaux, puis en bénéfices.",
      whatToKnow: `Avec environ 30 lignes, le fonds reste concentré et ses variations peuvent être fortes. Les frais sont de ${formatEtfTer("IE0007Y8Y157", "index")} par an. Les hausses passées ne disent pas si ces entreprises transformeront la technologie en bénéfices.`,
      verdict: "Une petite position thématique éventuelle, pour qui accepte une forte volatilité et un résultat très incertain.",
      question: "Si tu voulais investir dans le quantique, tu choisirais cet ETF ou quelques entreprises précises ?"
    },
    {
      id: "ia",
      category: "Thématiques émergentes",
      name: getInstrumentName("IE00BK5BCD43", "sheet"),
      listing: getPreferredInstrumentListing("IE00BK5BCD43"),
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
      aum: getInstrumentAum("IE00BK5BCD43", "sheet"),
      lastVerified: "25/09/2026",
      distribution: getInstrumentDistribution("IE00BK5BCD43"),
      pea: getInstrumentPea("IE00BK5BCD43"),
      cto: true,
      location: getInstrumentLocation("IE00BK5BCD43"),
      hook: "🧠 Tout le monde parle d’IA. Mais quelles entreprises achètes-tu dans un ETF consacré à ce thème ?",
      whatIs: "Son indice cherche des entreprises liées à plusieurs maillons de l’intelligence artificielle : infrastructures, logiciels et applications. Il couvre donc des métiers différents. Le nom du thème ne dit pas, à lui seul, quelle part des revenus de chaque société dépend réellement de l’IA.",
      whyInteresting: "Tu veux suivre les entreprises liées à l’IA, mais tu ne sais pas laquelle en profitera le plus ? Cette ligne en réunit plusieurs. La composition mérite qu’on s’y attarde : elle détermine l’exposition concrète bien davantage que l’étiquette du fonds.",
      whatToKnow: "Le thème ne dit pas combien ces entreprises gagneront grâce à l’IA. Regarde les titres détenus et leur poids : tu peux déjà posséder plusieurs de ces sociétés dans un ETF technologique ou mondial.",
      verdict: "Cet ETF rassemble plusieurs métiers liés à l’IA. Vérifie sa composition avant de supposer qu’il suit uniquement les fabricants de modèles ou de puces.",
      question: "Tu veux investir dans les fabricants de puces, les logiciels ou l’ensemble de la chaîne IA ?"
    },
    {
      id: "robotique",
      category: "Thématiques émergentes",
      name: getInstrumentName("IE00BYZK4552", "sheet"),
      listing: getPreferredInstrumentListing("IE00BYZK4552"),
      isNew: false,
      isin: "IE00BYZK4552",
      ter: formatEtfTer("IE00BYZK4552", "sheet"),
      positions: "~120 positions",
      aum: getInstrumentAum("IE00BYZK4552", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BYZK4552"),
      pea: getInstrumentPea("IE00BYZK4552"),
      cto: true,
      location: getInstrumentLocation("IE00BYZK4552"),
      hook: "🤖 Tu vois passer des robots partout. Mais quand tu achètes un ETF robotique, qu’est-ce que tu achètes vraiment ?",
      whatIs: "Son indice rassemble des entreprises liées à l’automatisation et à la robotique. Tu retrouves plusieurs métiers autour des machines et des équipements qui automatisent des tâches. Pour comprendre cette exposition, il faut donc regarder les entreprises détenues et les activités qui leur rapportent de l’argent.",
      whyInteresting: "Tu retrouves plusieurs entreprises de la robotique dans une seule ligne, sans avoir à deviner laquelle prendra le dessus. Mais une technologie peut changer notre quotidien et décevoir en Bourse : la concurrence, les bénéfices et le prix des actions comptent aussi.",
      whatToKnow: "La composition compte plus que l’étiquette « robotique » : certaines sociétés n’en tirent qu’une partie de leurs revenus. Les investissements industriels peuvent ralentir avec l’économie.",
      verdict: "Une exposition à l’automatisation des entreprises, plus concrète que le seul récit autour de l’IA générative.",
      question: "Tu donnerais une place à la robotique dans ton portefeuille, ou une exposition mondiale te suffit ?"
    },
    {
      id: "blockchain",
      category: "Thématiques émergentes",
      name: getInstrumentName("IE000RDRMSD1", "sheet"),
      listing: getPreferredInstrumentListing("IE000RDRMSD1"),
      isNew: false,
      isin: "IE000RDRMSD1",
      ter: formatEtfTer("IE000RDRMSD1", "sheet"),
      positions: "~50 positions",
      aum: getInstrumentAum("IE000RDRMSD1", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE000RDRMSD1"),
      pea: getInstrumentPea("IE000RDRMSD1"),
      cto: true,
      location: getInstrumentLocation("IE000RDRMSD1"),
      hook: "🔗 Un ETF blockchain suit-il vraiment la même chose que du bitcoin ?",
      whatIs: "Le fonds rassemble des actions d’entreprises liées à l’écosystème blockchain et crypto, comme les plateformes, les mineurs et les fournisseurs d’infrastructures. Tu t’exposes à leur activité. Leur financement, leurs coûts et leur gestion ajoutent des risques à ceux du marché crypto.",
      whyInteresting: "Tu peux suivre plusieurs sociétés liées à la blockchain depuis ton compte-titres, en achetant leurs actions au travers du fonds. Il faut toutefois distinguer la réussite de ces entreprises de l’évolution du prix des cryptomonnaies auxquelles elles sont liées.",
      whatToKnow: "Tu détiens des actions, pas du bitcoin. Leurs cours peuvent pourtant suivre fortement le marché crypto et subir en plus les risques propres à chaque entreprise.",
      verdict: "Tu achètes ici des actions d’entreprises liées à la blockchain, pas du Bitcoin. Leurs risques d’entreprise s’ajoutent au cycle crypto.",
      question: "Tu préférerais détenir directement du Bitcoin ou des sociétés exposées à son écosystème ?"
    },
    {
      id: "nucleaire",
      category: "Thématiques émergentes",
      name: getInstrumentName("IE000M7V94E1", "sheet"),
      listing: getPreferredInstrumentListing("IE000M7V94E1"),
      isNew: false,
      isin: "IE000M7V94E1",
      ter: formatEtfTer("IE000M7V94E1", "sheet"),
      positions: "~25 positions",
      aum: getInstrumentAum("IE000M7V94E1", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE000M7V94E1"),
      pea: getInstrumentPea("IE000M7V94E1"),
      cto: true,
      location: getInstrumentLocation("IE000M7V94E1"),
      hook: "☢️ Le nucléaire attire les investisseurs. Mais quelle partie de la filière achètes-tu avec cet ETF ?",
      whatIs: "Son indice rassemble des entreprises liées à l’uranium et aux technologies nucléaires. Il couvre plusieurs maillons de la filière, avec des activités et des projets à des stades différents. Une société minière et un industriel n’ont pas les mêmes coûts ni les mêmes perspectives.",
      whyInteresting: "Tu retrouves plusieurs activités liées au nucléaire dans une seule ligne, sans devoir miser sur un acteur isolé de cette filière. Pour apprécier l’exposition, il faut regarder ce qui pèse réellement dans le fonds : les besoins en électricité ne disent pas quels acteurs en tireront des bénéfices.",
      whatToKnow: "Un besoin accru d’électricité ne garantit pas des gains pour chaque entreprise du fonds. Les prix de l’uranium, les coûts des projets et les décisions publiques peuvent peser lourd.",
      verdict: "Il réunit plusieurs maillons du nucléaire. La demande d’électricité ne suffit pas, à elle seule, à garantir la hausse de ces actions.",
      question: "Tu chercherais plutôt les producteurs d’uranium ou les industriels du nucléaire ?"
    },
    {
      id: "batteries-ve",
      category: "Thématiques émergentes",
      name: getInstrumentName("IE00BF0M2Z96", "sheet"),
      listing: getPreferredInstrumentListing("IE00BF0M2Z96"),
      isNew: false,
      isin: "IE00BF0M2Z96",
      ter: formatEtfTer("IE00BF0M2Z96", "sheet"),
      positions: "~40 positions",
      aum: getInstrumentAum("IE00BF0M2Z96", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BF0M2Z96"),
      pea: getInstrumentPea("IE00BF0M2Z96"),
      cto: true,
      location: getInstrumentLocation("IE00BF0M2Z96"),
      hook: "🔋 Les batteries prennent de la place dans notre quotidien. Qui en tire vraiment les bénéfices ?",
      whatIs: "Son indice couvre plusieurs activités de la chaîne des batteries : matières premières, fabrication et véhicules électriques. Tu réunis des entreprises dont les résultats peuvent réagir différemment au coût des matériaux, aux capacités de production et à la demande.",
      whyInteresting: "Tu peux suivre la filière des batteries et des véhicules électriques sans faire dépendre toute cette exposition d’un seul constructeur. La progression des usages ne garantit toutefois pas celle des marges : une entreprise peut vendre davantage et gagner moins.",
      whatToKnow: "La croissance du marché ne protège pas les marges des entreprises. Surcapacités, prix des matières premières et concurrence peuvent rendre cette ligne très volatile.",
      verdict: "Une exposition à toute la chaîne des batteries, pas seulement aux constructeurs automobiles. Le thème a déjà montré qu’une tendance de fond peut décevoir en Bourse.",
      question: "Tu regarderais plutôt les fabricants de batteries ou les fournisseurs de matériaux ?"
    },

    // ---------- SPATIAL ----------
    {
      id: "spatial",
      category: "Spatial",
      name: getInstrumentName("IE000YU9K6K2", "sheet"),
      listing: getPreferredInstrumentListing("IE000YU9K6K2"),
      isNew: true,
      isin: "IE000YU9K6K2",
      ter: formatEtfTer("IE000YU9K6K2", "sheet"),
      positions: "25 positions",
      aum: getInstrumentAum("IE000YU9K6K2", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE000YU9K6K2"),
      pea: getInstrumentPea("IE000YU9K6K2"),
      cto: true,
      location: getInstrumentLocation("IE000YU9K6K2"),
      hook: "🚀 Investir dans le spatial fait rêver. Mais quelles activités se cachent dans cet ETF ?",
      whatIs: "Son indice rassemble des entreprises liées à l’économie spatiale, notamment aux satellites, aux équipements et aux services associés. Le thème couvre plusieurs métiers : la place de chacun dans le fonds compte pour comprendre ce que tu détiens réellement.",
      whyInteresting: "Tu peux réunir plusieurs entreprises de l’univers spatial dans une même ligne, plutôt que miser sur un seul projet. Il faut toutefois regarder leurs activités actuelles, leurs contrats et leurs besoins de financement au-delà des projets annoncés.",
      whatToKnow: "L’univers reste étroit et le thème couvre des métiers très différents. Vérifie les positions : le nom de l’ETF ne suffit pas à dire quelle part des revenus vient réellement du spatial.",
      verdict: "Une exposition très ciblée à l’économie spatiale, avec peu de recul sur plusieurs entreprises du secteur.",
      question: "Quelles activités spatiales voudrais-tu réellement détenir : satellites, lanceurs ou équipements ?"
    },

    // ---------- STRATÉGIQUES ----------
    {
      id: "dividendes",
      category: "Stratégiques",
      name: getInstrumentName("IE00B6YX5D40", "sheet"),
      listing: getPreferredInstrumentListing("IE00B6YX5D40"),
      isNew: false,
      isin: "IE00B6YX5D40",
      ter: formatEtfTer("IE00B6YX5D40", "sheet"),
      positions: "~120 positions",
      aum: getInstrumentAum("IE00B6YX5D40", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00B6YX5D40"),
      pea: getInstrumentPea("IE00B6YX5D40"),
      cto: true,
      location: getInstrumentLocation("IE00B6YX5D40"),
      hook: "💸 Des entreprises qui augmentent leur dividende depuis longtemps : que sélectionne vraiment cet ETF ?",
      whatIs: "Son indice sélectionne des sociétés américaines selon leur historique de hausse du dividende. Cette règle change la composition par rapport à un indice américain classique. La part distribue des revenus, dont le montant dépend aussi des versements reçus par le fonds.",
      whyInteresting: "Tu retrouves des entreprises ayant un long historique de distributions en hausse, sans devoir les sélectionner une par une. Pour juger le placement, il faut aussi regarder l’évolution de la valeur des parts : les revenus ne racontent qu’une partie du résultat.",
      whatToKnow: "Un historique de hausses n’est pas une promesse : le dividende peut être réduit. Le fonds écarte beaucoup de valeurs de croissance et les distributions ont une incidence fiscale sur CTO.",
      verdict: "Une sélection de sociétés américaines ayant augmenté leur dividende pendant au moins vingt ans. La régularité du versement ne garantit pas le rendement total.",
      question: "Tu regardes d’abord le dividende versé ou la performance totale de ton placement ?"
    },
    {
      id: "covered-call",
      category: "Stratégiques",
      name: getInstrumentName("IE00BM8R0J59", "sheet"),
      listing: getPreferredInstrumentListing("IE00BM8R0J59"),
      isNew: false,
      isin: "IE00BM8R0J59",
      ter: formatEtfTer("IE00BM8R0J59", "sheet"),
      positions: "~100 positions",
      aum: getInstrumentAum("IE00BM8R0J59", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BM8R0J59"),
      pea: getInstrumentPea("IE00BM8R0J59"),
      cto: true,
      location: getInstrumentLocation("IE00BM8R0J59"),
      // Global X, page produit consultée le 29/09/2026 : stratégie synthétique sur
      // l'indice Cboe Nasdaq-100 BuyWrite v2 UCITS, sans détention directe garantie des 100 titres.
      // https://globalxetfs.eu/fr/funds/qyld
      hook: "💰 Des distributions chaque mois avec le Nasdaq-100 : quel compromis se cache derrière ?",
      whatIs: "Le fonds suit une stratégie qui combine une exposition au Nasdaq-100 et la vente d’options d’achat couvertes. Ces options génèrent des primes, mais elles limitent une partie du potentiel de hausse. Les distributions mensuelles viennent donc d’une stratégie différente de la simple détention de l’indice.",
      whyInteresting: "Si ce sont les distributions qui attirent ton attention, c’est bien le point central de cette stratégie : elle vise des versements réguliers. Pour comparer ce fonds au Nasdaq-100 classique, il faut additionner les sommes reçues et la variation de la valeur des parts, plutôt que regarder uniquement les versements.",
      whatToKnow: "Les distributions ne sont pas un rendement garanti. La vente d’options limite une partie de la hausse lorsque le Nasdaq s’envole, tandis que le fonds reste exposé aux baisses.",
      verdict: "Des distributions régulières en échange d’une partie du potentiel de hausse du Nasdaq-100. À comparer avec la détention directe de l’indice.",
      question: "Accepterais-tu de limiter la hausse possible pour recevoir des distributions mensuelles ?"
    },
    {
      id: "low-volatility",
      category: "Stratégiques",
      name: getInstrumentName("IE00B8FHGS14", "sheet"),
      listing: getPreferredInstrumentListing("IE00B8FHGS14"),
      isNew: false,
      isin: "IE00B8FHGS14",
      ter: formatEtfTer("IE00B8FHGS14", "sheet"),
      positions: "~300 positions",
      aum: getInstrumentAum("IE00B8FHGS14", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00B8FHGS14"),
      pea: getInstrumentPea("IE00B8FHGS14"),
      cto: true,
      location: getInstrumentLocation("IE00B8FHGS14"),
      hook: "🌊 Un ETF « minimum volatility » peut-il baisser ? Oui. Alors que cherche-t-il à changer ?",
      whatIs: "Son indice sélectionne et pondère des actions du MSCI World pour rechercher un portefeuille globalement moins volatil. C’est la combinaison des titres qui compte. Cette méthode modifie leur poids et peut donner une composition différente de celle d’un World classique.",
      whyInteresting: "Tu restes investi en actions, avec une sélection qui cherche à limiter les fluctuations : c’est ce comportement que tu viens chercher ici. Ce choix peut aussi modifier la participation aux hausses : il faut accepter que le résultat s’écarte de l’indice mondial habituel.",
      whatToKnow: "« Minimum volatility » ne veut pas dire sans baisse. Le fonds peut reculer avec le marché et manquer une partie des fortes hausses ; regarde aussi ses frais face à un ETF World.",
      verdict: "Un ETF World sélectionné pour réduire les fluctuations. Il peut quand même baisser et sa composition s’éloigne de l’indice classique.",
      question: "Tu accepterais de t’écarter du MSCI World pour chercher des variations moins fortes ?"
    },
    {
      id: "value",
      category: "Stratégiques",
      name: getInstrumentName("IE00BP3QZB59", "sheet"),
      listing: getPreferredInstrumentListing("IE00BP3QZB59"),
      isNew: false,
      isin: "IE00BP3QZB59",
      ter: formatEtfTer("IE00BP3QZB59", "sheet"),
      positions: "~350 positions",
      aum: getInstrumentAum("IE00BP3QZB59", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BP3QZB59"),
      pea: getInstrumentPea("IE00BP3QZB59"),
      cto: true,
      location: getInstrumentLocation("IE00BP3QZB59"),
      hook: "🔎 Une action paraît peu chère. Est-ce une opportunité ou le reflet de ses difficultés ?",
      whatIs: "Son indice sélectionne des entreprises des marchés développés selon des critères de valorisation liés à leurs fondamentaux. Tu donnes davantage de place aux sociétés jugées moins chères par cette méthode. La sélection peut donc différer sensiblement d’un indice mondial classique.",
      whyInteresting: "Tu peux suivre une sélection fondée sur la valorisation des entreprises, sans devoir repérer toi-même chaque action jugée décotée. Mais une décote peut durer : pour que ce biais fonctionne, il ne suffit pas qu’une action paraisse bon marché.",
      whatToKnow: "Une action peu chère peut le rester longtemps. Ce fonds ne garantit ni un rattrapage ni une meilleure performance qu’un indice mondial classique.",
      verdict: "Il privilégie les sociétés jugées moins chères selon les critères de l’indice. Une valorisation basse ne promet pas un rebond.",
      question: "Tu serais prêt à garder ce biais value plusieurs années s’il fait moins bien que le World ?"
    },
    {
      id: "small-caps",
      category: "Stratégiques",
      name: getInstrumentName("IE00BF4RFH31", "sheet"),
      listing: getPreferredInstrumentListing("IE00BF4RFH31"),
      isNew: false,
      isin: "IE00BF4RFH31",
      ter: formatEtfTer("IE00BF4RFH31", "sheet"),
      positions: "~3 400 positions",
      aum: getInstrumentAum("IE00BF4RFH31", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00BF4RFH31"),
      pea: getInstrumentPea("IE00BF4RFH31"),
      cto: true,
      location: getInstrumentLocation("IE00BF4RFH31"),
      hook: "🏭 Ton ETF World couvre les grands groupes. Où sont les petites entreprises ?",
      whatIs: "Le MSCI World Small Cap rassemble des petites capitalisations des marchés développés. Tu accèdes à un univers différent de celui des grandes et moyennes entreprises d’un World classique. Leur taille change aussi leur accès au financement et la facilité à négocier leurs actions.",
      whyInteresting: "Tu veux aussi détenir de petites entreprises ? Cette ligne élargit les tailles de sociétés présentes dans ton portefeuille mondial. Cette différence d’exposition peut être utile à comprendre, mais elle ne garantit pas une meilleure performance.",
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
      name: getInstrumentName("IE00BP3QZ601", "sheet"),
      listing: getPreferredInstrumentListing("IE00BP3QZ601"),
      isNew: true,
      isin: "IE00BP3QZ601",
      ter: formatEtfTer("IE00BP3QZ601", "sheet"),
      positions: "290 positions",
      aum: getInstrumentAum("IE00BP3QZ601", "sheet"),
      lastVerified: "10/09/2026",
      distribution: getInstrumentDistribution("IE00BP3QZ601"),
      pea: getInstrumentPea("IE00BP3QZ601"),
      cto: true,
      location: getInstrumentLocation("IE00BP3QZ601"),
      hook: "🔍 Une entreprise solide est-elle toujours un bon investissement ? Voici ce que sélectionne un ETF quality.",
      whatIs: "Son indice sélectionne des entreprises selon des critères de qualité financière, comme la rentabilité, l’endettement et la stabilité des résultats. Tu suis une méthode précise plutôt que la seule taille des sociétés. Certaines grandes entreprises peuvent toutefois rester communes avec le World classique.",
      whyInteresting: "Tu peux donner davantage de place à ces caractéristiques financières sans devoir analyser et sélectionner toi-même chaque entreprise. La qualité de l’entreprise et le prix auquel on achète son action restent deux questions à examiner ensemble.",
      whatToKnow: "Plusieurs grandes lignes peuvent déjà se trouver dans ton ETF World. Compare les positions et les frais pour savoir ce que cette sélection change vraiment.",
      verdict: "Un filtre de solidité appliqué aux grandes actions mondiales. Avant de l’ajouter, compare ses premières positions à celles de ton ETF World.",
      question: "Tu vois assez de différence avec le World classique pour payer ce filtre supplémentaire ?"
    },
    {
      id: "momentum",
      category: "Stratégiques",
      name: getInstrumentName("IE00BP3QZ825", "sheet"),
      listing: getPreferredInstrumentListing("IE00BP3QZ825"),
      isNew: true,
      isin: "IE00BP3QZ825",
      ter: formatEtfTer("IE00BP3QZ825", "sheet"),
      positions: "434 positions",
      aum: getInstrumentAum("IE00BP3QZ825", "sheet"),
      lastVerified: "08/09/2026",
      distribution: getInstrumentDistribution("IE00BP3QZ825"),
      pea: getInstrumentPea("IE00BP3QZ825"),
      cto: true,
      location: getInstrumentLocation("IE00BP3QZ825"),
      hook: "📈 Acheter les actions qui ont récemment monté : c’est l’idée du momentum. Mais comment ça fonctionne ?",
      whatIs: "Son indice privilégie des actions des marchés développés dont la tendance récente répond à ses critères. La sélection évolue avec les rééquilibrages. Tu suis donc une règle fondée sur les mouvements de prix, qui peut changer les entreprises et les secteurs les plus représentés.",
      whyInteresting: "Tu suis une méthode fondée sur les tendances récentes, sans avoir à sélectionner toi-même les titres qui la remplissent. Il faut accepter que la composition change et qu’une tendance favorable puisse se retourner rapidement.",
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
      name: getInstrumentName("IE00B4ND3602", "sheet"),
      listing: getPreferredInstrumentListing("IE00B4ND3602"),
      isNew: false,
      isin: "IE00B4ND3602",
      ter: formatEtfTer("IE00B4ND3602", "sheet"),
      // Encours et TER : recherche web du 25/09/2026 (justETF/fiches iShares). C'est le plus gros
      // des 4 ETC or déjà identifiés dans le Comparateur d'indices (iShares/Invesco/Amundi à
      // 0,12%, WisdomTree à 0,39%) — choisi pour cette raison, pas au hasard.
      positions: "1 seul actif : le métal physique détenu en coffre — pas un panier de titres",
      aum: getInstrumentAum("IE00B4ND3602", "sheet"),
      lastVerified: "25/09/2026",
      distribution: getInstrumentDistribution("IE00B4ND3602"),
      pea: getInstrumentPea("IE00B4ND3602"),
      cto: true,
      location: getInstrumentLocation("IE00B4ND3602"),
      hook: "🥇 De l’or en portefeuille sans gérer un coffre : qu’achètes-tu avec cet ETC ?",
      whatIs: "Chaque part donne une exposition à de l’or physique détenu en coffre. Le produit suit le prix du métal, après ses frais. Il s’agit d’un ETC : tu détiens un titre coté lié à une matière première, avec une structure différente de celle d’un ETF d’actions.",
      whyInteresting: "Tu peux accéder à l’or depuis ton compte-titres sans acheter des pièces ou organiser toi-même le stockage du métal. Ton résultat dépend surtout du cours de l’or et, en euros, des mouvements de change : le métal ne produit pas de revenu.",
      whatToKnow: "L'or ne verse aucun dividende ni coupon : sa seule source de gain est la variation de son cours. Ce cours peut aussi baisser, parfois plusieurs années de suite. Le rendement en euros dépend aussi du taux de change €/$.",
      verdict: "Une exposition directe et simple au métal physique, sans diversification interne — un seul actif, pas un panier de titres.",
      question: "L'or, une assurance que tu gardes en petite dose ou une ligne que tu évites complètement ?"
    },
    {
      id: "bitcoin",
      category: "Matières premières & Crypto",
      name: getInstrumentName("GB00BLD4ZL17", "sheet"),
      listing: getPreferredInstrumentListing("GB00BLD4ZL17"),
      isNew: false,
      isin: "GB00BLD4ZL17",
      ter: formatEtfTer("GB00BLD4ZL17", "sheet"),
      // Encours et TER : recherche web du 25/09/2026 (justETF/CoinShares). Choisi comme
      // représentant car c'est le même émetteur/ISIN que le Générateur de portefeuilles utilise
      // comme ligne principale ("bitcoin"), pas le moins cher dans l'absolu (WisdomTree égale son
      // TER à 0,15%) mais celui déjà retenu ailleurs dans l'appli.
      positions: "1 seul actif : le bitcoin détenu en garde institutionnelle — pas un panier de titres",
      aum: getInstrumentAum("GB00BLD4ZL17", "sheet"),
      lastVerified: "25/09/2026",
      distribution: getInstrumentDistribution("GB00BLD4ZL17"),
      pea: getInstrumentPea("GB00BLD4ZL17"),
      cto: true,
      location: getInstrumentLocation("GB00BLD4ZL17"),
      hook: "₿ Du bitcoin depuis un compte-titres : que change le passage par un ETP ?",
      whatIs: "Ce produit coté donne une exposition à du bitcoin détenu auprès d’un dépositaire. Tu achètes des parts sur ton compte-titres, tandis que le produit organise la conservation de l’actif. C’est un ETP, avec une structure différente d’un ETF d’actions diversifié.",
      whyInteresting: "Tu peux suivre le bitcoin depuis un produit coté, sans devoir gérer toi-même un portefeuille de cryptomonnaies et ses clés privées. Cette facilité ne réduit pas ses variations et ajoute une structure de détention, un dépositaire et des frais à comprendre.",
      whatToKnow: "Le bitcoin est extrêmement volatil : des variations de plusieurs dizaines de pourcents dans l'année, dans un sens comme dans l'autre, ne sont pas rares. Aucun revenu versé, et la valeur peut tomber à une fraction de son point haut.",
      verdict: "Une façon simple d'être exposé au bitcoin depuis un compte-titres, mais sans aucune diversification : un seul actif, à l'amplitude de variation parmi les plus fortes de cette bibliothèque.",
      question: "Le bitcoin dans ton portefeuille : une conviction assumée ou une ligne que tu préfères éviter ?"
    },

    // ---------- OBLIGATAIRES ----------
    {
      id: "obligations-etat",
      category: "Obligataires",
      name: getInstrumentName("IE00B4WXJJ64", "sheet"),
      listing: getPreferredInstrumentListing("IE00B4WXJJ64"),
      isNew: false,
      isin: "IE00B4WXJJ64",
      ter: formatEtfTer("IE00B4WXJJ64", "sheet"),
      // iShares, fiche IE00B4WXJJ64, données au 22/09/2026 : 552 lignes, duration 6,70 ans.
      // https://www.ishares.com/uk/professionals/en/products/251740/ishares-euro-government-bond-ucits-etf
      positions: "552 positions",
      aum: getInstrumentAum("IE00B4WXJJ64", "sheet"),
      lastVerified: "22/09/2026",
      distribution: getInstrumentDistribution("IE00B4WXJJ64"),
      pea: getInstrumentPea("IE00B4WXJJ64"),
      cto: true,
      location: getInstrumentLocation("IE00B4WXJJ64"),
      hook: "🏛️ Des obligations d’État dans un ETF : pourquoi sa valeur peut-elle baisser quand les taux montent ?",
      whatIs: "Le fonds détient des obligations de plusieurs États de la zone euro, avec des échéances différentes. Leur prix varie en Bourse : lorsque les taux changent, la valeur des obligations déjà émises s’ajuste. La duration aide à comprendre cette sensibilité.",
      whyInteresting: "Tu retrouves plusieurs emprunts d’État dans une même ligne, avec une part qui te verse les revenus au lieu de les réinvestir. Cette exposition apporte une autre source de risque qu’un ETF actions, mais son comportement dépend notamment des taux.",
      whatToKnow: "Avec une duration d’environ 6,7 ans, une hausse parallèle des taux d’un point pourrait entraîner une baisse approximative de 6,7 % du prix, toutes choses égales par ailleurs. Il porte aussi le risque des États présents dans l’indice.",
      verdict: "Utile si tu veux des obligations d’État en portefeuille, mais à choisir en comprenant d’abord sa sensibilité aux taux.",
      question: "Pour ta poche prudente, tu préfères ces obligations ou un fonds à duration plus courte ?"
    },
    {
      id: "high-yield",
      category: "Obligataires",
      name: getInstrumentName("IE00B66F4759", "sheet"),
      listing: getPreferredInstrumentListing("IE00B66F4759"),
      isNew: false,
      isin: "IE00B66F4759",
      ter: formatEtfTer("IE00B66F4759", "sheet"),
      positions: "~500 positions",
      aum: getInstrumentAum("IE00B66F4759", "sheet"),
      lastVerified: "25/08/2026",
      distribution: getInstrumentDistribution("IE00B66F4759"),
      pea: getInstrumentPea("IE00B66F4759"),
      cto: true,
      location: getInstrumentLocation("IE00B66F4759"),
      hook: "💶 Des obligations qui paient davantage : quel risque acceptes-tu en échange ?",
      whatIs: "Le fonds rassemble des obligations d’entreprises en euros classées dans la catégorie spéculative. Les intérêts plus élevés rémunèrent notamment un risque de crédit supérieur. Cette part distribue les revenus : leur versement et l’évolution du prix des parts contribuent ensemble au résultat.",
      whyInteresting: "Tu peux accéder à de nombreux emprunteurs sans acheter leurs obligations une par une, plutôt que faire dépendre toute la ligne d’une seule entreprise. La répartition limite le poids d’un seul émetteur, mais ne protège pas d’une dégradation générale du crédit.",
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
      name: getInstrumentName("IE00B3F81R35", "sheet"),
      listing: getPreferredInstrumentListing("IE00B3F81R35"),
      isNew: true,
      isin: "IE00B3F81R35",
      lastVerified: "14/09/2026",
      ter: formatEtfTer("IE00B3F81R35", "sheet"),
      positions: "~3 000 positions",
      aum: getInstrumentAum("IE00B3F81R35", "sheet"),
      distribution: getInstrumentDistribution("IE00B3F81R35"),
      pea: getInstrumentPea("IE00B3F81R35"),
      cto: true,
      location: getInstrumentLocation("IE00B3F81R35"),
      hook: "🏢 Prêter à des entreprises bien notées avec un ETF : est-ce vraiment sans risque ?",
      whatIs: "Son indice rassemble des obligations d’entreprises en euros de catégorie investment grade. Cette notation renseigne sur la qualité du crédit, sans garantir le remboursement. La valeur des obligations varie aussi lorsque les taux ou la perception du risque changent.",
      whyInteresting: "Tu retrouves de nombreux emprunts d’entreprises dans une seule ligne, avec une part qui distribue les revenus. Les versements ne disent pas tout : la performance de ton investissement dépend aussi du prix auquel tu achètes et revends les parts.",
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
      name: getInstrumentName("IE00BF3N7094", "sheet"),
      listing: getPreferredInstrumentListing("IE00BF3N7094"),
      isNew: true,
      isin: "IE00BF3N7094",
      lastVerified: "14/09/2026",
      ter: formatEtfTer("IE00BF3N7094", "sheet"),
      positions: "~500 positions",
      aum: getInstrumentAum("IE00BF3N7094", "sheet"),
      distribution: getInstrumentDistribution("IE00BF3N7094"),
      pea: getInstrumentPea("IE00BF3N7094"),
      cto: true,
      location: getInstrumentLocation("IE00BF3N7094"),
      hook: "♻️ Réinvestir les intérêts du high yield : que change une part capitalisante ?",
      whatIs: "Le fonds suit des obligations d’entreprises en euros de catégorie spéculative. Cette part conserve et réinvestit les revenus dans le fonds. Tu retrouves donc une exposition au crédit à haut rendement, avec un traitement des revenus différent de celui d’une part distribuante.",
      whyInteresting: "Les intérêts restent investis dans le fonds : tu n’as pas à recevoir chaque versement puis passer un nouvel ordre pour le réinvestir. La capitalisation change la manière de recevoir le résultat, mais elle ne rend pas les emprunteurs moins risqués.",
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
      name: getInstrumentName("IE00BFZPF546", "sheet"),
      listing: getPreferredInstrumentListing("IE00BFZPF546"),
      isNew: true,
      isin: "IE00BFZPF546",
      lastVerified: "14/09/2026",
      ter: formatEtfTer("IE00BFZPF546", "sheet"),
      positions: "~200 positions",
      aum: getInstrumentAum("IE00BFZPF546", "sheet"),
      distribution: getInstrumentDistribution("IE00BFZPF546"),
      pea: getInstrumentPea("IE00BFZPF546"),
      cto: true,
      location: getInstrumentLocation("IE00BFZPF546"),
      hook: "🌏 Des obligations émergentes en monnaie locale : pourquoi les intérêts ne disent-ils pas tout ?",
      whatIs: "Le fonds suit des obligations d’État de pays émergents émises dans leurs monnaies locales. Tu t’exposes donc aux emprunteurs, à leurs taux et à leurs devises. Pour un investisseur en euros, le change peut modifier fortement le résultat final.",
      whyInteresting: "Tu réunis plusieurs marchés obligataires et plusieurs monnaies dans une même ligne, sans devoir acheter chaque emprunt séparément. Pour comprendre cette exposition, il faut regarder les revenus attendus et les risques de change ensemble.",
      whatToKnow: "Une monnaie qui baisse face à l’euro peut effacer les intérêts reçus. Il faut aussi compter avec le risque souverain : le rendement affiché ne raconte pas tout.",
      verdict: "Une exposition à la fois aux obligations et aux devises émergentes. Une dépréciation des monnaies locales peut effacer les coupons reçus.",
      question: "Dans ta poche obligataire, prendrais-tu aussi le risque des monnaies émergentes ?"
    }
  ];
