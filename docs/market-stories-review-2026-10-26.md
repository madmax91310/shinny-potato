# Histoires de marchés — revue du 26 octobre 2026

Base de départ : master `4f111fdf`, réactualisée sur `4a9a6967` avant la validation finale. Consignes : `CLAUDE.md`, audit du 18 octobre (règles éditoriales et contrat de l’outil), puis code et interface réellement en place. PR concurrentes lues : #969 (reprise de données, désormais fusionnée), #970 (radar), #971 (relief des indices). Aucun de leurs fichiers fonctionnels n’est modifié ici.

## État constaté et résultat

L’interface initiale proposait 112 entrées : 50 récits fixes récents, 14 fiches héritées et 48 mesures mensuelles. Lecture exhaustive dans Chromium, après sélection de chaque entrée et ouverture des précisions. 62 fiches n’offraient aucun lien cliquable de source ; 8 textes contenaient réellement « je », « mon » ou « mes » (détection avec limites de mots Unicode, sans confondre « même » avec « me »).

- 30 récits récents conservés mot pour mot, avec leurs dates et dossiers de sources.
- 30 récits réécrits : 20 récits récents et 10 fiches héritées.
- 17 récits ajoutés, écrits et relus individuellement.
- 52 repères existants clarifiés : 48 mesures mensuelles et 4 fiches statistiques. Ils restent lisibles, recherchables et copiables ; ils ne sont pas présentés comme de nouvelles histoires humaines.
- Total : 129 entrées, dont 77 récits fixes. Les 112 identifiants initiaux sont conservés.

Le tirage « Histoire aléatoire » parcourt les 77 récits relus, sans répétition avant épuisement. Les repères restent dans le sélecteur existant et ses familles. Trois familles supplémentaires facilitent la sélection : investisseurs, indices, épargne. Aucune nouvelle préférence, persistance ou génération narrative. La route `/faits-marquants-marches` reste identique. La copie appelle la même fonction que le texte affiché ; sources et réserves ne sont pas copiées. La mention « Pas un conseil financier. » figure également dans les repères.

Les fonctions de la banque de tweets, ses identifiants et ses données locales ne changent pas. Cette étape enrichit l’outil existant ; elle ne crée pas un second outil.

## Corrections de fond

- **CAC 40 2000–2021** : 6 944,77 est un sommet en séance, pas le record de clôture. La comparaison correcte est 6 922,33 le 4 septembre 2000 / 6 927,03 le 2 novembre 2021. Les dividendes restent exclus.
- **S&P 500 2008** : dépassement du record de clôture le 28 mars 2013, et non le 10 avril. Aucun résultat individuel de récupération n’en est déduit.
- **Dow 1933** : +15,34 % au 15 mars se mesure contre le 3 mars, après une fermeture incluant huit séances normalement ouvrées. Le texte ne décrit plus un rendement sur une séance ordinaire.
- **1929** : retrait des anciennes bornes ambiguës « 25 % en quatre séances » et du prétendu plus bas du XXe siècle. Le récit explique les achats à crédit sans inventer de victime individuelle.
- **Newton** : instructions d’achat/vente documentées ; aucune pensée supposée ni citation apocryphe. Ajout de documents d’archives identifiés.
- **CAC 40 mars 2020** : un cas réel de médiation remplace la seule description d’une chute. Le seuil de 8 € et les spécificités du stop on quote proviennent du rapport AMF ; aucun prix d’exécution ou montant de perte n’est inventé.
- **« 48 corrections / 12 marchés baissiers »** : identifiant et ancienne donnée archivés dans le code, mais chiffres retirés du texte proposé, faute de document d’origine et de bornes retrouvables.
- **« 27 bear markets »** : photographie Hartford/Ned Davis arrêtée à décembre 2024, publiée en juin 2025 ; ni compteur actuel ni calendrier prévisionnel. Le découpage de 2007–2009 est explicité.
- **Séries annuelles** : distinction rendement total USD / prix ; retrait de la prétendue unicité de la séquence 1995–1999, non démontrée par le dossier ancien. Le seuil >20 % est contrôlé dans le tableau NYU.
- **Woodford** : ajout du retrait demandé par le Kent County Council (237 millions de livres) et des dates, à partir du document FCA de 2025, en conservant les réserves sur sa portée juridique.
- **Archegos** : désigné comme structure privée, sans le transformer en fonds d’épargne grand public.

## Récits réécrits

