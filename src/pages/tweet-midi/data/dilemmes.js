// Bibliothèque "Dilemme financier" — matrice combinatoire : quelques situations types,
// déclinées sur plusieurs montants (et parfois plusieurs enveloppes) via des gabarits de
// phrases, pour produire un ensemble large de dilemmes uniques sans tout réécrire à la main.
// Aucune bonne réponse n'est donnée : le but est de faire débattre en commentaire, jamais de
// trancher (contrairement au format "Vrai ou Faux").

export const MONTANTS = ["500€", "2 000€", "5 000€", "20 000€", "50 000€"];

// contextes: null => la situation ne varie que par montant (5 variantes, cf. MONTANTS).
// contextes: [...] => la situation varie aussi par enveloppe (5 × nb contextes variantes).
// montants (optionnel) : remplace MONTANTS pour cette seule situation, quand certains montants
// n'ont pas de sens pour elle (ex. un apport de 500€ pour une résidence principale) — audit du
// 25/08/2026, cf. commentaire de commit pour le détail des combinaisons écartées.
export const SITUATIONS = [
  {
    id: "credit-vs-investir",
    label: "Rembourser un crédit vs investir",
    question: "Tu rembourses le crédit ou tu investis ? 👇",
    contextes: null,
    contexte: (montant) =>
      `Tu reçois ${montant} de façon inattendue (prime, héritage, vente). Tu as un crédit en cours (conso ou immo).`,
    optionA: "Rembourser une partie du crédit pour alléger la dette.",
    optionB: "Investir, en espérant gagner plus que le coût du crédit.",
  },
  {
    id: "securite-vs-rendement",
    label: "Sécurité vs rendement",
    question: "Tu sécurises cette somme ou tu acceptes de la voir fluctuer ? 👇",
    contextes: ["ton assurance-vie", "ton PER"],
    contexte: (montant, contexte) => `Tu as ${montant} à placer sur ${contexte}.`,
    optionA: "Mettre la majorité sur le fonds en euros, selon les garanties du contrat.",
    optionB: "Garder une part en unités de compte, avec le risque de baisse qui va avec.",
  },
  {
    id: "court-vs-long-terme",
    label: "Court terme vs long terme",
    question: "Tu investis cette somme ou tu la gardes disponible ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} que tu ne comptes pas toucher avant plusieurs années — mais peut-être avant, si besoin.`,
    optionA: "L'investir dans un PEA, même si tu pouvais en avoir besoin avant cinq ans.",
    optionB: "La garder sur un livret, disponible si un imprévu arrive.",
  },
  {
    id: "simplicite-vs-optimisation",
    label: "Simplicité vs optimisation fiscale",
    question: "Un seul compte à suivre ou plusieurs enveloppes ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Un PEA avec un ETF monde : simple à suivre.",
    optionB: "PEA et assurance-vie selon tes objectifs, avec plusieurs contrats et frais à surveiller.",
  },
  {
    id: "liquidite-vs-blocage",
    label: "Liquidité vs blocage",
    question: "Tu bloques cette somme ou tu la gardes accessible ? 👇",
    contextes: ["ton PER", "un investissement immobilier locatif"],
    // 500€/2 000€ dans l'immobilier locatif en direct n'a pas de sens (personne n'achète un bien
    // avec ça) — reformulé en SCPI pour ces deux montants, seule façon réaliste d'investir dans
    // l'immobilier locatif à ce niveau. "ton PER" n'est pas concerné, réaliste sur toute la plage.
    contexte: (montant, contexte) => {
      const petitMontant = montant === "500€" || montant === "2 000€";
      if (contexte === "un investissement immobilier locatif" && petitMontant) {
        return `Tu as ${montant} à placer sur un premier investissement en SCPI.`;
      }
      return `Tu as ${montant} à placer sur ${contexte}.`;
    },
    optionA: "L'investir dans ce projet, avec ses règles de retrait et son risque de perte.",
    optionB: "La garder disponible si tu peux en avoir besoin bientôt.",
  },
  {
    id: "diversification-vs-conviction",
    label: "Diversification vs conviction forte",
    question: "Tu diversifies ou tu mises sur ta conviction ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Un ETF monde pour répartir le risque entre de nombreuses entreprises.",
    optionB: "Une grosse part sur une entreprise ou un secteur auquel tu crois.",
  },
  {
    id: "pea-vs-cto",
    label: "PEA vs CTO",
    question: "Tu privilégies le PEA ou le choix plus large du CTO ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir sur des actions européennes ou mondiales.`,
    optionA: "Le PEA, avec des actions éligibles ou un ETF monde adapté.",
    optionB: "Le CTO, pour accéder à plus de titres, avec une autre fiscalité sur les gains.",
  },
  {
    id: "immobilier-vs-bourse",
    label: "Immobilier vs bourse",
    question: "SCPI ou ETF : tu choisirais quoi ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Une SCPI pour l'immobilier, malgré les frais et les délais de revente.",
    optionB: "Un ETF pour investir en bourse et pouvoir revendre plus facilement.",
  },
  {
    id: "crypto-vs-traditionnel",
    label: "Crypto vs actifs traditionnels",
    question: "Tu mets une petite part en crypto ou tu passes ton tour ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Une petite part en crypto, même si elle peut fortement baisser.",
    optionB: "Aucune crypto : seulement actions, ETF ou obligations.",
  },
  {
    id: "dca-vs-lumpsum",
    label: "DCA vs lump sum",
    question: "Tu investis tout maintenant ou tu étales ? 👇",
    contextes: null,
    contexte: (montant) => `Tu reçois ${montant} d'un coup (héritage, prime, vente).`,
    optionA: "Tout investir maintenant, même si le marché baisse juste après.",
    optionB: "Étaler les achats sur plusieurs mois pour éviter d'entrer au même moment.",
  },
  {
    id: "gestion-pilotee-vs-libre",
    label: "Gestion pilotée vs libre",
    question: "Tu choisis toi-même tes supports ou tu délègues ? 👇",
    contextes: ["ton PER", "ton assurance-vie"],
    contexte: (montant, contexte) => `Tu as ${montant} sur ${contexte}.`,
    optionA: "Gestion pilotée : tu délègues, avec les frais et la stratégie du contrat.",
    optionB: "Gestion libre : tu décides, mais tu dois suivre tes choix.",
  },
  {
    id: "scpi-frais-entree-vs-sans-frais",
    label: "SCPI avec vs sans frais d'entrée",
    question: "Tu paies les frais à l'entrée ou tu regardes d'abord les autres coûts ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir en SCPI.`,
    optionA: "Une SCPI avec frais de souscription, en regardant aussi les frais de gestion.",
    optionB: "Une SCPI sans frais de souscription, en vérifiant ses autres frais et sa sortie.",
  },
  {
    id: "value-vs-croissance",
    label: "Value vs croissance",
    question: "Tu cherches une décote ou tu paies plus pour la croissance ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir en actions.`,
    optionA: "Des actions décotées par rapport à leurs fondamentaux.",
    optionB: "Des actions de croissance, plus chères aujourd'hui.",
  },
  {
    id: "residence-principale-vs-locatif",
    label: "Résidence principale vs locatif",
    question: "Tu achètes ton logement ou tu continues à investir ? 👇",
    contextes: null,
    // 500€/2 000€ retirés : aucun apport réaliste pour un achat immobilier ne descend à ce
    // niveau. 100 000€ ajouté pour rester crédible sur le haut de la plage.
    montants: ["20 000€", "50 000€", "100 000€"],
    contexte: (montant) => `Tu as ${montant} d'apport disponible.`,
    optionA: "Acheter ta résidence principale, quitte à mettre en pause tes autres investissements un moment.",
    optionB: "Continuer à louer et investir cette somme en bourse ou en SCPI.",
  },
  {
    id: "un-seul-courtier-vs-plusieurs",
    label: "Un seul courtier vs plusieurs",
    montants: ["20 000€", "50 000€"],
    question: "Un seul courtier ou deux comptes pour ne pas dépendre d'un seul ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à placer en bourse.`,
    optionA: "Tout centraliser chez un courtier, plus simple à suivre.",
    optionB: "Ouvrir un deuxième compte pour garder un accès en cas d'incident.",
  },
  {
    id: "dividendes-vs-capitalisation",
    label: "Dividendes vs capitalisation",
    question: "Tu reçois les dividendes ou tu les laisses dans le fonds ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir dans un ETF disponible en version distribuante ou capitalisante.`,
    optionA: "La part distribuante : tu reçois les dividendes versés.",
    optionB: "La part capitalisante : les revenus restent dans le fonds.",
  },
  {
    id: "rembourser-pret-etudes-vs-investir",
    label: "Rembourser un prêt étudiant vs investir",
    question: "Tu soldes ton prêt étudiant à bas taux ou tu investis ? 👇",
    contextes: null,
    // 20 000€/50 000€ retirés : avoir cette somme de côté tout en portant encore un prêt étudiant
    // colle mal au profil de l'audience cible (jeune, début de constitution de patrimoine).
    montants: ["500€", "2 000€", "5 000€"],
    contexte: (montant) => `Tu as ${montant} disponible, et un prêt étudiant à taux très bas en cours.`,
    optionA: "Solder le prêt pour ne plus avoir cette dette.",
    optionB: "Investir, en espérant gagner davantage que le coût du prêt.",
  },
];

// Aplati la matrice situation × contexte × montant en dilemmes concrets, une seule fois au
// chargement du module — jamais recalculé à chaque clic, conformément à la contrainte "aucune
// génération de texte libre au moment du clic".
function buildDilemmes() {
  const out = [];
  SITUATIONS.forEach((situation) => {
    const contextes = situation.contextes ?? [null];
    const montants = situation.montants ?? MONTANTS;
    contextes.forEach((contexte, ci) => {
      montants.forEach((montant, mi) => {
        out.push({
          id: `${situation.id}-${ci}-${mi}`,
          situationId: situation.id,
          contexteTexte: situation.contexte(montant, contexte),
          optionA: situation.optionA,
          optionB: situation.optionB,
          question: situation.question,
        });
      });
    });
  });
  return out;
}

export const DILEMMES = buildDilemmes();
