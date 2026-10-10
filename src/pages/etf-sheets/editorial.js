// Les parts d’une même exposition partagent une intention éditoriale, jamais leurs données.
const PRESENTATION_COPY = Object.fromEntries([
  [['gaming_vaneck'], {
    hook: 'Le jeu vidéo ne se résume pas aux consoles que tu as chez toi. Cet ETF réunit des entreprises qui vivent aussi des jeux et de l’eSport 👇',
    whyInteresting: 'Tu cibles les éditeurs, développeurs et activités liées au jeu vidéo plutôt que tout le secteur technologique. Le panier contient notamment des entreprises japonaises, chinoises et américaines.\n\nCe qui m’intéresse ici, c’est de regarder quelles entreprises tirent réellement leurs revenus du jeu vidéo, au-delà des marques qu’on connaît.',
  }],
  [['medical_innovation_ishares'], {
    hook: 'Investir dans la santé peut vouloir dire suivre tout le secteur ou chercher les entreprises qui développent de nouveaux traitements et équipements. Cet ETF fait ce second choix 👇',
    whyInteresting: 'Tu peux comparer cette sélection tournée vers l’innovation à un secteur santé large ou aux seules biotechnologies américaines. Pour moi, la différence commence là : ces trois approches ne couvrent pas les mêmes entreprises.',
  }],
  [['acwi_imi_spdr'], {
    hook: 'Pays développés, émergents et petites entreprises : cet ETF les rassemble dans une seule ligne. Voici ce que cette couverture mondiale comprend 👇',
    whyInteresting: 'Tu réunis les marchés développés, les émergents et les petites capitalisations sans gérer plusieurs fonds. Ce que je retiens, c’est cette couverture plus large qu’un World classique. La répartition suit toutefois l’indice : tu ne choisis pas séparément le poids de chaque ensemble.',
  }],
  [['sp500_equal_weight'], {
    hook: 'Dans le S&P 500, les plus grandes entreprises occupent le plus de place. Cet ETF change la règle en redonnant le même poids à chacune lors des rééquilibrages 👇',
    whyInteresting: 'Tu gardes les entreprises du S&P 500, mais tu répartis autrement ton argent entre elles. C’est ce que je trouve intéressant à comparer : le changement vient des poids, pas de l’ajout d’un nouveau marché.',
  }],
  [['russell2000_spdr'], {
    hook: 'La Bourse américaine ne se limite pas à ses grands groupes. Cet ETF suit le Russell 2000 pour faire une place aux petites entreprises américaines 👇',
    question: 'Tu ajouterais des petites entreprises américaines à côté des grands groupes ?',
  }],
  [['oblig_em_usd_ishares'], {
    hook: 'On peut investir dans les pays émergents en prêtant aux États, plutôt qu’en achetant des actions. Ici, les obligations sont libellées en dollars 👇',
    question: 'Pour la dette émergente, tu préfères les obligations en dollars ou en monnaies locales ?',
  }],
  [['oblig_eur_long_ishares'], {
    hook: 'Deux ETF d’obligations d’État peuvent réagir très différemment aux taux. Celui-ci détient des emprunts en euros à longue échéance 👇',
    whyInteresting: 'La durée change beaucoup le comportement de ces obligations. Je trouve la comparaison avec les échéances courtes utile : les longues peuvent davantage monter quand les taux baissent, mais aussi davantage reculer quand ils augmentent.',
  }],
  [['world_ex_usa'], {
    hook: 'Tu aimerais choisir toi-même la place des États-Unis dans ton portefeuille mondial ? Cet ETF suit les pays développés en les laissant de côté 👇',
    whyInteresting: 'Tu peux associer ce fonds à une ligne américaine et fixer toi-même leur répartition. Ce qui m’intéresse dans cette construction, c’est ce choix explicite du poids des États-Unis. Cela ne complète pas pour autant tous les marchés absents du World.',
  }],
  [['pea_global_amundi'], {
    hook: 'Réunir pays développés et émergents dans ton PEA sans gérer deux ETF séparés, c’est l’idée de ce fonds qui suit le MSCI ACWI 👇',
    whyInteresting: 'Tu gardes une seule ligne mondiale au lieu de gérer séparément World et émergents. J’apprécie la simplicité de cette approche : leur poids suit l’indice, sans rééquilibrage à faire toi-même entre les deux poches.',
  }],
  [['obligations-etat-0-1'], {
    hook: 'Les obligations d’État ne se comportent pas toutes de la même façon. Cet ETF se concentre sur les échéances très courtes en euros 👇',
    question: 'Pour une poche obligataire, quelle place accordes-tu à la durée des emprunts ?',
  }],
  [['obligations-globales-eur'], {
    hook: 'Un ETF obligataire mondial peut aussi bouger avec les devises. Cette part ajoute une couverture en euros pour en limiter l’effet 👇',
    whyInteresting: 'Tu réunis de nombreux emprunteurs et plusieurs marchés, avec des revenus qui restent investis dans le fonds. Je distingue bien les deux risques ici : la couverture limite l’effet du change, mais les prix des obligations peuvent toujours varier.',
  }],
  [['obligations-inflation'], {
    hook: '« Indexé sur l’inflation » peut donner l’impression d’un placement à l’abri des baisses. Regardons ce que cela signifie pour les obligations de cet ETF 👇',
    whyInteresting: 'Tu retrouves plusieurs emprunts dont les paiements sont liés à l’inflation, avec des revenus réinvestis dans cette part. Ce que je garde en tête, c’est que cet ajustement ne stabilise pas le prix de l’ETF : les deux peuvent évoluer différemment.',
  }],
  [['em-ex-chine'], {
    hook: 'Les marchés émergents t’intéressent, mais tu voudrais choisir séparément ton exposition à la Chine ? Cet ETF l’exclut de sa sélection 👇',
    question: 'Tu garderais la Chine dans ton ETF émergents ou tu choisirais son poids à part ?',
  }],
  [['inde'], {
    hook: 'Investir dans les émergents ou se concentrer sur l’Inde, ce n’est pas la même exposition. Cet ETF fait une place dédiée aux entreprises indiennes 👇',
  }],
  [['infrastructures'], {
    hook: 'Derrière les réseaux et les infrastructures, il y a aussi des entreprises cotées. Cet ETF permet de suivre plusieurs de ces acteurs 👇',
  }],
  [['sp500-spea'], {
    hook: 'Cet ETF permet de suivre les grandes entreprises américaines du S&P 500 dans ton PEA. Voici son fonctionnement et les points à comparer avec les autres fonds disponibles 👇',
  }],
  [['topix-pea-hedged'], {
    hook: 'Quand tu investis au Japon, le yen peut modifier ton résultat en euros. Cet ETF accessible dans le PEA ajoute une couverture du change 👇',
    whyInteresting: 'Tu détiens des actions japonaises dans ton PEA avec une couverture qui limite l’influence du yen. Je regarde ce choix dans les deux sens : la couverture a un coût et peut aussi retirer l’effet favorable d’une hausse de la monnaie japonaise.',
  }],
  [['sp500'], {
    hook: 'Les grandes entreprises américaines sont déjà très présentes dans un World. Cet ETF permet de leur donner une place dédiée dans ton PEA 👇',
    whyInteresting: 'La réplication synthétique rend le S&P 500 accessible dans ton PEA, sans acheter chaque action séparément. Avant d’ajouter cette ligne, je regarderais surtout la place que ces entreprises occupent déjà dans le reste du portefeuille.',
  }],
  [['support-sp500_ishares'], {
    hook: 'Suivre les grandes entreprises américaines sans choisir chaque action, c’est ce que propose cet ETF S&P 500. Voici ce que tu détiens avec cette ligne 👇',
    question: 'Tu garderais le S&P 500 seul ou tu lui ajouterais d’autres marchés ?',
  }],
  [['nasdaq100','support-nasdaq100_ishares'], {
    hook: 'Le Nasdaq-100 revient souvent quand on parle des grands groupes technologiques. Cet ETF permet de suivre cet indice, dont plusieurs entreprises sont déjà dans les fonds mondiaux 👇',
    question: 'Si tu as déjà un World ou un S&P 500, quelle place laisserais-tu au Nasdaq-100 ?',
  }],
  [['eurostoxx50','support-eurostoxx50_ishares'], {
    hook: 'Pour investir en Europe, tu peux suivre un marché large ou te concentrer sur les grandes entreprises de la zone euro. Cet ETF suit cette seconde approche avec l’EURO STOXX 50 👇',
    question: 'Pour ta poche européenne, tu choisirais la zone euro ou une exposition plus large ?',
  }],
  [['msci-acwi','support-msci_acwi'], {
    hook: 'Un World classique laisse les émergents de côté. Cet ETF MSCI ACWI les réunit avec les pays développés dans la même ligne 👇',
    question: 'Tu laisserais l’indice fixer la place des émergents ou tu la choisirais toi-même ?',
  }],
  [['ftse-all-world'], {
    hook: 'Cet ETF All-World rassemble pays développés et émergents. Voici comment il permet de suivre ces marchés sans gérer plusieurs lignes 👇',
  }],
  [['sante-biotech'], {
    hook: 'Un traitement prometteur ne suffit pas à faire une bonne action en Bourse. Cet ETF répartit l’exposition entre plusieurs entreprises de biotechnologie 👇',
  }],
  [['energie'], {
    hook: 'Acheter des actions d’entreprises énergétiques, ce n’est pas acheter directement du pétrole. Voici l’exposition que propose cet ETF sectoriel 👇',
  }],
  [['defense'], {
    hook: 'Les contrats de défense attirent l’attention sur plusieurs entreprises cotées. Cet ETF les réunit dans une ligne dédiée : regardons ce qu’il contient 👇',
  }],
  [['eau'], {
    hook: 'L’eau est indispensable, mais un ETF eau reste un investissement dans des entreprises. Voici les activités auxquelles ce fonds donne accès 👇',
    whyInteresting: 'Tu réunis plusieurs métiers liés à l’eau sans choisir chaque entreprise. Ce que je regarde derrière ce thème, c’est la manière dont ces activités produisent des revenus : le besoin d’eau ne dit pas, à lui seul, quels actionnaires en profiteront.',
  }],
  [['luxe'], {
    hook: 'Une marque de luxe peut être connue dans le monde entier sans que son action soit toujours une bonne affaire. Cet ETF rassemble plusieurs groupes du secteur 👇',
  }],
  [['financieres'], {
    hook: 'Le secteur financier ne se résume pas aux banques. Cet ETF réunit plusieurs de ses métiers : voici ce qu’il ajoute à un portefeuille 👇',
  }],
  [['immobilier-reit','support-foncieres_etf','support-immo_gpr'], {
    hook: 'Investir dans l’immobilier depuis la Bourse, sans gérer de locataires, c’est possible avec les sociétés immobilières cotées. Voici celles que cet ETF permet de suivre 👇',
    question: 'Pour l’immobilier, tu préfères des parts cotées en Bourse ou un placement moins liquide ?',
  }],
  [['support-foncieres_etf_dist'], {
    hook: 'Des revenus immobiliers versés par un ETF, ça peut attirer l’attention. Ce fonds détient des sociétés cotées, avec des parts dont le prix varie aussi en Bourse 👇',
    question: 'Pour tes revenus immobiliers, quelle importance donnes-tu à la variation de la valeur des parts ?',
  }],
  [['technologie'], {
    hook: 'Ajouter un ETF technologique à un World peut renforcer des entreprises que tu détiens déjà. Voici l’exposition de cette ligne dédiée 👇',
  }],
  [['quantique'], {
    hook: 'Le quantique fait beaucoup parler de lui, mais les entreprises du secteur n’en sont pas toutes au même stade. Cet ETF en réunit plusieurs 👇',
  }],
  [['robotique'], {
    hook: 'Les robots et l’automatisation prennent une place croissante dans de nombreuses activités. Cet ETF permet de regarder les entreprises qui développent ces solutions 👇',
  }],
  [['blockchain'], {
    hook: 'On peut investir dans des entreprises liées à la blockchain sans acheter directement de cryptomonnaies. C’est l’approche de cet ETF 👇',
  }],
  [['nucleaire'], {
    hook: 'Investir dans le nucléaire peut passer par des entreprises aux activités très différentes. Cet ETF rassemble plusieurs acteurs de la filière 👇',
  }],
  [['batteries-ve'], {
    hook: 'Les batteries servent aux véhicules électriques, mais aussi au stockage d’énergie. Cet ETF permet de suivre plusieurs entreprises de cette chaîne 👇',
  }],
  [['spatial'], {
    hook: 'Derrière les projets spatiaux, il y a des entreprises cotées avec des activités déjà bien concrètes. Cet ETF en rassemble plusieurs 👇',
  }],
  [['dividendes'], {
    hook: 'Un dividende qui augmente au fil des années peut attirer l’attention. Cet ETF sélectionne des entreprises américaines selon leur historique de distribution 👇',
  }],
  [['low-volatility'], {
    hook: 'Rester investi en actions tout en cherchant des variations moins fortes, c’est l’objectif de cet ETF. Voici comment sa sélection se distingue d’un World classique 👇',
  }],
  [['value'], {
    hook: 'Une action moins chère que les autres peut donner envie, mais encore faut-il comprendre pourquoi. Cet ETF sélectionne des entreprises selon des critères de valorisation 👇',
  }],
  [['small-caps'], {
    hook: 'Les petites entreprises des pays développés ne font pas partie du MSCI World classique. Cet ETF leur donne une place à côté des grands groupes 👇',
  }],
  [['quality'], {
    hook: 'La rentabilité et l’endettement peuvent aussi servir à sélectionner des actions. Cet ETF suit des critères de qualité financière plutôt que la seule taille des entreprises 👇',
    whyInteresting: 'Tu donnes davantage de place à ces caractéristiques financières sans analyser chaque entreprise toi-même. Je garde toutefois le prix d’achat en tête : une entreprise solide peut être un investissement décevant si son action est payée trop cher.',
  }],
  [['momentum'], {
    hook: 'Certaines stratégies privilégient les actions dont les cours ont récemment bien évolué. Cet ETF suit cette approche, appelée momentum 👇',
  }],
  [['or','support-or','support-or_wisdomtree','support-or_amundi'], {
    hook: 'Tu peux suivre le cours de l’or depuis ton compte-titres sans stocker de lingots chez toi. Voici comment fonctionne cet ETC adossé au métal 👇',
    question: 'Tu ferais une place à l’or dans ton portefeuille ? Pour quelle raison ?',
  }],
  [['bitcoin','support-bitcoin_wisdomtree','support-bitcoin_etcgroup','support-bitcoin_21shares'], {
    hook: 'Suivre le bitcoin depuis un compte-titres évite de gérer soi-même des clés privées. Ce produit coté ajoute toutefois une structure et des frais à comprendre 👇',
    question: 'Pour le bitcoin, tu préfères la détention directe ou un produit coté ?',
  }],
  [['obligations-etat'], {
    hook: 'Prêter aux États via un ETF donne une autre exposition qu’acheter des actions. Le prix des obligations peut pourtant varier lui aussi 👇',
  }],
  [['high-yield'], {
    hook: 'Des obligations qui versent davantage d’intérêts, ça peut sembler intéressant. Cet ETF prête à des entreprises moins bien notées et distribue les revenus 👇',
  }],
  [['high-yield-acc'], {
    hook: 'Cet ETF suit des obligations d’entreprises à haut rendement et réinvestit les intérêts. Voici ce que ce choix change, et les risques qui restent 👇',
  }],
  [['corp-bond-ig','support-oblig_corp_amundi','support-oblig_corp_vanguard','support-oblig_corp_spdr'], {
    hook: 'On peut investir dans une entreprise en lui prêtant de l’argent plutôt qu’en achetant son action. Cet ETF réunit des obligations d’entreprises de catégorie investment grade 👇',
    question: 'Pour tes obligations, tu regardes surtout la qualité des emprunteurs ou la durée des prêts ?',
  }],
  [['em-local-bond'], {
    hook: 'Avec les obligations émergentes en monnaies locales, tu t’exposes aussi aux devises de ces pays. Voici ce que cela change pour cet ETF 👇',
  }],
  [['support-msci_world','support-msci_world_ishares'], {
    hook: 'Un ETF World permet de suivre de nombreuses entreprises sans les choisir une par une. Regardons ce que cette exposition aux pays développés comprend 👇',
    question: 'Tu gardes un World seul ou tu ajoutes les marchés qu’il ne couvre pas ?',
  }],
  [['support-lqq'], {
    hook: 'Un levier quotidien sur le Nasdaq-100 peut amplifier les mouvements. Avec cet ETF, la durée de détention compte aussi pour comprendre le résultat 👇',
    question: 'Comment prendrais-tu en compte le levier quotidien avant d’utiliser ce fonds ?',
  }],
  [['support-cl2'], {
    hook: 'Cet ETF utilise un levier quotidien sur les actions américaines. Voici pourquoi son résultat sur plusieurs jours ne se lit pas comme un simple multiple de celui du marché 👇',
    question: 'Tu utilises des ETF à levier ou tu préfères garder une exposition sans levier ?',
  }],
  [['support-cac40'], {
    hook: 'Le CAC 40 rassemble de grands groupes cotés en France, dont les activités dépassent souvent le pays. Cet ETF permet de les suivre dans une seule ligne 👇',
    question: 'Tu donnerais une place dédiée au CAC 40 dans ton portefeuille ?',
  }],
  [['support-msci_europe'], {
    hook: 'Investir en Europe ne veut pas forcément dire se limiter à la zone euro. Cet ETF MSCI Europe suit une exposition plus large 👇',
    question: 'Pour l’Europe, tu préfères un marché large ou une sélection de pays ?',
  }],
  [['support-sect_sante'], {
    hook: 'La santé rassemble plusieurs activités, au-delà des nouveaux traitements. Cet ETF permet de suivre le secteur sans se concentrer sur les seules biotechnologies 👇',
    question: 'Pour la santé, tu choisirais le secteur large ou un thème plus ciblé ?',
  }],
  [['support-argent'], {
    hook: 'L’argent est à la fois un métal précieux et une matière utilisée par l’industrie. Cet ETC permet de suivre son cours sans stocker le métal toi-même 👇',
    question: 'Tu envisagerais une place pour l’argent à côté de l’or ?',
  }],
  [['support-mp_large','support-mp_large_icom'], {
    hook: 'Une exposition aux matières premières peut réunir plusieurs marchés plutôt qu’un seul métal. Voici comment cet ETF construit cette sélection 👇',
    question: 'Pour les matières premières, tu choisirais un panier large ou une exposition précise ?',
  }],
  [['support-ethereum'], {
    hook: 'Ce produit coté permet de suivre l’ether depuis un compte-titres. La simplicité d’accès ne retire pas les fortes variations de cette cryptomonnaie 👇',
    question: 'Pour l’ether, tu préfères gérer toi-même sa conservation ou utiliser un produit coté ?',
  }],
  [['support-strat_dividendes_dist'], {
    hook: 'Recevoir des dividendes compte, mais leur régularité peut aussi guider la sélection. Cet ETF suit des entreprises retenues selon cet historique 👇',
  }],
  [['support-high_dividend','support-high_dividend_dist'], {
    hook: 'Un dividende élevé peut attirer l’œil sans raconter toute l’histoire d’une action. Cet ETF rassemble des entreprises sélectionnées selon ce critère 👇',
  }],
  [['support-quality_dividend','support-quality_dividend_dist'], {
    hook: 'Pour sélectionner des actions à dividendes, cet ETF regarde aussi la qualité financière des entreprises. Voici ce que cette approche privilégie 👇',
  }],
  [['support-msci_em_amundi','support-msci_em_spdr'], {
    hook: 'Les émergents ajoutent des entreprises absentes d’un MSCI World. Cet ETF suit leurs grandes et moyennes capitalisations 👇',
    question: 'Tu préfères choisir la place des émergents à part ou les intégrer dans une ligne mondiale ?',
  }],
  [['support-ftse_em_vanguard'], {
    hook: 'Les indices émergents ne retiennent pas tous les mêmes marchés. Cet ETF suit la sélection de FTSE : voici l’exposition qu’il propose 👇',
    question: 'Tu compares la composition des indices avant de choisir ton ETF émergents ?',
  }],
  [['support-oblig_etat_eur_short'], {
    hook: 'La durée des prêts compte aussi quand tu investis dans des obligations d’État. Cet ETF se concentre sur des échéances courtes en zone euro 👇',
    question: 'Tu préfères des obligations courtes ou tu acceptes davantage de sensibilité aux taux ?',
  }],
  [['support-tech_europe'], {
    hook: 'La technologie ne se limite pas aux entreprises américaines. Cet ETF fait une place dédiée aux acteurs européens du secteur 👇',
    question: 'Tu choisirais une ligne technologique européenne ou une exposition mondiale ?',
  }],
  [['support-smallcap_europe'], {
    hook: 'Les grands groupes ne représentent pas toute la Bourse européenne. Cet ETF permet de suivre ses petites entreprises 👇',
    question: 'Tu ferais une place aux petites entreprises européennes à côté des grands groupes ?',
  }],
  [['support-sect_energie'], {
    hook: 'Cet ETF suit les entreprises d’énergie du S&P 500. Tu investis dans leurs activités et leurs bénéfices, avec une exposition différente du cours du pétrole 👇',
    question: 'Pour l’énergie, tu t’intéresses aux entreprises ou directement aux matières premières ?',
  }],
  [['support-sect_tech'], {
    hook: 'Les entreprises technologiques américaines sont déjà présentes dans plusieurs indices larges. Cet ETF permet de renforcer précisément celles du S&P 500 👇',
    question: 'Quelle place la technologie occupe-t-elle déjà dans tes autres ETF ?',
  }],
  [['support-sect_energie_propre'], {
    hook: 'Les énergies propres peuvent se développer sans que toutes leurs entreprises gagnent davantage d’argent. Cet ETF permet de regarder celles qui composent cette exposition 👇',
    question: 'Tu investirais dans les énergies propres via un ETF dédié ?',
  }],
  [['support-sect_conso_defensive'], {
    hook: 'On continue d’acheter des produits du quotidien même quand l’économie ralentit. Cet ETF suit des entreprises américaines de consommation courante 👇',
    question: 'Tu ferais une place dédiée à la consommation courante dans ton portefeuille ?',
  }],
  [['support-sect_utilities'], {
    hook: 'Les services collectifs reposent aussi sur des entreprises cotées. Cet ETF réunit celles du S&P 500 : regardons ce qui fait évoluer leurs résultats 👇',
    question: 'Les services collectifs auraient-ils une place dédiée dans ton portefeuille ?',
  }],
  [['support-dividend_leaders'], {
    hook: 'Le montant d’un dividende compte, mais la capacité à continuer de le verser aussi. Cet ETF sélectionne des entreprises des pays développés selon ces critères 👇',
  }],
  [['support-oblig_hy_amundi'], {
    hook: 'Des intérêts plus élevés rémunèrent aussi un risque de remboursement plus important. Voici les obligations d’entreprises que suit cet ETF high yield 👇',
    question: 'Tu accepterais davantage de risque de crédit pour espérer plus d’intérêts ?',
  }],
  [['support-oblig_etat_us'], {
    hook: 'Prêter à l’État américain, ce n’est pas suivre la Bourse américaine. Cet ETF donne une exposition aux obligations du Trésor, avec l’effet des taux et du dollar 👇',
    question: 'Pour des obligations américaines, quelle place accordes-tu au risque de change ?',
  }],
  [['support-actions_japon'], {
    hook: 'Les entreprises japonaises ont leur propre place dans les marchés mondiaux. Cet ETF permet de leur consacrer une ligne, avec une exposition au yen 👇',
    question: 'Tu garderais le Japon dans ton ETF mondial ou tu lui donnerais une ligne dédiée ?',
  }],
  [['support-actions_coree'], {
    hook: 'Les semi-conducteurs occupent une place importante dans la Bourse sud-coréenne. Cet ETF permet de suivre ce marché sans choisir chaque entreprise 👇',
    question: 'Tu investirais en Corée du Sud séparément ou à travers un ETF émergents ?',
  }],
  [['support-actions_taiwan'], {
    hook: 'Taïwan joue un rôle important dans les semi-conducteurs. Cet ETF suit ses entreprises cotées, avec une exposition concentrée sur ce marché 👇',
    question: 'Tu donnerais une place dédiée à Taïwan dans ton portefeuille ?',
  }],
  [['support-actions_asie_ex_japon'], {
    hook: 'Cet ETF réunit plusieurs marchés d’Asie en laissant le Japon de côté. Voici ce que cette sélection ajoute à une exposition mondiale 👇',
    question: 'Pour l’Asie, tu choisirais un panier de pays ou quelques marchés séparés ?',
  }],
  [['support-sect_financieres'], {
    hook: 'Le crédit et les taux influencent les entreprises financières de différentes façons. Cet ETF permet de suivre celles du S&P 500 👇',
    question: 'Tu renforcerais les entreprises financières ou tu garderais leur poids dans un indice large ?',
  }],
].flatMap(([ids, copy]) => ids.map(id => [id, copy])))

