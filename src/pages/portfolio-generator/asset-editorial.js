import { MANUAL_SOURCE_ROUTES } from '../../data/portfolio-admissions.js'
// Rôles éditoriaux des supports de la banque commune. Les jumeaux d’exposition
// partagent un rôle ; un indice, un facteur ou un mécanisme différent a son propre texte.
// Aucun rendement, frais ou statut fiscal n’est recopié ici.
import { ASSETS } from '../../data/portfolio-assets.js';
const entries = {};
add('euro-ultrashort-ishares','bond','les obligations euro ultracourtes','Cette poche détient des obligations très courtes en euros. Elle reste exposée au crédit des entreprises et ne bénéficie pas de la garantie d’un dépôt bancaire.');
entries['euro-ultrashort-ishares'].description='Des obligations très courtes en euros, avec des revenus distribués.';
add('small-value-usa','us-small','les petites entreprises américaines value','Cette poche combine petites capitalisations et critères de valorisation. Elle renforce les États-Unis et peut s’écarter longtemps des grands indices.');
entries['small-value-usa'].description='De petites entreprises américaines repondérées selon leur valorisation.';
add('em-value-ishares','emerging','les marchés émergents value','Le filtre value change les entreprises et les secteurs retenus dans les marchés émergents. Il peut sous-performer durablement l’indice large.');
entries['em-value-ishares'].description='Une sélection value au sein des marchés émergents.';

