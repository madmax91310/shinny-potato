import { RESOURCE_COMPARISONS } from '../../data/resource-selections.js'
import { DISTINCT_ASSET_SELECTIONS } from '../../data/distinct-asset-selections.js'
// Copie éditoriale des tweets. Les chiffres, sources et images restent dans leurs registres.
// Les comparatifs et simulations utilisent toujours les lignes calculées de buildSheet.
const copy = (hook, sections, closing) => ({ hook, sections, closing })
export const PRACTICAL_EDITORIAL = {
 ...Object.fromEntries(DISTINCT_ASSET_SELECTIONS.map(c=>[c.id,copy(c.hook,null,c.cloture)])),
 "etf-pe": copy("Un ETF affiche un PER plus faible. Est-ce forcément une meilleure affaire ?", null, "Deux PER ne sont comparables que si les méthodes de calcul et les périmètres le sont aussi."),
 "etf-volatility": copy("Un ETF a moins bougé pendant trois ans. Que peux-tu vraiment en déduire ?", null, "La volatilité mesure les variations passées ; elle ne garantit pas le capital."),
 "sector-theme": copy("Deux ETF parlent de technologie sans acheter les mêmes entreprises. Comment les distinguer ?", null, "Deux ETF au nom proche peuvent détenir des entreprises très différentes. Leur composition permet de voir ce qu’on achète réellement."),
 "em-small": copy("Un ETF émergents ne contient pas forcément les petites entreprises. Que change leur ajout ?", null, "Un ETF émergents qui inclut déjà les petites entreprises peut faire doublon avec une ligne dédiée."),
 "bond-falls": copy("Ton ETF détient des obligations. Pourquoi sa valeur peut-elle baisser malgré les coupons ?", null, "Les coupons reçus ne compensent pas forcément la baisse du prix des parts."),
 "bond-duration": copy("Deux ETF obligataires peuvent avoir une échéance moyenne proche sans réagir exactement de la même façon aux taux.", null, "La comparaison demande la même mesure, calculée à des dates comparables."),
 "av-fee-layers": copy("Les frais de ton ETF ne sont pas forcément tous les frais de ton assurance-vie.", null, "Le coût total dépend du contrat, du support et du mode de gestion."),
 "etf-aum-scope": copy("Deux encours différents pour le même ETF : les chiffres peuvent porter sur des périmètres différents.", null, "Le périmètre et la date permettent de comprendre à quoi correspond chaque montant."),
 "etf-spread": copy("Le prix d’achat et le prix de vente affichés pour un ETF ne sont pas toujours identiques.", null, "Le carnet d’ordres et les conditions d’exécution déterminent le prix réellement accessible."),
 "13f-reading": copy("Une déclaration 13F montre des positions à une date passée. Peut-on en déduire tout le portefeuille ?", null, "La date et le périmètre déclaré limitent ce que cette photographie permet de conclure."),

 ...Object.fromEntries(RESOURCE_COMPARISONS.map(c=>[c.id,copy(c.hook,null,c.cloture)])),
 'pea-cto': copy('PEA ou CTO pour investir en Bourse ?\n\nLe compte choisi change les placements accessibles et la fiscalité. Voici les différences à connaître avant de l’ouvrir', null, 'Les placements accessibles, les frais et la fiscalité permettent de départager les deux comptes selon tes besoins.'),
 'av-cto': copy('Un même placement peut te coûter plus cher selon le compte utilisé.\n\nAssurance-vie ou CTO : les frais et la fiscalité méritent d’être comparés ensemble', null, 'Les frais du contrat sur la durée et les supports disponibles comptent autant que l’avantage fiscal annoncé.'),
 'av-per': copy('Assurance-vie ou PER : quand pourras-tu récupérer ton argent ?\n\nLa disponibilité de l’argent est une première différence essentielle', null, 'Sur un PER, la fiscalité à la sortie compte aussi. L’économie d’impôt au moment du versement ne suffit pas à faire le choix.'),
 'gold-av-cto': copy('Tu veux investir dans l’or en assurance-vie ou sur CTO ?\n\nLes supports proposés ne suivent pas tous le prix du métal', null, 'Un fonds qui investit dans des mines d’or détient des entreprises. Il ne remplace pas un support qui suit le prix du métal.'),
 'world-pea': copy('Tu veux un ETF World sur ton PEA, mais plusieurs noms apparaissent.\n\nMême indice ne veut pas dire mêmes frais ni mêmes conditions d’achat', null, 'Les frais, les conditions d’achat chez ton courtier et le suivi de l’indice permettent de départager les parts. Les performances doivent porter sur la même période et la même devise.'),
 'europe-pea': copy('Deux ETF éligibles au PEA peuvent parler d’Europe sans couvrir les mêmes pays.\n\nRegardons ce qu’ils contiennent avant de comparer leur prix', null, 'La zone couverte détermine les entreprises accessibles. Les frais et les performances se comparent ensuite sur des périmètres clairement identifiés.'),
 'sp500-pea': copy('Plusieurs ETF permettent de suivre le S&P 500 sur PEA.\n\nFrais du fonds, coût des achats, suivi de l’indice : voici de quoi les départager', null, 'Les frais du fonds et le coût des achats s’additionnent. Un historique comparable permet aussi d’examiner le suivi de l’indice sur une même période.'),
 'em-pea': copy('Tu cherches un ETF émergents sur PEA ?\n\nPays couverts et filtres ESG peuvent changer ce que tu détiens. Le nom de l’ETF ne suffit pas', null, 'Les pays couverts et les éventuels filtres ESG changent les entreprises détenues. Deux ETF émergents peuvent donc proposer des expositions différentes.'),
 'world-acwi': copy('World, ACWI ou All-World : lequel couvre les pays que tu veux dans ton portefeuille ?\n\nLa place des marchés émergents fait une différence', null, 'Le World couvre les pays développés. Avec un ACWI ou un All-World, les marchés émergents sont aussi présents : une ligne émergents supplémentaire renforce alors une exposition déjà présente.'),
 'europe-indices': copy('MSCI Europe, STOXX Europe 600 et Euro STOXX 50 : ces noms ne désignent pas le même panier d’actions.\n\nVoici les pays et les entreprises que tu retrouves derrière chaque indice', null, 'Les pays couverts et le poids des principales entreprises décrivent la répartition. Le nombre de titres, à lui seul, ne suffit pas.'),
 'world-sp500': copy('World ou S&P 500 ?\n\nAvant de comparer les performances, voici les entreprises et les pays couverts', null, 'Le S&P 500 donne une exposition aux grandes entreprises américaines. Le World couvre plusieurs pays développés : ce choix change la répartition géographique du placement.'),
 'world-em': copy('Faut-il ajouter des émergents à un ETF World ?\n\nTu élargis les pays couverts, mais tu as aussi une répartition à choisir et à suivre', [
 ['🌍 Les pays couverts', 'Le World couvre les pays développés. Un ETF émergents ajoute des entreprises de marchés qui ne sont pas directement représentés dans cet indice.'],
 ['⚖️ La répartition', 'Avec deux ETF, tu choisis la place des émergents. Leur poids dépend de tes versements et de l’évolution des deux placements.'],
 ['🔧 Le suivi', 'Un World seul peut se gérer avec une ligne. En ajoutant des émergents, tu dois aussi suivre la répartition et décider quand la rééquilibrer.'],
 ['📈 La performance', 'Le résultat dépend du poids des émergents et de leur performance. Ajouter des pays ne garantit pas que ton portefeuille rapportera davantage.'],
 ], 'Cette exposition supplémentaire demande de choisir son poids et une règle de suivi dans la durée.'),
 'europe-zone': copy('Un ETF Europe peut investir au Royaume-Uni et en Suisse. Un ETF zone euro couvre d’autres pays.\n\nLe nom semble proche ; le contenu peut beaucoup changer', null, 'La liste des pays de l’indice précise la zone couverte. Le mot « Europe » dans le nom de l’ETF ne veut pas dire « zone euro ».'),
 'sp500-nasdaq': copy('S&P 500 et Nasdaq-100 : tu peux retrouver les mêmes grandes entreprises, mais pas dans les mêmes proportions.\n\nLes associer peut renforcer des positions que tu détiens déjà', null, 'Le Nasdaq-100 exclut les sociétés financières et dépend d’un univers de cotation particulier. Son ajout peut renforcer des entreprises déjà détenues dans un autre ETF américain.'),
 'equal-weight': copy('Deux indices peuvent contenir les mêmes entreprises et répartir ton argent très différemment.\n\nAvec l’équipondération, chaque entreprise retrouve le même poids au rééquilibrage', null, 'Avec l’équipondération, les plus grandes sociétés prennent moins de place. Des rééquilibrages réguliers remettent les entreprises à poids égal.'),
 'index-adds': copy('Tu as déjà un ETF World et tu veux ajouter une ligne ?\n\nVoici ce que chaque ajout change dans le portefeuille', [
 ['🇺🇸 Un S&P 500', 'Il renforce les grandes entreprises américaines, déjà présentes dans le World. Tu augmentes leur place dans ton portefeuille.'],
 ['💻 Un Nasdaq-100', 'Tu renforces certaines grandes entreprises déjà détenues. Les entreprises en commun et leurs poids déterminent l’ampleur de ce renforcement.'],
 ['🌍 Des marchés émergents', 'Ils ajoutent une exposition directe à des marchés absents du World. Leur poids dans le portefeuille reste à choisir.'],
 ['🏢 Un World Small Cap', 'Il ajoute de petites entreprises des pays développés, absentes du MSCI World classique.'],
 ], 'Ajouter un ETF peut renforcer des entreprises déjà détenues ou donner accès à de nouvelles sociétés. Sa composition permet de distinguer les deux.'),
 'diversification': copy('Tu peux avoir cinq ETF et retrouver les mêmes entreprises dans plusieurs d’entre eux.\n\nPour savoir si tu diversifies vraiment, il faut regarder à l’intérieur', [
 ['🏢 Les entreprises en commun', 'Deux ETF différents peuvent détenir les mêmes actions. En les associant, tu augmentes leur place dans ton portefeuille.'],
 ['🌍 Les pays représentés', 'Ajouter un S&P 500 à un World renforce ton exposition aux États-Unis, déjà présents dans le World.'],
 ['💻 Le poids des secteurs', 'Avec un ETF tech en complément, tu peux donner encore plus de place à un secteur déjà important dans tes autres ETF.'],
 ['⚖️ La répartition de ton argent', 'Un ETF qui représente 5 % de ton portefeuille n’a pas le même effet qu’une ligne à 50 %.'],
 ], 'La diversification dépend des actifs détenus et de leurs poids dans le portefeuille entier, pas du seul nombre d’ETF.'),
 'portfolio-case': copy('Tu vois un portefeuille d’ETF et tu te demandes s’il te conviendrait ?\n\nSon objectif, sa composition et son suivi doivent correspondre à tes besoins', [
 ['🎯 L’usage de cet argent', 'Quand en auras-tu besoin ? Quelle baisse pourrais-tu supporter ? Ces questions passent avant le choix des ETF.'],
 ['🧩 Le rôle de chaque ligne', 'Le placement principal et les compléments n’ont pas le même rôle. Chaque ETF doit avoir une raison d’être là.'],
 ['🔎 Les entreprises en commun', 'Les indices et les pays couverts révèlent les premiers recoupements. Les principales entreprises peuvent se retrouver dans plusieurs lignes.'],
 ['🔧 La gestion au quotidien', 'Les versements et les rééquilibrages demandent une règle claire. Il faut pouvoir tenir cette organisation dans la durée.'],
 ], 'Un portefeuille présenté en exemple peut donner des idées. Son objectif et les baisses possibles doivent correspondre à ta situation.'),
 'cap-dist': copy('Capitalisant ou distribuant : que deviennent les revenus de ton ETF ?\n\nRéinvestis dans le fonds ou versés sur ton compte, ils font partie de sa performance', null, 'Une comparaison de performances doit aussi compter les distributions. Un graphique de cours seul ne montre pas tout ce qu’un ETF distribuant a rapporté.'),
 'phys-synth': copy('Un ETF peut acheter les titres de son indice ou obtenir sa performance avec un contrat financier.\n\nVoici comment fonctionnent la réplication physique et la réplication synthétique', null, 'Les documents du fonds précisent la méthode et l’éligibilité PEA de la part exacte. La réplication seule ne permet pas de conclure.'),
 'hedge': copy('Ton ETF est coté en euros : est-il protégé contre les variations du dollar ?\n\nLa devise affichée à l’achat ne répond pas à cette question', null, 'La devise utilisée pour acheter une part ne décrit pas les devises des actifs détenus. La mention EUR Hedged et les documents du fonds précisent la couverture en euros.'),
 'dividend-options': copy('Deux ETF peuvent verser des revenus élevés sans les obtenir de la même façon.\n\nDividendes et vente d’options : regardons d’où vient l’argent distribué', null, 'Le résultat comprend les revenus reçus et la valeur du capital restant. Une grosse distribution peut accompagner une baisse du placement.'),
 'price-part': copy('Un ETF à 5 € est-il moins cher qu’un ETF à 500 € ?\n\nLe prix peut donner cette impression. Je t’explique ce qu’il permet vraiment de comparer', [
 ['💶 Le budget pour acheter une part', 'Pour une part entière, il te faut 5 € dans le premier cas et 500 € dans le second.\n\nAvec de petits versements, cette différence peut faciliter tes achats ou t’obliger à attendre.'],
 ['🏢 Le prix des entreprises détenues', 'Une part à 5 € ne signifie pas que les entreprises dans l’ETF sont bon marché.\n\nLe fonds découpe simplement sa valeur en un certain nombre de parts. Le prix affiché dépend aussi de ce découpage.'],
 ['📈 La performance de ton placement', 'Si tu investis 500 € et que l’ETF gagne 10 %, ton placement gagne 50 €.\n\nQue tu détiennes 100 parts à 5 € ou une part à 500 € ne change pas ce calcul.'],
 ['🔎 Les différences à regarder', 'L’indice suivi, les frais et l’accès à la part dans ton enveloppe permettent de comparer les produits.'],
 ], 'Le prix de la part compte pour organiser les achats. Il ne dit pas si les entreprises détenues sont bon marché.'),
 'gold-physical': copy('Une pièce d’or et un ETC or ne se détiennent pas de la même façon.\n\nStockage, frais, garanties : voici ce qui change pour toi', null, 'Pour un ETC, les documents précisent l’adossement au métal et les garanties prévues. Ce titre se distingue d’une pièce détenue chez soi et d’actions de sociétés minières.'),
 'bonds-term': copy('Ton ETF obligataire affiche une année dans son nom. Cela garantit-il ce que tu récupéreras à la fin ?\n\nCette date décrit la durée prévue du fonds, pas une promesse de remboursement', null, 'La date indique quand le fonds prévoit de se terminer. Elle ne garantit pas le capital récupéré et ne supprime pas le risque de défaut des émetteurs.'),
 'livret-euro': copy('Livret A ou fonds euros pour garder une épargne disponible ?\n\nLes conditions de retrait comptent aussi', null, 'Le contrat précise le délai de rachat et les conditions de garantie. Pouvoir retirer son argent et pouvoir le récupérer immédiatement sont deux choses différentes.'),
 'euro-monetary': copy('Un fonds euros et un ETF monétaire peuvent sembler proches quand tu cherches de la stabilité.\n\nLa garantie du capital est pourtant une différence essentielle', null, 'Une garantie dépend de celui qui la porte et de ses conditions. Un ETF monétaire reste un placement sans garantie du capital, même si ses variations sont faibles.'),
 'pea-provider': copy('Deux établissements proposent un PEA, mais lequel correspond à tes achats ?\n\nVoici les différences à comparer', [
 ['💶 Le coût des ordres', 'Le tarif dépend du montant de chaque ordre. Le prix mis en avant ne correspond pas forcément à tes achats habituels.'],
 ['📋 Les frais du compte', 'Les droits de garde et les frais d’inactivité peuvent s’ajouter au courtage. Certaines offres les suppriment sous conditions.'],
 ['🔎 Les placements accessibles', 'L’ISIN et la place de cotation identifient l’ETF accessible. Un PEA ne donne pas automatiquement accès à tous les ETF éligibles.'],
 ['🤝 Les services', 'Les modalités de versement, de passage d’ordres, d’assistance et de transfert changent selon l’établissement.'],
 ], 'Les règles fiscales du PEA restent les mêmes. Les différences viennent des établissements et du coût de tes opérations.'),
 'multiple-av': copy('Ouvrir plusieurs assurances-vie : qu’est-ce que cela peut t’apporter ?\n\nFrais, assureurs et supports disponibles sont à comparer avant de multiplier les contrats', null, 'Un contrat supplémentaire peut donner accès à d’autres supports, tarifs ou assureurs. Ouvrir plusieurs contrats ne multiplie pas l’abattement annuel sur les gains retirés.'),
 'before-etf': copy('Tu vas acheter ton premier ETF ?\n\nVoici les points à vérifier avant de passer l’ordre', [
 ['🏢 L’indice suivi', 'L’indice détermine les entreprises ou les actifs détenus. Le nom de l’ETF ne suffit pas toujours à comprendre son contenu.'],
 ['🔎 La bonne part', 'L’ISIN identifie la part et permet de vérifier son accès dans ton enveloppe. Deux parts d’un même fonds peuvent avoir des caractéristiques différentes.'],
 ['💶 Les frais', 'Les frais annuels du fonds, le coût de l’ordre et l’écart entre prix d’achat et de vente, appelé spread, réduisent le résultat.'],
 ['📉 Le risque', 'La baisse supportable et la date à laquelle tu auras besoin de l’argent comptent dans ce choix.'],
 ], 'Le document d’informations clés, le DIC, présente le produit et ses risques. Un point incompris mérite d’être éclairci avant l’achat.'),
 'transfer-pea': copy('Tu veux déplacer ton PEA vers un autre établissement ?\n\nVoici les vérifications utiles pour préparer le transfert', [
 ['🔎 Les titres acceptés', 'Le nouvel établissement doit pouvoir recevoir chaque ligne. Les ISIN évitent les confusions entre parts.'],
 ['⏳ Les opérations en cours', 'Des opérations non terminées peuvent retarder le transfert. Leur état doit être clarifié avant la demande.'],
 ['💶 Le compte espèces', 'Les frais éventuels doivent pouvoir être réglés avec le montant disponible sur le compte espèces.'],
 ['📁 La demande de transfert', 'Le transfert du plan conserve son antériorité fiscale. Retirer l’argent puis ouvrir un autre PEA est une opération différente.'],
 ], 'La préparation avec les deux établissements permet de repérer les titres non acceptés et les opérations à terminer.'),
 'broker-fees': copy('Un courtier peut être peu cher pour un gros ordre et moins intéressant pour tes versements habituels.\n\nVoici les frais à comparer', [
 ['💶 Chaque achat ou vente', 'Le minimum facturé et le pourcentage appliqué déterminent le coût de l’ordre. Le barème peut aussi changer selon la place de cotation.'],
 ['💱 La conversion de devises', 'Une opération en devises peut nécessiter une conversion payante. Il peut s’ajouter aux frais de courtage affichés.'],
 ['📋 La vie du compte', 'Les frais de garde, d’inactivité et les abonnements éventuels dépendent des conditions de chaque offre.'],
 ['🚪 Le départ', 'Le transfert ou la clôture peuvent être facturés. Les offres de remboursement ont leurs propres conditions.'],
 ], 'Le coût des opérations habituelles permet une comparaison adaptée à ton usage. Le prix d’un seul ordre ne raconte pas toute l’histoire.'),
 'choose-broker': copy('Tu veux investir 100 € par mois ? Le courtier doit aussi permettre les achats que tu prévois.\n\nVoici les points à vérifier', [
 ['💶 Le montant minimum', 'Le minimum d’ordre et le prix d’une part entière doivent rester compatibles avec le versement mensuel prévu.'],
 ['🧾 Les frais pour cet achat', 'Le tarif pertinent est celui d’un ordre de 100 €, avec ses conditions. Une offre sans courtage peut concerner certains produits ou certaines places seulement.'],
 ['🔎 L’ETF disponible', 'La part exacte, identifiée par son ISIN, doit être accessible dans l’enveloppe choisie.'],
 ['🔧 Le fonctionnement', 'La programmation des achats, les modalités de versement et les documents fiscaux fournis changent selon le courtier.'],
 ], 'Le montant mensuel et l’ETF choisi donnent une base concrète pour comparer les offres. Cela rend les différences beaucoup plus concrètes.'),
 'ifu': copy('Ton courtier t’a envoyé un IFU pour ta déclaration ?\n\nVoici les points à vérifier avant de valider', [
 ['📅 L’année et le titulaire', 'Le document doit concerner la bonne personne et l’année des revenus déclarés.'],
 ['🧾 Les revenus et les gains', 'Les relevés du compte permettent de contrôler les montants de l’IFU. Cela permet de repérer un écart à éclaircir.'],
 ['🔎 Les cases préremplies', 'Les rubriques concernées doivent correspondre au document. La présence d’un montant prérempli ne dispense pas de le vérifier.'],
 ['🌍 Les comptes à l’étranger', 'Les obligations de déclaration du compte se vérifient séparément. L’IFU ne couvre pas forcément cette démarche.'],
 ], 'L’IFU aide à déclarer, mais le contribuable reste responsable de vérifier sa déclaration.'),
 'merger': copy('Ton ETF fusionne ou change d’indice : faut-il vendre ?\n\nL’avis officiel précise les changements à examiner', [
 ['🏢 La nouvelle exposition', 'L’indice suivi et les éventuels filtres définissent la nouvelle exposition. Les entreprises détenues et leurs poids peuvent changer.'],
 ['🔎 La part reçue', 'Le nouvel ISIN, la politique de distribution et la méthode de réplication décrivent la part reçue.'],
 ['📁 L’enveloppe', 'L’éligibilité de la part après l’opération doit être compatible avec le compte qui la détient.'],
 ['📅 Le calendrier', 'L’avis précise les dates et les modalités de l’opération. Une période de suspension peut être prévue.'],
 ], 'L’avis de l’émetteur décrit les changements réels. Un nouveau nom, à lui seul, ne suffit pas à décider.'),
 'same-world': copy('Deux ETF suivent le MSCI World. Comment les départager ?\n\nLe choix se joue aussi sur la part exacte et sur le coût de tes achats', null, 'La part exacte et le coût des achats peuvent faire la différence. Les frais annuels du fonds comptent, mais ils ne résument pas à eux seuls le choix.'),
 'change-etf': copy('Un ETF moins cher vient de sortir. Est-ce que vendre le tien vaut le coût ?\n\nCalculons le temps nécessaire pour amortir la vente et le nouvel achat', null, 'L’économie attendue doit être rapportée au coût de la vente et du nouvel achat. Sur CTO, la fiscalité d’une éventuelle plus-value doit aussi être examinée avant de décider.'),
 'where-savings': copy('Tu sais que tu auras bientôt besoin de ton épargne ?\n\nLa disponibilité et la garantie du capital comptent avant le rendement', [
 ['📅 La date du projet', 'La date d’utilisation de l’argent fixe l’horizon. Une marge permet de ne pas dépendre d’un retrait au dernier moment.'],
 ['⏳ Le délai pour récupérer l’argent', 'Les délais de retrait, de vente et de règlement doivent correspondre à la date du projet.'],
 ['🔒 La garantie', 'La garantie précise ce qui est couvert, par qui et sous quelles conditions.'],
 ['💶 Le rendement réellement reçu', 'Le rendement reçu dépend des frais, des impôts et des conditions annoncées pour l’obtenir.'],
 ], 'Une bonne performance passée n’empêche pas de devoir vendre en perte au moment du projet. Le placement doit correspondre à la date prévue d’utilisation.'),
 'fees-euros': copy('Un écart de frais paraît petit en pourcentage. Combien représente-t-il en euros sur la durée ?\n\nCette simulation garde le même rendement supposé pour isoler leur effet', null, 'La simulation fait varier les frais en gardant le même rendement supposé. Cela permet de voir leur effet, sans prétendre prévoir la performance du placement.'),
 'delay-invest': copy('Que change le fait d’attendre avant d’investir une somme ?\n\nCette simulation compare les durées investies avec une même hypothèse de rendement', null, 'Le rendement est une hypothèse. Si les marchés baissent pendant l’attente, investir plus tard peut donner un meilleur résultat : ce calcul ne dit pas ce qui va se passer.'),
 'under-index': copy('Ton ETF affiche +8 %, mais tu vois +12 % pour son indice.\n\nLes méthodes de calcul peuvent expliquer une partie de cet écart', [
 ['💱 La devise', 'Un indice affiché en dollars et un ETF mesuré en euros peuvent donner des résultats différents.\n\nLe taux de change peut creuser l’écart, même si l’ETF suit correctement son indice.'],
 ['💰 Les dividendes', 'Certains graphiques montrent uniquement l’évolution des cours. D’autres intègrent les dividendes réinvestis.\n\nLa comparaison demande le même traitement des revenus des deux côtés.'],
 ['📅 Les dates', 'Depuis le début de l’année, sur un an ou depuis ton achat : ce ne sont pas les mêmes périodes.\n\nLes dates de départ et d’arrivée doivent être identiques. L’heure de la dernière cotation peut aussi expliquer un petit décalage.'],
 ['🔍 Les frais et le suivi', 'Une fois ces points alignés, un écart peut encore rester.\n\nLes frais du fonds et sa manière de reproduire l’indice influencent sa performance.'],
 ], 'Une différence de devise, de période ou de traitement des revenus peut créer un écart apparent sans défaut de suivi de l’ETF.'),
 'dividend-gain': copy('Ton ETF t’a versé un gros dividende. Combien t’a-t-il réellement rapporté ?\n\nLe calcul comprend le capital restant et les revenus reçus', [
 ['💼 Le capital restant', 'La valeur actuelle du placement fait partie du résultat. Recevoir une distribution n’empêche pas le cours de baisser.'],
 ['💰 Les revenus reçus', 'Les distributions reçues sur la période s’ajoutent à la valeur restante. Elles font partie du résultat, même si elles ne sont plus sur le compte.'],
 ['🧾 Les frais et les impôts', 'Ils réduisent le gain net et doivent être déduits du résultat.'],
 ['📈 La performance totale', 'La valeur du placement et les revenus cumulés se mesurent sur les mêmes dates. Cela permet de comparer avec un autre support.'],
 ], 'Le taux de distribution indique un revenu versé. Il ne suffit pas à mesurer le gain du placement.'),
 'personal-performance': copy('Ton ETF a monté, mais ton compte affiche un autre pourcentage ?\n\nLes dates et les montants de tes achats peuvent expliquer la différence', null, 'La période et la méthode du courtier peuvent différer. Le rendement de tes versements et celui d’une part détenue sur toute la période ne mesurent pas la même chose.'),
 'tracking': copy('Deux ETF suivent le même indice, mais leurs performances diffèrent.\n\nVoici les différences à comparer pour comprendre l’écart', [
 ['💱 La part et la devise', 'Une comparaison cohérente demande la même exposition, la même couverture contre le change et des rendements exprimés dans la même devise.'],
 ['💰 Les revenus', 'Les distributions doivent être prises en compte de la même façon. Une performance avec dividendes réinvestis ne se compare pas à un simple graphique de cours.'],
 ['🔧 La réplication', 'La fiscalité interne et la manière de reproduire l’indice influencent le résultat. Un éventuel prêt de titres peut aussi avoir un effet.'],
 ['🧾 Les frais et le suivi', 'Les frais annuels et la performance obtenue face à l’indice donnent deux informations complémentaires. Les frais ne sont pas le seul élément qui explique l’écart.'],
 ], 'L’écart de suivi mesure la différence de rendement avec l’indice. La tracking error indique à quel point cet écart varie dans le temps.'),
}

