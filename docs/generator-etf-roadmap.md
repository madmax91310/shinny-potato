# Générateur et catalogue ETF — lots du 15 octobre 2026

## Chapitre 1, étapes 1 à 5

- Mesure de la variété par profil et risque dans la session : fréquence de présence des supports et familles sectorielles, socles, compositions proches des 20 précédentes. La distance porte sur les poids des familles, pas sur les titres détenus. ACWI et All-World restent voisins pour l'antirépétition, mais distincts dans le suivi des socles.
- Dix constructions supplémentaires : Europe + Minimum Volatility, S&P 500 équipondéré + Value, aux cinq paliers généralistes. Elles complètent World, ACWI, All-World et S&P 500 déjà disponibles. Total : 234 constructions.
- Plafonds cumulés de construction dans `controls.js`, appliqués à la génération, aux variations de poids et aux remplacements. Actions, secteurs, crypto, levier, options, cumul crypto/levier/options, immobilier, haut rendement, matières premières et technologie dédiée. Ce sont des règles éditoriales de composition, pas un modèle de perte maximale. Les cinq graines qui dépassaient ces limites sont rééquilibrées avant les tirages.
- Recoupements qualitatifs : indice large et secteurs, plusieurs lignes technologiques/Nasdaq, dividendes et finance, crypto et blockchain. Aucun taux de recoupement de titres n'est inventé. Les observations détaillées restent dans le composant d'exposition existant.
- Verrouillage exact des supports et des poids. Le profil et le risque sont conservés pour ces tirages, y compris si les sélecteurs affichent Auto. La recherche utilise les seules recettes compatibles. Un échec conserve le résultat précédent et affiche un message ; aucun plafond n'est relâché. Changer profil, risque ou mode libère les lignes. Un support verrouillé ne peut pas être remplacé. Tout verrouiller peut reproduire le même portefeuille.

Le texte publié et le rendu de l'image ne changent pas de structure. Les contrôles supplémentaires sont dans les panneaux de l'outil.

## Chapitre 2, lots 1 à 4

La Bibliothèque de données propose un suivi des 35 références des quatre lots : 11 sectoriels, 12 thématiques, 8 facteurs/tailles, 4 grandes zones. Ces familles étaient largement présentes dans les collectes ; le suivi les rassemble et expose leur état sans recopier les observations ni affecter arbitrairement chaque ETF à tous les outils.

Pour chaque part : nom canonique, lien vers les données et usages existants, collecte, fiche, raccordement au générateur, années de part disponibles, observations datées d'encours/positions/pays/secteurs et sources. La qualification historique vérifie les six années communes, la base fonds, la devise et la méthode. Une série courte ou un proxy existant ne devient pas un historique de part complet.

Les références complémentaires santé DWS, nouvelles énergies Amundi, clean energy L&G et small cap value Avantis restent explicitement à compléter dans les caractéristiques communes. Les séries courtes (notamment semi-conducteurs, communication, ex-US et émergents hors Chine) sont signalées. Elles ne sont pas promues en automatique par ce lot. La prochaine étape est la sélection des actifs à raccorder à chaque outil ; l'inventaire permet de distinguer les usages déjà présents et les travaux encore nécessaires.

## Vérification

- `node scripts/test-portfolio-recipes.mjs` : options exhaustives des recettes, plafonds cumulés, six années, contraintes de profil, rotation et absence de doublon sur une session entière de 90 tirages par paire. L'historique entier reflète celui de l'interface et rend la vérification des doublons plus stricte que l'ancienne fenêtre de 40 résultats.
- `node scripts/test-generator-controls.mjs` : verrouillage pour toutes les paires, verrouillage total, échecs explicites, remplacements, cumuls de risques, recoupements et couverture des quatre lots.
- `npm run stress-test:portfolios`, build et tests navigateur en CI. Le navigateur vérifie la conservation exacte d'une ligne au tirage, la libération au changement de risque, les panneaux de contrôle et les historiques courts du catalogue.