add("world-midcap-equal",'theme',"moyennes capitalisations mondiales équipondérées","On fait une place aux moyennes entreprises des pays développés avec une pondération égale aux rééquilibrages. La taille et la pondération changent le comportement de cette poche par rapport au World.");
entries["world-midcap-equal"].description="Une exposition dédiée à moyennes capitalisations mondiales équipondérées.";
add("emu-core-ishares",'europe',"la zone euro (MSCI EMU)","On concentre une partie du portefeuille sur les grandes et moyennes entreprises de la zone euro, avec plus de deux cents valeurs. Cette poche partage la monnaie de l’épargnant mais reste exposée à quelques grands pays et aux baisses des marchés actions.");
entries["emu-core-ishares"].description="Les grandes et moyennes entreprises de la zone euro, part capitalisante.";
add("emu-small-cap-ishares",'small',"les petites capitalisations de la zone euro","On ajoute des petites entreprises de la zone euro, souvent plus sensibles aux cycles économiques et moins liquides. Cette poche complète une exposition européenne large ; ses frais sont plus élevés.");
entries["emu-small-cap-ishares"].description="Des petites entreprises de la zone euro, part capitalisante.";
add("euro-dividend-ishares",'dividend',"les dividendes de la zone euro","On sélectionne trente sociétés de la zone euro pour leur rendement du dividende. Les revenus sont distribués ; un rendement élevé peut refléter une baisse du cours, et le panier reste concentré sur quelques secteurs.");
entries["euro-dividend-ishares"].description="Trente valeurs de la zone euro choisies pour leur rendement du dividende.";
add("europe-value-ishares",'factor',"l’Europe Value","On retient des actions européennes à valorisation relativement faible. Ce facteur peut rester à l’écart des entreprises qui portent le marché pendant longtemps.");
entries["europe-value-ishares"].description="Un filtre value sur les actions européennes.";
add("europe-momentum-ishares",'factor',"l’Europe Momentum","On suit des actions européennes dont les cours ont récemment progressé. La sélection change fortement aux rééquilibrages et peut se retourner vite.");
entries["europe-momentum-ishares"].description="Un filtre momentum sur les actions européennes.";
add("europe-quality-ishares",'factor',"l’Europe Quality","On retient des actions européennes rentables, peu endettées et aux bénéfices stables, secteur par secteur. Ce filtre ne protège pas des baisses de marché.");
entries["europe-quality-ishares"].description="Un filtre qualité, neutre par secteur, sur les actions européennes.";
add("usa-quality-ishares",'factor',"les États-Unis Quality","On applique un filtre de qualité financière aux actions américaines. Les grandes valeurs restent très présentes et les performances sont publiées en dollars.");
entries["usa-quality-ishares"].description="Un filtre qualité sur les actions américaines.";
add("usa-value-ishares",'factor',"les États-Unis Value","On retient des actions américaines à valorisation relativement faible. Ce facteur alterne de longues périodes de retard et de rattrapage ; les performances sont publiées en dollars.");
entries["usa-value-ishares"].description="Un filtre value sur les actions américaines.";
add("usa-momentum-ishares",'factor',"les États-Unis Momentum","On suit des actions américaines en tendance haussière récente. La composition change fortement aux rééquilibrages ; les performances sont publiées en dollars.");
entries["usa-momentum-ishares"].description="Un filtre momentum sur les actions américaines.";
add("sp-smallcap-600-ishares",'us-small',"les petites entreprises américaines du S&P 600","On ajoute des petites entreprises américaines retenues avec un critère de bénéfices positifs. Cette poche renforce les États-Unis et peut s’écarter longtemps des grands indices.");
entries["sp-smallcap-600-ishares"].description="Les petites capitalisations américaines du S&P SmallCap 600.";
add("world-sri-ishares",'world-developed',"le World SRI","On garde une base mondiale développée en appliquant des exclusions et une sélection des entreprises les mieux notées de chaque secteur. Le panier est plus concentré que le World et les notations varient selon les fournisseurs.");
entries["world-sri-ishares"].description="Une sélection SRI des pays développés, part en euros capitalisante.";
add("electric-vehicles-ishares",'theme',"véhicules électriques et conduite autonome","On renforce les entreprises des véhicules électriques et des aides à la conduite : constructeurs, puces et batteries. Le thème est concentré et volatil ; il recoupe déjà des lignes des grands indices.");
entries["electric-vehicles-ishares"].description="Une exposition dédiée aux véhicules électriques et à la conduite autonome.";
add("ageing-population-ishares",'theme',"vieillissement de la population","On renforce les entreprises dont les revenus dépendent des personnes de 60 ans et plus : santé, assurance et loisirs. Une tendance démographique ne garantit pas un rendement, et le panier inclut des petites valeurs volatiles.");
entries["ageing-population-ishares"].description="Une exposition dédiée au vieillissement de la population.";
add("water-ishares",'theme',"eau","On renforce les entreprises du traitement, des équipements et des services liés à l’eau. On détient leurs actions ; leur rentabilité dépend aussi des coûts et des prix pratiqués.");
entries["water-ishares"].description="Une exposition dédiée à eau.";
add("agribusiness-ishares",'theme',"agriculture et agro-industrie","On renforce les entreprises de la chaîne agricole. Leurs actions ne suivent pas directement le prix du blé ou du maïs : les coûts, la météo et la demande comptent aussi.");
entries["agribusiness-ishares"].description="Une exposition dédiée à agriculture et agro-industrie.";
add("timber-ishares",'theme',"bois et exploitation forestière","On renforce les sociétés liées au bois et à l’exploitation forestière. On détient des actions cotées, dont le prix peut varier avec la construction et les coûts de production.");
entries["timber-ishares"].description="Une exposition dédiée à bois et exploitation forestière.";
add("world-staples",'theme',"consommation de base mondiale","On renforce les entreprises de consommation de base des pays développés. Leurs produits sont achetés régulièrement, mais leurs marges et leurs cours peuvent tout de même baisser.");
entries["world-staples"].description="Une exposition dédiée à consommation de base mondiale.";
add("world-discretionary",'theme',"consommation discrétionnaire mondiale","On renforce les entreprises dont les ventes dépendent des achats que les ménages peuvent repousser. Les revenus, le crédit et la confiance des consommateurs comptent pour cette poche.");
entries["world-discretionary"].description="Une exposition dédiée à consommation discrétionnaire mondiale.";
add("world-energy",'theme',"énergie mondiale","On renforce les entreprises énergétiques des pays développés. Leur rentabilité dépend du prix de l’énergie et de leurs coûts ; les actions ne reproduisent pas le cours du pétrole.");
entries["world-energy"].description="Une exposition dédiée à énergie mondiale.";
add("world-multifactor",'theme',"multifactoriel mondial","On combine plusieurs critères de sélection dans les actions des pays développés. Le fonds a changé d’indice pendant son histoire : les performances passées ne décrivent pas uniquement sa stratégie actuelle.");
entries["world-multifactor"].description="Une exposition dédiée à multifactoriel mondial.";
add("europe-food",'theme',"alimentation et boissons européennes","On renforce les fabricants européens de produits alimentaires et de boissons. Le prix des ingrédients et les volumes vendus comptent pour leurs bénéfices ; leurs actions restent exposées aux baisses.");
entries["europe-food"].description="Une exposition dédiée à alimentation et boissons européennes.";
add("europe-media",'theme',"médias européens","On renforce les entreprises européennes des médias. La publicité et les changements d’usage peuvent peser sur leurs résultats ; cette poche ne couvre pas tout le secteur de la communication.");
entries["europe-media"].description="Une exposition dédiée à médias européens.";
add("europe-retail",'theme',"distribution européenne","On renforce les entreprises européennes de distribution. Les dépenses des ménages, les stocks et les marges comptent pour leurs résultats ; certaines sont déjà présentes dans les indices larges.");
entries["europe-retail"].description="Une exposition dédiée à distribution européenne.";
add('world-eur-hedged','world-developed','le World couvert en euros','On suit les actions des pays développés avec une couverture des devises vers l’euro. Cette couverture modifie le risque de change et ses coûts ; elle ne protège pas des baisses des actions.');
entries['world-eur-hedged'].description='Des actions mondiales développées avec une couverture du change vers l’euro.';
add('euro-govt-5-7','bond','les obligations d’État euro de cinq à sept ans','On ajoute des obligations d’État en euros à maturité intermédiaire. Le fonds renouvelle ses titres : il reste sensible aux taux et ne prévoit pas de rembourser ton capital à une date fixe.');
entries['euro-govt-5-7'].description='Des obligations d’État euro de cinq à sept ans, avec des revenus distribués.';
add('europe-property','theme','l’immobilier coté européen hors Royaume-Uni','On renforce les actions de sociétés immobilières européennes hors Royaume-Uni. Les taux, les dettes et les loyers influencent leur valeur ; on ne détient pas directement les immeubles.');
entries['europe-property'].description='Des actions immobilières d’Europe développée, hors Royaume-Uni.';
add('europe-utilities','theme','les services publics européens','On renforce les exploitants européens de services publics. Leurs investissements, leurs dettes et la réglementation comptent autant que le besoin de leurs services.');
entries['europe-utilities'].description='Des actions européennes de services publics.';
add('europe-telecom','theme','les télécommunications européennes','On renforce les opérateurs européens de télécommunications. Les dépenses de réseaux, la concurrence et les dettes peuvent peser sur leur cours.');
entries['europe-telecom'].description='Des actions européennes du secteur des télécommunications.';
add('europe-construction','theme','la construction européenne','On renforce ici les entreprises européennes de construction et de matériaux. Leurs commandes et leurs coûts dépendent du cycle économique et immobilier ; cette poche peut recouper le World.');
entries['europe-construction'].description='Des actions européennes de construction et de matériaux.';
add('europe-banks','theme','les banques européennes','On cible ici les banques européennes. Les marges sur les crédits, les défauts et les exigences de capital influencent leurs résultats ; cette poche concentrée peut recouper un indice européen large.');
entries['europe-banks'].description='Des actions de banques européennes, avec des poids plafonnés dans l’indice.';
add('europe-insurance','theme','les assurances européennes','On cible ici les assureurs européens. Les sinistres, les prix des contrats et le rendement de leurs placements comptent pour leurs résultats ; cette poche concentrée peut recouper un indice européen large.');
entries['europe-insurance'].description='Des actions d’assureurs européens, avec des poids plafonnés dans l’indice.';
for (const n of [20,40,60,80]) {
 add(`lifestrategy${n}`,'multi-asset',`LifeStrategy ${n}/${100-n}`,`On réunit environ ${n} % d’actions mondiales et ${100-n} % d’obligations dans cette ligne. Vanguard gère le rééquilibrage interne ; les deux poches peuvent baisser en même temps.`);
 entries[`lifestrategy${n}`].description=`Un ETF multi-actifs avec une cible de ${n} % d’actions et ${100-n} % d’obligations.`;
}