const ROW_EMOJI = {
 'Supports':'🏢', 'Versements':'💶', 'Fiscalité':'🧾', 'Retraits':'⏳', 'Frais':'💶', 'Impôt':'🧾', 'Transmission':'📁', 'Disponibilité':'⏳', 'Exception':'🔎', 'Sortie':'📁',
 'Accès':'🔎', 'Exposition':'🏢', 'Coûts':'💶', 'Indice':'🏢', 'Frais annuels':'💶', 'Revenus':'💰', 'Encours':'💼', 'Périmètre':'🌍', 'Titres':'🏢', 'Première ligne':'🔎', 'Photographie':'📅',
 'Réinvestissement':'🔄', 'CTO':'🧾', 'Comparaison':'📈', 'Méthode':'🔧', 'À lire':'🔎', 'Risques':'📉', 'PEA':'📁', 'Change':'💱', 'Coût':'💶', 'Risque de marché':'📉', 'À vérifier':'🔎',
 'Hausse':'📈', 'Baisse':'📉', 'À comparer':'🔎', 'Détention':'💼', 'Vérifications':'🔎', 'Durée':'📅', 'Obligations':'📋', 'Capital':'💶', 'Rendement':'📈', 'Garantie':'🔒', 'Retrait':'⏳',
 'Gestion':'🔧', 'Offre':'🏢', 'Assureurs':'🔒', 'Capital initial':'💶', 'Durée investie':'📅', 'Capital final':'💼', 'Écart':'🔎', 'Économie annuelle':'💶', 'Coût total du changement':'🧾', 'Amortissement':'⏳', 'Période':'📅', 'Mesure':'🔎',
}

