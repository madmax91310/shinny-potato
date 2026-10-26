# Hey @Grok — sélection et explorateur du 26 octobre 2026

Chantier préparé pour revue uniquement : aucune fusion, aucun déploiement, aucune publication sur X. Base initiale : `21671ca1` sur master, après lecture de CLAUDE.md, de l’audit d’application et de l’audit de maintenance du 26 octobre. Les changements de collecteurs et les PR DCA sont laissés séparés.

## Direction et contenu

L’entrée est désormais la situation concrète : capital, âge, salaire, décision de vie, entreprise à étudier ou risque à examiner. Les 80 intentions fournies sont reprises dans la collection « Nouvelle sélection ». Aucun texte n’est remplacé par une question générique ou par un avertissement financier. Les scénarios chiffrés de la banque et des modèles sont des exemples, sans identité d’abonné. Aucun cours, taux courant ou rendement futur certifié n’est ajouté.

| Traitement des anciens contenus | Nombre |
|---|---:|
| Anciens textes actifs inchangés | 268 |
| Ancien ID réutilisé dans la sélection | 1 |
| Anciens textes archivés et accessibles | 11 |
| Nouveaux identifiants | 79 |
| Questions actives | 348 |
| Total avec archives | 359 |
| Collection « Nouvelle sélection » | 80 |

Ce total résulte de la relecture et du rapprochement, pas d’un objectif de volume. Les 280 identifiants antérieurs sont tous conservés. Les anciennes catégories et mécaniques restent des métadonnées consultables dans « Plus de filtres ».

### Rapprochements et modification du texte fourni

Aucun doublon textuel exact n’a été trouvé entre les 80 textes et l’ancienne banque. La référence **46** (sept entreprises utilisées au quotidien sans connaître leur nom) reprend l’ID **marques-11**, qui porte la même intention. Le nouveau texte est conservé intégralement ; l’ancienne formulation reste dans `previousText`, visible depuis la carte et disponible pour la migration des usages.

La seule modification substantielle du texte fourni concerne la référence **61** : « si Nvidia continue de battre ses records de bénéfices » devient « si Nvidia battait des records de bénéfices ». La question reste : son action pourrait-elle perdre **50 %** malgré ces bénéfices ? Le conditionnel évite d’affirmer une situation actuelle non vérifiée. Aucun montant, âge, durée ou pourcentage des 80 questions ne change. La fixture `scripts/fixtures/hey-grok/annex-20261026.json` conserve les textes de référence ; le contrôle avant build vérifie chaque correspondance et les nombres.

Les proximités sont relues, pas supprimées sur la seule base d’un score. Les références 45 et 55 sont toutes deux conservées : la première étudie les bénéficiaires quel que soit le modèle d’IA gagnant, la seconde les fournisseurs qui résisteraient à la disparition d’applications populaires. Les références 40, 68 et 77 interrogent respectivement le doublon World/Nasdaq, le nombre d’ETF et les actions qui concentrent le risque. Les anciennes questions générales sur les choix de vie restent disponibles à côté des nouveaux cas chiffrés. Aucune de ces demandes ne prétend que Grok connaîtrait l’avenir.

### Archives

| ID conservé | Motif de retrait des suggestions ordinaires |
|---|---|
| bourse-14 | Limites d’un graphique : question trop générale |
| bourse-19 | Fermeture des marchés cinq ans : scénario trop lointain |
| banques-03 | Nombre de comptes : seuil trop arbitraire |
| banques-15 | Méthode d’épargne : formulation scolaire |
| banques-20 | Habitudes de sabotage : enjeu trop large |
| travail-09 | Qualité idéale du manager : choix abstrait |
| travail-18 | Heures travaillées avec un ami : contrainte artificielle |
| societe-16 | Signes de réussite sans facture : formulation générale |
| technologie-08 | Choisir un droit sur ses objets : trop abstrait |
| technologie-20 | Entretien entre deux IA : situation trop éloignée |
| marques-17 | Nom familial après vente : angle trop étroit |

