// Base de données courtiers — modifie ici chaque semaine.
// rank : 1 = meilleur, plus haut = moins bon (sert au surlignage).
// Repris tel quel de la session d'origine, aucune donnée modifiée.
//
// lastVerified : date de la vérification la plus récente déjà documentée dans les commentaires de
// CET objet (jamais une date ajoutée à la main séparément — cf. App.jsx pour l'affichage), ajouté
// le 14/09/2026 à la demande de l'utilisateur (audit "outils"). fortuneo/xtb/caidf, qui n'avaient
// aucun commentaire daté depuis la session d'origine, ont été revérifiés le même jour (cf. leurs
// commentaires individuels) — les 8 courtiers portent désormais une date.
export const BROKERS = [
  {
    id: "tr", nom: "Trade Republic", code: "TR", color: "#5FA8D3", emoji: "🔵", lastVerified: "03/09/2026",
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
    liquidites: { rank: 1, resume: "Oui", detail: "Liquidités rémunérées + Livret A (via AXA Banque)" },
    // Correction du 03/09/2026 : le transfert PEA entrant est possible chez Trade Republic.
    pointFaible: "Pas de PEA-PME",
    transfertPea: { resume: "Entrant ✅" },
    post: {
      frais: ["1€/ordre, quel que soit le montant"],
      dca: ["✅ 0€ sur PEA & CTO — +7 500 titres disponibles, hebdo/bimensuel/mensuel"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret A, distribué dans l'appli, souscrit auprès d'AXA Banque, depuis le 20/08/2026)"],
      faibles: ["Pas de PEA-PME"],
      verdict: "Tu veux investir petit et souvent sans réfléchir aux frais",
    },
  },
  {
    id: "bourso", nom: "BoursoBank", code: "BB", color: "#E4735E", emoji: "🟡", lastVerified: "09/09/2026",
    frais: { rank: 2, resume: "1,99€ puis 0,60%", detail: "Plafonné à 0,5% du montant" },
    // Revue ciblée du 24/09/2026 : la page officielle Boursomarkets présente les ETF iShares
    // (et Amundi parmi les OPCVM), sans confirmer le nombre de 275 ETF ni l'exclusivité Amundi.
    // https://www.boursobank.com/bourse/boursomarkets-courtage-bourse-gratuit
    boursomarkets: { rank: 1, resume: "0€ à l’achat", detail: "ETF iShares éligibles à l’offre, selon le compte" },
    // Le Plan d'Épargne comporte 8 fonds et 0€ de frais de transaction, mais 0,59% de frais
    // annuels de gestion et autres frais administratifs/d'exploitation selon la page officielle.
    // https://www.boursobank.com/bourse/plan-epargne
    dca: { rank: 2, resume: "0€ transaction, 0,59%/an", detail: "8 fonds maison, mensuel uniquement" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret Bourso+" },
    pointFaible: "DCA limité à 8 fonds maison (0,59%/an de frais de gestion et autres frais). ℹ️ Ordre minimum : 100€ actions / 100€ ETF / 500€ OPCVM & Warrants / 2 500€ Bourses EU",
    transfertPea: { resume: "Entrant ✅ / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["1,99€ ≤500€, puis 0,60% (plafonné à 0,5% sur PEA)"],
      dca: ["⚠️ 0€ de transaction — 0,59%/an de frais de gestion et autres frais — 8 fonds maison, mensuel uniquement, dès 10€/mois"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret Bourso+)"],
      faibles: ["DCA limité à 8 fonds maison (0,59%/an), ordre min ETF 100€, Bourses EU 2 500€"],
      verdict: "Tu veux un écosystème bancaire complet avec PEA-PME",
    },
  },
  {
    id: "ibkr", nom: "Interactive Brokers", code: "IBKR", color: "#7C93C9", emoji: "🟢", lastVerified: "03/09/2026",
    frais: { rank: 1, resume: "0,05% (min 1,25€, max 29€)", detail: "Tarif dégressif · défaut fixe min 3€" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 2, resume: "CTO uniquement", detail: "Pas de DCA sur PEA" },
    garde: { rank: 1, resume: "0€" },
    // Correction du 03/09/2026 (table de vérification fournie par l'utilisateur, source
    // interactivebrokers.com/en/pricing/commissions-stocks.php) : jeune passait de null ("?" affiché
    // sur la carte) à false — incohérence corrigée, le texte du tweet (post.pea ci-dessous) disait
    // déjà "PEA Jeune ❌" sans que le champ structuré ne le reflète.
    pea: { pea: true, pme: false, jeune: false },
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
    id: "fortuneo", nom: "Fortuneo", code: "FO", color: "#8C7AE6", emoji: "🟣", lastVerified: "14/09/2026",
    // Revérifié le 14/09/2026 (audit "outils", complétion des entrées sans date documentée) : toutes
    // les données ci-dessous confirmées exactes, aucune correction nécessaire. Fortuneo a refondu son
    // courtage au 09/02/2026 en 3 formules (Starter/Progress/Trader Pro) — le "0€ 1er ordre ≤500€ puis
    // 0,35%" ci-dessous décrit fidèlement Starter (la formule pertinente pour un investisseur PEA
    // classique, même logique que les autres courtiers qui n'affichent que leur palier d'entrée).
    // DCA confirmé absent (ordres manuels ou virements/ordres récurrents configurés à la main, jamais
    // un vrai plan automatisé). Frais hors Euronext confirmés élevés, et une nouvelle règle depuis le
    // 06/08/2026 les renforce : seuil minimum de 400€ par ordre d'achat sur les bourses européennes
    // hors Euronext Paris/Bruxelles/Amsterdam et Equiduct, en PEA/PEA-PME. Clôture PEA à 85€ confirmée
    // (Fortuneo est la seule des 13 enseignes testées par MoneyVox début 2026 à facturer la clôture).
    // Sources convergentes : signal-alpha.fr, votre-parrainage-fortuneo.fr, guidedelabanque.fr,
    // moneyvox.fr (Livret+ 1,60%), investisseurs-heureux.fr.
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
    id: "xtb", nom: "XTB", code: "XTB", color: "#5C9EAD", emoji: "⚫", lastVerified: "14/09/2026",
    // Revérifié le 14/09/2026 (audit "outils", complétion des entrées sans date documentée) : toutes
    // les données ci-dessous confirmées exactes. Le point DCA a nécessité 3 requêtes (une 1re source
    // évoquait des "achats programmés sans frais" ; 2 sources indépendantes, dont une ciblée
    // spécifiquement sur ce point, confirment qu'aucun plan d'investissement automatisé n'existe chez
    // XTB — chaque ordre se passe à la main — la 1re source retenue comme imprécision d'un résumé IA
    // plutôt qu'un fait réel). Transfert PEA entrant toujours impossible mi-2026, malgré une
    // fonctionnalité "annoncée courant 2026" non encore livrée. Liquidités rémunérées confirmées, mais
    // uniquement côté CTO (3,50%/3,40% les 90 premiers jours) — jamais sur la poche cash du PEA.
    // Sources convergentes : xtb.com, pea.fr, moneyradar.org, cryptoast.fr, broker-forex.fr.
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
    id: "caidf", nom: "CA Île-de-France", code: "CA", color: "#B08968", emoji: "🟠", lastVerified: "24/09/2026",
    // Brochure officielle régionale, tarifs particuliers au 01/04/2026, pages 28-30.
    // https://ca-paris.credit-agricole.fr/tarif/2026/CADIF_tarif2026_PART/conditions_tarifaires_particuliers_caidf_04_2026.pdf
    // Copie consultable : https://labanque.org/documents/brochure-tarifaire-credit-agricole-2026-09-08-i18uhjnebp/telecharger
    frais: { rank: 3, resume: "Intégral 0,12-0,48%", detail: "96€/an si moins de 12 ordres ; gratuit de 18 à 30 ans" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 2, resume: "0,20%/sem. + 2,50€/ligne", detail: "Exonérés avec Invest Store Intégral" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret A, LDDS, LEP" },
    pointFaible: "Invest Store Intégral : 96€/an si moins de 12 ordres exécutés, sauf 18-30 ans ; transfert PEA sortant 15€/ligne (max 150€)",
    transfertPea: { resume: "Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["Invest Store Intégral, PEA en ligne : 0,48% ≤500€ / 0,18% de 500€ à 1 000€ / 0,12% au-delà", "96€/an si moins de 12 ordres exécutés sur l'année civile ; gratuit de 18 à 30 ans. Hors frais de marché et TTF"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["⚠️ 0,20%/semestre + 2,50€/ligne/semestre", "Exonérés avec Invest Store Intégral"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret A, LDDS, LEP)"],
      faibles: ["96€/an si moins de 12 ordres (sauf 18-30 ans), droits de garde hors conditions d'exonération, transfert PEA sortant 15€/ligne (max 150€)"],
      verdict: "Tu veux un conseiller en agence et un compte bancaire classique",
    },
  },
  {
    id: "bd", nom: "Bourse Direct", code: "BD", color: "#C98B72", emoji: "🟤", lastVerified: "03/09/2026",
    frais: { rank: 2, resume: "Palier dès 0,99€", detail: "Jusqu’à 0,09% au-delà de 4 400€" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 2, resume: "Non rémunérées" },
    pointFaible: "Pas de DCA, liquidités non rémunérées, tarification par paliers",
    // Ajout du 03/09/2026 (table de vérification fournie par l'utilisateur) : le transfert PEA
    // entrant, absent des données précédentes (seul "Sortant" était renseigné), est en réalité
    // possible et remboursé chez Bourse Direct.
    transfertPea: { resume: "Entrant ✅ remboursé / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["0,99€ ≤500€ / 1,90€ 500-1 000€ / 2,90€ 1 000-2 000€", "⚡ 3,80€ 2 000-4 400€ / 0,09% au-delà de 4 400€"],
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
    id: "saxo", nom: "Saxo Bank", code: "SX", color: "#AAB4CC", emoji: "⚪", lastVerified: "03/09/2026",
    frais: { rank: 1, resume: "Dès 2€", detail: "Offre 0€ sur 70 actions UE jusqu’au 31/12/2026, sous conditions" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 2, resume: "CTO uniquement (PEPS)", detail: "0€ ETF & fonds, mensuel — pas sur PEA" },
    garde: { rank: 1, resume: "0€" },
    // Corrections du 03/09/2026 (table de vérification fournie par l'utilisateur, source
    // home.saxo/fr-fr) : jeune passe de true à false (Saxo ne propose pas de PEA Jeune — le texte du
    // tweet ci-dessous en tenait compte nulle part avant cette correction) ; la date de remboursement
    // du transfert PEA entrant passe du 31/08/2026 au 31/12/2026 (alignée sur la même échéance que la
    // promo "0€ sur 70 actions UE" ci-dessous, vraisemblablement la même campagne), et devient un
    // remboursement à 100 %.
    pea: { pea: true, pme: true, jeune: false },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui" },
    pointFaible: "DCA pas sur PEA, pas de PEA Jeune",
    transfertPea: { resume: "Entrant ✅ remboursé à 100% jusqu’au 31/12/2026" },
    post: {
      frais: ["À partir de 2€, plafonné à 0,5% sur PEA", "⚡ Offre 0€ sur 70 actions UE jusqu’au 31/12/2026, réservée aux PEA nouvellement ouverts ou transférés éligibles"],
      dca: ["❌ Sur PEA", "✅ CTO — PEPS 0€, ETF & fonds, mensuel"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ❌",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui"],
      faibles: ["DCA pas sur PEA, pas de PEA Jeune"],
      verdict: "Tu veux une plateforme premium avec frais à partir de 2€ et un DCA CTO en option",
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
  const names = (b) => b.emoji + " " + b.nom;
  const lines = (items) => items.join("\n");
  const detail = (item) => [item.resume, item.detail].filter(Boolean).join(" · ");
  // Le texte éditorial porte les conditions détaillées. Ne rajouter depuis la carte
  // que les chiffres absents du post, afin de conserver l'information sans la répéter.
  const withExtra = (postLines, item) => {
    const text = postLines.join(" ");
    const extra = item.detail || "";
    const numbers = extra.match(/\d+(?:[,.]\d+)?/g) || [];
    const missing = numbers.length
      ? numbers.some((number) => !text.includes(number))
      : Boolean(extra) && !text.toLocaleLowerCase('fr').includes(extra.toLocaleLowerCase('fr'));
    return lines(missing ? [...postLines, extra] : postLines);
  };
  const pea = (b) => [
    "PEA " + (b.pea.pea ? "✅" : "❌"),
    "PEA-PME " + (b.pea.pme === null ? "?" : b.pea.pme ? "✅" : "❌"),
    "PEA Jeune " + (b.pea.jeune === null ? "?" : b.pea.jeune ? "✅" : "❌"),
  ].join(" / ");
  const pair = (label, describe) =>
    label + "\n" + [b1, b2].map((b) => names(b) + " : " + describe(b)).join("\n");

  const blocks = [
    names(b1) + " ou " + names(b2) + " pour ton PEA ? 👇",
    "Tu investis chaque mois, tu passes quelques ordres ponctuels ou tu veux aussi un PEA-PME ? Voici les différences à regarder avant de choisir.",

    pair("💰 Quand tu passes un ordre", (b) =>
      withExtra(b.post.frais.filter((line) => !/Boursomarkets/i.test(line)), b.frais)
    ),
    pair("🛒 Et les offres sur certains titres ?", (b) => detail(b.boursomarkets)),
    pair("📅 Si tu investis automatiquement", (b) =>
      withExtra(b.post.dca, b.dca)
    ),

    pair("🌱 Les enveloppes disponibles", (b) => pea(b)),
    pair("🛡️ Les frais de garde", (b) =>
      withExtra(b.post.garde, b.garde)
    ),
    pair("📄 Pour la déclaration fiscale", (b) =>
      lines(b.post.ifu)
    ),
    pair("💵 Et les liquidités ?", (b) =>
      withExtra(b.post.liquidites, b.liquidites)
    ),
    pair("🔄 Si tu transfères ton PEA", (b) => b.transfertPea?.resume || "Non renseigné"),

    pair("⚠️ Ce qui peut coincer", (b) =>
      withExtra(b.post.faibles, { detail: b.pointFaible })
    ),
    "🎯 Selon ta façon d’investir\n" +
      [b1, b2].map((b) => "Si " + b.post.verdict.charAt(0).toLowerCase() +
        b.post.verdict.slice(1) + ", regarde " + b.nom + ".").join("\n"),

    "Et toi, lequel te correspond le mieux ? 👇",
    "Ce post ne constitue pas un conseil en investissement.",
  ];

  return blocks.join("\n\n");
}
