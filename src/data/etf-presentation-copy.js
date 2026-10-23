// Rédaction par exposition, revue du 23/10/2026. Aucun chiffre vivant ici.
// Les caractéristiques, cotations et photographies restent liées à l’ISIN dans leurs registres.
// Une même stratégie peut partager son explication ; jamais les données de deux parts.
const groups = [
  [['msci-world','support-msci_world','support-msci_world_ishares','presentation-ie00bfy0gt14','presentation-ie00bj0kdq92','presentation-ie00bk1pv551','presentation-ie0002xzsho1','presentation-ie00bd4txv59'], {
    hook: 'Un World rassemble plusieurs marchés, mais ne leur donne pas le même poids. Voici comment ton investissement se répartit 👇',
    whatIs: 'Le MSCI World couvre les grandes et moyennes entreprises des marchés développés, notamment les États-Unis, le Japon et les marchés européens. Les marchés émergents et les petites capitalisations restent en dehors.\n\nLes poids suivent la valeur en Bourse des actions disponibles à l’achat : les plus grands groupes occupent donc davantage de place.',
    whyInteresting: 'Cette exposition permet de suivre plusieurs économies et secteurs sans choisir les entreprises une par une. Les entrées, sorties et ajustements de poids sont gérés selon les règles de l’indice.',
    whatToKnow: 'La pondération concentre une partie du résultat sur les grandes entreprises américaines. Leurs difficultés peuvent peser sur tout le fonds, malgré le nombre de pays représentés. Les monnaies des marchés sous-jacents influencent aussi le résultat en euros lorsque la part ne les couvre pas.',
    question: 'Tu laisserais les capitalisations fixer le poids des pays ou tu choisirais une autre répartition ?',
  }],
  [['sp500','sp500-spea','support-sp500_ishares','presentation-ie00b3xxrp09','presentation-ie00bfmxxd54','presentation-ie000xzsv718','presentation-fr0011550185'], {
    hook: 'Le S&P 500 rassemble de grandes entreprises américaines, dont beaucoup vendent dans le monde entier. Voici l’exposition derrière cet ETF 👇',
    whatIs: 'L’indice sélectionne de grandes sociétés du marché américain, dans plusieurs secteurs. Il applique notamment des critères de taille, de liquidité et de bénéfices. Le poids de chaque société dépend de sa capitalisation disponible en Bourse.\n\nLe chiffre d’affaires international de ces groupes ne transforme pas l’indice en panier de marchés mondiaux.',
    whyInteresting: 'Une ligne permet de consacrer une place au marché des grandes entreprises américaines. Elle sert aussi à distinguer cette exposition de celle des petites entreprises ou des autres régions.',
    whatToKnow: 'Les plus grands groupes peuvent entraîner une part importante du résultat. Un recul de leurs bénéfices ou du prix que les investisseurs acceptent de payer peut peser sur le fonds. Pour une épargne en euros, le dollar ajoute un autre mouvement lorsque le change n’est pas couvert.',
    question: 'Quelle place les grandes entreprises américaines occupent-elles déjà dans tes autres fonds ?',
  }],
  [['nasdaq100','support-nasdaq100_ishares','presentation-ie000qdffk00'], {
    whatIs: 'Le Nasdaq-100 sélectionne de grandes entreprises non financières cotées au Nasdaq. Les poids reposent sur les capitalisations, avec des limites pour les plus grandes lignes.\n\nIl réunit notamment des logiciels, des puces, des plateformes et des activités de consommation. Une entreprise technologique cotée ailleurs n’y entre pas simplement parce qu’elle fait de la technologie.',
    whyInteresting: 'Cette ligne privilégie les entreprises retenues sur cette place de cotation, en donnant beaucoup de place aux activités numériques. Elle permet d’isoler cette exposition au sein d’un portefeuille plus large.',
    whatToKnow: 'Les grandes plateformes et entreprises technologiques partagent des risques : attentes élevées de croissance, concurrence et réglementation. Une déception peut toucher plusieurs lignes à la fois. Beaucoup figurent déjà dans les fonds World ou S&P 500.',
    question: 'Tu chercherais cette exposition à part après avoir regardé son poids dans ton World ?',
  }],
  [['eurostoxx50','support-eurostoxx50_ishares','presentation-fr0007054358','presentation-lu0380865021','presentation-ie0008471009','presentation-ie00b4k6b022'], {
    whatIs: 'L’EURO STOXX 50 retient de grandes entreprises de la zone euro dans plusieurs secteurs. Les poids dépendent des capitalisations disponibles en Bourse, avec un plafonnement. Le Royaume-Uni et la Suisse restent hors de ce périmètre.',
    whyInteresting: 'Cette ligne donne une place dédiée aux grandes entreprises de la zone euro. Elle permet de choisir leur poids séparément des autres marchés européens et mondiaux.',
    whatToKnow: 'Le panier est resserré : quelques entreprises et pays peuvent orienter une grande partie du résultat. Des groupes cotés en euros vendent et achètent aussi dans d’autres monnaies ; cela influence leurs bénéfices même sans change lors de ton ordre.',
    question: 'Pour l’Europe, tu préfères la zone euro ou un panier qui inclut aussi le Royaume-Uni et la Suisse ?',
  }],
  [['presentation-ie00b1yzsc51','presentation-ie00bkwq0q14','presentation-lu0274209237','pea-europe-amundi','support-msci_europe'], {
    whatIs: 'Le MSCI Europe couvre les grandes et moyennes entreprises des marchés développés européens. Il inclut notamment le Royaume-Uni et la Suisse, au-delà de la zone euro. Les poids suivent les capitalisations disponibles en Bourse.',
    whyInteresting: 'Il permet de régler séparément le poids des actions européennes, au lieu de conserver uniquement leur place dans un indice mondial. Cela change l’équilibre géographique sans sélectionner chaque entreprise.',
    whatToKnow: 'Le portefeuille reste exposé au cycle européen et aux secteurs les plus représentés. Une cotation en euros ne couvre pas la livre ou le franc suisse. Ajouter cette ligne à un World renforce aussi des entreprises déjà détenues.',
    question: 'Tu choisirais toi-même le poids de l’Europe ou tu garderais celui de ton indice mondial ?',
  }],
  [['presentation-lu0328475792','presentation-de0002635307','presentation-lu0908500753','presentation-fr0011550193'], {
    whatIs: 'Le STOXX Europe 600 rassemble des grandes, moyennes et petites entreprises de plusieurs marchés européens, dont le Royaume-Uni et la Suisse. Leur poids dépend de leur capitalisation disponible en Bourse, pas d’un partage égal entre pays.',
    whyInteresting: 'Cette exposition régionale inclut davantage de tailles d’entreprises qu’un panier limité aux grandes valeurs de la zone euro. Elle permet de suivre l’Europe cotée dans une seule ligne.',
    whatToKnow: 'Les entreprises partagent une sensibilité au cycle européen. Les plus grandes lignes influencent davantage le fonds que les petites et les variations des monnaies hors euro restent pertinentes pour une part non couverte.',
    question: 'Pour l’Europe, quelle importance donnes-tu à la présence des petites entreprises ?',
  }],
  [['msci-acwi','support-msci_acwi','pea_global_amundi','presentation-lu2903252349'], {
    whatIs: 'Le MSCI ACWI réunit les grandes et moyennes entreprises des marchés développés et émergents. Les poids suivent leurs capitalisations disponibles en Bourse : chaque pays ne reçoit pas la même part. Les petites capitalisations ne sont pas couvertes par cet indice.',
    whyInteresting: 'Les émergents font partie de la même ligne que les marchés développés. Il n’est donc pas nécessaire de gérer soi-même les proportions de deux fonds pour suivre cet univers.',
    whatToKnow: 'Les États-Unis et leurs grands groupes gardent beaucoup de poids. Les marchés émergents ajoutent des risques politiques, de réglementation et de change ; leur présence ne protège pas d’une baisse mondiale des actions.',
    question: 'Tu laisserais l’ACWI fixer le poids des émergents ou tu les suivrais dans une ligne séparée ?',
  }],
  [['ftse-all-world','presentation-ie000716yhj7','presentation-ie0000qlh0g6','presentation-ie00b3rbwm25','presentation-ie000l6zmmc4'], {
    whatIs: 'Le FTSE All-World couvre les grandes et moyennes entreprises des pays développés et émergents selon la classification FTSE. Les poids reposent sur les capitalisations disponibles en Bourse. Les petites entreprises restent en dehors de cet univers.',
    whyInteresting: 'Cette ligne réunit les deux ensembles de marchés sans avoir à ajuster soi-même un fonds développé et un fonds émergent. Les règles de l’indice font évoluer leur place dans le temps.',
    whatToKnow: 'Un univers mondial reste dominé par les grands marchés et leurs plus grosses sociétés. Un recul de ces groupes peut peser fortement, et les différentes monnaies influencent le résultat en euros. Un grand nombre de lignes n’égalise pas leurs poids.',
    question: 'Dans un fonds mondial, tu regardes d’abord les pays couverts ou leurs poids réels ?',
  }],
  [['presentation-ie0003xja0j9','presentation-ie0009hf1mk9'], {
    whatIs: 'L’indice Solactive GBS Global Markets Large & Mid Cap couvre les grandes et moyennes entreprises des marchés développés et émergents. Il les pondère par la capitalisation disponible en Bourse, selon la classification et les règles de Solactive.',
    whyInteresting: 'Tu réunis les marchés développés et émergents dans un seul fonds, sans gérer leur répartition séparément. Cette construction est une autre façon de suivre les actions mondiales que les indices MSCI ou FTSE.',
    whatToKnow: 'La couverture de nombreux pays laisse les grandes capitalisations peser davantage. Les marchés peuvent baisser ensemble et les monnaies sous-jacentes modifient le résultat en euros. Le nom « All Country » n’ajoute pas les petites entreprises.',
    question: 'Tu compares la composition des indices Solactive, MSCI et FTSE avant de choisir un fonds mondial ?',
  }],
  [['presentation-ie00bk5bqv03'], {
    whatIs: 'Le FTSE Developed couvre les grandes et moyennes entreprises des marchés développés selon FTSE. La pondération repose sur la capitalisation disponible en Bourse. La classification FTSE inclut la Corée du Sud parmi les marchés développés, contrairement à MSCI.',
    whyInteresting: 'Tu accèdes aux marchés développés avec une seule ligne. La classification de FTSE compte si tu associes ce fonds à une exposition émergente provenant d’un autre fournisseur.',
    whatToKnow: 'Un assemblage FTSE Developed et MSCI Emerging Markets peut compter deux fois la Corée du Sud. La pondération laisse aussi beaucoup de place aux plus grands groupes ; une large couverture géographique ne supprime pas leur influence.',
    question: 'Tu vérifies la classification des pays quand tu combines deux indices ?',
  }],
  [['presentation-ie00bk5bqx27','presentation-ie00b945vv12'], {
    whatIs: 'Le FTSE Developed Europe couvre les grandes et moyennes entreprises des marchés développés européens. Le Royaume-Uni et la Suisse sont inclus. Les capitalisations disponibles en Bourse déterminent les poids.',
    whyInteresting: 'Cette ligne permet de piloter la place de l’Europe dans un portefeuille mondial. Elle conserve un périmètre plus large que la seule zone euro.',
    whatToKnow: 'Le marché européen partage des risques économiques et sectoriels. Les devises non euro influencent une part non couverte, et les sociétés présentes peuvent déjà figurer dans tes autres fonds mondiaux.',
    question: 'Tu veux isoler l’Europe dans ton portefeuille ou la conserver dans ton fonds mondial ?',
  }],
  [['support-msci_em_amundi','support-msci_em_spdr','presentation-ie00btjrmp35'], {
    whatIs: 'Le MSCI Emerging Markets suit les grandes et moyennes entreprises des marchés classés émergents par MSCI, notamment en Asie et en Amérique latine. Les capitalisations disponibles en Bourse fixent les poids. La Corée du Sud fait partie de cet univers ; les petites entreprises en sont exclues.',
    whyInteresting: 'Cette exposition ajoute des marchés absents d’un MSCI World. Une ligne séparée permet d’en choisir le poids sans laisser un indice mondial le déterminer.',
    whatToKnow: 'Les principaux pays et groupes peuvent concentrer le résultat. Les décisions politiques, l’accès des investisseurs étrangers aux marchés et les monnaies locales peuvent affecter les cours et leur conversion en euros.',
    question: 'Pour les émergents, tu préfères choisir leur poids ou les inclure dans un fonds mondial ?',
  }],
  [['support-ftse_em_vanguard','presentation-ie00b3vvmm84'], {
    whatIs: 'Le FTSE Emerging suit de grandes et moyennes entreprises des marchés émergents selon FTSE. Le poids des actions dépend de leur capitalisation disponible en Bourse. La Corée du Sud est classée développée par FTSE et reste donc hors de cet indice.',
    whyInteresting: 'Cette ligne ajoute les marchés émergents à un portefeuille développé. Le fournisseur d’indice compte pour choisir une combinaison qui couvre les pays recherchés.',
    whatToKnow: 'Associer ce fonds à un MSCI World laisse la Corée du Sud en dehors des deux indices. Les premières places asiatiques et leurs grands groupes peuvent aussi peser lourd, avec des risques politiques et de change communs.',
    question: 'Tu avais regardé où se trouve la Corée du Sud dans tes indices ?',
  }],
  [['presentation-lu1681038672','russell2000_spdr'], {
    whatIs: 'Le Russell 2000 suit les petites entreprises du marché américain retenues dans l’univers Russell. Elles sont pondérées par leur capitalisation disponible en Bourse. Il couvre d’autres sociétés que les très grands groupes du S&P 500.',
    whyInteresting: 'Cette exposition ajoute une autre taille d’entreprise à une poche américaine. Leurs activités et leur financement donnent des moteurs de résultat différents de ceux des grandes multinationales.',
    whatToKnow: 'Les petites sociétés peuvent dépendre davantage du crédit et disposer de moins de moyens pour traverser un ralentissement. Leurs actions peuvent être moins faciles à négocier et beaucoup peuvent baisser ensemble lorsque le financement se durcit.',
    question: 'Tu ferais une place aux petites entreprises américaines à côté des grands groupes ?',
  }],
  [['support-smallcap_europe'], {
    whatIs: 'Le MSCI Europe Small Cap suit de petites entreprises des marchés développés européens, dont le Royaume-Uni et la Suisse. Les capitalisations disponibles en Bourse fixent les poids. Ce périmètre complète les grandes et moyennes entreprises d’un MSCI Europe.',
    whyInteresting: 'Tu accèdes à des sociétés peu présentes dans les grands indices européens. Cela élargit les tailles d’entreprises suivies, avec une seule ligne plutôt qu’une sélection d’actions individuelles.',
    whatToKnow: 'Des carnets d’ordres moins fournis peuvent accentuer les baisses quand les investisseurs vendent. Les petites sociétés sont aussi sensibles au crédit et à la demande locale. La cotation en euros ne couvre pas leurs autres devises.',
    question: 'Tu chercherais les petites entreprises en Europe ou dans un fonds mondial ?',
  }],
  [['support-cac40'], {
    whatIs: 'Le CAC 40 sélectionne de grandes sociétés cotées à Paris. Les poids suivent les capitalisations disponibles en Bourse, avec un plafond. Les ventes de ces groupes dépassent souvent la France, mais le panier reste celui d’un marché national.',
    whyInteresting: 'Cette ligne permet de consacrer un poids aux grandes entreprises cotées à Paris. Elle donne accès à leurs activités internationales sans devoir choisir chaque action.',
    whatToKnow: 'Quelques grands groupes et secteurs peuvent peser fortement. Leur présence internationale n’efface ni cette concentration ni leur sensibilité commune aux dépenses des clients, aux devises et au cycle économique.',
    question: 'Tu distingues le pays de cotation d’une entreprise et les pays où elle réalise ses ventes ?',
  }],
  [['support-lqq','support-cl2'], {
    whatIs: 'Le fonds vise deux fois la variation quotidienne de son indice actions grâce à des contrats financiers. Le levier est recalculé chaque jour : l’exposition du lendemain part de la nouvelle valeur du fonds.',
    whyInteresting: 'Le produit permet d’obtenir une exposition amplifiée sur une journée sans emprunter soi-même auprès du courtier. Cela répond à un usage différent d’un fonds sans levier ; ce mécanisme ne fixe pas le résultat sur plusieurs années.',
    whatToKnow: 'Le trajet des cours compte. Si l’indice gagne 10 % puis perd 10 %, il perd 1 % au total ; une exposition quotidienne doublée gagne 20 % puis perd 20 %, soit une perte de 4 % avant frais. Les coûts de financement s’ajoutent à cet effet et les pertes sont amplifiées.',
  }],
  [['support-oblig_corp_amundi','support-oblig_corp_vanguard','support-oblig_corp_spdr','corp-bond-ig'], {
    whatIs: 'Le fonds suit des obligations d’entreprises libellées en euros de catégorie investment grade : des emprunteurs considérés relativement solides par les agences de notation. Les échéances et émetteurs sont multiples. Cette notation peut évoluer et ne garantit pas le remboursement.',
    whyInteresting: 'Une ligne permet de prêter à plusieurs entreprises sans acheter chaque obligation. Le résultat vient des intérêts et des mouvements du prix des emprunts, avec des moteurs différents de ceux des actions de ces sociétés.',
    whatToKnow: 'Quand les taux montent, les obligations déjà émises perdent généralement de la valeur. Une dégradation des emprunteurs peut aussi faire baisser leur prix. Le fonds renouvelle ses prêts : il ne promet pas de rembourser ta part à une date choisie.',
    question: 'Pour une obligation d’entreprise, tu regardes d’abord la notation ou la sensibilité aux taux ?',
  }],
  [['support-oblig_etat_us'], {
    whatIs: 'Le fonds suit les emprunts du Trésor américain libellés en dollars, à travers des échéances différentes. Tu prêtes à l’État américain ; tu ne détiens pas les actions de ses entreprises.',
    whyInteresting: 'Cette ligne donne accès au marché des emprunts du Trésor sans acheter chaque émission. Elle permet de distinguer une exposition aux taux américains d’une exposition à la Bourse américaine.',
    whatToKnow: 'Une hausse des taux fait généralement baisser le prix des obligations existantes, surtout celles dont les paiements sont lointains. Pour une épargne en euros, une baisse du dollar peut aussi effacer les intérêts reçus si la part n’est pas couverte.',
    question: 'Pour des obligations américaines, quelle place accordes-tu au risque de change ?',
  }],
  [['support-oblig_etat_eur_short'], {
    whatIs: 'Le fonds suit des emprunts d’État de la zone euro dont la durée restante est comprise entre un et trois ans. Les obligations sortent de cette tranche à mesure que leur remboursement approche et sont remplacées.',
    whyInteresting: 'Les échéances courtes réduisent la sensibilité aux taux par rapport aux emprunts longs. Elles permettent de choisir ce niveau de sensibilité sans gérer les renouvellements de chaque obligation.',
    whatToKnow: 'La part n’a pas une date de remboursement fixe et sa valeur peut baisser. Le risque des États reste présent. Quand les taux baissent, les nouveaux emprunts rapportent généralement moins : les revenus du fonds s’ajustent progressivement.',
    question: 'Tu choisirais une durée courte pour limiter les mouvements de prix ou une durée plus longue ?',
  }],
  [['support-oblig_hy_amundi','high-yield','high-yield-acc'], {
    whatIs: 'Le fonds suit des obligations d’entreprises en euros de catégorie spéculative, souvent appelée high yield. Les taux d’intérêt plus élevés rémunèrent notamment un risque de remboursement supérieur à celui des emprunteurs investment grade.',
    whyInteresting: 'Cette ligne permet d’accéder au crédit plus risqué sans dépendre d’un seul emprunteur. Elle donne une exposition aux intérêts et aux conditions de financement des entreprises, distincte d’une poche d’emprunts d’État.',
    whatToKnow: 'Lors d’un ralentissement, les défauts peuvent augmenter et les investisseurs exiger davantage d’intérêts pour prêter. Le prix des obligations déjà détenues baisse alors. Les coupons peuvent ne pas compenser ces pertes, et le fonds peut reculer en même temps que les actions.',
    question: 'Tu regarderais le supplément d’intérêts ou la capacité des emprunteurs à traverser une crise ?',
  }],
  [['support-actions_japon'], {
    whatIs: 'Le MSCI Japan IMI couvre les grandes, moyennes et petites entreprises japonaises. Les capitalisations disponibles en Bourse déterminent leur poids. Il va plus loin dans les petites tailles que le MSCI Japan classique.',
    whyInteresting: 'Cette ligne permet de fixer séparément le poids du Japon tout en incluant plusieurs tailles d’entreprises. Elle se distingue ainsi d’un panier limité aux grandes valeurs japonaises.',
    whatToKnow: 'Le portefeuille reste lié à un pays et au yen. Les exportateurs peuvent être affectés par la demande mondiale et les variations de la monnaie. Une cotation en euros ne neutralise pas ces effets.',
    question: 'Pour le Japon, quelle importance donnes-tu à l’inclusion des petites entreprises ?',
  }],
  [['support-actions_coree'], {
    whatIs: 'Le MSCI Korea 20/35 couvre les grandes et moyennes entreprises sud-coréennes. Il pondère par les capitalisations disponibles en Bourse, avec des limites de poids. Les fabricants de puces et les grands groupes industriels occupent une place importante dans ce marché.',
    whyInteresting: 'Tu choisis le poids de la Corée du Sud séparément d’un panier asiatique ou émergent. Cette ligne donne accès à ses entreprises sans devoir choisir une action ou une catégorie de titres.',
    whatToKnow: 'Les grandes lignes et le cycle des semi-conducteurs peuvent orienter le fonds ensemble. Les exportations, le won et les tensions géopolitiques ajoutent des risques. Les plafonds de l’indice ne donnent pas le même poids à chaque entreprise.',
    question: 'Tu veux isoler la Corée du Sud ou la garder dans une exposition plus large ?',
  }],
  [['support-actions_taiwan'], {
    whatIs: 'Le MSCI Taiwan 20/35 suit les grandes et moyennes entreprises taïwanaises, avec des limites sur les poids des principales lignes. Les fabricants de semi-conducteurs et leurs fournisseurs sont très présents dans ce marché.',
    whyInteresting: 'Cette exposition donne une place spécifique à Taïwan et à sa chaîne industrielle. Elle permet d’en choisir le poids indépendamment du reste des marchés émergents.',
    whatToKnow: 'La concentration sur les puces relie beaucoup d’entreprises aux mêmes commandes et investissements. Les tensions autour de Taïwan peuvent aussi affecter les cours et l’accès au marché. La monnaie locale ajoute un risque pour une épargne en euros.',
    question: 'Pour les semi-conducteurs, tu choisirais un marché national ou un panier de fabricants mondiaux ?',
  }],
  [['support-actions_asie_ex_japon'], {
    whatIs: 'Le MSCI AC Far East ex Japan couvre de grandes et moyennes entreprises de marchés développés et émergents d’Extrême-Orient, en excluant le Japon. Les poids suivent les capitalisations disponibles en Bourse. Ce périmètre ne représente pas toute l’Asie : l’Inde en est notamment absente.',
    whyInteresting: 'Tu réunis plusieurs marchés de la région sans gérer une ligne par pays. L’exclusion du Japon permet de choisir séparément sa place dans le portefeuille.',
    whatToKnow: 'Les premières places et entreprises peuvent concentrer le résultat. Les chaînes de production régionales partagent les risques du commerce et des tensions géopolitiques ; plusieurs pays ne signifient pas plusieurs moteurs indépendants.',
    question: 'Tu distingues une exposition à l’Extrême-Orient d’un fonds couvrant toute l’Asie ?',
  }],
  [['blockchain'], {
    hook: 'Derrière les cryptomonnaies, il y a aussi des entreprises : plateformes d’échange, mineurs et fournisseurs de technologies. Cet ETF donne accès à cet écosystème 👇',
    whatIs: 'Le fonds suit le NYSE FactSet Global Blockchain Technologies Capped. Il sélectionne des actions d’entreprises liées aux technologies blockchain.\n\nLeurs métiers diffèrent : faciliter les échanges de cryptomonnaies, participer au fonctionnement des réseaux ou fournir des technologies. Tu détiens leurs actions, pas directement du bitcoin.',
    whyInteresting: 'Cette ligne permet d’investir dans les entreprises qui développent et font fonctionner cet écosystème. Leurs revenus peuvent dépendre de l’adoption des technologies, des volumes échangés ou de la vente de leurs équipements et services.',
    whatToKnow: 'Plusieurs entreprises peuvent partager le même moteur : une baisse du marché crypto peut toucher une grande partie du panier en même temps. La concurrence, la réglementation et les coûts de l’énergie pour les mineurs s’ajoutent à ce cycle. Le fonds peut donc subir de fortes baisses sans détenir directement de bitcoin.',
    question: 'Tu préférerais acheter du bitcoin ou investir dans les entreprises de son écosystème ?',
  }],
]