Ces cartes restent accessibles par « Archives de la banque ». Elles apparaissent aussi dans les favoris, l’historique et les brouillons sans exiger ce filtre. Les textes, favoris, usages et brouillons ne sont pas effacés.

## Thèmes compréhensibles

Neuf thèmes plus « Tout » remplacent les deux axes dans le parcours courant. La collection « Nouvelle sélection » reste un accès rapide indépendant du thème.

| Ancienne catégorie | Thème principal par défaut |
|---|---|
| Investissement et Bourse | Investissement |
| Immobilier | Immobilier |
| Banques et épargne | Épargne |
| Salaire et travail | Salaire et travail |
| Budget et consommation | Dépenses |
| Marques et entreprises | Marques et avenir |
| Argent et société | Couple et famille |
| Technologie, IA et métiers de demain | Marques et avenir |

Les exceptions explicites de `taxonomy.js` classent les métiers de l’IA dans « Salaire et travail », des questions de richesse et de transmission dans « Patrimoine », et quelques décisions d’argent courant dans « Dépenses ». Les 80 références ont chacune leur thème écrit dans `selection.js` : retraite, patrimoine et travail en début de collection ; décisions immobilières et dépenses ensuite ; investissement et entreprises dans la seconde partie. Une question possède toujours un seul thème principal. La recherche porte sur le texte et les libellés de thèmes ; les anciennes catégories/mécaniques sont facultatives.

## Parcours et édition

Explorer, Favoris et Historique forment la navigation. Les cartes montrent le texte intégral et proposent Copier, Modifier, Favori, Utilisé/annuler. Six cartes sont proposées au départ ; « Voir plus » en ajoute six, « Propose-moi autre chose » renouvelle le lot. Les questions non utilisées passent d’abord. Chaque sélection conserve ses IDs déjà proposés pendant la session ; l’épuisement exige une reprise explicite. Le filtre Non utilisés n’est jamais relâché. Recharger commence une nouvelle session de suggestions, sans changer favoris, usages ou brouillons.

Les thèmes et les filtres avancés se replient. Les accès Nouvelle sélection, Ça va débattre et Non utilisés restent visibles. La liste vide propose une remise à zéro explicite. Les questions personnelles ont un contexte de filtres distinct ; revenir à la banque restaure exactement ses filtres précédents, sans les supprimer.

L’éditeur commun s’ouvre à la demande. Fermer, Échap, changer de route ou recharger garde le brouillon ; Annuler l’abandonne explicitement. Un second brouillon ne remplace pas le premier : il faut l’enregistrer ou l’abandonner avant d’en ouvrir un autre. Modifier une question de banque puis Enregistrer crée une variante personnelle avec son propre ID. Restaurer l’original change seulement le brouillon. Les variantes personnelles se retrouvent dans Mes questions et peuvent être modifiées ou supprimées ; un historique existant conserve son texte après suppression.

Les modèles sont déterministes et facultatifs : saisie libre, retraite, objectif, revenu/projet, duel. Chaque modèle n’affiche que ses paramètres utiles. L’aperçu suit les paramètres immédiatement ; après personnalisation du texte, remplacer celui-ci demande un accord explicite dans l’éditeur. Le compteur `twitter-text` porte sur la chaîne réellement copiée. Un brouillon vide ou trop long peut être conservé ; la copie est désactivée s’il est vide, invalide ou dépasse 280. Le presse-papiers refusé ouvre un texte sélectionnable, dans l’éditeur si celui-ci est ouvert. La réussite n’est annoncée qu’après la copie effective.

## Stockage et limites connues

La clé historique **el-hey-grok-v1** est conservée, sans namespace parallèle. Le schéma v2 garde `favorites`, `used`, `drafts` et les champs inconnus ; il ajoute les questions personnelles, les instantanés d’usage et le contexte d’édition/navigation. La lecture ne réécrit rien. La migration est sauvegardée lors de la première action volontaire.

