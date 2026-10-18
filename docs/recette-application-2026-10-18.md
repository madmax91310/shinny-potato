# Recette fonctionnelle de l’application du 18 octobre 2026

## Actualisation après #789 et #796

Master `523d0cb6` intégré. L’ancien décalage des pastilles n’est plus applicable : le visuel approuvé a supprimé ces pastilles et amélioré les en-têtes. Ce rendu est conservé exactement ; le test vérifie désormais son absence de pastilles et le confinement des noms longs dans les colonnes sur 50 dispositions (2–6 actifs, 1–10 années). Les PNG à trois et six actifs ont été inspectés.

La régression de dédoublonnage/expiration reste ajoutée. Le calendrier utilise déjà sur master le nombre réel d’offres ; une attente explicite du panneau asynchrone est ajoutée avant de compter l’alerte simulée. Compilation, budgets, audit de revue, partition des tests, 50 dispositions et parcours calendrier mobile réussis. Les projections régénérées sans modification de leur générateur sont exclues du commit. La CI distante et le déploiement de cette intégration restent à confirmer.

## Résultat et périmètre

Recette effectuée à partir de `master` au commit `b248801239679885200173e7db3570b5c622378d`, également identifié par le `build-info.json` du site publié au relevé. Les données générées par les builds ne sont pas incluses dans les corrections de cette branche.

Pendant la recette, les PR #762 et #764 ont été fusionnées par les chantiers parallèles. La branche a ensuite intégré `master` au commit `8eebe02ffef9bb4b870f679a8108f330108a6ef2`. Les effectifs ci-dessous décrivent le premier instantané testé ; ils ne sont pas annoncés comme les effectifs définitifs après ces ajouts.

Les 26 routes du registre ont été ouvertes dans Chromium à 1440 et 390 pixels, soit 52 ouvertures : aucune erreur JavaScript ni débordement horizontal de page. Ce passage systématique contrôle l’ouverture et les aperçus disponibles par défaut ; les suites spécialisées ci-dessous exercent les sélections, calculs, erreurs, sauvegardes et exports. Il ne couvre pas toutes les combinaisons possibles de tous les paramètres.

Les 31 suites navigateur existantes exécutées ont toutes terminé avec succès, auxquelles s’ajoute le nouveau contrôle des en-têtes. Les audits ciblés de calculs, de données et de conventions passent également. Deux défauts ont été corrigés : un contrôle de maintenance bloquant l’ajout légitime d’une quatrième offre et un chevauchement entre une pastille et les noms d’actifs sur deux lignes dans les images de classement.

## Corrections livrées

### Les nouvelles offres ne cassent plus la recette du calendrier

