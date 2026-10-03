// Rôles éditoriaux des supports de la banque commune. Les jumeaux d’exposition
// partagent un rôle ; un indice, un facteur ou un mécanisme différent a son propre texte.
// Aucun rendement, frais ou statut fiscal n’est recopié ici.
const entries = {};
function add(ids, kind, label, text) {
  for (const id of ids.split(" ")) entries[id] = { kind, label, text };
}

add("fonds_euros", "euros", "le fonds euros", "On lui fait une place pour ne pas exposer toute l’épargne aux secousses des marchés. En contrepartie, quand la Bourse s’envole, cette partie du portefeuille reste à l’écart. Les conditions de garantie restent celles du contrat.");
add("msci_world msci_world_ishares msci_world_amundi_pea", "world-developed", "le World", "C’est la poche qui mise sur les entreprises, dans plusieurs pays développés et secteurs. Elle évite de devoir choisir soi-même les prochaines gagnantes, mais il faudra accepter de la voir baisser quand la Bourse traverse une mauvaise période.");
add("msci_acwi msci_acwi_ishares", "world-all", "l’ACWI", "On réunit ici des entreprises des pays développés et émergents dans une seule ligne. C’est une façon de leur faire une place sans gérer deux fonds séparés, tout en acceptant les baisses des marchés actions.");
add("ftse_allworld_vanguard", "world-all", "l’All-World", "On choisit ici des actions des pays développés et émergents avec un seul fonds. L’idée est de garder une base mondiale simple ; cela ne veut pas dire que tous les pays y pèsent autant, ni qu’elle échappe aux baisses de la Bourse.");
add("sp500 sp500_ishares", "us", "le S&P 500", "On donne ici une place aux grandes entreprises américaines. Elles font des affaires partout dans le monde, mais ce choix reste centré sur le marché américain : il faudra aussi tenir quand celui-ci déçoit.");
add("nasdaq100 nasdaq100_ishares", "nasdaq", "le Nasdaq-100", "On fait davantage de place aux grandes entreprises non financières du Nasdaq, avec un poids important de la technologie. C’est une conviction plus marquée qu’un indice mondial large, qui peut se faire sentir quand ces entreprises sont délaissées.");
add("lqq", "leverage", "le Nasdaq à levier", "On pousse ici la conviction sur le Nasdaq avec un levier quotidien de deux. Les mouvements sont amplifiés, y compris quand ça baisse. Sur plusieurs années, il ne suffit pas de doubler le rendement du Nasdaq pour connaître celui de cette ligne.");
add("cl2", "leverage", "les actions américaines à levier", "On mise ici sur les actions américaines avec un levier quotidien de deux. Cela peut accélérer les gains comme les pertes. Le trajet suivi par les cours compte : sur plusieurs années, le résultat n’est pas simplement celui du MSCI USA multiplié par deux.");
add("cac40", "europe", "le CAC 40", "On fait ici une place aux grandes entreprises françaises. Beaucoup vendent bien au-delà de la France, mais on garde une sélection resserrée : ce fonds ne représente pas à lui seul toute l’économie française ni toute l’Europe.");
add("eurostoxx50 eurostoxx50_ishares", "europe", "l’Euro Stoxx 50", "On choisit ici les grandes entreprises de la zone euro. C’est une façon de leur donner du poids dans l’épargne, avec une sélection plus concentrée qu’un indice couvrant l’ensemble des marchés européens.");
add("msci_europe", "europe", "les actions européennes", "On donne une place aux entreprises de plusieurs marchés européens, au-delà de la seule zone euro. On évite ainsi de tout ramener aux actions françaises, sans faire disparaître le risque d’une mauvaise période pour l’Europe.");
add("msci_em", "emerging", "les marchés émergents", "On investit ici dans les marchés émergents, jusque dans leurs petites entreprises grâce à l’indice IMI. Cela élargit la poche actions, mais les crises locales et les décisions politiques peuvent rendre cette ligne difficile à garder.");
add("msci_em_amundi msci_em_spdr", "emerging", "les marchés émergents", "On fait une place aux grandes et moyennes entreprises des marchés émergents. Leurs perspectives attirent, mais la croissance d’un pays ne suffit pas à assurer de bons rendements en Bourse.");
add("ftse_em_vanguard", "emerging", "les marchés émergents", "On suit ici les marchés émergents retenus par FTSE. L’idée est d’aller au-delà des pays développés, en acceptant des marchés dont les entreprises, les règles et les monnaies peuvent évoluer très différemment.");
add("actions_india_ishares", "country", "les actions indiennes", "On choisit de donner une place particulière aux entreprises indiennes. C’est une conviction sur un pays, pas un panier de tous les marchés émergents. Même une économie en croissance peut décevoir en Bourse si les attentes sont déjà trop élevées.");
add("actions_japon", "country", "les actions japonaises", "On donne ici une place particulière aux entreprises japonaises. Leur marché a ses propres entreprises et sa monnaie ; lui faire une place ne garantit pas qu’il montera lorsque les autres marchés baissent.");
add("actions_coree", "country", "les actions coréennes", "On renforce ici les entreprises sud-coréennes, avec une présence importante des semi-conducteurs. C’est un pari plus précis sur ce marché, qui peut souffrir quand le cycle des puces se retourne.");
add("actions_taiwan", "country", "les actions taïwanaises", "On mise ici sur les entreprises taïwanaises, avec une forte place donnée aux semi-conducteurs. Le rôle de Taïwan dans les puces explique l’intérêt pour ce marché, mais concentre aussi la conviction sur un pays et une industrie.");
add("actions_asie_ex_japon", "region", "l’Asie hors Japon", "On fait une place à plusieurs marchés asiatiques en laissant le Japon de côté. Cela évite de choisir un seul pays de cette zone, mais les entreprises peuvent rester sensibles aux mêmes difficultés régionales.");
add("smallcap_monde", "small", "les petites capitalisations mondiales", "On fait ici une place aux petites entreprises des pays développés. Elles passent souvent derrière les géants dans les grands indices. On élargit ainsi la sélection, en acceptant une poche qui peut être plus chahutée.");
add("smallcap_europe", "small", "les petites capitalisations européennes", "On donne une place aux petites entreprises européennes, plutôt qu’aux seuls grands groupes. Cela change les sociétés auxquelles on confie son argent, mais ces entreprises peuvent aussi traverser des périodes difficiles et manquer de liquidité en Bourse.");
add("actions_value", "factor", "les actions value", "On privilégie ici des entreprises dont le prix paraît bas selon les critères de l’indice. L’idée est de ne pas payer trop cher ; le piège, c’est qu’une action bon marché peut le rester longtemps, ou avoir de bonnes raisons de l’être.");
add("world_minvol_ishares", "factor", "les actions à volatilité réduite", "On reste investi en actions, en cherchant une combinaison qui bouge moins selon le modèle de l’indice. Cela peut aider à supporter les secousses, mais ce fonds peut quand même baisser et rester derrière le marché quand celui-ci s’envole.");
add("world_quality_ishares", "factor", "les actions de qualité", "On privilégie ici des entreprises selon leur rentabilité, leur endettement et la régularité de leurs résultats. C’est un choix sur leur solidité financière, qui ne garantit ni un bon prix d’achat ni de meilleures performances à chaque période.");
add("world_momentum_ishares", "factor", "les actions momentum", "On fait ici davantage de place aux actions dont les cours ont récemment le mieux progressé. On suit la tendance plutôt que de chercher les moins chères. Quand les gagnantes changent brusquement, cette façon de sélectionner peut souffrir.");
add("bitcoin bitcoin_wisdomtree bitcoin_etcgroup bitcoin_21shares", "bitcoin", "Bitcoin", "On fait une place à Bitcoin via un produit coté. Même une petite ligne peut se faire sentir sur tout le portefeuille, tant ses mouvements sont forts. C’est une poche qu’il faut pouvoir garder sans paniquer à chaque chute.");
add("ethereum", "ethereum", "Ethereum", "On choisit ici Ethereum, dont le fonctionnement et les usages diffèrent de ceux de Bitcoin. Ce produit intègre aussi le staking. Il reste exposé aux fortes variations d’Ethereum : cela n’en fait pas une poche stable.");
add("or or_wisdomtree or_ishares or_amundi", "gold", "l’or", "On fait une place à un métal plutôt qu’aux bénéfices d’une entreprise ou aux intérêts d’une obligation. L’or ne verse pas de revenu : on compte sur son cours. Il peut évoluer différemment des actions, mais ne les protège pas à tous les coups.");
add("argent", "silver", "l’argent", "On ajoute ici de l’argent, un métal qui sert aussi à l’industrie. Son cours peut donc réagir à la fois à la demande de métal et à l’activité économique. Ce n’est pas simplement une deuxième ligne d’or.");
add("mp_large mp_large_icom", "commodities", "les matières premières", "On fait une place à plusieurs matières premières plutôt qu’à un seul métal. Leurs prix apportent autre chose que les bénéfices des entreprises, mais peuvent aussi chuter lorsque la demande ralentit. Le fonds utilise des contrats à terme : son parcours peut différer de celui des prix au comptant.");
add("monetaire_xeon", "money", "le fonds monétaire", "On cherche ici à suivre les taux courts en euros, sans prendre une exposition aux actions. Le revenu évolue avec ces taux : il peut diminuer lorsqu’ils baissent. Ce fonds utilise un swap et n’offre pas la garantie d’un dépôt bancaire.");
add("oblig_0_1_ishares", "short-bond", "les obligations de zéro à un an", "On choisit des emprunts d’État de la zone euro proches de leur remboursement. Leurs échéances courtes limitent les secousses liées aux taux, sans garantir le capital. Le fonds renouvelle ses obligations : il ne te rembourse pas tout à une date fixée.");
add("oblig_etat_eur_short", "short-bond", "les obligations de un à trois ans", "On prête ici aux États de la zone euro sur des échéances courtes. L’idée est de limiter la sensibilité aux mouvements de taux par rapport à des obligations longues, tout en acceptant que le cours du fonds varie.");
add("oblig_etat_eur", "bond", "les obligations d’État en euros", "On prête ici à des États de la zone euro. On ajoute ainsi une autre façon de placer son argent que les actions, mais le mot « État » ne rend pas le cours stable : une hausse des taux peut faire baisser cette ligne.");
add("oblig_etat_us", "bond", "les obligations d’État américaines", "On prête ici à l’État américain. C’est un autre choix que d’acheter ses entreprises, avec un résultat qui dépend notamment des taux et du dollar. Cette poche peut donc baisser même sans problème de remboursement de l’État.");
add("oblig_corp_ig oblig_corp_amundi oblig_corp_vanguard oblig_corp_spdr", "bond", "les obligations d’entreprises", "On prête ici à des entreprises jugées suffisamment solides selon les agences de notation. On cherche des intérêts plutôt que de participer directement à leurs bénéfices. Cela laisse quand même un risque de défaut et de baisse du cours quand les taux montent.");
add("oblig_hy oblig_hy_amundi oblig_hy_ishares_acc", "high-yield", "les obligations à haut rendement", "On accepte de prêter à des entreprises moins bien notées pour espérer davantage d’intérêts. Ce supplément ne tombe pas du ciel : les difficultés de remboursement peuvent augmenter lorsque l’économie se dégrade.");
add("oblig_inflation", "inflation", "les obligations indexées", "On cherche à faire une place à des obligations dont les paiements suivent l’inflation. Mais le fonds peut baisser même quand les prix grimpent : son cours dépend aussi des taux réels.");
add("oblig_global_agg_eur_hedged", "bond", "les obligations mondiales couvertes en euros", "On réunit ici des emprunts de plusieurs marchés et emprunteurs. La couverture vers l’euro cherche à limiter l’effet des devises. Elle ne supprime pas les baisses liées aux taux ou aux difficultés des emprunteurs.");
add("oblig_em_local_ishares_acc", "em-bond", "les obligations émergentes en monnaie locale", "On prête ici à des États émergents dans leurs monnaies locales. On ajoute donc le pari sur ces monnaies à celui sur les obligations. Cette poche peut être secouée par les changes et les difficultés locales, même si elle porte le mot « obligataire ».");
add("scpi", "property-private", "les SCPI", "On fait ici une place à l’immobilier non coté et aux loyers. Il faut pouvoir laisser cet argent investi : la revente peut prendre du temps. Les revenus comme la valeur des parts peuvent baisser.");
add("foncieres_etf foncieres_etf_dist", "property", "les foncières cotées", "On investit ici dans des sociétés immobilières cotées avec l’indice FTSE EPRA Nareit. On peut acheter et vendre le fonds en Bourse, mais on retrouve aussi ses secousses : les loyers ne suffisent pas à rendre les cours stables.");
add("immo_gpr", "property", "l’immobilier coté GPR", "On donne une place aux sociétés immobilières sélectionnées par l’indice GPR Global 100. Ce panier diffère de celui d’un fonds EPRA. Il garde toutefois les risques de l’immobilier coté, notamment les mouvements des taux et des marchés.");
add("immo_ishares_yield", "property", "les foncières sélectionnées pour leurs dividendes", "On choisit ici des sociétés immobilières cotées avec une sélection liée aux dividendes. Cela reste un achat d’actions immobilières : les versements peuvent diminuer et le cours peut baisser lorsque le financement se complique.");
add("strat_dividendes strat_dividendes_dist", "dividend", "les dividendes réguliers", "On privilégie ici des entreprises selon la régularité de leurs dividendes. C’est une façon de choisir les sociétés auxquelles on confie son argent, sans pouvoir exiger qu’elles maintiennent toujours leurs versements.");
add("high_dividend high_dividend_dist", "dividend", "les actions à dividendes élevés", "On fait ici davantage de place aux entreprises qui versent des dividendes élevés. Un gros dividende ne suffit pas à faire une bonne affaire : son montant peut être réduit, et le cours de l’action compte aussi dans le résultat.");
add("quality_dividend quality_dividend_dist", "dividend", "les dividendes et la qualité", "On cherche ici des dividendes en tenant aussi compte de la qualité financière des entreprises. L’idée est de regarder qui verse ce revenu, plutôt que son seul montant. Cela reste une sélection d’actions qui peut baisser.");
add("dividend_leaders", "dividend", "les leaders du dividende", "On privilégie ici des entreprises des marchés développés sélectionnées pour leurs dividendes et leur capacité à les maintenir. C’est une sélection précise, qui peut laisser de côté une partie du marché et ne garantit pas les prochains versements.");
add("dividend_aristocrats_us_spdr", "dividend", "les dividendes américains", "On choisit ici des entreprises américaines avec un historique de progression des dividendes. On mise sur cette régularité passée, tout en gardant à l’esprit qu’elle ne promet pas la même chose pour les années à venir.");
add("qyld_ucits", "options", "la stratégie avec options", "On cherche ici des distributions grâce à la vente d’options sur le Nasdaq-100. Le compromis est concret : on échange une partie de la hausse possible contre des primes. Cela ne supprime pas les baisses ni les variations des distributions.");