export const REVIEWED_EXPOSURE_COPY = Object.fromEntries(groups.flatMap(([ids,copy]) => ids.map(id => [id,copy])))

// Métiers et mécanismes propres aux sélections sectorielles ; le benchmark exact
// et les poids datés sont ajoutés par le rendu depuis les registres canoniques.
const sectors = [
  [['support-sect_sante','history-etf_health','world-healthcare-xtrackers','pea-health-europe'],
    'La santé réunit des laboratoires, mais aussi des équipements et des services. Quels métiers cet ETF retient-il ? 👇',
    'Tu suis les entreprises du secteur santé de l’univers défini par l’indice : médicaments, équipements médicaux et services de soins selon les sociétés retenues. Ce périmètre est plus large que les seules biotechnologies.',
    'Une ligne sectorielle permet de donner une place aux dépenses de santé au-delà de leur poids dans un indice large. Les modèles des laboratoires et des fournisseurs d’équipements diffèrent : tous ne dépendent pas du même traitement.',
    'La fin d’un brevet, un essai clinique décevant ou une baisse des prix autorisés peuvent réduire les bénéfices. Les entreprises partagent aussi les décisions des autorités de santé. Une demande de soins régulière ne stabilise pas les cours.',
    'Pour la santé, tu préfères plusieurs métiers ou une sélection centrée sur les nouveaux traitements ?'],
  [['support-sect_energie','world-energy','energie'],
    'Un ETF énergie achète des entreprises, pas des barils. Leurs coûts et leurs marges comptent aussi 👇',
    'Tu suis des actions du secteur énergie, notamment les producteurs de pétrole et de gaz et les services liés à leur exploitation. Leur périmètre géographique et leurs poids dépendent de l’indice suivi.',
    'Cette ligne donne accès aux bénéfices des entreprises énergétiques. Elle permet de distinguer ce choix d’un produit qui suit directement des contrats sur le pétrole.',
    'Une baisse du pétrole ou du gaz réduit les revenus de nombreux producteurs alors que leurs coûts ne baissent pas forcément. Les investissements lourds, les accidents et les décisions publiques peuvent accentuer les pertes.',
    'Pour l’énergie, tu cherches le prix des ressources ou les résultats des entreprises qui les exploitent ?'],
  [['support-sect_tech','technologie','support-tech_europe','pea-tech-europe','presentation-de000a0h08q4'],
    'Les logiciels et les puces n’ont pas le même modèle économique. Voici la sélection technologique de cet ETF 👇',
    'Tu suis des entreprises classées dans la technologie de l’univers de l’indice : logiciels, semi-conducteurs, équipements et services informatiques selon les sociétés retenues. Les plateformes de publicité ou de commerce en ligne peuvent être classées dans d’autres secteurs.',
    'Cette ligne permet de privilégier ces métiers plutôt que l’ensemble d’un marché. Elle isole une exposition qui peut déjà figurer dans un World, sans supposer que toute entreprise numérique appartient au secteur technologique.',
    'Les attentes de croissance peuvent être élevées dans les cours. Un ralentissement des commandes, une rupture technologique ou des restrictions commerciales peuvent toucher plusieurs lignes ensemble. Les premières positions peuvent dominer le résultat.',
    'Quand tu dis « technologie », tu penses aux logiciels, aux puces ou aux grandes plateformes ?'],
  [['support-sect_conso_defensive','world-staples'],
    'Les produits du quotidien restent achetés en période difficile. Les actions de leurs fabricants peuvent pourtant baisser 👇',
    'Tu suis les entreprises de consommation de base de l’univers de l’indice : alimentation, boissons, hygiène et distribution de produits courants selon les sociétés retenues. Il s’agit d’actions, avec des poids différents.',
    'Ces activités reposent sur des achats récurrents des ménages. Cette exposition permet de privilégier ce type de demande par rapport aux dépenses plus faciles à reporter.',
    'Une hausse des matières premières ou des salaires peut réduire les marges si les prix de vente ne suivent pas. Les marques peuvent perdre des clients et une valorisation élevée peut amplifier une déception. « Défensif » ne garantit pas la valeur des parts.',
    'Tu regarderais la régularité des ventes ou le prix payé pour ces entreprises ?'],
  [['support-sect_utilities','europe-utilities','world-utilities-dws'],
    'Les réseaux d’électricité, de gaz ou d’eau demandent beaucoup d’investissements. Cet ETF permet de suivre leurs exploitants cotés 👇',
    'Tu suis des entreprises de services collectifs de l’univers de l’indice : production, distribution et exploitation de réseaux selon les lignes retenues. Tu achètes leurs actions, pas une créance garantie par les factures des clients.',
    'Cette poche donne accès à des activités de réseaux et à leurs revenus encadrés par des contrats ou la réglementation. Elle permet de les distinguer des producteurs de pétrole et des fournisseurs d’équipements.',
    'Ces entreprises financent souvent des investissements importants par la dette. Une hausse des taux renchérit ce financement et les tarifs autorisés peuvent ne pas compenser les coûts. Les décisions du régulateur peuvent affecter plusieurs sociétés à la fois.',
    'Pour les services collectifs, tu regardes surtout les revenus réguliers ou les besoins de financement ?'],
  [['support-sect_financieres','financieres'],
    'La finance ne se limite pas aux banques. Voici les activités auxquelles cet ETF donne accès 👇',
    'Tu suis des entreprises financières de l’univers de l’indice : banques, assurances, gestion d’actifs et autres services financiers selon les sociétés retenues. Leurs revenus ne viennent donc pas tous des mêmes opérations.',
    'Cette ligne permet de donner une place aux métiers du crédit, de l’assurance et des marchés. Elle isole une exposition différente de celle d’un ETF composé uniquement de banques.',
    'Un ralentissement peut augmenter les impayés, réduire les commissions et déprécier les placements. Les mouvements de taux n’aident pas tous les métiers de la même façon. Une crise de confiance peut se propager entre établissements.',
    'Pour la finance, tu choisirais les seules banques ou plusieurs métiers du secteur ?'],
  [['world-industrials','world-industrials-xtrackers'],
    'Machines, transports et équipements : l’industrie cotée rassemble plusieurs métiers 👇',
    'Tu suis les entreprises industrielles des pays développés retenues par l’indice. Le secteur inclut notamment des biens d’équipement, des transports et des services aux entreprises, selon sa classification.',
    'Cette exposition permet de suivre les dépenses d’équipement et les échanges économiques à travers plusieurs fournisseurs. Elle se distingue des fabricants de matières premières utilisés par ces industries.',
    'Quand les clients reportent leurs investissements, les commandes peuvent reculer dans plusieurs métiers en même temps. Les coûts de production, les chaînes d’approvisionnement et le financement des grands projets peuvent peser sur les marges.',
    'Pour l’industrie, tu regardes les carnets de commandes ou les marges des entreprises ?'],
  [['world-materials','world-materials-dws','presentation-lu1834983634'],
    'Un ETF matériaux suit des entreprises. Il ne reproduit pas directement le prix des métaux 👇',
    'Tu suis les entreprises du secteur matériaux de l’univers de l’indice. Selon les sociétés retenues, il comprend notamment chimie, mines, emballages et matériaux de construction.',
    'Tu accèdes aux activités de transformation et de production qui alimentent les autres industries. Leurs bénéfices dépendent de leurs prix de vente et de leurs coûts, ce qui distingue cette poche d’une détention directe de matières premières.',
    'Une baisse de la demande industrielle peut réduire les volumes et les prix alors que certaines charges restent fixes. L’énergie, la réglementation environnementale et les dépenses d’investissement peuvent accentuer ce mouvement.',
    'Pour les ressources, tu préfères suivre leur prix ou les marges de ceux qui les produisent ?'],
]
for (const [ids,hook,whatIs,whyInteresting,whatToKnow,question] of sectors) {
  for (const id of ids) REVIEWED_EXPOSURE_COPY[id] = {hook,whatIs,whyInteresting,whatToKnow,question}
}