Les anciennes données ne contiennent ni date de marquage ni instantané au moment de l’usage : l’historique affiche **date inconnue** et indique que le texte a été repris à la migration. Un brouillon existant est prioritaire, puis l’ancienne formulation conservée, puis la source disponible. Aucune date de publication n’est inventée. Les nouveaux marquages conservent la date et le texte exacts ; une modification ultérieure ne change pas cet instantané. Copier ne crée aucun usage et un usage de variante n’écrase pas celui de la source.

Le nouveau lecteur de snapshot réutilise le lecteur/écrivain validé commun `publication-preferences.js`. Les signatures et formes de retour existantes sont préservées. Une donnée illisible, un format futur inconnu ou un conflit observé entre lecture et écriture bloque la persistance sans effacer les octets existants. Quota et stockage refusé laissent les changements en mémoire avec un avertissement : ils ne garantissent pas une conservation après fermeture du navigateur. Les données restent locales à ce navigateur ; aucune synchronisation ni mesure de vues n’est ajoutée.

Les preuves de recette, captures et commandes effectivement terminées figurent dans la PR. Le calendrier, les collecteurs, l’accueil général et les autres outils ne sont pas remaniés.

## Recette exécutée et coordination

La branche a été rebasée sur `6cec5f49`, incluant les correctifs DCA/collecte puis les PR #979 (accueil cobalt compact) et #980 (logos). Leurs modifications sont conservées. La PR concurrente #981 concerne les preuves de collecte et le monitoring, sans recouvrement avec ce chantier.

| Contrôle réellement exécuté | Résultat |
|---|---|
| `node scripts/test-hey-grok.mjs` | 80 références, nombres, identifiants, archives, filtres, cycles, migration et stockage validés ; maximum pondéré : 217/280 |
| `node scripts/test-publication-preferences.mjs` | Contrats communs préservés, lecture du snapshot et protection des données corrompues |
| `node scripts/test-tweet-bank-storage.mjs` | Stockage de l’autre banque inchangé |
| `npm run lint` | Réussi ; 13 avertissements préexistants hors chantier |
| `npm run build` | Réussi avec contrôles préalables, budgets des routes et couverture des données publiées |
| `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-hey-grok.mjs` | Parcours réels à 320, 390 et 1280 px, clavier/tactile émulé, erreurs de stockage et copie refusée |
| `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-preference-integrity.mjs` | Intégrité des préférences des autres outils à 390 et 1440 px |
| `CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/playwright-tools.mjs --navigation` | Navigation des outils à 320 et 390 px |

Le parcours dédié contrôle notamment la copie exacte sans métadonnées ni usage implicite, les favoris hérités, les archives et brouillons, l’historique immuable et annulable, les filtres combinés, la sélection vide, Voir plus, le renouvellement et son épuisement explicite. Il vérifie aussi les modèles et leur confirmation avant remplacement, la création/modification/suppression des questions personnelles, les variantes indépendantes, les textes vides ou trop longs, emojis/liens/retours à la ligne et la conservation du brouillon après navigation et rechargement. Les cas JSON corrompu, accès refusé, quota, conflit observé et presse-papiers refusé sont reproduits. Aucun appel d’écriture HTTP ni erreur de page n’est observé.

Les [résultats détaillés](reports/hey-grok-explorer-20261026/results.json) et les captures sont conservés dans le dépôt : [mobile 320 px](reports/hey-grok-explorer-20261026/mobile-320.png), [mobile 390 px](reports/hey-grok-explorer-20261026/mobile-390.png), [ordinateur 1280 px](reports/hey-grok-explorer-20261026/desktop-1280.png), [éditeur 390 px](reports/hey-grok-explorer-20261026/editor-390.png). Aucun débordement horizontal ni tweet tronqué. La première carte commence à 693 px au maximum sur le parcours mobile testé, avec les thèmes et filtres avancés repliés.

La recette utilise Chromium réel avec tailles mobiles et événements tactiles émulés ; aucun appareil physique ni Safari n’a été testé. Les limites de dates historiques, de stockage local et de cycles limités à la session sont décrites ci-dessus. Aucune réponse financière n’est calculée ou certifiée par cet outil. Livraison pour revue, sans fusion ni déploiement.
