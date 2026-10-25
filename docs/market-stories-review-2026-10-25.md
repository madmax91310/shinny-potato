# Histoires de marchés — revue éditoriale du 25 octobre 2026

50 récits fixes ajoutés à l’outil existant `/faits-marquants-marches`. La route reste identique. Le titre visible devient « Histoires de marchés ». Aucun nouveau générateur ni paramètre n’est introduit.

## État du dépôt et périmètre

Départ sur master `179c7a1570c64e12df95193a06d601ad8156a67e`, puis rebase sur `54cdf6d2e7e34f365b6f1ebf7c15cf50e5c2a458` pour intégrer les changements concurrents. Aucun PR ouvert au premier examen ni à la revérification ; les PR #951 (ingestion d’artefacts) et #952 (horloge des tests radar) ont été fusionnées pendant le travail et sont conservées par ce rebase.

Lecture de `CLAUDE.md`, des passages pertinents de l’audit du 18 octobre, du code réel du sélecteur et du mécanisme anti-répétition, des 62 contenus existants et des trois pilotes de la banque de tweets. Le code courant, et non l’inventaire daté, détermine le périmètre.

Les 62 anciens contenus sont conservés, sans modification de texte, identifiant, ordre relatif ou contrat de données. Une comparaison profonde avec le module de données de master au départ le vérifie. Le cycle existant porte désormais sur 112 contenus. L’anti-répétition reste celui de la session : cette PR ne prétend pas créer une mémoire permanente ou un nouveau suivi de publication. La banque de tweets et ses données locales ne sont pas modifiées.

Les moteurs partagés, « Le DCA de… », le radar et les automatisations n’ont aucune modification dans le diff de cette PR. Les projections régénérées par les contrôles sont exclues du commit conformément aux consignes du dépôt.

## Intégration et aperçu

Les textes sont enregistrés dans `src/pages/market-facts/stories.json`. `buildTweetText` les renvoie tels quels ; les performances et les champs de l’ancien format ne peuvent pas les reformuler. Les anciens contenus conservent leur construction actuelle.

Le sélecteur et sa recherche sont réutilisés, avec six familles éditoriales. Le premier récit affiché est Cisco. Le bouton « Histoire aléatoire » conserve le cycle existant et inclut les anciens contenus. La colonne de lecture est élargie sur ordinateur dans les seuls styles de cet outil.

Sur mobile, le parcours conserve les vues « Réglages » et « Aperçu ». La fiche affiche le post complet ; « Sources et réserves du récit » ouvre les documents, organismes, dates disponibles, faits vérifiables et limites. Chaque source ouvre un onglet distinct. Le bouton de copie prend uniquement le texte enregistré, paragraphes et mention « Pas un conseil financier » inclus. Les posts restent autonomes et ne sont pas découpés en threads.

Captures de revue :

- [Ordinateur, 1440 px](market-stories-preview/desktop.png)
- [Mobile et sources, 390 px](market-stories-preview/mobile-sources.png)

## Choix et réserves transversales

Wirecard, Apple–Microsoft 1997 et le contrat WTI à prix négatif de 2020 sont déjà les trois pilotes de la banque : aucun doublon ajouté. Le lundi noir de 1987, Newton et la South Sea, ainsi que les récits généraux Internet/2008/Covid, sont déjà présents dans l’outil : ils ne sont pas recomptés comme ajouts. Le nouveau Cisco raconte les stocks et les deux mesures du résultat, pas une variante de la courbe Nasdaq.

Parmalat a été recherché puis écarté de cette sélection : l’angle du compte bancaire inexistant se rapprochait trop de Wirecard. Aucune anecdote non vérifiable n’a été utilisée pour compléter le nombre. Les récits ne prétendent pas reconstituer des pensées, dialogues, scènes ou émotions individuelles.

Les documents sont complémentaires par leur objet et leur date. Lorsqu’ils proviennent de la même procédure ou institution, les réserves le précisent : leur nombre ne constitue pas une prétention à deux enquêtes indépendantes. Satyam est aussi recoupé avec la procédure PCAOB ; Volkswagen avec le rapport BaFin, au-delà de l’annonce de Porsche.

La consultation associe recherche dans les documents, ouverture des pages/PDF et lecture du texte extrait. Sept liens officiels ont refusé le téléchargement direct avec HTTP 403 depuis cet environnement (DOJ Stanford hébergé par DOL, Sénat américain, rapport FDIC 1984, deux documents FMI sur Asie/Russie, UPI 1992 et rapport FMI Amaranth). Leurs passages indexés ont été consultés ; ces refus ne sont pas présentés comme des téléchargements réussis. Le PDF de la Commission européenne sur Chypre a été lu dans le lecteur web, bien qu’un téléchargement shell ait expiré. Les URL Porsche et FMI Amaranth initialement périmées ont été remplacées par les références officielles effectivement retrouvées. Les sources et faits retenus restent détaillés ci-dessous.

Les épisodes judiciaires sont datés. Les récits Credit Suisse AT1, Woodford, FTX et Terra n’annoncent ni issue définitive de tous les recours ni taux final de récupération. Les taux de change, indices de prix, échéances de contrats et montants juridiques sont distingués des rendements réalisés. Le Nikkei n’est pas présenté comme la preuve qu’un épargnant a retrouvé son pouvoir d’achat.

## Relecture et diversité

Chaque texte a été relu pour la tension exacte de l’accroche, l’enchaînement du récit, la fluidité des phrases et l’appui documentaire des assertions. La lecture à voix haute a été évaluée par la formulation, sans prétendre à un test audio enregistré. Les premières lignes n’imposent ni date ni question ; les fins portent sur les conséquences propres à l’événement. Aucun vécu personnel n’est attribué à Épargnant Libre.

Périodes couvertes : de 1716–1720 aux conséquences réglementaires de 2025. Les textes vont de 797 à 1 604 caractères environ, en posts longs autonomes. Les variantes de longueur ne sont pas obtenues par ajout de remplissage.

Répartition : 13 fraudes/fausses promesses, 13 mécanismes/retournements, 12 banques/confiance, 5 devises/dettes, 4 entreprises/décisions et 3 bulles/crises. Les marchés, entreprises, fonds privés, infrastructures et dépôts n’ont pas les mêmes mécanismes de perte ou de restitution.

## Vérifications exécutées

- `npm ci` pour aligner les dépendances avec master courant.
- `npm run build` : précontrôles du dépôt, compilation, budgets de routes et couverture publiée.
- `node scripts/test-market-story-selection.mjs` : sélection historique et séries partagées conservées. Le test Newton compare désormais son contenu profond : le wrapper de contrat de données rendait déjà l’ancienne comparaison d’identité impossible sur master.
- `node scripts/test-market-stories.mjs` : 50 identifiants distincts, familles, format des indices, sources complémentaires, métadonnées, réserves, texte fixe et copie exacte indépendante des anciens champs.
- `node scripts/playwright-tools.mjs --market-facts` : parcours existant des 112 contenus, textes, copie, sources et cycle aléatoire.
- `node scripts/playwright-market-stories.mjs` : Chromium à 1440, 390 et 360 px ; recherche et absence de résultat, passage Réglages/Aperçu sur mobile, 50 lectures visibles et 50 copies complètes par largeur, URL et contenu des preuves, ouverture d’un onglet source, cycle complet des 112 contenus sans répétition, reprise du cycle sans doublon immédiat, absence de débordement horizontal et d’erreur de page.
- `oxlint` ciblé et `git diff --check` sur le diff livré.

Les premiers essais navigateur ont révélé un champ `indices` au mauvais type, corrigé dans les données, et des hypothèses du nouveau test sur le démarrage du serveur et les vues mobiles, corrigées avant les essais réussis. Les tests ne prétendent pas couvrir Safari, Firefox, les droits d’un compte X ou la disponibilité future de tous les serveurs externes.

## Recommandation sur les anciens contenus

Conserver les récits historiques sourcés et les calculs mensuels avec leurs conventions explicites pendant la revue. Les calculs de baisse/récupération peuvent rester utiles comme repères quantitatifs ; ils ne deviennent pas automatiquement des histoires humaines. Pour une étape ultérieure, revoir séparément les statistiques générales dont les dénominateurs sont anciens ou les sources peu directement consultables. Ne pas supprimer en bloc l’outil, ses anciennes fiches ou leurs identifiants ; ne pas migrer automatiquement les courbes vers des récits.

Aucune fusion et aucun déploiement demandés par cette livraison : PR de revue uniquement.

## Cinquante histoires, preuves et limites

### 1. Cisco : Internet ne rachète pas les stocks

`story:cisco-stocks-2001` · 2000–2002 · Cisco

