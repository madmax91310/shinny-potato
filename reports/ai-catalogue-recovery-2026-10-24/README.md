# Reprise d’une compétition à grand univers

Instantané lu sur master `3f729f9b2381a46c1c62dd14ce082b0b0f09b821`, le 24 octobre 2026. Aucun changement du livre propriétaire.

## Cause démontrée

Le livre contient une compétition avant lancement, sans décision, avec 18 468 identifiants. Ils sont **tous** présents dans le catalogue public complet (24 975 identifiants). L’overview initial ne contient qu’une identité de référence. Le reçu d’enregistrement et l’actualisation remplaçaient le catalogue déjà chargé par cet overview. L’effet dépendant de `[request, market]` reconstruisait ensuite la sélection binaire contre cette identité unique et levait « Univers absent du catalogue complet ». Ce n’était pas une sélection invalide.

Les demandes #909 et #910 contiennent la même création à révision 0 : elles ont conduit au même commit durable, sans seconde compétition. #911 contient une autre création, également préparée à révision 0 ; le traitement l’a refusée après le passage du livre à révision 1. Les trois charges envoyées contenaient déjà « À renseigner » pour les modèles. Elles ne contiennent pas « Gratuit ». Le collecteur ne les a donc pas remplacés. Les fichiers publics ne permettent pas de reconstituer les saisies locales ni l’ordre exact des gestes sur le téléphone ; aucune valeur n’a été choisie ou restaurée au nom du propriétaire.

## Correction

- Le référentiel canonique de transport est séparé des identités archivées affichables. Aucun identifiant sélectionné n’est supprimé.
- L’action de préparation charge le catalogue complet si nécessaire. Dates, révision, nombre et empreinte de publication sont vérifiés ; les anciennes publications sans empreinte restent lisibles.
- Un refresh ou reçu conserve le catalogue complet uniquement si sa publication est compatible. Une autre publication impose un nouveau chargement.
- Le lien est préparé pour un instantané de demande, pas régénéré à chaque hydratation des cours. Modifier un champ invalide la confirmation. Une préparation restaurée périmée ou différente du formulaire ne peut pas être confirmée.
- Les modèles/configurations sont protégés dans les brouillons par compétition ; une révision distante plus récente conserve les saisies et affiche un conflit à comparer.
- Un ancien brouillon de création déjà présent dans l’audit est restauré sur la compétition existante, en suivi de reçu. Une reprise explicite avec les saisies locales est également proposée pour un brouillon sans rattachement.
- L’écran indique configuration locale à enregistrer, allocations reçues/manquantes et lancement distinct. Un identifiant réellement absent donne son identifiant et une action de vérification, sans filtrage automatique.
- Aucun changement de règles financières, d’univers enregistré, d’allocations ou de modèles du livre réel. Aucun lancement réel.

## Vérification

`npm run build`, `npm run test:ai-portfolios`, `node scripts/playwright-ai-portfolios.mjs`, `node scripts/playwright-ai-owner.mjs`, `node scripts/playwright-ai-catalogue-recovery.mjs`.

La recette ciblée copie le livre et le catalogue actuels dans un dossier temporaire et utilise des prix/calendriers déterministes, identifiés comme tels. Sur desktop 1440 × 1000 et mobile tactile 390 × 844 : ouverture légère, reprise de la compétition existante, modification des modèles de test, chargement automatique, refresh après préparation, invalidation du lien après édition, restauration, publications incompatibles, identifiant manquant, confirmation simulée avec Create, expansion par le décodeur de confiance, persistance isolée, reçu, conservation exacte des 18 468 identifiants, import des trois réponses, lancement isolé et suivi après exécution. Le livre de production est comparé octet pour octet avant/après.

Les recettes réutilisées couvrent la comptabilité, les devises, les frais, la semaine suivante, la reprise sans doublon, le contrôle propriétaire, les conflits et les six vrais téléchargements PNG. L’authentification et le bouton Create GitHub de la recette sont simulés ; cela ne constitue pas un clic authentifié sur GitHub réel. Les accès réels sont les lectures du dépôt, des demandes et du site publié.

Les nouveaux contrôles sont exécutés dans la CI IA. Les preuves JSON et captures de la recette sont archivées dans le rapport et/ou l’artifact CI.

## Reprendre depuis le téléphone

1. Ouvrir Portefeuilles IA, sélectionner **Portefeuilles IA · avant lancement**, puis actualiser le livre distant. Ne pas choisir Nouvelle compétition.
2. Restaurer le brouillon si proposé ; si nécessaire choisir **Reprendre Portefeuilles IA existante avec ces saisies**. Vérifier les modèles et règles : le dépôt ne connaît actuellement que les modèles « À renseigner ».
3. Dans Configuration et catalogue, corriger les champs selon ses propres choix, puis **Préparer la modification**. Le catalogue complet est chargé par cette action.
4. Vérifier l’aperçu, **Confirmer sur GitHub**, puis **Create** avec le compte propriétaire. Revenir et **Vérifier l’enregistrement** jusqu’au reçu durable. Un refus de révision impose une actualisation et une nouvelle préparation conservant les saisies.
5. Dans Décisions, générer les dossiers, saisir/importer les allocations puis confirmer chaque enregistrement de la même façon. L’application indique les réponses manquantes.
6. Le lancement est une action séparée, disponible après les réponses initiales et les contrôles des cours et changes. Cette correction ne l’effectue pas.