- `story:cisco-stocks-2001` — Cisco : Internet ne rachète pas les stocks : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:worldcom-facture-2002` — WorldCom : les factures transformées en bénéfices : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:satyam-factures-2009` — Satyam : des clients sur le papier : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:madoff-releves-2008` — Madoff : les bénéfices imprimés : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:stanford-depots-2009` — Stanford : un dépôt qui finance le propriétaire : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:theranos-goutte-2018` — Theranos : investir dans une goutte de sang : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:luckin-ventes-2020` — Luckin : inventer les ventes, puis les dépenses : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:ahold-remises-2003` — Ahold : les remises qui fabriquent le bénéfice : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:northern-rock-2007` — Northern Rock : la banque dépendait de demain : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:lehman-clients-2008` — Lehman : même nom, droits différents : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:reserve-primary-2008` — Le dollar qui valait 97 cents : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:svb-retraits-2023` — SVB : 42 milliards réclamés en une journée : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:credit-suisse-at1-2023` — Credit Suisse : une obligation peut absorber le choc : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:volkswagen-options-2008` — Volkswagen : le pari baissier se referme : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:flash-crash-2010` — Le marché tombe plus vite que l’information : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:archegos-banques-2021` — Archegos : plusieurs banques, un même risque : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:woodford-retraits-2019` — Woodford : le bouton de retrait ne suffit plus : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:amaranth-gaz-2006` — Amaranth : le gaz de mars contre celui d’avril : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:ftx-argent-clients-2022` — FTX : le solde n’était plus une réserve : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `story:wework-baux-2019` — WeWork : la flexibilité a un propriétaire : accroche, transitions et chute revues ; faits et conventions conservés, complément documentaire indiqué ci-dessus pour Woodford.
- `records-1987-pire-seance` — 1987 : la protection qui multiplie les ventes : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `newton-south-sea-1720` — Newton avait vendu avant de racheter : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `records-1933-meilleure-seance-dow` — 1933 : une hausse derrière des portes fermées : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `records-2001-nasdaq` — 2001 : le sursaut au milieu du déclin : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `crash-2000-2002` — Nasdaq : quinze ans pour revoir un nombre : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `crash-1929` — 1929 : acheter avec de l’argent emprunté : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `crash-2008` — 2008 : le sommet revient avant la fin des difficultés : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `crash-2020` — 2020 : un sommet boursier pendant la pandémie : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `cac40-record-21-ans` — CAC 40 : le record qui a attendu vingt et un ans : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.
- `cac40-pire-seance-2020` — Le stop à 8 € qui ne garantit pas 8 € : nouveau texte complet ; preuves et réserves réenregistrées dans `reviewed-legacy.json`.

## Récits récents conservés

- `story:enron-retraite-2001` — Enron : le salaire et la retraite dans la même entreprise
- `story:washington-mutual-2008` — Washington Mutual : le compte reste, l’action tombe
- `story:chypre-depots-2013` — Chypre : une partie du dépôt devient du capital
- `story:banco-popular-2017` — Une banque vendue un euro, des comptes préservés
- `story:nikkei-record-2024` — Le record japonais a attendu une génération
- `story:franc-suisse-plancher-2015` — Le plancher du franc était une décision
- `story:ldi-obligations-2022` — Les retraites britanniques ont manqué de liquidités
- `story:overend-gurney-1866` — Le géant auquel la Banque d’Angleterre dit non
- `story:knickerbocker-1907` — Knickerbocker : le secours arrive trop tard
- `story:penn-central-1970` — Quand un chemin de fer bloque le crédit
- `story:continental-illinois-1984` — Une panique sans file devant le guichet
- `story:mexique-tesobonos-1994` — La garantie en dollars qui fragilise le Mexique
- `story:asie-dette-dollar-1997` — La dette grossit sans nouvel emprunt
- `story:russie-dette-1998` — La dette en roubles qui ne rembourse plus
- `story:ltcm-sauvetage-1998` — LTCM : les banques sauvent leur contrepartie
- `story:law-louisiane-1720` — John Law : acheter la Louisiane sur papier
- `story:nyse-fermeture-1914` — Wall Street suspend les échanges
- `story:hunt-argent-1980` — Les frères Hunt manquent de cash, pas d’argent
- `story:livre-sterling-1992` — Une journée pour défendre la livre
- `story:barings-compte-1995` — Barings : le compte 88888
- `story:bcci-fermeture-1991` — BCCI : fermer pour protéger les déposants
- `story:gamestop-collateral-2021` — GameStop : pouvoir acheter devient un enjeu
- `story:knight-code-2012` — Knight : 212 ordres, 460 millions de pertes
- `story:nickel-annulation-2022` — Le nickel monte, puis les transactions disparaissent
- `story:orange-county-1994` — L’argent des écoles mis au levier
- `story:ponzi-coupons-1920` — Ponzi : la poste comme alibi
- `story:icesave-frontiere-2008` — Icesave : l’épargne traverse une frontière
- `story:auction-rate-2008` — Le placement liquide attend une enchère
- `story:immobilier-brexit-2016` — Des immeubles derrière un retrait quotidien
- `story:terra-dollar-2022` — Terra : le dollar qui dépend d’une mécanique

## Ajouts et preuves

Chaque dossier ci-dessous est également consultable dans les précisions de l’interface : titre, organisme, date de publication connue ou absente, date de consultation, faits vérifiables et réserves. Les sources ne sont pas des liens produits à partir de titres supposés : elles ont été consultées avant rédaction. Le relevé d’accès HTTP et les empreintes des documents téléchargés sont dans [le manifeste](market-stories-review-2026-10-26-sources.json).

### Buffett paie ses chaussures avec Berkshire

`story:buffett-dexter-1993` · 1993–2007 · famille `investisseurs`

