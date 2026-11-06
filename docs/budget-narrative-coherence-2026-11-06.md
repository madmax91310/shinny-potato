# Cohérence des récits et questions — 6 novembre 2026

{
  "reviewed": 70,
  "changed": 68,
  "narrativeChanged": 34,
  "targetedQuestionsChanged": 40,
  "generalConclusionRemoved": 65,
  "expressedQuestions": 33,
  "editorialQuestions": 91,
  "deficits": 10,
  "monthlyAmountsChanged": 0
}

Base : `b13ec5c5fd159a899b59b9330646426f837c660f` (master). Les sources, montants mensuels, identifiants, périodes et dix déficits sont conservés. Aucune nouvelle consultation de source ni déclaration authentique n’est revendiquée. Les compléments et calculs conditionnels sont éditoriaux et restent consultables dans la fiche.

Chaque projet est un objectif minimum, pas une égalité imposée. Un dépassement à l’échéance peut rester disponible ou entraîner une revue des virements ; un virement envisagé ne devient pas un virement effectué. Les stocks ne sont jamais ajoutés aux revenus mensuels.

## Identités publiques du code et des données

- Livraison #1186 : run [42238277849](https://github.com/madmax91310/shinny-potato/actions/runs/42238277849), publication vérifiée le 06/11 à 16:36 UTC, nouveau contrôle à 16:49. Code `02cfde6b5cf0184a10c024c74adfef6f04a9f009`, données `2d73ea8f922ef234bf91911e705853e658bcaa94`.
- Collecte ultérieure : commit `f212ab74eebaf825b930a67e636da03bebb32638`, 18:09 UTC, puis job [128065452982](https://github.com/madmax91310/shinny-potato/actions/runs/42267239488/job/128065452982). Construction 18:17:53, vérification publique 18:20:37 : même code `02cfde6b…`, nouvelles données `f212ab74…`, 382 fichiers vérifiés. Le job de publication réussit ; le run global signale séparément des sources de collecte en échec.
- `sha` identifie le code validé ; `dataSha` le snapshot de données automatisées composé avec ce code. Ce dernier ne remplace pas la version de la banque de budgets intégrée au code. Le portail de données applique les contrats de compatibilité et vérifie un manifeste des fichiers réellement servis.
- Preuve Git : l’arbre `src/pages/budget-profiles` porte exactement `d7ca9e6300df3e98b7ca071eb6ed14c19652dbe8` aux trois commits ci-dessus. L’écart vient de la collecte ultérieure, sans changement du budget ni anomalie de publication démontrée. Aucun SHA forcé, aucune modification du déploiement.

## Audit par profil

### Camille

Identifiant : `reddit-actif-2026-09-27` ; EUR ; période conservée : Septembre 2026.

Voiture : 3 000 + 100 × 30 = 6 000 ; les 2 000 de sécurité sont distincts. Une baisse supérieure à 72 absorbe la marge après virement ; le rythme du projet reste conditionnel.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Voiture d’occasion ; cible 6000 ; départ 3000 ; mensuel 100 ; échéance 30 mois ; total conditionnel 6000, écart au minimum 0.

Récit retenu :

Camille garde 5 000 € sur son Livret A : 2 000 € pour les imprévus et 3 000 € pour remplacer sa voiture de 2005.
Elle vise une voiture d’occasion à 6 000 € dans deux ans et demi. Les 100 € mis de côté chaque mois compléteraient les 3 000 € déjà réservés, sans toucher aux 2 000 € de sécurité. Elle aimerait aussi changer de travail, mais préfère connaître ses prochains trajets avant d’acheter. Avec seulement 72 € de marge après le virement, une baisse de salaire plus forte ferait passer le mois dans le rouge.

Questions retenues :

- [editorial] Vous attendriez de connaître le prochain travail avant de remplacer la voiture ?
- [editorial] Les mois moins rémunérés, vous réduiriez les 300 € de sorties ou les 100 € pour la voiture ?

### Julie et Alex

Identifiant : `reddit-couple-nord-2026-07-09` ; EUR ; période conservée : Juillet 2026.

250 + 100 × 8 = 1 050 : objectif minimum de 1 000 atteint sans retrait. Trajets de 150 déjà provisionnés ; ni soins ni loisirs déduits une seconde fois des 107 restants.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Réserve de sécurité ; cible 1000 ; départ 250 ; mensuel 100 ; échéance 8 mois ; total conditionnel 1050, écart au minimum 50.

Récit retenu :

Julie et Alex n’ont que 250 € de côté. Leur première priorité est de sortir durablement du découvert et d’atteindre 1 000 € de réserve : avec le virement de 100 €, il leur faudrait environ huit mois sans retrait.
Les trajets familiaux ont leur provision de 150 €. Ils hésitent à ajouter une partie des 107 € restants à la réserve ou à la laisser sur le compte pour éviter un nouveau découvert.

Questions retenues :

- [editorial] Vous laisseriez les 107 € sur le compte ou vous en mettriez une partie sur le livret ?
- [editorial] Vous mettez l’argent des trajets familiaux de côté chaque mois ou à l’approche des vacances ?

### Thomas

Identifiant : `reddit-salarie-26-2026-01-04` ; EUR ; période conservée : Janvier 2026.

300 × 24 = 7 200 : 2 500 d’installation et 4 700 pour les premiers mois de vie autonome. Réserve distincte de 10 000, depuis 8 000 et 700/mois ; cap atteint au troisième mois. Le devenir des 700 est à redécider ensuite, pas engagé pendant deux ans.

Modifications : paragraphs, questions, budgetQuestion, publicProfile, created.


- Projet : Départ du foyer : installation et premiers mois ; cible 7200 ; départ 0 ; mensuel 300 ; échéance 24 mois ; total conditionnel 7200, écart au minimum 0.
- Projet : Précaution avant investissement ; cible 10000 ; départ 8000 ; mensuel 700 ; échéance non arrêtée mois.

Récit retenu :

Thomas a 8 000 € sur son Livret A. Les 700 € mensuels visent d’abord une réserve de 10 000 €, atteinte en environ trois mois sans retrait. Il restera ensuite à décider s’il poursuit ce virement ou s’il en oriente une partie vers le PEA.
Il pense quitter ses parents dans deux ans. À 300 € par mois, son enveloppe de départ atteindrait 7 200 € : 2 500 € pour le dépôt de garantie, le déménagement et les premiers meubles, puis 4 700 € pour les premiers loyers et la vie quotidienne.
Ces 7 200 € seraient séparés de la réserve de 10 000 €. Le budget de son futur logement reste à construire : les dépenses présentées sont celles de sa vie chez ses parents.

Questions retenues :

- [editorial] Une fois les 10 000 € atteints, quelle part des 700 € mensuels orienteriez-vous vers le PEA ?
- [editorial] Quand vous avez quitté vos parents, quels frais aviez-vous sous-estimés au-delà du dépôt et des meubles ?

### Mathieu

Identifiant : `finary-ingenieur-aero-2025-11-30` ; EUR ; période conservée : Novembre 2025.

150 détournés du PEA pendant 18 mois donneraient 2 700 pour une cuisine à 2 500. Objectif minimum, reliquat de 200 ; proposition de réaffectation et non versement déjà acté. Réserve 4 500 distincte.

Modifications : budgetQuestion.


- Projet : Cuisine ; cible 2500 ; départ 0 ; mensuel 150 envisagé ; échéance 18 mois ; total conditionnel 2700, écart au minimum 200.

Récit retenu :

Mathieu a 4 500 € de réserve et 6 000 € sur un PEA qu’il alimente depuis dix-huit mois. Avec ses deux crédits, il aimerait se rapprocher de la règle 50/30/20 sans renoncer à tous ses loisirs.
Il prévoit de rafraîchir sa cuisine pour 2 500 € dans dix-huit mois. Il hésite à réduire temporairement le versement au PEA de 300 à 150 € pour préparer les travaux, plutôt que de reprendre dans sa réserve.

Questions retenues :

- [editorial] Vous réduiriez le PEA pendant dix-huit mois pour financer la cuisine ?
- [editorial] Quelle réserve garderiez-vous avec le logement et la voiture à entretenir ?

### Lucas

Identifiant : `finary-alternant-22-2025-05-15` ; EUR ; période conservée : Mai 2025.

750 de PEA et 10 de marge ; virements parfois financés depuis le livret explicitement conservés. PEA, PEE et livrets ne sont pas additionnés à des revenus mensuels.

Modifications : budgetQuestion, publicProfile.



Récit retenu :

Lucas investit sur son PEA depuis février 2023. Il détient environ 13 000 € sur ce PEA, 7 000 € sur un Livret A, 7 000 € sur un PEE, 500 € en assurance-vie et 500 € en cryptomonnaies.
Lucas vise le long terme avec des ETF World et Nasdaq, sans projet immobilier. Il se demande ce qu’une assurance-vie investie elle aussi en actions mondiales lui apporterait. Ses trajets atteignent 450 km par semaine ; il a déjà financé certains versements sur le PEA depuis le Livret A.

Questions retenues :

- [expressed] À quoi servirait selon vous l’assurance-vie à côté de son PEA World/Nasdaq ?
- [editorial] Vous garderiez un versement fixe sur le PEA ou vous l’ajusteriez aux dépenses du mois ?

### Nicolas

Identifiant : `finary-fonctionnaire-30-2025-05-21` ; EUR ; période conservée : Mai 2025.

La provision vacances de 100 est déjà dans les 1 667,01 de dépenses. Après baisse de salaire de 100 et abonnement sportif futur de 24,99, reste avant PEA de 363, sans déduire deux fois les vacances.

Modifications : paragraphs, questions, publicProfile.



Récit retenu :

Après l’achat de son appartement avec un prêt familial sans intérêts, Nicolas conserve 7 360 € sur Livret A et 3 000 € sur un PEA ouvert un mois plus tôt.
Les vacances ont déjà une provision de 100 € dans les dépenses. Il envisageait 500 € par mois sur un ETF S&P 500.
Avec les 100 € de salaire en moins et le nouvel abonnement sportif de 24,99 € qu’il prévoyait, il ne resterait que 363 € avant tout versement sur le PEA, à autres dépenses identiques.

Questions retenues :

- [editorial] Si le salaire baisse et que l’abonnement sportif commence, combien verseriez-vous au PEA sur les 363 € restants ?
- [ouverture] Que pensez-vous de ce budget ? 🤔💬

### Hugo

Identifiant : `finary-alternant-19-2025-09-27` ; EUR ; période conservée : Septembre 2025.

Sans bonus non récurrent de 150 : ressources 1 071, dépenses 1 075,99, déficit de 4,99 avant les 120 de versements. Question porte sur les deux versements, pas seulement le CTO.

Modifications : questions, budgetQuestion, publicProfile.



Récit retenu :

Hugo a commencé à investir à l’été 2025. Son patrimoine net atteint 424 €, dont environ 122 € sur un compte-titres mêlant ETF et actions.
Il aimerait tirer de ses placements 2 000 à 2 500 € par mois dans dix à quinze ans, tout en limitant les risques.
Sans le bonus, les dépenses dépasseraient déjà les ressources habituelles d’environ 5 €, avant tout versement.

Questions retenues :

- [editorial] Sans le bonus de 150 €, quelles dépenses réduiriez-vous avant de programmer les 120 € de versements ?
- [expressed] Son objectif vous paraît-il réaliste avec ce rythme de versements ?

### Clara et Louis

Identifiant : `reddit-couple-35-2025-10-15` ; EUR ; période conservée : Octobre 2025.

411 de marge actuelle ; les 200 pour l’enfant restent une proposition non intégrée aux virements. Entretien leasing inclus, pneus exclus ; fin du téléphone libère 130 sans inventer le coût futur d’un enfant.

Modifications : questions, budgetQuestion, publicProfile.



Récit retenu :

Clara et Louis ont 3 500 € de côté et aimeraient préparer l’arrivée d’un enfant. Ils envisagent de réserver 200 € par mois à ce projet, mais n’ont pas encore fixé de virement.
L’entretien courant est inclus dans leur leasing. Leurs enveloppes personnelles couvrent notamment vêtements, cadeaux et petits équipements ; les pneus resteraient à payer séparément. La fin des 130 € de remboursement du téléphone pourrait leur donner plus de latitude.

Questions retenues :

- [editorial] Quelles premières dépenses d’un enfant prévoiriez-vous avant de fixer le virement de 200 € ?
- [editorial] À la fin du paiement du téléphone, que feriez-vous des 130 € libérés ?

### Maxime

Identifiant : `reddit-tech-26-2026-02-06` ; EUR ; période conservée : Février 2026.

2 400 + 600 × 12 = 9 600, au-delà du minimum 8 000 (5 000 installation et au moins 3 000 sécurité). Objectif atteint avant un an, pas une contradiction ; excédent non affecté arbitrairement.

Modifications : budgetQuestion.


- Projet : Installation et réserve ; cible 8000 ; départ 2400 ; mensuel 600 ; échéance 12 mois ; total conditionnel 9600, écart au minimum 1600.

Récit retenu :

Maxime a 2 400 € sur son Livret A. Il veut quitter le logement de ses parents dans un an, avec 5 000 € pour s’installer et au moins 3 000 € de réserve.
Le virement de 600 € lui permettrait d’atteindre ces deux objectifs sans utiliser les 230 € restants du mois. Il hésite à virer l’argent dès la paie ou après les derniers prélèvements, pour ne plus avoir à reprendre sur le livret.

Questions retenues :

- [editorial] Vous feriez le virement au livret dès la paie ou après les prélèvements ?
- [editorial] Les 3 000 € de sécurité vous semblent-ils suffisants pour son premier logement ?

### Léo

Identifiant : `reddit-alternant-20-2025-09-03` ; EUR ; période conservée : Septembre 2025.

1 800 + 200 × 24 = 6 600 pour deux poches totalisant 6 000 ; surplus de 600 possible. Ni le PEA ni l’immobilier fractionné ne financent simultanément le dépôt ; 60 redirigés restent une décision envisagée.

Modifications : budgetQuestion.


- Projet : Installation et sécurité ; cible 6000 ; départ 1800 ; mensuel 200 ; échéance 24 mois ; total conditionnel 6600, écart au minimum 600.

Récit retenu :

Léo a 1 800 € sur Livret A, 500 € sur PEA, 300 € en immobilier fractionné et 100 € en cryptomonnaies. Il a commencé ces placements il y a cinq mois.
Il prépare une installation dans deux ans : 4 000 € pour les premiers frais et 2 000 € de sécurité. Les 200 € versés au livret chaque mois peuvent financer ces deux poches ; il hésite à y rediriger aussi les 60 € d’immobilier fractionné pour garder l’argent accessible.

Questions retenues :

- [editorial] Garderiez-vous les 60 € en immobilier fractionné avec une installation dans deux ans ?
- [editorial] Quelle réserve lui laisseriez-vous une fois installé ?

### Adrien

Identifiant : `finary-cyber-24-2026-08-27` ; EUR ; période conservée : Août 2026.

Précaution : 3 000 + 500 × 6 = 6 000. Prêt : 450 × 36 = 16 200, dépassement possible de 1 200 ; versement à revoir une fois l’enveloppe remplie, pas un nouveau prêt ou un remboursement immédiat.

Modifications : budgetQuestion.


- Projet : Préparer le prêt étudiant ; cible 15000 ; départ 0 ; mensuel 450 ; échéance 36 mois ; total conditionnel 16200, écart au minimum 1200.
- Projet : Précaution ; cible 6000 ; départ 3000 ; mensuel 500 ; échéance non arrêtée mois.

Récit retenu :

Adrien a 3 000 € sur un livret et n’a pas encore investi. Il prévoit désormais 500 € par mois pour la précaution, 450 € pour son prêt étudiant et un premier versement de 500 € sur PEA.
Le prêt de 15 000 € commencera à être remboursé dans trois ans, sur cinq ans. Les 450 € mensuels serviraient à préparer cette échéance avant qu’elle pèse sur le budget. Pour le PEA, il hésite entre commencer à 500 € tout de suite et renforcer d’abord sa réserve jusqu’à 6 000 €.

Questions retenues :

- [editorial] Vous commenceriez le PEA à 500 € ou vous termineriez d’abord la réserve de 6 000 € ?
- [editorial] Prépareriez-vous le prêt sur un livret même si son remboursement ne commence que dans trois ans ?

### Bastien

Identifiant : `finary-ingenieur-21-2025-03-08` ; EUR ; période conservée : Mars 2025.

PEA-Jeune vide, 9 000 détenus ; seuls 300 de versement sont prévus. Les 1 143 restants ne sont pas transformés en investissement effectué.

Modifications : aucune, questions et récit conservés.



Récit retenu :

Bastien a 9 000 € d’épargne et vient d’ouvrir un PEA-Jeune, encore vide. Il compte y investir à long terme les 300 € gagnés chaque mois avec ses cours particuliers.
Dans les jours qui suivent ce budget, il compare World, Nasdaq et CAC 40, puis se demande s’il ne ferait pas plus simple avec moins de lignes.

Questions retenues :

- [expressed] Un seul ETF ou plusieurs lignes pour investir ses 300 € par mois ?
- [ouverture] Que pensez-vous de ce budget ? 🤔💬

### Quentin

Identifiant : `finary-alternant-21-2025-05-08` ; EUR ; période conservée : Mai 2025.

11 100 sur livret distincts des 1 400 PEA, 6 000 crypto et 500 participatif ; apport sans prix ni date fixés. Aucune promesse de financement complet.

Modifications : budgetQuestion.



Récit retenu :

Quentin détient 11 100 € sur Livret A, 1 400 € sur PEA, 6 000 € en cryptomonnaies et 500 € en financement participatif. Il prépare un achat immobilier après ses études, tout en investissant à très long terme sur le PEA.
Il se demande combien déplacer du Livret A vers le PEA et s’il devrait augmenter ses versements. Il réfléchit aussi au poids des États-Unis dans ses ETF et à une diversification vers d’autres pays.

Questions retenues :

- [expressed] Combien garderiez-vous sur le livret pour son achat immobilier avant de renforcer le PEA ?
- [expressed] Vous ajouteriez d’autres pays à ses ETF actuels ou vous garderiez cette répartition ?

### Julien

Identifiant : `finary-locataire-25-2025-11-08` ; EUR ; période conservée : Novembre 2025.

Budget individuel : 900 de part de logement, 660 de prêt et 600 de courant ; ni salaire de la compagne ni loyers futurs ajoutés. Actifs financés en partie à crédit explicitement conservés.

Modifications : budgetQuestion.



Récit retenu :

Julien prépare un premier investissement locatif pour 2026. Il détient environ 40 000 € en ETF et cryptomonnaies, financés en partie par son prêt étudiant, ainsi que 8 000 € sur livrets, surtout un PEL qu’il envisage d’utiliser comme apport.
Son prêt étudiant court jusqu’en 2033. Les augmentations de salaire espérées ne sont pas comptées dans ses ressources.

Questions retenues :

- [editorial] Combien garderiez-vous de côté avant un achat locatif avec ce prêt étudiant encore en cours ?
- [editorial] Vous achèteriez dès maintenant ou vous prendriez plus de temps pour réunir l’apport ?

### Antoine

Identifiant : `finary-batiment-21-2025-09-30` ; EUR ; période conservée : Septembre 2025.

Logement gratuit limité à deux ans ; 23 500 sur livrets distincts des 1 500 investis et des virements 725. Achat/travaux sans montant arrêté, pas d’atteinte promise.

Modifications : paragraphs, budgetQuestion, publicProfile.



Récit retenu :

Antoine a 23 500 € sur des livrets et 1 500 € sur PEA et compte-titres. Il souhaite investir à long terme.
Il aimerait profiter de ses compétences dans le bâtiment pour rénover un logement, mais hésite entre sa résidence principale et un premier bien locatif.

Questions retenues :

- [editorial] Combien garderiez-vous de côté pour l’achat et les travaux ?
- [expressed] À sa place, vous commenceriez par votre logement ou par un bien à louer ?

### Simon

Identifiant : `finary-etudiant-20-2025-03-19` ; EUR ; période conservée : Septembre 2025 · budget prévu en mars.

Salaire d’alternance et budget prévus, récit situé en mars 2025 conservé. Aucun virement PEA chiffré ni achat immobilier supposé acquis.

Modifications : aucune, questions et récit conservés.



Récit retenu :

En mars 2025, Simon a 7 000 € sur Livret A. Il avait envisagé un apport immobilier de 10 000 à 15 000 €, puis s’est intéressé à la bourse.
Il envisage alors d’ouvrir un PEA et d’y verser régulièrement, sans montant fixé.

Questions retenues :

- [expressed] Vous garderiez ses économies pour un futur apport ou vous en investiriez déjà une partie en bourse ?
- [ouverture] Ce budget prévu vous paraît-il tenable au quotidien ? 🤔💬

### Sébastien

Identifiant : `finary-celibataire-31-2026-02-03` ; EUR ; période conservée : Février 2026.

Voyage de 2 000 compris dans la provision vacances/cadeaux de 200/mois ; pas un second coût mensuel. Transfert de 5 000 depuis le stock de livrets, distinct des 375 mensuels au PEA.

Modifications : paragraphs, budgetQuestion, publicProfile.



Récit retenu :

Sébastien garde environ 28 300 € sur LEP et Livret A. Il a ouvert son PEA en janvier 2026 pour préparer la retraite, avec des ETF américains, européens et émergents.
Il prévoit un voyage de 2 000 €, à faire tenir dans les 200 € mensuels déjà prévus pour les vacances et cadeaux. Il pense aussi transférer 5 000 € du Livret A vers le PEA et hésite entre investir cette somme d’un coup et l’étaler.

Questions retenues :

- [expressed] Combien garderiez-vous sur les livrets après le voyage et ce transfert ?
- [expressed] Pour les 5 000 €, vous feriez un seul versement ou plusieurs achats répartis dans le temps ?

### Paul

Identifiant : `finary-frontalier-37-2025-06-30` ; EUR ; période conservée : Juin 2025.

35 000 placés sur compte courant distincts des autres actifs, question recentrée sur cette somme et les projets réels. Le véhicule fourni par l’employeur n’est pas ajouté une seconde fois.

Modifications : questions, budgetQuestion, publicProfile.



Récit retenu :

Paul détient environ 42 700 € sur PEA, des livrets et des contrats luxembourgeois. Il a aussi 35 000 € sur un compte courant non rémunéré et se demande quoi en faire.
Il souhaite avoir un enfant dans les trois ans, acheter un nouveau logement et louer l’actuel. Il vise des revenus complémentaires dans dix à douze ans et hésite entre investir davantage, préparer l’immobilier et rembourser son crédit plus vite.

Questions retenues :

- [editorial] Sur les 35 000 € du compte courant, combien garderiez-vous pour le changement de logement et l’arrivée d’un enfant ?
- [expressed] Vous rembourseriez le crédit plus vite ou vous renforceriez les placements ?

### Enzo

Identifiant : `finary-bois-18-2025-10-16` ; EUR ; période conservée : Octobre 2025.

Budget après installation prévu : 550 +/-100 de logement et 250 +/-50 de courses, soit reste 537 à 837. Deux poches : 3 000 d’installation et 1 500 sécurité, depuis 2 000. Les 300 restent envisagés, départ non daté.

Modifications : budgetQuestion.

- Limite : Date du départ et salaire avant installation non établis ; aucun financement acquis avant le déménagement.

- Projet : Installation et précaution ; cible 4500 ; départ 2000 ; mensuel 300 envisagé ; échéance non arrêtée mois.

Récit retenu :

Enzo a 2 000 € sur un livret pour son premier appartement. Il vise 3 000 € pour le dépôt, les meubles et les premiers frais, tout en gardant 1 500 € pour les imprévus.
Enzo envisage un loyer de 450 à 650 € et des courses de 200 à 300 €. Ces deux postes peuvent donc faire varier les dépenses de 150 € autour du montant présenté. Il se demande combien investir une fois installé, tout en vivant confortablement.
Il pense commencer par 300 € par mois pour l’installation, mais préfère attendre les premières factures avant de fixer un placement à long terme.

Questions retenues :

- [editorial] Vous attendriez trois mois de factures avant de commencer à investir ?
- [editorial] Quelle réserve garderiez-vous en plus des frais d’installation ?

### Romain

Identifiant : `mustachian-ingenieur-28-2025-08-16` ; CHF ; période conservée : Août 2025.

Moyenne incluant héritage et ventes, non assimilée à un salaire récurrent. Les placements et versements annuels au troisième pilier restent à prendre sur les 3 749 moyens, pas sur un second surplus.

Modifications : paragraphs, questions, budgetQuestion, budget, publicProfile.

- Limite : Composition récurrente du revenu moyen et répartition annuelle des placements non chiffrées ; aucune nouvelle capacité mensuelle certaine.


Récit retenu :

Depuis 2022, Romain investit surtout en actions mondiales, sur compte-titres et dans son troisième pilier auquel il verse le maximum annuel. Ses placements représentent alors environ 109 700 CHF.
Les 7 393 CHF de revenus moyens comprennent notamment un héritage et des ventes. Les 3 749 CHF restants servent aussi aux placements, dont les versements annuels au troisième pilier. Leur montant dépend donc des recettes de chaque année.
Il vise un portefeuille de 150 000 CHF pour ralentir les apports et travailler à 80 ou 90 %, avec plus de temps pour les loisirs.

Questions retenues :

- [expressed] Une fois son objectif atteint, continueriez-vous à investir autant en travaillant moins ?
- [editorial] Si vous êtes passé à 80 %, qu’est-ce qui a le plus changé dans votre budget ?

### Nicolas et Marion

Identifiant : `prepared-nicolas1499-2026-10-30` ; EUR ; période conservée : Novembre 2025.

Don de 190 000 distinct des salaires mensuels et de l’épargne 150. Un seul enfant dans le foyer : étude au singulier ; aucun deuxième enfant inventé.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.



Récit retenu :

Nicolas et Marion réfléchissent à l’utilisation d’une donation de 190 000 €, reçue en plus de leurs revenus mensuels. Ils envisagent de garder une réserve sur livrets et d’investir à long terme sur PEA et assurance-vie.
Ils prévoient des travaux en 2026–2027, les études de leur enfant dans quinze ou seize ans, puis la retraite. Ils s’interrogent aussi sur l’immobilier en direct, les SCPI et les obligations, encore au stade des projets.

Questions retenues :

- [expressed] Où garderiez-vous l’argent des travaux, à côté des placements pour leur enfant et la retraite ?
- [expressed] Vous feriez quelle place à l’immobilier et aux obligations ?

### Florian

Identifiant : `prepared-carl78-2026-10-30` ; EUR ; période conservée : Août 2025.

45 000 liquides et 65 000 PEA distincts ; crypto en dollars non convertie. Piste de 15 000 pour la sécurité séparée des dépenses de mariage/enfant/voiture, dont les coûts ne sont pas chiffrés.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.



Récit retenu :

Florian envisage un mariage, un enfant et peut-être une nouvelle voiture. Il garde 45 000 € sur livrets, un PEA d’environ 65 000 € et des cryptomonnaies valorisées séparément en dollars.
Sur ses livrets, il voudrait garder 15 000 € de sécurité . Le mariage, l’arrivée d’un enfant et la voiture auraient leurs propres budgets à prévoir dans le reste : ces mêmes 15 000 € ne peuvent pas être réservés à chaque projet. À terme, il aimerait aussi pouvoir choisir son rythme de travail.

Questions retenues :

- [expressed] Vous garderiez combien pour le mariage, l’enfant et la voiture avant d’investir davantage ?

### Théo

Identifiant : `prepared-theoo-2026-10-30` ; EUR ; période conservée : Mai 2026.

3 000 sur livret, prêt étudiant 6 000 futur et 200 de versements distincts. Revenus futurs exclus ; l’échéancier du prêt n’est pas inventé.

Modifications : budgetQuestion.



Récit retenu :

Théo a environ 3 000 € sur Livret A. Son PEA a un an, mais il y investit sur un ETF World depuis un mois seulement. Il vise vingt ans et aimerait pouvoir choisir plus librement son rythme de travail.
Il se demande quand ajouter d’autres pays ou des obligations. Son prêt étudiant de 6 000 € devra être remboursé après les études ; les hausses de salaire annoncées ne sont pas comptées ici.

Questions retenues :

- [expressed] Vous garderiez l’ETF World seul pour commencer ou vous ajouteriez déjà d’autres placements ?
- [editorial] Combien garderiez-vous de côté pour le prêt étudiant avant d’augmenter les versements ?

### Guillaume

Identifiant : `prepared-gritz-2026-10-30` ; EUR ; période conservée : Février 2026.

PEL, PEA, PEE et Livret A distincts. Les dates de disponibilité du PEE ne sont pas supposées. Question oppose réellement achat comptant différé et crédit, au lieu de deux formulations d’attente.

Modifications : questions, budgetQuestion, publicProfile.



Récit retenu :

Guillaume détient un PEL de 43 600 €, un PEA de 38 000 €, un PEE de 43 000 € et 20 000 € sur Livret A.
Guillaume envisage un achat immobilier et préfère éviter le crédit. Il a aussi des besoins à environ un an et des projets à deux ou quatre ans : une partie de son argent doit pouvoir servir avant les placements de long terme.

Questions retenues :

- [expressed] Combien garderiez-vous accessible pour les prochaines années avant de renforcer les placements à long terme ?
- [editorial] Vous accepteriez un crédit pour conserver une partie des placements, ou vous attendriez de pouvoir acheter comptant ?

### Thomas à Paris

Identifiant : `prepared-tom281-2026-10-30` ; EUR ; période conservée : Décembre 2025.

55 de marge actuelle et 67 de location du parking : au maximum 122 avant frais nouveaux et mensualité si la location est remplacée. Charges et taxes inconnues ; aucun loyer futur compté.

Modifications : paragraphs, budgetQuestion, budget, publicProfile.

- Limite : Frais, taxes, mensualité et occupation du parking inconnus ; 122 ne constitue pas une mensualité recommandée.


Récit retenu :

Thomas envisage d’acheter le parking qu’il loue et d’y créer cinq places de moto : une pour lui, quatre à louer. Il voudrait emprunter sans apport sur une longue durée pour continuer à investir.
Un crédit à la consommation plus court est aussi évoqué. Les 67 € de location actuels pourraient servir au remboursement, mais il faudrait aussi payer les frais et taxes du parking. Aucun futur loyer des quatre places n’est compté dans ses revenus.

Questions retenues :

- [expressed] Le projet tiendrait-il avec un crédit plus court et plusieurs mois sans locataires ?
- [expressed] Quelle mensualité maximale accepteriez-vous pour continuer à alimenter le PEA ?

### Alexandre

Identifiant : `prepared-alessgiu-2026-10-30` ; EUR ; période conservée : Février 2026.

Formation 2 500 en 18 mois contre 100 × 18 = 1 800 : manque 700 sans prendre sur les 5 000 de sécurité. Réaffectation envisagée, pas un versement supplémentaire financé par le solde nul.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Formation ; cible 2500 ; départ 0 ; mensuel 100 ; échéance 18 mois ; total conditionnel 1800, écart au minimum -700.

Récit retenu :

Alexandre a 5 000 € de réserve, 18 000 € sur compte-titres et 3 500 € en épargne-pension. Il investit depuis trois ans et vient de simplifier ses ETF autour d’un All-World.
Il veut financer une formation à 2 500 € dans dix-huit mois, en gardant les 5 000 € de sécurité. Les 100 € mensuels ne réuniraient que 1 800 € sur cette durée : il manque 700 €. Il hésite à réduire temporairement ses placements plutôt que de vendre des ETF.
Il souhaite conserver ses placements de long terme au moins quinze ans, sans empiler de nouveaux fonds qui se recoupent.

Questions retenues :

- [editorial] Vous réduiriez temporairement les placements mensuels pour préparer les 700 € manquants ?
- [editorial] Un nouveau fonds apporterait-il vraiment quelque chose à côté de son All-World ?

### Maxime et Clara

Identifiant : `prepared-xiaolongbao641-2026-10-30` ; EUR ; période conservée : Juillet 2026.

À 8 200 de revenus, 3 850 de dépenses et 4 500 de virements, manque 150 ; à 8 500, reste 150. Les 48 000 incluent des provisions et ne deviennent pas tous un capital à investir.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.



Récit retenu :

Maxime et Clara gardent 48 000 € de réserve et provisions, à côté d’actions mondiales, de métaux précieux, d’obligations et d’autres stratégies. Les actions sont en PEA, les autres placements sur compte-titres.
Avec 4 500 € de versements, un mois à 8 200 € de revenus laisserait un manque de 150 € ; à 8 500 €, il resterait 150 €. Les virements devront donc suivre les revenus ou être lissés grâce aux liquidités.
Ils aimeraient pouvoir choisir leur rythme de travail, sans date de départ fixée. Ils préfèrent modifier la répartition avec leurs nouveaux versements plutôt qu’en vendant et se demandent quoi faire une fois les PEA remplis.

Questions retenues :

- [editorial] Vous feriez un virement fixe de 4 500 € ou vous l’adapteriez aux revenus du mois ?
- [expressed] Une fois les PEA remplis, où placeriez-vous les nouveaux versements pour préparer une baisse d’activité ?

### Adrien et Léa

Identifiant : `prepared-abar4-2026-10-30` ; CHF ; période conservée : Moyenne mensuelle 2025.

Répartition 40 % métaux, 40 % ETF, 20 % actions retrouvée dans le relevé source conservé (question exprimée Abar4), sans nouvelle consultation. Le mot « autant » est désormais chiffré. Naissance future et revenu unique conservés.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.



Récit retenu :

Adrien distingue 5 000 CHF pour le quotidien et 5 000 CHF de sécurité. Il a commencé à investir pendant l’année de ce bilan : son portefeuille se répartit entre 40 % de métaux précieux, 40 % d’ETF et 20 % d’actions. Il s’interroge sur la place des métaux avant l’arrivée de leur enfant.

Questions retenues :

- [editorial] Avant une naissance, quelle réserve garderiez-vous avec un seul revenu ?
- [expressed] Garderiez-vous 40 % de métaux précieux dans leur portefeuille avant l’arrivée du bébé ?

### Marc

Identifiant : `prepared-justbob-2026-10-30` ; CHF ; période conservée : Moyenne mensuelle 2025.

120 000 de liquidités distincts des 900 000 ETF. Douze fois 6 333 = 75 996 avant réexamen du coût futur de la santé ; opération des yeux non reconduite comme mensualité permanente.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Une année sans salaire ; cible non chiffrée ; départ 0 ; mensuel non affecté ; échéance 12 mois.

Récit retenu :

Marc voudrait pouvoir s’accorder une année sans salaire. Il a 120 000 CHF disponibles et 900 000 CHF en ETF, après dix ans d’investissement.
Au niveau des dépenses présentées, ses liquidités couvrent une année sans vendre les ETF. Pour préparer cette pause, il devra revoir certains postes : l’opération des yeux mensualisée dans ce budget n’est pas une dépense permanente.
Il hésite à partir maintenant ou à travailler encore deux ans pour garder davantage de latitude à long terme. Il souhaite aussi limiter les achats d’électronique, tout en conservant les voyages et sa vie sociale.

Questions retenues :

- [editorial] Vous financeriez cette année de pause avec les 120 000 CHF ou vous travailleriez encore un peu ?
- [editorial] Si vous avez pris une pause professionnelle, quelles dépenses aviez-vous sous-estimées ?

### Samuel

Identifiant : `prepared-markus654-2026-10-30` ; CHF ; période conservée : Moyenne mensuelle 2025.

600 × 36 = 21 600 pour objectif 21 000 hors réserve 12 000. Six mois de dépenses : 20 634 ; avec 605 de troisième pilier maintenus chaque mois : 24 264. Suspension non acquise ; aucune double affectation des 600 redirigés des ETF.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.

- Limite : Conditions de suspension du troisième pilier non établies ; 21 000 ne couvre pas son maintien. Coût réel du congé à arrêter.

- Projet : Congé de six mois ; cible 21000 ; départ 0 ; mensuel 600 envisagé ; échéance 36 mois ; total conditionnel 21600, écart au minimum 600.

Récit retenu :

Samuel a 12 000 CHF disponibles, 22 000 CHF au troisième pilier et 40 000 CHF en ETF. Il investit depuis quatre ans et a augmenté ses versements aux ETF à 2 000 CHF il y a dix-huit mois.
Il voudrait prendre six mois sans salaire dans trois ans, avec environ 21 000 CHF pour les dépenses courantes, en plus des 12 000 CHF de sécurité. Si les 605 CHF mensuels du troisième pilier devaient continuer pendant le congé, il faudrait plutôt un peu plus de 24 000 CHF.
Il envisage de ramener les ETF de 2 000 à 1 400 CHF : les 600 CHF redirigés réuniraient 21 600 CHF en trois ans. Avant de fixer le montant du congé, il lui reste à vérifier quels versements pourront être suspendus.

Questions retenues :

- [editorial] Vous réduiriez les ETF pour préparer les six mois de pause ?
- [editorial] Pendant un congé sans salaire, quels versements ou frais avez-vous continué à payer ?

### Inès

Identifiant : `prepared-lot2-01-2026-10-30` ; EUR ; période conservée : Octobre 2026.

645 × 3 = 1 935 : outils 1 500, solde 435 dans la trésorerie professionnelle. Les 6 000 personnels restent distincts ; les virements professionnels ne sont pas de l’épargne personnelle disponible.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Outils de formation ; cible 1500 ; départ 0 ; mensuel 645 ; échéance 3 mois ; total conditionnel 1935, écart au minimum 435.

Récit retenu :

Inès garde 6 000 € sur un livret personnel pour les imprévus de la famille. Elle veut réunir 1 500 € en trois mois pour les premiers outils de son activité de formation.
Les 645 € mensuels versés à l’entreprise donneraient 1 935 € en trois mois : après les outils, 435 € resteraient dans la trésorerie professionnelle. Ce montant ne serait pas une réserve personnelle supplémentaire. Elle hésite à poursuivre ces virements sans marge sur son compte.

Questions retenues :

- [editorial] Vous garderiez les 645 € pour lancer l’activité ou vous en laisseriez une partie sur son compte ?

### Aïcha

Identifiant : `prepared-lot2-02-2026-10-30` ; EUR ; période conservée : Octobre 2026.

Salaire bas 3 200 - 2 380 - 800 = 20 ; moyenne 3 350 : 170 ; haut 3 500 : 320. Les 800 sont une seule somme à partager entre réserve et projets ; 1 200 de vacances déjà mis de côté hors réserve 4 500.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Précaution ; cible 9000 ; départ 4500 ; mensuel non affecté ; échéance non arrêtée mois.

Récit retenu :

Aïcha a 4 500 € de réserve et 1 200 € déjà mis à part pour les prochaines vacances avec son enfant. Elle aimerait porter la réserve à 9 000 €, sans reprendre dans l’argent des vacances.
Les 800 € mensuels sont une seule enveloppe à partager entre cette réserve et les futurs projets de son enfant. L’école et les activités courantes sont déjà dans les dépenses.
Les mois à 3 200 € de salaire, maintenir ces 800 € ne laisse que 20 € sur le compte. Il reste 170 € au salaire moyen de 3 350 €, et 320 € les mois à 3 500 €. Elle se demande quel virement garder quand les astreintes varient.

Questions retenues :

- [editorial] Les mois à 3 200 €, vous garderiez le virement de 800 € avec seulement 20 € sur le compte ?
- [editorial] Comment partageriez-vous les 800 € entre la réserve de 9 000 € et les projets de son enfant ?

### Céline

Identifiant : `prepared-lot2-03-2026-10-30` ; EUR ; période conservée : Septembre 2026.

Projet de 600 finançable en six mois avec les 100 de l’enveloppe projets, distincts des 150 de précaution. Pas besoin de supposer que le seul financement consiste à vider les 900 actuels.

Modifications : paragraphs, questions, budgetQuestion, publicProfile, created.


- Projet : Lave-linge ; cible 600 ; départ 0 ; mensuel 100 ; échéance 9 mois ; total conditionnel 900, écart au minimum 300.

Récit retenu :

Céline a 900 € sur Livret A. Elle doit remplacer son lave-linge pour environ 600 € d’ici neuf mois et veut éviter un achat à crédit.
En consacrant les 100 € mensuels de l’enveloppe projets à la machine pendant six mois, elle réunirait les 600 €, sans prendre sur les 900 € actuels ni sur les 150 € mensuels de précaution. Reste à choisir quelle place garder aux vacances et quand acheter la machine.

Questions retenues :

- [editorial] Vous prendriez les 600 € sur le livret maintenant ou vous mettriez 100 € de côté pendant six mois ?
- [editorial] Quelle place garderiez-vous aux vacances pendant la préparation de cet achat ?

### Élodie

Identifiant : `prepared-lot2-04-2026-10-30` ; EUR ; période conservée : Août 2026.

3 200 détenus contre 5 250 pour trois mois de dépenses à 1 750. Fin des indemnités prévue septembre 2026 : passé conservé. Ordinateur 1 200 avec 100 × 12, ni recettes d’activité ni indemnités prolongées inventées.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.

- Limite : Revenus d’activité après la fin prévue des indemnités non établis.

- Projet : Ordinateur professionnel ; cible 1200 ; départ 0 ; mensuel 100 ; échéance 12 mois ; total conditionnel 1200, écart au minimum 0.

Récit retenu :

Élodie avait 3 200 € sur un livret. Avant la fin de ses indemnités prévue en septembre 2026, elle voulait protéger trois mois de ses dépenses : 5 250 € au niveau des 1 750 € présentés.
Elle envisageait un ordinateur professionnel à 1 200 €. Les 100 € versés chaque mois à l’entreprise ne le financeraient qu’en un an, alors que les revenus de l’activité n’étaient pas encore là. Elle hésitait à attendre plutôt qu’à reprendre sur son livret.

Questions retenues :

- [editorial] Vous prendriez 1 200 € sur le livret pour l’ordinateur ou vous attendriez les virements de 100 € ?
- [editorial] Comment prépareriez-vous la fin des indemnités sans compter sur des ventes encore incertaines ?

### Soraya

Identifiant : `prepared-lot2-05-2026-10-30` ; EUR ; période conservée : Août 2026.

À 2 500, déficit 180 ; à 3 000, reste 320 ; moyenne reste 70. Objectif réserve 2 000 non garanti et aucun virement réalisé inventé.

Modifications : budgetQuestion.


- Projet : Précaution ; cible 2000 ; départ 600 ; mensuel non affecté ; échéance 24 mois.

Récit retenu :

Soraya a 600 € de réserve et voudrait revenir à 2 000 € dans les deux ans. Avec un salaire de 2 500 €, son budget manque de 180 € ; à 3 000 €, il laisse 320 €.
Elle hésite à fixer ses dépenses sur les mois les moins rémunérés ou à alimenter la réserve surtout pendant les bons mois. Les vacances et les cadeaux sont prévus dans le budget, mais elle ne veut plus les financer en reprenant dans la réserve.

Questions retenues :

- [editorial] Vous baseriez les dépenses sur les mois à 2 500 € ou sur la moyenne ?
- [editorial] Quelle enveloppe ajusteriez-vous avant d’entamer les 600 € de réserve ?

### Maud

Identifiant : `prepared-lot2-06-2026-10-30` ; EUR ; période conservée : Juillet 2026.

350 × 36 = 12 600 : travaux 12 000 finançables sans diminuer le PER si cette somme n’a pas d’autre usage. Réduire le PER devient une option pour avancer les travaux, pas une nécessité pour les financer à trois ans.

Modifications : paragraphs, questions, budgetQuestion, publicProfile, created.


- Projet : Salle de bains ; cible 12000 ; départ 0 ; mensuel 350 ; échéance 36 mois ; total conditionnel 12600, écart au minimum 600.

Récit retenu :

Maud a 14 000 € de précaution sur livrets, 28 000 € sur PER et 18 000 € en assurance-vie. Elle investit pour la retraite depuis six ans.
Pour sa salle de bains à 12 000 € dans trois ans, les 350 € mensuels sur Livret A réuniraient 12 600 € sans retrait. Elle pourrait donc financer les travaux à cette échéance sans prendre sur les 14 000 € de précaution ni réduire le PER.
Elle se demande plutôt si elle préfère attendre ces trois ans ou avancer les travaux en réduisant temporairement ses versements retraite.

Questions retenues :

- [editorial] Vous attendriez trois ans avec les 350 € mensuels ou vous réduiriez le PER pour faire les travaux plus tôt ?

### Sylvie et Alain

Identifiant : `prepared-lot2-07-2026-10-30` ; EUR ; période conservée : Juin 2026.

Les 6 000 de travaux sont déjà détenus et distincts des 18 000 de sécurité. Chauffage déjà finançable en capital ; pension d’Alain inconnue, pas d’hypothèse de revenu pour garantir les futurs voyages.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Chauffage ; cible 6000 ; départ 6000 ; mensuel non affecté ; échéance 18 mois.

Récit retenu :

Sylvie et Alain ont 18 000 € pour les imprévus et 6 000 € pour l’entretien de leur maison. Ils voudraient remplacer le chauffage pour environ 6 000 € dans dix-huit mois. Cette somme est déjà disponible, mais l’utiliser entièrement viderait leur poche travaux.
Ils hésitent à engager ces travaux tout de suite ou à attendre de connaître la future pension d’Alain. Leur budget actuel compte encore son salaire ; ils ne veulent pas décider des prochains voyages à partir d’un revenu de retraite qu’ils ne connaissent pas.

Questions retenues :

- [editorial] Vous engageriez les travaux avant de connaître la pension d’Alain ?
- [editorial] Quels frais de propriétaire vous ont surpris au passage à la retraite ?

### Émilie

Identifiant : `prepared-lot2-08-2026-10-30` ; EUR ; période conservée : Juin 2026.

7 000 + 500 × 36 = 25 000 au total : 20 000 d’apport et 5 000 de sécurité, sans compter les 7 000 une seconde fois. Budget et réserves personnels distingués du projet commun.

Modifications : questions, budgetQuestion, publicProfile.


- Projet : Apport et sécurité ; cible 25000 ; départ 7000 ; mensuel 500 ; échéance 36 mois ; total conditionnel 25000, écart au minimum 0.

Récit retenu :

Émilie a 7 000 € sur un livret à son nom. Elle voudrait préparer 20 000 € d’apport dans trois ans, en gardant 5 000 € de sécurité séparés du budget de son conjoint.
Avec 500 € par mois, elle pourrait atteindre 25 000 € de liquidités en trois ans avant les imprévus. Elle hésite à immobiliser une partie de l’argent alors que l’achat est relativement proche.

Questions retenues :

- [editorial] Vous garderiez l’apport entièrement accessible avec un achat dans trois ans ?
- [editorial] Pour un achat à deux, vous gardez chacun votre réserve ou vous créez une enveloppe commune ?

### Anaïs

Identifiant : `prepared-lot2-09-2026-10-30` ; EUR ; période conservée : Juillet 2026.

1 200 détenus, 150 d’épargne et 60 de vacances déjà dans les dépenses. Apport 10 000 en six ans non promis si des retraits sont nécessaires ; les aides variables non chiffrées restent exclues.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Apport ; cible 10000 ; départ 0 ; mensuel 150 ; échéance 72 mois ; total conditionnel 10800, écart au minimum 800.

Récit retenu :

Anaïs a 1 200 € sur un livret. Elle aimerait réunir 10 000 € d’apport dans six ans, tout en gardant une petite réserve et en devenant moins dépendante de ses parents pour les vacances.
Les vacances ont déjà une provision personnelle de 60 € dans les dépenses. Les 150 € d’épargne peuvent donc se partager entre réserve et apport, mais les 20 € restants sur le compte laissent peu de souplesse si elle doit reprendre de l’argent.

Questions retenues :

- [editorial] Si vous avez préparé un apport avec un salaire proche de 1 400 €, qu’est-ce qui vous a le plus aidé ?
- [ouverture] Avec 20 € de marge, ce budget vous semble-t-il tenable ? 🤔💬

### Pauline

Identifiant : `prepared-lot2-10-2026-10-30` ; EUR ; période conservée : Octobre 2025.

Part personnelle affichée dès l’introduction. 3 500 à Pauline et 2 000 aux filles distincts. Travaux 2 500 non financés : même 80 × 24 = 1 920 avant toute épargne, sans toucher aux stocks. Entretien 70 déjà compté.

Modifications : paragraphs, questions, budgetQuestion, budget, display, publicProfile, created.


- Projet : Travaux supplémentaires ; cible 2500 ; départ 0 ; mensuel non affecté ; échéance 24 mois.

Récit retenu :

Pauline garde 3 500 € sur un livret personnel et 2 000 € à part pour ses filles. Elle aimerait réserver 2 500 € de son côté pour de petits travaux dans la maison de campagne d’ici deux ans.
Les 70 € d’entretien des deux logements sont déjà dans ses dépenses ; ils ne financent pas ces travaux supplémentaires. Même en consacrant les 80 € disponibles avant épargne aux travaux pendant deux ans, elle ne réunirait que 1 920 €.
Pour tenir l’échéance sans utiliser les 2 000 € des filles, il faudrait donc repousser une autre dépense ou prendre sur son livret personnel. Reporter les travaux reste aussi une possibilité.

Questions retenues :

- [editorial] Pour les 2 500 € de travaux, vous utiliseriez une partie des 3 500 € personnels ou vous repousseriez le chantier ?
- [editorial] Vous garderiez les 20 € mensuels pour les filles ou vous les laisseriez sur son compte pendant les mois serrés ?

### Zoé

Identifiant : `prepared-lot2-11-2026-10-30` ; EUR ; période conservée : Octobre 2025.

700 / 163,97 = environ 4,27 mois, sans imprévu. Ordinateur 600 reporté ; suppression d’une question qui redemandait de valider ce report déjà annoncé, aucune aide supplémentaire inventée.

Modifications : questions, budgetQuestion, publicProfile.


- Projet : Ordinateur reporté ; cible 600 ; départ 0 ; mensuel non affecté ; échéance non arrêtée mois.

Récit retenu :

Zoé a 700 € de réserve. Le déficit de près de 164 € par mois la consommerait en un peu plus de quatre mois, sans même un imprévu.
Elle voudrait remplacer son ordinateur pour 600 €, mais préfère reporter cet achat. Sa priorité est de rendre le logement finançable et de préparer la fin du stage, sans compter sur une aide supplémentaire de ses parents.

Questions retenues :

- [editorial] Que faudrait-il changer pour rendre ce logement tenable avec ses ressources ?

### Jade

Identifiant : `prepared-lot2-12-2026-10-30` ; EUR ; période conservée : Octobre 2026.

Stock 12 000 scindé en 6 000 sécurité et 6 000 projets. Voyage 3 000 compris dans les voyages budgétés à 500/mois, pas un coût ajouté. Une seule question sur les comptes, doublon supprimé.

Modifications : questions, budgetQuestion, publicProfile.


- Projet : Voyage ; cible 3000 ; départ 0 ; mensuel non affecté ; échéance 12 mois.

Récit retenu :

Jade dispose de 12 000 € d’épargne. Elle voudrait garder 6 000 € pour les imprévus et utiliser l’autre moitié pour ses projets, dont un voyage à 3 000 € l’an prochain.
Le voyage doit tenir dans l’enveloppe déjà prévue, pas s’y ajouter. Les restaurants, achats et voyages l’amènent parfois à reprendre de l’argent épargné : elle hésite à séparer ses comptes plutôt qu’à augmenter le virement de 1 000 €.

Questions retenues :

- [editorial] Vous sépareriez les comptes pour protéger les 6 000 € de sécurité ?

### Lucie

Identifiant : `prepared-lot2-13-2026-10-30` ; EUR ; période conservée : Février 2026.

Participation du conjoint 600 distincte de son salaire inconnu. Provision de régularisation d’impôt 50 déjà comptée ; aucun crédit accéléré sans réaffectation des 50 disponibles.

Modifications : budgetQuestion.


- Projet : Précaution ; cible 3000 ; départ 1600 ; mensuel non affecté ; échéance non arrêtée mois.

Récit retenu :

Lucie a 1 600 € de réserve. Elle voudrait atteindre 3 000 € avant de consacrer davantage au remboursement du crédit à la consommation.
La taxe et l’entretien du logement ont leurs enveloppes, mais un gros remplacement pourrait encore demander de puiser sur le livret. Elle hésite à conserver les 50 € de marge sur le compte ou à les ajouter au virement de précaution.

Questions retenues :

- [editorial] Vous doubleriez le virement de 50 € ou vous garderiez cette marge sur le compte ?
- [editorial] À partir de quelle réserve commenceriez-vous à rembourser davantage le crédit ?

### Chloé et Nathan

Identifiant : `prepared-lot2-14-2026-10-30` ; EUR ; période conservée : Mars 2026.

Nouveau loyer 1 100 contre 790 : +310 ; versements soutenables au maximum 490 à autres dépenses identiques. Déménagement déjà provisionné séparément de la réserve, pas réputé devoir vider celle-ci.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Logement plus grand ; cible non chiffrée ; départ 0 ; mensuel non affecté ; échéance 18 mois.

Récit retenu :

Chloé et Nathan ont 6 000 € pour leur déménagement et 3 000 € de réserve. Ils aimeraient quitter le T2 dans dix-huit mois et regardent des loyers autour de 1 100 €.
À autres dépenses identiques, passer du loyer de 790 € à 1 100 € laisserait 490 € pour les versements, au lieu de 800 €. Les frais d’installation ont leur enveloppe, séparée des 3 000 € de précaution. Leur choix porte surtout sur le logement plus grand et le rythme d’épargne ensuite.

Questions retenues :

- [editorial] Vous accepteriez de passer de 800 à 490 € de versements pour avoir le logement plus grand ?
- [editorial] Lors d’un déménagement, quels frais ont dépassé ce que vous aviez prévu ?

### Hadrien

Identifiant : `prepared-lot2-15-2026-10-30` ; EUR ; période conservée : Salaire 2026 · dépenses moyennes 2025.

Salaire 2026 et dépenses moyennes 2025 explicitement conservés. Stocks 7 500 et 60 000 distincts des versements actuels ; salaire à quatre jours inconnu. Deux questions très proches ramenées à une.

Modifications : questions, budgetQuestion, publicProfile.

- Limite : Salaire à quatre jours inconnu ; dépenses moyennes 2025 et salaire 2026 restent distincts.

- Projet : Réduction du temps de travail ; cible non chiffrée ; départ 0 ; mensuel non affecté ; échéance 60 mois.

Récit retenu :

Hadrien a 7 500 € de réserve et 60 000 € en ETF. Il investit depuis quatre ans, avec un horizon d’au moins quinze ans.
Il voudrait pouvoir passer à quatre jours par semaine dans cinq ans. Il hésite à conserver 2 200 € de versements en ETF ou à préparer davantage de liquidités pour les premiers mois à temps partiel. Aucun futur salaire réduit n’est compté dans ce budget.

Questions retenues :

- [editorial] Vous garderiez les 2 200 € en ETF ou vous prépareriez une poche disponible pour la transition ?

### Victor

Identifiant : `prepared-lot2-16-2026-10-30` ; EUR ; période conservée : Mars 2026.

Passage envisagé de 650 à 550 investis et utilisation des 70 libres : 170 × 12 = 2 040, portant 4 000 à 6 040. Pas un versement déjà adopté ; temps plein non compté dans les ressources.

Modifications : budgetQuestion.


- Projet : Réserve de mobilité professionnelle ; cible 6000 ; départ 4000 ; mensuel non affecté ; échéance 12 mois.

Récit retenu :

Victor a 4 000 € de réserve et 5 500 € sur un compte-titres investi en actions mondiales depuis un an. Ses placements de long terme doivent rester en place au moins dix ans.
Il voudrait porter la réserve à 6 000 € dans un an pour pouvoir changer de travail sans se précipiter. Il envisage de ramener temporairement les placements de 650 à 550 €, en plus de la marge du mois, plutôt que de vendre des parts.

Questions retenues :

- [editorial] Vous réduiriez les placements pendant un an pour atteindre les 6 000 € de réserve ?
- [editorial] Le temps libre des 32 heures vous paraît-il préférable à un passage à temps plein ?

### Olivier et Alice

Identifiant : `prepared-lot2-17-2026-10-30` ; EUR ; période conservée : Janvier 2026.

80 000 sur comptes/livrets ne sont pas 80 000 d’apport arrêté. Maison à huit ans et troisième enfant envisagés ; aucun revenu locatif futur ni coût immobilier garanti.

Modifications : budgetQuestion.



Récit retenu :

Olivier et Alice disposent d’environ 80 000 € sur comptes et livrets, à côté de PEA, d’épargne salariale et d’assurance-vie. Ils envisagent un troisième enfant et un départ professionnel en province.
Ils aimeraient acheter une maison familiale dans huit ans et se demandent s’ils doivent garder leur appartement parisien pour le louer. Les loyers éventuels ne sont pas comptés dans ce budget.

Questions retenues :

- [expressed] Pour acheter dans huit ans, où placeriez-vous l’argent destiné à l’apport ?
- [expressed] Vous garderiez l’appartement en location ou vous le vendriez pour préparer la maison ?

### Sébastien et Mélanie

Identifiant : `prepared-lot2-18-2026-10-30` ; EUR ; période conservée : Octobre 2026.

50 000 d’épargne salariale attendus en 2027 exclus des revenus actuels, partage 40 000 + 10 000. Montant et disponibilité futurs non garantis ; pas de déblocage de contrat affirmé sans preuve.

Modifications : paragraphs, budgetQuestion, publicProfile.

- Limite : Montant et disponibilité de l’épargne salariale en 2027 restent attendus, pas garantis.


Récit retenu :

Sébastien et Mélanie investissent sur vingt à vingt-cinq ans. Ils souhaitent garder les quelque 25 000 € de leur Livret A tout en diversifiant leurs placements.
Ils attendent environ 50 000 € d’épargne salariale en 2027, séparément de leurs revenus mensuels : ils envisageaient d’en investir 40 000 € en ETF et de garder 10 000 € pour un éventuel apport. Ils comparent encore immobilier locatif, SCPI et placements financiers.

Questions retenues :

- [expressed] Avec cet horizon, vous ajouteriez de l’immobilier à leurs placements financiers ?
- [expressed] Si les fonds attendus arrivent, comment les partageriez-vous entre ETF et apport immobilier ?

### Arthur et Emma

Identifiant : `prepared-lot2-19-2026-10-30` ; EUR ; période conservée : Août 2026.

30 000 et 15 000 de patrimoine individuel distincts des virements communs 800. Projet locatif 100 000 frais inclus mais financement non arrêté ; futurs salaires et loyers non comptés.

Modifications : budgetQuestion.



Récit retenu :

Arthur et Emma ont respectivement 30 000 € et 15 000 €, surtout sur livrets, ainsi qu’un PEA alimenté depuis quelques mois. Ils envisagent un logement étudiant à louer sur place, pour 100 000 € maximum frais inclus.
Ils aimeraient apprendre le locatif pendant l’internat, avant une mobilité professionnelle dans quatre ou cinq ans et l’achat de leur résidence principale. Ils s’interrogent sur les travaux, les impayés et le crédit qu’ils pourraient porter avec leurs revenus actuels.

Questions retenues :

- [expressed] Vous commenceriez ce projet locatif pendant l’internat ou vous attendriez une situation plus stable ?
- [expressed] Combien garderiez-vous de côté et quelle marge d’emprunt laisseriez-vous pour leur futur logement ?

### Vincent et Sarah

Identifiant : `prepared-lot2-20-2026-10-30` ; EUR ; période conservée : Janvier 2026.

400 d’excédent locatif déjà net de charges/crédits/impôt ; rien n’est déduit deux fois. Objectif futur 2 500 non pris pour revenu actuel ; 30 000 de stock et 2 600 de virements séparés.

Modifications : budgetQuestion.



Récit retenu :

Vincent et Sarah mentionnent 30 000 € d’épargne disponible au début de leur réflexion.
Ils visent 2 500 € nets de revenus locatifs mensuels dans six ans pour réduire leur activité. Ils se demandent si ce rythme est réaliste et s’il vaut mieux continuer à acheter ou consolider leurs biens actuels.

Questions retenues :

- [expressed] Vous achèteriez un autre bien ou vous renforceriez d’abord la réserve pour les trois appartements ?
- [expressed] L’objectif de rente vous semble-t-il atteignable sans compter d’avance sur les prochains achats ?

### Élise et Karim

Identifiant : `reddit-famille-bourges-2026-07-12` ; EUR ; période conservée : Juillet 2026.

Les 150 annoncés dans le contexte ancien ne se rapprochent pas d’une mensualité autonome du tableau (crédits regroupés 922,03). Aucun allègement automatique affirmé sans échéancier ; 150 de carburant ne sont jamais un crédit. Assurances : 151,54 + 105,30 = 256,84.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.

- Limite : Échéancier et ventilation du crédit automobile de 150 non rapprochés du regroupement de 922,03 ; aucun futur gain de 150 affirmé.


Récit retenu :

Élise et Karim veulent retrouver une marge après des mois à découvert. Leur regroupement de crédits inclut notamment des frais de santé.
Le budget reste fondé sur les 922,03 € de crédits regroupés. Avant de prévoir davantage de marge grâce à une fin de crédit, il faudrait connaître le montant des prochaines échéances.

Questions retenues :

- [editorial] Combien garderiez-vous sur le compte chaque mois pour éviter un nouveau découvert ?
- [editorial] Près de 257 € d’assurance pour deux voitures, c’est comparable à ce que vous payez ?

### Lina

Identifiant : `budget-conseil-personne_seule-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Déficit 130 conservé, réserve 1 200 et formation 600 non financée. Aucune allocation ou hausse salariale inventée ; question porte sur la dépense manquante à financer, pas sur l’investissement.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.



Récit retenu :

Lina garde 1 200 CHF de réserve et n’a aucun placement. Elle aimerait suivre une formation à 600 CHF dans neuf mois, mais son budget entame déjà cette réserve.
Elle voudrait garder du temps pour se former, mais son budget à 60 % ne tient pas encore. La formation attendra tant que les dépenses dépassent les ressources.

Questions retenues :

- [editorial] Quel poste changeriez-vous pour arrêter de prendre 130 CHF chaque mois sur le livret ?

### Nadia

Identifiant : `budget-conseil-monoparent_1enfant-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Déficit 40, lunettes 400 et provision dentaire/optique 40 distincts. La garde familiale n’est pas facturée à nouveau ; déficit ne signifie pas découvert bancaire déjà établi.

Modifications : questions, budgetQuestion, publicProfile.



Récit retenu :

Nadia a 2 500 CHF de réserve. Sa famille assure les sorties d’école ; elle n’a pas de garde payante à ajouter au budget.
Elle veut préserver cette réserve et préparer 400 CHF de lunettes pour son enfant. Les soins optiques ont déjà leur provision : elle hésite plutôt sur les vacances tant que le mois reste déficitaire.

Questions retenues :

- [editorial] Avec 40 CHF manquants chaque mois, quelle enveloppe ajusteriez-vous sans toucher aux soins de son enfant ?
- [editorial] Les lunettes, vous les préparez sur une enveloppe à part ou dans une provision santé commune ?

### Karine

Identifiant : `budget-conseil-monoparent_2enfants-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Déficit 100 et camp 600 : ce camp doit tenir dans les 80 école/loisirs/camps, dont les autres usages restent à payer ; aucune garantie que tout soit disponible.

Modifications : questions, budgetQuestion, publicProfile.

- Limite : Les 80 école/loisirs/camps ont plusieurs usages ; disponibilité pour le camp non garantie en déficit.


Récit retenu :

Karine a 900 CHF de réserve et aucun placement. Elle voudrait préparer un séjour en camp à 600 CHF pour ses deux enfants ; cette dépense doit tenir dans l’enveloppe école et camps, pas s’y ajouter.
Le déficit réduit vite sa réserve. Elle préfère décider du séjour seulement après avoir retrouvé une marge, plutôt que de puiser dans l’argent des soins.

Questions retenues :

- [editorial] Avec 100 CHF de déficit, qu’est-ce que vous changeriez pour financer les 600 CHF du camp des enfants ?

### Maëlle et Éric

Identifiant : `budget-conseil-couple-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Déficit 240 conservé. Réserve 3 500, souhait de 5 000 et coût d’un déménagement non chiffré : aucune économie nette inventée ; question invite aux expériences de délai de retour des frais.

Modifications : questions, budgetQuestion, publicProfile.



Récit retenu :

Maëlle et Éric ont 3 500 CHF de côté et voudraient remonter leur réserve à 5 000 CHF. Pour l’instant, ils doivent surtout éviter de l’entamer chaque mois.
Ils comparent une baisse des sorties et des vacances avec la recherche d’un logement moins cher. Changer de logement pourrait réduire les frais fixes, mais demanderait aussi de financer le déménagement.

Questions retenues :

- [editorial] Vous commenceriez par les dépenses flexibles ou par la recherche d’un autre logement ?
- [editorial] Si vous avez déménagé pour réduire un loyer, en combien de temps l’économie a-t-elle couvert les frais ?

### Mélissa et Johan

Identifiant : `budget-conseil-couple_1enfant-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Déficit 260 ; suspendre les 140 de vacances laisserait encore 120 à financer. Lit 600 inclus dans l’usage de la provision équipement 60, sans en garantir la date de financement ni facturer la garde familiale.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.

- Limite : Date d’achat du lit non arrêtée ; provision équipement incluse mais budget déficitaire.


Récit retenu :

Mélissa et Johan ont 1 800 CHF de réserve. Leurs horaires et l’aide de la famille permettent la garde de leur enfant sans facture supplémentaire.
Ils doivent remplacer le lit de leur enfant pour environ 600 CHF. La provision équipement de 60 CHF est déjà dans les dépenses, mais toutes les enveloppes du mois ne sont pas financées.
Ils envisagent de reporter un week-end. Même en mettant entièrement les 140 CHF de provision vacances en pause, il resterait 120 CHF à trouver chaque mois pour couvrir le budget actuel.

Questions retenues :

- [editorial] En mettant les 140 CHF de vacances en pause, où chercheriez-vous les 120 CHF qui manquent encore ?

### Salomé et Fabien

Identifiant : `budget-conseil-couple_2enfants-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Déficit 250 conservé, baisse de 60 à 50 % seulement envisagée. Garde familiale gratuite déjà établie : réduction du temps de travail ne crée pas une économie de garde inexistante.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.



Récit retenu :

Salomé et Fabien gardent 4 000 CHF pour les imprévus. Salomé aimerait passer à 50 % pendant deux ans pour être davantage présente après l’école.
Le budget manque déjà de 250 CHF avec leurs horaires actuels. La garde étant assurée par la famille, travailler moins ne ferait pas disparaître une facture de garde. Ils veulent d’abord savoir quelles dépenses peuvent réellement baisser.

Questions retenues :

- [editorial] Qu’est-ce qui devrait changer pour qu’elle puisse passer à 50 % sans reprendre sur les 4 000 CHF ?

### Amandine et Nicolas

Identifiant : `budget-conseil-couple_3enfants-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Déficit 300, vacances 2 400 à dix-huit mois et provision vacances 180 ; 180 × 18 ne peut être tenu pour de l’argent effectivement épargné tant que les enveloppes ne sont pas financées.

Modifications : budgetQuestion.



Récit retenu :

Amandine et Nicolas ont 6 000 CHF de réserve. Ils aimeraient prévoir un séjour familial à 2 400 CHF dans dix-huit mois.
Les vacances ont leur enveloppe, mais elle ne peut pas être réellement alimentée tant que le budget reste déficitaire. Ils comparent un séjour plus simple avec le report du départ, pour éviter de financer les vacances depuis la réserve.

Questions retenues :

- [editorial] Vous reporteriez le séjour ou vous chercheriez une formule moins chère ?
- [editorial] Quelles dépenses reverriez-vous avant de commencer à remplir l’enveloppe vacances ?

### Yasmina

Identifiant : `budget-conseil-monoparent_3enfants-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Même 60 × 18 = 1 080 < soins 1 200 : manque au moins 120, avant les autres soins optiques/dentaires de la famille. Déficit 160 conservé ; ni frais ajoutés une seconde fois ni nouvelle recette.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.

- Limite : Les 60 couvrent aussi d’autres soins dentaires/optiques ; 120 est un manque minimum, pas un devis complet.


Récit retenu :

Yasmina dispose de 2 200 CHF de réserve. Son aîné approche de l’adolescence et elle prévoit aussi 1 200 CHF de soins orthodontiques à financer sur dix-huit mois.
Même en consacrant les 60 CHF mensuels de provision dentaire et optique à ce seul traitement, elle ne réunirait que 1 080 CHF en dix-huit mois. Il manquerait au moins 120 CHF, sans compter les autres soins de la famille.
Le budget manque déjà de 160 CHF par mois. Elle veut revoir les dépenses flexibles avant d’entamer davantage les 2 200 CHF de réserve, sans compter sur une recette supplémentaire.

Questions retenues :

- [editorial] Comment prépareriez-vous les soins alors que le mois manque déjà de 160 CHF ?
- [editorial] Vous gardez une seule enveloppe santé pour toute la famille ou une part par enfant ?

### Timéo

Identifiant : `budget-conseil-apprenties_majeures-2025-2026` ; CHF ; période conservée : Référence 2025–2026.

Permis 2 400 / 24 = 100/mois ; déficit 5 après contribution familiale future 300, donc 105 de dépenses à réduire pour ce virement. Qualification budget prévu rendue visible, revenu inchangé.

Modifications : paragraphs, display, publicProfile.



Récit retenu :

Timéo garde 600 CHF pour les imprévus. Il voudrait préparer 2 400 CHF pour le permis en deux ans, sans utiliser cette réserve.
Une fois la contribution prévue de 300 CHF au foyer mise en place, le budget manquerait de 5 CHF. Pour verser 100 CHF par mois au permis, il faudrait donc réduire les dépenses de 105 CHF. Il hésite entre moins de sorties et moins d’achats de vêtements.

Questions retenues :

- [editorial] Où trouveriez-vous les 105 CHF nécessaires au virement de 100 CHF pour le permis ?
- [ouverture] Que pensez-vous de son budget ? 🤔💬

### Michel

Identifiant : `websourd-retraite-normandie-2026-10-02` ; EUR ; période conservée : Octobre 2026.

Réserve 350, réparation 120 et remplacement 450 conservés. Les 60 sont déjà inclus dans les 1 100 : seul reliquat non dépensé peut rejoindre le livret. Aucun diagnostic, garantie ou durée de réparation inventés.

Modifications : paragraphs, questions, budgetQuestion, publicProfile.


- Projet : Réfrigérateur ; cible 450 ; départ 0 ; mensuel non affecté ; échéance non arrêtée mois.

Récit retenu :

Michel a 350 € sur Livret A. Son réfrigérateur est en panne : il compare une réparation à 120 € avec un appareil à 450 €.
Les 60 € d’imprévus sont déjà prévus dans ses dépenses mensuelles. Seule la part non utilisée pourrait financer la réparation ou rejoindre les 350 € du livret pour préparer le remplacement.

Questions retenues :

- [editorial] Vous répareriez pour 120 € ou vous prépareriez l’achat à 450 € ?
- [editorial] Pour remplacer l’électroménager, vous gardez une enveloppe à part ou vous utilisez votre réserve générale ?

### Benoît

Identifiant : `finary-freelance-lille-2025-03-02` ; EUR ; période conservée : Mars 2025.

12 000 + 2 000 × 3 = 18 000 : objectif minimum 17 000 atteint au troisième mois. Pas d’obligation de maintenir indéfiniment ce virement ni de nouveaux loyers comptés.

Modifications : budgetQuestion.



Récit retenu :

Après l’achat de son logement, Benoît dispose de 12 000 € d’épargne. Il vise 17 000 € sur Livret A avant de commencer à investir à long terme.
Il envisage ensuite de louer ce logement et d’en acheter un autre pour y vivre. Aucun loyer futur n’est compté dans ses revenus actuels.

Questions retenues :

- [expressed] Vous attendriez d’avoir 17 000 € de côté avant de commencer à investir ?
- [expressed] Vous lanceriez les placements en bourse et le projet locatif en même temps ou l’un après l’autre ?

### Axel

Identifiant : `finary-installation-projet-2026-02-21` ; EUR ; période conservée : Installation en 2026.

Dette 600 / 50 = 12 mois sans intérêts ; 200 de LDDS servent en partie à des dépenses annuelles, pas entièrement une hausse du patrimoine. Deux questions conservées sur supports et installation.

Modifications : budgetQuestion.



Récit retenu :

Axel a 10 000 € sur LEP pour les imprévus et 6 000 € sur LDDS pour les dépenses proches. Son PEA, ouvert fin 2024, reçoit des versements sur un ETF World depuis janvier 2026. Il possède aussi deux assurances-vie.
Il envisage de fermer le contrat piloté pour renforcer le PEA sur plus de dix ans, et de garder un fonds euros pour des projets à cinq ans environ. Les versements sur LDDS servent aussi à des dépenses annuelles : ils ne sont pas entièrement une épargne nouvelle.
Il lui reste 600 € d’équipement à rembourser sans frais, à raison de 50 € sur douze mois. Il hésite à terminer les échéances ou à solder ce petit crédit depuis le LDDS pour simplifier son installation.

Questions retenues :

- [expressed] Pour des projets à cinq ans, vous choisiriez les livrets, le fonds euros ou un peu des deux ?
- [expressed] Vous ajouteriez déjà d’autres placements au PEA ou vous garderiez le World pendant l’installation ?

### Apolline

Identifiant : `finary-alternante-projet-2026-10-06` ; EUR ; période conservée : Novembre–décembre 2026.

Objectif 100 000 avant 25 ans sans promesse de salaire après 2027 ni prolongation du logement payé jusqu’au M2. Le livret 14 060 a plusieurs usages, pas trois poches chacune du même montant.

Modifications : budgetQuestion.

- Limite : Revenus après 2027, aides et logement après M2 inconnus ; objectif 100 000 non promis.


Récit retenu :

Apolline dispose de 14 060 € sur Livret A en octobre 2026. Elle investit sur un ETF World dans un PEA ouvert en juillet et a ouvert une assurance-vie pour un projet de SCPI. Le livret doit servir aux imprévus, aux voyages et à un futur apport.
Elle vise 100 000 € de patrimoine avant 25 ans, mais ne sait vraiment à quoi s’attendre que pour 2026–2027. L’aide de ses parents pour le loyer doit durer jusqu’au M2.

Questions retenues :

- [editorial] Combien garderiez-vous sur le livret pour les imprévus et les voyages, avec ces dépenses courantes à financer ?
- [expressed] Son objectif avant 25 ans vous paraît-il réaliste, et que faudrait-il prévoir après l’alternance ?

### Émilien

Identifiant : `finary-ingenieur-colocation-projet-2026-08-18` ; EUR ; période conservée : Rentrée à venir · année non précisée.

Projet étranger 4 000 dans deux ans, réserve 2 500 séparée. Proposition 750 au total : 170 séjour et 580 PEA ; 170 × 24 = 4 080. Restent 110, pas 110 moins un deuxième versement de 170.

Modifications : paragraphs, questions, budgetQuestion, publicProfile, created.


- Projet : Semestre à l’étranger ; cible 4000 ; départ 0 ; mensuel 170 envisagé ; échéance 24 mois ; total conditionnel 4080, écart au minimum 80.

Récit retenu :

Émilien a 2 500 € sur un livret et 1 800 € sur PEA. Il investit depuis ses 18 ans, avec 85 % en actions mondiales et 15 % en marchés émergents.
Il voudrait garder les 2 500 € de sécurité et préparer 4 000 € pour un semestre à l’étranger dans deux ans. Il hésite toujours entre 750 € mensuels de versements et un rythme plus souple ; rien n’est encore décidé.
Sur les 750 € envisagés, il pourrait réserver 170 € au séjour et investir 580 € sur le PEA. Les 170 € réuniraient 4 080 € en deux ans, sans utiliser les 2 500 € de sécurité. Il resterait 110 € par mois pour les écarts : les 170 € ne s’ajoutent pas aux 750 €.

Questions retenues :

- [editorial] Vous commenceriez à 750 € ou vous garderiez plus de marge pendant les premiers mois ?
- [editorial] Quels frais imprévus ajouteriez-vous au budget de 4 000 € pour le semestre ?

### Clémence

Identifiant : `reference-bordeaux-budget-2026-03` ; EUR ; période conservée : Mars 2026.

1 200 + 250 × 18 = 5 700, minimum 5 000 atteint avant échéance. Fin du crédit libère 150 seulement, pas les 217 incluant 67 d’assurance. Vélo 1 200 non financé deux fois.

Modifications : budgetQuestion.


- Projet : Précaution ; cible 5000 ; départ 1200 ; mensuel 250 ; échéance 18 mois ; total conditionnel 5700, écart au minimum 700.
- Projet : Vélo électrique après la réserve ; cible 1200 ; départ 0 ; mensuel non affecté ; échéance non arrêtée mois.

Récit retenu :

Clémence a 1 200 € sur Livret A et voudrait atteindre 5 000 € de réserve dans les dix-huit mois. Le virement de 250 € est sa priorité avant de commencer à investir.
Le crédit auto se termine huit mois après ce budget. Sur les 217 € de la ligne, 150 € concernent le crédit et 67 € l’assurance : seuls les 150 € seront libérés. Elle hésite à accélérer le livret ou à préparer ensuite un vélo électrique à 1 200 €.

Questions retenues :

- [editorial] Vous mettriez les 150 € libérés sur le livret avant de préparer le vélo ?
- [editorial] Quelle réserve viseriez-vous avant son premier placement de long terme ?

### Hugo et Océane

Identifiant : `reference-couple-lille-budget-2026-01` ; EUR ; période conservée : Janvier 2026.

Sans primes : 4 200 - 2 970 - 1 450 = -220. Après crédit 187 terminé, encore -33 à virements identiques. Deux stocks 5 000 sécurité et 3 000 apport ; les objectifs sont des minima, pas des égalités forcées.

Modifications : paragraphs, budgetQuestion, publicProfile.


- Projet : Apport ; cible 35000 ; départ 3000 ; mensuel 800 ; échéance 48 mois ; total conditionnel 41400, écart au minimum 6400.
- Projet : Précaution ; cible 9000 ; départ 5000 ; mensuel 400 ; échéance non arrêtée mois.

Récit retenu :

Hugo et Océane ont 8 000 € sur livrets : 5 000 € pour les imprévus et 3 000 € pour l’apport. Ils visent 9 000 € de sécurité et 35 000 € d’apport dans quatre ans ; ces objectifs ne sont pas encore atteints.
Sans les primes de nuit, leurs versements laisseraient un manque de 220 €. Le crédit auto de 187 € doit se terminer en septembre, après ce budget de janvier : même une fois terminé, il manquerait encore 33 € les mois sans primes, à virements identiques.

Questions retenues :

- [editorial] Vous ajusteriez les virements aux primes ou vous fixeriez un montant plus bas ?
- [editorial] Une fois les 9 000 € de sécurité atteints, verseriez-vous le reste sur l’apport ?

### Renaud

Identifiant : `reference-indexo-belgique-2026-11` ; EUR ; période conservée : Référence novembre 2026.

3 000 + 200 × 18 = 6 600 contre objectifs cumulés 7 500 : manque 900. Primes annuelles déjà lissées à 200, jamais ajoutées une deuxième fois pour financer le projet.

Modifications : budgetQuestion.


- Projet : Formation et réserve ; cible 7500 ; départ 3000 ; mensuel 200 ; échéance 18 mois ; total conditionnel 6600, écart au minimum -900.

Récit retenu :

Renaud a 3 000 € de réserve.
Il garde les primes à part pour financer les 200 € d’épargne mensuelle. Il voudrait suivre une formation à 1 500 € dans dix-huit mois, tout en portant sa réserve à 6 000 €. Les deux objectifs demanderaient plus que les seuls 200 € prévus sur cette période : il hésite sur la priorité.

Questions retenues :

- [editorial] Vous privilégieriez la formation ou la réserve de 6 000 € ?
- [editorial] Comment utiliseriez-vous les primes pour tenir les virements toute l’année ?

### Nolwenn

Identifiant : `reference-vendeuse-rennes-2026` ; EUR ; période conservée : Référence 2026.

450 + 50 × 24 = 1 650, objectif minimum 1 500 atteint au vingt-et-unième mois. Dette environ 1 000 contre douze échéances 90 : approximation ne prouve pas un crédit sans intérêts.

Modifications : questions, budgetQuestion, publicProfile.


- Projet : Précaution ; cible 1500 ; départ 450 ; mensuel 50 ; échéance 24 mois ; total conditionnel 1650, écart au minimum 150.

Récit retenu :

Nolwenn a 450 € sur un livret et voudrait atteindre 1 500 € dans deux ans. Elle travaille 32 heures par semaine et garde le virement de 50 € comme point de départ.
Il reste environ 1 000 € sur son crédit, avec douze mensualités de 90 € prévues. Elle hésite à utiliser une partie des 80 € restants pour accélérer le remboursement ou à garder cette marge sur son compte.

Questions retenues :

- [editorial] Vous garderiez les 80 € disponibles ou vous en utiliseriez une partie pour le crédit ?

### Mélina et Loïc

Identifiant : `reference-famille-lyon-2026` ; EUR ; période conservée : Référence 2026.

2 200 + 200 × 24 = 7 000 pour minimum 6 000 de sécurité. Les 500 des enfants, les 150 vacances et les 100 rentrée ne sont pas la précaution. Crédit 150 libéré après dix-huit mois, pas immédiatement.

Modifications : budgetQuestion.


- Projet : Précaution ; cible 6000 ; départ 2200 ; mensuel 200 ; échéance 24 mois ; total conditionnel 7000, écart au minimum 1000.

Récit retenu :

Mélina et Loïc ont 2 200 € pour les imprévus et 500 € à part pour leurs enfants de 7 et 10 ans. Ils voudraient atteindre 6 000 € de sécurité dans deux ans.
Le crédit à la consommation doit encore durer dix-huit mois, en plus du crédit automobile. Ils hésitent à le rembourser plus vite ou à protéger d’abord leur réserve ; les 150 € libérés à la fin ne sont pas comptés comme une marge actuelle.

Questions retenues :

- [editorial] Vous renforceriez d’abord la réserve ou vous rembourseriez le crédit plus vite ?
- [editorial] Comment préserveriez-vous l’enveloppe des enfants si un imprévu arrivait ?