add('utilities_world_dws','theme','les services publics mondiaux','On renforce ici les entreprises de services publics des pays développés. Leurs réseaux sont essentiels, mais les taux, les dettes et la réglementation restent des risques pour leurs actions.');
entries.utilities_world_dws.description='Des actions mondiales de sociétés de services publics.';
add('health_world_ishares','theme','la santé mondiale','On renforce ici des entreprises du secteur santé des pays développés. La sélection Advanced conserve ses filtres et ses plafonds ; cette poche peut recouper le World.');
entries.health_world_ishares.description = 'Des actions du secteur santé des pays développés, sélection Advanced.';
add('materials_world_dws','theme','les matériaux mondiaux','On renforce ici les entreprises du secteur matériaux. Leur rentabilité dépend notamment des coûts et du cycle économique ; leurs actions ne suivent pas directement le prix des matières premières.');
entries.materials_world_dws.description = 'Des actions mondiales du secteur matériaux.';
add('private_equity_ishares', 'theme', 'le private equity coté', 'On renforce ici des sociétés cotées liées au capital-investissement. Leurs participations et leur financement peuvent peser sur leur cours ; cette poche reste en actions et ne remplace pas un fonds non coté.');
entries.private_equity_ishares.description = 'Des actions de sociétés cotées liées au capital-investissement.';
add('gaming_vaneck', 'theme', 'les jeux vidéo et l’eSport', 'On renforce les entreprises du jeu vidéo avec une poche de conviction. Le panier est concentré et sensible aux succès commerciaux ; il ne remplace pas une base mondiale.');
add('medical_innovation_ishares', 'theme', 'l’innovation médicale', 'On cible des entreprises de l’innovation dans les soins. Les essais, autorisations et financements peuvent peser sur la poche ; ce choix ne couvre pas tout le secteur santé.');
// Chaque nouvelle exposition a un rôle distinct, sans changer les explications existantes.

