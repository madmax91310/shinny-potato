import { brokerTariffCopy, brokerFieldCopies, applyBrokerProfile } from '../../data/broker-tariffs.js';
import { BROKER_EVIDENCE } from './evidence.js';
import { buildBrokerTweet } from './lib.js';

// Base de données courtiers — les mentions « À vérifier » ne sont pas des réponses négatives.
// « Liquidités rémunérées » : oui si une offre officielle rémunère des espèces non investies
// au moins dans un compte ; aucun livret ni fonds monétaire. Les limites figurent au registre.
// Sources PDF initiales de cette révision ; compléments officiels dans evidence.js :
// TR https://assets.traderepublic.com/assets/files/CA_FR-en-fr.pdf (annexes 3 et 12)
// XTB https://www.xtb.com/fr/fichiers/table-des-frais-et-commissions_052026.pdf
// XTB https://xas-new-cdn.xtb.com/file/0104/53/271ced41-db62-499b-9e83-f3b4557f9bf1/fr-meet-xtb-one-pager-2026-docx.pdf
// Bourso https://www.boursobank.com/content/brochure_tarifaire/boursorama_bt.pdf
// Fortuneo https://www.fortuneo.fr/files/fortuneo-tarifs-09022026.pdf
// BD https://www.boursedirect.fr/pdf/tarifs_bd.pdf
// BD https://groupe.boursedirect.fr/download/bourse-direct-lance-ses-plans-dinvestissement-programmes-sans-frais-sur-etf-a-partir-de-quelques-euros-disponibles-sur-pea-et-compte-titres?filename=2026_BD_CP_Plan-Investissement.pdf
// Saxo https://www.home.saxo/-/media/documents/regional/fr-fr/manuals/conditions-generales-applicables-a-partir-du-9-avril-2026.pdf
// CA IDF : brochure régionale accessible via /Reglementaire/Tarifs/2026/.
// rank : 1 = meilleur, plus haut = moins bon (sert au surlignage).
// lastVerified : date historique de revue de la fiche, pas la date de confirmation de chaque champ.
export const BROKERS = [
  {
    id: "tr", nom: "Trade Republic", code: "TR", color: "#5FA8D3", emoji: "🔵", lastVerified: "29/09/2026",
    frais: { resume: "1 € hors plan", detail: "Ordre ponctuel · 2 € avec Direct Price · autres coûts possibles" },
    boursomarkets: { resume: "Sans objet" },
    dca: { resume: "Plans programmés", detail: "PEA sans frais sur plans · titres dans l’application" },
    garde: { resume: "À confirmer sur PEA", detail: "Absence de frais annoncée sur le compte-titres" },
    pea: { pea: true, pme: false, jeune: true },
    ifu: { rank: 1, resume: "Oui après migration FR" },
    // Contrat TR 09/2026, annexe 3 IV et annexe 12 B.V : intérêts possibles après activation
    // sur le compte général ; aucun intérêt reporté sur les espèces du PEA.
    cash: { resume: "Oui", detail: "Espèces éligibles sous conditions", post: "Oui sur les espèces éligibles sous conditions ; offre nouveaux clients soumise à activation." },
    // Correction du 03/09/2026 : le transfert PEA entrant est possible chez Trade Republic.
    pointFaible: "PEA-PME non proposé selon analyses externes",
    post: {
      frais: ["PEA : 1 € de règlement par ordre ponctuel, ou 2 € avec Direct Price ; plans programmés sans frais d’exécution. Spread et coûts tiers possibles."],
      dca: ["Plans programmés ; page PEA annonce l’absence de frais sur les plans. Titres éligibles dans l’application."],
      garde: ["Frais de garde PEA à confirmer ; la gratuité annoncée sur le compte-titres ne qualifie pas le PEA."],
      pea: "PEA ✅ / PEA-PME ❌* / PEA Jeune ✅",
      ifu: ["✅ Oui pour l’offre française, dont le PEA. Les anciens comptes étrangers relèvent d’un régime distinct."],
      faibles: ["PEA-PME non proposé selon analyses externes"],
      verdict: "Tu veux investir petit et souvent sans réfléchir aux frais",
    },
  },
  {
    id: "bourso", nom: "BoursoBank", code: "BB", color: "#E4735E", emoji: "🟡", lastVerified: "29/09/2026",
    frais: { rank: 2, resume: "1,99€ puis 0,60%", detail: "Plafonné à 0,5% du montant" },
    boursomarkets: { resume: "0 € à l’achat", detail: "Dès le 05/10/2026 : sélection d’ETF Amundi BoursoMarkets · vérifier l’ISIN et le tarif à la vente" },
    // Brochure 2026 p. 20 : commission de négociation gratuite, frais de gestion selon chaque DIC.
    // Nombre de fonds, périodicité exclusive et taux de 0,59% non validés par PDF officiel.
    dca: { rank: 2, resume: "0€ de négociation", detail: "Frais des fonds : voir DIC" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { resume: "Oui, si imposable" },
    cash: { resume: "Non*", detail: "PEA/PEA-PME : contrat · CTO : analyse externe", post: "Non : PEA/PEA-PME selon contrat ; CTO selon analyses externes." },
    pointFaible: "DCA : frais des fonds à vérifier. ℹ️ Ordre minimum : 100€ actions / 200€ ETF / 500€ OPCVM & Warrants / 2 500€ Bourses EU",
    post: {
      frais: ["1,99€ ≤500€, puis 0,60% (plafonné à 0,5% sur PEA)"],
      dca: ["Plan d'Épargne : 0 € de commission de négociation, dès 10 €/fonds/mois. Frais propres à chaque fonds indiqués dans son DIC."],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["IFU disponible pour les opérations et revenus imposables à déclarer."],
      faibles: ["Frais des fonds en plus du courtage gratuit du plan ; ordre minimum ETF de 200 € et de 2 500 € sur les Bourses européennes concernées"],
      verdict: "Tu veux un écosystème bancaire complet avec PEA-PME",
    },
  },
  {
    id: "ibkr", nom: "Interactive Brokers", code: "IBKR", color: "#7C93C9", emoji: "🟢", lastVerified: "29/09/2026",
    frais: { resume: "Dès 0,05 %", detail: "Actions France : min 1,25 € dégressif · 3 € fixe SmartRouting" },
    boursomarkets: { resume: "Sans objet" },
    dca: { resume: "Contesté*", detail: "PEA : oui août/septembre 2026, non dans d’autres analyses" },
    garde: { resume: "0 €", detail: "Droits de garde PEA" },
    pea: { pea: true, pme: false, jeune: false },
    ifu: { resume: "Oui pour le PEA" },
    cash: { resume: "Oui", detail: "Sous conditions · 0 % sur les premiers 10 000 € EUR", post: "Oui sur les soldes éligibles au-delà de 10 000 € EUR, selon la valeur du compte." },
    pointFaible: "PEA-PME et PEA Jeune non disponibles selon analyses 2026 ; contrat IBIE 2024 contradictoire pour le Jeune ; DCA PEA controversé",
    post: {
      frais: ["PEA, actions France : dégressif 0,05 %, min 1,25 € (plus frais de Bourse possibles) ; fixe SmartRouting 0,05 %, min 3 € ; routage direct 0,10 %, min 4 €. Autres places et fonds : barèmes distincts."],
      dca: ["Les analyses récentes divergent sur les achats récurrents dans le PEA. Le service général IBKR utilise des fractions ; sa disponibilité ne suffit pas à garantir celle du PEA."],
      garde: ["PEA : pas de droits de garde annoncés."],
      pea: "PEA ✅ / PEA-PME ❌* / PEA Jeune ❌* selon analyses 2026 (contrat IBIE 2024 contradictoire)",
      ifu: ["IFU disponible pour le PEA."],
      faibles: ["PEA-PME et PEA Jeune non proposés selon les analyses consultées ; disponibilité des achats automatiques sur PEA discutée"],
      verdict: "tu veux un PEA avec IFU et une tarification par marché",
    },
  },
  {
    id: "fortuneo", nom: "Fortuneo", code: "FO", color: "#8C7AE6", emoji: "🟣", lastVerified: "29/09/2026",
    // Brochure officielle 09/02/2026 p. 10 : formule Starter, Euronext / Equiduct.
    // Le contrat Fortuneo établit que le PEA Jeune n’est pas commercialisé.
    frais: { rank: 2, resume: "0€ le 1er ordre/mois", detail: "Starter · Euronext/Equiduct · ≤500€, puis 0,35%" },
    boursomarkets: { resume: "Sans objet" },
    dca: { resume: "Non*", detail: "Achats PEA manuels selon analyses externes" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: false },
    ifu: { resume: "Oui" },
    cash: { resume: "Non*", detail: "PEA/PEA-PME : contrat · CTO : analyses externes", post: "Non : PEA/PEA-PME selon contrat ; CTO selon analyses externes (28/09/2026)." },
    pointFaible: "Clôture PEA 85€, frais élevés hors Euronext ; pas de DCA automatique selon analyses externes",
    post: {
      frais: ["Starter sur Euronext/Equiduct : 0€ le 1er ordre du mois si ≤500€, puis 0,35% ; anciens tarifs possibles"],
      dca: ["Pas d’achats récurrents automatiques sur PEA selon analyses externes ; les ordres conditionnels et préordres documentés ne prouvent pas un plan récurrent."],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ❌",
      ifu: ["IFU téléchargeable dans l’espace client pour le compte titres."],
      faibles: ["Clôture PEA 85€, frais élevés hors Euronext ; pas de DCA automatique selon analyses externes"],
      verdict: "Tu veux un PEA + PEA-PME chez un courtier 100% en ligne établi",
    },
  },
  {
    id: "xtb", nom: "XTB", code: "XTB", color: "#5C9EAD", emoji: "⚫", lastVerified: "29/09/2026",
    // PDF XTB 2026 : le minimum de 10€ ne s'applique pas au PEA ; conservation >250K€ facturée.
    // Page PEA officielle : espèces sans intérêts, pas de transfert entrant ni de PEA pour
    // les personnes fiscalement rattachées. XTB annonce DCA PEA et PEA-PME à venir.
    frais: { rank: 1, resume: "0% jusqu’à 100K€/mois", detail: "Puis 0,20% · min 10€ hors PEA" },
    boursomarkets: { resume: "Sans objet" },
    dca: { resume: "À venir", detail: "Plans programmés PEA annoncés, non disponibles actuellement" },
    garde: { rank: 1, resume: "0€", detail: "0,02%/an sur l’excédent >250K€" },
    pea: { pea: true, pme: false, jeune: false },
    ifu: { resume: "Oui" },
    cash: { resume: "Oui", detail: "Espèces éligibles · taux variable", post: "Oui sur les fonds libres éligibles, taux variable selon les conditions XTB." },
    pointFaible: "DCA PEA et PEA-PME annoncés à venir ; transfert entrant indisponible",
    post: {
      frais: ["0% de commission jusqu’à 100K€/mois de volume, puis 0,20% au-delà (minimum 10€ non appliqué sur PEA)"],
      dca: ["Plans programmés PEA annoncés comme une extension à venir par XTB ; pas de disponibilité actuelle confirmée."],
      garde: ["0€ jusqu’à 250K€ de portefeuille ; 0,02%/an sur l’excédent"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ❌",
      ifu: ["IFU annoncé dans les informations générales XTB."],
      faibles: ["DCA PEA et PEA-PME annoncés à venir ; transfert entrant indisponible"],
      verdict: "Tu passes moins de 100K€/mois et veux 0% de commission",
    },
  },
  {
    id: "caidf", nom: "CA Île-de-France", code: "CA", color: "#B08968", emoji: "🟠", lastVerified: "29/09/2026",
    // Brochure régionale au 01/04/2026, pages 27-31.
    // https://ca-paris.credit-agricole.fr/Reglementaire/Tarifs/2026/CADIF_tarif2026_PART/conditions_tarifaires_particuliers_caidf_04_2026.pdf
    frais: { resume: "Initial 0,50 %", detail: "Intégral PEA : 0,48 % ≤500 €, 0,18 % ≤1 000 €, puis 0,12 % · abonnement sous conditions" },
    boursomarkets: { resume: "Sans objet" },
    dca: { resume: "Oui", detail: "PEA/PEA-PME · SICAV/FCP dès 45 €/mois · mise en place gratuite" },
    garde: { resume: "Exonérés avec Intégral", detail: "Sinon droits fixes et 0,20 %/semestre · voir barème régional" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { resume: "Oui, service national" },
    cash: { resume: "Non*", detail: "Cash PEA-PME non rémunéré ; compte courant non rémunéré selon MoneyVox 2026", post: "Non selon les sources consultées : cash PEA-PME non rémunéré et rémunération du compte courant non proposée en Île-de-France (MoneyVox, tarifs 2026)." },
    pointFaible: "Droits de garde hors Intégral ; cash non rémunéré selon sources consultées",
    post: {
      frais: ["Île-de-France Euronext en ligne : Initial 0,50 % ; Intégral PEA/PEA-PME 0,48 % ≤500 €, 0,18 % entre 500 et 1 000 €, 0,12 % au-delà. Intégral 96 €/an sous 12 ordres, gratuit de 18 à 30 ans."],
      dca: ["Plan d’Épargne Boursière : dès 45 €/mois sur 1 à 3 SICAV/FCP éligibles au PEA/PEA-PME ; mise en place gratuite en Île-de-France ; frais des fonds selon DIC."],
      garde: ["Exonérés avec Invest Store Intégral ; sinon droits fixes et commission de 0,20 % par semestre, selon le barème régional."],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["IFU consultable dans Invest Store ; sa réédition figure dans la brochure Île-de-France 2026."],
      faibles: ["Droits de garde hors Intégral ; cash non rémunéré selon sources consultées"],
      verdict: "Tu veux un conseiller en agence et un compte bancaire classique",
    },
  },
  {
    id: "bd", nom: "Bourse Direct", code: "BD", color: "#C98B72", emoji: "🟤", lastVerified: "29/09/2026",
    frais: { rank: 2, resume: "Palier dès 0,99€", detail: "PEA ≤198€ : 0,5% · puis jusqu’à 0,09%" },
    boursomarkets: { resume: "Sans objet" },
    dca: { rank: 1, resume: "Oui, PEA & CTO", detail: "ETF éligibles : 0€ de courtage ; actions : tarif habituel" },
    garde: { rank: 1, resume: "0€", detail: "Bourses étrangères : 0,036%/an" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { resume: "Oui" },
    cash: { resume: "Non*", detail: "Cash non rémunéré selon analyse externe", post: "Non selon analyse externe, cash non investi." },
    pointFaible: "Tarification par paliers ; cash non rémunéré selon analyse externe ; garde sur bourses étrangères",
    post: {
      frais: ["PEA ≤198€ : 0,5% ; puis 0,99€ jusqu’à 500€ / 1,90€ jusqu’à 1 000€ / 2,90€ jusqu’à 2 000€", "3,80€ jusqu’à 4 400€ / 0,09% au-delà"],
      dca: ["✅ Plans automatisés PEA & CTO, mensuels ou trimestriels ; ETF éligibles sans courtage, actions au tarif habituel"],
      garde: ["0€ hors bourses étrangères ; 0,036%/an sur bourses étrangères"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui, pour les clients soumis à la fiscalité française."],
      faibles: ["Tarification par paliers ; cash non rémunéré selon analyse externe ; garde sur bourses étrangères"],
      verdict: "Tu fais des ordres ponctuels et veux un tarif par palier transparent",
    },
  },
  {
    id: "saxo", nom: "Saxo Bank", code: "SX", color: "#AAB4CC", emoji: "⚪", lastVerified: "29/09/2026",
    frais: { rank: 1, resume: "Dès 2€", detail: "Classic Euronext : 0,08% (min 2€) · offre 0€ sur 70 actions sous conditions" },
    boursomarkets: { resume: "Sans objet" },
    dca: { resume: "Oui hors PEA", detail: "Plan programmé sans courtage à l’achat · PEA exclu" },
    garde: { rank: 1, resume: "0€" },
    // Le centre d'aide Saxo France confirme l'absence de PEA Jeune.
    pea: { pea: true, pme: true, jeune: false },
    ifu: { rank: 1, resume: "Oui" },
    cash: { resume: "Oui", detail: "Clients VIP · espèces éligibles hors PEA", post: "Oui pour les clients VIP, sur les espèces éligibles sous conditions, hors PEA." },
    pointFaible: "Plan programmé indisponible sur PEA ; PEA Jeune non proposé",
    post: {
      frais: ["Classic Euronext : 0,08%, minimum 2€ ; plafonnement PEA à 0,5%. Jusqu’au 31/12/2026, 0€ de courtage à l’achat et à la vente sur 70 actions sélectionnées pour certains PEA nouvellement ouverts ou transférés ; autres frais possibles."],
      dca: ["Plan Épargne Programmé : sans commission d’achat ni frais mensuels ; actuellement indisponible sur PEA."],
      garde: ["0€ sur les titres cotés ; conditions distinctes pour les titres non cotés du PEA."],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ❌",
      ifu: ["✅ Oui"],
      faibles: ["Plan programmé indisponible sur PEA ; PEA Jeune non proposé"],
      verdict: "Tu veux une plateforme avec courtage Euronext dès 2€",
    },
  },
].map((broker) => {
  const tariff = brokerTariffCopy(broker.id);
  const fields = brokerFieldCopies(broker.id);
  return applyBrokerProfile({ ...broker, ...(fields.garde ? {garde: {resume: fields.garde}} : {}), ...(tariff ? { frais: {resume: tariff.resume, detail: tariff.detail}, post: {...broker.post, frais: [tariff.full], ...(fields.garde ? {garde: [fields.garde]} : {})} } : {}), transfertPea: { resume: BROKER_EVIDENCE[broker.id].transfert.summary } });
});

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

export const documentedForAll = (ids, field) => ids.every((id) => BROKER_EVIDENCE[id]?.[field]?.status === 'confirmé');

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
  return buildBrokerTweet(selected.map(byId));
}
