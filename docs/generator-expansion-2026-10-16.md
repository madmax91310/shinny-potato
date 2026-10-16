# Générateur — chapitre 1, 16 octobre 2026

## Livraison

407 constructions, soit 52 supplémentaires. Sept supports déjà collectés et présents dans le catalogue manuel entrent dans les recettes automatiques : émergents PEA filtrés, Europe PEA, dette souveraine euro 5–7 ans, immobilier européen, ressources de base européennes, haut rendement capitalisant et dette émergente en monnaie locale. Les cinq premières références perdent leur restriction manuelle ; les deux dernières étaient sélectionnables mais absentes des recettes effectives.

| Profil | Ajouts | Rôle |
| --- | ---: | --- |
| Généraliste | 16 | Émergents filtrés, Europe avec S&P 500 équipondéré, crédit et dette locale |
| Pro-Europe | 11 | Dette intermédiaire, immobilier et ressources européennes |
| Rentier | 8 | Coupons souverains en euros et immobilier coté distribuant |
| Bouclier | 6 | Minimum Volatility/dette euro et Europe/monétaire |
| Anti-inflation | 3 | Producteurs de ressources, distincts des matières premières physiques |
| Crypto-curieux | 8 | ACWI IMI ou Europe comme socle, Bitcoin et stabilisateurs |

Les plafonds et seuils historiques ne sont pas relâchés. L’immobilier européen entre aussi dans le cumul immobilier. Les parts Europe de même famille et les parts haut rendement Acc/Dist ne créent pas artificiellement de nouvelles familles. Le rentier conserve exclusivement des supports distribuants et les supports de revenus explicitement autorisés.

## Mesure de diversité

Le panneau de session affiche les constructions utilisées et les supports encore absents des tirages, par couple profil/risque. Les blocages volontaires de lignes peuvent limiter cette couverture.

L’audit reproductible compte les fréquences des recettes, actifs et familles, les actifs absents et ceux présents dans moins de 1 % des 300 tirages par couple. Il conserve désormais la session entière comme l’interface. Une comparaison avec `--baseline-ref` utilise un instantané complet des données et dépendances de la référence, pas un ancien moteur relié aux recettes nouvelles.

## Historiques courts : lot distinct prévu

Le mode automatique conserve son exigence actuelle de six années complètes ; il ne prolonge pas les historiques courts. Le lot suivant devra :

1. Proposer explicitement une fenêtre courte, séparée du mode six ans, et garder la même fenêtre pour toutes les lignes.
2. Qualifier les calendriers de chaque part, sans année de lancement partielle ni historique de prédécesseur.
3. Conserver les plafonds de construction ; ne pas présenter une pire année mesurée sur trois ans comme équivalente à celle mesurée sur six ans.
4. Afficher les années communes dans l’interface, le texte et l’image ; conserver la fenêtre lors des remplacements et verrouillages.
5. Tester années absentes, changement d’année et comparaison des mêmes allocations sur les deux fenêtres.

Cette séparation reprend le périmètre du chapitre 1 validé (« prévoir un lot distinct »). Les chapitres 3 et 5 ne sont pas inclus.

## Vérification

11 399 combinaisons exhaustives, 2 790 générations déterministes, 372 tirages verrouillés et 334 remplacements ; 9 300 simulations sans violation. Contrôles éditoriaux et cohérence de 634 rendements inter-outils réussis. Compilation et budgets réussis ; deux avertissements lint préexistants hors périmètre. Les contrôles navigateur existants couvrent la rotation de toutes les recettes généralistes, l’export PNG, le mobile et les nouveaux compteurs. Chromium local indisponible (archive de téléchargement invalide) : validation exigée en CI avant fusion.

## Résultat avant/après

Comparaison reproductible : 31 couples, trois graines, 100 tirages par graine, historique de session entier (9 300 tirages par version). Référence : `17de7ef797b1ab092778d46f7e2eb122e5b88ff3`.

- Structures distinctes moyennes par série de 100 : 17,03 → 18,59.
- Compositions proches d’une des 20 précédentes (10 points ou moins à déplacer) : 16,17 % → 15,10 %.
- Allocations distinctes moyennes : 99,95 → 100 ; aucune répétition exacte consécutive.
- La proximité consécutive passe de 0,25 % à 0,42 % : il ne s’agit pas d’un progrès universel. Certains profils contraints, notamment Crypto-curieux et Bouclier prudent, gagnent des structures mais présentent davantage de voisins dans cette mesure. Les plafonds n’ont pas été relâchés pour améliorer le score.
- Quelques alternatives restent rares sur cet échantillon ; le nouveau panneau et le rapport les exposent, sans promettre que chaque support apparaisse dans chaque session.

Fréquences détaillées et absences : `docs/generator-variety-2026-10-16.json`. L’audit ne mesure ni le chevauchement des titres ni une diversification économique garantie.
