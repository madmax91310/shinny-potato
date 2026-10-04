// Dilemmes interactifs : situation concrète, deux choix avec leurs conséquences, relance A/B.
// Aucun verdict : le lecteur explique sa décision en commentaire.
export const MONTANTS = ["500€", "2 000€", "5 000€", "20 000€", "50 000€"];

export const SITUATIONS = [
  {
    "id": "credit-vs-investir",
    "label": "Rembourser un crédit vs investir",
    "contextes": null,
    "accroche": "💳 Tu reçois {montant}. Tu as encore un crédit à rembourser et tu hésites à investir cet argent.",
    "choix": "Tu réduis ta dette ou tu investis en gardant les mensualités ?",
    "optionA": "Tu rembourses une partie du crédit.\nTu réduis ta dette. Le gain dépend du taux du prêt et des éventuels frais de remboursement.",
    "optionB": "Tu investis cet argent.\nTu gardes les mensualités et tu acceptes que ton placement puisse perdre de la valeur.",
    "tension": "Ton épargne de précaution est déjà constituée. Mais le crédit, lui, reste à payer même si ton placement baisse.",
    "question": "A ou B ? Quel taux de crédit te ferait choisir le remboursement ?"
  },
  {
    "id": "securite-vs-rendement",
    "label": "Sécurité vs rendement",
    "contextes": [
      "ton assurance-vie",
      "ton PER"
    ],
    "accroche": "🛡️ Tu as {montant} à placer sur {contexte}. Tu hésites entre le fonds en euros et un mélange avec des unités de compte.",
    "choix": "Tu privilégies la garantie du fonds en euros ou tu acceptes une part de risque ?",
    "optionA": "Tu privilégies le fonds en euros.\nTu choisis sa garantie, dont les modalités dépendent du contrat.",
    "optionB": "Tu ajoutes des unités de compte.\nTu cherches davantage de potentiel, mais cette partie peut perdre de la valeur.",
    "tension": "Cet argent est destiné au long terme. Pourtant, tu sais que voir le solde baisser pourrait te travailler.",
    "question": "A ou B ? Quelle part tu accepterais vraiment de voir baisser ?"
  },
  {
    "id": "court-vs-long-terme",
    "label": "Court terme vs long terme",
    "contextes": null,
    "accroche": "📅 Tu as {montant} de côté. Tu aimerais investir en actions, mais tu pourrais avoir besoin de cet argent dans trois ans.",
    "choix": "Tu investis quand même ou tu gardes la somme disponible sur un livret ?",
    "optionA": "Tu investis dans un ETF actions.\nTu acceptes de devoir repousser ton projet si le marché baisse au mauvais moment.",
    "optionB": "Tu gardes cet argent sur un livret garanti et disponible.\nTu sais sur quelle somme compter, même si la Bourse monte sans toi.",
    "tension": "Ce n’est pas ton épargne de précaution. C’est l’argent d’un projet dont la date reste incertaine.",
    "question": "A ou B ? Tu pourrais vraiment décaler ton projet de plusieurs années ?"
  },
  {
    "id": "simplicite-vs-optimisation",
    "label": "Simplicité vs optimisation fiscale",
    "contextes": null,
    "accroche": "🗂️ Tu as {montant} à investir pour longtemps. Tu hésites entre un PEA avec un ETF World et une répartition entre PEA et assurance-vie.",
    "choix": "Tu gardes un seul compte ou tu ouvres une deuxième enveloppe ?",
    "optionA": "Tu gardes le PEA avec un ETF World.\nTu as un seul compte et une seule ligne à suivre.",
    "optionB": "Tu répartis entre PEA et assurance-vie.\nTu peux choisir des supports différents selon tes objectifs, mais tu as deux contrats et leurs frais à regarder.",
    "tension": "Tu veux investir régulièrement. Tu n’as pas envie que gérer tes placements devienne un deuxième travail.",
    "question": "A ou B ? Qu’est-ce qui justifierait une deuxième enveloppe pour toi ?"
  },
  {
    "id": "liquidite-vs-blocage",
    "label": "Liquidité vs blocage",
    "contextes": [
      "ton PER",
      "des parts de SCPI"
    ],
    "accroche": "🔒 Tu as {montant} disponibles. Tu envisages de les investir dans {contexte}.",
    "choix": "Tu acceptes les contraintes pour récupérer l’argent ou tu privilégies sa disponibilité ?",
    "optionA": "Tu investis cette somme.\nTu acceptes les conditions de retrait ou les délais de revente propres au placement.",
    "optionB": "Tu gardes cet argent disponible.\nTu peux changer de projet sans dépendre d’un retrait ou d’une revente.",
    "tension": "Ton épargne de précaution est déjà à part. Mais tu ne sais pas encore à quoi ressemblera ta vie dans cinq ans.",
    "question": "A ou B ? Quel imprévu te ferait regretter de ne plus avoir cet argent sous la main ?"
  },
  {
    "id": "diversification-vs-conviction",
    "label": "Diversification vs conviction forte",
    "contextes": null,
    "accroche": "🎯 Tu as {montant} à investir. Une entreprise te plaît tellement que tu envisages d’y mettre la moitié de cette somme.",
    "choix": "Tu suis ta conviction ou tu répartis avec un ETF World ?",
    "optionA": "Tu choisis l’ETF World.\nTu répartis entre de nombreuses entreprises, en acceptant les baisses du marché.",
    "optionB": "Tu investis la moitié dans cette entreprise.\nSes résultats pèseront beaucoup plus sur ton portefeuille, dans les deux sens.",
    "tension": "Tu connais bien ses produits. Mais aimer une entreprise ne garantit pas que son action sera un bon investissement.",
    "question": "A ou B ? Tu as déjà eu une conviction assez forte pour y mettre autant ?"
  },
  {
    "id": "pea-vs-cto",
    "label": "PEA vs CTO",
    "contextes": null,
    "accroche": "🏦 Tu as {montant} à investir. L’action que tu veux acheter n’est pas éligible au PEA.",
    "choix": "Tu choisis un autre placement dans ton PEA ou tu ouvres un CTO pour cette action ?",
    "optionA": "Tu restes dans ton PEA.\nTu renonces à cette action et tu choisis un titre ou un ETF éligible.",
    "optionB": "Tu ouvres un CTO.\nTu peux acheter cette action, avec des frais à comparer et une fiscalité différente sur les gains.",
    "tension": "Tu as déjà un PEA. Cette entreprise est la seule raison qui te pousse à ouvrir un autre compte.",
    "question": "A ou B ? Une seule action peut te faire ouvrir une nouvelle enveloppe ?"
  },
  {
    "id": "immobilier-vs-bourse",
    "label": "Immobilier vs bourse",
    "contextes": null,
    "accroche": "🏘️ Tu as {montant} à investir pour longtemps. Tu hésites entre des parts de SCPI et un ETF actions.",
    "choix": "Tu préfères des revenus immobiliers potentiels ou un placement coté en Bourse ?",
    "optionA": "Tu choisis la SCPI.\nTu acceptes ses frais, des revenus non garantis et une revente qui peut prendre du temps.",
    "optionB": "Tu choisis l’ETF actions.\nTu peux passer un ordre en Bourse, mais tu verras son prix varier et il peut fortement baisser.",
    "tension": "Dans les deux cas, tu peux perdre de l’argent. Ne pas voir un prix bouger tous les jours ne supprime pas ce risque.",
    "question": "A ou B ? Qu’est-ce qui te gênerait le plus : voir la baisse ou attendre pour revendre ?"
  },
  {
    "id": "crypto-vs-traditionnel",
    "label": "Crypto vs actifs traditionnels",
    "contextes": null,
    "accroche": "₿ Tu as un portefeuille de {montant}. Tu hésites à consacrer 5 % de cette somme au bitcoin.",
    "choix": "Tu ajoutes du bitcoin ou tu gardes ta répartition actuelle ?",
    "optionA": "Tu ajoutes 5 % de bitcoin.\nTu acceptes de fortes variations sur cette part de ton portefeuille.",
    "optionB": "Tu gardes ta répartition actuelle.\nTu restes sur les placements que tu as choisis, même si le bitcoin s’envole sans toi.",
    "tension": "Tu n’as pas besoin de cet argent à court terme. Mais tu sais que tu regarderas davantage les cours si tu en achètes.",
    "question": "A ou B ? Une forte hausse sans toi te ferait changer d’avis ?"
  },
  {
    "id": "dca-vs-lumpsum",
    "label": "DCA vs lump sum",
    "contextes": null,
    "accroche": "💰 Tu reçois une prime de {montant} que tu comptes investir dans un ETF World pour quinze ans.",
    "choix": "Tu préfères investir les {montant} dès maintenant ou verser {mensualite} par mois pendant dix mois ?",
    "optionA": "Tu investis les {montant} d’un coup.\nTout l’argent commence à travailler immédiatement. Mais si ça baisse juste après, tu le verras sur toute la somme.",
    "optionB": "Tu verses {mensualite} par mois pendant dix mois.\nTu étales tes achats. Mais si ça monte entre-temps, tu achèteras progressivement plus cher.",
    "tension": "Dans les deux cas, tu choisis le même ETF.",
    "question": "A ou B ? Qu’est-ce qui te ferait le plus regretter ton choix : une baisse juste après l’achat ou une hausse pendant que tu attends ?"
  },
  {
    "id": "gestion-pilotee-vs-libre",
    "label": "Gestion pilotée vs libre",
    "contextes": [
      "ton PER",
      "ton assurance-vie"
    ],
    "accroche": "🧭 Tu as {montant} sur {contexte}. Tu peux choisir tes supports ou déléguer leur gestion.",
    "choix": "Tu préfères décider toi-même ou payer pour déléguer ?",
    "optionA": "Tu choisis la gestion pilotée.\nTu délègues les choix dans le cadre du mandat, avec des frais à comparer et un risque de perte.",
    "optionB": "Tu choisis la gestion libre.\nTu sélectionnes tes supports et tu assumes les décisions quand ça baisse.",
    "tension": "Tu veux suivre tes placements sans y passer tous tes week-ends. Déléguer ne garantit pas de meilleurs résultats.",
    "question": "A ou B ? Tu préfères payer pour déléguer ou prendre le temps d’apprendre ?"
  },
  {
    "id": "scpi-frais-entree-vs-sans-frais",
    "label": "SCPI avec vs sans frais d'entrée",
    "contextes": null,
    "accroche": "🏢 Tu as {montant} à investir en SCPI. Deux te plaisent : l’une a des frais d’entrée, l’autre n’en a pas.",
    "choix": "Tu gardes les deux dans ta comparaison ou tu écartes celle avec des frais d’entrée ?",
    "optionA": "Tu compares les deux.\nTu regardes aussi les immeubles, les autres frais et les conditions de sortie avant de choisir.",
    "optionB": "Tu compares uniquement les SCPI sans frais d’entrée.\nTu évites ce coût au départ, tout en vérifiant les autres frais.",
    "tension": "Les deux peuvent perdre de la valeur et leurs revenus ne sont pas garantis. « Sans frais d’entrée » ne veut pas dire « sans frais ».",
    "question": "A ou B ? Qu’est-ce qui pourrait te convaincre de payer des frais à l’entrée ?"
  },
  {
    "id": "value-vs-croissance",
    "label": "Value vs croissance",
    "contextes": null,
    "accroche": "🔎 Tu as {montant} à investir en actions. Tu hésites entre une entreprise délaissée par le marché et une autre dont la croissance attire les investisseurs.",
    "choix": "Tu cherches une bonne affaire ou tu paies davantage pour la croissance attendue ?",
    "optionA": "Tu choisis l’entreprise que tu estimes sous-évaluée.\nTu espères que le marché reverra son jugement, mais la décote peut durer.",
    "optionB": "Tu choisis l’entreprise en croissance.\nTu acceptes un prix plus élevé, avec le risque que ses résultats déçoivent les attentes.",
    "tension": "Tu peux te tromper dans les deux cas : un prix bas n’est pas forcément une bonne affaire, et une belle croissance peut déjà être dans le prix.",
    "question": "A ou B ? Qu’est-ce qui te ferait reconnaître que tu t’es trompé ?"
  },
  {
    "id": "residence-principale-vs-locatif",
    "label": "Acheter sa résidence principale vs louer",
    "contextes": null,
    "montants": [
      "20 000€",
      "50 000€",
      "100 000€"
    ],
    "accroche": "🏠 Tu as {montant} d’apport. Acheter ta résidence principale est possible, mais cela mettrait tes autres investissements en pause.",
    "choix": "Tu achètes maintenant ou tu continues à louer pour garder ta capacité à investir ?",
    "optionA": "Tu achètes ta résidence principale.\nTu privilégies ton logement et tu acceptes de ralentir tes autres projets financiers.",
    "optionB": "Tu continues à louer.\nTu gardes de la souplesse et tu investis cette somme, tout en continuant à payer un loyer.",
    "tension": "Tu as prévu une réserve pour les imprévus dans les deux cas. La question, c’est ce que tu veux faire passer en premier.",
    "question": "A ou B ? Être propriétaire vaut pour toi quelques années d’investissement en moins ?"
  },
  {
    "id": "un-seul-courtier-vs-plusieurs",
    "label": "Un seul courtier vs plusieurs",
    "contextes": null,
    "montants": [
      "20 000€",
      "50 000€"
    ],
    "accroche": "📱 Tu as {montant} investis chez un seul courtier. Une panne te bloque l’accès au compte pendant une journée.",
    "choix": "Tu gardes un seul courtier ou tu répartis tes prochains achats chez un deuxième ?",
    "optionA": "Tu gardes un seul courtier.\nTu préfères un seul compte à suivre et tu acceptes une indisponibilité temporaire.",
    "optionB": "Tu utilises deux courtiers.\nTu gardes un autre accès pour tes opérations, mais tu as deux comptes et leurs frais à suivre.",
    "tension": "Tu investis pour longtemps et tu n’avais pas besoin de vendre ce jour-là. Pourtant, ne pas pouvoir ouvrir ton compte t’a agacé.",
    "question": "A ou B ? Une panne d’une journée suffirait à te faire ouvrir un deuxième compte ?"
  },
  {
    "id": "dividendes-vs-capitalisation",
    "label": "Dividendes vs capitalisation",
    "contextes": null,
    "accroche": "💶 Tu as {montant} à investir dans un ETF. Deux parts du même fonds existent : l’une distribue les revenus, l’autre les réinvestit.",
    "choix": "Tu préfères recevoir les dividendes ou les laisser se réinvestir dans le fonds ?",
    "optionA": "Tu choisis la part distribuante.\nTu reçois les revenus et tu décides de les dépenser ou de les réinvestir.",
    "optionB": "Tu choisis la part capitalisante.\nLe fonds réinvestit les revenus et tu n’as pas à passer un nouvel ordre pour cela.",
    "tension": "Les dividendes ne sont pas un gain supplémentaire à ajouter gratuitement à la performance. Leur traitement fiscal dépend aussi de ton enveloppe.",
    "question": "A ou B ? Si tu recevais les dividendes, tu les réinvestirais vraiment ?"
  },
  {
    "id": "rembourser-pret-etudes-vs-investir",
    "label": "Rembourser un prêt étudiant vs investir",
    "contextes": null,
    "montants": [
      "500€",
      "2 000€",
      "5 000€"
    ],
    "accroche": "🎓 Tu as {montant} disponibles et un prêt étudiant à taux très bas. Ton épargne de précaution est déjà constituée.",
    "choix": "Tu réduis ta dette ou tu investis en gardant le prêt ?",
    "optionA": "Tu rembourses une partie du prêt.\nTu réduis ta dette et tu renonces à investir cette somme.",
    "optionB": "Tu investis cet argent.\nTu gardes les mensualités et tu acceptes que le placement puisse baisser.",
    "tension": "Le taux est bas. Mais avoir une dette et voir ton placement perdre de la valeur en même temps pourrait te peser.",
    "question": "A ou B ? Tu préfères réduire ta dette même si elle te coûte peu ?"
  },
  {
    "id": "versement-en-baisse",
    "label": "Continuer à investir pendant une baisse",
    "contextes": null,
    "montants": [
      "400€"
    ],
    "accroche": "📉 Ton ETF World vient de perdre 25 %. Tu avais prévu d’y investir {montant} ce mois-ci.",
    "choix": "Tu fais quoi ?",
    "optionA": "Tu gardes ton versement habituel.\nTu investissais pour longtemps. La baisse n’a pas changé ton projet.",
    "optionB": "Tu mets les {montant} de côté ce mois-ci.\nTu préfères garder de la marge, même si le marché peut repartir sans toi.",
    "tension": "Tu as toujours ton salaire et ton épargne de précaution. Mais voir ton portefeuille baisser commence à te travailler.",
    "question": "A ou B ? Et si tu choisis A, tu l’as déjà fait pendant une vraie baisse ?"
  },
  {
    "id": "profiter-vs-investir",
    "label": "Profiter aujourd’hui vs investir davantage",
    "contextes": null,
    "montants": [
      "200€"
    ],
    "accroche": "💸 Il te reste {montant} à la fin du mois. Tu as déjà ton épargne de précaution et ton versement habituel est fait.",
    "choix": "Tu en fais quoi ?",
    "optionA": "Tu ajoutes les {montant} à tes investissements.\nTu veux avancer plus vite vers tes objectifs.",
    "optionB": "Tu les dépenses pour quelque chose qui te fait plaisir.\nUn resto, une sortie, un week-end… Tu veux aussi profiter de ton argent aujourd’hui.",
    "tension": "Pas de découvert derrière. Pas de facture oubliée. Tu peux vraiment choisir.",
    "question": "A ou B ce mois-ci ? Tu arrives à dépenser pour toi sans culpabiliser ?"
  },
  {
    "id": "reequilibrer-vs-laisser",
    "label": "Rééquilibrer après une hausse",
    "contextes": null,
    "montants": [
      "20 000€",
      "50 000€"
    ],
    "accroche": "⚖️ Au départ, tu avais choisi 80 % d’ETF actions et 20 % d’ETF obligataires. Après une forte hausse des actions, la répartition est passée à 90 / 10.",
    "choix": "Tu fais quoi ?",
    "optionA": "Tu rééquilibres pour revenir à 80 / 20.\nTu retrouves la répartition que tu avais choisie.",
    "optionB": "Tu conserves la répartition à 90 / 10.\nTu laisses davantage de place aux actions et tu acceptes que leurs variations pèsent plus sur ton portefeuille.",
    "tension": "Ton portefeuille vaut maintenant {montant}. Les frais et la fiscalité d’une vente peuvent aussi peser dans ta décision.",
    "question": "A ou B ? Tu rééquilibres dès que ça s’écarte ou tu laisses une marge ?"
  }
];

function render(template, montant, contexte) {
  const valeur = Number(montant.replace(/[^0-9]/g, ""));
  const mensualite = (valeur / 10).toLocaleString("fr-FR") + " €";
  return template.replaceAll("{montant}", montant).replaceAll("{mensualite}", mensualite).replaceAll("{contexte}", contexte ?? "");
}

// Scénarios hypothétiques, pas des prévisions ni des recommandations.
// Toute la matrice est matérialisée au chargement ; les filtres et identifiants restent stables.
export const DILEMMES = SITUATIONS.flatMap(situation =>
  (situation.contextes ?? [null]).flatMap((contexte, ci) =>
    (situation.montants ?? MONTANTS).map((rawMontant, mi) => {
      const montant = rawMontant.replace(/\s*€$/, " €");
      return {
        id: `${situation.id}-${ci}-${mi}`,
        situationId: situation.id,
        contexteTexte: render(situation.accroche, montant, contexte),
        choix: render(situation.choix, montant, contexte),
        optionA: render(situation.optionA, montant, contexte),
        optionB: render(situation.optionB, montant, contexte),
        tension: render(situation.tension, montant, contexte),
        question: render(situation.question, montant, contexte),
      };
    })
  )
);