Object.assign(REVIEWED_EXPOSURE_COPY, {
  'presentation-fr0011869304': {
    whatIs: 'Le FTSE EPRA/NAREIT Developed Europe suit des sociétés immobilières cotées de marchés développés européens. Leurs actifs peuvent être des bureaux, des commerces, des logements ou d’autres immeubles selon les entreprises sélectionnées. Tu achètes leurs actions à travers le fonds.',
    whyInteresting: 'Cette ligne donne accès à l’immobilier coté européen sans acheter et gérer soi-même un bâtiment. Elle permet de choisir cette région séparément des foncières mondiales.',
    whatToKnow: 'Les taux peuvent renchérir la dette et réduire la valeur des immeubles. Les loyers et le taux d’occupation comptent aussi. Comme les parts sont cotées, leur prix peut baisser rapidement même si les immeubles continuent de générer des loyers.',
  },
  'presentation-lu1829219390': {
    whatIs: 'L’EURO STOXX Banks retient les banques de la zone euro. Tu retrouves leurs activités de crédit, de dépôts et de services financiers, selon le modèle de chaque établissement. Les poids suivent les règles de l’indice, pas un partage égal entre banques.',
    whyInteresting: 'Cette exposition cible le métier bancaire de la zone euro au lieu de l’ensemble de la finance. Elle permet d’en choisir le poids séparément des assurances et des autres secteurs.',
    whatToKnow: 'Une baisse de la qualité des crédits provoque des pertes. Les taux influencent les marges mais aussi le coût des dépôts et les remboursements. Des problèmes de liquidité ou de confiance peuvent toucher plusieurs banques ensemble.',
  },
  'presentation-fr0013346681': {
    whatIs: 'Le fonds reçoit par un swap la performance du Solactive ESTR Overnight Total Return, lié au taux au jour le jour en euros. Un swap est un contrat d’échange de performances : le panier détenu pour le montage ne décrit pas à lui seul cette exposition.',
    whyInteresting: 'Cette ligne permet de suivre les taux très courts en euros depuis un compte-titres. Elle évite d’exposer cette poche aux variations propres aux obligations de longue durée.',
    whatToKnow: 'Le taux obtenu évolue ; il n’est pas fixé pour toute ta détention. Les frais réduisent le résultat et le swap ajoute un risque de contrepartie. La part peut perdre de la valeur et ne bénéficie pas de la garantie d’un dépôt bancaire.',
  },
  'presentation-ie00b52sft06': {
    whatIs: 'Le MSCI USA couvre les grandes et moyennes entreprises américaines. Il pondère les titres par leur capitalisation disponible en Bourse. Les critères et le périmètre ne sont pas ceux du S&P 500, même si les grandes lignes se recoupent.',
    whyInteresting: 'Une seule ligne permet de suivre ce segment du marché américain. Elle donne un poids dédié aux États-Unis, indépendamment de la répartition d’un fonds mondial.',
    whatToKnow: 'Les plus grands groupes influencent fortement le résultat. Une correction de leurs valorisations peut affecter le fonds entier. La devise de cotation ne supprime pas l’effet du dollar pour un épargnant en euros.',
  },
  'presentation-fr0007056841': {
    whatIs: 'Le Dow Jones Industrial Average retient une sélection resserrée de grandes entreprises américaines. La pondération dépend du prix unitaire des actions, et non de la valeur totale des sociétés en Bourse.',
    whyInteresting: 'Cette ligne donne accès à cette sélection historique avec une répartition différente d’un indice pondéré par capitalisation. Elle permet d’identifier ce que la règle de poids change dans une exposition américaine.',
    whatToKnow: 'Une action au prix unitaire élevé peut influencer davantage l’indice qu’une société plus grande. Le nombre limité de sociétés et cette règle créent une concentration spécifique ; le Dow ne représente pas toute la Bourse américaine.',
  },
  'presentation-ie000ul6clp7': {
    whatIs: 'Tu détiens les actions des entreprises minières liées à l’argent sélectionnées par Global X. Ces sociétés explorent, extraient ou développent des gisements selon leurs activités. Tu n’achètes pas un stock de métal en coffre.',
    whyInteresting: 'Cette ligne donne accès aux résultats des producteurs d’argent sans choisir une seule mine. Elle permet de suivre leurs bénéfices et leurs projets, dont l’évolution peut différer de celle du métal.',
    whatToKnow: 'Les coûts d’extraction, la qualité des réserves et les risques politiques des sites comptent autant que le prix de vente. Un métal stable ne protège pas une mine déficitaire. Les petites sociétés peuvent aussi avoir besoin de nouveaux financements.',
  },
  'support-sect_cybersecurite': {
    whatIs: 'Le STOXX Global Digital Security sélectionne des entreprises liées à la sécurité numérique : protéger les réseaux, les données et les accès selon les activités retenues. Ce panier n’est pas celui de l’indice ISE Cyber Security suivi par le fonds L&G.',
    whyInteresting: 'Cette exposition rassemble des fournisseurs de sécurité numérique au sein d’une seule ligne. Elle permet de privilégier ces dépenses par rapport à l’ensemble du secteur informatique.',
    whatToKnow: 'Les entreprises doivent conserver leurs clients tout en développant leurs produits face à de nouvelles attaques. La concurrence et le coût de la recherche peuvent réduire les marges, même si les besoins de sécurité augmentent.',
  },
  'support-sect_energie_propre': {
    whatIs: 'Le S&P Global Clean Energy Transition sélectionne des producteurs d’énergie propre et des fournisseurs de technologies associés à cette transition. Tu achètes des actions, avec des activités et des poids déterminés par l’indice.',
    whyInteresting: 'Cette ligne relie des exploitants et des fournisseurs au sein de la chaîne des énergies propres. Elle donne une exposition différente de celle des entreprises de pétrole ou d’un seul fabricant d’équipements.',
    whatToKnow: 'Les projets exigent des financements et peuvent dépendre des tarifs de l’électricité ou des aides publiques. Des taux plus élevés ou des prix de vente plus bas peuvent réduire les bénéfices. Le développement des capacités ne garantit pas la rentabilité des actions.',
  },
  'support-immo_gpr': {
    whatIs: 'Le GPR Global 100 sélectionne des sociétés immobilières cotées de différents marchés. Tu détiens leurs actions à travers le fonds ; ce panier et ses poids diffèrent de ceux d’un indice FTSE EPRA/NAREIT.',
    whyInteresting: 'La ligne donne accès à des sociétés qui détiennent et exploitent de l’immobilier, avec la possibilité de négocier tes parts en Bourse. Tu ne gères ni les immeubles ni leurs locataires.',
    whatToKnow: 'Une hausse du coût de la dette peut réduire les résultats et la valeur des actifs. Les vacances locatives et les loyers comptent aussi. Le prix coté peut réagir immédiatement aux inquiétudes du marché, même quand les loyers restent encaissés.',
  },
  'quality': {
    whatIs: 'Le MSCI World Sector Neutral Quality sélectionne des entreprises des marchés développés selon leur rentabilité, leur endettement et la stabilité des bénéfices. Il maintient une répartition sectorielle proche de l’univers de départ : le filtre privilégie des sociétés au sein des secteurs.',
    whyInteresting: 'Cette règle permet de donner plus de poids à certains profils financiers sans analyser les comptes de chaque entreprise. Elle cherche autre chose que la seule taille en Bourse.',
    whatToKnow: 'Les comptes décrivent une situation passée qui peut se dégrader. Les entreprises retenues peuvent aussi être payées cher. Ce filtre peut donc sous-performer le World longtemps et ne protège pas d’une baisse générale des actions.',
  },
  'value': {
    whatIs: 'Le MSCI World Enhanced Value sélectionne des entreprises des marchés développés selon des mesures de prix rapporté aux bénéfices attendus, à l’actif comptable et aux flux de trésorerie. Les comparaisons se font au sein des secteurs pour rechercher des valorisations relativement faibles.',
    whyInteresting: 'Tu privilégies une règle de valorisation plutôt que les seules plus grandes capitalisations. Cela permet de suivre systématiquement ce style sans choisir chaque action jugée décotée.',
    whatToKnow: 'Un prix faible peut refléter des difficultés durables. Une action peut rester décotée ou continuer de baisser si ses bénéfices se dégradent. Le style value peut aussi rester longtemps à l’écart des entreprises qui portent le marché.',
  },
  'momentum': {
    whatIs: 'Le MSCI World Momentum privilégie les entreprises des marchés développés dont les cours ont suivi une tendance favorable, ajustée du risque, sur les périodes retenues par la méthode. Les rééquilibrages font évoluer la sélection et les poids.',
    whyInteresting: 'La ligne applique une règle fondée sur la dynamique des cours plutôt que sur une prévision personnelle des prochaines gagnantes. Elle permet de suivre ce style sans refaire soi-même le classement des actions.',
    whatToKnow: 'Un retournement rapide peut toucher les anciens gagnants avant que la sélection ne s’ajuste. Les changements de positions créent des coûts et peuvent concentrer le fonds sur les secteurs récemment favorisés.',
  },
  'topix-pea-hedged': {
    whyInteresting: 'Cette ligne donne accès au marché japonais dans un PEA tout en réduisant l’influence du yen sur le résultat en euros. Elle permet de distinguer le choix des actions japonaises du choix de leur monnaie.',
    whatToKnow: 'La couverture n’efface pas le risque actions et reste imparfaite. Son coût varie avec les conditions de marché, et elle retire aussi une partie de l’effet favorable d’un yen en hausse. Cette part ne doit pas être confondue avec la part TOPIX non couverte.',
  },
  'obligations-etat': {
    whatToKnow: 'Quand les taux montent, les obligations déjà détenues perdent généralement de la valeur. Plus leurs paiements sont lointains, plus l’effet peut être fort : c’est la sensibilité mesurée par la duration. Le fonds renouvelle ses emprunts et ne rembourse pas ta part à une date fixe.',
  },
  'obligations-globales-eur': {
    whyInteresting: 'Cette ligne réunit des emprunts d’État et d’entreprises de plusieurs marchés. La couverture vers l’euro permet de limiter le poids des monnaies dans une poche dont l’objectif est d’abord obligataire.',
    whatToKnow: 'Une hausse des taux ou une dégradation du crédit peut faire baisser le portefeuille. La couverture ne neutralise ni ces risques ni tous les écarts de change et son coût varie. De nombreuses lignes ne garantissent pas une valeur stable.',
  },
})

