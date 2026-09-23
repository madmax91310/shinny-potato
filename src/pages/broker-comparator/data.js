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
    // Correction du 03/09/2026, signalée par l'utilisateur : le transfert PEA entrant est en réalité
    // possible chez Trade Republic (0€ côté TR — la banque d'origine peut en revanche facturer des
    // frais sortants, ~15€/ligne selon les établissements), pas "impossible" comme précédemment
    // indiqué. Point réel de friction : délai anormalement long (1 à 4 mois, contre 15 jours légaux),
    // titres immobilisés pendant le transfert. Sources convergentes (3 recherches croisées) :
    // sinvestir.fr, avenuedesinvestisseurs.fr, dafna.fr — toutes confirment le transfert entrant
    // possible avec ce même délai. Le détail exact (transfert total titres+espèces vs espèces
    // seules) varie selon les sources consultées : non retenu ici, faute de convergence suffisante.
    pointFaible: "Pas de PEA-PME, transfert PEA entrant possible mais lent (jusqu'à 4 mois)",
    transfertPea: { resume: "Entrant ✅ (délai long, jusqu'à 4 mois)" },
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
    // MàJ du 05/09/2026 (coquille corrigée le 09/09/2026 : la date indiquait par erreur 05/10/2026,
    // une date alors future — confirmé 05/09/2026 par l'utilisateur) (communication officielle
    // BoursoBank en vigueur à cette date) : Boursomarkets
    // est devenu un partenariat exclusif avec Amundi sur +275 ETF (dont 75 éligibles PEA), remplaçant
    // l'ancienne offre iShares/OPCVM partenaires/Turbos-Warrants SG & Goldman Sachs.
    boursomarkets: { rank: 1, resume: "0€ à l’achat", detail: "+275 ETF (dont 75 éligibles PEA) — partenaire exclusif Amundi" },
    dca: { rank: 2, resume: "0€ transaction, frais selon DIC", detail: "8 fonds maison, mensuel uniquement" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret Bourso+" },
    pointFaible: "DCA limité 8 fonds maison, frais de gestion selon DIC. ℹ️ Ordre minimum : 100€ actions / 100€ ETF / 500€ OPCVM & Warrants / 2 500€ Bourses EU",
    transfertPea: { resume: "Entrant ✅ / Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["1,99€ ≤500€, puis 0,60% (plafonné à 0,5% sur PEA)", "⚡ Exception Boursomarkets → 0€ sur +275 ETF (dont 75 éligibles PEA), partenaire exclusif Amundi"],
      dca: ["⚠️ 0€ de transaction — frais de gestion selon DIC — 8 fonds maison, mensuel uniquement, dès 10€/mois"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret Bourso+)"],
      faibles: ["DCA limité 8 fonds maison, frais de gestion selon DIC, ordre min ETF 100€, Bourses EU 2 500€"],
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
    id: "caidf", nom: "CA Île-de-France", code: "CA", color: "#B08968", emoji: "🟠", lastVerified: "14/09/2026",
    // Revérifié le 14/09/2026 (audit "outils", complétion des entrées sans date documentée).
    // CORRECTION : l'abonnement InvestStore Intégral est passé de 96€/an (si <12 ordres) à
    // 101,40€/an (si <24 ordres) — confirmé par 6 requêtes convergentes, dont une avec un récit
    // explicite de hausse tarifaire ("évolution depuis le précédent tarif de 96€, courant à la
    // Caisse de Paris, vers le tarif actuel de 101,40€"). L'ancien couple 96€/12 ordres reste
    // documenté par plusieurs sources comme un tarif antérieur ou propre à une autre Caisse
    // régionale, jamais comme le tarif actuel de CA Île-de-France. Le taux de courtage par palier
    // (0,12-0,48% ci-dessous) N'A PAS pu être revérifié avec confiance : plusieurs sources évoquent
    // un barème plus bas ("0,09% avec un minimum de 0,99€"), mais les exemples chiffrés qu'elles
    // donnent elles-mêmes sont mathématiquement incohérents entre eux (ex. "0,09%" puis un calcul
    // qui revient en réalité à 0,18% sur un ordre de 1000€) — contradiction non résolue même après
    // plusieurs requêtes, WebFetch étant bloqué dans ce sandbox pour consulter la grille tarifaire
    // officielle en PDF. Valeur conservée par prudence plutôt que remplacée par un chiffre incertain
    // (même principe que l'écart non tranché sur oblig_etat_eur_short/MSCI Japan IMI) — à revoir
    // avec un accès direct à la grille tarifaire PDF de CA Île-de-France.
    frais: { rank: 3, resume: "Intégral 0,12-0,48%", detail: "Abonnement 101,40€/an si <24 ordres" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 2, resume: "0,20%/sem. + 2,50€/ligne", detail: "Exonérés avec InvestStore Intégral" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret A, LDDS, LEP" },
    pointFaible: "Abonnement 101,40€/an si <24 ordres, transfert PEA sortant 15€/ligne (max 150€)",
    transfertPea: { resume: "Sortant 15€/ligne (max 150€)" },
    post: {
      frais: ["Intégral → 0,48% ≤500€ / 0,18% de 500€ à 1000€ / 0,12% au-delà", "⚡ Abonnement 101,40€/an si <24 ordres/an"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["⚠️ 0,20%/semestre + 2,50€/ligne/semestre", "Exonérés avec InvestStore Intégral"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret A, LDDS, LEP)"],
      faibles: ["Abonnement 101,40€/an si <24 ordres, droits de garde si inactif, transfert PEA sortant 15€/ligne (max 150€)"],
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
    frais: { rank: 1, resume: "Dès 2€", detail: "0€ sur 70 actions UE jusqu’au 31/12/2026" },
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
      frais: ["À partir de 2€, plafonné à 0,5% sur PEA", "⚡ Promo → 0€ sur 70 actions UE (jusqu’au 31/12/2026)"],
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
