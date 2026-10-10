// Revue du 10/10/2026 : récits fluides, sans question ni morale systématique.
// Phrases complètes et enchaînements naturels : pas de fragments coupés pour dramatiser.
// Une conclusion simple est possible si elle découle de cette histoire.
// Les statistiques restent celles de data.js. Pas de scènes, dialogues ou motivations inventés.
// Le lundi noir et Newton sont les deux références éditoriales validées par l'utilisateur.
export const EDITORIAL = {
  'corrections-27-bear-markets': {
    hook: 'Quand ton portefeuille perd 20 %, tu peux vite te demander si tu as fait une énorme erreur 🫠',
    context: 'Pourtant, ce genre de baisse revient régulièrement dans l’histoire des marchés. Hartford Funds a recensé 27 épisodes de ce type sur le S&P 500 depuis 1928.\n\nOn les appelle des « bear markets » : l’indice perd au moins 20 % entre un sommet et le creux qui suit.',
    twist: 'Quand tu lis le chiffre dans une étude, ça paraît assez abstrait. Quand ce sont tes économies qui baissent et que tu ne sais pas jusqu’où ça va descendre, c’est une autre histoire.',
  },
  'corrections-ampleur-moyenne': {
    hook: 'Une baisse de 33,5 %, c’est presque un tiers du placement qui disparaît de l’écran 🫠',
    context: 'C’est la baisse moyenne des bear markets du S&P 500 depuis 1929 dans la série de Dow Jones Market Data.\n\nMais certains épisodes ont été beaucoup plus violents. Entre 1929 et 1932, la chute atteint 86,2 % dans cette même série.',
    twist: 'Et c’est ce qui rend les moyennes difficiles à vivre : au moment où ça baisse, personne ne te garantit que ton épisode sera dans la moyenne.\n\nAvant 1957, cette histoire repose sur les indices prédécesseurs du S&P 500 actuel.',
  },
  'corrections-48-depuis-guerre': {
    hook: 'À moins 10 %, on commence déjà à se demander si le pire est devant nous.',
    context: 'Depuis la Seconde Guerre mondiale, Carson Group a recensé 48 corrections de cette ampleur sur le S&P 500. Douze ont fini par atteindre une baisse d’au moins 20 %.\n\nLes autres se sont donc arrêtées avant ce seuil, même si, sur le moment, les investisseurs ne pouvaient pas connaître la suite.',
    twist: 'C’est toute la difficulté quand les cours reculent : tu vis la baisse aujourd’hui, mais tu n’auras le recul pour la raconter que plus tard. Ces décomptes décrivent le passé, pas les chances de rebond de la prochaine correction.',
  },
  'records-1987-pire-seance': {
    hook: 'Une baisse de 5 % sur mon portefeuille, je trouve déjà ça désagréable.',
    context: 'Alors j’ai du mal à imaginer ce qu’ont vécu les investisseurs le 19 octobre 1987. Ce jour-là, le Dow Jones perd 22,6 % en une seule séance 😳\n\nPourtant, quelques semaines plus tôt, il affichait une hausse de 44 % depuis le début de l’année. Il y avait de quoi être content de ses placements.\n\nPuis les marchés commencent à baisser. Le lundi, les ordres de vente s’accumulent et les acheteurs ne suivent plus.\n\nCertaines stratégies de protection aggravent même la situation : elles vendent automatiquement quand les cours reculent, ce qui fait encore baisser les prix.',
    twist: 'Imagine regarder ça avec tes économies investies, sans savoir où la baisse va s’arrêter.\n\nC’est après ce krach que les Bourses développeront les « coupe-circuits », pour suspendre les échanges lorsque la chute devient trop violente.',
  },
  'records-1933-meilleure-seance-dow': {
    hook: 'En mars 1933, les Américains ne peuvent même plus aller retirer leur argent à la banque.',
    context: 'En pleine crise bancaire, Roosevelt a fait fermer temporairement les banques du pays. Elles commencent ensuite à rouvrir.\n\nLe 15 mars, le Dow Jones gagne 15,34 % en une séance, sa plus forte hausse historique.',
    twist: 'C’est assez étonnant de se dire que la meilleure journée de cet indice est arrivée dans une période où l’accès à son propre argent était devenu un sujet d’inquiétude.',
  },
  'records-1933-meilleures-seances-sp500': {
    hook: 'Les journées où la Bourse remonte le plus fort ne sont pas forcément celles où tout va bien.',
    context: 'Dans la série historique prolongée du S&P 500, on retrouve une hausse de 16,61 % le 15 mars 1933, de 12,53 % le 30 octobre 1929 et de 11,58 % le 13 octobre 2008.\n\nTrois séances au milieu de crises qui ont laissé de très mauvais souvenirs aux investisseurs.',
    twist: 'De quoi comprendre pourquoi un gros rebond peut être si déroutant quand les nouvelles restent mauvaises.\n\nLes chiffres de 1929 et 1933 concernent les indices prédécesseurs : le S&P 500 à 500 valeurs n’existait pas encore.',
  },
  'records-2001-nasdaq': {
    hook: 'Le 3 janvier 2001, les investisseurs du Nasdaq voient leur indice remonter de 14,2 % en une journée 😳',
    context: 'La bulle internet a pourtant déjà éclaté et les valeurs technologiques traversent une période difficile. Mais ce jour-là, la Fed annonce une baisse surprise de ses taux et le marché rebondit brutalement.',
    twist: 'Avec le recul, on sait que la baisse du Nasdaq se poursuivra jusqu’en 2002. Sur le moment, après une séance pareille, il devait être bien difficile de savoir si on venait enfin de sortir du mauvais passage.',
  },
  'duree-bull-bear-moyenne': {
    hook: 'Quelques mois de baisse peuvent sembler beaucoup plus longs que plusieurs années de hausse 🫠',
    context: 'Dans l’étude de Ned Davis Research sur le S&P 500, les phases haussières durent en moyenne 988 jours, contre 289 jours pour les bear markets, ces baisses d’au moins 20 % depuis un sommet.\n\nLes hausses prennent donc davantage de temps dans ce décompte.',
    twist: 'Mais quand ton placement baisse depuis des mois, la moyenne historique ne te dit pas combien de temps il te reste à attendre. C’est souvent cette absence de réponse qui est difficile à supporter.',
  },
  'duree-frequence-bear-markets': {
    hook: 'On peut avoir le temps de s’habituer à la hausse avant que la prochaine grosse baisse arrive.',
    context: 'Dans le décompte de Ned Davis Research, le S&P 500 connaît un bear market tous les 3,5 ans en moyenne. Il s’agit d’une baisse d’au moins 20 % depuis un sommet.\n\nMais les épisodes ne sont pas espacés régulièrement : cette moyenne rassemble des histoires très différentes.',
    twist: 'Ce serait pratique d’avoir une date sur le calendrier. Dans la réalité, tu peux passer plusieurs années à attendre une chute qui ne vient pas, puis être surpris quand elle arrive.',
  },
  'crash-1929': {
    hook: 'Après le krach de 1929, il a fallu attendre 1954 pour revoir le Dow Jones à son ancien sommet.',
    context: 'Au départ, l’indice perd 25 % en quatre séances, entre le 24 et le 29 octobre. Mais la baisse ne s’arrête pas là : elle se poursuit jusqu’à l’été 1932 et atteint près de 89 % depuis le pic.\n\nLe retour au sommet n’arrive qu’en novembre 1954, vingt-cinq ans après.',
    twist: 'Vingt-cinq ans, c’est assez long pour que beaucoup de projets aient changé entre-temps.\n\nAttention toutefois à ce que raconte ce chiffre : il concerne le niveau nominal de l’indice, sans les dividendes reçus ni l’inflation. Ce n’est pas le bilan complet d’un investisseur.',
  },
  'crash-1987': {
    hook: 'Le 19 octobre 1987, environ 604 millions de titres changent de mains, soit trois fois le volume quotidien habituel.',
    context: 'C’est le lundi noir. Le Dow Jones perd 22,6 % et les ordres de vente s’accumulent.\n\nDerrière ce volume énorme, il y a des investisseurs qui veulent sortir et d’autres qui acceptent encore d’acheter pendant la chute.',
    twist: 'Le retour au niveau d’avant-krach prendra ensuite environ 21 mois dans le repère de marché cité. Sur un graphique regardé des années plus tard, ça tient dans un petit morceau de courbe. À vivre avec son argent investi, c’est beaucoup moins anodin.',
  },
  'crash-2000-2002': {
    hook: 'Internet allait changer le monde. Ça n’a pas empêché le Nasdaq de perdre 78 % après son sommet de mars 2000.',
    context: 'La bulle éclate et la baisse se poursuit jusqu’en octobre 2002. Le S&P 500 recule lui aussi d’environ 49 à 50 % sur la période.\n\nPour le Nasdaq, le retour à son ancien sommet n’arrive que le 23 avril 2015, quinze ans plus tard.',
    twist: 'Internet a effectivement pris une place immense dans nos vies pendant ces quinze années. Mais avoir raison sur l’avenir d’une technologie ne suffisait pas à éviter de payer ses actions beaucoup trop cher.\n\nCe délai concerne le niveau nominal de l’indice, sans dividendes ni correction de l’inflation.',
  },
  'crash-2008': {
    hook: 'En 2008, la baisse ne se résume pas à quelques journées de panique.',
    context: 'Entre le sommet du 9 octobre 2007 et le creux du 9 mars 2009, le S&P 500 perd environ 57 %. La chute s’étale sur dix-sept mois.\n\nDix-sept mois pendant lesquels un investisseur peut voir son placement remonter par moments, puis repartir à la baisse.',
    twist: 'L’indice ne retrouve son niveau de clôture d’avant-crise qu’en avril 2013. Avec le recul, les dates sont bien rangées sur le graphique. À l’époque, personne n’avait le creux de mars 2009 entouré à l’avance.\n\nCe retour au sommet concerne l’indice de prix, sans dividendes réinvestis ni inflation.',
  },
  'crash-2020': {
    hook: 'Le 19 février 2020, le S&P 500 est à un sommet. Un peu plus d’un mois après, il a perdu environ un tiers de sa valeur.',
    context: 'Avec le choc du Covid, l’indice recule de 33,9 % en 33 jours calendaires, jusqu’au 23 mars.\n\nLes investisseurs voient leurs placements chuter alors que la crise sanitaire bouleverse aussi leur quotidien.',
    twist: 'Puis le marché repart et retrouve son niveau d’avant-krach dès août.\n\nQuand on connaît la suite, la baisse paraît presque brève. Mais en mars, il fallait prendre des décisions sans savoir ce qui allait se passer dans les mois suivants.',
  },
  'series-9-annees-positives': {
    hook: 'De 1991 à 1999, le S&P 500 termine chaque année dans le vert, dividendes réinvestis.',
    context: 'Neuf années positives à la suite, c’est long quand tu attends une mauvaise année pour te décider à investir.\n\nIl y a bien eu des baisses en cours d’année, mais aucune de ces neuf années civiles ne s’est terminée sur une perte. Une autre série de neuf années positives se produira entre 2009 et 2017.',
    twist: 'Ça explique pourquoi « j’attends que ça baisse » peut devenir une attente interminable. Encore faut-il savoir quelle baisse on attend et ce qu’on ferait si elle arrivait.',
  },
  'series-annees-20-pourcent': {
    hook: 'Entre 1995 et 1999, le S&P 500 gagne au moins 20 % chaque année, dividendes réinvestis 😳',
    context: 'Cinq années de suite à ce rythme, c’est un enchaînement exceptionnel dans la série étudiée depuis 1929 par Carson Group.\n\nQuand tes placements montent autant pendant aussi longtemps, j’imagine qu’il devient tentant de trouver ça normal.',
    twist: 'La suite sera beaucoup moins agréable : la bulle internet éclate en 2000. Ceux qui venaient de découvrir la Bourse avec ces années de hausse allaient en découvrir une autre facette.',
  },
  'annees-extremes': {
    hook: 'Dans les années 1930, les investisseurs ont connu des variations assez difficiles à imaginer aujourd’hui.',
    context: 'La série historique prolongée du S&P 500 affiche une perte de 43,8 % en 1931 et une hausse de 54 % en 1933.\n\nEntre les deux, il y a aussi l’année 1932 : ce ne sont pas deux performances qui se suivent immédiatement.',
    twist: 'Quand on raconte cette période seulement avec un record de baisse ou de hausse, on oublie facilement tout ce qu’il a fallu traverser entre les deux.\n\nCes chiffres concernent les indices prédécesseurs du S&P 500, créé dans sa forme actuelle en 1957.',
  },
  'annees-part-positives': {
    hook: 'En regardant l’histoire des actions américaines, on trouve bien plus d’années positives que négatives.',
    context: 'Dans l’étude de Dimensional portant sur environ 154 ans, près de 73 à 74 % des années civiles ont terminé dans le vert. Le périmètre est celui du marché américain, pas uniquement du S&P 500.',
    twist: 'Sur le papier, c’est rassurant. Mais ça laisse aussi pas mal d’années où il a fallu regarder son argent baisser et continuer sans connaître la suite.\n\nUne majorité d’années positives dans le passé ne promet pas que la prochaine en fera partie.',
  },
  'fenetres-20-ans': {
    hook: 'Vingt ans en Bourse, ça paraît simple quand on les regarde d’un seul coup sur un graphique.',
    context: 'Dans la série de J.P. Morgan sur les actions américaines depuis 1950, aucune période glissante de vingt ans n’affiche un rendement annualisé négatif. L’étude compare des périodes qui commencent à des dates différentes.',
    twist: 'Mais personne ne vit vingt ans d’un seul coup. Entre le départ et l’arrivée, il y a les baisses et les moments où on se demande si on doit vendre.\n\nCe résultat concerne le marché et la méthode de l’édition étudiée. Il ne garantit pas les vingt prochaines années ni le même résultat ailleurs.',
  },
  'cac40-record-21-ans': {
    hook: 'Le CAC 40 a attendu vingt et un ans pour dépasser son record de septembre 2000.',
    context: 'L’indice avait atteint 6 944,77 points le 4 septembre 2000. Il ne dépasse ce sommet qu’en novembre 2021.\n\nVu comme ça, on pourrait croire qu’un investisseur a passé vingt et un ans sans rien gagner.',
    twist: 'Sauf que le CAC 40 qu’on voit le plus souvent ne compte pas les dividendes. Pendant toutes ces années, les entreprises ont aussi versé de l’argent à leurs actionnaires.\n\nLe record de l’indice raconte donc une partie de l’histoire, mais pas tout ce qu’un placement aurait rapporté.',
  },
  'cac40-pire-seance-2020': {
    hook: 'Le 12 mars 2020, le CAC 40 perd 12,28 % en une seule journée.',
    context: 'C’est sa pire séance dans les données citées, au moment où le choc du Covid frappe les marchés.\n\nMême en sachant qu’investir comporte des risques, voir une baisse pareille sur une journée a de quoi secouer.',
    twist: 'D’autant que les économies ne sont pas la seule préoccupation à ce moment-là : la crise sanitaire bouleverse la vie quotidienne. Les investisseurs doivent gérer leurs placements au milieu de tout le reste.',
  },
};