const specific = [
  [['presentation-ie00bdvpng13'],
    'L’intelligence artificielle regroupe des métiers très différents. Cet ETF les sélectionne selon la méthode WisdomTree 👇',
    'Tu suis une sélection d’entreprises qui fournissent des infrastructures, des outils ou des applications d’intelligence artificielle. Les règles de WisdomTree déterminent le lien au thème et les poids : la sélection ne se limite pas aux fabricants de puces.',
    'Une ligne permet de cibler cette chaîne de valeur plutôt que toute la technologie. Les fournisseurs d’équipements et les éditeurs de logiciels n’ont pas les mêmes clients ni les mêmes coûts.',
    'Une technologie peut se diffuser sans que toutes ses entreprises en profitent. La concurrence, les coûts de calcul et des attentes déjà élevées dans les cours peuvent réduire le résultat des actionnaires.',
    'Pour l’IA, tu préfères les fournisseurs d’outils ou les entreprises qui les utilisent ?'],
  [['presentation-ie00bklf1r75'],
    'Une batterie repose sur des matériaux, des composants et des logiciels. Cet ETF suit des entreprises de ces activités 👇',
    'La sélection WisdomTree vise les entreprises liées aux solutions de batteries : leur développement, leur fabrication et les technologies associées selon les règles de l’indice. Ce sont des actions, pas un stock de lithium.',
    'La ligne permet de suivre plusieurs étapes d’une même chaîne industrielle. Elle distingue le choix des entreprises de celui d’une matière première utilisée dans les batteries.',
    'Une nouvelle chimie peut rendre certains équipements ou procédés moins compétitifs. Les prix de vente, les coûts des matériaux et les besoins de financement peuvent peser ensemble, même si le nombre de batteries produites augmente.',
    'Tu regarderais les fabricants de batteries ou les fournisseurs de leurs technologies ?'],
  [['presentation-ie00blchjb90'],
    'Automatiser une usine et développer un logiciel d’IA sont deux activités différentes. Cet ETF Global X les rapproche dans une même sélection 👇',
    'Tu suis des entreprises liées à la robotique et à l’intelligence artificielle, notamment des équipements d’automatisation et des technologies associées. Les règles de l’indice déterminent quelles activités et entreprises sont retenues.',
    'Cette ligne relie des équipements industriels et des technologies numériques. Elle permet de cibler l’automatisation au-delà d’un seul fabricant de robots.',
    'Les clients peuvent reporter leurs investissements en machines lorsque l’économie ralentit. La concurrence technologique et le prix des actions peuvent aussi peser sur plusieurs lignes, même si les usages se développent.',
    'Pour l’automatisation, tu t’intéresses plutôt aux machines ou aux logiciels qui les font fonctionner ?'],
  [['presentation-ie000ndwfga5'],
    'Un ETF uranium peut détenir des actions minières plutôt que du combustible. C’est le cas de cette exposition 👇',
    'Le panier Global X rassemble des entreprises liées à l’uranium et aux activités associées à cette filière selon les règles de son indice. Tu détiens des actions de sociétés, et non directement de l’uranium.',
    'Cette ligne donne accès aux producteurs et à leurs projets sans sélectionner une seule entreprise. Les bénéfices dépendent de la ressource vendue, des contrats et des coûts d’exploitation.',
    'Une hausse de l’uranium ne compense pas forcément un chantier en retard ou une mine trop coûteuse. Les autorisations, les financements et les décisions nucléaires des pays peuvent toucher plusieurs sociétés ensemble.',
    'Pour le nucléaire, tu distingues les producteurs de combustible et les exploitants de centrales ?'],
  [['presentation-ie00bmh5y871'],
    'Les entreprises paient pour protéger leurs systèmes et leurs données. Cet ETF Global X suit des fournisseurs de cette sécurité 👇',
    'Tu détiens une sélection d’entreprises de cybersécurité : logiciels, équipements et services de protection numérique selon les activités retenues par l’indice. Ce panier peut différer de celui des autres ETF portant le même thème.',
    'Cette ligne cible les fournisseurs de sécurité plutôt que l’ensemble des dépenses informatiques. Elle permet de suivre plusieurs modèles de revenus, notamment les contrats de services et les ventes de solutions.',
    'La demande ne suffit pas à protéger les marges : les fournisseurs doivent renouveler leurs outils et conserver leurs clients. Une concurrence accrue ou une déception de croissance peut faire baisser plusieurs valeurs ensemble.',
    'Pour un ETF cybersécurité, tu compares les entreprises retenues ou seulement le thème affiché ?'],
  [['presentation-ie00bmc38736'],
    'Une cotation américaine ne signifie pas que tous les fabricants de puces sont américains. Voici la sélection de ce fonds 👇',
    'L’indice MarketVector US Listed Semiconductor 10% Capped Screened sélectionne des entreprises de semi-conducteurs cotées aux États-Unis. Il couvre des activités de conception, de fabrication et d’équipement selon les entreprises retenues, avec un plafonnement des poids.',
    'Cette ligne donne une place à la chaîne des puces sans choisir un seul fabricant. Le critère de cotation permet aussi de comprendre pourquoi son panier diffère d’un indice mondial plus large.',
    'Les cycles de commandes et de stocks peuvent affecter de nombreuses lignes ensemble. Les restrictions d’exportation et la concentration géographique de la fabrication ajoutent des risques que le plafonnement des poids ne supprime pas.',
    'Tu regardes le lieu de cotation des fabricants ou l’endroit où ils produisent leurs puces ?'],
  [['presentation-lu3180074463'],
    'L’autonomie stratégique européenne recouvre plusieurs activités. Cet ETF suit la sélection d’Euronext 👇',
    'Tu suis l’indice Euronext European Strategic Autonomy. Il sélectionne des entreprises liées au thème de l’autonomie stratégique européenne. Les positions publiées ci-dessous décrivent le panier réellement suivi, au-delà de son intitulé.',
    'Cette ligne permet de cibler ce thème au sein des actions européennes. Les entreprises retenues peuvent fournir des capacités et des équipements différents : leur présence dans la sélection compte davantage qu’une promesse de croissance du thème.',
    'Les commandes publiques, les autorisations et les besoins d’investissement peuvent lier plusieurs activités. Un soutien politique ne garantit ni leurs marges ni le prix des actions. Le fonds récent dispose aussi de peu d’historique propre.',
    'Tu regarderais les métiers retenus avant de choisir une exposition à l’autonomie européenne ?'],
  [['presentation-lu1681040223'],
    'Deux fonds Europe 600 peuvent retenir des entreprises différentes. Celui-ci applique une sélection ESG 👇',
    'Le STOXX Europe 600 ESG+ modifie l’univers européen par des règles environnementales, sociales et de gouvernance. Les exclusions et la sélection changent les lignes et leurs poids par rapport au STOXX Europe 600 classique.',
    'Cette exposition permet d’appliquer ces règles à une poche européenne, sans examiner soi-même chaque entreprise. Elle répond à un choix de méthode, dont les exclusions doivent correspondre aux critères recherchés.',
    'Une sélection plus étroite peut modifier les secteurs et renforcer certaines lignes. Les notes ESG ne mesurent pas tous les risques financiers et ne garantissent ni une moindre baisse ni un meilleur rendement.',
    'Quels critères souhaites-tu voir appliqués dans une sélection ESG européenne ?'],
  [['presentation-fr0013411980','topix-pea-hedged'],
    null,
    'Le TOPIX couvre un ensemble large d’actions japonaises. Les poids suivent la capitalisation disponible en Bourse. Il ne suit donc pas la même règle que le Nikkei 225, pondéré selon le prix des actions.',
    'Cette ligne permet de donner un poids dédié au marché japonais sans sélectionner chaque groupe. Son univers large répartit l’exposition autrement qu’une sélection limitée aux grandes valeurs du Nikkei.',
    'Les entreprises restent exposées à l’économie japonaise et au commerce mondial. Le yen peut modifier le résultat en euros si la part n’est pas couverte ; une couverture a aussi un coût et peut retirer l’effet favorable d’une hausse de la monnaie.',
    'Pour le Japon, tu choisirais un indice large comme le TOPIX ou la sélection du Nikkei 225 ?'],
  [['presentation-lu2089238385'],
    'Plusieurs indices suivent le Japon avec des règles différentes. Cet ETF utilise la sélection Solactive 👇',
    'Le Solactive GBS Japan Large & Mid Cap suit les grandes et moyennes capitalisations japonaises. Les poids reposent sur la capitalisation disponible en Bourse. Il se distingue du TOPIX par son univers et du Nikkei par sa pondération.',
    'La ligne permet de choisir le poids des grandes et moyennes entreprises japonaises. Elle laisse la sélection et les ajustements du panier aux règles de l’indice.',
    'Le marché japonais reste sensible aux exportations et au cycle industriel. Pour une épargne en euros, le yen peut aussi modifier le résultat en l’absence de couverture. Un fournisseur d’indice différent ne supprime pas ces risques communs.',
    'Tu compares les règles des indices japonais avant leurs performances passées ?'],
  [['presentation-lu1875395870','presentation-lu2196470426'],
    'Dans le Nikkei 225, le prix d’une action influence son poids. Ce n’est pas la même règle qu’un indice pondéré par la taille des entreprises 👇',
    'Le Nikkei 225 sélectionne des entreprises cotées au Japon. Sa pondération dépend du prix des actions, ajusté selon les règles de l’indice, plutôt que de la capitalisation totale des sociétés.',
    'Cette ligne donne accès à une sélection japonaise avec une autre répartition que le TOPIX. Elle permet de choisir cette construction sans acheter les actions une par une.',
    'Une action au prix unitaire élevé peut peser davantage qu’une entreprise plus grande. Quelques lignes peuvent ainsi orienter le résultat. Le yen ajoute un effet sur la performance en euros pour les parts non couvertes.',
    'Pour le Japon, tu préfères une pondération par le prix ou par la capitalisation ?'],
  [['presentation-fr0011440478'],
    'Tous les fonds émergents ne couvrent pas les mêmes régions. Celui-ci cible l’Europe, le Moyen-Orient et l’Afrique 👇',
    'L’indice MSCI EM EMEA ex-Egypt ESG Broad CTB Select retient une sélection de ces marchés émergents en excluant l’Égypte. Il applique aussi des critères environnementaux, sociaux, de gouvernance et de transition climatique.',
    'Cette ligne permet de distinguer cette partie des émergents des marchés asiatiques et latino-américains. Les filtres offrent une méthode de sélection précise au sein de cette région.',
    'Les pays et secteurs dominants peuvent concentrer le résultat. Les restrictions d’accès aux marchés, les décisions politiques et les monnaies locales peuvent provoquer des baisses communes. Les filtres climatiques ne neutralisent pas ces risques.',
    'Tu choisirais des régions émergentes séparées ou un panier mondial ?',
  ],
  [['presentation-fr0013412004'],
    'Brésil, Mexique et autres marchés retenus : les actions latino-américaines ont une place distincte dans les émergents 👇',
    'Le MSCI EM Latin America Selection 20/35% Capped sélectionne des entreprises de marchés émergents latino-américains. Il applique des plafonds de pondération aux principales lignes. Il ne représente pas l’ensemble des marchés émergents.',
    'Cette ligne permet de choisir le poids de la région au lieu de garder seulement celui d’un indice émergent mondial. Elle donne accès à plusieurs entreprises sans gérer une ligne par marché.',
    'Quelques pays, banques et producteurs de ressources peuvent peser beaucoup. Les finances publiques, les prix des ressources et les monnaies locales peuvent alors toucher une grande partie du panier. Des plafonds par action ne garantissent pas une répartition égale entre pays.',
    'Tu donnerais une place propre à l’Amérique latine dans une poche émergente ?'],
  [['presentation-fr0013412012'],
    'L’Asie émergente couvre un autre univers que le Japon. Cet ETF y ajoute une sélection par exclusions 👇',
    'Le MSCI EM Asia Screened Select ex Thermal Coal retient des entreprises des marchés émergents asiatiques avec des exclusions, dont le charbon thermique. Le Japon n’appartient pas à ce périmètre émergent.',
    'Cette ligne cible la partie asiatique des émergents, avec des règles de sélection explicites. Elle permet de choisir séparément son poids par rapport aux autres régions.',
    'La présence de plusieurs marchés laisse des concentrations par pays et par industrie. Les chaînes de production technologiques partagent des risques commerciaux et géopolitiques. Les exclusions ne suppriment pas les variations des monnaies locales.',
    'Pour l’Asie, tu préfères une sélection émergente ou un panier qui inclut aussi les marchés développés ?'],
  [['presentation-ie0002y8cx98','presentation-lu3038520774'],
    'Des commandes publiques aux équipements, la défense européenne rassemble plusieurs entreprises cotées 👇',
    'Tu suis des entreprises européennes liées à la défense selon les règles de l’indice de ce fonds. Les positions et leurs poids distinguent cette sélection des fonds de défense mondiaux : toutes les entreprises ne fournissent pas les mêmes équipements ou services.',
    'Cette ligne permet de cibler la filière européenne sans choisir un seul fournisseur. Elle isole une exposition aux contrats et aux équipements de défense plutôt que toute l’industrie européenne.',
    'Les budgets annoncés ne sont pas immédiatement des bénéfices. Les délais des programmes, les autorisations d’exportation et les dépassements de coûts peuvent peser sur les marges. Les cours peuvent aussi avoir déjà intégré les commandes attendues.',
    'Pour la défense, tu t’intéresses aux budgets annoncés ou aux contrats et aux marges des fournisseurs ?'],
  [['presentation-ie000c6itgc8','presentation-ie000w8wmsl2','quantique'],
    'L’informatique quantique reste en développement. Les entreprises d’un ETF quantique ne vivent pas toutes déjà de cette activité 👇',
    'Tu suis des entreprises sélectionnées pour leur lien avec l’informatique quantique : recherche, équipements ou technologies associées selon l’indice. Certains grands groupes ont aussi d’autres activités ; les poids publiés aident à comprendre la place réelle du thème.',
    'La ligne permet de suivre plusieurs participants à cette recherche technologique sans miser sur une seule entreprise. Elle donne une exposition à leurs modèles économiques, pas directement à la réussite d’une technologie.',
    'Les usages commerciaux peuvent arriver plus tard que prévu ou passer par d’autres entreprises. La recherche demande des financements et certaines sociétés ont peu de revenus. Un progrès technique ne garantit pas un bénéfice pour l’actionnaire.',
    'Pour une technologie encore en développement, tu regardes les perspectives ou les revenus déjà réalisés ?'],
  [['presentation-ie00b4556l06','presentation-ie00b4lhwp62'],
    null,
    null,
    'Ce produit donne accès au prix d’un métal depuis un compte-titres, sans organiser son stockage. Il se distingue des actions de sociétés minières : il n’expose pas à leurs coûts d’extraction ou à leurs décisions de gestion.',
    null,
    null],
]
for (const [ids,hook,whatIs,whyInteresting,whatToKnow,question] of specific) {
  const fields = Object.fromEntries(Object.entries({hook,whatIs,whyInteresting,whatToKnow,question}).filter(([,value]) => value != null))
  for (const id of ids) REVIEWED_EXPOSURE_COPY[id] = {...REVIEWED_EXPOSURE_COPY[id],...fields}
}

