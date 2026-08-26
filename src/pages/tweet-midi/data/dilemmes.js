// Bibliothèque "Dilemme financier" — matrice combinatoire : quelques situations types,
// déclinées sur plusieurs montants (et parfois plusieurs enveloppes) via des gabarits de
// phrases, pour produire un ensemble large de dilemmes uniques sans tout réécrire à la main.
// Aucune bonne réponse n'est donnée : le but est de faire débattre en commentaire, jamais de
// trancher (contrairement au format "Vrai ou Faux").

export const MONTANTS = ["500€", "5 000€", "20 000€"];

// contextes: null => la situation ne varie que par montant (3 variantes).
// contextes: [...] => la situation varie aussi par enveloppe (3 × nb contextes variantes).
export const SITUATIONS = [
  {
    id: "credit-vs-investir",
    contextes: null,
    contexte: (montant) =>
      `Tu reçois ${montant} de façon inattendue (prime, héritage, vente). Tu as un crédit en cours (conso ou immo).`,
    optionA: "Rembourser une partie du crédit par anticipation, pour réduire le poids de la dette.",
    optionB: "Investir cette somme plutôt que solder le crédit plus vite, si le rendement espéré dépasse le taux du crédit.",
  },
  {
    id: "securite-vs-rendement",
    contextes: ["ton assurance-vie", "ton PER"],
    contexte: (montant, contexte) => `Tu as ${montant} à placer sur ${contexte}.`,
    optionA: "Tout sécuriser sur le fonds euros : capital garanti, rendement modeste.",
    optionB: "Tout miser sur des unités de compte (ETF, actions) pour viser plus de rendement, sans garantie.",
  },
  {
    id: "court-vs-long-terme",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} que tu ne comptes pas toucher avant plusieurs années — mais peut-être avant, si besoin.`,
    optionA: "Bloquer sur du long terme pour optimiser la fiscalité (PER, PEA après 5 ans).",
    optionB: "Garder disponible sur du court terme (Livret, CTO), quitte à moins optimiser fiscalement.",
  },
  {
    id: "simplicite-vs-optimisation",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Un seul ETF monde tout-en-un, sans se prendre la tête.",
    optionB: "Répartir entre plusieurs enveloppes (PEA, assurance-vie, PER) pour optimiser la fiscalité, au prix de plus de gestion.",
  },
  {
    id: "liquidite-vs-blocage",
    contextes: ["ton PER", "un investissement immobilier locatif"],
    contexte: (montant, contexte) => `Tu as ${montant} à placer sur ${contexte}.`,
    optionA: "Accepter de bloquer les fonds sur la durée, pour l'avantage fiscal ou le rendement associé.",
    optionB: "Garder la liquidité totale, quitte à moins optimiser sur la durée.",
  },
  {
    id: "diversification-vs-conviction",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Tout répartir sur un ETF monde ultra-diversifié.",
    optionB: "Concentrer une bonne partie sur une conviction forte (un secteur, une entreprise) que tu penses gagnante.",
  },
  {
    id: "pea-vs-cto",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir sur des actions européennes ou mondiales.`,
    optionA: "Les loger dans ton PEA pour la fiscalité, quitte à te limiter à des ETF synthétiques pour viser le monde entier.",
    optionB: "Tout mettre en CTO pour la liberté totale de choix, quitte à payer plus d'impôts sur les gains.",
  },
  {
    id: "immobilier-vs-bourse",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Direction l'immobilier locatif (SCPI ou en direct).",
    optionB: "Direction la bourse (ETF, actions).",
  },
  {
    id: "crypto-vs-traditionnel",
    contextes: null,
    contexte: (montant) => `Tu as ${montant} à investir.`,
    optionA: "Une partie en crypto (Bitcoin, Ethereum) pour viser plus de performance, au prix d'une forte volatilité.",
    optionB: "Rester 100% sur des actifs traditionnels (actions, ETF, obligations).",
  },
  {
    id: "dca-vs-lumpsum",
    contextes: null,
    contexte: (montant) => `Tu reçois ${montant} d'un coup (héritage, prime, vente).`,
    optionA: "Tout investir en une fois (lump sum), pour être exposé au marché tout de suite.",
    optionB: "L'étaler sur plusieurs mois (DCA), pour lisser le risque d'un mauvais timing d'entrée.",
  },
];

// Aplati la matrice situation × contexte × montant en dilemmes concrets, une seule fois au
// chargement du module — jamais recalculé à chaque clic, conformément à la contrainte "aucune
// génération de texte libre au moment du clic".
function buildDilemmes() {
  const out = [];
  SITUATIONS.forEach((situation) => {
    const contextes = situation.contextes ?? [null];
    contextes.forEach((contexte, ci) => {
      MONTANTS.forEach((montant, mi) => {
        out.push({
          id: `${situation.id}-${ci}-${mi}`,
          situationId: situation.id,
          contexteTexte: situation.contexte(montant, contexte),
          optionA: situation.optionA,
          optionB: situation.optionB,
        });
      });
    });
  });
  return out;
}

export const DILEMMES = buildDilemmes();
