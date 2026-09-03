// Base de données courtiers — modifie ici chaque semaine.
// rank : 1 = meilleur, plus haut = moins bon (sert au surlignage).
// Repris tel quel de la session d'origine, aucune donnée modifiée.
export const BROKERS = [
  {
    id: "tr", nom: "Trade Republic", code: "TR", color: "#5FA8D3", emoji: "🔵",
    frais: { rank: 1, resume: "1€ / ordre", detail: "Frais fixe, quel que soit le montant" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 1, resume: "0€ (PEA & CTO)", detail: "+7 500 titres · hebdo / bimensuel / mensuel" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: false, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    // MàJ du 03/09/2026 : Trade Republic a lancé son propre Livret A le 20/08/2026, distribué dans
    // l'appli mais souscrit auprès d'AXA Banque (dépositaire officiel — TR n'est pas elle-même
    // habilitée à commercialiser le Livret A). Taux réglementé identique partout (1,7 % depuis le
    // 01/08/2026), plafond 22 950 €. Sources convergentes : toutsurmesfinances.com
    // ("Trade Republic lance son Livret A en France, adossé à AXA Banque") et moneyvox.fr
    // ("Trade Republic : le Livret A désormais disponible pour les clients de cette néobanque"),
    // recoupées par zonebourse.com et sinvestir.fr.
    liquidites: { rank: 1, resume: "Oui", detail: "Livret A (via AXA Banque)" },
    pointFaible: "Pas de PEA-PME, transfert PEA entrant impossible",
    transfertPea: { resume: "Entrant ❌" },
    post: {
      frais: ["1€/ordre, quel que soit le montant"],
      dca: ["✅ 0€ sur PEA & CTO — +7 500 titres disponibles, hebdo/bimensuel/mensuel"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret A, distribué dans l'appli, souscrit auprès d'AXA Banque, depuis le 20/08/2026)"],
      faibles: ["Pas de PEA-PME, transfert PEA entrant impossible"],
      verdict: "Tu veux investir petit et souvent sans réfléchir aux frais",
    },
  },
  {
    id: "bourso", nom: "BoursoBank", code: "BB", color: "#E4735E", emoji: "🟡",
    frais: { rank: 2, resume: "1,99€ puis 0,60%", detail: "Plafonné à 0,5% du montant" },
    boursomarkets: { rank: 1, resume: "0€ à l’achat", detail: "ETF iShares, OPCVM partenaires, Turbos/Warrants SG & GS" },
    dca: { rank: 2, resume: "0€ transaction, frais selon DIC", detail: "8 fonds maison, mensuel uniquement" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret Bourso+" },
    pointFaible: "DCA limité 8 fonds maison, frais de gestion selon DIC. ℹ️ Ordre minimum : 100€ actions / 200€ ETF / 500€ OPCVM & Warrants / 2 500€ Bourses EU",
    transfertPea: { resume: "Entrant ✅ / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["1,99€ ≤500€, puis 0,60% (plafonné à 0,5% sur PEA)", "⚡ Exception Boursomarkets → 0€ sur ETF iShares, OPCVM partenaires, Turbos/Warrants SG & Goldman Sachs"],
      dca: ["⚠️ 0€ de transaction — frais de gestion selon DIC — 8 fonds maison, mensuel uniquement, dès 10€/mois"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret Bourso+)"],
      faibles: ["DCA limité 8 fonds maison, frais de gestion selon DIC, ordre min ETF 200€, Bourses EU 2 500€"],
      verdict: "Tu veux un écosystème bancaire complet avec PEA-PME",
    },
  },
  {
    id: "ibkr", nom: "Interactive Brokers", code: "IBKR", color: "#7C93C9", emoji: "🟢",
    frais: { rank: 1, resume: "0,05% (min 1,25€, max 29€)", detail: "Tarif dégressif · défaut fixe min 3€" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 2, resume: "CTO uniquement", detail: "Pas de DCA sur PEA" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: false, jeune: null },
    ifu: { rank: 2, resume: "PEA uniquement" },
    liquidites: { rank: 1, resume: "Oui", detail: "CTO" },
    pointFaible: "Interface complexe, tarif fixe par défaut 3€, pas d’IFU sur CTO",
    transfertPea: { resume: "Entrant ✅" },
    post: {
      frais: ["0,05% min 1,25€ max 29€ (tarif dégressif)", "⚠️ Tarif fixe par défaut : min 3€"],
      dca: ["❌ Sur PEA", "✅ CTO uniquement"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ❌",
      ifu: ["⚠️ PEA uniquement"],
      liquidites: ["✅ Oui"],
      faibles: ["Interface complexe, tarif fixe par défaut 3€, pas d’IFU sur CTO"],
      verdict: "Tu veux les frais les plus bas sur gros ordres européens",
    },
  },
  {
    id: "fortuneo", nom: "Fortuneo", code: "FO", color: "#8C7AE6", emoji: "🟣",
    frais: { rank: 2, resume: "0€ le 1er ordre/mois", detail: "Si ≤ 500€, puis 0,35% au-delà" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: false },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret+" },
    pointFaible: "Clôture PEA 85€, pas de DCA, frais élevés hors Euronext",
    transfertPea: { resume: "Entrant ✅ / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["0€ le 1er ordre du mois si ≤500€, puis 0,35% au-delà"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ❌",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret+)"],
      faibles: ["Clôture PEA 85€, pas de DCA, frais élevés hors Euronext"],
      verdict: "Tu veux un PEA + PEA-PME chez un courtier 100% en ligne établi",
    },
  },
  {
    id: "xtb", nom: "XTB", code: "XTB", color: "#5C9EAD", emoji: "⚫",
    frais: { rank: 1, resume: "0% jusqu’à 100K€/mois", detail: "Puis 0,20% au-delà (min 10€)" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: false, jeune: false },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui" },
    pointFaible: "Pas de DCA, transfert PEA entrant impossible",
    transfertPea: { resume: "Entrant ❌" },
    post: {
      frais: ["0% de commission jusqu’à 100K€/mois de volume, puis 0,20% au-delà (min 10€)"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ❌",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui"],
      faibles: ["Pas de DCA, transfert PEA entrant impossible"],
      verdict: "Tu passes moins de 100K€/mois et veux 0% de commission",
    },
  },
  {
    id: "caidf", nom: "CA Île-de-France", code: "CA", color: "#B08968", emoji: "🟠",
    frais: { rank: 3, resume: "Intégral 0,12-0,48%", detail: "Abonnement 96€/an si <12 ordres" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 2, resume: "0,20%/sem. + 2,50€/ligne", detail: "Exonérés avec InvestStore Intégral" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret A, LDDS, LEP" },
    pointFaible: "Abonnement 96€/an si <12 ordres, transfert PEA sortant 15€/ligne (max 150€)",
    transfertPea: { resume: "Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["Intégral → 0,48% ≤500€ / 0,18% de 500€ à 1000€ / 0,12% au-delà", "⚡ Abonnement 96€/an si <12 ordres/an"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["⚠️ 0,20%/semestre + 2,50€/ligne/semestre", "Exonérés avec InvestStore Intégral"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret A, LDDS, LEP)"],
      faibles: ["Abonnement 96€/an si <12 ordres, droits de garde si inactif, transfert PEA sortant 15€/ligne (max 150€)"],
      verdict: "Tu veux un conseiller en agence et un compte bancaire classique",
    },
  },
  {
    id: "bd", nom: "Bourse Direct", code: "BD", color: "#C98B72", emoji: "🟤",
    frais: { rank: 2, resume: "Palier dès 0,99€", detail: "Jusqu’à 0,09% au-delà de 4 400€" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 2, resume: "Non rémunérées" },
    pointFaible: "Pas de DCA, liquidités non rémunérées, tarification par paliers",
    transfertPea: { resume: "Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["0,99€ ≤500€ / 1,90€ 500-1000€ / 2,90€ 1000-2000€", "⚡ 3,80€ 2000-4400€ / 0,09% au-delà de 4 400€"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["❌ Non rémunérées"],
      faibles: ["Pas de DCA, liquidités non rémunérées, tarification par paliers"],
      verdict: "Tu fais des ordres ponctuels et veux un tarif par palier transparent",
    },
  },
  {
    id: "saxo", nom: "Saxo Bank", code: "SX", color: "#AAB4CC", emoji: "⚪",
    frais: { rank: 1, resume: "Dès 2€", detail: "0€ sur 70 actions UE jusqu’au 31/12/2026" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 2, resume: "CTO uniquement (PEPS)", detail: "0€ ETF & fonds, mensuel — pas sur PEA" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui" },
    pointFaible: "DCA pas sur PEA, tarif minimum 2€/ordre",
    transfertPea: { resume: "Entrant ✅ — remboursé jusqu’au 31/08/2026" },
    post: {
      frais: ["À partir de 2€, plafonné à 0,5% sur PEA", "⚡ Promo → 0€ sur 70 actions UE (jusqu’au 31/12/2026)"],
      dca: ["❌ Sur PEA", "✅ CTO — PEPS 0€, ETF & fonds, mensuel"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui"],
      faibles: ["DCA pas sur PEA, tarif minimum 2€/ordre"],
      verdict: "Tu veux des frais dégressifs dès 2€ avec un DCA CTO en option",
    },
  },
];

export const ROWS = [
  { key: "frais", icon: "💰", label: "Frais (PEA)" },
  { key: "boursomarkets", icon: "🛒", label: "Boursomarkets" },
  { key: "dca", icon: "📈", label: "DCA / invest. programmé" },
  { key: "garde", icon: "🛡️", label: "Frais de garde" },
  { key: "ifu", icon: "📄", label: "IFU" },
  { key: "liquidites", icon: "💵", label: "Liquidités rémunérées" },
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

  const section = (icon, title, b1Lines, b2Lines) => {
    const rows = [icon + " " + title, ""];
    rows.push(b1.emoji + " " + b1.nom + " → " + b1Lines[0]);
    b1Lines.slice(1).forEach((l) => rows.push(l));
    rows.push(b2.emoji + " " + b2.nom + " → " + b2Lines[0]);
    b2Lines.slice(1).forEach((l) => rows.push(l));
    return rows.join("\n");
  };

  const blocks = [
    b1.emoji + " " + b1.nom + " 🆚 " + b2.emoji + " " + b2.nom,
    "Lequel choisir pour ton PEA en 2026 ?\nOn décortique les deux 👇",
    section("💰", "FRAIS DE COURTAGE PEA", b1.post.frais, b2.post.frais),
    section("📈", "DCA AUTOMATIQUE", b1.post.dca, b2.post.dca),
    section("🛡️", "FRAIS DE GARDE", b1.post.garde, b2.post.garde),
    "🌱 PEA / PEA-PME\n\n" + b1.emoji + " " + b1.nom + " → " + b1.post.pea + "\n" + b2.emoji + " " + b2.nom + " → " + b2.post.pea,
    section("📄", "IFU", b1.post.ifu, b2.post.ifu),
    section("💵", "LIQUIDITÉS RÉMUNÉRÉES", b1.post.liquidites, b2.post.liquidites),
    section("⚠️", "POINTS FAIBLES", b1.post.faibles, b2.post.faibles),
    "🎯 VERDICT FINAL\n\n" + b1.post.verdict + " → " + b1.nom + " " + b1.emoji + "\n" + b2.post.verdict + " → " + b2.nom + " " + b2.emoji,
    "Et toi, t’es chez lequel ?\n" + b1.emoji + " " + b1.nom + "\n" + b2.emoji + " " + b2.nom + "\n🔴 Ni l’un ni l’autre\n\nDis-moi en commentaire 👇",
    "⚠️ Pas un conseil en investissement.",
  ];

  return blocks.join("\n\n");
}