const shared = [
  [['or','support-or','support-or_wisdomtree','support-or_amundi'], {
    whatIs: 'Cet ETC donne une exposition à de l’or physique conservé en coffre. Tu détiens un titre de dette adossé au métal, distinct d’une part de fonds UCITS. Les frais font progressivement évoluer la quantité de métal correspondant au titre.',
    whyInteresting: 'Le produit permet d’accéder au métal depuis un compte-titres sans organiser son stockage. Son prix ne repose ni sur les bénéfices d’une entreprise ni sur le paiement d’intérêts.',
    whatToKnow: 'L’or ne produit pas de revenu et son cours peut baisser durablement. Le dollar influence le résultat en euros pour une exposition non couverte. La conservation du métal et les droits prévus par la structure de l’ETC ajoutent aussi des risques.',
  }],
  [['bitcoin','support-bitcoin_wisdomtree','support-bitcoin_etcgroup','support-bitcoin_21shares'], {
    whatIs: 'Ce produit coté donne une exposition au bitcoin conservé pour garantir les titres. Tu achètes un titre de dette depuis ton compte-titres, avec un émetteur et un dépositaire. Ce n’est pas un fonds UCITS ni un portefeuille de cryptomonnaies à ton nom.',
    whyInteresting: 'Cette structure permet de suivre le bitcoin sans gérer soi-même des clés privées ou une plateforme d’échange. Elle regroupe la conservation et la négociation dans un produit accessible en Bourse.',
    whatToKnow: 'Le prix du bitcoin peut chuter fortement et la cotation ne réduit pas cette volatilité. Les risques du dépositaire et de la structure s’ajoutent à ceux du sous-jacent. Les heures d’ouverture de la Bourse diffèrent aussi de celles du marché crypto, ouvert en continu.',
  }],
  [['support-foncieres_etf','support-foncieres_etf_dist'], {
    whatIs: 'Le FTSE EPRA/NAREIT Developed suit des sociétés immobilières cotées des marchés développés. Elles détiennent ou exploitent des immeubles de différents usages selon les entreprises retenues. Tu détiens leurs actions à travers le fonds.',
    whyInteresting: 'Une ligne permet d’accéder aux activités immobilières de plusieurs marchés sans acheter ni gérer un bâtiment. La négociation en Bourse facilite les échanges de parts, avec un prix qui varie en continu.',
    whatToKnow: 'La dette renchérit quand les taux montent et la valeur des immeubles peut reculer. Les loyers ne compensent pas toujours ces effets. Les actions des foncières peuvent baisser avec les marchés, même si les bâtiments restent loués.',
  }],
  [['support-high_dividend','support-high_dividend_dist'], {
    whatIs: 'Le FTSE All-World High Dividend Yield sélectionne dans les marchés développés et émergents des entreprises au rendement en dividendes anticipé élevé. La pondération repose sur les capitalisations, pas sur un partage égal des versements. Les foncières cotées de type REIT sont exclues de cet univers.',
    whyInteresting: 'Cette ligne privilégie les entreprises qui distribuent une part de leurs résultats. Le critère de sélection se distingue du choix d’une part capitalisante ou distribuante : les deux parts suivent la même stratégie d’actions.',
    whatToKnow: 'Un rendement élevé peut venir d’un cours en baisse avant une réduction du dividende. La sélection peut privilégier certains secteurs et manquer d’autres moteurs du marché. Les revenus et la valeur des parts doivent être regardés ensemble.',
    question: 'Tu distingues le choix d’actions à dividendes et la manière de recevoir les revenus du fonds ?',
  }],
  [['support-quality_dividend','support-quality_dividend_dist'], {
    whatIs: 'Le MSCI World High Dividend Yield Advanced Select sélectionne des entreprises développées selon leurs dividendes, avec des critères financiers et des filtres supplémentaires. Il cherche à distinguer un versement élevé de la capacité de l’entreprise à le maintenir.',
    whyInteresting: 'Cette méthode relie la recherche de dividendes à l’analyse des entreprises qui les versent. Elle permet de suivre une règle de sélection différente d’un simple classement des rendements les plus élevés.',
    whatToKnow: 'Les filtres reposent sur des données et des règles qui peuvent manquer une dégradation future. Les dividendes peuvent être réduits et les cours baisser. Le panier peut aussi s’écarter longtemps d’un World classique.',
    question: 'Pour un ETF dividendes, quelle place donnes-tu aux critères financiers de sélection ?',
  }],
  [['support-strat_dividendes_dist'], {
    whatIs: 'Le S&P Global Dividend Aristocrats Quality Income sélectionne des entreprises à dividendes de plusieurs marchés avec des critères d’historique de versements et de qualité financière. Il ne reprend pas simplement les plus grosses entreprises d’un indice mondial.',
    whyInteresting: 'Cette ligne permet de privilégier la régularité passée des distributions et les critères financiers prévus par la méthode. La sélection est gérée par l’indice plutôt que par une liste personnelle d’actions à revenus.',
    whatToKnow: 'Un historique régulier ne garantit pas le prochain dividende. Des secteurs comme la finance ou les services collectifs peuvent prendre une place importante et partager les mêmes risques de taux. Une distribution ne compense pas nécessairement une baisse du cours.',
    question: 'Tu regardes le montant des dividendes ou les critères qui servent à les sélectionner ?',
  }],
  [['support-mp_large','support-mp_large_icom'], {
    whatIs: 'L’indice Bloomberg Commodity suit des contrats à terme sur plusieurs familles de matières premières : énergie, métaux et agriculture. Le fonds obtient cette performance par un swap. Il ne stocke pas pour toi les produits physiques de ce panier.',
    whyInteresting: 'La ligne donne accès à plusieurs marchés de ressources au lieu de dépendre d’un seul métal ou d’un producteur. Leurs prix répondent à l’offre, à la demande et aux stocks plutôt qu’aux seuls bénéfices des entreprises cotées.',
    whatToKnow: 'Les contrats doivent être renouvelés. Acheter le contrat suivant plus cher peut peser sur le résultat même si le prix immédiat de la ressource ne baisse pas. Les frais, le change et le risque de la contrepartie du swap s’ajoutent aux variations du panier.',
    question: 'Pour les matières premières, tu regardes aussi le coût de renouvellement des contrats ?',
  }],
]
for (const [ids,copy] of shared) for (const id of ids) REVIEWED_EXPOSURE_COPY[id] = {...REVIEWED_EXPOSURE_COPY[id],...copy}

const commodityDetails = [
  ['etc-brent-crude-oil','le pétrole Brent','les équilibres du marché pétrolier international','les décisions des producteurs, la demande de carburants et les perturbations d’approvisionnement'],
  ['etc-wti-crude-oil','le pétrole WTI','le marché du pétrole de référence américain','les stocks américains, les capacités de transport et la demande de carburants'],
  ['etc-natural-gas','le gaz naturel Henry Hub','le marché américain du gaz, distinct du tarif payé en France','la météo, les stocks, la production et les capacités de transport américaines'],
  ['etc-coffee','le café','un marché agricole distinct des bénéfices des fabricants de boissons','les récoltes, les maladies des cultures et les conditions météorologiques'],
  ['etc-cocoa','le cacao','le marché de cette matière première agricole, sans acheter les fabricants de chocolat','la concentration de la production, les récoltes et les maladies des cultures'],
  ['etc-wheat','le blé','un marché de céréales, distinct des actions de l’agro-industrie','les récoltes, les restrictions d’exportation et les perturbations du commerce'],
]
for (const [id,resource,interest,drivers] of commodityDetails) REVIEWED_EXPOSURE_COPY[id] = {
  whatIs: `Cet ETC suit des contrats à terme sur ${resource}, renouvelés selon les règles de son indice. Un contrat à terme fixe les conditions d’une transaction future : tu ne détiens pas directement la matière première. Ce titre de dette est distinct d’un fonds UCITS.`,
  whyInteresting: `La ligne permet de cibler ${interest}. Elle donne accès à cette ressource depuis un compte-titres sans organiser sa livraison ou son stockage.`,
  whatToKnow: `Les prix réagissent notamment à ${drivers}. Le renouvellement des contrats peut aussi coûter : un contrat suivant plus cher réduit le résultat. Les frais de swap s’ajoutent aux frais de gestion ; la performance diffère donc de la simple variation du prix au comptant.`,
  question: `Pour une exposition à ${resource}, tu regarderais aussi les contrats utilisés et leur renouvellement ?`,
}

