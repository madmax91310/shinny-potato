// Base de données courtiers — les mentions « À vérifier » ne sont pas des réponses négatives.
// Les lignes espèces concernent uniquement le cash non investi du CTO et du PEA,
// jamais un livret ou un fonds monétaire. Chaque champ renvoie au registre PDF. Révision documentaire : 29/09/2026.
// Sources PDF initiales de cette révision ; compléments officiels dans evidence.js :
// TR https://assets.traderepublic.com/assets/files/CA_FR-en-fr.pdf (annexes 3 et 12)
// XTB https://www.xtb.com/fr/fichiers/table-des-frais-et-commissions_052026.pdf
// XTB https://xas-new-cdn.xtb.com/file/0104/53/271ced41-db62-499b-9e83-f3b4557f9bf1/fr-meet-xtb-one-pager-2026-docx.pdf
// Bourso https://www.boursobank.com/content/brochure_tarifaire/boursorama_bt.pdf
// Fortuneo https://www.fortuneo.fr/files/fortuneo-tarifs-09022026.pdf
// BD https://www.boursedirect.fr/pdf/tarifs_bd.pdf
// BD https://groupe.boursedirect.fr/download/bourse-direct-lance-ses-plans-dinvestissement-programmes-sans-frais-sur-etf-a-partir-de-quelques-euros-disponibles-sur-pea-et-compte-titres?filename=2026_BD_CP_Plan-Investissement.pdf
// Saxo https://www.home.saxo/-/media/documents/regional/fr-fr/manuals/conditions-generales-applicables-a-partir-du-9-avril-2026.pdf
// CA IDF : le PDF 04/2026 cité ci-dessous renvoie 404 au 29/09/2026.
// rank : 1 = meilleur, plus haut = moins bon (sert au surlignage).
// lastVerified : date historique de revue de la fiche, pas la date de confirmation de chaque champ.
export const BROKERS = [
  {
    id: "tr", nom: "Trade Republic", code: "TR", color: "#5FA8D3", emoji: "🔵", lastVerified: "03/09/2026",
    frais: { resume: "À vérifier", detail: "Tarif actuel PEA PDF manquant" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { resume: "Plans programmés", detail: "Tarif, choix et fréquence à vérifier" },
    garde: { resume: "À vérifier" },
    pea: { pea: true, pme: null, jeune: true },
    ifu: { rank: 1, resume: "Oui après migration FR" },
    // Contrat TR 09/2026, annexe 3 IV et annexe 12 B.V : intérêts possibles après activation
    // sur le compte général ; aucun intérêt reporté sur les espèces du PEA.
    cash: {
      cto: { resume: "Offre espèces sous conditions", detail: "3 % nouveau client jusqu’à 50 000 € · lien CTO à confirmer", post: "Offre 3 % jusqu’à 50 000 € pour nouveau client après activation ; périmètre exact des espèces CTO à confirmer.", rate: null, cap: null },
      pea: { resume: "Pas d’intérêts", detail: "Contrat PEA : intérêts non transférés", post: "Non : le contrat exclut les intérêts sur les espèces PEA.", rate: null, cap: null },
    },
    // Correction du 03/09/2026 : le transfert PEA entrant est possible chez Trade Republic.
    pointFaible: "PEA-PME : à vérifier par PDF officiel",
    transfertPea: { resume: "Entrant ✅" },
    post: {
      frais: ["Tarif PEA actuel à vérifier dans un PDF officiel."],
      dca: ["Plans programmés documentés ; tarif, nombre de titres et fréquences actuelles à vérifier."],
      garde: ["À vérifier dans un PDF tarifaire actuel."],
      pea: "PEA ✅ / PEA-PME ? / PEA Jeune ✅",
      ifu: ["✅ IFU après migration vers l'offre française ; compte non migré : à vérifier."],
      faibles: ["PEA-PME : à vérifier par PDF officiel"],
      verdict: "Tu veux investir petit et souvent sans réfléchir aux frais",
    },
  },
  {
    id: "bourso", nom: "BoursoBank", code: "BB", color: "#E4735E", emoji: "🟡", lastVerified: "09/09/2026",
    frais: { rank: 2, resume: "1,99€ puis 0,60%", detail: "Plafonné à 0,5% du montant" },
    boursomarkets: { resume: "0 € à l’achat", detail: "ETF iShares éligibles · vérifier l’ISIN · vente payante possible" },
    // Brochure 2026 p. 20 : commission de négociation gratuite, frais de gestion selon chaque DIC.
    // Nombre de fonds, périodicité exclusive et taux de 0,59% non validés par PDF officiel.
    dca: { rank: 2, resume: "0€ de négociation", detail: "Frais des fonds : voir DIC" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { resume: "À vérifier" },
    cash: {
      cto: { resume: "À vérifier", detail: "Taux, plafond et conditions non établis", post: "À vérifier : rémunération, taux, plafond et conditions non établis.", rate: null, cap: null },
      pea: { resume: "À vérifier", detail: "Taux, plafond et conditions non établis", post: "À vérifier : rémunération des espèces PEA non établie.", rate: null, cap: null },
    },
    pointFaible: "DCA : frais des fonds à vérifier. ℹ️ Ordre minimum : 100€ actions / 200€ ETF / 500€ OPCVM & Warrants / 2 500€ Bourses EU",
    transfertPea: { resume: "Entrant : à vérifier / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["1,99€ ≤500€, puis 0,60% (plafonné à 0,5% sur PEA)"],
      dca: ["⚠️ Plan d'Épargne : 0€ de commission de négociation, dès 10€/fonds/mois. Frais des fonds à vérifier dans chaque DIC."],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["À vérifier dans un PDF officiel."],
      faibles: ["Frais des fonds du plan à vérifier dans leurs DIC, ordre min ETF 200€, Bourses EU 2 500€"],
      verdict: "Tu veux un écosystème bancaire complet avec PEA-PME",
    },
  },
  {
    id: "ibkr", nom: "Interactive Brokers", code: "IBKR", color: "#7C93C9", emoji: "🟢", lastVerified: "03/09/2026",
    frais: { resume: "Dès 0,05 %", detail: "PEA · minimum selon marché et routage" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { resume: "À vérifier" },
    garde: { resume: "0 €", detail: "Droits de garde PEA" },
    pea: { pea: true, pme: null, jeune: null },
    ifu: { resume: "Oui pour le PEA" },
    cash: {
      cto: { resume: "Intérêts sous conditions", detail: "0 % sur les premiers 10 000 € · taux variable ensuite · CTO à confirmer", post: "Intérêts sur espèces éligibles : 0 % jusqu’à 10 000 € en EUR, puis taux variable selon la valeur du compte ; périmètre CTO exact à confirmer.", rate: null, cap: null },
      pea: { resume: "À vérifier", detail: "PEA non traité par le barème d’intérêts consulté", post: "À vérifier : traitement des espèces PEA non établi par la page de taux.", rate: null, cap: null },
    },
    pointFaible: "PEA-PME, PEA Jeune et intérêts PEA à confirmer",
    transfertPea: { resume: "Entrant ✅ · 0 € annoncés" },
    post: {
      frais: ["PEA : commission dès 0,05 % ; minimum variable selon le marché et le routage."],
      dca: ["À vérifier pour PEA et CTO."],
      garde: ["PEA : pas de droits de garde annoncés."],
      pea: "PEA ✅ / PEA-PME ? / PEA Jeune ?",
      ifu: ["IFU disponible pour le PEA."],
      faibles: ["PEA-PME, PEA Jeune et intérêts PEA à confirmer"],
      verdict: "tu veux un PEA avec IFU et une tarification par marché",
    },
  },
  {
    id: "fortuneo", nom: "Fortuneo", code: "FO", color: "#8C7AE6", emoji: "🟣", lastVerified: "14/09/2026",
    // Brochure officielle 09/02/2026 p. 10 : formule Starter, Euronext / Equiduct.
    // Le contrat Fortuneo établit que le PEA Jeune n’est pas commercialisé.
    frais: { rank: 2, resume: "0€ le 1er ordre/mois", detail: "Starter · Euronext/Equiduct · ≤500€, puis 0,35%" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { resume: "À vérifier" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: false },
    ifu: { resume: "À vérifier" },
    cash: {
      cto: { resume: "À vérifier", detail: "Taux, plafond et conditions non établis", post: "À vérifier : rémunération, taux, plafond et conditions non établis.", rate: null, cap: null },
      pea: { resume: "Pas d’intérêts", detail: "Conditions générales Fortuneo · PEA et PEA-PME", post: "Non : les espèces PEA et PEA-PME ne sont pas rémunérées.", rate: null, cap: null },
    },
    pointFaible: "Clôture PEA 85€, frais élevés hors Euronext ; DCA à vérifier",
    transfertPea: { resume: "Entrant : à vérifier / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["Starter sur Euronext/Equiduct : 0€ le 1er ordre du mois si ≤500€, puis 0,35% ; anciens tarifs possibles"],
      dca: ["À vérifier : absence de DCA automatique non établie par PDF."],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ❌",
      ifu: ["À vérifier dans un PDF officiel."],
      faibles: ["Clôture PEA 85€, frais élevés hors Euronext ; DCA à vérifier"],
      verdict: "Tu veux un PEA + PEA-PME chez un courtier 100% en ligne établi",
    },
  },
  {
    id: "xtb", nom: "XTB", code: "XTB", color: "#5C9EAD", emoji: "⚫", lastVerified: "14/09/2026",
    // PDF XTB 2026 : le minimum de 10€ ne s'applique pas au PEA ; conservation >250K€ facturée.
    // Page PEA officielle : espèces sans intérêts, pas de transfert entrant ni de PEA pour
    // les personnes fiscalement rattachées. Le DCA PEA et le PEA-PME restent à vérifier.
    frais: { rank: 1, resume: "0% jusqu’à 100K€/mois", detail: "Puis 0,20% · min 10€ hors PEA" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { resume: "À vérifier" },
    garde: { rank: 1, resume: "0€", detail: "0,02%/an sur l’excédent >250K€" },
    pea: { pea: true, pme: null, jeune: false },
    ifu: { resume: "À vérifier" },
    cash: {
      cto: { resume: "Intérêts sous conditions", detail: "90 j. préférentiels jusqu’à 100 000 € · taux hebdomadaire", post: "Fonds non investis : taux préférentiel pendant 90 jours jusqu’à 100 000 €, puis standard ; taux variable et périmètre CTO à confirmer.", rate: null, cap: null },
      pea: { resume: "Pas d’intérêts", detail: "Compte espèces PEA non rémunéré", post: "Non : le compte espèces du PEA ne génère pas d’intérêts.", rate: null, cap: null },
    },
    pointFaible: "DCA PEA à vérifier ; transfert entrant indisponible",
    transfertPea: { resume: "Entrant : indisponible" },
    post: {
      frais: ["0% de commission jusqu’à 100K€/mois de volume, puis 0,20% au-delà (minimum 10€ non appliqué sur PEA)"],
      dca: ["À vérifier : disponibilité d'un DCA automatique sur PEA."],
      garde: ["0€ jusqu’à 250K€ de portefeuille ; 0,02%/an sur l’excédent"],
      pea: "PEA ✅ / PEA-PME ? / PEA Jeune ❌",
      ifu: ["À vérifier par PDF officiel."],
      faibles: ["DCA PEA à vérifier ; transfert entrant indisponible"],
      verdict: "Tu passes moins de 100K€/mois et veux 0% de commission",
    },
  },
  {
    id: "caidf", nom: "CA Île-de-France", code: "CA", color: "#B08968", emoji: "🟠", lastVerified: "24/09/2026",
    // Brochure officielle régionale, tarifs particuliers au 01/04/2026, pages 28-30.
    // https://ca-paris.credit-agricole.fr/tarif/2026/CADIF_tarif2026_PART/conditions_tarifaires_particuliers_caidf_04_2026.pdf
    frais: { resume: "À vérifier", detail: "PDF tarifaire 04/2026 indisponible" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { resume: "À vérifier" },
    garde: { resume: "À vérifier", detail: "PDF tarifaire 04/2026 indisponible" },
    pea: { pea: true, pme: true, jeune: null },
    ifu: { resume: "À vérifier" },
    cash: {
      cto: { resume: "À vérifier", detail: "PDF officiel indisponible", post: "À vérifier : rémunération, taux, plafond et conditions non établis.", rate: null, cap: null },
      pea: { resume: "À vérifier", detail: "PDF officiel indisponible", post: "À vérifier : rémunération des espèces PEA non établie.", rate: null, cap: null },
    },
    pointFaible: "Brochure tarifaire 2026 indisponible : conditions à confirmer",
    transfertPea: { resume: "Sortant : à vérifier" },
    post: {
      frais: ["Barème Invest Store Intégral à vérifier dans le PDF tarifaire 2026 accessible."],
      dca: ["À vérifier."],
      garde: ["À vérifier dans le PDF tarifaire 2026 accessible."],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ?",
      ifu: ["À vérifier."],
      faibles: ["Brochure tarifaire 2026 indisponible : conditions à confirmer"],
      verdict: "Tu veux un conseiller en agence et un compte bancaire classique",
    },
  },
  {
    id: "bd", nom: "Bourse Direct", code: "BD", color: "#C98B72", emoji: "🟤", lastVerified: "03/09/2026",
    frais: { rank: 2, resume: "Palier dès 0,99€", detail: "PEA ≤198€ : 0,5% · puis jusqu’à 0,09%" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 1, resume: "Oui, PEA & CTO", detail: "ETF éligibles : 0€ de courtage ; actions : tarif habituel" },
    garde: { rank: 1, resume: "0€", detail: "Bourses étrangères : 0,036%/an" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { resume: "À vérifier" },
    cash: {
      cto: { resume: "À vérifier", detail: "Absence de rémunération non prouvée", post: "À vérifier : rémunération, taux, plafond et conditions non établis.", rate: null, cap: null },
      pea: { resume: "Pas d’intérêts", detail: "Compte espèces PEA non rémunéré", post: "Non : le compte espèces PEA n’est pas rémunéré.", rate: null, cap: null },
    },
    pointFaible: "Tarification par paliers ; cash non vérifié ; garde sur bourses étrangères",
    transfertPea: { resume: "Entrant : à vérifier / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["PEA ≤198€ : 0,5% ; puis 0,99€ jusqu’à 500€ / 1,90€ jusqu’à 1 000€ / 2,90€ jusqu’à 2 000€", "3,80€ jusqu’à 4 400€ / 0,09% au-delà"],
      dca: ["✅ Plans automatisés PEA & CTO, mensuels ou trimestriels ; ETF éligibles sans courtage, actions au tarif habituel"],
      garde: ["0€ hors bourses étrangères ; 0,036%/an sur bourses étrangères"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["À vérifier dans un PDF officiel."],
      faibles: ["Tarification par paliers ; cash à vérifier ; garde sur bourses étrangères"],
      verdict: "Tu fais des ordres ponctuels et veux un tarif par palier transparent",
    },
  },
  {
    id: "saxo", nom: "Saxo Bank", code: "SX", color: "#AAB4CC", emoji: "⚪", lastVerified: "03/09/2026",
    frais: { rank: 1, resume: "Dès 2€", detail: "Classic Euronext : 0,08% (min 2€)" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { resume: "Oui hors PEA", detail: "Plan programmé sans courtage à l’achat · PEA exclu" },
    garde: { rank: 1, resume: "0€" },
    // L'absence de PEA Jeune et les deux promotions ne sont pas établies par les PDF consultés.
    pea: { pea: true, pme: true, jeune: null },
    ifu: { rank: 1, resume: "Oui" },
    cash: {
      cto: { resume: "Intérêts sous conditions", detail: "EUR/USD · solde et niveau de compte · taux à vérifier", post: "Intérêts possibles en EUR/USD selon le solde et le niveau de compte ; taux actuel à vérifier.", rate: null, cap: null },
      pea: { resume: "Pas d’intérêts", detail: "PEA exclu de l’offre", post: "Non : les comptes PEA sont exclus de l’offre d’intérêts.", rate: null, cap: null },
    },
    pointFaible: "DCA PEA et PEA Jeune : à vérifier",
    transfertPea: { resume: "Remboursement entrant : à vérifier" },
    post: {
      frais: ["Classic Euronext : 0,08%, minimum 2€ ; plafonnement PEA à 0,5%"],
      dca: ["Plan Épargne Programmé : sans commission d’achat ni frais mensuels ; actuellement indisponible sur PEA."],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ?",
      ifu: ["✅ Oui"],
      faibles: ["DCA PEA et PEA Jeune : à vérifier"],
      verdict: "Tu veux une plateforme avec courtage Euronext dès 2€",
    },
  },
];

export const ROWS = [
  { key: "frais", icon: "💰", label: "Frais (PEA)" },
  { key: "boursomarkets", icon: "🛒", label: "Boursomarkets" },
  { key: "dca", icon: "📈", label: "DCA / invest. programmé" },
  { key: "garde", icon: "🛡️", label: "Frais de garde" },
  { key: "ifu", icon: "📄", label: "IFU" },
];

// Liste des duels de la série — passe "done" à true au fil des publications.
export const DUELS = [
  { a: "tr", b: "bourso", done: true },
  { a: "tr", b: "xtb", done: true },
  { a: "tr", b: "fortuneo", done: true },
  { a: "tr", b: "ibkr", done: true },
  { a: "bourso", b: "ibkr", done: true },
  { a: "bourso", b: "fortuneo", done: false },
  { a: "bourso", b: "xtb", done: false },
  { a: "ibkr", b: "fortuneo", done: false },
  { a: "ibkr", b: "xtb", done: false },
  { a: "fortuneo", b: "xtb", done: false },
  { a: "tr", b: "caidf", done: false },
  { a: "tr", b: "bd", done: false },
  { a: "tr", b: "saxo", done: false },
  { a: "bourso", b: "caidf", done: false },
  { a: "bourso", b: "bd", done: false },
  { a: "bourso", b: "saxo", done: false },
  { a: "ibkr", b: "caidf", done: false },
  { a: "ibkr", b: "bd", done: false },
  { a: "ibkr", b: "saxo", done: false },
  { a: "fortuneo", b: "caidf", done: false },
  { a: "fortuneo", b: "bd", done: false },
  { a: "fortuneo", b: "saxo", done: false },
  { a: "xtb", b: "caidf", done: false },
  { a: "xtb", b: "bd", done: false },
  { a: "xtb", b: "saxo", done: false },
  { a: "caidf", b: "bd", done: false },
  { a: "caidf", b: "saxo", done: false },
  { a: "bd", b: "saxo", done: false },
];

export const MAX_SELECT = 3;

export const byId = (id) => BROKERS.find((b) => b.id === id);

export function rankRow(row, brokers) {
  const ranks = brokers.map((b) => b[row.key].rank).filter((r) => r !== undefined);
  return ranks.length ? Math.min(...ranks) : null;
}

export function buildTweet(selected) {
  if (selected.length !== 2) {
    return selected.length < 2
      ? ""
      : "Ce format de post est pensé pour un duel (2 courtiers).\nDésélectionne-en un pour générer le texte.";
  }
  const [b1, b2] = selected.map(byId);
  const names = (b) => b.emoji + " " + b.nom;
  const lines = (items) => items.join("\n");
  const detail = (item) => [item.resume, item.detail].filter(Boolean).join(" · ");
  // Les lignes du post portent déjà les nuances rédigées et vérifiées ; ne pas ajouter
  // automatiquement le détail abrégé de la carte, qui dupliquerait ou déformerait ces nuances.
  const pea = (b) => [
    "PEA " + (b.pea.pea === null ? "?" : b.pea.pea ? "✅" : "❌"),
    "PEA-PME " + (b.pea.pme === null ? "?" : b.pea.pme ? "✅" : "❌"),
    "PEA Jeune " + (b.pea.jeune === null ? "?" : b.pea.jeune ? "✅" : "❌"),
  ].join(" / ");
  const pair = (label, describe) =>
    label + "\n" + [b1, b2].map((b) => names(b) + " : " + describe(b)).join("\n");

  const blocks = [
    names(b1) + " ou " + names(b2) + " pour ton PEA ? 👇",
    "Tu investis chaque mois, tu passes quelques ordres ponctuels ou tu veux aussi un PEA-PME ? Voici les différences à regarder avant de choisir.",

    pair("💰 Quand tu passes un ordre", (b) => lines(b.post.frais.filter((line) => !/Boursomarkets/i.test(line)))),
    pair("🛒 Et les offres sur certains titres ?", (b) => detail(b.boursomarkets)),
    pair("📅 Si tu investis automatiquement", (b) => lines(b.post.dca)),

    pair("🌱 Les enveloppes disponibles", (b) => pea(b)),
    pair("🛡️ Les frais de garde", (b) => lines(b.post.garde)),
    pair("📄 Pour la déclaration fiscale", (b) =>
      lines(b.post.ifu)
    ),
    pair("💵 Espèces non investies (CTO / PEA)", (b) => "CTO : " + b.cash.cto.post + " PEA : " + b.cash.pea.post),
    pair("🔄 Si tu transfères ton PEA", (b) => b.transfertPea?.resume || "Non renseigné"),

    pair("⚠️ Ce qui peut coincer", (b) => lines(b.post.faibles)),
    "🎯 Selon ta façon d’investir\n" +
      [b1, b2].map((b) => "Si " + b.post.verdict.charAt(0).toLowerCase() +
        b.post.verdict.slice(1) + ", regarde " + b.nom + ".").join("\n"),

    "Et toi, lequel te correspond le mieux ? 👇",
    "Ce post ne constitue pas un conseil en investissement.",
  ];

  return blocks.join("\n\n");
}