// Transactions reconstituées à partir d'archives par Andrew Odlyzko, Physics Today,
// 01/07/2020, vérifiées le 10/10/2026. Aucun montant de perte ni motif précis attribué à Newton.
export const NEWTON_STORY = {
  id: 'newton-south-sea-1720', family: 'histoires', category: 'Newton et la bulle de 1720',
  indices: ['South Sea Company'],
  hook: 'Newton aussi s’est planté en Bourse, et assez sévèrement 🫠',
  context: 'En 1720, il investit dans la South Sea Company. En avril, il vend ses actions, mais quelques semaines plus tard, il en rachète alors que le cours a poursuivi sa hausse.\n\nC’est ce passage que je trouve intéressant. Vendre un placement et le voir continuer à grimper, c’est quand même agaçant. Tu peux avoir encaissé un beau gain et finir par regretter d’être sorti.\n\nOn ne sait pas précisément pourquoi Newton a racheté. Ce qu’on sait, c’est qu’il y remet beaucoup d’argent et continue à acheter lorsque le cours commence à baisser.',
  twist: 'Quand la bulle éclate en septembre, il perd énormément d’argent.\n\nComme quoi, même les plus grands génies font des erreurs en Bourse 🫠',
  fact: 'Newton donne des instructions de vente en avril 1720, puis rachète des titres à partir de juin et continue à investir avant l’effondrement de septembre. La frustration évoquée dans le récit est une comparaison avec une situation familière, pas un motif documenté de ses achats.',
  source: 'Andrew Odlyzko, « Isaac Newton and the perils of the financial South Sea », Physics Today, 1er juillet 2020 · https://physicstoday.aip.org/features/isaac-newton-and-the-perils-of-the-financial-south-sea',
  note: null,
};