const interests = {
  'nasdaq-equal': 'La règle réduit le poids des très grands groupes par rapport au Nasdaq-100 classique. Tu gardes le même univers, mais chaque émetteur retrouve le même poids lors du rééquilibrage : c’est un choix de répartition, pas l’ajout d’un nouveau marché.',
  'small-value-europe': 'Cette ligne associe les petites entreprises européennes à une sélection qui privilégie des valorisations relativement faibles. Elle complète un indice européen de grandes valeurs avec une autre taille et un autre style d’entreprises.',
  'small-value-usa': 'Cette exposition privilégie de petites sociétés américaines dont les caractéristiques financières pèsent davantage dans la pondération. Elle change à la fois la taille des entreprises et leur répartition par rapport à un grand indice américain.',
  'world-midcap-equal': 'Les moyennes entreprises des marchés développés occupent ici une place dédiée. La pondération égale aux rééquilibrages réduit la domination des plus grandes lignes de cet univers, sans choisir soi-même chaque action.',
  'water-ishares': 'Cette ligne permet de suivre des fournisseurs d’équipements et de services liés à l’eau. Leurs contrats et leurs ventes donnent une exposition aux entreprises de cette chaîne, distincte d’une détention de la ressource.',
  'agribusiness-ishares': 'Le panier donne accès aux activités de la chaîne agricole sans choisir un seul producteur. Tu suis leurs bénéfices, leurs équipements et leurs services plutôt que le seul prix d’une céréale.',
  'timber-ishares': 'La ligne permet de suivre des entreprises dont l’activité dépend du bois et de la forêt sans acheter une parcelle. Elle relie la production et la transformation à leurs débouchés, notamment industriels et immobiliers.',
  'private-equity-ishares': 'Le fonds permet d’accéder aux sociétés cotées du capital-investissement par une ligne négociable en Bourse. Leurs revenus peuvent venir de participations et de frais de gestion : ce choix diffère d’une souscription directe à un fonds non coté.',
  'world-discretionary': 'La ligne donne une place aux dépenses que les ménages peuvent reporter, comme certains loisirs ou équipements. Elle permet de privilégier ce moteur de revenus plutôt que les achats de première nécessité.',
  'world-communication': 'Cette poche rassemble des modèles fondés sur les abonnements, les réseaux, les contenus et la publicité selon les entreprises retenues. Elle donne un poids dédié à ces services, qui ne sont pas tous classés dans la technologie.',
  'world-multifactor': 'Plusieurs règles de sélection sont combinées dans une seule ligne. Cela permet de suivre une méthode factorielle sans gérer soi-même plusieurs fonds et leurs rééquilibrages ; les poids résultent de la stratégie plutôt que de la seule taille des sociétés.',
  'ibonds-euro-2028': 'L’échéance 2028 permet d’identifier une année de fin du fonds, au lieu de suivre un portefeuille qui renouvelle indéfiniment ses obligations. Cela aide à distinguer le calendrier du fonds de la durée des emprunts au moment de l’achat.',
  'ibonds-euro-2029': 'La fin prévue en 2029 donne un calendrier à cette poche obligataire. Une seule ligne réunit des échéances de la même année sans avoir à acheter et gérer chaque emprunt.',
  'europe-construction': 'Cette ligne donne accès aux entreprises qui exécutent les chantiers et fournissent leurs matériaux. Elle permet de privilégier les dépenses de construction, avec d’autres revenus que les loyers des foncières ou les contrats d’exploitants de réseaux.',
  'world-eur-hedged': 'La couverture permet de réduire le rôle des monnaies dans le résultat en euros tout en conservant l’exposition aux actions développées. Elle distingue ainsi le choix du marché actions de celui du change.',
  'euro-govt-5-7': 'Cette tranche donne accès à une sensibilité aux taux intermédiaire entre les emprunts très courts et très longs. Le fonds gère les sorties et remplacements nécessaires pour rester dans son intervalle d’échéances.',
  'europe-property': 'La ligne donne un poids propre à l’immobilier coté européen hors Royaume-Uni. Tu accèdes aux activités de plusieurs sociétés immobilières sans acheter leurs immeubles ni choisir chaque action.',
  'europe-telecom': 'Cette ligne donne une place aux opérateurs et à leurs revenus de réseau et d’abonnement. Elle permet de suivre ces modèles sans les confondre avec les plateformes publicitaires ou les fabricants d’équipements.',
  'europe-food': 'La sélection cible la fabrication de produits alimentaires et de boissons en Europe. Elle donne accès aux marques, aux volumes vendus et aux marges de ces entreprises, plutôt qu’au seul prix des matières premières agricoles.',
  'europe-media': 'Le fonds permet de suivre les revenus des contenus et de la publicité à travers plusieurs sociétés européennes. Cette poche se distingue des abonnements et réseaux des opérateurs de télécommunications.',
  'europe-retail': 'La ligne cible les entreprises qui vendent aux consommateurs selon la classification de l’indice. Elle permet de privilégier la distribution et ses marges, au lieu de suivre uniquement les fabricants des produits vendus.',
  'em-value-ishares': 'Cette ligne ajoute une règle de valorisation à l’univers émergent. Elle permet de privilégier des profils jugés relativement peu chers selon la méthode, plutôt que de conserver seulement les poids de l’indice large.',
  'euro-ultrashort-ishares': 'Les échéances très courtes limitent les mouvements de prix liés aux taux par rapport aux obligations longues. Le fonds conserve une exposition au crédit d’entreprise en euros, avec un renouvellement géré dans la même ligne.',
  'emu-core-ishares': 'La ligne donne accès aux grandes et moyennes entreprises de la zone euro, au-delà d’un panier limité à cinquante valeurs. Elle permet de piloter cette zone monétaire séparément du reste de l’Europe.',
  'emu-small-cap-ishares': 'Cette poche ajoute les petites entreprises de la zone euro aux grandes et moyennes valeurs. Elle permet d’élargir les tailles suivies sans acheter soi-même de nombreuses actions moins connues.',
  'euro-dividend-ishares': 'La sélection privilégie le rendement des dividendes dans la zone euro. Elle permet de donner un poids propre à ce style, avec une part qui verse les revenus plutôt que de les réinvestir.',
  'europe-value-ishares': 'La ligne applique une règle de valorisation aux actions européennes. Elle donne une autre répartition que les seules capitalisations, sans avoir à sélectionner soi-même les entreprises jugées décotées.',
  'europe-momentum-ishares': 'Cette règle privilégie la dynamique récente des cours européens plutôt qu’une prévision personnelle des prochaines gagnantes. La sélection et ses ajustements sont gérés par l’indice.',
  'europe-quality-ishares': 'La règle privilégie des profils financiers au sein des secteurs européens. Elle donne accès à ce filtre sans analyser soi-même les comptes de chaque entreprise et en limitant le choix d’un seul secteur.',
  'usa-quality-ishares': 'Cette ligne applique une sélection financière au marché américain, au sein des secteurs. Elle permet de privilégier rentabilité et bilan plutôt que les seules plus grandes capitalisations.',
  'usa-value-ishares': 'Cette exposition donne plus de place à des valorisations relativement faibles dans le marché américain. Elle suit systématiquement une règle, au lieu de miser personnellement sur quelques actions jugées bon marché.',
  'usa-momentum-ishares': 'La ligne permet de suivre les tendances des actions américaines selon une règle d’indice. Les changements de sélection sont pris en charge sans devoir classer soi-même les entreprises à chaque rééquilibrage.',
  'sp-smallcap-600-ishares': 'Le filtre de bénéfices à l’entrée distingue cet univers de petites entreprises américaines d’un panier fondé principalement sur la taille. Cette ligne donne accès à cette sélection sans choisir chaque société.',
  'world-sri-ishares': 'Cette ligne applique des exclusions et une sélection extra-financière à des actions développées. Elle permet de privilégier ces critères dans une poche mondiale selon les règles documentées de MSCI.',
  'electric-vehicles-ishares': 'Le fonds relie plusieurs fournisseurs et technologies de la mobilité électrique dans une seule ligne. Il permet de suivre la chaîne industrielle au-delà d’un seul constructeur automobile.',
  'aerospace-defence-ishares': 'Cette ligne regroupe l’aéronautique et la défense de marchés développés. Elle donne accès à des programmes civils et militaires selon les entreprises retenues, sans se limiter à un pays européen.',
  'ageing-population-ishares': 'Le panier relie des activités retenues pour leurs liens avec le vieillissement. Il permet de suivre plusieurs métiers associés à ce changement démographique, sans réduire cette exposition aux seuls laboratoires pharmaceutiques.',
  'world-islamic': 'La ligne applique des règles sectorielles et financières de conformité à la finance islamique. Elle permet de suivre ce cadre dans plusieurs marchés développés sans examiner soi-même chaque titre.',
  'europe-banks': 'Cette ligne donne accès au métier bancaire de plusieurs marchés européens. Elle permet d’en choisir le poids séparément des assureurs et des autres activités financières.',
  'europe-insurance': 'La sélection donne accès aux revenus d’assurance et aux placements des assureurs européens. Elle isole ce modèle de celui des banques, dont les résultats reposent davantage sur le crédit et les dépôts.',
  'clean-energy-lg': 'Cette ligne permet de suivre la sélection Solactive d’entreprises liées à l’énergie propre. Les activités retenues donnent une exposition aux exploitants et aux technologies de la transition selon la méthode, au-delà d’une seule entreprise.',
  'medical_innovation_ishares': 'Le panier donne accès aux entreprises retenues pour leurs innovations en santé, avec des traitements, équipements et technologies selon les lignes. Il permet de privilégier cette recherche plutôt que toute la santé ou seulement les biotechnologies américaines.',
  'presentation-ie00bj5jpg56': 'Cette ligne donne accès à plusieurs catégories d’actions chinoises au sein d’un même panier. Elle permet d’en choisir le poids indépendamment des autres marchés émergents, au-delà des seules grandes valeurs cotées à Hong Kong.',
}
for (const [id,whyInteresting] of Object.entries(interests)) REVIEWED_EXPOSURE_COPY[id] = {...REVIEWED_EXPOSURE_COPY[id],whyInteresting}