function theme(ids, label, aim, tradeoff) {
  add(ids, "theme", label, `${aim} ${tradeoff}`);
}
theme("sect_sante", "la santé américaine", "On mise ici sur les entreprises de santé du S&P 500, plutôt que sur tout le marché.", "Les besoins de soins expliquent l’intérêt pour ce secteur, mais les décisions sanitaires et les difficultés des entreprises peuvent quand même peser sur les cours.");
theme("sect_biotech_ishares", "les biotechnologies", "On fait une place aux entreprises de biotechnologie américaines et à leurs recherches.", "Un traitement prometteur peut échouer lors des essais ou ne pas obtenir d’autorisation : la réussite médicale n’est pas acquise à l’avance.");
theme("sect_energie", "l’énergie américaine", "On mise ici sur les entreprises d’énergie du S&P 500.", "Leurs résultats dépendent notamment des prix de l’énergie. On achète leurs actions, pas directement des barils de pétrole.");
theme("sect_energy_spdr", "l’énergie mondiale", "On fait une place aux entreprises du secteur de l’énergie dans plusieurs pays développés.", "Ce choix élargit les sociétés retenues, sans éviter les secousses communes lorsque les prix de l’énergie changent.");
theme("sect_tech", "la technologie américaine", "On donne ici davantage de place aux entreprises technologiques du S&P 500.", "Même de très bonnes entreprises peuvent décevoir en Bourse lorsqu’on les paie trop cher ou que leurs résultats ne suivent pas les attentes.");
theme("sect_tech_world_ishares", "la technologie mondiale", "On mise ici sur les entreprises technologiques des marchés développés, au-delà d’une sélection uniquement américaine.", "Les pays changent, mais la conviction reste concentrée sur un secteur qui peut traverser des périodes difficiles.");
theme("tech_europe", "la technologie européenne", "On choisit ici la technologie européenne plutôt que toute la Bourse européenne.", "C’est une conviction à la fois géographique et sectorielle : ajouter des entreprises de ce secteur ne diversifie pas automatiquement les difficultés qu’elles partagent.");
theme("sect_robotique", "la robotique", "On mise ici sur les entreprises liées à la robotique et à l’automatisation.", "La diffusion de ces technologies ne garantit pas que toutes les sociétés du fonds en profiteront, ni que leurs actions seront achetées au bon prix.");
theme("sect_ai_lg", "l’intelligence artificielle", "On fait une place aux entreprises liées à l’intelligence artificielle.", "On peut croire à ses usages tout en achetant des actions trop chères : le potentiel de la technologie et le rendement de l’investissement sont deux questions différentes.");
theme("sect_cybersecurite", "la sécurité numérique", "On choisit ici des entreprises liées à la sécurité numérique.", "Le besoin de protéger les systèmes explique le thème, mais la concurrence et le prix payé pour ces actions comptent autant pour l’investisseur.");
theme("sect_cyber_lg", "la cybersécurité", "On mise ici sur une sélection d’entreprises de cybersécurité.", "Le thème ressemble à celui d’autres fonds de sécurité numérique, mais leurs sociétés et leurs poids peuvent différer : deux noms proches ne donnent pas forcément le même résultat.");
theme("sect_energie_propre", "les énergies propres", "On donne une place aux entreprises liées à la transition vers les énergies propres.", "Le développement de ces énergies ne garantit pas leurs profits. Les taux, les financements et les décisions publiques peuvent peser lourd sur ces actions.");
theme("sect_batteries_lg", "les batteries", "On mise ici sur plusieurs étapes de la chaîne des batteries, plutôt que sur une seule marque.", "Leur usage peut progresser sans que toutes ces entreprises gagnent davantage : les coûts, la concurrence et les marges comptent aussi.");
theme("sect_water_amundi", "l’eau", "On investit ici dans des entreprises liées à l’eau et à sa gestion.", "Le besoin est essentiel, mais on achète des actions d’entreprises, pas une réserve d’eau. Leurs résultats et leur financement restent déterminants.");
theme("sect_luxury_amundi", "le luxe", "On donne ici une place particulière aux entreprises du luxe.", "La force de leurs marques attire, mais la demande des clients et les cycles de consommation peuvent rendre leurs résultats moins réguliers qu’on l’imagine.");
theme("sect_conso_defensive", "la consommation courante", "On choisit ici les entreprises américaines de biens de consommation courante.", "Leurs produits restent utiles en période difficile, mais le mot « défensif » ne garantit pas que leurs actions garderont leur valeur.");
theme("sect_utilities", "les services collectifs", "On fait une place aux entreprises américaines de services collectifs, comme les réseaux d’énergie.", "Leurs services sont nécessaires, mais leurs investissements, leur endettement et les règles publiques peuvent peser sur les cours.");
theme("sect_financieres", "les sociétés financières", "On mise ici sur les entreprises financières du S&P 500.", "Le crédit et les mouvements de taux peuvent les aider à certaines périodes, puis les fragiliser à d’autres. Cette ligne ne joue pas le rôle d’un dépôt bancaire.");
theme("infrastructure_ishares", "les infrastructures", "On investit ici dans des sociétés cotées liées aux infrastructures de plusieurs pays.", "On compte sur leur activité, mais l’utilité de leurs services ne rend pas leurs actions stables : les taux, les dettes et les décisions publiques restent importants.");