Le run CI [39105279286](https://github.com/madmax91310/shinny-potato/actions/runs/39105279286) de la PR courtiers #764 échouait dans `audit:data-review` : `4 !== 3`, assertion « Les offres réutilisées dans plusieurs cellules sont dédoublonnées ».

Le test confondait le dédoublonnage et le nombre d’offres du catalogue. Les attentes sont maintenant dérivées des références de preuve et de leurs échéances. Les assertions vérifient les identifiants exacts et les dates, pas uniquement un effectif. Le test navigateur du calendrier suit également le nombre d’offres du rapport courant.

Une fixture indépendante vérifie qu’une offre utilisée par plusieurs rubriques n’apparaît qu’une fois par courtier, que deux courtiers peuvent conserver chacun une échéance pour le même document, qu’une nouvelle offre ne supprime pas les anciennes et que seule une offre réellement échue devient expirée.

La correction du compteur vivant a également été apportée en parallèle dans `b37b24fe`, puis fusionnée sur `master`. La résolution conserve cette version et ajoute la fixture de régression. La nouvelle recette sur la base enrichie a détecté une attente asynchrone restée à trois dans le test navigateur, malgré le compteur devenu dynamique : cette dernière attente est corrigée ici également.

Validation réalisée sur la base `master` avec trois offres et dans un worktree de la PR #764 au commit `1f8934020204f43f9d7520b98a073419a8091136` avec quatre offres. L’audit et le parcours navigateur du calendrier passent dans les deux contextes. Aucune offre ni date de preuve n’a été modifiée pour faire passer les contrôles.

### Les pastilles de classement ne touchent plus les noms longs

La lecture du PNG à trois actifs montrait une pastille touchant « STOXX Europe » lorsque le libellé passe sur deux lignes dans un tableau transposé. Le nouveau test navigateur reproduit l’échec avant correction dès trois actifs et quatre années.

Le rendu réserve maintenant une ligne entière au-dessus des noms pour les marqueurs. Le changement porte uniquement sur l’espacement de l’en-tête ; les valeurs, dimensions, couleurs, conventions et classements restent identiques.

Le contrôle ajouté couvre 50 dispositions, de deux à six actifs et d’une à dix années. Il mesure les rectangles des textes avec les métriques réelles de Chromium et vérifie qu’ils ne croisent aucune pastille ni le bord inférieur de l’en-tête. Il est inscrit au manifeste des contrôles navigateur de la CI.

## Couverture par outil

| Outil ou sous-outil | Vérifications effectuées | Résultat |
|---|---|---|
| Qui a vraiment gagné ? | Catégories, années/périodes, EUR/USD, actions face à ETF, portefeuilles, rééquilibrage, favoris, dates invalides, PNG et mobile ; 50 dispositions d’en-tête | Réussi après correction visuelle |
| Actifs & expositions | Composition, total 100 %, quatre modes d’image, conservation des poids, invalidation de l’ancien aperçu, téléchargement et mobile | Réussi |
| Le DCA de… | 100 profils, holdings/flux séparés, 50 positions, expositions, recouvrement, reprises réseau et 420 rendus | Réussi |
| Fiches pratiques | Sujets, chiffres, paramètres de simulation, blocages, rétablissement du texte, PNG sans rognage et mobile | Réussi |
| Radar éditorial | Filtres, état lu persistant, copie, données conservées après erreur, péremption, pouvoir d’achat et mobile | Réussi avec flux contrôlés dans la suite ; accès réel vérifié séparément |
| Simulateur de patrimoine | Saisie, comparaison, scénario, brouillon, PNG/CSV/JSON, sauvegarde, import invalide et mobile | Réussi |
| Présentations | AV, SCPI et offres des acteurs, paramètres, conservation des textes, réinitialisation, identité/conditions, anciens liens, PNG identique à l’aperçu et mobile | Réussi |
| Analyse d’entreprise | Tous les dossiers proposés, sélection, copie, images et téléchargements, recherche de données partagées et mobile | Réussi |
| Portefeuilles d’investisseurs | 28 profils, biographies/positions, poids et dates, portraits distincts, export/reprise réseau, brouillons et mobile | Réussi |
| La France en 100 ménages | 29 cartes, chiffres réels, unités statistiques, seuils et parts, absence de chevauchement, designs et mobile | Réussi |
| Données à revoir | Sources, réserves, historique, recherche, liens, filtres/calendrier, actualisation et mobile ; trois et quatre offres | Réussi après correction des attentes figées |
| Bibliothèque de données | Recherche ISIN/nom, dossier détaillé, sources, JSON, liens consommateurs, chargement différé et mobile | Réussi |
| Et si tu avais investi ? | 500 actifs en versement unique/DCA, montants, devises, périodes, prix saisi, pertes et rendus ; conventions partagées vérifiées par les audits | Réussi |
| Générateur de portefeuilles | Recettes, profils/risque, sélection manuelle, remplacement, expositions, modèles et explications, rendements, chargement et exports | Réussi |
| Duel de portefeuilles | 442 supports dans la suite, 55 duels, 1–6 lignes par côté, pondérations, années communes, conversion, gains/pertes/égalités, PNG et reprise | Réussi |
| Présentation ETF | 244 rendus, identité, caractéristiques et faits, textes, catégories, téléchargement/partage, reprise et absence de chevauchement | Réussi |
| Comparatif courtiers | Huit tableaux/tweets, sélections, données réglementaires, preuve, transfert et mobile ; nouvelle PR examinée pour le blocage CI | Réussi sur la base lue ; extensions #764 non fusionnées par cette recette |
| Fiche lexique | Choix, texte, copie, rendu et conventions de chargement | Réussi |
| Comparatif ETF | 90 comparatifs, dates, frais, pays/secteurs, politiques de composition, devises, exports et chargement | Réussi |
| Il y a X ans | 501 exports, identités, unités, niveaux et ratios, simple/comparatif, grands niveaux, reprise et mobile | Réussi |
| Performance depuis | Séries partagées, années, conventions, devises, signes et arrondis, images simples/comparatives et liens vers simulation | Réussi |
| Pouvoir d’achat | Paramètres, conventions INSEE, résultats, postes, texte et PNG | Réussi |
| Dilemme | Route historique accessible et rendu fonctionnel ; reste masqué dans la navigation | Réussi ; statut produit conservé |
| Impact des frais | Paramètres, frais ETF/enveloppe, résultats, graphiques et PNG ; conventions de simulation contrôlées | Réussi |
| Faits marquants | Choix, textes et sources, calculs partagés, copie et absence d’export annoncé à tort | Réussi |
| Banque de tweets | Filtres, recherche, validité/cooldown, édition, dates et rechargement | Réussi |
| Coulisses des indices | Choix, texte modifié, données de composition, image, téléchargement et chargement | Réussi |

Actifs & expositions et Le DCA de… sont ici deux lignes pour documenter leurs parcours distincts ; ils partagent une seule entrée de route dans les 26.

## Principaux résultats des contrôles transversaux

- Cohérence entre Générateur et Duels : 2 955 rendements comparés ; mêmes allocations et résultats pour les conventions communes.
- Recettes de portefeuilles : 413 constructions, 11 423 combinaisons exhaustives et 2 790 générations déterministes vérifiées.
- Audit des performances annuelles ETF : 244 fiches, 183 séries complètes au périmètre du script, zéro erreur. Une fiche sans série complète ne devient pas une série complète par cet audit.
- Audit de cohérence des performances : cinq différences de base explicitement documentées, zéro échec. Des rendements de marché et NAV peuvent différer légitimement.
- Catalogue : 1 352 fiches recherchables et 5 610 champs actifs avec accès de consultation au moment du contrôle.
- Exports : suites de 804 PNG de contrôle de copie/signature, 420 images DCA, 244 fiches ETF et 501 anniversaires ; contrôles supplémentaires des présentations, classements, calculateur, duels et statistiques.
- Publication : maintien des brouillons, copie de secours, erreur de copie, téléchargement correspondant à l’image affichée, menus/clavier, 60 dispositions mobiles avec clavier simulé.
- Chargement : seules les données de la sélection sont demandées ; reprise après erreur, conservation du choix et ouverture différée du catalogue/DCA vérifiées.

Les nombres sont ceux des sorties des suites de cet instantané. Ils décrivent leurs périmètres de test et ne s’additionnent pas en nombre d’actifs distincts.

## Automatisation et production

Le `build-info.json` public identifie le commit audité. La présence de ce commit sur le site est donc vérifiée, sans supposer que les PR ouvertes y sont déjà déployées.

Le flux radar réel est distinct des données intégrées au build et répond en HTTP. La première recette locale sans configuration du proxy réseau du navigateur affichait « Failed to fetch ». Le même accès à la source réussit dans Chromium une fois le proxy de l’environnement configuré. Cet incident de banc de test n’a pas été classé comme panne de production ni contourné par une modification du site.

Le parcours mobile a ensuite été vérifié sur le site public, depuis l’entrée de restauration de route : 179 signaux affichés au relevé, aucun message d’erreur, aucune requête échouée et aucune erreur JavaScript. L’écran indique un contrôle du 18 octobre à 09:01, heure de Paris. Cet effectif décrit le relevé, pas une valeur à figer dans un test.

Les chantiers #761, #762 et #763 portent sur les ajouts d’actifs, raccordements et fiabilité ; #764 porte sur les courtiers. #762 et #764 ayant été fusionnées pendant la recette, leur état a été intégré dans la branche sans remplacer leurs données. Les autres travaux connexes restent hors du périmètre des corrections propres à cette PR. Le blocage de #764 avait d’abord été reproduit et corrigé contre sa branche isolée, avant de rapprocher la correction de celle fusionnée en parallèle.

Cette recette ne répare pas automatiquement chaque incident de source présent dans le moniteur. Elle ne prouve pas non plus un futur passage de tous les collecteurs après fusion. Un échec de collecte, une donnée conservée et un déploiement refusé restent des états distincts, à suivre dans les PR de fiabilité et les prochains runs.

## Limites et livraison

Les tests de code et les rapprochements partagés ne remplacent pas une nouvelle lecture indépendante de chaque document financier externe. Les simulations restent soumises à leurs conventions ; les années incomplètes, historiques courts et couvertures partielles gardent leurs restrictions.

Le lint termine avec succès : deux avertissements préexistants sur la première base, puis trois sur la base enrichie, tous hors des fichiers modifiés. Les retouches de dates/valeurs dans les projections régénérées par le build sont exclues de cette livraison pour éviter de recouper les PR de données en cours.

Après intégration de `master`, le build et dix contrôles ciblés passent de nouveau : revue, recertification, actions internationales, courtiers, classements, cohérence Générateur/Duels, expositions, conventions de performance, années ETF et nouvelle régression des en-têtes. La base enrichie comporte 258 fiches au périmètre de l’audit, dont 196 séries annuelles complètes ; 3 806 rendements sont rapprochés entre outils. L’audit actions internationales vérifie 160 sociétés et leurs raccordements à sept outils. Les conventions de source différentes restent explicites et ne sont pas converties en égalités artificielles.

Les parcours navigateur Classements, Actifs & expositions, analyse DCA et calendrier ont été rejoués sur la version enrichie, avec des ports de test distincts des aperçus précédents. Ils passent après correction de l’attente du quatrième événement dans le calendrier. Le nouveau contrôle des en-têtes et les contrôles du partage des suites en CI passent également.

Les corrections sont fournies sur une branche de travail pour revue. Cette recette n’autorise ni ne prétend une nouvelle mise en production : aucun changement n’a été fusionné sur `master` dans le cadre de cette intervention.
