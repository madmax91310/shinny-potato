# Quinze nouvelles histoires de marchés — revue du 1er novembre 2026

## Périmètre et inventaire courant

Lecture de `CLAUDE.md` et du contrat §7.24 de `docs/claude/audit-application-2026-10-18.md` ; aucun `AGENTS.md` trouvé dans le dépôt ni dans les répertoires parents de ce checkout. Base de travail : master `3f7ba583867ccb6d8125eb3f26d7a36875758a5e`. Relecture de master `a559dfdb5d590b4260c952829d2088805bce15e4` pendant la réalisation : aucun changement sur l’outil ou ses composants de sélection/espace de travail.

Le registre **réellement exposé** contient avant ce lot **129 entrées : 77 récits fixes et 52 repères mesurés**. Les 50 récits de `stories.json`, les 17 ajouts du 26 octobre et les 10 récits historiques relus sont tous inventoriés dans [le CSV de départ](market-stories-inventory-2026-11-01.csv), avec identifiant, titre, famille et empreinte de l’entrée. Les repères mensuels ne sont pas recomptés comme des histoires humaines. Les anciens compteurs de l’audit d’octobre ne sont pas repris.

Les PR [#953](https://github.com/madmax91310/shinny-potato/pull/953), [#972](https://github.com/madmax91310/shinny-potato/pull/972) et [#975](https://github.com/madmax91310/shinny-potato/pull/975) sont vérifiées fusionnées. Au relevé initial des PR ouvertes, #1117, #1115, #1114, #1061 et #1042 ne portent pas sur ce registre. Aucun travail de calendrier, de budget, de collecte ou d’autre format n’est repris dans ce lot.

Après ajout : **144 entrées, dont 92 récits et 52 repères**. Comparaison profonde avec l’export initial des 129 anciennes entrées : toutes identiques, identifiants et ordre relatif conservés. Les anciens fichiers éditoriaux et les moteurs partagés ne sont pas modifiés.

## Doublons évités et choix d’angles

Enron, LTCM, Barings/Nick Leeson, Hunt, Volkswagen 2008, franc suisse 2015, Flash Crash 2010, LDI 2022 et SVB sont déjà des récits accessibles. Ils ne sont pas ajoutés une seconde fois. Newton, John Law, 1929, les krachs Internet/2008/Covid, le record japonais et le CAC 40 occupent déjà les mécaniques de bulle et de longue récupération ; aucune nouvelle histoire ne prend pour fil principal une chute suivie d’un retour au sommet.

Wirecard, WTI négatif et Apple–Microsoft sont mentionnés dans le dossier historique de #953, mais **ne figurent pas dans les 129 entrées exposées de cette base**. Ils ne sont ni présentés comme des récits disponibles ni réintroduits sous un autre titre. Parmalat est laissé de côté : la trésorerie fictive est déjà très représentée par les autres fraudes. Un autre compte de pertes dissimulées aurait aussi trop ressemblé à Barings. Les anecdotes sur l’or d’une bague chez Bre-X, la mort du géologue ou une conversation instantanée Disraeli–Rothschild sont exclues du texte public.

Les rapprochements de mécanique ont été relus :

- Tokyo et Knight concernent tous deux l’informatique, mais Tokyo raconte l’impossibilité de redémarrer proprement un marché avec les ordres en attente ; Knight raconte un code qui envoie des ordres indésirables.
- Metallgesellschaft et les LDI comportent un besoin de cash. L’ajout part d’un engagement industriel de livraison à prix fixe, couvert avec d’autres échéances ; il ne transpose pas le récit des pensions britanniques.
- Palm concerne la difficulté matérielle à arbitrer deux prix liés par une distribution annoncée, plutôt qu’un squeeze à la Volkswagen/GameStop ou l’entrée indicielle de Tesla.
- Railway Mania porte sur les souscriptions partiellement libérées et le capital encore à verser, sans refaire Newton ou le Nasdaq.
- AOL traite la dépréciation d’une survaleur comptable ; Yahoo traite le périmètre d’une cession ; Renault–Volvo les droits de contrôle ; Cadbury la vérification des déclarations de l’acquéreur. Quatre opérations d’entreprise, quatre enjeux distincts.

## Sélection et relecture individuelle

Les titres exacts et les publications complètes sont dans [le registre du lot](../src/pages/market-facts/additions-20261101.json). Chaque entrée conserve `period`, `reviewedAt`, `sources` (URL, titre, organisme, date de publication connue ou null, contrôle, faits couverts) et `reserves`. Le texte public contient une seule mention « Pas un conseil financier. » et aucune URL technique/date de vérification.

Six familles existantes ; onze histoires concernent principalement des événements hors des États-Unis, en incluant le rachat franco-suédois et celui de Cadbury au Royaume-Uni. Les périodes vont de 1844 à 2020. Aucun nouveau récit de baisse/récupération. Longueurs autour de 1 250–1 500 caractères, avec paragraphes liés et une accroche propre à l’événement.

| Titre | Famille du registre | Lieu et période | Relecture : précision décisive et intérêt de l’angle |
| --- | --- | --- | --- |
| Tokyo : le secours qui ne prend pas le relais | Retournements et mécanismes | Japon, 1–2 octobre 2020 | Marché actions au comptant, pas tous les marchés japonais ; panne et gestion des ordres reçus. L’accroche décrit une journée entière sans échanges. |
| Herstatt : les marks sont partis, les dollars attendent | Devises et dettes | Allemagne / États-Unis, 26 juin 1974 ; CLS 2002 | Risque sur le principal déjà payé, distinct du taux de change. Le récit suit le trajet concret du paiement. |
| Metallgesellschaft : se couvrir et manquer de cash | Retournements et mécanismes | Allemagne / filiale américaine, 1991–1994 | Livraisons longues, couverture courte et flux décalés. Aucune affirmation que conserver la couverture aurait nécessairement tout résolu. |
| Bre-X : l’or était dans les échantillons | Fraudes et fausses promesses | Canada / Indonésie, 1993–1997 | Ressources annoncées et métal ajouté aux échantillons, sans chiffres de réserves ni culpabilité individuelle inventés. Le tournant est le forage indépendant. |
| Thomas Cook : le billet retour après la faillite | Entreprises et décisions | Royaume-Uni, septembre–octobre 2019 | 150 000 clients estimés à l’étranger ; 746 vols, pas 746 clients ; protéger leur retour ne sauve pas les actions. |
| Carillion : des contrats publics, presque plus de trésorerie | Entreprises et décisions | Royaume-Uni, 2017–2018 | Passifs distincts de la dette bancaire ; corrections de contrats et continuité du service public. Le carnet de commandes n’est pas une réserve de cash. |
| AOL–Time Warner : effacer une valeur inscrite au bilan | Entreprises et décisions | États-Unis, 2000–2002 | Charges d’environ 54 puis près de 100 Md$ dans le rapport 2002 d’époque ; ni perte nette ni décaissement équivalent. Le goodwill est expliqué. |
| Yahoo : deux prix qui n’achètent pas la même chose | Entreprises et décisions | États-Unis, 2008–2017 | Offre de 44,6 Md$ pour toutes les actions versus 4,83 Md$ pour des activités, puis réduction de 350 M$ ; cash et participations asiatiques exclus. Aucun pourcentage de perte factice. |
| Palm : la filiale vaut plus que l’ensemble | Bulles et crises | États-Unis, mars–juillet 2000 | 1,5 action prévu approximativement contre 1,4832 distribué finalement ; prix historiques USD arrondis. Emprunter les titres pour arbitrer était une contrainte réelle. |
| Railway Mania : le prix de l’action n’est pas tout à payer | Bulles et crises | Royaume-Uni, 1844–1847 | 10 % initialement selon le mécanisme documenté, pas une règle universelle ; plus de 700 projets examinés, pas autant de lignes construites. Le solde à payer fait progresser l’histoire. |
| Londres : le jour où les commissions deviennent négociables | Retournements et mécanismes | Royaume-Uni, octobre 1986 | Réforme des intermédiaires et passage aux écrans ; pas une hausse des actions ni le carnet automatisé moderne. |
| Suez : acheter des actions avec un prêt relais | Banques et confiance | Royaume-Uni / Égypte, 1875–1876 | 176 602 titres et prix net proche de 3,98 M£ ; commission séparée ; actions d’une compagnie, sans achat du territoire. L’avance et le financement public sont distingués. |
| Salomon : des clients qui n’avaient rien demandé | Fraudes et fausses promesses | États-Unis, 1991–1992 | 57 % de l’émission du 21 février, pas de toute la dette ; plafond d’attribution de 35 %, pas interdiction générale de toute offre agrégée au-delà. |
| Renault–Volvo : une fusion annoncée puis retirée | Entreprises et décisions | France / Suède, septembre–décembre 1993 | Retrait par le conseil avant approbation ; pas de scrutin final inventé. La question est le pouvoir associé aux titres. |
| Cadbury : l’usine que l’acheteur pensait garder | Entreprises et décisions | Royaume-Uni, 2009–2011 | Croyance sincère admise par le Panel, fondement insuffisamment vérifié ; fermeture décidée avant Kraft. Pas de condamnation pénale fabriquée. |

Relecture éditoriale séparée : accroches concrètes, absence de dialogues/pensées/vécu personnel inventés, vocabulaire expliqué, dénouements spécifiques, pas de question finale automatique ni des trois formules interdites. Les réserves qui changent le sens d’une histoire restent aussi dans son récit, notamment Yahoo, Palm et AOL.

## Recherche et preuves

Recherche web réelle pour chaque sujet, requêtes reformulées et lecture des documents cités. **35 documents distincts**, dont régulateurs, banques centrales, places, dépôts SEC, enquêtes parlementaires, loi et archives. Les faits déterminants sont reliés à chaque document dans `sources[].facts`, sans faire passer plusieurs documents d’un même émetteur pour des confirmations indépendantes.

[Reçus de consultation et de téléchargement](market-stories-sources-2026-11-01.json) : 32 téléchargements directs réussis avec SHA-256 et date de récupération. Trois refus directs restent explicitement conservés : PDF BRI (404), page NSSC (500), archive Rothschild (503). BRI et NSSC ont été lus intégralement par l’outil web. L’archive Rothschild a été consultée par ses passages indexés ; le détail de Suez est vérifié dans le Hansard intégral et la loi du 15 août 1876 reproduisant l’accord du 25 novembre 1875. Ce refus n’est pas maquillé en téléchargement réussi.

Le PDF JPX a d’abord échoué dans l’outil web, puis a été téléchargé et extrait localement : sa couverture date du **23 octobre 2020**, ce qui a corrigé la date initialement envisagée du document. Pour Renault–Volvo, le résumé universitaire payant et UPI ont été remplacés par l’article intégral de Bruner et le rapport AP4 d’un actionnaire. L’interprétation des droits de contrôle est attribuée à l’étude, pas présentée comme une pensée des investisseurs.

## Intégration et usages

Un seul import du lot supplémentaire dans le registre existant. Les identifiants `story:…` entrent automatiquement dans les familles, la recherche commune du sélecteur, la rédaction fixe, les sources et le tirage aléatoire sans répétition pendant la session. Les contrats restent `archive-or-editorial` : aucune collecte quotidienne n’est créée pour ces faits historiques.

L’outil n’avait ni éditeur ni état persistant de publication/bibliothèque de brouillons à migrer. Un éditeur repliable conserve désormais une modification par identifiant **pendant la session de l’outil**, avec restauration explicite du texte d’origine. Aperçu et copie partagent exactement ce texte ; les preuves restent celles de l’original, comme indiqué à côté de l’éditeur. Aucun stockage local existant n’est lu, effacé ou renommé. Le tirage aléatoire conserve son mécanisme d’origine et n’inclut toujours pas les repères mesurés.

Aucune image de publication, refonte, catégorie, infrastructure ou modification du calendrier. Les seules adaptations du portail branchent les contrôles des récits et leur recette ciblée sur les jobs existants.

## Vérifications locales

- `npm ci`, `npm run build` : précontrôles, compilation Vite, budgets de routes inchangés, couverture publiée et manifeste de 42 fichiers réussis. Route : environ 659,8 / 699 ko de code, données comptées séparément.
- `test-market-stories`, `test-market-story-selection`, `test-reusable-data-contracts`, `test-data-reuse` : réussis. Identifiants/titres uniques, quinze ajouts, sources obligatoires, longueur, mention unique, texte fixe et contrats d’archive contrôlés.
- `audit:publishable-content` : 144 faits, zéro erreur ; `audit:source-inventory` : réussi.
- Lint ciblé et contrôle des espaces du diff livré : réussis.
- `playwright-tools.mjs --market-facts` : 144 contenus, sélection, copie, sources et cycle de 92 récits réussis.
- `playwright-market-stories.mjs` : Chromium réel à **1440, 390 et 360 px**, toutes les entrées lues/copiées exactement, preuves comparées au registre, recherche et absence de résultat, lien externe ouvert en nouvel onglet, 92 récits sans répétition puis nouveau cycle sans doublon immédiat. Pour chaque ajout : édition, aperçu, copie du brouillon, aller-retour vers un autre récit, conservation et restauration. Aucune erreur JavaScript ni débordement horizontal.
- Inspection visuelle des [aperçus ordinateur](market-stories-2026-11-01/desktop.png) et [mobile avec sources](market-stories-2026-11-01/mobile-sources.png). Les rapports/projections régénérés par le build mais étrangers à cette tâche sont exclus de la PR.

Les commandes permanentes sont conservées dans le dépôt ; le portail exécute la recette des quinze ajouts avec `--additions`, les fonctions générales restant couvertes par le test existant des outils. Aucun envoi sur X. La PR est destinée à la revue, **sans fusion ni déploiement demandés ou réalisés**. L’état de CI est rapporté séparément après vérification sur GitHub.
