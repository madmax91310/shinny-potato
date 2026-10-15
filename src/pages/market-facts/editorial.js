// Récits factuels : expliquer chaque épisode sans inventer de réaction personnelle.
// Phrases complètes et enchaînements naturels : pas de fragments coupés pour dramatiser.
// Une conclusion simple est possible si elle découle de cette histoire.
// Les statistiques restent celles de data.js. Pas de scènes, dialogues ou motivations inventés.
// Le lundi noir et Newton sont les deux références éditoriales validées par l'utilisateur.
export const EDITORIAL = {
  'corrections-27-bear-markets': {
    hook: 'Une baisse de 20 % peut mettre à l’épreuve les choix faits quand les marchés montaient 🫠',
    context: 'Pourtant, ce genre de baisse revient régulièrement dans l’histoire des marchés. Hartford Funds a recensé 27 épisodes de ce type sur le S&P 500 depuis 1928.\n\nOn les appelle des « bear markets » : l’indice perd au moins 20 % entre un sommet et le creux qui suit.',
    twist: 'Savoir que ces baisses font partie de l’histoire de la Bourse ne les rend pas faciles à traverser. Avec ses économies investies, une perte de 20 % a des conséquences concrètes.\n\nLes épisodes précédents ne permettent pas de connaître la durée ni la profondeur du suivant.',
  },
  'corrections-48-depuis-guerre': {
    hook: 'À moins 10 %, impossible de savoir si la correction va s’arrêter ou devenir une baisse beaucoup plus forte.',
    context: 'Depuis la Seconde Guerre mondiale, Carson Group a recensé 48 corrections de cette ampleur sur le S&P 500. Douze ont fini par atteindre une baisse d’au moins 20 %.\n\nLes autres se sont donc arrêtées avant ce seuil, même si, sur le moment, les investisseurs ne pouvaient pas connaître la suite.',
    twist: 'Avec le recul, on peut ranger chaque épisode dans une catégorie. Sur le moment, rien n’est encore joué : tu regardes ton placement baisser et tu dois décider quoi faire sans connaître la suite.\n\nCes décomptes décrivent le passé, pas les chances de rebond de la prochaine correction.',
  },
  'records-1987-pire-seance': {
    hook: 'Perdre plus de 20 % en une seule journée : c’est ce qui est arrivé au Dow Jones en octobre 1987 🫠',
    context: 'C’est ce qu’ont vécu les investisseurs exposés au Dow Jones le 19 octobre 1987 : l’indice termine la séance à −22,6 %.\n\nPourtant, fin août, il affichait encore une hausse de 44 % depuis le début de l’année. De quoi se sentir plutôt à l’aise avec ses placements.\n\nMais en octobre, les marchés commencent à reculer. Le lundi, les ordres de vente s’accumulent et les acheteurs ne suivent plus.\n\nCertaines stratégies censées protéger les portefeuilles aggravent même la chute : elles vendent à mesure que les cours baissent, ce qui entraîne de nouvelles ventes.',
    twist: 'Quelques semaines auparavant, les marchés montaient encore. Puis les investisseurs voient leurs économies chuter, sans savoir où la baisse s’arrêtera.',
  },
  'records-1933-meilleure-seance-dow': {
    hook: 'En mars 1933, les Américains ne peuvent même plus aller retirer leur argent à la banque.',
    context: 'En pleine crise bancaire, Roosevelt a fait fermer temporairement les banques du pays. Elles commencent ensuite à rouvrir.\n\nLe 15 mars, le Dow Jones gagne 15,34 % en une séance, sa plus forte hausse historique.',
    twist: 'La meilleure journée du Dow Jones arrive donc pendant une crise bancaire, juste après une interruption de l’accès aux banques.\n\nLa hausse d’une séance ne résume pas la situation économique dans laquelle elle se produit.',
  },
  'records-2001-nasdaq': {
    hook: 'Le 3 janvier 2001, les investisseurs du Nasdaq voient leur indice remonter de 14,2 % en une journée 😳',
    context: 'La bulle internet a pourtant déjà éclaté et les valeurs technologiques traversent une période difficile. Mais ce jour-là, la Fed annonce une baisse surprise de ses taux et le marché rebondit brutalement.',
    twist: 'Ce rebond de 14,2 % ne marque pas la fin de la baisse : celle du Nasdaq se poursuivra jusqu’en 2002.\n\nUne forte hausse sur une journée peut donc se produire au milieu d’un marché encore durablement orienté à la baisse.',
  },
  'crash-1929': {
    hook: 'Après le krach de 1929, il a fallu attendre 1954 pour revoir le Dow Jones à son ancien sommet.',
    context: 'Au départ, l’indice perd 25 % en quatre séances, entre le 24 et le 29 octobre. Mais la baisse ne s’arrête pas là : elle se poursuit jusqu’à l’été 1932 et atteint près de 89 % depuis le pic.\n\nLe retour au sommet n’arrive qu’en novembre 1954, vingt-cinq ans après.',
    twist: 'Vingt-cinq ans dépassent l’horizon de nombreux projets financés avec cette épargne. On peut accepter d’investir longtemps sans pour autant pouvoir repousser tous ses projets aussi longtemps.\n\nCe chiffre concerne toutefois le niveau nominal de l’indice, sans les dividendes reçus ni l’inflation. Ce n’est pas le bilan complet d’un investisseur.',
  },
  'crash-2000-2002': {
    hook: 'Internet allait changer le monde. Ça n’a pas empêché le Nasdaq de perdre 78 % après son sommet de mars 2000.',
    context: 'La bulle éclate et la baisse se poursuit jusqu’en octobre 2002. Le S&P 500 recule lui aussi d’environ 49 à 50 % sur la période.\n\nPour le Nasdaq, le retour à son ancien sommet n’arrive que le 23 avril 2015, quinze ans plus tard.',
    twist: 'Internet a bien changé nos vies. Les investisseurs pouvaient donc avoir raison sur la technologie et perdre énormément d’argent sur les actions.\n\nLe prix payé compte autant que les perspectives d’une entreprise.\n\nCe délai concerne le niveau nominal de l’indice, sans dividendes ni correction de l’inflation.',
  },
  'crash-2008': {
    hook: 'En 2008, la baisse ne se résume pas à quelques journées de panique.',
    context: 'Entre le sommet du 9 octobre 2007 et le creux du 9 mars 2009, le S&P 500 perd environ 57 %. La chute s’étale sur dix-sept mois.\n\nDix-sept mois pendant lesquels un investisseur peut voir son placement remonter par moments, puis repartir à la baisse.',
    twist: 'L’indice ne retrouve son niveau de clôture d’avant-crise qu’en avril 2013.\n\nPendant ces dix-sept mois de chute, les rebonds intermédiaires n’annonçaient pas tous la fin de la crise. Le point bas n’est identifiable qu’avec le recul.\n\nCe retour au sommet concerne l’indice de prix, sans dividendes réinvestis ni inflation.',
  },
  'crash-2020': {
    hook: 'Le 19 février 2020, le S&P 500 est à un sommet. Un peu plus d’un mois après, il a perdu environ un tiers de sa valeur.',
    context: 'Avec le choc du Covid, l’indice recule de 33,9 % en 33 jours calendaires, jusqu’au 23 mars.\n\nLes investisseurs voient leurs placements chuter alors que la crise sanitaire bouleverse aussi leur quotidien.',
    twist: 'Puis le marché repart et retrouve son niveau d’avant-krach dès août.\n\nLe retour au sommet paraît rapide avec le recul. En mars, les investisseurs faisaient pourtant face à la baisse et à l’incertitude sanitaire sans connaître la date du rebond.',
  },
  'series-9-annees-positives': {
    hook: 'De 1991 à 1999, le S&P 500 termine chaque année dans le vert, dividendes réinvestis.',
    context: 'Neuf années positives à la suite, c’est long quand tu attends une mauvaise année pour te décider à investir.\n\nIl y a bien eu des baisses en cours d’année, mais aucune de ces neuf années civiles ne s’est terminée sur une perte. Une autre série de neuf années positives se produira entre 2009 et 2017.',
    twist: 'Attendre une baisse suffisante demande de définir à quel niveau acheter. Une longue série de hausses peut repousser cette décision pendant des années.\n\nParce qu’attendre est une chose ; se décider à acheter quand tout devient inquiétant en est une autre.',
  },
  'series-annees-20-pourcent': {
    hook: 'Entre 1995 et 1999, le S&P 500 gagne au moins 20 % chaque année, dividendes réinvestis 😳',
    context: 'Cinq années de suite à ce rythme, c’est un enchaînement exceptionnel dans la série étudiée depuis 1929 par Carson Group.\n\nUne telle série peut faire paraître ordinaires des rendements pourtant exceptionnels.',
    twist: 'La suite sera beaucoup moins agréable : la bulle internet éclate en 2000.\n\nCommencer à investir au milieu de cette série donne une expérience très différente de celle des années suivantes. Ces gains répétés ne constituent pas une base fiable pour prévoir les rendements futurs.',
  },
  'cac40-record-21-ans': {
    hook: 'Le CAC 40 a attendu vingt et un ans pour dépasser son record de septembre 2000.',
    context: 'L’indice avait atteint 6 944,77 points le 4 septembre 2000. Il ne dépasse ce sommet qu’en novembre 2021.\n\nVu comme ça, on pourrait croire qu’un investisseur a passé vingt et un ans sans rien gagner.',
    twist: 'Le CAC 40 qu’on voit le plus souvent ne compte pas les dividendes. Pendant ces années, les entreprises ont aussi versé de l’argent à leurs actionnaires.\n\nAvant d’en conclure que la Bourse française n’a rien rapporté pendant vingt et un ans, il faut donc vérifier ce qui est inclus dans le graphique.',
  },
  'cac40-pire-seance-2020': {
    hook: 'Le 12 mars 2020, le CAC 40 perd 12,28 % en une seule journée.',
    context: 'C’est sa pire séance dans les données citées, au moment où le choc du Covid frappe les marchés.\n\nMême en sachant qu’investir comporte des risques, voir une baisse pareille sur une journée a de quoi secouer.',
    twist: 'Les investisseurs doivent gérer cette chute alors que la crise sanitaire bouleverse aussi leur quotidien.\n\nLa décision de garder ou de vendre se prend avec ces incertitudes, sans connaître la suite des cours. Le graphique rétrospectif ne restitue pas toutes ces contraintes.',
  },
};