- [Cisco Systems Reports Third Quarter Earnings](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2001/m05/cisco-systems-reports-third-quarter-earnings.html) — Cisco, 2001-05-08 ; consulté le 2026-10-25. Trimestre clos le 28 avril 2001 ; charge de stocks arrondie à 2,2 Md$ ; bénéfice pro forma 230 M$ et perte nette comptable 2,69 Md$. Chute des commandes décrite par la direction entre novembre 2000 et les premiers mois de 2001.
- [Cisco Systems — Annual Report 2002, Product Gross Margin et note 4](https://www.sec.gov/Archives/edgar/data/858877/000089161802004345/f84358exv13.htm) — Cisco / dépôt SEC, 2002 ; consulté le 2026-10-25. Motif de la provision : demande soudainement inférieure aux prévisions ; tableau des stocks détruits, vendus, utilisés et des engagements réglés. La charge comptable initiale est de 2 249 M$, arrondie dans le communiqué ; reprises ultérieures documentées.

Réserves : Deux documents de l’émetteur, complémentaires dans le temps, pas deux confirmations indépendantes. Aucun rendement boursier ni cours par action utilisé. Les bénéfices pro forma excluent plusieurs charges : l’écart ne provient pas uniquement des stocks.

### 2. Enron : le salaire et la retraite dans la même entreprise

`story:enron-retraite-2001` · 2000–2013 · Enron

- [The Enron Bankruptcy and Employer Stock in Retirement Plans — RS21115](https://www.everycrsreport.com/files/20020311_RS21115_393ab0c2b87d7edcff49225eacbde3f8f95b2f88.html) — Congressional Research Service (copie accessible), 2002-03-11 ; consulté le 2026-10-25. Dépôt Chapter 11 le 2 décembre 2001 ; 62 % du plan 401(k) en actions Enron au 31 décembre 2000. Abondement en titres de l’employeur et pertes des comptes de retraite ; les allocations individuelles diffèrent.
- [United States v. Jeffrey K. Skilling](https://www.justice.gov/criminal/criminal-vns/case/united-states-v-jeffrey-k-skilling) — Department of Justice, 2013-06-21 ; consulté le 2026-10-25. Fraude sur la performance publiée ; faillite en décembre 2001 et action pratiquement sans valeur. Nouvelle peine de 168 mois ; confiscation d’environ 42 M$ destinée aux victimes.

Réserves : Le pourcentage de 62 % concerne le plan agrégé à une date précise ; il ne décrit pas chaque salarié. Aucun témoignage individuel ni montant de perte personnelle inventé. Les sommes judiciaires ne valent pas indemnisation intégrale de tous les épargnants.

### 3. WorldCom : les factures transformées en bénéfices

`story:worldcom-facture-2002` · 2001–2003 · WorldCom

- [SEC Charges WorldCom with $3.8 Billion Fraud — LR-17588](https://www.sec.gov/enforcement-litigation/litigation-releases/lr-17588) — SEC, 2002-06-27 ; consulté le 2026-10-25. Action déposée le 26 juin ; transferts de charges en actifs sur 2001 et le premier trimestre 2002. La SEC décrit une entreprise présentée artificiellement comme bénéficiaire.
- [Report of Investigation by the Special Investigative Committee of the Board of Directors of WorldCom](https://www.sec.gov/Archives/edgar/data/723527/000093176303001862/dex991.htm) — Comité spécial de WorldCom / dépôt SEC, 2003-03-31 ; consulté le 2026-10-25. Annonce du 25 juin 2002 : 3,852 Md$ ; dépôts de bilan moins d’un mois après. Section Line Costs : reprises de provisions puis capitalisation ; les montants révélés ensuite couvrent un périmètre plus large.

Réserves : Les 3,85 Md$ correspondent à la première révélation, pas au montant final de toute la fraude. La plainte initiale est distinguée du rapport d’enquête postérieur ; aucune perte uniforme des actionnaires ou créanciers n’est chiffrée.

### 4. Satyam : des clients sur le papier

`story:satyam-factures-2009` · 2008–2011 · Satyam

- [SEC Complaint — Satyam Computer Services Limited](https://www.sec.gov/litigation/complaints/2011/comp21915.pdf) — SEC, 2011-04-05 ; consulté le 2026-10-25. Paragraphes 1–2 : plus de 6 000 fausses factures et plus de 1 Md$ de trésorerie fictive. Paragraphes 8 et 15 : plus de 50 000 employés pendant la fraude ; lettre d’aveux du 7 janvier 2009.
- [SEC Charges Satyam Computer Services with Financial Fraud — LR-21915](https://www.sec.gov/enforcement-litigation/litigation-releases/lr-21915) — SEC, 2011-04-05 ; consulté le 2026-10-25. Remplacement du conseil par le gouvernement indien et appel d’offres pour un nouvel actionnaire. Sanction de 10 M$, consultant indépendant et contrôles ; règlement sans admission ni dénégation des allégations.
- [Order Instituting Disciplinary Proceedings, Making Findings and Imposing Sanctions — PW India, Release 105-2011-002](https://pcaobus.org/Enforcement/Decisions/Documents/PW_India.pdf) — PCAOB, 2011-04-05 ; consulté le 2026-10-25. Procédure distincte sur les audits Satyam de 2005 à 2008 et défaillances de confirmation des soldes bancaires.

Réserves : Plainte et communiqué proviennent de la même procédure : ils sont complémentaires, pas indépendants. Les aveux sont attribués à la lettre décrite dans la plainte. Les actions indiennes et les titres de dépôt américains ne sont pas confondus. Aucun calcul de baisse ou de récupération.

### 5. Madoff : les bénéfices imprimés

`story:madoff-releves-2008` · 2008–2009 · Bernard Madoff

- [SEC Charges Bernard L. Madoff for Multi-Billion Dollar Ponzi Scheme](https://www.sec.gov/news/press/2008/2008-293.htm) — SEC, 2008-12-11 ; consulté le 2026-10-25. Paiements aux anciens investisseurs provenant de fonds apportés par d’autres ; demande de gel et de protection d’urgence. Fonctions professionnelles et Nasdaq ; les 50 Md$ alors cités sont une estimation initiale attribuée à Madoff.
- [Bernard Madoff Sentenced to 150 Years in Prison](https://archives.fbi.gov/archives/newyork/press-releases/2009/nyfo062909.htm) — U.S. Attorney, SDNY / archive FBI, 2009-06-29 ; consulté le 2026-10-25. Plaidoyer de culpabilité le 12 mars 2009 ; peine de 150 ans le 29 juin. Neuf victimes témoignent à l’audience des conséquences pour elles et leur famille.

Réserves : Les soldes fictifs, les apports nets, les pertes reconnues et les sommes récupérées ne sont pas interchangeables : aucun total unique de perte n’est annoncé. Aucun propos des victimes, dialogue privé ou émotion individuelle n’est inventé.

### 6. Stanford : un dépôt qui finance le propriétaire

`story:stanford-depots-2009` · 2009–2012 · Stanford International Bank

- [Investigation of the SEC’s Response to Concerns Regarding Robert Allen Stanford’s Alleged Ponzi Scheme — OIG-526](https://www.sec.gov/files/news/studies/2010/oig-526.pdf) — SEC Office of Inspector General, 2010 ; consulté le 2026-10-25. Action du 17 février 2009, gel d’actifs, administrateur ; plainte amendée du 27 février alléguant un système de Ponzi.
- [Allen Stanford Sentenced to 110 Years in Prison for Orchestrating $7 Billion Investment Fraud Scheme](https://www.dol.gov/sites/dolgov/files/ebsa/pdf_files/06-14-2012.pdf) — Department of Justice (copie DOL), 2012-06-14 ; consulté le 2026-10-25. Banque à Antigua ; certificats à rendement supérieur aux banques américaines et présentation de placements conservateurs et liquides. Peine de 110 ans ; 7 Md$ détournés sur vingt ans ; restitution jugée impraticable à ce stade.

Réserves : Les 7 Md$ du jugement pénal ne sont pas confondus avec les 8 Md$ de programme de dépôts visés au début de l’affaire. Ni taux garanti chiffré ni garantie publique de dépôts n’est inventé ; pas de comparaison avec un produit bancaire français actuel.

### 7. Theranos : investir dans une goutte de sang

`story:theranos-goutte-2018` · 2014–2022 · Theranos

- [Theranos, CEO Holmes, and Former President Balwani Charged With Massive Fraud](https://www.sec.gov/newsroom/press-releases/2018-41) — SEC, 2018-03-14 ; consulté le 2026-10-25. Entreprise privée ; plus de 700 M$ levés ; capacités limitées de l’analyseur et utilisation d’appareils tiers. Prévision de plus de 100 M$ pour 2014 contre un peu plus de 100 000 $ de revenus opérationnels.
- [Elizabeth Holmes Sentenced To More Than 11 Years For Defrauding Theranos Investors Of Hundreds Of Millions](https://www.justice.gov/usao-ndca/pr/elizabeth-holmes-sentenced-more-11-years-defrauding-theranos-investors-hundreds) — Department of Justice, 2022-11-18 ; consulté le 2026-10-25. Peine de 135 mois ; condamnation pour fraude envers des investisseurs. Acquittements sur les chefs concernant certains patients ; le récit ne leur attribue pas une condamnation inexistante.

Réserves : Le récit distingue les allégations civiles de 2018 et le verdict pénal de 2022. Les 700 M$ levés ne sont pas un calcul uniforme de perte nette. Theranos n’était pas cotée. Aucun résultat médical personnel, témoignage ou cours de Bourse n’est inventé.

### 8. Luckin : inventer les ventes, puis les dépenses

`story:luckin-ventes-2020` · 2019–2020 · Luckin Coffee

- [Luckin Announces the Substantial Completion of the Internal Investigation](https://investor.luckincoffee.com/news-releases/news-release-details/luckin-announces-substantial-completion-internal-investigation) — Luckin Coffee, comité spécial, 2020-07-01 ; consulté le 2026-10-25. Fabrications à partir d’avril 2019 ; révélation initiale du 2 avril 2020 ; revenus 2019 gonflés de 2,12 Md RMB et dépenses de 1,34 Md RMB. Opérations via des tiers liés ; licenciements de dirigeants et de salariés documentés.
- [Luckin Coffee Agrees to Pay $180 Million Penalty to Settle Accounting Fraud Charges](https://www.sec.gov/newsroom/press-releases/2020-319) — SEC, 2020-12-16 ; consulté le 2026-10-25. Transactions fictives, dépenses gonflées, fausse base opérationnelle et documents modifiés. Titres de dépôt au Nasdaq ; accord civil de 180 M$ sans admission ni dénégation, alors soumis au tribunal.

Réserves : Le chiffre en yuans concerne l’enquête interne sur 2019 ; le périmètre de la SEC s’étend jusqu’à janvier 2020. Pas de conversion implicite entre ces montants. La pénalité n’est ni le total des ventes fabriquées ni une indemnisation intégrale des investisseurs.

### 9. Ahold : les remises qui fabriquent le bénéfice

`story:ahold-remises-2003` · 2000–2011 · Royal Ahold / U.S. Foodservice

- [SEC Charges Former Top Executives of U.S. Foodservice with $700 Million Securities Fraud; One Executive Also Charged with Insider Trading](https://www.sec.gov/newsroom/press-releases/2004-100-sec-charges-former-top-executives-us-foodservice-700-million-securities-fraud-one-executive-also) — SEC, 2004 ; consulté le 2026-10-25. Remises fournisseurs fictives pour atteindre les budgets ; fausses lettres de confirmation et dissimulation des créances. Distinction entre achats réels et revenus de remises indûment enregistrés.
- [Former Executive of Ahold Subsidiary Sentenced in Manhattan Federal Court to 46 Months in Prison](https://www.justice.gov/archive/usao/nys/pressreleases/December11/kaisermarkp2ndsentencingpr.pdf) — Department of Justice, 2011-12-07 ; consulté le 2026-10-25. Fraude de 2000 à début 2003 ; conséquence boursière évaluée à 6 Md$ par le parquet. Premier verdict renvoyé pour nouveau procès ; plaidoyer de culpabilité du 15 août 2011 ; peine de 46 mois.

Réserves : Le récit porte sur les remises de U.S. Foodservice, pas sur la totalité des irrégularités de consolidation d’Ahold. Les 6 Md$ cités par le parquet mesurent une perte de valeur boursière liée à la révélation ; ils ne mesurent ni les faux revenus ni les pertes nettes après remboursements de chaque porteur.

### 10. Northern Rock : la banque dépendait de demain

`story:northern-rock-2007` · 2007–2008 · Royaume-Uni · dépôts bancaires

- [UK government interventions in the financial sector 2007 to 2016](https://www.ons.gov.uk/methodology/methodologicalpublications/specificmethodology/economy/articles/ukgovernmentinterventionsinthefinancialsector2007to2016) — Office for National Statistics, date non précisée ; consulté le 2026-10-25. Financement de marché bloqué, prêt d’urgence, retraits et garantie en septembre 2007. Nationalisation de Northern Rock en février 2008.
- [Northern Rock plc Deposits](https://www.bankofengland.co.uk/-/media/boe/files/news/2007/october/northern-rock-plc-deposits.pdf) — HM Treasury / Bank of England / FSA, 2007-10-09 ; consulté le 2026-10-25. Extension de la garantie aux nouveaux dépôts de particuliers et à leurs intérêts.

Réserves : Le récit distingue la garantie des dépôts du sauvetage des actionnaires. Aucun vécu individuel ni montant de retrait n’est reconstitué.

### 11. Lehman : même nom, droits différents

`story:lehman-clients-2008` · 2008–2014 · États-Unis · faillite et comptes-titres

- [Statement Regarding Recent Market Events — Lehman Brothers (updated)](https://www.sec.gov/newsroom/press-releases/2008-198-statement-regarding-recent-market-events-lehman-brothers-updated) — SEC, 2008-09-15 ; consulté le 2026-10-25. Chapitre 11 de la holding distinct du courtier américain à cette date. Règles de séparation des actifs de clientèle et protection SIPC.
- [SIPC Applauds Lehman Trustee… Following 100 Percent Satisfaction of Customer Claims](https://www.sipc.org/news-and-media/news-releases/20140815) — SIPC, 2014-08-15 ; consulté le 2026-10-25. Liquidation du courtier LBI et satisfaction intégrale des créances clients admises. Distribution distincte aux créanciers ordinaires.

Réserves : La récupération évoquée concerne exclusivement les créances de clients admises de Lehman Brothers Inc. aux États-Unis, pas les actionnaires, tous les obligataires ni les autres entités du groupe. Le communiqué SEC du 15 septembre décrit la situation initiale, pas l’issue ultérieure du courtier.

### 12. Le dollar qui valait 97 cents

`story:reserve-primary-2008` · 2008–2010 · États-Unis · fonds monétaire

- [Reserve Primary Fund Distributes Assets to Investors](https://www.sec.gov/newsroom/press-releases/2010-16-reserve-primary-fund-distributes-assets-investors) — SEC, 2010-01-29 ; consulté le 2026-10-25. 785 millions de dollars de dette Lehman ; incapacité à honorer les retraits en septembre 2008. Distribution de janvier 2010 portant les récupérations au-delà de 98 cents par dollar.
- [SEC v. Reserve Management Company — Memorandum Opinion, document 201](https://docs.justia.com/cases/federal/district-courts/new-york/nysdce/1:2009cv04346/345292/201) — U.S. District Court, Southern District of New York, copie Justia, date non précisée ; consulté le 2026-10-25. Valorisation à zéro des titres Lehman et valeur liquidative de 0,97 dollar le 16 septembre 2008. Suspension et calendrier des demandes de remboursement.

Réserves : La valeur de part de septembre 2008 et les restitutions cumulées de janvier 2010 sont deux mesures différentes. Le récit ne prétend pas décrire le taux final de récupération. Un fonds monétaire n’est pas un dépôt bancaire garanti.

### 13. Washington Mutual : le compte reste, l’action tombe

`story:washington-mutual-2008` · 2008 · États-Unis · banque et holding

- [JPMorgan Chase Acquires Banking Operations of Washington Mutual](https://archive.fdic.gov/view/fdic/3396/fdic_3396_DS1.pdf) — FDIC, 2008-09-25 ; consulté le 2026-10-25. Reprise pour 1,9 milliard de dollars et protection de tous les dépôts. Continuité du service ; certaines dettes et les intérêts des actionnaires exclus de la reprise.
- [Information for Claimants in Washington Mutual Bank](https://archive.fdic.gov/view/fdic/3396/fdic_3396_DS8.pdf) — FDIC, 2008-09-29 ; consulté le 2026-10-25. Distinction banque/holding cotée. Faillite de Washington Mutual Inc. le 26 septembre 2008.

Réserves : Deux documents complémentaires du même organisme : annonce opérationnelle et précisions juridiques ultérieures. Aucune récupération finale n’est affirmée pour les différentes classes de créanciers.

### 14. SVB : 42 milliards réclamés en une journée

`story:svb-retraits-2023` · 2023 · États-Unis · dépôts et taux

- [Material Loss Review of Silicon Valley Bank](https://fraser.stlouisfed.org/title/selected-reports-investigations-office-inspector-general-7181/material-loss-review-silicon-valley-bank-678492/content/fulltext/frsoig_20230925_mlr-siliconvalleybank) — Federal Reserve, Office of Inspector General, copie FRASER, 2023-09-25 ; consulté le 2026-10-25. Titres longs, pertes latentes et concentration des dépôts non assurés supérieure à 94 %. Vente avec perte de 1,8 milliard ; demandes de retrait d’environ 42 milliards le 9 mars ; fermeture le 10.
- [Joint Statement by Treasury, Federal Reserve, and FDIC](https://home.treasury.gov/news/press-releases/jy1337) — U.S. Treasury / Federal Reserve / FDIC, 2023-03-12 ; consulté le 2026-10-25. Protection de tous les déposants et accès aux fonds le lundi. Absence de protection des actionnaires et de certains créanciers non garantis.

Réserves : 42 milliards désigne l’ordre de grandeur des retraits demandés pendant la journée, pas le solde restant ni les pertes finales. Les pertes de marché sur obligations ne constituent pas à elles seules un défaut de leurs émetteurs.

### 15. Chypre : une partie du dépôt devient du capital

`story:chypre-depots-2013` · 2013 · Chypre · dépôts et résolution bancaire

- [CBC Announcement on the Eurogroup decision](https://www.centralbank.cy/en/announcements/25032013-3) — Central Bank of Cyprus, 2013-03-26 ; consulté le 2026-10-25. Plan final du 25 mars ; protection des dépôts jusqu’à 100 000 euros. Transfert de la partie saine de Laiki et recapitalisation de Bank of Cyprus.
- [The Economic Adjustment Programme for Cyprus — First Review, Summer 2013, Occasional Paper 161](https://ec.europa.eu/economy_finance/publications/occasional_paper/2013/pdf/ocp161_en.pdf) — Commission européenne, 2013-09 ; consulté le 2026-10-25. Programme et restructuration bancaire ; participation des dépôts non assurés et conversion en capital.

Réserves : Le récit porte sur les deux banques concernées et sur le plan final, pas sur tous les comptes de Chypre. Aucun taux de conversion provisoire n’est présenté comme le taux définitif. La protection s’apprécie par déposant selon les règles applicables.

### 16. Une banque vendue un euro, des comptes préservés

`story:banco-popular-2017` · 2017 · Espagne · résolution bancaire

- [The SRB adopts resolution decision for Banco Popular](https://www.srb.europa.eu/en/node/315) — Single Resolution Board, 2017-06-07 ; consulté le 2026-10-25. Constat BCE du 6 juin ; résolution le 7 juin ; vente à Santander pour un euro. Protection de tous les dépôts et absence de recours à des fonds publics dans cette opération.
- [ECB Annual Report on supervisory activities 2017](https://www.bankingsupervision.europa.eu/press/other-publications/annual-report/html/ssm.ar2017.en.html) — Banque centrale européenne, 2018 ; consulté le 2026-10-25. Annulation des actions, traitement des AT1 et conversion des Tier 2 avant transfert.

Réserves : Tous les titres de dette n’ont pas subi le même traitement. Le récit décrit la résolution de juin 2017, sans conclure sur les recours judiciaires ultérieurs ni sur chaque situation fiscale individuelle.

### 17. Credit Suisse : une obligation peut absorber le choc

`story:credit-suisse-at1-2023` · Mars 2023 · Suisse · instruments AT1

- [FINMA provides information about the basis for writing down AT1 capital instruments](https://www.finma.ch/en/news/2023/03/20230323-mm-at1-kapitalinstrumente/) — FINMA, 2023-03-23 ; consulté le 2026-10-25. Effacement nominal des AT1 ordonné en mars ; fondements contractuels et ordonnance invoqués par FINMA. Les titres Tier 2 ne sont pas effacés ; instruments destinés principalement aux investisseurs institutionnels.
- [SRB, EBA and ECB Banking Supervision statement on the announcement on 19 March 2023](https://www.eba.europa.eu/publications-and-media/press-releases/srb-eba-and-ecb-banking-supervision-statement-announcement-19) — SRB / EBA / supervision bancaire BCE, 2023-03-20 ; consulté le 2026-10-25. Ordre d’absorption des pertes rappelé dans le cadre de l’Union européenne.

Réserves : Récit volontairement borné aux décisions et positions publiées en mars 2023. Il expose le raisonnement de FINMA sans le présenter comme une décision judiciaire définitive ; les recours et leurs suites ne sont pas couverts. Aucune récupération finale n’est affirmée.

### 18. Le record japonais a attendu une génération

`story:nikkei-record-2024` · 1989–2024 · Japon · Nikkei 225

- [2024年2月の日経平均株価 — Nikkei Index Monthly Report, February 2024](https://indexes.nikkei.co.jp/atoz/2024/03/202402.html) — Nikkei Indexes, 2024-03-05 ; consulté le 2026-10-25. Clôture du 22 février 2024 à 39 098,68, ancien record de clôture du 29 décembre 1989 à 38 915,87.
- [Nikkei parties like it’s 1989; scales record high](https://uk.investing.com/news/economy/nikkei-parties-like-its-1989-scales-record-high-3347261) — Reuters, republication Investing.com, 2024-02-22 ; consulté le 2026-10-25. Chronologie des deux records et distinction entre clôture et record en séance ; contexte de la bulle japonaise.

Réserves : Comparaison de clôtures de l’indice de prix en yens nominaux, sans dividendes, inflation, frais, fiscalité ou change. Aucun délai de récupération individuel n’est déduit de l’indice.

### 19. Le plancher du franc était une décision

`story:franc-suisse-plancher-2015` · 2014–2015 · Suisse · euro/franc

- [Chronicle of monetary events](https://www.snb.ch/en/the-snb/organisation/history/geld-und-waehrungspolitische-chronik) — Banque nationale suisse, date non précisée ; consulté le 2026-10-25. Introduction du plancher en septembre 2011 ; réaffirmation en décembre 2014 ; abandon le 15 janvier 2015. Convention de change : 1,20 CHF pour 1 EUR.
- [SNB monetary policy after the discontinuation of the minimum exchange rate](https://www.snb.ch/en/publications/communication/speeches/2015/ref_20150424_tjn) — Thomas Jordan, Banque nationale suisse, 2015-04-24 ; consulté le 2026-10-25. Explications de la BNS sur les interventions et divergences de politiques monétaires.

Réserves : L’exemple de facturation illustre une relation arithmétique, pas le vécu attribué à une entreprise réelle. Aucun pourcentage intrajournalier ni rendement de stratégie à levier n’est avancé.

### 20. Les retraites britanniques ont manqué de liquidités

`story:ldi-obligations-2022` · 2022–2023 · Royaume-Uni · obligations et fonds de pension

- [Financial stability buy/sell tools: a gilt market case study](https://www.bankofengland.co.uk/quarterly-bulletin/2023/2023/financial-stability-buy-sell-tools-a-gilt-market-case-study?sf183860239=1) — Bank of England, 2023 ; consulté le 2026-10-25. Boucle appels de marge/ventes d’obligations dans les stratégies LDI. Intervention du 28 septembre au 14 octobre, achats effectifs de 19,3 milliards de livres et revente ultérieure.
- [Letter from the Governor of the Bank of England to the Chancellor](https://www.gov.uk/government/publications/letter-from-the-chancellor-of-the-exchequer-to-the-governor-of-the-bank-of-england-16012023/letter-from-the-governor-of-the-bank-of-england-to-the-chancellor-of-the-exchequer-16012023) — Bank of England / HM Treasury, 2023-01-16 ; consulté le 2026-10-25. Confirmation des montants achetés et de la clôture des ventes en janvier 2023.

Réserves : Le mécanisme concerne certaines stratégies de régimes à prestations définies, pas tous les placements retraite. Risque de liquidité, valeur des engagements et perte définitive de pension sont des notions différentes. Les deux sources proviennent de la même institution à des fins complémentaires.

### 21. Le géant auquel la Banque d’Angleterre dit non

`story:overend-gurney-1866` · 1866 · Londres · crédit

- [The demise of Overend Gurney](https://www.bankofengland.co.uk/-/media/boe/files/quarterly-bulletin/2016/the-demise-of-overend-gurney.pdf) — Bank of England Quarterly Bulletin, 2016 ; consulté le 2026-10-25. Mauvais prêts, demande du 9 mai refusée pour insolvabilité, suspension le 10 mai. Prêts de marché exceptionnels de la Banque d’Angleterre ; documents contemporains reproduits en annexe.
- [Our history — 1866 financial crisis](https://www.bankofengland.co.uk/about/history) — Bank of England, date non précisée ; consulté le 2026-10-25. Chronologie du refus de soutien à Overend Gurney et de la crise de mai 1866.

Réserves : Les deux sources viennent de la Banque d’Angleterre ; l’étude reproduit également des pièces contemporaines. Aucun montant moderne ni garantie générale des dépôts n’est attribué à cette intervention.

### 22. Knickerbocker : le secours arrive trop tard

`story:knickerbocker-1907` · 1907–1913 · New York · panique bancaire

- [The Panic of 1907](https://www.federalreservehistory.org/essays/panic-of-1907) — Federal Reserve History, date non précisée ; consulté le 2026-10-25. Refus de la Clearing House aux non-membres, examen demandé par Morgan et absence de conclusion rapide sur la solvabilité. Retraits de près de 8 millions de dollars et suspension le 22 octobre ; contagion.
- [The Senate Passes the Federal Reserve Act](https://www.senate.gov/artandhistory/history/minute/Senate_Passes_the_Federal_Reserve_Act.htm) — U.S. Senate, date non précisée ; consulté le 2026-10-25. Panique de 1907, dépendance aux banquiers privés et loi du 23 décembre 1913.

Réserves : L’incertitude de l’examen est conservée : le refus de Morgan n’est pas présenté comme une preuve rétrospective de fraude ou d’insolvabilité. La création de la Fed résulte d’un débat de plusieurs années, pas d’un événement unique.

### 23. Quand un chemin de fer bloque le crédit

`story:penn-central-1970` · 1970 · États-Unis · financement des entreprises

- [Penn Central Commercial Paper Crisis, 1970](https://www.federalreservehistory.org/essays/penn-central) — Federal Reserve History, 2026-09-24 ; consulté le 2026-10-25. Définition des billets de trésorerie, souvent à trente jours ou moins et non garantis. Faillite ferroviaire de juin 1970, tensions de financement et réponse de la Fed.
- [Discount Window Accommodation of Issuers of Commercial Paper](https://www.federalreserve.gov/foia/files/histdoc19700710.pdf) — Federal Reserve Bank of New York, 1970-07-10 ; consulté le 2026-10-25. Réunion du 22 juin après la faillite du 21 juin ; encouragement du recours bancaire au guichet pour financer les émetteurs privés.

Réserves : Le prêt de trente jours en ouverture décrit le mécanisme général, pas un emprunt précis attribué à Penn Central. L’assistance aux banques n’est pas présentée comme le remboursement des titres Penn Central.

### 24. Une panique sans file devant le guichet

`story:continental-illinois-1984` · 1984 · États-Unis · dépôts professionnels

- [Continental Illinois: A Bank That Was Too Big to Fail](https://www.federalreservehistory.org/essays/continental-illinois) — Federal Reserve History, 2023-05-15 ; consulté le 2026-10-25. Expansion dans les prêts énergie, exposition à Penn Square, financements de marché et fuite d’environ 30 % en dix jours.
- [Annual Report 1984](https://www.fdic.gov/system/files/2024-07/fdic-ar-1984.pdf) — FDIC, 1984 ; consulté le 2026-10-25. Motifs de l’assistance et recapitalisation. Près de 2 300 petites banques avaient environ 6 milliards de dollars exposés à Continental.

Réserves : Les proportions de financement ne sont pas assimilées à des pertes définitives. Les chiffres du rapport FDIC décrivent les expositions avant l’assistance, pas les pertes finalement supportées par les petites banques.

### 25. La garantie en dollars qui fragilise le Mexique

`story:mexique-tesobonos-1994` · 1994–1995 · Mexique · dette et peso

- [International Financial Crises — Efforts to Anticipate, Avoid, and Resolve Sovereign Crises](https://www.gao.gov/assets/ggd/nsiad-97-168.pdf) — U.S. General Accounting Office, 1997 ; consulté le 2026-10-25. Tesobonos courts liés au dollar ; réserves de 12,5 milliards début décembre contre près de 30 milliards d’échéances en 1995. Dévaluation du 20 décembre et effondrement de la confiance.
- [Drawing Lessons from the Mexican Crisis: Preventing and Resolving Financial Crises](https://www.imf.org/en/news/articles/2015/09/28/04/53/spmds9508) — Michel Camdessus, FMI, 1995-05-22 ; consulté le 2026-10-25. Vulnérabilités, remplacement de dette en pesos par des titres indexés sur le dollar et réponse internationale.

Réserves : Les tesobonos sont indexés sur le dollar ; cela ne signifie pas que tous les paiements se faisaient matériellement en dollars. La crise ne se réduit pas à cette seule cause. Le récit ne prétend pas que le Mexique a fait défaut sur toute sa dette en décembre 1994.

### 26. La dette grossit sans nouvel emprunt

`story:asie-dette-dollar-1997` · 1997–1998 · Thaïlande · crise asiatique

- [Asian Financial Crisis](https://www.federalreservehistory.org/essays/asian-financial-crisis) — Michael Carson et John Clark, Federal Reserve History, date non précisée ; consulté le 2026-10-25. Basculement thaïlandais du 2 juillet 1997, réserves entamées, dettes étrangères non couvertes et propagation régionale.
- [Financial Sector Crisis and Restructuring: Lessons from Asia — Occasional Paper 188, Appendix V: Thailand](https://www.imf.org/external/pubs/ft/op/opfinsec/op188.pdf) — FMI, date non précisée ; consulté le 2026-10-25. Flottement du baht le 2 juillet 1997 et vulnérabilités du financement extérieur à court terme.

Réserves : Le raisonnement sur la dette en devise est une relation de change, pas un témoignage individuel. Les pays asiatiques avaient des situations différentes. Le PDF FMI a été consulté via son texte indexé ; son serveur peut refuser le téléchargement direct.

### 27. La dette en roubles qui ne rembourse plus

`story:russie-dette-1998` · 1998 · Russie · dette souveraine

- [International Contagion Effects from the Russian Crisis and the LTCM Near-Collapse — WP/02/74](https://www.elibrary.imf.org/view/journals/001/2002/074/article-A001-en.xml) — FMI, 2002 ; consulté le 2026-10-25. Mesures du 17 août 1998 : change, restructuration de dette domestique et moratoire sur dettes privées ; contagion et LTCM.
- [Statement by Treasury Secretary Robert E. Rubin](https://home.treasury.gov/news/press-releases/rr2643) — U.S. Treasury, 1998-08-17 ; consulté le 2026-10-25. Réaction contemporaine aux mesures extraordinaires russes et appels à rétablir la confiance et à coopérer avec les créanciers.

Réserves : Le champ des mesures du 17 août est volontairement précisé ; les défauts et restructurations ultérieurs ne sont pas confondus avec cette annonce. Le document FMI a été consulté via son texte indexé ; téléchargement direct parfois refusé.

### 28. LTCM : les banques sauvent leur contrepartie

`story:ltcm-sauvetage-1998` · 1998 · États-Unis · fonds à levier

- [Near Failure of Long-Term Capital Management](https://www.federalreservehistory.org/essays/ltcm-near-failure) — Michael Fleming et Weiling Liu, Federal Reserve History, date non précisée ; consulté le 2026-10-25. Stratégie d’écarts relatifs, levier, prix Nobel, crise et refinancement du 23 septembre. Quatorze institutions, 3,6 milliards de dollars ; pas de fonds de la Fed engagés.
- [Testimony concerning the near collapse of Long-Term Capital Management](https://www.cftc.gov/sites/default/files/opa/speeches/opaborn-41.htm) — Brooksley Born, CFTC, 1998-12-16 ; consulté le 2026-10-25. Recapitalisation privée en échange de 90 % et rôle de facilitation de la Fed de New York.

Réserves : Le fonds n’était pas une promesse de rendement sans risque. Les 3,6 milliards sont la recapitalisation privée, pas une perte unique ni un prêt de la Fed. La crise russe contribue aux tensions sans constituer une explication exhaustive.

### 29. John Law : acheter la Louisiane sur papier

`story:law-louisiane-1720` · 1716–1720 · France · Compagnie des Indes

- [John Law](https://heritage.bnf.fr/france-ameriques/john-law) — Arnaud Orain, BnF — Patrimoines partagés, 2021-05 ; consulté le 2026-10-25. Banque en 1716, Compagnie en 1717, conversion de dette, monopoles, propagande et gravure fictive de Jollain. Crise de 1720, départ en décembre et poursuite des activités commerciales ; rôle de la traite négrière.
- [John Law and the Mississippi Bubble: 1718–1720](https://www.mshistorynow.mdah.ms.gov/issue/john-law-and-the-mississippi-bubble-1718-1720) — Mississippi Department of Archives and History, 2001-10 ; consulté le 2026-10-25. Financement par actions et billets, demandes de conversion en espèces et effondrement du système.

Réserves : Les documents de promotion sont décrits comme des représentations, pas comme des scènes observées en Louisiane. Les mécanismes et la chronologie sont synthétisés ; aucun cours précis ni taux de perte individuel n’est avancé.

### 30. Wall Street suspend les échanges

`story:nyse-fermeture-1914` · 1914 · États-Unis · fermeture de marché

- [The New York Stock Exchange in the Crisis of 1914](https://www.gutenberg.org/files/29443/29443-h/29443-h.htm) — H. G. S. Noble, président du NYSE ; édition 1915, transcription Project Gutenberg, 1915 ; consulté le 2026-10-25. Fermeture du 31 juillet ; comité de cinq ; obligations le 28 novembre, liste limitée d’actions le 12 décembre, ensemble des actions le 15 décembre. Témoignage du responsable de la place sur le risque de marché officieux.
- [Birth of the Federal Reserve: Crisis in the Womb](https://web-docs.stern.nyu.edu/salomon/docs/financialinstitutions/S-FI-03-10.pdf) — William L. Silber, NYU Stern, 2003 ; consulté le 2026-10-25. Fermeture du 31 juillet jusqu’au début de réouverture des actions le 12 décembre et préoccupations concernant les sorties d’or.

Réserves : Le récit distingue la fermeture du marché officiel de l’absence de toute transaction. L’interprétation des motivations est celle de l’étude historique ; aucun chiffre de baisse quotidienne du Dow n’est repris, car les séries et changements de composition rendent ce raccourci trompeur. La source primaire distingue la reprise partielle du 12 décembre de la reprise de l’ensemble des actions le 15 décembre, distinction simplifiée dans certaines études rétrospectives.

### 31. Les frères Hunt manquent de cash, pas d’argent

`story:hunt-argent-1980` · 1979–1980 · États-Unis · argent métal et contrats à terme

- [Integrity, Fairness and Resolve — Federal Reserve Bank of Kansas City history](https://www.kansascityfed.org/documents/6510/integrityfairnessandresolve.pdf) — Federal Reserve Bank of Kansas City, 2011 ; consulté le 2026-10-25. Accumulation des Hunt, hausse vers 50 dollars, crise du 27 mars et besoins de financement.
- [Position Limits for Derivatives — discussion of the 1979–1980 silver episode](https://public-inspection.federalregister.gov/2013-27200.pdf) — CFTC, 2013 ; consulté le 2026-10-25. Limites de positions, exigences de marge et transactions limitées à la liquidation ; référence à l’étude interagences de 1981.

Réserves : Cours du métal et contrats à terme sont distingués. Les mesures réglementaires et le financement sont des facteurs documentés, pas une causalité unique. Aucune proportion spectaculaire des stocks mondiaux ni perte patrimoniale finale des frères n’est retenue.

### 32. Une journée pour défendre la livre

`story:livre-sterling-1992` · 1992 · Royaume-Uni · mécanisme de change européen

- [Britain suspends its membership in European currency mechanism](https://www.upi.com/Archives/1992/09/16/Britain-suspends-its-membership-in-European-currency-mechanism/9046716616000/) — UPI, 1992-09-16 ; consulté le 2026-10-25. Dépêche contemporaine : pressions sur la livre, interventions, annonces de taux et suspension le soir même.
- [The Role of the Exchange Rate in Monetary Policy — the Experience of Other Countries](https://www.rba.gov.au/publications/confs/1993/artis.html) — Reserve Bank of Australia, conference paper, 1993 ; consulté le 2026-10-25. Cadre du mécanisme européen et flottement de la livre le 16 septembre 1992.

Réserves : Le récit distingue annonces de taux et taux effectivement appliqués : aucun taux annoncé puis retiré n’est présenté comme un taux durablement payé par tous les emprunteurs. Il n’attribue pas la sortie à un spéculateur unique.

### 33. Barings : le compte 88888

`story:barings-compte-1995` · 1992–1995 · Royaume-Uni / Singapour · contrôle des opérations

- [Financial Stability Review, Autumn 1997 — Barings case study](https://www.bankofengland.co.uk/-/media/boe/files/financial-stability-report/1997/autumn-1997.pdf) — Bank of England, 1997 ; consulté le 2026-10-25. Compte 88888, cumul des fonctions, audit d’août 1994 non suivi et informations sur marges non examinées.
- [Report of the Board of Banking Supervision inquiry into the circumstances of the collapse of Barings, HC 673](https://assets.publishing.service.gov.uk/media/5a7ca783ed915d6969f46688/0673.pdf) — Board of Banking Supervision, 1995-07-18 ; consulté le 2026-10-25. Pertes de 827 millions de livres au 27 février ; tableau 4.5 distingue 927 millions après liquidation et effets de change.

Réserves : 827 millions est le montant à une date donnée, pas le coût final de liquidation. L’épisode n’est pas attribué au seul séisme de Kobe. Les deux publications institutionnelles ont une base d’enquête commune.

### 34. BCCI : fermer pour protéger les déposants

`story:bcci-fermeture-1991` · 1991–1992 · Banque internationale · dépôts

- [Banking Act Report 1991–92](https://www.bankofengland.co.uk/-/media/boe/files/archive/banking-act-report/1991-1992.pdf) — Bank of England, 1992 ; consulté le 2026-10-25. Rapport Price Waterhouse, opération coordonnée du 5 juillet et nomination de liquidateurs provisoires.
- [Banking Act Report 1992–93 — Lessons from BCCI](https://www.bankofengland.co.uk/-/media/boe/files/archive/banking-act-report/1992-1993.pdf) — Bank of England, 1993 ; consulté le 2026-10-25. Fraudes et fausse comptabilité, structure opaque, critiques Bingham et durée attendue des procédures.

Réserves : Sources contemporaines complémentaires du même superviseur. Le récit ne donne pas de taux de récupération final ni une garantie identique pour tous les déposants. Il ne suppose pas que tous les superviseurs possédaient les mêmes informations au même moment.

### 35. Volkswagen : le pari baissier se referme

`story:volkswagen-options-2008` · 2008 · Allemagne · actions ordinaires Volkswagen

- [Porsche heads for domination agreement — Interest in Volkswagen increased to 42.6 percent](https://www.porsche-se.com/en/media/press-releases/detail/porsche-heads-for-domination-agreement-1) — Porsche SE, 2008-10-26 ; consulté le 2026-10-25. 42,6 % d’actions ordinaires et options cash-settled sur 31,5 % ; fonctionnement du règlement en espèces. Porsche décrit les positions à découvert et le motif de publication.
- [Annual Report 2008 — VI, Reporting duties for financial instruments settled purely in cash](https://www.bafin.de/SharedDocs/Downloads/EN/Jahresbericht/dl_jb_2008_en.pdf?__blob=publicationFile&v=2) — BaFin, 2009 ; consulté le 2026-10-25. Turbulences sur les actions ordinaires Volkswagen en octobre 2008. Les options réglées en espèces ne donnent pas droit à livraison des actions ; les couvertures physiques de leurs vendeurs peuvent réduire la liquidité des titres sous-jacents.

Réserves : Annonce primaire de Porsche complétée par l’analyse du régulateur BaFin. Le motif de publication reste attribué à Porsche. Le récit ne calcule pas un flottant supposé à partir des seules options. Actions ordinaires et préférentielles ne sont pas confondues ; aucune intention illégale n’est imputée.

### 36. GameStop : pouvoir acheter devient un enjeu

`story:gamestop-collateral-2021` · 2021 · États-Unis · actions et règlement-livraison

- [Staff Report on Equity and Options Market Structure Conditions in Early 2021](https://www.sec.gov/files/staff-report-equity-options-market-struction-conditions-early-2021.pdf) — SEC staff, 2021-10-18 ; consulté le 2026-10-25. Rôle des réseaux, des achats et des ventes à découvert ; rachats des vendeurs identifiés minoritaires dans les volumes. Restrictions de courtage et infrastructures de règlement.
- [GameStop-Related Market Volatility: What Does It Reveal About Market Structure and Regulation?](https://www.congress.gov/crs_external_products/IN/PDF/IN11615/IN11615.1.pdf) — Congressional Research Service, 2021 ; consulté le 2026-10-25. Règlement à deux jours, appels de garanties et restrictions de janvier 2021.

Réserves : Le récit reprend l’analyse du personnel de la SEC, pas une conclusion universelle sur toutes les transactions. Il n’assimile pas un intérêt vendeur supérieur à 100 % à une preuve de ventes nues. Le délai T+2 décrit janvier 2021 et non le régime américain actuel. Aucun cours non ajusté de division n’est comparé à un cours actuel.

### 37. Knight : 212 ordres, 460 millions de pertes

`story:knight-code-2012` · 2012–2013 · États-Unis · courtage automatisé

- [Order in the Matter of Knight Capital Americas LLC — Release 34-70694](https://www.sec.gov/Archives/edgar/data/1569391/000119312513401173/d613486dex101.htm) — SEC, 2013-10-16 ; consulté le 2026-10-25. 212 ordres, serveur sur huit, 45 minutes, plus de 397 millions d’actions et plus de 460 millions de pertes. Défaillances de déploiement, contrôles et 97 courriels automatiques.
- [Form 8-K — Securities Purchase Agreement](https://www.sec.gov/Archives/edgar/data/1060749/000119312512338098/d392396d8k.htm) — Knight Capital Group, 2012-08-06 ; consulté le 2026-10-25. Levée de 400 millions de dollars via actions préférentielles convertibles le 6 août.

Réserves : Les 460 millions désignent la perte finale sur positions non désirées, pas un débit identique chaque seconde pendant 45 minutes. L’ordre SEC est issu d’une transaction sans reconnaissance ni contestation des constatations ; le récit attribue ces constatations à l’enquête.

### 38. Le marché tombe plus vite que l’information

`story:flash-crash-2010` · 2010 · États-Unis · actions, ETF et contrats à terme

- [Market Participants and the May 6 Flash Crash](https://www.sec.gov/news/speech/2010/spch101310geb.htm) — Gregg E. Berman, SEC, 2010-10-13 ; consulté le 2026-10-25. Séquence des baisses et reprises ; transactions sur certaines actions et ETF à un centime ou moins. Explications du travail d’enquête et du programme de 75 000 E-mini.
- [Statement on the Joint CFTC/SEC Staff Report on the May 6 Flash Crash](https://www.cftc.gov/PressRoom/SpeechesTestimony/chiltonstatement100710) — Bart Chilton, CFTC, 2010-10-01 ; consulté le 2026-10-25. Absence de coupable unique dans cette analyse ; liquidité, programme vendeur et transmission entre marchés.

Réserves : Les deux prises de parole commentent le même rapport conjoint : elles ne constituent pas deux enquêtes indépendantes. L’analyse de 2010 est explicitement datée, sans prétendre épuiser les recherches et procédures ultérieures. Les transactions annulées et maintenues ne sont pas assimilées ; aucune perte individuelle n’est inventée.

### 39. Le nickel monte, puis les transactions disparaissent

`story:nickel-annulation-2022` · 2022–2025 · Londres · contrats à terme sur nickel

- [Notice 22/052 — Suspension of LME Nickel Market](https://www.lme.com/-/media/Files/News/Notices/2022/03/TRADING-22-052-SUSPENSION-OF-LME-NICKEL-MARKET.pdf) — London Metal Exchange, 2022-03-08 ; consulté le 2026-10-25. Suspension des échanges à partir de 8 h 15 ; contrat nickel et contexte de volatilité.
- [First FCA enforcement action and fine against a Recognised Investment Exchange](https://www.fca.org.uk/news/press-releases/first-fca-enforcement-action-and-fine-against-recognised-investment-exchange) — FCA, 2025-03-20 ; consulté le 2026-10-25. Contrat à trois mois au-delà de 100 000 dollars, doublement et suspension ; annulation des transactions du 8 mars. Amende de 9,2 millions de livres et déficiences des contrôles.

Réserves : Le prix décrit un contrat à terme LME coté en dollars par tonne, pas tout le métal physique. Le récit ne statue pas sur les droits définitifs des parties dans les recours contre les annulations. La publication FCA rapporte les opérations annulées, pas un rendement réalisable après annulation.

### 40. Archegos : plusieurs banques, un même risque

`story:archegos-banques-2021` · 2021 · États-Unis / Suisse · financement et dérivés

- [Credit Suisse Group Special Committee — Report on Archegos Capital Management](https://www.sec.gov/Archives/edgar/data/1053092/000137036821000064/a210729-ex992.htm) — Credit Suisse / Paul, Weiss, 2021-07-29 ; consulté le 2026-10-25. Family office, dérivés, levier, appels de marge et perte Credit Suisse d’environ 5,5 milliards. Risques identifiés et défaillances de gestion avant le défaut.
- [Founder and Head of Archegos… Sentenced to 18 Years in Prison](https://www.justice.gov/usao-sdny/pr/founder-and-head-archegos-capital-management-bill-hwang-sentenced-18-years-prison) — U.S. Department of Justice, 2024-12-19 ; consulté le 2026-10-25. Constatations du procès : mensonges aux contreparties et manipulation ; appels de marge de mars 2021 ; condamnation de 2024.

Réserves : 5,5 milliards correspond à Credit Suisse seule, pas au total mondial. Le communiqué du 19 décembre rapporte la condamnation de 2024 ; sa date n’est pas assimilée à la date initiale du prononcé. Aucun résultat d’appel ultérieur n’est affirmé. Le rapport bancaire et le procès ont des objets et conclusions distincts.

### 41. L’argent des écoles mis au levier

`story:orange-county-1994` · 1994–1995 · Californie · finances locales

- [Administrative findings concerning Orange County investment pools and municipal offerings](https://www.sec.gov/info/municipal/omsdec2003.pdf) — SEC, 2003-12 ; consulté le 2026-10-25. Dépôts de 7,6 milliards, portefeuille de 20,6 milliards, chapitre 9 le 6 décembre 1994. Pertes réalisées finales d’environ 1,7 milliard, distinctes de l’estimation initiale de 1,5 milliard.
- [A Review of the Orange County Recovery Plan as Proposed August 22, 1995](https://lao.ca.gov/Publications/Detail/2900) — California Legislative Analyst’s Office, 1995-08-22 ; consulté le 2026-10-25. Faillite après pertes du portefeuille et examen du plan de redressement.
- [An Investment and Compliance Review of the Orange County Treasurer](https://www.ocgrandjury.org/sites/jury/files/2023-07/OCGJ-Investment062413.pdf) — Orange County Grand Jury, 2013 ; consulté le 2026-10-25. Argent de collectivités, écoles et districts ; levier et pari sur les taux.

Réserves : Le montant réalisé de 1,7 milliard est retenu plutôt que le chiffre de 1,6 milliard souvent cité. Il s’agit d’un portefeuille public collectif, pas d’une perte uniforme de chaque contribuable ni d’un défaut de tous les titres municipaux émis à l’époque.

### 42. Woodford : le bouton de retrait ne suffit plus

`story:woodford-retraits-2019` · 2019–2024 · Royaume-Uni · fonds d’actions

- [Update on LF Woodford Equity Income Fund](https://www.fca.org.uk/news/statements/update-lf-woodford-equity-income-fund) — FCA, 2019-06-05 ; consulté le 2026-10-25. Suspension décidée le 3 juin après hausse des retraits ; objectifs de protection et rôle de Link et du dépositaire.
- [FCA sets out findings against Link Fund Solutions](https://www.fca.org.uk/news/press-releases/fca-sets-out-findings-against-link-fund-solutions) — FCA, 2024-04-11 ; consulté le 2026-10-25. Défaillances de gestion de liquidité et de surveillance ; dispositif de réparation jusqu’à 230 millions.
- [Decision Notice: Neil Woodford — chronology, paragraphs 4.37–4.38](https://www.fca.org.uk/publication/decision-notices/neil-woodford-2025.pdf) — FCA, 2025 ; consulté le 2026-10-25. Chronologie de suspension le 3 juin et décision de liquidation du 15 octobre 2019.

Réserves : Sources du même régulateur à des dates différentes. Le récit porte sur la suspension, la liquidation et les constatations définitives contre Link en 2024 ; il ne présente pas les procédures individuelles contre Woodford comme définitivement closes. Réparation, produits de liquidation et rendement du placement sont distincts.

### 43. Ponzi : la poste comme alibi

`story:ponzi-coupons-1920` · 1919–1920 · Boston · promesses de placement

- [Ponzi Schemes](https://www.investor.gov/introduction-investing/investing-basics/glossary/ponzi-schemes) — SEC — Investor.gov, date non précisée ; consulté le 2026-10-25. Promesse de 50 % en quelques mois sur des coupons postaux et paiement des anciens investisseurs avec les nouveaux fonds.
- [A Model of Charles Ponzi — section 2, Historical Context](https://www.federalreserve.gov/econres/feds/files/2025020pap.pdf) — Federal Reserve, Finance and Economics Discussion Series, 2025 ; consulté le 2026-10-25. Contraintes matérielles du montage, investigations, reddition et plaidoyer de culpabilité en novembre 1920.

Réserves : Le récit ne prête à Ponzi aucune pensée et n’invente aucun dialogue. Le taux et l’échéance ont varié dans les offres et récits historiques ; la formulation « quelques mois » évite d’assimiler toutes les promesses à un contrat unique. Le travail de la Fed est une recherche rétrospective, pas une enquête contemporaine.

### 44. Amaranth : le gaz de mars contre celui d’avril

`story:amaranth-gaz-2006` · 2006–2007 · États-Unis · gaz naturel à terme

- [Remarks Before the Conference of Business Economists](https://www.sec.gov/newsroom/speeches-statements/spch020807aln-remarks-conference-business-economists) — Annette L. Nazareth, SEC, 2007-02-08 ; consulté le 2026-10-25. Pertes supérieures à 6 milliards de dollars en septembre 2006 et absence de crise systémique comparable.
- [Global Financial Stability Report — Box 2.4: The Amaranth Hedge Fund Failure and Liquidity Risk](https://www.imf.org/external/pubs/ft/gfsr/2007/02/pdf/text.pdf) — FMI, 2007-10 ; consulté le 2026-10-25. Spreads calendaires, positions disproportionnées, dégradation des conditions de sortie et reprise des positions par d’autres acteurs.

Réserves : Le document FMI a été consulté dans son texte indexé ; le serveur peut refuser le téléchargement direct. Le récit n’attribue pas l’effondrement à des accusations de manipulation portant sur d’autres opérations. Le prix du gaz physique et l’écart entre échéances ne sont pas confondus.

### 45. Icesave : l’épargne traverse une frontière

`story:icesave-frontiere-2008` · 2006–2013 · Islande / Royaume-Uni / Pays-Bas · dépôts

- [Report on Banking Regulation and Supervision in Iceland](https://www.government.is/media/forsaetisraduneyti-media/media/frettir/KaarloJannari__2009.pdf) — Kaarlo Jännäri, rapport pour le gouvernement islandais, 2009-03-30 ; consulté le 2026-10-25. Lancement des succursales Icesave en 2006 et 2008 et collecte transfrontière.
- [Judgment in Case E-16/11 — EFTA Surveillance Authority v Iceland (Icesave), Press Release 02/2013](https://eftacourt.int/wp-content/uploads/2019/01/16_11_PR_EN1.pdf) — EFTA Court, 2013-01-28 ; consulté le 2026-10-25. Perte d’accès aux dépôts en 2008, absence de paiement par TIF et intervention britannique/néerlandaise. Rejet de la demande et portée de la directive dans une crise systémique.

Réserves : Il s’agit de succursales et de systèmes de garantie distincts, pas d’une garantie européenne uniforme. L’arrêt ne doit pas être interprété comme une annulation de toutes les créances ni une mesure de récupération finale. Les versements ultérieurs des liquidateurs ne sont pas chiffrés ici.

### 46. Le placement liquide attend une enchère

`story:auction-rate-2008` · 2008 · États-Unis · auction rate securities

- [UBS Securities LLC and UBS Financial Services, Inc. Agree in Principle to Auction Rate Securities Settlement](https://www.sec.gov/newsroom/press-releases/2008-171-ubs-securities-llc-ubs-financial-services-inc-agree-principle-auction-rate-securities-settlement) — SEC, 2008-08-08 ; consulté le 2026-10-25. Produits commercialisés comme substituts au cash, marché bloqué en février et plus de 40 000 clients UBS concernés.
- [SEC Finalizes ARS Settlements With Citigroup and UBS, Providing Nearly $30 Billion in Liquidity to Investors](https://www.sec.gov/news/press/2008/2008-290.htm) — SEC, 2008-12-11 ; consulté le 2026-10-25. Fonctionnement et soutien des enchères, retrait des banques et accusations sur l’information des clients. Accords définitifs de liquidité pour les investisseurs éligibles.

Réserves : Deux étapes complémentaires de la même procédure SEC. Les accords ne couvrent pas indistinctement tous les détenteurs mondiaux d’ARS. Illiquidité et perte totale de capital sont distinctes ; les presque 30 milliards représentent le dispositif de liquidité annoncé, pas une perte nette de marché.

### 47. Des immeubles derrière un retrait quotidien

`story:immobilier-brexit-2016` · 2016 · Royaume-Uni · fonds immobiliers ouverts

- [Review of property funds and liquidity risks](https://www.fca.org.uk/publications/multi-firm-reviews/review-property-funds-and-liquidity-risks) — FCA, 2017 ; consulté le 2026-10-25. Suspensions et ajustements après le référendum, actifs non réalisables assez vite et incertitude des valeurs.
- [Record of the Financial Policy Committee meetings — 23 and 29 November 2016](https://www.bankofengland.co.uk/-/media/boe/files/record/2016/financial-policy-committee-meeting-december-2016.pdf) — Bank of England, 2016-12 ; consulté le 2026-10-25. Retraits, pressions de liquidité, suspensions, ventes parfois décotées mais absence de ventes forcées généralisées.

Réserves : L’épisode concerne certains fonds immobiliers ouverts britanniques, pas tous les véhicules immobiliers ni une perte totale des immeubles. Une suspension peut protéger collectivement les porteurs sans répondre à leur besoin individuel de liquidités.

### 48. FTX : le solde n’était plus une réserve

`story:ftx-argent-clients-2022` · 2019–2024 · Cryptoactifs · plateforme FTX

- [Samuel Bankman-Fried Sentenced to 25 Years in Prison](https://www.justice.gov/usao-sdny/pr/samuel-bankman-fried-sentenced-25-years-prison) — U.S. Department of Justice, 2024-03-28 ; consulté le 2026-10-25. Promesses de séparation, détournements vers Alameda, modification du code, usages et condamnation.
- [Using the Customer Claims Portal](https://support.ftx.com/hc/en-us/articles/19519576531476-Using-the-Customer-Claims-Portal) — FTX — portail officiel de la procédure, date non précisée ; consulté le 2026-10-25. Soldes et historique arrêtés au 11 novembre 2022 ; dépôt et examen des créances.

Réserves : Le récit n’annonce aucun taux de récupération final. Une créance valorisée à la date de faillite n’est pas automatiquement équivalente à la restitution du même nombre de cryptoactifs au cours du jour. La peine citée est celle de mars 2024, sans pronostic sur les recours ultérieurs.

### 49. Terra : le dollar qui dépend d’une mécanique

`story:terra-dollar-2022` · 2021–2024 · Cryptoactifs · UST et LUNA

- [SEC v. Terraform Labs and Do Hyeong Kwon — Complaint](https://www.sec.gov/files/litigation/complaints/2023/comp-pr2023-32.pdf) — SEC, 2023-02-16 ; consulté le 2026-10-25. Mécanisme UST/LUNA ; décrochage de mai 2021, intervention du tiers et fausse présentation d’un retour automatique à la parité.
- [Terraform and Kwon to Pay $4.5 Billion Following Fraud Verdict](https://www.sec.gov/newsroom/press-releases/2024-73) — SEC, 2024-06-13 ; consulté le 2026-10-25. Verdict civil d’avril 2024, effondrement de mai 2022 et accord financier avec liquidation.

Réserves : Les deux sources appartiennent à la même affaire, de la plainte au verdict et à l’accord. 4,5 milliards est le montant juridique de l’accord, pas une somme déjà intégralement versée aux victimes. Le récit ne confond pas cette procédure civile avec les procédures pénales ultérieures.

### 50. WeWork : la flexibilité a un propriétaire

`story:wework-baux-2019` · 2019–2023 · États-Unis · bureaux partagés

- [The We Company — S-1, Lease Obligations, page 122](https://relayto.com/explore/s1-wework-prospectus-w1j0cig2wtl1x/CpRkRZ9t122) — The We Company, copie du prospectus EDGAR sur Relayto, 2019-08-14 ; consulté le 2026-10-25. Paiements minimaux fixes futurs non actualisés de 47,2 milliards sur les baux signés au 30 juin 2019 ; modèle de baux.
- [Request for Withdrawal of Registration Statement on Form S-1](https://www.sec.gov/Archives/edgar/data/1533523/000119312519258913/d808793drw.htm) — The We Company, dépôt EDGAR, 2019-09-30 ; consulté le 2026-10-25. Retrait volontaire du projet d’offre publique déposé le 14 août.
- [Form 8-K — Bankruptcy or Receivership](https://www.sec.gov/Archives/edgar/data/1813756/000119312523271902/d522028d8k.htm) — WeWork, dépôt EDGAR, 2023-11-07 ; consulté le 2026-10-25. Chapitre 11 déposé le 6 novembre par WeWork et certaines filiales ; poursuite d’activité sous contrôle judiciaire.

Réserves : 47,2 milliards est un total de loyers minimaux futurs non actualisés, pas une perte nette, une dette immédiatement exigible ou la valorisation de l’entreprise. Le retrait de 2019 n’est pas présenté comme la seule cause de la restructuration de 2023. Le prospectus source est consulté dans une copie accessible, les deux autres documents sur EDGAR.

## Trois textes représentatifs complets

Textes identiques au contenu copié dans l’application ; les sources ci-dessus et ci-dessous restent hors publication.

### Enron : le salaire et la retraite dans la même entreprise

Chez Enron, perdre son employeur peut aussi signifier voir disparaître une grande partie de son épargne retraite. Les deux risques portent le même nom. 🏢

Les salariés disposent d’un plan d’épargne américain, le 401(k). Ils peuvent y verser une partie de leur rémunération, et l’entreprise apporte elle-même des actions Enron en complément.

Fin 2000, les actions du groupe représentent 62 % des actifs de ce plan, selon le rapport du service de recherche du Congrès. Il s’agit de l’ensemble du plan, pas de la répartition identique de chaque salarié.

L’entreprise publie alors des résultats qui donnent l’image d’une activité en croissance. Mais les procédures judiciaires établiront un système destiné à tromper les investisseurs sur ses performances et sa situation financière.

Quand le montage se défait, la faillite de décembre 2001 frappe aussi les comptes de retraite. L’action devient pratiquement sans valeur. L’épargne préparée pendant les années de travail est exposée au même effondrement que l’emploi.

En 2013, après les recours sur sa peine, l’ancien directeur général Jeffrey Skilling est de nouveau condamné à quatorze ans de prison. Environ 42 millions de dollars doivent être affectés à l’indemnisation des victimes.

Douze ans après la faillite, la justice organise encore des restitutions. Pour les salariés dont la retraite dépendait du groupe, la disparition de l’employeur n’avait été que le début du dossier.

Pas un conseil financier.

Preuves : [Congressional Research Service (copie accessible)](https://www.everycrsreport.com/files/20020311_RS21115_393ab0c2b87d7edcff49225eacbde3f8f95b2f88.html), [Department of Justice](https://www.justice.gov/criminal/criminal-vns/case/united-states-v-jeffrey-k-skilling).

### Cisco : Internet ne rachète pas les stocks

Internet continue à se développer. Pourtant, chez Cisco, une partie du matériel préparé pour équiper les réseaux est devenue un énorme problème financier. 📦

L’entreprise vend les équipements qui font circuler les données. À la fin de 2000, ses commandes progressent encore très vite. Quelques mois plus tard, le ralentissement des dépenses de ses clients change brutalement les besoins prévus.

Ce qui avait été commandé pour accompagner la croissance devient du stock en trop, avec des engagements d’achat auprès des fournisseurs. Le 8 mai 2001, Cisco annonce une charge d’environ 2,2 milliards de dollars pour ces excédents.

Le communiqué contient alors deux résultats très différents. Après exclusion de plusieurs charges, l’entreprise présente un bénéfice « pro forma » de 230 millions de dollars. Dans les comptes complets, elle affiche une perte nette de 2,69 milliards pour le trimestre.

Les deux chiffres figurent dans le même document. La différence porte notamment sur ce que coûte l’ajustement à une croissance qui n’est plus au rendez-vous.

Le rapport annuel suivant montre ce que cette correction recouvre : du matériel détruit, des composants revendus à perte, d’autres finalement utilisés, et des engagements renégociés. La charge initiale ne correspond donc pas à un chèque unique envoyé ce jour-là.

Le réseau Internet avait un avenir. Cela n’obligeait pas les clients à acheter, au moment prévu, tous les équipements que Cisco avait préparés.

Pas un conseil financier.

Preuves : [Cisco](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2001/m05/cisco-systems-reports-third-quarter-earnings.html), [Cisco / dépôt SEC](https://www.sec.gov/Archives/edgar/data/858877/000089161802004345/f84358exv13.htm).

### Les retraites britanniques ont manqué de liquidités

Une stratégie conçue pour sécuriser des retraites peut obliger à vendre au pire moment.

Les régimes britanniques à prestations définies promettent des paiements sur de longues années. Pour gérer leur exposition aux taux, certains utilisent des stratégies LDI, avec des instruments financiers qui demandent des garanties supplémentaires quand les marchés bougent fortement.

En septembre 2022, les rendements des emprunts d’État britanniques montent brutalement et leurs prix chutent. Les appels de garanties imposent de trouver du cash. Vendre des obligations permet d’en obtenir, mais ces ventes accentuent la chute des prix, qui déclenche de nouveaux besoins de liquidités.

Le mécanisme censé aider à couvrir des engagements de long terme se retrouve prisonnier d’une urgence de trésorerie. Le 28 septembre, la Banque d’Angleterre intervient pour restaurer le fonctionnement du marché. 🏦

Elle achète finalement 19,3 milliards de livres d’obligations jusqu’au 14 octobre, puis revend ces titres entre novembre 2022 et janvier 2023. Ce montant correspond aux achats réalisés, pas à la capacité maximale annoncée.

La crise n’établit pas que toutes les pensions ont disparu. Elle montre quelque chose de plus précis : avoir un actif pour les prochaines décennies ne garantit pas de posséder le cash exigé cet après-midi.

Pas un conseil financier.

Preuves : [Bank of England](https://www.bankofengland.co.uk/quarterly-bulletin/2023/2023/financial-stability-buy-sell-tools-a-gilt-market-case-study?sf183860239=1), [Bank of England / HM Treasury](https://www.gov.uk/government/publications/letter-from-the-chancellor-of-the-exchequer-to-the-governor-of-the-bank-of-england-16012023/letter-from-the-governor-of-the-bank-of-england-to-the-chancellor-of-the-exchequer-16012023).