function add(ids, kind, label, text) {
  if(!ids)return;

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

add("acwi_imi_spdr", "world-imi", "le monde avec les petites entreprises", "On réunit grandes, moyennes et petites entreprises des pays développés et émergents. Les poids suivent leur capitalisation : les géants restent dominants.");

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
add('em_pea_amundi', 'emerging', 'les marchés émergents filtrés dans le PEA', 'On fait une place aux grandes et moyennes entreprises émergentes avec des filtres ESG et de transition. Les pays et les titres peuvent peser différemment du MSCI Emerging Markets classique.');
add('europe_pea_amundi', 'europe', 'les actions européennes dans le PEA', 'On renforce les grandes et moyennes entreprises de plusieurs marchés européens. Certaines sont déjà dans un ETF mondial : cette ligne augmente alors leur poids.');
add('health_europe_pea', 'theme', 'la santé européenne', 'On renforce les entreprises européennes de la santé dans le PEA. Leurs résultats dépendent notamment des produits, des brevets et des dépenses de santé ; le secteur peut aussi baisser.');
add('tech_europe_pea', 'theme', 'la technologie européenne', 'On cible les entreprises technologiques européennes dans le PEA. Cette sélection reste concentrée et ne représente pas toute la technologie mondiale.');
add('industry_world_dws', 'theme', 'l’industrie mondiale', 'On renforce les entreprises industrielles des pays développés. Les commandes et les investissements de leurs clients comptent pour leurs résultats ; beaucoup figurent déjà dans le World.');
add('em_small_ishares', 'emerging', 'les petites entreprises des marchés émergents', 'On ajoute une poche de petites capitalisations émergentes. Elles ne sont pas incluses dans les indices limités aux grandes et moyennes entreprises, mais le sont déjà dans un indice IMI ; leur liquidité peut être plus faible.');

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

add('sp500_equal_weight', 'us-equal', 'le S&P 500 équipondéré', 'On garde les entreprises du S&P 500, mais on part du même poids pour chacune à chaque rééquilibrage. Les géants décident moins du résultat ; en contrepartie, on peut rester derrière le S&P 500 classique quand ils dominent.');
add('russell2000_spdr', 'us-small', 'les petites entreprises américaines', 'On donne ici une place aux petites entreprises américaines. Elles ne réagissent pas toujours comme les grandes : leur financement et les difficultés économiques peuvent peser davantage, même avec beaucoup de sociétés dans le fonds.');
add('world_ex_usa', 'world-ex-us', 'les marchés développés hors États-Unis', 'On fait une place aux grandes et moyennes entreprises des pays développés, en retirant les États-Unis. Cela permet de choisir leur poids à part ; on accepte aussi de rater leur avance lorsque le marché américain domine.');
add('pea_global_amundi', 'world-all', 'le monde en une ligne PEA', 'On réunit les entreprises des pays développés et émergents dans une seule ligne PEA. Leur poids suit celui de l’indice : moins de rééquilibrages à gérer soi-même, mais toujours les baisses des marchés actions à accepter.');
add('oblig_em_usd_ishares', 'em-bond', 'les coupons émergents en dollars', 'On prête ici à des emprunteurs émergents qui émettent en dollars. Les revenus sont distribués, mais le crédit, les taux et le change peuvent faire baisser la valeur du placement : les coupons ne garantissent pas le capital.');
add('oblig_eur_long_ishares', 'long-bond', 'les obligations longues en euros', 'On assume ici une forte sensibilité aux taux longs en euros. Cette poche peut profiter de leur baisse, mais elle peut aussi subir des pertes importantes lorsqu’ils remontent : ce n’est pas une réserve stable.');

add('topix_pea_hedged', 'country', 'les actions japonaises couvertes en euros', 'On suit ici les entreprises japonaises du TOPIX avec une couverture du yen vers l’euro. Cette couverture cherche à réduire l’effet du change, avec un coût et une efficacité imparfaite ; elle ne protège pas contre les baisses des actions japonaises.');
add('basic_resources_pea', 'theme', 'les producteurs européens de ressources', 'On choisit ici les entreprises européennes du secteur des ressources de base. On détient leurs actions, pas directement les matières premières : les prix des ressources, leurs coûts et le cycle économique influencent leurs résultats.');

const newDescriptions = {
 topix_pea_hedged: 'Les actions japonaises du TOPIX, avec couverture du yen vers l’euro.',
 basic_resources_pea: 'Les entreprises européennes des ressources de base, sélectionnées par STOXX.', 
 sp500_equal_weight: 'Les entreprises du S&P 500, équipondérées à chaque rééquilibrage.',
 russell2000_spdr: 'Les petites capitalisations américaines du Russell 2000.',
 world_ex_usa: 'Des actions des pays développés hors États-Unis.',
 pea_global_amundi: 'Les actions développées et émergentes, dans un ETF PEA.',
 oblig_em_usd_ishares: 'Des emprunts émergents en dollars, avec revenus distribués.',
 oblig_eur_long_ishares: 'Des emprunts d’État de longue durée en euros.',
};
for (const [id, description] of Object.entries(newDescriptions)) entries[id].description = description;
add('world-islamic', 'factor', 'le World Islamic', 'On suit ici les entreprises des pays développés qui respectent des filtres sectoriels et financiers de finance islamique. Les exclusions changent les secteurs et les poids ; cette sélection peut recouper un World classique.');
entries['world-islamic'].description='Des actions des pays développés sélectionnées selon des critères de finance islamique.';
add('small-value-europe', 'factor', 'les petites entreprises européennes value', 'On choisit ici de petites entreprises européennes avec une pondération orientée vers des valorisations relativement faibles. La taille et le filtre value peuvent produire des écarts durables avec un indice mondial large.');
entries['small-value-europe'].description='Des petites capitalisations européennes repondérées selon des critères de valorisation.';
for (const [id, label, underlying] of [
 ['etc-brent-crude-oil', 'le pétrole Brent', 'le pétrole Brent'],
 ['etc-wti-crude-oil', 'le pétrole WTI', 'le pétrole WTI'],
 ['etc-natural-gas', 'le gaz naturel américain', 'le gaz Henry Hub américain'],
 ['etc-coffee', 'le café', 'le café'],
 ['etc-cocoa', 'le cacao', 'le cacao'],
 ['etc-wheat', 'le blé', 'le blé'],
]) {
 add(id, 'commodity', label, `On s’expose ici à des contrats à terme sur ${underlying} à travers un ETC. Le renouvellement des contrats, les frais et le change influencent le rendement : cette ligne ne reproduit pas simplement le prix spot de la matière première.`);
 entries[id].description=`Un ETC suivant un indice de contrats à terme sur ${underlying}.`;
}

add("em_ex_china","emerging","les émergents hors Chine","Cette poche modifie volontairement la répartition des émergents. La Chine est exclue, mais les autres risques des marchés émergents restent présents.");
entries["em_ex_china"].description="Les actions émergentes en excluant la Chine.";
add("semiconducteurs_monde","theme","les semi-conducteurs mondiaux","On renforce un secteur déjà présent dans les indices larges. La demande, les investissements et les restrictions commerciales peuvent entraîner de fortes variations.");
entries["semiconducteurs_monde"].description="Les entreprises de la chaîne des semi-conducteurs.";
add("financieres_monde","theme","les financières mondiales","On renforce les banques, assurances et autres services financiers selon l’indice du fonds. Les taux et le coût du risque influencent leurs résultats.");
entries["financieres_monde"].description="Les sociétés financières des pays développés.";
add("blockchain_ishares","theme","les entreprises liées à la blockchain","Ce fonds détient des entreprises cotées, pas directement du Bitcoin. La concentration et la dépendance au marché des cryptomonnaies peuvent accentuer les baisses.");
entries["blockchain_ishares"].description="Des actions liées à la blockchain et aux cryptomonnaies.";

add('cloud-wisdomtree','theme','les logiciels et services du cloud','On renforce les entreprises du cloud. Leurs abonnements ne garantissent pas le rendement des actions : les dépenses des clients, la concurrence et le prix payé comptent aussi.');
entries['cloud-wisdomtree'].description='Les entreprises spécialisées dans les logiciels et services du cloud.';
add("ia-big-data-xtrackers","theme","l’intelligence artificielle et le big data","On renforce des entreprises liées à l’IA et aux données. Elles peuvent déjà figurer dans le World ; la croissance du thème ne garantit pas un bon prix d’achat.");
entries["ia-big-data-xtrackers"].description="Des actions liées à l’intelligence artificielle et au traitement des données.";
add("gold-miners-vaneck","theme","les sociétés minières aurifères","On détient des entreprises minières, pas de l’or physique. Leurs coûts, leurs dettes et leurs projets comptent aussi dans le rendement ; les baisses peuvent être fortes.");
entries["gold-miners-vaneck"].description="Les actions de sociétés minières aurifères.";
add("euro-dividend-aristocrats","dividend","les actions européennes à dividendes réguliers","On privilégie un historique de dividendes selon les règles de l’indice. Les distributions futures restent variables et ce filtre modifie les secteurs et les entreprises détenus.");
entries["euro-dividend-aristocrats"].description="Une sélection d’actions de la zone euro fondée sur les dividendes.";

add('health_world_dws','theme','la santé mondiale avec Xtrackers','Cette poche santé recoupe le World. Brevets, réglementation et dépenses de santé influencent ses résultats.');
entries.health_world_dws.description='Secteur santé du MSCI World.';
add('new_energy_amundi','theme','les nouvelles énergies','Ces actions des nouvelles énergies dépendent notamment des taux, du financement et des politiques publiques.');
entries.new_energy_amundi.description='Actions des nouvelles énergies.';

const available = ids=>ids.split(' ').filter(id=>ASSETS.some(a=>a.id===id)).join(' ');
add(available('copper-miners-globalx defense-vaneck nuclear-vaneck quantum-vaneck'),'theme','une conviction thématique','Cette poche détient des actions d’entreprises et peut renforcer des titres déjà présents dans le socle mondial.');
add(available('nasdaq-equal small-value-world-avantis'),'factor','une sélection ou pondération différente','Les règles de pondération ou de sélection modifient les entreprises détenues et leurs poids. Ces biais peuvent sous-performer longtemps.');
add(available('ibonds-euro-2028 ibonds-euro-2029'),'bond','des obligations euro à échéance définie','Une fin définie ne garantit ni le capital ni le rendement. Une vente anticipée reste exposée au marché.');
for (const asset of ASSETS.filter(a => a.instrumentType === 'EQUITY')) {
 add(asset.id, 'single-stock', asset.name, `On détient ici des actions de ${asset.name}. Le résultat dépend d’une seule entreprise, qui peut déjà être présente dans les ETF du portefeuille.`);
 entries[asset.id].description = `Actions de ${asset.name}.`;
}
for(const asset of ASSETS.filter(a=>a.automatedManual || a.annualManual)) {
 if((asset.annualManual && asset.cat==='matieres_premieres') || (MANUAL_SOURCE_ROUTES[asset.isin]?.category==='matieres_premieres' && asset.cat==='matieres_premieres')) {
  add(asset.id,'commodity',asset.name,commoditySourceExplanation(asset));
  entries[asset.id].description=asset.name;
  continue;
 }
 add(asset.id,'fund',asset.name,'Cette ligne suit la sélection et les règles propres au fonds. Sa place dans le portefeuille dépend de ses entreprises et de ses expositions, qui peuvent recouper les autres lignes.');
 entries[asset.id].description=asset.name;
}
export const ASSET_EDITORIAL = Object.freeze(entries);
export function commoditySourceExplanation(asset) {
 if(MANUAL_SOURCE_ROUTES[asset.isin]?.category==='matieres_premieres')return (asset.basis==='fund-nav'?'Les performances reposent sur la valeur liquidative de cet ETC. ':'')+'Il donne une exposition au cuivre'+(asset.underlyingMechanism?.kind==='commodity-swap'?' via un swap':'')+' ; les frais et le change influencent ses performances.'
 return 'Cette ligne suit un métal physique après les frais du produit ; elle ne verse pas de revenu.'
}
export function assetEditorial(asset) {
  // Selected records arrive after the initial light registry was evaluated.
  if(MANUAL_SOURCE_ROUTES[asset.isin]?.category==='matieres_premieres' && asset.cat==='matieres_premieres')return {kind:'commodity',label:asset.name,description:asset.name,text:commoditySourceExplanation(asset)}
  const entry = ASSET_EDITORIAL[asset.id];
  if (!entry && asset.manualOnly && asset.id.startsWith('manual-')) return {kind:'fund',label:asset.name,description:asset.name,text:'Cette ligne suit la sélection et les règles propres au fonds. Sa place dans le portefeuille dépend de ses entreprises et de ses expositions, qui peuvent recouper les autres lignes.'};
  if (!entry) throw new Error(`Explication de portefeuille manquante pour ${asset.id}`);
  return entry;
}