const questions = {
  'nasdaq-equal':'Tu préfères le poids des capitalisations ou une remise à égalité des entreprises du Nasdaq-100 ?',
  'small-value-europe':'Pour les petites entreprises européennes, tu ajouterais un filtre de valorisation ?',
  'small-value-usa':'Tu choisirais les petites entreprises américaines dans leur ensemble ou avec un biais value ?',
  'world-midcap-equal':'Quelle place donnerais-tu aux moyennes entreprises entre les grands groupes et les petites valeurs ?',
  'water-ishares':'Pour l’eau, tu t’intéresses aux équipements ou aux exploitants des réseaux ?',
  'agribusiness-ishares':'Pour l’agriculture, tu préférerais les entreprises ou les contrats sur les récoltes ?',
  'timber-ishares':'Tu connaissais cette façon d’investir dans la filière bois sans acheter une forêt ?',
  'private-equity-ishares':'Tu distingues les sociétés cotées du capital-investissement et les fonds non cotés ?',
  'world-discretionary':'Tu donnerais plus de place aux achats reportables ou aux produits du quotidien ?',
  'world-communication':'Tu savais que les plateformes et les télécoms pouvaient partager un secteur boursier ?',
  'world-multifactor':'Tu réunirais plusieurs facteurs dans un fonds ou tu choisirais chacun séparément ?',
  'ibonds-euro-2028':'Une année de fin prévue change-t-elle ta façon de regarder un ETF obligataire ?',
  'ibonds-euro-2029':'Pour une poche obligataire, tu choisirais une année de fin ou un portefeuille renouvelé en continu ?',
  'europe-construction':'Tu distingues les constructeurs, les fournisseurs de matériaux et les propriétaires d’immeubles ?',
  'world-eur-hedged':'Pour tes actions mondiales, tu préfères conserver l’effet des monnaies ou le réduire ?',
  'euro-govt-5-7':'Pour les obligations d’État, quelle sensibilité aux taux souhaites-tu comprendre en premier ?',
  'europe-property':'Tu choisirais l’immobilier coté européen ou un panier mondial ?',
  'europe-telecom':'Pour les télécoms, tu regardes les abonnements ou les dépenses nécessaires aux réseaux ?',
  'europe-food':'Pour les fabricants alimentaires, tu regarderais la régularité des ventes ou la capacité à maintenir leurs marges ?',
  'europe-media':'Tu t’intéresses aux revenus publicitaires ou aux abonnements des entreprises de médias ?',
  'europe-retail':'Pour la consommation, tu préfères suivre les marques ou les distributeurs ?',
  'em-value-ishares':'Tu ajouterais un filtre value aux marchés émergents ou tu conserverais leur indice large ?',
  'euro-ultrashort-ishares':'Pour des échéances très courtes, quelle importance donnes-tu au risque des entreprises emprunteuses ?',
  'emu-core-ishares':'Tu choisirais les grandes et moyennes entreprises de la zone euro ou les seules grandes valeurs ?',
  'emu-small-cap-ishares':'Tu ferais une place aux petites entreprises de la zone euro à côté des grands groupes ?',
  'euro-dividend-ishares':'Tu regardes aussi pourquoi le rendement du dividende d’une action est élevé ?',
  'europe-value-ishares':'Pour l’Europe, tu privilégierais une règle de valorisation ou les capitalisations du marché ?',
  'europe-momentum-ishares':'Tu suivrais les tendances des actions européennes ou un indice sans ce filtre ?',
  'europe-quality-ishares':'Tu voudrais sélectionner la qualité financière au sein de chaque secteur européen ?',
  'usa-quality-ishares':'Pour les actions américaines, tu accorderais plus de poids aux bilans ou à la taille des entreprises ?',
  'usa-value-ishares':'Tu accepterais de t’écarter des grands gagnants américains pour une sélection value ?',
  'usa-momentum-ishares':'Comment regarderais-tu le risque d’un retournement dans une stratégie momentum américaine ?',
  'sp-smallcap-600-ishares':'Le filtre de bénéfices change-t-il ton regard sur les petites entreprises américaines ?',
  'world-sri-ishares':'Quelles exclusions souhaites-tu retrouver dans un fonds mondial SRI ?',
  'electric-vehicles-ishares':'Pour la mobilité électrique, tu choisirais les constructeurs ou toute une chaîne de fournisseurs ?',
  'aerospace-defence-ishares':'Tu distingues l’aéronautique civile et les programmes militaires dans un fonds de défense ?',
  'ageing-population-ishares':'Tu regarderais quels métiers avant de choisir un ETF sur le vieillissement ?',
  'world-islamic':'Tu avais regardé comment les critères de finance islamique modifient un World ?',
  'europe-banks':'Tu suivrais les banques européennes seules ou plusieurs métiers financiers ?',
  'europe-insurance':'Pour les assureurs, tu regardes les contrats souscrits ou les placements qui financent leurs engagements ?',
}
for (const [id,question] of Object.entries(questions)) REVIEWED_EXPOSURE_COPY[id] = {...REVIEWED_EXPOSURE_COPY[id],question}
REVIEWED_EXPOSURE_COPY['support-dividend_leaders'] = {
  whatIs:'Le Morningstar Developed Markets Large Cap Dividend Leaders Screened Select retient de grandes entreprises développées selon leurs dividendes et des critères de sélection supplémentaires. La méthode filtre les sociétés avant de fixer leurs poids : elle ne reprend pas simplement le World.',
  whyInteresting:'Cette ligne privilégie les entreprises retenues pour leurs distributions et leur capacité financière à les soutenir. Elle permet de suivre une règle de revenus d’actions sans construire soi-même un panier de titres à dividendes.',
  whatToKnow:'Un dividende passé peut être réduit lorsque les bénéfices baissent. Les filtres ne garantissent pas la santé future des sociétés et la sélection peut concentrer certains secteurs. Les distributions ne compensent pas forcément une perte sur les parts.',
  question:'Pour un ETF à dividendes, tu regardes le niveau des versements ou les règles de sélection des entreprises ?',
}

