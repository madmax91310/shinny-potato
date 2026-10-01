// Bibliothèque "Dilemme financier" — matrice combinatoire : quelques situations types,
// déclinées sur plusieurs montants (et parfois plusieurs enveloppes) via des gabarits de
// phrases, pour produire un ensemble large de dilemmes uniques sans tout réécrire à la main.
// Chaque situation commence par une question directe, suivie de deux réponses courtes
// et d’une relance qui met le choix à l’épreuve.
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
    question: "Si ton placement baissait, tu serais toujours à l'aise avec ce crédit ?",
    contextes: null,
    contexte: (montant) =>
      `Tu reçois ${montant}, mais tu as encore un crédit à rembourser. Tu investirais cet argent en gardant la dette ?`,
    optionA: "Je rembourse une partie du crédit.",
    optionB: "J'investis et je garde les mensualités.",
  },
  {
    id: "securite-vs-rendement",
    label: "Sécurité vs rendement",
    question: "Une baisse te ferait revoir ton choix, ou tu l'aurais vraiment acceptée dès le départ ?",
    contextes: ["ton assurance-vie", "ton PER"],
    contexte: (montant, contexte) =>
      `Tu placerais ${montant} sur ${contexte} en acceptant de voir une partie de cette somme baisser ?`,
    optionA: "Je privilégie le fonds en euros, selon les garanties du contrat.",
    optionB: "Je prends aussi des unités de compte, avec un risque de perte.",
  },
  {
    id: "court-vs-long-terme",
    label: "Court terme vs long terme",
    question: "Si tu devais récupérer l'argent en pleine baisse, tu ferais comment ?",
    contextes: null,
    contexte: (montant) =>
      `Tu investirais ${montant} en actions alors que tu n'es pas sûr de pouvoir laisser cet argent plusieurs années ?`,
    optionA: "Je l'investis dans un PEA.",
    optionB: "Je le garde disponible sur un livret.",
  },
  {
    id: "simplicite-vs-optimisation",
    label: "Simplicité vs optimisation fiscale",
    question: "Qu'est-ce qui te ferait accepter plus de frais et de contrats à surveiller ?",
    contextes: null,
    contexte: (montant) =>
      `Pour investir ${montant}, tu ouvrirais plusieurs enveloppes ou tu préférerais n'avoir qu'un compte à suivre ?`,
    optionA: "Un PEA avec un ETF monde me suffit.",
    optionB: "Je répartis entre PEA et assurance-vie selon mes objectifs.",
  },
  {
    id: "liquidite-vs-blocage",
    label: "Liquidité vs blocage",
    question: "Qu'est-ce qui te ferait regretter de ne plus avoir cette somme sous la main ?",
    contextes: ["ton PER", "un investissement immobilier locatif"],
    // 500€/2 000€ dans l'immobilier locatif en direct n'a pas de sens (personne n'achète un bien
    // avec ça) — reformulé en SCPI pour ces deux montants, seule façon réaliste d'investir dans
    // l'immobilier locatif à ce niveau. "ton PER" n'est pas concerné, réaliste sur toute la plage.
    contexte: (montant, contexte) => {
      const petitMontant = montant === "500 €" || montant === "2 000 €";
      if (contexte === "un investissement immobilier locatif" && petitMontant) {
        return `Tu investirais ${montant} dans une première SCPI, même si tu ne pouvais pas revendre tes parts au moment voulu ?`;
      }
      return `Tu placerais ${montant} dans ${contexte === "ton PER" ? "ton PER" : "un projet immobilier locatif"}, quitte à ne pas pouvoir les récupérer librement ?`;
    },
    optionA: "J'investis, avec les contraintes de retrait et le risque de perte.",
    optionB: "Je garde l'argent disponible.",
  },
  {
    id: "diversification-vs-conviction",
    label: "Diversification vs conviction forte",
    question: "Si elle décevait pendant plusieurs années, tu garderais la même conviction ?",
    contextes: null,
    contexte: (montant) =>
      `Tu mettrais une grosse part de tes ${montant} sur une seule entreprise parce que tu crois vraiment en elle ?`,
    optionA: "Je préfère répartir avec un ETF monde.",
    optionB: "Oui, j'assume de concentrer une grosse part dessus.",
  },
  {
    id: "pea-vs-cto",
    label: "PEA vs CTO",
    question: "Cette conviction vaut-elle pour toi une autre fiscalité sur les gains ?",
    contextes: null,
    contexte: (montant) =>
      `Avec ${montant} à investir, tu renoncerais à une action qui te plaît parce qu'elle n'est pas éligible au PEA ?`,
    optionA: "Oui, je reste sur les titres et ETF éligibles au PEA.",
    optionB: "Non, j'ouvre un CTO pour pouvoir l'acheter.",
  },
  {
    id: "immobilier-vs-bourse",
    label: "Immobilier vs bourse",
    question: "Qu'est-ce qui te gênerait le plus : voir la baisse ou devoir attendre pour revendre ?",
    contextes: null,
    contexte: (montant) =>
      `Pour tes ${montant}, tu serais plus à l'aise avec des parts de SCPI ou un ETF actions dont tu peux voir le cours bouger chaque jour ?`,
    optionA: "Je choisis la SCPI, avec ses frais et ses délais de revente.",
    optionB: "Je choisis l'ETF, en acceptant les baisses de la Bourse.",
  },
  {
    id: "crypto-vs-traditionnel",
    label: "Crypto vs actifs traditionnels",
    question: "Si les cryptos s'envolaient sans toi, tu garderais la même décision ?",
    contextes: null,
    contexte: (montant) =>
      `Sur tes ${montant}, tu mettrais une petite part en crypto, quitte à la voir fortement chuter ?`,
    optionA: "Oui, j'accepte ce risque sur une petite part.",
    optionB: "Non, je reste sur les actions, ETF ou obligations.",
  },
  {
    id: "dca-vs-lumpsum",
    label: "DCA vs lump sum",
    question: "Et si la Bourse montait pendant que tu étales, tu garderais ton plan ?",
    contextes: null,
    contexte: (montant) =>
      `Tu serais à l'aise pour investir ${montant} d'un coup, quitte à voir ton portefeuille baisser dès le lendemain ?`,
    optionA: "Oui, j'investis tout maintenant.",
    optionB: "Je préfère étaler sur plusieurs mois.",
  },
  {
    id: "gestion-pilotee-vs-libre",
    label: "Gestion pilotée vs libre",
    question: "Si les résultats te décevaient, tu serais prêt à reprendre la main ?",
    contextes: ["ton PER", "ton assurance-vie"],
    contexte: (montant, contexte) =>
      `Pour les ${montant} sur ${contexte}, tu paierais quelqu'un pour choisir tes placements à ta place ?`,
    optionA: "Oui, je délègue en gestion pilotée.",
    optionB: "Non, je choisis mes supports en gestion libre.",
  },
  {
    id: "scpi-frais-entree-vs-sans-frais",
    label: "SCPI avec vs sans frais d'entrée",
    question: "Si les autres frais étaient plus élevés, l'absence de frais d'entrée pèserait toujours autant ?",
    contextes: null,
    contexte: (montant) =>
      `Tu investirais ${montant} dans une SCPI avec des frais d'entrée alors qu'il en existe sans ?`,
    optionA: "Oui, si le reste du placement me convainc.",
    optionB: "Non, je compare celles sans frais d'entrée.",
  },
  {
    id: "value-vs-croissance",
    label: "Value vs croissance",
    question: "Si la décote persistait ou que la croissance décevait, qu'est-ce qui te ferait vendre ?",
    contextes: null,
    contexte: (montant) =>
      `Pour investir tes ${montant}, tu achèterais une entreprise que le marché boude ou tu paierais plus cher celle dont tout le monde attend de la croissance ?`,
    optionA: "Je cherche une entreprise que j'estime sous-évaluée.",
    optionB: "J'accepte de payer plus pour la croissance attendue.",
  },
  {
    id: "residence-principale-vs-locatif",
    label: "Résidence principale vs locatif",
    question: "Qu'est-ce qui te manquerait le plus : être chez toi ou continuer à investir ?",
    contextes: null,
    // 500€/2 000€ retirés : aucun apport réaliste pour un achat immobilier ne descend à ce
    // niveau. 100 000€ ajouté pour rester crédible sur le haut de la plage.
    montants: ["20 000€", "50 000€", "100 000€"],
    contexte: (montant) =>
      `Tu utiliserais tes ${montant} d'apport pour devenir propriétaire, quitte à mettre tes autres investissements en pause ?`,
    optionA: "Oui, je privilégie ma résidence principale.",
    optionB: "Je continue à louer et j'investis cette somme.",
  },
  {
    id: "un-seul-courtier-vs-plusieurs",
    label: "Un seul courtier vs plusieurs",
    montants: ["20 000€", "50 000€"],
    question: "Deux comptes à gérer au quotidien, ça te rassurerait ou ça t'agacerait ?",
    contextes: null,
    contexte: (montant) =>
      `Tu laisserais tes ${montant} chez un seul courtier, même si un incident pouvait t'empêcher temporairement d'y accéder ?`,
    optionA: "Oui, je préfère un seul compte à suivre.",
    optionB: "Je répartis chez deux courtiers.",
  },
  {
    id: "dividendes-vs-capitalisation",
    label: "Dividendes vs capitalisation",
    question: "Si tu recevais les dividendes, tu les dépenserais ou tu les réinvestirais ?",
    contextes: null,
    contexte: (montant) =>
      `Avec ${montant} dans un ETF, tu préfères recevoir les dividendes ou les laisser se réinvestir dans le fonds ?`,
    optionA: "Je choisis la part distribuante.",
    optionB: "Je choisis la part capitalisante.",
  },
  {
    id: "rembourser-pret-etudes-vs-investir",
    label: "Rembourser un prêt étudiant vs investir",
    question: "Même à bas taux, cette dette te pèserait-elle si ton placement baissait ?",
    contextes: null,
    // 20 000€/50 000€ retirés : avoir cette somme de côté tout en portant encore un prêt étudiant
    // colle mal au profil de l'audience cible (jeune, début de constitution de patrimoine).
    montants: ["500€", "2 000€", "5 000€"],
    contexte: (montant) =>
      `Tu as ${montant} de côté et un prêt étudiant à taux très bas. Tu investirais cet argent plutôt que de réduire ta dette ?`,
    optionA: "Je rembourse une partie du prêt.",
    optionB: "J'investis et je garde le prêt.",
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
          contexteTexte: situation.contexte(montant.replace("€", " €"), contexte),
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