const OVERRIDES = {
  'msci-em': {
    hook: 'Un ETF World couvre beaucoup de pays, mais les marchés émergents n’en font pas partie. Cet ETF permet de leur faire une place dans ton portefeuille 👇',
    whyInteresting: 'Tu ajoutes des entreprises de pays absents du MSCI World, avec aussi des petites capitalisations.\n\nCe que je trouve intéressant ici, c’est de pouvoir choisir la place des émergents dans le portefeuille. Cela élargit l’exposition, mais les risques politiques et les variations des monnaies restent à prendre en compte.',
  },
  'covered-call': {
    hook: 'Recevoir de l’argent chaque mois avec un ETF, ça peut donner envie. Avec ce fonds, ces distributions viennent d’une stratégie qui limite aussi une partie de la hausse du Nasdaq-100 👇',
    whyInteresting: 'Cette stratégie vise des versements réguliers, ce qui peut intéresser quelqu’un qui cherche des revenus.\n\nPour ma part, je regarde aussi ce que devient la valeur des parts. Les sommes reçues comptent, mais c’est en les ajoutant à cette évolution qu’on peut comparer le résultat à celui d’un ETF Nasdaq-100 classique.',
  },
  'monetaire-eur': {
    hook: 'Tu as peut-être déjà croisé XEON en cherchant où placer des euros sur ton compte-titres. Son rendement suit les taux au jour le jour : voici comment cet ETF fonctionne 👇',
    whyInteresting: 'Le rendement vient des taux courts en euros. Les revenus restent investis dans le fonds, puisque cette part est capitalisante.\n\nC’est surtout ce lien avec les taux que je retiens : si ceux-ci baissent, le rendement du placement baisse aussi.',
  },
  ia: {
    hook: '🤖 Quand on parle d’investissement dans l’IA, on pense souvent aux fabricants de puces. Cet ETF va aussi chercher du côté des logiciels et des applications 👇',
    whatIs: 'Cet ETF suit un indice qui sélectionne des entreprises liées à plusieurs activités de l’intelligence artificielle : infrastructures, logiciels et applications.\n\nIl ne se limite donc pas aux fabricants de puces ou aux entreprises qui développent des modèles d’IA.',
    whyInteresting: 'Tu réunis plusieurs activités liées à l’IA dans une seule ligne.\n\nC’est ce qui m’intéresse ici : comprendre quelles entreprises le fonds retient derrière ce thème très large. Deux ETF portant « IA » dans leur nom ne proposent pas forcément la même exposition.\n\nLa sélection dépend des règles de l’indice : toutes les entreprises associées à l’IA ne sont pas forcément présentes.',
    whatToKnow: 'Le développement de l’IA ne garantit pas la hausse des actions de ces entreprises.\n\nTu peux aussi détenir certaines de ces sociétés dans ton ETF World ou technologique. Ajouter ce fonds peut renforcer une exposition que tu as déjà.',
    verdict: 'L&G Artificial Intelligence rassemble plusieurs métiers liés à l’IA. Pour comprendre ce que tu achètes, regarde les entreprises détenues et leur poids, au-delà du nom du thème.',
    question: 'Tu voudrais investir dans toute la chaîne de l’IA ou privilégier une activité précise ?',
  },
  'msci-world': {
    hook: '🌍 Investir dans plusieurs pays avec une seule ligne dans ton PEA, c’est ce que permet cet ETF World 👇',
    whatIs: 'Cet ETF suit le MSCI World : de grandes et moyennes entreprises de pays développés, dans plusieurs secteurs.\n\nLes entreprises ayant les plus grosses capitalisations occupent le plus de place. Les États-Unis et leurs grands groupes pèsent donc fortement dans cette exposition.',
    whyInteresting: 'Tu suis de grandes et moyennes entreprises de pays développés, sans sélectionner les actions une par une.\n\nCe que j’apprécie dans cette approche, c’est de ne pas avoir à deviner quelles entreprises feront les meilleures performances. En revanche, les émergents et les petites capitalisations restent en dehors.\n\nLa réplication synthétique permet de rendre cette exposition accessible dans un PEA.',
    whatToKnow: 'Le MSCI World n’inclut ni les marchés émergents ni les petites capitalisations.\n\nDétenir beaucoup d’entreprises ne signifie pas que chaque pays a le même poids. Et cet ETF reste exposé aux baisses des marchés actions.',
    verdict: 'Amundi PEA Monde permet de suivre le MSCI World dans ton PEA. Si tu veux aussi des émergents ou des petites capitalisations, ces expositions sont à chercher ailleurs.',
    question: 'Dans ton PEA, tu gardes un World seul ou tu ajoutes d’autres expositions à côté ?',
  },
}