// Transactions reconstituées à partir d'archives par Andrew Odlyzko, Physics Today,
// 01/07/2020, vérifiées le 10/10/2026. Aucun montant de perte ni motif précis attribué à Newton.
export const NEWTON_STORY = {
  id: 'newton-south-sea-1720', family: 'histoires', category: 'Newton et la bulle de 1720',
  indices: ['South Sea Company'],
  hook: 'Newton aussi s’est planté en Bourse, et assez sévèrement 🫠',
  context: 'En 1720, il investit dans la South Sea Company. Il vend ses actions en avril, puis en rachète quelques semaines plus tard, alors que le cours a continué à monter.\n\nIl vend donc avant de revenir à l’achat à des cours plus élevés.\n\nOn ne sait pas précisément pourquoi Newton a racheté. Ce qu’on sait, c’est qu’il remet beaucoup d’argent et continue à acheter lorsque le cours commence à baisser.',
  twist: 'Quand la bulle éclate en septembre, il perd énormément d’argent.\n\nComme quoi, même les plus grands génies font des erreurs en Bourse 🫠',
  fact: 'Newton donne des instructions de vente en avril 1720, puis rachète des titres à partir de juin et continue à investir avant l’effondrement de septembre. Le motif précis de ses achats n’est pas documenté ici.',
  source: 'Andrew Odlyzko, « Isaac Newton and the perils of the financial South Sea », Physics Today, 1er juillet 2020 · https://physicstoday.aip.org/features/isaac-newton-and-the-perils-of-the-financial-south-sea',
  note: null,
};
