# Calendriers exacts et usages annuels — complément du 30 octobre

Base : master `2fff336538d5b54c03109790bdb1c57fca9ceddf`, après #1096. Suivi unique : rapports consolidés du 24 octobre, livraison du 29 octobre. Aucun producteur Radar, modèle de supervision, instrument financier ou observation chiffrée modifié.

## Défaut reproduit et correction

Le getter de simulation n'acceptait le calendrier automatisé que si ses six cases étaient toutes renseignées. Un calendrier exact incomplet était remplacé par l'ancienne archive ; le constructeur daté pouvait aussi compléter les années absentes à partir d'un argument de secours. La sélection effective était donc différente des données déjà collectées.

La fixture `scripts/fixtures/exact-share-annual-20261030/source-contracts.json` conserve les valeurs et preuves existantes, l'ancienne sélection et ses consommateurs. Huit instruments sont concernés par le choix de l'archive : IE00BKPX3K41, IE00BMG6Z448, IE00BMW42413, IE00BKPSFC54, DE000A27Z304, GB00BLD4ZL17, GB00BLD4ZM24 et IE00BJ5JP097. Les deux derniers ETP britanniques sont **CoinShares**, pas WisdomTree. Pour les deux fonds aux quatre dernières années déjà correctement projetées, la correction porte sur le getter historique et sa précision ; elle ne crée pas un nouvel usage.

Les moteurs conservent maintenant les trous de la série exacte et calculent sur les années complètes communes disponibles. Bitwise reste disponible en manuel et en Duel sur 2021–2025 ; CoinShares Bitcoin/Ethereum sur 2022–2025. Les trois parts iShares dont 2020 était emprunté à un indice ou à une autre part restent utilisables sur 2021–2025. Aucun cours spot ne remplit ces années absentes. Les séries natives Bitcoin/Ethereum des autres outils sont distinctes et inchangées. Les proxies explicitement admis restent distincts et conservés.

Le mode automatique continue d'exiger six années communes : aucune baisse de seuil. Ses alternatives existantes sont qualifiées **avant** la rotation de fréquence, pour qu'une alternative désormais insuffisante n'écarte pas le produit déjà admis qui possède les six années. Les profils, structures et plafonds d’allocation ne sont pas étendus. Les deux constructions « Bitcoin et ACWI IMI/Europe » utilisent le pool Bitcoin déjà admis dans les autres recettes, avec la même pondération : le produit réellement choisi reste nommé et identifié, sans compléter la série CoinShares par une autre part. Les recettes ne peuvent retenir que leurs options disposant des six années nécessaires ; les supports plus courts restent accessibles en manuel.

## Deux raccordements existants rétablis

| Part exacte | Route indépendante | Usages annuels restaurés |
| --- | --- | --- |
| FR0013412004 | ProductAPI Amundi, NAV EUR, revenus réinvestis, frais inclus | Générateur manuel et Duels : 2024 et 2025 en plus des années communes existantes |
| IE00B4K6B022 | KIID HSBC exact, NAV EUR, revenus réinvestis, frais inclus, précision émetteur 0,1 point | Générateur manuel et Duels : 2023–2025 en plus des années communes existantes |

Mêmes identifiants de sélection `manual-<ISIN>`, une seule entrée par part, aucun rôle automatique du Générateur ajouté. Les deux rôles de complément déjà présents dans les Duels générés sont préservés exactement. Qualification explicite : part/type/devise/source/méthode/fraîcheur et six années closes consécutives ; aucune qualification déduite d'un simple historique présent. Les calendriers, sources, hashes et dates ne sont pas modifiés. Les refus mensuels et la contradiction documentaire HSBC 2024 restent ouverts ; cette voie ne répare pas l'ancienne cotation.

## Course d'enregistrement SCPI

Run ordinaire `41115036012` : acquisition des huit SCPI, validation et build réussis ; enregistrement refusé après modification concurrente du seul `src/data/automated-presentation-actors.json`. Le graphe Python de l'acquisition SCPI ne lit pas ce registre. Seul ce chemin exact est admis pour une revalidation sur l'arbre combiné ; code source et registre SCPI restent protégés. Tests Git réels : conservation des deux publications, refus d'une validation échouée et refus d'entrées financières modifiées. Build, audits et vérification de non-modification des observations restent obligatoires. Ce changement ne vaut pas preuve d'un enregistrement ou d'une publication : la nouvelle exécution ordinaire est suivie séparément.

## Vérification

`test-exact-share-annual-consumers.mjs` vérifie les huit identités, les périodes, les calculs EUR des deux moteurs, l'absence de complément par un argument legacy, les notes de provenance, les proxies explicites, l'absence de modification des données sources et les deux routes annuelles. Le contrôle est branché dans le CI existant. Les tests éditoriaux vérifient tous les profils et paliers avec six générations successives : ils ne dispensent pas de vérifier les parcours et exports publiés. Les preuves de publication et les limites fournisseurs restent consignées dans le bilan consolidé.

## Publication : capacité mémoire de la recette de projections

Le build de publication41115036936/job124276190438 s'arrête dans `test-tool-projections.mjs` à la limite V8 de2048MiB, après les tests précédents réussis ; ce n'est pas une erreur fournisseur ni un résultat financier divergent. Ce test charge ensemble les données canoniques, leurs copies Vite SSR et les parcours. Le seul processus de cette recette reçoit un plafond4096MiB, inférieur à la mémoire du runner ; aucune assertion ni périmètre de validation n'est supprimé. Le succès doit être vérifié en CI avant fusion : l'allocation mémoire n'est pas une preuve de réussite. Les seuils financiers et le moteur restent inchangés.

La collecte ETF41118268319 a révélé un consommateur documentaire supplémentaire : le catalogue et son audit de revue choisissaient encore le libellé proxy dès qu'une seule des six années était absente. Leurs conditions sont alignées sur le choix de la série : un calendrier exact non vide ne devient pas un proxy parce qu'il est partiel. Les anciens instantanés restent conservés ; la recette confronte les nouvelles valeurs, dates et sources à la preuve effectivement lue, sans tolérance de date ni fermeture des incidents financiers. Régression par identité et audit de revue passent localement. Les40parcours1280/390des dix instruments concernés ont aussi vérifié les textes copiés, calculs et téléchargements ; ce sont des preuves locales, distinctes de la publication.

Recette exhaustive après qualification :418constructions,11757combinaisons et2790générations déterministes réussies, avec les mêmes minima de variété, plafonds et invariants financiers. Le test existant `test-portfolio-recipes.mjs` reste inchangé.4271rendements inter-outils et461choix manuels/données différées sont également vérifiés.