// Explications propres aux expositions ; aucun chiffre de marché figé dans la copie.
const EXPOSURE_COPY = {
  'basic-resources-pea': {
    hook: '⛏️ Les entreprises qui produisent des matières premières ont aussi leurs coûts et leurs marges. Cet ETF permet de les suivre dans ton PEA 👇',
    whatIs: 'L’indice regroupe les entreprises du secteur des ressources de base présentes dans le STOXX Europe 600. Tu investis dans leurs actions : leur activité peut s’étendre bien au-delà de l’Europe.',
    whyInteresting: 'Tu réunis ces entreprises dans une seule ligne de ton PEA, sans les sélectionner une par une.\n\nQuand le prix de leurs matières premières augmente, leurs revenus peuvent en profiter. Mais si leurs coûts d’énergie ou d’exploitation augmentent aussi, leurs bénéfices ne suivent pas forcément.',
    whatToKnow: 'La sélection se concentre sur un seul secteur, sensible aux prix des matières premières et au cycle industriel.\n\nSi tu détiens déjà un ETF Europe large, certaines de ces entreprises peuvent être présentes dans ton portefeuille. Ajouter cet ETF revient alors à renforcer leur poids.',
    closing: 'Tu investis donc dans des producteurs, avec leurs coûts et leurs marges. C’est une exposition différente d’un ETC qui suit le cours d’un métal.',
    question: 'Tu as déjà un ETF sectoriel dans ton portefeuille ?',
  },
  semiconducteurs: {
    hook: '💻 Les semi-conducteurs sont présents dans de nombreuses activités. Cet ETF réunit plusieurs entreprises du secteur pour ne pas faire reposer toute cette exposition sur un seul fabricant 👇',
    whyInteresting: 'Tu réunis plusieurs entreprises du secteur sans devoir sélectionner un seul fabricant.\n\nLeurs résultats dépendent aussi des commandes, des stocks et des investissements : une hausse de la demande ne profite pas forcément à toutes au même moment.',
    whatToKnow: 'La sélection reste concentrée sur une industrie. Un ralentissement des commandes ou des restrictions commerciales peut peser sur plusieurs entreprises à la fois.\n\nSi tu détiens déjà un ETF World ou technologique, certaines de ces sociétés peuvent être présentes. Cette ligne renforce alors leur poids.',
    question: 'Tu as une ligne dédiée aux semi-conducteurs ou tu les gardes dans tes ETF plus larges ?',
  },
  cybersecurite: {
    hook: '🔐 Protéger les données et les réseaux fait vivre plusieurs entreprises cotées. Cet ETF réunit des acteurs de la sécurité numérique : voici ce qu’il contient 👇',
    whyInteresting: 'Tu réunis plusieurs entreprises de sécurité numérique sans les choisir une par une.\n\nLe besoin de protéger les systèmes explique leur activité. Leurs profits dépendent aussi de la concurrence, des contrats remportés et du coût de développement de leurs produits.',
    whatToKnow: 'La croissance des besoins de cybersécurité ne garantit pas la hausse de ces actions. Les attentes peuvent déjà être intégrées dans leurs cours.\n\nCertaines entreprises peuvent aussi être présentes dans tes ETF mondiaux ou technologiques : ajouter cette ligne augmente alors leur poids.',
    question: 'Tu as déjà un ETF thématique dans ton portefeuille ?',
  },
}

export function getPresentationCopy(etf) {
  const exposureId = etf.id === 'support-sect_cybersecurite' ? 'cybersecurite' : etf.id
  const copy = { ...etf, ...PRESENTATION_COPY[etf.id], ...OVERRIDES[etf.id], ...EXPOSURE_COPY[exposureId] }
  const question = copy.question.startsWith('Pour cette exposition, tu regardes')
    ? ['Sectoriels classiques', 'Thématiques émergentes'].includes(copy.category)
      ? 'Tu as déjà un ETF sectoriel ou thématique dans ton portefeuille ?'
      : copy.category === 'Obligataires'
        ? 'Dans tes ETF obligataires, tu regardes surtout la durée ou la qualité des emprunteurs ?'
        : 'Tu détiens déjà cette exposition dans ton portefeuille ?'
    : copy.question
  return { ...copy, question, aum: copy.aum.replace(/^(?:Part|Fonds)\s*:\s*/, '') }
}

export function presentationTicker(etf) {
  return etf.isin === 'FR001400U5Q4' ? '' : etf.listing?.ticker ?? ''
}
