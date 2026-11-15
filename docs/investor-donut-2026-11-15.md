# Portefeuilles d’investisseurs : déclaration → donut → exports

Travail dans `codex/investor-visual`, worktree `/workspace/investor-visual`, base initiale `82094b8`. PR #1330. Les chantiers Budget #1323/#1327, DCA #1298/#1324 et portefeuilles publics #1326 ont été examinés ; aucune nouvelle application ni deuxième collecte de portefeuilles n’a été créée.

## Production et périmètre

Le collecteur `update-investor-13f.py` découvre toujours les déclarations dans FolioFact et son secours Tracefour pour Ackman. Il conserve maintenant les valeurs natives, dont l’unité USD entière est documentée par [PortfolioRow.value](https://foliofact.com/openapi.yaml), puis récupère les documents XML de la déclaration SEC liée. Le déclarant et son CIK viennent de la couverture SEC, les titres de la table officielle. Depuis le changement de formulaire de 2023, la convention est le dollar entier ([instructions SEC](https://www.sec.gov/files/form13f.pdf)) ; une ancienne déclaration n’est pas convertie par supposition.

Les lignes sont identifiées par CUSIP, classe et type direct/PUT/CALL. Seules plusieurs sous-lignes de cette identité exacte peuvent être additionnées, avec conservation de chaque ligne source. Aucun regroupement de classes Alphabet/Berkshire ni rapprochement approximatif de noms. Le total de la couverture est conservé séparément de la somme des lignes ; un petit écart compatible avec l’arrondi au dollar est tracé. Un conflit substantiel avec le fournisseur bloque l’actualisation de cet investisseur. Aucune multiplication par 1 000 n’est déduite de la seule différence.

Le visuel principal 1080 × 1350 porte sur les positions longues déclarées, hors options, à leur date de photographie. Son total ne représente ni le patrimoine ni tous les actifs gérés. Les options et leur dénominateur source restent consultables dans l’application et les exports. Les modèles théoriques de l’autre groupe du sélecteur ne sont pas des déclarations monétaires : ils conservent leur rendu dédié.

## Composition et texte

Un plan partagé produit la sélection du PNG et du texte. Les secteurs utilisent les valeurs non arrondies divisées par la somme admissible. Les cartouches occupent des colonnes de largeur connue ; leurs hauteurs dépendent des noms, à taille lisible fixe. Les orientations candidates couvrent les changements possibles de côté des secteurs, puis une résolution verticale évite les collisions. Le nombre affichable résulte de l’espace disponible, sans limiter le portefeuille complet. « Autres » additionne exactement toutes les valeurs restantes. Les noms courts conservent une distinction des titres homonymes ; les noms complets et classes restent dans le détail.

Les logos ont un emplacement extérieur large pour rendre les marques longues lisibles. Des logos compacts peuvent aussi apparaître dans les secteurs suffisamment grands. Les pourcentages sont toujours dans les cartouches, hors du portrait. Les poids positifs inférieurs à 0,1 % affichent « < 0,1 % ». Aucun secteur minimal artificiel.

Le texte commence par « Portefeuille de [nom] : », précise la date et le périmètre, trie les lignes par poids, utilise les mêmes montants et le même regroupement que le PNG et finit par un seul CTA. La biographie reste un contexte modifiable dans l’application ; elle n’allonge plus automatiquement le post. Aucun hashtag, rendement non vérifié ou publication X.

## Médias et réessais

Les logos et leurs preuves sont réutilisés depuis les registres existants. La résolution utilise les alias exacts revus ou le CUSIP contenu dans un ISIN US/CA déjà identifié ; un ticker ambigu ne suffit pas. Les fichiers locaux et le cache d’images évitent les téléchargements distants récurrents. Absence ou chargement impossible : initiales/symbole, sans blocage du portefeuille.

Les six portraits réutilisables du catalogue sont détourés par `refresh-investor-media.py` avec u2netp. Le digest de la photo et de sa provenance détermine un fichier PNG réutilisable ; pas de nouveau détourage si le fichier existe. Les sources, auteurs, licences et transformations restent dans le manifeste. Les crédits requis figurent dans les PNG et les exports. Les personnes doivent être associées au déclarant par la collecte ; Berkshire, Gates Trust, Renaissance et Baker Bros restent des entités, sans portrait de leur fondateur. Les autres photos sans licence documentée, les erreurs et les masques impropres utilisent les initiales. Aucune personne ressemblante n’est générée.

Une substitution facultative passe par le registre de sources existant `public/asset-art/investors/sources.json` et sa photo locale, en conservant identité, source, auteur et licence ; le prochain passage régénère le digest et le détourage. Cette opération n’est pas requise à chaque déclaration. Le traitement est ajouté au workflow existant, avec l’installateur et les contraintes Python du dépôt.

Le contrôle quotidien et la photographie trimestrielle restent distincts. Le collecteur conserve la dernière version et les dates réussies sur échec ; la tentative et son erreur sont exposées dans les métadonnées. Les ETag permettent les revalidations conditionnelles. La file d’écriture programmée est conservée ; les validations de PR en lecture seule disposent de leur propre file. Aucun workflow existant n’a été arrêté. Le bouton d’actualisation de l’application recharge les données publiées ; il ne prétend pas déclencher une collecte SEC depuis le navigateur.

Les erreurs de chargement et de génération restent visibles sur mobile. Le PNG peut être réessayé. Le JSON contient les positions et preuves, le CSV les valeurs et dénominateurs, le ZIP les PNG détaillés et ces deux fichiers. Les noms longs continuent sur les pages détaillées, à taille fixe. Les exports détaillés d’un relevé non qualifié portent explicitement « DONNÉES INCOMPLÈTES » dans chaque PNG et une qualification dans le CSV ; le JSON conserve aussi le problème et la dernière erreur.

## Preuves locales du 15 novembre

- Collecte réelle : **25 déclarations SEC qualifiées / 28**, [rapport](../reports/investor-donut-2026-11-15/collection.json).
- **3 refus conservant les fichiers précédents** : Druckenmiller, SEC 5 210 856 USD contre fournisseur 5 210 856 000 USD ; Klarman, 5 045 853 contre 5 045 853 000 ; Fundsmith, 13 648 923 682 contre 18 167 841 425. Le PNG principal reste bloqué pour ces sources. Les collectes futures réessaient ; ces conflits ne sont pas présentés comme réparés.
- Validation indépendante `validate-investor-publication.py` : 25 succès, 3 fichiers en échec conservés, dates de contrôle et d’acquisition vérifiées.
- `check-investor-values.py` : sommes en Decimal, sous-lignes, identités, poids et « Autres » contrôlés sans le moteur Canvas ; [résultat](../reports/investor-donut-2026-11-15/financial-check.json).
- 41 tests Python de collecte/publication ; 20 contrats de workflows ; cas financiers purs 1/2/4/300/1 501 lignes, noms longs, classes, unités et poids < 0,1 %.
- 29 PNG contrôlés dans Chromium : 25 réels et 4 cas synthétiques ; dimensions, bornes, collisions de textes et cohérence du post. Les trois sources incomplètes refusent le PNG.
- Téléchargements réels à 1440/390, PNG identique à l’aperçu, presse-papiers, JSON et ZIP, fichier ZIP vérifié avec `zipfile`/Pillow ; panne réseau, dernier relevé conservé, génération en échec puis réessai, portrait et logo bloqués puis logo rechargé.
- Export intégral réel de Renaissance depuis l’interface à 390 px : **3 151 positions JSON/CSV et 485 PNG**, archive CRC et dimensions vérifiés en environ 15–17 secondes. Chaque canevas est libéré avant la page suivante ; l’archive volumineuse reste un export facultatif, les JSON/CSV restent disponibles séparément.
- Détourage de Tepper régénéré à partir de la photo source avec les contraintes Python communes ; alpha RGBA contrôlé. Deuxième passage du cache sans nouveau fichier.

Exemples réels : [Tepper](../reports/investor-donut-2026-11-15/tepper.png), [Berkshire](../reports/investor-donut-2026-11-15/berkshire.png), [Renaissance](../reports/investor-donut-2026-11-15/renaissance.png), [Ackman](../reports/investor-donut-2026-11-15/ackman.png).

Cas synthétiques de recette uniquement : [petite position](../reports/investor-donut-2026-11-15/petite.png), [noms longs](../reports/investor-donut-2026-11-15/longs.png), [300 lignes](../reports/investor-donut-2026-11-15/dense.png), [parcours mobile](../reports/investor-donut-2026-11-15/mobile-image-390.png). Ces valeurs ne sont pas ajoutées au catalogue des investisseurs.

Compilation intégrée à master `2ecf1e9` réussie : budget de la route respecté avec chargement du moteur Canvas à la demande ; manifeste de 54 fichiers publics vérifié. Le parcours construit des 28 investisseurs passe aussi. Le workflow GitHub 43736936326 a indépendamment acquis et qualifié 25 déclarations, avec conservation des 3 refus (rapport contrôlé à 17:03:27 UTC). Les contrôles de publication, le déploiement et le parcours public final seront consignés à la clôture ; cette collecte ne prouve pas seule la livraison publique.