export function practicalTweetBlocks(sheet, editorial) {
 if (editorial.sections) return editorial.sections.map(([title, text]) => `${title}\n\n${text}`)
 return sheet.rows.map(row => {
  const title = `${ROW_EMOJI[row[0]] ?? '📈'} ${row[0]}`
  const values = sheet.columns.map((column, i) => `${column === 'À comprendre' ? '' : column.split('\n')[0] + ' : '}${String(row[i + 1]).replaceAll('\n', ' · ')}`)
  return `${title}\n\n${values.join('\n')}`
 })
}

export const PRACTICAL_EXAMPLES = {
 'etf-pe': 'Exemple fictif : un PER de 15 pour un ETF bancaire et de 25 pour un ETF technologique ne compare pas les mêmes activités. Le ratio seul ne permet pas de les départager.',
 'etf-volatility': 'Exemple fictif : une volatilité de 10 % n’est pas une perte maximale de 10 %. La baisse peut dépasser ce chiffre.',
 'sector-theme': 'Par exemple, une entreprise de cybersécurité peut appartenir au secteur technologique. Un ETF technologique large et un ETF cybersécurité peuvent donc la détenir tous les deux.',
 'em-small': 'Par exemple, associer un ETF émergents IMI et un ETF petites capitalisations émergentes peut renforcer des entreprises déjà présentes dans le premier.',
 'bond-duration': 'Exemple simplifié : une duration de 5 correspond approximativement à une baisse de prix de 5 % si les taux montent de 1 point, toutes choses égales par ailleurs. Cette approximation ignore notamment la convexité.',
 'av-fee-layers': 'Par exemple, les frais annuels du contrat et ceux de l’ETF peuvent s’appliquer au même investissement. Il faut aussi vérifier les éventuels frais de transaction et de gestion pilotée.',
 'etf-aum-scope': 'Par exemple, une part capitalisante et une part distribuante peuvent appartenir au même fonds. L’encours du fonds entier ne doit pas être présenté comme celui de chaque part.',
 '13f-reading': 'Par exemple, le poids d’une entreprise peut augmenter parce que son cours monte, sans achat supplémentaire. Le nombre d’actions permet de distinguer un achat d’une variation de cours.',
}