Object.assign(REVIEWED_EXPOSURE_COPY, {
  'presentation-ie0008470928': {
    hook:'Europe et zone euro ne couvrent pas les mêmes entreprises. Le STOXX Europe 50 inclut aussi des marchés hors de la monnaie unique 👇',
    whatIs:'Le STOXX Europe 50 retient de grandes entreprises européennes, dont des sociétés du Royaume-Uni et de Suisse. Les capitalisations disponibles en Bourse déterminent les poids selon les plafonds de l’indice. Il se distingue de l’EURO STOXX 50, limité à la zone euro.',
    whyInteresting:'Cette ligne donne une place aux grandes valeurs européennes sans se limiter aux pays de l’euro. Elle permet de privilégier ce segment plutôt qu’un marché européen incluant davantage de tailles d’entreprises.',
    whatToKnow:'Le panier resserré rend les principales entreprises et monnaies influentes. Les groupes peuvent partager des risques sectoriels malgré leurs pays différents. Une cotation en euros ne couvre pas la livre ou le franc suisse.',
  },
  'presentation-fr0011871078': {
    hook:'La Chine depuis un PEA, avec des exclusions dans la sélection : voici le fonctionnement de cet ETF 👇',
    whatIs:'Le MSCI China Screened Select ex Thermal Coal retient des actions chinoises avec des exclusions, dont le charbon thermique. Le fonds reçoit cette performance par un swap : les titres détenus pour le montage ne décrivent pas nécessairement l’exposition chinoise.',
    whyInteresting:'Cette ligne donne un poids dédié au marché chinois dans le PEA, selon les règles de sélection de l’indice. Elle évite de laisser ce poids dépendre uniquement d’un panier émergent mondial.',
    whatToKnow:'La réglementation chinoise peut modifier rapidement les conditions d’activité et les droits des investisseurs. Les différentes catégories d’actions et leurs monnaies ajoutent des risques. Les exclusions ne protègent pas d’une baisse du marché et le swap ajoute une contrepartie.',
  },
  'presentation-ie00b02kxk85': {
    hook:'Une sélection de grandes entreprises chinoises cotées à Hong Kong : cet ETF ne suit pas toute la Bourse chinoise 👇',
    whatIs:'Le FTSE China 50 sélectionne de grandes entreprises chinoises cotées à Hong Kong. Il pondère selon les règles de capitalisation et de plafonnement de l’indice. Les actions domestiques de Shanghai et Shenzhen ne constituent pas le même univers.',
    whyInteresting:'Cette ligne permet de cibler ce segment accessible à Hong Kong, au lieu de gérer les différentes actions séparément. Son périmètre se distingue d’un panier chinois plus large ou centré sur les actions A.',
    whatToKnow:'Quelques groupes et secteurs peuvent peser fortement. Les décisions des autorités chinoises et les tensions commerciales peuvent affecter plusieurs lignes ensemble. Le lieu de cotation à Hong Kong n’efface pas les risques économiques de la Chine.',
  },
  'presentation-ie00bqt3wg13': {
    hook:'Shanghai et Shenzhen donnent accès à un autre panier que les seules grandes valeurs chinoises de Hong Kong 👇',
    whatIs:'Le MSCI China A Inclusion vise des actions A chinoises négociées sur le marché domestique. La méthode de l’indice tient compte des conditions d’accès aux investisseurs étrangers. Ce périmètre diffère de celui du MSCI China large.',
    whyInteresting:'Cette ligne permet de suivre cette composante domestique sans organiser soi-même l’accès aux différentes actions locales. Elle donne un poids spécifique à cet univers au sein d’une exposition chinoise.',
    whatToKnow:'Les restrictions d’accès et de négociation peuvent affecter la liquidité. Les décisions réglementaires et le renminbi influencent le résultat, et ce panier ne représente pas toutes les catégories d’actions chinoises.',
  },
  'presentation-gb00b15kxq89': {
    hook:'Suivre le cuivre en Bourse ne signifie pas forcément détenir des lingots. Cet ETC passe par des contrats à terme 👇',
    whyInteresting:'Le produit donne accès au marché du cuivre sans organiser son stockage. Le résultat dépend de la ressource et des contrats utilisés, plutôt que des coûts et des bénéfices d’une entreprise minière.',
    whatToKnow:'Les contrats sont renouvelés à des prix qui peuvent différer de celui du cuivre au comptant. Un renouvellement plus cher peut réduire la performance. Les frais, le change et la contrepartie s’ajoutent aux variations liées à la demande industrielle.',
  },
  'presentation-fr001400zgo4': {
    hook:'Ajouter les émergents dans un PEA peut passer par une sélection climatique et ESG. Voici celle de cette part 👇',
    whatIs:'Le MSCI EM ex-Egypt ESG Broad CTB Select sélectionne des entreprises de marchés émergents, en excluant l’Égypte et en appliquant des critères de transition climatique et des exclusions. Il ne reprend donc pas simplement l’indice MSCI Emerging Markets classique.',
    whyInteresting:'La ligne permet d’ajouter des marchés absents du MSCI World dans le cadre du PEA. Elle suit une règle de sélection explicite plutôt qu’une gestion individuelle de ces actions.',
    whatToKnow:'Les filtres changent les entreprises et les poids, avec des écarts possibles face à un émergent large. Les risques politiques, les monnaies et les concentrations des marchés asiatiques restent présents. La réplication par swap ajoute un risque de contrepartie.',
  },
  'pea-emergents-amundi': {
    whyInteresting:'Cette ligne permet de choisir le poids des marchés émergents dans le PEA. Les critères climatiques et les exclusions sont appliqués par l’indice, sans sélectionner chaque action soi-même.',
    whatToKnow:'Les filtres peuvent renforcer certaines lignes et écarter des pans du marché. Les décisions politiques et les monnaies locales peuvent toucher plusieurs entreprises ensemble. La politique de capitalisation ou de distribution relève du fonds et n’efface pas ces risques.',
  },
  'pea-inde-amundi': {
    whyInteresting:'La ligne permet de fixer le poids de l’Inde dans le PEA plutôt que de conserver seulement celui d’un indice émergent. La sélection et les ajustements du panier sont pris en charge par la méthode MSCI.',
    whatToKnow:'Les bénéfices dépendent de la demande, du financement et des règles locales. Une forte croissance économique peut déjà être attendue dans les prix. La roupie influence aussi le résultat en euros ; le swap ne constitue pas une couverture automatique de ce change.',
  },
  'new-energy-amundi': {
    whyInteresting:'La sélection relie plusieurs activités de l’énergie nouvelle dans une ligne mondiale, avec les filtres de l’indice. Elle permet de suivre des entreprises d’équipements et de production selon le panier retenu plutôt que le seul prix de l’énergie.',
    whatToKnow:'Les projets exigent des financements et peuvent dépendre des aides publiques. Des taux élevés, une baisse des prix de vente ou une surcapacité peuvent dégrader les marges. La croissance des installations ne garantit pas celle des bénéfices.',
  },
  'small-value-world-avantis': {
    whatIs:'Ce fonds actif sélectionne de petites entreprises des marchés développés en privilégiant notamment des valorisations faibles et des critères de rentabilité. Le gérant choisit les titres et les poids ; le MSCI World Small Cap Value sert de comparaison, pas de panier répliqué.',
    whyInteresting:'La ligne permet de réunir une démarche small value mondiale et la gestion des transactions dans un seul fonds. Elle donne accès à un style différent des grandes capitalisations sans devoir constituer soi-même un portefeuille de petites actions.',
    whatToKnow:'Le style value et les petites sociétés peuvent sous-performer longtemps. Les choix du gérant ajoutent un écart possible avec l’indice de comparaison. Les actions moins liquides peuvent être difficiles à négocier en période de ventes importantes.',
  },
  'em-small-cap-ishares': {
    whyInteresting:'La ligne ajoute les petites entreprises absentes d’un MSCI Emerging Markets standard. Elle élargit la taille des sociétés suivies tout en laissant les ajustements du panier à l’indice.',
  },
  'pacific-ex-japan-ishares': {
    whyInteresting:'Cette exposition permet de choisir le poids des marchés développés du Pacifique hors Japon, notamment l’Australie, Hong Kong et Singapour. Elle se distingue d’un panier d’Asie émergente et permet de gérer le Japon séparément.',
  },
  'cloud-wisdomtree': {
    whyInteresting:'La sélection permet de privilégier les fournisseurs de services cloud et leurs modèles de revenus récurrents. Elle donne accès à ce segment sans le confondre avec les fabricants de puces ou l’ensemble d’un indice technologique.',
  },
  'gold-miners-vaneck': {
    whyInteresting:'Cette ligne donne accès aux bénéfices et aux projets de producteurs d’or plutôt qu’au seul prix du métal. Une amélioration du prix de vente peut soutenir leurs marges si les coûts et la production suivent.',
  },
  'copper-miners-globalx': {
    whyInteresting:'La ligne réunit plusieurs producteurs dont les revenus dépendent du cuivre. Elle permet d’accéder à leurs gisements et à leurs projets sans miser sur une seule mine ni confondre leurs actions avec le métal.',
  },
  'global-premium-income-jpm': {
    whyInteresting:'La gestion combine des actions mondiales et des primes liées aux options pour rechercher des revenus distribués. Elle offre un autre profil de versements que les seuls dividendes d’un indice mondial.',
  },
  'pea-luxe-monde': {
    whyInteresting:'Cette ligne permet de donner un poids au luxe mondial dans le PEA. Elle relie plusieurs groupes et marchés plutôt que de limiter cette exposition à une seule marque française.',
  },
  'ia-big-data-xtrackers': {
    whyInteresting:'La ligne relie des entreprises de l’IA, des données et de la sécurité numérique selon la sélection Nasdaq. Elle cible ce croisement d’activités au lieu de reproduire tout le secteur technologique.',
  },
  'mines-mondiales-vaneck': {
    whyInteresting:'Le fonds donne accès aux activités de plusieurs producteurs de métaux et de minerais. Leurs bénéfices dépendent des ressources vendues et des coûts d’extraction : cette exposition se distingue d’un panier de prix de matières premières.',
  },
  'euro-dividend-aristocrats': {
    whyInteresting:'La règle privilégie la régularité passée des dividendes dans la zone euro, avec une part qui verse les revenus. Elle permet de suivre ce style plutôt que les seules plus grandes capitalisations européennes.',
  },
  'quality-dividend-growth-wisdomtree': {
    whyInteresting:'La ligne combine des critères financiers et la recherche d’entreprises à dividendes, tout en réinvestissant les revenus de cette part. Elle sépare le style de sélection du choix de recevoir ou non des versements.',
  },
  'gaming_vaneck': {
    whyInteresting:'Cette sélection cible les revenus des jeux vidéo et de l’eSport plutôt que toute la technologie. Elle réunit notamment des éditeurs et développeurs dont les catalogues et les modes de distribution peuvent différer.',
    whatToKnow:'Les succès d’un jeu, les dépenses des joueurs et les règles sur les contenus peuvent affecter les bénéfices. Quelques groupes peuvent peser fortement et partager ces risques. Le changement d’indice de décembre 2022 doit aussi être pris en compte en lisant l’historique de la part.',
  },
  'acwi_imi_spdr': {
    whyInteresting:'Cette ligne réunit marchés développés, émergents et petites entreprises. Elle évite de gérer séparément ces univers pour suivre cette couverture mondiale, tout en laissant l’indice déterminer leurs poids.',
  },
  'sp500_equal_weight': {
    whyInteresting:'La règle donne davantage de place aux entreprises les moins lourdes du S&P 500 qu’une pondération par capitalisation. Elle change la répartition des risques sans ajouter un autre marché national.',
  },
  'oblig_em_usd_ishares': {
    whyInteresting:'La ligne donne accès à plusieurs emprunteurs émergents par des obligations en dollars. Elle permet de séparer le risque de crédit de ces emprunteurs d’une exposition directe à leurs monnaies locales.',
    whatToKnow:'Un État peut rencontrer des difficultés de remboursement et les taux américains peuvent faire baisser les prix des obligations. Pour une épargne en euros, le dollar ajoute un risque. Des versements réguliers ne garantissent ni leur montant futur ni la valeur des parts.',
  },
  'oblig_eur_long_ishares': {
    whyInteresting:'Les échéances longues donnent une sensibilité importante aux variations des taux en euros. Cette ligne permet de choisir ce profil sans acheter et renouveler soi-même chaque emprunt d’État.',
  },
  'world_ex_usa': {
    whyInteresting:'La ligne permet de fixer le poids des pays développés hors États-Unis séparément d’une poche américaine. Elle laisse le choix de cette répartition au détenteur plutôt qu’aux poids d’un World complet.',
  },
  'monetaire-eur': {
    whyInteresting:'Cette exposition permet de suivre les taux très courts en euros sur un compte-titres sans gérer des échéances d’obligations. Les revenus restent investis dans la part capitalisante.',
  },
  'obligations-etat-0-1': {
    whyInteresting:'L’intervalle zéro à un an limite la sensibilité aux taux par rapport aux obligations longues. Le fonds prend en charge le renouvellement des emprunts arrivant au terme de cette tranche.',
  },
  'obligations-inflation': {
    whyInteresting:'Les paiements de ces emprunts sont liés à une mesure d’inflation plutôt que fixés uniquement en euros nominaux. La ligne donne accès à cette règle d’indexation sur plusieurs États et échéances.',
  },
  'em-ex-chine': {
    whyInteresting:'L’exclusion permet de choisir la place de la Chine séparément du reste des émergents. La ligne conserve un panier des autres marchés sans devoir reconstruire un indice pays par pays.',
  },
  'inde': {
    whatToKnow:'Le portefeuille reste concentré sur un seul pays. Des prix d’actions élevés peuvent déjà intégrer une croissance attendue ; une déception de bénéfices peut alors coûter cher. La réglementation et les variations de la roupie influencent aussi le résultat en euros.',
  },
  'infrastructures': {
    whatIs:'Le FTSE Global Core Infrastructure sélectionne des sociétés cotées liées notamment aux réseaux d’énergie, aux transports et aux autres infrastructures retenues par sa méthode. Leurs contrats, investissements et financements déterminent leurs résultats. Tu détiens des actions, pas directement les infrastructures.',
    whyInteresting:'La ligne relie plusieurs exploitants d’infrastructures dans un panier mondial. Elle donne accès à leurs activités et à leurs contrats sans choisir un réseau ou un pays isolé.',
    whatToKnow:'Les investissements et la dette rendent ces entreprises sensibles aux taux. Les règles de tarification, les volumes transportés et les dépenses de maintenance peuvent réduire leurs marges. Des services indispensables ne garantissent pas des dividendes ni un cours stable.',
  },
  'basic-resources-pea': {
    whyInteresting:'La ligne donne accès aux bénéfices de producteurs de ressources dans le PEA. Elle distingue leurs activités d’une exposition aux prix des métaux : le résultat dépend aussi de l’exploitation des gisements et des coûts.',
  },
  'msci-em': {
    whyInteresting:'Cette ligne ajoute les marchés absents du MSCI World en incluant les grandes, moyennes et petites entreprises. Elle permet de choisir séparément le poids de cet univers émergent étendu.',
  },
  'semiconducteurs': {
    whyInteresting:'Le panier relie les fabricants de puces et leurs équipementiers. Il permet de suivre plusieurs étapes de cette industrie sans faire dépendre l’exposition d’un seul fabricant ou d’une seule technologie.',
  },
  'sante-biotech': {
    whyInteresting:'La ligne répartit l’exposition entre plusieurs laboratoires et projets de traitements. Elle réduit le poids d’un échec individuel tout en conservant un choix beaucoup plus ciblé qu’un secteur santé large.',
  },
  'defense': {
    whyInteresting:'Le panier relie plusieurs fournisseurs d’équipements, de technologies et de services de défense. Il permet d’accéder à leurs contrats et à leurs activités sans sélectionner un seul programme militaire.',
    whatToKnow:'Des commandes annoncées peuvent prendre du retard et les dépassements de coûts réduire les marges. Les autorisations d’exportation et les budgets publics affectent plusieurs fournisseurs. Les cours peuvent aussi déjà anticiper une croissance qui ne se réalise pas.',
  },
  'cybersecurite': {
    whyInteresting:'Cette sélection donne une place aux fournisseurs d’outils et de services de cybersécurité. Elle permet de privilégier ces dépenses sans suivre tout le secteur informatique ni choisir un seul fournisseur.',
  },
  'eau': {
    whatToKnow:'Les contrats et les tarifs peuvent être encadrés par les pouvoirs publics, alors que les réseaux et équipements demandent des investissements. Une hausse des coûts peut réduire les marges. Le caractère indispensable de l’eau ne garantit pas la rentabilité des sociétés retenues.',
  },
  'luxe': {
    whyInteresting:'Cette ligne donne accès à plusieurs groupes de luxe plutôt qu’à une seule maison. Elle permet d’isoler ces marques et leurs modèles de marges au sein d’une exposition mondiale.',
  },
  'immobilier-reit': {
    whatToKnow:'Une hausse des taux peut renchérir la dette et réduire la valeur des immeubles. Les vacances locatives et les loyers influencent les résultats. Les prix des actions peuvent baisser rapidement malgré des revenus locatifs encore encaissés.',
  },
  'ia': {
    whyInteresting:'La ligne permet de suivre une sélection reliant les infrastructures, les logiciels et les applications de l’IA. Elle donne accès à leurs modèles économiques plutôt que de faire reposer l’exposition sur un seul fabricant de puces.',
    whatToKnow:'Les dépenses de calcul et la concurrence peuvent limiter les profits malgré la hausse des usages. Des attentes élevées dans les cours amplifient une déception. Certaines grandes lignes sont aussi présentes dans les fonds World ou technologiques.',
  },
  'robotique': {
    whyInteresting:'Cette ligne relie les machines, leurs composants et les logiciels d’automatisation selon les entreprises retenues. Elle permet de suivre cette chaîne industrielle sans choisir un fabricant de robots isolé.',
  },
  'nucleaire': {
    whyInteresting:'Le panier réunit des entreprises de plusieurs activités nucléaires, du combustible aux équipements et infrastructures selon les positions. Il permet de suivre cette chaîne plutôt que de limiter l’exposition à une seule mine.',
  },
  'batteries-ve': {
    whyInteresting:'La sélection relie des matériaux et des technologies utilisés dans les batteries. Elle permet de suivre plusieurs fournisseurs des véhicules électriques et du stockage d’énergie, au-delà d’un seul constructeur.',
  },
  'spatial': {
    whyInteresting:'La ligne donne accès aux entreprises de la chaîne spatiale retenues par l’indice, avec leurs équipements, services et contrats. Elle répartit ce choix entre plusieurs sociétés plutôt qu’un projet isolé.',
    whatToKnow:'Des lancements peuvent échouer, des contrats prendre du retard et les financements manquer avant la rentabilité. Certains acteurs ont d’autres activités : leur présence ne signifie pas que tous leurs revenus viennent du spatial. Le panier reste étroit.',
  },
  'dividendes': {
    whyInteresting:'La règle privilégie un historique de dividendes croissants dans le marché américain. Elle permet de suivre cette discipline de sélection sans constituer soi-même un panier d’actions à revenus.',
  },
  'covered-call': {
    whyInteresting:'La vente d’options apporte des primes en échange d’une partie de la hausse potentielle du Nasdaq-100. Cette stratégie cherche des distributions régulières avec un profil différent de celui d’un simple fonds Nasdaq.',
  },
  'low-volatility': {
    whatIs:'Le MSCI World Minimum Volatility construit un portefeuille d’actions développées en tenant compte de leurs variations et de leurs relations entre elles. L’optimisation est soumise à des contraintes : ce n’est pas simplement un classement des actions les moins volatiles.',
    whyInteresting:'La méthode cherche à réduire les fluctuations de l’ensemble plutôt qu’à reproduire les poids du World. Elle permet de suivre cette construction sans calculer soi-même les relations entre les actions.',
    whatToKnow:'Les relations observées entre les titres peuvent changer, notamment pendant une crise. Le fonds peut donc baisser et manquer une partie des fortes hausses. Les contraintes de construction ne garantissent pas une moindre perte à chaque période.',
  },
  'small-caps': {
    whyInteresting:'Cette ligne ajoute les petites entreprises développées qui ne figurent pas dans le MSCI World classique. Elle élargit les tailles de sociétés suivies sans gérer soi-même de nombreuses actions moins liquides.',
  },
  'em-local-bond': {
    whyInteresting:'La ligne donne accès aux taux des États émergents dans leurs propres monnaies. Elle se distingue des emprunts en dollars et permet de suivre ensemble plusieurs marchés obligataires locaux.',
  },
  'support-argent': {
    whatIs:'Cet ETC donne une exposition à de l’argent physique conservé pour garantir les titres. Tu détiens un titre de dette adossé au métal, distinct d’un fonds UCITS et d’actions de sociétés minières.',
    whyInteresting:'La ligne permet de suivre un métal utilisé à la fois pour des usages industriels et comme métal précieux, sans organiser son stockage. Ses débouchés diffèrent de ceux de l’or.',
    whatToKnow:'Un ralentissement industriel peut faire baisser la demande et le prix du métal. L’argent ne verse aucun revenu ; les frais, le change et les risques de conservation ou de structure s’ajoutent aux variations de son cours.',
  },
  'support-ethereum': {
    whatIs:'Ce produit coté donne une exposition à l’ether, la cryptomonnaie du réseau Ethereum. Une partie des actifs participe au staking : elle est engagée dans la validation du réseau pour recevoir des récompenses. Tu détiens un titre de dette, pas directement les clés des actifs.',
    whyInteresting:'La ligne permet d’accéder à l’ether et au mécanisme de staking prévu par le produit depuis un compte-titres. La conservation et les opérations de validation sont organisées par la structure.',
    whatToKnow:'Les fortes variations de l’ether dominent le résultat. Le staking ajoute des risques techniques, de blocage des actifs et de pénalités de validation. Les récompenses ne garantissent ni un rendement positif ni le bon fonctionnement de la conservation.',
  },
})

const multiAsset = [
  ['lifestrategy20','La poche obligataire domine : les mouvements des taux et du crédit comptent davantage que dans les versions plus investies en actions.'],
  ['lifestrategy40','Les obligations restent majoritaires, avec une part d’actions plus marquée que dans la version la plus prudente.'],
  ['lifestrategy60','Les actions sont majoritaires : leurs baisses peuvent peser fortement malgré la présence d’obligations.'],
  ['lifestrategy80','La forte place des actions rapproche le risque de celui des marchés boursiers ; la poche obligataire reste minoritaire.'],
]
for (const [id,emphasis] of multiAsset) REVIEWED_EXPOSURE_COPY[id] = {
  whyInteresting:`La ligne confie à Vanguard l’ajustement de la répartition entre fonds actions et obligations. ${emphasis} Elle évite de gérer soi-même ces mouvements entre plusieurs fonds.`,
  whatToKnow:'Une hausse des taux peut faire baisser les obligations au moment où les actions reculent aussi. Le rééquilibrage ne garantit donc pas une protection. La couverture vers l’euro concerne la poche obligataire, pas l’ensemble des monnaies du portefeuille.',
}