// L’identité courte reste distincte du rôle dans la composition. Elle remplace
// les anciennes descriptions longues ou absolues, sans toucher la banque commune.
const descriptions = {
  euros: "Un fonds euros au sein d’un contrat d’assurance-vie.",
  "world-developed": "Des actions de plusieurs pays développés.",
  "world-all": "Des actions des pays développés et émergents.",
  us: "Les grandes entreprises américaines du S&P 500.",
  nasdaq: "Les grandes entreprises non financières du Nasdaq-100.",
  leverage: "Une exposition aux actions avec un levier quotidien de deux.",
  emerging: "Une sélection d’actions des marchés émergents.",
  bitcoin: "Une exposition au cours de Bitcoin via un produit coté.",
  ethereum: "Une exposition à Ethereum avec staking via un produit coté.",
  gold: "Une exposition au cours de l’or via un produit coté.",
  silver: "Une exposition au cours de l’argent via un produit coté.",
  commodities: "Un panier de matières premières suivi via des contrats à terme.",
  money: "Une exposition aux taux courts en euros via un swap.",
  "high-yield": "Des obligations d’entreprises moins bien notées.",
  inflation: "Des obligations dont les paiements sont liés à l’inflation.",
  "em-bond": "Des emprunts d’États émergents dans leurs monnaies locales.",
  "property-private": "De l’immobilier non coté détenu à travers des SCPI.",
  options: "Des actions du Nasdaq-100 et une stratégie de vente d’options.",
};
for (const [id, entry] of Object.entries(entries)) {
  entry.description = descriptions[entry.kind] ?? `${entry.label[0].toUpperCase()}${entry.label.slice(1)}.`;
  if (entry.kind === "theme") entry.description = `Une sélection d’entreprises sur un thème : ${entry.label}.`;
  if (entry.kind === "factor") entry.description = `${entry.label[0].toUpperCase()}${entry.label.slice(1)}, sélectionnées selon les critères de l’indice.`;
  if (id === "oblig_0_1_ishares") entry.description = "Des emprunts d’État de la zone euro à échéance de zéro à un an.";
  if (id === "oblig_etat_eur_short") entry.description = "Des emprunts d’État de la zone euro à échéance de un à trois ans.";
}
export const ASSET_EDITORIAL = Object.freeze(entries);
export function assetEditorial(asset) {
  const entry = ASSET_EDITORIAL[asset.id];
  if (!entry) throw new Error(`Explication de portefeuille manquante pour ${asset.id}`);
  return entry;
}