- [Chairman’s Letter — 1993](https://www.berkshirehathaway.com/letters/1993.html) — Warren Buffett, Berkshire Hathaway, 1994 ; consulté le 2026-10-26. Acquisition de Dexter, 25 203 actions émises et appréciation favorable de ses dirigeants et de sa compétitivité en 1993. Production annuelle supérieure à 7,5 millions de paires.
- [Letter to shareholders — 2007, section Dexter](https://www.berkshirehathaway.com/letters/2007ltr.pdf) — Warren Buffett, Berkshire Hathaway, 2008-02-29 ; consulté le 2026-10-26. 433 millions de dollars en actions à l’achat ; estimation rétrospective de 3,5 milliards à la date de la lettre. Jugement de Buffett sur la disparition de l’avantage concurrentiel et la valeur de Dexter.

Réserves : Deux lettres du même investisseur, l’une contemporaine de l’acquisition, l’autre rétrospective. Les 3,5 milliards sont un coût d’opportunité évalué dans la lettre de 2007, pas une perte comptable supplémentaire ni une valeur actuelle. Aucun cours ajusté n’est extrapolé.

### See’s : payer davantage que les machines

`story:sees-chocolats-1972` · 1972–2007 · famille `investisseurs`

- [Chairman’s Letter — 1983, appendix on goodwill](https://www.berkshirehathaway.com/letters/1983.html) — Warren Buffett, Berkshire Hathaway, 1984-03-14 ; consulté le 2026-10-26. Achat de See’s début 1972 pour 25 millions ; environ 8 millions d’actifs tangibles nets. Rôle économique de la réputation de marque et besoins de financement limités.
- [Letter to shareholders — 2007, section See’s Candy](https://www.berkshirehathaway.com/letters/2007ltr.pdf) — Warren Buffett, Berkshire Hathaway, 2008-02-29 ; consulté le 2026-10-26. Volumes 16 puis 31 millions de livres de confiserie, croissance annualisée proche de 2 %. 1,35 milliard de bénéfices cumulés avant impôts ; 32 millions de capitaux supplémentaires réinvestis ; ventes au comptant et cycle court.

Réserves : Bénéfices d’une entreprise détenue, pas rendement boursier d’une action See’s accessible au public. Montants en dollars nominaux et résultats avant impôts, arrêtés à la lettre de 2007. Les deux analyses proviennent du même dirigeant ; le récit ne généralise pas cette réussite à toutes les marques.

### Keynes change sa façon d’investir

`story:keynes-changer-methode` · Années 1920–1938 · famille `investisseurs`

- [Keynes the investor — Financial history](https://www.jbs.cam.ac.uk/centres/ceam/research/financial-history/keynes/) — Cambridge Judge Business School, date non précisée ; consulté le 2026-10-26. Évolution du market timing vers la sélection de titres au début des années 1930. Ventes après 1929 et démission de National Mutual en 1938 après désaccords.
- [Keynes, King’s and Endowment Asset Management](https://www.nber.org/system/files/chapters/c12860/revisions/c12860.rev2.pdf) — David Chambers, Elroy Dimson et Justin Foo, étude des archives de King’s College, date non précisée ; consulté le 2026-10-26. Reconstitution à partir des rapports et opérations d’investissement conservés aux archives. Mandats distincts, évolution de stratégie et désaccords avec les institutions gérées.

Réserves : Les deux publications se recoupent en partie par leur équipe de recherche ; elles reposent sur des archives identifiées. Le texte distingue le patrimoine du collège des autres mandats. Aucun rendement moyen n’est transformé en rendement promis ou en preuve qu’une stratégie ne perd jamais.

### Le fonds qui déçoit dès sa naissance

`story:bogle-premier-indiciel-1976` · 1976 · famille `investisseurs`

- [Vanguard Celebrates 50th Anniversary of Vanguard 500 Index Fund](https://corporate.vanguard.com/content/corporatesite/us/en/corp/who-we-are/pressroom/press-release-50th-anniversary-vanguard-500-index-fund-083126.html) — Vanguard, 2026-08-31 ; consulté le 2026-10-26. Lancement le 31 août 1976 ; collecte de 11,3 millions contre objectif de 150 millions ; suivi du S&P 500.
- [50 years. 50 facts. Indexing since 1976](https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/50-years-50-facts-indexing-since-1976.html) — Vanguard, 2026 ; consulté le 2026-10-26. Fourchette d’objectif de collecte de 50 à 150 millions, scepticisme initial et continuité du fonds.

Réserves : Deux récits rétrospectifs du promoteur, pas deux confirmations indépendantes. Il s’agit d’un fonds indiciel pour particuliers, pas du premier dispositif indiciel institutionnel mondial. Aucun rendement antérieur au lancement ni patrimoine hypothétique actuel n’est cité.

### Nokia vend ce qui faisait son nom

`story:nokia-cession-2013` · 2013–2014 · famille `entreprises`

- [Microsoft to acquire Nokia’s devices & services business](https://news.microsoft.com/source/2013/09/03/microsoft-to-acquire-nokias-devices-services-business-license-nokias-patents-and-mapping-services/) — Microsoft et Nokia, 2013-09-03 ; consulté le 2026-10-26. Projet de 5,44 milliards d’euros, ventilation 3,79 milliards et licences 1,65 milliard ; activités conservées par Nokia.
- [Nokia completes sale of substantially all of its Devices & Services business to Microsoft](https://www.nokia.com/newsroom/nokia-completes-sale-of-substantially-all-of-its-devices--services-business-to-microsoft/) — Nokia, 2014-04-25 ; consulté le 2026-10-26. Finalisation le 25 avril 2014 ; ajustements de prix et de périmètre à la clôture.

Réserves : L’annonce et la clôture sont deux étapes de la même transaction. Le prix initial n’est pas présenté comme le montant final vérifié au centime. Aucune performance boursière ni récupération de mise n’est déduite de la survie de Nokia.

### Kodak revient, les anciennes actions disparaissent

`story:kodak-nouvelles-actions-2013` · 2012–2013 · famille `entreprises`

- [Form 10-K 2013 — emergence from Chapter 11, Item 5 and Note 2](https://www.sec.gov/Archives/edgar/data/31235/000119312514106388/d693724d10k.htm) — Eastman Kodak, dépôt SEC, 2014 ; consulté le 2026-10-26. Dépôt du 19 janvier 2012, sortie le 3 septembre 2013 et annulation des anciennes actions ordinaires. Nouvelles actions négociées à partir de septembre, admission au NYSE le 1er novembre sous KODK.
- [Annual Report 2013 — shareholders’ equity](https://www.annualreports.com/HostedData/AnnualReportArchive/e/NASDAQ_KODK_2013.pdf) — Eastman Kodak, copie AnnualReports, 2014 ; consulté le 2026-10-26. Distinction Predecessor/Successor et annulation des actions antérieures.
- [Kodak emerges from Chapter 11 bankruptcy after 19 months](https://rbj.net/2013/09/03/kodak-emerges-from-chapter-11-bankruptcy-after-19-months/) — Rochester Business Journal, 2013-09-03 ; consulté le 2026-10-26. Reportage contemporain sur la sortie du chapitre 11, l’annulation des anciennes actions et les nouvelles actions distribuées aux créanciers.

Réserves : Le rapport SEC et son miroir sont un même document, pas deux confirmations indépendantes ; le reportage contemporain apporte un accès complémentaire. La portée concerne les anciennes actions ordinaires et les entités américaines concernées. Aucun graphique pré/post-faillite n’est raccordé artificiellement.

### LEGO vend ses parcs pour garder ses briques

`story:lego-parcs-2005` · 2004–2005 · famille `entreprises`

- [Annual Report 2004 — action plan](https://www.lego.com/cdn/cs/aboutus/assets/blt07abb4b8a3da3f39/Annual_Report_2004_ENG.pdf) — LEGO Group, 2005 ; consulté le 2026-10-26. Crise et plan de redressement de 2004 ; recentrage et cessions prévues.
- [Annual Report 2005 — result of the action plan](https://www.lego.com/cdn/cs/aboutus/assets/blt6eacf5a8b7af1359/Annual_Report_2005_ENG.pdf) — LEGO Group, 2006 ; consulté le 2026-10-26. Décision de vendre LEGOLAND à l’automne 2004, réalisation en juillet 2005 ; prix proche de DKK 2,8 milliards. Participation conjointe LEGO/KIRKBI de 30 % ; liquidité nette positive fin 2005 et risques encore décrits.

Réserves : LEGO est une entreprise privée : aucun rendement d’action cotée n’est inventé. Le prix de cession n’est pas le bénéfice comptable de l’opération. Deux rapports successifs du même groupe, complémentaires et non indépendants.

### Netflix : deux services, une rupture avec les clients

`story:netflix-qwikster-2011` · 2011 · famille `entreprises`

- [Netflix to Offer new Unlimited DVD Plans and Will Separate Streaming and DVD Plans in the U.S.](https://ir.netflix.net/files/doc_news/archive/8ab8f6b7-1ed7-4c0b-9539-5ebb4e212e2d.pdf) — Netflix, 2011-07-12 ; consulté le 2026-10-26. Forfaits distincts DVD et streaming à 7,99 dollars chacun.
- [Q3 2011 Earnings Conference Call — transcript](https://s22.q4cdn.com/959853165/files/doc_financials/quarterly_reports/2011/q3/NFLX-Transcript-2011-10-24T22_00.pdf) — Netflix, transcription de l’échange investisseurs, 2011-10-24 ; consulté le 2026-10-26. Qwikster proposé puis annulé ; appréciation rétrospective de Reed Hastings sur la réaction des clients.
- [Letter to shareholders — Q4 2011, historical subscriber table](https://www.sec.gov/Archives/edgar/data/1065280/000119312512023436/d290258dex991.htm) — Netflix, dépôt SEC, 2012-01 ; consulté le 2026-10-26. Abonnés domestiques uniques : 24,594 millions début T3 et 23,789 millions fin T3, soit baisse nette de 805 000.

Réserves : La baisse est nette, distincte du nombre brut de résiliations. Le récit ne présente pas Qwikster comme sa cause unique et ne transforme pas les commentaires du dirigeant en témoignages individuels inventés. Aucun cours boursier ajusté ou non ajusté n’est comparé.

### Ford met son nom en garantie

`story:ford-logo-garantie-2006` · 2006–2012 · famille `entreprises`

- [Statement on Ford Investment Grade Rating by Moody’s Investors Service](https://www.prnewswire.com/news-releases/statement-on-ford-investment-grade-rating-by-moodys-investors-service-152679665.html) — Ford Motor Company, communiqué diffusé par PR Newswire, 2012-05-22 ; consulté le 2026-10-26. Financement de décembre 2006 : 23,5 milliards, dont 18,5 milliards de dette et facilités garanties et 5 milliards de convertibles non garantis. Marques données en garantie et libération après relèvement de note en mai 2012.
- [Ford’s Debt Rating Upgraded; Blue Oval Logo Is Back](https://www.cbsnews.com/detroit/news/fords-debt-rating-upgraded-blue-oval-logo-is-back/) — CBS Detroit, 2012-05-22 ; consulté le 2026-10-26. Confirmation contemporaine de la libération des actifs et marques après le relèvement de note.

Réserves : Le total de 23,5 milliards inclut plusieurs instruments : il ne s’agit pas intégralement d’un prêt garanti par le seul logo. La marque n’a pas cessé d’être utilisée commercialement. Le récit ne présente pas ce financement comme l’unique explication de la survie de Ford.

### Le Dow continue sans General Electric

`story:ge-sortie-dow-2018` · 1896–2018 · famille `indices`

- [Walgreens Boots Alliance Set to Join Dow Jones Industrial Average](https://press.spglobal.com/2018-06-19-Walgreens-Boots-Alliance-Set-to-Join-Dow-Jones-Industrial-Average) — S&P Dow Jones Indices, 2018-06-19 ; consulté le 2026-10-26. GE membre d’origine en 1896, continuellement depuis 1907, remplacement effectif le 26 juin 2018. Poids de GE inférieur à 0,5 %, pondération par les prix et ajustement du diviseur.
- [Official index notice — GE/Walgreens change](https://www.spglobal.com/spdji/en/documents/indexnews/announcements/20180619-728153/728153_gedjia62018.pdf?force_download=true) — S&P Dow Jones Indices, 2018-06-19 ; consulté le 2026-10-26. Document officiel de l’opérateur précisant les motifs et le traitement du remplacement.

Réserves : La page et le PDF sont deux accès au même communiqué, pas deux confirmations indépendantes. Une exclusion d’indice n’est ni une faillite ni une recommandation de vente. Aucun rendement comparatif de GE et du Dow n’est déduit de la seule composition.

### Tesla : une entrée à préparer

`story:tesla-entree-indice-2020` · Novembre–décembre 2020 · famille `indices`

- [Tesla Set to Join S&P 500](https://press.spglobal.com/2020-11-16-Tesla-Set-to-Join-S-P-500) — S&P Dow Jones Indices, 2020-11-16 ; consulté le 2026-10-26. Entrée prévue le 21 décembre et consultation sur une ou deux tranches.
- [S&P Dow Jones Indices Announces Implementation of Tesla’s Addition to S&P 500](https://press.spglobal.com/2020-11-30-S-P-Dow-Jones-Indices-Announces-Implementation-of-Teslas-Addition-to-S-P-500) — S&P Dow Jones Indices, 2020-11-30 ; consulté le 2026-10-26. Décision d’intégration en une fois, au poids ajusté du flottant ; prise en compte de la liquidité et des volumes.

Réserves : Deux étapes documentées de la même décision de l’opérateur. Les fonds peuvent employer des techniques de réplication différentes : aucune obligation uniforme d’acheter à une seconde précise n’est affirmée. Aucun rendement ou effet causal chiffré sur le cours n’est inventé.

### Une ligne AT&T devient huit histoires

`story:att-baby-bells-1984` · 1982–1984 · famille `entreprises`

- [AT&T Corp. — cost basis guide, Divestiture January 1, 1984](https://investors.att.com/stockholder-services/cost-basis-guide/worksheet/att-corp) — AT&T Investor Relations, date non précisée ; consulté le 2026-10-26. Distribution d’une action de chacune des sept compagnies régionales pour dix actions AT&T détenues au 30 décembre 1983 ; traitement des fractions.
- [Telecommunications — background on AT&T divestiture](https://www.govinfo.gov/content/pkg/GAOREPORTS-RCED-00-237/pdf/GAOREPORTS-RCED-00-237.pdf) — U.S. General Accounting Office, 2000 ; consulté le 2026-10-26. Accord antitrust et séparation des opérateurs locaux en sept compagnies régionales en 1984.
- [The Historical Brands of AT&T](https://about.att.com/innovation/ip/brands/history) — AT&T, date non précisée ; consulté le 2026-10-26. Métiers conservés par AT&T et distinction avec les Baby Bells.

Réserves : Aucun rendement global n’est chiffré sans reconstruire distributions, regroupements et dividendes. Les droits des actionnaires à la date de référence sont distingués d’un achat ultérieur portant le même nom. Pas de raccordement artificiel entre anciennes et nouvelles sociétés.

### Eurotunnel : un tunnel ne rembourse pas tout seul

`story:eurotunnel-echange-2007` · 2006–2007 · famille `entreprises`

- [Eurotunnel to leave SRD](https://press.getlinkgroup.com/assets/eurotunnel-to-leave-srd-65fb-0791e.html?dl=1) — Eurotunnel, 2006 ; consulté le 2026-10-26. Avertissement sur les engagements jusqu’au début 2007, échéances de principal et négociations de dette. Possibilité de moratoire contractuel dans les conditions prévues.
- [Groupe Eurotunnel SA — Consolidated accounts for year ended 31 December 2007](https://press.getlinkgroup.com/download-pdf/5d1e206c12574a51ec47422d) — Groupe Eurotunnel, 2008 ; consulté le 2026-10-26. Plan du 15 janvier 2007, offre d’échange, nouvelles actions et bons de souscription. Émission d’obligations remboursables en actions et calendrier de conversion.

Réserves : Le texte concerne les porteurs qui ont apporté leurs titres à l’offre, pas une conversion uniforme de tous les placements. Aucun cours ancien n’est comparé à un cours après regroupement de quarante actions pour une. Les encours d’instruments de l’ancien et du nouveau périmètre ne sont pas soustraits comme une perte homogène.

### Le vieil emprunt de guerre est rappelé

`story:war-loan-remboursement-2015` · 1932–2015 · famille `epargne`

- [Chancellor to repay the nation’s First World War debt](https://www.gov.uk/government/news/chancellor-to-repay-the-nations-first-world-war-debt) — HM Treasury, 2014-12-03 ; consulté le 2026-10-26. Conversion de 1932, encours proche de 1,9 milliard de livres, plus de 120 000 détenteurs et motivation de refinancement.
- [Redemption of 3½% War Loan — Press Notice](https://www.dmo.gov.uk/media/kmwf5vfk/pr031214.pdf) — UK Debt Management Office, 2014-12-03 ; consulté le 2026-10-26. Remboursement au pair fixé au 9 mars 2015, faculté depuis décembre 1952 et préavis de trois mois. Date de référence des porteurs : 23 février 2015 ; paiement final des intérêts.

Réserves : 3,5 % est le coupon sur le nominal, pas le rendement personnel de chaque détenteur. Le remboursement au pair ne prouve pas une conservation du pouvoir d’achat depuis 1932 ou 1917. Le texte raconte l’annonce et ses conditions, sans inventer une famille qui aurait conservé le même certificat pendant un siècle.

### L’épargne qui remplace le coupon par un tirage

`story:premium-bonds-1956` · 1956–1957 · famille `epargne`

- [ERNIE draws two September jackpot millionaires as Premium Bonds approach 70th anniversary](https://www.nsandi.com/about-us/press-releases/2026/september-premium-bonds-two-millionaires-norwich-and-london) — NS&I, 2026-09-01 ; consulté le 2026-10-26. Mise en vente en novembre 1956, premier tirage en juin 1957 et premier gros lot de 1 000 livres. Fonctionnement des gains par tirage et soutien du Trésor.
- [How Premium Bonds work — All about Premium Bonds](https://www.nsandi.com/get-to-know-us/about-premium-bonds) — NS&I, date non précisée ; consulté le 2026-10-26. Origine d’ERNIE, production de numéros et principe aléatoire des prix ; histoire du dispositif.

Réserves : Deux publications du même organisme. Le récit historique ne publie ni taux de fonds de prix, ni probabilité, ni plafond présentés comme actuels. La garantie nominale du capital ne garantit ni gain individuel ni protection contre l’inflation. L’exemple de deux détenteurs est une possibilité du mécanisme, pas un témoignage.

### Le 747 commence par des acomptes

`story:boeing-747-acomptes-1966` · 1966–1969 · famille `entreprises`

- [Progress in Aircraft Design Since 1903 — Boeing Model 747](https://ntrs.nasa.gov/api/citations/19740023386/downloads/19740023386_Update.pdf) — NASA, 1974 ; consulté le 2026-10-26. Décision de programme en mars 1966, commande Pan Am de 25 avions en avril, production en 1967 et présentation de septembre 1968.
- [Congressional Record — Extensions of Remarks, August 12, 1969, discussion of the 747 programme](https://www.govinfo.gov/content/pkg/GPO-CRECB-1969-pt17/pdf/GPO-CRECB-1969-pt17-6-3.pdf) — U.S. Congress, archive GovInfo, 1969-08-12 ; consulté le 2026-10-26. Commande Pan Am de 25 appareils et modalités de paiements anticipés supérieures à la moitié du prix avant livraison, selon l’exposé reproduit.

Réserves : Le Congressional Record reproduit un exposé, pas un audit des comptes de Boeing : les modalités lui sont attribuées. Les pourcentages ne sont pas présentés comme une règle applicable à chaque client et contrat. Aucun rendement d’action, coût final du programme ou causalité unique de sa réussite n’est inventé.

### IBM : le groupe que l’on ne découpe pas

`story:ibm-unite-1993` · 1993 · famille `entreprises`

- [IBM’s Business Transformation Unfolds — IBM at a Crossroads](https://public.dhe.ibm.com/software/solutions/pdfs/g325-1931-00.pdf) — IBM, 2002 ; consulté le 2026-10-26. Situation de 1993, projet de découpage, perte de 8,1 milliards et arrivée de Gerstner en avril ; stratégie d’intégration.
- [Annual Report 1994 — Financial Highlights, comparative 1993](https://www.ibm.com/investor/att/pdf/IBM_Annual_Report_1994.pdf) — International Business Machines Corporation, 1995 ; consulté le 2026-10-26. Perte nette de 1993 : 8 101 millions de dollars, dont un effet de changement comptable de 114 millions. La perte avant impôts et la perte nette ne sont pas interchangeables.

Réserves : Deux documents de l’entreprise, dont son rapport annuel 1994 présentant le comparatif 1993. La perte nette et les charges de restructuration avant impôts sont distinctes. Une autre page historique IBM attribue 8,1 milliards à 1992 : cette date contradictoire est écartée au profit des comptes annuels.

## Conventions, accès et sujets écartés

Les rapports successifs d’un émetteur, un communiqué et son PDF, ou un rapport SEC et son miroir ne sont pas présentés comme des confirmations indépendantes. Les faits stables n’ont pas de nouvelle collecte quotidienne. Les mesures mensuelles restent alimentées par le registre partagé : leur date de contrôle demeure celle du registre, distincte de la relecture de leur présentation.

Quatre archives de presse sont lisibles dans leur index mais ont refusé le téléchargement HTTP local (403/429) : Reuters via Yahoo, UPI, Le Parisien et Rochester Business Journal. Les faits chiffrés sont complétés selon les cas par les observations FRED/Nasdaq, le rapport SEC ou le second compte rendu de clôture. Les liens sont conservés, sans promettre un accès exempt de blocage ou d’abonnement. Le PDF IBM 1994 est scanné ; son tableau financier a été contrôlé dans l’index textuel du document. Le document historique IBM de 2002 est aussi téléchargé ; la chronologie secondaire Hursley qui répondait 503 a été remplacée par les comptes annuels.

Swissair n’est pas ajouté : le rapport du liquidateur et les résumés judiciaires ne soutiennent pas la même explication simple de la liquidité disponible lors de l’immobilisation. Le sujet mérite un dossier contradictoire spécifique. Pas de montant de perte Newton reconstruit sans qualification, de prétendu rendement actuel de See’s, de raccordement Kodak avant/après annulation, ni de comparaison Eurotunnel ignorant les regroupements et échanges.

Recommandation : conserver les 30 bons récits récents et les dix sujets hérités désormais réécrits. Conserver les séries mensuelles comme repères sourcés, sans les faire passer pour une collection de vécus humains. Abandonner les chiffres sans périmètre récupérable et les chutes génériques de patience/diversification, pas les identifiants ou les historiques.

## Vérifications

- `npm run build` : compilation et audits de couverture/bundles.
- `npm run lint` : aucune erreur ; avertissements préexistants hors des fichiers modifiés.
- `node scripts/test-market-stories.mjs` : textes fixes, identifiants, familles, dossiers de preuve, mention financière et copie exacte.
- `node scripts/test-market-story-selection.mjs` : sélection partagée préservée, mesures et conventions reprises à l’identique, mise à jour propagée sans récit inventé.
- `npm run audit:publishable-content` : aucun échec.
- `npm run audit:source-inventory`, `node scripts/test-reusable-data-contracts.mjs`, `node scripts/test-data-reuse.mjs` : aucun échec.
- `node scripts/playwright-tools.mjs --market-facts` : parcours fonctionnel de l’outil existant.
- `node scripts/playwright-market-stories.mjs` : Chromium réel à 1440, 390 et 360 px ; sélection, lecture et copie intégrale des 129 entrées, recherche et absence de résultat, preuves et réserves, ouverture réelle d’une source dans un onglet, cycle complet de 77 histoires sans répétition puis redémarrage sans doublon immédiat. Aucun débordement horizontal ni erreur JavaScript. Captures ordinateur et mobile dans les artefacts de recette.

Relecture éditoriale : les 77 récits ont été lus en entier ; accroches, enchaînements, phrases et fins ont été comparés. Les 17 nouveaux dossiers et les 14 fiches anciennes ont été repris ; les 30 bons textes de la veille gardent leur vérification d’origine. Aucune histoire n’est déclarée vraie par la seule réussite d’un test logiciel.

Les moteurs partagés, « Le DCA de… », le radar et les workflows ne sont pas modifiés par cette PR. Les projections régénérées par le build sont exclues des commits.

La fusion et le déploiement sont autorisés par la demande utilisateur. Ce rapport décrit la validation locale ; le statut effectif de fusion, les contrôles GitHub et le SHA public doivent être constatés séparément dans le compte rendu de livraison.

## Cinq publications complètes représentatives

### Buffett paie ses chaussures avec Berkshire

Pour acheter un fabricant de chaussures, Warren Buffett remet aux vendeurs un petit morceau de Berkshire Hathaway. En 1993, l’opération lui paraît assez bonne pour la présenter avec enthousiasme dans sa lettre annuelle.

Dexter fabrique plus de 7 millions de paires par an. Buffett connaît déjà le secteur grâce à d’autres acquisitions. Il décrit une entreprise bien dirigée, capable de résister aux importations à bas coût. Ce n’est pas un pari présenté comme un sauvetage désespéré.

Le paiement prend la forme de 25 203 actions Berkshire. Puis l’avantage concurrentiel qu’il croyait durable disparaît. En revenant sur l’opération dans sa lettre de 2007, Buffett juge l’activité acquise sans valeur.

Mais les actions données aux vendeurs, elles, ont continué leur parcours. À la date de cette lettre, il évalue leur valeur à 3,5 milliards de dollars, contre 433 millions lors de l’achat. 👞

Ce montant n’est pas une nouvelle facture arrivée chez Berkshire. Il mesure ce que vaut désormais la part de l’entreprise cédée pour payer Dexter. Le mauvais achat avait un prix ; le moyen de paiement lui avait donné une autre dimension.

Pas un conseil financier.

### Keynes change sa façon d’investir

Savoir expliquer l’économie ne suffit pas à trouver le prochain bon moment pour acheter des actions. John Maynard Keynes finit par modifier sa propre méthode de placement.

Il gère notamment une partie du patrimoine de King’s College, à Cambridge. Dans les années 1920, il cherche à ajuster les placements selon sa lecture de la conjoncture : davantage d’actions, d’obligations ou de liquidités en fonction du cycle attendu.

Les archives de ses opérations montrent un parcours difficile. Après le krach de 1929 et de lourdes pertes, il vend une partie de ses actions britanniques et se tourne vers des obligations publiques.

Au début des années 1930, son approche évolue : il accorde davantage de place au choix des entreprises, à leur prix et à leurs perspectives sur plusieurs années. Les chercheurs qui ont reconstitué ses portefeuilles observent une amélioration des résultats après ce changement. 📚

Cela ne lui évite ni les baisses ni les désaccords. En 1938, il quitte la présidence d’une compagnie d’assurance dont le conseil ne veut pas suivre sa politique d’investissement.

Le même économiste n’applique donc pas une recette immuable à tous ses placements. Son parcours laisse aussi des traces de ce qu’il a cessé de faire.

Pas un conseil financier.

### Woodford : le bouton de retrait ne suffit plus

Le conseil du comté de Kent demande à retirer tout son investissement du fonds Woodford. Sa position vaut environ 237 millions de livres à la fin de mai 2019.

L’instruction part le 31 mai. Le 3 juin, les transactions du Woodford Equity Income Fund sont suspendues, dans un contexte de sorties de capitaux et de liquidité dégradée. Kent fait partie des investisseurs qui ne peuvent plus obtenir le remboursement ordinaire de leurs parts.

Le fonds possède des actifs difficiles à vendre rapidement. Une suspension doit éviter de payer les premiers sortants par des ventes précipitées qui pénaliseraient ceux qui restent. Elle laisse néanmoins les porteurs sans le libre accès à leur argent. ⏳

En octobre, la décision de liquider le fonds remplace la perspective d’une réouverture. Les remboursements suivent les ventes successives des actifs.

En avril 2024, la FCA publie ses constatations contre Link Fund Solutions sur la gestion et la surveillance du fonds. Les paiements d’un dispositif de réparation pouvant atteindre 230 millions de livres commencent. Ils ne garantissent pas la restitution intégrale de chaque placement.

Une demande de retrait censée se régler dans le fonctionnement habituel du fonds s’est transformée en années de liquidation et de procédure.

Pas un conseil financier.

### L’épargne qui remplace le coupon par un tirage

Le capital peut être protégé sans que chaque épargnant reçoive le moindre intérêt.

Au Royaume-Uni, les Premium Bonds sont mis en vente en novembre 1956. Leur idée est inhabituelle pour un produit d’épargne public : au lieu de verser un intérêt à chaque détenteur, l’argent prévu pour les gains alimente des prix distribués par tirage au sort.

Le premier tirage a lieu en juin 1957. Les numéros sont produits par ERNIE, une machine conçue pour cette tâche. Le premier gros lot vaut alors 1 000 livres. 🎲

Le mécanisme sépare donc deux promesses. Le soutien du Trésor concerne le capital ; le gain dépend du tirage. Deux détenteurs peuvent engager la même somme et obtenir des résultats différents, dont aucun prix pour l’un d’eux.

C’est cette différence qui compte derrière le mot « bond ». On n’a pas acheté le même contrat qu’une obligation versant régulièrement son coupon.

Pas un conseil financier.

### Le stop à 8 € qui ne garantit pas 8 €

Il a placé un ordre de vente avec un seuil à 8 €. Son exécution à un autre prix devient ensuite un litige soumis au médiateur de l’AMF.

Le dossier concerne des certificats liés au CAC 40 et un ordre appelé « stop on quote ». Le 12 mars 2020, l’indice parisien termine en baisse de 12,28 %, sa pire séance depuis sa création. Pendant plusieurs heures, la tenue de marché du produit est interrompue.

À la reprise des cotations, le prix d’achat proposé par l’émetteur se situe sous le seuil fixé par l’investisseur. Son ordre est alors déclenché et exécuté. C’est précisément là que se trouve le malentendu : pour ce type d’ordre, le seuil commande le déclenchement, mais il ne fixe pas un prix minimum de vente. ⚠️

Le médiateur rappelle aussi une particularité des warrants et certificats : ce déclenchement dépend des cotations de l’émetteur, et non d’une transaction comme pour une action. Une fois activé, l’ordre fonctionne sans limite de prix.

L’AMF ne conclut pas à une exécution anormale dans ce dossier. Un nombre avait bien été saisi pour préparer la sortie ; il n’était pas une garantie sur la somme récupérée.

Pas un conseil financier.

