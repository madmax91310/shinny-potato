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
    question: "Toi, tu regardes d’abord le taux du crédit ou la tranquillité de le rembourser ? 👇",
    contextes: null,
    contexte: (montant) =>
      `Tu reçois ${montant} de façon inattendue (prime, héritage, vente). Tu as un crédit en cours (conso ou immo).`,
    optionA: "Rembourser une partie du crédit par anticipation, pour réduire le poids de la dette.",
    optionB: "Investir cette somme plutôt que solder le crédit plus vite, si le rendement espéré dépasse le taux du crédit.",
  },
  {
    id: "securite-vs-rendement",
    label: "Sécurité vs rendement",
    question: "Toi, quelle part de cette somme garderais-tu sur le fonds en euros ? 👇",
    contextes: ["ton assurance-vie", "ton PER"],
    contexte: (montant, contexte) => `Tu as ${montant} à placer sur ${contexte}.`,
    optionA: "Placer la majorité sur le fonds en euros pour privilégier la sécurité, selon les garanties du contrat.",
    optionB: "Garder une part en unités de compte pour chercher plus de croissance, en acceptant les baisses possibles.",
  },
  {
    id: "court-vs-long-terme",
    label: "Court terme vs long terme",
    question: "Toi, quelle part garderais-tu disponible en cas d'imprévu ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} que tu ne comptes pas toucher avant plusieurs années — mais peut-être avant, si besoin.`,
    optionA: "Investir pour le long terme dans un PEA, en acceptant le risque de marché et la fiscalité d'un retrait avant 5 ans.",
    optionB: "Garder cette somme sur un livret réglementé, disponible sans subir une baisse des marchés.",
  },
  {
    id: "simplicite-vs-optimisation",
    label: "Simplicité vs optimisation fiscale",
    question: "Toi, combien d’enveloppes es-tu prêt à suivre pour cette somme ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Garder une seule enveloppe, par exemple un PEA avec un ETF monde, pour simplifier le suivi.",
    optionB: "Répartir entre PEA et assurance-vie selon tes objectifs, quitte à suivre plusieurs contrats et leurs frais.",
  },
  {
    id: "liquidite-vs-blocage",
    label: "Liquidité vs blocage",
    question: "Toi, combien de temps pourrais-tu te passer de cet argent ? 👇",
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
    optionA: "Investir dans ce projet de long terme, en acceptant ses règles de retrait et son risque de perte.",
    optionB: "Conserver cette somme sur un support disponible si tu peux en avoir besoin bientôt.",
  },
  {
    id: "diversification-vs-conviction",
    label: "Diversification vs conviction forte",
    question: "Toi, quelle part maximale laisserais-tu à une seule conviction ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Tout répartir sur un ETF monde ultra-diversifié.",
    optionB: "Concentrer une bonne partie sur une conviction forte (un secteur, une entreprise) que tu penses gagnante.",
  },
  {
    id: "pea-vs-cto",
    label: "PEA vs CTO",
    question: "Toi, ce placement doit-il absolument rester dans ton PEA ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir sur des actions européennes ou mondiales.`,
    optionA: "Utiliser le PEA : actions européennes éligibles ou ETF monde adapté au PEA, souvent à réplication synthétique.",
    optionB: "Passer par un CTO pour accéder à un choix plus large de titres, avec une fiscalité différente sur les gains.",
  },
  {
    id: "immobilier-vs-bourse",
    label: "Immobilier vs bourse",
    question: "Toi, tu privilégies la souplesse d’un ETF ou l’exposition à l’immobilier ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Choisir une SCPI pour s'exposer à l'immobilier, en acceptant ses frais et ses délais de revente.",
    optionB: "Direction la bourse (ETF, actions).",
  },
  {
    id: "crypto-vs-traditionnel",
    label: "Crypto vs actifs traditionnels",
    question: "Toi, quelle part de cette somme serais-tu prêt à voir fortement varier ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Mettre une petite partie en crypto, en acceptant que cette poche puisse fortement baisser.",
    optionB: "Rester 100% sur des actifs traditionnels (actions, ETF, obligations).",
  },
  {
    id: "dca-vs-lumpsum",
    label: "DCA vs lump sum",
    question: "Toi, tu pourrais investir toute cette somme aujourd’hui et tenir si le marché baissait demain ? 👇",
    contextes: null,
    contexte: (montant) => `Tu reçois ${montant} d'un coup (héritage, prime, vente).`,
    optionA: "Tout investir en une fois (lump sum), pour être exposé au marché tout de suite.",
    optionB: "L'étaler sur plusieurs mois (DCA), pour lisser le risque d'un mauvais timing d'entrée.",
  },
  {
    id: "gestion-pilotee-vs-libre",
    label: "Gestion pilotée vs libre",
    question: "Toi, tu préfères régler la répartition toi-même ou déléguer ce suivi ? 👇",
    contextes: ["ton PER", "ton assurance-vie"],
    contexte: (montant, contexte) => `Tu as ${montant} sur ${contexte}.`,
    optionA: "Déléguer les choix à une gestion pilotée, selon les frais et la stratégie prévus au contrat.",
    optionB: "Choisir la gestion libre pour piloter toi-même la répartition, plus de travail mais plus de contrôle.",
  },
  {
    id: "scpi-frais-entree-vs-sans-frais",
    label: "SCPI avec vs sans frais d'entrée",
    question: "Toi, sur combien d’années comparerais-tu le coût total de ces deux SCPI ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir en SCPI.`,
    optionA: "Une SCPI avec frais de souscription : regarder aussi les frais de gestion et les conditions de revente.",
    optionB: "Une SCPI sans frais de souscription : vérifier les autres frais et les éventuelles pénalités de sortie anticipée.",
  },
  {
    id: "value-vs-croissance",
    label: "Value vs croissance",
    question: "Toi, tu paierais plus cher pour la croissance ou tu chercherais d’abord une décote ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir en actions.`,
    optionA: "Miser sur des valeurs \"value\", décotées par rapport à leurs fondamentaux.",
    optionB: "Miser sur des valeurs de croissance, plus chères mais avec un potentiel de développement plus fort.",
  },
  {
    id: "residence-principale-vs-locatif",
    label: "Résidence principale vs locatif",
    question: "Toi, tu veux d’abord sécuriser ton logement ou continuer à investir cet apport ? 👇",
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
    question: "Toi, à partir de quel montant ouvrirais-tu un deuxième compte ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à placer en bourse.`,
    optionA: "Tout centraliser chez un seul courtier, pour la simplicité de suivi.",
    optionB: "Répartir entre plusieurs courtiers pour ne pas dépendre d'un seul accès à tes comptes en cas d'incident.",
  },
  {
    id: "dividendes-vs-capitalisation",
    label: "Dividendes vs capitalisation",
    question: "Toi, tu as besoin de recevoir les dividendes ou tu veux les réinvestir ? 👇",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir dans un ETF disponible en version distribuante ou capitalisante.`,
    optionA: "Choisir la part distribuante (Dist), pour recevoir les dividendes lorsqu'ils sont versés.",
    optionB: "Choisir la part capitalisante (Acc), pour laisser les revenus dans le fonds sans passer d'ordre de réinvestissement.",
  },
  {
    id: "rembourser-pret-etudes-vs-investir",
    label: "Rembourser un prêt étudiant vs investir",
    question: "Toi, tu garderais ce prêt à bas taux ou tu préférerais le solder ? 👇",
    contextes: null,
    // 20 000€/50 000€ retirés : avoir cette somme de côté tout en portant encore un prêt étudiant
    // colle mal au profil de l'audience cible (jeune, début de constitution de patrimoine).
    montants: ["500€", "2 000€", "5 000€"],
    contexte: (montant) => `Tu as ${montant} disponible, et un prêt étudiant à taux très bas en cours.`,
    optionA: "Rembourser le prêt étudiant par anticipation, pour solder la dette et dormir tranquille.",
    optionB: "Investir cette somme, si le rendement espéré dépasse largement le taux du prêt.",
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
