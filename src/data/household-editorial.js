// La voix éditoriale reste distincte des observations Insee automatisées.
// Les montants, taux et périodes sont remplacés à la génération du texte.
export const HOUSEHOLD_EDITORIAL = {
  'wealth-share': [
    "🇫🇷 On parle souvent du patrimoine des Français. Mais qui en possède la plus grande part ? 👀",
    '🇫🇷 {period}, les 50 ménages les moins dotés se partagent {value} % du patrimoine brut. Les 50 autres en possèdent {complement} %.\n\nLa moitié des ménages se partage donc une faible part du total. Quand on compare sa situation à celle des autres, une moyenne peut facilement masquer cette répartition.\n\n🏠 On compte ici l’immobilier, les placements, les biens professionnels et les autres biens, avant déduction des dettes. Ce patrimoine n’est donc pas une somme disponible sur un compte.',
    '💬 Tu imaginais une répartition aussi déséquilibrée ?',
  ],
  'wealth-top10': [
    "🇫🇷 À partir de quel patrimoine fait-on partie des 10 % les plus aisés ? 👀",
    '🇫🇷 {period}, il faut dépasser {value} € de patrimoine net pour faire partie des 10 % de ménages les mieux dotés. Sur 100 ménages, 10 sont au-dessus de ce seuil.\n\nCe montant peut paraître énorme si on l’imagine entièrement sur un compte bancaire. Mais l’Insee compte aussi l’immobilier, les placements et les autres biens, puis déduit les dettes.\n\nUn patrimoine important ne dit pas à lui seul combien on peut dépenser demain. Et ce classement porte sur les ménages, pas sur chaque personne prise séparément.',
    '💬 Tu aurais imaginé ce seuil plus haut ou plus bas ?',
  ],
  'wealth-median': [
    "🇫🇷 On parle souvent de patrimoine moyen. Mais à quel montant se situe la moitié des Français ? 👀",
    '🇫🇷 {period}, le patrimoine net médian des ménages est de {value} €. Imagine 100 ménages : la moitié possède moins, l’autre davantage.\n\n🏠 L’immobilier, les placements et les autres biens sont inclus, après déduction des emprunts. Une maison ne compte donc pas pour sa valeur entière si une partie reste à rembourser.\n\nCe repère décrit la répartition des patrimoines. Mais il ne dit pas combien ces ménages ont de côté pour faire face à un imprévu : une partie peut être immobilisée dans leur logement.',
    '💬 Quand tu fais ton bilan, comptes-tu aussi le logement et ce qu’il reste à rembourser ?',
  ],
  pea: [
    "🇫🇷 On parle souvent du PEA pour investir en Bourse. Mais combien de Français en ont un ? 👀",
    '🇫🇷 Imagine la France réduite à 100 ménages : environ {rounded} détiennent un PEA.\n\n{period}, l’Insee mesurait précisément ce taux à {value} %, quel que soit le montant placé sur le plan.\n\nLe PEA revient souvent dans les discussions sur l’investissement, mais il n’est pas détenu par tous les ménages. Son fonctionnement peut rester peu familier à ceux qui découvrent la Bourse.\n\n📌 Les autres ménages peuvent aussi détenir des actions via un compte-titres, une assurance-vie ou de l’épargne salariale. Ce chiffre concerne uniquement le PEA.',
    '💬 Dans ton entourage, tu en parles facilement ou ça reste un sujet assez rare ?',
  ],
  'livret-assurance': [
    "🇫🇷 Livret A ou assurance-vie : lequel est le plus répandu en France ? 👀",
    '🇫🇷 {period}, sur 100 ménages, environ {rounded} ont un Livret A ou Bleu et {secondRounded} une assurance-vie. Les taux exacts sont de {value} % et {secondValue} %.\n\nUn même ménage peut avoir les deux : ces groupes se recoupent, on ne peut pas les additionner. Et un placement presque vide compte autant qu’un placement bien rempli.\n\nLe rôle donné à chaque placement compte aussi. Une réserve disponible pour les imprévus et une épargne destinée à un projet plus lointain ne répondent pas forcément au même besoin. Les taux de détention ne racontent pas cette partie de l’histoire.',
    '💬 Chez toi, ces deux placements servent-ils à des projets différents ?',
  ],
  homeowners: [
    "🇫🇷 Acheter son logement reste un objectif pour beaucoup. Mais combien sont déjà propriétaires ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 sont propriétaires de leur résidence principale en France, soit {value} %, usufruitiers inclus.\n\nCe chiffre rassemble toutes les générations. Il ne décrit donc pas à lui seul les possibilités d’achat des jeunes ménages.\n\nLe calendrier des autres ne dit pas quel est le bon moment pour soi. Le budget, les projets et la marge qu’on veut garder comptent aussi.',
    '💬 Acheter ta résidence principale reste-t-il un objectif pour toi ?',
  ],
  debt: [
    "🇫🇷 On parle souvent de ce que les Français possèdent. Mais combien ont encore un crédit à rembourser ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 ont un emprunt en cours en France, soit {value} %.\n\n🏠 Derrière ce chiffre, on retrouve des crédits immobiliers, à la consommation ou liés à une activité professionnelle. Avoir un emprunt ne signifie pas être surendetté.\n\nComparer seulement les biens possédés laisse une partie de l’histoire de côté. Deux ménages peuvent avoir un logement de même valeur et des situations très différentes si l’un a fini de le payer et l’autre vient de commencer son crédit.',
    '💬 Quand tu compares deux patrimoines, regardes-tu ce qu’il reste après les dettes ?',
  ],
  inheritance: [
    "🇫🇷 L’héritage revient souvent dans les discussions sur le patrimoine. Mais combien en ont déjà reçu un ? 👀",
    '🇫🇷 {period}, {rounded} ménages sur 100 ont déjà reçu un héritage : au moins un de leurs membres a hérité de biens ou d’argent au cours de sa vie.\n\nCe chiffre ne dit ni combien, ni à quel âge. Un petit héritage et une transmission importante sont comptés de la même façon.\n\nDans les comparaisons de parcours, on voit le patrimoine d’aujourd’hui, mais rarement toutes les étapes qui ont permis de le construire. Un héritage peut en faire partie, sans que ce taux permette de mesurer son effet sur le patrimoine.',
    '💬 Quand on raconte un parcours patrimonial, quelle place donner aux héritages reçus ?',
  ],
  donation: [
    "🇫🇷 Un coup de pouce familial peut aider à démarrer. Mais combien ont déjà reçu une donation ? 👀",
    '🇫🇷 {period}, {rounded} ménages sur 100 ont déjà reçu une donation déclarée. Au moins un de leurs membres en a reçu une au cours de sa vie, déclarée à un notaire, un avocat ou à l’administration fiscale.\n\nLes aides familiales informelles ne sont pas toutes recensées : ce chiffre ne mesure donc pas l’ensemble des coups de pouce reçus.\n\nUn montant de patrimoine ne suffit pas à raconter un parcours. Pour comprendre comment quelqu’un l’a construit, les aides reçues méritent aussi une place dans la discussion.',
    '💬 Parle-t-on assez des aides familiales quand on compare les parcours financiers ?',
  ],
  'unexpected-expense': [
    "🇫🇷 Une facture imprévue de 1 000 € tombe. Combien de Français peuvent y faire face ? 👀",
    'Une voiture à réparer ou un équipement à remplacer, et il faut trouver 1 000 € qu’on n’avait pas prévu de dépenser.\n\n🇫🇷 {period}, environ {rounded} personnes sur 100 en France métropolitaine déclaraient ne pas pouvoir faire face à une dépense imprévue de ce montant pour des raisons financières.\n\nLe taux exact est de {value} %, selon les {dataStatus} de l’Insee. Ici, on parle bien de personnes, pas de ménages.\n\nUne réserve disponible permet de payer un imprévu sans déséquilibrer tout le budget du mois. C’est le rôle de l’épargne de précaution, distinct de celui des placements destinés à des projets plus lointains.',
    '💬 Quelle somme de côté te permettrait de te sentir plus tranquille ?',
  ],
  holidays: [
    "🇫🇷 Partir une semaine en vacances paraît ordinaire. Mais combien peuvent se le permettre ? 👀",
    '🇫🇷 {period}, environ {rounded} personnes sur 100 en France métropolitaine déclarent ne pas pouvoir se payer une semaine de vacances par an pour des raisons financières, soit {value} %.\n\nOn mesure ici la possibilité de financer un départ, pas le fait d’être effectivement parti. Il s’agit de personnes, pas de ménages. {provisionalNote}\n\nUne dépense ordinaire pour certains reste hors de portée pour d’autres. Ce taux décrit une contrainte de budget, au-delà des seules comparaisons de revenus ou de rendement.',
    '💬 Une semaine de vacances fait-elle partie de ton idée du confort financier ?',
  ],
  'salary-top10': [
    "🇫🇷 À partir de quel salaire fait-on partie des 10 % les mieux payés dans le privé ? 👀",
    '🇫🇷 En {period}, le seuil des 10 % de salariés les mieux payés du privé est de {value} € nets par mois. Sur 100 salariés, 10 sont au-dessus de ce montant.\n\nIl s’agit du net après cotisations sociales, avant impôt sur le revenu, en équivalent temps plein : les temps partiels sont ramenés à une base de temps plein. On ne compare pas le revenu total des foyers.\n\nCe repère situe un salaire dans une distribution, mais ne dit pas quelle marge reste à la fin du mois selon les charges et la situation familiale.',
    '💬 Tu aurais situé ce seuil plus haut ou plus bas ?',
  ],
  'salary-median': [
    "🇫🇷 Les gros salaires attirent l’attention. Mais combien gagne la moitié des salariés du privé ? 👀",
    '🇫🇷 En {period}, le salaire net médian dans le privé est de {value} € par mois. Sur 100 salariés, la moitié se situe en dessous, l’autre au-dessus.\n\nOn parle du net après cotisations sociales, avant impôt sur le revenu, en équivalent temps plein : un temps partiel est ramené à une base de temps plein.\n\nQuelques très hauts salaires peuvent relever la moyenne sans modifier autant la médiane.\n\nÇa ne raconte pas toutes les difficultés du quotidien, mais ça évite déjà de prendre les revenus les plus visibles pour une situation ordinaire.',
    '💬 Ce montant ressemble-t-il aux salaires que tu vois autour de toi ?',
  ],
  'young-wealth': [
    "🇫🇷 On voit passer de gros patrimoines sur les réseaux. Mais où en est-on avant 30 ans ? 👀",
    '🇫🇷 {period}, le patrimoine brut médian des ménages dont le principal apporteur de revenus a moins de 30 ans est de {value} €. Sur 100 de ces ménages, la moitié possède moins, l’autre davantage.\n\n🏠 Les biens et les placements sont comptés avant déduction des dettes. L’âge retenu est celui du principal apporteur de revenus, pas celui de chaque membre du ménage.\n\nLe groupe auquel on se compare change donc la lecture du chiffre. Avoir eu plus ou moins de temps pour épargner change la lecture d’un montant, même si l’âge ne suffit pas à expliquer tous les écarts.',
    '💬 Pour te situer, regardes-tu un repère adapté à ton âge ?',
  ],
  'thirties-wealth': [
    "🇫🇷 À la trentaine, quel patrimoine faut-il pour faire partie des 10 % les plus aisés de son âge ? 👀",
    '🇫🇷 {period}, le seuil des 10 % de ménages les mieux dotés dans la tranche 30–39 ans est de {value} € de patrimoine brut. Sur 100 ménages de ce groupe, 10 dépassent ce seuil.\n\nL’immobilier, les placements et les autres biens sont inclus, sans déduire les emprunts. La tranche d’âge est celle du principal apporteur de revenus : ce n’est pas le patrimoine individuel de chaque trentenaire.\n\nCe montant ne peut pas se lire comme une somme déjà entièrement acquise et disponible. Sans connaître les dettes, la comparaison reste incomplète.',
    '💬 Une comparaison de patrimoines te parle-t-elle sans connaître les dettes ?',
  ],
  'young-homeowners': [
    "🇫🇷 Acheter avant 30 ans : est-ce vraiment aussi courant qu’on pourrait le croire ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 sont propriétaires de leur résidence principale quand leur principal apporteur de revenus a moins de 30 ans, soit {value} %, usufruitiers inclus.\n\nL’âge retenu n’est pas celui de tous les membres du foyer.\n\nCe repère situe l’achat d’un logement dans l’ensemble d’une classe d’âge. Le parcours d’une personne ne dit pas ce qui est habituel pour tout un groupe, ni ce qui serait adapté à son propre budget.',
    '💬 Ce repère change-t-il ton regard sur l’idée d’avoir déjà acheté avant 30 ans ?',
  ],
  'securities-workers': [
    "🇫🇷 La Bourse est-elle aussi répandue chez les ouvriers que chez les cadres ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages de cadres sur 100 détiennent des valeurs mobilières, contre {secondRounded} ménages d’ouvriers sur 100. Les taux exacts sont de {value} % et {secondValue} %.\n\nOn compare deux populations distinctes, selon la profession du principal apporteur de revenus du ménage. Ces taux mesurent la détention, pas les montants investis ni toute l’exposition aux actions.\n\nCes chiffres ne disent pas, à eux seuls, quelle place prennent les revenus, les habitudes ou l’information dans cet écart.',
    '💬 Tu imaginais un tel écart de détention entre ces deux groupes ?',
  ],
  lep: [
    "🇫🇷 On parle souvent du LEP pour l’épargne de précaution. Mais combien de Français en ont un ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 détiennent un LEP en France, soit {value} %.\n\nMais le taux porte sur tous les ménages, y compris ceux qui ne sont pas éligibles. On ne peut donc pas en déduire combien de ménages qui y auraient droit passent à côté.\n\nL’accès au LEP dépend des conditions d’éligibilité du foyer. Un taux de détention général ne remplace pas cette vérification.',
    '💬 Tu as déjà vérifié si tu pouvais en ouvrir un ?',
  ],
  ldds: [
    "🇫🇷 Le Livret A est bien connu. Mais quelle place occupe le LDDS dans l’épargne des Français ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 détiennent un LDDS en France, soit {value} %.\n\nUn LDDS presque vide et un LDDS rempli comptent de la même façon. Sa détention peut aussi se cumuler avec celle d’autres livrets.\n\nPosséder une enveloppe ne dit pas combien on a pu mettre de côté, ni quel rôle on lui donne. Derrière le même livret, on peut préparer un projet ou simplement essayer de garder une marge pour les imprévus.',
    '💬 Ton LDDS sert-il à un projet précis ou à garder une réserve disponible ?',
  ],
  pel: [
    "🇫🇷 Le PEL a longtemps accompagné les projets immobiliers. Mais combien de Français en détiennent un ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 ont un PEL en France, soit {value} %.\n\nCe taux rassemble des plans ouverts à des dates différentes, sans distinguer leurs taux ni les montants placés. Leurs conditions et leurs règles ne sont donc pas toutes les mêmes.\n\nDeux PEL ouverts à des dates différentes peuvent avoir des conditions différentes. Le taux et la date d’ouverture permettent de comparer les plans concernés.',
    '💬 Si tu as un PEL, connais-tu encore son taux et sa date d’ouverture ?',
  ],
  'retirement-savings': [
    "🇫🇷 Préparer sa retraite revient souvent dans les discussions. Mais combien ont une épargne dédiée ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 détiennent un produit d’épargne retraite en France, soit {value} %.\n\nLa catégorie de l’Insee dépasse le seul PER et ne compte pas les droits aux pensions des régimes obligatoires.\n\nLes autres ménages peuvent aussi préparer leur retraite avec d’autres placements. Ce taux renseigne sur les produits détenus, pas sur toute la préparation financière des ménages pour cette période de leur vie.',
    '💬 Pour préparer ta retraite, quelle place donnes-tu aux produits dédiés ?',
  ],
  'employee-savings': [
    "🇫🇷 L’épargne salariale peut aider à mettre de côté. Mais combien en détiennent en France ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 détiennent de l’épargne salariale en France, soit {value} %.\n\nLe taux porte sur tous les ménages, pas seulement les salariés ou les personnes qui ont accès à un dispositif. Il ne mesure donc pas le taux d’utilisation parmi les bénéficiaires potentiels.\n\nL’accès dépend d’abord de ce que l’entreprise propose réellement. On peut ensuite réfléchir à la place de cette épargne dans ses projets, plutôt que se comparer à des ménages qui n’ont pas les mêmes possibilités.',
    '💬 Si tu y as accès, sais-tu ce que ton entreprise propose ?',
  ],
  cto: [
    "🇫🇷 On compare souvent le compte-titres au PEA. Mais combien de Français ont un compte-titres ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 ont un compte-titres ordinaire en France, soit {value} %, quel que soit le montant investi.\n\nUn même ménage peut aussi posséder un PEA : additionner les deux taux compterait certains ménages deux fois. Et le compte-titres ne résume pas toute l’exposition aux actions.\n\nLe choix de l’enveloppe dépend aussi du projet auquel l’épargne est destinée. Le nombre de comptes ouverts ne raconte pas les projets derrière.',
    '💬 Pour tes placements, qu’est-ce qui te ferait choisir un compte-titres ?',
  ],
  'other-homes': [
    "🇫🇷 Posséder un logement en plus de sa résidence principale : est-ce fréquent en France ? 👀",
    '🇫🇷 {period}, environ {rounded} ménages sur 100 possèdent un logement autre que leur résidence principale en France, soit {value} %.\n\nCela peut être une résidence secondaire, un logement loué, vacant ou mis à disposition gratuitement. Le chiffre ne mesure donc pas uniquement l’investissement locatif.\n\nUn même bien immobilier peut correspondre à des usages très différents. Sans cette précision, on pourrait facilement imaginer que tous ces ménages encaissent des loyers.',
    '💬 En lisant « un autre logement », pensais-tu d’abord à une location ou à une résidence secondaire ?',
  ],
  'debt-types': [
    "🇫🇷 Crédit immobilier ou crédit à la consommation : lequel est le plus répandu en France ? 👀",
    '🇫🇷 {period}, {value} % des ménages ont un crédit immobilier, contre {secondValue} % un crédit à la consommation. Cela représente environ {rounded} et {secondRounded} ménages sur deux grilles distinctes de 100.\n\nUn même ménage peut avoir les deux : on ne peut pas additionner les taux pour compter les ménages endettés.\n\nLa durée, le coût du crédit et la place de la mensualité dans le budget décrivent la charge de la dette. Ces deux taux de détention ne permettent pas de juger à eux seuls la situation financière des ménages.',
    '💬 Quand tu regardes une dette, compares-tu aussi sa durée et ce qu’elle finance ?',
  ],
  heating: [
    "🇫🇷 Chauffer correctement son logement paraît essentiel. Mais combien peinent à le financer ? 👀",
    '🇫🇷 {period}, environ {rounded} personnes sur 100 en France métropolitaine déclarent ne pas pouvoir chauffer suffisamment leur logement pour des raisons financières, soit {value} %.\n\nOn mesure une contrainte financière déclarée, pas la température du logement. Il s’agit de personnes, pas de ménages. {provisionalNote}\n\nLa capacité à épargner dépend de la marge qui reste une fois les factures payées. Quand même une dépense aussi essentielle devient difficile, parler d’épargne sans regarder le budget du quotidien laisse beaucoup de choses de côté.',
    '💬 Quelle marge te permettrait d’absorber une hausse de ta facture de chauffage ?',
  ],
  'bills-on-time': [
    "🇫🇷 Les factures tombent chaque mois. Mais combien de Français peinent à les payer à temps ? 👀",
    '🇫🇷 {period}, environ {rounded} personnes sur 100 en France métropolitaine déclarent ne pas pouvoir payer à temps leurs loyers, intérêts ou factures pour des raisons financières, soit {value} %.\n\nIl s’agit d’une difficulté financière déclarée, pas d’un simple oubli de paiement. On parle de personnes, pas de ménages. {provisionalNote}\n\nQuand l’argent disponible ne suffit pas, plusieurs échéances peuvent entrer en concurrence. Cette difficulté de paiement décrit une contrainte du quotidien que les chiffres de patrimoine ne montrent pas.',
    '💬 Qu’est-ce qui t’aide à garder de la marge quand plusieurs factures tombent ensemble ?',
  ],
  'personal-spending': [
    "🇫🇷 S’offrir un petit plaisir chaque semaine : combien de Français doivent y renoncer faute d’argent ? 👀",
    '🇫🇷 {period}, environ {rounded} personnes sur 100 en France métropolitaine déclarent ne pas pouvoir dépenser librement une petite somme chaque semaine pour des raisons financières, soit {value} %.\n\nIl s’agit de personnes, pas de ménages. {provisionalNote}\n\nUne petite dépense pour soi peut sembler anodine quand on a de la marge. Quand le budget est serré, elle devient un choix qu’il faut peser. Ce taux mesure aussi cette liberté limitée au quotidien.',
    '💬 Quelle petite dépense représente pour toi cette liberté au quotidien ?',
  ],
  'protein-meals': [
    "🇫🇷 Un repas avec viande, poisson ou équivalent végétarien : combien peinent à se le payer régulièrement ? 👀",
    '🇫🇷 {period}, environ {rounded} personnes sur 100 en France métropolitaine déclarent ne pas pouvoir s’offrir un repas avec viande, poisson ou équivalent végétarien tous les deux jours pour des raisons financières, soit {value} %.\n\nCe chiffre mesure la possibilité de financer ces repas, pas les quantités de protéines consommées. Il s’agit de personnes, pas de ménages. {provisionalNote}\n\nLa marge disponible pour épargner n’est pas la même pour tous. Quand les dépenses alimentaires deviennent difficiles, les priorités du budget ne sont pas les mêmes.',
    '💬 Le budget alimentaire a-t-il changé ta façon de composer tes repas ?',
  ],
}

export function householdEditorial(record) {
  const copy = HOUSEHOLD_EDITORIAL[record.id]
  return copy ? { ...record, intro: copy[0], body: copy[1], question: copy[2] } : record
}
