# Analyse d’entreprise

Route `/analyse-entreprise`, format ponctuel, cinq entreprises américaines : Apple, Microsoft, Nvidia, Alphabet et Amazon.

## Ce qui est automatique

Le workflow `update-company-analysis.yml` s’exécute chaque jour à 06:35 UTC. Après fusion, il collecte et remplace les observations valides, vérifie le texte et le build, pousse les données puis appelle le déploiement Pages. Les pushs du bot ne déclenchant pas les workflows ordinaires, cet appel explicite est nécessaire.

- Comptes annuels et dernier trimestre disponible : API officielle SEC `companyfacts`, sans clé. Les semestres et cumuls depuis le début de l’année ne sont pas présentés comme un trimestre. L’exercice est identifié par ses dates exactes, y compris pour les entreprises dont l’exercice est décalé. Comparaisons sur un an, avec les chiffres retraités des dépôts récents. Q4 n’est pas reconstruit à partir de l’exercice : après un nouveau rapport annuel, l’exercice est affiché et les trimestres antérieurs sont omis.
- Chiffre d’affaires, bénéfice ou perte, marge nette, flux de trésorerie disponible annuel lorsque les deux composantes sont disponibles sur la même période.
- Cours de clôture : adaptateur Yahoo chart, comme les historiques déjà présents dans le dépôt. Il exclut systématiquement la séance du jour local, évitant de présenter un cours intraday comme une clôture. Cette source peut échouer ou limiter les accès ; la précédente observation est conservée.
- Ratios optionnels : Alpha Vantage `OVERVIEW`, cinq appels par jour. Ajouter une clé dans le secret GitHub **ALPHAVANTAGE_API_KEY**. L’absence de clé ne bloque pas les comptes et les cours, mais aucun PER n’est alors inventé. Vérifier les droits de diffusion publique applicables au compte fournisseur avant activation. Le plan gratuit ne garantit ni tous les symboles, ni tous les champs.

Le PER fourni porte sur les douze derniers mois, distincts de l’exercice annuel affiché. Le PER prévisionnel est celui du fournisseur : son horizon n’étant pas précisé dans la réponse, cela est explicite dans le texte et le visuel. Il n’est jamais présenté comme le PER de l’exercice suivant et n’entraîne aucune phrase prédictive sur les bénéfices.

## Cohérence éditoriale

Les phrases sont produites à partir des valeurs brutes actuelles, sans accroche chiffrée figée. Les variations du chiffre d’affaires et du résultat sont recalculées lors de la génération. Une perte réduite, une perte accrue, un retour au bénéfice et le passage en perte ont des formulations spécifiques ; pas de pourcentage de croissance calculé depuis une base négative. Une base comparative absente reste absente. Aucun seuil de PER ne déclenche une affirmation « bon marché » ou « sous-évaluée ».

La description de l’activité et les points à suivre sont éditoriaux et ne sont pas réécrits par la collecte. Ils décrivent l’activité et des questions à examiner, sans présumer une croissance positive ou une rentabilité actuelle.

## Fraîcheur et erreurs

Chaque bloc garde sa période, sa source et sa date de collecte. Un échec conserve indépendamment le bloc précédent et apparaît dans l’artifact d’observation ; un job final signale la collecte partielle après publication des changements valides. Aucun message d’erreur de fournisseur ne peut devenir une donnée financière. La clé API et son URL d’appel ne sont jamais enregistrées ou affichées.

Le texte bloque si les comptes annuels dépassent 550 jours ou n’ont pas été vérifiés depuis 45 jours. Les cours de plus de 10 jours et les ratios relevés il y a plus de 7 jours sont omis. Les estimations fondées sur des comptes antérieurs au dernier résultat SEC affiché sont également omises. Le périmètre initial est volontairement celui des émetteurs américains avec comptes US GAAP en USD ; une autre devise ou un autre émetteur doit avoir son propre adaptateur.

Registres communs `src/data/company-profiles.json` et `src/data/company-analysis.json`, réunis dans `companies.js`. La bibliothèque de données permet de rechercher l’entreprise par nom, ticker ou CIK et d’exporter ses sources/périodes.

Validation : tests Python de collecte et de périodes, tests JavaScript de cohérence des phrases et d’omission des données périmées, build, audit des bundles et navigateur réel : choix des cinq entreprises, copie, aperçu image, téléchargement PNG, interface mobile et recherche dans la bibliothèque. Une première collecte réelle des cinq entreprises a réussi le 7 octobre 2026, sans clé Alpha Vantage. Les deux PER restent donc à activer avec une clé ; leur accès réel n’est pas validé par cette collecte.
