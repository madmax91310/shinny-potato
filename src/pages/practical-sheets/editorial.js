import { RESOURCE_COMPARISONS } from '../../data/resource-selections.js'
// Copie éditoriale des tweets. Les chiffres, sources et images restent dans leurs registres.
// Les comparatifs et simulations utilisent toujours les lignes calculées de buildSheet.
const copy = (hook, sections, closing) => ({ hook, sections, closing })
export const PRACTICAL_EDITORIAL = {
 ...Object.fromEntries(RESOURCE_COMPARISONS.map(c=>[c.id,copy(c.hook,null,c.cloture)])),
 'pea-cto': copy('PEA ou CTO pour investir en Bourse ?\n\nLe compte choisi change les placements accessibles et la fiscalité. Voici les différences à connaître avant de l’ouvrir', null, 'Je commence par vérifier où je peux acheter les placements qui m’intéressent. Ensuite, je compare les frais et la fiscalité.'),
 'av-cto': copy('Un même placement peut te coûter plus cher selon le compte utilisé.\n\nAssurance-vie ou CTO : les frais et la fiscalité méritent d’être comparés ensemble', null, 'Je regarde les frais du contrat sur la durée et les supports disponibles avant de compter sur un avantage fiscal.'),
 'av-per': copy('Assurance-vie ou PER : quand pourras-tu récupérer ton argent ?\n\nC’est la première différence que je regarderais', null, 'Sur un PER, je regarde aussi ce que je paierai à la sortie. L’économie d’impôt au moment du versement ne suffit pas à faire le choix.'),
 'gold-av-cto': copy('Tu veux investir dans l’or en assurance-vie ou sur CTO ?\n\nJe commence par vérifier ce que tu achètes réellement', null, 'Un fonds qui investit dans des mines d’or détient des entreprises. Il ne remplace pas un support qui suit le prix du métal.'),
 'world-pea': copy('Tu veux un ETF World sur ton PEA, mais plusieurs noms apparaissent.\n\nMême indice ne veut pas dire mêmes frais ni mêmes conditions d’achat', null, 'Je vérifie les frais et les conditions d’achat chez mon courtier. Si des performances comparables sont disponibles, je regarde aussi comment chaque ETF suit son indice.'),
 'europe-pea': copy('Deux ETF éligibles au PEA peuvent parler d’Europe sans couvrir les mêmes pays.\n\nRegardons ce qu’ils contiennent avant de comparer leur prix', null, 'Je choisis d’abord la zone que je veux couvrir. Comparer les frais ou les performances vient ensuite, une fois que je sais ce que contient chaque ETF.'),
 'sp500-pea': copy('Plusieurs ETF permettent de suivre le S&P 500 sur PEA.\n\nFrais du fonds, coût des achats, suivi de l’indice : voici de quoi les départager', null, 'Je regarde les frais du fonds, puis le coût de mes achats chez le courtier. Quand l’historique le permet, je compare aussi les performances sur une même période.'),
 'em-pea': copy('Tu cherches un ETF émergents sur PEA ?\n\nPays couverts et filtres ESG peuvent changer ce que tu détiens. Le nom de l’ETF ne suffit pas', null, 'Avant de comparer les frais, je vérifie les pays couverts et les éventuels filtres ESG. Ces choix peuvent changer les entreprises dans lesquelles j’investis.'),
 'world-acwi': copy('World, ACWI ou All-World : lequel couvre les pays que tu veux dans ton portefeuille ?\n\nLa place des marchés émergents fait une différence', null, 'Le World couvre les pays développés. Avec un ACWI ou un All-World, les marchés émergents sont aussi présents : je vérifie donc ce que je détiens déjà avant d’en ajouter.'),
 'europe-indices': copy('MSCI Europe, STOXX Europe 600 et Euro STOXX 50 : ces noms ne désignent pas le même panier d’actions.\n\nVoici les pays et les entreprises que tu retrouves derrière chaque indice', null, 'Je regarde les pays couverts et la place des principales entreprises. Le nombre de titres, à lui seul, ne dit pas comment mon argent est réparti.'),
 'world-sp500': copy('World ou S&P 500 ? Avant de comparer les performances, je regarde les entreprises que je vais détenir.\n\nVoici ce qui change', null, 'Le S&P 500 me donne une exposition aux grandes entreprises américaines. Le World couvre plusieurs pays développés : ce choix change la répartition géographique de mon placement.'),
 'world-em': copy('Faut-il ajouter des émergents à un ETF World ?\n\nTu élargis les pays couverts, mais tu as aussi une répartition à choisir et à suivre', [
 ['🌍 Les pays couverts', 'Le World couvre les pays développés. Un ETF émergents ajoute des entreprises de marchés qui ne sont pas directement représentés dans cet indice.'],
 ['⚖️ La répartition', 'Avec deux ETF, tu choisis la place des émergents. Leur poids dépend de tes versements et de l’évolution des deux placements.'],
 ['🔧 Le suivi', 'Un World seul peut se gérer avec une ligne. En ajoutant des émergents, tu dois aussi suivre la répartition et décider quand la rééquilibrer.'],
 ['📈 La performance', 'Le résultat dépend du poids des émergents et de leur performance. Ajouter des pays ne garantit pas que ton portefeuille rapportera davantage.'],
 ], 'Je regarde d’abord si je veux cette exposition supplémentaire, puis comment je vais la gérer dans la durée.'),
 'europe-zone': copy('Un ETF Europe peut investir au Royaume-Uni et en Suisse. Un ETF zone euro couvre d’autres pays.\n\nLe nom semble proche ; le contenu peut beaucoup changer', null, 'Je vérifie les pays de l’indice avant d’acheter. Le mot « Europe » dans le nom de l’ETF ne veut pas dire « zone euro ».'),
 'sp500-nasdaq': copy('S&P 500 et Nasdaq-100 : tu peux retrouver les mêmes grandes entreprises, mais pas dans les mêmes proportions.\n\nLes associer peut renforcer des positions que tu détiens déjà', null, 'Le Nasdaq-100 exclut les sociétés financières et dépend d’un univers de cotation particulier. Je regarde son contenu avant de l’ajouter à un autre ETF américain.'),
 'equal-weight': copy('Deux indices peuvent contenir les mêmes entreprises et répartir ton argent très différemment.\n\nAvec l’équipondération, chaque entreprise retrouve le même poids au rééquilibrage', null, 'Avec l’équipondération, les plus grandes sociétés prennent moins de place. Des rééquilibrages réguliers remettent les entreprises à poids égal.'),
 'index-adds': copy('Tu as déjà un ETF World et tu veux ajouter une ligne ?\n\nJe regarde ce qu’elle apporte réellement au portefeuille', [
 ['🇺🇸 Un S&P 500', 'Il renforce les grandes entreprises américaines, déjà présentes dans le World. Tu augmentes leur place dans ton portefeuille.'],
 ['💻 Un Nasdaq-100', 'Tu renforces certaines grandes entreprises déjà détenues. Je vérifie les entreprises en commun et leurs poids avant de l’ajouter.'],
 ['🌍 Des marchés émergents', 'Ils ajoutent une exposition directe à des marchés absents du World. Leur poids dans le portefeuille reste à choisir.'],
 ['🏢 Un World Small Cap', 'Il ajoute de petites entreprises des pays développés, absentes du MSCI World classique.'],
 ], 'Avant d’ajouter un ETF, je vérifie si je veux renforcer ce que je possède ou investir dans des entreprises que je ne détiens pas encore.'),
 'diversification': copy('Tu peux avoir cinq ETF et retrouver les mêmes entreprises dans plusieurs d’entre eux.\n\nPour savoir si tu diversifies vraiment, il faut regarder à l’intérieur', [
 ['🏢 Les entreprises en commun', 'Deux ETF différents peuvent détenir les mêmes actions. En les associant, tu augmentes leur place dans ton portefeuille.'],
 ['🌍 Les pays représentés', 'Ajouter un S&P 500 à un World renforce ton exposition aux États-Unis, déjà présents dans le World.'],
 ['💻 Le poids des secteurs', 'Avec un ETF tech en complément, tu peux donner encore plus de place à un secteur déjà important dans tes autres ETF.'],
 ['⚖️ La répartition de ton argent', 'Un ETF qui représente 5 % de ton portefeuille n’a pas le même effet qu’une ligne à 50 %.'],
 ], 'Avant d’ajouter un ETF, je regarde donc ce qu’il contient et ce qu’il change dans l’ensemble de mon portefeuille.'),
 'portfolio-case': copy('Tu vois un portefeuille d’ETF et tu te demandes s’il te conviendrait ?\n\nVoici les questions que je me poserais avant de le reprendre', [
 ['🎯 L’usage de cet argent', 'Quand en auras-tu besoin ? Quelle baisse pourrais-tu supporter ? Ces questions passent avant le choix des ETF.'],
 ['🧩 Le rôle de chaque ligne', 'Je cherche ce qui sert de base au portefeuille et ce qui apporte une exposition supplémentaire. Chaque ETF doit avoir une raison d’être là.'],
 ['🔎 Les entreprises en commun', 'Je compare les indices et les pays couverts. Les principales entreprises peuvent se retrouver dans plusieurs lignes.'],
 ['🔧 La gestion au quotidien', 'Je regarde comment effectuer les versements et quelle règle suivre pour rééquilibrer. Il faut pouvoir tenir cette organisation dans la durée.'],
 ], 'Un portefeuille présenté en exemple peut donner des idées. Je vérifie qu’il correspond à mon objectif avant de l’utiliser.'),
 'cap-dist': copy('Capitalisant ou distribuant : que deviennent les revenus de ton ETF ?\n\nRéinvestis dans le fonds ou versés sur ton compte, ils font partie de sa performance', null, 'Pour comparer les performances, je compte aussi les distributions. Un graphique de cours seul ne montre pas tout ce qu’un ETF distribuant a rapporté.'),
 'phys-synth': copy('Un ETF peut acheter les titres de son indice ou obtenir sa performance avec un contrat financier.\n\nVoici comment fonctionnent la réplication physique et la réplication synthétique', null, 'Je vérifie la méthode dans les documents du fonds et l’éligibilité PEA de la part exacte. La réplication seule ne permet pas de conclure.'),
 'hedge': copy('Ton ETF est coté en euros : est-il protégé contre les variations du dollar ?\n\nLa devise affichée à l’achat ne répond pas à cette question', null, 'Je distingue la devise utilisée pour acheter ma part des devises auxquelles les actifs du fonds m’exposent. Pour une couverture en euros, je vérifie la mention EUR Hedged et sa méthode.'),
 'dividend-options': copy('Deux ETF peuvent verser des revenus élevés sans les obtenir de la même façon.\n\nDividendes et vente d’options : regardons d’où vient l’argent distribué', null, 'Je compte les revenus reçus et la valeur du capital restant. Une grosse distribution ne suffit pas à dire que mon placement m’a beaucoup rapporté.'),
 'price-part': copy('Un ETF à 5 € est-il moins cher qu’un ETF à 500 € ?\n\nLe prix peut donner cette impression. Je t’explique ce qu’il permet vraiment de comparer', [
 ['💶 Le budget pour acheter une part', 'Pour une part entière, il te faut 5 € dans le premier cas et 500 € dans le second.\n\nAvec de petits versements, cette différence peut faciliter tes achats ou t’obliger à attendre.'],
 ['🏢 Le prix des entreprises détenues', 'Une part à 5 € ne signifie pas que les entreprises dans l’ETF sont bon marché.\n\nLe fonds découpe simplement sa valeur en un certain nombre de parts. Le prix affiché dépend aussi de ce découpage.'],
 ['📈 La performance de ton placement', 'Si tu investis 500 € et que l’ETF gagne 10 %, ton placement gagne 50 €.\n\nQue tu détiennes 100 parts à 5 € ou une part à 500 € ne change pas ce calcul.'],
 ['🔎 Les différences à regarder', 'Je compare l’indice suivi et les frais. Je vérifie aussi que la part est accessible dans l’enveloppe que j’utilise.'],
 ], 'Le prix de la part compte pour organiser mes achats, mais je ne m’en sers pas pour juger si un ETF est une bonne affaire.'),
 'gold-physical': copy('Une pièce d’or et un ETC or ne se détiennent pas de la même façon.\n\nStockage, frais, garanties : voici ce qui change pour toi', null, 'Pour un ETC, je lis comment le titre est adossé au métal et quelles garanties sont prévues. Je ne détiens pas une pièce chez moi, ni des actions de sociétés minières.'),
 'bonds-term': copy('Ton ETF obligataire affiche une année dans son nom. Cela garantit-il ce que tu récupéreras à la fin ?\n\nCette date décrit la durée prévue du fonds, pas une promesse de remboursement', null, 'La date indique quand le fonds prévoit de se terminer. Elle ne garantit pas le capital récupéré et ne supprime pas le risque de défaut des émetteurs.'),
 'livret-euro': copy('Livret A ou fonds euros pour garder une épargne disponible ?\n\nJe regarde aussi comment récupérer mon argent', null, 'Je vérifie le délai de rachat du contrat et les conditions de garantie. Pouvoir retirer son argent et pouvoir le récupérer immédiatement sont deux choses différentes.'),
 'euro-monetary': copy('Un fonds euros et un ETF monétaire peuvent sembler proches quand tu cherches de la stabilité.\n\nLa garantie du capital est pourtant une différence essentielle', null, 'Je vérifie qui garantit le capital et dans quelles conditions. Un ETF monétaire reste un placement sans garantie du capital, même si ses variations sont faibles.'),
 'pea-provider': copy('Deux établissements proposent un PEA, mais lequel correspond à tes achats ?\n\nVoici ce que je comparerais', [
 ['💶 Le coût de mes ordres', 'Je prends le montant que je compte investir et je consulte le barème pour cet achat. Le tarif mis en avant ne correspond pas forcément à mon usage.'],
 ['📋 Les frais du compte', 'Je vérifie les droits de garde et les frais d’inactivité. Je lis aussi les conditions qui permettent de les éviter.'],
 ['🔎 Les placements accessibles', 'Je recherche l’ETF exact et sa place de cotation. Un PEA ne donne pas automatiquement accès à tous les ETF éligibles.'],
 ['🤝 Les services', 'Je regarde comment effectuer mes versements et mes ordres, puis les conditions d’assistance et de transfert.'],
 ], 'Les règles fiscales du PEA restent les mêmes. Pour choisir, je compare des établissements précis et le coût de mes opérations.'),
 'multiple-av': copy('Ouvrir plusieurs assurances-vie : qu’est-ce que cela peut t’apporter ?\n\nFrais, assureurs et supports disponibles sont à comparer avant de multiplier les contrats', null, 'Je cherche ce que le contrat supplémentaire apporte réellement. Ouvrir plusieurs contrats ne multiplie pas l’abattement annuel sur les gains retirés.'),
 'before-etf': copy('Tu vas acheter ton premier ETF ?\n\nVoici ce que je vérifierais avant de passer l’ordre', [
 ['🏢 L’indice suivi', 'Je regarde quelles entreprises ou quels actifs je vais détenir. Le nom de l’ETF ne suffit pas toujours à comprendre son contenu.'],
 ['🔎 La bonne part', 'Je vérifie l’ISIN et l’enveloppe dans laquelle je peux l’acheter. Deux parts d’un même fonds peuvent avoir des caractéristiques différentes.'],
 ['💶 Les frais', 'Je consulte les frais annuels du fonds et le coût de mon ordre. Je regarde aussi l’écart entre le prix d’achat et le prix de vente, appelé spread.'],
 ['📉 Le risque', 'Je me demande si je pourrais supporter une baisse et laisser cet argent investi. La date à laquelle j’en aurai besoin compte dans ce choix.'],
 ], 'Avant d’acheter, je lis le document d’informations clés, le DIC. Si je ne comprends pas le produit, je prends le temps de l’étudier.'),
 'transfer-pea': copy('Tu veux déplacer ton PEA vers un autre établissement ?\n\nVoici les vérifications que je ferais pour préparer le transfert', [
 ['🔎 Les titres acceptés', 'Je demande au nouvel établissement s’il peut recevoir chacune de mes lignes. Je vérifie avec les ISIN pour éviter une confusion de part.'],
 ['⏳ Les opérations en cours', 'Des opérations non terminées peuvent retarder le transfert. Je consulte leur état avant de lancer la demande.'],
 ['💶 Le compte espèces', 'Je vérifie les frais éventuels et le montant nécessaire sur le compte espèces pour les régler.'],
 ['📁 La demande de transfert', 'Je demande le transfert du plan pour conserver son antériorité fiscale. Retirer l’argent puis ouvrir un autre PEA est une opération différente.'],
 ], 'Je prépare le transfert avec les deux établissements avant d’engager la démarche.'),
 'broker-fees': copy('Un courtier peut être peu cher pour un gros ordre et moins intéressant pour tes versements habituels.\n\nVoici les frais que je regarderais', [
 ['💶 Chaque achat ou vente', 'Je vérifie le minimum facturé et le pourcentage appliqué. Le barème peut aussi changer selon la place de cotation.'],
 ['💱 La conversion de devises', 'Si mon opération nécessite du change, je regarde son coût. Il peut s’ajouter aux frais de courtage affichés.'],
 ['📋 La vie du compte', 'Je consulte les frais de garde et d’inactivité, puis les éventuels abonnements. Je vérifie les conditions associées à chaque offre.'],
 ['🚪 Le départ', 'Je regarde le coût d’un transfert ou d’une clôture. Si un remboursement est proposé, je lis ses conditions.'],
 ], 'Pour comparer, je calcule le coût de mes opérations habituelles. Le prix d’un seul ordre ne raconte pas toute l’histoire.'),
 'choose-broker': copy('Tu veux investir 100 € par mois ? Le courtier doit aussi permettre les achats que tu prévois.\n\nVoici ce que je vérifierais', [
 ['💶 Le montant minimum', 'Je regarde le minimum d’ordre et le prix d’une part entière. Mon versement mensuel doit permettre l’achat prévu.'],
 ['🧾 Les frais pour cet achat', 'Je consulte le tarif d’un ordre de 100 €, avec ses conditions. Une offre sans courtage peut concerner certains produits ou certaines places seulement.'],
 ['🔎 L’ETF disponible', 'Je recherche la part exacte avec son ISIN. Le placement qui m’intéresse doit être accessible dans l’enveloppe choisie.'],
 ['🔧 Le fonctionnement', 'Je regarde comment effectuer le versement et si l’achat peut être programmé. Je vérifie aussi les documents fiscaux fournis.'],
 ], 'Je compare les offres avec mon montant mensuel et l’ETF que je veux acheter. Cela rend les différences beaucoup plus concrètes.'),
 'ifu': copy('Ton courtier t’a envoyé un IFU pour ta déclaration ?\n\nVoici ce que je vérifierais avant de valider', [
 ['📅 L’année et le titulaire', 'Je vérifie que le document concerne la bonne personne et l’année des revenus que je déclare.'],
 ['🧾 Les revenus et les gains', 'Je rapproche les montants de l’IFU avec les relevés du compte. Cela permet de repérer un écart à éclaircir.'],
 ['🔎 Les cases préremplies', 'Je compare les rubriques concernées avec le document. La présence d’un montant prérempli ne dispense pas de le vérifier.'],
 ['🌍 Les comptes à l’étranger', 'Je vérifie séparément les obligations de déclaration du compte. L’IFU ne couvre pas forcément cette démarche.'],
 ], 'L’IFU m’aide à déclarer, mais je garde la responsabilité de vérifier ma déclaration.'),
 'merger': copy('Ton ETF fusionne ou change d’indice : faut-il vendre ?\n\nAvant de décider, je lirais ces points dans l’avis officiel', [
 ['🏢 La nouvelle exposition', 'Je regarde l’indice qui sera suivi et les éventuels filtres. Les entreprises détenues et leurs poids peuvent changer.'],
 ['🔎 La part reçue', 'Je vérifie le nouvel ISIN et la politique de distribution. Je regarde aussi la méthode de réplication.'],
 ['📁 L’enveloppe', 'Je vérifie l’éligibilité de la part après l’opération. Le changement doit être compatible avec le compte dans lequel je la détiens.'],
 ['📅 Le calendrier', 'Je lis les dates et les modalités de l’opération. Une période de suspension peut être prévue.'],
 ], 'Je pars de l’avis de l’émetteur pour comprendre ce qui change. Un nouveau nom, à lui seul, ne suffit pas à décider.'),
 'same-world': copy('Deux ETF suivent le MSCI World. Comment les départager ?\n\nLe choix se joue aussi sur la part exacte et sur le coût de tes achats', null, 'Je vérifie la part exacte et le coût de mes achats. Les frais annuels du fonds comptent, mais ils ne résument pas à eux seuls le choix.'),
 'change-etf': copy('Un ETF moins cher vient de sortir. Est-ce que vendre le tien vaut le coût ?\n\nCalculons le temps nécessaire pour amortir la vente et le nouvel achat', null, 'Je compare l’économie attendue au coût de la vente et du nouvel achat. Sur CTO, la fiscalité d’une éventuelle plus-value doit aussi être examinée avant de décider.'),
 'where-savings': copy('Tu sais que tu auras bientôt besoin de ton épargne ?\n\nVoici ce que je regarderais avant de la placer', [
 ['📅 La date du projet', 'Je pars du moment où je devrai utiliser cet argent. Je prévois une marge pour ne pas dépendre d’un retrait au dernier moment.'],
 ['⏳ Le délai pour récupérer l’argent', 'Je vérifie les délais de retrait ou de vente, puis de règlement. La disponibilité doit correspondre à mon projet.'],
 ['🔒 La garantie', 'Je regarde ce qui est garanti et par qui. Je lis les limites et les conditions de cette garantie.'],
 ['💶 Le rendement réellement reçu', 'Je compare ce qui reste après les frais et les impôts. Je vérifie aussi les conditions annoncées pour obtenir le rendement.'],
 ], 'Pour cet argent, je veux éviter d’être obligé de vendre en perte au moment du projet. Une bonne performance passée ne suffit pas à me rassurer.'),
 'fees-euros': copy('Un écart de frais paraît petit en pourcentage. Combien représente-t-il en euros sur la durée ?\n\nCette simulation garde le même rendement supposé pour isoler leur effet', null, 'Je fais varier les frais en gardant le même rendement supposé. Cela permet de voir leur effet, sans prétendre prévoir la performance du placement.'),
 'delay-invest': copy('Que change le fait d’attendre avant d’investir une somme ?\n\nCette simulation compare les durées investies avec une même hypothèse de rendement', null, 'Le rendement est une hypothèse. Si les marchés baissent pendant l’attente, investir plus tard peut donner un meilleur résultat : ce calcul ne dit pas ce qui va se passer.'),
 'under-index': copy('Ton ETF affiche +8 %, mais tu vois +12 % pour son indice.\n\nAvant de penser qu’il suit mal, je vérifierais comment ces deux performances ont été calculées', [
 ['💱 La devise', 'Un indice affiché en dollars et un ETF mesuré en euros peuvent donner des résultats différents.\n\nLe taux de change peut creuser l’écart, même si l’ETF suit correctement son indice.'],
 ['💰 Les dividendes', 'Certains graphiques montrent uniquement l’évolution des cours. D’autres intègrent les dividendes réinvestis.\n\nPour comparer, je vérifie que les revenus sont traités de la même façon des deux côtés.'],
 ['📅 Les dates', 'Depuis le début de l’année, sur un an ou depuis ton achat : ce ne sont pas les mêmes périodes.\n\nJe prends les mêmes dates de départ et d’arrivée. L’heure de la dernière cotation peut aussi expliquer un petit décalage.'],
 ['🔍 Les frais et le suivi', 'Une fois ces points alignés, un écart peut encore rester.\n\nLes frais du fonds et sa manière de reproduire l’indice influencent sa performance.'],
 ], 'Je commence donc par vérifier que je compare bien la même chose. Sinon, je risque d’attribuer à l’ETF un écart qui vient simplement du graphique.'),
 'dividend-gain': copy('Ton ETF t’a versé un gros dividende. Combien t’a-t-il réellement rapporté ?\n\nVoici ce que je regarde pour faire le calcul', [
 ['💼 Le capital restant', 'Je regarde la valeur actuelle du placement. Recevoir une distribution n’empêche pas le cours de baisser.'],
 ['💰 Les revenus reçus', 'Je compte les distributions sur la période. Elles font partie du résultat, même si elles ne sont plus sur le compte.'],
 ['🧾 Les frais et les impôts', 'Ils réduisent ce que je conserve. Je les prends en compte pour regarder mon gain net.'],
 ['📈 La performance totale', 'Je regarde la valeur du placement et les revenus cumulés sur les mêmes dates. Cela permet de comparer avec un autre support.'],
 ], 'Le taux de distribution m’indique un revenu versé. Il ne suffit pas à mesurer le gain de mon placement.'),
 'personal-performance': copy('Ton ETF a monté, mais ton compte affiche un autre pourcentage ?\n\nLes dates et les montants de tes achats peuvent expliquer la différence', null, 'Je vérifie la période et la méthode utilisée par le courtier. Le rendement de mes versements et celui d’une part détenue sur toute la période ne mesurent pas la même chose.'),
 'tracking': copy('Deux ETF suivent le même indice, mais leurs performances diffèrent.\n\nVoici ce que je comparerais pour comprendre l’écart', [
 ['💱 La part et la devise', 'Je vérifie que les parts ont la même exposition et la même couverture contre le change. Je compare ensuite les rendements dans la même devise.'],
 ['💰 Les revenus', 'Je vérifie que les distributions sont prises en compte de la même façon. Une performance avec dividendes réinvestis ne se compare pas à un simple graphique de cours.'],
 ['🔧 La réplication', 'La fiscalité interne et la manière de reproduire l’indice influencent le résultat. Un éventuel prêt de titres peut aussi avoir un effet.'],
 ['🧾 Les frais et le suivi', 'Je regarde les frais annuels, puis la performance réellement obtenue face à l’indice. Les frais ne sont pas le seul élément qui explique l’écart.'],
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
  const values = sheet.columns.map((column, i) => `${column.split('\n')[0]} : ${String(row[i + 1]).replaceAll('\n', ' · ')}`)
  return `${title}\n\n${values.join('\n')}`
 })
}
